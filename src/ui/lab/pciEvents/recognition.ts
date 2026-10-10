// ---------------------------------------------------------------------------
// Complication recognition (pci-cx-recognition): the recognition gate of the
// PCI tip context, and the learner's assessment reaching the session.
//
// The complication engine names nothing the learner has not assessed (its
// notes become cues, src/simulation/complications/engine.ts). The tip context
// gates complication events on snap.recognised (src/ui/lab/pciTips.ts); this
// file says what has been recognised, from the engine state:
//  - recognisedEvents(state): for every live complication whose cause the
//    learner has named correctly (a wrong cause leaves it unrecognised), its
//    own event (dissection, perforation, no-reflow, thrombus,
//    air, side-branch-compromise) and the ones this file adds below;
//  - withRecognition(snap): the snapshot with those merged into recognised.
// Sources, read from one snapshot like the base sources:
//  - slow-flow (a cue, never gated): a live complication leaves TIMI 2 or
//    less beyond the treated segment (a flow-limiting dissection, thrombus,
//    air or no-reflow), raised once a contrast run through the guide has
//    shown it (a run at or after its first sign, or one whose contrast was
//    still in the vessel, MP_RUN_WINDOW_S);
//  - acute-closure (gated): a live complication leaves TIMI 0-1 in the
//    treated vessel (not a side branch, not a perforation);
//  - aortocoronary-dissection (gated): an ostial dissection from the guide;
//  - perforation-large-vessel, perforation-distal (gated, with 'perforation'
//    from the base sources): where the hole is. 'perforation-collateral' is
//    not raised: the engine makes no collateral perforation yet (its
//    perforations are wire exits, distal, or at the device, large vessel), so
//    a source for it could never be active. It joins RAISED_SITES when
//    pci-perforation or pci-cto-retrograde creates collateral perforations.
// Before an assessment only cue events are raised (slow-flow here; st-elevation,
// chest-pain, hypotension and bradycardia from the patient); after it the
// complication's own events are raised and the phase is 'complication' until
// it is treated or resolved. VF and tamponade are patient events and are
// never gated.
//
// submitRecognition applies an assessment to a PCI session: the engine change
// (recognisePci, src/simulation/pci/actions/step.ts) goes through the
// session's public applyRecognition when it offers one, else its private
// update() (no attending gate: an assessment is a statement, not a hand
// action); the result is written to the session's recorder as a 'recognition'
// event for the mentor's metrics (src/mentor/metrics.ts). The package report
// names the public entry this wants on PciLabSession.
//
// `raises` is derived from PCI_EVENT_SOURCES (raisesFrom), with the phase this
// gate opens ('complication').
// ---------------------------------------------------------------------------

import type { LabEvent } from "../../../content/lab/tips";
import type { LabRaises } from "../../../content/lab/raisable/waiting";
import type { PciState } from "../../../simulation/pci/state";
import type { Complication, RecognitionAnswer } from "../../../simulation/complications/types";
import { MP_RUN_WINDOW_S, causeRecognised, cueHeld, perforationSite, timiOf, unrecognised } from "../../../simulation/complications/engine";
import { recognisePci, type PciRecognition } from "../../../simulation/pci/actions/step";
import type { RecordedEvent } from "../../../mentor/types";
import { raisesFrom } from "./base";
import type { PciEventSource, PciTipSnapshot } from "./index";

/** The engine's complication kinds to their tip events (as the base sources map them). */
const KIND_EVENT: Record<Complication["kind"], LabEvent> = {
  dissection: "dissection",
  perforation: "perforation",
  "no-reflow": "no-reflow",
  thrombus: "thrombus",
  air: "air",
  "side-branch": "side-branch-compromise",
};

const PERFORATION_EVENT = {
  "large-vessel": "perforation-large-vessel",
  distal: "perforation-distal",
  collateral: "perforation-collateral",
} as const satisfies Record<ReturnType<typeof perforationSite>, LabEvent>;

/** The perforation sites the engine can make now (see the header: no collateral perforation yet). */
const RAISED_SITES = ["large-vessel", "distal"] as const satisfies readonly ReturnType<typeof perforationSite>[];

const live = (c: Complication) => c.stage === "overt" || c.stage === "prodrome" || c.stage === "treated";
/** Before treatment: what the tips of an open complication are about. */
const open = (c: Complication) => c.stage === "overt" || c.stage === "prodrome";

/** The treated vessel's flow is slow (TIMI 2 or less) because of this complication. */
export function slowsFlow(c: Complication): boolean {
  if (c.kind === "perforation" || c.kind === "side-branch") return false;
  return timiOf(c)[0] <= 2;
}

/** This complication has closed the treated vessel (TIMI 0-1). */
export function closesVessel(c: Complication): boolean {
  if (c.kind === "perforation" || c.kind === "side-branch") return false;
  return timiOf(c)[1] <= 1;
}

/** The tip events of one complication: its own, acute closure, the aortocoronary flag and the perforation's site. */
export function complicationEvents(c: Complication): LabEvent[] {
  const out: LabEvent[] = [KIND_EVENT[c.kind]];
  if (closesVessel(c)) out.push("acute-closure");
  if (c.kind === "dissection" && c.data.ostial) out.push("aortocoronary-dissection");
  if (c.kind === "perforation") out.push(PERFORATION_EVENT[perforationSite(c)]);
  return out;
}

/** The events the learner has recognised: those of every live complication whose cause was named correctly. */
export function recognisedEvents(st: Pick<PciState, "cx">): LabEvent[] {
  const out = new Set<LabEvent>();
  for (const c of st.cx.list) if (causeRecognised(c) && live(c)) complicationEvents(c).forEach((e) => out.add(e));
  return [...out];
}

