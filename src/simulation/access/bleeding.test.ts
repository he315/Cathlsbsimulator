// access-cx-bleeding-retroperitoneal: the retroperitoneal bleed. The pure model (src/simulation/access/bleeding.ts),
// the closure's retroperitoneal risk terms (closure.ts), the bladder drawing (route.ts), and the full case's
// scenarios (scenarios/bleeding.ts) driven through the session module (modules/bleeding.ts).
//   npx vitest run src/simulation/access/bleeding.test.ts
import { describe, expect, it } from "vitest";
import {
  MP_HB,
  MP_RP,
  RP_SOURCED,
  bladderDentMm,
  gradeAntiplateletPlan,
  gradeDoacReversal,
  gradePlatelets,
  gradeRoute,
  gradeTreatment,
  hbNow,
  newHbModel,
  protamineOrderCheck,
  stepHb,
} from "./bleeding";
import { femoralRisk, retroperitonealMultiplier, MP_FEMORAL, RP_DELAYED_TEXT, scheduleDelayed, type FemoralFactors } from "./closure";
import { bladderCentre, bladderTubes, pelvisFrameCentre, pointAt, MP_BLADDER } from "./route";
import { newCaseSession, type CaseSession } from "../session/caseSession";
import { crossover } from "../session/autopilot";
import { bleedingOf, type BleedingModule } from "../session/modules/bleeding";
import { SID, SOD } from "../../render/xray/sceneBuilder";
import { scenarios } from "../session/scenarios/bleeding";
import { launch } from "../session/scenarios/bleeding.launch";
import { practiceForCase, practiceForLesson } from "../../ui/content/practiceIndex";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const open = (id: string) => {
  const { session: s } = newCaseSession({ scenario: id });
  return { s, m: bleedingOf(s)! };
};

/** Let the case run until the scenario's bleed presents (at most `maxS`). */
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

/** The general measures at once: access, crossmatch, haemoglobin and a crystalloid bolus. */
function generalMeasures(m: BleedingModule): void {
  m.actions.suspect();
  for (const id of ["large-bore", "crossmatch", "hb", "crystalloid"] as const) expect(m.actions.order(id).ok, id).toBe(true);
}

// ---------------------------------------------------------------------------
// the pure model
// ---------------------------------------------------------------------------

describe("haemoglobin model", () => {
  it("whole blood lost leaves the concentration unchanged at first; refill dilutes it later; red cells raise it", () => {
    const m = newHbModel("M", 80);
    expect(hbNow(m)).toBeCloseTo(MP_HB.baselineGdl.M, 6);
    // 25 mL/min for 10 min, then 50 more minutes
    for (let i = 0; i < 600; i++) stepHb(m, 1, { lostMl: 25 / 60 });
    const at10 = hbNow(m);
    expect(Math.abs(at10 - MP_HB.baselineGdl.M)).toBeLessThan(1);
    for (let i = 0; i < 3000; i++) stepHb(m, 1, { lostMl: 25 / 60 });
    const at60 = hbNow(m);
    expect(at60).toBeLessThan(at10 - 0.5);
    const before = hbNow(m);
    stepHb(m, 1, { redCellMl: MP_RP.redCellUnitMl, redCellHbG: MP_RP.redCellUnitHbG });
    expect(hbNow(m)).toBeGreaterThan(before);
    // crystalloid dilutes while it stays in the circulation
    const m2 = newHbModel("F", 60);
    stepHb(m2, 1, { crystalloidMl: 1000 });
    expect(hbNow(m2)).toBeLessThan(MP_HB.baselineGdl.F - 1);
  });
});

