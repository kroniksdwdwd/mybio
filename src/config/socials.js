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
 *    telegram, twitter/x, vk, github, instagram, tiktok,
 *    reddit, steam, mail, link, code, gamepad, globe, signal
 *
 *  Если указать нестандартную иконку — будет показана
 *  универсальная иконка-ссылка.
 * ============================================================
 */

export const socials = [
  {
    name: 'Twitch',
    url: 'https://www.twitch.tv/3erdool',
    username: '3erdool',
    icon: 'twitch',
    enabled: true,
    order: 10,
  },
  {
    name: 'Discord',
    url: 'https://discord.com/users/1221764017702440969',
    username: '1221764017702440969',
    discordId: '1221764017702440969',
    icon: 'discord',
    enabled: true,
    order: 20,
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/channel/UCYkOF1bdvgKfIn49u6dfseA',
    username: 'игровой канал',
    icon: 'youtube',
    enabled: true,
    order: 30,
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/@DrTiime',
    username: 'туториалы и гайды',
    icon: 'youtube',
    enabled: true,
    order: 31,
  },
  {
    name: 'Spotify',
    url: 'https://open.spotify.com/user/31jtcvlp5l6wrmy6cththkowwkfa',
    username: 'hilkach',
    icon: 'spotify',
    enabled: true,
    order: 40,
  },
  {
    name: 'SoundCloud',
    url: 'https://soundcloud.com/hilkach',
    username: 'hilkach',
    icon: 'soundcloud',
    enabled: true,
    order: 50,
  },
  {
    name: 'GitHub',
    url: 'https://github.com/kroniksdwdwd',
    username: 'kroniksdwdwd',
    icon: 'github',
    enabled: true,
    order: 60,
  },
];

export default socials;
