// The left main and aorto-ostial presets in the pressure-wire session (physiology-left-main-and-ostial):
// registered with their own titles and case properties, a branch selector that steers the wire into the
// LAD or the circumflex, the console reading the path into the chosen branch exactly as physiology.ts
// does, the branch of each measurement and pullback kept, and the decisions the case also accepts.
//   npx vitest run src/simulation/pci/pwSession.leftMain.test.ts
import { describe, expect, it } from "vitest";
import { CUTOFF, LEFT_MAIN_PRESETS, ffr, indices, presetView } from "../physiology";
import {
  LEFT_MAIN_PW_PRESETS,
  PHYSIOLOGY_PRESETS,
  PRESET_BY_ID,
  SENSOR_FROM_TIP_MM,
  consoleReading,
  decisionAccepted,
  guidePressure,
  initialPwSession,
  lastMeasurement,
  pathCase,
  presetLesions,
  processItems,
  pwSessionReducer,
  scorePwSession,
  sensorX,
  sessionCase,
  type PwAction,
  type PwSessionState,
} from "./pwSession";

const play = (s: PwSessionState, ...as: PwAction[]) => as.reduce(pwSessionReducer, s);
const wait = (s: PwSessionState, seconds: number) => {
  let n = s;
  for (let i = 0; i < seconds * 10; i++) n = pwSessionReducer(n, { type: "tick", dt: 0.1 });
  return n;
};
const SETUP: PwAction[] = [{ type: "zero" }, { type: "introduce" }, { type: "sensor", mm: 0 }, { type: "remove-introducer" }, { type: "flush-guide" }, { type: "equalise" }];
/** A clean study with a drift-free wire, equalised at the guide tip. */
const ready = (id: string, seed = "lm"): PwSessionState => {
  const s0 = initialPwSession(id, seed);
  return play({ ...s0, wire: { ...s0.wire, driftPerS: 0 } }, ...SETUP);
};
/** The sensor to the distal end of the path it is on, IV adenosine to steady state, FFR. */
const ffrDistal = (s: PwSessionState) => play(wait(play(s, { type: "sensor", mm: pathCase(s).lengthMm }, { type: "hyperaemia", mode: "iv" }), 25), { type: "measure-ffr" });

describe("registration", () => {
  it("every left main and aorto-ostial preset is a lab preset with its own title, brief and case properties, opened by its id", () => {
    expect(LEFT_MAIN_PW_PRESETS.map((p) => p.id)).toEqual(LEFT_MAIN_PRESETS.map((p) => p.id));
    for (const lp of LEFT_MAIN_PRESETS) {
      const p = PRESET_BY_ID[lp.id];
      expect(p, lp.id).toBeDefined();
      expect(PHYSIOLOGY_PRESETS).toContain(p);
      expect(p.title).toBe(lp.title);
      expect(p.brief).toBe(lp.brief);
      expect(p.events).toEqual(lp.events);
      expect(p.start).toBe("packet");
      expect(p.faults).toEqual([]);
      const s = initialPwSession(lp.id);
      expect(s.presetId).toBe(lp.id);
      // the model's default branch (the circumflex for the jailed presets), none for the unbranched RCA
      expect(s.lmBranch).toBe(lp.model ? (lp.model.defaultBranch ?? "LAD") : null);
    }
    expect(initialPwSession("lm-jailed-lcx-075").lmBranch).toBe("LCx");
    expect(initialPwSession("ostial-rca-engaged").lmBranch).toBeNull();
  });

  it("the stentable lesions of a branched preset are those of the left main and of both branches", () => {
    expect(presetLesions(PRESET_BY_ID["lm-masked-by-lad"]).map((l) => l.id)).toEqual(["lm", "lad-proximal"]);
    expect(presetLesions(PRESET_BY_ID["lm-ostial-lcx"]).map((l) => l.id)).toEqual(["lm", "lcx-ostium"]);
    expect(presetLesions(PRESET_BY_ID["lad-intermediate"]).map((l) => l.id)).toEqual(PRESET_BY_ID["lad-intermediate"].case.lesions.map((l) => l.id));
  });
});

