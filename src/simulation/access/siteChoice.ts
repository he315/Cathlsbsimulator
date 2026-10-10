// ---------------------------------------------------------------------------
// The route decision before access (access-route-decision): the patient card,
// the learner's plan (site, sheath size, type and length, fallback, and the
// radial spasm plan) and the five-step scorer.
//
// Sources (module text):
//   - pm-access-site-choice (05-access.ts): Brilakis's five steps (Fig 4.1),
//     the exclusions of step 1 (a harvested or occluded radial, occluded or
//     severely diseased iliofemoral arteries or distal aorta, failure to engage
//     from the site last time, a dialysis fistula in the arm, preference, a
//     collagen-plug closure device within 90 days and a site that caused an
//     access complication, from Brilakis 1.4), prior CABG (step 2: femoral,
//     the left radial with a LIMA, femoral strongly favoured with both IMAs; a
//     RIMA only from the right radial, Oxford), STEMI, an oral anticoagulant
//     or high bleeding risk (step 3: radial), complex PCI (step 4: at least one
//     femoral access, often 7 or 8 Fr and ideally 45 cm), the arteria lusoria
//     (left radial or femoral), Oxford's caution about the radial artery in
//     renal failure (dialysis access), and the sheath table (Brilakis 30.1,
//     Table 30.2: French sizes by procedure; 10, 25 and 45 cm femoral lengths
//     and when to use the longer ones; thin-walled outer diameters; 1 Fr =
//     0.33 mm);
//   - hb-background-peripheral (10-background.ts): no femoral route with both
//     femoral pulses impalpable, an axillofemoral graft, or thrombus in an
//     abdominal aneurysm; a weaker femoral pulse suggests an occlusion above it;
//   - pm-engaging-spasm (07-engaging.ts): the spasm factors (small radial,
//     women, smokers, anxiety and inadequate sedation; several passes; a sheath
//     large for the artery; no vasodilator), prevention (moderate sedation and
//     local before the puncture, verapamil 2.5 mg and/or nitroglycerin
//     100-200 mcg after the sheath, the smallest thin-walled sheath), a very
//     small radial switched to the ulnar or femoral artery, and the 24 cm long
//     radial sheath (Brilakis 29.2);
//   - access-sheath-radial-long-caution: long radial sheaths only for a reason
//     (spasm prevention; left radial and CTO work).
// Every other number is a MODEL PARAMETER (MP_SITE_CHOICE below, listed in
// docs/realism/facts/pkg-access-route-decision.md).
//
// Ulnar and distal radial access are planned and scored here, and the lab
// runs them through its radial route until access-distal-radial builds their
// own anatomy (PLAN_SITES[].labNote says so on screen).
//
// Pure and engine-free: the session module (modules/routePlan.ts) builds the
// card from the scenario and the patient, and the chart section
// (src/ui/access/chart/PlanAccess.tsx) shows it.
// ---------------------------------------------------------------------------

import type { AccessRoute } from "../../types";

export type Side = "right" | "left";
export const SIDES: readonly Side[] = ["right", "left"];

// ---------------------------------------------------------------------------
// Sites
// ---------------------------------------------------------------------------

export type PlanSiteKind = "radial" | "distal-radial" | "ulnar" | "femoral";
export type PlanSiteId = `${PlanSiteKind}-${Side}`;

export interface PlanSite {
  id: PlanSiteId;
  kind: PlanSiteKind;
  side: Side;
  /** sentence-case name */
  label: string;
  /** a wrist site (radial, distal radial, ulnar) */
  wrist: boolean;
  /** the lab route the site is done through */
  route: AccessRoute;
  /** how the lab does it, when not as named */
  labNote?: string;
}

const KINDS: readonly PlanSiteKind[] = ["radial", "distal-radial", "ulnar", "femoral"];
const KIND_LABEL: Record<PlanSiteKind, string> = { radial: "radial", "distal-radial": "distal radial", ulnar: "ulnar", femoral: "femoral" };

export const PLAN_SITES: readonly PlanSite[] = KINDS.flatMap((kind) =>
  SIDES.map((side): PlanSite => {
    const wrist = kind !== "femoral";
    const route: AccessRoute = kind === "femoral" ? "femoral" : side === "left" ? "radial-left" : "radial-right";
    return {
      id: `${kind}-${side}`,
      kind,
      side,
      label: `${side === "right" ? "Right" : "Left"} ${KIND_LABEL[kind]}`,
      wrist,
      route,
      ...(kind === "ulnar" || kind === "distal-radial" ? { labNote: `done through the ${side} radial route in this lab` } : {}),
    };
  }),
);
export const PLAN_SITE_BY_ID = Object.fromEntries(PLAN_SITES.map((p) => [p.id, p])) as Record<PlanSiteId, PlanSite>;
export const isPlanSiteId = (x: unknown): x is PlanSiteId => typeof x === "string" && x in PLAN_SITE_BY_ID;
const lcFirst = (t: string) => t[0].toLowerCase() + t.slice(1);
export const siteName = (id: PlanSiteId) => PLAN_SITE_BY_ID[id].label;

