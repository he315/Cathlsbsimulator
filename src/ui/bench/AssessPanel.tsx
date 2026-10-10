// IVUS and OCT bench, step 5: the final pullback judged by the shared EAPCI
// criteria (src/simulation/imaging/criteria.ts), the events of the procedure
// and the lesion's teaching (pci-bench-imaging-unify). This is the debrief of
// the bench run: the complications are named here.
//
// pci-bench-measure-and-plan adds the pre-PCI plan's debrief: the modality
// against the goal (and what a wrong choice cost), each plan entry against the
// frames (src/simulation/bench/measure.ts), the contrast the imaging runs used,
// and for a left main bifurcation each segment against its target (circumflex
// ostium 5, LAD ostium 6, polygon of confluence 7, left main 8 mm²; Brilakis
// figure 17.3). The plan comes from the bench's plan store, or `plan` when given.
// A run that reached the debrief with a plan record but no submitted plan is
// told so: the missing plan is a failed item, not a silent gap.
//
// physiology-post-pci-handover adds 'Measure post-PCI physiology'. The post-PCI preset is chosen from
// the post-stent lumen (benchPostPciVariant: an expansion below 80% is the in-stent step, a residual
// narrowing beside the stent or a geographic miss the focal edge step, otherwise the good result), and
// the bench studies that preset's case (src/ui/physiology/DecisionPanel.tsx PostPciStudy: final FFR,
// pullback through the stent, the decision of Brilakis's post-PCI algorithm), the same case the
// hand-over asks the physiology lab to open (params.scenario), so the bench and the lab grade one stent
// result the same way. The case built from the deployed stent itself (physiology.ts
// postPciCaseFromStent: the residual narrowing inside the stent from its expansion, the native narrowing
// it left beside it from the lumen) is context only, carried in the payload with its own algorithm
// decision (physicsDecision): under the engine's current calibration a bench stent reads a high FFR
// whatever its expansion (a 70% stent about 0.97), so its own grading would contradict the preset's.
// After the decision, the section says so for an underexpanded stent: imaging, not the pressure wire,
// judges its expansion. The hand-over button appears only once the lab publishes the presets
// (postPciHandoffAvailable, src/content/lab/presets/physiology/postPci.launch.ts).
import { useMemo, useState } from "react";
import type { BenchLesion, Modality, StentResult } from "../../simulation/pciBench";
import { imagingContrastMl, inAorta, lumen, preImaging } from "../../simulation/pciBench";
import { gradeModality, gradePlan, lmSegmentCheck } from "../../simulation/bench/measure";
import { EXPANSION_MIN_PCT } from "../../simulation/imaging/criteria";
import {
  CUTOFF,
  POST_PCI_PRESET_BY_ID,
  POST_PCI_PRESET_FOR,
  edgeResiduals,
  ffr,
  postPciCaseFromStent,
  postPciLow,
  postPciLosses,
  type CoronaryCase,
  type PostPciStentInput,
  type PostPciStudyState,
  type PostPciVariant,
} from "../../simulation/physiology";
import type { LaunchParams } from "../../content/schema";
import { putHandover, type LabTransferInput } from "../../state/useLabHandoverStore";
import { useUiStore } from "../../state/useUiStore";
import { PRACTICE_INDEX, type PracticeIndex } from "../content/practiceIndex";
import { benchResultEvents } from "../lab/benchTips";
import { PostPciStudy } from "../physiology/DecisionPanel";
import { BenchRow } from "./ImagePanel";
import { PlanReview, useBenchPlanStore, type BenchPlanRecord } from "./PlanForm";

// ---------------------------------------------------------------------------
// Post-PCI physiology from the bench's stent
// ---------------------------------------------------------------------------

/**
 * The deployed stent as the post-PCI builder reads it: the coronary part of the pullback, the stent's
 * extent and achieved diameters (the part in the aorta left out), its worse-half expansion, the native
 * lumen beside it (before any treatment: the bench keeps no lumen gained outside the stent) and the
 * reference lumens of preImaging.
 */
