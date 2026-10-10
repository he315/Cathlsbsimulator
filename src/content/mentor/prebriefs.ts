// ---------------------------------------------------------------------------
// Case pre-briefs: how the attending presents the case at the table, and 2-4
// questions the learner answers before scrubbing. Keyed by caseGenerator
// preset, by library template, and by PCI scenario. Options in a question are
// kept similar in length and form so the right one cannot be picked by length
// (the mentoring audit measured that giveaway in the quiz bank).
//
// The teaching restates the app's own catheter and view content
// (data/catheters.ts, data/viewPresets.ts, simulation/angioPci.ts); it adds no
// numeric clinical thresholds.
// ---------------------------------------------------------------------------

import type { AnatomyCase } from "../../types";
import type { PciScenario } from "../../simulation/angioPci";
import { shuffleOptions, type ForecastComplication, type OperatorState, type PciPlanFacts, type PciPlanStepId, type Prebrief, type PrebriefQuestion, type ProcedurePlan, type SupportPlan } from "../../mentor/prebrief";

const q = (id: string, prompt: string, options: [string, string][], correct: string[], teaching: string): PrebriefQuestion => ({
  id,
  prompt,
  options: options.map(([oid, text]) => ({ id: oid, text })),
  correct,
  teaching,
});

// --- shared questions --------------------------------------------------------------

const Q_PRESSURE_FIRST = q(
  "pressure-first",
  "You have just seated the catheter. What do you check first?",
  [
    ["a", "The pressure trace, then aspirate"],
    ["b", "The image, then inject straight away"],
    ["c", "The heart rate, then the ECG leads"],
    ["d", "The contrast left in the syringe"],
  ],
  ["a"],
  "Seat, look at the pressure, aspirate, inject. The image tells you where the tip is; the trace tells you whether it is safe to inject."
);

const Q_DAMPED_RESPONSE = q(
  "damped-response",
  "After seating, the diastolic pressure falls and the notch disappears. What now?",
  [
    ["a", "Withdraw slightly until the trace recovers"],
    ["b", "Inject a small test puff to see the vessel"],
    ["c", "Advance a little to seat more securely"],
    ["d", "Flush with saline and then inject anyway"],
  ],
  ["a"],
  "A damped or ventricularised trace means the tip is obstructing the ostium or sitting too deep. Withdraw a little until the aortic trace returns before any injection."
);

const Q_LV_RECOVERY = q(
  "lv-recovery",
  "The trace suddenly shows a diastolic near zero. What is the right move?",
  [
    ["a", "Withdraw to the root and rebuild the approach"],
    ["b", "Push on, the tip will find the ostium from below"],
    ["c", "Inject to confirm where the catheter tip is"],
    ["d", "Torque quickly to bring the tip back round"],
  ],
  ["a"],
  "A diastolic near zero is a ventricular trace: the tip has crossed the valve. Withdraw to the root; never push or inject from there."
);

// --- diagnostic presets -------------------------------------------------------------

const RCA_TORQUE = q(
  "rca-torque",
  "The JR4 tip points at the right cusp. Which movement brings it into the RCA ostium?",
  [
    ["a", "Gentle clockwise torque with slow withdrawal"],
    ["b", "Gentle anticlockwise torque while advancing it"],
    ["c", "Firm forward push until the tip drops in"],
    ["d", "A quick half turn and then hold it still"],
  ],
  ["a"],
  "Point the tip anteriorly at the right cusp, then clockwise torque with slight withdrawal drops it into the ostium. Forward pressure takes it towards the ventricle."
);

const RCA_VIEWS = q(
  "rca-views",
  "Which pair of views lays out the RCA for a diagnostic study?",
  [
    ["a", "LAO for the 'C', and RAO for the 'L'"],
    ["b", "RAO caudal and LAO caudal (spider)"],
    ["c", "AP cranial and the straight lateral"],
    ["d", "RAO cranial and AP caudal together"],
  ],
  ["a"],
  "The RCA forms a 'C' in LAO, the standard working view, and an 'L' in RAO, which elongates the mid vessel. Add cranial angulation to open the crux."
);

const HIGH_RCA = q(
  "high-rca-catheter",
  "The RCA arises high and anteriorly. A JR4 keeps falling below it. What is the next step?",
  [
    ["a", "Change to an Amplatz Right that reaches up"],
    ["b", "Push the JR4 harder against the right cusp"],
    ["c", "Change to a JL4 and torque it to the right"],
    ["d", "Inject in the sinus and accept that picture"],
  ],
  ["a"],
  "When a JR4 cannot find a high anterior RCA, an Amplatz Right reaches up onto the cusp shelf. Pushing a JR4 forward drops it into the ventricle."
);

const HIGH_RCA_TORQUE = q(
  "anterior-torque",
  "The ostium faces anteriorly. How does that change your torque?",
  [
    ["a", "More clockwise torque to face the ostium"],
    ["b", "More anticlockwise torque to face the ostium"],
    ["c", "No torque at all, only push and pull"],
    ["d", "Alternate both ways until it catches"],
  ],
  ["a"],
  "An anterior RCA needs extra clockwise rotation to bring the tip round to face it. Make small turns and let each one reach the tip before the next."
);

const CROOK_SUPPORT = q(
  "crook",
  "A shepherd's crook RCA loops up sharply after the ostium. What do you anticipate?",
  [
    ["a", "A catheter that sits up on the shelf, and support"],
    ["b", "An easy JR4 seat with a standard approach"],
    ["c", "A left coronary catheter turned round to the right"],
    ["d", "No change, it only matters for the stent"],
  ],
  ["a"],
  "A severe superior loop usually needs an Amplatz Right or a supportive shape that reaches up onto the cusp shelf; plan the backup before you start."
);