/** The plan site the lab's planned access is now (the radial and femoral routes). */
export function planSiteOfRoute(a: AccessRoute, side: Side = "right"): PlanSiteId {
  return a === "femoral" ? `femoral-${side}` : a === "radial-left" ? "radial-left" : "radial-right";
}

// ---------------------------------------------------------------------------
// Pulses
// ---------------------------------------------------------------------------

export type PulseArtery = "radial" | "ulnar" | "femoral" | "pedal";
export type PulseSiteId = `${PulseArtery}-${Side}`;
export type PulseFinding = "normal" | "weak" | "absent";
export const PULSE_ARTERIES: readonly PulseArtery[] = ["radial", "ulnar", "femoral", "pedal"];
export const PULSE_SITES: readonly PulseSiteId[] = PULSE_ARTERIES.flatMap((a) => SIDES.map((s) => `${a}-${s}` as PulseSiteId));
const PULSE_LABEL: Record<PulseArtery, string> = { radial: "radial", ulnar: "ulnar", femoral: "femoral", pedal: "foot (dorsalis pedis and posterior tibial)" };
export const pulseLabel = (id: PulseSiteId) => {
  const [a, s] = id.split("-") as [PulseArtery, Side];
  return `${s === "right" ? "Right" : "Left"} ${PULSE_LABEL[a]}`;
};
export const pulseWords = (f: PulseFinding) => (f === "normal" ? "normal" : f === "weak" ? "weak" : "not palpable");

/** The pulse at a plan site and the one beyond it (the end-of-case check). */
export function pulsesForSite(id: PlanSiteId): { at: PulseSiteId; distal: PulseSiteId } {
  const p = PLAN_SITE_BY_ID[id];
  if (p.kind === "femoral") return { at: `femoral-${p.side}`, distal: `pedal-${p.side}` };
  if (p.kind === "ulnar") return { at: `ulnar-${p.side}`, distal: `radial-${p.side}` };
  return { at: `radial-${p.side}`, distal: `ulnar-${p.side}` };
}

// ---------------------------------------------------------------------------
// Sheaths
// ---------------------------------------------------------------------------

export type SheathType = "standard" | "thin";
export type PlanFr = 4 | 5 | 6 | 7 | 8;
export const PLAN_FR: readonly PlanFr[] = [4, 5, 6, 7, 8];
/**
 * The sizes a site offers: 4 to 8 Fr in the groin (Oxford's 4 Fr femoral diagnostic study), 5 to 8 Fr
 * at the wrist (radial sheaths 'generally 5 or 6 Fr', pm-access-site-choice; 5 Fr is the smallest wrist
 * sheath the lab stocks, closure.ts SHEATHS).
 */
export const WRIST_FR: readonly PlanFr[] = [5, 6, 7, 8];
export const frsFor = (site: PlanSiteId): readonly PlanFr[] => (PLAN_SITE_BY_ID[site].wrist ? WRIST_FR : PLAN_FR);

/** Femoral sheath lengths, cm (Brilakis 30.1, pm-access-site-choice: 10 cm standard, 25 or 45 cm). */
export const FEMORAL_LENGTHS_CM = [10, 25, 45] as const;
/**
 * Wrist sheath lengths, cm: the short sheath the lab uses (the session's default length, a MODEL
 * value; the text gives no length for it) and the 24 cm long radial sheath that reaches the brachial
 * artery (Brilakis 29.2, pm-engaging-spasm).
 */
export const WRIST_LENGTHS_CM = [10, 24] as const;
export type PlanLengthCm = (typeof FEMORAL_LENGTHS_CM)[number] | (typeof WRIST_LENGTHS_CM)[number];
export const lengthsFor = (site: PlanSiteId): readonly PlanLengthCm[] => (PLAN_SITE_BY_ID[site].wrist ? WRIST_LENGTHS_CM : FEMORAL_LENGTHS_CM);

/** 1 Fr = 0.33 mm (Brilakis 30.1, pm-access-site-choice). */
export const MM_PER_FR = 0.33;

/** Outer diameters, mm: standard and thin-walled, 5 to 7 Fr (Brilakis Table 30.2, pm-access-site-choice). */
export const SHEATH_OD_MM: Record<SheathType, Record<5 | 6 | 7, number>> = {
  standard: { 5: 2.29, 6: 2.62, 7: 2.95 },
  thin: { 5: 2.14, 6: 2.44, 7: 2.79 },
};

/**
 * A sheath's outer diameter, mm. 5 to 7 Fr from the table; 4 and 8 Fr, which the table does not give,
 * extrapolated from its 5 and 7 Fr rows by 1 Fr = 0.33 mm (a MODEL extrapolation).
 */
export function sheathOdMm(fr: number, type: SheathType): number {
  const t = SHEATH_OD_MM[type];
  if (fr <= 5) return Math.round((t[5] - (5 - fr) * MM_PER_FR) * 100) / 100;
  if (fr >= 7) return Math.round((t[7] + (fr - 7) * MM_PER_FR) * 100) / 100;
  return t[6];
}

