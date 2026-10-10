import type { CatheterType } from "../types";
import { deg2rad } from "../utils/math";

// Azimuth convention (root frame, looking down the aortic axis):
//   angle = atan2(z, x);  +x = patient left, +z = anterior.
//   LM ostium sits left-posterior  → azimuth ≈ -30°
//   RCA ostium sits right-anterior → azimuth ≈ 150°
const LM_AZ = deg2rad(-30);
const RCA_AZ = deg2rad(150);
const NEUTRAL_AZ = deg2rad(60); // ambiguous — universal catheters

// Reach is the effective lateral distance the preshaped tip lands from the
// aortic axis. Good engagement needs reach ≈ sinus radius of the root
// (small ≈ 14, normal ≈ 18, dilated ≈ 24). Too small → tip short of the
// ostium (non-selective). Too large → tip crams the cusp / prolapses to LV.

export const CATHETERS: CatheterType[] = [
  {
    id: "JL3.5",
    name: "Judkins Left 3.5",
    seatCue: "Small root / radial: it finds the left main with almost no manipulation — let it seat, do not push.",
    category: "diagnostic",
    target: "left",
    curveSize: "3.5 cm",
    support: "low",
    aggressiveness: "gentle",
    bestUse: "Left coronary in a small or normal aortic root, shorter distance to the LM.",
    usualTarget: "Left main / LAD / LCx",
    bestAnatomy: "Small root, radial or short ascending aorta.",
    badAnatomy: "Dilated root — the tip falls short of the left main and injects non-selectively.",
    commonMistakes: [
      "Repeatedly pushing forward when the tip won't reach — this drives the catheter into the LV.",
      "Using JL3.5 in a dilated root and calling the faint filling 'the vessel'.",
    ],
    teachingTips: [
      "In a small root the JL3.5 seats the left main with almost no manipulation — let it find the cusp.",
      "If it points at the left cusp but sits medial to the ostium, the curve is too small: step up to JL4.",
    ],
    behaviour: {
      reach: 14,
      naturalAzimuth: LM_AZ,
      seatHeight: 15,
      torqueResponse: 0.6,
      pushResponse: 0.5,
      prolapseTendency: 0.25,
      deepEngagementRisk: 0.2,
      shapedFor: "left",
      idealRootSize: "small",
    },
  },
  {
    id: "JL4",
    name: "Judkins Left 4",
    seatCue: "Advance to form the loop on the opposite (right) cusp, then withdraw gently to drop the tip into the left main.",
    category: "diagnostic",
    target: "left",
    curveSize: "4.0 cm",
    support: "low",
    aggressiveness: "gentle",
    bestUse: "The standard diagnostic left coronary catheter for an average aortic root.",
    usualTarget: "Left main / LAD / LCx",
    bestAnatomy: "Normal aortic root, femoral or radial.",
    badAnatomy: "Small root (seats deep, poor alignment) or dilated root (falls short).",
    commonMistakes: [
      "Using JL4 in a small root where JL3.5 is safer and seats more coaxially.",
      "Advancing to 'reach' the ostium instead of gently withdrawing to seat.",
    ],
    teachingTips: [
      "This is your default left catheter. Learn its behaviour in a normal root before anything else.",
      "Seat it by gentle withdrawal at the sinus level, not by pushing it down.",
    ],
    behaviour: {
      reach: 18,
      naturalAzimuth: LM_AZ,
      seatHeight: 15,
      torqueResponse: 0.6,
      pushResponse: 0.5,
      prolapseTendency: 0.3,
      deepEngagementRisk: 0.25,
      shapedFor: "left",
      idealRootSize: "normal",
    },
  },
  {
    id: "JL4.5",
    name: "Judkins Left 4.5",
    category: "diagnostic",
    target: "left",
    curveSize: "4.5 cm",
    support: "low",
    aggressiveness: "moderate",
    bestUse: "Left coronary in a larger-than-average root.",
    usualTarget: "Left main / LAD / LCx",
    bestAnatomy: "Enlarged root between normal and dilated.",
    badAnatomy: "Small/normal root — sits too high and non-coaxial.",
    commonMistakes: ["Reaching for JL4.5 before trying a well-seated JL4."],
    teachingTips: ["A half-step up when JL4 falls just short of the left main."],
    behaviour: {
      reach: 21,
      naturalAzimuth: LM_AZ,
      seatHeight: 16,
      torqueResponse: 0.55,
      pushResponse: 0.5,
      prolapseTendency: 0.3,
      deepEngagementRisk: 0.25,
      shapedFor: "left",
      idealRootSize: "dilated",
    },
  },
  {
    id: "JL5",
    name: "Judkins Left 5",
    category: "diagnostic",
    target: "left",
    curveSize: "5.0 cm",
    support: "low",
    aggressiveness: "moderate",
    bestUse: "Left coronary in a dilated aortic root.",
    usualTarget: "Left main / LAD / LCx",
    bestAnatomy: "Dilated root, aneurysmal ascending aorta.",
    badAnatomy: "Normal/small root — aggressive, sits high and unstable.",
    commonMistakes: ["Using JL5 in a normal root, producing an unstable high tip."],
    teachingTips: ["Reserve for the genuinely dilated root where JL4/4.5 fall short."],
    behaviour: {
      reach: 24,
      naturalAzimuth: LM_AZ,
      seatHeight: 17,
      torqueResponse: 0.5,
      pushResponse: 0.5,
      prolapseTendency: 0.35,
      deepEngagementRisk: 0.3,
      shapedFor: "left",
      idealRootSize: "dilated",
    },
  },
  {
    id: "JR4",
    name: "Judkins Right 4",
    seatCue: "Point at the right cusp, then gentle CLOCKWISE torque with slow withdrawal to drop into the RCA ostium.",
    category: "diagnostic",
    target: "right",
    curveSize: "4.0 cm",
    support: "low",
    aggressiveness: "gentle",
    bestUse: "The standard diagnostic catheter for the right coronary artery.",
    usualTarget: "RCA",
    bestAnatomy: "Normal RCA take-off from the right cusp.",
    badAnatomy: "High/anterior or shepherd's-crook take-off.",
    commonMistakes: [
      "Trying to engage the RCA with forward pressure instead of rotation and gentle withdrawal.",
      "Torquing while the tip is below the cusp — it whips into the LV.",
    ],
    teachingTips: [
      "Point the tip anteriorly at the right cusp, then clockwise torque with slight withdrawal to drop into the ostium.",
      "If it enters the LV, you are too low — withdraw to the cusp before trying again.",
    ],
    behaviour: {
      reach: 18,
      naturalAzimuth: RCA_AZ,
      seatHeight: 12,
      torqueResponse: 0.65,
      pushResponse: 0.55,
      prolapseTendency: 0.35,
      deepEngagementRisk: 0.3,
      shapedFor: "right",
      idealRootSize: "normal",
    },
  },
  {
    id: "JR3.5",
    name: "Judkins Right 3.5",
    category: "diagnostic",
    target: "right",
    curveSize: "3.5 cm",
    support: "low",
    aggressiveness: "gentle",
    bestUse: "RCA in a smaller root or radial access.",
    usualTarget: "RCA",
    bestAnatomy: "Small root, radial approach.",
    badAnatomy: "Dilated root — falls short of the RCA ostium.",
    commonMistakes: ["Persisting with JR3.5 when the tip cannot reach a laterally displaced ostium."],
    teachingTips: ["A gentler right catheter for the small root or radial route."],
    behaviour: {
      reach: 15,
      naturalAzimuth: RCA_AZ,
      seatHeight: 12,
      torqueResponse: 0.65,
      pushResponse: 0.55,
      prolapseTendency: 0.3,
      deepEngagementRisk: 0.28,
      shapedFor: "right",
      idealRootSize: "small",
    },
  },
  {
    id: "TIG",
    name: "Universal radial curve",
    seatCue: "Radial universal: anticlockwise in the left cusp for the LCA; clockwise + gentle pull for the RCA. Pre-empt the RCA dive with early withdrawal.",
    category: "universal",
    target: "both",
    curveSize: "universal",
    support: "low",
    aggressiveness: "moderate",
    bestUse: "Radial diagnostic angiography of both coronaries with one catheter.",
    usualTarget: "Both left and right coronary",
    bestAnatomy: "Radial access, normal root.",
    badAnatomy: "Dilated or rotated root where the ambiguous shape won't seat.",
    commonMistakes: [
      "Over-torquing — the tip response is less intuitive than a Judkins.",
      "Accepting a non-selective root puff instead of seating selectively.",
    ],
    teachingTips: [
      "Torque toward the left cusp first; a small clockwise turn and pull often flips it to the RCA.",
      "Because it engages both sides, confirm which vessel you are in before injecting.",
    ],
    behaviour: {
      reach: 17,
      naturalAzimuth: NEUTRAL_AZ,
      seatHeight: 13,
      torqueResponse: 0.4,
      pushResponse: 0.55,
      prolapseTendency: 0.35,
      deepEngagementRisk: 0.3,
      shapedFor: "both",
      idealRootSize: "normal",
    },
  },
  {
    id: "AL1",
    name: "Amplatz Left 1",
    seatCue: "Amplatz seats deep and hard — advance to prolapse the tip up to disengage (never yank back). Watch the pressure for damping.",
    category: "diagnostic",
    target: "left",
    curveSize: "AL1",
    support: "moderate",
    aggressiveness: "aggressive",
    bestUse: "Difficult left coronary engagement; also useful for anomalous or high take-offs.",
    usualTarget: "Left main (and problem RCA)",
    bestAnatomy: "Wide/horizontal root, difficult LM.",
    badAnatomy: "Small root — very easy to deep-seat and damp.",
    commonMistakes: [
      "Forgetting Amplatz shapes deep-seat aggressively — advancing causes deep LM engagement and damping.",
      "Withdrawing to disengage without first pushing the tip out of the ostium (it can dive deeper).",
    ],
    teachingTips: [
      "Powerful but unforgiving. Watch the pressure trace continuously for damping.",
      "Disengage by advancing to prolapse the tip up, not by yanking back.",
    ],
    behaviour: {
      reach: 16,
      naturalAzimuth: LM_AZ,
      seatHeight: 13,
      torqueResponse: 0.55,
      pushResponse: 0.7,
      prolapseTendency: 0.2,
      deepEngagementRisk: 0.65,
      shapedFor: "left",
      idealRootSize: "normal",
    },
  },
  {
    id: "AL2",
    name: "Amplatz Left 2",
    category: "diagnostic",
    target: "left",
    curveSize: "AL2",
    support: "moderate",
    aggressiveness: "aggressive",
    bestUse: "Left coronary in a larger or horizontal root when AL1 falls short.",
    usualTarget: "Left main",
    bestAnatomy: "Dilated/horizontal root.",
    badAnatomy: "Small/normal root — deep-seats readily.",
    commonMistakes: ["Using AL2 where AL1 or a Judkins would be safer."],
    teachingTips: ["More reach than AL1 with the same deep-seating caution."],
    behaviour: {
      reach: 20,
      naturalAzimuth: LM_AZ,
      seatHeight: 14,
      torqueResponse: 0.5,
      pushResponse: 0.7,
      prolapseTendency: 0.2,
      deepEngagementRisk: 0.7,
      shapedFor: "left",
      idealRootSize: "dilated",
    },
  },
  {
    id: "AR",
    name: "Amplatz Right (mod.)",
    seatCue: "For a high / shepherds-crook RCA: reach up onto the cusp shelf and torque to face the anterior ostium.",
    category: "diagnostic",
    target: "right",
    curveSize: "AR mod",
    support: "moderate",
    aggressiveness: "aggressive",
    bestUse: "Difficult RCA — high, anterior or shepherd's-crook take-off.",
    usualTarget: "RCA",
    bestAnatomy: "High/anterior RCA, shepherd's crook.",
    badAnatomy: "Simple RCA where JR4 is gentler.",
    commonMistakes: ["Aggressive seating causing RCA damping / ventricularisation."],
    teachingTips: [
      "When JR4 can't find a high anterior RCA, the Amplatz Right reaches up onto the cusp shelf.",
    ],
    behaviour: {
      reach: 18,
      naturalAzimuth: RCA_AZ,
      seatHeight: 15,
      torqueResponse: 0.55,
      pushResponse: 0.65,
      prolapseTendency: 0.25,
      deepEngagementRisk: 0.6,
      shapedFor: "right",
      idealRootSize: "normal",
    },
  },
  {
    id: "MP",
    name: "Multipurpose",
    category: "diagnostic",
    target: "right",
    curveSize: "MPA",
    support: "moderate",
    aggressiveness: "moderate",
    bestUse: "Inferior/horizontal RCA take-off, some bypass grafts, straight-down engagement.",
    usualTarget: "RCA (downgoing), grafts",
    bestAnatomy: "Downward-pointing RCA ostium.",
    badAnatomy: "Superiorly directed take-offs.",
    commonMistakes: ["Advancing the straight tip into the LV when the ostium is high."],
    teachingTips: ["Engages by advancing gently when the ostium points downward."],
    behaviour: {
      reach: 17,
      naturalAzimuth: RCA_AZ,
      seatHeight: 10,
      torqueResponse: 0.5,
      pushResponse: 0.6,
      prolapseTendency: 0.4,
      deepEngagementRisk: 0.4,
      shapedFor: "right",
      idealRootSize: "normal",
    },
  },
  // Bypass graft catheters (diag-grafts-svg). The module text names them for vein grafts the Judkins right cannot
  // reach: a multipurpose for a right graft that angles steeply downwards, an Amplatz left 1 or a left coronary bypass
  // shape for a left graft (complex-pci/05-prior-cabg.ts, tip diag-svg-jr4-after-rca: Brilakis 18.5 and 30.2, Oxford
  // ch 7), and the right coronary bypass shape among the graft catheters (lab request cp-prior-cabg#0). Their
  // behaviour values, like every catalogue entry's, are model parameters for the analytic engagement model.
  {
    id: "LCB",
    name: "Left coronary bypass",
    seatCue: "Pull back above the left coronary ostium and sweep the anterior wall up and down, turning gently clockwise after each pass.",
    category: "diagnostic",
    target: "left",
    curveSize: "LCB",
    support: "moderate",
    aggressiveness: "moderate",
    bestUse: "Left-sided vein grafts (LAD, diagonal and circumflex grafts) on the anterior ascending aorta that a Judkins right cannot reach.",
    usualTarget: "Left-sided vein grafts",
    bestAnatomy: "Left grafts arising high on the anterior aorta, pointing upwards or to the left.",
    badAnatomy: "Native coronaries: the curve is shaped for the anterior aortic wall, not the sinuses.",
    commonMistakes: ["Searching for left grafts at the level of the right graft, below the left coronary ostium.", "Injecting before checking the pressure at the graft ostium."],
    teachingTips: ["Circumflex grafts are usually the highest: look above the LAD graft.", "In RAO the tip should point away from the spine, towards the anterior wall."],
    behaviour: {
      reach: 17,
      naturalAzimuth: deg2rad(60),
      seatHeight: 36,
      torqueResponse: 0.5,
      pushResponse: 0.55,
      prolapseTendency: 0.2,
      deepEngagementRisk: 0.35,
      shapedFor: "left",
      idealRootSize: "normal",
    },
  },
  {
    id: "RCB",
    name: "Right coronary bypass",
    seatCue: "From the native RCA level, withdraw slightly in LAO and turn gently clockwise just above it; let the hooked tip drop into a downgoing graft.",
    category: "diagnostic",
    target: "right",
    curveSize: "RCB",
    support: "moderate",
    aggressiveness: "moderate",
    bestUse: "Right-sided vein grafts that arise just above and in front of the native RCA, especially those that angle downwards.",
    usualTarget: "Right-sided vein grafts",
    bestAnatomy: "A right graft whose ostium points downwards.",
    badAnatomy: "Grafts that leave the aorta upwards: the hooked tip points away from them.",
    commonMistakes: ["Advancing the hooked tip deep into the graft; vein grafts are large and engage easily."],
    teachingTips: ["Try the Judkins right first; change to this or a multipurpose when the graft angles steeply down."],
    behaviour: {
      reach: 17,
      naturalAzimuth: deg2rad(120),
      seatHeight: 30,
      torqueResponse: 0.5,
      pushResponse: 0.6,
      prolapseTendency: 0.3,
      deepEngagementRisk: 0.35,
      shapedFor: "right",
      idealRootSize: "normal",
    },
  },
  {
    id: "EBU3.0",
    name: "Extra-backup 3.0 (guide)",
    category: "guide",
    target: "left",
    curveSize: "3.0",
    support: "high",
    aggressiveness: "aggressive",
    bestUse: "Left coronary PCI support in a small/normal root.",
    usualTarget: "Left main (guide)",
    bestAnatomy: "Small–normal root for PCI backup.",
    badAnatomy: "Dilated root (poor backup); diagnostic-only cases (over-kill).",
    commonMistakes: ["Deep guide engagement and damping while chasing support."],
    teachingTips: [
      "Extra-backup shapes rest on the opposite wall for support and engage deeper — watch pressure.",
    ],
    behaviour: {
      reach: 16.5,
      naturalAzimuth: LM_AZ,
      seatHeight: 14,
      torqueResponse: 0.5,
      pushResponse: 0.65,
      prolapseTendency: 0.2,
      deepEngagementRisk: 0.6,
      shapedFor: "left",
      idealRootSize: "small",
    },
  },
  {
    id: "EBU3.5",
    name: "Extra-backup 3.5 (guide)",
    category: "guide",
    target: "left",
    curveSize: "3.5",
    support: "high",
    aggressiveness: "aggressive",
    bestUse: "Left coronary PCI support in a normal root.",
    usualTarget: "Left main (guide)",
    bestAnatomy: "Normal root PCI.",
    badAnatomy: "Diagnostic study where a Judkins is gentler.",
    commonMistakes: ["Deep seating; damping the LM while seeking backup."],
    teachingTips: ["The workhorse left guide — supportive and prone to deep engagement."],
    behaviour: {
      reach: 18.5,
      naturalAzimuth: LM_AZ,
      seatHeight: 14,
      torqueResponse: 0.5,
      pushResponse: 0.65,
      prolapseTendency: 0.2,
      deepEngagementRisk: 0.65,
      shapedFor: "left",
      idealRootSize: "normal",
    },
  },
  {
    id: "EBU4.0",
    name: "Extra-backup 4.0 (guide)",
    category: "guide",
    target: "left",
    curveSize: "4.0",
    support: "high",
    aggressiveness: "aggressive",
    bestUse: "Left coronary PCI support in a larger root.",
    usualTarget: "Left main (guide)",
    bestAnatomy: "Larger root PCI.",
    badAnatomy: "Small root — very deep, unstable seating.",
    commonMistakes: ["Using 4.0 in a small root, causing deep engagement and damping."],
    teachingTips: ["Sized like the ascending aorta width; too big and it dives into the LM."],
    behaviour: {
      reach: 20.5,
      naturalAzimuth: LM_AZ,
      seatHeight: 15,
      torqueResponse: 0.5,
      pushResponse: 0.65,
      prolapseTendency: 0.2,
      deepEngagementRisk: 0.65,
      shapedFor: "left",
      idealRootSize: "dilated",
    },
  },
  {
    id: "IKL",
    name: "Ikari Left",
    category: "universal",
    target: "left",
    curveSize: "IL",
    support: "high",
    aggressiveness: "moderate",
    bestUse: "Radial left coronary with extra backup; can behave as diagnostic or guide.",
    usualTarget: "Left main",
    bestAnatomy: "Radial access, normal root.",
    badAnatomy: "Dilated root.",
    commonMistakes: ["Treating it exactly like a JL — the seating manoeuvre differs on radial."],
    teachingTips: ["A radial-friendly left shape offering more support than a JL4."],
    behaviour: {
      reach: 17.5,
      naturalAzimuth: LM_AZ,
      seatHeight: 14,
      torqueResponse: 0.5,
      pushResponse: 0.6,
      prolapseTendency: 0.25,
      deepEngagementRisk: 0.45,
      shapedFor: "left",
      idealRootSize: "normal",
    },
  },
  {
    id: "IKR",
    name: "Ikari Right",
    category: "universal",
    target: "right",
    curveSize: "IR",
    support: "moderate",
    aggressiveness: "moderate",
    bestUse: "Radial RCA engagement with backup.",
    usualTarget: "RCA",
    bestAnatomy: "Radial access, normal RCA.",
    badAnatomy: "Very high anterior take-off.",
    commonMistakes: ["Pushing rather than torquing to seat."],
    teachingTips: ["A radial right shape — torque and gentle withdrawal, as with a JR."],
    behaviour: {
      reach: 17,
      naturalAzimuth: RCA_AZ,
      seatHeight: 12,
      torqueResponse: 0.6,
      pushResponse: 0.55,
      prolapseTendency: 0.3,
      deepEngagementRisk: 0.4,
      shapedFor: "right",
      idealRootSize: "normal",
    },
  },
  {
    id: "PIG",
    name: "Pigtail",
    category: "pigtail",
    target: "lv",
    curveSize: "pigtail",
    support: "low",
    aggressiveness: "gentle",
    bestUse: "Aortic root angiography and LV pressure/ventriculography — NOT selective coronary work.",
    usualTarget: "Aortic root / left ventricle",
    bestAnatomy: "Any — for root shots and pressures.",
    badAnatomy: "You cannot selectively engage a coronary with a pigtail.",
    commonMistakes: ["Trying to engage a coronary ostium selectively with a pigtail."],
    teachingTips: [
      "Use the pigtail to learn root anatomy and pressure — its looped tip cannot cannulate an ostium.",
      "Cross the valve carefully; the loop resists dropping into the LV unless you push it.",
    ],
    behaviour: {
      reach: 6,
      naturalAzimuth: NEUTRAL_AZ,
      seatHeight: 4,
      torqueResponse: 0.2,
      pushResponse: 0.5,
      prolapseTendency: 0.15,
      deepEngagementRisk: 0.05,
      shapedFor: "root",
      idealRootSize: "normal",
    },
  },
];

