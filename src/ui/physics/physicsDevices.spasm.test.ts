// ---------------------------------------------------------------------------
// Spasm in the diagnostic lab (diag-spasm-states): the scenarios of spasm.ts through the lab session, with
// the scenario script (registered) and the spasm session module (createSpasmSessionModule in
// physicsDevices.ts, the event source of ostial-spasm, radial-spasm, haematoma and bleeding; attached here
// as the kink tests attach theirs, whether or not its module file is registered), the tips, the waiting
// entries, the practice links, the radial measures and the avulsion, and the rod mechanics' narrowed and
// gripping radial lumen.
//   npx vitest run src/ui/physics/physicsDevices.spasm.test.ts
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
import { SCRIPT_MODULE_ID, type ScenarioScript } from "../sim/modules/script";
import { LumenSet, Region, RADIAL_SPASM_LUMEN, SPASM_CONTROL, spasmControlInput, regionFrictionScale, type LumenHit } from "../../physics/lumen";
import { MP_RADIAL_LIVE, hubAxialForceN, radialLumenScale } from "../../simulation/access/radialSpasm";
import { CATHETERS } from "../../data/catheters";
import { scenarios as spasmScenarios, spasmSetups } from "../../simulation/diagnosticScenarios/spasm";
import { launch as spasmLaunch } from "../../simulation/diagnosticScenarios/spasm.launch";
import { DIAG_SCENARIOS, diagScenarioById } from "../../simulation/diagnosticScenarios";
import { buildAnatomy } from "../../simulation/anatomy";
import { SPASM_MODULE_ID, SPASM_RAISES, MP_SPASM_MODULE, createSpasmSessionModule, isSpasmPackScenario, radialSpasmControlFor, type SpasmSessionHost } from "./physicsDevices";

const g = () => useSimulatorStore.getState();
const sessions: DiagnosticLabSession[] = [];
afterEach(() => {
  for (const s of sessions.splice(0)) s.dispose();
  g().setPedalImaging(false);
  g().loadCase(CASE_LIBRARY[0], "free", "beginner");
});

/** The registered modules without the spasm module (whether or not its file is registered), then the spasm module once. */
function moduleList(withModule: boolean) {
  const base = SESSION_MODULES.filter((m) => m.create !== createSpasmSessionModule && !/\/spasm\.ts$/.test(m.file)).map((m) => m.create);
  return withModule ? [...base, createSpasmSessionModule] : base;
}

function open(id: string, withModule = true, physics: SessionPhysicsOptions | false = false): DiagnosticLabSession {
  const c = scenarioCase(id, DEFAULT_SCENARIO_SEED, labScenarioById)!;
  g().loadCase(c, "free", "beginner");
  const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, physics, modules: moduleList(withModule) });
  s.setTimeOutDone(true);
  sessions.push(s);
  return s;
}
const run = (s: DiagnosticLabSession, sec: number) => {
  for (let i = 0; i < Math.round(sec * 10); i++) s.step(0.1);
};
const ids = (s: DiagnosticLabSession) => tipsFor(s.tipContext(), 20).map((t) => t.id);
const control = (s: DiagnosticLabSession) => radialSpasmControlFor(s as unknown as SpasmSessionHost);

/** Seat the catheter in the RCA (the simple model's engagement) and film a run there: the views phase. */
function seat(kind: "selective-rca" | "deep-rca") {
  useSimulatorStore.setState({ engagement: { ...g().engagement, kind, target: "right", isSelective: true, isDeep: kind === "deep-rca", quality: 0.9 } });
}
function filmed(s: DiagnosticLabSession) {
  useSimulatorStore.setState({ bolus: { filled: ["RCA"], plume: "none", side: "right", phase: 0.5, duration: 60, progress: 1, intensity: 1, peak: 1, diagnostic: true, filmed: true, counted: true, labEnded: true } });
  s.step(0.01);
  useSimulatorStore.setState({ bolus: null });
}
/** Move the catheter by `mm` over `sec` (negative: a withdrawal), as the hand on the hub does. */
function move(s: DiagnosticLabSession, mm: number, sec: number) {
  const n = Math.max(1, Math.round(sec * 10));
  for (let i = 0; i < n; i++) {
    const c = g().controls;
    useSimulatorStore.setState({ controls: { ...c, insertion: c.insertion + mm / n, cmdInsertion: c.cmdInsertion + mm / n } });
    s.step(0.1);
  }
}

