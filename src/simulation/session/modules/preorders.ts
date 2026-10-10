// ---------------------------------------------------------------------------
// Full-case session module 'preorders' (proc-preprocedure-orders).
//
// The pre-procedure order sheet (src/simulation/session/preorders.ts) in a
// case: active only in the order sheet scenarios (scenarios/preorders.ts),
// whose case facts are PREORDER_CASES. What the learner does:
//   - sign(orders) writes the sheet: the oral anticoagulant plan, aspirin and
//     the P2Y12 inhibitor (agent, load, route, timing, an IV agent at the
//     PCI) and the kidney orders. Each order is scored against the module text
//     and written to the ledger; an incomplete sheet is refused with what is
//     missing. Signing plays the days and hours before the case: the patient
//     on the table is the one these orders leave;
//   - stateCeiling(ml) states the contrast ceiling for the time-out. The
//     time-out item 'renal' is refused until a number is stated; at the
//     time-out the ceiling is checked with contrastBudget.ts and becomes the
//     case's contrast budget (session.contrastBudgetMl), so it travels in the
//     SessionHandover to the diagnostic and PCI labs;
//   - setCatheterSet(set) chooses the diagnostic catheters at the table
//     (scored at the first catheter for a kidney at risk).
//
// Consequences come from the patient engine, not fixed rules:
//   - the anticoagulant left on board by the plan: a DOAC's effect after the
//     hold (the formulary's DOAC half-life) is set on the engine's
//     pharmacology, and the residual anticoagulant raises the baseline ACT
//     (patient.ts residualAnticoagActRiseS, the same rule the planning module
//     uses; a rise it already applied is counted once); warfarin's INR after
//     the hold (MP_PREORDERS.inrHalfH) does the same;
//   - the antiplatelet loads go through the engine's giveDrug with the oral
//     or crushed route, so the formulary's onset curves set the platelet
//     inhibition and the thrombus hazard: a load given hours before the case
//     is given and then aged by those hours on the formulary's own
//     pharmacology (Pharmacology.step), a load at the PCI is given at the
//     hand-over to PCI, and an opioid on board (given before arrival in the
//     STEMI case) delays it as the formulary's interaction does;
//   - the saline runs through engine.fluid: the share of the pre-procedure
//     infusion that stays in the circulation enters when the sheet is signed
//     (MP_PREORDERS), and the infusion runs on through the case. In LV
//     impairment an over-rate infusion raises the LVEDP; the breathlessness,
//     the falling saturation and the pulmonary oedema event follow from the
//     engine and the hypotension module's oedema model;
//   - contrast beyond the warning fraction of the stated ceiling raises
//     'high-contrast-volume' (contrastBudget.ts), and the nurse says when half
//     and all of it are used (Oxford's circulating nurse); whether the case
//     stayed within it is scored on return from each lab and at closure.
//
// The planning module's pre-procedure record is kept in step with the sheet:
// its anticoagulant, antiplatelet, metformin, NSAID and statin lines are the
// sheet's (before signing: what the patient takes; after: what the orders
// did), and the session chart's anticoagulation line likewise. A case opened
// past the chart had its orders written by the team (referenceOrders): they
// are applied without decisions.
//
// Imports CaseSession as a type only (modules/index.ts).
// ---------------------------------------------------------------------------

import type { LabEvent } from "../../../content/lab/tips";
import type { LabRaises } from "../../../content/lab/raisable/waiting";
import type { AntithromboticState, InfusionRecord, OralDose, P2y12Drug } from "../handover";
import type { CaseSession } from "../caseSession";
import type { SessionHook } from "../scenarios/index";
import type { CaseSessionModule } from "./index";
import type { PlanningModule } from "./planning";
import { Pharmacology, type DrugId, type InfusionOrder, type PharmaState, type Route } from "../../patient/pharmacology";
import { residualAnticoagActRiseS } from "../../patient/patient";
import { CONTRAST_BUDGET_DEFAULTS, type ContrastBudget } from "../../patient/contrastBudget";
import {
  CATHETER_SET_LABEL,
  MP_PREORDERS,
  OAC_INDICATION_TEXT,
  PREORDER_RULES,
  emptyOrders,
  infusionMlPerS,
  missingOrders,
  oacHoldRule,
  oacOnBoard,
  ordersSummary,
  preHydrationMl,
  preorderBudget,
  preorderCase,
  preorderPatient,
  referenceOrders,
  scoreCatheters,
  scoreCeiling,
  scoreOrders,
  type CatheterSet,
  type OacOnBoard,
  type OrderVerdict,
  type PreOrders,
  type PreorderCase,
} from "../preorders";

