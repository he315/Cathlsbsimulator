import { useEffect, useRef, useState } from "react";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { shapeAt } from "../../simulation/pressure";
import { ecgFromSim, ecgShape } from "../../simulation/ecg";

// ---------------------------------------------------------------------------
// Hemodynamic monitor.
//
// A cath-lab patient monitor: a sweeping ECG (green) over a sweeping arterial
// pressure trace (red), with the live numeric vitals beside them — HR, ABP,
// SpO2, ST deviation and radiation dose. Everything is derived from the sim in
// real time: deep/damped engagement drives ST elevation + tachycardia, an
// unstable catheter makes both traces shiver, a dissection blunts the pressure.
//
// Drawn on a self-scheduled rAF that reads the store via getState() (no React
// churn); the numeric column is refreshed ~4×/s from inside that loop.
// ---------------------------------------------------------------------------

interface Numerics {
  hr: number;
  sys: number;
  dia: number;
  mean: number;
  st: number;
  spo2: number;
  ischaemia: number;
  label: string;
  warning: "none" | "caution" | "danger";
  doseTime: number;
  dap: number;
}

const warnText = (w: string) =>
  w === "danger" ? "text-danger" : w === "caution" ? "text-warn" : "text-good";

export default function VitalsMonitor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [n, setN] = useState<Numerics>({
    hr: 71, sys: 122, dia: 76, mean: 91, st: 0, spo2: 98, ischaemia: 0,
    label: "Sinus rhythm", warning: "none", doseTime: 0, dap: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    let W = 0, H = 0, SAMPLES = 300;
    let ecgArr: number[] = [];
    let artArr: number[] = [];
    let artSys: number[] = [];
    let artDia: number[] = [];
    const resize = () => {
      W = wrap.clientWidth;
      H = wrap.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      SAMPLES = Math.max(160, Math.round(W));
      ecgArr = new Array(SAMPLES).fill(NaN);
      artArr = new Array(SAMPLES).fill(NaN);
      artSys = new Array(SAMPLES).fill(122);
      artDia = new Array(SAMPLES).fill(76);
    };
    resize();

    const SWEEP_SECONDS = 4.6; // time for the write head to cross the screen
    let writePos = 0;
    let heartPhase = 0;
    let dwell = 0; // seconds in an abnormal pressure state (ischaemia builds)
    let last = performance.now();
    let frame = 0;
    let raf = 0;

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const st = useSimulatorStore.getState();
      const { engagement, pressure, caseData } = st;
      const vf = st.arrhythmia === "vf";

      const danger = pressure.warning === "danger";
      dwell = danger ? dwell + dt : Math.max(0, dwell - dt * 0.8);
      const ecg = ecgFromSim(engagement, pressure, caseData, dwell);
      const period = vf ? 0.2 : Math.max(0.3, ecg.period);

      // Advance the shared cardiac phase and the write head.
      const dPhase = dt / period;
      const startPhase = heartPhase;
      heartPhase = (heartPhase + dPhase) % 1;
      const samplesPerSec = SAMPLES / SWEEP_SECONDS;
      const prev = writePos;
      writePos += samplesPerSec * dt;
      const count = Math.floor(writePos) - Math.floor(prev);
      for (let k = 1; k <= count; k++) {
        const idx = (Math.floor(prev) + k) % SAMPLES;
        const ph = (startPhase + dPhase * (k / Math.max(1, count))) % 1;
        if (vf) {
          // Ventricular fibrillation: chaotic ECG, collapsed arterial pressure.
          ecgArr[idx] = (Math.random() - 0.5) * 1.5;
          artArr[idx] = 0.12 + (Math.random() - 0.5) * 0.14;
          artSys[idx] = 40;
          artDia[idx] = 24;
        } else {
          const eNoise = (Math.random() - 0.5) * 0.03;
          ecgArr[idx] = ecgShape(ph, ecg.st) + eNoise;
          const aJit = (Math.random() - 0.5) * (1 - pressure.quality) * 0.25;
          artArr[idx] = shapeAt(pressure.kind, ph) + aJit;
          artSys[idx] = pressure.systolic;
          artDia[idx] = pressure.diastolic;
        }
      }
      const head = Math.floor(writePos) % SAMPLES;

      draw(ctx, W, H, dpr, ecgArr, artArr, artSys, artDia, head);

      // Refresh the numeric column ~4×/s.
      if (frame++ % 15 === 0) {
        const spo2 = Math.round(
          Math.max(85, Math.min(99, 98 - ecg.ischaemia * 9 - (engagement.kind === "in-lv" ? 5 : 0)))
        );
        setN({
          hr: vf ? 0 : ecg.hr,
          sys: vf ? 0 : Math.round(pressure.systolic),
          dia: vf ? 0 : Math.round(pressure.diastolic),
          mean: vf ? 0 : Math.round(pressure.diastolic + (pressure.systolic - pressure.diastolic) / 3),
          st: vf ? 0 : Math.round(ecg.st * 10) / 10,
          spo2: vf ? Math.max(60, spo2 - 20) : spo2,
          ischaemia: vf ? 1 : ecg.ischaemia,
          label: vf ? "VENTRICULAR FIBRILLATION — DEFIBRILLATE" : ecg.label,
          warning: vf ? "danger" : ecg.warning,
          doseTime: st.fluoroTime,
          dap: st.fluoroTime * 18, // ~cGy·cm² estimate
        });
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const mmss = (t: number) =>
    `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
  const stArrow = n.st > 0.3 ? "▲" : n.st < -0.3 ? "▼" : "—";

  return (
    <div className="panel overflow-hidden">
      <div className="panel-head">
        <span className="flex items-center gap-2">
          <span className="led text-ecg animate-ledpulse" />
          Hemodynamics
        </span>
        <span className={`normal-case tracking-normal font-normal ${warnText(n.warning)}`}>
          {n.label}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_9.5rem]">
        <div ref={wrapRef} className="monitor scanlines relative h-40">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
        <div className="border-l border-line divide-y divide-line/70">
          <Readout label="HR" unit="bpm" value={n.hr} color="text-ecg" blip />
          <Readout label="ABP" unit="mmHg" value={`${n.sys}/${n.dia}`} sub={`(${n.mean})`} color="text-art" />
          <Readout label="SpO₂" unit="%" value={n.spo2} color="text-spo2" />
          <div className="px-3 py-1.5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[12px] text-ink-faint">ST</span>
              <span className={`metric text-lg ${warnText(n.warning)}`}>
                {stArrow} {n.st > 0 ? "+" : ""}{n.st.toFixed(1)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[12px] text-ink-faint">Dose</span>
              <span className="metric text-sm text-ink-soft">{mmss(n.doseTime)}</span>
              <span className="text-[12px] text-ink-faint metric">{Math.round(n.dap)} cGy·cm²</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Readout({
  label, unit, value, sub, color, blip,
}: {
  label: string;
  unit: string;
  value: number | string;
  sub?: string;
  color: string;
  blip?: boolean;
}) {
  return (
    <div className="px-3 py-1.5 flex items-baseline justify-between gap-1">
      <div className="flex flex-col">
        <span className="text-[12px] text-ink-faint flex items-center gap-1">
          {blip && <span className={`led ${color} animate-blip`} style={{ width: 5, height: 5 }} />}
          {label}
        </span>
        <span className={`metric text-2xl font-semibold ${color}`}>
          {value}
          <span className="text-[12px] text-ink-faint font-normal ml-1">{unit}</span>
        </span>
      </div>
      {sub && <span className={`metric text-[12px] ${color} opacity-70`}>{sub}</span>}
    </div>
  );
}

// --- canvas drawing --------------------------------------------------------
function draw(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  dpr: number,
  ecgArr: number[],
  artArr: number[],
  artSys: number[],
  artDia: number[],
  head: number
) {
  const N = ecgArr.length;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  // faint grid
  ctx.strokeStyle = "rgba(60,90,140,0.10)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 26) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 22) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  const ecgMid = H * 0.28;
  const ecgAmp = H * 0.2;
  const artTop = H * 0.5;
  const artBot = H - 8;
  const artYFor = (mmHg: number) => artBot - (mmHg / 200) * (artBot - artTop);

  const gap = 5; // blank samples just ahead of the write head (the sweep gap)
  const inGap = (i: number) => {
    const d = (i - head + N) % N;
    return d < gap;
  };
  const xFor = (i: number) => (i / (N - 1)) * W;

  const drawLane = (
    color: string,
    yFor: (i: number) => number
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    let pen = false;
    for (let i = 0; i < N; i++) {
      const y = yFor(i);
      if (inGap(i) || Number.isNaN(y)) { pen = false; continue; }
      const x = xFor(i);
      if (!pen) { ctx.moveTo(x, y); pen = true; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  drawLane("#3ef2a4", (i) => {
    const v = ecgArr[i];
    return Number.isNaN(v) ? NaN : ecgMid - v * ecgAmp;
  });
  drawLane("#ff5d6c", (i) => {
    const v = artArr[i];
    if (Number.isNaN(v)) return NaN;
    const mmHg = artDia[i] + (artSys[i] - artDia[i]) * v;
    return artYFor(mmHg);
  });

  // write-head cursor
  const hx = xFor(head);
  ctx.fillStyle = "rgba(180,220,255,0.10)";
  ctx.fillRect(hx, 0, gap * (W / N) + 2, H);
  ctx.fillStyle = "#eaf2ff";
  const eh = ecgArr[(head - gap + N) % N];
  if (!Number.isNaN(eh)) { ctx.beginPath(); ctx.arc(hx, ecgMid - eh * ecgAmp, 2, 0, Math.PI * 2); ctx.fill(); }
}
