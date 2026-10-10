import { describe, it, expect } from "vitest";
import { newCaseSession, type CaseSession } from "./caseSession";
import { gainAccess } from "./autopilot";
import { CASE_SESSION_MODULES } from "./modules/index";
import { createSessionModule as createEmergencies, emergenciesOf } from "./modules/emergencies";
import { createSessionModule as createPlanning } from "./modules/planning";
import { ANAPHYLAXIS, MP_EMERGENCIES, TRYPTASE, classifyTryptase, localAdequacy, scriptPericardialBleed } from "./emergencies";
import { SCENARIO_BY_ID } from "./scenarios/index";
import { launch } from "./scenarios/emergencies.launch";
import { scenarios } from "./scenarios/emergencies";
import { PatientEngine } from "../patient/engine";
import { Responses } from "../patient/responses";
import { SeededRng } from "../patient/rng";
import { generatePatient } from "../patient/patient";
import { PRACTICE_INDEX, practiceForLesson } from "../../ui/content/practiceIndex";

// proc-anaphylaxis-vagal: the anaphylaxis order set, the vasovagal look-alikes and vagal prevention.

const MAP_OK = 65;
const mapOf = (e: PatientEngine) => e.vitals().aortaTrue.mean;

/** Step the session in `stepS` slices until `pred` holds (at most `maxS`); returns whether it did. */
function waitUntil(s: CaseSession, pred: () => boolean, maxS: number, stepS = 5): boolean {
  for (let t = 0; t <= maxS; t += stepS) {
    if (pred()) return true;
    s.wait(stepS);
    s.runPending();
  }
  return pred();
}

/**
 * anaphylaxis-asthmatic from the first signs: `first` runs at recognition, then the repeat IM dose at
 * 5 minutes while problems persist. Returns how long after recognition the MAP last stood below 65
 * (0 if never) over 15 minutes, and whether it ever did.
 */
function anaphylaxisArm(first: (s: CaseSession) => void) {
  const { session: s, engine: e } = newCaseSession({ scenario: "anaphylaxis-asthmatic" });
  const m = emergenciesOf(s)!;
  expect(waitUntil(s, () => s.activeEvents().includes("contrast-reaction"), 600)).toBe(true);
  const rec = s.tS;
  first(s);
  s.runPending();
  let lastLow = -1;
  let everLow = false;
  for (let t = 0; s.tS - rec < 900 && t < 400; t++) {
    const imT = m.state.reaction.imT;
    if (imT.length === 1 && s.tS - imT[0] >= ANAPHYLAXIS.repeatAfterS) {
      m.actions.order("adrenaline-im");
      s.runPending();
    }
    if (mapOf(e) < MAP_OK) {
      lastLow = s.tS - rec;
      everLow = true;
    }
    s.wait(5);
    s.runPending();
  }
  return { s, m, restoredAfterS: Math.max(0, lastLow), everLow };
}

