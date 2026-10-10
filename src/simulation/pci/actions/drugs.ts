// ---------------------------------------------------------------------------
// Drugs, the ACT and the bail-out actions: the lab gives each drug to the
// patient engine; here it is recorded and its effect on the complications
// applied.
//
// The antithrombotic orders (pci-antithrombotic-orders) add, on the same
// record (the telemetry in st.log, so a replay rebuilds them):
//   - the case's antithrombotic context (the ACT machine, suspected HIT, a CTO
//     strategy, settings that forbid an IV antiplatelet agent), declared once
//     by the lab from the run's variant (declareAntithrombotic);
//   - the regimen in force (heparin or bivalirudin, an IV antiplatelet agent
//     running), the recheck clock and the device- and regimen-specific ACT gate
//     (actGateFor) and the 'low-act' rule (lowActFor), from lesionAssessment.ts;
//   - protamine with dose, rate and a drawn reaction 5-10 minutes later
//     (giveProtamine, protamineReactionLevel), dosing from ../doses.ts;
//   - the IV agents (eptifibatide, tirofiban, cangrelor, bivalirudin) with their
//     renal regimens, blocked conditions and penalised settings (orderIvAgent),
//     infusions started and stopped, oral P2Y12 loads with the cangrelor rule;
//   - the suspected-HIT work-up (4Ts, antibody test, heparin-free flush) and its
//     critical errors: any heparin, including a heparinised flush in use.
// Errors are kept as telemetry for the debrief ('critical-error' and
// 'antithrombotic-error'): the live event log shows only what the team would
// say (a refused order, the existing protamine-with-equipment warning).
// ---------------------------------------------------------------------------

import { applyBailout, cloneCx, gateNotes, onAspirate, type Bailout, type CxNote } from "../../complications/engine";
import { bailoutNoReflow, icDrugOnNoReflow, timiFor, type DrugRoute, type IcAgent } from "../../complications/noReflow";
import { bailoutThrombus } from "../../complications/thrombus";
import { activeSpasms, spasmDose } from "./bailouts";
import { log, tele, withNotes, type PciGeom, type PciScenario, type PciState } from "../state";
import { actClock, actGate, actTarget, lowActNow, type ActClock, type ActDevice, type ActGate, type ActRegimen, type ActTarget } from "../lesionAssessment";
import {
  EPTIFIBATIDE,
  IV_ANTIPLATELET_AVOID,
  MP_PROTAMINE_REACTION,
  PROTAMINE_RULES,
  TEACHING_VALUES_NOTE,
  ivRegimen,
  oralDuringCangrelorProblem,
  protamineRate,
  protamineReactionP,
  rateMatches,
  type IvAvoidContext,
  type OralAntiplatelet,
  type RenalFacts,
} from "../doses";
import { rnd } from "../rng";
import { antithromboticVariant } from "../scenarios/packs/antithrombotic";

export type PciDrug =
  | "heparin"
  | "protamine"
  | "ic-adenosine"
  | "ic-verapamil"
  | "ic-nitroprusside"
  | "ic-epinephrine"
  | "atropine"
  | "gp2b3a"
  // pci-antithrombotic-orders: the IV agents and the oral loads, recorded by name
  | "eptifibatide"
  | "tirofiban"
  | "cangrelor"
  | "bivalirudin"
  | "aspirin"
  | "clopidogrel"
  | "prasugrel"
  | "ticagrelor";

/** The IV agents the orders run as a bolus and an infusion. */
export type IvAgent = "eptifibatide" | "tirofiban" | "cangrelor" | "bivalirudin";
const ORAL: readonly PciDrug[] = ["aspirin", "clopidogrel", "prasugrel", "ticagrelor"];

/** Record a drug (the lab gives it to the patient engine) and apply its effect on complications. */
export function giveDrug(s: PciScenario, g: PciGeom, st0: PciState, drug: PciDrug, dose?: number, route?: "iv" | "ia" | "oral" | "crushed"): PciState {
  const before = antithromboticOf(st0);
  // an anticoagulant dose carries whether the case opened anticoagulated, so the record keeps the start's heparin after it
  const anticoag = drug === "heparin" || drug === "bivalirudin";
  let st = tele(st0, drug === "heparin" ? "heparin" : "drug", { drug, dose, ...(route ? { route } : {}), ...(anticoag ? { preHeparin: before.preHeparinised } : {}) });
  if (drug === "heparin") {
    st = { ...st, heparinGiven: true, act: null };
    if (antithromboticContextOf(st)?.hit) st = flagError(st, "heparin-in-hit", "Heparin given in suspected HIT: every heparin source must stop.", true);
  }
  // bivalirudin anticoagulates instead of heparin: the next ACT must follow the bolus
  if (drug === "bivalirudin") st = { ...st, heparinGiven: true, act: null };
  if (drug === "protamine") {
    if (st.device || st.tipMm > 0) st = log(st, "warn", "Protamine with equipment still in the coronary risks thrombosis on it.");
    if (before.anticoagulant === "bivalirudin" && before.heparinU === 0 && !before.preHeparinised) st = flagError(st, "protamine-for-bivalirudin", "Protamine given for bivalirudin, which has no antidote: stop the infusion and treat the bleeding site.");
    st = { ...st, protamine: true };
  }
  if ((drug === "clopidogrel" || drug === "prasugrel") && before.infusions.cangrelor) {
    const p = oralDuringCangrelorProblem(drug, true);
    if (p) st = flagError(st, "oral-during-cangrelor", p);
  }
  const map: Partial<Record<PciDrug, Bailout>> = {
    protamine: "protamine",
    "ic-adenosine": "ic-adenosine",
    "ic-verapamil": "ic-verapamil",
    "ic-nitroprusside": "ic-nitroprusside",
    "ic-epinephrine": "ic-epinephrine",
    atropine: "atropine",
    heparin: "heparin",
    gp2b3a: "gp2b3a",
    eptifibatide: "gp2b3a",
    tirofiban: "gp2b3a",
  };
  const b = map[drug];
  if (b) st = bailout(s, g, st, b);
  // pci-flow-closure: cangrelor acts on embolised thrombus as a GP IIb/IIIa inhibitor does (Brilakis 25.2); the
  // engine's bail-out list has no cangrelor, so the modules are called directly, through the recognition gate
  if (drug === "cangrelor") st = antiplateletOnEmboli(st, "cangrelor");
  return st;
}