const LV_TRAP_CATH = q(
  "small-root-catheter",
  "The root is small. Which left catheter do you start with?",
  [
    ["a", "JL3.5"],
    ["b", "JL5"],
    ["c", "AL2"],
    ["d", "JL4.5"],
  ],
  ["a"],
  "In a small root the JL3.5 seats the left main with almost no manipulation. An over-sized curve crams the cusp and prolapses towards the ventricle."
);

const LV_TRAP_PUSH = q(
  "small-root-push",
  "The left catheter will not quite reach the ostium. What do you avoid?",
  [
    ["a", "Pushing forward to make it reach"],
    ["b", "Withdrawing to the sinus to look"],
    ["c", "A small puff in the left sinus"],
    ["d", "Re-forming the curve on the cusp"],
  ],
  ["a"],
  "Repeated forward pushing drives a left Judkins into the ventricle. Height problems are solved by withdrawing and re-forming the curve, or by choosing another size."
);

const NONSEL_CATH = q(
  "dilated-catheter",
  "The root is dilated and a JL4 falls short of the left main. What next?",
  [
    ["a", "Step up to a JL4.5 or JL5"],
    ["b", "Inject the root and accept it"],
    ["c", "Step down to a JL3.5 instead"],
    ["d", "Push the JL4 harder to reach"],
  ],
  ["a"],
  "In a dilated root a small curve falls short and you inject the root. Step up a size to reach the left main."
);

const NONSEL_PUFF = q(
  "root-puff",
  "Your injection fills the sinus but the coronary only faintly. What does that mean?",
  [
    ["a", "The injection was not selective"],
    ["b", "The coronary is totally occluded"],
    ["c", "The patient is left dominant here"],
    ["d", "The contrast was too dilute today"],
  ],
  ["a"],
  "A root puff with faint coronary filling is a non-selective injection. Seat selectively before committing contrast; do not report a faint vessel as disease."
);

const LM_DISEASE = q(
  "lm-approach",
  "Left main disease is suspected. How do you engage?",
  [
    ["a", "Gently, coaxial, never deep, watching the trace"],
    ["b", "Deeply, for a stable seat and good opacification"],
    ["c", "With an Amplatz for the best possible support"],
    ["d", "Without a pressure check, to save time and dose"],
  ],
  ["a"],
  "With left main disease, avoid deep engagement and damping; keep the pressure clean. A damped trace here can mean the catheter is obstructing a diseased left main."
);

const LM_FIRST_VIEW = q(
  "lm-view",
  "Which view shows the left main bifurcation and the ostia of the LAD and circumflex best?",
  [
    ["a", "LAO caudal (spider)"],
    ["b", "RAO cranial"],
    ["c", "RCA LAO view"],
    ["d", "AP cranial (LAD view)"],
  ],
  ["a"],
  "The LAO caudal spider view splays the left main bifurcation and the ostia; it foreshortens the mid vessels, so it is a bifurcation view, not a mid-LAD view."
);

const CATH_SELECTION = q(
  "horizontal-aorta",
  "The ascending aorta is horizontal and a Judkins left will not seat. What reaches the cusp?",
  [
    ["a", "An Amplatz left shape"],
    ["b", "A smaller Judkins left"],
    ["c", "A multipurpose catheter"],
    ["d", "A pigtail in the sinus"],
  ],
  ["a"],
  "In a horizontal aorta a Judkins may not seat; an Amplatz shape reaches the cusp. Remember it seats deep: watch the pressure and disengage by advancing."
);

const AMPLATZ_DISENGAGE = q(
  "amplatz-disengage",
  "How do you take an Amplatz out of the ostium?",
  [
    ["a", "Advance slightly to prolapse the tip up"],
    ["b", "Pull straight back firmly on the hub end"],
    ["c", "Spin it quickly a full turn either way"],
    ["d", "Inject while pulling to flush it free"],
  ],
  ["a"],
  "Disengage an Amplatz by advancing to prolapse the tip up and out, not by withdrawing: pulling back can make it dive deeper."
);

const TORQUE_CONTROL = q(
  "torque-control",
  "The root is rotated and the tip lands off the ostium. How do you correct it?",
  [
    ["a", "Small turns, each allowed to reach the tip"],
    ["b", "One large turn to get there in a single movement"],
    ["c", "Push forward while turning both ways"],
    ["d", "Leave the torque and change the view"],
  ],
  ["a"],
  "Torque takes time to travel to the tip. Small turns, with a pause for each to arrive, avoid wind-up and the whip that swings the tip past the ostium."
);

const RADIAL_TIG = q(
  "tig",
  "Through the radial route you use one universal catheter for both sides. What must you confirm before each injection?",
  [
    ["a", "Which coronary the tip is actually in"],
    ["b", "That the radial pulse is still present"],
    ["c", "That the catheter has been flushed twice"],
    ["d", "That the table is at its lowest height"],
  ],
  ["a"],
  "Because a universal catheter engages both sides, confirm which vessel you are in before injecting. It also responds less intuitively to torque than a Judkins."
);

const RADIAL_WIRE = q(
  "radial-loop",
  "A radial loop is suspected. What do you lead with?",
  [
    ["a", "A soft hydrophilic wire under screening"],
    ["b", "The catheter tip without a wire ahead"],
    ["c", "A stiff wire pushed firmly through it"],
    ["d", "A contrast injection through the sheath only"],
  ],
  ["a", "d"],
  "Map the route if in doubt, then lead with a soft hydrophilic wire under fluoroscopy. Never advance a catheter without a wire ahead through a loop."
);