/** French ranges by procedure (Brilakis 30.1 and Oxford ch 3, pm-access-site-choice). */
export const FR_RANGE: Record<"femoral" | "wrist", Record<PlannedProcedure, [PlanFr, PlanFr]>> = {
  // diagnostic 4-6 Fr (Oxford 4 or 5 Fr femoral); PCI 5-8 Fr; complex PCI 7-8 Fr
  femoral: { diagnostic: [4, 6], pci: [5, 8], "complex-pci": [7, 8] },
  // radial sheaths generally 5 or 6 Fr; 7 or 8 Fr can often go into a larger radial (the fit rule decides)
  wrist: { diagnostic: [5, 6], pci: [5, 8], "complex-pci": [7, 8] },
};

// ---------------------------------------------------------------------------
// MODEL PARAMETERS
// ---------------------------------------------------------------------------

/**
 * MODEL PARAMETERS of the route decision (docs/realism/facts/pkg-access-route-decision.md). The
 * module text names these conditions without numbers.
 */
export const MP_SITE_CHOICE = {
  /**
   * a wrist sheath fits the artery when its outer diameter is at most this multiple of the artery's
   * diameter ('a sheath large for the artery'); set so that a standard 6 Fr sheath (2.62 mm) fits every
   * radial that is not small (smallRadialMm), as 'generally 5 or 6 Fr' implies for the usual radial
   */
  sheathToArteryMax: 1.2,
  /** a radial artery 'smaller than average' for the spasm factors, mm (below the generator's female mean, 2.35 mm) */
  smallRadialMm: 2.2,
  /** an 'anxious' patient for the spasm factors (profile anxiety, 0..1) */
  anxiousFrom: 0.6,
  /** 'renal failure' for high bleeding risk: eGFR below this, mL/min/1.73 m2 */
  renalFailureEgfr: 30,
  /** 'a body mass index at either extreme': below the first or at or above the second, kg/m2 (the second is also 'morbid obesity') */
  bmiLow: 18.5,
  bmiMorbid: 40,
};

/**
 * The smallest wrist sheath the lab stocks is 5 Fr, so a radial artery too small for a thin-walled
 * 5 Fr sheath by the fit rule is 'very small' (switch to the ulnar or femoral artery).
 */
export const VERY_SMALL_RADIAL_MM = Math.round((SHEATH_OD_MM.thin[5] / MP_SITE_CHOICE.sheathToArteryMax) * 100) / 100;

/** Whether a sheath fits an artery of this diameter (the fit rule). */
export const sheathFits = (odMm: number, arteryMm: number) => odMm <= arteryMm * MP_SITE_CHOICE.sheathToArteryMax + 1e-9;

// ---------------------------------------------------------------------------
// The card
// ---------------------------------------------------------------------------

export type PlannedProcedure = "diagnostic" | "pci" | "complex-pci";

/** What the patient card holds: the chart, the history, the reports and the findings on examination. */
export interface RouteCard {
  /** pulses on examination (the truth of what palpation finds before access) */
  pulses: Record<PulseSiteId, PulseFinding>;
  /** the radial artery's diameter, mm (what ultrasound measures; the same artery in both arms) */
  radialDiamMm: number;
  /** step 1 */
  radialHarvested: Side[];
  fistulaArm: Side | null;
  /** occlusion or severe disease of the common femoral or iliac arteries or the distal aorta, both sides */
  aortoiliacDisease: boolean;
  axillofemoralGraft: boolean;
  aaa: { muralThrombus: boolean } | null;
  arteriaLusoria: boolean;
  priorFailure: PlanSiteId[];
  priorComplication: PlanSiteId[];
  recentPlug: { side: Side; daysAgo: number } | null;
  preference: "avoid-wrist" | "cannot-lie-flat" | null;
  /** step 2 */
  cabg: { lima: boolean; rima: boolean; veinGrafts: boolean } | null;
  /** step 3 */
  stemi: boolean;
  oralAnticoagulant: string | null;
  /** high bleeding risk factors, in words */
  bleedingRisk: string[];
  /** on haemodialysis or in renal failure (Oxford: the radial artery may be needed for dialysis access) */
  renalFailure: boolean;
  /** step 4 */
  procedure: PlannedProcedure;
  /** what makes the PCI complex (CTO, severe calcium and tortuosity, a difficult bifurcation) */
  complexity: string | null;
  /** sheath length reasons */
  iliacTortuosity: boolean;
  morbidObesity: boolean;
  /** spasm factors of the patient */
  sex: "M" | "F";
  smoker: boolean;
  anxious: boolean;
  /** a PDE-5 inhibitor taken recently: no nitroglycerin */
  pde5Recent: boolean;
  /** extra card lines (reports, CT) shown as written */
  notes: string[];
}

