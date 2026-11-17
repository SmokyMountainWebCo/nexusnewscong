// Motion Blitz — environment helpers shared by every module.
// Original code (MIT, see /LICENSE).

export const RENDER_MODE = typeof location !== 'undefined' && /[?&]render=1\b/.test(location.search);

export function reducedMotion() {
  if (RENDER_MODE) return false; // the renderer always wants the full motion
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isPhone() {
  return typeof matchMedia === 'function' && matchMedia('(max-width: 767px), (pointer: coarse)').matches;
}

/** Device-pixel-ratio cap: phones get less fill-rate. */
export function dpr(desktopCap = 1.75, phoneCap = 1.25) {
  return Math.min((typeof devicePixelRatio === 'number' ? devicePixelRatio : 1) || 1, isPhone() ? phoneCap : desktopCap);
}

/** True when a WebGL (1 or 2) context can be created. */
export function hasWebGL(version = 1) {
  try {
    const c = document.createElement('canvas');
    const gl = version === 2 ? c.getContext('webgl2') : (c.getContext('webgl') || c.getContext('experimental-webgl'));
    return !!gl;
  } catch (e) { return false; }
}

/** CPU-emulated GL (SwiftShader, llvmpipe ...). Heavy scenes should fall back unless forced. */
export function isSoftwareGL(gl) {
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '');
    return /swiftshader|llvmpipe|softpipe|software|basic render driver/i.test(name);
  } catch (e) { return false; }
}

/** Allow software GL when ?softgl=1 or render mode (QA + video capture). */
export function softwareAllowed() {
  return RENDER_MODE || (typeof location !== 'undefined' && /[?&]softgl=1\b/.test(location.search));
}

export const clamp01 = (t) => Math.max(0, Math.min(1, t));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };
export const range = (p, a, b) => clamp01((p - a) / (b - a));

/** Scroll progress 0..1 of a tall "stage" element through the viewport (pinned-stage convention). */
export function stageProgress(el) {
  const r = el.getBoundingClientRect();
  const total = Math.max(1, r.height - innerHeight);
  return clamp01(-r.top / total);
}

/** Resolve an element from a selector or element. */
export function $(elOrSel, root = document) {
  return typeof elOrSel === 'string' ? root.querySelector(elOrSel) : elOrSel;
}

/** Deep-merge plain objects (arrays are replaced). */
export function merge(base, over) {
  const out = Array.isArray(base) ? base.slice() : { ...base };
  if (!over) return out;
  for (const k of Object.keys(over)) {
    const b = base ? base[k] : undefined, o = over[k];
    out[k] = (b && o && typeof b === 'object' && typeof o === 'object' && !Array.isArray(b) && !Array.isArray(o)) ? merge(b, o) : o;
  }
  return out;
}

/** Hex '#RRGGBB' or [r,g,b] (0..1) -> [r,g,b] 0..1. */
export function rgb(c) {
  if (Array.isArray(c)) return c;
  const h = String(c).replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
export const glsl3 = (c) => { const v = rgb(c); return `vec3(${v.map((x) => x.toFixed(4)).join(',')})`; };
