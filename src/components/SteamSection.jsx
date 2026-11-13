import { useEffect, useRef } from 'react';
import { site } from '../config/site';
import { useReveal } from '../lib/hooks';
import Icon from './Icons';

const STATE_LABELS = {
  online: 'Online',
  offline: 'Offline',
  busy: 'Busy',
  away: 'Away',
  snooze: 'Snooze',
  lookingtoplay: 'Looking to play',
  lookingtowork: 'Looking to work',
};

/**
 * Вторая секция — Steam Profile.
 * Показывает реальные данные профиля (ник, аватар, статус, город).
 */
export default function SteamSection({ steam }) {
  const ref = useReveal('.reveal');

  useEffect(() => {
    ref.current?.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.setProperty('--delay', `${i * 70}ms`);
    });
  }, [ref]);

  const profileUrl = steam?.profileUrl || `https://steamcommunity.com/profiles/${steam?.id64}`;
  const isOnline = steam?.onlineState === 'online';

  return (
    <section id="steam" className="section steam-section" ref={ref}>
      <div className="container">
        <header className="section-head reveal">
          <span className="section-label">02 — Steam Profile</span>
          <h2 className="section-title">
            my <span className="accent">steam</span> page
          </h2>
          <p className="section-sub">
            Живые данные профиля: аватар, ник, статус в сети и история аккаунта.
          </p>
        </header>

        <div className="steam-card reveal">
          <div className="steam-card-glow" aria-hidden="true" />

          <div className="steam-avatar-col">
            <div className={`steam-avatar ${isOnline ? 'is-online' : ''}`}>
              <img
                src={steam?.avatarFull || site.steam.fallbackAvatar || site.avatarFallback}
                alt={`Steam аватар ${steam?.name || site.name}`}
                loading="lazy"
              />
              <span className="steam-avatar-status" aria-hidden="true" />
            </div>
            <span className="steam-avatar-label">avatar</span>
          </div>

          <div className="steam-info">
            <div className="steam-info-head">
              <h3 className="steam-name">{steam?.name || site.name}</h3>
              <span className={`steam-status ${isOnline ? 'is-online' : 'is-offline'}`}>
                <span className="steam-status-dot" aria-hidden="true" />
                {STATE_LABELS[steam?.onlineState] || 'Offline'}
              </span>
            </div>

            {steam?.realname && <p className="steam-realname">real name: {steam.realname}</p>}

            <div className="steam-meta">
              {steam?.memberSince && (
                <div className="steam-meta-item">
                  <Icon name="signal" size={13} />
                  <span className="steam-meta-label">member since</span>
                  <span className="steam-meta-value">{steam.memberSince}</span>
                </div>
              )}
              {steam?.location && (
                <div className="steam-meta-item">
                  <Icon name="globe" size={13} />
                  <span className="steam-meta-label">location</span>
                  <span className="steam-meta-value">{steam.location}</span>
                </div>
              )}
              {steam?.vanity && (
                <div className="steam-meta-item">
                  <Icon name="code" size={13} />
                  <span className="steam-meta-label">vanity url</span>
                  <span className="steam-meta-value">{steam.vanity}</span>
                </div>
              )}
            </div>

            {steam?.games?.length > 0 && (
              <div className="steam-games">
                <span className="steam-games-label">most played</span>
                <div className="steam-games-list">
                  {steam.games.map((g) => (
                    <span className="steam-game" key={g}>
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="steam-actions">
              <a
                className="btn btn-primary"
                href={profileUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                <Icon name="steam" size={16} />
                View profile
                <Icon name="external" size={14} className="btn-ext" />
              </a>
              <a
                className="btn btn-ghost"
                href={`${profileUrl}/friends/add/`}
                target="_blank"
                rel="noreferrer noopener"
              >
                <Icon name="link" size={15} />
                Add friend
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
