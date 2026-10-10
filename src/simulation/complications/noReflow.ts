// ---------------------------------------------------------------------------
// Slow flow and no-reflow: impaired myocardial reperfusion despite an open
// epicardial vessel, mostly from distal embolisation of thrombus and plaque
// debris. Risk factors include high thrombus burden, lesion length > 15 mm
// and acute presentation (Attachaipanich 2026, facts C3).
// Bail-outs: intracoronary adenosine 50-200 µg, verapamil 100-250 µg,
// nitroprusside 50-200 µg, epinephrine 50-200 µg (doses in the review's
// Table 1), aspiration of thrombus.
// Severity maps onto TIMI flow (2, 1, 0). Probabilities, the response of each
// drug and the progression rate are MODEL PARAMETERS.
// ---------------------------------------------------------------------------

import { chance, hazardP, rnd, type RngState } from "../pci/rng";
import { newComplication, note, overt, treated } from "./common";
import type { Complication, CxContext, CxNote, CxState } from "./types";

export function timiFor(severity: number): string {
  return severity >= 0.9 ? "TIMI 0" : severity >= 0.6 ? "TIMI 1" : severity >= 0.25 ? "TIMI 2" : "TIMI 3";
}

export function noReflowRisk(o: { thrombus: boolean; lipid: boolean; ratio: number; lesionLengthMm: number; aspirated: boolean; stent: boolean }): number {
  let p = o.thrombus ? 0.3 : o.lipid ? 0.08 : 0.015;
  if (o.ratio >= 0.9) p *= 1.5;
  if (o.lesionLengthMm > 15) p *= 1.3;
  if (o.stent) p *= 1.2;
  if (o.aspirated) p *= 0.6;
  return Math.min(0.9, p);
}

export function maybeNoReflow(
  cx: CxState,
  t: number,
  o: { route: string[]; vessel: string; atMm: number; thrombus: boolean; lipid: boolean; ratio: number; lesionLengthMm: number; aspirated: boolean; stent: boolean }
): { c: Complication | null; notes: CxNote[] } {
  const existing = cx.list.find((c) => c.kind === "no-reflow" && c.stage !== "resolved");
  if (existing) return { c: null, notes: [] };
  if (!chance(cx.rng, noReflowRisk(o))) return { c: null, notes: [] };
  const sev = 0.3 + 0.5 * rnd(cx.rng);
  const c = newComplication(cx, t, "no-reflow", {
    route: o.route,
    vessel: o.vessel,
    atMm: o.atMm,
    lengthMm: 0,
    severity: sev,
    grade: timiFor(sev),
    cause: o.thrombus ? "distal embolisation of thrombus after dilatation" : "distal embolisation of plaque debris",
    stage: sev >= 0.6 ? "overt" : "prodrome",
    // pci-flow-closure: whether thrombus embolised, and whether the vasodilators will fail; derived from the draw
    // already made, so no further draw shifts the seed's later complications. A drawn no-reflow carries no
    // data.plaque: the plaque-debris rules (aspiration retrieves it, a stent over it worsens the flow) belong to
    // the flow starts that seed it (seedNoReflow), so drawn cases keep their aspiration and stent behaviour.
    data: { ...(o.thrombus ? { thrombotic: 1 } : {}), ...(sev >= MP_REFRACTORY_FROM_SEVERITY ? { refractory: 1 } : {}) },
  });
  return {
    c,
    notes: [
      sev >= 0.6
        ? note(t, c, "event", "danger", "Contrast barely creeps beyond the treated segment and does not clear: no-reflow.")
        : note(t, c, "cue", "warn", "Contrast clears slowly from the vessel beyond the treated segment."),
    ],
  };
}

/** Untreated slow flow worsens at this rate (per s) — MODEL PARAMETER. */
export const MP_NOREFLOW_WORSEN_PER_S = 1 / 150;

export function stepNoReflow(c: Complication, dt: number, ctx: CxContext, rng: RngState): CxNote[] {
  if (c.stage === "resolved" || c.stage === "treated") return [];
  // pci-flow-closure: a stent deployed over embolised plaque releases more debris (Brilakis 25.2)
  const plaqueNotes = stentOverPlaque(c, ctx);
  if (plaqueNotes.length) return plaqueNotes;
  if (c.severity < 0.95 && chance(rng, hazardP(MP_NOREFLOW_WORSEN_PER_S, dt))) {
    c.severity = Math.min(1, c.severity + 0.2);
    c.grade = timiFor(c.severity);
    const first = overt(c, ctx.t);
    return [note(ctx.t, c, "event", "danger", first ? "Flow beyond the treated segment has almost stopped: no-reflow." : `Flow is worse (${c.grade}).`)];
  }
  return [];
}

