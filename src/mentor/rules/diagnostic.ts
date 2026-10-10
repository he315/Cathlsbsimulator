// ---------------------------------------------------------------------------
// Rule group: the diagnostic attending (S11), the first rules RULES held.
// Engagement, pressure and injection safety, pushing, aspiration and views;
// several apply in any lab ("any"). Also the time-out rule (kept outside
// RULES, as before) and MENTOR_PARAMS, the attending's thresholds, which the
// other rule groups read from here.
//
// Moved unchanged from src/mentor/rules.ts (found-mentor-registries): ids,
// order, lines, frames and thresholds are as they were.
// ---------------------------------------------------------------------------

import { ANALYSIS_PARAMS } from "../analysis";
import type { MentorCtx } from "../context";
import type { MentorRule } from "../rules";

/** Position of this group in RULES (src/mentor/rules/index.ts). */
export const order = 100;

/**
 * Thresholds the live attending uses. All are model parameters for expert
 * calibration (no literature source); they are listed in docs/realism/facts/S11.md.
 * Where the debrief measures the same thing, the value is read from the
 * debrief's own parameter set so the attending and the metrics agree.
 */
export const MENTOR_PARAMS = {
  /** model parameter: pushing this long (s) makes a further advance a take-over */
  pushStopS: 3,
  /** model parameter: seated this long (s) without a clean aspirate before the attending reminds */
  seatedNoAspirateS: 2,
  /** model parameter: wire in a septal this long (s) before advancing is stopped */
  septalStopS: 2,
  /**
   * model parameter: the attending speaks when the target segment's projected/true length is below
   * this during cine. Deliberately below the coverage adequacy threshold (DEFAULT_COVERAGE.minForeshortening,
   * 0.8): the attending interrupts only for a clearly foreshortened view; borderline views are left to the debrief.
   */
  foreshortenedTrigger: 0.7,
  /** balloon/reference ratio that counts as oversized outside the lesion (shared with the debrief metric) */
  oversizeRatio: ANALYSIS_PARAMS.oversizeRatio,
  /** model parameter: seconds without progress before the attending calls a time-out */
  timeoutNoProgressS: 60,
  /** model parameter: re-approaches to the same ostium before the attending calls a time-out */
  timeoutReapproaches: 3,
};

const sideName = (c: MentorCtx) => (c.engagement.endsWith("-rca") || c.targetSide === "right" ? "right" : "left main");
const traceWord = (c: MentorCtx) =>
  c.pressure === "ventricularised" ? "ventricularised" : c.pressure === "wedged" ? "wedged" : c.pressure === "dissected" ? "flat and damped" : "damped";

