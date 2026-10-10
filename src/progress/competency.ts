// ---------------------------------------------------------------------------
// Entrustable professional activities (EPAs) and the entrustment rules.
//
// Each EPA is described with the eight sections of ten Cate and Taylor's AMEE
// Guide 140 (doi 10.1080/0142159X.2020.1838465): title; specification and
// limitations; risks in case of failure; most relevant competency domains;
// knowledge, skills, attitudes and experience; information sources to assess
// progress; entrustment level expected at which stage; time to expiration if
// not practised.
//
// Levels 1..5 are the EAPCI 2020 levels of competence I..V (Van Belle et al.,
// EuroIntervention 2021, doi 10.4244/EIJ-D-18-00448). A simulator cannot
// certify clinical competence: the levels here are simulator entrustment,
// earned only in exam mode on held-out cases, and say so wherever shown.
//
// Every label names the simulator, and level IV states that it is entrustment in
// the simulator only: real procedures stay under direct expert supervision, as the
// disclaimer says (src/data/teachingText.ts).
//
// Rules (thresholds are model parameters, facts/I4.md):
//   I    a logged session for the EPA, or 60% of its linked quiz items retained
//   II   3 passed practice sessions on distinct cases
//   III  2 exam passes on distinct held-out cases at rung >= 3, on >= 2 days
//   IV   3 further exam passes at rung >= 5, on >= 2 days, after III
//   V    IV plus the final assessment (MASTER_ASSESSMENT)
// An exam pass from the diagnostic lab (or the full case) counts toward III, IV and
// the final assessment only when the row also meets the mentor's sourced passing
// standards (logbook.ts meetsSourcedStandards); the formative composite score alone
// counts toward I and II only. Diagnostic awards of III and above are re-judged on
// that rule while the logbook still holds the EPA's history, so a stored profile
// recomputed on load never shows a higher level than it did.
// A critical error in an exam resets the count toward the next level; for reading
// exams, which have no critical errors, any failed set resets it. Only the first
// exam attempt on a case counts (a seen case is no longer unseen), a case counts as
// attempted from the moment it is loaded, and leaving an exam before the end is a
// failed attempt.
// Awards are kept; if no session for the EPA is passed within its expiry
// period, the level in force drops by one and a refresher is due until the
// next pass.
// ---------------------------------------------------------------------------

import type { AssessmentMode, EntrustmentLevel as MentorLevel } from "../mentor/types";
import { visibilityFor, type VisibilityPolicy } from "../mentor/visibility";
import { daysBetween } from "../utils/storage";
import { isExamCase, ladderFor, LADDER_PARAMS, modulesForEpa } from "../content/mentor/catalogue";
import { LOGBOOK_MAX, meetsSourcedStandards } from "./logbook";
import type { CompetencyDomain, EntrustLevel, EntrustmentRecord, EpaId, LogbookEntry, MasterAssessmentState } from "./types";

export { roleFor } from "./logbook";

export interface EpaDef {
  id: EpaId;
  domain: CompetencyDomain;
  /** 1. title */
  title: string;
  /** 2. specification and limitations */
  specification: string;
  limitations: string;
  /** 3. risks in case of failure */
  risks: string;
  /** 4. most relevant competency domains */
  competencies: string[];
  /** 5. knowledge, skills, attitudes and experience */
  ksae: { knowledge: string; skills: string; attitudes: string; experience: string };
  /** 6. information sources to assess progress and support summative entrustment */
  sources: string[];
  /** 7. entrustment level expected at which curriculum stage (stages 1..5 of the Academy) */
  expected: { stage: 1 | 2 | 3 | 4 | 5; level: EntrustLevel }[];
  /** 8. days to expiration if not practised (model parameter) */
  expiryDays: number;
  /** where the learner practises it */
  where: string;
}

export const DOMAIN_LABEL: Record<CompetencyDomain, string> = {
  diagnostic: "Diagnostic angiography",
  pci: "PCI steps",
  haemodynamics: "Haemodynamics",
  mcs: "Mechanical circulatory support",
  structural: "Structural and bedside",
};

export const DOMAIN_ORDER: CompetencyDomain[] = ["diagnostic", "pci", "haemodynamics", "mcs", "structural"];

/**
 * Short labels of the EAPCI 2020 levels of competence (paraphrased; facts/I4.md quotes
 * them), worded as simulator entrustment. Every label names the simulator; none says the
 * learner works without supervision, and level IV repeats the disclaimer's rule that real
 * procedures are learned under direct expert supervision (src/data/teachingText.ts).
 */
export const LEVEL_LABEL: Record<EntrustLevel, { roman: string; short: string; detail: string }> = {
  0: { roman: "–", short: "Not yet in the simulator", detail: "No simulator session or quiz evidence logged yet." },
  1: { roman: "I", short: "Simulator: knows", detail: "In the simulator: selects and interprets; no procedural skill required." },
  2: { roman: "II", short: "Simulator: assists", detail: "In the simulator: some procedural skill, as second operator or in guided sessions." },
  3: { roman: "III", short: "Simulator: supervised operator", detail: "In the simulator: first operator who manages complications, with the attending supervising." },
  4: {
    roman: "IV",
    short: "Simulator entrustment",
    detail: "Entrustment in the simulator only: held-out simulator exams passed without the attending's help. Real procedures stay under direct expert supervision.",
  },
  5: {
    roman: "V",
    short: "Simulator: final assessment",
    detail: "Simulator level IV plus the simulator's final assessment. Not a clinical qualification: real procedures stay under direct expert supervision.",
  },
};