const VIEW_LAD = q(
  "lad-view",
  "Which view elongates the mid and distal LAD with the diagonals fanning off it?",
  [
    ["a", "RAO cranial"],
    ["b", "RAO caudal"],
    ["c", "LAO caudal"],
    ["d", "RCA LAO"],
  ],
  ["a"],
  "RAO cranial is the workhorse LAD view; LAO cranial separates the LAD from its diagonals. The spider view foreshortens the mid LAD."
);

const VIEW_LCX = q(
  "lcx-view",
  "Which view lays out the circumflex and its obtuse marginals?",
  [
    ["a", "RAO caudal"],
    ["b", "AP cranial"],
    ["c", "LAO cranial"],
    ["d", "Lateral view"],
  ],
  ["a"],
  "RAO caudal opens the circumflex and its obtuse marginals and also shows the proximal LAD and left main."
);

const VIEW_FORESHORTEN = q(
  "foreshortening",
  "A lesion looks short and mild in one view. Why take a second, different view?",
  [
    ["a", "It may be foreshortened or overlapped"],
    ["b", "Two views always need less contrast"],
    ["c", "The first view gives more radiation"],
    ["d", "Lesions change between heartbeats"],
  ],
  ["a"],
  "A segment that runs towards the detector looks short, and overlap hides narrowing. Show every segment in at least two views with different angles."
);

const SEPARATE_OSTIA = q(
  "separate-ostia",
  "There is no left main: the LAD and circumflex arise separately. What do you expect?",
  [
    ["a", "To engage each ostium on its own"],
    ["b", "One injection will fill both vessels"],
    ["c", "The circumflex comes off the RCA"],
    ["d", "A deep seat will show both of them"],
  ],
  ["a"],
  "With separate ostia a selective injection fills only one vessel. Engage each ostium separately and do not mistake the unfilled vessel for an occlusion."
);

const DOMINANCE = q(
  "dominance",
  "How do you decide coronary dominance on the angiogram?",
  [
    ["a", "Which artery gives the posterior descending"],
    ["b", "Which coronary looks the larger of the two"],
    ["c", "Which ostium was easier to engage selectively"],
    ["d", "Which side has the longer marginal branches"],
  ],
  ["a"],
  "Dominance is defined by which artery gives the posterior descending artery. Image the crux fully in the dominant system."
);

const RAMUS = q(
  "ramus",
  "A branch arises between the LAD and circumflex at the left main. What is it?",
  [
    ["a", "A ramus intermedius"],
    ["b", "A high first diagonal"],
    ["c", "The conus branch here"],
    ["d", "A septal perforator"],
  ],
  ["a"],
  "A trifurcating left main gives a ramus intermedius between the LAD and circumflex. Do not mistake it for a high diagonal; the spider view shows the origin."
);

const DAMPING_OSTIAL = q(
  "ostial-rca",
  "Ostial RCA disease is likely. What do you expect on seating?",
  [
    ["a", "Damping or ventricularisation"],
    ["b", "A higher systolic pressure"],
    ["c", "A perfectly normal trace"],
    ["d", "A ventricular trace straight away"],
  ],
  ["a"],
  "An ostial lesion damps the trace as soon as the catheter seats. Engage gently and non-deeply, read the pressure before injecting, and keep injections brief."
);

export const PRESET_PREBRIEFS: Record<string, PrebriefQuestion[]> = {
  rca: [RCA_TORQUE, RCA_VIEWS, Q_LV_RECOVERY],
  "high-rca": [HIGH_RCA, HIGH_RCA_TORQUE, Q_LV_RECOVERY],
  "shepherds-crook": [CROOK_SUPPORT, HIGH_RCA, Q_DAMPED_RESPONSE],
  "lv-trap": [LV_TRAP_CATH, LV_TRAP_PUSH, Q_LV_RECOVERY],
  "nonselective-trap": [NONSEL_CATH, NONSEL_PUFF, Q_PRESSURE_FIRST],
  "left-main": [LM_DISEASE, LM_FIRST_VIEW, Q_DAMPED_RESPONSE],
  damping: [DAMPING_OSTIAL, Q_DAMPED_RESPONSE, Q_PRESSURE_FIRST],
  "catheter-selection": [CATH_SELECTION, AMPLATZ_DISENGAGE, HIGH_RCA],
  torque: [TORQUE_CONTROL, HIGH_RCA_TORQUE, RCA_TORQUE],
  radial: [RADIAL_WIRE, RADIAL_TIG, Q_PRESSURE_FIRST],
  dilated: [NONSEL_CATH, NONSEL_PUFF, LV_TRAP_PUSH],
  views: [VIEW_LAD, VIEW_LCX, VIEW_FORESHORTEN, RCA_VIEWS],
  left: [LM_FIRST_VIEW, VIEW_LAD, Q_PRESSURE_FIRST],
};

