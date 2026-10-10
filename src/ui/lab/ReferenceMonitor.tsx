import { useEffect, useMemo, useRef, useState } from "react";
import { useSeriesStore } from "../../state/useSeriesStore";
import { useCineStore } from "../../state/useCineStore";
import { QCA_DEFAULT_FRENCH, QcaOverlay, QcaPanel, frameMeasurable, useQca, type QcaMeasurement, type QcaReportHost } from "./QcaTool";
import { buildQcaReport, reportQca, viewText, type GrayFrame, type QcaReport, type QcaResult, type QcaViewTruth } from "../../simulation/imaging/qca";
import { buildCoronaryTree, projectedStenosis, type CoronaryTree } from "../../render/xray/coronaryTree";
import type { AnatomyModel } from "../../simulation/anatomy";
import { SEGMENT_NAMES, segmentForeshortening, segmentName, type SegmentGeometry } from "../../mentor/coverage";
import { segmentLabelAt, treeSegmentGeometry } from "../../mentor/treeSegments";
import { labScreens } from "./visibility";
import { angleText, rateText, useSeries } from "./useLab";
import SeriesBrowser from "./SeriesBrowser";
import { SQUARE } from "./useLab";
import { enhanceSeries } from "../../simulation/imaging/stentEnhance";
import { create } from "zustand";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import type { AnatomyCase, CArm } from "../../types";

// ---------------------------------------------------------------------------
// Road map (diag-grafts-svg): 'Freeze as road map' keeps the frame on screen
// (typically the clearest frame of an LAO aortogram) so that the live monitor
// can overlay it while the C-arm is back in the projection it was acquired in,
// to engage a graft that cannot be found against the sternal wires and ribs
// (Oxford ch 4 and 7, tip diag-aortogram-graft-roadmap). The live monitor
// (LiveMonitor.tsx) draws it only within ROADMAP_TOLERANCE_DEG of the stored
// angles and at the field size it was acquired at, for the case it was frozen
// in, never in an exam, and only in the session it was frozen in (a new
// session, even of the same case, starts without one).
// ---------------------------------------------------------------------------

/** How close (degrees, on both axes) the C-arm must be to the stored projection for the road map to show. MODEL PARAMETER (the design's value). */
export const ROADMAP_TOLERANCE_DEG = 2;
/** How close (cm) the live field size must be to the stored one: another field size magnifies the image differently, so the overlay would not register. MODEL PARAMETER (below the smallest step between field sizes). */
export const ROADMAP_FIELD_TOLERANCE_CM = 0.5;

/** A frozen road-map frame. */
export interface Roadmap {
  /** the stored frame (grey, w x h) */
  frame: Uint8Array;
  w: number;
  h: number;
  /** the projection it was acquired in */
  cArm: CArm;
  fieldCm: number;
  /** series number on the reference monitor, and the frame within it (0-based) */
  run: number;
  frameIndex: number;
  /** the case it belongs to (a new case clears it) */
  caseId: string;
}

export const useRoadmap = create<{
  roadmap: Roadmap | null;
  /** the session the road map belongs to (the live monitor binds it) */
  owner: unknown;
  freeze: (r: Roadmap) => void;
  clear: () => void;
  /** a live monitor showing this session: a road map from another session is dropped */
  bind: (owner: unknown) => void;
}>((set) => ({
  roadmap: null,
  owner: null,
  freeze: (r) => set({ roadmap: r }),
  clear: () => set({ roadmap: null }),
  bind: (owner) => set((s) => (s.owner === owner ? s : { owner, roadmap: null })),
}));

/** Whether the live monitor overlays the road map now: its case, the C-arm within the tolerance of its angles, the same field size, not an exam. */
export function roadmapShown(r: Pick<Roadmap, "cArm" | "caseId" | "fieldCm"> | null, live: CArm, caseId: string, exam: boolean, liveFieldCm: number): boolean {
  if (!r || exam || r.caseId !== caseId) return false;
  if (!(Math.abs(liveFieldCm - r.fieldCm) < ROADMAP_FIELD_TOLERANCE_CM)) return false;
  return Math.abs(live.laoRao - r.cArm.laoRao) <= ROADMAP_TOLERANCE_DEG + 1e-9 && Math.abs(live.cranialCaudal - r.cArm.cranialCaudal) <= ROADMAP_TOLERANCE_DEG + 1e-9;
}