/** An IV antiplatelet agent on the live emboli (thrombus and no-reflow), named only once recognised. */
function antiplateletOnEmboli(st: PciState, action: "cangrelor" | "gp2b3a"): PciState {
  const cx = cloneCx(st.cx);
  const notes: CxNote[] = [];
  for (const c of cx.list) {
    if (c.stage === "resolved") continue;
    if (c.kind === "thrombus") notes.push(...bailoutThrombus(c, action, st.t, cx.rng));
    if (c.kind === "no-reflow") notes.push(...bailoutNoReflow(c, action, st.t, cx.rng, { thrombus: !!c.data.thrombotic }));
  }
  if (!notes.length) return st;
  const r = gateNotes(cx, notes);
  return withNotes({ ...st, cx: r.cx }, r.notes);
}

// ===========================================================================
// Intracoronary drugs with a route (pci-flow-closure)
//
// Every intracoronary dose is given into the guide or distally: through a
// microcatheter (or a dual-lumen catheter) whose tip is in the vessel at or
// beyond the treated segment. Into the guide with no antegrade flow the drug
// refluxes (noReflow.ts routeEfficacy). Glyceryl trinitrate and the calcium channel
// blockers relax spasm (bailouts.ts spasmDose); a nitrate does nothing for
// no-reflow. The dose is recorded ('ic-drug' telemetry: agent, dose, route,
// the TIMI grade beyond the segment before it) for the debrief; the lab gives
// the same dose to the patient engine (giveDrug(drug, dose, 'ic'), the shared
// formulary; icFormularyDose). The dose ranges shown are the module's table
// (02-flow-embolism.ts:198-203, and 04-lab-drugs.ts:250 for nitroglycerin);
// the console shows them only as a teaching aid in guided practice.
// ===========================================================================

export type { IcAgent } from "../../complications/noReflow";

/** Where the syringe is connected: the guide's manifold, or the hub of the microcatheter in the vessel. */
export type IcRoute = "guide" | "microcatheter";

/** The agents, with each manual's dose as the module text gives it (generic names; µg unless stated). */
export const IC_AGENTS: Record<IcAgent, { label: string; brilakis: string; oxford: string; /** book, section and page (docs/curriculum/evidence/cm-flow-embolism.md; the module line in the comment) */ source: string; spasm: boolean; noReflow: boolean }> = {
  nicardipine: { label: "Nicardipine", brilakis: "100–300 µg; his preferred agent", oxford: "not listed", source: "Brilakis 3.2, p.43; Oxford ch 8, p.268 does not list it" /* 02-flow-embolism.ts:198 */, spasm: true, noReflow: true },
  nitroprusside: { label: "Nitroprusside", brilakis: "100–300 µg", oxford: "50–100 µg, repeatable", source: "Brilakis 3.2, p.43; Oxford ch 8, p.268" /* 02-flow-embolism.ts:199 */, spasm: false, noReflow: true },
  verapamil: { label: "Verapamil", brilakis: "1 mg over 2 minutes", oxford: "100–500 µg slowly, repeatable", source: "Brilakis 3.2, p.43; Oxford ch 8, p.268" /* 02-flow-embolism.ts:200 */, spasm: true, noReflow: true },
  adenosine: { label: "Adenosine", brilakis: "RCA 50–100 µg; left main 100–200 µg", oxford: "30–50 µg, repeatable", source: "Brilakis 3.2, p.44; Oxford ch 8, p.268" /* 02-flow-embolism.ts:201 */, spasm: false, noReflow: true },
  adrenaline: { label: "Adrenaline", brilakis: "for refractory no-reflow (no dose given)", oxford: "not listed", source: "Brilakis 19.9, p.364; Khan 2022 (COAR); Oliveri 2026" /* 02-flow-embolism.ts:202, 222 */, spasm: false, noReflow: true },
  gtn: { label: "Glyceryl trinitrate", brilakis: "100–300 µg, repeated if needed (spasm)", oxford: "100–250 µg", source: "Brilakis 3.2 and 25.2; Oxford ch 6" /* 04-lab-drugs.ts:250, 374 */, spasm: true, noReflow: false },
};

/**
 * A distal tip that can take the drug past the segment: a microcatheter on the wire whose tip is out in the
 * vessel and that takes contrast through its lumen. `beyond` says the tip is at or beyond the start of the
 * treated segment (a tip short of it delivers as the guide does).
 */
export function distalDelivery(g: PciGeom, st: PciState): { ok: boolean; tipMm: number; beyond: boolean } {
  const m = st.wire.micro;
  if (!m || m.tipMm <= 0) return { ok: false, tipMm: 0, beyond: false };
  return { ok: true, tipMm: m.tipMm, beyond: st.route.includes(g.lesion.vessel) && m.tipMm >= g.lesion.startMm };
}