/** Library templates (caseGenerator TEMPLATES keys) to their question sets. */
export const TEMPLATE_PREBRIEFS: Record<string, PrebriefQuestion[]> = {
  "easy-left": [Q_PRESSURE_FIRST, LM_FIRST_VIEW],
  "easy-rca": [RCA_TORQUE, RCA_VIEWS],
  "complete-normal": [Q_PRESSURE_FIRST, VIEW_LAD, RCA_VIEWS],
  "small-root": [LV_TRAP_CATH, LV_TRAP_PUSH],
  "large-root": [NONSEL_CATH, NONSEL_PUFF],
  "rca-difficult": [HIGH_RCA_TORQUE, Q_LV_RECOVERY],
  "high-rca": [HIGH_RCA, HIGH_RCA_TORQUE, Q_LV_RECOVERY],
  "dilated-root-both": [NONSEL_CATH, RCA_VIEWS, Q_PRESSURE_FIRST],
  "horizontal-aorta": [CATH_SELECTION, AMPLATZ_DISENGAGE],
  "tortuous-radial": [RADIAL_WIRE, RADIAL_TIG],
  "femoral-easy": [Q_PRESSURE_FIRST, VIEW_LAD, RCA_VIEWS],
  "radial-tig": [RADIAL_TIG, Q_PRESSURE_FIRST],
  "lm-deep": [LV_TRAP_CATH, Q_DAMPED_RESPONSE],
  "rca-damping": [DAMPING_OSTIAL, Q_DAMPED_RESPONSE],
  "nonselective-trap": [NONSEL_PUFF, NONSEL_CATH],
  "lv-entry-trap": [LV_TRAP_PUSH, Q_LV_RECOVERY],
  "short-lm": [LM_FIRST_VIEW, Q_DAMPED_RESPONSE],
  "separate-ostia": [SEPARATE_OSTIA, LM_FIRST_VIEW],
  "left-dominant": [DOMINANCE, VIEW_LCX],
  "right-dominant": [DOMINANCE, RCA_VIEWS],
  ramus: [RAMUS, LM_FIRST_VIEW],
  "prox-lad": [VIEW_LAD, VIEW_FORESHORTEN],
  "lcx-lesion": [VIEW_LCX, VIEW_FORESHORTEN],
  "rca-lesion": [RCA_VIEWS, VIEW_FORESHORTEN],
  "left-main-lesion": [LM_DISEASE, LM_FIRST_VIEW, Q_DAMPED_RESPONSE],
};

// --- PCI scenarios -------------------------------------------------------------------

