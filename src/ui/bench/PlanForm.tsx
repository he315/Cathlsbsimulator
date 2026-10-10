// IVUS and OCT bench: the pre-PCI plan (pci-bench-measure-and-plan).
//
// The learner writes the plan from their own measurements: the minimum lumen
// area, the references, the landing zones and the length between them, the
// calcium (arc, thickness, length, score), the preparation tool, the stent and
// the proximal post-dilatation balloon, and for the left main the significance
// call (with the population threshold) and each ostium. The bench compares it
// with frame truth (src/simulation/bench/measure.ts). In guided practice the
// comparison appears once the plan is entered; in supervised, independent and
// exam modes the plan is recorded and compared in the debrief (AssessPanel).
// The form shows no finding of its own before the learner's entry. In the IVUS
// grey zone (4.5 to 6.0 mm², by the learner's own MLA) it says physiology can
// settle significance, and offers a hand-off to the physiology lab's left main
// preset once the launch catalogue declares it.
//
// useBenchPlanStore holds the run's choice, pullbacks, draft and submitted plan
// per lesion, so the image step, the debrief and later steps read the same plan.
import { create } from "zustand";
import type { AssessmentMode } from "../../mentor/types";
import type { Modality } from "../../simulation/imaging/types";
import { MODALITY_REASONS, type BenchLesion, type ModalityReasonId } from "../../simulation/pciBench";
import { inGreyZone, lmThreshold, type BenchPlan, type PlanGrade, type Population } from "../../simulation/bench/measure";
import { useUiStore } from "../../state/useUiStore";
import { PRACTICE_INDEX } from "../content/practiceIndex";

// ---------------------------------------------------------------------------
// The plan store
// ---------------------------------------------------------------------------

/** The form's entries, as typed (empty string = not entered). */
export interface PlanDraft {
  mla: string;
  mlaNotMeasurable: boolean;
  distRefMethod: "lumen" | "eem";
  distRef: string;
  proxRef: string;
  landingProx: string;
  landingDist: string;
  length: string;
  calciumNone: boolean;
  caArc: string;
  caThickness: string;
  caThicknessNotMeasurable: boolean;
  caLength: string;
  caScore: string;
  prepTool: "" | "balloon" | "modification";
  stent: string;
  /** "none" for no proximal balloon */
  postDil: string;
  significance: "" | "significant" | "not-significant" | "physiology";
  population: Population;
  segLm: string;
  segLad: string;
  segLcx: string;
}

export const EMPTY_DRAFT: PlanDraft = {
  mla: "",
  mlaNotMeasurable: false,
  distRefMethod: "lumen",
  distRef: "",
  proxRef: "",
  landingProx: "",
  landingDist: "",
  length: "",
  calciumNone: false,
  caArc: "",
  caThickness: "",
  caThicknessNotMeasurable: false,
  caLength: "",
  caScore: "",
  prepTool: "",
  stent: "",
  postDil: "",
  significance: "",
  population: "general",
  segLm: "",
  segLad: "",
  segLcx: "",
};

export interface BenchPlanRecord {
  lesionId: string;
  modality: Modality;
  reasonId: ModalityReasonId | null;
  /** whether the run's mode required the reason (guided, exam); otherwise a reason left out is not graded */
  requireReason?: boolean;
  /** pullbacks run, in order (branch ids or "main"); each OCT run adds its flush */
  runs: string[];
  draft: PlanDraft;
  submitted: BenchPlan | null;
}

interface BenchPlanStore {
  records: Record<string, BenchPlanRecord>;
  /** the learner commits to a modality (a new run of this lesion: any earlier plan is dropped) */
  commit: (lesionId: string, modality: Modality, reasonId: ModalityReasonId | null, requireReason?: boolean) => void;
  /** a record for a run that started with the modality already chosen (a launch) */
  ensure: (lesionId: string, modality: Modality) => void;
  run: (lesionId: string, pullbackId: string) => void;
  edit: (lesionId: string, patch: Partial<PlanDraft>) => void;
  submit: (lesionId: string) => BenchPlan | null;
  reset: (lesionId?: string) => void;
}

const fresh = (lesionId: string, modality: Modality, reasonId: ModalityReasonId | null, requireReason = false): BenchPlanRecord => ({
  lesionId,
  modality,
  reasonId,
  requireReason,
  runs: [],
  draft: { ...EMPTY_DRAFT },
  submitted: null,
});

