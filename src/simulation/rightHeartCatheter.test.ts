// The torque-directed right heart catheter (haemo-rhc-manoeuvre): the femoral passage needs an RA
// loop to enter the RV, the PA is reached by backing off the apex and turning cranially, forceful work
// in the outflow tract provokes VT more than gentle work, the wedge comes on a gentle advance on a
// breath in, a knot forms after prolonged manipulation and pulling it tight before help is called is a
// critical error, AF from atrial manipulation runs in its three variants, and the catheter keeps the
// haemodynamic study's chamber and events in line with it.
//   npx vitest run src/simulation/rightHeartCatheter.test.ts
import { describe, expect, it } from "vitest";
import {
  RHC_ENGAGE_FAIL_S,
  RHC_AF_SELF_S,
  RHC_AF_DRUG_S,
  RHC_KINK_WINDUP_DEG,
  RHC_STEP,
  RHC_TURN_BURST_S,
  initialRhc,
  knotRisk,
  rhcChamberIndex,
  rhcDecisions,
  rhcEvents,
  rhcStep,
  rhcSummary,
  rhcSyncActions,
  rhcZone,
  tipDirection,
  type RhcAction,
  type RhcEnv,
  type RhcState,
} from "./rightHeartCatheter";
import { haemoStudyReducer, initialStudy, shownChambers, type HaemoStudyState } from "./haemoStudy";
import type { TipDirection } from "./pacing";
import { haemoTipContext } from "../ui/lab/haemoTips";
import { tipsFor } from "../content/lab/tips";

const ENV: RhcEnv = { resp: false, hr: 70, structural: false };
const RV = ["rv-inflow", "rv-apex", "rv-septum", "rvot"];

/** A driver: applies actions one second apart. */
class Run {
  st: RhcState;
  t: number;
  constructor(st: RhcState, t = 0, public env: RhcEnv = ENV) {
    this.st = st;
    this.t = t;
  }
  do(...as: RhcAction[]): this {
    for (const a of as) {
      this.t += 1;
      this.st = rhcStep(this.st, a, this.t, this.env);
    }
    return this;
  }
  at(t: number): this {
    this.t = t;
    this.st = rhcStep(this.st, { type: "tick" }, t, this.env);
    return this;
  }
  get zone() {
    return rhcZone(this.st);
  }
  /** turn the hub in 30 degree steps until the tip points in `dir` */
  aim(dir: TipDirection): this {
    for (let i = 0; i < 40 && tipDirection(this.st) !== dir; i++) this.do({ type: "rotate", deg: 30 });
    expect(tipDirection(this.st)).toBe(dir);
    return this;
  }
  /** withdraw gently until the tip is back in the right atrium */
  backToRA(): this {
    for (let i = 0; i < 60 && this.zone !== "ra"; i++) this.do({ type: "withdraw", cm: RHC_STEP.gentle });
    expect(this.zone).toBe("ra");
    return this;
  }
}

/** Flushed, inserted from the femoral vein and advanced up the IVC to the RA, no side branch drawn. */
function inRA(seed: number): Run {
  const r = new Run({ ...initialRhc(null, seed), sideBranchHazard: 0 }).do({ type: "flush" }, { type: "insert" });
  for (let i = 0; i < 20 && r.zone !== "ra"; i++) r.do({ type: "advance", cm: RHC_STEP.firm });
  expect(r.zone).toBe("ra");
  return r;
}

/** The catheter at the RV apex from an RA loop. */
function atApex(seed: number): Run {
  const r = inRA(seed).aim("lateral");
  for (let i = 0; i < 6 && !r.st.lead.loop; i++) r.do({ type: "advance", cm: RHC_STEP.firm });
  r.aim("tv");
  for (let i = 0; i < 6 && r.zone !== "rv-apex"; i++) r.do({ type: "advance", cm: RHC_STEP.gentle * 2 });
  expect(r.zone).toBe("rv-apex");
  return r;
}

