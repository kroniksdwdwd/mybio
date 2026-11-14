/**
 * ============================================================
 *  Загрузка аватарок площадок (Twitch, YouTube, Spotify, ...)
 * ============================================================
 *
 * Запуск:
 *   node scripts/fetch-avatars.mjs
 *
 * Скрипт заходит на страницу каждой ссылки из src/config/socials.js,
 * достаёт аватарку (og:image или profileImageURL) и сохраняет её в
 * public/avatars/. Результат пишется в src/data/socialAvatars.json.
 *
 * Сайт сам не может ходить на эти сайты (CORS), поэтому картинки
 * заранее скачиваются и лежат в репозитории. В CI это делается
 * автоматически (workflow update-avatars.yml).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { socials } from '../src/config/socials.js';
import { music } from '../src/config/music.js';

const OUT_DIR = fileURLToPath(new URL('../public/avatars/', import.meta.url));
const OUT_JSON = fileURLToPath(new URL('../src/data/socialAvatars.json', import.meta.url));

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

const PICKERS = [
  // og:image — обычно аватар профиля
  (html) => html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1],
  (html) => html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i)?.[1],
  // Twitch отдаёт аватарку в состоянии страницы
  (html) => html.match(/"profileImageURL":"(https?:[^"]+)"/i)?.[1],
  (html) => html.match(/"avatarUrl":"(https?:[^"]+)"/i)?.[1],
  (html) => html.match(/"imageUrl":"(https?:[^"]+)"/i)?.[1],
  // YouTube
  (html) => html.match(/"avatar":\{"thumbnails":\[\{"url":"([^"]+)"/i)?.[1],
];

const slug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Короткий хеш URL — чтобы файлы разных площадок не совпадали */
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h.toString(36).slice(0, 4);
}

/** Spotify отдаёт аватарку только через oEmbed плейлиста */
async function spotifyAvatar() {
  if (!music.spotify.playlistUrl) return null;
  try {
    const res = await fetch(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(music.spotify.playlistUrl)}`,
      { headers: { 'user-agent': UA } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.thumbnail_url || null;
  } catch {
    return null;
  }
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function download(imageUrl) {
  const res = await fetch(imageUrl, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get('content-type') || '';
  const buf = Buffer.from(await res.arrayBuffer());
  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
  return { buf, ext };
}

await mkdir(OUT_DIR, { recursive: true });

const result = {};
const list = socials.filter((s) => s && s.enabled !== false);

for (const social of list) {
  const key = social.url;
  try {
    const html = await fetchPage(social.url);
    let imageUrl = null;
    for (const pick of PICKERS) {
      const found = pick(html);
      if (found) {
        imageUrl = decode(found);
        break;
      }
    }
    if (!imageUrl && social.icon === 'spotify') {
      imageUrl = await spotifyAvatar();
    }
    if (!imageUrl) throw new Error('аватарка не найдена в HTML');

    // Spotify: страница полностью клиентская — берём обложку плейлиста
    if (!imageUrl && social.icon === 'spotify') {
      imageUrl = await spotifyAvatar();
      if (!imageUrl) throw new Error('не удалось получить обложку Spotify');
    }

    // YouTube: иногда в og:image баннер — ищем аватар в разметке
    if (social.icon === 'youtube' && /yt3\.googleusercontent\.com\/s\//.test(imageUrl)) {
      const avatar = html.match(/"avatar":\{"thumbnails":\[\{"url":"([^"]+)"/i)?.[1];
      if (avatar) imageUrl = decode(avatar);
    }

    const { buf, ext } = await download(imageUrl);
    const file = `${slug(social.name)}-${hash(social.url)}.${ext}`;
    await writeFile(`${OUT_DIR}${file}`, buf);

    result[key] = `avatars/${file}`;
    console.log(`✔ ${social.name} — avatars/${file} (${Math.round(buf.length / 1024)} КБ)`);
  } catch (e) {
    console.log(`✖ ${social.name}: ${e.message}`);
  }
}

await writeFile(OUT_JSON, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(`\nЗаписано: ${OUT_JSON}`);
