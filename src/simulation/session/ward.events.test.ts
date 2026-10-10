// proc-recovery-ward: the first-action menus on the ward, the stroke on the table and the follow-ups (the schedule,
// the observations and the findings are in ward.test.ts).
//   npx vitest run src/simulation/session/ward.events.test.ts
import { describe, it, expect } from "vitest";
import { newCaseSession, type CaseSession } from "./caseSession";
import { fastForward } from "./autopilot";
import {
  WARD_EVENT_RULES,
  gradeWardActions,
  oxfordMobilisation,
  MP_WARD,
  lowerFirst,
  oxfordSchedule,
  raises,
  wardOptionsNow,
} from "./ward";

const open = (id: string) => newCaseSession({ scenario: id }).session;
const decision = (s: CaseSession, id: string) => s.decisions().find((d) => d.id === id);
/** The Oxford plan for the case's route and closure. */
const oxfordPlan = (s: CaseSession) => {
  const femoral = s.workingSite().route === "femoral";
  return s.setWardPlan(oxfordSchedule(femoral ? "femoral" : "radial", s.ward.reports.some((r) => r.stents.length > 0)), oxfordMobilisation(femoral ? "manual" : "radial-band"));
};
/** Run the ward in recovery lapses until `done` (each lapse stops at a finding), at most `maxMin` minutes. */
function runWard(s: CaseSession, maxMin: number, done: () => boolean = () => false): void {
  const end = s.tS + maxMin * 60;
  while (s.tS < end - 1 && !done()) {
    s.observe(Math.max(1, Math.min(15, Math.ceil((end - s.tS) / 60))));
    s.runPending();
  }
}

