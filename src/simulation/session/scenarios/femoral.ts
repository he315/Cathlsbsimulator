// The full case's femoral puncture scenarios (access-femoral-puncture): the Brilakis femoral sequence
// before the sheath (Brilakis 4.2, steps 3-8; pm-access-femoral-puncture and pm-access-femoral-sheath).
// Each opens ready to puncture (chart, consent, time-out and local anaesthetic done by the autopilot),
// so the learner starts at the femoral head marker on AP fluoroscopy, scans the common femoral artery
// on ultrasound and punctures; nothing is marked for them.
//
// What each scenario sets (scenario settings, MODEL PARAMETERS of the scenario unless cited; none is a
// population value). Site x is mm along the limb from the inguinal crease, positive towards the heart;
// the femoral head has the site model's 24 mm radius, so its lower edge lies 24 mm below headX.
//   fem-normal              the textbook groin: the bifurcation just below the crease (it lies over the
//                           crease in about three quarters of patients, SOURCED_SITE, facts/C5.md), the
//                           head centred 30 mm above the crease;
//   fem-high-bif            a high bifurcation over the femoral head ('including a high bifurcation over
//                           the femoral head', lab request pm-access#1): bifurcation 6 mm above the head
//                           centre, so a puncture at the head centre is below it (low);
//   fem-calcified-anterior  anterior-wall calcium over the upper half of the head (Brilakis 4.2, step 4:
//                           'clear of calcium'); the clear stretch is over the lower half;
//   fem-deep-4cm            the CFA's near wall 40 mm deep at the crease in an obese man, and
//   fem-shallow-2cm         20 mm deep in a lean woman: Brilakis 4.2, step 6, 'for an artery about 2 cm
//                           deep, enter at about 45 degrees; for one about 4 cm deep, keep the 45 degree
//                           angle and move the skin entry further down the leg';
//   fem-plugged-needle      the needle is plugged (scripted): no blood at the hub until it is taken out
//                           and flushed (Brilakis 4.2.6.3, 'needle plugged');
//   fem-micro-wire-iea      the first micro-wire turns medially into the inferior epigastric artery,
//   fem-micro-wire-lcia     laterally into the lateral circumflex iliac artery, or
//   fem-micro-wire-down-leg runs down the leg (scripted; Brilakis 4.2, steps 7 and 8). The branch origins
//                           are set 20-25 mm above the middle of the puncture window so a wire fed to the
//                           usual length reaches them; the scripted turn is used once, and a wire pulled
//                           back below the turn goes up the artery when advanced again;
//   fem-entry-below-head    opens with the needle in and the micro-wire running free from an entry 6 mm
//                           below the lower edge of the femoral head (the team's puncture): the learner
//                           screens it, sees the entry below the head, removes wire and needle, presses
//                           and punctures again (Brilakis 4.2, step 8). The start state runs as the
//                           team's (session.teamSetup): the planning module counts Oxford's
//                           pre-puncture checklist as done by the team, so the scenario opens the same
//                           in supervised and exam mode as in guided (repair-session-flow).
// Every scenario is an elective case for stable angina (no acute coronary syndrome running its own
// course) with a fixed seed, so the drill is the same each time it is opened.
import type { ProcedureScenario } from "./index";
import type { CaseSession } from "../caseSession";

const PUNCTURE = "pm-access-femoral-puncture";
const SELDINGER = "pm-access-seldinger";
const SHEATH = "pm-access-femoral-sheath";

/** fem-entry-below-head: how far below the head's lower edge the team's entry lies (mm; scenario setting). */
const BELOW_HEAD_MM = 6;

/** The start state of fem-entry-below-head: needle in the CFA below the femoral head, the micro-wire fed and running free. */
function wireInBelowTheHead(s: CaseSession): void {
  const site = s.site;
  const edge = site.landmarks.headFrom;
  const art = site.tubes.find((t) => t.id === site.arteryId);
  if (edge === undefined || !art) return;
  const x = edge - BELOW_HEAD_MM;
  // the centre line at x, reached at 45 degrees (the site's typical angle)
  const th = (site.typicalAngleDeg * Math.PI) / 180;
  const z = art.zRef + art.dz * (x - art.xRef);
  const y = art.yRef + art.dy * (x - art.xRef);
  const L = z / Math.sin(th);
  if (!s.placeNeedle({ entryX: x - L * Math.cos(th), entryY: y, angleDeg: site.typicalAngleDeg, yawDeg: 0 })) return;
  for (let mm = 0; mm < 80 && s.flashback().kind !== "arterial"; mm += 0.2) s.advanceNeedle(0.2);
  s.advanceNeedle(0.6);
  s.advanceAccessWire(5);
  s.advanceAccessWire(30);
  s.runPending();
  // the scripted pass is not the learner's: their own first skin pass is the one the head marker is scored at
  s.activeSite.firstPassAt = null;
}