/** The TIMI grade beyond the segment of the worst live no-reflow (null when there is none). */
function noReflowTimi(st: PciState): number | null {
  const nr = st.cx.list.filter((c) => c.kind === "no-reflow" && c.stage !== "resolved").sort((a, b) => b.severity - a.severity)[0];
  return nr ? Number(/TIMI (\d)/.exec(timiFor(nr.severity))?.[1] ?? 3) : null;
}

/**
 * Give an intracoronary agent by a route. Through the microcatheter it needs one out in the vessel (else
 * nothing is given and the team says so); into the guide it needs the guide engaged. Each live no-reflow
 * responds by the route and the agent (noReflow.icDrugOnNoReflow), each live spasm to nitroglycerin or a
 * calcium channel blocker (spasmDose); the notes pass the recognition gate.
 */
export function giveIcDrug(s: PciScenario, g: PciGeom, st0: PciState, o: { agent: IcAgent; doseUg: number; route: IcRoute }): PciState {
  void s;
  const dose = Math.max(0, o.doseUg);
  if (!(dose > 0)) return st0;
  const d = distalDelivery(g, st0);
  if (o.route === "microcatheter" && !d.ok) return log(st0, "warn", "There is no microcatheter out in the vessel: advance one over the wire first.");
  if (o.route === "guide" && !st0.guide.engaged) return log(st0, "warn", "The guide is not engaged: the drug would go into the aorta.");
  const route: DrugRoute = o.route === "microcatheter" && d.beyond ? "distal" : "guide";
  const timiBefore = noReflowTimi(st0);
  let st = tele(st0, "ic-drug", { agent: o.agent, doseUg: dose, route: o.route, distal: route === "distal", tipMm: d.tipMm, timiBefore, noReflow: timiBefore !== null });
  st = log(st, "info", `${IC_AGENTS[o.agent].label} ${Math.round(dose)} µg intracoronary ${o.route === "microcatheter" ? "through the microcatheter" : "into the guide"}.`);
  const cx = cloneCx(st.cx);
  const notes: CxNote[] = [];
  for (const c of cx.list) if (c.kind === "no-reflow" && c.stage !== "resolved") notes.push(...icDrugOnNoReflow(c, o.agent, dose, route, st.t));
  if (notes.length) {
    const r = gateNotes(cx, notes);
    st = withNotes({ ...st, cx: r.cx }, r.notes);
  }
  if (activeSpasms(st).length) st = spasmDose(st, o.agent, dose);
  return st;
}

/** The intracoronary doses given so far (the record's own: agent, dose, route, time). */
export function icDosesOf(st: Pick<PciState, "log">): { t: number; agent: IcAgent; doseUg: number; route: IcRoute }[] {
  return st.log.filter((r) => r.kind === "ic-drug").map((r) => ({ t: r.t, agent: r.data.agent as IcAgent, doseUg: Number(r.data.doseUg), route: r.data.route === "microcatheter" ? "microcatheter" : "guide" }));
}

/**
 * The same dose for the patient engine's formulary (src/simulation/patient/pharmacology.ts): its drug id,
 * the dose in the formulary's unit (verapamil in mg) and the intracoronary route. Null for adrenaline, which
 * the formulary gives IV and IM only (the package report names the formulary change it needs).
 */
export function icFormularyDose(agent: IcAgent, doseUg: number): { drug: "adenosine" | "verapamil" | "nitroprusside" | "nicardipine" | "gtn"; dose: number; route: "ic" } | null {
  if (agent === "adrenaline") return null;
  return { drug: agent, dose: agent === "verapamil" ? doseUg / 1000 : doseUg, route: "ic" };
}

/** Compatibility: an intracoronary vasodilator for slow flow. */
export function giveVasodilator(st: PciState): PciState {
  if (!st.slowFlow) return log(st, "info", "Intracoronary vasodilator given. Flow was already normal.");
  const r = applyBailout(st.cx, "ic-adenosine", st.t, {});
  return withNotes({ ...st, cx: r.cx }, r.notes);
}

/**
 * Record a measured ACT (from the patient engine's point-of-care test). An ACT above the top of the
 * goal range while an IV antiplatelet agent is running is kept as an error for the debrief
 * (pm-antithrombotics#6: the ACT is not pushed above 250 s while one runs).
 */
export function recordAct(st0: PciState, value: number, o: { sampleT?: number } = {}): PciState {
  const rec = antithromboticOf(st0);
  // the ACT describes the blood when it was drawn: the recheck clock runs from the sample (default: now)
  const sampleT = o.sampleT !== undefined && Number.isFinite(o.sampleT) ? Math.min(st0.t, Math.max(0, o.sampleT)) : st0.t;
  const data = sampleT < st0.t ? { value, sampleT } : { value };
  let st = log(tele({ ...st0, act: { value, t: sampleT } }, "act", data), "info", `ACT ${Math.round(value)} s.`);
  if (rec.ivAntiplatelet) {
    const target = actTarget(regimenOf(st0, rec), actDeviceOf(st0));
    if (target.maxS !== null && value > target.maxS) {
      st = flagError(st, "act-above-range-with-iv-agent", `ACT ${Math.round(value)} s with an IV antiplatelet agent running: the goal is ${target.minS}-${target.maxS} s (${target.source}).`);
    }
  }
  return st;
}

/**
 * Record an ACT the team reports. The scrub runs the sample and reports the result when it clots, the
 * ACT's own value in seconds later (src/simulation/team/roles/scrub.ts 'act-sample'), so the sample was
 * drawn `value` seconds before the report and the recheck clock runs from then.
 */
export function recordTeamAct(st: PciState, value: number): PciState {
  return recordAct(st, value, { sampleT: st.t - value });
}

/** When a recorded ACT's sample was drawn (the record's own time when none is stated). */
const actSampleT = (r: { t: number; data: Record<string, unknown> }) => (typeof r.data.sampleT === "number" && Number.isFinite(r.data.sampleT) ? r.data.sampleT : r.t);

