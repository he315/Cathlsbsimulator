// IVUS and OCT bench: imaging-guided preparation, stenting and optimisation on
// the teaching lesions of src/simulation/pciBench.ts (pci-bench-imaging-unify).
//
// The images come from the PCI lab's frame generator (src/simulation/pci/ivus.ts)
// and are drawn by the shared renderer (src/ui/imaging/IntravascularView.tsx,
// LongitudinalView.tsx); devices are the catalogue's
// (src/simulation/pci/equipment.ts); the result is judged by the shared EAPCI
// criteria. Each step is its own panel (src/ui/bench/). The step, the events and
// the modality feed the lab tips (src/ui/lab/benchTips.ts) under the run's
// policy (useLabRun: guided practice shows tips as they apply, supervised and
// independent after asking for help, exams none); the run is logged once, at the
// first final pullback. A lesson or case opens the bench at a scenario, a start
// step and a modality through the launch store (useLabLaunch("pci-bench"); the
// params are listed in src/content/lab/presets/pci-bench/core.launch.ts). In
// DEV builds window.__lab.bench exposes the context, tips, state and events.
//
// pci-bench-bifurcation: a second workspace, the bifurcation bench
// (src/simulation/bench/bifurcation.ts, src/ui/bench/BifurcationPanel.tsx,
// src/ui/imaging/BifurcationView.tsx), where provisional stenting, TAP, reverse
// crush, DK crush and culotte are built step by step on the shared technique
// step catalogue. A launch naming a bifurcation preset (scenario or preset
// bif-*, with start, technique and step; bifurcation.launch.ts) opens it; its
// tip context reports the technique and step, and its run is logged once, when
// the technique is finished or has failed. __lab.bench.bifurcation() reports it.
// Each workspace keeps its own run (its own launch mode and run key), so the
// Lesion/Bifurcation tabs switch views without restarting either run.
//
// pci-bench-measure-and-plan: the slice read-out (EEM area, lumen area, plaque
// burden, calcium) is ground truth, so it waits for the debrief in supervised,
// independent and exam runs and for the learner's plan in guided practice
// (sliceReadoutVisible); guided and exam runs cannot leave the image step until
// the plan is entered. The pullback view uses the bench's frames per branch
// (aorta and uncleared OCT frames read 'not measurable'), deploy() counts the
// plan record's runs for the imaging contrast, and the run log records the
// modality choice and each plan entry. A new run drops the lesion's plan record.
//
// repair-bench-host-wiring: the optimise panel is given the deployed stent and the
// lesion (the deployed platform's limit, the ostial flare); the stent panel the
// procedure so far (the balloons recorded on the bench); the pullback view the
// planned stent with its marker bands (plannedDelivery) and the stretches with no
// measurable lumen (benchRegions: the aorta, uncleared OCT blood). The image step
// offers intracoronary nitroglycerin (giveNitrate), logged with the preparation.
// PciBench takes an optional `initial` session, so a test can render a step.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BENCH_BY_ID,
  BENCH_LESIONS,
  MEASURE_LESIONS,
  MODALITY_REASONS,
  applyPrep,
  benchIvusContext,
  benchPullbacks,
  benchRegion,
  benchRegions,
  branchLesion,
  deploy,
  giveNitrate,
  initialState,
  maxStentDiameter,
  plannedDelivery,
  preImaging,
  type BenchState,
  type Modality,
  type PostDil,
  type PrepAction,
  type Stent,
  type StentResult,
} from "../../simulation/pciBench";
import { eemMeasurable, ivusFrame } from "../../simulation/pci/ivus";
import { gradeModality, gradePlan } from "../../simulation/bench/measure";
import type { AssessmentMode } from "../../mentor/types";
import { launch as benchLaunch } from "../../content/lab/presets/pci-bench/core.launch";
import { launch as measureLaunch } from "../../content/lab/presets/pci-bench/measure.launch";
import { launch as bifLaunch } from "../../content/lab/presets/pci-bench/bifurcation.launch";
import {
  BIF_PRESETS,
  applyStep,
  bifMetrics,
  bifOutcome,
  bifStartState,
  bifTipContext,
  chooseTechnique,
  escalate,
  geometryOf,
  isBifPreset,
  isFinished,
  newBifState,
  plannedTechniques,
  type BifState,
  type StepInput,
} from "../../simulation/bench/bifurcation";
import { TECHNIQUE_STEPS, resolveStep } from "../../simulation/pci/technique/steps";
import { BIF_TECHNIQUES, type BifTechnique } from "../../content/lab/tips";
import BifurcationPanel from "../bench/BifurcationPanel";
import BifurcationView, { type BifSection } from "../imaging/BifurcationView";
import { LAUNCH_MODES, type LaunchMode, type LaunchParams } from "../../content/schema";
import { useLabLaunch } from "../../state/useLabLaunchStore";
import { registerLabHook } from "../../dev/labHooks";
import { BENCH_STEPS, benchTipContext, type BenchStep } from "../lab/benchTips";
import { runCaseId, useLabRun } from "../lab/labRun";
import { loadedTips, selectTips, useContextTips } from "../lab/useLabTips";
import LabModeBar from "../lab/LabModeBar";
import LabTipsPanel from "../lab/LabTipsPanel";
import IntravascularView from "../imaging/IntravascularView";
import LongitudinalView, { longitudinalSamples } from "../imaging/LongitudinalView";
import ImagePanel, { BenchRow, UnclearedBlood } from "../bench/ImagePanel";
import { useBenchPlanStore, type BenchPlanRecord } from "../bench/PlanForm";
import PrepPanel from "../bench/PrepPanel";
import StentPanel from "../bench/StentPanel";
import OptimisePanel from "../bench/OptimisePanel";
import AssessPanel from "../bench/AssessPanel";
import SectionShell from "../SectionShell";

