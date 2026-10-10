// ---------------------------------------------------------------------------
// Drug orders, shared by the scrub nurse and the sedation nurse/anaesthetist.
//
// A verbal drug order is complete when it states the drug, the dose and the
// route (fact C4-F7). The nurse resolves the order against the S9 drug table
// (pharmacology.ts DRUGS: unit and routes) and the patient's weight, and
// either asks one question (missing dose, unit or route; a unit that does not
// fit the drug; a dose above the model query threshold) or reads the order
// back in full before acting (fact C4-F7: check-back before administration).
// ---------------------------------------------------------------------------

import { DRUGS, type DrugId, type Route } from "../../patient/pharmacology";
import type { TeamCore } from "../agent";
import { DRUG_SPOKEN, ROUTE_SPOKEN, spokenDose } from "../intents";
import { QUERY_ABOVE, QUERY_ABOVE_IV_ADENOSINE } from "../params";
import type { DoseUnit, Order, TeamIntent } from "../types";

type DrugIntent = Extract<TeamIntent, { k: "drug" }>;

/**
 * Drugs whose route changes the order's meaning enough that the nurse asks rather than assumes.
 * Nitroprusside and nicardipine: intracoronary against systemic (found-patient-formulary). The oral
 * antiplatelets default to swallowed whole unless "crushed" is said.
 */
const ROUTE_MATTERS: DrugId[] = ["gtn", "adenosine", "verapamil", "adrenaline", "heparin", "nitroprusside", "nicardipine", "aminophylline"];

export interface ResolvedDrug {
  drug: DrugId;
  /** dose in the drug's own unit */
  dose: number;
  unit: DoseUnit;
  route: Route;
  side?: "left" | "right";
  /** "70 units per kilo for 80 kilos" (the read-back then gives the total) */
  perKgNote?: string;
}

export interface DrugQuery {
  reason: "dose" | "unit" | "unit-mismatch" | "route" | "route-unusual" | "large-dose" | "weight" | "infusion-only";
  text: string;
  /** what "yes" accepts */
  accept?: Partial<DrugIntent>;
}

const spokenUnit: Record<DoseUnit, string> = { mg: "milligrams", "µg": "micrograms", U: "units", mL: "millilitres" };

/** True when the order stated drug, dose and route (unit implied only for heparin's units). */
export function drugOrderComplete(i: DrugIntent): boolean {
  const spec = DRUGS[i.drug];
  return i.dose !== undefined && (i.unit !== undefined || spec.unit === "U") && (i.route !== undefined || spec.routes.length === 1);
}

function roundDose(x: number, unit: DoseUnit): number {
  if (unit === "U") return Math.round(x / 100) * 100;
  if (x >= 100) return Math.round(x);
  if (x >= 10) return Math.round(x * 10) / 10;
  return Math.round(x * 100) / 100;
}

export function readbackText(r: ResolvedDrug): string {
  const route = ROUTE_SPOKEN[r.route];
  const side = r.route === "ic" && r.side ? `, ${r.side}` : "";
  const head = r.perKgNote ? `${r.perKgNote}: ` : "";
  return `${head}${spokenDose(r.dose, r.unit)} of ${DRUG_SPOKEN[r.drug]} ${route}${side}.`;
}

