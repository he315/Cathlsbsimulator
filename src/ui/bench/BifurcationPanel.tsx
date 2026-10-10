// The bifurcation bench's step panel (pci-bench-bifurcation): the technique
// choice, the technique's steps in the order of the shared catalogue
// (src/simulation/pci/technique/steps.ts), the controls of the step the learner
// is at (sizes, positions, pressures, the strut for each rewiring, one- or
// two-step kisses, each POT position), the bail-out after a provisional result
// that leaves the side branch compromised, and the findings. A step is done
// with "Do step"; a step the module makes conditional, and the optimising steps
// whose omission is itself the lesson (POT, kiss), can be left out. Findings an
// operator would see on imaging show at once; the others are named after the
// final assessment (in guided mode at once). Outside guided mode the step list and
// the step header show each step's neutral label, not the lesson's name, which
// would give away the choice the step asks for; the names return once the run is
// over. The side branch's state at step 6 of provisional stenting is the
// learner's judgement, read from the images.
import { useEffect, useState } from "react";
import {
  BAILOUTS,
  BIF_BY_ID,
  bifOutcome,
  canSkip,
  currentStep,
  escalationOffered,
  finetDiameter,
  geometryOf,
  isFinished,
  plannedTechniques,
  shownStep,
  visibleFindings,
  type BifFinding,
  type BifState,
  type StepInput,
} from "../../simulation/bench/bifurcation";
import { PLATFORMS, nearestOffered, platformFor, type PlatformId } from "../../simulation/bench/platforms";
import { balloonSizes, benchBalloonDevice, stentPressures } from "../../simulation/pciBench";
import { TECHNIQUE_STEPS, stepLabel, techniqueSteps, type TechniqueStep } from "../../simulation/pci/technique/steps";
import type { BifTechnique } from "../../content/lab/tips";

export interface BifurcationPanelProps {
  state: BifState;
  guided: boolean;
  onChoose: (t: BifTechnique) => void;
  onStep: (stepId: string, input: StepInput) => void;
  onEscalate: (t: BifTechnique) => void;
  onRestart: () => void;
  /** what the last step did, or why it was refused */
  message: string | null;
}

const NC = () => balloonSizes("non-compliant");
const NC_LEN = () => benchBalloonDevice("non-compliant").lengths.slice();

const fmt = (d: number) => d.toFixed(2).replace(/0$/, "");

/**
 * What each control shows before the learner touches it, which is also what is sent: the stent at its
 * chart's nominal pressure, a 3.0 mm balloon, markers at the carina (marked on the view) and 5 mm of stent
 * proximal to it. The SB stent's protrusion, the pulled-back reinflation pressure, the strut, the kiss's
 * inflation, the TAP deflation order and the culotte's first branch have no default: the learner enters or
 * chooses them.
 */
export function stepDefaults(state: BifState, step: TechniqueStep): StepInput {
  const p = platformFor("A");
  const stent: StepInput = { platformId: "A", stentMm: 3.0, lengthMm: p.lengths[Math.min(3, p.lengths.length - 1)], proxMm: 5 };
  switch (step.action) {
    case "park-balloon":
    case "branch-balloon":
      return { balloonMm: step.action === "park-balloon" ? 3.0 : 2.0 };
    case "position-stent":
      if (step.branch === "mv") return stent;
      if (state.technique === "tap" && step.id === "set-protrusion") return {};
      return { ...stent, proxMm: undefined };
    case "deploy-stent":
      if (state.technique === "culotte" || (step.branch === "mv" && state.technique !== "provisional")) return stent;
      if (step.branch === "sb") {
        const d = state.sbStent?.nominalMm ?? 3.0;
        return { atm: stentPressures(d).nominalAtm };
      }
      return {};
    case "crush":
      return { balloonMm: state.mvBalloonMm ?? 3.0, markerMm: 0 };
    case "kiss":
      return { balloonMm: 3.0, sbBalloonMm: 2.5 };
    case "pot":
      return { balloonMm: 3.0, balloonLenMm: 12, markerMm: 0 };
    default:
      return {};
  }
}

/** A platform's default length: its fourth length (or its last). */
const defaultLength = (p: ReturnType<typeof platformFor>) => p.lengths[Math.min(3, p.lengths.length - 1)];

