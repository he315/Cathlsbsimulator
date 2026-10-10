// The full case's endovascular control and cold-leg scenarios (access-cx-endovascular-control): the lessons
// cm-access-complications-femoral-bleeding (complication-management/06-access-complications.ts: the algorithm's
// steps 6 to 9, lines 185-203), cm-access-complications-large-bore (the crossover balloon and the covered stent,
// 918-1000) and cm-access-complications-limb (the six Ps against cholesterol embolisation and the treatment by
// cause, 440-515). The session module modules/endovascular.ts runs each episode; the controls are
// src/ui/access/EndovascularPanel.tsx in the fluoroscopy workspace. A bleed case presents its signs a minute
// after the learner takes over; a cold-leg case the patient's symptoms. Nothing names the injury or the cause.
//
// Every case opens at 'closure' (the autopilot's right femoral sheath in, the catheter out) except the cholesterol
// case, which opens in recovery, so the other groin is the learner's to open as another access site. Each has a
// fixed seed and the standard groin of the closure scenarios (ligament at site x 66, femoral head at 30, femoral
// bifurcation at -4).
//
// What each scenario sets (scenario settings: MODEL PARAMETERS of the scenario unless cited; none is a population
// value). Site x is mm along the limb from the inguinal crease, positive towards the heart. The parent artery's
// diameter is the site model's sourced common femoral diameter (SOURCED_SITE.cfaDiamMaleMm 9.8, cfaDiamFemaleMm 8.2,
// src/simulation/access/site.ts) for a hole in the common femoral artery, 8 mm (MODEL) for the external iliac
// artery, and a branch the site model's 2.2 mm (MP_SITE.branchR 1.1 mm radius). The bleeding rates are those of the
// retroperitoneal scenarios (scenarios/bleeding.ts), from an initial loss of 600 mL.
//   bleed-external-iliac   a hole in the right external iliac artery 44 mm above the ligament (site x 110), not
//                          sealed by a prolonged balloon: balloon, then a covered stent through a 7 Fr sheath
//                          (balloon-expandable places precisely); coils and a bare stent fail;
//   bleed-cfa              a large-bore case (the pump and its 14 Fr sheath out, a short sheath back in): a jet
//                          from the common femoral artery 20 mm above its bifurcation (the lesson's check question,
//                          06-access-complications.ts:1006), leaving a landing zone: balloon, then a self-expanding
//                          covered stent above the bifurcation, or surgery; a stent across the bifurcation loses
//                          the profunda;
//   bleed-iea-branch       a hole 15 mm along the inferior epigastric artery (origin site x 70) with no retrograde
//                          filling: balloon, the selective injection, then coils (or a covered stent over its mouth);
//   bleed-lcia-branch      the same in the lateral circumflex iliac artery (origin site x 73);
//   bleed-distal-pinhole   a hole 45 mm out along the inferior epigastric artery, beyond a coil's reach:
//                          microspheres, glue or thrombin, or a covered stent over the mouth;
//   dissection-iliac       a flow-limiting dissection of the right external iliac artery at site x 95 after the
//                          team's firm injection through a sheath whose side-arm trace was damped: cross into the
//                          true lumen from the left groin, self-expanding stent;
//   dissection-cfa         a flow-limiting dissection of the common femoral artery at site x 20 after a wire pushed
//                          through resistance: endarterectomy (surgery), not a stent;
//   plug-intraluminal      the team's collagen plug at the right groin, deployed into the lumen: surgical removal;
//   leg-embolus            thrombus from a sheath flushed before it was aspirated, lodged in the superficial femoral
//                          artery 40 mm below the bifurcation: thrombectomy, thrombolysis or angioplasty;
//   livedo-not-ali         in recovery: a painful foot with livedo and every pulse present (cholesterol
//                          embolisation): no emergency angiography; supportive care.
import type { ProcedureScenario } from "./index";
import type { CaseSession } from "../caseSession";
import type { EmergenciesModule } from "../modules/emergencies";
import type { EndoConfig, EndovascularModule } from "../modules/endovascular";
import type { EndoInjury } from "../../access/endovascular";

const BLEED = "cm-access-complications-femoral-bleeding";
const LARGE = "cm-access-complications-large-bore";
const LIMB = "cm-access-complications-limb";

