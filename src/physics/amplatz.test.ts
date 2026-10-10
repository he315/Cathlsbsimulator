// ---------------------------------------------------------------------------
// Amplatz catheters and the prolapse rule (frozen fixture, default solver).
// - A preformed Amplatz hook seated in the left sinus with its tip pointing up
//   is not a prolapse: the classifier compares the fold with the device's free
//   shape (engagementClassifier.PROLAPSE_EXCESS_DEG). The wave-1 rule, kept
//   behind classifierOptions.preformedFold = false, called it prolapsed.
// - A Judkins right pushed on in the left sinus folds far beyond its free
//   shape and is still a prolapse.
// - The current AL1 and AL2 pushed past seating stay clear of the threshold;
//   pushed much further they loop on the valve and are called prolapsed.
// - Withdrawal: an engaged Amplatz stays in the vessel when pulled back (facts
//   I3: "pulling the catheter will cause deeper engagement").
// ---------------------------------------------------------------------------

import { describe, it, expect, afterEach } from "vitest";
import * as M from "./manoeuvres";
import * as S from "./scenarios";
import { makeCatheter } from "./catheterShapes";
import { classifierOptions, PROLAPSE_EXCESS_DEG } from "./engagementClassifier";
import type { PhysicsEngine } from "./engine";

const T = 600_000;

/** The wave-1 Amplatz left 1 curve (hook radius 10 mm, 200 degrees), as a custom device. */
const wave1Al1 = () =>
  makeCatheter({ id: "AL1-W1", name: "wave-1 Amplatz left 1", arcs: [{ len: 4, turn: 0 }, { len: 8, turn: -50 }, { len: (200 / 180) * Math.PI * 10, turn: 200 }] });

function classifyBoth(eng: PhysicsEngine): { current: boolean; wave1: boolean; excess: number } {
  const internal = eng as unknown as { version: number };
  internal.version++;
  const a = eng.classify()!;
  classifierOptions.preformedFold = false;
  internal.version++;
  const b = eng.classify()!;
  classifierOptions.preformedFold = true;
  internal.version++;
  return { current: a.prolapsed, wave1: b.prolapsed, excess: a.foldExcessDeg };
}

afterEach(() => {
  classifierOptions.preformedFold = true;
});

describe("prolapse rule with the preformed shape", () => {
  it("an Amplatz hook seated in the left sinus, tip up, is not called prolapsed (the wave-1 rule called it prolapsed every time)", () => {
    let wave1 = 0, current = 0, n = 0;
    for (const back of M.STARTS) {
      const eng = S.makeEngine("femoral", "normal");
      S.parkOverWire(eng, wave1Al1(), { tipBack: back });
      expect(S.advanceToRoot(eng)).toBe(true);
      S.withdrawWire(eng);
      for (let i = 0; i < 6; i++) {
        eng.command({ kind: "push", device: "catheter", mm: 1.5 });
        eng.step(0.5);
        const r = classifyBoth(eng);
        n++;
        if (r.wave1) wave1++;
        if (r.current) current++;
        if (r.wave1) expect(Math.abs(r.excess)).toBeLessThan(PROLAPSE_EXCESS_DEG / 2);
      }
    }
    expect(n).toBe(30);
    expect(wave1).toBeGreaterThanOrEqual(25);
    expect(current).toBe(0);
  }, T);

  it("a Judkins right pushed on in the left sinus still folds far beyond its free shape and is called prolapsed", () => {
    let folded = 0;
    for (const back of [50, 70, 90]) {
      const eng = M.femoralInRoot("JR4", back)!;
      const tr = S.runTrajectory(eng, { pushMm: 8, steps: 10, dt: 0.6, until: (r) => r.prolapsed });
      const last = tr[tr.length - 1];
      if (last.prolapsed && !last.inLV) {
        folded++;
        expect(last.foldExcessDeg).toBeGreaterThan(PROLAPSE_EXCESS_DEG);
      }
    }
    expect(folded).toBeGreaterThanOrEqual(2);
  }, T);
});

