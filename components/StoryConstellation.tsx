'use client';

import { useEffect, useRef, useState } from 'react';
import type { ConstellationGraph } from '@/lib/constellation.ts';
import { reducedMotion as prefersReducedMotion, hasWebGL } from '@/lib/motion-blitz/env.js';
import ConstellationList from './ConstellationList';

/**
 * Lazy home-page island. Three.js is imported only after the section is in
 * view, and only when WebGL is available and reduced motion is off.
 *
 * The `.constellation__stage` placeholder is rendered on first paint so the
 * reserved height in `app/motion.css` applies before the canvas mounts. The
 * list is then visually hidden with `.visually-hidden` (sr-only, not
 * display:none) and stays in the accessibility tree. Reduced-motion and
 * no-WebGL fallbacks drop the stage and show the list visibly.
 */
export default function StoryConstellation({ graph }: { graph: ConstellationGraph }) {
  const hostRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [useCanvas, setUseCanvas] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [Canvas, setCanvas] = useState<null | typeof import('./ConstellationCanvas').default>(null);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
      },
      { rootMargin: '120px 0px' },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (prefersReducedMotion() || !hasWebGL(1)) {
      setFallback(true);
      setUseCanvas(false);
    }
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => {
      if (media.matches) {
        setFallback(true);
        setUseCanvas(false);
      }
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!visible || fallback) return;
    if (prefersReducedMotion() || !hasWebGL(1)) {
      setFallback(true);
      setUseCanvas(false);
      return;
    }
    let cancelled = false;
    void import('./ConstellationCanvas').then((mod) => {
      if (cancelled) return;
      setCanvas(() => mod.default);
      setUseCanvas(true);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, fallback]);

  const showStage = !fallback;
  const showCanvas = Boolean(showStage && useCanvas && Canvas);

  return (
    <section className="constellation" ref={hostRef} aria-labelledby="constellation-heading">
      <h3 id="constellation-heading">Story constellation</h3>
      <p className="constellation__note">
        {graph.hasEditorLinks
          ? 'Edges come from editor-supplied related links on each story.'
          : 'No editor-supplied related links yet, so this map shows published stories as nodes with no edges. Story Editor will populate the related field.'}
      </p>
      {showCanvas && Canvas ? (
        <Canvas graph={graph} onUnavailable={() => { setFallback(true); setUseCanvas(false); }} />
      ) : showStage ? (
        <div className="constellation__stage" aria-hidden="true" />
      ) : null}
      <ConstellationList graph={graph} hidden={showStage} />
    </section>
  );
}
