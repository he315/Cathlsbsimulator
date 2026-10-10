import { describe, expect, it } from "vitest";
import {
  applyBailout,
  assessmentText,
  CUES,
  cueFor,
  cueHeld,
  cxDebrief,
  gateNotes,
  initialCx,
  isImageCue,
  releaseHeldCues,
  namesComplication,
  recogniseCx,
  unrecognised,
  scoreRecognition,
  timiOf,
  onAspirate,
  onDeviceIntroduced,
  onInflation,
  onInjection,
  onStent,
  onValveOpened,
  onWirePush,
  patientEffects,
  stepCx,
  type Complication,
  type CxContext,
  type CxNote,
  type CxState,
  type InflationEvent,
} from "./engine";
import { dissectionRisk, maybeGuideDissection } from "./dissection";
import { sideBranchRisk } from "./sideBranch";
import { noReflowRisk } from "./noReflow";
import { seedNoReflow, icDrugOnNoReflow, timiFor, REFRACTORY_DISTAL_DOSES } from "./noReflow";
import { seedThrombosis } from "./thrombus";
import { seedAortocoronaryDissection, OSTIAL_PROTRUSION_MM } from "./dissection";
import { setup as pciSetup } from "../pci/testSetup";
import { startPci } from "../pci/actions/scenario";
import { guideDamps } from "../pci/guide";
import { pciScenarioDef } from "../pci/scenarios/registry";
import { applyFlowStart, activeSpasms, checkManifold, flowDebrief, flowPatientRecovery, flowStartPatient, flowStartRecord, recrossDissection, spasmsOf, wireThroughBubbles } from "../pci/actions/bailouts";
import { bailout, giveDrug, giveIcDrug } from "../pci/actions/drugs";
import { loadMicrocatheter, moveMicrocatheter, setWireKind } from "../pci/actions/wire";
import { flowDrawKey, lumenFor, pciPatientEffects } from "../pci/actions/patient";
import { stepPci, recognisePci } from "../pci/actions/step";
import { injectPci } from "../pci/actions/imaging";
import { initialPci, wiringOf, type PciState } from "../pci/state";
import { PatientEngine } from "../patient/engine";
import { generatePatient } from "../patient/patient";
import { applyEffects, newBridge, tipFromGuide } from "../pci/patientBridge";
import { PCI_EVENT_SOURCES as FLOW_SOURCES } from "../../ui/lab/pciEvents/flow";

const route = ["LM", "LAD"];
function ctx(over: Partial<CxContext> = {}): CxContext {
  return {
    t: 0,
    act: 300,
    protamine: false,
    balloon: null,
    stents: [],
    devicesIn: true,
    oxygen: false,
    refDiameterAt: () => 3,
    paramAt: (_r, mm) => ({ vessel: "LAD", param: Math.min(1, mm / 120) }),
    ...over,
  };
}
const site = { route, vessel: "LAD", atMm: 60 };
function inflation(over: Partial<InflationEvent> = {}): InflationEvent {
  return {
    route,
    vessel: "LAD",
    fromMm: 54,
    toMm: 66,
    device: "balloon",
    ratio: 1.0,
    ratioToEem: 0.8,
    atm: 10,
    waist: false,
    calcium: 0,
    inLesion: true,
    edgeInPlaque: false,
    subintimalWire: false,
    rupture: false,
    prepared: true,
    beyondLimit: false,
    thrombus: false,
    lipid: false,
    lesionLengthMm: 12,
    aspirated: false,
    side: "left",
    vesselD: 3,
    ...over,
  };
}
/** Run seeds until the event produces a complication of `kind`; returns the state and seed. */
function firstWith(kind: string, f: (cx: CxState) => CxState, seeds = 200): { cx: CxState; seed: number } {
  for (let seed = 1; seed <= seeds; seed++) {
    const cx = f(initialCx(seed));
    if (cx.list.some((c) => c.kind === kind)) return { cx, seed };
  }
  throw new Error(`no ${kind} in ${seeds} seeds`);
}
function run(cx0: CxState, seconds: number, c: Partial<CxContext> = {}, dt = 1): CxState {
  let cx = cx0;
  for (let t = 0; t < seconds; t += dt) cx = stepCx(cx, dt, ctx({ t, ...c }), site).cx;
  return cx;
}

