// ===========================================================================
// CathMaster Academy — content schema.
//
// Every lesson, quiz item and case in the app is plain typed data that follows
// these interfaces. Content lives in src/content/tracks/*.ts (one file per
// track) and src/content/cases/*.ts. `validateTrack` (validate.ts) and
// content.test.ts enforce integrity: unique ids, valid answer indices, case
// branches that resolve, and references/sims/figures that exist.
// ===========================================================================

export type TrackId =
  | "foundations" // 0 — never done cardiology
  | "diagnostic" // 1 — diagnostic coronary angiography
  | "haemodynamics" // 2 — right/left heart catheterisation
  | "physiology-imaging" // 3 — FFR/iFR, IVUS/OCT, microvascular
  | "pci-core" // 4 — core PCI
  | "pci-complex" // 5 — bifurcation, LM, calcium, CTO, SVG, thrombus
  | "complications" // 6 — prevent → recognise → treat
  | "acute-mcs" // 7 — STEMI, cardiogenic shock, IABP/Impella/ECMO
  | "structural" // 8 — TAVI, TEER, LAAO, PFO/ASD, BAV, ASA
  | "procedures-career" // 9 — pacing, pericardiocentesis, closure devices, becoming independent
  // The manual curriculum (2026-10): every topic of the two core manuals, step by step
  | "pci-manual" // 10 — the steps of every PCI, from planning to closure
  | "complex-pci" // 11 — complex lesion subsets and complex patients, CTO included
  | "complication-management" // 12 — acute closure, perforation, entrapment, access and other complications
  | "equipment" // 13 — the equipment of the lab, class by class
  | "cath-handbook"; // 14 — the catheter laboratory handbook: team, access, haemodynamics, conditions, grafts, other procedures, aftercare

/**
 * The two core manuals the manual curriculum is built on. Lessons cite where their teaching comes
 * from so it can be checked and read further; the text itself is always original.
 * - brilakis-pci: Brilakis ES. Manual of Percutaneous Coronary Interventions: A Step-by-Step Approach (Elsevier); loc is a section number such as "8.3"
 * - oxford-cath: Mitchell A, De Maria GL, Banning A. Cardiac Catheterization and Coronary Intervention, 2nd ed. (OUP 2020); loc is "ch <n>: <section heading>"
 */
export type BookId = "brilakis-pci" | "oxford-cath";

export interface SourceLoc {
  book: BookId;
  loc: string;
}

/**
 * Training stage the content targets (loosely mirrors entrustment levels).
 * 1 Foundations · 2 Diagnostic operator · 3 PCI under supervision ·
 * 4 Independent PCI · 5 Complex PCI / structural / MCS
 */
export type Stage = 1 | 2 | 3 | 4 | 5;

/** Interactive simulators a lesson or module can send the learner to. */
export type SimId =
  | "cathlab" // coronary angiography fluoroscopy sim (engage, inject, views)
  | "procedure" // full sequence: puncture → wire → aorta → engage
  | "views" // projection / view-identification trainer
  | "haemo" // right/left heart catheterisation, waveforms, calculations
  | "pci-bench" // balloon/stent sizing, deployment, optimisation with IVUS/OCT
  | "physiology" // pressure wire: FFR, resting indices, pullback, drift
  | "iabp" // intra-aortic balloon pump console and timing
  | "impella" // microaxial flow pump positioning and management
  | "ecmo" // VA-ECMO circuit and complications
  | "tavi" // TAVI CT planning and deployment
  | "teer" // mitral transcatheter edge-to-edge repair
  | "laao" // left atrial appendage occlusion
  | "pacing" // temporary transvenous pacing
  | "pericardiocentesis"
  // timed pressure-trace recognition drill (diag-pressure-recognition-drill, src/ui/sections/PressureTrainer.tsx);
  // it reads a 'set' param (damping | hypotension | faults | all) or a scenario of its .launch.ts
  | "pressure";

/**
 * Real-angiogram and PCI-lab destinations that a lesson can link to with
 * parameters (a "drill" block). They are kept out of SimId until the app's
 * SIM_SECTION map (src/state/useUiStore.ts) gains entries for them; see
 * docs/realism/wave1/S13.md for the one-line integration.
 */
export type AngioSimId = "angio-real" | "angio-pci";

