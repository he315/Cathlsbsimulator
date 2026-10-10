// ---------------------------------------------------------------------------
// Vein grafts and the rod mechanics (diag-grafts-svg), in-thread: the grafts of the render tree are lumens the
// catheter can enter. A Judkins right withdrawn in LAO from the native RCA ostium to the graft level and turned
// gently clockwise engages the right vein graft (diseased in that case); sweeping the LAD graft level where that graft
// is occluded fails repeatedly and the graft search raises graft-not-found.
// The trace at the diseased graft's ostium is logged, not asserted: the rod's open fraction reads the tip's depth in
// the mouth, not the graft's narrowing a few millimetres in, and the session narrows the gap only for a native ostial
// lesion (labSession.ts withCatheterAndOstium, ostialGapFactor), so the seated tip reads aortic. Reported to the owner
// of labSession.ts and physicsDevices.ts (outside this package).
//   npx vitest run src/ui/physics/physicsDevices.grafts.test.ts
// ---------------------------------------------------------------------------

import { afterEach, describe, expect, it } from "vitest";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { CASE_LIBRARY, DEFAULT_SCENARIO_SEED, scenarioCase } from "../../simulation/caseGenerator";
import { DiagnosticLabSession, labScenarioById, type SessionPhysicsOptions } from "../sim/labSession";
import { advanceToRootScript, judkinsRightScript, withdrawWireScript, type DiagnosticPhysics } from "./physicsDevices";
import { GraftSearch, GRAFT_SEARCH } from "../../simulation/anatomy";
import { graftLumenId } from "../../physics/coronaryLumens";

const g = () => useSimulatorStore.getState();
const T = 110_000;
const PHYS: SessionPhysicsOptions = { force: true, useWorker: false, config: {}, autoFallback: false };
const STARTS = [50, 60, 70, 80, 90];

const sessions: DiagnosticLabSession[] = [];
afterEach(() => {
  for (const s of sessions.splice(0)) s.dispose();
  g().loadCase(CASE_LIBRARY[0], "free", "beginner");
});

function open(scenario: string, catheter: string, back: number): DiagnosticLabSession {
  const c = scenarioCase(scenario, DEFAULT_SCENARIO_SEED, labScenarioById)!;
  g().loadCase(c, "free", "beginner");
  g().setCatheter(catheter);
  const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, physics: { ...PHYS, start: { tipBackMm: back } } });
  sessions.push(s);
  return s;
}
const tipOf = (p: DiagnosticPhysics) => p.frame()?.catheter?.tip ?? null;

/**
 * LAO withdrawal from the native RCA ostium and gentle clockwise torque (Brilakis 5.7, Oxford ch 7, tip
 * diag-svg-right-graft-lao): bring the tip up to the graft's level in 1.5 mm pulls, then 0.15 rad of clockwise
 * torque every 0.5 s while holding the level. Returns the vessel the tip entered.
 */
function* rightGraftScript(p: DiagnosticPhysics, levelY: number, steps = 70): Generator<number, string | null> {
  for (let i = 0; i < steps; i++) {
    const v = p.frame()?.engagement?.vessel ?? null;
    if (graftLumenId(v)) return v;
    const tip = tipOf(p);
    if (!tip) {
      yield 0.5;
      continue;
    }
    const push = Math.max(-1.5, Math.min(1.5, tip[1] - levelY));
    if (Math.abs(push) > 0.3) p.command({ kind: "push", device: "catheter", mm: push });
    if (Math.abs(tip[1] - levelY) < 3) p.command({ kind: "torque", device: "catheter", rad: 0.15 });
    yield 0.5;
  }
  const v = p.frame()?.engagement?.vessel ?? null;
  return graftLumenId(v) ? v : null;
}