describe("the branch selector", () => {
  it("the session reads the path into the chosen branch; the console agrees with physiology.ts in each branch", () => {
    let s = ready("lm-significant");
    expect(sessionCase(s).id).toBe("lm-significant:LAD");
    s = ffrDistal(s);
    const lad = lastMeasurement(s)!;
    expect(lad.valid).toBe(true);
    expect(lad.branch).toBe("LAD");
    expect(lad.pdpa).toBeCloseTo(ffr(presetView(LEFT_MAIN_PRESETS[0], "LAD")), 2);
    // into the circumflex: the wire comes back to the left main first, the equalisation stands
    s = play(s, { type: "hyperaemia", mode: "none" });
    const before = s.eq;
    s = play(s, { type: "branch", id: "LCx" });
    expect(s.lmBranch).toBe("LCx");
    expect(s.sensorMm).toBe(10 - SENSOR_FROM_TIP_MM);
    expect(s.eq).toBe(before);
    expect(sessionCase(s).id).toBe("lm-significant:LCx");
    expect(sensorX(s)).toBe(0);
    s = ffrDistal(wait(s, 30));
    const lcx = lastMeasurement(s)!;
    expect(lcx.valid).toBe(true);
    expect(lcx.branch).toBe("LCx");
    expect(lcx.pdpa).toBeCloseTo(ffr(presetView(LEFT_MAIN_PRESETS[0], "LCx")), 2);
    // a significant left main lowers both branches
    expect(lad.pdpa).toBeLessThanOrEqual(CUTOFF.ffr);
    expect(lcx.pdpa).toBeLessThanOrEqual(CUTOFF.ffr);
    expect(processItems(s).find((i) => i.id === "both-branches")?.ok).toBe(true);
  });

  it("at the patient's MAP the console reads physiology.indices of the branch view at that MAP", () => {
    let s = play(ready("lm-intermediate"), { type: "branch", id: "LCx" }, { type: "sensor", mm: 60 });
    s = pwSessionReducer(s, { type: "tick", dt: 0.1, patient: { map: 84 } });
    expect(sessionCase(s).map).toBe(84);
    const want = indices({ ...presetView(PRESET_BY_ID["lm-intermediate"].leftMain!, "LCx"), map: 84 }, sensorX(s), 0, true, 0);
    expect(consoleReading(s).pdpa).toBeCloseTo(want.pdpa, 3);
  });

  it("one branch measured is not both: the debrief item stays open, and is not asked where imaging is the answer or for the jailed circumflex", () => {
    const s = ffrDistal(ready("lm-intermediate"));
    expect(processItems(s).find((i) => i.id === "both-branches")).toMatchObject({ ok: false, lessonId: "pm-physiology-subsets" });
    expect(processItems(initialPwSession("lm-high-ra")).some((i) => i.id === "both-branches")).toBe(false);
    expect(processItems(initialPwSession("lm-jailed-lcx-075")).some((i) => i.id === "both-branches")).toBe(false);
    expect(processItems(initialPwSession("ostial-rca-engaged")).some((i) => i.id === "both-branches")).toBe(false);
  });

  it("steering is refused while a pullback runs; each branch keeps its last pullback; an unknown branch or an unbranched preset changes nothing", () => {
    let s = play(wait(play(ready("lm-ostial-lcx"), { type: "sensor", mm: 100 }, { type: "hyperaemia", mode: "iv" }), 25), { type: "pullback" });
    expect(s.pullback?.active).toBe(true);
    const refused = play(s, { type: "branch", id: "LCx" });
    expect(refused.lmBranch).toBe("LAD");
    expect(refused.log[0].bad).toBe(true);
    s = wait(s, 10);
    expect(s.pullback?.active).toBe(false);
    expect(s.branchPullbacks.LAD?.pts.length).toBeGreaterThan(5);
    s = play(s, { type: "branch", id: "LCx" }, { type: "sensor", mm: 90 });
    s = play(wait(s, 1), { type: "pullback" });
    s = wait(s, 10);
    expect(s.branchPullbacks.LCx?.pts.length).toBeGreaterThan(5);
    // the LAD is normal with no step; the circumflex loses its pressure at its own ostium
    const drop = (pts: { ratio: number }[]) => Math.max(...pts.map((p) => p.ratio)) - Math.min(...pts.map((p) => p.ratio));
    expect(drop(s.branchPullbacks.LAD!.pts)).toBeLessThan(0.06);
    expect(drop(s.branchPullbacks.LCx!.pts)).toBeGreaterThan(0.1);
    expect(s.records.filter((r) => r.kind === "pullback").map((r) => r.branch)).toEqual(["LAD", "LCx"]);
    expect(play(s, { type: "branch", id: "RCA" })).toBe(s);
    const rca = initialPwSession("ostial-rca-engaged");
    expect(play(rca, { type: "branch", id: "LAD" })).toBe(rca);
    // stenting clears the pullbacks with the records
    expect(play(s, { type: "stent", lesionId: "lcx-ostium" }).branchPullbacks).toEqual({});
  });
});

describe("masking, ostial damping and the decision", () => {
  it("'lm-masked-by-lad': the circumflex FFR falls once the LAD lesion is stented; treating first and re-measuring is accepted", () => {
    let s = ffrDistal(play(ready("lm-masked-by-lad"), { type: "branch", id: "LCx" }));
    const before = lastMeasurement(s)!.pdpa;
    expect(before).toBeGreaterThan(CUTOFF.ffr);
    s = play(s, { type: "decide", id: "treat-first-then-remeasure" });
    expect(scorePwSession(s).decisionCorrect).toBe(true);
    s = play(s, { type: "hyperaemia", mode: "none" }, { type: "stent", lesionId: "lad-proximal" });
    s = ffrDistal(wait(s, 5));
    const after = lastMeasurement(s)!.pdpa;
    expect(after).toBeLessThan(before);
    expect(after).toBeLessThanOrEqual(CUTOFF.ffr);
    // imaging is the preset's decision; a plain "treat" is not accepted
    const p = PRESET_BY_ID["lm-masked-by-lad"];
    expect(decisionAccepted(p, "imaging")).toBe(true);
    expect(decisionAccepted(p, "treat")).toBe(false);
    expect(decisionAccepted(p, null)).toBe(false);
  });

  it("'ostial-lm-damped': the seated guide damps the trace and reads the FFR high; disengaged, it reads true and the debrief asks for it", () => {
    const s0 = ready("ostial-lm-damped");
    expect(["damped", "ventricularised"]).toContain(guidePressure(s0));
    expect(guidePressure(play(s0, { type: "guide", engaged: false }))).toBe("aortic");
    const seated = lastMeasurement(ffrDistal(s0))!;
    expect(seated.problems).toContain("the guide damps the aortic pressure while engaged");
    const off = ffrDistal(play(s0, { type: "guide", engaged: false }));
    expect(lastMeasurement(off)!.valid).toBe(true);
    expect(seated.pdpa - lastMeasurement(off)!.pdpa).toBeGreaterThan(0.02);
    expect(processItems(off).find((i) => i.id === "disengaged")?.ok).toBe(true);
  });
});
