// The engagement technique scenarios (diag-engagement-technique-set) through the diagnostic session, their
// event source: the scenario script module raises 'anomalous-origin' when a root injection shows the high left
// main of diag-lm-fold-small-root, and the lab's context raises 'small-root' once the catheter is in that small
// root after the time-out, so the tips written for them appear; the conus of diag-rca-set damps the trace and
// raises 'conus-selective', and a hand-driven conus pose damps the trace and the attending stops a test puff; the practice index lists the scenarios under their lessons; and every waiting.ts entry
// naming this package is satisfiable from the lab's own raises exports.
//   npx vitest run src/ui/sim/modules/engagement.tips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import type { EngagementState } from "../../../types";
import { useSimulatorStore } from "../../../state/useSimulatorStore";
import { CASE_LIBRARY, scenarioCase } from "../../../simulation/caseGenerator";
import { LAB_TIPS, TIP_BY_ID, tipsFor, type LabTip, type TipTrigger } from "../../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { raises as diagnosticRaises } from "../../lab/diagnosticContext";
import { DIAG_SCENARIOS, scenariosEvents } from "../../../simulation/diagnosticScenarios";
import { launch as engagementLaunch } from "../../../simulation/diagnosticScenarios/engagement.launch";
import { practiceForLesson } from "../../content/practiceIndex";
import { DiagnosticLabSession } from "../labSession";
import { SCRIPT_MODULE_ID, raises as scriptRaises, type ScenarioScript } from "./script";
import { computeEngagement, initialControls } from "../../../simulation/engagement";
import { catheterById } from "../../../data/catheters";
import { MentorEngine } from "../../../mentor/mentor";
import type { MentorUtterance } from "../../../mentor/types";
import { mentorInputFromSim } from "../../../mentor/bridge/simulatorStore";

const PACKAGE = "diag-engagement-technique-set";
const g = () => useSimulatorStore.getState();
afterEach(() => g().loadCase(CASE_LIBRARY[0], "free"));

const IDS = new Set(engagementLaunch.scenarios!.map((s) => s.id));

function session(id: string, seed = "1"): DiagnosticLabSession {
  g().loadCase(scenarioCase(id, seed)!, "free");
  return new DiagnosticLabSession(useSimulatorStore, null, null, { team: false });
}
const scriptOf = (s: DiagnosticLabSession) => s.modules.find((m) => m.id === SCRIPT_MODULE_ID) as ScenarioScript;
const tipIds = (s: DiagnosticLabSession) => tipsFor(s.tipContext(), 20).map((t) => t.id);

/** Put a catheter at a place in the legacy classifier's terms (what the hands would give), as the other tips tests do. */
function seat(cath: string, kind: EngagementState["kind"], extra: Partial<EngagementState> = {}) {
  if (g().catheterId !== cath) g().setCatheter(cath);
  const left = kind.endsWith("-lm");
  const right = kind.endsWith("-rca");
  const e: Partial<EngagementState> = { kind, target: left ? "left" : right ? "right" : null, isSelective: kind.startsWith("selective-"), isDeep: kind.startsWith("deep-"), conus: false, depth: 0, quality: 0.8, ...extra };
  useSimulatorStore.setState({ engagement: { ...g().engagement, ...e } as EngagementState });
}

