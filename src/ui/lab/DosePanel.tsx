import { useEffect, useRef } from "react";
import type { AdrcSettings, AdrcState, FluoroLevel, PulseRate } from "../../render/xray/adrc";
import {
  DOSE_TRIGGERS,
  triggerFractions,
  type DoseLive,
  type DoseTotals,
  type OperatorSetup,
  type SkinMap,
} from "../../simulation/dose";

// ---------------------------------------------------------------------------
// Lab dose display (Clinical Graphite).
//
// What a cath-lab dose read-out shows (21 CFR 1020.32(k) and (h)): the reference
// air kerma rate and cumulative Ka,r, the kerma-area product and fluoroscopy time
// in minutes and tenths; plus, for teaching, the technique the automatic dose-rate
// control chose, progress toward the follow-up levels, a skin-dose map and the
// operator's relative scatter. Presentational: the lab owns the DoseTracker and
// the ADRC and passes their state in; the optional controls call back.
// ---------------------------------------------------------------------------

export interface DosePanelProps {
  totals: DoseTotals;
  live: DoseLive;
  /** the exposure of the current (or last) frame */
  adrc?: AdrcState | null;
  skinMap?: SkinMap | null;
  /** imaging settings, shown as controls when onSettings is given */
  settings?: AdrcSettings;
  onSettings?: (patch: Partial<AdrcSettings>) => void;
  operator?: OperatorSetup;
  onOperator?: (patch: Partial<OperatorSetup>) => void;
  /** hide the skin map and operator sections */
  compact?: boolean;
  /** the fluoroscopy pulse and cine frame rates the lab offers (default 7.5, 15 and 30; the PCI lab adds 3.75) */
  rates?: readonly PulseRate[];
  /** the cine frame rates offered (default the same as `rates` when that is given, else 7.5, 15 and 30) */
  cineRates?: readonly PulseRate[];
  className?: string;
}

const LEVELS: { id: FluoroLevel; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "normal", label: "Normal" },
  { id: "high", label: "High" },
];
/** The rates offered when the lab gives none. */
export const DEFAULT_DOSE_RATES: readonly PulseRate[] = [7.5, 15, 30];

function fmtKar(mGy: number): string {
  return mGy >= 1000 ? `${(mGy / 1000).toFixed(2)} Gy` : `${mGy.toFixed(mGy < 10 ? 1 : 0)} mGy`;
}

function fmtKap(gycm2: number): string {
  return `${gycm2.toFixed(gycm2 < 10 ? 2 : 1)} Gy·cm²`;
}

/** minutes and tenths of minutes, as the regulation requires */
function fmtFluoro(s: number): string {
  return `${(Math.floor((s / 60) * 10) / 10).toFixed(1)} min`;
}

/** 3.75 and 7.5 keep their decimals */
function rateLabel(r: number): string {
  return String(r);
}

function barTone(f: number): string {
  if (f >= 1) return "bg-danger";
  if (f >= 0.6) return "bg-warn";
  return "bg-accent";
}