/**
 * A stent input brought within its platform: the nearest diameter and length the platform offers, so what the
 * fields show after a platform switch is what is sent. Inputs without a platform pass unchanged.
 */
export function coerceStent(input: StepInput): StepInput {
  if (input.platformId === undefined) return input;
  const q = platformFor(input.platformId);
  return {
    ...input,
    stentMm: nearestOffered(q.diameters, input.stentMm ?? 3.0),
    lengthMm: input.lengthMm === undefined ? defaultLength(q) : nearestOffered(q.lengths, input.lengthMm),
  };
}

/** Whether a step asks for the SB stent's protrusion into the MV. */
const asksProtrusion = (state: BifState, step: TechniqueStep) =>
  step.action === "position-stent" && step.branch !== "mv" && !(state.technique === "tap" && step.id === "deliver-sb-stent");

/** Whether a step asks for the pressure of the pulled-back SB stent balloon's reinflation. */
const asksPostAtm = (state: BifState, step: TechniqueStep) =>
  step.action === "deploy-stent" && step.branch === "sb" && (state.technique === "dk-crush" || state.technique === "t-stent");

/** The values a step still needs typed before it can be done (they have no default, so leaving it is not an answer). */
export function missingValues(state: BifState, step: TechniqueStep, input: StepInput): string[] {
  const out: string[] = [];
  if (asksProtrusion(state, step) && input.protrusionMm === undefined) out.push("the protrusion");
  if (asksPostAtm(state, step) && input.postAtm === undefined) out.push("the reinflation pressure");
  return out;
}

/** The choices a step still needs before it can be done. */
export function missingChoices(state: BifState, step: TechniqueStep, input: StepInput): string[] {
  const out: string[] = [];
  if (step.action === "assess-branch" && !input.sbJudged) out.push("whether the side branch is compromised");
  if (step.action === "rewire" && !input.cell) out.push("the strut");
  if (step.action === "kiss" && !input.kiss) out.push("how the balloons are inflated");
  if (step.action === "kiss" && state.technique === "tap" && !input.deflate) out.push("which balloon is deflated first");
  if (step.action === "deploy-stent" && state.technique === "culotte" && step.id === "first-stent" && !input.branch) out.push("the branch for the first stent");
  return out;
}

/**
 * A number input. An `optional` field has no default: it shows empty until a number is typed, and clearing it
 * sends undefined. The others keep their earlier behaviour (cleared reads as 0, which is what they show).
 */
function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  optional = false,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
  optional?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-[13px]">
      <span className="text-ink-soft">{label}</span>
      <span className="flex items-center gap-1.5">
        <input
          type="number"
          className="field w-24 font-mono"
          value={value ?? ""}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(optional && e.target.value.trim() === "" ? undefined : Number(e.target.value))}
        />
        <span className="text-ink-faint text-[12px] w-8">{unit}</span>
      </span>
    </label>
  );
}

function SizeField({ label, value, sizes, onChange }: { label: string; value: number; sizes: readonly number[]; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-[13px]">
      <span className="text-ink-soft">{label}</span>
      <select className="field w-32 font-mono" value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {sizes.map((d) => (
          <option key={d} value={d}>
            {fmt(d)} mm
          </option>
        ))}
      </select>
    </label>
  );
}

