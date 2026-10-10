import { useEffect, useRef } from "react";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { shapeAt, HEART_PERIOD } from "../../simulation/pressure";
import { pressureColor } from "./helpers";

export default function PressureWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const pressure = useSimulatorStore((s) => s.pressure);
  // Keep the latest pressure in a ref so the rAF loop reads fresh values
  // without re-subscribing.
  const pRef = useRef(pressure);
  pRef.current = pressure;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = wrap.clientWidth * dpr;
      canvas.height = wrap.clientHeight * dpr;
    };
    resize();
    const ctx = canvas.getContext("2d")!;

    const N = 260; // samples across the trace
    let phase = 0;
    let last = performance.now();
    const history: number[] = new Array(N).fill(0.2);
    let raf = 0;

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const p = pRef.current;
      phase = (phase + dt / HEART_PERIOD) % 1;
      // Push new normalized sample. Lower-quality traces (deep engagement, a
      // loaded/whipping catheter) carry proportionally more high-frequency
      // noise, so an unstable trace visibly shivers while a clean aortic trace
      // is smooth.
      const jitter = (Math.random() - 0.5) * (1 - p.quality) * 0.28;
      const norm = shapeAt(p.kind, phase) + jitter;
      history.push(norm);
      if (history.length > N) history.shift();

      // Slow respiratory sway (~0.25 Hz) modulates the whole column a few mmHg,
      // the way real arterial pressure rises and falls with ventilation.
      const resp = 1 + 0.035 * Math.sin((now / 1000) * Math.PI * 2 * 0.25);

      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#080b10";
      ctx.fillRect(0, 0, w, h);

      // mmHg scale 0..200 mapped to canvas (bottom..top with margin).
      const top = 8, bot = h - 8;
      const yFor = (mmHg: number) => bot - (mmHg / 200) * (bot - top);

      // Gridlines at 0/50/100/150/200.
      ctx.strokeStyle = "#182230";
      ctx.lineWidth = 1;
      ctx.fillStyle = "#3d4d5e";
      ctx.font = "9px ui-monospace, monospace";
      for (let mm = 0; mm <= 200; mm += 50) {
        const y = yFor(mm);
        ctx.beginPath();
        ctx.moveTo(24, y);
        ctx.lineTo(w, y);
        ctx.stroke();
        ctx.fillText(String(mm), 2, y + 3);
      }

      // Trace: map normalized shape to mmHg using this beat's sys/dia.
      const color = pressureColor(p);
      ctx.beginPath();
      for (let i = 0; i < history.length; i++) {
        const mmHg = (p.diastolic + (p.systolic - p.diastolic) * history[i]) * resp;
        const x = 24 + (i / (N - 1)) * (w - 24);
        const y = yFor(mmHg);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.lineJoin = "round";
      ctx.stroke();

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="panel">
      <div className="panel-head">
        <span>Pressure trace</span>
        <span className={`normal-case font-normal ${warnText(pressure.warning)}`}>
          {pressure.systolic}/{pressure.diastolic} mmHg
        </span>
      </div>
      <div ref={wrapRef} className="h-28 w-full">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
      <div className={`px-3 py-1.5 text-[12px] border-t border-line ${warnText(pressure.warning)}`}>
        {pressure.label}
      </div>
    </div>
  );
}

function warnText(w: string): string {
  if (w === "danger") return "text-danger";
  if (w === "caution") return "text-warn";
  return "text-good";
}