/** A card with nothing on it but normal pulses (scenario cards start from this). */
export function blankCard(radialDiamMm: number, sex: "M" | "F"): RouteCard {
  return {
    pulses: Object.fromEntries(PULSE_SITES.map((p) => [p, "normal"])) as Record<PulseSiteId, PulseFinding>,
    radialDiamMm,
    radialHarvested: [],
    fistulaArm: null,
    aortoiliacDisease: false,
    axillofemoralGraft: false,
    aaa: null,
    arteriaLusoria: false,
    priorFailure: [],
    priorComplication: [],
    recentPlug: null,
    preference: null,
    cabg: null,
    stemi: false,
    oralAnticoagulant: null,
    bleedingRisk: [],
    renalFailure: false,
    procedure: "diagnostic",
    complexity: null,
    iliacTortuosity: false,
    morbidObesity: false,
    sex,
    smoker: false,
    anxious: false,
    pde5Recent: false,
    notes: [],
  };
}

/** What a scenario's card sets (applied over the card built from the patient). */
export type RouteCardOverrides = Partial<Omit<RouteCard, "pulses">> & { pulses?: Partial<Record<PulseSiteId, PulseFinding>> };

export function applyCardOverrides(c: RouteCard, o: RouteCardOverrides | undefined): RouteCard {
  if (!o) return c;
  const { pulses, ...rest } = o;
  return { ...c, ...rest, pulses: { ...c.pulses, ...(pulses ?? {}) } };
}

/** The patient facts the card is built from (a structural subset of PatientProfile). */
export interface CardPatient {
  sex: "M" | "F";
  bmi: number;
  indication: string;
  anticoagulation: "none" | "warfarin" | "doac";
  doac?: { agent: string };
  renal: { egfr: number };
  radialDiamMm: number;
  risk: { smoker: boolean };
  anxiety: number;
  pde5?: { hoursAgo: number };
}

/**
 * The card a generated patient carries: the anticoagulant, the bleeding-risk factors the profile holds
 * (renal failure, a body mass index at either extreme), STEMI, the spasm factors, and a diagnostic
 * study (a coronary syndrome may go on to PCI, which is not complex). Pulses are normal.
 */
export function cardFromPatient(p: CardPatient): RouteCard {
  const c = blankCard(p.radialDiamMm, p.sex);
  const bleeding: string[] = [];
  if (p.renal.egfr < MP_SITE_CHOICE.renalFailureEgfr) bleeding.push(`renal failure (eGFR ${p.renal.egfr})`);
  if (p.bmi < MP_SITE_CHOICE.bmiLow || p.bmi >= MP_SITE_CHOICE.bmiMorbid) bleeding.push(`body mass index ${p.bmi}`);
  c.bleedingRisk = bleeding;
  c.renalFailure = p.renal.egfr < MP_SITE_CHOICE.renalFailureEgfr;
  c.morbidObesity = p.bmi >= MP_SITE_CHOICE.bmiMorbid;
  c.stemi = p.indication === "STEMI";
  c.oralAnticoagulant = p.anticoagulation === "warfarin" ? "warfarin" : p.anticoagulation === "doac" ? (p.doac?.agent ?? "a direct oral anticoagulant") : null;
  c.procedure = p.indication === "STEMI" || p.indication === "NSTEMI" || p.indication === "UA" ? "pci" : "diagnostic";
  c.smoker = p.risk.smoker;
  c.anxious = p.anxiety >= MP_SITE_CHOICE.anxiousFrom;
  c.pde5Recent = !!p.pde5;
  return c;
}

/** The card as the learner reads it (no pulse and no measurement: those are examined). */
export function cardLines(c: RouteCard): { label: string; text: string }[] {
  const out: { label: string; text: string }[] = [];
  const proc = c.procedure === "diagnostic" ? "Diagnostic coronary angiography" : c.procedure === "pci" ? "Coronary angiography and PCI if needed" : `Complex PCI${c.complexity ? `: ${c.complexity}` : ""}`;
  out.push({ label: "Planned procedure", text: proc });
  out.push({ label: "Presentation", text: c.stemi ? "ST-elevation myocardial infarction" : c.procedure === "pci" ? "Acute coronary syndrome" : "Elective" });
  if (c.cabg) {
    const g = [c.cabg.lima ? "left internal mammary artery" : "", c.cabg.rima ? "right internal mammary artery" : "", c.cabg.veinGrafts ? "vein grafts" : ""].filter(Boolean);
    out.push({ label: "Bypass grafts", text: `Previous CABG: ${g.join(", ")}.` });
  }
  if (c.radialHarvested.length) out.push({ label: "Bypass grafts", text: `${c.radialHarvested.map((s) => `${s} radial`).join(" and ")} artery harvested as a graft.` });
  out.push({ label: "Anticoagulant", text: c.oralAnticoagulant ? `On ${c.oralAnticoagulant}, not stopped.` : "None." });
  out.push({ label: "Bleeding risk", text: c.bleedingRisk.length ? c.bleedingRisk.join("; ") : "No high bleeding risk factor recorded." });
  if (c.fistulaArm) out.push({ label: "Dialysis", text: `Arteriovenous fistula in the ${c.fistulaArm} forearm.` });
  if (c.recentPlug) out.push({ label: "Previous access", text: `${c.recentPlug.side === "right" ? "Right" : "Left"} femoral angiography ${c.recentPlug.daysAgo} days ago, closed with an anchor-and-collagen-plug device.` });
  for (const id of c.priorComplication) out.push({ label: "Previous access", text: `An access complication at the ${lcFirst(siteName(id))} site.` });
  for (const id of c.priorFailure) out.push({ label: "Previous access", text: `Failed to reach or engage from the ${lcFirst(siteName(id))} site last time.` });
  if (c.axillofemoralGraft) out.push({ label: "Peripheral", text: "Axillofemoral bypass graft." });
  if (c.aortoiliacDisease) out.push({ label: "Peripheral", text: "Aortoiliac occlusive disease on previous imaging." });
  if (c.aaa) out.push({ label: "Aorta", text: `Known abdominal aortic aneurysm${c.aaa.muralThrombus ? "; mural thrombus on the last ultrasound" : ""}.` });
  if (c.arteriaLusoria) out.push({ label: "CT", text: "Aberrant right subclavian artery (arteria lusoria)." });
  if (c.iliacTortuosity) out.push({ label: "Peripheral", text: "Tortuous iliac arteries on previous films." });
  if (c.preference === "avoid-wrist") out.push({ label: "Preference", text: "Asks to avoid the wrists." });
  if (c.preference === "cannot-lie-flat") out.push({ label: "Preference", text: "Cannot lie flat for long." });
  for (const n of c.notes) out.push({ label: "Note", text: n });
  return out;
}