describe("diag-lm-fold-small-root raises what its tips need", () => {
  it("after the action that raises 'small-root' (the catheter in the small root after the time-out) tipsFor(ctx, 20) includes diag-small-root-shorter-jl; after the root injection that raises 'anomalous-origin' it includes diag-anomalous-origin-image-first", () => {
    const s = session("diag-lm-fold-small-root");
    try {
      expect(g().caseData.rootSize).toBe("small");
      expect(g().caseData.variants).toEqual(expect.arrayContaining(["small-root", "high-ostia"]));
      // before: setup, nothing raised
      expect(s.tipContext().events ?? []).not.toContain("small-root");
      expect(tipIds(s)).not.toContain("diag-small-root-shorter-jl");
      expect(s.activeEvents()).not.toContain("anomalous-origin");

      // the action that raises 'small-root': the time-out done and a hand on the catheter in the root
      s.setTimeOutDone(true);
      g().setCatheter("JL4");
      g().commandInsertion(1);
      s.step(0.1);
      seat("JL4", "near-lm");
      s.step(0.05);
      const ctx = s.tipContext();
      expect(ctx.phase).toBe("engage-left");
      expect(ctx.events).toContain("small-root");
      expect(tipIds(s)).toContain("diag-small-root-shorter-jl");
      expect(s.activeEvents()).not.toContain("anomalous-origin");

      // the action that raises 'anomalous-origin': a non-selective injection into the root shows the high left main
      seat("JL4", "sinus-level");
      expect(s.startInjection()).toBe(true);
      expect(scriptOf(s).firedTriggers()).toEqual(["ostium-from-root"]);
      expect(s.activeEvents()).toContain("anomalous-origin");
      expect(tipIds(s)).toContain("diag-anomalous-origin-image-first");
      s.releaseInjection();
      // held for the rest of the case
      for (let i = 0; i < 20; i++) s.step(0.5);
      expect(s.activeEvents()).toContain("anomalous-origin");
    } finally {
      s.dispose();
    }
  });

  it("a selective run raises nothing from the script (the ostium has not been seen from the root)", () => {
    const s = session("diag-lm-fold-small-root");
    try {
      s.setTimeOutDone(true);
      seat("JL3.5", "selective-lm");
      expect(s.startInjection()).toBe(true);
      expect(scriptOf(s).firedTriggers()).toEqual([]);
      expect(s.activeEvents()).not.toContain("anomalous-origin");
    } finally {
      s.dispose();
    }
  });
});

describe("the other scenarios of the set", () => {
  it("diag-rca-set: a conus with its own ostium; the tip in it reads as conus over-selection and raises conus-selective, with the conus tip", () => {
    const s = session("diag-rca-set");
    try {
      expect(g().caseData.variants).toContain("conus-separate-ostium");
      s.setTimeOutDone(true);
      // the case opens with its Judkins right (no exchange), and a hand on it puts it in the root
      expect(g().catheterId).toBe("JR4");
      g().commandInsertion(1);
      s.step(0.1);
      seat("JR4", "selective-rca", { conus: true, isDangerous: true });
      const ctx = s.tipContext();
      expect(ctx.events).toContain("conus-selective");
      expect(tipIds(s)).toContain("diag-conus-withdraw");
      // a deep RCA seat raises catheter-too-deep and the dive tip for a Judkins right
      seat("JR4", "deep-rca");
      expect(s.tipContext().events).toContain("catheter-too-deep");
      expect(tipIds(s)).toContain("diag-rca-dive-back-out");
    } finally {
      s.dispose();
    }
  });

  it("diag-rca-set: driven by the hands onto a real conus pose, the conus entry damps the trace and the supervising attending stops a test puff", () => {
    const s = session("diag-rca-set");
    try {
      expect(g().physicsOn).toBe(false);
      expect(g().catheterId).toBe("JR4");
      // a real conus pose of this case's analytic root for its Judkins right (no seat(): the engagement is the model's)
      const jr4 = catheterById("JR4")!;
      const poses: { insertion: number; torque: number }[] = [];
      for (let ins = -12; ins <= 12; ins += 0.25)
        for (let tq = -2.4; tq <= 2.4 + 1e-9; tq += 0.05) {
          const ctl = { ...initialControls(), insertion: ins, torque: tq, cmdInsertion: ins, cmdTorque: tq };
          if (computeEngagement(g().model, jr4, ctl, g().difficulty).conus) poses.push({ insertion: ins, torque: tq });
        }
      expect(poses.length).toBeGreaterThan(0);
      const pose = poses[Math.floor(poses.length / 2)];

      // the attending in supervised mode, wired to the session's injection guard as useAttending wires it
      const engine = new MentorEngine({ mode: "supervised", entrustment: 2 });
      const said: MentorUtterance[] = [];
      s.beforeInject = () => {
        const r = engine.preAction("inject", mentorInputFromSim(g(), null, s.wall()));
        if (r.utterance) said.push(r.utterance);
        return r.allow;
      };
      s.setTimeOutDone(true);
      // the hands: commanded insertion and torque, the tip settling onto them through the store's dynamics
      g().commandInsertion(pose.insertion - g().controls.cmdInsertion);
      g().commandTorque(pose.torque - g().controls.cmdTorque);
      for (let k = 0; k < 60; k++) s.step(0.1);
      expect(g().controls.insertion).toBeCloseTo(pose.insertion, 2);
      expect(g().controls.torque).toBeCloseTo(pose.torque, 2);
      expect(g().engagement.conus).toBe(true);
      // the conus entry damps the trace
      expect(["damped", "ventricularised"]).toContain(g().pressure.kind);
      expect(s.tipContext().pressure).toBe(g().pressure.kind);
      expect(s.tipContext().events).toContain("conus-selective");
      // a test puff is refused, the attending saying stop for the conus or the damped trace
      const inj0 = g().lastInjection;
      expect(s.startInjection()).toBe(false);
      expect(said).toHaveLength(1);
      expect(["conus", "damped-before-inject"]).toContain(said[0].ruleId);
      expect(said[0].blocking).toBe(true);
      expect(g().lastInjection).toBe(inj0);
    } finally {
      s.beforeInject = null;
      s.dispose();
    }
  });

  it("diag-engage-fail-ladder: a root injection raises anomalous-origin for its high ostia, and the contrast warning raises high-contrast-volume", () => {
    const s = session("diag-engage-fail-ladder");
    try {
      expect(g().caseData.variants).toEqual(expect.arrayContaining(["high-ostia", "tortuous-iliac"]));
      // the case opens on the usual shapes, so the ladder is the learner's
      expect(g().caseData.recommendedCatheters.slice(0, 2)).toEqual(["JL4", "JR4"]);
      s.setTimeOutDone(true);
      seat("JR4", "sinus-level");
      expect(s.startInjection()).toBe(true);
      expect(scriptOf(s).firedTriggers()).toContain("ostium-from-root");
      s.releaseInjection();
      expect(s.activeEvents()).not.toContain("high-contrast-volume");
      // the contrast used reaches the stricter ceiling's warning
      // eGFR 46: the stricter ceiling is 3.7 x 46 = 170 mL (Brilakis), its warning 80% of it; 150 mL is past the warning
      expect(s.engine.contrastBudget().status).toBe("ok");
      s.engine.contrast(150, "right");
      expect(s.engine.contrastBudget().status).toBe("warn");
      s.step(0.3);
      expect(scriptOf(s).firedTriggers()).toContain("contrast-warning");
      expect(s.activeEvents()).toContain("high-contrast-volume");
    } finally {
      s.dispose();
    }
  });

  it("diag-catheter-choice-by-root reports dilated-root once the catheter is in the root after the time-out", () => {
    const s = session("diag-catheter-choice-by-root");
    try {
      s.setTimeOutDone(true);
      g().commandInsertion(1);
      s.step(0.1);
      expect(s.tipContext().events).toContain("dilated-root");
    } finally {
      s.dispose();
    }
  });
});