describe("complication engine", () => {
  it("draws are reproducible: the same seed and actions give the same complications", () => {
    const script = (seed: number) => {
      let cx = initialCx(seed);
      cx = onInflation(cx, 1, inflation({ ratio: 1.3, calcium: 2, atm: 18, waist: true })).cx;
      cx = onInjection(cx, 5, { route, vessel: "LAD", side: "left", psi: 300, forceful: true, guideDepthMm: 4, guideCoaxial: 0.5 }).cx;
      return run(cx, 120);
    };
    expect(JSON.stringify(script(42))).toBe(JSON.stringify(script(42)));
    const outcomes = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => JSON.stringify(script(s).list.map((c) => [c.kind, c.grade]))));
    expect(outcomes.size).toBeGreaterThan(1);
  });

  it("dissection risk rises with oversizing, calcium at high pressure, plaque at a stent edge and a subintimal wire", () => {
    const base = { ratio: 1.0, calcium: 0 as const, atm: 10, waist: false, edgeInPlaque: false, subintimalWire: false, inLesion: true };
    expect(dissectionRisk({ ...base, ratio: 1.3 })).toBeGreaterThan(dissectionRisk(base) + 0.3);
    expect(dissectionRisk({ ...base, calcium: 2, waist: true, atm: 18 })).toBeGreaterThan(dissectionRisk(base) + 0.3);
    expect(dissectionRisk({ ...base, edgeInPlaque: true })).toBeGreaterThan(dissectionRisk(base));
    expect(dissectionRisk({ ...base, subintimalWire: true })).toBe(1);
  });

  it("dissection: a prodrome, extension by forceful injection, flow limitation if left, sealed by a stent across it", () => {
    const { cx } = firstWith("dissection", (cx) => onInflation(cx, 0, inflation({ ratio: 1.22 })).cx);
    const d0 = cx.list.find((c) => c.kind === "dissection")!;
    // forceful injections extend it
    let x = cx;
    for (let i = 0; i < 6; i++) x = onInjection(x, i, { route, vessel: "LAD", side: "left", psi: 320, forceful: true, guideDepthMm: 0, guideCoaxial: 0.9 }).cx;
    const d1 = x.list.find((c) => c.id === d0.id)!;
    expect(d1.lengthMm).toBeGreaterThan(d0.lengthMm);
    expect(["C", "D", "E", "F"]).toContain(d1.grade);
    // left alone, a staining dissection becomes flow-limiting
    const left = run(x, 1200);
    const d2 = left.list.find((c) => c.id === d0.id)!;
    expect(["E", "F"]).toContain(d2.grade);
    expect(patientEffects(left, ctx()).occlusions.some((o) => o.id === d0.id && o.fraction >= 0.7)).toBe(true);
    // a stent across the whole dissection seals it
    const sealed = onStent(x, 300, { route, fromMm: d1.atMm - d1.lengthMm / 2 - 3, toMm: d1.atMm + d1.lengthMm / 2 + 3, covered: false, sideBranches: [] });
    expect(sealed.cx.list.find((c) => c.id === d0.id)!.stage).toBe("resolved");
    expect(patientEffects(sealed.cx, ctx()).occlusions.length).toBe(0);
  });

  it("perforation (Ellis III): a leak into the pericardium; balloon tamponade stops it and seals it in minutes; a covered stent seals it", () => {
    const { cx } = firstWith("perforation", (c) => onInflation(c, 0, inflation({ ratioToEem: 1.4, ratio: 1.6, calcium: 2, rupture: true })).cx);
    const p = cx.list.find((c) => c.kind === "perforation")!;
    expect(p.grade.startsWith("III")).toBe(true);
    const leaking = run(cx, 10);
    expect(patientEffects(leaking, ctx()).pericardialMlS).toBeGreaterThan(0.2);
    // untreated it keeps leaking
    expect(patientEffects(run(cx, 300), ctx()).pericardialMlS).toBeGreaterThan(0.2);
    // balloon at the site
    const balloon = { route, fromMm: p.atMm - 6, toMm: p.atMm + 6, ratio: 1 };
    let tamp = cx;
    let sealedAt = -1;
    for (let t = 0; t < 1800; t += 1) {
      tamp = stepCx(tamp, 1, ctx({ t, balloon, protamine: t > 60 }), site).cx;
      if (t === 5) expect(patientEffects(tamp, ctx({ balloon })).pericardialMlS).toBe(0);
      if (tamp.list.find((c) => c.id === p.id)!.stage === "resolved") {
        sealedAt = t;
        break;
      }
    }
    expect(sealedAt).toBeGreaterThan(0);
    // a covered stent over the hole seals it at once
    const cov = onStent(cx, 20, { route, fromMm: p.atMm - 8, toMm: p.atMm + 8, covered: true, sideBranches: [] });
    expect(cov.cx.list.find((c) => c.id === p.id)!.stage).toBe("resolved");
  });

  it("distal wire perforation: exposure from tip load in small vessels; coiling seals a distal hole", () => {
    const soft = firstWith("perforation", (c) => onWirePush(c, 0, { route, vessel: "LAD", atMm: 120, gfMm: 2, vesselD: 1.2, hydrophilic: false }).cx, 400);
    const stiff = firstWith("perforation", (c) => onWirePush(c, 0, { route, vessel: "LAD", atMm: 120, gfMm: 250, vesselD: 1.2, hydrophilic: true }).cx, 5);
    expect(stiff.seed).toBeLessThan(soft.seed);
    const p = stiff.cx.list[0];
    expect(["I", "II"]).toContain(p.grade);
    const coiled = applyBailout(stiff.cx, "coil", 10);
    expect(coiled.cx.list[0].stage).toBe("resolved");
  });

  it("side-branch compromise is more likely at a true bifurcation; rewiring and a kissing inflation restore the branch", () => {
    const e = { branch: "D1", parentRoute: route, atMm: 45, sbD: 2.0, mvD: 3.0, angle: 0.9, trueBifurcation: false, stentRatio: 1.0, thrombus: false };
    expect(sideBranchRisk({ ...e, trueBifurcation: true })).toBeGreaterThan(3 * sideBranchRisk(e));
    expect(sideBranchRisk(e)).toBeLessThan(0.1);
    expect(sideBranchRisk({ ...e, trueBifurcation: true })).toBeGreaterThan(0.12);
    const { cx } = firstWith("side-branch", (c) => onStent(c, 0, { route, fromMm: 38, toMm: 56, covered: false, sideBranches: [{ ...e, trueBifurcation: true }] }).cx);
    let x = cx;
    // left alone, a pinched branch closes
    x = run(x, 1800);
    const sb = x.list.find((c) => c.kind === "side-branch")!;
    expect(sb.grade).toBe("TIMI 0-1");
    expect(patientEffects(x, ctx()).occlusions.find((o) => o.id === sb.id)!.fraction).toBe(1);
    // kissing without rewiring does nothing; rewire then kiss restores it
    const early = applyBailout(x, "kissing-balloon", 1900, { wireInBranch: () => false, balloonInBranch: () => true });
    expect(early.cx.list.find((c) => c.id === sb.id)!.stage).not.toBe("resolved");
    let fixed = applyBailout(x, "rewire-side-branch", 1900, { wireInBranch: () => true }).cx;
    fixed = applyBailout(fixed, "kissing-balloon", 1950, { wireInBranch: () => true, balloonInBranch: () => true }).cx;
    expect(fixed.list.find((c) => c.id === sb.id)!.stage).toBe("resolved");
  });

  it("no-reflow after dilating thrombus: slow flow worsens if untreated and improves with intracoronary vasodilators", () => {
    expect(noReflowRisk({ thrombus: true, lipid: false, ratio: 1, lesionLengthMm: 16, aspirated: false, stent: true })).toBeGreaterThan(5 * noReflowRisk({ thrombus: false, lipid: false, ratio: 1, lesionLengthMm: 12, aspirated: false, stent: false }));
    const { cx } = firstWith("no-reflow", (c) => onInflation(c, 0, inflation({ thrombus: true, ratio: 1.0, lesionLengthMm: 16 })).cx);
    const nr0 = cx.list.find((c) => c.kind === "no-reflow")!;
    const worse = run(cx, 900).list.find((c) => c.id === nr0.id)!;
    expect(worse.severity).toBeGreaterThan(nr0.severity);
    expect(patientEffects(run(cx, 900), ctx()).noReflow).not.toBeNull();
    // repeated vasodilators restore flow
    let x = cx;
    for (const d of ["ic-adenosine", "ic-verapamil", "ic-nitroprusside", "ic-epinephrine", "ic-adenosine", "ic-verapamil"] as const) x = applyBailout(x, d, 10).cx;
    expect(x.list.find((c) => c.id === nr0.id)!.severity).toBeLessThan(nr0.severity);
  });

  it("thrombus forms on equipment when the ACT is low, grows and embolises; heparin stops growth; aspiration removes it", () => {
    const low = run(initialCx(3), 1500, { act: 150 });
    const ok = run(initialCx(3), 1500, { act: 300 });
    expect(low.list.some((c) => c.kind === "thrombus")).toBe(true);
    expect(ok.list.some((c) => c.kind === "thrombus")).toBe(false);
    const th = low.list.find((c) => c.kind === "thrombus")!;
    let x = applyBailout(low, "aspiration-thrombectomy", 1600).cx;
    x = applyBailout(x, "aspiration-thrombectomy", 1610).cx;
    expect(["resolved", "treated", "overt"]).toContain(x.list.find((c) => c.id === th.id)!.stage);
    const hep = applyBailout(low, "heparin", 1600).cx;
    const after = run(hep, 600, { act: 150 }).list.find((c) => c.id === th.id)!;
    expect(after.severity).toBe(hep.list.find((c) => c.id === th.id)!.severity);
  });

  it("air: introducing a device through an open valve without aspiration puts air in the guide (a prodrome); the next injection embolises it", () => {
    let cx = onValveOpened(initialCx(5));
    const intro = onDeviceIntroduced(cx, 1, true);
    expect(intro.notes.some((n) => /bubble/.test(n.text))).toBe(true);
    cx = intro.cx;
    expect(cx.guideAirMl).toBeGreaterThan(0);
    const inj = onInjection(cx, 2, { route, vessel: "LAD", side: "left", psi: 150, forceful: false, guideDepthMm: 0, guideCoaxial: 0.9 });
    const air = inj.cx.list.find((c) => c.kind === "air")!;
    expect(air).toBeTruthy();
    expect(patientEffects(inj.cx, ctx()).vagal).toBeGreaterThan(0);
    expect(patientEffects(inj.cx, ctx()).occlusions.some((o) => o.id === air.id)).toBe(true);
    // oxygen speeds clearance
    const withO2 = run(applyBailout(inj.cx, "oxygen", 3).cx, 60, { oxygen: true });
    const without = run(inj.cx, 60);
    expect(withO2.list.find((c) => c.id === air.id)!.data.ml).toBeLessThan(without.list.find((c) => c.id === air.id)!.data.ml);
    // aspirating before the injection prevents it
    const clean = onInjection(onAspirate(intro.cx), 2, { route, vessel: "LAD", side: "left", psi: 150, forceful: false, guideDepthMm: 0, guideCoaxial: 0.9 });
    expect(clean.cx.list.some((c) => c.kind === "air")).toBe(false);
  });

  it("patient effects map onto the S9 engine: occlusions, no-reflow and pericardial inflow", () => {
    const fx = patientEffects(initialCx(1), ctx());
    expect(fx.occlusions).toEqual([]);
    expect(fx.noReflow).toBeNull();
    expect(fx.pericardialMlS).toBe(0);
  });
});

