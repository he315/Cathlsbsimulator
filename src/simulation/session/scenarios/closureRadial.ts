// The full case's radial closure scenarios (access-closure-radial): radial closure as lesson pm-closure-radial
// teaches it (src/content/manual/pci-manual/13-closure.ts: 'Start with the hardest case: a long ACT and a big
// sheath', 'The five steps' and 'When things go wrong at the wrist'), the gripped sheath of pm-engaging-spasm
// and cm-access-complications-radial-other, the band position of cm-access-complications-radial-bleeding, and
// the two late radial problems of cm-access-complications-radial-other at follow-up.
//
// The closure scenarios open at 'closure': the autopilot has put a 6 Fr radial sheath into the right radial
// artery, given the radial heparin, verapamil through the side arm, done the diagnostic study and taken the
// catheter out. The start state then sets the end of the team's case through public session methods (the
// team's work, not the learner's; the ledger is emptied after it), and logs the team's hand-over line last, so
// it is the latest line when the closure screen opens. The follow-up vignettes open on the closure workspace,
// where the follow-up form is: the autopilot plays the case to 'closure', the start state then closes the wrist
// as the team did (an uneventful course: no delayed events, so nothing from the case competes with the late
// problem), takes the band off and presents the patient weeks later.
//
// Every closure scenario but the proximal haematoma (where the team has already taken the sheath out) keeps step 2 of the lesson's five (a vasodilator through the side arm before the
// sheath comes out) in play: each patient's artery is small for its sheath, the patient is anxious and the
// team made several catheter exchanges, so without a fresh vasodilator the sheath grips (the shared spasm
// model, radialSpasm.ts, at MP_RADIAL_CLOSURE.gripAt).
//
// What each scenario sets (scenario settings: MODEL PARAMETERS of the scenario unless cited; none is a
// population value):
//   closure-radial-7fr-act320-gpi  the lesson's hardest case: the end of a PCI through a 7 Fr radial sheath,
//                                  the heparin topped up to the PCI dose (SOURCED_DOSES.pciHeparinUPerKg) so
//                                  the ACT is above 300 s, and a tirofiban infusion running at 0.15 µg/kg/min
//                                  after its 25 µg/kg bolus (pm-antithrombotics, 03-antithrombotics.ts: 'tirofiban:
//                                  25 µg/kg over 3 min, then 0.15 µg/kg/min'): the sheath comes out now, whatever
//                                  the ACT, after the vasodilator;
//   closure-radial-flat-needle     the team's puncture made with the needle almost flat (15 degrees from the skin,
//                                  where the autopilot's pass is nearer 30): the arterial hole lies
//                                  depth / tan(15 degrees), some 12-15 mm, above the skin nick, so a band centred
//                                  on the nick lets the hole bleed into the forearm ('particularly when the needle
//                                  went in at a shallow angle', step 3);
//   closure-radial-spasm-grip      a young, anxious woman with a 2.0 mm artery and a 6 Fr sheath after many
//                                  exchanges; the registrar has already tried to pull the sheath and it would not
//                                  come: release the spasm without traction (vasodilator, sedation, warmth, a
//                                  lubricious solution, the upper-arm cuff above systolic for 5 minutes);
//   closure-radial-proximal-haematoma  the team gave the vasodilator, put the band on at a volume that keeps a
//                                  centred band dry without occluding the artery, but centred it
//                                  PROXIMAL_HAEMATOMA_DISTAL_MM distal to the arterial hole, and took the sheath
//                                  out: the hole bleeds into the forearm just above the band, and the learner takes
//                                  over once the swelling shows (cm-access-complications-radial-bleeding: reposition
//                                  the band over the hole, or a second band against its proximal edge);
//   radial-late-psa                follow-up: a pulsatile lump over the radial puncture (radial pseudoaneurysm);
//   radial-late-granuloma          follow-up: a red, slightly discharging nodule with negative cultures that does
//                                  not pulsate (sterile granuloma; the module's check question).
// Every scenario has a fixed seed, so the drill is the same each time it is opened.
import type { ProcedureScenario } from "./index";
import type { CaseSession } from "../caseSession";
import type { EmergenciesModule } from "../modules/emergencies";
import { MP_BAND_POSITION, bandPressure } from "../../access/closure";

const RADIAL = "pm-closure-radial";
const SPASM = "pm-engaging-spasm";
const OTHER = "cm-access-complications-radial-other";
const BLEEDING = "cm-access-complications-radial-bleeding";
const HEPARIN = "pm-antithrombotics-heparin";

/** The three closure drills' lessons (each keeps the vasodilator-before-removal step and a sheath that can grip). */
const CLOSURE_LESSONS = [RADIAL, SPASM, OTHER];

/** No anticoagulant, no contrast allergy, sinus rhythm: nothing in the chart competes with the drill. */
const CLEAN = { anticoagulation: "none" as const, allergies: { contrast: "none" as const, other: [] }, rhythm: "sinus" as const };

