// pci-antithrombotic-orders: device- and regimen-specific ACT targets with the recheck clock, protamine
// dose, rate and reaction, the IV agents with renal adjustment, the suspected-HIT case and the
// practice links of the antithrombotic pack.
//   npx vitest run src/simulation/pci/antithrombotic.test.ts
import { describe, expect, it } from "vitest";
import { ACT_RECHECK_S, ACT_TARGET_S, actGate, actTarget, lowActNow, actClock } from "./lesionAssessment";
import {
  MP_PROTAMINE_REACTION,
  PROTAMINE_RULES,
  bivalirudinRegimen,
  cangrelorRegimen,
  eptifibatideRegimen,
  heparinBolusU,
  protamineDose,
  protamineRate,
  protamineReactionP,
  tirofibanRegimen,
} from "./doses";
import {
  actClockOf,
  actGateFor,
  actTargetHistory,
  antithromboticContextForRun,
  antithromboticDebrief,
  antithromboticErrors,
  antithromboticOf,
  declareAntithrombotic,
  giveDrug,
  giveProtamine,
  hitWorkupOf,
  lowActFor,
  orderHitAntibody,
  orderIvAgent,
  protamineReactionLevel,
  protamineReactionsOf,
  recordAct,
  recordFourTs,
  recordTeamAct,
  regimenOf,
  setFlushSolution,
  stopAgentInfusion,
} from "./actions/drugs";
import { initialPci, tele, type PciState } from "./state";
import { rngFrom } from "./rng";
import { setup } from "./testSetup";
import { PatientEngine } from "../patient/engine";
import { ANTITHROMBOTIC_VARIANTS, antithromboticVariant } from "./scenarios/packs/antithrombotic";
import { PCI_REGISTRY_PROBLEMS } from "./scenarios/registry";
import { practiceForLesson } from "../../ui/content/practiceIndex";
import { resolvePciLaunch } from "../../ui/pci/launch";

const HEPARIN_ALONE = { anticoagulant: "heparin", ivAntiplatelet: false } as const;
const WITH_GPI = { anticoagulant: "heparin", ivAntiplatelet: true } as const;

const su = () => setup("lad-focal");
const fresh = (heparinised = true): PciState => initialPci(su().s, { heparinised });
const at = (st: PciState, t: number): PciState => ({ ...st, t });

