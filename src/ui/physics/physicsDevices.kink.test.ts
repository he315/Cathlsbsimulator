// ---------------------------------------------------------------------------
// The kink in the diagnostic lab (diag-catheter-kink): scenario diag-kink-tortuous-iliac through the lab
// session with the rod mechanics and the kink session module (createKinkSessionModule in
// physicsDevices.ts, the event source of catheter-kink and torque-not-transmitted), the damped trace and
// the failed aspiration, the refused injection, the tips, the waiting entries, the practice links, the
// forearm scenario's start state and the table-side recovery's score.
//   npx vitest run src/ui/physics/physicsDevices.kink.test.ts
// ---------------------------------------------------------------------------

import { afterEach, describe, expect, it } from "vitest";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { CASE_LIBRARY, DEFAULT_SCENARIO_SEED, scenarioCase } from "../../simulation/caseGenerator";
import { LAB_TIPS, TIP_BY_ID, tipsFor, type LabTip, type TipTrigger } from "../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import { FINISH_EVENTS } from "../../mentor/report";
import { practiceForLesson } from "../content/practiceIndex";
import { DiagnosticLabSession, labScenarioById, type SessionPhysicsOptions } from "../sim/labSession";
import { SESSION_MODULES } from "../sim/modules";
import { Region } from "../../physics/lumen";
import {
  KINK_RAISES,
  KINK_SCENARIO_IDS,
  KinkControl,
  MP_KINK_INJECT_REFUSE,
  kinkOutcomeText,
  advanceToRootScript,
  createKinkSessionModule,
  kinkControlFor,
  overTorqueScript,
  withdrawWireScript,
  type KinkHost,
  type KinkSessionHost,
  type RodPhysicsReading,
} from "./physicsDevices";
import { MP_KINK_UNTWIST_MAX, MP_KINK_WIRE_PASS_MAX, MP_KINK_WIRE_SEVERITY_MAX, type KinkOutcome } from "../../physics/engine";
import { kinkFor, tab as kinkTab } from "../lab/controls/tabs/KinkTab";
import { tabsFor } from "../lab/controls/registry";

const g = () => useSimulatorStore.getState();
const T = 120_000;
const PHYS: SessionPhysicsOptions = { force: true, useWorker: false, config: {}, autoFallback: false };

const sessions: DiagnosticLabSession[] = [];
afterEach(() => {
  for (const s of sessions.splice(0)) s.dispose();
  g().loadCase(CASE_LIBRARY[0], "free", "beginner");
});

function open(id: string, catheterId: string, back: number, withModule = true): DiagnosticLabSession {
  const c = scenarioCase(id, DEFAULT_SCENARIO_SEED, labScenarioById)!;
  g().loadCase(c, "free", "beginner");
  g().setCatheter(catheterId);
  // The registered modules without the kink module (whether or not src/ui/sim/modules/kink.ts exists yet), then the kink module once.
  const base = SESSION_MODULES.filter((m) => m.create !== createKinkSessionModule && !/\/kink\.ts$/.test(m.file)).map((m) => m.create);
  const modules = withModule ? [...base, createKinkSessionModule] : base;
  const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, physics: { ...PHYS, start: { tipBackMm: back } }, modules });
  s.setTimeOutDone(true);
  sessions.push(s);
  return s;
}

const stepper = (s: DiagnosticLabSession) => (sec: number) => {
  for (let t = 0; t < sec - 1e-9; t += 1 / 60) s.step(1 / 60);
};
const ids = (s: DiagnosticLabSession) => tipsFor(s.tipContext(), 20).map((t) => t.id);

/** To the root over the wire, the wire taken out, then three one-way turns; the first start that kinks. */
function kinkedIliac(): DiagnosticLabSession | null {
  for (const back of [70, 50, 60, 80, 90]) {
    const s = open(KINK_SCENARIO_IDS.iliac, "JR4", back);
    const p = s.physics!;
    const adv = stepper(s);
    p.runScript(advanceToRootScript(p), adv);
    p.runScript(withdrawWireScript(p), adv);
    p.devices.removeWire(); // the wire taken out through the hub (pulling it out by hand takes the length of the catheter)
    adv(1);
    expect(s.tipContext().events).not.toContain("catheter-kink");
    p.runScript(overTorqueScript(p), adv);
    adv(1);
    if (p.kink()) return s;
    s.dispose();
  }
  return null;
}

