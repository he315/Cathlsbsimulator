// ---------------------------------------------------------------------------
// Seeded draws for the PCI engines, with the generator state kept inside the
// (plain, serialisable) procedure state, so a replay from the same actions
// draws the same complications. mulberry32, as the patient engine uses.
// ---------------------------------------------------------------------------

import { hashSeed } from "../patient/rng";

export interface RngState {
  s: number;
}

export function rngFrom(seed: string | number): RngState {
  return { s: hashSeed(seed) };
}

/** Next uniform draw in [0, 1); advances `r` in place (callers own a copy). */
export function rnd(r: RngState): number {
  let t = (r.s = (r.s + 0x6d2b79f5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function chance(r: RngState, p: number): boolean {
  return rnd(r) < p;
}

export function normal(r: RngState, mean = 0, sd = 1): number {
  const u = Math.max(1e-12, rnd(r));
  const v = rnd(r);
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Probability of at least one event for a hazard rate `lambda` (per unit) over `x` units. */
export function hazardP(lambda: number, x: number): number {
  return 1 - Math.exp(-Math.max(0, lambda) * Math.max(0, x));
}

/** Standard normal cumulative distribution (Abramowitz-Stegun 26.2.17, |error| < 7.5e-8). */
export function phi(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z > 0 ? 1 - p : p;
}