// pci-cx-recognition: the engine stops naming what the learner has not assessed.
describe("recognition gate (pci-cx-recognition)", () => {
  /**
   * A text that names, grades or describes the classifying morphology of a complication. Written out here,
   * independently of the engine's own list: the debrief's names (complicationLabel), the grade systems, the
   * defining words of the form's NHLBI and Ellis options (src/ui/pci/RecognitionForm.tsx: radiolucency,
   * double lumen, extraluminal stain, spiral, filling defect, occlusion, crater, blush, streaming, cavity
   * spilling) and the TIMI definitions (creeps, clears slowly, clears normally), plus the descriptions the
   * modules used (bubbles, haziness, jet, chamber, channel, hole, leak, side branch, closure).
   */
  const NAMING =
    /dissect|perforat|reflow|thromb|embol|\bair\b|bubble|NHLBI|Ellis|TIMI|tamponade|radiolucen|lucen|double|lumen|extraluminal|stain|spiral|filling defect|persistent|occlu|closure|crater|blush|stream|cavit|spill|chamber|creep|slowly|normally|side.branch|haz[ey]|\bjet\b|channel|\bhole\b|\bleak|flap|seal/i;

  it("a lesion dissection emits only 'cue' notes; the 'label' note appears in the debrief data", () => {
    // an overt (staining) dissection from an oversized balloon in the lesion
    let found: { cx: CxState; notes: ReturnType<typeof onInflation>["notes"] } | null = null;
    for (let seed = 1; seed <= 200 && !found; seed++) {
      const r = onInflation(initialCx(seed), 0, inflation({ ratio: 1.3 }));
      if (r.cx.list.some((c) => c.kind === "dissection" && c.stage === "overt")) found = r;
    }
    expect(found).not.toBeNull();
    const { cx, notes } = found!;
    const d = cx.list.find((c) => c.kind === "dissection")!;
    // nothing of it reaches the live log before a contrast run: its image cues are held
    const mine = notes.filter((n) => n.id === d.id);
    for (const n of mine) {
      expect(n.type).toBe("cue");
      expect(n.text).not.toMatch(NAMING);
    }
    const held = (cx.heldCues ?? []).filter((n) => n.id === d.id);
    expect(mine.length + held.length).toBeGreaterThan(0);
    for (const n of held) {
      expect(n.type).toBe("cue");
      expect(n.text).not.toMatch(NAMING);
    }
    // the label is kept for the debrief, with the name and the NHLBI type
    expect(cx.labels!.some((l) => l.id === d.id && l.type === "label" && /dissection \(NHLBI type [A-F]\)/.test(l.text))).toBe(true);
    const debrief = cxDebrief(cx).find((r) => r.id === d.id)!;
    expect(debrief.label).toMatch(/dissection \(NHLBI type [A-F]\)/);
    expect(debrief.labels.some((t) => /NHLBI/.test(t))).toBe(true);
    expect(debrief.recognised).toBeNull();
    // progression stays hidden too: forceful injections and time give only cues
    let x = cx;
    const later: typeof notes = [];
    for (let i = 0; i < 6; i++) {
      const r = onInjection(x, i + 1, { route, vessel: "LAD", side: "left", psi: 320, forceful: true, guideDepthMm: 0, guideCoaxial: 0.9 });
      later.push(...r.notes);
      x = r.cx;
    }
    for (let t = 10; t < 1200; t += 1) {
      const r = stepCx(x, 1, ctx({ t }), site);
      later.push(...r.notes);
      x = r.cx;
    }
    expect(later.filter((n) => n.id === d.id).length).toBeGreaterThan(0);
    for (const n of [...later, ...(x.heldCues ?? [])].filter((n) => n.id === d.id)) {
      expect(n.type).toBe("cue");
      expect(n.text).not.toMatch(NAMING);
    }
    expect(x.labels!.length).toBeGreaterThanOrEqual(cx.labels!.length);
  });

  it("an image cue waits for the next contrast run: held after the dilatation, shown by the injection", () => {
    let cx: CxState | null = null;
    for (let seed = 1; seed <= 200 && !cx; seed++) {
      const r = onInflation(initialCx(seed), 3, inflation({ ratio: 1.3 }));
      const d = r.cx.list.find((c) => c.kind === "dissection");
      if (d && cueHeld(r.cx, d.id)) {
        // the deflation's own notes give the live log nothing about the image
        expect(r.notes.filter((n) => n.id === d.id && isImageCue(n.text))).toEqual([]);
        cx = r.cx;
      }
    }
    expect(cx).not.toBeNull();
    const d = cx!.list.find((c) => c.kind === "dissection")!;
    const held = cx!.heldCues!.filter((h) => h.id === d.id);
    expect(held.length).toBeGreaterThan(0);
    for (const h of held) expect(isImageCue(h.text)).toBe(true);
    // time alone shows nothing: no image cue of it reaches the log, and it stays held
    let x = cx!;
    for (let t = 4; t < 10; t++) {
      const r = stepCx(x, 1, ctx({ t }), site);
      expect(r.notes.filter((n) => n.id === d.id && isImageCue(n.text))).toEqual([]);
      x = r.cx;
    }
    expect(cueHeld(x, d.id)).toBe(true);
    // a run made before the change shows nothing of it
    expect(releaseHeldCues(x, 2).notes).toEqual([]);
    // the next injection is the run that shows it, once
    const run = onInjection(x, 10, { route, vessel: "LAD", side: "left", psi: 100, forceful: false, guideDepthMm: 0, guideCoaxial: 0.9 });
    const shown = run.notes.filter((n) => n.id === d.id);
    expect(shown.length).toBeGreaterThan(0);
    for (const n of shown) {
      expect(n.type).toBe("cue");
      expect(n.text).not.toMatch(NAMING);
    }
    expect(new Set(shown.map((n) => n.text)).size).toBe(shown.length);
    expect(cueHeld(run.cx, d.id)).toBe(false);
    // the release a later step makes (src/simulation/pci/actions/step.ts) takes the same cues
    const later = releaseHeldCues(x, 10);
    expect(later.notes.map((n) => n.text)).toEqual(x.heldCues!.map((n) => n.text));
    expect(later.cx.heldCues).toEqual([]);
    // the input state is untouched
    expect(cueHeld(x, d.id)).toBe(true);
  });

  it("an assessment is scored against the complication's grade; only a right cause names it from then on", () => {
    let cx: CxState | null = null;
    for (let seed = 1; seed <= 200 && !cx; seed++) {
      const r = onInflation(initialCx(seed), 0, inflation({ ratio: 1.3 }));
      if (r.cx.list.some((c) => c.kind === "dissection")) cx = r.cx;
    }
    const d = cx!.list.find((c) => c.kind === "dissection")!;
    const timi = timiOf(d)[0];
    const forceful = { route, vessel: "LAD", side: "left" as const, psi: 400, forceful: true, guideDepthMm: 0, guideCoaxial: 0.9 };
    // a wrong cause scores wrong, adds no note, and leaves the dissection unrecognised: its notes stay cues
    const wrong = recogniseCx(cx!, 30, { cause: "thrombus", timi });
    expect(wrong.id).toBe(d.id);
    expect(wrong.recognition!.score).toMatchObject({ cause: false, correct: false });
    expect(wrong.recognition!.attempt).toBe(1);
    expect(wrong.notes).toEqual([]);
    expect(unrecognised(wrong.cx).map((c) => c.id)).toContain(d.id);
    let probe = wrong.cx;
    const afterWrong: CxNote[] = [];
    for (let i = 0; i < 6; i++) {
      const r = onInjection(probe, 31 + i, forceful);
      afterWrong.push(...r.notes);
      probe = r.cx;
    }
    for (const n of afterWrong.filter((n) => n.id === d.id)) {
      expect(n.type).toBe("cue");
      expect(n.text).not.toMatch(NAMING);
    }
    // a reassessment with the right cause is the second attempt, and names it
    const second = recogniseCx(wrong.cx, 40, { cause: "dissection", nhlbi: d.grade, timi });
    expect(second.id).toBe(d.id);
    expect(second.recognition).toMatchObject({ attempt: 2, delayS: 40 });
    // the first attempt is kept with it (the mentor's metrics and the debrief score it)
    expect(second.recognition!.first).toEqual({ t: 30, cause: "thrombus", delayS: 30, correct: false });
    expect(second.recognition!.score.correct).toBe(true);
    // the right cause with the wrong NHLBI type
    const other = d.grade === "A" ? "F" : "A";
    expect(scoreRecognition(d, { cause: "dissection", nhlbi: other, timi }).correct).toBe(false);
    // right cause, type and TIMI grade at the first attempt
    const right = recogniseCx(cx!, 30, { cause: "dissection", nhlbi: d.grade, timi });
    expect(right.recognition!.score).toMatchObject({ cause: true, grade: true, timi: true, correct: true });
    expect(right.recognition!.delayS).toBe(30);
    expect(right.recognition!.attempt).toBe(1);
    expect(right.recognition!.first).toBeUndefined();
    expect(right.notes).toEqual([]);
    expect(right.cx.list.find((c) => c.id === d.id)!.recognised!.answer.nhlbi).toBe(d.grade);
    // later notes of the recognised dissection pass named
    const named = onInjection(right.cx, 31, forceful);
    expect(named.notes.filter((n) => n.id === d.id).length).toBeGreaterThan(0);
    const labelsOf = (c: CxState) => c.labels!.filter((l) => l.id === d.id).length;
    expect(labelsOf(named.cx)).toBe(labelsOf(right.cx));
    expect(named.notes.filter((n) => n.id === d.id).some((n) => NAMING.test(n.text) && namesComplication(n))).toBe(true);
    // nothing to recognise: a false alarm
    expect(recogniseCx(right.cx, 40, { cause: "dissection", nhlbi: "A", timi: 3 }).id).toBeNull();
  });

  it("the assessment's log line is the learner's own answer, the same whether right or wrong", () => {
    const wrongGrade = "B";
    const text = assessmentText({ cause: "dissection", nhlbi: wrongGrade, timi: 2 });
    expect(text).toBe("Assessed as: dissection, NHLBI type B, TIMI 2.");
    expect(assessmentText({ cause: "perforation", site: "distal", ellis: "II", timi: 3 })).toBe("Assessed as: perforation, distal vessel, Ellis II, TIMI 3.");
    expect(assessmentText({ cause: "spasm", timi: 3 })).toBe("Assessed as: spasm, TIMI 3.");
    // no truth, no score: the text depends only on the answer
    expect(assessmentText({ cause: "dissection", nhlbi: wrongGrade, timi: 2 })).toBe(text);
  });

  it("every cue the gate can give is free of names, grades and classifying morphology", () => {
    for (const cue of Object.values(CUES)) expect(cue, cue).not.toMatch(NAMING);
    const kinds: [Complication["kind"], string[], Record<string, number>[]][] = [
      ["dissection", ["A", "B", "C", "D", "E", "F"], [{}, { ostial: 1 }]],
      ["perforation", ["I", "II", "III", "III-CS"], [{ distal: 1 }, { distal: 0 }]],
      ["no-reflow", ["TIMI 0", "TIMI 1", "TIMI 2", "TIMI 3"], [{}]],
      ["thrombus", ["thrombus"], [{}, { embolised: 1 }]],
      ["air", ["air"], [{}]],
      ["side-branch", ["TIMI 0-1", "TIMI 2"], [{}]],
    ];
    const texts = ["The dissection extends (NHLBI type C).", "A tiny contrast crater beyond the wire tip.", "Contrast clears slowly from the vessel beyond the treated segment.", "Some thrombus is aspirated; a residual defect remains.", "The bubbles have cleared; flow is normal."];
    for (const [kind, grades, datas] of kinds)
      for (const grade of grades)
        for (const data of datas)
          for (const type of ["cue", "event", "effect"] as const)
            for (const tone of ["info", "warn", "danger", "good"] as const)
              for (const text of texts) {
                const c = { id: `${kind}-1`, kind, stage: "overt", t0: 0, tOvert: 0, tTreated: null, route, vessel: "LAD", atMm: 60, lengthMm: 8, severity: 0.6, grade, cause: "test", data, bailouts: [] } as unknown as Complication;
                const cue = cueFor(c, { t: 0, id: c.id, kind, type, tone, text });
                expect(cue, `${kind} ${grade} ${type} ${tone}`).not.toMatch(NAMING);
              }
    // the thrombus effects say what happened: material came back, or nothing got worse
    const th = { id: "thrombus-1", kind: "thrombus", data: {}, grade: "thrombus" } as unknown as Complication;
    expect(cueFor(th, { t: 0, id: th.id, kind: "thrombus", type: "effect", tone: "info", text: "Some thrombus is aspirated; a residual defect remains." })).toBe(CUES.material);
    expect(cueFor(th, { t: 0, id: th.id, kind: "thrombus", type: "effect", tone: "info", text: "Heparin given: the thrombus stops growing." })).toBe(CUES.noWorse);
  });

  it("gateNotes gates notes drawn from a module directly (an ostial guide dissection), purely and idempotently", () => {
    let found: { cx: CxState; notes: CxNote[] } | null = null;
    for (let seed = 1; seed <= 400 && !found; seed++) {
      const cx = initialCx(seed);
      const r = maybeGuideDissection(cx, 5, { side: "left", depthMm: 4, coaxial: 0.3, forceful: true, vessel: "LM" });
      if (r.c) found = { cx, notes: r.notes };
    }
    expect(found).not.toBeNull();
    const { cx, notes } = found!;
    expect(notes.some((n) => NAMING.test(n.text))).toBe(true);
    const labelsBefore = (cx.labels ?? []).length;
    // made by an injection, so a contrast run: the cue is shown at once
    const g = gateNotes(cx, notes, { run: true });
    expect((cx.labels ?? []).length).toBe(labelsBefore);
    expect(g.notes.length).toBeGreaterThan(0);
    for (const n of g.notes) {
      expect(n.type).toBe("cue");
      expect(n.text).not.toMatch(NAMING);
    }
    expect(g.cx.labels!.some((l) => l.type === "label" && /ostial dissection/.test(l.text))).toBe(true);
    const again = gateNotes(g.cx, g.notes, { run: true });
    expect(again.notes).toEqual(g.notes);
    expect(again.cx.labels).toEqual(g.cx.labels);
    // not from a run: the same image cue waits on heldCues, and the input state is untouched
    const quiet = gateNotes(cx, notes);
    expect(quiet.notes.filter((n) => isImageCue(n.text))).toEqual([]);
    expect(quiet.cx.heldCues!.map((n) => n.text)).toEqual(g.notes.filter((n) => isImageCue(n.text)).map((n) => n.text));
    expect(cx.heldCues ?? []).toEqual([]);
  });

  it("a perforation is graded by location and Ellis grade", () => {
    const { cx } = firstWith("perforation", (c) => onInflation(c, 0, inflation({ ratioToEem: 1.4, ratio: 1.6, calcium: 2, rupture: true })).cx);
    const p = cx.list.find((c) => c.kind === "perforation")!;
    const ok = scoreRecognition(p, { cause: "perforation", site: "large-vessel", ellis: p.grade, timi: 3 });
    expect(ok).toMatchObject({ cause: true, grade: true, site: true, correct: true });
    expect(scoreRecognition(p, { cause: "perforation", site: "distal", ellis: p.grade, timi: 3 })).toMatchObject({ site: false, correct: false });
    expect(scoreRecognition(p, { cause: "perforation", site: "large-vessel", ellis: "I", timi: 3 })).toMatchObject({ grade: false, correct: false });
    // a distal wire exit is a distal-vessel perforation
    const wire = firstWith("perforation", (c) => onWirePush(c, 0, { route, vessel: "LAD", atMm: 120, gfMm: 250, vesselD: 1.2, hydrophilic: true }).cx, 5);
    const w = wire.cx.list[0];
    expect(scoreRecognition(w, { cause: "perforation", site: "distal", ellis: w.grade }).correct).toBe(true);
    // when both a dissection and a perforation are open, naming the perforation is scored against it
    const both = cx.list.some((c) => c.kind === "dissection") ? cx : null;
    if (both) expect(recogniseCx(both, 5, { cause: "perforation", site: "large-vessel", ellis: p.grade }).id).toBe(p.id);
  });

  it("no-reflow is named by its TIMI grade only after the assessment", () => {
    const { cx } = firstWith("no-reflow", (c) => onInflation(c, 0, inflation({ thrombus: true, ratio: 1.0, lesionLengthMm: 16 })).cx);
    const nr = cx.list.find((c) => c.kind === "no-reflow")!;
    let x = cx;
    const notes = [];
    for (let t = 1; t < 900; t++) {
      const r = stepCx(x, 1, ctx({ t }), site);
      notes.push(...r.notes);
      x = r.cx;
    }
    for (const n of notes.filter((n) => n.id === nr.id)) expect(n.text).not.toMatch(NAMING);
    const now = x.list.find((c) => c.id === nr.id)!;
    const t = timiOf(now)[0];
    expect(scoreRecognition(now, { cause: "no-reflow", timi: t }).correct).toBe(true);
    expect(scoreRecognition(now, { cause: "no-reflow", timi: t === 3 ? 0 : 3 }).correct).toBe(false);
    // a vasodilator's effect on an unrecognised no-reflow does not name the TIMI grade
    const fx = applyBailout(x, "ic-adenosine", 901);
    for (const n of fx.notes.filter((n) => n.id === nr.id)) expect(n.text).not.toMatch(NAMING);
  });
});