describe("first actions on the ward", () => {
  it("'ward-chest-pain-post-pci' scores ECG first correct and nitrate first wrong; 'ward-stroke-late' scores aspirin before imaging wrong", () => {
    // ECG first: right; it shows the occluded stent; the operator reopens it
    const a = open("ward-chest-pain-post-pci");
    oxfordPlan(a);
    runWard(a, 90, () => a.ward.openEvents().length > 0);
    const ea = a.ward.openEvents()[0];
    expect(ea.kind).toBe("chest-pain-post-pci");
    expect(ea.foundBy).toBe("report");
    expect(a.activeEvents()).toContain("chest-pain");
    // the ECG recorded at once, when the pain is reported, already shows the ischaemia
    expect(a.wardAct(ea.id, "ecg-12")).toMatch(/ST elevation/);
    a.runPending();
    a.wardAct(ea.id, "call-operator");
    a.runPending();
    expect(decision(a, `ward-${ea.id}-first`)!.correct).toBe(true);
    expect(decision(a, `ward-${ea.id}-response`)!.correct).toBe(true);
    // the ledger keeps the acronyms in the learner's answer
    expect(decision(a, `ward-${ea.id}-response`)!.given).toMatch(/12-lead ECG/);
    expect(ea.resolvedAt).not.toBeNull();
    // nitrate first: wrong, and wrong for the response too
    const b = open("ward-chest-pain-post-pci");
    oxfordPlan(b);
    runWard(b, 90, () => b.ward.openEvents().length > 0);
    const eb = b.ward.openEvents()[0];
    b.wardAct(eb.id, "nitrate");
    b.runPending();
    expect(decision(b, `ward-${eb.id}-first`)!.correct).toBe(false);
    expect(decision(b, `ward-${eb.id}-response`)!.correct).toBe(false);
    // nitrate after the ECG is not the error the lesson names
    expect(gradeWardActions("chest-pain-post-pci", ["ecg-12", "nitrate", "call-operator"]).harmful).toBeNull();

    // the late stroke: ABC first is right, but aspirin before the CT is wrong
    const c = open("ward-stroke-late");
    c.setWardPlan(oxfordSchedule("radial"), oxfordMobilisation("radial-band"));
    runWard(c, 200, () => c.ward.openEvents().length > 0);
    const ec = c.ward.openEvents()[0];
    expect(ec.kind).toBe("stroke");
    expect(Math.round((ec.foundS! - c.ward.arrivedAt!) / 60)).toBe(150);
    expect(c.activeEvents()).toContain("neuro-deficit");
    for (const act of ["abc", "onset-time", "aspirin", "stroke-team", "neuro-exam", "ct-cta"] as const) {
      c.wardAct(ec.id, act);
      c.runPending();
    }
    expect(decision(c, `ward-${ec.id}-first`)!.correct).toBe(true);
    const r = decision(c, `ward-${ec.id}-response`)!;
    expect(r.correct).toBe(false);
    expect(r.given).toMatch(/aspirin/i);
    // the same steps without the aspirin are a complete and safe response; aspirin after the CT is not the error
    expect(gradeWardActions("stroke", ["abc", "onset-time", "stroke-team", "neuro-exam", "ct-cta"])).toMatchObject({ harmful: null, complete: true, firstCorrect: true });
    expect(gradeWardActions("stroke", ["abc", "ct-cta", "aspirin"]).harmful).toBeNull();
    expect(gradeWardActions("stroke", ["aspirin"]).firstCorrect).toBe(false);
  });

  it("every menu names its right first actions among its options, and no option names the problem", () => {
    for (const [kind, r] of Object.entries(WARD_EVENT_RULES)) {
      const ids = r.options.map((o) => o.id);
      for (const id of [...r.firstCorrect, ...r.essential, ...r.harmful.map((h) => h.id)]) expect(ids, `${kind}:${id}`).toContain(id);
      for (const o of r.options) expect(o.label, kind).not.toMatch(/tamponade|stroke thrombosis|haematoma|nephropathy|stent thrombosis/i);
      // an option offered only after another action names an action on the same menu
      for (const o of r.options) if (o.after) expect(ids, `${kind}:${o.id} after ${o.after}`).toContain(o.after);
      // no menu assumes the patient's sex
      for (const o of r.options) expect(o.label, kind).not.toMatch(/\b(she|he|her|his)\b/i);
    }
  });

  it("the tamponade menu offers pericardiocentesis only once the echo has been done", () => {
    expect(wardOptionsNow("tamponade", []).map((o) => o.id)).not.toContain("pericardiocentesis");
    expect(wardOptionsNow("tamponade", ["senior-fluids"]).map((o) => o.id)).not.toContain("pericardiocentesis");
    expect(wardOptionsNow("tamponade", ["echo"]).map((o) => o.id)).toContain("pericardiocentesis");
    expect(WARD_EVENT_RULES.tamponade.tipIds).not.toContain("pci-post-chest-pain-ward");
    const s = open("ward-tamponade-after-perforation");
    oxfordPlan(s);
    runWard(s, 150, () => s.ward.openEvents().length > 0);
    const e = s.ward.openEvents()[0];
    expect(e.kind).toBe("tamponade");
    // asked for before the echo: refused, and nothing is scored
    expect(s.wardAct(e.id, "pericardiocentesis")).toBeNull();
    expect(e.actions).toHaveLength(0);
    expect(decision(s, `ward-${e.id}-first`)).toBeUndefined();
    s.wardAct(e.id, "echo");
    s.runPending();
    expect(s.wardAct(e.id, "pericardiocentesis")).toMatch(/drains/);
  });

  it("chest pain and a stroke reported by the patient stop a long recovery time-lapse when they begin", () => {
    const a = open("ward-chest-pain-post-pci");
    oxfordPlan(a);
    a.observe(90);
    a.runPending();
    expect(Math.round((a.tS - a.ward.arrivedAt!) / 60)).toBe(40);
    expect(a.ward.openEvents()[0].kind).toBe("chest-pain-post-pci");
    expect(a.log.some((l) => /the nurse calls you/.test(l.text))).toBe(true);
    const b = open("ward-stroke-late");
    b.setWardPlan(oxfordSchedule("radial"), oxfordMobilisation("radial-band"));
    b.observe(200);
    b.runPending();
    expect(Math.round((b.tS - b.ward.arrivedAt!) / 60)).toBe(150);
    expect(b.ward.openEvents()[0].kind).toBe("stroke");
    // a lapse with nothing found runs to its end
    const c = open("ward-femoral-6f");
    oxfordPlan(c);
    const t0 = c.tS;
    c.observe(60);
    c.runPending();
    expect(Math.round((c.tS - t0) / 60)).toBe(60);
  });

  it("the creatinine rise is a result at the 48-72 hour review: hydration and a repeat creatinine are right, discharge is wrong", () => {
    const s = open("ward-creatinine-rise");
    oxfordPlan(s);
    expect(s.activeEvents()).toContain("high-contrast-volume");
    expect(s.wardFollowUp()).toMatch(/218/);
    const e = s.ward.openEvents()[0];
    expect(e.kind).toBe("creatinine-rise");
    expect(e.foundBy).toBe("bloods");
    s.wardAct(e.id, "hydrate");
    s.runPending();
    s.wardAct(e.id, "repeat-creatinine");
    s.runPending();
    expect(decision(s, `ward-${e.id}-first`)!.correct).toBe(true);
    expect(decision(s, `ward-${e.id}-response`)!.correct).toBe(true);
    expect(gradeWardActions("creatinine-rise", ["discharge"]).harmful).toBe("discharge");
    // a case without the rise: the review says unchanged
    const t = open("ward-femoral-6f");
    expect(t.wardFollowUp()).toMatch(/unchanged/);
  });
});

