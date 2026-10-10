import { describe, it, expect } from "vitest";
import { buildAnatomy } from "./anatomy";
import {
  CONUS_OVERSELECTION_THRESHOLDS,
  FIXED_ENGAGEMENT_THRESHOLDS,
  computeTip,
  computeEngagement,
  engagementThresholds,
  initialControls,
  stepDynamics,
} from "./engagement";
import type { ControlState } from "./engagement";
import type { AnatomyModel, Ostium } from "./anatomy";
import type { CatheterType, Difficulty, EngagementKind } from "../types";
import { catheterById } from "../data/catheters";
import { generateCase } from "./caseGenerator";
import { Rng } from "../utils/random";
import { dot } from "../utils/math";

const normalLeftCase = () => generateCase("test-left", { rootSize: "normal", focus: "left" }, "rand");

describe("computeTip", () => {
  it("returns finite geometry", () => {
    const model = buildAnatomy(normalLeftCase());
    const cath = catheterById("JL4")!;
    const tip = computeTip(model, cath, initialControls());
    for (const v of [tip.pos.x, tip.pos.y, tip.pos.z, tip.dir.x, tip.dir.y, tip.dir.z, tip.height, tip.az]) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });

  it("withdrawing raises the tip, advancing lowers it", () => {
    const model = buildAnatomy(normalLeftCase());
    const cath = catheterById("JL4")!;
    const up = computeTip(model, cath, { ...initialControls(), insertion: -4 });
    const down = computeTip(model, cath, { ...initialControls(), insertion: 4 });
    expect(up.height).toBeGreaterThan(down.height);
  });
});

describe("computeEngagement", () => {
  it("a JL4 in a normal root sits nearer the left system than the RCA", () => {
    const model = buildAnatomy(normalLeftCase());
    const cath = catheterById("JL4")!;
    const eng = computeEngagement(model, cath, initialControls(), "beginner");
    expect(eng.distanceToLm).toBeLessThan(eng.distanceToRca);
  });

  it("driving the tip well below the valve plane reads as in-LV", () => {
    const model = buildAnatomy(normalLeftCase());
    const cath = catheterById("JL4")!;
    const eng = computeEngagement(model, cath, { ...initialControls(), insertion: 40 }, "beginner");
    expect(eng.kind).toBe("in-lv");
    expect(eng.isDangerous).toBe(true);
  });

  it("lifting the tip above the sinuses reads as ascending-aorta", () => {
    const model = buildAnatomy(normalLeftCase());
    const cath = catheterById("JL4")!;
    const eng = computeEngagement(model, cath, { ...initialControls(), insertion: -30 }, "beginner");
    expect(eng.kind).toBe("ascending-aorta");
  });
});

describe("conus over-selection", () => {
  it("driving a JR tip up into the conus branch is detected and flagged dangerous", () => {
    const model = buildAnatomy(generateCase("conus", { rootSize: "normal", focus: "right" }, "rand"));
    const cath = catheterById("JR4")!;
    const b = cath.behaviour;
    // solve the controls that place the tip exactly on the conus ostium
    const torque = (model.conus.az - b.naturalAzimuth) / (0.55 + 0.45 * b.torqueResponse);
    const insertion = b.seatHeight - model.conus.height;
    const eng = computeEngagement(model, cath, { ...initialControls(), torque, insertion }, "beginner");
    expect(eng.conus).toBe(true);
    expect(eng.isDangerous).toBe(true);
  });

  it("a normally-seated RCA is NOT flagged as conus", () => {
    const model = buildAnatomy(generateCase("rca-ok", { rootSize: "normal", focus: "right" }, "rand"));
    const cath = catheterById("JR4")!;
    const eng = computeEngagement(model, cath, initialControls(), "beginner");
    expect(eng.conus).toBe(false);
  });
});

