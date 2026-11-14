import { useEffect, useState } from 'react';
import { socials } from '../config/socials';
import { site } from '../config/site';
import socialAvatars from '../data/socialAvatars.json';
import { useReveal } from '../lib/hooks';
import { useInView } from '../lib/useInView';
import Icon from './Icons';
import Typewriter from './Typewriter';

/** Путь к файлу относительно корня сайта (GitHub Pages лежит в /<repo>/) */
const asset = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${String(path).replace(/^\/+/, '')}`;
};

/**
 * Третья секция — Socials.
 * В каждой карточке: квадрат с аватаром профиля, а в его углу —
 * иконка площадки. Список берётся из src/config/socials.js.
 */
export default function SocialsSection({ steam }) {
  const sectionRef = useReveal('.reveal');
  const [titleRef, titleVisible] = useInView({ threshold: 0.35 });

  const list = [...socials]
    .filter((s) => s && s.enabled !== false)
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));

  // Аватар площадки (скачивается скриптом fetch-avatars.mjs),
  // иначе — аватар из Steam-профиля
  const fallbackAvatar = steam?.avatarFull || site.avatar || site.avatarFallback;

  useEffect(() => {
    sectionRef.current?.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.setProperty('--delay', `${i * 70}ms`);
    });
  }, [sectionRef]);

  return (
    <section id="socials" className="socials-section" ref={sectionRef}>
      <div className="container">
        <div className="section-head" ref={titleRef}>
          <span className="section-kicker reveal">03 / Socials</span>
          <h2 className="section-title">
            <Typewriter
              segments={[
                { text: 'find me ' },
                { text: 'around', accent: true },
                { text: ' the web' },
              ]}
              start={titleVisible}
              speed={34}
            />
          </h2>
        </div>

        {list.length === 0 ? (
          <div className="socials-empty reveal">
            <Icon name="link" size={18} />
            <div>
              <strong>Пока нет ссылок</strong>
              <p>
                Открой <code>src/config/socials.js</code> и включи нужные площадки — карточки
                появятся здесь автоматически.
              </p>
            </div>
          </div>
        ) : (
          <div className="socials-grid">
            {list.map((s) => (
              <a
                key={s.name}
                className="social-card reveal"
                href={s.url}
                target="_blank"
                rel="noreferrer noopener"
              >
                <span className="social-avatar">
                  <img
                    src={asset(s.avatar) || asset(socialAvatars[s.url]) || fallbackAvatar}
                    alt=""
                    loading="lazy"
                  />
                  <span className="social-badge" aria-hidden="true">
                    <Icon name={s.icon} size={13} />
                  </span>
                </span>

                <span className="social-text">
                  <span className="social-name">{s.name}</span>
                  <span className="social-username">
                    {s.username || s.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </span>
                  {s.discordId && s.discordId !== s.username && (
                    <span className="social-extra">ID: {s.discordId}</span>
                  )}
                </span>

                <Icon name="external" size={15} className="social-arrow" />
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
