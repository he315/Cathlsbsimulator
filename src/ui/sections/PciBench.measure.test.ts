// The bench screen's ground-truth gate (pci-bench-measure-and-plan): the slice read-out (EEM area, lumen area,
// plaque burden, calcium) waits for the debrief in supervised, independent and exam runs and for the learner's
// plan in guided practice, and guided and exam runs cannot leave the image step with the plan still to enter.
//   npx vitest run src/ui/sections/PciBench.measure.test.ts
import { afterEach, describe, expect, it } from "vitest";
import type { AssessmentMode } from "../../mentor/types";
import { BENCH_STEPS, type BenchStep } from "../lab/benchTips";
import { useBenchPlanStore } from "../bench/PlanForm";
import { launchBench, planBlocksLeavingImage, planStatus, sliceReadoutVisible, type BenchPlanStatus } from "./PciBench";

const UNGUIDED: AssessmentMode[] = ["supervised", "independent", "exam"];
const LIVE: BenchStep[] = BENCH_STEPS.filter((s) => s !== "assess");
const STATUSES: BenchPlanStatus[] = ["none", "pending", "entered"];

afterEach(() => useBenchPlanStore.getState().reset());

describe("the slice read-out", () => {
  it("is hidden on every live step in supervised, independent and exam runs, whatever the plan", () => {
    for (const mode of UNGUIDED) for (const step of LIVE) for (const plan of STATUSES) expect(sliceReadoutVisible(step, mode, plan), `${mode} ${step} ${plan}`).toBe(false);
  });

  it("is shown in the debrief in every mode", () => {
    for (const mode of [...UNGUIDED, "guided" as const]) for (const plan of STATUSES) expect(sliceReadoutVisible("assess", mode, plan)).toBe(true);
  });

  it("appears in guided practice only once the plan is entered (or past the image step of a run with no plan to enter)", () => {
    for (const step of LIVE) {
      expect(sliceReadoutVisible(step, "guided", "pending")).toBe(false);
      expect(sliceReadoutVisible(step, "guided", "entered")).toBe(true);
    }
    expect(sliceReadoutVisible("image", "guided", "none")).toBe(false);
    expect(sliceReadoutVisible("prep", "guided", "none")).toBe(true);
  });
});

describe("the plan's status from the bench's plan store", () => {
  it("goes pending at the commitment and entered at the submission, for the committed modality only", () => {
    const run = launchBench({ scenario: "ostial-lm-ivus", mode: "exam", modality: "IVUS" })!;
    expect(run.mode).toBe("exam");
    const id = run.session.lesionId;
    const store = useBenchPlanStore.getState;
    expect(planStatus(store().records[id], "IVUS")).toBe("none");
    store().ensure(id, "IVUS");
    expect(planStatus(store().records[id], "IVUS")).toBe("pending");
    expect(planStatus(store().records[id], "OCT")).toBe("none");
    expect(planStatus(store().records[id], null)).toBe("none");
    // exam: no plaque burden on the live screen before the plan, nor after it until the debrief
    expect(sliceReadoutVisible("image", "exam", planStatus(store().records[id], "IVUS"))).toBe(false);
    expect(planBlocksLeavingImage("exam", planStatus(store().records[id], "IVUS"))).toBe(true);
    store().submit(id);
    expect(planStatus(store().records[id], "IVUS")).toBe("entered");
    expect(sliceReadoutVisible("image", "exam", "entered")).toBe(false);
    expect(sliceReadoutVisible("image", "supervised", "entered")).toBe(false);
    expect(sliceReadoutVisible("image", "guided", "entered")).toBe(true);
    expect(planBlocksLeavingImage("exam", "entered")).toBe(false);
    // a new run of the lesion drops the record
    store().reset(id);
    expect(planStatus(store().records[id], "IVUS")).toBe("none");
  });
});

describe("leaving the image step", () => {
  it("waits for a committed plan in guided and exam runs only", () => {
    expect(planBlocksLeavingImage("guided", "pending")).toBe(true);
    expect(planBlocksLeavingImage("exam", "pending")).toBe(true);
    expect(planBlocksLeavingImage("supervised", "pending")).toBe(false);
    expect(planBlocksLeavingImage("independent", "pending")).toBe(false);
    for (const mode of [...UNGUIDED, "guided" as const]) {
      expect(planBlocksLeavingImage(mode, "none")).toBe(false);
      expect(planBlocksLeavingImage(mode, "entered")).toBe(false);
    }
  });
});
