// The bifurcation bench (pci-bench-bifurcation): kissing, POT, Finet, the DK crush failure states, the
// order of the steps and the shared step catalogue.
//   npx vitest run src/simulation/bench/bifurcation.test.ts
import { describe, expect, it } from "vitest";
import {
  BIF_BY_ID,
  BIF_PRESETS,
  BENCH_TECHNIQUES,
  CRUSH_KISS_COVERAGE,
  MP_ROUND_OVAL_INDEX,
  MP_SCORE_MAJOR,
  MP_SCORE_MINOR,
  applyStep,
  bestKissPair,
  bifMetrics,
  bifOutcome,
  bifStartState,
  bifTipContext,
  canEscalate,
  chooseTechnique,
  currentStep,
  defaultTechnique,
  escalate,
  finetDiameter,
  isFinished,
  kissPairAccepted,
  newBifState,
  plannedTechniques,
  referenceInput,
  runReference,
  shownStep,
  type BifState,
  type StepInput,
} from "./bifurcation";
import { TECHNIQUE_STEPS, resolveStep, stepById, stepCount, tipStepRanges } from "../pci/technique/steps";
import { BIF_TECHNIQUES, TIP_BY_ID } from "../../content/lab/tips";

/** Do the current step with the reference choices, changed by `over`. */
function step(s: BifState, id: string, over: StepInput = {}): BifState {
  const st = currentStep(s)!;
  expect(st.id, `expected to be at ${id}`).toBe(id);
  const r = applyStep(s, id, { ...referenceInput(BIF_BY_ID[s.presetId], s.technique!, st), ...over });
  expect(r.ok, r.message).toBe(true);
  return r.state;
}

/** A run of a preset's technique up to (not including) step id. */
function upTo(presetId: string, technique: string, id: string): BifState {
  const s = bifStartState(presetId, { technique, start: id });
  expect(s, `${presetId} ${technique} ${id}`).not.toBeNull();
  return s!;
}

const kinds = (s: BifState) => s.findings.map((f) => f.kind);

describe("the step catalogue", () => {
  it("numbers each technique's steps 1..n from the module's lists, with unique ids", () => {
    const counts = Object.fromEntries(BIF_TECHNIQUES.map((t) => [t, stepCount(t)]));
    expect(counts).toEqual({ provisional: 10, "dk-crush": 17, culotte: 11, "t-stent": 6, tap: 8, "reverse-crush": 11, "mini-crush": 9, "v-stent": 4, sks: 4 });
    for (const t of BIF_TECHNIQUES) {
      const steps = TECHNIQUE_STEPS[t].steps;
      expect(steps.map((s) => s.n)).toEqual(steps.map((_, i) => i + 1));
      expect(new Set(steps.map((s) => s.id)).size, t).toBe(steps.length);
    }
    // the module's numbers for the steps the tips and the lessons name
    expect(stepById("dk-crush", "crush")?.n).toBe(6);
    expect(stepById("dk-crush", "first-kiss")?.n).toBe(9);
    expect(stepById("dk-crush", "final-pot")?.n).toBe(16);
    expect(stepById("culotte", "pot")?.n).toBe(4);
    expect(stepById("tap", "set-protrusion")?.n).toBe(3);
    expect(stepById("tap", "final-pot")?.n).toBe(7);
    expect(stepById("provisional", "rewire-distal-cell")?.n).toBe(7);
    expect(resolveStep("dk-crush", "6")?.id).toBe("crush");
    expect(resolveStep("dk-crush", "crush")?.n).toBe(6);
    expect(resolveStep("dk-crush", "nope")).toBeUndefined();
  });

  it("every tip a step names exists, and tipStepRanges derives the step ranges the triggers would carry", () => {
    for (const c of Object.values(TECHNIQUE_STEPS)) for (const s of c.steps) for (const id of s.tips ?? []) expect(TIP_BY_ID[id], `${c.technique} ${s.id}: ${id}`).toBeTruthy();
    const r = tipStepRanges();
    expect(r["pci-dkcrush-sb-protrusion"]).toEqual([{ technique: "dk-crush", step: [2, 2] }]);
    expect(r["pci-twostent-two-step-kiss"]).toEqual([{ technique: "dk-crush", step: [9, 15] }]);
    expect(r["pci-tap-final-pot"]).toEqual([{ technique: "tap", step: [7, 7] }]);
  });

  it("the bench reports the catalogue's step numbers in its tip context", () => {
    for (const g of BIF_PRESETS) {
      for (const t of BENCH_TECHNIQUES) {
        const s = bifStartState(g.id, { technique: t, start: "1" });
        if (!s) continue;
        let x = s;
        while (!isFinished(x)) {
          const st = currentStep(x)!;
          const ctx = bifTipContext(x);
          expect(ctx.technique).toBe(t);
          expect(ctx.step).toBe(TECHNIQUE_STEPS[t].steps[x.next - 1].n);
          expect(ctx.phase).toBe(st.phase);
          x = step(x, st.id);
        }
      }
    }
  });
});