export const PCI_PREBRIEFS: Record<string, PrebriefQuestion[]> = {
  "lad-focal": [
    q(
      "lad-wire",
      "Your wire keeps going down a straight branch towards the septum. What is it?",
      [
        ["a", "A septal perforator"],
        ["b", "The distal LAD itself"],
        ["c", "The first diagonal one"],
        ["d", "The ramus intermedius"],
      ],
      ["a"],
      "Septals run downward into the septum and stop short of the apex. Pull back and turn the tip towards the epicardial side to stay in the LAD."
    ),
    q(
      "lad-size",
      "How do you choose the stent diameter for this lesion?",
      [
        ["a", "From the distal reference diameter"],
        ["b", "From the narrowest point of the lesion"],
        ["c", "From the size of the guide catheter"],
        ["d", "From the proximal left main diameter"],
      ],
      ["a"],
      "Size the stent to the distal reference and cover the lesion with a couple of millimetres of normal vessel at each end."
    ),
    q(
      "lad-post",
      "Where do you post-dilate with the non-compliant balloon?",
      [
        ["a", "Inside the stent, not beyond its edges"],
        ["b", "Across both stent edges for good measure"],
        ["c", "Only in the distal vessel past the stent"],
        ["d", "In the left main before the stent itself"],
      ],
      ["a"],
      "Post-dilate inside the stent. A high-pressure balloon beyond the edge in normal vessel causes edge dissection."
    ),
  ],
  "rca-calcified": [
    q(
      "calc-prep",
      "A balloon will not fully expand in the lesion at high pressure. What does it predict?",
      [
        ["a", "An under-expanded stent if you stent now"],
        ["b", "A good result once the stent is deployed"],
        ["c", "That a longer stent will solve the issue"],
        ["d", "That the wire is in a false lumen there"],
      ],
      ["a"],
      "A balloon that will not expand predicts an under-expanded stent. Prepare calcium first: scoring balloons or lithotripsy modify it; high pressure alone risks dissection or rupture."
    ),
    q(
      "calc-contrast",
      "The patient has chronic kidney disease. How does that change your plan?",
      [
        ["a", "Agree a low contrast budget and keep runs short"],
        ["b", "Use extra contrast to be certain of every single result"],
        ["c", "It changes nothing about the plan for today"],
        ["d", "Skip all checking runs to save the contrast"],
      ],
      ["a"],
      "Keep contrast to a minimum in kidney disease: agree a budget at the time-out, make each run count, and still check position before deployment."
    ),
    q(
      "calc-strategy",
      "What is the strategy for this lesion?",
      [
        ["a", "Prepare the calcium, then stent"],
        ["b", "Direct stenting at high pressure"],
        ["c", "Balloon only, no stent this time"],
        ["d", "Thrombus aspiration, then stent"],
      ],
      ["a"],
      "Severe calcium is modified before stenting so the stent can expand fully."
    ),
  ],
  "lcx-stemi": [
    q(
      "stemi-wire",
      "The circumflex leaves the left main at an angle. How do you steer into it?",
      [
        ["a", "Point the tip towards it, away from the LAD"],
        ["b", "Advance straight and let the wire choose"],
        ["c", "Point the tip towards the LAD and push on"],
        ["d", "Use the stiffest wire available to force the angle"],
      ],
      ["a"],
      "The circumflex leaves the left main at an angle: point the tip towards it, away from the LAD, and advance gently."
    ),
    q(
      "stemi-thrombus",
      "A heavy thrombus burden is seen. What is the main risk of aggressive balloon dilatation?",
      [
        ["a", "Distal embolisation and slow flow"],
        ["b", "Immediate stent thrombosis on table"],
        ["c", "Perforation of the left main stem"],
        ["d", "Prolapse of the guide into the LV"],
      ],
      ["a"],
      "A heavy thrombus burden risks distal embolisation and slow flow after aggressive dilatation. Restore flow first, then size the stent once vasodilators have opened the distal vessel."
    ),
  ],
  "lcx-om-tortuous": [
    q(
      "om-first",
      "The marginal leaves the circumflex at an acute angle just before the lesion. Which do you wire first?",
      [
        ["a", "The marginal, in a caudal view, turning at its origin"],
        ["b", "The circumflex, then try the marginal afterwards"],
        ["c", "Neither: stent the circumflex across the branch"],
        ["d", "Both together, with two wires advanced at the same moment"],
      ],
      ["a"],
      "Wire the marginal first in a caudal view, turning the tip towards it only at its origin; then wire the circumflex."
    ),
    q(
      "om-pseudo",
      "After a support wire, new narrowings appear at the bends. What do you do before any stent?",
      [
        ["a", "Give nitrate, then withdraw the wire partly, keeping its soft part across"],
        ["b", "Stent the new narrowings, since they appeared on the latest angiographic run"],
        ["c", "Inflate a balloon at each bend to straighten it"],
        ["d", "Exchange for a stiffer wire to hold the vessel"],
      ],
      ["a"],
      "A support wire straightens the bends into pseudolesions: give intracoronary nitrate, then withdraw the wire partly, keeping its soft segment across the lesion, before any stent."
    ),
  ],
  "wiring-ladder": [
    q(
      "ladder-view",
      "How do you approach each branch point on the way to the lesion?",
      [
        ["a", "Choose a view that opens it first, then steer at it"],
        ["b", "Steer in the view you have and correct afterwards"],
        ["c", "Push quickly past it so that the wire tip does not catch on it"],
        ["d", "Inject a long run at every branch you meet"],
      ],
      ["a"],
      "Choose a view that opens the next branch point before you steer at it; store a reference frame."
    ),
    q(
      "ladder-park",
      "Where does the wire tip sit while devices move?",
      [
        ["a", "In a safe distal segment, kept in view"],
        ["b", "As far distal as it will go, out of view"],
        ["c", "In the nearest side branch, for anchoring"],
        ["d", "Just beyond the lesion, so it is easy to see"],
      ],
      ["a"],
      "Park the tip in a safe distal segment and keep it in view while devices move."
    ),
  ],
  "rca-cto": [
    q(
      "cto-dual",
      "Why inject both coronaries together?",
      [
        ["a", "To see the cap, the length and the landing zone"],
        ["b", "To save contrast compared with single runs"],
        ["c", "To check the guide is not damping the RCA"],
        ["d", "To make the collaterals grow during the procedure"],
      ],
      ["a"],
      "The right shows the proximal cap; the left fills the distal RCA through collaterals and shows the landing zone and the occlusion length."
    ),
    q(
      "cto-wire",
      "Your workhorse wire buckles at the cap. What next?",
      [
        ["a", "Escalate to a stiff tapered wire, then exchange back"],
        ["b", "Push the workhorse harder until it goes through"],
        ["c", "Inflate a small balloon proximal to the cap to open it"],
        ["d", "Stop the case, the occlusion cannot be crossed"],
      ],
      ["a"],
      "Escalate to a stiff, tapered CTO wire to penetrate the cap, then exchange back to a workhorse wire once across: a stiff wire is dangerous in a normal vessel."
    ),
    q(
      "cto-true-lumen",
      "When may you inflate the first balloon?",
      [
        ["a", "After confirming true-lumen wire position"],
        ["b", "As soon as the wire tip is past the cap"],
        ["c", "Before crossing, to soften the occlusion"],
        ["d", "Once the guide is seated deep for support"],
      ],
      ["a"],
      "Confirm the wire is in the true lumen distally, with a contralateral injection, before any balloon."
    ),
  ],
};

// --- resolver --------------------------------------------------------------------------

/** Template key of a library case id ("high-rca-2" → "high-rca"). */
export function templateKeyOf(id: string): string | null {
  const m = /^(.*)-(\d+)$/.exec(id);
  return m && TEMPLATE_PREBRIEFS[m[1]] ? m[1] : null;
}

/** Preset key of a generated case id ("gen|rca|seed" → "rca"). */
export function presetKeyOf(id: string): string | null {
  if (!id.startsWith("gen|")) return null;
  return id.split("|")[1] ?? null;
}

function presentationFor(c: AnatomyCase): string {
  const access = c.accessRoute === "femoral" ? "femoral" : c.accessRoute === "radial-right" ? "right radial" : "left radial";
  const focus = c.requiredViews.some((v) => v.startsWith("rca")) && c.requiredViews.some((v) => !v.startsWith("rca")) ? "both coronaries" : c.requiredViews.some((v) => v.startsWith("rca")) ? "the right coronary" : "the left coronary";
  return `${c.name}. Diagnostic angiography of ${focus} by ${access} access. ${c.objectives[0] ?? ""}`.trim();
}

