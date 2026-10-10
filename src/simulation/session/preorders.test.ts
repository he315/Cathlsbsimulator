import { describe, it, expect } from "vitest";
import { newCaseSession, type CaseSession } from "./caseSession";
import { prepare, fastForward } from "./autopilot";
import { SCENARIO_BY_ID } from "./scenarios/index";
import { scenarios as PREORDER_SCENARIOS } from "./scenarios/preorders";
import { launch as preordersLaunch } from "./scenarios/preorders.launch";
import {
  PREORDER_CASES,
  PREORDER_RULES,
  ceilingLimitMl,
  doacEffectAfter,
  emptyOrders,
  inrAfter,
  missingOrders,
  oacHoldRule,
  preorderPatient,
  referenceOrders,
  scoreAntiplatelet,
  scoreCeiling,
  scoreKidney,
  scoreOac,
  type PreOrders,
  type PreorderCase,
  type PreorderPatient,
} from "./preorders";
import { ageBolus, preordersOf, type PreordersModule } from "./modules/preorders";
import { planningOf } from "./modules/planning";
import { OPIOID_P2Y12, ORAL_ONSET_S, Pharmacology } from "../patient/pharmacology";
import { generatePatient } from "../patient/patient";
import { applyProfileOverrides } from "./scenarios/index";
import { TIP_BY_ID } from "../../content/lab/tips";
import { TRACKS } from "../../content/index";
import { PRACTICE_INDEX, practiceForLesson } from "../../ui/content/practiceIndex";

// proc-preprocedure-orders: the pre-procedure order sheet, its scoring against the module text, and
// what the signed orders do to the patient.

const LESSON_IDS = new Set(TRACKS.flatMap((t) => t.modules.flatMap((m) => m.lessons.map((l) => l.id))));
const mod = (s: CaseSession): PreordersModule => preordersOf(s)!;
const decision = (s: CaseSession, id: string) => s.decisions().find((d) => d.id === id);
/** The scenario's patient, without building a session. */
const patientOf = (id: string): PreorderPatient => {
  const sc = SCENARIO_BY_ID[id];
  return preorderPatient(applyProfileOverrides(generatePatient(sc.seed!, sc.indication ? { indication: sc.indication } : {}), sc.profile));
};
const caseOf = (id: string): PreorderCase => PREORDER_CASES[id];
const verdict = (vs: { id: string; correct: boolean }[], id: string) => vs.find((v) => v.id === id);
/** The reference orders of a case with some parts changed. */
const ordersWith = (id: string, patch: (o: PreOrders) => void): PreOrders => {
  const o = referenceOrders(caseOf(id), patientOf(id));
  patch(o);
  return o;
};
/** A case opened at the chart with its sheet signed (and its time run). */
const signed = (id: string, patch: (o: PreOrders) => void = () => {}) => {
  const { session: s, engine } = newCaseSession({ scenario: id });
  const o = ordersWith(id, patch);
  expect(mod(s).actions.sign(o), mod(s).state!.note ?? "").toBe(true);
  s.runPending();
  return { s, engine, o };
};

