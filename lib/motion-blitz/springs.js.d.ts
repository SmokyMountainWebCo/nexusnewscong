export function springSolver(opts?: { stiffness?: number; damping?: number; mass?: number; velocity?: number }): (t: number) => number;
export function springDuration(opts?: object, eps?: number, maxT?: number): number;
export function springFromFeel(opts?: { duration?: number; bounce?: number }): { stiffness: number; damping: number; mass: number };
export function cssSpring(opts?: object, cfg?: { points?: number; precision?: number }): { easing: string; duration: number; fallback: string };
export function supportsLinearEasing(): boolean;
export function installCssSprings(presets?: Record<string, object>, root?: HTMLElement): void;
export class Spring {
  x: number;
  target: number;
  v: number;
  constructor(value?: number, opts?: { stiffness?: number; damping?: number; mass?: number });
  set(target: number): this;
  jump(value: number): this;
  step(dt: number): number;
  get settled(): boolean;
}
export const SPRINGS: Record<string, { duration: number; bounce: number }>;
export const EASE: Record<string, { css: string; gsap: string }>;
export const DURATION: Record<string, number>;
export function durationFor(px: number, opts?: { min?: number; max?: number }): number;
export function stagger(n: number, opts?: { each?: number; maxTotal?: number }): number;
export const PRINCIPLES: Array<{ id: string; rule: string; use: Record<string, string> }>;
