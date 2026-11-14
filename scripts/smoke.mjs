/**
 * Дымовой тест сайта: поднимает headless Edge через CDP,
 * собирает ошибки консоли и проверяет ключевые элементы.
 *
 * Запуск:
 *   npm run build
 *   npm run preview -- --port 4173
 *   node scripts/smoke.mjs http://localhost:4173
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL_TARGET = process.argv[2] || 'http://localhost:4173/';
const PORT = 9333;

const EDGE_CANDIDATES = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];

const edge = EDGE_CANDIDATES.find((p) => existsSync(p));

if (!edge) {
  console.error('Не найден браузер (Edge/Chrome)');
  process.exit(1);
}

const profileDir = mkdtempSync(join(tmpdir(), 'smoke-'));
const proc = spawn(
  edge,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--mute-audio',
    '--autoplay-policy=no-user-gesture-required',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profileDir}`,
    URL_TARGET,
  ],
  { stdio: 'ignore' }
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      /* not ready */
    }
    await sleep(250);
  }
  return null;
}

const wsUrl = await getWsUrl();
if (!wsUrl) {
  proc.kill();
  console.error('Не удалось подключиться к CDP');
  process.exit(1);
}

const ws = new WebSocket(wsUrl);
let id = 0;
const pending = new Map();
const consoleErrors = [];
const pageErrors = [];

ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
    return;
  }
  if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(msg.params.type)) {
    consoleErrors.push(
      `${msg.params.type}: ${msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ')}`
    );
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    pageErrors.push(
      msg.params.exceptionDetails.exception?.description ||
        msg.params.exceptionDetails.text ||
        'unknown error'
    );
  }
});

const send = (method, params = {}) =>
  new Promise((resolve) => {
    const msgId = ++id;
    pending.set(msgId, resolve);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

const evaluate = async (expression) => {
  const res = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return res?.result?.value;
};

await new Promise((resolve) => ws.addEventListener('open', resolve));
await send('Runtime.enable');
await send('Page.enable');
// Эмулируем обычную мышь и движение без reduced-motion,
// иначе кастомный курсор и его анимации отключаются
await send('Emulation.setEmulatedMedia', {
  features: [
    { name: 'hover', value: 'hover' },
    { name: 'pointer', value: 'fine' },
    { name: 'any-hover', value: 'hover' },
    { name: 'any-pointer', value: 'fine' },
    { name: 'prefers-reduced-motion', value: 'no-preference' },
  ],
});
await send('Page.navigate', { url: URL_TARGET });
await sleep(3500);

const checks = {};

checks.title = await evaluate('document.title');
checks.heroName = await evaluate('document.querySelector(".hero-name")?.textContent?.trim()');
checks.steamName = await evaluate('document.querySelector(".steam-name")?.textContent?.trim()');
checks.steamStatus = await evaluate('document.querySelector(".steam-status")?.textContent?.trim()');
checks.steamAvatar = await evaluate(
  'document.querySelector(".steam-avatar img")?.getAttribute("src")?.slice(0, 60)'
);
checks.socialCards = await evaluate('document.querySelectorAll(".social-card").length');
checks.playerTitle = await evaluate('document.querySelector(".player-title")?.textContent?.trim()');
checks.sectionIndicator = await evaluate('document.querySelectorAll(".indicator-dot").length');
checks.reveals = await evaluate(
  'document.querySelectorAll(".reveal.is-visible").length + "/" + document.querySelectorAll(".reveal").length'
);

// Плеер: нажимаем play и проверяем, что аудио играет
await evaluate('document.querySelector(".player-btn--main")?.click()');
await sleep(1800);
checks.audioPlaying = await evaluate(
  '(() => { const a = document.querySelector("audio"); return a ? { paused: a.paused, time: a.currentTime.toFixed(2) } : "no audio"; })()'
);

// Клик по фону плеера раскрывает панель
await evaluate('document.querySelector(".player-bar")?.click()');
await sleep(400);
checks.expanded = await evaluate('document.querySelector(".player")?.classList.contains("is-expanded")');

// Курсор: след из точек + плавное движение
await evaluate(`
  (() => {
    const fire = (x, y) => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, bubbles: true }));
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }));
    };
    for (let i = 0; i <= 20; i++) fire(300 + i * 30, 300 + i * 12);
  })()
`);
await sleep(400);
checks.cursorActive = await evaluate('document.body.classList.contains("cursor-custom")');
checks.trailDots = await evaluate('document.querySelectorAll(".cursor-trail-dot").length');
checks.trailLifetime = await evaluate(`(() => {
  const el = document.querySelector('.cursor-trail-dot');
  return el ? getComputedStyle(el).animationDuration : 'n/a';
})()`);
checks.cursorDotTransform = await evaluate(
  'getComputedStyle(document.querySelector(".cursor-dot")).transform'
);

// Плавная прокрутка: колесо мыши должно плавно скроллить страницу
checks.smoothScrollEnabled = await evaluate(
  'document.documentElement.classList.contains("smooth-scroll")'
);
await evaluate(
  'window.dispatchEvent(new WheelEvent("wheel", { deltaY: 700, bubbles: true, cancelable: true }))'
);
await sleep(120);
checks.scrollMid = await evaluate('Math.round(window.scrollY)');
await sleep(700);
checks.scrollEnd = await evaluate('Math.round(window.scrollY)');

console.log('\n=== РЕЗУЛЬТАТЫ ===');
console.log(JSON.stringify(checks, null, 2));
console.log('\n=== ОШИБКИ КОНСОЛИ ===');
console.log(consoleErrors.length ? consoleErrors.join('\n') : 'нет');
console.log('\n=== ИСКЛЮЧЕНИЯ ===');
console.log(pageErrors.length ? pageErrors.join('\n') : 'нет');

ws.close();
proc.kill();
process.exit(consoleErrors.length || pageErrors.length ? 1 : 0);
