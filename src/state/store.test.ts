import { describe, it, expect } from "vitest";
import { useSimulatorStore } from "./useSimulatorStore";
import { CASE_LIBRARY, generateCase } from "../simulation/caseGenerator";
import { catheterById } from "../data/catheters";

// Construct validity: a careful ("expert") trajectory must score materially
// higher than a reckless ("novice") one on the SAME case. This is the brief's
// definition of a valid skills assessment. It drives the real Zustand store.

const g = () => useSimulatorStore.getState();
const routineLeft = CASE_LIBRARY[0]; // hand-tuned "Routine left coronary", JL4 seats at neutral

function expertRun(): { final: number; safety: number } {
  g().loadCase(routineLeft, "free");
  g().setFluoroLive(true);
  for (let i = 0; i < 12; i++) g().tick(0.033); // let the tip settle onto the ostium
  // diagnostic runs on a clean, selective pressure
  for (let k = 0; k < 3; k++) {
    g().inject();
    for (let i = 0; i < 60; i++) g().tick(0.033); // let each bolus wash through
  }
  return { final: g().score.finalScore, safety: g().score.safetyScore };
}

function noviceRun(): { final: number; safety: number } {
  g().loadCase(routineLeft, "free");
  g().setFluoroLive(true);
  // jam the catheter forward until it prolapses into the LV, then inject there
  for (let i = 0; i < 250; i++) {
    g().commandInsertion(0.4);
    g().tick(0.033);
    if (g().engagement.kind === "in-lv") break;
  }
  g().inject(); // injecting in the LV — a safety-critical error
  for (let i = 0; i < 60; i++) g().tick(0.033);
  g().inject();
  for (let i = 0; i < 60; i++) g().tick(0.033);
  return { final: g().score.finalScore, safety: g().score.safetyScore };
}

describe("construct validity (expert vs novice)", () => {
  it("the expert trajectory scores materially higher than the novice on the same case", () => {
    const expert = expertRun();
    const novice = noviceRun();
    expect(expert.safety).toBeGreaterThan(novice.safety);
    expect(expert.final).toBeGreaterThan(novice.final + 10);
  });

  it("a reckless LV injection is registered as a dangerous injection", () => {
    g().loadCase(routineLeft, "free");
    for (let i = 0; i < 250; i++) {
      g().commandInsertion(0.4);
      g().tick(0.033);
      if (g().engagement.kind === "in-lv") break;
    }
    g().inject();
    expect(g().score.dangerousInjections).toBeGreaterThanOrEqual(1);
  });

  it("loadCase resets score and progress state", () => {
    g().loadCase(routineLeft, "free");
    expect(g().score.injections).toBe(0);
    expect(g().dissection).toBe(false);
    expect(g().finished).toBe(false);
    expect(g().aspirated).toBe("unknown");
    expect(g().arrhythmia).toBe("none");
  });
});

describe("A2 safe-engagement: aspirate-before-inject", () => {
  it("aspiration returns free blood on a clean seat, no return in the LV", () => {
    g().loadCase(routineLeft, "free");
    for (let i = 0; i < 12; i++) g().tick(0.033); // settle onto the LM
    g().aspirate();
    expect(g().aspirated).toBe("clean");

    for (let i = 0; i < 250; i++) {
      g().commandInsertion(0.4);
      g().tick(0.033);
      if (g().engagement.kind === "in-lv") break;
    }
    g().aspirate();
    expect(g().aspirated).toBe("no-return");
  });

  it("moving the tip invalidates a prior aspirate", () => {
    g().loadCase(routineLeft, "free");
    for (let i = 0; i < 12; i++) g().tick(0.033);
    g().aspirate();
    expect(g().aspirated).toBe("clean");
    g().commandInsertion(2);
    g().tick(0.033);
    expect(g().aspirated).toBe("unknown");
  });
});

describe("A2 conus over-selection → VF", () => {
  it("injecting in the conus provokes VF, recoverable by defibrillation", () => {
    g().loadCase(generateCase("conus-store", { rootSize: "normal", focus: "right" }, "rand"), "free");
    g().setCatheter("JR4");
    const b = catheterById("JR4")!.behaviour;
    const conus = g().model.conus;
    g().commandTorque((conus.az - b.naturalAzimuth) / (0.55 + 0.45 * b.torqueResponse));
    g().commandInsertion(b.seatHeight - conus.height);
    for (let i = 0; i < 160; i++) g().tick(0.033); // settle onto the conus
    expect(g().engagement.conus).toBe(true);

    g().inject();
    expect(g().arrhythmia).toBe("vf");
    expect(g().score.arrhythmias).toBeGreaterThanOrEqual(1);

    g().defibrillate();
    expect(g().arrhythmia).toBe("none");
  });
});
