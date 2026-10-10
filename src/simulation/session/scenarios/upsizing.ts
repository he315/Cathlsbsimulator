// The full case's upsizing, sheath preparation and femoral angiogram scenarios
// (access-femoral-upsizing-angiogram): Brilakis 4.2, steps 9-15, and the troubleshooting table of
// pm-access-troubleshoot, as src/content/manual/pci-manual/05-access.ts gives them, with the sheath
// preparation of pm-to-the-root-table (src/content/manual/pci-manual/06-to-the-root.ts).
//
// Each opens at the 'access' stage (chart, consent, time-out and local anaesthetic done by the
// autopilot) and then sets its start state through public session methods (the team's work, not the
// learner's; the ledger is emptied after it):
//   micro-wire in   the 21 G needle in the common femoral artery over the femoral head, the
//                   0.018 inch micro-wire fed and screened running up the iliac artery: the
//                   learner nicks, upsizes, inserts and prepares the sheath and takes the angiogram;
//   sheath in       the same, upsized by the team to a 10 cm sheath over a 0.035 inch wire left in
//                   the aorta, aspirated and flushed but not transduced: the learner checks the
//                   waveform, takes the angiogram in the view they choose and reports it;
//   radial sheath   a radial sheath just in, neither aspirated nor flushed.
//
// What each scenario sets (scenario settings, MODEL PARAMETERS of the scenario unless cited; none is
// a population value). Site x is mm along the limb from the inguinal crease, positive towards the
// heart; the femoral head has the site model's 24 mm radius.
//   fem-upsizing           the standard groin; nothing goes wrong;
//   fem-obese-scar         a BMI of about 41 with a groin scarred by earlier femoral procedures: the
//                          micropuncture dilator will not pass (scar); nick or enlarge the nick, or a
//                          stiffer dilator (Brilakis 4.2, in the troubleshooting table);
//   fem-kinked-micro-wire  a BMI of about 41: the 0.018 inch wire kinks at the arterial entry and the
//                          dilator will not pass ('A kinked wire at the entry point is common in obese
//                          patients', the module's check); pull it back and re-advance, or cut the kink;
//   fem-poor-track         the sheath will not advance through an unprepared track: nick and spread it
//                          with a haemostat;
//   fem-wire-kinks         the standard 0.035 inch wire kinks as the sheath is pushed: sheath out and
//                          exchange through a dilator for a stiff wire;
//   fem-subintimal-sheath  the sheath goes in without resistance but lies subintimally: a damped side
//                          arm, and nothing to be injected through it; change site (Brilakis 5.2);
//   fem-angio-high         sheath in, entering about 4 mm above the lowest point of the inferior epigastric
//                          artery, over the upper half of the femoral head ('Entry above the lowest
//                          point of the inferior epigastric artery is a high stick', pm-closure-plan);
//                          the ligament is set above the entry so the lab's ligament model does not
//                          call it out before the learner reads the angiogram;
//   fem-angio-below-bif    sheath in, entering the common femoral artery just above a high bifurcation
//                          over the femoral head, within the 3 mm the site model counts as at the
//                          bifurcation (a low stick on the angiogram);
//   radial-sheath-prep     the right radial artery, a 6 Fr sheath just in.
// Every femoral scenario is an elective case for stable angina with a fixed seed.
import type { ProcedureScenario } from "./index";
import type { CaseSession } from "../caseSession";
import { PRE_PUNCTURE_CHECKLIST } from "../planning";

const SHEATH = "pm-access-femoral-sheath";
const TROUBLE = "pm-access-troubleshoot";
const TABLE = "pm-to-the-root-table";
const RADIAL_SHEATH = "pm-access-radial-sheath";

/** The standard groin of these scenarios (as fem-normal's). */
const GROIN = { ligamentX: 66, headX: 30, bifurcationX: -4 };

/** The planning module's checklist actions, as far as these start states use them (structural: no value import of the module). */
interface ChecklistActions {
  actions?: { confirmCheck?: (id: string) => boolean; giveOxygen?: () => boolean; checklistDone?: () => boolean };
}