/**
 * The lesion picker's names: the launch file's scenario titles, which name the vessel and what the angiogram
 * shows without giving the finding away (the lesion's own title is the debrief's and the run log's).
 */
const PICKER_TITLE: Record<string, string> = Object.fromEntries([...(benchLaunch.scenarios ?? []), ...(measureLaunch.scenarios ?? [])].map((sc) => [sc.id, sc.title]));
/** The lesions the picker lists; any other lesion (a launched preset) is shown as one disabled entry. */
const PICKED_IDS: ReadonlySet<string> = new Set([...BENCH_LESIONS, ...MEASURE_LESIONS].map((k) => k.id));
const BIF_TITLE: Record<string, string> = Object.fromEntries((bifLaunch.scenarios ?? []).map((sc) => [sc.id, sc.title.replace(/^Bifurcation bench: /, "")]));

const STEP_LABEL: Record<BenchStep, string> = { image: "1 · Image", prep: "2 · Prepare", stent: "3 · Stent", optimise: "4 · Optimise", assess: "5 · Final imaging" };

/** The steps a launch may open at (a later step needs the earlier steps' choices). */
export const BENCH_START_STEPS: readonly BenchStep[] = ["image", "prep", "stent"];

/**
 * Where the run's pre-PCI plan stands: entered (submitted), pending (a modality is committed and the plan not
 * yet entered) or none (no plan record for this modality: a run launched past the image step).
 */
const reasonLabel = (id: string) => MODALITY_REASONS.find((r) => r.id === id)?.label ?? id;

export type BenchPlanStatus = "entered" | "pending" | "none";

export function planStatus(record: BenchPlanRecord | undefined | null, modality: Modality | null): BenchPlanStatus {
  if (!record || !modality || record.modality !== modality) return "none";
  return record.submitted ? "entered" : "pending";
}

/**
 * Whether the slice read-out (EEM area, lumen area, plaque burden, calcium at the frame) is on the live screen.
 * It is ground truth, so it waits for the debrief (pci-bench-measure-and-plan): in supervised, independent and
 * exam runs it is hidden until the final imaging step; in guided practice it appears once the learner has
 * entered the plan (or, in a run launched past the image step, which has no plan to enter, from the start).
 */
export function sliceReadoutVisible(step: BenchStep, mode: AssessmentMode, plan: BenchPlanStatus): boolean {
  if (step === "assess") return true;
  if (mode !== "guided") return false;
  return plan === "entered" || (plan === "none" && step !== "image");
}

/** Whether leaving the image step waits for the plan: in guided and exam runs a committed plan must be entered first. */
export function planBlocksLeavingImage(mode: AssessmentMode, plan: BenchPlanStatus): boolean {
  return (mode === "guided" || mode === "exam") && plan === "pending";
}

/** One bench run: the lesion, the step, the modality, the preparation, the stent and its post-dilatations. */
export interface BenchSession {
  lesionId: string;
  step: BenchStep;
  modality: Modality | null;
  state: BenchState;
  log: { action: string; events: string[] }[];
  stent: Stent;
  post: PostDil[];
  /** the deployed stent (set on deployment, updated by each post-dilatation) */
  result: StentResult | null;
}

/** A fresh session on a lesion, at a start step (a step past imaging needs a modality: IVUS unless given). */
export function newSession(lesionId: string, step: BenchStep = "image", modality: Modality | null = null): BenchSession {
  const l = BENCH_BY_ID[lesionId] ?? BENCH_LESIONS[0];
  const start = BENCH_START_STEPS.includes(step) ? step : "image";
  return {
    lesionId: l.id,
    step: start,
    modality: start === "image" ? modality : modality ?? "IVUS",
    state: initialState(),
    log: [],
    stent: { diameter: 3.0, lengthMm: 18, proxEdge: Math.max(0, l.startMm - 3), atm: 12 },
    post: [],
    result: null,
  };
}

/**
 * The session a launch asks for: scenario (a BENCH_LESIONS id), start (or step) image | prep | stent,
 * modality IVUS | OCT (either case), mode. Null when the scenario is unknown.
 */
export function launchBench(p: LaunchParams): { session: BenchSession; mode: LaunchMode | null } | null {
  const id = p.scenario ?? BENCH_LESIONS[0].id;
  if (!BENCH_BY_ID[id]) return null;
  const rawStep = (p.start ?? p.step ?? "image").trim();
  const step = (BENCH_START_STEPS as readonly string[]).includes(rawStep) ? (rawStep as BenchStep) : "image";
  const m = (p.modality ?? "").trim().toUpperCase();
  const modality: Modality | null = m === "IVUS" || m === "OCT" ? m : null;
  const mode = (LAUNCH_MODES as readonly string[]).includes(p.mode ?? "") ? (p.mode as LaunchMode) : null;
  return { session: newSession(id, step, modality), mode };
}

