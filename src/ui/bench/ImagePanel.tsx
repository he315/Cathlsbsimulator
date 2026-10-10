// IVUS and OCT bench, step 1: commit to a modality against the stated goal,
// run the pullbacks, measure on the frames and enter the pre-PCI plan
// (pci-bench-imaging-unify; pci-bench-measure-and-plan). Also holds the small row
// and picker controls the other step panels share.
//
// No finding is shown before the learner's own entry: there is no pre-PCI table
// and no plaque-burden read-out here. The learner measures with the shared tools
// (src/ui/imaging/MeasureTools.tsx) and the plan form compares the entries with
// the frames: at once in guided practice, in the debrief otherwise. The choice
// has its consequences on the frames: OCT cannot clear an ostium (the frames
// from the aorta into it are blood), and each OCT run adds its flush to the
// imaging contrast, which the console shows as an operator would see it.
//
// The bench screen passes `lesion` and `mode`; without them the panel finds the
// lesion from the pre-PCI measures it is given and treats the run as unguided
// (the comparison waits for the debrief).
//
// repair-bench-host-wiring: intracoronary nitroglycerin can be given from this
// step (onNitrate, which the bench screen wires to giveNitrate()). On a lesion
// whose brief states spasm the repeat injection then reads the reference the
// angiogram shows after nitroglycerin (angiographicReferenceMm()); on any other
// lesion the vessel's size does not change. The panel says only what a repeat
// injection shows, not the intravascular measures, and gives the number only in
// guided practice: after nitroglycerin the angiographic reference is the true
// size, so in the other modes the learner measures it on the pullback. The note for frames without
// a measurable lumen is generic: in the ectatic RCA the flush fails in the large
// vessel, not at an ostium.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { AssessmentMode } from "../../mentor/types";
import { MODALITIES, type Modality } from "../../simulation/imaging/types";
import {
  BENCH_BY_ID,
  MODALITY_REASONS,
  angiographicReferenceMm,
  benchFrameAt,
  benchPullbacks,
  branchLesion,
  imagingContrastMl,
  type BenchLesion,
  type ModalityReasonId,
  type PreImaging,
} from "../../simulation/pciBench";
import { gradePlan } from "../../simulation/bench/measure";
import IntravascularView from "../imaging/IntravascularView";
import MeasureTools, { PullbackMarkers, type Measurement } from "../imaging/MeasureTools";
import PlanForm, { PlanReview, useBenchPlanStore, type PlanDraft } from "./PlanForm";

export function BenchRow({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-line/50 pb-1">
      <span className="text-ink-soft">{k}</span>
      <span className="font-mono text-ink text-right">{v}</span>
    </div>
  );
}

export function BenchPicker<T extends number>({ label, values, value, fmt, onChange }: { label: string; values: readonly T[]; value: T; fmt: (v: T) => string; onChange: (v: T) => void }) {
  return (
    <div>
      <div className="text-ink-soft mb-1">{label}</div>
      <div className="flex flex-wrap gap-1" role="group" aria-label={label}>
        {values.map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={v === value}
            onClick={() => onChange(v)}
            className={`rounded border px-1.5 py-0.5 text-[12px] font-mono ${v === value ? "border-accent bg-accent/20 text-ink" : "border-line text-ink-faint hover:text-ink"}`}
          >
            {fmt(v)}
          </button>
        ))}
      </div>
    </div>
  );
}

export interface ImagePanelProps {
  modality: Modality | null;
  onModality: (m: Modality) => void;
  pre: PreImaging | null;
  next: () => void;
  /** the lesion (the bench screen passes it; otherwise it is found from `pre`) */
  lesion?: BenchLesion;
  /** the run's mode: guided shows the comparison after entry; guided and exam need the plan before moving on */
  mode?: AssessmentMode;
  /** whether intracoronary nitroglycerin has been given (BenchState.nitrate) */
  nitrate?: boolean;
  /** give intracoronary nitroglycerin (the bench screen calls giveNitrate()); without it no control is shown */
  onNitrate?: () => void;
}

