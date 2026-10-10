// Hyperaemia in the pressure-wire session (physiology-hyperaemia-and-adenosine): the agent, route and
// dose; the hyperaemia that follows from the engine's adenosine model; the failure states (tissued line,
// saline, low dose, caffeine, disengaged guide, early reading) and how a reading is flagged; contrast
// FFR at 0.83; and what the lab's engine is told (applyPwActionToEngine).
//   npx vitest run src/simulation/pci/pwSession.hyperaemia.test.ts
import { describe, expect, it, vi } from "vitest";
import { ADENOSINE, ivAdenosineTauS } from "../patient/pharmacology";
import { MP_DEFIB } from "../patient/rhythm";
import {
  CONTRAST_FFR_CUTOFF,
  HYPERAEMIA_PRESETS,
  HYPERAEMIA_PRESETS_LISTED,
  IC_ADENOSINE_MAXIMAL_UG,
  MP_BLOCK_SELF_RESOLVE_S,
  MP_CONTRAST_PLATEAU_S,
  PHYSIOLOGY_PRESETS,
  physiologyPreset,
  IV_READ_AFTER_S,
  MP_INJECTION_RECOVERY_S,
  MP_SUBMAXIMAL_H,
  PRESET_BY_ID,
  applyPwActionToEngine,
  consoleReading,
  hyperaemia,
  initialPwSession,
  injectionArtefact,
  processItems,
  pwSessionReducer,
  setUpPwEngine,
  type PwAction,
  type PwEngine,
  type PwOrder,
  type PwSessionState,
} from "./pwSession";

const play = (s: PwSessionState, ...as: PwAction[]) => as.reduce(pwSessionReducer, s);
const wait = (s: PwSessionState, seconds: number) => {
  let n = s;
  for (let i = 0; i < Math.round(seconds * 10); i++) n = pwSessionReducer(n, { type: "tick", dt: 0.1 });
  return n;
};
/** A drift-free wire equalised at the guide tip and parked distal to the lesion (the presets start at the tip). */
const ready = (id: string) => {
  const s0 = initialPwSession(id, "h");
  return play({ ...s0, wire: { ...s0.wire, driftPerS: 0 } }, { type: "equalise" }, { type: "sensor", mm: 100 });
};
const lastFfr = (s: PwSessionState) => s.records.filter((r) => r.kind === "ffr").slice(-1)[0];

describe("FFR flags (acceptance)", () => {
  it("FFR at h < 0.9 is flagged submaximal; at maximal hyperaemia it is not", () => {
    // a low IV rate settles below maximal hyperaemia
    let low = wait(play(ready("iv-tissued-line"), { type: "hyperaemia", mode: "iv", rateUgKgMin: 60, site: "central" }), 180);
    expect(hyperaemia(low)).toBeLessThan(MP_SUBMAXIMAL_H);
    low = play(low, { type: "measure-ffr" });
    expect(lastFfr(low).problems).toContain("submaximal hyperaemia");
    expect(lastFfr(low).problems).toContain("a very low infusion rate");
    expect(lastFfr(low).valid).toBe(false);
    // the standard rate through a central vein, read after 2 minutes
    let ok = wait(play(ready("iv-tissued-line"), { type: "hyperaemia", mode: "iv", rateUgKgMin: ADENOSINE.ivStandardUgKgMin, site: "central" }), 120);
    expect(hyperaemia(ok)).toBeGreaterThanOrEqual(MP_SUBMAXIMAL_H);
    ok = play(ok, { type: "measure-ffr" });
    expect(lastFfr(ok).problems).toEqual([]);
    expect(lastFfr(ok).pdpa).toBeLessThanOrEqual(0.8);
    // the boundary itself: h just under 0.9 is flagged, just over is not
    const tau = ivAdenosineTauS("central");
    const tCross = tau * Math.log(1 / (1 - MP_SUBMAXIMAL_H));
    const s0 = play(ready("iv-tissued-line"), { type: "hyperaemia", mode: "iv", rateUgKgMin: ADENOSINE.ivStandardUgKgMin, site: "central" });
    const before = play(wait(s0, tCross - 1), { type: "measure-ffr" });
    const after = play(wait(s0, tCross + 1), { type: "measure-ffr" });
    expect(lastFfr(before).h).toBeLessThan(MP_SUBMAXIMAL_H);
    expect(lastFfr(before).problems).toContain("submaximal hyperaemia");
    expect(lastFfr(after).h).toBeGreaterThanOrEqual(MP_SUBMAXIMAL_H);
    expect(lastFfr(after).problems).not.toContain("submaximal hyperaemia");
  });

  it("FFR before the guide flush after an IC bolus is flagged early; after the flush, once the trace has recovered, it is clean", () => {
    let s = play(ready("ic-rca-dose"), { type: "hyperaemia", mode: "ic", doseUg: 100, fast: false });
    s = wait(s, 4);
    const early = play(s, { type: "measure-ffr" });
    expect(lastFfr(early).problems).toContain("read early: the guide was not flushed after the intracoronary bolus");
    expect(lastFfr(early).valid).toBe(false);
    // just after the flush the guide trace is still disturbed: early as well, and the console's Pa is raised by the injection
    s = play(s, { type: "flush-guide" });
    expect(injectionArtefact(s)).toBeGreaterThan(5);
    const disturbed = play(wait(s, 1), { type: "measure-ffr" });
    expect(lastFfr(disturbed).problems).toContain("read early: the guide trace had not recovered from the injection");
    const clean = play(wait(s, MP_INJECTION_RECOVERY_S + 1), { type: "measure-ffr" });
    expect(lastFfr(clean).problems).toEqual([]);
    expect(lastFfr(clean).agent).toBe("ic");
    // the early reading after the injection reads lower than the settled one (the quiz of lesson pm-physiology-indices)
    expect(lastFfr(disturbed).pdpa).toBeLessThan(lastFfr(clean).pdpa);
    expect(processItems(clean).find((i) => i.id === "ic-flush")?.ok).toBe(true);
    expect(processItems(early).find((i) => i.id === "ic-flush")?.ok).toBe(false);
  });
});

