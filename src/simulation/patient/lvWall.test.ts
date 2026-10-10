import { describe, it, expect } from "vitest";
import { PatientEngine } from "./engine";
import { generatePatient, type PatientProfile } from "./patient";
import { ANGIOCAD_SEGMENTS } from "./angiocadPriors";
import { makeHeart } from "../../render/xray/heart";
import { segmentsFromEngine, segmentClasses } from "../../render/xray/lvGram";

/** A patient with no coronary disease, in sinus rhythm. */
function healthy(seed: number): PatientProfile {
  const p = generatePatient(seed, { indication: "SA" });
  const grades = { ...p.angiocad.grades };
  for (const s of ANGIOCAD_SEGMENTS) grades[s] = 0;
  return { ...p, angiocad: { ...p.angiocad, grades }, culprit: null, baseline: { ...p.baseline, rhythm: "sinus" } };
}

describe("PatientEngine.lvWallState (diag-lv-aorta-render)", () => {
  it("lists the LV regions with no ischaemia at rest and the profile's LVEF", () => {
    const e = new PatientEngine({ profile: healthy(13), lesions: [] });
    e.advance(5);
    const w = e.lvWallState();
    expect(w.regions.length).toBeGreaterThan(5);
    expect(w.regions.every((r) => r.ischaemia < 0.05 && r.necrosis === 0)).toBe(true);
    expect(new Set(w.regions.map((r) => r.territory))).toEqual(new Set(["LAD", "LCx", "RCA"]));
    expect(w.baselineEf).toBe(e.profile.lvef);
    expect(w.ef).toBeGreaterThan(20);
    const cls = segmentClasses(segmentsFromEngine(makeHeart(1), w));
    expect(Object.values(cls).every((c) => c === "normal")).toBe(true);
  });

  it("an LAD occlusion makes the anterior and apical walls akinetic on the ventriculogram; an RCA occlusion the inferior wall", () => {
    const H = makeHeart(1);
    const lad = new PatientEngine({ profile: healthy(13), lesions: [] });
    lad.setOcclusion("b", { vessel: "LAD", param: 0.1, fraction: 1 });
    lad.advance(60);
    const a = segmentClasses(segmentsFromEngine(H, lad.lvWallState()));
    expect(["akinetic", "hypokinetic"]).toContain(a.anterior);
    expect(["akinetic", "hypokinetic"]).toContain(a.apical);
    expect(a.inferior).toBe("normal");
    const rca = new PatientEngine({ profile: healthy(13), lesions: [] });
    rca.setOcclusion("b", { vessel: "RCA", param: 0.35, fraction: 1 });
    rca.advance(60);
    const r = segmentClasses(segmentsFromEngine(H, rca.lvWallState()));
    expect(["akinetic", "hypokinetic"]).toContain(r.inferior);
    expect(r.anterior).toBe("normal");
  });
});
