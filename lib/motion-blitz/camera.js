// Motion Blitz — physical camera rig and lens solver.
// Original code (MIT, see /LICENSE). Idea from Gemini's Motion Blitz review (Nov 2026); maths ours.
//
// Specs choose a lens, a stop, a rig and a subject. They never set fov or xyz. The solver turns
// that into a camera that sits on a dolly, crane, tripod or steadicam: field of view from focal
// length and sensor, depth of field from f-stop and focus distance, distance to subject from the
// framing (so an 85mm close and a 24mm wide both frame the subject as asked), seeded handheld
// noise on rotation only, and the shutter angle for the motion-blur accumulator.
//
//   const rig = createRig({ lens: '85mm', f_stop: 2, rig: 'crane_up_push', framing: 'medium',
//                           handheld: 0.15, focus_target: 'valley.light', shutter_angle: 180, seed: 4 },
//                         { anchors, duration: 3.2, start: 0 });
//   rig.apply(camera, t)   // sets position, quaternion, fov; returns the solved state

/** Full-frame 36 x 24 mm unless a spec asks otherwise. */
export const SENSORS = { full_frame: [36, 24], super35: [24.89, 18.66] };
export const LENSES = { '24mm': 24, '35mm': 35, '50mm': 50, '85mm': 85, '135mm': 135 };
export const STOPS = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16];
/** Fraction of frame height the subject fills. */
export const FRAMING = { extreme_wide: 0.12, wide: 0.28, medium: 0.5, close: 0.8, macro: 1.4 };
/** Rig travel as a fraction of subject distance. */
export const MOVE = { still: 0, subtle: 0.06, medium: 0.14, bold: 0.28 };

const DEG = 180 / Math.PI;

/**
 * Vertical field of view in degrees. Portrait frames turn the sensor on its side, as a vertical
 * camera body would, so the long side is vertical.
 * @param {number} focalMm
 * @param {number} aspect  width / height of the output
 */
export function fovFor(focalMm, aspect = 16 / 9, sensor = 'full_frame') {
  const [sw, sh] = SENSORS[sensor] || SENSORS.full_frame;
  const vertical = aspect < 1 ? sw : sh;
  return 2 * Math.atan(vertical / (2 * focalMm)) * DEG;
}

/** Parse '85mm' / 85 into millimetres, only from the lens set. */
export function lensMm(lens) {
  const mm = typeof lens === 'number' ? lens : LENSES[String(lens)];
  if (!Object.values(LENSES).includes(mm)) throw new Error(`lens "${lens}" is not in the kit (${Object.keys(LENSES).join(', ')})`);
  return mm;
}

/**
 * Depth-of-field parameters for fx/post.js from optics. Scene units are converted to metres with
 * `unitsPerMeter`. Returns the focus distance (scene units), the hyperfocal distance, the near and
 * far limits, and a blur scale normalised so f/1.4 on an 85mm at 3 m is about 1.
 */
export function depthOfField({ focalMm, fStop, focusDistance, unitsPerMeter = 1, coc = 0.03 }) {
  const f = focalMm / 1000, N = fStop, s = Math.max(f * 1.01, focusDistance / unitsPerMeter), c = coc / 1000;
  const H = (f * f) / (N * c) + f;
  const near = (s * (H - f)) / (H + s - 2 * f);
  const far = s >= H ? Infinity : (s * (H - f)) / (H - s);
  // background blur disc for a point at infinity, relative to the sensor height
  const blurInf = (f * f) / (N * (s - f)) / 0.024;
  const ref = (0.085 * 0.085) / (1.4 * (3 - 0.085)) / 0.024;
  return { focus: focusDistance, hyperfocal: H * unitsPerMeter, near: near * unitsPerMeter, far: far * unitsPerMeter, aperture: blurInf / ref };
}

