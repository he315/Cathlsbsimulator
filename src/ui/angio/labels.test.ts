import { describe, expect, it } from "vitest";
import {
  FRAME_TOLERANCE_DEFAULT,
  LABEL_DRILL_IDS,
  LABEL_GATE_MIN,
  LABEL_SCHEMA,
  accAhaType,
  correctedFrameCount,
  drillGate,
  exportLabelFile,
  flowDrillTarget,
  frameCountNormals,
  labelItems,
  labelProblems,
  labelSet,
  labelledRuns,
  mergeLabels,
  parseLabelFile,
  scaiClass,
  scoreLabelItem,
  segmentsFor,
  useReaderStore,
  type AccAhaFeatures,
  type ExpertLabel,
  type LabelFile,
  type MergedLabel,
} from "./labels";
import { buildDataset, labelFileOf, rng, type LibDataset, type LibRun } from "./library";
import { launch } from "../../content/practice/angio-expert-label-drills.launch";
import type { Reference } from "../../content/schema";
import { heldOutPatient } from "../../content/mentor/catalogue";

/** The first n fixture patient ids that are practice patients (not held out for exams). */
function practiceIds(n: number): string[] {
  const out: string[] = [];
  for (let k = 0; out.length < n; k++) if (!heldOutPatient("CADICA", `p${k}`)) out.push(`p${k}`);
  return out;
}
/** The first fixture patient id held out for exams. */
function heldOutId(): string {
  for (let k = 0; ; k++) if (heldOutPatient("CADICA", `p${k}`)) return `p${k}`;
}
const runId = (i: number) => `${practiceIds(i + 1)[i]}_v1`;

/** A CADICA-like dataset of n practice runs (one patient per run), plus any extra patient ids given. */
function dataset(n: number, extra: string[] = []): LibDataset {
  return {
    dataset: "CADICA",
    citation: "fixture",
    doi: "",
    licence: "",
    licenceUrl: "",
    changes: "",
    system: "",
    patients: [...practiceIds(n), ...extra].map((id, i) => ({
      id,
      dataset: "CADICA" as const,
      runs: [{ id: `${id}_v1`, dataset: "CADICA" as const, patientId: id, base: "", frames: ["a.jpg"], fps: 15, artery: i % 2 ? ("RCA" as const) : ("LCA" as const) }],
    })),
  };
}
const runsOf = (d: LibDataset[]): LibRun[] => d.flatMap((x) => x.patients.flatMap((p) => p.runs));

/** A labels.json with TIMI labels on the first n runs. */
function timiFile(n: number, reader = "Dr Reader"): LabelFile {
  return {
    schema: LABEL_SCHEMA,
    reader: { name: reader, qualification: "consultant interventional cardiologist" },
    exported: "2026-10-09",
    labels: Array.from({ length: n }, (_, i) => ({ run: runId(i), date: "2026-10-09", timi: (i % 4) as 0 | 1 | 2 | 3, comparisonBed: "opposite" as const })),
  };
}

function merged(nRuns: number, nLabels: number) {
  const parsed = parseLabelFile(timiFile(nLabels));
  expect(parsed.problems).toEqual([]);
  return mergeLabels([dataset(nRuns)], [{ dataset: "CADICA", labels: parsed.labels, source: "library", file: "/angio-library/cadica/labels.json" }]);
}

