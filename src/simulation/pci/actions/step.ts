// ---------------------------------------------------------------------------
// Procedure time: the indeflator over time (fill, melon-seeding, burst),
// the IVUS pullback, pressure-sensor drift and the complication engine's
// progression, with the context the complication engine reads. The engine's
// notes reach the live log through its recognition gate: a complication the
// learner has not assessed is shown only by its cues (pci-cx-recognition),
// and a cue about the image only once a contrast run has shown the change:
// the guide injection releases what was held (onInjection), and each step
// releases the held cues of changes made within MP_RUN_WINDOW_S after the last
// guide run, while its contrast is still in the vessel. recognisePci records
// the learner's assessment.
// ---------------------------------------------------------------------------

import { chartDiameter } from "../equipment";
import { occluding, stepIndeflator } from "../indeflator";
import { paramAtMm } from "../geometry";
import { rnd } from "../rng";
import { stepPressureWire } from "../pressureWire";
import { stepPullback } from "../ivus";
import { MP_RUN_WINDOW_S, assessmentText, recogniseCx, releaseHeldCues, stepCx, type CxContext, type Recognition, type RecognitionAnswer } from "../../complications/engine";
import { lesionCover, log, refDAt, specOf, tele, withNotes, type PciGeom, type PciScenario, type PciState } from "../state";
import inflationInternal, { MP_MELON_GRIP_ATM, MP_MELON_RISE_ATM_S } from "./inflation";

export interface StepOptions {
  fluoro?: boolean;
  /** hyperaemia now (0..1), from the patient engine */
  hyperaemia?: number;
  /** true ACT from the patient engine (s) */
  actTrue?: number;
}

/** Advance procedure time by dt (s): indeflator, imaging pullback, sensor drift and the complication engine. */
export function stepPci(s: PciScenario, g: PciGeom, st0: PciState, dt: number, o: StepOptions = {}): PciState {
  let st: PciState = { ...st0, t: st0.t + dt, fluoroS: st0.fluoroS + (o.fluoro ? dt : 0), wireTime: st0.wireTime + (st0.tipMm > 0 ? dt : 0) };
  if (o.hyperaemia !== undefined) st = { ...st, hyperaemia: o.hyperaemia };
  if (o.actTrue !== undefined) st = { ...st, actTrue: o.actTrue };
  const dev = st.device;
  // ---- indeflator ----
  if (dev && (dev.kind === "balloon" || dev.kind === "stent" || dev.kind === "covered-stent")) {
    const spec = specOf(dev);
    const p0 = st.ind.atm;
    const r = stepIndeflator(st.ind, dt, spec.rbpAtm(dev.diameter), spec.deflateSpecS?.(dev.diameter, dev.lengthMm) ?? 15);
    st = { ...st, ind: r.s, device: { ...dev, atm: Math.max(0, r.s.atm), inflated: r.s.fill > 0.05 } };
    // melon-seeding as the balloon grips a rubbery lesion
    if (!dev.deployed && dev.balloon !== "scoring" && p0 < MP_MELON_GRIP_ATM && r.s.atm >= MP_MELON_GRIP_ATM && r.rise > MP_MELON_RISE_ATM_S) {
      const from = dev.centreMm - dev.lengthMm / 2,
        to = dev.centreMm + dev.lengthMm / 2;
      const cover = lesionCover(g, st.route, from, to);
      const rubbery = st.resistance > 0.05 && st.resistance < 0.5;
      if (cover > 0.2 && rubbery) {
        const rng = { ...st.rng };
        const p = Math.min(0.85, 0.3 * (r.rise - MP_MELON_RISE_ATM_S + 1));
        if (rnd(rng) < p) {
          const dir = dev.centreMm >= g.lesion.centreMm ? 1 : -1;
          const slip = dir * dev.lengthMm * (0.3 + 0.3 * rnd(rng));
          const newCentre = Math.min(st.tipMm - dev.lengthMm / 2 - 3, dev.centreMm + slip);
          st = { ...st, rng, device: { ...st.device!, centreMm: newCentre }, counters: { ...st.counters, melonSeeds: st.counters.melonSeeds + 1 } };
          st = log(st, "warn", `The balloon squeezes ${slip > 0 ? "forward" : "back"} out of the lesion as the pressure rises (melon-seeding). Inflate more slowly or use a scoring balloon.`);
        } else st = { ...st, rng };
      }
    }
    // burst
    if (st.ind.atm > dev.burstAtm && !dev.ruptured) st = inflationInternal.rupture(s, g, st, st.ind.atm);
    // once fully empty after pulling negative, the device is free again
    if (st.ind.negative && st.ind.fill === 0 && st.device?.inflated === false && (st.device.kind === "stent" || st.device.kind === "covered-stent") && st.device.appliedAtm > 0)
      st = { ...st, device: { ...st.device, kind: "balloon", balloon: "semi-compliant", deployed: true } };
  }
  // ---- IVUS pullback ----
  if (st.ivus?.active) {
    st = { ...st, ivus: stepPullback(st.ivus, dt, 0) };
    if (st.device?.kind === "ivus") st = { ...st, device: { ...st.device, centreMm: st.ivus!.mm } };
  }
  // ---- pressure wire drift ----
  if (st.pressure) st = { ...st, pressure: stepPressureWire(st.pressure, dt) };
  // ---- complications ----
  const r = stepCx(st.cx, dt, cxContext(g, st), { route: st.route, vessel: g.lesion.vessel, atMm: g.lesion.centreMm });
  st = withNotes({ ...st, cx: r.cx }, r.notes);
  // what the last contrast run has shown of the changes the learner has not assessed
  const lastRunT = st.cx.lastRunT ?? null;
  if (lastRunT !== null && (st.cx.heldCues ?? []).length) {
    const shown = releaseHeldCues(st.cx, Math.min(st.t, lastRunT + MP_RUN_WINDOW_S));
    if (shown.notes.length) st = withNotes({ ...st, cx: shown.cx }, shown.notes);
  }
  return st;
}

