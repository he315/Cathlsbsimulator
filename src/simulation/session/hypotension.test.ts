// proc-hypotension-pressors: hypotension by mechanism in the full case, the pressor and inotrope
// infusions, escalation, and pulmonary oedema from a fluid load.
//   npx vitest run src/simulation/session/hypotension.test.ts
import { describe, expect, it } from "vitest";
import { newCaseSession, type CaseSession } from "./caseSession";
import { CASE_SESSION_MODULES } from "./modules/index";
import { HYPOTENSION_MODULE_ID, hypotensionOf } from "./modules/hypotension";
import { MP_HYPOTENSION, dobutamineStartVerdict, nitrateVerdict, pumpMlPerHour, PUMP_BY_DRUG } from "./hypotension";
import { scenarios } from "./scenarios/hypotension";
import { launch } from "./scenarios/hypotension.launch";
import { PatientEngine } from "../patient/engine";
import { RHC_REFERENCE } from "../patient/hypotensionCauses";
import { generatePatient } from "../patient/patient";
import { PRACTICE_INDEX, practiceForLesson } from "../../ui/content/practiceIndex";
import { TIP_BY_ID } from "../../content/lab/tips";

/** Step the session in `stepS` slices until `pred` holds (at most `maxS`); returns whether it did. */
function waitUntil(s: CaseSession, pred: () => boolean, maxS: number, stepS = 5): boolean {
  for (let t = 0; t <= maxS; t += stepS) {
    if (pred()) return true;
    s.wait(stepS);
    s.runPending();
  }
  return pred();
}
const lapse = (s: CaseSession, sec: number) => {
  s.wait(sec);
  s.runPending();
};
const decision = (s: CaseSession, id: string) => s.decisions().find((d) => d.id === id);
const lowShown = (s: CaseSession) => () => s.activeEvents().includes("hypotension");

describe("confirm it is real", () => {
  it("'hypo-false-transducer' scores a pressor before levelling wrong", () => {
    const { session: s, engine: e } = newCaseSession({ scenario: "hypo-false-transducer" });
    const m = hypotensionOf(s)!;
    expect(waitUntil(s, lowShown(s), 120)).toBe(true);
    // the line reads low; the patient's own pressure is not
    const v = e.vitals();
    expect(v.art!.mean).toBeLessThan(65);
    expect(v.aortaTrue.mean).toBeGreaterThan(75);
    expect(m.actions.setPump("noradrenaline", 0.1).ok).toBe(true);
    const d = decision(s, "hypotension-confirmed")!;
    expect(d.correct).toBe(false);
    expect(d.given).toMatch(/before levelling/);
    expect(decision(s, "hypotension-bridge-drug")!.correct).toBe(false);
  });

  it("a check made before the module's episode opens still counts (a cuff at the start of 'hypo-arrhythmia')", () => {
    const { session: s } = newCaseSession({ scenario: "hypo-arrhythmia" });
    const m = hypotensionOf(s)!;
    expect(m.actions.order("cuff").ok).toBe(true);
    expect(m.actions.setPump("isoprenaline", 5).ok).toBe(true);
    const d = decision(s, "hypotension-confirmed")!;
    expect(d).toBeDefined();
    expect(d.correct).toBe(true);
    expect(m.state.episodes.length).toBeGreaterThan(0);
  });

  it("a wrong first pressor stays wrong when a later episode's pressor is given after a check", () => {
    const { session: s, engine: e } = newCaseSession({ scenario: "hypo-false-transducer" });
    const m = hypotensionOf(s)!;
    expect(waitUntil(s, lowShown(s), 120)).toBe(true);
    m.actions.order("phenylephrine-100");
    expect(decision(s, "hypotension-confirmed")!.correct).toBe(false);
    // level: the reading is the patient's own, and the episode closes
    m.actions.order("level");
    s.runPending();
    expect(waitUntil(s, () => m.state.episodes.every((x) => x.done), MP_HYPOTENSION.episodeCloseS + 300, 10)).toBe(true);
    // a second, real low pressure; checked against a cuff and the trace, then a pressor
    let vd = 0.4;
    const lowered = () => {
      if (m.state.episodes.length > 1) return true;
      vd = Math.min(0.95, vd + 0.05);
      e.setVasodilation(vd);
      return false;
    };
    expect(waitUntil(s, lowered, 900, 10)).toBe(true);
    m.actions.order("cuff");
    m.actions.order("check-trace");
    m.actions.setPump("noradrenaline", 0.1);
    expect(m.state.episodes[m.state.episodes.length - 1].firstVasoactive).not.toBeNull();
    expect(decision(s, "hypotension-confirmed")!.correct).toBe(false);
  });

  it("levelling first is scored right, and the trace then reads the patient's own pressure", () => {
    const { session: s, engine: e } = newCaseSession({ scenario: "hypo-false-transducer" });
    const m = hypotensionOf(s)!;
    expect(waitUntil(s, lowShown(s), 120)).toBe(true);
    expect(m.actions.order("level").ok).toBe(true);
    s.runPending();
    lapse(s, 10);
    expect(Math.abs(e.vitals().art!.mean - e.vitals().aortaTrue.mean)).toBeLessThan(8);
    m.actions.setPump("phenylephrine", 0.5);
    expect(decision(s, "hypotension-confirmed")!.correct).toBe(true);
    expect(m.state.cause!.stoppedT).not.toBeNull();
  });
});

