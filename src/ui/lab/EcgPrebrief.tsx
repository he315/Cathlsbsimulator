// ---------------------------------------------------------------------------
// The ACS front end of a diagnostic case (diag-acs-scenarios), shown in the
// pre-brief (src/ui/mentor/PreBrief.tsx) and, for the culprit studies, in the
// study report (src/ui/lab/StudyReport.tsx):
//
//   - EcgPrebrief: the presenting 12-lead, drawn from the patient engine's
//     dipole (src/simulation/ecg12.ts) with the injury vector of the
//     scenario's culprit on the engine's textbook coronary network
//     (defaultFlowMap). The learner can record the right-sided (V3R, V4R) and
//     posterior (V7-V9) leads, then commits the territory, the artery, its
//     level and whether the pattern activates the reperfusion pathway before
//     the beam is enabled. Nothing on the screen grades it: the answer is the
//     angiogram. The grading functions (acsDecisions in
//     src/mentor/rules/diagAcs.ts) are not yet called by the debrief, so the
//     screen promises no comparison.
//   - ReperfusionClock: minutes since the STEMI diagnosis against Oxford's 120
//     minutes (cp-acs-thrombus-reperfusion), counted from the first time the
//     case shows it (kept in useAcsStore, so leaving the step does not reset it).
//   - OhcaTriageGate: after a resuscitated arrest, the triage decision, the
//     pads and the named defibrillator operator, before the lab opens.
//   - the previous-study group of a culprit study: rendered once per case from
//     the case's own tree with the earlier lesions (renderPreviousStudy, into
//     useSeriesStore's previousStudy, which holds one case's group at a time)
//     and played by PreviousStudyViewer.
//
// The learner's answers live in useAcsStore, keyed by the case and the lab
// session (a retry or a restart starts afresh), for the report and the
// debrief; acsBeamAllowed and acsLedgerForLoadedCase are the hooks for the
// lab's beam gate and the debrief's decision ledger. Lead positions beyond Dower's 12 and the bundle-branch
// templates are model parameters, and the ECG says so on screen.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { create } from "zustand";
import type { AnatomyCase, Vec3, VesselId } from "../../types";
import { LEADS, POSTERIOR_LEADS, RIGHT_LEADS, STRIP_HZ, ecgStrip, stripSpecFor, type AnyLead } from "../../simulation/ecg12";
import { defaultFlowMap } from "../../simulation/patient/coronaryFlow";
import {
  DEFIB_OPERATORS,
  DEFIB_OPERATOR_LABEL,
  ECG_ARTERIES,
  ECG_ARTERY_LABEL,
  ECG_LEVELS,
  ECG_LEVEL_LABEL,
  ECG_TERRITORIES,
  ECG_TERRITORY_LABEL,
  OHCA_TRIAGE,
  OHCA_TRIAGE_LABEL,
  acsCaseFor,
  type AcsCase,
  type AcsEcg,
  type PreviousStudySpec,
} from "../../simulation/diagnosticScenarios/acs";
import {
  REPERFUSION_LIMIT_MIN,
  acsDecisions,
  ecgPredictionProblems,
  reperfusionClock,
  triageProblems,
  type AcsAnswers,
  type EcgPrediction,
  type EngagementOrderVerdict,
  type ExtraLeadSet,
  type OhcaTriageAnswer,
} from "../../mentor/rules/diagAcs";
import type { DecisionRecord } from "../../mentor/ledger";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { STORE_PX, previousStudyFor, useSeriesStore, type PreviousStudy, type StoredSeries } from "../../state/useSeriesStore";
import { useSeries, useSim } from "./useLab";

// --- the answers store -----------------------------------------------------------------------------

/** A patch to this case's answers, or a function of the current ones (so two updates in one tick both land). */
export type AcsPatch = Partial<Omit<AcsAnswers, "caseId" | "session">> | ((cur: AcsAnswers) => Partial<Omit<AcsAnswers, "caseId" | "session">>);

export interface AcsStore {
  answers: AcsAnswers | null;
  /**
   * Merge into the answers of this case in the current lab session (the simulator store's
   * sessionStart); answers of another case, or of an earlier session of the same case (a retry or a
   * restart), are dropped first.
   */
  update: (caseId: string, patch: AcsPatch) => void;
  reset: () => void;
}