export const PREORDERS_MODULE_ID = "preorders";

/** MODEL PARAMETERS (session settings): the time to write and sign the sheet, s; a repeated stop line is not repeated within repeatStopS. */
export const MP_PREORDER_TIME = { signS: 60, ceilingS: 10, repeatStopS: 5 };

/** The case event this module reports: contrast past the warning fraction of the stated ceiling. */
export const PREORDER_EVENTS = ["high-contrast-volume"] as const satisfies readonly LabEvent[];

/** What this module can report, for every lab the case shows tips for (the reachability report reads it). */
export const raises: readonly LabRaises[] = (["access", "diagnostic", "pci"] as const).map((lab) => ({ lab, phases: [], events: PREORDER_EVENTS }));

/** A dose the sheet gave: session time of the dose (negative: before the case started). */
export interface PreorderDose {
  drug: DrugId;
  dose: number;
  unit: string;
  route: Route;
  at: number;
  /** the daily dose the patient arrived on (not an order of the sheet; the engine carries it as MP_PREORDERS.chronicAspirin) */
  chronic?: boolean;
}

export interface PreordersState {
  case: PreorderCase;
  /** the sheet as the panel last saved it (not yet signed) */
  draft: PreOrders;
  signed: { t: number; orders: PreOrders; afterTimeOut: boolean } | null;
  /** the case opened past the chart: the team wrote the orders (nothing is scored) */
  byTeam: boolean;
  /** the ceiling stated for the time-out, mL, and when */
  ceilingMl: number | null;
  ceilingAt: number | null;
  catheterSet: CatheterSet | null;
  doses: PreorderDose[];
  /** loads ordered 'at PCI', given at the hand-over to PCI */
  atPci: { drug: DrugId; dose: number; route: Route }[];
  ivAgent: InfusionRecord | null;
  /** what the anticoagulant plan left on board */
  onBoard: OacOnBoard | null;
  /** the baseline ACT rise this module applied, s */
  actRiseS: number;
  /** saline: the pre-procedure share given, and the in-case infusion (mL/s that stays in the circulation) */
  preHydrationMl: number;
  infusionMlS: number;
  infusedMl: number;
  /** the line the sheet last returned (shown under it) */
  note: string | null;
  /** what the orders did in the case (truth, for the debrief) */
  consequences: string[];
}

export interface PreordersModule extends CaseSessionModule {
  id: typeof PREORDERS_MODULE_ID;
  /** null outside the order sheet scenarios */
  readonly state: PreordersState | null;
  actions: {
    /** save the sheet as the panel holds it */
    update: (o: PreOrders) => void;
    /** sign the sheet (default: the saved draft); false when refused (the note says why) */
    sign: (o?: PreOrders) => boolean;
    stateCeiling: (ml: number) => boolean;
    setCatheterSet: (set: CatheterSet) => boolean;
    /** the contrast budget now with the stated ceiling, or null */
    budget: () => ContrastBudget | null;
    /** what is still missing before the sheet can be signed */
    missing: () => string[];
  };
}

/** The pre-procedure orders module of a session, when the case is an order sheet scenario. */
export function preordersOf(s: Pick<CaseSession, "mod">): PreordersModule | undefined {
  const m = s.mod<PreordersModule>(PREORDERS_MODULE_ID);
  return m?.state ? m : undefined;
}

/** What the engine offers beyond PatientPort (the real PatientEngine has all of it). */
interface EngineExtras {
  giveDrug?: (drug: DrugId, dose: number, route: Route) => { ok: boolean };
  startInfusion?: (o: InfusionOrder) => void;
  pharm?: Pharmacology;
}

const round1 = (x: number) => Math.round(x * 10) / 10;
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const UNIT: Partial<Record<DrugId, string>> = { aspirin: "mg", clopidogrel: "mg", prasugrel: "mg", ticagrelor: "mg", cangrelor: "µg", fentanyl: "µg" };
const P2Y12 = new Set<DrugId>(["clopidogrel", "prasugrel", "ticagrelor"]);
const DOAC_NAME: Record<string, string> = { apixaban: "Apixaban", rivaroxaban: "Rivaroxaban", edoxaban: "Edoxaban", dabigatran: "Dabigatran", warfarin: "Warfarin" };

