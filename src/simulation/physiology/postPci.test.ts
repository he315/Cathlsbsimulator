// physiology-post-pci-handover: the post-PCI presets show each branch of Brilakis's post-PCI algorithm
// (lesson pm-physiology-after-pci, Fig 12.1), the bench's deployed stent becomes a post-PCI case and a
// hand-over naming the preset chosen from its lumen, and postPci.launch.ts publishes the presets under
// pm-physiology-after-pci exactly when POST_PCI_LAUNCH_ENABLED says so.
//   npx vitest run src/simulation/physiology/postPci.test.ts
import { describe, expect, it } from "vitest";
import {
  CUTOFF,
  POST_PCI_DECISIONS,
  POST_PCI_GOOD_FFR,
  POST_PCI_PRESETS,
  POST_PCI_PRESET_BY_ID,
  POST_PCI_PRESET_FOR,
  POST_PCI_VARIANT_DECISION,
  PHYS_BY_ID,
  LEFT_MAIN_PRESET_BY_ID,
  ffr,
  largestPullbackStep,
  postPciAboveGood,
  postPciAlgorithm,
  postPciCaseFromStent,
  postPciLow,
  postPciTeaching,
  postPciLosses,
  postPciVariantOf,
  scorePostPciStudy,
  type CoronaryCase,
} from "../physiology";
import { BENCH_BY_ID, applyPrep, deploy, initialState, preImaging, type PrepAction } from "../pciBench";
import { POST_PCI_LAUNCH_ENABLED, POST_PCI_SCENARIOS, launch } from "../../content/lab/presets/physiology/postPci.launch";
import { TRACKS, PUBLISHED_CASES } from "../../content";
import { validateLaunchLinks, type LaunchFiles } from "../../content/validateLaunch";
import { PRACTICE_INDEX, buildPracticeIndex, practiceForLesson, type PracticeIndex } from "../../ui/content/practiceIndex";
import { benchPostPciHandover, benchPostPciVariant, postPciHandoffAvailable, postPciInputFromBench } from "../../ui/bench/AssessPanel";
import { makeTransfer } from "../../state/useLabHandoverStore";

const P = (id: string) => POST_PCI_PRESET_BY_ID[id];