describe("the femoral passage and the RA loop", () => {
  it("from the femoral route without an RA loop the catheter does not enter the RV in 20 attempts; with a loop it does", () => {
    for (const seed of [1, 7, 42]) {
      const r = inRA(seed);
      const dirs: TipDirection[] = ["tv", "posterior", "superior"];
      for (let attempt = 0; attempt < 20; attempt++) {
        r.aim(dirs[attempt % dirs.length]);
        for (let k = 0; k < 4; k++) {
          r.do({ type: "advance", cm: RHC_STEP.firm });
          expect(RV.includes(r.zone!), `seed ${seed} attempt ${attempt}: ${r.zone}`).toBe(false);
        }
        expect(r.st.lead.loop).toBe(false);
        r.backToRA();
      }
      // with a loop: push with the tip pointing laterally, turn it to the valve and advance
      r.aim("lateral").do({ type: "advance", cm: RHC_STEP.firm });
      expect(r.st.lead.loop).toBe(true);
      r.aim("tv");
      for (let k = 0; k < 3 && !RV.includes(r.zone!); k++) r.do({ type: "advance", cm: RHC_STEP.gentle });
      expect(RV, `seed ${seed}`).toContain(r.zone);
      // the study's recorder follows: the RV
      expect(rhcChamberIndex(r.st)).toBe(1);
    }
  });

  it("the tip catches a venous side branch on the first femoral passage of the preset; backing off and turning frees it; 45 s without progress raises engage-fail", () => {
    const r = new Run(initialRhc("rhc-femoral-mp", 3)).do({ type: "insert" });
    for (let i = 0; i < 8; i++) r.do({ type: "advance", cm: RHC_STEP.firm });
    expect(r.zone).toBe("renal");
    expect(r.st.messages.join(" ")).toMatch(/Resistance|turns off/);
    // nothing on the live messages names the branch
    expect(r.st.messages.join(" ")).not.toMatch(/renal|hepatic/i);
    expect(rhcEvents(r.st)).not.toContain("engage-fail");
    r.at(r.st.progressAt + RHC_ENGAGE_FAIL_S + 1);
    expect(rhcEvents(r.st)).toContain("engage-fail");
    // the same direction catches again; turned another way it runs up to the RA
    r.do({ type: "withdraw", cm: 5 });
    expect(r.zone).toBe("ivc");
    r.do({ type: "advance", cm: RHC_STEP.firm });
    expect(r.zone).toBe("renal");
    r.do({ type: "withdraw", cm: 5 }).aim("superior");
    for (let i = 0; i < 4 && r.zone !== "ra"; i++) r.do({ type: "advance", cm: RHC_STEP.firm });
    expect(r.zone).toBe("ra");
    expect(rhcEvents(r.st)).not.toContain("engage-fail");
  });

  it("a catheter inserted before it is flushed is noted for the debrief (not a critical error)", () => {
    const r = new Run(initialRhc(null, 1)).do({ type: "insert" });
    expect(r.st.errors.map((e) => [e.id, e.critical])).toEqual([["inserted-unflushed", false]]);
  });

  it("a catheter withdrawn out of the sheath, or a different catheter chosen, has to be flushed and connected again", () => {
    const r = new Run({ ...initialRhc(null, 1), sideBranchHazard: 0 }).do({ type: "flush" }, { type: "insert" });
    expect(r.st.errors).toEqual([]);
    for (let i = 0; i < 40 && r.st.inserted; i++) r.do({ type: "withdraw", cm: RHC_STEP.firm });
    expect(r.st.inserted).toBe(false);
    expect(r.st.flushed).toBe(false);
    r.do({ type: "insert" });
    expect(r.st.errors.map((e) => e.id)).toEqual(["inserted-unflushed"]);
    // flushed, then swapped for another catheter before insertion
    const s = new Run(initialRhc(null, 2)).do({ type: "flush" });
    expect(s.st.flushed).toBe(true);
    s.do({ type: "profile", profile: s.st.profile === "balloon" ? "multipurpose" : "balloon" });
    expect(s.st.flushed).toBe(false);
  });

  it("an unlisted treatment id changes nothing and is not echoed", () => {
    const r = inRA(3);
    const before = r.st;
    r.do({ type: "treat", treatment: "sync-shock" as unknown as "oxygen" });
    expect(r.st.messages.join(" ")).not.toMatch(/sync-shock/);
    expect(r.st.errors).toEqual(before.errors);
    expect(r.st.af).toEqual(before.af);
    expect(r.st.vt).toEqual(before.vt);
    // a listed one is named by its label
    r.do({ type: "treat", treatment: "oxygen" });
    expect(r.st.messages).toContain("High-flow oxygen given.");
  });
});