/** Apply a bail-out action. */
export function bailout(s: PciScenario, g: PciGeom, st0: PciState, action: Bailout): PciState {
  let st = tele(st0, "bailout", { action });
  if (action === "oxygen") st = { ...st, oxygen: true };
  if (action === "aspiration-thrombectomy") st = { ...st, aspirated: true };
  if (action === "aspirate-guide") st = { ...st, cx: onAspirate(st.cx) };
  const lastSpan = st.stents[st.stents.length - 1];
  const r = applyBailout(st.cx, action, st.t, {
    span: lastSpan ? { route: lastSpan.route, fromMm: lastSpan.fromMm, toMm: lastSpan.toMm } : undefined,
    wireInBranch: (b) => st.route.includes(b),
    balloonInBranch: (b) => !!st.device && st.device.kind === "balloon" && st.route.includes(b) && st.device.centreMm - st.device.lengthMm / 2 < (g.byName.get(b)?.pathMm[0] ?? 0) + 3,
    thrombus: s.thrombus,
  });
  return withNotes({ ...st, cx: r.cx }, r.notes);
}

// ===========================================================================
// Antithrombotic orders (pci-antithrombotic-orders)
// ===========================================================================

/** What the case declares about anticoagulation (from its variant; absent: the lab's defaults). */
export interface AntithromboticContext {
  /** the lab's point-of-care ACT machine */
  actDevice: ActDevice;
  /** suspected type 2 HIT: no heparin from any source */
  hit: boolean;
  /** a CTO case's crossing strategy */
  cto?: "antegrade" | "retrograde" | null;
  /** settings in which an IV antiplatelet agent is not started (besides a CTO target and a perforation, which the lab sees itself) */
  avoid?: IvAvoidContext[];
}

/**
 * The lab's ACT machine when the case declares none: the lower-reading HemoTec, whose heparin-alone
 * floor (250 s, Brilakis 3.4) is the single gate the lab has always used.
 */
export const DEFAULT_ACT_DEVICE: ActDevice = "hemotec";

/**
 * The context a run declares, from its variant id (the run's seed: resolveScenario turns a non-ladder
 * variant into it) and its scenario; null when the run uses the lab's defaults. A CTO target is crossed
 * antegrade: the lab models no retrograde strategy, so none is declared.
 */
export function antithromboticContextForRun(variantSeed: string | null | undefined, s: Pick<PciScenario, "target">): AntithromboticContext | null {
  const v = antithromboticVariant(variantSeed);
  const cto = s.target.kind === "cto";
  if (!v && !cto) return null;
  return { actDevice: v?.actDevice ?? DEFAULT_ACT_DEVICE, hit: !!v?.hit, cto: cto ? "antegrade" : null };
}

/** Declare the case's antithrombotic context (once, at the start; a later declaration replaces it). */
export function declareAntithrombotic(st: PciState, ctx: AntithromboticContext): PciState {
  return tele(st, "antithrombotic-context", { ...ctx, avoid: ctx.avoid ? [...ctx.avoid] : [] });
}

/** The case's declared context, or null. */
export function antithromboticContextOf(st: Pick<PciState, "log">): AntithromboticContext | null {
  for (let i = st.log.length - 1; i >= 0; i--) {
    const r = st.log[i];
    if (r.kind !== "antithrombotic-context") continue;
    const d = r.data;
    return {
      actDevice: d.actDevice === "hemochron" ? "hemochron" : "hemotec",
      hit: d.hit === true,
      cto: d.cto === "antegrade" || d.cto === "retrograde" ? d.cto : null,
      avoid: Array.isArray(d.avoid) ? (d.avoid as IvAvoidContext[]) : [],
    };
  }
  return null;
}

/** The flush and pressure-line saline. */
export type FlushSolution = "heparinised" | "heparin-free";

/** Set the flush and pressure-line saline (in suspected HIT, heparin-free). */
export function setFlushSolution(st: PciState, solution: FlushSolution): PciState {
  return tele(st, "flush-solution", { solution });
}

/** Start an IV agent's infusion (rate in the formulary's infusion unit) or change its rate. */
export function startAgentInfusion(st: PciState, drug: IvAgent, rate: number): PciState {
  return tele(st, "infusion", { drug, action: "start", rate, ...(drug === "bivalirudin" ? { preHeparin: antithromboticOf(st).preHeparinised } : {}) });
}

/** What the record lists as running: the IV agents, and the legacy GP IIb/IIIa inhibitor of the thrombus bail-out. */
export type RunningAgent = IvAgent | "gp2b3a";

/** Stop an IV agent's infusion (or the legacy GP IIb/IIIa inhibitor). */
export function stopAgentInfusion(st: PciState, drug: RunningAgent): PciState {
  return tele(st, "infusion", { drug, action: "stop" });
}

/** A recorded order error (debrief truth: never on the live event log). */
export interface AntithromboticError {
  t: number;
  kind: string;
  text: string;
  critical: boolean;
}

function flagError(st: PciState, kind: string, text: string, critical = false): PciState {
  return tele(st, critical ? "critical-error" : "antithrombotic-error", { kind, text });
}

