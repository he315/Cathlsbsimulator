import { useMemo, useState } from "react";
import { clockStateAt, motionAt, type WallMotionClass } from "../../render/xray/heartMotion";
import { lvCavity, silhouetteEdges, type LvSegment } from "../../render/xray/lvGram";
import type { HeartFrame } from "../../render/xray/heart";
import {
  GLOBAL_FUNCTION,
  VIEW_SEGMENTS,
  type GlobalFunction,
  type LeftHeartControl,
  type LeftHeartRun,
  type ReadingComparison,
  type RunReading,
} from "../sim/modules/leftHeart";

// ---------------------------------------------------------------------------
// The ventriculogram reader (diag-lv-aorta-task, hb-cardiac-catheterisation#1).
// After a filmed run the learner reads it: the end-diastolic and end-systolic
// outlines of the run's view (drawn from the left heart as the run showed it,
// the image a ventriculogram analysis traces), global function, wall motion
// in each segment the view profiles (RAO 30: anterior, apical, inferior; LAO
// cranial: septal and posterolateral), the territory, and the MR grade (I-IV)
// or, for an aortogram, the AR grade; or the run is declared ungradable (ectopic
// beats, the catheter on the mitral apparatus or the leaflets). The reading is
// compared with the case within one grade, shown after the case or as a guided
// aid (LeftHeartControl.comparisonShown); during the case nothing here says
// what the answer is.
// ---------------------------------------------------------------------------

const WALL_CLASSES: readonly WallMotionClass[] = ["normal", "hypokinetic", "akinetic", "dyskinetic"];
const GLOBAL_LABEL: Record<GlobalFunction, string> = { normal: "Normal", mild: "Mildly impaired", moderate: "Moderately impaired", severe: "Severely impaired" };
const SEGMENT_LABEL: Record<LvSegment, string> = { anterior: "Anterior", apical: "Apical", inferior: "Inferior", septal: "Septal", posterolateral: "Posterolateral" };
const GRADE_LABEL = ["None", "I", "II", "III", "IV"] as const;
const VIEW_LABEL: Record<LeftHeartRun["view"], string> = { rao: "RAO", "lao-cranial": "LAO cranial", lao: "LAO", other: "Other view" };

/** The end-diastolic and end-systolic outlines of a run's cavity in its view, as SVG paths in a w x h box. */
export function runOutlines(H: HeartFrame, run: Pick<LeftHeartRun, "spec" | "cArm">, w = 220, h = 150): { ed: string; es: string } {
  const hr = 70;
  const rr = 60 / hr;
  const ES = clockStateAt(clockStateAt(0, hr).endSystole - 0.001, hr);
  const ED = clockStateAt(rr - 0.0005, hr);
  const cavED = lvCavity(H, motionAt(ED, H), run.spec);
  const cavES = lvCavity(H, motionAt(ES, H), run.spec);
  const edgeED = silhouetteEdges(cavED, run.cArm);
  const edgeES = silhouetteEdges(cavES, run.cArm);
  const maxLen = cavED.lengthMm;
  let maxD = 1;
  for (const s of edgeED) for (const e of s.edges) maxD = Math.max(maxD, Math.abs(e.d));
  const sx = (w - 16) / Math.max(1, maxLen);
  const sy = (h - 16) / (2 * maxD);
  const path = (edges: typeof edgeED, len: number) => {
    const top = edges.map((s) => [8 + s.u * len * sx, h / 2 - s.edges[0].d * sy] as const);
    const bot = edges.map((s) => [8 + s.u * len * sx, h / 2 + s.edges[1].d * sy] as const).reverse();
    return [...top, ...bot].map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + " Z";
  };
  return { ed: path(edgeED, cavED.lengthMm), es: path(edgeES, cavES.lengthMm) };
}

