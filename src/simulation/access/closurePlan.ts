// ---------------------------------------------------------------------------
// The femoral closure algorithm (access-closure-femoral-manual).
//
// Brilakis Fig 11.1 as lesson pm-closure-plan gives it
// (src/content/manual/pci-manual/13-closure.ts, 'The femoral closure
// algorithm'), four questions asked in order at the end of the case:
//   1. Can the sheath come out now? Keep it if a staged PCI is planned within
//      a few hours or a haemodynamic support device is likely in the next few
//      hours: suture it in, and swap a long sheath for one of 10-13 cm. Blood
//      oozing around the sheath may mean it has to come out at once.
//   2. Can a closure device be used? From the femoral angiogram: a common
//      femoral artery larger than 5 mm, free of significant disease, entered
//      above its bifurcation (not in a branch). Heavy calcification rules out
//      the suture-mediated device in particular. If not, go to question 4.
//   3. Was the stick high (above the inguinal ligament, or above the lowest
//      point of the inferior epigastric artery)? Then no collagen plug; the
//      suture device is preferred.
//   4. No device: is the ACT below 180 s? Then pull and compress by hand;
//      if not, suture the sheath in, wait and recheck.
// Beside it: devices can be deployed at a high ACT, but Brilakis suggests it
// may be best not to above 300 s (scored here as acceptable with a caution,
// not as correct); and a collagen plug in that groin within the last 90 days
// (the plug's 60-90 days to absorb, Brilakis) is a reason to choose another
// site, read on the angiogram as an old plug's filling defect.
//
// Every threshold below is quoted from that lesson. This file is pure: the
// session (caseSession.ts) builds the end-of-case state and the anatomy from
// the site, the arteriotomy and the scenario's closure context.
// ---------------------------------------------------------------------------

/** The algorithm's sourced thresholds (pm-closure-plan; Brilakis 11.1). */
export const CLOSURE_ALGORITHM = {
  /** question 4: 'is the ACT below 180 seconds?' */
  manualActS: 180,
  /** 'it may be best not to deploy one above an ACT of 300 seconds' */
  deviceDiscouragedActS: 300,
  /** question 2: 'a common femoral artery larger than 5 mm' */
  deviceCfaMm: 5,
  /** question 1: 'a long sheath is usually exchanged for a short one of 10-13 cm' */
  shortSheathCm: [10, 13] as [number, number],
  /** 'a collagen-plug device was used in that groin within the last 90 days' */
  recentPlugDays: 90,
} as const;

/** The end-of-case state the first question reads. */
export interface ClosureEndState {
  /** the ACT now (true value, s): what a measurement would show */
  actS: number;
  /** systolic pressure now, mmHg */
  sysMmHg: number;
  /** the sheath in the groin */
  sheathFr: number;
  sheathLengthCm: number;
  /** a staged PCI is planned within a few hours */
  stagedPciSoon: boolean;
  /** a haemodynamic support device is likely to be needed within a few hours */
  supportDeviceLikely: boolean;
  /** blood oozing around the sheath */
  oozeAroundSheath: boolean;
}

/** What the femoral angiogram shows at the entry (the truth the plan is graded against). */
export interface ClosureAnatomy {
  /** entry above the inguinal ligament or above the lowest point of the inferior epigastric artery */
  highStick: boolean;
  /** entry at or below the bifurcation, in the superficial femoral or profunda artery */
  atOrBelowBifurcation: boolean;
  /** entry in a small branch (an accessory profunda) */
  inBranch: boolean;
  /** the common femoral artery at the entry larger than 5 mm */
  over5mm: boolean;
  /** significant atheroma at the puncture */
  atheroma: boolean;
  /** heavy anterior-wall calcification */
  heavyCalcium: boolean;
  /** an old collagen plug's filling defect (a plug within the last 90 days) */
  oldPlug: boolean;
}

/** The angiogram presets of the closure scenarios (scenario settings; see scenarios/closureFemoral.ts). */
export type AngioPreset = "over-head" | "above-iea" | "at-or-below-bifurcation" | "accessory-profunda" | "small-cfa" | "calcified" | "old-plug";

export type ClosureChoice = "keep-suture" | "suture-device" | "collagen-plug" | "manual-compression" | "wait-then-compress";
export const CLOSURE_CHOICES: readonly ClosureChoice[] = ["keep-suture", "suture-device", "collagen-plug", "manual-compression", "wait-then-compress"];

