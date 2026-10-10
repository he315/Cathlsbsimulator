// ---------------------------------------------------------------------------
// The team and the lab's sound for one case (C4 integration in the diagnostic
// and PCI labs). The wiring follows the C4 development page
// (src/ui/team/demo/main.tsx) and the LabAudio header:
//
//   per frame, after the patient engine has advanced:
//     events = engine.drainEvents() + dose events + lab events
//     team.onTelemetry(events); audio.onTelemetry(events)
//     team.advance(dt); audio.frame()
//   the team's own telemetry is drained for the attending's recorder.
//
// One AudioEngine is shared by every lab of the page, so the sound unlocked
// in one lab (a user gesture) stays on in the next. Imaging protocol orders
// ("fifteen frames", "field 20") come back through `onProtocol` for the lab
// to apply to its own imaging chain.
// ---------------------------------------------------------------------------

import { AudioEngine } from "../../audio/engine";
import { LabAudio } from "../../audio/labAudio";
import type { ExposureMode } from "../../audio/sounds";
import type { PatientEngine } from "../../simulation/patient/engine";
import type { TelemetryEvent } from "../../simulation/session/types";
import { Team } from "../../simulation/team/team";
import type { CArmPort, ImagingView, InputPort, Order, PreparedSyringe, TablePort, TeamAction } from "../../simulation/team/types";
import { DRUG_SPOKEN, ROUTE_SPOKEN, spokenDose } from "../../simulation/team/intents";
import { DRUGS, type DrugId, type Route } from "../../simulation/patient/pharmacology";
import type { InputBus } from "../../input/bus";

/** The operator's question about PDE-5 inhibitors before a nitrate (askAboutPde5). */
export const PDE5_QUESTION = "Have you taken anything for erections, sildenafil, tadalafil or similar, in the last two days?";

/**
 * How the patient phrases when the PDE-5 inhibitor was taken (askAboutPde5): under `recentH` hours
 * "about N hours ago", under `yesterdayH` "yesterday", else "a couple of days ago". MODEL PARAMETER for
 * display phrasing only; the nitrate windows themselves are the formulary's (PDE5_WINDOW_H).
 */
export const MP_PDE5_ANSWER_HOURS = { recentH: 12, yesterdayH: 36 } as const;

/** A drug order from the drugs tab (diag-lab-drugs): formulary id, dose in the formulary unit, route. */
export interface LabDrugOrder {
  drug: DrugId;
  dose: number;
  route: Route;
  /** coronary side of an intracoronary dose */
  side?: "left" | "right";
}

let shared: AudioEngine | null = null;

/**
 * The physiologist's low-pressure call-out (diag-pressure-transducer, lab request pm-engaging#0): a
 * displayed systolic pressure below this, mmHg. From the module text: in the Oxford team model the
 * physiologist calls out a significant fall, "as a rule of thumb a systolic below 90 mmHg"
 * (pm-engaging, src/content/manual/pci-manual/07-engaging.ts). The hold and recovery values below are
 * MODEL PARAMETERS.
 */
export const MP_CALLOUT_SYSTOLIC_MMHG = 90;
/** Seconds the displayed systolic must stay below the threshold before the call-out. MODEL PARAMETER. */
export const MP_CALLOUT_HOLD_S = 3;
/** The episode ends once the displayed systolic has been this far above the threshold for MP_CALLOUT_HOLD_S, mmHg. MODEL PARAMETER. */
export const MP_CALLOUT_RECOVER_MMHG = 5;

/** The page's audio engine (created on first use; nothing sounds until a gesture unlocks it). */
export function sharedAudioEngine(): AudioEngine {
  shared ??= new AudioEngine();
  return shared;
}

export type ProtocolAction = Extract<TeamAction, { a: "protocol" }>;