// ---------------------------------------------------------------------------
// QCA reports in the diagnostic lab (diag-qca-measurement). 'Report this
// measurement' records the learner's %DS (on the average reference), the run's
// view and the segment the learner names in the page's QCA report log
// (src/simulation/imaging/qca.ts reportQca), which the debrief reads; it does
// not yet fill the study report form. With it go, for the debrief only,
// the foreshortening of that segment in the run's view (coverage's
// segmentForeshortening on the case's coronary tree) and the model's projected
// %DS of the lesion in that segment in that view and in every stored cine run
// of the case (coronaryTree's projectedStenosis, the renderer's own lumen). The
// tree is the one the lab builds (buildCoronaryTree on the store's model and
// case), cached per case. Nothing of the model is shown on the monitor; the
// foreshortening warning is a guided teaching aid (labScreens().teachingAids).
// ---------------------------------------------------------------------------

/** The case's coronary tree and its segment geometry, as the lab builds them. */
export interface QcaScene {
  model: AnatomyModel;
  caseData: Pick<AnatomyCase, "id" | "dominance" | "variants" | "lesions"> & Partial<Pick<AnatomyCase, "grafts">>;
  tree: CoronaryTree;
  geometry: SegmentGeometry;
}

const sceneCache = new WeakMap<object, QcaScene>();

/** The scene of a case (built once per case and model object). */
export function qcaScene(model: AnatomyModel, caseData: QcaScene["caseData"]): QcaScene {
  const hit = sceneCache.get(caseData);
  if (hit && hit.model === model) return hit;
  const tree = buildCoronaryTree(model, caseData);
  const scene: QcaScene = { model, caseData, tree, geometry: treeSegmentGeometry(tree) };
  sceneCache.set(caseData, scene);
  return scene;
}

/** Foreshortening of a named segment in a view (undefined when the tree has no such segment). */
export function qcaSegmentForeshortening(scene: QcaScene, segment: string, cArm: CArm): number | undefined {
  return segmentForeshortening(scene.geometry, segment, cArm);
}

/** The case's lesions that lie in a named segment (indices into caseData.lesions). */
export function lesionsInSegment(scene: QcaScene, segment: string): number[] {
  const out: number[] = [];
  scene.caseData.lesions.forEach((l, k) => {
    const site = scene.tree.lesionSites?.[k];
    const at = segmentLabelAt(scene.tree, l.vessel, site?.position ?? l.position);
    if (at === segment) out.push(k);
  });
  return out;
}

/**
 * The model's side of a report: the lesion in the named segment (the tightest there in the reported
 * view), its projected %DS in that view, and in the view of each stored run. For the debrief only.
 */
export function qcaTruthFor(scene: QcaScene, segment: string, cArm: CArm, runs: readonly { number: number; cArm: CArm }[]): QcaReport["truth"] {
  const ks = lesionsInSegment(scene, segment);
  let lesionIndex: number | null = null;
  let pctDS: number | null = null;
  for (const k of ks) {
    const v = projectedStenosis(scene.tree, scene.model, k, cArm);
    if (v && (pctDS === null || v.pctDS > pctDS)) {
      pctDS = v.pctDS;
      lesionIndex = k;
    }
  }
  if (lesionIndex === null && ks.length) lesionIndex = ks[0];
  const byRun: QcaViewTruth[] =
    lesionIndex === null
      ? []
      : runs.map((r) => {
          const v = projectedStenosis(scene.tree, scene.model, lesionIndex!, r.cArm);
          const f = qcaSegmentForeshortening(scene, segment, r.cArm);
          return { run: r.number, view: viewText(r.cArm), cArm: { laoRao: r.cArm.laoRao, cranialCaudal: r.cArm.cranialCaudal }, pctDS: v ? v.pctDS : null, ...(f !== undefined ? { foreshortening: f } : {}) };
        });
  return { lesionIndex, pctDS, byRun };
}

