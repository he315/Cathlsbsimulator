// ===========================================================================
// Lab technique tips: the one place a piece of practical teaching lives, so
// that the lesson that teaches it, the cases that test it and the lab where it
// is done all say the same thing.
//
// Each tip names the lab and the moment it applies to (a trigger). The labs
// show the tips whose trigger matches what is happening (the attending drawer
// in the diagnostic lab, the technique panel in the PCI lab, the access and
// device labs), lessons show them with a "tip" block, and the debrief links a
// tip back to its lesson. Tips are written in original words from the sources
// they cite; content.test.ts and manual.test.ts check every field.
//
// Tips are written with their module (src/content/manual/<track>/<module>.ts
// exports `tips`) and collected here, so authors never edit the same file.
//
// The vocabulary below (labs, phases, events, routes, procedures, techniques,
// imaging) is shared by every lab. A lab that needs a new name asks for a
// vocabulary amendment rather than adding one alongside its own feature.
// ===========================================================================

import type { EngagementKind, PressureKind } from "../../types";
import type { SourceLoc, RefId } from "../schema";
import { MANUAL_TIPS } from "../manual/index";

/** Where a tip is used. */
export type LabId = "diagnostic" | "pci" | "access" | "haemo" | "mcs" | "structural" | "bedside";

/** The moment within a lab a tip belongs to. */
export const LAB_PHASES = {
  diagnostic: ["setup", "advance", "engage-left", "engage-right", "engage-graft", "inject", "views", "lv-aorta", "exchange", "finish"],
  pci: ["plan", "guide", "wire", "lesion-prep", "stent", "optimise", "physiology", "imaging", "complication", "finish"],
  access: ["plan", "puncture", "wire", "sheath", "radial", "femoral", "closure", "complication"],
  haemo: ["setup", "right-heart", "left-heart", "valves", "shunts", "calculations"],
  mcs: ["select", "insert", "position", "manage", "wean", "complication"],
  structural: ["plan", "access", "position", "deploy", "assess", "complication"],
  // Stage phases shared by the bedside procedures (pacing, pericardiocentesis, biopsy); the procedure
  // itself is LabContext.procedures. "pacing" and "pericardiocentesis" are deprecated aliases kept
  // until tip-retarget-catchup moves the bed-pace-* and bed-peri-* tips onto procedure plus stage.
  bedside: ["assess", "access", "position", "test", "troubleshoot", "decide", "plan", "needle", "drain", "pacing", "pericardiocentesis"],
} as const satisfies Record<LabId, readonly string[]>;

export type LabPhase = (typeof LAB_PHASES)[LabId][number];

/** Phases kept only so that existing tips stay valid; no lab should report them in new code. */
export const DEPRECATED_LAB_PHASES: Partial<Record<LabId, readonly LabPhase[]>> = {
  bedside: ["pacing", "pericardiocentesis"],
};

/**
 * Events a lab can report that make a tip relevant. A lab raises the event from its own state
 * (for example "engage-fail" after repeated attempts without a selective position).
 */
