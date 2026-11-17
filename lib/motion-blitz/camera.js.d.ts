export const SENSORS: Record<string, number[]>;
export const LENSES: Record<string, number>;
export const STOPS: number[];
export const FRAMING: Record<string, number>;
export const MOVE: Record<string, number>;
export function fovFor(focalMm: number, aspect?: number, sensor?: string): number;
export const RIGS: Record<string, (u: number, s: unknown) => { pos: number[]; aim: number[] }>;
export const RIG_NAMES: string[];
export const COMPOSE: Record<string, number[]>;
export type CameraPose = {
  position: number[];
  target: number[];
  rollDeg: number;
  fov: number;
  focalMm: number;
  fStop: number;
  progress: number;
};
export type CameraRig = {
  at: (t: number) => CameraPose;
  apply: (camera: { position: { set: (x: number, y: number, z: number) => void }; up: { set: (x: number, y: number, z: number) => void }; lookAt: (x: number, y: number, z: number) => void; rotateZ: (r: number) => void; fov: number; updateProjectionMatrix: () => void }, t: number) => CameraPose;
  fov: number;
  dist: number;
};
export function createRig(
  spec: Record<string, unknown>,
  env: {
    anchors: Record<string, { pos: number[]; height: number; view?: number[] }>;
    aspect: number;
    start: number;
    duration: number;
    curve?: (u: number) => number;
    unitsPerMeter?: number;
  },
): CameraRig;
export function rigSequence(shots: unknown[]): { at: (t: number) => CameraPose; apply: CameraRig['apply'] };
