/**
 * ============================================================
 *  Обновление статуса Steam → steam-status.json
 * ============================================================
 *
 *  Запуск:  node scripts/fetch-steam.mjs
 *
 *  Скрипт скачивает профиль Steam и сохраняет:
 *    - src/data/steamProfile.json — полные данные (аватар, игры и т.д.)
 *    - steam-status.json — маленький файл со статусом, который
 *      сайт читает напрямую с GitHub (браузеру не мешает CORS)
 *
 *  GitHub Actions запускает его каждые 5 минут и публикует
 *  steam-status.json в ветку status — сайт берёт его оттуда.
 * ============================================================
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const STEAM_ID = process.argv[2] || '76561199870670958';
const OUT = fileURLToPath(new URL('../src/data/steamProfile.json', import.meta.url));
const OUT_STATUS = fileURLToPath(new URL('../steam-status.json', import.meta.url));

const url = `https://steamcommunity.com/profiles/${STEAM_ID}/?xml=1`;
const res = await fetch(url, {
  headers: { 'user-agent': 'Mozilla/5.0 (compatible; mybio-site/1.0)' },
});
if (!res.ok) {
  console.error(`Steam ответил ${res.status}`);
  process.exit(1);
}
const xml = await res.text();

const read = (tag) => {
  const m = xml.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`));
  return m ? m[1].trim() : '';
};
const readAll = (tag) =>
  [...xml.matchAll(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`, 'g'))].map((m) =>
    m[1].trim()
  );

/** Игры: иконка, обложка, часы */
function readGames() {
  const block = xml.match(/<mostPlayedGames>([\s\S]*?)<\/mostPlayedGames>/)?.[1] || '';
  const games = [];
  for (const g of block.split('<mostPlayedGame>').slice(1)) {
    const pick = (tag) =>
      g.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`))?.[1]?.trim() || '';
    const link = pick('gameLink');
    games.push({
      name: pick('gameName'),
      appId: (link.match(/app\/(\d+)/) || [])[1] || '',
      icon: normalize(pick('gameIcon')),
      logo: normalize(pick('gameLogo')),
      hours2wk: Number(pick('hoursPlayed')) || 0,
      hoursTotal: Number(pick('hoursOnRecord')) || 0,
    });
  }
  return games.slice(0, 6);
}

/**
 * Самостоятельно ищем лучшую обложку игры:
 * сначала вертикальная (600×900, как обложки в библиотеке Steam),
 * потом горизонтальная, потом логотип, и в конце — иконка из профиля.
 */
async function pickCover(appId, fallback) {
  if (!appId) return fallback;
  const candidates = [
    `https://media.steampowered.com/steam/apps/${appId}/library_600x900.jpg`,
    `https://media.steampowered.com/steam/apps/${appId}/library_600x900_2x.jpg`,
    `https://media.steampowered.com/steam/apps/${appId}/library_hero.jpg`,
    `https://media.steampowered.com/steam/apps/${appId}/header.jpg`,
    `https://media.steampowered.com/steam/apps/${appId}/capsule_184x69.jpg`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: 'HEAD', headers: { 'user-agent': 'Mozilla/5.0' } });
      if (res.ok) return url;
    } catch {
      /* пробуем следующий вариант */
    }
  }
  return fallback;
}

/** Сколько ачивок выполнено (видно, только если статистика игры открыта) */
async function fetchAchievements(userId, appId) {
  if (!appId) return { achieved: 0, total: 0 };
  try {
    const res = await fetch(
      `https://steamcommunity.com/profiles/${userId}/stats/${appId}?xml=1`,
      { headers: { 'user-agent': 'Mozilla/5.0 (compatible; mybio-site/1.0)' } }
    );
    if (!res.ok) return { achieved: 0, total: 0 };
    const text = await res.text();
    if (!text || text.length < 40) return { achieved: 0, total: 0 };
    const num = (tag) =>
      Number(text.match(new RegExp(`<${tag}>(.*?)</${tag}>`))?.[1]) || 0;
    const total = num('globalAchievementCount');
    const achieved = num('achievementCount');
    return { achieved, total };
  } catch {
    return { achieved: 0, total: 0 };
  }
}

// akamai-хост Steam периодически недоступен — всегда используем fastly
const normalize = (url) =>
  url
    .replace('shared.akamai.steamstatic.com', 'shared.fastly.steamstatic.com')
    .replace('avatars.akamai.steamstatic.com', 'avatars.fastly.steamstatic.com');

const avatarFull = normalize(read('avatarFull'));
const hash = (avatarFull.match(/([a-f0-9]{40})(?:_full)?\.jpg/) || [])[1] || '';

const games = readGames();
for (const game of games) {
  game.cover = await pickCover(game.appId, game.icon || game.logo);
  game.achievements = await fetchAchievements(STEAM_ID, game.appId);
}

const profile = {
  id64: read('steamID64') || STEAM_ID,
  vanity: read('customURL') || read('steamID'),
  name: read('customURL') || read('steamID'),
  realname: read('realname'),
  location: read('location'),
  memberSince: read('memberSince'),
  onlineState: read('onlineState') || 'offline',
  stateMessage: read('stateMessage') || 'Offline',
  avatarIcon: normalize(read('avatarIcon')),
  avatarMedium: normalize(read('avatarMedium')),
  avatarFull,
  groupName: '',
  games,
  updatedAt: new Date().toISOString(),
};

if (!hash) {
  console.error('Не удалось получить аватар из XML — данные не обновлены');
  process.exit(1);
}

await writeFile(OUT, `${JSON.stringify(profile, null, 2)}\n`, 'utf8');

// Маленький файл со статусом — его сайт читает напрямую
const status = {
  online: profile.onlineState === 'online',
  state: profile.onlineState,
  name: profile.name,
  avatar: profile.avatarFull,
  updatedAt: profile.updatedAt,
};
await writeFile(OUT_STATUS, `${JSON.stringify(status, null, 2)}\n`, 'utf8');

console.log('Профиль обновлён:', profile.name, '|', profile.onlineState);
console.log('Статус записан:', OUT_STATUS);
