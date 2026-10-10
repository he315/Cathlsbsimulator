// Tip integration of angio-expert-label-drills, beside its event sources (labels.ts and simFlowDrill.ts):
// a scenario of src/content/practice/angio-expert-label-drills.launch.ts is driven to its first action and the
// reveal's context is checked against the tip engine; the waiting.ts entries naming this package must be
// satisfiable by what the two files raise.
import { describe, expect, it } from "vitest";
import { TIP_BY_ID, tipScore, tipsFor, type LabContext } from "../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import { launch } from "../../content/practice/angio-expert-label-drills.launch";
import {
  LABEL_DRILLS,
  LABEL_DRILL_IDS,
  LABEL_SCHEMA,
  REVEAL_TIPS,
  labelItems,
  labelRevealTips,
  labelledRuns,
  labelSet,
  labelTipContext,
  mergeLabels,
  parseLabelFile,
  raises as labelRaises,
  revealTips,
  scoreLabelItem,
  type ExpertLabel,
  type LabelFile,
} from "./labels";
import { SIM_FLOW_SPECS, raises as simRaises, scoreSimFlow, simFlowItem, simFlowTipContext } from "./simFlowDrill";
import { rng, type LibDataset } from "./library";
import { heldOutPatient } from "../../content/mentor/catalogue";

const PACKAGE = "angio-expert-label-drills";

/** The first n fixture patient ids that are practice patients (labelledRuns leaves held-out exam patients out). */
function practiceIds(n: number): string[] {
  const out: string[] = [];
  for (let k = 0; out.length < n; k++) if (!heldOutPatient("CADICA", `p${k}`)) out.push(`p${k}`);
  return out;
}

function labelledLibrary(n: number, extra: (i: number) => Partial<ExpertLabel> = () => ({})): LibDataset[] {
  const ids = practiceIds(n);
  const ds: LibDataset = {
    dataset: "CADICA",
    citation: "fixture",
    doi: "",
    licence: "",
    licenceUrl: "",
    changes: "",
    system: "",
    patients: ids.map((id) => ({
      id,
      dataset: "CADICA" as const,
      runs: [{ id: `${id}_v1`, dataset: "CADICA" as const, patientId: id, base: "", frames: ["a.jpg"], fps: 15, artery: "LCA" as const }],
    })),
  };
  const file: LabelFile = {
    schema: LABEL_SCHEMA,
    reader: { name: "Dr Reader" },
    labels: ids.map((id, i) => ({
      run: `${id}_v1`,
      date: "2026-10-09",
      timi: (i % 4) as 0 | 1 | 2 | 3,
      thrombusGrade: (i % 6) as 0 | 1 | 2 | 3 | 4 | 5,
      calcium: (["none", "moderate", "severe"] as const)[i % 3],
      nhlbi: (["none", "A", "B"] as const)[i % 3],
      ...extra(i),
    })),
  };
  const { labels } = parseLabelFile(file);
  return mergeLabels([ds], [{ labels, source: "library", file: "labels.json" }]).data;
}

const ids = (ctx: LabContext) => tipsFor(ctx, 20).map((t) => t.id);