describe("steps unlock in order", () => {
  it("a later step is refused until the one before is done; the plan comes first", () => {
    const s0 = newBifState("bif-dk-crush");
    expect(applyStep(s0, "park-mv-balloon").ok).toBe(false);
    expect(bifTipContext(s0).phase).toBe("plan");
    const s1 = chooseTechnique(s0, "dk-crush").state;
    const r = applyStep(s1, "crush", { balloonMm: 3.0 });
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/Step 6 is not open yet: do step 1/);
    expect(r.state).toBe(s1);
    const s2 = step(s1, "park-mv-balloon");
    expect(s2.next).toBe(2);
    expect(applyStep(s2, "deploy-sb-stent").ok).toBe(false);
  });

  it("devices cannot be skipped; an optional step can", () => {
    const s = upTo("bif-dk-crush", "dk-crush", "crush");
    expect(applyStep(s, "crush", { skip: true }).ok).toBe(false);
    // a rewiring the later steps need cannot be left out either
    expect(applyStep(upTo("bif-dk-crush", "dk-crush", "rewire-proximal-strut"), "rewire-proximal-strut", { skip: true }).ok).toBe(false);
    expect(applyStep(upTo("bif-culotte", "culotte", "rewire-distal-cell"), "rewire-distal-cell", { skip: true }).ok).toBe(false);
    const p = upTo("bif-provisional", "provisional", "rewire-distal-cell");
    const r = applyStep(p, "rewire-distal-cell", { skip: true });
    expect(r.ok).toBe(true);
    expect(r.state.findings.length).toBe(p.findings.length);
  });

  it("a scripted run of each technique the bench builds reaches its last step with every step valid", () => {
    const runs: [string, string][] = [
      ["bif-provisional", "provisional"],
      ["bif-dk-crush", "dk-crush"],
      ["bif-culotte", "culotte"],
      ["bif-tap", "tap"],
      ["bif-tap", "reverse-crush"],
    ];
    for (const [id, t] of runs) {
      const s = bifStartState(id, { technique: t, start: "1" })!;
      const done = runReference(s, 99);
      expect(isFinished(done), `${id} ${t}`).toBe(true);
      const own = done.history.filter((h) => h.technique === t);
      expect(own.length, `${id} ${t}`).toBe(stepCount(t as "tap"));
      const bad = done.findings.filter((f) => f.severity !== "minor" && f.kind !== "technique-choice");
      expect(bad, `${id} ${t}`).toEqual([]);
      expect(own.every((h) => h.valid), `${id} ${t}`).toBe(true);
    }
  });
});

describe("kissing: one-step versus two-step", () => {
  it("a two-step kiss leaves less metal across the SB ostium than a one-step kiss (DK crush, both kisses)", () => {
    const at = upTo("bif-dk-crush", "dk-crush", "first-kiss");
    const one = step(at, "first-kiss", { kiss: "one-step" });
    const two = step(at, "first-kiss", { kiss: "two-step" });
    expect(bifMetrics(two).sbOstiumMetalPct).toBeLessThan(bifMetrics(one).sbOstiumMetalPct);
    // the crushed layers give Ormiston's micro-CT figures
    expect(bifMetrics(one).sbOstiumMetalPct).toBe(Math.round(CRUSH_KISS_COVERAGE["one-step"] * 100));
    expect(bifMetrics(two).sbOstiumMetalPct).toBe(Math.round(CRUSH_KISS_COVERAGE["two-step"] * 100));
    expect(kinds(one)).toContain("one-step-kiss");

    const at2 = upTo("bif-dk-crush", "dk-crush", "second-kiss");
    expect(bifMetrics(step(at2, "second-kiss", { kiss: "two-step" })).sbOstiumMetalPct).toBeLessThan(bifMetrics(step(at2, "second-kiss", { kiss: "one-step" })).sbOstiumMetalPct);
  });

  it("the same holds for a single jailing layer (provisional), and a proximal-cell rewiring leaves more metal", () => {
    const at = upTo("bif-provisional", "provisional", "kiss");
    expect(bifMetrics(step(at, "kiss", { kiss: "two-step" })).sbOstiumMetalPct).toBeLessThan(bifMetrics(step(at, "kiss", { kiss: "one-step" })).sbOstiumMetalPct);
    const rw = upTo("bif-provisional", "provisional", "rewire-distal-cell");
    const viaProx = step(step(rw, "rewire-distal-cell", { cell: "proximal" }), "kiss");
    const viaDist = step(step(rw, "rewire-distal-cell", { cell: "distal" }), "kiss");
    expect(bifMetrics(viaProx).sbOstiumMetalPct).toBeGreaterThan(bifMetrics(viaDist).sbOstiumMetalPct);
    expect(kinds(viaProx)).toContain("wrong-cell");
  });
});