/** Distance at which a subject of `height` fills `fraction` of the frame height. */
export function distanceForFraming(height, fovDeg, fraction) {
  return height / (fraction * 2 * Math.tan((fovDeg / DEG) / 2));
}

/* ---------------- seeded simplex noise (2D), for handheld and steadicam float ---------------- */
function perm(seed) {
  const p = new Uint8Array(512), a = Array.from({ length: 256 }, (_, i) => i);
  let s = seed >>> 0 || 1;
  for (let i = 255; i > 0; i--) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  for (let i = 0; i < 512; i++) p[i] = a[i & 255];
  return p;
}
const G2 = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
/** @returns {(x:number, y:number)=>number} simplex noise in about -1..1 */
export function simplex2(seed = 1) {
  const p = perm(seed), F2 = 0.5 * (Math.sqrt(3) - 1), G = (3 - Math.sqrt(3)) / 6;
  return (x, y) => {
    const s = (x + y) * F2, i = Math.floor(x + s), j = Math.floor(y + s), t = (i + j) * G;
    const x0 = x - (i - t), y0 = y - (j - t), i1 = x0 > y0 ? 1 : 0, j1 = 1 - i1;
    const x1 = x0 - i1 + G, y1 = y0 - j1 + G, x2 = x0 - 1 + 2 * G, y2 = y0 - 1 + 2 * G;
    const ii = i & 255, jj = j & 255;
    let n = 0;
    for (const [dx, dy, gi] of [[x0, y0, p[ii + p[jj]]], [x1, y1, p[ii + i1 + p[jj + j1]]], [x2, y2, p[ii + 1 + p[jj + 1]]]]) {
      let tt = 0.5 - dx * dx - dy * dy;
      if (tt > 0) { tt *= tt; const g = G2[gi & 7]; n += tt * tt * (g[0] * dx + g[1] * dy); }
    }
    return 70 * n;
  };
}

/* ---------------- vector helpers ---------------- */
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const smooth = (u) => u * u * (3 - 2 * u);

/**
 * Rigs. Each maps (u: 0..1 through the shot, eased by the shot's verb; setup) to an offset of the
 * camera relative to its rest position and an aim point. `setup` = { subject, dist, dir (unit vector
 * from subject to camera), right, up, travel (scene units) }.
 */
export const RIGS = {
  locked_tripod: (u, s) => ({ pos: s.rest, aim: s.subject }),
  dolly_in: (u, s) => ({ pos: add(s.rest, mul(s.dir, -s.travel * u)), aim: s.subject }),
  dolly_out: (u, s) => ({ pos: add(s.rest, mul(s.dir, s.travel * u)), aim: s.subject }),
  // crane rises while the dolly pushes in; the aim lifts a little less than the camera (reveal over a crest)
  crane_up_push: (u, s) => ({ pos: add(add(s.rest, mul(s.up, s.travel * 0.9 * u - s.travel * 0.35)), mul(s.dir, -s.travel * 0.7 * u)),
    aim: add(s.subject, mul(s.up, s.travel * 0.25 * u)) }),
  crane_down: (u, s) => ({ pos: add(s.rest, mul(s.up, s.travel * (0.6 - 0.9 * u))), aim: s.subject }),
  // orbit: arc around the subject; travel sets the arc length
  orbit: (u, s) => {
    const a = (u - 0.5) * (s.travel / s.dist) * 1.6, c = Math.cos(a), sn = Math.sin(a);
    const d = add(mul(s.dir, c), mul(s.right, sn));
    return { pos: add(s.subject, mul(d, s.dist)), aim: s.subject };
  },
  truck_left: (u, s) => ({ pos: add(s.rest, mul(s.right, s.travel * (0.5 - u))), aim: add(s.subject, mul(s.right, s.travel * 0.3 * (0.5 - u))) }),
  // whip pan: aim swings fast across the frame from a held position (the verb supplies the snap)
  whip_pan: (u, s) => ({ pos: s.rest, aim: add(s.subject, mul(s.right, s.dist * 0.9 * (u - 1))) }),
  // crane, then a whip: the crane-push for the first 80% of the shot, then the aim snaps sideways
  // (accelerating into the cut) so the velocity telemetry peaks and the whoosh fires on the camera itself
  crane_whip: (u, s) => {
    const base = RIGS.crane_up_push(Math.min(1, u / 0.8), s);
    const w = Math.max(0, (u - 0.8) / 0.2), k = w * w * w;
    return { pos: base.pos, aim: add(base.aim, mul(s.right, s.dist * 1.1 * k)) };
  },
  // steadicam drift: slow forward walk with a lateral sway (noise is added on top as float)
  steadicam_drift: (u, s) => ({ pos: add(add(s.rest, mul(s.dir, -s.travel * u)), mul(s.right, Math.sin(u * Math.PI) * s.travel * 0.18)), aim: s.subject }),
};
export const RIG_NAMES = Object.keys(RIGS);

