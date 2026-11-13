/**
 * Обновление данных Steam-профиля.
 *
 * Запуск:  node scripts/fetch-steam.mjs
 *
 * Скрипт скачивает актуальный XML-профиль Steam и печатает готовые
 * значения для src/config/site.js (ник, аватар, город, дата регистрации).
 * Ничего не меняет в проекте — только показывает, что вставить.
 */
import { writeFile } from 'node:fs/promises';

const STEAM_ID = process.argv[2] || '76561199870670958';

const url = `https://steamcommunity.com/profiles/${STEAM_ID}/?xml=1`;
const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
if (!res.ok) {
  console.error(`Steam ответил ${res.status}`);
  process.exit(1);
}
const xml = await res.text();
await writeFile(new URL('./steam-profile.xml', import.meta.url), xml, 'utf8');

const read = (tag) => {
  const m = xml.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`));
  return m ? m[1].trim() : '';
};

const profile = {
  id: STEAM_ID,
  fallbackName: read('customURL') || read('steamID'),
  fallbackAvatar: read('avatarFull'),
  fallbackRealname: read('realname'),
  fallbackLocation: read('location'),
  fallbackSince: read('memberSince'),
  onlineState: read('onlineState'),
};

console.log('\nВставь это в src/config/site.js → steam: { ... }\n');
console.log(JSON.stringify(profile, null, 2));
console.log('\nИмя для сайта (site.name):', profile.fallbackName);
