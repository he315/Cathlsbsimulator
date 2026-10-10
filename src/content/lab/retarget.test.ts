// found-tip-retarget: the trigger edits that narrow lesson tips to their lab, procedure, route and
// scenario, checked against the contexts the labs report. The superset guard keeps every caution and
// bailout tip in the complication contexts the PCI lab reports today; tip-retarget-catchup and
// content-links-backfill-p2 re-run it before applying the deferred edits in raisable/waiting.ts.
//   npx vitest run src/content/lab/retarget.test.ts
import { describe, expect, it } from "vitest";
import { LAB_PHASES, LAB_TIPS, TIP_BY_ID, tipsFor, type LabContext, type LabEvent, type LabTip, type TipVessel } from "./tips";

const ids = (ctx: LabContext, limit = 100) => tipsFor(ctx, limit).map((t) => t.id);
const warnings = (tips: LabTip[]) => tips.filter((t) => t.tone !== "do").map((t) => t.id);

// ---------------------------------------------------------------------------
// Superset guard
// ---------------------------------------------------------------------------

/**
 * The complication contexts src/ui/lab/pciTips.ts reports in the lad-focal (LAD) and rca-calcified
 * (RCA) scenarios of src/simulation/angioPci.ts: phase 'complication' with the events it raises for
 * each overt complication (no-reflow also raises slow-flow).
 */
const GUARD_SCENARIOS: Record<string, TipVessel> = { "lad-focal": "LAD", "rca-calcified": "RCA" };
const GUARD_EVENTS: Record<string, LabEvent[]> = {
  perforation: ["perforation"],
  dissection: ["dissection"],
  "no-reflow": ["no-reflow", "slow-flow"],
  thrombus: ["thrombus"],
  air: ["air"],
};

/** Caution and bailout tips tipsFor(ctx, 100) returned in each guard context before found-tip-retarget. */
const BEFORE: Record<string, string[]> = {
  "lad-focal:perforation": [
    "pci-arrest-tamponade-drain", "pci-cabg-perforation-act-now", "pci-calc-atherectomy-perforation", "pci-mon-pulsus-paradoxus",
    "pci-operator-help-early", "pci-perf-balloon-now", "pci-perf-check-other-side", "pci-perf-support-and-call",
    "pci-perforation-stop-iv-antiplatelet", "pci-protamine-only-after-equipment-out", "pci-safe-control-the-controllable",
    "pci-stage-after-complication",
  ],
  "lad-focal:dissection": [
    "pci-closure-name-cause", "pci-dissection-stop-selective", "pci-mon-keep-wire-in-crisis", "pci-ocx-imh-distal-first",
    "pci-operator-help-early", "pci-optimise-edge-dissection", "pci-safe-control-the-controllable", "pci-stage-after-complication",
  ],
  "lad-focal:no-reflow": [
    "pci-aspiration-no-return", "pci-calc-rota-slow-flow", "pci-embol-plaque-aspirate", "pci-gpi-cangrelor-bailout",
    "pci-interp-grade-flow", "pci-no-reflow-distal-vasodilator", "pci-noreflow-dissection-or-embolism", "pci-noreflow-hold-contrast",
    "pci-operator-help-early", "pci-principles-explain-unexpected", "pci-safe-control-the-controllable", "pci-stage-after-complication",
  ],
  "lad-focal:thrombus": [
    "pci-aspiration-no-return", "pci-embol-thrombus-three-steps", "pci-gpi-cangrelor-bailout", "pci-img-thrombus-sizing",
    "pci-operator-help-early", "pci-stage-after-complication", "pci-thrombus-check-act-first",
  ],
  "lad-focal:air": ["pci-air-find-source", "pci-air-first-moves", "pci-operator-help-early", "pci-stage-after-complication"],
  "rca-calcified:perforation": [
    "pci-arrest-tamponade-drain", "pci-cabg-perforation-act-now", "pci-calc-atherectomy-perforation", "pci-mon-pulsus-paradoxus",
    "pci-operator-help-early", "pci-perf-balloon-now", "pci-perf-check-other-side", "pci-perf-support-and-call",
    "pci-perforation-stop-iv-antiplatelet", "pci-protamine-only-after-equipment-out", "pci-safe-control-the-controllable",
    "pci-stage-after-complication",
  ],
  "rca-calcified:dissection": [
    "pci-closure-name-cause", "pci-cto-retro-aortocoronary-dissection", "pci-dissection-stop-selective", "pci-mon-keep-wire-in-crisis",
    "pci-ocx-imh-distal-first", "pci-operator-help-early", "pci-optimise-edge-dissection", "pci-ostial-aortocoronary-seal",
    "pci-safe-control-the-controllable", "pci-stage-after-complication",
  ],
  "rca-calcified:no-reflow": [
    "pci-aspiration-no-return", "pci-calc-rota-slow-flow", "pci-embol-plaque-aspirate", "pci-gpi-cangrelor-bailout",
    "pci-interp-grade-flow", "pci-no-reflow-distal-vasodilator", "pci-noreflow-dissection-or-embolism", "pci-noreflow-hold-contrast",
    "pci-operator-help-early", "pci-principles-explain-unexpected", "pci-safe-control-the-controllable", "pci-stage-after-complication",
  ],
  "rca-calcified:thrombus": [
    "pci-aspiration-no-return", "pci-embol-thrombus-three-steps", "pci-gpi-cangrelor-bailout", "pci-img-thrombus-sizing",
    "pci-operator-help-early", "pci-stage-after-complication", "pci-thrombus-check-act-first",
  ],
  "rca-calcified:air": ["pci-air-find-source", "pci-air-first-moves", "pci-operator-help-early", "pci-stage-after-complication"],
};

