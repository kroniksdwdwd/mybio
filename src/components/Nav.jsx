import { useEffect, useState } from 'react';
import { site } from '../config/site';
import { socials } from '../config/socials';
import { scrollToSection } from '../lib/hooks';
import Icon from './Icons';

/** Верхняя панель: бренд слева, быстрые ссылки справа. */
export default function Nav() {
  return (
    <header className="nav">
      <button className="nav-brand" onClick={() => scrollToSection(site.sections[0].id)} aria-label="На главную">
        <span className="nav-brand-pixel" aria-hidden="true" />
        <span className="nav-brand-text">{site.name}</span>
        <span className="nav-brand-caret" aria-hidden="true">
          /
        </span>
        <span className="nav-brand-sub">home</span>
      </button>

      <div className="nav-socials">
        {socials
          .filter((s) => s.enabled)
          .slice(0, 5)
          .map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noreferrer noopener"
              className="nav-social"
              aria-label={s.name}
              title={s.name}
            >
              <Icon name={s.icon} size={16} />
            </a>
          ))}
      </div>
    </header>
  );
}

/**
 * Индикатор текущей секции — узкая полоска справа.
 * Показывает, где ты находишься, и позволяет переключиться по клику.
 */
export function SectionIndicator() {
  const [active, setActive] = useState(site.sections[0]?.id);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const ids = site.sections.map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visibleEntries.length) setActive(visibleEntries[0].target.id);
      },
      { threshold: [0.15, 0.4, 0.7], rootMargin: '-15% 0px -30% 0px' }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const onScroll = () => setVisible(window.scrollY > 120);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <nav
      className={`section-indicator ${visible ? 'is-visible' : ''}`}
      aria-label="Навигация по секциям"
    >
      {site.sections.map((s) => (
        <button
          key={s.id}
          className={`indicator-dot ${active === s.id ? 'is-active' : ''}`}
          onClick={() => scrollToSection(s.id)}
          aria-label={`Секция ${s.label}`}
          aria-current={active === s.id ? 'true' : undefined}
        >
          <span className="indicator-label">{s.label}</span>
        </button>
      ))}
    </nav>
  );
}