/**
 * The snapshot with the engine's recognitions merged into snap.recognised (true stays true). The PCI lab
 * passes every snapshot through this before asking for the tip context.
 */
export function withRecognition<T extends PciTipSnapshot>(snap: T): T {
  if (snap.recognised === true) return snap;
  const given = Array.isArray(snap.recognised) ? snap.recognised : [];
  const mine = recognisedEvents(snap.state);
  if (!mine.length && snap.recognised !== undefined) return snap;
  return { ...snap, recognised: [...new Set<LabEvent>([...given, ...mine])] };
}

/**
 * A contrast run through the guide has been made since this complication's first sign, or its contrast was
 * still in the vessel when it began (MP_RUN_WINDOW_S): the image shows it.
 */
export function imaged(st: Pick<PciState, "cx">, c: Complication): boolean {
  const run = st.cx.lastRunT ?? null;
  return run !== null && run + MP_RUN_WINDOW_S >= (c.tOvert ?? c.t0);
}

/**
 * Live complications the learner has not assessed yet and could have seen (no image cue of theirs still
 * waiting for a contrast run), oldest first: the attending's prompt in guided practice.
 */
export function awaitingAssessment(st: Pick<PciState, "cx">): Complication[] {
  return unrecognised(st.cx)
    .filter((c) => !cueHeld(st.cx, c.id))
    .sort((a, b) => a.t0 - b.t0);
}

const anyOpen = (snap: PciTipSnapshot, f: (c: Complication) => boolean) => snap.state.cx.list.some((c) => open(c) && f(c));
const anyEver = (snap: PciTipSnapshot, f: (c: Complication) => boolean) => snap.state.cx.list.some((c) => c.tOvert !== null && f(c));

export const PCI_EVENT_SOURCES: readonly PciEventSource[] = [
  // the cue: contrast is slow beyond the treated segment (no name, no grade)
  { event: "slow-flow", active: (snap) => anyOpen(snap, (c) => slowsFlow(c) && imaged(snap.state, c)) },
  // named once the learner has assessed it
  { event: "acute-closure", gate: "recognition", active: (snap) => anyOpen(snap, closesVessel), finish: "active" },
  {
    event: "aortocoronary-dissection",
    gate: "recognition",
    active: (snap) => anyOpen(snap, (c) => c.kind === "dissection" && !!c.data.ostial),
    finish: (snap) => anyEver(snap, (c) => c.kind === "dissection" && !!c.data.ostial),
  },
  ...RAISED_SITES.map(
    (site): PciEventSource => ({
      event: PERFORATION_EVENT[site],
      gate: "recognition",
      active: (snap) => anyOpen(snap, (c) => c.kind === "perforation" && perforationSite(c) === site),
      finish: (snap) => anyEver(snap, (c) => c.kind === "perforation" && perforationSite(c) === site),
    })
  ),
];

/** The events this file adds to the PCI tip context. */
export const RECOGNITION_EVENTS: readonly LabEvent[] = PCI_EVENT_SOURCES.map((s) => s.event);

export const raises: LabRaises = raisesFrom(PCI_EVENT_SOURCES, { phases: ["complication"] });

// --- the assessment reaching the session ----------------------------------------------------------

/** What submitRecognition needs of a session (PciLabSession fits). */
export interface RecognitionSession {
  readonly st: PciState;
  /** a public entry for the assessment's engine change (preferred when present) */
  applyRecognition?(f: (x: PciState) => PciState): boolean;
  readonly recorder?: { event(e: RecordedEvent): unknown };
  wall?(): number;
  readonly engine?: { time: number };
}

/** The recorder event kind of an assessment. */
export const RECOGNITION_EVENT = "recognition";

/** Apply an engine change to the session without the attending's gate. False when the session has no entry. */
function applyToSession(session: RecognitionSession, f: (x: PciState) => PciState): boolean {
  if (typeof session.applyRecognition === "function") return session.applyRecognition(f);
  const update = (session as unknown as { update?: (fn: (x: PciState) => PciState) => void }).update;
  if (typeof update === "function") {
    update.call(session, f);
    return true;
  }
  if (import.meta.env?.DEV) throw new Error("submitRecognition: the PCI session offers neither applyRecognition() nor update(); the assessment cannot reach the engine.");
  return false;
}

/**
 * Submit the learner's assessment to a session: the engine scores it and, when the cause is right, names
 * the complication from now on; the live log shows only the learner's answer; the recorder gets a 'recognition' event (id, kind, cause, correct, delayS; falseAlarm when there
 * was nothing to recognise). Returns what happened, or null when the session could not take it.
 */
export function submitRecognition(session: RecognitionSession, answer: RecognitionAnswer): PciRecognition | null {
  let result: PciRecognition | null = null;
  const ok = applyToSession(session, (st) => {
    const r = recognisePci(st, answer);
    result = r.result;
    return r.st;
  });
  const res = result as PciRecognition | null;
  if (!ok || !res) return null;
  const rec = res.recognition;
  session.recorder?.event({
    kind: RECOGNITION_EVENT,
    tWall: session.wall?.() ?? session.st.t,
    tPatient: session.engine?.time ?? session.st.t,
    step: 0,
    cmd: 0,
    ext: true,
    data: rec
      ? { id: res.id, kind: res.kind, cause: answer.cause, correct: rec.score.correct, delayS: rec.delayS, score: { cause: rec.score.cause, grade: rec.score.grade, site: rec.score.site, timi: rec.score.timi } }
      : { id: null, cause: answer.cause, correct: false, falseAlarm: true },
  });
  return res;
}
