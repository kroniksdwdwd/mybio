# mybio — персональный сайт-портфолио

Тёмная тема в стиле GitHub/Discord, моноширинный шрифт JetBrains Mono, пиксельные
детали и плавные анимации. Собран на **Vite + React**, деплоится на **GitHub Pages**
через GitHub Actions.

```
├── .github/workflows/deploy.yml   автодеплой на GitHub Pages
├── public/
│   ├── media/                     фонов��е видео / постеры / аватар-заглушка
│   └── music/                     твои MP3-файлы и обложки
├── scripts/fetch-steam.mjs        обновление данных Steam-профиля
└── src/
    ├── config/
    │   ├── site.js                ← имя, описание, Steam, видео, ссылки
    │   ├── socials.js             ← все социальные сети
    │   └── music.js               ← режим плеера, Spotify, настройки
    ├── data/
    │   └── localPlaylist.js       ← список локальных треков
    ├── lib/                       хелперы (Steam API, хуки)
    ├── components/                секции, плеер, навигация
    └── styles/                    global.css + app.css
```

---

## Быстрый старт

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # сборка в dist/
npm run preview  # локальный просмотр собранного сайта
```

---

## 1. Как поменять SteamID, имя и описание

Файл: **`src/config/site.js`**

```js
export const site = {
  name: 'hilkach',              // ник на сайте
  tagline: 'full-stack developer',
  description: 'Текст о тебе...',

  steam: {
    id: '76561199870670958',    // SteamID64, /id/xxx или ссылка на профиль
    fallbackName: 'hilkach',
    fallbackAvatar: 'https://avatars.fastly.steamstatic.com/....jpg',
    fallbackRealname: '.hilkach.',
    fallbackLocation: 'Singapore',
    fallbackSince: 'June 26, 2025',
    onlineState: 'offline',     // статус, если live-запрос не удался
    games: ['Counter-Strike 2'],
    enabled: true,              // false — скрыть секцию Steam
  },
};
```

**Секция Steam подтягивает живые данные** (аватар, ник, статус онлайн, город,
дату регистрации, самые играемые игры) через публичные CORS-прокси. Если Steam
или прокси недоступны — сайт покажет значения из `fallback*` (ошибок в консоли нет).

Чтобы обновить fallback-значения автоматически:

```bash
node scripts/fetch-steam.mjs 76561199870670958
```

Скрипт напечатает готовый блок для копирования в `site.js`.

---

## 2. Как поменять фоновое видео

1. Положи файл в `public/media/` (например `public/media/bg.mp4`).
2. Открой `src/config/site.js` → `video`:

```js
video: {
  src: '/media/bg.mp4',
  poster: '/media/bg-poster.jpg',
  overlay: 0.62,     // затемнение 0…1
},
```

Видео играет без звука, по кругу, перекрывает весь экран (`object-fit: cover`).
Если `src` пустой — показывается пиксельный градиентный фон.

---

## 3. Как поменять социальные сети

Файл: **`src/config/socials.js`**

```js
export const socials = [
  {
    name: 'Twitch',                       // название на карточке
    url: 'https://twitch.tv/USERNAME',     // адрес
    username: 'USERNAME',                 // ник (необязательно)
    icon: 'twitch',                       // имя иконки
    enabled: true,                        // false — скрыть, не удаляя
    order: 10,                            // чем меньше — тем выше
  },
];
```

### Как добавить новую ссылку

1. Открой `src/config/socials.js`.
2. Добавь новый объект в массив `socials` (или раскомментируй готовый).
3. Поставь `enabled: true` и свой `order`.
4. Сохрани — карточка появится автоматически, в нужном дизайне.

Карточки строятся динамически, поэтому **любая новая запись с `enabled: true`
сразу отображается на сайте**. Никаких правок в HTML/JSX делать не нужно.

### Доступные иконки

| icon | | icon | | icon | |
|---|---|---|---|---|---|
| `twitch` | | `discord` | | `youtube` | |
| `spotify` | | `soundcloud` | | `telegram` | |
| `twitter` / `x` | | `vk` | | `github` | |
| `instagram` | | `tiktok` | | `reddit` | |
| `steam` | | `mail` | | `linktree` | |
| `globe` | | `code` | | `gamepad` | |
| `signal` | | `link` | | `music` | |

Если указать нестандартную иконку — покажется универсальная иконка-ссылка.

### Discord: ник и ID

```js
{
  name: 'Discord',
  url: 'https://discord.com/users/123456789',
  username: 'my nickname',
  discordId: '123456789012345678',   // показывается строкой "ID: ..."
  icon: 'discord',
  enabled: true,
  order: 20,
}
```

---

## 4. Музыкальный плеер

Файл настроек: **`src/config/music.js`**

```js
mode: 'auto',        // 'auto' | 'spotify' | 'local'
spotify: {
  playlistUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX4WYpdgoIcn6',
  theme: 0,          // 0 — тёмная тема Spotify (под наш дизайн)
  showInPanel: true,
},
local: { volume: 0.6, repeat: false, shuffle: false },
```

### Режим `auto`

Сначала пробуется Spotify (если задан `playlistUrl`), иначе — локальные MP3.

### Локальные MP3

1. Положи файлы в **`public/music/`**:

   ```text
   public/music/song1.mp3
   public/music/covers/song1.jpg
   ```

2. Опиши треки в **`src/data/localPlaylist.js`**:

   ```js
   export const localPlaylist = [
     {
       title: 'Nightdrive',
       artist: 'Neon',
       src: '/music/song1.mp3',
       cover: '/music/covers/song1.jpg',   // необязательно
     },
   ];
   ```

3. Если обложки нет — используется пиксельная заглушка.
4. Переключение источника — кнопка со значком Spotify в раскрытой панели плеера.

> `.mp3` файлы в `.gitignore` — чтобы не раздувать репозиторий. Если хочешь
> держать музыку в GitHub — удали соответствующие строки из `.gitignore`
> (и следи за лимитом GitHub в 100 МБ на файл).

### Spotify: честно о возможностях

- **Spotify Embed** (`open.spotify.com/embed/...`) работает без API-ключа и
  Premium, но **не отдаёт наружу события трека**: нельзя программно узнать
  текущий трек, длительность и позицию.
- Поэтому в режиме `spotify` панель плеера разворачивает **официальный Spotify-плеер**
  внутри нашего дизайна — там есть play/pause, next/prev и громкость.
- Полное управление (прогресс, seek, shuffle, repeat, громкость в нашем баре)
  доступно в режиме `local` с MP3-файлами.
- В режиме `spotify` кнопки перемотки/shuffle/repeat подсвечены как недоступные —
  это честно, а не имитация.

### Управление плеером

| Действие | Как |
|---|---|
| Play / Pause | кнопка в центре или `Space` |
| Следующий / предыдущий | кнопки или `Shift + →` / `Shift + ←` |
| Перемотка | клик по полосе прогресса |
| Громкость | наведи курсор на плеер → иконка динамика → слайдер (на мобильном — тап) |
| Перетаскивание | зажми и перетащи плеер в любую точку экрана (мышь и палец) |
| Раскрытие | клик по обложке/пустому месту панели |

Позиция плеера и громкость сохраняются в `localStorage` — после перезагрузки
плеер остаётся там, куда его перетащили. Плеер никогда не уезжает за пределы экрана.

---

## 5. Публикация на GitHub Pages

### Вариант 1 — GitHub Actions (уже настроен)

Файл `.github/workflows/deploy.yml` собирает и публикует сайт при пуше в `main`.

1. Создай репозиторий на github.com (например `mybio`).
2. Добавь remote и запушь:

   ```bash
   git remote add origin https://github.com/<ТВОЙ_НИК>/mybio.git
   git push -u origin main
   ```

3. В репозитории: **Settings → Pages → Source → GitHub Actions**.
4. Через минуту сайт будет доступен на `https://<ТВОЙ_НИК>.github.io/mybio/`.

### Вариант 2 — deploy из ветки

Если не хочешь Actions: `npm run build` → закоммить папку `dist` в ветку `gh-pages`
и включить Pages → Deploy from a branch → `gh-pages / (root)`.

> В `vite.config.js` стоит `base: './'` — сайт корректно работает и в корне
> домена, и в подпапке (`/<repo>/`). Для собственного домена поменяй `base` на `'/'`.

---

## 6. Частые вопросы

**Видео не грузится** — проверь путь `src: '/media/bg.mp4'` и что файл лежит в `public/media/`.

**Steam не показывает онлайн-статус** — Steam не даёт CORS-заголовки, запрос идёт
через публичные прокси; если они недоступны, показываются `fallback*` значения.

**Плеер молчит** — браузеры блокируют автозапуск без действия пользователя.
Нажми Play один раз — и всё заработает.

**Иконка соцсети не отображается** — проверь имя иконки в таблице выше.

---

## 7. Стек

- React 18 + Vite 5
- `simple-icons` — иконки брендов
- CSS — собственные переменные в `src/styles/global.css` (меняй тему в одном месте)
- GitHub Actions — автодеплой
