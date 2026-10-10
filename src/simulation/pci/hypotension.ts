// ---------------------------------------------------------------------------
// The PCI lab's hypotension causes (pci-patient-coupling), added to the shared
// cause model (src/simulation/patient/hypotensionCauses.ts, proc-hypotension-
// pressors) with registerHypotensionCause, so the debrief, the right heart
// read-out and the drug rules have one source.
//
// Brilakis's five measurement faults (28.1.1.1, lesson pm-monitoring-pressure,
// pci-manual/02-monitoring.ts:270-297) and the guide's own true causes
// (cm-patient-complications-hypotension, complication-management/
// 05-patient-complications.ts: the valve row of the table and the pitfalls):
//   valve-open           the Y-connector valve left open: the trace falls or
//                        flattens; closing it restores it (false reading);
//   guide-damping        a guide against the wall or a large guide at an
//                        ostium: a damped trace (false reading; it limits the
//                        inflow as it damps, so it is not harmless);
//   deep-engagement      a guide pushed deep: the trace damps and the artery
//                        is starved (catheter-induced ischaemia, Brilakis 6.5:
//                        ischaemia, hypotension and arrhythmia; cardiac);
//   contrast-in-guide    contrast left in the guide lumen damps the trace
//                        (false reading; flushing clears it);
//   thrombus-in-guide    a plug of thrombus in the lumen (false reading;
//                        aspirate, withdraw slightly and aspirate again);
//   bulky-device         a device filling most of the guide lumen damps the
//                        trace (Brilakis's example: an aspiration catheter in
//                        a 6 Fr guide; false reading while it is in);
//   cusp-open            an Amplatz, or an EBU with a deep curve, holding an
//                        aortic cusp open: acute aortic regurgitation, a true
//                        fall that recovers at once when the guide is pulled
//                        back (cardiac: the valve).
// Each cause carries the signature the lesson teaches a learner to read: the
// right heart pattern of its mechanism and the cuff, the heart rate, the
// waveform and the manoeuvre that came just before it. A cause is hidden: the
// lab never names it on a live screen; the debrief does.
//
// The causes act through a port (PciCausePort): the patient engine's public
// methods and the lab's own controls (the valve, the guide's depth, the
// guide's lumen, a device in the guide), so this module imports no session.
// HypotensionEpisode records the onset, the learner's first action after it
// and the resolution, for time to recognition.
//
// Every number here is a MODEL PARAMETER (MP_PCI_CAUSES; docs/realism/facts/
// pkg-pci-patient-coupling.md).
// ---------------------------------------------------------------------------

import {
  registerHypotensionCause,
  hypotensionCause,
  type CauseRun,
  type CauseSignature,
  type CauseTreatment,
  type HypotensionCause,
  type HypotensionEnginePort,
} from "../patient/hypotensionCauses";

/** MODEL PARAMETERS of the PCI causes (simulator settings, not clinical values). */
export const MP_PCI_CAUSES = {
  /** a guide pushed this far beyond the ostium (mm) damps against the wall (guide-damping) */
  dampingDepthMm: 6.5,
  /** ... and this far it wedges and starves the artery (deep-engagement) */
  deepDepthMm: 8,
  /** a guide back at or above this depth (mm) has come off the wall, the cusp or the vessel */
  releasedDepthMm: 1,
  /** the depth an Amplatz or deep EBU is pushed to as it holds the cusp open (mm) */
  cuspDepthMm: 4,
  /** acute aortic regurgitation through the cusp held open (engine severity 0..1, with MP_COUPLING.arConductanceMlSPerMmHg) */
  cuspRegurgitation: 1,
  /** contrast left in the guide lumen: the transducer's contrast fraction */
  contrastFraction: 1,
  /**
   * ... and the effective catheter lumen radius the pressure sees through it (mm): the viscosity term alone
   * (transducer.ts MP_MU_CONTRAST) leaves the trace at the heart's frequencies almost unchanged, so the contrast
   * that clings to the lumen narrows it for the pressure column until the trace is visibly damped
   */
  contrastLumenRmm: 0.3,
  /** a bulky device in the guide: the effective catheter lumen radius the pressure sees (mm) */
  bulkyLumenRmm: 0.28,
  /** aspirations that clear a plug of thrombus from the guide (with a slight withdrawal between) */
  plugAspirations: 2,
} as const;

