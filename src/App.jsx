import { useEffect, useState } from 'react';
import { site } from './config/site';
import { loadSteamProfile, loadSteamStatus, staticSteamProfile } from './lib/steam';
import smoothScroll from './lib/smoothScroll';
import Nav, { SectionIndicator } from './components/Nav';
import Hero from './components/Hero';
import SteamSection from './components/SteamSection';
import SocialsSection from './components/SocialsSection';
import MusicPlayer from './components/MusicPlayer';
import Cursor from './components/Cursor';

export default function App() {
  const [steam, setSteam] = useState(() => staticSteamProfile());
  const [steamLive, setSteamLive] = useState(false);
  const [steamChecking, setSteamChecking] = useState(true);

  useEffect(() => {
    let alive = true;

    // 1) Свежий статус из GitHub (обновляется каждые 5 минут)
    loadSteamStatus().then((status) => {
      if (!alive || !status) return;
      setSteam((prev) => ({
        ...prev,
        onlineState: status.state,
        stateMessage: status.stateMessage || status.state,
        avatarFull: status.avatar || prev.avatarFull,
        name: status.name || prev.name,
      }));
      setSteamLive(true);
      setSteamChecking(false);
    });

    // 2) Дополнительно пробуем профиль напрямую (бывает точнее по времени)
    loadSteamProfile().then((data) => {
      if (!alive || !data) {
        setSteamChecking(false);
        return;
      }
      setSteam({ ...data, name: data.vanity || data.id64 });
      setSteamLive(true);
      setSteamChecking(false);
    });

    return () => {
      alive = false;
    };
  }, []);

  // Плавная инерционная прокрутка
  useEffect(() => {
    smoothScroll.init();
    return () => smoothScroll.destroy();
  }, []);

  return (
    <div className="app">
      <Cursor />
      <Nav sections={site.sections} />
      <SectionIndicator />
      <main className="app-main">
        <Hero steam={steam} steamLive={steamLive} steamChecking={steamChecking} />
        {site.steam.enabled && (
          <SteamSection steam={steam} steamLive={steamLive} steamChecking={steamChecking} />
        )}
        <SocialsSection steam={steam} />
      </main>
      <MusicPlayer />
      <footer className="footer">
        <div className="container footer-inner">
          <span className="footer-copy">
            © {new Date().getFullYear()} {site.name}
          </span>
          <span className="footer-dot" aria-hidden="true" />
          <span className="footer-copy footer-muted">built with react + vite</span>
        </div>
      </footer>
    </div>
  );
}