describe("diag-catheter-tip-spasm-rca raises what its tips need", () => {
  it("after the action that raises 'ostial-spasm' (a JR4 seated deep in the small RCA ventricularises it), tipsFor(ctx, 20) includes diag-ostial-spasm-withdraw-nitrate and diag-acq-spasm-repeat-view", () => {
    // the registered modules only: the scenario script raises it in the live lab today
    const s = open("diag-catheter-tip-spasm-rca", false);
    run(s, 1);
    seat("selective-rca");
    run(s, 2);
    filmed(s);
    expect(s.tipContext().events).not.toContain("ostial-spasm");
    seat("deep-rca");
    run(s, 4);
    expect(["ventricularised", "damped"]).toContain(s.tipState);
    expect((s.modules.find((m) => m.id === SCRIPT_MODULE_ID) as ScenarioScript).firedTriggers()).toEqual(["tip-spasm"]);
    // withdrawn to a free seat and the same view filmed again: the views phase, the spasm held
    seat("selective-rca");
    run(s, 2);
    filmed(s);
    const ctx = s.tipContext();
    expect(ctx.phase).toBe("views");
    expect(ctx.events).toContain("ostial-spasm");
    expect(ids(s)).toEqual(expect.arrayContaining(["diag-ostial-spasm-withdraw-nitrate", "diag-acq-spasm-repeat-view"]));
  });

  it("with the spasm module the engine's own spasm raises 'ostial-spasm', it outlasts the withdrawal, and nitrate relieves it", () => {
    const s = open("diag-catheter-tip-spasm-rca");
    expect(s.modules.some((m) => m.id === SPASM_MODULE_ID)).toBe(true);
    // the module turned the engine's tip spasm model on for this small RCA
    expect(s.engine.tipSpasmModel()!.gain.right).toBeGreaterThan(s.engine.tipSpasmModel()!.gain.left);
    run(s, 1);
    seat("deep-rca");
    run(s, 30);
    expect(s.engine.tipSpasm().right).toBeGreaterThan(MP_SPASM_MODULE.ostialAt);
    expect(s.tipContext().events).toContain("ostial-spasm");
    const peak = s.engine.tipSpasm().right;
    // withdrawn to the root: the spasm stays
    useSimulatorStore.setState({ engagement: { ...g().engagement, kind: "sinus-level", target: null, isSelective: false, isDeep: false } });
    run(s, 30);
    expect(s.engine.tipSpasm().right).toBeGreaterThan(0.7 * peak);
    // 100 µg of intracoronary nitroglycerin and a 2 minute wait
    expect(s.engine.giveDrug("gtn", 100, "ic", { side: "right" }).ok).toBe(true);
    run(s, 120);
    expect(s.engine.tipSpasm().right).toBeLessThan(0.1 * peak);
  });
});