describe("intracoronary adenosine: dose by vessel, the flush and the guide", () => {
  it("the flush delivers the rest of the bolus: hyperaemia rises after it", () => {
    let s = wait(play(ready("ic-rca-dose"), { type: "hyperaemia", mode: "ic", doseUg: 50, fast: false }), 2);
    const unflushed = wait(s, 3);
    s = wait(play(s, { type: "flush-guide" }), 3);
    expect(hyperaemia(s)).toBeGreaterThan(hyperaemia(unflushed));
  });

  it("the lower end of the module's range is maximal for each side; a very low dose is not", () => {
    const peak = (id: string, dose: number) => {
      let s = wait(play(ready(id), { type: "hyperaemia", mode: "ic", doseUg: dose, fast: false }), 1);
      s = play(s, { type: "flush-guide" });
      let best = 0;
      for (let i = 0; i < 300; i++) {
        s = pwSessionReducer(s, { type: "tick", dt: 0.1 });
        best = Math.max(best, hyperaemia(s));
      }
      return best;
    };
    expect(peak("ic-rca-dose", IC_ADENOSINE_MAXIMAL_UG.right)).toBeGreaterThanOrEqual(MP_SUBMAXIMAL_H);
    expect(peak("ic-rca-dose", 100)).toBeCloseTo(1, 6);
    expect(peak("ic-rca-dose", 20)).toBeLessThan(0.5);
    expect(peak("iv-tissued-line", IC_ADENOSINE_MAXIMAL_UG.left)).toBeGreaterThanOrEqual(MP_SUBMAXIMAL_H);
    expect(peak("iv-tissued-line", 40)).toBeLessThan(MP_SUBMAXIMAL_H);
  });

  it("a bolus given with the guide disengaged gives little hyperaemia, and the debrief says why", () => {
    let s = play(ready("ic-rca-dose"), { type: "guide", engaged: false }, { type: "hyperaemia", mode: "ic", doseUg: 100, fast: false });
    s = play(wait(play(wait(s, 1), { type: "flush-guide" }), 4), { type: "measure-ffr" });
    expect(lastFfr(s).h).toBeLessThan(MP_SUBMAXIMAL_H);
    expect(lastFfr(s).problems).toContain("the guide was disengaged when the bolus was given");
  });

  it("the dose item: more than 100 µg into the RCA, or a fast push, is not within the vessel's dose", () => {
    const item = (s: PwSessionState) => processItems(s).find((i) => i.id === "ic-dose");
    expect(item(play(ready("ic-rca-dose"), { type: "hyperaemia", mode: "ic", doseUg: 80, fast: false }))?.ok).toBe(true);
    expect(item(play(ready("ic-rca-dose"), { type: "hyperaemia", mode: "ic", doseUg: 200, fast: false }))?.ok).toBe(false);
    expect(item(play(ready("ic-rca-dose"), { type: "hyperaemia", mode: "ic", doseUg: 80, fast: true }))?.ok).toBe(false);
    // no dose entered: refused, nothing given
    const none = play(ready("ic-rca-dose"), { type: "hyperaemia", mode: "ic", doseUg: Number.NaN, fast: false });
    expect(none.hyper.mode).toBe("none");
    expect(none.log[0].bad).toBe(true);
  });
});