const D = (s: string) => s;

export const EPAS: EpaDef[] = [
  {
    id: "access-radial",
    domain: "diagnostic",
    title: "Obtain radial access and deliver catheters to the aortic root",
    specification: D("Choose the radial route, negotiate loops, subclavian tortuosity and the arch, and deliver a diagnostic catheter to the root without trauma."),
    limitations: D("The simulator models the catheter course from the access route and its anatomical variants; puncture, sheath insertion and haemostasis are in the Full procedure lab."),
    risks: D("Radial spasm, dissection or perforation of the arm vessels, catheter kinking, stroke from arch manipulation."),
    competencies: ["Procedural skill", "Patient safety", "Clinical reasoning"],
    ksae: {
      knowledge: "Arm and arch anatomy, radial loop and subclavian variants, spasm prophylaxis.",
      skills: "Wire-led advancement, catheter exchange over a wire, recognising resistance.",
      attitudes: "Stops at resistance; changes route rather than forcing.",
      experience: "Radial cases across rungs 1-6, including loops and tortuous subclavian arteries.",
    },
    sources: ["Logbook sessions from the radial ladder", "Exam passes on held-out radial cases", "Critical-error log"],
    expected: [{ stage: 2, level: 3 }, { stage: 3, level: 4 }],
    expiryDays: 90,
    where: "Cath lab (radial ladder), Full procedure",
  },
  {
    id: "access-femoral",
    domain: "diagnostic",
    title: "Obtain femoral access and deliver catheters to the aortic root",
    specification: D("Deliver diagnostic catheters from the femoral route through the iliac arteries and aorta to the root, in roots of any size."),
    limitations: D("Puncture technique and closure are practised in the Full procedure lab; the cath lab ladder starts in the descending aorta."),
    risks: D("Retroperitoneal bleeding, dissection of the iliac arteries, distal embolisation."),
    competencies: ["Procedural skill", "Patient safety"],
    ksae: {
      knowledge: "Femoral and iliac anatomy, landmarks for a safe puncture, root sizing.",
      skills: "Wire and catheter advancement under fluoroscopy, root-size matching.",
      attitudes: "Uses fluoroscopy for every wire advance.",
      experience: "Femoral cases across rungs 1-6.",
    },
    sources: ["Logbook sessions from the femoral ladder", "Exam passes on held-out femoral cases"],
    expected: [{ stage: 2, level: 3 }, { stage: 3, level: 4 }],
    expiryDays: 90,
    where: "Cath lab (femoral ladder), Full procedure",
  },
  {
    id: "lca-engage",
    domain: "diagnostic",
    title: "Engage the left coronary artery selectively and safely",
    specification: D("Choose a left curve suited to the root, seat it coaxially in the left main without damping or deep engagement, and inject only on a clean pressure trace."),
    limitations: D("Engagement uses the legacy catheter model until the rod model replaces it."),
    risks: D("Left main dissection, ventricular fibrillation from a wedged injection, air embolism, LV entry."),
    competencies: ["Procedural skill", "Patient safety", "Clinical reasoning"],
    ksae: {
      knowledge: "Root anatomy, left curves and sizing, damping and ventricularisation.",
      skills: "Push, pull and torque at the hub; reading the pressure trace before every injection.",
      attitudes: "Aspirates and checks pressure before injecting; withdraws and reassesses.",
      experience: "Left engagement across small, normal and dilated roots and left main disease.",
    },
    sources: ["Logbook sessions from the left ladder", "Exam passes on held-out left cases", "Mistake log (LV entry, damping)"],
    expected: [{ stage: 2, level: 3 }, { stage: 3, level: 4 }],
    expiryDays: 90,
    where: "Cath lab (left ladder)",
  },
  {
    id: "rca-engage",
    domain: "diagnostic",
    title: "Engage the right coronary artery selectively and safely",
    specification: D("Rotate a right curve to the ostium at the right level, recognise high, anterior and shepherd's crook take-offs, and avoid the conus and deep engagement."),
    limitations: D("Engagement uses the legacy catheter model; the legacy pressure model does not damp for ostial disease."),
    risks: D("RCA ostial dissection, ventricular fibrillation from a conus injection, damped injection."),
    competencies: ["Procedural skill", "Patient safety", "Clinical reasoning"],
    ksae: {
      knowledge: "RCA ostium orientation and take-off variants, conus branch.",
      skills: "Controlled clockwise torque with gentle withdrawal; switching catheters rationally.",
      attitudes: "Checks pressure after every seat; does not chase a vessel with force.",
      experience: "Right engagement across rungs 1-6 including high and anterior take-offs.",
    },
    sources: ["Logbook sessions from the right ladder", "Exam passes on held-out right cases", "Mistake log (damping, conus)"],
    expected: [{ stage: 2, level: 3 }, { stage: 3, level: 4 }],
    expiryDays: 90,
    where: "Cath lab (right ladder)",
  },
  {
    id: "diag-study",
    domain: "diagnostic",
    title: "Perform a complete diagnostic coronary study",
    specification: D("Both coronaries, every segment seen unforeshortened in two clean views, within time, fluoroscopy and contrast limits."),
    limitations: D("Dose is reported once the dose model feeds the logbook; until then fluoroscopy time and contrast stand in."),
    risks: D("Missed lesions, unnecessary dose and contrast, complications from prolonged manipulation."),
    competencies: ["Procedural skill", "Radiation and contrast stewardship", "Clinical reasoning"],
    ksae: {
      knowledge: "Standard projections and what each shows, dominance, contrast and dose limits.",
      skills: "Efficient view sequence, adequate opacification, catheter choice for both sides.",
      attitudes: "Plans the views before the beam is on; keeps dose as low as reasonably achievable.",
      experience: "Full studies across rungs 1-6 including lesions and dominance variants.",
    },
    sources: ["Logbook sessions from the full-study ladder", "Exam passes on held-out full studies", "Passing standard of Jensen 2016 as used by the debrief"],
    expected: [{ stage: 2, level: 3 }, { stage: 3, level: 4 }],
    expiryDays: 90,
    where: "Cath lab (full-study ladder)",
  },
  {
    id: "diag-report",
    domain: "diagnostic",
    title: "Read and report a diagnostic angiogram",
    specification: D("Identify the artery, dominance and projection, recognise occlusions and collaterals, and plan the views a study still needs, on real cine runs."),
    limitations: D("Read on de-identified research datasets; the reference is one expert label per run."),
    risks: D("Wrong vessel or dominance in the report, missed occlusion, an incomplete study."),
    competencies: ["Clinical reasoning", "Communication"],
    ksae: {
      knowledge: "Coronary anatomy in every projection, collateral grading, report structure.",
      skills: "Systematic reading of each run.",
      attitudes: "States confidence honestly; calibrates against the expert label.",
      experience: "Stratified drill sets on each rung, then held-out exam sets.",
    },
    sources: ["Balanced accuracy and kappa per drill set", "Exam sets on held-out library runs"],
    expected: [{ stage: 2, level: 3 }, { stage: 3, level: 4 }],
    expiryDays: 120,
    where: "Real angiograms",
  },
  {
    id: "lesion-assess",
    domain: "diagnostic",
    title: "Assess a coronary lesion",
    specification: D("Locate and grade a stenosis on real runs, then use pressure wire physiology and intravascular imaging to decide on treatment."),
    limitations: D("Angiographic grading is scored against expert boxes; physiology and imaging come from teaching models."),
    risks: D("Treating a non-significant lesion or missing a significant one."),
    competencies: ["Clinical reasoning", "Procedural skill"],
    ksae: {
      knowledge: "Visual grading limits, FFR and resting indices, IVUS and OCT criteria.",
      skills: "Lesion localisation, physiology run without drift or wedging, image interpretation.",
      attitudes: "Does not trust the eye alone for intermediate lesions.",
      experience: "Locate, grade and estimate drills, pressure wire cases, imaging bench cases.",
    },
    sources: ["Drill set accuracy", "Pressure wire and bench sessions", "Exam sets on held-out runs"],
    expected: [{ stage: 3, level: 3 }, { stage: 4, level: 4 }],
    expiryDays: 120,
    where: "Real angiograms, Pressure wire, PCI bench",
  },
  {
    id: "pci-simple",
    domain: "pci",
    title: "Perform PCI of a simple lesion",
    specification: D("Wire, prepare, size and deploy a stent in a focal lesion, optimise it, and finish without complication."),
    limitations: D("Variants beyond the base scenario need the PCI lab to accept a scenario (integration pending); until then rung 1 only."),
    risks: D("Dissection, geographic miss, under-expansion, perforation, no-reflow."),
    competencies: ["Procedural skill", "Patient safety", "Clinical reasoning"],
    ksae: {
      knowledge: "Guide support, wires, balloon and stent sizing, antithrombotic therapy.",
      skills: "Wire steering, positioning runs, deployment and post-dilatation.",
      attitudes: "Images before deploying; sizes to the reference.",
      experience: "Focal LAD lesion and its variants.",
    },
    sources: ["PCI lab debrief", "PCI bench sessions", "Exam passes on held-out variants"],
    expected: [{ stage: 3, level: 3 }, { stage: 4, level: 4 }],
    expiryDays: 60,
    where: "PCI in the cath lab, PCI bench",
  },
  {
    id: "pci-calcium",
    domain: "pci",
    title: "Prepare and treat a calcified lesion",
    specification: D("Recognise severe calcium, modify it before stenting, and achieve expansion without perforation."),
    limitations: D("Calcium modification is a teaching model; variants need the PCI lab integration."),
    risks: D("Under-expansion, perforation, dissection, stent loss."),
    competencies: ["Procedural skill", "Clinical reasoning"],
    ksae: {
      knowledge: "Calcium assessment by angiography and imaging, modification options.",
      skills: "Balloon preparation and checking expansion before stenting.",
      attitudes: "Does not stent a lesion that has not yielded.",
      experience: "Calcified RCA lesion and its variants.",
    },
    sources: ["PCI lab debrief", "Exam passes on held-out variants"],
    expected: [{ stage: 4, level: 3 }, { stage: 5, level: 4 }],
    expiryDays: 60,
    where: "PCI in the cath lab",
  },
  {
    id: "pci-stemi",
    domain: "pci",
    title: "Perform primary PCI for STEMI",
    specification: D("Open a thrombotic occlusion, restore flow, manage thrombus and size the stent after vasodilators."),
    limitations: D("Thrombus and slow flow are teaching models; variants need the PCI lab integration."),
    risks: D("No-reflow, distal embolisation, haemodynamic collapse."),
    competencies: ["Procedural skill", "Patient safety", "Communication and teamwork"],
    ksae: {
      knowledge: "Reperfusion strategy, thrombus management, antithrombotic therapy.",
      skills: "Rapid wiring, restoring flow, deferring sizing until the vessel opens.",
      attitudes: "Keeps the team informed; prioritises flow over a perfect result.",
      experience: "Occluded circumflex STEMI and its variants.",
    },
    sources: ["PCI lab debrief", "Exam passes on held-out variants"],
    expected: [{ stage: 4, level: 3 }, { stage: 5, level: 4 }],
    expiryDays: 60,
    where: "PCI in the cath lab",
  },
  {
    id: "pci-cto",
    domain: "pci",
    title: "Cross a chronic total occlusion",
    specification: D("Use dual injection, escalate wires appropriately and confirm the distal true lumen before any balloon."),
    limitations: D("Antegrade wire escalation only; variants need the PCI lab integration."),
    risks: D("Perforation, subintimal stenting, donor-vessel injury."),
    competencies: ["Procedural skill", "Clinical reasoning"],
    ksae: {
      knowledge: "Occlusion anatomy, collateral supply, wire escalation.",
      skills: "Dual injection, controlled escalation and de-escalation.",
      attitudes: "Stops when the wire position is uncertain.",
      experience: "Mid-RCA occlusion and its variants.",
    },
    sources: ["PCI lab debrief", "Exam passes on held-out variants"],
    expected: [{ stage: 4, level: 2 }, { stage: 5, level: 3 }],
    expiryDays: 60,
    where: "PCI in the cath lab",
  },
  {
    id: "complication-bailout",
    domain: "pci",
    title: "Recognise and treat a procedural complication",
    specification: D("Recognise dissection, perforation, slow flow or tamponade early and carry out the bail-out sequence."),
    limitations: D("Evidence comes from sessions that log a complication and its treatment; the labs report these once integrated."),
    risks: D("Death or emergency surgery from a delayed response."),
    competencies: ["Patient safety", "Communication and teamwork", "Procedural skill"],
    ksae: {
      knowledge: "Complication recognition and bail-out algorithms.",
      skills: "Balloon tamponade, covered stents, pericardiocentesis, flow restoration.",
      attitudes: "Calls for help early; communicates clearly under pressure.",
      experience: "Sessions in which a complication occurred and was treated.",
    },
    sources: ["Logbook complications and treatments", "Pericardiocentesis sessions"],
    expected: [{ stage: 4, level: 3 }, { stage: 5, level: 4 }],
    expiryDays: 60,
    where: "PCI in the cath lab, Pericardiocentesis",
  },
  {
    id: "haemo-cath",
    domain: "haemodynamics",
    title: "Perform and interpret right and left heart catheterisation",
    specification: D("Acquire pressures, saturations and output, and interpret them for shunts, valves, pulmonary hypertension and constriction."),
    limitations: D("Teaching scenarios; the lab does not report which scenario or mode yet, so exams await integration."),
    risks: D("Wrong diagnosis from a damped or mis-zeroed trace; arrhythmia."),
    competencies: ["Clinical reasoning", "Procedural skill"],
    ksae: {
      knowledge: "Normal pressures and waveforms, Fick and thermodilution, shunt calculation.",
      skills: "Zeroing, catheter positioning, recognising artefact.",
      attitudes: "Checks the trace before recording a number.",
      experience: "The haemodynamics lab scenarios.",
    },
    sources: ["Haemodynamics lab sessions"],
    expected: [{ stage: 2, level: 3 }, { stage: 3, level: 4 }],
    expiryDays: 120,
    where: "Haemodynamics lab",
  },
  {
    id: "coronary-physiology",
    domain: "haemodynamics",
    title: "Perform a coronary physiology study",
    specification: D("FFR and resting indices, pullbacks, CFR and IMR, with drift and guide wedging recognised."),
    limitations: D("Teaching model; the lab does not report scenario or mode yet."),
    risks: D("Wrong decision from drift, wedging or inadequate hyperaemia."),
    competencies: ["Clinical reasoning", "Procedural skill"],
    ksae: {
      knowledge: "Physiology indices and thresholds, hyperaemic agents.",
      skills: "Equalisation, drift check, pullback.",
      attitudes: "Repeats a doubtful measurement.",
      experience: "Pressure wire lab cases.",
    },
    sources: ["Pressure wire lab sessions"],
    expected: [{ stage: 3, level: 3 }, { stage: 4, level: 4 }],
    expiryDays: 120,
    where: "Pressure wire",
  },
  {
    id: "mcs-support",
    domain: "mcs",
    title: "Set up and manage mechanical circulatory support",
    specification: D("IABP timing, microaxial pump position and level, and VA-ECMO flow, distension and differential hypoxaemia."),
    limitations: D("Console teaching models; the labs do not report scenario or mode yet."),
    risks: D("Limb ischaemia, haemolysis, LV distension, ineffective support."),
    competencies: ["Clinical reasoning", "Patient safety", "Communication and teamwork"],
    ksae: {
      knowledge: "Device physiology and indications.",
      skills: "Timing, positioning and troubleshooting.",
      attitudes: "Reassesses the patient, not the console.",
      experience: "IABP, Impella and ECMO console cases.",
    },
    sources: ["MCS console sessions"],
    expected: [{ stage: 4, level: 3 }, { stage: 5, level: 4 }],
    expiryDays: 90,
    where: "IABP · Impella · ECMO",
  },
  {
    id: "structural-tavi",
    domain: "structural",
    title: "Plan and deploy a TAVI",
    specification: D("CT planning, valve sizing, deployment depth and complication recognition."),
    limitations: D("Teaching model; the lab does not report scenario or mode yet."),
    risks: D("Annular rupture, coronary obstruction, conduction block, embolisation."),
    competencies: ["Procedural skill", "Clinical reasoning"],
    ksae: {
      knowledge: "Annulus sizing, valve types, complication risks.",
      skills: "Deployment at the planned depth.",
      attitudes: "Follows the plan; aborts when the position is wrong.",
      experience: "TAVI lab cases.",
    },
    sources: ["TAVI lab sessions"],
    expected: [{ stage: 5, level: 2 }],
    expiryDays: 90,
    where: "TAVI lab",
  },
  {
    id: "structural-mitral-laao",
    domain: "structural",
    title: "Perform transseptal mitral repair or appendage occlusion",
    specification: D("Transseptal height, clip alignment and grasping, or appendage sizing, compression and release criteria."),
    limitations: D("Teaching models; the labs do not report scenario or mode yet."),
    risks: D("Tamponade, device embolisation, leaflet injury."),
    competencies: ["Procedural skill", "Clinical reasoning"],
    ksae: {
      knowledge: "Transseptal anatomy, device criteria.",
      skills: "Echo-guided positioning.",
      attitudes: "Releases only when every criterion is met.",
      experience: "TEER and LAAO lab cases.",
    },
    sources: ["TEER and LAAO lab sessions"],
    expected: [{ stage: 5, level: 2 }],
    expiryDays: 90,
    where: "TEER lab, LAAO lab",
  },
  {
    id: "bedside-emergency",
    domain: "structural",
    title: "Insert a temporary pacing wire or drain a tamponade",
    specification: D("Wire position and thresholds for pacing; echo-guided pericardiocentesis."),
    limitations: D("Teaching models; the labs do not report scenario or mode yet."),
    risks: D("Perforation, loss of capture, ventricular puncture."),
    competencies: ["Procedural skill", "Patient safety"],
    ksae: {
      knowledge: "Pacing thresholds, tamponade physiology.",
      skills: "Wire manipulation, needle guidance.",
      attitudes: "Prepares fully before an emergency procedure.",
      experience: "Pacing and pericardiocentesis cases.",
    },
    sources: ["Pacing and pericardiocentesis sessions"],
    expected: [{ stage: 4, level: 3 }],
    expiryDays: 90,
    where: "Pacing · pericardium",
  },
];

