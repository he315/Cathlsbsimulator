// Real angiograms: an attributed library of de-identified cine runs from openly
// licensed research datasets, patient cases, and reading drills scored against
// the datasets' expert labels.
//
// Drills are stratified (equal numbers per reference class), so guessing the
// commonest answer scores chance balanced accuracy and kappa 0. Every answer
// carries a stated confidence (Brier score, calibration table), wrong reads
// return through spaced repetition keyed by run id (a store of their own, see
// library.ts angio SRS), and per-item results are
// kept in this browser for learning curves. The pure logic lives in
// ../angio/library.ts and is unit-tested in src/content/content.test.ts.
// Expert-label drills (TIMI, frame count, morphology, collaterals, Medina, calcium, lesion class,
// SYNTAX segments) are scored against a supervising reader's labels served with the library
// (../angio/labels.ts) and open once enough runs are labelled; until then TIMI and frame count
// run on simulated runs whose flow the engine knows (../angio/simFlowDrill.ts). Reader mode
// (Settings) labels runs in the Library tab. The revascularisation decision drills (angio-decision-drills) run on
// real AngioCAD studies with only the dataset's fields: the plan drill's 'missing-facts' part and the SYNTAX
// lesion-marking drill (../angio/syntax.ts), neither of which generates a clinical value for a real patient.
import { useEffect, useMemo, useRef, useState } from "react";
import { useProgressStore } from "../../state/useProgressStore";
import { todayStr } from "../../utils/storage";
import SectionShell from "../SectionShell";
import CinePlayer, { type CineMark, type CineRun } from "../angio/CinePlayer";
import { TipCard } from "../content/BlockRenderer";
import { TIP_BY_ID, tipsFor, type LabTip } from "../../content/lab/tips";
import {
  CALCIUM_OPTIONS,
  LABEL_DRILLS,
  LABEL_DRILL_IDS,
  NHLBI_OPTIONS,
  SYNTAX_SEGMENTS,
  THROMBUS_OPTIONS,
  accAhaType,
  correctedFrameCount,
  drillGate,
  flowDrillTarget,
  frameCountNormals,
  isLabelDrillId,
  labelOccluded,
  labelRevealTips,
  labelSet,
  loadLabels,
  mergeLabels,
  revealTips,
  scaiClass,
  scoreLabelItem,
  segmentsFor,
  typeBFeatures,
  typeCFeatures,
  useReaderStore,
  ACC_AHA_TYPES,
  SCAI_CLASSES,
  type AccAhaFeatures,
  type ExpertLabel,
  type LabelAnswer,
  type LabelDrillId,
  type LabelItem,
  type LabelScore,
} from "../angio/labels";
import {
  SIM_FRAME_TOLERANCE,
  TIMI_GRADES,
  TIMI_LABEL,
  describeTruth,
  renderSimFlowRun,
  scoreSimFlow,
  simFlowSet,
  simFlowTipContext,
  type SimFlowItem,
  type SimFlowScore,
  type TimiGrade,
} from "../angio/simFlowDrill";
import RealOrSimDrill from "../angio/RealOrSimDrill";
import { heldOutPatient, READING_EXAM, READING_LADDERS, readingExamId } from "../../content/mentor/catalogue";
import { examSet, seenKey, setsLeft } from "../../progress/readingExam";
import { EPA_BY_ID, LEVEL_LABEL } from "../../progress/competency";
import {
  DRILL_LABEL,
  GRADES,
  GRADE_BINS,
  GRADE_LABEL,
  PATIENT_DEGREE_CLASSES,
  SEN2018_KAPPA,
  SEN2018_QCA,
  angleName,
  angioDueKeys,
  applyDrillParams,
  calibrationBins,
  chanceLevel,
  constantBaseline,
  describeDrillParams,
  itemFor,
  itemForKey,
  matchedPairs,
  migrateAngioMemory,
  recordAngioRead,
  loadAngioMemory,
  loadResults,
  makeSet,
  normaliseDegree,
  percentBin,
  planningStudies,
  registeredAngioDrills,
  revascStudies,
  revascSet,
  angioCadFields,
  angioCadExtent,
  scoreMissingFacts,
  saveResults,
  scoreChoice,
  scoreEstimate,
  scoreLocate,
  srsKey,
  standardView,
  summarise,
  peekRequestedDrill,
  clearRequestedDrill,
  registerAngioDrill,
  cohenKappa,
  brier,
  useLibrary,
  type DrillAnswer,
  type DrillContext,
  type DrillItem,
  type DrillKind,
  type DrillResult,
  type ExtraDrillProps,
  type Kappa,
  type LibDataset,
  type LibPatient,
  type LibRun,
  type SetSummary,
} from "../angio/library";
import {
  ANATOMY_LABEL,
  ANGIOCAD_SEGMENTS,
  SYNTAX_FEATURES,
  SYNTAX_TOTAL_STATUS,
  THRESHOLD_SET_LABEL,
  angioCadAnatomies,
  compareLesionSets,
  segmentVessel,
  thresholdSetFor,
  type SyntaxFeature,
  type ThresholdSet,
} from "../angio/syntax";
import { STABLE_FACTS, revascRevealTips } from "../../content/decisions/revascStable";

/**
 * The decision reveal's tips on a real study, computed once per extent (two values) rather than running
 * tipsFor over the registry on every render. diag-stop-for-heart-team is left out when the study's grades show
 * single-vessel or no disease.
 */
const REVEAL_TIPS_BY_EXTENT = new Map<boolean, LabTip[]>();
function stableRevealTips(multivessel: boolean): LabTip[] {
  let t = REVEAL_TIPS_BY_EXTENT.get(multivessel);
  if (!t) REVEAL_TIPS_BY_EXTENT.set(multivessel, (t = revascRevealTips({ tipsFor, byId: TIP_BY_ID }, { multivessel })));
  return t;
}

type Tab = "library" | "cases" | "drills" | "progress" | "realsim" | "exam";

const TAB_LABEL: Record<Tab, string> = {
  drills: "Reading drills",
  progress: "Progress",
  realsim: "Real or simulated?",
  exam: "Exam",
  cases: "Patient cases",
  library: "Library",
};