/** Resolve a drug order, or say what the nurse must ask first. */
export function resolveDrug(core: TeamCore, i: DrugIntent): { ok: ResolvedDrug } | { query: DrugQuery } {
  const spec = DRUGS[i.drug];
  const name = DRUG_SPOKEN[i.drug];
  const cap = name.charAt(0).toUpperCase() + name.slice(1);
  if (spec.bolus === false) return { query: { reason: "infusion-only", text: `${cap} goes up as an infusion, not a bolus.` } };
  if (i.dose === undefined || !(i.dose > 0)) return { query: { reason: "dose", text: `How much ${name}?` } };
  let unit = i.unit;
  if (unit === "mL") return { query: { reason: "unit-mismatch", text: `What's that in ${spokenUnit[spec.unit]}?` } };
  if (unit === undefined) {
    if (spec.unit === "U") unit = "U";
    else {
      const guess: DrugIntent = { ...i, unit: spec.unit };
      const r = resolveDrug(core, guess);
      const rest = "ok" in r ? readbackText(r.ok).replace(/\.$/, "") : `${spokenDose(i.dose, spec.unit)} of ${name}`;
      return { query: { reason: "unit", text: `Is that ${rest}?`, accept: { unit: spec.unit } } };
    }
  }
  if ((unit === "U") !== (spec.unit === "U")) return { query: { reason: "unit-mismatch", text: `${cap} is in ${spokenUnit[spec.unit]}. How many ${spokenUnit[spec.unit]}?` } };
  let dose = i.dose;
  if (unit === "mg" && spec.unit === "µg") dose *= 1000;
  if (unit === "µg" && spec.unit === "mg") dose /= 1000;
  let perKgNote: string | undefined;
  if (i.perKg) {
    const w = core.patient?.profile.weightKg;
    if (!w) return { query: { reason: "weight", text: `I don't have a weight. What total dose of ${name}?` } };
    const total = roundDose(dose * w, spec.unit);
    perKgNote = `${spokenDose(i.dose, unit)} per kilo for ${w} kilos`;
    dose = total;
  }
  let route = i.route;
  if (route === undefined) {
    if (spec.routes.length === 1) route = spec.routes[0];
    else if (ROUTE_MATTERS.includes(i.drug)) {
      const opts = spec.routes.map((r) => ROUTE_SPOKEN[r]);
      const list = opts.length === 2 ? `${opts[0]} or ${opts[1]}` : `${opts.slice(0, -1).join(", ")} or ${opts[opts.length - 1]}`;
      return { query: { reason: "route", text: `${spokenDose(dose, spec.unit)} of ${name}, ${list}?` } };
    } else route = spec.routes[0];
  }
  if (!spec.routes.includes(route)) return { query: { reason: "route-unusual", text: `${cap} ${ROUTE_SPOKEN[route]}? Can you confirm the route?` } };
  const side = route === "ic" ? i.side : undefined;
  const ok: ResolvedDrug = { drug: i.drug, dose: roundDose(dose, spec.unit), unit: spec.unit, route, side, perKgNote };
  const limit = i.drug === "adenosine" && route === "iv" ? QUERY_ABOVE_IV_ADENOSINE : QUERY_ABOVE[i.drug];
  if (ok.dose > limit) return { query: { reason: "large-dose", text: `That's a big dose. Can you confirm ${readbackText(ok).replace(/\.$/, "")}?`, accept: {} } };
  return { ok };
}

/** A misheard dose: a factor of ten either way (the classic decimal slip). */
export function mishear(core: TeamCore, r: ResolvedDrug): ResolvedDrug {
  const f = r.dose >= 10 ? core.pick([0.1, 10]) : 10;
  return { ...r, dose: roundDose(r.dose * f, r.unit), perKgNote: undefined };
}

/**
 * Handle a drug order: query, or read back and then give (IV/IM) or draw up for the table (IC/IA).
 * `skipReadback` is set when the operator has just confirmed a query that stated the full order.
 */
export function receiveDrugOrder(core: TeamCore, order: Order, skipReadback = false) {
  const i = order.heard as DrugIntent;
  const role = order.role;
  const res = resolveDrug(core, i);
  if ("query" in res) {
    core.updateOrder(order, { status: "queried", queryReason: res.query.reason });
    core.setMem(`query.${order.id}.accept`, res.query.accept ? JSON.stringify(res.query.accept) : null);
    core.say(role, res.query.text, "query", { to: "operator", orderId: order.id });
    return;
  }
  let r = res.ok;
  let end = core.t;
  if (!skipReadback) {
    if (core.chance(core.P.mishearP)) {
      r = mishear(core, r);
      order.misheard = true;
      core.telemetry("team.misheard", { orderId: order.id, said: res.ok.dose, heard: r.dose, drug: r.drug });
    }
    core.updateOrder(order, { status: "readback" });
    end = core.say(role, readbackText(r), "readback", { to: "operator", orderId: order.id });
  } else {
    core.updateOrder(order, { status: "in-progress" });
  }
  core.setMem(`drug.${order.id}`, JSON.stringify(r));
  const prep = r.route === "ic" || r.route === "ia" ? core.P.icPrepS : core.P.ivPrepS;
  core.schedule(end + core.rand(prep[0], prep[1]), "drug-ready", role, { orderId: order.id });
}

