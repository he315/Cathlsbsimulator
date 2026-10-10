// access-cx-bleeding-retroperitoneal: the session module's own behaviour in the full case (modules/bleeding.ts):
// a pelvis screen only counts with a bleed in hand, the general-measures verdict judges the first minute, a
// missing antiplatelet plan is scored, and a bleed the closure model drew is followed without a false seal.
//   npx vitest run src/simulation/session/modules/bleeding.module.test.ts
import { describe, expect, it } from "vitest";
import { MP_RP } from "../../access/bleeding";
import { RP_DELAYED_TEXT } from "../../access/closure";
import { newCaseSession, type CaseSession } from "../caseSession";
import { crossover } from "../autopilot";
import { bleedingOf, PLAN_VERDICT_AFTER_S, type BleedingModule } from "./bleeding";
import { caseTipContexts } from "../../../ui/access/caseTips";

const open = (id: string) => {
  const { session: s } = newCaseSession({ scenario: id });
  return { s, m: bleedingOf(s)! };
};

function untilOnset(s: CaseSession, m: BleedingModule, maxS = 240): void {
  for (let t = 0; t <= maxS && !m.state.episode; t += 5) {
    s.wait(5);
    s.runPending();
  }
  expect(m.state.episode, "the bleed presented").not.toBeNull();
}

function run(s: CaseSession, sec: number): void {
  s.wait(sec);
  s.runPending();
}

const decision = (s: CaseSession, id: string) => s.decisions().find((d) => d.id === id);

function generalMeasures(m: BleedingModule): void {
  m.actions.suspect();
  for (const id of ["large-bore", "crossmatch", "hb", "crystalloid"] as const) expect(m.actions.order(id).ok, id).toBe(true);
}

