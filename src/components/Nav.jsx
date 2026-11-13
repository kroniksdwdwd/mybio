import { useEffect, useState } from 'react';
import { site } from '../config/site';
import { socials } from '../config/socials';
import { scrollToSection } from '../lib/hooks';
import Icon from './Icons';

/** Навигация-индикатор: точки секций слева + логотип. */
export default function Nav({ sections }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const ids = sections.map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length) setActive(visible[0].target.id);
      },
      { threshold: [0.2, 0.5], rootMargin: '-15% 0px -40% 0px' }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  const go = (id) => scrollToSection(id);

  return (
    <header className="nav">
      <button className="nav-brand" onClick={() => go(sections[0].id)} aria-label="На главную">
        <span className="nav-brand-pixel" aria-hidden="true" />
        <span className="nav-brand-text">{site.name}</span>
        <span className="nav-brand-caret" aria-hidden="true">
          /
        </span>
        <span className="nav-brand-sub">home</span>
      </button>

      <nav className="nav-dots" aria-label="Навигация по секциям">
        {sections.map((s) => (
          <button
            key={s.id}
            className={`nav-dot ${active === s.id ? 'is-active' : ''}`}
            onClick={() => go(s.id)}
            aria-label={`Перейти к секции ${s.label}`}
            aria-current={active === s.id ? 'true' : undefined}
          >
            <span className="nav-dot-index">{s.index}</span>
            <span className="nav-dot-label">{s.label}</span>
            <span className="nav-dot-line" aria-hidden="true" />
          </button>
        ))}
      </nav>

      <div className="nav-socials">
        {socials
          .filter((s) => s.enabled)
          .slice(0, 4)
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