/** Button labels (generic device names). */
export const CLOSURE_CHOICE_LABEL: Readonly<Record<ClosureChoice, string>> = {
  "keep-suture": "Keep the sheath, sutured in (short sheath)",
  "suture-device": "Suture-mediated closure device",
  "collagen-plug": "Collagen-plug closure device",
  "manual-compression": "Pull the sheath and compress by hand now",
  "wait-then-compress": "Suture the sheath in, wait for the ACT to fall, then compress",
};

/** The learner's answers to the four questions; each later answer only where the earlier ones lead to it. */
export interface ClosureAnswers {
  /** 1. the sheath comes out now, or stays */
  sheath: "out" | "stays";
  /** 2. a closure device can be used */
  deviceOk?: boolean;
  /** 3. the stick was high */
  highStick?: boolean;
  /** 4. the ACT is below 180 s */
  actBelow180?: boolean;
}

/** What the algorithm says for this case. */
export interface ClosureVerdict {
  /** the answers the algorithm gives, in order (later ones undefined where the algorithm stops) */
  answers: ClosureAnswers;
  /** the choices it allows now */
  allowed: ClosureChoice[];
  /** the reason in words, for the debrief */
  why: string[];
}

/** The device criteria of question 2 (pure). */
export function deviceEligible(a: ClosureAnatomy): { ok: boolean; why: string[] } {
  const why: string[] = [];
  if (a.atOrBelowBifurcation) why.push("the entry is at or below the bifurcation");
  if (a.inBranch) why.push("the entry is in a small branch");
  if (!a.over5mm) why.push("the common femoral artery is 5 mm or smaller");
  if (a.atheroma) why.push("there is significant atheroma at the puncture");
  return { ok: why.length === 0, why };
}

/** Work through the four questions in order (pure). */
export function closureAlgorithm(st: ClosureEndState, a: ClosureAnatomy): ClosureVerdict {
  const why: string[] = [];
  // 1. the sheath stays for a staged PCI or a support device; ooze takes it out
  const stays = (st.stagedPciSoon || st.supportDeviceLikely) && !st.oozeAroundSheath;
  if (stays) {
    why.push(st.stagedPciSoon ? "A staged PCI is planned within hours: the sheath stays, sutured in." : "A support device is likely within hours: the sheath stays, sutured in.");
    return { answers: { sheath: "stays" }, allowed: ["keep-suture"], why };
  }
  if (st.oozeAroundSheath) why.push("Blood oozes around the sheath: it comes out now.");
  // 2. device eligibility
  const dev = deviceEligible(a);
  const lowAct = st.actS < CLOSURE_ALGORITHM.manualActS;
  if (!dev.ok) {
    why.push(`No device: ${dev.why.join("; ")}.`);
    why.push(lowAct ? `ACT ${Math.round(st.actS)} s, below ${CLOSURE_ALGORITHM.manualActS} s: pull and compress.` : `ACT ${Math.round(st.actS)} s: suture the sheath in, wait for it to fall below ${CLOSURE_ALGORITHM.manualActS} s, then compress.`);
    return { answers: { sheath: "out", deviceOk: false, actBelow180: lowAct }, allowed: [lowAct ? "manual-compression" : "wait-then-compress"], why };
  }
  // 3. the high stick excludes the collagen plug; heavy calcium excludes the suture device
  const allowed: ClosureChoice[] = [];
  if (!a.heavyCalcium) allowed.push("suture-device");
  else why.push("Heavy calcium: no suture-mediated device.");
  if (!a.highStick) allowed.push("collagen-plug");
  else why.push("A high stick: no collagen plug; the suture device is preferred.");
  if (a.oldPlug) why.push("An old plug's filling defect: that segment holds foreign material.");
  // a device is not obligatory: compression after the ACT has fallen stays possible (question 4)
  allowed.push(lowAct ? "manual-compression" : "wait-then-compress");
  return { answers: { sheath: "out", deviceOk: true, highStick: a.highStick }, allowed, why };
}

export interface AnswerGrade {
  items: { key: keyof ClosureAnswers; label: string; expected: string; given: string; correct: boolean }[];
  correct: boolean;
}