/** The standard groin of the closure scenarios (fem-normal's). */
const GROIN = { ligamentX: 66, headX: 30, bifurcationX: -4 };
/** The branch origins with this groin: the site model's defaults (ligament + 4 and + 7 mm, MP_SITE). */
const IEA_ORIGIN_X = GROIN.ligamentX + 4;
const LCIA_ORIGIN_X = GROIN.ligamentX + 7;
/** Diameters (mm): external iliac (MODEL), common femoral (SOURCED_SITE, site.ts), a branch (MP_SITE.branchR x 2). */
const EIA_MM = 8;
const CFA_MM = { M: 9.8, F: 8.2 } as const;
const BRANCH_MM = 2.2;
/** The bleeding of the retroperitoneal scenarios: rate (mL/min), what it reaches untreated (mL), lost at onset (mL). */
const BLEED_RATE = { rateMlMin: 55, totalMl: 2600, initialMl: 600 } as const;

const endovascular = (s: CaseSession) => s.mod<EndovascularModule>("endovascular");
const emergencies = (s: CaseSession) => s.mod<EmergenciesModule>("emergencies");

/** The learner has the case from here; the episode is configured and presents `onsetAfterMin` later. */
const takeOver =
  (cfg: EndoConfig, then?: (s: CaseSession) => void) =>
  (s: CaseSession): void => {
    emergencies(s)?.actions.learnerControl();
    then?.(s);
    const m = endovascular(s);
    m?.actions.configure(cfg);
    m?.actions.learnerControl();
  };

const onTable = { access: "femoral" as const, start: "closure" as const, site: GROIN, indication: "SA" as const };
const CLEAN = { anticoagulation: "none" as const, allergies: { contrast: "none" as const, other: [] } };

const BACK = "She says her lower back aches and she feels sick; she is pale, clammy and sweating.";
const GROIN_SWELLING = "The groin is swelling under firm pressure, and she is sweating and says she feels faint.";
const FOOT = "He says his right foot has gone painful and numb.";

const bleed = (injury: EndoInjury, report: string, o: { largeBore?: boolean } = {}): EndoConfig => ({ kind: "bleed", injury, ...BLEED_RATE, onsetAfterMin: 1, report, ...o });

