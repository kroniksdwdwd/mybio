/**
 * Сборка плейлиста из локальных MP3.
 *
 * Запуск:  node scripts/build-playlist.mjs
 *
 * Скрипт читает ID3-теги всех файлов в public/music,
 * ищет обложку в public/music/covers/<название>.jpg
 * и генерирует src/data/localPlaylist.js.
 */
import { readdir, writeFile, access } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFile } from 'music-metadata';

const MUSIC_DIR = fileURLToPath(new URL('../public/music/', import.meta.url));
const COVERS_DIR = join(MUSIC_DIR, 'covers');
const OUT = fileURLToPath(new URL('../src/data/localPlaylist.js', import.meta.url));

const exists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

const files = (await readdir(MUSIC_DIR))
  .filter((f) => /\.(mp3|m4a|ogg|wav)$/i.test(f))
  .sort((a, b) => a.localeCompare(b));

const tracks = [];

for (const file of files) {
  let meta = {};
  try {
    meta = await parseFile(join(MUSIC_DIR, file));
  } catch (e) {
    console.warn(`Не удалось прочитать теги: ${file} (${e.message})`);
  }

  const title = meta.common?.title || basename(file, file.slice(file.lastIndexOf('.')));
  const artist = meta.common?.artist || meta.common?.albumartist || 'Unknown';
  const album = meta.common?.album || '';

  // Обложка: <обложка>.<same name>.jpg в папке covers
  let cover = '';
  const candidates = [
    `${title}.jpg`,
    `${title}.png`,
    `${basename(file, file.slice(file.lastIndexOf('.')))}.jpg`,
  ];
  for (const c of candidates) {
    if (await exists(join(COVERS_DIR, c))) {
      cover = `music/covers/${c}`;
      break;
    }
  }

  tracks.push({ title, artist, album, src: `music/${file}`, cover });
}

const body = tracks
  .map(
    (t) => `  {
    title: '${t.title.replace(/'/g, "\\'")}',
    artist: '${t.artist.replace(/'/g, "\\'")}',
    src: '${t.src.replace(/'/g, "\\'")}',${t.cover ? `\n    cover: '${t.cover}',` : ''}
  },`
  )
  .join('\n');

const file = `/**
 * ============================================================
 *  LOCAL PLAYLIST — свои MP3-файлы
 * ============================================================
 *
 *  Сгенерировано автоматически: node scripts/build-playlist.mjs
 *  Файлы лежат в public/music/, обложки — в public/music/covers/
 * ============================================================
 */

export const localPlaylist = [
${body}
];

export default localPlaylist;
`;

await writeFile(OUT, file, 'utf8');
console.log(`Треков: ${tracks.length}`);
tracks.forEach((t) => console.log(` • ${t.artist} — ${t.title}${t.cover ? '  [обложка]' : ''}`));
console.log(`Записано: ${OUT}`);
