// ---------------------------------------------------------------------------
// Reading exam sets on held-out library material (track I4).
//
// Exam integrity on a finite library: a set is drawn from held-out items this
// learner has never been shown in an exam of the same drill (single runs, or
// patients for the dominance and planning drills). When unseen items cannot fill
// a set of at least READING_EXAM.minFraction of a full practice set (and at least
// READING_EXAM.minItems), items last shown more than READING_EXAM.washoutDays ago
// are added back; otherwise no set is offered. Thresholds are model parameters
// (facts/I4.md).
// ---------------------------------------------------------------------------

import { makeSet, type DrillContext, type DrillItem, type DrillKind, type LibPatient } from "../ui/angio/library";
import { READING_EXAM } from "../content/mentor/catalogue";
import { daysBetween } from "../utils/storage";

/** Drills whose items are patients rather than single runs. */
export const BY_PATIENT: readonly DrillKind[] = ["dominance", "plan"];

/** Key under which an exam item is remembered as seen. */
export const seenKey = (drill: DrillKind, it: DrillItem): string => (BY_PATIENT.includes(drill) ? `patient:${it.run.patientId}` : it.run.id);

/** The held-out library without the excluded items. */
export function withoutItems(drill: DrillKind, patients: LibPatient[], exclude: Set<string>): DrillContext {
  const ps = BY_PATIENT.includes(drill) ? patients.filter((p) => !exclude.has(`patient:${p.id}`)) : patients.map((p) => ({ ...p, runs: p.runs.filter((r) => !exclude.has(r.id)) }));
  return { runs: ps.flatMap((p) => p.runs), patients: ps, borderline: "exclude" };
}

/** Smallest set offered for a drill whose full practice set has `full` items. */
export const minSetSize = (full: number): number => Math.max(READING_EXAM.minItems, Math.ceil(full * READING_EXAM.minFraction));

/**
 * An exam set for this learner, or null when even the washout cannot fill one.
 * `seen` maps item keys to the date they were last shown in an exam of this drill.
 */
export function examSet(drill: DrillKind, patients: LibPatient[], seen: Record<string, string>, today: string, full: number, r: () => number = Math.random): { items: DrillItem[]; reused: boolean } | null {
  const min = minSetSize(full);
  const fresh = makeSet(drill, withoutItems(drill, patients, new Set(Object.keys(seen))), r);
  if (fresh.length >= min) return { items: fresh, reused: false };
  const recent = new Set(Object.entries(seen).filter(([, d]) => daysBetween(d, today) < READING_EXAM.washoutDays).map(([k]) => k));
  const mixed = makeSet(drill, withoutItems(drill, patients, recent), r);
  return mixed.length >= min ? { items: mixed, reused: true } : null;
}

/** Sets still available on a drill without re-use, counted up to `cap`, on a fixed random stream. */
export function setsLeft(drill: DrillKind, patients: LibPatient[], seen: Record<string, string>, full: number, cap = 3): number {
  let seed = 12345;
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const min = minSetSize(full);
  const ex = new Set(Object.keys(seen));
  let n = 0;
  while (n < cap) {
    const set = makeSet(drill, withoutItems(drill, patients, ex), r);
    if (set.length < min) break;
    set.forEach((it) => ex.add(seenKey(drill, it)));
    n++;
  }
  return n;
}