/** What the orders have done so far, rebuilt from the record. */
export interface AntithromboticRecord {
  /** heparin given in the lab, U (the start's own anticoagulation is counted by `preHeparinised`) */
  heparinU: number;
  /** the case opened anticoagulated by the team (setup.heparinised); it stays so after later doses */
  preHeparinised: boolean;
  /** the anticoagulant now: the one given last */
  anticoagulant: ActRegimen["anticoagulant"];
  /** last anticoagulant bolus (heparin or bivalirudin), s; the start counts as a dose at 0 */
  lastDoseT: number | null;
  /** last measured ACT */
  lastAct: { value: number; t: number } | null;
  /** IV agents given (bolus or infusion) and not stopped since, with the infusion rate when one runs */
  infusions: Partial<Record<RunningAgent, { rate: number | null; since: number }>>;
  /** a GP IIb/IIIa inhibitor or cangrelor is being given */
  ivAntiplatelet: boolean;
  /** protamine doses */
  protamine: { t: number; doseMg: number; mgPerMin: number | null }[];
  flush: FlushSolution;
  /** oral loads given */
  oral: { t: number; drug: OralAntiplatelet; dose: number; route: string }[];
}

const isIvAgent = (d: unknown): d is IvAgent => d === "eptifibatide" || d === "tirofiban" || d === "cangrelor" || d === "bivalirudin";
const isRunning = (d: unknown): d is RunningAgent => isIvAgent(d) || d === "gp2b3a";

/** Rebuild the antithrombotic record from the state's telemetry. */
export function antithromboticOf(st: Pick<PciState, "log" | "heparinGiven" | "act">): AntithromboticRecord {
  const ctx = antithromboticContextOf(st);
  let heparinU = 0;
  let lastHeparinT: number | null = null;
  let lastBivT: number | null = null;
  let lastActRec: { value: number; t: number } | null = null;
  // the first anticoagulant record says whether the case had opened anticoagulated (null: none yet)
  let firstPre: boolean | null = null;
  const infusions: AntithromboticRecord["infusions"] = {};
  const protamine: AntithromboticRecord["protamine"] = [];
  const oral: AntithromboticRecord["oral"] = [];
  let flush: FlushSolution = "heparinised";
  for (const r of st.log) {
    const d = r.data;
    if (r.kind === "heparin") {
      heparinU += Number(d.dose) || 0;
      lastHeparinT = r.t;
      firstPre = firstPre ?? d.preHeparin === true;
    } else if (r.kind === "drug") {
      if (d.drug === "bivalirudin") {
        lastBivT = r.t;
        firstPre = firstPre ?? d.preHeparin === true;
      }
      if (isRunning(d.drug)) infusions[d.drug] = { rate: infusions[d.drug]?.rate ?? null, since: infusions[d.drug]?.since ?? r.t };
      if (ORAL.includes(d.drug as PciDrug)) oral.push({ t: r.t, drug: d.drug as OralAntiplatelet, dose: Number(d.dose) || 0, route: String(d.route ?? "oral") });
    } else if (r.kind === "infusion" && isRunning(d.drug)) {
      if (d.action === "stop") delete infusions[d.drug];
      else {
        infusions[d.drug] = { rate: Number(d.rate) || 0, since: infusions[d.drug]?.since ?? r.t };
        if (d.drug === "bivalirudin") {
          lastBivT = lastBivT ?? r.t;
          firstPre = firstPre ?? d.preHeparin === true;
        }
      }
    } else if (r.kind === "act") lastActRec = { value: Number(d.value), t: actSampleT(r) };
    else if (r.kind === "protamine") protamine.push({ t: r.t, doseMg: Number(d.doseMg) || 0, mgPerMin: typeof d.mgPerMin === "number" && Number.isFinite(d.mgPerMin) ? d.mgPerMin : null });
    else if (r.kind === "flush-solution") flush = d.solution === "heparin-free" ? "heparin-free" : "heparinised";
  }
  const preHeparinised = st.heparinGiven && (firstPre ?? true) && !ctx?.hit;
  const biv = lastBivT !== null || !!infusions.bivalirudin;
  const anticoagulant: ActRegimen["anticoagulant"] = biv && (lastHeparinT === null || (lastBivT ?? 0) >= lastHeparinT) ? "bivalirudin" : lastHeparinT !== null || preHeparinised ? "heparin" : biv ? "bivalirudin" : "none";
  const doses = [lastHeparinT, lastBivT].filter((x): x is number => x !== null);
  const lastDoseT = doses.length ? Math.max(...doses) : preHeparinised ? 0 : null;
  const ivAntiplatelet = !!(infusions.eptifibatide || infusions.tirofiban || infusions.cangrelor || infusions.gp2b3a);
  return { heparinU, preHeparinised, anticoagulant, lastDoseT, lastAct: st.act ?? lastActRec, infusions, ivAntiplatelet, protamine, flush, oral };
}

type RecordInputs = Pick<PciState, "log" | "heparinGiven" | "act">;

/** The regimen in force (for the ACT target); `rec`: the record already rebuilt from this state. */
export function regimenOf(st: RecordInputs, rec?: AntithromboticRecord): ActRegimen {
  const r = rec ?? antithromboticOf(st);
  return { anticoagulant: r.anticoagulant, ivAntiplatelet: r.ivAntiplatelet, cto: antithromboticContextOf(st)?.cto ?? null };
}

/** The case's ACT machine (declared, else the lab's default). */
export function actDeviceOf(st: Pick<PciState, "log">): ActDevice {
  return antithromboticContextOf(st)?.actDevice ?? DEFAULT_ACT_DEVICE;
}

/** The recheck clock now: since the last anticoagulant dose and the last ACT. */
export function actClockOf(st: RecordInputs & Pick<PciState, "t">, rec?: AntithromboticRecord): ActClock {
  const r = rec ?? antithromboticOf(st);
  let lastActT: number | null = null;
  for (let i = st.log.length - 1; i >= 0 && lastActT === null; i--) if (st.log[i].kind === "act") lastActT = actSampleT(st.log[i]);
  return actClock({ t: st.t, lastDoseT: r.lastDoseT, lastActT });
}