describe("diag-catheter-tip-spasm-rca: the start seat and the event's lapse", () => {
  it("opens with a JR4 that does not cram the cusp: once the start has settled the aspirate returns blood, and the tip is not in the conus", () => {
    const s = open("diag-catheter-tip-spasm-rca", false);
    expect(g().catheterId).toBe("JR4");
    expect(g().tip.cram).toBeLessThan(4);
    run(s, 3);
    expect(g().engagement.conus).toBe(false);
    expect(s.engine.vitals().tipState).toBe("aortic");
    expect(s.aspirate()?.outcome).toBe("free");
  });

  it("the script's ostial-spasm lapses after the spasm module's hold once the catheter is withdrawn and nitrate given (registered modules only)", () => {
    const s = open("diag-catheter-tip-spasm-rca", false);
    run(s, 1);
    seat("deep-rca");
    run(s, 4);
    expect(s.tipContext().events).toContain("ostial-spasm");
    useSimulatorStore.setState({ engagement: { ...g().engagement, kind: "sinus-level", target: null, isSelective: false, isDeep: false } });
    expect(s.engine.giveDrug("gtn", 100, "ic", { side: "right" }).ok).toBe(true);
    run(s, MP_SPASM_MODULE.ostialHoldS + 5);
    expect(s.tipContext().events).not.toContain("ostial-spasm");
  });

  it("with the spasm module, ostial-spasm follows the engine's spasm: gone after withdrawal, nitrate and 120 s, and not raised again on a gentle re-engagement", () => {
    const s = open("diag-catheter-tip-spasm-rca");
    run(s, 1);
    seat("deep-rca");
    run(s, 30);
    expect(s.tipContext().events).toContain("ostial-spasm");
    useSimulatorStore.setState({ engagement: { ...g().engagement, kind: "sinus-level", target: null, isSelective: false, isDeep: false } });
    expect(s.engine.giveDrug("gtn", 100, "ic", { side: "right" }).ok).toBe(true);
    run(s, 120);
    seat("selective-rca");
    run(s, 5);
    expect(s.engine.tipSpasm().right).toBeLessThan(MP_SPASM_MODULE.ostialAt);
    expect(s.tipContext().events).not.toContain("ostial-spasm");
  });
});

