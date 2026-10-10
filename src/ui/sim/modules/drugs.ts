// ---------------------------------------------------------------------------
// Drug orders as syringe actions (diag-lab-drugs): a diagnostic session module
// that the drugs tab (src/ui/lab/controls/tabs/DrugsTab.tsx) talks to through
// the 'drugs' capability, and that records every order.
//
// The operator orders a drug, dose and route; the team reads it back
// (src/ui/lab/labTeam.ts). An intracoronary syringe goes in through the
// manifold or as a needle through the Y-connector, an intra-arterial one
// through the sheath's side arm: the nurse draws it up and puts it on the
// table, and the operator gives it. IV and IM drugs and saline are given by
// the team. Before the operator gives a syringe the attending's drug rules are
// asked ('give-ic'), and before the team is asked to give a drug ('give')
// (src/mentor/rules/diagDrugs.ts); a stop blocks the action and its line is
// returned. Intra-arterial lidocaine is declined by the nurse with the seizure
// warning (Brilakis, 07-engaging.ts:1321).
//
// What the module raises for the tips: 'vasodilator-given', held for
// VASODILATOR_HOLD_S of lab time after intracoronary or intra-arterial GTN or
// intra-arterial verapamil (lab request cm-patient-complications#10), and
// 'pde5-recent' for the case when the chart's PDE-5 inhibitor is within its
// window at the start. Hypotension comes from the patient-event adapter.
//
// At the start it also gives the patient the chart's IV nitrate infusion (a
// GTN infusion with a rate on the chart, chartNitrateInfusionUgMin), already
// at its steady state, so that the bolus response is blunted through the
// formulary's interaction (Oxford, 04-lab-drugs.ts:260).
//
// Doses on the menu are those the module text states, each with its source;
// the panel shows the monitor's systolic pressure and the time since the last
// vasodilator and makes no recommendation.
// ---------------------------------------------------------------------------

import type { LabRaises } from "../../../content/lab/raisable/waiting";
import type { LabEvent } from "../../../content/lab/tips";
import { MentorEngine, type DeferredNote, type PreActionResult } from "../../../mentor/mentor";
import type { MentorInput, PreAction } from "../../../mentor/context";
import type { MentorUtterance } from "../../../mentor/types";
import { mentorInputFromSim } from "../../../mentor/bridge/simulatorStore";
import { DRUG_RULES, type DrugAction, type DrugMentorCtx, type DrugVia } from "../../../mentor/rules/diagDrugs";
import { DRUGS, type DrugId, type InteractionId, type Route } from "../../../simulation/patient/pharmacology";
import { chartNitrateInfusionUgMin, nitrateCautions, type NitrateHistoryFact } from "../../../simulation/patient/patient";
import { drugSetups } from "../../../simulation/diagnosticScenarios/drugs";
import type { TelemetryEvent } from "../../../simulation/session/types";
import type { PressureKind } from "../../../types";
import type { DiagnosticLabSession } from "../labSession";
import { PDE5_QUESTION } from "../../lab/labTeam";
import type { SessionModule, SessionModuleFactory } from "./index";

/** The module's id in the session. */
export const DRUGS_MODULE_ID = "drugs";

/**
 * Seconds of lab time 'vasodilator-given' is held after a vasodilator (lab request
 * cm-patient-complications#10: "raised for a few minutes"; LAB_BUILD_PLAN diag-lab-drugs: hold 300 s).
 * MODEL PARAMETER.
 */
export const VASODILATOR_HOLD_S = 300;

/** Seconds after the PDE-5 question within which the patient's reply is shown with the drug talk (MODEL PARAMETER: display only). */
export const MP_ANSWER_WINDOW_S = 20;

/** Seconds a given syringe stays on the table view, emptied, after it went in (MODEL PARAMETER: display only). */
export const MP_GIVEN_SYRINGE_SHOW_S = 15;

/** The vasodilators that raise 'vasodilator-given', by route (the plan's tip integration: IC or IA GTN, IA verapamil). */
export function isVasodilatorDose(drug: DrugId, route: Route): boolean {
  return (drug === "gtn" && (route === "ic" || route === "ia")) || (drug === "verapamil" && route === "ia");
}

// --- the menu --------------------------------------------------------------------------