// ---------------------------------------------------------------------------
// The plan
// ---------------------------------------------------------------------------

export interface SpasmPlan {
  /** moderate sedation before the puncture */
  sedation: boolean;
  /** local anaesthetic before the puncture */
  local: boolean;
  /** intra-arterial verapamil after the sheath */
  verapamil: boolean;
  /** intra-arterial nitroglycerin after the sheath */
  gtn: boolean;
}

export interface RoutePlan {
  site: PlanSiteId;
  sheathFr: PlanFr;
  sheathType: SheathType;
  lengthCm: PlanLengthCm;
  fallback: PlanSiteId | null;
  spasm: SpasmPlan;
}

export const EMPTY_SPASM_PLAN: SpasmPlan = { sedation: false, local: false, verapamil: false, gtn: false };

/** A starting plan for the lab's planned route: 6 Fr standard, the short length, no fallback, nothing for spasm. */
export function defaultPlan(site: PlanSiteId): RoutePlan {
  return { site, sheathFr: 6, sheathType: "standard", lengthCm: 10, fallback: null, spasm: { ...EMPTY_SPASM_PLAN } };
}

// ---------------------------------------------------------------------------
// The five steps
// ---------------------------------------------------------------------------

export type DecidingStep = 1 | 2 | 3 | 4 | 5;
export const STEP_TEXT: Record<DecidingStep, string> = {
  1: "Step 1, sites available",
  2: "Step 2, prior CABG",
  3: "Step 3, STEMI, anticoagulant or bleeding risk",
  4: "Step 4, complex PCI",
  5: "Default: radial",
};

/** Step 1: every site that cannot be used, with the reason. */
export function excludedSites(c: RouteCard): Partial<Record<PlanSiteId, string>> {
  const out: Partial<Record<PlanSiteId, string>> = {};
  const add = (ids: PlanSiteId[], why: string) => {
    for (const id of ids) if (!out[id]) out[id] = why;
  };
  const arm = (s: Side): PlanSiteId[] => [`radial-${s}`, `distal-radial-${s}`, `ulnar-${s}`];
  const radialArtery = (s: Side): PlanSiteId[] => [`radial-${s}`, `distal-radial-${s}`];
  for (const s of SIDES) {
    if (c.radialHarvested.includes(s)) add(radialArtery(s), `the ${s} radial artery was harvested as a graft`);
    if (c.fistulaArm === s) add(arm(s), `a dialysis fistula in the ${s} arm`);
    if (c.pulses[`radial-${s}`] === "absent") add(radialArtery(s), `no ${s} radial pulse`);
    if (c.pulses[`ulnar-${s}`] === "absent") add([`ulnar-${s}`], `no ${s} ulnar pulse`);
    if (c.pulses[`femoral-${s}`] === "absent") add([`femoral-${s}`], `no ${s} femoral pulse`);
    else if (c.pulses[`femoral-${s}`] === "weak") add([`femoral-${s}`], `a weak ${s} femoral pulse: suspect an occlusion above it`);
    if (c.recentPlug && c.recentPlug.side === s && c.recentPlug.daysAgo < 90) add([`femoral-${s}`], `a collagen-plug closure device in the ${s} groin ${c.recentPlug.daysAgo} days ago`);
  }
  if (c.radialDiamMm < VERY_SMALL_RADIAL_MM) add([...radialArtery("right"), ...radialArtery("left")], `a very small radial artery (${c.radialDiamMm} mm)`);
  if (c.arteriaLusoria) add(arm("right"), "an aberrant right subclavian artery");
  if (c.axillofemoralGraft) add(["femoral-right", "femoral-left"], "an axillofemoral graft: the abdominal aorta may be occluded");
  if (c.aaa?.muralThrombus) add(["femoral-right", "femoral-left"], "thrombus in the abdominal aortic aneurysm");
  if (c.aortoiliacDisease) add(["femoral-right", "femoral-left"], "aortoiliac occlusive disease");
  if (c.preference === "avoid-wrist") add([...arm("right"), ...arm("left")], "the patient asks to avoid the wrists");
  if (c.preference === "cannot-lie-flat") add(["femoral-right", "femoral-left"], "the patient cannot lie flat");
  for (const id of c.priorFailure) add([id], "it failed last time");
  for (const id of c.priorComplication) add([id], "an earlier access complication there");
  return out;
}