/** A dose given `leadS` before now, aged on the formulary's own pharmacology (no circulation). Returns the bolus as it is now, or null once gone. */
export function ageBolus(b: PharmaState["boluses"][number], weightKg: number, leadS: number): PharmaState["boluses"][number] | null {
  const ph = new Pharmacology(weightKg);
  ph.st.boluses = [JSON.parse(JSON.stringify(b))];
  let left = Math.max(0, leadS);
  while (left > 1e-6) {
    const dt = Math.min(60, left);
    ph.step(dt);
    left -= dt;
  }
  return ph.st.boluses[0] ?? null;
}

export function createSessionModule(): PreordersModule {
  let s: CaseSession;
  let st: PreordersState | null = null;
  let lid = 0;
  let prevContrastMl = 0;
  let catheterScored = false;

  const now = () => round1(s.tS);
  const log = (kind: "action" | "nurse" | "event", text: string) => s.log.push({ t: now(), kind, text });
  const stop = (text: string) => {
    const last = s.attending[s.attending.length - 1];
    if (last && last.text === text && now() - last.t < MP_PREORDER_TIME.repeatStopS) return;
    const line = { id: `preorders-${++lid}`, t: now(), text, severity: "safety" as const, stop: true, critical: false };
    s.attending.push(line);
    s.log.push({ t: line.t, kind: "attending", text });
  };
  const eng = () => s.patient as unknown as EngineExtras;
  const patientFacts = () => preorderPatient(s.profile);
  const planning = () => s.mod<PlanningModule>("planning");

  /** Record a verdict; `note` follows the order given, and `then` (what the order did in the case, for the debrief) follows that. */
  const decideVerdict = (v: OrderVerdict, note?: string, then: string[] = []) => {
    if (!st || st.byTeam) return;
    const given = [note ? `${v.given} ${note}` : v.given, ...then].join(". ");
    s.decide({ id: `preorders-${v.id}`, stage: "chart", label: v.label, correct: v.correct, expected: v.expected, given, lessonId: v.lessonId, tipIds: v.tipIds });
  };

  // ---- doses -------------------------------------------------------------

  /** Give a dose now through giveDrug (or the port's give), recorded at `at`. */
  const giveNow = (drug: DrugId, dose: number, route: Route, at = now()): boolean => {
    const e = eng();
    let ok = true;
    if (typeof e.giveDrug === "function") ok = e.giveDrug(drug, dose, route).ok;
    else s.patient.give({ drug, dose, route });
    if (ok && st) st.doses.push({ drug, dose, unit: UNIT[drug] ?? "mg", route, at: round1(at) });
    return ok;
  };

  /** A dose given `leadS` before now: given through giveDrug, then aged on the engine's pharmacology by that time. */
  const giveBefore = (drug: DrugId, dose: number, route: Route, leadS: number): void => {
    const pharm = eng().pharm;
    const n = pharm ? pharm.st.boluses.length : 0;
    if (!giveNow(drug, dose, route, s.tS - leadS)) return;
    if (!pharm || leadS <= 0) return;
    const i = pharm.st.boluses.length - 1;
    if (i < n || pharm.st.boluses[i].drug !== drug) return;
    const aged = ageBolus(pharm.st.boluses[i], s.profile.weightKg, leadS);
    if (aged) pharm.st.boluses[i] = aged;
    else pharm.st.boluses.splice(i, 1);
  };

  // ---- the anticoagulant -------------------------------------------------

  /** Make the baseline ACT carry `riseS` of residual anticoagulant (counting what the planning module applied). */
  const setActRise = (riseS: number) => {
    if (!st) return;
    const planned = planning()?.state.actRiseS ?? 0;
    const delta = Math.round(riseS - planned - st.actRiseS);
    if (delta === 0) return;
    s.profile.act = { ...s.profile.act, baseline: s.profile.act.baseline + delta };
    st.actRiseS += delta;
  };

  /** Apply the anticoagulant plan; returns what it risked, by the verdict id it belongs to (also kept in state.consequences). */
  const applyOac = (o: PreOrders): Record<string, string[]> => {
    const out: Record<string, string[]> = {};
    if (!st) return out;
    const c = st.case;
    const ob = oacOnBoard(c, o.oac);
    st.onBoard = ob;
    if (!c.oac || !ob) return out;
    const risk = (id: string, text: string) => {
      st!.consequences.push(text);
      (out[id] ??= []).push(text);
    };
    const pharm = eng().pharm;
    if (ob.doacEffect !== null && c.oac.drug !== "warfarin") {
      const agent = c.oac.drug;
      pharm?.setDoac(agent, ob.doacEffect);
      s.profile.doac = { agent, hoursSinceDose: ob.sinceH ?? MP_PREORDERS.doacContinueH, effect: ob.doacEffect };
      setActRise(residualAnticoagActRiseS({ doac: { agent, effect: ob.doacEffect } }));
    } else if (ob.inr !== null) setActRise(residualAnticoagActRiseS({ inr: ob.inr }));
    // the chart's anticoagulation line says what the plan did
    const name = DOAC_NAME[c.oac.drug];
    const text =
      o.oac.strategy === "continue"
        ? c.oac.drug === "warfarin"
          ? `${c.oac.regimen} for ${OAC_INDICATION_TEXT[c.oac.indication]}: continued; INR today ${ob.inr}.`
          : `${c.oac.regimen} for ${OAC_INDICATION_TEXT[c.oac.indication]}: continued; last dose ${ob.sinceH} h ago.`
        : c.oac.drug === "warfarin"
        ? `${name} for ${OAC_INDICATION_TEXT[c.oac.indication]}: stopped ${ob.sinceH} h before${ob.bridged ? `, IV heparin bridge stopped ${PREORDER_RULES.bridgeUfhStopH} h before` : ""}; INR today ${ob.inr}.`
        : `${name} for ${OAC_INDICATION_TEXT[c.oac.indication]}: held; last dose ${ob.sinceH} h ago.`;
    if (s.chart.anticoag) s.chart.anticoag.text = text;
    // what the plan risks (truth, for the debrief: it goes into the ledger entry, nothing on the live screen says it)
    if (ob.bridged && (c.oac.indication === "af-low-risk" || c.oac.indication === "af-higher-risk"))
      risk("oac-strategy", "Bridging in atrial fibrillation: in BRIDGE it added major bleeding without fewer thromboembolic events.");
    if (o.oac.strategy === "hold" && ["mechanical-valve", "rheumatic-mitral", "thrombus-non-laminar"].includes(c.oac.indication))
      risk("oac-strategy", `Warfarin stopped without cover in ${OAC_INDICATION_TEXT[c.oac.indication]}: the INR fell to ${ob.inr} with nothing protecting against thrombosis.`);
    const rule = oacHoldRule(c.oac.drug, s.profile.renal.crclMlMin);
    if ((o.oac.strategy === "hold" || o.oac.strategy === "bridge") && (o.oac.holdH ?? 0) < rule.oxfordH)
      risk("oac-hold", `The hold was shorter than either manual's: the anticoagulant was still acting at the puncture (baseline ACT +${st.actRiseS + (planning()?.state.actRiseS ?? 0)} s).`);
    return out;
  };

  // ---- antiplatelets -----------------------------------------------------

  const applyAntiplatelet = (o: PreOrders) => {
    if (!st) return;
    const a = o.antiplatelet;
    const route: Route = a.route === "crushed" ? "crushed" : "oral";
    const beforeS = a.timing === "before" ? Math.min(MP_PREORDERS.maxHoursBefore, Math.max(0, a.hoursBefore ?? 0)) * 3600 : 0;
    if (a.aspirin === "load" && (a.aspirinMg ?? 0) > 0) {
      if (a.timing === "before") giveBefore("aspirin", a.aspirinMg!, route, beforeS);
      else giveNow("aspirin", a.aspirinMg!, route);
    }
    if (a.aspirin === "peri-procedural" && (a.aspirinMg ?? 0) > 0) st.atPci.push({ drug: "aspirin", dose: a.aspirinMg!, route });
    if (a.p2y12 && a.p2y12 !== "none" && (a.p2y12Mg ?? 0) > 0) {
      if (a.timing === "before") giveBefore(a.p2y12, a.p2y12Mg!, route, beforeS);
      else st.atPci.push({ drug: a.p2y12, dose: a.p2y12Mg!, route });
    }
  };

  /** The hand-over to PCI: the loads ordered for it, and the IV agent. */
  const onPciHandover = () => {
    if (!st) return;
    const due = st.atPci.splice(0);
    for (const d of due) giveNow(d.drug, d.dose, d.route);
    if (due.length) log("action", `Given at the PCI, as ordered: ${due.map((d) => `${d.drug} ${d.dose} mg ${d.route === "crushed" ? "crushed" : "orally"}`).join(", ")}.`);
    const signed = st.signed?.orders;
    if (signed?.antiplatelet.ivAgent && !st.ivAgent) {
      const C = PREORDER_RULES.cangrelor;
      giveNow("cangrelor", Math.round(C.bolusUgKg * s.profile.weightKg), "iv");
      const e = eng();
      if (typeof e.startInfusion === "function") e.startInfusion({ drug: "cangrelor", rate: C.infusionUgKgMin });
      st.ivAgent = { drug: "cangrelor", rate: C.infusionUgKgMin, startedS: now() };
      log("action", `Cangrelor ${C.bolusUgKg} µg/kg IV bolus, then ${C.infusionUgKgMin} µg/kg/min, as ordered.`);
    }
  };

  // ---- kidneys ------------------------------------------------------------

  const applyKidney = (o: PreOrders) => {
    if (!st) return;
    const pre = preHydrationMl(o.kidney, s.profile.weightKg);
    st.preHydrationMl = pre;
    if (pre > 0) s.patient.fluid(pre, MP_PREORDERS.preHydrationOverS);
    st.infusionMlS = infusionMlPerS(o.kidney, s.profile.weightKg);
    const k = o.kidney;
    if ((k.salineMlKgH ?? 0) > 0) log("action", `Normal saline ${k.salineMlKgH} mL/kg/h: ${k.salineBeforeH ?? 0} h before the case, running on through it.`);
  };

  // ---- the record and the chart -------------------------------------------

  /** The planning record's lines this module owns, by what they start with. */
  const OWNED = /^(Aspirin|P2Y12 inhibitor|Apixaban|Rivaroxaban|Edoxaban|Dabigatran|Direct oral anticoagulant|Warfarin|Metformin|Atorvastatin|Ibuprofen|Naproxen|Clarithromycin|Morphine)\b/;

  const sheetLines = (): string[] => {
    if (!st) return [];
    const c = st.case;
    const o = st.signed?.orders;
    const out: string[] = [];
    const doseOf = (drug: DrugId) => st!.doses.filter((d) => d.drug === drug && !d.chronic).slice(-1)[0];
    const when = (d: PreorderDose) => (d.at < -1 ? `${round1(-d.at / 3600)} h before the case` : "on the table");
    if (c.oac) {
      const ob = st.onBoard;
      out.push(
        !o || !ob
          ? `${c.oac.regimen} for ${OAC_INDICATION_TEXT[c.oac.indication]}: the peri-procedure plan is on the order sheet.`
          : o.oac.strategy === "continue"
          ? `${c.oac.regimen}: continued${ob.sinceH !== null && c.oac.drug !== "warfarin" ? `; last dose ${ob.sinceH} h ago` : ""}.`
          : `${DOAC_NAME[c.oac.drug]}: last dose ${ob.sinceH} h before the case, as ordered${ob.bridged ? `; IV heparin bridge stopped ${PREORDER_RULES.bridgeUfhStopH} h before` : ""}.`,
      );
    }
    const asp = doseOf("aspirin");
    out.push(asp ? `Aspirin ${asp.dose} mg loading dose: given ${when(asp)}.` : c.onAspirin ? "Aspirin 75 mg daily: last dose this morning." : o?.antiplatelet.aspirin === "peri-procedural" ? "Aspirin: due at the PCI." : "No aspirin given yet.");
    const p2 = st.doses.filter((d) => P2Y12.has(d.drug) && !d.chronic).slice(-1)[0];
    const pending = st.atPci.find((d) => P2Y12.has(d.drug));
    out.push(p2 ? `${cap(p2.drug)} ${p2.dose} mg loading dose: given ${when(p2)}${p2.route === "crushed" ? ", crushed" : ""}.` : pending ? `${cap(pending.drug)} ${pending.dose} mg: due at the PCI.` : "P2Y12 inhibitor: none given.");
    if (c.screen.opioidBeforeArrival) out.push(`${c.screen.opioidBeforeArrival}.`);
    if (c.screen.cyp3a) out.push(`${c.screen.cyp3a}.`);
    if (c.screen.highDoseStatin) out.push(`${c.screen.highDoseStatin}.`);
    if (c.meds.metformin) {
      const k = o?.kidney;
      out.push(k?.metformin === "hold" ? `Metformin: held from this morning; restart ${k.metforminRestartH} h after the case.` : "Metformin 1 g twice daily: last dose this morning, with breakfast.");
    }
    if (c.meds.nsaid) out.push(o?.kidney.nsaid === "hold" ? `${c.meds.nsaid.split(" ")[0]}: stopped.` : `${c.meds.nsaid}: last dose this morning.`);
    if (c.meds.statin) out.push(o?.kidney.statin === "stop" ? `${c.meds.statin.split(" ")[0]}: stopped.` : `${c.meds.statin}: last dose last night.`);
    return out;
  };

  /** Keep the planning record's lines in step with the sheet (idempotent; the record may be rebuilt by its module). */
  const syncRecord = () => {
    if (!st) return;
    const rec = planning()?.state.record;
    if (!rec) return;
    const meds = rec.items.find((i) => i.id === "medications");
    if (meds) {
      const kept = meds.lines.filter((l) => !OWNED.test(l) && !/^No aspirin given yet\./.test(l));
      const next = [...sheetLines(), ...kept];
      if (next.join("\n") !== meds.lines.join("\n")) meds.lines = next;
    }
    // the history the P2Y12 screen needs, in the pre-assessment or admission notes
    const notes = rec.items.find((i) => i.id === "pre-assessment");
    const sc = st.case.screen;
    const history = [sc.strokeOrTia && `${sc.strokeOrTia}.`, sc.ich && "Previous intracranial haemorrhage."].filter((x): x is string => !!x);
    if (notes && history.length && !history.every((h) => notes.lines.includes(h))) notes.lines = [...history, ...notes.lines.filter((l) => !history.includes(l))];
    const ob = st.onBoard;
    if (ob && ob.inr !== null) {
      const bloods = rec.items.find((i) => i.id === "bloods");
      if (bloods) {
        const want = `INR ${ob.inr} this morning.`;
        const next = bloods.lines.map((l) => (/^INR [\d.]+/.test(l) ? want : l));
        if (next.join("\n") !== bloods.lines.join("\n")) bloods.lines = next;
      }
    }
  };

  // ---- signing --------------------------------------------------------------

  const sign = (given?: PreOrders): boolean => {
    if (!st) return false;
    if (st.signed) {
      st.note = "The orders are already signed.";
      return false;
    }
    if (s.busy) return false;
    if (s.sites.some((x) => x.firstPassAt !== null)) {
      st.note = "The case has started: the pre-procedure orders can no longer be written.";
      return false;
    }
    const o: PreOrders = JSON.parse(JSON.stringify(given ?? st.draft));
    const miss = missingOrders(st.case, o);
    if (miss.length) {
      st.note = `Still to write: ${miss.join("; ")}.`;
      return false;
    }
    st.draft = JSON.parse(JSON.stringify(o));
    const afterTimeOut = s.timeOutDone;
    st.signed = { t: now(), orders: o, afterTimeOut };
    if (o.ceilingMl !== null && st.ceilingMl === null) stateCeilingNow(o.ceilingMl, false);
    const risked = applyOac(o);
    for (const v of scoreOrders(st.case, patientFacts(), o)) decideVerdict(v, afterTimeOut ? "(after the time-out)" : undefined, risked[v.id]);
    applyAntiplatelet(o);
    applyKidney(o);
    syncRecord();
    st.note = null;
    log("action", `Pre-procedure orders signed: ${ordersSummary(st.case, o)}.`);
    if (!st.byTeam) s.wait(MP_PREORDER_TIME.signS, "Writing the pre-procedure orders");
    return true;
  };

  const stateCeilingNow = (ml: number, spend = true): boolean => {
    if (!st || !(ml > 0) || !Number.isFinite(ml)) return false;
    st.ceilingMl = Math.round(ml);
    st.ceilingAt = now();
    st.draft.ceilingMl = st.ceilingMl;
    log("action", `Contrast ceiling for the time-out: ${st.ceilingMl} mL.`);
    if (spend && !st.byTeam) s.wait(MP_PREORDER_TIME.ceilingS, "Stating the contrast ceiling");
    return true;
  };

  const stateCeiling = (ml: number): boolean => {
    if (!st || s.busy) return false;
    if (s.timeOut.checked.renal) {
      st.note = "The renal item has been confirmed at the time-out; the ceiling stands.";
      return false;
    }
    return stateCeilingNow(ml);
  };

  const budget = (): ContrastBudget | null => {
    if (!st || st.ceilingMl === null) return null;
    return preorderBudget(patientFacts(), usedMl(), st.ceilingMl);
  };

  const usedMl = () => Math.max(s.totals.contrastMl, s.patient.vitals().contrast?.totalMl ?? 0);

  const setCatheterSet = (set: CatheterSet): boolean => {
    if (!st || s.catheter?.inBody || s.hookAt["catheter-in"] !== undefined) return false;
    st.catheterSet = set;
    const label = CATHETER_SET_LABEL[set];
    log("action", `Diagnostic catheters: ${label[0].toLowerCase()}${label.slice(1)}.`);
    return true;
  };

  // ---- hooks ---------------------------------------------------------------

  const onTimeOut = () => {
    if (!st) return;
    if (!st.byTeam) {
      s.decide({
        id: "preorders-signed",
        stage: "chart",
        label: "Pre-procedure orders written before the time-out",
        correct: !!st.signed && !st.signed.afterTimeOut,
        expected: "Anticoagulant, antiplatelet and kidney orders signed before the time-out",
        given: st.signed ? "Signed first" : "Not signed",
        lessonId: st.case.oac ? "pm-antithrombotics-oac" : st.case.presentation === "stable" && !st.case.meds.metformin ? "pm-antithrombotics-oral" : "cm-patient-complications-kidney",
        tipIds: ["pci-check-oral-loading"],
      });
      decideVerdict(scoreCeiling(patientFacts(), st.ceilingMl));
    }
    if (st.ceilingMl !== null) s.contrastBudgetMl = st.ceilingMl;
  };

  /** The case's contrast so far against the stated ceiling, scored (the same id each time: the last return or the closure stands). */
  const scoreKept = () => {
    if (!st || st.ceilingMl === null) return;
    const used = round1(usedMl());
    s.decide({
      id: "preorders-ceiling-kept",
      stage: "handover",
      label: "Contrast kept within the ceiling stated at the time-out",
      correct: used <= st.ceilingMl,
      expected: `At most ${st.ceilingMl} mL`,
      given: `${used} mL`,
      lessonId: "cm-patient-complications-contrast-budget",
      tipIds: ["pci-planning-contrast-ceiling", "pci-caki-after-case"],
    });
  };

  const onHook = (hook: SessionHook) => {
    if (!st) return;
    if (hook === "time-out") onTimeOut();
    else if (hook === "catheter-in" && !catheterScored) {
      catheterScored = true;
      const v = scoreCatheters(patientFacts(), st.catheterSet);
      if (v) decideVerdict(v);
    } else if (hook === "handover") {
      if (st.ceilingMl !== null) s.contrastBudgetMl = st.ceilingMl;
      if (s.handedOver === "pci") onPciHandover();
    } else if (hook === "return") {
      if (st.ceilingMl !== null) s.contrastBudgetMl = st.ceilingMl;
      scoreKept();
    } else if (hook === "closure") scoreKept();
  };

  let sliceAcc = 0;
  let sliceS = 0;
  const slowTick = (h: number) => {
    if (!st) return;
    // the saline runs on through the case
    if (st.infusionMlS > 0 && !s.finished) {
      sliceAcc += st.infusionMlS * h;
      sliceS += h;
      if (sliceS >= MP_PREORDERS.infusionSliceS) {
        s.patient.fluid(sliceAcc, sliceS);
        st.infusedMl += sliceAcc;
        sliceAcc = 0;
        sliceS = 0;
      }
    }
    // the nurse tells the operator at half and at all of the stated ceiling (never the rules' limit,
    // which may be lower: that is the debrief's to say)
    if (st.ceilingMl !== null && st.ceilingMl > 0) {
      const C = st.ceilingMl;
      const nowMl = usedMl();
      if (nowMl > prevContrastMl) {
        // only the highest fraction crossed is called (a jump past the ceiling is not also called as half)
        const crossed = CONTRAST_BUDGET_DEFAULTS.announceAt.filter((f) => prevContrastMl < f * C && nowMl >= f * C);
        const f = crossed.length ? Math.max(...crossed) : null;
        const ml = Math.round(nowMl);
        if (f !== null)
          log(
            "nurse",
            f >= 1
              ? ml > C
                ? `Contrast ${ml} mL: past the ${C} mL ceiling.`
                : `Contrast ${ml} mL: that is the ${C} mL ceiling.`
              : `Contrast ${ml} mL: half of the ${C} mL ceiling.`,
          );
        prevContrastMl = nowMl;
      }
    }
    syncRecord();
  };

  const events = (): LabEvent[] => {
    if (!st || st.ceilingMl === null) return [];
    // past the warning fraction of the stated ceiling (contrastBudget.ts's fraction)
    return usedMl() >= CONTRAST_BUDGET_DEFAULTS.warnFraction * st.ceilingMl ? ["high-contrast-volume"] : [];
  };

  const mod: PreordersModule = {
    id: PREORDERS_MODULE_ID,
    get state() {
      return st;
    },
    attach(session) {
      s = session;
      lid = 0;
      prevContrastMl = 0;
      catheterScored = false;
      sliceAcc = 0;
      sliceS = 0;
      const c = preorderCase(s.scenario.id);
      if (!c) {
        st = null;
        return;
      }
      st = {
        case: c,
        draft: emptyOrders(),
        signed: null,
        byTeam: s.startStage !== "chart",
        ceilingMl: null,
        ceilingAt: null,
        catheterSet: null,
        doses: [],
        atPci: [],
        ivAgent: null,
        onBoard: null,
        actRiseS: 0,
        preHydrationMl: 0,
        infusionMlS: 0,
        infusedMl: 0,
        note: null,
        consequences: [],
      };
      // what the patient has on board on arrival: the daily aspirin, an opioid before arrival
      if (c.onAspirin) giveBefore("aspirin", MP_PREORDERS.chronicAspirin.mg, "oral", MP_PREORDERS.chronicAspirin.leadH * 3600);
      st.doses = [];
      // ... kept as the patient's own daily dose, so the handover's antithrombotics carry it (not a loading dose)
      if (c.onAspirin)
        st.doses.push({ drug: "aspirin", dose: MP_PREORDERS.chronicAspirin.mg, unit: "mg", route: "oral", at: round1(s.tS - MP_PREORDERS.chronicAspirin.leadH * 3600), chronic: true });
      if (c.screen.opioidBeforeArrival) s.patient.give({ drug: "fentanyl", dose: MP_PREORDERS.opioidFentanylUg, route: "iv" });
      // the time-out's renal item waits for a stated ceiling; the handover carries the sheet's antithrombotics
      const own = s as unknown as { confirmTimeOutItem?: CaseSession["confirmTimeOutItem"]; antithrombotic?: CaseSession["antithrombotic"] };
      const confirm = s.confirmTimeOutItem;
      const anti = s.antithrombotic;
      own.confirmTimeOutItem = (id: string): void => {
        if (st && id === "renal" && !st.byTeam && st.ceilingMl === null && !s.timeOut.checked[id]) {
          stop("Renal function: what is the contrast ceiling for this patient? State it in mL on the order sheet before we confirm.");
          return;
        }
        confirm.call(s, id);
      };
      own.antithrombotic = (): AntithromboticState => {
        const base = anti.call(s);
        if (!st) return base;
        const last = <D extends string>(pred: (d: PreorderDose) => boolean): OralDose<D> | null => {
          const d = st!.doses.filter(pred).slice(-1)[0];
          return d ? { drug: d.drug as D, dose: d.dose, at: d.at } : null;
        };
        return {
          ...base,
          aspirin: last<"aspirin">((d) => d.drug === "aspirin") ?? base.aspirin,
          p2y12: last<P2y12Drug>((d) => P2Y12.has(d.drug)) ?? base.p2y12,
          infusions: [...base.infusions, ...(st.ivAgent ? [{ ...st.ivAgent }] : [])],
        };
      };
      // a case opened past the chart: the team wrote the orders and stated the ceiling
      if (st.byTeam) {
        const ref = referenceOrders(c, patientFacts());
        sign(ref);
      }
      syncRecord();
      return () => {
        delete own.confirmTimeOutItem;
        delete own.antithrombotic;
      };
    },
    onHook,
    slowTick,
    events,
    actions: {
      update: (o: PreOrders) => {
        if (!st || st.signed) return;
        st.draft = JSON.parse(JSON.stringify(o));
      },
      sign,
      stateCeiling,
      setCatheterSet,
      budget,
      missing: () => (st ? missingOrders(st.case, st.draft) : []),
    },
  };
  return mod;
}