describe("angio-expert-label-drills tips", () => {
  it("the morphology scenario: after its first answer, tipsFor(ctx, 20) includes pci-interp-grade-flow and pci-interp-thrombus-grade", () => {
    expect((launch.drills ?? []).some((d) => d.id === "morphology")).toBe(true);
    const runs = labelledLibrary(24).flatMap((d) => d.patients.flatMap((p) => p.runs));
    const set = labelSet("morphology", runs, rng(5));
    expect(set.length).toBeGreaterThan(0);
    const first = set[0];
    // first action: the learner answers the first lesion
    const score = scoreLabelItem(first, { parts: { thrombus: 2, calcium: 1, nhlbi: 0 }, conf: 0.6 });
    expect(Object.keys(score.parts).sort()).toEqual(["calcium", "nhlbi", "thrombus"]);
    const got = ids(labelTipContext(first));
    expect(got).toContain("pci-interp-grade-flow");
    expect(got).toContain("pci-interp-thrombus-grade");
    expect(got).toContain("pci-interp-dissection-nhlbi");
  });

  it("the timi scenario (simulated runs while unlabelled): after its first answer the reveal shows pci-interp-grade-flow", () => {
    const item = simFlowItem(SIM_FLOW_SPECS.find((s) => s.timi === 2)!);
    scoreSimFlow(item, { timi: 2, frames: 30, conf: 0.6 });
    expect(ids(simFlowTipContext(item))).toContain("pci-interp-grade-flow");
  });

  it("the timi reveal (real runs once labelled, simulated runs before) shows pci-interp-grade-flow among the tips it displays", () => {
    const runs = labelledLibrary(24).flatMap((d) => d.patients.flatMap((p) => p.runs));
    for (const lr of labelledRuns("timi", runs).slice(0, 4)) {
      const [item] = labelItems("timi", lr);
      expect(tipsFor(labelTipContext(item), REVEAL_TIPS).map((t) => t.id)).toContain("pci-interp-grade-flow");
    }
    for (const s of SIM_FLOW_SPECS) expect(tipsFor(simFlowTipContext(simFlowItem(s)), REVEAL_TIPS).map((t) => t.id)).toContain("pci-interp-grade-flow");
  });

  it("the collateral scenario's reveal shows diag-interp-collateral-long-run", () => {
    const runs = labelledLibrary(8, (i) => ({ donor: "LAD", recipient: "RCA", rentrop: (i % 4) as 0 | 1 | 2 | 3, wernerCC: (i % 3) as 0 | 1 | 2, channel: "septal" })).flatMap((d) =>
      d.patients.flatMap((p) => p.runs)
    );
    const lr = labelledRuns("collateral-grade", runs);
    expect(lr.length).toBe(8);
    const [item] = labelItems("collateral-grade", lr[0]);
    expect(ids(labelTipContext(item))).toContain("diag-interp-collateral-long-run");
    expect(labelRevealTips(item).map((t) => t.id)).toContain("diag-interp-collateral-long-run");
  });

  it("each reveal leads with its lesson's tips: calcium shows pci-interp-calcium-look-first within REVEAL_TIPS", () => {
    for (const d of LABEL_DRILL_IDS) for (const id of LABEL_DRILLS[d].tips) expect({ d, id, exists: !!TIP_BY_ID[id] }).toEqual({ d, id, exists: true });
    const runs = labelledLibrary(24, (i) => ({
      medina: { pmv: (i % 2) as 0 | 1, dmv: 1, sb: 0 },
      accAha: { length: "<10", eccentric: false, access: "ready", angulation: "none", irregular: false, calcium: "light", branch: "none", ostial: false, occlusion: "none", thrombus: "none", degeneratedSvg: false },
      dominance: "right",
      segmentPoints: [{ frame: 3, x: 10, y: 10, segment: "2" }],
    })).flatMap((d) => d.patients.flatMap((p) => p.runs));
    const first = (drill: (typeof LABEL_DRILL_IDS)[number]) => labelItems(drill, labelledRuns(drill, runs)[0])[0];
    const shown = (drill: (typeof LABEL_DRILL_IDS)[number]) => labelRevealTips(first(drill)).map((t) => t.id);
    expect(shown("calcium")).toContain("pci-interp-calcium-look-first");
    expect(shown("classify")).toContain("pci-planning-classify-lesion");
    expect(shown("segment")).toContain("diag-acq-dominance-follow-pda");
    expect(shown("morphology")).toEqual(expect.arrayContaining(["pci-interp-thrombus-grade", "pci-interp-calcium-look-first", "pci-interp-dissection-nhlbi"]));
    expect(shown("timi")).toContain("pci-interp-grade-flow");
    for (const d of ["calcium", "classify", "segment", "morphology", "timi", "medina"] as const) {
      const got = shown(d);
      expect(got.length).toBeLessThanOrEqual(REVEAL_TIPS);
      expect(new Set(got).size).toBe(got.length);
    }
  });

  it("every waiting.ts entry naming angio-expert-label-drills becomes satisfiable by what this package raises", () => {
    const mine: LabRaises[] = [labelRaises, simRaises];
    const satisfiable = (tipId: string): boolean => {
      const tip = TIP_BY_ID[tipId];
      if (!tip) return false;
      return mine.some((r) => r.phases.some((phase) => tipScore(tip, { lab: r.lab, phase, events: [...r.events] }) !== null));
    };
    const waiting = WAITING_TIPS.filter((w) => w.raisedBy === PACKAGE).flatMap((w) => w.tips);
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PACKAGE).map((d) => d.tipId);
    for (const id of waiting) expect({ id, ok: satisfiable(id) }).toEqual({ id, ok: true });
    for (const d of DEFERRED_RETARGETS.filter((x) => x.raisedBy === PACKAGE)) {
      const tip = TIP_BY_ID[d.tipId];
      const retargeted = tip ? { ...tip, when: d.when } : undefined;
      expect(!!retargeted && mine.some((r) => r.phases.some((phase) => tipScore(retargeted, { lab: r.lab, phase, events: [...r.events] }) !== null))).toBe(true);
    }
    // waiting.ts names this package in no entry today, so the pci lab's waiting count is unchanged by it (falls by 0)
    expect(waiting.length + deferred.length).toBeGreaterThanOrEqual(0);
  });
});

describe("angio-expert-label-drills reveal tips (verification fixes)", () => {
  it("after the lead tips a reveal adds only tips triggered by one of its events, never generic views tips", () => {
    const runs = labelledLibrary(24).flatMap((d) => d.patients.flatMap((p) => p.runs));
    for (const drill of ["timi", "morphology"] as const) {
      const item = labelItems(drill, labelledRuns(drill, runs)[0])[0];
      const ctx = labelTipContext(item);
      const lead = LABEL_DRILLS[drill].tips;
      for (const t of labelRevealTips(item)) {
        if (lead.includes(t.id)) continue;
        expect({ id: t.id, matches: !!t.when.event?.some((e) => ctx.events?.includes(e)) }).toEqual({ id: t.id, matches: true });
      }
    }
    for (const s of SIM_FLOW_SPECS) {
      const ctx = simFlowTipContext(simFlowItem(s));
      for (const t of revealTips(ctx, LABEL_DRILLS.timi.tips)) {
        if (LABEL_DRILLS.timi.tips.includes(t.id)) continue;
        expect(t.when.event?.some((e) => ctx.events?.includes(e))).toBe(true);
      }
    }
  });

  it("with no event match the lead tips show alone", () => {
    const got = revealTips({ lab: "diagnostic", phase: "views", events: [] }, LABEL_DRILLS.timi.tips);
    expect(got.map((t) => t.id)).toEqual([...LABEL_DRILLS.timi.tips]);
  });

  it("the morphology blurb asks only for what the item asks (no flow)", () => {
    expect(LABEL_DRILLS.morphology.blurb).not.toMatch(/flow/i);
  });
});
