// ---------------------------------------------------------------------------
// The physical complication engine: exposures from the device physics enter
// here as events (an inflation, a stent deployment, a wire push in a small
// vessel, an injection, a device introduced through an open valve); each
// complication module turns them into seeded draws, prodromes, progression
// and bail-out effects. The engine is pure: every call takes a state and
// returns a new one, so a recorded sequence of actions replays exactly.
// ---------------------------------------------------------------------------

import { rngFrom, type RngState } from "../pci/rng";
import { aspirateGuide, bailoutAir, deviceIntroduced, injectAir, ruptureAir, stepAir } from "./airEmbolism";
import { flowLimit, maybeDissection, maybeGuideDissection, propagate, stentOver, stepDissection } from "./dissection";
import { bailoutNoReflow, maybeNoReflow, stepNoReflow, timiFor } from "./noReflow";
import { bailoutPerforation, maybeDevicePerforation, maybeWirePerforation, stepPerforation } from "./perforation";
import { bailoutSideBranch, maybeSideBranch, stepSideBranch, type SideBranchExposure } from "./sideBranch";
import { bailoutThrombus, maybeEmbolisation, stepThrombus, stepThrombusFormation } from "./thrombus";
import type { Bailout, Complication, CxContext, CxNote, CxState, PatientEffects, PerforationSite, RecognisedCause, Recognition, RecognitionAnswer, RecognitionScore } from "./types";

export type {
  Bailout,
  Complication,
  CxContext,
  CxNote,
  CxState,
  PatientEffects,
  PerforationSite,
  RecognisedCause,
  Recognition,
  RecognitionAnswer,
  RecognitionScore,
} from "./types";

export function initialCx(seed: string | number): CxState {
  return { list: [], rng: rngFrom(seed), nextId: 1, guideAirMl: 0, aspirated: true, labels: [], heldCues: [] };
}

export function cloneCx(cx: CxState): CxState {
  return {
    ...cx,
    rng: { ...cx.rng },
    list: cx.list.map((c) => ({ ...c, route: c.route.slice(), data: { ...c.data }, bailouts: c.bailouts.slice() })),
    labels: (cx.labels ?? []).slice(),
    heldCues: (cx.heldCues ?? []).slice(),
  };
}

export interface CxResult {
  cx: CxState;
  notes: CxNote[];
}

// ---------------------------------------------------------------------------
// The recognition gate (pci-cx-recognition)
//
// The engine progresses as before, but the lab no longer names a complication
// the learner has not recognised. Every note of such a complication is
// returned as a 'cue'. A note that names it, grades it or describes the
// morphology that classifies it (a stage change, the kind, an NHLBI, Ellis or
// TIMI grade, or the words those grades are defined by: spiral, crater,
// blush, filling defect and so on) is kept on cx.labels as a 'label' note
// (debrief data) and replaced by a neutral cue: what changed and, where it is
// not itself graded, where, with no name, no grade and no classifying
// morphology. Grading therefore rests on the image. Once the learner has
// named the cause correctly (recogniseCx; a wrong cause leaves it open), that
// complication's notes pass unchanged. Notes not tied to a complication (air
// in the manifold) pass.
// An image cue (every cue but the aspirate's) says what the next contrast run
// shows, so it is held on cx.heldCues until an injection: notes made by the
// injection itself pass at once and release what was held (onInjection, which
// records the run's time as cx.lastRunT), and the PCI step releases the cues of
// changes made while that run's contrast was still in the vessel
// (releaseHeldCues, src/simulation/pci/actions/step.ts). A run of the other
// coronary (a contralateral injection) does not go through onInjection and
// shows nothing of the treated vessel's changes.
// ---------------------------------------------------------------------------

/**
 * Words that name a complication, give its grade or describe the morphology a grade is defined by (a
 * note with one is a label until the cause is recognised). The NHLBI and Ellis wording is that of the
 * form (src/ui/pci/RecognitionForm.tsx) and of the complication modules' own notes.
 */
const NAMES =
  /dissect|perforat|reflow|thromb|embol|\bair\b|bubble|NHLBI|Ellis|TIMI|tamponade|\bflap\b|false lumen|haematoma|\bseal|extravasat|\bhole\b|\bleak|branch|struts|ostial|pinched|lucen|haz[ey]|filling defect|spiral|crater|blush|stain|double|parallel|channel|occlu|closure|chamber|cavity|spill|stream|\bjet\b|persistent|creep|slowly|normally|cut off|\bplane\b/i;

