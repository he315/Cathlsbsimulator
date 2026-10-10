// The full case's femoral closure scenarios (access-closure-femoral-manual): the femoral closure
// algorithm and its angiogram presets (lesson pm-closure-plan, src/content/manual/pci-manual/
// 13-closure.ts: 'The femoral closure algorithm' and 'Reading the femoral angiogram for closure'), and
// hands-on manual compression with its preparation, a falling ACT and the two reactions at the pull
// (pm-closure-femoral-compression, same file; cm-patient-complications-vasovagal and
// cm-perforation-tamponade for the look-alikes).
//
// Each opens at 'closure': the autopilot has punctured over the femoral head, put in a 6 Fr 10 cm sheath
// over a wire, given the femoral heparin dose (SOURCED_DOSES.radialHeparinUPerKg, 50 U/kg), done the
// diagnostic study and taken the catheter out. The start state then sets the scenario's problem through
// public session methods (the team's work, not the learner's; the ledger is emptied after it).
//
// What each scenario sets (scenario settings: MODEL PARAMETERS of the scenario unless cited; none is a
// population value). Site x is mm along the limb from the inguinal crease, positive towards the heart;
// the femoral head has the site model's 24 mm radius.
//   closure-fem-standard        the textbook groin (fem-normal's): entry over the femoral head, below
//                               the inferior epigastric artery, above the bifurcation, a clean artery
//                               larger than 5 mm; any device or compression once the ACT allows;
//   closure-fem-high-stick      the team's entry about 4 mm above the lowest point of the inferior
//                               epigastric artery (set at 48), below the ligament model's line ('Entry
//                               above the lowest point of the inferior epigastric artery is a high
//                               stick'): no collagen plug, the suture device preferred;
//   closure-fem-below-bif       a high bifurcation (22) and the team's entry within the site model's 3 mm
//                               of it: at or below the bifurcation, so no device;
//   closure-fem-branch          'a high bifurcation with the sheath in a small accessory profunda
//                               branch' (Brilakis, in the lesson's table): no device;
//   closure-fem-small-artery    a common femoral artery of 4.5 mm (under the 5 mm the algorithm asks
//                               for): no device;
//   closure-fem-calcified       heavy anterior-wall calcium over the upper half of the femoral head,
//                               the entry over the clear lower half, no luminal atheroma: no suture
//                               device ('Heavy calcification rules out the suture-mediated device in
//                               particular');
//   closure-fem-old-plug        a collagen plug in this groin 6 weeks ago (within the 90 days the
//                               lesson gives): its filling defect, a reason to choose another site
//                               next time;
//   closure-fem-staged-pci      the RCA to be treated in about four hours, with a support device
//                               possible (the lesson's check question): the sheath stays, sutured;
//   compression-vagal           a young, anxious man ('young anxious men most often',
//                               cm-patient-complications-vasovagal): a vasovagal reaction is scripted
//                               at the pull, with the cuff cycling every minute; treated with the hands
//                               kept on;
//   compression-tamponade-mimic hypotension at the pull after a PCI whose distal wire perforation was
//                               sealed: blood collects in the pericardium (0.5 mL/s, tamponade-mimic's
//                               rate, stopping at 140 mL: enough for a fast rate and a low pressure in
//                               this patient even with saline running), and the echo shows an effusion;
//   compression-act-high        heparin topped up to the PCI dose (SOURCED_DOSES.pciHeparinUPerKg), the
//                               case opening once the ACT has come down to about 245 s: wait for it to
//                               fall below 180 s before the hands go on, or reverse it with protamine
//                               once the equipment is out.
// Every scenario is an elective case for stable angina with a fixed seed, so the drill is the same
// each time it is opened.
import type { ProcedureScenario } from "./index";
import type { CaseSession } from "../caseSession";
import type { EmergenciesModule } from "../modules/emergencies";
import { cycleCuff, scriptPericardialBleed, scriptVagal } from "../emergencies";

const PLAN = "pm-closure-plan";
const COMPRESS = "pm-closure-femoral-compression";
const HEPARIN = "pm-antithrombotics-heparin";
const VAGAL = "cm-patient-complications-vasovagal";
const TAMPONADE = "cm-perforation-tamponade";