describe("POT after kissing", () => {
  it("a final POT with the distal marker at the carina corrects the oval index the kiss leaves", () => {
    const kissed = step(upTo("bif-provisional", "provisional", "kiss"), "kiss");
    expect(bifMetrics(kissed).ovalIndex).toBeGreaterThan(MP_ROUND_OVAL_INDEX);
    const potted = step(kissed, "final-pot", { balloonMm: 3.5, markerMm: 0 });
    expect(bifMetrics(potted).ovalIndex).toBeLessThanOrEqual(MP_ROUND_OVAL_INDEX);
    expect(kinds(potted)).not.toContain("distal-overstretch");
    // DK crush: the final POT after the second kiss does the same
    const dk = step(upTo("bif-dk-crush", "dk-crush", "second-kiss"), "second-kiss");
    expect(bifMetrics(dk).ovalIndex).toBeGreaterThan(MP_ROUND_OVAL_INDEX);
    expect(bifMetrics(step(dk, "final-pot", { balloonMm: 4.0, markerMm: 0 })).ovalIndex).toBeLessThanOrEqual(MP_ROUND_OVAL_INDEX);
  });

  it("a final POT beyond the carina flags distal overstretch; one too proximal leaves the carina segment oval", () => {
    const kissed = step(upTo("bif-provisional", "provisional", "kiss"), "kiss");
    const beyond = step(kissed, "final-pot", { balloonMm: 3.5, markerMm: 3 });
    expect(kinds(beyond)).toContain("distal-overstretch");
    expect(bifMetrics(beyond).distalStretchPct).toBeGreaterThan(110);
    expect(beyond.findings.find((f) => f.kind === "distal-overstretch")!.shows).toBe("image");
    const proximal = step(kissed, "final-pot", { balloonMm: 3.5, markerMm: -3 });
    expect(kinds(proximal)).toContain("pot-too-proximal");
    expect(bifMetrics(proximal).ovalIndex).toBeGreaterThan(MP_ROUND_OVAL_INDEX);
  });

  it("a POT balloon longer than the stent proximal to the carina, or beyond the platform's limit, is flagged", () => {
    const at = upTo("bif-provisional", "provisional", "pot");
    expect(kinds(step(at, "pot", { balloonLenMm: 15 }))).toContain("pot-too-long");
    expect(kinds(step(at, "pot", { balloonMm: 5.0 }))).toEqual(expect.arrayContaining(["pot-oversized", "pot-over-limit"]));
  });

  it("TAP: a final POT up to or across the neocarina crushes the protruding struts; just short of it does not", () => {
    const at = upTo("bif-tap", "tap", "final-pot");
    expect(bifMetrics(at).neocarinaMm).toBe(1.5);
    const across = step(at, "final-pot", { markerMm: 0 });
    expect(kinds(across)).toContain("neocarina-crushed");
    expect(bifMetrics(across).neocarinaMm).toBeLessThan(1.5);
    const short = step(at, "final-pot", { markerMm: -2 });
    expect(kinds(short)).not.toContain("neocarina-crushed");
    expect(bifMetrics(short).ovalIndex).toBeLessThanOrEqual(MP_ROUND_OVAL_INDEX);
  });
});