/** Timer: the drug is drawn up. IV/IM: given now. IC/IA: the syringe goes onto the table. */
export function drugReady(core: TeamCore, orderId: number) {
  const order = core.order(orderId);
  if (!order || order.status === "cancelled" || order.status === "done") return;
  const r = JSON.parse(String(core.mem(`drug.${orderId}`, "null"))) as ResolvedDrug | null;
  if (!r) return;
  if (order.status === "readback") core.updateOrder(order, { status: "in-progress" });
  if (r.route === "ic" || r.route === "ia") {
    const syr = { id: core.id(), orderId, drug: r.drug, dose: r.dose, route: r.route, side: r.side, readyAt: core.t };
    core.st.syringes.push(syr);
    core.say(order.role, `${spokenDose(r.dose, r.unit)} of ${DRUG_SPOKEN[r.drug]} for ${ROUTE_SPOKEN[r.route]}, drawn up and labelled, on the table.`, "report", { to: "operator", orderId });
    core.updateOrder(order, { status: "done", doneAt: core.t });
    core.act({ a: "syringe-ready", syringe: syr });
    core.telemetry("team.syringe-ready", { orderId, drug: r.drug, dose: r.dose, route: r.route });
    return;
  }
  core.patient?.give({ drug: r.drug, dose: r.dose, route: r.route });
  core.updateOrder(order, { status: "done", doneAt: core.t });
  core.telemetry("team.drug-given", { orderId, drug: r.drug, dose: r.dose, unit: r.unit, route: r.route, by: order.role, misheard: !!order.misheard });
  if (order.misheard) core.finding("safety", "misheard-dose-given", `${DRUG_SPOKEN[r.drug]} was given as ${spokenDose(r.dose, r.unit)} after a read-back that did not match the order.`);
  core.say(order.role, `${spokenDose(r.dose, r.unit)} of ${DRUG_SPOKEN[r.drug]} given at ${core.clock()}.`, "report", { to: "operator", orderId });
}

/** Operator gives a syringe from the table ("give it"). Returns false when there is none. */
export function administer(core: TeamCore, drug?: DrugId, sideHint?: "left" | "right" | null): boolean {
  const syr = [...core.st.syringes].reverse().find((s) => s.givenAt === undefined && (!drug || s.drug === drug));
  if (!syr) return false;
  const side = syr.side ?? sideHint ?? core.opts.catheterSide?.() ?? "left";
  syr.givenAt = core.t;
  core.patient?.give({ drug: syr.drug, dose: syr.dose, route: syr.route, side: syr.route === "ic" ? side : undefined });
  core.telemetry("team.drug-given", { orderId: syr.orderId, drug: syr.drug, dose: syr.dose, unit: DRUGS[syr.drug].unit, route: syr.route, side, by: "operator" });
  if (core.order(syr.orderId)?.misheard) core.finding("safety", "misheard-dose-given", `${DRUG_SPOKEN[syr.drug]} was drawn up and given as ${spokenDose(syr.dose, DRUGS[syr.drug].unit)} after a read-back that did not match the order.`);
  core.say("scrub", `${DRUG_SPOKEN[syr.drug].replace(/^./, (c) => c.toUpperCase())} in at ${core.clock()}, noted.`, "report", { to: "operator", orderId: syr.orderId });
  return true;
}
