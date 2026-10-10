// proc-discharge-prescription: the discharge antithrombotic prescription, scored against the module text
// (src/simulation/session/discharge.ts), in the full case (modules/discharge.ts) and its scenarios
// (scenarios/discharge.ts, discharge.launch.ts).
//   npx vitest run src/simulation/session/discharge.test.ts
import { describe, it, expect, vi } from "vitest";
import { newCaseSession, type CaseSession } from "./caseSession";
import {
  DISCHARGE_CASES,
  addToDate,
  arcHbr,
  daysBetween,
  derivedDischargeCase,
  dischargeChart,
  dischargePatient,
  emptyPlan,
  missingPlan,
  referencePlan,
  scoreBleedResponse,
  scorePlan,
  type DischargeCase,
  type DischargePatient,
  type DischargePlan,
} from "./discharge";
import { dischargeOf, dischargeTab, type DischargeModule } from "./modules/discharge";
import { SCENARIO_BY_ID } from "./scenarios/index";
import { scenarios as DISCHARGE_SCENARIOS } from "./scenarios/discharge";
import { launch as dischargeLaunch } from "./scenarios/discharge.launch";
import { PRACTICE_INDEX, practiceForLesson } from "../../ui/content/practiceIndex";
import { DECISION_TEXT_MAX } from "../../mentor/ledger";
import { treatedLesionIndex } from "./scenarios/discharge";

const C = DISCHARGE_CASES;
const pt = (o: Partial<DischargePatient> = {}): DischargePatient => ({ sex: "M", ageY: 62, weightKg: 80, egfr: 85, ...o });
const verdict = (c: DischargeCase, p: DischargePatient, o: DischargePlan, id: string, bled = false) => scorePlan(c, p, o, { bled }).find((v) => v.id === id);
const open = (id: string): CaseSession => newCaseSession({ scenario: id }).session;
const facts = (s: CaseSession) => dischargePatient(s.profile);

describe("discharge prescription: ARC-HBR", () => {
  it("one major or two minor criteria; the haemoglobin band depends on sex", () => {
    expect(arcHbr(C["dapt-stable"], pt()).high).toBe(false);
    // the lesson's check: eGFR 26 is major; Hb 12.4 is minor only in a man
    const w = arcHbr(C["dapt-hbr-one-major"], pt({ sex: "F", ageY: 68, egfr: 26 }));
    expect(w).toMatchObject({ high: true, major: ["egfr-major"], minor: [] });
    expect(arcHbr(C["dapt-hbr-one-major"], pt({ sex: "M", ageY: 68, egfr: 70 })).minor).toEqual(["hb-minor"]);
    // age 77 and eGFR 52: two minor
    expect(arcHbr(C["dapt-hbr-two-minor"], pt({ ageY: 77, egfr: 52 }))).toMatchObject({ high: true, major: [], minor: ["age", "egfr-minor"] });
    // one minor alone is not high
    expect(arcHbr(C["dapt-hbr-two-minor"], pt({ ageY: 77, egfr: 70 })).high).toBe(false);
    // the anticoagulant is a major criterion
    expect(arcHbr(C["dapt-af-acs"], pt({ ageY: 72 })).major).toContain("oac");
  });

  it("'dapt-hbr-two-minor' classified as not HBR is wrong", () => {
    const s = open("dapt-hbr-two-minor");
    const p = facts(s);
    // the scenario's patient: 77 years and an eGFR in the 30-59 band
    expect(p.ageY).toBe(77);
    expect(p.egfr).toBeGreaterThanOrEqual(30);
    expect(p.egfr).toBeLessThan(60);
    const ref = referencePlan(C["dapt-hbr-two-minor"], p);
    expect(verdict(C["dapt-hbr-two-minor"], p, ref, "hbr")!.correct).toBe(true);
    const wrong = { ...ref, hbr: "not-high" as const };
    expect(verdict(C["dapt-hbr-two-minor"], p, wrong, "hbr")!.correct).toBe(false);
    // and in the case: signed as not HBR, the ledger records it wrong
    const m = dischargeOf(s)!;
    expect(m.actions.sign(wrong)).toBe(true);
    expect(s.decisions().find((d) => d.id === "discharge-hbr")!.correct).toBe(false);
  });

  it("'dapt-hbr-one-major' is the lesson's woman: eGFR under 30 and one major criterion", () => {
    const p = facts(open("dapt-hbr-one-major"));
    expect(p.sex).toBe("F");
    expect(p.egfr).toBeLessThan(30);
    expect(arcHbr(C["dapt-hbr-one-major"], p)).toMatchObject({ high: true, major: ["egfr-major"], minor: [] });
  });
});