const ELECTIVE = { indication: "SA" as const, access: "femoral" as const, start: "access" as const };

export const scenarios: ProcedureScenario[] = [
  {
    id: "fem-normal",
    title: "Femoral puncture: the standard groin",
    lessonIds: [PUNCTURE, SELDINGER, SHEATH],
    seed: "fem-normal",
    ...ELECTIVE,
    site: { ligamentX: 66, headX: 30, bifurcationX: -4 },
  },
  {
    id: "fem-high-bif",
    title: "Femoral puncture: where does it divide?",
    lessonIds: [PUNCTURE, SELDINGER, SHEATH],
    seed: "fem-high-bif",
    ...ELECTIVE,
    site: { ligamentX: 70, headX: 30, bifurcationX: 36 },
  },
  {
    id: "fem-calcified-anterior",
    title: "Femoral puncture: a calcified common femoral artery",
    lessonIds: [PUNCTURE, SELDINGER, SHEATH],
    seed: "fem-calcified-anterior",
    ...ELECTIVE,
    site: { ligamentX: 66, headX: 30, bifurcationX: -4, calcium: [{ fromX: 26, toX: 50 }] },
  },
  {
    id: "fem-deep-4cm",
    title: "Femoral puncture: a deep artery",
    lessonIds: [PUNCTURE],
    seed: "fem-deep-4cm",
    ...ELECTIVE,
    profile: { sex: "M", heightCm: 175, weightKg: 122 },
    site: { ligamentX: 66, headX: 30, bifurcationX: -4, nearWallMm: 40 },
  },
  {
    id: "fem-shallow-2cm",
    title: "Femoral puncture: a lean groin",
    lessonIds: [PUNCTURE],
    seed: "fem-shallow-2cm",
    ...ELECTIVE,
    profile: { sex: "F", heightCm: 165, weightKg: 58 },
    site: { ligamentX: 66, headX: 30, bifurcationX: -4, nearWallMm: 20 },
  },
  {
    id: "fem-plugged-needle",
    title: "Femoral puncture: no blood at the hub",
    lessonIds: [PUNCTURE, SELDINGER],
    seed: "fem-plugged-needle",
    ...ELECTIVE,
    site: { ligamentX: 66, headX: 30, bifurcationX: -4 },
    script: [{ at: "arrival", run: (s) => s.scriptAccess({ needlePlugged: true }) }],
  },
  {
    id: "fem-micro-wire-iea",
    title: "Micropuncture wire: where is it going? (1)",
    lessonIds: [SHEATH, SELDINGER],
    seed: "fem-micro-wire-iea",
    ...ELECTIVE,
    site: { ligamentX: 60, headX: 28, bifurcationX: -5, ieaOriginX: 50 },
    script: [{ at: "arrival", run: (s) => s.scriptAccess({ microWireCourse: "iea" }) }],
  },
  {
    id: "fem-micro-wire-lcia",
    title: "Micropuncture wire: where is it going? (2)",
    lessonIds: [SHEATH, SELDINGER],
    seed: "fem-micro-wire-lcia",
    ...ELECTIVE,
    site: { ligamentX: 60, headX: 28, bifurcationX: -5, lciaOriginX: 52 },
    script: [{ at: "arrival", run: (s) => s.scriptAccess({ microWireCourse: "lcia" }) }],
  },
  {
    id: "fem-micro-wire-down-leg",
    title: "Micropuncture wire: where is it going? (3)",
    lessonIds: [SHEATH, SELDINGER],
    seed: "fem-micro-wire-down-leg",
    ...ELECTIVE,
    site: { ligamentX: 66, headX: 30, bifurcationX: 4 },
    script: [{ at: "arrival", run: (s) => s.scriptAccess({ microWireCourse: "down-leg" }) }],
  },
  {
    id: "fem-entry-below-head",
    title: "Micropuncture wire in: screen it before the sheath",
    lessonIds: [SHEATH],
    seed: "fem-entry-below-head",
    ...ELECTIVE,
    site: { ligamentX: 64, headX: 38, bifurcationX: -20 },
    state: wireInBelowTheHead,
  },
];