export function postPciInputFromBench(l: BenchLesion, result: StentResult): PostPciStentInput {
  const from = l.ostial ? l.ostial.aortaMm : 0;
  const pre = preImaging(l, "IVUS");
  return {
    vessel: l.leftMain ? "LM" : l.vessel,
    segmentFromMm: from,
    segmentToMm: l.segmentMm,
    stentFromMm: Math.max(from, result.x0),
    stentToMm: result.x1,
    stentProfile: result.profile.filter((p) => !inAorta(l, p.x)).map((p) => ({ x: p.x, d: p.d })),
    expansionPct: result.expansion,
    nativeLumen: (x) => lumen(l, Math.max(from, Math.min(l.segmentMm, x))),
    proxRefMm: pre.proxRefLumen,
    distRefMm: pre.distRefLumen,
  };
}

/**
 * The post-PCI preset the hand-over names, chosen from the post-stent lumen: an expansion below 80%
 * (EAPCI, SIM_FACTS §12; recoil included) is the in-stent step; a residual native narrowing beside the
 * stent (physiology.ts edgeResiduals) or a geographic miss the focal edge step; otherwise the good result.
 * The diffuse variant has no bench counterpart (the bench models no disease beyond its segment).
 */
export function benchPostPciVariant(l: BenchLesion, result: StentResult, input: PostPciStentInput = postPciInputFromBench(l, result)): PostPciVariant {
  if (result.expansion < EXPANSION_MIN_PCT) return "instent";
  if (result.geographicMiss || edgeResiduals(input).length > 0) return "edge";
  return "good";
}

/** What the bench hands to the physiology lab: the preset chosen from the lumen (which the bench studies and the lab opens), the stent's events and, as context, the case built from the stent. */
export interface BenchPostPciHandover {
  /** the variant the post-stent lumen names (benchPostPciVariant); the preset the lab opens */
  lumenVariant: PostPciVariant;
  presetId: string;
  /** the preset's case: what the bench's study measures and grades, and what the lab opens */
  case: CoronaryCase;
  /** the post-PCI case built from this stent (physiology.ts postPciCaseFromStent): context, not graded */
  builtCase: CoronaryCase;
  transfer: LabTransferInput;
}

/**
 * The hand-over of a post-PCI study from the bench: to the physiology lab, which opens the chosen preset
 * (params.scenario), with the deployed stent's own events (stent-underexpanded or stent-recoil, as the
 * bench raised them). The payload is context only: the variant the lumen names (lumenVariant), the case
 * built from the stent (builtCase) and that case's own algorithm decision (physicsDecision), which can
 * differ from the preset's (see the note at the top of this file).
 */
export function benchPostPciHandover(l: BenchLesion, result: StentResult, mode?: LaunchParams["mode"]): BenchPostPciHandover {
  const input = postPciInputFromBench(l, result);
  const variant = benchPostPciVariant(l, result, input);
  const presetId = POST_PCI_PRESET_FOR[variant];
  const built = postPciCaseFromStent(input, `post-pci-bench:${l.id}`);
  return {
    lumenVariant: variant,
    presetId,
    case: POST_PCI_PRESET_BY_ID[presetId].case,
    builtCase: built,
    transfer: {
      to: "physiology",
      from: "pci-bench",
      params: { scenario: presetId, ...(mode ? { mode } : {}) },
      events: benchResultEvents(result),
      payload: { postPci: { lumenVariant: variant, presetId, lesionId: l.id, physicsDecision: built.decision, builtCase: built } },
    },
  };
}

/** Whether the physiology lab publishes the preset (the hand-over's button is shown only then). */
export function postPciHandoffAvailable(presetId: string, index: PracticeIndex = PRACTICE_INDEX): boolean {
  return !!index.known.scenarios.get("physiology")?.has(presetId);
}

/** The stent result a post-PCI study belongs to: a new deployment or post-dilatation starts a new study. */
const postPciStudyKey = (l: BenchLesion, r: StentResult) => [l.id, r.x0, r.x1, r.expansion, r.msa, r.geographicMiss].join("|");

