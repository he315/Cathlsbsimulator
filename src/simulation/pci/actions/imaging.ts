// ---------------------------------------------------------------------------
// Imaging: cine injections through the guide (contrast, runs and their
// physical effects) and intravascular imaging on the current anatomy.
//
// pci-intravascular-imaging adds the in-lab acquisition on the one frame
// generator (src/simulation/pci/ivus.ts): an imaging catheter of the catalogue
// (rotational IVUS, phased-array IVUS, OCT) taken onto the wire and advanced
// by hand (it stops at a lesion too tight for it, and kinks if forced), its
// preparation (flush or purge, calibration, 'clear view'), the IVUS motorised
// pullback and the OCT run triggered by a contrast flush whose rate and volume
// are the learner's (the volume goes into the case's contrast), the trainee's
// assessment of each run (their own numbers) and what it calls for, the OCT
// calcium rule answer and the final-result checklist for the attending.
// ivusReport is the truth of a run, for the debrief only; imagingDebrief sets
// the trainee's numbers beside it.
// ---------------------------------------------------------------------------

import type { CoronaryTree } from "../../../render/xray/coronaryTree";
import { pathTo, radiusAtMm } from "../geometry";
import {
  MP_CROSS_CALCIUM_MM,
  MP_CROSS_CLEARANCE_MM,
  MP_CROSS_PREPARED_GIVE_MM,
  MP_FORCE_KINK_PUSHES,
  MP_IMAGING_WIRE_MARGIN_MM,
  MP_JUMP_CLEARANCE_MM,
  MP_JUMP_SAFE_MM_S,
  MP_MIGRATION_MM,
  MP_MIGRATION_RATE_ML_S,
  MP_PULLBACK_MM_S,
  MP_ROOMY_LUMEN_MM,
  MP_TIP_BEYOND_LENS_MM,
  OCT_MIDDLE_MARKER_RULE_MM,
  OCT_MODES,
  IVUS_PULLBACK_SPEEDS,
  acquisitionArtefacts,
  assessedUnderexpanded,
  ivusFrame,
  ivusSummary,
  newAcquisition,
  octFlushOutcome,
  startPullback,
  type ImagingAcq,
  type ImagingRunRecord,
  type ImagingTech,
  type IvusContext,
  type IvusFrame,
  type IvusRun,
  type IvusSummary,
  type OctMode,
  type RunAssessment,
} from "../ivus";
import { DEVICE_BY_ID } from "../equipment";
import { onInjection } from "../../complications/engine";
import { CALCIUM_SCORE_RULE } from "../../bench/measure";
import { MAX_HAND_PRESSURE_PSI, PSI, circuitFor, lumenForFrench, lumenObstruction, pressureForFlow } from "../../injection";
import { lesionShape, log, sampleAtMm, tele, withNotes, type PciGeom, type PciScenario, type PciState } from "../state";
import { requestDevice, setValve } from "./devices";
import { moveWire } from "./wire";
import { stentGeomOf } from "./assessment";

/** A cine injection: contrast, a run, and its physical effects (air, dissection extension, ostial injury). */
export function inject(s: PciScenario, st: PciState): PciState {
  const ml = s.side === "left" ? 8 : 6;
  return { ...st, contrastMl: st.contrastMl + ml, cineRuns: st.cineRuns + 1, lastInjectionT: st.t, injectedSinceDeviceMove: true };
}

/** An injection through the guide with its measured push (from the syringe). */
export function injectPci(s: PciScenario, g: PciGeom, st0: PciState, o: { ml?: number; psi: number; forceful: boolean; puff?: boolean }): PciState {
  let st: PciState = { ...st0, contrastMl: st0.contrastMl + (o.ml ?? 0), cineRuns: st0.cineRuns + (o.puff ? 0 : 1), lastInjectionT: st0.t, injectedSinceDeviceMove: true };
  st = tele(st, "inject", { ml: o.ml ?? 0, psi: o.psi, forceful: o.forceful, diagnostic: true });
  if (!st.guide.engaged) return st;
  const route = st.tipMm > 0 ? st.route : pathTo(g, g.lesion.vessel);
  const r = onInjection(st.cx, st.t, { route, vessel: route[route.length - 1], side: s.side, psi: o.psi, forceful: o.forceful, guideDepthMm: st.guide.depthMm, guideCoaxial: st.guide.coaxial });
  return withNotes({ ...st, cx: r.cx }, r.notes);
}

