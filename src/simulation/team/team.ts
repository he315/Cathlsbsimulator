// ---------------------------------------------------------------------------
// The lab team: scrub nurse, radiographer, physiologist, sedation nurse or
// anaesthetist, and the conscious patient.
//
// Usage (per lab, one per case):
//
//   const team = new Team({ seed, patient: engine, input, carm, table, imaging, catheterSide });
//   team.command("heparin 5,000 units IV");          // typed, button or recognised speech
//   // every frame:
//   team.onTelemetry(engineEvents);                  // what engine.drainEvents() returned (and dose events)
//   team.advance(dtSeconds);
//   team.bus.on("utterance", (u) => captions.push(u)); // and audio voices
//   // at the end:
//   team.report();                                    // communication quality for the S11 debrief
//   team.drainEvents();                               // TelemetryEvent[] for the S11 recorder
//
// Every order produces a read-back (or a question first). Nothing acts on
// the world except through the S9 engine API, the S8 input system and the
// lab's ports.
// ---------------------------------------------------------------------------

import type { Snapshotable, TelemetryEvent } from "../session/types";
import { TeamCore, type TeamOptions, type TeamState } from "./agent";
import { communicationReport, type CommunicationReport } from "./comms";
import { parseCommand } from "./intents";
import { DRUG_ROLE } from "./params";
import { administer, drugOrderComplete, drugReady, receiveDrugOrder } from "./roles/drugs";
import { installPatient, noteInflation, patientTelemetry, patientTick, receivePatientIntent } from "./roles/patient";
import { installPhysiologist, physiologistTelemetry, physiologistTick, receivePhysiologistOrder } from "./roles/physiologist";
import { installRadiographer, radiographerTelemetry, receiveRadiographerOrder } from "./roles/radiographer";
import { installScrub, itemUsed, labelCheck, receiveScrubOrder, scrubTelemetry } from "./roles/scrub";
import { installSedation, receiveSedationOrder, sedationTelemetry, sedationTick } from "./roles/sedation";
import type { ItemSpec, Order, ParsedCommand, RoleId, TeamIntent } from "./types";

type StaffRole = Exclude<RoleId, "operator" | "patient">;

const PATIENT_INTENTS: TeamIntent["k"][] = ["warn", "ask", "breath", "reassure", "keepStill"];
const RESPONSE_INTENTS: TeamIntent["k"][] = ["confirm", "negate", "cancel", "thanks"];

/** Which team member an intent belongs to. */
export function roleFor(i: TeamIntent, to?: Exclude<RoleId, "operator">): Exclude<RoleId, "operator"> {
  switch (i.k) {
    case "drug":
      return to === "sedation" || to === "scrub" ? (to === "sedation" ? "sedation" : DRUG_ROLE[i.drug]) : DRUG_ROLE[i.drug];
    case "infusion":
      return i.drug === "noradrenaline" ? "sedation" : "scrub";
    case "fluid":
    case "oxygen":
    case "defib":
    case "cpr":
      return "sedation";
    case "administer":
    case "act":
    case "equipment":
    case "labelCheck":
    case "holdWire":
    case "haveWire":
      return "scrub";
    case "carm":
    case "table":
    case "protocol":
    case "timerReset":
      return "radiographer";
    case "zero":
    case "record":
    case "twelveLead":
    case "nibp":
    case "silence":
      return "physiologist";
    case "query":
      return i.what === "sats" ? "sedation" : i.what === "contrast" ? "scrub" : i.what === "fluoroTime" ? "radiographer" : "physiologist";
    case "warn":
    case "ask":
    case "breath":
    case "reassure":
    case "keepStill":
      return "patient";
    default:
      return to ?? "scrub";
  }
}

const NURSES: RoleId[] = ["scrub", "sedation"];

export class Team extends TeamCore implements Snapshotable<TeamState> {
  constructor(o: TeamOptions = {}) {
    super(o);
    installScrub(this);
    installRadiographer(this);
    installPhysiologist(this);
    installSedation(this);
    installPatient(this);
    this.handle("drug-ready", (c, tm) => drugReady(c, Number(tm.data.orderId)));
  }

  // --- input ------------------------------------------------------------------------------

  /** A typed or recognised command. Returns the parse (for the palette's preview and tests). */
  command(text: string, source: "typed" | "button" | "voice" = "typed"): ParsedCommand {
    const parsed = parseCommand(text);
    this.intent(parsed, source);
    return parsed;
  }

