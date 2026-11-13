/**
 * ============================================================
 *  SITE CONFIG — главный файл настроек сайта
 * ============================================================
 *  Здесь хранится всё, что ты можешь менять без кода:
 *  имя, описание, аватар, Steam-профиль, фоновое видео и т.д.
 *
 *  Как менять: открой этот файл, правь значения, сохраняй.
 *  Vite перезагрузит страницу автоматически (в режиме `npm run dev`).
 * ============================================================
 */

export const site = {
  // ── Основное ───────────────────────────────────────────────
  name: 'hilkach',
  tagline: 'full-stack developer',
  description:
    'Разрабатываю проекты, в которых чистый код встречается с аккуратным дизайном. Люблю терминал, тёмные интерфейсы и пиксель-арт.',

  // ── Аватар ─────────────────────────────────────────────────
  // Если avatar пустой — аватар подгрузится автоматически из Steam.
  avatar: '',
  avatarFallback: '/media/avatar-placeholder.svg',

  // ── Локация / статус (маленькие чипы под описанием) ────────
  // Например: 'GMT+3', 'Open for work', '18 y/o'
  chips: [
    { id: 'location', label: 'Location', value: 'Europe', icon: 'globe' },
    { id: 'status', label: 'Status', value: 'Online', icon: 'signal' },
  ],

  // ── Steam ──────────────────────────────────────────────────
  steam: {
    // SteamID64 (76561199870670958) или ссылка на профиль.
    // Ссылка вида https://steamcommunity.com/id/xxx тоже работает.
    id: '76561199870670958',
    // Fallback-значения, если Steam недоступен или профиль скрыт.
    fallbackName: 'hilkach',
    fallbackAvatar:
      'https://avatars.fastly.steamstatic.com/1e2eed4131c3f391e30bba0c78559a0617acc765_full.jpg',
    fallbackRealname: '.hilkach.',
    fallbackLocation: 'Singapore',
    fallbackSince: 'June 26, 2025',
    // Статус на случай, если live-запрос не удался
    // (актуальное значение лежит в src/data/steamProfile.json)
    onlineState: '',
    // Игры (используются в fallback-режиме)
    games: ['Counter-Strike 2', 'ROB RUN', 'GeoGuessr', 'Euro Truck Simulator 2', 'DDNet'],
    // Показывать ли секцию Steam вообще
    enabled: true,
  },

  // ── Фоновое видео первой секции ───────────────────────────
  video: {
    // Положи файл в /public/media/ и укажи путь, например:
    //   src: '/media/bg.mp4'
    src: '',
    poster: '',
    // Затемнение поверх видео (0 — 1)
    overlay: 0.62,
  },

  // ── Прочие ссылки (показываются в Hero и в навигации) ──────
  // Эти ссылки — «не-соцсети»: почта, Telegram, портфолио и т.п.
  extraLinks: [],

  // ── Секции сайта (порядок = порядок навигации) ─────────────
  sections: [
    { id: 'about', label: 'About', index: '01' },
    { id: 'steam', label: 'Steam', index: '02' },
    { id: 'socials', label: 'Socials', index: '03' },
  ],
};

export default site;