/** IVUS geometry from the current state (the modality is the imaging catheter's, IVUS by default). */
export function ivusContext(s: PciScenario, g: PciGeom, st: PciState, tree: CoronaryTree): IvusContext {
  const route = st.route.includes(g.lesion.vessel) ? st.route : pathTo(g, g.lesion.vessel);
  const curV = (mm: number) => sampleAtMm(g, route, Math.max(0, mm));
  const lumenR = (mm: number) => {
    const a = curV(mm);
    if (!a) return 1.5;
    const ref = radiusAtMm(g, route, mm, true);
    if (a.v.name === g.lesion.vessel && mm >= g.lesion.startMm && mm <= g.lesion.endMm) {
      const f = lesionShape(g, mm);
      return ref * (1 - (st.severity / 100) * f);
    }
    return ref;
  };
  void tree;
  const dissections = st.cx.list
    .filter((c) => c.kind === "dissection" && c.stage !== "resolved")
    .map((c) => ({ fromMm: c.atMm - c.lengthMm / 2, toMm: c.atMm + c.lengthMm / 2, arcDeg: 60 + 120 * c.severity }));
  const thrombus = st.cx.list.filter((c) => c.kind === "thrombus" && c.stage !== "resolved").map((c) => ({ fromMm: c.atMm - c.lengthMm / 2, toMm: c.atMm + c.lengthMm / 2 }));
  if (s.thrombus && st.severity > 50) thrombus.push({ fromMm: g.lesion.startMm, toMm: g.lesion.endMm });
  const ctx: IvusContext = {
    lumenR,
    refR: (mm) => radiusAtMm(g, route, mm, true),
    lesion: { startMm: g.lesion.startMm, endMm: g.lesion.endMm, calcium: s.calcium, lipid: !!s.lipid || s.thrombus },
    stents: st.stents.filter((p) => p.route.includes(g.lesion.vessel) || p.route.join() === route.join()).map((p) => ({ fromMm: p.fromMm, toMm: p.toMm, geom: stentGeomOf(g, p) })),
    dissections,
    thrombus,
    plaqueAngle: 2.2,
    wireAngle: -0.6,
  };
  const modality = imagingModalityOf(st);
  return modality ? { ...ctx, modality } : ctx;
}

/** The modality of the imaging catheter on the wire, or of the last one used (null: none). */
function imagingModalityOf(st: PciState): "IVUS" | "OCT" | null {
  const dev = st.device;
  if (dev?.kind === "ivus") {
    const m = DEVICE_BY_ID[dev.specId]?.imaging?.modality;
    return m === "oct" ? "OCT" : "IVUS";
  }
  return st.ivus?.acq?.modality ?? null;
}

// ---------------------------------------------------------------------------
// The imaging catheter on the wire
// ---------------------------------------------------------------------------

/** The acquisition record of the imaging catheter on the wire, or null. */
export function acqOf(st: PciState): ImagingAcq | null {
  return st.device?.kind === "ivus" ? st.ivus?.acq ?? null : null;
}

/** The imaging technology of a catalogue spec ('ivus' rotational, 'ivus-phased', 'oct'), or null. */
export function imagingTechOf(specId: string): ImagingTech | null {
  return DEVICE_BY_ID[specId]?.imaging?.tech ?? null;
}

/** A run record carrying the case's assessments and runs forward. */
function idleRun(st: PciState, acq: ImagingAcq, atMm: number): IvusRun {
  return { active: false, mm: atMm, startMm: atMm, speed: acq.speedMmS, t: 0, recorded: [], acq, assessments: st.ivus?.assessments ?? [], runs: st.ivus?.runs ?? [] };
}

function withAcq(st: PciState, f: (a: ImagingAcq) => ImagingAcq): PciState {
  const run = st.ivus;
  if (!run?.acq) return st;
  return { ...st, ivus: { ...run, acq: f(run.acq) } };
}

/**
 * Take an imaging catheter of the catalogue onto the wire (specId 'ivus', 'ivus-phased' or 'oct'). With
 * `assisted` the team has prepared it (flushed or purged, calibrated), as the earlier lab's IVUS button did.
 * The catheter waits at the guide tip; the hands advance it.
 */
export function loadImaging(st: PciState, specId: string, o: { assisted?: boolean } = {}): PciState {
  const spec = DEVICE_BY_ID[specId];
  const tech = imagingTechOf(specId);
  if (!spec || !tech) return log(st, "warn", "That is not an imaging catheter.");
  if (st.device) return log(st, "warn", "Remove the current device first.");
  if (st.tipMm < 30) return log(st, "warn", "Take the wire well into the distal vessel before loading the imaging catheter.");
  let n = requestDevice(st, specId, 0, 6);
  if (!n.device) return n;
  n = { ...n, device: { ...n.device, kind: "ivus", labelChecked: true, prepared: true, stage: "in-guide", centreMm: -5, assisted: !!o.assisted } };
  if (!n.valveOpen) n = setValve(n, true);
  let acq = newAcquisition(specId, tech, spec.profileMm(0));
  if (o.assisted) acq = { ...acq, purged: true, calibrated: true };
  n = { ...n, ivus: idleRun(n, acq, -5) };
  return tele(n, "imaging-load", { specId, tech, assisted: !!o.assisted });
}

/** The engine's rotational IVUS catheter, prepared by the team (the earlier lab's path). */
export function loadIvus(st: PciState): PciState {
  // the earlier lab's pullback ran at MP_PULLBACK_MM_S (0.5 mm/s, one of the rotational catheter's speeds)
  const n = loadImaging(st, "ivus", { assisted: true });
  return n.device && n.device !== st.device ? withAcq(n, (a) => ({ ...a, speedMmS: MP_PULLBACK_MM_S })) : n;
}

