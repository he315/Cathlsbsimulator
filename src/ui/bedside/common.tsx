import { useEffect, useRef, type ReactNode } from "react";

// Shared presentational pieces for the bedside procedure labs.

export type Tone = "good" | "warn" | "danger" | "info" | "plain";

export const toneText: Record<Tone, string> = {
  good: "text-good",
  warn: "text-warn",
  danger: "text-danger",
  info: "text-accent",
  plain: "text-ink-soft",
};

export interface LogEntry {
  t: number;
  text: string;
  tone: Tone;
}

export function StepTracker<S extends string>({ steps, labels, current, done }: { steps: S[]; labels: Record<S, string>; current: S; done: (s: S) => boolean }) {
  return (
    <ol className="space-y-1">
      {steps.map((s, i) => {
        const active = s === current;
        const ok = done(s);
        return (
          <li
            key={s}
            className={`flex items-center gap-2 rounded px-2 py-1 text-[12px] ${
              active ? "bg-accent/10 text-ink border border-accent/40" : ok ? "text-good" : "text-ink-faint"
            }`}
          >
            <span className="font-mono text-[12px] w-4 text-right">{i + 1}</span>
            <span className="led" style={{ width: 6, height: 6, color: active ? "#4F8EF7" : ok ? "#4CC38A" : "#858D99" }} />
            <span>{labels[s]}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function LogPanel({ log, className = "" }: { log: LogEntry[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [log]);
  return (
    <div className={`panel p-0 flex flex-col min-h-0 ${className}`}>
      <div className="panel-head">Procedure log</div>
      <div ref={ref} className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1.5 max-h-72">
        {log.length === 0 && <div className="text-[12px] text-ink-faint">Nothing yet.</div>}
        {log.map((l, i) => (
          <div key={i} className="text-[12px] flex gap-2">
            <span className="text-ink-faint font-mono shrink-0">{String(i + 1).padStart(2, "0")}</span>
            <span className={toneText[l.tone]}>{l.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Panel({ title, right, children, className = "", bodyClass = "p-3" }: { title: ReactNode; right?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <div className={`panel overflow-hidden ${className}`}>
      <div className="panel-head">
        <span className="flex items-center gap-2">{title}</span>
        {right && <span className="normal-case tracking-normal font-normal">{right}</span>}
      </div>
      <div className={bodyClass}>{children}</div>
    </div>
  );
}

export function Readout({ label, value, unit, color = "text-ink", sub, blip }: { label: string; value: ReactNode; unit?: string; color?: string; sub?: ReactNode; blip?: boolean }) {
  return (
    <div className="px-3 py-1.5 flex items-baseline justify-between gap-1">
      <div className="flex flex-col">
        <span className="text-[12px] text-ink-faint flex items-center gap-1">
          {blip && <span className={`led ${color} animate-blip`} style={{ width: 5, height: 5 }} />}
          {label}
        </span>
        <span className={`metric text-2xl font-semibold ${color}`}>
          {value}
          {unit && <span className="text-[12px] text-ink-faint font-normal ml-1">{unit}</span>}
        </span>
      </div>
      {sub && <span className={`metric text-[12px] ${color} opacity-70`}>{sub}</span>}
    </div>
  );
}

export interface DebriefItem {
  label: string;
  points: number;
  max: number;
  detail: string;
}

export function Debrief({
  score,
  items,
  teaching,
  onRestart,
  title = "Debrief",
}: {
  score: number;
  items: DebriefItem[];
  teaching: string[];
  onRestart: () => void;
  title?: string;
}) {
  const tone = score >= 80 ? "text-good" : score >= 55 ? "text-warn" : "text-danger";
  return (
    <div className="panel overflow-hidden animate-fadein">
      <div className="panel-head">
        <span>{title}</span>
        <span className="normal-case tracking-normal">score recorded</span>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex items-end gap-3">
          <span className={`metric text-5xl font-semibold ${tone}`}>{score}</span>
          <span className="text-ink-faint text-sm mb-1">/ 100</span>
        </div>
        <div className="space-y-2">
          {items.map((it) => {
            const pct = it.max > 0 ? Math.max(0, it.points) / it.max : 0;
            const c = it.max === 0 ? "text-danger" : pct >= 0.8 ? "text-good" : pct >= 0.4 ? "text-warn" : "text-danger";
            return (
              <div key={it.label} className="border border-line rounded-md p-2.5 bg-base-800/60">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink">{it.label}</span>
                  <span className={`font-mono ${c}`}>
                    {it.points}
                    {it.max > 0 ? ` / ${it.max}` : ""}
                  </span>
                </div>
                {it.detail && <p className="text-[12px] text-ink-soft mt-1">{it.detail}</p>}
              </div>
            );
          })}
        </div>
        <div>
          <div className="stat-label mb-1.5">Teaching points</div>
          <ul className="space-y-1.5">
            {teaching.map((t, i) => (
              <li key={i} className="text-[12px] text-ink-soft flex gap-2">
                <span className="text-accent">•</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <button className="btn btn-accent" onClick={onRestart}>
          Run another scenario
        </button>
        <p className="text-[12px] text-ink-faint">Educational simulation only. Not a medical device; follow local protocols and senior supervision.</p>
      </div>
    </div>
  );
}

export function Seg<T extends string>({ options, value, onChange, disabled }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button
          key={o.id}
          disabled={disabled}
          className={`seg-btn ${value === o.id ? "seg-btn-active" : ""} disabled:opacity-40`}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