// ---------------------------------------------------------------------------
// The engagement technique set (diag-engagement-technique-set)
//
// The shapes the engagement lessons name beyond the original catalogue, each
// placed after its family in the list. What the module text says of each:
// - JL6: Oxford, a longer arm (JL5 or JL6) can help in a dilated root or a very
//   tall patient; Brilakis sizes the JL from the dilated ascending aorta
//   (diameter in cm plus 1) (pm-to-the-root-choice, 06-to-the-root.ts:325, :340,
//   :350; tip diag-root-match-curve-to-route).
// - JR4.5 and JR5: step 3 of Brilakis's failed-engagement ladder changes curve
//   size, and the ladder's worked example names a JR5 (pm-engaging-fail,
//   07-engaging.ts:799, :843).
// - AL3: in a very dilated root a 4 Fr diagnostic catheter can be telescoped
//   through a 6 Fr AL3 guide (Brilakis, 07-engaging.ts:836).
// - AR1 and AR2: a dilating root rotates anticlockwise and brings the RCA
//   forward, where AR1 or AR2 (or AL1 or AL2) engage it (Brilakis,
//   07-engaging.ts:674, :714); Oxford ranks AR1 or AR2 above the JR4 for RCA
//   PCI support (Table 8.4, 07-engaging.ts:722).
// - Hockey stick: Brilakis lists it for a shepherd's crook RCA from the femoral
//   route, and Oxford ranks it among the most supportive RCA guides
//   (07-engaging.ts:677, :715, :722).
// - Williams right (3DRC): preshaped to reach the RCA with little or no
//   manipulation, one of Oxford's two alternatives to the JR4 and listed for a
//   shepherd's crook (07-engaging.ts:673, :715; 06-to-the-root.ts:357).
// Every behaviour value (reach, azimuth, seat height, responses, risks) is a
// MODEL PARAMETER of the analytic engagement model, as for every catalogue
// entry (docs/realism/facts/pkg-diag-engagement-technique-set.md); the module
// text names the shapes and their uses, not their geometry.
// ---------------------------------------------------------------------------