describe("radial spasm as a live state (diag-radial-spasm-entrapment)", () => {
  it("the catheter drags and the forearm hurts: radial-spasm is raised and the radial spasm tips appear", () => {
    const s = open("diag-radial-spasm-entrapment");
    const r = s.engine.radial!;
    expect(r).not.toBeNull();
    expect(r.setup.radialDiamMm).toBe(spasmSetups["diag-radial-spasm-entrapment"].radialDiamMm);
    expect(r.exchanges).toBe(2);
    run(s, 1);
    expect(r.level).toBeGreaterThan(MP_RADIAL_LIVE.significantAt);
    // a gentle withdrawal of 10 mm over 4 s: it drags, it hurts, but the artery holds
    move(s, -10, 4);
    const c = control(s);
    expect(c.avulsion).toBeNull();
    expect(c.drag()).not.toBe("none");
    expect(s.tipContext().events).toContain("radial-spasm");
    expect(ids(s)).toContain("diag-radial-spasm-release");
    // the forearm hurts; the chest does not, and the haemodynamics are those of a run without the module
    expect(s.engine.vitals().symptoms.forearmPain ?? 0).toBeGreaterThan(0);
    expect(s.engine.vitals().symptoms.chestPain).toBe(0);
    const ev = s.tipContext().events;
    for (const x of ["chest-pain", "high-lvedp", "pulmonary-oedema"] as const) expect(ev, x).not.toContain(x);
  });

  it("forearm pain stays out of the chest pain and the haemodynamics: LVEDP and MAP within 5 mmHg of a run without the module", () => {
    const read = (withModule: boolean) => {
      const s = open("diag-radial-spasm-entrapment", withModule);
      run(s, 1);
      move(s, -10, 4);
      run(s, 4);
      const v = s.engine.vitals();
      const out = { lvedp: v.lvedp, map: v.aortaTrue.mean, chestPain: v.symptoms.chestPain, forearm: v.symptoms.forearmPain ?? 0, events: [...(s.tipContext().events ?? [])] };
      s.dispose();
      sessions.splice(sessions.indexOf(s), 1);
      return out;
    };
    const off = read(false);
    const on = read(true);
    expect(on.forearm).toBeGreaterThan(0);
    expect(on.chestPain).toBe(off.chestPain);
    expect(Math.abs(on.lvedp - off.lvedp)).toBeLessThan(5);
    expect(Math.abs(on.map - off.map)).toBeLessThan(5);
    for (const x of ["chest-pain", "high-lvedp", "pulmonary-oedema"]) expect(on.events, x).not.toContain(x);
  });

  it("a catheter exchange through the spasm is an exchange, not a pull: no avulsion, no haematoma", () => {
    const s = open("diag-radial-spasm-entrapment");
    run(s, 1);
    const r = s.engine.radial!;
    expect(r.exchanges).toBe(2);
    move(s, 40, 4);
    const other = CATHETERS.find((x) => x.id !== g().catheterId && x.category !== "guide")!;
    g().setCatheter(other.id);
    expect(g().catheterId).toBe(other.id);
    run(s, 1);
    const c = control(s);
    expect(c.avulsion).toBeNull();
    expect(r.avulsed).toBe(false);
    expect(s.tipContext().events).not.toContain("haematoma");
    expect(r.exchanges).toBe(3);
    // a jump no hand makes (a reset of the controls) is not a pull either
    const k = g().controls;
    useSimulatorStore.setState({ controls: { ...k, insertion: k.insertion + 400, cmdInsertion: k.cmdInsertion + 400 } });
    run(s, 0.5);
    useSimulatorStore.setState({ controls: { ...g().controls, insertion: 0, cmdInsertion: 0 } });
    run(s, 0.5);
    expect(c.avulsion).toBeNull();
    expect(s.tipContext().events).not.toContain("haematoma");
  });

  it("a forceful pull at spasm 0.8 raises haematoma and records avulsion; the forearm check finds the swelling", () => {
    const s = open("diag-radial-spasm-entrapment");
    run(s, 1);
    const r = s.engine.radial!;
    // hold the tone at 0.8 for the pull
    r.spasm.level = 0.8;
    move(s, -15, 0.3);
    const c = control(s);
    expect(c.avulsion).not.toBeNull();
    expect(c.avulsion!.level).toBeGreaterThan(MP_RADIAL_LIVE.avulsionLevel);
    expect(c.avulsion!.hubAxialN).toBeGreaterThan(MP_RADIAL_LIVE.avulsionN);
    expect(r.avulsed).toBe(true);
    const ctx = s.tipContext();
    expect(ctx.events).toContain("haematoma");
    expect(ctx.events).toContain("bleeding");
    // the forearm at the end of the case
    run(s, 120);
    const f = c.checkForearm();
    expect(f.grade).not.toBe("none");
    expect(c.forearmChecks.length).toBe(1);
  });

  it("the module text's measures release it: verapamil into the artery (intravenously when the side arm will not aspirate), and no lidocaine into the artery", () => {
    const s = open("diag-radial-spasm-entrapment");
    run(s, 1);
    const c = control(s);
    const r = s.engine.radial!;
    // a clamped artery round the sheath tip: the side arm will not aspirate, so the order goes intravenously
    r.spasm.level = 0.9;
    expect(c.sideArmAspirates()).toBe(false);
    expect(c.vasodilator("verapamil", 2.5, "ia").route).toBe("iv");
    r.spasm.level = 0.75;
    expect(c.sideArmAspirates()).toBe(true);
    const before = r.level;
    const v = c.vasodilator("gtn", 200, "ia");
    expect(v.ok).toBe(true);
    expect(v.route).toBe("ia");
    expect(c.measure("warmth").ok).toBe(true);
    expect(c.measure("ia-lidocaine").ok).toBe(false);
    expect(c.lidocaineRefused).toBe(1);
    run(s, 240);
    expect(r.level).toBeLessThan(before - 0.2);
    expect(r.level).toBeLessThan(MP_RADIAL_LIVE.significantAt);
    // released: a gentle withdrawal no longer drags
    move(s, -10, 4);
    expect(c.avulsion).toBeNull();
    expect(c.drag()).toBe("none");
  });
});

describe("after an arrest, on a vasopressor (diag-ohca-vasopressor-radial)", () => {
  it("the noradrenaline infusion runs from the start, the case raises post-arrest and vasopressor, and spasm is more likely than without the pressor", () => {
    const s = open("diag-ohca-vasopressor-radial");
    expect(s.engine.vasopressorRunning()).toBe(true);
    run(s, 1);
    const ctx = s.tipContext();
    expect(ctx.events).toEqual(expect.arrayContaining(["post-arrest", "vasopressor"]));
    const r = s.engine.radial!;
    const on = r.probability({ anxiety: 0.3, vasopressor: true });
    const off = r.probability({ anxiety: 0.3, vasopressor: false });
    expect(on).toBeGreaterThan(off);
  });

  it("the plan's tip claim, checked: in setup the arrest-and-vasopressor radial spasm tip needs the 'hypotension' event, which this case does not raise", () => {
    const s = open("diag-ohca-vasopressor-radial");
    run(s, 1);
    const ctx = s.tipContext();
    expect(ctx.phase).toBe("setup");
    const tip = TIP_BY_ID["access-arrest-radial-spasm"];
    expect(tip.alsoIn?.some((a) => a.lab === "diagnostic" && (a.phase ?? []).includes("setup"))).toBe(true);
    expect(tip.when.event).toEqual(["hypotension"]);
    // recorded for the retarget request (add 'vasopressor' and 'post-arrest' to the tip's events): today it does not show
    expect(ctx.events).not.toContain("hypotension");
    expect(ids(s)).not.toContain("access-arrest-radial-spasm");
  });
});

