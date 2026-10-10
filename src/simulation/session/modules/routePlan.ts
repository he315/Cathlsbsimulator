// ---------------------------------------------------------------------------
// Full-case session module 'route-plan' (access-route-decision).
//
// Before access the learner examines the pulses (radial, ulnar, femoral and
// foot, both sides), can measure the radial artery on ultrasound (the
// calipers of UltrasoundView), reads the patient card and plans the route by
// Brilakis's five steps (src/simulation/access/siteChoice.ts): the site
// (right or left radial, distal radial, ulnar or femoral), the sheath size,
// type and length, the fallback site, and for a wrist site the spasm plan
// (sedation and local before the puncture, verapamil and/or nitroglycerin
// after the sheath).
//   - The plan drives the case's planned access: choosing a site calls
//     session.setAccess (the planned-access picker, AccessPicker.tsx, is
//     locked and shows the plan; another site is opened through the
//     crossover control once the planned site is punctured). Ulnar and distal
//     radial sites run through the radial route of their arm (siteChoice
//     PLAN_SITES[].labNote). The left groin cannot yet be the planned site:
//     CaseSession.setAccess takes no side, so LEFT_GROIN_PLANNABLE is false,
//     setPlan refuses it as the first site and the plan section offers it
//     only as a fallback (a crossover site once the case is under way). When
//     the session takes a side the flag turns true (a test pins it to what
//     the session does) and moveAccess asks for the left groin.
//   - confirm() scores the plan in the ledger (site, sheath, fallback, spasm
//     plan, pulses examined first); the plan can be changed and confirmed
//     again until the first skin puncture, which locks it. A puncture without
//     a confirmed plan is scored as such.
//   - The spasm plan is carried out with the session's own orders; at the
//     catheter's first pass up the arm what was done is scored (sedation and
//     local before the puncture, a vasodilator after the sheath). The plan's
//     ticks themselves change nothing in the simulation: an item skipped in
//     practice already raises spasm through the session's existing spasm
//     inputs (no sedation, no local, no vasodilator), so a planned item not
//     given counts as not given, and the plan section says each is given from
//     the orders panel (the design's 'skipped items raise the spasm inputs',
//     read without counting a skipped item twice). A sheath large for the
//     radial artery drives spasm while the wire is in the arm, the condition
//     under which the session relaxes spasm (siteChoice.sheathSpasmDrivePerS,
//     a MODEL PARAMETER).
//   - Monitoring (pm-monitoring-watch): inspectSite() looks at and feels the
//     active site; a haematoma at or above MP_ROUTE_PLAN.palpableHaematomaMl
//     is found and raises 'haematoma' for the rest of the case (nothing else
//     shows it before it is large enough to see). After closure the pulses
//     at and beyond every used site are felt again; the start pulses
//     (startPulses()) are the ones examined before access, for the
//     hand-over's comparison.
//
// A case opened past the chart (the autopilot played it) had its route
// planned by the team: the plan is the planned access, nothing is scored.
// The card comes from the patient (siteChoice.cardFromPatient), the chart's
// history (a LIMA graft, a weak right radial pulse), the pre-procedure record
// (a closure device or a dialysis fistula, modules/planning.ts) and the
// scenario's card (scenarios/routes.ts ROUTE_CARDS). A route scenario that
// holds a recent closure device makes it the record's planted problem, so the
// record, the ultrasound and the closure refusal all agree.
//
// The chart section src/ui/access/chart/PlanAccess.tsx shows the card, the
// pulses, the plan and the confirmation; nothing on it says which choice is
// right. Imports CaseSession as a type only (modules/index.ts).
//
// The module hears route changes made elsewhere (the store's picker, the
// autopilot) by wrapping session.setAccess on the instance for the life of
// the attachment. CaseSession has no 'access changed' hook yet; when it gains
// one this wrapper should subscribe to it instead (a follow-up for the
// caseSession owner).
// ---------------------------------------------------------------------------

