import { useEffect } from 'react';
import { socials } from '../config/socials';
import { useReveal } from '../lib/hooks';
import { useInView } from '../lib/useInView';
import Icon from './Icons';
import Typewriter from './Typewriter';

/**
 * Третья секция — Socials.
 * Карточки строятся динамически из src/config/socials.js,
 * любая новая запись с enabled: true появляется автоматически.
 */
export default function SocialsSection() {
  const sectionRef = useReveal('.reveal');
  const [titleRef, titleVisible] = useInView({ threshold: 0.35 });

  const list = [...socials]
    .filter((s) => s && s.enabled !== false)
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));

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
          <p className="section-sub reveal">
            Все мои площадки в одном месте. Список берётся из{' '}
            <code>src/config/socials.js</code> — добавь запись с <code>enabled: true</code>, и
            карточка появится сама.
          </p>
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
                <span className="social-icon reveal-media">
                  <Icon name={s.icon} size={20} />
                </span>
                <span className="social-text">
                  <span className="social-name">{s.name}</span>
                  <span className="social-username">
                    {s.username || s.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </span>
                  {s.discordId && <span className="social-extra">ID: {s.discordId}</span>}
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