export const scenarios: ProcedureScenario[] = [
  {
    id: "bleed-external-iliac",
    title: "A falling pressure on the table after a femoral case",
    lessonIds: [BLEED, LARGE, LIMB],
    seed: "bleed-external-iliac",
    ...onTable,
    profile: { ...CLEAN, sex: "F", ageY: 74, heightCm: 158, weightKg: 60, rhythm: "sinus" },
    state: takeOver(bleed({ vessel: "external-iliac", siteX: 110, vesselMm: EIA_MM }, BACK)),
  },
  {
    id: "bleed-cfa",
    title: "Bleeding at the groin after a large-bore case",
    lessonIds: [BLEED, LARGE, LIMB],
    seed: "bleed-cfa",
    ...onTable,
    profile: { ...CLEAN, sex: "F", ageY: 78, heightCm: 160, weightKg: 64, rhythm: "sinus" },
    script: [{ at: "arrival", log: { kind: "nurse", text: "Handover: protected PCI through the right femoral artery; the pump and its 14 Fr sheath are out, the pre-close sutures tied, and a short sheath is back in over the wire." } }],
    state: takeOver(bleed({ vessel: "common-femoral", siteX: GROIN.bifurcationX + 20, vesselMm: CFA_MM.F }, GROIN_SWELLING, { largeBore: true })),
  },
  {
    id: "bleed-iea-branch",
    title: "A falling pressure on the table after a femoral case (2)",
    lessonIds: [BLEED, LARGE, LIMB],
    seed: "bleed-iea-branch",
    ...onTable,
    profile: { ...CLEAN, sex: "M", ageY: 66, rhythm: "sinus" },
    state: takeOver(bleed({ vessel: "iea", siteX: IEA_ORIGIN_X, alongMm: 15, vesselMm: EIA_MM, branchMm: BRANCH_MM }, "He says his lower abdomen and back ache; he is sweating.")),
  },
  {
    id: "bleed-lcia-branch",
    title: "A falling pressure on the table after a femoral case (3)",
    lessonIds: [BLEED],
    seed: "bleed-lcia-branch",
    ...onTable,
    profile: { ...CLEAN, sex: "F", ageY: 70, rhythm: "sinus" },
    state: takeOver(bleed({ vessel: "lcia", siteX: LCIA_ORIGIN_X, alongMm: 15, vesselMm: EIA_MM, branchMm: BRANCH_MM }, BACK)),
  },
  {
    id: "bleed-distal-pinhole",
    title: "A falling pressure on the table after a femoral case (4)",
    lessonIds: [BLEED],
    seed: "bleed-distal-pinhole",
    ...onTable,
    profile: { ...CLEAN, sex: "M", ageY: 72, rhythm: "sinus" },
    state: takeOver(bleed({ vessel: "iea", siteX: IEA_ORIGIN_X, alongMm: 45, distal: true, vesselMm: EIA_MM, branchMm: BRANCH_MM }, "He says his lower abdomen aches; he looks pale.")),
  },
  {
    id: "dissection-iliac",
    title: "A painful foot at the end of a femoral case",
    lessonIds: [LIMB],
    seed: "dissection-iliac",
    ...onTable,
    profile: { ...CLEAN, sex: "M", ageY: 69, rhythm: "sinus" },
    script: [{ at: "arrival", log: { kind: "nurse", text: "Handover: before the study the fellow gave a firm 10 mL injection through the side arm to check the sheath; its trace had looked flat." } }],
    state: takeOver({ kind: "leg", lesion: { cause: "iliac-dissection", siteX: 95 }, onsetAfterMin: 1, report: FOOT }),
  },
  {
    id: "dissection-cfa",
    title: "A painful foot at the end of a femoral case (2)",
    lessonIds: [LIMB],
    seed: "dissection-cfa",
    ...onTable,
    profile: { ...CLEAN, sex: "M", ageY: 63, rhythm: "sinus" },
    script: [{ at: "arrival", log: { kind: "nurse", text: "Handover: the wire met resistance going up from the groin and was pushed on through it." } }],
    state: takeOver({ kind: "leg", lesion: { cause: "cfa-dissection", siteX: 20 }, onsetAfterMin: 1, report: FOOT }),
  },
  {
    id: "plug-intraluminal",
    title: "A painful foot after the groin was closed",
    lessonIds: [LIMB],
    seed: "plug-intraluminal",
    ...onTable,
    profile: { ...CLEAN, sex: "F", ageY: 76, rhythm: "sinus" },
    // the team closes the groin with a collagen plug (its anchor caught on plaque: deployed into the lumen)
    state: takeOver({ kind: "leg", lesion: { cause: "plug", siteX: 30 }, onsetAfterMin: 1, report: "She says her right foot has gone cold and painful." }, (s) => {
      s.femoralDevice("collagen-plug", true);
      s.runPending();
    }),
  },
  {
    id: "leg-embolus",
    title: "A painful foot at the end of a femoral case (3)",
    lessonIds: [LIMB],
    seed: "leg-embolus",
    ...onTable,
    profile: { ...CLEAN, sex: "M", ageY: 71, rhythm: "sinus" },
    script: [{ at: "arrival", log: { kind: "nurse", text: "Handover: the sheath was flushed before anyone aspirated it." } }],
    state: takeOver({ kind: "leg", lesion: { cause: "embolus", siteX: GROIN.bifurcationX - 40 }, onsetAfterMin: 1, report: FOOT }),
  },
  {
    id: "livedo-not-ali",
    title: "Recovery: a painful foot after a femoral case",
    lessonIds: [LIMB],
    seed: "livedo-not-ali",
    access: "femoral",
    start: "recovery",
    site: GROIN,
    indication: "SA",
    profile: { ...CLEAN, sex: "M", ageY: 77, rhythm: "sinus" },
    state: takeOver({ kind: "leg", lesion: { cause: "cholesterol", siteX: GROIN.bifurcationX - 40 }, onsetAfterMin: 1, report: "Recovery nurse: he says his right foot hurts, and the toes look mottled." }),
  },
];
