import { describe, it, expect } from "vitest";
import { CardiacClock } from "./cardiacClock";

describe("CardiacClock", () => {
  it("produces R waves at the set rate", () => {
    const c = new CardiacClock({ hr: 60, sinusArrhythmia: 0 });
    c.advance(10.01);
    const beats = c.drainBeats();
    expect(beats.length).toBe(10);
    expect(Math.abs(beats[1].t - beats[0].t - 1)).toBeLessThan(0.021);
  });

  it("systole shortens less than diastole as the rate rises", () => {
    const c = new CardiacClock();
    const slow = c.endSystoleFor(1.0);
    const fast = c.endSystoleFor(0.5);
    expect(fast).toBeLessThan(slow);
    expect(slow - fast).toBeLessThan(1.0 - 0.5 - (slow - fast)); // diastole loses more
    expect(fast / 0.5).toBeGreaterThan(slow / 1.0); // systolic fraction rises
  });

  it("holds the breath at the requested level", () => {
    const c = new CardiacClock({ hr: 70 });
    c.holdBreath(0.7);
    c.advance(5);
    expect(Math.abs(c.state().resp - 0.7)).toBeLessThan(0.01);
    expect(c.state().breathHold).toBe(true);
  });

  it("restores from a snapshot to the same future", () => {
    const a = new CardiacClock({ hr: 75, seed: 3 });
    a.advance(3.3);
    const snap = a.snapshot();
    a.advance(2);
    const s1 = a.state();
    const b = new CardiacClock({ hr: 75, seed: 3 });
    b.restore(snap);
    b.advance(2);
    expect(b.state().beat).toBe(s1.beat);
    expect(Math.abs(b.state().tInBeat - s1.tInBeat)).toBeLessThan(1e-9);
  });
});
