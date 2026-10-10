// ---------------------------------------------------------------------------
// The bifurcation technique step catalogue (pci-bench-bifurcation): for each
// technique the ordered step ids, names and the step numbers that the PCI lab's
// technique machines (src/simulation/pci/technique/*), the bifurcation bench
// (src/simulation/bench/bifurcation.ts) and the lab tips' `step` ranges share.
// Pure data: it imports types only, so the tips, the launch files and node
// scripts can read it without an engine.
//
// Numbering. Each technique's steps follow the numbered list the module text
// gives (src/content/manual/complex-pci/03-bifurcation-two-stent.ts, Brilakis
// 16.2 and 15.2), so a learner reading "step 6" in the lesson meets step 6 on the
// bench and in the lab: DK crush 1-17, culotte 1-11, planned T-stenting 1-6,
// TAP 1-8, reverse crush 1-11, mini-crush 1-9, V-stenting 1-4 and SKS 1-4. The
// lab build plan's design listed culotte 1-10, T and TAP 1-7 and mini-crush 1-7;
// the module's own lists are longer (each ends with a named final assessment,
// and T-stenting has six), and the module wins.
//
// Provisional stenting has no single numbered list in the module: Brilakis's
// sequence (cp-bifurcation-provisional, 16.2) starts at the MV stent (1 stent,
// 2 deploy over the jailed wire, 3 POT, 4 is the SB compromised, then 4b rewire,
// kiss, final POT). The catalogue uses the plan's ten-step composite, which adds
// the wiring and preparation before his step 1 and the final assessment after
// 4b; `moduleStep` on each step names the module's number where there is one.
//
// Phase. The PCI lab phase each step reports (plan is the technique choice before
// step 1): stent for positioning and deploying stents and the parked balloon,
// lesion-prep for the crush (also stent, so a stent-phase trigger still matches),
// optimise for rewiring, side-branch balloons, kissing and POT, imaging for the
// final assessment.
//
// `tips`: the lab tips (src/content/manual/complex-pci/02-*.ts and 03-*.ts) that
// teach the step; tipStepRanges() derives from it the step range a tip trigger
// would carry (tip-retarget-catchup applies them; this file edits no tip).
// ---------------------------------------------------------------------------

import type { BifTechnique, LabPhase } from "../../../content/lab/tips";

/** What a step does with the hands, so the bench and the lab machines can map it to their own actions. */
export type StepAction =
  | "wire"
  | "predilate"
  | "park-balloon"
  | "position-stent"
  | "deploy-stent"
  | "remove"
  | "angiogram"
  | "crush"
  | "rewire"
  | "branch-balloon"
  | "open-struts"
  | "kiss"
  | "pot"
  | "assess-branch"
  | "deploy-both"
  | "final-assessment";

/** The branch a step works on: main vessel, side branch, or the first or second stented branch (culotte). */
export type StepBranch = "mv" | "sb" | "both" | "first" | "second";

export interface TechniqueStep {
  /** 1-based step number, the number a tip's `step` range uses */
  n: number;
  /** stable id within the technique */
  id: string;
  /** the step's name, as the lesson's numbered list gives it */
  name: string;
  /**
   * A neutral title for live screens outside guided aids, where the lesson's name would give away a choice
   * the step asks for (the strut, the inflation, the deflation order, the first branch, the POT position).
   * Unset where the name gives nothing away; stepLabel() falls back to the name.
   */
  label?: string;
  action: StepAction;
  branch?: StepBranch;
  /** the PCI lab phase the step reports, and any further phase active with it */
  phase: LabPhase;
  alsoPhases?: LabPhase[];
  /** a step the module makes conditional ("if needed", "if the proximal MV is larger"): skipping it is not an error */
  optional?: boolean;
  /** the module's own step number where it differs from n (provisional's Brilakis numbering) */
  moduleStep?: string;
  /** lab tips that teach this step */
  tips?: readonly string[];
}

export interface TechniqueCatalogue {
  technique: BifTechnique;
  name: string;
  /** the lesson that teaches it */
  lessonId: string;
  /** where the numbered list is in the module text */
  source: string;
  steps: readonly TechniqueStep[];
}

const TWO_STENT = "src/content/manual/complex-pci/03-bifurcation-two-stent.ts";
const PROVISIONAL = "src/content/manual/complex-pci/02-bifurcation-provisional.ts";