describe("Finet's law", () => {
  it("the effective diameter is 0.678 x the sum of the two balloons", () => {
    expect(finetDiameter(3.0, 2.5)).toBeCloseTo(0.678 * 5.5, 10);
    expect(finetDiameter(2.75, 2.5)).toBeCloseTo(3.5595, 4);
    for (const [a, b] of [[2, 2], [3.5, 3.0], [4.0, 2.75]]) expect(finetDiameter(a, b)).toBeCloseTo(0.678 * (a + b), 10);
  });

  it("a pair within 0.25 mm of the proximal reference is accepted, others are not (the module's examples in a 3.5 mm LAD)", () => {
    expect(kissPairAccepted(3.0, 2.5, 3.5)).toBe(true); // 3.73
    expect(kissPairAccepted(2.75, 2.5, 3.5)).toBe(true); // 3.56
    expect(kissPairAccepted(3.5, 2.5, 3.5)).toBe(false); // 4.07
    expect(kissPairAccepted(3.5, 3.0, 3.5)).toBe(false); // 4.41
    expect(kissPairAccepted(2.5, 2.0, 3.5)).toBe(false); // 3.05
    for (const g of BIF_PRESETS) {
      const p = bestKissPair(g);
      expect(kissPairAccepted(p.mv, p.sb, g.proxRefMm), g.id).toBe(true);
    }
  });

  it("the kiss reports its Finet diameter and flags an oversized pair", () => {
    const at = upTo("bif-provisional", "provisional", "kiss");
    const big = step(at, "kiss", { balloonMm: 3.5, sbBalloonMm: 2.5 });
    expect(bifMetrics(big).finetMm).toBeCloseTo(4.07, 2);
    expect(kinds(big)).toContain("kiss-oversized");
    expect(kinds(step(at, "kiss", { balloonMm: 2.75, sbBalloonMm: 2.5 }))).not.toContain("kiss-oversized");
  });
});

describe("DK crush failure states", () => {
  it("1 mm of SB stent protrusion is a failure state; 2-3 mm is not", () => {
    const at = upTo("bif-dk-crush", "dk-crush", "position-sb-stent");
    const short = step(at, "position-sb-stent", { protrusionMm: 1 });
    expect(short.failure?.kind).toBe("protrusion-short");
    expect(bifOutcome(short).passed).toBe(false);
    expect(bifOutcome(short).score).toBe(0);
    // a failed run takes no further step
    expect(applyStep(short, "deploy-sb-stent").ok).toBe(false);
    expect(step(at, "position-sb-stent", { protrusionMm: 2.5 }).failure).toBeNull();
    expect(step(at, "position-sb-stent", { protrusionMm: 2 }).failure).toBeNull();
  });

  it("a crush balloon sized to the proximal MV past the carina is a failure state; kept proximal, or sized distally, it is not", () => {
    const at = upTo("bif-dk-crush", "dk-crush", "crush");
    const past = step(at, "crush", { balloonMm: 4.0, markerMm: 2, potMm: undefined });
    expect(past.failure?.kind).toBe("crush-balloon-past-carina");
    expect(kinds(past)).toContain("distal-dissection");
    expect(bifTipContext(past).events).toContain("dissection");
    // the run has ended at the crush: the tips and the step list report that step, not the next one
    const crushStep = stepById("dk-crush", "crush")!;
    expect(shownStep(past)?.n).toBe(crushStep.n);
    expect(bifTipContext(past)).toMatchObject({ step: crushStep.n, phase: crushStep.phase, technique: "dk-crush" });
    expect(step(at, "crush", { balloonMm: 4.0, markerMm: -1 }).failure).toBeNull();
    expect(step(at, "crush", { balloonMm: 3.0, markerMm: 2 }).failure).toBeNull();
    // a distally sized crush without the POT that follows it is a finding, not a failure
    const noPot = applyStep(at, "crush", { balloonMm: 3.0, markerMm: 0 }).state;
    expect(kinds(noPot)).toContain("crush-not-optimised");
    expect(noPot.failure).toBeNull();
  });

  it("a distal-strut first rewiring or a proximal-strut second rewiring is flagged", () => {
    expect(kinds(step(upTo("bif-dk-crush", "dk-crush", "rewire-proximal-strut"), "rewire-proximal-strut", { cell: "distal" }))).toContain("wrong-cell");
    expect(kinds(step(upTo("bif-dk-crush", "dk-crush", "rewire-distal-strut"), "rewire-distal-strut", { cell: "proximal" }))).toContain("wrong-cell");
  });
});