/** OCT frames whose blood the flush did not clear: the light is attenuated by the blood in the lumen. */
export function UnclearedBlood() {
  return (
    <svg viewBox="0 0 300 300" className="pointer-events-none absolute inset-0 h-full w-full rounded-full" aria-hidden>
      <defs>
        <filter id="bench-blood" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={0.08} numOctaves={3} seed={7} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.22  0 0 0 0 0.12  0 0 0 0.9 0" />
          {/* the noise fills the filter's square region: keep it inside the circle */}
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
        <radialGradient id="bench-blood-fade">
          <stop offset="8%" stopColor="#3a2416" stopOpacity={0.95} />
          <stop offset="35%" stopColor="#1a0f08" stopOpacity={0.97} />
          <stop offset="100%" stopColor="#050302" stopOpacity={1} />
        </radialGradient>
      </defs>
      <circle cx={150} cy={150} r={148} fill="url(#bench-blood-fade)" />
      <circle cx={150} cy={150} r={70} filter="url(#bench-blood)" opacity={0.55} />
      <circle cx={150} cy={150} r={12} fill="#000" stroke="#6b4c34" strokeWidth={2} />
    </svg>
  );
}

/** A label mid-sentence: "Pullback" becomes "pullback"; an acronym ("LAD pullback") keeps its capitals. */
export function inSentence(label: string): string {
  const first = label.split(/\s+/)[0] ?? "";
  return first.length > 1 && first === first.toUpperCase() ? label : label.charAt(0).toLowerCase() + label.slice(1);
}

export const REGION_NOTE = {
  aorta: "Catheter in the aorta: no coronary wall to measure.",
  uncleared: "Blood not cleared by the flush: the lumen cannot be measured here.",
} as const;

/**
 * What a repeat injection shows after nitroglycerin: the larger reference where the brief states spasm, else no change.
 * The number is given only in guided practice (it is the vessel's true size); otherwise the reading is qualitative.
 */
export function nitrateReading(l: BenchLesion, mode?: AssessmentMode): string {
  if (!l.spasm) return "Repeat injection: no change in the vessel's size.";
  if (mode !== "guided") return "Repeat injection: the vessel looks larger than on the first injection; measure it on the pullback.";
  const before = angiographicReferenceMm(l, { nitrate: false });
  const after = angiographicReferenceMm(l, { nitrate: true });
  return `Repeat injection: the vessel is larger, its reference about ${after.toFixed(1)} mm (${before.toFixed(1)} mm on the first injection).`;
}

/** Intracoronary nitroglycerin: a button until it is given, then what the repeat injection shows. */
export function NitrateControl({ lesion: l, mode, given, onGive }: { lesion?: BenchLesion; mode?: AssessmentMode; given: boolean; onGive: () => void }) {
  return (
    <div className="panel p-4 space-y-2 text-[13px]" data-part="nitrate">
      <div className="flex items-center justify-between gap-3">
        <div className="stat-label">Intracoronary nitroglycerin</div>
        {given ? (
          <span className="chip">Given</span>
        ) : (
          <button type="button" className="btn h-8 px-2.5 text-[12.5px]" onClick={onGive}>
            Give nitroglycerin
          </button>
        )}
      </div>
      {given && l && <p className="text-ink-soft">{nitrateReading(l, mode)}</p>}
    </div>
  );
}

export default function ImagePanel(props: ImagePanelProps) {
  const { nitrate, onNitrate } = props;
  const l = props.lesion ?? (props.pre ? BENCH_BY_ID[props.pre.lesionId] : undefined);
  if (!onNitrate) return <ImageStep {...props} />;
  return (
    <div className="space-y-4">
      <NitrateControl lesion={l} mode={props.mode} given={!!nitrate} onGive={onNitrate} />
      <ImageStep {...props} />
    </div>
  );
}

