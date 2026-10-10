// ---------------------------------------------------------------------------
// Objective metrics for a diagnostic study and for PCI, computed from the
// recorded procedure (analysis.ts). Metrics are observations; whether a value
// passes is decided in standards.ts, where every threshold carries its source.
// ---------------------------------------------------------------------------

import { analyse, ANALYSIS_PARAMS, type Analysis, type AnalysisParams, type CaseFacts } from "./analysis";
import { standardisedLoops, type CoverageResult, type CoverageRun } from "./coverage";
import type { ProcedureRecord } from "./telemetry";
import { DAMPED_KINDS } from "./types";

export interface InjectionQuality {
  runId: string;
  durationS: number;
  ml: number;
  preContrastS: number | null;
  postPeakS: number | null;
  /** null when the host cannot film before the injection (not measurable) */
  preContrastOk: boolean | null;
  washoutOk: boolean;
  /** the distal bed filled (the injection was diagnostic) */
  adequateFill: boolean;
}

export interface DiagnosticMetrics {
  lab: "diagnostic";
  procTimeS: number;
  fluoroS: number;
  cineRuns: number;
  /** diagnostic runs, one per side and view family */
  standardisedLoops: number;
  redundantRuns: number;
  contrastMl: number;
  karMGy: number;
  kapGyCm2: number;
  injections: number;
  injectionsOutsideCine: number;
  engageAttempts: { left: number; right: number };
  failedAttempts: { left: number; right: number };
  timeToSelectiveS: { left?: number; right?: number };
  lvEntries: number;
  dampedEvents: number;
  injectWhileDamped: number;
  nonSelectiveInjections: number;
  lvInjections: number;
  /** fraction of injections preceded by a clean aspirate since the tip last moved */
  aspirateCompliance: number;
  /** fraction of injections made on a clean aortic trace */
  pressureCheckCompliance: number;
  catheterChanges: { total: number; early: number; late: number };
  injectionQuality: InjectionQuality[];
  viewCoverage?: { seen: string[]; missing: string[]; foreshortenedOnly: string[] };
  economy: Analysis["economy"];
  pushingEpisodes: number;
  hintsUsed: number;
  mentorPrompts: number;
  complications: string[];
  criticalErrors: string[];
}

export interface PciMetrics {
  lab: "pci";
  procTimeS: number;
  fluoroS: number;
  contrastMl: number;
  cineRuns: number;
  karMGy: number;
  kapGyCm2: number;
  wireTimeS: number;
  sideBranchEntries: number;
  septalEntries: number;
  distalTipExcursions: number;
  workingViewForeshortening?: number;
  lesionEstimateErrorMm?: { ref: number; mld: number; length: number };
  sizingRatio?: number;
  landingMarginMm?: { prox: number; dist: number };
  predilated: boolean;
  postdilatedInStent: boolean;
  oversizedOutsideLesion: number;
  deployWithoutPositioningRun: number;
  deviceBeyondWire: number;
  residualDS?: number;
  heparinGiven: boolean;
  actChecked: boolean;
  complications: string[];
  timeToRecogniseComplicationS?: number;
  correctBailout?: boolean;
  /**
   * Complication recognition (pci-cx-recognition), for the 'safety' subskill: seconds from the first
   * sign of the first assessed complication to the learner's first structured assessment of it
   * ('recognition' events, src/ui/lab/pciEvents/recognition.ts), right or wrong: a later right answer
   * after a wrong cause does not shorten it. Undefined when nothing was assessed. The debrief
   * (assessmentSummary, src/ui/pci/RecognitionForm.tsx) gives the same first attempt.
   */
  timeToRecognitionS?: number;
  /**
   * every assessment named the cause and grade correctly (a wrong first attempt stays wrong after a right
   * reassessment, and a false alarm counts as wrong); undefined when none was made
   */
  recognitionCorrect?: boolean;
  /** assessments made with nothing to recognise */
  falseRecognitions: number;
  hintsUsed: number;
  mentorPrompts: number;
  criticalErrors: string[];
}

export type Metrics = DiagnosticMetrics | PciMetrics;

export interface MetricsOptions {
  coverage?: CoverageResult;
  params?: AnalysisParams;
}

const num = (v: unknown, d = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : d);

function lastFrame(a: Analysis, k: "tFluoro" | "contrastMl" | "karMGy" | "kapGyCm2"): number {
  const n = a.frames.length;
  return n ? a.frames.value(n - 1, k) : 0;
}

