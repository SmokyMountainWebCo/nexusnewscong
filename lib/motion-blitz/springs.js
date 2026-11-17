// Motion Blitz — springs, CSS linear() easing, and a timing/easing preset library.
// Original code (MIT, see /LICENSE). Replaces: ai-kit CSS springs (idea only; no code used),
// and restates the timing guidance of motion-design-skill / hairline / anatomy in our own words.

/* ------------------------------------------------------------------ *
 * 1. Damped harmonic spring, solved analytically.
 *    stiffness k, damping c, mass m. x(0)=0 -> target 1, v(0)=velocity.
 * ------------------------------------------------------------------ */
export function springSolver({ stiffness = 170, damping = 26, mass = 1, velocity = 0 } = {}) {
  const w0 = Math.sqrt(stiffness / mass);            // natural frequency
  const zeta = damping / (2 * Math.sqrt(stiffness * mass)); // damping ratio
  const v0 = velocity;                                // initial velocity toward the target (units/s)
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return (t) => 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0 - v0) / wd) * Math.sin(wd * t)) ;
  }
  if (zeta === 1) return (t) => 1 - Math.exp(-w0 * t) * (1 + (w0 - v0) * t);
  const s = w0 * Math.sqrt(zeta * zeta - 1);
  const r1 = -zeta * w0 + s, r2 = -zeta * w0 - s;
  const A = (-v0 - r2) / (r1 - r2), B = 1 - A;  // x(t)= 1 - (A e^{r1 t} + B e^{r2 t}), x(0)=0, x'(0)=v0
  return (t) => 1 - (A * Math.exp(r1 * t) + B * Math.exp(r2 * t));
}

/** Time (s) until the spring stays within `eps` of rest. */
export function springDuration(opts = {}, eps = 0.001, maxT = 10) {
  const f = springSolver(opts), dt = 1 / 240;
  let lastOut = 0;
  for (let t = 0; t < maxT; t += dt) if (Math.abs(1 - f(t)) > eps) lastOut = t;
  return Math.min(maxT, lastOut + dt);
}

/** Spring defined by perceptual params: duration (s) and bounce (-1..1, 0 = critically damped). */
export function springFromFeel({ duration = 0.5, bounce = 0 } = {}) {
  const zeta = bounce >= 0 ? 1 - bounce : 1 / (1 + bounce);   // bounce<0 = overdamped
  const w0 = (2 * Math.PI) / Math.max(0.01, duration);
  return { stiffness: w0 * w0, damping: 2 * zeta * w0, mass: 1 };
}

/**
 * CSS linear() easing string sampled from a spring.
 * Usage: el.style.transition = `transform ${d}ms ${cssSpring({bounce:.25}).easing}`
 * Returns { easing, duration } (duration in ms). Falls back to a cubic-bezier when linear() is unsupported.
 */
export function cssSpring(opts = {}, { points = 40, precision = 4 } = {}) {
  const phys = opts.stiffness ? opts : springFromFeel(opts);
  const f = springSolver(phys);
  const dur = springDuration(phys);
  const stops = [];
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    stops.push(+f(t * dur).toFixed(precision));
  }
  stops[stops.length - 1] = 1;
  // drop collinear interior points to keep the string short
  const keep = [[0, stops[0]]];
  for (let i = 1; i < stops.length - 1; i++) {
    const a = keep[keep.length - 1], b = [i / points, stops[i]], c = [(i + 1) / points, stops[i + 1]];
    const interp = a[1] + (c[1] - a[1]) * ((b[0] - a[0]) / (c[0] - a[0]));
    if (Math.abs(interp - b[1]) > 0.002) keep.push(b);
  }
  keep.push([1, 1]);
  const easing = 'linear(' + keep.map(([x, y], i) => (i === 0 || i === keep.length - 1) ? `${y}` : `${y} ${(x * 100).toFixed(1)}%`).join(', ') + ')';
  return { easing, duration: Math.round(dur * 1000), fallback: 'cubic-bezier(.2,.8,.2,1)' };
}

export function supportsLinearEasing() {
  return typeof CSS !== 'undefined' && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)');
}

/** Register CSS custom properties --spring-<name> + --spring-<name>-ms on :root. */
export function installCssSprings(presets = SPRINGS, root = document.documentElement) {
  const ok = supportsLinearEasing();
  for (const [name, p] of Object.entries(presets)) {
    const s = cssSpring(p);
    root.style.setProperty(`--spring-${name}`, ok ? s.easing : s.fallback);
    root.style.setProperty(`--spring-${name}-ms`, `${s.duration}ms`);
  }
}

/** Integrating spring for live values (pointer, scroll). Critically damped by default. */
export class Spring {
  constructor(value = 0, { stiffness = 120, damping, mass = 1 } = {}) {
    this.x = value; this.target = value; this.v = 0; this.k = stiffness; this.m = mass;
    this.c = damping ?? 2 * Math.sqrt(stiffness * mass);
  }
  set(target) { this.target = target; return this; }
  jump(value) { this.x = this.target = value; this.v = 0; return this; }
  step(dt) {
    // semi-implicit Euler in sub-steps for stability
    const n = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / n;
    for (let i = 0; i < n; i++) {
      const a = (-this.k * (this.x - this.target) - this.c * this.v) / this.m;
      this.v += a * h; this.x += this.v * h;
    }
    return this.x;
  }
  get settled() { return Math.abs(this.x - this.target) < 1e-4 && Math.abs(this.v) < 1e-4; }
}