// ---------------------------------------------------------------------------
// pci-flow-closure: distal delivery, refractory no-reflow, the embolisation types, air, pseudolesions and spasm,
// the aortocoronary stain. The PCI-state tests open the flow starts as the lab will: startPci at the core
// pack's 'wire-across' start, then applyFlowStart with the launch's variant.
// ---------------------------------------------------------------------------
/** Open a flow start the way the lab does: the scenario's wire-across start (or its own start), then the variant. */
function flowStart(scenario: string, o: { variant?: string; start?: string; seed?: string }) {
  const su = pciSetup(scenario);
  const def = pciScenarioDef(scenario)!;
  const st = startPci({ def, scenario: su.s, seed: o.seed ?? o.variant }, su.g, o.start ?? "wire-across");
  return { su, st: applyFlowStart(su.s, su.g, st, { variant: o.variant, start: o.start ?? "wire-across" }) };
}
const noReflowOf = (st: PciState) => st.cx.list.find((c) => c.kind === "no-reflow")!;
const timiNum = (st: PciState) => Number(/TIMI (\d)/.exec(timiFor(noReflowOf(st).severity))![1]);
/** A microcatheter over the wire, advanced as far as the wire allows (beyond the treated segment). */
function microOut(su: ReturnType<typeof pciSetup>, st: PciState): PciState {
  return moveMicrocatheter(su.s, su.g, loadMicrocatheter(st, "mc-large"), 400);
}
const flowSource = (e: string) => FLOW_SOURCES.find((x) => x.event === e)!;