/** The bench's two workspaces: the lesion bench and the bifurcation bench. */
export type BenchWorkspace = "lesion" | "bifurcation";

/** One bifurcation bench run: the engine state, the modality, the cross-section on show and the last message. */
export interface BifSession {
  state: BifState;
  modality: Modality;
  section: BifSection;
  message: string | null;
}

export function newBifSession(state: BifState, modality: Modality = "OCT"): BifSession {
  return { state, modality, section: "proximal", message: null };
}

/**
 * The bifurcation session a launch asks for: scenario or preset (a bifurcation preset id), start (a step
 * id, a number, "technique:step" or "plan") or technique with step (a number or an id), modality, mode.
 * A step without a technique is read as the start ({preset:'bif-dk-crush', step:'crush'}, the plan's link
 * shape). Null when it names no bifurcation preset, or an unknown technique or step.
 */
export function launchBifurcation(p: LaunchParams): { session: BifSession; mode: LaunchMode | null } | null {
  const id = (p.scenario ?? p.preset ?? "").trim();
  if (!isBifPreset(id)) return null;
  const tech = (p.technique ?? "").trim();
  if (tech && !(BIF_TECHNIQUES as readonly string[]).includes(tech)) return null;
  let start: string | undefined = p.start?.trim() || undefined;
  // a step without its technique names the start, resolved against the preset's technique
  if (!start && p.step?.trim() && !tech) start = p.step.trim();
  if (!start && p.step?.trim() && tech) {
    const st = resolveStep(tech as BifTechnique, p.step);
    if (!st) return null;
    start = String(st.n);
  }
  const state = bifStartState(id, { technique: tech || null, start: start ?? null });
  if (!state) return null;
  const m = (p.modality ?? "").trim().toUpperCase();
  const modality: Modality = m === "IVUS" ? "IVUS" : "OCT";
  const mode = (LAUNCH_MODES as readonly string[]).includes(p.mode ?? "") ? (p.mode as LaunchMode) : null;
  return { session: newBifSession(state, modality), mode };
}

/**
 * Which bench a launch opens, and the session. A launch that names a bifurcation preset never falls through
 * to the lesion bench: if it cannot open, nothing opens (null). {workspace:'bifurcation'} without a scenario or
 * preset opens the first bifurcation preset at the technique choice.
 */
export function resolveLaunch(
  p: LaunchParams
): { workspace: "bifurcation"; session: BifSession; mode: LaunchMode | null } | { workspace: "lesion"; session: BenchSession; mode: LaunchMode | null } | null {
  const id = (p.scenario ?? p.preset ?? "").trim();
  const wantsBif = p.workspace?.trim() === "bifurcation";
  if (isBifPreset(id) || (wantsBif && !id)) {
    const bb = launchBifurcation(isBifPreset(id) ? p : { ...p, preset: BIF_PRESETS[0].id });
    return bb ? { workspace: "bifurcation", ...bb } : null;
  }
  const b = launchBench(p);
  return b ? { workspace: "lesion", ...b } : null;
}

/** What the dev hook reports of a bifurcation run. */
export function bifHookState(b: BifSession) {
  const s = b.state;
  return {
    preset: s.presetId,
    technique: s.technique,
    step: s.next,
    escalatedFrom: s.escalatedFrom,
    modality: b.modality,
    section: b.section,
    finished: isFinished(s),
    failure: s.failure?.kind ?? null,
    metrics: bifMetrics(s),
    findings: s.findings.map((f) => `${f.severity}:${f.kind}`),
  };
}

/** What the dev hook reports: the session without the engine's internals. */
export function benchHookState(s: BenchSession) {
  return {
    scenario: s.lesionId,
    step: s.step,
    modality: s.modality,
    calciumModification: s.state.mod,
    nitrate: !!s.state.nitrate,
    events: s.state.events.map((e) => e.kind),
    stent: s.stent,
    post: s.post,
    deployed: !!s.result,
    result: s.result ? { score: s.result.score, msa: s.result.msa, expansion: s.result.expansion, events: s.result.events.map((e) => e.kind) } : null,
  };
}

/** Give intracoronary nitroglycerin in a session (once): the state's nitrate, and a line in the log. */
export function withNitrate(s: BenchSession): BenchSession {
  if (s.state.nitrate) return s;
  return { ...s, state: giveNitrate(s.state), log: [...s.log, { action: "Intracoronary nitroglycerin", events: [] }] };
}

export interface PciBenchProps {
  /** the lesion bench's first session and its mode (a launch replaces it); the first lesion at the image step without it */
  initial?: { session: BenchSession; mode?: LaunchMode | null };
}