describe("expert labels: merging and the gate", () => {
  it("merging labels.json gives labelled runs", () => {
    const { data, unmatched } = merged(30, 25);
    expect(unmatched).toEqual([]);
    const runs = runsOf(data);
    expect(runs.filter((r) => r.expert?.length)).toHaveLength(25);
    const lr = labelledRuns("timi", runs);
    expect(lr).toHaveLength(25);
    expect(lr[0].label).toMatchObject({ reader: "Dr Reader", source: "library", file: "/angio-library/cadica/labels.json" });
    expect(lr[0].readers).toEqual(["Dr Reader"]);
  });

  it("the gate hides a drill with 19 labelled runs and shows it with 20", () => {
    expect(LABEL_GATE_MIN).toBe(20);
    const g19 = drillGate("timi", runsOf(merged(30, 19).data));
    expect(g19).toMatchObject({ open: false, labelled: 19, needed: 20 });
    const g20 = drillGate("timi", runsOf(merged(30, 20).data));
    expect(g20).toMatchObject({ open: true, labelled: 20, readers: ["Dr Reader"], files: ["/angio-library/cadica/labels.json"] });
    // other drills stay closed: the file carries no labels for them
    expect(drillGate("morphology", runsOf(merged(30, 20).data)).open).toBe(false);
  });

  it("with no labels.json 'timi' opens the simulated-run drill; with 20 labelled runs it opens the real-run drill", () => {
    expect(flowDrillTarget("timi", runsOf([dataset(30)]))).toBe("simulated");
    expect(flowDrillTarget("timi", runsOf(merged(30, 19).data))).toBe("simulated");
    expect(flowDrillTarget("timi", runsOf(merged(30, 20).data))).toBe("real");
    expect(flowDrillTarget("frame-count", runsOf(merged(30, 20).data))).toBe("simulated"); // no frame counts labelled
  });

  it("labels made or imported in this browser are refused for scored drills", () => {
    const parsed = parseLabelFile(timiFile(25, "Learner"));
    const { data } = mergeLabels([dataset(30)], [{ labels: parsed.labels, source: "local", file: "this browser" }]);
    const runs = runsOf(data);
    expect(labelledRuns("timi", runs)).toHaveLength(0);
    const g = drillGate("timi", runs);
    expect(g.open).toBe(false);
    expect(g.localOnly).toBe(25);
  });

  it("runs on which two readers disagree are left out; agreeing readers are both credited", () => {
    const a = parseLabelFile(timiFile(20, "Reader A")).labels;
    const b = parseLabelFile(timiFile(20, "Reader B")).labels.map((l, i) => (i < 5 ? { ...l, timi: ((l.timi! + 1) % 4) as 0 | 1 | 2 | 3 } : l));
    const { data } = mergeLabels([dataset(30)], [
      { labels: a, source: "library", file: "a.json" },
      { labels: b, source: "library", file: "b.json" },
    ]);
    const lr = labelledRuns("timi", runsOf(data));
    expect(lr).toHaveLength(15);
    expect(lr[0].readers).toEqual(["Reader A", "Reader B"]);
  });

  it("refuses malformed labels and labels for runs not in the library", () => {
    expect(labelProblems({ run: "x", timi: 4 })).toContain("timi must be 0-3");
    expect(labelProblems({ run: "x", tmi: 1 })).toContain('unknown field "tmi"');
    const f = parseLabelFile({ schema: LABEL_SCHEMA, labels: [{ run: runId(1), timi: 2 }] });
    expect(f.labels).toHaveLength(0);
    expect(f.problems[0]).toContain("no reader named");
    const { unmatched } = mergeLabels([dataset(2)], [{ labels: [{ run: "nope", reader: "R", date: "2026-10-09", timi: 3 }], source: "library", file: "x.json" }]);
    expect(unmatched).toEqual(["x.json: run nope"]);
  });

  it("a Reader-mode export reads back as a labels.json", () => {
    const labels: ExpertLabel[] = [{ run: runId(0), reader: "Dr Reader", date: "2026-10-09", timi: 2, thrombusGrade: 3, calcium: "severe", nhlbi: "B" }];
    const text = exportLabelFile({ name: "Dr Reader", qualification: "", labels }, new Date("2026-10-09T10:00:00Z"));
    const back = parseLabelFile(JSON.parse(text));
    expect(back.problems).toEqual([]);
    expect(back.labels).toEqual(labels);
  });

  it("a set is stratified by the reference class and excludes nothing it was not given", () => {
    const runs = runsOf(merged(40, 40).data);
    const set = labelSet("timi", runs, rng(3));
    const per = [0, 1, 2, 3].map((g) => set.filter((x) => x.parts[0].answer === g).length);
    expect(new Set(per).size).toBe(1);
    // held-out patients never reach here: the section passes practice runs only, so a run absent from the input is absent from the set
    const fewer = runs.slice(0, 20);
    expect(labelSet("timi", fewer, rng(3)).every((x) => fewer.includes(x.run))).toBe(true);
  });
});