/** The trace shape a cause gives on the guide's pressure line (the lesson's words). */
export type CauseWaveform = "flat" | "damped" | "ventricularised" | "wide pulse pressure" | "low" | "pulsus paradoxus" | "slow";

/** A PCI-lab hypotension cause: the shared cause with the waveform and the manoeuvre that came before it. */
export interface PciHypotensionCause extends HypotensionCause {
  waveform: CauseWaveform;
  /** the manoeuvre that came just before it ('Ask what has just been done', the hypotension lesson's step 3) */
  lastManoeuvre: string;
  /** the guide families it needs (the cusp: AL or EBU); absent: any */
  guides?: readonly string[];
}

/** The lab's side of a cause: what the operator's hands and the table change. */
export interface PciCauseLab {
  valveOpen(): boolean;
  setValve(open: boolean): void;
  guideEngaged(): boolean;
  guideDepthMm(): number;
  /** push (+) or pull (−) the engaged guide (mm) */
  seatGuide(mm: number): void;
  /** the guide's catheter family (AL, EBU, JL...) */
  guideFamily(): string;
  /** a device (balloon, stent, imaging or aspiration catheter) is in the guide */
  deviceInGuide(): boolean;
  /** guide flushes so far */
  flushes(): number;
  /** guide aspirations so far */
  aspirations(): number;
}

/** What the PCI causes act on: the patient engine's methods and the lab. */
export interface PciCausePort extends HypotensionEnginePort {
  readonly lab: PciCauseLab;
  setAorticRegurgitation?(severity: number | null): void;
  readonly transducer?: HypotensionEnginePort["transducer"] & {
    setContrast?(frac: number): void;
    setLumenPlug?(on: boolean): void;
    line?: { catheterCm: number; catheterRmm: number; lineCm: number; lineRmm: number; dampingGain?: number };
  };
}

const PCI_SOURCE = "pci-patient-coupling: Brilakis 28.1.1.1 (pm-monitoring-pressure, pci-manual/02-monitoring.ts:270-297) and 28.1 (cm-patient-complications-hypotension)";
const LESSON = "cm-patient-complications-hypotension";
const FALSE_SIG: CauseSignature = { filling: "normal", output: "normal", ra: "normal", rate: "normal", cuff: "normal" };
const NO_DRUG = (what: string) => ({ right: [], acceptable: [], otherwise: `Treating a false reading with a vasopressor: ${what}`, expected: `No drug: ${what}`, causeFirst: true }) as const;

const asPci = (p: HypotensionEnginePort) => p as PciCausePort;

/** A cause fits the guide when it names no guide families or names this one. */
function guideFits(c: Pick<PciHypotensionCause, "guides">, family: string | null | undefined): boolean {
  return !c.guides || (!!family && c.guides.includes(family));
}

/** A run that stops when `resolved` holds, checked on every tick (and undoes its effect through `undo`). */
function watchRun(causeId: string, resolved: (p: PciCausePort) => boolean, undo: (p: PciCausePort) => void, treats: readonly CauseTreatment[] = []): CauseRun {
  let stopped = false;
  const stop = (p: PciCausePort) => {
    if (stopped) return;
    stopped = true;
    undo(p);
  };
  return {
    causeId,
    tick: (port) => {
      if (!stopped && resolved(asPci(port))) stop(asPci(port));
    },
    treat: (port, t) => {
      if (!treats.includes(t)) return false;
      stop(asPci(port));
      return true;
    },
    stopped: () => stopped,
  };
}

