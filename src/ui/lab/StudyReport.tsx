// ---------------------------------------------------------------------------
// The finish step's study report (diag-study-report). Opened from 'Finish
// study', it covers the live monitor so that the reference monitor (the stored
// runs and the learner's own QCA) and, in guided practice, the attending's
// drawer with the finish-phase tips stay in view. The learner:
//   - accounts for every LV wall: the artery and the injection that showed it,
//     a graft of the operation note, or 'none seen';
//   - states per vessel and graft the patency, the worst stenosis (by eye or
//     own QCA), its segment, the run it shows best on, and whether it was
//     spasm that resolved with nitrate; the grafts of the operation note have
//     a table of their own (diag-grafts-svg), one row per graft;
//   - declares the runs that were non-diagnostic; grades the LV and valves
//     when they were assessed; classifies the MI when the patient presented
//     with one;
//   - decides between no PCI, ad hoc PCI, the heart team and a staged
//     procedure, with Brilakis's reasons to defer, and names the PCI target
//     (vessel, segment, own QCA, length) for ad hoc or staged PCI.
// The component is controlled (the lab shell keeps the draft, raises the
// finish events from it and builds the truth on submission). Nothing in it
// comes from the case truth: every answer starts empty, and the grafts are
// listed as the operation note names them, without their status.
//
// An ACS case (diag-acs-scenarios, ACS_CASES in src/simulation/
// diagnosticScenarios/acs.ts) adds two sections whose answers go to the ACS
// answers store (src/ui/lab/EcgPrebrief.tsx useAcsStore), not to the report:
//   - a culprit study names the culprit and at least two clues, or says none
//     is visible and puts the next steps in order; its previous study plays
//     beside it;
//   - the iatrogenic-occlusion case asks what the ECG did during the study and
//     the first measures if it changed (worded for every outcome, so the
//     question does not name the complication).
// Submission waits for them as it waits for the rest of the report.
// ---------------------------------------------------------------------------

import type { VesselId } from "../../types";
import { SEGMENT_NAMES, segmentName } from "../../mentor/coverage";
import {
  ARTERIES,
  DEFERRAL_REASONS,
  LV_GRADES,
  LV_WALLS,
  LV_WALL_LABEL,
  MI_CLASSES,
  MI_CLASS_LABEL,
  STUDY_DECISIONS,
  STUDY_DECISION_LABEL,
  TARGET_VESSELS,
  VALVE_GRADES,
  findingLabel,
  studyReportGaps,
  studyReportProblems,
  targetSegmentsFor,
  type Artery,
  type DeferralReason,
  type FindingVessel,
  type LvWall,
  type Patency,
  type ReportComparison,
  type StudyReport as Report,
  type TargetChoice,
  type VesselFinding,
  type WallSupply,
} from "../../mentor/report";
import type { AngioCadSegment } from "../../simulation/patient/angiocadPriors";
import { completeGap, type DebriefModel } from "../../mentor/debrief";
import type { ProcedureRecord } from "../../mentor/telemetry";
import { useSim } from "./useLab";
import {
  CULPRIT_CLUES,
  CULPRIT_CLUE_LABEL,
  CULPRIT_VESSELS,
  IATROGENIC_ACTIONS,
  IATROGENIC_ACTION_LABEL,
  NO_CULPRIT_STEPS,
  NO_CULPRIT_STEP_LABEL,
  acsCaseFor,
  type AcsCase,
  type CulpritClue,
  type IatrogenicAction,
  type NoCulpritStep,
} from "../../simulation/diagnosticScenarios/acs";
import { culpritProblems, iatrogenicProblems, type CulpritAnswer } from "../../mentor/rules/diagAcs";
import { PreviousStudyViewer, useAcsAnswers, useAcsStore, usePreviousStudy } from "./EcgPrebrief";

export interface StudyReportRun {
  /** series number on the reference monitor */
  number: number;
  /** how the reference monitor names it (number and view) */
  label: string;
}