const ENGAGEMENT_SET: { after: string; cath: CatheterType }[] = [
  {
    after: "JL5",
    cath: {
      id: "JL6",
      name: "Judkins Left 6",
      seatCue: "A long arm for a large root: form the curve in the root, then withdraw gently to drop the tip into the left main.",
      category: "diagnostic",
      target: "left",
      curveSize: "6.0 cm",
      support: "low",
      aggressiveness: "moderate",
      bestUse: "Left coronary in a dilated root or a very tall patient, when a JL5 falls short (Oxford); sized from the dilated ascending aorta (Brilakis).",
      usualTarget: "Left main / LAD / LCx",
      bestAnatomy: "Dilated or aneurysmal ascending aorta; very tall patient.",
      badAnatomy: "Normal or small root: the long arm sits high and unstable and crams the cusp.",
      commonMistakes: ["Reaching for the longest curve before a sinus injection has shown where the ostium is."],
      teachingTips: ["Size the curve to the root: the ascending aorta's diameter in centimetres plus one gives the Judkins left size (Brilakis)."],
      behaviour: { reach: 27, naturalAzimuth: LM_AZ, seatHeight: 18, torqueResponse: 0.5, pushResponse: 0.5, prolapseTendency: 0.38, deepEngagementRisk: 0.3, shapedFor: "left", idealRootSize: "dilated" },
    },
  },
  {
    after: "JR3.5",
    cath: {
      id: "JR4.5",
      name: "Judkins Right 4.5",
      category: "diagnostic",
      target: "right",
      curveSize: "4.5 cm",
      support: "low",
      aggressiveness: "gentle",
      bestUse: "RCA in a larger root where the JR4 falls short of the ostium (a curve size change, step 3 of the failed-engagement ladder).",
      usualTarget: "RCA",
      bestAnatomy: "Enlarged root with a normally placed RCA ostium.",
      badAnatomy: "Small or normal root: the larger curve crams the right cusp.",
      commonMistakes: ["Changing size before a sinus injection has shown where the ostium is."],
      teachingTips: ["Change size when the tip clearly falls short of a located ostium, not as the first answer to a failed sweep."],
      behaviour: { reach: 20, naturalAzimuth: RCA_AZ, seatHeight: 12.5, torqueResponse: 0.62, pushResponse: 0.55, prolapseTendency: 0.35, deepEngagementRisk: 0.3, shapedFor: "right", idealRootSize: "dilated" },
    },
  },
  {
    after: "JR4.5",
    cath: {
      id: "JR5",
      name: "Judkins Right 5",
      category: "diagnostic",
      target: "right",
      curveSize: "5.0 cm",
      support: "low",
      aggressiveness: "moderate",
      bestUse: "RCA in a dilated root when a JR4 or JR4.5 cannot reach a located ostium.",
      usualTarget: "RCA",
      bestAnatomy: "Dilated root.",
      badAnatomy: "Normal or small root.",
      commonMistakes: ["Cycling through larger curves without locating the ostium first."],
      teachingTips: ["After the curve size, the shape: if the tip is at the ostium but will not enter, try another shape (step 4)."],
      behaviour: { reach: 22, naturalAzimuth: RCA_AZ, seatHeight: 13, torqueResponse: 0.6, pushResponse: 0.55, prolapseTendency: 0.38, deepEngagementRisk: 0.32, shapedFor: "right", idealRootSize: "dilated" },
    },
  },
  {
    after: "AL2",
    cath: {
      id: "AL3",
      name: "Amplatz Left 3 (guide)",
      seatCue: "Seat the broad curve in the left sinus; a 4 Fr diagnostic catheter can be telescoped through it towards a left main out of reach.",
      category: "guide",
      target: "left",
      curveSize: "AL3",
      support: "high",
      aggressiveness: "aggressive",
      bestUse: "A very dilated root with a hard-to-reach left main: a 4 Fr diagnostic catheter telescoped through a 6 Fr AL3 guide (Brilakis).",
      usualTarget: "Left main (guide)",
      bestAnatomy: "Very dilated root.",
      badAnatomy: "Normal or small root: far too large, deep-seats and damps.",
      commonMistakes: ["Advancing an Amplatz to disengage it the wrong way: pushing disengages it and pulling seats it deeper."],
      teachingTips: ["Keep the pressure in view: Amplatz shapes deep-seat and damp."],
      behaviour: { reach: 26, naturalAzimuth: LM_AZ, seatHeight: 15, torqueResponse: 0.45, pushResponse: 0.7, prolapseTendency: 0.2, deepEngagementRisk: 0.72, shapedFor: "left", idealRootSize: "dilated" },
    },
  },
  {
    after: "AR",
    cath: {
      id: "AR1",
      name: "Amplatz Right 1",
      seatCue: "For an RCA carried forward by a dilated root: face the anterior wall of the right sinus and let the hook find the ostium.",
      category: "diagnostic",
      target: "right",
      curveSize: "AR1",
      support: "moderate",
      aggressiveness: "aggressive",
      bestUse: "An RCA brought anteriorly by a dilating root (Brilakis); more supportive than a JR4 for RCA PCI (Oxford Table 8.4).",
      usualTarget: "RCA",
      bestAnatomy: "Dilated root with an anterior RCA.",
      badAnatomy: "Normal RCA take-off, where a JR4 is gentler.",
      commonMistakes: ["Seating it deep: Amplatz shapes damp the RCA readily."],
      teachingTips: ["Locate the ostium with a sinus injection first, then choose AR or AL from what it shows."],
      behaviour: { reach: 22, naturalAzimuth: RCA_AZ, seatHeight: 14, torqueResponse: 0.55, pushResponse: 0.65, prolapseTendency: 0.25, deepEngagementRisk: 0.6, shapedFor: "right", idealRootSize: "dilated" },
    },
  },
  {
    after: "AR1",
    cath: {
      id: "AR2",
      name: "Amplatz Right 2",
      category: "diagnostic",
      target: "right",
      curveSize: "AR2",
      support: "moderate",
      aggressiveness: "aggressive",
      bestUse: "The larger Amplatz right for an anterior RCA in a more dilated root (Brilakis).",
      usualTarget: "RCA",
      bestAnatomy: "Markedly dilated root with an anterior RCA.",
      badAnatomy: "Normal or small root.",
      commonMistakes: ["Deep seating and damping while chasing support."],
      teachingTips: ["One size up from the AR1 when it falls short of a located anterior ostium."],
      behaviour: { reach: 25, naturalAzimuth: RCA_AZ, seatHeight: 14.5, torqueResponse: 0.5, pushResponse: 0.65, prolapseTendency: 0.25, deepEngagementRisk: 0.62, shapedFor: "right", idealRootSize: "dilated" },
    },
  },
  {
    after: "AR2",
    cath: {
      id: "HS",
      name: "Hockey stick",
      seatCue: "For a steep upward take-off: bring the long straight tip up to the ostium from below rather than turning a Judkins right into it.",
      category: "diagnostic",
      target: "right",
      curveSize: "HS",
      support: "high",
      aggressiveness: "aggressive",
      bestUse: "A shepherd's crook RCA from the femoral route (Brilakis); among the most supportive RCA guides (Oxford Table 8.4).",
      usualTarget: "RCA (shepherd's crook)",
      bestAnatomy: "Steep vertical (shepherd's crook) RCA take-off.",
      badAnatomy: "A normal RCA take-off, where a JR4 is gentler.",
      commonMistakes: ["Choosing it before a sinus injection has shown the take-off."],
      teachingTips: ["The take-off decides the shape: image the sinus first, then choose AR MOD, Williams, internal mammary or hockey stick."],
      behaviour: { reach: 18, naturalAzimuth: RCA_AZ, seatHeight: 17, torqueResponse: 0.55, pushResponse: 0.6, prolapseTendency: 0.25, deepEngagementRisk: 0.55, shapedFor: "right", idealRootSize: "normal" },
    },
  },
  {
    after: "HS",
    cath: {
      id: "3DRC",
      name: "Williams right (3DRC)",
      seatCue: "Preshaped for the RCA: it often engages with little or no turning; a small clockwise turn, as for a JR4, if it does not.",
      category: "diagnostic",
      target: "right",
      curveSize: "3DRC",
      support: "moderate",
      aggressiveness: "moderate",
      bestUse: "One of Oxford's two alternatives to the JR4, and one of its shapes for a shepherd's crook; Brilakis uses it for aorto-ostial RCA lesions.",
      usualTarget: "RCA",
      bestAnatomy: "Femoral route; shepherd's crook take-off; aorto-ostial RCA lesion.",
      badAnatomy: "A very anterior RCA in a dilated root, where an Amplatz reaches better.",
      commonMistakes: ["Over-rotating a shape built to need little rotation."],
      teachingTips: ["Let the preformed curve do the work; a small clockwise turn is often all it needs."],
      behaviour: { reach: 18, naturalAzimuth: RCA_AZ, seatHeight: 14, torqueResponse: 0.6, pushResponse: 0.55, prolapseTendency: 0.28, deepEngagementRisk: 0.35, shapedFor: "right", idealRootSize: "normal" },
    },
  },
];