export const EPA_BY_ID: Record<EpaId, EpaDef> = Object.fromEntries(EPAS.map((e) => [e.id, e])) as Record<EpaId, EpaDef>;
export const EPA_IDS: EpaId[] = EPAS.map((e) => e.id);

/** Model parameters of the entrustment rules. */
export const ENTRUST_RULES = {
  level1Knowledge: 0.6,
  level2PracticePasses: 3,
  level3: { examPasses: 2, minRung: 3, minDays: 2 },
  level4: { examPasses: 3, minRung: 5, minDays: 2 },
} as const;

/**
 * The final assessment (the old "Level 10, pass Master Assessment", now defined):
 * one exam pass at rung >= 5 on a held-out case in every component EPA, each after
 * that EPA's level IV award, all inside a 14-day window with no critical error in
 * any component exam during that window. Passing it unlocks level V.
 */
export const MASTER_ASSESSMENT = {
  components: ["access-radial", "lca-engage", "rca-engage", "diag-study", "diag-report"] as EpaId[],
  minRung: 5,
  windowDays: 14,
};

// ---------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------

interface DeriveOpts {
  today: string;
  /** fraction 0..1 of linked quiz items retained, per EPA (undefined = not known yet) */
  knowledge?: Partial<Record<EpaId, number>>;
  master?: MasterAssessmentState;
  /** previously cached records: awards in them are kept */
  prev?: Partial<Record<EpaId, EntrustmentRecord>>;
}