/* ------------------------------------------------------------------ *
 * 2. Presets
 * ------------------------------------------------------------------ */
export const SPRINGS = {
  snappy: { duration: 0.35, bounce: 0 },     // UI toggles, menus
  smooth: { duration: 0.6, bounce: 0 },      // panels, cards entering
  gentle: { duration: 0.9, bounce: 0.05 },   // hero copy, large surfaces
  bouncy: { duration: 0.55, bounce: 0.3 },   // playful confirmation, badges
  wobbly: { duration: 0.8, bounce: 0.45 },   // attention, rarely
};

/** cubic-bezier easings (CSS strings) + GSAP-equivalent names. */
export const EASE = {
  standard:   { css: 'cubic-bezier(.2,0,0,1)',    gsap: 'power2.out' },    // most UI movement
  enter:      { css: 'cubic-bezier(0,0,.2,1)',    gsap: 'power3.out' },    // things arriving: fast start, soft landing
  exit:       { css: 'cubic-bezier(.4,0,1,1)',    gsap: 'power2.in' },     // things leaving: gather, then go
  emphasized: { css: 'cubic-bezier(.2,0,0,1.0)',  gsap: 'expo.out' },      // hero moments
  anticipate: { css: 'cubic-bezier(.36,0,.66,-0.56)', gsap: 'back.in(1.7)' }, // wind-up before a move
  overshoot:  { css: 'cubic-bezier(.34,1.56,.64,1)',  gsap: 'back.out(1.7)' }, // settle past the mark
  linear:     { css: 'linear',                     gsap: 'none' },          // scrubbed / scroll-tied only
};

/** Durations in seconds, scaled by distance travelled and element size. */
export const DURATION = { micro: 0.12, short: 0.2, medium: 0.35, long: 0.6, hero: 0.9, cinematic: 1.6 };

/** Pick a duration for a move of `px` pixels (larger moves take longer, sublinearly). */
export function durationFor(px, { min = 0.18, max = 0.9 } = {}) {
  return Math.max(min, Math.min(max, 0.12 + Math.sqrt(Math.abs(px)) * 0.022));
}

/** Stagger for N items: total spread stays under ~0.5 s however many items there are. */
export function stagger(n, { each = 0.06, maxTotal = 0.5 } = {}) {
  return Math.min(each, maxTotal / Math.max(1, n - 1));
}

/* ------------------------------------------------------------------ *
 * 3. The 12 principles, as working rules for web + 3D motion.
 *    Each entry: what it means here, and the preset we reach for.
 * ------------------------------------------------------------------ */
export const PRINCIPLES = [
  { id: 'squash-stretch', rule: 'Volume stays constant while shape deforms. On the web: scaleY up / scaleX down on fast vertical moves, never more than ~12%.', use: { ease: 'overshoot', spring: 'bouncy' } },
  { id: 'anticipation', rule: 'A small counter-move before the main move tells the eye where to look. A 4–8% pull-back of 80–120 ms.', use: { ease: 'anticipate' } },
  { id: 'staging', rule: 'One focal motion at a time. Pause or dim other GPU layers while a hero scene runs.', use: {} },
  { id: 'straight-ahead-pose', rule: 'Scroll-tied scenes are pose-to-pose: define camera keyframes as a pure function of progress so any frame is reachable from either direction.', use: { ease: 'linear' } },
  { id: 'follow-through', rule: 'Parts keep moving after the body stops: offset child tweens 40–90 ms and let them settle on a spring.', use: { spring: 'gentle' } },
  { id: 'slow-in-out', rule: 'Ease both ends of travel between holds; ease only the end for arrivals, only the start for exits.', use: { ease: 'standard' } },
  { id: 'arcs', rule: 'Natural paths curve. Move x and y on different eases, or orbit the camera around a look target.', use: {} },
  { id: 'secondary-action', rule: 'Support the main move with something quieter: drifting mist, grain, a hover glow. Never louder than the primary.', use: {} },
  { id: 'timing', rule: 'Duration carries weight: small/light things 120–250 ms, panels 300–450 ms, scenes 0.8–1.6 s.', use: { duration: 'medium' } },
  { id: 'exaggeration', rule: 'Push the key pose a bit past real (bigger scale, brighter flash) so it reads at phone size and in compressed video.', use: { ease: 'emphasized' } },
  { id: 'solid-drawing', rule: 'Keep perspective and lighting consistent: one light direction across 2D shadows and 3D scenes; cap FOV changes.', use: {} },
  { id: 'appeal', rule: 'Clarity over spectacle. Respect prefers-reduced-motion with a still frame that tells the same story.', use: {} },
];
