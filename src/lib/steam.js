import { site } from '../config/site';
import steamData from '../data/steamProfile.json';

/**
 * ============================================================
 *  Steam — получение реальных данных профиля
 * ============================================================
 *
 *  Источники данных (по приоритету):
 *  1. src/data/steamProfile.json — обновляется автоматически через
 *     GitHub Actions (scripts/fetch-steam.mjs). Работает всегда.
 *  2. Live-запрос через CORS-прокси — если прокси доступен, статус
 *     и аватар обновляются в браузере (может не сработать — Steam
 *     блокирует дата-центры, поэтому есть кэш и fallback).
 *
 *  Ошибок в консоли не возникает: при недоступности используются
 *  данные из JSON / конфига.
 * ============================================================
 */

const CACHE_KEY = 'mybio:steam-profile';
const CACHE_TTL = 60 * 1000; // минута — статус проверяется при каждом заходе

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

  // Голый SteamID (STEAM_0:1:12345678) → SteamID64
  const legacy = value.match(/^STEAM_(\d+):(\d+):(\d+)$/i);
  if (legacy) {
    const [, universe, account, instance] = legacy.map(Number);
    const base = 76561197960265728n;
    const id64 = (base + BigInt(account) * 2n + BigInt(instance)).toString();
    return { id64, vanity: null };
  }

  return null;
}

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

  // akamai-хост Steam бывает недоступен — всегда используем fastly
  const fixAvatar = (url) =>
    url.replace('avatars.akamai.steamstatic.com', 'avatars.fastly.steamstatic.com');

  return {
    id64: read('steamID64'),
    vanity: read('customURL') || read('steamID'),
    onlineState: read('onlineState'),
    stateMessage: read('stateMessage'),
    privacyState: read('privacyState'),
    avatarIcon: fixAvatar(read('avatarIcon')),
    avatarMedium: fixAvatar(read('avatarMedium')),
    avatarFull: fixAvatar(read('avatarFull')),
    memberSince: read('memberSince'),
    realname: read('realname'),
    headline: read('headline'),
    location: read('location'),
    summary: read('summary'),
    groupName: groups[0] || '',
    games: games.slice(0, 6),
  };
}

/**
 * Базовый профиль: JSON-данные (обновляются CI) + ручные fallback-значения
 * из src/config/site.js. Никаких сетевых запросов.
 */
export function staticSteamProfile() {
  const cfg = site.steam;
  const parsed = parseSteamId(cfg.id);
  const id64 = parsed?.id64 || steamData.id64 || '';
  const vanity = parsed?.vanity || steamData.vanity || '';

  return {
    id64,
    vanity,
    name: steamData.name || cfg.fallbackName || vanity || id64,
    realname: steamData.realname || cfg.fallbackRealname || '',
    location: steamData.location || cfg.fallbackLocation || '',
    memberSince: steamData.memberSince || cfg.fallbackSince || '',
    onlineState: steamData.onlineState || cfg.onlineState || 'offline',
    stateMessage: steamData.stateMessage || 'Offline',
    avatarIcon: steamData.avatarIcon?.replace(
      'avatars.akamai.steamstatic.com',
      'avatars.fastly.steamstatic.com'
    ) || cfg.fallbackAvatar || '',
    avatarMedium: steamData.avatarMedium?.replace(
      'avatars.akamai.steamstatic.com',
      'avatars.fastly.steamstatic.com'
    ) || cfg.fallbackAvatar || '',
    avatarFull: steamData.avatarFull?.replace(
      'avatars.akamai.steamstatic.com',
      'avatars.fastly.steamstatic.com'
    ) || cfg.fallbackAvatar || '',
    groupName: steamData.groupName || '',
    games: steamData.games?.length ? steamData.games : cfg.games || [],
    profileUrl: `https://steamcommunity.com/profiles/${id64}`,
    updatedAt: steamData.updatedAt || null,
  };
}

/* ── Live-обновление через публичные CORS-прокси (best effort) ── */

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
    build: (u) => `https://whateverorigin.org/get?url=${encodeURIComponent(u)}`,
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
    /* приватный режим — игнорируем */
  }
}

/**
 * Пытается обновить данные Steam в браузере.
 * Никогда не бросает ошибку — при неудаче возвращает null.
 */
export async function loadSteamProfile() {
  const cached = readCache();
  if (cached) return cached;
  const parsed = parseSteamId(site.steam.id);
  const id64 = parsed?.id64 || steamData.id64;
  const vanity = parsed?.vanity;
  if (!id64 && !vanity) return null;

  const target = `https://steamcommunity.com/${id64 ? `profiles/${id64}` : `id/${vanity}`}/?xml=1`;

  for (const proxy of PROXIES) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(proxy.build(target), { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) continue;

      const text = await res.text();
      const xml = proxy.transform(text);
      if (!xml || xml.length < 60 || !xml.includes('steamID64')) continue;

      const data = parseSteamXml(xml);
      if (!data || !data.id64) continue;

      data.name = data.vanity || data.id64;
      data.profileUrl = `https://steamcommunity.com/profiles/${data.id64}`;
      writeCache(data);
      return data;
    } catch {
      /* пробуем следующий прокси */
    }
  }
  return null;
}

/**
 * Статус из файла steam-status.json, который GitHub Actions обновляет
 * каждые 5 минут и публикует в ветку status. Файл читается напрямую
 * с GitHub (там разрешён CORS), поэтому браузер всегда получает
 * свежий online/offline без всяких прокси.
 */
export async function loadSteamStatus() {
  const url =
    'https://raw.githubusercontent.com/kroniksdwdwd/mybio/status/steam-status.json' +
    `?t=${Date.now()}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.state) return null;
    return data;
  } catch {
    return null;
  }
}
