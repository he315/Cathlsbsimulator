// access-cx-endovascular-control: the pure rules (device by vessel and segment, the cold leg by cause, the live
// hazards) and the crossover route over the aortic bifurcation with its 1-D wire.
//   npx vitest run src/simulation/access/endovascular.test.ts
import { describe, expect, it } from "vitest";
import {
  ENDO_SOURCED,
  MP_ENDO,
  angioTruth,
  gradeDevice,
  gradeLegAngio,
  gradeLegCall,
  gradeLegTreatment,
  injectionDissectionP,
  forcedWireDissectionP,
  legFindings,
  legOcclusionLevel,
  type EndoInjury,
  type PlacementGeometry,
} from "./endovascular";
import { buildAnatomy } from "../anatomy";
import { generateCase } from "../caseGenerator";
import { buildRoute3D, buildCrossoverRoute3D, crossoverSAtSiteX, crossoverAngioTubes, MP_LIMB, pointAt, siteToAortic } from "./route";
import { buildAccessSite, tubeAt } from "./site";
import { generatePatient } from "../patient/patient";
import { buildCrossoverRoute, initialWire, stepCatheter, stepWire, type WireState } from "../procedure";

const EIA: EndoInjury = { vessel: "external-iliac", siteX: 110, vesselMm: 8 };
const CFA: EndoInjury = { vessel: "common-femoral", siteX: 16, vesselMm: 8.2 };
const IEA: EndoInjury = { vessel: "iea", siteX: 70, alongMm: 15, vesselMm: 8, branchMm: 2.2 };
const DISTAL: EndoInjury = { ...IEA, alongMm: 45, distal: true };
const OVER: PlacementGeometry = { coversHole: true, coversBifurcation: false, branchHere: null };
const ACROSS_BIF: PlacementGeometry = { coversHole: true, coversBifurcation: true, branchHere: null };
const AT_IEA: PlacementGeometry = { coversHole: false, coversBifurcation: false, branchHere: "iea" };
const READY = { occludedFirst: true, retrogradeChecked: true, sheathFr: 7 };

