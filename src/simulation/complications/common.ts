// Helpers shared by the complication modules.
import type { Complication, ComplicationKind, CxContext, CxNote, CxState } from "./types";

export function newComplication(
  cx: CxState,
  t: number,
  kind: ComplicationKind,
  o: Pick<Complication, "route" | "vessel" | "atMm" | "lengthMm" | "severity" | "grade" | "cause"> & Partial<Pick<Complication, "stage" | "data">>
): Complication {
  const c: Complication = {
    id: `${kind}-${cx.nextId++}`,
    kind,
    stage: o.stage ?? "prodrome",
    t0: t,
    tOvert: o.stage === "overt" ? t : null,
    tTreated: null,
    route: o.route.slice(),
    vessel: o.vessel,
    atMm: o.atMm,
    lengthMm: o.lengthMm,
    severity: o.severity,
    grade: o.grade,
    cause: o.cause,
    data: { ...(o.data ?? {}) },
    bailouts: [],
  };
  cx.list.push(c);
  return c;
}

export function note(t: number, c: Complication, type: CxNote["type"], tone: CxNote["tone"], text: string): CxNote {
  return { t, id: c.id, kind: c.kind, type, tone, text };
}

/** Does a stent span [from, to] on `route` cover [a, b] on route `r` (same vessels), with a margin (mm)? */
export function spanCovers(route: string[], from: number, to: number, r: string[], a: number, b: number, margin = 1): boolean {
  const last = r[r.length - 1];
  if (!route.includes(last)) return false;
  return from <= a - margin && to >= b + margin;
}

export function spanOverlap(route: string[], from: number, to: number, r: string[], a: number, b: number): number {
  const last = r[r.length - 1];
  if (!route.includes(last)) return 0;
  return Math.max(0, Math.min(to, b) - Math.max(from, a));
}

export function overt(c: Complication, t: number): boolean {
  if (c.stage === "prodrome") {
    c.stage = "overt";
    c.tOvert = t;
    return true;
  }
  return false;
}

export function treated(c: Complication, t: number, resolved = false): void {
  if (c.tTreated === null) c.tTreated = t;
  c.stage = resolved ? "resolved" : "treated";
}

/** Balloon span covering (or just proximal to) a position: occludes inflow there. */
export function balloonAt(ctx: CxContext, route: string[], mm: number): boolean {
  const b = ctx.balloon;
  if (!b) return false;
  const last = route[route.length - 1];
  if (!b.route.includes(last) && !route.includes(b.route[b.route.length - 1])) return false;
  return b.fromMm <= mm + 1 && b.toMm >= mm - 12;
}
