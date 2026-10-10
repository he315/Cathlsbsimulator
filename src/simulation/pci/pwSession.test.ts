// The pressure-wire session (physiology-engine-unify-and-setup): set-up steps and faults, the
// equalisation window and drift, and the console's agreement with physiology.ts at equal MAP.
//   npx vitest run src/simulation/pci/pwSession.test.ts
import { describe, expect, it } from "vitest";
import { CUTOFF, PHYSIOLOGY_CASES, indices } from "../physiology";
import { measure } from "./pressureWire";
import {
  MP_MISMATCH_RMS_MMHG,
  PHYSIOLOGY_PRESETS,
  PRESET_BY_ID,
  aorticLine,
  consoleReading,
  guidePressure,
  hyperaemia,
  initialPwSession,
  lastMeasurement,
  processItems,
  pwSessionReducer,
  scorePwSession,
  sensorX,
  sessionCase,
  waveformMismatch,
  waveformRms,
  type PwAction,
  type PwSessionState,
} from "./pwSession";

const play = (s: PwSessionState, ...as: PwAction[]) => as.reduce(pwSessionReducer, s);
const wait = (s: PwSessionState, seconds: number, map?: number) => {
  let n = s;
  for (let i = 0; i < seconds * 10; i++) n = pwSessionReducer(n, { type: "tick", dt: 0.1, patient: map === undefined ? undefined : { map } });
  return n;
};
/** Steps 1-3 done properly from the packet: zero, introduce, sensor to the tip, introducer out, flush. */
const SETUP: PwAction[] = [{ type: "zero" }, { type: "introduce" }, { type: "sensor", mm: 0 }, { type: "remove-introducer" }, { type: "flush-guide" }];
/** ... with a drift-free wire, so a test isolates what it is about. */
const still = (s: PwSessionState): PwSessionState => ({ ...s, wire: { ...s.wire, driftPerS: 0 } });

describe("equalisation window and drift (acceptance)", () => {
  it("equalising with the sensor 10 mm in leaves an offset and the drift check fails; equalising at the tip passes", () => {
    const base = still(initialPwSession("fault-deep-equalise", "t1"));
    expect(base.sensorMm).toBe(10);
    // the sensor parked 10 mm in, beyond the short proximal lesion
    const deep = play(base, { type: "equalise" });
    expect(deep.eq?.atTip).toBe(false);
    const deepChk = play(deep, { type: "sensor", mm: 0 }, { type: "drift-check" });
    expect(deepChk.driftCheck?.ok).toBe(false);
    expect(deepChk.driftCheck!.pdpa).toBeGreaterThan(1 + CUTOFF.drift);
    // the offset left behind: Pd at the guide tip reads above Pa
    const r = consoleReading(deepChk);
    expect(r.pd - r.pa).toBeGreaterThan(CUTOFF.drift * r.pa);
    // pulled back to the guide tip first: the drift check passes
    const tip = play(base, { type: "sensor", mm: 0 }, { type: "equalise" });
    expect(tip.eq?.atTip).toBe(true);
    const tipChk = play(wait(tip, 5), { type: "drift-check" });
    expect(tipChk.driftCheck?.ok).toBe(true);
    expect(Math.abs(tipChk.driftCheck!.pdpa - 1)).toBeLessThanOrEqual(CUTOFF.drift);
    // the debrief names it
    expect(processItems(deep).find((i) => i.id === "equalise-at-tip")?.ok).toBe(false);
    expect(processItems(tip).find((i) => i.id === "equalise-at-tip")?.ok).toBe(true);
  });

  it("drift accumulates from the wire's drift rate and is caught at the guide tip", () => {
    let s = play(initialPwSession("drift", "d"), ...SETUP, { type: "equalise" });
    expect(s.wire.driftPerS).toBeCloseTo(4 / 45, 6);
    expect(play(s, { type: "drift-check" }).driftCheck?.ok).toBe(true);
    s = wait(s, 60);
    const chk = play(s, { type: "drift-check" });
    expect(chk.driftCheck?.ok).toBe(false);
    // re-equalising at the tip clears it
    expect(play(chk, { type: "equalise" }, { type: "drift-check" }).driftCheck?.ok).toBe(true);
  });

  it("the drift case's drift stops at the case's own drift (the cap the lab has always used), and starts again after equalising", () => {
    const p = PRESET_BY_ID["drift"];
    expect(p.driftCapMmHg).toBe(Math.abs(p.case.drift!));
    const s = play(initialPwSession("drift", "cap"), ...SETUP, { type: "equalise" });
    const o0 = s.wire.offset;
    expect(wait(s, 20).wire.offset - o0).toBeCloseTo((20 * p.case.drift!) / 45, 1);
    const late = wait(s, 180);
    expect(late.wire.offset - o0).toBeCloseTo(p.driftCapMmHg!, 6);
    const re = play(late, { type: "equalise" });
    expect(wait(re, 10).wire.offset - re.wire.offset).toBeCloseTo((10 * p.case.drift!) / 45, 1);
    // a new wire draws its own drift, without the preset's cap
    expect(play(late, { type: "new-wire" }).wire.driftPerS).not.toBeCloseTo(p.driftPerS!, 6);
  });

  it("the drift check is refused away from the guide tip and during hyperaemia", () => {
    const s = play(initialPwSession("lad-intermediate", "x"), ...SETUP, { type: "equalise" }, { type: "sensor", mm: 80 });
    expect(play(s, { type: "drift-check" }).driftCheck).toBeNull();
    const hy = wait(play(s, { type: "sensor", mm: 0 }, { type: "hyperaemia", mode: "iv" }), 10);
    expect(play(hy, { type: "drift-check" }).driftCheck).toBeNull();
  });
});