describe("anaphylaxis order set", () => {
  it("anaphylaxis-asthmatic: IM adrenaline 0.5 mg within 2 min restores MAP above 65 sooner than chlorphenamine and hydrocortisone first", () => {
    const im = anaphylaxisArm((s) => {
      const m = emergenciesOf(s)!;
      s.wait(60, "Assessing");
      s.runPending();
      expect(m.actions.order("adrenaline-im").ok).toBe(true);
      s.runPending();
      m.actions.order("fluid-1000");
      s.runPending();
      m.actions.order("oxygen");
    });
    const ah = anaphylaxisArm((s) => {
      const m = emergenciesOf(s)!;
      m.actions.order("chlorphenamine");
      s.runPending();
      m.actions.order("hydrocortisone");
      s.runPending();
      // 'then reassess' (the lesson's wrong option), and adrenaline after that
      s.wait(180, "Reassessing");
      s.runPending();
      m.actions.order("adrenaline-im");
      s.runPending();
      m.actions.order("fluid-1000");
      s.runPending();
      m.actions.order("oxygen");
    });
    // the antihistamine-and-steroid-first arm went below 65 and was restored later
    expect(ah.everLow).toBe(true);
    expect(im.restoredAfterS).toBeLessThan(ah.restoredAfterS);
    // the IM dose was given at about a minute; the order took its time
    const imAt = im.m.state.reaction.imT[0] - im.m.state.reaction.onsetT!;
    expect(imAt).toBeLessThanOrEqual(MP_EMERGENCIES.imWithinS);
    const d = (s: CaseSession) => Object.fromEntries(s.decisions().map((r) => [r.id, r]));
    expect(d(im.s)["anaphylaxis-first-drug"].correct).toBe(true);
    expect(d(im.s)["anaphylaxis-adrenaline-in-time"].correct).toBe(true);
    expect(d(im.s)["anaphylaxis-repeat-im"].correct).toBe(true);
    expect(d(ah.s)["anaphylaxis-first-drug"].correct).toBe(false);
    expect(d(ah.s)["anaphylaxis-adrenaline-in-time"].correct).toBe(false);
    for (const r of im.s.decisions().filter((x) => x.id.startsWith("anaphylaxis"))) expect(r.lessonId).toBe("pm-lab-drugs-contrast-reactions");
  });

  it("wrong orders have consequences: IV 1 mg with a pulse is critical and hypertensive; more contrast deepens the reaction; atropine adds to the tachycardia", () => {
    // IV arrest dose with a pulse
    const a = newCaseSession({ scenario: "anaphylaxis-asthmatic" });
    expect(waitUntil(a.session, () => a.session.activeEvents().includes("contrast-reaction"), 600)).toBe(true);
    const before = mapOf(a.engine);
    emergenciesOf(a.session)!.actions.order("adrenaline-iv-1mg");
    a.session.runPending();
    a.session.wait(30);
    a.session.runPending();
    expect(mapOf(a.engine)).toBeGreaterThan(before + 30);
    expect(a.session.criticalErrors).toBeGreaterThan(0);
    expect(a.session.decisions().find((d) => d.id === "anaphylaxis-no-iv-arrest-dose")!.correct).toBe(false);

    // more contrast during the reaction: the reaction runs higher than without it
    const level = (inject: boolean) => {
      const { session: s, engine: e } = newCaseSession({ scenario: "anaphylaxis-asthmatic" });
      expect(waitUntil(s, () => s.activeEvents().includes("contrast-reaction"), 600)).toBe(true);
      if (inject) for (let k = 0; k < 3; k++) {
        expect(emergenciesOf(s)!.actions.order("more-contrast").ok).toBe(true);
        s.runPending();
      }
      emergenciesOf(s)!.actions.order("adrenaline-im");
      s.runPending();
      s.wait(240);
      s.runPending();
      return { level: e.vitals().reaction.circulation, s };
    };
    const clean = level(false);
    const more = level(true);
    expect(more.level).toBeGreaterThan(clean.level);
    expect(more.s.decisions().find((d) => d.id === "anaphylaxis-contrast-stopped")!.correct).toBe(false);

    // atropine in a tachycardic reaction: against a control with the same seed and no atropine,
    // read at the same session time (the reaction itself lifts the rate)
    const b = newCaseSession({ scenario: "anaphylaxis-asthmatic" });
    expect(waitUntil(b.session, () => b.session.activeEvents().includes("contrast-reaction"), 600)).toBe(true);
    b.session.wait(30);
    b.session.runPending();
    const atropineAt = b.session.tS;
    emergenciesOf(b.session)!.actions.order("atropine-1");
    b.session.runPending();
    b.session.wait(20);
    b.session.runPending();
    const readAt = b.session.tS;
    const withAtropineHr = b.engine.vitals().hr!;
    const c = newCaseSession({ scenario: "anaphylaxis-asthmatic" });
    expect(waitUntil(c.session, () => c.session.activeEvents().includes("contrast-reaction"), 600)).toBe(true);
    c.session.wait(30);
    c.session.runPending();
    expect(c.session.tS).toBeCloseTo(atropineAt, 5);
    c.session.wait(readAt - c.session.tS);
    c.session.runPending();
    expect(c.session.tS).toBeCloseTo(readAt, 5);
    const controlHr = c.engine.vitals().hr!;
    expect(withAtropineHr).toBeGreaterThan(controlHr + 5);
    expect(b.session.decisions().find((d) => d.id === "anaphylaxis-no-atropine")!.correct).toBe(false);
  });

  it("an excessive infusion gives a tachyarrhythmia that settles when the rate is reduced; the infusion after two doses with help is right", () => {
    const { session: s, engine: e } = newCaseSession({ scenario: "anaphylaxis-asthmatic" });
    const m = emergenciesOf(s)!;
    expect(waitUntil(s, () => s.activeEvents().includes("contrast-reaction"), 600)).toBe(true);
    m.actions.order("call-help");
    s.runPending();
    m.actions.order("adrenaline-im");
    s.runPending();
    s.wait(ANAPHYLAXIS.repeatAfterS);
    s.runPending();
    m.actions.order("adrenaline-im");
    s.runPending();
    expect(m.actions.setInfusion(2).ok).toBe(true);
    expect(s.decisions().find((d) => d.id === "anaphylaxis-infusion")!.correct).toBe(true);
    m.actions.setInfusion(20);
    s.wait(MP_EMERGENCIES.infusionTachyAfterS + 10);
    s.runPending();
    expect(e.vitals().rhythmKind).toBe("vt");
    expect(s.decisions().find((d) => d.id === "anaphylaxis-infusion-rate")!.correct).toBe(false);
    m.actions.setInfusion(5);
    s.wait(MP_EMERGENCIES.infusionSettleS + 10);
    s.runPending();
    expect(e.vitals().rhythmKind).not.toBe("vt");
  });

  it("an excessive infusion's tachyarrhythmia settles when the pump is stopped outright, and not while the rate goes back up", () => {
    const { session: s, engine: e } = newCaseSession({ scenario: "anaphylaxis-asthmatic" });
    const m = emergenciesOf(s)!;
    expect(waitUntil(s, () => s.activeEvents().includes("contrast-reaction"), 600)).toBe(true);
    m.actions.setInfusion(20);
    s.wait(MP_EMERGENCIES.infusionTachyAfterS + 10);
    s.runPending();
    expect(e.vitals().rhythmKind).toBe("vt");
    expect(m.actions.order("infusion-stop").ok).toBe(true);
    s.runPending();
    expect(m.state.infusion).toBeNull();
    s.wait(MP_EMERGENCIES.infusionSettleS + 10);
    s.runPending();
    expect(e.vitals().rhythmKind).not.toBe("vt");
    expect(m.state.infusionTachy).toBeNull();

    // reduced, then raised again before it settled: it keeps going
    const b = newCaseSession({ scenario: "anaphylaxis-asthmatic" });
    const mb = emergenciesOf(b.session)!;
    expect(waitUntil(b.session, () => b.session.activeEvents().includes("contrast-reaction"), 600)).toBe(true);
    mb.actions.setInfusion(20);
    b.session.wait(MP_EMERGENCIES.infusionTachyAfterS + 10);
    b.session.runPending();
    expect(b.engine.vitals().rhythmKind).toBe("vt");
    mb.actions.setInfusion(5);
    b.session.wait(5);
    b.session.runPending();
    mb.actions.setInfusion(20);
    b.session.wait(MP_EMERGENCIES.infusionSettleS + 10);
    b.session.runPending();
    expect(b.engine.vitals().rhythmKind).toBe("vt");
  });

  it("the fluid record shows the running total, and the nurse reports it once it reaches the lower end of 3-5 L", () => {
    const { session: s } = newCaseSession({ scenario: "anaphylaxis-asthmatic" });
    const m = emergenciesOf(s)!;
    m.actions.order("fluid-1000");
    s.runPending();
    expect(m.state.actions[m.state.actions.length - 1].text).toBe("Crystalloid 1000 mL as a rapid bolus.");
    m.actions.order("fluid-1000");
    s.runPending();
    expect(m.state.actions[m.state.actions.length - 1].text).toMatch(/\(2000 mL so far\)/);
    const nurse = () => s.log.filter((l) => l.kind === "nurse" && /crystalloid given so far/.test(l.text));
    expect(nurse().length).toBe(0);
    m.actions.order("fluid-1000");
    s.runPending();
    m.actions.order("fluid-500");
    s.runPending();
    expect(m.state.fluidTotalMl).toBe(3500);
    expect(nurse().length).toBe(1);
    expect(nurse()[0].text).toBe(`${ANAPHYLAXIS.fluidUpToMl[0]} mL of crystalloid given so far.`);
  });

  it("anaphylaxis-prearrest-brady: a slow rate with skin signs; atropine alone is scored wrong", () => {
    const { session: s, engine: e } = newCaseSession({ scenario: "anaphylaxis-prearrest-brady" });
    const m = emergenciesOf(s)!;
    // the reaction's skin signs with a rate below 60
    expect(waitUntil(s, () => e.vitals().symptoms.itch > 0 && (e.vitals().hr ?? 99) < 60, 300)).toBe(true);
    expect(s.activeEvents()).toContain("contrast-reaction");
    expect(m.actions.order("atropine-1").ok).toBe(true);
    s.runPending();
    s.wait(MP_EMERGENCIES.imWithinS + 30);
    s.runPending();
    const d = Object.fromEntries(s.decisions().map((r) => [r.id, r]));
    expect(d["anaphylaxis-first-drug"].correct).toBe(false);
    expect(d["anaphylaxis-first-drug"].given).toMatch(/atropine/i);
    expect(d["anaphylaxis-adrenaline-in-time"].correct).toBe(false);
    // atropine-only does not make it the tachycardic picture's 'atropine' error: the rate was slow
    expect(d["anaphylaxis-no-atropine"]).toBeUndefined();
  });

  it("tryptase outside the windows is wrong; inside them it is right", () => {
    const { session: s } = newCaseSession({ scenario: "anaphylaxis-asthmatic" });
    const m = emergenciesOf(s)!;
    // before the reaction: no reaction to sample for
    m.actions.order("tryptase");
    s.runPending();
    expect(s.decisions().find((d) => d.id === "tryptase-1")!.correct).toBe(false);
    expect(waitUntil(s, () => m.state.reaction.onsetT !== null, 600)).toBe(true);
    // before any adrenaline: delays treatment
    m.actions.order("tryptase");
    s.runPending();
    expect(s.decisions().find((d) => d.id === "tryptase-2")!.correct).toBe(false);
    m.actions.order("adrenaline-im");
    s.runPending();
    m.actions.order("tryptase");
    s.runPending();
    expect(s.decisions().find((d) => d.id === "tryptase-3")!.correct).toBe(true);
    // a further sample at 30 minutes, before the 1-2 hour window
    s.wait(1800 - (s.tS - m.state.reaction.onsetT!));
    s.runPending();
    m.actions.order("tryptase");
    s.runPending();
    expect(s.decisions().find((d) => d.id === "tryptase-4")!.correct).toBe(false);
    // 90 minutes: the second sample
    s.wait(5400 - (s.tS - m.state.reaction.onsetT!));
    s.runPending();
    m.actions.order("tryptase");
    s.runPending();
    expect(s.decisions().find((d) => d.id === "tryptase-5")!.correct).toBe(true);
    // a third sample in the same window is outside the windows too (later ones: classifyTryptase below)
    m.actions.order("tryptase");
    s.runPending();
    expect(s.decisions().find((d) => d.id === "tryptase-6")!.correct).toBe(false);
  });

  it("classifyTryptase follows the RCUK windows", () => {
    const on = 100;
    const adr = 160;
    expect(classifyTryptase(50, null, null, null).window).toBe("none");
    expect(classifyTryptase(150, on, null, null).correct).toBe(false);
    expect(classifyTryptase(300, on, adr, null)).toMatchObject({ window: "first", correct: true });
    expect(classifyTryptase(600, on, adr, null, ["first"]).correct).toBe(false);
    expect(classifyTryptase(on + TRYPTASE.secondFromS + 60, on, adr, null, ["first"])).toMatchObject({ window: "second", correct: true });
    expect(classifyTryptase(on + TRYPTASE.secondLatestS + 60, on, adr, null).correct).toBe(false);
    expect(classifyTryptase(on + 30 * 3600, on, adr, on + 3600)).toMatchObject({ window: "third", correct: true });
  });
});

