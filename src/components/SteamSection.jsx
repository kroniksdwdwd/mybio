import { useEffect } from 'react';
import { site } from '../config/site';
import { useReveal } from '../lib/hooks';
import { useInView } from '../lib/useInView';
import Icon from './Icons';
import Typewriter from './Typewriter';

/**
 * Вторая секция — Steam Profile.
 * Показывает реальные данные: ник, аватар, статус, город, игры.
 */
export default function SteamSection({ steam, steamChecking }) {
  const sectionRef = useReveal('.reveal');
  const [titleRef, titleVisible] = useInView({ threshold: 0.35 });

  useEffect(() => {
    sectionRef.current?.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.setProperty('--delay', `${i * 90}ms`);
    });
  }, [sectionRef]);

  const isOnline = steam?.onlineState === 'online';
  const profileUrl = `https://steamcommunity.com/profiles/${steam?.id64}`;

  return (
    <section id="steam" className="steam-section" ref={sectionRef}>
      <div className="container">
        <div className="section-head" ref={titleRef}>
          <span className="section-kicker reveal">02 / Steam</span>
          <h2 className="section-title">
            <Typewriter
              segments={[
                { text: 'my ' },
                { text: 'steam', accent: true },
                { text: ' page' },
              ]}
              start={titleVisible}
              speed={34}
            />
          </h2>
        </div>

        <div className="steam-card reveal">
          <div className="steam-avatar-col reveal-media">
            <div className={`steam-avatar ${isOnline ? 'is-online' : ''}`}>
              <img src={steam?.avatarFull || steam?.avatarIcon || site.avatarFallback} alt="" />
              <span className="steam-avatar-dot" />
            </div>
            <span className="steam-avatar-label">{steam?.vanity || 'steam'}</span>
          </div>

          <div className="steam-info">
            <div className="steam-name-row">
              <h3 className="steam-name">
                {steam?.name || 'Steam user'}
              </h3>
            </div>

            {steam?.realname && <p className="steam-realname">{steam.realname}</p>}

            <div className="steam-meta">
              <div className="steam-meta-item">
                <span className="steam-meta-label">Member since</span>
                <span className="steam-meta-value">{steam?.memberSince || '—'}</span>
              </div>
              <div className="steam-meta-item">
                <span className="steam-meta-label">Location</span>
                <span className="steam-meta-value">{steam?.location || '—'}</span>
              </div>
              <div className="steam-meta-item">
                <span className="steam-meta-label">Games</span>
                <span className="steam-meta-value">{steam?.games?.length || 0} tracked</span>
              </div>
            </div>

            <div className="steam-games">
              {steam?.games?.slice(0, 6).map((game) => (
                <div className="game-tile" key={game.name}>
                  <div className="game-tile-cover">
                    {game.cover || game.icon || game.logo ? (
                      <img src={game.cover || game.icon || game.logo} alt={game.name} loading="lazy" />
                    ) : (
                      <span className="game-tile-fallback" aria-hidden="true" />
                    )}
                  </div>
                  <span className="game-tile-name">{game.name}</span>

                  {/* Карточка с часами и ачивками — появляется при наведении */}
                  <div className="game-card">
                    <span className="game-card-title">{game.name}</span>

                    <div className="game-card-row">
                      <Icon name="signal" size={13} />
                      <span className="game-card-label">Всего часов</span>
                      <span className="game-card-value">{Math.round(game.hoursTotal || 0)} ч</span>
                    </div>

                    <div className="game-card-row">
                      <Icon name="code" size={13} />
                      <span className="game-card-label">За 2 недели</span>
                      <span className="game-card-value">{game.hours2wk || 0} ч</span>
                    </div>

                    {game.achievements?.total > 0 && (
                      <div className="game-card-row">
                        <Icon name="check" size={13} />
                        <span className="game-card-label">Ачивок</span>
                        <span className="game-card-value">
                          {game.achievements.achieved} / {game.achievements.total}
                        </span>
                      </div>
                    )}

                    <div className="game-card-bar">
                      <span
                        style={{
                          width: `${
                            game.achievements?.total
                              ? Math.round(
                                  (game.achievements.achieved / game.achievements.total) * 100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="steam-actions">
              <a className="btn btn-primary" href={profileUrl} target="_blank" rel="noreferrer noopener">
                View profile
                <Icon name="external" size={14} />
              </a>
              <a
                className="btn btn-ghost"
                href={`${profileUrl}/friends/add/`}
                target="_blank"
                rel="noreferrer noopener"
              >
                Add friend
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
