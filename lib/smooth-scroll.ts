type LenisInstance = {
  raf: (time: number) => void;
  on: (event: string, handler: () => void) => void;
  off: (event: string, handler: () => void) => void;
  resize: () => void;
  scrollTo: (target: number | string, opts?: { immediate?: boolean }) => void;
  destroy: () => void;
};

function shouldEnableSmooth(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  // Native scrolling is more reliable on touch-first devices (overscroll, rubber-band, keyboard).
  if (window.matchMedia('(pointer: coarse)').matches) return false;
  return true;
}

/**
 * Lenis + GSAP ScrollTrigger, layered on top of the existing ViewTransition
 * template. Disabled under reduced motion and on coarse pointers. Native
 * anchors, keyboard scrolling, and the browser's scroll restoration stay intact.
 */
export async function startSmoothScroll(): Promise<() => void> {
  if (typeof window === 'undefined') return () => {};

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarseQuery = window.matchMedia('(pointer: coarse)');
  let stopActive = () => {};

  const sync = async () => {
    stopActive();
    stopActive = () => {};
    if (!shouldEnableSmooth()) return;

    const [{ default: Lenis }, gsapMod, scrollMod] = await Promise.all([
      import('lenis'),
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]);
    const gsap = gsapMod.gsap ?? gsapMod.default;
    const ScrollTrigger = scrollMod.ScrollTrigger ?? scrollMod.default;
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      anchors: true,
      autoRaf: false,
      // Keep wheel smoothing only. Touch stays with the browser when this path is reached.
      syncTouch: false,
    }) as unknown as LenisInstance;

    const onScroll = () => ScrollTrigger.update();
    lenis.on('scroll', onScroll);
    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const syncNative = () => {
      lenis.resize();
      // Honour whatever the browser just restored or jumped to.
      lenis.scrollTo(window.scrollY, { immediate: true });
    };
    window.addEventListener('pageshow', syncNative);
    window.addEventListener('popstate', syncNative);
    window.addEventListener('hashchange', syncNative);

    stopActive = () => {
      window.removeEventListener('pageshow', syncNative);
      window.removeEventListener('popstate', syncNative);
      window.removeEventListener('hashchange', syncNative);
      gsap.ticker.remove(tick);
      lenis.off('scroll', onScroll);
      lenis.destroy();
    };
  };

  await sync();
  const onChange = () => {
    void sync();
  };
  motionQuery.addEventListener('change', onChange);
  coarseQuery.addEventListener('change', onChange);

  return () => {
    motionQuery.removeEventListener('change', onChange);
    coarseQuery.removeEventListener('change', onChange);
    stopActive();
  };
}
