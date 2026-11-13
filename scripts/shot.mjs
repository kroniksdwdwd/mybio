/**
 * Скриншоты сайта через CDP (headless Edge).
 * Запуск: node scripts/shot.mjs http://localhost:4173 [outDir]
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL_TARGET = process.argv[2] || 'http://localhost:4173/';
const OUT_DIR = process.argv[3] || 'C:/Users/mihol/AppData/Local/Temp/opencode/shots';
const PORT = 9334;

const EDGE = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => existsSync(p));

if (!EDGE) {
  console.error('Браузер не найден');
  process.exit(1);
}

const profileDir = mkdtempSync(join(tmpdir(), 'shot-'));
const proc = spawn(
  EDGE,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--mute-audio',
    '--hide-scrollbars',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profileDir}`,
    'about:blank',
  ],
  { stdio: 'ignore' }
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function targetWs() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      /* wait */
    }
    await sleep(250);
  }
  return null;
}

const wsUrl = await targetWs();
if (!wsUrl) {
  proc.kill();
  console.error('CDP недоступен');
  process.exit(1);
}

const ws = new WebSocket(wsUrl);
let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
});
const send = (method, params = {}) =>
  new Promise((res) => {
    const msgId = ++id;
    pending.set(msgId, res);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

await new Promise((r) => ws.addEventListener('open', r));
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});

async function shoot(name, scrollY = 0, width = 1440, height = 900) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });
  await send('Page.navigate', { url: URL_TARGET });
  await sleep(2600);
  if (scrollY) {
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${scrollY});` });
    await sleep(1400);
  }
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  const file = `${OUT_DIR}/${name}.png`;
  writeFileSync(file, Buffer.from(data, 'base64'));
  console.log('saved', file);
}

await shoot('01-hero', 0);
await shoot('02-steam', 900);
await shoot('03-socials', 1800);
await shoot('04-mobile', 0, 390, 844);

ws.close();
proc.kill();
process.exit(0);