describe("IV adenosine: the site, and the failures of hyperaemia", () => {
  it("a central vein reaches 90% sooner than a large peripheral one; the console waits a minute before a pullback", () => {
    const t90 = (site: "central" | "peripheral") => {
      let s = play(ready("iv-tissued-line"), { type: "hyperaemia", mode: "iv", rateUgKgMin: 140, site });
      for (let i = 1; i < 3000; i++) {
        s = pwSessionReducer(s, { type: "tick", dt: 0.1 });
        if (hyperaemia(s) >= 0.9) return i / 10;
      }
      return Infinity;
    };
    expect(t90("peripheral")).toBeGreaterThan(t90("central"));
    const s = play(ready("iv-tissued-line"), { type: "hyperaemia", mode: "iv", rateUgKgMin: 140, site: "central" });
    expect(play(wait(s, IV_READ_AFTER_S - 5), { type: "pullback" }).log[0].value).toBe("wait");
    expect(play(wait(s, IV_READ_AFTER_S + 1), { type: "pullback" }).pullback?.kind).toBe("FFR");
  });

  it("'iv-tissued-line': the hand cannula gives no hyperaemia and a falsely high FFR; looking at it shows why; a central vein works", () => {
    let s = wait(play(ready("iv-tissued-line"), { type: "hyperaemia", mode: "iv", rateUgKgMin: 140, site: "hand" }), 150);
    expect(hyperaemia(s)).toBeLessThan(0.2);
    s = play(s, { type: "measure-ffr" });
    expect(lastFfr(s).pdpa).toBeGreaterThan(0.8);
    expect(lastFfr(s).problems).toEqual(expect.arrayContaining(["submaximal hyperaemia", "the infusion ran into a tissued hand-vein cannula"]));
    // the console itself never says so: no refusal, the value is shown
    expect(s.log[0].bad).toBeFalsy();
    s = play(s, { type: "check-line" });
    expect(s.log[0].value).toBe("tissued");
    // the console states what is seen; the advice on the site is a teaching aid only
    expect(s.log[0].note).not.toMatch(/central|poor site/);
    expect(s.log[0].aid).toMatch(/central vein/);
    s = wait(play(s, { type: "hyperaemia", mode: "iv", rateUgKgMin: 140, site: "central" }), 120);
    s = play(s, { type: "measure-ffr" });
    expect(lastFfr(s).valid).toBe(true);
    expect(lastFfr(s).pdpa).toBeLessThanOrEqual(0.8);
    s = play(s, { type: "decide", id: "treat" });
    expect(processItems(s).find((i) => i.id === "failed-hyperaemia")?.ok).toBe(true);
  });

  it("'saline-swap': nothing happens until the drugs are checked; then adenosine works", () => {
    let s = wait(play(ready("saline-swap"), { type: "hyperaemia", mode: "iv", rateUgKgMin: 140, site: "central" }), 120);
    expect(hyperaemia(s)).toBe(0);
    s = play(s, { type: "measure-ffr" });
    expect(lastFfr(s).problems).toContain("saline was given instead of adenosine");
    s = play(s, { type: "check-drug" });
    expect(s.log[0].value).toBe("saline, not adenosine");
    s = wait(play(s, { type: "hyperaemia", mode: "iv", rateUgKgMin: 140, site: "central" }), 120);
    expect(hyperaemia(s)).toBeGreaterThan(0.95);
    // the IC syringe is swapped too until checked
    const ic = wait(play(ready("saline-swap"), { type: "hyperaemia", mode: "ic", doseUg: 160, fast: false }, { type: "flush-guide" }), 4);
    expect(hyperaemia(ic)).toBe(0);
  });

  it("'iv-caffeine': the standard infusion is blunted to a falsely high FFR; asking finds the coffee; the resting index answers", () => {
    let s = wait(play(ready("iv-caffeine"), { type: "hyperaemia", mode: "iv", rateUgKgMin: 140, site: "central" }), 180);
    expect(hyperaemia(s)).toBeLessThan(0.7);
    s = play(s, { type: "measure-ffr" });
    expect(lastFfr(s).pdpa).toBeGreaterThan(0.8);
    expect(lastFfr(s).problems).toContain("recent caffeine blunts adenosine");
    s = play(s, { type: "ask-caffeine" });
    expect(s.log[0].value).toBe("coffee this morning");
    s = wait(play(s, { type: "hyperaemia", mode: "none" }), 120);
    s = play(s, { type: "measure-rest" });
    const rest = s.records[s.records.length - 1];
    expect(rest.kind).toBe("rest");
    expect(rest.valid).toBe(true);
    expect(rest.wfp).toBeLessThanOrEqual(0.89);
  });
});