describe("from the apex to the PA and the wedge", () => {
  it("withdrawing from the apex with cranial rotation reaches the PA; pushing at the apex only buckles", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const r = atApex(seed);
      // turning cranially without backing off and pushing does not reach the PA
      r.aim("superior").do({ type: "advance", cm: RHC_STEP.firm });
      expect(r.zone).toBe("rv-apex");
      expect(r.st.messages.join(" ")).toMatch(/buckles/);
      // back off the apex, keep the tip cranial, advance on a deep breath
      r.do({ type: "withdraw", cm: 4 });
      expect(r.zone).toBe("rv-inflow");
      r.aim("superior");
      for (let i = 0; i < 6 && r.zone !== "pa"; i++) r.do({ type: "deep-breath" }, { type: "advance", cm: RHC_STEP.gentle * 2 });
      expect(r.zone, `seed ${seed}`).toBe("pa");
      expect(rhcChamberIndex(r.st)).toBe(2);
    }
  });

  it("wedges on a gentle advance during inspiration, not without it; a firm push in the PA is noted; a pigtail does not wedge", () => {
    const toPA = (seed: number) => {
      const r = atApex(seed).do({ type: "withdraw", cm: 4 }).aim("superior");
      for (let i = 0; i < 8 && r.zone !== "pa"; i++) r.do({ type: "deep-breath" }, { type: "advance", cm: RHC_STEP.gentle * 2 });
      expect(r.zone).toBe("pa");
      for (let i = 0; i < 12; i++) r.do({ type: "tick" }); // the breath is over
      return r;
    };
    const r = toPA(5);
    for (let i = 0; i < 12; i++) r.do({ type: "advance", cm: RHC_STEP.gentle });
    expect(r.zone).toBe("pa"); // no breath in (respiration off on the recorder), no wedge
    r.do({ type: "deep-breath" }, { type: "advance", cm: RHC_STEP.gentle });
    expect(r.zone).toBe("wedge");
    expect(rhcChamberIndex(r.st)).toBe(3);
    expect(r.st.errors).toEqual([]);
    // with spontaneous respiration the inspiratory part of the cycle wedges too
    const resp = toPA(6);
    resp.env = { ...ENV, resp: true };
    for (let i = 0; i < 12 && resp.zone !== "wedge"; i++) resp.do({ type: "advance", cm: RHC_STEP.gentle });
    expect(resp.zone).toBe("wedge");
    // a firm push in the PA
    const firm = toPA(7).do({ type: "advance", cm: RHC_STEP.firm });
    expect(firm.st.errors.map((e) => e.id)).toContain("forceful-pa-advance");
    // a pigtail stops in the PA
    const pig = new Run({ ...initialRhc(null, 2), profile: "pigtail", flushed: true, inserted: true, lead: { ...initialRhc().lead, zone: "pa", pos: 4 } });
    pig.do({ type: "deep-breath" }, { type: "advance", cm: RHC_STEP.gentle }, { type: "advance", cm: RHC_STEP.gentle });
    expect(pig.zone).toBe("pa");
  });
});