/** One drug the tab offers, the ways it can be given and the doses the module text states. */
export interface DrugMenuEntry {
  id: string;
  /** formulary id, or 'saline' for a crystalloid bolus */
  drug: DrugId | "saline";
  /** generic name as the tab shows it */
  label: string;
  /** dose unit: the formulary unit, or mL for saline */
  unit: "µg" | "mg" | "U" | "mL";
  /** the ways the tab offers (the team gives 'team' doses by teamRoute) */
  vias: readonly DrugVia[];
  /** the route of a 'team' dose */
  teamRoute?: Route;
  /** the doses the module text states (the learner may type another) */
  doses: readonly number[];
  /** the doses the module text states for one way of giving, where they differ from `doses` */
  dosesByVia?: Partial<Record<DrugVia, readonly number[]>>;
  /** where the doses come from, as the panel says it */
  source: string;
  /** the module text location (src/content/manual/pci-manual/ unless the path says otherwise) */
  ref: string;
}

/** The route a syringe given this way takes. */
export function routeOfVia(via: DrugVia, entry: Pick<DrugMenuEntry, "teamRoute">): Route {
  if (via === "manifold" || via === "y-connector") return "ic";
  if (via === "sheath") return "ia";
  return entry.teamRoute ?? "iv";
}

export const DRUG_MENU: readonly DrugMenuEntry[] = [
  {
    id: "gtn",
    drug: "gtn",
    label: "Glyceryl trinitrate",
    unit: "µg",
    vias: ["manifold", "y-connector", "sheath"],
    doses: [50, 100, 200],
    dosesByVia: { sheath: [100, 200] },
    source: "intracoronary by systolic pressure, Brilakis 6.3; through the sheath 100-200 µg, Brilakis",
    ref: "04-lab-drugs.ts:251 (ladder), 260 (manifold or a needle through the Y-connector), 256 (radial artery)",
  },
  {
    id: "verapamil",
    drug: "verapamil",
    label: "Verapamil",
    unit: "mg",
    vias: ["sheath"],
    doses: [2, 2.5, 3],
    source: "2-3 mg into the radial artery, Brilakis; 2.5 mg in Oxford's cocktail",
    ref: "04-lab-drugs.ts:429, 256",
  },
  {
    id: "heparin",
    drug: "heparin",
    label: "Heparin",
    unit: "U",
    vias: ["sheath", "team"],
    teamRoute: "iv",
    doses: [2500, 5000],
    source: "2500 IU in Oxford's radial cocktail; Brilakis 50 units/kg, at most 5000 units, in a diagnostic study",
    ref: "04-lab-drugs.ts:256",
  },
  {
    id: "lidocaine",
    drug: "lidocaine",
    label: "Lidocaine",
    unit: "mg",
    vias: ["sheath", "team"],
    teamRoute: "iv",
    doses: [50],
    source: "50 mg IV over 2 minutes, Oxford; never into the artery, Brilakis",
    ref: "04-lab-drugs.ts:1352; 07-engaging.ts:1321",
  },
  {
    id: "phenylephrine",
    drug: "phenylephrine",
    label: "Phenylephrine",
    unit: "µg",
    vias: ["team"],
    teamRoute: "iv",
    doses: [50, 100],
    source: "50-100 µg IV bolus, Brilakis 3.6",
    ref: "04-lab-drugs.ts:650",
  },
  {
    id: "saline",
    drug: "saline",
    label: "Saline bolus",
    unit: "mL",
    vias: ["team"],
    doses: [250, 500],
    source: "saline for nitrate hypotension, Brilakis 3.2; the volumes are the lab's choices",
    ref: "04-lab-drugs.ts:322; the volumes are MODEL PARAMETERS (500 mL is the foot of the anaphylaxis bolus of 500-1000 mL, line 2108)",
  },
  {
    id: "atropine",
    drug: "atropine",
    label: "Atropine",
    unit: "mg",
    vias: ["team"],
    teamRoute: "iv",
    doses: [0.5, 1],
    source: "0.5-1.0 mg IV, Oxford; 0.5 mg repeated to 3 mg, Brilakis",
    ref: "complication-management/05-patient-complications.ts:261",
  },
  {
    id: "adrenaline-im",
    drug: "adrenaline",
    label: "Adrenaline (IM)",
    unit: "µg",
    vias: ["team"],
    teamRoute: "im",
    doses: [500],
    source: "anaphylaxis: 0.5 mg IM, repeated after 5 minutes, RCUK 2021",
    ref: "04-lab-drugs.ts:1152",
  },
  {
    id: "amiodarone",
    drug: "amiodarone",
    label: "Amiodarone",
    unit: "mg",
    vias: ["team"],
    teamRoute: "iv",
    doses: [150, 300],
    source: "150 mg over 10 minutes; 300 mg IV push in refractory VF",
    ref: "04-lab-drugs.ts:788-789",
  },
];

