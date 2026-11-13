import { site } from '../config/site';

/**
 * ============================================================
 *  Steam — получение реальных данных профиля
 * ============================================================
 *  Steam не отдаёт CORS-заголовки, поэтому запрос идёт через
 *  публичные CORS-прокси. Если ни один не ответил — используются
 *  значения из src/config/site.js (fallback), ошибок в консоли нет.
 * ============================================================
 */

const CACHE_KEY = 'mybio:steam-profile';
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

/** Нормализует то, что вписал пользователь: ID, ссылку на профиль или vanity-url. */
export function parseSteamId(input) {
  if (!input) return null;
  const value = String(input).trim();

  // https://steamcommunity.com/profiles/76561198000000000
  const profiles = value.match(/profiles\/(\d{17})/);
  if (profiles) return { id64: profiles[1], vanity: null };

  // https://steamcommunity.com/id/hilkach
  const vanityUrl = value.match(/\/id\/([A-Za-z0-9_.-]+)/);
  if (vanityUrl) return { id64: null, vanity: vanityUrl[1] };

  // https://steamcommunity.com/hilkach
  const plain = value.match(/steamcommunity\.com\/([A-Za-z0-9_.-]+)/);
  if (plain && !['profiles', 'id', 'groups', 'games'].includes(plain[1])) {
    return { id64: null, vanity: plain[1] };
  }

  // Голый SteamID64
  if (/^\d{17}$/.test(value)) return { id64: value, vanity: null };

  // Голый SteamID (STEAM_0:1:12345678) — конвертируем в SteamID64
  const legacy = value.match(/^STEAM_(\d+):(\d+):(\d+)$/i);
  if (legacy) {
    const [, universe, account, instance] = legacy.map(Number);
    const base = 76561197960265728n;
    const id64 = (base + BigInt(account) * 2n + BigInt(instance)).toString();
    return { id64, vanity: null };
  }

  return null;
}

function buildSteamUrls({ id64, vanity }) {
  const profilePath = id64 ? `/profiles/${id64}` : `/id/${vanity}`;
  const target = `https://steamcommunity.com${profilePath}/?xml=1`;
  return { target, profilePath };
}

/** Прокси: [шаблон, разбор ответа] */
const PROXIES = [
  {
    name: 'cors.lol',
    build: (u) => `https://api.cors.lol/?url=${encodeURIComponent(u)}`,
    transform: (text) => text,
  },
  {
    name: 'allorigins',
    build: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    transform: (text) => text,
  },
  {
    name: 'whateverorigin',
    build: (u) => `https://www.whateverorigin.org/get?url=${encodeURIComponent(u)}`,
    transform: (text) => {
      try {
        const json = JSON.parse(text);
        return json.contents || json.response || '';
      } catch {
        return text;
      }
    },
  },
];

/** Разбор XML-ответа Steam в объект. */
export function parseSteamXml(xml) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  if (doc.querySelector('parsererror')) return null;

  const read = (tag) => {
    const node = doc.querySelector(tag);
    return node ? node.textContent.trim() : '';
  };

  const groups = Array.from(doc.querySelectorAll('groupName')).map((n) => n.textContent.trim());
  const games = Array.from(doc.querySelectorAll('mostPlayedGame gameName')).map((n) =>
    n.textContent.trim()
  );

  return {
    id64: read('steamID64'),
    vanity: read('customURL') || read('steamID'),
    onlineState: read('onlineState'),
    stateMessage: read('stateMessage'),
    privacyState: read('privacyState'),
    avatarIcon: read('avatarIcon'),
    avatarMedium: read('avatarMedium'),
    avatarFull: read('avatarFull'),
    memberSince: read('memberSince'),
    realname: read('realname'),
    headline: read('headline'),
    location: read('location'),
    summary: read('summary'),
    groupName: groups[0] || '',
    games: games.slice(0, 6),
  };
}

/** Статический профиль из конфига (используется до загрузки и при ошибке). */
export function staticSteamProfile() {
  const { id, fallbackName, fallbackAvatar, fallbackRealname, fallbackLocation, fallbackSince } =
    site.steam;
  const parsed = parseSteamId(id);
  return {
    id64: parsed?.id64 || '',
    vanity: parsed?.vanity || '',
    onlineState: site.steam.onlineState || 'offline',
    stateMessage: site.steam.onlineState === 'online' ? 'Online' : 'Offline',
    avatarIcon: fallbackAvatar || '',
    avatarMedium: fallbackAvatar || '',
    avatarFull: fallbackAvatar || '',
    memberSince: fallbackSince || '',
    realname: fallbackRealname || '',
    headline: '',
    location: fallbackLocation || '',
    groupName: '',
    games: site.steam.games || [],
    name: fallbackName || '',
    static: true,
  };
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    /* приватный режим — просто игнорируем */
  }
}

/**
 * Загружает реальные данные Steam-профиля.
 * Никогда не бросает ошибку — при неудаче возвращает null.
 */
export async function loadSteamProfile() {
  const cached = readCache();
  if (cached) return cached;

  const parsed = parseSteamId(site.steam.id);
  if (!parsed) return null;

  const { target, profilePath } = buildSteamUrls(parsed);

  for (const proxy of PROXIES) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(proxy.build(target), { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) continue;

      const text = await res.text();
      const xml = proxy.transform(text);
      if (!xml || xml.length < 40) continue;

      const data = parseSteamXml(xml);
      if (!data) continue;

      data.profilePath = profilePath;
      data.profileUrl = `https://steamcommunity.com${profilePath}`;
      writeCache(data);
      return data;
    } catch {
      /* пробуем следующий прокси */
    }
  }
  return null;
}
