import { useEffect, useRef, useState } from 'react';

/**
 * Отслеживает появление элемента в зоне видимости.
 * При уходе из экрана состояние сбрасывается — поэтому анимации
 * (например печать текста) повторяются каждый раз при возврате.
 */
export function useInView({ threshold = 0.3, rootMargin = '0px' } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return undefined;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setInView(entry.isIntersecting);
        });
      },
      { threshold, rootMargin }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);

  return [ref, inView];
}
