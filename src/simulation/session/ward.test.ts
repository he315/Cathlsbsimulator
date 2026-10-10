// proc-recovery-ward: the ward's schedule, its observations at the scheduled times only, the findings that wait
// for an observation that includes them, the first-action menus, the stroke on the table and the follow-ups.
//   npx vitest run src/simulation/session/ward.test.ts
import { describe, it, expect } from "vitest";
import { newCaseSession, type CaseSession } from "./caseSession";
import {
  MP_WARD,
  OXFORD_WARD,
  gradeMobilisation,
  gradeSchedule,
  oxfordMobilisation,
  oxfordSchedule,
  type WardSchedule,
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

describe("the ward's schedule and mobilisation plan", () => {
  it("a radial schedule without 15-minute site checks while the band is on is wrong; the Oxford schedule is correct", () => {
    const ox = oxfordSchedule("radial");
    expect(gradeSchedule(ox, { route: "radial", stent: false }).correct).toBe(true);
    // site checks every 30 minutes, every hour, none, or only for the first hour while the band stays on: wrong
    const variants: WardSchedule[] = [
      { ...ox, siteMin: 30 },
      { ...ox, siteMin: 60 },
      { ...ox, siteMin: null },
      { ...ox, siteUntil: "first-hour" },
      { ...ox, siteUntil: "mobile" },
    ];
    for (const v of variants) {
      const g = gradeSchedule(v, { route: "radial", stent: false });
      expect(g.correct, JSON.stringify(v)).toBe(false);
      expect(g.items.find((i) => i.id === "site")!.correct).toBe(false);
    }
    // the observation periods and the arrival checks are graded too, and ECG monitoring after a stent
    expect(gradeSchedule({ ...ox, vitalsMin: [15, 60, 60] }, { route: "radial", stent: false }).correct).toBe(false);
    expect(gradeSchedule({ ...ox, arrival: { vitals: true, neuro: false, site: true } }, { route: "radial", stent: false }).correct).toBe(false);
    expect(gradeSchedule(ox, { route: "radial", stent: true }).correct).toBe(false);
    expect(gradeSchedule(oxfordSchedule("radial", true), { route: "radial", stent: true }).correct).toBe(true);
    // the femoral routine: until mobile, with the distal pulses
    const fem = oxfordSchedule("femoral");
    expect(gradeSchedule(fem, { route: "femoral", stent: false }).correct).toBe(true);
    expect(gradeSchedule({ ...fem, distalPulses: false }, { route: "femoral", stent: false }).correct).toBe(false);
    expect(gradeSchedule({ ...fem, siteUntil: "band-off" }, { route: "femoral", stent: false }).correct).toBe(false);
  });

  it("the session scores the schedule and the mobilisation for the route: Oxford's radial plan right, a radial plan with hourly site checks wrong", () => {
    const s = open("ward-forearm-haematoma");
    expect(s.ward.arrived).toBe(true);
    const g = s.setWardPlan({ ...oxfordSchedule("radial"), siteMin: 60 }, oxfordMobilisation("radial-band"))!;
    expect(g.schedule.correct).toBe(false);
    expect(decision(s, "ward-schedule")!.correct).toBe(false);
    expect(decision(s, "ward-schedule")!.given).toMatch(/every 60 min/);
    expect(decision(s, "ward-mobilisation")!.correct).toBe(true);
    // the plan is written once
    expect(s.setWardPlan(oxfordSchedule("radial"), oxfordMobilisation("radial-band"))).toBeNull();
    const t = open("ward-radial");
    expect(oxfordPlan(t)!.schedule.correct).toBe(true);
    expect(decision(t, "ward-schedule")!.correct).toBe(true);
  });

  it("mobilisation: about an hour after radial or a device; flat an hour and walking from 2 1/2 hours (or after 3 hours) after a manual femoral closure", () => {
    expect(gradeMobilisation(oxfordMobilisation("radial-band"), "radial-band").correct).toBe(true);
    expect(gradeMobilisation(oxfordMobilisation("device"), "device").correct).toBe(true);
    expect(gradeMobilisation(oxfordMobilisation("manual"), "manual").correct).toBe(true);
    expect(gradeMobilisation({ flatMin: OXFORD_WARD.femoralFlatMin, walkMin: OXFORD_WARD.femoralWalkAltMin }, "manual").correct).toBe(true);
    // the radial plan after a femoral line, and the femoral plan after radial, are wrong
    expect(gradeMobilisation(oxfordMobilisation("radial-band"), "manual").correct).toBe(false);
    expect(gradeMobilisation(oxfordMobilisation("manual"), "radial-band").correct).toBe(false);
    // a small femoral sheath (5 F) closed by hand: Oxford's short plan is right, and the 6 F plan is not wrong
    expect(MP_WARD.smallFemoralSheathMaxFr).toBeLessThan(6);
    expect(gradeMobilisation(oxfordMobilisation("radial-band"), "manual", 5).correct).toBe(true);
    expect(gradeMobilisation(oxfordMobilisation("manual"), "manual", 5).correct).toBe(true);
    expect(gradeMobilisation(oxfordMobilisation("radial-band"), "manual", 6).correct).toBe(false);
    expect(gradeMobilisation({ flatMin: 0, walkMin: 240 }, "manual", 5).correct).toBe(false);
    const s = open("ward-femoral-6f");
    expect(s.workingSite().route).toBe("femoral");
    const g = s.setWardPlan(oxfordSchedule("femoral"), { flatMin: 0, walkMin: 60 })!;
    expect(g.schedule.correct).toBe(true);
    expect(decision(s, "ward-mobilisation")!.correct).toBe(false);
  });
});

describe("observations at the scheduled times", () => {
  it("tick(3600) shows observations only at the scheduled times (the browser check, in the engine)", () => {
    const s = open("ward-femoral-6f");
    // before the plan, the nurse charts nothing
    s.tick(60);
    expect(s.ward.sets).toHaveLength(0);
    oxfordPlan(s);
    const t0 = s.ward.arrivedAt!;
    s.tick(3600);
    const mins = s.ward.sets.map((x) => Math.round((x.atS - t0) / 60));
    const planned = Math.round((s.ward.plan!.setAt - t0) / 60);
    // the arrival set when the plan is written, then every 15 minutes to the hour
    expect(mins).toEqual([planned, 15, 30, 45, 60]);
    // every set holds the observations, the groin and the femoral, popliteal and pedal pulses (until mobile)
    for (const x of s.ward.sets.slice(1)) expect(x.kinds.sort()).toEqual(["pulses", "site", "vitals"]);
    expect(s.ward.sets[0].kinds).toContain("neuro");
    expect(s.ward.sets[1].pulses).toMatch(/Femoral .*popliteal .*foot/);
    // the nurse charts the pulses felt now; the comparison with the start of the case is the learner's
    for (const x of s.ward.sets) if (x.pulses) expect(x.pulses).not.toMatch(/start|changed|as at/i);
    const before = s.wardStartPulses();
    if (before !== null) expect(before).toMatch(/Femoral .*foot/);
    // the second hour every 30 minutes; the groin until the patient walks at 2 1/2 hours, then observations only
    s.tick(3600);
    s.tick(1800);
    const after = s.ward.sets.map((x) => Math.round((x.atS - t0) / 60));
    expect(after.slice(5)).toEqual([75, 90, 105, 120, 135, 150]);
    expect(s.ward.sets.find((x) => Math.round((x.atS - t0) / 60) === 75)!.kinds).not.toContain("vitals");
    expect(s.log.some((l) => /up and walking/.test(l.text))).toBe(true);
    s.tick(3600);
    const late = s.ward.sets.map((x) => Math.round((x.atS - t0) / 60)).slice(11);
    expect(late).toEqual([180]);
    expect(s.ward.sets[s.ward.sets.length - 1].kinds).toEqual(["vitals"]);
  });

  it("a set is reviewed by the learner; sets left unreviewed are scored when the case ends", () => {
    const s = open("ward-femoral-6f");
    oxfordPlan(s);
    s.tick(1800);
    expect(s.ward.sets.length).toBe(3);
    expect(s.reviewWardSet(0)).toBe(true);
    expect(s.reviewWardSet(0)).toBe(false);
    s.ward.close();
    const d = decision(s, "ward-sets-reviewed")!;
    expect(d.correct).toBe(false);
    expect(d.given).toMatch(/2 of 3/);
  });
});

describe("findings appear only at an observation that includes them", () => {
  it("in 'ward-forearm-haematoma' the haematoma is found at the first site check after onset and is larger when checks are skipped", () => {
    const onsetMin = 20;
    // Oxford: site checks every 15 minutes while the band is on: onset at 20 min, found at the 30 min check
    const a = open("ward-forearm-haematoma");
    oxfordPlan(a);
    const t0 = a.ward.arrivedAt!;
    runWard(a, 90, () => a.ward.openEvents().length > 0);
    const ea = a.ward.events.find((e) => e.kind === "forearm-haematoma")!;
    expect(Math.round((ea.onsetS - t0) / 60)).toBe(onsetMin);
    expect(ea.foundBy).toBe("site");
    expect(Math.round((ea.foundS! - t0) / 60)).toBe(30);
    // found at the set: the set says so, and the recovery lapse stopped there
    expect(a.ward.sets[a.ward.sets.length - 1].remark).toMatch(/swelling/);
    expect(Math.round((a.tS - t0) / 60)).toBe(30);
    expect(a.activeEvents()).toContain("haematoma");
    expect(a.presented.some((d) => d.kind === "forearm-haematoma")).toBe(true);
    // hourly site checks: found at the 60 min check, larger
    const b = open("ward-forearm-haematoma");
    b.setWardPlan({ ...oxfordSchedule("radial"), siteMin: 60 }, oxfordMobilisation("radial-band"));
    runWard(b, 120, () => b.ward.openEvents().length > 0);
    const eb = b.ward.events.find((e) => e.kind === "forearm-haematoma")!;
    expect(Math.round((eb.foundS! - b.ward.arrivedAt!) / 60)).toBe(60);
    expect(eb.mlAtFind!).toBeGreaterThan(ea.mlAtFind!);
    // no site checks at all: found only when the patient complains of it, larger again
    const c = open("ward-forearm-haematoma");
    c.setWardPlan({ ...oxfordSchedule("radial"), siteMin: null, arrival: { vitals: true, neuro: true, site: true } }, oxfordMobilisation("radial-band"));
    runWard(c, 180, () => c.ward.openEvents().length > 0);
    const ec = c.ward.events.find((e) => e.kind === "forearm-haematoma")!;
    expect(ec.foundBy).toBe("report");
    expect(ec.mlAtFind!).toBeGreaterThanOrEqual(MP_WARD.reportMl);
    expect(ec.mlAtFind!).toBeGreaterThan(eb.mlAtFind!);
  });

  it("the haematoma's first action: compression first is right and stops it growing; noting it for the next check is wrong; acting after the next set is late", () => {
    const a = open("ward-forearm-haematoma");
    oxfordPlan(a);
    runWard(a, 90, () => a.ward.openEvents().length > 0);
    const e = a.ward.openEvents()[0];
    expect(a.wardAct(e.id, "compress")).toMatch(/stops growing/);
    a.runPending();
    const ml = a.ward.mlAt(e, a.tS);
    a.tick(600);
    expect(a.ward.mlAt(e, a.tS)).toBe(ml);
    a.wardAct(e.id, "mark-grade");
    a.runPending();
    a.wardAct(e.id, "escalate");
    a.runPending();
    expect(decision(a, `ward-${e.id}-first`)!.correct).toBe(true);
    expect(decision(a, `ward-${e.id}-recognised`)!.correct).toBe(true);
    expect(decision(a, `ward-${e.id}-response`)!.correct).toBe(true);
    expect(e.resolvedAt).not.toBeNull();

    const b = open("ward-forearm-haematoma");
    oxfordPlan(b);
    runWard(b, 90, () => b.ward.openEvents().length > 0);
    const eb = b.ward.openEvents()[0];
    // the ward runs on past the next set before anyone acts
    b.tick(16 * 60);
    b.wardAct(eb.id, "recheck-later");
    expect(decision(b, `ward-${eb.id}-first`)!.correct).toBe(false);
    expect(decision(b, `ward-${eb.id}-recognised`)!.correct).toBe(false);
    expect(decision(b, `ward-${eb.id}-response`)!.correct).toBe(false);
  });

  it("a tamponade after a perforation is found at the set whose pressure has fallen, and attributing it to fasting alone is wrong", () => {
    const s = open("ward-tamponade-after-perforation");
    oxfordPlan(s);
    runWard(s, 150, () => s.ward.openEvents().length > 0);
    const e = s.ward.openEvents()[0];
    expect(e.kind).toBe("tamponade");
    expect(e.foundBy).toBe("vitals");
    const set = s.ward.sets.find((x) => x.remark)!;
    expect(set.bp!.sys < MP_WARD.lowSysMmHg || set.hr! > MP_WARD.highHr).toBe(true);
    // the earlier sets were normal: the finding was not there to see
    for (const x of s.ward.sets.filter((y) => y.atS < set.atS && y.bp)) expect(x.bp!.sys).toBeGreaterThanOrEqual(MP_WARD.lowSysMmHg);
    expect(s.wardAct(e.id, "echo")).toMatch(/effusion/);
    s.runPending();
    s.wardAct(e.id, "fluids-only");
    s.runPending();
    expect(decision(s, `ward-${e.id}-first`)!.correct).toBe(true);
    expect(decision(s, `ward-${e.id}-response`)!.correct).toBe(false);
    // the drain empties the pericardium
    s.wardAct(e.id, "senior-fluids");
    s.runPending();
    s.wardAct(e.id, "pericardiocentesis");
    s.runPending();
    expect(s.patient.vitals().pericardialMl).toBeLessThan(5);
    expect(e.resolvedAt).not.toBeNull();
  });
});

