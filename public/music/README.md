# Локальная музыка

Сюда клади свои MP3-файлы:

```text
public/
  music/
    song1.mp3
    song2.mp3
    covers/
      song1.jpg
```

После этого опиши треки в `src/data/localPlaylist.js`:

```js
export const localPlaylist = [
  {
    title: 'Nightdrive',
    artist: 'Neon',
    src: '/music/song1.mp3',
    cover: '/music/covers/song1.jpg', // необязательно
  },
];
```

Пути начинаются с `/music/...` — это корень сайта, поэтому всё работает
и на локальном сервере, и на GitHub Pages.

Если обложки нет — используется пиксельная заглушка.
