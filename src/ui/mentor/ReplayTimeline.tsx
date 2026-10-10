// ---------------------------------------------------------------------------
// Annotated replay timeline: swimlanes for the beam, injections, pressure and
// engagement classes, the C-arm angles, the attending's prompts and the
// errors, with a scrubber and decision points to rewind to. The X-ray frame at
// the scrub position is drawn by the integrator's renderFrame callback (the
// recorded state fed through buildXrayScene and the renderer); this component
// only owns the canvas and the timing.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { TimelineLanes } from "../../mentor/timeline";
import type { DecisionPoint } from "../../mentor/debrief";
import { clock } from "../../mentor/debrief";

export interface ReplayTimelineProps {
  lanes: TimelineLanes;
  decisionPoints: DecisionPoint[];
  /** current scrub position (wall time) */
  current: number;
  onSeek: (tWall: number) => void;
  /** restore the decision point and continue live from there */
  onBranch?: (dp: DecisionPoint) => void;
  /** draw the X-ray frame for a wall time into the canvas */
  renderFrame?: (tWall: number, canvas: HTMLCanvasElement) => void | Promise<void>;
  /** highlight a clip (e.g. the gap being discussed) */
  clip?: { from: number; to: number };
  frameSize?: number;
}

const W = 1000;
const LANE_H = 14;
const LANES = ["Beam", "Injections", "Pressure", "Engagement", "C-arm", "Attending", "Errors"] as const;

const PRESS_FILL: Record<string, string> = {
  aortic: "transparent",
  noisy: "#2E343C",
  damped: "#E9B95A",
  ventricularised: "#E9B95A",
  wedged: "#E5534B",
  dissected: "#E5534B",
  lv: "#E5534B",
};

function engFill(k: string): string {
  if (k.startsWith("selective-")) return "#4CC38A";
  if (k.startsWith("coaxial-") || k.startsWith("near-")) return "#2F6BD8";
  if (k.startsWith("deep-") || k === "in-lv" || k === "dangerous") return "#E5534B";
  if (k === "below-valve") return "#E9B95A";
  return "transparent";
}