describe("grading (pure)", () => {
  it("the route: in the laboratory the bladder and the other groin; in recovery unstable back to the lab, stable to CT", () => {
    expect(gradeRoute("table", true, "bladder").correct).toBe(true);
    expect(gradeRoute("table", true, "ct").correct).toBe(false);
    expect(gradeRoute("recovery", true, "ct").correct).toBe(false);
    expect(gradeRoute("recovery", true, "back-to-lab").correct).toBe(true);
    expect(gradeRoute("recovery", false, "ct").correct).toBe(true);
  });

  it("treatment by source: balloon first, covered stent for a large vessel, coils for a branch after the retrograde check; nothing to treat without a bleeding point", () => {
    expect(gradeTreatment("large-vessel", "balloon", { balloonFirst: false, retrogradeChecked: false })).toMatchObject({ correct: true, effect: "holds" });
    expect(gradeTreatment("large-vessel", "covered-stent", { balloonFirst: true, retrogradeChecked: false })).toMatchObject({ correct: true, effect: "seals" });
    expect(gradeTreatment("large-vessel", "covered-stent", { balloonFirst: false, retrogradeChecked: false }).correct).toBe(false);
    expect(gradeTreatment("large-vessel", "coils", { balloonFirst: true, retrogradeChecked: true })).toMatchObject({ correct: false, effect: "none" });
    expect(gradeTreatment("small-branch", "coils", { balloonFirst: true, retrogradeChecked: true })).toMatchObject({ correct: true, effect: "seals" });
    expect(gradeTreatment("small-branch", "coils", { balloonFirst: true, retrogradeChecked: false }).correct).toBe(false);
    for (const t of ["balloon", "covered-stent", "coils", "surgery"] as const) expect(gradeTreatment("haematoma-no-active", t, { balloonFirst: true, retrogradeChecked: true }).correct, t).toBe(false);
    expect(gradeTreatment("haematoma-no-active", "conservative", { balloonFirst: false, retrogradeChecked: false }).correct).toBe(true);
    expect(gradeTreatment("no-haematoma", "other-cause", { balloonFirst: false, retrogradeChecked: false }).correct).toBe(true);
    expect(gradeTreatment("no-haematoma", "conservative", { balloonFirst: false, retrogradeChecked: false }).correct).toBe(false);
  });

  it("reversal and antiplatelets: protamine above 50 mg refused; DOAC agents by drug; platelets not expected to reverse ticagrelor; DAPT not stopped outright", () => {
    expect(protamineOrderCheck(80).refused).toBe(true);
    expect(protamineOrderCheck(RP_SOURCED.protamineMaxMg).refused).toBe(false);
    expect(gradeDoacReversal("dabigatran", "idarucizumab").correct).toBe(true);
    expect(gradeDoacReversal("dabigatran", "andexanet").correct).toBe(false);
    expect(gradeDoacReversal("apixaban", "andexanet").correct).toBe(true);
    expect(gradeDoacReversal("apixaban", "idarucizumab").correct).toBe(false);
    // prothrombin complex concentrate is for when no specific agent is available (andexanet alfa is, here)
    expect(gradeDoacReversal("apixaban", "pcc").correct).toBe(false);
    expect(gradeDoacReversal("apixaban", "pcc").expected).toMatch(/only when no specific agent is available/);
    // reversal is for bleeding that threatens life: not for a stable haematoma that has stopped
    expect(gradeDoacReversal("apixaban", "andexanet", false)).toMatchObject({ correct: false });
    expect(gradeDoacReversal("dabigatran", "idarucizumab", false).expected).toMatch(/reversal not indicated/);
    expect(gradePlatelets({ p2y12: "ticagrelor", aspirin: true })).toMatchObject({ correct: false });
    expect(gradePlatelets({ p2y12: "ticagrelor", aspirin: true }).expected).toMatch(/Not expected to reverse ticagrelor/);
    expect(gradePlatelets({ p2y12: "clopidogrel", aspirin: true }).correct).toBe(true);
    for (const p of ["ticagrelor", "prasugrel", "clopidogrel", "cangrelor", null] as const) expect(gradeAntiplateletPlan(p, "stop-dapt").correct, String(p)).toBe(false);
    expect(gradeAntiplateletPlan("ticagrelor", "de-escalate").correct).toBe(true);
    expect(gradeAntiplateletPlan("cangrelor", "oral-after-cangrelor").correct).toBe(true);
  });
});