/** The standard groin of these scenarios (fem-normal's). */
const GROIN = { ligamentX: 66, headX: 30, bifurcationX: -4 };

/** closure-fem-high-stick: the inferior epigastric artery's lowest point and the team's entry above it (site x, mm). */
const HIGH_IEA_X = 48;
const HIGH_ENTRY_X = 52;
/** closure-fem-below-bif: the high bifurcation and the team's entry 1 mm above it (within the 3 mm 'at the bifurcation'). */
const HIGH_BIF_X = 22;
const BELOW_BIF_ENTRY_X = 23;
/** closure-fem-branch: the team's entry into the accessory profunda branch (site x, mm; it runs below the head centre). */
const BRANCH_ENTRY_X = 20;
/** closure-fem-small-artery: the common femoral artery's diameter (mm). */
const SMALL_CFA_MM = 4.5;
/** closure-fem-calcified: anterior-wall calcium over the upper half of the femoral head (site x, mm). */
const CALCIUM = [{ fromX: 32, toX: 54 }];
/** closure-fem-old-plug: days since the collagen plug in this groin. */
const OLD_PLUG_DAYS = 42;
/** compression-tamponade-mimic: blood into the pericardium from the pull (mL/s, tamponade-mimic's) and where it stops (mL). */
const TAMPONADE_ML_S = 0.5;
const TAMPONADE_CAP_ML = 140;

const emergencies = (s: CaseSession) => s.mod<EmergenciesModule>("emergencies");

/** The learner has the case from here (what the autopilot's steps left open is not scored), then `then`. */
const takeOver =
  (then?: (s: CaseSession) => void) =>
  (s: CaseSession): void => {
    emergencies(s)?.actions.learnerControl();
    then?.(s);
  };

/** Move the team's puncture (the sheath stays where it is in the artery's course). */
const entryAt = (x: number, vessel?: string) => (s: CaseSession) => void s.relocateTeamPuncture({ x, vessel });

/** compression-act-high: the ACT the case opens at, at most (s; scenario setting: a high ACT that will fall below 180 s within the session). */
const ACT_HIGH_OPEN_S = 245;

/**
 * compression-act-high: the heparin topped up to the PCI dose, then the time the team's PCI took, until the
 * ACT (the engine's, not a measurement: nothing is recorded as measured) has come down to ACT_HIGH_OPEN_S.
 */
function pciHeparin(s: CaseSession): void {
  s.runPending();
  if (s.order("heparin-pci")) s.runPending();
  for (let k = 0; k < 48 && s.patient.vitals().actTrue > ACT_HIGH_OPEN_S; k++) {
    s.wait(300, "The PCI");
    s.runPending();
  }
}

const ELECTIVE = { indication: "SA" as const, access: "femoral" as const, start: "closure" as const };
/** A patient with no reaction, no anticoagulant and sinus rhythm, so the closure is the only problem. */
const CLEAN = { anticoagulation: "none" as const, allergies: { contrast: "none" as const, other: [] }, rhythm: "sinus" as const };