export const LAB_EVENTS = [
  // diagnostic
  "engage-fail", // repeated attempts without reaching a selective position
  "catheter-too-deep", // deep or wedged position
  "non-coaxial", // engaged but not coaxial
  "catheter-kink", // torque without tip response, shaft winding
  "dilated-root",
  "small-root",
  "anomalous-origin",
  "graft-not-found",
  "radial-spasm",
  "radial-loop",
  "subclavian-tortuosity",
  "pressure-damped",
  "pressure-ventricularised",
  "conus-selective",
  "contrast-streaming", // poor opacification, catheter not seated
  "ostial-spasm",
  "total-occlusion", // the imaged or target vessel is occluded, acute or chronic (diagnostic and PCI)
  "cto", // the PCI target is a chronic total occlusion (raised by the PCI lab in CTO scenarios only); use in TipTrigger.requires
  "bifurcation", // the PCI target is a bifurcation lesion (raised by the PCI lab in bifurcation scenarios only); use in TipTrigger.requires
  "aorto-ostial-lesion", // the PCI target lies within 3-5 mm of an RCA, left main or graft origin (raised from the scenario's lesion definition); use in TipTrigger.requires
  "branch-ostial-lesion", // the PCI target lies within 3-5 mm of a branch origin (Medina 0,0,1 or 0,1,0); use in TipTrigger.requires
  // pci
  "new-narrowing", // a new narrowing after a wire or device has been advanced (spasm or pseudolesion)
  "new-narrowing-tortuous", // new narrowings at bends after a stiff wire or microcatheter straightens a tortuous vessel (raise with new-narrowing)
  "coronary-spasm", // spasm provoked by wires or devices during PCI (not catheter-tip ostial spasm)
  "poor-guide-support",
  "guide-backout",
  "wire-not-crossing",
  "wire-side-branch",
  "wire-subintimal",
  "wire-distal-position",
  "wire-prolapse", // wire repeatedly passes an angulated target branch into the main vessel, or cannot advance through tortuosity
  "microcatheter-needed",
  "microcatheter-removal", // withdrawing a microcatheter or over-the-wire device over a short wire
  "balloon-uncrossable",
  "balloon-undilatable",
  "stent-uncrossable",
  "stent-underexpanded",
  "stent-recoil", // a stent that expanded and then lost diameter (distinct from stent-underexpanded)
  "side-branch-compromise",
  "thrombus",
  "slow-flow",
  "no-reflow",
  "dissection",
  "aortocoronary-dissection", // contrast staining at the ostium, sinus or aortic wall (not a dissection further down the artery)
  "perforation",
  "equipment-entrapment",
  "stent-loss",
  "acute-closure",
  "air",
  // patient and general
  "hypotension",
  "bradycardia",
  "vf",
  "chest-pain",
  "st-elevation",
  "contrast-reaction",
  "high-contrast-volume",
  "high-radiation-dose",
  "bleeding",
  "haematoma",
  "limb-ischaemia",
  "low-act",
  // access
  "venous-flashback", // dark, non-pulsatile return at the needle hub
  "no-flashback", // no blood at the needle hub
  // physiology
  "ach-provocation", // intracoronary acetylcholine being given (vasoreactivity testing), never adenosine FFR

  // Case and scenario properties are events too: the lab raises them for the whole case and tips gate
  // on them with TipTrigger.requires. There is no separate flags field.
  // lesion and scenario (raised for the whole case)
  "left-main-lesion",
  "graft-lesion", // the target lies in a bypass graft
  "in-stent-lesion", // restenosis or a lesion inside a previous stent (not "isr")
  "scad-suspected", // spontaneous coronary artery dissection is suspected (not "scad")
  "calcified-lesion",
  "stent-thrombosis",
  "small-vessel",
  "large-vessel",
  "long-lesion",
  "prior-cabg",
  "post-arrest", // the patient has been resuscitated from cardiac arrest
  "prior-tavi", // a transcatheter aortic valve is in place
  "stemi",
  "nste-acs",
  "high-flow",
  "contrast-sensitive",
  "no-onsite-pci", // the lab has no PCI on site
  "pregnancy-possible",
  "pde5-recent", // a phosphodiesterase-5 inhibitor was taken recently
  "vasopressor", // the patient is on a vasopressor infusion
  // haemodynamic scenario flags (raised for the whole study)
  "aortic-stenosis",
  "low-flow-aortic-stenosis",
  "mitral-stenosis",
  "hocm",
  "constriction",
  "restriction",
  "pulmonary-embolism",
  "pulmonary-hypertension",
  "tricuspid-regurgitation",
  "tricuspid-stenosis",
  "pulmonary-stenosis",
  "atrial-shunt",
  "ventricular-shunt",
  "cardiogenic-shock",
  "tamponade",
  // patient
  "vt", // ventricular tachycardia
  "atrial-fibrillation", // not "af"
  "av-block", // complete heart block (not "heart-block")
  "vagal", // vasovagal reaction
  "lv-ectopy", // ventricular ectopy
  "pericardial-effusion",
  "pulmonary-oedema",
  "high-lvedp",
  "desaturation",
  "over-sedation",
  "neuro-deficit", // a new neurological deficit
  // PCI equipment and technique
  "wire-fracture",
  "balloon-entrapment",
  "balloon-no-deflate",
  "balloon-rupture",
  "stent-loss-wire-out", // a lost stent with no wire through it
  "snare-in-use",
  "extension-in-place", // a guide extension is in the artery
  "epd-deployed", // an embolic protection device is deployed
  "wire-out-of-guide", // the wire tip has left the guide
  "second-wire-with-device", // a second wire is being loaded alongside a device already in the guide
  // flow
  "no-reflow-refractory", // no-reflow persisting after first-line treatment
  "plaque-embolisation",
  // calcium
  "atherectomy-rotational",
  "atherectomy-orbital",
  "burr-not-advancing",
  "burr-deceleration",
  "long-run", // a long atherectomy run
  "laser-active",
  "ivl-active", // intravascular lithotripsy in use
  // perforation subtypes (raised with "perforation")
  "perforation-large-vessel",
  "perforation-distal",
  "perforation-collateral", // not "collateral-perforation"
  // CTO
  "retrograde", // a retrograde approach is in progress
  "retrograde-connection", // the retrograde wire has reached the antegrade system
  // diagnostic
  "vasodilator-given",
  "operator-dose-alarm",
  "wire-in-lv",
  "wire-not-leading", // the catheter is advanced without the wire leading
  "aspiration-failed", // no blood can be aspirated from the catheter
  "catheter-plugged",
  "transducer-fault",
  "contrast-hold-up", // contrast lingers at the tip after an injection
  "myocardial-stain",
  "papillary-entrapment",
  "catheter-induced-regurgitation",
  "non-diagnostic-run",
  "territory-unsupplied", // a required territory or segment has not been seen opacified
  "graft-stump",
  "subclavian-stenosis",
  "torque-not-transmitted",
  // access
  "wire-resistance", // resistance to the wire along the access route (not "iliac-resistance")
  "wire-misdirected", // the wire has entered a wrong arch or access branch (not "wire-wrong-branch")
  "wrong-height", // the puncture is above or below the intended level
  "dilator-resistance",
  "act-high",
  "pseudoaneurysm",
  // devices
  "catheter-knot",
  "suction", // a support pump reports suction
  "pump-migration",
  "ventilated",
] as const;