describe("ACT targets and the gate (pci-antithrombotic-orders)", () => {
  it("Hemochron with heparin alone fails the gate at 270 s and passes at 310 s; with eptifibatide running 230 s passes", () => {
    expect(actGate(270, HEPARIN_ALONE, "hemochron").ok).toBe(false);
    expect(actGate(270, HEPARIN_ALONE, "hemochron").reason).toMatch(/below the 300 s target/);
    expect(actGate(310, HEPARIN_ALONE, "hemochron").ok).toBe(true);
    expect(actGate(230, WITH_GPI, "hemochron").ok).toBe(true);
    // the same values on the lower-reading machine: 270 passes with heparin alone
    expect(actGate(270, HEPARIN_ALONE, "hemotec").ok).toBe(true);
    expect(actGate(240, HEPARIN_ALONE, "hemotec").ok).toBe(false);

    // the same through the procedure record: the case declares a Hemochron, heparin, the ACTs
    const { s, g } = su();
    let st = declareAntithrombotic(fresh(), { actDevice: "hemochron", hit: false });
    st = giveDrug(s, g, at(st, 10), "heparin", 7000, "iv");
    expect(actGateFor(st).ok).toBe(false); // not yet measured since the bolus
    expect(actGateFor(recordAct(at(st, 310), 270)).ok).toBe(false);
    st = recordAct(at(st, 320), 310);
    expect(actGateFor(st).ok).toBe(true);
    // eptifibatide started: the goal falls to 200-250 s, and 230 s passes
    const o = orderIvAgent(s, g, at(st, 400), { drug: "eptifibatide", bolus: 180 * 80, rate: 2.0, patient: { weightKg: 80, crclMlMin: 90 } });
    expect(o.refused).toBeNull();
    expect(regimenOf(o.st).ivAntiplatelet).toBe(true);
    const gpi = recordAct(at(o.st, 500), 230);
    expect(actGateFor(gpi).ok).toBe(true);
    expect(actGateFor(gpi).target).toMatchObject({ minS: 200, maxS: 250, specified: true });
    // stopped again: back to the heparin-alone goal
    expect(actGateFor(recordAct(at(stopAgentInfusion(gpi, "eptifibatide"), 520), 230)).ok).toBe(false);
  });

  it("the legacy two-argument gate keeps its single 250 s threshold", () => {
    expect(ACT_TARGET_S).toBe(250);
    expect(actGate(null, false).ok).toBe(false);
    expect(actGate(210, true).ok).toBe(false);
    expect(actGate(280, true).ok).toBe(true);
  });

  it("targets: HemoTec with an IV antiplatelet agent is flagged as not specified; CTO goals on a Hemochron; bivalirudin uses the heparin goals", () => {
    expect(actTarget(HEPARIN_ALONE, "hemochron")).toMatchObject({ minS: 300, maxS: 350, specified: true });
    expect(actTarget(HEPARIN_ALONE, "hemotec")).toMatchObject({ minS: 250, maxS: 300, specified: true });
    expect(actTarget(WITH_GPI, "hemotec")).toMatchObject({ minS: 200, maxS: 250, specified: false });
    expect(actTarget({ ...HEPARIN_ALONE, cto: "antegrade" }, "hemochron")).toMatchObject({ minS: 300, maxS: null });
    expect(actTarget({ ...HEPARIN_ALONE, cto: "retrograde" }, "hemochron")).toMatchObject({ minS: 350, maxS: null });
    expect(actTarget({ anticoagulant: "bivalirudin", ivAntiplatelet: false }, "hemochron")).toMatchObject({ minS: 300, maxS: 350 });
    for (const t of [actTarget(HEPARIN_ALONE, "hemochron"), actTarget(WITH_GPI, "hemotec")]) expect(t.source).toMatch(/03-antithrombotics\.ts:\d+/);
  });

  it("the recheck clock: due at 20 minutes, overdue (and the gate stale) after 30 minutes without an ACT", () => {
    expect(ACT_RECHECK_S).toEqual([1200, 1800]);
    const c = actClock({ t: 1000 + 21 * 60, lastDoseT: 0, lastActT: 1000 });
    expect([c.due, c.overdue]).toEqual([true, false]);
    expect(actClock({ t: 1000 + 31 * 60, lastDoseT: 0, lastActT: 1000 }).overdue).toBe(true);
    const { s, g } = su();
    let st = declareAntithrombotic(fresh(), { actDevice: "hemochron", hit: false });
    st = recordAct(giveDrug(s, g, at(st, 5), "heparin", 8000), 330);
    expect(actGateFor(st).ok).toBe(true);
    const late = at(st, st.t + 31 * 60);
    const gate = actGateFor(late);
    expect(gate.ok).toBe(false);
    expect(gate.stale).toBe(true);
    expect(gate.reason).toMatch(/31 minutes ago/);
    // low-act: below the active target, or the interval passed without an ACT
    expect(lowActFor(st)).toBe(false);
    expect(lowActFor(late)).toBe(true);
    expect(lowActFor(recordAct(at(st, st.t + 60), 280))).toBe(true); // Hemochron: 280 s is low
    expect(lowActFor({ ...st, actTrue: 260 })).toBe(true); // the true ACT has fallen below the target
    expect(lowActNow({ lastAct: 280, regimen: HEPARIN_ALONE, device: "hemotec", clock: { overdue: false } })).toBe(false);
    expect(lowActNow({ lastAct: 280, regimen: { anticoagulant: "none", ivAntiplatelet: false }, device: "hemochron", clock: { overdue: true } })).toBe(false);
  });
});