/** Flush (rotational IVUS) or purge with undiluted contrast (OCT): `phase` 'start' begins it, 'end' completes it. */
export function purgeImaging(st: PciState, phase: "start" | "end" = "end"): PciState {
  const acq = acqOf(st);
  if (!acq) return st;
  if (acq.tech === "phased-array") return log(st, "info", "A phased-array catheter needs no flush.");
  if (phase === "start") return tele(withAcq(st, (a) => ({ ...a, purging: true })), "imaging-purge", { phase });
  const what = acq.tech === "oct" ? "Purged with undiluted contrast" : "Flushed";
  return log(tele(withAcq(st, (a) => ({ ...a, purging: false, purged: true })), "imaging-purge", { phase }), "info", `${what}: no blood or air left in the catheter.`);
}

/**
 * Calibrate (OCT). Calibrating while purging is the module's error: the automated measurements are then wrong
 * until the catheter is calibrated again once the purge has stopped, which clears it (the error stays in the
 * log's imaging-calibrate telemetry).
 */
export function calibrateImaging(st: PciState): PciState {
  const acq = acqOf(st);
  if (!acq) return st;
  const during = acq.purging;
  const n = withAcq(st, (a) => ({ ...a, calibrated: !during, calibratedWhilePurging: during }));
  return tele(n, "imaging-calibrate", { whilePurging: during });
}

/** The lumen diameter (mm) at a route position, and whether it is within the target lesion. */
function lumenAt(s: PciScenario, g: PciGeom, st: PciState, mm: number): { d: number; inLesion: boolean } {
  const ctx = ivusContext(s, g, st, g.tree);
  const route = st.route.includes(g.lesion.vessel) ? st.route : pathTo(g, g.lesion.vessel);
  const a = sampleAtMm(g, route, Math.max(0, mm));
  const inLesion = !!a && a.v.name === g.lesion.vessel && mm >= g.lesion.startMm && mm <= g.lesion.endMm;
  // a stent props the lumen open to its ring
  let r = ctx.lumenR(mm);
  for (const p of ctx.stents) if (mm >= p.fromMm && mm <= p.toMm) r = Math.max(r, Math.min(...p.geom.rings.map((x) => x.d)) / 2);
  return { d: 2 * r, inLesion };
}

/**
 * Phased-array: press 'clear view'. It works with the catheter still at the root (in the guide) or in a
 * roomy segment outside the lesion (MP_ROOMY_LUMEN_MM); pressed in the lesion or a narrow segment it does not.
 */
export function clearViewImaging(s: PciScenario, g: PciGeom, st: PciState): PciState {
  const acq = acqOf(st);
  const dev = st.device;
  if (!acq || !dev) return st;
  if (acq.tech !== "phased-array") return log(st, "info", "Clear view is a phased-array console step.");
  const at = lumenAt(s, g, st, dev.centreMm);
  const ok = dev.centreMm <= 0 || (!at.inLesion && at.d >= MP_ROOMY_LUMEN_MM);
  const n = withAcq(st, (a) => (ok ? { ...a, clearView: true } : { ...a, clearViewFailed: a.clearViewFailed + 1 }));
  return tele(n, "imaging-clear-view", { atMm: dev.centreMm, ok });
}

/** OCT mode, IVUS pullback speed. */
export function setImagingSettings(st: PciState, o: { octMode?: OctMode; speedMmS?: number }): PciState {
  const acq = acqOf(st);
  if (!acq) return st;
  return withAcq(st, (a) => ({
    ...a,
    octMode: o.octMode ?? a.octMode,
    speedMmS: o.speedMmS !== undefined && a.tech !== "oct" && IVUS_PULLBACK_SPEEDS[a.tech].includes(o.speedMmS) ? o.speedMmS : a.speedMmS,
  }));
}

/** The left hand holds (or lets go of) the imaging catheter and the wire together. */
export function holdImaging(st: PciState, on: boolean): PciState {
  return withAcq(st, (a) => ({ ...a, held: on }));
}

/** Intracoronary nitrate before imaging (the lab reports the drug; pm-imaging-ivus). */
export function recordImagingNitrate(st: PciState): PciState {
  if (!st.ivus?.acq) return tele(st, "imaging-nitrate", {});
  return tele(withAcq(st, (a) => ({ ...a, nitrate: true })), "imaging-nitrate", {});
}

/**
 * Advance (+) or withdraw (−) the imaging catheter by hand along the wire (mm of its lens). It stops where
 * the lumen is narrower than its profile plus a clearance (more in heavy calcium); pushing against the stop
 * MP_FORCE_KINK_PUSHES times kinks it. It cannot pass the wire tip.
 */