export type LabEvent = (typeof LAB_EVENTS)[number];

/**
 * Event names the group plans used that were settled on another name. Not in LAB_EVENTS; the
 * validator names the replacement when a tip uses one.
 */
export const SUPERSEDED_EVENTS: Readonly<Record<string, LabEvent>> = {
  "chronic-occlusion": "cto",
  isr: "in-stent-lesion",
  scad: "scad-suspected",
  "heart-block": "av-block",
  "ventricular-tachycardia": "vt",
  af: "atrial-fibrillation",
  "collateral-perforation": "perforation-collateral",
  pseudolesion: "new-narrowing-tortuous",
  "wire-wrong-branch": "wire-misdirected",
  "iliac-resistance": "wire-resistance",
};

/** Bifurcation stenting techniques; a technique's step numbers are those of its step catalogue. */
export const BIF_TECHNIQUES = ["provisional", "dk-crush", "culotte", "t-stent", "tap", "reverse-crush", "mini-crush", "v-stent", "sks"] as const;
export type BifTechnique = (typeof BIF_TECHNIQUES)[number];

/** Intravascular imaging modality in use. */
export const IMAGING_MODALITIES = ["ivus", "oct"] as const;
export type ImagingModality = (typeof IMAGING_MODALITIES)[number];

/** The procedure being done, for labs that host more than one (structural, mcs, bedside). */
export const LAB_PROCEDURES = [
  "tavi",
  "bav",
  "teer",
  "tteer",
  "transseptal",
  "laao",
  "septal-occluder",
  "pmc",
  "septal-ablation",
  "iabp",
  "impella",
  "ecmo",
  "large-bore",
  "pacing",
  "tcp",
  "overdrive",
  "biopsy",
  "pericardiocentesis",
] as const;
export type LabProcedure = (typeof LAB_PROCEDURES)[number];