/** The bench's post-PCI section: measure the physiology of the preset this stent's result names, or hand the study to the physiology lab. */
export function PostPciSection({
  lesion,
  result,
  available,
  initiallyOpen = false,
  initialStudy,
}: {
  lesion: BenchLesion;
  result: StentResult;
  available?: boolean;
  initiallyOpen?: boolean;
  /** the study's starting state (default: nothing done yet) */
  initialStudy?: PostPciStudyState;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const key = postPciStudyKey(lesion, result);
  // the decision belongs to one stent result; the notes below appear only once it is taken
  const [decidedFor, setDecidedFor] = useState<string | null>(initialStudy?.decision ? key : null);
  const decided = decidedFor === key;
  const openSim = useUiStore((s) => s.openSim);
  const h = useMemo(() => (open ? benchPostPciHandover(lesion, result) : null), [open, lesion, result]);
  // the variant is computed only when the lab publishes a post-PCI preset at all (held back for now)
  const canHand = useMemo(
    () => available ?? (Object.values(POST_PCI_PRESET_FOR).some((id) => postPciHandoffAvailable(id)) && postPciHandoffAvailable(POST_PCI_PRESET_FOR[benchPostPciVariant(lesion, result)])),
    [available, lesion, result]
  );
  const underexpanded = result.expansion < EXPANSION_MIN_PCT;
  const builtLow = h ? postPciLow(postPciLosses(h.builtCase)) : false;
  return (
    <div className="pt-2 space-y-2" data-part="post-pci">
      <div className="stat-label">Post-PCI physiology</div>
      {!open ? (
        <button type="button" className="btn" onClick={() => setOpen(true)}>
          Measure post-PCI physiology
        </button>
      ) : (
        h && (
          <>
            <p className="text-[12px] text-ink-faint">The pressure wire lab&apos;s post-stent case chosen from this stent&apos;s final result. The same case opens in the lab.</p>
            <PostPciStudy key={key} case={h.case} initial={initialStudy} onDecided={() => setDecidedFor(key)} />
            {decided && underexpanded && (
              <div className="text-[12px] text-warn" data-part="post-pci-imaging-note">
                This stent&apos;s expansion is below the {EXPANSION_MIN_PCT}% imaging criterion above.
                {!builtLow &&
                  ` In this model the residual narrowing of the stent you deployed reads FFR ${ffr(h.builtCase).toFixed(2)}, above the ${CUTOFF.ffr.toFixed(2)} cut-off: an underexpanded stent need not lower the final FFR, so imaging, not the pressure wire, shows that it still needs optimising. An underexpanded stent is more likely to restenose or thrombose.`}
              </div>
            )}
            {canHand && (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  putHandover(h.transfer);
                  openSim("physiology", h.transfer.params);
                }}
              >
                Open the study in the pressure wire lab
              </button>
            )}
          </>
        )
      )}
    </div>
  );
}

export interface AssessPanelProps {
  lesion: BenchLesion;
  modality: Modality;
  result: StentResult;
  onMore: () => void;
  onRestart: () => void;
  /** the run's plan record (default: the bench's plan store for this lesion) */
  plan?: BenchPlanRecord | null;
}