describe("the right heart read-out", () => {
  it("in 'hypo-bleeding' shows a low RA and a low output; in 'hypo-ischaemia' a high wedge and a low output", () => {
    const b = newCaseSession({ scenario: "hypo-bleeding" }).session;
    expect(waitUntil(b, lowShown(b), 900)).toBe(true);
    const mb = hypotensionOf(b)!;
    expect(mb.actions.order("rhc").ok).toBe(true);
    const rb = mb.state.rhc!;
    // no venous sheath in this case: a modelled reading, with its note
    expect(rb.measured).toBe(false);
    expect(rb.note).toMatch(/venous sheath/);
    expect(rb.raMmHg).toBeLessThan(RHC_REFERENCE.raLowMmHg);
    expect(rb.ci).toBeLessThan(RHC_REFERENCE.ciTypical[0]);
    expect(rb.pattern.mechanism).toBe("hypovolaemia");
    expect(b.log.some((l) => l.kind === "result" && /^RA \d+, PA mean \d+, wedge \d+ mmHg/.test(l.text))).toBe(true);

    const i = newCaseSession({ scenario: "hypo-ischaemia" }).session;
    expect(waitUntil(i, lowShown(i), 900)).toBe(true);
    const mi = hypotensionOf(i)!;
    mi.actions.order("rhc");
    const ri = mi.state.rhc!;
    expect(ri.pcwpMmHg).toBeGreaterThan(RHC_REFERENCE.wedgeHighMmHg);
    expect(ri.ci).toBeLessThan(RHC_REFERENCE.ciTypical[0]);
    expect(ri.pattern.mechanism).toBe("cardiac");
    // saying the mechanism is scored against the cause
    mi.actions.nameMechanism("cardiac");
    expect(decision(i, "hypotension-mechanism")!.correct).toBe(true);
  });
});