describe("devices for a bleeding hole", () => {
  it("any definitive device before balloon occlusion is wrong, whatever it is", () => {
    for (const [inj, d, t, g] of [
      [EIA, "covered-be", "main", OVER],
      [CFA, "covered-se", "main", OVER],
      [IEA, "coils", "branch", AT_IEA],
      [DISTAL, "sealant", "branch", AT_IEA],
    ] as const) {
      const v = gradeDevice(inj, d, t, g, { ...READY, occludedFirst: false });
      expect(v.correct, `${inj.vessel} ${d}`).toBe(false);
      expect(v.reasons.join(" ")).toMatch(/No balloon/);
      // with the balloon first the same device is right
      expect(gradeDevice(inj, d, t, g, READY).correct, `${inj.vessel} ${d} after the balloon`).toBe(true);
    }
    // the prolonged balloon is not a definitive device
    expect(gradeDevice(EIA, "prolonged-balloon", "main", OVER, { ...READY, occludedFirst: false }).correct).toBe(true);
  });

  it("a large vessel: coils, sealant and a bare stent do not seal; a covered stent does", () => {
    expect(gradeDevice(EIA, "coils", "main", OVER, READY)).toMatchObject({ correct: false, effect: "none" });
    expect(gradeDevice(EIA, "coils", "branch", AT_IEA, READY)).toMatchObject({ correct: false, effect: "none" });
    expect(gradeDevice(EIA, "sealant", "branch", AT_IEA, READY)).toMatchObject({ correct: false, effect: "none" });
    expect(gradeDevice(EIA, "bare-stent", "main", OVER, READY)).toMatchObject({ correct: false, effect: "none" });
    expect(gradeDevice(EIA, "covered-be", "main", OVER, READY)).toMatchObject({ correct: true, effect: "seals" });
    // a stent that misses the hole does nothing
    expect(gradeDevice(EIA, "covered-be", "main", { ...OVER, coversHole: false }, READY)).toMatchObject({ correct: false, effect: "none" });
  });

  it("the common femoral artery: self-expanding above the bifurcation or surgery; across the bifurcation loses the profunda", () => {
    expect(gradeDevice(CFA, "covered-se", "main", OVER, READY)).toMatchObject({ correct: true, effect: "seals", profundaLost: false });
    expect(gradeDevice(CFA, "surgery", "main", OVER, READY)).toMatchObject({ correct: true });
    const be = gradeDevice(CFA, "covered-be", "main", OVER, READY);
    expect(be.correct).toBe(false);
    expect(be.reasons.join(" ")).toMatch(/self-expanding/);
    const across = gradeDevice(CFA, "covered-se", "main", ACROSS_BIF, READY);
    expect(across).toMatchObject({ correct: false, profundaLost: true });
    // surgery for an external iliac hole is not first line
    expect(gradeDevice(EIA, "surgery", "main", OVER, READY).correct).toBe(false);
  });

  it("the sheath size and the 5 mm minimum are checked: a stent through a 6 Fr sheath or into a small branch is refused", () => {
    const small = gradeDevice(EIA, "covered-be", "main", OVER, { ...READY, sheathFr: 6 });
    expect(small).toMatchObject({ effect: "refused", refusedBy: "sheath", correct: false });
    expect(ENDO_SOURCED.coveredStentSheathFr).toBe(7);
    const tiny = gradeDevice({ ...EIA, vesselMm: 4.5 }, "covered-se", "main", OVER, READY);
    expect(tiny).toMatchObject({ effect: "refused", refusedBy: "diameter" });
    expect(gradeDevice(IEA, "covered-se", "branch", AT_IEA, READY)).toMatchObject({ effect: "refused", refusedBy: "diameter" });
    expect(ENDO_SOURCED.coveredStentMinMm).toBe(5);
  });

  it("a small branch: coils only after the retrograde check, in the bleeding branch; a covered stent over its mouth; sealant for a distal hole", () => {
    expect(gradeDevice(IEA, "coils", "branch", AT_IEA, { ...READY, retrogradeChecked: false })).toMatchObject({ correct: false, effect: "seals" });
    expect(gradeDevice(IEA, "coils", "branch", AT_IEA, READY)).toMatchObject({ correct: true, effect: "seals" });
    expect(gradeDevice(IEA, "coils", "branch", { ...AT_IEA, branchHere: "lcia" }, READY)).toMatchObject({ correct: false, effect: "none" });
    expect(gradeDevice({ ...IEA, retrograde: true }, "coils", "branch", AT_IEA, READY)).toMatchObject({ correct: false, effect: "none" });
    expect(gradeDevice(IEA, "covered-se", "main", { ...OVER, branchHere: "iea" }, READY)).toMatchObject({ correct: true, effect: "seals" });
    expect(gradeDevice(IEA, "sealant", "branch", AT_IEA, READY).correct).toBe(false);
    expect(gradeDevice(DISTAL, "coils", "branch", AT_IEA, READY)).toMatchObject({ effect: "refused", refusedBy: "reach" });
    expect(gradeDevice(DISTAL, "sealant", "branch", AT_IEA, READY)).toMatchObject({ correct: true, effect: "seals" });
  });

  it("the angiogram shows extravasation until the hole is sealed, and a flap or a cut-off for the leg causes", () => {
    expect(angioTruth({ injury: EIA, sealed: false, leg: null, legTreated: false })).toBe("extravasation-large");
    expect(angioTruth({ injury: IEA, sealed: false, leg: null, legTreated: false })).toBe("extravasation-branch");
    expect(angioTruth({ injury: EIA, sealed: true, leg: null, legTreated: false })).toBe("normal");
    expect(angioTruth({ injury: null, sealed: false, leg: "iliac-dissection", legTreated: false })).toBe("flap");
    expect(angioTruth({ injury: null, sealed: false, leg: "plug", legTreated: false })).toBe("cut-off");
    expect(angioTruth({ injury: null, sealed: false, leg: "cholesterol", legTreated: false })).toBe("normal");
  });
});