/**
 * Distinctness key of a session. Catalogue and library cases are distinct by id;
 * a lab that offers one case per rung (the PCI base scenario, labs that do not
 * report a scenario) counts one session per day, so repeats on the same day add
 * nothing but practice on separate days does.
 */
export function caseKey(r: Pick<LogbookEntry, "caseId" | "date" | "lab">): string {
  return r.lab === "diagnostic" || r.lab === "procedure" || r.caseId.startsWith("gen|") || r.caseId.includes("~") ? r.caseId : `${r.caseId.split("#")[0]}@${r.date}`;
}

const sortRows = (rows: LogbookEntry[]) => [...rows].sort((a, b) => a.t - b.t || (a.id < b.id ? -1 : 1));

/** Rung passes counted toward ladder progression, with the daily cap on blocked practice. */
export function countedRungPasses(rows: LogbookEntry[], epa: EpaId): { caseId: string; rung: number; date: string }[] {
  const perDay = new Map<string, number>();
  const seen = new Set<string>();
  const out: { caseId: string; rung: number; date: string }[] = [];
  for (const r of sortRows(rows)) {
    if (!r.epas.includes(epa) || !r.passed || r.mode === "exam" || r.aggregateOf) continue;
    const rung = r.rungs[epa];
    if (!rung) continue;
    const n = perDay.get(r.date) ?? 0;
    if (n >= LADDER_PARAMS.dailyCountedPasses) continue;
    const key = caseKey(r);
    if (seen.has(key)) continue;
    seen.add(key);
    perDay.set(r.date, n + 1);
    out.push({ caseId: r.caseId, rung, date: r.date });
  }
  return out;
}