describe("waveform faults (acceptance)", () => {
  it("'fault-offset-waveforms': mean Pd equals mean Pa but the mismatch flag is set and an FFR recorded is invalid", () => {
    let s = still(initialPwSession("fault-offset-waveforms", "w"));
    s = play(s, { type: "equalise" });
    const r = consoleReading(s);
    expect(r.pd).toBeCloseTo(r.pa, 6);
    expect(r.pdpa).toBeCloseTo(1, 6);
    expect(waveformMismatch(s)).toBe(true);
    expect(s.eq?.mismatch).toBe(true);
    expect(waveformRms(s)).toBeGreaterThan(MP_MISMATCH_RMS_MMHG);
    s = wait(play(s, { type: "sensor", mm: 100 }, { type: "hyperaemia", mode: "iv" }), 25);
    s = play(s, { type: "measure-ffr" });
    const ffr = lastMeasurement(s)!;
    expect(ffr.kind).toBe("ffr");
    expect(ffr.valid).toBe(false);
    expect(ffr.problems.join(" ")).toMatch(/waveforms/);
    // the remedy: a new wire, zeroed outside the body, equalised at the tip
    let fixed = play(s, { type: "hyperaemia", mode: "none" }, { type: "new-wire" }, ...SETUP.filter((a) => a.type !== "flush-guide"));
    fixed = still(fixed);
    fixed = play(fixed, { type: "equalise" });
    expect(waveformMismatch(fixed)).toBe(false);
    fixed = wait(play(fixed, { type: "sensor", mm: 100 }, { type: "hyperaemia", mode: "iv" }), 25);
    fixed = play(fixed, { type: "measure-ffr" });
    expect(lastMeasurement(fixed)?.valid).toBe(true);
    expect(processItems(fixed).find((i) => i.id === "wire-changed")?.ok).toBe(true);
  });

  it("with air in the aortic line the verdict is overdamped and the pressure context is damped; flushing the line clears both", () => {
    const s = initialPwSession("fault-air-aortic", "a");
    expect(aorticLine(s).dynamic.verdict).toBe("overdamped");
    expect(guidePressure(s)).toBe("damped");
    expect(waveformMismatch(s)).toBe(true);
    const flushed = play(s, { type: "flush-aortic-line" });
    expect(aorticLine(flushed).dynamic.verdict).not.toBe("overdamped");
    expect(guidePressure(flushed)).toBe("aortic");
    expect(waveformMismatch(flushed)).toBe(false);
  });

  it("contrast in the guide and a retained introducer damp the guide trace; their remedies clear it", () => {
    const c = initialPwSession("fault-contrast", "c");
    expect(aorticLine(c).dynamic.verdict).toBe("overdamped");
    expect(waveformMismatch(c)).toBe(true);
    expect(waveformMismatch(play(c, { type: "flush-guide" }))).toBe(false);
    const i = initialPwSession("fault-introducer", "i");
    expect(aorticLine(i).leakMmHg).toBeGreaterThan(0);
    expect(guidePressure(i)).toBe("damped");
    expect(waveformMismatch(i)).toBe(true);
    const out = play(i, { type: "remove-introducer" });
    expect(waveformMismatch(out)).toBe(false);
    expect(guidePressure(out)).toBe("aortic");
  });

  it("equalising with the introducer in matches the means, then reads low once it is out (the leak was cancelled)", () => {
    const s = still(play(initialPwSession("fault-introducer", "i2"), { type: "equalise" }));
    expect(consoleReading(s).pdpa).toBeCloseTo(1, 6);
    const out = play(s, { type: "remove-introducer" });
    expect(consoleReading(out).pdpa).toBeLessThan(1 - CUTOFF.drift);
  });

  it("a properly set-up study from the packet: the waveforms superimpose at the tip, the FFR is valid", () => {
    let s = still(play(initialPwSession("lad-intermediate", "ok"), ...SETUP));
    expect(waveformMismatch(s)).toBe(false);
    s = play(s, { type: "equalise" });
    expect(s.eq).toMatchObject({ atTip: true, mismatch: false, introducer: false, contrast: false, air: false });
    s = wait(play(s, { type: "sensor", mm: 100 }, { type: "hyperaemia", mode: "iv" }), 25);
    expect(hyperaemia(s)).toBe(1);
    s = play(s, { type: "measure-ffr" });
    const m = lastMeasurement(s)!;
    expect(m.valid).toBe(true);
    expect(m.pdpa).toBeLessThan(CUTOFF.ffr);
    s = play(wait(play(s, { type: "hyperaemia", mode: "none" }), 1), { type: "sensor", mm: 0 }, { type: "drift-check" }, { type: "decide", id: "treat" });
    const sc = scorePwSession(s);
    expect(sc.decisionCorrect).toBe(true);
    expect(sc.passed).toBe(true);
    expect(sc.score).toBe(100);
  });
});