export const rules: MentorRule[] = [
  {
    id: "damped-before-inject",
    title: "Damped or ventricularised trace",
    severity: "safety",
    phase: "inject",
    lab: "any",
    when: (c) => c.damped,
    persistS: 1.5,
    stopOn: (a, c) => a === "inject" && c.damped,
    anchor: "pressure",
    cooldownS: 8,
    mistake: "damped-injection",
    lines: {
      1: () => "Before you do anything else, what is the pressure telling you?",
      2: (c) => (c.pressure === "ventricularised" ? `Look at the diastolic. It's down at ${Math.round(c.dia)}.` : "Look at the shape of that trace. Where has the notch gone?"),
      3: (c) => `That's ${traceWord(c)}. The tip is sitting against something or too deep in the ${sideName(c)}.`,
      4: () => "Come back a millimetre or two until the trace recovers, then aspirate before you inject.",
      5: () => "Stop. Don't inject.",
    },
    frames: [
      { id: "noise", text: "I thought it was a noisy trace", teaching: "A damped trace loses the dicrotic notch and narrows the pulse pressure; a ventricularised one keeps the systolic peak but the diastolic falls towards ventricular levels. Noise does not change the diastolic. Treat both as obstruction until a small withdrawal proves otherwise.", drill: "damped-injection" },
      { id: "not-looked", text: "I wasn't looking at the trace", teaching: "Build the habit of a glance at the pressure before every injection: seat, look at the trace, aspirate, then inject. The image tells you where the tip is; the trace tells you whether it is safe.", drill: "ignored-pressure-warning" },
      { id: "aspirate-enough", text: "I thought aspirating was enough", teaching: "Aspiration confirms there is no air or clot in the line. It does not prove the tip is free in the vessel. A damped trace with a good aspirate is still an obstructed ostium.", drill: "damped-injection" },
    ],
  },
  {
    id: "conus",
    title: "Conus over-selection",
    severity: "safety",
    phase: "engage",
    lab: "diagnostic",
    when: (c) => !!c.conus,
    persistS: 1.0,
    stopOn: (a, c) => a === "inject" && !!c.conus,
    anchor: "fluoro",
    cooldownS: 10,
    mistake: "vf-arrest",
    lines: {
      1: () => "Where do you think your tip is right now?",
      2: () => "Look at how high and anterior the tip is pointing, and at the trace.",
      3: () => "You're up in the conus branch, not the right coronary itself.",
      4: () => "Drop back a touch and turn a little anticlockwise to come off the conus onto the RCA ostium.",
      5: () => "Stop. Not in the conus.",
    },
    frames: [
      { id: "rca", text: "I thought I was in the RCA", teaching: "The conus often arises separately or from the very first millimetres of the RCA, higher and more anterior. A selective conus position damps the trace and injecting it can provoke ventricular fibrillation.", drill: "vf-arrest" },
      { id: "small-puff", text: "I was going to give a small test puff", teaching: "A test puff into a damped conus position carries the same risk as a full injection. Reposition first.", drill: "vf-arrest" },
    ],
  },
  {
    id: "lv-entry",
    title: "Tip in the ventricle",
    severity: "safety",
    phase: "engage",
    lab: "diagnostic",
    when: (c) => c.engagement === "in-lv" || c.pressure === "lv",
    persistS: 0.8,
    stopOn: (a, c) => (a === "inject" || a === "advance-catheter") && (c.engagement === "in-lv" || c.pressure === "lv"),
    anchor: "pressure",
    cooldownS: 10,
    mistake: "lv-entry",
    lines: {
      1: () => "Look at your pressure. Where are you?",
      2: () => "That diastolic is close to zero.",
      3: () => "You're across the valve.",
      4: () => "Pull back slowly until you see an aortic trace again, then rebuild from the sinus.",
      5: () => "Stop. You're in the ventricle. Pull back.",
    },
    frames: [
      { id: "push-seat", text: "I was trying to push it down to seat", teaching: "Height problems are solved by withdrawing and re-forming the curve, not by pushing. A Judkins left that is too small for the root prolapses into the ventricle when pushed.", drill: "lv-entry" },
      { id: "no-trace", text: "I didn't notice the trace change", teaching: "A ventricular trace has a diastolic near zero. Keep the pressure in your peripheral vision whenever you advance.", drill: "lv-entry" },
    ],
  },
  {
    id: "push-resistance",
    title: "Pushing against resistance",
    severity: "safety",
    phase: "engage",
    lab: "any",
    when: (c) => c.pushS > 0,
    persistS: 1.2,
    stopOn: (a, c) => (a === "advance-catheter" || a === "advance-device") && c.pushS > MENTOR_PARAMS.pushStopS,
    anchor: "hub",
    cooldownS: 6,
    mistake: "too-much-pushing",
    lines: {
      1: () => "What are you feeling in your hands?",
      2: () => "Feel that? It's not moving with you.",
      3: () => "Pushing harder won't seat it. You're loading the shaft.",
      4: () => "Take the load off, come back to the sinus and use a little torque instead.",
      5: () => "Stop pushing.",
    },
    frames: [
      { id: "almost", text: "I thought it was almost there", teaching: "Forward force against a tip that is not seating builds up in the shaft and releases suddenly, into the ventricle or deep into the vessel. Release, withdraw, and change the angle with torque.", drill: "too-much-pushing" },
      { id: "support", text: "I wanted more support", teaching: "Support comes from the catheter shape and its contact with the opposite aortic wall, not from pushing at the hub. If the curve does not give it, choose another catheter.", drill: "wrong-catheter" },
    ],
  },
  {
    id: "no-aspirate",
    title: "Injection without a clean aspirate",
    severity: "safety",
    phase: "inject",
    lab: "diagnostic",
    when: (c) => (c.engagement.startsWith("selective-") || c.engagement.startsWith("coaxial-")) && c.aspirated !== "clean" && c.engS > MENTOR_PARAMS.seatedNoAspirateS,
    persistS: 4,
    stopOn: (a, c) => a === "inject" && c.aspirated === "no-return",
    anchor: "syringe",
    cooldownS: 15,
    mistake: "no-aspirate",
    lines: {
      1: () => "You're seated. What do you do before you inject?",
      2: () => "Check the manifold.",
      3: () => "You haven't aspirated since you moved.",
      4: () => "Draw back until you see free blood, clear any bubbles, then inject.",
      5: () => "Stop. You've got no back-bleed. Don't inject.",
    },
    frames: [
      { id: "did-before", text: "I aspirated earlier", teaching: "Any movement of the tip can change what it sits against. Aspirate again after every repositioning, immediately before the injection.", drill: "no-aspirate" },
      { id: "habit", text: "It isn't part of my routine yet", teaching: "Make it a fixed sequence: seat, look at the pressure, aspirate, inject. The sequence protects you when you are busy.", drill: "no-aspirate" },
    ],
  },
  {
    id: "foreshortened-view",
    title: "View foreshortens the target",
    severity: "technique",
    phase: "views",
    lab: "any",
    when: (c) => c.beam === 2 && c.targetForeshortening !== undefined && c.targetForeshortening < MENTOR_PARAMS.foreshortenedTrigger,
    persistS: 0.5,
    anchor: "c-arm",
    cooldownS: 20,
    mistake: "poor-view",
    lines: {
      1: (c) => `What does this view show you of the ${c.targetSegment ? "target segment" : "lesion"}?`,
      2: () => "How long does that segment look compared with the last view?",
      3: () => "It's foreshortened here. You'll under-call it and misjudge its length.",
      4: () => "Change the angle until the segment opens out: more cranial or caudal, then fine-tune the obliquity.",
    },
    frames: [
      { id: "standard", text: "It's the standard view for this vessel", teaching: "Standard views are where you start. Each patient's heart sits differently; adjust the angle until the segment of interest is long and free of overlap.", drill: "poor-view" },
      { id: "dose", text: "I was trying to save dose and contrast", teaching: "A run that does not show the segment wastes both. One well-chosen view saves the repeat.", drill: "poor-view" },
    ],
  },
];