/** The ACT target in force now. */
export function actTargetOf(st: RecordInputs, device: ActDevice = actDeviceOf(st), rec?: AntithromboticRecord): ActTarget {
  return actTarget(regimenOf(st, rec), device);
}

/**
 * The device- and regimen-specific ACT gate for the state: the regimen in force, the case's machine
 * (or `device`) and the last ACT measured since the last bolus. The recheck clock (an ACT older than 30
 * minutes is refused) applies only when the case has declared its antithrombotic context, so a case
 * that declares none keeps the lab's earlier behaviour on the lower-reading machine. The supervised
 * device gate (devices.ts) and the mentor's actOk (pciSession.ts) still call the legacy two-argument
 * actGate; they are meant to call this instead.
 */
export function actGateFor(st: RecordInputs & Pick<PciState, "t">, device: ActDevice = actDeviceOf(st)): ActGate {
  const rec = antithromboticOf(st);
  return actGate(st.act?.value ?? null, regimenOf(st, rec), device, antithromboticContextOf(st) ? actClockOf(st, rec) : null);
}

/** Whether the lab should raise 'low-act' now (lesionAssessment.lowActNow on this state). */
export function lowActFor(st: Pick<PciState, "log" | "heparinGiven" | "act" | "t" | "actTrue">, o: { device?: ActDevice; actTrue?: number | null } = {}): boolean {
  const rec = antithromboticOf(st);
  return lowActNow({
    lastAct: st.act?.value ?? null,
    actTrue: o.actTrue !== undefined ? o.actTrue : st.actTrue,
    regimen: regimenOf(st, rec),
    device: o.device ?? actDeviceOf(st),
    clock: actClockOf(st, rec),
  });
}

// ---------------------------------------------------------------------------
// Protamine
// ---------------------------------------------------------------------------

export interface ProtamineOrder {
  doseMg: number;
  /** given over this many minutes (0: a push) */
  overMin: number;
  /** how many of Brilakis's listed risk factors the patient has (03-antithrombotics.ts:210) */
  risks?: number;
}

/**
 * Give protamine: recorded with its rate, checked against the 50 mg cap and the 5 mg/min limit
 * (debrief), and a reaction drawn from the seeded generator that begins 5-10 minutes later (truth: the
 * patient engine shows it as hypotension; nothing is written to the live log).
 */
export function giveProtamine(s: PciScenario, g: PciGeom, st0: PciState, o: ProtamineOrder): PciState {
  const doseMg = Math.max(0, o.doseMg);
  const rate = protamineRate(doseMg, o.overMin);
  let st = giveDrug(s, g, st0, "protamine", doseMg);
  st = tele(st, "protamine", { doseMg, overMin: o.overMin, mgPerMin: Number.isFinite(rate.mgPerMin) ? rate.mgPerMin : null });
  if (doseMg > PROTAMINE_RULES.maxMg + 1e-9) st = flagError(st, "protamine-over-cap", `Protamine ${Math.round(doseMg)} mg: never more than ${PROTAMINE_RULES.maxMg} mg.`);
  if (!rate.ok) st = flagError(st, "protamine-fast", `Protamine at ${Number.isFinite(rate.mgPerMin) ? rate.mgPerMin.toFixed(1) : "bolus"} mg/min: no faster than ${PROTAMINE_RULES.maxRateMgPerMin} mg/min.`);
  const p = protamineReactionP({ doseMg, mgPerMin: rate.mgPerMin, risks: o.risks });
  const r = { ...st.rng };
  const u = rnd(r);
  const v = rnd(r);
  st = { ...st, rng: r };
  if (u < p) {
    const [a, b] = PROTAMINE_RULES.reactionOnsetMin;
    const onsetT = st.t + 60 * (a + (b - a) * v);
    st = tele(st, "protamine-reaction", { onsetT, level: rate.ok ? MP_PROTAMINE_REACTION.level : MP_PROTAMINE_REACTION.levelFast, p });
  }
  return st;
}

/** The protamine reactions drawn (truth, for the debrief and the engine coupling). */
export function protamineReactionsOf(st: Pick<PciState, "log">): { t: number; onsetT: number; level: number; p: number }[] {
  return st.log.filter((r) => r.kind === "protamine-reaction").map((r) => ({ t: r.t, onsetT: Number(r.data.onsetT), level: Number(r.data.level), p: Number(r.data.p) }));
}

/**
 * The loss of vascular tone (0..1) the protamine reactions cause at time t: nothing before onset, a
 * rise over MP_PROTAMINE_REACTION.riseS, then a fall with its half-life. The lab passes it to
 * engine.setVasodilation while it is above zero.
 */
export function protamineReactionLevel(st: Pick<PciState, "log">, t: number): number {
  const M = MP_PROTAMINE_REACTION;
  let out = 0;
  for (const x of protamineReactionsOf(st)) {
    if (t < x.onsetT) continue;
    const since = t - x.onsetT;
    const lv = x.level * Math.min(1, since / M.riseS) * Math.pow(0.5, Math.max(0, since - M.riseS) / M.halfLifeS);
    out = Math.max(out, lv);
  }
  return out < 0.01 ? 0 : out;
}

// ---------------------------------------------------------------------------
// IV agents
// ---------------------------------------------------------------------------

export interface IvAgentOrder {
  drug: IvAgent;
  /** each bolus in the formulary unit (µg; bivalirudin mg); 0 or absent: none */
  bolus?: number;
  /** infusion rate in the formulary infusion unit (µg/kg/min; bivalirudin mg/kg/h); absent: none */
  rate?: number;
  /** the patient's weight and kidneys */
  patient: RenalFacts;
}