describe("scenario diag-kink-tortuous-iliac in the lab", () => {
  it("after three one-way turns raises 'catheter-kink' (and torque-not-transmitted), tipsFor(ctx, 20) includes diag-kink-untwist and diag-root-iliac-kink-long-sheath, and __lab.physics.latest().catheter.kink is set", () => {
    const s = kinkedIliac();
    expect(s, "no start kinked").not.toBeNull();
    if (!s) return;
    const ctx = s.tipContext();
    expect(ctx.events).toContain("catheter-kink");
    expect(s.events.history().some((e) => e.event === "torque-not-transmitted")).toBe(true);
    expect(["advance", "engage-left", "engage-right"]).toContain(ctx.phase);
    expect(ids(s)).toEqual(expect.arrayContaining(["diag-kink-untwist", "diag-root-iliac-kink-long-sheath"]));
    const latest = s.physics!.latest() as RodPhysicsReading;
    expect(latest.catheter.kink).not.toBeNull();
    expect(latest.catheter.kink!.severity).toBeGreaterThan(0);
  }, T);

  it("a latched kink gives tipState damped or none and aspiration 'no-return'; an injection through it is refused (the syringe will not push)", () => {
    const s = kinkedIliac();
    expect(s).not.toBeNull();
    if (!s) return;
    stepper(s)(4);
    expect(["damped", "none"]).toContain(s.engine.vitals().tipState);
    s.aspirate();
    expect(g().aspirated).toBe("no-return");
    expect(s.activeEvents()).toContain("aspiration-failed");
    const k = s.physics!.kink()!;
    const control = s.capability("kink")!;
    expect(control).toBeInstanceOf(KinkControl);
    if (k.severity >= MP_KINK_INJECT_REFUSE) {
      expect(s.startInjection()).toBe(false);
      expect(control.score().injectionsThroughKink).toBe(1);
    }
    s.dispose();
    // unconditionally: the forearm scenario opens with a kink tighter than MP_KINK_INJECT_REFUSE
    const f = open(KINK_SCENARIO_IDS.forearm, "JR4", 70);
    stepper(f)(0.5);
    expect(f.physics!.kink()!.severity).toBeGreaterThanOrEqual(MP_KINK_INJECT_REFUSE);
    expect(f.startInjection()).toBe(false);
    expect(f.capability("kink")!.score().injectionsThroughKink).toBe(1);
  }, T);

  it("without the kink module the lab still kinks (the mechanics) but raises no catheter-kink: the event needs the module", () => {
    for (const back of [70, 50]) {
      const s = open(KINK_SCENARIO_IDS.iliac, "JR4", back, false);
      const p = s.physics!;
      const adv = stepper(s);
      p.runScript(advanceToRootScript(p), adv);
      p.runScript(withdrawWireScript(p), adv);
      p.devices.removeWire();
      adv(1);
      p.runScript(overTorqueScript(p), adv);
      adv(1);
      if (!p.kink()) continue;
      expect(s.activeEvents()).not.toContain("catheter-kink");
      return;
    }
    throw new Error("no start kinked");
  }, T);
});

