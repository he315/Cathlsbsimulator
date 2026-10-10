import { describe, it, expect } from "vitest";
import { buildAngioGeometry } from "./angio";
import { buildAnatomy } from "./anatomy";
import { generateBatch } from "./caseGenerator";

describe("buildAngioGeometry", () => {
  it("produces only finite world points across many cases", () => {
    let points = 0;
    for (const c of generateBatch("rand", 40, "angio")) {
      const segs = buildAngioGeometry(buildAnatomy(c));
      for (const s of segs) {
        for (const p of s.world) {
          points++;
          expect(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z)).toBe(true);
        }
      }
    }
    expect(points).toBeGreaterThan(1000);
  });

  it("enriches each named vessel with organic side-branches (more segments than vessels)", () => {
    const model = buildAnatomy(generateBatch("rand", 1, "one")[0]);
    const segs = buildAngioGeometry(model);
    expect(segs.length).toBeGreaterThan(model.vessels.length);
    // trunks are marked attach=0; twigs attach>0
    expect(segs.some((s) => s.attach === 0)).toBe(true);
    expect(segs.some((s) => s.attach > 0)).toBe(true);
  });

  it("is deterministic for a given model", () => {
    const c = generateBatch("rand", 1, "det")[0];
    const a = buildAngioGeometry(buildAnatomy(c));
    const b = buildAngioGeometry(buildAnatomy(c));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
