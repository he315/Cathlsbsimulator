// SYNTAX lesion marking on real AngioCAD studies (angio-decision-drills): the per-segment comparison
// with the AngioCAD grades, the anatomy, and the thresholds the anatomy chooses.
//   npx vitest run src/ui/angio/syntax.test.ts
import { describe, expect, it } from "vitest";
import {
  ANGIOCAD_SEGMENTS,
  SYNTAX_LESION_RULE,
  SYNTAX_TOTAL_STATUS,
  anatomyOf,
  angioCadAnatomies,
  angioCadLesionClass,
  compareLesionSets,
  segmentVessel,
  syntaxRule,
  syntaxTotal,
  thresholdSetFor,
} from "./syntax";

/** An AngioCAD grade set: every segment normal except those given. */
const grades = (g: Record<string, string>): Record<string, string> => Object.fromEntries(ANGIOCAD_SEGMENTS.map((s) => [s, g[s] ?? "NL"]));

describe("lesion-set agreement with the AngioCAD grades is per segment", () => {
  it("one row per AngioCAD segment; 51% or more is a lesion, NL and 1-25 are not, 26-50 is not scored", () => {
    const segs = grades({ "Prox LAD": "76-90", "Mid LCx": "51-75", "Mid RCA": "26-50", OM: "1-25", PDA: "100" });
    const c = compareLesionSets(["Prox LAD", "OM", "Mid RCA"], segs, "right");
    expect(c.rows.map((r) => r.segment)).toEqual([...ANGIOCAD_SEGMENTS]);
    const row = (s: string) => c.rows.find((r) => r.segment === s)!;
    expect(row("Prox LAD")).toMatchObject({ marked: true, reference: "lesion", agree: true });
    expect(row("OM")).toMatchObject({ marked: true, reference: "none", agree: false });
    expect(row("Mid LCx")).toMatchObject({ marked: false, reference: "lesion", agree: false });
    expect(row("PDA")).toMatchObject({ marked: false, reference: "lesion", agree: false, vessel: "RCA" });
    expect(row("Mid RCA")).toMatchObject({ marked: true, reference: "indeterminate", agree: null });
    // the unmarked normal segments agree
    expect(row("LM")).toMatchObject({ marked: false, reference: "none", agree: true });
    expect(c).toMatchObject({ indeterminate: 1, bothLesion: 1, extra: 1, missed: 2, disagreed: 3, agreed: 11 });
    expect(c.agreement).toBeCloseTo(11 / 14, 6);
  });

  it("a learner's mark on one segment never counts for another: moving a correct mark to the neighbouring segment of the same vessel is two disagreements", () => {
    const segs = grades({ "Mid LAD": "91-99" });
    expect(compareLesionSets(["Mid LAD"], segs, "right")).toMatchObject({ agreed: 15, disagreed: 0 });
    expect(compareLesionSets(["Prox LAD"], segs, "right")).toMatchObject({ agreed: 13, disagreed: 2, extra: 1, missed: 1 });
  });

  it("grades read as lesions by the 50% rule, and the PDA and posterolateral branch follow dominance", () => {
    expect(SYNTAX_LESION_RULE).toMatchObject({ minStenosisPct: 50, minVesselMm: 1.5, lessonId: "pm-target-heart-team" });
    expect(["NL", "1-25", "26-50", "51-75", "76-90", "91-99", "100"].map(angioCadLesionClass)).toEqual(["none", "none", "indeterminate", "lesion", "lesion", "lesion", "lesion"]);
    expect(segmentVessel("PDA", "right")).toBe("RCA");
    expect(segmentVessel("PLB", "left")).toBe("LCx");
    expect(segmentVessel("D2", "left")).toBe("LAD");
    expect(segmentVessel("OM", "right")).toBe("LCx");
    expect(segmentVessel("LM", "left")).toBe("LM");
  });

  it("the score is not totalled until the primary paper's weights are extracted, and the drill says so", () => {
    expect(syntaxTotal()).toBeNull();
    expect(SYNTAX_TOTAL_STATUS.totalled).toBe(false);
    expect(SYNTAX_TOTAL_STATUS.reason).toMatch(/not totalled/);
    expect(SYNTAX_TOTAL_STATUS.reason).toMatch(/Sianos 2005/);
  });
});

describe("the anatomy chooses the thresholds", () => {
  it("the LM threshold is not applied to three-vessel disease", () => {
    // a score between the two thresholds: CABG for three-vessel disease, either for the left main
    const three = syntaxRule("three-vessel", 28);
    expect(three.thresholds).toBe("three-vessel");
    expect(three.modality).toBe("cabg");
    expect(three.text).toMatch(/left main threshold of 33 does not apply/);
    expect(syntaxRule("left-main", 28).modality).toBe("pci-or-cabg");
    // the boundaries of each set
    expect(syntaxRule("three-vessel", 22).modality).toBe("pci-or-cabg");
    expect(syntaxRule("three-vessel", 23).modality).toBe("cabg");
    expect(syntaxRule("left-main", 32).modality).toBe("pci-or-cabg");
    expect(syntaxRule("left-main", 33).modality).toBe("cabg");
    // between 23 and 32, where the left main rule would still allow either, three-vessel disease goes to CABG
    for (let s = 23; s <= 32; s++) expect(syntaxRule("three-vessel", s).modality, String(s)).toBe("cabg");
  });

  it("diabetes is not overridden by a low score; two-vessel disease has no threshold; single-vessel disease does not use SYNTAX", () => {
    expect(syntaxRule("three-vessel", 10, true).modality).toBe("cabg");
    expect(syntaxRule("left-main", 10, true).modality).toBe("cabg");
    expect(syntaxRule("two-vessel", 40).modality).toBe("pci-or-cabg");
    expect(syntaxRule("one-vessel", 40)).toMatchObject({ thresholds: "not-used", modality: null });
    expect(syntaxRule("one-vessel", 40, true).modality).toBeNull();
  });

  it("anatomyOf: left main disease takes the left main thresholds whatever else is diseased; arteries are counted beyond the left main", () => {
    expect(anatomyOf(["Prox LAD", "Mid LCx", "Dist RCA"], "right").class).toBe("three-vessel");
    expect(anatomyOf(["LM", "Prox LAD", "Mid LCx", "Dist RCA"], "right").class).toBe("left-main");
    expect(anatomyOf(["D1", "OM"], "right")).toMatchObject({ class: "two-vessel", arteries: ["LAD", "LCx"], proximalLad: false });
    // in a left-dominant system the PDA is the circumflex's
    expect(anatomyOf(["Mid LAD", "PDA"], "left").arteries).toEqual(["LAD", "LCx"]);
    expect(anatomyOf(["Mid LAD", "PDA"], "right").arteries).toEqual(["LAD", "RCA"]);
    expect(anatomyOf([], "right").class).toBe("none");
    expect(thresholdSetFor("three-vessel")).toBe("three-vessel");
    expect(thresholdSetFor("left-main")).toBe("left-main");
  });

  it("angioCadAnatomies offers both readings when a 26-50 segment changes the anatomy", () => {
    expect(angioCadAnatomies(grades({ "Prox LAD": "76-90", "Mid LCx": "91-99", "Mid RCA": "51-75" }), "right")).toEqual(["three-vessel"]);
    expect(angioCadAnatomies(grades({ "Prox LAD": "76-90", "Mid LCx": "91-99", "Mid RCA": "26-50" }), "right")).toEqual(["two-vessel", "three-vessel"]);
    expect(angioCadAnatomies(grades({ "Prox LAD": "76-90", LM: "26-50" }), "right")).toEqual(["one-vessel", "left-main"]);
  });
});
