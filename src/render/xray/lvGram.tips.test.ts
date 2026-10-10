import { describe, it, expect } from "vitest";
import { tipsFor, type LabContext } from "../../content/lab/tips";
import { WAITING_TIPS, DEFERRED_RETARGETS } from "../../content/lab/raisable/waiting";

// diag-lv-aorta-render draws the ventriculogram and aortogram; it raises no events or phases itself
// (diag-lv-aorta-task raises phase 'lv-aorta' with the pigtail). This checks the context those runs
// are filmed in reaches the two ventriculogram tips, and that no waiting entry is keyed to this package.
describe("lv-aorta tips (diag-lv-aorta-render)", () => {
  it("at phase 'lv-aorta' with a pigtail, tipsFor(ctx, 20) includes diag-lv-gram-mid-cavity and diag-lv-gram-injector", () => {
    const ctx: LabContext = { lab: "diagnostic", phase: "lv-aorta", catheter: "PIG" };
    const ids = tipsFor(ctx, 20).map((t) => t.id);
    expect(ids).toContain("diag-lv-gram-mid-cavity");
    expect(ids).toContain("diag-lv-gram-injector");
  });

  it("no waiting.ts entry names diag-lv-aorta-render as its raiser", () => {
    expect(WAITING_TIPS.filter((w) => w.raisedBy === "diag-lv-aorta-render")).toEqual([]);
    expect(DEFERRED_RETARGETS.filter((d) => d.raisedBy === "diag-lv-aorta-render")).toEqual([]);
  });
});