function ImageStep({ modality, onModality, pre, next, lesion, mode }: ImagePanelProps) {
  const l = lesion ?? (pre ? BENCH_BY_ID[pre.lesionId] : undefined);
  const [reasonId, setReasonId] = useState<ModalityReasonId | null>(null);
  // the store's state (also read directly, so a server render and the first render after a commit see it)
  const record = useBenchPlanStore((s) => (l ? s.records[l.id] : undefined)) ?? (l ? useBenchPlanStore.getState().records[l.id] : undefined);
  const store = useBenchPlanStore.getState;

  // a run that opened with the modality already chosen still gets a plan record
  useEffect(() => {
    if (l && modality && (!record || record.modality !== modality)) store().ensure(l.id, modality);
  }, [l, modality, record, store]);

  const needReason = !!l?.goal && (mode === "guided" || mode === "exam");
  // a new lesion or a fresh choice (restart) opens the chooser with no reason selected: it is part of the graded answer
  const choosing = !modality;
  const lesionId = l?.id;
  useEffect(() => {
    setReasonId(null);
  }, [lesionId, choosing]);

  if (!modality)
    return (
      <div className="panel p-4 space-y-3 text-[13px]">
        <div className="stat-label">Intravascular imaging</div>
        {l?.goal ? (
          <div className="space-y-1.5">
            <BenchRow k="Goal" v={<span className="font-sans">{l.goal.text}</span>} />
            <BenchRow k="Patient" v={<span className="font-sans">{l.goal.patient}</span>} />
          </div>
        ) : null}
        <p className="text-ink-soft leading-relaxed">Choose the modality for this lesion before the first pullback. The choice is part of the plan.</p>
        {l?.goal && (
          <fieldset className="space-y-1" aria-label="Reason for the modality">
            <legend className="text-ink-faint text-[12px] mb-1">Reason</legend>
            {MODALITY_REASONS.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-ink-soft">
                <input type="radio" name="bench-modality-reason" checked={reasonId === r.id} onChange={() => setReasonId(r.id)} className="accent-[#4F8EF7]" />
                {r.label}
              </label>
            ))}
          </fieldset>
        )}
        <div className="flex gap-2">
          {MODALITIES.map((m) => (
            <button
              key={m}
              type="button"
              className="btn"
              disabled={needReason && !reasonId}
              onClick={() => {
                if (l) store().commit(l.id, m, reasonId, needReason);
                onModality(m);
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    );

  if (!l || !record)
    return (
      <div className="panel p-4 space-y-2 text-[13px]">
        <div className="stat-label">Intravascular imaging ({modality})</div>
        <p className="text-ink-soft">Measure on the pullback, then plan the preparation.</p>
        <button type="button" className="btn btn-accent mt-1" onClick={next}>
          Plan preparation →
        </button>
      </div>
    );

  return <Workspace lesion={l} modality={modality} mode={mode} next={next} />;
}

function Workspace({ lesion: l, modality, mode, next }: { lesion: BenchLesion; modality: Modality; mode?: AssessmentMode; next: () => void }) {
  const record = useBenchPlanStore((s) => s.records[l.id]) ?? useBenchPlanStore.getState().records[l.id];
  const { run, edit, submit } = useBenchPlanStore.getState();
  const pullbacks = benchPullbacks(l);
  const [branch, setBranch] = useState<string | null>(null);
  const g = branchLesion(l, branch === "main" ? null : branch);
  const startMm = 0;
  const [x, setX] = useState(() => (l.startMm + l.endMm) / 2);
  const [markers, setMarkers] = useState<Record<string, number | undefined>>({});
  const xc = Math.max(startMm, Math.min(g.segmentMm, x));
  const bf = useMemo(() => (branch ? benchFrameAt(l, xc, modality, branch === "main" ? null : branch) : null), [l, xc, modality, branch]);
  if (!record) return null;
  const submitted = !!record.submitted;
  const guided = mode === "guided";
  const blocksMove = (mode === "guided" || mode === "exam") && !submitted;
  const contrast = imagingContrastMl(l, modality, record.runs.length);
  const editDraft = (patch: Partial<PlanDraft>) => edit(l.id, patch);
  const fmt = (v: number) => v.toFixed(2);

  const runPullback = (id: string) => {
    run(l.id, id);
    setBranch(id);
  };

  const actions = (m: Measurement) => {
    const btn = (label: string, patch: Partial<PlanDraft>) => (
      <button key={label} type="button" className="btn btn-ghost h-7 px-2 text-[12px]" disabled={submitted} onClick={() => editDraft(patch)}>
        {label}
      </button>
    );
    const twoBranch = pullbacks.length > 1;
    switch (m.tool) {
      case "trace":
        return (
          <>
            {btn(twoBranch ? "Left main MLA" : "MLA", { mla: fmt(m.areaMm2), mlaNotMeasurable: false })}
            {twoBranch && btn("LAD ostium", { segLad: fmt(m.areaMm2) })}
            {twoBranch && btn("Circumflex ostium", { segLcx: fmt(m.areaMm2) })}
            {btn("Distal reference", { distRef: fmt(m.meanDiameterMm) })}
            {!l.ostial && btn("Proximal reference", { proxRef: fmt(m.meanDiameterMm) })}
          </>
        );
      case "caliper":
        return (
          <>
            {btn("Distal reference", { distRef: fmt(m.mm) })}
            {!l.ostial && btn("Proximal reference", { proxRef: fmt(m.mm) })}
          </>
        );
      case "arc":
        return btn("Calcium arc", { caArc: m.deg.toFixed(0), calciumNone: false });
      case "thickness":
        return btn("Calcium thickness", { caThickness: fmt(m.mm), caThicknessNotMeasurable: false, calciumNone: false });
    }
  };

  return (
    <div className="space-y-4">
      <div className="panel p-4 space-y-3 text-[13px]">
        <div className="flex items-center justify-between">
          <div className="stat-label">{modality} pullbacks</div>
          {modality === "OCT" && <span className="chip">Imaging contrast {contrast} mL</span>}
        </div>
        {l.goal && <BenchRow k="Goal" v={<span className="font-sans">{l.goal.text}</span>} />}
        <div className="flex flex-wrap gap-1.5">
          {pullbacks.map((p) => (
            <button key={p.id} type="button" className={`btn h-8 px-2.5 text-[12.5px] ${branch === p.id ? "border-accent" : ""}`} onClick={() => (record.runs.includes(p.id) ? setBranch(p.id) : runPullback(p.id))}>
              {`${record.runs.includes(p.id) ? "View" : "Run"} ${inSentence(p.label)}`}
            </button>
          ))}
        </div>
        {bf && branch ? (
          <>
            <MeasureTools frame={bf.frame} blocked={bf.lumenMeasurable ? null : REGION_NOTE[bf.region as "aorta" | "uncleared"]} actions={actions}>
              <div className="relative">
                <IntravascularView frame={bf.frame} label={`${modality} frame at ${xc.toFixed(2)} mm`} />
                {modality === "OCT" && bf.region !== "vessel" && <UnclearedBlood />}
              </div>
            </MeasureTools>
            <PullbackMarkers
              fromMm={startMm}
              toMm={g.segmentMm}
              cursorMm={xc}
              onCursor={setX}
              defs={[
                { id: "landingProx", label: l.ostial ? "Ostium" : "Proximal landing" },
                { id: "landingDist", label: "Distal landing" },
              ]}
              markers={markers}
              onMark={(id, mm) => {
                setMarkers((m) => ({ ...m, [id]: mm }));
                editDraft({ [id]: mm.toFixed(2) } as Partial<PlanDraft>);
              }}
              onLength={(len) => editDraft({ length: len.toFixed(2) })}
            />
          </>
        ) : (
          <p className="text-ink-faint">Run a pullback to measure on its frames.</p>
        )}
      </div>
      <PlanForm lesion={l} record={record} mode={mode} onEdit={editDraft} onSubmit={() => submit(l.id)} />
      {submitted && guided && record.submitted && (
        <div className="panel p-4 animate-fadein">
          <PlanReview grade={gradePlan(l, record.submitted)} />
        </div>
      )}
      <button type="button" className="btn btn-accent" disabled={blocksMove} onClick={next} title={blocksMove ? "Enter the plan first" : undefined}>
        Plan preparation →
      </button>
    </div>
  );
}