  /** A command already parsed (buttons build these directly). */
  intent(parsed: ParsedCommand, source: "typed" | "button" | "voice" = "button"): Order | null {
    const i = parsed.intent;
    const raw = parsed.raw.trim();
    const isPatient = PATIENT_INTENTS.includes(i.k);
    const kind = RESPONSE_INTENTS.includes(i.k) ? "ack" : isPatient ? "to-patient" : "order";
    if (raw) this.say("operator", raw, kind, { to: isPatient ? "patient" : (parsed.to ?? "team") });
    this.telemetry("team.command", { raw, intent: i.k, to: parsed.to ?? null, source });

    if (i.k === "confirm") return this.respond("confirm"), null;
    if (i.k === "negate") return this.respond("negate"), null;
    if (i.k === "cancel") return this.respond("cancel"), null;
    if (i.k === "thanks") return null;
    if (isPatient) {
      receivePatientIntent(this, i);
      return null;
    }
    if (i.k === "labelCheck") {
      labelCheck(this);
      return null;
    }
    if (i.k === "administer") {
      if (!administer(this, i.drug)) this.say("scrub", i.drug ? `There's no ${i.drug} drawn up.` : "There's nothing drawn up on the table.", "report", { to: "operator" });
      return null;
    }
    if (i.k === "unknown") {
      if (this.mergeIntoQuery(raw)) return null;
      const who = (parsed.to as StaffRole | "patient" | undefined) ?? (this.st.lastRole && this.st.lastRole !== "operator" ? this.st.lastRole : "scrub");
      if (who === "patient") {
        if (this.patient && this.patient.vitals().symptoms.conscious >= this.P.consciousSpeak) this.say("patient", "Sorry?", "patient", { to: "operator" });
      } else this.say(who, "Sorry, say again?", "query", { to: "operator" });
      return null;
    }
    // a restated drug order answers an open query on the same drug
    if (i.k === "drug") {
      const q = this.openQuery();
      if (q && q.heard.k === "drug" && q.heard.drug === i.drug) {
        const merged = { ...q.heard, ...definedOf(i) } as TeamIntent;
        this.updateOrder(q, { heard: merged, status: "readback", queryReason: undefined });
        receiveDrugOrder(this, q);
        return q;
      }
    }
    const role = roleFor(i, parsed.to) as StaffRole;
    const directed = !!parsed.to && (parsed.to === role || (NURSES.includes(parsed.to) && NURSES.includes(role)));
    const order: Order = {
      id: this.id(),
      t: this.t,
      raw,
      role,
      intent: i,
      heard: i,
      directed,
      complete: i.k === "drug" ? drugOrderComplete(i) : null,
      status: "readback",
    };
    // a newer C-arm order supersedes the one in progress
    if (i.k === "carm") for (const o of this.st.orders) if (o.intent.k === "carm" && (o.status === "readback" || o.status === "in-progress")) this.updateOrder(o, { status: "cancelled" });
    this.st.orders.push(order);
    this.st.lastRole = role;
    this.telemetry("team.order", { id: order.id, role, status: "new", intent: i.k, raw, directed, complete: order.complete });
    this.receive(order);
    return order;
  }

  private receive(order: Order) {
    switch (order.role) {
      case "scrub":
        return receiveScrubOrder(this, order);
      case "radiographer":
        return receiveRadiographerOrder(this, order);
      case "physiologist":
        return receivePhysiologistOrder(this, order);
      case "sedation":
        return receiveSedationOrder(this, order);
    }
  }

  private openQuery(): Order | undefined {
    for (let k = this.st.orders.length - 1; k >= 0; k--) {
      const o = this.st.orders[k];
      if (o.status === "queried" && this.t - o.t < 60) return o;
    }
    return undefined;
  }

  /** "IV", "5,000 units", "250" after a question: complete the queried order. */
  private mergeIntoQuery(raw: string): boolean {
    const q = this.openQuery();
    if (!q) return false;
    const h = q.heard;
    if (h.k === "drug") {
      const p = parseCommand(`${h.drug} ${raw}`).intent;
      if (p.k !== "drug") return false;
      const add = definedOf(p);
      delete (add as { drug?: unknown }).drug;
      if (!Object.keys(add).length) return false;
      this.updateOrder(q, { heard: { ...h, ...add } as TeamIntent, status: "readback", queryReason: undefined });
      receiveDrugOrder(this, q);
      return true;
    }
    const n = raw.match(/(\d+(?:\.\d+)?)/);
    if (!n) return false;
    const v = Number(n[1]);
    if (h.k === "infusion") this.updateOrder(q, { heard: { ...h, rate: v } });
    else if (h.k === "fluid") this.updateOrder(q, { heard: { ...h, ml: v } });
    else if (h.k === "oxygen") this.updateOrder(q, { heard: { ...h, lpm: v } });
    else return false;
    this.updateOrder(q, { status: "readback", queryReason: undefined });
    this.receive(q);
    return true;
  }