// --- links and reachability ----------------------------------------------------------------

describe("the practice index and reachability", () => {
  it("practiceIndex lists diag-lm-fold-small-root and diag-radial-left-set under pm-engaging-left, diag-rca-set under pm-engaging-rca and diag-engage-fail-ladder under pm-engaging-fail, from engagement.launch.ts", () => {
    // the entries this pack's launch file gives (diag-lm-fold-over-j-wire, the plan's name for the looped-wire case,
    // stays listed from diag-rod-physics's launch file, which holds that id)
    const ids = (lesson: string) => practiceForLesson(lesson).filter((e) => e.sim === "cathlab" && e.source.endsWith("diagnosticScenarios/engagement.launch.ts")).map((e) => e.scenario);
    expect(practiceForLesson("pm-engaging-left").some((e) => e.scenario === "diag-lm-fold-over-j-wire")).toBe(true);
    expect(ids("pm-engaging-left")).toEqual(expect.arrayContaining(["diag-lm-fold-small-root", "diag-radial-left-set"]));
    expect(ids("pm-engaging-rca")).toContain("diag-rca-set");
    expect(ids("pm-engaging-fail")).toContain("diag-engage-fail-ladder");
    for (const sc of engagementLaunch.scenarios ?? []) for (const lessonId of sc.lessonIds) expect(ids(lessonId), `${sc.id} under ${lessonId}`).toContain(sc.id);
  });

  it("the script module's raises include this pack's events", () => {
    expect(scriptRaises.events).toEqual(expect.arrayContaining(scenariosEvents(DIAG_SCENARIOS.filter((s) => IDS.has(s.id)))));
    expect(scriptRaises.events).toEqual(expect.arrayContaining(["anomalous-origin", "high-contrast-volume"]));
  });

  it("every waiting.ts entry naming diag-engagement-technique-set is satisfiable, so the diagnostic lab's waiting count falls by at least their number", () => {
    const mine = WAITING_TIPS.filter((w) => w.raisedBy === PACKAGE).flatMap((w) => w.tips);
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PACKAGE);
    // waiting.ts names no tip and no retarget for this package (its tips were made reachable by diag-tip-context,
    // diag-anatomy-variants and diag-scenario-registry); the check holds for whatever it lists
    const after: LabRaises[] = [diagnosticRaises, scriptRaises];
    expect(mine.filter((id) => !satisfiable(TIP_BY_ID[id], after))).toEqual([]);
    for (const d of deferred) expect(satisfiableIn(d.when, d.when.phase, after), d.tipId).toBe(true);
    const others = DIAG_SCENARIOS.filter((s) => !IDS.has(s.id));
    const before: LabRaises[] = [diagnosticRaises, { lab: "diagnostic", phases: [], events: scenariosEvents(others) }];
    const waiting = new Set(WAITING_TIPS.filter((w) => w.lab === "diagnostic").flatMap((w) => w.tips));
    const stillWaiting = (rs: LabRaises[]) => LAB_TIPS.filter((t) => waiting.has(t.id) && !satisfiable(t, rs)).length;
    expect(stillWaiting(before) - stillWaiting(after)).toBeGreaterThanOrEqual(mine.length);
    // the tips the package's design names are reachable in the diagnostic lab with this pack registered
    for (const id of ["diag-small-root-shorter-jl", "diag-anomalous-origin-image-first", "diag-conus-withdraw", "diag-rca-dive-back-out", "diag-engage-fail-ladder", "diag-dilated-root-sizing", "diag-ostial-spasm-withdraw-nitrate", "diag-jl-femoral-wire-loop", "diag-short-lm-size-up", "diag-root-match-curve-to-route", "diag-lm-damping-causes"])
      expect(satisfiable(TIP_BY_ID[id], [...after, ...extraRaisers()]), id).toBe(true);
  });
});