/** The settings in which an IV antiplatelet agent should not be started now. */
export function ivAvoidNow(s: Pick<PciScenario, "target">, st: Pick<PciState, "log" | "perforation" | "cx">): IvAvoidContext[] {
  const out = new Set<IvAvoidContext>(antithromboticContextOf(st)?.avoid ?? []);
  if (s.target.kind === "cto") out.add("cto");
  if (st.perforation || st.cx.list.some((c) => c.kind === "perforation" && c.stage !== "resolved")) out.add("perforation");
  return [...out];
}

/**
 * Order an IV agent: refused when the regimen is blocked for the patient (eptifibatide on dialysis);
 * otherwise the bolus and the infusion are recorded (the lab gives them to the engine), with a rate
 * that is not the patient's renal regimen, an IV antiplatelet agent in a setting that forbids it and
 * bivalirudin in a CTO kept as errors for the debrief.
 */
export function orderIvAgent(s: PciScenario, g: PciGeom, st0: PciState, o: IvAgentOrder): { st: PciState; refused: string | null } {
  const reg = ivRegimen(o.drug, o.patient);
  if (reg.blocked) {
    let st = log(st0, "warn", `${reg.blocked.reason} The order is not given.`);
    st = flagError(st, `${o.drug}-blocked`, reg.blocked.reason);
    return { st, refused: reg.blocked.reason };
  }
  let st = st0;
  if (o.drug !== "bivalirudin") {
    for (const c of ivAvoidNow(s, st)) st = flagError(st, `iv-antiplatelet-${c}`, IV_ANTIPLATELET_AVOID[c].text);
  } else if (s.target.kind === "cto") {
    st = flagError(st, "bivalirudin-cto", "Bivalirudin in a CTO: it cannot be reversed if a perforation occurs; Brilakis prefers heparin.");
  }
  if (o.bolus && o.bolus > 0) st = giveDrug(s, g, st, o.drug, o.bolus, "iv");
  if (o.rate !== undefined && o.rate > 0) {
    st = startAgentInfusion(st, o.drug, o.rate);
    if (!rateMatches(reg, o.rate)) st = flagError(st, `${o.drug}-rate`, `${o.drug} at ${o.rate} ${reg.rateUnit}: the regimen for this patient is ${reg.rate} ${reg.rateUnit}.`);
  }
  return { st, refused: null };
}

/** Give an oral antiplatelet load (oral or crushed), recorded with its route; the cangrelor rule applies. */
export function giveOralLoad(s: PciScenario, g: PciGeom, st: PciState, drug: OralAntiplatelet, doseMg: number, route: "oral" | "crushed"): PciState {
  return giveDrug(s, g, st, drug, doseMg, route);
}

// ---------------------------------------------------------------------------
// Suspected HIT
// ---------------------------------------------------------------------------

/** The 4Ts pretest probability the learner records (ASH 2018: no test and no treatment when low). */
export type FourTs = "low" | "not-low";

export function recordFourTs(st: PciState, p: FourTs): PciState {
  return tele(st, "hit-4ts", { probability: p });
}

export function orderHitAntibody(st: PciState): PciState {
  return tele(st, "hit-antibody", {});
}

/** The HIT work-up recorded so far. */
export function hitWorkupOf(st: Pick<PciState, "log">): { fourTs: FourTs | null; antibodyOrdered: boolean } {
  let fourTs: FourTs | null = null;
  let antibodyOrdered = false;
  for (const r of st.log) {
    if (r.kind === "hit-4ts") fourTs = r.data.probability === "low" ? "low" : "not-low";
    if (r.kind === "hit-antibody") antibodyOrdered = true;
  }
  return { fourTs, antibodyOrdered };
}

/** Telemetry that puts the flush line to use: an injection, the wire leaving the guide, a device introduced. */
const LINE_IN_USE = new Set(["inject", "wire-out-of-guide", "device"]);

/**
 * Every recorded order error, with two derived from the record: the heparinised flush in use in
 * suspected HIT, and an eptifibatide infusion whose second bolus has not followed the first within the
 * regimen's gap (Brilakis 3.5, EPTIFIBATIDE.bolusGapMin) by `st.t` (default: the last record's time).
 */
export function antithromboticErrors(st: Pick<PciState, "log"> & { t?: number }): AntithromboticError[] {
  const out: AntithromboticError[] = [];
  const ctx = antithromboticContextOf(st);
  let flush: FlushSolution = "heparinised";
  let flushFlagged = false;
  const eptiBoluses: number[] = [];
  let eptiInfusion = false;
  for (const r of st.log) {
    if (r.kind === "critical-error" || r.kind === "antithrombotic-error") out.push({ t: r.t, kind: String(r.data.kind), text: String(r.data.text), critical: r.kind === "critical-error" });
    else if (r.kind === "flush-solution") flush = r.data.solution === "heparin-free" ? "heparin-free" : "heparinised";
    else if (ctx?.hit && !flushFlagged && flush === "heparinised" && LINE_IN_USE.has(r.kind)) {
      flushFlagged = true;
      out.push({ t: r.t, kind: "heparinised-flush-in-hit", text: "Heparinised flush in use in suspected HIT: the flushes and the pressure line must be heparin-free saline.", critical: true });
    }
    if (r.kind === "drug" && r.data.drug === "eptifibatide") eptiBoluses.push(r.t);
    if (r.kind === "infusion" && r.data.drug === "eptifibatide" && r.data.action !== "stop") eptiInfusion = true;
  }
  const now = st.t ?? (st.log.length ? st.log[st.log.length - 1].t : 0);
  const gapS = EPTIFIBATIDE.bolusGapMin * 60;
  if (eptiInfusion && eptiBoluses.length > 0 && eptiBoluses.length < EPTIFIBATIDE.boluses && now - eptiBoluses[0] > gapS) {
    out.push({ t: eptiBoluses[0] + gapS, kind: "eptifibatide-second-bolus", text: `Eptifibatide: the second bolus was not given ${EPTIFIBATIDE.bolusGapMin} minutes after the first (${EPTIFIBATIDE.sources.dose.who} ${EPTIFIBATIDE.sources.dose.loc}).`, critical: false });
  }
  return out.sort((a, b) => a.t - b.t);
}

