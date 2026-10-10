// ---------------------------------------------------------------------------
// Seeded generator with a serialisable state (mulberry32), so the patient
// engine's random events (arrhythmia hazards, AV block on adenosine, contrast
// reactions) replay exactly after snapshot/restore.
// ---------------------------------------------------------------------------

export function hashSeed(s: string | number): number {
  if (typeof s === "number") return s >>> 0 || 0x9e3779b9;
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0 || 0x9e3779b9;
}

export class SeededRng {
  state: number;
  constructor(seed: string | number) {
    this.state = hashSeed(seed);
  }
  next(): number {
    let t = (this.state = (this.state + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(lo: number, hi: number): number {
    return lo + this.next() * (hi - lo);
  }
  /** standard normal (Box-Muller) */
  normal(mean = 0, sd = 1): number {
    const u = Math.max(1e-12, this.next());
    const v = this.next();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  /** normal clamped to [lo, hi] */
  clampedNormal(mean: number, sd: number, lo: number, hi: number): number {
    return Math.min(hi, Math.max(lo, this.normal(mean, sd)));
  }
  /** log-normal with the given median and log-SD */
  logNormal(median: number, logSd: number): number {
    return median * Math.exp(this.normal(0, logSd));
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
  pick<T>(a: readonly T[]): T {
    return a[Math.min(a.length - 1, Math.floor(this.next() * a.length))];
  }
}
