import { DURATION, EASE } from './motion-blitz/springs.js';

export const MOTION_KINDS = ['headline', 'badge', 'scrubber', 'margin-card', 'search'] as const;
export type MotionKind = (typeof MOTION_KINDS)[number];

export type MotionIntensity = {
  severity: number;
  scale: number;
  travel: number;
  duration: number;
  ease: string;
  gsapEase: string;
};

/** data-severity is 1–5. Missing or invalid values fall back to 3 (mid). */
export function parseSeverity(value: string | null | undefined): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.max(1, Math.min(5, Math.round(n)));
}

export function intensityFor(severityRaw: string | null | undefined, kind: MotionKind): MotionIntensity {
  const severity = parseSeverity(severityRaw);
  const scale = 0.55 + severity * 0.15;
  const travel = kind === 'headline' ? 6 + severity * 2 : kind === 'badge' ? 0.04 + severity * 0.02 : 8 + severity * 2;
  const duration = (kind === 'badge' ? DURATION.short : kind === 'headline' ? DURATION.medium : DURATION.short) * (0.85 + severity * 0.05);
  const easeName = kind === 'badge' ? 'overshoot' : kind === 'search' ? 'emphasized' : 'enter';
  const ease = EASE[easeName] ?? EASE.enter;
  return {
    severity,
    scale,
    travel,
    duration,
    ease: ease.css,
    gsapEase: ease.gsap,
  };
}

export function isMotionKind(value: string | null | undefined): value is MotionKind {
  return (MOTION_KINDS as readonly string[]).includes(value || '');
}

/**
 * Bind data-motion hooks. Safe no-op when no matching nodes exist.
 * Respects prefers-reduced-motion: existing elements stay in their natural state.
 */
export function bindMotionHooks(root: ParentNode = document, opts?: { reduced?: boolean }): () => void {
  const reduced = opts?.reduced ?? (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const cleanups: Array<() => void> = [];

  const enhance = (el: HTMLElement) => {
    if (el.dataset.motionBound === '1') return;
    if (!isMotionKind(el.dataset.motion || null)) return;
    el.dataset.motionBound = '1';
    const kind = el.dataset.motion as MotionKind;
    const intensity = intensityFor(el.dataset.severity, kind);
    el.style.setProperty('--motion-severity', String(intensity.severity));
    el.style.setProperty('--motion-scale', String(intensity.scale));
    el.style.setProperty('--motion-travel', `${intensity.travel}px`);
    el.style.setProperty('--motion-duration', `${Math.round(intensity.duration * 1000)}ms`);
    el.style.setProperty('--motion-ease', intensity.ease);
    if (reduced) return;

    if (kind === 'headline' || kind === 'badge') {
      const inView = el.getBoundingClientRect().top < window.innerHeight;
      if (inView) {
        el.classList.remove('is-pending');
        el.classList.add('is-in');
      } else if (!el.classList.contains('is-in')) {
        el.classList.add('is-pending');
      }
      if (el.classList.contains('is-in')) return;
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            el.classList.remove('is-pending');
            el.classList.add('is-in');
            io.unobserve(el);
          }
        },
        { threshold: 0.2 },
      );
      io.observe(el);
      cleanups.push(() => io.disconnect());
    }

    if (kind === 'scrubber') {
      const onScroll = () => {
        const rect = el.getBoundingClientRect();
        const total = Math.max(1, rect.height + window.innerHeight);
        const progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / total));
        el.style.setProperty('--motion-progress', progress.toFixed(4));
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      cleanups.push(() => window.removeEventListener('scroll', onScroll));
    }
  };

  const scan = () => {
    const nodes = root.querySelectorAll<HTMLElement>('[data-motion]');
    if (!nodes.length) return;
    for (const node of nodes) enhance(node);
  };

  scan();

  const canObserve =
    typeof MutationObserver === 'function' &&
    (root instanceof Element || (typeof Document !== 'undefined' && root instanceof Document));
  if (canObserve) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.hasAttribute('data-motion')) enhance(node);
          const nested = node.querySelectorAll('[data-motion]');
          for (const child of nested) enhance(child as HTMLElement);
        }
      }
    });
    const target = typeof document !== 'undefined' && root === document ? document.body : (root as Element);
    if (target) {
      observer.observe(target, { childList: true, subtree: true });
      cleanups.push(() => observer.disconnect());
    }
  }

  return () => {
    for (const stop of cleanups) stop();
  };
}
