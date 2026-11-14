import { useEffect, useState } from 'react';

/**
 * Печатающийся текст.
 * segments: [{ text: 'my ', accent?: false }, { text: 'steam', accent: true }]
 */
export default function Typewriter({
  segments = [],
  speed = 26,
  start = true,
  showCursor = true,
  className = '',
}) {
  const full = segments.map((s) => s.text).join('');
  const [len, setLen] = useState(start ? 0 : full.length);

  useEffect(() => {
    if (!start) {
      setLen(full.length);
      return undefined;
    }
    setLen(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setLen(i);
      if (i >= full.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, full]);

  // Набираем текст по сегментам, сохраняя оформление
  let left = len;
  const parts = segments.map((s) => {
    const take = Math.max(0, Math.min(s.text.length, left));
    left -= take;
    const text = s.text.slice(0, take);
    if (!text) return null;
    return s.accent ? (
      <span key={s.text} className="accent">
        {text}
      </span>
    ) : (
      <span key={s.text}>{text}</span>
    );
  });

  return (
    <span className={className}>
      {parts}
      {showCursor && <span className="type-cursor" aria-hidden="true" />}
    </span>
  );
}
