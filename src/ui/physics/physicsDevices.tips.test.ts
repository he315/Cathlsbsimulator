// ---------------------------------------------------------------------------
// The lab tips the rod mechanics makes reachable (diag-rod-physics), in scenario
// diag-lm-fold-over-j-wire, through the lab session's tip context (the classifier's reading feeds
// diagnosticContext through the store's engagement and DiagnosticLabSession.physicsReading).
//   npx vitest run src/ui/physics/physicsDevices.tips.test.ts
// ---------------------------------------------------------------------------

import { afterEach, describe, expect, it } from "vitest";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { CASE_LIBRARY, DEFAULT_SCENARIO_SEED, scenarioCase } from "../../simulation/caseGenerator";
import { tipsFor } from "../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS } from "../../content/lab/raisable/waiting";
import { ENGAGE_FAIL_S } from "../lab/diagnosticContext";
import { DiagnosticLabSession, labScenarioById, type SessionPhysicsOptions } from "../sim/labSession";
import { advanceToRootScript, conusScript, engageScript, withdrawWireScript } from "./physicsDevices";

const g = () => useSimulatorStore.getState();
const T = 110_000;
const PHYS: SessionPhysicsOptions = { force: true, useWorker: false, config: {}, autoFallback: false };

const sessions: DiagnosticLabSession[] = [];
afterEach(() => {
  for (const s of sessions.splice(0)) s.dispose();
  g().loadCase(CASE_LIBRARY[0], "free", "beginner");
});

/** The scenario with a JR4 (the learner changed catheters before the session), time-out done. */
function openWithJr4(physics: SessionPhysicsOptions): DiagnosticLabSession {
  const c = scenarioCase("diag-lm-fold-over-j-wire", DEFAULT_SCENARIO_SEED, labScenarioById)!;
  g().loadCase(c, "free", "beginner");
  g().setCatheter("JR4");
  const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, physics });
  s.setTimeOutDone(true);
  sessions.push(s);
  return s;
}

const stepper = (s: DiagnosticLabSession) => (sec: number) => {
  for (let t = 0; t < sec - 1e-9; t += 1 / 60) s.step(1 / 60);
};

const ids = (s: DiagnosticLabSession) => tipsFor(s.tipContext(), 20).map((t) => t.id);