describe("discharge prescription: the P2Y12 inhibitor and the durations", () => {
  it("prasugrel in triple therapy is wrong; clopidogrel is correct", () => {
    const c = C["dapt-af-acs"];
    const p = pt({ ageY: 72, weightKg: 82 });
    const ref = referencePlan(c, p);
    expect(ref.p2y12).toBe("clopidogrel");
    expect(verdict(c, p, ref, "p2y12")!.correct).toBe(true);
    expect(verdict(c, p, { ...ref, p2y12: "prasugrel" }, "p2y12")!.correct).toBe(false);
    expect(verdict(c, p, { ...ref, p2y12: "ticagrelor" }, "p2y12")!.correct).toBe(false);
    // and in the case
    const s = open("dapt-af-acs");
    expect(dischargeOf(s)!.actions.sign({ ...referencePlan(c, facts(s)), p2y12: "prasugrel" })).toBe(true);
    expect(s.decisions().find((d) => d.id === "discharge-p2y12")!.correct).toBe(false);
    const s2 = open("dapt-af-acs");
    expect(dischargeOf(s2)!.actions.sign(referencePlan(c, facts(s2)))).toBe(true);
    expect(s2.decisions().find((d) => d.id === "discharge-p2y12")!.correct).toBe(true);
  });

  it("de-escalation within 30 days of ACS without bleeding is wrong; after 30 days, or after a bleed, it is accepted", () => {
    const c = C["dapt-acs"];
    const p = pt({ ageY: 58, weightKg: 84 });
    const ref = { ...referencePlan(c, p), p2y12: "ticagrelor" as const, dyspnoeaWarned: true };
    expect(verdict(c, p, ref, "de-escalation")).toBeUndefined();
    expect(verdict(c, p, { ...ref, switchToClopidogrelDay: 14 }, "de-escalation")!.correct).toBe(false);
    expect(verdict(c, p, { ...ref, switchToClopidogrelDay: 45 }, "de-escalation")!.correct).toBe(true);
    expect(verdict(c, p, { ...ref, switchToClopidogrelDay: 14 }, "de-escalation", true)!.correct).toBe(true);
    // a switch ticked without its day cannot be signed
    expect(missingPlan(c, { ...ref, switchPlanned: true, switchToClopidogrelDay: null })).toContain("the day of the switch to clopidogrel");
    expect(missingPlan(c, { ...ref, switchPlanned: true, switchToClopidogrelDay: 45 })).toEqual([]);
    // stable disease: not the ACS rule
    expect(verdict(C["dapt-stable"], pt(), { ...referencePlan(C["dapt-stable"], pt()), p2y12: "ticagrelor", switchToClopidogrelDay: 10 }, "de-escalation")!.correct).toBe(true);
  });

  it("a plan without stop dates fails that item; dates that match the plan's own durations pass", () => {
    const c = C["dapt-acs"];
    const p = pt({ ageY: 58 });
    const ref = referencePlan(c, p);
    expect(verdict(c, p, ref, "stop-dates")!.correct).toBe(true);
    const none = { ...ref, stopDates: { aspirin: null, p2y12: null } };
    expect(missingPlan(c, none)).toEqual([]);
    expect(verdict(c, p, none, "stop-dates")!.correct).toBe(false);
    expect(verdict(c, p, { ...ref, stopDates: { aspirin: ref.stopDates.aspirin, p2y12: null } }, "stop-dates")!.correct).toBe(false);
    // a P2Y12 stop date 6 months out does not match a 12-month plan
    expect(verdict(c, p, { ...ref, stopDates: { ...ref.stopDates, p2y12: addToDate(c.pciDate, { months: 6 }) } }, "stop-dates")!.correct).toBe(false);
    // aspirin continues: any review date from the end of DAPT
    expect(verdict(c, p, { ...ref, stopDates: { ...ref.stopDates, aspirin: addToDate(c.pciDate, { months: 24 }) } }, "stop-dates")!.correct).toBe(true);
    // in the case: signed without dates, the ledger item is wrong
    const s = open("dapt-acs");
    expect(dischargeOf(s)!.actions.sign({ ...referencePlan(c, facts(s)), stopDates: { aspirin: null, p2y12: null } })).toBe(true);
    expect(s.decisions().find((d) => d.id === "discharge-stop-dates")!.correct).toBe(false);
  });

  it("the DAPT durations of the manuals and the 2023 ESC guideline", () => {
    const at = (c: DischargeCase, p: DischargePatient, months: number, after: DischargePlan["after"] = "aspirin") => verdict(c, p, { ...referencePlan(c, p), daptMonths: months, after }, "dapt-duration")!.correct;
    expect(at(C["dapt-stable"], pt(), 6)).toBe(true);
    expect(at(C["dapt-stable"], pt(), 12)).toBe(false);
    expect(at(C["dapt-stable"], pt(), 6, "none")).toBe(false);
    expect(at(C["dapt-acs"], pt(), 12)).toBe(true);
    expect(at(C["dapt-acs"], pt(), 6)).toBe(false);
    const two = pt({ ageY: 77, egfr: 52 });
    expect(at(C["dapt-hbr-two-minor"], two, 3)).toBe(true);
    expect(at(C["dapt-hbr-two-minor"], two, 1, "p2y12")).toBe(true);
    expect(at(C["dapt-hbr-two-minor"], two, 6)).toBe(false);
    const w = pt({ sex: "F", ageY: 68, egfr: 26 });
    expect(at(C["dapt-hbr-one-major"], w, 6)).toBe(true);
    expect(at(C["dapt-hbr-one-major"], w, 12)).toBe(false);
    // ACS at high bleeding risk: clopidogrel or ticagrelor (Oxford Table 8.8), not prasugrel
    expect(verdict(C["dapt-hbr-one-major"], w, { ...referencePlan(C["dapt-hbr-one-major"], w), p2y12: "prasugrel" }, "p2y12")!.correct).toBe(false);
    expect(verdict(C["dapt-hbr-one-major"], w, { ...referencePlan(C["dapt-hbr-one-major"], w), p2y12: "ticagrelor" }, "p2y12")!.correct).toBe(true);
    // stable disease: clopidogrel
    expect(verdict(C["dapt-stable"], pt(), { ...referencePlan(C["dapt-stable"], pt()), p2y12: "ticagrelor" }, "p2y12")!.correct).toBe(false);
    // where the manuals differ the expected answer shows the other position with its source
    const acs = verdict(C["dapt-acs"], pt(), referencePlan(C["dapt-acs"], pt()), "p2y12")!;
    expect(acs.expected).toMatch(/Oxford Table 8\.8 also lists clopidogrel/);
    expect(verdict(C["dapt-acs"], pt(), { ...referencePlan(C["dapt-acs"], pt()), p2y12: "clopidogrel" }, "p2y12")!.correct).toBe(false);
    expect(verdict(C["dapt-hbr-one-major"], w, referencePlan(C["dapt-hbr-one-major"], w), "p2y12")!.expected).toMatch(/Brilakis avoids prasugrel and ticagrelor at high bleeding risk/);
    const old = pt({ ageY: 78 });
    const ov = verdict(C["dapt-acs"], old, { ...referencePlan(C["dapt-acs"], old), p2y12: "prasugrel" }, "p2y12")!;
    expect(ov.correct).toBe(false);
    expect(ov.expected).toMatch(/no prasugrel \(Oxford\) or prasugrel 5 mg \(Brilakis\)/);
  });

  it("every verdict's label, expected and given fit the ledger's text limit, in every case and both P2Y12 branches", () => {
    const fits = (v: { id: string; label: string; expected: string; given: string }, where: string) => {
      for (const k of ["label", "expected", "given"] as const) expect(v[k].length, `${where} ${v.id} ${k}: ${v[k]}`).toBeLessThanOrEqual(DECISION_TEXT_MAX);
    };
    for (const sc of DISCHARGE_SCENARIOS) {
      const c = C[sc.id];
      const p = facts(open(sc.id));
      const ref = referencePlan(c, p);
      for (const p2y12 of ["clopidogrel", "prasugrel", "ticagrelor"] as const) for (const v of scorePlan(c, p, { ...ref, p2y12 }, { bled: true })) fits(v, `${sc.id} ${p2y12}`);
    }
    // the ACS branches with and without high bleeding risk, with the age and weight rule and the brain and CYP3A rules
    for (const c of [C["dapt-acs"], C["dapt-hbr-one-major"]])
      for (const p of [pt(), pt({ ageY: 78 }), pt({ weightKg: 55 }), pt({ sex: "F", ageY: 80, weightKg: 52, egfr: 26 })])
        for (const extra of [{}, { brain: "tia" as const }, { cyp3a: "a strong CYP3A inhibitor" }, { brain: "ich" as const, cyp3a: "a strong CYP3A inhibitor" }]) {
          const cc = { ...c, ...extra } as DischargeCase;
          const v = verdict(cc, p, referencePlan(cc, p), "p2y12")!;
          fits(v, `${c.id} ${JSON.stringify(extra)} ${p.ageY}y ${p.weightKg}kg`);
          // the drugs come first, and the source comparison is kept whenever it fits
          expect(v.expected).toMatch(/^(Clopidogrel|Prasugrel|Ticagrelor)( or (Prasugrel|Ticagrelor))?: /);
        }
    // the scenarios' own P2Y12 answers keep the comparison of the manuals
    expect(verdict(C["dapt-acs"], pt(), referencePlan(C["dapt-acs"], pt()), "p2y12")!.expected).toBe("Prasugrel or Ticagrelor: ACS (Brilakis; 2023 ESC); Oxford Table 8.8 also lists clopidogrel");
  });

  it("triple therapy up to 1 week (1 month when ischaemic risk dominates), then the anticoagulant with clopidogrel to 12 months, at the stroke-prevention dose", () => {
    const c = C["dapt-af-acs"];
    const p = pt({ ageY: 72 });
    const ref = referencePlan(c, p);
    const td = (o: Partial<DischargePlan>) => verdict(c, p, { ...ref, ...o }, "triple-dual")!.correct;
    expect(td({})).toBe(true);
    expect(td({ tripleDays: 30 })).toBe(false);
    expect(td({ tripleDays: 365 })).toBe(false);
    expect(td({ dualMonths: 24 })).toBe(false);
    // dual therapy shortened to 6 months: only with a bleeding risk factor beyond the anticoagulant (MODEL PARAMETER)
    expect(td({ dualMonths: 6 })).toBe(false);
    const pr = pt({ ageY: 72, egfr: 52 });
    expect(verdict(c, pr, { ...referencePlan(c, pr), dualMonths: 6 }, "triple-dual")!.correct).toBe(true);
    expect(verdict(c, pr, { ...referencePlan(c, pr), dualMonths: 12 }, "triple-dual")!.correct).toBe(true);
    const ci = C["dapt-af-ischaemic"];
    const pi = pt({ ageY: 66 });
    expect(verdict(ci, pi, { ...referencePlan(ci, pi), tripleDays: 30 }, "triple-dual")!.correct).toBe(true);
    expect(verdict(ci, pi, { ...referencePlan(ci, pi), tripleDays: 60 }, "triple-dual")!.correct).toBe(false);
    expect(verdict(c, p, { ...ref, oacDose: "reduced" }, "oac-dose")!.correct).toBe(false);
    expect(verdict(c, p, ref, "oac-dose")!.correct).toBe(true);
    // a PPI is required with an anticoagulant; optional without a raised risk
    expect(verdict(c, p, { ...ref, ppi: false }, "ppi")!.correct).toBe(false);
    expect(verdict(C["dapt-stable"], pt(), { ...referencePlan(C["dapt-stable"], pt()), ppi: false }, "ppi")!.correct).toBe(true);
  });

  it("ticagrelor needs the breathlessness warning", () => {
    const c = C["dapt-acs"];
    const p = pt({ ageY: 58 });
    const ref = { ...referencePlan(c, p), p2y12: "ticagrelor" as const };
    expect(verdict(c, p, { ...ref, dyspnoeaWarned: false }, "ticagrelor-dyspnoea")!.correct).toBe(false);
    expect(verdict(c, p, { ...ref, dyspnoeaWarned: true }, "ticagrelor-dyspnoea")!.correct).toBe(true);
    expect(verdict(c, p, { ...ref, p2y12: "prasugrel" }, "ticagrelor-dyspnoea")).toBeUndefined();
  });

  it("surgery: elective after the full DAPT course with aspirin continued and no bridging", () => {
    const c = C["dapt-surgery-planned"];
    const p = pt({ sex: "F", ageY: 66, weightKg: 70 });
    const ref = referencePlan(c, p);
    expect(verdict(c, p, ref, "surgery-timing")!.correct).toBe(true);
    expect(verdict(c, p, ref, "surgery-drugs")!.correct).toBe(true);
    expect(verdict(c, p, { ...ref, surgery: { ...ref.surgery, timing: "1-month" } }, "surgery-timing")!.correct).toBe(false);
    expect(verdict(c, p, { ...ref, surgery: { ...ref.surgery, aspirin: "stop" } }, "surgery-drugs")!.correct).toBe(false);
    expect(verdict(c, p, { ...ref, surgery: { ...ref.surgery, bridging: true } }, "surgery-drugs")!.correct).toBe(false);
    expect(verdict(c, p, { ...ref, surgery: { ...ref.surgery, p2y12StopDays: 10 } }, "surgery-drugs")!.correct).toBe(false);
    // after the full course clopidogrel has already stopped (aspirin continues): no stop interval is needed, and the
    // right one is not held against the learner either
    expect(ref.surgery.p2y12StopDays).toBeNull();
    const deferred = verdict(c, p, { ...ref, surgery: { ...ref.surgery, p2y12StopDays: null } }, "surgery-drugs")!;
    expect(deferred.correct).toBe(true);
    expect(deferred.expected).toMatch(/no clopidogrel stop needed/);
    expect(verdict(c, p, { ...ref, surgery: { ...ref.surgery, p2y12StopDays: 5 } }, "surgery-drugs")!.correct).toBe(true);
    // the P2Y12 inhibitor continuing after DAPT: it is still taken at the operation, so its stop interval is required
    expect(verdict(c, p, { ...ref, after: "p2y12", surgery: { ...ref.surgery, p2y12StopDays: null } }, "surgery-drugs")!.correct).toBe(false);
    expect(verdict(c, p, { ...ref, after: "p2y12", surgery: { ...ref.surgery, p2y12StopDays: 5 } }, "surgery-drugs")!.correct).toBe(true);
    // a time-sensitive operation after ACS: at least 3 months
    const ts: DischargeCase = { ...C["dapt-acs"], surgery: { kind: "time-sensitive", text: "Colectomy" } };
    const tr = referencePlan(ts, p);
    expect(tr.surgery.timing).toBe("3-months");
    expect(verdict(ts, p, tr, "surgery-timing")!.correct).toBe(true);
    expect(verdict(ts, p, { ...tr, surgery: { ...tr.surgery, timing: "after-dapt" } }, "surgery-timing")!.correct).toBe(false);
    // operating while on DAPT: the P2Y12 stop interval is required
    expect(tr.surgery.p2y12StopDays).not.toBeNull();
    expect(verdict(ts, p, tr, "surgery-drugs")!.correct).toBe(true);
    expect(verdict(ts, p, { ...tr, surgery: { ...tr.surgery, timing: "1-month", p2y12StopDays: null } }, "surgery-drugs")!.correct).toBe(false);
  });

  it("a bleed at follow-up: control the site and step down from a potent agent; never stop DAPT outright", () => {
    expect(scoreBleedResponse("local-step-down", "ticagrelor", "minor").correct).toBe(true);
    expect(scoreBleedResponse("local-continue", "ticagrelor", "minor").correct).toBe(false);
    expect(scoreBleedResponse("local-continue", "clopidogrel", "minor").correct).toBe(true);
    expect(scoreBleedResponse("stop-all", "clopidogrel", "minor").correct).toBe(false);
    expect(scoreBleedResponse("platelets", "ticagrelor", "life-threatening").correct).toBe(false);
    expect(scoreBleedResponse("platelets", "clopidogrel", "life-threatening").correct).toBe(true);
  });

  it("the reference plan scores every item correct in every discharge case", () => {
    for (const sc of DISCHARGE_SCENARIOS) {
      const s = open(sc.id);
      const m = dischargeOf(s)!;
      expect(m, sc.id).toBeDefined();
      expect(m.actions.available(), sc.id).toBe(true);
      const c = m.state!.case;
      const ref = referencePlan(c, facts(s));
      expect(missingPlan(c, ref), sc.id).toEqual([]);
      for (const v of scorePlan(c, facts(s), ref)) expect(v.correct, `${sc.id} ${v.id}: ${v.expected}`).toBe(true);
      for (const v of scorePlan(c, facts(s), ref)) {
        expect(v.expected.length, `${sc.id} ${v.id}`).toBeGreaterThan(0);
        expect(v.lessonId).toMatch(/^(hb-after-the-procedure-dapt|pm-antithrombotics-oral)$/);
      }
    }
  });

  it("dates: calendar months and days", () => {
    expect(addToDate("2026-03-02", { months: 12 })).toBe("2027-03-02");
    expect(addToDate("2026-01-31", { months: 1 })).toBe("2026-02-28");
    expect(addToDate("2026-03-02", { days: 7 })).toBe("2026-03-09");
    expect(daysBetween("2026-03-02", "2026-03-09")).toBe(7);
    expect(daysBetween("2026-03-02", "not a date")).toBeNull();
  });
});