function criticalFrom(a: Analysis): string[] {
  const out: string[] = [];
  for (const c of a.complications) out.push(String(c.data?.kind ?? "complication"));
  for (const m of a.mentor) if (m.data?.critical) out.push(`stop:${String(m.data?.ruleId ?? "?")}`);
  return out;
}

/** Runs as coverage inputs. */
export function coverageRuns(a: Analysis): CoverageRun[] {
  return a.runs.map((r) => ({ id: r.id, cArm: r.cArm, side: r.side ?? "both", diagnostic: r.diagnostic, tWall: r.startT }));
}

export function diagnosticMetrics(a: Analysis, opts: MetricsOptions = {}, params: AnalysisParams = ANALYSIS_PARAMS): DiagnosticMetrics {
  const inj = a.injections;
  const contrastFromEvents = inj.reduce((s, e) => s + num(e.data?.ml), 0);
  const loops = standardisedLoops(coverageRuns(a));
  const early = a.catheters.slice(0, -1).filter((c) => {
    const failed = c.failedApproaches.left + c.failedApproaches.right;
    const succeeded = c.successes.left + c.successes.right;
    return succeeded === 0 && failed < params.earlyChangeAttempts;
  }).length;
  const late = a.catheters.filter((c) => Math.max(c.failedApproaches.left, c.failedApproaches.right) > params.lateChangeAttempts).length;
  const procEnd = a.t1;
  const procStart = a.events.find((e) => e.kind === "case-start")?.tWall ?? a.t0;
  const tts: DiagnosticMetrics["timeToSelectiveS"] = {};
  for (const side of ["left", "right"] as const) {
    const t = a.firstSelective[side];
    if (t === undefined) continue;
    // measured from the last catheter exchange before it that could reach that side, else from the start
    const from = a.catheters.filter((c) => c.startT <= t).pop()?.startT ?? procStart;
    tts[side] = t - Math.max(procStart, from);
  }
  const cleanAsp = inj.filter((e) => e.data?.aspirated === "clean").length;
  const cleanTrace = inj.filter((e) => e.data?.pressure === "aortic").length;
  return {
    lab: "diagnostic",
    procTimeS: procEnd - procStart,
    fluoroS: lastFrame(a, "tFluoro"),
    cineRuns: a.runs.length,
    standardisedLoops: loops.count,
    redundantRuns: loops.redundant.length,
    contrastMl: Math.max(lastFrame(a, "contrastMl"), contrastFromEvents),
    karMGy: lastFrame(a, "karMGy"),
    kapGyCm2: lastFrame(a, "kapGyCm2"),
    injections: inj.length,
    injectionsOutsideCine: a.injectionsOutsideCine.length,
    engageAttempts: { left: a.approaches.filter((x) => x.side === "left").length, right: a.approaches.filter((x) => x.side === "right").length },
    failedAttempts: { left: a.approaches.filter((x) => x.side === "left" && !x.success).length, right: a.approaches.filter((x) => x.side === "right" && !x.success).length },
    timeToSelectiveS: tts,
    lvEntries: a.lvEntries.length,
    dampedEvents: a.damped.length,
    injectWhileDamped: inj.filter((e) => DAMPED_KINDS.includes(String(e.data?.pressure) as never) || e.data?.outcome === "deep-reflux").length,
    nonSelectiveInjections: inj.filter((e) => e.data?.outcome === "root-puff" || e.data?.outcome === "weak").length,
    lvInjections: inj.filter((e) => e.data?.outcome === "lv-injection" || e.data?.pressure === "lv").length,
    aspirateCompliance: inj.length ? cleanAsp / inj.length : 1,
    pressureCheckCompliance: inj.length ? cleanTrace / inj.length : 1,
    catheterChanges: { total: a.catheters.length - 1, early, late },
    injectionQuality: a.runs.map((r) => ({ runId: r.id, durationS: r.durationS, ml: r.ml, preContrastS: r.preContrastS, postPeakS: r.postPeakS, preContrastOk: r.preContrastOk, washoutOk: r.washoutOk, adequateFill: r.diagnostic })),
    viewCoverage: opts.coverage
      ? { seen: opts.coverage.segments.filter((s) => s.seen).map((s) => s.label), missing: opts.coverage.missing, foreshortenedOnly: opts.coverage.foreshortenedOnly }
      : undefined,
    economy: a.economy,
    pushingEpisodes: a.pushing.length,
    hintsUsed: a.hints.length,
    mentorPrompts: a.mentor.filter((m) => num(m.data?.level) > 0).length,
    complications: a.complications.map((c) => String(c.data?.kind ?? "complication")),
    criticalErrors: criticalFrom(a),
  };
}