export const useBenchPlanStore = create<BenchPlanStore>((set, get) => ({
  records: {},
  commit: (id, modality, reasonId, requireReason) => set((s) => ({ records: { ...s.records, [id]: fresh(id, modality, reasonId, requireReason) } })),
  ensure: (id, modality) => {
    const r = get().records[id];
    if (r && r.modality === modality) return;
    set((s) => ({ records: { ...s.records, [id]: fresh(id, modality, null) } }));
  },
  run: (id, pullbackId) =>
    set((s) => {
      const r = s.records[id];
      if (!r) return s;
      return { records: { ...s.records, [id]: { ...r, runs: [...r.runs, pullbackId] } } };
    }),
  edit: (id, patch) =>
    set((s) => {
      const r = s.records[id];
      if (!r) return s;
      return { records: { ...s.records, [id]: { ...r, draft: { ...r.draft, ...patch } } } };
    }),
  submit: (id) => {
    const r = get().records[id];
    if (!r) return null;
    const plan = draftToPlan(r);
    set((s) => ({ records: { ...s.records, [id]: { ...r, submitted: plan } } }));
    return plan;
  },
  reset: (id) =>
    set((s) => {
      if (!id) return { records: {} };
      const records = { ...s.records };
      delete records[id];
      return { records };
    }),
}));