describe("protamine (pci-antithrombotic-orders)", () => {
  it("protamine for 7,000 U at 30 min is within the Brilakis and Oxford ranges and capped at 50 mg; a rate above 5 mg/min raises the reaction probability", () => {
    const d = protamineDose(7000, 30);
    expect(d.brilakisMg).toEqual([70, 105]);
    expect(d.oxfordReduced).toBe(true);
    expect(d.oxfordMg[1]).toBeLessThan(7000 / 80); // less than Oxford's within-15-minute figure
    expect(d.suggestedMg).toBeGreaterThanOrEqual(d.brilakisMg[0]);
    expect(d.suggestedMg).toBeLessThanOrEqual(d.brilakisMg[1]);
    expect(d.suggestedMg).toBeGreaterThanOrEqual(d.oxfordMg[0]);
    expect(d.suggestedMg).toBeLessThanOrEqual(d.oxfordMg[1]);
    expect(d.doseMg).toBe(50);
    expect(d.capped).toBe(true);
    expect(PROTAMINE_RULES.maxMg).toBe(50);
    // rate: 50 mg over 10 minutes keeps to 5 mg/min; over 5 minutes it does not
    expect(protamineRate(50, 10)).toMatchObject({ mgPerMin: 5, ok: true, oxfordOk: true });
    expect(protamineRate(50, 5).ok).toBe(false);
    expect(protamineReactionP({ doseMg: 50, mgPerMin: 6 })).toBeGreaterThan(protamineReactionP({ doseMg: 50, mgPerMin: 5 }));
    expect(protamineReactionP({ doseMg: 50, mgPerMin: 5, risks: 1 })).toBeGreaterThan(protamineReactionP({ doseMg: 50, mgPerMin: 5 }));
  });

  it("a fast dose reacts more often across seeds; the reaction begins 5-10 minutes later and wears off; cap and rate errors are kept for the debrief", () => {
    const { s, g } = su();
    const count = (overMin: number) => {
      let n = 0;
      for (let i = 0; i < 300; i++) {
        const st = { ...fresh(), rng: rngFrom(`prot-${i}`), t: 1000 };
        if (protamineReactionsOf(giveProtamine(s, g, st, { doseMg: 50, overMin })).length) n++;
      }
      return n;
    };
    const slow = count(10);
    const fast = count(2);
    expect(fast).toBeGreaterThan(slow);
    // one seeded reaction: nothing before onset, a fall in vascular tone after it, gone later
    let st: PciState | null = null;
    for (let i = 0; i < 300 && !st; i++) {
      const x = giveProtamine(s, g, { ...fresh(), rng: rngFrom(`prot-${i}`), t: 1000 }, { doseMg: 80, overMin: 1 });
      if (protamineReactionsOf(x).length) st = x;
    }
    expect(st).not.toBeNull();
    const rx = protamineReactionsOf(st!)[0];
    expect(rx.onsetT - 1000).toBeGreaterThanOrEqual(5 * 60);
    expect(rx.onsetT - 1000).toBeLessThanOrEqual(10 * 60);
    expect(protamineReactionLevel(st!, rx.onsetT - 1)).toBe(0);
    expect(protamineReactionLevel(st!, rx.onsetT + MP_PROTAMINE_REACTION.riseS)).toBeCloseTo(MP_PROTAMINE_REACTION.levelFast, 5);
    expect(protamineReactionLevel(st!, rx.onsetT + 4 * 3600)).toBe(0);
    const kinds = antithromboticErrors(st!).map((e) => e.kind);
    expect(kinds).toEqual(expect.arrayContaining(["protamine-over-cap", "protamine-fast"]));
    // the errors are not written to the live event log
    expect(st!.events.some((e) => /50 mg|mg\/min/.test(e.text))).toBe(false);
  });

  it("a protamine reaction lowers the patient's pressure (engine setVasodilation, as the console drives it)", () => {
    const run = (level: number) => {
      const e = new PatientEngine({ seed: "protamine-reaction" });
      e.advance(30);
      e.setVasodilation(level);
      e.advance(120);
      return e.vitals().aortaTrue.mean;
    };
    expect(run(MP_PROTAMINE_REACTION.levelFast)).toBeLessThan(run(0) - 10);
  });
});