export function pciMetrics(a: Analysis, facts: CaseFacts = {}, params: AnalysisParams = ANALYSIS_PARAMS): PciMetrics {
  const ev = (k: string) => a.events.filter((e) => e.kind === k);
  const branches = ev("wire-branch");
  const deploys = ev("deploy");
  const inflates = ev("inflate");
  const devices = ev("device");
  const lesion = facts.lesion;
  const est = ev("lesion-estimate").pop();
  let lesionErr: PciMetrics["lesionEstimateErrorMm"];
  if (est) {
    const d = est.data ?? {};
    const tr = (d.truth ?? {}) as Record<string, unknown>;
    lesionErr = { ref: Math.abs(num(d.refMm) - num(tr.refMm)), mld: Math.abs(num(d.mldMm) - num(tr.mldMm)), length: Math.abs(num(d.lengthMm) - num(tr.lengthMm)) };
  }
  const lastDeploy = deploys[deploys.length - 1];
  let sizingRatio: number | undefined;
  let landing: PciMetrics["landingMarginMm"];
  if (lastDeploy && lesion) {
    sizingRatio = num(lastDeploy.data?.diameter) / lesion.refDiameterMm;
    landing = { prox: lesion.startMm - num(lastDeploy.data?.fromMm), dist: num(lastDeploy.data?.toMm) - lesion.endMm };
  }
  const firstDeployT = deploys[0]?.tWall ?? Infinity;
  const predilated = inflates.some((e) => e.tWall < firstDeployT && e.data?.kind !== "stent" && e.data?.inLesion === true);
  const postdilatedInStent = inflates.some((e) => e.tWall > firstDeployT && e.data?.inStent === true);
  const oversized = inflates.filter((e) => num(e.data?.localRefMm) > 0 && num(e.data?.diameter) / num(e.data?.localRefMm) > params.oversizeRatio && e.data?.inLesion !== true && e.data?.inStent !== true).length;
  // a deploy needs an injection (a positioning run) after the last device move: the engine's own test
  // (st.injectedSinceDeviceMove, counted as st.counters.deployWithoutRun) and the attending's
  // (deploy-without-run). An injection is counted when it falls after the move, whether its cine run
  // started before or after it (pci-attending: a run started before the move whose injection came after
  // it is a positioning run).
  let noPositioning = 0;
  for (const d of deploys) {
    const lastMove = devices.filter((x) => x.tWall <= d.tWall && (x.data?.action === "move" || x.data?.action === "load")).pop();
    const ref = lastMove?.tWall ?? -Infinity;
    if (!a.injections.some((i) => i.tWall > ref && i.tWall <= d.tWall)) noPositioning++;
  }
  // recognition time: from each complication to the first bailout after it
  let ttr: number | undefined;
  let bailOk: boolean | undefined;
  const comp = a.complications[0];
  if (comp) {
    const b = a.bailouts.find((x) => x.tWall >= comp.tWall);
    ttr = b ? b.tWall - comp.tWall : undefined;
    bailOk = b ? bailoutMatches(String(comp.data?.kind), String(b.data?.action)) : false;
  }
  // structured recognition (the learner's assessment before the lab names the complication)
  const recs = ev("recognition");
  const named = recs.filter((e) => typeof e.data?.id === "string");
  const firstNamed = named[0];
  const timeToRecognitionS = firstNamed ? (typeof firstNamed.data?.delayS === "number" ? num(firstNamed.data.delayS) : undefined) : undefined;
  const recognitionCorrect = recs.length ? recs.every((e) => e.data?.correct === true) : undefined;
  const end = ev("case-end").pop();
  const wireFrames = a.frames;
  let wireTime = 0;
  for (let i = 1; i < wireFrames.length; i++) if (wireFrames.value(i, "wireTipMm") > 0) wireTime += wireFrames.value(i, "tWall") - wireFrames.value(i - 1, "tWall");
  return {
    lab: "pci",
    procTimeS: a.t1 - (a.events.find((e) => e.kind === "case-start")?.tWall ?? a.t0),
    fluoroS: lastFrame(a, "tFluoro"),
    contrastMl: Math.max(lastFrame(a, "contrastMl"), a.injections.reduce((s, e) => s + num(e.data?.ml), 0)),
    cineRuns: a.runs.length,
    karMGy: lastFrame(a, "karMGy"),
    kapGyCm2: lastFrame(a, "kapGyCm2"),
    wireTimeS: wireTime,
    sideBranchEntries: branches.filter((b) => b.data?.onRoute === false).length,
    septalEntries: branches.filter((b) => b.data?.septal === true).length,
    distalTipExcursions: a.events.filter((e) => e.kind === "wire-distal" || (e.kind === "complication" && e.data?.kind === "perforation")).length,
    workingViewForeshortening: num(ev("working-view").pop()?.data?.foreshortening, NaN) || undefined,
    lesionEstimateErrorMm: lesionErr,
    sizingRatio,
    landingMarginMm: landing,
    predilated,
    postdilatedInStent,
    oversizedOutsideLesion: oversized,
    deployWithoutPositioningRun: noPositioning,
    deviceBeyondWire: devices.filter((d) => d.data?.beyondWire === true).length,
    residualDS: end?.data?.residualDS !== undefined ? num(end.data.residualDS) : undefined,
    heparinGiven: ev("heparin").length > 0,
    actChecked: ev("act").length > 0,
    complications: a.complications.map((c) => String(c.data?.kind ?? "complication")),
    timeToRecogniseComplicationS: ttr,
    correctBailout: bailOk,
    timeToRecognitionS,
    recognitionCorrect,
    falseRecognitions: recs.filter((e) => e.data?.falseAlarm === true).length,
    hintsUsed: a.hints.length,
    mentorPrompts: a.mentor.filter((m) => num(m.data?.level) > 0).length,
    criticalErrors: criticalFrom(a),
  };
}

