/**
 * Обновление данных Steam-профиля → src/data/steamProfile.json
 *
 * Запуск вручную:
 *   node scripts/fetch-steam.mjs
 *
 * Запуск в CI (GitHub Actions, update-steam.yml):
 *   node scripts/fetch-steam.mjs && git commit -am "chore: update steam profile data"
 *
 * GitHub-раннеры не ограничены CORS, поэтому скрипт тянет XML напрямую
 * с steamcommunity.com и складывает результат в репозиторий.
 * Сайт использует этот JSON как основной источник данных.
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const STEAM_ID = process.argv[2] || '76561199870670958';
const OUT = fileURLToPath(new URL('../src/data/steamProfile.json', import.meta.url));

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
// akamai-хост Steam периодически недоступен — всегда используем fastly
const normalize = (url) => url.replace('avatars.akamai.steamstatic.com', 'avatars.fastly.steamstatic.com');
const readAll = (tag) =>
  [...xml.matchAll(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`, 'g'))].map((m) =>
    m[1].trim()
  );

const avatarFull = normalize(read('avatarFull'));
const hash = (avatarFull.match(/([a-f0-9]{40})(?:_full)?\.jpg/) || [])[1] || '';

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
  avatarFull: normalize(read('avatarFull')),
  groupName: '',
  games: readAll('gameName')
    .filter((g) => g && g.length < 40)
    .slice(0, 6),
  updatedAt: new Date().toISOString(),
};

if (!hash) {
  console.error('Не удалось получить аватар из XML — данные не обновлены');
  process.exit(1);
}

await writeFile(OUT, `${JSON.stringify(profile, null, 2)}\n`, 'utf8');
console.log('Профиль обновлён:', profile.name, '|', profile.onlineState);
console.log('Файл:', OUT);