describe("frame counts", () => {
  it("correction divides LAD counts by 1.7 and scales by frame rate", () => {
    expect(correctedFrameCount(34, { vessel: "LAD", runFps: 15 })).toBeCloseTo(20, 6);
    expect(correctedFrameCount(17, { vessel: "LAD", runFps: 15, targetFps: 30 })).toBeCloseTo(20, 6);
    expect(correctedFrameCount(10, { vessel: "RCA", runFps: 10, targetFps: 30 })).toBeCloseTo(30, 6);
    expect(correctedFrameCount(22, { vessel: "LCx", runFps: 15 })).toBe(22);
  });

  it("no normal value shows when refs has none verified", () => {
    expect(frameCountNormals(15, {})).toBeNull();
    const unverified: Record<string, Reference> = { "gibson-tfc-1996": { id: "gibson-tfc-1996", kind: "paper", citation: "x", verified: true } };
    expect(frameCountNormals(15, unverified)).toBeNull(); // the citation is verified, the values are not
    // the real registry today
    expect(frameCountNormals(15)).toBeNull();
  });

  it("normals entered in refs as verified values are shown with the scale to the study's rate", () => {
    // fixture values only (not the paper's): the mechanism, not a claim about the study
    const refs: Record<string, Reference> = {
      "gibson-tfc-1996": {
        id: "gibson-tfc-1996",
        kind: "paper",
        citation: "x",
        verified: true,
        verifiedValues: { tfcStudyFps: 30, tfcLadMean: 40, tfcLadSd: 3, tfcLcxMean: 25, tfcLcxSd: 4, tfcRcaMean: 22, tfcRcaSd: 3 },
      },
    };
    const n = frameCountNormals(15, refs)!;
    expect(n.scale).toBe(2);
    expect(n.normals.LAD).toEqual({ mean: 40, sd: 3 });
    expect(n.text).toContain("30 frames per second");
  });
});

describe("ACC/AHA type and SCAI class", () => {
  const plain: AccAhaFeatures = {
    length: "<10",
    eccentric: false,
    access: "ready",
    angulation: "none",
    irregular: false,
    calcium: "light",
    branch: "none",
    ostial: false,
    occlusion: "none",
    thrombus: "none",
    degeneratedSvg: false,
  };
  it("returns C for a lesion over 20 mm or a total occlusion over 3 months", () => {
    expect(accAhaType(plain)).toBe("A");
    expect(accAhaType({ ...plain, length: ">20" })).toBe("C");
    expect(accAhaType({ ...plain, occlusion: "over-3-months" })).toBe("C");
    expect(accAhaType({ ...plain, occlusion: "under-3-months" })).toBe("B1");
  });
  it("splits B by the number of B features (the lesson's worked example is B2)", () => {
    // 16 mm, eccentric, irregular, light calcium: three B features
    expect(accAhaType({ ...plain, length: "10-20", eccentric: true, irregular: true })).toBe("B2");
    expect(accAhaType({ ...plain, length: "10-20" })).toBe("B1");
  });
  it("SCAI class is type C feature by patency", () => {
    expect(scaiClass(plain, false)).toBe("I");
    expect(scaiClass({ ...plain, length: ">20" }, false)).toBe("II");
    expect(scaiClass(plain, true)).toBe("III");
    expect(scaiClass({ ...plain, occlusion: "over-3-months" }, true)).toBe("IV");
  });
  it("the classify item derives the expert's type and class from the recorded features", () => {
    const run: LibRun = { id: "r", dataset: "CADICA", patientId: "p", base: "", frames: [], fps: 15 };
    const [item] = labelItems("classify", {
      run,
      label: { run: "r", reader: "R", date: "", timi: 0, accAha: { ...plain, occlusion: "over-3-months" }, source: "library", file: "x" },
      readers: ["R"],
      files: ["x"],
    });
    expect(item.parts[0].options[item.parts[0].answer]).toBe("C");
    expect(item.parts[1].options[item.parts[1].answer]).toBe("IV");
  });
  it("an occlusion among the features makes the vessel occluded for SCAI without a TIMI label (the lesson's worked example is class IV)", () => {
    const run: LibRun = { id: "r", dataset: "CADICA", patientId: practiceIds(1)[0], base: "", frames: [], fps: 15, expert: [] };
    const label: MergedLabel = { run: "r", reader: "R", date: "", accAha: { ...plain, occlusion: "over-3-months" }, source: "library", file: "x" };
    const lr = labelledRuns("classify", [{ ...run, expert: [label] }]);
    expect(lr).toHaveLength(1);
    const [item] = labelItems("classify", lr[0]);
    expect(item.parts[1].options[item.parts[1].answer]).toBe("IV");
    const under: MergedLabel = { ...label, accAha: { ...plain, occlusion: "under-3-months" } };
    const [it2] = labelItems("classify", labelledRuns("classify", [{ ...run, expert: [under] }])[0]);
    expect(it2.parts[1].options[it2.parts[1].answer]).toBe("III");
  });
});