describe("contrast FFR", () => {
  it("'contrast-ffr': contrast FFR lies between 0.80 and the contrast cut-off 0.83, the true FFR at or below 0.80, and it is not flagged submaximal", () => {
    const s0 = play(ready("contrast-ffr"), { type: "hyperaemia", mode: "contrast" });
    const s = play(wait(s0, 5), { type: "measure-ffr" });
    const r = lastFfr(s);
    expect(r.agent).toBe("contrast");
    expect(r.problems).toEqual([]);
    expect(r.pdpa).toBeGreaterThan(0.8);
    expect(r.pdpa).toBeLessThanOrEqual(CONTRAST_FFR_CUTOFF);
    expect(s.log[0].label).toBe("Contrast FFR");
    expect(s.log[0].note).toBe(`threshold ≤ ${CONTRAST_FFR_CUTOFF}`);
    expect(physiologyPreset("contrast-ffr")!.case.decision).toBe("treat");
    // with adenosine the same lesion reads at or below 0.80 (but adenosine is contraindicated: the debrief marks it)
    let iv = wait(play(ready("contrast-ffr"), { type: "hyperaemia", mode: "iv", rateUgKgMin: 140, site: "central" }), 120);
    iv = play(iv, { type: "measure-ffr" });
    expect(lastFfr(iv).pdpa).toBeLessThanOrEqual(0.8);
    expect(processItems(iv).find((i) => i.id === "no-adenosine")?.ok).toBe(false);
    expect(processItems(s).find((i) => i.id === "no-adenosine")?.ok).toBe(true);
    expect(processItems(s).find((i) => i.id === "contrast-ffr")?.ok).toBe(true);
  });

  it("read after the contrast effect has passed it is the resting Pd/Pa: flagged, not valid, and the contrast item fails", () => {
    const s0 = play(ready("contrast-ffr"), { type: "hyperaemia", mode: "contrast" });
    const late = play(wait(s0, 40), { type: "measure-ffr" });
    const r = lastFfr(late);
    expect(r.h).toBeLessThan(0.1);
    expect(r.valid).toBe(false);
    expect(r.problems).toContain("read after the contrast effect had passed");
    expect(processItems(late).find((i) => i.id === "contrast-ffr")?.ok).toBe(false);
    // on the plateau it is clean; just after the trace recovers, before the effect has built, it is early
    expect(lastFfr(play(wait(s0, MP_CONTRAST_PLATEAU_S - 1), { type: "measure-ffr" })).problems).toEqual([]);
    expect(lastFfr(play(wait(s0, MP_INJECTION_RECOVERY_S + 0.2), { type: "measure-ffr" })).problems).toContain("read early: the contrast effect had not built up");
  });

  it("read during the injection artefact it is flagged early; Pa reads high while the trace is disturbed", () => {
    const s = play(ready("contrast-ffr"), { type: "hyperaemia", mode: "contrast" });
    const now = play(wait(s, 0.5), { type: "measure-ffr" });
    expect(lastFfr(now).problems).toContain("read early: the guide trace had not recovered from the injection");
    expect(consoleReading(wait(s, 0.5)).pa).toBeGreaterThan(consoleReading(wait(s, 8)).pa);
  });
});

describe("the legacy actions keep their curves (other callers unchanged)", () => {
  it("IV without a rate or site ramps over MP_IV_RAMP_S; IC without a dose follows the pressureWire curve", () => {
    const iv = wait(play(ready("lad-intermediate"), { type: "hyperaemia", mode: "iv" }), 25);
    expect(hyperaemia(iv)).toBe(1);
    expect(iv.hyper).toEqual({ mode: "iv", t0: 0 });
    const ic = play(ready("lad-intermediate"), { type: "hyperaemia", mode: "ic" });
    expect(ic.hyper).toEqual({ mode: "ic", t0: 0 });
    expect(ic.inj).toBeNull();
  });
});

