// ---------------------------------------------------------------------------
// Rule group: the left heart tasks in the diagnostic lab (diag-lv-aorta-task).
// These rules only stop actions: their `when` never holds. The lab's left
// heart session module (src/ui/sim/modules/leftHeart.ts) asks them before the
// power injector fires ('power-inject') and before a hand injection into the
// ventricle or the root during a left heart task ('inject'), passing what it is
// about to do as LvMentorCtx.lvAction. They are exported as LV_RULES; `rules`
// (what RULES collects) is empty for the reason diagDrugs.ts gives: an
// action-only rule has no firing scenario for mentor.test.ts, and the live
// attending has no 'power-inject' hook yet.
//
//   lv-gram-lvedp-contraindication   a ventriculogram with the recorded LVEDP
//                                    above 35 mmHg (safety)
//   lv-gram-position-untested        a power injection from the apex, the
//                                    papillary region or against the wall
//                                    without a hand test injection there (safety)
//   aortogram-on-leaflets            an aortogram with the pigtail on the
//                                    leaflets (safety)
//   lv-gram-no-lvedp                 a ventriculogram before the LVEDP has been
//                                    recorded (technique)
//   lv-gram-settings-for-lvedp       standard settings with an LVEDP above
//                                    25 mmHg (technique)
//
// Sources (module text, src/content/manual/cath-handbook/04-cardiac-catheterisation.ts):
// LVEDP above 35 mmHg a relative contraindication (:1220, :1373); the mid-cavity,
// clear of the apex and the mitral apparatus, and the hand test injection of
// 10 mL when unsure the tip is clear of the wall (:1236, the problems table);
// record the LVEDP before the injector (:1239); reduce volume and rate with an
// LVEDP above 25 mmHg, for example 30 mL at 10 mL/s (:1248); for the aortogram,
// check that the catheter is not interfering with the leaflets (:1445). The
// lines send the learner to the cue (the trace, the image) rather than naming
// the answer.
//
// This file imports types only from the rule registry (registries.test.ts).
// ---------------------------------------------------------------------------

import type { MentorCtx } from "../context";
import type { MentorRule, RulePreAction } from "../rules";

/** Position of this group in RULES (after the diagnostic, PCI and drug groups). */
export const order = 320;

/** Where the tip of the left heart catheter is (the left heart module's classes). */
export type LvTipPosition = "mid-cavity" | "outflow" | "apex" | "mitral" | "papillary" | "wall" | "leaflets" | "root" | "ascending" | "other";

/** The LV positions a power injection should not be given from without a test injection. */
export const UNTESTED_POSITIONS: readonly LvTipPosition[] = ["apex", "papillary", "wall"];

/** What the left heart module is about to do, passed with the attending's context. */
export interface LvAction {
  task: "ventriculogram" | "aortogram";
  position: LvTipPosition;
  /** the LVEDP recorded in this case, mmHg (null: none recorded) */
  lvedp: number | null;
  /** a hand test injection was made at the tip's present position */
  testedHere: boolean;
  /** the injector's settings (absent for a hand injection) */
  settings?: { volumeMl: number; rateMlS: number; riseS: number };
}

/** The attending's context with the left heart action about to be taken. */
export interface LvMentorCtx extends MentorCtx {
  lvAction?: LvAction;
}

/**
 * The module text's LVEDP figures (04-cardiac-catheterisation.ts:1373): reduce the injection above 25 mmHg,
 * pulmonary oedema likely above 30 mmHg, a relative contraindication above 35 mmHg; and the reduced run
 * (:1248), for example 30 mL at 10 mL/s.
 */
export const LVEDP_RULES = { reduceAboveMmHg: 25, oedemaAboveMmHg: 30, contraindicationAboveMmHg: 35, reduced: { volumeMl: 30, rateMlS: 10 } } as const;

const actionOf = (c: MentorCtx): LvAction | undefined => (c as LvMentorCtx).lvAction;
const never = () => false;
const powerInject = (a: RulePreAction) => a === "power-inject";
const anyInject = (a: RulePreAction) => a === "power-inject" || a === "inject";