/** One stretch of the case under one ACT target (actTargetHistory). */
export interface ActTargetSpan {
  /** from this time, s */
  fromT: number;
  device: ActDevice;
  regimen: ActRegimen;
  target: ActTarget;
}

/** Telemetry that can change the regimen or the machine, and so the ACT target. */
const REGIMEN_KINDS = new Set(["heparin", "drug", "infusion", "antithrombotic-context"]);

/**
 * The ACT targets that applied over the case, in order: one span from the start and one more at each
 * record (a dose, an infusion started or stopped, the declared context) after which the target or the
 * regimen changed. Rebuilt from the record, each span from the log up to the record that began it.
 */
export function actTargetHistory(st: Pick<PciState, "log" | "heparinGiven" | "act">): ActTargetSpan[] {
  // whether the case opened anticoagulated: the first anticoagulant record carries it, else the state says it
  let startHep = st.heparinGiven;
  for (const r of st.log) {
    const anticoag = r.kind === "heparin" || (r.kind === "drug" && r.data.drug === "bivalirudin") || (r.kind === "infusion" && r.data.drug === "bivalirudin" && r.data.action !== "stop");
    if (anticoag) {
      startHep = r.data.preHeparin === true;
      break;
    }
  }
  const out: ActTargetSpan[] = [];
  let anticoagSeen = false;
  const at = (n: number, fromT: number) => {
    const pre = { log: st.log.slice(0, n), heparinGiven: startHep || anticoagSeen, act: null };
    const rec = antithromboticOf(pre);
    const device = actDeviceOf(pre);
    const regimen = regimenOf(pre, rec);
    const target = actTarget(regimen, device);
    const last = out[out.length - 1];
    const same = last && last.device === device && last.target.minS === target.minS && last.target.maxS === target.maxS && last.regimen.anticoagulant === regimen.anticoagulant && last.regimen.ivAntiplatelet === regimen.ivAntiplatelet;
    if (!same) out.push({ fromT, device, regimen, target });
  };
  // the start: the case's context is declared before anything is done, so it counts from the start
  let n0 = 0;
  while (n0 < st.log.length && st.log[n0].kind !== "antithrombotic-context" && !REGIMEN_KINDS.has(st.log[n0].kind)) n0++;
  const ctxFirst = n0 < st.log.length && st.log[n0].kind === "antithrombotic-context";
  at(ctxFirst ? n0 + 1 : 0, 0);
  st.log.forEach((r, i) => {
    if (!REGIMEN_KINDS.has(r.kind) || (ctxFirst && i === n0)) return;
    if (r.kind === "heparin" || (r.data.drug === "bivalirudin" && r.data.action !== "stop")) anticoagSeen = true;
    at(i + 1, r.t);
  });
  return out;
}

const regimenText = (r: ActRegimen) => {
  const a = r.anticoagulant === "none" ? "no anticoagulant yet" : r.anticoagulant;
  return `${a}${r.ivAntiplatelet ? " with an IV antiplatelet agent" : ""}${r.cto ? ` (CTO, ${r.cto})` : ""}`;
};
const rangeText = (t: ActTarget) => `${t.minS}${t.maxS ? `-${t.maxS}` : "+"} s`;

/** The debrief's antithrombotic lines (doses are labelled as teaching values). */
export function antithromboticDebrief(st: Pick<PciState, "log" | "heparinGiven" | "act" | "t">): { ok: boolean; text: string }[] {
  const items: { ok: boolean; text: string }[] = [];
  const rec = antithromboticOf(st);
  const target = actTargetOf(st, actDeviceOf(st), rec);
  const machineText = (d: ActDevice) => (d === "hemochron" ? "higher-reading machine (Hemochron in the lesson)" : "lower-reading machine (HemoTec in the lesson)");
  // the targets that applied over the case, each from when its regimen began
  const spans = actTargetHistory(st);
  const oneMachine = spans.every((x) => x.device === spans[0].device);
  const spanText = spans
    .map((x, i) => `${rangeText(x.target)} on ${regimenText(x.regimen)}${i === 0 ? "" : ` from minute ${Math.floor(x.fromT / 60)}`}${oneMachine ? "" : ` (${machineText(x.device)})`}${x.target.specified ? "" : " (not specified by the manuals: nearest figure applied)"}`)
    .join("; ");
  items.push({ ok: true, text: `ACT targets in this case${oneMachine ? ` on the ${machineText(spans[0].device)}` : ""}: ${spanText}.` });
  if (rec.lastAct) {
    const v = rec.lastAct.value;
    const above = rec.ivAntiplatelet && target.maxS !== null && v > target.maxS;
    items.push({ ok: v >= target.minS && !above, text: `Last ACT ${Math.round(v)} s${above ? `: above the ${target.maxS} s top of the goal with an IV antiplatelet agent running` : ""}.` });
  }
  for (const e of antithromboticErrors(st)) items.push({ ok: false, text: `${e.critical ? "Critical error: " : ""}${e.text}` });
  const rx = protamineReactionsOf(st);
  if (rx.length) items.push({ ok: false, text: `A protamine reaction began ${Math.round((rx[0].onsetT - rx[0].t) / 60)} minutes after the dose.` });
  items.push({ ok: true, text: TEACHING_VALUES_NOTE });
  return items;
}