/** Does this note name or grade its complication? */
export function namesComplication(n: Pick<CxNote, "type" | "text">): boolean {
  return n.type === "event" || n.type === "label" || NAMES.test(n.text);
}

/** The neutral cues: what changed and where, never what it is or how severe. */
export const CUES = {
  segment: "The image at the treated segment has changed on this run.",
  ostium: "The image at the ostium has changed after the injection.",
  vessel: "The image of the vessel has changed on this run; look along its whole length.",
  flow: "Flow beyond the treated segment looks different on this run.",
  better: "The image looks better on this run.",
  flowBetter: "Flow beyond the treated segment looks better on this run.",
  same: "No clear change on the image yet.",
  material: "Some material comes back in the aspirate.",
  noWorse: "The image at the treated segment is no worse on this run.",
} as const;

/** The cues that say what a contrast run shows (held until one is made); the aspirate's is seen at once. */
const IMAGE_CUES: ReadonlySet<string> = new Set(Object.entries(CUES).filter(([k]) => k !== "material").map(([, v]) => v));

/** Is this cue text about the angiographic image (shown only on a contrast run)? */
export function isImageCue(text: string): boolean {
  return IMAGE_CUES.has(text);
}

/**
 * Seconds after an injection during which a change is still seen on that run (contrast is still in the
 * vessel). MODEL PARAMETER (docs/realism/facts/pkg-pci-cx-recognition.md).
 */
export const MP_RUN_WINDOW_S = 3;

/** The cue shown in place of a note that names or grades a complication the learner has not recognised. */
export function cueFor(c: Complication, n: CxNote): string {
  if (n.type !== "event" && n.type !== "label" && !NAMES.test(n.text)) return n.text;
  const flowKind = c.kind === "no-reflow" || c.kind === "air" || (c.kind === "thrombus" && !!c.data.embolised);
  if (n.type === "effect") {
    if (n.tone === "good") return flowKind ? CUES.flowBetter : CUES.better;
    if (n.tone === "info" && /aspirat/i.test(n.text)) return CUES.material;
    if (n.tone === "info" && c.kind === "thrombus") return CUES.noWorse;
    return CUES.same;
  }
  switch (c.kind) {
    case "dissection":
      return c.data.ostial ? CUES.ostium : CUES.segment;
    case "perforation":
      return CUES.vessel;
    case "air":
      return CUES.vessel;
    default:
      return flowKind ? CUES.flow : CUES.segment;
  }
}

/** The learner has named this complication's cause correctly: from then on the lab names it. */
export function causeRecognised(c: Complication): boolean {
  return !!c.recognised?.score.cause;
}

/**
 * Apply the gate to the notes an engine call produced (cx is the call's own clone): labels go to
 * cx.labels, cues come back in their place. Image cues are held on cx.heldCues unless the call is itself
 * a contrast run (run true).
 */
function gate(cx: CxState, notes: CxNote[], run = false): CxNote[] {
  const out: CxNote[] = [];
  for (const n of notes) {
    const c = cx.list.find((x) => x.id === n.id);
    if (!c || causeRecognised(c)) {
      out.push(n);
      continue;
    }
    if (!namesComplication(n)) {
      out.push({ ...n, type: "cue" });
      continue;
    }
    (cx.labels ??= []).push({ ...n, type: "label" });
    const text = cueFor(c, n);
    // one cue per change: a repeat of a cue of this complication in the same call, or one already held, adds nothing
    if (out.some((o) => o.id === n.id && o.text === text)) continue;
    if (!run && isImageCue(text)) {
      const held = (cx.heldCues ??= []);
      if (!held.some((h) => h.id === n.id && h.text === text)) held.push({ ...n, type: "cue", text });
      continue;
    }
    out.push({ ...n, type: "cue", text });
  }
  return out;
}

/** Take the held cues made at or before upTo off cx (its own clone), in order, for the live log. */
function takeHeld(cx: CxState, upTo: number): CxNote[] {
  const held = cx.heldCues ?? [];
  const out = held.filter((h) => h.t <= upTo);
  if (out.length) cx.heldCues = held.filter((h) => h.t > upTo);
  return out;
}

/**
 * A contrast run has shown the image up to procedure time upTo: the held cues of changes made by then
 * reach the live log. Pure; returns the same state when nothing was waiting.
 */
