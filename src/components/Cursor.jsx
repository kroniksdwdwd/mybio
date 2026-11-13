import { useEffect, useRef } from 'react';

/**
 * Ненавязчивый кастомный курсор: точка + кольцо с задержкой.
 * Работает только на устройствах с точным указателем.
 */
export default function Cursor() {
  const dot = useRef(null);
  const ring = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!fine.matches) return undefined;

    document.body.classList.add('cursor-custom');

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;

    const move = (x, y) => {
      mx = x;
      my = y;
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(loop);
    };

    const onOver = (e) => {
      const t = e.target;
      const interactive =
        t instanceof Element &&
        (t.closest('a, button, input, .social-card, .player, [data-interactive]') !== null);
      if (ring.current) ring.current.classList.toggle('is-hover', Boolean(interactive));
    };

    window.addEventListener('pointermove', (e) => move(e.clientX, e.clientY), { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('mouseleave', () => {
      if (dot.current) dot.current.style.opacity = '0';
      if (ring.current) ring.current.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      if (dot.current) dot.current.style.opacity = '1';
      if (ring.current) ring.current.style.opacity = '1';
    });

    return () => {
      document.body.classList.remove('cursor-custom');
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