/** The other diagnostic event sources (session modules) beside the context and the script, for the design's tip list. */
function extraRaisers(): LabRaises[] {
  const mods = import.meta.glob<{ raises?: LabRaises | readonly LabRaises[] }>(["./*.ts", "!./index.ts", "!./*.test.ts"], { eager: true });
  const out: LabRaises[] = [];
  for (const m of Object.values(mods)) {
    const r = m.raises;
    if (!r) continue;
    for (const x of Array.isArray(r) ? r : [r]) if ((x as LabRaises).lab === "diagnostic") out.push(x as LabRaises);
  }
  const phys = import.meta.glob<{ raises?: LabRaises | readonly LabRaises[] }>(["../../physics/impl/*.ts", "../../physics/physicsDevices.ts"], { eager: true });
  for (const m of Object.values(phys)) {
    const r = m.raises;
    if (!r) continue;
    for (const x of Array.isArray(r) ? r : [r]) if ((x as LabRaises).lab === "diagnostic") out.push(x as LabRaises);
  }
  return out;
}

function satisfiableIn(when: TipTrigger, phases: readonly string[] | undefined, rs: readonly LabRaises[]): boolean {
  const has = (key: "phases" | "events" | "routes" | "procedures" | "techniques" | "imaging", x: string) => rs.some((r) => ((r[key] ?? []) as readonly string[]).includes(x));
  const any = (want: readonly string[] | undefined, key: Parameters<typeof has>[0]) => !want?.length || want.some((x) => has(key, x));
  return any(phases, "phases") && any(when.event, "events") && (when.requires ?? []).every((e) => has("events", e)) && any(when.procedure, "procedures") && any(when.route, "routes") && any(when.technique, "techniques") && any(when.imaging, "imaging");
}
const satisfiable = (tip: LabTip, rs: readonly LabRaises[]) => (tip.lab === "diagnostic" ? satisfiableIn(tip.when, tip.when.phase, rs) : (tip.alsoIn ?? []).some((a) => a.lab === "diagnostic" && satisfiableIn(tip.when, a.phase, rs)));
