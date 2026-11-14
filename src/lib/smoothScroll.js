/**
 * ============================================================
 *  Плавная инерционная прокрутка
 * ============================================================
 *  Колесо мыши не прыгает по экрану, а плавно «догоняет» цель.
 *  На тач-устройствах и при prefers-reduced-motion остаётся
 *  нативная прокрутка (там она и так плавная).
 * ============================================================
 */

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

class SmoothScroller {
  constructor() {
    this.enabled = false;
    this.target = 0;
    this.current = 0;
    this.raf = null;
    this.animating = false;
    this.tick = this.tick.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleKey = this.handleKey.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
  }

  get maxScroll() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  init() {
    if (this.enabled) return;
    if (typeof window === 'undefined') return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const touchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (reduceMotion || touchDevice) return;

    this.enabled = true;
    this.current = this.target = window.scrollY;

    window.addEventListener('wheel', this.handleWheel, { passive: false });
    window.addEventListener('keydown', this.handleKey);
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    window.addEventListener('resize', this.handleScroll);
  }

  destroy() {
    if (!this.enabled) return;
    window.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('keydown', this.handleKey);
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleScroll);
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.enabled = false;
  }

  handleWheel(event) {
    if (event.ctrlKey || event.defaultPrevented) return;
    event.preventDefault();

    let delta = event.deltaY;
    if (event.deltaMode === 1) delta *= 18;
    else if (event.deltaMode === 2) delta *= window.innerHeight;

    this.target = clamp(this.target + delta, 0, this.maxScroll);
    this.start();
  }

  handleKey(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    const page = window.innerHeight * 0.9;
    let next = null;

    switch (event.code) {
      case 'Space':
        next = this.target + (event.shiftKey ? -page : page);
        break;
      case 'ArrowDown':
        next = this.target + 90;
        break;
      case 'ArrowUp':
        next = this.target - 90;
        break;
      case 'PageDown':
        next = this.target + page;
        break;
      case 'PageUp':
        next = this.target - page;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = this.maxScroll;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.target = clamp(next, 0, this.maxScroll);
    this.start();
  }

  handleScroll() {
    // Внешний скролл (перетаскивание ползунка, якорь) — синхронизируемся
    if (this.animating) return;
    this.current = this.target = window.scrollY;
  }

  scrollTo(y) {
    const next = clamp(y, 0, this.maxScroll);
    if (!this.enabled) {
      window.scrollTo({ top: next, behavior: 'smooth' });
      return;
    }
    this.target = next;
    this.current = window.scrollY;
    this.start();
  }

  start() {
    if (this.raf) return;
    this.animating = true;
    this.raf = requestAnimationFrame(this.tick);
  }

  tick() {
    const diff = this.target - this.current;

    if (Math.abs(diff) < 0.6) {
      this.current = this.target;
      window.scrollTo(0, this.current);
      this.raf = null;
      this.animating = false;
      return;
    }

    this.current += diff * 0.12;
    window.scrollTo(0, this.current);
    this.raf = requestAnimationFrame(this.tick);
  }
}

export const smoothScroll = new SmoothScroller();
export default smoothScroll;
