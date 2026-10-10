// pci-adhoc-handover: the PCI scenario built from the full case's own case (scenarioFromCase). The target is the
// lesion the study report chose, with its position and severity; every other lesion of the case comes along as a
// bystander; the anatomy is the case's (its identity seeds the same coronary tree as the diagnostic lab grew); the
// patient, contrast and table come from the hand-over. pciLabReport turns the lab's state into the LabReport.
//   npx vitest run src/simulation/pci/scenarios/fromCase.test.ts
import { describe, expect, it } from "vitest";
import type { AnatomyCase, Lesion } from "../../../types";
import { generateCase } from "../../caseGenerator";
import { buildAnatomy } from "../../anatomy";
import { buildCoronaryTree, type CoronaryTree } from "../../../render/xray/coronaryTree";
import { caseWithPatient, generatePatient, segmentMap } from "../../patient/patient";
import { lesionIdOf, type PciTarget } from "../../session/handover";
import { pciTargetProblem } from "../../../mentor/report";
import { scenarioCase } from "../actions/scenario";
import { pciGeom } from "../geometry";
import { initialPci } from "../state";
import { defProblems, targetIndex } from "./registry";
import {
  MP_FROM_CASE,
  PCI_FINISH_FLAGS,
  actAtTarget,
  caseAnatomyOf,
  culpritLesionIndex,
  finalTimiOf,
  pciLabReport,
  resolvedFromCase,
  vesselTreated,
  scenarioFromCase,
  sideOfVessel,
  targetCheckText,
  targetLesionIndex,
  vesselName,
  withPlaceableLesions,
} from "./fromCase";

const LAD: Lesion = { vessel: "LAD", position: 0.36, severity: 50, kind: "moderate-stenosis", lengthMm: 10 };
const RCA: Lesion = { vessel: "RCA", position: 0.47, severity: 90, kind: "severe-stenosis", lengthMm: 14 };

/** A generated case with a 50% LAD and a 90% mid-RCA lesion (the acceptance case). */
function twoLesionCase(): { c: AnatomyCase; profile: ReturnType<typeof generatePatient> } {
  const profile = generatePatient("fromcase-two-lesions", { indication: "SA" });
  const base = generateCase("proc-fromcase-two-lesions", { access: "radial-right", focus: "right" }, "rand");
  const c: AnatomyCase = { ...base, dominance: profile.dominance, rootSize: profile.rootSize, lesions: [{ ...LAD }, { ...RCA }], accessRoute: "radial-right" };
  return { c, profile };
}

const rcaTarget = (l: Lesion = RCA): PciTarget => ({ vessel: "RCA", segment: "Mid RCA", qcaPct: 87, lengthMm: 15, lesionId: lesionIdOf(l), strategy: "adhoc" });

/** A tree's geometry, rounded: vessel names, path lengths, radii and sample positions. */
const shape = (t: CoronaryTree) =>
  t.vessels.map((v) => ({
    name: v.name,
    lesionId: v.lesionId,
    pathMm: v.pathMm.map((x) => Math.round(x * 1000) / 1000),
    radii: v.radii.map((x) => Math.round(x * 10000) / 10000),
    at: v.samples.map((s) => [s.ell, s.phi, s.h, s.w].map((k) => Math.round(k * 1000) / 1000)),
  }));

