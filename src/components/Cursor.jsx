import { useEffect, useRef } from 'react';

/**
 * Кастомный курсор:
 *  — точка и кольцо двигаются на 60 fps через requestAnimationFrame;
 *  — точка сглаживается мгновенно-плавно, кольцо отстаёт;
 *  — за указателем остаются синие точки на фоне (живут 5 секунд).
 *
 *  Время жизни точек считается в JS, поэтому эффект работает
 *  даже если в системе отключены анимации.
 */
export default function Cursor() {
  const dot = useRef(null);
  const ring = useRef(null);
  const trail = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!fine.matches) return undefined;

    document.body.classList.add('cursor-custom');

    const state = {
      tx: window.innerWidth / 2,
      ty: window.innerHeight / 2,
      dx: window.innerWidth / 2,
      dy: window.innerHeight / 2,
      rx: window.innerWidth / 2,
      ry: window.innerHeight / 2,
      lastSpawnX: window.innerWidth / 2,
      lastSpawnY: window.innerHeight / 2,
      lastSpawnAt: 0,
    };

    const LIFE = 5000; // сколько живёт точка, мс
    const FADE_IN = 140;
    const FADE_OUT = 900;
    const TRAIL_MAX = 80;

    const dots = [];
    let raf = 0;

    const spawnTrail = (x, y) => {
      const container = trail.current;
      if (!container) return;
      const el = document.createElement('span');
      el.className = 'cursor-trail-dot';
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.opacity = '0';
      container.appendChild(el);
      dots.push({ el, born: performance.now() });
      while (dots.length > TRAIL_MAX) {
        const old = dots.shift();
        old.el.remove();
      }
    };

    const move = (x, y) => {
      state.tx = x;
      state.ty = y;

      if (dot.current) dot.current.style.opacity = '1';
      if (ring.current) ring.current.style.opacity = '1';

      // Точки на фоне — по пути указателя
      const now = performance.now();
      const distance = Math.hypot(x - state.lastSpawnX, y - state.lastSpawnY);
      if (distance > 8 && now - state.lastSpawnAt > 35) {
        state.lastSpawnAt = now;
        state.lastSpawnX = x;
        state.lastSpawnY = y;
        spawnTrail(x, y);
      }
    };

    const loop = () => {
      // Точка: плавно, без задержки
      state.dx += (state.tx - state.dx) * 0.55;
      state.dy += (state.ty - state.dy) * 0.55;
      // Кольцо: отстаёт от указателя
      state.rx += (state.tx - state.rx) * 0.13;
      state.ry += (state.ty - state.ry) * 0.13;

      if (dot.current) {
        dot.current.style.transform = `translate3d(${state.dx.toFixed(2)}px, ${state.dy.toFixed(
          2
        )}px, 0)`;
      }
      if (ring.current) {
        ring.current.style.transform = `translate3d(${state.rx.toFixed(2)}px, ${state.ry.toFixed(
          2
        )}px, 0)`;
      }

      // Жизненный цикл точек на фоне (fade in → hold → fade out)
      const now = performance.now();
      for (let i = dots.length - 1; i >= 0; i -= 1) {
        const d = dots[i];
        const age = now - d.born;

        if (age >= LIFE) {
          d.el.remove();
          dots.splice(i, 1);
          continue;
        }

        let opacity = 0.85;
        let scale = 1;
        if (age < FADE_IN) {
          opacity = (0.85 * age) / FADE_IN;
          scale = 0.4 + (0.6 * age) / FADE_IN;
        } else if (age > LIFE - FADE_OUT) {
          const k = (LIFE - age) / FADE_OUT;
          opacity = 0.85 * k;
          scale = 0.35 + 0.65 * k;
        }

        d.el.style.opacity = opacity.toFixed(3);
        d.el.style.transform = `scale(${scale.toFixed(3)})`;
      }

      raf = requestAnimationFrame(loop);
    };

    const onOver = (e) => {
      const t = e.target;
      const interactive =
        t instanceof Element &&
        t.closest('a, button, input, .social-card, .player, [data-interactive]') !== null;
      if (ring.current) ring.current.classList.toggle('is-hover', Boolean(interactive));
    };

    const onLeave = () => {
      if (dot.current) dot.current.style.opacity = '0';
      if (ring.current) ring.current.style.opacity = '0';
    };
    const onEnter = () => {
      if (dot.current) dot.current.style.opacity = '1';
      if (ring.current) ring.current.style.opacity = '1';
    };

    const onPointerMove = (e) => move(e.clientX, e.clientY);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    // запасной вариант: если браузер/окно не отдаёт pointer-события
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    raf = requestAnimationFrame(loop);

    return () => {
      document.body.classList.remove('cursor-custom');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('pointerover', onOver);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      if (raf) cancelAnimationFrame(raf);
      dots.forEach((d) => d.el.remove());
    };
  }, []);

  return (
    <>
      <div ref={trail} className="cursor-trail" aria-hidden="true" />
      <div ref={ring} className="cursor-ring" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