describe("drugs against the mechanism", () => {
  it("dobutamine started at 20 µg/kg/min is scored as starting high; a low start is right", () => {
    expect(dobutamineStartVerdict(20).correct).toBe(false);
    expect(dobutamineStartVerdict(20).given).toMatch(/high/);
    expect(dobutamineStartVerdict(2.5).correct).toBe(true);
    expect(dobutamineStartVerdict(30).correct).toBe(false);
    const { session: s } = newCaseSession({ scenario: "hypo-ischaemia" });
    expect(waitUntil(s, lowShown(s), 900)).toBe(true);
    hypotensionOf(s)!.actions.setPump("dobutamine", 20);
    const d = decision(s, "dobutamine-start")!;
    expect(d.correct).toBe(false);
    expect(d.given).toMatch(/Started high, at 20/);
  });

  it("in 'hypo-hcm' an inotrope worsens the pressure and phenylephrine is correct", () => {
    const arm = (give: (s: CaseSession) => void) => {
      const { session: s, engine: e } = newCaseSession({ scenario: "hypo-hcm" });
      expect(waitUntil(s, lowShown(s), 300)).toBe(true);
      hypotensionOf(s)!.actions.order("cuff");
      give(s);
      lapse(s, 240);
      return { s, map: e.vitals().aortaTrue.mean };
    };
    const none = arm(() => {});
    const dob = arm((s) => hypotensionOf(s)!.actions.setPump("dobutamine", 5));
    const phe = arm((s) => {
      hypotensionOf(s)!.actions.order("phenylephrine-100");
      hypotensionOf(s)!.actions.setPump("phenylephrine", 0.5);
    });
    expect(dob.map).toBeLessThan(none.map - 5);
    expect(phe.map).toBeGreaterThan(none.map + 5);
    const bd = decision(dob.s, "hypotension-bridge-drug")!;
    expect(bd.correct).toBe(false);
    expect(bd.given).toMatch(/obstruction/);
    expect(decision(phe.s, "hypotension-bridge-drug")!.correct).toBe(true);
    // the line was checked against a cuff first in both
    expect(decision(phe.s, "hypotension-confirmed")!.correct).toBe(true);
    for (const id of decision(phe.s, "hypotension-bridge-drug")!.tipIds ?? []) expect(TIP_BY_ID[id], id).toBeDefined();
  });

  it("an inotrope started with no check of the line is named as an inotrope in the debrief", () => {
    const { session: s } = newCaseSession({ scenario: "hypo-ischaemia" });
    expect(waitUntil(s, lowShown(s), 900)).toBe(true);
    hypotensionOf(s)!.actions.setPump("dobutamine", 20);
    const d = decision(s, "hypotension-confirmed")!;
    expect(d.correct).toBe(false);
    expect(d.given).toBe("An inotrope with no check of the line");
  });

  it("in 'hypo-hcm' phenylephrine started after a stopped inotrope still lifts the pressure within 5 minutes", () => {
    const { session: s, engine: e } = newCaseSession({ scenario: "hypo-hcm" });
    const m = hypotensionOf(s)!;
    expect(waitUntil(s, lowShown(s), 900)).toBe(true);
    m.actions.order("cuff");
    lapse(s, 40);
    // the wrong drug first: a short dobutamine trial, stopped, then a wait while it washes out
    m.actions.setPump("dobutamine", 5);
    lapse(s, 120);
    m.actions.stopPump("dobutamine");
    for (let k = 0; k < 10; k++) lapse(s, 60);
    const before = e.vitals().aortaTrue.mean;
    // the outflow obstruction holds the pressure down with no drug running
    lapse(s, 60);
    expect(e.vitals().aortaTrue.mean).toBeLessThan(before + 5);
    const start = e.vitals().aortaTrue.mean;
    m.actions.setPump("phenylephrine", 0.5);
    let best = start;
    for (let k = 0; k < 5; k++) {
      lapse(s, 60);
      best = Math.max(best, e.vitals().aortaTrue.mean);
    }
    expect(best).toBeGreaterThan(start + 5);
  });

  it("'hypo-bleeding': a vasopressor first is wrong and does not hold the pressure; control and volume do", () => {
    const run = (treat: (s: CaseSession) => void) => {
      const { session: s, engine: e } = newCaseSession({ scenario: "hypo-bleeding" });
      expect(waitUntil(s, lowShown(s), 900)).toBe(true);
      hypotensionOf(s)!.actions.order("cuff");
      treat(s);
      lapse(s, 600);
      return { s, map: e.vitals().aortaTrue.mean };
    };
    const pressor = run((s) => hypotensionOf(s)!.actions.setPump("noradrenaline", 0.2));
    const cause = run((s) => {
      const m = hypotensionOf(s)!;
      m.actions.order("control-bleeding");
      m.actions.order("saline-1000");
      m.actions.order("blood-unit");
    });
    expect(decision(pressor.s, "hypotension-bridge-drug")!.correct).toBe(false);
    expect(decision(pressor.s, "hypotension-bridge-drug")!.given).toMatch(/before the cause was treated/);
    expect(decision(cause.s, "hypotension-cause-treated")!.correct).toBe(true);
    expect(cause.map).toBeGreaterThan(pressor.map + 10);
    expect(cause.map).toBeGreaterThan(65);
    // the pressor arm left the cause untreated past its window (measured from the episode's onset)
    expect(waitUntil(pressor.s, () => !!decision(pressor.s, "hypotension-cause-treated"), MP_HYPOTENSION.causeTreatWithinS + 300, 10)).toBe(true);
    const untreated = decision(pressor.s, "hypotension-cause-treated")!;
    expect(untreated.correct).toBe(false);
    expect(untreated.given).toMatch(/Not within/);
  });
});