describe("the held catheter-tip spasm model is this pack's only", () => {
  it("a diagnostic case outside the pack keeps the engine's legacy tip spasm (no model)", () => {
    const other = DIAG_SCENARIOS.find((x) => !isSpasmPackScenario(x.id) && labScenarioById(x.id))!;
    expect(other).toBeDefined();
    const s = open(other.id);
    expect(s.engine.tipSpasmModel()).toBeNull();
    for (const sc of spasmScenarios) expect(isSpasmPackScenario(sc.id), sc.id).toBe(true);
  });
});

describe("the femoral case has no radial artery", () => {
  it("diag-ostial-lesion-or-spasm (femoral) gets the tip model but no radial host", () => {
    const s = open("diag-ostial-lesion-or-spasm");
    expect(s.engine.tipSpasmModel()).not.toBeNull();
    expect(s.engine.radial).toBeNull();
    expect(control(s).available).toBe(false);
  });
});

// --- reachability and practice links -------------------------------------------------------

const RAISE_MODULES = import.meta.glob<LabRaises | readonly LabRaises[] | undefined>(
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
  return !!r && any(phases, r.phases) && any(when.event, r.events) && (when.requires ?? []).every((e) => r.events.has(e)) && any(when.procedure, r.procedures) && any(when.route, r.routes) && any(when.technique, r.techniques) && any(when.imaging, r.imaging);
}
const satisfiable = (tip: LabTip, raised: Partial<Record<string, Raised>>) =>
  satisfiableIn(tip.when, tip.when.phase, raised[tip.lab]) || (tip.alsoIn ?? []).some((a) => satisfiableIn(tip.when, a.phase, raised[a.lab]));
function declared(): LabRaises[] {
  const out: LabRaises[] = [{ lab: "diagnostic", phases: ["finish"], events: [...FINISH_EVENTS] }];
  for (const exp of Object.values(RAISE_MODULES)) if (exp) out.push(...(Array.isArray(exp) ? exp : [exp as LabRaises]));
  return out.filter((r) => r !== SPASM_RAISES);
}
function stillWaiting(raised: Partial<Record<string, Raised>>): string[] {
  const listed = new Set<string>([...WAITING_TIPS.filter((w) => w.lab === "diagnostic").flatMap((w) => w.tips), ...DEFERRED_RETARGETS.map((d) => d.tipId)]);
  return LAB_TIPS.filter((t) => t.lab === "diagnostic" && listed.has(t.id) && !satisfiable(t, raised)).map((t) => t.id);
}