describe("closure: retroperitoneal risk and presentation", () => {
  const base: FemoralFactors = { method: "manual", actAtPullS: 170, minutes: 15, positionErrorMm: 0, stick: "high", backWalls: 0, fr: 6, anticoagulated: false, angiogramBeforeDevice: true };

  it("without the new factors femoralRisk is unchanged; each factor multiplies the retroperitoneal probability only", () => {
    const r0 = femoralRisk(base);
    expect(r0.retroperitoneal).toBeCloseTo(MP_FEMORAL.highStickRetroperitoneal * Math.max(1, femoralRiskMultiplier(base)), 9);
    const r1 = femoralRisk({ ...base, ivAntiplatelet: true, uncontrolledHypertension: true, unguided: true, attempts: 3 });
    const mult = MP_FEMORAL.rpIvAntiplatelet * MP_FEMORAL.rpUncontrolledHypertension * MP_FEMORAL.rpUnguided * MP_FEMORAL.rpPerExtraAttempt ** 2;
    expect(r1.retroperitoneal / r0.retroperitoneal).toBeCloseTo(mult, 6);
    expect(r1.largeHaematoma).toBeCloseTo(r0.largeHaematoma, 9);
    expect(r1.pseudoaneurysm).toBeCloseTo(r0.pseudoaneurysm, 9);
    expect(retroperitonealMultiplier({})).toBe(1);
  });

  it("a drawn retroperitoneal bleed presents with the lesson's signs and never names itself", () => {
    const risk = { ...femoralRisk(base), retroperitoneal: 0.9 };
    const ev = scheduleDelayed({ route: "femoral", closedAtS: 0, seed: "rp-text", femoral: risk }).find((d) => d.kind === "retroperitoneal-bleed")!;
    expect(ev).toBeDefined();
    expect(ev.report).toBe(RP_DELAYED_TEXT.report);
    expect(ev.finding).toBe(RP_DELAYED_TEXT.finding);
    expect(`${ev.report} ${ev.finding}`).not.toMatch(/retroperitoneal|haematoma behind|bleed/i);
    expect(ev.atS / 3600).toBeLessThanOrEqual(RP_SOURCED.presentationWithinH);
  });
});

/** femoralRisk's own multiplier for the base factors (the ACT term only here). */
function femoralRiskMultiplier(f: FemoralFactors): number {
  return Math.max(0.25, 1 + ((f.actAtPullS - 300) / 100) * MP_FEMORAL.actScalePer100);
}

// ---------------------------------------------------------------------------
// the bladder on the pelvic screen
// ---------------------------------------------------------------------------