export interface RouteDecision {
  step: DecidingStep;
  /** why that step decides */
  reason: string;
  /** the algorithm's answer, among the usable sites */
  preferred: PlanSiteId[];
  /** accepted alternatives, among the usable sites */
  accepted: PlanSiteId[];
  excluded: Partial<Record<PlanSiteId, string>>;
  usable: PlanSiteId[];
}

const WRIST_IDS = (sides: readonly Side[] = SIDES): PlanSiteId[] => sides.flatMap((s) => [`radial-${s}`, `distal-radial-${s}`, `ulnar-${s}`] as PlanSiteId[]);
const RADIAL_IDS: PlanSiteId[] = ["radial-right", "radial-left"];
const FEMORAL_IDS: PlanSiteId[] = ["femoral-right", "femoral-left"];

/** The answer of steps 2 to 5 before step 1's exclusions, or null when the step does not apply. */
function stepRule(c: RouteCard, step: 2 | 3 | 4 | 5): { preferred: PlanSiteId[]; accepted: PlanSiteId[]; reason: string } | null {
  switch (step) {
    case 2: {
      const g = c.cabg;
      if (!g || !(g.lima || g.rima || g.veinGrafts)) return null;
      if (g.lima && g.rima) return { preferred: FEMORAL_IDS, accepted: [], reason: "both internal mammary arteries grafted: femoral strongly favoured" };
      if (g.lima) return { preferred: FEMORAL_IDS, accepted: WRIST_IDS(["left"]), reason: "prior CABG with a LIMA: femoral, or the left radial" };
      if (g.rima) return { preferred: FEMORAL_IDS, accepted: WRIST_IDS(["right"]), reason: "prior CABG with a RIMA: femoral, or the right radial (Oxford)" };
      return { preferred: FEMORAL_IDS, accepted: WRIST_IDS(["left"]), reason: "prior CABG with vein grafts: femoral, or the left radial" };
    }
    case 3: {
      const why = [c.stemi ? "STEMI" : "", c.oralAnticoagulant ? "an oral anticoagulant" : "", c.bleedingRisk.length ? "high bleeding risk" : ""].filter(Boolean);
      if (!why.length) return null;
      // Oxford: think twice about the radial artery in renal failure (it may be needed for dialysis access)
      return { preferred: RADIAL_IDS, accepted: [...WRIST_IDS(), ...(c.renalFailure ? FEMORAL_IDS : [])], reason: `${why.join(", ")}: radial` };
    }
    case 4:
      if (c.procedure !== "complex-pci") return null;
      return { preferred: FEMORAL_IDS, accepted: [], reason: "complex PCI: at least one femoral access" };
    case 5: {
      const extra: PlanSiteId[] = [];
      // an arteria lusoria favours the left radial or a femoral route; a very small radial switches to ulnar or femoral
      if (c.arteriaLusoria || c.radialDiamMm < VERY_SMALL_RADIAL_MM) extra.push(...FEMORAL_IDS);
      return { preferred: RADIAL_IDS, accepted: [...WRIST_IDS(), ...extra], reason: "the PCI is not complex: radial" };
    }
  }
}