// each new shape sits after its family (the 'after' entry is placed first, so a chain keeps its order)
for (const { after, cath } of ENGAGEMENT_SET) {
  const i = CATHETERS.findIndex((c) => c.id === after);
  CATHETERS.splice(i >= 0 ? i + 1 : CATHETERS.length, 0, cath);
}

/** The ids of the engagement technique set's catalogue additions (diag-engagement-technique-set), in catalogue order. */
export const ENGAGEMENT_SET_IDS: readonly string[] = ENGAGEMENT_SET.map((e) => e.cath.id);

// ---------------------------------------------------------------------------
// Side holes (diag-pressure-transducer)
//
// A catheter with side holes near its tip keeps sampling aortic pressure while
// the end hole is obstructed, so its trace can look normal over a wedged or
// damped ostium (the patient engine's tip chamber adds the side-hole path,
// src/simulation/patient/transducer.ts MP_G_SIDEHOLES). Sources, from the
// module text: side-hole catheters and the Tiger radial catheter, which Oxford
// describes as having a side hole close to its tip to reduce damping on
// engagement (pm-engaging, src/content/manual/pci-manual/07-engaging.ts, 'Two
// traps', Oxford ch 6); side-hole guides hide ischaemia and let contrast
// escape into the aorta (same module, 'Damping that appears only after
// engagement', Brilakis 5.8 and 15.1.5).
// ---------------------------------------------------------------------------