describe("stepDynamics (spring lag + wind-up)", () => {
  it("commanded torque reaches the tip with lag (wind-up)", () => {
    const model = buildAnatomy(normalLeftCase());
    const cath = catheterById("JL4")!;
    const controls: ControlState = { ...initialControls(), cmdTorque: 1.0 };
    const step = stepDynamics(controls, cath, model, 0.033);
    // the tip hasn't caught up yet → actual torque < commanded, and windup > 0
    expect(step.controls.torque).toBeGreaterThan(0);
    expect(step.controls.torque).toBeLessThan(1.0);
    expect(step.controls.windup).toBeGreaterThan(0);
  });

  it("sustained over-advance eventually prolapses toward the LV", () => {
    const model = buildAnatomy(normalLeftCase());
    const cath = catheterById("JL4")!;
    let controls: ControlState = initialControls();
    let prolapsedEver = false;
    for (let i = 0; i < 200; i++) {
      controls = { ...controls, cmdInsertion: controls.cmdInsertion + 0.25 };
      const step = stepDynamics(controls, cath, model, 0.033);
      controls = step.controls;
      if (step.prolapsed) prolapsedEver = true;
    }
    const eng = computeEngagement(model, cath, controls, "beginner");
    expect(prolapsedEver || eng.kind === "in-lv").toBe(true);
  });

  it("forward push builds forwardPressure when the tip can't keep up", () => {
    const model = buildAnatomy(normalLeftCase());
    const cath = catheterById("JL4")!;
    const controls: ControlState = { ...initialControls(), cmdInsertion: 6 };
    const step = stepDynamics(controls, cath, model, 0.033);
    expect(step.controls.forwardPressure).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// diag-engagement-fallback: one capture radius and tolerance at every difficulty
// ---------------------------------------------------------------------------

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];

/** Hub controls that put this catheter's tip on an ostium (the analytic tip moves on azimuth and height). */
function aimAt(cath: CatheterType, ost: Ostium): { torque: number; insertion: number } {
  const b = cath.behaviour;
  return { torque: (ost.az - b.naturalAzimuth) / (0.55 + 0.45 * b.torqueResponse), insertion: b.seatHeight - ost.height };
}

interface Pose {
  model: AnatomyModel;
  cath: CatheterType;
  controls: ControlState;
}

/** 200 seeded tip poses: most aimed at an ostium with jitter, some anywhere in the root. */
function seededPoses(n: number): Pose[] {
  const rng = new Rng("diag-engagement-fallback");
  const models = [
    buildAnatomy(generateCase("pose-left", { rootSize: "normal", focus: "left" }, "rand")),
    buildAnatomy(generateCase("pose-right", { rootSize: "normal", focus: "right" }, "rand")),
    buildAnatomy(generateCase("pose-small", { rootSize: "small", focus: "left" }, "rand")),
    buildAnatomy(generateCase("pose-large", { rootSize: "dilated", focus: "right" }, "rand")),
  ];
  const caths = ["JL4", "JL3.5", "JL5", "JR4", "AL1", "AR", "TIG", "EBU3.5"].map((id) => catheterById(id)!).filter(Boolean);
  const poses: Pose[] = [];
  for (let i = 0; i < n; i++) {
    const model = rng.pick(models);
    const cath = rng.pick(caths);
    const mode = rng.next();
    let torque: number;
    let insertion: number;
    if (mode < 0.8) {
      const ost = rng.pick([model.lm, model.rca, model.conus]);
      const aim = aimAt(cath, ost);
      torque = aim.torque + rng.range(-0.35, 0.35);
      insertion = aim.insertion + rng.range(-5, 5);
    } else {
      torque = rng.range(-3, 3);
      insertion = rng.range(-14, 30);
    }
    poses.push({ model, cath, controls: { ...initialControls(), torque, insertion, cmdTorque: torque, cmdInsertion: insertion } });
  }
  return poses;
}

describe("difficulty-free engagement (diag-engagement-fallback)", () => {
  it("with physics off, engagement uses difficultyScaled false by default and the 'advanced' row is the single fixed set", () => {
    const advancedRow = engagementThresholds("advanced", { difficultyScaled: true });
    expect(FIXED_ENGAGEMENT_THRESHOLDS).toEqual(advancedRow);
    for (const d of DIFFICULTIES) {
      expect(engagementThresholds(d)).toBe(FIXED_ENGAGEMENT_THRESHOLDS);
      expect(engagementThresholds(d, {})).toBe(FIXED_ENGAGEMENT_THRESHOLDS);
      expect(engagementThresholds(d, { difficultyScaled: false })).toBe(FIXED_ENGAGEMENT_THRESHOLDS);
    }
    expect(Object.isFrozen(FIXED_ENGAGEMENT_THRESHOLDS)).toBe(true);
    // the default call and the explicit false option give the same state as the advanced row
    for (const p of seededPoses(40)) {
      const byDefault = computeEngagement(p.model, p.cath, p.controls, "beginner");
      expect(computeEngagement(p.model, p.cath, p.controls, "beginner", { difficultyScaled: false })).toEqual(byDefault);
      // apart from the conus check (its own fixed tolerance), this is the scaled 'advanced' row
      if (!byDefault.conus) {
        const scaledAdvanced = computeEngagement(p.model, p.cath, p.controls, "advanced", { difficultyScaled: true });
        if (!scaledAdvanced.conus) expect(byDefault).toEqual(scaledAdvanced);
      }
    }
  });

  it("the scaled behaviour is reachable only through { difficultyScaled: true }", () => {
    const scaledBeginner = engagementThresholds("beginner", { difficultyScaled: true });
    expect(scaledBeginner.selDist).toBeGreaterThan(FIXED_ENGAGEMENT_THRESHOLDS.selDist);
    expect(scaledBeginner.nearDist).toBeGreaterThan(FIXED_ENGAGEMENT_THRESHOLDS.nearDist);
    expect(engagementThresholds("intermediate", { difficultyScaled: true })).not.toEqual(FIXED_ENGAGEMENT_THRESHOLDS);
    // some pose that the old beginner radius captured is not captured now
    let differs = 0;
    for (const p of seededPoses(200)) {
      const fixed = computeEngagement(p.model, p.cath, p.controls, "beginner");
      const scaled = computeEngagement(p.model, p.cath, p.controls, "beginner", { difficultyScaled: true });
      if (fixed.kind !== scaled.kind) differs++;
    }
    expect(differs).toBeGreaterThan(0);
  });

  it("beginner and advanced difficulty give identical engagement classification for the same tip pose across 200 seeded poses", () => {
    const poses = seededPoses(200);
    expect(poses).toHaveLength(200);
    const kinds = new Set<EngagementKind>();
    let scaledDiffers = 0;
    for (const p of poses) {
      const beginner = computeEngagement(p.model, p.cath, p.controls, "beginner");
      const intermediate = computeEngagement(p.model, p.cath, p.controls, "intermediate");
      const advanced = computeEngagement(p.model, p.cath, p.controls, "advanced");
      expect(beginner).toEqual(advanced);
      expect(intermediate).toEqual(advanced);
      kinds.add(advanced.kind);
      const sb = computeEngagement(p.model, p.cath, p.controls, "beginner", { difficultyScaled: true });
      const sa = computeEngagement(p.model, p.cath, p.controls, "advanced", { difficultyScaled: true });
      if (sb.kind !== sa.kind) scaledDiffers++;
    }
    // the poses cover the classes that matter, so the comparison is not vacuous
    for (const k of ["selective-lm", "selective-rca", "non-selective"] as EngagementKind[]) expect(kinds.has(k), k).toBe(true);
    expect([...kinds].some((k) => k.startsWith("coaxial-") || k.startsWith("near-"))).toBe(true);
    // and under the legacy scaling the same poses would have been classified differently
    expect(scaledDiffers).toBeGreaterThan(0);
  });

  it("conus over-selection stays reachable with its own fixed tolerance, the same at every difficulty", () => {
    expect(Object.isFrozen(CONUS_OVERSELECTION_THRESHOLDS)).toBe(true);
    const model = buildAnatomy(generateCase("conus", { rootSize: "normal", focus: "right" }, "rand"));
    const cath = catheterById("JR4")!;
    const controls = { ...initialControls(), ...aimAt(cath, model.conus) };
    const states = DIFFICULTIES.map((d) => computeEngagement(model, cath, controls, d));
    for (const e of states) {
      expect(e.conus).toBe(true);
      expect(e.isDangerous).toBe(true);
      expect(e).toEqual(states[0]);
    }
    // judged against the coronary capture alignment instead, this conus pose would not count
    const tip = computeTip(model, cath, controls);
    expect(dot(tip.dir, model.conus.dir)).toBeLessThan(FIXED_ENGAGEMENT_THRESHOLDS.alignSel);
    expect(dot(tip.dir, model.conus.dir)).toBeGreaterThan(CONUS_OVERSELECTION_THRESHOLDS.alignSel);
  });

  it("rejects an unknown difficulty when scaling is asked for", () => {
    expect(() => engagementThresholds("expert" as Difficulty, { difficultyScaled: true })).toThrow(/unknown difficulty/);
  });
});