/** Highest rung cleared: at least passesToClear distinct passes at that rung or above. */
export function rungCleared(rows: LogbookEntry[], epa: EpaId): number {
  const passes = countedRungPasses(rows, epa);
  let best = 0;
  for (let r = 1; r <= LADDER_PARAMS.rungs; r++) if (passes.filter((p) => p.rung >= r).length >= LADDER_PARAMS.passesToClear) best = r;
  return best;
}

/** Counted rung passes for an EPA on a given day (the same rule as countedRungPasses, for the blocked-practice notice). */
export function passesToday(rows: LogbookEntry[], epa: EpaId, today: string): number {
  return countedRungPasses(rows, epa).filter((p) => p.date === today).length;
}

interface ExamEvent {
  date: string;
  /** epoch ms of the session */
  t: number;
  caseId: string;
  passed: boolean;
  critical: boolean;
  rung: number;
}

/** First exam attempt per held-out case, in time order (later attempts on a seen case do not count). */
export function examEvents(rows: LogbookEntry[], epa: EpaId): ExamEvent[] {
  const seen = new Set<string>();
  const out: ExamEvent[] = [];
  for (const r of sortRows(rows)) {
    if (r.mode !== "exam" || !r.epas.includes(epa) || !isExamCase(epa, r.caseId)) continue;
    if (seen.has(r.caseId)) continue;
    seen.add(r.caseId);
    // a diagnostic row passes only on the mentor's sourced standards (logbook.ts)
    out.push({ date: r.date, t: r.t, caseId: r.caseId, passed: meetsSourcedStandards(r), critical: r.criticalErrors > 0, rung: r.rungs[epa] ?? 0 });
  }
  return out;
}