/** The lab session the answers belong to: the simulator store's sessionStart, which a relaunch or a restart renews. */
export function currentAcsSession(): number {
  return useSimulatorStore.getState().sessionStart;
}

const ownAnswers = (answers: AcsAnswers | null, caseId: string, session: number): AcsAnswers | null => (answers && answers.caseId === caseId && answers.session === session ? answers : null);

export const useAcsStore = create<AcsStore>((set) => ({
  answers: null,
  update: (caseId, patch) =>
    set((st) => {
      const session = currentAcsSession();
      const cur = ownAnswers(st.answers, caseId, session) ?? { caseId };
      const p = typeof patch === "function" ? patch(cur) : patch;
      return { answers: { ...cur, ...p, caseId, session } };
    }),
  reset: () => set(() => ({ answers: null })),
}));

/** The answers of this case in this session (an empty record when the store holds another case's or an earlier session's). */
export function acsAnswersFor(st: Pick<AcsStore, "answers">, caseId: string, session: number = currentAcsSession()): AcsAnswers {
  return ownAnswers(st.answers, caseId, session) ?? { caseId };
}

/**
 * This case's answers in a component. The snapshot is the stored record itself (stable), and server
 * rendering reads the live state too, as the lab's own store hooks do (src/ui/lab/useLab.ts).
 */
export function useAcsAnswers(caseId: string): AcsAnswers {
  const raw = useSyncExternalStore(useAcsStore.subscribe, () => useAcsStore.getState().answers, () => useAcsStore.getState().answers);
  const session = useSim((s) => s.sessionStart);
  return useMemo(() => ownAnswers(raw, caseId, session) ?? { caseId }, [raw, caseId, session]);
}

/** Whether the pre-brief's ACS steps are done: the ECG prediction and the triage, where the case has them. */
export function acsPrebriefDone(acs: AcsCase | undefined, a: AcsAnswers): boolean {
  if (!acs) return true;
  if (acs.ecg && a.ecg?.committedAt === undefined) return false;
  if (acs.triage && a.triage?.committedAt === undefined) return false;
  return true;
}

/**
 * Whether the loaded diagnostic case lets the beam on as far as its ACS front end goes, in every
 * mode: false until the ECG prediction and the triage of an ACS case are committed in this session.
 * The lab's beam gate (src/ui/lab/useAttending.ts session.beamGate) is to AND this with the time-out.
 */
export function acsBeamAllowed(): boolean {
  const c = useSimulatorStore.getState().caseData;
  return acsPrebriefDone(acsCaseFor(c.scenarioId), acsAnswersFor(useAcsStore.getState(), c.id));
}

/**
 * The loaded case's ACS decisions as decision-ledger records (acsDecisions on this session's
 * answers), for the debrief to append to the case's decisions; empty for a case without an ACS front end.
 */
export function acsLedgerForLoadedCase(o: { t?: number; engagement?: EngagementOrderVerdict } = {}): DecisionRecord[] {
  const c = useSimulatorStore.getState().caseData;
  const acs = acsCaseFor(c.scenarioId);
  return acs ? acsDecisions(acs, acsAnswersFor(useAcsStore.getState(), c.id), o) : [];
}

// --- the ECG ---------------------------------------------------------------------------------------

/** Pixels per millimetre of ECG paper in the drawing (25 mm/s, 10 mm/mV). */
const PX_MM = 4;
const CELL_S = 2.5;
const CELL_W = CELL_S * 25 * PX_MM;
const ROW_H = 30 * PX_MM;
const CAL_W = 5 * PX_MM;

/** The standard layout (3 rows of 4 leads), then the extra leads the learner recorded. */
const STANDARD_ROWS: AnyLead[][] = [
  ["I", "aVR", "V1", "V4"],
  ["II", "aVL", "V2", "V5"],
  ["III", "aVF", "V3", "V6"],
];

/** The strips of an ACS ECG, every lead (deterministic). */
export function acsEcgStrips(ecg: AcsEcg): Record<AnyLead, Float32Array> {
  return ecgStrip(stripSpecFor(ecg, defaultFlowMap().regions), [...LEADS, ...RIGHT_LEADS, ...POSTERIOR_LEADS], CELL_S);
}