describe("ectopy and VT in the ventricle", () => {
  it("forceful RVOT advance raises VT more often than gentle advance", () => {
    const vtAfter = (cm: number) => {
      let n = 0;
      for (let seed = 1; seed <= 300; seed++) {
        const st0 = { ...initialRhc("rhc-rvot-irritable", seed), irritability: 1 };
        const st = rhcStep(st0, { type: "advance", cm }, 1, ENV);
        if (st.vt) n++;
      }
      return n;
    };
    const gentle = vtAfter(RHC_STEP.gentle);
    const firm = vtAfter(RHC_STEP.firm);
    expect(firm).toBeGreaterThan(gentle * 3);
    expect(firm).toBeGreaterThan(30);
  });

  it("the irritable preset provokes VT more than a plain ventricle; VT stops once the tip is eased back, lowers the pressure if it lasts, and a sustained run needs a synchronised shock", () => {
    const count = (irritability: number) => {
      let n = 0;
      for (let seed = 1; seed <= 300; seed++) if (rhcStep({ ...initialRhc("rhc-rvot-irritable", seed), irritability }, { type: "advance", cm: RHC_STEP.gentle }, 1, ENV).vt) n++;
      return n;
    };
    expect(count(2.5)).toBeGreaterThan(count(1));
    // find a seed whose firm push starts VT, then ease back
    let r: Run | null = null;
    for (let seed = 1; seed < 50 && !r; seed++) {
      const x = new Run(initialRhc("rhc-rvot-irritable", seed)).do({ type: "advance", cm: RHC_STEP.firm });
      if (x.st.vt && x.zone === "rvot") r = x;
    }
    expect(r).not.toBeNull();
    expect(rhcEvents(r!.st)).toContain("vt");
    expect(r!.st.messages.join(" ")).toMatch(/broad-complex/);
    const eased = new Run(r!.st, r!.t).do({ type: "withdraw", cm: 3 });
    eased.at(eased.t + 6);
    expect(eased.st.vt).toBeNull();
    // kept pressed into the outflow tract, it lasts: hypotension, then sustained, and a synchronised shock ends it
    const kept = new Run(r!.st, r!.t);
    kept.at(kept.t + 12);
    expect(rhcEvents(kept.st)).toEqual(expect.arrayContaining(["vt", "hypotension"]));
    kept.at(kept.t + 25);
    expect(kept.st.vt?.sustained).toBe(true);
    kept.do({ type: "withdraw", cm: 3 }).at(kept.t + 10);
    expect(kept.st.vt).not.toBeNull();
    kept.do({ type: "treat", treatment: "sync-cardioversion" });
    expect(kept.st.vt).toBeNull();
    expect(kept.st.errors.filter((e) => e.critical)).toEqual([]);
  });

  it("entering the RV shows ectopy on the monitor and turns the trace's extrasystoles on through the study", () => {
    let seen = false;
    for (let seed = 1; seed <= 10 && !seen; seed++) {
      const r = inRA(seed).aim("lateral");
      for (let i = 0; i < 6 && !r.st.lead.loop; i++) r.do({ type: "advance", cm: RHC_STEP.firm });
      r.aim("tv").do({ type: "advance", cm: RHC_STEP.gentle });
      expect(RV).toContain(r.zone);
      if (r.st.ectopyUntil > r.t) {
        seen = true;
        const sync = rhcSyncActions(initialStudy("normal"), r.st);
        expect(sync.actions).toContainEqual({ type: "pvc", on: true });
        expect(sync.pvcOwned).toBe(true);
      }
    }
    expect(seen).toBe(true);
  });
});