describe("bleeding module: screens, timing and adopted bleeds", () => {
  it("a pelvis screen in a femoral case without a bleed records nothing: no suspicion, no tips context, no log line", () => {
    const { session: s } = newCaseSession({ seed: "rp-pelvis-none", access: "femoral", start: "closure" });
    const m = bleedingOf(s)!;
    run(s, 30);
    expect(m.actions.noteBladderScreen("ap")).toBe(false);
    run(s, 30);
    m.actions.noteBladderScreen("ap");
    expect(m.state.bladder.screenedT).toBeNull();
    expect(m.state.suspectedT).toBeNull();
    expect(m.events!()).toEqual([]);
    expect(m.tipContexts!()).toEqual([]);
    expect(caseTipContexts(s, "table").some((c) => c.phase === "complication")).toBe(false);
    expect(s.log.some((l) => /Pelvis screened/.test(l.text))).toBe(false);
    expect(s.decisions().filter((d) => d.id.startsWith("rp-"))).toEqual([]);
  });

  it("rp-on-table: a pelvis screen before the onset uses nothing up; the first screen after it is the bladder route", () => {
    const { s, m } = open("rp-on-table");
    expect(m.state.episode).toBeNull();
    expect(m.actions.noteBladderScreen("ap")).toBe(false);
    expect(m.state.bladder.screenedT).toBeNull();
    expect(m.state.suspectedT).toBeNull();
    untilOnset(s, m);
    expect(m.actions.noteBladderScreen("ap")).toBe(true);
    expect(m.state.bladder.screenedT).not.toBeNull();
    const r = decision(s, "rp-route")!;
    expect(r).toMatchObject({ correct: true });
    expect(r.given).toMatch(/Screen the bladder/);
  });

  it("rp-on-table: the bladder screened at onset plus 5 s, then the measures at plus 15 s: the general measures are on time", () => {
    const { s, m } = open("rp-on-table");
    untilOnset(s, m);
    const onset = m.state.episode!.onsetT;
    run(s, Math.max(0, onset + 5 - s.tS));
    m.actions.noteBladderScreen("ap");
    expect(decision(s, "rp-route")).toMatchObject({ correct: true });
    expect(decision(s, "rp-general-measures")).toBeUndefined();
    run(s, Math.max(0, onset + 15 - s.tS));
    for (const id of ["large-bore", "crossmatch", "hb"] as const) expect(m.actions.order(id).ok, id).toBe(true);
    run(s, 60);
    expect(decision(s, "rp-general-measures")).toMatchObject({ correct: true });
  });

  it("rp-on-table: nothing ordered in the first minute is scored at the minute's end", () => {
    const { s, m } = open("rp-on-table");
    untilOnset(s, m);
    run(s, 30);
    expect(decision(s, "rp-general-measures")).toBeUndefined();
    run(s, 40);
    const d = decision(s, "rp-general-measures")!;
    expect(d).toMatchObject({ correct: false });
    expect(d.given).toMatch(/None started/);
  });

  it("rp-cangrelor: no antiplatelet plan by the delay after the bleed is controlled is scored wrong", () => {
    const { s, m } = open("rp-cangrelor");
    untilOnset(s, m);
    generalMeasures(m);
    m.actions.order("stop-iv-antiplatelet");
    m.actions.noteBladderScreen("ap");
    crossover(s, "left");
    expect(m.actions.contralateralAngiogram().ok).toBe(true);
    run(s, MP_RP.angioS + 5);
    expect(m.actions.treat("balloon").ok).toBe(true);
    expect(m.actions.treat("covered-stent").ok).toBe(true);
    run(s, MP_RP.stentS + 5);
    expect(m.state.episode!.sealed?.by).toBe("covered-stent");
    run(s, PLAN_VERDICT_AFTER_S - 60);
    expect(decision(s, "rp-antiplatelet-plan")).toBeUndefined();
    run(s, 70);
    const d = decision(s, "rp-antiplatelet-plan")!;
    expect(d).toMatchObject({ correct: false, given: "No plan recorded" });
    expect(d.expected).toMatch(/oral P2Y12 plan/);
  });

  it("a retroperitoneal bleed drawn by the closure model is adopted and followed, holds no time-lapse, and is never falsely sealed", () => {
    const { session: s } = newCaseSession({ seed: "rp-adopt", access: "femoral", start: "recovery" });
    const m = bleedingOf(s)!;
    s.lapseHoldsOn = true;
    const site = s.sites.find((x) => x.route === "femoral")!;
    site.delayed.push({ kind: "retroperitoneal-bleed", atS: s.tS + 10, bleedMlMin: 40, totalMl: 800, report: RP_DELAYED_TEXT.report, finding: RP_DELAYED_TEXT.finding, severity: "major" });
    run(s, 30);
    const e = m.state.episode!;
    expect(e).not.toBeNull();
    expect(e.adopted).toBe(true);
    expect(s.lapseHeld?.by ?? []).not.toContain("bleeding");
    const h0 = e.haematomaMl;
    run(s, 60);
    expect(e.haematomaMl).toBeGreaterThan(h0);
    m.actions.suspect();
    expect(m.actions.backToLab().ok).toBe(true);
    run(s, MP_RP.backToLabS + 5);
    expect(m.actions.contralateralAngiogram().ok).toBe(true);
    run(s, MP_RP.teamContralateralS + MP_RP.angioS + 5);
    expect(m.actions.treat("balloon").ok).toBe(true);
    expect(m.actions.treat("covered-stent").ok).toBe(true);
    expect(decision(s, "rp-treatment")).toBeDefined();
    run(s, MP_RP.stentS + 5);
    expect(e.sealed).toBeNull();
    expect(s.log.some((l) => /Check angiogram: no contrast leaves the artery/.test(l.text))).toBe(false);
    // once the session's bleed has run its course the episode's end verdicts are written
    expect(e.lostMl).toBeCloseTo(800, 0);
    expect(decision(s, "rp-crystalloid")).toBeDefined();
  });
});