export function advanceImaging(s: PciScenario, g: PciGeom, st: PciState, mm: number): PciState {
  const dev = st.device;
  const acq = acqOf(st);
  if (!dev || !acq || st.ivus?.active) return st;
  if (acq.kinked && mm > 0) return log(st, "warn", "The imaging catheter is kinked and will not advance; take it out.");
  const tipOff = acq.tech === "phased-array" ? MP_TIP_BEYOND_LENS_MM["phased-array"] : 0;
  if (mm <= 0) {
    const centre = Math.max(-40, dev.centreMm + mm);
    return withAcq({ ...st, device: { ...dev, centreMm: centre } }, (a) => ({ ...a, stoppedAtMm: null, forcedPushes: 0 }));
  }
  const limit = st.tipMm - MP_IMAGING_WIRE_MARGIN_MM - tipOff;
  const prepared = lesionPrepared(s, st);
  // an untreated lesion needs the profile plus a clearance (more in heavy calcium); a prepared one gives way
  const need = acq.profileMm + MP_CROSS_CLEARANCE_MM + (s.calcium >= 2 ? MP_CROSS_CALCIUM_MM : 0);
  const needPrepared = acq.profileMm - MP_CROSS_PREPARED_GIVE_MM;
  const target = Math.min(limit, dev.centreMm + mm);
  let pos = dev.centreMm;
  let stopped: number | null = null;
  for (let x = dev.centreMm; x <= target + 1e-9; x = Math.min(target, x + 0.25)) {
    const tip = x + tipOff;
    const at = tip > 0 ? lumenAt(s, g, st, tip) : null;
    if (at && at.d < (prepared && at.inLesion ? needPrepared : need)) {
      stopped = tip;
      break;
    }
    pos = x;
    if (x >= target) break;
  }
  if (stopped === null) {
    const n = withAcq({ ...st, device: { ...dev, centreMm: pos } }, (a) => ({ ...a, stoppedAtMm: null, forcedPushes: 0 }));
    return pos >= limit - 1e-6 && dev.centreMm + mm > limit ? log(n, "info", "The imaging catheter is as far as the wire allows.") : n;
  }
  // stopped by the lesion: a push against the stop counts toward kinking
  const pushes = acq.stoppedAtMm !== null && Math.abs(acq.stoppedAtMm - stopped) < 0.6 && pos - dev.centreMm < 0.05 ? acq.forcedPushes + 1 : 0;
  const kinked = pushes >= MP_FORCE_KINK_PUSHES;
  let n = withAcq({ ...st, device: { ...dev, centreMm: pos } }, (a) => ({ ...a, stoppedAtMm: stopped, forcedPushes: pushes, kinked: a.kinked || kinked }));
  n = tele(n, kinked ? "imaging-kink" : "imaging-stall", { atMm: stopped, pushes });
  if (kinked) return log(n, "danger", "The imaging catheter buckled at the lesion: it has kinked and no longer images.");
  return pushes === 0 ? log(n, "warn", "The imaging catheter will not advance any further.") : n;
}

/**
 * The target lesion has been prepared: a balloon or stent was inflated in it, or its stenosis is less than at
 * the start (any device that modified it). The calcium surcharge to crossing then no longer applies.
 */
export function lesionPrepared(s: PciScenario, st: PciState): boolean {
  if (st.severity < s.target.severity - 0.5) return true;
  return st.log.some((r) => (r.kind === "inflate" || r.kind === "deploy") && (r.data as { inLesion?: unknown } | undefined)?.inLesion === true);
}

/** The catheter's lens has passed the target lesion's distal end (the run can cover it). */
export function imagingBeyondLesion(g: PciGeom, st: PciState): boolean {
  return !!st.device && st.device.kind === "ivus" && st.route.includes(g.lesion.vessel) && st.device.centreMm > g.lesion.endMm;
}

/** A run record for the case's history. */
function runRecord(g: PciGeom, st: PciState, acq: ImagingAcq, fromMm: number, toMm: number, motorised: boolean, contrastMl: number): ImagingRunRecord {
  const run = st.ivus!;
  const probe: IvusRun = { ...run, acq, startMm: fromMm };
  const mid = (fromMm + toMm) / 2;
  const a = acquisitionArtefacts(probe, mid);
  const endA = acquisitionArtefacts(probe, toMm);
  return {
    t: st.t,
    tech: acq.tech,
    modality: acq.modality,
    fromMm,
    toMm,
    stents: st.stents.length,
    artefacts: { blood: a.blood || endA.blood, ringDown: a.ringDown, air: a.air, jumps: acq.jumps.length, noImage: a.noImage },
    nitrate: acq.nitrate,
    motorised,
    contrastMl,
    beyondLesion: imagingBeyondLesion(g, st),
    // what the 57 mm marker rule is for (tip pci-img-oct-marker): the lesion falls inside the run
    markerOk: acq.tech === "oct" ? fromMm > g.lesion.endMm && toMm < g.lesion.startMm : null,
    // the scale the measuring tools use (ImagingConsole): calibrated after the purge or not
    miscalibrated: acq.tech === "oct" ? !acq.calibrated : null,
  };
}

/**
 * Start the IVUS motorised pullback from where the lens is (at the speed set). A phased-array pullback
 * faster than MP_JUMP_SAFE_MM_S jumps across tight segments and stent struts on the way back.
 */