export const drugMenuEntry = (id: string): DrugMenuEntry | undefined => DRUG_MENU.find((e) => e.id === id);

/** The doses the menu offers for one way of giving a drug. */
export const menuDoses = (entry: DrugMenuEntry, via: DrugVia): readonly number[] => entry.dosesByVia?.[via] ?? entry.doses;

// --- records -------------------------------------------------------------------------------

export type DrugOrderStatus = "with-team" | "on-table" | "given" | "declined" | "stopped";

/** One order, as the module records it (the debrief and the tab read these). */
export interface DrugOrderRecord {
  id: number;
  /** lab time of the order, s */
  t: number;
  /** the team's clock when it was ordered ("13:42"), the clock the team's lines show (absent without a team) */
  clock?: string;
  entryId: string;
  drug: DrugId | "saline";
  label: string;
  /** the dose in the syringe or given: what the team drew up, which a misheard read-back changes */
  dose: number;
  /** the dose the operator ordered */
  orderedDose: number;
  unit: DrugMenuEntry["unit"];
  route: Route | "fluid";
  via: DrugVia;
  side?: "left" | "right";
  /** the systolic the monitor showed when it was ordered */
  systolic: number | null;
  status: DrugOrderStatus;
  /** the team's order id, when the team took it */
  teamOrderId?: number;
  /** lab time it went in */
  givenAt?: number;
  /** the attending's stop or the nurse's refusal */
  note?: string;
  /** the formulary's interaction flags when it was given */
  flags: InteractionId[];
}

/** What a tab action returned. */
export type DrugResult =
  | { ok: true; record: DrugOrderRecord }
  | { ok: false; reason: "stopped" | "declined" | "dose" | "nothing" | "refused"; text: string; utterance?: MentorUtterance; record?: DrugOrderRecord };

/** A technique question the attending left to the debrief (independent and exam modes), with the order it concerned. */
export interface DrugDeferredNote {
  /** lab time, s */
  t: number;
  ruleId: string;
  severity: string;
  recordId: number;
}

/** The drug syringe the table shows: where it is, what it holds and whether it has gone in. */
export interface TableDrugView {
  via: Exclude<DrugVia, "team">;
  label: string;
  given: boolean;
}

/** A line of the team's conversation about drugs, for the tab. */
export interface DrugLine {
  clock: string;
  speaker: string;
  text: string;
}

/** What the drugs tab asks of the lab (the 'drugs' capability). */
export interface DrugsCapability {
  readonly menu: readonly DrugMenuEntry[];
  /** notify fn whenever the orders change; returns the unsubscribe */
  subscribe(fn: () => void): () => void;
  version(): number;
  /** lab time, s */
  now(): number;
  /** the systolic pressure the monitor shows (the arterial line, else the last cuff reading) */
  monitorSystolic(): { sys: number; source: "line" | "cuff" } | null;
  /** seconds since the last vasodilator (null: none this case) */
  sinceVasodilatorS(): number | null;
  orders(): readonly DrugOrderRecord[];
  /** the team's status of an order still with the team ('readback', 'queried', 'in-progress', 'cancelled') */
  teamStatus(r: DrugOrderRecord): string | null;
  /** the syringes waiting on the table, oldest first */
  onTable(): DrugOrderRecord[];
  /** the syringe the table shows: the newest waiting, else one just given */
  tableSyringe(): TableDrugView | null;
  /** the team's recent drug lines (orders, read-backs, reports), newest last */
  lines(limit?: number): DrugLine[];
  hasTeam(): boolean;
  order(o: { entryId: string; dose: number; via: DrugVia; side?: "left" | "right" }): DrugResult;
  /** give a syringe on the table (default: the newest) */
  give(recordId?: number): DrugResult;
  /** discard a syringe on the table (default: the newest): it is declined and cannot be given */
  discard(recordId?: number): DrugResult;
  /** whether a read-back or a team query is waiting for the operator's answer */
  readbackPending(): boolean;
  /** whether an order is still open with the team (waiting for an answer or being drawn up) */
  teamOrderOpen(): boolean;
  /** confirm the last read-back */
  confirm(): void;
  /** reject the last read-back ("No, that's not right."), cancel the newest open order, or, with none open, discard the newest syringe on the table */
  reject(): void;
  /** ask the patient about PDE-5 inhibitors */
  askPde5(): void;
}

