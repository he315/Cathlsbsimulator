// The diagnostic lab's tips reached through its context (diag-tip-context): named scenarios that
// raise the events their tips are written for, the guided drawer's selection, and the reachability
// of every waiting.ts entry this package is named for, from the lab's own raises exports.
//   npx vitest run src/ui/lab/diagnosticTips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { CASE_LIBRARY } from "../../simulation/caseGenerator";
import * as tipsModule from "../../content/lab/tips";
import { LAB_TIPS, TIP_BY_ID, tipsFor, type LabTip, type TipTrigger } from "../../content/lab/tips";
import { WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import type { AnatomyCase } from "../../types";
import { DiagnosticLabSession } from "../sim/labSession";
import { DEFAULT_TIP_LIMIT, selectTips } from "./useLabTips";
import { raises as diagnosticRaises } from "./diagnosticContext";

const g = () => useSimulatorStore.getState();
const routine = CASE_LIBRARY[0];

function session(c: AnatomyCase): DiagnosticLabSession {
  g().loadCase(c, "free");
  return new DiagnosticLabSession(useSimulatorStore, null, null, { team: false });
}

afterEach(() => g().setPedalImaging(false));

describe("named scenarios raise what their tips need", () => {
  it("post-arrest: after the culprit occlusion raises st-elevation, tipsFor(ctx, 20) includes diag-ohca-ecg-sorts at setup", () => {
    // a resuscitated patient (the scenario's case event) whose LAD is occluded: the ST segments rise on the monitor
    const s = session({ ...routine, id: "ohca-fixture", events: ["post-arrest"] });
    expect(s.tipContext()).toMatchObject({ phase: "setup", events: ["post-arrest"] });
    expect(tipsFor(s.tipContext(), 20).map((t) => t.id)).not.toContain("diag-ohca-ecg-sorts");
    s.engine.setOcclusion("culprit", { vessel: "LAD", param: 0.1, fraction: 1 });
    let t = 0;
    while (!s.tipContext().events?.includes("st-elevation") && t < 120) {
      s.step(0.1);
      t += 0.1;
    }
    const ctx = s.tipContext();
    expect(ctx.phase).toBe("setup");
    expect(ctx.events).toEqual(expect.arrayContaining(["post-arrest", "st-elevation"]));
    const ids = tipsFor(ctx, 20).map((x) => x.id);
    expect(ids).toContain("diag-ohca-ecg-sorts");
    // and the ST-elevation tips of the diagnostic lab's own setup phase
    expect(ids).toContain("diag-stemi-predict-artery");
    s.dispose();
  });

  it("prior CABG: at phase 'setup' tipsFor(ctx, 20) includes diag-graft-op-note-first, and the vein graft tips when it is sought", () => {
    const s = session({
      ...routine,
      id: "cabg-fixture",
      grafts: [
        { conduit: "svg", target: "RCA", position: 0.5, proximalSite: "aorta-low", status: "patent", ringMarker: true },
        { conduit: "lima", target: "LAD", position: 0.6, proximalSite: "left-subclavian", status: "patent", ringMarker: false },
      ],
    });
    const setup = s.tipContext();
    expect(setup).toMatchObject({ phase: "setup", vessel: "SVG" });
    expect(setup.events).toContain("prior-cabg");
    expect(tipsFor(setup, 20).map((t) => t.id)).toContain("diag-graft-op-note-first");
    // after the time-out, a JR4 lifted above the sinuses where vein grafts arise
    s.setTimeOutDone(true);
    g().setCatheter("JR4");
    s.step(0.05);
    expect(s.tipContext().phase).toBe("exchange");
    for (let i = 0; i < 400 && s.tipContext().phase === "exchange"; i++) s.step(0.05);
    g().commandInsertion(-40);
    for (let i = 0; i < 60; i++) s.step(0.05);
    const graft = s.tipContext();
    expect(graft).toMatchObject({ phase: "engage-graft", vessel: "SVG", catheter: "JR" });
    expect(tipsFor(graft, 20).map((t) => t.id)).toEqual(expect.arrayContaining(["diag-svg-jr4-after-rca", "diag-svg-right-graft-lao"]));
    s.dispose();
  });

  it("VF raised into the session's log shows diag-vf-shock-then-amiodarone in the guided drawer; 61 s of lab time clears it", () => {
    const s = session(routine);
    s.setTimeOutDone(true);
    const guided = { mode: "guided" as const, helpAskedAt: null };
    s.events.raise("vf");
    expect(selectTips(tipsModule, s.tipContext(), guided, DEFAULT_TIP_LIMIT).map((t) => t.id)).toContain("diag-vf-shock-then-amiodarone");
    // the exam shows none
    expect(selectTips(tipsModule, s.tipContext(), { mode: "exam", helpAskedAt: null }, DEFAULT_TIP_LIMIT)).toEqual([]);
    for (let i = 0; i < 610; i++) s.step(0.1);
    expect(selectTips(tipsModule, s.tipContext(), guided, DEFAULT_TIP_LIMIT).map((t) => t.id)).not.toContain("diag-vf-shock-then-amiodarone");
    s.dispose();
  });

  it("an air embolism recorded by the store raises 'air' (diag-air-small-bubble while injecting)", () => {
    const s = session(routine);
    s.setTimeOutDone(true);
    s.step(0.1);
    useSimulatorStore.setState((st) => ({ events: [...st.events, { t: 1, code: "air-embolism" as const, message: "fixture", context: st.caseData.name }] }));
    s.step(0.1);
    expect(s.tipContext().events).toContain("air");
    expect(tipsFor({ ...s.tipContext(), phase: "inject" }, 20).map((t) => t.id)).toContain("diag-air-small-bubble");
    s.dispose();
  });
});

// ---------------------------------------------------------------------------
// Reachability from the raises exports (the same rule as src/content/lab/reachability.test.ts)
// ---------------------------------------------------------------------------

type RaisesExport = LabRaises | readonly LabRaises[] | undefined;
const SESSION_MODULE_RAISES = import.meta.glob<RaisesExport>(["../sim/modules/*.ts", "!**/*.test.ts"], { eager: true, import: "raises" });

function diagnosticRaisesAll(): LabRaises[] {
  const out: LabRaises[] = [diagnosticRaises];
  for (const exp of Object.values(SESSION_MODULE_RAISES)) {
    if (!exp) continue;
    for (const r of Array.isArray(exp) ? exp : [exp as LabRaises]) if (r.lab === "diagnostic") out.push(r);
  }
  return out;
}

function satisfiableIn(when: TipTrigger, phases: readonly string[] | undefined, rs: readonly LabRaises[]): boolean {
  const has = (key: "phases" | "events" | "routes" | "procedures" | "techniques" | "imaging", x: string) => rs.some((r) => ((r[key] ?? []) as readonly string[]).includes(x));
  const any = (want: readonly string[] | undefined, key: Parameters<typeof has>[0]) => !want?.length || want.some((x) => has(key, x));
  return any(phases, "phases") && any(when.event, "events") && (when.requires ?? []).every((e) => has("events", e)) && any(when.procedure, "procedures") && any(when.route, "routes") && any(when.technique, "techniques") && any(when.imaging, "imaging");
}

function satisfiableInDiagnostic(tip: LabTip, rs: readonly LabRaises[]): boolean {
  if (tip.lab === "diagnostic") return satisfiableIn(tip.when, tip.when.phase, rs);
  const borrow = tip.alsoIn?.find((a) => a.lab === "diagnostic");
  return !!borrow && satisfiableIn(tip.when, borrow.phase, rs);
}

describe("reachability of the diagnostic tips from the lab's raises", () => {
  it("every waiting.ts entry naming diag-tip-context is satisfiable now", () => {
    const rs = diagnosticRaisesAll();
    const mine = WAITING_TIPS.filter((w) => w.raisedBy === "diag-tip-context").flatMap((w) => w.tips);
    expect(mine.length).toBeGreaterThan(100);
    const missing = mine.filter((id) => TIP_BY_ID[id] && !satisfiableInDiagnostic(TIP_BY_ID[id], rs));
    expect(missing).toEqual([]);
  });

  it("satisfiable diagnostic tips rise from the unconditional ones (no raises export before this package) to every tip whose names the lab raises", () => {
    const rs = diagnosticRaisesAll();
    const diag = LAB_TIPS.filter((t) => t.lab === "diagnostic");
    const before = diag.filter((t) => satisfiableInDiagnostic(t, [])).length;
    const after = diag.filter((t) => satisfiableInDiagnostic(t, rs));
    const borrowed = LAB_TIPS.filter((t) => t.lab !== "diagnostic" && satisfiableInDiagnostic(t, rs));
    console.info(`diagnostic tips satisfiable in the diagnostic lab: ${before} -> ${after.length} of ${diag.length}; borrowed tips: ${borrowed.length}`);
    // before, only a tip with no phase or event condition at all (diag-dissection-diagnostic-catheter: a pressure trigger)
    const unconditional = diag.filter((t) => !t.when.phase?.length && !t.when.event?.length && !t.when.requires?.length && !t.when.route?.length && !t.when.procedure?.length && !t.when.technique?.length && !t.when.imaging?.length);
    expect(before).toBe(unconditional.length);
    // the rest wait on names another package raises (scenario events, kinks, spasm, streaming, graft-not-found)
    const notYet = diag.filter((t) => !after.includes(t));
    for (const t of notYet) {
      const names = [...(t.when.event ?? []), ...(t.when.requires ?? [])];
      expect(names.length, `${t.id} waits on no event`).toBeGreaterThan(0);
    }
    expect(after.length).toBeGreaterThanOrEqual(130);
  });
});