/**
 * A side-hole variant of a catalogue catheter: the same curve and behaviour with side holes near the
 * tip. The id is the base id with '-SH'.
 */
function sideHoleVariant(base: CatheterType): CatheterType {
  return {
    ...base,
    id: `${base.id}-SH`,
    name: `${base.name}, side holes`,
    bestUse: `${base.bestUse} The side holes keep the pressure trace aortic while the end hole is obstructed, so a normal trace reassures less.`,
    commonMistakes: [...base.commonMistakes, "Trusting a normal trace through side holes over an obstructed ostium: confirm the position on fluoroscopy and keep the test puff gentle."],
    teachingTips: [...base.teachingTips, "Side holes hide damping and let contrast escape into the aorta, so images are fainter and more contrast is used."],
  };
}

// the side-hole variants sit after their base catheter in the catalogue
for (const id of ["JR4"]) {
  const i = CATHETERS.findIndex((c) => c.id === id);
  if (i >= 0) CATHETERS.splice(i + 1, 0, sideHoleVariant(CATHETERS[i]));
}

/** Catheters with side holes near the tip: the '-SH' variants and the Tiger-type universal radial curve (Oxford ch 6, module pm-engaging). */
const SIDE_HOLES = new Set<string>(["TIG", ...CATHETERS.filter((c) => c.id.endsWith("-SH")).map((c) => c.id)]);