  /** The operator's "correct", "no" or "cancel that". */
  private respond(kind: "confirm" | "negate" | "cancel") {
    const t = this.t;
    let target: Order | undefined;
    for (let k = this.st.orders.length - 1; k >= 0; k--) {
      const o = this.st.orders[k];
      if (kind === "cancel") {
        if (o.status !== "done" && o.status !== "cancelled" && o.status !== "refused") target = o;
      } else if (o.status === "queried" && t - o.t < 60) target = o;
      else if (o.readbackAt !== undefined && o.ackAt === undefined && o.rejectedAt === undefined && t - o.readbackAt <= this.P.ackWindowS) target = o;
      if (target) break;
    }
    if (!target) return;
    const o = target;
    if (kind === "cancel") {
      this.cancelTimers((tm) => tm.data.orderId === o.id);
      this.updateOrder(o, { status: "cancelled" });
      if (o.intent.k === "carm") {
        if (this.opts.carm?.driveTo) this.opts.carm.driveTo(null);
        else this.opts.input?.emit({ t: "carm", laoDegPerS: 0, cranDegPerS: 0, source: "team:radiographer" });
      }
      this.say(o.role, "Cancelled.", "report", { to: "operator", orderId: o.id });
      return;
    }
    if (o.status === "queried") {
      if (kind === "negate") {
        this.updateOrder(o, { status: "cancelled" });
        this.say(o.role, "OK, not doing that.", "report", { to: "operator", orderId: o.id });
        return;
      }
      const acc = this.mem<string | null>(`query.${o.id}.accept`, null);
      if (acc === null || o.heard.k !== "drug") {
        this.say(o.role, "Sorry, I need the full order.", "query", { to: "operator", orderId: o.id });
        return;
      }
      // the question stated the full order, so "yes" closes the loop
      this.updateOrder(o, { heard: { ...o.heard, ...(JSON.parse(acc) as object) } as TeamIntent, ackAt: t, readbackAt: o.readbackAt ?? t, readbackText: o.readbackText ?? "(query)", queryReason: o.queryReason });
      this.telemetry("team.ack", { orderId: o.id, via: "query" });
      receiveDrugOrder(this, o, true);
      return;
    }
    if (kind === "confirm") {
      this.updateOrder(o, { ackAt: t });
      this.telemetry("team.ack", { orderId: o.id, misheard: !!o.misheard });
      if (o.misheard) this.telemetry("team.misheard-confirmed", { orderId: o.id });
      return;
    }
    // negate a read-back
    if (o.status === "done") {
      this.updateOrder(o, { rejectedAt: t });
      this.say(o.role, "That's already been done.", "report", { to: "operator", orderId: o.id });
      return;
    }
    this.cancelTimers((tm) => tm.data.orderId === o.id);
    this.updateOrder(o, { rejectedAt: t, status: "cancelled" });
    if (o.misheard) this.telemetry("team.misheard-caught", { orderId: o.id });
    this.say(o.role, "Sorry, say again?", "query", { to: "operator", orderId: o.id });
  }

  // --- world -------------------------------------------------------------------------------

  /** Engine and dose telemetry (what PatientEngine.drainEvents() and DoseTracker.drainEvents() returned). */
  onTelemetry(events: readonly TelemetryEvent[]) {
    for (const ev of events) {
      if (ev.kind.startsWith("team.")) continue;
      patientTelemetry(this, ev);
      physiologistTelemetry(this, ev);
      scrubTelemetry(this, ev);
      radiographerTelemetry(this, ev);
      sedationTelemetry(this, ev);
    }
  }

  /** The lab reports a balloon inflation (if it does not call engine.stimulus("balloon")). */
  notifyInflation() {
    noteInflation(this);
  }

  /** The lab loaded an item from the table into the patient. Returns the item actually used. */
  itemUsed(itemId: number): ItemSpec | null {
    return itemUsed(this, itemId);
  }

  /** The operator gives a syringe from the table (button). */
  administer(drug?: Parameters<typeof administer>[1]): boolean {
    return administer(this, drug);
  }

  /** Advance team time by dt seconds (call every frame, after the engine). */
  advance(dt: number) {
    if (!(dt > 0)) return;
    const end = this.st.t + Math.min(dt, 1);
    // run timers at their own times so chained actions keep their spacing within a long frame
    for (let guard = 0; guard < 1000; guard++) {
      let next = Infinity;
      for (const tm of this.st.timers) if (tm.at < next) next = tm.at;
      if (next > end) break;
      this.st.t = Math.max(this.st.t, next);
      this.runTimers();
    }
    this.st.t = end;
    this.runTimers();
    physiologistTick(this);
    sedationTick(this);
    patientTick(this);
  }

  // --- outputs ----------------------------------------------------------------------------

  report(): CommunicationReport {
    return communicationReport(this.st, this.P);
  }

  snapshot(): TeamState {
    return JSON.parse(JSON.stringify(this.st)) as TeamState;
  }

  restore(s: TeamState) {
    this.st = JSON.parse(JSON.stringify(s)) as TeamState;
    this.rngObj.state = this.st.rng;
  }
}

function definedOf<T extends object>(o: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined && k !== "k") (out as Record<string, unknown>)[k] = v;
  return out;
}