/**
 * Where the policy requires the time-out (supervised and exam), the planning module refuses the needle until
 * Oxford's pre-puncture checklist is confirmed: the team confirms it for its own puncture (oxygen first when the
 * oximetry does not allow it). The ledger is emptied after the start state.
 */
function teamChecklist(s: CaseSession): void {
  const a = (s.mod("planning") as ChecklistActions | undefined)?.actions;
  if (!s.policy.timeOutRequired || !a?.confirmCheck || a.checklistDone?.()) return;
  for (const c of PRE_PUNCTURE_CHECKLIST) {
    s.runPending();
    if (!a.confirmCheck(c.id) && a.giveOxygen?.()) {
      s.runPending();
      s.wait(120, "Oxygen");
      s.runPending();
      a.confirmCheck(c.id);
    }
  }
  s.runPending();
}

/**
 * The needle in the target artery at site x (default the middle of the recommended window) at the site's typical
 * angle, advanced to an arterial flash and a little further, and the access wire fed and running free. At the
 * groin the wire is screened. Public session methods only.
 */
function needleAndWire(s: CaseSession, x?: number): boolean {
  const site = s.site;
  const art = site.tubes.find((t) => t.id === site.arteryId);
  if (!art) return false;
  const at = x ?? (site.landmarks.targetFrom + site.landmarks.targetTo) / 2;
  const th = (site.typicalAngleDeg * Math.PI) / 180;
  const z = art.zRef + art.dz * (at - art.xRef);
  const y = art.yRef + art.dy * (at - art.xRef);
  const L = z / Math.sin(th);
  teamChecklist(s);
  if (!s.placeNeedle({ entryX: at - L * Math.cos(th), entryY: y, angleDeg: site.typicalAngleDeg, yawDeg: 0 })) return false;
  for (let mm = 0; mm < 80 && s.flashback().kind !== "arterial"; mm += 0.2) s.advanceNeedle(0.2);
  if (s.flashback().kind !== "arterial") return false;
  s.advanceNeedle(0.6);
  s.advanceAccessWire(5);
  s.advanceAccessWire(30);
  s.runPending();
  if (s.pm.st.wire?.state !== "intraluminal") return false;
  if (site.kind === "femoral") s.noteFluoroscopy("groin");
  return true;
}

/** fem-angio-*: the team's upsizing to a 10 cm sheath over a 0.035 inch wire, aspirated and flushed (not transduced). */
function sheathInOver035(s: CaseSession, x?: number): void {
  if (!needleAndWire(s, x)) return;
  const steps: (() => boolean)[] = [
    () => s.skinNick(),
    () => s.removeNeedle(),
    () => s.insertMicroDilator(),
    () => s.removeInnerDilator(),
    () => s.insertWire035("standard"),
    () => s.removeDilator(),
    () => s.insertSheath("6", 10),
    () => s.aspirateSheath(),
    () => s.flushSheathSide("fresh"),
  ];
  for (const step of steps) {
    if (!step()) return;
    s.runPending();
  }
}

/** The start state of the upsizing drills: the micro-wire in and screened, the needle still in. */
const microWireIn = (s: CaseSession) => void needleAndWire(s);

/** The start state of radial-sheath-prep: a 6 Fr radial sheath just in, not aspirated or flushed. */
function radialSheathIn(s: CaseSession): void {
  if (!needleAndWire(s)) return;
  if (!s.removeNeedle()) return;
  s.insertSheath("6");
  s.runPending();
}

/**
 * fem-angio-below-bif: the needle is aimed at the centre line this far above a high bifurcation (mm); the wire
 * enters the lumen a few mm short of the aim, within the site model's 3 mm 'at the bifurcation'.
 */
const BELOW_BIF_AIM_ABOVE_MM = 5;
const HIGH_BIF_X = 22;
/**
 * fem-angio-high: the needle aimed at site x 56, so the wire enters at about 52, some 4 mm above the lowest point of
 * the inferior epigastric artery set at 48, below the ligament model's high-stick line (ligament 62 less 5 mm).
 */
const HIGH_AIM_X = 56;
const HIGH_IEA_X = 48;