describe("escalation and doses", () => {
  it("rising noradrenaline in ischaemic shock brings the question; mechanical support is right", () => {
    const { session: s } = newCaseSession({ scenario: "hypo-ischaemia" });
    const m = hypotensionOf(s)!;
    expect(waitUntil(s, lowShown(s), 900)).toBe(true);
    m.actions.order("check-trace");
    m.actions.setPump("noradrenaline", 0.1);
    expect(decision(s, "hypotension-bridge-drug")!.correct).toBe(true);
    expect(m.state.escalation).toBeNull();
    m.actions.setPump("noradrenaline", 0.6);
    lapse(s, 10);
    expect(m.state.escalation).not.toBeNull();
    expect(s.log.some((l) => l.kind === "attending" && /more drug, or support/.test(l.text))).toBe(true);
    m.actions.escalate("support", "impella");
    const d = decision(s, "pressor-escalation")!;
    expect(d.correct).toBe(true);
    expect(d.tipIds).toContain("mcs-pressor-escalation-limit");
  });

  it("mechanical support is not the answer for tamponade or heart block: the cause is drained or paced", () => {
    for (const [scenario, drug, rate] of [
      ["hypo-tamponade", "noradrenaline", 0.7],
      ["hypo-arrhythmia", "isoprenaline", 15],
    ] as const) {
      const { session: s } = newCaseSession({ scenario });
      const m = hypotensionOf(s)!;
      m.actions.order("cuff");
      m.actions.setPump(drug, rate);
      lapse(s, 10);
      expect(m.state.escalation, scenario).not.toBeNull();
      m.actions.escalate("support", "impella");
      const d = decision(s, "pressor-escalation")!;
      expect(d.correct, scenario).toBe(false);
      expect(d.expected, scenario).toMatch(/^Treat the cause: /);
    }
  });

  it("in 'hypo-ischaemia' choosing support treats the cause; the clock never scores it untreated", () => {
    const { session: s } = newCaseSession({ scenario: "hypo-ischaemia" });
    const m = hypotensionOf(s)!;
    expect(waitUntil(s, lowShown(s), 900)).toBe(true);
    m.actions.order("cuff");
    m.actions.setPump("noradrenaline", 0.6);
    lapse(s, 10);
    expect(m.actions.escalate("support", "impella").ok).toBe(true);
    lapse(s, 900);
    const d = decision(s, "hypotension-cause-treated");
    expect(d?.correct ?? true).toBe(true);
    expect(d).toBeDefined();
  });

  it("a pressor left up once the cause is fixed gives rebound hypertension, scored unless it is reduced", () => {
    const arm = (reduce: boolean) => {
      const { session: s, engine: e } = newCaseSession({ scenario: "hypo-bleeding" });
      const m = hypotensionOf(s)!;
      expect(waitUntil(s, lowShown(s), 900)).toBe(true);
      for (const id of ["cuff", "control-bleeding", "saline-1000", "blood-unit"] as const) m.actions.order(id);
      m.actions.setPump("noradrenaline", 0.3);
      expect(waitUntil(s, () => m.state.rebound.reportedT !== null, 900)).toBe(true);
      expect(e.vitals().aortaTrue.mean).toBeGreaterThan(MP_HYPOTENSION.reboundMapMmHg);
      if (reduce) m.actions.stopPump("noradrenaline");
      lapse(s, MP_HYPOTENSION.reboundReduceWithinS + 30);
      return decision(s, "pressor-weaned")!;
    };
    expect(arm(false).correct).toBe(false);
    expect(arm(true).correct).toBe(true);
  });

  it("a dose above its range brings non-sustained runs of VT in time, recurring while it stays high and stopping once it is back in range", () => {
    const { session: s, engine: e } = newCaseSession({ scenario: "hypo-pde5-nitrate" });
    const m = hypotensionOf(s)!;
    m.actions.order("cuff");
    m.actions.setPump("noradrenaline", 0.8);
    expect(waitUntil(s, () => m.state.arrhythmia !== null, 1800, 5)).toBe(true);
    lapse(s, 5); // the monitor shows the forced rhythm from the next step of the patient
    expect(e.vitals().rhythmKind).toBe("vt");
    expect(s.log.some((l) => l.kind === "nurse" && /Runs of broad-complex tachycardia/.test(l.text))).toBe(true);
    // each run ends by itself (non-sustained), and another follows while the dose stays high
    lapse(s, MP_HYPOTENSION.arrhythmiaRunS + 5);
    expect(e.vitals().rhythmKind).toBe("sinus");
    lapse(s, MP_HYPOTENSION.arrhythmiaRunGapS);
    expect(m.state.arrhythmia!.runs).toBeGreaterThanOrEqual(2);
    m.actions.setPump("noradrenaline", 0.2);
    lapse(s, MP_HYPOTENSION.arrhythmiaSettleS + 30);
    expect(m.state.arrhythmia).toBeNull();
    expect(e.vitals().rhythmKind).toBe("sinus");
    expect(s.log.some((l) => /No further runs/.test(l.text))).toBe(true);
  });

  it("a run of VT in complete heart block leaves the block in place when it ends", () => {
    const { session: s, engine: e } = newCaseSession({ scenario: "hypo-arrhythmia" });
    const m = hypotensionOf(s)!;
    m.actions.order("cuff");
    expect(waitUntil(s, () => e.vitals().av === 3, 900, 5)).toBe(true);
    m.actions.setPump("adrenaline", 30);
    expect(waitUntil(s, () => m.state.arrhythmia !== null, 1800, 5)).toBe(true);
    lapse(s, MP_HYPOTENSION.arrhythmiaRunS + 5);
    expect(e.vitals().av).toBe(3);
  });

  it("a pump shows its mL/h from the strength, and the engine gets the rate in its own unit", () => {
    expect(pumpMlPerHour(PUMP_BY_DRUG.noradrenaline, 0.1, 40, 80)).toBe(12);
    const { session: s } = newCaseSession({ scenario: "hypo-pde5-nitrate" });
    const m = hypotensionOf(s)!;
    m.actions.setPump("noradrenaline", 0.1, { strength: 80 });
    const p = m.state.pumps.find((x) => x.drug === "noradrenaline")!;
    expect(p.mlPerHour).toBe(pumpMlPerHour(PUMP_BY_DRUG.noradrenaline, 0.1, 80, s.profile.weightKg));
    expect(p.line).toBe("peripheral");
    // noradrenaline runs in the engine at µg/min: 0.1 µg/kg/min times the weight
    lapse(s, 600);
    const tel = (s.patient as unknown as PatientEngine).pharm.infusionRateEq("noradrenaline" as never);
    expect(tel).toBeGreaterThan(0.1 * s.profile.weightKg * 0.8);
    expect(tel).toBeLessThan(0.1 * s.profile.weightKg * 1.2);
  });
});

