// A sweeping physiological monitor trace (like a cath-lab recorder). Each
// channel is a function of time in seconds. The sweep wraps with an erase bar.
import { useEffect, useRef } from "react";

export interface TraceChannel {
  fn: (t: number) => number;
  color: string;
  label?: string;
  width?: number;
}

export default function LiveTrace({
  channels,
  min,
  max,
  seconds = 6,
  height = 220,
  gridStep,
  unit = "mmHg",
  paused = false,
  clock,
}: {
  channels: TraceChannel[];
  min: number;
  max: number;
  seconds?: number;
  height?: number;
  gridStep?: number;
  unit?: string;
  paused?: boolean;
  /** optional shared clock (seconds); defaults to wall time */
  clock?: () => number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chRef = useRef(channels);
  chRef.current = channels;
  const rangeRef = useRef({ min, max, gridStep });
  rangeRef.current = { min, max, gridStep };
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const clockRef = useRef(clock);
  clockRef.current = clock;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const t0 = performance.now();
    let lastX = -1;
    const prev: number[] = [];
    let lastRange = "";

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = cv.clientWidth;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastX = -1;
      drawGrid(0, w);
    };

    const drawGrid = (x0: number, x1: number) => {
      const { min: lo, max: hi, gridStep: gs } = rangeRef.current;
      const w = cv.clientWidth;
      ctx.fillStyle = "#04070b";
      ctx.fillRect(x0, 0, x1 - x0, height);
      const step = gs ?? niceStep((hi - lo) / 5);
      ctx.strokeStyle = "rgba(79,142,247,0.10)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
        const y = yOf(v);
        ctx.moveTo(x0, y + 0.5);
        ctx.lineTo(x1, y + 0.5);
      }
      ctx.stroke();
      if (x0 === 0) {
        ctx.fillStyle = "rgba(159,176,195,0.55)";
        ctx.font = "10px ui-monospace, monospace";
        for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) ctx.fillText(String(Math.round(v)), 4, yOf(v) - 2);
        ctx.fillText(unit, w - 40, 12);
      }
    };

    const yOf = (v: number) => {
      const { min: lo, max: hi } = rangeRef.current;
      const pad = 6;
      return pad + (1 - (v - lo) / (hi - lo)) * (height - 2 * pad);
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (pausedRef.current) return;
      const w = cv.clientWidth;
      const rk = `${rangeRef.current.min}:${rangeRef.current.max}`;
      if (rk !== lastRange) {
        lastRange = rk;
        drawGrid(0, w);
        lastX = -1;
      }
      const t = clockRef.current ? clockRef.current() : (performance.now() - t0) / 1000;
      const x = ((t % seconds) / seconds) * w;
      if (lastX < 0 || x < lastX) {
        // wrapped: clear the start of the sweep
        drawGrid(0, Math.min(w, x + 14));
        lastX = 0;
        prev.length = 0;
      }
      drawGrid(x, Math.min(w, x + 14));
      const chans = chRef.current;
      const steps = Math.max(1, Math.ceil(x - lastX));
      chans.forEach((c, i) => {
        ctx.strokeStyle = c.color;
        ctx.lineWidth = c.width ?? 1.8;
        ctx.lineJoin = "round";
        ctx.beginPath();
        for (let s = 0; s <= steps; s++) {
          const xx = lastX + ((x - lastX) * s) / steps;
          const tt = t - ((x - xx) / w) * seconds;
          const y = yOf(c.fn(tt));
          if (s === 0) ctx.moveTo(xx, prev[i] ?? y);
          else ctx.lineTo(xx, y);
          if (s === steps) prev[i] = y;
        }
        ctx.stroke();
      });
      lastX = x;
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [height, seconds, unit]);

  return (
    <div className="relative">
      <canvas ref={ref} className="w-full block rounded-md" style={{ height }} />
      <div className="absolute top-1.5 left-10 flex gap-3">
        {channels
          .filter((c) => c.label)
          .map((c) => (
            <span key={c.label} className="text-[12px] font-mono font-semibold" style={{ color: c.color }}>
              {c.label}
            </span>
          ))}
      </div>
    </div>
  );
}

function niceStep(raw: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / p;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
}