export function releaseHeldCues(cx0: CxState, upTo: number): CxResult {
  if (!(cx0.heldCues ?? []).some((h) => h.t <= upTo)) return { cx: cx0, notes: [] };
  const cx: CxState = { ...cx0, heldCues: (cx0.heldCues ?? []).slice() };
  return { cx, notes: takeHeld(cx, upTo) };
}

/** Does this complication have image cues waiting for a contrast run (nothing of it seen on the image yet)? */
export function cueHeld(cx: Pick<CxState, "heldCues">, id: string): boolean {
  return (cx.heldCues ?? []).some((h) => h.id === id);
}

/**
 * The gate for notes made outside the engine's own entry points (a caller that draws from a complication
 * module directly, such as src/simulation/pci/actions/inflation.ts): pure, returns a new state whose
 * labels hold what was held back, and the notes the live log may show (image cues wait on heldCues unless
 * o.run says the notes came from a contrast run). Idempotent: gated notes pass again unchanged.
 */
export function gateNotes(cx0: CxState, notes: CxNote[], o: { run?: boolean } = {}): CxResult {
  const cx: CxState = { ...cx0, labels: (cx0.labels ?? []).slice(), heldCues: (cx0.heldCues ?? []).slice() };
  return { cx, notes: gate(cx, notes, !!o.run) };
}

const gated = (r: CxResult, run = false): CxResult => ({ cx: r.cx, notes: gate(r.cx, r.notes, run) });

// ---------------------------------------------------------------------------
// Assessment: what the learner named against what happened
// ---------------------------------------------------------------------------

/**
 * Fraction of the vessel's flow a complication takes away, to TIMI grade: at or above the first value
 * TIMI 0, the second TIMI 1, the third TIMI 2, below it TIMI 3. MODEL PARAMETER (docs/realism/facts/pkg-pci-cx-recognition.md).
 */
export const MP_TIMI_FRACTION = [0.95, 0.7, 0.3] as const;

function timiFromFraction(f: number): number {
  return f >= MP_TIMI_FRACTION[0] ? 0 : f >= MP_TIMI_FRACTION[1] ? 1 : f >= MP_TIMI_FRACTION[2] ? 2 : 3;
}

const timiNumber = (grade: string): number => Number(/TIMI (\d)/.exec(grade)?.[1] ?? 3);

/** The TIMI flow grades the complication's flow corresponds to now ([lo, hi]: a side branch at 'TIMI 0-1' is either). */
export function timiOf(c: Complication): [number, number] {
  switch (c.kind) {
    case "dissection": {
      const t = timiFromFraction(flowLimit(c.grade));
      return [t, t];
    }
    case "no-reflow": {
      const t = timiNumber(timiFor(c.severity));
      return [t, t];
    }
    case "side-branch":
      return c.grade === "TIMI 0-1" ? [0, 1] : [timiNumber(c.grade), timiNumber(c.grade)];
    case "thrombus": {
      const t = timiFromFraction(c.data.embolised ? 0.6 : 0.3 * c.severity);
      return [t, t];
    }
    case "air": {
      const t = timiFromFraction(Math.min(1, c.severity));
      return [t, t];
    }
    default:
      return [3, 3];
  }
}

/** Where a perforation is: a collateral, a distal vessel (wire exit) or the large vessel at the device. */
export function perforationSite(c: Complication): PerforationSite {
  return c.data.collateral ? "collateral" : c.data.distal ? "distal" : "large-vessel";
}

/** The causes that count as naming this complication correctly. */
export function acceptedCauses(c: Complication): RecognisedCause[] {
  if (c.kind === "thrombus" && c.data.embolised) return ["thrombus", "no-reflow"];
  return [c.kind];
}

/** Score an assessment against a complication's kind, grade and data now. */
export function scoreRecognition(c: Complication, a: RecognitionAnswer): RecognitionScore {
  const [lo, hi] = timiOf(c);
  const truth: RecognitionScore["truth"] = { cause: c.kind, grade: c.grade, timi: lo, ...(c.kind === "perforation" ? { site: perforationSite(c) } : {}) };
  const cause = acceptedCauses(c).includes(a.cause);
  const grade = !cause ? null : c.kind === "dissection" ? a.nhlbi === c.grade : c.kind === "perforation" ? a.ellis === c.grade : null;
  const site = !cause || c.kind !== "perforation" ? null : a.site === perforationSite(c);
  const timi = a.timi === undefined || a.timi === null ? null : a.timi >= lo && a.timi <= hi;
  return { cause, grade, site, timi, correct: cause && grade !== false && site !== false && timi !== false, truth };
}

