import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { music } from '../config/music';
import { localPlaylist } from '../data/localPlaylist';
import Icon from './Icons';

const POS_KEY = 'mybio:player:pos';
const VOL_KEY = 'mybio:player:volume';
const MODE_KEY = 'mybio:player:mode';

const SPOTIFY_ID_RE = /(playlist|album|track)\/([A-Za-z0-9]{10,})/;

/**
 * Путь к файлу относительно корня сайта.
 * На GitHub Pages сайт лежит в /<repo>/, поэтому абсолютный путь
 * /music/... указал бы на корень домена. Используем BASE_URL.
 */
const asset = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${String(path).replace(/^\/+/, '')}`;
};

/** Разбирает ссылку на Spotify и достаёт тип + id. */
export function parseSpotifyUrl(url) {
  if (!url) return null;
  const m = String(url).match(SPOTIFY_ID_RE);
  if (!m) return null;
  return { type: m[1], id: m[2] };
}

/** Читает обложку/название плейлиста через oEmbed (с запасным прокси). */
async function loadSpotifyMeta(url) {
  const api = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
  const proxies = [api, `https://api.allorigins.win/raw?url=${encodeURIComponent(api)}`];
  for (const p of proxies) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(p, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const json = await res.json();
      if (json && json.title) {
        return {
          title: json.title || 'Spotify Playlist',
          author: json.author_name || 'Spotify',
          cover: json.thumbnail_url || '',
        };
      }
    } catch {
      /* следующий прокси */
    }
  }
  return null;
}