describe("the post-PCI presets", () => {
  it("are four, one per branch of the algorithm, with titles that do not give the answer away and ids of their own", () => {
    expect(POST_PCI_PRESETS.map((p) => p.id)).toEqual(["post-pci-instent-step", "post-pci-focal-edge", "post-pci-diffuse", "post-pci-good"]);
    expect(POST_PCI_PRESETS.map((p) => p.case.decision).sort()).toEqual([...POST_PCI_DECISIONS].sort());
    for (const p of POST_PCI_PRESETS) {
      expect(p.title, p.id).not.toMatch(/stent(ed)? (step|edge)|edge|diffuse|good|underexpan|in-stent|focal|accept|post-dilat|0\.9/i);
      expect(p.brief, p.id).not.toMatch(/underexpan|in-stent step|focal step|edge lesion|0\.9\d|ffr|irregular|diffuse|long|angiographic result|looks acceptable/i);
      expect(PHYS_BY_ID[p.id], p.id).toBeUndefined();
      expect(LEFT_MAIN_PRESET_BY_ID[p.id], p.id).toBeUndefined();
      expect(p.case.stent, p.id).toBeDefined();
      expect(p.case.teaching.length, p.id).toBeGreaterThan(40);
    }
    expect(POST_PCI_PRESET_FOR).toEqual({ instent: "post-pci-instent-step", edge: "post-pci-focal-edge", diffuse: "post-pci-diffuse", good: "post-pci-good" });
  });

  it("each preset's decision is the one Brilakis's algorithm gives on its own physics", () => {
    for (const p of POST_PCI_PRESETS) {
      expect(postPciAlgorithm(p.case), p.id).toBe(p.case.decision);
      expect(postPciVariantOf(p.case), p.id).toBe(p.variant);
    }
  });

  it("the in-stent variant's largest gradient lies inside the stented segment; the good variant's final FFR exceeds 0.91 (acceptance)", () => {
    const inStent = P("post-pci-instent-step").case;
    const step = largestPullbackStep(inStent);
    expect(step.inStent).toBe(true);
    expect(step.x).toBeGreaterThanOrEqual(inStent.stent!.from);
    expect(step.x).toBeLessThanOrEqual(inStent.stent!.to);
    // and the value that triggers the pullback: FFR 0.80 or less
    expect(ffr(inStent)).toBeLessThanOrEqual(CUTOFF.ffr);
    const good = P("post-pci-good").case;
    expect(ffr(good)).toBeGreaterThan(POST_PCI_GOOD_FFR);
    expect(POST_PCI_GOOD_FFR).toBe(0.91);
  });

  it("the focal edge variant steps outside the stent, beyond its distal edge; the diffuse variant falls without a dominant step", () => {
    const edge = P("post-pci-focal-edge").case;
    const e = largestPullbackStep(edge);
    expect(e.inStent).toBe(false);
    expect(e.x).toBeGreaterThan(edge.stent!.to);
    expect(ffr(edge)).toBeLessThanOrEqual(CUTOFF.ffr);
    const L = postPciLosses(edge);
    expect(L.focalOutside).toBeGreaterThan(L.inStent * 5);

    const diffuse = P("post-pci-diffuse").case;
    expect(ffr(diffuse)).toBeLessThanOrEqual(CUTOFF.ffr);
    const D = postPciLosses(diffuse);
    expect(D.focalOutside).toBe(0);
    expect(D.diffuseOutside).toBeGreaterThan(D.inStent);
    // no point of the pullback carries more than a few hundredths: a slope, not a step
    expect(largestPullbackStep(diffuse).drop).toBeLessThan(0.02);
  });

  it("grading: the decision against the case's, and the pullback whenever the value was low", () => {
    const c = P("post-pci-instent-step").case;
    expect(scorePostPciStudy(c, { measured: true, pulledBack: true, decision: "post-dilate" }).passed).toBe(true);
    // right answer, but no pullback before deciding on a low value
    const noPb = scorePostPciStudy(c, { measured: true, pulledBack: false, decision: "post-dilate" });
    expect(noPb.decisionCorrect).toBe(true);
    expect(noPb.pullbackNeeded).toBe(true);
    expect(noPb.passed).toBe(false);
    expect(scorePostPciStudy(c, { measured: true, pulledBack: true, decision: "treat-edge" }).passed).toBe(false);
    // a good result needs no pullback
    const g = P("post-pci-good").case;
    expect(scorePostPciStudy(g, { measured: true, pulledBack: false, decision: "accept-result" })).toMatchObject({ passed: true, pullbackNeeded: false });
    expect(scorePostPciStudy(g, { measured: true, pulledBack: false, decision: "accept-diffuse" }).passed).toBe(false);
  });

  it("compares the cut-offs on the value as shown (two decimals)", () => {
    // 0.913 is shown as 0.91: not above 0.91
    expect(postPciAboveGood(0.913)).toBe(false);
    expect(postPciAboveGood(0.916)).toBe(true);
    expect(postPciTeaching("accept-result", 0.913)).not.toContain("above 0.91, the value");
    expect(postPciTeaching("accept-result", 0.98)).toContain("above 0.91, the value");
    // 0.803 is shown as 0.80: low, and the pullback is asked for
    expect(postPciLow({ ffr: 0.803, wfp: 0.95 })).toBe(true);
    expect(postPciLow({ ffr: 0.806, wfp: 0.95 })).toBe(false);
    expect(postPciLow({ ffr: 0.9, wfp: 0.894 })).toBe(true);
  });

  it("the teaching names no raw lesson id", () => {
    for (const p of POST_PCI_PRESETS) expect(p.case.teaching, p.id).not.toMatch(/\bpm-[a-z-]+/);
    for (const d of POST_PCI_DECISIONS) for (const v of [0.85, 0.98]) expect(postPciTeaching(d, v)).not.toMatch(/\bpm-[a-z-]+/);
  });
});