/** closure-radial-7fr-act320-gpi: the ACT the case opens above (s; 'an ACT above 300 seconds', pm-closure-radial). */
const ACT_OPEN_ABOVE_S = 300;
/** closure-radial-7fr-act320-gpi: the ACT the case opens at, at most (s; scenario setting, about the 320 of the scenario's name). */
const ACT_OPEN_AT_MOST_S = 330;
/** Tirofiban bolus (µg/kg) and infusion (µg/kg/min), as the module gives them (03-antithrombotics.ts). */
const TIROFIBAN_BOLUS_UG_KG = 25;
const TIROFIBAN_UG_KG_MIN = 0.15;
/** closure-radial-flat-needle: the team's needle angle from the skin (deg; scenario setting). */
const FLAT_NEEDLE_DEG = 15;
/** Catheter exchanges the team made through the artery during its PCI (scenario setting). */
const TEAM_EXCHANGES = 5;
/** The time the team's PCI took after the diagnostic study (s; scenario setting). */
const TEAM_PCI_S = 60 * 60;
/** closure-radial-proximal-haematoma: how far distal to the arterial hole the team centred the band (mm; scenario setting). */
const PROXIMAL_HAEMATOMA_DISTAL_MM = 8;

const emergencies = (s: CaseSession) => s.mod<EmergenciesModule>("emergencies");

/** The parts of the patient engine a start state uses that the session port does not name. */
type EngineExtras = {
  giveDrug?: (drug: "tirofiban", dose: number, route: "iv") => unknown;
  startInfusion?: (o: { drug: "tirofiban"; rate: number }) => void;
};

/**
 * The learner has the case from here (what the autopilot's steps left open is not scored), then `then` (the
 * team's work), then the team's hand-over line, logged last so it is the latest line when the closure opens.
 */
const takeOver =
  (then?: (s: CaseSession) => void, handOver?: { kind: "nurse" | "attending"; text: string }) =>
  (s: CaseSession): void => {
    emergencies(s)?.actions.learnerControl();
    then?.(s);
    if (handOver) s.handOverNote(handOver.kind, handOver.text);
  };

/** The team's PCI through the radial: the time it took and its catheter exchanges (they count in the artery's tone). */
function teamPci(s: CaseSession): void {
  s.runPending();
  s.addTeamExchanges(TEAM_EXCHANGES);
  s.wait(TEAM_PCI_S, "The PCI");
  s.runPending();
}

/** closure-radial-7fr-act320-gpi: a 7 Fr sheath, the PCI heparin until the ACT is above 300 s, tirofiban running. */
function bigSheathHighAct(s: CaseSession): void {
  s.setTeamSheath("7");
  teamPci(s);
  if (s.order("heparin-pci")) s.runPending();
  // the engine's ACT (truth, not a measurement: nothing is recorded as measured): above the lesson's 300 s, then
  // the rest of the PCI until it has come down to ACT_OPEN_AT_MOST_S
  for (let k = 0; k < 3 && s.patient.vitals().actTrue <= ACT_OPEN_ABOVE_S + 20; k++) {
    if (!s.order("heparin-radial")) break;
    s.runPending();
  }
  for (let k = 0; k < 12 && s.patient.vitals().actTrue > ACT_OPEN_AT_MOST_S; k++) {
    s.wait(300, "The PCI");
    s.runPending();
  }
  const e = s.patient as unknown as EngineExtras;
  e.giveDrug?.("tirofiban", Math.round(TIROFIBAN_BOLUS_UG_KG * s.profile.weightKg), "iv");
  e.startInfusion?.({ drug: "tirofiban", rate: TIROFIBAN_UG_KG_MIN });
  // the pump running a moment before the hand-over, so the session has seen it start
  s.wait(10, "The PCI");
  s.runPending();
}

/** closure-radial-spasm-grip: the registrar's pull, which the sheath did not answer (the team's, before the learner). */
function registrarPull(s: CaseSession): void {
  teamPci(s);
  s.applyBand(14);
  s.runPending();
  s.pullRadialSheath();
}

/**
 * closure-radial-proximal-haematoma: the team's closure with the band centred distal to the hole. The volume is
 * the lowest (in 0.5 mL steps) that keeps a band centred over the hole dry without occluding the artery; the
 * forearm then fills above the band until the swelling shows (MP_BAND_POSITION.visibleSwellingMl).
 */
function bandDistalToHole(s: CaseSession): void {
  teamPci(s);
  if (s.sideArmVasodilator("verapamil")) s.runPending();
  const th = s.bandThresholds();
  let ml = 15;
  for (let v = 4; v <= 20; v += 0.5)
    if (bandPressure(v) >= th.bleedMmHg && bandPressure(v) < th.occludeMmHg) {
      ml = v;
      break;
    }
  const g = s.radialPunctureGeometry();
  s.applyBand(ml, g ? g.holeX - PROXIMAL_HAEMATOMA_DISTAL_MM : undefined);
  s.runPending();
  s.pullRadialSheath();
  for (let k = 0; k < 240 && (s.radial?.forearmMl ?? 0) < MP_BAND_POSITION.visibleSwellingMl; k++) s.tick(5);
}