describe("torque and the knot", () => {
  it("torque that does not reach the tip winds the shaft (catheter-kink), which relaxes with time", () => {
    const r = new Run({ ...initialRhc(null, 1), profile: "balloon", flushed: true }).do({ type: "insert" });
    for (let i = 0; i < 20 && Math.abs(r.st.windup) < RHC_KINK_WINDUP_DEG; i++) {
      r.t += 0.2;
      r.st = rhcStep(r.st, { type: "rotate", deg: 90 }, r.t, ENV);
    }
    expect(rhcEvents(r.st)).toContain("catheter-kink");
    r.at(r.t + 60);
    expect(rhcEvents(r.st)).not.toContain("catheter-kink");
  });

  /** The knot-risk preset manipulated with firm turns until a knot forms. */
  function knotted(seed: number): Run {
    const r = new Run(initialRhc("rhc-knot-risk", seed));
    for (let i = 0; i < 60 && !r.st.knot; i++) r.do({ type: "rotate", deg: i % 2 ? 90 : -90 });
    expect(r.st.knot, `seed ${seed}`).not.toBeNull();
    return r;
  }

  it("prolonged forceful manipulation knots the catheter; a fresh passage with gentle work does not", () => {
    const k = knotted(11);
    expect(rhcEvents(k.st)).toEqual(expect.arrayContaining(["catheter-knot", "catheter-kink"]));
    // the tip no longer follows the hub; the live message does not name the knot
    k.do({ type: "rotate", deg: 90 });
    expect(k.st.messages.join(" ")).toMatch(/does not turn the tip/);
    expect(k.st.messages.join(" ")).not.toMatch(/knot/i);
    // a fresh catheter in the RV, worked gently for a short while, does not knot
    for (let seed = 1; seed <= 30; seed++) {
      const r = atApex(seed);
      for (let i = 0; i < 10; i++) r.do({ type: "rotate", deg: 30 }, { type: "advance", cm: RHC_STEP.gentle });
      expect(r.st.knot, `seed ${seed}`).toBeNull();
    }
  });

  it("pulling a formed knot tight before calling for help is a critical error", () => {
    const r = knotted(11).do({ type: "pull-tight" });
    const err = r.st.errors.find((e) => e.id === "knot-pulled-tight-before-help");
    expect(err?.critical).toBe(true);
    r.do({ type: "call-help" }, { type: "remove-with-sheath" });
    expect(r.st.inserted).toBe(false);
    const d = rhcDecisions(r.st).find((x) => x.id === "rhc-knot-bailout");
    expect(d?.correct).toBe(false);
    expect(d?.lessonId).toBe("hb-cardiac-catheterisation-rhc");
    // pulling on it by withdrawing counts too: the first pull meets resistance, the second tightens it
    const w = knotted(12).do({ type: "withdraw", cm: 1 });
    expect(w.st.errors).toEqual([]);
    expect(w.st.messages.join(" ")).toMatch(/will not withdraw freely/);
    w.do({ type: "withdraw", cm: 1 });
    expect(w.st.errors.find((e) => e.id === "knot-pulled-tight-before-help")?.critical).toBe(true);
  });

  it("Oxford's bail-out (help, no pull, the wire, then tighten and remove with the sheath) is correct, and the wire sometimes undoes the knot", () => {
    let undone = 0;
    let removed = 0;
    for (let seed = 11; seed < 31; seed++) {
      const r = knotted(seed).do({ type: "call-help" }, { type: "wire-advance" });
      if (r.st.knot!.resolved === "undone") {
        undone++;
        expect(rhcEvents(r.st)).not.toContain("catheter-knot");
        continue;
      }
      // a loop too large for the sheath until it is tightened
      r.do({ type: "remove-with-sheath" });
      expect(r.st.inserted).toBe(true);
      r.do({ type: "pull-tight" }, { type: "remove-with-sheath" });
      expect(r.st.inserted).toBe(false);
      expect(r.st.errors.filter((e) => e.critical)).toEqual([]);
      expect(rhcDecisions(r.st).find((x) => x.id === "rhc-knot-bailout")?.correct).toBe(true);
      removed++;
    }
    expect(undone).toBeGreaterThan(0);
    expect(removed).toBeGreaterThan(0);
    // tightening after help but before trying the wire is noted (not critical)
    const early = knotted(13).do({ type: "call-help" }, { type: "pull-tight" });
    expect(early.st.errors.map((e) => [e.id, e.critical])).toEqual([["knot-tightened-before-wire", false]]);
  });

  it("a knot undone with the wire without calling for help is not the advised bail-out", () => {
    let seen = 0;
    for (let seed = 11; seed < 61 && !seen; seed++) {
      const r = knotted(seed).do({ type: "wire-advance" });
      if (r.st.knot!.resolved !== "undone") continue;
      seen++;
      const d = rhcDecisions(r.st).find((x) => x.id === "rhc-knot-bailout")!;
      expect(d.correct).toBe(false);
      expect(d.given).toBe("Knot undone with the wire, help not called");
    }
    expect(seen).toBeGreaterThan(0);
  });

  it("a re-inserted catheter is a new one: no knot risk, progress or wire carried over (the knot stays in the debrief)", () => {
    const r = knotted(11).do({ type: "call-help" }, { type: "wire-advance" });
    if (!r.st.knot!.resolved) r.do({ type: "pull-tight" }, { type: "remove-with-sheath" });
    else for (let i = 0; i < 80 && r.st.inserted; i++) r.do({ type: "withdraw", cm: RHC_STEP.firm });
    expect(r.st.inserted).toBe(false);
    r.do({ type: "insert" });
    expect(knotRisk(r.st)).toBe(0);
    expect(r.st.furthest).toBe(0);
    expect(r.st.wire).toBe(false);
    expect(r.st.knot).not.toBeNull();
    // the debrief still reports the furthest point of the study
    expect(rhcSummary(r.st)[0]).toMatch(/right ventricle/);
    // and 45 s without progress on the new femoral passage raises engage-fail again
    r.at(r.t + RHC_ENGAGE_FAIL_S + 1);
    expect(rhcEvents(r.st)).toContain("engage-fail");
  });

  it("turns of the hub in quick succession add up to a forceful turn for the knot, so the panel's 30 degree turns can knot a catheter at risk", () => {
    let knots = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const r = new Run(initialRhc("rhc-knot-risk", seed));
      for (let i = 0; i < 60 && !r.st.knot; i++) {
        r.t += 0.25;
        r.st = rhcStep(r.st, { type: "rotate", deg: 30 }, r.t, ENV);
      }
      if (r.st.knot) knots++;
    }
    expect(knots).toBeGreaterThan(10);
    // the same 30 degree turns spaced out are not forceful
    const slow = new Run(initialRhc("rhc-knot-risk", 3));
    for (let i = 0; i < 30; i++) slow.at(slow.t + RHC_TURN_BURST_S + 1).do({ type: "rotate", deg: 30 });
    expect(slow.st.knot).toBeNull();
  });
});