describe("SYNTAX segments by dominance", () => {
  it("segments 4 and 16 exist in right dominance only, 15 in left dominance only", () => {
    const r = segmentsFor("right").map((s) => s.id);
    const l = segmentsFor("left").map((s) => s.id);
    expect(r).toEqual(expect.arrayContaining(["4", "16"]));
    expect(r).not.toContain("15");
    expect(l).toContain("15");
    expect(l).not.toContain("4");
    expect(l).not.toContain("16");
  });
});

describe("practice links", () => {
  it("the launch file declares exactly the label drills", () => {
    expect(launch.sim).toBe("angio-real");
    expect((launch.drills ?? []).map((d) => d.id).sort()).toEqual([...LABEL_DRILL_IDS].sort());
  });
});

describe("review fixes: agreement, validation, scoring and held-out patients", () => {
  /** library labels from several readers on the first n practice runs, each reader's label made by `make(i)` */
  function library(n: number, readers: Record<string, (i: number) => Omit<ExpertLabel, "run" | "reader" | "date">>) {
    const parts = Object.entries(readers).map(([reader, make]) => ({
      labels: Array.from({ length: n }, (_, i) => ({ run: runId(i), reader, date: "2026-10-09", ...make(i) })),
      source: "library" as const,
      file: `${reader}.json`,
    }));
    return runsOf(mergeLabels([dataset(n)], parts).data);
  }

  it("two readers' frame counts within the tolerance agree; the reference is their median and both files are named", () => {
    const runs = library(1, { A: () => ({ frameCount: { vessel: "LAD", frames: 20 } }), B: () => ({ frameCount: { vessel: "LAD", frames: 21 } }) });
    const lr = labelledRuns("frame-count", runs);
    expect(lr).toHaveLength(1);
    expect([20, 21]).toContain(lr[0].label.frameCount!.frames);
    expect(lr[0].label.frameCount!.tolerance).toBe(FRAME_TOLERANCE_DEFAULT);
    expect(lr[0].readers).toEqual(["A", "B"]);
    expect(lr[0].files).toEqual(["A.json", "B.json"]);
    const [item] = labelItems("frame-count", lr[0]);
    expect(item.count!.frames).toBe(lr[0].label.frameCount!.frames);
    // beyond the tolerance, or on different vessels, they disagree and the run is left out
    expect(labelledRuns("frame-count", library(1, { A: () => ({ frameCount: { vessel: "LAD", frames: 20 } }), B: () => ({ frameCount: { vessel: "LAD", frames: 20 + FRAME_TOLERANCE_DEFAULT + 1 } }) }))).toHaveLength(0);
    expect(labelledRuns("frame-count", library(1, { A: () => ({ frameCount: { vessel: "LAD", frames: 20 } }), B: () => ({ frameCount: { vessel: "LCx", frames: 20 } }) }))).toHaveLength(0);
    // the smallest stated tolerance applies
    expect(labelledRuns("frame-count", library(1, { A: () => ({ frameCount: { vessel: "RCA", frames: 20, tolerance: 1 } }), B: () => ({ frameCount: { vessel: "RCA", frames: 22 } }) }))).toHaveLength(0);
  });

  it("two readers marking the same segments at different points agree on the segment drill", () => {
    const runs = library(1, {
      A: () => ({ dominance: "right", segmentPoints: [{ frame: 10, x: 100, y: 120, segment: "2" }] }),
      B: () => ({ dominance: "right", segmentPoints: [{ frame: 12, x: 104, y: 118, segment: "2" }] }),
    });
    const lr = labelledRuns("segment", runs);
    expect(lr).toHaveLength(1);
    expect(labelItems("segment", lr[0])).toHaveLength(1);
    const differ = library(1, { A: () => ({ dominance: "right", segmentPoints: [{ frame: 10, x: 1, y: 1, segment: "2" }] }), B: () => ({ dominance: "left", segmentPoints: [{ frame: 10, x: 1, y: 1, segment: "2" }] }) });
    expect(labelledRuns("segment", differ)).toHaveLength(0);
  });

  it("refuses a left main donor, a segment absent from the study's dominance, and segment points without a dominance", () => {
    expect(labelProblems({ run: "x", donor: "LM" })).toContain("donor must be LAD, LCx or RCA");
    expect(labelProblems({ run: "x", recipient: "LM" })).toContain("recipient must be LAD, LCx or RCA");
    expect(labelProblems({ run: "x", dominance: "left", segmentPoints: [{ frame: 1, x: 1, y: 1, segment: "4" }] }).join()).toContain("segment 4 does not exist in left dominance");
    expect(labelProblems({ run: "x", segmentPoints: [{ frame: 1, x: 1, y: 1, segment: "2" }] })).toContain("segmentPoints need the study's dominance");
    expect(labelProblems({ run: "x", dominance: "left", segmentPoints: [{ frame: 1, x: 1, y: 1, segment: "15" }] })).toEqual([]);
  });

  it("the comparison bed is asked but not scored: a right grade with the other bed agrees with the expert", () => {
    const runs = runsOf(merged(4, 4).data);
    const [item] = labelItems("timi", labelledRuns("timi", runs)[0]);
    const bed = item.parts.find((p) => p.key === "bed")!;
    expect(bed.scored).toBe(false);
    const sc = scoreLabelItem(item, { parts: { timi: item.parts[0].answer, bed: 1 - bed.answer }, conf: 0.7 });
    expect(sc.parts.bed).toBe(false);
    expect(sc.correct).toBe(true);
    expect(scoreLabelItem(item, { parts: { timi: (item.parts[0].answer + 1) % 4, bed: bed.answer }, conf: 0.7 }).correct).toBe(false);
  });

  it("a held-out exam patient's labelled run never enters a labelled practice set, even when passed in", () => {
    const out = heldOutId();
    const labels = [...parseLabelFile(timiFile(24)).labels, { run: `${out}_v1`, reader: "Dr Reader", date: "2026-10-09", timi: 2 as const }];
    const { data, unmatched } = mergeLabels([dataset(24, [out])], [{ labels, source: "library", file: "labels.json" }]);
    expect(unmatched).toEqual([]);
    const runs = runsOf(data);
    expect(runs.find((r) => r.id === `${out}_v1`)?.expert).toHaveLength(1);
    expect(labelledRuns("timi", runs).map((x) => x.run.id)).not.toContain(`${out}_v1`);
    for (let seed = 1; seed <= 5; seed++) expect(labelSet("timi", runs, rng(seed)).some((x) => x.run.id === `${out}_v1`)).toBe(false);
    expect(drillGate("timi", runs).labelled).toBe(24);
  });

  it("merging keeps each run's frames array, so a player keyed on the frames does not reload when a label changes", () => {
    const ds = dataset(3);
    const before = runsOf([ds]);
    const after = runsOf(mergeLabels([ds], [{ labels: parseLabelFile(timiFile(2)).labels, source: "local", file: "this browser" }]).data);
    for (let i = 0; i < before.length; i++) {
      expect(after[i].id).toBe(before[i].id);
      expect(after[i].frames).toBe(before[i].frames);
    }
    expect(after[0]).not.toBe(before[0]); // a labelled run is a new object
  });

  it("Reader mode refuses an invalid change and keeps the run's label (never drops it)", () => {
    const st = useReaderStore.getState();
    st.setReader("Dr Reader", "");
    st.setLabel("r1", { timi: 2 });
    expect(useReaderStore.getState().labels.find((l) => l.run === "r1")?.timi).toBe(2);
    useReaderStore.getState().setLabel("r1", { timi: 2, segmentPoints: [{ frame: 1, x: 1, y: 1, segment: "2" }] }); // no dominance: refused
    const kept = useReaderStore.getState().labels.find((l) => l.run === "r1");
    expect(kept?.timi).toBe(2);
    expect(kept?.segmentPoints).toBeUndefined();
    useReaderStore.getState().setLabel("r1", null);
    expect(useReaderStore.getState().labels.find((l) => l.run === "r1")).toBeUndefined();
  });
});

describe("label files are requested only where index.json declares one", () => {
  it("labelFileOf gives the declared file beside index.json, and nothing for an undeclared or unsafe name", () => {
    expect(labelFileOf({ labels: "labels.json" }, "cadica")).toBe("/angio-library/cadica/labels.json");
    expect(labelFileOf({}, "cadica")).toBeNull();
    expect(labelFileOf({ labels: "" }, "cadica")).toBeNull();
    expect(labelFileOf({ labels: "../x.json" }, "cadica")).toBeNull();
    expect(labelFileOf({ labels: "https://example.org/labels.json" }, "cadica")).toBeNull();
  });

  it("buildDataset keeps the label declaration out of the dataset", () => {
    const ds = buildDataset({ dataset: "CADICA", citation: "", doi: "", licence: "", licenceUrl: "", changes: "", system: "", labels: "labels.json", patients: [] }, "CADICA", "cadica");
    expect("labels" in ds).toBe(false);
  });
});
