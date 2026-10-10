// The physiology decision panel and the post-PCI study (physiology-post-pci-handover).
//
// DecisionPanel: the decision buttons of a pressure-wire study, graded after the choice (the right
// answer is marked only once the learner has decided), with the teaching shown underneath. The options
// are the case's: a post-PCI case (CoronaryCase.stent) offers the four branches of Brilakis's post-PCI
// algorithm (lesson pm-physiology-after-pci, Brilakis Fig 12.1); any other case offers the lab's
// treat-or-defer decisions (the same labels as the physiology lab, src/ui/sections/PhysiologyLab.tsx).
// decisionOptionsFor(case) picks them, so the lab can mount this panel for every preset.
//
// PostPciStudy: a post-PCI measurement for a stent deployed elsewhere (the IVUS and OCT bench's own
// stent, src/ui/bench/AssessPanel.tsx): measure the final FFR and resting wave-free ratio, pull back
// through the stent, then decide. The wire is taken as set up and equalised and hyperaemia as maximal,
// so the study is about reading the result, not about the set-up (the physiology lab teaches that). The
// screen shows what the operator sees (the values, the pullback with the stent edges marked); which
// variant the case is and why appear only after the decision.
import { useMemo, useState, type ReactNode } from "react";
import {
  CUTOFF,
  POST_PCI_GOOD_FFR,
  initialPostPciStudy,
  postPciAboveGood,
  postPciLosses,
  pullback,
  scorePostPciStudy,
  type CaseDecision,
  type CoronaryCase,
  type PostPciStudyState,
} from "../../simulation/physiology";
import PullbackPlot from "./PullbackPlot";

export interface DecisionOption {
  id: CaseDecision;
  label: string;
}

/** The post-PCI decisions: Brilakis's algorithm as written (lesson pm-physiology-after-pci). Each label says what it rests on. */
export const POST_PCI_DECISION_OPTIONS: readonly DecisionOption[] = [
  { id: "post-dilate", label: "Pressure lost inside the stent: post-dilate, or add a stent" },
  { id: "treat-edge", label: "A focal step outside the stent: stent it" },
  { id: "accept-diffuse", label: "A gradual fall outside the stent with no step: no further treatment" },
  { id: "accept-result", label: `Final value above the cut-off (FFR above ${CUTOFF.ffr.toFixed(2)}, iFR above ${CUTOFF.nhpr.toFixed(2)}): accept the result` },
];

/**
 * The treat-or-defer decisions of a study before PCI: a copy of the physiology lab's DECISIONS
 * (src/ui/sections/PhysiologyLab.tsx), which DecisionPanel.test.ts holds equal to it. When the lab mounts
 * this panel, its own constant goes rather than being kept as a second copy.
 */
export const STUDY_DECISION_OPTIONS: readonly DecisionOption[] = [
  { id: "treat", label: "Physiologically significant: treat with PCI" },
  { id: "defer", label: "Not significant or not focal: defer PCI, optimise medical therapy" },
  { id: "treat-first-then-remeasure", label: "Treat the lesion with the larger step first, then re-measure" },
  { id: "microvascular", label: "No epicardial target: microvascular dysfunction, treat medically and consider spasm testing" },
  { id: "imaging", label: "Physiology cannot settle this lesion: assess it with intravascular imaging" },
];

/** The decisions a case offers: the post-PCI algorithm for a stented case, treat or defer for any other. */
export function decisionOptionsFor(c: Pick<CoronaryCase, "stent">): readonly DecisionOption[] {
  return c.stent ? POST_PCI_DECISION_OPTIONS : STUDY_DECISION_OPTIONS;
}

export interface DecisionPanelProps {
  options: readonly DecisionOption[];
  /** the decision taken, or null */
  decided: string | null;
  /** whether an option is right for the case (shown only after the decision) */
  accepted: (id: CaseDecision) => boolean;
  onDecide: (id: CaseDecision) => void;
  /** no decision yet allowed (for example before the final value is measured) */
  disabled?: boolean;
  title?: string;
  /** what appears under the buttons once decided (the teaching, the debrief items) */
  children?: ReactNode;
}

export default function DecisionPanel({ options, decided, accepted, onDecide, disabled = false, title = "Decision", children }: DecisionPanelProps) {
  const done = decided !== null;
  return (
    <div className="panel p-4">
      <div className="stat-label mb-2">{title}</div>
      <div className="grid md:grid-cols-2 gap-2" role="group" aria-label={title}>
        {options.map((d) => {
          const right = done && accepted(d.id);
          return (
            <button
              key={d.id}
              type="button"
              disabled={done || disabled}
              data-decision={d.id}
              onClick={() => onDecide(d.id)}
              className={`text-left rounded-lg border px-3 py-2 text-[14px] ${
                !done ? `border-line text-ink-soft ${disabled ? "opacity-50" : "hover:border-accent/50"}` : right ? "border-good/60 bg-good/[0.08] text-ink" : d.id === decided ? "border-danger/60 bg-danger/[0.08]" : "border-line opacity-50"
              }`}
            >
              {d.label}
            </button>
          );
        })}
      </div>
      {done && children && <div className="mt-3 animate-fadein text-[14px] text-ink-soft leading-relaxed">{children}</div>}
    </div>
  );
}

