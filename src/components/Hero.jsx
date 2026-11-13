import { useEffect, useRef, useState } from 'react';
import { site } from '../config/site';
import { scrollToSection } from '../lib/hooks';
import Icon from './Icons';

/**
 * Первая секция — About Me.
 * Фон: видео (если задано) + пиксельный градиентный fallback.
 */
export default function Hero({ steam }) {
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const play = v.play();
    if (play && typeof play.catch === 'function') play.catch(() => {});
  }, []);

  const avatar = steam?.avatarFull || site.avatar || site.avatarFallback;
  const nextSection = site.sections[1]?.id || 'steam';

  return (
    <section id="about" className={`hero ${mounted ? 'is-ready' : ''}`}>
      {/* Фоновое видео */}
      {site.video.src && (
        <video
          ref={videoRef}
          className="hero-video"
          src={site.video.src}
          poster={site.video.poster || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
      )}
      <div
        className="hero-overlay"
        style={{ opacity: site.video.overlay }}
        aria-hidden="true"
      />
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-vignette" aria-hidden="true" />

      <div className="hero-inner container">
        <div className="hero-top reveal" style={{ '--delay': '0ms' }}>
          <span className="hero-status">
            <span className="hero-status-dot" aria-hidden="true" />
            {steam?.onlineState === 'online' ? 'online' : 'offline'}
          </span>
          <span className="hero-id">{steam?.id64 || '76561198…'}</span>
        </div>

        <div className="hero-avatar reveal" style={{ '--delay': '90ms' }}>
          <div className="avatar-frame">
            <div className="avatar-corner avatar-corner--tl" aria-hidden="true" />
            <div className="avatar-corner avatar-corner--tr" aria-hidden="true" />
            <div className="avatar-corner avatar-corner--bl" aria-hidden="true" />
            <div className="avatar-corner avatar-corner--br" aria-hidden="true" />
            <img src={avatar} alt={`Аватар ${site.name}`} loading="eager" />
          </div>
          <span className="avatar-glow" aria-hidden="true" />
        </div>

        <h1 className="hero-name reveal" style={{ '--delay': '180ms' }}>
          {site.name}
          <span className="hero-name-cursor" aria-hidden="true" />
        </h1>

        <p className="hero-tagline reveal" style={{ '--delay': '260ms' }}>
          <span className="hero-tagline-mark">&lt;</span>
          {site.tagline}
          <span className="hero-tagline-mark">/&gt;</span>
        </p>

        <p className="hero-desc reveal" style={{ '--delay': '330ms' }}>
          {site.description}
        </p>

        <div className="hero-chips reveal" style={{ '--delay': '400ms' }}>
          {site.chips
            .filter((c) => c && c.value)
            .map((c) => (
              <span className="chip" key={c.id || c.label}>
                <Icon name={c.icon || 'dot'} size={13} />
                <span className="chip-label">{c.label}</span>
                <span className="chip-value">{c.value}</span>
              </span>
            ))}
        </div>

        <div className="hero-links reveal" style={{ '--delay': '470ms' }}>
          {site.extraLinks
            .filter((l) => l && l.enabled !== false)
            .map((l) => (
              <a
                key={l.name}
                className="hero-link"
                href={l.url}
                target="_blank"
                rel="noreferrer noopener"
              >
                <Icon name={l.icon || 'link'} size={15} />
                {l.name}
              </a>
            ))}
          <button className="hero-link hero-link--btn" onClick={() => scrollToSection(nextSection)}>
            <Icon name="steam" size={15} />
            Steam Profile
          </button>
        </div>
      </div>

      <button className="scroll-hint" onClick={() => scrollToSection(nextSection)}>
        <span className="scroll-hint-text">scroll to explore</span>
        <span className="scroll-hint-arrow" aria-hidden="true">
          <Icon name="arrowDown" size={18} />
        </span>
      </button>
    </section>
  );
}