describe("superset guard", () => {
  for (const [scenario, vessel] of Object.entries(GUARD_SCENARIOS))
    for (const [cx, events] of Object.entries(GUARD_EVENTS)) {
      const key = `${scenario}:${cx}`;
      it(`${key}: no caution or bailout tip is lost`, () => {
        const now = new Set(warnings(tipsFor({ lab: "pci", phase: "complication", vessel, events }, 100)));
        expect(BEFORE[key].filter((id) => !now.has(id))).toEqual([]);
      });
    }
});

// ---------------------------------------------------------------------------
// PCI
// ---------------------------------------------------------------------------

/**
 * Tips that list total-occlusion for an occluded artery that is not a CTO target (acute occlusion, or
 * the physiology lab's donor presets). Today src/ui/lab/pciTips.ts raises total-occlusion only in CTO
 * scenarios; pci-tip-context will raise it only for acute occlusions, which is what these tips assume.
 */
const NOT_CTO_OCCLUSION = new Set(["pci-arrhythmia-reperfusion", "pci-interp-donor-ffr"]);

const PCI_PHASES = LAB_PHASES.pci;
/** Events the PCI lab raises in ordinary (not CTO, bifurcation or ostial) cases. */
const ORDINARY_EVENTS: LabEvent[][] = [[], ["wire-side-branch"], ["wire-not-crossing"], ["balloon-undilatable"], ["stent-underexpanded"], ["side-branch-compromise"], ...Object.values(GUARD_EVENTS)];
function ordinaryTips(vessel: TipVessel): Set<string> {
  const out = new Set<string>();
  for (const phase of PCI_PHASES) for (const events of ORDINARY_EVENTS) for (const id of ids({ lab: "pci", phase, vessel, events })) out.add(id);
  return out;
}