function tracePath(a: Float32Array, x0: number, yMid: number): string {
  const step = CELL_W / Math.max(1, a.length - 1);
  let d = "";
  for (let i = 0; i < a.length; i++) {
    const x = x0 + i * step;
    const y = yMid - a[i] * 10 * PX_MM; // 1 mV = 10 mm
    d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

/** A 12-lead printout at 25 mm/s and 10 mm/mV, with the extra rows recorded. */
export function EcgPaper({ strips, rows, title }: { strips: Record<AnyLead, Float32Array>; rows: AnyLead[][]; title: string }) {
  const width = CAL_W + 4 * CELL_W;
  const height = rows.length * ROW_H;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full rounded-md border border-line bg-base-900" role="img" aria-label={title}>
      <defs>
        <pattern id="ecg-minor" width={PX_MM} height={PX_MM} patternUnits="userSpaceOnUse">
          <path d={`M ${PX_MM} 0 L 0 0 0 ${PX_MM}`} fill="none" stroke="#22262C" strokeWidth="0.5" />
        </pattern>
        <pattern id="ecg-major" width={5 * PX_MM} height={5 * PX_MM} patternUnits="userSpaceOnUse">
          <rect width={5 * PX_MM} height={5 * PX_MM} fill="url(#ecg-minor)" />
          <path d={`M ${5 * PX_MM} 0 L 0 0 0 ${5 * PX_MM}`} fill="none" stroke="#2E343C" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#ecg-major)" />
      {rows.map((row, ri) => {
        const yMid = ri * ROW_H + ROW_H * 0.55;
        return (
          <g key={ri}>
            {/* the 1 mV calibration pulse */}
            <path d={`M2 ${yMid} L${PX_MM} ${yMid} L${PX_MM} ${yMid - 10 * PX_MM} L${4 * PX_MM} ${yMid - 10 * PX_MM} L${4 * PX_MM} ${yMid} L${CAL_W} ${yMid}`} fill="none" stroke="#ECEEF1" strokeWidth="1.4" />
            {row.map((lead, ci) => {
              const x0 = CAL_W + ci * CELL_W;
              return (
                <g key={lead} data-lead={lead}>
                  <path d={tracePath(strips[lead], x0, yMid)} fill="none" stroke="#ECEEF1" strokeWidth="1.4" strokeLinejoin="round" />
                  <text x={x0 + 6} y={ri * ROW_H + 16} fill="#A6ADB8" fontSize="13" fontFamily="IBM Plex Sans, system-ui, sans-serif">
                    {lead}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

const LEAD_SET_ROWS: Record<ExtraLeadSet, AnyLead[]> = { right: [...RIGHT_LEADS], posterior: [...POSTERIOR_LEADS] };

export interface EcgPrebriefProps {
  acs: AcsCase & { ecg: AcsEcg };
  caseId: string;
  /** epoch ms provider (injected for tests) */
  now?: () => number;
}

/** The pre-brief ECG step: read, record more leads if needed, and commit a prediction. */
export default function EcgPrebrief({ acs, caseId, now = Date.now }: EcgPrebriefProps) {
  const ecg = acs.ecg;
  const answers = useAcsAnswers(caseId);
  const update = useAcsStore.getState().update;
  const strips = useMemo(() => acsEcgStrips(ecg), [ecg]);
  const p: EcgPrediction = answers.ecg ?? { leads: [] };
  const committed = answers.ecg?.committedAt !== undefined;
  // every change merges into the store's current answer, not this render's snapshot (two clicks in one tick both land)
  const change = (f: (cur: EcgPrediction & { committedAt?: number }) => Partial<EcgPrediction & { committedAt?: number }>) =>
    update(caseId, (cur) => {
      const e = cur.ecg ?? { leads: [] };
      return { ecg: { ...e, ...f(e) } };
    });
  const set = (patch: Partial<EcgPrediction>) => change(() => patch);
  const rows = [...STANDARD_ROWS, ...(["right", "posterior"] as const).filter((l) => p.leads.includes(l)).map((l) => LEAD_SET_ROWS[l])];
  const problems = ecgPredictionProblems(p);
  const record = (l: ExtraLeadSet) => change((e) => (e.leads.includes(l) ? {} : { leads: [...e.leads, l] }));

  return (
    <section className="space-y-3" aria-label="Presenting ECG" data-ecg-prebrief={ecg.id}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-ink">Presenting ECG</h3>
        <span className="metric text-[12px] text-ink-faint">
          25 mm/s, 10 mm/mV, rate {ecg.hr}/min
        </span>
      </div>
      <EcgPaper strips={strips} rows={rows} title="Presenting 12-lead ECG" />
      <p className="text-[12px] text-ink-faint">
        Model ECG drawn from the simulator's heart model. The positions of the right-sided and posterior leads and the bundle branch block templates are model parameters, not recordings.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn h-8 text-[13px]" disabled={committed || p.leads.includes("right")} onClick={() => record("right")}>
          {p.leads.includes("right") ? "V3R and V4R recorded" : "Record V3R and V4R"}
        </button>
        <button type="button" className="btn h-8 text-[13px]" disabled={committed || p.leads.includes("posterior")} onClick={() => record("posterior")}>
          {p.leads.includes("posterior") ? "V7 to V9 recorded" : "Record V7 to V9"}
        </button>
      </div>

      <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-3" disabled={committed}>
        <legend className="sr-only">Your prediction</legend>
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          Territory
          <select className="field" value={p.territory ?? ""} onChange={(e) => set({ territory: (e.target.value || undefined) as EcgPrediction["territory"] })}>
            <option value="">Choose</option>
            {ECG_TERRITORIES.map((t) => (
              <option key={t} value={t}>
                {ECG_TERRITORY_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          Artery
          <select className="field" value={p.artery ?? ""} onChange={(e) => set({ artery: (e.target.value || undefined) as EcgPrediction["artery"] })}>
            <option value="">Choose</option>
            {ECG_ARTERIES.map((a) => (
              <option key={a} value={a}>
                {ECG_ARTERY_LABEL[a]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          Level
          <select className="field" value={p.level ?? ""} onChange={(e) => set({ level: (e.target.value || undefined) as EcgPrediction["level"] })}>
            <option value="">Choose</option>
            {ECG_LEVELS.map((l) => (
              <option key={l} value={l}>
                {ECG_LEVEL_LABEL[l]}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-ink-faint">Reperfusion pathway</span>
        <div className="seg">
          {([true, false] as const).map((v) => (
            <button key={String(v)} type="button" disabled={committed} className={`seg-btn ${p.activate === v ? "seg-btn-active" : ""}`} aria-pressed={p.activate === v} onClick={() => set({ activate: v })}>
              {v ? "Activate" : "Do not activate"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {committed ? (
          <span className="text-[12px] text-ink-faint">Prediction recorded. Check it against the angiogram.</span>
        ) : (
          <>
            {problems.length > 0 && <span className="flex-1 text-[12px] text-ink-faint">{problems[0]}</span>}
            <button type="button" className="btn btn-accent h-8" disabled={problems.length > 0} onClick={() => change(() => ({ committedAt: now() }))}>
              Commit prediction
            </button>
          </>
        )}
      </div>
    </section>
  );
}

// --- the reperfusion clock -------------------------------------------------------------------------

/**
 * When this case's reperfusion clock started (ms, the `now` clock): the first time it is asked for,
 * stored in useAcsStore so that leaving the ECG step and coming back does not restart it.
 */
export function clockStartFor(caseId: string, now: () => number = Date.now): number {
  const have = acsAnswersFor(useAcsStore.getState(), caseId).clockStartedAt;
  if (have !== undefined) return have;
  const t = now();
  useAcsStore.getState().update(caseId, { clockStartedAt: t });
  return t;
}

/** Minutes since the STEMI diagnosis, counting from when the case first shows it (the case's arrival on the table). */
export function ReperfusionClock({ caseId, diagnosisMinutesAgo, now = Date.now }: { caseId: string; diagnosisMinutesAgo: number; now?: () => number }) {
  const answers = useAcsAnswers(caseId);
  // the store write happens in the effect; until then (and in server rendering) the first read stands in
  const fallback = useRef<number | null>(null);
  if (fallback.current === null) fallback.current = answers.clockStartedAt ?? now();
  const [, tick] = useState(0);
  useEffect(() => {
    clockStartFor(caseId, () => fallback.current ?? now());
    const id = setInterval(() => tick((n) => n + 1), 15000);
    return () => clearInterval(id);
  }, [caseId, now]);
  const start = answers.clockStartedAt ?? fallback.current;
  const c = reperfusionClock(diagnosisMinutesAgo, (now() - start) / 1000);
  return (
    <div className={`notice ${c.over ? "notice-warn" : "notice-info"}`} data-reperfusion-clock>
      <span>
        STEMI diagnosis <span className="metric text-ink">{Math.floor(c.minutesSinceDiagnosis)} min</span> ago. Primary PCI is the strategy when it can happen within {REPERFUSION_LIMIT_MIN} minutes of the diagnosis (Oxford).
      </span>
    </div>
  );
}

// --- the triage after a resuscitated arrest --------------------------------------------------------

/**
 * The triage decision after a resuscitated arrest. It sits below the presenting ECG, which is its
 * evidence (persistent ST elevation or none); `waitForEcg` keeps its commit closed until the ECG
 * reading is committed.
 */
export function OhcaTriageGate({ caseId, waitForEcg = false, now = Date.now }: { caseId: string; waitForEcg?: boolean; now?: () => number }) {
  const answers = useAcsAnswers(caseId);
  const update = useAcsStore.getState().update;
  const a: OhcaTriageAnswer = answers.triage ?? { padsOn: false };
  const committed = answers.triage?.committedAt !== undefined;
  // merged into the store's current answer, not this render's snapshot
  const set = (patch: Partial<OhcaTriageAnswer & { committedAt?: number }>) => update(caseId, (cur) => ({ triage: { ...(cur.triage ?? { padsOn: false }), ...patch } }));
  const ecgPending = waitForEcg && answers.ecg?.committedAt === undefined;
  const problems = [...(ecgPending ? ["Commit your reading of the ECG first"] : []), ...triageProblems(a)];
  return (
    <section className="space-y-3" aria-label="Triage after the arrest" data-ohca-triage>
      <h3 className="text-[13px] font-semibold text-ink">After the arrest: where next?</h3>
      <fieldset className="space-y-1.5" disabled={committed}>
        <legend className="sr-only">Triage</legend>
        {OHCA_TRIAGE.map((c) => (
          <label key={c} className="flex items-center gap-2 text-[13px] text-ink-soft">
            <input type="radio" name="ohca-triage" checked={a.choice === c} onChange={() => set({ choice: c })} />
            {OHCA_TRIAGE_LABEL[c]}
          </label>
        ))}
      </fieldset>
      <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2" disabled={committed}>
        <legend className="sr-only">The team for a second arrest</legend>
        <label className="flex items-center gap-2 text-[13px] text-ink-soft">
          <input type="checkbox" checked={a.padsOn} onChange={(e) => set({ padsOn: e.target.checked })} />
          Defibrillator pads on
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          Who defibrillates if VF recurs
          <select className="field" value={a.defibOperator ?? ""} onChange={(e) => set({ defibOperator: (e.target.value || undefined) as OhcaTriageAnswer["defibOperator"] })}>
            <option value="">Choose</option>
            {DEFIB_OPERATORS.map((d) => (
              <option key={d} value={d}>
                {DEFIB_OPERATOR_LABEL[d]}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {committed ? (
          <span className="text-[12px] text-ink-faint">Decision recorded.</span>
        ) : (
          <>
            {problems.length > 0 && <span className="flex-1 text-[12px] text-ink-faint">{problems[0]}</span>}
            <button type="button" className="btn btn-accent h-8" disabled={problems.length > 0} onClick={() => set({ committedAt: now() })}>
              Commit decision
            </button>
          </>
        )}
      </div>
    </section>
  );
}

// --- the previous study ----------------------------------------------------------------------------

/** The case as it was at the previous study: its own id (so the same tree and thorax) with the earlier lesions. */
export function previousStudyCase(c: AnatomyCase, spec: PreviousStudySpec): AnatomyCase {
  return { ...c, lesions: (spec.lesions ?? []).map((l) => ({ ...l })) };
}

/** The render in flight, if any (one case at a time: the store holds one previous-study group). */
let rendering: { caseId: string; p: Promise<void> } | null = null;

/**
 * Render the previous study of a culprit case once (a browser with WebGL2): each run of the spec
 * filmed through the diagnostic renderer from the case's own tree with the earlier lesions, stored
 * as grey frames at STORE_PX in useSeriesStore's previous-study group.
 */
export function renderPreviousStudy(c: AnatomyCase, spec: PreviousStudySpec, render: (c: AnatomyCase, spec: PreviousStudySpec) => Promise<StoredSeries[]> = renderRuns): Promise<void> {
  const st = useSeriesStore.getState();
  const have = previousStudyFor(st, c.id);
  // the store is the guard: this case's group rendering or ready means nothing more to do
  if (have?.status === "ready") return Promise.resolve();
  if (have?.status === "rendering" && rendering?.caseId === c.id) return rendering.p;
  // another case's group (or none, or a failed one): this case replaces it, releasing its frames
  st.setPreviousStudy({ caseId: c.id, label: spec.label, status: "rendering", series: [] });
  // a result for a case the store no longer holds is dropped
  const stillOurs = () => useSeriesStore.getState().previousStudy?.caseId === c.id;
  const p = render(c, spec)
    .then((series) => {
      if (stillOurs()) useSeriesStore.getState().setPreviousStudy({ caseId: c.id, label: spec.label, status: "ready", series });
    })
    .catch((e: unknown) => {
      if (stillOurs()) useSeriesStore.getState().setPreviousStudy({ caseId: c.id, label: spec.label, status: "failed", series: [], error: e instanceof Error ? e.message : String(e) });
    })
    .finally(() => {
      if (rendering?.p === p) rendering = null;
    });
  rendering = { caseId: c.id, p };
  return p;
}

/** Release the previous-study group when the loaded case is not the one it belongs to. */
export function releasePreviousStudyUnless(caseId: string | null | undefined): void {
  const st = useSeriesStore.getState();
  if (st.previousStudy && st.previousStudy.caseId !== caseId) st.setPreviousStudy(null);
}

/** Frames per second and length of each previous-study run (MODEL PARAMETERS: a short cine run at the lab's usual rate). */
const PREV_FPS = 15;
const PREV_RUN_S = 3;

async function renderRuns(c0: AnatomyCase, spec: PreviousStudySpec): Promise<StoredSeries[]> {
  const [{ buildXrayScene }, { XrayRenderer }, { catheterById }, { catheterPath }, { buildAnatomy }, { buildCoronaryTree }, inj] = await Promise.all([
    import("../../render/xray/sceneBuilder"),
    import("../../render/xray/XrayRenderer"),
    import("../../data/catheters"),
    import("../sim/helpers"),
    import("../../simulation/anatomy"),
    import("../../render/xray/coronaryTree"),
    import("../../simulation/injection"),
  ]);
  const c = previousStudyCase(c0, spec);
  const res = STORE_PX;
  const canvas = document.createElement("canvas");
  canvas.width = res;
  canvas.height = res;
  const xr = XrayRenderer.create(canvas);
  if (!xr) throw new Error("The previous study needs WebGL2 with floating-point render targets, which this browser does not offer.");
  xr.resize(res);
  xr.setCaptureMode(true);
  const grab = document.createElement("canvas");
  grab.width = res;
  grab.height = res;
  const g2 = grab.getContext("2d", { willReadFrequently: true });
  if (!g2) throw new Error("The previous study could not read back its frames.");
  const model = buildAnatomy(c);
  const tree = buildCoronaryTree(model, c);
  const out: StoredSeries[] = [];
  try {
    for (let ri = 0; ri < spec.runs.length; ri++) {
      const run = spec.runs[ri];
      const side = run.side;
      const os = side === "left" ? model.lm : model.rca;
      const tip = { pos: os.pos, dir: os.dir, height: os.height, az: os.az, radius: model.sinusRadius, cram: 0, gap: 0 };
      const catheterId = side === "left" ? "JL4" : "JR4";
      const root = catheterPath(model, tip, catheterById(catheterId));
      const filled = [...new Set(tree.vessels.filter((v) => v.side === side).map((v) => v.fillId))] as VesselId[];
      const trace = inj.planTrace(inj.standardPlan(side, inj.LUMENS["diag-6"]));
      const n = Math.round(PREV_RUN_S * PREV_FPS);
      const frames: Uint8Array[] = [];
      for (let k = -4; k < n; k++) {
        const t = k / PREV_FPS;
        const cine = k >= 0;
        const r = buildXrayScene({
          model,
          caseData: { accessRoute: c.accessRoute, lesions: c.lesions, dominance: c.dominance },
          tree,
          catheterRoot: root as Vec3[],
          french: 6,
          guide: false,
          wire: null,
          bolus: cine ? { filled, plume: "none", side, t, injectDur: inj.STANDARD_PUSH_S, peak: 1, trace } : null,
          t,
          cArm: run.cArm,
          field: 200,
          centreOn: side,
          mode: cine ? "cine" : "fluoro",
          breathHold: cine ? 0.7 : null,
          frame: 300000 + ri * 1000 + k,
          framesSinceStart: cine ? k : k + 4,
          patientSeed: c.id,
          extras: () => ({}),
        });
        xr.render(r.scene, { ...r.params, mode: cine ? "cine" : "fluoro", framesSinceStart: cine ? k : k + 4 });
        if (!cine) continue;
        g2.clearRect(0, 0, res, res);
        g2.drawImage(canvas, 0, 0, res, res);
        const px = g2.getImageData(0, 0, res, res).data;
        const grey = new Uint8Array(res * res);
        for (let i = 0; i < grey.length; i++) grey[i] = px[i * 4];
        frames.push(grey);
        if (k % 6 === 0) await new Promise((ok) => setTimeout(ok, 0));
      }
      out.push({
        id: `prev-${c.id}-${ri + 1}`,
        number: ri + 1,
        kind: "cine",
        caseId: c.id,
        startedAt: 0,
        fps: PREV_FPS,
        w: res,
        h: res,
        frames,
        cArm: run.cArm,
        cArmEnd: run.cArm,
        fieldCm: 20,
        mmPerPxIso: 200 / res,
        durationS: frames.length / PREV_FPS,
        karMGy: 0,
        kapGyCm2: 0,
        contrastMl: 0,
        injected: true,
        catheterId,
      });
    }
  } finally {
    xr.dispose();
    xr.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
  return out;
}

const viewName = (cArm: { laoRao: number; cranialCaudal: number }) => {
  const h = cArm.laoRao === 0 ? "AP" : `${cArm.laoRao > 0 ? "LAO" : "RAO"} ${Math.abs(cArm.laoRao)}`;
  const v = cArm.cranialCaudal === 0 ? "" : ` ${cArm.cranialCaudal > 0 ? "cranial" : "caudal"} ${Math.abs(cArm.cranialCaudal)}`;
  return h + v;
};

/** Plays the previous study's runs (grey frames) on a small canvas, one run at a time. */
export function PreviousStudyViewer({ study }: { study: PreviousStudy }) {
  const [sel, setSel] = useState(0);
  const ref = useRef<HTMLCanvasElement>(null);
  const run = study.series[sel];
  useEffect(() => {
    const cv = ref.current;
    if (!cv || !run || !run.frames.length) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(run.w, run.h);
    let f = 0;
    const draw = () => {
      const fr = run.frames[f % run.frames.length];
      for (let i = 0; i < fr.length; i++) {
        const v = fr[i];
        img.data[i * 4] = v;
        img.data[i * 4 + 1] = v;
        img.data[i * 4 + 2] = v;
        img.data[i * 4 + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      f++;
    };
    draw();
    const id = setInterval(draw, 1000 / run.fps);
    return () => clearInterval(id);
  }, [run]);
  return (
    <section className="rounded-md border border-line bg-base-800 p-2.5" aria-label={study.label} data-previous-study>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[13px] font-medium text-ink">{study.label}</h3>
        {study.status === "ready" && (
          <div className="seg">
            {study.series.map((s, i) => (
              <button key={s.id} type="button" className={`seg-btn !py-0.5 ${i === sel ? "seg-btn-active" : ""}`} aria-pressed={i === sel} onClick={() => setSel(i)}>
                {s.number}: {viewName(s.cArm)}
              </button>
            ))}
          </div>
        )}
      </div>
      {study.status === "rendering" && <p className="text-[12px] text-ink-faint">Loading the previous study.</p>}
      {study.status === "failed" && <p className="text-[12px] text-ink-faint">The previous study could not be shown: {study.error}</p>}
      {study.status === "ready" && run && <canvas ref={ref} width={run.w} height={run.h} className="mx-auto block aspect-square w-full max-w-[320px] rounded bg-black" />}
    </section>
  );
}

/** The previous study of this case from the store, rendering it on first use (browser only). */
export function usePreviousStudy(c: AnatomyCase, spec: PreviousStudySpec | undefined): PreviousStudy | null {
  const study = useSeries((s) => previousStudyFor(s, c.id));
  useEffect(() => {
    // a case without a previous study (or another case) releases the last one's frames
    if (!spec) releasePreviousStudyUnless(c.id);
    else if (typeof document !== "undefined") void renderPreviousStudy(c, spec);
  }, [c, spec]);
  return spec ? study : null;
}

/** Sample rate of the drawn strips (for tests). */
export const ECG_PREBRIEF_HZ = STRIP_HZ;