function cat(technique: BifTechnique, name: string, lessonId: string, source: string, steps: Omit<TechniqueStep, "n">[]): TechniqueCatalogue {
  return { technique, name, lessonId, source, steps: steps.map((s, i) => ({ ...s, n: i + 1 })) };
}

export const TECHNIQUE_STEPS: Readonly<Record<BifTechnique, TechniqueCatalogue>> = {
  provisional: cat("provisional", "Provisional stenting", "cp-bifurcation-provisional-setup", `${PROVISIONAL}: lessons setup, jailed, pot and sb (Brilakis 16.2 steps 1-4); numbering from the lab build plan`, [
    { id: "wire-both", name: "Wire both branches", action: "wire", branch: "both", phase: "wire", tips: ["pci-bif-wire-both-branches", "pci-bif-hard-side-branch-wire"] },
    { id: "predilate-mv", name: "Prepare the main vessel", action: "predilate", branch: "mv", phase: "lesion-prep", tips: ["pci-bif-no-sb-predilation"] },
    { id: "position-mv-stent", name: "Choose and position the MV stent", action: "position-stent", branch: "mv", phase: "stent", moduleStep: "1", tips: ["pci-bif-mv-stent-size"] },
    { id: "deploy-mv-stent", name: "Deploy the MV stent over the jailed SB wire", action: "deploy-stent", branch: "mv", phase: "stent", moduleStep: "2", tips: ["pci-bif-jail-wire-prep"] },
    { id: "pot", name: "Proximal optimisation (POT)", action: "pot", phase: "optimise", moduleStep: "3", tips: ["pci-bif-pot-size-position"] },
    { id: "assess-sb", name: "Is the side branch compromised?", action: "assess-branch", branch: "sb", phase: "optimise", alsoPhases: ["physiology"], moduleStep: "4", tips: ["pci-bif-assess-side-branch"] },
    { id: "rewire-distal-cell", name: "Rewire the SB through a distal strut and remove the jailed wire", label: "Rewire the side branch and remove the jailed wire", action: "rewire", branch: "sb", phase: "optimise", optional: true, moduleStep: "4b.1-2", tips: ["pci-bif-rewire-distal-cell", "pci-bif-confirm-inside-struts"] },
    { id: "kiss", name: "Kissing balloon inflation", action: "kiss", phase: "optimise", optional: true, moduleStep: "4b.3", tips: ["pci-bif-kissing-size"] },
    { id: "final-pot", name: "Final POT", action: "pot", phase: "optimise", optional: true, moduleStep: "4b.4" },
    { id: "final-assessment", name: "Final assessment", action: "final-assessment", phase: "imaging" },
  ]),
  "dk-crush": cat("dk-crush", "DK crush", "cp-bifurcation-two-stent-dk-crush", `${TWO_STENT}: lesson dk-crush, stages A to D (Brilakis 16.2)`, [
    { id: "park-mv-balloon", name: "Park a balloon in the MV", action: "park-balloon", branch: "mv", phase: "stent", tips: ["pci-dkcrush-mv-balloon-first"] },
    { id: "position-sb-stent", name: "Bring the SB stent into place", action: "position-stent", branch: "sb", phase: "stent", tips: ["pci-dkcrush-sb-protrusion"] },
    { id: "deploy-sb-stent", name: "Deploy the SB stent", action: "deploy-stent", branch: "sb", phase: "stent", tips: ["pci-dkcrush-sb-deploy-pressure"] },
    { id: "remove-sb-balloon", name: "Take out the SB stent balloon", action: "remove", branch: "sb", phase: "stent" },
    { id: "sb-angiogram", name: "Angiogram of the SB", action: "angiogram", branch: "sb", phase: "stent" },
    { id: "crush", name: "Crush", action: "crush", phase: "lesion-prep", alsoPhases: ["stent"], tips: ["pci-dkcrush-crush-balloon"] },
    { id: "rewire-proximal-strut", name: "Rewire the SB through a proximal strut of the crushed stent", label: "Rewire the side branch through the crushed stent", action: "rewire", branch: "sb", phase: "optimise", tips: ["pci-dkcrush-first-rewire-proximal"] },
    { id: "sb-balloon", name: "Bring a balloon into the SB", action: "branch-balloon", branch: "sb", phase: "optimise", tips: ["pci-dkcrush-sb-balloon-wont-go"] },
    { id: "first-kiss", name: "First kissing inflation, done as a two-step kiss", label: "First kissing inflation", action: "kiss", phase: "optimise", tips: ["pci-twostent-two-step-kiss"] },
    { id: "remove-balloons", name: "Remove both balloons", action: "remove", branch: "both", phase: "optimise" },
    { id: "deploy-mv-stent", name: "Deliver and deploy the MV stent", action: "deploy-stent", branch: "mv", phase: "stent" },
    { id: "assess-mv", name: "Assess the MV result", action: "angiogram", branch: "mv", phase: "stent" },
    { id: "pot", name: "POT, if the proximal MV is clearly larger than the distal MV", label: "POT", action: "pot", phase: "optimise", optional: true },
    { id: "rewire-distal-strut", name: "Rewire the SB through the MV stent, through a distal strut", label: "Rewire the side branch through the MV stent", action: "rewire", branch: "sb", phase: "optimise", tips: ["pci-dkcrush-second-rewire-distal"] },
    { id: "second-kiss", name: "Second kiss, again in two steps", label: "Second kiss", action: "kiss", phase: "optimise", tips: ["pci-twostent-two-step-kiss", "pci-twostent-kiss-sequence"] },
    { id: "final-pot", name: "Final POT", action: "pot", phase: "optimise", tips: ["pci-twostent-final-pot"] },
    { id: "final-assessment", name: "Final angiography, and intravascular imaging", action: "final-assessment", phase: "imaging" },
  ]),
  culotte: cat("culotte", "Culotte", "cp-bifurcation-two-stent-culotte", `${TWO_STENT}: lesson culotte, 'Culotte (Brilakis's eleven steps)'`, [
    { id: "first-stent", name: "Stent the more angulated branch first", label: "First stent", action: "deploy-stent", branch: "first", phase: "stent", tips: ["pci-culotte-first-branch"] },
    { id: "remove-stent-balloon", name: "Remove the stent balloon", action: "remove", branch: "first", phase: "stent" },
    { id: "evaluate-branch", name: "Evaluate the stented branch", action: "angiogram", branch: "first", phase: "stent" },
    { id: "pot", name: "POT", action: "pot", phase: "optimise", tips: ["pci-culotte-pot-before-rewire"] },
    { id: "rewire-distal-cell", name: "Rewire the unstented branch through a distal cell at the carina", label: "Rewire the unstented branch", action: "rewire", branch: "second", phase: "optimise" },
    { id: "open-struts", name: "Open the struts into that branch", action: "open-struts", branch: "second", phase: "optimise" },
    { id: "second-stent", name: "Deliver and deploy the second stent", action: "deploy-stent", branch: "second", phase: "stent" },
    { id: "second-pot", name: "Second POT", action: "pot", phase: "optimise" },
    { id: "rewire-first-branch", name: "Rewire the first branch through a distal cell of the second stent", label: "Rewire the first branch through the second stent", action: "rewire", branch: "first", phase: "optimise" },
    { id: "kiss", name: "Kissing balloon inflation", action: "kiss", phase: "optimise", tips: ["pci-twostent-kiss-sequence"] },
    { id: "final-assessment", name: "Final assessment", action: "final-assessment", phase: "imaging" },
  ]),
  "t-stent": cat("t-stent", "Planned T-stenting", "cp-bifurcation-two-stent-t-tap", `${TWO_STENT}: lesson t-tap, 'Planned T-stenting (Brilakis)'`, [
    { id: "park-mv-balloon", name: "Park a balloon in the MV", action: "park-balloon", branch: "mv", phase: "stent" },
    { id: "position-sb-stent", name: "Bring the SB stent to the ostium", action: "position-stent", branch: "sb", phase: "stent", tips: ["pci-tstent-proximal-marker"] },
    { id: "deploy-sb-stent", name: "Deploy the SB stent", action: "deploy-stent", branch: "sb", phase: "stent", tips: ["pci-dkcrush-sb-deploy-pressure"] },
    { id: "remove-sb-balloon-wire", name: "Remove the SB balloon and wire", action: "remove", branch: "sb", phase: "stent" },
    { id: "deploy-mv-stent", name: "Deploy the MV stent", action: "deploy-stent", branch: "mv", phase: "stent" },
    { id: "rewire-kiss", name: "Rewire the SB and kiss", action: "kiss", phase: "optimise" },
  ]),
  tap: cat("tap", "TAP (T and protrusion)", "cp-bifurcation-two-stent-t-tap", `${TWO_STENT}: lesson t-tap, 'TAP steps' (Brilakis: TAP as the bail-out after provisional MV stenting)`, [
    { id: "deliver-sb-stent", name: "Deliver the SB stent across the SB ostium", action: "position-stent", branch: "sb", phase: "stent" },
    { id: "mv-balloon", name: "Put a balloon in the MV stent, across the SB take-off", action: "park-balloon", branch: "mv", phase: "stent" },
    { id: "set-protrusion", name: "Set the SB stent with minimal protrusion", label: "Set the SB stent's protrusion", action: "position-stent", branch: "sb", phase: "stent", tips: ["pci-tap-protrusion"] },
    { id: "deploy-sb-stent", name: "Deploy the SB stent", action: "deploy-stent", branch: "sb", phase: "stent" },
    { id: "pull-back-sb-balloon", name: "Pull the SB stent balloon back slightly", action: "remove", branch: "sb", phase: "stent" },
    { id: "kiss", name: "Kiss the SB and MV balloons, deflating the MV balloon first", label: "Kiss the SB and MV balloons", action: "kiss", phase: "optimise", tips: ["pci-tap-deflate-mv-first"] },
    { id: "final-pot", name: "Final POT just short of the neocarina", label: "Final POT", action: "pot", phase: "optimise", tips: ["pci-tap-final-pot"] },
    { id: "final-assessment", name: "Final assessment", action: "final-assessment", phase: "imaging" },
  ]),
  "reverse-crush": cat("reverse-crush", "Reverse (internal) crush", "cp-bifurcation-two-stent-crush-variants", `${TWO_STENT}: lesson crush-variants, 'Reverse (internal) crush'`, [
    { id: "rewire-sb", name: "Rewire the SB through the MV stent and remove the jailed wire", action: "rewire", branch: "sb", phase: "optimise", tips: ["pci-revcrush-mv-balloon-early"] },
    { id: "dilate-sb", name: "Dilate the SB", action: "branch-balloon", branch: "sb", phase: "optimise" },
    { id: "mv-balloon", name: "Deliver the MV balloon", action: "park-balloon", branch: "mv", phase: "stent", tips: ["pci-revcrush-mv-balloon-early"] },
    { id: "deliver-sb-stent", name: "Deliver the SB stent", action: "position-stent", branch: "sb", phase: "stent" },
    { id: "deploy-sb-stent", name: "Deploy the SB stent", action: "deploy-stent", branch: "sb", phase: "stent" },
    { id: "remove-sb-balloon", name: "Remove the SB stent balloon", action: "remove", branch: "sb", phase: "stent" },
    { id: "crush", name: "Crush the SB stent", action: "crush", phase: "lesion-prep", alsoPhases: ["stent"] },
    { id: "rewire-sb-stent", name: "Rewire the SB stent and remove the jailed wire", action: "rewire", branch: "sb", phase: "optimise" },
    { id: "kiss", name: "Kissing balloon inflation", action: "kiss", phase: "optimise" },
    { id: "pot", name: "POT", action: "pot", phase: "optimise" },
    { id: "final-assessment", name: "Final assessment", action: "final-assessment", phase: "imaging" },
  ]),
  "mini-crush": cat("mini-crush", "Mini-crush", "cp-bifurcation-two-stent-crush-variants", `${TWO_STENT}: lesson crush-variants, 'Mini-crush for a branch ostial lesion at an acute angle (Brilakis 15.2)'`, [
    { id: "wire-both", name: "Wire both branches", action: "wire", branch: "both", phase: "wire" },
    { id: "predilate-sb", name: "Predilate the SB", action: "predilate", branch: "sb", phase: "lesion-prep" },
    { id: "position-stent-and-balloon", name: "Position a stent in the SB and a balloon in the MV", action: "position-stent", branch: "sb", phase: "stent" },
    { id: "deploy-sb-stent", name: "Deploy the SB stent and remove its balloon", action: "deploy-stent", branch: "sb", phase: "stent" },
    { id: "crush", name: "Crush", action: "crush", phase: "lesion-prep", alsoPhases: ["stent"] },
    { id: "rewire-proximal-strut", name: "Rewire the SB stent through a proximal strut with a second wire", label: "Rewire the SB stent with a second wire", action: "rewire", branch: "sb", phase: "optimise", tips: ["pci-minicrush-rewire-proximal", "pci-dkcrush-first-rewire-proximal"] },
    { id: "balloons-both", name: "Balloons into both branches, then remove the jailed SB wire", action: "branch-balloon", branch: "both", phase: "optimise" },
    { id: "kiss", name: "Kiss, then remove both balloons", action: "kiss", phase: "optimise" },
    { id: "final-assessment", name: "Final assessment", action: "final-assessment", phase: "imaging" },
  ]),
  "v-stent": cat("v-stent", "V-stenting", "cp-bifurcation-two-stent-crush-variants", `${TWO_STENT}: lesson crush-variants, 'V-stenting (Medina 0,1,1)'`, [
    { id: "insert-stents", name: "Insert a stent into each branch", action: "position-stent", branch: "both", phase: "stent", tips: ["pci-vstent-sks-guide"] },
    { id: "deploy-both", name: "Deploy both at once", action: "deploy-both", branch: "both", phase: "stent" },
    { id: "remove-balloons", name: "Remove both stent balloons", action: "remove", branch: "both", phase: "stent" },
    { id: "final-assessment", name: "Final assessment", action: "final-assessment", phase: "imaging" },
  ]),
  sks: cat("sks", "Simultaneous kissing stents", "cp-bifurcation-two-stent-crush-variants", `${TWO_STENT}: lesson crush-variants, 'Simultaneous kissing stents: emergencies only'`, [
    { id: "insert-stents", name: "Insert both stents", action: "position-stent", branch: "both", phase: "stent", tips: ["pci-vstent-sks-guide", "pci-sks-emergency-only"] },
    { id: "deploy-both", name: "Deploy both at once", action: "deploy-both", branch: "both", phase: "stent" },
    { id: "remove-balloons", name: "Remove both stent balloons", action: "remove", branch: "both", phase: "stent" },
    { id: "final-assessment", name: "Final assessment", action: "final-assessment", phase: "imaging" },
  ]),
};