/** Complications the learner could assess now: live, cause not yet named correctly (oldest first). */
export function unrecognised(cx: CxState): Complication[] {
  return cx.list.filter((c) => c.stage !== "resolved" && !causeRecognised(c));
}

/** The name and grade of a complication, as the debrief and the post-assessment line give it. */
export function complicationLabel(c: Complication): string {
  const name: Record<string, string> = {
    dissection: "coronary dissection",
    perforation: "coronary perforation",
    "no-reflow": "no-reflow (distal embolisation)",
    thrombus: c.data.embolised ? "embolised thrombus" : "thrombus",
    air: "air embolism",
    "side-branch": "side-branch compromise",
  };
  const grade =
    c.kind === "dissection"
      ? `NHLBI type ${c.grade}`
      : c.kind === "perforation"
        ? `Ellis type ${c.grade}, ${perforationSite(c).replace("-", " ")}`
        : c.kind === "air"
          ? ""
          : c.grade;
  return grade ? `${name[c.kind] ?? c.kind} (${grade})` : (name[c.kind] ?? c.kind);
}

export interface RecognitionResult extends CxResult {
  /** the complication the assessment was scored against, or null when nothing was there to recognise */
  id: string | null;
  recognition: Recognition | null;
}

const CAUSE_WORDS: Record<RecognisedCause, string> = {
  dissection: "dissection",
  perforation: "perforation",
  "no-reflow": "no-reflow",
  thrombus: "thrombus",
  air: "air",
  "side-branch": "side branch compromise",
  spasm: "spasm",
};
const SITE_WORDS: Record<PerforationSite, string> = { "large-vessel": "large vessel", distal: "distal vessel", collateral: "collateral" };

/**
 * The live log's line for an assessment: the learner's own answer, never the truth or the score. The same
 * line, in the same tone, whether the answer was right, wrong or a false alarm (the score is shown in
 * guided practice by the form, and otherwise in the debrief).
 */
export function assessmentText(a: RecognitionAnswer): string {
  const parts = [CAUSE_WORDS[a.cause] ?? a.cause];
  if (a.cause === "dissection" && a.nhlbi) parts.push(`NHLBI type ${a.nhlbi}`);
  if (a.cause === "perforation" && a.site) parts.push(SITE_WORDS[a.site]);
  if (a.cause === "perforation" && a.ellis) parts.push(`Ellis ${a.ellis}`);
  if (typeof a.timi === "number") parts.push(`TIMI ${a.timi}`);
  return `Assessed as: ${parts.join(", ")}.`;
}

/**
 * The learner's assessment at procedure time t. It is scored against the open complication whose kind
 * the answer names, else against the most severe one, and recorded on it (a reassessment of a complication
 * whose cause was named wrongly replaces the record, with its attempt number and the first attempt kept as
 * recognised.first). When the cause is right
 * the complication's notes pass named from then on; when it is wrong they stay cues and it stays open to
 * assessment. The engine adds no note: the caller logs assessmentText(answer), the same whatever the
 * score. Nothing open: id null (a false alarm, which the caller records).
 */
export function recogniseCx(cx0: CxState, t: number, answer: RecognitionAnswer): RecognitionResult {
  const open = unrecognised(cx0);
  if (!open.length) return { cx: cx0, notes: [], id: null, recognition: null };
  const target = open.find((c) => acceptedCauses(c).includes(answer.cause)) ?? open.slice().sort((a, b) => b.severity - a.severity)[0];
  const cx = cloneCx(cx0);
  const c = cx.list.find((x) => x.id === target.id)!;
  const score = scoreRecognition(c, answer);
  const prev = c.recognised ?? null;
  const attempt = (prev?.attempt ?? (prev ? 1 : 0)) + 1;
  const first = prev ? (prev.first ?? { t: prev.t, cause: prev.answer.cause, delayS: prev.delayS, correct: prev.score.correct }) : undefined;
  const recognition: Recognition = {
    t,
    answer: { ...answer, ...(answer.checks ? { checks: { ...answer.checks } } : {}) },
    score,
    delayS: Math.max(0, t - c.t0),
    attempt,
    ...(first ? { first } : {}),
  };
  c.recognised = recognition;
  return { cx, notes: [], id: c.id, recognition };
}

