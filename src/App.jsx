import { useEffect, useState } from 'react';
import { site } from './config/site';
import { loadSteamProfile, staticSteamProfile } from './lib/steam';
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
    // Каждый раз при заходе спрашиваем Steam, он онлайн или нет
    loadSteamProfile().then((data) => {
      if (!alive) return;
      if (data) {
        setSteam({ ...data, name: data.vanity || data.id64 });
        setSteamLive(true);
      }
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