export function startImagingRun(s: PciScenario, g: PciGeom, st: PciState, o: { nitrate?: boolean } = {}): PciState {
  const dev = st.device;
  const acq0 = acqOf(st);
  if (!dev || !acq0) return log(st, "warn", "Load an imaging catheter first.");
  if (acq0.tech === "oct") return log(st, "warn", "An OCT run starts with the flush: enable it, then inject.");
  if (acq0.kinked) return log(st, "warn", "The kinked catheter gives no image; take it out.");
  if (dev.centreMm < 10) return log(st, "warn", "Advance the imaging catheter beyond the lesion first.");
  const acq = { ...acq0, nitrate: acq0.nitrate || !!o.nitrate, jumps: [] as { fromMm: number; toMm: number }[], sheathTipMm: dev.centreMm + MP_TIP_BEYOND_LENS_MM[acq0.tech] };
  if (acq.tech === "phased-array" && acq.speedMmS > MP_JUMP_SAFE_MM_S + 1e-9) {
    let from: number | null = null;
    for (let x = dev.centreMm; x >= 0; x -= 0.5) {
      const l = lumenAt(s, g, st, x);
      const strut = st.stents.some((p) => x >= p.fromMm - 0.5 && x <= p.toMm + 0.5 && (Math.abs(x - p.fromMm) < 0.6 || Math.abs(x - p.toMm) < 0.6));
      const tight = l.d < acq.profileMm + MP_JUMP_CLEARANCE_MM || strut;
      if (tight && from === null) from = x;
      if (!tight && from !== null) {
        acq.jumps.push({ fromMm: x, toMm: from });
        from = null;
      }
    }
    if (from !== null) acq.jumps.push({ fromMm: 0, toMm: from });
  }
  const base = startPullback(dev.centreMm, acq.speedMmS);
  const run: IvusRun = { ...base, acq, assessments: st.ivus?.assessments ?? [], runs: st.ivus?.runs ?? [] };
  let n: PciState = { ...st, ivus: run };
  n = { ...n, ivus: { ...run, runs: [...(run.runs ?? []), runRecord(g, n, acq, dev.centreMm, 0, true, 0)] } };
  n = tele(n, "ivus-pullback", { fromMm: dev.centreMm, tech: acq.tech, speed: acq.speedMmS, nitrate: acq.nitrate, clearView: acq.clearView, jumps: acq.jumps.length });
  return log(n, "info", "Motorised IVUS pullback started.");
}

/** The earlier lab's IVUS pullback (the rotational catheter, at the default speed). */
export function startIvus(st: PciState): PciState {
  if (st.device?.kind !== "ivus" || st.device.centreMm < 10) return log(st, "warn", "Advance the imaging catheter beyond the lesion first.");
  if (st.ivus?.acq && st.ivus.acq.tech !== "oct") {
    const acq = { ...st.ivus.acq, sheathTipMm: st.device.centreMm + MP_TIP_BEYOND_LENS_MM[st.ivus.acq.tech] };
    const run: IvusRun = { ...startPullback(st.device.centreMm, acq.speedMmS), acq, assessments: st.ivus.assessments ?? [], runs: st.ivus.runs ?? [] };
    return log(tele({ ...st, ivus: run }, "ivus-pullback", { fromMm: st.device.centreMm }), "info", "Motorised IVUS pullback started.");
  }
  return log(tele({ ...st, ivus: startPullback(st.device.centreMm) }, "ivus-pullback", { fromMm: st.device.centreMm }), "info", "Motorised IVUS pullback started.");
}

/** OCT: enable the console (the run starts when the flush clears the lumen). */
export function armOct(st: PciState): PciState {
  const acq = acqOf(st);
  if (!acq || acq.tech !== "oct") return st;
  return tele(withAcq(st, (a) => ({ ...a, armed: true })), "imaging-arm", {});
}

export interface OctFlushRequest {
  /** the rate pushed, mL/s (by hand it is limited by the guide) */
  rateMlS: number;
  durationS: number;
  injector: boolean;
  /** trigger the pullback by hand even if the lumen does not clear */
  manualTrigger?: boolean;
  /** add the volume to the state's contrast (default true; the PCI session books it through its syringe instead) */
  chargeContrast?: boolean;
  nitrate?: boolean;
}

/**
 * An OCT flush through the guide: its volume goes into the contrast total; it triggers the run when it
 * clears the lumen (or by hand); the part of the run the flush lasts is clear, the rest blood-filled. A
 * forceful flush drives an unheld catheter and wire distally.
 */