/** Compatibility: advance time (fluoroscopy bookkeeping only). */
export function tick(st: PciState, dt: number, fluoro: boolean): PciState {
  return { ...st, t: st.t + dt, fluoroS: st.fluoroS + (fluoro ? dt : 0), wireTime: st.wireTime + (st.tipMm > 0 ? dt : 0) };
}

/** Context the complication engine reads. */
export function cxContext(g: PciGeom, st: PciState): CxContext {
  const dev = st.device;
  const balloon =
    dev && (dev.kind === "balloon" || dev.kind === "stent" || dev.kind === "covered-stent") && occluding(st.ind) && dev.centreMm > 0
      ? { route: st.route.slice(), fromMm: dev.centreMm - dev.lengthMm / 2, toMm: dev.centreMm + dev.lengthMm / 2, ratio: chartDiameter(specOf(dev), dev.diameter, Math.max(0, st.ind.atm)) / Math.max(0.5, refDAt(g, st.route, Math.max(0, dev.centreMm))) }
      : null;
  return {
    t: st.t,
    act: st.actTrue ?? 300,
    protamine: st.protamine,
    balloon,
    stents: st.stents.map((p) => ({ route: p.route, fromMm: p.fromMm, toMm: p.toMm, covered: p.covered, d: p.diameter })),
    devicesIn: st.tipMm > 0,
    oxygen: st.oxygen,
    refDiameterAt: (route, mm) => refDAt(g, route, mm),
    paramAt: (route, mm) => {
      const p = paramAtMm(g, route, mm);
      return p ? { vessel: p.vessel, param: p.param } : null;
    },
  };
}

/** What one assessment did: the complication it was scored against (null: nothing to recognise) and its score. */
export interface PciRecognition {
  id: string | null;
  kind: string | null;
  recognition: Recognition | null;
}

/**
 * The learner's structured assessment of what has changed (src/ui/pci/RecognitionForm.tsx): scored against
 * the complication it names (else the most severe open one). The live log gets the learner's own answer
 * (assessmentText), the same line and tone whether it was right, wrong or a false alarm; the complication
 * is named from then on only when its cause was right. A 'recognition' telemetry record keeps the result;
 * an assessment with nothing to recognise is recorded as a false alarm. Pure: returns the new state and
 * what happened.
 */
export function recognisePci(st0: PciState, answer: RecognitionAnswer): { st: PciState; result: PciRecognition } {
  const r = recogniseCx(st0.cx, st0.t, answer);
  const logged = log(st0, "info", assessmentText(answer));
  if (!r.id || !r.recognition) {
    const st = tele(logged, "recognition", { id: null, cause: answer.cause, correct: false, falseAlarm: true });
    return { st, result: { id: null, kind: null, recognition: null } };
  }
  const c = r.cx.list.find((x) => x.id === r.id)!;
  let st = withNotes({ ...logged, cx: r.cx }, r.notes);
  st = tele(st, "recognition", { id: c.id, kind: c.kind, cause: answer.cause, correct: r.recognition.score.correct, delayS: r.recognition.delayS, grade: c.grade, attempt: r.recognition.attempt ?? 1 });
  return { st, result: { id: c.id, kind: c.kind, recognition: r.recognition } };
}