/** Reading drills in the Real angiograms section that a "drill" block can open. */
export type AngioDrillId =
  | "artery"
  | "dominance"
  | "occlusion"
  | "collaterals"
  | "view"
  | "grade"
  | "locate"
  | "estimate"
  | "plan"
  | "review"
  // Expert-label drills (angio-expert-label-drills, src/ui/angio/labels.ts): each is shown once enough library runs
  // carry a supervising reader's labels for it, and says 'not yet labelled' until then. 'timi' and 'frame-count'
  // open the simulated-run drill (src/ui/angio/simFlowDrill.ts) until the real runs are labelled. They are declared
  // in src/content/practice/angio-expert-label-drills.launch.ts, which lists them under their lessons.
  | "timi"
  | "frame-count"
  | "morphology"
  | "collateral-grade"
  | "medina"
  | "calcium"
  | "classify"
  | "segment"
  // SYNTAX lesion marking on real AngioCAD studies (angio-decision-drills, src/ui/angio/syntax.ts): dominance, lesions
  // of 50% or more by segment and their adverse features, compared with the AngioCAD segment grades per segment.
  | "syntax";

/**
 * Parameters a "drill" block may pass, per drill, with the values allowed.
 * The Real angiograms section applies them to the first set it builds
 * (src/ui/angio/library.ts applyDrillParams); validate.ts rejects any other key
 * or value, so a parameter in content always takes effect.
 *  - artery: only runs of that coronary injection ("LCA" or "RCA")
 *  - borderline: view drill rule for runs within 5° of a naming boundary
 *  - part: the plan drill's part; "missing-facts" opens the decision step on
 *    real AngioCAD studies (count the diseased vessels, then name the facts the
 *    dataset does not record that the decision needs; angio-decision-drills).
 *    It is not called "step" because LAUNCH_KEYS reserves "step" for a
 *    technique's step, which a launch link would then reject without a technique.
 * Drills whose answer is the artery or a property of one artery (artery,
 * dominance, occlusion, collaterals) take no artery filter.
 */
export const DRILL_PARAM_RULES: Partial<Record<AngioDrillId, Readonly<Record<string, readonly string[]>>>> = {
  view: { artery: ["LCA", "RCA"], borderline: ["accept", "exclude"] },
  grade: { artery: ["LCA", "RCA"] },
  locate: { artery: ["LCA", "RCA"] },
  estimate: { artery: ["LCA", "RCA"] },
  plan: { part: ["missing-facts"] },
};

/** Built-in SVG teaching diagrams (rendered by src/ui/content/Figures.tsx). */
export type FigureId =
  | "coronary-tree" // left and right coronary systems with main branches
  | "aha-segments" // AHA/SYNTAX segment numbering
  | "views-compass" // C-arm angulation: LAO/RAO × cranial/caudal
  | "wiggers" // cardiac cycle: pressures, volumes, ECG, heart sounds
  | "rhc-waveforms" // RA → RV → PA → PCWP pullback
  | "iabp-timing" // correct and incorrect balloon timing
  | "impella-position" // inlet/outlet relative to aortic valve
  | "ecmo-circuit" // VA-ECMO femoro-femoral circuit
  | "tavi-depth" // implant depth relative to annulus
  | "medina" // Medina bifurcation classification
  | "ellis" // Ellis perforation classification
  | "nhlbi-dissection" // NHLBI dissection types A–F
  | "cto-algorithm" // hybrid CTO algorithm
  | "stent-compliance"; // balloon/stent diameter vs inflation pressure

/** Reference ids must exist in src/content/refs.ts (enforced by test). */
export type RefId = string;

export type Block =
  | { kind: "h"; text: string }
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[]; ordered?: boolean }
  | { kind: "keypoints"; title?: string; items: string[] }
  | { kind: "pitfalls"; title?: string; items: string[] }
  | { kind: "pearl"; text: string }
  | { kind: "table"; caption?: string; head: string[]; rows: string[][] }
  | { kind: "steps"; title?: string; items: { title: string; detail: string }[] }
  | { kind: "formula"; name: string; expr: string; note?: string }
  | { kind: "figure"; id: FigureId; caption: string }
  /**
   * Link to a simulator. `params` opens it at a named scenario, start state and mode
   * (LaunchParams); validateLaunch.ts checks every id against the labs' .launch.ts files.
   */
  | { kind: "sim"; sim: SimId; task: string; params?: LaunchParams }
  /**
   * A real cine run from the locally built angiogram library (by run id, for
   * example a CADICA "p10_v1" or CoronaryDominance "cd-01029-LCA-2" run). When
   * the library is not installed the block shows a short notice instead.
   */
  | { kind: "cine"; run: string; caption: string; showBoxes?: boolean }
  /**
   * Link into a specific reading drill or the PCI lab, with optional parameters. For target
   * "angio-pci" the params are LaunchParams and are validated like a sim block's.
   */
  | { kind: "drill"; target: AngioSimId; drill?: AngioDrillId; params?: Record<string, string>; task: string }
  /**
   * A YouTube video by id from the video registry (src/content/videos.ts), shown as a link that
   * opens in a new tab: further study beside the lesson, never a replacement for it. `note` says
   * what to watch for.
   */
  | { kind: "video"; id: string; note?: string }
  /**
   * An inline check of understanding inside a lesson (the step-by-step interaction): the learner
   * picks an option and sees the explanation. 3–5 options; `answer` indexes them.
   */
  | { kind: "check"; stem: string; options: string[]; answer: number; explanation: string }
  /** A technique tip from the lab tip registry (src/content/lab/tips.ts), shown as it appears in the lab. */
  | { kind: "tip"; id: string };