describe("reachability", () => {
  it("every waiting.ts entry naming diag-spasm-states is satisfiable with the spasm module's raises, so the diagnostic waiting count falls by at least their number", () => {
    const entries = WAITING_TIPS.filter((w) => w.raisedBy === "diag-spasm-states").flatMap((w) => w.tips);
    expect(entries).toEqual(expect.arrayContaining(["diag-ostial-spasm-withdraw-nitrate", "diag-radial-spasm-release", "diag-acq-spasm-repeat-view"]));
    const withSpasm = merge([...declared(), SPASM_RAISES]);
    for (const id of entries) expect(satisfiable(TIP_BY_ID[id], withSpasm), id).toBe(true);
    const before = stillWaiting(merge(declared()));
    const after = stillWaiting(withSpasm);
    expect(before.length - after.length).toBeGreaterThanOrEqual(entries.filter((id) => before.includes(id)).length);
    for (const id of entries) expect(after).not.toContain(id);
    // the two catheter-tip spasm tips are satisfiable from the registered scenario scripts already; the
    // radial one waits for the module's registration (src/ui/sim/modules/)
    expect(before).not.toContain("diag-ostial-spasm-withdraw-nitrate");
    expect(before).not.toContain("diag-acq-spasm-repeat-view");
  });

  it("practiceIndex lists diag-catheter-tip-spasm-rca, diag-focal-rca-spasm and diag-focal-rca-fixed under pm-interpreting-spasm, pm-acquiring-test-nitrate and pm-acquiring-anatomy (from spasm.launch.ts)", () => {
    const under = (lesson: string) => practiceForLesson(lesson).filter((e) => e.sim === "cathlab");
    const lessons = ["pm-interpreting-spasm", "pm-acquiring-test-nitrate", "pm-acquiring-anatomy"];
    const listed = new Set(lessons.flatMap((l) => under(l).map((e) => e.scenario)));
    for (const id of ["diag-catheter-tip-spasm-rca", "diag-focal-rca-spasm", "diag-focal-rca-fixed"]) expect(listed.has(id), id).toBe(true);
    for (const l of lessons) expect(under(l).map((e) => e.scenario), l).toContain("diag-catheter-tip-spasm-rca");
    // every scenario of the pack under each of its lessons, from this pack's launch file
    for (const sc of spasmLaunch.scenarios ?? []) for (const l of sc.lessonIds) {
      const e = practiceForLesson(l).find((x) => x.scenario === sc.id);
      expect(e, `${sc.id} under ${l}`).toBeDefined();
      expect(e!.source).toMatch(/spasm\.launch\.ts$/);
    }
    // the pack, its launch file and the registry agree; the focal spasm case is lesions.ts's held scenario
    expect(spasmScenarios.map((x) => x.id)).toEqual((spasmLaunch.scenarios ?? []).map((x) => x.id));
    for (const sc of spasmScenarios) expect(diagScenarioById(sc.id)).toBe(sc);
    expect(DIAG_SCENARIOS.filter((x) => x.id === "diag-focal-rca-spasm").length).toBe(1);
  });
});

// --- the rod mechanics' radial lumen ---------------------------------------------------------

describe("the radial lumen in spasm (lumen.ts)", () => {
  const c = scenarioCase("diag-radial-spasm-entrapment", DEFAULT_SCENARIO_SEED, labScenarioById)!;
  const model = buildAnatomy(c);
  const hit = (): LumenHit => ({ slack: 0, nx: 0, ny: 0, nz: 0, region: 0, lumen: 0, s: 0, floor: false });
  /** A point on the radial artery's centre line and a catheter-sized radius there. */
  function radialPoint(L: LumenSet) {
    const t = L.access;
    let i = 0;
    while (i < t.n && t.region[i] !== Region.Radial) i++;
    const k = Math.min(t.n - 1, i + 5);
    return { x: t.pts[3 * k], y: t.pts[3 * k + 1], z: t.pts[3 * k + 2], R: t.rad[k] };
  }

  it("narrows the radial artery (never below the device), grips a catheter but not a fine wire, and changes nothing at level 0", () => {
    const L = new LumenSet({ route: "radial-right", model });
    const p = radialPoint(L);
    const flags = { crossedValve: false };
    const h0 = hit();
    L.query(p.x, p.y, p.z, 1.0, flags, null, 0, h0);
    expect(h0.region).toBe(Region.Radial);
    L.setRadialSpasm(0, 1);
    const hz = hit();
    L.query(p.x, p.y, p.z, 1.0, flags, null, 0, hz);
    expect(hz.slack).toBeCloseTo(h0.slack, 9);
    L.setRadialSpasm(0.8, radialLumenScale(0.8));
    const h1 = hit();
    L.query(p.x, p.y, p.z, 1.0, flags, null, 0, h1);
    expect(h1.slack).toBeLessThan(h0.slack);
    expect(h1.slack).toBeGreaterThanOrEqual(RADIAL_SPASM_LUMEN.clearanceMm - 1e-6 - (p.R - (h0.slack + 1.0)));
    expect(h1.region).toBe(Region.RadialSpasm);
    // the grip has one source (the shared model's, at the hub): the solver's wall friction stays the relaxed artery's
    expect(regionFrictionScale(Region.RadialSpasm)).toBe(regionFrictionScale(Region.Radial));
    // a 0.014 in wire meets the narrowed lumen but not the grip
    const hw = hit();
    L.query(p.x, p.y, p.z, 0.18, flags, null, 0, hw);
    expect(hw.region).toBe(Region.Radial);
  });

  it("travels with the coronary motion to the solver's copy and with its snapshot", () => {
    const L = new LumenSet({ route: "radial-right", model });
    L.moveCoronaries([spasmControlInput(0.7, radialLumenScale(0.7))]);
    expect(L.radialSpasm.level).toBeCloseTo(0.7, 9);
    const st = L.coronaryState();
    expect(st.some((x) => x.vessel === SPASM_CONTROL)).toBe(true);
    const M = new LumenSet({ route: "radial-right", model });
    M.restoreCoronaryState(st);
    expect(M.radialSpasm).toEqual(L.radialSpasm);
    M.moveCoronaries([spasmControlInput(0, 1)]);
    expect(M.radialSpasm).toEqual({ level: 0, lumenScale: 1 });
  });
});