describe("the J wire left inside (the lab's own start)", () => {
  /** JL4 to the root over the scenario's J wire; the wire taken out, or drawn back to just inside the tip; three one-way turns. */
  function overTorqued(back: number, wire: "out" | "inside"): { kinked: boolean; severity: number | null } {
    const s = open(KINK_SCENARIO_IDS.iliac, "JL4", back);
    const p = s.physics!;
    const adv = stepper(s);
    p.runScript(advanceToRootScript(p), adv);
    const lead = Math.max(0, p.view()?.wireLeadMm ?? 0);
    // drawn back to 20 mm short of the tip (inside), or right back and out through the hub
    p.command({ kind: "push", device: "wire035", mm: -(lead + (wire === "inside" ? 20 : 160)) });
    adv(2.5);
    if (wire === "out") p.devices.removeWire();
    adv(1);
    p.runScript(overTorqueScript(p), adv);
    adv(1);
    const k = p.kink();
    const out = { kinked: !!k, severity: k?.severity ?? null };
    s.dispose();
    return out;
  }

  it("kinks in fewer starts than with the wire out, and any kink over the wire is no tighter: mild enough to untwist or to pass the wire again", () => {
    const bare = [50, 60, 70, 80, 90].map((b) => overTorqued(b, "out"));
    const wire = [50, 60, 70, 80, 90].map((b) => overTorqued(b, "inside"));
    const n = (r: typeof bare) => r.filter((x) => x.kinked).length;
    const sev = (r: typeof bare) => r.flatMap((x) => (x.severity === null ? [] : [x.severity]));
    console.info(`JL4 over-torque in 5 starts: wire out ${n(bare)} (severity ${sev(bare).map((x) => x.toFixed(2)).join(", ")}), wire inside ${n(wire)} (severity ${sev(wire).map((x) => x.toFixed(2)).join(", ")})`);
    expect(n(bare)).toBeGreaterThanOrEqual(4);
    expect(n(wire)).toBeLessThan(n(bare));
    const mean = (x: number[]) => x.reduce((a, b) => a + b, 0) / Math.max(1, x.length);
    for (const x of sev(wire)) {
      expect(x).toBeLessThanOrEqual(MP_KINK_WIRE_SEVERITY_MAX + 1e-9);
      expect(x).toBeLessThanOrEqual(Math.min(MP_KINK_UNTWIST_MAX, MP_KINK_WIRE_PASS_MAX));
    }
    if (sev(wire).length) expect(mean(sev(wire))).toBeLessThanOrEqual(mean(sev(bare)));
  }, T);
});

describe("a failed aspiration stands while the hub is held", () => {
  it("the heart's motion of the tip does not clear 'no-return'; the hand moving the catheter does", () => {
    const s = open(KINK_SCENARIO_IDS.forearm, "JR4", 70);
    const adv = stepper(s);
    adv(4);
    expect(s.physics!.kink()).not.toBeNull();
    s.aspirate();
    expect(g().aspirated).toBe("no-return");
    adv(3); // the hub held: only the heart moves the tip
    expect(g().aspirated).toBe("no-return");
    s.physics!.command({ kind: "push", device: "catheter", mm: -2 });
    adv(0.2);
    expect(g().aspirated).toBe("unknown");
  }, T);
});

describe("the table-side recovery", () => {
  it("is offered once the whole catheter is screened under fluoroscopy, reports what the operator would see, and scores the escalation's order", () => {
    const s = kinkedIliac();
    expect(s).not.toBeNull();
    if (!s) return;
    const k = s.capability("kink")!;
    expect(kinkFor(s)).toBe(k);
    expect(tabsFor(s, g().policy).map((t) => t.id)).toContain(kinkTab.id);
    // no step before screening, and screening needs the beam
    k.untwist();
    expect(k.steps).toEqual([]);
    expect(k.screen()).toBe(false);
    s.setPedal({ fluoro: true, cine: false });
    expect(k.screen()).toBe(true);
    s.setPedal({ fluoro: false, cine: false });
    const adv = stepper(s);
    k.untwist();
    adv(3);
    k.poll();
    expect(k.steps[1].observed).toMatch(/tip/);
    // pressurising before snaring: out of the manual's order
    k.pressurise();
    adv(0.5);
    k.snare();
    adv(0.5);
    k.poll();
    const sc = k.score();
    expect(sc.steps).toEqual(["screen", "untwist", "pressurise", "snare"]);
    expect(sc.screenedFirst).toBe(true);
    expect(sc.inOrder).toBe(false);
    expect(sc.kinks).toBeGreaterThanOrEqual(1);
    expect(k.steps.every((e) => e.observed !== null)).toBe(true);
  }, T);

  it("the escalation in order scores in order; a step's text never says whether the shaft is kinked before the step (fake host)", () => {
    const fake: KinkHost = { physics: null, wall: () => 0, pedal: { fluoro: true, cine: false } };
    const k = kinkControlFor(fake);
    expect(k.available()).toBe(false);
    expect(k.screen()).toBe(false); // no rod mechanics, no screening
    expect(k.score()).toMatchObject({ steps: [], inOrder: true, screenedFirst: false });
    // no outcome text names a kink: each says what the step did, whether or not the shaft is kinked
    const outcomes: KinkOutcome[] = ["held", "not-below-brachial", "unwound", "unchanged", "sheathed", "released", "no-catheter"];
    for (const o of outcomes) for (const a of ["snare", "cuff", undefined] as const) expect(kinkOutcomeText(o, a)).not.toMatch(/kink/i);
  });

  it("a refused pull-out says only that the catheter catches; the Shaft tab's set-up follows the engine's (frames) after a change made behind it", () => {
    const s = kinkedIliac();
    expect(s).not.toBeNull();
    if (!s) return;
    const p = s.physics!;
    const k = s.capability("kink")!;
    s.setPedal({ fluoro: true, cine: false });
    expect(k.screen()).toBe(true);
    s.setPedal({ fluoro: false, cine: false });
    k.pullOut();
    const last = k.steps[k.steps.length - 1];
    expect(last.step).toBe("pull-out");
    expect(last.observed).toBe("The catheter catches at the sheath tip and will not come back.");
    const adv = stepper(s);
    expect(p.kinkSetup.model).toBe(true);
    k.setSheath(450);
    expect(k.setup().sheathMm).toBe(450); // shown at once
    adv(0.2);
    expect(p.frame()!.catheter!.kinkSetup!.sheathMm).toBe(450);
    expect(k.setup().sheathMm).toBe(450);
    // the engine's set-up changed behind the tab (as a rewind restoring an earlier state does): the tab follows the frames
    p.devices.kinkCommand({ kind: "kink-setup", setup: { sheathMm: 250, undersized: true } });
    adv(0.2);
    expect(k.setup()).toEqual({ sheathMm: 250, undersized: true, model: true });
  }, T);
});