export function octFlush(s: PciScenario, g: PciGeom, st0: PciState, f: OctFlushRequest): PciState {
  const dev = st0.device;
  const acq0 = acqOf(st0);
  if (!dev || !acq0 || acq0.tech !== "oct") return log(st0, "warn", "No OCT catheter on the wire.");
  if (acq0.kinked) return log(st0, "warn", "The kinked catheter gives no image; take it out.");
  const out = octFlushOutcome({ rateMlS: f.rateMlS, durationS: f.durationS, injector: f.injector, french: st0.guide.french, side: s.side }, acq0.octMode);
  let st: PciState = f.chargeContrast === false ? st0 : { ...st0, contrastMl: st0.contrastMl + out.volumeMl };
  st = { ...st, lastInjectionT: st.t, injectedSinceDeviceMove: true };
  st = tele(st, "imaging-flush", { rateMlS: out.rateMlS, durationS: out.durationS, volumeMl: out.volumeMl, injector: out.injector, triggered: out.triggered, armed: acq0.armed, reason: out.reason });
  // the flush is a contrast injection through the guide: the complications engine's injection hook (air,
  // extension of a dissection, ostial injury), as injectPci, at the pressure the injection physics gives
  if (st.guide.engaged && out.volumeMl > 0) {
    const route = st.tipMm > 0 ? st.route : pathTo(g, g.lesion.vessel);
    const r = onInjection(st.cx, st.t, { route, vessel: route[route.length - 1], side: s.side, psi: flushPsi(st.guide.french, out.rateMlS, out.injector), forceful: out.rateMlS >= MP_MIGRATION_RATE_ML_S, guideDepthMm: st.guide.depthMm, guideCoaxial: st.guide.coaxial });
    st = withNotes({ ...st, cx: r.cx }, r.notes);
  }
  // a forceful flush with the catheter and wire not held drives them distally
  if (out.rateMlS >= MP_MIGRATION_RATE_ML_S && !acq0.held && dev.centreMm > 0) {
    const tip0 = st.tipMm;
    st = moveWire(s, g, st, MP_MIGRATION_MM);
    const d = st.tipMm - tip0;
    if (d > 0.1) {
      st = { ...st, device: { ...dev, centreMm: dev.centreMm + d } };
      st = log(tele(st, "imaging-migration", { mm: d }), "warn", "The catheter and wire jumped forward during the injection.");
    }
  }
  const run0 = st.ivus!;
  const acq: ImagingAcq = { ...acq0, nitrate: acq0.nitrate || !!f.nitrate, flush: { ...out, t: st.t, manual: !!f.manualTrigger }, contrastMl: acq0.contrastMl + out.volumeMl, armed: false };
  const start = st.device!.centreMm;
  if (!acq0.armed) return log({ ...st, ivus: { ...run0, acq } }, "warn", "The console was not enabled: no run was recorded.");
  if (!out.triggered && !f.manualTrigger) {
    st = { ...st, ivus: { ...run0, acq } };
    return log(st, "warn", "The lumen did not clear: the pullback did not start.");
  }
  const mode = OCT_MODES[acq.octMode];
  const endMm = Math.max(0, start - mode.lengthMm);
  const run: IvusRun = { ...startPullback(start, mode.speedMmS), endMm, acq: { ...acq, sheathTipMm: start + MP_TIP_BEYOND_LENS_MM.oct }, assessments: run0.assessments ?? [], runs: run0.runs ?? [] };
  st = { ...st, ivus: run };
  st = { ...st, ivus: { ...run, runs: [...(run.runs ?? []), runRecord(g, st, run.acq!, start, endMm, true, out.volumeMl)] } };
  st = tele(st, "ivus-pullback", { fromMm: start, tech: "oct", mode: acq.octMode, triggered: out.triggered });
  return log(st, "info", out.triggered ? `OCT pullback triggered (${acq.octMode === "survey" ? "survey" : "high-resolution"} mode).` : "OCT pullback started by hand.");
}

/**
 * The syringe or injector pressure (psi) that drives an OCT flush of `rateMlS` through the guide with the wire
 * and the imaging catheter in it (src/simulation/injection.ts's circuit); a hand push is capped at the hand's
 * maximum (MAX_HAND_PRESSURE_PSI).
 */
export function flushPsi(french: number, rateMlS: number, injector: boolean): number {
  const lumen = { ...lumenForFrench(french, true), obstructionMm: lumenObstruction(true, true) };
  const psi = pressureForFlow(circuitFor(lumen), Math.max(0, rateMlS)) / PSI;
  return injector ? psi : Math.min(psi, MAX_HAND_PRESSURE_PSI);
}

/** Record the trainee's assessment of the last run (their own measurements and findings). */
export function recordAssessment(st: PciState, a: Omit<RunAssessment, "t">): PciState {
  const run = st.ivus;
  if (!run) return st;
  const rec: RunAssessment = { ...a, t: st.t };
  return tele({ ...st, ivus: { ...run, assessments: [...(run.assessments ?? []), rec] } }, "imaging-assessment", { ...rec, edgeDissection: rec.edgeDissection ?? null });
}

/** The trainee's latest assessment, or null. */
export function lastAssessment(st: PciState): RunAssessment | null {
  const list = st.ivus?.assessments ?? [];
  return list.length ? list[list.length - 1] : null;
}

/** The OCT calcium rule answer, before preparation in a calcified case (the trainee's points and their plan). */
export function recordCalciumRule(st: PciState, a: { arcOver180: boolean; thicknessOver05: boolean; lengthOver5: boolean; modify: boolean }): PciState {
  const score = (a.arcOver180 ? 2 : 0) + (a.thicknessOver05 ? 1 : 0) + (a.lengthOver5 ? 1 : 0);
  return tele(st, "imaging-calcium-rule", { ...a, score });
}

/** The final-result checklist, recorded for the attending (each item: the trainee says it was checked and met). */
export function recordFinalChecklist(st: PciState, items: Record<"expansion" | "apposition" | "edges" | "coverage" | "flow", boolean>): PciState {
  return tele(st, "imaging-final-checklist", items);
}

// ---------------------------------------------------------------------------
// Frames and the truth of a run
// ---------------------------------------------------------------------------

export function ivusAt(s: PciScenario, g: PciGeom, st: PciState, tree: CoronaryTree, mm: number): IvusFrame {
  return ivusFrame(ivusContext(s, g, st, tree), mm);
}