describe("the other set-up faults", () => {
  it("'fault-no-zero': the wire will not zero until the connections are checked; the console refuses to equalise an unzeroed wire", () => {
    let s = initialPwSession("fault-no-zero", "z");
    s = play(s, { type: "zero" });
    expect(s.zeroed).toBe(false);
    expect(s.log[0]).toMatchObject({ label: "Zero", value: "failed" });
    const unzeroed = play(s, { type: "introduce" }, { type: "sensor", mm: 0 }, { type: "equalise" });
    expect(unzeroed.eq).toBeNull();
    expect(unzeroed.log[0].value).toBe("refused");
    // zeroing with the wire in the guide takes it out again, and the debrief records it
    const inBody = play(unzeroed, { type: "check-connections" }, { type: "zero" });
    expect(inBody.wireIn).toBe(false);
    expect(processItems(play(inBody, { type: "zero" })).find((i) => i.id === "zero-outside")?.ok).toBe(false);
    // the right order passes
    s = play(s, { type: "check-connections" }, { type: "zero" });
    expect(s.zeroed).toBe(true);
    expect(processItems(play(s, { type: "introduce" })).find((i) => i.id === "zero-outside")?.ok).toBe(true);
  });

  it("'fault-ebu-lcx': past the left main the wire enters the circumflex and reads no gradient; only a guide change fixes it", () => {
    let s = still(play(initialPwSession("fault-ebu-lcx", "e"), ...SETUP));
    expect(s.branch).toBe("side");
    expect(s.raised["wire-side-branch"]).toBeDefined();
    s = play(s, { type: "equalise" }, { type: "sensor", mm: 100 });
    expect(consoleReading(s, { h: 1 }).pdpa).toBeGreaterThan(0.95);
    // pulling back and reshaping does not help: the guide keeps steering the wire into the circumflex
    s = play(s, { type: "sensor", mm: -25 }, { type: "reshape-wire" }, { type: "sensor", mm: 0 });
    expect(s.branch).toBe("side");
    s = play(s, { type: "change-guide" });
    expect(s.wireIn).toBe(false);
    s = play(s, { type: "introduce" }, { type: "sensor", mm: 0 });
    expect(s.branch).toBe("target");
    s = play(s, { type: "remove-introducer" }, { type: "flush-guide" }, { type: "equalise" }, { type: "sensor", mm: 100 });
    expect(consoleReading(s, { h: 1 }).pdpa).toBeLessThan(CUTOFF.ffr);
    expect(processItems(s).find((i) => i.id === "guide-changed")?.ok).toBe(true);
  });

  it("'fault-wire-deformed': a wire pushed past the balloon in the guide will not cross; it cannot be reshaped, a new wire can", () => {
    let s = play(initialPwSession("fault-wire-deformed", "b"), ...SETUP, { type: "equalise" }, { type: "sensor", mm: 100 });
    expect(s.wireDeformed).toBe(true);
    const c = sessionCase(s);
    const lesionStart = (c.lesions[0].pos - c.lesions[0].lengthMm / c.lengthMm / 2) * c.lengthMm;
    expect(s.sensorMm + 30).toBeLessThanOrEqual(lesionStart + 1e-9);
    expect(s.raised["wire-not-crossing"]).toBeDefined();
    expect(play(s, { type: "reshape-wire" }).log[0].value).toBe("cannot be reshaped");
    s = play(s, { type: "new-wire" }, { type: "remove-device" }, ...SETUP, { type: "equalise" }, { type: "sensor", mm: 100 });
    expect(s.wireDeformed).toBe(false);
    expect(s.sensorMm).toBe(100);
  });

  it("the deeply seated guide reads damped while engaged, aortic once disengaged, and raises the FFR", () => {
    let s = still(play(initialPwSession("guide-wedge", "g"), ...SETUP, { type: "equalise" }));
    expect(["damped", "ventricularised", "wedged"]).toContain(guidePressure(s));
    expect(guidePressure(play(s, { type: "guide", engaged: false }))).toBe("aortic");
    s = wait(play(s, { type: "sensor", mm: 100 }, { type: "hyperaemia", mode: "iv" }), 25);
    const engaged = consoleReading(s).pdpa;
    const off = consoleReading(play(s, { type: "guide", engaged: false })).pdpa;
    expect(engaged).toBeGreaterThan(off);
  });
});