/** Catheter shape families as the labs report them (ids in src/data/catheters.ts belong to these). */
export const CATHETER_FAMILIES = ["JL", "JR", "AL", "AR", "MP", "TIG", "EBU", "IKL", "IKR", "IM", "PIG", "radial-universal"] as const;
export type CatheterFamily = (typeof CATHETER_FAMILIES)[number];

export const TIP_VESSELS = ["LM", "LAD", "LCx", "RCA", "SVG", "LIMA", "RIMA", "radial-graft"] as const;
export type TipVessel = (typeof TIP_VESSELS)[number];

/** The access route a closure or access tip belongs to. */
export const ACCESS_ROUTES = ["femoral", "radial", "distal-radial", "ulnar", "femoral-vein", "jugular", "subclavian"] as const;
export type AccessRoute = (typeof ACCESS_ROUTES)[number];

export interface TipTrigger {
  phase?: LabPhase[];
  /** the access route, for access-lab tips that apply to one route only */
  route?: AccessRoute[];
  event?: LabEvent[];
  /** events that must ALL be active as well (AND, unlike `event`), e.g. ["cto"] for CTO-only tips */
  requires?: LabEvent[];
  catheter?: CatheterFamily[];
  engagement?: EngagementKind[];
  pressure?: PressureKind[];
  /** the target vessel or graft, when it matters */
  vessel?: TipVessel[];
  /** the procedure being done (any of these) */
  procedure?: LabProcedure[];
  /** the bifurcation technique in use */
  technique?: BifTechnique[];
  /** inclusive range of the technique's step numbers; only with technique */
  step?: [from: number, to: number];
  /** the intravascular imaging modality in use */
  imaging?: ImagingModality[];
}

/** Another lab in which a tip is also shown, at the named phases of that lab (any phase if none). */
export interface TipBorrow {
  lab: LabId;
  phase?: LabPhase[];
}

export interface LabTip {
  /** globally unique kebab-case id, prefixed with the lab, e.g. "diag-jl-dilated-root" */
  id: string;
  lab: LabId;
  when: TipTrigger;
  /** short imperative headline, sentence case */
  title: string;
  /** the tip itself: 1–4 sentences, original wording */
  text: string;
  /** "do" = technique, "caution" = safety warning, "bailout" = what to do when it has gone wrong */
  tone: "do" | "caution" | "bailout";
  /** the lesson that teaches it (must exist) */
  lessonId: string;
  sources: SourceLoc[];
  refs?: RefId[];
  /**
   * Other labs that show this tip. In a borrowing lab the entry's phases replace the trigger's own
   * phase condition (which names phases of the tip's lab); every other condition still applies.
   */
  alsoIn?: TipBorrow[];
}

export const LAB_TIPS: LabTip[] = [...MANUAL_TIPS];

export const TIP_BY_ID: Record<string, LabTip> = Object.fromEntries(LAB_TIPS.map((t) => [t.id, t]));

/** Context a lab reports when it asks for relevant tips. */
export interface LabContext {
  lab: LabId;
  phase?: LabPhase;
  /** further phases active at the same time, matched as a union with phase (e.g. step and site in the full case) */
  phases?: LabPhase[];
  events?: LabEvent[];
  catheter?: CatheterFamily;
  engagement?: EngagementKind;
  pressure?: PressureKind;
  vessel?: TipVessel;
  /** the access route being worked on (access lab) */
  route?: AccessRoute;
  /** the procedures being done (structural, mcs and bedside labs) */
  procedures?: LabProcedure[];
  /** the bifurcation technique in use, and the step of it the operator is at */
  technique?: BifTechnique;
  step?: number;
  /** the intravascular imaging modality in use */
  imaging?: ImagingModality;
}

function inPhase(ctx: LabContext, allowed: readonly string[]): boolean {
  if (ctx.phase && allowed.includes(ctx.phase)) return true;
  return !!ctx.phases?.some((p) => allowed.includes(p));
}