/** A target that lies at the origin of the RCA or the left main (an aorto-ostial segment). */
export function aortoOstial(s: PciScenario & { events?: readonly string[] }, g: PciGeom): boolean {
  if (s.events?.includes("aorto-ostial-lesion")) return true;
  return (g.lesion.vessel === "RCA" || g.lesion.vessel === "LM") && g.lesion.startMm <= 5;
}

/** The frame at `mm` as the imaging console shows it: the geometry with the acquisition's artefacts. */
export function imagingFrameAt(s: PciScenario, g: PciGeom, st: PciState, tree: CoronaryTree, mm: number): IvusFrame {
  const f = ivusAt(s, g, st, tree, mm);
  const run = st.ivus;
  if (!run?.acq) return f;
  return { ...f, artefacts: acquisitionArtefacts(run, mm, { ostial: aortoOstial(s, g) }) };
}

/** The truth of the last run, for the debrief only (no live screen shows it). */
export function ivusReport(s: PciScenario, g: PciGeom, st: PciState, tree: CoronaryTree): IvusSummary | null {
  if (!st.ivus || !st.ivus.recorded.length) return null;
  const lo = Math.min(...st.ivus.recorded.map((r) => r.mm));
  const hi = Math.max(...st.ivus.recorded.map((r) => r.mm));
  if (!(hi > lo + 2)) return null;
  return ivusSummary(ivusContext(s, g, st, tree), lo, hi, { leftMain: leftMainTarget(s, g) });
}

/** The left main thresholds apply: the target is in the left main, or the case names a left main lesion. */
export function leftMainTarget(s: PciScenario & { events?: readonly string[] }, g: PciGeom): boolean {
  return g.lesion.vessel === "LM" || !!s.events?.includes("left-main-lesion");
}

/** The calcium of the target lesion as OCT frames show it (debrief truth for the calcium rule): largest arc and thickness, and its length. */
function calciumTruth(s: PciScenario, g: PciGeom, st: PciState, tree: CoronaryTree): { arcDeg: number; thicknessMm: number; lengthMm: number } {
  const ctx: IvusContext = { ...ivusContext(s, g, st, tree), modality: "OCT" };
  const STEP = 0.25;
  let arcDeg = 0,
    thicknessMm = 0,
    n = 0;
  for (let x = g.lesion.startMm - 3; x <= g.lesion.endMm + 3 + 1e-9; x += STEP) {
    const c = ivusFrame(ctx, x, 36).calcium;
    if (!c) continue;
    n++;
    arcDeg = Math.max(arcDeg, c.arcDeg);
    thicknessMm = Math.max(thicknessMm, c.thicknessMm ?? 0);
  }
  return { arcDeg, thicknessMm, lengthMm: n * STEP };
}

/** One line of the imaging debrief: what the trainee did or said, and what was true. */
export interface ImagingDebriefItem {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
}

/** Tolerances for the trainee's measurements against the truth — MODEL PARAMETERS (as the bench's MEASURE_TOLERANCE). */
export const MP_DEBRIEF_TOLERANCE = { msaMm2: 0.5, refFraction: 0.15 } as const;

/**
 * The debrief of the imaging in the case: nitrate before the run, the catheter's preparation (flush or purge,
 * OCT calibration), clear view (phased-array), the OCT marker rule, clean OCT runs, pullback jumps, a kinked
 * catheter, the OCT calcium rule answer against the lesion's calcium, the trainee's last post-stent assessment
 * beside ivusReport's truth (MSA, expansion verdict) and the final-result checklist against the same run.
 * Debrief only.
 */