describe("IV agents with renal adjustment (pci-antithrombotic-orders)", () => {
  it("eptifibatide is halved at CrCl 45; tirofiban is halved at CrCl 55", () => {
    const e45 = eptifibatideRegimen({ weightKg: 80, crclMlMin: 45 });
    expect(e45.rate).toBe(1.0);
    expect(e45.renalReduced).toBe(true);
    expect(e45.brilakisRate).toBeUndefined(); // both rules halve at 45
    expect(e45.bolusTotal).toBe(180 * 80);
    expect(e45.boluses).toBe(2);
    const t55 = tirofibanRegimen({ weightKg: 80, crclMlMin: 55 });
    expect(t55.rate).toBe(0.075);
    expect(t55.renalReduced).toBe(true);
    // at 55 mL/min the two eptifibatide rules differ, and both are shown
    const e55 = eptifibatideRegimen({ weightKg: 80, crclMlMin: 55 });
    expect([e55.rate, e55.brilakisRate]).toEqual([2.0, 1.0]);
    expect(eptifibatideRegimen({ weightKg: 80, crclMlMin: 90 }).rate).toBe(2.0);
    expect(tirofibanRegimen({ weightKg: 80, crclMlMin: 90 }).rate).toBe(0.15);
    // dialysis: eptifibatide is blocked; cangrelor has no renal adjustment
    expect(eptifibatideRegimen({ weightKg: 80, crclMlMin: 10, dialysis: true }).blocked?.reason).toMatch(/dialysis/);
    expect(cangrelorRegimen({ weightKg: 80, crclMlMin: 20 }).rate).toBe(4);
    // bivalirudin: 1.75, 1 below 30 mL/min, 0.25 on dialysis
    expect(bivalirudinRegimen({ weightKg: 80, crclMlMin: 60 }).rate).toBe(1.75);
    expect(bivalirudinRegimen({ weightKg: 80, crclMlMin: 26 }).rate).toBe(1.0);
    expect(bivalirudinRegimen({ weightKg: 80, crclMlMin: 10, dialysis: true }).rate).toBe(0.25);
    expect(heparinBolusU(80, false).rangeU).toEqual([5600, 8000]);
    expect(heparinBolusU(80, true).rangeU).toEqual([4000, 5600]);
  });

  it("orders: a blocked agent is refused; a rate not set for the kidneys, an IV antiplatelet agent in a CTO and an oral load during cangrelor are kept as errors", () => {
    const { s, g } = su();
    const st = fresh();
    const blocked = orderIvAgent(s, g, st, { drug: "eptifibatide", bolus: 14400, rate: 2, patient: { weightKg: 80, crclMlMin: 10, dialysis: true } });
    expect(blocked.refused).toMatch(/dialysis/);
    expect(antithromboticOf(blocked.st).ivAntiplatelet).toBe(false);
    const wrongRate = orderIvAgent(s, g, st, { drug: "tirofiban", bolus: 2000, rate: 0.15, patient: { weightKg: 80, crclMlMin: 55 } });
    expect(antithromboticErrors(wrongRate.st).map((e) => e.kind)).toContain("tirofiban-rate");
    const cto = setup("rca-cto");
    const inCto = orderIvAgent(cto.s, cto.g, initialPci(cto.s), { drug: "cangrelor", bolus: 2400, rate: 4, patient: { weightKg: 80, crclMlMin: 90 } });
    expect(antithromboticErrors(inCto.st).map((e) => e.kind)).toContain("iv-antiplatelet-cto");
    const cang = orderIvAgent(s, g, st, { drug: "cangrelor", bolus: 2400, rate: 4, patient: { weightKg: 80, crclMlMin: 90 } }).st;
    expect(antithromboticErrors(giveDrug(s, g, cang, "clopidogrel", 600, "oral")).map((e) => e.kind)).toContain("oral-during-cangrelor");
    expect(antithromboticErrors(giveDrug(s, g, cang, "ticagrelor", 180, "oral")).map((e) => e.kind)).not.toContain("oral-during-cangrelor");
    expect(antithromboticErrors(giveDrug(s, g, stopAgentInfusion(cang, "cangrelor"), "clopidogrel", 600, "crushed"))).toEqual([]);
  });
});