describe("pulmonary oedema", () => {
  it("'oedema-lvedp-high' with a 1 L bolus drops SpO2 below 92; nitrate at SBP 95 is wrong", () => {
    const { session: s, engine: e } = newCaseSession({ scenario: "oedema-lvedp-high" });
    const m = hypotensionOf(s)!;
    // the handover names the LVEDP the engine shows, and the saturation is still above 92
    expect(s.log.some((l) => /LVEDP on the left heart pressure was \d+ mmHg/.test(l.text))).toBe(true);
    expect(e.vitals().spo2!).toBeGreaterThanOrEqual(92);
    m.actions.order("saline-1000");
    expect(waitUntil(s, () => (e.vitals().spo2 ?? 100) < 92, 900)).toBe(true);
    expect(decision(s, "oedema-fluid")!.correct).toBe(false);
    expect(waitUntil(s, () => m.events!().includes("pulmonary-oedema"), 300)).toBe(true);
    expect(s.log.some((l) => /Crackles at both lung bases/.test(l.text))).toBe(true);
    // the pressure falls to a systolic of 100 or below, then a nitrate is started
    let vd = 0.4;
    const lowered = () => {
      if (e.vitals().art!.sys <= 100) return true;
      vd = Math.min(0.9, vd + 0.02);
      e.setVasodilation(vd);
      return false;
    };
    expect(waitUntil(s, lowered, 600)).toBe(true);
    const sys = e.vitals().art!.sys;
    expect(sys).toBeGreaterThan(80);
    m.actions.setPump("gtn", 10);
    const d = decision(s, "oedema-nitrate")!;
    expect(d.correct).toBe(false);
    expect(nitrateVerdict(95).correct).toBe(false);
    expect(nitrateVerdict(120).correct).toBe(true);
  });

  it("oxygen, sitting up and furosemide within five minutes are scored as the first steps, and the saturation holds better than untreated", () => {
    const arm = (treat: boolean) => {
      const { session: s, engine: e } = newCaseSession({ scenario: "oedema-lvedp-high" });
      const m = hypotensionOf(s)!;
      m.actions.order("saline-1000");
      expect(waitUntil(s, () => m.state.oedema.onsetT !== null, 900)).toBe(true);
      if (treat) for (const id of ["oxygen", "sit-up", "furosemide-80", "cpap"] as const) m.actions.order(id);
      lapse(s, 920);
      return { s, spo2: e.vitals().spo2 ?? 0 };
    };
    const treated = arm(true);
    const untreated = arm(false);
    expect(decision(treated.s, "oedema-first-steps")!.correct).toBe(true);
    const missed = decision(untreated.s, "oedema-first-steps")!;
    expect(missed.correct).toBe(false);
    expect(missed.given).toMatch(/oxygen, sitting up, a loop diuretic/);
    expect(treated.spo2).toBeGreaterThan(untreated.spo2 + 5);
  });
});