/** The team's uneventful radial closure (a follow-up's start state): vasodilator, band, sheath out, patent and dry. */
function teamCloseRadial(s: CaseSession): void {
  s.setTeamCourseUneventful();
  if (s.sideArmVasodilator("verapamil")) s.runPending();
  // the closure panel's default inflation, then adjusted from the pleth (as the autopilot's clean technique)
  s.applyBand(15);
  s.runPending();
  s.pullRadialSheath();
  s.runPending();
  for (let k = 0; k < 24; k++) {
    const r = s.plethCheck();
    s.runPending();
    if (!r) break;
    if (r.bleeding) s.setBandVolume((s.radial?.volumeMl ?? 10) + 1);
    else if (r.cls === "D") s.setBandVolume((s.radial?.volumeMl ?? 10) - 1);
    else break;
  }
  s.finishRadialClosure(s.radialBandHours);
  s.runPending();
}

/** The follow-up vignettes: the team closed the wrist, the band came off and the patient comes back weeks later. */
const followUp =
  (kind: "radial-pseudoaneurysm" | "sterile-granuloma") =>
  (s: CaseSession): void => {
    s.runPending();
    if (s.sheath && !s.radial?.sheathOut) teamCloseRadial(s);
    if (s.radial && s.radial.bandOffAt === null) {
      s.observe(Math.ceil((s.radialBandHours * 3600 - (s.tS - (s.radial.sheathOutAt ?? s.tS))) / 60));
      s.runPending();
      s.removeBand();
    }
    s.runPending();
    s.presentRadialLate(kind);
  };

/** A small artery for a 6 or 7 Fr sheath, an anxious patient: the sheath can grip without a fresh vasodilator. */
const TIGHT = { radialDiamMm: 2.1, anxiety: 0.8 };

export const scenarios: ProcedureScenario[] = [
  {
    id: "closure-radial-7fr-act320-gpi",
    title: "Radial closure: a big sheath, a long ACT",
    lessonIds: [...CLOSURE_LESSONS, HEPARIN],
    seed: "closure-radial-7fr-act320-gpi",
    indication: "SA",
    access: "radial-right",
    start: "closure",
    profile: { ...CLEAN, sex: "M", ageY: 52, ...TIGHT },
    state: takeOver(bigSheathHighAct, { kind: "attending", text: "The PCI is finished and no more work is needed through this artery. A tirofiban infusion is running." }),
  },
  {
    id: "closure-radial-flat-needle",
    title: "Radial closure: where is the hole?",
    lessonIds: [...CLOSURE_LESSONS, BLEEDING],
    seed: "closure-radial-flat-needle",
    indication: "SA",
    access: "radial-right",
    start: "closure",
    profile: { ...CLEAN, sex: "F", ageY: 45, ...TIGHT, anxiety: 0.9 },
    state: takeOver(
      (s) => {
        s.setTeamRadialEntry(FLAT_NEEDLE_DEG);
        teamPci(s);
      },
      { kind: "attending", text: "Handover: the registrar got in on the second pass with the needle held almost flat to the skin." },
    ),
  },
  {
    id: "closure-radial-spasm-grip",
    title: "Radial closure: the sheath will not come",
    lessonIds: CLOSURE_LESSONS,
    seed: "closure-radial-spasm-grip",
    indication: "SA",
    access: "radial-right",
    start: "closure",
    profile: { ...CLEAN, sex: "F", ageY: 34, radialDiamMm: 2.0, anxiety: 0.9 },
    state: takeOver(registrarPull, { kind: "attending", text: "Handover: the registrar has put the band on and tried to pull the sheath; it would not come and the patient is in pain." }),
  },
  {
    id: "closure-radial-proximal-haematoma",
    title: "Radial closure: the forearm after the band",
    lessonIds: [RADIAL, BLEEDING],
    seed: "closure-radial-proximal-haematoma",
    indication: "SA",
    access: "radial-right",
    start: "closure",
    profile: { ...CLEAN, sex: "F", ageY: 58 },
    state: takeOver(bandDistalToHole, { kind: "attending", text: "Handover: the registrar put the band on and took the sheath out a few minutes ago. The patient says her forearm aches." }),
  },
  {
    id: "radial-late-psa",
    title: "Radial follow-up: a lump at the wrist (1)",
    lessonIds: [OTHER],
    seed: "radial-late-psa",
    indication: "SA",
    access: "radial-right",
    start: "closure",
    profile: { ...CLEAN, sex: "M", ageY: 71 },
    state: followUp("radial-pseudoaneurysm"),
  },
  {
    id: "radial-late-granuloma",
    title: "Radial follow-up: a lump at the wrist (2)",
    lessonIds: [OTHER],
    seed: "radial-late-granuloma",
    indication: "SA",
    access: "radial-right",
    start: "closure",
    profile: { ...CLEAN, sex: "F", ageY: 63 },
    state: followUp("sterile-granuloma"),
  },
];