/** Questions for a case from its features when no preset or template matches. */
function featureQuestions(c: AnatomyCase): PrebriefQuestion[] {
  const out: PrebriefQuestion[] = [];
  if (c.rootSize === "small") out.push(LV_TRAP_CATH);
  else if (c.rootSize === "dilated") out.push(NONSEL_CATH);
  if (c.variants.includes("high-rca") || c.variants.includes("superior-rca")) out.push(HIGH_RCA);
  if (c.variants.includes("anterior-rca") || c.variants.includes("rotated-root")) out.push(HIGH_RCA_TORQUE);
  if (c.variants.includes("shepherds-crook-rca")) out.push(CROOK_SUPPORT);
  if (c.variants.includes("horizontal-aorta")) out.push(CATH_SELECTION);
  if (c.variants.includes("separate-ostia")) out.push(SEPARATE_OSTIA);
  if (c.variants.includes("ramus")) out.push(RAMUS);
  if (c.variants.includes("radial-loop") || c.variants.includes("tortuous-subclavian")) out.push(RADIAL_WIRE);
  if (c.pathology === "left-main") out.push(LM_DISEASE);
  if (c.pathology === "ostial-rca") out.push(DAMPING_OSTIAL);
  if (c.lesions.length) out.push(VIEW_FORESHORTEN);
  if (c.dominance !== "right") out.push(DOMINANCE);
  out.push(Q_PRESSURE_FIRST);
  return out;
}

function dedupe(qs: PrebriefQuestion[]): PrebriefQuestion[] {
  const seen = new Set<string>();
  return qs.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
}

/** The pre-brief for a diagnostic case: 2-4 questions. */
export function prebriefForCase(c: AnatomyCase): Prebrief {
  const preset = presetKeyOf(c.id);
  const tpl = templateKeyOf(c.id);
  const base = (preset && PRESET_PREBRIEFS[preset]) || (tpl && TEMPLATE_PREBRIEFS[tpl]) || [];
  const qs = dedupe([...base, ...featureQuestions(c)]).slice(0, 4);
  const plan: Partial<ProcedurePlan> = { access: c.accessRoute, catheters: { backup: [] }, plannedViews: [], contrastBudgetMl: 0, anticipated: [] };
  const chosen = qs.length >= 2 ? qs : dedupe([...qs, Q_PRESSURE_FIRST, Q_LV_RECOVERY]).slice(0, 4);
  return { key: preset ?? tpl ?? c.id, title: c.name, presentation: presentationFor(c), questions: chosen.map((x) => shuffleOptions(x, c.id)), planDefaults: plan };
}

/** The pre-brief for a PCI scenario. */
export function prebriefForScenario(s: PciScenario): Prebrief {
  const qs = PCI_PREBRIEFS[s.id] ?? [Q_PRESSURE_FIRST, VIEW_FORESHORTEN];
  return {
    key: s.id,
    title: s.title,
    presentation: s.brief,
    questions: qs.slice(0, 4).map((x) => shuffleOptions(x, s.id)),
    planDefaults: { access: "radial-right", catheters: { backup: [] }, plannedViews: [], contrastBudgetMl: 0, anticipated: [], guide: s.guide },
  };
}

/** Every question in this file (for content checks). */
export function allPrebriefQuestions(): PrebriefQuestion[] {
  return dedupe([...Object.values(PRESET_PREBRIEFS).flat(), ...Object.values(TEMPLATE_PREBRIEFS).flat(), ...Object.values(PCI_PREBRIEFS).flat()]);
}

// --- the PCI plan form (pci-attending) -------------------------------------------------------------------
//
// One field per step of Brilakis's fourteen-step plan (pm-planning-steps, pci-manual/01-planning.ts:57-73;
// step 1, planning, is the form itself), each linking to the lesson that teaches it, then the
// complication forecast (cm-principles-closure-forecast, complication-management/01-principles-closure.ts:84
// and 160-169), the bail-out kit (tip pci-planning-bailout-kit), the operator's state (tip
// pci-safe-state-check) and, in a CTO, the stopping rules (tip pci-safe-cto-stop-rules). Options carry no
// numbers of their own; the contrast ceiling is the learner's figure, checked against contrastBudget.ts.

export interface PlanOption {
  id: string;
  text: string;
}

export interface PciPlanField {
  id: PciPlanStepId;
  /** Brilakis's step number (2 to 14) */
  step: number;
  label: string;
  prompt: string;
  lessonId: string;
  options: PlanOption[];
}

const o = (pairs: [string, string][]): PlanOption[] => pairs.map(([id, text]) => ({ id, text }));