describe("the console agrees with physiology.ts (acceptance: physiology.test.ts values unchanged at equal MAP)", () => {
  it("for every teaching case at its own MAP, with no set-up error, the console reads physiology.indices exactly", () => {
    for (const c of PHYSIOLOGY_CASES) {
      let s = play(initialPwSession(c.id, "eq"), ...SETUP);
      s = { ...s, map: c.map, wire: { ...s.wire, offset: 0 } };
      for (const x of [0, 0.5, 1]) for (const h of [0, 1]) {
        const want = indices(c, x, h, true, 0);
        const got = consoleReading(s, { x, h });
        expect(got.pdpa, `${c.id} x=${x} h=${h}`).toBe(want.pdpa);
        expect(got.wfp, `${c.id} x=${x} h=${h}`).toBe(want.wfpRatio);
      }
      // and with the guide disengaged
      const off = { ...s, guideEngaged: false };
      expect(consoleReading(off, { x: 1, h: 1 }).pdpa).toBe(indices(c, 1, 1, false, 0).pdpa);
    }
  });

  it("the patient's MAP from the engine is fed into the case each step", () => {
    const s = wait(initialPwSession("lad-intermediate", "m"), 1, 100.3);
    expect(s.map).toBe(100.5);
    expect(sessionCase(s).map).toBe(100.5);
    expect(PRESET_BY_ID["lad-intermediate"].case.map).toBe(92);
  });

  it("pressureWire.measure is unchanged without channel errors (the PCI lab's numbers)", () => {
    const c = PHYSIOLOGY_CASES[0];
    const a = measure(c, 0.8, 1, 1.5);
    const b = measure(c, 0.8, 1, 1.5, true, {});
    expect(b).toEqual(a);
  });
});