export const LV_RULES: MentorRule[] = [
  {
    id: "lv-gram-lvedp-contraindication",
    title: "Ventriculogram with a very high LVEDP",
    severity: "safety",
    phase: "inject",
    lab: "diagnostic",
    when: never,
    persistS: 0,
    stopOn: (a, c) => {
      const d = actionOf(c);
      return powerInject(a) && !!d && d.task === "ventriculogram" && d.lvedp !== null && d.lvedp > LVEDP_RULES.contraindicationAboveMmHg;
    },
    anchor: "pressure",
    cooldownS: 5,
    lines: {
      1: () => "Before you fire: what did the LVEDP tell you?",
      2: () => "Look at the end-diastolic pressure you recorded.",
      3: () => "An LVEDP that high is a reason not to do the ventriculogram at all.",
      4: () => "Leave the ventriculogram. Echo can answer the question; keep the contrast down.",
      5: () => "Stop. No ventriculogram at this filling pressure.",
    },
  },
  {
    id: "lv-gram-position-untested",
    title: "Power injection from a risky position without a test injection",
    severity: "safety",
    phase: "inject",
    lab: "diagnostic",
    when: never,
    persistS: 0,
    stopOn: (a, c) => {
      const d = actionOf(c);
      return powerInject(a) && !!d && d.task === "ventriculogram" && UNTESTED_POSITIONS.includes(d.position) && !d.testedHere;
    },
    anchor: "fluoro",
    cooldownS: 5,
    lines: {
      1: () => "Where is the pigtail sitting?",
      2: () => "Look at the loop on the image and at the ectopics.",
      3: () => "The tip is not in the mid-cavity. Thirty millilitres into the wall stains it.",
      4: () => "Pull back gently into the mid-cavity, or hand-inject 10 mL first to see where it goes.",
      5: () => "Stop. Not from there without a test injection.",
    },
  },
  {
    id: "aortogram-on-leaflets",
    title: "Aortogram with the pigtail on the leaflets",
    severity: "safety",
    phase: "inject",
    lab: "diagnostic",
    when: never,
    persistS: 0,
    stopOn: (a, c) => {
      const d = actionOf(c);
      return anyInject(a) && !!d && d.task === "aortogram" && d.position === "leaflets";
    },
    anchor: "fluoro",
    cooldownS: 5,
    lines: {
      1: () => "Is the pigtail clear of the valve?",
      2: () => "Watch the leaflets against the loop on the image.",
      3: () => "The loop is on the leaflets. It will make the regurgitation look worse than it is.",
      4: () => "Withdraw a little into the proximal ascending aorta, clear of the leaflets.",
      5: () => "Stop. Not with the catheter on the valve.",
    },
  },
  {
    id: "lv-gram-no-lvedp",
    title: "Ventriculogram before the LVEDP",
    severity: "technique",
    phase: "inject",
    lab: "diagnostic",
    when: never,
    persistS: 0,
    stopOn: (a, c) => {
      const d = actionOf(c);
      return powerInject(a) && !!d && d.task === "ventriculogram" && d.lvedp === null;
    },
    anchor: "pressure",
    cooldownS: 5,
    lines: {
      1: () => "What is the filling pressure?",
      2: () => "You have an LV trace. Read the end-diastolic pressure first.",
      3: () => "The LVEDP sets the volume and rate, and whether to do the run at all.",
      4: () => "Record the LVEDP after the a wave, then set the injector.",
      5: () => "Wait. LVEDP first.",
    },
  },
  {
    id: "lv-gram-settings-for-lvedp",
    title: "Standard settings with a raised LVEDP",
    severity: "technique",
    phase: "inject",
    lab: "diagnostic",
    when: never,
    persistS: 0,
    stopOn: (a, c) => {
      const d = actionOf(c);
      if (!powerInject(a) || !d || d.task !== "ventriculogram" || d.lvedp === null || !d.settings) return false;
      const R = LVEDP_RULES;
      return d.lvedp > R.reduceAboveMmHg && (d.settings.volumeMl > R.reduced.volumeMl || d.settings.rateMlS > R.reduced.rateMlS);
    },
    anchor: "syringe",
    cooldownS: 5,
    lines: {
      1: () => "Do those settings fit this patient?",
      2: () => "Look at the LVEDP you recorded against the volume and rate.",
      3: () => "With an LVEDP above 25 the run should be smaller and slower.",
      4: () => "Reduce it, for example to 30 mL at 10 mL/s.",
      5: () => "Wait. Reduce the injection first.",
    },
  },
];

/** What the registry collects into RULES: empty, as for the drug rules (see the header). */
export const rules: MentorRule[] = [];