/** Debrief data: every complication with its name and grade, the label notes the live log held back, and the assessment. */
export function cxDebrief(cx: CxState): { id: string; kind: Complication["kind"]; label: string; cause: string; labels: string[]; recognised: Recognition | null }[] {
  return cx.list.map((c) => ({
    id: c.id,
    kind: c.kind,
    label: complicationLabel(c),
    cause: c.cause,
    labels: (cx.labels ?? []).filter((n) => n.id === c.id).map((n) => n.text),
    recognised: c.recognised ?? null,
  }));
}

const live = (c: Complication) => c.stage !== "resolved";

// ---------------------------------------------------------------------------
// Event triggers
// ---------------------------------------------------------------------------

export interface InflationEvent {
  route: string[];
  vessel: string;
  /** device span and centre (path mm) */
  fromMm: number;
  toMm: number;
  device: "balloon" | "stent" | "covered-stent";
  /** device diameter over the local reference lumen, and over the local EEM */
  ratio: number;
  ratioToEem: number;
  atm: number;
  waist: boolean;
  calcium: 0 | 1 | 2;
  inLesion: boolean;
  edgeInPlaque: boolean;
  subintimalWire: boolean;
  rupture: boolean;
  prepared: boolean;
  beyondLimit: boolean;
  thrombus: boolean;
  lipid: boolean;
  lesionLengthMm: number;
  aspirated: boolean;
  side: "left" | "right";
  vesselD: number;
}

/** An inflation or deployment: draws dissection, perforation, no-reflow, embolisation and air. */
export function onInflation(cx0: CxState, t: number, e: InflationEvent): CxResult {
  const cx = cloneCx(cx0);
  const notes: CxNote[] = [];
  const centre = (e.fromMm + e.toMm) / 2;
  const d = maybeDissection(cx, t, {
    route: e.route,
    vessel: e.vessel,
    atMm: e.edgeInPlaque ? e.fromMm : centre,
    lengthMm: Math.max(4, (e.toMm - e.fromMm) * 0.6),
    ratio: e.ratio,
    calcium: e.calcium,
    atm: e.atm,
    waist: e.waist,
    edgeInPlaque: e.edgeInPlaque,
    subintimalWire: e.subintimalWire,
    inLesion: e.inLesion,
    cause: e.subintimalWire ? "dilatation over a subintimal wire" : e.edgeInPlaque ? "stent edge landing in plaque" : e.ratio > 1.2 ? "oversized device for the vessel" : "dilatation of the lesion",
  });
  notes.push(...d.notes);
  const p = maybeDevicePerforation(cx, t, { route: e.route, vessel: e.vessel, atMm: centre, ratioToEem: e.ratioToEem, rupture: e.rupture, calcium: e.calcium, beyondLimit: e.beyondLimit, vesselD: e.vesselD });
  notes.push(...p.notes);
  if (e.inLesion) {
    const n = maybeNoReflow(cx, t, { route: e.route, vessel: e.vessel, atMm: centre, thrombus: e.thrombus, lipid: e.lipid, ratio: e.ratio, lesionLengthMm: e.lesionLengthMm, aspirated: e.aspirated, stent: e.device !== "balloon" });
    notes.push(...n.notes);
    const em = maybeEmbolisation(cx, t, { route: e.route, vessel: e.vessel, atMm: centre, thrombus: e.thrombus, ratio: e.ratio, aspirated: e.aspirated });
    notes.push(...em.notes);
  }
  if (e.rupture && !e.prepared) notes.push(...ruptureAir(cx, t, { route: e.route, vessel: e.vessel, atMm: centre, side: e.side }).notes);
  return gated({ cx, notes });
}

/** A stent deployed (or a covered stent): seals dissections it covers, seals perforations it covers (covered), draws side-branch compromise. */
export function onStent(cx0: CxState, t: number, o: { route: string[]; fromMm: number; toMm: number; covered: boolean; sideBranches: SideBranchExposure[] }): CxResult {
  const cx = cloneCx(cx0);
  const notes: CxNote[] = [];
  for (const c of cx.list) {
    if (c.kind === "dissection" && live(c)) notes.push(...stentOver(c, t, o));
    if (c.kind === "perforation" && live(c) && o.covered) notes.push(...bailoutPerforation(c, "covered-stent", t, { span: o }));
  }
  for (const sb of o.sideBranches) {
    const exposure = o.covered ? { ...sb, trueBifurcation: true, stentRatio: Math.max(sb.stentRatio, 1.3) } : sb;
    notes.push(...maybeSideBranch(cx, t, exposure).notes);
  }
  return gated({ cx, notes });
}