describe("vasovagal look-alikes", () => {
  it("vagal-mimic: HR falls before MAP, without itch or flushing; atropine restores HR", () => {
    const { session: s, engine: e } = newCaseSession({ scenario: "vagal-mimic" });
    const m = emergenciesOf(s)!;
    // the autopilot's own steps leave nothing open or scored for the learner
    expect(m.state.vagal).toEqual([]);
    expect(s.decisions().some((d) => d.id.startsWith("vagal-"))).toBe(false);
    const v0 = e.vitals();
    s.femoralManual(15, 3); // the sheath comes out: the scripted vasovagal reaction
    const hr: number[] = [];
    const map: number[] = [];
    for (let t = 0; t < 60; t++) {
      e.advance(1);
      const v = e.vitals();
      hr.push(v.hr!);
      map.push(v.aortaTrue.mean);
      expect(v.symptoms.itch).toBe(0);
      expect(v.symptoms.flushing).toBe(0);
    }
    const hrMin = Math.min(...hr);
    const mapMin = Math.min(...map);
    expect(hrMin).toBeLessThan(v0.hr! * 0.85);
    expect(mapMin).toBeLessThan(MAP_OK);
    // the time each reached half its fall: the rate first
    const half = (xs: number[], x0: number, xMin: number) => xs.findIndex((x) => x <= x0 - (x0 - xMin) / 2);
    expect(half(hr, v0.hr!, hrMin)).toBeLessThan(half(map, v0.aortaTrue.mean, mapMin));
    expect(s.activeEvents()).not.toContain("contrast-reaction");
    // atropine during the compression (the team gives it while the groin is held), a frame later
    s.tick(0);
    expect(s.busy).toBe(true);
    expect(m.actions.order("lie-flat-legs-up").ok).toBe(true);
    expect(m.actions.order("atropine-1").ok).toBe(true);
    // the orders went to the scripted episode (the drill's own), not to anything the autopilot left
    expect(m.state.vagal.map((x) => x.trigger)).toEqual(["scenario"]);
    for (let k = 0; k < 6; k++) s.tick(0); // two minutes of the compression
    expect(e.vitals().hr!).toBeGreaterThan(Math.max(60, hrMin + 15));
    expect(s.decisions().find((d) => d.id === "vagal-first-treatment")!.correct).toBe(true);
    // with fast saline as well it recovers within the few minutes: no no-response report
    m.actions.order("fluid-500");
    for (let k = 0; k < 12; k++) s.tick(0);
    expect(m.state.vagal[0].noResponseT).toBeNull();
    expect(mapOf(e)).toBeGreaterThanOrEqual(MAP_OK);
    expect(m.state.vagal[0].unscored).toBe(false);
  });

  it("vagal-mimic in the running app: a faint that passes inside the compression's time-lapse is reported as numbers, never scored as untreated", () => {
    const { session: s } = newCaseSession({ scenario: "vagal-mimic" });
    const m = emergenciesOf(s)!;
    s.femoralManual(15, 3);
    // the lab's frames: 1/60 s of wall time each, the lapse running beside them
    let frames = 0;
    while (s.busy && frames < 5000) {
      s.tick(1 / 60);
      frames++;
    }
    expect(s.busy).toBe(false);
    // then the learner's own minutes at the wall clock, past the treatment window
    for (let k = 0; k < (MP_EMERGENCIES.vagalTreatWithinS + 60) * 60; k += 30) s.tick(0.5);
    expect(s.decisions().find((d) => d.id === "vagal-first-treatment")).toBeUndefined();
    const ep = m.state.vagal[0];
    expect(ep.trigger).toBe("scenario");
    expect(ep.unscored).toBe(true);
    const line = s.log.find((l) => l.kind === "nurse" && /come back up/.test(l.text))!;
    expect(line.text).toMatch(/heart rate fell to \d+/);
    expect(line.text.toLowerCase()).not.toMatch(/vagal|faint/);
  });

  it("a faint the learner meets at the wall clock is scored from when they could act", () => {
    const { session: s, engine: e } = newCaseSession({ scenario: "vagal-mimic" });
    const m = emergenciesOf(s)!;
    s.tick(1 / 60);
    // a scripted faint with no time-lapse running (the drill's onset at the bedside)
    e.forceVagal();
    s.tick(1 / 60);
    s.tick(1 / 60);
    expect(m.state.vagal.length).toBe(1);
    expect(m.state.vagal[0].liveT).not.toBeNull();
    // untreated past the window: scored wrong
    for (let k = 0; k < MP_EMERGENCIES.vagalTreatWithinS + 30; k += 5) s.tick(5);
    expect(s.decisions().find((d) => d.id === "vagal-first-treatment")!.correct).toBe(false);
  });

  it("a faint that does not recover a few minutes after its treatment: the nurse reports the numbers and a look for a mimic is scored", () => {
    const { session: s } = newCaseSession({ scenario: "vagal-mimic" });
    const m = emergenciesOf(s)!;
    s.femoralManual(15, 3);
    // hidden behind the faint: blood collecting in the pericardium from the pull
    scriptPericardialBleed(s, 1);
    s.tick(0);
    m.actions.order("atropine-1");
    m.actions.order("fluid-500");
    expect(m.state.vagal.length).toBe(1);
    const noResponse = () => m.state.vagal[0].noResponseT !== null;
    for (let k = 0; k < 20 && !noResponse(); k++) s.tick(0);
    expect(noResponse()).toBe(true);
    const line = s.log.filter((l) => l.kind === "nurse").pop()!;
    expect(line.text).toMatch(/minutes since the treatment: heart rate/);
    // the line gives numbers, never a diagnosis
    expect(line.text.toLowerCase()).not.toMatch(/tamponade|effusion|vagal|bleed/);
    expect(m.actions.order("echo").text).toMatch(/pericardial effusion/);
    expect(s.decisions().find((d) => d.id === "vagal-reconsider")!.correct).toBe(true);
  });

  it("vagal-no-local gives a vagal event more often over a seed set than with local anaesthetic and saline", () => {
    const run = (seed: string, prevent: boolean): boolean => {
      const { session: s } = newCaseSession({ scenario: "vagal-no-local", seed });
      const m = emergenciesOf(s)!;
      for (const id of Object.keys(s.chart) as (keyof typeof s.chart)[]) {
        s.reviewChart(id);
        s.runPending();
      }
      s.confirmConsent();
      s.runPending();
      for (const i of s.timeOutItems()) s.confirmTimeOutItem(i.id);
      s.runPending();
      if (prevent) {
        expect(m.actions.giveLocal(10).ok).toBe(true);
        s.runPending();
        s.wait(60);
        s.runPending();
      }
      gainAccess(s);
      s.runPending();
      if (prevent) {
        m.actions.order("saline-drip");
        s.runPending();
        m.actions.order("atropine-ready");
        s.runPending();
      }
      s.femoralManual(15, 3);
      s.runPending();
      return m.state.vagal.length > 0;
    };
    const N = 10;
    let without = 0;
    let withPrevention = 0;
    for (let k = 0; k < N; k++) {
      if (run(`vnl-${k}`, false)) without++;
      if (run(`vnl-${k}`, true)) withPrevention++;
    }
    expect(without).toBeGreaterThan(withPrevention);
  });

  it("removal without saline, and a femoral local below the range, are scored", () => {
    const a = newCaseSession({ scenario: "vagal-removal-no-saline" }).session;
    a.femoralManual(15, 3);
    expect(a.decisions().find((d) => d.id === "vagal-prevention-removal")!.correct).toBe(false);
    const b = newCaseSession({ scenario: "vagal-removal-no-saline" }).session;
    const m = emergenciesOf(b)!;
    m.actions.order("saline-drip");
    b.runPending();
    m.actions.order("atropine-ready");
    b.runPending();
    b.femoralManual(15, 3);
    expect(b.decisions().find((d) => d.id === "vagal-prevention-removal")!.correct).toBe(true);
    const c = newCaseSession({ scenario: "vagal-no-local" }).session;
    emergenciesOf(c)!.actions.giveLocal(3);
    c.runPending();
    c.wait(60);
    c.runPending();
    gainAccess(c);
    const d = c.decisions().find((x) => x.id === "local-anaesthetic-dose")!;
    expect(d.correct).toBe(false);
    expect(d.given).toBe("3 mL");
    expect(localAdequacy("femoral", 3, 0, 100, 45)).toBeCloseTo(0.3, 5);
    expect(localAdequacy("femoral", 10, 0, 30, 45)).toBe(0);
  });

  it("tamponade-mimic: a fast-rate hypotension that atropine does not fix; atropine first is wrong, the echo shows the effusion", () => {
    const { session: s, engine: e } = newCaseSession({ scenario: "tamponade-mimic" });
    const m = emergenciesOf(s)!;
    s.femoralManual(15, 3);
    for (let k = 0; k < 30 && !m.state.fastHypotension; k++) s.tick(0);
    expect(m.state.fastHypotension).not.toBeNull();
    expect(e.vitals().hr!).toBeGreaterThanOrEqual(MP_EMERGENCIES.fastHr);
    m.actions.order("atropine-1");
    expect(s.decisions().find((d) => d.id === "hypotension-fast-rate-first")!.correct).toBe(false);
    const r = m.actions.order("echo");
    expect(r.text).toMatch(/effusion/);
    expect(r.text).not.toMatch(/no pericardial effusion/);
    expect(s.decisions().find((d) => d.id === "hypotension-fast-rate-look")!.correct).toBe(true);
  });
});