import type { LabEvent } from "../../../content/lab/tips";
import type { LabRaises } from "../../../content/lab/raisable/waiting";
import type { AccessRoute } from "../../../types";
import type { CaseSession, SiteSide } from "../caseSession";
import type { SessionHook } from "../scenarios/index";
import type { CaseSessionModule } from "./index";
import type { SheathId } from "../../access/closure";
import type { SheathLengthCm } from "../../access/upsizing";
import {
  PLAN_SITE_BY_ID,
  PULSE_SITES,
  applyCardOverrides,
  cardFromPatient,
  decideRoute,
  defaultPlan,
  frsFor,
  isPlanSiteId,
  lengthsFor,
  planSiteOfRoute,
  pulseLabel,
  pulseWords,
  pulsesForSite,
  scoreRoutePlan,
  sheathOdMm,
  sheathSpasmDrivePerS,
  siteName,
  spasmPatientFactors,
  type PlanSiteId,
  type PulseFinding,
  type PulseSiteId,
  type RouteCard,
  type RoutePlan,
  type RouteScore,
  type Side,
} from "../../access/siteChoice";
import { ROUTE_CARDS } from "../scenarios/routes";
import { buildPlanningRecord, recordItems } from "../planning";
import { planningOf } from "./planning";
import { haematomaCm } from "../../access/closure";
import { MP_COMPRESSION } from "../../access/compression";

export const ROUTE_PLAN_MODULE_ID = "route-plan";

/**
 * MODEL PARAMETERS (session settings): how long each step takes, s, and the haematoma that inspection
 * and palpation find (below the size the drapes show, MP_COMPRESSION.visibleHaematomaMl, which is also
 * the line for a haematoma found 'while small').
 */
export const MP_ROUTE_PLAN = {
  palpateS: 5,
  inspectS: 15,
  confirmS: 10,
  palpableHaematomaMl: 5,
};

/**
 * Whether the left groin can be the planned site. CaseSession.setAccess takes no side yet (see the
 * header); a test pins this flag to what the session does, so it is turned on when the session can.
 */
export const LEFT_GROIN_PLANNABLE = false;

/** Whether a plan site can be the case's planned (first) site in this lab. */
export const plannableSite = (id: PlanSiteId): boolean => id !== "femoral-left" || LEFT_GROIN_PLANNABLE;

const NO_EVENTS: readonly LabEvent[] = Object.freeze([]);

/** The events this module reports (a haematoma found by inspection). */
export const ROUTE_PLAN_EVENTS = ["haematoma"] as const satisfies readonly LabEvent[];

/** What this module can report (the reachability report reads it). */
export const raises: readonly LabRaises[] = [{ lab: "access", phases: [], events: ROUTE_PLAN_EVENTS }];

/** The ids of the decisions this module records (all start with 'route-'). */
export const ROUTE_PLAN_DECISIONS = ["route-plan-site", "route-plan-sheath", "route-plan-fallback", "route-plan-spasm", "route-pulses-before", "route-spasm-prevention", "route-site-monitored", "route-pulses-end"] as const;

export type PulsePhase = "before" | "during" | "after";

export interface PulseRecord {
  id: PulseSiteId;
  finding: PulseFinding;
  t: number;
  phase: PulsePhase;
}

export interface RoutePlanState {
  card: RouteCard;
  /** the plan as it stands (the draft until confirmed; locked at the first puncture) */
  plan: RoutePlan;
  /** session time the plan was last confirmed */
  confirmedAt: number | null;
  /** the plan was changed after its last confirmation */
  changedSinceConfirm: boolean;
  /** the first skin puncture has happened: the plan no longer changes */
  locked: boolean;
  /** the case opened past the chart: the team planned the route (nothing is scored) */
  planByTeam: boolean;
  /** every pulse felt, in order */
  pulses: PulseRecord[];
  /** radial diameters measured with the ultrasound calipers, mm */
  radialUs: Partial<Record<Side, number>>;
  /** each look at and feel of the access site */
  inspections: { t: number; siteId: string; found: boolean; text: string }[];
  /** the haematoma found by inspection */
  haematoma: { siteId: string; t: number; ml: number } | null;
  /** the largest haematoma each site has had, mL (truth, for the debrief) */
  maxHaematomaMl: Record<string, number>;
  /** a left femoral plan the session could not make the planned site (see the header) */
  leftGroinPending: boolean;
  /** the last finding or answer (shown under the plan) */
  note: string | null;
}