describe("PCI retargets", () => {
  it("no PCI tip gates a CTO on total-occlusion, which pci-tip-context will raise only for acute occlusions", () => {
    const pci = LAB_TIPS.filter((t) => t.lab === "pci");
    const lists = (t: LabTip) => !!(t.when.event?.includes("total-occlusion") || t.when.requires?.includes("total-occlusion"));
    expect(pci.filter((t) => lists(t) && t.when.requires?.includes("cto")).map((t) => t.id)).toEqual([]);
    expect(pci.filter((t) => lists(t) && !NOT_CTO_OCCLUSION.has(t.id)).map((t) => t.id)).toEqual([]);
    // every tip taught in a CTO lesson needs the CTO case
    const ctoLesson = pci.filter((t) => /^cp-cto-/.test(t.lessonId));
    expect(ctoLesson.length).toBeGreaterThan(30);
    expect(ctoLesson.filter((t) => !t.when.requires?.includes("cto")).map((t) => t.id)).toEqual(["pci-cto-retro-aortocoronary-dissection", "pci-cto-retro-microcatheter-entrapment"]);
  });

  it("CTO tips appear in a CTO case and not in an ordinary one", () => {
    const cto = ids({ lab: "pci", phase: "wire", vessel: "RCA", events: ["cto", "wire-not-crossing"] });
    expect(cto).toEqual(expect.arrayContaining(["pci-cto-antegrade-move-cap", "pci-cto-strategy-no-blind-cap", "pci-cto-antegrade-microcatheter"]));
    const ordinary = [...ordinaryTips("RCA"), ...ordinaryTips("LAD")];
    expect(ordinary.filter((id) => /^pci-cto-/.test(id))).toEqual(["pci-cto-retro-aortocoronary-dissection"]);
  });

  it("bifurcation, two-stent, ostial and lesion-subset tips stay out of ordinary cases", () => {
    const gated = /^pci-(bif|twostent|dkcrush|culotte|tstent|tap|revcrush|minicrush|vstent|ostial|branch|ocx-(scad|isr|instent|substrut|stent-failure|st-|small|large|long|stent-expansion))-/;
    const leaked = new Set<string>();
    for (const v of ["LAD", "RCA", "LCx", "LM"] as TipVessel[]) for (const id of ordinaryTips(v)) if (gated.test(id)) leaked.add(id);
    // the aorto-coronary staining bailout keeps its dissection trigger under the superset guard until pci-cx-recognition raises aortocoronary-dissection
    expect([...leaked].sort()).toEqual(["pci-ostial-aortocoronary-seal"]);
  });

  it("the gated tips appear in their own cases", () => {
    expect(ids({ lab: "pci", phase: "plan", events: ["bifurcation"] })).toEqual(expect.arrayContaining(["pci-bif-guide-size", "pci-bif-wire-both-branches", "pci-bif-mv-stent-size"]));
    expect(ids({ lab: "pci", phase: "optimise", events: ["bifurcation"] })).toContain("pci-bif-pot-size-position");
    expect(ids({ lab: "pci", phase: "optimise", events: ["bifurcation"] })).not.toContain("pci-bif-kissing-size");
    expect(ids({ lab: "pci", phase: "optimise", events: ["bifurcation", "side-branch-compromise"] })).toContain("pci-bif-kissing-size");
    expect(ids({ lab: "pci", phase: "lesion-prep", vessel: "RCA", events: ["aorto-ostial-lesion", "balloon-undilatable"] })).toEqual(
      expect.arrayContaining(["pci-ostial-undilatable", "pci-ostial-rota-coaxial", "pci-ostial-orbital-constrain", "pci-ostial-balloon-straddle"])
    );
    expect(ids({ lab: "pci", phase: "optimise", vessel: "LM", events: ["aorto-ostial-lesion", "stent-underexpanded"] })).toContain("pci-ostial-stent-underexpanded");
    expect(ids({ lab: "pci", phase: "stent", vessel: "LAD", events: ["branch-ostial-lesion"] })).toContain("pci-branch-tstent-marker");
    expect(ids({ lab: "pci", phase: "lesion-prep", events: ["calcified-lesion", "balloon-undilatable"] })).toEqual(
      expect.arrayContaining(["pci-calc-balloon-boost", "pci-calc-no-stent-until-expanded"])
    );
    expect(ids({ lab: "pci", phase: "lesion-prep", events: ["balloon-undilatable"] })).not.toContain("pci-calc-balloon-boost");
    expect(ids({ lab: "pci", phase: "plan", events: ["scad-suspected"] })).toEqual(expect.arrayContaining(["pci-ocx-scad-plan", "pci-img-scad-caution"]));
    expect(ids({ lab: "pci", phase: "wire", events: ["thrombus"] })).not.toContain("pci-ocx-st-wire-escalation");
    expect(ids({ lab: "pci", phase: "wire", events: ["thrombus", "stent-thrombosis"] })).toContain("pci-ocx-st-wire-escalation");
    expect(ids({ lab: "pci", phase: "plan", events: ["cto"] })).toContain("pci-img-ct-cap");
  });

  it("imaging 'ivus' returns no OCT-only tip, and the OCT tips appear with 'oct'", () => {
    const octOnly = new Set(LAB_TIPS.filter((t) => t.id.startsWith("pci-img-oct-") || (t.when.imaging?.length === 1 && t.when.imaging[0] === "oct")).map((t) => t.id));
    expect(octOnly.size).toBeGreaterThanOrEqual(7);
    for (const phase of PCI_PHASES) expect(ids({ lab: "pci", phase, imaging: "ivus" }).filter((id) => octOnly.has(id)), phase).toEqual([]);
    expect(ids({ lab: "pci", phase: "imaging" }).filter((id) => octOnly.has(id))).toEqual([]);
    expect(ids({ lab: "pci", phase: "imaging", imaging: "oct" })).toEqual(expect.arrayContaining(["pci-img-oct-marker", "pci-img-oct-purge-calibrate"]));
    expect(ids({ lab: "pci", phase: "imaging", imaging: "ivus" })).toEqual(expect.arrayContaining(["pci-img-ivus-clear-view", "pci-img-nitrate-first", "pci-img-cannot-cross"]));
  });

  it("with events ['perforation'] alone pci-perf-covered-one-guide is still returned (its retarget waits in waiting.ts)", () => {
    expect(ids({ lab: "pci", phase: "complication", events: ["perforation"] })).toContain("pci-perf-covered-one-guide");
    expect(ids({ lab: "pci", phase: "complication", vessel: "LAD", events: ["perforation"] })).toContain("pci-perf-covered-one-guide");
  });
});