export interface Lesson {
  /** globally unique, kebab-case, prefixed with the track id */
  id: string;
  title: string;
  /** estimated reading time */
  minutes: number;
  blocks: Block[];
  refs?: RefId[];
  /** where in the two core manuals this lesson's teaching comes from (shown as further reading) */
  sources?: SourceLoc[];
  /** coverage-map topic ids this lesson teaches (docs/curriculum/coverage-map-2026-10-06.json) */
  topics?: string[];
}

export interface QuizItem {
  id: string;
  stem: string;
  /** 3–5 options */
  options: string[];
  /** index into options */
  answer: number;
  /** why the answer is right AND why the main distractor is wrong */
  explanation: string;
  difficulty: 1 | 2 | 3;
  refs?: RefId[];
}

export interface CaseOption {
  text: string;
  /** the single best action at this step */
  best?: boolean;
  /** reasonable but not best */
  acceptable?: boolean;
  feedback: string;
  /**
   * id of the next step. When omitted the case continues with the next main
   * step in order (consequence steps are skipped); after the last main step
   * the case ends.
   */
  next?: string;
  /** how this choice changes the patient's course; deltas accumulate across the case */
  stateDelta?: CaseStateDelta;
}

/**
 * Accumulating case state. `stability` is a teaching score (model parameter,
 * not a physiological quantity) that starts at 100 and makes the cost of
 * non-best choices visible; `flags` record events that later steps and the
 * outcome can refer to (for example "dissection" or "no-reflow").
 */
export interface CaseStateDelta {
  /** change in the stability score, −50…+50 */
  stability?: number;
  /** kebab-case event flags set by this choice */
  flags?: string[];
}

export interface CaseStep {
  id: string;
  prompt: string;
  /** new information revealed at this step (findings, vitals, images described) */
  info?: string;
  options: CaseOption[];
  /**
   * "consequence": a complication or recovery step reached only through an
   * option's `next`. It is skipped by in-order progression; options without
   * `next` return to the main step after the one the learner came from.
   */
  kind?: "main" | "consequence";
  /** extra information shown when an earlier choice set the flag */
  variants?: { flag: string; info: string }[];
}

export type CaseProvenance =
  | { kind: "published"; citation: string; url: string }
  | { kind: "synthetic"; basedOn?: string };

export interface CaseStudy {
  id: string;
  title: string;
  trackId: TrackId;
  stage: Stage;
  provenance: CaseProvenance;
  summary: string;
  presentation: string;
  findings: string[];
  /** steps[0] is the entry point */
  steps: CaseStep[];
  outcome: string;
  /** outcome text added when an earlier choice set the flag */
  outcomeVariants?: { flag: string; text: string }[];
  learningPoints: string[];
  refs?: RefId[];
  /** lab practice for this case, rendered after the outcome as 'Practise this in the lab' */
  practice?: PracticeLink[];
}

export interface Module {
  id: string;
  title: string;
  stage: Stage;
  summary: string;
  objectives: string[];
  lessons: Lesson[];
  quiz: QuizItem[];
  sims?: { sim: SimId; task: string; params?: LaunchParams }[];
  caseIds?: string[];
}

export interface Track {
  id: TrackId;
  order: number;
  title: string;
  tagline: string;
  description: string;
  stage: Stage;
  modules: Module[];
  cases: CaseStudy[];
}

export type RefKind =
  | "book"
  | "handbook"
  | "guideline"
  | "consensus"
  | "trial"
  | "paper"
  | "case"
  | "web"
  | "supplied";