// --- the bench's stent ------------------------------------------------------------------------------

const prep = (id: string, actions: PrepAction[]) => actions.reduce((s, a) => applyPrep(BENCH_BY_ID[id], s, a), initialState());

/** The focal LAD stented at low pressure and not post-dilated: the stent opens to about 70% (a waist). */
function underexpandedFocalLad() {
  const l = BENCH_BY_ID["focal-lad"];
  const p = preImaging(l, "IVUS");
  const r = deploy(l, prep("focal-lad", [{ kind: "balloon", balloon: "semi-compliant", diameter: 2.5, atm: 10 }]), { diameter: 3.0, lengthMm: 18, proxEdge: p.landingProx - 1, atm: 9.8 }, [], "IVUS");
  return { l, r };
}

describe("from the bench (acceptance)", () => {
  it("a bench result with 70% expansion produces an in-stent step case when handed over", () => {
    const { l, r } = underexpandedFocalLad();
    expect(r.expansion).toBeGreaterThan(67);
    expect(r.expansion).toBeLessThan(73);
    expect(r.geographicMiss).toBe(false);
    const h = benchPostPciHandover(l, r);
    expect(h.lumenVariant).toBe("instent");
    expect(h.presetId).toBe("post-pci-instent-step");
    // the case built from the stent (context only): its largest pullback gradient lies inside the stented segment
    const step = largestPullbackStep(h.builtCase);
    expect(step.inStent).toBe(true);
    expect(h.builtCase.lesions.find((x) => x.id === "in-stent")!.ds).toBeCloseTo(1 - Math.sqrt(r.expansion / 100), 6);
    // the hand-over: the lab opens the preset (params.scenario), which reads low with its loss in the stent
    expect(h.transfer).toMatchObject({ to: "physiology", from: "pci-bench", params: { scenario: "post-pci-instent-step" } });
    const opened = P(h.transfer.params!.scenario as string).case;
    expect(ffr(opened)).toBeLessThanOrEqual(CUTOFF.ffr);
    expect(opened.decision).toBe("post-dilate");
    expect(largestPullbackStep(opened).inStent).toBe(true);
    expect(h.transfer.events).toContain("stent-underexpanded");
    const t = makeTransfer(h.transfer, 1);
    const payload = t.payload as { postPci: { lumenVariant: string; presetId: string; physicsDecision: string; builtCase: CoronaryCase } };
    expect(payload.postPci.lumenVariant).toBe("instent");
    expect(payload.postPci.presetId).toBe(h.transfer.params!.scenario);
    expect(payload.postPci.physicsDecision).toBe(h.builtCase.decision);
    expect(payload.postPci.builtCase.lesions).toEqual(h.builtCase.lesions);
    // copied, not shared
    expect(payload.postPci.builtCase).not.toBe(h.builtCase);
    // KNOWN CALIBRATION (docs/realism/facts/pkg-physiology-post-pci-handover.md, "What the physics gives for
    // bench stents"): under GEOM_A/GEOM_B the 70% stent's own case reads about 0.97, above the cut-off, so
    // its physics is graded 'accept the result' while its lumen names the in-stent step. That is why the
    // lab opens the preset and the payload case is context only. A recalibration that lowers this value
    // fails here on purpose: revisit the hand-over's meaning then.
    expect(ffr(h.builtCase)).toBeGreaterThan(CUTOFF.ffr);
    expect(h.builtCase.decision).toBe("accept-result");
    expect(payload.postPci.physicsDecision).not.toBe(opened.decision);
    // the bench studies the case the lab opens, so both grade this stent alike
    expect(h.case).toBe(opened);
    expect(h.case.decision).toBe(POST_PCI_VARIANT_DECISION[h.lumenVariant]);
  });

  it("a severely underexpanded stent (calcium left unmodified) is the in-stent variant, its loss inside the stent, graded on its own physics", () => {
    const l = BENCH_BY_ID["calcified-rca"];
    const r = deploy(l, prep("calcified-rca", [{ kind: "balloon", balloon: "non-compliant", diameter: 3.0, atm: 14 }]), { diameter: 3.5, lengthMm: 23, proxEdge: 9, atm: 14 }, [], "IVUS");
    expect(r.expansion).toBeLessThan(50);
    const h = benchPostPciHandover(l, r);
    expect(h.lumenVariant).toBe("instent");
    expect(h.presetId).toBe("post-pci-instent-step");
    expect(largestPullbackStep(h.builtCase).inStent).toBe(true);
    const L = postPciLosses(h.builtCase);
    expect(L.inStent).toBeGreaterThan(L.proximal + L.distal);
    // the waist is a tapering stretch of the stent, longer than its narrowest point
    expect(h.builtCase.lesions.find((x) => x.id === "in-stent")!.lengthMm).toBeGreaterThan(4);
    // KNOWN CALIBRATION (see the 70% test above): even this stent's own case reads about 0.96, so its
    // physics is graded 'accept the result'; a recalibration that changes this fails here on purpose
    expect(ffr(h.builtCase)).toBeGreaterThan(CUTOFF.ffr);
    expect(h.builtCase.decision).toBe("accept-result");
    expect(postPciAlgorithm(h.builtCase, L)).toBe(h.builtCase.decision);
  });

  it("an optimised stent is the good result; a stent that misses the lesion leaves a focal step beside it", () => {
    const l = BENCH_BY_ID["focal-lad"];
    const p = preImaging(l, "IVUS");
    const s = prep("focal-lad", [{ kind: "balloon", balloon: "semi-compliant", diameter: 2.5, atm: 10 }]);
    const good = deploy(l, s, { diameter: 3.0, lengthMm: 16, proxEdge: p.landingProx - 1, atm: 12 }, [{ diameter: 3.25, atm: 18, where: "full" }], "IVUS");
    expect(good.criteria.every((c) => c.ok)).toBe(true);
    expect(benchPostPciVariant(l, good)).toBe("good");
    const gh = benchPostPciHandover(l, good);
    expect(gh.presetId).toBe("post-pci-good");
    expect(gh.builtCase.decision).toBe("accept-result");
    expect(gh.transfer.events).toEqual([]);
    // a short stent placed proximal to the lesion: the distal part of the lesion is left uncovered
    const miss = deploy(l, s, { diameter: 3.0, lengthMm: 8, proxEdge: 9, atm: 12 }, [{ diameter: 3.25, atm: 18, where: "full" }], "IVUS");
    expect(miss.geographicMiss).toBe(true);
    const mh = benchPostPciHandover(l, miss);
    expect(mh.lumenVariant).toBe("edge");
    expect(mh.presetId).toBe("post-pci-focal-edge");
    expect(mh.builtCase.lesions.some((x) => x.id === "distal-edge")).toBe(true);
    const step = largestPullbackStep(mh.builtCase);
    expect(step.inStent).toBe(false);
    expect(step.x).toBeGreaterThan(mh.builtCase.stent!.to);
    // the bench's study and the lab grade the same case: stent the focal step, not 'accept the result'
    expect(mh.case).toBe(P("post-pci-focal-edge").case);
    expect(mh.case.decision).toBe(POST_PCI_VARIANT_DECISION[mh.lumenVariant]);
    expect(mh.case.decision).toBe("treat-edge");
    expect(gh.case.decision).toBe(POST_PCI_VARIANT_DECISION[gh.lumenVariant]);
  });

  it("the input reads the coronary part only: the stent profile and reference lumens of the bench", () => {
    const { l, r } = underexpandedFocalLad();
    const inp = postPciInputFromBench(l, r);
    expect(inp.stentFromMm).toBe(r.x0);
    expect(inp.stentToMm).toBe(r.x1);
    expect(inp.stentProfile.length).toBe(r.profile.length);
    expect(inp.expansionPct).toBe(r.expansion);
    const built = postPciCaseFromStent(inp);
    expect(built.stent!.from).toBeLessThan(built.stent!.to);
    expect(built.refDiamMm).toBeCloseTo((inp.proxRefMm + inp.distRefMm) / 2, 9);
  });
});