/** A wire push in the danger zone: exposure for a distal wire perforation. */
export function onWirePush(cx0: CxState, t: number, o: { route: string[]; vessel: string; atMm: number; gfMm: number; vesselD: number; hydrophilic: boolean }): CxResult {
  const cx = cloneCx(cx0);
  const r = maybeWirePerforation(cx, t, o);
  return gated({ cx, notes: r.notes });
}

/** An injection through the guide: carries air, extends dissections, can dissect the ostium. */
export function onInjection(
  cx0: CxState,
  t: number,
  o: { route: string[]; vessel: string; side: "left" | "right"; psi: number; forceful: boolean; guideDepthMm: number; guideCoaxial: number }
): CxResult {
  const cx = cloneCx(cx0);
  const notes: CxNote[] = [];
  notes.push(...injectAir(cx, t, { route: o.route, vessel: o.vessel, side: o.side }).notes);
  for (const c of cx.list) if (c.kind === "dissection" && live(c)) notes.push(...propagate(c, t, cx.rng, { psi: o.psi }));
  notes.push(...maybeGuideDissection(cx, t, { side: o.side, depthMm: o.guideDepthMm, coaxial: o.guideCoaxial, forceful: o.forceful, vessel: o.route[0] }).notes);
  // the injection is a contrast run: what was held is seen now, and so is what it does
  cx.lastRunT = t;
  const shown = takeHeld(cx, t);
  const own = gate(cx, notes, true);
  return { cx, notes: [...shown, ...own.filter((n) => !shown.some((h) => h.id === n.id && h.text === n.text))] };
}

/** A device pushed through an untreated dissection extends it. */
export function onDeviceThrough(cx0: CxState, t: number, span: { route: string[]; fromMm: number; toMm: number }): CxResult {
  const cx = cloneCx(cx0);
  const notes: CxNote[] = [];
  for (const c of cx.list) {
    if (c.kind !== "dissection" || !live(c) || c.stage === "treated") continue;
    const last = c.route[c.route.length - 1];
    if (!span.route.includes(last)) continue;
    const a = c.atMm - c.lengthMm / 2;
    if (span.toMm >= a && span.fromMm <= a) notes.push(...propagate(c, t, cx.rng, { device: true }));
  }
  return gated({ cx, notes });
}

/** The haemostatic valve was opened: the guide is no longer known to be free of air. */
export function onValveOpened(cx0: CxState): CxState {
  return { ...cloneCx(cx0), aspirated: false };
}

/** A device introduced through the open valve. */
export function onDeviceIntroduced(cx0: CxState, t: number, prepared: boolean): CxResult {
  const cx = cloneCx(cx0);
  const notes = deviceIntroduced(cx, cx.rng, prepared).map((n) => ({ ...n, t }));
  return gated({ cx, notes });
}

/** Aspirate and flush the guide (back-bleed). */
export function onAspirate(cx0: CxState): CxState {
  const cx = cloneCx(cx0);
  aspirateGuide(cx);
  return cx;
}

// ---------------------------------------------------------------------------
// Time
// ---------------------------------------------------------------------------
export function stepCx(cx0: CxState, dt: number, ctx: CxContext, site: { route: string[]; vessel: string; atMm: number }): CxResult {
  const cx = cloneCx(cx0);
  const notes: CxNote[] = [];
  for (const c of cx.list) {
    if (!live(c)) continue;
    if (c.kind === "dissection") notes.push(...stepDissection(c, dt, ctx, cx.rng));
    else if (c.kind === "perforation") notes.push(...stepPerforation(c, dt, ctx, cx.rng));
    else if (c.kind === "side-branch") notes.push(...stepSideBranch(c, dt, ctx, cx.rng));
    else if (c.kind === "no-reflow") notes.push(...stepNoReflow(c, dt, ctx, cx.rng));
    else if (c.kind === "thrombus") notes.push(...stepThrombus(c, dt, ctx, cx.rng));
    else if (c.kind === "air") notes.push(...stepAir(c, dt, ctx, cx.rng));
  }
  notes.push(...stepThrombusFormation(cx, dt, ctx, site));
  return gated({ cx, notes });
}