describe("the bladder drawing (route.ts)", () => {
  it("no contrast, no bladder; a dent pushes it to the other side; the pelvis frame keeps it in the field", () => {
    const { s } = open("rp-on-table");
    const g = s.route.geom;
    const model = s.model;
    expect(bladderTubes(g, model, { opacity: 0, dentMm: 0, side: "right", site: s.site })).toEqual([]);
    const body = (dentMm: number) => bladderTubes(g, model, { opacity: 1, dentMm, side: "right", site: s.site }).find((t) => !!t.thin)!;
    const round = body(0);
    const dented = body(20);
    expect(round.pts).toHaveLength(MP_BLADDER.samples);
    expect(round.thin).toBeDefined();
    // the world x of the centre line moves when the bladder is pushed (towards the patient's left for a right bleed)
    const mid = Math.floor(MP_BLADDER.samples / 2);
    const shift = Math.abs(dented.pts[mid].x - round.pts[mid].x);
    expect(shift).toBeGreaterThan(8);
    // the pelvis frame centre lies within about 80 mm of the bladder centre (the field is 250 mm at the detector)
    const c = pelvisFrameCentre(g, s.site)!;
    const b = bladderCentre(g, s.site);
    expect(Math.hypot(c.x - b.x, c.y - b.y)).toBeLessThan(80);
    expect(bladderDentMm(0)).toBe(0);
    expect(bladderDentMm(1000)).toBeGreaterThan(10);
  });

  it("the bladder draws smoothly: a zero-attenuation guide keeps every sample, and the dented centre line bends more gently than the ribbon is wide (no folded quads)", () => {
    const { s } = open("rp-on-table");
    const g = s.route.geom;
    for (const dentMm of [0, 10, MP_BLADDER.maxDentMm]) {
      const tubes = bladderTubes(g, s.model, { opacity: 1, dentMm, side: "right", site: s.site });
      expect(tubes).toHaveLength(2);
      // the guide goes first on the same points array (the renderer's decimation is decided by the first tube on it)
      expect(tubes[0].pts).toBe(tubes[1].pts);
      expect(tubes[0].mu).toEqual([0, 0, 0]);
      expect(Math.max(...tubes[0].r)).toBeLessThan(0.5);
      const b = tubes[1];
      expect(b.pts.length).toBeGreaterThanOrEqual(40);
      // Menger curvature at each interior sample: its radius stays above the ribbon's half-width there
      for (let i = 1; i < b.pts.length - 1; i++) {
        const [p, q, r] = [b.pts[i - 1], b.pts[i], b.pts[i + 1]];
        const d = (a: typeof p, c: typeof p) => Math.hypot(a.x - c.x, a.y - c.y, a.z - c.z);
        const ux = q.x - p.x, uy = q.y - p.y, uz = q.z - p.z;
        const vx = r.x - p.x, vy = r.y - p.y, vz = r.z - p.z;
        const area2 = Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx);
        const radius = area2 < 1e-9 ? Infinity : (d(p, q) * d(q, r) * d(p, r)) / (2 * area2);
        expect(radius, `dent ${dentMm} sample ${i}`).toBeGreaterThan(b.r[i]);
      }
    }
  });

  it("the pelvis frame keeps the aortic bifurcation, the iliac course and the bladder centre inside the field during ordinary wire advance", () => {
    // the 250 mm field at the detector, at the isocentre, inside the margin AccessFluoroView uses for 'tip imaged'
    const half = 0.92 * (250 / 2) * (SOD / SID);
    for (const o of [{ scenario: "rp-on-table" }, { seed: "rp-frame", access: "femoral" as const, start: "closure" as const }]) {
      const { session: s } = newCaseSession(o);
      const g = s.route.geom;
      const c = pelvisFrameCentre(g, s.site)!;
      const il = g.segments.find((x) => x.id === "iliac")!;
      const pts = [pointAt(g.path, il.end).p, pointAt(g.path, (il.start + il.end) / 2).p, pointAt(g.path, il.start).p, bladderCentre(g, s.site)];
      for (const p of pts) {
        expect(Math.abs(p.x - c.x), JSON.stringify(o)).toBeLessThan(half);
        expect(Math.abs(p.y - c.y), JSON.stringify(o)).toBeLessThan(half);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// the scenarios
// ---------------------------------------------------------------------------

describe("retroperitoneal scenarios in the full case", () => {
  it("each scenario opens with no drawn delayed event, an empty ledger and no named complication; the bleed presents a minute after the learner takes over", () => {
    for (const id of scenarios.map((x) => x.id)) {
      const { s, m } = open(id);
      expect(s.sites.flatMap((x) => x.delayed)).toEqual([]);
      expect(s.decisions()).toEqual([]);
      expect(m.state.episode).toBeNull();
      untilOnset(s, m);
      expect(s.complications.map((c) => c.id)).not.toContain("retroperitoneal-bleed");
      // the live log never names the bleed
      expect(s.log.filter((l) => l.kind === "nurse" || l.kind === "result").map((l) => l.text).join(" ")).not.toMatch(/retroperitoneal/i);
    }
  });

  it("Hb measured 10 min after onset is within 1 g/dL of baseline and lower at 60 min (rp-recovery-stable)", () => {
    const { s, m } = open("rp-recovery-stable");
    untilOnset(s, m);
    const baseline = MP_HB.baselineGdl[s.profile.sex];
    const onset = m.state.episode!.onsetT;
    run(s, Math.max(0, onset + 600 - s.tS));
    m.actions.order("hb");
    run(s, Math.max(0, onset + 3600 - s.tS));
    m.actions.order("hb");
    run(s, MP_RP.hbTurnaroundS + 5);
    const r = m.actions.hbReported();
    expect(r).toHaveLength(2);
    expect(Math.abs(r[0].gl / 10 - baseline)).toBeLessThan(1);
    expect(r[1].gl).toBeLessThan(r[0].gl);
    expect(r[0].t - onset).toBeGreaterThanOrEqual(595);
    expect(r[1].t - onset).toBeGreaterThanOrEqual(3595);
  });

  it("in 'rp-recovery-unstable' CT before control is wrong and back to the lab correct", () => {
    const a = open("rp-recovery-unstable");
    untilOnset(a.s, a.m);
    run(a.s, 120);
    generalMeasures(a.m);
    expect(a.m.actions.ct().ok).toBe(true);
    expect(decision(a.s, "rp-route")).toMatchObject({ correct: false });
    expect(decision(a.s, "rp-route")!.expected).toMatch(/unstable/);

    const b = open("rp-recovery-unstable");
    untilOnset(b.s, b.m);
    run(b.s, 120);
    generalMeasures(b.m);
    expect(b.m.actions.backToLab().ok).toBe(true);
    expect(decision(b.s, "rp-route")).toMatchObject({ correct: true });
    // back in the laboratory: the team's access in the other groin, the angiogram, a balloon and coils seal the branch
    run(b.s, MP_RP.backToLabS + 5);
    expect(b.m.actions.where()).toBe("lab");
    expect(b.m.actions.contralateralAngiogram().ok).toBe(true);
    run(b.s, MP_RP.teamContralateralS + MP_RP.angioS + 5);
    expect(b.m.state.angio!.text).toMatch(/small branch/);
    expect(b.m.actions.treat("balloon").ok).toBe(true);
    expect(b.m.actions.checkRetrograde().ok).toBe(true);
    run(b.s, MP_RP.retrogradeCheckS + 5);
    expect(b.m.actions.treat("coils").ok).toBe(true);
    run(b.s, MP_RP.coilS + 5);
    expect(b.m.state.episode!.sealed?.by).toBe("coils");
    expect(decision(b.s, "rp-treatment")).toMatchObject({ correct: true });
    expect(decision(b.s, "rp-balloon")).toMatchObject({ correct: true });
  });

  it("'rp-recovery-unstable' acted on promptly: CT within 15 s of the signs is regraded wrong once the pressure falls, back to the lab right", () => {
    const a = open("rp-recovery-unstable");
    untilOnset(a.s, a.m);
    run(a.s, 10);
    expect(a.m.actions.ct().ok).toBe(true);
    run(a.s, 240);
    expect(decision(a.s, "rp-route")).toMatchObject({ correct: false });
    expect(decision(a.s, "rp-route")!.expected).toMatch(/unstable/);

    const b = open("rp-recovery-unstable");
    untilOnset(b.s, b.m);
    run(b.s, 10);
    expect(b.m.actions.backToLab().ok).toBe(true);
    run(b.s, 240);
    expect(decision(b.s, "rp-route")).toMatchObject({ correct: true });
  });

  it("rp-recovery-stable: CT stays right over the whole stability window", () => {
    const { s, m } = open("rp-recovery-stable");
    untilOnset(s, m);
    run(s, 10);
    expect(m.actions.ct().ok).toBe(true);
    run(s, MP_RP.stabilityWindowS + 10);
    expect(decision(s, "rp-route")).toMatchObject({ correct: true });
  });

  it("recognition: a diagnostic step taken first earns the suspicion verdict, and 'Say it' afterwards is recorded, not refused", () => {
    const { s, m } = open("rp-on-table");
    untilOnset(s, m);
    expect(m.actions.noteBladderScreen("ap")).toBe(true);
    expect(decision(s, "rp-suspected")).toMatchObject({ correct: true });
    expect(decision(s, "rp-suspected")!.given).toMatch(/Acted on it/);
    expect(m.state.saidT).toBeNull();
    const r = m.actions.suspect();
    expect(r.ok).toBe(true);
    expect(m.state.saidT).not.toBeNull();
    expect(m.state.actions.some((x) => x.id === "suspect")).toBe(true);
    expect(m.actions.suspect().ok).toBe(false);
  });

  it("rp-on-table: the general measures in the first minute, the dented bladder, the other groin, balloon, covered stent, then protamine; 80 mg fast is refused", () => {
    const { s, m } = open("rp-on-table");
    untilOnset(s, m);
    generalMeasures(m);
    // reversal before any finding is scored as too early (the diagnosis first)
    // the pelvis screened: the bladder is opacified and pushed across
    expect(m.actions.noteBladderScreen("ap")).toBe(true);
    expect(m.state.bladder.truth).toBe("dented");
    expect(m.actions.bladder().dentMm).toBeGreaterThan(0);
    expect(m.actions.readBladder("dented").ok).toBe(true);
    expect(decision(s, "rp-bladder-read")).toMatchObject({ correct: true });
    expect(decision(s, "rp-route")).toMatchObject({ correct: true });
    expect(decision(s, "rp-general-measures")).toMatchObject({ correct: true });
    // angiography needs a sheath in the other groin
    expect(m.actions.contralateralAngiogram().ok).toBe(false);
    crossover(s, "left");
    expect(m.actions.contralateralSheath()).toBe(true);
    expect(m.actions.contralateralAngiogram().ok).toBe(true);
    expect(decision(s, "rp-in-lab-workup")).toMatchObject({ correct: true });
    run(s, MP_RP.angioS + 5);
    expect(m.state.angio!.text).toMatch(/external iliac artery/);
    expect(m.actions.treat("balloon").ok).toBe(true);
    const lostAtBalloon = m.state.episode!.lostMl;
    run(s, 60);
    expect(m.state.episode!.lostMl).toBeCloseTo(lostAtBalloon, 0);
    expect(m.actions.treat("covered-stent").ok).toBe(true);
    run(s, MP_RP.stentS + 5);
    expect(m.state.episode!.sealed?.by).toBe("covered-stent");
    expect(decision(s, "rp-treatment")).toMatchObject({ correct: true });
    // protamine: 80 mg as a bolus is refused outright and scored wrong
    const r = m.actions.protamine(80, "fast");
    expect(r.ok).toBe(false);
    expect(s.protamine).toHaveLength(0);
    expect(decision(s, "rp-protamine")).toMatchObject({ correct: false });
    // after the diagnosis the reversal itself is on time
    expect(m.actions.protamine(40, "slow").ok).toBe(true);
    expect(s.protamine).toHaveLength(1);
    expect(decision(s, "rp-reversal-timing")).toMatchObject({ correct: true });
  });

  it("protamine before any finding is scored as too early; a fast dose within the cap goes to the session's protamine (whose reaction 5-10 min later is its model)", () => {
    const { s, m } = open("rp-on-table");
    untilOnset(s, m);
    expect(m.actions.protamine(40, "fast").ok).toBe(true);
    expect(s.protamine[0]).toMatchObject({ mg: 40, rate: "fast" });
    expect(decision(s, "rp-reversal-timing")).toMatchObject({ correct: false });
    expect(decision(s, "rp-protamine")).toMatchObject({ correct: false });
    expect(decision(s, "protamine-dose")).toMatchObject({ correct: false });
  });

  it("platelets in 'rp-ticagrelor' are scored as not expected to reverse; stopping DAPT outright is wrong, de-escalation right", () => {
    const a = open("rp-ticagrelor");
    untilOnset(a.s, a.m);
    expect(a.m.actions.onBoard().p2y12).toBe("ticagrelor");
    expect(a.m.actions.order("platelets").ok).toBe(true);
    const p = decision(a.s, "rp-platelets")!;
    expect(p.correct).toBe(false);
    expect(p.expected).toMatch(/Not expected to reverse ticagrelor/);
    a.m.actions.antiplateletPlan("stop-dapt");
    expect(decision(a.s, "rp-antiplatelet-plan")).toMatchObject({ correct: false });

    const b = open("rp-ticagrelor");
    untilOnset(b.s, b.m);
    b.m.actions.antiplateletPlan("de-escalate");
    expect(decision(b.s, "rp-antiplatelet-plan")).toMatchObject({ correct: true });
  });

  it("treating a bleeding point in 'rp-no-bleed-found' is wrong; conservative management is right", () => {
    const a = open("rp-no-bleed-found");
    untilOnset(a.s, a.m);
    a.m.actions.noteBladderScreen("ap");
    expect(a.m.state.bladder.truth).toBe("dented");
    crossover(a.s, "left");
    expect(a.m.actions.contralateralAngiogram().ok).toBe(true);
    run(a.s, MP_RP.angioS + 5);
    expect(a.m.state.angio!.text).toMatch(/no contrast leaves them/);
    a.m.actions.treat("balloon");
    expect(decision(a.s, "rp-treatment")).toMatchObject({ correct: false });

    const b = open("rp-no-bleed-found");
    untilOnset(b.s, b.m);
    b.m.actions.noteBladderScreen("ap");
    crossover(b.s, "left");
    b.m.actions.contralateralAngiogram();
    run(b.s, MP_RP.angioS + 5);
    expect(b.m.actions.treat("conservative").ok).toBe(true);
    expect(decision(b.s, "rp-treatment")).toMatchObject({ correct: true });
    expect(b.m.state.episode!.resolved?.by).toBe("conservative");
  });

  it("rp-recovery-stable: CT is the route and shows a haematoma without extravasation", () => {
    const { s, m } = open("rp-recovery-stable");
    untilOnset(s, m);
    generalMeasures(m);
    expect(m.actions.ct().ok).toBe(true);
    expect(decision(s, "rp-route")).toMatchObject({ correct: true });
    run(s, MP_RP.ctS + 5);
    expect(m.state.ct!.text).toMatch(/no contrast extravasation/);
    expect(m.actions.treat("conservative").ok).toBe(true);
    expect(decision(s, "rp-treatment")).toMatchObject({ correct: true });
  });

  it("rp-cangrelor: the infusion stopped is right; the oral P2Y12 plan once controlled is asked for", () => {
    const { s, m } = open("rp-cangrelor");
    untilOnset(s, m);
    expect(m.actions.onBoard().p2y12).toBe("cangrelor");
    expect(m.actions.order("stop-iv-antiplatelet").ok).toBe(true);
    expect(decision(s, "rp-stop-iv-antiplatelet")).toMatchObject({ correct: true });
    m.actions.antiplateletPlan("oral-after-cangrelor");
    expect(decision(s, "rp-antiplatelet-plan")).toMatchObject({ correct: true });
  });

  it("the DOAC scenarios: idarucizumab for an active bleed on dabigatran; no reversal for a stable, stopped haematoma on apixaban", () => {
    const a = open("rp-doac-dabigatran");
    expect(a.m.actions.onBoard().doac).toBe("dabigatran");
    untilOnset(a.s, a.m);
    a.m.actions.doacReversal("andexanet");
    expect(decision(a.s, "rp-doac-reversal")).toMatchObject({ correct: false });
    const c = open("rp-doac-dabigatran");
    untilOnset(c.s, c.m);
    expect(c.m.state.episode!.source).toBe("small-branch");
    c.m.actions.doacReversal("idarucizumab");
    expect(decision(c.s, "rp-doac-reversal")).toMatchObject({ correct: true });
    const b = open("rp-doac-apixaban");
    expect(b.m.actions.onBoard().doac).toBe("apixaban");
    untilOnset(b.s, b.m);
    expect(b.m.state.episode!.everUnstable).toBe(false);
    b.m.actions.doacReversal("andexanet");
    expect(decision(b.s, "rp-doac-reversal")).toMatchObject({ correct: false });
    expect(decision(b.s, "rp-doac-reversal")!.expected).toMatch(/reversal not indicated/);
  });

  it("reflex litres of crystalloid before any blood are scored wrong", () => {
    const { s, m } = open("rp-recovery-unstable");
    untilOnset(s, m);
    for (let i = 0; i < 5; i++) m.actions.order("crystalloid");
    run(s, 10);
    expect(decision(s, "rp-crystalloid")).toMatchObject({ correct: false });
  });

  it("a femoral case without a bleed is unchanged: no episode, no decision, the orders still work and a CT finds nothing", () => {
    const { session: s } = newCaseSession({ seed: "rp-none", access: "femoral", start: "recovery" });
    const m = bleedingOf(s)!;
    run(s, 300);
    expect(m.state.episode).toBeNull();
    expect(m.events!()).toEqual([]);
    expect(m.actions.ct().ok).toBe(true);
    run(s, MP_RP.ctS + 5);
    expect(m.state.ct!.text).toMatch(/No retroperitoneal haematoma/);
    // a haemoglobin without a bleed reports the value only (there is no first report to count from)
    m.actions.order("hb");
    run(s, MP_RP.hbTurnaroundS + 5);
    const hb = m.state.results.filter((r) => r.title === "Haemoglobin");
    expect(hb).toHaveLength(1);
    expect(hb[0].text).toMatch(/^\d+ g\/L\.$/);
    expect(s.decisions().filter((d) => d.id.startsWith("rp-"))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// launch metadata and the practice index
// ---------------------------------------------------------------------------

describe("bleeding scenarios: launch metadata and the practice index", () => {
  it("practiceIndex lists the scenarios rp-on-table, rp-recovery-unstable, rp-recovery-stable under lessons cm-access-complications-femoral-bleeding, cm-patient-complications-bleeding (from src/simulation/session/scenarios/bleeding.launch.ts)", () => {
    for (const l of ["cm-access-complications-femoral-bleeding", "cm-patient-complications-bleeding"])
      for (const id of ["rp-on-table", "rp-recovery-unstable", "rp-recovery-stable"]) expect(practiceForLesson(l).some((e) => e.sim === "procedure" && e.scenario === id), `${id} under ${l}`).toBe(true);
    expect(practiceForCase("cm-access-complications-case-retroperitoneal").some((e) => e.scenario === "rp-cangrelor")).toBe(true);
  });

  it("the launch file and the scenario file list the same eight scenarios, with the same titles and lessons", () => {
    const ids = ["rp-on-table", "rp-no-bleed-found", "rp-cangrelor", "rp-recovery-unstable", "rp-recovery-stable", "rp-ticagrelor", "rp-doac-dabigatran", "rp-doac-apixaban"];
    expect(scenarios.map((x) => x.id)).toEqual(ids);
    const fromLaunch = (launch.scenarios ?? []).map((x) => ({ id: x.id, title: x.title, lessonIds: x.lessonIds }));
    expect(fromLaunch).toEqual(scenarios.map((x) => ({ id: x.id, title: x.title, lessonIds: x.lessonIds })));
    for (const sc of launch.scenarios ?? []) for (const l of sc.lessonIds) expect(practiceForLesson(l).some((e) => e.scenario === sc.id), `${sc.id} under ${l}`).toBe(true);
    // the titles do not name the bleed
    for (const sc of scenarios) expect(sc.title).not.toMatch(/retroperitoneal|haematoma|bleed/i);
  });
});
