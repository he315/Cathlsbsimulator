import { useEffect, useRef, type MutableRefObject, type ReactNode } from "react";

// ---------------------------------------------------------------------------
// Sweeping multi-channel monitor (same drawing approach as VitalsMonitor):
// a self-scheduled requestAnimationFrame loop reads a simulation source via a
// ref, writes new samples at the sweep head and redraws the canvas. Nothing
// here touches React state per frame.
//
// The source owns simulated time. `advance(dt)` moves it forward (or, for a
// follower monitor that shares another monitor's source, just reports the
// current time). `sample(t0, t1)` returns one value per channel for the
// display interval [t0, t1), so brief events such as pacing spikes are not
// lost between pixels.
// ---------------------------------------------------------------------------

export interface MonitorChannel {
  label: string;
  color: string;
  min: number;
  max: number;
  /** relative lane height */
  weight?: number;
  /** optional reference lines (in channel units) */
  gridLines?: number[];
}

export interface MonitorSource {
  advance(dt: number): number;
  sample(t0: number, t1: number): number[];
}

export default function SweepMonitor({
  channels,
  sourceRef,
  sweepSeconds = 6,
  className = "h-48",
  onFrame,
  overlay,
}: {
  channels: MonitorChannel[];
  sourceRef: MutableRefObject<MonitorSource | null>;
  sweepSeconds?: number;
  className?: string;
  onFrame?: (simTime: number) => void;
  overlay?: ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const channelsRef = useRef(channels);
  channelsRef.current = channels;
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    let W = 0;
    let H = 0;
    let N = 300;
    let data: number[][] = [];
    const nCh = () => channelsRef.current.length;

    const resize = () => {
      W = Math.max(50, wrap.clientWidth);
      H = Math.max(40, wrap.clientHeight);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      N = Math.max(160, Math.round(W));
      data = Array.from({ length: nCh() }, () => new Array(N).fill(NaN));
    };
    resize();

    let writePos = 0;
    let last = performance.now();
    let simT: number | null = null;
    let raf = 0;

    const render = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const src = sourceRef.current;
      if (data.length !== nCh()) data = Array.from({ length: nCh() }, () => new Array(N).fill(NaN));
      if (src) {
        const tNow = src.advance(dt);
        if (simT === null) simT = tNow;
        const span = tNow - simT;
        if (span > 0) {
          const prev = writePos;
          writePos += (N / sweepSeconds) * span;
          const count = Math.floor(writePos) - Math.floor(prev);
          let t0 = simT;
          for (let k = 1; k <= count; k++) {
            const t1 = simT + span * (k / count);
            const idx = (Math.floor(prev) + k) % N;
            const vals = src.sample(t0, t1);
            for (let c = 0; c < data.length; c++) data[c][idx] = vals[c] ?? NaN;
            t0 = t1;
          }
          simT = tNow;
        } else if (span < 0) {
          // source was reset
          simT = tNow;
          for (const arr of data) arr.fill(NaN);
        }
        onFrameRef.current?.(tNow);
      }
      draw(ctx, W, H, dpr, data, channelsRef.current, Math.floor(writePos) % N);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => resize());
      ro.observe(wrap);
    } else window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", resize);
    };
  }, [sourceRef, sweepSeconds]);

  return (
    <div ref={wrapRef} className={`monitor scanlines relative ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
      {overlay}
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  dpr: number,
  data: number[][],
  channels: MonitorChannel[],
  head: number
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(60,90,140,0.10)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 22) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  const totalW = channels.reduce((a, c) => a + (c.weight ?? 1), 0) || 1;
  const N = data[0]?.length ?? 1;
  const gap = 5;
  const xFor = (i: number) => (i / (N - 1)) * W;
  const inGap = (i: number) => (i - head + N) % N < gap;
  let top = 0;
  channels.forEach((ch, c) => {
    const h = (H * (ch.weight ?? 1)) / totalW;
    const pad = Math.min(8, h * 0.1);
    const y0 = top + pad;
    const y1 = top + h - pad;
    const yFor = (v: number) => y1 - ((v - ch.min) / (ch.max - ch.min)) * (y1 - y0);

    // lane label
    ctx.fillStyle = ch.color;
    ctx.globalAlpha = 0.75;
    ctx.font = "10px ui-monospace, Menlo, monospace";
    ctx.fillText(ch.label, 6, top + 12);
    ctx.globalAlpha = 1;
    if (ch.gridLines) {
      ctx.strokeStyle = "rgba(160,190,230,0.12)";
      ctx.setLineDash([3, 4]);
      for (const g of ch.gridLines) {
        const y = yFor(g);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
        ctx.fillStyle = "rgba(160,190,230,0.35)";
        ctx.fillText(String(g), W - 26, y - 2);
      }
      ctx.setLineDash([]);
    }

    const arr = data[c];
    if (arr) {
      ctx.strokeStyle = ch.color;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowColor = ch.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      let pen = false;
      for (let i = 0; i < N; i++) {
        const v = arr[i];
        if (inGap(i) || Number.isNaN(v)) {
          pen = false;
          continue;
        }
        const y = Math.max(top + 1, Math.min(top + h - 1, yFor(v)));
        const x = xFor(i);
        if (!pen) {
          ctx.moveTo(x, y);
          pen = true;
        } else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    top += h;
  });

  const hx = xFor(head);
  ctx.fillStyle = "rgba(180,220,255,0.10)";
  ctx.fillRect(hx, 0, gap * (W / N) + 2, H);
}