// ---------------------------------------------------------------------------
// Haemodynamic, structural, mcs and bedside labs
// ---------------------------------------------------------------------------

describe("procedure and scenario gating in the other labs", () => {
  it("tipsFor({lab:'haemo',phase:'right-heart'}) contains no condition-specific tip; each appears in its own study", () => {
    for (const phase of LAB_PHASES.haemo) {
      const got = ids({ lab: "haemo", phase });
      expect(got.filter((id) => /^haemo-(pe|constriction|ps|tr|ts|hocm|as|ms)-/.test(id) || id === "haemo-pulmonary-angiography-protocol"), phase).toEqual([]);
    }
    expect(ids({ lab: "haemo", phase: "right-heart", events: ["pulmonary-embolism"] })).toContain("haemo-pe-pa-pressure-limit");
    expect(ids({ lab: "haemo", phase: "right-heart", events: ["tricuspid-stenosis"] })).toContain("haemo-ts-two-matched-catheters");
    expect(ids({ lab: "haemo", phase: "left-heart", events: ["restriction"] })).toContain("haemo-constriction-simultaneous-lv-rv");
    expect(ids({ lab: "haemo", phase: "valves", events: ["aortic-stenosis"] })).toEqual(expect.arrayContaining(["haemo-as-simultaneous-gradient", "haemo-hocm-pullback-second-catheter"]));
    expect(ids({ lab: "haemo", phase: "valves", events: ["aortic-stenosis"] })).not.toContain("haemo-hocm-provoke-valsalva-gtn");
  });

  it("tipsFor({lab:'structural',phase:'plan',procedures:['laao']}) returns no TAVI or BAV tip", () => {
    for (const phase of LAB_PHASES.structural) {
      const laao = ids({ lab: "structural", phase, procedures: ["laao", "transseptal"] });
      expect(laao.filter((id) => /^structural-(tavi|tavr|bav)-/.test(id)), phase).toEqual([]);
    }
    expect(ids({ lab: "structural", phase: "plan", procedures: ["laao"] })).toContain("structural-laao-largest-measurement");
    expect(ids({ lab: "structural", phase: "plan", procedures: ["tavi"] })).not.toContain("structural-laao-largest-measurement");
    expect(ids({ lab: "structural", phase: "access", procedures: ["teer", "transseptal"] })).toContain("structural-ts-both-groins-low");
    expect(ids({ lab: "structural", phase: "plan" })).toEqual([]);
  });

  it("an mcs console shows its own device's tips", () => {
    const iabp = ids({ lab: "mcs", phase: "insert", procedures: ["iabp"] });
    expect(iabp.filter((id) => /^mcs-(impella|ecmo|ecpr)-/.test(id))).toEqual([]);
    expect(iabp).toContain("mcs-iabp-vacuum-valve");
    expect(ids({ lab: "mcs", phase: "insert", procedures: ["impella", "large-bore"] })).toEqual(expect.arrayContaining(["mcs-impella-cross-pigtail", "mcs-preclose-two-sutures"]));
    expect(ids({ lab: "mcs", phase: "select" })).toEqual([]);
  });

  it("no bed-peri-* tip is returned for procedures ['pacing']; each appears at its pericardiocentesis stage", () => {
    for (const phase of LAB_PHASES.bedside)
      expect(ids({ lab: "bedside", phase, procedures: ["pacing"], events: ["hypotension", "bradycardia", "perforation"] }).filter((id) => id.startsWith("bed-peri-")), phase).toEqual([]);
    expect(ids({ lab: "bedside", phase: "needle", procedures: ["pericardiocentesis"] })).toEqual(expect.arrayContaining(["bed-peri-set-up", "bed-peri-confirm-wire", "bed-peri-after-pci"]));
    expect(ids({ lab: "bedside", phase: "drain", procedures: ["pericardiocentesis"] })).toEqual(expect.arrayContaining(["bed-peri-after-pci", "bed-peri-drain-stays"]));
  });
});