export const scenarios: ProcedureScenario[] = [
  {
    id: "closure-fem-standard",
    title: "Femoral closure: plan it and press",
    lessonIds: [PLAN, COMPRESS, HEPARIN],
    seed: "closure-fem-standard",
    ...ELECTIVE,
    profile: CLEAN,
    site: GROIN,
    state: takeOver(),
  },
  {
    id: "closure-fem-high-stick",
    title: "Femoral closure: read the entry first (1)",
    lessonIds: [PLAN, COMPRESS, HEPARIN],
    seed: "closure-fem-high-stick",
    ...ELECTIVE,
    profile: CLEAN,
    site: { ...GROIN, ieaOriginX: HIGH_IEA_X },
    state: takeOver(entryAt(HIGH_ENTRY_X)),
  },
  {
    id: "closure-fem-below-bif",
    title: "Femoral closure: read the entry first (2)",
    lessonIds: [PLAN, COMPRESS, HEPARIN],
    seed: "closure-fem-below-bif",
    ...ELECTIVE,
    profile: CLEAN,
    site: { ...GROIN, bifurcationX: HIGH_BIF_X },
    state: takeOver(entryAt(BELOW_BIF_ENTRY_X)),
  },
  // Known limitation: the femoral angiogram (AccessFluoroView, route.ts) still draws the sheath along the
  // common femoral artery, not in the branch, so the image does not show what this case grades. Until it
  // does, the scenario is linked to no lesson (it stays out of the practice index) and is left in the
  // picker only.
  {
    id: "closure-fem-branch",
    title: "Femoral closure: read the entry first (3)",
    lessonIds: [],
    seed: "closure-fem-branch",
    ...ELECTIVE,
    profile: CLEAN,
    site: { ...GROIN, accessoryProfunda: true },
    state: takeOver(entryAt(BRANCH_ENTRY_X, "accessory-profunda")),
  },
  {
    id: "closure-fem-small-artery",
    title: "Femoral closure: size the artery",
    lessonIds: [PLAN],
    seed: "closure-fem-small-artery",
    ...ELECTIVE,
    profile: { ...CLEAN, sex: "F", heightCm: 152, weightKg: 52 },
    site: { ...GROIN, smallCfaMm: SMALL_CFA_MM },
    state: takeOver(),
  },
  {
    id: "closure-fem-calcified",
    title: "Femoral closure: read the entry first (4)",
    lessonIds: [PLAN],
    seed: "closure-fem-calcified",
    ...ELECTIVE,
    profile: { ...CLEAN, ageY: 74 },
    site: { ...GROIN, calcium: CALCIUM },
    state: takeOver(),
  },
  {
    id: "closure-fem-old-plug",
    title: "Femoral closure: read the entry first (5)",
    lessonIds: [PLAN],
    seed: "closure-fem-old-plug",
    ...ELECTIVE,
    profile: CLEAN,
    chart: { history: "Coronary angiography through the right groin six weeks ago, closed with a collagen-plug device." },
    site: GROIN,
    state: takeOver((s) => s.setClosureContext({ oldPlugDays: OLD_PLUG_DAYS })),
  },
  {
    id: "closure-fem-staged-pci",
    title: "Femoral closure: plan it (2)",
    lessonIds: [PLAN],
    seed: "closure-fem-staged-pci",
    ...ELECTIVE,
    profile: CLEAN,
    site: GROIN,
    script: [{ at: "arrival", log: { kind: "attending", text: "Plan: the RCA will be treated in about four hours, and a support device may be needed for it." } }],
    state: takeOver((s) => s.setClosureContext({ stagedPciSoon: true, supportDeviceLikely: true })),
  },
  {
    id: "compression-vagal",
    title: "Femoral compression: unwell under your hands",
    lessonIds: [COMPRESS, VAGAL],
    seed: "compression-vagal",
    ...ELECTIVE,
    profile: { ...CLEAN, sex: "M", ageY: 32, anxiety: 0.85, vagalTone: 0.9 },
    site: GROIN,
    state: takeOver(),
    script: [
      {
        at: "sheath-pull",
        run: (s) => {
          cycleCuff(s, 1);
          scriptVagal(s);
        },
      },
    ],
  },
  {
    id: "compression-tamponade-mimic",
    title: "Femoral compression: hypotension after a PCI",
    lessonIds: [COMPRESS, VAGAL, TAMPONADE],
    seed: "compression-tamponade-mimic",
    ...ELECTIVE,
    profile: { ...CLEAN, sex: "F", ageY: 69 },
    site: GROIN,
    state: takeOver(),
    script: [
      { at: "arrival", log: { kind: "nurse", text: "Handover: during the PCI a distal wire perforation was sealed with a prolonged balloon inflation." } },
      {
        at: "sheath-pull",
        run: (s) => {
          cycleCuff(s, 1);
          if (scriptPericardialBleed(s, TAMPONADE_ML_S)) emergencies(s)?.actions.capPericardium(TAMPONADE_CAP_ML);
        },
      },
    ],
  },
  {
    id: "compression-act-high",
    title: "Femoral compression: when may the sheath come out?",
    lessonIds: [COMPRESS, HEPARIN],
    seed: "compression-act-high",
    ...ELECTIVE,
    profile: CLEAN,
    site: GROIN,
    state: takeOver(pciHeparin),
  },
];
