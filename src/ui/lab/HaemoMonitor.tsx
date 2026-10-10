import { useEffect, useRef, useState } from "react";
import type { PatientEngine, Vitals, Alarm } from "../../simulation/patient/engine";
import { SAMPLE_HZ } from "../../simulation/patient/engine";
import { LEADS, type Lead } from "../../simulation/ecg12";

// ---------------------------------------------------------------------------
// Haemodynamic monitor (Clinical Graphite).
//
// A cath-lab physiological monitor driven by the patient engine: two ECG leads
// (II and V5 by default), the transduced arterial pressure with systolic,
// diastolic and mean, the SpO2 plethysmogram, NIBP, respiratory rate and ST
// values, with prioritised alarm messages. Every trace is read from the
// engine's sample ring with the patient-clock time stamps, so the sweep is in
// step with the CardiacClock that also times the X-ray heart motion.
//
// What it does not show: the rhythm diagnosis, the tip-pressure class or any
// other internal state. A real monitor shows waveforms, numbers and alarms;
// the operator interprets them.
//
// Trace colours (ecg, art, spo2 tokens) appear only on the monitor screen.
// No gradients or glows; sentence case; 12 px minimum.
// ---------------------------------------------------------------------------

export interface HaemoMonitorProps {
  engine: PatientEngine;
  /** advance the engine from wall time (standalone use); the lab normally drives it */
  drive?: boolean;
  /** the two ECG leads on screen */
  leads?: [Lead, Lead];
  /** seconds per sweep (default 6) */
  sweepSeconds?: number;
  /** show monitor keys (lead select, NIBP, 12-lead, silence, zero) */
  showControls?: boolean;
  /** called on each QRS (R wave on the shared clock): for the beep */
  onQrs?: (patientTime: number) => void;
  className?: string;
}

/**
 * Canvas colours. They are read once from the Clinical Graphite tokens at mount (hidden swatches
 * with the .monitor, text-ecg, text-art, text-spo2 and text-ink-faint classes, see readTokens), so
 * the traces follow tailwind.config.js. The strings here are only the fallback for an environment
 * without computed styles (server rendering, tests).
 */
type Palette = { bg: string; grid: string; ecg: string; art: string; spo2: string; label: string };
const FALLBACK: Palette = {
  bg: "rgb(10, 12, 14)",
  grid: "rgba(120,130,145,0.10)",
  ecg: "rgb(79, 224, 160)",
  art: "rgb(255, 122, 133)",
  spo2: "rgb(79, 214, 238)",
  label: "rgb(133, 141, 153)",
};

function readTokens(root: HTMLElement | null): Palette {
  const out = { ...FALLBACK };
  if (!root || typeof getComputedStyle !== "function") return out;
  const pick = (key: string, prop: "color" | "backgroundColor") => {
    const el = root.querySelector<HTMLElement>(`[data-swatch="${key}"]`);
    if (!el) return null;
    const v = getComputedStyle(el)[prop];
    return v && v !== "rgba(0, 0, 0, 0)" && v !== "transparent" ? v : null;
  };
  out.bg = pick("bg", "backgroundColor") ?? out.bg;
  out.ecg = pick("ecg", "color") ?? out.ecg;
  out.art = pick("art", "color") ?? out.art;
  out.spo2 = pick("spo2", "color") ?? out.spo2;
  out.label = pick("label", "color") ?? out.label;
  // grid: the faint ink token at 10 % opacity
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(out.label);
  if (m) out.grid = `rgba(${m[1]},${m[2]},${m[3]},0.12)`;
  return out;
}

type LaneKind = "ecgA" | "ecgB" | "art" | "pleth";
const LANES: LaneKind[] = ["ecgA", "ecgB", "art", "pleth"];
const LANE_WEIGHT: Record<LaneKind, number> = { ecgA: 1.1, ecgB: 1, art: 1.35, pleth: 0.8 };

function artScale(sys: number | null | undefined): number {
  if (sys === null || sys === undefined || !Number.isFinite(sys)) return 150;
  return sys > 170 ? 250 : sys > 125 ? 200 : sys > 80 ? 150 : 100;
}