/** The guide families that hold a cusp open (the hypotension lesson's valve row, tip pci-hypo-amplatz-valve). */
const CUSP_GUIDES: readonly string[] = ["AL", "EBU"];

/** The PCI lab's causes. */
export const PCI_CAUSES: readonly PciHypotensionCause[] = [
  {
    id: "valve-open",
    mechanism: "false-reading",
    label: "An open Y-connector valve (a false low reading)",
    signature: FALSE_SIG,
    waveform: "flat",
    lastManoeuvre: "a device loaded through the Y-connector",
    treatment: "Close the Y-connector valve and look again; the cuff agrees with the patient, not the line",
    treatments: [],
    bridge: NO_DRUG("close the valve"),
    lessonId: LESSON,
    source: PCI_SOURCE,
    start(port) {
      const p = asPci(port);
      if (!p.lab) return null;
      p.lab.setValve(true);
      return watchRun("valve-open", (q) => !q.lab.valveOpen(), () => undefined);
    },
  },
  {
    id: "guide-damping",
    mechanism: "false-reading",
    label: "The guide damping against the wall (a false low reading that also limits inflow)",
    signature: FALSE_SIG,
    waveform: "damped",
    lastManoeuvre: "the guide pushed in for back-up",
    treatment: "Withdraw the guide slightly until the trace is aortic again; do not inject while it is damped",
    treatments: [],
    bridge: NO_DRUG("reposition the guide"),
    lessonId: LESSON,
    source: PCI_SOURCE,
    start(port) {
      const p = asPci(port);
      if (!p.lab?.guideEngaged()) return null;
      const d = p.lab.guideDepthMm();
      if (d < MP_PCI_CAUSES.dampingDepthMm) p.lab.seatGuide(MP_PCI_CAUSES.dampingDepthMm - d);
      return watchRun("guide-damping", (q) => !q.lab.guideEngaged() || q.lab.guideDepthMm() <= MP_PCI_CAUSES.releasedDepthMm, () => undefined);
    },
  },
  {
    id: "deep-engagement",
    mechanism: "cardiac",
    label: "Deep engagement starving the artery (catheter-induced ischaemia)",
    signature: { filling: "high", output: "low", ra: "normal", rate: "fast", cuff: "low" },
    waveform: "ventricularised",
    lastManoeuvre: "the guide pushed deep for support",
    treatment: "Pull the guide back out of the vessel at once; ischaemia, hypotension and arrhythmia follow a catheter that occludes the ostium (Brilakis 6.5)",
    treatments: [],
    bridge: {
      right: [],
      acceptable: ["noradrenaline"],
      otherwise: "Withdraw the guide: the cause is mechanical",
      expected: "Withdraw the guide; a pressor only as a bridge if the pressure does not recover",
      causeFirst: true,
    },
    lessonId: LESSON,
    source: `${PCI_SOURCE}; Brilakis 6.5 (the hypotension lesson's pitfalls)`,
    start(port) {
      const p = asPci(port);
      if (!p.lab?.guideEngaged()) return null;
      const d = p.lab.guideDepthMm();
      if (d < MP_PCI_CAUSES.deepDepthMm) p.lab.seatGuide(MP_PCI_CAUSES.deepDepthMm - d);
      return watchRun("deep-engagement", (q) => !q.lab.guideEngaged() || q.lab.guideDepthMm() <= MP_PCI_CAUSES.releasedDepthMm, () => undefined);
    },
  },
  {
    id: "contrast-in-guide",
    mechanism: "false-reading",
    label: "Contrast left in the guide (a damped, falsely low reading)",
    signature: FALSE_SIG,
    waveform: "damped",
    lastManoeuvre: "an injection, with the guide not cleared afterwards",
    treatment: "Flush the guide with saline and look again",
    treatments: ["flush-line"],
    bridge: NO_DRUG("flush the guide"),
    lessonId: LESSON,
    source: PCI_SOURCE,
    start(port) {
      const p = asPci(port);
      const tx = p.transducer;
      if (!p.lab || !tx?.setContrast) return null;
      tx.setContrast(MP_PCI_CAUSES.contrastFraction);
      const line = tx.line;
      const r0 = line?.catheterRmm ?? null;
      if (line && r0 !== null) line.catheterRmm = Math.min(r0, MP_PCI_CAUSES.contrastLumenRmm);
      const f0 = p.lab.flushes();
      const undo = (q: PciCausePort) => {
        q.transducer?.setContrast?.(0);
        if (q.transducer?.line && r0 !== null) q.transducer.line.catheterRmm = r0;
      };
      return watchRun("contrast-in-guide", (q) => q.lab.flushes() > f0, undo, ["flush-line"]);
    },
  },
  {
    id: "thrombus-in-guide",
    mechanism: "false-reading",
    label: "Thrombus plugging the guide (a damped, falsely low reading)",
    signature: FALSE_SIG,
    waveform: "damped",
    lastManoeuvre: "a long pause with the guide not flushed",
    treatment: "Aspirate; if nothing comes back, withdraw slightly and aspirate again; never inject or pass a wire through it",
    treatments: [],
    bridge: NO_DRUG("aspirate the guide"),
    lessonId: LESSON,
    source: PCI_SOURCE,
    start(port) {
      const p = asPci(port);
      const tx = p.transducer;
      if (!p.lab || !tx?.setLumenPlug) return null;
      tx.setLumenPlug(true);
      const a0 = p.lab.aspirations();
      return watchRun("thrombus-in-guide", (q) => q.lab.aspirations() - a0 >= MP_PCI_CAUSES.plugAspirations, (q) => q.transducer?.setLumenPlug?.(false));
    },
  },
  {
    id: "bulky-device",
    mechanism: "false-reading",
    label: "A bulky device filling the guide (a damped, falsely low reading)",
    signature: FALSE_SIG,
    waveform: "damped",
    lastManoeuvre: "a large device advanced into the guide",
    treatment: "Recognise the damping from the device; the trace recovers when it is withdrawn; check the cuff",
    treatments: [],
    bridge: NO_DRUG("the device is in the guide"),
    lessonId: LESSON,
    source: PCI_SOURCE,
    start(port) {
      const p = asPci(port);
      const line = p.transducer?.line;
      if (!p.lab?.deviceInGuide() || !line) return null;
      const r0 = line.catheterRmm;
      line.catheterRmm = Math.min(r0, MP_PCI_CAUSES.bulkyLumenRmm);
      return watchRun("bulky-device", (q) => !q.lab.deviceInGuide(), (q) => {
        if (q.transducer?.line) q.transducer.line.catheterRmm = r0;
      });
    },
  },
  {
    id: "cusp-open",
    mechanism: "cardiac",
    label: "A guide holding an aortic cusp open (acute aortic regurgitation)",
    signature: { filling: "high", output: "low", ra: "normal", rate: "fast", cuff: "low" },
    waveform: "wide pulse pressure",
    lastManoeuvre: "an Amplatz or deep-curve EBU pushed in for support",
    treatment: "Pull the guide back and reposition it: if this is the cause, the pressure recovers at once",
    treatments: [],
    bridge: { right: [], acceptable: [], otherwise: "Reposition the guide: a pressor does not close the valve", expected: "No drug: reposition the guide", causeFirst: true },
    lessonId: LESSON,
    source: `${PCI_SOURCE}; the valve row of the hypotension table and tip pci-hypo-amplatz-valve`,
    guides: CUSP_GUIDES,
    start(port) {
      const p = asPci(port);
      if (!p.lab?.guideEngaged() || !p.setAorticRegurgitation) return null;
      // only an Amplatz or a deep-curve EBU holds a cusp open (the lesson's valve row): another guide waits
      if (!guideFits({ guides: CUSP_GUIDES }, p.lab.guideFamily())) return null;
      const d = p.lab.guideDepthMm();
      if (d < MP_PCI_CAUSES.cuspDepthMm) p.lab.seatGuide(MP_PCI_CAUSES.cuspDepthMm - d);
      p.setAorticRegurgitation(MP_PCI_CAUSES.cuspRegurgitation);
      return watchRun("cusp-open", (q) => !q.lab.guideEngaged() || q.lab.guideDepthMm() <= MP_PCI_CAUSES.releasedDepthMm, (q) => q.setAorticRegurgitation?.(null));
    },
  },
];