describe("discharge prescription: the session module", () => {
  it("refuses an incomplete prescription with what is missing, then records every item in the ledger", () => {
    const s = open("dapt-stable");
    const m = dischargeOf(s)!;
    expect(m.actions.sign(emptyPlan())).toBe(false);
    expect(m.state!.note).toMatch(/bleeding risk classification/);
    expect(s.decisions().filter((d) => d.id.startsWith("discharge-"))).toEqual([]);
    expect(m.actions.sign(referencePlan(m.state!.case, facts(s)))).toBe(true);
    const ids = s.decisions().filter((d) => d.id.startsWith("discharge-")).map((d) => d.id);
    expect(ids).toEqual(expect.arrayContaining(["discharge-hbr", "discharge-p2y12", "discharge-dapt-duration", "discharge-ppi", "discharge-stop-dates"]));
    expect(s.decisions().every((d) => !d.id.startsWith("discharge-") || d.stage === "discharge")).toBe(true);
    // a second signature is refused
    expect(m.actions.sign()).toBe(false);
  });

  it("uses the stents the team's PCI reported; the chart carries no classification", () => {
    const s = open("dapt-af-ischaemic");
    const m = dischargeOf(s)!;
    expect(m.actions.stents().map((x) => x.lengthMm)).toEqual([38, 28]);
    const chart = m.actions.chart().join(" ");
    // the team stented the patient's own culprit (this seed's: the right coronary), so the stents are reported there
    expect(chart).toMatch(/Stents: RCA 3\.0 × 38 mm drug-eluting stent; RCA 3\.5 × 28 mm/);
    expect(chart).toMatch(/Rivaroxaban/);
    expect(chart).not.toMatch(/high bleeding risk|HBR|major criterion|minor criterion/i);
  });

  it("a case that ran PCI without a discharge scenario gets a prescription from the generated patient; one that did not has none", () => {
    const ward = open("ward-chest-pain-post-pci");
    const m = dischargeOf(ward);
    expect(m).toBeDefined();
    expect(m!.state!.case.derived).toBe(true);
    expect(m!.state!.case.presentation).toBe("stable");
    const diag = open("ward-femoral-6f");
    expect(dischargeOf(diag)).toBeUndefined();
    expect(derivedDischargeCase({ sex: "F", indication: "STEMI", anticoagulation: "doac", doac: { agent: "edoxaban", hoursSinceDose: 24 } })).toMatchObject({ presentation: "acs", oac: { drug: "edoxaban" } });
    // the anticoagulant's indication only as the profile shows it; no medicines the profile does not carry
    expect(derivedDischargeCase({ sex: "M", indication: "SA", anticoagulation: "warfarin", baseline: { rhythm: "af" } }).oac!.indication).toBe("atrial fibrillation");
    expect(derivedDischargeCase({ sex: "M", indication: "SA", anticoagulation: "warfarin", baseline: { rhythm: "sinus" } }).oac!.indication).not.toMatch(/atrial fibrillation/);
    const plain = dischargeChart(derivedDischargeCase({ sex: "M", indication: "SA", anticoagulation: "none" }), pt(), []).join(" ");
    expect(plain).not.toMatch(/statin/);
    expect(plain).toMatch(/Other medicines: no anticoagulant, NSAID or steroid\./);
  });

  it("the lab's Discharge tab: shown only when the case has a prescription; a discharge scenario opens on it", () => {
    expect(dischargeTab(open("ward-femoral-6f"), "ward-femoral-6f")).toEqual({ shown: false, opensOnIt: false });
    expect(dischargeTab(open("dapt-stable"), "dapt-stable")).toEqual({ shown: true, opensOnIt: true });
    // a case that ran PCI outside the discharge scenarios has the tab but does not open on it
    expect(dischargeTab(open("ward-chest-pain-post-pci"), "ward-chest-pain-post-pci")).toEqual({ shown: true, opensOnIt: false });
  });

  it("a bleed in the case before the prescription allows an early step-down and brings the 'bleeding' context", () => {
    const bleedNow = (s: CaseSession) => {
      const mod = s.mod<DischargeModule>("discharge")!;
      const spy = vi.spyOn(s, "activeEvents").mockReturnValue(["bleeding"]);
      mod.slowTick!(1);
      spy.mockRestore();
    };
    const plan = (s: CaseSession): DischargePlan => ({ ...referencePlan(C["dapt-acs"], facts(s)), p2y12: "ticagrelor", dyspnoeaWarned: true, switchPlanned: true, switchToClopidogrelDay: 14 });
    // without a bleed: a day-14 step-down after ACS is wrong
    const calm = open("dapt-acs");
    expect(dischargeOf(calm)!.actions.sign(plan(calm))).toBe(true);
    expect(calm.decisions().find((d) => d.id === "discharge-de-escalation")!.correct).toBe(false);
    // an access bleed seen before the prescription: accepted, and the module's context carries 'bleeding'
    const s = open("dapt-acs");
    bleedNow(s);
    const m = dischargeOf(s)!;
    expect(m.actions.bled()).toBe(true);
    m.actions.setOpen(true);
    expect(s.moduleTipContexts()[0].events).toContain("bleeding");
    expect(m.actions.sign(plan(s))).toBe(true);
    expect(s.decisions().find((d) => d.id === "discharge-de-escalation")!.correct).toBe(true);
    // a derived case: the bleed comes before PCI, when the module has no prescription yet, and still counts
    const d = open("ward-femoral-6f");
    if (d.labsDone.includes("pci")) throw new Error("ward-femoral-6f is expected to start before PCI");
    expect(dischargeOf(d)).toBeUndefined();
    bleedNow(d);
    d.labsDone.push("pci");
    const dm = dischargeOf(d)!;
    expect(dm.state!.case.derived).toBe(true);
    expect(dm.state!.bledInCase).toBe(true);
    expect(dm.actions.bled()).toBe(true);
  });
});