/** Which bailout fits which complication (teaching mapping, not exhaustive). */
export function bailoutMatches(complication: string, action: string): boolean {
  const ok: Record<string, string[]> = {
    perforation: ["balloon-tamponade", "covered-stent", "pericardiocentesis", "coil"],
    dissection: ["stent", "stop-injecting", "balloon"],
    "slow-flow": ["vasodilator"],
    vf: ["defibrillate"],
    "air-embolism": ["aspirate", "oxygen", "vasodilator"],
  };
  return (ok[complication] ?? []).includes(action);
}

/** Convenience: analyse and compute in one call. */
export function computeMetrics(record: ProcedureRecord, facts: CaseFacts = {}, opts: MetricsOptions = {}): { analysis: Analysis; metrics: Metrics } {
  const params = opts.params ?? ANALYSIS_PARAMS;
  const analysis = analyse(record, facts, params);
  const metrics = record.meta.lab === "pci" ? pciMetrics(analysis, facts, params) : diagnosticMetrics(analysis, opts, params);
  return { analysis, metrics };
}

/** Numeric metric lookup by dotted path ("timeToSelectiveS.left", "contrastMl"). */
export function metricValue(m: Metrics, path: string): number | undefined {
  let v: unknown = m;
  for (const k of path.split(".")) {
    if (v === null || typeof v !== "object") return undefined;
    v = (v as Record<string, unknown>)[k];
  }
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (Array.isArray(v)) return v.length;
  return undefined;
}

/**
 * The numeric measures of a PCI attempt for the logbook row (pci-attending: measured metrics instead of a
 * 100 or 0 score): every number, booleans as 1 or 0, arrays as their length, nested numbers by dotted
 * name ("landingMarginMm.prox"). Undefined and non-finite values are left out.
 */
export function pciMetricNumbers(m: PciMetrics): Record<string, number> {
  const out: Record<string, number> = {};
  const put = (k: string, v: unknown) => {
    if (typeof v === "number") {
      if (Number.isFinite(v)) out[k] = Math.round(v * 1000) / 1000;
    } else if (typeof v === "boolean") out[k] = v ? 1 : 0;
    else if (Array.isArray(v)) out[k] = v.length;
    else if (v && typeof v === "object") for (const [k2, v2] of Object.entries(v)) put(`${k}.${k2}`, v2);
  };
  for (const [k, v] of Object.entries(m)) if (k !== "lab") put(k, v);
  return out;
}