describe("rod mechanics: vein grafts", () => {
  it("JR4 with LAO withdrawal and clockwise torque engages the right SVG in at least 2 of 5 starts", () => {
    let engaged = 0;
    const detail: string[] = [];
    const seated: string[] = [];
    for (const back of STARTS) {
      const s = open("diag-graft-imaging-competitive-flow", "JR4", back);
      const p = s.physics!;
      expect(p.active).toBe(true);
      const right = g().model.grafts!.find((x) => x.id === "svg-rca")!;
      expect(right.graft.status).toBe("diseased");
      const adv = (sec: number) => {
        for (let t = 0; t < sec - 1e-9; t += 1 / 60) s.step(1 / 60);
      };
      p.runScript(advanceToRootScript(p), adv);
      p.runScript(withdrawWireScript(p), adv);
      // the native RCA first (the JR4 straight after the RCA run: tip diag-svg-jr4-after-rca), then the search above it
      p.runScript(judkinsRightScript(p), adv);
      const got = p.runScript(rightGraftScript(p, right.ostium.pos.y), adv);
      if (got === right.treeName) {
        engaged++;
        // hold the seat for two seconds and log the trace class the patient engine reads there (see the header)
        adv(2);
        const r = p.latest();
        seated.push(`${back}: ${s.tipState} (vessel ${r?.vessel ?? "none"}, open ${r ? r.openFraction.toFixed(2) : "-"})`);
      }
      detail.push(`${back}: ${got ?? "none"} (${g().engagement.kind})`);
      s.dispose();
    }
    console.info(`right vein graft engaged in ${engaged} of ${STARTS.length} starts: ${detail.join("; ")}; seated: ${seated.join("; ")}`);
    expect(engaged, detail.join("; ")).toBeGreaterThanOrEqual(2);
    for (const x of seated) expect(x).toContain("vessel GRAFT:svg-rca");
  }, T);

  it("repeated failed attempts near the LAD graft level raise graft-not-found for its graft; a graft the catheter seats in (its stump) counts as found", () => {
    let raised = 0;
    const detail: string[] = [];
    for (const back of STARTS.slice(0, 3)) {
      const s = open("diag-graft-roadmap-aortogram", "JR4", back);
      const p = s.physics!;
      const model = g().model;
      const d1 = model.grafts!.find((x) => x.id === "svg-d1")!;
      expect(d1.graft.status).toBe("occluded");
      const search = new GraftSearch(model.grafts!);
      const fired: string[] = [];
      const adv = (sec: number) => {
        for (let t = 0; t < sec - 1e-9; t += 1 / 60) {
          s.step(1 / 60);
          const tip = tipOf(p);
          const v = p.frame()?.engagement?.vessel ?? null;
          fired.push(...search.step(1 / 60, tip ? { x: tip[0], y: tip[1], z: tip[2] } : null, graftLumenId(v) ? v : null).map((x) => x.id));
        }
      };
      p.runScript(advanceToRootScript(p), adv);
      p.runScript(withdrawWireScript(p), adv);
      // face the anterior wall where the LAD graft arises, then sweep up and down through its level, turning a
      // little after each pass (tip diag-svg-left-sweep)
      const azD1 = Math.atan2(d1.ostium.pos.z, d1.ostium.pos.x);
      const face = () => {
        for (let k = 0; k < 30; k++) {
          const tip = tipOf(p);
          if (!tip) break;
          let dAz = azD1 - Math.atan2(tip[2], tip[0]);
          while (dAz > Math.PI) dAz -= 2 * Math.PI;
          while (dAz < -Math.PI) dAz += 2 * Math.PI;
          if (Math.abs(dAz) < 0.3 && Math.hypot(tip[0], tip[2]) > 9) break;
          p.command({ kind: "push", device: "catheter", mm: Math.max(-1.5, Math.min(1.5, tip[1] - d1.ostium.pos.y)) });
          p.command({ kind: "torque", device: "catheter", rad: 0.15 * Math.sign(dAz) });
          adv(0.5);
        }
      };
      for (let pass = 0; pass < 6 && !fired.includes("svg-d1"); pass++) {
        face();
        for (let k = 0; k < 14; k++) {
          const tip = tipOf(p);
          if (tip) p.command({ kind: "push", device: "catheter", mm: Math.max(-2, Math.min(2, tip[1] - (d1.ostium.pos.y + 3))) });
          adv(0.25);
        }
        for (let k = 0; k < 14; k++) {
          const tip = tipOf(p);
          if (tip) p.command({ kind: "push", device: "catheter", mm: Math.max(-2, Math.min(2, tip[1] - (d1.ostium.pos.y - 10))) });
          adv(0.25);
        }
      }
      const pr = search.progress(d1.treeName)!;
      const neighbours = model.grafts!.filter((x) => x !== d1).map((x) => `${x.id} ${search.progress(x.treeName)!.attempts}`);
      detail.push(`${back}: ${fired.join(",") || "none"} attempts ${pr.attempts} seated ${pr.engaged}; neighbours ${neighbours.join(", ")}`);
      // the rule: the stump the catheter seats in has been found (no graft-not-found for it); a graft not seated in after
      // the attempts has not
      expect(fired.includes("svg-d1"), detail.join("; ")).toBe(!pr.engaged && pr.attempts >= GRAFT_SEARCH.attempts);
      if (fired.includes("svg-d1")) raised++;
      s.dispose();
    }
    console.info(`LAD-level sweeps: ${detail.join("; ")}`);
    // in at least one start the sweeps fail to seat in the LAD-level graft and graft-not-found is raised for it. These
    // sweeps go down through the RCA graft's level as well, so attempts there are counted too (they are attempts at
    // that level); that a sweep kept inside the LAD graft's band counts only the LAD graft is shown on the rule itself
    // (src/render/xray/grafts.test.ts, "the levels' bands do not overlap"): the rod tip cannot be held inside the
    // band while leaving the level, so this file does not try to.
    expect(raised, detail.join("; ")).toBeGreaterThanOrEqual(1);
  }, T);
});