/** True when a failed exam on this EPA resets the count (reading exams have no critical errors). */
export function resetsOnFail(epa: EpaId): boolean {
  return ladderFor(epa).kind === "reading";
}

/** Walk exam events after `from` and return the date and time at which the rule was met. */
function examAward(events: ExamEvent[], from: string, rule: { examPasses: number; minRung: number; minDays: number }, resetOnFail = false): { on?: string; t?: number; idx?: number; have: number; days: number } {
  let passes: ExamEvent[] = [];
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (e.date < from) continue;
    if (e.critical || (resetOnFail && !e.passed)) {
      passes = [];
      continue;
    }
    if (!e.passed || e.rung < rule.minRung) continue;
    passes.push(e);
    const days = new Set(passes.map((p) => p.date)).size;
    if (passes.length >= rule.examPasses && days >= rule.minDays) return { on: e.date, t: e.t, idx: i, have: passes.length, days };
  }
  return { have: passes.length, days: new Set(passes.map((p) => p.date)).size };
}

export function deriveEntrustment(epa: EpaId, logbook: LogbookEntry[], o: DeriveOpts): EntrustmentRecord {
  const def = EPA_BY_ID[epa];
  const rows = sortRows(logbook.filter((r) => r.epas.includes(epa)));
  const prev = o.prev?.[epa];
  const awardedOn: Partial<Record<EntrustLevel, string>> = {};
  const awardedAt: Partial<Record<EntrustLevel, number>> = {};
  const failResets = resetsOnFail(epa);

  // Level I
  const k = o.knowledge?.[epa];
  if (rows.length) awardedOn[1] = rows[0].date;
  else if (k !== undefined && k >= ENTRUST_RULES.level1Knowledge) awardedOn[1] = prev?.awardedOn[1] ?? o.today;

  // Level II: distinct passed practice cases (a migrated summary counts once)
  const seenCases = new Set<string>();
  let practice = 0;
  let l2: string | undefined;
  for (const r of rows) {
    if (!r.passed || r.mode === "exam" || seenCases.has(caseKey(r))) continue;
    seenCases.add(caseKey(r));
    practice++;
    if (!l2 && practice >= ENTRUST_RULES.level2PracticePasses) l2 = r.date;
  }
  if (l2 && awardedOn[1]) awardedOn[2] = l2;

  const events = examEvents(rows, epa);
  let progress: EntrustmentRecord["examProgress"] = { have: 0, need: ENTRUST_RULES.level3.examPasses, days: 0, needDays: ENTRUST_RULES.level3.minDays };
  if (awardedOn[2]) {
    const a3 = examAward(events, awardedOn[2], ENTRUST_RULES.level3, failResets);
    if (a3.on) {
      awardedOn[3] = a3.on;
      awardedAt[3] = a3.t;
      // level IV counts only exam cases taken after the pass that completed level III
      const a4 = examAward(events.slice(a3.idx! + 1), a3.on, ENTRUST_RULES.level4, failResets);
      if (a4.on) {
        awardedOn[4] = a4.on;
        awardedAt[4] = a4.t;
      }
      else progress = { have: a4.have, need: ENTRUST_RULES.level4.examPasses, days: a4.days, needDays: ENTRUST_RULES.level4.minDays };
    } else progress = { have: a3.have, need: ENTRUST_RULES.level3.examPasses, days: a3.days, needDays: ENTRUST_RULES.level3.minDays };
  }
  if (awardedOn[4] && o.master?.passed && o.master.passedOn) awardedOn[5] = o.master.passedOn > awardedOn[4] ? o.master.passedOn : awardedOn[4];

  // Awards already made stay made (with their time, if it was known), except that a
  // diagnostic award of level III or above is re-judged on the sourced standards while
  // the logbook still holds the EPA's history: an award made on the composite score
  // alone is withdrawn, so the recomputed level is never higher than the stored one.
  // Level V rests on the final assessment: when a final assessment is given and is not
  // passed (a stored one withdrawn by deriveAll), a stored level V is not kept.
  const rejudge = standardsRejudged(epa, logbook, rows, prev);
  for (const [lv, d] of Object.entries(prev?.awardedOn ?? {})) {
    const L = Number(lv) as EntrustLevel;
    if (rejudge && L >= 3) continue;
    if (L === 5 && o.master && !o.master.passed) continue;
    if (d && !awardedOn[L]) {
      awardedOn[L] = d;
      const t = prev?.awardedAt?.[L];
      if (t !== undefined) awardedAt[L] = t;
    }
  }
  const awarded = ([5, 4, 3, 2, 1] as EntrustLevel[]).find((L) => awardedOn[L]) ?? 0;

  const lastPassed = [...rows].reverse().find((r) => r.passed)?.date;
  const since = lastPassed ? daysBetween(lastPassed, o.today) : undefined;
  const expired = awarded >= 2 && since !== undefined && since > def.expiryDays;
  const effective = (expired ? awarded - 1 : awarded) as EntrustLevel;

  const exams = { attempts: events.length, passes: events.filter((e) => e.passed).length, criticalFails: events.filter((e) => e.critical).length };
  const cleared = rungCleared(rows, epa);
  const ladder = ladderFor(epa);
  const examPool = ladder.kind === "diagnostic" || ladder.kind === "reading";

  let next: string;
  if (expired) next = `Refresher due: no passed session in ${since} days (expiry ${def.expiryDays}). One passed session restores level ${LEVEL_LABEL[awarded].roman}.`;
  else if (awarded === 0) next = "Log a first session or retain the linked quiz items.";
  else if (awarded === 1) next = `Pass ${ENTRUST_RULES.level2PracticePasses - practice} more practice case${ENTRUST_RULES.level2PracticePasses - practice === 1 ? "" : "s"} on distinct cases.`;
  else if (awarded === 2 || awarded === 3) {
    const rule = awarded === 2 ? ENTRUST_RULES.level3 : ENTRUST_RULES.level4;
    next = examPool
      ? `Exam mode: ${Math.max(0, rule.examPasses - progress.have)} more pass${rule.examPasses - progress.have === 1 ? "" : "es"} on held-out cases at rung ${rule.minRung} or above, over at least ${rule.minDays} days, with no ${failResets ? "failed set in between" : "critical error"}${ladder.kind === "diagnostic" ? ", each meeting the mentor's passing standards" : ""}.`
      : "Exam mode for this lab needs held-out cases from the lab (integration pending).";
  } else if (awarded === 4) next = o.master?.passed ? "Level V awarded with the final assessment." : "Pass the final assessment for level V.";
  else next = "Highest level held. Keep it current.";

  return {
    epa,
    awarded,
    effective,
    awardedOn,
    awardedAt,
    lastPassed,
    expired,
    daysToExpiry: since === undefined ? undefined : def.expiryDays - since,
    next,
    examProgress: progress,
    practicePasses: practice,
    exams,
    rungCleared: cleared,
  };
}