export default function HaemoMonitor({ engine, drive = false, leads = ["II", "V5"], sweepSeconds = 6, showControls = true, onQrs, className = "" }: HaemoMonitorProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const swatchRef = useRef<HTMLDivElement>(null);
  const [vitals, setVitals] = useState<Vitals>(() => engine.vitals());
  const [leadA, setLeadA] = useState<Lead>(leads[0]);
  const [leadB, setLeadB] = useState<Lead>(leads[1]);
  const [show12, setShow12] = useState(false);
  const [beat, setBeat] = useState(false);
  const leadRef = useRef({ a: leadA, b: leadB });
  leadRef.current = { a: leadA, b: leadB };
  const qrsRef = useRef(onQrs);
  qrsRef.current = onQrs;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const C = readTokens(swatchRef.current);
    let W = 0,
      H = 0,
      dpr = 1;
    let lastT = -Infinity;
    let lastX: Record<LaneKind, number> = { ecgA: -1, ecgB: -1, art: -1, pleth: -1 };
    let lastY: Record<LaneKind, number> = { ecgA: 0, ecgB: 0, art: 0, pleth: 0 };
    let scale = artScale(engine.vitals().art?.sys);
    let lastBeat = engine.clockState().beat;
    let raf = 0;
    let wall = performance.now();
    let numericsAt = 0;
    const GUTTER = 34;

    const lanes = () => {
      const tot = LANES.reduce((a, l) => a + LANE_WEIGHT[l], 0);
      let y = 0;
      const out = {} as Record<LaneKind, { y0: number; h: number }>;
      for (const l of LANES) {
        const h = (H * LANE_WEIGHT[l]) / tot;
        out[l] = { y0: y, h };
        y += h;
      }
      return out;
    };

    const drawBackground = (x0: number, x1: number) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(x0, 0, x1 - x0, H);
      const L = lanes();
      // faint scale lines on the pressure lane, labels in the gutter
      const a = L.art;
      ctx.strokeStyle = C.grid;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      for (const v of [0, scale / 2, scale]) {
        const y = Math.round(a.y0 + a.h - 6 - (v / scale) * (a.h - 12)) + 0.5;
        ctx.beginPath();
        ctx.moveTo(Math.max(GUTTER, x0), y);
        ctx.lineTo(x1, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      if (x0 <= GUTTER) {
        ctx.fillStyle = C.bg;
        ctx.fillRect(0, 0, GUTTER, H);
        ctx.font = "12px 'IBM Plex Mono', ui-monospace, monospace";
        ctx.fillStyle = C.ecg;
        ctx.fillText(leadRef.current.a, 4, L.ecgA.y0 + 14);
        ctx.fillText(leadRef.current.b, 4, L.ecgB.y0 + 14);
        ctx.fillStyle = C.art;
        ctx.fillText("ART", 4, a.y0 + 14);
        for (const v of [0, scale]) ctx.fillText(String(v), 4, a.y0 + a.h - 6 - (v / scale) * (a.h - 12) + (v === 0 ? -2 : 12));
        ctx.fillStyle = C.spo2;
        ctx.fillText("Pleth", 4, L.pleth.y0 + 14);
      }
    };

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = wrap.clientWidth;
      H = wrap.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawBackground(0, W);
      lastT = -Infinity;
      lastX = { ecgA: -1, ecgB: -1, art: -1, pleth: -1 };
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // pleth auto-gain from the last 4 s
    const plethRange = () => {
      const tr = engine.trace;
      const n = Math.min(tr.count, SAMPLE_HZ * 4);
      let lo = Infinity,
        hi = -Infinity;
      for (let k = 0; k < n; k++) {
        const v = tr.pleth[tr.idx(k)];
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
      return { lo, hi: Math.max(hi, lo + 4) };
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dtWall = Math.min(0.1, (now - wall) / 1000);
      wall = now;
      if (drive && dtWall > 0) engine.advance(dtWall);
      const tr = engine.trace;
      if (!tr.count || W <= GUTTER + 10) return;
      const cs = engine.clockState();
      if (cs.beat !== lastBeat) {
        lastBeat = cs.beat;
        qrsRef.current?.(cs.t);
        setBeat(true);
        window.setTimeout(() => setBeat(false), 120);
      }
      // collect samples newer than lastT (oldest first)
      const idx: number[] = [];
      for (let k = 0; k < tr.count; k++) {
        const i = tr.idx(k);
        if (tr.t[i] <= lastT) break;
        idx.push(i);
      }
      if (!idx.length) return;
      idx.reverse();
      const L = lanes();
      const width = W - GUTTER;
      const xOf = (t: number) => GUTTER + ((((t % sweepSeconds) + sweepSeconds) % sweepSeconds) / sweepSeconds) * width;
      const li = { a: LEADS.indexOf(leadRef.current.a), b: LEADS.indexOf(leadRef.current.b) };
      const pr = plethRange();
      const yOf = (lane: LaneKind, i: number): number => {
        const g = L[lane];
        if (lane === "ecgA" || lane === "ecgB") {
          const v = tr.ecg[lane === "ecgA" ? li.a : li.b][i];
          return g.y0 + g.h * 0.6 - v * g.h * 0.38; // about 1 mV over 40% of the lane
        }
        if (lane === "art") {
          const v = Math.max(-10, Math.min(scale + 20, tr.art[i]));
          return g.y0 + g.h - 6 - (v / scale) * (g.h - 12);
        }
        const v = (tr.pleth[i] - pr.lo) / (pr.hi - pr.lo);
        return g.y0 + g.h - 6 - v * (g.h - 14);
      };
      // erase ahead of the newest sample
      const xNew = xOf(tr.t[idx[idx.length - 1]]);
      const xOld = lastX.ecgA < 0 ? xOf(tr.t[idx[0]]) : lastX.ecgA;
      const ERASE = 14;
      if (xNew >= xOld) drawBackground(xOld + 1, Math.min(W, xNew + ERASE));
      else {
        drawBackground(xOld + 1, W);
        drawBackground(GUTTER, Math.min(W, xNew + ERASE));
      }
      if (xNew + ERASE > W) drawBackground(GUTTER, GUTTER + (xNew + ERASE - W));
      for (const lane of LANES) {
        ctx.strokeStyle = lane === "art" ? C.art : lane === "pleth" ? C.spo2 : C.ecg;
        ctx.lineWidth = lane === "art" ? 1.6 : 1.4;
        ctx.lineJoin = "round";
        ctx.beginPath();
        let px = lastX[lane];
        let py = lastY[lane];
        let pen = px >= 0;
        if (pen) ctx.moveTo(px, py);
        for (const i of idx) {
          const x = xOf(tr.t[i]);
          const y = yOf(lane, i);
          if (pen && x < px) pen = false; // wrapped
          if (!pen) {
            ctx.moveTo(x, y);
            pen = true;
          } else ctx.lineTo(x, y);
          px = x;
          py = y;
        }
        ctx.stroke();
        lastX[lane] = px;
        lastY[lane] = py;
      }
      lastT = tr.t[idx[idx.length - 1]];
      // numerics at 4 Hz (and the pressure scale)
      if (now - numericsAt > 250) {
        numericsAt = now;
        const v = engine.vitals();
        const s = artScale(v.art?.sys);
        if (s !== scale) {
          scale = s;
          drawBackground(0, W);
          lastX = { ecgA: -1, ecgB: -1, art: -1, pleth: -1 };
        }
        setVitals(v);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [engine, drive, sweepSeconds]);

  const v = vitals;
  const alarm = v.alarms[0];
  const silenced = v.alarmsSilencedUntil > v.t;
  const hrText = v.hr === null ? "---" : String(v.hr);
  const art = v.art;
  const mmss = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

  return (
    <div className={`panel overflow-hidden ${className}`}>
      <div className="panel-head">
        <span>Haemodynamic monitor</span>
        <span className="metric text-[12px] font-normal text-ink-faint">{mmss(v.t)}</span>
      </div>
      <AlarmBar alarm={alarm} count={v.alarms.length} silenced={silenced} />
      <div ref={swatchRef} aria-hidden="true" className="hidden">
        <span data-swatch="bg" className="monitor" />
        <span data-swatch="ecg" className="text-ecg" />
        <span data-swatch="art" className="text-art" />
        <span data-swatch="spo2" className="text-spo2" />
        <span data-swatch="label" className="text-ink-faint" />
      </div>
      <div className="monitor grid grid-cols-[1fr_10.5rem]">
        <div ref={wrapRef} className="relative h-56 min-w-0">
          <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
        </div>
        <div className="flex flex-col border-l border-line">
          <Num label="HR" unit="/min" colour="text-ecg" big={hrText} mark={beat && v.hr !== null} />
          <div className="border-t border-line px-3 py-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] text-art">ART</span>
              <span className="text-[12px] text-ink-faint">mmHg</span>
            </div>
            <div className="metric text-[26px] font-semibold text-art">{art ? `${Math.round(art.sys)}/${Math.round(art.dia)}` : "-?-"}</div>
            <div className="metric text-[13px] text-art">({art ? Math.round(art.mean) : "-?-"})</div>
          </div>
          <Num label="SpO₂" unit="%" colour="text-spo2" big={v.spo2 === null ? "-?-" : String(v.spo2)} />
          <div className="border-t border-line px-3 py-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] text-ink-soft">NIBP</span>
              <span className="text-[12px] text-ink-faint">{v.nibpRunning ? "measuring" : v.nibp ? mmss(v.nibp.at) : ""}</span>
            </div>
            <div className="metric text-[17px] text-ink">{v.nibp ? `${v.nibp.sys}/${v.nibp.dia} (${v.nibp.mean})` : "--/--"}</div>
          </div>
          <div className="mt-auto flex justify-between border-t border-line px-3 py-1.5 text-[12px]">
            <span className="text-ink-soft">
              RR <span className="metric text-ink">{v.respRate}</span>
            </span>
            <span className="metric text-ecg">
              ST {leadA} {fmtSt(v.st[leadA])} · {leadB} {fmtSt(v.st[leadB])}
            </span>
          </div>
        </div>
      </div>
      {showControls && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-2">
          <label className="flex items-center gap-1.5 text-[12px] text-ink-soft">
            Lead
            <select className="field h-8 py-0 text-[13px]" value={leadA} onChange={(e) => setLeadA(e.target.value as Lead)}>
              {LEADS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <select className="field h-8 py-0 text-[13px]" value={leadB} onChange={(e) => setLeadB(e.target.value as Lead)}>
              {LEADS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <button className="btn h-8 py-0 text-[13px]" onClick={() => engine.startNibp()} disabled={v.nibpRunning}>
            NIBP
          </button>
          <button className="btn h-8 py-0 text-[13px]" onClick={() => setShow12((s) => !s)}>
            12-lead
          </button>
          <button className="btn h-8 py-0 text-[13px]" onClick={() => engine.transducer.zero()}>
            Zero ART
          </button>
          {/* the pressure line's remedies (diag-pressure-transducer): the trace shows what each one did */}
          <button className="btn h-8 py-0 text-[13px]" title="Pull the flush valve briefly: the square-wave test" onClick={() => engine.transducer.fastFlush()}>
            Fast flush
          </button>
          <button className="btn h-8 py-0 text-[13px]" title="Flush the line through the waste port until no air is left" onClick={() => engine.transducer.reprime()}>
            Re-prime line
          </button>
          <button className="btn h-8 py-0 text-[13px]" title="Set the transducer at the phlebostatic axis" onClick={() => engine.transducer.level()}>
            Level
          </button>
          <button
            className="btn h-8 py-0 text-[13px]"
            title="Turn the transducer stopcock to the patient and tighten the connections"
            onClick={() => {
              engine.transducer.turnToPatient();
              engine.transducer.reconnect();
            }}
          >
            Check connections
          </button>
          <button className="btn btn-ghost h-8 py-0 text-[13px]" onClick={() => engine.silenceAlarms(120)} disabled={!alarm}>
            {silenced ? "Alarms silenced" : "Silence alarms"}
          </button>
        </div>
      )}
      {show12 && <TwelveLead engine={engine} onClose={() => setShow12(false)} />}
    </div>
  );
}

function fmtSt(mm: number): string {
  const r = Math.round(mm * 10) / 10;
  return `${r > 0 ? "+" : ""}${r.toFixed(1)}`;
}

function Num({ label, unit, colour, big, mark }: { label: string; unit: string; colour: string; big: string; mark?: boolean }) {
  return (
    <div className="border-t border-line px-3 py-1.5 first:border-t-0">
      <div className="flex items-baseline justify-between">
        <span className={`flex items-center gap-1.5 text-[12px] ${colour}`}>
          {label}
          <span className={`led ${colour}`} style={{ width: 6, height: 6, opacity: mark ? 1 : 0 }} />
        </span>
        <span className="text-[12px] text-ink-faint">{unit}</span>
      </div>
      <div className={`metric text-[30px] font-semibold ${colour}`}>{big}</div>
    </div>
  );
}

function AlarmBar({ alarm, count, silenced }: { alarm: Alarm | undefined; count: number; silenced: boolean }) {
  if (!alarm) return <div className="h-8 border-b border-line bg-base-800" />;
  const tone = alarm.level === "high" ? "notice-danger" : alarm.level === "medium" ? "notice-warn" : "notice-info";
  return (
    <div className={`flex h-8 items-center justify-between border-b border-line px-3 text-[13px] ${tone}`} role="alert">
      <span className="font-medium">{alarm.text}</span>
      <span className="text-[12px] opacity-80">
        {count > 1 ? `+${count - 1} more` : ""}
        {silenced ? " · silenced" : ""}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 12-lead snapshot: standard 3 × 4 layout (2.5 s per lead) with a 10 s lead II
// rhythm strip, on paper at 25 mm/s and 10 mm/mV.
// ---------------------------------------------------------------------------

// ECG paper as printed (cream paper, red millimetre grid, black trace): a depiction of the physical
// record, not UI chrome, so it does not use the dark interface tokens.
const PAPER = { bg: "#fbfaf6", minor: "#f3d4d0", major: "#e6a9a2", trace: "#1c1c1c", text: "#3b3b3b" };
const LAYOUT: Lead[][] = [
  ["I", "aVR", "V1", "V4"],
  ["II", "aVL", "V2", "V5"],
  ["III", "aVF", "V3", "V6"],
];

function TwelveLead({ engine, onClose }: { engine: PatientEngine; onClose: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [taken] = useState(() => ({ data: engine.ecg12(10), t: engine.time, v: engine.vitals() }));
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const mm = 4; // px per mm at 1×
    const Wmm = 250,
      Hmm = 4 * 30 + 10;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Wmm * mm * dpr;
    cv.height = Hmm * mm * dpr;
    cv.style.width = `${Wmm * mm}px`;
    cv.style.maxWidth = "100%";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PAPER.bg;
    ctx.fillRect(0, 0, Wmm * mm, Hmm * mm);
    for (let x = 0; x <= Wmm; x++) {
      ctx.strokeStyle = x % 5 === 0 ? PAPER.major : PAPER.minor;
      ctx.lineWidth = x % 5 === 0 ? 0.8 : 0.4;
      ctx.beginPath();
      ctx.moveTo(x * mm + 0.5, 0);
      ctx.lineTo(x * mm + 0.5, Hmm * mm);
      ctx.stroke();
    }
    for (let y = 0; y <= Hmm; y++) {
      ctx.strokeStyle = y % 5 === 0 ? PAPER.major : PAPER.minor;
      ctx.lineWidth = y % 5 === 0 ? 0.8 : 0.4;
      ctx.beginPath();
      ctx.moveTo(0, y * mm + 0.5);
      ctx.lineTo(Wmm * mm, y * mm + 0.5);
      ctx.stroke();
    }
    const { data } = taken;
    const rate = data.rate;
    const n = data.leads.II.length;
    const pxPerS = 25 * mm;
    const pxPerMv = 10 * mm;
    ctx.strokeStyle = PAPER.trace;
    ctx.lineWidth = 1.1;
    ctx.font = "12px 'IBM Plex Sans', system-ui, sans-serif";
    const drawSeg = (lead: Lead, s0: number, s1: number, x0: number, yBase: number) => {
      const a = data.leads[lead];
      ctx.beginPath();
      for (let s = s0; s < Math.min(s1, a.length); s++) {
        const x = x0 + ((s - s0) / rate) * pxPerS;
        const y = yBase - a[s] * pxPerMv;
        if (s === s0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = PAPER.text;
      ctx.fillText(lead, x0 + 4, yBase - 12 * mm);
    };
    const startS = Math.max(0, n - 10 * rate);
    LAYOUT.forEach((row, r) => {
      const yBase = (r * 30 + 18) * mm;
      row.forEach((lead, c) => {
        const s0 = startS + Math.round(c * 2.5 * rate);
        drawSeg(lead, s0, s0 + Math.round(2.5 * rate), c * 62.5 * mm, yBase);
      });
    });
    drawSeg("II", startS, n, 0, (3 * 30 + 20) * mm);
    // 1 mV calibration pulse
    ctx.beginPath();
    const cy = (3 * 30 + 20) * mm;
    ctx.moveTo(Wmm * mm - 9 * mm, cy);
    ctx.lineTo(Wmm * mm - 8 * mm, cy);
    ctx.lineTo(Wmm * mm - 8 * mm, cy - pxPerMv);
    ctx.lineTo(Wmm * mm - 3 * mm, cy - pxPerMv);
    ctx.lineTo(Wmm * mm - 3 * mm, cy);
    ctx.lineTo(Wmm * mm - 2 * mm, cy);
    ctx.stroke();
  }, [taken]);
  const hr = taken.v.hr;
  return (
    <div className="border-t border-line bg-base-800 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-ink">12-lead ECG</span>
        <span className="text-[12px] text-ink-faint">
          25 mm/s · 10 mm/mV · {hr === null ? "rate not countable" : `${hr}/min`} · patient time {Math.floor(taken.t / 60)}:{String(Math.floor(taken.t % 60)).padStart(2, "0")}
        </span>
        <button className="btn btn-ghost h-8 py-0 text-[13px]" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="overflow-x-auto rounded-md">
        <canvas ref={ref} className="block" />
      </div>
    </div>
  );
}
