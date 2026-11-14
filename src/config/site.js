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
  tagline: 'streamer & creator',
  description:
    'Стримлю на Twitch, снимаю гайды по играм на YouTube и собираю музыку. Тут можно найти все мои площадки.',

  // ── Аватар ─────────────────────────────────────────────────
  // Если avatar пустой — аватар подгрузится автоматически из Steam.
  avatar: '',
  avatarFallback: '/media/avatar-placeholder.svg',

  // ── Локация / статус (маленькие чипы под описанием) ────────
  chips: [
    { id: 'location', label: 'Location', value: 'Europe', icon: 'globe' },
    { id: 'music', label: 'Now', value: 'Music on', icon: 'music' },
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
  src: 'media/bg.mp4',
  poster: 'media/bg-poster.jpg',
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