/** Fraction of severity each drug removes when it works, and its chance of working — MODEL PARAMETERS. */
export const MP_DRUG_RESPONSE: Record<string, { p: number; cut: number }> = {
  "ic-adenosine": { p: 0.6, cut: 0.45 },
  "ic-verapamil": { p: 0.6, cut: 0.4 },
  "ic-nitroprusside": { p: 0.6, cut: 0.45 },
  "ic-epinephrine": { p: 0.65, cut: 0.5 },
  "aspiration-thrombectomy": { p: 0.7, cut: 0.35 },
};

/**
 * The route-less intracoronary bail-outs (team orders with route 'ic', the assisted console's vasodilator) and
 * the agent each is. pci-flow-closure: they are guide injections, so they act by routeEfficacy('guide') at the
 * TIMI grade now, and a vasodilator does nothing in a refractory no-reflow (adrenaline still acts).
 */
const IC_BAILOUT_AGENT: Partial<Record<string, IcAgent>> = {
  "ic-adenosine": "adenosine",
  "ic-verapamil": "verapamil",
  "ic-nitroprusside": "nitroprusside",
  "ic-epinephrine": "adrenaline",
};

export function bailoutNoReflow(c: Complication, action: string, t: number, rng: RngState, o: { thrombus: boolean }): CxNote[] {
  if (c.stage === "resolved") return [];
  // pci-flow-closure: an IV antiplatelet agent acts on embolised thrombus, not on plaque debris
  if (action === "gp2b3a" || action === "cangrelor") return antiplateletOnNoReflow(c, action, t);
  const r = MP_DRUG_RESPONSE[action];
  if (!r) return [];
  c.bailouts.push(action);
  // aspiration retrieves thrombus or plaque debris; with neither there is little to retrieve
  if (action === "aspiration-thrombectomy" && !o.thrombus && !c.data.plaque && !c.data.thrombotic) return [note(t, c, "effect", "info", "Little material is aspirated.")];
  // the draw is made whatever the route, so the random stream after a bail-out is the same as before
  const works = chance(rng, r.p);
  const agent = IC_BAILOUT_AGENT[action];
  const blocked = !!agent && agent !== "adrenaline" && !!c.data.refractory;
  const efficacy = !agent ? 1 : blocked ? 0 : routeEfficacy("guide", c.severity);
  if (works && efficacy > 0) {
    const before = TIMI_NUM(c.severity);
    c.severity = Math.max(0, c.severity * (1 - r.cut * efficacy) - 0.05 * efficacy);
    c.grade = timiFor(c.severity);
    if (c.severity < 0.25) {
      treated(c, t, true);
      return [note(t, c, "effect", "good", "Flow is back to normal (TIMI 3).")];
    }
    // with antegrade flow (TIMI 2) the guide dose reaches the bed: it acts and counts as treatment, as before
    if (efficacy >= 1 || TIMI_NUM(c.severity) > before) {
      if (c.tTreated === null) c.tTreated = t;
      return [note(t, c, "effect", "good", `Flow improves (${c.grade}).`)];
    }
  }
  return [note(t, c, "effect", "warn", "No clear change in flow yet.")];
}

// ===========================================================================
// pci-flow-closure: distal delivery, the agents, refractory no-reflow and the
// two embolisation types.
//
// Every intracoronary drug has a route: into the guide, or distally through a
// microcatheter, an over-the-wire balloon or a dual-lumen catheter (Brilakis
// 19.9 and Oxford ch 8, as 02-flow-embolism.ts teaches: drug in the guide
// refluxes when there is no antegrade flow). Via the guide its efficacy
// falls with the flow beyond the segment (MP_GUIDE_EFFICACY_BY_TIMI); given
// distally it reaches the microvasculature. The agents: adenosine, verapamil,
// nitroprusside, nicardipine (Brilakis's preferred agent) and adrenaline
// (Brilakis 19.9: for refractory no-reflow); a nitrate does not help no-reflow
// (Oxford ch 8, 02-flow-embolism.ts:203). A refractory no-reflow (data.refractory)
// does not respond to the vasodilators; adrenaline restores it. Two distal
// vasodilator doses without a rise in TIMI grade mark it refractory for the lab
// (data.refractoryRaised), the threshold of lab request cm-flow-embolism#1
// ("a lab threshold chosen as an example", Brilakis gives no number).
// What embolised: data.thrombotic (thrombus: GP IIb/IIIa or cangrelor, heparin,
// aspiration) or data.plaque (debris: aspiration and vasodilators, laser if
// aspiration fails; a stent over it worsens it), Brilakis 25.2, 5.5.
// Every efficacy, probability and step below is a MODEL PARAMETER
// (docs/realism/facts/pkg-pci-flow-closure.md).
// ===========================================================================