describe("engine defaults and random cases", () => {
  it("random-case reaction incidence is unchanged: the course changes no draw, and the module forces nothing", () => {
    // the Responses draw with and without the emergency course, over many seeds
    for (let k = 0; k < 400; k++) {
      const a = new Responses(4);
      const b = new Responses(4);
      b.setCourse({ escalation: true, vagalSvrLagS: 40 });
      const prev = k % 3 === 0 ? "previous-mild" : "none";
      a.contrast("left", 6, "aortic", false, new SeededRng(`inc-${k}`), 0, prev);
      b.contrast("left", 6, "aortic", false, new SeededRng(`inc-${k}`), 0, prev);
      expect(b.st.reaction.kind).toBe(a.st.reaction.kind);
      expect(b.st.reaction.onsetAt).toBe(a.st.reaction.onsetAt);
    }
    // a random case with and without the module: the first contrast draws the same reaction. This
    // contrast comes straight after construction, before any puncture: a vagal onset that the local
    // anaesthetic scaling adds at puncture would shift that seed's later draws (incidence over seeds
    // is unchanged, per-seed equality is not claimed past the access steps).
    const without = CASE_SESSION_MODULES.filter((f) => f().id !== "emergencies");
    expect(without.length).toBe(CASE_SESSION_MODULES.length - 1);
    for (let k = 0; k < 30; k++) {
      const a = newCaseSession({ seed: `inc-case-${k}`, modules: CASE_SESSION_MODULES });
      const b = newCaseSession({ seed: `inc-case-${k}`, modules: without });
      a.engine.contrast(8, "left");
      b.engine.contrast(8, "left");
      expect(a.engine.resp.st.reaction).toEqual(b.engine.resp.st.reaction);
    }
  });

  it("a random case's sheath removal is as before: no removal draw and no removal scoring unless a scenario arms the drill", () => {
    const { session: s } = newCaseSession({ seed: "em-random-fem", access: "femoral", start: "closure" });
    s.femoralManual(15, 3);
    s.runPending();
    expect(s.telemetry.some((t) => t.kind === "patient.stimulus" && (t.data as { kind?: string }).kind === "sheath-removal")).toBe(false);
    expect(s.decisions().some((d) => d.id === "vagal-prevention-removal")).toBe(false);
    const armed = newCaseSession({ scenario: "vagal-removal-no-saline" }).session;
    expect(emergenciesOf(armed)!.state.prevention.removalDrill).toBe(true);
    armed.femoralManual(15, 3);
    armed.runPending();
    expect(armed.telemetry.some((t) => t.kind === "patient.stimulus" && (t.data as { kind?: string }).kind === "sheath-removal")).toBe(true);
  });

  it("an engine the lab does not set up keeps its defaults (no course, no prevention); a forced reaction skips the draw", () => {
    const e = new PatientEngine({ profile: generatePatient("em-defaults") });
    expect(e.emergencyModel()).toBeNull();
    expect(e.resp.st.course).toBeUndefined();
    e.forceReaction("moderate", 30);
    e.contrast(8, "left");
    expect(e.resp.st.reaction.kind).toBe("moderate");
    expect(e.resp.st.reaction.drawn).toBe(true);
    // snapshot and restore carry the prevention and the removal generator
    e.setEmergencyModel({ prevention: { local: 0.5, salineRunning: true } });
    const sn = e.snapshot();
    const f = new PatientEngine({ profile: generatePatient("em-defaults") });
    f.restore(sn);
    expect(f.emergencyModel()?.prevention).toEqual({ local: 0.5, salineRunning: true });
  });

  it("the module is attached to every case and the scenarios are registered with the engine's course on", () => {
    const { session: s, engine: e } = newCaseSession({ seed: "em-attach", access: "radial-right" });
    expect(s.moduleIds()).toContain("emergencies");
    expect(e.emergencyModel()).toMatchObject({ reactionEscalation: true });
    for (const sc of scenarios) expect(SCENARIO_BY_ID[sc.id]).toBe(sc);
    // a probe that the module factory and the planning factory are both registered
    expect(createEmergencies().id).toBe("emergencies");
    expect(createPlanning().id).toBe("planning");
  });
});