/** Whether a catheter has side holes near its tip. */
export const catheterSideHoles = (id: string): boolean => SIDE_HOLES.has(id);

/** The catalogue catheter a side-hole variant is made from ('JR4-SH' → 'JR4'), or null for a catheter that is not a variant. */
export function sideHoleBase(id: string): string | null {
  if (!id.endsWith("-SH")) return null;
  const base = id.slice(0, -3);
  return CATHETERS.some((c) => c.id === base) ? base : null;
}

// ---------------------------------------------------------------------------
// Catheter size (diag-injection-run-quality)
//
// The lumen a hand injection is pushed through depends on the catheter's size
// and on whether it is a guide (src/simulation/injection.ts LUMENS: the 5 Fr and
// 6 Fr diagnostic and the 6 Fr guide inner diameters are manufacturers'
// specifications, docs/realism/facts/I1.md). The catalogue's diagnostic
// catheters are 6 Fr (the lab's earlier choice, facts I1.md) and its guides
// 6 Fr. A 5 Fr version of the two standard Judkins curves makes the smaller
// lumen selectable: small catheters (especially 4 French) are on Brilakis's
// list of causes of incomplete filling, and the remedy is a larger lumen
// (pm-acquiring-cine, src/content/manual/pci-manual/08-acquiring.ts, tip
// diag-acq-streaming-fill; Brilakis 6.6). A 4 Fr catheter is not offered: no
// manufacturer's 4 Fr inner diameter has been opened (the plan's condition for
// adding one). The 5 Fr versions move like their base curve.
// ---------------------------------------------------------------------------

