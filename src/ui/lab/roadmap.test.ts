// The aortogram road map (diag-grafts-svg): the live monitor overlays a frozen frame only at the stored projection
// (within ROADMAP_TOLERANCE_DEG on both axes), at the stored field size, for its case, never in an exam, and only in
// the session it was frozen in.
//   npx vitest run src/ui/lab/roadmap.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { ROADMAP_TOLERANCE_DEG, roadmapShown, useRoadmap, type Roadmap } from "./ReferenceMonitor";

const map: Roadmap = { frame: new Uint8Array(4), w: 2, h: 2, cArm: { laoRao: 30, cranialCaudal: 0 }, fieldCm: 25, run: 3, frameIndex: 12, caseId: "case-a" };
const at = (laoRao: number, cranialCaudal: number) => ({ laoRao, cranialCaudal });

afterEach(() => useRoadmap.setState({ roadmap: null, owner: null }));

describe("roadmapShown", () => {
  it("shows at the stored LAO projection and within the tolerance on both axes", () => {
    expect(ROADMAP_TOLERANCE_DEG).toBe(2);
    expect(roadmapShown(map, at(30, 0), "case-a", false, 25)).toBe(true);
    expect(roadmapShown(map, at(31.5, -1.5), "case-a", false, 25)).toBe(true);
    expect(roadmapShown(map, at(28, 2), "case-a", false, 25)).toBe(true);
  });

  it("is hidden beyond the tolerance, for another case, in an exam, at another field size, and without a map", () => {
    expect(roadmapShown(map, at(32.5, 0), "case-a", false, 25)).toBe(false);
    expect(roadmapShown(map, at(30, -2.5), "case-a", false, 25)).toBe(false);
    expect(roadmapShown(map, at(30, 0), "case-b", false, 25)).toBe(false);
    expect(roadmapShown(map, at(30, 0), "case-a", true, 25)).toBe(false);
    expect(roadmapShown(map, at(30, 0), "case-a", false, 20)).toBe(false);
    expect(roadmapShown(null, at(30, 0), "case-a", false, 25)).toBe(false);
  });

  it("a road map at 0/0 shows at 1.5/-1.5 and not at 2.5/0", () => {
    const flat = { ...map, cArm: at(0, 0) };
    expect(roadmapShown(flat, at(0, 0), "case-a", false, 25)).toBe(true);
    expect(roadmapShown(flat, at(1.5, -1.5), "case-a", false, 25)).toBe(true);
    expect(roadmapShown(flat, at(2.5, 0), "case-a", false, 25)).toBe(false);
  });
});

describe("the road map belongs to its session", () => {
  it("binding the same session keeps it; a new session, even of the same case, drops it", () => {
    const first = {};
    const st = () => useRoadmap.getState();
    st().bind(first);
    st().freeze(map);
    st().bind(first);
    expect(st().roadmap).toBe(map);
    const relaunch = {};
    st().bind(relaunch);
    expect(st().roadmap).toBeNull();
    st().freeze(map);
    st().clear();
    expect(st().roadmap).toBeNull();
  });
});