describe("AF from atrial manipulation", () => {
  /** The AF preset, the tip worked in the atrium until AF starts. */
  function inAf(variant: "self-limiting" | "severe" | "mild"): Run {
    for (let seed = 1; seed < 200; seed++) {
      const st = initialRhc("rhc-af", seed);
      if (st.afVariant !== variant) continue;
      const r = new Run(st);
      for (let i = 0; i < 20 && !r.st.af; i++) r.do({ type: "rotate", deg: 30 });
      if (r.st.af) return r;
    }
    throw new Error(`no seed gives ${variant}`);
  }

  it("the preset's episodes take all three variants; AF is reported to the tip context while it lasts", () => {
    for (const v of ["self-limiting", "severe", "mild"] as const) {
      const r = inAf(v);
      expect(r.st.af?.variant).toBe(v);
      expect(rhcEvents(r.st)).toContain("atrial-fibrillation");
      expect(r.st.messages.join(" ")).toMatch(/irregular/);
    }
  });

  it("a self-limiting episode stops once the atrium is left alone, and a shock for it is wrong", () => {
    const r = inAf("self-limiting").do({ type: "withdraw", cm: 1 });
    r.at(r.t + RHC_AF_SELF_S + 1);
    expect(rhcEvents(r.st)).not.toContain("atrial-fibrillation");
    expect(rhcDecisions(r.st).find((d) => d.id === "rhc-af-management")?.correct).toBe(true);
    const shocked = inAf("self-limiting").do({ type: "treat", treatment: "sync-cardioversion" });
    expect(shocked.st.errors.map((e) => e.id)).toContain("cardioversion-self-limiting");
    expect(rhcDecisions(shocked.st).find((d) => d.id === "rhc-af-management")?.correct).toBe(false);
  });

  it("severe compromise: hypotension until oxygen, heparin and a synchronised shock; a shock alone is not as advised; an unsynchronised shock is noted", () => {
    const r = inAf("severe");
    expect(r.st.af!.rate).toBeGreaterThan(150);
    expect(rhcEvents(r.st)).toContain("hypotension");
    r.at(r.t + 200);
    expect(rhcEvents(r.st)).toContain("atrial-fibrillation"); // it does not stop on its own
    const ok = inAf("severe").do({ type: "treat", treatment: "oxygen" }, { type: "treat", treatment: "heparin" }, { type: "treat", treatment: "sync-cardioversion" });
    expect(rhcEvents(ok.st)).not.toContain("atrial-fibrillation");
    expect(rhcDecisions(ok.st).find((d) => d.id === "rhc-af-management")?.correct).toBe(true);
    // the shock without oxygen and heparin first does not match what is scored as expected
    const bare = inAf("severe").do({ type: "treat", treatment: "sync-cardioversion" });
    expect(rhcEvents(bare.st)).not.toContain("atrial-fibrillation");
    expect(rhcDecisions(bare.st).find((d) => d.id === "rhc-af-management")?.correct).toBe(false);
    const late = inAf("severe").do({ type: "treat", treatment: "sync-cardioversion" }, { type: "treat", treatment: "oxygen" }, { type: "treat", treatment: "heparin" });
    expect(rhcDecisions(late.st).find((d) => d.id === "rhc-af-management")?.correct).toBe(false);
    // the module text gives synchronised cardioversion; an unsynchronised shock is noted, not a critical error
    const bad = inAf("severe").do({ type: "treat", treatment: "unsync-shock" });
    const err = bad.st.errors.find((e) => e.id === "unsynchronised-shock");
    expect(err?.critical).toBe(false);
    expect(err?.text).toMatch(/synchronised cardioversion/);
    expect(rhcDecisions(bad.st).find((d) => d.id === "rhc-af-management")?.correct).toBe(false);
  });

  it("the late-shock note calls the two-minute limit a model threshold, not Oxford's", () => {
    const r = inAf("severe");
    r.at(r.t + 200);
    const err = r.st.errors.find((e) => e.id === "af-shock-late");
    expect(err?.text).toMatch(/model threshold/);
    expect(err?.text).not.toMatch(/Oxford/);
  });

  it("milder compromise: heparin then flecainide without structural heart disease ends it; flecainide with structural disease is noted", () => {
    const r = inAf("mild");
    expect(r.st.af!.rate).toBeLessThan(150);
    r.do({ type: "treat", treatment: "heparin" }, { type: "treat", treatment: "flecainide" });
    r.at(r.t + RHC_AF_DRUG_S + 1);
    expect(rhcEvents(r.st)).not.toContain("atrial-fibrillation");
    expect(rhcDecisions(r.st).find((d) => d.id === "rhc-af-management")?.correct).toBe(true);
    const s = inAf("mild");
    s.env = { ...ENV, structural: true };
    s.do({ type: "treat", treatment: "heparin" }, { type: "treat", treatment: "flecainide" });
    expect(s.st.errors.map((e) => e.id)).toContain("flecainide-structural");
  });
});