/** Brilakis's five steps: the first step that decides, decides. */
export function decideRoute(c: RouteCard): RouteDecision {
  const excluded = excludedSites(c);
  const usable = PLAN_SITES.map((p) => p.id).filter((id) => !excluded[id]);
  const usableWrist = usable.filter((id) => PLAN_SITE_BY_ID[id].wrist);
  const usableFem = usable.filter((id) => !PLAN_SITE_BY_ID[id].wrist);
  const keep = (ids: PlanSiteId[]) => ids.filter((id) => usable.includes(id));
  if (!usable.length) return { step: 1, reason: "no usable site: discuss with the team", preferred: [], accepted: [], excluded, usable };
  // the first of steps 2 to 5 that applies and leaves a usable answer
  let rule: { step: 2 | 3 | 4 | 5; preferred: PlanSiteId[]; accepted: PlanSiteId[]; reason: string; ruledOut: PlanSiteId[] } | null = null;
  for (const step of [2, 3, 4, 5] as const) {
    const r = stepRule(c, step);
    if (!r) continue;
    const preferred = keep(r.preferred);
    const accepted = keep(r.accepted).filter((id) => !preferred.includes(id));
    if (preferred.length || accepted.length) {
      // every site the step prefers excluded at step 1: the step's accepted sites stand in
      rule = { step, reason: r.reason, preferred: preferred.length ? preferred : accepted, accepted: preferred.length ? accepted : [], ruledOut: preferred.length ? [] : r.preferred };
      break;
    }
  }
  // only one family left (wrist or groin): step 1 decides, with the later steps' side preference inside it
  if (!usableWrist.length || !usableFem.length) {
    const family = usableWrist.length ? usableWrist : usableFem;
    const rp = rule ? rule.preferred.filter((id) => family.includes(id)) : [];
    const ra = rule ? rule.accepted.filter((id) => family.includes(id)) : [];
    const preferred = rp.length ? rp : ra.length ? ra : family;
    const accepted = rp.length ? ra : [];
    const why = usableWrist.length ? "no usable femoral artery: the wrist" : "no usable wrist artery: the groin";
    return { step: 1, reason: why, preferred, accepted, excluded, usable };
  }
  if (!rule) return { step: 1, reason: "only these sites are usable", preferred: usable, accepted: [], excluded, usable };
  // the step's own answer cannot be used (e.g. the radial arteries too small for any sheath): step 1's
  // exclusions decide, and the reason names them rather than the step's excluded answer
  if (rule.ruledOut.length) {
    const why = [...new Set(rule.ruledOut.map((id) => excluded[id]).filter((x): x is string => !!x))];
    const kinds = [...new Set(rule.preferred.map((id) => KIND_LABEL[PLAN_SITE_BY_ID[id].kind]))];
    const kindText = kinds.length > 1 ? `${kinds.slice(0, -1).join(", ")} or ${kinds[kinds.length - 1]}` : kinds[0];
    return { step: 1, reason: `${why.join("; ")}: the ${kindText} artery`, preferred: rule.preferred, accepted: rule.accepted, excluded, usable };
  }
  return { step: rule.step, reason: rule.reason, preferred: rule.preferred, accepted: rule.accepted, excluded, usable };
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export interface PlanItem {
  correct: boolean;
  expected: string;
  given: string;
}

export interface RouteScore {
  decision: RouteDecision;
  site: PlanItem;
  sheath: PlanItem;
  fallback: PlanItem;
  /** the spasm plan, for a wrist site only */
  spasm: PlanItem | null;
  /** every item correct */
  correct: boolean;
}

const list = (ids: readonly PlanSiteId[]) => ids.map((id) => lcFirst(siteName(id))).join(", ");
const cap = (t: string) => t[0].toUpperCase() + t.slice(1);

/** The patient's radial spasm factors (pm-engaging-spasm), in words. */
export function spasmPatientFactors(c: RouteCard): string[] {
  return [
    c.radialDiamMm < MP_SITE_CHOICE.smallRadialMm ? `small radial artery (${c.radialDiamMm} mm)` : "",
    c.sex === "F" ? "woman" : "",
    c.smoker ? "smoker" : "",
    c.anxious ? "anxious" : "",
  ].filter(Boolean);
}

/** The sheath's outer diameter against the radial artery (wrist sites). */
export function sheathRatio(c: RouteCard, plan: Pick<RoutePlan, "sheathFr" | "sheathType">): number {
  return sheathOdMm(plan.sheathFr, plan.sheathType) / c.radialDiamMm;
}

/** Whether a long sheath has a reason in this case. */
function lengthReason(c: RouteCard, plan: RoutePlan): string | null {
  const p = PLAN_SITE_BY_ID[plan.site];
  if (p.wrist) {
    if (spasmPatientFactors(c).length) return "spasm risk (a 24 cm sheath keeps catheter movement out of the radial artery)";
    if (p.side === "left" || c.procedure === "complex-pci") return "left radial or complex work";
    return null;
  }
  if (c.procedure === "complex-pci") return "complex PCI needs support";
  if (c.morbidObesity) return "obesity";
  if (c.iliacTortuosity) return "iliac tortuosity";
  return null;
}

function scoreSheath(c: RouteCard, plan: RoutePlan): PlanItem {
  const p = PLAN_SITE_BY_ID[plan.site];
  const [lo, hi] = FR_RANGE[p.wrist ? "wrist" : "femoral"][c.procedure];
  const od = sheathOdMm(plan.sheathFr, plan.sheathType);
  const given = `${plan.sheathFr} Fr ${plan.sheathType === "thin" ? "thin-walled" : "standard"}, ${plan.lengthCm} cm`;
  const why: string[] = [];
  if (plan.sheathFr < lo || plan.sheathFr > hi) why.push(`${lo}-${hi} Fr for ${c.procedure === "diagnostic" ? "a diagnostic study" : c.procedure === "pci" ? "PCI" : "complex PCI"}`);
  if (p.wrist && !sheathFits(od, c.radialDiamMm)) why.push(`a sheath that fits a ${c.radialDiamMm} mm radial (this one is ${od} mm)`);
  const reason = lengthReason(c, plan);
  const short = p.wrist ? WRIST_LENGTHS_CM[0] : FEMORAL_LENGTHS_CM[0];
  if (!p.wrist && c.procedure === "complex-pci" && plan.lengthCm !== 45) why.push("ideally 45 cm long for support");
  else if (plan.lengthCm !== short && !reason) why.push(`${short} cm (a long sheath needs a reason)`);
  const expectedLen = !p.wrist && c.procedure === "complex-pci" ? "45 cm" : reason ? `${short} cm, or longer for ${reason}` : `${short} cm`;
  return { correct: why.length === 0, expected: why.length ? cap(why.join("; ")) : `${lo}-${hi} Fr, ${expectedLen}`, given };
}

function scoreSpasm(c: RouteCard, plan: RoutePlan): PlanItem {
  const s = plan.spasm;
  const done = [s.sedation ? "sedation" : "", s.local ? "local" : "", s.verapamil ? "verapamil" : "", s.gtn ? "nitroglycerin" : ""].filter(Boolean);
  const why: string[] = [];
  if (!s.sedation) why.push("sedation before the puncture");
  if (!s.local) why.push("local before the puncture");
  if (!s.verapamil && !s.gtn) why.push("a vasodilator after the sheath");
  if (s.gtn && c.pde5Recent) why.push("no nitroglycerin after a recent PDE-5 inhibitor");
  const factors = spasmPatientFactors(c);
  const ratio = sheathRatio(c, plan);
  const risk = `${factors.length ? factors.join(", ") : "no patient factor"}; sheath ${Math.round(ratio * 100) / 100} x the artery`;
  return {
    correct: why.length === 0,
    expected: why.length ? `Missing: ${why.join("; ")}` : "Sedation and local before, vasodilator after the sheath",
    given: `${done.length ? done.join(", ") : "nothing planned"} (${risk})`,
  };
}

/**
 * The sites a fallback may be. Steps 2 and 4 rule sites out (a LIMA rules out the right arm, complex PCI
 * needs a femoral access), so their fallback is another of the step's preferred or accepted sites; steps
 * 3 and 5 only prefer the radial and step 1 has already removed what cannot be used, so any other usable
 * site will do. When the step's set holds no other site, any other usable site.
 */
export function fallbackSites(d: RouteDecision, first: PlanSiteId): PlanSiteId[] {
  const usable = d.usable.filter((id) => id !== first);
  if (d.step !== 2 && d.step !== 4) return usable;
  const stepSites = [...d.preferred, ...d.accepted].filter((id) => id !== first && usable.includes(id));
  return stepSites.length ? stepSites : usable;
}

/** Score a plan against the card: the site, the sheath, the fallback and (wrist sites) the spasm plan. */
export function scoreRoutePlan(c: RouteCard, plan: RoutePlan): RouteScore {
  const d = decideRoute(c);
  const ok = [...d.preferred, ...d.accepted];
  const answer = d.preferred.length ? `${cap(list(d.preferred))}${d.accepted.length ? `; also ${list(d.accepted)}` : ""} (${STEP_TEXT[d.step]}: ${d.reason})` : `No usable site (${d.reason})`;
  const siteOk = ok.includes(plan.site);
  const why = d.excluded[plan.site];
  const site: PlanItem = { correct: siteOk, expected: answer, given: `${siteName(plan.site)}${why ? ` (excluded: ${why})` : ""}` };
  const fb = plan.fallback;
  const allowed = fallbackSites(d, plan.site);
  const fallback: PlanItem =
    fb === null
      ? { correct: false, expected: allowed.length ? `A usable fallback, e.g. ${list(allowed.slice(0, 2))}` : "A fallback named", given: "No fallback" }
      : fb === plan.site
        ? { correct: false, expected: "A different site from the first", given: siteName(fb) }
        : d.excluded[fb]
          ? { correct: false, expected: "A fallback that can be used", given: `${siteName(fb)} (excluded: ${d.excluded[fb]})` }
          : !allowed.includes(fb)
            ? { correct: false, expected: `A fallback the deciding step allows (${STEP_TEXT[d.step]}): ${list(allowed)}`, given: siteName(fb) }
            : { correct: true, expected: "A usable fallback", given: siteName(fb) };
  const sheath = scoreSheath(c, plan);
  const spasm = PLAN_SITE_BY_ID[plan.site].wrist ? scoreSpasm(c, plan) : null;
  return { decision: d, site, sheath, fallback, spasm, correct: site.correct && sheath.correct && fallback.correct && (spasm?.correct ?? true) };
}

// ---------------------------------------------------------------------------
// The sheath's share of radial spasm
// ---------------------------------------------------------------------------

/**
 * MODEL PARAMETER: spasm drive from a sheath large for the radial artery (pm-engaging-spasm: 'sheath or
 * catheter large for the artery'), per second while a device is in the arm, per unit of outer diameter
 * above the artery's diameter. The patient's anxiety, sedation, local anaesthetic and the vasodilators
 * act through the session's existing spasm inputs; this is the term those inputs lack.
 */
export const MP_SHEATH_SPASM = { drivePerS: 0.01 };

/** Spasm rise per second from the sheath's size (0 when the sheath is no wider than the artery). */
export function sheathSpasmDrivePerS(sheathOdMm: number, arteryMm: number): number {
  return MP_SHEATH_SPASM.drivePerS * Math.max(0, sheathOdMm / Math.max(0.5, arteryMm) - 1);
}