// --- launch metadata and the practice index ------------------------------------------------------------

const LAUNCH_FILES = import.meta.glob<LaunchFiles[string]>(["/src/**/*.launch.ts", "!/src/**/__fixtures__/**"], { eager: true });
const POST_PCI_FILE = "/src/content/lab/presets/physiology/postPci.launch.ts";
const ENABLED_INDEX: PracticeIndex = buildPracticeIndex({ ...LAUNCH_FILES, [POST_PCI_FILE]: { launch: { sim: "physiology", scenarios: POST_PCI_SCENARIOS } } });

describe("launch metadata and the practice index (acceptance)", () => {
  it("postPci.launch.ts declares every preset and no other, with the presets' own titles, and publishes all or none as POST_PCI_LAUNCH_ENABLED says", () => {
    expect(Object.keys(LAUNCH_FILES)).toContain(POST_PCI_FILE);
    expect(launch.sim).toBe("physiology");
    expect(POST_PCI_SCENARIOS.map((s) => s.id).sort()).toEqual(POST_PCI_PRESETS.map((p) => p.id).sort());
    for (const p of POST_PCI_PRESETS) expect(POST_PCI_SCENARIOS.find((s) => s.id === p.id)!.title, p.id).toBe(p.title);
    expect(launch.scenarios).toEqual(POST_PCI_LAUNCH_ENABLED ? POST_PCI_SCENARIOS : []);
    const known = PRACTICE_INDEX.known.scenarios.get("physiology");
    for (const s of POST_PCI_SCENARIOS) expect(known?.has(s.id) ?? false, s.id).toBe(POST_PCI_LAUNCH_ENABLED);
  });

  it("published, the scenarios validate against the curriculum", () => {
    expect(ENABLED_INDEX.known.problems).toEqual([]);
    expect(validateLaunchLinks({ tracks: TRACKS, cases: PUBLISHED_CASES }, ENABLED_INDEX.known)).toEqual([]);
  });

  it("practiceIndex lists every scenario in src/content/lab/presets/physiology/postPci.launch.ts under lessons pm-physiology-after-pci (once published)", () => {
    const under = (index: PracticeIndex) => practiceForLesson("pm-physiology-after-pci", index).filter((e) => e.sim === "physiology").map((e) => e.scenario);
    for (const s of POST_PCI_SCENARIOS) {
      expect(s.lessonIds).toContain("pm-physiology-after-pci");
      expect(under(ENABLED_INDEX), s.id).toContain(s.id);
      // the running index: listed exactly when the file publishes them (no dead links while held back)
      expect(under(PRACTICE_INDEX).includes(s.id), s.id).toBe(POST_PCI_LAUNCH_ENABLED);
    }
    const entry = practiceForLesson("pm-physiology-after-pci", ENABLED_INDEX).find((e) => e.scenario === "post-pci-good")!;
    expect(entry.params).toEqual({ scenario: "post-pci-good", mode: "guided" });
  });

  it("the bench's hand-over button finds its preset exactly when the presets are published", () => {
    for (const id of Object.values(POST_PCI_PRESET_FOR)) {
      expect(postPciHandoffAvailable(id, ENABLED_INDEX), id).toBe(true);
      expect(postPciHandoffAvailable(id), id).toBe(POST_PCI_LAUNCH_ENABLED);
    }
  });
});