describe("the rod mechanics feel the grip (DiagnosticPhysics.setRadialSpasm)", () => {
  it("the hub reaction carries the grip over the catheter length in the radial artery, and nothing without spasm", () => {
    const PHYS: SessionPhysicsOptions = { force: true, useWorker: false, config: {}, autoFallback: false };
    const s = open("diag-radial-spasm-entrapment", false, PHYS);
    const p = s.physics!;
    expect(p).not.toBeNull();
    for (let i = 0; i < 30; i++) s.step(1 / 30);
    expect(p.radialContactMm()).toBeGreaterThan(50);
    const r0 = p.reaction();
    expect(r0).not.toBeNull();
    expect(p.radialGrip().axialN).toBe(0);
    p.setRadialSpasm(0.8, { catheterOdMm: 2.0, radialDiamMm: 1.9 });
    expect(p.devices.lumenSet().radialSpasm.level).toBeCloseTo(0.8, 9);
    const grip = p.radialGrip();
    expect(grip.axialN).toBeGreaterThan(1);
    const r1 = p.reaction()!;
    expect(r1.axial - r0!.axial).toBeCloseTo(grip.axialN, 6);
    p.setRadialSpasm(0);
    expect(p.radialGrip().axialN).toBe(0);
  }, 60_000);

  it("a withdrawal at tone 0.8 meets the shared model's grip once under the rod mechanics: the module's hub force has no solver term, and the solver's wall friction is the relaxed artery's", () => {
    const PHYS: SessionPhysicsOptions = { force: true, useWorker: false, config: {}, autoFallback: false };
    const s = open("diag-radial-spasm-entrapment", true, PHYS);
    const p = s.physics!;
    for (let i = 0; i < 30; i++) s.step(1 / 30);
    const r = s.engine.radial!;
    const c = control(s);
    const geom = { catheterOdMm: MP_SPASM_MODULE.catheterOdMm, radialDiamMm: r.setup.radialDiamMm };
    let checked = 0;
    for (let i = 0; i < 40; i++) {
      r.spasm.level = 0.8;
      p.command({ kind: "push", device: "catheter", mm: -1 });
      s.step(0.1);
      if (c.hubAxialN > 0) {
        // exactly the shared model's force at the rod mechanics' contact length and the hand speed read
        expect(c.contactMm).toBeCloseTo(p.radialContactMm(), 6);
        expect(c.hubAxialN).toBeCloseTo(hubAxialForceN({ level: r.level, contactMm: c.contactMm, lubricated: r.lubrication(), ...geom }, c.hubSpeedMmS), 3);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
    expect(c.avulsion).toBeNull();
    // the simple catheter model works the force out from the same function, over MP_SPASM_MODULE.contactMm
    expect(regionFrictionScale(Region.RadialSpasm)).toBe(1);
  }, 90_000);
});