export interface PostPciStudyProps {
  /** a post-PCI case (with `stent`) */
  case: CoronaryCase;
  /** called once with the graded study when the learner decides */
  onDecided?: (s: PostPciStudyState, score: ReturnType<typeof scorePostPciStudy>) => void;
  /** the study's state, for a caller that keeps it (default: kept here) */
  initial?: PostPciStudyState;
}

/**
 * The stent's extent under the pullback plot, on the plot's own horizontal scale (PullbackPlot.tsx: a
 * 760-wide viewBox, sensor positions 0 to 1 drawn from 50 to 740; the 1 px inset matches the plot
 * panel's border), so where a step lies against the stent can be read: inside the band or outside it.
 */
export function StentBand({ from, to }: { from: number; to: number }) {
  const W = 760,
    x0 = 50,
    x1 = 740;
  const sx = (x: number) => x0 + (x1 - x0) * Math.max(0, Math.min(1, x));
  const a = sx(Math.min(from, to)),
    b = sx(Math.max(from, to));
  return (
    <div className="px-px" data-part="stent-band">
      <svg viewBox={`0 0 ${W} 26`} className="w-full" role="img" aria-label="Stented segment along the pullback">
        <line x1={x0} y1={8} x2={x1} y2={8} stroke="#2E343C" strokeWidth={2} />
        <rect x={a} y={2} width={Math.max(2, b - a)} height={12} rx={2} fill="rgba(79,142,247,0.25)" stroke="#4F8EF7" strokeWidth={1.5} />
        <text x={(a + b) / 2} y={25} fontSize={11} fill="#A6ADB8" textAnchor="middle">
          stent
        </text>
      </svg>
    </div>
  );
}

/** A post-PCI study of one case: measure, pull back, decide (see the note at the top of this file). */
export function PostPciStudy({ case: c, onDecided, initial }: PostPciStudyProps) {
  const [s, setS] = useState<PostPciStudyState>(initial ?? initialPostPciStudy());
  const losses = useMemo(() => postPciLosses(c), [c]);
  const pts = useMemo(() => (s.pulledBack ? pullback(c, 1, 60) : []), [c, s.pulledBack]);
  const stent = c.stent;
  const decided = s.decision !== null;
  const score = decided ? scorePostPciStudy(c, s) : null;
  const decide = (id: CaseDecision) => {
    if (decided) return;
    const next = { ...s, decision: id };
    setS(next);
    onDecided?.(next, scorePostPciStudy(c, next));
  };
  return (
    <div className="space-y-3" data-part="post-pci-study">
      <div className="panel p-4 space-y-2 text-[13px]">
        <div className="stat-label">Post-PCI physiology</div>
        <p className="text-ink-soft leading-relaxed">{c.brief}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn" disabled={s.measured} onClick={() => setS({ ...s, measured: true })}>
            Measure the final FFR
          </button>
          <button type="button" className="btn" disabled={!s.measured || s.pulledBack || decided} onClick={() => setS({ ...s, pulledBack: true })}>
            Pull back through the stent
          </button>
        </div>
        {s.measured && (
          <div className="metric text-ink" data-part="post-pci-values">
            FFR {losses.ffr.toFixed(2)} · resting wave-free ratio {losses.wfp.toFixed(2)}
          </div>
        )}
      </div>
      {s.pulledBack && pts.length > 1 && (
        <div>
          <PullbackPlot pts={pts} kind="FFR" marks={stent ? [stent.from, stent.to] : []} />
          {stent && <StentBand from={stent.from} to={stent.to} />}
        </div>
      )}
      {s.pulledBack && stent && <div className="text-[12px] text-ink-faint">The band under the plot: the stent, from its proximal to its distal edge.</div>}
      <DecisionPanel options={decisionOptionsFor(c)} decided={s.decision} accepted={(id) => id === c.decision || !!c.alsoAccepted?.includes(id)} onDecide={decide} disabled={!s.measured} title="After the stent">
        <p>{c.teaching}</p>
        {score && (
          <ul className="text-[13px] space-y-0.5 mt-2">
            <li className={score.decisionCorrect ? "text-good" : "text-warn"}>
              {score.decisionCorrect ? "✓" : "○"} {POST_PCI_DECISION_OPTIONS.find((o) => o.id === score.expected)?.label ?? score.expected}
            </li>
            {score.pullbackNeeded && (
              <li className={s.pulledBack ? "text-good" : "text-warn"}>
                {s.pulledBack ? "✓" : "○"} Pulled back through the stent before deciding (the value was {CUTOFF.ffr.toFixed(2)} or less, or the iFR {CUTOFF.nhpr.toFixed(2)} or less)
              </li>
            )}
            {!score.pullbackNeeded && postPciAboveGood(losses.ffr) && <li className="text-ink-soft">Final FFR above {POST_PCI_GOOD_FFR}</li>}
          </ul>
        )}
      </DecisionPanel>
    </div>
  );
}