export default function AssessPanel({ lesion: l, modality, result, onMore, onRestart, plan }: AssessPanelProps) {
  const stored = useBenchPlanStore((s) => s.records[l.id]) ?? useBenchPlanStore.getState().records[l.id];
  const rec = plan === undefined ? stored : plan ?? undefined;
  const record = rec && rec.modality === modality ? rec : undefined;
  const grade = record?.submitted ? gradePlan(l, record.submitted) : null;
  const mg = l.goal ? gradeModality(l, modality, record?.reasonId ?? null) : null;
  // one source for the imaging contrast: the plan record's pre-PCI runs and the final pullback. deploy()'s
  // result.imagingContrastMl is the same formula at the runs its caller passed (two by default), so it is
  // shown only when there is no plan record.
  const runs = record ? record.runs.length + 1 : 2;
  const contrast = record ? imagingContrastMl(l, modality, runs) : result.imagingContrastMl;
  const segments = lmSegmentCheck(l, result);
  return (
    <div className="panel p-4 space-y-2 text-[13px] animate-fadein">
      <div className="flex items-center justify-between">
        <div className="stat-label">Final {modality}</div>
        <span className={`metric text-3xl font-semibold ${result.score >= 80 ? "text-good" : result.score >= 60 ? "text-warn" : "text-danger"}`}>{result.score}</span>
      </div>
      <BenchRow k="Minimal stent area" v={`${result.msa.toFixed(2)} mm² at ${result.msaAt.toFixed(1)} mm`} />
      <BenchRow k="Expansion, proximal half / distal half" v={`${result.expansionProx.toFixed(0)}% / ${result.expansionDist.toFixed(0)}%`} />
      <BenchRow k="MSA ÷ mean reference lumen area" v={`${result.expansionAvg.toFixed(0)}%`} />
      <BenchRow k="Maximum malapposition" v={`${result.maxMalapposition.toFixed(2)} mm`} />
      <BenchRow
        k="Edge plaque burden, proximal / distal"
        v={`${l.ostial && result.ostiumCovered ? "ostium covered" : `${(result.proxEdgePB * 100).toFixed(0)}%`} / ${(result.distEdgePB * 100).toFixed(0)}%`}
      />
      <BenchRow k="Imaging contrast" v={`${contrast} mL${modality === "OCT" ? ` (${runs} OCT runs)` : ""}`} />
      <ul className="pt-1 space-y-0.5" aria-label="Optimisation criteria">
        {result.criteria.map((c) => (
          <li key={c.label} className={c.ok ? "text-good" : "text-danger"}>
            {c.ok ? "✓" : "✗"} {c.label}
          </li>
        ))}
      </ul>
      {segments && (
        <div className="pt-2">
          <div className="stat-label mb-1">Left main segments</div>
          <ul className="space-y-0.5" aria-label="Left main segment targets">
            {segments.map((s) => (
              <li key={s.id} className={s.ok ? "text-good" : "text-danger"}>
                {`${s.ok ? "✓" : "✗"} ${s.label}: ${s.areaMm2.toFixed(2)} mm² (target ${s.targetMm2} mm²${s.basis === "native" ? ", not stented" : ""})`}
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.events.length > 0 && (
        <div className="pt-2">
          <div className="stat-label mb-1">Events</div>
          {result.events.map((e, i) => (
            <div key={i} className={e.severity === "major" ? "text-danger" : "text-warn"}>
              {e.text}
            </div>
          ))}
        </div>
      )}
      {mg && (
        <div className="pt-2 space-y-1">
          <div className="stat-label">Modality</div>
          <div className={mg.ok ? "text-good" : "text-danger"}>
            {mg.ok ? "✓" : "✗"} {modality} for “{l.goal!.text}”{mg.expected !== "either" && !mg.ok ? ` (${mg.expected} fits this goal)` : ""}
          </div>
          {mg.consequence && <div className="text-warn">{mg.consequence}</div>}
        </div>
      )}
      {grade ? (
        <div className="pt-2">
          <PlanReview grade={grade} title="Pre-PCI plan against the frames" />
        </div>
      ) : (
        record && (
          <div className="pt-2">
            <div className="stat-label mb-1">Pre-PCI plan</div>
            <div className="text-danger">✗ No pre-PCI plan was entered.</div>
          </div>
        )
      )}
      <p className="text-ink-soft leading-relaxed pt-2">{l.teaching}</p>
      <PostPciSection lesion={l} result={result} />
      <div className="flex gap-2 pt-1">
        <button type="button" className="btn" onClick={onMore}>
          Post-dilate more
        </button>
        <button type="button" className="btn btn-accent" onClick={onRestart}>
          Start again
        </button>
      </div>
    </div>
  );
}