// ---------------------------------------------------------------------------
// Access and diagnostic
// ---------------------------------------------------------------------------

describe("access routes", () => {
  it("{lab:'access',phase:'closure',route:'radial'} returns no femoral-route tip", () => {
    const events: LabEvent[][] = [[], ["bleeding"], ["haematoma"], ["hypotension"], ["bradycardia"], ["limb-ischaemia"], ["radial-spasm"]];
    for (const ev of events) {
      const got = tipsFor({ lab: "access", phase: "closure", route: "radial", events: ev }, 100);
      expect(got.filter((t) => t.when.route?.includes("femoral") || /femoral|groin/i.test(`${t.id} ${t.title}`)).map((t) => t.id), ev.join()).toEqual([]);
    }
    expect(ids({ lab: "access", phase: "closure", route: "femoral" })).toEqual(expect.arrayContaining(["access-femoral-sheath-act", "access-artery-vein-same-groin"]));
  });

  it("access-central-vein-no-blood appears only for jugular or subclavian with no-flashback", () => {
    const where = (route: LabContext["route"], events: LabEvent[]) => ids({ lab: "access", phase: "puncture", route, events }).includes("access-central-vein-no-blood");
    expect(where("jugular", ["no-flashback"])).toBe(true);
    expect(where("subclavian", ["no-flashback"])).toBe(true);
    expect(where("jugular", [])).toBe(false);
    expect(where("femoral", ["no-flashback"])).toBe(false);
    expect(where("radial", ["no-flashback"])).toBe(false);
    expect(ids({ lab: "access", phase: "femoral", route: "femoral", events: ["venous-flashback"] })).toContain("access-femoral-vein-redirect");
    expect(ids({ lab: "access", phase: "femoral", route: "femoral" })).not.toContain("access-femoral-vein-redirect");
  });
});

describe("diagnostic", () => {
  it("narrows the ad hoc consent and post-arrest tips", () => {
    expect(ids({ lab: "diagnostic", phase: "setup" })).toContain("diag-planning-ad-hoc-consent");
    expect(ids({ lab: "diagnostic", phase: "setup", events: ["st-elevation"] })).not.toContain("diag-ohca-ecg-sorts");
    expect(ids({ lab: "diagnostic", phase: "setup", events: ["st-elevation", "post-arrest"] })).toContain("diag-ohca-ecg-sorts");
    expect(ids({ lab: "diagnostic", phase: "setup" })).not.toContain("diag-ocx-scad-setup");
  });

  it("the borrowed PCI, access, haemodynamic and structural tips show in the diagnostic lab through alsoIn", () => {
    const borrowed = LAB_TIPS.filter((t) => t.alsoIn?.length);
    expect(borrowed.every((t) => t.lab !== "diagnostic" && t.alsoIn!.every((a) => a.lab === "diagnostic"))).toBe(true);
    expect(new Set(borrowed.map((t) => t.lab))).toEqual(new Set(["pci", "access", "haemo", "structural"]));
    expect(borrowed.length).toBe(30);
    expect(ids({ lab: "diagnostic", phase: "views" })).toEqual(expect.arrayContaining(["pci-interp-qca-calibrate", "pci-acq-target-orthogonal-views"]));
    expect(ids({ lab: "diagnostic", phase: "lv-aorta" })).toEqual(expect.arrayContaining(["haemo-lhc-u-loop", "haemo-lhc-stenotic-valve"]));
    expect(ids({ lab: "diagnostic", phase: "finish", events: ["perforation"] })).toContain("pci-safe-pause-after-major-event");
    expect(ids({ lab: "diagnostic", phase: "inject", events: ["vf"] })).toContain("pci-mon-vf-roles");
    // a borrowed femoral tip keeps its route
    expect(ids({ lab: "diagnostic", phase: "advance", route: "radial" })).not.toContain("access-root-femoral-no-waveform");
    expect(ids({ lab: "diagnostic", phase: "advance", route: "femoral" })).toContain("access-root-femoral-no-waveform");
    // the borrowed tips keep their own lab's triggers
    expect(TIP_BY_ID["pci-interp-qca-calibrate"].when.phase).toEqual(["plan"]);
  });
});