describe("the end of the case at the table", () => {
  it("a flushed clot in 'table-embolic-stroke' raises neuro-deficit and the attending stops the case", () => {
    const s = open("table-embolic-stroke");
    expect(s.catheter?.lumenClot).toBe(true);
    expect(s.activeEvents()).not.toContain("neuro-deficit");
    // flushed without aspirating: the clot goes into the aorta and a stroke follows
    s.flush();
    s.runPending();
    expect(s.complications.some((c) => c.id === "clot-flushed" && c.critical)).toBe(true);
    expect(s.activeEvents()).toContain("neuro-deficit");
    const stroke = s.ward.tableStroke!;
    expect(stroke.foundS).not.toBeNull();
    // the deficit is told once (the nurse), and the attending does not name the first action before the learner acts
    expect(s.log.filter((l) => /words/.test(l.text))).toHaveLength(1);
    expect(s.log.some((l) => l.kind === "nurse" && /words/.test(l.text))).toBe(true);
    expect(s.attending.some((a) => /stroke team|cannot find/.test(a.text))).toBe(false);
    // the case goes no further: the study is not handed on, and the attending stops the case
    expect(s.handover("diagnostic")).toBeNull();
    expect(s.attending[s.attending.length - 1].text).toMatch(/stroke team/);
    expect(s.attending[s.attending.length - 1].stop).toBe(true);
    // the neurological check finds the deficit
    expect(s.neuroCheckAtTable()).toMatch(/words/);
    s.runPending();
    // the stroke pathway at once: right; the heparin given is put to the stroke team
    expect(s.wardAct(stroke.id, "stop-case")).not.toBeNull();
    s.runPending();
    s.wardAct(stroke.id, "stroke-team");
    s.runPending();
    expect(s.wardAct(stroke.id, "ct-cta")).toMatch(/Heparin .* U/);
    s.runPending();
    expect(decision(s, "table-stroke-first")!.correct).toBe(true);
    expect(decision(s, "table-stroke-response")!.correct).toBe(true);
    // finishing the coronary study first is wrong, and the attending then stops the case
    const t = open("table-embolic-stroke");
    t.flush();
    t.runPending();
    t.wardAct(t.ward.tableStroke!.id, "finish-study");
    t.runPending();
    expect(decision(t, "table-stroke-first")!.correct).toBe(false);
    expect(t.attending.some((a) => a.stop && /stroke team/.test(a.text))).toBe(true);
    // with no first action the attending steps in after a short wait
    const u = open("table-embolic-stroke");
    u.flush();
    u.runPending();
    expect(u.attending.some((a) => /stroke team/.test(a.text))).toBe(false);
    u.tick(MP_WARD.tableStopAfterS + 5);
    expect(u.attending.some((a) => a.stop && /^Stop\..*stroke team/.test(a.text))).toBe(true);
  });

  it("a stroke on the table left unanswered is scored at the close, at the table, even without a ward plan", () => {
    const s = open("table-embolic-stroke");
    s.flush();
    s.runPending();
    expect(s.ward.tableStroke).not.toBeNull();
    expect(s.ward.plan).toBeNull();
    s.ward.close();
    const first = decision(s, "table-stroke-first")!;
    const resp = decision(s, "table-stroke-response")!;
    expect(first.correct).toBe(false);
    expect(first.stage).toBe("table");
    expect(resp.correct).toBe(false);
    expect(resp.stage).toBe("table");
    // no plan, no chart: the sets are not scored
    expect(decision(s, "ward-sets-reviewed")).toBeUndefined();
  });

  it("aspirating before the flush clears the clot: no stroke", () => {
    const s = open("table-embolic-stroke");
    s.aspirate();
    s.runPending();
    s.flush();
    s.runPending();
    expect(s.ward.tableStroke).toBeNull();
    expect(s.activeEvents()).not.toContain("neuro-deficit");
  });

  it("the end-of-case neurological check is scored when the ward plan is written, unless the team did the table", () => {
    // cases the learner closes (opened at 'closure'), checked and not checked before the closure
    for (const checked of [true, false]) {
      const s = newCaseSession({ seed: "ward-neuro-check", access: "radial-right", start: "closure" }).session;
      if (checked) {
        expect(s.neuroCheckAtTable()).toMatch(/speaks clearly and moves all four limbs/);
        s.runPending();
      }
      fastForward(s, "recovery");
      expect(s.ward.arrived).toBe(true);
      s.setWardPlan(oxfordSchedule("radial"), oxfordMobilisation("radial-band"));
      expect(decision(s, "ward-table-neuro-check")!.correct).toBe(checked);
    }
    // a scenario opened on the ward: the table was the team's, nothing is scored for it
    const t = open("ward-radial");
    oxfordPlan(t);
    expect(decision(t, "ward-table-neuro-check")).toBeUndefined();
  });
});