export interface LabTeamOptions {
  seed: string;
  patient: PatientEngine;
  input?: (InputPort & { bus: InputBus }) | null;
  carm?: CArmPort | null;
  table?: TablePort | null;
  imaging: () => ImagingView;
  catheterSide: () => "left" | "right" | null;
  sedationRole?: "sedation-nurse" | "anaesthetist";
  /** the audio engine (default: the page's shared one); null for a silent lab (tests) */
  audioEngine?: AudioEngine | null;
  /**
   * The physiologist calls out a displayed systolic pressure below MP_CALLOUT_SYSTOLIC_MMHG, once
   * per episode (diag-pressure-transducer). Off by default, so the labs that do not ask for it are
   * unchanged; the diagnostic lab turns it on.
   */
  systolicCallout?: boolean;
}

export class LabTeam {
  readonly team: Team;
  readonly audioEngine: AudioEngine | null;
  readonly audio: LabAudio | null;
  readonly patient: PatientEngine;
  readonly sedationRole: "sedation-nurse" | "anaesthetist";
  /** imaging protocol orders the radiographer has carried out (the lab applies them) */
  onProtocol: ((a: ProtocolAction) => void) | null = null;
  /** every event the lab saw this case (engine, dose, team), newest last, capped */
  readonly log: TelemetryEvent[] = [];
  private pending: TelemetryEvent[] = [];
  private teamOut: TelemetryEvent[] = [];
  private sinks = new Set<(ev: readonly TelemetryEvent[]) => void>();
  private offs: (() => void)[] = [];
  private disposed = false;
  private readonly systolicCallout: boolean;
  /** the low-systolic episode: patient time it began (below the threshold) or began to recover, and whether it has been called */
  private lowSince: number | null = null;
  private okSince: number | null = null;
  private lowCalled = false;

  constructor(o: LabTeamOptions) {
    this.patient = o.patient;
    this.systolicCallout = !!o.systolicCallout;
    this.sedationRole = o.sedationRole ?? "sedation-nurse";
    this.team = new Team({
      seed: o.seed,
      patient: o.patient,
      input: o.input ?? null,
      carm: o.carm ?? null,
      table: o.table ?? null,
      imaging: o.imaging,
      catheterSide: o.catheterSide,
      sedationRole: this.sedationRole,
    });
    this.audioEngine = o.audioEngine === undefined ? sharedAudioEngine() : o.audioEngine;
    this.audio = this.audioEngine ? new LabAudio(this.audioEngine) : null;
    this.audio?.setPatient(o.patient);
    this.offs.push(
      this.team.bus.on("action", (a: TeamAction) => {
        if (a.a === "protocol") {
          this.onProtocol?.(a);
          this.audio?.setImaging({ fluoroLevel: a.fluoroLevel, fluoroPps: a.fluoroPps, cinePps: a.cinePps });
        }
      })
    );
    if (this.audio) {
      if (o.input) this.offs.push(this.audio.attachInput(o.input.bus));
      this.offs.push(this.audio.attachTeam(this.team));
    }
  }

  /** Events from the lab itself (dose signals, device events) for the next frame. */
  push(events: readonly TelemetryEvent[]) {
    for (const e of events) this.pending.push(e);
  }

  /** Receive every frame's events (engine, dose and team): the attending's recorder, the case session's log. */
  onEvents(fn: (ev: readonly TelemetryEvent[]) => void): () => void {
    this.sinks.add(fn);
    return () => this.sinks.delete(fn);
  }

  /** One frame, after the patient engine has advanced by dt seconds. */
  step(dt: number) {
    if (this.disposed || !(dt > 0)) return;
    const ev = this.patient.drainEvents().concat(this.pending.splice(0));
    this.team.onTelemetry(ev);
    this.audio?.onTelemetry(ev);
    this.team.advance(dt);
    if (this.systolicCallout) this.checkSystolic();
    this.audio?.frame();
    const own = this.team.drainEvents();
    for (const e of own) this.teamOut.push(e);
    const all = own.length ? ev.concat(own) : ev;
    if (all.length) {
      for (const e of all) this.log.push(e);
      if (this.log.length > 2000) this.log.splice(0, this.log.length - 2000);
      for (const f of this.sinks) f(all);
    }
  }

