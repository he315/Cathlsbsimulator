// ---------------------------------------------------------------------------
// The metric debrief (measured results and observations, no checklist
// percentage) and the end of the case.
// ---------------------------------------------------------------------------

import { expansion, malapposition } from "../stentGeometry";
import type { SizingBasis } from "../lesionAssessment";
import type { Complication } from "../../complications/engine";
import { tele, type PciGeom, type PciScenario, type PciState } from "../state";
import { stentGeomOf, truthNow } from "./assessment";

export interface PciMetricsReport {
  residualDS: number;
  lesionEstimateErrorMm: { ref: number; mld: number; length: number } | null;
  sizingRatio: number | null;
  sizingBasis: SizingBasis | null;
  landingMarginMm: { prox: number; dist: number } | null;
  stentExpansionPct: number | null;
  maxMalappositionMm: number | null;
  complications: { kind: string; grade: string; stage: string; cause: string; recognitionS: number | null; treated: boolean }[];
  heparinGiven: boolean;
  actChecked: boolean;
  contrastMl: number;
  fluoroMin: number;
  cineRuns: number;
  wire: { offRouteBranches: number; septalEntries: number; distalEntries: number; maxDistalMm: number; whips: number; migrationMm: number };
  workflow: { uncheckedLabels: number; unpreparedDevices: number; deployWithoutRun: number; guideBackouts: number; actSkipped: number; melonSeeds: number };
  predilated: boolean;
  postdilatedInStent: boolean;
  oversizedOutsideLesion: number;
  geographicMiss: boolean;
}

export interface PciDebrief {
  residual: number;
  verdict: string;
  /** the case met its clinical goal without an untreated complication */
  passed: boolean;
  metrics: PciMetricsReport;
  items: { ok: boolean; text: string }[];
}

export function pciMetricsReport(s: PciScenario, g: PciGeom, st: PciState): PciMetricsReport {
  const truth = truthNow(g, st);
  const covering = st.stents.filter((p) => p.route.includes(g.lesion.vessel) && p.fromMm <= g.lesion.endMm && p.toMm >= g.lesion.startMm);
  const main = covering[covering.length - 1] ?? null;
  const geom = main ? stentGeomOf(g, main) : null;
  const exp = geom ? expansion(geom) : null;
  const mal = geom ? malapposition(geom) : null;
  return {
    residualDS: st.severity,
    lesionEstimateErrorMm: st.estimate ? { ref: st.estimate.score.refErrMm, mld: st.estimate.score.mldErrMm, length: st.estimate.score.lengthErrMm } : null,
    sizingRatio: main ? main.nominal / truth.refDistMm : null,
    sizingBasis: st.sizing?.basis ?? null,
    landingMarginMm: main ? { prox: g.lesion.startMm - main.fromMm, dist: main.toMm - g.lesion.endMm } : null,
    stentExpansionPct: main ? Math.round((100 * (main.atLesion / 0.97) ** 2) / truth.refMm ** 2) : exp ? Math.round(100 * exp.ratio) : null,
    maxMalappositionMm: mal ? mal.maxGapMm : null,
    complications: st.cx.list.map((c: Complication) => ({
      kind: c.kind,
      grade: c.grade,
      stage: c.stage,
      cause: c.cause,
      recognitionS: c.tTreated !== null ? c.tTreated - (c.tOvert ?? c.t0) : null,
      treated: c.stage === "treated" || c.stage === "resolved",
    })),
    heparinGiven: st.heparinGiven,
    actChecked: st.act !== null,
    contrastMl: st.contrastMl,
    fluoroMin: st.fluoroS / 60,
    cineRuns: st.cineRuns,
    wire: {
      offRouteBranches: st.counters.offRouteBranches,
      septalEntries: st.counters.septalEntries,
      distalEntries: st.wire.distal.entries,
      maxDistalMm: st.wire.distal.maxDangerMm,
      whips: st.counters.whips,
      migrationMm: st.counters.wireMigrationMm,
    },
    workflow: {
      uncheckedLabels: st.counters.uncheckedLabels,
      unpreparedDevices: st.counters.unpreparedDevices,
      deployWithoutRun: st.counters.deployWithoutRun,
      guideBackouts: st.counters.guideBackouts,
      actSkipped: st.counters.actSkipped,
      melonSeeds: st.counters.melonSeeds,
    },
    predilated: st.predilated,
    postdilatedInStent: st.counters.postdilatedInStent,
    oversizedOutsideLesion: st.counters.oversizedOutsideLesion,
    geographicMiss: st.geographicMiss,
  };
}