describe("a random case is unchanged", () => {
  it("a random case with a low LVEF is scored on the oedema regimen but never against a cause", () => {
    let seed = "";
    for (let i = 0; i < 400 && !seed; i++) if (generatePatient(`hypo-lowef-${i}`).lvef < MP_HYPOTENSION.oedemaRiskLvef) seed = `hypo-lowef-${i}`;
    expect(seed).not.toBe("");
    const { session: s } = newCaseSession({ seed, access: "radial-right", start: "post-diagnostic" });
    const m = hypotensionOf(s)!;
    lapse(s, 30);
    expect(m.state.learnerFromT).not.toBeNull();
    m.actions.order("saline-1000");
    lapse(s, 600);
    expect(m.state.oedema.atRisk).toBe(true);
    expect(m.state.cause).toBeNull();
    const ids = s.decisions().map((d) => d.id);
    for (const id of ["hypotension-cause-treated", "hypotension-bridge-drug", "hypotension-mechanism"]) expect(ids).not.toContain(id);
    // the bolus is scored only where the LVEDP is raised (the engine's), and then as wrong
    const f = decision(s, "oedema-fluid");
    if (f) expect(f.correct).toBe(false);
  });

  it("the same seed gives the same patient with and without the module", () => {
    const without = CASE_SESSION_MODULES.filter((f) => f().id !== HYPOTENSION_MODULE_ID);
    const a = newCaseSession({ seed: "hypo-random-1", access: "radial-right", start: "post-diagnostic" });
    const b = newCaseSession({ seed: "hypo-random-1", access: "radial-right", start: "post-diagnostic", modules: without });
    lapse(a.session, 300);
    lapse(b.session, 300);
    expect(a.engine.vitals().aortaTrue.mean).toBeCloseTo(b.engine.vitals().aortaTrue.mean, 6);
    expect(a.engine.vitals().hr).toBe(b.engine.vitals().hr);
    expect(hypotensionOf(a.session)!.state.cause).toBeNull();
    expect(a.session.decisions().filter((d) => /hypotension|pressor|oedema|dobutamine/.test(d.id))).toEqual([]);
  });
});

describe("practice links", () => {
  it("practiceIndex lists hypo-bleeding, hypo-fasting and hypo-ischaemia under pm-lab-drugs-pressors and cm-flow-embolism-oedema-cholesterol", () => {
    for (const lesson of ["pm-lab-drugs-pressors", "cm-flow-embolism-oedema-cholesterol"])
      for (const id of ["hypo-bleeding", "hypo-fasting", "hypo-ischaemia"]) expect(practiceForLesson(lesson).some((p) => p.sim === "procedure" && p.scenario === id), `${id} under ${lesson}`).toBe(true);
    expect(practiceForLesson("cm-flow-embolism-oedema-cholesterol").some((p) => p.scenario === "oedema-lvedp-high")).toBe(true);
    expect(practiceForLesson("pm-monitoring-pressure").some((p) => p.scenario === "hypo-false-transducer")).toBe(true);
    for (const sc of scenarios) expect(PRACTICE_INDEX.known.scenarios.get("procedure")?.has(sc.id), sc.id).toBe(true);
  });

  it("the launch file lists the scenario file's ids, titles and lessons", () => {
    expect(launch.scenarios!.map((x) => x.id)).toEqual(scenarios.map((x) => x.id));
    for (const sc of scenarios) {
      const l = launch.scenarios!.find((x) => x.id === sc.id)!;
      expect(l.title).toBe(sc.title);
      expect(l.lessonIds).toEqual(sc.lessonIds);
    }
  });

  it("every scenario opens with its cause running and the learner in charge", () => {
    for (const sc of scenarios) {
      const { session: s } = newCaseSession({ scenario: sc.id });
      const m = hypotensionOf(s)!;
      expect(m.state.learnerFromT, sc.id).not.toBeNull();
      if (sc.id !== "oedema-lvedp-high") expect(m.state.cause?.id, sc.id).toBeTruthy();
      expect(s.catheterInAorta, sc.id).toBe(true);
      s.dispose();
    }
    expect(MP_HYPOTENSION.episodeMapMmHg).toBe(65);
  });
});
