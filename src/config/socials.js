/**
 * ============================================================
 *  SOCIALS CONFIG — все ссылки в одном месте
 * ============================================================
 *
 *  КАК ДОБАВИТЬ НОВУЮ ССЫЛКУ:
 *  1. Скопируй любой блок из массива `socials`.
 *  2. Поменяй:
 *       name     — название (показывается на карточке)
 *       url      — адрес (обязательно)
 *       username — ник/handle (необязательно, но красиво)
 *       icon     — имя иконки (см. список ниже)
 *       enabled  — true = показывать, false = скрыть (не удалять)
 *       order    — чем меньше, тем выше в списке
 *  3. Сохрани файл — карточка появится сама.
 *
 *  ДОСТУПНЫЕ ИКОНКИ (icon):
 *    twitch, discord, youtube, spotify, soundcloud,
 *    telegram, twitter, vk, github, instagram, tiktok,
 *    reddit, telegram, steam, mail, link, code, gamepad
 *
 *  Если указать нестандартную иконку (например 'mylogo'),
 *  будет показана универсальная иконка-ссылка.
 * ============================================================
 */

export const socials = [
  {
    name: 'Twitch',
    url: 'https://twitch.tv/',
    username: '',
    icon: 'twitch',
    enabled: false,
    order: 10,
  },
  {
    name: 'Discord',
    url: 'https://discord.com/users/',
    username: '',
    icon: 'discord',
    enabled: false,
    order: 20,
  },
  {
    name: 'YouTube',
    url: 'https://youtube.com/',
    username: '',
    icon: 'youtube',
    enabled: false,
    order: 30,
  },
  {
    name: 'Spotify',
    url: 'https://open.spotify.com/',
    username: '',
    icon: 'spotify',
    enabled: false,
    order: 40,
  },
  {
    name: 'SoundCloud',
    url: 'https://soundcloud.com/',
    username: '',
    icon: 'soundcloud',
    enabled: false,
    order: 50,
  },
];

export default socials;
