// The hyperaemia presets' tips (physiology-hyperaemia-and-adenosine): the RCA dose tip by vessel, the
// cough-and-wait tip once adenosine has slowed the heart, VF and AF from the engine's adenosine hazard
// model reaching the context, the waiting.ts entries naming this package, and the practice index
// listing every scenario of hyperaemia.launch.ts under its lessons once the presets are listed
// (pwSession.HYPERAEMIA_PRESETS_LISTED: held back until the lab's rig runs the engine adapter).
//
// The lab is driven as its rig drives it, with the session's engine adapter (setUpPwEngine,
// applyPwActionToEngine, pwPatientInput): a PatientEngine fitted to the preset, the guide as its tip
// input, the patient events of patientEvents.ts.
//   npx vitest run src/ui/lab/physiologyTips.hyperaemia.test.ts
import { describe, expect, it } from "vitest";
import { LAB_EVENTS, TIP_BY_ID, tipsFor, type LabContext, type LabEvent, type LabTip, type TipTrigger } from "../../content/lab/tips";
import { WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import { HYPERAEMIA_SCENARIOS, launch as hyperaemiaLaunch } from "../../content/lab/presets/physiology/hyperaemia.launch";
import { PatientEngine } from "../../simulation/patient/engine";
import {
  HYPERAEMIA_PRESETS_LISTED,
  PHYSIOLOGY_PRESETS,
  applyPwActionToEngine,
  physiologyPreset,
  initialPwSession,
  processItems,
  pwPatientInput,
  pwSessionReducer,
  sessionPreset,
  setUpPwEngine,
  type PwAction,
  type PwSessionState,
} from "../../simulation/pci/pwSession";
import { PRACTICE_INDEX, practiceForLesson } from "../content/practiceIndex";
import { guideTip, physiologyProfile } from "../sections/PhysiologyLab";
import { PATIENT_EVENTS, PatientEventAdapter } from "./patientEvents";
import { PHYSIOLOGY_ADENOSINE_EVENTS, physiologyTipContext, raises } from "./physiologyTips";

const PKG = "physiology-hyperaemia-and-adenosine";
const LESSONS = ["pm-physiology-indices", "pm-lab-drugs-microvascular"];
const ids = (ctx: LabContext, n = 20) => tipsFor(ctx, n).map((t) => t.id);

/** The physiology lab as its rig runs it, with the session's engine adapter. */
class Lab {
  readonly engine: PatientEngine;
  session: PwSessionState;
  private readonly adapter = new PatientEventAdapter();
  private ev: LabEvent[] = [];
  readonly seen = new Set<LabEvent>();

  constructor(presetId: string, seed = "1") {
    this.session = initialPwSession(presetId, seed);
    this.engine = new PatientEngine({ profile: physiologyProfile(sessionPreset(this.session), seed), lesions: [] });
    this.engine.transducer.zero();
    this.engine.setTip(guideTip(this.session));
    this.session = setUpPwEngine(this.engine, this.session);
  }

  dispatch(...as: PwAction[]): void {
    for (const a of as) {
      const before = this.session;
      this.session = pwSessionReducer(before, a);
      this.engine.setTip(guideTip(this.session));
      applyPwActionToEngine(this.engine, before, this.session, a);
    }
  }

  step(seconds: number, until?: (l: Lab) => boolean): boolean {
    for (let i = 0; i < Math.round(seconds / 0.1); i++) {
      this.engine.advance(0.1);
      const v = this.engine.vitals();
      this.ev = this.adapter.update(v);
      for (const e of this.ev) this.seen.add(e);
      this.session = pwSessionReducer(this.session, { type: "tick", dt: 0.1, patient: pwPatientInput(v) });
      if (until?.(this)) return true;
    }
    return false;
  }

  context(): LabContext {
    return physiologyTipContext(this.session, this.engine.vitals(), { patientEvents: this.ev });
  }
}

describe("named presets show their tips at the moment they apply (acceptance)", () => {
  it("in 'ic-rca-dose' (hyperaemia.launch.ts), after the RCA bolus that raises 'bradycardia', tipsFor(ctx, 20) includes pci-adenosine-block-cough-wait; at phase 'physiology' it includes pci-adenosine-rca-dose", () => {
    expect(HYPERAEMIA_SCENARIOS.map((s) => s.id)).toContain("ic-rca-dose");
    const lab = new Lab("ic-rca-dose", "tips");
    lab.step(2);
    const start = lab.context();
    expect(start).toMatchObject({ lab: "pci", phase: "physiology", vessel: "RCA" });
    expect(ids(start)).toContain("pci-adenosine-rca-dose");
    expect(start.events).not.toContain("bradycardia");
    expect(ids(start)).not.toContain("pci-adenosine-block-cough-wait");
    // 150 µg into the RCA, slowly: above the module's limit (the whole bolus is judged, not its two parts);
    // this run's hazard is block without an escape rhythm: no ventricular beats, so the monitor's rate falls
    // far below any escape rhythm (ventricular standstill; the monitor still shows the atrial rhythm with AV 3)
    lab.engine.setAdenosineHazards({ force: "no-escape" });
    lab.dispatch({ type: "hyperaemia", mode: "ic", doseUg: 150, fast: false }, { type: "flush-guide" });
    expect(lab.engine.adenosineHazards()?.force).toBeNull();
    expect(lab.step(30, (l) => (l.context().events ?? []).includes("bradycardia"))).toBe(true);
    expect(lab.step(15, (l) => l.engine.vitals().av === 3 && (l.engine.vitals().hr ?? 0) < 20)).toBe(true);
    const ctx = lab.context();
    expect(ctx.events).toEqual(expect.arrayContaining(["bradycardia", "av-block"]));
    expect(ids(ctx, 20)).toContain("pci-adenosine-block-cough-wait");
    expect(ids(ctx, 20)).toContain("pci-adenosine-rca-dose");
    // the orders: cough, wait; temporary pacing captures if it persists; the block passes after the drug
    lab.dispatch({ type: "order", order: "cough" }, { type: "order", order: "wait" }, { type: "order", order: "pace-on" });
    lab.step(8);
    expect(lab.engine.vitals().hr).toBeGreaterThan(60);
    lab.dispatch({ type: "order", order: "pace-off" });
    expect(lab.step(120, (l) => l.engine.vitals().av === 0)).toBe(true);
    lab.step(2);
    expect(lab.session.arrhythmias.map((a) => a.kind)).toContain("av-block");
    const block = lab.session.arrhythmias.find((a) => a.kind === "av-block")!;
    expect(block.end).not.toBeNull();
  });

  it("without a forced hazard, the engine's own dose-scaled AV block brings the same tip on some seeds after 200 µg into the RCA", () => {
    let found = "";
    for (let k = 0; k < 40 && !found; k++) {
      const lab = new Lab("ic-rca-dose", `natural-${k}`);
      lab.engine.setAdenosineHazards(null);
      lab.dispatch({ type: "hyperaemia", mode: "ic", doseUg: 200, fast: false }, { type: "flush-guide" });
      if (lab.step(20, (l) => (l.context().events ?? []).includes("bradycardia"))) {
        expect(ids(lab.context(), 20)).toContain("pci-adenosine-block-cough-wait");
        found = `natural-${k}`;
      }
    }
    expect(found, "no seed of 40 drew the block").not.toBe("");
  });

  it("'adenosine-vf': VF from the colleague's fast push reaches the context with its tip; the shock restores an organised rhythm and the debrief scores it", () => {
    const lab = new Lab("adenosine-vf", "vf");
    expect(lab.step(30, (l) => (l.context().events ?? []).includes("vf"))).toBe(true);
    const ctx = lab.context();
    expect(ctx.events).toContain("vf");
    expect(ids(ctx, 20)).toContain("pci-arrest-adenosine-cough");
    let converted = false;
    for (let k = 0; k < 3 && !converted; k++) {
      lab.dispatch({ type: "order", order: "charge" });
      lab.step(5.5);
      lab.dispatch({ type: "order", order: "clear" }, { type: "order", order: "shock" });
      lab.step(2);
      converted = lab.engine.vitals().rhythmKind !== "vf";
    }
    expect(converted).toBe(true);
    const vf = lab.session.arrhythmias.find((a) => a.kind === "vf");
    expect(vf?.end).not.toBeNull();
    lab.dispatch({ type: "decide", id: "defer" });
    const items = processItems(lab.session);
    expect(items.find((i) => i.id.startsWith("vf-"))?.ok).toBe(true);
  });

  it("adenosine AF reaches the context as atrial-fibrillation; synchronised cardioversion ends it", () => {
    const lab = new Lab("ic-rca-dose", "af");
    lab.engine.setAdenosineHazards({ force: "af" });
    lab.dispatch({ type: "hyperaemia", mode: "ic", doseUg: 150, fast: true }, { type: "flush-guide" });
    expect(lab.step(30, (l) => (l.context().events ?? []).includes("atrial-fibrillation"))).toBe(true);
    let ok = false;
    for (let k = 0; k < 3 && !ok; k++) {
      lab.dispatch({ type: "order", order: "charge" });
      lab.step(5.5);
      lab.dispatch({ type: "order", order: "clear" }, { type: "order", order: "cardiovert" });
      lab.step(1);
      ok = lab.engine.vitals().rhythmKind === "sinus";
    }
    expect(ok).toBe(true);
    expect(lab.seen.has("atrial-fibrillation")).toBe(true);
  });
});

// --- reachability from the lab's raises (the rule of src/content/lab/reachability.test.ts) ---

function satisfiableIn(when: TipTrigger, phases: readonly string[] | undefined, rs: readonly LabRaises[]): boolean {
  const has = (key: "phases" | "events" | "routes" | "procedures" | "techniques" | "imaging", x: string) => rs.some((r) => ((r[key] ?? []) as readonly string[]).includes(x));
  const any = (want: readonly string[] | undefined, key: Parameters<typeof has>[0]) => !want?.length || want.some((x) => has(key, x));
  return any(phases, "phases") && any(when.event, "events") && (when.requires ?? []).every((e) => has("events", e)) && any(when.procedure, "procedures") && any(when.route, "routes") && any(when.technique, "techniques") && any(when.imaging, "imaging");
}
const satisfiableInPci = (tip: LabTip, rs: readonly LabRaises[]) =>
  tip.lab === "pci" ? satisfiableIn(tip.when, tip.when.phase, rs) : !!tip.alsoIn?.some((a) => a.lab === "pci" && satisfiableIn(tip.when, a.phase, rs));

describe("reachability (acceptance)", () => {
  it("raises declares AF and VF from the adenosine hazard model, in the shared vocabulary, once the hyperaemia presets are listed", () => {
    for (const e of PHYSIOLOGY_ADENOSINE_EVENTS) {
      expect(raises.events.includes(e), e).toBe(HYPERAEMIA_PRESETS_LISTED);
      expect((PATIENT_EVENTS as readonly string[]).includes(e), e).toBe(true);
      expect((LAB_EVENTS as readonly string[]).includes(e), e).toBe(true);
    }
  });

  it("every waiting.ts entry naming physiology-hyperaemia-and-adenosine becomes satisfiable, so the pci waiting count falls by at least their number; the request tips are satisfiable", () => {
    const mine = WAITING_TIPS.filter((w) => w.raisedBy === PKG).flatMap((w) => w.tips);
    expect(mine.filter((id) => TIP_BY_ID[id] && !satisfiableInPci(TIP_BY_ID[id], [raises]))).toEqual([]);
    const pciWaiting = WAITING_TIPS.filter((w) => w.lab === "pci").flatMap((w) => w.tips);
    const stillWaiting = (rs: readonly LabRaises[]) => pciWaiting.filter((id) => TIP_BY_ID[id] && !satisfiableInPci(TIP_BY_ID[id], rs)).length;
    // the lab's raises as they will be with the hyperaemia presets listed (as they are once HYPERAEMIA_PRESETS_LISTED)
    const listed: LabRaises = { ...raises, events: [...new Set([...raises.events, ...PHYSIOLOGY_ADENOSINE_EVENTS])] };
    const before = stillWaiting([]);
    const after = stillWaiting([listed]);
    console.info(`${PKG}: ${mine.length} waiting.ts tips name this package; pci tips still waiting ${before} -> ${after} with the physiology lab's raises`);
    expect(before - after).toBeGreaterThanOrEqual(mine.filter((id) => TIP_BY_ID[id]).length);
    // the tips the lab requests ask for (pm-physiology#2, #3, pm-lab-drugs#4), and the adenosine VF tip this package makes reachable
    const request = ["pci-phys-ic-adenosine-flush", "pci-phys-iv-hyperaemia-signs", "pci-phys-no-hyperaemia", "pci-adenosine-rca-dose", "pci-adenosine-block-cough-wait", "pci-arrest-adenosine-cough"];
    for (const id of request) expect(TIP_BY_ID[id], id).toBeDefined();
    expect(request.filter((id) => !satisfiableInPci(TIP_BY_ID[id], [listed]))).toEqual([]);
    // the VF tip needs the hazard model's event: without it the tip is not reachable from this lab, so it is reachable now only if the presets are listed
    const withoutAdenosine: LabRaises = { ...raises, events: raises.events.filter((e) => !PHYSIOLOGY_ADENOSINE_EVENTS.includes(e)) };
    expect(satisfiableInPci(TIP_BY_ID["pci-arrest-adenosine-cough"], [withoutAdenosine])).toBe(false);
    expect(satisfiableInPci(TIP_BY_ID["pci-arrest-adenosine-cough"], [raises])).toBe(HYPERAEMIA_PRESETS_LISTED);
  });
});

describe("launch metadata and the practice index (acceptance)", () => {
  const presets = HYPERAEMIA_SCENARIOS;

  it("hyperaemia.launch.ts declares the hyperaemia presets of pwSession with their own titles, which do not name the failure; it lists them exactly when pwSession does", () => {
    expect(hyperaemiaLaunch.sim).toBe("physiology");
    expect(presets.map((s) => s.id).sort()).toEqual(["adenosine-vf", "contrast-ffr", "ic-rca-dose", "iv-caffeine", "iv-tissued-line", "saline-swap"]);
    expect(hyperaemiaLaunch.scenarios ?? []).toEqual(HYPERAEMIA_PRESETS_LISTED ? HYPERAEMIA_SCENARIOS : []);
    for (const s of presets) expect(PHYSIOLOGY_PRESETS.some((p) => p.id === s.id), s.id).toBe(HYPERAEMIA_PRESETS_LISTED);
    for (const s of presets) {
      const p = physiologyPreset(s.id)!;
      expect(p, s.id).toBeDefined();
      expect(s.title).toBe(p.title);
      expect(p.title, s.id).not.toMatch(/tissued|infiltrat|saline|caffeine|coffee|contrast|fibrillation|\bvf\b|block|flush|dose/i);
    }
    // every hyperaemia preset starts with the wire at the guide tip
    for (const s of presets) expect(physiologyPreset(s.id)!.start).toBe("at-tip");
  });

  it("practiceIndex lists every scenario in hyperaemia.launch.ts under lessons pm-physiology-indices and pm-lab-drugs-microvascular (none while they are held back)", () => {
    const known = PRACTICE_INDEX.known.scenarios.get("physiology");
    for (const s of presets) expect(known?.has(s.id), s.id).toBe(HYPERAEMIA_PRESETS_LISTED);
    for (const s of hyperaemiaLaunch.scenarios ?? []) {
      expect(known?.has(s.id), s.id).toBe(true);
      for (const l of LESSONS) {
        const entry = practiceForLesson(l).find((e) => e.sim === "physiology" && e.scenario === s.id);
        expect(entry, `${s.id} under ${l}`).toBeDefined();
        expect(entry!.params).toEqual({ scenario: s.id, mode: "guided" });
      }
    }
  });
});