describe("the cold leg by cause", () => {
  it("the six Ps with lost pulses against livedo with intact pulses", () => {
    const ali = legFindings({ cause: "iliac-dissection", occludedAt: legOcclusionLevel("iliac-dissection") });
    expect(ali).toMatchObject({ pain: true, pallor: true, cold: true, paraesthesia: true, livedo: false, pleth: "flat" });
    expect(ali.pulses.pedal).toBe("absent");
    const chol = legFindings({ cause: "cholesterol", occludedAt: null });
    expect(chol).toMatchObject({ pain: true, livedo: true, pallor: false, pleth: "normal" });
    expect(chol.pulses).toEqual({ femoral: "present", popliteal: "present", pedal: "present" });
    // the findings are signs only: nothing names the cause
    for (const f of [ali, chol]) expect(f.text).not.toMatch(/dissect|cholesterol|embol|plug|ischaemi/i);
    expect(gradeLegCall("cholesterol", "ali").correct).toBe(false);
    expect(gradeLegCall("embolus", "ali").correct).toBe(true);
  });

  it("emergency angiography is wrong for cholesterol embolisation and right for acute limb ischaemia", () => {
    expect(gradeLegAngio("cholesterol").correct).toBe(false);
    for (const c of ["iliac-dissection", "cfa-dissection", "plug", "embolus"] as const) expect(gradeLegAngio(c).correct, c).toBe(true);
  });

  it("treatment by cause: the iliac flap stented over a true-lumen wire, the femoral flap and the plug to surgery, thrombus retrieved", () => {
    const ok = { trueLumen: true, imaged: true };
    expect(gradeLegTreatment("iliac-dissection", "se-stent", ok)).toMatchObject({ correct: true, effect: "restores" });
    expect(gradeLegTreatment("iliac-dissection", "se-stent", { ...ok, trueLumen: false }).effect).toBe("refused");
    expect(gradeLegTreatment("cfa-dissection", "se-stent", ok).correct).toBe(false);
    expect(gradeLegTreatment("cfa-dissection", "surgery", ok).correct).toBe(true);
    expect(gradeLegTreatment("plug", "surgery", ok).correct).toBe(true);
    expect(gradeLegTreatment("plug", "thrombectomy", ok).correct).toBe(false);
    for (const t of ["thrombectomy", "thrombolysis", "angioplasty"] as const) expect(gradeLegTreatment("embolus", t, ok).correct, t).toBe(true);
    expect(gradeLegTreatment("cholesterol", "supportive", ok).correct).toBe(true);
    expect(gradeLegTreatment("cholesterol", "thrombolysis", ok).correct).toBe(false);
    // the leg is imaged before anything but surgery
    expect(gradeLegTreatment("embolus", "thrombectomy", { ...ok, imaged: false }).effect).toBe("refused");
  });

  it("the live hazards: an injection against a damped trace dissects more often without a wire, never against a clean trace", () => {
    expect(injectionDissectionP({ waveform: "arterial", wireIn: false })).toBe(0);
    expect(injectionDissectionP({ waveform: null, wireIn: false })).toBe(0);
    expect(injectionDissectionP({ waveform: "damped", wireIn: false })).toBeGreaterThan(injectionDissectionP({ waveform: "damped", wireIn: true }));
    expect(forcedWireDissectionP("hydrophilic")).toBeGreaterThan(forcedWireDissectionP("j"));
    expect(MP_ENDO.clotEmbolusP).toBeGreaterThan(0);
  });
});