describe("the kink session module", () => {
  it("restores the beforeInject it wrapped when it detaches", () => {
    const own = () => true;
    const host: KinkSessionHost = {
      physics: null,
      wall: () => 0,
      pedal: { fluoro: false, cine: false },
      events: { raise: () => true, clear: () => undefined },
      beforeInject: own,
      provideCapability: () => undefined,
    };
    const m = createKinkSessionModule();
    const detach = m.attach(host as never);
    expect(host.beforeInject).not.toBe(own);
    expect(host.beforeInject!()).toBe(true);
    if (typeof detach === "function") detach();
    expect(host.beforeInject).toBe(own);
  });
});

describe("scenario diag-kink-radial-forearm", () => {
  it("opens with a kink in the forearm (below the brachial artery) that a wire does not pass; the cuff holds it and untwisting then undoes it", () => {
    const s = open(KINK_SCENARIO_IDS.forearm, "JR4", 70);
    const p = s.physics!;
    const adv = stepper(s);
    adv(0.5);
    const k = p.kink();
    expect(k).not.toBeNull();
    expect(k!.region).toBe(Region.Radial);
    const control = s.capability("kink")!;
    s.setPedal({ fluoro: true, cine: false });
    expect(control.screen()).toBe(true);
    s.setPedal({ fluoro: false, cine: false });
    control.passWire();
    adv(3);
    control.poll();
    expect(p.kink()).not.toBeNull();
    expect(control.steps[control.steps.length - 1].observed).toMatch(/stops/);
    control.cuff();
    adv(0.5);
    control.poll();
    expect(p.kink()!.held).toBe("cuff");
    control.untwist();
    adv(3);
    control.poll();
    expect(p.kink()).toBeNull();
    const sc = control.score();
    expect(sc.inOrder).toBe(true);
    expect(sc.recovered).toBe(true);
  }, T);
});

// ---------------------------------------------------------------------------
// Waiting entries and the practice links
// ---------------------------------------------------------------------------

type RaisesExport = LabRaises | readonly LabRaises[] | undefined;
/** The same sources the reachability report reads (src/content/lab/reachability.test.ts). */
const RAISE_MODULES = import.meta.glob<RaisesExport>(
  [
    "../lab/pciEvents/*.ts",
    "../sim/modules/*.ts",
    "../../simulation/session/modules/*.ts",
    "../lab/*Context.ts",
    "../**/*Tips.ts",
    "../angio/labels.ts",
    "../angio/simFlowDrill.ts",
    "../../simulation/haemo/*.ts",
    "../../simulation/session/scenarios/heparin.ts",
    "../../mentor/bridge/pciSession.ts",
    "!**/*.test.ts",
  ],
  { eager: true, import: "raises" }
);

type Raised = { phases: Set<string>; events: Set<string>; techniques: Set<string>; imaging: Set<string>; procedures: Set<string>; routes: Set<string> };