describe("prolapse rule with the current Amplatz curves (catalogue AL1 and AL2)", () => {
  // Measured on the frozen fixture (docs/realism/wave2/I3.md): pushed 48 mm past the root, the folds of
  // the AL1 (normal root) and AL2 (dilated root) exceed their free shape by at most 68 degrees, 22 below
  // PROLAPSE_EXCESS_DEG; pushed 120 mm, they loop on the valve with excesses of 107-212 degrees.
  const overpush = (cath: string, root: "normal" | "dilated", mm: number, steps: number) => {
    let reached = 0, prolapsedStarts = 0, maxExcess = -Infinity, minCalledExcess = Infinity;
    for (const back of M.STARTS) {
      const eng = M.amplatzInRoot(cath, back, root);
      if (!eng) continue;
      reached++;
      const tr = S.runTrajectory(eng, { pushMm: mm, steps, dt: 0.5 });
      for (const r of tr) {
        if (Number.isFinite(r.foldExcessDeg)) maxExcess = Math.max(maxExcess, r.foldExcessDeg);
        if (r.prolapsed && !r.inLV) minCalledExcess = Math.min(minCalledExcess, r.foldExcessDeg);
      }
      if (tr.some((r) => r.prolapsed && !r.inLV)) prolapsedStarts++;
    }
    return { reached, prolapsedStarts, maxExcess, minCalledExcess };
  };

  it("an AL1 (normal root) and an AL2 (dilated root) pushed 48 mm past seating are never called prolapsed, their fold staying at least 15 degrees below the threshold", () => {
    for (const [cath, root] of [["AL1", "normal"], ["AL2", "dilated"]] as const) {
      const r = overpush(cath, root, 4, 12);
      expect(r.reached).toBeGreaterThanOrEqual(4);
      expect(r.prolapsedStarts).toBe(0);
      expect(r.maxExcess).toBeLessThanOrEqual(PROLAPSE_EXCESS_DEG - 15);
    }
  }, T);

  it("a genuine Amplatz prolapse is still caught: pushed 120 mm, the AL1 and the AL2 loop on the valve and are called prolapsed in most starts, each call with a fold beyond the threshold", () => {
    for (const [cath, root] of [["AL1", "normal"], ["AL2", "dilated"]] as const) {
      const r = overpush(cath, root, 8, 15);
      expect(r.reached).toBeGreaterThanOrEqual(4);
      expect(r.prolapsedStarts).toBeGreaterThanOrEqual(3);
      expect(r.minCalledExcess).toBeGreaterThan(PROLAPSE_EXCESS_DEG);
    }
  }, T);
});

describe("withdrawal of an engaged catheter", () => {
  it("an engaged Amplatz left 1 stays in the left main, no more than 1 mm shallower, when pulled back 4 mm", () => {
    const pull = (eng: PhysicsEngine) => {
      const d0 = eng.classify()!.depthMm;
      const tr = S.runTrajectory(eng, { pushMm: -1, steps: 4, dt: 0.5 });
      const r = tr[tr.length - 1];
      return { d0, d1: r.side === "left" && r.vessel ? r.depthMm : -Infinity };
    };
    let alStayed = 0, alEngaged = 0;
    for (const back of M.STARTS) {
      const a = M.amplatzInRoot("AL1", back);
      const ta = a ? M.amplatzLeftTechnique(a) : [];
      if (a && M.engagedLm(ta[ta.length - 1])) {
        a.step(0.5);
        if (a.classify()!.depthMm >= 1) {
          alEngaged++;
          const r = pull(a);
          if (r.d1 >= r.d0 - 1) alStayed++;
        }
      }
    }
    expect(alEngaged).toBeGreaterThanOrEqual(3);
    expect(alStayed).toBe(alEngaged);
  }, T);
});