/** The suffix of a catalogue catheter's 5 Fr version ('JL4-5F'). */
export const FIVE_FRENCH_SUFFIX = "-5F";

/**
 * A 5 Fr version of a catalogue diagnostic catheter: the same curve and behaviour through the smaller
 * lumen. The id is the base id with '-5F'.
 */
function fiveFrenchVariant(base: CatheterType): CatheterType {
  return {
    ...base,
    id: `${base.id}${FIVE_FRENCH_SUFFIX}`,
    name: `${base.name}, 5 Fr`,
    bestUse: `${base.bestUse} The 5 Fr version has a smaller lumen, so a hand injection delivers less contrast per second.`,
    commonMistakes: [...base.commonMistakes, "Calling a streaming, underfilled artery diseased when the small lumen could not fill it: change to a larger lumen or call the run non-diagnostic."],
    teachingTips: [...base.teachingTips, "In a large or high-flow artery a small lumen may not fill the vessel however hard you push; a 6 Fr diagnostic catheter or a guide fills it."],
  };
}

// the 5 Fr versions sit after their base catheter (and after its side-hole variant, which stays next to it)
for (const id of ["JL4", "JR4"]) {
  const i = CATHETERS.findIndex((c) => c.id === id);
  if (i < 0) continue;
  const at = CATHETERS[i + 1]?.id === `${id}-SH` ? i + 2 : i + 1;
  CATHETERS.splice(at, 0, fiveFrenchVariant(CATHETERS[i]));
}

/** The catalogue catheter a 5 Fr version is made from ('JL4-5F' → 'JL4'), or null for a catheter that is not one. */
export function fiveFrenchBase(id: string): string | null {
  if (!id.endsWith(FIVE_FRENCH_SUFFIX)) return null;
  const base = id.slice(0, -FIVE_FRENCH_SUFFIX.length);
  return CATHETERS.some((c) => c.id === base) ? base : null;
}

/** The base curve of a variant (a side-hole or a 5 Fr version), or the id itself: what the rod mechanics knows it as. */
export function catheterCurveBase(id: string): string {
  return sideHoleBase(id) ?? fiveFrenchBase(id) ?? id;
}

/** A catalogue catheter's size (French): 5 for a 5 Fr version, 6 for every other diagnostic catheter and for the guides. */
export function catheterFrench(id: string): 5 | 6 {
  return fiveFrenchBase(id) ? 5 : 6;
}

export const catheterById = (id: string): CatheterType | undefined =>
  CATHETERS.find((c) => c.id === id);

export const catheterIndex = (id: string): number =>
  CATHETERS.findIndex((c) => c.id === id);