for (const c of PCI_CAUSES) registerHypotensionCause(c);

/** The PCI cause by id (with its waveform and manoeuvre), or undefined. */
export function pciHypotensionCause(id: string): PciHypotensionCause | undefined {
  return PCI_CAUSES.find((c) => c.id === id);
}

/**
 * The causes a PCI lab case draws from: the lab's own and the shared ones a PCI case meets (tamponade after a
 * wire exit, a vasovagal reaction, a nitrate or verapamil, bleeding). Each is in the shared registry.
 */
export const PCI_CASE_CAUSES: readonly string[] = [...PCI_CAUSES.map((c) => c.id), "tamponade", "vagal", "gtn-pde5", "verapamil", "bleeding"];

/** The launch variant prefix that starts a hidden hypotension cause (lad-focal 'hypotension-<cause>'). */
export const HYPOTENSION_VARIANT_PREFIX = "hypotension-";

/**
 * The cause a launch variant names: 'hypotension-<cause id>', or 'hypotension-unknown' for one drawn from
 * PCI_CASE_CAUSES with `draw` (0..1; the lab passes its seeded generator), never shown on a live screen.
 * With `guideFamily` (the guide in the lab), the draw leaves out a cause that needs another guide (the cusp held
 * open needs an Amplatz or an EBU), so the drawn cause cannot wait for ever. Null for any other variant.
 */