  /**
   * The physiologist reads the monitor: a displayed systolic below the threshold for the hold time is
   * called out once; the episode ends after the systolic has recovered for the hold time. A line
   * without a pressure (no catheter, a port open) is not an episode.
   */
  private checkSystolic() {
    const v = this.patient.vitals();
    const sys = v.art?.sys;
    const t = v.t;
    if (sys === undefined || !Number.isFinite(sys)) {
      this.lowSince = null;
      return;
    }
    if (sys < MP_CALLOUT_SYSTOLIC_MMHG) {
      this.okSince = null;
      this.lowSince ??= t;
      if (!this.lowCalled && t - this.lowSince >= MP_CALLOUT_HOLD_S) {
        this.lowCalled = true;
        this.team.say("physiologist", `Systolic's down to ${Math.round(sys)}.`, "callout", { to: "operator", urgent: true });
        this.team.telemetry("team.callout", { what: "systolic-low", sys: Math.round(sys) });
      }
      return;
    }
    this.lowSince = null;
    if (sys > MP_CALLOUT_SYSTOLIC_MMHG + MP_CALLOUT_RECOVER_MMHG) {
      this.okSince ??= t;
      if (t - this.okSince >= MP_CALLOUT_HOLD_S) this.lowCalled = false;
    }
  }

  // --- drug orders (diag-lab-drugs) ----------------------------------------------------
  //
  // The drugs tab orders through the team as a spoken order would: the operator's order, the
  // nurse's read-back ("200 micrograms of GTN intracoronary."), then an IV or IM drug given by the
  // nurse, or an intracoronary or intra-arterial syringe drawn up and put on the table for the
  // operator to give. The team's own rules apply (queries, a large dose, the prep times).

  /** Order a drug by its formulary id, dose in the formulary unit and route. Returns the team's order (null if the team took none). */
  orderDrug(o: LabDrugOrder): Order | null {
    const unit = DRUGS[o.drug].unit;
    const raw = `${DRUG_SPOKEN[o.drug].replace(/^./, (c) => c.toUpperCase())} ${spokenDose(o.dose, unit)} ${ROUTE_SPOKEN[o.route]}${o.route === "ic" && o.side ? `, ${o.side}` : ""}, please.`;
    return this.team.intent({ raw, intent: { k: "drug", drug: o.drug, dose: o.dose, unit, route: o.route, side: o.route === "ic" ? o.side : undefined } }, "button");
  }

  /** Order a crystalloid bolus, mL (the sedation nurse runs it in). */
  orderFluid(ml: number): Order | null {
    return this.team.intent({ raw: `${Math.round(ml)} mL of saline as a bolus, please.`, intent: { k: "fluid", ml } }, "button");
  }

  /** The operator confirms the last read-back ("Correct."). */
  confirmReadback() {
    this.team.intent({ raw: "Correct.", intent: { k: "confirm" } }, "button");
  }

  /** A team order by id (status, read-back). */
  orderById(id: number): Order | undefined {
    return this.team.st.orders.find((x) => x.id === id);
  }

  /** The syringes drawn up and waiting on the table, oldest first. */
  syringesOnTable(): PreparedSyringe[] {
    return this.team.st.syringes.filter((s) => s.givenAt === undefined);
  }

  /**
   * The operator discards a syringe waiting on the table (one the attending stopped, or one no longer
   * wanted): it leaves the table and cannot be given. Returns the operator's line, or null when no
   * syringe was waiting for that order.
   */
  discardSyringe(orderId: number): string | null {
    const st = this.team.st.syringes;
    const k = st.findIndex((x) => x.orderId === orderId && x.givenAt === undefined);
    if (k < 0) return null;
    const [syr] = st.splice(k, 1);
    const raw = "Discard that syringe.";
    this.team.say("operator", raw, "order", { to: "scrub", orderId });
    this.team.telemetry("team.syringe-discarded", { orderId, drug: syr.drug, dose: syr.dose, route: syr.route });
    return raw;
  }