describe("suspected HIT (pci-antithrombotic-orders)", () => {
  it("in the HIT variant a heparin order is a critical error; bivalirudin raises actTrue above 250 s", () => {
    const v = antithromboticVariant("hit-bivalirudin")!;
    expect(v).toMatchObject({ hit: true, actDevice: "hemochron", scenario: "lad-focal" });
    expect(v.chart!.platelets.map((p) => p.count)).toEqual([230, 98]);
    const { s, g } = su();
    let st = declareAntithrombotic(fresh(false), { actDevice: v.actDevice, hit: v.hit });
    expect(regimenOf(st).anticoagulant).toBe("none");
    const withHeparin = giveDrug(s, g, at(st, 30), "heparin", 5000);
    expect(antithromboticErrors(withHeparin).filter((e) => e.critical).map((e) => e.kind)).toContain("heparin-in-hit");
    // the heparinised flush in use is a critical error too; switching to heparin-free before use is not
    const used = tele(at(st, 40), "inject", {});
    expect(antithromboticErrors(used).map((e) => e.kind)).toContain("heparinised-flush-in-hit");
    st = setFlushSolution(st, "heparin-free");
    expect(antithromboticErrors(tele(at(st, 40), "inject", {}))).toEqual([]);
    // the work-up
    st = orderHitAntibody(recordFourTs(st, "not-low"));
    expect(hitWorkupOf(st)).toEqual({ fourTs: "not-low", antibodyOrdered: true });
    // bivalirudin for the kidneys on the patient engine: the true ACT rises above 250 s
    const e = new PatientEngine({ seed: "hit-bivalirudin" });
    e.advance(10);
    const before = e.vitals().actTrue;
    const w = e.profile.weightKg;
    const reg = bivalirudinRegimen({ weightKg: w, crclMlMin: e.profile.renal.crclMlMin });
    expect(e.giveDrug("bivalirudin", reg.bolusTotal, "iv").ok).toBe(true);
    e.startInfusion({ drug: "bivalirudin", rate: reg.rate });
    e.advance(5 * 60);
    expect(before).toBeLessThan(250);
    expect(e.vitals().actTrue).toBeGreaterThan(250);
    // the record: bivalirudin is the anticoagulant, ACT read against the heparin goals, no critical error
    const o = orderIvAgent(s, g, at(st, 60), { drug: "bivalirudin", bolus: reg.bolusTotal, rate: reg.rate, patient: { weightKg: w, crclMlMin: e.profile.renal.crclMlMin } });
    expect(regimenOf(o.st).anticoagulant).toBe("bivalirudin");
    const measured = recordAct(at(o.st, 400), e.measureAct());
    expect(actGateFor(measured).target?.minS).toBe(300);
    expect(antithromboticErrors(measured).filter((x) => x.critical)).toEqual([]);
    // protamine for bivalirudin bleeding is an error (no antidote)
    expect(antithromboticErrors(giveProtamine(s, g, measured, { doseMg: 25, overMin: 10 })).map((x) => x.kind)).toContain("protamine-for-bivalirudin");
  });
});

describe("antithrombotic pack practice links (pci-antithrombotic-orders)", () => {
  const SOURCE = /\/simulation\/pci\/scenarios\/packs\/antithrombotic\.launch\.ts$/;

  it("practiceIndex lists the scenarios lad-focal under lessons pm-antithrombotics-heparin, pm-antithrombotics-iv, pm-antithrombotics-alternatives (from antithrombotic.launch.ts)", () => {
    expect(PCI_REGISTRY_PROBLEMS).toEqual([]);
    for (const lesson of ["pm-antithrombotics-heparin", "pm-antithrombotics-iv", "pm-antithrombotics-alternatives"]) {
      const mine = practiceForLesson(lesson).filter((e) => e.sim === "angio-pci" && e.scenario === "lad-focal" && SOURCE.test(e.source ?? ""));
      expect(mine.length, lesson).toBeGreaterThan(0);
    }
    expect(practiceForLesson("pm-antithrombotics-heparin").some((e) => e.scenario === "lad-focal" && e.variant === "hemochron")).toBe(true);
    expect(practiceForLesson("pm-antithrombotics-alternatives").some((e) => e.scenario === "lad-focal" && e.variant === "hit-bivalirudin")).toBe(true);
  });

  it("both variants resolve to lad-focal with the variant as the run's seed", () => {
    for (const id of Object.keys(ANTITHROMBOTIC_VARIANTS)) {
      const r = resolvePciLaunch({ scenario: "lad-focal", variant: id });
      expect(r.problems, id).toEqual([]);
      expect(r.launch?.resolved.def.id).toBe("lad-focal");
      expect(antithromboticVariant(r.launch?.resolved.seed)?.id).toBe(id);
    }
    expect(antithromboticVariant("pci-lad-focal~L3")).toBeNull();
    expect(antithromboticVariant("constructor")).toBeNull();
  });
});

