import { describe, it, expect } from "vitest";
import { computePressure, shapeAt } from "./pressure";
import type { PressureKind } from "../types";
import { buildAnatomy } from "./anatomy";
import { computeTip, computeEngagement, initialControls } from "./engagement";
import { catheterById } from "./../data/catheters";
import { generateCase } from "./caseGenerator";

const leftModel = () => buildAnatomy(generateCase("ptest", { rootSize: "normal", focus: "left" }, "rand"));

describe("computePressure", () => {
  it("reads LV pressure below the valve plane", () => {
    const model = leftModel();
    const cath = catheterById("JL4")!;
    const controls = { ...initialControls(), insertion: 40 };
    const tip = computeTip(model, cath, controls);
    const eng = computeEngagement(model, cath, controls, "beginner");
    const p = computePressure(eng, tip, controls, cath);
    expect(p.kind).toBe("lv");
    expect(p.warning).toBe("danger");
    expect(p.diastolic).toBeLessThan(20); // LV diastole is low
  });

  it("an unstable/whipping catheter gives a noisy, cautionary trace", () => {
    const model = leftModel();
    const cath = catheterById("JL4")!;
    const controls = { ...initialControls(), whip: 0.6 };
    const tip = computeTip(model, cath, controls);
    const eng = computeEngagement(model, cath, controls, "beginner");
    const p = computePressure(eng, tip, controls, cath);
    expect(p.kind).toBe("noisy");
    expect(p.quality).toBeLessThan(0.6);
  });

  it("a clean, non-engaged position reads aortic with no warning", () => {
    const model = leftModel();
    const cath = catheterById("PIG")!; // pigtail can't selectively engage → sits in the root
    const controls = initialControls();
    const tip = computeTip(model, cath, controls);
    const eng = computeEngagement(model, cath, controls, "beginner");
    const p = computePressure(eng, tip, controls, cath);
    expect(p.kind).toBe("aortic");
    expect(p.warning).toBe("none");
    expect(p.systolic).toBeGreaterThan(p.diastolic);
  });
});

describe("computePressure with the difficulty-free engagement model", () => {
  it("a tip pose gives the same engagement and pressure reading at every difficulty", () => {
    const left = leftModel();
    const right = buildAnatomy(generateCase("ptest-r", { rootSize: "normal", focus: "right" }, "rand"));
    const kinds = new Set<string>();
    const engagementKinds = new Set<string>();
    for (const [model, id, ost] of [
      [left, "JL4", left.lm],
      [right, "JR4", right.rca],
    ] as const) {
      const cath = catheterById(id)!;
      const b = cath.behaviour;
      const aimTorque = (ost.az - b.naturalAzimuth) / (0.55 + 0.45 * b.torqueResponse);
      // a small torque offset turns the JR4 tip towards the conus, which gives an engaged, ventricularised trace
      for (const dTorque of [0, -0.3]) {
        for (const extra of [-3, -1, 0, 1, 2, 3, 4, 8, 12]) {
          const torque = aimTorque + dTorque;
          const controls = { ...initialControls(), torque, insertion: b.seatHeight - ost.height + extra };
          const tip = computeTip(model, cath, controls);
          const refEng = computeEngagement(model, cath, controls, "advanced");
          const ref = computePressure(refEng, tip, controls, cath);
          for (const d of ["beginner", "intermediate"] as const) {
            const eng = computeEngagement(model, cath, controls, d);
            expect(eng).toEqual(refEng);
            expect(computePressure(eng, tip, controls, cath)).toEqual(ref);
          }
          kinds.add(ref.kind);
          engagementKinds.add(refEng.conus ? "conus" : refEng.kind);
        }
      }
    }
    expect(kinds.has("aortic")).toBe(true);
    // the identity must also hold for engaged readings, which the old beginner radius affected most
    expect([...kinds].some((k) => k !== "aortic")).toBe(true);
    for (const k of ["selective-lm", "selective-rca", "conus", "non-selective"]) expect(engagementKinds.has(k)).toBe(true);
  });
});

describe("shapeAt waveform morphology", () => {
  const kinds: PressureKind[] = ["aortic", "lv", "damped", "ventricularised", "wedged", "noisy", "dissected"];
  it("returns finite, bounded values across the whole cycle for every kind", () => {
    for (const k of kinds) {
      for (let phase = 0; phase < 1; phase += 0.05) {
        const v = shapeAt(k, phase);
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeGreaterThan(-0.6);
        expect(v).toBeLessThan(1.6);
      }
    }
  });

  it("is periodic (phase 0 ≈ phase 1)", () => {
    for (const k of kinds) expect(Math.abs(shapeAt(k, 0) - shapeAt(k, 1))).toBeLessThan(1e-6);
  });
});