/**
 * Are this EPA's stored awards of level III and above re-judged from the logbook? Only
 * for EPAs whose exams are diagnostic-lab rows (judged on the sourced standards), and
 * only while the logbook still holds the EPA's history: it has not reached LOGBOOK_MAX,
 * or it still holds the session that earned level I. An award whose evidence was
 * trimmed is kept, as every award is.
 */
function standardsRejudged(epa: EpaId, logbook: LogbookEntry[], rows: LogbookEntry[], prev: EntrustmentRecord | undefined): boolean {
  if (!prev || ladderFor(epa).kind !== "diagnostic") return false;
  if (logbook.length < LOGBOOK_MAX) return true;
  const first = prev.awardedOn[1];
  return !!first && rows.length > 0 && rows[0].date <= first;
}

/** When level IV was awarded: the date, and the time of the completing exam where known. */
export type L4Award = string | { date: string; t?: number };

/**
 * Final assessment state from the logbook and the level IV awards. A component exam
 * counts when it was taken after the exam that completed that EPA's level IV (compared
 * by time, so an exam later on the same day counts); when only the award date is known
 * (an award carried over from a trimmed logbook), from the next day. A critical error,
 * or a failed reading set, in any component exam inside the window voids it.
 */
export function deriveMaster(logbook: LogbookEntry[], l4On: Partial<Record<EpaId, L4Award>>, prev?: MasterAssessmentState): MasterAssessmentState {
  if (prev?.passed) return prev;
  const M = MASTER_ASSESSMENT;
  const cand: Record<string, ExamEvent[]> = {};
  const voiding: ExamEvent[] = [];
  for (const epa of M.components) {
    const ev = examEvents(logbook, epa);
    const failResets = resetsOnFail(epa);
    voiding.push(...ev.filter((e) => e.critical || (failResets && !e.passed)));
    const a = l4On[epa];
    const from = typeof a === "string" ? { date: a, t: undefined } : a;
    const after = (e: ExamEvent) => (!from ? false : from.t !== undefined ? e.t > from.t : e.date > from.date);
    cand[epa] = from ? ev.filter((e) => e.passed && e.rung >= M.minRung && after(e)) : [];
  }
  const components: MasterAssessmentState["components"] = {};
  const all = [...new Set(M.components.flatMap((e) => cand[e].map((x) => x.date)))].sort();
  for (const start of all) {
    const end = addDaysStr(start, M.windowDays - 1);
    const picks: Partial<Record<EpaId, ExamEvent>> = {};
    let ok = true;
    for (const epa of M.components) {
      const hit = cand[epa].find((e) => e.date >= start && e.date <= end);
      if (!hit) {
        ok = false;
        break;
      }
      picks[epa] = hit;
    }
    if (!ok) continue;
    const doneOn = Object.values(picks).reduce((m, e) => (e!.date > m ? e!.date : m), start);
    if (voiding.some((e) => e.date >= start && e.date <= doneOn)) continue;
    for (const epa of M.components) components[epa] = { date: picks[epa]!.date, caseId: picks[epa]!.caseId };
    return { passed: true, passedOn: doneOn, components };
  }
  for (const epa of M.components) {
    const last = cand[epa][cand[epa].length - 1];
    components[epa] = last ? { date: last.date, caseId: last.caseId } : null;
  }
  return { passed: false, components };
}

