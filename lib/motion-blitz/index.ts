// Re-exports the vendored Motion Blitz modules used by the Nexus desk.

export {
  EASE,
  SPRINGS,
  DURATION,
  PRINCIPLES,
  durationFor,
  stagger,
  cssSpring,
  installCssSprings,
  Spring,
  springSolver,
  springFromFeel,
  springDuration,
  supportsLinearEasing,
} from './springs.js';

export {
  createRig,
  rigSequence,
  RIGS,
  RIG_NAMES,
  FRAMING,
  MOVE,
  LENSES,
  fovFor,
} from './camera.js';

export {
  reducedMotion,
  isPhone,
  dpr,
  hasWebGL,
  isSoftwareGL,
  softwareAllowed,
  clamp01,
  lerp,
  smooth,
  range,
  stageProgress,
} from './env.js';

export { LOOKS, GRADES, TOKENS } from './looks-tokens.js';
