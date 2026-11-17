'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { bindMotionHooks } from '@/lib/motion-hooks.ts';
import { EASE, installCssSprings } from '@/lib/motion-blitz/springs.js';
import { startSmoothScroll } from '@/lib/smooth-scroll.ts';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function markReveals(): () => void {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (prefersReducedMotion()) {
    for (const node of nodes) {
      node.classList.remove('is-pending');
      node.classList.add('is-in');
    }
    return () => {};
  }

  const fold = window.innerHeight;
  const pending: HTMLElement[] = [];
  for (const node of nodes) {
    const top = node.getBoundingClientRect().top;
    if (top < fold) {
      node.classList.remove('is-pending');
      node.classList.add('is-in');
    } else {
      node.classList.add('is-pending');
      pending.push(node);
    }
  }

  if (!pending.length) return () => {};

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const target = entry.target as HTMLElement;
        target.classList.remove('is-pending');
        target.classList.add('is-in');
        observer.unobserve(target);
      }
    },
    { threshold: 0.14, rootMargin: '0px 0px -6% 0px' },
  );
  for (const node of pending) observer.observe(node);
  return () => observer.disconnect();
}

export default function MotionLayer() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('js');
    const apply = () => {
      const reduced = prefersReducedMotion();
      root.dataset.motion = reduced ? 'reduced' : 'full';
    };
    apply();
    if (!('startViewTransition' in document)) root.classList.add('no-vt');
    try {
      installCssSprings();
      for (const [name, ease] of Object.entries(EASE)) {
        root.style.setProperty(`--motion-${name}`, ease.css);
      }
    } catch {
      // CSS spring install is an enhancement only.
    }
    let cancelled = false;
    let stopScroll = () => {};
    void startSmoothScroll().then((stop) => {
      if (cancelled) stop();
      else stopScroll = stop;
    });
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    media.addEventListener('change', apply);
    return () => {
      cancelled = true;
      media.removeEventListener('change', apply);
      stopScroll();
    };
  }, []);

  useEffect(() => {
    const stopReveals = markReveals();
    const stopHooks = bindMotionHooks(document, { reduced: prefersReducedMotion() });
    return () => {
      stopReveals();
      stopHooks();
    };
  }, [pathname]);

  return null;
}