describe("presets, pullback and scoring", () => {
  it("there is a preset for each PHYSIOLOGY_CASES id and for each set-up fault", () => {
    const ids = PHYSIOLOGY_PRESETS.map((p) => p.id);
    for (const c of PHYSIOLOGY_CASES) expect(ids).toContain(c.id);
    for (const f of ["fault-no-zero", "fault-introducer", "fault-contrast", "fault-air-aortic", "fault-deep-equalise", "fault-offset-waveforms", "fault-ebu-lcx", "fault-wire-deformed"]) expect(ids).toContain(f);
    expect(new Set(ids).size).toBe(ids.length);
    // titles do not name the pitfall
    for (const p of PHYSIOLOGY_PRESETS) expect(p.title, p.id).not.toMatch(/pitfall|drift|wedge|air|contrast|introducer|zero|deform|offset|circumflex/i);
  });

  it("a hyperaemic pullback on the model clock runs back to the guide tip and records the curve", () => {
    let s = still(play(initialPwSession("tandem", "p"), ...SETUP, { type: "equalise" }, { type: "sensor", mm: 110 }, { type: "hyperaemia", mode: "iv" }));
    s = wait(s, 25);
    s = play(s, { type: "pullback" });
    expect(s.pullback?.active).toBe(true);
    s = wait(s, 10);
    expect(s.pullback?.active).toBe(false);
    expect(s.sensorMm).toBe(0);
    const pts = s.pullback!.pts;
    expect(pts.length).toBeGreaterThan(50);
    expect(pts[0].ratio).toBeLessThan(pts[pts.length - 1].ratio);
    expect(pts[pts.length - 1].x).toBe(0);
    expect(sensorX(s)).toBe(0);
    // the pullback ends at the guide tip by design: its record is not "not distal", and valid matches its problems
    const rec = s.records.find((r) => r.kind === "pullback")!;
    expect(rec.problems).not.toContain("the sensor is not distal to every lesion");
    expect(rec.problems).toEqual([]);
    expect(rec.valid).toBe(true);
    // a pullback on a set-up with contrast still in the guide is recorded, and not valid
    let bad = still(play(initialPwSession("tandem", "p2"), { type: "zero" }, { type: "introduce" }, { type: "sensor", mm: 0 }, { type: "remove-introducer" }, { type: "equalise" }, { type: "sensor", mm: 110 }, { type: "hyperaemia", mode: "iv" }));
    bad = wait(play(wait(bad, 25), { type: "pullback" }), 10);
    const badRec = bad.records.find((r) => r.kind === "pullback")!;
    expect(badRec.problems).toContain("contrast in the guide");
    expect(badRec.valid).toBe(false);
  });

  it("a refused action is not ticked as done: the introducer cannot be removed before the wire is in, and goes back in with it", () => {
    let s = play(initialPwSession("lad-intermediate", "tick"), { type: "remove-introducer" });
    expect(s.log[0]).toMatchObject({ label: "Introducer", value: "no wire in the guide", bad: true });
    expect(s.did).not.toContain("remove-introducer");
    s = play(s, { type: "zero" }, { type: "introduce" });
    expect(s.introducer).toBe(true);
    expect(s.did).not.toContain("remove-introducer");
    s = play(s, { type: "remove-introducer" });
    expect(s.introducer).toBe(false);
    expect(s.did).toContain("remove-introducer");
    // a second press is refused (not in the valve) and the tick stays
    expect(play(s, { type: "remove-introducer" }).did).toContain("remove-introducer");
    // a ticked removal from an earlier introduction does not survive a new one
    const viaState = play({ ...s, wireIn: false }, { type: "introduce" });
    expect(viaState.introducer).toBe(true);
    expect(viaState.did).not.toContain("remove-introducer");
    // an equalise refused (wire not zeroed) is not ticked either
    const unz = play(initialPwSession("lad-intermediate", "tick2"), { type: "introduce" }, { type: "equalise" });
    expect(unz.eq).toBeNull();
    expect(unz.did).not.toContain("equalise");
  });

  it("the reducer does not mutate its input (replayable from the same actions)", () => {
    const s0 = initialPwSession("fault-no-zero", "pure");
    const snap = JSON.stringify(s0);
    const a = play(s0, { type: "check-connections" }, { type: "zero" }, { type: "new-wire" }, { type: "zero" });
    expect(JSON.stringify(s0)).toBe(snap);
    const b = play(s0, { type: "check-connections" }, { type: "zero" }, { type: "new-wire" }, { type: "zero" });
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
  });
});
