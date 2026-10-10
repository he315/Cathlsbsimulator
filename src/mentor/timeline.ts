// ---------------------------------------------------------------------------
// Swimlane data for the replay timeline: beam bars, injections, pressure and
// engagement bands, the C-arm trace, attending prompts and error flags. Pure
// data so the UI only draws.
// ---------------------------------------------------------------------------

import type { Analysis } from "./analysis";
import type { MistakeEvidence } from "./mistakes";
import { ENGAGEMENT_KINDS, PRESSURE_KINDS, type LadderLevel } from "./types";

export interface Span {
  from: number;
  to: number;
  kind: string;
}

export interface Mark {
  t: number;
  kind: string;
  label: string;
  /** mentor ladder level, or 0 */
  level?: LadderLevel;
  /** safety, technique, efficiency */
  severity?: string;
}

export interface TimelineLanes {
  t0: number;
  t1: number;
  beam: Span[];
  injections: Mark[];
  pressure: Span[];
  engagement: Span[];
  /** decimated C-arm samples */
  cArm: { t: number; laoRao: number; cranCaud: number }[];
  mentor: Mark[];
  errors: Mark[];
}

function bands(a: Analysis, key: "eng" | "press", names: readonly string[]): Span[] {
  const out: Span[] = [];
  const f = a.frames;
  let cur: Span | null = null;
  for (let i = 0; i < f.length; i++) {
    const t = f.value(i, "tWall");
    const k = names[f.value(i, key)] ?? "?";
    if (!cur || cur.kind !== k) {
      if (cur) cur.to = t;
      cur = { from: t, to: t, kind: k };
      out.push(cur);
    }
  }
  if (cur) cur.to = a.t1;
  return out;
}

export function timelineLanes(a: Analysis, evidence: MistakeEvidence[] = [], maxCArmPoints = 400): TimelineLanes {
  const f = a.frames;
  const beam: Span[] = [];
  let open: Span | null = null;
  for (let i = 0; i < f.length; i++) {
    const t = f.value(i, "tWall");
    const b = f.value(i, "beam");
    const k = b === 2 ? "cine" : b === 1 ? "fluoro" : "";
    if (open && open.kind !== k) {
      open.to = t;
      open = null;
    }
    if (!open && k) {
      open = { from: t, to: t, kind: k };
      beam.push(open);
    }
  }
  if (open) open.to = a.t1;
  const step = Math.max(1, Math.ceil(f.length / maxCArmPoints));
  const cArm: TimelineLanes["cArm"] = [];
  for (let i = 0; i < f.length; i += step) cArm.push({ t: f.value(i, "tWall"), laoRao: f.value(i, "laoRao"), cranCaud: f.value(i, "cranCaud") });
  return {
    t0: a.t0,
    t1: a.t1,
    beam,
    injections: a.injections.map((e) => ({ t: e.tWall, kind: String(e.data?.outcome ?? "inject"), label: `${Math.round(Number(e.data?.ml ?? 0))} mL` })),
    pressure: bands(a, "press", PRESSURE_KINDS),
    engagement: bands(a, "eng", ENGAGEMENT_KINDS),
    cArm,
    mentor: a.mentor.map((m) => ({ t: m.tWall, kind: String(m.data?.ruleId ?? "mentor"), label: String(m.data?.text ?? ""), level: (Number(m.data?.level ?? 0) as LadderLevel) || 0, severity: String(m.data?.severity ?? "") })),
    errors: evidence.map((e) => ({ t: e.tWall, kind: e.code, label: e.note })),
  };
}

/** What the image chain needs to redraw the recorded frame at a wall time. */
export interface ReplayFrameState {
  tWall: number;
  tPatient: number;
  cArm: { laoRao: number; cranialCaudal: number };
  field: number;
  pps: number;
  beam: "off" | "fluoro" | "cine";
  /** catheter on the table at that time */
  catheterId: string;
  tip: { x: number; y: number; z: number };
  /** cine run in progress, and seconds since its injection started (the bolus time for the renderer) */
  run?: { id: string; side: string | null; tSinceInjection: number | null; filledVessels: string[] };
}

/**
 * The recorded state at a wall time, for redrawing the X-ray frame (the integrator feeds it,
 * or a ReplayController seek, into buildXrayScene). Pure lookup: no simulation.
 */
export function replayFrameState(a: Analysis, tWall: number): ReplayFrameState {
  const f = a.frames;
  const i = Math.max(0, f.indexAt(tWall));
  const beam = f.value(i, "beam");
  const run = a.runs.find((r) => tWall >= r.startT && tWall <= r.endT);
  const firstInj = run?.injections[0];
  const cath = a.catheters.filter((c) => c.startT <= tWall).pop()?.id ?? a.catheters[0]?.id ?? "";
  return {
    tWall,
    tPatient: f.length ? f.value(i, "tPatient") + (tWall - f.value(i, "tWall")) : tWall,
    cArm: { laoRao: f.value(i, "laoRao"), cranialCaudal: f.value(i, "cranCaud") },
    field: f.value(i, "field"),
    pps: f.value(i, "pps"),
    beam: beam === 2 ? "cine" : beam === 1 ? "fluoro" : "off",
    catheterId: cath,
    tip: { x: f.value(i, "tipX"), y: f.value(i, "tipY"), z: f.value(i, "tipZ") },
    run: run ? { id: run.id, side: run.side, tSinceInjection: firstInj ? tWall - firstInj.tWall : null, filledVessels: run.filledVessels } : undefined,
  };
}