declare module "../../lab/controls/types" {
  interface LabCapabilities {
    /** the diagnostic lab's drug orders (DrugsTab) */
    drugs: DrugsCapability;
  }
}

const TIP_PRESSURE: Partial<Record<string, PressureKind>> = { damped: "damped", ventricularised: "ventricularised", wedged: "wedged" };

/** The drug module of one session. */
export class DrugOrders implements SessionModule, DrugsCapability {
  readonly id = DRUGS_MODULE_ID;
  readonly menu = DRUG_MENU;
  private session: DiagnosticLabSession | null = null;
  private records: DrugOrderRecord[] = [];
  private seq = 0;
  private rev = 0;
  private listeners = new Set<() => void>();
  private lastVasodilatorAt: number | null = null;
  private facts: NitrateHistoryFact[] = [];
  /** the attending's stops, flags that did not block (an exam's logged stop) and the nurse's refusals, newest last */
  readonly stops: MentorUtterance[] = [];
  /** technique questions the attending left to the debrief, newest last */
  readonly deferred: DrugDeferredNote[] = [];
  /** the nitrate infusion the chart gave the patient at the start, µg/min (null: none) */
  infusionUgMin: number | null = null;
  /** team time the patient was asked about PDE-5 inhibitors (null: not asked) */
  private pde5AskedAt: number | null = null;
  /** the operator's own lines about drugs and the nurse's refusals, shown with the team's */
  private spoken = new Set<string>();

  attach(session: DiagnosticLabSession) {
    this.session = session;
    const c = session.store.getState().caseData;
    this.facts = [...((c.scenarioId && drugSetups[c.scenarioId]?.facts) || [])];
    // the chart's IV nitrate infusion, running at its steady state from the start
    const rate = chartNitrateInfusionUgMin(c.chart);
    if (rate !== null) {
      this.infusionUgMin = rate;
      primeInfusion(session, rate);
    }
    // a PDE-5 inhibitor within its window at the start: a case property for the tips
    if (nitrateCautions(session.engine.profile, { elapsedS: 0 }).includes("pde5")) session.events.hold(["pde5-recent"], session.wall(), "drugs");
    session.provideCapability("drugs", this);
    const off = session.crew?.onEvents((evs) => this.onTeamEvents(evs));
    return () => {
      off?.();
      if (session.capability("drugs") === this) session.provideCapability("drugs", null);
      this.session = null;
    };
  }

  // --- the capability ------------------------------------------------------------------------

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  version(): number {
    return this.rev;
  }

  now(): number {
    return this.session?.wall() ?? 0;
  }

  hasTeam(): boolean {
    return !!this.session?.crew;
  }

  monitorSystolic(): { sys: number; source: "line" | "cuff" } | null {
    const s = this.session;
    if (!s) return null;
    const v = s.engine.vitals();
    if (v.art && Number.isFinite(v.art.sys)) return { sys: Math.round(v.art.sys), source: "line" };
    if (v.nibp && Number.isFinite(v.nibp.sys)) return { sys: Math.round(v.nibp.sys), source: "cuff" };
    return null;
  }

  sinceVasodilatorS(): number | null {
    return this.lastVasodilatorAt === null ? null : Math.max(0, this.now() - this.lastVasodilatorAt);
  }

  orders(): readonly DrugOrderRecord[] {
    return this.records;
  }

  teamStatus(r: DrugOrderRecord): string | null {
    if (r.teamOrderId === undefined) return null;
    return this.session?.crew?.orderById(r.teamOrderId)?.status ?? null;
  }

  onTable(): DrugOrderRecord[] {
    return this.records.filter((r) => r.status === "on-table");
  }

  /** The newest syringe waiting on the table. */
  private newestOnTable(): DrugOrderRecord | undefined {
    const w = this.onTable();
    return w[w.length - 1];
  }

  readbackPending(): boolean {
    return this.records.some((r) => {
      if (r.status !== "with-team") return false;
      const st = this.teamStatus(r);
      return st === "readback" || st === "queried";
    });
  }

  teamOrderOpen(): boolean {
    return this.records.some((r) => {
      if (r.status !== "with-team") return false;
      const st = this.teamStatus(r);
      return st === "readback" || st === "queried" || st === "in-progress";
    });
  }