export default function RealAngiograms() {
  const { data: rawData, loading } = useLibrary();
  // Expert labels (angio-expert-label-drills): the library's labels.json files, and Reader mode's labels in this
  // browser for display only (labels.ts refuses them for scored drills).
  const [libLabels, setLibLabels] = useState<Awaited<ReturnType<typeof loadLabels>>>([]);
  useEffect(() => {
    let alive = true;
    loadLabels().then((l) => alive && setLibLabels(l));
    return () => {
      alive = false;
    };
  }, []);
  const readerLabels = useReaderStore((s) => s.labels);
  const data = useMemo(
    () =>
      rawData
        ? mergeLabels(rawData, [
            ...libLabels.map((l) => ({ dataset: l.dataset, labels: l.labels, source: "library" as const, file: l.file })),
            { labels: readerLabels, source: "local" as const, file: "this browser" },
          ]).data
        : rawData,
    [rawData, libLabels, readerLabels]
  );
  const requested = useMemo(() => peekRequestedDrill(), []);
  useEffect(() => clearRequestedDrill(), []);
  const [tab, setTab] = useState<Tab>(requested?.drill === "exam" ? "exam" : "drills");
  // Without the library, the TIMI and frame-count links still open the simulated-run drill.
  const [simOnly, setSimOnly] = useState(requested?.drill === "timi" || requested?.drill === "frame-count");
  // About one patient in five is held out for reading exams (catalogue.heldOutPatient):
  // practice drills, the library browser and the patient cases never show them.
  const practiceData = useMemo(
    () => (data ?? []).map((d) => ({ ...d, patients: d.patients.filter((p) => !heldOutPatient(p.dataset, p.id)) })),
    [data]
  );
  const examPatients = useMemo(() => (data ?? []).flatMap((d) => d.patients.filter((p) => heldOutPatient(p.dataset, p.id))), [data]);
  const runs = useMemo(() => practiceData.flatMap((d) => d.patients.flatMap((p) => p.runs)), [practiceData]);
  const patients = useMemo(() => practiceData.flatMap((d) => d.patients), [practiceData]);

  return (
    <SectionShell
      title="Real angiograms"
      subtitle={
        data
          ? `${runs.length} de-identified cine runs from ${patients.length} patients for practice, ${examPatients.length} more patients held out for exams · ${data.map((d) => d.dataset).join(", ")} · openly licensed research datasets`
          : "Loading the library…"
      }
      actions={
        <div className="seg">
          {(["drills", "progress", "realsim", "exam", "cases", "library"] as Tab[]).map((t) => (
            <button key={t} className={`seg-btn !px-3 !py-1 ${tab === t ? "seg-btn-active" : ""}`} onClick={() => setTab(t)}>
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>
      }
    >
      {loading ? (
        <div className="text-ink-faint text-sm">Loading…</div>
      ) : !data || data.length === 0 ? (
        simOnly ? (
          <SimFlowDrillView />
        ) : (
          <div className="space-y-3">
            <NotInstalled />
            <button className="btn" onClick={() => setSimOnly(true)}>
              Grade TIMI flow on simulated runs
            </button>
          </div>
        )
      ) : tab === "library" ? (
        <Library data={practiceData} />
      ) : tab === "cases" ? (
        <Cases patients={patients.filter((p) => p.dataset === "CADICA" || p.dataset === "AngioCAD")} data={practiceData} />
      ) : tab === "progress" ? (
        <Progress />
      ) : tab === "realsim" ? (
        <RealOrSimDrill />
      ) : tab === "exam" ? (
        <ReadingExam patients={examPatients} data={data} />
      ) : (
        <Drills runs={runs} patients={patients} data={practiceData} initial={requested?.drill === "exam" ? undefined : requested?.drill} initialParams={requested?.params} />
      )}
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
// Reading exam: a stratified set on held-out patients only, no feedback until the
// end, no hints, not added to the spaced-repetition review or to the practice
// drill results. A finished set is one exam case for the logbook (track I4).
//
// Exam integrity: a set is built only from held-out items this learner has not
// been shown in an earlier exam set of the same drill (runs, or patients for the
// dominance and planning drills); one set per drill per day; leaving a set before
// the end logs it as a failed set, and a failed set resets the count toward the
// next level (competency.resetsOnFail).
// ---------------------------------------------------------------------------
const EXAM_DRILLS = (["diag-report", "lesion-assess"] as const).flatMap((epa) =>
  (READING_LADDERS[epa] ?? []).filter((r) => r.kind === "drill").map((r) => ({ epa, drill: r.drill as DrillKind, rung: r.rung, label: r.label }))
);

function ReadingExam({ patients, data }: { patients: LibPatient[]; data: LibDataset[] }) {
  const profile = useProgressStore((s) => s.profile);
  const recordReadingExam = useProgressStore((s) => s.recordReadingExam);
  const beginExam = useProgressStore((s) => s.beginExam);
  const abandonExam = useProgressStore((s) => s.abandonExam);
  const runs = useMemo(() => patients.flatMap((p) => p.runs), [patients]);
  const ctx: DrillContext = useMemo(() => ({ runs, patients, borderline: "exclude" }), [runs, patients]);
  const [drill, setDrill] = useState<DrillKind | null>(null);
  const [items, setItems] = useState<DrillItem[]>([]);
  const [setNo, setSetNo] = useState(0);
  const [i, setI] = useState(0);
  const [done, setDone] = useState<Answered[]>([]);
  const [msg, setMsg] = useState("");
  const finished = drill !== null && items.length > 0 && i >= items.length;
  const today = todayStr();

  // Leaving the section mid-set is a failed set too (a no-op once the set was logged).
  const live = useRef<{ caseId: string; answered: number } | null>(null);
  live.current = drill && !finished && items.length ? { caseId: readingExamId(drill, setNo), answered: i } : null;
  useEffect(
    () => () => {
      const l = live.current;
      if (l) useProgressStore.getState().abandonExam(l.caseId, l.answered);
    },
    []
  );

  const fullSize = useMemo(() => Object.fromEntries(EXAM_DRILLS.map((d) => [d.drill, makeSet(d.drill, ctx).length])) as Partial<Record<DrillKind, number>>, [ctx]);
  const capacity = useMemo(
    () => Object.fromEntries(EXAM_DRILLS.map((d) => [d.drill, setsLeft(d.drill, patients, profile.seenExamItems[d.drill] ?? {}, fullSize[d.drill] ?? 0)])) as Partial<Record<DrillKind, number>>,
    [patients, profile.seenExamItems, fullSize]
  );

  /** Why an exam set on this drill cannot start now, or null. */
  const blocked = (k: DrillKind): string | null => {
    const prefix = `angio-exam:${k}:`;
    if (profile.logbook.some((r) => r.mode === "exam" && r.caseId.startsWith(prefix) && r.date === today)) return "One exam set per drill per day";
    if (profile.pendingExams.some((e) => e.caseId.startsWith(prefix))) return "A set on this drill is still open";
    return null;
  };

  const begin = (k: DrillKind, epa: "diag-report" | "lesion-assess", rung: number) => {
    const why = blocked(k);
    if (why) return setMsg(`${why}.`);
    const full = makeSet(k, ctx).length;
    const got = examSet(k, patients, profile.seenExamItems[k] ?? {}, today, full);
    if (!got) return setMsg(`Too few held-out items remain on this drill that you have not seen in an exam in the last ${READING_EXAM.washoutDays} days. Use another drill at the same rung, or come back later.`);
    const set = got.items;
    const prefix = `angio-exam:${k}:`;
    const n = 1 + Math.max(0, ...profile.logbook.filter((r) => r.caseId.startsWith(prefix)).map((r) => Number(r.caseId.slice(prefix.length)) || 0));
    beginExam({ caseId: readingExamId(k, n), epa, kind: "reading", rung, drill: k, items: set.length, caseName: `Real angiograms exam: ${k}`, seen: set.map((it) => seenKey(k, it)) });
    setMsg(got.reused ? `Unseen items on this drill are used up, so this set includes items last shown in an exam more than ${READING_EXAM.washoutDays} days ago.` : "");
    setDrill(k);
    setItems(set);
    setSetNo(n);
    setI(0);
    setDone([]);
  };
  const commit = (a: DrillAnswer, click?: { x: number; y: number; frame: number } | null) => {
    const it = items[i];
    if (!it || !drill) return;
    const next = [...done, { item: it, answer: a, click }];
    setDone(next);
    // Exam answers stay out of the practice drill results (learning curves, module apply credit).
    setI(i + 1);
    if (i + 1 >= items.length) {
      const s = summarise(drill, next.map((d) => d.answer));
      recordReadingExam(drill, setNo, s.balancedAccuracy, next.length);
    }
  };
  const leave = () => {
    if (drill) abandonExam(readingExamId(drill, setNo), i);
    setDrill(null);
  };

  if (drill && !finished && items[i]) {
    return (
      <div className="space-y-3">
        <div className="notice notice-info">
          <span className="flex-1">
            Exam set, {DRILL_LABEL[drill]}: item {i + 1} of {items.length}. Held-out runs you have not seen in an exam before. No feedback until the end; leaving now counts as a failed set.
          </span>
          <button className="btn !h-7" onClick={leave}>
            Leave (counts as failed)
          </button>
        </div>
        <DrillCard key={`exam-${setNo}-${i}`} item={items[i]} index={i} total={items.length} data={data} onCommit={commit} onNext={() => undefined} />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl">
      {finished && drill && <SetReport kind={drill} done={done} onAgain={() => setDrill(null)} againLabel="Back to exams" />}
      {msg && <div className="notice notice-warn">{msg}</div>}
      <div className="notice notice-info">
        <span>
          Reading exams count toward entrustment for reading and lesion assessment. A set passes at a balanced accuracy of 70% or more; a failed set resets the count toward the next level. Each set uses held-out items you have not seen in an exam
          on that drill (items return after {READING_EXAM.washoutDays} days, only when unseen ones run out), one set per drill per day. The thresholds are model parameters. {patients.length} held-out patients, {runs.length} runs.
        </span>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {(["diag-report", "lesion-assess"] as const).map((epa) => {
          const rec = profile.entrustment[epa];
          return (
            <section key={epa} className="panel">
              <div className="panel-head">
                <span>{EPA_BY_ID[epa].title}</span>
                <span className="chip font-mono">level {LEVEL_LABEL[rec?.effective ?? 0].roman}</span>
              </div>
              <div className="px-4 py-2 text-[12px] text-ink-faint">{rec?.next ?? "Log a first session."}</div>
              <div className="divide-y divide-line">
                {EXAM_DRILLS.filter((d) => d.epa === epa).map((d) => {
                  const n = fullSize[d.drill] ?? 0;
                  const left = capacity[d.drill] ?? 0;
                  const why = (rec?.awarded ?? 0) < 2 ? "Exam mode opens at level II" : blocked(d.drill);
                  return (
                    <div key={d.drill} className="px-4 py-2.5 flex items-center gap-3">
                      <span className="font-mono text-[12px] text-ink-faint w-12">rung {d.rung}</span>
                      <span className="flex-1 text-[13px] text-ink">
                        {d.label}
                        {n > 0 && <span className="text-[12px] text-ink-faint"> · {left >= 3 ? "3 or more unseen sets" : left === 0 ? `no unseen set left (items return after ${READING_EXAM.washoutDays} days)` : `${left} unseen set${left === 1 ? "" : "s"} left`}</span>}
                      </span>
                      <button className="btn !h-7" disabled={n === 0 || !!why} title={why ?? undefined} onClick={() => begin(d.drill, epa, d.rung)}>
                        {n === 0 ? "No runs" : why === "One exam set per drill per day" ? "Done today" : "Start"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function NotInstalled() {
  return (
    <div className="panel p-5 max-w-2xl text-[14px] text-ink-soft leading-relaxed">
      <div className="text-ink font-semibold mb-2">The real-angiogram library is not installed on this machine</div>
      It is built locally from openly licensed, de-identified research datasets and served by the development server. From the project folder run
      the download and build scripts in <code className="font-mono">scripts/angio_library/</code>, then restart <code className="font-mono">npm run dev</code>.
    </div>
  );
}

export function Attribution({ ds }: { ds?: LibDataset }) {
  if (!ds) return null;
  return (
    <div className="text-[12px] text-ink-faint leading-relaxed">
      Images: {ds.dataset} · {ds.citation}{" "}
      <a className="text-accent hover:underline" href={ds.doi} target="_blank" rel="noreferrer">
        data
      </a>{" "}
      · licence{" "}
      <a className="text-accent hover:underline" href={ds.licenceUrl} target="_blank" rel="noreferrer">
        {ds.licence}
      </a>
      . {ds.changes} De-identified research data; for education only.
    </div>
  );
}

const pct = (x: number, d = 0) => (Number.isFinite(x) ? `${(100 * x).toFixed(d)}%` : "–");
const num = (x: number, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "–");
const kappaText = (k: Kappa) => (Number.isFinite(k.kappa) ? `${k.kappa.toFixed(2)} (95% CI ${k.lo.toFixed(2)} to ${k.hi.toFixed(2)})` : "–");

// ---------------------------------------------------------------------------
// Library
// ---------------------------------------------------------------------------
const TAG_LABEL: Record<string, string> = {
  occlusion: "RCA occlusion",
  collaterals: "left-to-right collaterals",
  artefact: "artefact (pacing lead, sternal wires)",
  uncertain: "dominance uncertain",
};

function Library({ data }: { data: LibDataset[] }) {
  const [ds, setDs] = useState(data[0].dataset);
  const [artery, setArtery] = useState<"all" | "LCA" | "RCA">("all");
  const [grade, setGrade] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [tag, setTag] = useState<string>("all");
  // Selected by id: merging labels (Reader mode, labels.json) rebuilds labelled run objects, so identity is not stable.
  const [selId, setSelId] = useState<string | null>(null);
  const d = data.find((x) => x.dataset === ds) ?? data[0];
  const categories = [...new Set(d.patients.map((p) => p.category ?? "routine"))];
  const runs = d.patients
    .filter((p) => category === "all" || (p.category ?? "routine") === category)
    .flatMap((p) => p.runs)
    .filter(
      (r) =>
        (artery === "all" || r.artery === artery) &&
        (grade === "all" || (grade === "none" ? !r.worst : r.worst === grade)) &&
        (tag === "all" || !!r.tags?.[tag])
    );
  const cur = (selId ? runs.find((r) => r.id === selId) : undefined) ?? runs[0] ?? null;
  // Reader mode (Settings): the supervising reader labels the run on screen.
  const readerOn = useReaderStore((st) => st.enabled && !!st.name.trim());
  const [point, setPoint] = useState<{ x: number; y: number; frame: number } | null>(null);
  const [rmarks, setRmarks] = useState<{ from?: number; to?: number }>({});
  const curId = cur?.id;
  useEffect(() => {
    setPoint(null);
    setRmarks({});
  }, [curId]);
  return (
    <div className="grid xl:grid-cols-12 gap-4">
      <div className="xl:col-span-7 space-y-3">
        {cur ? (
          <>
            <CinePlayer
              key={`player-${cur.id}`}
              run={cur}
              onPick={readerOn ? (x, y, f) => setPoint({ x, y, frame: f }) : undefined}
              marks={readerOn && point ? [{ x: point.x, y: point.y, frame: point.frame, tone: "neutral" }] : undefined}
              frameMarks={
                readerOn
                  ? [
                      { id: "from", label: "Contrast across the origin", frame: rmarks.from },
                      { id: "to", label: "Reaches the landmark", frame: rmarks.to },
                    ]
                  : undefined
              }
              onFrameMark={(id, f) => setRmarks((m) => ({ ...m, [id]: f }))}
            />
            {readerOn && <ReaderPanel key={`reader-${cur.id}`} run={cur} pendingPoint={point} onClearPoint={() => setPoint(null)} marked={rmarks} />}
            <div className="panel p-3 text-[13px] text-ink-soft space-y-0.5">
              <div className="text-ink font-semibold">
                {cur.id} · {cur.artery ?? "artery not labelled"}
              </div>
              {cur.angles !== undefined && <div>Projection: {angleName(cur.angles)}{standardView(cur.angles) ? ` (${standardView(cur.angles)})` : ""}</div>}
              {cur.worst !== undefined && <div>Worst labelled stenosis: {cur.worst ? GRADE_LABEL[cur.worst] : "none labelled"}</div>}
              {cur.expert && cur.expert.length > 0 && (
                <div>
                  Reader labels: {[...new Set(cur.expert.map((l) => `${l.reader}${l.source === "local" ? " (this browser, not used for scoring)" : ""}`))].join(", ")}
                </div>
              )}
              {cur.tags && (
                <div>
                  Expert run labels:{" "}
                  {Object.entries(cur.tags)
                    .filter(([, v]) => v)
                    .map(([k]) => TAG_LABEL[k] ?? k)
                    .join(", ") || "none"}
                </div>
              )}
            </div>
            <Attribution ds={d} />
          </>
        ) : (
          <div className="text-sm text-ink-faint">No runs match.</div>
        )}
      </div>
      <div className="xl:col-span-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          <select value={ds} onChange={(e) => setDs(e.target.value as typeof ds)} className="field !h-8 text-[13px]">
            {data.map((x) => (
              <option key={x.dataset} value={x.dataset}>
                {x.dataset}
              </option>
            ))}
          </select>
          <select value={artery} onChange={(e) => setArtery(e.target.value as typeof artery)} className="field !h-8 text-[13px]">
            <option value="all">LCA and RCA</option>
            <option value="LCA">Left coronary</option>
            <option value="RCA">Right coronary</option>
          </select>
          {categories.length > 1 && (
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="field !h-8 text-[13px]">
              <option value="all">all studies</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "routine" ? "routine studies" : `${c} studies`}
                </option>
              ))}
            </select>
          )}
          {d.dataset === "CoronaryDominance" && (
            <select value={tag} onChange={(e) => setTag(e.target.value)} className="field !h-8 text-[13px]">
              <option value="all">any run</option>
              <option value="occlusion">occluded RCA</option>
              <option value="collaterals">collaterals to the RCA</option>
              <option value="artefact">artefact (leads, wires)</option>
            </select>
          )}
          {d.dataset === "CADICA" && (
            <select value={grade} onChange={(e) => setGrade(e.target.value)} className="field !h-8 text-[13px]">
              <option value="all">any lesion grade</option>
              <option value="none">no lesion labelled</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {GRADE_LABEL[g]}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="text-[12px] text-ink-faint">{runs.length} runs</div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-[620px] overflow-y-auto pr-1">
          {runs.slice(0, 400).map((r) => {
            const k = (r.keyframes?.[0] ?? Math.ceil(r.frames.length / 2)) - 1;
            return (
              <button key={r.id} onClick={() => setSelId(r.id)} className={`relative rounded overflow-hidden border ${cur?.id === r.id ? "border-accent" : "border-line"}`}>
                <img src={r.base + r.frames[Math.max(0, Math.min(r.frames.length - 1, k))]} loading="lazy" className="w-full aspect-square object-cover bg-black" alt="" />
                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[12px] font-mono text-ink/80 px-1 truncate">
                  {r.artery ?? ""} {r.worst ? GRADE_LABEL[r.worst] : ""}
                  {r.tags?.occlusion ? " occl" : ""}
                  {r.tags?.collaterals ? " coll" : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Patient cases (CADICA clinical data + runs; AngioCAD segment labels)
// ---------------------------------------------------------------------------
function vignette(p: LibPatient): string {
  const sex = p.sex === "M" ? "man" : p.sex === "F" ? "woman" : "patient";
  const rf = [p.smoker && "smoker", p.diabetes && "diabetes", p.hypertension && "hypertension", p.dyslipidaemia && "dyslipidaemia"].filter(Boolean).join(", ");
  const ind = p.dataset === "AngioCAD" ? `Diagnosis (dataset label): ${p.indication ?? "not recorded"}` : `Indication: ${p.indication ?? "not recorded"}`;
  return `${p.age ? `${p.age}-year-old ` : ""}${sex}${rf ? ` (${rf})` : ""}. ${ind}. LVEF ${p.lvef ?? "not recorded"}.`;
}

/** CADICA's own patient-level classes (the dataset has no 50-70% patient class). */
const DEGREE_LABEL: Record<string, string> = { "<20%": "< 20%", "20-50%": "20–50%", ">70%": "> 70%" };

function Cases({ patients, data }: { patients: LibPatient[]; data: LibDataset[] }) {
  const recordSim = useProgressStore((s) => s.recordSim);
  const withRuns = patients.filter((p) => p.runs.length > 0);
  const [idx, setIdx] = useState(0);
  const p = withRuns[idx % Math.max(1, withRuns.length)];
  const [run, setRun] = useState<LibRun | null>(null);
  const [vessels, setVessels] = useState<string | null>(null);
  const [degree, setDegree] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  if (!p) return <div className="text-sm text-ink-faint">No patient cases available.</div>;
  const ds = data.find((d) => d.dataset === p.dataset);
  const cur = run && p.runs.includes(run) ? run : p.runs[0];
  const expertDegree = normaliseDegree(p.maxDegree);
  const degreeOk = degree !== null && expertDegree !== null && degree === expertDegree;
  const vesselsOk = vessels !== null && p.vesselsAffected != null && vessels === String(p.vesselsAffected);

  const reveal = () => {
    setRevealed(true);
    recordSim("angio-cases", (vesselsOk ? 50 : 0) + (degreeOk ? 50 : 0));
  };
  const next = () => {
    setIdx((i) => (i + 1) % withRuns.length);
    setRun(null);
    setVessels(null);
    setDegree(null);
    setRevealed(false);
  };

  return (
    <div className="grid xl:grid-cols-12 gap-4">
      <div className="xl:col-span-7 space-y-3">
        <CinePlayer key={cur.id} run={cur} showBoxes={revealed} allowBoxes={revealed} hideFrameInfo={!revealed} />
        <Attribution ds={ds} />
      </div>
      <div className="xl:col-span-5 space-y-3">
        <div className="panel p-4">
          <div className="flex items-center justify-between">
            <div className="stat-label">
              Patient {idx + 1} of {withRuns.length} · {p.dataset}
            </div>
            <button className="btn !py-1" onClick={next}>
              Next patient
            </button>
          </div>
          <p className="text-[14px] text-ink mt-2 leading-relaxed">{vignette(p)}</p>
          <div className="stat-label mt-3 mb-1">Runs ({p.runs.length}). Review them all before you answer.</div>
          <div className="flex flex-wrap gap-1">
            {p.runs.map((r, i) => (
              <button key={r.id} onClick={() => setRun(r)} className={`rounded border px-2 py-0.5 text-[12px] font-mono ${cur.id === r.id ? "border-accent bg-accent-tint text-ink" : "border-line text-ink-soft"}`}>
                {i + 1} {r.artery ?? ""}
              </button>
            ))}
          </div>
        </div>
        {p.dataset === "CADICA" && (
          <div className="panel p-4 space-y-3 text-[13px]">
            <div>
              <div className="text-ink-soft mb-1">How many major epicardial vessels have significant disease?</div>
              <div className="seg">
                {["0", "1", "2", "3"].map((v) => (
                  <button key={v} disabled={revealed} onClick={() => setVessels(v)} className={`seg-btn !px-3 ${vessels === v ? "seg-btn-active" : ""}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-ink-soft mb-1">What is the most severe stenosis? (the dataset's three patient-level classes)</div>
              <div className="seg">
                {PATIENT_DEGREE_CLASSES.map((v) => (
                  <button key={v} disabled={revealed} onClick={() => setDegree(v)} className={`seg-btn ${degree === v ? "seg-btn-active" : ""}`}>
                    {DEGREE_LABEL[v]}
                  </button>
                ))}
              </div>
            </div>
            {!revealed ? (
              <button className="btn btn-accent" disabled={vessels === null || degree === null} onClick={reveal}>
                Show the expert report
              </button>
            ) : (
              <div className="animate-fadein space-y-1">
                <div className={vesselsOk ? "text-good" : "text-danger"}>Vessels affected (expert): {p.vesselsAffected ?? "not recorded"}</div>
                <div className={degreeOk ? "text-good" : "text-danger"}>Most severe stenosis (expert): {expertDegree ? DEGREE_LABEL[expertDegree] : p.maxDegree ?? "not recorded"}</div>
                <div className="text-ink-faint text-[12px]">Per run (worst labelled lesion):</div>
                <ul className="text-[12px] text-ink-soft">
                  {p.runs.map((r, i) => (
                    <li key={r.id}>
                      {i + 1}. {r.artery ?? "?"}: {r.worst ? GRADE_LABEL[r.worst] : "no lesion labelled"}
                    </li>
                  ))}
                </ul>
                <div className="text-ink-faint text-[12px]">Lesion boxes are now shown on the keyframes of each run.</div>
              </div>
            )}
          </div>
        )}
        {p.dataset === "AngioCAD" && p.segments && <SegmentReport p={p} revealed={revealed} setRevealed={setRevealed} />}
      </div>
    </div>
  );
}

const SEG_OPTIONS = ["NL", "1-25", "26-50", "51-75", "76-90", "91-99", "100"];

function SegmentReport({ p, revealed, setRevealed }: { p: LibPatient; revealed: boolean; setRevealed: (v: boolean) => void }) {
  const recordSim = useProgressStore((s) => s.recordSim);
  const segs = Object.keys(p.segments ?? {});
  const [ans, setAns] = useState<Record<string, string>>({});
  const submit = () => {
    setRevealed(true);
    const ok = segs.filter((s) => ans[s] === p.segments![s]).length;
    recordSim("angio-segments", Math.round((100 * ok) / Math.max(1, segs.length)));
  };
  return (
    <div className="panel p-4 text-[13px] space-y-2">
      <div className="text-ink-soft">Report each segment (NL = normal):</div>
      <div className="grid grid-cols-1 gap-1">
        {segs.map((s) => (
          <div key={s} className="flex items-center justify-between gap-2">
            <span className="text-ink w-24">{s}</span>
            <select value={ans[s] ?? ""} disabled={revealed} onChange={(e) => setAns((a) => ({ ...a, [s]: e.target.value }))} className="field !h-7 flex-1 text-[13px]">
              <option value="">–</option>
              {SEG_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o === "NL" ? "normal" : `${o}%`}
                </option>
              ))}
            </select>
            {revealed && <span className={ans[s] === p.segments![s] ? "text-good w-16 text-right" : "text-danger w-16 text-right"}>{p.segments![s] === "NL" ? "normal" : `${p.segments![s]}%`}</span>}
          </div>
        ))}
      </div>
      {!revealed ? (
        <button className="btn btn-accent" onClick={submit}>
          Compare with the expert report
        </button>
      ) : (
        <div className="text-ink-soft">
          {p.dominance ? `${p.dominance === "right" ? "Right" : "Left"} dominant. ` : ""}
          {p.gensini != null ? `Gensini score ${p.gensini}.` : ""}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drills
// ---------------------------------------------------------------------------
const DRILL_ORDER: DrillKind[] = ["artery", "dominance", "view", "occlusion", "collaterals", "grade", "locate", "estimate", "plan"];

const DRILL_BLURB: Record<DrillKind, string> = {
  artery: "Equal numbers of left and right injections.",
  dominance: "Equal numbers of right- and left-dominant studies; review every run.",
  view: "Two runs per projection. Runs within 5° of a naming boundary accept either name.",
  occlusion:
    "Equal numbers of occluded and patent right coronaries, paired from the same image set and matched for artefacts, so image quality does not give the answer. The pool is small, so runs repeat between sets.",
  collaterals:
    "Equal numbers of left injections with and without collaterals to the RCA, paired from the same image set and matched for artefacts, so image quality does not give the answer.",
  grade: "Three runs per stenosis category, graded against the CADICA expert boxes.",
  locate: "Half the frames carry expert lesion boxes, half come from runs with no lesion. Click a lesion, then grade the one you clicked.",
  estimate: "Estimate the outlined lesion in percent and compare with the expert class and published inter-observer agreement.",
  plan: "The first runs of a real study: choose the next projection and compare with what the operator did. Not stratified: the reference is one operator's practice.",
};

const CONF_DEFAULT = 0.7;

export interface Answered {
  item: DrillItem;
  answer: DrillAnswer;
  /** for display */
  click?: { x: number; y: number; frame: number } | null;
}

export function Drills({
  runs,
  patients,
  data,
  initial,
  initialParams,
}: {
  runs: LibRun[];
  patients: LibPatient[];
  data: LibDataset[];
  initial?: string;
  /** parameters from an Academy drill block; they apply to the drill they came with until cleared */
  initialParams?: Record<string, string>;
}) {
  const recordSim = useProgressStore((s) => s.recordSim);
  const quizMemory = useProgressStore((s) => s.profile.quizMemory);
  // Real-angiogram reads have their own spaced-repetition store (library.ts). Records an
  // earlier build wrote into the quiz memory are moved there once.
  const [memory, setMemory] = useState(() => loadAngioMemory());
  useEffect(() => {
    const rest = migrateAngioMemory(quizMemory);
    if (rest) {
      useProgressStore.setState((st) => ({ profile: { ...st.profile, quizMemory: rest } }));
      useProgressStore.getState().persist();
      setMemory(loadAngioMemory());
    }
  }, [quizMemory]);
  const [params, setParams] = useState<{ drill: string; params: Record<string, string> } | null>(() =>
    initial && initialParams && Object.keys(initialParams).length ? { drill: initial, params: initialParams } : null
  );
  const [borderlineChoice, setBorderline] = useState<"accept" | "exclude">(() => (initialParams?.borderline === "exclude" ? "exclude" : "accept"));
  // The plan drill's two steps: the next view (CoronaryDominance studies) and, after the vessel count, the facts the
  // decision needs that the dataset does not record (AngioCAD studies; a lesson link opens it with part=missing-facts).
  const [planStep, setPlanStep] = useState<"next-view" | "missing-facts">(() =>
    initialParams?.part === "missing-facts" || (planningStudies(patients).length === 0 && revascStudies(patients).length > 0) ? "missing-facts" : "next-view"
  );
  const baseCtx: DrillContext = useMemo(() => ({ runs, patients, borderline: borderlineChoice }), [runs, patients, borderlineChoice]);
  const borderline = borderlineChoice;
  const ctxFor = (k: DrillKind | "review"): DrillContext => {
    if (params && params.drill === k) {
      const { borderline: _b, ...rest } = params.params;
      void _b;
      return applyDrillParams(baseCtx, k, rest);
    }
    return baseCtx;
  };
  const ctx = baseCtx;

  const counts = useMemo(() => {
    const c: Partial<Record<DrillKind, number>> = {};
    c.artery = runs.filter((r) => r.artery).length;
    c.dominance = patients.filter((p) => p.dominance).length;
    c.view = runs.filter((r) => r.angles).length;
    // Yes/no drills: matched positive-negative pairs available (same library subset and artefact tag).
    for (const d of ["occlusion", "collaterals"] as const) {
      const its = runs
        .filter((r) => r.dataset === "CoronaryDominance" && r.artery === (d === "occlusion" ? "RCA" : "LCA"))
        .map((r) => itemFor(d, r, { runs, patients }))
        .filter((x): x is DrillItem => !!x);
      c[d] = matchedPairs(its, () => 0.5).pairs.length;
    }
    c.grade = runs.filter((r) => r.worst).length;
    c.locate = runs.filter((r) => r.dataset === "CADICA" && r.keyframes?.length).length;
    c.estimate = runs.filter((r) => r.dataset === "CADICA" && r.worst).length;
    // next-view planning on CoronaryDominance studies, and the decision step on AngioCAD studies (angio-decision-drills)
    c.plan = planningStudies(patients).length + revascStudies(patients).length;
    return c;
  }, [runs, patients]);
  const available = DRILL_ORDER.filter((d) => (counts[d] ?? 0) > 0);
  const dueKeys = useMemo(() => angioDueKeys(todayStr(), memory), [memory]);

  const startKind: DrillKind | "review" =
    initial === "review" ? "review" : initial && (available as string[]).includes(initial) ? (initial as DrillKind) : available[0] ?? "artery";
  const [kind, setKind] = useState<DrillKind | "review">(startKind);
  // A lesson link to a registered drill (the expert-label drills) opens it directly.
  const [extra, setExtra] = useState<string | null>(() => (initial && registeredAngioDrills().some((d) => d.id === initial) ? initial : null));
  const build = (k: DrillKind | "review") =>
    k === "review"
      ? dueKeys
          .map((key) => itemForKey(key, ctx))
          .filter((x): x is DrillItem => !!x)
          .slice(0, 20)
      : makeSet(k, ctxFor(k));
  const [items, setItems] = useState<DrillItem[]>(() => build(startKind));
  const [setNo, setSetNo] = useState(() => Date.now());
  const [i, setI] = useState(0);
  const [done, setDone] = useState<Answered[]>([]);

  const start = (k: DrillKind | "review") => {
    setExtra(null);
    setKind(k);
    setItems(build(k));
    setSetNo(Date.now());
    setI(0);
    setDone([]);
  };
  useEffect(() => {
    // Rebuild the projection set when the borderline rule changes.
    if (kind === "view") start("view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [borderline]);

  const it = items[i];
  const finished = items.length > 0 && i >= items.length;

  const commit = (a: DrillAnswer, click?: { x: number; y: number; frame: number } | null) => {
    if (!it) return;
    setMemory(recordAngioRead(srsKey(it.drill, it.key), a.correct, todayStr()));
    const rec: DrillResult = { t: Date.now(), drill: it.drill, runId: it.key, ref: a.ref, ans: a.ans, correct: a.correct, conf: a.conf, set: setNo };
    saveResults([rec]);
    setDone((d) => [...d, { item: it, answer: a, click }]);
  };
  const advance = () => {
    const ni = i + 1;
    setI(ni);
    if (ni >= items.length && kind !== "review") {
      const s = summarise(kind, [...done].map((d) => d.answer));
      recordSim(`angio-${kind}`, Math.round(100 * (Number.isFinite(s.balancedAccuracy) ? s.balancedAccuracy : 0)));
    }
  };

  // each gate scans every practice run, so compute them once per change of the runs, not on every answer
  const gates = useMemo(() => new Map(registeredAngioDrills().map((d) => [d.id, d.gate?.(runs)])), [runs]);
  const ExtraComponent = extra ? (registeredAngioDrills().find((d) => d.id === extra)?.component as ((p: ExtraDrillProps) => JSX.Element) | undefined) : undefined;
  const extraParams = params && params.drill === extra ? params.params : undefined;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {available.map((d) => (
          <button key={d} onClick={() => start(d)} className={`rounded-md border px-3 py-1.5 text-[13px] ${kind === d && !extra ? "border-accent bg-accent-tint text-ink" : "border-line text-ink-soft hover:text-ink"}`}>
            {DRILL_LABEL[d]} <span className="text-ink-faint">{counts[d]}</span>
          </button>
        ))}
        <button
          onClick={() => start("review")}
          disabled={!dueKeys.length}
          className={`rounded-md border px-3 py-1.5 text-[13px] disabled:opacity-45 ${kind === "review" && !extra ? "border-accent bg-accent-tint text-ink" : "border-line text-ink-soft hover:text-ink"}`}
        >
          Due for review <span className="text-ink-faint">{dueKeys.length}</span>
        </button>
        {registeredAngioDrills().map((d) => {
          const gate = gates.get(d.id);
          return (
            <button
              key={d.id}
              onClick={() => setExtra(d.id)}
              title={gate?.note}
              className={`rounded-md border px-3 py-1.5 text-[13px] ${extra === d.id ? "border-accent bg-accent-tint text-ink" : gate && !gate.open ? "border-line text-ink-faint" : "border-line text-ink-soft hover:text-ink"}`}
            >
              {d.label}
              {gate && !gate.open && <span className="text-ink-faint"> · not yet labelled</span>}
              {gate?.open && gate.note && <span className="text-ink-faint"> · {gate.note}</span>}
            </button>
          );
        })}
      </div>

      {ExtraComponent ? (
        <ExtraComponent runs={runs} patients={patients} data={data} params={extraParams} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-ink-soft">
            <span>{kind === "review" ? "Runs you read wrongly, back on their spaced-repetition schedule." : kind === "plan" && planStep === "missing-facts" ? MISSING_FACTS_BLURB : DRILL_BLURB[kind]}</span>
            {params && params.drill === kind && describeDrillParams(params.params) && (
              <span className="chip">
                From the lesson: {describeDrillParams(params.params)}
                <button
                  className="ml-2 underline text-ink-soft hover:text-ink"
                  onClick={() => {
                    setParams(null);
                    setExtra(null);
                    setItems(kind === "review" ? build(kind) : makeSet(kind, baseCtx));
                    setSetNo(Date.now());
                    setI(0);
                    setDone([]);
                  }}
                >
                  All runs
                </button>
              </span>
            )}
            {kind === "plan" && (
              <div className="seg">
                <button className={`seg-btn ${planStep === "next-view" ? "seg-btn-active" : ""}`} disabled={!planningStudies(patients).length} onClick={() => setPlanStep("next-view")}>
                  Next view
                </button>
                <button className={`seg-btn ${planStep === "missing-facts" ? "seg-btn-active" : ""}`} disabled={!revascStudies(patients).length} onClick={() => setPlanStep("missing-facts")}>
                  Before the decision: what is missing
                </button>
              </div>
            )}
            {kind === "view" && (
              <div className="seg">
                <button className={`seg-btn ${borderline === "accept" ? "seg-btn-active" : ""}`} onClick={() => setBorderline("accept")}>
                  Accept either name near a boundary
                </button>
                <button className={`seg-btn ${borderline === "exclude" ? "seg-btn-active" : ""}`} onClick={() => setBorderline("exclude")}>
                  Leave borderline runs out
                </button>
              </div>
            )}
          </div>
          {kind === "plan" && planStep === "missing-facts" ? (
            <MissingFactsDrill patients={patients} data={data} />
          ) : items.length === 0 ? (
            <div className="panel p-6 text-[14px] text-ink-soft">{kind === "review" ? "Nothing is due for review today." : "Not enough labelled runs for this drill."}</div>
          ) : finished ? (
            <SetReport kind={kind} done={done} onAgain={() => start(kind)} />
          ) : (
            <DrillCard key={`${setNo}-${i}`} item={it} index={i} total={items.length} data={data} answered={done[i]} onCommit={commit} onNext={advance} />
          )}
        </>
      )}
    </div>
  );
}

function ConfidenceSlider({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <label className="block text-[13px] text-ink-soft mt-3">
      <div className="flex items-center justify-between">
        <span>How sure are you that this is right?</span>
        <span className="metric text-ink">{Math.round(100 * value)}%</span>
      </div>
      <input type="range" min={0} max={100} step={5} value={Math.round(100 * value)} disabled={disabled} onChange={(e) => onChange(Number(e.target.value) / 100)} className="w-full" />
    </label>
  );
}

export function DrillCard({
  item,
  index,
  total,
  data,
  answered,
  onCommit,
  onNext,
}: {
  item: DrillItem;
  index: number;
  total: number;
  data: LibDataset[];
  answered?: Answered;
  onCommit: (a: DrillAnswer, click?: { x: number; y: number; frame: number } | null) => void;
  onNext: () => void;
}) {
  const [view, setView] = useState<LibRun | null>(null);
  const [choice, setChoice] = useState<number | null>(null);
  const [conf, setConf] = useState(CONF_DEFAULT);
  const [click, setClick] = useState<{ x: number; y: number; frame: number } | null>(null);
  const [noLesion, setNoLesion] = useState(false);
  const [estimate, setEstimate] = useState(50);
  const [frame, setFrame] = useState(item.startFrame ?? 1);
  const a = answered?.answer;
  const revealed = !!answered;
  const isPlan = item.drill === "plan";
  // Next-view planning: the operator's next run is shown only after the answer.
  const runList = isPlan && revealed && item.runs ? [...item.runs, item.run] : item.runs;
  const shown = view && runList?.includes(view) ? view : isPlan && revealed ? item.run : runList?.[0] ?? item.run;
  const ds = data.find((d) => d.dataset === shown.dataset);

  const canSubmit =
    item.mode === "choice" ? choice !== null : item.mode === "locate" ? noLesion || (click !== null && choice !== null) : true;
  const submit = () => {
    if (revealed || !canSubmit) return;
    if (item.mode === "choice") onCommit(scoreChoice(item, choice!, conf));
    else if (item.mode === "locate") onCommit(scoreLocate(item, noLesion ? null : click, noLesion ? null : choice, conf), noLesion ? null : click);
    else onCommit(scoreEstimate(item, estimate, conf));
  };

  const marks: CineMark[] | undefined = click && !noLesion ? [{ x: click.x, y: click.y, tone: revealed ? (a?.hit ? "hit" : "miss") : "neutral" }] : undefined;
  const onTarget = item.mode !== "locate" || frame === item.startFrame;

  return (
    <div className="grid xl:grid-cols-12 gap-4">
      <div className="xl:col-span-7 space-y-2">
        <CinePlayer
          key={shown.id}
          run={shown}
          autoPlay={item.mode === "choice"}
          startFrame={shown === item.run ? item.startFrame : undefined}
          allowBoxes={revealed && (item.drill === "grade" || item.mode !== "choice")}
          showBoxes={revealed && (item.drill === "grade" || item.mode === "locate" || item.mode === "estimate")}
          hideFrameInfo={!revealed}
          outlineBoxes={item.mode === "estimate" && !revealed ? item.outline : undefined}
          onPick={
            item.mode === "locate" && !revealed
              ? (x, y, f) => {
                  if (f !== item.startFrame) return;
                  setClick({ x, y, frame: f });
                  setNoLesion(false);
                }
              : undefined
          }
          onFrame={setFrame}
          marks={marks}
        />
        {runList && runList.length > 1 && (
          <div className="flex flex-wrap gap-1">
            {runList.map((r, k) => (
              <button
                key={r.id}
                onClick={() => setView(r)}
                className={`rounded border px-2 py-0.5 text-[12px] font-mono ${shown.id === r.id ? "border-accent bg-accent-tint text-ink" : "border-line text-ink-soft"}`}
              >
                {k + 1} {r.artery ?? ""} {isPlan && r.angles ? standardView(r.angles) : ""}
              </button>
            ))}
          </div>
        )}
        {isPlan && item.shown && (
          <div className="text-[12px] text-ink-faint">
            Acquired so far: {item.shown.map((r, k) => `${k + 1}. ${r.artery ?? ""} ${angleName(r.angles)}`).join(" · ")}
          </div>
        )}
        <Attribution ds={ds} />
      </div>
      <div className="xl:col-span-5">
        <div className="panel">
          <div className="panel-head">
            <span>{DRILL_LABEL[item.drill]}</span>
            <span className="chip">
              {index + 1} / {total}
            </span>
          </div>
          <div className="p-4">
            <div className="text-[14.5px] text-ink mb-3">{item.question}</div>

            {item.mode === "locate" && !revealed && (
              <div className="space-y-2 mb-3">
                {!onTarget && (
                  <div className="notice notice-info">Clicks count on frame {item.startFrame} only. Use "Back to frame {item.startFrame}" to return to it.</div>
                )}
                <div className="flex flex-wrap items-center gap-2 text-[13px]">
                  <span className={click && !noLesion ? "text-ink" : "text-ink-faint"}>{click && !noLesion ? "Lesion marked." : "Click the lesion on the image."}</span>
                  <button
                    className={`btn !py-1 ${noLesion ? "border-accent" : ""}`}
                    onClick={() => {
                      setNoLesion(true);
                      setClick(null);
                      setChoice(null);
                    }}
                  >
                    No lesion visible
                  </button>
                </div>
              </div>
            )}

            {(item.mode === "choice" || (item.mode === "locate" && click && !noLesion)) && (
              <>
                {item.mode === "locate" && <div className="stat-label mb-1">Grade the lesion you marked</div>}
                <div className={item.options.length > 4 ? "grid grid-cols-2 gap-1.5" : "space-y-1.5"}>
                  {item.options.map((o, k) => {
                    const isAccepted = item.accepted.includes(k);
                    const cls = !revealed
                      ? choice === k
                        ? "border-accent bg-accent-tint text-ink"
                        : "border-line hover:border-accent/50 text-ink-soft"
                      : item.mode === "locate"
                        ? a?.hit && k === a.gradeRef
                          ? "border-good/60 bg-good/[0.08] text-ink"
                          : k === choice
                            ? "border-line-strong text-ink"
                            : "border-line opacity-60 text-ink-soft"
                        : isAccepted
                          ? "border-good/60 bg-good/[0.08] text-ink"
                          : k === choice
                            ? "border-danger/60 bg-danger/[0.08] text-ink"
                            : "border-line opacity-60 text-ink-soft";
                    return (
                      <button key={o} disabled={revealed} onClick={() => setChoice(k)} className={`w-full text-left rounded-lg border px-3 py-2 text-[14px] ${cls}`}>
                        {o}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {item.mode === "estimate" && (
              <EstimateInput value={estimate} onChange={setEstimate} disabled={revealed} expertBin={revealed ? item.answer : null} />
            )}

            <ConfidenceSlider value={conf} onChange={setConf} disabled={revealed} />

            {!revealed ? (
              <button className="btn btn-accent mt-3" disabled={!canSubmit} onClick={submit}>
                Submit
              </button>
            ) : (
              <div className="mt-3 animate-fadein">
                <Verdict item={item} a={a!} />
                <p className="text-[13px] text-ink-soft mt-1 leading-relaxed">{item.explain}</p>
                {item.mode === "estimate" && a?.pct !== undefined && <EstimateFeedback item={item} a={a} />}
                <button className="btn btn-accent mt-3" onClick={onNext}>
                  {index + 1 < total ? "Next run" : "Finish"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Verdict({ item, a }: { item: DrillItem; a: DrillAnswer }) {
  if (item.mode === "locate") {
    const text = item.lesion
      ? a.hit
        ? a.gradeAns === a.gradeRef
          ? "Lesion found and graded in the expert's category"
          : `Lesion found; expert grade ${GRADE_BINS[a.gradeRef ?? 0]?.label}`
        : a.ans === 1
          ? "Missed: the click was outside the expert box"
          : "Missed: there is a labelled lesion on this frame"
      : a.ans === 0
        ? "Correct: no lesion labelled in this run"
        : "False positive: the experts labelled no lesion in this run";
    return <div className={`text-sm font-semibold ${a.correct ? "text-good" : "text-danger"}`}>{text}</div>;
  }
  if (item.mode === "estimate")
    return (
      <div className={`text-sm font-semibold ${a.correct ? "text-good" : "text-warn"}`}>
        {a.correct ? "Within the expert's category" : `Outside the expert's category by ${Math.abs(a.dist ?? 0)} points (${(a.dist ?? 0) > 0 ? "over-called" : "under-called"})`}
      </div>
    );
  if (item.drill === "plan")
    return (
      <div className={`text-sm font-semibold ${a.correct ? "text-good" : a.credit > 0 ? "text-warn" : "text-danger"}`}>
        {a.correct ? "Same view as the operator" : a.credit > 0 ? "The operator took that view later in the study" : `The operator took ${item.options[item.answer]}`}
      </div>
    );
  return (
    <div className={`text-sm font-semibold ${a.correct ? "text-good" : "text-danger"}`}>
      {a.correct ? "Correct" : `Expert label: ${item.options[item.answer]}`}
    </div>
  );
}

/** 0-100% scale with the four categories; after answering, the expert category is shaded. */
function EstimateInput({ value, onChange, disabled, expertBin }: { value: number; onChange: (v: number) => void; disabled?: boolean; expertBin: number | null }) {
  return (
    <div className="mb-1">
      <div className="flex items-center justify-between text-[13px] text-ink-soft">
        <span>Percent diameter stenosis</span>
        <span className="metric text-ink text-lg">{value}%</span>
      </div>
      <input type="range" min={0} max={100} step={1} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
      <div className="relative h-6 rounded border border-line overflow-hidden">
        {GRADE_BINS.map((b, k) => (
          <div
            key={b.id}
            className={`absolute top-0 bottom-0 border-r border-line text-[12px] grid place-items-center ${expertBin === k ? "bg-good/20 text-ink" : "text-ink-faint"}`}
            style={{ left: `${b.lo}%`, width: `${b.hi - b.lo + 1}%` }}
          >
            {b.label}
          </div>
        ))}
        <div className="absolute top-0 bottom-0 w-0.5 bg-accent" style={{ left: `${value}%` }} />
      </div>
      <div className="text-[12px] text-ink-faint mt-1">Your category: {GRADE_BINS[percentBin(value)]?.label}</div>
    </div>
  );
}

function EstimateFeedback({ item, a }: { item: DrillItem; a: DrillAnswer }) {
  const bin = item.answer;
  return (
    <div className="notice notice-info mt-2 block">
      <div>
        Published spread: three operators grading 155 lesions agreed with kappa {SEN2018_KAPPA[bin]} in the {GRADE_BINS[bin].label.replace("90–100%", "90–99%")} category
        (kappa 0.26 to 0.58 across categories). On the same lesions, quantitative analysis gave {SEN2018_QCA.diameterMean} ± {SEN2018_QCA.diameterSd}% diameter stenosis
        against {SEN2018_QCA.areaMean} ± {SEN2018_QCA.areaSd}% area stenosis, and visual estimates tracked area rather than diameter (Sen 2018, doi 10.5830/CVJA-2018-024).
      </div>
      <div className="mt-1">
        Your estimate {a.pct}% sits {a.dist === 0 ? "inside" : `${Math.abs(a.dist ?? 0)} points ${(a.dist ?? 0) > 0 ? "above" : "below"}`} the expert category. A single disagreement is expected; a consistent
        direction across many lesions is a bias worth correcting.
      </div>
    </div>
  );
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {sub && <span className="text-[12px] text-ink-faint">{sub}</span>}
    </div>
  );
}

export function SetReport({ kind, done, onAgain, againLabel = "New set" }: { kind: DrillKind | "review"; done: Answered[]; onAgain: () => void; againLabel?: string }) {
  const answers = done.map((d) => d.answer);
  const s: SetSummary | null = kind === "review" ? null : summarise(kind, answers);
  const correct = answers.filter((a) => a.correct).length;
  const conf = answers.map((a) => a.conf);
  const ok = answers.map((a) => a.correct);
  const cal = calibrationBins(conf, ok);
  const baseline = kind === "review" ? null : constantBaseline(done.map((d) => d.item));
  return (
    <div className="panel max-w-4xl">
      <div className="panel-head">
        <span>Set complete · {kind === "review" ? "review" : DRILL_LABEL[kind]}</span>
        <span className="chip">{answers.length} runs</span>
      </div>
      <div className="p-4 space-y-4">
        {s ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatTile label="Balanced accuracy" value={pct(s.balancedAccuracy)} sub={`chance ${pct(s.chance)}`} />
            <StatTile label="Agreement with the expert (kappa)" value={num(s.kappa.kappa)} sub={kappaText(s.kappa)} />
            <StatTile
              label="Raw accuracy"
              value={pct(s.accuracy)}
              sub={
                (kind === "plan" ? `credit ${pct(s.score)}` : `${correct} of ${answers.length}`) +
                (baseline && (kind === "plan" || kind === "view") ? `; best constant answer ${pct(baseline.accuracy)}` : "")
              }
            />
            <StatTile label="Brier score" value={num(s.brier)} sub="0 is perfect; always 50% sure scores 0.25" />
            {s.weightedKappa && <StatTile label="Weighted kappa (ordinal)" value={num(s.weightedKappa.kappa)} sub={kappaText(s.weightedKappa)} />}
            {s.bias !== undefined && (
              <StatTile label="Grading bias" value={`${s.bias > 0 ? "+" : ""}${num(s.bias, 2)} categories`} sub={s.bias > 0.25 ? "over-calling" : s.bias < -0.25 ? "under-calling" : "no consistent direction"} />
            )}
            {s.significance && (
              <StatTile label="Significant (70% or more) vs not" value={pct(s.significance.balancedAccuracy)} sub={`kappa ${num(s.significance.kappa.kappa)}`} />
            )}
            {s.hitRate !== undefined && <StatTile label="Lesions found" value={pct(s.hitRate)} sub="click inside an expert box (10% margin)" />}
            {s.grading && s.grading.n > 0 && (
              <StatTile
                label="Grading of found lesions"
                value={pct(s.grading.balancedAccuracy)}
                sub={`weighted kappa ${num(s.grading.weightedKappa.kappa)}, bias ${s.grading.bias > 0 ? "+" : ""}${num(s.grading.bias, 2)}`}
              />
            )}
            {s.meanDistance !== undefined && (
              <StatTile label="Mean distance outside the category" value={`${s.meanDistance > 0 ? "+" : ""}${num(s.meanDistance, 1)} points`} sub="positive = over-calling" />
            )}
          </div>
        ) : (
          <div className="text-[14px] text-ink-soft">
            {correct} of {answers.length} right. Wrong reads come back tomorrow; right ones move further out.
          </div>
        )}
        {kind === "plan" ? (
          <div className="notice notice-info block text-[13px]">
            Not stratified: the reference is one operator's next view, so views appear as often as they do in that operator's practice. Always answering{" "}
            {baseline ? `"${baseline.option}" would have scored ${pct(baseline.accuracy)}` : "the commonest view would beat 1 in 10"} raw accuracy on this set; judge your score against that.
          </div>
        ) : kind === "view" && baseline && baseline.accuracy > s!.chance + 1e-9 ? (
          <div className="notice notice-info block text-[13px]">
            Accepting either name near a boundary raises raw accuracy: always answering "{baseline.option}" would have scored {pct(baseline.accuracy)} on this set. Balanced accuracy and kappa
            are not inflated this way. Choose "Leave borderline runs out" for a strict set.
          </div>
        ) : null}
        {kind === "grade" || kind === "estimate" ? (
          <div className="text-[12px] text-ink-faint">
            For scale: three operators grading the same lesions agreed with kappa {SEN2018_KAPPA.join(", ")} across the {GRADE_BINS.map((b) => b.label).join(", ")} categories (Sen 2018).
          </div>
        ) : null}
        <div>
          <div className="stat-label mb-1">Confidence against accuracy</div>
          <table className="text-[13px] w-full max-w-md">
            <thead>
              <tr className="text-ink-faint text-left">
                <th className="font-normal py-1">Stated confidence</th>
                <th className="font-normal">Runs</th>
                <th className="font-normal">Mean stated</th>
                <th className="font-normal">Actually right</th>
              </tr>
            </thead>
            <tbody>
              {cal.map((b) => (
                <tr key={b.lo} className="border-t border-line">
                  <td className="py-1 text-ink-soft">
                    {Math.round(100 * b.lo)}–{Math.round(100 * b.hi)}%
                  </td>
                  <td className="metric">{b.n}</td>
                  <td className="metric">{pct(b.meanConf)}</td>
                  <td className="metric">{pct(b.accuracy)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn btn-accent" onClick={onAgain}>
          {againLabel}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress: learning curves and calibration across sets (this browser only)
// ---------------------------------------------------------------------------
function Curve({ values, chance }: { values: number[]; chance: number }) {
  const W = 220;
  const H = 48;
  if (values.length < 2) return <span className="text-[12px] text-ink-faint">more sets needed</span>;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * (W - 4) + 2},${H - 2 - v * (H - 4)}`).join(" ");
  const c = Number.isFinite(chance) ? chance : 0.5;
  return (
    <svg width={W} height={H} className="text-accent" aria-label={`balanced accuracy by set; dashed line at chance ${Math.round(100 * c)}%`}>
      <line x1={0} x2={W} y1={H - 2 - c * (H - 4)} y2={H - 2 - c * (H - 4)} stroke="#2E343C" strokeDasharray="3 3" />
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}

function Progress() {
  const results = useMemo(() => loadResults(), []);
  const drills = DRILL_ORDER.filter((d) => results.some((r) => r.drill === d));
  // The expert-label drills and the simulated-run drill keep their answers under their own ids (not DrillKinds).
  const known = new Set<string>(DRILL_ORDER);
  const extras = [...registeredAngioDrills().map((d) => ({ id: d.id, label: d.label })), { id: SIM_RESULTS_DRILL, label: "TIMI flow (simulated runs)" }].filter(
    (d) => !known.has(d.id) && results.some((r) => r.drill === d.id)
  );
  if (!results.length)
    return <div className="panel p-6 text-[14px] text-ink-soft max-w-2xl">No drill results yet. Each answer you give is kept in this browser to draw your learning curves.</div>;
  return (
    <div className="space-y-3 max-w-5xl">
      <div className="text-[13px] text-ink-soft">
        Balanced accuracy per completed set; the dashed line is chance for that drill (1 divided by the number of reference classes answered). For the expert-label and simulated-run
        drills, the share of answers agreeing with the reference per set. Results stay in this browser.{" "}
        {results.length} answers recorded.
      </div>
      <div className="panel overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-ink-faint text-left border-b border-line">
              <th className="font-normal px-4 py-2">Drill</th>
              <th className="font-normal">Answers</th>
              <th className="font-normal">Last set</th>
              <th className="font-normal">Kappa (all)</th>
              <th className="font-normal">Brier (all)</th>
              <th className="font-normal">Bias</th>
              <th className="font-normal">Chance</th>
              <th className="font-normal px-4">Learning curve</th>
            </tr>
          </thead>
          <tbody>
            {drills.map((d) => {
              const rs = results.filter((r) => r.drill === d);
              const sets = [...new Set(rs.map((r) => r.set))];
              const perSet = sets.map((s) => {
                const x = rs.filter((r) => r.set === s);
                return summarise(
                  d,
                  x.map((r) => ({ ref: r.ref, ans: r.ans, correct: r.correct, credit: r.correct ? 1 : 0, conf: r.conf }))
                );
              });
              const all = summarise(
                d,
                rs.map((r) => ({ ref: r.ref, ans: r.ans, correct: r.correct, credit: r.correct ? 1 : 0, conf: r.conf }))
              );
              const last = perSet[perSet.length - 1];
              const chance = chanceLevel(rs.map((r) => r.ref));
              return (
                <tr key={d} className="border-b border-line/60">
                  <td className="px-4 py-2 text-ink">{DRILL_LABEL[d]}</td>
                  <td className="metric">{rs.length}</td>
                  <td className="metric">{last ? pct(last.balancedAccuracy) : "–"}</td>
                  <td className="metric">{num(all.kappa.kappa)}</td>
                  <td className="metric">{num(all.brier)}</td>
                  <td className="metric">{all.bias !== undefined ? `${all.bias > 0 ? "+" : ""}${num(all.bias)}` : "–"}</td>
                  <td className="metric">{pct(chance)}</td>
                  <td className="px-4 py-1">
                    <Curve values={perSet.map((p) => (Number.isFinite(p.balancedAccuracy) ? p.balancedAccuracy : 0))} chance={chance} />
                  </td>
                </tr>
              );
            })}
            {extras.map(({ id, label }) => {
              const rs = results.filter((r) => r.drill === id);
              // frame-count answers are counts, not classes: no kappa or chance level
              const counted = id === "frame-count";
              const share = (x: DrillResult[]) => (x.length ? x.filter((r) => r.correct).length / x.length : NaN);
              const perSet = [...new Set(rs.map((r) => r.set))].map((s) => share(rs.filter((r) => r.set === s)));
              const k = counted ? null : cohenKappa(rs.map((r) => r.ref), rs.map((r) => r.ans));
              const chance = counted ? NaN : chanceLevel(rs.map((r) => r.ref));
              return (
                <tr key={id} className="border-b border-line/60">
                  <td className="px-4 py-2 text-ink">{label}</td>
                  <td className="metric">{rs.length}</td>
                  <td className="metric">{perSet.length ? pct(perSet[perSet.length - 1]) : "–"}</td>
                  <td className="metric">{k ? num(k.kappa) : "–"}</td>
                  <td className="metric">{num(brier(rs.map((r) => r.conf), rs.map((r) => r.correct)))}</td>
                  <td className="metric">–</td>
                  <td className="metric">{pct(chance)}</td>
                  <td className="px-4 py-1">
                    <Curve values={perSet.map((v) => (Number.isFinite(v) ? v : 0))} chance={chance} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expert-label drills (angio-expert-label-drills). Each is scored against a supervising reader's labels
// served with the library (labels.ts) and opens once LABEL_GATE_MIN practice runs carry them; until then it
// says 'not yet labelled', and 'timi' and 'frame-count' open the simulated-run drill instead.
// ---------------------------------------------------------------------------
for (const id of LABEL_DRILL_IDS) {
  registerAngioDrill({
    id,
    label: LABEL_DRILLS[id].label,
    component: (p: ExtraDrillProps) => <LabelDrillView key={id} drill={id} runs={p.runs} data={p.data} />,
    gate: (runs) => {
      const g = drillGate(id, runs);
      if (g.open) return { open: true, note: `${g.labelled} labelled runs` };
      if (id === "timi" || id === "frame-count") return { open: true, note: "simulated runs" };
      return { open: false, note: `not yet labelled (${g.labelled} of ${g.needed} runs)` };
    },
  });
}

/** Tips the reveal shows: the drill's lesson tips, then the diagnostic lab's views tips for its events (labels.ts revealTips). */
function RevealTips({ tips }: { tips: LabTip[] }) {
  if (!tips.length) return null;
  return (
    <div className="mt-3">
      <div className="stat-label">From the lessons</div>
      {tips.map((t) => (
        <TipCard key={t.id} tip={t} />
      ))}
    </div>
  );
}

function OptionRow({ options, value, answer, revealed, onChange }: { options: string[]; value: number | undefined; answer?: number; revealed: boolean; onChange: (i: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o, k) => {
        const cls = !revealed
          ? value === k
            ? "border-accent bg-accent-tint text-ink"
            : "border-line hover:border-accent/50 text-ink-soft"
          : k === answer
            ? "border-good/60 bg-good/[0.08] text-ink"
            : k === value
              ? "border-danger/60 bg-danger/[0.08] text-ink"
              : "border-line opacity-60 text-ink-soft";
        return (
          <button key={o} disabled={revealed} onClick={() => onChange(k)} className={`rounded-md border px-2.5 py-1 text-[13px] ${cls}`}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

function LabelDrillView({ drill, runs, data }: { drill: LabelDrillId; runs: LibRun[]; data: LibDataset[] }) {
  const gate = useMemo(() => drillGate(drill, runs), [drill, runs]);
  // 'timi' and 'frame-count' open the simulated runs until the real runs are labelled (labels.ts flowDrillTarget)
  if ((drill === "timi" || drill === "frame-count") && flowDrillTarget(drill, runs) === "simulated") return <SimFlowDrillView gate={gate.labelled} />;
  if (!gate.open) {
    return (
      <div className="panel p-5 max-w-2xl text-[14px] text-ink-soft leading-relaxed space-y-2">
        <div className="text-ink font-semibold">{LABEL_DRILLS[drill].label}: not yet labelled</div>
        <p>
          This drill is scored against a supervising reader's labels and opens once at least {gate.needed} library runs carry them. {gate.labelled} run
          {gate.labelled === 1 ? " has" : "s have"} usable labels so far.
        </p>
        {gate.localOnly > 0 && (
          <p className="text-[13px] text-ink-faint">
            {gate.localOnly} run{gate.localOnly === 1 ? " is" : "s are"} labelled in this browser (Reader mode). Labels made or imported here are never used for scoring; the reader exports them and the
            owner places the file beside the dataset in the library.
          </p>
        )}
      </div>
    );
  }
  return <LabelDrillSet drill={drill} runs={runs} data={data} gate={gate} />;
}

interface LabelAnswered {
  item: LabelItem;
  answer: LabelAnswer;
  score: LabelScore;
}

function LabelDrillSet({ drill, runs, data, gate }: { drill: LabelDrillId; runs: LibRun[]; data: LibDataset[]; gate: ReturnType<typeof drillGate> }) {
  const recordSim = useProgressStore((s) => s.recordSim);
  const build = () => labelSet(drill, runs);
  const [items, setItems] = useState<LabelItem[]>(build);
  const [setNo, setSetNo] = useState(() => Date.now());
  const [i, setI] = useState(0);
  const [done, setDone] = useState<LabelAnswered[]>([]);
  const again = () => {
    setItems(build());
    setSetNo(Date.now());
    setI(0);
    setDone([]);
  };
  const it = items[i];
  const finished = items.length > 0 && i >= items.length;
  const commit = (a: LabelAnswer, sc: LabelScore) => {
    if (!it) return;
    saveResults([{ t: Date.now(), drill, runId: it.run.id, ref: sc.ref, ans: sc.ans, correct: sc.correct, conf: a.conf, set: setNo }]);
    setDone((d) => [...d, { item: it, answer: a, score: sc }]);
  };
  const next = () => {
    const ni = i + 1;
    setI(ni);
    if (ni >= items.length) recordSim(`angio-${drill}`, Math.round((100 * done.filter((d) => d.score.correct).length) / Math.max(1, done.length)));
  };
  return (
    <div className="space-y-3">
      <div className="text-[13px] text-ink-soft">
        {LABEL_DRILLS[drill].blurb} Reference: {gate.readers.length} supervising reader{gate.readers.length === 1 ? "" : "s"} ({gate.readers.join(", ")}), labels from{" "}
        {gate.files.join(", ")}; runs on which readers disagree are left out. {gate.labelled} labelled runs.
      </div>
      {items.length === 0 ? (
        <div className="panel p-6 text-[14px] text-ink-soft">Not enough labelled runs for a set.</div>
      ) : finished ? (
        <LabelReport drill={drill} done={done} onAgain={again} />
      ) : (
        <LabelCard key={`${setNo}-${i}`} item={it} index={i} total={items.length} data={data} answered={done[i]} onCommit={commit} onNext={next} />
      )}
    </div>
  );
}

const ACC_DEFAULT: AccAhaFeatures = {
  length: "<10",
  eccentric: false,
  access: "ready",
  angulation: "none",
  irregular: false,
  calcium: "light",
  branch: "none",
  ostial: false,
  occlusion: "none",
  thrombus: "none",
  degeneratedSvg: false,
};

/** The ACC/AHA features as Oxford's Table 8.2 arranges them (pm-planning-classification). */
function AccAhaForm({ value, onChange, disabled }: { value: AccAhaFeatures; onChange: (f: AccAhaFeatures) => void; disabled?: boolean }) {
  const sel = <K extends keyof AccAhaFeatures>(k: K, label: string, opts: [AccAhaFeatures[K], string][]) => (
    <label className="flex items-center justify-between gap-2 text-[13px]">
      <span className="text-ink-soft">{label}</span>
      <select
        disabled={disabled}
        className="field !h-7 text-[13px]"
        value={String(value[k])}
        onChange={(e) => onChange({ ...value, [k]: opts.find(([v]) => String(v) === e.target.value)![0] })}
      >
        {opts.map(([v, t]) => (
          <option key={String(v)} value={String(v)}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="space-y-1">
      {sel("length", "Length", [["<10", "under 10 mm"], ["10-20", "10–20 mm"], [">20", "over 20 mm"]])}
      {sel("eccentric", "Shape", [[false, "concentric"], [true, "eccentric"]])}
      {sel("access", "Access", [["ready", "readily accessible"], ["moderate", "moderate tortuosity"], ["excessive", "excessive tortuosity"]])}
      {sel("angulation", "Angulation", [["none", "not angulated"], ["moderate", "45–90°"], ["extreme", "over 90°"]])}
      {sel("irregular", "Contour", [[false, "smooth"], [true, "irregular"]])}
      {sel("calcium", "Calcium", [["light", "light or none"], ["moderate-heavy", "moderate or heavy"]])}
      {sel("branch", "Branches", [["none", "no side branch nearby"], ["protected", "protected side branch"], ["unprotected", "unprotected side branch"]])}
      {sel("ostial", "Position", [[false, "not ostial"], [true, "ostial"]])}
      {sel("occlusion", "Occlusion", [["none", "none"], ["under-3-months", "under 3 months old"], ["over-3-months", "over 3 months old"]])}
      {sel("thrombus", "Thrombus", [["none", "none"], ["some", "some"], ["heavy", "heavy burden"]])}
      {sel("degeneratedSvg", "Vein graft", [[false, "no"], [true, "degenerated vein graft"]])}
    </div>
  );
}

function LabelCard({
  item,
  index,
  total,
  data,
  answered,
  onCommit,
  onNext,
}: {
  item: LabelItem;
  index: number;
  total: number;
  data: LibDataset[];
  answered?: LabelAnswered;
  onCommit: (a: LabelAnswer, s: LabelScore) => void;
  onNext: () => void;
}) {
  const [parts, setParts] = useState<Record<string, number>>({});
  const [frames, setFrames] = useState<number | null>(null);
  const [marks, setMarks] = useState<{ from?: number; to?: number }>({});
  const [conf, setConf] = useState(CONF_DEFAULT);
  const [features, setFeatures] = useState<AccAhaFeatures>(ACC_DEFAULT);
  const [occluded, setOccluded] = useState(false);
  const revealed = !!answered;
  const ds = data.find((d) => d.dataset === item.run.dataset);
  const isClassify = item.drill === "classify";
  // classify: the type and class follow from the recorded features
  // an occlusion among the recorded features counts as an occluded vessel, as for the expert (labels.ts labelOccluded)
  const derived = isClassify ? { type: ACC_AHA_TYPES.indexOf(accAhaType(features)), scai: SCAI_CLASSES.indexOf(scaiClass(features, occluded || features.occlusion !== "none")) } : null;
  const answerParts = derived ? { type: derived.type, scai: derived.scai } : parts;
  const canSubmit = item.count ? frames !== null : item.parts.every((p) => answerParts[p.key] !== undefined);
  const submit = () => {
    if (revealed || !canSubmit) return;
    const a: LabelAnswer = { parts: answerParts, frames: item.count ? frames : undefined, conf };
    onCommit(a, scoreLabelItem(item, a));
  };
  const onFrameMark = (id: string, f: number) => {
    const m = { ...marks, [id]: f };
    setMarks(m);
    // a landmark marked before the origin gives no count rather than 0
    if (m.from !== undefined && m.to !== undefined) setFrames(m.to >= m.from ? m.to - m.from : null);
  };
  const markOrderWrong = marks.from !== undefined && marks.to !== undefined && marks.to < marks.from;
  const l = item.label;
  return (
    <div className="grid xl:grid-cols-12 gap-4">
      <div className="xl:col-span-7 space-y-2">
        <CinePlayer
          key={item.run.id}
          run={item.run}
          autoPlay={!item.mark}
          startFrame={item.mark?.frame}
          allowBoxes={revealed}
          hideFrameInfo={!revealed}
          marks={item.mark ? [{ ...item.mark, tone: "neutral" }] : undefined}
          frameMarks={
            item.count && !revealed
              ? [
                  { id: "from", label: "Contrast across the origin", frame: marks.from },
                  { id: "to", label: "Reaches the landmark", frame: marks.to },
                ]
              : undefined
          }
          onFrameMark={onFrameMark}
        />
        <Attribution ds={ds} />
      </div>
      <div className="xl:col-span-5">
        <div className="panel">
          <div className="panel-head">
            <span>{LABEL_DRILLS[item.drill].label}</span>
            <span className="chip">
              {index + 1} / {total}
            </span>
          </div>
          <div className="p-4 space-y-3">
            <div className="text-[14.5px] text-ink">{item.question}</div>
            {isClassify ? (
              <>
                <AccAhaForm value={features} onChange={setFeatures} disabled={revealed} />
                <label className="flex items-center gap-2 text-[13px] text-ink-soft">
                  <input type="checkbox" checked={occluded} disabled={revealed} onChange={(e) => setOccluded(e.target.checked)} /> target vessel occluded
                </label>
                <div className="text-[13px] text-ink">
                  Your features give ACC/AHA type {ACC_AHA_TYPES[derived!.type]} and SCAI class {SCAI_CLASSES[derived!.scai]}.
                </div>
              </>
            ) : (
              item.parts.map((p) => (
                <div key={p.key}>
                  <div className="stat-label mb-1">{p.prompt}</div>
                  <OptionRow
                    options={p.options}
                    value={parts[p.key]}
                    answer={revealed ? (p.scored === false ? parts[p.key] : p.answer) : undefined}
                    revealed={revealed}
                    onChange={(k) => setParts((x) => ({ ...x, [p.key]: k }))}
                  />
                </div>
              ))
            )}
            {item.count && (
              <label className="block text-[13px] text-ink-soft">
                Frames counted at {item.count.fps} frames per second
                <input
                  type="number"
                  min={0}
                  max={500}
                  disabled={revealed}
                  value={frames ?? ""}
                  onChange={(e) => setFrames(e.target.value === "" ? null : Math.max(0, Math.round(Number(e.target.value))))}
                  className="field !h-8 w-24 ml-2"
                />
                {markOrderWrong && !revealed && <span className="block text-[12px] text-warn mt-1">The landmark frame is before the origin frame.</span>}
              </label>
            )}
            <ConfidenceSlider value={conf} onChange={setConf} disabled={revealed} />
            {!revealed ? (
              <button className="btn btn-accent" disabled={!canSubmit} onClick={submit}>
                Submit
              </button>
            ) : (
              <div className="animate-fadein space-y-2 text-[13px] text-ink-soft">
                <div className={`text-sm font-semibold ${answered!.score.correct ? "text-good" : "text-danger"}`}>{answered!.score.correct ? "Agrees with the expert" : "Differs from the expert"}</div>
                <ExpertSummary item={item} />
                <div className="text-[12px] text-ink-faint">
                  Labelled by {item.readers.join(", ")} on {l.date || "an unrecorded date"} ({l.file}).
                </div>
                <RevealTips tips={labelRevealTips(item)} />
                <button className="btn btn-accent" onClick={onNext}>
                  {index + 1 < total ? "Next run" : "Finish"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The reader's label in words, after the answer. */
function ExpertSummary({ item }: { item: LabelItem }) {
  const l = item.label;
  const rows: string[] = [];
  if (item.drill === "timi") rows.push(`Expert grade: TIMI ${l.timi}${l.comparisonBed ? `, compared with the ${l.comparisonBed === "proximal" ? "proximal segment" : "opposite artery"}` : ""}.`);
  if (item.drill === "frame-count" && item.count) {
    const c = item.count;
    rows.push(`Expert count: ${c.frames} frames at ${c.fps} frames per second (agreement within ${c.tolerance} frames).`);
    if (c.vessel === "LAD") rows.push(`Corrected for the LAD (divided by 1.7): ${correctedFrameCount(c.frames, { vessel: "LAD", runFps: c.fps }).toFixed(1)} frames at ${c.fps} frames per second.`);
    const n = frameCountNormals(c.fps);
    rows.push(n ? n.text : "No published normal count is shown: the original study's frame rate has not been verified from the full paper.");
  }
  if (item.drill === "morphology") rows.push(`Expert: thrombus ${THROMBUS_OPTIONS[l.thrombusGrade ?? 0]}, calcium ${l.calcium}, dissection ${l.nhlbi === "none" ? "none" : `NHLBI type ${l.nhlbi}`}.`);
  if (item.drill === "calcium") rows.push(`Expert calcium grade: ${l.calcium}.`);
  if (item.drill === "collateral-grade") rows.push(`Expert: ${l.donor} to ${l.recipient}, Rentrop ${l.rentrop}, Werner CC${l.wernerCC}, ${l.channel} channel.`);
  if (item.drill === "medina" && l.medina)
    rows.push(`Expert Medina ${l.medina.pmv},${l.medina.dmv},${l.medina.sb}${l.medina.sideBranchMm !== undefined ? `; side branch about ${l.medina.sideBranchMm} mm` : ""}.`);
  if (item.drill === "classify" && l.accAha) {
    const c = typeCFeatures(l.accAha);
    const b = typeBFeatures(l.accAha);
    rows.push(`Expert features give type ${accAhaType(l.accAha)} and SCAI class ${scaiClass(l.accAha, labelOccluded(l))}${c.length ? `; type C: ${c.join(", ")}` : ""}${b.length ? `; type B: ${b.join(", ")}` : ""}.`);
  }
  if (item.drill === "segment") {
    const sp = l.segmentPoints?.find((p) => p.frame === item.mark?.frame && p.x === item.mark?.x && p.y === item.mark?.y);
    const seg = SYNTAX_SEGMENTS.find((s) => s.id === sp?.segment);
    rows.push(`Expert: segment ${sp?.segment} (${seg?.name}), ${l.dominance} dominance.`);
  }
  if (l.note) rows.push(`Reader's note: ${l.note}`);
  return (
    <div className="space-y-1">
      {rows.map((r) => (
        <div key={r}>{r}</div>
      ))}
    </div>
  );
}

function LabelReport({ drill, done, onAgain }: { drill: LabelDrillId; done: LabelAnswered[]; onAgain: () => void }) {
  const ok = done.map((d) => d.score.correct);
  const first = done[0]?.item.parts[0];
  const k = first ? cohenKappa(done.map((d) => d.score.ref), done.map((d) => d.score.ans), first.ordinal ? "linear" : "none", first.options.length) : null;
  return (
    <div className="panel max-w-3xl">
      <div className="panel-head">
        <span>Set complete · {LABEL_DRILLS[drill].label}</span>
        <span className="chip">{done.length} runs</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatTile label="Agreement with the expert" value={`${ok.filter(Boolean).length} of ${done.length}`} sub="every part right" />
          {k && first && <StatTile label={`${first.ordinal ? "Weighted kappa" : "Kappa"}: ${first.prompt}`} value={num(k.kappa)} sub={kappaText(k)} />}
          <StatTile label="Brier score" value={num(brier(done.map((d) => d.answer.conf), ok))} sub="0 is perfect; always 50% sure scores 0.25" />
        </div>
        <button className="btn btn-accent" onClick={onAgain}>
          New set
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Simulated-run TIMI and frame-count drill (simFlowDrill.ts): the engine sets each run's flow, so the grade and
// the count shown after the answer are model values.
// ---------------------------------------------------------------------------
interface SimAnswered {
  item: SimFlowItem;
  timi: TimiGrade;
  frames: number | null;
  conf: number;
  score: SimFlowScore;
}

/** The results-store key of simulated-run answers, kept apart from the real-run 'timi' drill. */
const SIM_RESULTS_DRILL = "timi-simulated";

function SimFlowDrillView({ gate }: { gate?: number }) {
  const recordSim = useProgressStore((s) => s.recordSim);
  const [items, setItems] = useState<SimFlowItem[]>(() => simFlowSet(2));
  const [setNo, setSetNo] = useState(() => Date.now());
  const [i, setI] = useState(0);
  const [done, setDone] = useState<SimAnswered[]>([]);
  const finished = i >= items.length;
  const again = () => {
    setItems(simFlowSet(2));
    setSetNo(Date.now());
    setI(0);
    setDone([]);
  };
  const next = () => {
    const ni = i + 1;
    setI(ni);
    if (ni >= items.length) recordSim("angio-timi-simulated", Math.round((100 * done.filter((d) => d.score.gradeCorrect).length) / Math.max(1, done.length)));
  };
  return (
    <div className="space-y-3">
      <div className="notice notice-info block text-[13px]">
        Simulated runs: the model sets each run's coronary flow, so the TIMI grade and frame count shown after your answer are the model's values, not an observer's. The same drill on
        real library runs opens once a supervising reader has labelled at least 20 of them{gate !== undefined ? ` (${gate} so far)` : ""}.
      </div>
      {finished ? (
        <SimFlowReport done={done} onAgain={again} />
      ) : (
        <SimFlowCard
          key={`${setNo}-${i}`}
          item={items[i]}
          index={i}
          total={items.length}
          answered={done[i]}
          onCommit={(a) => {
            // kept apart from the real-run 'timi' results: these grades are the model's, not a reader's
            saveResults([{ t: Date.now(), drill: SIM_RESULTS_DRILL, runId: a.item.spec.id, ref: a.item.truth.timi, ans: a.timi, correct: a.score.gradeCorrect, conf: a.conf, set: setNo }]);
            setDone((d) => [...d, a]);
          }}
          onNext={next}
        />
      )}
    </div>
  );
}

function SimFlowCard({ item, index, total, answered, onCommit, onNext }: { item: SimFlowItem; index: number; total: number; answered?: SimAnswered; onCommit: (a: SimAnswered) => void; onNext: () => void }) {
  const [run, setRun] = useState<CineRun | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [timi, setTimi] = useState<TimiGrade | null>(null);
  const [frames, setFrames] = useState<number | null>(null);
  const [noLandmark, setNoLandmark] = useState(false);
  const [marks, setMarks] = useState<{ from?: number; to?: number }>({});
  const [conf, setConf] = useState(CONF_DEFAULT);
  const revealed = !!answered;
  useEffect(() => {
    let alive = true;
    setRun(null);
    setErr(null);
    renderSimFlowRun(item.spec)
      .then((r) => alive && setRun({ id: r.id, base: "", frames: r.frames, fps: r.fps }))
      .catch((e) => alive && setErr(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, [item.spec]);
  const canSubmit = timi !== null && (noLandmark || frames !== null);
  const submit = () => {
    if (!canSubmit || revealed) return;
    const a = { timi: timi!, frames: noLandmark ? null : frames, conf };
    onCommit({ item, ...a, score: scoreSimFlow(item, a) });
  };
  const onFrameMark = (id: string, f: number) => {
    const m = { ...marks, [id]: f };
    setMarks(m);
    if (m.from !== undefined && m.to !== undefined) {
      // a landmark marked before the origin gives no count rather than 0
      setFrames(m.to >= m.from ? m.to - m.from : null);
      setNoLandmark(false);
    }
  };
  const markOrderWrong = marks.from !== undefined && marks.to !== undefined && marks.to < marks.from;
  return (
    <div className="grid xl:grid-cols-12 gap-4">
      <div className="xl:col-span-7 space-y-2">
        {run ? (
          <CinePlayer
            key={run.id}
            run={run}
            frameMarks={
              !revealed
                ? [
                    { id: "from", label: "Contrast across the origin", frame: marks.from },
                    { id: "to", label: "Reaches the landmark", frame: marks.to },
                  ]
                : undefined
            }
            onFrameMark={onFrameMark}
          />
        ) : (
          <div className="bg-black rounded-md grid place-items-center text-ink-faint text-sm" style={{ width: "100%", maxWidth: 520, aspectRatio: "1 / 1" }}>
            {err ?? "Filming the run…"}
          </div>
        )}
        <div className="text-[12px] text-ink-faint">Simulated run filmed through the diagnostic renderer at {item.spec.fps} frames per second.</div>
      </div>
      <div className="xl:col-span-5">
        <div className="panel">
          <div className="panel-head">
            <span>TIMI flow and frame count</span>
            <span className="chip">
              {index + 1} / {total}
            </span>
          </div>
          <div className="p-4 space-y-3">
            <div className="text-[14.5px] text-ink">{item.question}</div>
            <div>
              <div className="stat-label mb-1">TIMI flow grade</div>
              <OptionRow options={TIMI_GRADES.map((g) => `TIMI ${g}`)} value={timi ?? undefined} answer={revealed ? item.truth.timi : undefined} revealed={revealed} onChange={(k) => setTimi(k as TimiGrade)} />
            </div>
            <div className="text-[13px] text-ink-soft space-y-1">
              <label className="block">
                Frames from the origin to the landmark, at {item.spec.fps} frames per second
                <input
                  type="number"
                  min={0}
                  max={500}
                  disabled={revealed || noLandmark}
                  value={frames ?? ""}
                  onChange={(e) => setFrames(e.target.value === "" ? null : Math.max(0, Math.round(Number(e.target.value))))}
                  className="field !h-8 w-24 ml-2"
                />
                {markOrderWrong && !revealed && !noLandmark && <span className="block text-[12px] text-warn mt-1">The landmark frame is before the origin frame.</span>}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={noLandmark} disabled={revealed} onChange={(e) => setNoLandmark(e.target.checked)} /> contrast does not reach the landmark during the run
              </label>
            </div>
            <ConfidenceSlider value={conf} onChange={setConf} disabled={revealed} />
            {!revealed ? (
              <button className="btn btn-accent" disabled={!canSubmit} onClick={submit}>
                Submit
              </button>
            ) : (
              <div className="animate-fadein space-y-1 text-[13px] text-ink-soft">
                <div className={`text-sm font-semibold ${answered!.score.gradeCorrect ? "text-good" : "text-danger"}`}>
                  {answered!.score.gradeCorrect ? "Grade agrees with the model" : `The model's grade is ${TIMI_LABEL[item.truth.timi]}`}
                </div>
                <div className={answered!.score.countCorrect ? "text-good" : "text-warn"}>
                  {answered!.score.countCorrect
                    ? "Count agrees with the model's"
                    : answered!.score.countError !== null
                      ? `Count ${Math.abs(answered!.score.countError)} frames ${answered!.score.countError > 0 ? "over" : "under"} the model's (agreement within ${SIM_FRAME_TOLERANCE})`
                      : "Count differs from the model's"}
                </div>
                {describeTruth(item).map((t) => (
                  <div key={t}>{t}</div>
                ))}
                <RevealTips tips={revealTips(simFlowTipContext(item), LABEL_DRILLS.timi.tips)} />
                <button className="btn btn-accent mt-2" onClick={onNext}>
                  {index + 1 < total ? "Next run" : "Finish"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SimFlowReport({ done, onAgain }: { done: SimAnswered[]; onAgain: () => void }) {
  const grades = done.filter((d) => d.score.gradeCorrect).length;
  const counts = done.filter((d) => d.score.countCorrect).length;
  const k = cohenKappa(done.map((d) => d.item.truth.timi), done.map((d) => d.timi), "linear", 4);
  return (
    <div className="panel max-w-3xl">
      <div className="panel-head">
        <span>Set complete · TIMI flow on simulated runs</span>
        <span className="chip">{done.length} runs</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatTile label="Grades agreeing with the model" value={`${grades} of ${done.length}`} />
          <StatTile label="Weighted kappa (grade)" value={num(k.kappa)} sub={kappaText(k)} />
          <StatTile label="Counts within tolerance" value={`${counts} of ${done.length}`} sub={`within ${SIM_FRAME_TOLERANCE} frames, or both 'does not reach'`} />
          <StatTile label="Brier score (grade)" value={num(brier(done.map((d) => d.conf), done.map((d) => d.score.gradeCorrect)))} />
        </div>
        <div className="text-[12px] text-ink-faint">Model values throughout: the set has the same number of runs of each grade, so always giving one grade scores a quarter.</div>
        <button className="btn btn-accent" onClick={onAgain}>
          New set
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reader mode (Settings): the supervising reader labels the run on screen in the Library tab. The labels stay in
// this browser until exported; they are shown here and never used for scoring.
// ---------------------------------------------------------------------------
function ReaderPanel({
  run,
  pendingPoint,
  onClearPoint,
  marked,
}: {
  run: LibRun;
  pendingPoint: { x: number; y: number; frame: number } | null;
  onClearPoint: () => void;
  /** origin and landmark frames noted with the player's buttons */
  marked: { from?: number; to?: number };
}) {
  const name = useReaderStore((s) => s.name);
  const labels = useReaderStore((s) => s.labels);
  const setLabel = useReaderStore((s) => s.setLabel);
  const mine: ExpertLabel | undefined = labels.find((l) => l.run === run.id && l.reader === name);
  const [segment, setSegment] = useState<string>("");
  const patch = (p: Partial<ExpertLabel>) => {
    const next = { ...stripMeta(mine), ...p };
    // segment points belong to the dominance they were placed in: changing or clearing it drops the points that no longer exist
    if ("dominance" in p && next.segmentPoints?.length) {
      const ok = new Set(next.dominance ? segmentsFor(next.dominance).map((x) => x.id) : []);
      const kept = next.segmentPoints.filter((x) => ok.has(x.segment));
      next.segmentPoints = kept.length ? kept : undefined;
    }
    setLabel(run.id, next);
  };
  const field = <T,>(label: string, value: T | undefined, opts: [T, string][], key: keyof ExpertLabel) => (
    <label className="flex items-center justify-between gap-2">
      <span className="text-ink-soft">{label}</span>
      <select
        className="field !h-7 text-[13px]"
        value={value === undefined ? "" : String(value)}
        onChange={(e) => patch({ [key]: e.target.value === "" ? undefined : opts.find(([v]) => String(v) === e.target.value)?.[0] } as Partial<ExpertLabel>)}
      >
        <option value="">not labelled</option>
        {opts.map(([v, t]) => (
          <option key={String(v)} value={String(v)}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
  const fc = mine?.frameCount;
  const dom = mine?.dominance ?? "right";
  return (
    <div className="panel p-3 text-[13px] space-y-2">
      <div className="flex items-center justify-between">
        <span className="stat-label">Reader mode · {name}</span>
        {mine && (
          <button className="btn btn-ghost !h-7 text-[12px]" onClick={() => setLabel(run.id, null)}>
            Clear this run's labels
          </button>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
        {field("TIMI flow", mine?.timi, [[0, "0"], [1, "1"], [2, "2"], [3, "3"]], "timi")}
        {field("Compared with", mine?.comparisonBed, [["proximal", "proximal segment"], ["opposite", "opposite artery"]], "comparisonBed")}
        {field("Thrombus grade", mine?.thrombusGrade, [[0, "0"], [1, "1"], [2, "2"], [3, "3"], [4, "4"], [5, "5"]], "thrombusGrade")}
        {field("Calcium", mine?.calcium, CALCIUM_OPTIONS.map((c) => [c, c]), "calcium")}
        {field("NHLBI dissection", mine?.nhlbi, NHLBI_OPTIONS.map((t) => [t, t === "none" ? "none" : `type ${t}`]), "nhlbi")}
        {field("Rentrop", mine?.rentrop, [[0, "0"], [1, "1"], [2, "2"], [3, "3"]], "rentrop")}
        {field("Werner", mine?.wernerCC, [[0, "CC0"], [1, "CC1"], [2, "CC2"]], "wernerCC")}
        {field("Channel", mine?.channel, [["septal", "septal"], ["epicardial", "epicardial"]], "channel")}
        {field("Donor", mine?.donor, [["LAD", "LAD"], ["LCx", "LCx"], ["RCA", "RCA"]], "donor")}
        {field("Recipient", mine?.recipient, [["LAD", "LAD"], ["LCx", "LCx"], ["RCA", "RCA"]], "recipient")}
        {field("Dominance", mine?.dominance, [["right", "right"], ["left", "left"]], "dominance")}
      </div>
      <div className="border-t border-line pt-2 space-y-1">
        <div className="stat-label">Frame count</div>
        <div className="text-ink-soft">
          Use the player's frame buttons, then save. {fc ? `Saved: ${fc.vessel} ${fc.frames} frames at ${run.fps} frames per second.` : "Not labelled."}
        </div>
        <FrameCountEditor run={run} value={fc} marked={marked} onSave={(f) => patch({ frameCount: f })} />
      </div>
      <div className="border-t border-line pt-2 space-y-1">
        <div className="stat-label">Medina</div>
        <MedinaEditor value={mine?.medina} onSave={(m) => patch({ medina: m })} />
      </div>
      <div className="border-t border-line pt-2 space-y-1">
        <div className="stat-label">SYNTAX segment points ({dom} dominance)</div>
        <div className="flex flex-wrap items-center gap-2">
          <select className="field !h-7 text-[13px]" value={segment} onChange={(e) => setSegment(e.target.value)}>
            <option value="">segment…</option>
            {segmentsFor(dom).map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} {s.name}
              </option>
            ))}
          </select>
          <span className="text-ink-faint">{pendingPoint ? `point on frame ${pendingPoint.frame}` : "click the image to place a point"}</span>
          <button
            className="btn !h-7"
            disabled={!pendingPoint || !segment || !mine?.dominance}
            title={!mine?.dominance ? "Label the dominance first" : undefined}
            onClick={() => {
              if (!pendingPoint || !segment) return;
              patch({ segmentPoints: [...(mine?.segmentPoints ?? []), { frame: pendingPoint.frame, x: Math.round(pendingPoint.x), y: Math.round(pendingPoint.y), segment }] });
              onClearPoint();
            }}
          >
            Add point
          </button>
        </div>
        {(mine?.segmentPoints ?? []).length > 0 && (
          <div className="text-ink-faint">
            {(mine?.segmentPoints ?? []).map((p) => `segment ${p.segment} (frame ${p.frame})`).join(" · ")}{" "}
            <button className="underline" onClick={() => patch({ segmentPoints: undefined })}>
              clear
            </button>
          </div>
        )}
      </div>
      <div className="border-t border-line pt-2 space-y-1">
        <div className="stat-label">ACC/AHA features</div>
        <AccAhaForm value={mine?.accAha ?? ACC_DEFAULT} onChange={(f) => patch({ accAha: f })} />
        {mine?.accAha && (
          <div className="text-ink-faint">
            Type {accAhaType(mine.accAha)}, SCAI class {scaiClass(mine.accAha, labelOccluded(mine))}.{" "}
            <button className="underline" onClick={() => patch({ accAha: undefined })}>
              clear
            </button>
          </div>
        )}
      </div>
      <label className="block">
        <span className="text-ink-soft">Note</span>
        <input className="field !h-7 w-full text-[13px]" value={mine?.note ?? ""} onChange={(e) => patch({ note: e.target.value || undefined })} />
      </label>
    </div>
  );
}

const stripMeta = (l?: ExpertLabel): Partial<ExpertLabel> => {
  if (!l) return {};
  const { run: _r, reader: _n, date: _d, ...rest } = l;
  void _r;
  void _n;
  void _d;
  return rest;
};

function FrameCountEditor({
  run,
  value,
  marked,
  onSave,
}: {
  run: LibRun;
  value?: ExpertLabel["frameCount"];
  marked: { from?: number; to?: number };
  onSave: (f: ExpertLabel["frameCount"]) => void;
}) {
  const [vessel, setVessel] = useState<"LAD" | "LCx" | "RCA">(value?.vessel ?? (run.artery === "RCA" ? "RCA" : "LAD"));
  const [from, setFrom] = useState<number | "">(value?.fromFrame ?? "");
  const [to, setTo] = useState<number | "">(value?.toFrame ?? "");
  useEffect(() => {
    if (marked.from !== undefined) setFrom(marked.from);
  }, [marked.from]);
  useEffect(() => {
    if (marked.to !== undefined) setTo(marked.to);
  }, [marked.to]);
  const [landmark, setLandmark] = useState(value?.landmark ?? "");
  const n = (v: string) => (v === "" ? "" : Math.max(1, Math.round(Number(v))));
  const ok = from !== "" && to !== "" && to >= from;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select className="field !h-7 text-[13px]" value={vessel} onChange={(e) => setVessel(e.target.value as typeof vessel)}>
        <option value="LAD">LAD</option>
        <option value="LCx">LCx</option>
        <option value="RCA">RCA</option>
      </select>
      <input className="field !h-7 w-20 text-[13px]" type="number" placeholder="origin" value={from} onChange={(e) => setFrom(n(e.target.value))} />
      <input className="field !h-7 w-20 text-[13px]" type="number" placeholder="landmark" value={to} onChange={(e) => setTo(n(e.target.value))} />
      <input className="field !h-7 flex-1 min-w-[8rem] text-[13px]" placeholder="landmark in words" value={landmark} onChange={(e) => setLandmark(e.target.value)} />
      <button
        className="btn !h-7"
        disabled={!ok}
        onClick={() => ok && onSave({ vessel, frames: (to as number) - (from as number), fromFrame: from as number, toFrame: to as number, ...(landmark ? { landmark } : {}) })}
      >
        Save count
      </button>
      {value && (
        <button className="btn btn-ghost !h-7" onClick={() => onSave(undefined)}>
          Clear
        </button>
      )}
    </div>
  );
}

function MedinaEditor({ value, onSave }: { value?: ExpertLabel["medina"]; onSave: (m: ExpertLabel["medina"]) => void }) {
  const [d, setD] = useState<[0 | 1, 0 | 1, 0 | 1]>(value ? [value.pmv, value.dmv, value.sb] : [0, 0, 0]);
  const [mm, setMm] = useState<string>(value?.sideBranchMm !== undefined ? String(value.sideBranchMm) : "");
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(["proximal MV", "distal MV", "side branch"] as const).map((t, k) => (
        <label key={t} className="flex items-center gap-1 text-ink-soft">
          <input type="checkbox" checked={d[k] === 1} onChange={(e) => setD((x) => x.map((v, j) => (j === k ? (e.target.checked ? 1 : 0) : v)) as [0 | 1, 0 | 1, 0 | 1])} /> {t}
        </label>
      ))}
      <input className="field !h-7 w-24 text-[13px]" type="number" step={0.25} min={0.5} max={6} placeholder="SB mm" value={mm} onChange={(e) => setMm(e.target.value)} />
      <button className="btn !h-7" onClick={() => onSave({ pmv: d[0], dmv: d[1], sb: d[2], ...(mm !== "" && Number(mm) > 0 ? { sideBranchMm: Number(mm) } : {}) })}>
        Save Medina
      </button>
      {value && (
        <button className="btn btn-ghost !h-7" onClick={() => onSave(undefined)}>
          Clear
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Revascularisation decision drills on real AngioCAD studies (angio-decision-drills).
//
// The dataset records no symptoms, ischaemic burden, previous CABG, surgical risk or preference, and nothing is
// generated for a real patient (LAB_BUILD_PLAN section 7, pm-target#1). The plan drill's 'missing-facts' step shows
// only the dataset's fields, has the learner count the diseased vessels from the runs, then asks which facts the
// decision needs that the record does not give; the SYNTAX drill marks lesions by segment and compares the set
// with the AngioCAD grades, without totalling a score (../angio/syntax.ts).
// ---------------------------------------------------------------------------

const MISSING_FACTS_BLURB =
  "Real stable-angina studies with only the dataset's fields: count the diseased vessels from the runs, then name the facts the decision needs that this record does not give. Nothing is invented for a real patient.";

function StudyRuns({ p, data, revealed }: { p: LibPatient; data: LibDataset[]; revealed: boolean }) {
  const [run, setRun] = useState<LibRun | null>(null);
  const cur = run && p.runs.includes(run) ? run : p.runs[0];
  return (
    <div className="space-y-2">
      <CinePlayer key={cur.id} run={cur} showBoxes={revealed} allowBoxes={revealed} hideFrameInfo={!revealed} />
      <div className="flex flex-wrap gap-1">
        {p.runs.map((r, i) => (
          <button key={r.id} onClick={() => setRun(r)} className={`rounded border px-2 py-0.5 text-[12px] font-mono ${cur.id === r.id ? "border-accent bg-accent-tint text-ink" : "border-line text-ink-soft"}`}>
            {i + 1} {r.artery ?? ""}
          </button>
        ))}
      </div>
      <Attribution ds={data.find((d) => d.dataset === p.dataset)} />
    </div>
  );
}

function DatasetFields({ p }: { p: LibPatient }) {
  return (
    <div>
      <div className="stat-label mb-1">What the dataset records</div>
      <dl className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] gap-x-3 gap-y-0.5 text-[13px]">
        {angioCadFields(p).map((f) => (
          <div key={f.id} className="contents">
            <dt className="text-ink-faint">{f.label}</dt>
            <dd className="text-ink">{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SegmentGrades({ p }: { p: LibPatient }) {
  const segs = p.segments ?? {};
  return (
    <div className="grid grid-cols-2 gap-x-3 text-[12px] text-ink-soft sm:grid-cols-3">
      {ANGIOCAD_SEGMENTS.map((s) => (
        <span key={s}>
          {s}: <span className="text-ink">{segs[s] === "NL" || !segs[s] ? "normal" : `${segs[s]}%`}</span>
        </span>
      ))}
    </div>
  );
}

interface FactsAnswered {
  id: string;
  vesselsOk: boolean;
  lmOk: boolean;
  facts: number;
  of: number;
}

function MissingFactsDrill({ patients, data }: { patients: LibPatient[]; data: LibDataset[] }) {
  const recordSim = useProgressStore((s) => s.recordSim);
  const studies = useMemo(() => revascStudies(patients), [patients]);
  const [set, setSet] = useState<LibPatient[]>(() => revascSet(studies));
  const [i, setI] = useState(0);
  const [vessels, setVessels] = useState<number | null>(null);
  const [lm, setLm] = useState<boolean | null>(null);
  const [counted, setCounted] = useState(false);
  const [facts, setFacts] = useState<Set<string>>(() => new Set());
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState<FactsAnswered[]>([]);
  const p = set[i];
  const reset = () => {
    setVessels(null);
    setLm(null);
    setCounted(false);
    setFacts(new Set());
    setRevealed(false);
  };
  if (!studies.length) return <div className="panel p-6 text-[14px] text-ink-soft">No stable-angina AngioCAD studies are installed.</div>;
  if (!p) {
    const vOk = done.filter((d) => d.vesselsOk && d.lmOk).length;
    const fOk = done.reduce((a, d) => a + d.facts, 0);
    const fOf = done.reduce((a, d) => a + d.of, 0);
    return (
      <div className="panel p-5 max-w-2xl space-y-3 text-[14px]">
        <div className="text-ink font-semibold">Set complete · before the decision</div>
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Vessel count and left main" value={`${vOk} of ${done.length}`} sub="against the AngioCAD segment grades" />
          <StatTile label="Facts judged correctly" value={`${fOk} of ${fOf}`} sub="missing or recorded, per fact" />
        </div>
        <button
          className="btn btn-accent"
          onClick={() => {
            setSet(revascSet(studies));
            setI(0);
            setDone([]);
            reset();
          }}
        >
          New set
        </button>
      </div>
    );
  }
  const extent = angioCadExtent(p);
  const sc = revealed ? scoreMissingFacts(p, facts) : null;
  const vesselsOk = vessels === extent.vessels;
  const lmOk = lm === extent.leftMain;
  const reveal = () => {
    const s = scoreMissingFacts(p, facts);
    setRevealed(true);
    const rec = { id: p.id, vesselsOk, lmOk, facts: s.correct, of: s.total };
    setDone((d) => [...d, rec]);
    recordSim("angio-plan-missing-facts", Math.round(100 * (((vesselsOk && lmOk ? 1 : 0) + s.correct / s.total) / 2)));
  };
  return (
    <div className="grid xl:grid-cols-12 gap-4">
      <div className="xl:col-span-7">
        <StudyRuns key={p.id} p={p} data={data} revealed={revealed} />
      </div>
      <div className="xl:col-span-5 space-y-3">
        <div className="panel p-4 space-y-3 text-[13px]">
          <div className="stat-label">
            Study {i + 1} of {set.length} · AngioCAD · {p.runs.length} runs. Review them all before you answer.
          </div>
          <DatasetFields p={p} />
        </div>
        <div className="panel p-4 space-y-3 text-[13px]">
          <div>
            <div className="text-ink-soft mb-1">How many major epicardial arteries have a stenosis over 50%? (LAD with its diagonals, circumflex with its marginal, RCA)</div>
            <div className="seg">
              {[0, 1, 2, 3].map((v) => (
                <button key={v} disabled={counted} onClick={() => setVessels(v)} className={`seg-btn !px-3 ${vessels === v ? "seg-btn-active" : ""}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-ink-soft mb-1">Is there left main disease over 50%?</div>
            <div className="seg">
              {[true, false].map((v) => (
                <button key={String(v)} disabled={counted} onClick={() => setLm(v)} className={`seg-btn !px-3 ${lm === v ? "seg-btn-active" : ""}`}>
                  {v ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>
          {!counted && (
            <button className="btn btn-accent" disabled={vessels === null || lm === null} onClick={() => setCounted(true)}>
              Next: what the decision needs
            </button>
          )}
        </div>
        {counted && (
          <div className="panel p-4 space-y-2 text-[13px] animate-fadein">
            <div className="text-ink-soft">
              Before deciding between no revascularisation, PCI, CABG and the heart team, which of these would you still need that this record does not give you? Tick each one that is missing.
            </div>
            <div className="space-y-1">
              {STABLE_FACTS.map((f) => {
                const row = sc?.rows.find((r) => r.id === f.id);
                return (
                  <label key={f.id} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      disabled={revealed}
                      checked={facts.has(f.id)}
                      onChange={(e) =>
                        setFacts((x) => {
                          const n = new Set(x);
                          if (e.target.checked) n.add(f.id);
                          else n.delete(f.id);
                          return n;
                        })
                      }
                    />
                    <span className={row ? (row.correct ? "text-ink" : "text-danger") : "text-ink"}>
                      {f.label}
                      {row && <span className="text-ink-faint"> · {row.missing ? "missing from the record" : "the record or the runs give it"}</span>}
                    </span>
                  </label>
                );
              })}
            </div>
            {!revealed ? (
              <button className="btn btn-accent" onClick={reveal}>
                Compare with the dataset
              </button>
            ) : (
              <div className="space-y-2">
                <div className={vesselsOk ? "text-good" : "text-danger"}>
                  Arteries with a stenosis over 50% (AngioCAD grades): {extent.vessels}
                  {extent.arteries.length ? ` (${extent.arteries.join(", ")})` : ""}
                </div>
                <div className={lmOk ? "text-good" : "text-danger"}>Left main over 50%: {extent.leftMain ? "yes" : "no"}</div>
                <SegmentGrades p={p} />
                {p.gensini != null && <div className="text-ink-faint text-[12px]">Gensini score (dataset): {p.gensini}.</div>}
                <div className="notice notice-info block text-[12px]">
                  No value is shown for the missing facts: AngioCAD does not record them, and none is generated for a real patient. On a real referral they come from the history, a functional
                  test, the echo, the surgical review and the conversation with the patient (lessons: Stable disease: what revascularisation can and cannot do; PCI or CABG: surgical risk, the SYNTAX score and the heart team).
                </div>
                <RevealTips tips={stableRevealTips(extent.vessels >= 2 || extent.leftMain)} />
                <button
                  className="btn"
                  onClick={() => {
                    setI((k) => k + 1);
                    reset();
                  }}
                >
                  {i + 1 < set.length ? "Next study" : "See the set"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SYNTAX lesion marking
// ---------------------------------------------------------------------------

/** Studies the SYNTAX drill can use: the stable decision studies with dominance recorded (SYNTAX needs right or left). */
const syntaxStudies = (patients: readonly LibPatient[]) => revascStudies(patients).filter((p) => p.dominance === "right" || p.dominance === "left");

const THRESHOLD_OPTIONS: ThresholdSet[] = ["left-main", "three-vessel", "two-vessel", "not-used"];

interface SyntaxAnswered {
  id: string;
  agreed: number;
  scored: number;
  dominanceOk: boolean;
  thresholdOk: boolean;
}

function SyntaxDrillView({ patients, data }: ExtraDrillProps) {
  const recordSim = useProgressStore((s) => s.recordSim);
  const studies = useMemo(() => syntaxStudies(patients), [patients]);
  const [set, setSet] = useState<LibPatient[]>(() => revascSet(studies));
  const [i, setI] = useState(0);
  const [dominance, setDominance] = useState<"right" | "left" | null>(null);
  const [marked, setMarked] = useState<Set<string>>(() => new Set());
  const [features, setFeatures] = useState<Record<string, SyntaxFeature[]>>({});
  const [threshold, setThreshold] = useState<ThresholdSet | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState<SyntaxAnswered[]>([]);
  const p = set[i];
  const reset = () => {
    setDominance(null);
    setMarked(new Set());
    setFeatures({});
    setThreshold(null);
    setRevealed(false);
  };
  if (!studies.length) return <div className="panel p-6 text-[14px] text-ink-soft">No stable-angina AngioCAD studies with recorded dominance are installed.</div>;
  if (!p) {
    const agreed = done.reduce((a, d) => a + d.agreed, 0);
    const scored = done.reduce((a, d) => a + d.scored, 0);
    return (
      <div className="panel p-5 max-w-2xl space-y-3 text-[14px]">
        <div className="text-ink font-semibold">Set complete · SYNTAX lesions</div>
        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Segments agreed" value={`${agreed} of ${scored}`} sub="26–50% segments not scored" />
          <StatTile label="Dominance" value={`${done.filter((d) => d.dominanceOk).length} of ${done.length}`} />
          <StatTile label="Threshold set" value={`${done.filter((d) => d.thresholdOk).length} of ${done.length}`} />
        </div>
        <button
          className="btn btn-accent"
          onClick={() => {
            setSet(revascSet(studies));
            setI(0);
            setDone([]);
            reset();
          }}
        >
          New set
        </button>
      </div>
    );
  }
  const dom = p.dominance as "right" | "left";
  const cmp = revealed ? compareLesionSets(marked, p.segments ?? {}, dominance ?? dom) : null;
  const anatomies = angioCadAnatomies(p.segments ?? {}, dom);
  const accepted = [...new Set(anatomies.map(thresholdSetFor))];
  const toggleSeg = (s: string, on: boolean) =>
    setMarked((x) => {
      const n = new Set(x);
      if (on) n.add(s);
      else n.delete(s);
      return n;
    });
  const toggleFeature = (s: string, f: SyntaxFeature) => setFeatures((x) => ({ ...x, [s]: (x[s] ?? []).includes(f) ? (x[s] ?? []).filter((y) => y !== f) : [...(x[s] ?? []), f] }));
  const reveal = () => {
    const c = compareLesionSets(marked, p.segments ?? {}, dominance ?? dom);
    const scored = c.agreed + c.disagreed;
    const rec = { id: p.id, agreed: c.agreed, scored, dominanceOk: dominance === dom, thresholdOk: threshold !== null && accepted.includes(threshold) };
    setRevealed(true);
    setDone((d) => [...d, rec]);
    recordSim("angio-syntax", Math.round(100 * (scored ? c.agreed / scored : 0)));
  };
  return (
    <div className="grid xl:grid-cols-12 gap-4">
      <div className="xl:col-span-7 space-y-3">
        <StudyRuns key={p.id} p={p} data={data} revealed={revealed} />
        <div className="text-[12px] text-ink-faint">{SYNTAX_TOTAL_STATUS.reason}</div>
      </div>
      <div className="xl:col-span-5 space-y-3 text-[13px]">
        <div className="panel p-4 space-y-3">
          <div className="stat-label">
            Study {i + 1} of {set.length} · AngioCAD · {p.runs.length} runs
          </div>
          <div>
            <div className="text-ink-soft mb-1">1. Dominance (SYNTAX has no co-dominant option)</div>
            <div className="seg">
              {(["right", "left"] as const).map((d) => (
                <button key={d} disabled={revealed} onClick={() => setDominance(d)} className={`seg-btn !px-3 ${dominance === d ? "seg-btn-active" : ""}`}>
                  {d === "right" ? "Right" : "Left"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-ink-soft mb-1">2. Mark each segment with a lesion of 50% or more in a vessel of at least 1.5 mm, and its adverse features</div>
            <div className="space-y-1">
              {ANGIOCAD_SEGMENTS.map((s) => {
                const row = cmp?.rows.find((r) => r.segment === s);
                return (
                  <div key={s} className="rounded border border-line px-2 py-1">
                    <label className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <input type="checkbox" disabled={revealed} checked={marked.has(s)} onChange={(e) => toggleSeg(s, e.target.checked)} />
                        <span className="text-ink">{s}</span>
                        <span className="text-ink-faint text-[12px]">{dominance ? segmentVessel(s, dominance) : s === "PDA" || s === "PLB" ? "dominant artery" : segmentVessel(s, "right")}</span>
                      </span>
                      {row && (
                        <span className={row.agree === null ? "text-ink-faint" : row.agree ? "text-good" : "text-danger"}>
                          {row.grade === "NL" ? "normal" : `${row.grade}%`}
                          {row.agree === null ? " · not scored" : ""}
                        </span>
                      )}
                    </label>
                    {marked.has(s) && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {SYNTAX_FEATURES.map((f) => (
                          <button
                            key={f.id}
                            disabled={revealed}
                            onClick={() => toggleFeature(s, f.id)}
                            className={`rounded border px-1.5 py-0.5 text-[11px] ${(features[s] ?? []).includes(f.id) ? "border-accent bg-accent-tint text-ink" : "border-line text-ink-soft"}`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-ink-soft mb-1">3. Which SYNTAX thresholds apply to this anatomy?</div>
            <div className="space-y-1">
              {THRESHOLD_OPTIONS.map((t) => (
                <button
                  key={t}
                  disabled={revealed}
                  onClick={() => setThreshold(t)}
                  className={`block w-full rounded-md border px-2.5 py-1 text-left text-[13px] ${
                    revealed ? (accepted.includes(t) ? "border-good/60 bg-good/[0.08] text-ink" : threshold === t ? "border-danger/60 bg-danger/[0.08] text-ink" : "border-line opacity-60 text-ink-soft") : threshold === t ? "border-accent bg-accent-tint text-ink" : "border-line text-ink-soft"
                  }`}
                >
                  {THRESHOLD_SET_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
          {!revealed ? (
            <button className="btn btn-accent" disabled={dominance === null || threshold === null} onClick={reveal}>
              Compare with the AngioCAD grades
            </button>
          ) : (
            cmp && (
              <div className="space-y-2 animate-fadein">
                <div className={dominance === dom ? "text-good" : "text-danger"}>Dominance (dataset): {dom}</div>
                <div>
                  Segments agreed: {cmp.agreed} of {cmp.agreed + cmp.disagreed}
                  {cmp.missed ? ` · ${cmp.missed} lesion${cmp.missed === 1 ? "" : "s"} not marked` : ""}
                  {cmp.extra ? ` · ${cmp.extra} marked where AngioCAD grades none` : ""}
                  {cmp.indeterminate ? ` · ${cmp.indeterminate} graded 26–50%, not scored (the band holds 50%, which counts, and 26–49%, which does not)` : ""}
                </div>
                <div>
                  Anatomy from the grades: {anatomies.map((a) => ANATOMY_LABEL[a]).join(" or ")}. Thresholds: {accepted.map((t) => THRESHOLD_SET_LABEL[t]).join("; or ")}.
                  {accepted.includes("three-vessel") && " The left main threshold of 33 is not used for three-vessel disease."}
                </div>
                {p.diabetes && <div className="text-ink-soft">The dataset records diabetes: with multivessel or left main disease it moves the decision towards CABG whatever the score.</div>}
                <div className="text-ink-faint text-[12px]">AngioCAD records no vessel diameters or lesion features, so the 1.5 mm criterion and the features you noted are not scored.</div>
                <RevealTips tips={stableRevealTips(anatomies.some((a) => a === "left-main" || a === "three-vessel" || a === "two-vessel"))} />
                <button
                  className="btn"
                  onClick={() => {
                    setI((k) => k + 1);
                    reset();
                  }}
                >
                  {i + 1 < set.length ? "Next study" : "See the set"}
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

registerAngioDrill({
  id: "syntax",
  label: "Mark SYNTAX lesions",
  component: (p: ExtraDrillProps) => <SyntaxDrillView {...p} />,
  gate: (runs) => {
    const ids = new Set(runs.filter((r) => r.dataset === "AngioCAD").map((r) => r.patientId));
    // never 'not yet labelled': the drill needs the AngioCAD studies, not a reader's labels, and says so when they are missing
    return { open: true, note: ids.size ? "AngioCAD studies" : "needs the AngioCAD studies" };
  },
});