export interface Reference {
  id: RefId;
  kind: RefKind;
  citation: string;
  url?: string;
  note?: string;
  /** true only once the citation has been checked against the source */
  verified: boolean;
  /**
   * Numbers checked against the primary paper's full text (not its abstract), by name, for code that may show a
   * value only once it is verified: for example the TIMI frame count study's frame rate and normal counts
   * (src/ui/angio/labels.ts FRAME_COUNT_VALUE_KEYS). Absent until someone has checked them.
   */
  verifiedValues?: Record<string, number>;
}

export interface GlossaryEntry {
  term: string;
  definition: string;
}

// ---------------------------------------------------------------------------
// Lab launches (found-launch-links): one parameter shape for every deep link
// from a lesson, case, case library or progress screen into a lab.
// ---------------------------------------------------------------------------

/** Every destination a launch can name: the simulators and the real-angiogram and PCI-lab targets. */
export type LaunchSim = SimId | AngioSimId;

/** Supervision modes a launch may ask for. */
export type LaunchMode = "guided" | "supervised" | "independent" | "exam";
export const LAUNCH_MODES: readonly LaunchMode[] = ["guided", "supervised", "independent", "exam"];

/**
 * Parameters of a launch. Standard keys (all optional):
 *  - scenario: a scenario id declared by the lab's .launch.ts
 *  - variant: a variant of that scenario
 *  - seed: a seed for the scenario's random draws
 *  - start: a named start state of that scenario
 *  - mode: guided | supervised | independent | exam
 *  - technique, step: a technique and its step number (tip vocabulary)
 *  - workspace: the lab workspace or tab to open on
 *  - preset: a dev-lab preset id (declared like a scenario)
 *  - events: comma-separated events the receiving lab adds to its context for the whole run
 * A lab may read further keys of its own (for example the view trainer's "exercise").
 */
export type LaunchParams = Record<string, string>;
export const LAUNCH_KEYS = ["scenario", "variant", "seed", "start", "mode", "technique", "workspace", "step", "preset", "events"] as const;

/** A practice entry on a case (CaseStudy.practice). */
export interface PracticeLink {
  sim: LaunchSim;
  task: string;
  params?: LaunchParams;
}

/** A start state or variant of a scenario, by id (a bare string is shorthand for { id }). */
export interface LaunchStart {
  id: string;
  title?: string;
}
export interface LaunchVariant {
  id: string;
  title?: string;
  /** reserved for held-out exams: never linked from lessons or cases, never in the practice index */
  heldOut?: boolean;
}

/** Engine-free metadata of one scenario (or dev-lab preset) of a lab. */
export interface LaunchScenario {
  id: string;
  title: string;
  /** lessons this scenario practises: each lists it under 'Practise this in the lab' */
  lessonIds: string[];
  caseIds?: string[];
  starts?: (string | LaunchStart)[];
  variants?: (string | LaunchVariant)[];
  /** the mode a lesson opens it in when the entry names none (default guided) */
  mode?: LaunchMode;
  /** reserved for held-out exams (HANDOVER 6.4): never linked from lessons or cases */
  heldOut?: boolean;
}

/** A named drill of a lab (for example a reading drill or a PCI bench exercise). */
export interface LaunchDrill {
  id: string;
  title: string;
  lessonIds?: string[];
  caseIds?: string[];
  heldOut?: boolean;
}

/**
 * A practice link declared outside lesson files: a scenario (possibly declared in another
 * .launch.ts of the same sim, merged by sim and scenario id) or a drill, opened at a start,
 * variant and mode, listed under the given lessons and cases. `adds` declares the start states
 * or variants this file adds to a scenario it does not own; a link may name only starts and
 * variants that the scenario or some file's `adds` declares.
 */
export interface LaunchLinkEntry {
  scenario?: string;
  drill?: string;
  start?: string;
  variant?: string;
  mode?: LaunchMode;
  /** label in the practice list (defaults to the scenario or drill title) */
  title?: string;
  /** further params passed to the lab (non-standard keys or technique, step, workspace, events) */
  params?: LaunchParams;
  lessonIds: string[];
  caseIds?: string[];
  adds?: { starts?: (string | LaunchStart)[]; variants?: (string | LaunchVariant)[] };
}

/**
 * What a src/**\/*.launch.ts file exports as `launch`. These files are metadata only: they import
 * nothing but types, so the content test, the practice index and node scripts can read them
 * without loading an engine.
 */
export interface LaunchFile {
  sim: LaunchSim;
  scenarios?: LaunchScenario[];
  drills?: LaunchDrill[];
  links?: LaunchLinkEntry[];
}