  tableSyringe(): TableDrugView | null {
    const waiting = this.newestOnTable();
    if (waiting && waiting.via !== "team") return { via: waiting.via, label: `${waiting.label} ${fmtDose(waiting.dose, waiting.unit)}`, given: false };
    const t = this.now();
    for (let k = this.records.length - 1; k >= 0; k--) {
      const r = this.records[k];
      if (r.status === "given" && r.via !== "team" && r.givenAt !== undefined && t - r.givenAt <= MP_GIVEN_SYRINGE_SHOW_S) return { via: r.via, label: `${r.label} ${fmtDose(r.dose, r.unit)}`, given: true };
    }
    return null;
  }

  lines(limit = 6): DrugLine[] {
    const team = this.session?.crew?.team;
    if (!team) return [];
    const ids = new Set(this.records.map((r) => r.teamOrderId).filter((x): x is number => x !== undefined));
    const out: DrugLine[] = [];
    const asked = this.pde5AskedAt;
    for (const u of team.st.utterances) {
      const answer = asked !== null && u.speaker === "patient" && u.t >= asked && u.t <= asked + MP_ANSWER_WINDOW_S;
      const drugTalk = (u.orderId !== undefined && ids.has(u.orderId)) || answer || this.spoken.has(u.text);
      if (drugTalk) out.push({ clock: u.clock, speaker: u.speaker, text: u.text });
    }
    return out.slice(-limit);
  }

  order(o: { entryId: string; dose: number; via: DrugVia; side?: "left" | "right" }): DrugResult {
    const s = this.session;
    const entry = drugMenuEntry(o.entryId);
    if (!s || !entry) return { ok: false, reason: "nothing", text: "Nothing to order." };
    if (!(o.dose > 0) || !Number.isFinite(o.dose)) return { ok: false, reason: "dose", text: "Give a dose." };
    if (!entry.vias.includes(o.via)) return { ok: false, reason: "refused", text: `${entry.label} is not given that way here.` };
    const route: Route | "fluid" = entry.drug === "saline" ? "fluid" : routeOfVia(o.via, entry);
    const rec = this.newRecord(entry, o.dose, route, o.via, o.via === "manifold" || o.via === "y-connector" ? o.side ?? this.engagedSide() : undefined);
    if (entry.drug === "saline") {
      if (s.crew) {
        const tor = s.crew.orderFluid(o.dose);
        if (tor) this.spoken.add(tor.raw);
        rec.status = "with-team";
        rec.teamOrderId = tor?.id;
      } else {
        s.engine.fluid(o.dose, 120);
        this.markGiven(rec);
      }
      return this.done(rec);
    }
    const drug = entry.drug;
    const dRoute: Route = route === "fluid" ? "iv" : route;
    // lidocaine into the artery: the attending stops it, else the nurse declines it (Brilakis: seizures)
    if (drug === "lidocaine" && dRoute === "ia") {
      const g = this.ask("give-ic", rec);
      const text = "Not lidocaine into the artery: it can cause seizures. It goes around the artery, never into it.";
      if (!g.allow) return this.stop(rec, g, text);
      rec.status = "declined";
      rec.note = text;
      this.spoken.add(text);
      s.crew?.declineOrder(text, { drug, route: dRoute });
      this.done(rec);
      return { ok: false, reason: "declined", text, record: rec };
    }
    if (o.via === "team") {
      // a drug the team gives: the attending's 'give' rules first
      const g = this.ask("give", rec);
      if (!g.allow) return this.stop(rec, g);
      if (s.crew) {
        const tor = s.crew.orderDrug({ drug, dose: o.dose, route: dRoute });
        if (tor) this.spoken.add(tor.raw);
        rec.status = "with-team";
        rec.teamOrderId = tor?.id;
        return this.done(rec);
      }
      const r = s.engine.giveDrug(drug, o.dose, dRoute);
      if (!r.ok) {
        rec.status = "declined";
        rec.note = r.text;
        this.done(rec);
        return { ok: false, reason: "refused", text: r.text, record: rec };
      }
      rec.flags = r.flags.map((f) => f.id);
      this.markGiven(rec);
      return this.done(rec);
    }
    // a syringe for the operator: drawn up by the team (read back), or at once without a team
    if (!DRUGS[drug].routes.includes(dRoute)) {
      rec.status = "declined";
      rec.note = `${DRUGS[drug].label} is not given by that route.`;
      this.done(rec);
      return { ok: false, reason: "refused", text: rec.note, record: rec };
    }
    if (s.crew) {
      const tor = s.crew.orderDrug({ drug, dose: o.dose, route: dRoute, side: rec.side });
      if (tor) this.spoken.add(tor.raw);
      rec.status = "with-team";
      rec.teamOrderId = tor?.id;
    } else rec.status = "on-table";
    return this.done(rec);
  }