function TriggerBar({ label, value, limit, fraction }: { label: string; value: string; limit: string; fraction: number }) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-ink-soft">{label}</span>
        <span className="metric text-ink-soft">
          {value} <span className="text-ink-faint">/ {limit}</span>
        </span>
      </div>
      <div className="bar" role="meter" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <span className={barTone(fraction)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// skin-map colour scale: surface -> accent (1 Gy) -> warn (2 Gy) -> danger (3 Gy and above)
const STOPS: [number, [number, number, number]][] = [
  [0, [0x1b, 0x1f, 0x24]],
  [1000, [0x4f, 0x8e, 0xf7]],
  [2000, [0xe9, 0xb9, 0x5a]],
  [3000, [0xe5, 0x53, 0x4b]],
];

function colourFor(mGy: number): [number, number, number] {
  if (mGy <= 0) return STOPS[0][1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [d0, c0] = STOPS[i];
    const [d1, c1] = STOPS[i + 1];
    if (mGy <= d1) {
      const f = (mGy - d0) / (d1 - d0);
      return [c0[0] + (c1[0] - c0[0]) * f, c0[1] + (c1[1] - c0[1]) * f, c0[2] + (c1[2] - c0[2]) * f];
    }
  }
  return STOPS[STOPS.length - 1][1];
}

function SkinMapView({ map, peak }: { map: SkinMap; peak: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    if (cv.width !== map.cols || cv.height !== map.rows) {
      cv.width = map.cols;
      cv.height = map.rows;
    }
    const img = ctx.createImageData(map.cols, map.rows);
    for (let r = 0; r < map.rows; r++) {
      // head at the top: the last row (most cranial) is drawn first
      const y = map.rows - 1 - r;
      for (let c = 0; c < map.cols; c++) {
        const [R, G, B] = colourFor(map.dose[r * map.cols + c]);
        const o = (y * map.cols + c) * 4;
        img.data[o] = R;
        img.data[o + 1] = G;
        img.data[o + 2] = B;
        img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
  return (
    <div className="flex flex-col gap-1.5">
      <canvas
        ref={ref}
        className="h-[132px] w-full rounded-md border border-line"
        style={{ imageRendering: "pixelated" }}
        role="img"
        aria-label={`Skin dose map, unwrapped around the chest. Peak skin dose ${fmtKar(peak)}.`}
      />
      <div className="grid grid-cols-5 text-center text-xs text-ink-faint">
        <span className="text-left">Front</span>
        <span>Right</span>
        <span>Back</span>
        <span>Left</span>
        <span className="text-right">Front</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-ink-faint">
        {[
          ["0", 0],
          ["1 Gy", 1000],
          ["2 Gy", 2000],
          ["3 Gy", 3000],
        ].map(([label, d]) => {
          const [R, G, B] = colourFor(d as number);
          return (
            <span key={label as string} className="inline-flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-sm border border-line" style={{ background: `rgb(${R},${G},${B})` }} />
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function DosePanel({ totals, live, adrc, skinMap, settings, onSettings, operator, onOperator, compact, className, rates = DEFAULT_DOSE_RATES, cineRates = rates }: DosePanelProps) {
  const fr = triggerFractions(totals);
  const tech = adrc?.technique;
  const mode = live.mode ?? settings?.mode ?? null;
  const pps = adrc?.pps ?? (settings ? (settings.mode === "cine" ? settings.cinePps : settings.fluoroPps) : null);
  const beamChip = live.beamOn
    ? `${mode === "cine" ? "Cine" : "Fluoro"} ${pps != null ? rateLabel(pps) : ""} ${mode === "cine" ? "f/s" : "p/s"}`
    : "Beam off";
  const limited = live.beamOn && (live.limit === "akr" || live.limit === "akr-high");
  const tubeLimited = live.beamOn && live.limit === "tube";

  return (
    <section className={`panel flex flex-col ${className ?? ""}`} aria-label="Radiation dose">
      <header className="panel-head">
        <span>Dose</span>
        <span className="chip">
          <span className={`led ${live.beamOn ? (mode === "cine" ? "text-warn" : "text-accent") : "text-ink-faint"}`} />
          {beamChip}
        </span>
      </header>

      <div className="flex flex-col gap-4 p-4">
        {/* the regulated read-out */}
        <div className="grid grid-cols-3 gap-3">
          <div className="stat">
            <span className="stat-label">Air kerma (Ka,r)</span>
            <span className="metric text-lg text-ink">{fmtKar(totals.karMGy.total)}</span>
            <span className="metric text-xs text-ink-faint">
              F {fmtKar(totals.karMGy.fluoro)} · C {fmtKar(totals.karMGy.cine)}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Kerma-area product</span>
            <span className="metric text-lg text-ink">{fmtKap(totals.kapGyCm2.total)}</span>
            <span className="metric text-xs text-ink-faint">
              F {totals.kapGyCm2.fluoro.toFixed(1)} · C {totals.kapGyCm2.cine.toFixed(1)}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Fluoro time</span>
            <span className="metric text-lg text-ink">{fmtFluoro(totals.fluoroTimeS)}</span>
            <span className="metric text-xs text-ink-faint">
              {Math.round(totals.cineFrames)} cine frames · {totals.cineRuns} run{totals.cineRuns === 1 ? "" : "s"} · {totals.cineTimeS.toFixed(0)} s
            </span>
          </div>
        </div>

        {/* live exposure */}
        <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-base-800 px-3 py-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-ink-soft">Air kerma rate</span>
            <span className="metric text-ink">
              {live.beamOn ? live.akrMGyMin.toFixed(1) : "0.0"} <span className="text-xs text-ink-faint">mGy/min</span>
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-ink-soft">Technique</span>
            <span className="metric text-xs text-ink-soft">
              {tech
                ? `${tech.kvp.toFixed(0)} kV · ${tech.mA.toFixed(0)} mA · ${tech.pulseMs.toFixed(1)} ms · ${tech.cuMm.toFixed(1)} mm Cu`
                : "Off"}
            </span>
          </div>
          {adrc && (
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-ink-soft">Detector dose</span>
              <span className="metric text-xs text-ink-soft">
                {adrc.detectorNGy.toFixed(0)} / {adrc.targetNGy.toFixed(0)} nGy per pulse
              </span>
            </div>
          )}
        </div>

        {limited && (
          <div className="notice notice-warn" role="status">
            Air kerma rate limit reached ({live.limit === "akr-high" ? "176" : "88"} mGy/min). The detector gets less dose, so the image is
            noisier. Reduce angulation, collimate or move the detector closer.
          </div>
        )}
        {tubeLimited && (
          <div className="notice notice-warn" role="status">
            Tube at full output. The detector gets less dose, so the image is noisier.
          </div>
        )}

        {/* follow-up levels */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-medium text-ink-soft">Follow-up levels</span>
          <TriggerBar label="Air kerma" value={fmtKar(totals.karMGy.total)} limit={fmtKar(DOSE_TRIGGERS.karMGy)} fraction={fr.kar} />
          <TriggerBar label="Kerma-area product" value={totals.kapGyCm2.total.toFixed(0)} limit={`${DOSE_TRIGGERS.kapGyCm2} Gy·cm²`} fraction={fr.kap} />
          <TriggerBar label="Peak skin dose" value={fmtKar(totals.peakSkinMGy)} limit={fmtKar(DOSE_TRIGGERS.peakSkinMGy)} fraction={fr.peakSkin} />
          <TriggerBar label="Fluoro time" value={fmtFluoro(totals.fluoroTimeS)} limit={`${DOSE_TRIGGERS.fluoroMin} min`} fraction={fr.fluoroTime} />
        </div>

        {!compact && skinMap && (
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-ink-soft">Skin dose map</span>
              <span className="metric text-xs text-ink-soft">peak {fmtKar(totals.peakSkinMGy)}</span>
            </div>
            <SkinMapView map={skinMap} peak={totals.peakSkinMGy} />
          </div>
        )}

        {!compact && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-ink-soft">Operator scatter</span>
              <span className="metric text-xs text-ink-soft">
                {live.beamOn ? `${live.operatorRateRel.toFixed(1)}× reference` : "Off"}
              </span>
            </div>
            <div className="flex items-baseline justify-between text-xs text-ink-faint">
              <span>Eyes {totals.operatorEye.total.toFixed(1)}</span>
              <span>Legs {totals.operatorLegs.total.toFixed(1)}</span>
              <span>Under apron {totals.operatorBody.total.toFixed(2)}</span>
            </div>
            <span className="text-xs text-ink-faint">Relative units: 1 = unshielded eye dose per Gy·cm² in a PA view.</span>
            {operator && onOperator && (
              <div className="flex flex-wrap gap-2 pt-1">
                <label className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                  <input type="checkbox" checked={operator.ceilingShield} onChange={(e) => onOperator({ ceilingShield: e.target.checked })} />
                  Ceiling shield
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                  <input type="checkbox" checked={operator.tableSkirt} onChange={(e) => onOperator({ tableSkirt: e.target.checked })} />
                  Table skirt
                </label>
              </div>
            )}
          </div>
        )}

        {settings && onSettings && (
          <div className="flex flex-col gap-2 border-t border-line pt-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-ink-soft">Fluoro dose level</span>
              <div className="seg" role="radiogroup" aria-label="Fluoro dose level">
                {LEVELS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    role="radio"
                    aria-checked={settings.fluoroLevel === l.id}
                    className={`seg-btn ${settings.fluoroLevel === l.id ? "seg-btn-active" : ""}`}
                    onClick={() => onSettings({ fluoroLevel: l.id })}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-ink-soft">Fluoro pulse rate</span>
              <div className="seg" role="radiogroup" aria-label="Fluoro pulse rate">
                {rates.map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={settings.fluoroPps === r}
                    className={`seg-btn ${settings.fluoroPps === r ? "seg-btn-active" : ""}`}
                    onClick={() => onSettings({ fluoroPps: r })}
                  >
                    {rateLabel(r)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-ink-soft">Cine frame rate</span>
              <div className="seg" role="radiogroup" aria-label="Cine frame rate">
                {cineRates.map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={settings.cinePps === r}
                    className={`seg-btn ${settings.cinePps === r ? "seg-btn-active" : ""}`}
                    onClick={() => onSettings({ cinePps: r })}
                  >
                    {rateLabel(r)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-ink-soft">Anti-scatter grid</span>
              <div className="seg" role="radiogroup" aria-label="Anti-scatter grid">
                <button
                  type="button"
                  role="radio"
                  aria-checked={settings.grid}
                  className={`seg-btn ${settings.grid ? "seg-btn-active" : ""}`}
                  onClick={() => onSettings({ grid: true })}
                >
                  Grid in
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={!settings.grid}
                  className={`seg-btn ${!settings.grid ? "seg-btn-active" : ""}`}
                  onClick={() => onSettings({ grid: false })}
                >
                  Air gap
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
