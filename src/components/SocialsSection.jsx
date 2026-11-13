import { useEffect, useRef } from 'react';
import { socials } from '../config/socials';
import { useReveal } from '../lib/hooks';
import Icon from './Icons';

/**
 * Третья секция — Socials.
 * Карточки строятся динамически из src/config/socials.js,
 * любая новая запись с enabled: true появляется автоматически.
 */
export default function SocialsSection() {
  const ref = useReveal('.reveal');

  const list = [...socials]
    .filter((s) => s && s.enabled !== false)
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));

  useEffect(() => {
    ref.current?.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.setProperty('--delay', `${i * 60}ms`);
    });
  }, [ref]);

  return (
    <section id="socials" className="section socials-section" ref={ref}>
      <div className="container">
        <header className="section-head reveal">
          <span className="section-label">03 — Socials</span>
          <h2 className="section-title">
            find me <span className="accent">around</span> the web
          </h2>
          <p className="section-sub">
            Все мои площадки в одном месте. Ссылки добавляются через
            <code>src/config/socials.js</code>.
          </p>
        </header>

        {list.length === 0 ? (
          <div className="empty-state reveal">
            <Icon name="link" size={22} />
            <p>
              Ссылки пока не добавлены. Открой <code>src/config/socials.js</code> и поставь
              <code> enabled: true</code> нужным площадкам.
            </p>
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
                <span className="social-icon">
                  <Icon name={s.icon} size={22} />
                </span>
                <span className="social-body">
                  <span className="social-name">{s.name}</span>
                  <span className="social-username">
                    {s.username || s.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </span>
                  {s.discordId && <span className="social-extra">ID: {s.discordId}</span>}
                </span>
                <span className="social-arrow" aria-hidden="true">
                  <Icon name="external" size={15} />
                </span>
                <span className="social-sheen" aria-hidden="true" />
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