describe("the crossover route over the aortic bifurcation", () => {
  const caseData = generateCase("endo-route", { access: "femoral" }, "rand");
  const model = buildAnatomy(caseData);
  const right = buildRoute3D("femoral", caseData, model, 0, "right");
  const left = buildRoute3D("femoral", caseData, model, 0, "left");
  const site = buildAccessSite("femoral", generatePatient("endo-route"), { ligamentX: 66, headX: 30, bifurcationX: -4 });
  const cr = buildCrossoverRoute3D(left, right, { ligamentX: 66, bifurcationX: -4 });
  const route = buildCrossoverRoute(cr);

  it("runs from the left groin over the bifurcation down the right limb, through the right route's own centre line", () => {
    expect(cr.side).toBe("left");
    expect(cr.targetSide).toBe("right");
    expect(cr.bifurcationS).toBeGreaterThan(40);
    expect(cr.targetTipS).toBeGreaterThan(cr.bifurcationS);
    const ids = cr.segments.map((sg) => sg.id);
    expect(ids).toEqual(["femoral", "iliac", "aortic-bif", "iliac", "femoral", "cfa", "sfa"]);
    // a target-groin site point lies on the crossover's centre line
    for (const x of [110, 66, 16, -40]) {
      const c = tubeAt(site.tubes.find((t) => t.id === site.arteryId)!, x);
      const a = siteToAortic(right, site, { x, y: c.y, z: c.z });
      const b = pointAt(cr.path, crossoverSAtSiteX(cr, x)).p;
      expect(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z), `site x ${x}`).toBeLessThan(1.5);
    }
    // the right route's start (its sheath tip) is the crossover's targetTipS
    expect(crossoverSAtSiteX(cr, MP_LIMB.sheathTipSiteX)).toBeCloseTo(cr.targetTipS, 5);
    expect(() => buildCrossoverRoute3D(right, right)).toThrow();
  });

  function drive(hooked: boolean, aim: boolean): WireState {
    let w = initialWire();
    let cath = 0;
    const j = route.junction!;
    for (let i = 0; i < 4000 && w.pos < j.atS - 4; i++) {
      w = stepWire(w, route, { advance: 1, torque: 0, breath: false, hydrophilic: false, hooked: false }, 0.033);
      if (cath < j.atS - 40) cath = stepCatheter({ pos: cath, resistance: 0, message: "" }, w, route, 1, 2, 8).pos;
    }
    if (hooked) for (let i = 0; i < 200; i++) cath = stepCatheter({ pos: cath, resistance: 0, message: "" }, w, route, 1, 2, 8).pos;
    const isHooked = cath >= j.atS - MP_ENDO.hookMm;
    expect(isHooked).toBe(hooked);
    if (aim) for (let i = 0; i < 600; i++) w = stepWire(w, route, { advance: 0, torque: Math.sign(j.targetHeading - w.cmdHeading) * Math.min(0.03, Math.abs(j.targetHeading - w.cmdHeading)), breath: false, hydrophilic: false, hooked: isHooked }, 0.033);
    for (let i = 0; i < 200; i++) w = stepWire(w, route, { advance: 1, torque: 0, breath: false, hydrophilic: false, hooked: isHooked }, 0.033);
    return w;
  }

  it("a wire passes over the bifurcation only aimed from the hooked catheter; otherwise it runs up the aorta", () => {
    const over = drive(true, true);
    expect(over.branch).toBe("main");
    expect(over.pos).toBeGreaterThan(cr.bifurcationS + 20);
    // aimed but without the shaped catheter on the bifurcation: up the aorta
    expect(drive(false, true).branch).toBe("wrong");
    // the catheter hooked but the tip not turned: up the aorta
    expect(drive(true, false).branch).toBe("wrong");
    // the far end is the leg: no aorta, root or valve events
    let w = over;
    const evs: string[] = [];
    for (let i = 0; i < 4000; i++) {
      const r = stepWire(w, route, { advance: 1, torque: 0, breath: false, hydrophilic: false, hooked: true }, 0.033);
      evs.push(...r.events.map((e) => e.kind));
      w = r;
    }
    expect(w.pos).toBeLessThanOrEqual(route.totalLength + 1e-6);
    expect(evs).not.toContain("root");
    expect(evs).not.toContain("aorta");
  });

  it("the crossover angiogram fills the target limb, stops at a balloon and draws the blush only when passed", () => {
    const from = cr.bifurcationS + 15;
    const full = crossoverAngioTubes(cr, model, site, { fromS: from, strength: 1, mgPerMl: 150 });
    const stopped = crossoverAngioTubes(cr, model, site, { fromS: from, strength: 1, mgPerMl: 150, stopS: from + 30 });
    expect(full.length).toBeGreaterThan(stopped.length);
    const p = pointAt(cr.path, crossoverSAtSiteX(cr, 110));
    const leak = crossoverAngioTubes(cr, model, site, { fromS: from, strength: 1, mgPerMl: 150, extravasation: { p: p.p, t: p.t } });
    expect(leak.length).toBeGreaterThan(full.length);
    // the profunda lost: one branch fewer at the femoral bifurcation
    expect(crossoverAngioTubes(cr, model, site, { fromS: from, strength: 1, mgPerMl: 150, profundaLost: true }).length).toBeLessThan(full.length);
    expect(crossoverAngioTubes(cr, model, site, { fromS: from, strength: 0, mgPerMl: 150 })).toEqual([]);
  });
});