describe("discharge prescription: links", () => {
  it("practiceIndex lists the scenarios dapt-stable, dapt-acs, dapt-hbr-one-major under lessons hb-after-the-procedure-dapt, pm-antithrombotics-oral (from src/simulation/session/scenarios/discharge.launch.ts)", () => {
    for (const lesson of ["hb-after-the-procedure-dapt", "pm-antithrombotics-oral"]) {
      const entries = practiceForLesson(lesson).filter((e) => e.sim === "procedure");
      for (const id of ["dapt-stable", "dapt-acs", "dapt-hbr-one-major"]) expect(entries.some((e) => e.scenario === id && e.params.scenario === id), `${lesson} ${id}`).toBe(true);
    }
    const dapt = practiceForLesson("hb-after-the-procedure-dapt").filter((e) => e.sim === "procedure");
    for (const id of ["dapt-hbr-two-minor", "dapt-af-acs", "dapt-af-ischaemic", "dapt-surgery-planned"]) expect(dapt.some((e) => e.scenario === id), id).toBe(true);
    expect(PRACTICE_INDEX.known.problems.filter((p) => p.includes("discharge.launch"))).toEqual([]);
  });

  it("the launch file and the scenario file agree, and every scenario opens at 'recovery' with PCI done", () => {
    expect(dischargeLaunch.sim).toBe("procedure");
    expect(dischargeLaunch.scenarios!.map((x) => x.id)).toEqual(DISCHARGE_SCENARIOS.map((x) => x.id));
    expect(Object.keys(DISCHARGE_CASES).sort()).toEqual(DISCHARGE_SCENARIOS.map((x) => x.id).sort());
    for (const sc of dischargeLaunch.scenarios ?? []) {
      expect(SCENARIO_BY_ID[sc.id].title).toBe(sc.title);
      expect(SCENARIO_BY_ID[sc.id].lessonIds).toEqual(sc.lessonIds);
      expect(SCENARIO_BY_ID[sc.id].start).toBe("recovery");
      expect(sc.heldOut).toBeFalsy();
      const s = open(sc.id);
      expect(s.labsDone).toContain("pci");
      expect(s.closureDone()).toBe(true);
    }
  });
});