export function causeForVariant(variant: string | null | undefined, draw: () => number = Math.random, guideFamily?: string | null): string | null {
  if (!variant || !variant.startsWith(HYPOTENSION_VARIANT_PREFIX)) return null;
  const id = variant.slice(HYPOTENSION_VARIANT_PREFIX.length);
  if (id === "unknown") {
    const pool = guideFamily === undefined ? PCI_CASE_CAUSES : PCI_CASE_CAUSES.filter((c) => guideFits(pciHypotensionCause(c) ?? {}, guideFamily));
    return pool[Math.min(pool.length - 1, Math.floor(draw() * pool.length))];
  }
  return hypotensionCause(id) ? id : null;
}

/** One hypotension episode of a case: when it began, the learner's first action after it, and when it ended. */
export interface HypotensionEpisode {
  causeId: string;
  /** lab seconds of the onset */
  onsetT: number;
  /** the first operator action after the onset (time to recognition) */
  firstAction: { action: string; t: number } | null;
  /** lab seconds the cause stopped (its treatment or the manoeuvre that ends it), or null */
  resolvedT: number | null;
}

export function newEpisode(causeId: string, t: number): HypotensionEpisode {
  return { causeId, onsetT: t, firstAction: null, resolvedT: null };
}

/** Record an operator action against the episode (only the first after the onset counts). */
export function recordEpisodeAction(ep: HypotensionEpisode, action: string, t: number): HypotensionEpisode {
  if (ep.firstAction || t < ep.onsetT) return ep;
  return { ...ep, firstAction: { action, t } };
}

/** Seconds from the onset to the first action, or null before one. */
export function timeToFirstAction(ep: HypotensionEpisode): number | null {
  return ep.firstAction ? ep.firstAction.t - ep.onsetT : null;
}