describe("a case finished without a ward plan", () => {
  it("is scored for the schedule and the mobilisation plan not written; a case finished as the patient arrives is not", () => {
    const s = open("ward-forearm-haematoma");
    s.tick(120);
    s.ward.close();
    for (const id of ["ward-schedule", "ward-mobilisation"]) {
      const d = decision(s, id)!;
      expect(d.correct, id).toBe(false);
      expect(d.given, id).toBe("No plan written");
    }
    // the table was the team's in a scenario opened on the ward
    expect(decision(s, "ward-table-neuro-check")).toBeUndefined();
    // the learner's own case, run on the ward past the arrival window without a plan: the table's check is scored too
    const t = newCaseSession({ seed: "ward-neuro-check", access: "radial-right", start: "closure" }).session;
    fastForward(t, "recovery");
    t.observe(30);
    t.runPending();
    t.ward.close();
    expect(decision(t, "ward-schedule")!.correct).toBe(false);
    expect(decision(t, "ward-table-neuro-check")!.correct).toBe(false);
    // finished as the patient reaches the ward: nothing on the ward is scored
    const u = newCaseSession({ seed: "ward-neuro-check", access: "radial-right", start: "closure" }).session;
    fastForward(u, "recovery");
    u.ward.close();
    expect(decision(u, "ward-schedule")).toBeUndefined();
  });

  it("labels run into a sentence keep their acronyms", () => {
    expect(lowerFirst("Emergency non-contrast CT head with CT angiography")).toBe("emergency non-contrast CT head with CT angiography");
    expect(lowerFirst("")).toBe("");
  });
});

describe("what the ward declares for the reachability report", () => {
  it("the access entry names only what the ward raises (a haematoma; the session's rebleed raises bleeding)", () => {
    const access = raises.find((r) => r.lab === "access")!;
    expect(access.events).toEqual(["haematoma"]);
  });
});

describe("follow-up", () => {
  it("'followup-cholesterol-emboli' presents cholesterol embolisation; supportive care is right and emergency limb angiography wrong", () => {
    const s = open("followup-cholesterol-emboli");
    expect(s.ward.cholesterolRisk()).toBe(true);
    const v = s.ward.presentCholesterolFollowUp()!;
    expect(v.present).toBe(true);
    expect(v.text).toMatch(/foot pulses are easy to feel/);
    expect(v.text).not.toMatch(/cholesterol|embol/i);
    expect(s.ward.assessCholesterol("acute-limb-ischaemia", "limb-angiography")).toEqual({ dxCorrect: false, planCorrect: false });
    expect(decision(s, "followup-cholesterol-assessment")!.correct).toBe(false);
    const t = open("followup-cholesterol-emboli");
    t.ward.presentCholesterolFollowUp();
    expect(t.ward.assessCholesterol("cholesterol-embolisation", "supportive")).toEqual({ dxCorrect: true, planCorrect: true });
    // without wireless exchanges in a diseased aorta the review is of a well patient
    const u = open("ward-femoral-6f");
    expect(u.ward.cholesterolRisk()).toBe(false);
    expect(u.ward.presentCholesterolFollowUp()!.present).toBe(false);
  });
});