describe("discharge prescription: the patient the learner takes over", () => {
  it("every discharge scenario opens reperfused and at rest: no ST elevation or chest pain, a resting pulse and ejection fraction in the normal range", () => {
    for (const sc of DISCHARGE_SCENARIOS) {
      const { session: s, engine } = newCaseSession({ scenario: sc.id });
      const check = (when: string) => {
        const ev = s.activeEvents();
        expect(ev, `${sc.id} ${when}`).not.toContain("st-elevation");
        expect(ev, `${sc.id} ${when}`).not.toContain("chest-pain");
        const v = engine.vitals();
        // MODEL PARAMETERS of this check: a resting pulse of 55-95/min and an ejection fraction of at least 40%
        expect(v.hr, `${sc.id} ${when} HR`).toBeGreaterThanOrEqual(55);
        expect(v.hr, `${sc.id} ${when} HR`).toBeLessThanOrEqual(95);
        expect(v.ef, `${sc.id} ${when} EF`).toBeGreaterThanOrEqual(40);
        expect(v.symptoms.chestPain, `${sc.id} ${when} pain`).toBeLessThan(1);
      };
      check("at start");
      for (let i = 0; i < 120; i++) s.tick(1);
      check("after 2 min");
      // the team's report puts the stents in the lesion the engine had as the culprit, and nothing in the engine is still thrombotic
      expect(engine.lesions.some((l) => l.kind === "thrombotic"), sc.id).toBe(false);
      // the attending says nothing about the team's technique before the learner takes over
      expect(s.attending.map((a) => a.text).join(" "), sc.id).not.toMatch(/sheath is .* across|raises the risk/);
      expect(s.decisions(), sc.id).toEqual([]);
    }
  });

  it("the team treats the acute culprit before a tighter chronic lesion", () => {
    const L = (kind: "thrombotic" | "severe-stenosis" | "mild-irregularity", severity: number, vessel: "LAD" | "RCA" = "LAD") => ({ vessel, position: 0.4, severity, kind, lengthMm: 15 });
    expect(treatedLesionIndex([L("severe-stenosis", 95), L("thrombotic", 80, "RCA")])).toBe(1);
    expect(treatedLesionIndex([L("mild-irregularity", 30), L("severe-stenosis", 90, "RCA")])).toBe(1);
    expect(treatedLesionIndex([])).toBe(-1);
  });
});