/** The intracoronary agents for slow flow and spasm (the lab's names). */
export type IcAgent = "adenosine" | "verapamil" | "nitroprusside" | "nicardipine" | "adrenaline" | "gtn";
/** Where the syringe delivers: the guide, or the distal vessel (microcatheter, over-the-wire balloon, dual-lumen catheter). */
export type DrugRoute = "guide" | "distal";

/** A no-reflow drawn at or above this severity does not respond to the vasodilators (refractory) — MODEL PARAMETER. */
export const MP_REFRACTORY_FROM_SEVERITY = 0.72;
/** Distal vasodilator doses without a TIMI rise after which the lab calls the no-reflow refractory (cm-flow-embolism#1's example threshold). */
export const REFRACTORY_DISTAL_DOSES = 2;

/**
 * Fraction of a dose given into the guide that reaches the microvasculature beyond the segment, by the TIMI
 * grade now (0, 1, 2, 3): near nothing without antegrade flow (TIMI 0-1), since the drug refluxes into the
 * aorta; all of it with antegrade flow to the distal bed (TIMI 2-3), so a guide dose for slow flow acts as it
 * did before routes existed — MODEL PARAMETER (the books say the drug refluxes when there is no antegrade
 * flow; they give no fraction).
 */
export const MP_GUIDE_EFFICACY_BY_TIMI = [0.03, 0.08, 1, 1] as const;

/**
 * Fraction of the remaining severity a full distal dose of each agent removes (deterministic, so the same
 * dose in the same state gives the same response); 0 for a nitrate in no-reflow — MODEL PARAMETERS.
 */
export const MP_IC_AGENT_CUT: Record<IcAgent, number> = {
  adenosine: 0.45,
  verapamil: 0.45,
  nitroprusside: 0.45,
  nicardipine: 0.5,
  adrenaline: 0.55,
  gtn: 0,
};

/**
 * The lowest dose (µg) the manuals give for each agent, from the module's table (02-flow-embolism.ts:198-203,
 * Brilakis and Oxford): a smaller dose acts in proportion — MODEL PARAMETER (the proportionality). Adrenaline
 * has no dose in either manual (02-flow-embolism.ts:202); 50 µg is the 0.05 mg Brilakis notes for arrest
 * (02-flow-embolism.ts:500), used here only as the scale of a full dose — MODEL PARAMETER.
 */
export const IC_LOWEST_DOSE_UG: Record<IcAgent, number> = {
  adenosine: 30,
  verapamil: 100,
  nitroprusside: 50,
  nicardipine: 100,
  adrenaline: 50,
  gtn: 100,
};

const TIMI_NUM = (sev: number) => Number(/TIMI (\d)/.exec(timiFor(sev))?.[1] ?? 3);

/** How much of a dose reaches the microvasculature: distal 1, via the guide by the TIMI grade beyond the segment. */
export function routeEfficacy(route: DrugRoute, severity: number): number {
  return route === "distal" ? 1 : MP_GUIDE_EFFICACY_BY_TIMI[TIMI_NUM(severity)];
}

/** Dose factor: 1 at or above the manuals' lowest dose, in proportion below it — MODEL PARAMETER. */
export function doseFactor(agent: IcAgent, doseUg: number): number {
  return Math.max(0, Math.min(1, doseUg / IC_LOWEST_DOSE_UG[agent]));
}

/**
 * One intracoronary dose of `agent` by `route` acting on a no-reflow: deterministic. Via the guide with TIMI
 * 0-1 nearly nothing reaches the bed; distally the agent removes MP_IC_AGENT_CUT of the severity (a nitrate
 * nothing; a vasodilator nothing in a refractory no-reflow, where adrenaline works). A distal vasodilator dose
 * without a TIMI rise is counted; at REFRACTORY_DISTAL_DOSES of them the no-reflow is marked refractory.
 */