  give(recordId?: number): DrugResult {
    const s = this.session;
    const rec = this.waitingRecord(recordId);
    if (!s || !rec || rec.drug === "saline") return { ok: false, reason: "nothing", text: "There is no syringe on the table." };
    const drug = rec.drug;
    const g = this.ask("give-ic", rec);
    if (!g.allow) {
      const u = g.utterance;
      rec.note = u?.text;
      if (u) this.stops.push(u);
      this.telemetry("drug.stopped", { recordId: rec.id, drug, rule: u?.ruleId, text: u?.text });
      this.changed();
      return { ok: false, reason: "stopped", text: u?.text ?? "Stopped.", utterance: u, record: rec };
    }
    rec.flags = s.engine.interactionFlags(drug).map((f) => f.id);
    if (s.crew) {
      // the syringe drawn up for this order, not merely the newest of the drug
      const given = rec.teamOrderId === undefined ? s.crew.giveSyringe(drug) : s.crew.giveSyringe(drug, rec.teamOrderId);
      if (!given) return { ok: false, reason: "nothing", text: "The syringe is not on the table yet.", record: rec };
      // the engine's drug.given event (through the crew) raises the vasodilator; mark it given now
      this.markGiven(rec, false);
    } else {
      const r = s.engine.giveDrug(drug, rec.dose, rec.route as Route, { side: rec.side });
      if (!r.ok) return { ok: false, reason: "refused", text: r.text, record: rec };
      this.markGiven(rec);
    }
    return this.done(rec);
  }

  discard(recordId?: number): DrugResult {
    const s = this.session;
    const rec = this.waitingRecord(recordId);
    if (!s || !rec) return { ok: false, reason: "nothing", text: "There is no syringe on the table." };
    if (s.crew && rec.teamOrderId !== undefined) {
      const said = s.crew.discardSyringe(rec.teamOrderId);
      if (said) this.spoken.add(said);
    }
    rec.status = "declined";
    rec.note = "Discarded by the operator.";
    this.telemetry("drug.discarded", { recordId: rec.id, drug: rec.drug, dose: rec.dose });
    return this.done(rec);
  }

  confirm() {
    const crew = this.session?.crew;
    if (crew) {
      this.spoken.add("Correct.");
      crew.confirmReadback();
    }
    this.changed();
  }

  reject() {
    const crew = this.session?.crew;
    // no order open with the team: "cancel that" means the newest syringe on the table
    if (!this.teamOrderOpen() && this.newestOnTable()) {
      this.discard();
      return;
    }
    if (crew) {
      this.spoken.add(crew.rejectReadback());
      this.syncCancelled();
    }
    this.changed();
  }

  askPde5() {
    const s = this.session;
    if (!s) return;
    if (s.crew) {
      this.pde5AskedAt = s.crew.team.t;
      this.spoken.add(PDE5_QUESTION);
      s.crew.askAboutPde5();
    }
    this.telemetry("drug.asked-pde5", {});
    this.changed();
  }

  // --- internals ----------------------------------------------------------------------------

  /** A syringe waiting on the table: that record, or the newest. */
  private waitingRecord(recordId?: number): DrugOrderRecord | undefined {
    return recordId === undefined ? this.newestOnTable() : this.records.find((r) => r.id === recordId && r.status === "on-table");
  }

  /** The action the rules judge, built from the record and the patient now. */
  drugAction(rec: DrugOrderRecord): DrugAction | null {
    const s = this.session;
    if (!s || rec.drug === "saline" || rec.route === "fluid") return null;
    const entry = drugMenuEntry(rec.entryId);
    const stated = entry ? menuDoses(entry, rec.via) : [];
    return {
      drug: rec.drug,
      dose: rec.dose,
      route: rec.route,
      via: rec.via,
      systolic: this.monitorSystolic()?.sys ?? null,
      cautions: nitrateCautions(s.engine.profile, { elapsedS: s.engine.time, facts: this.facts }),
      flags: s.engine.interactionFlags(rec.drug).map((f) => f.id),
      sinceVasodilatorS: this.sinceVasodilatorS(),
      orderedDose: rec.orderedDose,
      statedMaxDose: stated.length ? Math.max(...stated) : null,
    };
  }