describe("the anticoagulant plan", () => {
  it("AF on apixaban with normal clearance scores 'hold without bridging' correct and 'bridge' wrong; a mechanical valve on warfarin scores the reverse", () => {
    const af = caseOf("oac-af-low-risk");
    const pAf = patientOf("oac-af-low-risk");
    expect(af.oac!.drug).toBe("apixaban");
    expect(pAf.crclMlMin).toBeGreaterThanOrEqual(50);
    const hold = { strategy: "hold" as const, holdH: 48, restartH: 12 };
    const bridge = { strategy: "bridge" as const, holdH: 48, restartH: 12 };
    expect(verdict(scoreOac(af, pAf, hold), "oac-strategy")!.correct).toBe(true);
    expect(verdict(scoreOac(af, pAf, bridge), "oac-strategy")!.correct).toBe(false);
    const mv = caseOf("oac-mechanical-valve");
    const pMv = patientOf("oac-mechanical-valve");
    expect(mv.oac!.drug).toBe("warfarin");
    const wHold = { strategy: "hold" as const, holdH: 120, restartH: 12 };
    const wBridge = { strategy: "bridge" as const, holdH: 120, restartH: 12 };
    expect(verdict(scoreOac(mv, pMv, wHold), "oac-strategy")!.correct).toBe(false);
    expect(verdict(scoreOac(mv, pMv, wBridge), "oac-strategy")!.correct).toBe(true);
    // continuing (with radial access) is accepted for both
    expect(verdict(scoreOac(af, pAf, { strategy: "continue", holdH: null, restartH: null }), "oac-strategy")!.correct).toBe(true);
    expect(verdict(scoreOac(mv, pMv, { strategy: "continue", holdH: null, restartH: null }), "oac-strategy")!.correct).toBe(true);
    // rheumatic mitral disease and a non-laminar thrombus are on the same list as the valve
    for (const id of ["oac-rheumatic-mitral", "oac-lv-thrombus"]) {
      expect(verdict(scoreOac(caseOf(id), patientOf(id), wHold), "oac-strategy")!.correct, id).toBe(false);
      expect(verdict(scoreOac(caseOf(id), patientOf(id), wBridge), "oac-strategy")!.correct, id).toBe(true);
    }
  });

  it("the same verdicts reach the ledger when the sheet is signed in the case", () => {
    const a = signed("oac-af-low-risk", (o) => (o.oac = { strategy: "hold", holdH: 48, restartH: 12 })).s;
    expect(decision(a, "preorders-oac-strategy")!.correct).toBe(true);
    const b = signed("oac-af-low-risk", (o) => (o.oac = { strategy: "bridge", holdH: 48, restartH: 12 })).s;
    expect(decision(b, "preorders-oac-strategy")!.correct).toBe(false);
    // what the plan risked reaches the debrief through the ledger entry
    expect(decision(b, "preorders-oac-strategy")!.given).toMatch(/^Bridge with IV heparin\. Bridging in atrial fibrillation: in BRIDGE/);
    const c = signed("oac-mechanical-valve", (o) => (o.oac = { strategy: "hold", holdH: 120, restartH: 12 })).s;
    expect(decision(c, "preorders-oac-strategy")!.correct).toBe(false);
    expect(mod(c).state!.consequences.join(" ")).toMatch(/without cover/);
    expect(decision(c, "preorders-oac-strategy")!.given).toMatch(/without cover/);
    const short = signed("oac-af-low-risk", (o) => (o.oac = { strategy: "hold", holdH: 12, restartH: 12 })).s;
    expect(decision(short, "preorders-oac-hold")!.given).toMatch(/shorter than either manual's/);
    const d = signed("oac-mechanical-valve", (o) => (o.oac = { strategy: "bridge", holdH: 120, restartH: 12 })).s;
    expect(decision(d, "preorders-oac-strategy")!.correct).toBe(true);
    expect(decision(d, "preorders-oac-strategy")!.given).toBe("Bridge with IV heparin");
    for (const s of [a, b, c, d]) for (const r of s.decisions()) {
      if (r.lessonId) expect(LESSON_IDS.has(r.lessonId), r.id).toBe(true);
      for (const t of r.tipIds ?? []) expect(TIP_BY_ID[t], `${r.id}: ${t}`).toBeDefined();
    }
  });

  it("hold length follows the drug and the clearance (Brilakis Table 1.2, Oxford's shorter rule accepted), and warfarin's 3-5 days", () => {
    const af = caseOf("oac-af-low-risk");
    const p = patientOf("oac-af-low-risk");
    const h = (holdH: number) => verdict(scoreOac(af, p, { strategy: "hold", holdH, restartH: 12 }), "oac-hold")!.correct;
    expect(h(48)).toBe(true);
    expect(h(24)).toBe(true); // Oxford's 24 h
    expect(h(12)).toBe(false);
    expect(oacHoldRule("dabigatran", 40)).toMatchObject({ brilakisH: 96, oxfordH: 72 });
    expect(oacHoldRule("rivaroxaban", 40).brilakisH).toBe(72);
    const mv = caseOf("oac-mechanical-valve");
    const pm = patientOf("oac-mechanical-valve");
    const w = (holdH: number) => verdict(scoreOac(mv, pm, { strategy: "bridge", holdH, restartH: 12 }), "oac-hold")!.correct;
    expect(w(PREORDER_RULES.warfarinHoldBrilakisH)).toBe(true);
    expect(w(72)).toBe(true);
    expect(w(48)).toBe(false);
    // the restart must be written
    expect(verdict(scoreOac(af, p, { strategy: "hold", holdH: 48, restartH: null }), "oac-restart")!.correct).toBe(false);
    expect(missingOrders(af, { ...emptyOrders(), oac: { strategy: "hold", holdH: 48, restartH: null } })).toContain("when the anticoagulant restarts");
  });

  it("what the plan leaves on board: continuing apixaban raises the baseline ACT, holding it does not; warfarin held 5 days brings the INR down", () => {
    const cont = signed("oac-af-low-risk", (o) => (o.oac = { strategy: "continue", holdH: null, restartH: null }));
    const held = signed("oac-af-low-risk", (o) => (o.oac = { strategy: "hold", holdH: 48, restartH: 12 }));
    expect(cont.s.profile.act.baseline).toBeGreaterThan(held.s.profile.act.baseline);
    expect(cont.engine.pharm.st.doac!.level).toBeCloseTo(doacEffectAfter(12), 2);
    expect(held.engine.pharm.st.doac!.level).toBeCloseTo(doacEffectAfter(48), 2);
    expect(held.s.antithrombotic().oac).toMatchObject({ kind: "doac", agent: "apixaban", hoursSinceDose: 48 });
    expect(held.s.chart.anticoag.text).toMatch(/last dose 48 h ago/);
    // warfarin: the INR on the chart and in the record follows the hold
    const w = signed("warfarin-inr-high", (o) => (o.oac = { strategy: "hold", holdH: 120, restartH: 12 }));
    const inr = inrAfter(3.4, 120);
    expect(inr).toBeLessThan(1.5);
    expect(w.s.chart.anticoag.text).toContain(`INR today ${inr}`);
    expect(planningOf(w.s)!.state.record.items.find((i) => i.id === "bloods")!.lines.join(" ")).toContain(`INR ${inr} this morning`);
    const wc = signed("warfarin-inr-high", (o) => (o.oac = { strategy: "continue", holdH: null, restartH: null }));
    expect(wc.s.profile.act.baseline).toBeGreaterThan(w.s.profile.act.baseline);
  });
});

describe("antiplatelets", () => {
  it("prasugrel with a previous stroke is wrong; ticagrelor with a strong CYP3A inhibitor is wrong", () => {
    const nste = caseOf("nste-early-angio");
    const pn = patientOf("nste-early-angio");
    expect(nste.screen.strokeOrTia).toBeTruthy();
    const base = referenceOrders(nste, pn).antiplatelet;
    expect(verdict(scoreAntiplatelet(nste, pn, { ...base, p2y12: "prasugrel", p2y12Mg: 60 }), "p2y12-agent")!.correct).toBe(false);
    expect(verdict(scoreAntiplatelet(nste, pn, { ...base, p2y12: "ticagrelor", p2y12Mg: 180 }), "p2y12-agent")!.correct).toBe(true);
    const stemi = caseOf("stemi-opioids");
    const ps = patientOf("stemi-opioids");
    expect(stemi.screen.cyp3a).toMatch(/Clarithromycin/);
    const sb = referenceOrders(stemi, ps).antiplatelet;
    expect(verdict(scoreAntiplatelet(stemi, ps, { ...sb, p2y12: "ticagrelor", p2y12Mg: 180 }), "p2y12-agent")!.correct).toBe(false);
    expect(verdict(scoreAntiplatelet(stemi, ps, { ...sb, p2y12: "prasugrel", p2y12Mg: 60 }), "p2y12-agent")!.correct).toBe(true);
    // in the case, the wrong choice is a ledger failure naming the screen
    const s = signed("nste-early-angio", (o) => Object.assign(o.antiplatelet, { p2y12: "prasugrel", p2y12Mg: 60 })).s;
    const d = decision(s, "preorders-p2y12-agent")!;
    expect(d.correct).toBe(false);
    expect(d.given).toMatch(/stroke/);
  });

  it("the rest of the P2Y12 screen: prasugrel over 75 or under 60 kg, ticagrelor after intracranial haemorrhage or with high-dose simvastatin", () => {
    const clear: PreorderCase = { ...caseOf("nste-early-angio"), screen: { strokeOrTia: null, ich: false, cyp3a: null, highDoseStatin: null, opioidBeforeArrival: null } };
    const p0 = patientOf("nste-early-angio");
    const base = referenceOrders(clear, p0).antiplatelet;
    const agent = (c: PreorderCase, p: PreorderPatient, drug: "prasugrel" | "ticagrelor") =>
      verdict(scoreAntiplatelet(c, p, { ...base, p2y12: drug, p2y12Mg: drug === "prasugrel" ? 60 : 180 }), "p2y12-agent")!.correct;
    // with a clear screen both potent agents fit
    expect(agent(clear, p0, "prasugrel")).toBe(true);
    expect(agent(clear, p0, "ticagrelor")).toBe(true);
    for (const p of [{ ...p0, ageY: PREORDER_RULES.prasugrelAgeOverY + 3 }, { ...p0, weightKg: PREORDER_RULES.prasugrelWeightUnderKg - 5 }]) {
      expect(agent(clear, p, "prasugrel")).toBe(false);
      expect(agent(clear, p, "ticagrelor")).toBe(true);
    }
    for (const screen of [{ ...clear.screen, ich: true }, { ...clear.screen, highDoseStatin: "Simvastatin 80 mg at night" }]) {
      const c = { ...clear, screen };
      expect(agent(c, p0, "ticagrelor")).toBe(false);
      expect(agent(c, p0, "prasugrel")).toBe(true);
    }
  });

  it("with an anticoagulant and daily aspirin already taken, continuing the daily dose is accepted and no reload is ordered", () => {
    const c = caseOf("oac-lv-thrombus");
    const p = patientOf("oac-lv-thrombus");
    expect(c.oac).not.toBeNull();
    expect(c.onAspirin).toBe(true);
    const ref = referenceOrders(c, p).antiplatelet;
    expect(ref).toMatchObject({ aspirin: "continue", aspirinMg: null });
    expect(verdict(scoreAntiplatelet(c, p, ref), "aspirin")!.correct).toBe(true);
    expect(verdict(scoreAntiplatelet(c, p, { ...ref, aspirin: "peri-procedural", aspirinMg: 300 }), "aspirin")!.correct).toBe(true);
    expect(verdict(scoreAntiplatelet(c, p, { ...ref, aspirin: "none" }), "aspirin")!.correct).toBe(false);
    // without daily aspirin, 'continue' is still not an order for a patient with an anticoagulant
    const af = caseOf("oac-af-low-risk");
    const pa = patientOf("oac-af-low-risk");
    expect(verdict(scoreAntiplatelet(af, pa, { ...referenceOrders(af, pa).antiplatelet, aspirin: "continue", aspirinMg: null }), "aspirin")!.correct).toBe(false);
  });

  it("with an oral anticoagulant only clopidogrel fits, and stable disease takes clopidogrel", () => {
    const af = caseOf("oac-af-low-risk");
    const p = patientOf("oac-af-low-risk");
    const b = referenceOrders(af, p).antiplatelet;
    expect(b.p2y12).toBe("clopidogrel");
    expect(verdict(scoreAntiplatelet(af, p, { ...b, p2y12: "ticagrelor", p2y12Mg: 180 }), "p2y12-agent")!.correct).toBe(false);
    const el = caseOf("elective-pci-preload");
    const pe = patientOf("elective-pci-preload");
    expect(verdict(scoreAntiplatelet(el, pe, { ...referenceOrders(el, pe).antiplatelet, p2y12: "prasugrel", p2y12Mg: 60 }), "p2y12-agent")!.correct).toBe(false);
  });

  it("timing: elective PCI preloaded at least 6 h before; no pretreatment in NSTE-ACS before early angiography; an IV agent after an opioid", () => {
    const el = caseOf("elective-pci-preload");
    const pe = patientOf("elective-pci-preload");
    const eb = referenceOrders(el, pe).antiplatelet;
    const t = (c: PreorderCase, p: PreorderPatient, a: typeof eb) => verdict(scoreAntiplatelet(c, p, a), "p2y12-timing")!.correct;
    expect(t(el, pe, { ...eb, timing: "before", hoursBefore: 8 })).toBe(true);
    expect(t(el, pe, { ...eb, timing: "before", hoursBefore: 2 })).toBe(false);
    expect(t(el, pe, { ...eb, timing: "at-pci", hoursBefore: null })).toBe(false);
    expect(t(el, pe, { ...eb, p2y12Mg: 300, timing: "before", hoursBefore: 72 })).toBe(true);
    const nste = caseOf("nste-early-angio");
    const pn = patientOf("nste-early-angio");
    const nb = referenceOrders(nste, pn).antiplatelet;
    expect(t(nste, pn, { ...nb, timing: "at-pci" })).toBe(true);
    expect(t(nste, pn, { ...nb, timing: "before", hoursBefore: 12 })).toBe(false);
    const stemi = caseOf("stemi-opioids");
    const ps = patientOf("stemi-opioids");
    const sb = referenceOrders(stemi, ps).antiplatelet;
    expect(verdict(scoreAntiplatelet(stemi, ps, { ...sb, ivAgent: true }), "iv-agent")!.correct).toBe(true);
    expect(verdict(scoreAntiplatelet(stemi, ps, { ...sb, ivAgent: false }), "iv-agent")!.correct).toBe(false);
  });

  it("loads go through the formulary's onset curves: a preload 8 h before is acting when the case starts; a load at PCI only at the hand-over", () => {
    const pre = signed("elective-pci-preload", (o) => Object.assign(o.antiplatelet, { timing: "before", hoursBefore: 8 }));
    const atPci = signed("elective-pci-preload", (o) => Object.assign(o.antiplatelet, { timing: "at-pci", hoursBefore: null }));
    pre.s.wait(5);
    pre.s.runPending();
    atPci.s.wait(5);
    atPci.s.runPending();
    const p2y12 = (e: typeof pre.engine) => e.vitals().antithrombotic.p2y12;
    expect(p2y12(pre.engine)).toBeGreaterThan(0.3);
    expect(p2y12(atPci.engine)).toBeLessThan(0.05);
    // the dose is recorded before the case, and the handover carries it
    expect(pre.s.antithrombotic().p2y12).toMatchObject({ drug: "clopidogrel", dose: 600 });
    expect(pre.s.antithrombotic().p2y12!.at).toBeLessThan(-7 * 3600);
    // aged on the formulary's own pharmacology: the same as stepping the drug for 8 h
    const ph = new Pharmacology(80);
    ph.give({ drug: "clopidogrel", dose: 600, route: "oral" });
    const fresh = JSON.parse(JSON.stringify(ph.st.boluses[0]));
    for (let i = 0; i < 8 * 60; i++) ph.step(60);
    expect(ageBolus(fresh, 80, 8 * 3600)!.e).toBeCloseTo(ph.st.boluses[0].e, 6);
    // crushed is faster than whole over the same hour
    const whole = new Pharmacology(80);
    whole.give({ drug: "ticagrelor", dose: 180, route: "oral" });
    const crushed = new Pharmacology(80);
    crushed.give({ drug: "ticagrelor", dose: 180, route: "crushed" });
    expect(ageBolus(crushed.st.boluses[0], 80, 3600)!.e).toBeGreaterThan(ageBolus(whole.st.boluses[0], 80, 3600)!.e);
  });

  it("the patient's own daily aspirin travels in the handover's antithrombotics, and the record does not call it a load", () => {
    const { s } = signed("elective-pci-preload");
    expect(mod(s).state!.signed!.orders.antiplatelet.aspirin).toBe("continue");
    const meds = planningOf(s)!.state.record.items.find((i) => i.id === "medications")!.lines.join(" ");
    expect(meds).toMatch(/Aspirin 75 mg daily/);
    expect(meds).not.toMatch(/Aspirin \d+ mg loading dose/);
    prepare(s, { record: false });
    fastForward(s, "post-diagnostic");
    const h = s.toPci()!;
    expect(h.antithrombotic!.aspirin).not.toBeNull();
    expect(h.antithrombotic!.aspirin!.at).toBeLessThan(0);
    // a patient not on aspirin has none before the sheet gives one
    const n = newCaseSession({ scenario: "nste-early-angio" }).session;
    expect(n.antithrombotic().aspirin).toBeNull();
  });

  it("STEMI after morphine: the oral load and cangrelor are given at the hand-over to PCI, and the handover carries the infusion", () => {
    const { s } = signed("stemi-opioids");
    expect(decision(s, "preorders-iv-agent")!.correct).toBe(true);
    prepare(s, { record: false });
    fastForward(s, "post-diagnostic");
    expect(s.antithrombotic().p2y12).toBeNull();
    const eng = s.patient as unknown as { pharm: Pharmacology };
    const h = s.toPci()!;
    // the opioid given before arrival delays the oral load (the formulary's interaction)
    const b = eng.pharm.st.boluses.find((x) => x.drug === "prasugrel")!;
    expect(b.tauAbs).toBeCloseTo((ORAL_ONSET_S.prasugrel.oral / 3) * OPIOID_P2Y12.peakDelay, 3);
    expect(h).not.toBeNull();
    expect(h.antithrombotic!.p2y12).toMatchObject({ drug: "prasugrel", dose: 60 });
    expect(h.antithrombotic!.infusions.map((i) => i.drug)).toContain("cangrelor");
  });
});

describe("kidney protection", () => {
  it("in 'ckd-low-ef' a saline rate above the tailored rate raises LVEDP and pulmonary-oedema", () => {
    const run = (rate: number) => {
      const r = signed("ckd-low-ef", (o) => Object.assign(o.kidney, { salineMlKgH: rate, salineBeforeH: 12, salineAfterH: 12 }));
      r.s.wait(900);
      r.s.runPending();
      return r;
    };
    const tailored = run(1);
    const over = run(3);
    expect(decision(tailored.s, "preorders-saline")!.correct).toBe(true);
    expect(decision(over.s, "preorders-saline")!.correct).toBe(false);
    expect(over.engine.vitals().lvedp).toBeGreaterThan(tailored.engine.vitals().lvedp + 5);
    // the saturation falls with the oedema (tipIntegration: breathlessness and desaturation)
    expect(over.engine.vitals().spo2!).toBeLessThan(tailored.engine.vitals().spo2!);
    expect(over.s.activeEvents()).toContain("pulmonary-oedema");
    expect(tailored.s.activeEvents()).not.toContain("pulmonary-oedema");
    // the same rate in a normal ventricle is within Brilakis's range and keeps the patient dry
    const normal = signed("ckd-egfr-28-metformin-nsaid", (o) => Object.assign(o.kidney, { salineMlKgH: 3, salineBeforeH: 12, salineAfterH: 12 }));
    normal.s.wait(900);
    normal.s.runPending();
    expect(decision(normal.s, "preorders-saline")!.correct).toBe(true);
    expect(normal.s.activeEvents()).not.toContain("pulmonary-oedema");
  });

  it("acetylcysteine is a wrong decision; holding metformin with a 48 h creatinine plan is correct; the time-out ceiling appears in the SessionHandover", () => {
    const id = "ckd-egfr-28-metformin-nsaid";
    const c = caseOf(id);
    const p = patientOf(id);
    const ref = referenceOrders(c, p).kidney;
    expect(verdict(scoreKidney(c, p, { ...ref, acetylcysteine: true }), "acetylcysteine")!.correct).toBe(false);
    expect(verdict(scoreKidney(c, p, { ...ref, bicarbonate: true }), "bicarbonate")!.correct).toBe(false);
    expect(verdict(scoreKidney(c, p, { ...ref, metformin: "hold", metforminRestartH: 48, creatinine48h: true }), "metformin")!.correct).toBe(true);
    expect(verdict(scoreKidney(c, p, { ...ref, metformin: "continue" }), "metformin")!.correct).toBe(false);
    expect(verdict(scoreKidney(c, p, { ...ref, metformin: "hold", metforminRestartH: 24 }), "metformin")!.correct).toBe(false);
    expect(verdict(scoreKidney(c, p, { ...ref, nsaid: "continue" }), "nsaid")!.correct).toBe(false);
    expect(verdict(scoreKidney(c, p, { ...ref, statin: "stop" }), "statin")!.correct).toBe(false);
    expect(verdict(scoreKidney(c, p, { ...ref, creatinineDay4to5: false }), "creatinine")!.correct).toBe(false);

    const { session: s } = newCaseSession({ scenario: id });
    const m = mod(s);
    expect(m.actions.sign({ ...referenceOrders(c, p), ceilingMl: null, kidney: { ...ref, acetylcysteine: true } })).toBe(true);
    s.runPending();
    expect(decision(s, "preorders-acetylcysteine")!.correct).toBe(false);
    expect(decision(s, "preorders-metformin")!.correct).toBe(true);
    expect(planningOf(s)!.state.record.items.find((i) => i.id === "medications")!.lines.join(" ")).toMatch(/Metformin: held/);
    // the renal item of the time-out waits for a stated ceiling
    s.reviewChart("renal");
    s.runPending();
    s.confirmTimeOutItem("renal");
    expect(s.timeOut.checked.renal).toBeFalsy();
    expect(s.attending[s.attending.length - 1].text).toMatch(/contrast ceiling/);
    const ceiling = Math.floor(ceilingLimitMl(p)) - 5;
    expect(m.actions.stateCeiling(ceiling)).toBe(true);
    s.runPending();
    prepare(s, { record: false });
    expect(s.timeOutDone).toBe(true);
    expect(decision(s, "preorders-ceiling")!.correct).toBe(true);
    fastForward(s, "post-diagnostic");
    const h = s.toPci()!;
    expect(h.contrastBudgetMl).toBe(ceiling);
    expect(h.contrast).toMatchObject({ budgetMl: ceiling });
  });

  it("the nurse's calls and 'high-contrast-volume' follow the stated ceiling, never the rules' lower limit", () => {
    const id = "ckd-egfr-28-metformin-nsaid";
    const p = patientOf(id);
    expect(ceilingLimitMl(p)).toBeLessThan(110);
    /** Sign with a 400 mL ceiling, go to PCI and come back with the case's contrast at `totalMl`. */
    const run = (totalMl: number) => {
      const { s } = signed(id, (o) => (o.ceilingMl = 400));
      prepare(s, { record: false });
      fastForward(s, "post-diagnostic");
      expect(s.toPci()).not.toBeNull();
      const used = mod(s).actions.budget()!.usedMl;
      expect(used).toBeLessThan(totalMl);
      s.returnFromLab("pci", { contrastMl: totalMl - used, fluoroS: 300, durationS: 0 });
      s.runPending();
      s.wait(5);
      s.runPending();
      return s;
    };
    const nurse = (s: CaseSession) => s.log.filter((l) => l.kind === "nurse" && /ceiling/.test(l.text)).map((l) => l.text);
    // past the rules' limit (about 104 mL here) but well inside the stated 400 mL: nothing is called
    const low = run(110);
    // the module's own event (other sources, such as the case's total load, have their own thresholds)
    const own = (s: CaseSession) => mod(s).events?.() ?? [];
    expect(nurse(low)).toEqual([]);
    expect(own(low)).not.toContain("high-contrast-volume");
    expect(low.activeEvents()).not.toContain("high-contrast-volume");
    // half of the stated ceiling is called by the stated figure; the warning waits for 0.8 of it
    const half = run(210);
    expect(nurse(half).some((t) => /half of the 400 mL ceiling/.test(t))).toBe(true);
    expect(nurse(half).some((t) => /that is the 400 mL ceiling/.test(t))).toBe(false);
    expect(own(half)).not.toContain("high-contrast-volume");
    const warn = run(330);
    expect(own(warn)).toContain("high-contrast-volume");
    expect(warn.activeEvents()).toContain("high-contrast-volume");
    // a jump past the stated ceiling is called as past it, once, and not also as half of it
    const over = run(450);
    expect(nurse(over)).toEqual(["Contrast 450 mL: past the 400 mL ceiling."]);
  });

  it("the ceiling is checked with contrastBudget.ts: above the stricter rule, or above twice the clearance with an eGFR below 30, is wrong", () => {
    const p = patientOf("ckd-egfr-28-metformin-nsaid");
    expect(p.egfr).toBeLessThan(30);
    const lim = ceilingLimitMl(p);
    expect(lim).toBeLessThanOrEqual(2 * p.crclMlMin);
    expect(lim).toBeLessThanOrEqual(Math.round(3.7 * p.egfr * 10) / 10);
    expect(scoreCeiling(p, lim).correct).toBe(true);
    expect(scoreCeiling(p, lim + 20).correct).toBe(false);
    expect(scoreCeiling(p, null).correct).toBe(false);
    // a weight-based ceiling (Oxford) is far too generous here
    expect(scoreCeiling(p, 5 * p.weightKg).correct).toBe(false);
  });

  it("catheters: 5 Fr without side holes is scored at the first catheter for a kidney at risk", () => {
    const { s } = signed("ckd-low-ef");
    expect(mod(s).actions.setCatheterSet("side-holes")).toBe(true);
    // the log keeps the label's own units ("Fr", not "fr")
    expect(s.log.some((l) => l.text === "Diagnostic catheters: catheters with side holes.")).toBe(true);
    mod(s).actions.setCatheterSet("5fr-no-side-holes");
    expect(s.log.some((l) => l.text === "Diagnostic catheters: 5 Fr, without side holes.")).toBe(true);
    mod(s).actions.setCatheterSet("side-holes");
    mod(s).actions.stateCeiling(40);
    s.runPending();
    prepare(s, { record: false });
    fastForward(s, "post-diagnostic");
    expect(decision(s, "preorders-catheters")!.correct).toBe(false);
    expect(mod(s).actions.setCatheterSet("5fr-no-side-holes")).toBe(false);
  });
});

describe("the sheet in the case", () => {
  it("an incomplete sheet is refused with what is missing; a signed sheet cannot be signed twice", () => {
    const { session: s } = newCaseSession({ scenario: "oac-af-low-risk" });
    const m = mod(s);
    expect(m.actions.sign(emptyOrders())).toBe(false);
    expect(m.state!.note).toMatch(/anticoagulant plan/);
    expect(m.actions.sign(referenceOrders(caseOf("oac-af-low-risk"), preorderPatient(s.profile)))).toBe(true);
    s.runPending();
    expect(m.actions.sign()).toBe(false);
  });

  it("the signed-orders log line records the aspirin order with the rest of the sheet", () => {
    const line = (s: CaseSession) => s.log.find((l) => /^Pre-procedure orders signed:/.test(l.text))!.text;
    const load = signed("oac-af-low-risk", (o) => {
      o.antiplatelet.aspirin = "load";
      o.antiplatelet.aspirinMg = 300;
      o.antiplatelet.timing = "before";
      o.antiplatelet.hoursBefore = 12;
    });
    expect(line(load.s)).toMatch(/Aspirin 300 mg load 12 h before; Clopidogrel 600 mg 12 h before/);
    const peri = signed("oac-af-low-risk", (o) => {
      o.antiplatelet.aspirin = "peri-procedural";
      o.antiplatelet.aspirinMg = 300;
    });
    expect(line(peri.s)).toMatch(/Aspirin 300 mg at the PCI/);
    const cont = signed("oac-af-low-risk", (o) => {
      o.antiplatelet.aspirin = "continue";
      o.antiplatelet.aspirinMg = null;
    });
    expect(line(cont.s)).toMatch(/Aspirin continued/);
  });

  it("the module is inactive outside its scenarios, and a case opened past the chart had its orders written by the team", () => {
    const { session: d } = newCaseSession({ seed: "preorders-default", access: "radial-right" });
    expect(preordersOf(d)).toBeUndefined();
    const { session: s } = newCaseSession({ scenario: "ckd-low-ef", start: "access" });
    const m = mod(s);
    expect(m.state!.byTeam).toBe(true);
    expect(m.state!.signed).not.toBeNull();
    expect(s.timeOutDone).toBe(true);
    expect(s.contrastBudgetMl).toBe(m.state!.ceilingMl);
    expect(s.decisions().filter((x) => x.id.startsWith("preorders-"))).toEqual([]);
  });

  it("the record shows the sheet: the order sheet's medicines replace the record's own lines, and the P2Y12 screen is in the notes", () => {
    const { session: s } = newCaseSession({ scenario: "stemi-opioids" });
    const lines = planningOf(s)!.state.record.items.find((i) => i.id === "medications")!.lines.join(" ");
    expect(lines).not.toMatch(/loading dose given on admission/);
    expect(lines).toMatch(/Clarithromycin/);
    expect(lines).toMatch(/Morphine/);
    const n = newCaseSession({ scenario: "nste-early-angio" }).session;
    expect(planningOf(n)!.state.record.items.find((i) => i.id === "pre-assessment")!.lines.join(" ")).toMatch(/stroke/);
  });

  it("every scenario's planted planning problem is a chart-only one that does not touch the order sheet", () => {
    for (const sc of PREORDER_SCENARIOS) {
      const { session: s } = newCaseSession({ scenario: sc.id });
      expect(["bloods-old", "dnacpr-unsuspended"], sc.id).toContain(planningOf(s)!.state.record.planted);
      expect(preordersOf(s), sc.id).toBeDefined();
      s.dispose();
    }
  });
});

describe("links", () => {
  it("practiceIndex lists the scenarios oac-af-low-risk, oac-mechanical-valve, oac-rheumatic-mitral under lessons pm-antithrombotics-oac, pm-antithrombotics-oral, cm-patient-complications-kidney (from src/simulation/session/scenarios/preorders.launch.ts)", () => {
    for (const lessonId of ["pm-antithrombotics-oac", "pm-antithrombotics-oral", "cm-patient-complications-kidney"]) {
      const entries = practiceForLesson(lessonId).filter((e) => e.sim === "procedure");
      for (const id of ["oac-af-low-risk", "oac-mechanical-valve", "oac-rheumatic-mitral"]) expect(entries.some((e) => e.scenario === id && e.params.scenario === id), `${lessonId}: ${id}`).toBe(true);
    }
    expect(PRACTICE_INDEX.known.problems.filter((p) => p.includes("preorders.launch"))).toEqual([]);
  });

  it("the launch file, the scenario file and the case facts agree, and every lesson resolves", () => {
    expect(preordersLaunch.sim).toBe("procedure");
    expect(preordersLaunch.scenarios!.map((x) => x.id)).toEqual(PREORDER_SCENARIOS.map((x) => x.id));
    expect(Object.keys(PREORDER_CASES).sort()).toEqual(PREORDER_SCENARIOS.map((x) => x.id).sort());
    for (const sc of preordersLaunch.scenarios ?? []) {
      expect(SCENARIO_BY_ID[sc.id].title).toBe(sc.title);
      expect(SCENARIO_BY_ID[sc.id].lessonIds).toEqual(sc.lessonIds);
      for (const l of sc.lessonIds) expect(LESSON_IDS.has(l), l).toBe(true);
    }
  });

  it("the reference orders score correct in every scenario", () => {
    for (const sc of PREORDER_SCENARIOS) {
      const c = caseOf(sc.id);
      const p = patientOf(sc.id);
      const o = referenceOrders(c, p);
      expect(missingOrders(c, o), sc.id).toEqual([]);
      const wrong = [...scoreOac(c, p, o.oac), ...scoreAntiplatelet(c, p, o.antiplatelet), ...scoreKidney(c, p, o.kidney), scoreCeiling(p, o.ceilingMl)].filter((v) => !v.correct);
      expect(wrong.map((v) => `${v.id}: ${v.given} / ${v.expected}`), sc.id).toEqual([]);
    }
  });
});