describe("culotte, TAP and the other outputs", () => {
  it("culotte: the double layer is the overlap in the proximal MV; no POT before recrossing and no final kiss are flagged", () => {
    const done = runReference(bifStartState("bif-culotte", { technique: "culotte", start: "1" })!, 99);
    expect(bifMetrics(done).doubleLayerMm).toBe(8);
    const noPot = applyStep(upTo("bif-culotte", "culotte", "pot"), "pot", { skip: true }).state;
    expect(kinds(step(noPot, "rewire-distal-cell"))).toContain("wire-behind-stent");
    const noKiss = applyStep(upTo("bif-culotte", "culotte", "kiss"), "kiss", { skip: true }).state;
    expect(kinds(noKiss)).toContain("double-layer-underexpanded");
    const firstMv = step(upTo("bif-culotte", "culotte", "first-stent"), "first-stent", { branch: "mv", stentMm: 3.0 });
    expect(kinds(firstMv)).toContain("culotte-first-branch");  });

  it("culotte: the teaching geometry follows Finet, so a kiss sized 1:1 to both branches fits the proximal MV", () => {
    const g = BIF_BY_ID["bif-culotte"];
    expect(g.distRefMm).toBe(g.sbRefMm);
    expect(Math.abs(finetDiameter(g.distRefMm, g.sbRefMm) - g.proxRefMm)).toBeLessThanOrEqual(0.25);
    expect(bestKissPair(g)).toMatchObject({ mv: g.distRefMm, sb: g.sbRefMm });
    const kissed = step(upTo("bif-culotte", "culotte", "kiss"), "kiss", { balloonMm: g.distRefMm, sbBalloonMm: g.sbRefMm });
    expect(kinds(kissed)).not.toContain("kiss-oversized");
    expect(kinds(kissed)).not.toContain("kiss-undersized");
    const done = runReference(bifStartState("bif-culotte", { technique: "culotte", start: "1" })!, 99);
    expect(done.findings.filter((f) => f.severity !== "minor").map((f) => f.kind)).toEqual([]);
  });

  it("TAP: the neocarina equals the protrusion, more than 2 mm lengthens it, and deflating the SB balloon first is flagged", () => {
    const at = upTo("bif-tap", "tap", "set-protrusion");
    expect(kinds(step(at, "set-protrusion", { protrusionMm: 3 }))).toContain("protrusion-long");
    const kissAt = upTo("bif-tap", "tap", "kiss");
    expect(kinds(step(kissAt, "kiss", { deflate: "sb-first" }))).toContain("deflate-order");
    expect(bifMetrics(step(kissAt, "kiss", { deflate: "sb-first" })).sbOstiumMetalPct).toBeGreaterThan(bifMetrics(step(kissAt, "kiss")).sbOstiumMetalPct);
  });

  it("provisional: a stent sized to the proximal MV shifts the carina; too little stent proximal to the carina is flagged", () => {
    const at = upTo("bif-provisional", "provisional", "position-mv-stent");
    expect(kinds(step(at, "position-mv-stent", { stentMm: 3.5 }))).toContain("carina-shift");
    expect(kinds(step(at, "position-mv-stent", { proxMm: 4 }))).toContain("mv-stent-short");
  });

  it("provisional: the jailed SB raises side-branch-compromise; the kiss through a distal cell clears it on a mildly diseased branch", () => {
    const before = upTo("bif-provisional", "provisional", "deploy-mv-stent");
    expect(bifTipContext(before).events).not.toContain("side-branch-compromise");
    const jailed = step(before, "deploy-mv-stent");
    expect(bifTipContext(jailed).events).toContain("side-branch-compromise");
    const rewired = step(step(jailed, "pot"), "assess-sb");
    const kissed = step(step(rewired, "rewire-distal-cell"), "kiss");
    expect(bifTipContext(kissed).events).not.toContain("side-branch-compromise");
  });

  it("TAP preset: the diagonal stays compromised after the provisional sequence, so the run escalates; reverse crush at 80 degrees is flagged", () => {
    const prov = runReference(bifStartState("bif-tap", { technique: "provisional", start: "1" })!, stepCount("provisional"));
    expect(prov.sbCompromised).toBe(true);
    expect(canEscalate(prov)).toBe(true);
    expect(escalate(prov, "culotte").ok).toBe(false);
    const tap = escalate(prov, "tap").state;
    expect(tap.technique).toBe("tap");
    expect(tap.next).toBe(1);
    expect(bifTipContext(tap).events).toContain("side-branch-compromise");
    const rc = escalate(prov, "reverse-crush").state;
    expect(kinds(rc)).toContain("technique-choice");
    // a mildly diseased branch does not need escalating, and that preset offers no bail-out
    const mild = runReference(bifStartState("bif-provisional", { start: "1" })!, stepCount("provisional"));
    expect(canEscalate(mild)).toBe(false);
    expect(escalate(mild, "tap").ok).toBe(false);
    // the bail-out's name, not its id
    expect(escalate(prov, "tap").message).toBe("Bail-out: TAP (T and protrusion).");
    // the bail-out comes before the provisional run's final assessment, which logs the run
    const assessed = step(prov, "final-assessment");
    expect(escalate(assessed, "tap").ok).toBe(false);
    expect(kinds(assessed)).toContain("sb-left-compromised");
  });

  it("the left main preset reports vessel LM and left-main-lesion; culotte there is a flagged choice", () => {
    const s = newBifState("bif-dk-crush");
    expect(bifTipContext(s).vessel).toBe("LM");
    expect(bifTipContext(s).events).toEqual(expect.arrayContaining(["bifurcation", "left-main-lesion"]));
    expect(kinds(chooseTechnique(s, "culotte").state)).toContain("technique-choice");
    expect(chooseTechnique(s, "tap").ok).toBe(false);
  });

  it("launch starts: by step id or number, plan by default; unknown ones are null", () => {
    expect(bifStartState("bif-dk-crush")!.technique).toBeNull();
    expect(bifStartState("bif-dk-crush", { start: "crush" })!.next).toBe(6);
    expect(bifStartState("bif-dk-crush", { technique: "dk-crush", start: "6" })!.next).toBe(6);
    expect(bifStartState("bif-tap", { start: "set-protrusion" })!.technique).toBe("tap");
    expect(bifStartState("bif-tap", { start: "tap:final-pot" })!.technique).toBe("tap");
    expect(bifStartState("bif-tap", { start: "tap:final-pot" })!.next).toBe(7);
    expect(bifStartState("bif-tap", { start: "final-pot" })!.technique).toBe("provisional");
    expect(bifStartState("bif-tap", { start: "wire-both" })!.technique).toBe("provisional");
    expect(bifStartState("bif-dk-crush", { start: "neocarina" })).toBeNull();
    expect(bifStartState("bif-nope")).toBeNull();
    expect(bifStartState("bif-provisional", { technique: "tap" })).toBeNull();
    // a technique the preset offers but flags opens, with the flag kept for the debrief
    const flagged = bifStartState("bif-provisional", { technique: "dk-crush" })!;
    expect(flagged.technique).toBe("dk-crush");
    expect(kinds(flagged)).toContain("technique-choice");
  });
});