/**
 * The tip's score in this context, or null when it does not apply: phase +1, event +4, requires +1,
 * catheter +2, engagement +2, pressure +3, vessel +1, route +1, technique +3, step +2, imaging +2,
 * procedure +2, and +0.5 for a caution or bailout tip.
 */
export function tipScore(tip: LabTip, ctx: LabContext): number | null {
  const w = tip.when;
  let phaseRule: readonly string[] | undefined;
  if (tip.lab === ctx.lab) phaseRule = w.phase;
  else {
    const borrow = tip.alsoIn?.find((a) => a.lab === ctx.lab);
    if (!borrow) return null;
    phaseRule = borrow.phase;
  }
  let score = 0;
  if (phaseRule?.length) {
    if (!inPhase(ctx, phaseRule)) return null;
    score += 1;
  }
  if (w.event?.length) {
    if (!ctx.events?.some((e) => w.event!.includes(e))) return null;
    score += 4;
  }
  if (w.requires?.length) {
    if (!w.requires.every((e) => ctx.events?.includes(e))) return null;
    score += 1;
  }
  if (w.catheter?.length) {
    if (!ctx.catheter || !w.catheter.includes(ctx.catheter)) return null;
    score += 2;
  }
  if (w.engagement?.length) {
    if (!ctx.engagement || !w.engagement.includes(ctx.engagement)) return null;
    score += 2;
  }
  if (w.pressure?.length) {
    if (!ctx.pressure || !w.pressure.includes(ctx.pressure)) return null;
    score += 3;
  }
  if (w.vessel?.length) {
    if (!ctx.vessel || !w.vessel.includes(ctx.vessel)) return null;
    score += 1;
  }
  if (w.route?.length) {
    if (!ctx.route || !w.route.includes(ctx.route)) return null;
    score += 1;
  }
  if (w.technique?.length) {
    if (!ctx.technique || !w.technique.includes(ctx.technique)) return null;
    score += 3;
  }
  if (w.step) {
    const [from, to] = w.step;
    if (ctx.step === undefined || ctx.step < from || ctx.step > to) return null;
    score += 2;
  }
  if (w.imaging?.length) {
    if (!ctx.imaging || !w.imaging.includes(ctx.imaging)) return null;
    score += 2;
  }
  if (w.procedure?.length) {
    if (!ctx.procedures?.some((p) => w.procedure!.includes(p))) return null;
    score += 2;
  }
  if (tip.tone === "caution" || tip.tone === "bailout") score += 0.5;
  return score;
}

/**
 * How narrowly a tip's trigger is drawn, in this context's lab (a borrowed tip is judged by the phases
 * of its alsoIn entry, as tipScore matches it). `conditions` counts the conditions the trigger sets:
 * one for each of phase, event, catheter, engagement, pressure, vessel, route, technique, step, imaging
 * and procedure, and one for every required event (each is a further AND condition). `breadth` counts
 * the alternatives the trigger accepts: the entries of its any-of lists (phase, event, catheter,
 * engagement, pressure, vessel, route, technique, imaging, procedure) plus the number of steps in its
 * step range. More conditions, and then fewer alternatives, mean a more specific tip.
 */
export interface TipSpecificity {
  conditions: number;
  breadth: number;
}

export function tipSpecificity(tip: LabTip, ctx: Pick<LabContext, "lab">): TipSpecificity {
  const w = tip.when;
  const phaseRule = tip.lab === ctx.lab ? w.phase : tip.alsoIn?.find((a) => a.lab === ctx.lab)?.phase;
  const lists: (readonly unknown[] | undefined)[] = [phaseRule, w.event, w.catheter, w.engagement, w.pressure, w.vessel, w.route, w.technique, w.imaging, w.procedure];
  let conditions = 0;
  let breadth = 0;
  for (const l of lists)
    if (l?.length) {
      conditions += 1;
      breadth += l.length;
    }
  if (w.requires?.length) conditions += w.requires.length;
  if (w.step) {
    conditions += 1;
    breadth += Math.max(1, w.step[1] - w.step[0] + 1);
  }
  return { conditions, breadth };
}

const isWarning = (t: LabTip) => t.tone === "caution" || t.tone === "bailout";