export interface RoutePlanModule extends CaseSessionModule {
  id: typeof ROUTE_PLAN_MODULE_ID;
  readonly state: RoutePlanState;
  actions: {
    /** feel one pulse: the finding, or null when refused (busy) */
    palpate: (id: PulseSiteId) => PulseFinding | null;
    /** feel every pulse in turn */
    palpateAll: () => boolean;
    /** record a radial diameter measured with the ultrasound calipers */
    measureRadial: (side: Side, mm: number) => boolean;
    /** change the plan (refused once locked); a new site moves the planned access */
    setPlan: (patch: Partial<RoutePlan>) => boolean;
    /** confirm the plan: it is scored in the ledger */
    confirm: () => RouteScore | null;
    /** look at and feel the active access site */
    inspectSite: () => string | null;
    /** what the pulse is now (truth) */
    pulseNow: (id: PulseSiteId) => PulseFinding;
    /** the pulses examined before access, latest per site (for the hand-over) */
    startPulses: () => PulseRecord[];
    /** the pulses felt after closure, latest per site */
    endPulses: () => PulseRecord[];
    /** the plan scored against the card (truth, for the debrief and tests) */
    score: () => RouteScore;
    /** the lab's sheath and length nearest the plan (the ultrasound view's default) */
    plannedSheath: () => { id: SheathId; lengthCm: SheathLengthCm };
  };
}

const round1 = (x: number) => Math.round(x * 10) / 10;
const lc = (t: string) => t[0].toLowerCase() + t.slice(1);

/** The route-plan module of a session, if attached. */
export function routePlanOf(s: Pick<CaseSession, "mod">): RoutePlanModule | undefined {
  return s.mod<RoutePlanModule>(ROUTE_PLAN_MODULE_ID);
}

/** The lab sheath nearest a plan: the catalogue has 5, 6, 6 thin-walled and 7 Fr (closure.ts SHEATHS). */
export function labSheathFor(plan: Pick<RoutePlan, "sheathFr" | "sheathType" | "lengthCm" | "site">): { id: SheathId; lengthCm: SheathLengthCm } {
  const id: SheathId = plan.sheathFr <= 5 ? "5" : plan.sheathFr === 6 ? (plan.sheathType === "thin" ? "6-thin" : "6") : "7";
  const femoral = !PLAN_SITE_BY_ID[plan.site].wrist;
  const lengthCm: SheathLengthCm = femoral && (plan.lengthCm === 25 || plan.lengthCm === 45) ? plan.lengthCm : 10;
  return { id, lengthCm };
}

/** A size or length the plan's site does not offer moves to the nearest it does (in place). */
export function fitToSite(plan: RoutePlan): RoutePlan {
  const lengths = lengthsFor(plan.site);
  if (!lengths.includes(plan.lengthCm)) plan.lengthCm = lengths[0];
  const frs = frsFor(plan.site);
  if (!frs.includes(plan.sheathFr)) plan.sheathFr = frs.reduce((a, b) => (Math.abs(b - plan.sheathFr) < Math.abs(a - plan.sheathFr) ? b : a));
  return plan;
}

/** The card for this session: the patient, the chart, the pre-procedure record and the scenario. */
export function buildRouteCard(s: CaseSession): RouteCard {
  const c = cardFromPatient(s.profile);
  const hist = s.chart.history?.text ?? "";
  if (/left internal mammary artery/i.test(hist)) c.cabg = { lima: true, rima: false, veinGrafts: /vein graft/i.test(hist) };
  if (/weak right radial pulse/i.test(hist)) c.pulses["radial-right"] = "weak";
  const f = planningOf(s)?.state.record.facts;
  if (f?.closureDevice) c.recentPlug = { side: f.closureDevice.side, daysAgo: f.closureDevice.daysAgo };
  if (f?.fistulaArm) c.fistulaArm = f.fistulaArm;
  return applyCardOverrides(c, ROUTE_CARDS[s.scenario.id]);
}