/** The vessel groups of the segment select, in the study report's order (src/ui/lab/StudyReport.tsx ROW_SEGMENTS). */
const QCA_SEGMENT_GROUPS: readonly { group: string; labels: readonly string[] }[] = [
  { group: "Left main", labels: ["5"] },
  { group: "LAD", labels: ["6", "7", "8", "9", "9a", "10", "10a"] },
  { group: "Circumflex", labels: ["11", "12", "12a", "12b", "13", "14", "14a", "14b", "15"] },
  { group: "RCA", labels: ["1", "2", "3", "4", "16", "16a", "16b", "16c"] },
];

const naturalLabel = (a: string, b: string) => parseInt(a, 10) - parseInt(b, 10) || a.localeCompare(b);

/**
 * The segments the report offers: every SYNTAX label with its name, grouped by vessel and each
 * sub-branch next to its parent. A label in SEGMENT_NAMES that no group lists is still offered,
 * under 'Other', in natural order.
 */
export const QCA_SEGMENTS: readonly { label: string; name: string; group: string }[] = (() => {
  const grouped = QCA_SEGMENT_GROUPS.flatMap((g) => g.labels.filter((l) => l in SEGMENT_NAMES).map((label) => ({ label, name: segmentName(label), group: g.group })));
  const listed = new Set(grouped.map((x) => x.label));
  const rest = Object.keys(SEGMENT_NAMES)
    .filter((l) => !listed.has(l))
    .sort(naturalLabel)
    .map((label) => ({ label, name: segmentName(label), group: "Other" }));
  return [...grouped, ...rest];
})();

/** Build and send a report of a QCA result on a stored run (what 'Report this measurement' does). */
export function sendQcaReport(o: {
  scene: QcaScene;
  result: QcaResult;
  segment: string;
  run: { number: number; cArm: CArm };
  /** the case's stored cine runs at the time of the report */
  runs: readonly { number: number; cArm: CArm }[];
  tWall: number;
  at?: number;
}): QcaReport {
  const rep = buildQcaReport(o.result, {
    caseId: o.scene.caseData.id,
    at: o.at ?? Date.now(),
    tWall: o.tWall,
    run: o.run.number,
    cArm: o.run.cArm,
    segment: o.segment,
    foreshortening: qcaSegmentForeshortening(o.scene, o.segment, o.run.cArm),
    truth: qcaTruthFor(o.scene, o.segment, o.run.cArm, o.runs),
  });
  reportQca(rep);
  return rep;
}

// ---------------------------------------------------------------------------
// The reference monitor: replays stored runs at their acquisition rate (cine
// 15 frames/s by default), loops, steps frame by frame, marks a reference
// frame, and hosts the trainee's QCA on a paused stored frame. An imported clip
// (the user's own file) can be played here instead.
//
// Enhanced stent view (pci-intravascular-imaging): on a stored run, the frames
// are registered on the two balloon markers found on each frame and averaged
// (src/simulation/imaging/stentEnhance.ts), as the X-ray stent-enhancement mode
// does (offered only where the host passes `enhance`; the PCI lab), and the
// result replaces the frame until it is switched off or another run
// is chosen, and the QCA can measure on it. Nothing is drawn on it: the markers
// are found on the image, not taken from the engine.
//
// The trainee's QCA in the PCI lab (pci-assessment-policy-qca): the host gives
// the guide's French size for the calibration, records the result as the
// trainee's measurement (onQcaRecord) and, in guided practice only, a hint.
// A stored frame without an image (the WebGL read-back failed) is not
// measured: the monitor says QCA is unavailable and shows no number. Without
// these props the monitor is unchanged (the diagnostic lab).
// ---------------------------------------------------------------------------

interface Props {
  /** the QCA rule of the session policy */
  qca: "auto" | "after-estimate" | "off";
  /** offer the enhanced stent view (the PCI lab; default off, so the diagnostic lab is unchanged) */
  enhance?: boolean;
  /** the catheter's French size the QCA calibration starts from (the PCI lab's guide); default 6 */
  qcaFrench?: number;
  /** record a QCA result as the trainee's lesion measurement (the PCI lab) */
  onQcaRecord?: (m: QcaMeasurement) => void;
  /** a teaching hint inside the QCA steps (the host passes one in guided practice only) */
  qcaHint?: React.ReactNode;
  /**
   * offer 'Freeze as road map' (diag-grafts-svg). Default: on where the live monitor that draws it is the host's
   * (the diagnostic lab); the PCI lab, which passes `enhance`, has its own live monitor and does not offer it.
   */
  roadmap?: boolean;
  /**
   * offer 'Report this measurement' in the QCA result (diag-qca-measurement). Default: on where the host
   * passes none of the PCI lab's QCA props (no `onQcaRecord` key, even an undefined one, no `qcaFrench`, no
   * `enhance`): the diagnostic lab. See offersQcaReport.
   */
  qcaReport?: boolean;
  /**
   * told whether the QCA tool is open: on each open and close, and false when the monitor unmounts. The host can
   * hold the views phase while QCA is open (diag-qca-measurement tip integration); without it nothing changes.
   */
  onQcaOpenChange?: (open: boolean) => void;
}

