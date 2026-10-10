import { describe, expect, it } from "vitest";
import { graftMechanicsNotice } from "./LiveMonitor";

describe("graft cases and the catheter mechanics (diag-grafts-svg)", () => {
  it("tells the learner a graft case needs the rod mechanics while the simple model runs", () => {
    const n = graftMechanicsNotice(3, false);
    expect(n).toMatch(/rod mechanics/);
    expect(n).toMatch(/Settings, Catheter mechanics/);
    expect(n).toMatch(/restart the case/);
  });
  it("carries the reason the simple model is in use", () => {
    expect(graftMechanicsNotice(1, false, "No worker.")).toContain("No worker.");
  });
  it("shows nothing when the rod mechanics runs or the case has no grafts", () => {
    expect(graftMechanicsNotice(3, true)).toBeNull();
    expect(graftMechanicsNotice(0, false)).toBeNull();
  });
});