  /**
   * The operator rejects the last read-back ("No, that's not right."): the team cancels that order and
   * asks again, and a misheard dose is logged as caught. Past the read-back's acknowledgement window
   * there is no read-back to reject, so the newest open order is cancelled instead ("Cancel that.").
   * Returns the operator's line.
   */
  rejectReadback(): string {
    const t = this.team.t;
    const win = this.team.P.ackWindowS;
    const live = this.team.st.orders.some((o) => o.status === "queried" || (o.readbackAt !== undefined && o.ackAt === undefined && o.rejectedAt === undefined && t - o.readbackAt <= win));
    const raw = live ? "No, that's not right." : "Cancel that.";
    this.team.intent({ raw, intent: live ? { k: "negate" } : { k: "cancel" } }, "button");
    return raw;
  }

  /**
   * The operator gives a syringe from the table (the team's own hand-off). With `orderId`, the syringe
   * drawn up for that order; otherwise the newest of this drug. False when there is none.
   */
  giveSyringe(drug?: DrugId, orderId?: number): boolean {
    if (orderId === undefined) return this.team.administer(drug);
    const st = this.team.st.syringes;
    const k = st.findIndex((x) => x.orderId === orderId && x.givenAt === undefined);
    if (k < 0) return false;
    // the team's hand-off takes the newest match: put this syringe last for the call, then back in its place
    const [syr] = st.splice(k, 1);
    st.push(syr);
    const ok = this.team.administer(syr.drug);
    const j = st.indexOf(syr);
    if (j >= 0) st.splice(k, 0, ...st.splice(j, 1));
    return ok;
  }

  /** A team member declines an order out loud (a route that harms, for example), and the reason is logged. */
  declineOrder(text: string, what: Record<string, unknown> = {}) {
    this.team.say("scrub", text, "query", { to: "operator", urgent: true });
    this.team.telemetry("team.order-declined", { text, ...what });
  }

  /**
   * The operator asks the patient about PDE-5 inhibitors before a nitrate (lab request pm-acquiring#0;
   * the windows are the formulary's, PDE5_WINDOW_H, Brilakis 3.2). The patient answers from the
   * engine's patient: the agent and roughly when, or no. A patient who cannot speak does not answer.
   */
  askAboutPde5(): void {
    this.team.say("operator", PDE5_QUESTION, "to-patient", { to: "patient" });
    this.team.telemetry("team.patient-asked", { topic: "pde5" });
    const v = this.patient.vitals();
    if (v.symptoms && v.symptoms.conscious < 0.5) return;
    const p = this.patient.profile.pde5;
    const hours = p ? p.hoursAgo + this.patient.time / 3600 : null;
    let text = "No, nothing like that.";
    if (p && hours !== null) {
      const name = p.agent.charAt(0).toUpperCase() + p.agent.slice(1);
      const when = hours < MP_PDE5_ANSWER_HOURS.recentH ? `about ${Math.max(1, Math.round(hours))} hours ago` : hours < MP_PDE5_ANSWER_HOURS.yesterdayH ? "yesterday" : "a couple of days ago";
      text = `Yes, ${name}, ${when}.`;
    }
    this.team.say("patient", text, "patient", { to: "operator" });
  }

  /** The team's own telemetry since the last call. */
  drainTeamEvents(): TelemetryEvent[] {
    return this.teamOut.splice(0);
  }

  /** The beam as the imaging chain produced it (the exposure tone follows this, not the raw pedals). */
  setExposure(mode: ExposureMode, o: { highLevel?: boolean; pps?: number } = {}) {
    this.audio?.setExposure(mode, o);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const f of this.offs) f();
    this.offs = [];
    this.sinks.clear();
    if (this.audio) {
      this.audio.exposure.set("off");
      this.audio.dispose();
    }
  }
}

/** One line per communication finding for the debrief (the team's own report). */
export function teamDebriefLines(t: Team): { lines: string[]; findings: { clock: string; severity: string; text: string }[] } {
  const r = t.report();
  return { lines: r.lines.slice(), findings: r.findings.map((f) => ({ clock: t.clock(f.t), severity: f.severity, text: f.text })) };
}