/**
 * Below this width of the image area (px) the run header stops wrapping and truncates each line, and
 * its type steps down a size, so it stays two lines high and clear of the dose line (layout only).
 */
export const RUN_HEADER_NARROW_PX = 300;

/** What the monitor says when a stored frame holds no image to measure. */
export const QCA_UNAVAILABLE = "QCA unavailable: this stored frame holds no image (the image could not be read back from the display).";

/**
 * Whether the monitor offers 'Report this measurement' by default: only where the host is the diagnostic lab, which
 * passes none of the PCI lab's QCA props. The test is on the props being passed, not on their values: the PCI lab
 * passes `onQcaRecord={undefined}` once its case is finished, and its monitor must not turn into the diagnostic one.
 */
export function offersQcaReport(props: Props): boolean {
  if (props.qcaReport !== undefined) return props.qcaReport;
  if (props.enhance) return false;
  return !Object.prototype.hasOwnProperty.call(props, "onQcaRecord") && props.qcaFrench === undefined;
}

export default function ReferenceMonitor(props: Props) {
  const { qca, enhance = false, qcaFrench = QCA_DEFAULT_FRENCH, onQcaRecord, qcaHint, roadmap: offerRoadmap = !enhance } = props;
  const offerReport = offersQcaReport(props);
  const exam = useSimulatorStore((s) => s.policy.mode === "exam");
  const teachingAids = useSimulatorStore((s) => labScreens(s.policy).teachingAids);
  const caseId = useSimulatorStore((s) => s.caseData.id);
  const roadmap = useRoadmap((s) => s.roadmap);
  const series = useSeries((s) => s.series);
  const selectedId = useSeries((s) => s.selectedId);
  const frame = useSeries((s) => s.frame);
  const playing = useSeries((s) => s.playing);
  const refFrame = useSeries((s) => s.refFrame);
  const { setFrame, setPlaying, step, markReference } = useSeriesStore.getState();
  const clip = useCineStore((s) => s.video);
  const sel = series.find((s) => s.id === selectedId) ?? null;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qcaOpen, setQcaOpen] = useState(false);
  const qcaOpenChange = useRef(props.onQcaOpenChange);
  qcaOpenChange.current = props.onQcaOpenChange;
  useEffect(() => {
    qcaOpenChange.current?.(qcaOpen);
  }, [qcaOpen]);
  useEffect(() => () => qcaOpenChange.current?.(false), []);
  const qcaApi = useQca(qca === "after-estimate", qcaFrench);
  /** the enhanced stent view of a run: its image and how many frames were registered, or why there is none */
  const [enhanced, setEnhanced] = useState<{ id: string; image: Uint8Array | null; w: number; h: number; used: number; of: number } | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const showEnhanced = !!enhanced && !!sel && enhanced.id === sel.id && !!enhanced.image;

  // playback at the run's acquisition rate
  useEffect(() => {
    if (!sel || !playing || qcaOpen || sel.frames.length < 2) return;
    const id = window.setInterval(() => {
      const st = useSeriesStore.getState();
      st.setFrame(st.frame + 1);
    }, 1000 / sel.fps);
    return () => window.clearInterval(id);
  }, [sel, playing, qcaOpen]);

  // draw the current stored frame
  const imgRef = useRef<ImageData | null>(null);
  useEffect(() => {
    const c = canvasRef.current;
    const g = c?.getContext("2d");
    if (!c || !g) return;
    if (!sel || !sel.frames.length) {
      if (!clip) {
        g.fillStyle = "#000";
        g.fillRect(0, 0, c.width, c.height);
      }
      return;
    }
    if (c.width !== sel.w || c.height !== sel.h) {
      c.width = sel.w;
      c.height = sel.h;
      imgRef.current = null;
    }
    if (!imgRef.current) imgRef.current = g.createImageData(sel.w, sel.h);
    const img = imgRef.current;
    const f = showEnhanced && enhanced!.w === sel.w && enhanced!.h === sel.h ? enhanced!.image! : sel.frames[Math.min(frame, sel.frames.length - 1)];
    const d = img.data;
    for (let i = 0, j = 0; i < f.length; i++, j += 4) {
      d[j] = d[j + 1] = d[j + 2] = f[i];
      d[j + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }, [sel, frame, clip, showEnhanced, enhanced]);

  // an imported clip plays here when no stored run is selected
  useEffect(() => {
    if (sel || !clip) return;
    const c = canvasRef.current;
    const g = c?.getContext("2d");
    if (!c || !g) return;
    c.width = 512;
    c.height = 512;
    let raf = 0;
    const draw = () => {
      if (clip.readyState >= 2 && clip.videoWidth > 0) {
        const s = Math.max(c.width / clip.videoWidth, c.height / clip.videoHeight);
        const w = clip.videoWidth * s;
        const h = clip.videoHeight * s;
        g.fillStyle = "#000";
        g.fillRect(0, 0, c.width, c.height);
        g.filter = "grayscale(1)";
        g.drawImage(clip, (c.width - w) / 2, (c.height - h) / 2, w, h);
        g.filter = "none";
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [sel, clip]);

  // QCA works on the paused stored frame
  const grayFrame: GrayFrame | null = useMemo(
    () => (sel && sel.frames.length ? { w: sel.w, h: sel.h, data: showEnhanced ? enhanced!.image! : sel.frames[Math.min(frame, sel.frames.length - 1)] } : null),
    [sel, frame, showEnhanced, enhanced]
  );
  useEffect(() => {
    setQcaOpen(false);
    setEnhanced(null);
    qcaApi.reset();
    // a new selection closes the tool
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // a frame without an image cannot be measured (no number is shown in its place)
  const measurable = useMemo(() => frameMeasurable(grayFrame), [grayFrame]);
  const openQca = () => {
    if (!sel || !measurable) return;
    setPlaying(false);
    markReference(sel.id, frame);
    qcaApi.reset();
    setQcaOpen(true);
  };

  // keyboard: , and . step frames, / plays or pauses (when the focus is not in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (!useSeriesStore.getState().selectedId) return;
      if (e.code === "Comma") step(-1);
      else if (e.code === "Period") step(1);
      else if (e.code === "Slash") setPlaying(!useSeriesStore.getState().playing);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, setPlaying]);

  // the diagnostic lab's report host: the run's view, the named segment, and (guided only) the foreshortening warning
  const reportHost: QcaReportHost | undefined = useMemo(() => {
    if (!offerReport || !sel || sel.kind !== "cine") return undefined;
    const scene = () => {
      const st = useSimulatorStore.getState();
      return qcaScene(st.model, st.caseData);
    };
    return {
      segments: QCA_SEGMENTS,
      runLabel: `Run ${sel.number}, ${angleText(sel.cArm)}`,
      ...(teachingAids ? { foreshortening: (segment: string) => qcaSegmentForeshortening(scene(), segment, sel.cArm) } : {}),
      onReport: (result: QcaResult, segment: string) => {
        const st = useSimulatorStore.getState();
        const runs = useSeriesStore
          .getState()
          .series.filter((x) => x.caseId === st.caseData.id && x.kind === "cine")
          .map((x) => ({ number: x.number, cArm: x.cArm }));
        sendQcaReport({ scene: scene(), result, segment, run: { number: sel.number, cArm: sel.cArm }, runs, tWall: st.wallTime() });
      },
    };
  }, [offerReport, sel, teachingAids]);

  const n = sel?.frames.length ?? 0;
  const isRef = sel && refFrame[sel.id] === frame;
  // the road map of this case, and whether it is the frame on screen now
  const caseMap = roadmap && roadmap.caseId === caseId ? roadmap : null;
  const thisIsMap = !!caseMap && !!sel && caseMap.run === sel.number && caseMap.frameIndex === Math.min(frame, n - 1);
  const canMap = offerRoadmap && !exam && !!sel && sel.kind === "cine" && n > 0 && !showEnhanced && frameMeasurable(grayFrame);
  const toggleRoadmap = () => {
    if (thisIsMap) return useRoadmap.getState().clear();
    if (!sel || !n) return;
    setPlaying(false);
    const i = Math.min(frame, n - 1);
    useRoadmap.getState().freeze({ frame: sel.frames[i].slice(), w: sel.w, h: sel.h, cArm: { ...sel.cArm }, fieldCm: sel.fieldCm, run: sel.number, frameIndex: i, caseId });
  };

  /**
   * Register the run's frames on the balloon markers and average them. The work (about a second on the main
   * thread) starts only after the 'Enhancing' label has been painted: after the next animation frame and a
   * task, with a timer as the fallback where animation frames are paused (a hidden pane).
   */
  const toggleEnhance = () => {
    if (!sel) return;
    if (enhanced && enhanced.id === sel.id) {
      setEnhanced(null);
      return;
    }
    setPlaying(false);
    setEnhancing(true);
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      window.clearTimeout(fallback);
      const r = enhanceSeries(sel);
      setEnhanced({ id: sel.id, image: r ? (r.image.data as Uint8Array) : null, w: sel.w, h: sel.h, used: r?.used.length ?? 0, of: sel.frames.length });
      setEnhancing(false);
    };
    const fallback = window.setTimeout(run, 120);
    window.requestAnimationFrame(() => window.setTimeout(run, 0));
  };

  return (
    <div className="flex h-full min-h-0 flex-col" aria-label="Reference monitor">
      {/* the image area is a size container: the run header wraps when it is narrow, truncates below
          RUN_HEADER_NARROW_PX, and nothing drawn over the image leaves it (the toolbar and the run
          browser below stay clear) */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-black [container-type:size]" data-reference-image>
        <div className="absolute inset-0 flex items-center justify-center [container-type:size]">
          <div className="relative" style={SQUARE}>
            <canvas ref={canvasRef} width={512} height={512} className="absolute inset-0 h-full w-full" />
            {qcaOpen && grayFrame && <QcaOverlay api={qcaApi} frame={grayFrame} />}
          </div>
        </div>
        <div
          data-run-header
          className="pointer-events-none absolute inset-x-2 top-1.5 flex flex-wrap items-start justify-between gap-x-3 font-mono text-[12px] leading-[16px] text-[#c9ced6] [text-shadow:1px_1px_0_#000] [@container(max-width:299px)]:flex-nowrap [@container(max-width:299px)]:text-[11px] [@container(max-width:299px)]:leading-[14px]"
        >
          <div className="min-w-0 max-w-full [&>div]:truncate">
            {sel ? (
              <>
                <div>
                  {sel.kind === "cine" ? "Run" : "Fluoro store"} {sel.number}
                </div>
                <div className="text-[#9aa1ab]">{angleText(sel.cArm)}</div>
              </>
            ) : clip ? (
              <div>Imported clip</div>
            ) : (
              <div className="text-[#9aa1ab]">Reference</div>
            )}
          </div>
          {sel && (
            <div className="ml-auto min-w-0 max-w-full text-right [&>div]:truncate">
              <div>{n ? `${Math.min(frame, n - 1) + 1} / ${n}` : "released"}</div>
              <div className="text-[#9aa1ab]">
                {rateText(sel.fps)} {sel.kind === "cine" ? "f/s" : "p/s"} · {sel.fieldCm} cm
              </div>
              {isRef && !showEnhanced && <div className="text-[#e3e6ea]">Ref</div>}
              {thisIsMap && <div className="text-[#e3e6ea]">Road map</div>}
              {showEnhanced && <div className="text-[#e3e6ea]">Enhanced · {enhanced!.used} frames</div>}
              {enhanced && enhanced.id === sel.id && !enhanced.image && <div className="text-[#e3e6ea]">No balloon markers found</div>}
            </div>
          )}
        </div>
        {sel && (
          <div
            data-run-dose
            className="pointer-events-none absolute inset-x-2 bottom-1.5 truncate font-mono text-[12px] leading-[16px] text-[#9aa1ab] [text-shadow:1px_1px_0_#000] [@container(max-height:119px)]:hidden [@container(max-width:299px)]:text-[11px] [@container(max-width:299px)]:leading-[14px]"
          >
            {sel.durationS.toFixed(1)} s{sel.contrastMl > 0.05 ? ` · ${sel.contrastMl.toFixed(1)} mL` : ""}
            {sel.kind === "cine" ? ` · ${sel.karMGy.toFixed(1)} mGy` : ""}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1 border-t border-line bg-base-800 px-2 py-1">
        <button className="btn btn-ghost h-7 px-2 text-[12px]" disabled={!n} onClick={() => setFrame(0)} title="First frame">
          First
        </button>
        <button className="btn btn-ghost h-7 px-2 text-[12px]" disabled={!n} onClick={() => step(-1)} title="Previous frame (,)">
          Prev
        </button>
        <button className="btn h-7 px-2 text-[12px]" disabled={n < 2 || qcaOpen} onClick={() => setPlaying(!playing)} title="Play or pause (/)">
          {playing && !qcaOpen ? "Pause" : "Play"}
        </button>
        <button className="btn btn-ghost h-7 px-2 text-[12px]" disabled={!n} onClick={() => step(1)} title="Next frame (.)">
          Next
        </button>
        <button className="btn btn-ghost h-7 px-2 text-[12px]" disabled={!n} onClick={() => sel && markReference(sel.id, frame)} title="Keep this frame as the run's reference frame">
          Set ref
        </button>
        <span className="flex-1" />
        {offerRoadmap && !exam && (
          <button
            className={`btn h-7 px-2 text-[12px] ${thisIsMap ? "!text-accent" : ""}`}
            disabled={!thisIsMap && !canMap}
            onClick={toggleRoadmap}
            aria-pressed={thisIsMap}
            data-roadmap-toggle
            title={thisIsMap ? "Clear the road map from the live monitor" : caseMap ? "Freeze this frame as the road map instead of the stored one" : "Freeze this frame as a road map: the live monitor overlays it while the C-arm is back in this projection"}
          >
            {thisIsMap ? "Clear road map" : "Freeze as road map"}
          </button>
        )}
        {offerRoadmap && !exam && caseMap && !thisIsMap && (
          <button className="btn btn-ghost h-7 px-2 text-[12px]" onClick={() => useRoadmap.getState().clear()} data-roadmap-clear title={`Clear the road map (run ${caseMap.run}) from the live monitor`}>
            Clear road map
          </button>
        )}
        {enhance && (
          <button
            className={`btn h-7 px-2 text-[12px] ${showEnhanced ? "!text-accent" : ""}`}
            disabled={n < 2 || enhancing || qcaOpen}
            onClick={toggleEnhance}
            title="Enhanced stent view: register the run's frames on the balloon markers and average them"
          >
            {enhancing ? "Enhancing" : "Enhance stent"}
          </button>
        )}
        {qca !== "off" && (
          <button
            className={`btn h-7 px-2 text-[12px] ${qcaOpen ? "!text-accent" : ""}`}
            disabled={!n || (!qcaOpen && !measurable)}
            onClick={() => (qcaOpen ? setQcaOpen(false) : openQca())}
            title={n && !measurable ? QCA_UNAVAILABLE : "Measure this frame: calibrate on the catheter, then mark the segment"}
          >
            QCA
          </button>
        )}
      </div>
      {/* the run browser, or the QCA steps while measuring: the image keeps its size */}
      <div className="h-[132px] shrink-0 overflow-y-auto border-t border-line bg-base-800 px-1.5 pt-1.5">
        {qcaOpen && grayFrame ? (
          <div className="px-1.5 pb-1.5">
            <QcaPanel api={qcaApi} frame={grayFrame} onClose={() => setQcaOpen(false)} onRecord={onQcaRecord} hint={qcaHint} report={showEnhanced ? undefined : reportHost} />
          </div>
        ) : (
          <>
            {qca !== "off" && n > 0 && !measurable && (
              <div className="px-1.5 pb-1 text-[12px] text-ink-faint" role="status">
                {QCA_UNAVAILABLE}
              </div>
            )}
            <SeriesBrowser />
          </>
        )}
      </div>
    </div>
  );
}
