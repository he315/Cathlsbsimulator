import { describe, it, expect } from "vitest";
import type { AccessRoute } from "../../types";
import { childbearingPotential, generatePatient } from "../patient/patient";
import { PDE5_WINDOW_H } from "../patient/pharmacology";
import { newCaseSession, type CaseSession } from "./caseSession";
import { aimedPose, prepare, fastForward } from "./autopilot";
import { SCENARIO_BY_ID, type ProcedureScenario } from "./scenarios/index";
import { scenarios as PLANNING_SCENARIOS } from "./scenarios/planning";
import { launch as planningLaunch } from "./scenarios/planning.launch";
import {
  actionFits,
  PLANTED_PROBLEMS,
  PLANTED_PROBLEM_IDS,
  PRE_PUNCTURE_CHECKLIST,
  brilakisDoacHoldDays,
  buildPlanningRecord,
  MP_PLANNING,
  problemsPresent,
  statedBy,
  type PlantedProblemId,
} from "./planning";
import { MP_OXYGEN_LPM, planningOf, problemsNow, type PlanningModule } from "./modules/planning";
import { MP_NEEDLE, priorPlugGeometry, renderBMode } from "../access/ultrasound";
import { residualAnticoagActRiseS } from "../patient/patient";
import { TIP_BY_ID } from "../../content/lab/tips";
import { TRACKS } from "../../content/index";
import { PRACTICE_INDEX, practiceForLesson } from "../../ui/content/practiceIndex";

// proc-chart-planted-problems: the pre-procedure record, its one planted problem, the actions on
// it, the consequences of a miss and Oxford's pre-puncture checklist.

const LESSON_IDS = new Set(TRACKS.flatMap((t) => t.modules.flatMap((m) => m.lessons.map((l) => l.id))));
const mod = (s: CaseSession): PlanningModule => planningOf(s)!;
const recordText = (m: PlanningModule) => m.state.record.items.flatMap((i) => i.lines).join("\n");