export interface StudyReportProps {
  value: Report;
  onChange: (r: Report) => void;
  /** the grafts of the operation note (id and label only) */
  grafts: readonly { id: string; label: string }[];
  /** the patient presented with an acute coronary syndrome: the MI classification is asked */
  miAsked: boolean;
  /** the stored cine runs of this case */
  runs: readonly StudyReportRun[];
  onBack: () => void;
  onSubmit: () => void;
  /** The case's ACS front end. Absent: the current case is looked up in ACS_CASES by its scenario id; null: none. */
  acs?: AcsCase | null;
}

const SIDES = ["left", "right"] as const;

const CULPRIT_LABEL: Record<(typeof CULPRIT_VESSELS)[number], string> = { LM: "Left main", LAD: "LAD", LCx: "Circumflex", RCA: "RCA", "none-visible": "No culprit visible" };

/** What the ACS sections of the report still need (empty: complete). Reads the answers only. */
export function acsReportProblems(acs: AcsCase | undefined, culprit: CulpritAnswer | undefined, iatrogenic: readonly IatrogenicAction[] | undefined): string[] {
  if (!acs) return [];
  return [...(acs.culprit ? culpritProblems(culprit) : []), ...(acs.iatrogenic ? iatrogenicProblems(iatrogenic) : [])];
}

/** The debrief check's id (src/mentor/debriefChecks/report.ts), carried by the gaps added here. */
const CHECK_ID = "study-report";

/** completeGap reads only the record's snapshots, for a rewind point; a report gap has none (it is about the report, not a moment). */
const NO_SNAPSHOTS = { snapshots: [] } as unknown as ProcedureRecord;

/**
 * The debrief with the submitted study report: its comparison as the debrief's report, and the
 * report's gaps ranked with the debrief's own (the top three, as buildDebrief keeps). For a debrief
 * built without the report (the attending assesses the record as soon as the case finishes); a
 * debrief that already has it is returned as it is.
 */
export function withStudyReport(model: DebriefModel, cmp: ReportComparison | undefined): DebriefModel {
  if (!cmp?.study || model.report?.study) return model;
  const ids = new Set(model.analysis.gaps.map((g) => g.id));
  const added = studyReportGaps(cmp)
    .filter((g) => !ids.has(g.id))
    .map((g) => completeGap(g, NO_SNAPSHOTS, CHECK_ID));
  const gaps = [...model.analysis.gaps, ...added].sort((a, b) => b.priority - a.priority || a.tWall - b.tWall).slice(0, 3);
  const takeHome = [...model.summary.takeHomeOptions];
  for (const g of gaps) if (g.takeHome && !takeHome.includes(g.takeHome)) takeHome.unshift(g.takeHome);
  return { ...model, report: cmp, analysis: { gaps }, summary: { ...model.summary, takeHomeOptions: takeHome } };
}

/** SYNTAX segments offered per finding row (src/mentor/coverage.ts SEGMENT_NAMES). */
const ROW_SEGMENTS: Record<"LM" | Artery, string[]> = {
  LM: ["5"],
  LAD: ["6", "7", "8", "9", "9a", "10", "10a"],
  LCx: ["11", "12", "12a", "12b", "13", "14", "14a", "14b", "15"],
  RCA: ["1", "2", "3", "4", "16", "16a", "16b", "16c"],
};

const PATENCY: { id: Patency; label: string }[] = [
  { id: "patent", label: "Patent" },
  { id: "occluded", label: "Occluded" },
  { id: "not-seen", label: "Not seen" },
];

const LV_LABEL: Record<(typeof LV_GRADES)[number], string> = { "not-assessed": "Not assessed", normal: "Normal", mild: "Mildly impaired", moderate: "Moderately impaired", severe: "Severely impaired" };
const VALVE_LABEL: Record<(typeof VALVE_GRADES)[number], string> = { "not-assessed": "Not assessed", normal: "Normal", abnormal: "Abnormal" };

/** A wall supply as a select value. */
export function supplyKey(s: WallSupply | undefined): string {
  if (!s) return "";
  if (s.kind === "none") return "none";
  if (s.kind === "graft") return `graft:${s.graftId}`;
  return `native:${s.artery}:${s.injection}`;
}