/** The title a live screen shows: the neutral label outside guided aids, the lesson's name in guided mode or once the run is over. */
export function stepLabel(step: Pick<TechniqueStep, "name" | "label">, reveal: boolean): string {
  return reveal ? step.name : step.label ?? step.name;
}

/** The steps of a technique, in order. */
export function techniqueSteps(t: BifTechnique): readonly TechniqueStep[] {
  return TECHNIQUE_STEPS[t].steps;
}

/** The number of steps of a technique. */
export function stepCount(t: BifTechnique): number {
  return TECHNIQUE_STEPS[t].steps.length;
}

/** A step by id (undefined when the technique has no such step). */
export function stepById(t: BifTechnique, id: string): TechniqueStep | undefined {
  return TECHNIQUE_STEPS[t].steps.find((s) => s.id === id);
}

/** The step number of a step id (undefined when unknown). */
export function stepNumber(t: BifTechnique, id: string): number | undefined {
  return stepById(t, id)?.n;
}

/** The step at a number (1-based; undefined outside the range). */
export function stepAt(t: BifTechnique, n: number): TechniqueStep | undefined {
  return TECHNIQUE_STEPS[t].steps[n - 1];
}

/**
 * The step a launch names, by id or by number ("crush" or "6"); undefined when it names none of the
 * technique's steps.
 */
export function resolveStep(t: BifTechnique, ref: string | number | undefined | null): TechniqueStep | undefined {
  if (ref === undefined || ref === null || ref === "") return undefined;
  const n = typeof ref === "number" ? ref : /^\d+$/.test(ref.trim()) ? Number(ref.trim()) : NaN;
  return Number.isFinite(n) ? stepAt(t, n) : stepById(t, String(ref).trim());
}

/**
 * The step ranges at which each tip teaches, per technique: the smallest range holding every step that
 * lists the tip. tip-retarget-catchup reads this when it adds `step` to the bifurcation tip triggers.
 */
export function tipStepRanges(): Record<string, { technique: BifTechnique; step: [number, number] }[]> {
  const out: Record<string, { technique: BifTechnique; step: [number, number] }[]> = {};
  for (const c of Object.values(TECHNIQUE_STEPS)) {
    const byTip = new Map<string, number[]>();
    for (const s of c.steps) for (const id of s.tips ?? []) byTip.set(id, [...(byTip.get(id) ?? []), s.n]);
    for (const [id, ns] of byTip) (out[id] ??= []).push({ technique: c.technique, step: [Math.min(...ns), Math.max(...ns)] });
  }
  return out;
}