describe("scenarioFromCase (pci-adhoc-handover)", () => {
  it("a case with a 90% mid-RCA and a 50% LAD lesion, target RCA: the target is the RCA lesion with the same position and severity, and the tree is the diagnostic tree", () => {
    const { c, profile } = twoLesionCase();
    const target = rcaTarget();
    expect(pciTargetProblem(target)).toBeNull();
    const def = scenarioFromCase(c, target, profile, { contrastMl: 60, contrastBudgetMl: 180, catheterId: "JL4", heparinised: true });
    expect(defProblems(def)).toEqual([]);
    const t = def.lesions[targetIndex(def)];
    expect(t).toMatchObject({ vessel: "RCA", position: RCA.position, severity: RCA.severity, kind: RCA.kind, lengthMm: RCA.lengthMm, role: "target" });
    expect(def.side).toBe("right");
    // the other lesion comes along as a bystander, unchanged
    expect(def.lesions).toHaveLength(2);
    expect(def.lesions.find((l) => l.vessel === "LAD")).toMatchObject({ position: LAD.position, severity: LAD.severity, role: "bystander" });
    expect(def.targetCheck).toMatchObject({ lesionId: lesionIdOf(RCA), match: "lesion", culpritId: null, isCulprit: null });
    // the same anatomy: dominance, root, variants, and the case's identity
    expect(def.anatomy).toMatchObject({ dominance: c.dominance, rootSize: c.rootSize, variants: c.variants });
    expect(def.caseIdentity).toEqual({ id: c.id, name: c.name, rootRotationDeg: c.rootRotationDeg, aortaTiltDeg: c.aortaTiltDeg });
    // the tree the definition describes is the diagnostic lab's tree
    const diagTree = buildCoronaryTree(buildAnatomy(c), c);
    const ac = caseAnatomyOf(def, c.accessRoute);
    const pciTree = buildCoronaryTree(buildAnatomy(ac), ac);
    expect(shape(pciTree)).toEqual(shape(diagTree));
    expect(pciTree.lesionSites).toEqual(diagTree.lesionSites);
    // the PCI geometry finds the target on the RCA of that tree
    const resolved = resolvedFromCase(def);
    const ref = buildCoronaryTree(buildAnatomy(ac), { ...ac, lesions: [] });
    const g = pciGeom(resolved.scenario, pciTree, ref);
    expect(g.lesion.vessel).toBe("RCA");
    expect(g.lesions).toHaveLength(2);
    // the patient, the contrast, the table
    expect(def.patient).toMatchObject({ weightKg: profile.weightKg, eGfr: profile.renal.egfr, priorContrastMl: 60, accessRoute: "radial-right" });
    expect(def.contrast).toEqual({ usedMl: 60, budgetMl: 180 });
    expect(def.catheterInRoot).toBe("JL4");
    expect(def.setup).toMatchObject({ guideDefault: "JR4", heparinised: true, guideInRoot: true, french: 6 });
    expect(def.starts[0]).toMatchObject({ id: "guide-in-root", phase: "guide", guideEngaged: false, title: "Diagnostic catheter in the aortic root" });
    // the catheter by its catalogue name; the exchange the lab does not model is not asked of the learner
    expect(def.brief).toMatch(/diagnostic catheter \(Judkins Left 4\) is still in the ascending aorta/);
    expect(def.brief).not.toMatch(/0\.035/);
    expect(def.brief).toMatch(/The study report chose the RCA \(Mid RCA\) lesion/);
    // the brief names the report's choice, never the severity the case holds
    expect(def.brief).not.toMatch(/90/);
  });

  it("the resolved scenario carries the target into the engine scenario and the lab's anatomy case keeps every lesion", () => {
    const { c, profile } = twoLesionCase();
    const def = scenarioFromCase(c, rcaTarget(), profile);
    const r = resolvedFromCase(def);
    expect(r.scenario.target).toMatchObject({ vessel: "RCA", position: RCA.position, severity: RCA.severity, lengthMm: RCA.lengthMm });
    expect((r.scenario as unknown as { caseIdentity: unknown }).caseIdentity).toEqual(def.caseIdentity);
    expect(r.targetIdx).toBe(1);
    expect(r.variant).toBeNull();
    expect(r.hidden).toEqual({});
    expect(r.seed).toBe(`${c.id}:pci`);
    // the lab's anatomy case (scenarioCase) has the same lesions, dominance, root and variants
    const lab = scenarioCase(r.scenario);
    expect(lab.lesions.map((l) => [l.vessel, l.position, l.severity])).toEqual(c.lesions.map((l) => [l.vessel, l.position, l.severity]));
    expect(lab).toMatchObject({ dominance: c.dominance, rootSize: c.rootSize, variants: c.variants });
    // the engine opens with the guide out of the coronary (phase 'guide')
    const st = initialPci(r.scenario, { guideEngaged: false, guide: def.setup.guideDefault, heparinised: true });
    expect(st.guide.engaged).toBe(false);
    expect(st.severity).toBe(90);
  });

  it("finds the target by its lesion id, else the most severe lesion on its vessel, else the most severe of the case", () => {
    const { c, profile } = twoLesionCase();
    expect(targetLesionIndex(c.lesions, rcaTarget())).toEqual({ idx: 1, match: "lesion" });
    expect(targetLesionIndex(c.lesions, { ...rcaTarget(), lesionId: "RCA@none" })).toEqual({ idx: 1, match: "vessel" });
    expect(targetLesionIndex(c.lesions, { ...rcaTarget(), vessel: "LCx", lesionId: "LCx@none" })).toEqual({ idx: 1, match: "fallback" });
    expect(targetLesionIndex(c.lesions, null)).toEqual({ idx: 1, match: "fallback" });
    // the LAD target opens the left side with the left guide of the core pack
    const lad = scenarioFromCase(c, { vessel: "LAD", segment: "Mid LAD", qcaPct: 50, lengthMm: 10, lesionId: lesionIdOf(LAD), strategy: "adhoc" }, profile);
    expect(lad.side).toBe("left");
    expect(lad.lesions[targetIndex(lad)]).toMatchObject({ vessel: "LAD", severity: 50 });
    expect(lad.setup.guideDefault).toBe("EBU3.5");
    expect(lad.setup.guidesAcceptable!.every((g) => !["JR4", "AR1", "AR2", "IKR", "WR", "HS"].includes(g))).toBe(true);
    expect(targetCheckText(lad)).toMatch(/LAD lesion/);
    expect(() => scenarioFromCase({ ...c, lesions: [] }, null, profile)).toThrow(/no lesion/);
  });

  it("a lesion without a length gets the model length; the side follows dominance for the PDA", () => {
    const { c, profile } = twoLesionCase();
    const def = scenarioFromCase({ ...c, lesions: [{ vessel: "RCA", position: 0.5, severity: 100, kind: "cto" }, { vessel: "LAD", position: 0.3, severity: 70, kind: "severe-stenosis" }] }, null, profile);
    expect(def.lesions.map((l) => l.lengthMm)).toEqual([MP_FROM_CASE.defaultLengthMm.occlusion, MP_FROM_CASE.defaultLengthMm.other]);
    expect(def.epa).toBe("pci-cto");
    expect(sideOfVessel("PDA", "right")).toBe("right");
    expect(sideOfVessel("PDA", "left")).toBe("left");
    expect(sideOfVessel("OM1", "right")).toBe("left");
  });

  it("an acute case names its culprit; a target elsewhere is treated and the check says it is not the culprit", () => {
    const profile = generatePatient("fromcase-stemi-1", { indication: "STEMI" });
    const base = generateCase("proc-fromcase-stemi-1", { access: "radial-right", focus: "right" }, "rand");
    const c = { ...caseWithPatient(base, profile), accessRoute: "radial-right" as const };
    expect(profile.culprit).not.toBeNull();
    const ci = culpritLesionIndex(c, profile);
    expect(ci).not.toBeNull();
    expect(c.lesions[ci!].vessel).toBe(segmentMap(profile.culprit!.segment, c.dominance).vessel);
    const culpritTarget: PciTarget = { vessel: c.lesions[ci!].vessel, segment: null, qcaPct: null, lengthMm: null, lesionId: lesionIdOf(c.lesions[ci!]), strategy: "adhoc" };
    const def = scenarioFromCase(c, culpritTarget, profile);
    expect(def.targetCheck.isCulprit).toBe(true);
    expect(def.events).toContain("stemi");
    expect(def.epa).toBe("pci-stemi");
    expect(def.lesions.filter((l) => l.role === "non-culprit")).toHaveLength(c.lesions.length - 1);
    const other = c.lesions.findIndex((_, i) => i !== ci);
    if (other >= 0) {
      const o = c.lesions[other];
      const d2 = scenarioFromCase(c, { vessel: o.vessel, segment: null, qcaPct: null, lengthMm: null, lesionId: lesionIdOf(o), strategy: "adhoc" }, profile);
      expect(d2.targetCheck).toMatchObject({ isCulprit: false, culpritId: lesionIdOf(c.lesions[ci!]) });
      expect(targetCheckText(d2)).toMatch(/not the culprit/);
      // the culprit by its vessel and segment, never by a raw lesion id
      expect(d2.targetCheck.culpritVessel).toBe(c.lesions[ci!].vessel);
      expect(d2.targetCheck.culpritSegment).toBe(profile.culprit!.segment);
      expect(targetCheckText(d2)).toContain(`the culprit was the ${vesselName(c.lesions[ci!].vessel)} lesion (${profile.culprit!.segment})`);
      expect(targetCheckText(d2)).not.toContain("@");
    }
    // a case whose lesions are not the profile's has no culprit to compare with
    expect(culpritLesionIndex({ ...c, lesions: [{ ...RCA }] }, profile)).toBeNull();
  });

  it("a target on a vessel the lab cannot place: the most severe placeable lesion is treated, marked 'unplaced', and the brief and debrief say so", () => {
    const { c, profile } = twoLesionCase();
    const target = rcaTarget();
    const free = scenarioFromCase(c, target, profile);
    const def = scenarioFromCase(c, target, profile, { placeable: (v) => v !== "RCA" });
    expect(def.lesions[targetIndex(def)]).toMatchObject({ vessel: "LAD", severity: LAD.severity, role: "target" });
    expect(def.targetCheck).toMatchObject({ lesionId: lesionIdOf(LAD), match: "unplaced" });
    expect(def.chosen).toMatchObject({ lesionId: target.lesionId, vessel: "RCA" });
    // the same id as without the restriction, so the PCI lab grows the same coronary tree
    expect(def.id).toBe(free.id);
    expect(def.brief).toMatch(/The study report chose the RCA \(Mid RCA\) lesion; this lab cannot place that vessel and treats the LAD lesion instead\./);
    expect(def.brief).not.toMatch(/The study report chose the LAD/);
    const text = targetCheckText(def);
    expect(text).toMatch(/^The report chose the RCA \(Mid RCA\) lesion, which this lab could not place; the lesion treated was the LAD lesion/);
    expect(text).not.toMatch(/named no lesion/);
    // no target handed over and none placeable on its vessel: still 'fallback'
    const none = scenarioFromCase(c, null, profile, { placeable: (v) => v !== "RCA" });
    expect(none.targetCheck.match).toBe("fallback");
    expect(none.brief).toMatch(/No target was handed over from the study report; this lab treats the LAD lesion\./);
    expect(targetCheckText(none)).toMatch(/^No target was handed over/);
    expect(() => scenarioFromCase(c, target, profile, { placeable: () => false })).toThrow(/no lesion the lab can place/);
  });

  it("drops only bystanders the lab's tree cannot place", () => {
    const { c, profile } = twoLesionCase();
    const def = scenarioFromCase(c, rcaTarget(), profile);
    const kept = withPlaceableLesions(def, (v) => v === "RCA");
    expect(kept.lesions.map((l) => l.vessel)).toEqual(["RCA"]);
    expect(kept.lesions[targetIndex(kept)].vessel).toBe("RCA");
    expect(withPlaceableLesions(def, () => true)).toBe(def);
  });

  it("pciLabReport: stents, final TIMI, complications with their events, residual, contrast, dose and the finish flags", () => {
    const { c, profile } = twoLesionCase();
    const def = scenarioFromCase(c, rcaTarget(), profile);
    const r = resolvedFromCase(def);
    const st0 = initialPci(r.scenario, { guideEngaged: true, guide: "JR4", heparinised: true });
    const st = {
      ...st0,
      severity: 8,
      stents: [{ vessel: "RCA" as const, fromMm: 40, toMm: 58, diameter: 3.4, atLesion: 3.3, route: ["RCA"], nominal: 3.5, labelLengthMm: 18, ringD: [], compressionMm: 0, covered: false }],
      cx: {
        ...st0.cx,
        list: [
          { id: "dissection-1", kind: "dissection" as const, stage: "treated" as const, t0: 100, tOvert: 104, tTreated: 130, route: ["RCA"], vessel: "RCA", atMm: 50, lengthMm: 6, severity: 0.4, grade: "B", cause: "balloon", data: {}, bailouts: [] },
          { id: "perforation-1", kind: "perforation" as const, stage: "prodrome" as const, t0: 200, tOvert: null, tTreated: null, route: ["RCA"], vessel: "RCA", atMm: 52, lengthMm: 2, severity: 0.2, grade: "I", cause: "wire", data: {}, bailouts: [] },
        ],
      },
    };
    const rep = pciLabReport({ st, target: { lesionId: lesionIdOf(RCA), vessel: "RCA", segment: "Mid RCA" }, contrastMl: 85, dose: { fluoroS: 600, karMGy: 5200, kapGyCm2: 80 }, durationS: 2400, finishEvents: ["high-radiation-dose", "plan-done" as never, "cto"] });
    expect(rep.lab).toBe("angio-pci");
    expect(rep.stents).toEqual([{ vessel: "RCA", segment: "Mid RCA", diameterMm: 3.5, lengthMm: 18, platform: expect.any(String), postDilated: false }]);
    expect(rep.finalTimi).toBe(3);
    // only a complication that became overt is reported; a treated dissection is minor and raises its event
    expect(rep.complications).toEqual([{ id: "dissection-1", label: expect.any(String), t: 104, severity: "minor", events: ["dissection"], resolved: true }]);
    expect(rep.residual).toEqual([{ vessel: "RCA", lesionId: lesionIdOf(RCA), pct: 8 }]);
    expect(rep).toMatchObject({ contrastMl: 85, dose: { fluoroS: 600, karMGy: 5200, kapGyCm2: 80 }, durationS: 2400 });
    // the finish flags: only the vocabulary's follow-up flags, with the complications' events
    expect(rep.events).toEqual(["high-radiation-dose", "cto", "dissection"]);
    expect(rep.events!.every((e) => PCI_FINISH_FLAGS.includes(e))).toBe(true);
    // the final TIMI from the engine state
    expect(finalTimiOf({ ...st, severity: 100 })).toBe(0);
    expect(finalTimiOf({ ...st, slowFlow: true })).toBe(2);
    expect(actAtTarget({ value: 260 }, 250)).toBe(true);
    expect(actAtTarget({ value: 240 }, 250)).toBe(false);
    expect(actAtTarget(null, 250)).toBe(false);
    // post-dilatation is recorded for the lab, not per stent: one stent takes it, several leave the field out
    const pd = { ...st, counters: { ...st.counters, postdilatedInStent: true } };
    const rep1 = pciLabReport({ st: pd, target: { lesionId: lesionIdOf(RCA), vessel: "RCA", segment: "Mid RCA" }, contrastMl: 0, dose: { fluoroS: 0, karMGy: 0, kapGyCm2: 0 }, durationS: 0, finishEvents: [] });
    expect(rep1.stents[0].postDilated).toBe(true);
    const two = { ...pd, stents: [pd.stents[0], { ...pd.stents[0], fromMm: 20, toMm: 38 }] };
    const rep2 = pciLabReport({ st: two, target: { lesionId: lesionIdOf(RCA), vessel: "RCA", segment: "Mid RCA" }, contrastMl: 0, dose: { fluoroS: 0, karMGy: 0, kapGyCm2: 0 }, durationS: 0, finishEvents: [] });
    expect(rep2.stents).toHaveLength(2);
    expect(rep2.stents.every((x) => !("postDilated" in x))).toBe(true);
  });
  it("pciLabReport: the residual lists every case lesion, and the final TIMI is null when no vessel was treated", () => {
    const LCX: Lesion = { vessel: "LCx", position: 0.4, severity: 91, kind: "severe-stenosis", lengthMm: 12 };
    const LAD86: Lesion = { ...LAD, severity: 86, kind: "severe-stenosis" };
    const { c: c2, profile } = twoLesionCase();
    const c: AnatomyCase = { ...c2, lesions: [{ ...LAD86 }, { ...RCA }, { ...LCX }] };
    const def = scenarioFromCase(c, rcaTarget(), profile);
    const r = resolvedFromCase(def);
    const st0 = initialPci(r.scenario, { guideEngaged: true, guide: "JR4", heparinised: true });
    const zero = { contrastMl: 0, dose: { fluoroS: 0, karMGy: 0, kapGyCm2: 0 }, durationS: 0, finishEvents: [] as const };
    const target = { lesionId: lesionIdOf(RCA), vessel: "RCA" as const, segment: "Mid RCA" as const };
    // nothing treated (wire or no wire, no balloon, no stent): no final TIMI, and the untreated lesions are all residual
    expect(vesselTreated(st0)).toBe(false);
    const none = pciLabReport({ st: st0, target, lesions: c.lesions, ...zero });
    expect(none.finalTimi).toBeNull();
    expect(none.residual).toEqual([
      { vessel: "LAD", lesionId: lesionIdOf(LAD86), pct: 86 },
      { vessel: "RCA", lesionId: lesionIdOf(RCA), pct: Math.round(st0.severity) },
      { vessel: "LCx", lesionId: lesionIdOf(LCX), pct: 91 },
    ]);
    // the RCA stented: its TIMI is reported and its residual is the lab's, the LAD and LCx stay at their own severity
    const stented = { ...st0, severity: 5, stents: [{ vessel: "RCA" as const, fromMm: 40, toMm: 58, diameter: 3.4, atLesion: 3.3, route: ["RCA"], nominal: 3.5, labelLengthMm: 18, ringD: [], compressionMm: 0, covered: false }] };
    expect(vesselTreated(stented)).toBe(true);
    const done = pciLabReport({ st: stented, target, lesions: c.lesions, ...zero });
    expect(done.finalTimi).toBe(3);
    expect(done.residual.map((x) => [x.vessel, x.pct])).toEqual([["LAD", 86], ["RCA", 5], ["LCx", 91]]);
    // a balloon inflated without a stent counts as treated; a stent that came restenosed with the case does not
    expect(vesselTreated({ ...st0, predilated: true })).toBe(true);
    expect(vesselTreated({ ...st0, stents: [{ ...stented.stents[0], restenosed: true }] })).toBe(false);
    // without the case's lesions the target alone is reported
    expect(pciLabReport({ st: stented, target, ...zero }).residual).toEqual([{ vessel: "RCA", lesionId: lesionIdOf(RCA), pct: 5 }]);
  });
});