  /**
   * Ask the attending's drug rules before an action (a fresh MentorEngine at the lab's policy, with the
   * drug rules only, so nothing else in the ladder moves). The pressure is the store's, or the
   * engine's tip state when that shows an abnormal trace.
   */
  gate(action: "give-ic" | "give", rec: DrugOrderRecord): PreActionResult {
    return this.consult(action, rec).result;
  }

  /** The rules' answer and the technique questions the engine left to the debrief. */
  private consult(action: "give-ic" | "give", rec: DrugOrderRecord): { result: PreActionResult; deferred: readonly DeferredNote[] } {
    const s = this.session;
    const a = this.drugAction(rec);
    if (!s || !a) return { result: { allow: true }, deferred: [] };
    const pol = s.controlsPolicy();
    const engine = new MentorEngine({ mode: pol.mode, entrustment: pol.entrustment }, DRUG_RULES);
    const base = mentorInputFromSim(s.store.getState(), null, s.wall());
    const tip = TIP_PRESSURE[s.tipState];
    const input: MentorInput & Pick<DrugMentorCtx, "drugAction"> = { ...base, pressure: tip ?? base.pressure, drugAction: a };
    // 'give-ic' and 'give' are rule pre-actions (RULE_PRE_ACTIONS in src/mentor/rules.ts); the engine's
    // PreAction type has not been widened to them yet, and preAction passes the action to stopOn unchanged
    const result = engine.preAction(action as unknown as PreAction, input);
    return { result, deferred: engine.deferred };
  }

  /**
   * The gate before an action the learner takes: as gate(), and what the rules say is kept. A
   * technique question left to the debrief (independent and exam modes) is recorded in `deferred`;
   * a stop that does not block (an exam's logged stop) is recorded in `stops`.
   */
  private ask(action: "give-ic" | "give", rec: DrugOrderRecord): PreActionResult {
    const { result, deferred } = this.consult(action, rec);
    for (const d of deferred) {
      this.deferred.push({ t: this.now(), ruleId: d.ruleId, severity: d.severity, recordId: rec.id });
      this.telemetry("drug.deferred", { recordId: rec.id, rule: d.ruleId });
    }
    if (result.allow && result.utterance) {
      this.stops.push(result.utterance);
      this.telemetry("drug.flagged", { recordId: rec.id, drug: rec.drug, rule: result.utterance.ruleId, text: result.utterance.text });
    }
    return result;
  }

  /** Records whose team order was cancelled (a rejected read-back, "cancel that") are declined. */
  private syncCancelled(): boolean {
    let touched = false;
    for (const r of this.records) {
      if (r.status !== "with-team" || r.teamOrderId === undefined) continue;
      if (this.session?.crew?.orderById(r.teamOrderId)?.status !== "cancelled") continue;
      r.status = "declined";
      r.note = "Cancelled by the operator.";
      this.telemetry("drug.cancelled", { recordId: r.id, drug: r.drug });
      touched = true;
    }
    return touched;
  }

  private newRecord(entry: DrugMenuEntry, dose: number, route: Route | "fluid", via: DrugVia, side?: "left" | "right"): DrugOrderRecord {
    const s = this.session;
    const rec: DrugOrderRecord = {
      id: ++this.seq,
      t: this.now(),
      clock: s?.crew ? s.crew.team.clock() : undefined,
      entryId: entry.id,
      drug: entry.drug,
      label: entry.label,
      dose,
      orderedDose: dose,
      unit: entry.unit,
      route,
      via,
      side,
      systolic: this.monitorSystolic()?.sys ?? null,
      status: "with-team",
      flags: [],
    };
    this.records.push(rec);
    this.telemetry("drug.order", { recordId: rec.id, drug: rec.drug, dose, unit: rec.unit, route, via, side, systolic: rec.systolic });
    return rec;
  }

  private stop(rec: DrugOrderRecord, g: PreActionResult, fallback = "Stopped."): DrugResult {
    rec.status = "stopped";
    rec.note = g.utterance?.text ?? fallback;
    if (g.utterance) this.stops.push(g.utterance);
    this.telemetry("drug.stopped", { recordId: rec.id, drug: rec.drug, rule: g.utterance?.ruleId, text: rec.note });
    this.changed();
    return { ok: false, reason: "stopped", text: rec.note, utterance: g.utterance, record: rec };
  }

  private done(rec: DrugOrderRecord): DrugResult {
    this.changed();
    return { ok: true, record: rec };
  }