export default function MusicPlayer() {
  /* ── Источник ───────────────────────────────────────────── */
  const spotifyInfo = useMemo(() => parseSpotifyUrl(music.spotify.playlistUrl), []);
  const hasLocal = localPlaylist.length > 0;

  const initialMode = useMemo(() => {
    if (music.mode === 'local') return 'local';
    if (music.mode === 'spotify') return 'spotify';
    // auto: если есть свои MP3 — играем их (полное управление),
    // иначе пробуем Spotify
    return hasLocal ? 'local' : spotifyInfo ? 'spotify' : 'local';
  }, [music.mode, spotifyInfo, hasLocal]);

  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem(MODE_KEY);
    if (saved === 'local' || saved === 'spotify') {
      if (saved === 'spotify' && !spotifyInfo) return 'local';
      if (saved === 'local' && !hasLocal) return spotifyInfo ? 'spotify' : 'local';
      return saved;
    }
    return initialMode;
  });

  /* ── Локальные треки ────────────────────────────────────── */
  const [tracks] = useState(localPlaylist);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const saved = Number(localStorage.getItem(VOL_KEY));
    return Number.isFinite(saved) && saved >= 0 && saved <= 1 ? saved : music.local.volume;
  });
  const [shuffle, setShuffle] = useState(music.local.shuffle);
  const [repeat, setRepeat] = useState(music.local.repeat);

  /* ── Интерфейс ──────────────────────────────────────────── */
  const [expanded, setExpanded] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [meta, setMeta] = useState(null);
  const [embedAutoplay, setEmbedAutoplay] = useState(false);

  const audioRef = useRef(null);
  const rootRef = useRef(null);
  const dragRef = useRef(null);
  const posRef = useRef(null);
  const [pos, setPos] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(POS_KEY) || 'null');
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) return saved;
    } catch {
      /* ignore */
    }
    return null;
  });

  const track = tracks[index] || null;

  /* ── Spotify embed ──────────────────────────────────────── */
  const embedUrl = useMemo(() => {
    if (mode !== 'spotify' || !spotifyInfo) return '';
    const base = `https://open.spotify.com/embed/${spotifyInfo.type}/${spotifyInfo.id}`;
    const params = new URLSearchParams({
      utm_source: 'generator',
      theme: String(music.spotify.theme),
    });
    if (embedAutoplay) params.set('autoplay', '1');
    return `${base}?${params.toString()}`;
  }, [mode, spotifyInfo, embedAutoplay]);

  useEffect(() => {
    if (mode !== 'spotify' || !music.spotify.playlistUrl) return;
    let alive = true;
    loadSpotifyMeta(music.spotify.playlistUrl).then((data) => {
      if (alive && data) setMeta(data);
    });
    return () => {
      alive = false;
    };
  }, [mode]);

  /* ── Локальное воспроизведение ──────────────────────────── */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    localStorage.setItem(VOL_KEY, String(volume));
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || mode !== 'local' || !track) return;

    audio.src = asset(track.src);
    audio.load();
    setTime(0);
    setDuration(0);

    if (playing) {
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          setPlaying(false);
          setNotice('Не удалось начать воспроизведение');
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, mode, track?.src]);

  const play = useCallback(() => {
    if (mode === 'local') {
      if (!track) {
        setNotice('Добавь MP3 в public/music/ и пропиши их в localPlaylist.js');
        setExpanded(true);
        return;
      }
      const audio = audioRef.current;
      if (!audio) return;
      audio.volume = volume;
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => setNotice('Браузер заблокировал автозапуск — нажми ещё раз'));
      }
      setPlaying(true);
    } else {
      // Spotify: официальный плеер внутри панели
      setExpanded(true);
      setPlaying((v) => !v);
    }
  }, [mode, track, volume]);

  const pause = useCallback(() => {
    if (mode === 'local') audioRef.current?.pause();
    setPlaying(false);
  }, [mode]);

  const toggle = () => (playing ? pause() : play());

  const next = useCallback(() => {
    if (mode !== 'local' || tracks.length === 0) return;
    setIndex((i) => {
      if (shuffle) {
        let n = i;
        while (tracks.length > 1 && n === i) n = Math.floor(Math.random() * tracks.length);
        return n;
      }
      return (i + 1) % tracks.length;
    });
  }, [mode, tracks.length, shuffle]);

  const prev = useCallback(() => {
    if (mode !== 'local' || tracks.length === 0) return;
    setIndex((i) => (i - 1 + tracks.length) % tracks.length);
  }, [mode, tracks.length]);

  /* Клавиатура: Space — play/pause, Shift+стрелки — переключение */
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.code === 'ArrowRight' && e.shiftKey) {
        next();
      } else if (e.code === 'ArrowLeft' && e.shiftKey) {
        prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* ── Перетаскивание (только за шапку: картинка + название) ── */
  const onPointerDown = (e) => {
    if (e.button != null && e.button !== 0) return;
    if (!e.target.closest('.player-head')) return;
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top, moved: false };
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    el.classList.add('is-dragging');
  };

  const onPointerMove = (e) => {
    const drag = dragRef.current;
    const el = rootRef.current;
    if (!drag || !el) return;
    drag.moved = true;
    const rect = el.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;
    const x = Math.min(Math.max(0, e.clientX - drag.dx), Math.max(0, maxX));
    const y = Math.min(Math.max(0, e.clientY - drag.dy), Math.max(0, maxY));
    posRef.current = { x, y };
    setPos({ x, y });
  };

  const endDrag = (e) => {
    const el = rootRef.current;
    if (el) {
      el.classList.remove('is-dragging');
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    if (dragRef.current && posRef.current) {
      localStorage.setItem(POS_KEY, JSON.stringify(posRef.current));
    }
    dragRef.current = null;
  };

  /* Клик по шапке — раскрыть/свернуть панель */
  const onHeadClick = (e) => {
    if (e.target.closest('button, a, input')) return;
    setExpanded((v) => !v);
  };

  /* ── Громкость (hover на десктопе, тап на мобильных) ────── */
  const [isTouch] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches
  );

  /* ── Позиция не должна уезжать за экран ─────────────────── */
  useEffect(() => {
    const clamp = () => {
      const el = rootRef.current;
      if (!el || !posRef.current) return;
      const rect = el.getBoundingClientRect();
      const x = Math.min(Math.max(0, posRef.current.x), Math.max(0, window.innerWidth - rect.width));
      const y = Math.min(Math.max(0, posRef.current.y), Math.max(0, window.innerHeight - rect.height));
      if (x !== posRef.current.x || y !== posRef.current.y) {
        posRef.current = { x, y };
        setPos({ x, y });
        localStorage.setItem(POS_KEY, JSON.stringify({ x, y }));
      }
    };
    window.addEventListener('resize', clamp);
    return () => window.removeEventListener('resize', clamp);
  }, []);

  const switchMode = (nextMode) => {
    if (nextMode === 'spotify' && !spotifyInfo) return;
    if (nextMode === 'local' && !hasLocal) {
      setNotice('Локальных треков нет — добавь MP3 в public/music/');
      return;
    }
    pause();
    setMode(nextMode);
    localStorage.setItem(MODE_KEY, nextMode);
  };

  /** Кнопка Spotify: открывает плейлист и пытается запустить воспроизведение */
  const openSpotify = () => {
    if (!spotifyInfo) return;
    if (mode !== 'spotify') {
      pause();
      setMode('spotify');
      localStorage.setItem(MODE_KEY, 'spotify');
    }
    setExpanded(true);
    setEmbedAutoplay(true);
  };

  const progress = duration > 0 ? (time / duration) * 100 : 0;

  const title = mode === 'spotify' ? meta?.title || 'Spotify Playlist' : track?.title || 'No track';
  const artist = mode === 'spotify' ? meta?.author || 'Spotify' : track?.artist || 'local playlist';
  const cover = mode === 'spotify' ? meta?.cover || '' : asset(track?.cover);

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onEnded={() => {
          if (repeat) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
          } else next();
        }}
        onError={() => setPlaying(false)}
        preload="none"
      />

      <div
        ref={rootRef}
        className={`player ${expanded ? 'is-expanded' : ''} ${
          mode === 'spotify' ? 'is-spotify' : 'is-local'
        }`}
        style={pos ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' } : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="region"
        aria-label="Музыкальный плеер"
      >
        {/* Прогресс (тонкая полоса сверху) */}
        <div
          className="player-progress"
          onClick={(e) => {
            if (mode !== 'local' || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = Math.min(Math.max(0, (e.clientX - rect.left) / rect.width), 1);
            audioRef.current.currentTime = ratio * duration;
          }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label="Прогресс воспроизведения"
        >
          <span
            className={`player-progress-fill ${mode === 'spotify' && playing ? 'is-live' : ''}`}
            style={{ width: mode === 'spotify' ? (playing ? '100%' : '0%') : `${progress}%` }}
          />
        </div>

        {/* Шапка: картинка + название (за неё можно тянуть) */}
        <div className="player-head" onClick={onHeadClick}>
          <div className={`player-cover ${cover ? '' : 'is-placeholder'}`}>
            {cover ? (
              <img src={cover} alt="" />
            ) : (
              <span className="player-cover-pixel" aria-hidden="true" />
            )}
          </div>

          <div className="player-meta">
            <span className="player-title">{title}</span>
            <span className="player-artist">{artist}</span>
          </div>

          <span className="player-grip" aria-hidden="true">
            <Icon name="music" size={13} />
          </span>
        </div>

        {/* Управление */}
        <div className="player-bar">
          <button
            className="player-btn"
            onClick={prev}
            disabled={mode === 'spotify'}
            aria-label="Предыдущий трек"
            title={mode === 'spotify' ? 'Доступно в панели Spotify' : 'Предыдущий трек'}
          >
            <Icon name="prev" size={15} />
          </button>

          <button
            className="player-btn player-btn--main"
            onClick={toggle}
            aria-label={playing ? 'Пауза' : 'Воспроизвести'}
            title={playing ? 'Пауза (Space)' : 'Play (Space)'}
          >
            <span className={`player-eq ${playing ? 'is-playing' : ''}`} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <Icon name={playing ? 'pause' : 'play'} size={16} className="player-btn-glyph" />
          </button>

          <button
            className="player-btn"
            onClick={next}
            disabled={mode === 'spotify'}
            aria-label="Следующий трек"
            title={mode === 'spotify' ? 'Доступно в панели Spotify' : 'Следующий трек'}
          >
            <Icon name="next" size={15} />
          </button>

          <button
            className={`player-btn ${shuffle ? 'is-on' : ''}`}
            onClick={() => setShuffle((v) => !v)}
            aria-label="Перемешать"
            title="Перемешать"
            disabled={mode === 'spotify'}
          >
            <Icon name="shuffle" size={14} />
          </button>
          <button
            className={`player-btn ${repeat ? 'is-on' : ''}`}
            onClick={() => setRepeat((v) => !v)}
            aria-label="Повтор"
            title="Повтор"
            disabled={mode === 'spotify'}
          >
            <Icon name="repeat" size={14} />
          </button>

          <span className="player-sep" aria-hidden="true" />

          <button
            className={`player-btn ${mode === 'spotify' ? 'is-on' : ''}`}
            onClick={openSpotify}
            aria-label="Открыть плейлист Spotify"
            title={mode === 'local' ? 'Открыть плейлист Spotify' : 'Обновить плейлист Spotify'}
            disabled={!spotifyInfo}
          >
            <Icon name="spotifyGlyph" size={15} />
          </button>

          <div className="player-volume">
            <div
              className={`player-volume-panel ${volumeOpen ? 'is-open' : ''}`}
              onMouseEnter={() => !isTouch && setVolumeOpen(true)}
              onMouseLeave={() => !isTouch && setVolumeOpen(false)}
            >
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                style={{ '--value': Math.round(volume * 100) }}
                aria-label="Громкость"
                disabled={mode === 'spotify'}
                title={mode === 'spotify' ? 'В режиме Spotify громкость — во встроенном плеере' : 'Громкость'}
              />
            </div>

            <button
              className={`player-btn player-volume-trigger ${volumeOpen ? 'is-visible' : ''}`}
              onClick={() => (isTouch ? setVolumeOpen((v) => !v) : setVolumeOpen(true))}
              onMouseEnter={() => !isTouch && setVolumeOpen(true)}
              aria-label="Громкость"
              title="Громкость"
            >
              <Icon name={volume === 0 ? 'volumeMute' : 'volume'} size={15} />
            </button>
          </div>
        </div>

        {/* Расширенная панель */}
        <div className="player-panel">
          <div className="player-times">
            <span>{mode === 'local' ? formatTime(time) : '—'}</span>
            <span>{mode === 'local' ? formatTime(duration) : 'live'}</span>
          </div>
        </div>

        {expanded && (
          <div className="player-panel">
            {notice && (
              <p className="player-notice" role="status">
                {notice}
              </p>
            )}

            {mode === 'spotify' && embedUrl && music.spotify.showInPanel && (
              <div className="player-embed">
                <iframe
                  key={embedUrl}
                  title="Spotify player"
                  src={embedUrl}
                  width="100%"
                  height="152"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
              </div>
            )}

            {mode === 'local' && !hasLocal && (
              <p className="player-notice">
                Пока нет локальных треков. Добавь MP3 в <code>public/music/</code> и опиши их в{' '}
                <code>src/data/localPlaylist.js</code>.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
