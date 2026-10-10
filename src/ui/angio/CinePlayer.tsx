// Cine player for real angiogram runs: plays frames at the acquisition rate,
// with frame stepping, speed, zoom/pan and optional expert lesion boxes.
//
// Drill support (all props optional, defaults keep the library behaviour):
// - allowBoxes=false hides the expert-box toggle so a learner cannot reveal the
//   answer before committing;
// - hideFrameInfo hides the keyframe marker (it can hint where lesions are);
// - startFrame / autoPlay=false open the run paused on a chosen frame;
// - onPick reports a click in source-image pixels with the 1-based frame shown;
// - marks draws the learner's clicks; outlineBoxes draws boxes without grades;
// - frameMarks adds buttons that note the frame on screen (counting frames for the TIMI frame
//   count, and Reader mode's origin and landmark frames, angio-expert-label-drills); with them,
//   frame stepping stops at the first and last frames rather than wrapping.
// The run can be a library run or a simulated run rendered in the browser (frames as data URLs).
import { useEffect, useRef, useState } from "react";
import { GRADE_LABEL, type Box, type LibRun } from "./library";

/** What the player needs of a run: its frames (base + frame), rate, and optional expert boxes and keyframes. */
export type CineRun = Pick<LibRun, "id" | "base" | "frames" | "fps"> & Partial<Pick<LibRun, "boxes" | "keyframes">>;

export interface CineMark {
  x: number;
  y: number;
  /** "hit" draws in the good colour, "miss" in the danger colour, otherwise neutral */
  tone?: "hit" | "miss" | "neutral";
  /** 1-based frame the mark belongs to; drawn on every frame when absent */
  frame?: number;
}

/** A button that notes the frame on screen, with the frame it last noted. */
export interface FrameMark {
  id: string;
  label: string;
  /** the 1-based frame noted so far, if any */
  frame?: number | null;
}