const num = (v: string): number | undefined => {
  if (v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/** The plan a record's draft states. */
export function draftToPlan(r: BenchPlanRecord): BenchPlan {
  const d = r.draft;
  const distRef = num(d.distRef);
  const plan: BenchPlan = {
    modality: r.modality,
    reasonId: r.reasonId,
    requireReason: !!r.requireReason,
    pullbacks: [...new Set(r.runs)],
    population: d.population,
    mla: d.mlaNotMeasurable ? null : num(d.mla),
    distRef: distRef === undefined ? undefined : { method: d.distRefMethod, diameterMm: distRef },
    proxRefMm: num(d.proxRef),
    landingProxMm: num(d.landingProx),
    landingDistMm: num(d.landingDist),
    lengthMm: num(d.length),
    calcium: d.calciumNone
      ? "none"
      : { arcDeg: num(d.caArc), thicknessMm: d.caThicknessNotMeasurable ? null : num(d.caThickness), lengthMm: num(d.caLength), score: num(d.caScore) },
    prepTool: d.prepTool || undefined,
    stentDiameterMm: num(d.stent),
    postDilMm: d.postDil === "none" ? null : num(d.postDil),
    significance: d.significance || undefined,
  };
  if (d.segLm || d.segLad || d.segLcx) plan.segments = { lm: num(d.segLm), ladOstium: num(d.segLad), lcxOstium: num(d.segLcx) };
  return plan;
}

// ---------------------------------------------------------------------------
// The form
// ---------------------------------------------------------------------------

/** The physiology lab's left main preset the grey-zone hand-off opens (declared by physiology-left-main-and-ostial). */
export const GREY_ZONE_HANDOFF = { sim: "physiology", params: { scenario: "lm-intermediate" } } as const;

/**
 * Whether the physiology lab declares the hand-off's preset. Until physiology-left-main-and-ostial lands its
 * launch file, the lab would open on its default LAD case, so the form shows the notice without the button.
 */
export function greyZoneHandoffAvailable(index = PRACTICE_INDEX): boolean {
  return !!index.known.scenarios.get(GREY_ZONE_HANDOFF.sim)?.has(GREY_ZONE_HANDOFF.params.scenario);
}

function NumField({ label, value, onChange, step = 0.01, unit, disabled }: { label: string; value: string; onChange: (v: string) => void; step?: number; unit?: string; disabled?: boolean }) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-ink-soft">{label}</span>
      <span className="flex items-center gap-1.5">
        <input type="number" inputMode="decimal" step={step} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="field h-8 w-24 font-mono text-right disabled:opacity-40" aria-label={label} />
        {unit && <span className="text-ink-faint w-9 text-[12px]">{unit}</span>}
      </span>
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-ink-soft text-[12.5px]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-[#4F8EF7]" />
      {label}
    </label>
  );
}

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-ink-soft">{label}</span>
      <div className="seg" role="group" aria-label={label}>
        {options.map((o) => (
          <button key={o.v} type="button" aria-pressed={o.v === value} className={`seg-btn ${o.v === value ? "seg-btn-active" : ""}`} onClick={() => onChange(o.v)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export interface PlanFormProps {
  lesion: BenchLesion;
  record: BenchPlanRecord;
  onEdit: (patch: Partial<PlanDraft>) => void;
  onSubmit: () => void;
  mode?: AssessmentMode;
  /** whether the grey-zone hand-off can open the physiology lab's left main preset (default: the launch catalogue says) */
  handoffAvailable?: boolean;
}

export default function PlanForm({ lesion: l, record, onEdit, onSubmit, mode, handoffAvailable = greyZoneHandoffAvailable() }: PlanFormProps) {
  const openSim = useUiStore((s) => s.openSim);
  const d = record.draft;
  const ivus = record.modality === "IVUS";
  const twoBranch = (l.branches?.length ?? 0) > 1;
  const enteredMla = num(d.mla);
  const grey = !!l.leftMain && ivus && !d.mlaNotMeasurable && enteredMla !== undefined && inGreyZone(enteredMla);
  const submitted = !!record.submitted;
  const set = (k: keyof PlanDraft) => (v: string) => onEdit({ [k]: v } as Partial<PlanDraft>);
  return (
    <form
      className="panel p-4 space-y-2.5 text-[13px]"
      aria-label="Pre-PCI plan"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex items-center justify-between">
        <div className="stat-label">Pre-PCI plan ({record.modality})</div>
        {submitted && <span className="chip">Plan entered</span>}
      </div>
      <fieldset disabled={submitted} className="space-y-2.5">
        <NumField label={twoBranch ? "Left main minimum lumen area" : "Minimum lumen area"} value={d.mla} onChange={set("mla")} unit="mm²" disabled={d.mlaNotMeasurable} />
        <Check label="Minimum lumen area not measurable on these frames" checked={d.mlaNotMeasurable} onChange={(v) => onEdit({ mlaNotMeasurable: v })} />
        {twoBranch && (
          <>
            <NumField label="LAD ostium minimum lumen area" value={d.segLad} onChange={set("segLad")} unit="mm²" />
            <NumField label="Circumflex ostium minimum lumen area" value={d.segLcx} onChange={set("segLcx")} unit="mm²" />
          </>
        )}
        {l.leftMain && (
          <>
            {ivus && (
              <Choice
                label="Threshold population"
                value={d.population}
                options={[
                  { v: "general", label: `${lmThreshold("IVUS", "general").toFixed(1)} mm²` },
                  { v: "korean", label: `Korean ${lmThreshold("IVUS", "korean").toFixed(1)} mm²` },
                ]}
                onChange={(v) => onEdit({ population: v })}
              />
            )}
            <Choice
              label="Left main lesion"
              value={d.significance}
              options={[
                { v: "significant", label: "Significant" },
                { v: "not-significant", label: "Not significant" },
                { v: "physiology", label: "Physiology" },
              ]}
              onChange={(v) => onEdit({ significance: v })}
            />
          </>
        )}
        <div className="border-t border-line/60 pt-2 space-y-2">
          <Choice
            label="Distal reference by"
            value={d.distRefMethod}
            options={[
              { v: "lumen", label: "Lumen" },
              { v: "eem", label: "EEM" },
            ]}
            onChange={(v) => onEdit({ distRefMethod: v })}
          />
          <NumField label={`Distal reference ${d.distRefMethod === "eem" ? "EEM" : "lumen"} diameter`} value={d.distRef} onChange={set("distRef")} unit="mm" />
          {!l.ostial && <NumField label="Proximal reference lumen diameter" value={d.proxRef} onChange={set("proxRef")} unit="mm" />}
          <NumField label={l.ostial ? "Proximal landing zone (the ostium)" : "Proximal landing zone"} value={d.landingProx} onChange={set("landingProx")} step={0.25} unit="mm" />
          <NumField label="Distal landing zone" value={d.landingDist} onChange={set("landingDist")} step={0.25} unit="mm" />
          <NumField label="Length between them" value={d.length} onChange={set("length")} step={0.25} unit="mm" />
        </div>
        <div className="border-t border-line/60 pt-2 space-y-2">
          <Check label="No calcium seen" checked={d.calciumNone} onChange={(v) => onEdit({ calciumNone: v })} />
          {!d.calciumNone && (
            <>
              <NumField label="Calcium arc (largest)" value={d.caArc} onChange={set("caArc")} step={1} unit="°" />
              <NumField label="Calcium thickness (largest)" value={d.caThickness} onChange={set("caThickness")} unit="mm" disabled={d.caThicknessNotMeasurable} />
              <Check label="Thickness not measurable" checked={d.caThicknessNotMeasurable} onChange={(v) => onEdit({ caThicknessNotMeasurable: v })} />
              <NumField label="Calcium length" value={d.caLength} onChange={set("caLength")} step={0.25} unit="mm" />
              {!ivus && <NumField label="Calcium score (0 to 4)" value={d.caScore} onChange={set("caScore")} step={1} />}
            </>
          )}
          <Choice
            label="Preparation"
            value={d.prepTool}
            options={[
              { v: "balloon", label: "Balloon" },
              { v: "modification", label: "Calcium modification" },
            ]}
            onChange={(v) => onEdit({ prepTool: v })}
          />
        </div>
        <div className="border-t border-line/60 pt-2 space-y-2">
          <NumField label="Stent diameter" value={d.stent} onChange={set("stent")} step={0.25} unit="mm" />
          <NumField label="Proximal post-dilatation balloon" value={d.postDil === "none" ? "" : d.postDil} onChange={set("postDil")} step={0.25} unit="mm" disabled={d.postDil === "none"} />
          <Check label="No separate proximal balloon" checked={d.postDil === "none"} onChange={(v) => onEdit({ postDil: v ? "none" : "" })} />
        </div>
      </fieldset>
      {grey && (
        <div className="notice notice-info items-center justify-between">
          <span>Minimum lumen area between 4.5 and 6.0 mm²: physiology can settle significance.</span>
          {handoffAvailable && (
            <button type="button" className="btn h-8 px-2.5 text-[12.5px]" onClick={() => openSim(GREY_ZONE_HANDOFF.sim, { ...GREY_ZONE_HANDOFF.params, ...(mode ? { mode } : {}) })}>
              Open the physiology lab
            </button>
          )}
        </div>
      )}
      {!submitted && (
        <button type="submit" className="btn btn-accent">
          Enter the plan
        </button>
      )}
      {submitted && mode !== "guided" && <p className="text-[12px] text-ink-faint">Plan recorded. It is compared with the frames in the debrief.</p>}
    </form>
  );
}

// ---------------------------------------------------------------------------
// The comparison with the frames (the guided aid after entry, and the debrief)
// ---------------------------------------------------------------------------

export function PlanReview({ grade, title = "Plan against the frames" }: { grade: PlanGrade; title?: string }) {
  const g = grade;
  return (
    <div className="space-y-2 text-[13px]">
      <div className="flex items-center justify-between">
        <div className="stat-label">{title}</div>
        <span className={`metric text-[15px] ${g.correct === g.total ? "text-good" : g.correct >= g.total * 0.7 ? "text-warn" : "text-danger"}`}>
          {g.correct}/{g.total}
        </span>
      </div>
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="text-ink-faint text-left">
            <th className="font-normal pb-1">Entry</th>
            <th className="font-normal pb-1 text-right">Yours</th>
            <th className="font-normal pb-1 text-right">Frames</th>
          </tr>
        </thead>
        <tbody>
          {g.items.map((i) => (
            <tr key={i.id} className="border-t border-line/50 align-top">
              <td className={`py-1 pr-2 ${i.ok ? "text-good" : "text-danger"}`}>
                {i.ok ? "✓" : "✗"} {i.label}
                {i.note && <div className="text-ink-faint text-[12px]">{i.note}</div>}
              </td>
              <td className="py-1 text-right font-mono text-ink">{i.given}</td>
              <td className="py-1 pl-2 text-right font-mono text-ink-soft">{i.expected}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[12px] text-ink-soft leading-relaxed">{g.modality.explanation}</p>
    </div>
  );
}

/** The reasons the modality chooser offers. */
export const REASON_OPTIONS = MODALITY_REASONS;