const QUESTION_LABEL: Record<keyof ClosureAnswers, string> = {
  sheath: "1. Can the sheath come out now?",
  deviceOk: "2. Can a closure device be used?",
  highStick: "3. Was the stick high?",
  actBelow180: "4. No device: is the ACT below 180 s?",
};
const word = (k: keyof ClosureAnswers, v: unknown) => (v === undefined ? "Not asked" : k === "sheath" ? (v === "out" ? "Comes out" : "Stays") : v ? "Yes" : "No");

/** Grade the learner's answers against the algorithm, question by question in its order (pure). */
export function gradeClosureAnswers(given: ClosureAnswers, verdict: ClosureVerdict): AnswerGrade {
  const keys: (keyof ClosureAnswers)[] = ["sheath", "deviceOk", "highStick", "actBelow180"];
  const items = keys
    .filter((k) => verdict.answers[k] !== undefined)
    .map((k) => ({ key: k, label: QUESTION_LABEL[k], expected: word(k, verdict.answers[k]), given: word(k, given[k]), correct: given[k] === verdict.answers[k] }));
  return { items, correct: items.every((i) => i.correct) };
}

export type ChoiceVerdict = "correct" | "acceptable" | "wrong";

export interface ChoiceGrade {
  verdict: ChoiceVerdict;
  /** the rules the choice broke, or the caution it carries */
  reasons: string[];
  expected: string;
}

/**
 * Grade a closure choice against the algorithm and its rules (pure): no device below the bifurcation, in
 * a branch, under 5 mm or in diseased artery; no collagen plug in a high stick; no suture device in heavy
 * calcium; no hand compression at an ACT of 180 s or more; the sheath kept when a staged PCI or support
 * device is due within hours; a device above an ACT of 300 s is acceptable with a caution.
 */
export function gradeClosureChoice(st: ClosureEndState, a: ClosureAnatomy, choice: ClosureChoice): ChoiceGrade {
  const v = closureAlgorithm(st, a);
  const expected = v.allowed.map((c) => CLOSURE_CHOICE_LABEL[c]).join(", or ");
  const reasons: string[] = [];
  const device = choice === "suture-device" || choice === "collagen-plug";
  const stays = v.answers.sheath === "stays";
  if (stays && choice !== "keep-suture") reasons.push("A staged PCI or support device is due within hours: the sheath stays.");
  if (!stays && choice === "keep-suture") reasons.push(st.oozeAroundSheath ? "Blood oozes around the sheath: it comes out now." : "No staged PCI or support device is due: the sheath need not stay.");
  if (device) {
    const dev = deviceEligible(a);
    if (!dev.ok) reasons.push(`No device: ${dev.why.join("; ")}.`);
    if (choice === "collagen-plug" && a.highStick) reasons.push("No collagen plug in a high stick.");
    if (choice === "suture-device" && a.heavyCalcium) reasons.push("No suture-mediated device in heavy calcium.");
  }
  if (choice === "manual-compression" && st.actS >= CLOSURE_ALGORITHM.manualActS) reasons.push(`No hand compression at an ACT of ${Math.round(st.actS)} s: wait until it is below ${CLOSURE_ALGORITHM.manualActS} s.`);
  if (choice === "wait-then-compress" && st.actS < CLOSURE_ALGORITHM.manualActS && !stays) reasons.push(`The ACT is already below ${CLOSURE_ALGORITHM.manualActS} s: there is nothing to wait for.`);
  if (reasons.length) return { verdict: "wrong", reasons, expected };
  if (device && st.actS > CLOSURE_ALGORITHM.deviceDiscouragedActS) return { verdict: "acceptable", reasons: [`A device at an ACT above ${CLOSURE_ALGORITHM.deviceDiscouragedActS} s is discouraged (Brilakis).`], expected };
  if (device && a.oldPlug) return { verdict: "acceptable", reasons: ["An old plug lies in this segment: consider the other groin or a radial next time."], expected };
  return { verdict: "correct", reasons: [], expected };
}

/** A sheath kept in is swapped for a short one when it is long (question 1): the length to swap to, or null. */
export function keptSheathSwap(lengthCm: number): number | null {
  return lengthCm > CLOSURE_ALGORITHM.shortSheathCm[1] ? CLOSURE_ALGORITHM.shortSheathCm[0] : null;
}