export function createSessionModule(): RoutePlanModule {
  let s: CaseSession;
  let st: RoutePlanState;
  /** set while the module itself moves the planned access */
  let moving = false;
  let preventionScored = false;
  let endScored = false;

  const now = () => round1(s.tS);
  const logAction = (text: string) => s.log.push({ t: now(), kind: "action", text });
  const logResult = (text: string) => s.log.push({ t: now(), kind: "result", text });
  const scored = () => !st.planByTeam;
  const phase = (): PulsePhase => (s.closureDone() ? "after" : s.hookAt.puncture === undefined ? "before" : "during");

  /** Where the pulse is now: the card, less what the case has done to it. */
  const pulseNow = (id: PulseSiteId): PulseFinding => {
    const [artery, side] = id.split("-") as [string, Side];
    let f = st.card.pulses[id];
    for (const x of s.sites) {
      if (x.side !== side) continue;
      if (artery === "radial" && x.siteKind === "radial" && x.closure.radialOccluded === true) f = "absent";
    }
    if (artery === "pedal" && f === "normal" && s.complications.some((c) => c.id === "distal-pulses-reduced") && s.sites.some((x) => x.siteKind === "femoral" && x.side === side)) f = "weak";
    return f;
  };

  const latest = (ph: PulsePhase) => {
    const m = new Map<PulseSiteId, PulseRecord>();
    for (const p of st.pulses) if (p.phase === ph) m.set(p.id, p);
    return PULSE_SITES.filter((id) => m.has(id)).map((id) => m.get(id)!);
  };

  const feel = (id: PulseSiteId): PulseFinding => {
    const finding = pulseNow(id);
    st.pulses.push({ id, finding, t: now(), phase: phase() });
    return finding;
  };

  const palpate = (id: PulseSiteId): PulseFinding | null => {
    if (s.busy || !PULSE_SITES.includes(id)) return null;
    const f = feel(id);
    s.wait(MP_ROUTE_PLAN.palpateS, `Feeling the ${lc(pulseLabel(id))} pulse`);
    st.note = `${pulseLabel(id)} pulse: ${pulseWords(f)}.`;
    logResult(st.note);
    checkEndPulses();
    return f;
  };

  const palpateAll = (): boolean => {
    if (s.busy) return false;
    const found = PULSE_SITES.map((id) => `${lc(pulseLabel(id)).replace(/ \(.*\)$/, "")} ${pulseWords(feel(id))}`);
    s.wait(MP_ROUTE_PLAN.palpateS * PULSE_SITES.length, "Feeling the pulses");
    st.note = `Pulses: ${found.join("; ")}.`;
    logResult(st.note);
    checkEndPulses();
    return true;
  };

  const measureRadial = (side: Side, mm: number): boolean => {
    if (!(mm > 0) || !Number.isFinite(mm)) return false;
    st.radialUs[side] = Math.round(mm * 100) / 100;
    st.note = `${side === "right" ? "Right" : "Left"} radial artery on ultrasound: ${st.radialUs[side]!.toFixed(1)} mm.`;
    logResult(st.note);
    return true;
  };

  /** Move the planned access to a plan site's route (before the first puncture). */
  const moveAccess = (id: PlanSiteId): void => {
    const p = PLAN_SITE_BY_ID[id];
    const want = p.route;
    const cur = s.sites[0];
    const curSide: Side = cur.side;
    if (want === s.access && (want !== "femoral" || curSide === p.side)) {
      st.leftGroinPending = false;
      return;
    }
    moving = true;
    try {
      if (want === "femoral" && p.side === "left") {
        // CaseSession.setAccess takes no side yet (see the header): the side is passed for when it does
        (s.setAccess as (a: AccessRoute, side?: SiteSide) => boolean).call(s, "femoral", "left");
        st.leftGroinPending = s.sites[0].side !== "left";
      } else {
        s.setAccess(want);
        st.leftGroinPending = false;
      }
    } finally {
      moving = false;
    }
  };

  const setPlan = (patch: Partial<RoutePlan>): boolean => {
    if (st.locked || s.busy) return false;
    const next: RoutePlan = { ...st.plan, ...patch, spasm: { ...st.plan.spasm, ...(patch.spasm ?? {}) } };
    if (!isPlanSiteId(next.site) || (next.fallback !== null && !isPlanSiteId(next.fallback))) return false;
    if (next.site !== st.plan.site && !plannableSite(next.site)) return false;
    // a size or length the new site does not offer moves to the nearest it does
    fitToSite(next);
    const siteChanged = next.site !== st.plan.site;
    st.plan = next;
    if (st.confirmedAt !== null) st.changedSinceConfirm = true;
    if (siteChanged) moveAccess(next.site);
    return true;
  };

  /** The site item's lesson and tips, from the step that decides. */
  const siteTeaching = (sc: RouteScore): { lessonId: string; tipIds: string[] } => {
    const c = st.card;
    const d = sc.decision;
    const tips = ["access-site-five-steps"];
    let lessonId = "pm-access-site-choice";
    if (d.step === 1) {
      const why = Object.values(d.excluded).join(" ");
      if (/femoral pulse|axillofemoral|aneurysm|aortoiliac/.test(why)) {
        lessonId = "hb-background-peripheral";
        tips.push("access-bg-pulses-both-groins");
        if (c.axillofemoralGraft) tips.push("access-bg-axillofemoral");
        if (c.aaa) tips.push("access-bg-aaa-thrombus");
      } else if (/very small radial/.test(why)) lessonId = "pm-engaging-spasm";
      if (/closure device|fistula|harvested|complication/.test(why)) tips.push("access-planning-site-history");
    }
    if (d.step === 2) tips.push("access-cabg-left-radial");
    if (d.step === 3) tips.push("access-anticoagulated-go-radial");
    if (d.step === 4) tips.push("access-complex-pci-femoral");
    return { lessonId, tipIds: tips };
  };

  /** Record the plan's decisions: as confirmed, or (at the needle) as not confirmed. */
  const record = (confirmed: boolean) => {
    if (!scored()) return;
    const sc = scoreRoutePlan(st.card, st.plan);
    const teach = siteTeaching(sc);
    const late = (g: string) => (confirmed ? g : `Not confirmed before the needle (${lc(g)})`);
    s.decide({ id: "route-plan-site", stage: "chart", label: "Access site chosen by the five steps", correct: confirmed && sc.site.correct, expected: sc.site.expected, given: late(sc.site.given), ...teach });
    s.decide({ id: "route-plan-sheath", stage: "chart", label: "Sheath size, type and length fit the plan and the artery", correct: confirmed && sc.sheath.correct, expected: sc.sheath.expected, given: late(sc.sheath.given), lessonId: "pm-access-site-choice", tipIds: ["access-sheath-plan-size", "access-complex-pci-femoral", "access-sheath-femoral-length-tip"] });
    s.decide({ id: "route-plan-fallback", stage: "chart", label: "A fallback site named", correct: confirmed && sc.fallback.correct, expected: sc.fallback.expected, given: late(sc.fallback.given), lessonId: "pm-access-site-choice", tipIds: ["access-site-five-steps"] });
    const sp = sc.spasm;
    s.decide({
      id: "route-plan-spasm",
      stage: "chart",
      label: "Radial spasm planned for",
      correct: sp ? confirmed && sp.correct : true,
      expected: sp ? sp.expected : "Not needed for a femoral site",
      given: sp ? late(sp.given) : `${siteName(st.plan.site)}: no radial artery`,
      lessonId: "pm-engaging-spasm",
      tipIds: ["access-radial-thin-sheath-vasodilator", "access-radial-spasm-no-traction"],
    });
    const felt = new Set(st.pulses.filter((p) => p.phase === "before").map((p) => p.id));
    const missing = PULSE_SITES.filter((id) => !felt.has(id));
    s.decide({
      id: "route-pulses-before",
      stage: "chart",
      label: "Pulses in both arms and legs examined before the route was chosen",
      correct: missing.length === 0,
      expected: "Radial, ulnar, femoral and foot pulses on both sides",
      given: missing.length ? `Not felt: ${missing.map((id) => lc(pulseLabel(id)).replace(/ \(.*\)$/, "")).join(", ")}` : "All felt",
      lessonId: "hb-background-peripheral",
      tipIds: ["access-bg-pulses-both-groins"],
    });
  };

  const confirm = (): RouteScore | null => {
    if (st.locked || s.busy) return null;
    st.confirmedAt = now();
    st.changedSinceConfirm = false;
    const p = st.plan;
    const fb = p.fallback ? `; fallback ${lc(siteName(p.fallback))}` : "; no fallback";
    logAction(`Access plan: ${lc(siteName(p.site))}, ${p.sheathFr} Fr ${p.sheathType === "thin" ? "thin-walled" : "standard"} ${p.lengthCm} cm sheath${fb}.`);
    s.wait(MP_ROUTE_PLAN.confirmS, "Stating the access plan");
    record(true);
    st.note = null;
    return scoreRoutePlan(st.card, st.plan);
  };

  const inspectSite = (): string | null => {
    if (s.busy) return null;
    const a = s.activeSite;
    const ml = a.pm.st.haematomaMl;
    const found = ml >= MP_ROUTE_PLAN.palpableHaematomaMl;
    const where = a.siteKind === "radial" ? "wrist" : "groin";
    // blood at the puncture as the session holds it: ooze around the sheath, under the band or the fingers
    const comp = a.closure.compression;
    const oozing =
      (!!a.sheath && s.closureContext.oozeAroundSheath) ||
      !!s.bandNow()?.bleeding ||
      (!!comp && comp.releasedAt === null && comp.oozeMlMin > 0) ||
      (!s.wire.perforation && s.activeEvents().includes("bleeding"));
    const ooze = oozing ? (a.sheath ? "oozing around the sheath" : "oozing at the puncture") : "";
    const text = found
      ? `A soft swelling about ${haematomaCm(ml)} cm across around the ${where} puncture, not pulsatile${ooze ? `; ${ooze}` : ""}.`
      : ooze
        ? `The ${where} site is soft with no swelling, ${ooze}.`
        : `The ${where} site is soft, with no swelling and no ooze.`;
    st.inspections.push({ t: now(), siteId: a.id, found, text });
    s.wait(MP_ROUTE_PLAN.inspectS, "Looking at and feeling the access site");
    if (found && !st.haematoma) st.haematoma = { siteId: a.id, t: now(), ml: round1(ml) };
    st.note = text;
    logResult(text);
    return text;
  };

  /** The case's spasm prevention as done: sedation and local before the puncture, a vasodilator after the sheath. */
  const scorePrevention = () => {
    if (!scored() || s.activeSite.siteKind !== "radial") return;
    const punctureAt = s.hookAt.puncture ?? s.tS;
    const sheathAt = s.hookAt["sheath-in"] ?? s.tS;
    const sedated = s.orders.some((o) => (o.id === "midazolam" || o.id === "fentanyl") && o.t <= punctureAt);
    const local = s.activeSite.local.given && s.activeSite.local.at <= punctureAt;
    const vaso = s.orders.some((o) => (o.id === "verapamil" || o.id === "verapamil-high" || o.id === "gtn" || o.id === "gtn-low") && o.t >= sheathAt);
    const done = [sedated ? "sedation" : "", local ? "local" : "", vaso ? "vasodilator" : ""].filter(Boolean);
    const factors = spasmPatientFactors(st.card);
    const sh = s.sheath;
    const od = sh ? sheathOdMm(sh.id === "6-thin" ? 6 : Number(sh.id), sh.id === "6-thin" ? "thin" : "standard") : null;
    s.decide({
      id: "route-spasm-prevention",
      stage: "access",
      label: "Spasm prevention done: sedation and local first, a vasodilator after the sheath",
      correct: sedated && local && vaso,
      expected: "Sedation and local before the puncture; verapamil or nitroglycerin after the sheath",
      given: `${done.length ? done.join(", ") : "none"}${factors.length ? `; risk: ${factors.join(", ")}` : ""}${od ? `; sheath ${od} mm` : ""}`,
      lessonId: "pm-engaging-spasm",
      tipIds: ["access-radial-thin-sheath-vasodilator", "diag-radial-spasm-release"],
    });
  };

  /** At closure: was the site watched, and was a haematoma found while small? */
  const scoreMonitoring = () => {
    if (!scored()) return;
    const sheathAt = s.hookAt["sheath-in"];
    if (sheathAt === undefined) return;
    const looked = st.inspections.filter((i) => i.t >= sheathAt);
    const worst = Math.max(0, ...Object.values(st.maxHaematomaMl));
    const had = worst >= MP_ROUTE_PLAN.palpableHaematomaMl;
    const foundSmall = !!st.haematoma && st.haematoma.ml < MP_COMPRESSION.visibleHaematomaMl;
    const ok = looked.length > 0 && (!had || foundSmall);
    s.decide({
      id: "route-site-monitored",
      stage: "closure",
      label: "Access site inspected and palpated during the case",
      correct: ok,
      expected: had ? "The site looked at and felt, and the haematoma found while small" : "The site looked at and felt during the case",
      given: !looked.length ? "Not inspected" : had ? (st.haematoma ? `Haematoma found at ${round1(st.haematoma.ml)} mL` : "Inspected, haematoma not found") : `Inspected ${looked.length} time${looked.length > 1 ? "s" : ""}`,
      lessonId: "pm-monitoring-watch",
      tipIds: ["access-mon-pulses-site"],
    });
  };

  /** The pulses at and beyond every used site, felt after closure. */
  const endNeeded = (): PulseSiteId[] => {
    const out: PulseSiteId[] = [];
    for (const x of s.sites) {
      if (!x.sheath && !x.sheathHistory) continue;
      if (x.siteKind === "femoral-vein") continue;
      const id: PlanSiteId = x.siteKind === "femoral" ? `femoral-${x.side}` : `radial-${x.side}`;
      const p = pulsesForSite(id);
      for (const q of [p.at, p.distal]) if (!out.includes(q)) out.push(q);
    }
    return out;
  };
  const checkEndPulses = (force = false) => {
    if (!scored() || !s.closureDone()) return;
    if (!endScored && !force) return;
    endScored = true;
    const felt = new Set(st.pulses.filter((p) => p.phase === "after").map((p) => p.id));
    const need = endNeeded();
    const missing = need.filter((id) => !felt.has(id));
    const lost = latest("after").filter((p) => p.finding !== "normal" && latest("before").find((b) => b.id === p.id)?.finding === "normal");
    s.decide({
      id: "route-pulses-end",
      stage: "recovery",
      label: "Pulses at and beyond the access site rechecked at the end",
      correct: missing.length === 0,
      expected: `Felt again after closure: ${need.map((id) => lc(pulseLabel(id)).replace(/ \(.*\)$/, "")).join(", ")}`,
      given: missing.length ? `Not felt: ${missing.map((id) => lc(pulseLabel(id)).replace(/ \(.*\)$/, "")).join(", ")}` : lost.length ? `Felt; changed since the start: ${lost.map((p) => lc(pulseLabel(p.id)).replace(/ \(.*\)$/, "")).join(", ")}` : "Felt, as at the start",
      lessonId: "pm-monitoring-watch",
      tipIds: ["access-mon-pulses-site", "access-post-pulses-start-end"],
    });
  };

  const onPuncture = () => {
    if (st.locked) return;
    st.locked = true;
    // a plan not confirmed (or changed since) is scored as it stood, as not confirmed before the needle
    if (st.confirmedAt === null || st.changedSinceConfirm) record(false);
  };

  /**
   * A sheath large for the radial artery grips the device in the arm: spasm rises (MODEL PARAMETER).
   * Only while the wire is in, the condition under which the session's slow step relaxes spasm
   * (caseSession slowTick): with the wire out nothing relaxes it, so a drive there would only build.
   */
  const sheathSpasm = (h: number) => {
    const a = s.activeSite;
    const sh = s.sheath;
    if (a.siteKind !== "radial" || !sh || sh.venous || !s.wireInBody) return;
    const fr = sh.id === "6-thin" ? 6 : Number(sh.id);
    // the thin-walled sheath the plan chose is the one opened when its size matches
    const thin = sh.id === "6-thin" || (st.plan.sheathType === "thin" && st.plan.sheathFr === fr);
    const drive = sheathSpasmDrivePerS(sheathOdMm(fr, thin ? "thin" : "standard"), s.profile.radialDiamMm);
    if (drive > 0) s.wire = { ...s.wire, spasm: Math.min(1, s.wire.spasm + drive * h) };
  };

  const mod: RoutePlanModule = {
    id: ROUTE_PLAN_MODULE_ID,
    get state() {
      return st;
    },
    attach(session) {
      s = session;
      moving = false;
      endScored = false;
      preventionScored = false;
      const card = buildRouteCard(s);
      // a route scenario's recent closure device is the record's planted problem (see the header)
      const pm = planningOf(s);
      if (pm && card.recentPlug && !pm.state.record.facts.closureDevice) {
        const rec = buildPlanningRecord({ seed: s.seed, profile: s.profile, access: "femoral", anticoagText: s.chart.anticoag?.text, force: "closure-device-90d" });
        rec.facts.closureDevice = { side: card.recentPlug.side, daysAgo: card.recentPlug.daysAgo };
        rec.items = recordItems(s.profile, rec.facts);
        pm.state.record = rec;
      }
      st = {
        card,
        plan: defaultPlan(planSiteOfRoute(s.access, s.sites[0].side)),
        confirmedAt: null,
        changedSinceConfirm: false,
        locked: s.startStage !== "chart",
        planByTeam: s.startStage !== "chart",
        pulses: [],
        radialUs: {},
        inspections: [],
        haematoma: null,
        maxHaematomaMl: {},
        leftGroinPending: false,
        note: null,
      };
      // the planned access, changed by anything else (the store's picker, the autopilot), moves the plan's site
      const setAccess = s.setAccess;
      const own = s as unknown as { setAccess?: CaseSession["setAccess"] };
      own.setAccess = (a: AccessRoute, ...rest: unknown[]): boolean => {
        const ok = (setAccess as (...x: unknown[]) => boolean).call(s, a, ...rest);
        // the team's plan (a case opened past the chart) follows the route until the first puncture too
        if (ok && !moving && (!st.locked || (st.planByTeam && s.hookAt.puncture === undefined))) {
          const cur = PLAN_SITE_BY_ID[st.plan.site];
          // a wrist plan done through this route keeps its kind (ulnar or distal radial on the same arm)
          if (cur.route !== a) st.plan = { ...st.plan, site: planSiteOfRoute(a, s.sites[0].side) };
          fitToSite(st.plan);
        }
        return ok;
      };
      return () => {
        delete own.setAccess;
      };
    },
    onHook(hook: SessionHook) {
      if (hook === "puncture") onPuncture();
      else if (hook === "catheter-in") {
        // the first catheter up the arm: what was done to prevent spasm
        if (!preventionScored) {
          preventionScored = true;
          scorePrevention();
        }
      } else if (hook === "closure") {
        scoreMonitoring();
        checkEndPulses(true);
      }
    },
    slowTick(h: number) {
      sheathSpasm(h);
      for (const x of s.sites) {
        const ml = x.pm.st.haematomaMl;
        if (ml > (st.maxHaematomaMl[x.id] ?? 0)) st.maxHaematomaMl[x.id] = round1(ml);
      }
    },
    events() {
      return st.haematoma ? ROUTE_PLAN_EVENTS : NO_EVENTS;
    },
    actions: {
      palpate,
      palpateAll,
      measureRadial,
      setPlan,
      confirm,
      inspectSite,
      pulseNow: (id) => pulseNow(id),
      startPulses: () => latest("before"),
      endPulses: () => latest("after"),
      score: () => scoreRoutePlan(st.card, st.plan),
      plannedSheath: () => labSheathFor(st.plan),
    },
  };
  return mod;
}

/** The algorithm's answer for a session's card (for tests and the dev hook). */
export function routeDecisionOf(m: RoutePlanModule) {
  return decideRoute(m.state.card);
}