describe("the review's fixes", () => {
  it("every preset offers a real technique choice, in the catalogue's order, and a flagged choice is named in the debrief", () => {
    const order = BENCH_TECHNIQUES.filter((t) => t !== "tap" && t !== "reverse-crush");
    for (const g of BIF_PRESETS) {
      const offered = plannedTechniques(g).map((o) => o.technique);
      expect(offered.length, g.id).toBeGreaterThanOrEqual(2);
      expect(offered, g.id).toEqual(order.filter((t) => offered.includes(t)));
      for (const o of plannedTechniques(g)) expect(o.source.length, `${g.id} ${o.technique}`).toBeGreaterThan(0);
      // a launch without a technique runs the preset's best one
      expect(g.techniques.find((o) => o.technique === defaultTechnique(g))?.verdict, g.id).toBe("best");
      const flag = plannedTechniques(g).find((o) => o.verdict === "flag");
      if (flag) {
        const f = chooseTechnique(newBifState(g.id), flag.technique).state.findings.find((x) => x.kind === "technique-choice");
        expect(f, `${g.id} ${flag.technique}`).toMatchObject({ step: 0, stepId: "plan", shows: "debrief" });
      }
    }
    expect(defaultTechnique(BIF_BY_ID["bif-tap"])).toBe("provisional");
    expect(defaultTechnique(BIF_BY_ID["bif-culotte"])).toBe("culotte");
  });

  it("each offered technique runs on each preset with the module's choices", () => {
    for (const g of BIF_PRESETS) {
      for (const o of plannedTechniques(g)) {
        const done = runReference(bifStartState(g.id, { technique: o.technique, start: "1" })!, 99);
        expect(isFinished(done), `${g.id} ${o.technique}`).toBe(true);
      }
    }
    // provisional on the culotte and left main presets can bail out to reverse crush (under 70 degrees)
    for (const id of ["bif-culotte", "bif-dk-crush"]) {
      const prov = runReference(bifStartState(id, { technique: "provisional", start: "1" })!, stepCount("provisional"));
      const rc = escalate(prov, "reverse-crush");
      expect(rc.ok, `${id}: ${rc.message}`).toBe(true);
      expect(kinds(rc.state)).not.toContain("technique-choice");
      expect(isFinished(runReference(rc.state, 99)), id).toBe(true);
    }
  });

  it("provisional step 6 takes the learner's judgement of the side branch and names a wrong one only in the debrief", () => {
    const at = upTo("bif-provisional", "provisional", "assess-sb");
    expect(at.sbCompromised).toBe(true);
    const right = applyStep(at, "assess-sb", { sbJudged: "compromised" });
    const wrong = applyStep(at, "assess-sb", { sbJudged: "open" });
    expect(right.ok && wrong.ok).toBe(true);
    expect(kinds(right.state)).not.toContain("sb-misjudged");
    expect(wrong.state.findings.find((f) => f.kind === "sb-misjudged")).toMatchObject({ severity: "minor", shows: "debrief" });
    // the message does not say what the branch looks like
    for (const r of [right, wrong]) expect(r.message).not.toMatch(/narrowed|looks open/);
  });

  it("a bail-out on a side branch that is not compromised is taken and named in the debrief", () => {
    const prov = runReference(bifStartState("bif-tap", { technique: "provisional", start: "1" })!, stepCount("provisional"));
    const open: BifState = { ...prov, sbCompromised: false };
    const r = escalate(open, "tap");
    expect(r.ok).toBe(true);
    expect(r.message).not.toMatch(/not compromised/);
    expect(r.state.findings.find((f) => f.kind === "sb-stent-unneeded")).toMatchObject({ severity: "minor", shows: "debrief" });
    expect(kinds(escalate(prov, "tap").state)).not.toContain("sb-stent-unneeded");
  });

  it("DK crush: an SB stent deployed below 10 atm, or a pulled-back reinflation short of 20 atm, is flagged", () => {
    const at = upTo("bif-dk-crush", "dk-crush", "deploy-sb-stent");
    const low = step(at, "deploy-sb-stent", { atm: 8, postAtm: 20 });
    expect(low.findings.filter((f) => f.kind === "deploy-pressure").length).toBe(1);
    const noPost = step(at, "deploy-sb-stent", { atm: 12, postAtm: 14 });
    expect(noPost.findings.find((f) => f.kind === "deploy-pressure")?.text).toMatch(/20 atm/);
    expect(kinds(step(at, "deploy-sb-stent", { atm: 12, postAtm: 20 }))).not.toContain("deploy-pressure");
    expect(kinds(step(at, "deploy-sb-stent", { atm: 10, postAtm: 20 }))).not.toContain("deploy-pressure");
  });

  it("culotte with the MV stented first reports the distal MV stretch of that stent", () => {
    const first = step(upTo("bif-culotte", "culotte", "first-stent"), "first-stent", { branch: "mv", stentMm: 3.0, platformId: "A" });
    expect(bifMetrics(first).distalStretchPct).toBeGreaterThanOrEqual(100);
    const done = runReference(first, 99);
    expect(isFinished(done)).toBe(true);
    expect(bifMetrics(done).distalStretchPct).toBeGreaterThanOrEqual(100);
  });

  it("the score uses the named model parameters", () => {
    const at = upTo("bif-provisional", "provisional", "position-mv-stent");
    const s = runReference(step(at, "position-mv-stent", { proxMm: 7 }), 99);
    const o = bifOutcome(s);
    const major = s.findings.filter((f) => f.severity !== "minor").length;
    expect(o.score).toBe(Math.max(0, 100 - MP_SCORE_MAJOR * major - MP_SCORE_MINOR * (s.findings.length - major)));
    expect(o.score).toBeLessThan(100);
  });
});