describe("the haemodynamic study follows the catheter", () => {
  const apply = (study: HaemoStudyState, st: RhcState, owned: string[] = []) => {
    const sync = rhcSyncActions(study, st, owned as never);
    return { study: sync.actions.reduce(haemoStudyReducer, study), owned: sync.owned };
  };

  it("the recorder shows the chamber the tip is in; the knot reaches the tip context as catheter-knot and catheter-kink", () => {
    let study = initialStudy("normal", "rhc-knot-risk");
    let owned: string[] = [];
    const r = new Run(initialRhc("rhc-knot-risk", 11));
    ({ study, owned } = apply(study, r.st, owned));
    expect(shownChambers(study)).toEqual(["RV"]);
    expect(haemoTipContext(study).phase).toBe("right-heart");
    for (let i = 0; i < 60 && !r.st.knot; i++) r.do({ type: "rotate", deg: i % 2 ? 90 : -90 });
    ({ study, owned } = apply(study, r.st, owned));
    expect(haemoTipContext(study).events).toEqual(expect.arrayContaining(["catheter-knot", "catheter-kink"]));
    // undone with the wire (or removed), the events go; an event a launch raised stays
    study = haemoStudyReducer(study, { type: "raise", event: "pulmonary-hypertension" });
    r.do({ type: "call-help" }, { type: "pull-tight" }, { type: "remove-with-sheath" });
    ({ study, owned } = apply(study, r.st, owned));
    expect(study.rhc).toBe(-1);
    expect(haemoTipContext(study).events).not.toContain("catheter-knot");
    expect(study.raised).toContain("pulmonary-hypertension");
    expect(owned).toEqual([]);
  });

  it("engage-fail is not raised while the left heart catheter is in (it would read as a crossing failure)", () => {
    const r = new Run(initialRhc("rhc-femoral-mp", 3)).do({ type: "insert" });
    for (let i = 0; i < 8; i++) r.do({ type: "advance", cm: RHC_STEP.firm });
    r.at(r.t + RHC_ENGAGE_FAIL_S + 1);
    expect(rhcEvents(r.st)).toContain("engage-fail");
    const right = apply(initialStudy("normal"), r.st).study;
    expect(right.raised).toContain("engage-fail");
    const both = apply(haemoStudyReducer(initialStudy("normal"), { type: "lhc", position: "Ao" }), r.st).study;
    expect(both.raised).not.toContain("engage-fail");
  });

  it("engage-fail belongs to the femoral passage up to the RV: not raised while recording in the RV, nor on a jugular passage", () => {
    const k = new Run(initialRhc("rhc-knot-risk", 3));
    k.at(RHC_ENGAGE_FAIL_S + 1);
    expect(k.zone).toBe("rv-inflow");
    expect(rhcEvents(k.st)).not.toContain("engage-fail");
    const study = apply(initialStudy("normal", "rhc-knot-risk"), k.st).study;
    expect(study.raised).not.toContain("engage-fail");
    expect(tipsFor(haemoTipContext(study), 20).map((t) => t.id)).not.toContain("haemo-rhc-femoral-side-branch");
    // a jugular passage at the apex, then a long wait
    const j = new Run({ ...initialRhc(null, 4), flushed: true }).do({ type: "route", route: "rij" }, { type: "insert" }).aim("tv");
    for (let i = 0; i < 20 && j.zone !== "rv-apex"; i++) j.do({ type: "advance", cm: RHC_STEP.gentle * 2 });
    expect(j.zone).toBe("rv-apex");
    j.at(80);
    expect(rhcEvents(j.st)).not.toContain("engage-fail");
    // nor in the jugular RA
    const ja = new Run({ ...initialRhc(null, 4), flushed: true }).do({ type: "route", route: "rij" }, { type: "insert" });
    ja.at(ja.t + RHC_ENGAGE_FAIL_S + 1);
    expect(rhcEvents(ja.st)).not.toContain("engage-fail");
  });

  it("a chamber move the study received from elsewhere is left alone until the catheter's own chamber changes", () => {
    const r = new Run(initialRhc("rhc-knot-risk", 3));
    let study = initialStudy("normal", "rhc-knot-risk");
    const first = rhcSyncActions(study, r.st);
    study = first.actions.reduce(haemoStudyReducer, study);
    expect(study.rhc).toBe(1);
    expect(first.chamber).toBe(1);
    // a dev hook moves the recorder on; the catheter has not moved
    study = haemoStudyReducer(study, { type: "rhc-advance" });
    expect(study.rhc).toBe(2);
    r.at(r.t + 1);
    const tick = rhcSyncActions(study, r.st, first.owned, first.pvcOwned, first.chamber);
    expect(tick.actions.filter((a) => a.type === "rhc-advance" || a.type === "rhc-withdraw")).toEqual([]);
    study = tick.actions.reduce(haemoStudyReducer, study);
    expect(study.rhc).toBe(2);
    // the catheter comes back to the RA: the recorder follows from where it is
    r.backToRA();
    const moved = rhcSyncActions(study, r.st, tick.owned, tick.pvcOwned, tick.chamber);
    study = moved.actions.reduce(haemoStudyReducer, study);
    expect(study.rhc).toBe(0);
    expect(moved.chamber).toBe(0);
  });

  it("the pigtail profile switches the study's catheter and never shows the wedge", () => {
    const st = { ...initialRhc(null, 1), profile: "pigtail" as const, flushed: true, inserted: true, extra: "wedge" as const, lead: { ...initialRhc().lead, zone: "pa" as const, pos: 5 } };
    const study = apply(initialStudy("normal"), st).study;
    expect(study.rhcCatheter).toBe("pigtail");
    expect(shownChambers(study)).toEqual(["PA"]);
  });
});