describe("the record: one planted problem per patient", () => {
  it("every generated patient in a fixed seed set has exactly one planted problem and the chart states it", () => {
    const seen = new Set<PlantedProblemId>();
    const accesses: AccessRoute[] = ["radial-right", "femoral", "radial-left"];
    let elective = 0;
    let acuteSite = 0;
    let acuteDnacpr = 0;
    for (let i = 0; i < 300; i++) {
      const seed = `pp-${i}`;
      const access = accesses[i % accesses.length];
      // half the set forced elective, so the elective rules are exercised whatever the indication mix
      const profile = generatePatient(seed, i % 2 ? { indication: "SA" } : {});
      const rec = buildPlanningRecord({ seed, profile, access });
      expect(rec.facts.setting, seed).toBe(profile.indication === "SA" ? "elective" : "acute");
      if (rec.facts.setting === "elective") elective++;
      expect(rec.planted, seed).not.toBeNull();
      expect(problemsPresent(rec.facts, access), seed).toEqual([rec.planted]);
      const item = rec.items.find((x) => x.id === PLANTED_PROBLEMS[rec.planted!].chartItem);
      expect(item, `${seed}: ${rec.planted}`).toBeDefined();
      expect(item!.lines.join(" "), `${seed}: ${rec.planted}`).toContain(statedBy(rec.planted!, rec.facts));
      seen.add(rec.planted!);
      // an acute patient who can carry none of the in-patient problems has the planned access's site
      // problem or, in the rest of the draws (MP_PLANNING.siteFallbackShare), an unsuspended DNACPR
      const inPatientNone =
        !(profile.pde5 && profile.pde5.hoursAgo < PDE5_WINDOW_H[profile.pde5.agent]) && profile.allergies.contrast === "none" && profile.ageY < MP_PLANNING.dnacprMinAgeY && !childbearingPotential(profile);
      if (rec.facts.setting === "acute" && inPatientNone && rec.planted === "dnacpr-unsuspended") acuteDnacpr++;
      else if (rec.facts.setting === "acute" && inPatientNone) {
        acuteSite++;
        expect(rec.planted, seed).toBe(access === "femoral" ? "closure-device-90d" : "dialysis-fistula");
        if (access === "femoral") expect(rec.facts.closureDevice?.side, seed).toBe("right");
        else expect(rec.facts.fistulaArm, seed).toBe(access === "radial-left" ? "left" : "right");
      }
      // the same seed gives the same record
      expect(buildPlanningRecord({ seed, profile, access })).toEqual(rec);
    }
    expect(elective).toBeGreaterThanOrEqual(150);
    expect(acuteSite).toBeGreaterThan(0);
    expect(acuteSite + acuteDnacpr).toBeGreaterThan(0);
    // the draw reaches most problems over the set (the rest need a scenario or a rare patient)
    expect(seen.size).toBeGreaterThanOrEqual(6);
  });

  it("an acute (STEMI) case is never planted doac-recent, bloods-old or surgery-planned, its record is an in-patient's, and hold and delay never fits", () => {
    const elective = new Set<PlantedProblemId>(["doac-recent", "bloods-old", "surgery-planned", "metformin-ckd"]);
    let doacInHold = 0;
    for (let i = 0; i < 200; i++) {
      const seed = `pp-stemi-${i}`;
      // every fourth one on a DOAC dosed inside its hold, the case the elective rules would postpone
      const base = generatePatient(seed, { indication: "STEMI" });
      const profile = i % 4 === 0 ? { ...base, anticoagulation: "doac" as const, doac: { agent: "rivaroxaban" as const, hoursSinceDose: 10, effect: 1 } } : base;
      const rec = buildPlanningRecord({ seed, profile, access: "radial-right" });
      expect(rec.facts.setting).toBe("acute");
      expect(rec.planted, seed).not.toBeNull();
      expect(elective.has(rec.planted!), `${seed}: ${rec.planted}`).toBe(false);
      if (rec.facts.doac && rec.facts.doac.hoursSinceDose < rec.facts.doac.brilakisHoldH) doacInHold++;
      expect(problemsPresent(rec.facts, "radial-right")).toEqual([rec.planted]);
      expect(actionFits(rec.planted, "hold-and-delay", rec.facts).correct, seed).toBe(false);
      const text = rec.items.flatMap((x) => x.lines).join(" ");
      expect(text).toContain("taken on admission today");
      expect(text).not.toMatch(/out-patient|pre-assessment/);
    }
    expect(doacInHold).toBeGreaterThanOrEqual(50);
  });

  it("a record with nothing planted (a caller's own) scores no chart problem, and postponing an acute case is wrong", () => {
    const { session: s } = newCaseSession({ seed: "pp-acute-0", access: "radial-right", indication: "STEMI" });
    const m = mod(s);
    // force the record empty: no generated record is
    m.state.record.planted = null;
    expect(actionFits(null, "proceed", m.state.record.facts).correct).toBe(true);
    const rec = m.actions.act("hold-and-delay");
    expect(rec?.correct).toBe(false);
    expect(s.decisions().some((d) => d.id === "planning-problem")).toBe(false);
    expect(s.decisions().find((d) => d.id === "planning-action-hold-and-delay")?.correct).toBe(false);
    s.dispose();
  });

  it("a fistula agrees with the kidneys: in use for haemodialysis at a dialysis-level eGFR, kept after a transplant otherwise", () => {
    const sc = newCaseSession({ scenario: "dialysis-fistula" }).session;
    expect(sc.profile.renal.egfr).toBeLessThan(MP_PLANNING.dialysisEgfr);
    expect(recordText(mod(sc))).toContain("On haemodialysis through a right forearm arteriovenous fistula.");
    const profile = generatePatient("pp-fistula-kidneys", { indication: "STEMI", ageY: 50, sex: "M" });
    const rec = buildPlanningRecord({ seed: "pp-fistula-kidneys", profile, access: "radial-left", force: "dialysis-fistula" });
    expect(profile.renal.egfr).toBeGreaterThanOrEqual(MP_PLANNING.dialysisEgfr);
    const text = rec.items.flatMap((i) => i.lines).join(" ");
    expect(text).toContain("Left forearm arteriovenous fistula");
    expect(text).toContain("kidney transplant");
    expect(text).not.toContain("On haemodialysis");
  });

  it("a random acute case's site problem: the chart's previous access agrees, and a case the team opened later has it on the other side", () => {
    let femoral = 0;
    let radial = 0;
    for (let i = 0; i < 80 && (femoral < 1 || radial < 1); i++) {
      for (const access of ["femoral", "radial-right"] as const) {
        const { session: s } = newCaseSession({ seed: `pp-site-${i}`, access, indication: "STEMI" });
        const m = mod(s);
        const planted = m.state.record.planted;
        if (planted !== "closure-device-90d" && planted !== "dialysis-fistula") {
          s.dispose();
          continue;
        }
        if (access === "femoral") femoral++;
        else radial++;
        const f = m.state.record.facts;
        expect(problemsNow(m, s.access)).toEqual([planted]);
        if (planted === "closure-device-90d") expect(s.chart.history.text).not.toMatch(/^No previous arterial access/);
        else expect(s.chart.history.text).not.toMatch(/right radial artery/);
        // the same patient opened past the chart: the team planned around it
        const late = newCaseSession({ seed: `pp-site-${i}`, access, indication: "STEMI", start: "access" }).session;
        const lm = mod(late);
        expect(lm.state.record.planted).toBe(planted);
        expect(problemsNow(lm, late.access)).toEqual([]);
        if (planted === "closure-device-90d") expect(lm.state.record.facts.closureDevice?.side).toBe(f.closureDevice!.side === "right" ? "left" : "right");
        else expect(lm.state.record.facts.fistulaArm).toBe(f.fistulaArm === "right" ? "left" : "right");
        expect(recordText(lm)).toContain(statedBy(planted, lm.state.record.facts));
        s.dispose();
        late.dispose();
      }
    }
    expect(femoral).toBeGreaterThan(0);
    expect(radial).toBeGreaterThan(0);
  });

  it("a random femoral STEMI with a closure device: the chart's previous access names the closure device and never a groin haematoma", () => {
    let plugs = 0;
    for (let i = 0; i < 200; i++) {
      const { session: s } = newCaseSession({ seed: `pp-plug-chart-${i}`, access: "femoral", indication: "STEMI" });
      const cd = mod(s).state.record.facts.closureDevice;
      if (cd) {
        plugs++;
        expect(s.chart.history.text, s.seed).toMatch(/closure device/);
        expect(s.chart.history.text, s.seed).not.toMatch(/haematoma/);
        expect(s.chart.history.text, s.seed).toContain(`${cd.side} femoral`);
      }
      s.dispose();
    }
    expect(plugs).toBeGreaterThan(0);
  });

  it("the acute fallback is spread: a patient eligible for no in-patient problem carries the site problem or an unsuspended DNACPR, both occur, and the site problem is the larger share", () => {
    const n = { site: 0, dnacpr: 0 };
    for (let i = 0; i < 600; i++) {
      const seed = `pp-fallback-${i}`;
      const profile = generatePatient(seed, { indication: "STEMI", ageY: 50, sex: "M" });
      if ((profile.pde5 && profile.pde5.hoursAgo < PDE5_WINDOW_H[profile.pde5.agent]) || profile.allergies.contrast !== "none") continue;
      const access: AccessRoute = i % 2 ? "femoral" : "radial-right";
      const rec = buildPlanningRecord({ seed, profile, access });
      expect(problemsPresent(rec.facts, access), seed).toEqual([rec.planted]);
      if (rec.planted === "dnacpr-unsuspended") n.dnacpr++;
      else {
        expect(rec.planted, seed).toBe(access === "femoral" ? "closure-device-90d" : "dialysis-fistula");
        n.site++;
      }
    }
    expect(n.dnacpr).toBeGreaterThan(0);
    expect(n.site).toBeGreaterThan(n.dnacpr);
    const share = n.site / (n.site + n.dnacpr);
    expect(Math.abs(share - MP_PLANNING.siteFallbackShare)).toBeLessThan(0.1);
  });

  it("an acute contrast reaction is premedicated with Brilakis's emergency hydrocortisone, without the hour's wait", () => {
    const sc = SCENARIO_BY_ID["contrast-allergy-unpremedicated"];
    const { session: s } = newCaseSession({ scenario: { ...sc, id: "acute-allergy", indication: "STEMI" } });
    const m = mod(s);
    expect(m.state.record.planted).toBe("contrast-allergy-unpremedicated");
    const t0 = s.tS;
    const rec = m.actions.act("premedicate");
    s.runPending();
    expect(rec?.correct).toBe(true);
    expect(s.orders.map((o) => o.id)).toEqual(["hydrocortisone"]);
    expect(s.tS - t0).toBeLessThan(600);
    expect(problemsNow(m, s.access)).toEqual([]);
    expect(s.decisions().find((x) => x.id === "planning-problem")?.expected).not.toMatch(/hold and delay/i);
  });

  it("a DOAC the patient's chart does not name is shown as a direct oral anticoagulant, with the agent the hold is computed for", () => {
    let checked = 0;
    for (let i = 0; i < 400 && checked < 3; i++) {
      const seed = `pp-doac-${i}`;
      const profile = generatePatient(seed);
      if (profile.anticoagulation !== "doac" || profile.doac) continue;
      checked++;
      const rec = buildPlanningRecord({ seed, profile, access: "radial-right" });
      expect(rec.facts.doac!.agentNamed).toBe(false);
      expect(rec.items.find((x) => x.id === "medications")!.lines.join(" ")).toContain(`Direct oral anticoagulant (${rec.facts.doac!.agent}): last dose`);
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("in a session the record reads the chart's own anticoagulant line, and still holds one problem", () => {
    for (let i = 0; i < 10; i++) {
      const { session: s } = newCaseSession({ seed: `pp-session-${i}`, access: i % 2 ? "femoral" : "radial-right" });
      const m = mod(s);
      const planted = m.state.record.planted;
      expect(problemsNow(m, s.access), s.seed).toEqual(planted ? [planted] : []);
      if (planted) expect(recordText(m)).toContain(statedBy(planted, m.state.record.facts));
      if (m.state.record.facts.doac) expect(s.chart.anticoag.text).toContain(`last dose ${m.state.record.facts.doac.hoursSinceDose} h ago`);
    }
  });

  it("each planning scenario plants its own problem and no other, and the chart states it", () => {
    for (const id of PLANTED_PROBLEM_IDS) {
      expect(SCENARIO_BY_ID[id], id).toBeDefined();
      const { session: s } = newCaseSession({ scenario: id });
      const m = mod(s);
      expect(m.state.record.planted, id).toBe(id);
      expect(problemsNow(m, s.access), id).toEqual([id]);
      expect(recordText(m), id).toContain(statedBy(id, m.state.record.facts));
      // the chart's 'Previous access' adds nothing on the planned route, and does not contradict the record
      expect(s.chart.history.text, id).not.toMatch(/weak .*pulse|bypass|radial artery/i);
      s.dispose();
    }
    const { session: plug } = newCaseSession({ scenario: "closure-device-90d" });
    expect(plug.chart.history.text).toMatch(/right femoral/i);
    const { session: fistula } = newCaseSession({ scenario: "dialysis-fistula" });
    expect(fistula.chart.history.text).toMatch(/right forearm arteriovenous fistula/);
  });

  it("Brilakis Table 1.2 as the lesson gives it", () => {
    expect(brilakisDoacHoldDays("apixaban", 30)).toBe(2);
    expect(brilakisDoacHoldDays("rivaroxaban", 49)).toBe(3);
    expect(brilakisDoacHoldDays("rivaroxaban", 50)).toBe(2);
    expect(brilakisDoacHoldDays("dabigatran", 85)).toBe(2);
    expect(brilakisDoacHoldDays("dabigatran", 60)).toBe(3);
    expect(brilakisDoacHoldDays("dabigatran", 42)).toBe(4); // the lesson's own check question
    expect(brilakisDoacHoldDays("dabigatran", 25)).toBe(5);
    expect(brilakisDoacHoldDays("dabigatran", 10)).toBeNull();
  });
});

describe("consequences come from the patient", () => {
  /** True aortic mean before nitroglycerin, and its lowest over the minute after each of two doses. */
  function gtnDrop(scenario: ProcedureScenario): number {
    const { session: s } = newCaseSession({ scenario, start: "sheath-in" });
    s.wait(20);
    s.runPending();
    const before = s.patient.vitals().aortaTrue.mean;
    let min = before;
    s.order("gtn");
    s.runPending();
    for (let i = 0; i < 12; i++) {
      s.wait(5);
      s.runPending();
      min = Math.min(min, s.patient.vitals().aortaTrue.mean);
    }
    s.dispose();
    return before - min;
  }

  it("'pde5-24h' with GTN drops true MAP more than the same dose without the flag", () => {
    const sc = SCENARIO_BY_ID["pde5-24h"];
    const control: ProcedureScenario = { ...sc, id: "pde5-control", profile: { ...sc.profile, pde5: undefined } };
    const withPde5 = gtnDrop(sc);
    const without = gtnDrop(control);
    expect(withPde5).toBeGreaterThan(without);
    expect(withPde5).toBeGreaterThan(2);
  });

  it("'doac-recent' with 'hold and delay' records a correct decision and ends the case", () => {
    const { session: s } = newCaseSession({ scenario: "doac-recent", mode: "guided" });
    const m = mod(s);
    expect(m.actions.readItem("medications")).toBe(true);
    s.runPending();
    const rec = m.actions.act("hold-and-delay");
    expect(rec?.correct).toBe(true);
    const d = s.decisions().find((x) => x.id === "planning-problem")!;
    expect(d.correct).toBe(true);
    expect(d.lessonId).toBe("pm-planning-preparation");
    expect(s.decisions().find((x) => x.id === "planning-action-hold-and-delay")?.correct).toBe(true);
    expect(m.state.postponed).not.toBeNull();
    // the case has ended: the needle is refused in every mode, and no further action is taken
    expect(s.placeNeedle(aimedPose(s))).toBe(false);
    // neutral wording: the attending does not endorse the decision, right or wrong
    expect(s.attending.some((a) => a.stop && a.text === "Understood: the case is stopped and rebooked. Nothing more is done today.")).toBe(true);
    expect(s.attending.some((a) => /agreed/i.test(a.text))).toBe(false);
    expect(m.actions.act("proceed")).toBeNull();
  });

  it("'doac-recent' missed: the time-out scores it and the debrief links pm-planning-assessment; the residual DOAC raises the ACT", () => {
    const { session: s } = newCaseSession({ scenario: "doac-recent" });
    const m = mod(s);
    prepare(s);
    expect(s.timeOutDone).toBe(true);
    const d = s.decisions().find((x) => x.id === "planning-problem")!;
    expect(d.correct).toBe(false);
    expect(d.lessonId).toBe("pm-planning-assessment");
    expect(m.state.missed).toBe(true);
    expect(m.state.actRiseS).toBeGreaterThan(0);
    // the same patient without the DOAC has the lower baseline ACT
    const sc = SCENARIO_BY_ID["doac-recent"];
    const { session: c } = newCaseSession({ scenario: { ...sc, id: "doac-control", profile: { ...sc.profile, anticoagulation: "none", doac: undefined } } });
    expect(s.profile.act.baseline - c.profile.act.baseline).toBe(m.state.actRiseS);
    expect(s.measureAct()!).toBeGreaterThan(c.measureAct()!);
  });

  it("a wrong action is scored against the planted problem, a right one after the time-out is late", () => {
    const { session: s } = newCaseSession({ scenario: "bloods-old" });
    const m = mod(s);
    m.actions.act("pregnancy-test");
    s.runPending();
    expect(s.decisions().find((x) => x.id === "planning-action-pregnancy-test")?.correct).toBe(false);
    prepare(s, { record: false });
    expect(s.decisions().find((x) => x.id === "planning-problem")?.correct).toBe(false);
    m.actions.act("repeat-bloods");
    s.runPending();
    const late = s.decisions().find((x) => x.id === "planning-action-repeat-bloods")!;
    expect(late.correct).toBe(true);
    expect(late.given).toContain("after the time-out");
    expect(problemsNow(m, s.access)).toEqual([]);
  });

  it("closure-device-90d: the plug groin punctured is scored, and no closure device is used in it", () => {
    const { session: s } = newCaseSession({ scenario: "closure-device-90d" });
    const m = mod(s);
    fastForward(s, "closure");
    expect(s.decisions().find((x) => x.id === "planning-plug-groin")?.correct).toBe(false);
    expect(m.state.plugSite).toBe("femoral:right");
    s.femoralDevice();
    expect(s.femoral).toBeNull();
    expect(s.attending.some((a) => a.stop && /collagen plug/.test(a.text))).toBe(true);
  });

  it("closure-device-90d opened past the chart: the team's puncture of the plug groin is not scored, but the closure device is still refused there", () => {
    const { session: s } = newCaseSession({ scenario: "closure-device-90d", start: "closure" });
    const m = mod(s);
    expect(m.state.planningByTeam).toBe(true);
    expect(s.decisions().some((x) => x.id === "planning-plug-groin")).toBe(false);
    // the team punctured the plug groin
    expect(`${s.activeSite.siteKind}:${s.activeSite.side}`).toBe("femoral:right");
    expect(m.state.plugSite).toBe("femoral:right");
    s.femoralDevice();
    expect(s.femoral).toBeNull();
    expect(s.attending.some((a) => a.stop && /collagen plug/.test(a.text))).toBe(true);
  });

  it("closure-device-90d: ultrasound of the right groin shows the plug, the left groin does not", () => {
    const { session: s } = newCaseSession({ scenario: "closure-device-90d" });
    const m = mod(s);
    expect(`${s.activeSite.siteKind}:${s.activeSite.side}`).toBe("femoral:right");
    const plug = m.actions.priorPlug();
    expect(plug).not.toBeNull();
    expect(plug!.vessel).toBe("cfa");
    expect(plug!.daysAgo).toBe(m.state.record.facts.closureDevice!.daysAgo);
    // drawn on the image: short axis over the old arteriotomy, with the plug and without
    const pm = s.pm;
    pm.probe.orient = "short";
    pm.probe.x = plug!.x;
    pm.probe.pressure = 0;
    const geom = priorPlugGeometry(s.site, plug!, pm.probe.pressure, pm.phase)!;
    expect(geom.plug.z).toBeLessThan(geom.anchor.z);
    const W = 160;
    const H = Math.round(W * (pm.probe.depthMm / MP_NEEDLE.footprintMm));
    const img = (p: typeof plug) => {
      const out = { width: W, height: H, data: new Uint8ClampedArray(W * H * 4) };
      renderBMode(pm, out, { frame: 1, priorPlug: p });
      return out.data;
    };
    const withPlug = img(plug);
    const without = img(null);
    // the pixel over the plug's centre is brighter with it; the image elsewhere is the same
    const px = (d: Uint8ClampedArray, yMm: number, zMm: number) => {
      const i = Math.round(((yMm - pm.probe.y) / MP_NEEDLE.footprintMm + 0.5) * W - 0.5);
      const j = Math.round((zMm / pm.probe.depthMm) * H - 0.5);
      return d[(j * W + i) * 4];
    };
    expect(px(withPlug, geom.plug.y, geom.plug.z)).toBeGreaterThan(px(without, geom.plug.y, geom.plug.z) + 30);
    let diff = 0;
    for (let k = 0; k < withPlug.length; k += 4) if (withPlug[k] !== without[k]) diff++;
    expect(diff).toBeGreaterThan(0);
    expect(diff).toBeLessThan((W * H) / 10);
    // a plug in the left groin is not seen in the right one; a radial site shows none
    m.state.record.facts.closureDevice!.side = "left";
    expect(m.actions.priorPlug()).toBeNull();
    m.state.record.facts.closureDevice!.side = "right";
    expect(s.setAccess("radial-right")).toBe(true);
    expect(m.actions.priorPlug()).toBeNull();
    expect(s.setAccess("femoral")).toBe(true);
    expect(m.actions.priorPlug()).not.toBeNull();
  });

  it("closure-device-90d: once the right groin is punctured, a left femoral site shows no plug and the right one still does", () => {
    const { session: s } = newCaseSession({ scenario: "closure-device-90d" });
    const m = mod(s);
    fastForward(s, "closure");
    expect(m.actions.priorPlug()).not.toBeNull();
    expect(s.addSite("femoral", "left")).not.toBeNull();
    expect(`${s.activeSite.siteKind}:${s.activeSite.side}`).toBe("femoral:left");
    expect(m.actions.priorPlug()).toBeNull();
    expect(s.setActiveSite("site-1")).toBe(true);
    expect(m.actions.priorPlug()).not.toBeNull();
  });

  it("other access chosen for the plug: a radial case is not scored against the groin", () => {
    const { session: s } = newCaseSession({ scenario: "closure-device-90d" });
    const m = mod(s);
    m.actions.act("other-access");
    expect(s.setAccess("radial-right")).toBe(true);
    fastForward(s, "sheath-in");
    expect(s.decisions().find((x) => x.id === "planning-problem")?.correct).toBe(true);
    expect(s.decisions().some((x) => x.id === "planning-plug-groin")).toBe(false);
  });

  it("contrast allergy: premedication gives Oxford's regimen an hour ahead, and the anti-allergic effect is on board", () => {
    const { session: s } = newCaseSession({ scenario: "contrast-allergy-unpremedicated" });
    const m = mod(s);
    const t0 = s.tS;
    m.actions.act("premedicate");
    s.runPending();
    expect(s.orders.map((o) => o.id)).toEqual(["hydrocortisone", "chlorphenamine"]);
    expect(s.tS - t0).toBeGreaterThanOrEqual(3600);
    expect(problemsNow(m, s.access)).toEqual([]);
    expect(s.decisions().find((x) => x.id === "planning-problem")?.correct).toBe(true);
  });
});

describe("consequence paths", () => {
  it("pde5-24h: nitroglycerin inside the window is scored", () => {
    // opened at the chart (a case opened later had its planning done by the team, and nothing is scored)
    const { session: s } = newCaseSession({ scenario: "pde5-24h" });
    fastForward(s, "sheath-in");
    s.wait(20);
    s.runPending();
    s.order("gtn");
    s.runPending();
    s.wait(10);
    s.runPending();
    const d = s.decisions().find((x) => x.id === "planning-nitrate");
    expect(d?.correct).toBe(false);
    expect(d?.lessonId).toBe("pm-planning-preparation");
  });

  it("dialysis-fistula: a puncture in the fistula arm is scored", () => {
    const { session: s } = newCaseSession({ scenario: "dialysis-fistula" });
    // the record left unread: the problem is missed
    prepare(s, { record: false });
    fastForward(s, "sheath-in");
    s.wait(10);
    s.runPending();
    expect(s.decisions().find((x) => x.id === "planning-fistula-arm")?.correct).toBe(false);
  });

  it("surgery-planned: handing over to PCI is scored against stent candidacy", () => {
    const { session: s } = newCaseSession({ scenario: "surgery-planned" });
    // the record left unread: the problem is missed
    prepare(s, { record: false });
    fastForward(s, "post-diagnostic");
    expect(s.handover("pci")).not.toBeNull();
    s.runPending();
    expect(s.decisions().find((x) => x.id === "planning-stent-candidacy")?.correct).toBe(false);
  });

  it("pregnancy-test: fluoroscopy before a test is scored", () => {
    const { session: s } = newCaseSession({ scenario: "pregnancy-test" });
    // the record left unread: the problem is missed
    prepare(s, { record: false });
    fastForward(s, "sheath-in");
    expect(s.decisions().some((x) => x.id === "planning-pregnancy-before-radiation")).toBe(false);
    // the fluoroscopy view sets the beam (as the UI does)
    s.beamOn = true;
    s.wait(10);
    s.runPending();
    expect(s.decisions().find((x) => x.id === "planning-pregnancy-before-radiation")?.correct).toBe(false);
  });

  it("warfarin-inr-unchecked: checking the INR gives today's value, and the residual warfarin raises the ACT", () => {
    const { session: s } = newCaseSession({ scenario: "warfarin-inr-unchecked" });
    const m = mod(s);
    expect(m.state.actRiseS).toBe(residualAnticoagActRiseS({ inr: m.state.record.facts.warfarin!.inrToday }));
    expect(m.state.actRiseS).toBeGreaterThan(0);
    const rec = m.actions.act("check-inr");
    s.runPending();
    expect(rec?.correct).toBe(true);
    expect(m.state.record.facts.warfarin!.inrAgeH).toBe(0);
    expect(rec?.result).toContain(`INR ${m.state.record.facts.warfarin!.inrToday}`);
    expect(problemsNow(m, s.access)).toEqual([]);
  });

  it("dnacpr-unsuspended: clarifying resuscitation status suspends the order and scores the problem found", () => {
    const { session: s } = newCaseSession({ scenario: "dnacpr-unsuspended" });
    const m = mod(s);
    const rec = m.actions.act("clarify-resuscitation");
    s.runPending();
    expect(rec?.correct).toBe(true);
    expect(m.state.record.facts.dnacpr.suspended).toBe(true);
    expect(s.decisions().find((x) => x.id === "planning-problem")?.correct).toBe(true);
    expect(recordText(m)).toContain("suspended for the procedure");
  });

  it("a warfarin patient whose INR is not the planted problem still has the residual warfarin in the ACT", () => {
    let checked = 0;
    for (let i = 0; i < 300 && checked < 2; i++) {
      const p = generatePatient(`pp-warf-${i}`);
      if (p.anticoagulation !== "warfarin") continue;
      const { session: s } = newCaseSession({ seed: `pp-warf-${i}`, access: "radial-right" });
      const m = mod(s);
      if (m.state.record.planted === "warfarin-inr-unchecked" || !m.state.record.facts.warfarin) {
        s.dispose();
        continue;
      }
      checked++;
      expect(m.state.actRiseS).toBe(residualAnticoagActRiseS({ inr: m.state.record.facts.warfarin.inrToday }));
      expect(m.state.actRiseS).toBeGreaterThan(0);
      s.dispose();
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe("the autopilot plays the record and the checklist", () => {
  it("each scenario's problem is acted on with its first answer that does not end the case, and the checklist is complete and backed", () => {
    const want: Partial<Record<PlantedProblemId, string>> = {
      "bloods-old": "repeat-bloods",
      "surgery-planned": "rethink-stenting",
      "contrast-allergy-unpremedicated": "premedicate",
      "warfarin-inr-unchecked": "check-inr",
      "dnacpr-unsuspended": "clarify-resuscitation",
      "pregnancy-test": "pregnancy-test",
      "metformin-ckd": "hold-metformin",
      "pde5-24h": "avoid-nitrate",
      "dialysis-fistula": "other-access",
    };
    for (const [id, action] of Object.entries(want)) {
      const { session: s } = newCaseSession({ scenario: id });
      const m = mod(s);
      prepare(s);
      expect(m.state.record.items.every((i) => m.state.reviewed[i.id] !== undefined), id).toBe(true);
      expect(m.state.found?.id, id).toBe(action);
      expect(s.decisions().find((d) => d.id === "planning-problem")?.correct, id).toBe(true);
      // the surgery and the PDE-5 inhibitor stay in the record: their answers change the plan, not the facts
      if (id !== "surgery-planned" && id !== "pde5-24h") expect(problemsNow(m, s.access), id).toEqual([]);
      expect(m.actions.checklistDone(), id).toBe(true);
      expect(m.state.checklistFalse, id).toEqual([]);
      s.dispose();
    }
  });

  it("a fistula in the planned arm moves the case to the other radial artery; a plug in the planned groin keeps the caller's femoral route and is scored", () => {
    const { session: r } = newCaseSession({ scenario: "dialysis-fistula" });
    fastForward(r, "sheath-in");
    expect(r.access).toBe("radial-left");
    expect(r.decisions().some((d) => d.id === "planning-fistula-arm")).toBe(false);
    expect(r.decisions().find((d) => d.id === "pre-puncture-checklist")?.correct).toBe(true);
    const { session: f } = newCaseSession({ scenario: "closure-device-90d" });
    fastForward(f, "sheath-in");
    expect(f.access).toBe("femoral");
    expect(f.decisions().find((d) => d.id === "planning-problem")?.correct).toBe(false);
    expect(f.decisions().find((d) => d.id === "planning-plug-groin")?.correct).toBe(false);
  });

  it("a DOAC inside both holds is not postponed by the autopilot; past Oxford's hold it proceeds", () => {
    const { session: s } = newCaseSession({ scenario: "doac-recent" });
    const m = mod(s);
    prepare(s);
    expect(m.state.postponed).toBeNull();
    expect(m.state.found).toBeNull();
    const sc = SCENARIO_BY_ID["doac-recent"];
    const past = newCaseSession({ scenario: { ...sc, profile: { ...sc.profile, doac: { agent: "rivaroxaban", hoursSinceDose: 30 } } } }).session;
    const pm = mod(past);
    expect(pm.state.record.planted).toBe("doac-recent");
    prepare(past);
    expect(pm.state.found?.id).toBe("proceed");
    expect(past.decisions().find((d) => d.id === "planning-problem")?.correct).toBe(true);
  });

  it("supervised mode: the autopilot's checklist lets the needle in; tablePrep false leaves the line and transducer as they were", () => {
    const { session: s } = newCaseSession({ seed: "pp-auto-sup", access: "radial-right", mode: "supervised" });
    prepare(s);
    expect(s.placeNeedle(aimedPose(s))).toBe(true);
    const { session: t } = newCaseSession({ seed: "pp-auto-sup", access: "radial-right" });
    prepare(t, { tablePrep: false });
    expect(t.ex.lineFlushed).toBe(false);
    expect(t.ex.zeroed).toBe(false);
    expect(mod(t).state.checklist.manifold).toBeUndefined();
    expect(mod(t).state.checklist.transducer).toBeUndefined();
  });
});

describe("Oxford's pre-puncture checklist", () => {
  it("placeNeedle in supervised mode is blocked while SpO2 is unconfirmed", () => {
    const { session: s } = newCaseSession({ scenario: "checklist", mode: "supervised" });
    const m = mod(s);
    expect(s.timeOutDone).toBe(true);
    expect(m.state.checklistByTeam).toBe(false);
    s.flushLine();
    s.runPending();
    s.zero();
    s.runPending();
    for (const c of PRE_PUNCTURE_CHECKLIST) if (c.id !== "spo2") expect(m.actions.confirmCheck(c.id)).toBe(true), s.runPending();
    expect(s.placeNeedle(aimedPose(s))).toBe(false);
    // item text keeps its own case mid-sentence
    expect(s.attending.some((a) => a.stop && /pulse oximetry: SpO2 above 96%/.test(a.text))).toBe(true);
    if (!m.actions.confirmCheck("spo2")) {
      // a patient at or below 96% on air: oxygen first, then the reading
      expect(m.actions.giveOxygen()).toBe(true);
      s.wait(120);
      s.runPending();
      expect(m.actions.confirmCheck("spo2")).toBe(true);
    }
    s.runPending();
    expect(m.actions.checklistDone()).toBe(true);
    expect(s.placeNeedle(aimedPose(s))).toBe(true);
  });

  it("guided mode does not block, and the first puncture scores the checklist; a confirmation without the table state is recorded", () => {
    const { session: s } = newCaseSession({ scenario: "checklist" });
    const m = mod(s);
    m.actions.confirmCheck("manifold");
    expect(m.state.checklistFalse).toEqual(["manifold"]);
    s.runPending();
    fastForward(s, "sheath-in");
    const d = s.decisions().find((x) => x.id === "pre-puncture-checklist")!;
    expect(d.correct).toBe(false);
    expect(d.lessonId).toBe("pm-to-the-root-table");
    expect(d.tipIds).toEqual(["diag-root-manifold-ready"]);
    // the debrief names the falsely confirmed item by its text, not its id
    expect(d.given.startsWith("Confirmed without it being so: manifold flushed and contrast run through without bubbles. ")).toBe(true);
    expect(d.given).toMatch(/Not confirmed: \d of 8 items, from intravenous line in place$/);
  });

  it("SpO2 at 96% or less on air is refused; a case opened past 'access' had its checklist done by the team", () => {
    const { session: s } = newCaseSession({ seed: "pp-late", access: "radial-right", start: "sheath-in", mode: "supervised" });
    const m = mod(s);
    expect(m.state.planningByTeam).toBe(true);
    expect(m.state.checklistByTeam).toBe(true);
    expect(s.decisions().some((d) => d.id.startsWith("planning-") || d.id === "pre-puncture-checklist")).toBe(false);
    // the refusal rule, on a patient port reading 95%
    const { session: t } = newCaseSession({ seed: "pp-spo2", access: "radial-right" });
    const real = t.patient.vitals.bind(t.patient);
    (t.patient as { vitals: typeof real }).vitals = () => ({ ...real(), spo2: 95 });
    expect(mod(t).actions.confirmCheck("spo2")).toBe(false);
    expect(mod(t).state.note).toMatch(/95% on air/);
  });

  it("oxygen: refused at 95% on air with 'Give oxygen first', the button starts the engine's oxygen, and a reading above 96% then confirms", () => {
    const { session: t } = newCaseSession({ seed: "pp-o2", access: "radial-right" });
    const m = mod(t);
    const real = t.patient.vitals.bind(t.patient);
    let spo2 = 95;
    (t.patient as { vitals: typeof real }).vitals = () => {
      const v = real();
      return { ...v, spo2, respiratory: { ...v.respiratory, oxygenLpm: 0 } };
    };
    expect(m.actions.confirmCheck("spo2")).toBe(false);
    expect(m.state.note).toContain("Give oxygen first");
    expect(m.actions.giveOxygen()).toBe(true);
    t.wait(5);
    t.runPending();
    expect(real().respiratory.oxygenLpm).toBe(MP_OXYGEN_LPM);
    spo2 = 97;
    expect(m.actions.confirmCheck("spo2")).toBe(true);
    expect(m.state.checklist.spo2).toBeDefined();
  });

  it("an arrest: the ECG is not confirmed in VF, and the autopilot stops before the puncture instead of giving oxygen", () => {
    const { session: s } = newCaseSession({ seed: "pp-arrest", access: "radial-right", indication: "STEMI" });
    const m = mod(s);
    const real = s.patient.vitals.bind(s.patient);
    (s.patient as { vitals: typeof real }).vitals = () => ({ ...real(), hr: null, rhythmKind: "vf", spo2: null });
    expect(m.actions.confirmCheck("ecg")).toBe(false);
    expect(m.state.note).toBe("The monitor shows no organised rhythm.");
    expect(m.state.checklist.ecg).toBeUndefined();
    expect(() => prepare(s)).toThrow(/ecg/);
    expect(s.decisions().some((d) => d.id === "pre-puncture-checklist")).toBe(false);
    expect(real().respiratory.oxygenLpm ?? 0).toBe(0);
    s.dispose();
    // no oximetry trace with an organised rhythm: oxygen does not help, so the autopilot stops
    const { session: t } = newCaseSession({ seed: "pp-no-trace", access: "radial-right", indication: "STEMI" });
    const realT = t.patient.vitals.bind(t.patient);
    (t.patient as { vitals: typeof realT }).vitals = () => ({ ...realT(), spo2: null });
    expect(() => prepare(t)).toThrow(/no oximetry trace before the puncture/);
    expect(realT().respiratory.oxygenLpm ?? 0).toBe(0);
    expect(mod(t).actions.checklistDone()).toBe(false);
    t.dispose();
  });

  it("a second click on a refused needle does not repeat the stop line", () => {
    const { session: s } = newCaseSession({ scenario: "checklist", mode: "supervised" });
    const before = s.attending.length;
    expect(s.placeNeedle(aimedPose(s))).toBe(false);
    expect(s.placeNeedle(aimedPose(s))).toBe(false);
    expect(s.attending.length - before).toBe(1);
  });
});

describe("links, lessons and tips", () => {
  it("practiceIndex lists the scenarios doac-recent, warfarin-inr-unchecked, metformin-ckd under lessons pm-planning-assessment, pm-planning-preparation, pm-to-the-root-table, and the checklist under pm-to-the-root-table", () => {
    for (const lessonId of ["pm-planning-assessment", "pm-planning-preparation", "pm-to-the-root-table"]) {
      const entries = practiceForLesson(lessonId).filter((e) => e.sim === "procedure");
      for (const id of ["doac-recent", "warfarin-inr-unchecked", "metformin-ckd"]) expect(entries.some((e) => e.scenario === id && e.params.scenario === id), `${lessonId}: ${id}`).toBe(true);
    }
    expect(practiceForLesson("pm-to-the-root-table").some((e) => e.sim === "procedure" && e.scenario === "checklist")).toBe(true);
    expect(PRACTICE_INDEX.known.problems.filter((p) => p.includes("planning.launch"))).toEqual([]);
  });

  it("the launch file and the scenario file agree, and every lesson resolves", () => {
    expect(planningLaunch.sim).toBe("procedure");
    expect(planningLaunch.scenarios!.map((x) => x.id)).toEqual(PLANNING_SCENARIOS.map((x) => x.id));
    for (const sc of planningLaunch.scenarios ?? []) {
      expect(SCENARIO_BY_ID[sc.id].title).toBe(sc.title);
      expect(SCENARIO_BY_ID[sc.id].lessonIds).toEqual(sc.lessonIds);
      for (const l of sc.lessonIds) expect(LESSON_IDS.has(l), l).toBe(true);
    }
  });

  it("every problem's lesson and tips resolve, and every decision the module writes names resolving lessons and tips", () => {
    for (const p of Object.values(PLANTED_PROBLEMS)) {
      expect(LESSON_IDS.has(p.lessonId), p.id).toBe(true);
      for (const t of p.tipIds) expect(TIP_BY_ID[t], `${p.id}: ${t}`).toBeDefined();
    }
    expect(LESSON_IDS.has("pm-planning-assessment")).toBe(true);
    expect(LESSON_IDS.has("pm-to-the-root-table")).toBe(true);
    const { session: s } = newCaseSession({ scenario: "surgery-planned" });
    prepare(s);
    for (const d of s.decisions()) {
      if (d.lessonId) expect(LESSON_IDS.has(d.lessonId), d.id).toBe(true);
      for (const t of d.tipIds ?? []) expect(TIP_BY_ID[t], `${d.id}: ${t}`).toBeDefined();
    }
  });
});