function merge(list: readonly LabRaises[]): Partial<Record<string, Raised>> {
  const out: Partial<Record<string, Raised>> = {};
  for (const r of list) {
    const m = (out[r.lab] ??= { phases: new Set(), events: new Set(), techniques: new Set(), imaging: new Set(), procedures: new Set(), routes: new Set() });
    r.phases.forEach((x) => m.phases.add(x));
    r.events.forEach((x) => m.events.add(x));
    r.techniques?.forEach((x) => m.techniques.add(x));
    r.imaging?.forEach((x) => m.imaging.add(x));
    r.procedures?.forEach((x) => m.procedures.add(x));
    r.routes?.forEach((x) => m.routes.add(x));
  }
  return out;
}
const any = (want: readonly string[] | undefined, have: Set<string>) => !want?.length || want.some((x) => have.has(x));
function satisfiableIn(when: TipTrigger, phases: readonly string[] | undefined, r: Raised | undefined): boolean {
  return (
    !!r &&
    any(phases, r.phases) &&
    any(when.event, r.events) &&
    (when.requires ?? []).every((e) => r.events.has(e)) &&
    any(when.procedure, r.procedures) &&
    any(when.route, r.routes) &&
    any(when.technique, r.techniques) &&
    any(when.imaging, r.imaging)
  );
}
const satisfiable = (tip: LabTip, raised: Partial<Record<string, Raised>>) =>
  satisfiableIn(tip.when, tip.when.phase, raised[tip.lab]) || (tip.alsoIn ?? []).some((a) => satisfiableIn(tip.when, a.phase, raised[a.lab]));

/** What the registered sources raise, without the kink module's raises (whether or not its module file is registered). */
function declared(): LabRaises[] {
  const out: LabRaises[] = [{ lab: "diagnostic", phases: ["finish"], events: [...FINISH_EVENTS] }];
  for (const exp of Object.values(RAISE_MODULES)) if (exp) out.push(...(Array.isArray(exp) ? exp : [exp as LabRaises]));
  return out.filter((r) => r !== KINK_RAISES);
}

/** Diagnostic tips listed in waiting.ts that no lab can show yet. */
function stillWaiting(raised: Partial<Record<string, Raised>>): string[] {
  const listed = new Set<string>([...WAITING_TIPS.filter((w) => w.lab === "diagnostic").flatMap((w) => w.tips), ...DEFERRED_RETARGETS.map((d) => d.tipId)]);
  return LAB_TIPS.filter((t) => t.lab === "diagnostic" && listed.has(t.id) && !satisfiable(t, raised)).map((t) => t.id);
}

describe("reachability", () => {
  it("every waiting.ts entry naming diag-catheter-kink is satisfiable with the kink module's raises, so the diagnostic waiting count falls by at least their number", () => {
    const entries = WAITING_TIPS.filter((w) => w.raisedBy === "diag-catheter-kink").flatMap((w) => w.tips);
    expect(entries.length).toBeGreaterThanOrEqual(4);
    const withKink = merge([...declared(), KINK_RAISES]);
    for (const id of entries) expect(satisfiable(TIP_BY_ID[id], withKink), id).toBe(true);
    const before = stillWaiting(merge(declared()));
    const after = stillWaiting(withKink);
    expect(before.length - after.length).toBeGreaterThanOrEqual(entries.filter((id) => before.includes(id)).length);
    for (const id of entries) expect(after).not.toContain(id);
  });

  it("practiceIndex lists diag-kink-tortuous-iliac, diag-kink-subclavian and diag-kink-radial-forearm under pm-engaging-torque, eq-sheaths-guides-long-sheathless and cp-prior-cabg-arterial (from kink.launch.ts)", () => {
    const under = (lesson: string) => practiceForLesson(lesson).filter((e) => e.sim === "cathlab").map((e) => e.scenario);
    expect(under("pm-engaging-torque")).toEqual(expect.arrayContaining([KINK_SCENARIO_IDS.iliac, KINK_SCENARIO_IDS.subclavian, KINK_SCENARIO_IDS.forearm]));
    expect(under("eq-sheaths-guides-long-sheathless")).toContain(KINK_SCENARIO_IDS.iliac);
    expect(under("cp-prior-cabg-arterial")).toContain(KINK_SCENARIO_IDS.subclavian);
    for (const e of practiceForLesson("pm-engaging-torque").filter((x) => x.scenario?.startsWith("diag-kink"))) expect(e.source).toMatch(/kink\.launch\.ts$/);
  });
});
