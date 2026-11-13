import {
  siTwitch,
  siDiscord,
  siYoutube,
  siSpotify,
  siSoundcloud,
  siTelegram,
  siX,
  siVk,
  siGithub,
  siInstagram,
  siTiktok,
  siReddit,
  siSteam,
  siGmail,
  siLinktree,
  siKofi,
  siBoosty,
  siDonatebox,
} from 'simple-icons';

/* ── Брендовые иконки (simple-icons) ─────────────────────── */
const BRAND = {
  twitch: siTwitch,
  discord: siDiscord,
  youtube: siYoutube,
  spotify: siSpotify,
  soundcloud: siSoundcloud,
  telegram: siTelegram,
  twitter: siX,
  x: siX,
  vk: siVk,
  github: siGithub,
  instagram: siInstagram,
  tiktok: siTiktok,
  reddit: siReddit,
  steam: siSteam,
  mail: siGmail,
  email: siGmail,
  linktree: siLinktree,
  kofi: siKofi,
  boosty: siBoosty,
  donation: siDonatebox,
};

/* ── Собственные иконки ──────────────────────────────────── */
const LINE = {
  play: 'M8 5.2v13.6L19 12 8 5.2Z',
  pause: 'M7 5h3.4v14H7V5Zm6.6 0H17v14h-3.4V5Z',
  prev: 'M6.5 5.5h2v13h-2v-13Zm12.5 0v13l-8-6.5 8-6.5Z',
  next: 'M17.5 5.5h-2v13h2v-13ZM5.5 5.5v13l8-6.5-8-6.5Z',
  volume: 'M4 9.5h3L11 6v12l-4-3.5H4v-5Z',
  volumeMute: 'M4 9.5h3L11 6v12l-4-3.5H4v-5Zm12.6-.9 1.4 1.4 1.4-1.4 1 1-1.4 1.4 1.4 1.4-1 1-1.4-1.4-1.4 1.4-1-1 1.4-1.4-1.4-1.4 1-1Z',
  shuffle: 'M4 7h3.2l3 5m0 0 3 5H20m0 0-2.4-2.4M20 17l-2.4 2.4M4 17h3.2l1.6-2.7M13.5 9.7l1.4-2.3L16.5 7H20m0 0-2.4-2.4M20 7l-2.4 2.4',
  repeat: 'M6 7h12l-2.5-2.5M18 7l-2.5 2.5M18 17H6l2.5 2.5M6 17l2.5-2.5',
  arrowDown: 'M12 4v14m0 0-5-5m5 5 5-5',
  external: 'M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4',
  link: 'M10 13a4 4 0 0 0 5.7.3l2.6-2.6a4 4 0 0 0-5.7-5.7l-1.4 1.4M14 11a4 4 0 0 0-5.7-.3l-2.6 2.6a4 4 0 0 0 5.7 5.7l1.4-1.4',
  music: 'M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm10-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z',
  chevron: 'm6 9 6 6 6-6',
  close: 'm6 6 12 12M18 6 6 18',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c2.5 2.4 3.8 5.4 3.8 9S14.5 18.6 12 21c-2.5-2.4-3.8-5.4-3.8-9S9.5 5.4 12 3ZM3.5 12h17',
  signal: 'M4 20v-4m4 4v-8m4 8V8m4 12V4m4 16v-6',
  code: 'm9 8-4 4 4 4m6-8 4 4-4 4',
  gamepad: 'M7 8h10a5 5 0 0 1 5 5 3 3 0 0 1-3 3h-2l-1-2H8l-1 2H5a3 3 0 0 1-3-3 5 5 0 0 1 5-5Zm1 3v2m-1-1h2m6 0h.01m2 2h.01',
  check: 'm5 13 4.5 4.5L19 7',
  dot: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z',
  spotifyGlyph: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.6 14.4a.8.8 0 0 1-1.1.3c-3-1.8-6.8-2.2-11.2-1.2a.8.8 0 0 1-.4-1.5c4.8-1.1 9-.6 12.4 1.4.4.2.5.7.3 1Zm1.3-3a1 1 0 0 1-1.4.3c-3.4-2.1-8.7-2.7-12.8-1.5a1 1 0 0 1-.6-1.9c4.7-1.4 10.6-.7 14.6 1.7.5.3.6.9.2 1.4Zm.1-3.1C14 7.7 8.2 7.4 4.3 8.5a1.2 1.2 0 1 1-.7-2.3C8.2 4.9 14.7 5.3 19.2 7.7a1.2 1.2 0 0 1-1.2 2.1Z',
};

/**
 * Компонент иконки.
 * @param {string} name — имя из config (см. Icons.jsx BRAND/LINE)
 */
export default function Icon({ name, size = 20, className = '', strokeWidth = 1.7, title }) {
  const brand = BRAND[name];
  if (brand) {
    return (
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        role={title ? 'img' : 'presentation'}
        aria-hidden={title ? undefined : true}
        aria-label={title}
      >
        <path d={brand.path} fill="currentColor" />
      </svg>
    );
  }

  const path = LINE[name] || LINE.link;
  const filled = ['play', 'pause', 'prev', 'next', 'volume', 'volumeMute', 'dot', 'spotifyGlyph'].includes(
    name
  );

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

export function hasIcon(name) {
  return Boolean(BRAND[name] || LINE[name]);
}