/** Where the subject sits in frame, as normalized device offsets (rule of thirds). */
export const COMPOSE = {
  center: [0, 0], lower_third: [0, -1 / 3], upper_third: [0, 1 / 3], left_third: [-1 / 3, 0], right_third: [1 / 3, 0],
};

/**
 * Build a rig for one shot.
 * @param {{lens:string|number, f_stop?:number, rig:string, framing?:string, move?:string, handheld?:number,
 *          focus_target:string, angle?:string, side?:string, compose?:string, shutter_angle?:number, seed?:number, sensor?:string}} spec
 * @param {{anchors:Record<string,{pos:number[], height:number, view?:number[]}>, aspect:number, start:number, duration:number,
 *          curve?:(u:number)=>number, unitsPerMeter?:number}} env
 */
export function createRig(spec, env) {
  const focalMm = lensMm(spec.lens);
  const fStop = spec.f_stop ?? 4;
  if (!STOPS.includes(fStop)) throw new Error(`f_stop ${fStop} is not a full stop (${STOPS.join(', ')})`);
  const rigFn = RIGS[spec.rig];
  if (!rigFn) throw new Error(`unknown rig "${spec.rig}" (have: ${RIG_NAMES.join(', ')})`);
  const anchor = env.anchors[spec.focus_target];
  if (!anchor) throw new Error(`focus_target "${spec.focus_target}" is not an anchor in this scene (have: ${Object.keys(env.anchors).join(', ')})`);
  const fov = fovFor(focalMm, env.aspect, spec.sensor);
  const framing = FRAMING[spec.framing || 'wide'];
  if (framing == null) throw new Error(`framing "${spec.framing}" unknown (have: ${Object.keys(FRAMING).join(', ')})`);
  const dist = distanceForFraming(anchor.height, fov, framing);
  // camera direction from the anchor: its preferred view, swung by `side`, lifted by `angle`
  const view = norm(anchor.view || [0, 0.12, 1]);
  const sideA = { center: 0, left: -0.35, right: 0.35 }[spec.side || 'center'];
  const elev = { eye: 0, low: -0.12, high: 0.22, aerial: 0.5 }[spec.angle || 'eye'];
  const ca = Math.cos(sideA), sa = Math.sin(sideA);
  let dir = norm([view[0] * ca + view[2] * sa, view[1] + elev, -view[0] * sa + view[2] * ca]);
  const worldUp = [0, 1, 0];
  const right = norm(cross(worldUp, dir)), up = norm(cross(dir, right));
  const travel = dist * (MOVE[spec.move || 'medium'] ?? MOVE.medium);
  const setup = { subject: anchor.pos, dist, dir, right, up, travel, rest: add(anchor.pos, mul(dir, dist)) };
  const curve = env.curve || smooth;
  const noise = simplex2((spec.seed ?? 1) * 7919 + 13);
  const hh = Math.max(0, Math.min(1, spec.handheld ?? 0));
  const float = spec.rig === 'steadicam_drift' ? 0.35 : 0;
  const shutter = (spec.shutter_angle ?? 180) / 360;
  const dofBase = { focalMm, fStop, unitsPerMeter: env.unitsPerMeter ?? 1 };
  const place = COMPOSE[spec.compose || 'center'];
  if (!place) throw new Error(`compose "${spec.compose}" unknown (have: ${Object.keys(COMPOSE).join(', ')})`);
  const tanV = Math.tan(fov / 2 / DEG), tanH = tanV * env.aspect;

  /** Solved camera state at absolute time t. Pure function of t. */
  function at(t) {
    const u = Math.max(0, Math.min(1, (t - env.start) / env.duration));
    const k = curve(u);
    const r = rigFn(k, setup);
    let pos = r.pos, aim = r.aim;
    const focus = len(sub(anchor.pos, pos));
    // handheld: two octaves of simplex on yaw / pitch / roll, amplitude in degrees; a 135mm shakes
    // more on screen than a 24mm for the same body motion, so scale by focal length
    const amp = (hh * 1.1 + float * 0.4) * Math.sqrt(focalMm / 50);
    const n = (o) => noise(t * 0.9 + o, o * 3.1) * 0.7 + noise(t * 2.3 + o * 2, o * 5.7) * 0.3;
    const yaw = n(1) * amp, pitch = n(2) * amp * 0.7, roll = n(3) * amp * 0.5 + (spec.roll === 'dutch' ? 2 : 0);
    let fwd = norm(sub(aim, pos)), rgt = norm(cross(fwd, worldUp)), upv = cross(rgt, fwd);
    // composition: swing the aim so the subject lands on its third instead of dead center
    if (place[0] || place[1]) {
      const d = len(sub(aim, pos));
      aim = add(aim, add(mul(rgt, -place[0] * tanH * d), mul(upv, -place[1] * tanV * d)));
      fwd = norm(sub(aim, pos)); rgt = norm(cross(fwd, worldUp)); upv = cross(rgt, fwd);
    }
    const ofs = Math.tan(yaw / DEG) * focus, ofp = Math.tan(pitch / DEG) * focus;
    aim = add(add(aim, mul(rgt, ofs)), mul(upv, ofp));
    // lens breathing: focus pulls change the field of view by up to ~1.5% on long lenses
    const breathing = 1 + 0.015 * (focalMm / 135) * Math.sin(u * Math.PI);
    return {
      position: pos, target: aim, rollDeg: roll, fov: fov * breathing, focalMm, fStop,
      dof: depthOfField({ ...dofBase, focusDistance: focus }), shutter, progress: u,
    };
  }

  return {
    spec, fov, dist, setup, at,
    /** Write the solved state into a THREE.PerspectiveCamera; returns the state. */
    apply(camera, t) {
      const s = at(t);
      camera.position.set(s.position[0], s.position[1], s.position[2]);
      camera.up.set(0, 1, 0);
      camera.lookAt(s.target[0], s.target[1], s.target[2]);
      if (s.rollDeg) camera.rotateZ(s.rollDeg / DEG);
      if (Math.abs(camera.fov - s.fov) > 1e-4) { camera.fov = s.fov; camera.updateProjectionMatrix(); }
      return s;
    },
  };
}

/**
 * A shot list of rigs as one camera: ctx.cameraRig for scenes. Picks the rig whose shot holds t.
 * @param {{start:number, end:number, rig:ReturnType<typeof createRig>}[]} shots
 */
export function rigSequence(shots) {
  const sorted = shots.slice().sort((a, b) => a.start - b.start);
  const pick = (t) => { let cur = sorted[0]; for (const s of sorted) if (s.start <= t + 1e-9) cur = s; return cur; };
  return {
    shots: sorted,
    at: (t) => pick(t).rig.at(t),
    apply: (camera, t) => pick(t).rig.apply(camera, t),
  };
}