export const PCI_PLAN_FIELDS: PciPlanField[] = [
  { id: "monitoring", step: 2, label: "Monitoring", prompt: "Baseline before the case", lessonId: "pm-monitoring-watch", options: o([["baseline", "ECG, heart rate, pressure and saturation recorded as the baseline"], ["during", "Pressure only now; the rest once the case is under way"]]) },
  { id: "drugs", step: 3, label: "Medications", prompt: "Drugs given and to give", lessonId: "pm-antithrombotics-oral", options: o([["loaded", "Aspirin and a P2Y12 inhibitor given; heparin in the lab"], ["aspirin-only", "Aspirin given; P2Y12 inhibitor and heparin in the lab"], ["unchecked", "Not checked yet"]]) },
  { id: "access", step: 4, label: "Access and sheath", prompt: "Site and sheath", lessonId: "pm-access-site-choice", options: o([["radial-right", "Right radial"], ["radial-left", "Left radial"], ["femoral-right", "Right femoral"]]) },
  { id: "guide", step: 5, label: "Guide", prompt: "Guide shape for the engagement", lessonId: "pm-wiring-guide-choice", options: o([["brief", "The shape in the case brief"], ["extra-support", "An extra-support shape"], ["judkins", "A standard Judkins shape"]]) },
  { id: "angiography", step: 6, label: "Angiography and contrast", prompt: "Working views and the contrast ceiling", lessonId: "pm-acquiring-views", options: o([["working-views", "Working views that open the lesion, each run counted against the ceiling"], ["standard-set", "The standard set of views, then decide"]]) },
  { id: "target", step: 7, label: "Target lesion", prompt: "ACC/AHA class of the target", lessonId: "pm-planning-classification", options: o([["A", "Type A"], ["B1", "Type B1"], ["B2", "Type B2"], ["C", "Type C"]]) },
  { id: "wire", step: 8, label: "Wire", prompt: "First wire", lessonId: "pm-wiring-wire-choice", options: o([["workhorse", "A workhorse wire"], ["polymer", "A polymer-jacketed wire"], ["cto", "A CTO wire with a microcatheter, escalating"]]) },
  { id: "preparation", step: 9, label: "Lesion preparation", prompt: "Expected lesion preparation", lessonId: "pm-prep-and-stent-prep-why", options: o([["predilate", "Predilate with a balloon"], ["modify", "Plaque modification: a scoring balloon or lithotripsy"], ["atherectomy", "Atherectomy"], ["aspirate", "Restore flow first; aspirate visible thrombus selectively"], ["direct", "Direct stenting"]]) },
  { id: "stent", step: 10, label: "Stent", prompt: "Stent strategy", lessonId: "pm-prep-and-stent-when", options: o([["single", "One stent sized to the distal reference"], ["provisional", "Provisional stenting of the main vessel"], ["two-stent", "A planned two-stent technique: T-stenting, TAP, crush or culotte"], ["v-or-sks", "V-stenting or simultaneous kissing stents"], ["balloon-only", "Balloon only"]]) },
  { id: "closure", step: 11, label: "Access closure", prompt: "Closure", lessonId: "pm-closure-plan", options: o([["radial-band", "A radial compression band"], ["femoral-device", "A femoral closure device"], ["manual", "Manual compression"]]) },
  { id: "physiology", step: 12, label: "Physiology", prompt: "Physiology", lessonId: "pm-physiology-when", options: o([["not-needed", "Not needed: ischaemia already shown"], ["planned", "A pressure wire before deciding"]]) },
  { id: "imaging", step: 13, label: "Intravascular imaging", prompt: "Imaging", lessonId: "pm-imaging-when-which", options: o([["none", "Not planned"], ["ivus", "IVUS"], ["oct", "OCT"]]) },
  { id: "support", step: 14, label: "Haemodynamic support", prompt: "Support plan", lessonId: "pm-support-choice-when", options: o([["prophylactic", "A prophylactic device"], ["standby", "A device on standby, access ready (for example a 4 Fr femoral sheath)"], ["none", "No device"]]) },
];

/** The lesson of the plan form's forecast, bail-out and operator sections. */
export const PCI_PLAN_LESSONS = { plan: "pm-planning-steps", forecast: "cm-principles-closure-forecast", bailout: "pm-planning-bailout", state: "hb-safe-practice-wellbeing", stopRules: "hb-safe-practice-mindset", timeOut: "pm-monitoring-checklist", signOut: "pm-monitoring-checklist", pmi: "cm-principles-closure-pmi", candour: "hb-safe-practice-medicolegal", logbook: "hb-the-operator-pathway" } as const;

/** The complications of Brilakis's location tree, as the forecast names them. */
export const FORECAST_LABELS: Record<ForecastComplication, string> = {
  dissection: "Coronary dissection",
  "aorto-coronary-dissection": "Aorto-coronary dissection",
  thrombosis: "Thrombosis",
  embolisation: "Embolisation (thrombus, plaque, air) and no-reflow",
  "side-branch-occlusion": "Side-branch occlusion",
  spasm: "Spasm",
  pseudolesion: "Pseudolesion",
  entrapment: "Equipment entrapment",
  "intramural-haematoma": "Intramural haematoma",
  perforation: "Perforation",
};

/**
 * First moves the forecast offers, each from the module text: a dissection needs a stent (tips
 * pci-dissection-deliver-stent, pci-closure-name-cause); embolised debris needs aspiration and a
 * vasodilator (pci-noreflow-dissection-or-embolism, pci-embol-thrombus-three-steps); thrombosis, the ACT and
 * antithrombotic therapy (pci-embol-thrombus-three-steps); a perforation, a balloon at the hole
 * (pci-perf-balloon-now); spasm, intracoronary nitrate (pci-wire-spasm-nitrate); a pseudolesion, a partial
 * wire withdrawal (lcx-om-tortuous teaching points); an aorto-coronary dissection, stop injecting and seal
 * the ostium (01-principles-closure.ts:854-856); side-branch occlusion, rewire and balloon
 * (01-principles-closure.ts:473); entrapment, do not force it (pci-stentloss-prepare-first).
 */
export const FIRST_MOVES: PlanOption[] = o([
  ["stent", "Keep the wire across and deliver a stent"],
  ["aspirate-vasodilator", "Keep the wire, aspirate visible thrombus and give an intracoronary vasodilator"],
  ["act-antithrombotic", "Check the ACT and give anticoagulation with an intravenous antiplatelet"],
  ["balloon-at-hole", "Inflate a balloon at or just proximal to the hole, keeping the wire"],
  ["nitrate", "Intracoronary nitrate, then image to tell spasm from a fixed lesion"],
  ["partial-withdraw", "Give nitrate and withdraw the stiff wire partly, its soft part across"],
  ["stop-seal-ostium", "Stop injecting that artery and seal the ostium with a stent"],
  ["rewire-branch", "Rewire the branch and reopen it with a balloon"],
  ["do-not-force", "Do not force it: withdraw through a coaxial guide and prepare further"],
]);