describe("practice links", () => {
  it("practiceIndex lists anaphylaxis-asthmatic, anaphylaxis-prearrest-brady and vagal-mimic under pm-lab-drugs-contrast-reactions, cm-patient-complications-vasovagal and cm-perforation-tamponade", () => {
    for (const lesson of ["pm-lab-drugs-contrast-reactions", "cm-patient-complications-vasovagal", "cm-perforation-tamponade"])
      for (const id of ["anaphylaxis-asthmatic", "anaphylaxis-prearrest-brady", "vagal-mimic"])
        expect(practiceForLesson(lesson).some((p) => p.sim === "procedure" && p.scenario === id), `${id} under ${lesson}`).toBe(true);
    expect(practiceForLesson("cm-patient-complications-vasovagal").some((p) => p.scenario === "vagal-no-local")).toBe(true);
    expect(practiceForLesson("cm-perforation-tamponade").some((p) => p.scenario === "tamponade-mimic")).toBe(true);
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
});

describe("what the learner sees and the numbers stay physiological", () => {
  it("a pericardial bleed of 0.5 mL/s for 20 min ends in a falling, bounded pressure, never a rising one", () => {
    const e = new PatientEngine({ profile: generatePatient("peri-bounded", { indication: "SA" }), lesions: [] });
    e.advance(10);
    const map0 = mapOf(e);
    e.setPericardialInflow(0.5);
    const maps: number[] = [];
    for (let t = 0; t < 1200; t += 20) {
      e.advance(20);
      const v = e.vitals();
      maps.push(v.aortaTrue.mean);
      expect(Number.isFinite(v.aortaTrue.mean)).toBe(true);
      expect(v.aortaTrue.mean).toBeLessThan(200);
      const c = e.snapshot().circ;
      expect(c.vLV).toBeGreaterThanOrEqual(0);
      expect(c.vRV).toBeGreaterThanOrEqual(0);
    }
    expect(maps[maps.length - 1]).toBeLessThan(map0 - 40);
    // once it has fallen it stays down: no rebound as the effusion grows
    const minAt = maps.indexOf(Math.min(...maps));
    expect(Math.max(...maps.slice(minAt))).toBeLessThan(map0 - 40);
  });

  it("tamponade-mimic: the bleed stops at its volume and the pressure stays low and bounded through the compression", () => {
    const { session: s, engine: e } = newCaseSession({ scenario: "tamponade-mimic" });
    s.femoralManual(15, 3);
    let maxMap = 0;
    for (let k = 0; k < 5000 && s.busy; k++) {
      s.tick(1 / 60);
      maxMap = Math.max(maxMap, mapOf(e));
    }
    for (let k = 0; k < 60; k++) s.tick(5);
    const v = e.vitals();
    expect(maxMap).toBeLessThan(200);
    expect(v.pericardialMl).toBeGreaterThan(MP_EMERGENCIES.echo.largeEffusionMl);
    expect(v.pericardialMl).toBeLessThan(165);
    expect(v.aortaTrue.mean).toBeLessThan(MAP_OK);
    expect(v.aortaTrue.mean).toBeGreaterThan(5);
    // the fast-rate hypotension's look window starts when the learner can act
    const fh = emergenciesOf(s)!.state.fastHypotension!;
    expect(fh.liveT).not.toBeNull();
  });

  it("the signs reach the log as the patient's words and the nurse's observations, never as a diagnosis", () => {
    const cases: [string, RegExp[], number][] = [
      ["anaphylaxis-asthmatic", [/itchy/, /rash/], 600],
      ["anaphylaxis-prearrest-brady", [/itchy/, /rash/], 300],
    ];
    for (const [id, want, maxS] of cases) {
      const { session: s, engine: e } = newCaseSession({ scenario: id });
      expect(waitUntil(s, () => e.vitals().reaction.skin > MP_EMERGENCIES.signs.skin + 0.1, maxS)).toBe(true);
      s.wait(30);
      s.runPending();
      const lines = s.log.filter((l) => l.kind === "patient" || l.kind === "nurse").map((l) => l.text);
      for (const w of want) expect(lines.some((x) => w.test(x)), `${id}: ${w}`).toBe(true);
      for (const x of lines) expect(x.toLowerCase()).not.toMatch(/anaphyla|vagal/);
      expect(s.log.filter((l) => l.text === "I've come up all itchy.").length).toBe(1);
    }
    // the faint: sick and pale, no itch or rash
    const { session: s } = newCaseSession({ scenario: "vagal-mimic" });
    s.femoralManual(15, 3);
    s.runPending();
    const lines = s.log.filter((l) => l.kind === "patient" || l.kind === "nurse").map((l) => l.text);
    expect(lines).toContain("I feel sick and faint.");
    expect(lines).toContain("Pale and clammy.");
    expect(lines.some((x) => /itchy|rash/.test(x))).toBe(false);
    for (const x of lines) expect(x.toLowerCase()).not.toMatch(/anaphyla|vagal/);
  });

  it("the first coronary run of the anaphylaxis scenarios is on the contrast total and in the record", () => {
    for (const id of ["anaphylaxis-asthmatic", "anaphylaxis-prearrest-brady"]) {
      const { session: s, engine: e } = newCaseSession({ scenario: id });
      e.advance(0.1); // the engine's vitals are recomputed on its next step
      expect(s.totals.contrastMl).toBe(e.vitals().contrast.totalMl);
      expect(s.totals.contrastMl).toBeGreaterThan(0);
      expect(s.log.some((l) => l.kind === "event" && /First left coronary run: \d+ mL of contrast/.test(l.text))).toBe(true);
    }
  });

  it("the module's local anaesthetic line states the volume, not a strength of its own", () => {
    const { session: s } = newCaseSession({ scenario: "vagal-no-local" });
    emergenciesOf(s)!.actions.giveLocal(15);
    const line = s.log.filter((l) => l.kind === "action").pop()!;
    expect(line.text).toBe("15 mL of local anaesthetic infiltrated at the femoral site.");
  });
});