// ---------------------------------------------------------------------------
// Bail-outs
// ---------------------------------------------------------------------------
export interface BailoutInput {
  /** the stent or covered stent just deployed */
  span?: { route: string[]; fromMm: number; toMm: number };
  wireInBranch?: (branch: string) => boolean;
  balloonInBranch?: (branch: string) => boolean;
  thrombus?: boolean;
}

/** Apply a bail-out to every complication it can act on. */
export function applyBailout(cx0: CxState, action: Bailout, t: number, inp: BailoutInput = {}): CxResult {
  const cx = cloneCx(cx0);
  const notes: CxNote[] = [];
  for (const c of cx.list) {
    if (!live(c)) continue;
    if (c.kind === "perforation" && (action === "covered-stent" || action === "coil")) notes.push(...bailoutPerforation(c, action, t, { span: inp.span }));
    if (c.kind === "perforation" && action === "protamine") {
      c.bailouts.push(action);
      if (c.tTreated === null) c.tTreated = t;
    }
    if (c.kind === "perforation" && action === "pericardiocentesis") c.bailouts.push(action);
    if (c.kind === "no-reflow") notes.push(...bailoutNoReflow(c, action, t, cx.rng, { thrombus: !!inp.thrombus }));
    if (c.kind === "thrombus") notes.push(...bailoutThrombus(c, action, t, cx.rng));
    if (c.kind === "air") notes.push(...bailoutAir(c, action, t));
    if (c.kind === "side-branch" && (action === "rewire-side-branch" || action === "kissing-balloon"))
      notes.push(...bailoutSideBranch(c, action, t, { wireInBranch: inp.wireInBranch?.(c.vessel) ?? false, balloonInBranch: inp.balloonInBranch?.(c.vessel) ?? false }));
    if (c.kind === "dissection" && action === "stop-injections") c.bailouts.push(action);
  }
  if (action === "aspirate-guide") aspirateGuide(cx);
  return gated({ cx, notes });
}

// ---------------------------------------------------------------------------
// Read-outs
// ---------------------------------------------------------------------------
/** What the complications ask of the patient engine now. */
export function patientEffects(cx: CxState, ctx: Pick<CxContext, "paramAt">): PatientEffects {
  const out: PatientEffects = { occlusions: [], noReflow: null, pericardialMlS: 0, vagal: 0, vfPerS: 0 };
  for (const c of cx.list) {
    if (!live(c)) continue;
    if (c.kind === "dissection") {
      const f = flowLimit(c.grade);
      const p = ctx.paramAt(c.route, c.atMm);
      if (f > 0 && p) out.occlusions.push({ id: c.id, vessel: p.vessel, param: p.param, fraction: f });
    } else if (c.kind === "side-branch") {
      out.occlusions.push({ id: c.id, vessel: c.vessel, param: 0.03, fraction: c.severity >= 0.9 ? 1 : 0.5 * c.severity });
    } else if (c.kind === "no-reflow") {
      const p = ctx.paramAt(c.route, c.atMm);
      if (p) out.noReflow = { vessel: p.vessel, param: p.param, severity: c.severity };
    } else if (c.kind === "thrombus") {
      const p = ctx.paramAt(c.route, c.atMm);
      if (p) out.occlusions.push({ id: c.id, vessel: p.vessel, param: p.param, fraction: c.data.embolised ? 0.6 : 0.3 * c.severity });
    } else if (c.kind === "air") {
      const p = ctx.paramAt(c.route, Math.min(c.data.bubbleMm ?? 20, 60));
      if (p) out.occlusions.push({ id: c.id, vessel: p.vessel, param: p.param, fraction: Math.min(1, c.severity) });
      out.vagal = Math.max(out.vagal, 0.8 * c.severity);
      if (c.data.vfFlag) out.vfPerS = Math.max(out.vfPerS, 0.2);
    } else if (c.kind === "perforation") {
      out.pericardialMlS += c.data.leak ?? 0;
    }
  }
  return out;
}

/** Live complications, most severe first. */
export function activeComplications(cx: CxState): Complication[] {
  return cx.list.filter((c) => c.stage !== "resolved").sort((a, b) => b.severity - a.severity);
}