/**
 * The tie-break between two tips of equal score, shared by tipsFor and tipsForAll: the more specific
 * trigger first (more conditions set, then fewer alternatives in its lists, see tipSpecificity), then
 * a caution or bailout tip ahead of a do tip. The score already carries the tone bonus, so a warning
 * never falls behind a do tip it outscores; the tone key only orders tips whose scores and
 * specificity are equal. Under the current weights every other score term is a whole number and the
 * tone bonus is +0.5, so a warning and a do tip never tie on score and the tone key is defensive: it
 * keeps the rule if the weights change. Anything still tied keeps registry order (the callers' last
 * key).
 */
function compareTied(a: { tip: LabTip; spec: TipSpecificity }, b: { tip: LabTip; spec: TipSpecificity }): number {
  return (
    b.spec.conditions - a.spec.conditions ||
    a.spec.breadth - b.spec.breadth ||
    Number(isWarning(b.tip)) - Number(isWarning(a.tip))
  );
}

/**
 * Tips that apply in this context, highest score first. A tip matches when every condition it sets
 * is met by the context; a tip with an event is shown only while that event is active. Tips of
 * another lab appear through their alsoIn entry for this lab.
 *
 * Ties on score are broken by specificity (compareTied: more conditions, then narrower phase, event
 * and other lists, then caution and bailout ahead of do), and then by registry order, so a tip drawn
 * for one phase and one event is not pushed out of a short list by broader tips that happen to be
 * registered before it.
 */
export function tipsFor(ctx: LabContext, limit = 6, tips: readonly LabTip[] = LAB_TIPS): LabTip[] {
  const scored: { tip: LabTip; score: number; spec: TipSpecificity; ri: number }[] = [];
  tips.forEach((tip, ri) => {
    const score = tipScore(tip, ctx);
    if (score !== null) scored.push({ tip, score, spec: tipSpecificity(tip, ctx), ri });
  });
  return scored
    .sort((a, b) => b.score - a.score || compareTied(a, b) || a.ri - b.ri)
    .slice(0, limit)
    .map((s) => s.tip);
}

/**
 * Tips for several contexts at once (the full case spans the access, diagnostic, PCI and haemodynamic
 * labs): each tip once, at its best score across the contexts, highest score first; ties are broken
 * by the context in which the tip first reached that score, then by specificity in that context (as
 * in tipsFor), then by registry order. With one context the result is tipsFor's.
 */
export function tipsForAll(ctxs: readonly LabContext[], limit = 6, tips: readonly LabTip[] = LAB_TIPS): LabTip[] {
  // ci and ri: the context index and registry index at the tip's best score (first context on a tie)
  const best = new Map<string, { tip: LabTip; score: number; spec: TipSpecificity; ci: number; ri: number }>();
  ctxs.forEach((ctx, ci) =>
    tips.forEach((tip, ri) => {
      const score = tipScore(tip, ctx);
      if (score === null) return;
      const prev = best.get(tip.id);
      if (!prev) best.set(tip.id, { tip, score, spec: tipSpecificity(tip, ctx), ci, ri });
      else if (score > prev.score) Object.assign(prev, { score, spec: tipSpecificity(tip, ctx), ci, ri });
    })
  );
  return [...best.values()]
    .sort((a, b) => b.score - a.score || a.ci - b.ci || compareTied(a, b) || a.ri - b.ri)
    .slice(0, limit)
    .map((s) => s.tip);
}

/** Map a catheter id from src/data/catheters.ts to its family. */
export function catheterFamily(id: string): CatheterFamily | undefined {
  if (/^JL/.test(id)) return "JL";
  if (/^JR/.test(id)) return "JR";
  if (/^AL/.test(id)) return "AL";
  if (/^AR/.test(id)) return "AR";
  if (/^MP/.test(id)) return "MP";
  if (/^TIG/.test(id)) return "TIG";
  if (/^EBU|^XB|^VL/.test(id)) return "EBU";
  if (id === "IKL") return "IKL";
  if (id === "IKR") return "IKR";
  if (/^IM/.test(id)) return "IM";
  if (/^PIG/.test(id)) return "PIG";
  return undefined;
}
