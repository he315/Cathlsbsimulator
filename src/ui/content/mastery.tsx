import type { Module, Track } from "../../content/schema";
import type { ProgressProfile } from "../../types";
import { moduleMastery } from "../../simulation/srs";

export function modMastery(m: Module, p: ProgressProfile): number {
  return moduleMastery(
    m.lessons.map((l) => l.id),
    m.quiz.map((q) => q.id),
    p.lessonsDone,
    p.quizMemory
  );
}

export function trackMastery(t: Track, p: ProgressProfile): number {
  if (t.modules.length === 0) return 0;
  return Math.round(t.modules.reduce((a, m) => a + modMastery(m, p), 0) / t.modules.length);
}

export function trackCounts(t: Track) {
  const lessons = t.modules.reduce((a, m) => a + m.lessons.length, 0);
  const quiz = t.modules.reduce((a, m) => a + m.quiz.length, 0);
  const minutes = t.modules.reduce((a, m) => a + m.lessons.reduce((b, l) => b + l.minutes, 0), 0);
  return { modules: t.modules.length, lessons, quiz, cases: t.cases.length, minutes };
}

export const STAGES: { stage: 1 | 2 | 3 | 4 | 5; name: string; goal: string }[] = [
  { stage: 1, name: "Foundations", goal: "Heart, physiology, ECG, drugs, radiation and the cath lab from scratch." },
  { stage: 2, name: "Diagnostic operator", goal: "Safe access, catheters, views, haemodynamics and reporting on your own." },
  { stage: 3, name: "PCI operator", goal: "Indications, physiology, imaging and standard PCI step by step." },
  { stage: 4, name: "Complex and acute", goal: "Bifurcation, left main, calcium, CTO, STEMI, shock, complications." },
  { stage: 5, name: "Structural and MCS", goal: "TAVI, mitral and tricuspid, LAAO, PFO, Impella and ECMO." },
];

export function Ring({ pct, size = 40, stroke = 4 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const col = pct >= 80 ? "#4CC38A" : pct >= 40 ? "#4F8EF7" : pct > 0 ? "#E9B95A" : "#2E343C";
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#22262C" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={col}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${(c * pct) / 100} ${c}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={size * 0.27} fill="#ECEEF1" fontFamily="'IBM Plex Mono', ui-monospace, monospace">
        {pct}
      </text>
    </svg>
  );
}
