// The anatomy variant scenarios (diag-anatomy-variants) through the scenario script module, their
// event source: an injection that shows a territory without its usual vessel (any first injection for
// the RCA from the left sinus and the left main from the right sinus, the first left injection for the
// circumflex from the right side) or a root injection raises 'anomalous-origin' for the rest of the
// case, the tips written for it appear, and the waiting.ts entries naming this package become
// satisfiable from the lab's own raises exports.
//   npx vitest run src/ui/sim/modules/anatomy.tips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import type { EngagementState } from "../../../types";
import { useSimulatorStore } from "../../../state/useSimulatorStore";
import { CASE_LIBRARY, scenarioCase } from "../../../simulation/caseGenerator";
import { LAB_TIPS, TIP_BY_ID, tipsFor, tipsForAll, type LabTip, type TipTrigger } from "../../../content/lab/tips";
import { WAITING_TIPS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { raises as diagnosticRaises } from "../../lab/diagnosticContext";
import { DIAG_SCENARIOS, scenariosEvents } from "../../../simulation/diagnosticScenarios";
import { launch as anatomyLaunch } from "../../../simulation/diagnosticScenarios/anatomy.launch";
import { launch as engagementLaunch } from "../../../simulation/diagnosticScenarios/engagement.launch";
import { emptyStudyReport, finishContexts, type StudyReport } from "../../../mentor/report";
import { DiagnosticLabSession } from "../labSession";
import { SCRIPT_MODULE_ID, raises as scriptRaises, type ScenarioScript } from "./script";

const g = () => useSimulatorStore.getState();
afterEach(() => g().loadCase(CASE_LIBRARY[0], "free"));

const ANATOMY_IDS = new Set(anatomyLaunch.scenarios!.map((s) => s.id));
const ANOMALOUS = ["diag-anomalous-cx-retroaortic", "diag-rca-from-left-sinus", "diag-lm-from-right-sinus", "diag-high-ostia"];

function session(id: string, seed = "1"): DiagnosticLabSession {
  g().loadCase(scenarioCase(id, seed)!, "free");
  return new DiagnosticLabSession(useSimulatorStore, null, null, { team: false });
}
const scriptOf = (s: DiagnosticLabSession) => s.modules.find((m) => m.id === SCRIPT_MODULE_ID) as ScenarioScript;

/** Put a catheter at a place in the legacy classifier's terms (what the hands would give), as pressureSession.test.ts does. */
function seat(cath: string, kind: "selective-rca" | "selective-lm" | "sinus-level") {
  g().setCatheter(cath);
  const e: Partial<EngagementState> = { kind, target: kind === "sinus-level" ? null : kind === "selective-rca" ? "right" : "left", isSelective: kind !== "sinus-level", isDeep: false, conus: false, depth: 0, quality: 0.8 };
  useSimulatorStore.setState({ engagement: { ...g().engagement, ...e } as EngagementState });
}

describe("the anomalous-origin scenarios raise what their tips need", () => {
  it("diag-anomalous-cx-retroaortic: after the first (left) injection, tipsFor(ctx, 20) includes diag-anomalous-origin-image-first and, with the circumflex in question, diag-interp-anomalous-cx-search", () => {
    const s = session("diag-anomalous-cx-retroaortic");
    try {
      expect(s.activeEvents()).not.toContain("anomalous-origin");
      expect(tipsFor(s.tipContext(), 20).map((t) => t.id)).not.toContain("diag-anomalous-origin-image-first");
      // the action: the first left injection, a selective run through the left catheter (the lateral wall is empty)
      seat("JL4", "selective-lm");
      expect(s.startInjection()).toBe(true);
      expect(scriptOf(s).firedTriggers()).toEqual(["anomaly-left"]);
      expect(s.activeEvents()).toContain("anomalous-origin");
      const ctx = s.tipContext();
      expect(ctx.events).toContain("anomalous-origin");
      const ids = tipsFor(ctx, 20).map((t) => t.id);
      expect(ids).toContain("diag-anomalous-origin-image-first");
      // the circumflex search tip is written for the circumflex: it shows where the lab's context names that vessel,
      // as the finish step does for an empty lateral wall (mentor/report.ts finishContexts)
      const lateralEmpty: Pick<StudyReport, "territories"> = {
        territories: { ...emptyStudyReport().territories, anterior: { kind: "native", artery: "LAD", injection: "left" }, septal: { kind: "native", artery: "LAD", injection: "left" }, apical: { kind: "native", artery: "LAD", injection: "left" }, inferior: { kind: "native", artery: "RCA", injection: "right" }, lateral: { kind: "none" } },
      };
      const ctxs = finishContexts(ctx, lateralEmpty);
      expect(ctxs.some((c) => c.vessel === "LCx")).toBe(true);
      const all = tipsForAll(ctxs, 20).map((t) => t.id);
      expect(all).toEqual(expect.arrayContaining(["diag-anomalous-origin-image-first", "diag-interp-anomalous-cx-search"]));
      expect(tipsFor({ ...ctx, vessel: "LCx" }, 20).map((t) => t.id)).toContain("diag-interp-anomalous-cx-search");
      // held for the rest of the case
      for (let i = 0; i < 40; i++) s.step(2);
      expect(s.activeEvents()).toContain("anomalous-origin");
    } finally {
      s.dispose();
    }
  });

  it("each anomalous-origin scenario raises the event at a root injection, and the other anatomy scenarios do not", () => {
    for (const id of ANATOMY_IDS) {
      const s = session(id);
      try {
        seat("JR4", "sinus-level");
        s.startInjection();
        expect(s.activeEvents().includes("anomalous-origin"), id).toBe(ANOMALOUS.includes(id));
      } finally {
        s.dispose();
      }
    }
  });

  it("diag-anomalous-cx-retroaortic: a first selective RCA run fills the circumflex and raises nothing; the left run that follows raises the event", () => {
    const s = session("diag-anomalous-cx-retroaortic");
    try {
      seat("JR4", "selective-rca");
      expect(s.startInjection()).toBe(true);
      s.releaseInjection();
      expect(scriptOf(s).firedTriggers()).toEqual([]);
      expect(s.activeEvents()).not.toContain("anomalous-origin");
      seat("JL4", "selective-lm");
      expect(s.startInjection()).toBe(true);
      expect(scriptOf(s).firedTriggers()).toEqual(["anomaly-left"]);
      expect(s.activeEvents()).toContain("anomalous-origin");
    } finally {
      s.dispose();
    }
  });

  it("diag-high-ostia: a selective run raises nothing (the ostia are found); a root injection does", () => {
    const s = session("diag-high-ostia");
    try {
      seat("JL4", "selective-lm");
      s.startInjection();
      s.releaseInjection();
      expect(s.activeEvents()).not.toContain("anomalous-origin");
      seat("JL4", "sinus-level");
      s.startInjection();
      expect(scriptOf(s).firedTriggers()).toEqual(["anomaly-root"]);
      expect(s.activeEvents()).toContain("anomalous-origin");
    } finally {
      s.dispose();
    }
  });

  it("diag-rca-from-left-sinus and diag-lm-from-right-sinus: any first injection raises the event", () => {
    for (const id of ["diag-rca-from-left-sinus", "diag-lm-from-right-sinus"]) {
      const s = session(id);
      try {
        seat("JR4", "selective-rca");
        s.startInjection();
        expect(scriptOf(s).firedTriggers(), id).toContain("anomaly-seen");
      } finally {
        s.dispose();
      }
    }
  });

  it("diag-very-dilated-root-telescope reports dilated-root once the catheter is in the root after the time-out", () => {
    const s = session("diag-very-dilated-root-telescope");
    try {
      // the context reads the case's variants (diagnosticContext.ts diagnosticStateEvents)
      expect(g().caseData.variants).toContain("very-dilated-root");
      expect(s.tipContext().events ?? []).not.toContain("dilated-root");
      s.setTimeOutDone(true);
      s.startInjection();
      expect(s.tipContext().events).toContain("dilated-root");
    } finally {
      s.dispose();
    }
  });
});

// --- reachability ----------------------------------------------------------------

function satisfiableIn(when: TipTrigger, phases: readonly string[] | undefined, rs: readonly LabRaises[]): boolean {
  const has = (key: "phases" | "events" | "routes" | "procedures" | "techniques" | "imaging", x: string) => rs.some((r) => ((r[key] ?? []) as readonly string[]).includes(x));
  const any = (want: readonly string[] | undefined, key: Parameters<typeof has>[0]) => !want?.length || want.some((x) => has(key, x));
  return any(phases, "phases") && any(when.event, "events") && (when.requires ?? []).every((e) => has("events", e)) && any(when.procedure, "procedures") && any(when.route, "routes") && any(when.technique, "techniques") && any(when.imaging, "imaging");
}
const satisfiable = (tip: LabTip, rs: readonly LabRaises[]) => (tip.lab === "diagnostic" ? satisfiableIn(tip.when, tip.when.phase, rs) : (tip.alsoIn ?? []).some((a) => a.lab === "diagnostic" && satisfiableIn(tip.when, a.phase, rs)));

describe("reachability", () => {
  it("the script module's raises include anomalous-origin, from this pack", () => {
    expect(scriptRaises.events).toContain("anomalous-origin");
    expect(scriptRaises.events).toEqual(expect.arrayContaining(scenariosEvents(DIAG_SCENARIOS.filter((s) => ANATOMY_IDS.has(s.id)))));
  });

  it("every waiting.ts entry naming diag-anatomy-variants is satisfiable, so the diagnostic lab's waiting count falls by at least their number", () => {
    const mine = WAITING_TIPS.filter((w) => w.raisedBy === "diag-anatomy-variants").flatMap((w) => w.tips);
    expect(mine).toEqual(expect.arrayContaining(["diag-anomalous-origin-image-first", "diag-interp-anomalous-cx-search"]));
    // the diagnostic lab's raises without this pack's scenarios, and with them (diag-engagement-technique-set's pack also
    // raises 'anomalous-origin', for the high ostia its root injections show, so it is left out of 'before' as well)
    const ENGAGEMENT_IDS = new Set(engagementLaunch.scenarios!.map((s) => s.id));
    const others = DIAG_SCENARIOS.filter((s) => !ANATOMY_IDS.has(s.id) && !ENGAGEMENT_IDS.has(s.id));
    const before: LabRaises[] = [diagnosticRaises, { lab: "diagnostic", phases: [], events: scenariosEvents(others) }];
    const after: LabRaises[] = [diagnosticRaises, scriptRaises];
    expect(mine.filter((id) => satisfiable(TIP_BY_ID[id], before))).toEqual([]);
    expect(mine.filter((id) => !satisfiable(TIP_BY_ID[id], after))).toEqual([]);
    const waiting = new Set(WAITING_TIPS.filter((w) => w.lab === "diagnostic").flatMap((w) => w.tips));
    const stillWaiting = (rs: LabRaises[]) => LAB_TIPS.filter((t) => waiting.has(t.id) && !satisfiable(t, rs)).length;
    const fell = stillWaiting(before) - stillWaiting(after);
    console.info(`diagnostic tips listed in waiting.ts and still not satisfiable: ${stillWaiting(before)} -> ${stillWaiting(after)}`);
    expect(fell).toBeGreaterThanOrEqual(mine.length);
  });
});
