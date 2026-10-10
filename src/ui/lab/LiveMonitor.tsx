import { useEffect, useRef } from "react";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import FluoroView from "../sim/FluoroView";
import { roadmapShown, useRoadmap, type Roadmap } from "./ReferenceMonitor";
import type { DiagnosticLabSession } from "../sim/labSession";
import { angleText, mmss, rateText, useSessionVersion, useSim } from "./useLab";
import { SQUARE } from "./useLab";

// ---------------------------------------------------------------------------
// The live monitor: the live image only, with the overlays a real lab monitor
// carries: projection angles, field size, acquisition mode and rate, last-image
// hold, the air kerma rate while the beam is on, the cumulative reference air
// kerma and fluoroscopy time. No engagement state, no meters, no coaching.
//
// Road map (diag-grafts-svg): a frame frozen on the reference monitor is laid
// over the live image, at ROADMAP_OPACITY, only while the C-arm is within
// ROADMAP_TOLERANCE_DEG of the projection it was acquired in and at its field
// size (ReferenceMonitor roadmapShown), for the case and session it was frozen
// in, and never in an exam. It is the learner's own stored image, so it shows
// nothing the operator would not see.
//
// A graft case run with the simple model shows one notice over the image
// (graftMechanicsNotice): the grafts need the rod mechanics. It names a lab
// setting and says nothing about the image or the patient.
// ---------------------------------------------------------------------------

/** Opacity of the road-map overlay on the live image (MODEL PARAMETER: a display choice). */
export const ROADMAP_OPACITY = 0.45;

/**
 * The notice a graft case shows while the simple model drives the catheter (diag-grafts-svg): only the rod
 * mechanics' lumens include the grafts (src/physics/coronaryLumens.ts), so the simple model cannot engage or
 * inject one. The mode is resolved when the session starts, so the learner restarts the case after switching.
 * Null when the case has no grafts or the rod mechanics runs. It names a lab setting, not anything on the image.
 */
export function graftMechanicsNotice(graftCount: number, rodActive: boolean, reason: string | null = null): string | null {
  if (graftCount <= 0 || rodActive) return null;
  const why = reason ? ` ${reason}` : "";
  return `The grafts in this case need the rod mechanics; the simple model cannot engage or inject a graft.${why} Choose Rod mechanics under Settings, Catheter mechanics, then restart the case.`;
}

/** The frozen frame drawn over the live image. */
function RoadmapOverlay({ map }: { map: Roadmap }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const g = c?.getContext("2d");
    if (!c || !g) return;
    c.width = map.w;
    c.height = map.h;
    const img = g.createImageData(map.w, map.h);
    for (let i = 0, j = 0; i < map.frame.length; i++, j += 4) {
      img.data[j] = img.data[j + 1] = img.data[j + 2] = map.frame[i];
      img.data[j + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }, [map]);
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" style={{ opacity: ROADMAP_OPACITY, mixBlendMode: "multiply" }} data-roadmap-overlay aria-hidden />;
}

interface Props {
  session: DiagnosticLabSession;
  /** extra content over the bottom of the image (captions) */
  children?: React.ReactNode;
}

export default function LiveMonitor({ session, children }: Props) {
  useSessionVersion(session);
  const cArm = useSim((s) => s.cArm);
  const field = useSim((s) => s.imaging.field);
  const pulseRate = useSim((s) => s.imaging.pulseRate);
  const cineRate = useSim((s) => s.imaging.cineRate);
  const pedal = useSim((s) => s.pedal);
  const fluoroOn = useSim((s) => s.fluoroOn);
  const beam = fluoroOn && (pedal.cine || pedal.fluoro) ? (pedal.cine ? "cine" : "fluoro") : null;
  const dose = session.exposure.dose;
  const live = dose.live;
  const totals = dose.totals;
  const lih = !beam && session.lastImageAt !== null;
  const run = session.run;
  const level = session.exposure.exposure.fluoroLevel ?? "normal";
  const roadmap = useRoadmap((s) => s.roadmap);
  const caseId = useSim((s) => s.caseData.id);
  const exam = useSim((s) => s.policy.mode === "exam");
  // a road map belongs to the session it was frozen in: a new session (a relaunch of the same case too) drops it
  useEffect(() => useRoadmap.getState().bind(session), [session]);
  const showMap = roadmapShown(roadmap, cArm, caseId, exam, field);
  const graftCount = useSim((s) => s.caseData.grafts?.length ?? 0);
  const mechanicsNotice = graftMechanicsNotice(graftCount, !!session.physics?.active, session.physicsMode.reason);

  return (
    <div className="relative h-full w-full bg-black" aria-label="Live monitor">
      <div className="absolute inset-0 flex items-center justify-center [container-type:size]">
        <div className="relative" style={SQUARE}>
          <FluoroView session={session} />
          {showMap && roadmap && <RoadmapOverlay map={roadmap} />}
        </div>
      </div>
      {/* overlays: monitor text, 12 px, no trace colours */}
      <div className="pointer-events-none absolute left-2 top-1.5 font-mono text-[12px] leading-[16px] text-[#c9ced6] [text-shadow:1px_1px_0_#000]" data-testid="live-overlay">
        <div>{angleText(cArm)}</div>
        <div className="text-[#9aa1ab] [text-shadow:1px_1px_0_#000]">Field {field} cm</div>
      </div>
      <div className="pointer-events-none absolute right-2 top-1.5 text-right font-mono text-[12px] leading-[16px] text-[#c9ced6] [text-shadow:1px_1px_0_#000]">
        {beam === "cine" ? (
          <div>
            Cine {rateText(cineRate)} f/s{run ? ` · run ${run.start.number}` : ""}
          </div>
        ) : beam === "fluoro" ? (
          <div>
            Fluoro {rateText(pulseRate)} p/s{level !== "normal" ? ` · ${level}` : ""}
          </div>
        ) : (
          <div className="text-[#9aa1ab] [text-shadow:1px_1px_0_#000]">{fluoroOn ? "Beam off" : "X-ray disabled"}</div>
        )}
        {lih && <div className="text-[#e3e6ea]">LIH</div>}
        {showMap && roadmap && <div className="text-[#e3e6ea]">Road map · run {roadmap.run}</div>}
      </div>
      <div className="pointer-events-none absolute bottom-1.5 left-2 font-mono text-[12px] leading-[16px] text-[#c9ced6] [text-shadow:1px_1px_0_#000]">
        <div>Fluoro {mmss(totals.fluoroTimeS)}</div>
        <div>Ka,r {totals.karMGy.total < 100 ? totals.karMGy.total.toFixed(1) : Math.round(totals.karMGy.total)} mGy</div>
      </div>
      <div className="pointer-events-none absolute bottom-1.5 right-2 text-right font-mono text-[12px] leading-[16px] text-[#c9ced6] [text-shadow:1px_1px_0_#000]">
        {beam && live.beamOn && <div>{live.akrMGyMin.toFixed(1)} mGy/min</div>}
        {live.limit !== "none" && beam && <div className="text-[#e3e6ea]">Dose-rate limit</div>}
      </div>
      {mechanicsNotice && (
        <div className="notice notice-warn absolute left-1/2 top-10 w-[min(92%,30rem)] -translate-x-1/2" role="status" data-testid="graft-mechanics-notice">
          {mechanicsNotice}
        </div>
      )}
      {children}
    </div>
  );
}