  /** Mark a record given now; `raise`: raise the vasodilator event here (no team to report the engine's dose). */
  private markGiven(rec: DrugOrderRecord, raise = true) {
    rec.status = "given";
    rec.givenAt = this.now();
    this.telemetry("drug.given-by-lab", { recordId: rec.id, drug: rec.drug, dose: rec.dose, route: rec.route, via: rec.via });
    if (raise && rec.drug !== "saline" && rec.route !== "fluid" && isVasodilatorDose(rec.drug, rec.route)) this.vasodilator();
    this.changed();
  }

  /** A vasodilator went in: 'vasodilator-given' for VASODILATOR_HOLD_S of lab time. */
  private vasodilator() {
    const s = this.session;
    if (!s) return;
    const t = s.wall();
    this.lastVasodilatorAt = t;
    s.events.raise("vasodilator-given", VASODILATOR_HOLD_S, t, "drugs");
  }

  /** The team's and the engine's events of a frame: syringes drawn up, drugs the team gave, doses the engine took. */
  private onTeamEvents(evs: readonly TelemetryEvent[]) {
    let touched = false;
    for (const e of evs) {
      const d = (e.data ?? {}) as Record<string, unknown>;
      if (e.kind === "drug.given") {
        const drug = d.drug as DrugId;
        const route = d.route as Route;
        if (drug && route && isVasodilatorDose(drug, route)) this.vasodilator();
      } else if (e.kind === "team.syringe-ready") {
        const rec = this.records.find((r) => r.teamOrderId === d.orderId && r.status === "with-team");
        if (rec) {
          rec.status = "on-table";
          // the syringe holds what the nurse drew up (a misheard dose differs from the order)
          if (typeof d.dose === "number") rec.dose = d.dose;
          touched = true;
        }
      } else if (e.kind === "team.drug-given") {
        const rec = this.records.find((r) => r.teamOrderId === d.orderId && r.status === "with-team");
        if (rec) {
          rec.status = "given";
          rec.givenAt = this.now();
          if (typeof d.dose === "number") rec.dose = d.dose;
          touched = true;
        }
      } else if (e.kind === "team.command") {
        // a typed or spoken "no" or "cancel that" reaches the same orders as the tab's button
        if (this.syncCancelled()) touched = true;
      } else if (e.kind === "fluid.given") {
        const rec = this.records.find((r) => r.drug === "saline" && r.status === "with-team");
        if (rec) {
          rec.status = "given";
          rec.givenAt = this.now();
          touched = true;
        }
      }
    }
    if (touched) this.changed();
  }

  private engagedSide(): "left" | "right" {
    const e = this.session?.store.getState().engagement;
    return e?.target === "right" ? "right" : "left";
  }

  private telemetry(kind: string, data: Record<string, unknown>) {
    const s = this.session;
    if (!s?.crew) return;
    s.crew.push([{ tWall: s.wall(), tPatient: s.engine.time, kind, data }]);
  }

  private changed() {
    this.rev++;
    for (const f of this.listeners) f();
    this.session?.notify();
  }
}

/** A dose with its unit, as the tab and the table label show it. */
export function fmtDose(dose: number, unit: DrugMenuEntry["unit"]): string {
  const n = Number.isInteger(dose) ? dose.toLocaleString("en-GB") : String(+dose.toFixed(2));
  return `${n} ${unit === "U" ? "units" : unit}`;
}

/**
 * Start the chart's nitrate infusion at its steady state: the patient has been on it since before the
 * case (the plasma amount of a first-order infusion at steady state, rate / ke, with the formulary's
 * half-life), so the bolus response is blunted from the first minute.
 */
function primeInfusion(session: DiagnosticLabSession, rateUgMin: number) {
  const e = session.engine;
  e.startInfusion({ drug: "gtn", rate: rateUgMin });
  const sn = e.snapshot();
  const inf = sn.pharm.infusions.find((i) => i.drug === "gtn");
  if (!inf) return;
  const ke = Math.LN2 / DRUGS.gtn.halfLifeS;
  inf.level = rateUgMin / 60 / ke;
  e.restore(sn);
}

export const createSessionModule: SessionModuleFactory = () => new DrugOrders();

/** What the drug module puts into the diagnostic lab's context. */
export const raises: LabRaises = { lab: "diagnostic", phases: [], events: ["vasodilator-given", "pde5-recent"] satisfies LabEvent[] };