describe("flow failure and abrupt closure (pci-flow-closure)", () => {
  it("adenosine via the guide with TIMI 0 does not improve flow; the same dose via the microcatheter does; two distal doses without improvement raise no-reflow-refractory", () => {
    // the module: the same dose, two routes, TIMI 0
    const a = initialCx(1);
    const nrA = seedNoReflow(a, 0, { route, vessel: "LAD", atMm: 60, severity: 0.95, embolus: "thrombus" }).c;
    icDrugOnNoReflow(nrA, "adenosine", 100, "guide", 1);
    expect(timiFor(nrA.severity)).toBe("TIMI 0");
    icDrugOnNoReflow(nrA, "adenosine", 100, "distal", 2);
    expect(timiFor(nrA.severity)).not.toBe("TIMI 0");
    // the lab: lcx-stemi opened at no-reflow (a seed whose no-reflow is not refractory)
    let open: ReturnType<typeof flowStart> | null = null;
    for (let i = 0; i < 40 && !open; i++) {
      const x = flowStart("lcx-stemi", { variant: "no-reflow", seed: `nr-${i}` });
      if (!noReflowOf(x.st).data.refractory) open = x;
    }
    expect(open).not.toBeNull();
    const { su } = open!;
    let st = open!.st;
    expect(flowStartRecord(st)?.id).toBe("no-reflow");
    expect(timiNum(st)).toBe(0);
    // into the guide: the drug refluxes
    st = giveIcDrug(su.s, su.g, st, { agent: "adenosine", doseUg: 100, route: "guide" });
    expect(timiNum(st)).toBe(0);
    // through the microcatheter there is no catheter yet: nothing is given
    const refused = giveIcDrug(su.s, su.g, st, { agent: "adenosine", doseUg: 100, route: "microcatheter" });
    expect(refused.log.filter((r) => r.kind === "ic-drug").length).toBe(1);
    // the same dose through the microcatheter beyond the segment
    st = microOut(su, st);
    st = giveIcDrug(su.s, su.g, st, { agent: "adenosine", doseUg: 100, route: "microcatheter" });
    expect(timiNum(st)).toBeGreaterThanOrEqual(2);
    expect(st.log.filter((r) => r.kind === "ic-drug").map((r) => r.data.distal)).toEqual([false, true]);
    // a refractory no-reflow: two distal vasodilator doses without a TIMI rise mark it refractory
    const r = flowStart("lcx-stemi", { variant: "no-reflow-refractory" });
    let rs = microOut(r.su, r.st);
    const nr0 = noReflowOf(rs);
    expect(nr0.data.refractory).toBe(1);
    rs = giveIcDrug(r.su.s, r.su.g, rs, { agent: "nicardipine", doseUg: 200, route: "microcatheter" });
    expect(noReflowOf(rs).data.refractoryRaised).toBeUndefined();
    rs = giveIcDrug(r.su.s, r.su.g, rs, { agent: "adenosine", doseUg: 100, route: "microcatheter" });
    expect(REFRACTORY_DISTAL_DOSES).toBe(2);
    expect(noReflowOf(rs).data.refractoryRaised).toBe(1);
    expect(timiNum(rs)).toBe(0);
    // the event: raised once the learner has named the no-reflow (before that the lab shows only cues)
    const snap = (st: PciState) => ({ state: st, lesion: { vessel: r.su.g.lesion.vessel, startMm: r.su.g.lesion.startMm, endMm: r.su.g.lesion.endMm } });
    expect(flowSource("no-reflow-refractory").active(snap(rs))).toBe(false);
    rs = recognisePci(rs, { cause: "no-reflow", timi: 0 }).st;
    expect(flowSource("no-reflow-refractory").active(snap(rs))).toBe(true);
    // a nitrate does nothing for no-reflow; adrenaline distally restores flow
    const n = giveIcDrug(r.su.s, r.su.g, rs, { agent: "gtn", doseUg: 200, route: "microcatheter" });
    expect(noReflowOf(n).severity).toBe(noReflowOf(rs).severity);
    rs = giveIcDrug(r.su.s, r.su.g, rs, { agent: "adrenaline", doseUg: 100, route: "microcatheter" });
    expect(timiNum(rs)).toBeGreaterThanOrEqual(2);
  });

  it("plaque embolisation does not respond to GP IIb/IIIa; thrombus embolisation does", () => {
    const cx0 = initialCx(2);
    const plaque = seedNoReflow(cx0, 0, { route, vessel: "LAD", atMm: 60, severity: 0.7, embolus: "plaque" }).c;
    const thrombotic = seedNoReflow(cx0, 0, { route, vessel: "LAD", atMm: 70, severity: 0.7, embolus: "thrombus" }).c;
    const emb = seedThrombosis(cx0, 0, { route, vessel: "LAD", atMm: 50, act: 300 }).c;
    const x = applyBailout(cx0, "gp2b3a", 10).cx;
    expect(x.list.find((c) => c.id === plaque.id)!.severity).toBe(plaque.severity);
    expect(x.list.find((c) => c.id === thrombotic.id)!.severity).toBeLessThan(thrombotic.severity);
    expect(x.list.find((c) => c.id === emb.id)!.severity).toBeLessThan(emb.severity);
    // a second dose clears the embolised thrombus
    expect(applyBailout(x, "gp2b3a", 20).cx.list.find((c) => c.id === emb.id)!.stage).toBe("resolved");
    // in the lab: cangrelor too, on the closure start's thrombosis; nothing on the plaque start
    const th = flowStart("lad-focal", { variant: "closure-thrombus" });
    expect(flowStartRecord(th.st)?.mechanism).toBe("thrombosis");
    expect(flowStartPatient(th.st)?.actS).toBeLessThan(250);
    const tc = th.st.cx.list.find((c) => c.kind === "thrombus")!;
    const after = giveDrug(th.su.s, th.su.g, th.st, "cangrelor", 30, "iv");
    expect(after.cx.list.find((c) => c.id === tc.id)!.severity).toBeLessThan(tc.severity);
    const pl = flowStart("rca-calcified", { variant: "plaque-embolisation" });
    const pc = noReflowOf(pl.st);
    expect(pc.data.plaque).toBe(1);
    expect(noReflowOf(giveDrug(pl.su.s, pl.su.g, pl.st, "eptifibatide", 180, "iv")).severity).toBe(pc.severity);
    expect(noReflowOf(giveDrug(pl.su.s, pl.su.g, pl.st, "cangrelor", 30, "iv")).severity).toBe(pc.severity);
    // plaque debris: aspiration retrieves it, and a stent over it makes it worse
    const asp = bailout(pl.su.s, pl.su.g, pl.st, "aspiration-thrombectomy");
    expect(asp.events.some((e) => /Little material/.test(e.text))).toBe(false);
    let stented = stepCx(pl.st.cx, 1, ctx({ t: 1, stents: [] }), site).cx;
    stented = stepCx(stented, 1, ctx({ t: 2, stents: [{ route, fromMm: 40, toMm: 60, covered: false, d: 3 }] }), site).cx;
    const worse = stented.list.find((c) => c.id === pc.id)!;
    expect(worse.severity).toBeGreaterThan(pc.severity);
    expect(worse.data.stentedOver).toBe(1);
    expect(flowDebrief({ log: pl.st.log, cx: stented, t: 2 }).some((l) => !l.ok && /over embolised plaque/.test(l.text))).toBe(true);
  });

  it("the air start shows HR < 50 and inferior ST elevation, resolved by aspiration plus forceful injection within the patient clock", () => {
    const run = (treatAt: number | null) => {
      const { su, st: st0 } = flowStart("rca-calcified", { variant: "air-rca" });
      let st = st0;
      expect(flowStartRecord(st)?.id).toBe("air-rca");
      const eng = new PatientEngine({ profile: generatePatient(21, { indication: "SA" }), tree: su.refTree, lesions: [] });
      const mem = newBridge();
      eng.setTip(tipFromGuide(st.guide, "right", false));
      eng.advance(6);
      // what the start asks of the engine (the lab applies it with the start)
      const fp = flowStartPatient(st)!;
      eng.forceVagal(fp.vagal!.level, fp.vagal!.holdS);
      if (fp.rhythm) eng.forceRhythm(fp.rhythm, "air in the RCA");
      const t0 = eng.time;
      let minHr = Infinity;
      let inferior = false;
      let resolvedAt: number | null = null;
      let recovered = false;
      for (let k = 0; k < 4 * 150; k++) {
        if (treatAt !== null && Math.abs(st.t - treatAt) < 1e-6) {
          st = bailout(su.s, su.g, st, "aspirate-guide");
          st = bailout(su.s, su.g, st, "forceful-saline");
        }
        st = stepPci(su.s, su.g, st, 0.25);
        applyEffects(eng, mem, pciPatientEffects(su.s, su.g, st), st.t);
        if (!recovered && flowPatientRecovery(st) === "sinus") {
          eng.forceRhythm("sinus", "air cleared");
          recovered = true;
        }
        eng.advance(0.25);
        const v = eng.vitals();
        if (treatAt === null || st.t <= treatAt) {
          if (v.hr !== null) minHr = Math.min(minHr, v.hr);
          if (v.stemi.groups.includes("inferior")) inferior = true;
        }
        if (resolvedAt === null && st.cx.list.find((c) => c.kind === "air")!.stage === "resolved") resolvedAt = eng.time - t0;
      }
      return { minHr, inferior, resolvedAt, hrEnd: eng.vitals().hr ?? 0, stemiEnd: eng.vitals().stemi.groups };
    };
    const treated = run(25);
    expect(treated.minHr).toBeLessThan(50);
    expect(treated.inferior).toBe(true);
    // resolved on the patient clock within two minutes of the treatment, and the rhythm and the ST segments recover
    expect(treated.resolvedAt).not.toBeNull();
    expect(treated.resolvedAt! - 25).toBeLessThan(120);
    expect(treated.hrEnd).toBeGreaterThanOrEqual(50);
    expect(treated.stemiEnd).not.toContain("inferior");
    // untreated it has not cleared in the same time
    const untreated = run(null);
    expect(untreated.resolvedAt === null || untreated.resolvedAt > treated.resolvedAt! + 30).toBe(true);
  });

  it("air left in the guide: a second injection before the manifold check is a second air event; after the check it is not", () => {
    const { su, st } = flowStart("rca-calcified", { variant: "air-rca" });
    const inj = (x: PciState) => injectPci(su.s, su.g, { ...x, t: x.t + 1 }, { psi: 120, forceful: false });
    expect(inj(st).cx.list.filter((c) => c.kind === "air").length).toBe(2);
    const checked = checkManifold(st);
    expect(inj(checked).cx.list.filter((c) => c.kind === "air").length).toBe(1);
    expect(flowDebrief(st).some((l) => !l.ok && /manifold/.test(l.text))).toBe(true);
    expect(flowDebrief(checked).some((l) => /manifold/.test(l.text))).toBe(false);
  });

  it("pseudolesions appear with the stiff wire in a tortuous RCA and vanish on exchange to a soft wire; nitrate alone does not remove them", () => {
    const su = pciSetup("rca-calcified");
    const def = pciScenarioDef("rca-calcified")!;
    let st = startPci({ def, scenario: su.s }, su.g, "wire-across");
    const base = lumenFor(su.s, su.g, st).lesions.length;
    st = microOut(su, st);
    st = setWireKind(st, "support", { g: su.g });
    const sites = wiringOf(st).pseudo?.sites ?? [];
    expect(sites.length).toBeGreaterThan(0);
    // drawn on the image as new narrowings, not given to the engine's network
    expect(lumenFor(su.s, su.g, st).lesions.length).toBe(base + sites.length);
    // nitroglycerin into the guide and through the microcatheter: the pseudolesions stay
    st = giveIcDrug(su.s, su.g, st, { agent: "gtn", doseUg: 200, route: "guide" });
    st = giveIcDrug(su.s, su.g, st, { agent: "gtn", doseUg: 200, route: "microcatheter" });
    for (let i = 0; i < 40 * 4; i++) st = stepPci(su.s, su.g, st, 0.25);
    expect(wiringOf(st).pseudo?.sites.length).toBe(sites.length);
    expect(lumenFor(su.s, su.g, st).lesions.length).toBe(base + sites.length);
    // exchanged for a soft (workhorse) wire through the microcatheter: they vanish
    st = setWireKind(st, "workhorse", { g: su.g });
    expect(wiringOf(st).pseudo).toBeNull();
    expect(lumenFor(su.s, su.g, st).lesions.length).toBe(base);
  });

  it("wire-induced spasm relaxes after intracoronary nitroglycerin, within two minutes and not before the delay; the pseudolesions stay", () => {
    const { su, st: st0 } = flowStart("rca-calcified", { variant: "wire-spasm" });
    expect(activeSpasms(st0).length).toBe(1);
    const sp0 = activeSpasms(st0)[0];
    expect(pciPatientEffects(su.s, su.g, st0).occlusions.some((o) => o.id === `spasm-${sp0.id}`)).toBe(true);
    // verapamil is a calcium channel blocker too; adenosine relaxes nothing
    expect(spasmsOf(giveIcDrug(su.s, su.g, st0, { agent: "adenosine", doseUg: 100, route: "guide" })).every((x) => x.pendingAt === null)).toBe(true);
    let st = giveIcDrug(su.s, su.g, st0, { agent: "gtn", doseUg: 200, route: "guide" });
    const due = spasmsOf(st)[0].pendingAt!;
    expect(due - st.t).toBeGreaterThanOrEqual(30);
    expect(due - st.t).toBeLessThanOrEqual(120);
    for (let t = 0; t < 20; t += 0.25) st = stepPci(su.s, su.g, st, 0.25);
    expect(activeSpasms(st).length).toBe(1);
    for (let t = 0; t < 120; t += 0.25) st = stepPci(su.s, su.g, st, 0.25);
    expect(activeSpasms(st).length).toBe(0);
    expect(wiringOf(st).pseudo).not.toBeNull();
  });

  it("the sinus-stain start grows with each RCA injection and stops after the ostial stent", () => {
    const { su, st: st0 } = flowStart("rca-aortocoronary", { start: "sinus-stain" });
    const d0 = st0.cx.list.find((c) => c.kind === "dissection")!;
    expect(d0.data.aortic).toBe(1);
    // the guide is eased back from the seat that caused it: the trace is not damped, so the injections are the learner's choice
    expect(st0.guide.engaged).toBe(true);
    expect(guideDamps(st0.guide)).toBe(false);
    const inj = (x: PciState) => injectPci(su.s, su.g, { ...x, t: x.t + 2 }, { psi: 110, forceful: false });
    let st = st0;
    const stains = [d0.data.stainMm];
    for (let i = 0; i < 3; i++) {
      st = inj(st);
      stains.push(st.cx.list.find((c) => c.id === d0.id)!.data.stainMm);
    }
    for (let i = 1; i < stains.length; i++) expect(stains[i]).toBeGreaterThan(stains[i - 1]);
    // a stent inside the ostium does not seal it; one protruding 1-2 mm into the aorta does
    const d = st.cx.list.find((c) => c.id === d0.id)!;
    const inside = onStent(st.cx, st.t, { route: d.route, fromMm: 0.5, toMm: 20, covered: false, sideBranches: [] });
    expect(inside.cx.list.find((c) => c.id === d0.id)!.stage).not.toBe("resolved");
    const sealed = onStent(st.cx, st.t, { route: d.route, fromMm: -1.5, toMm: d.atMm + d.lengthMm / 2 + 10, covered: false, sideBranches: [] });
    expect(sealed.cx.list.find((c) => c.id === d0.id)!.stage).toBe("resolved");
    expect(OSTIAL_PROTRUSION_MM).toEqual([1, 2]);
    let after: PciState = { ...st, cx: sealed.cx };
    const sealedMm = after.cx.list.find((c) => c.id === d0.id)!.data.stainMm;
    for (let i = 0; i < 3; i++) after = inj(after);
    expect(after.cx.list.find((c) => c.id === d0.id)!.data.stainMm).toBe(sealedMm);
    expect(flowDebrief(after).some((l) => l.ok && /protruded 1\.5 mm/.test(l.text))).toBe(true);
    expect(flowDebrief(after).some((l) => !l.ok && /3 injections into the RCA after the aortocoronary dissection/.test(l.text))).toBe(true);
    // the module's seeder alone: an ostial dissection flagged aortic
    const cx = initialCx(9);
    expect(seedAortocoronaryDissection(cx, 0, { route: ["RCA"], vessel: "RCA" }).c.data).toMatchObject({ ostial: 1, aortic: 1 });
  });

  it("the closure start draws its mechanism from the seed and names none of it on the live log", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const { st } = flowStart("lad-focal", { variant: "closure-timi0", seed: `closure-${i}` });
      const m = flowStartRecord(st)!.mechanism!;
      seen.add(m);
      // nothing of the mechanism on the live log: the start's notes are cues
      for (const e of st.events) expect(e.text).not.toMatch(/dissect|thromb|embol|spasm|reflow|NHLBI|TIMI/i);
      // the vessel is closed or nearly so, whatever the mechanism
      const fx = pciPatientEffects(pciSetup("lad-focal").s, pciSetup("lad-focal").g, st);
      expect(fx.occlusions.some((o) => o.fraction >= 0.6) || fx.noReflow !== null).toBe(true);
    }
    expect([...seen].sort()).toEqual(["dissection", "plaque-embolisation", "spasm", "thrombosis"]);
  });

  it("a wire re-crossing an unsealed flow-limiting dissection can track into the false lumen; the dissection-rescue start's re-crossed wire is in the true or the false lumen by its seed", () => {
    const su = pciSetup("lad-focal");
    let sub = 0;
    for (let i = 0; i < 40; i++) {
      // the closure start's NHLBI F dissection, the wire pulled back behind it, then advanced beyond it again
      const dissected = flowStart("lad-focal", { variant: "closure-dissection", seed: `rx-${i}` }).st;
      const before: PciState = { ...initialPci(su.s, { guideEngaged: true, seed: `rx-${i}` }), cx: dissected.cx, tipMm: su.g.lesion.startMm - 10, route: ["LM", "LAD"] };
      const after: PciState = { ...dissected, tipMm: su.g.lesion.endMm + 30, route: ["LM", "LAD"], wire: { ...dissected.wire, subintimal: null, tipMm: su.g.lesion.endMm + 30 } };
      const r = recrossDissection(before, after);
      if (r.wire.subintimal) sub++;
      // pulled back behind a sealed (stented) dissection the same move never goes subintimal
      const sealed = { ...after, cx: { ...after.cx, list: after.cx.list.map((c) => ({ ...c, stage: "resolved" as const })) } };
      expect(recrossDissection(before, sealed).wire.subintimal).toBeNull();
    }
    expect(sub).toBeGreaterThan(5);
    expect(sub).toBeLessThan(40);
    const kinds = new Set<string>();
    for (let i = 0; i < 20; i++) kinds.add(flowStartRecord(flowStart("lad-focal", { variant: "dissection-rescue", seed: `dr-${i}` }).st)!.mechanism!);
    expect(kinds.size).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// pci-flow-closure, after review: the route-less intracoronary bail-outs act as guide injections, drawn
// no-reflow keeps its old plaque behaviour, and the debrief and refractory rules read what reached the bed.
// ---------------------------------------------------------------------------
describe("flow failure and abrupt closure: review fixes (pci-flow-closure)", () => {
  it("a team intracoronary vasodilator (route-less, a guide injection) leaves TIMI 0 at TIMI 0 and does nothing to a refractory no-reflow", () => {
    let cx = initialCx(4);
    const nr = seedNoReflow(cx, 0, { route, vessel: "LAD", atMm: 60, severity: 0.95, embolus: "thrombus" }).c;
    for (const t of [10, 20]) cx = applyBailout(cx, "ic-adenosine", t).cx;
    expect(timiFor(cx.list.find((c) => c.id === nr.id)!.severity)).toBe("TIMI 0");
    // refractory at TIMI 2: no vasodilator changes it, whatever the draws
    let rx = initialCx(5);
    const rf = seedNoReflow(rx, 0, { route, vessel: "LAD", atMm: 60, severity: 0.5, embolus: "thrombus", refractory: true }).c;
    for (const [i, d] of (["ic-adenosine", "ic-verapamil", "ic-nitroprusside", "ic-adenosine", "ic-verapamil", "ic-nitroprusside"] as const).entries()) {
      const r = applyBailout(rx, d, 10 + i);
      for (const n of r.notes.filter((n) => n.id === rf.id)) expect(n.text).toBe("No clear change in flow yet.");
      rx = r.cx;
    }
    expect(rx.list.find((c) => c.id === rf.id)!.severity).toBe(rf.severity);
    // adrenaline still acts on it
    let ex = rx;
    for (let i = 0; i < 6; i++) ex = applyBailout(ex, "ic-epinephrine", 30 + i).cx;
    expect(ex.list.find((c) => c.id === rf.id)!.severity).toBeLessThan(rf.severity);
  });

  it("a drawn no-reflow without thrombus carries no plaque flag: aspiration retrieves little and a stent does not worsen it", () => {
    const { cx } = firstWith("no-reflow", (c) => onInflation(c, 0, inflation({ thrombus: false, lipid: true, ratio: 1.0, lesionLengthMm: 16 })).cx);
    const nr = cx.list.find((c) => c.kind === "no-reflow")!;
    expect(nr.data.plaque).toBeUndefined();
    expect(nr.data.thrombotic).toBeUndefined();
    const asp = applyBailout(cx, "aspiration-thrombectomy", 5);
    expect(asp.notes.some((n) => n.id === nr.id && /Little material is aspirated/.test(n.text))).toBe(true);
    expect(asp.cx.rng).toEqual(cx.rng);
    let x = stepCx(cx, 1, ctx({ t: 1, stents: [] }), site).cx;
    x = stepCx(x, 1, ctx({ t: 2, stents: [{ route, fromMm: 40, toMm: 60, covered: false, d: 3 }] }), site).cx;
    expect(x.list.find((c) => c.id === nr.id)!.data.stentedOver).toBeUndefined();
  });

  it("token distal doses do not mark the no-reflow refractory; a guide dose at TIMI 0 logs a neutral note", () => {
    const cx = initialCx(6);
    const nr = seedNoReflow(cx, 0, { route, vessel: "LAD", atMm: 60, severity: 0.95, embolus: "thrombus", refractory: true }).c;
    icDrugOnNoReflow(nr, "adenosine", 1, "distal", 1);
    icDrugOnNoReflow(nr, "adenosine", 1, "distal", 2);
    expect(nr.data.distalFails).toBeUndefined();
    expect(nr.data.refractoryRaised).toBeUndefined();
    icDrugOnNoReflow(nr, "adenosine", 100, "distal", 3);
    icDrugOnNoReflow(nr, "adenosine", 100, "distal", 4);
    expect(nr.data.refractoryRaised).toBe(1);
    const g = initialCx(7);
    const ng = seedNoReflow(g, 0, { route, vessel: "LAD", atMm: 60, severity: 0.95, embolus: "thrombus" }).c;
    const notes = icDrugOnNoReflow(ng, "adenosine", 100, "guide", 1);
    expect(notes.map((n) => n.text)).toEqual(["No clear change in flow yet."]);
    for (const n of notes) expect(n.text).not.toMatch(/TIMI|reflux|distal/i);
  });

  it("the debrief reads whether the dose reached beyond the segment, and words a stent short of the ostium", () => {
    const short = { log: [{ t: 1, kind: "ic-drug", data: { agent: "adenosine", doseUg: 100, route: "microcatheter", distal: false, timiBefore: 0, noReflow: true } }], cx: initialCx(8), t: 2 };
    const lines = flowDebrief(short);
    expect(lines.some((l) => !l.ok && /TIMI 0-1/.test(l.text))).toBe(true);
    expect(lines.some((l) => /delivered distally/.test(l.text))).toBe(false);
    const far = { ...short, log: [{ ...short.log[0], data: { ...short.log[0].data, distal: true } }] };
    expect(flowDebrief(far).some((l) => l.ok && /delivered distally/.test(l.text))).toBe(true);
    expect(flowDebrief(far).some((l) => /TIMI 0-1/.test(l.text))).toBe(false);
    const ax = initialCx(9);
    const d = seedAortocoronaryDissection(ax, 0, { route: ["RCA"], vessel: "RCA" }).c;
    d.data.protrusionMm = -0.5;
    const text = flowDebrief({ log: [], cx: ax, t: 1 }).map((l) => l.text).join(" ");
    expect(text).toContain("stopped 0.5 mm short of the ostium");
    expect(text).not.toContain("-0.5");
  });

  it("the circumflex air start, the wire through the bubbles, the drawn-narrowing key and the empty spasm list", () => {
    const a = flowStart("lcx-stemi", { variant: "air-lcx" });
    expect(flowStartRecord(a.st)?.id).toBe("air-lcx");
    const air = a.st.cx.list.find((c) => c.kind === "air")!;
    expect(air.vessel).toBe(a.su.g.lesion.vessel);
    expect(a.st.stents.length).toBe(1);
    expect(flowStartPatient(a.st)?.vagal).toBeDefined();
    expect(flowStartPatient(a.st)?.rhythm).toBeUndefined();
    const w = wireThroughBubbles(a.st);
    expect(w.cx.list.find((c) => c.id === air.id)!.data.dispersed).toBe(1);
    expect(wireThroughBubbles(flowStart("lad-focal", { variant: "flow-states" }).st).log.length).toBe(flowStart("lad-focal", { variant: "flow-states" }).st.log.length);
    // the key the lab's tree is meant to include: empty with no spasm or pseudolesion, set at the wire-spasm start
    const plain = flowStart("lad-focal", { variant: "flow-states" }).st;
    expect(flowDrawKey(plain)).toBe("");
    expect(spasmsOf(plain).length).toBe(0);
    expect(Object.isFrozen(spasmsOf(plain))).toBe(true);
    const ws = flowStart("rca-calcified", { variant: "wire-spasm" }).st;
    expect(flowDrawKey(ws)).not.toBe("");
    expect(activeSpasms(ws).length).toBe(1);
    // the cached parse follows a longer log
    expect(spasmsOf({ log: ws.log.filter((r) => r.kind !== "spasm"), t: ws.t }).length).toBe(0);
    expect(spasmsOf(ws).length).toBe(1);
  });
});