export function imagingDebrief(s: PciScenario, g: PciGeom, st: PciState, tree: CoronaryTree): ImagingDebriefItem[] {
  const run = st.ivus;
  if (!run) return [];
  const out: ImagingDebriefItem[] = [];
  const runs = run.runs ?? [];
  if (runs.length) {
    out.push({ id: "nitrate", label: "Intracoronary nitrate before imaging", ok: runs.every((r) => r.nitrate), detail: runs.every((r) => r.nitrate) ? "Given before every run." : "At least one run without nitrate: spasm can make the vessel look smaller." });
    const flushed = runs.filter((r) => r.tech !== "phased-array");
    if (flushed.length)
      out.push({ id: "prepared", label: "Catheter flushed or purged before use", ok: flushed.every((r) => !r.artefacts.air), detail: flushed.some((r) => r.artefacts.air) ? "Air left in the catheter shadowed an arc of every frame: flush it (OCT: purge with undiluted contrast) before it goes in." : "Flushed or purged before every run." });
    const phased = runs.filter((r) => r.tech === "phased-array");
    if (phased.length) out.push({ id: "clear-view", label: "Clear view before crossing (phased-array)", ok: phased.every((r) => !r.artefacts.ringDown), detail: phased.some((r) => r.artefacts.ringDown) ? "Ring-down hid the near field: clear view was not pressed in a roomy segment." : "Pressed in time." });
    const oct = runs.filter((r) => r.modality === "OCT");
    if (oct.length) {
      const badCal = oct.filter((r) => r.miscalibrated);
      out.push({ id: "calibration", label: "OCT calibrated after the purge", ok: !badCal.length, detail: badCal.length ? `${badCal.length} of ${oct.length} runs not calibrated, or calibrated while purging: the automated measurements were wrong.` : "Calibrated after the purge." });
      const badMarker = oct.filter((r) => r.markerOk === false);
      out.push({
        id: "oct-marker",
        label: `Catheter parked so the run covers the lesion (middle marker at least ${OCT_MIDDLE_MARKER_RULE_MM} mm beyond the target)`,
        ok: !badMarker.length,
        detail: badMarker.length ? `${badMarker.length} of ${oct.length} runs did not cover the whole lesion: the catheter was not far enough beyond it, or the mode was too short.` : "Every OCT run covered the lesion.",
      });
      out.push({ id: "oct-clear", label: "OCT runs cleared of blood", ok: oct.some((r) => !r.artefacts.blood), detail: `${oct.filter((r) => !r.artefacts.blood).length} of ${oct.length} runs clear; ${oct.reduce((p, r) => p + r.contrastMl, 0).toFixed(0)} mL of contrast in OCT flushes.` });
    }
    const jumps = runs.reduce((p, r) => p + r.artefacts.jumps, 0);
    if (jumps) out.push({ id: "jumps", label: "Pullback without jumps", ok: false, detail: `${jumps} jump(s): pull back slowly across tight segments and struts, or use a rotational catheter.` });
  }
  if (run.acq?.kinked) out.push({ id: "kink", label: "Imaging catheter not forced", ok: false, detail: "It was pushed against the lesion until it kinked: predilate instead." });
  // the OCT calcium rule answer against the lesion's calcium on OCT frames
  const rule = [...st.log].reverse().find((r) => r.kind === "imaging-calcium-rule");
  if (rule) {
    const said = rule.data as { arcOver180?: boolean; thicknessOver05?: boolean; lengthOver5?: boolean; modify?: boolean };
    const c = calciumTruth(s, g, st, tree);
    const truth = { arcOver180: c.arcDeg > CALCIUM_SCORE_RULE.arcDeg, thicknessOver05: c.thicknessMm > CALCIUM_SCORE_RULE.thicknessMm, lengthOver5: c.lengthMm > CALCIUM_SCORE_RULE.lengthMm };
    const score = (truth.arcOver180 ? 2 : 0) + (truth.thicknessOver05 ? 1 : 0) + (truth.lengthOver5 ? 1 : 0);
    const modify = score >= CALCIUM_SCORE_RULE.modifyAt;
    const ok = !!said.arcOver180 === truth.arcOver180 && !!said.thicknessOver05 === truth.thicknessOver05 && !!said.lengthOver5 === truth.lengthOver5 && !!said.modify === modify;
    out.push({
      id: "calcium-rule",
      label: "OCT calcium rule",
      ok,
      detail: `The calcium was ${c.arcDeg.toFixed(0)}° of arc, ${c.thicknessMm.toFixed(2)} mm thick and ${c.lengthMm.toFixed(1)} mm long: a score of ${score} of 4${modify ? ", so modify it before stenting" : ", so a balloon can prepare it"}.`,
    });
  }
  const truth = ivusReport(s, g, st, tree);
  const a = [...(run.assessments ?? [])].reverse().find((x) => x.postStent);
  if (truth && truth.msa !== null && a) {
    const msaOk = a.msaMm2 != null && Math.abs(a.msaMm2 - truth.msa) <= MP_DEBRIEF_TOLERANCE.msaMm2;
    out.push({ id: "msa", label: "Minimal stent area measured", ok: msaOk, detail: `You measured ${a.msaMm2 != null ? `${a.msaMm2.toFixed(2)} mm²` : "nothing"}; the run's MSA was ${truth.msa.toFixed(2)} mm².` });
    const trueUnder = truth.criteria?.some((c) => (c.id === "expansion" || c.id === "msa") && !c.ok) === true;
    // the trainee's verdict by the same rule the console and the event source use (relative and absolute)
    const saidUnder = a.msaMm2 != null ? assessedUnderexpanded({ ...a, leftMain: a.leftMain ?? leftMainTarget(s, g) }) : null;
    out.push({ id: "expansion", label: "Expansion verdict", ok: saidUnder === trueUnder, detail: `Expansion was ${(truth.expansionPct ?? 0).toFixed(0)}% of the mean reference${trueUnder ? " (underexpanded)" : ""}.` });
  }
  // the final-result checklist against the same run: items said to be met that the run fails
  const check = [...st.log].reverse().find((r) => r.kind === "imaging-final-checklist");
  if (check && truth && truth.criteria) {
    const said = check.data as Partial<Record<"expansion" | "apposition", boolean>>;
    const fail = (id: string) => truth.criteria!.some((c) => c.id === id && !c.ok);
    const wrong: string[] = [];
    if (said.expansion && (fail("expansion") || fail("msa"))) wrong.push("expansion");
    if (said.apposition && fail("malapposition")) wrong.push("apposition");
    out.push({ id: "final-checklist", label: "Final-result checklist", ok: !wrong.length, detail: wrong.length ? `Marked as met but not met on the last run: ${wrong.join(", ")}.` : "What was marked as met agrees with the last run." });
  }
  return out;
}