function Comparison({ c }: { c: ReadingComparison }) {
  const mark = (ok: boolean) => <span className={ok ? "text-accent" : "text-warn"}>{ok ? "within one grade" : "more than one grade apart"}</span>;
  return (
    <div className="space-y-0.5 text-[12px]" data-reader-comparison={c.runId}>
      <div>
        Gradable: {c.shouldBeUngradable ? "no (ectopics or the catheter on the valve apparatus)" : "yes"}; your call {c.ungradableCorrect ? "agrees" : "differs"}.
      </div>
      {c.global && (
        <div>
          Global: {GLOBAL_LABEL[c.global.expected]}; yours {c.global.given ? GLOBAL_LABEL[c.global.given] : "not given"} ({mark(c.global.withinOne)})
        </div>
      )}
      {c.segments.map((s) => (
        <div key={s.segment}>
          {SEGMENT_LABEL[s.segment]}: {s.expected}; yours {s.given ?? "not given"} ({mark(s.withinOne)})
        </div>
      ))}
      {c.mr && (
        <div>
          MR: {GRADE_LABEL[c.mr.expected]}; yours {c.mr.given === null ? "not given" : GRADE_LABEL[c.mr.given]} ({mark(c.mr.withinOne)})
        </div>
      )}
      {c.ar && (
        <div>
          AR: {GRADE_LABEL[c.ar.expected]}; yours {c.ar.given === null ? "not given" : GRADE_LABEL[c.ar.given]} ({mark(c.ar.withinOne)})
        </div>
      )}
      {c.territory && (
        <div>
          Territory: {c.territory.expected}; yours {c.territory.given ?? "not given"} ({c.territory.correct ? <span className="text-accent">agrees</span> : <span className="text-warn">differs</span>})
        </div>
      )}
    </div>
  );
}

export default function LvGramReader({ lh, heart, onClose }: { lh: LeftHeartControl; heart: HeartFrame; onClose?: () => void }) {
  // newest first: the reader opens on the latest run and follows each new one, unless the learner picked a run
  const runs = lh.readableRuns();
  const [picked, setPicked] = useState<number | null>(null);
  const run = runs.find((r) => r.id === picked) ?? runs[0] ?? null;
  if (!run) return <div className="text-[13px] text-ink-faint">No filmed ventriculogram or aortogram to read yet.</div>;
  // the form is keyed by the run, so a different run opens with its own recorded reading (or a blank one)
  return <RunReader key={run.id} lh={lh} heart={heart} runs={runs} run={run} onPick={setPicked} onClose={onClose} />;
}

