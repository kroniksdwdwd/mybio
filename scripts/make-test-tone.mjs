/**
 * Генератор тестового аудио (WAV) для проверки плеера.
 * Запуск: node scripts/make-test-tone.mjs
 * Создаёт public/music/test-tone.wav — короткий синус.
 */
import { writeFile } from 'node:fs/promises';

const seconds = 3;
const rate = 44100;
const samples = rate * seconds;
const data = Buffer.alloc(samples * 2);

for (let i = 0; i < samples; i += 1) {
  const t = i / rate;
  const env = Math.min(1, t * 4) * Math.min(1, (seconds - t) * 4);
  const value = Math.sin(2 * Math.PI * 440 * t) * 0.25 * env;
  data.writeInt16LE(Math.round(value * 32767), i * 2);
}

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(rate, 24);
header.writeUInt32LE(rate * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(data.length, 40);

const out = new URL('../public/music/test-tone.wav', import.meta.url);
await writeFile(out, Buffer.concat([header, data]));
console.log('Готово:', out.pathname);