describe("record follow-ups from the review (pci-antithrombotic-orders)", () => {
  it("a case that declares no context keeps the earlier gate: no stale refusal after 30 minutes; a declared one refuses", () => {
    const { s, g } = su();
    const undeclared = recordAct(giveDrug(s, g, at(fresh(), 5), "heparin", 8000), 280);
    expect(actGateFor(undeclared).ok).toBe(true);
    expect(actGateFor(at(undeclared, undeclared.t + 31 * 60)).ok).toBe(true);
    const declared = recordAct(giveDrug(s, g, at(declareAntithrombotic(fresh(), { actDevice: "hemotec", hit: false }), 5), "heparin", 8000), 280);
    expect(actGateFor(at(declared, declared.t + 31 * 60)).stale).toBe(true);
    // the run's context: from the variant, and a CTO target declared antegrade
    expect(antithromboticContextForRun("hemochron", s)).toEqual({ actDevice: "hemochron", hit: false, cto: null });
    expect(antithromboticContextForRun(null, s)).toBeNull();
    expect(antithromboticContextForRun(null, setup("rca-cto").s)).toMatchObject({ actDevice: "hemotec", cto: "antegrade" });
  });

  it("a pre-heparinised case switched to bivalirudin keeps the start's heparin: protamine is not flagged as for bivalirudin", () => {
    const { s, g } = su();
    const o = orderIvAgent(s, g, at(fresh(true), 60), { drug: "bivalirudin", bolus: 60, rate: 1.75, patient: { weightKg: 80, crclMlMin: 90 } });
    const rec = antithromboticOf(o.st);
    expect(rec.preHeparinised).toBe(true);
    expect(rec.anticoagulant).toBe("bivalirudin");
    expect(antithromboticErrors(giveProtamine(s, g, at(o.st, 900), { doseMg: 25, overMin: 10 })).map((e) => e.kind)).not.toContain("protamine-for-bivalirudin");
    // without the start's heparin the error stands
    const bare = orderIvAgent(s, g, at(fresh(false), 60), { drug: "bivalirudin", bolus: 60, rate: 1.75, patient: { weightKg: 80, crclMlMin: 90 } });
    expect(antithromboticOf(bare.st).preHeparinised).toBe(false);
    expect(antithromboticErrors(giveProtamine(s, g, at(bare.st, 900), { doseMg: 25, overMin: 10 })).map((e) => e.kind)).toContain("protamine-for-bivalirudin");
    // a lab heparin dose after a heparinised start keeps preHeparinised
    expect(antithromboticOf(giveDrug(s, g, at(fresh(true), 30), "heparin", 2000)).preHeparinised).toBe(true);
  });

  it("the legacy GP IIb/IIIa inhibitor is listed as running and can be stopped; the goal returns to heparin alone", () => {
    const { s, g } = su();
    const st = giveDrug(s, g, at(fresh(), 30), "gp2b3a");
    const rec = antithromboticOf(st);
    expect(rec.infusions.gp2b3a).toBeTruthy();
    expect(rec.ivAntiplatelet).toBe(true);
    const off = stopAgentInfusion(at(st, 60), "gp2b3a");
    expect(antithromboticOf(off).infusions.gp2b3a).toBeUndefined();
    expect(regimenOf(off).ivAntiplatelet).toBe(false);
  });

  it("eptifibatide: a missing second bolus after the regimen's gap is kept as an error; a second bolus clears it", () => {
    const { s, g } = su();
    const patient = { weightKg: 80, crclMlMin: 90 };
    const one = orderIvAgent(s, g, at(fresh(), 100), { drug: "eptifibatide", bolus: 14400, rate: 2.0, patient }).st;
    expect(antithromboticErrors(at(one, 100 + 9 * 60)).map((e) => e.kind)).not.toContain("eptifibatide-second-bolus");
    expect(antithromboticErrors(at(one, 100 + 11 * 60)).map((e) => e.kind)).toContain("eptifibatide-second-bolus");
    const two = orderIvAgent(s, g, at(one, 100 + 10 * 60), { drug: "eptifibatide", bolus: 14400, patient }).st;
    expect(antithromboticErrors(at(two, 100 + 20 * 60)).map((e) => e.kind)).not.toContain("eptifibatide-second-bolus");
  });

  it("an ACT above 250 s while an IV antiplatelet agent runs is an error and fails the debrief line; the debrief names the machine generically", () => {
    const { s, g } = su();
    let st = declareAntithrombotic(fresh(), { actDevice: "hemochron", hit: false });
    st = orderIvAgent(s, g, at(st, 100), { drug: "eptifibatide", bolus: 14400, rate: 2.0, patient: { weightKg: 80, crclMlMin: 90 } }).st;
    const high = recordAct(at(st, 400), 290);
    expect(antithromboticErrors(high).map((e) => e.kind)).toContain("act-above-range-with-iv-agent");
    const lines = antithromboticDebrief(high);
    expect(lines.find((l) => /^Last ACT/.test(l.text))?.ok).toBe(false);
    expect(lines[0].text).toMatch(/higher-reading machine \(Hemochron in the lesson\)/);
    // within the range: no error
    expect(antithromboticErrors(recordAct(at(st, 400), 230)).map((e) => e.kind)).not.toContain("act-above-range-with-iv-agent");
    // heparin alone: an ACT above 350 s is not this error
    const alone = recordAct(giveDrug(s, g, at(declareAntithrombotic(fresh(), { actDevice: "hemochron", hit: false }), 5), "heparin", 8000), 380);
    expect(antithromboticErrors(alone)).toEqual([]);
  });
});