function RunReader({ lh, heart, runs, run, onPick, onClose }: { lh: LeftHeartControl; heart: HeartFrame; runs: LeftHeartRun[]; run: LeftHeartRun; onPick: (id: number) => void; onClose?: () => void }) {
  const existing = lh.readings.find((r) => r.runId === run.id);
  const [ungradable, setUngradable] = useState(existing?.ungradable ?? false);
  const [global, setGlobal] = useState<GlobalFunction | "">(existing?.global ?? "");
  const [segments, setSegments] = useState<Partial<Record<LvSegment, WallMotionClass>>>(existing?.segments ?? {});
  const [grade, setGrade] = useState<number | "">(existing?.mr ?? existing?.ar ?? "");
  const [territory, setTerritory] = useState<RunReading["territory"] | "">(existing?.territory ?? "");
  const outlines = useMemo(() => (run.kind === "lv" ? runOutlines(heart, run) : null), [heart, run]);
  const segs = run.kind === "lv" ? VIEW_SEGMENTS[run.view] : [];
  const submit = () => {
    const r: RunReading = { runId: run.id, ungradable };
    if (!ungradable) {
      if (run.kind === "lv") {
        if (global) r.global = global;
        r.segments = { ...segments };
        if (grade !== "") r.mr = grade;
        if (territory) r.territory = territory;
      } else if (grade !== "") r.ar = grade;
    }
    lh.submitReading(r);
  };
  const submitted = lh.readings.find((r) => r.runId === run.id);
  const cmp = submitted && lh.comparisonShown() ? lh.compare(submitted) : null;
  return (
    <div className="space-y-2" data-lv-reader>
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-[12px] text-ink-faint">Run</div>
        <select className="field h-8 text-[13px]" aria-label="Run to read" value={run.id} onChange={(e) => onPick(Number(e.target.value))}>
          {runs.map((r) => (
            <option key={r.id} value={r.id}>
              {r.kind === "lv" ? "Ventriculogram" : "Aortogram"} {r.id}, {VIEW_LABEL[r.view]}
            </option>
          ))}
        </select>
        {onClose && (
          <button className="btn h-8 px-2 text-[13px]" onClick={onClose}>
            Close
          </button>
        )}
      </div>
      {outlines && (
        <div className="flex gap-3">
          {(["ed", "es"] as const).map((k) => (
            <figure key={k} className="space-y-0.5">
              <svg width={220} height={150} className="block rounded bg-base-900" role="img" aria-label={k === "ed" ? "End-diastolic frame outline" : "End-systolic frame outline"}>
                {k === "es" && <path d={outlines.ed} className="fill-none stroke-ink-faint" strokeDasharray="3 3" strokeWidth={1} />}
                <path d={outlines[k]} className={`stroke-ink-soft ${k === "es" ? "fill-ink-soft/35" : "fill-ink-soft/25"}`} strokeWidth={1.2} />
              </svg>
              <figcaption className="text-[12px] text-ink-faint">{k === "ed" ? "End-diastole" : "End-systole (end-diastole dashed)"}</figcaption>
            </figure>
          ))}
        </div>
      )}
      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" checked={ungradable} onChange={(e) => setUngradable(e.target.checked)} />
        Cannot be graded (reposition and repeat)
      </label>
      {!ungradable && run.kind === "lv" && (
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <div className="space-y-1">
            <div className="text-[12px] text-ink-faint">Global function</div>
            <select className="field h-8 text-[13px]" aria-label="Global function" value={global} onChange={(e) => setGlobal(e.target.value as GlobalFunction)}>
              <option value="">Choose</option>
              {GLOBAL_FUNCTION.map((g) => (
                <option key={g} value={g}>
                  {GLOBAL_LABEL[g]}
                </option>
              ))}
            </select>
          </div>
          {segs.map((sg) => (
            <div key={sg} className="space-y-1">
              <div className="text-[12px] text-ink-faint">{SEGMENT_LABEL[sg]} wall</div>
              <select
                className="field h-8 text-[13px]"
                aria-label={`${SEGMENT_LABEL[sg]} wall motion`}
                data-segment={sg}
                value={segments[sg] ?? ""}
                onChange={(e) => setSegments({ ...segments, [sg]: e.target.value as WallMotionClass })}
              >
                <option value="">Choose</option>
                {WALL_CLASSES.map((w) => (
                  <option key={w} value={w}>
                    {w[0].toUpperCase() + w.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {segs.length === 0 && <div className="text-[12px] text-ink-faint">This view profiles no wall cleanly: film RAO 30 or LAO 60 cranial 20.</div>}
          <div className="space-y-1">
            <div className="text-[12px] text-ink-faint">Territory</div>
            <select className="field h-8 text-[13px]" aria-label="Territory" value={territory} onChange={(e) => setTerritory(e.target.value as RunReading["territory"])}>
              <option value="">Choose</option>
              {(["LAD", "RCA", "LCx", "none"] as const).map((x) => (
                <option key={x} value={x}>
                  {x === "none" ? "No regional defect" : x}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      {!ungradable && (
        <div className="space-y-1">
          <div className="text-[12px] text-ink-faint">{run.kind === "lv" ? "Mitral regurgitation" : "Aortic regurgitation"}</div>
          <select className="field h-8 text-[13px]" aria-label={run.kind === "lv" ? "MR grade" : "AR grade"} value={grade} onChange={(e) => setGrade(e.target.value === "" ? "" : Number(e.target.value))}>
            <option value="">Choose</option>
            {GRADE_LABEL.map((g, i) => (
              <option key={g} value={i}>
                {g}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex items-center gap-2">
        <button className="btn btn-accent h-8 px-3 text-[13px]" onClick={submit}>
          {submitted ? "Update reading" : "Record reading"}
        </button>
        {submitted && !cmp && <span className="text-[12px] text-ink-faint">Recorded: the comparison shows here after the case.</span>}
      </div>
      {cmp && <Comparison c={cmp} />}
    </div>
  );
}