export default function CinePlayer({
  run,
  showBoxes = false,
  autoPlay = true,
  height = 520,
  allowBoxes = true,
  hideFrameInfo = false,
  startFrame,
  onPick,
  onFrame,
  marks,
  outlineBoxes,
  frameMarks,
  onFrameMark,
}: {
  run: CineRun;
  showBoxes?: boolean;
  autoPlay?: boolean;
  height?: number;
  allowBoxes?: boolean;
  hideFrameInfo?: boolean;
  /** 1-based frame to open on */
  startFrame?: number;
  onPick?: (x: number, y: number, frame: number) => void;
  onFrame?: (frame: number) => void;
  marks?: CineMark[];
  /** boxes drawn as plain outlines (no grade text), keyed by 1-based frame */
  outlineBoxes?: Record<string, Box[]>;
  /** buttons that note the frame on screen (pause, step, then press) */
  frameMarks?: FrameMark[];
  onFrameMark?: (id: string, frame: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgs = useRef<HTMLImageElement[]>([]);
  const n = run.frames.length;
  // while frames are being counted, stepping stops at the ends instead of wrapping to frame 1
  const counting = !!frameMarks && frameMarks.length > 0;
  const first = Math.max(0, Math.min(n - 1, (startFrame ?? 1) - 1));
  const [loaded, setLoaded] = useState(0);
  const [frame, setFrame] = useState(first);
  const [playing, setPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [boxes, setBoxes] = useState(showBoxes);
  const [invert, setInvert] = useState(false);

  useEffect(() => setBoxes(showBoxes), [showBoxes]);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  useEffect(() => onFrameRef.current?.(frame + 1), [frame]);

  // preload frames
  useEffect(() => {
    let alive = true;
    setLoaded(0);
    setFrame(first);
    imgs.current = run.frames.map((f) => {
      const im = new Image();
      im.decoding = "async";
      im.onload = () => alive && setLoaded((k) => k + 1);
      im.src = run.base + f;
      return im;
    });
    return () => {
      alive = false;
    };
    // `first` is derived from startFrame; a new run or start frame reloads. Keyed on the run's content, not the
    // object: merging expert labels gives a labelled run a new object with the same frames, which must not reload
    // the frames or rewind the player.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.id, run.base, run.frames, startFrame]);

  // playback clock
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      acc += (now - last) / 1000;
      last = now;
      const dt = 1 / (run.fps * speed);
      if (acc >= dt) {
        acc %= dt;
        setFrame((f) => (f + 1) % run.frames.length);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, run.fps, run.frames.length]);

  // draw
  useEffect(() => {
    const cv = canvasRef.current;
    const im = imgs.current[frame];
    if (!cv || !im || !im.complete || !im.naturalWidth) return;
    const g = cv.getContext("2d");
    if (!g) return;
    const S = cv.width;
    g.fillStyle = "#000";
    g.fillRect(0, 0, S, S);
    g.save();
    g.filter = invert ? "invert(1)" : "none";
    const z = zoom;
    const sw = im.naturalWidth / z;
    const sh = im.naturalHeight / z;
    g.drawImage(im, (im.naturalWidth - sw) / 2, (im.naturalHeight - sh) / 2, sw, sh, 0, 0, S, S);
    g.restore();
    const k = (S / im.naturalWidth) * z;
    const ox = ((im.naturalWidth - sw) / 2) * k;
    const oy = ((im.naturalHeight - sh) / 2) * k;
    if (boxes && run.boxes) {
      const bs = run.boxes[String(frame + 1)];
      if (bs) {
        g.lineWidth = 2;
        g.font = "13px ui-monospace, monospace";
        for (const [x, y, w, h, grade] of bs) {
          g.strokeStyle = "#facc15";
          g.strokeRect(x * k - ox, y * k - oy, w * k, h * k);
          g.fillStyle = "#facc15";
          g.fillText(GRADE_LABEL[grade] ?? grade, x * k - ox, Math.max(12, y * k - oy - 4));
        }
      }
    }
    const ob = outlineBoxes?.[String(frame + 1)];
    if (ob) {
      g.lineWidth = 2;
      g.setLineDash([8, 6]);
      g.strokeStyle = "#ECEEF1";
      for (const [x, y, w, h] of ob) g.strokeRect(x * k - ox, y * k - oy, w * k, h * k);
      g.setLineDash([]);
    }
    for (const m of marks ?? []) {
      if (m.frame !== undefined && m.frame !== frame + 1) continue;
      const cx = m.x * k - ox;
      const cy = m.y * k - oy;
      g.strokeStyle = m.tone === "hit" ? "#4CC38A" : m.tone === "miss" ? "#E5534B" : "#ECEEF1";
      g.lineWidth = 3;
      g.beginPath();
      g.arc(cx, cy, 14, 0, Math.PI * 2);
      g.moveTo(cx - 22, cy);
      g.lineTo(cx - 8, cy);
      g.moveTo(cx + 8, cy);
      g.lineTo(cx + 22, cy);
      g.moveTo(cx, cy - 22);
      g.lineTo(cx, cy - 8);
      g.moveTo(cx, cy + 8);
      g.lineTo(cx, cy + 22);
      g.stroke();
    }
  }, [frame, loaded, boxes, zoom, invert, run, marks, outlineBoxes]);

  const pick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onPick) return;
    const im = imgs.current[frame];
    if (!im || !im.naturalWidth) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const u = (e.clientX - rect.left) / rect.width;
    const v = (e.clientY - rect.top) / rect.height;
    const sw = im.naturalWidth / zoom;
    const sh = im.naturalHeight / zoom;
    const x = (im.naturalWidth - sw) / 2 + u * sw;
    const y = (im.naturalHeight - sh) / 2 + v * sh;
    setPlaying(false);
    onPick(x, y, frame + 1);
  };

  const isKey = run.keyframes?.includes(frame + 1);
  return (
    <div className="select-none">
      <div className="relative bg-black rounded-md overflow-hidden" style={{ width: "100%", maxWidth: height, aspectRatio: "1 / 1" }}>
        <canvas
          ref={canvasRef}
          width={1024}
          height={1024}
          onClick={pick}
          className={`w-full h-full block ${onPick ? "cursor-crosshair" : ""}`}
        />
        {loaded < Math.min(n, 3) && <div className="absolute inset-0 grid place-items-center text-ink-faint text-sm">Loading frames…</div>}
        <div className="absolute top-2 left-2 text-[12px] font-mono text-ink/70">
          {frame + 1}/{n} · {run.fps} fps{isKey && !hideFrameInfo ? " · keyframe" : ""}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mt-2" style={{ maxWidth: height }}>
        <button className="btn !px-2 !py-1" onClick={() => setPlaying((p) => !p)}>
          {playing ? "Pause" : "Play"}
        </button>
        <button
          className="btn !px-2 !py-1"
          onClick={() => {
            setPlaying(false);
            setFrame((f) => (counting ? Math.max(0, f - 1) : (f - 1 + n) % n));
          }}
        >
          ◂ frame
        </button>
        <button
          className="btn !px-2 !py-1"
          onClick={() => {
            setPlaying(false);
            setFrame((f) => (counting ? Math.min(n - 1, f + 1) : (f + 1) % n));
          }}
        >
          frame ▸
        </button>
        {startFrame !== undefined && (
          <button
            className="btn !px-2 !py-1"
            onClick={() => {
              setPlaying(false);
              setFrame(first);
            }}
          >
            Back to frame {first + 1}
          </button>
        )}
        <div className="seg">
          {[0.5, 1].map((s) => (
            <button key={s} className={`seg-btn ${speed === s ? "seg-btn-active" : ""}`} onClick={() => setSpeed(s)}>
              {s === 1 ? "real time" : "½ speed"}
            </button>
          ))}
        </div>
        <div className="seg">
          {[1, 1.5, 2].map((z) => (
            <button key={z} className={`seg-btn ${zoom === z ? "seg-btn-active" : ""}`} onClick={() => setZoom(z)}>
              {z}×
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1 text-[12px] text-ink-soft">
          <input type="checkbox" checked={invert} onChange={(e) => setInvert(e.target.checked)} /> invert
        </label>
        {allowBoxes && run.boxes && Object.keys(run.boxes).length > 0 && (
          <label className="flex items-center gap-1 text-[12px] text-ink-soft">
            <input type="checkbox" checked={boxes} onChange={(e) => setBoxes(e.target.checked)} /> expert lesion boxes
          </label>
        )}
      </div>
      {frameMarks && frameMarks.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[12px]" style={{ maxWidth: height }}>
          {frameMarks.map((m) => (
            <button
              key={m.id}
              className="btn !px-2 !py-1"
              onClick={() => {
                setPlaying(false);
                onFrameMark?.(m.id, frame + 1);
              }}
            >
              {m.label}
              <span className="font-mono text-ink-faint ml-1">{m.frame ? `frame ${m.frame}` : "not set"}</span>
            </button>
          ))}
        </div>
      )}
      <input
        type="range"
        min={0}
        max={Math.max(0, n - 1)}
        value={frame}
        onChange={(e) => {
          setPlaying(false);
          setFrame(Number(e.target.value));
        }}
        className="w-full mt-1"
        style={{ maxWidth: height }}
      />
    </div>
  );
}