describe("in-app verification fixes (pci-antithrombotic-orders)", () => {
  it("a team ACT's recheck clock runs from when the sample was drawn, not from when the result came", () => {
    const st0 = declareAntithrombotic(fresh(), { actDevice: "hemochron", hit: false });
    // sample drawn at 55 s, result 422 s later (the scrub reports when the sample clots)
    const st = recordTeamAct(at(st0, 477), 422);
    expect(st.act).toEqual({ value: 422, t: 55 });
    expect(actClockOf(at(st, 55 + 30 * 60 + 1)).overdue).toBe(true);
    expect(actClockOf(at(st, 55 + 20 * 60 + 1)).due).toBe(true);
    // a console ACT is read at once: the clock runs from the record
    const direct = recordAct(at(st0, 477), 310);
    expect(direct.act).toEqual({ value: 310, t: 477 });
    expect(actClockOf(at(direct, 477 + 21 * 60)).due).toBe(true);
    expect(actClockOf(at(direct, 477 + 19 * 60)).due).toBe(false);
    // a sample time after the record is clamped to the record
    expect(recordAct(at(st0, 100), 300, { sampleT: 500 }).act?.t).toBe(100);
  });

  it("the debrief gives the ACT targets that applied over the case, each from when its regimen began", () => {
    const { s, g } = su();
    let st = declareAntithrombotic(fresh(), { actDevice: "hemochron", hit: false });
    st = giveDrug(s, g, at(st, 60), "heparin", 3000);
    st = orderIvAgent(s, g, at(st, 12 * 60 + 5), { drug: "eptifibatide", bolus: 14400, rate: 2.0, patient: { weightKg: 80, crclMlMin: 90 } }).st;
    st = stopAgentInfusion(at(st, 40 * 60), "eptifibatide");
    const spans = actTargetHistory(st);
    expect(spans.map((x) => [x.fromT, x.target.minS, x.target.maxS])).toEqual([
      [0, 300, 350],
      [12 * 60 + 5, 200, 250],
      [40 * 60, 300, 350],
    ]);
    const first = antithromboticDebrief(at(st, 41 * 60))[0].text;
    expect(first).toMatch(/^ACT targets in this case on the higher-reading machine \(Hemochron in the lesson\): 300-350 s on heparin; 200-250 s on heparin with an IV antiplatelet agent from minute 12; 300-350 s on heparin from minute 40\.$/);
  });

  it("a case with no declaration and no change keeps one target line", () => {
    const spans = actTargetHistory(fresh());
    expect(spans).toHaveLength(1);
    expect(spans[0].target.minS).toBe(250);
    expect(antithromboticDebrief(fresh())[0].text).toMatch(/^ACT targets in this case on the lower-reading machine \(HemoTec in the lesson\): 250-300 s on heparin\.$/);
  });
});