/** The time-out the attending calls when a learner is stuck. */
export const TIMEOUT_RULE: MentorRule = {
  id: "time-out",
  title: "Stuck: time-out",
  severity: "technique",
  phase: "engage",
  lab: "any",
  // no progress for a while, or repeated re-approaches (MENTOR_PARAMS, model parameters)
  when: (c) => c.noProgressS > MENTOR_PARAMS.timeoutNoProgressS || c.reapproaches > MENTOR_PARAMS.timeoutReapproaches,
  persistS: 0,
  anchor: "plan",
  cooldownS: 45,
  lines: {
    1: () => "Pause. Talk me through your plan.",
    3: (c) => (c.reapproaches > MENTOR_PARAMS.timeoutReapproaches ? "You've come back to the same spot several times. Is this the right catheter for this root?" : "Step back. Which part is not working: the height, the direction, or the catheter?"),
    4: () => "Withdraw to the sinus, look at the root in LAO, and decide on one change before you go again.",
  },
  frames: [
    { id: "more-torque", text: "I need a bit more torque", teaching: "If small turns at the right height have not worked after a few tries, the problem is usually the height or the catheter, not the amount of torque.", drill: "over-rotation" },
    { id: "change-cath", text: "I think I need a different catheter", teaching: "Changing is right when the curve cannot reach or cannot sit coaxially. Decide from the root size and the take-off, and change once with a reason, not after every failed attempt.", drill: "catheter-changed-late" },
    { id: "not-sure", text: "I'm not sure where the ostium is", teaching: "A small non-selective puff in the sinus, in a left anterior oblique view, shows the ostium and its direction. Then approach it deliberately.", drill: "non-selective-injection" },
  ],
};