function ChoiceField<T extends string>({ label, value, options, onChange }: { label: string; value: T | undefined; options: readonly { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <span className="text-ink-soft">{label}</span>
      <div className="seg">
        {options.map((o) => (
          <button key={o.id} type="button" className={`seg-btn ${value === o.id ? "seg-btn-active" : ""}`} aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StentFields({ input, set, withProx, proxLabel }: { input: StepInput; set: (p: Partial<StepInput>) => void; withProx: boolean; proxLabel: string }) {
  const p = platformFor(input.platformId);
  const d = input.stentMm ?? 3.0;
  return (
    <>
      <label className="flex items-center justify-between gap-3 text-[13px]">
        <span className="text-ink-soft">Platform</span>
        <select className="field w-32" value={p.id} onChange={(e) => set(coerceStent({ ...input, platformId: e.target.value as PlatformId }))}>
          {PLATFORMS.map((x) => (
            <option key={x.id} value={x.id}>
              {x.label}
            </option>
          ))}
        </select>
      </label>
      <SizeField label="Stent diameter" value={p.offers(d) ? d : p.diameters[0]} sizes={p.diameters} onChange={(v) => set({ stentMm: v })} />
      <div className="text-[12px] text-ink-faint text-right">labelled post-dilatation limit {fmt(p.limit(p.offers(d) ? d : p.diameters[0]))} mm</div>
      <SizeField label="Stent length" value={input.lengthMm ?? defaultLength(p)} sizes={p.lengths} onChange={(v) => set({ lengthMm: v })} />
      {withProx && <NumberField label={proxLabel} value={input.proxMm ?? 5} min={0} max={15} step={1} unit="mm" onChange={(v) => set({ proxMm: v })} />}
    </>
  );
}

/** The controls of one step. */
function StepControls({ state, step, input, set }: { state: BifState; step: TechniqueStep; input: StepInput; set: (p: Partial<StepInput>) => void }) {
  const t = state.technique!;
  const marker = (label = "Distal marker from the carina (+ beyond, − proximal)") => <NumberField label={label} value={input.markerMm ?? 0} min={-8} max={8} step={0.5} unit="mm" onChange={(v) => set({ markerMm: v })} />;
  switch (step.action) {
    case "park-balloon":
      return <SizeField label="MV balloon" value={input.balloonMm ?? 3.0} sizes={NC()} onChange={(v) => set({ balloonMm: v })} />;
    case "position-stent":
      if (step.branch === "mv") return <StentFields input={input} set={set} withProx proxLabel="Stent proximal to the carina" />;
      if (t === "tap" && step.id === "deliver-sb-stent") return <StentFields input={input} set={set} withProx={false} proxLabel="" />;
      return (
        <>
          {!(t === "tap" && step.id === "set-protrusion") && <StentFields input={input} set={set} withProx={false} proxLabel="" />}
          <NumberField optional label="SB stent protrusion into the MV" value={input.protrusionMm} min={-1} max={6} step={0.5} unit="mm" onChange={(v) => set({ protrusionMm: v })} />
        </>
      );
    case "deploy-stent":
      if (t === "culotte")
        return (
          <>
            {step.id === "first-stent" && (
              <ChoiceField label="First stent into" value={input.branch} options={[{ id: "sb", label: "Side branch" }, { id: "mv", label: "Main vessel" }]} onChange={(v) => set({ branch: v })} />
            )}
            <StentFields input={input} set={set} withProx proxLabel="Back into the proximal MV" />
          </>
        );
      if (step.branch === "sb")
        return (
          <>
            <NumberField label="Deployment pressure" value={input.atm ?? 12} min={6} max={22} step={1} unit="atm" onChange={(v) => set({ atm: v })} />
            {(t === "dk-crush" || t === "t-stent") && <NumberField optional label="Pulled-back reinflation" value={input.postAtm} min={0} max={22} step={1} unit="atm" onChange={(v) => set({ postAtm: v })} />}
          </>
        );
      if (t === "provisional") return <p className="text-[13px] text-ink-soft">Deploy the positioned MV stent with the SB wire jailed.</p>;
      return <StentFields input={input} set={set} withProx proxLabel="Stent proximal to the carina" />;
    case "crush":
      return (
        <>
          <SizeField label="Crush balloon" value={input.balloonMm ?? state.mvBalloonMm ?? 3.0} sizes={NC()} onChange={(v) => set({ balloonMm: v })} />
          {marker()}
          {t === "dk-crush" && (
            <label className="flex items-center gap-2 text-[13px] text-ink-soft">
              <input type="checkbox" checked={input.potMm !== undefined} onChange={(e) => set(e.target.checked ? { potMm: 3.5, potLenMm: 8, potMarkerMm: 0 } : { potMm: undefined, potLenMm: undefined, potMarkerMm: undefined })} />
              Follow with a POT before the rewiring
            </label>
          )}
          {input.potMm !== undefined && (
            <>
              <SizeField label="POT balloon" value={input.potMm} sizes={NC()} onChange={(v) => set({ potMm: v })} />
              <SizeField label="POT balloon length" value={input.potLenMm ?? 8} sizes={NC_LEN()} onChange={(v) => set({ potLenMm: v })} />
              <NumberField label="POT distal marker from the carina" value={input.potMarkerMm ?? 0} min={-8} max={8} step={0.5} unit="mm" onChange={(v) => set({ potMarkerMm: v })} />
            </>
          )}
        </>
      );
    case "rewire":
      return (
        <ChoiceField
          label="Strut"
          value={input.cell}
          options={[
            { id: "proximal", label: "Proximal" },
            { id: "distal", label: "Distal" },
          ]}
          onChange={(v) => set({ cell: v })}
        />
      );
    case "assess-branch":
      return (
        <ChoiceField
          label="Side branch"
          value={input.sbJudged}
          options={[
            { id: "compromised", label: "Compromised" },
            { id: "open", label: "Not compromised" },
          ]}
          onChange={(v) => set({ sbJudged: v })}
        />
      );
    case "branch-balloon":
      return <SizeField label="SB balloon" value={input.balloonMm ?? 2.0} sizes={NC()} onChange={(v) => set({ balloonMm: v })} />;
    case "kiss": {
      const mv = input.balloonMm ?? 3.0;
      const sb = input.sbBalloonMm ?? 2.5;
      return (
        <>
          <SizeField label="MV balloon" value={mv} sizes={NC()} onChange={(v) => set({ balloonMm: v })} />
          <SizeField label="SB balloon" value={sb} sizes={NC()} onChange={(v) => set({ sbBalloonMm: v })} />
          <div className="text-[12.5px] text-ink-soft text-right font-mono">0.678 × ({fmt(mv)} + {fmt(sb)}) = {finetDiameter(mv, sb).toFixed(2)} mm</div>
          <ChoiceField label="Inflation" value={input.kiss} options={[{ id: "one-step", label: "Both together" }, { id: "two-step", label: "Two-step" }]} onChange={(v) => set({ kiss: v })} />
          {t === "tap" && (
            <ChoiceField
              label="Deflate first"
              value={input.deflate}
              options={[
                { id: "mv-first", label: "MV" },
                { id: "sb-first", label: "SB" },
                { id: "together", label: "Together" },
              ]}
              onChange={(v) => set({ deflate: v })}
            />
          )}
        </>
      );
    }
    case "pot":
      return (
        <>
          <SizeField label="POT balloon" value={input.balloonMm ?? 3.0} sizes={NC()} onChange={(v) => set({ balloonMm: v })} />
          <SizeField label="Balloon length" value={input.balloonLenMm ?? 12} sizes={NC_LEN()} onChange={(v) => set({ balloonLenMm: v })} />
          {marker()}
        </>
      );
    default:
      return null;
  }
}

function FindingRow({ f }: { f: BifFinding }) {
  const tone = f.severity === "failure" ? "notice-danger" : f.severity === "major" ? "notice-warn" : "notice-info";
  return (
    <li className={`notice ${tone}`}>
      <span className="font-mono text-[12px] shrink-0">{f.step ? `Step ${f.step}` : "Plan"}</span>
      <span>{f.text}</span>
    </li>
  );
}

export default function BifurcationPanel({ state, guided, onChoose, onStep, onEscalate, onRestart, message }: BifurcationPanelProps) {
  const g = geometryOf(state);
  const step = currentStep(state);
  // after a failure the list marks the step that failed, not the one after it
  const shown = shownStep(state);
  const [chosen, setInput] = useState<StepInput>({});
  // a fresh set of choices at each step
  useEffect(() => setInput({}), [state.technique, state.next, state.presetId]);
  const set = (p: Partial<StepInput>) => setInput((x) => ({ ...x, ...p }));
  const input: StepInput = step ? coerceStent({ ...stepDefaults(state, step), ...chosen }) : chosen;
  const missing = step ? missingChoices(state, step, input) : [];
  const toEnter = step ? missingValues(state, step, input) : [];
  const findings = visibleFindings(state, guided);
  const done = isFinished(state);
  const outcome = done || state.failure ? bifOutcome(state) : null;
  // the lesson's step names give choices away: shown in guided mode, and once the run is over
  const reveal = guided || done || !!state.failure;

  return (
    <div className="panel">
      <div className="panel-head">
        <span>{state.technique ? TECHNIQUE_STEPS[state.technique].name : "Choose the technique"}</span>
        {state.escalatedFrom && <span className="chip">bail-out after provisional</span>}
      </div>
      <div className="p-4 space-y-4">
        {!state.technique && (
          <div className="space-y-2">
            <p className="text-[13px] text-ink-soft">
              {g.mvName} and {g.sbName}: proximal {fmt(g.proxRefMm)} mm, distal {fmt(g.distRefMm)} mm, side branch {fmt(g.sbRefMm)} mm, angle about {g.angleDeg}°.
            </p>
            <div className="flex flex-wrap gap-2">
              {plannedTechniques(BIF_BY_ID[state.presetId]).map((o) => (
                <button key={o.technique} type="button" className="btn" onClick={() => onChoose(o.technique)}>
                  {TECHNIQUE_STEPS[o.technique].name}
                </button>
              ))}
            </div>
          </div>
        )}

        {state.technique && (
          <ol className="space-y-0.5 text-[13px]" aria-label="Steps">
            {techniqueSteps(state.technique).map((s) => {
              const rec = [...state.history].reverse().find((h) => h.technique === state.technique && h.n === s.n);
              const cur = shown?.n === s.n;
              return (
                <li key={s.id} className={`flex gap-2 rounded px-2 py-1 ${cur ? "bg-accent-tint text-ink" : rec ? "text-ink-soft" : "text-ink-faint"}`} aria-current={cur ? "step" : undefined}>
                  <span className="font-mono w-6 text-right shrink-0">{s.n}</span>
                  <span>
                    {stepLabel(s, reveal)}
                    {rec?.skipped ? " (left out)" : ""}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        {step && !state.failure && (
          <div className="space-y-2.5 border-t border-line pt-3">
            <div className="text-[13.5px] text-ink font-medium">
              Step {step.n}: {stepLabel(step, reveal)}
            </div>
            <StepControls state={state} step={step} input={input} set={set} />
            {toEnter.length > 0 && <p className="text-[12.5px] text-ink-faint">Enter {toEnter.join(" and ")}.</p>}
            {missing.length > 0 && <p className="text-[12.5px] text-ink-faint">Choose {missing.join(" and ")}.</p>}
            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" className="btn btn-accent" disabled={missing.length > 0 || toEnter.length > 0} onClick={() => onStep(step.id, input)}>
                Do step {step.n}
              </button>
              {canSkip(step) && (
                <button type="button" className="btn" onClick={() => onStep(step.id, { skip: true })}>
                  Leave out
                </button>
              )}
            </div>
          </div>
        )}

        {message && <p className="text-[13px] text-ink-soft">{message}</p>}

        {escalationOffered(state) && g.techniques.some((o) => BAILOUTS.includes(o.technique)) && (
          <div className="space-y-2 border-t border-line pt-3">
            <p className="text-[13px] text-ink-soft">If the {g.sbName} still needs a stent after the provisional sequence, bail out now; otherwise do the final assessment.</p>
            <div className="flex flex-wrap gap-2">
              {g.techniques
                .filter((o) => BAILOUTS.includes(o.technique))
                .map((o) => (
                  <button key={o.technique} type="button" className="btn" onClick={() => onEscalate(o.technique)}>
                    Bail out: {TECHNIQUE_STEPS[o.technique].name}
                  </button>
                ))}
            </div>
          </div>
        )}

        {state.failure && (
          <div className="notice notice-danger">
            <span>The run has failed at step {state.failure.step}: {state.failure.text}</span>
          </div>
        )}

        {findings.length > 0 && (
          <ul className="space-y-1.5" aria-label="Findings">
            {findings.map((f, i) => (
              <FindingRow key={i} f={f} />
            ))}
          </ul>
        )}

        {outcome && (
          <div className="border-t border-line pt-3 space-y-2">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-ink-soft">Result</span>
              <span className="font-mono text-ink">
                {outcome.score} / 100 · {outcome.passed ? "passed" : "not passed"}
              </span>
            </div>
            {!outcome.findings.length && <p className="text-[13px] text-ink-soft">Every step followed the module's rules.</p>}
            <button type="button" className="btn" onClick={onRestart}>
              Restart this bifurcation
            </button>
          </div>
        )}
        {!outcome && state.technique && (
          <button type="button" className="btn btn-ghost" onClick={onRestart}>
            Restart
          </button>
        )}
      </div>
    </div>
  );
}