/** The debrief: measured results and observations, no checklist percentage. */
export function debrief(s: PciScenario, g: PciGeom, st: PciState): PciDebrief {
  const m = pciMetricsReport(s, g, st);
  const items: { ok: boolean; text: string }[] = [];
  const stented = st.stents.some((p) => p.fromMm <= g.lesion.endMm && p.toMm >= g.lesion.startMm && p.route.includes(g.lesion.vessel));
  items.push({ ok: stented, text: stented ? "The lesion was stented." : "No stent covers the lesion." });
  items.push({ ok: m.residualDS < 20, text: `Residual stenosis ${m.residualDS}% (${m.residualDS < 10 ? "optimal" : m.residualDS < 20 ? "acceptable" : "sub-optimal: aim for under 20%, ideally under 10%"}).` });
  if (m.lesionEstimateErrorMm)
    items.push({
      ok: m.lesionEstimateErrorMm.ref <= 0.5 && m.lesionEstimateErrorMm.length <= 5,
      text: `Lesion estimate error: reference ${m.lesionEstimateErrorMm.ref.toFixed(2)} mm, MLD ${m.lesionEstimateErrorMm.mld.toFixed(2)} mm, length ${m.lesionEstimateErrorMm.length.toFixed(1)} mm.`,
    });
  else items.push({ ok: false, text: "No lesion estimate was made before sizing." });
  if (m.sizingRatio !== null) items.push({ ok: m.sizingRatio >= 0.9 && m.sizingRatio <= 1.2, text: `Stent to distal reference ratio ${m.sizingRatio.toFixed(2)}${m.sizingBasis ? ` (sized on: ${m.sizingBasis.replace("-", " ")})` : ""}.` });
  if (m.landingMarginMm) items.push({ ok: m.landingMarginMm.prox >= 1.5 && m.landingMarginMm.dist >= 1.5, text: `Landing margins: proximal ${m.landingMarginMm.prox.toFixed(1)} mm, distal ${m.landingMarginMm.dist.toFixed(1)} mm beyond the lesion.` });
  if (m.stentExpansionPct !== null) items.push({ ok: m.stentExpansionPct >= 80, text: `Stent expansion at the lesion ${m.stentExpansionPct}% of the mean reference area.` });
  if (m.maxMalappositionMm !== null) items.push({ ok: m.maxMalappositionMm < 0.4, text: `Largest strut-to-wall gap ${m.maxMalappositionMm.toFixed(2)} mm.` });
  if (s.calcium === 2) {
    const prepped = st.resistance < 0.4;
    items.push({ ok: prepped, text: prepped ? "Calcium was modified before stenting." : "Severe calcium was not modified before stenting." });
  }
  for (const c of m.complications)
    items.push({ ok: c.treated, text: `${c.kind.replace("-", " ")} (${c.grade}): ${c.cause}; ${c.treated ? `treated${c.recognitionS !== null ? ` ${Math.round(c.recognitionS)} s after it was evident` : ""}` : "not treated"}.` });
  if (!m.complications.length) items.push({ ok: true, text: "No complication." });
  items.push({ ok: m.heparinGiven && m.actChecked, text: m.heparinGiven ? (m.actChecked ? "Heparin given and the ACT checked." : "Heparin given; the ACT was not checked.") : "No heparin recorded." });
  const contrastLimit = s.id === "rca-calcified" ? 80 : 150;
  items.push({ ok: m.contrastMl <= contrastLimit, text: `Contrast ${Math.round(m.contrastMl)} mL${s.id === "rca-calcified" ? " (kidney disease: keep it low)" : ""}.` });
  items.push({ ok: m.fluoroMin <= 15, text: `Fluoroscopy time ${m.fluoroMin.toFixed(1)} min.` });
  if (m.wire.offRouteBranches) items.push({ ok: m.wire.offRouteBranches <= 2, text: `The wire entered ${m.wire.offRouteBranches} side branch${m.wire.offRouteBranches > 1 ? "es" : ""} off the route${m.wire.septalEntries ? ` (${m.wire.septalEntries} septal)` : ""}.` });
  if (m.wire.distalEntries) items.push({ ok: m.wire.maxDistalMm < 5, text: `The wire tip went into small distal vessels ${m.wire.distalEntries} time${m.wire.distalEntries > 1 ? "s" : ""} (deepest ${m.wire.maxDistalMm.toFixed(0)} mm).` });
  const wf = m.workflow;
  if (wf.uncheckedLabels + wf.unpreparedDevices + wf.deployWithoutRun + wf.actSkipped > 0)
    items.push({ ok: false, text: `Workflow: ${[wf.uncheckedLabels ? `${wf.uncheckedLabels} box label${wf.uncheckedLabels > 1 ? "s" : ""} not checked` : "", wf.unpreparedDevices ? `${wf.unpreparedDevices} device${wf.unpreparedDevices > 1 ? "s" : ""} not prepared` : "", wf.deployWithoutRun ? `${wf.deployWithoutRun} deployment${wf.deployWithoutRun > 1 ? "s" : ""} without a positioning run` : "", wf.actSkipped ? "devices advanced before the ACT was checked" : ""].filter(Boolean).join("; ")}.` });
  if (wf.guideBackouts) items.push({ ok: false, text: `The guide backed out ${wf.guideBackouts} time${wf.guideBackouts > 1 ? "s" : ""} while devices were pushed.` });
  const untreated = m.complications.filter((c) => !c.treated).length;
  const passed = stented && m.residualDS < 20 && untreated === 0 && !st.geographicMiss;
  const verdict = passed ? (m.complications.length ? "Successful, with a complication that was managed" : "Successful result") : untreated ? "Complicated procedure" : stented ? "Sub-optimal result" : "Incomplete procedure";
  return { residual: st.severity, verdict, passed, metrics: m, items };
}

export function finishCase(s: PciScenario, g: PciGeom, st: PciState): PciState {
  return tele({ ...st, finished: true }, "case-end", { residualDS: st.severity, scenario: s.id, lesion: { startMm: g.lesion.startMm, endMm: g.lesion.endMm, refDiameterMm: g.lesion.refDiameter } });
}
