import { useState, type ReactNode } from "react";

// Shared building blocks for the structural heart lab.

export type Level = "low" | "moderate" | "high";
export type Tone = "good" | "warn" | "danger" | "accent" | "faint";

export const TONE_TEXT: Record<Tone, string> = {
  good: "text-good",
  warn: "text-warn",
  danger: "text-danger",
  accent: "text-accent",
  faint: "text-ink-faint",
};

export const TONE_BORDER: Record<Tone, string> = {
  good: "border-good/40",
  warn: "border-warn/40",
  danger: "border-danger/40",
  accent: "border-accent/40",
  faint: "border-line",
};

export const TONE_HEX: Record<Tone, string> = {
  good: "#4CC38A",
  warn: "#E9B95A",
  danger: "#E5534B",
  accent: "#4F8EF7",
  faint: "#858D99",
};

export function levelTone(l: Level): Tone {
  return l === "high" ? "danger" : l === "moderate" ? "warn" : "good";
}

export function LevelChip({ level }: { level: Level }) {
  const t = levelTone(level);
  return (
    <span className={`chip ${TONE_BORDER[t]} ${TONE_TEXT[t]}`}>
      <span className="led" style={{ width: 6, height: 6 }} />
      {level}
    </span>
  );
}

export interface StepDef<T extends string> {
  id: T;
  label: string;
}

export function StepRail<T extends string>({ steps, current }: { steps: StepDef<T>[]; current: T }) {
  const idx = steps.findIndex((s) => s.id === current);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-1.5">
          <div
            className={`rounded-full px-2 py-0.5 text-[12px] border ${
              i === idx
                ? "border-accent/50 text-accent bg-accent/10"
                : i < idx
                ? "border-good/40 text-good"
                : "border-line text-ink-faint"
            }`}
          >
            {i + 1}. {s.label}
          </div>
          {i < steps.length - 1 && <div className={`h-px w-3 ${i < idx ? "bg-good/50" : "bg-line"}`} />}
        </div>
      ))}
    </div>
  );
}

export function Seg<T extends string | number>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button
          key={String(o.id)}
          disabled={disabled}
          onClick={() => onChange(o.id)}
          className={`seg-btn ${value === o.id ? "seg-btn-active" : ""} disabled:opacity-40`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  hint,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-start gap-2 text-sm ${disabled ? "opacity-40" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        className="mt-1 accent-[#4F8EF7]"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="text-ink">{label}</span>
        {hint && <span className="block text-[12px] text-ink-faint leading-snug">{hint}</span>}
      </span>
    </label>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  disabled,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
  disabled?: boolean;
  format?: (v: number) => string;
}) {
  return (
    <div className={disabled ? "opacity-40" : ""}>
      <div className="flex items-baseline justify-between">
        <span className="stat-label">{label}</span>
        <span className="font-mono text-sm text-ink">
          {format ? format(value) : value.toFixed(step < 1 ? 1 : 0)}
          {unit && <span className="text-ink-faint text-[12px] ml-0.5">{unit}</span>}
        </span>
      </div>
      <input
        type="range"
        className="w-full mt-1.5"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

export function Readout({
  label,
  value,
  unit,
  tone,
  small,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: Tone;
  small?: boolean;
}) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className={`metric font-mono ${small ? "text-base" : "text-xl"} ${tone ? TONE_TEXT[tone] : "text-ink"}`}>
        {value}
        {unit && <span className="text-[12px] text-ink-faint ml-1">{unit}</span>}
      </span>
    </div>
  );
}

export function Teach({ title, children, tone = "accent" }: { title?: string; children: ReactNode; tone?: Tone }) {
  return (
    <div className={`rounded-md border ${TONE_BORDER[tone]} bg-base-800/60 p-2.5 text-xs text-ink-soft leading-relaxed`}>
      {title && <div className={`font-medium mb-0.5 ${TONE_TEXT[tone]}`}>{title}</div>}
      {children}
    </div>
  );
}

export function Panel({
  title,
  right,
  children,
  className = "",
  bodyClass = "p-3",
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClass?: string;
}) {
  return (
    <div className={`panel ${className}`}>
      <div className="panel-head">
        <span>{title}</span>
        {right && <span className="normal-case tracking-normal font-normal">{right}</span>}
      </div>
      <div className={bodyClass}>{children}</div>
    </div>
  );
}

export interface RiskRow {
  key: string;
  label: string;
  level: Level;
  reasons: string[];
}

export function RiskList({ risks, initiallyOpen = false }: { risks: RiskRow[]; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <div className="divide-y divide-line">
      {risks.map((r) => {
        const isOpen = open[r.key] ?? (initiallyOpen && r.level !== "low");
        return (
          <div key={r.key} className="py-1.5">
            <button
              className="w-full flex items-center justify-between gap-2 text-left"
              onClick={() => setOpen((o) => ({ ...o, [r.key]: !isOpen }))}
            >
              <span className="text-sm text-ink">{r.label}</span>
              <span className="flex items-center gap-1.5">
                <LevelChip level={r.level} />
                <span className="text-ink-faint text-[12px] w-3">{isOpen ? "−" : "+"}</span>
              </span>
            </button>
            {isOpen && (
              <ul className="mt-1 space-y-0.5 pl-1">
                {r.reasons.length === 0 && <li className="text-[12px] text-ink-faint">No contributing factors in this plan.</li>}
                {r.reasons.map((t, i) => (
                  <li key={i} className="text-[12px] text-ink-soft leading-snug">
                    • {t}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const tone: Tone = score >= 80 ? "good" : score >= 55 ? "warn" : "danger";
  return (
    <div className={`flex items-baseline gap-1 ${TONE_TEXT[tone]}`}>
      <span className="metric font-mono text-4xl">{score}</span>
      <span className="text-ink-faint text-sm">/100</span>
    </div>
  );
}

export function DeductionList({ items }: { items: { points: number; reason: string }[] }) {
  if (items.length === 0) return <p className="text-xs text-good">No deductions.</p>;
  return (
    <ul className="space-y-1">
      {items.map((d, i) => (
        <li key={i} className="flex gap-2 text-xs">
          <span className="font-mono text-danger w-8 shrink-0 text-right">−{d.points}</span>
          <span className="text-ink-soft leading-snug">{d.reason}</span>
        </li>
      ))}
    </ul>
  );
}

export const DISCLAIMER =
  "Teaching simulation with synthetic cases and illustrative values. Not a medical device and not a guide to real device selection.";

export function Disclaimer() {
  return <p className="text-[12px] text-ink-faint leading-snug">{DISCLAIMER}</p>;
}

/** Converts a pointer event to SVG viewBox coordinates. */
export function svgPoint(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Runs a short eased animation; returns a cancel function. */
export function animate(ms: number, onFrame: (t: number) => void, onDone?: () => void): () => void {
  let raf = 0;
  const t0 = performance.now();
  const tick = (now: number) => {
    const raw = Math.min(1, (now - t0) / ms);
    const t = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
    onFrame(t);
    if (raw < 1) raf = requestAnimationFrame(tick);
    else onDone?.();
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