describe("the lab's engine is told what was done (applyPwActionToEngine, setUpPwEngine)", () => {
  const fakeEngine = () => {
    const e = {
      giveDrug: vi.fn(() => ({ ok: true as const, flags: [] })),
      startInfusion: vi.fn(),
      stopInfusion: vi.fn(),
      contrast: vi.fn(),
      setRecentCaffeine: vi.fn(),
      setAdenosineHazards: vi.fn(),
      cough: vi.fn(),
      setCpr: vi.fn(),
      setPacing: vi.fn(),
      charge: vi.fn(),
      clearForShock: vi.fn(),
      shock: vi.fn(() => "converted" as const),
      cardiovert: vi.fn(() => "converted" as const),
    };
    return e as typeof e & PwEngine;
  };
  const run = (e: PwEngine, s: PwSessionState, ...as: PwAction[]) =>
    as.reduce((st, a) => {
      const n = pwSessionReducer(st, a);
      applyPwActionToEngine(e, st, n, a);
      return n;
    }, s);

  it("IC: the dose that reached the artery with the vessel and speed, then the rest at the flush; IV: rate, site and delivered fraction", () => {
    const e = fakeEngine();
    let s = run(e, ready("ic-rca-dose"), { type: "hyperaemia", mode: "ic", doseUg: 100, fast: true });
    expect(e.giveDrug).toHaveBeenLastCalledWith("adenosine", 60, "ic", { side: "right", vessel: "RCA", fast: true, bolusUg: 100 });
    s = run(e, s, { type: "flush-guide" });
    expect(e.giveDrug).toHaveBeenLastCalledWith("adenosine", 40, "ic", { side: "right", vessel: "RCA", fast: false, continuation: true });
    const t = fakeEngine();
    run(t, ready("iv-tissued-line"), { type: "hyperaemia", mode: "iv", rateUgKgMin: 150, site: "hand" });
    expect(t.startInfusion).toHaveBeenLastCalledWith({ drug: "adenosine", rate: 150, site: "peripheral", delivered: 0.1 });
    const c = fakeEngine();
    run(c, ready("iv-caffeine"), { type: "hyperaemia", mode: "iv", rateUgKgMin: 140, site: "central" }, { type: "hyperaemia", mode: "none" });
    expect(c.startInfusion).toHaveBeenLastCalledWith({ drug: "adenosine", rate: 140, site: "central" });
    expect(c.stopInfusion).toHaveBeenCalledWith("adenosine");
    // saline: nothing reaches the engine
    const sw = fakeEngine();
    run(sw, ready("saline-swap"), { type: "hyperaemia", mode: "iv", rateUgKgMin: 140, site: "central" }, { type: "hyperaemia", mode: "ic", doseUg: 160 });
    expect(sw.startInfusion).not.toHaveBeenCalled();
    expect(sw.giveDrug).not.toHaveBeenCalled();
    // contrast goes to the guide's side
    const ct = fakeEngine();
    run(ct, ready("contrast-ffr"), { type: "hyperaemia", mode: "contrast" });
    expect(ct.contrast).toHaveBeenCalledWith(8, "left");
  });

  it("a bolus reaches the engine in two parts but is judged whole: a slow 120 µg RCA dose carries bolusUg 120, the flush carries continuation", () => {
    const e = fakeEngine();
    run(e, ready("ic-rca-dose"), { type: "hyperaemia", mode: "ic", doseUg: 120, fast: false }, { type: "flush-guide" });
    expect(e.giveDrug.mock.calls).toEqual([
      ["adenosine", 72, "ic", { side: "right", vessel: "RCA", fast: false, bolusUg: 120 }],
      ["adenosine", 48, "ic", { side: "right", vessel: "RCA", fast: false, continuation: true }],
    ]);
    // with the guide disengaged the bolus heading for the artery is the little that reaches it
    const d = fakeEngine();
    run(d, ready("ic-rca-dose"), { type: "guide", engaged: false }, { type: "hyperaemia", mode: "ic", doseUg: 100, fast: false });
    expect(d.giveDrug).toHaveBeenLastCalledWith("adenosine", 12, "ic", { side: "right", vessel: "RCA", fast: false, bolusUg: 20 });
  });

  it("a refused bolus or infusion (no dose, no rate) reaches the engine as nothing", () => {
    const e = fakeEngine();
    let s = run(e, ready("ic-rca-dose"), { type: "hyperaemia", mode: "ic", doseUg: Number.NaN, fast: false }, { type: "hyperaemia", mode: "ic", doseUg: 0, fast: true });
    s = run(e, s, { type: "hyperaemia", mode: "iv", rateUgKgMin: Number.NaN, site: "central" });
    expect(s.hyper.mode).toBe("none");
    expect(e.giveDrug).not.toHaveBeenCalled();
    expect(e.startInfusion).not.toHaveBeenCalled();
    // a refused change while an infusion runs leaves it running as it was
    const r = fakeEngine();
    s = run(r, ready("iv-caffeine"), { type: "hyperaemia", mode: "iv", rateUgKgMin: 140, site: "central" }, { type: "hyperaemia", mode: "iv", rateUgKgMin: Number.NaN, site: "central" });
    expect(s.hyper.mode).toBe("iv");
    expect(r.startInfusion).toHaveBeenCalledTimes(1);
    expect(r.stopInfusion).not.toHaveBeenCalled();
  });

  it("the legacy actions give what the lab always gave", () => {
    const e = fakeEngine();
    run(e, ready("rca-negative"), { type: "hyperaemia", mode: "ic" }, { type: "gtn" }, { type: "hyperaemia", mode: "iv" }, { type: "hyperaemia", mode: "none" });
    expect(e.giveDrug).toHaveBeenCalledWith("adenosine", 100, "ic", { side: "right" });
    expect(e.giveDrug).toHaveBeenCalledWith("gtn", 200, "ic", { side: "right" });
    expect(e.startInfusion).toHaveBeenCalledWith({ drug: "adenosine", rate: ADENOSINE.ivStandardUgKgMin, site: "central" });
    expect(e.stopInfusion).toHaveBeenCalledWith("adenosine");
  });

  it("orders reach the engine; the presets set up caffeine, the hazard model and the colleague's bolus", () => {
    const e = fakeEngine();
    const o = (order: PwOrder) => ({ type: "order", order }) as PwAction;
    // the shocks are given once the defibrillator has charged (MP_DEFIB.chargeTimeS, the engine's charge time)
    let s = run(e, ready("ic-rca-dose"), o("cough"), o("cpr-start"), o("pace-on"), o("charge"));
    s = wait(s, MP_DEFIB.chargeTimeS);
    s = run(e, s, o("clear"), o("shock"), o("charge"));
    s = wait(s, MP_DEFIB.chargeTimeS);
    s = run(e, s, o("cardiovert"), o("pace-off"), o("cpr-stop"), o("wait"));
    expect(e.cough).toHaveBeenCalledOnce();
    expect(e.setCpr.mock.calls).toEqual([[true], [false]]);
    expect(e.setPacing.mock.calls).toEqual([[70], [null]]);
    expect(e.charge).toHaveBeenCalledTimes(2);
    expect(e.clearForShock).toHaveBeenCalledOnce();
    expect(e.shock).toHaveBeenCalledOnce();
    expect(e.cardiovert).toHaveBeenCalledOnce();
    expect(s.orders.map((o) => o.order)).toHaveLength(11);
    expect(s.cpr).toBe(false);
    expect(s.pacing).toBe(false);
    const caf = fakeEngine();
    setUpPwEngine(caf, initialPwSession("iv-caffeine"));
    expect(caf.setRecentCaffeine).toHaveBeenCalledWith(true);
    expect(caf.setAdenosineHazards).not.toHaveBeenCalled();
    const vf = fakeEngine();
    const sv = initialPwSession("adenosine-vf");
    setUpPwEngine(vf, sv);
    expect(vf.setAdenosineHazards).toHaveBeenCalledWith({ force: "vf" });
    expect(vf.giveDrug).toHaveBeenCalledWith("adenosine", 90, "ic", { side: "right", vessel: "RCA", fast: true, bolusUg: 150 });
    expect(sv.hyper.mode).toBe("ic");
    const on = fakeEngine();
    setUpPwEngine(on, initialPwSession("ic-rca-dose"));
    expect(on.setAdenosineHazards).toHaveBeenCalledWith({ force: null });
    // every other preset leaves the engine as it is
    const plain = fakeEngine();
    const s0 = initialPwSession("lad-intermediate");
    expect(setUpPwEngine(plain, s0)).toBe(s0);
    for (const f of Object.values(plain)) expect(f).not.toHaveBeenCalled();
    // the patient's dominance reaches the session
    expect(setUpPwEngine({ ...fakeEngine(), profile: { dominance: "left" } }, s0).dominance).toBe("left");
  });

  it("a shock before the defibrillator has charged delivers nothing: no order, a 'not charged' log entry, the engine not shocked, VF not credited", () => {
    const e = fakeEngine();
    let s = ready("adenosine-vf");
    const tick = (kind: string, n: number) => {
      for (let i = 0; i < n; i++) s = pwSessionReducer(s, { type: "tick", dt: 0.1, patient: { rhythm: { kind, av: 0 } } });
    };
    tick("sinus", 5);
    tick("vf", 5);
    s = run(e, s, { type: "order", order: "charge" });
    expect(s.defib).toEqual({ chargingSince: s.t, charged: false });
    tick("vf", 10);
    s = run(e, s, { type: "order", order: "clear" }, { type: "order", order: "shock" });
    expect(s.log[0]).toMatchObject({ label: "Order", value: "Not charged: no shock delivered", bad: true });
    expect(s.orders.map((o) => o.order)).not.toContain("shock");
    expect(e.shock).not.toHaveBeenCalled();
    // 20 s on, still in VF at the decision: not defibrillated
    tick("vf", 200);
    s = play(s, { type: "decide", id: "defer" });
    expect(processItems(s).find((i) => i.id.startsWith("vf-"))?.ok).toBe(false);
    // once charged the shock is delivered and recorded; the VF item needs the VF to have ended
    s = run(e, s, { type: "order", order: "charge" });
    tick("vf", MP_DEFIB.chargeTimeS * 10);
    expect(s.defib).toEqual({ chargingSince: null, charged: true });
    s = run(e, s, { type: "order", order: "shock" });
    expect(e.shock).toHaveBeenCalledOnce();
    expect(s.defib.charged).toBe(false);
    expect(s.orders.map((o) => o.order)).toContain("shock");
    tick("vf", 10);
    expect(processItems(s).find((i) => i.id.startsWith("vf-"))?.ok, "a delivered shock that did not end the VF").toBe(false);
    tick("sinus", 5);
    expect(processItems(s).find((i) => i.id.startsWith("vf-"))?.ok).toBe(true);
  });

  it("the defibrillator follows the engine when the lab passes it; a synchronised shock needs a charge and an R wave", () => {
    const e = fakeEngine();
    let s = run(e, ready("ic-rca-dose"), { type: "order", order: "charge" });
    // the engine still charging after the session's own charge time: the engine decides
    const tick = (kind: string, defib: { charging: boolean; charged: number }) => (s = pwSessionReducer(s, { type: "tick", dt: MP_DEFIB.chargeTimeS + 1, patient: { rhythm: { kind, av: 0 }, defib } }));
    tick("af", { charging: true, charged: 0 });
    expect(s.defib.charged).toBe(false);
    s = run(e, s, { type: "order", order: "cardiovert" });
    expect(s.log[0].value).toBe("Not charged: no shock delivered");
    expect(e.cardiovert).not.toHaveBeenCalled();
    tick("vf", { charging: false, charged: 200 });
    expect(s.defib).toEqual({ chargingSince: null, charged: true });
    // VF: no R wave to synchronise to; nothing delivered, the charge kept
    s = run(e, s, { type: "order", order: "cardiovert" });
    expect(s.log[0].value).toBe("No synchronised shock delivered");
    expect(s.defib.charged).toBe(true);
    expect(e.cardiovert).not.toHaveBeenCalled();
    tick("af", { charging: false, charged: 200 });
    s = run(e, s, { type: "order", order: "cardiovert" });
    expect(e.cardiovert).toHaveBeenCalledOnce();
    expect(s.orders.map((o) => o.order)).toContain("cardiovert");
    expect(s.defib.charged).toBe(false);
  });

  it("the dose rule counts a dominant circumflex as the AV nodal artery, as the engine does", () => {
    const lcx = initialPwSession("drift");
    expect(sessionPresetVessel(lcx)).toBe("LCx");
    const item = (s: PwSessionState) => processItems(play(s, { type: "hyperaemia", mode: "ic", doseUg: 150, fast: false })).find((i) => i.id === "ic-dose");
    expect(item(lcx)?.ok).toBe(true);
    expect(item({ ...lcx, dominance: "right" })?.ok).toBe(true);
    expect(item({ ...lcx, dominance: "left" })?.ok).toBe(false);
    expect(item({ ...lcx, dominance: "left" })?.label).toContain("dominant circumflex");
  });

  it("arrhythmias the monitor shows are scored against the orders that followed", () => {
    let s = ready("ic-rca-dose");
    const tick = (rhythm: { kind: string; av: number }, n = 10) => {
      for (let i = 0; i < n; i++) s = pwSessionReducer(s, { type: "tick", dt: 0.1, patient: { rhythm } });
    };
    tick({ kind: "sinus", av: 0 });
    tick({ kind: "sinus", av: 3 });
    s = play(s, { type: "order", order: "cough" });
    tick({ kind: "sinus", av: 3 }, 30);
    tick({ kind: "sinus", av: 0 });
    tick({ kind: "vf", av: 0 });
    s = play(s, { type: "order", order: "charge" });
    tick({ kind: "vf", av: 0 }, MP_DEFIB.chargeTimeS * 10);
    s = play(s, { type: "order", order: "clear" }, { type: "order", order: "shock" });
    tick({ kind: "sinus", av: 0 });
    expect(s.arrhythmias.map((a) => a.kind)).toEqual(["av-block", "vf"]);
    const items = processItems(s);
    expect(items.find((i) => i.id.startsWith("block-"))?.ok).toBe(true);
    expect(items.find((i) => i.id.startsWith("vf-"))?.ok).toBe(true);
    // a shock for adenosine heart block is wrong
    let w = ready("ic-rca-dose");
    w = pwSessionReducer(w, { type: "tick", dt: 0.1, patient: { rhythm: { kind: "sinus", av: 3 } } });
    w = play(w, { type: "order", order: "charge" });
    for (let i = 0; i < MP_DEFIB.chargeTimeS * 10; i++) w = pwSessionReducer(w, { type: "tick", dt: 0.1, patient: { rhythm: { kind: "sinus", av: 3 } } });
    w = play(w, { type: "order", order: "shock" });
    expect(processItems(w).find((i) => i.id.startsWith("block-"))?.ok).toBe(false);
  });

  it("a short heart block watched without an order passes; a long one with no order, or one still running, does not", () => {
    const episode = (seconds: number, end: boolean) => {
      let s = ready("lad-intermediate");
      const tick = (rhythm: { kind: string; av: number }, n: number) => {
        for (let i = 0; i < n; i++) s = pwSessionReducer(s, { type: "tick", dt: 0.1, patient: { rhythm } });
      };
      tick({ kind: "sinus", av: 0 }, 5);
      tick({ kind: "sinus", av: 3 }, Math.round(seconds * 10));
      if (end) tick({ kind: "sinus", av: 0 }, 5);
      return processItems(s).find((i) => i.id.startsWith("block-"))?.ok;
    };
    expect(episode(6, true)).toBe(true);
    expect(episode(MP_BLOCK_SELF_RESOLVE_S + 10, true)).toBe(false);
    expect(episode(6, false)).toBe(false);
  });
});

describe("the hyperaemia presets in the lab's list (HYPERAEMIA_PRESETS_LISTED, now that the rig runs the engine adapter)", () => {
  it("they are in the lab's list and launches exactly when HYPERAEMIA_PRESETS_LISTED, and a session starts from each either way", () => {
    expect(HYPERAEMIA_PRESETS_LISTED).toBe(true);
    const ids = HYPERAEMIA_PRESETS.map((p) => p.id).sort();
    expect(ids).toEqual(["adenosine-vf", "contrast-ffr", "ic-rca-dose", "iv-caffeine", "iv-tissued-line", "saline-swap"]);
    for (const id of ids) {
      expect(PHYSIOLOGY_PRESETS.some((p) => p.id === id), id).toBe(HYPERAEMIA_PRESETS_LISTED);
      expect(PRESET_BY_ID[id] !== undefined, id).toBe(HYPERAEMIA_PRESETS_LISTED);
      expect(physiologyPreset(id)?.id).toBe(id);
      expect(initialPwSession(id).presetId).toBe(id);
    }
  });
});

function sessionPresetVessel(s: PwSessionState): string {
  return physiologyPreset(s.presetId)!.case.vessel;
}