export default function ReplayTimeline({ lanes, decisionPoints, current, onSeek, onBranch, renderFrame, clip, frameSize = 384 }: ReplayTimelineProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [frameMs, setFrameMs] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const dur = Math.max(1e-3, lanes.t1 - lanes.t0);
  const x = useCallback((t: number) => ((t - lanes.t0) / dur) * W, [lanes.t0, dur]);
  const H = LANES.length * (LANE_H + 6);

  // draw the frame for the scrub position (latest request wins)
  const pending = useRef(0);
  useEffect(() => {
    if (!renderFrame || !canvasRef.current) return;
    const id = ++pending.current;
    const t0 = performance.now();
    Promise.resolve(renderFrame(current, canvasRef.current)).then(
      () => {
        if (id === pending.current) setFrameMs(Math.round(performance.now() - t0));
      },
      () => undefined
    );
  }, [current, renderFrame]);

  const tFromEvent = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return current;
    const r = svg.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (clientX - r.left) / Math.max(1, r.width)));
    return lanes.t0 + f * dur;
  };

  const onKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 5 : 1;
    if (e.key === "ArrowRight") onSeek(Math.min(lanes.t1, current + step));
    else if (e.key === "ArrowLeft") onSeek(Math.max(lanes.t0, current - step));
    else if (e.key === "Home") onSeek(lanes.t0);
    else if (e.key === "End") onSeek(lanes.t1);
    else return;
    e.preventDefault();
  };

  const y = (i: number) => i * (LANE_H + 6) + 3;
  const cArmPath = (key: "laoRao" | "cranCaud") =>
    lanes.cArm.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${(y(4) + LANE_H / 2 - (p[key] / 90) * (LANE_H / 2)).toFixed(1)}`).join(" ");

  return (
    <section className="panel" aria-label="Replay">
      <div className="panel-head">
        <span>Replay</span>
        <span className="font-mono text-xs font-normal text-ink-soft">
          {clock(current - lanes.t0)} / {clock(dur)}
          {frameMs !== null && <span className="ml-3 text-ink-faint">frame {frameMs} ms</span>}
        </span>
      </div>
      <div className="flex flex-col gap-3 p-3 lg:flex-row">
        {renderFrame && (
          <div className="monitor shrink-0 self-start overflow-hidden rounded-md" style={{ width: frameSize, maxWidth: "100%" }}>
            <canvas ref={canvasRef} width={frameSize} height={frameSize} className="block h-auto w-full" aria-label="X-ray frame at the replay position" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex">
            <div className="w-[88px] shrink-0">
              {LANES.map((l) => (
                <div key={l} className="flex items-center text-xs text-ink-faint" style={{ height: LANE_H + 6 }}>
                  {l}
                </div>
              ))}
            </div>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              className="h-auto min-w-0 flex-1 cursor-pointer select-none outline-none"
              style={{ height: H }}
              role="slider"
              tabIndex={0}
              aria-label="Replay position"
              aria-valuemin={0}
              aria-valuemax={Math.round(dur)}
              aria-valuenow={Math.round(current - lanes.t0)}
              aria-valuetext={clock(current - lanes.t0)}
              onKeyDown={onKey}
              onPointerDown={(e) => {
                (e.target as Element).setPointerCapture?.(e.pointerId);
                setDragging(true);
                onSeek(tFromEvent(e.clientX));
              }}
              onPointerMove={(e) => dragging && onSeek(tFromEvent(e.clientX))}
              onPointerUp={() => setDragging(false)}
            >
              {LANES.map((_, i) => (
                <rect key={i} x={0} y={y(i)} width={W} height={LANE_H} fill="#121417" />
              ))}
              {clip && <rect x={x(clip.from)} y={0} width={Math.max(2, x(clip.to) - x(clip.from))} height={H} fill="#1B2230" />}
              {lanes.beam.map((s, i) => (
                <rect key={`b${i}`} x={x(s.from)} y={y(0) + (s.kind === "cine" ? 0 : 3)} width={Math.max(1.5, x(s.to) - x(s.from))} height={s.kind === "cine" ? LANE_H : LANE_H - 6} fill={s.kind === "cine" ? "#4F8EF7" : "#858D99"} />
              ))}
              {lanes.injections.map((m, i) => (
                <rect key={`i${i}`} x={x(m.t) - 1.5} y={y(1)} width={3} height={LANE_H} fill={m.kind.includes("lv") || m.kind === "deep-reflux" || m.kind === "air" || m.kind === "conus" ? "#E5534B" : m.kind.startsWith("selective") ? "#ECEEF1" : "#A6ADB8"}>
                  <title>{m.label}</title>
                </rect>
              ))}
              {lanes.pressure.map((s, i) => (
                <rect key={`p${i}`} x={x(s.from)} y={y(2)} width={Math.max(0.5, x(s.to) - x(s.from))} height={LANE_H} fill={PRESS_FILL[s.kind] ?? "transparent"}>
                  <title>{s.kind}</title>
                </rect>
              ))}
              {lanes.engagement.map((s, i) => (
                <rect key={`e${i}`} x={x(s.from)} y={y(3)} width={Math.max(0.5, x(s.to) - x(s.from))} height={LANE_H} fill={engFill(s.kind)}>
                  <title>{s.kind}</title>
                </rect>
              ))}
              <line x1={0} x2={W} y1={y(4) + LANE_H / 2} y2={y(4) + LANE_H / 2} stroke="#2E343C" vectorEffect="non-scaling-stroke" />
              <path d={cArmPath("laoRao")} fill="none" stroke="#A6ADB8" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
              <path d={cArmPath("cranCaud")} fill="none" stroke="#4F8EF7" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
              {lanes.mentor.map((m, i) => (
                <rect key={`m${i}`} x={x(m.t) - 2} y={y(5) + (m.level && m.level >= 5 ? 0 : 3)} width={4} height={m.level && m.level >= 5 ? LANE_H : LANE_H - 6} fill={m.level && m.level >= 5 ? "#E5534B" : "#4F8EF7"}>
                  <title>{m.label}</title>
                </rect>
              ))}
              {lanes.errors.map((m, i) => (
                <rect key={`x${i}`} x={x(m.t) - 2} y={y(6)} width={4} height={LANE_H} fill="#E5534B">
                  <title>{m.label}</title>
                </rect>
              ))}
              {decisionPoints.map((d, i) => (
                <line key={`d${i}`} x1={x(d.tWall)} x2={x(d.tWall)} y1={0} y2={H} stroke="#2E343C" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
              ))}
              <line x1={x(current)} x2={x(current)} y1={0} y2={H} stroke="#ECEEF1" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-faint">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 bg-[#4F8EF7]" /> Cine
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 bg-[#858D99]" /> Fluoroscopy
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 bg-[#E9B95A]" /> Damped trace
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 bg-[#4CC38A]" /> Selective
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 bg-[#E5534B]" /> Danger, stop or error
            </span>
            <span>C-arm: grey LAO/RAO, blue cranial/caudal</span>
          </div>
          {decisionPoints.length > 0 && (
            <div className="mt-3">
              <div className="mb-1.5 text-xs text-ink-faint">Decision points</div>
              <ul className="flex flex-wrap gap-1.5">
                {decisionPoints.map((d, i) => (
                  <li key={i} className="flex items-center gap-1">
                    <button type="button" className="chip cursor-pointer hover:text-ink" onClick={() => onSeek(d.tWall)}>
                      <span className="font-mono">{clock(d.tWall - lanes.t0)}</span> {d.label}
                    </button>
                    {onBranch && (
                      <button type="button" className="btn btn-ghost px-2 py-0.5 text-xs" onClick={() => onBranch(d)} aria-label={`Try again from ${clock(d.tWall - lanes.t0)}`}>
                        Try again from here
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
