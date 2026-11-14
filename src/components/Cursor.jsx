import { useEffect, useRef } from 'react';

/**
 * Кастомный курсор:
 *  — точка и кольцо двигаются на 60 fps через requestAnimationFrame;
 *  — точка сглаживается мгновенно-плавно, кольцо отстаёт;
 *  — за указателем остаются синие точки на фоне (висят 5 секунд).
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

    let raf = 0;
    const TRAIL_MAX = 70;

    const spawnTrail = (x, y) => {
      const container = document.querySelector('.cursor-trail');
      if (!container) return;
      while (container.childElementCount > TRAIL_MAX) {
        container.firstElementChild?.remove();
      }
      const el = document.createElement('span');
      el.className = 'cursor-trail-dot';
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      container.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    };

    const move = (x, y) => {
      state.tx = x;
      state.ty = y;

      if (dot.current) dot.current.style.opacity = '1';
      if (ring.current) ring.current.style.opacity = '1';

      // Точки на фоне — по пути указателя
      const now = performance.now();
      const distance = Math.hypot(x - state.lastSpawnX, y - state.lastSpawnY);
      if (distance > 10 && now - state.lastSpawnAt > 40) {
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