function addDaysStr(d: string, n: number): string {
  const x = new Date(d + "T00:00:00Z");
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
}

/** Every EPA plus the final assessment, in one pass. */
export function deriveAll(logbook: LogbookEntry[], o: DeriveOpts): { entrustment: Record<EpaId, EntrustmentRecord>; master: MasterAssessmentState } {
  const first: Partial<Record<EpaId, EntrustmentRecord>> = {};
  for (const e of EPA_IDS) first[e] = deriveEntrustment(e, logbook, { ...o, master: undefined });
  const l4: Partial<Record<EpaId, L4Award>> = {};
  for (const e of EPA_IDS) if (first[e]!.awardedOn[4]) l4[e] = { date: first[e]!.awardedOn[4]!, t: first[e]!.awardedAt?.[4] };
  // A final assessment passed on awards that have since been withdrawn (re-judged on the
  // sourced standards) is derived again from the logbook.
  const masterHeld = !o.master?.passed || MASTER_ASSESSMENT.components.every((e) => l4[e]);
  const master = deriveMaster(logbook, l4, masterHeld ? o.master : undefined);
  // When a stored final assessment is withdrawn, every EPA is derived again against the
  // unpassed state, so no component keeps a level V that rested on it.
  const withdrawn = !!o.master?.passed && !master.passed;
  const entrustment = {} as Record<EpaId, EntrustmentRecord>;
  for (const e of EPA_IDS) entrustment[e] = master.passed || withdrawn ? deriveEntrustment(e, logbook, { ...o, master }) : first[e]!;
  return { entrustment, master };
}

// ---------------------------------------------------------------------------
// What the level drives: the lab's mode, visibility policy and mentor fading
// ---------------------------------------------------------------------------

/** Practice mode for a level: guided up to II, supervised at III, independent from IV. */
export function practiceModeFor(level: EntrustLevel): Exclude<AssessmentMode, "exam"> {
  return level <= 2 ? "guided" : level === 3 ? "supervised" : "independent";
}

export function mentorLevel(level: EntrustLevel): MentorLevel {
  return Math.max(1, level) as MentorLevel;
}

/** The mode, mentor entrustment and screen policy a lab should use for this EPA. */
export function labPolicy(rec: EntrustmentRecord | undefined, exam = false): { mode: AssessmentMode; entrustment: MentorLevel; visibility: VisibilityPolicy } {
  const level = rec?.effective ?? 0;
  const mode: AssessmentMode = exam ? "exam" : practiceModeFor(level);
  const entrustment = mentorLevel(level);
  return { mode, entrustment, visibility: visibilityFor(mode, entrustment) };
}

/** Linked modules' quiz knowledge per EPA: fraction of quiz items with at least 2 correct reviews in a row. */
export function knowledgeByEpa(
  modules: { id: string; quizIds: string[] }[],
  memory: Record<string, { reps: number }>
): Partial<Record<EpaId, number>> {
  const byId = new Map(modules.map((m) => [m.id, m.quizIds]));
  const out: Partial<Record<EpaId, number>> = {};
  for (const epa of EPA_IDS) {
    const ids = modulesForEpa(epa).flatMap((m) => byId.get(m) ?? []);
    if (!ids.length) continue;
    out[epa] = ids.filter((id) => (memory[id]?.reps ?? 0) >= 2).length / ids.length;
  }
  return out;
}