/** The first move the module text gives for each complication (the forecast's teaching answer). */
export const FIRST_MOVE_FOR: Record<ForecastComplication, string> = {
  dissection: "stent",
  "aorto-coronary-dissection": "stop-seal-ostium",
  thrombosis: "act-antithrombotic",
  embolisation: "aspirate-vasodilator",
  "side-branch-occlusion": "rewire-branch",
  spasm: "nitrate",
  pseudolesion: "partial-withdraw",
  entrapment: "do-not-force",
  "intramural-haematoma": "stent",
  perforation: "balloon-at-hole",
};

/** The bail-out kit confirmed in the room (tip pci-planning-bailout-kit: a stocked complex PCI cart with covered stents and coils). */
export const BAILOUT_KIT: PlanOption[] = o([
  ["covered-stent", "A covered stent that fits the guide"],
  ["coils", "Coils for a distal perforation"],
  ["pericardiocentesis", "A pericardiocentesis set"],
  ["aspiration", "An aspiration catheter"],
  ["guide-extension", "A guide extension"],
  ["snare", "A snare"],
]);

export const SUPPORT_LABELS: Record<SupportPlan, string> = { prophylactic: "A prophylactic device", standby: "A device on standby, access ready", none: "No device" };

export const OPERATOR_STATES: { id: OperatorState; text: string }[] = [
  { id: "rested", text: "Rested" },
  { id: "tired", text: "Tired" },
  { id: "post-call", text: "Post-call: operated through the night" },
];

/** The scenario's features for the forecast and the support plan (src/mentor/prebrief.ts PciPlanFacts). */
export function pciPlanFacts(
  s: Pick<PciScenario, "calcium" | "thrombus" | "target"> & { lipid?: boolean; lesions?: { sites?: readonly string[]; sideBranch?: unknown; previousStent?: unknown }[]; targetIdx?: number },
  def?: { anatomy?: { tortuosity?: number }; events?: readonly string[] }
): PciPlanFacts {
  const l = s.lesions?.[s.targetIdx ?? 0];
  const events = def?.events ?? [];
  return {
    calcium: s.calcium,
    thrombus: s.thrombus || s.target.kind === "thrombotic",
    cto: s.target.kind === "cto",
    bifurcation: !!l?.sideBranch || !!l?.sites?.includes("bifurcation"),
    tortuosity: def?.anatomy?.tortuosity ?? 0,
    leftMain: s.target.vessel === "LM",
    abnormalHaemodynamics: events.includes("cardiogenic-shock") || events.includes("shock"),
    priorStent: !!l?.previousStent || !!l?.sites?.includes("in-stent"),
    lipid: !!s.lipid,
  };
}

/** The defaults the PCI plan form opens with (never an answer to a question: no forecast, no ceiling). */
export function pciPlanDefaults(s: Pick<PciScenario, "guide">): { guide: string; guideFrench: number } {
  return { guide: s.guide, guideFrench: 6 };
}

// --- the time-out and the sign-out (pci-attending) ----------------------------------------------------------

/** What the inspection of a wire finds (the sign-out's wire-integrity check). */
export const WIRE_FINDINGS = {
  intact: "Intact: coil and tip present, no kinks or unravelling",
  damaged: "The tip coil is missing from the end of the wire",
} as const;

/** What the operator does with a wire that is not intact (Oxford: record anything left in place, act on it before the patient leaves). */
export const DAMAGED_WIRE_ACTIONS: PlanOption[] = o([
  ["record-image", "Record it, image the vessel for the retained coil and plan its retrieval before the patient leaves"],
  ["discard", "Discard the wire and finish the sign-out"],
  ["note-later", "Note it in the report tomorrow"],
]);

/** Antiplatelet regimens (Oxford sign-out: the regimen, its duration and whether a loading dose was given in the lab or is due on the ward). */
export const ANTIPLATELET_REGIMENS: PlanOption[] = o([
  ["aspirin-clopidogrel", "Aspirin and clopidogrel"],
  ["aspirin-ticagrelor", "Aspirin and ticagrelor"],
  ["aspirin-prasugrel", "Aspirin and prasugrel"],
  ["single", "A single antiplatelet"],
]);

export const LOADING_STATUS: { id: "given-in-lab" | "due-on-ward" | "already-loaded"; text: string }[] = [
  { id: "already-loaded", text: "Loaded before the case" },
  { id: "given-in-lab", text: "Loading dose given in the lab" },
  { id: "due-on-ward", text: "Loading dose due on the ward" },
];

/** A complication's final state, as the learner records it (tip pci-pmi-document). */
export const COMPLICATION_OUTCOMES: PlanOption[] = o([
  ["resolved", "Treated and resolved, normal flow"],
  ["residual", "Treated with a residual finding"],
  ["untreated", "Not treated"],
]);

/** Disclosure (tip pci-post-complication-candour; hb-safe-practice-medicolegal). */
export const DISCLOSURE_OPTIONS: { id: "now-awake" | "after-mm" | "partial"; text: string }[] = [
  { id: "now-awake", text: "Tell the patient once safe and awake: what happened, what it means and what will be done, with an apology" },
  { id: "after-mm", text: "Wait until the case has been discussed at the M&M meeting" },
  { id: "partial", text: "Say the procedure was a little more difficult than expected" },
];

/** The logbook's role field (tip pci-operator-log-the-case). */
export const LOGBOOK_ROLES: { id: "first-operator" | "second-operator" | "observed"; text: string }[] = [
  { id: "first-operator", text: "First operator" },
  { id: "second-operator", text: "Second operator" },
  { id: "observed", text: "Observed" },
];