/** A select value back to a wall supply (undefined for the empty option). */
export function supplyOf(key: string): WallSupply | undefined {
  if (!key) return undefined;
  if (key === "none") return { kind: "none" };
  if (key.startsWith("graft:")) return { kind: "graft", graftId: key.slice(6) };
  const [, artery, injection] = key.split(":");
  return { kind: "native", artery: artery as Artery, injection: injection as "left" | "right" };
}

const num = (v: string): number | null => {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function Section({ title, children, hint }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line px-4 py-3 [@container(max-width:359px)]:px-2.5">
      <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
      {hint && <p className="mt-0.5 text-[12px] text-ink-faint">{hint}</p>}
      <div className="mt-2">{children}</div>
    </section>
  );
}

export default function StudyReport({ value: r, onChange, grafts, miAsked, runs, onBack, onSubmit, acs: acsProp }: StudyReportProps) {
  const caseData = useSim((s) => s.caseData);
  const acs = acsProp === undefined ? acsCaseFor(caseData.scenarioId) : acsProp ?? undefined;
  const acsAnswers = useAcsAnswers(caseData.id);
  const updateAcs = useAcsStore.getState().update;
  const previous = usePreviousStudy(caseData, acs?.previousStudy);
  const culprit: CulpritAnswer = acsAnswers.culprit ?? { clues: [], workUp: [] };
  // changes merge into the store's current answers, not this render's snapshot (two clicks in one tick both land)
  const setCulprit = (f: (cur: CulpritAnswer) => Partial<CulpritAnswer>) =>
    updateAcs(caseData.id, (a) => {
      const cur = a.culprit ?? { clues: [], workUp: [] };
      return { culprit: { ...cur, ...f(cur) } };
    });
  const iatro = acsAnswers.iatrogenic ?? [];
  const toggleIatro = (x: IatrogenicAction) =>
    updateAcs(caseData.id, (a) => {
      const cur = a.iatrogenic ?? [];
      return { iatrogenic: x === "no-change-seen" ? (cur.includes(x) ? [] : [x]) : cur.includes(x) ? cur.filter((y) => y !== x) : [...cur.filter((y) => y !== "no-change-seen"), x] };
    });
  const set = (p: Partial<Report>) => onChange({ ...r, ...p });
  const graftName = (id: string) => grafts.find((g) => g.id === id)?.label ?? id;
  const setWall = (w: LvWall, key: string) => {
    const territories = { ...r.territories };
    const s = supplyOf(key);
    if (s) territories[w] = s;
    else delete territories[w];
    set({ territories });
  };
  const setFinding = (vessel: FindingVessel, p: Partial<VesselFinding>) => set({ findings: r.findings.map((f) => (f.vessel === vessel ? { ...f, ...p } : f)) });
  const toggle = <T,>(list: readonly T[], x: T): T[] => (list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);
  const wantsTarget = r.decision === "adhoc" || r.decision === "staged" || r.decision === "heart-team";
  const setTarget = (p: Partial<TargetChoice> | null) => {
    if (p === null) return set({ target: null });
    const cur: TargetChoice = r.target ?? { vessel: "LAD", segment: null, qcaPct: null, lengthMm: null };
    const next = { ...cur, ...p };
    if (p.vessel && p.vessel !== cur.vessel) next.segment = null;
    set({ target: next });
  };
  const problems = [...studyReportProblems(r, { miAsked }), ...acsReportProblems(acs, acsAnswers.culprit, acsAnswers.iatrogenic)];
  const clueList = CULPRIT_CLUES.filter((c) => c !== "previous-study" || !!acs?.previousStudy);

  return (
    // the report follows the width of the monitor it covers (a container query, not the window): in a
    // narrow monitor the walls stack under their labels and the header keeps to its title
    <div className="flex h-full w-full flex-col overflow-y-auto bg-base-900 [container-type:inline-size]" data-study-report role="dialog" aria-label="Study report">
      <div className="panel-head shrink-0">
        <span>Study report</span>
        <span className="text-[12px] font-normal text-ink-faint [@container(max-width:419px)]:hidden">Your report is compared with the case in the debrief</span>
      </div>
      <div className="min-h-[16rem] flex-1 overflow-y-auto" data-report-body>
        <Section title="Territories" hint="Assign each wall to the artery that supplies it (open, occluded or filled by collaterals) and the injection that showed it, a graft, or none seen.">
          <div className="grid grid-cols-1 gap-x-3 gap-y-1.5 [@container(min-width:440px)]:grid-cols-[180px_minmax(0,1fr)]">
            {LV_WALLS.map((w) => (
              <label key={w} className="contents">
                <span className="self-center text-[13px] text-ink-soft">{LV_WALL_LABEL[w]}</span>
                <select className="field h-8 w-full min-w-0 text-[13px]" data-wall={w} aria-label={`${LV_WALL_LABEL[w]} wall: supplying vessel`} value={supplyKey(r.territories[w])} onChange={(e) => setWall(w, e.target.value)}>
                  <option value="">Choose</option>
                  {ARTERIES.flatMap((a) =>
                    SIDES.map((side) => (
                      <option key={`${a}:${side}`} value={`native:${a}:${side}`}>
                        {a} from the {side} injection
                      </option>
                    ))
                  )}
                  {grafts.map((g) => (
                    <option key={g.id} value={`graft:${g.id}`}>
                      {g.label}
                    </option>
                  ))}
                  <option value="none">None seen</option>
                </select>
              </label>
            ))}
          </div>
        </Section>

        <Section title="Dominance">
          <div className="seg">
            {(["right", "left", "codominant"] as const).map((d) => (
              <button key={d} type="button" className={`seg-btn ${r.dominance === d ? "seg-btn-active" : ""}`} aria-pressed={r.dominance === d} onClick={() => set({ dominance: d })}>
                {d === "codominant" ? "Codominant" : d === "right" ? "Right" : "Left"}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Findings" hint="Worst stenosis by eye or by your own QCA on the reference monitor. Tick spasm when the narrowing resolved with intracoronary nitrate.">
          <div className="space-y-2">
            {r.findings.filter((f) => !f.vessel.startsWith("graft:")).map((f) => {
              const segs = ROW_SEGMENTS[f.vessel as "LM" | Artery];
              return (
                <div key={f.vessel} className="rounded-lg border border-line bg-base-800 p-2.5" data-finding={f.vessel}>
                  <div className="mb-1.5 text-[13px] font-medium text-ink">{findingLabel(f.vessel, graftName)}</div>
                  <div className="flex flex-wrap items-center gap-2 text-[13px]">
                    <select className="field h-8 text-[13px]" aria-label="Patency" value={f.patency ?? ""} onChange={(e) => setFinding(f.vessel, { patency: (e.target.value || undefined) as Patency | undefined })}>
                      <option value="">Patency</option>
                      {PATENCY.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1.5 text-ink-soft">
                      Worst
                      <input
                        className="field metric h-8 w-16 text-[13px]"
                        type="number"
                        min={0}
                        max={100}
                        inputMode="numeric"
                        aria-label="Worst stenosis, percent"
                        value={f.worstPct ?? ""}
                        onChange={(e) => setFinding(f.vessel, { worstPct: num(e.target.value) })}
                      />
                      %
                    </label>
                    <div className="seg">
                      {(["visual", "qca"] as const).map((m) => (
                        <button key={m} type="button" className={`seg-btn !py-0.5 ${f.method === m ? "seg-btn-active" : ""}`} aria-pressed={f.method === m} onClick={() => setFinding(f.vessel, { method: m })}>
                          {m === "qca" ? "QCA" : "By eye"}
                        </button>
                      ))}
                    </div>
                    <select className="field h-8 text-[13px]" aria-label="Segment" value={f.segment ?? ""} onChange={(e) => setFinding(f.vessel, { segment: e.target.value || null })}>
                      <option value="">Segment</option>
                      {segs.map((s) => (
                        <option key={s} value={s}>
                          {s} {SEGMENT_NAMES[s] ? segmentName(s) : ""}
                        </option>
                      ))}
                    </select>
                    <select className="field h-8 text-[13px]" aria-label="Best run" value={f.run ?? ""} onChange={(e) => setFinding(f.vessel, { run: num(e.target.value) })} disabled={!runs.length}>
                      <option value="">{runs.length ? "Best run" : "No runs stored"}</option>
                      {runs.map((x) => (
                        <option key={x.number} value={x.number}>
                          {x.label}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1.5 text-ink-soft">
                      <input type="checkbox" checked={f.spasm} onChange={(e) => setFinding(f.vessel, { spasm: e.target.checked })} />
                      Spasm, resolved with nitrate
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {r.findings.some((f) => f.vessel.startsWith("graft:")) && (
          <Section title="Grafts" hint="One row per graft of the operation note: patent or occluded (a stump, or not found on the aortogram), the worst stenosis in the graft or at its anastomosis, and the run that shows it best.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-[13px]" data-graft-table>
                <thead>
                  <tr className="text-left text-[12px] text-ink-faint">
                    <th className="py-1 pr-2 font-normal">Graft</th>
                    <th className="py-1 pr-2 font-normal">Patency</th>
                    <th className="py-1 pr-2 font-normal">Worst</th>
                    <th className="py-1 pr-2 font-normal">Method</th>
                    <th className="py-1 font-normal">Best run</th>
                  </tr>
                </thead>
                <tbody>
                  {r.findings
                    .filter((f) => f.vessel.startsWith("graft:"))
                    .map((f) => (
                      <tr key={f.vessel} className="border-t border-line align-middle" data-finding={f.vessel}>
                        <td className="py-1.5 pr-2 text-ink">{findingLabel(f.vessel, graftName)}</td>
                        <td className="py-1.5 pr-2">
                          <select className="field h-8 text-[13px]" aria-label={`${findingLabel(f.vessel, graftName)}: patency`} value={f.patency ?? ""} onChange={(e) => setFinding(f.vessel, { patency: (e.target.value || undefined) as Patency | undefined })}>
                            <option value="">Patency</option>
                            {PATENCY.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1.5 pr-2">
                          <span className="flex items-center gap-1 text-ink-soft">
                            <input
                              className="field metric h-8 w-16 text-[13px]"
                              type="number"
                              min={0}
                              max={100}
                              inputMode="numeric"
                              aria-label={`${findingLabel(f.vessel, graftName)}: worst stenosis, percent`}
                              value={f.worstPct ?? ""}
                              onChange={(e) => setFinding(f.vessel, { worstPct: num(e.target.value) })}
                            />
                            %
                          </span>
                        </td>
                        <td className="py-1.5 pr-2">
                          <div className="seg">
                            {(["visual", "qca"] as const).map((m) => (
                              <button key={m} type="button" className={`seg-btn !py-0.5 ${f.method === m ? "seg-btn-active" : ""}`} aria-pressed={f.method === m} onClick={() => setFinding(f.vessel, { method: m })}>
                                {m === "qca" ? "QCA" : "By eye"}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="py-1.5">
                          <select className="field h-8 text-[13px]" aria-label={`${findingLabel(f.vessel, graftName)}: best run`} value={f.run ?? ""} onChange={(e) => setFinding(f.vessel, { run: num(e.target.value) })} disabled={!runs.length}>
                            <option value="">{runs.length ? "Best run" : "No runs stored"}</option>
                            {runs.map((x) => (
                              <option key={x.number} value={x.number}>
                                {x.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        <Section title="Non-diagnostic runs" hint="Runs you would not interpret: incomplete filling, overlap or motion.">
          {runs.length ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
              {runs.map((x) => (
                <label key={x.number} className="flex items-center gap-1.5 text-ink-soft">
                  <input type="checkbox" checked={r.nonDiagnosticRuns.includes(x.number)} onChange={() => set({ nonDiagnosticRuns: toggle(r.nonDiagnosticRuns, x.number) })} />
                  {x.label}
                </label>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-ink-faint">No runs stored.</p>
          )}
        </Section>

        <Section title="Left ventricle and valves">
          <div className="flex flex-wrap gap-3 text-[13px]">
            <label className="flex items-center gap-2 text-ink-soft">
              LV function
              <select className="field h-8 text-[13px]" value={r.lv} onChange={(e) => set({ lv: e.target.value as Report["lv"] })}>
                {LV_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {LV_LABEL[g]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-ink-soft">
              Valves
              <select className="field h-8 text-[13px]" value={r.valves} onChange={(e) => set({ valves: e.target.value as Report["valves"] })}>
                {VALVE_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {VALVE_LABEL[g]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Section>

        {acs?.culprit && (
          <Section title="Culprit" hint="Name the culprit and the clues that support it, weighing them together. If you cannot see one, say so and put the next steps in order.">
            <div className="space-y-3" data-culprit-section>
              {previous && <PreviousStudyViewer study={previous} />}
              <div className="seg flex-wrap">
                {CULPRIT_VESSELS.map((v) => (
                  <button key={v} type="button" data-culprit={v} className={`seg-btn ${culprit.vessel === v ? "seg-btn-active" : ""}`} aria-pressed={culprit.vessel === v} onClick={() => setCulprit(() => ({ vessel: v }))}>
                    {CULPRIT_LABEL[v]}
                  </button>
                ))}
              </div>
              {culprit.vessel && culprit.vessel !== "none-visible" && (
                <div className="grid grid-cols-1 gap-1 [@container(min-width:560px)]:grid-cols-2">
                  {clueList.map((c: CulpritClue) => (
                    <label key={c} className="flex items-center gap-2 text-[13px] text-ink-soft">
                      <input type="checkbox" checked={culprit.clues.includes(c)} onChange={() => setCulprit((cur) => ({ clues: toggle(cur.clues, c) }))} />
                      {CULPRIT_CLUE_LABEL[c]}
                    </label>
                  ))}
                </div>
              )}
              {culprit.vessel === "none-visible" && (
                <div className="space-y-1.5" data-work-up>
                  <div className="text-[12px] text-ink-faint">Choose the next steps in the order you would do them.</div>
                  <div className="flex flex-wrap gap-1.5">
                    {NO_CULPRIT_STEPS.filter((x) => !culprit.workUp.includes(x)).map((x: NoCulpritStep) => (
                      <button key={x} type="button" className="btn h-8 text-[13px]" onClick={() => setCulprit((cur) => (cur.workUp.includes(x) ? {} : { workUp: [...cur.workUp, x] }))}>
                        {NO_CULPRIT_STEP_LABEL[x]}
                      </button>
                    ))}
                  </div>
                  {culprit.workUp.length > 0 && (
                    <ol className="list-decimal space-y-0.5 pl-5 text-[13px] text-ink">
                      {culprit.workUp.map((x) => (
                        <li key={x}>{NO_CULPRIT_STEP_LABEL[x]}</li>
                      ))}
                    </ol>
                  )}
                  {culprit.workUp.length > 0 && (
                    <button type="button" className="btn btn-ghost h-7 text-[12px]" onClick={() => setCulprit(() => ({ workUp: [] }))}>
                      Start the order again
                    </button>
                  )}
                </div>
              )}
            </div>
          </Section>
        )}

        {acs?.iatrogenic && (
          <Section title="The ECG during the study" hint="Say whether the ECG changed while you worked and, if it did, the first measures you took or would take.">
            <div className="grid grid-cols-1 gap-1 [@container(min-width:560px)]:grid-cols-2" data-iatrogenic-section>
              {IATROGENIC_ACTIONS.map((x) => (
                <label key={x} className="flex items-center gap-2 text-[13px] text-ink-soft">
                  <input type="checkbox" checked={iatro.includes(x)} onChange={() => toggleIatro(x)} />
                  {IATROGENIC_ACTION_LABEL[x]}
                </label>
              ))}
            </div>
          </Section>
        )}

        {miAsked && (
          <Section title="Myocardial infarction" hint="Classify it by the fifth universal definition from what the angiogram showed.">
            <div className="space-y-1 text-[13px]">
              {MI_CLASSES.map((m) => (
                <label key={m} className="flex items-center gap-2 text-ink-soft">
                  <input type="radio" name="mi-class" checked={r.mi === m} onChange={() => set({ mi: m })} />
                  {MI_CLASS_LABEL[m]}
                </label>
              ))}
            </div>
          </Section>
        )}

        <Section title="Decision">
          <div className="seg flex-wrap">
            {STUDY_DECISIONS.map((d) => (
              <button
                key={d}
                type="button"
                data-decision={d}
                className={`seg-btn ${r.decision === d ? "seg-btn-active" : ""}`}
                aria-pressed={r.decision === d}
                onClick={() => set({ decision: d, target: d === "no-pci" ? null : r.target })}
              >
                {STUDY_DECISION_LABEL[d]}
              </button>
            ))}
          </div>
          <div className="mt-3 text-[12px] text-ink-faint">Reasons to defer that apply (Brilakis 7.3)</div>
          <div className="mt-1 grid grid-cols-1 gap-1 [@container(min-width:560px)]:grid-cols-2">
            {DEFERRAL_REASONS.map((x) => (
              <label key={x.id} className="flex items-start gap-2 text-[13px] text-ink-soft" title={x.detail}>
                <input className="mt-1" type="checkbox" checked={r.reasons.includes(x.id)} onChange={() => set({ reasons: toggle<DeferralReason>(r.reasons, x.id) })} />
                <span>
                  <span className="text-ink">{x.title}</span>: {x.detail}
                </span>
              </label>
            ))}
          </div>
          {wantsTarget && (
            <div className="mt-3 rounded-lg border border-line bg-base-800 p-2.5" data-target-form>
              <div className="mb-1.5 text-[13px] font-medium text-ink">PCI target{r.decision === "heart-team" ? " (optional)" : ""}</div>
              <div className="flex flex-wrap items-center gap-2 text-[13px]">
                <select className="field h-8 text-[13px]" aria-label="Target vessel" value={r.target?.vessel ?? ""} onChange={(e) => setTarget(e.target.value ? { vessel: e.target.value as VesselId } : null)}>
                  <option value="">Vessel</option>
                  {TARGET_VESSELS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <select
                  className="field h-8 text-[13px]"
                  aria-label="Target segment"
                  disabled={!r.target}
                  value={r.target?.segment ?? ""}
                  onChange={(e) => setTarget({ segment: (e.target.value || null) as AngioCadSegment | null })}
                >
                  <option value="">Segment</option>
                  {(r.target ? targetSegmentsFor(r.target.vessel) : []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 text-ink-soft">
                  Your QCA
                  <input className="field metric h-8 w-16 text-[13px]" type="number" min={0} max={100} disabled={!r.target} value={r.target?.qcaPct ?? ""} onChange={(e) => setTarget({ qcaPct: num(e.target.value) })} />%
                </label>
                <label className="flex items-center gap-1.5 text-ink-soft">
                  Length
                  <input className="field metric h-8 w-16 text-[13px]" type="number" min={0} disabled={!r.target} value={r.target?.lengthMm ?? ""} onChange={(e) => setTarget({ lengthMm: num(e.target.value) })} />
                  mm
                </label>
              </div>
            </div>
          )}
        </Section>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-line px-4 py-2.5 [@container(max-width:359px)]:px-2.5">
        {problems.length > 0 ? (
          <span className="flex-1 text-[12px] text-ink-faint" data-problems>
            {problems[0]}
            {problems.length > 1 ? ` (and ${problems.length - 1} more)` : ""}
          </span>
        ) : (
          <span className="flex-1 text-[12px] text-ink-faint">Ready to submit</span>
        )}
        <button type="button" className="btn h-8" onClick={onBack}>
          Back to the study
        </button>
        <button type="button" className="btn btn-accent h-8" disabled={problems.length > 0} onClick={onSubmit}>
          Submit report and finish
        </button>
      </div>
    </div>
  );
}