export default function PciBench({ initial }: PciBenchProps) {
  const [session, setSession] = useState<BenchSession>(() => initial?.session ?? newSession(BENCH_LESIONS[0].id));
  const [workspace, setWorkspace] = useState<BenchWorkspace>("lesion");
  const [bif, setBif] = useState<BifSession>(() => newBifSession(newBifState(BIF_PRESETS[0].id)));
  const bifRef = useRef(bif);
  bifRef.current = bif;
  const workspaceRef = useRef(workspace);
  workspaceRef.current = workspace;
  // one run per workspace: switching tabs keeps both
  const [lesionMode, setLesionMode] = useState<LaunchMode | null>(initial?.mode ?? null);
  const [lesionKey, setLesionKey] = useState(0);
  const [bifMode, setBifMode] = useState<LaunchMode | null>(null);
  const [bifKey, setBifKey] = useState(0);
  const [x, setX] = useState(() => (BENCH_BY_ID[initial?.session.lesionId ?? ""] ?? BENCH_LESIONS[0]).segmentMm / 2);
  /** the pullback on show for a lesion imaged from more than one branch (null: the first) */
  const [branch, setBranch] = useState<string | null>(null);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const { lesionId, step, modality, state: st, stent, post, result } = session;
  const l = BENCH_BY_ID[lesionId];
  const planRecStored = useBenchPlanStore((s) => s.records[lesionId]);
  const planRec = planRecStored && modality && planRecStored.modality === modality ? planRecStored : undefined;
  const plan = planStatus(planRecStored, modality);
  const update = useCallback((f: (s: BenchSession) => BenchSession) => {
    const next = f(sessionRef.current);
    sessionRef.current = next;
    setSession(next);
  }, []);

  const isBif = workspace === "bifurcation";
  const bifPreset = bif.state.presetId;
  const lesionRun = useLabRun("pci-bench", runCaseId("pci-bench", lesionId), lesionMode, { runKey: lesionKey, caseName: `PCI bench: ${l.title}` });
  const bifRun = useLabRun("pci-bench", runCaseId("pci-bench", bifPreset), bifMode, { runKey: bifKey, caseName: `PCI bench: bifurcation, ${BIF_TITLE[bifPreset] ?? bifPreset}` });
  const run = isBif ? bifRun : lesionRun;
  const runRef = useRef(run);
  runRef.current = run;
  const lesionRunRef = useRef(lesionRun);
  lesionRunRef.current = lesionRun;
  const bifRunRef = useRef(bifRun);
  bifRunRef.current = bifRun;

  const load = useCallback((s: BenchSession, mode: LaunchMode | null) => {
    // a new run of the lesion: the previous run's modality choice, pullbacks and plan are dropped
    useBenchPlanStore.getState().reset(s.lesionId);
    sessionRef.current = s;
    setSession(s);
    setBranch(null);
    setX(BENCH_BY_ID[s.lesionId].segmentMm / 2);
    setWorkspace("lesion");
    setLesionMode(mode);
    setLesionKey((k) => k + 1);
  }, []);
  const loadBif = useCallback((b: BifSession, mode: LaunchMode | null) => {
    bifRef.current = b;
    setBif(b);
    setWorkspace("bifurcation");
    setBifMode(mode);
    setBifKey((k) => k + 1);
  }, []);
  /** A launch (resolveLaunch): a bifurcation preset opens the bifurcation bench, anything else the lesion bench. */
  const launchAny = useCallback(
    (p: LaunchParams): boolean => {
      const r = resolveLaunch(p);
      if (r?.workspace === "bifurcation") loadBif(r.session, r.mode);
      else if (r) load(r.session, r.mode);
      return !!r;
    },
    [load, loadBif]
  );
  useLabLaunch("pci-bench", (p) => {
    launchAny(p);
  });
  const reset = (id: string) => (isBifPreset(id) ? loadBif(newBifSession(newBifState(id), bifRef.current.modality), null) : load(newSession(id), null));
  const restart = () => load(newSession(lesionId, "image", null), lesionMode);

  const pre = useMemo(() => (modality ? preImaging(l, modality) : null), [l, modality]);
  const deployed = step === "optimise" || step === "assess" ? result : null;
  // the pullbacks on offer: the first, and (before the stent) each other branch the learner has run
  const pullbacks = benchPullbacks(l);
  const branchOptions = deployed ? [] : pullbacks.filter((p, i) => i === 0 || !!planRec?.runs.includes(p.id));
  const branchId = branch && branchOptions.some((p) => p.id === branch) ? branch : null;
  const g = useMemo(() => branchLesion(l, branchId), [l, branchId]);
  const xc = Math.max(0, Math.min(g.segmentMm, x));
  const imgCtx = useMemo(() => (modality ? benchIvusContext(g, st, deployed, modality) : null), [g, st, deployed, modality]);
  const frame = useMemo(() => (imgCtx ? ivusFrame(imgCtx, xc) : null), [imgCtx, xc]);
  // the aorta proximal to an ostium, and OCT blood the flush did not clear, have no lumen to measure
  const region = modality ? benchRegion(g, xc, modality) : "vessel";
  const lumenSeen = region === "vessel";
  const samples = useMemo(() => (imgCtx ? longitudinalSamples(imgCtx, 0, g.segmentMm) : []), [imgCtx, g]);
  // the stretches of the pullback on show without a measurable lumen: the aorta, uncleared OCT blood
  const regions = useMemo(() => (modality ? benchRegions(g, modality) : []), [g, modality]);
  /** imaging runs for deploy(): the plan record's pre-PCI pullbacks and the final one (deploy's default without a record) */
  const deployOpts = (s: BenchSession) => {
    const r = useBenchPlanStore.getState().records[s.lesionId];
    return r && s.modality && r.modality === s.modality ? { imagingRuns: r.runs.length + 1 } : {};
  };

  const doPrep = (a: PrepAction, label: string) =>
    update((s) => {
      const before = s.state.events.length;
      const ns = applyPrep(l, s.state, a);
      const events = ns.events.slice(before).map((e) => `${e.severity === "major" ? "⚠ " : ""}${e.text}`);
      return { ...s, state: ns, log: [...s.log, { action: label, events }] };
    });
  const doDeploy = () => update((s) => ({ ...s, step: "optimise", post: [], result: deploy(l, s.state, s.stent, [], s.modality ?? "IVUS", deployOpts(s)) }));
  const doPost = (p: PostDil) =>
    update((s) => {
      const nextPost = [...s.post, p];
      return { ...s, post: nextPost, result: deploy(l, s.state, s.stent, nextPost, s.modality ?? "IVUS", deployOpts(s)) };
    });
  const doNitrate = () => update(withNitrate);
  const clearPost = () => update((s) => ({ ...s, post: [], result: deploy(l, s.state, s.stent, [], s.modality ?? "IVUS", deployOpts(s)) }));

  const finish = () => {
    const s = sessionRef.current;
    if (!s.result || !s.modality) return;
    update((z) => ({ ...z, step: "assess" }));
    const r = lesionRunRef.current;
    if (r.finished) return;
    // the pre-PCI plan: the modality against the goal, then each entry against the frames
    const lz = BENCH_BY_ID[s.lesionId];
    const rec = useBenchPlanStore.getState().records[s.lesionId];
    const pr = rec && rec.modality === s.modality ? rec : undefined;
    if (lz.goal) {
      const mg = gradeModality(lz, s.modality, pr?.reasonId ?? null);
      r.decide({
        id: "plan-modality",
        stage: "plan",
        label: "Imaging modality for the goal",
        correct: mg.ok && mg.reasonOk !== false,
        expected: `${mg.expected === "either" ? "IVUS or OCT" : mg.expected}${mg.expectedReason ? `: ${reasonLabel(mg.expectedReason)}` : ""}`,
        given: `${s.modality}${pr?.reasonId ? `: ${reasonLabel(pr.reasonId)}` : ""}`,
        lessonId: "pm-imaging-when-which",
      });
    }
    if (pr?.submitted) {
      for (const it of gradePlan(lz, pr.submitted).items) {
        // the modality (and a stated reason) are already logged above as plan-modality under
        // pm-imaging-when-which; logging the plan's own modality item would replace it (ids are unique)
        if (lz.goal && (it.id === "modality" || (it.id === "reason" && pr.reasonId))) continue;
        r.decide({ id: `plan-${it.id}`, stage: "plan", label: it.label, correct: it.ok, expected: it.expected, given: it.given, lessonId: it.id === "reason" ? "pm-imaging-when-which" : "pm-imaging-planning" });
      }
    } else if (pr) {
      r.decide({ id: "plan-entered", stage: "plan", label: "Pre-PCI plan", correct: false, expected: "entered before preparation", given: "not entered", lessonId: "pm-imaging-planning" });
    }
    s.result.criteria.forEach((c, i) =>
      r.decide({ id: `criterion-${i + 1}`, stage: "imaging", label: c.label, correct: c.ok, expected: "met", given: c.ok ? "met" : "not met", lessonId: "pm-imaging-optimisation" })
    );
    const major = s.result.events.filter((e) => e.severity === "major");
    r.finish({
      score: s.result.score,
      passed: s.result.score >= 80 && major.length === 0,
      criticalErrors: major.length,
      complications: [...new Set(s.result.events.map((e) => e.kind))],
      metrics: { msa: s.result.msa, expansion: s.result.expansion, malappositionMm: s.result.maxMalapposition, proxEdgePb: s.result.proxEdgePB, distEdgePb: s.result.distEdgePB },
    });
  };

  // tips
  const context = useMemo(
    () => (isBif ? bifTipContext(bif.state, bif.modality) : benchTipContext(l, step, st, result, modality)),
    [isBif, bif.state, bif.modality, l, step, st, result, modality]
  );
  const { tips, visible } = useContextTips(context, run);

  // DEV: window.__lab.bench
  useEffect(() => {
    const ctxNow = () => {
      if (workspaceRef.current === "bifurcation") return bifTipContext(bifRef.current.state, bifRef.current.modality);
      const s = sessionRef.current;
      return benchTipContext(BENCH_BY_ID[s.lesionId], s.step, s.state, s.result, s.modality);
    };
    return registerLabHook("bench", {
      context: ctxNow,
      tips: () => selectTips(loadedTips(), ctxNow(), runRef.current.run).map((t) => t.id),
      state: () => benchHookState(sessionRef.current),
      plan: () => useBenchPlanStore.getState().records[sessionRef.current.lesionId] ?? null,
      events: () => ctxNow().events ?? [],
      launch: launchAny,
      workspace: () => workspaceRef.current,
      bifurcation: () => bifHookState(bifRef.current),
    } as Parameters<typeof registerLabHook>[1] & { launch: (p: LaunchParams) => boolean; workspace: () => BenchWorkspace; bifurcation: () => ReturnType<typeof bifHookState>; plan: () => BenchPlanRecord | null });
  }, [launchAny]);

  // --- the bifurcation bench ------------------------------------------------------------------
  const updateBif = useCallback((f: (b: BifSession) => BifSession) => {
    const next = f(bifRef.current);
    bifRef.current = next;
    setBif(next);
  }, []);
  /** Log the run once, when the technique is finished or has failed: each step as a decision, then the result. */
  const logBif = (s: BifState) => {
    const r = bifRunRef.current;
    if (r.finished || !(isFinished(s) || s.failure)) return;
    // the plan's technique choice and any bail-out, the run's main decisions
    const planned = s.escalatedFrom ?? s.technique;
    const planFlag = s.findings.find((f) => f.step === 0 && f.kind === "technique-choice" && f.technique === planned);
    r.decide({
      id: "plan-technique",
      stage: "plan",
      label: "Technique choice",
      correct: !planFlag,
      expected: plannedTechniques(geometryOf(s)).filter((o) => o.verdict === "best").map((o) => TECHNIQUE_STEPS[o.technique].name).join(" or ") || "as the module teaches",
      given: planned ? TECHNIQUE_STEPS[planned].name : "none",
      lessonId: "cp-bifurcation-two-stent-choosing",
    });
    if (s.escalatedFrom) {
      const bailFlags = s.findings.filter((f) => f.step === 0 && f.technique === s.technique && (f.kind === "technique-choice" || f.kind === "sb-stent-unneeded"));
      r.decide({
        id: "bail-out",
        stage: "bail-out",
        label: `Bail-out from ${s.escalatedFrom}`,
        correct: bailFlags.length === 0,
        expected: "a side-branch stent only for a compromised side branch, by the angle in Brilakis's chart",
        given: `${s.technique ? TECHNIQUE_STEPS[s.technique].name : "none"}${bailFlags.length ? `: ${bailFlags.map((f) => f.text).join(" ")}` : ""}`,
        lessonId: "cp-bifurcation-provisional-sb",
      });
    }
    for (const h of s.history) {
      const fs = s.findings.filter((f) => f.technique === h.technique && f.step === h.n);
      const lesson = fs.map((f) => /cp-[a-z0-9-]+/.exec(f.source ?? "")?.[0]).find(Boolean);
      r.decide({
        id: `${h.technique}-${h.n}-${h.id}`,
        stage: h.technique,
        label: `${h.technique} step ${h.n}${h.skipped ? " (left out)" : ""}`,
        correct: h.valid,
        expected: "as the module teaches",
        given: fs.length ? fs.map((f) => f.text).join(" ") : "as the module teaches",
        ...(lesson ? { lessonId: lesson } : {}),
      });
    }
    const o = bifOutcome(s);
    const m = bifMetrics(s);
    r.finish({
      score: o.score,
      passed: o.passed,
      criticalErrors: o.criticalErrors,
      complications: s.findings.some((f) => f.kind === "distal-dissection" || f.kind === "sb-edge-dissection") ? ["dissection"] : [],
      metrics: { sbOstiumMetalPct: m.sbOstiumMetalPct, ovalIndex: m.ovalIndex, neocarinaMm: m.neocarinaMm, doubleLayerMm: m.doubleLayerMm, distalStretchPct: m.distalStretchPct },
      notes: `Technique ${s.technique}${s.escalatedFrom ? ` (bail-out after ${s.escalatedFrom})` : ""}`,
    });
  };
  const bifChoose = (t: BifTechnique) => {
    const r = chooseTechnique(bifRef.current.state, t);
    updateBif((b) => ({ ...b, state: r.state, message: r.message }));
  };
  const bifStep = (id: string, input: StepInput) => {
    const r = applyStep(bifRef.current.state, id, input);
    updateBif((b) => ({ ...b, state: r.state, message: r.message }));
    if (r.ok) logBif(r.state);
  };
  const bifEscalate = (t: BifTechnique) => {
    const r = escalate(bifRef.current.state, t);
    updateBif((b) => ({ ...b, state: r.state, message: r.message }));
  };
  const bifRestart = () => loadBif(newBifSession(newBifState(bifRef.current.state.presetId), bifRef.current.modality), bifMode);

  const guided = run.mode === "guided";
  const canGo = (s: BenchStep) => {
    if (result) return s === "optimise" || s === "assess";
    if (s === "image") return true;
    if (s === "prep" || s === "stent") return !!modality && !(step === "image" && planBlocksLeavingImage(run.mode, plan));
    return false;
  };
  const go = (s: BenchStep) => {
    if (!canGo(s)) return;
    if (s === "assess") finish();
    else update((z) => ({ ...z, step: s }));
  };
  // the planned stent and its marker bands, on the main pullback (the stent is placed in it, not in a branch's)
  const planned = step === "stent" && !branchId ? plannedDelivery(l, stent) : null;
  const maxGap = frame ? frame.struts.reduce((m, s) => Math.max(m, s.gapMm), 0) : 0;
  // OCT does not see the EEM behind lipid or beyond its penetration, IVUS not behind a wide calcium arc's
  // shadow: no EEM area or plaque burden there
  const eemSeen = frame ? lumenSeen && eemMeasurable(frame) : false;
  const showSlice = sliceReadoutVisible(step, run.mode, plan);

  return (
    <SectionShell
      title="PCI bench"
      subtitle="IVUS- and OCT-guided lesion preparation, stent sizing, deployment and optimisation"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <div className="seg" role="tablist" aria-label="Bench">
            <button type="button" role="tab" aria-selected={!isBif} className={`seg-btn ${!isBif ? "seg-btn-active" : ""}`} onClick={() => setWorkspace("lesion")}>
              Lesion
            </button>
            <button type="button" role="tab" aria-selected={isBif} className={`seg-btn ${isBif ? "seg-btn-active" : ""}`} onClick={() => setWorkspace("bifurcation")}>
              Bifurcation
            </button>
          </div>
          {isBif ? (
            <select value={bifPreset} onChange={(e) => reset(e.target.value)} aria-label="Bifurcation" className="bg-base-800 border border-line rounded-md px-2 py-1.5 text-[13px] text-ink">
              {BIF_PRESETS.map((g, i) => (
                <option key={g.id} value={g.id}>
                  {i + 1}. {BIF_TITLE[g.id] ?? g.title}
                </option>
              ))}
            </select>
          ) : (
            <select value={lesionId} onChange={(e) => reset(e.target.value)} aria-label="Lesion" className="bg-base-800 border border-line rounded-md px-2 py-1.5 text-[13px] text-ink">
              {!PICKED_IDS.has(lesionId) && l && (
                // A launched preset (the platform presets) is not in the picker: show it so the header matches the brief.
                <option key={l.id} value={l.id} disabled>
                  {l.title}
                </option>
              )}
              {BENCH_LESIONS.map((k, i) => (
                <option key={k.id} value={k.id}>
                  {i + 1}. {PICKER_TITLE[k.id] ?? k.vessel}
                </option>
              ))}
              <optgroup label="Measure and plan">
                {MEASURE_LESIONS.map((k, i) => (
                  <option key={k.id} value={k.id}>
                    {BENCH_LESIONS.length + i + 1}. {PICKER_TITLE[k.id] ?? k.vessel}
                  </option>
                ))}
              </optgroup>
            </select>
          )}
        </div>
      }
    >
      <LabModeBar mode={run.mode} helpAskedAt={run.helpAskedAt} onAskHelp={() => run.askHelp()} className="mb-4" />
      {isBif ? (
        <>
          <div className="panel p-4 mb-4">
            <div className="stat-label mb-1">{BIF_TITLE[bifPreset] ?? bifPreset}</div>
            <div className="text-[14.5px] text-ink">{BIF_PRESETS.find((g) => g.id === bifPreset)?.brief}</div>
          </div>
          <div className="grid xl:grid-cols-12 gap-4">
            <div className="xl:col-span-7 space-y-4">
              <div className="panel overflow-hidden">
                <div className="panel-head">
                  <span>{bif.modality} of the bifurcation</span>
                  <div className="seg" role="tablist" aria-label="Modality">
                    {(["IVUS", "OCT"] as const).map((mo) => (
                      <button key={mo} type="button" role="tab" aria-selected={bif.modality === mo} className={`seg-btn ${bif.modality === mo ? "seg-btn-active" : ""}`} onClick={() => updateBif((b) => ({ ...b, modality: mo }))}>
                        {mo}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-3">
                  <BifurcationView
                    state={bif.state}
                    modality={bif.modality}
                    section={bif.section}
                    onSection={(sec) => updateBif((b) => ({ ...b, section: sec }))}
                    showReadouts={guided || isFinished(bif.state) || !!bif.state.failure}
                  />
                </div>
              </div>
            </div>
            <div className="xl:col-span-5 space-y-4">
              <BifurcationPanel state={bif.state} guided={guided} onChoose={bifChoose} onStep={bifStep} onEscalate={bifEscalate} onRestart={bifRestart} message={bif.message} />
              <LabTipsPanel tips={tips} visible={visible} mode={run.mode} onAskHelp={() => run.askHelp()} events={context.events} />
            </div>
          </div>
          <p className="text-[12px] text-ink-faint mt-6 max-w-4xl">
            Teaching model. The steps, protrusions, pressures, balloon positions and the Finet relation follow the module text (Brilakis 16.2 and 15.2, the Oxford Handbook chapter 8); the metal left across the
            side-branch ostium after one- and two-step kissing follows the bench micro-CT study the module cites. Tolerances, the coverage of a single jailing layer and the ovalisation after a kiss are model
            parameters, and the strut geometry is simplified. Always use the actual device chart.
          </p>
        </>
      ) : (
        <>
      <div className="panel p-4 mb-4">
        <div className="stat-label mb-1">{l.vessel}</div>
        <div className="text-[14.5px] text-ink">{l.brief}</div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4" role="tablist" aria-label="Steps">
        {BENCH_STEPS.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={step === s}
            disabled={!canGo(s)}
            onClick={() => go(s)}
            className={`rounded-md border px-3 py-1.5 text-[13px] disabled:opacity-40 ${step === s ? "border-accent bg-accent/15 text-ink" : "border-line text-ink-soft hover:text-ink"}`}
          >
            {STEP_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="grid xl:grid-cols-12 gap-4">
        <div className="xl:col-span-7 space-y-4">
          <div className="panel overflow-hidden">
            <div className="panel-head">
              <span>{modality ? `${modality} pullback · ${xc.toFixed(1)} mm from the proximal end` : "Pullback"}</span>
              {modality && branchOptions.length > 1 && (
                <div className="seg" role="tablist" aria-label="Pullback">
                  {branchOptions.map((p, i) => {
                    const on = (branchId ?? pullbacks[0].id) === p.id;
                    return (
                      <button key={p.id} type="button" role="tab" aria-selected={on} className={`seg-btn ${on ? "seg-btn-active" : ""}`} onClick={() => setBranch(i === 0 ? null : p.id)}>
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {frame && modality ? (
              <>
                <div className="grid md:grid-cols-[300px_1fr] gap-3 p-3 items-center">
                  <div className="relative">
                    <IntravascularView frame={frame} />
                    {modality === "OCT" && region !== "vessel" && <UnclearedBlood />}
                  </div>
                  <div className="space-y-1 text-[13px]">
                    {showSlice && (
                      <>
                        <BenchRow k="EEM area" v={eemSeen ? `${frame.areas.eem.toFixed(2)} mm²` : "not measurable"} />
                        <BenchRow k="Lumen area" v={lumenSeen ? `${frame.areas.lumen.toFixed(2)} mm²` : "not measurable"} />
                        <BenchRow k="Plaque burden" v={eemSeen ? `${(frame.areas.plaqueBurden * 100).toFixed(0)}%` : "not measurable"} />
                        {frame.calcium && lumenSeen && (
                          <BenchRow k="Calcium here" v={`${frame.calcium.arcDeg.toFixed(0)}°${frame.calcium.thicknessMm !== null ? `, ${frame.calcium.thicknessMm.toFixed(2)} mm thick` : ", thickness not measurable"}`} />
                        )}
                      </>
                    )}
                    {!showSlice && <p className="text-ink-faint">{run.mode === "guided" ? "The slice read-out appears once the plan is entered." : "The slice read-out is shown in the debrief."}</p>}
                    {region === "aorta" && <p className="text-ink-faint">Catheter in the aorta: no coronary wall to measure.</p>}
                    {region === "uncleared" && <p className="text-ink-faint">Blood not cleared by the flush: the lumen cannot be measured here.</p>}
                    {/* the stent rows only where a coronary wall is measured: in the aorta a protruding strut faces the
                        aortic lumen (deploy() excludes it from malapposition), and uncleared OCT blood hides the wall */}
                    {frame.areas.stent !== null && region === "aorta" && <p className="text-ink-faint">Stent protrudes into the aorta here.</p>}
                    {frame.areas.stent !== null && lumenSeen && <BenchRow k="Stent area" v={`${frame.areas.stent.toFixed(2)} mm²`} />}
                    {frame.areas.stent !== null && lumenSeen && maxGap > 0.05 && <BenchRow k="Strut-to-wall distance" v={`${maxGap.toFixed(2)} mm`} />}
                  </div>
                </div>
                <div className="px-3 pb-3 border-t border-line">
                  <LongitudinalView samples={samples} modality={modality} cursorMm={xc} onCursor={setX} planned={planned} regions={regions} />
                </div>
              </>
            ) : (
              <p className="p-6 text-[13px] text-ink-faint">Choose IVUS or OCT to start the pullback.</p>
            )}
          </div>
        </div>

        <div className="xl:col-span-5 space-y-4">
          {step === "image" && (
            <ImagePanel lesion={l} mode={run.mode} modality={modality} onModality={(m) => update((s) => ({ ...s, modality: m }))} pre={pre} next={() => go("prep")} nitrate={!!st.nitrate} onNitrate={doNitrate} />
          )}
          {step === "prep" && pre && <PrepPanel lesion={l} state={st} onPrep={doPrep} log={session.log} guided={guided} next={() => go("stent")} refD={(pre.distRefLumen + pre.proxRefLumen) / 2} />}
          {step === "stent" && <StentPanel lesion={l} stent={stent} state={st} setStent={(f) => update((s) => ({ ...s, stent: f(s.stent) }))} deploy={doDeploy} />}
          {step === "optimise" && <OptimisePanel post={post} stentLimitMm={maxStentDiameter(stent.diameter, stent.platformId ?? null)} stent={stent} lesion={l} onInflate={doPost} onClear={clearPost} finish={finish} />}
          {step === "assess" && result && modality && <AssessPanel lesion={l} modality={modality} result={result} onMore={() => go("optimise")} onRestart={restart} />}
          <LabTipsPanel tips={tips} visible={visible} mode={run.mode} onAskHelp={() => run.askHelp()} events={context.events} />
        </div>
      </div>
      <p className="text-[12px] text-ink-faint mt-6 max-w-4xl">
        Teaching model. Balloon and stent diameters come from the simulator&apos;s device charts; lesion resistance and preparation effects are model parameters. Optimisation criteria follow the EAPCI 2018
        intracoronary imaging consensus, except that expansion is judged in each half of the stent against its nearest reference (the ILUMIEN approach) rather than as the MSA over the mean reference
        lumen area, which the final assessment also shows. Always use the actual device chart.
      </p>
        </>
      )}
    </SectionShell>
  );
}