const ELECTIVE = { indication: "SA" as const, access: "femoral" as const, start: "access" as const };

/** A BMI of about 41 (the module's obese-groin check: 'In a patient with a BMI of 41'). */
const OBESE = { sex: "F" as const, heightCm: 165, weightKg: 112 };
const SCARRED_HISTORY = "Two previous femoral angiograms through the right groin, the last closed with a closure device; the groin is firm and scarred.";

export const scenarios: ProcedureScenario[] = [
  {
    id: "fem-upsizing",
    title: "Femoral sheath: upsize, prepare and image",
    lessonIds: [SHEATH, TROUBLE, TABLE],
    seed: "fem-upsizing",
    ...ELECTIVE,
    site: GROIN,
    state: microWireIn,
  },
  {
    id: "fem-obese-scar",
    title: "Femoral sheath: the dilator will not pass (1)",
    lessonIds: [SHEATH, TROUBLE, TABLE],
    seed: "fem-obese-scar",
    ...ELECTIVE,
    profile: OBESE,
    chart: { history: SCARRED_HISTORY },
    site: GROIN,
    script: [{ at: "arrival", run: (s) => s.scriptUpsizing({ resistance: ["scar"] }) }],
    state: microWireIn,
  },
  {
    id: "fem-kinked-micro-wire",
    title: "Femoral sheath: the dilator will not pass (2)",
    lessonIds: [SHEATH, TROUBLE, TABLE],
    seed: "fem-kinked-micro-wire",
    ...ELECTIVE,
    profile: OBESE,
    site: GROIN,
    script: [{ at: "arrival", run: (s) => s.scriptUpsizing({ resistance: ["kinked-micro-wire"] }) }],
    state: microWireIn,
  },
  {
    id: "fem-poor-track",
    title: "Femoral sheath: the sheath will not advance",
    lessonIds: [TROUBLE, SHEATH],
    seed: "fem-poor-track",
    ...ELECTIVE,
    site: GROIN,
    script: [{ at: "arrival", run: (s) => s.scriptUpsizing({ resistance: ["poor-track"] }) }],
    state: microWireIn,
  },
  {
    id: "fem-wire-kinks",
    title: "Femoral sheath: the wire bends as the sheath goes in",
    lessonIds: [TROUBLE, SHEATH],
    seed: "fem-wire-kinks",
    ...ELECTIVE,
    site: GROIN,
    script: [{ at: "arrival", run: (s) => s.scriptUpsizing({ resistance: ["wire-kink-035"] }) }],
    state: microWireIn,
  },
  {
    id: "fem-subintimal-sheath",
    title: "Femoral sheath: check it before you use it",
    lessonIds: [TROUBLE, SHEATH],
    seed: "fem-subintimal-sheath",
    ...ELECTIVE,
    site: GROIN,
    script: [{ at: "arrival", run: (s) => s.scriptUpsizing({ resistance: ["subintimal-sheath"] }) }],
    state: microWireIn,
  },
  {
    id: "fem-angio-high",
    title: "Femoral angiogram: where did it go in? (1)",
    lessonIds: [SHEATH],
    seed: "fem-angio-high",
    ...ELECTIVE,
    site: { ligamentX: 62, headX: 30, bifurcationX: -4, ieaOriginX: HIGH_IEA_X },
    state: (s) => sheathInOver035(s, HIGH_AIM_X),
  },
  {
    id: "fem-angio-below-bif",
    title: "Femoral angiogram: where did it go in? (2)",
    lessonIds: [SHEATH],
    seed: "fem-angio-below-bif",
    ...ELECTIVE,
    site: { ligamentX: 66, headX: 30, bifurcationX: HIGH_BIF_X },
    state: (s) => sheathInOver035(s, HIGH_BIF_X + BELOW_BIF_AIM_ABOVE_MM),
  },
  {
    id: "radial-sheath-prep",
    title: "Radial sheath: clear it before the catheter",
    lessonIds: [TABLE, RADIAL_SHEATH],
    seed: "radial-sheath-prep",
    indication: "SA",
    access: "radial-right",
    start: "access",
    state: radialSheathIn,
  },
];