export function icDrugOnNoReflow(c: Complication, agent: IcAgent, doseUg: number, route: DrugRoute, t: number): CxNote[] {
  if (c.kind !== "no-reflow" || c.stage === "resolved") return [];
  c.bailouts.push(`ic-${agent}${route === "distal" ? "-distal" : ""}`);
  const before = TIMI_NUM(c.severity);
  const vasodilator = agent !== "adrenaline" && agent !== "gtn";
  const blocked = (vasodilator && !!c.data.refractory) || agent === "gtn";
  const effect = blocked ? 0 : MP_IC_AGENT_CUT[agent] * routeEfficacy(route, c.severity) * doseFactor(agent, doseUg);
  if (effect > 0) {
    c.severity = Math.max(0, c.severity * (1 - effect) - 0.05 * Math.min(1, effect / 0.3));
    c.grade = timiFor(c.severity);
  }
  const after = TIMI_NUM(c.severity);
  if (route === "distal" && vasodilator) {
    // only an adequate dose (at or above the manuals' lowest) that fails counts towards refractory
    if (after <= before && doseFactor(agent, doseUg) >= 1) c.data.distalFails = (c.data.distalFails ?? 0) + 1;
    if ((c.data.distalFails ?? 0) >= REFRACTORY_DISTAL_DOSES) c.data.refractoryRaised = 1;
  }
  if (c.severity < 0.25) {
    treated(c, t, true);
    return [note(t, c, "effect", "good", "Flow is back to normal (TIMI 3).")];
  }
  if (after > before) {
    if (c.tTreated === null) c.tTreated = t;
    return [note(t, c, "effect", "good", `Flow improves (${c.grade}).`)];
  }
  // the live log stays neutral whatever the route (no grade, no hint); flowDebrief explains the reflux of guide doses at TIMI 0-1
  return [note(t, c, "effect", "warn", "No clear change in flow yet.")];
}

/** Severity an IV antiplatelet agent removes from a thrombotic no-reflow (not from plaque debris) — MODEL PARAMETER. */
export const MP_ANTIPLATELET_CUT = 0.35;

/** GP IIb/IIIa or cangrelor on a no-reflow: thrombus responds, plaque debris does not (Brilakis 25.2). */
export function antiplateletOnNoReflow(c: Complication, action: string, t: number): CxNote[] {
  if (c.kind !== "no-reflow" || c.stage === "resolved") return [];
  c.bailouts.push(action);
  if (!c.data.thrombotic || c.data.plaque) return [note(t, c, "effect", "warn", "No clear change in flow yet.")];
  const before = TIMI_NUM(c.severity);
  c.severity = Math.max(0, c.severity * (1 - MP_ANTIPLATELET_CUT) - 0.03);
  c.grade = timiFor(c.severity);
  if (c.tTreated === null) c.tTreated = t;
  if (c.severity < 0.25) {
    treated(c, t, true);
    return [note(t, c, "effect", "good", "Flow is back to normal (TIMI 3).")];
  }
  return [note(t, c, "effect", TIMI_NUM(c.severity) > before ? "good" : "info", TIMI_NUM(c.severity) > before ? `Flow improves (${c.grade}).` : "Flow is a little better.")];
}

/** Severity added when a stent is deployed over embolised plaque — MODEL PARAMETER. */
export const MP_STENT_OVER_PLAQUE_WORSEN = 0.25;

/** A stent placed after the plaque embolised worsens the slow flow once (more debris released). */
function stentOverPlaque(c: Complication, ctx: CxContext): CxNote[] {
  const n = ctx.stents.length;
  if (c.data.stentsSeen === undefined) {
    c.data.stentsSeen = n;
    return [];
  }
  if (n <= c.data.stentsSeen) return [];
  c.data.stentsSeen = n;
  if (!c.data.plaque) return [];
  c.data.stentedOver = 1;
  c.severity = Math.min(1, c.severity + MP_STENT_OVER_PLAQUE_WORSEN);
  c.grade = timiFor(c.severity);
  overt(c, ctx.t);
  return [note(ctx.t, c, "event", "danger", `Flow is worse after the stent (${c.grade}): more debris has gone downstream.`)];
}

/**
 * Seed a no-reflow for a start state (no draw): `severity` 0..1, thrombotic or plaque debris, refractory or not.
 * Overt at once: the start opens after the run that showed it.
 */
export function seedNoReflow(
  cx: CxState,
  t: number,
  o: { route: string[]; vessel: string; atMm: number; severity: number; embolus: "thrombus" | "plaque"; refractory?: boolean; cause?: string }
): { c: Complication; notes: CxNote[] } {
  const sev = Math.max(0, Math.min(1, o.severity));
  const c = newComplication(cx, t, "no-reflow", {
    route: o.route,
    vessel: o.vessel,
    atMm: o.atMm,
    lengthMm: 0,
    severity: sev,
    grade: timiFor(sev),
    cause: o.cause ?? (o.embolus === "thrombus" ? "distal embolisation of thrombus after stenting a thrombus-laden lesion" : "distal embolisation of plaque debris"),
    stage: "overt",
    data: { [o.embolus === "thrombus" ? "thrombotic" : "plaque"]: 1, ...(o.refractory ? { refractory: 1 } : {}) },
  });
  return { c, notes: [note(t, c, "event", "danger", "Contrast barely creeps beyond the treated segment and does not clear: no-reflow.")] };
}