describe("diag-rod-physics tips in scenario diag-lm-fold-over-j-wire", () => {
  it("after the JR4 is driven into the conus ('conus-selective'), tipsFor(ctx, 20) includes diag-conus-withdraw", () => {
    let shown = false;
    const detail: string[] = [];
    for (const back of [50, 60, 70, 80, 90]) {
      const s = openWithJr4({ ...PHYS, moveCoronaries: false, start: { tipBackMm: back } });
      const p = s.physics!;
      const adv = stepper(s);
      p.runScript(advanceToRootScript(p), adv);
      p.runScript(withdrawWireScript(p), adv);
      // no conus event before the action
      expect(s.tipContext().events).not.toContain("conus-selective");
      if (!p.runScript(conusScript(p, 40, 1), adv)) {
        detail.push(`${back}: not in the conus`);
        s.dispose();
        continue;
      }
      const ctx = s.tipContext();
      expect(ctx.events).toContain("conus-selective");
      expect(ids(s)).toContain("diag-conus-withdraw");
      shown = true;
      break;
    }
    expect(shown, detail.join("; ")).toBe(true);
  }, T);

  it("after the JR4 is held at the right sinus without engaging for longer than ENGAGE_FAIL_S ('engage-fail'), tipsFor(ctx, 20) includes diag-shepherds-crook-shapes", () => {
    const s = openWithJr4({ ...PHYS, start: { tipBackMm: 70 } });
    const p = s.physics!;
    const adv = stepper(s);
    p.runScript(advanceToRootScript(p), adv);
    p.runScript(withdrawWireScript(p), adv);
    expect(s.tipContext().events).not.toContain("engage-fail");
    // the action: the tip turned towards the right sinus and kept 6 mm above the right coronary ostium,
    // so it never seats; small corrections every 0.5 s for longer than ENGAGE_FAIL_S
    const m = s.model;
    const azR = Math.atan2(m.rca.pos.z, m.rca.pos.x);
    for (let t = 0; t < ENGAGE_FAIL_S + 5; t += 0.5) {
      const tip = p.frame()!.catheter!.tip;
      let dAz = azR - Math.atan2(tip[2], tip[0]);
      while (dAz > Math.PI) dAz -= 2 * Math.PI;
      while (dAz < -Math.PI) dAz += 2 * Math.PI;
      if (Math.abs(dAz) > 0.5) p.command({ kind: "torque", device: "catheter", rad: 0.15 * Math.sign(dAz) });
      const push = Math.max(-1.5, Math.min(1.5, tip[1] - (m.rca.pos.y + 6)));
      if (Math.abs(push) > 0.3) p.command({ kind: "push", device: "catheter", mm: push });
      adv(0.5);
    }
    expect(g().engagement.isSelective).toBe(false);
    const ctx = s.tipContext();
    expect(ctx.events).toContain("engage-fail");
    expect(ctx.phase).toBe("engage-right");
    expect(ctx.catheter).toBe("JR");
    expect(ids(s)).toContain("diag-shepherds-crook-shapes");
  }, T);

  it("a right catheter pushed on until it folds onto the valve, twice within a minute, raises 'engage-fail' (repeated prolapse)", () => {
    let raised = false;
    const detail: string[] = [];
    for (const back of [50, 70, 90]) {
      const s = openWithJr4({ ...PHYS, moveCoronaries: false, start: { tipBackMm: back } });
      const p = s.physics!;
      const adv = stepper(s);
      p.runScript(advanceToRootScript(p), adv);
      p.runScript(withdrawWireScript(p), adv);
      let folds = 0;
      for (let k = 0; k < 2; k++) {
        let folded = false;
        for (let i = 0; i < 12 && !folded; i++) {
          p.command({ kind: "push", device: "catheter", mm: 8 });
          adv(0.6);
          folded = !!p.frame()?.engagement?.prolapsed;
        }
        if (!folded) break;
        folds++;
        adv(1);
        // back out of the fold before the next attempt
        p.command({ kind: "push", device: "catheter", mm: -25 });
        adv(1.5);
      }
      adv(0.5);
      detail.push(`${back}: ${folds} folds, ${p.recentProlapses()} counted, events ${s.activeEvents().join(",")}`);
      if (folds === 2) {
        expect(p.recentProlapses()).toBeGreaterThanOrEqual(2);
        expect(s.activeEvents()).toContain("engage-fail");
        raised = true;
        break;
      }
      s.dispose();
    }
    expect(raised, detail.join("; ")).toBe(true);
  }, T);

  it("the context takes the rod's reading: a seated Judkins left reads as engage-left in the left main", () => {
    const c = scenarioCase("diag-lm-fold-over-j-wire", DEFAULT_SCENARIO_SEED, labScenarioById)!;
    let s: DiagnosticLabSession | null = null;
    for (const back of [50, 60, 70, 80, 90]) {
      g().loadCase(c, "free", "beginner");
      const t = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, physics: { ...PHYS, start: { tipBackMm: back } } });
      t.setTimeOutDone(true);
      sessions.push(t);
      if (t.physics!.runScript(engageScript(t.physics!, "left"), stepper(t))) {
        s = t;
        break;
      }
      t.dispose();
    }
    expect(s).not.toBeNull();
    if (!s) return;
    expect(s.physicsReading?.tipZone).toBe("root");
    expect(s.physicsReading?.vessel).toBe("LM");
    const ctx = s.tipContext();
    expect(ctx.phase).toBe("engage-left");
    expect(ctx.vessel).toBe("LM");
    expect(ctx.engagement).toBe("selective-lm");
    // the scripted seat (eased back, free trace) is not reported as non-coaxial
    expect(ctx.events).not.toContain("non-coaxial");
  }, T);

  it("every waiting.ts entry naming diag-rod-physics is satisfiable (there are none: the package's tips were already reachable through diag-tip-context's raises)", () => {
    const waiting = WAITING_TIPS.filter((w) => w.raisedBy === "diag-rod-physics");
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === "diag-rod-physics");
    expect(waiting).toEqual([]);
    expect(deferred).toEqual([]);
  });
});
