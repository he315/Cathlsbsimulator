// ---------------------------------------------------------------------------
// The guide's mechanics in the PCI lab (pci-guide-engagement).
//
// One GuideEngagement per PCI session takes the hands' commands for the guide
// ('catheter': advance, withdraw, torque; src/ui/pci/inputBindings/guide.ts)
// and turns them into the guide's state:
//
//   analytic  the difficulty-independent engagement model of the diagnostic
//             lab (diag-engagement-fallback) through handGuide in
//             src/simulation/pci/actions/guide.ts. Always available; the only
//             mode while no physics implementation is registered.
//   bench     a physics implementation from getPhysicsDevices()
//             (src/ui/physics/types.ts) has been started with the case's root,
//             coronaries and the guide's shape; it receives every 'catheter'
//             command, while the analytic model still drives the state, for
//             PCI_ROD_GUIDE_BENCH.seconds of lab time after its first reading.
//   rod       the bench's median step cost was under PCI_ROD_GUIDE_BENCH.maxMedianMs:
//             the physics reading drives the state (engaged, depth, coaxiality,
//             the measured open fraction of the ostium, the conus, the
//             ventricle). This is PCI_ROD_GUIDE; it is off until an
//             implementation is registered, the learner's catheter-mechanics
//             setting allows the rod (resolvePhysicsMode) and the bench passes.
//
// The engine changes go through the session's operator-action path (asked of
// the attending as 'engage-guide'), as the wire's bindings do.
// useGuidePhysics(session) is the live monitor's hook: it creates the
// session's GuideEngagement, starts the physics when it may run, steps it on
// the session's clock and disposes it with the session.
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import type { AccessRoute, AnatomyVariant } from "../../types";
import type { AnatomyModel } from "../../simulation/anatomy";
import type { CoronaryTree } from "../../render/xray/coronaryTree";
import type { PciGeom, PciScenario, PciState } from "../../simulation/pci/state";
import { cloneWire } from "../../simulation/pci/coronaryWire";
import { log, syncWire, tele } from "../../simulation/pci/state";
import { coaxialFromAlignment, guideShapeId, guideSite, type GuideState } from "../../simulation/pci/guide";
import { handGuide, syncGuideWire, twistOnly, type GuideHand } from "../../simulation/pci/actions/guide";
import { getPhysicsDevices, type PhysicsDevices, type PhysicsDevicesImpl, type PhysicsReading } from "../physics/types";
import { coronariesAt, resolvePhysicsMode } from "../physics/physicsDevices";

// --- model parameters (docs/realism/facts/pkg-pci-guide-engagement.md) -------------------------------

/**
 * The start-up bench that switches the rod guide on: this much lab time after the first reading (s), and
 * the median step cost it must stay under (ms per step). The plan's design values (lab-build-plan.json,
 * pci-guide-engagement: 'a 2 s start-up bench is under 4 ms per step'). MODEL PARAMETERS.
 */
export const PCI_ROD_GUIDE_BENCH = { seconds: 2, maxMedianMs: 4 } as const;
/** Lab time to wait for the physics' first reading before falling back to the analytic model (s): the solver's own start-up bench takes about 9 s in a worker (diag-rod-physics MEASURED_COST). MODEL PARAMETER. */
export const PCI_ROD_GUIDE_WAIT_S = 30;

/** Whether the rod guide is on: an implementation is registered and its start-up bench met the cost rule. */
export function pciRodGuide(impl: PhysicsDevicesImpl | null, bench: { medianMs: number; frames: number } | null): boolean {
  return !!impl && !!bench && bench.frames > 0 && Number.isFinite(bench.medianMs) && bench.medianMs < PCI_ROD_GUIDE_BENCH.maxMedianMs;
}

// --- the session as the guide needs it ---------------------------------------------------------------

/** What the guide's mechanics need of the PCI session (PciLabSession satisfies it). */
export interface GuideSession {
  readonly s: PciScenario & { accessRoute?: AccessRoute };
  readonly g: PciGeom;
  readonly st: PciState;
  readonly model: AnatomyModel;
  readonly drawTree?: CoronaryTree;
  readonly caseData?: { accessRoute?: AccessRoute; variants?: AnatomyVariant[] };
  readonly engine?: { readonly time: number };
  /** a public entry for an engine change asked of the attending (preferred when present) */
  applyGuideAction?(f: (x: PciState) => PciState): boolean;
  onStep?(fn: (dt: number) => void): () => void;
  wall?(): number;
}

/**
 * Apply an engine change to the session as an operator action (the attending's 'engage-guide'). Uses
 * the session's public applyGuideAction when it has one, else its act(); false when it was stopped.
 */
export function applyGuideAction(session: GuideSession, f: (x: PciState) => PciState): boolean {
  if (typeof session.applyGuideAction === "function") return session.applyGuideAction(f);
  const act = (session as unknown as { act?: (a: string, fn: (x: PciState) => PciState) => boolean }).act;
  if (typeof act === "function") return act.call(session, "engage-guide", f);
  if (import.meta.env?.DEV) throw new Error("applyGuideAction: the PCI session offers neither applyGuideAction() nor act(); the guide's hand actions cannot reach the engine.");
  return false;
}

/** The physics reading as the guide's state: engaged in the case's coronary, depth, coaxiality, the measured open fraction. */
export function guideFromReading(gs: GuideState, side: "left" | "right", r: PhysicsReading, t: number): GuideState {
  const deepOrSel = r.kind === "selective-lm" || r.kind === "selective-rca" || r.kind === "deep-lm" || r.kind === "deep-rca";
  const engaged = !r.conus && r.side === side && r.vessel !== null && deepOrSel;
  if (engaged) {
    const n: GuideState = { ...gs, engaged: true, depthMm: Math.max(-1, r.depthMm), coaxial: coaxialFromAlignment(0.55 + 0.45 * Math.max(0, r.coaxiality)), openFraction: Math.max(0, Math.min(1, r.openFraction)), zone: undefined, nearSince: null };
    if (!gs.engaged) n.engagements = (gs.engagements ?? 0) + 1;
    return n;
  }
  const zone: GuideState["zone"] =
    r.kind === "in-lv" || r.kind === "below-valve" || r.prolapsed ? "lv" : r.conus ? "conus" : r.kind === "ascending-aorta" ? "ascending" : r.side && r.side !== side ? "other-side" : r.side === side ? "near" : "root";
  const n: GuideState = { ...gs, engaged: false, depthMm: Math.min(gs.depthMm, -1), coaxial: 0, zone, nearSince: zone === "near" ? (gs.nearSince ?? t) : null };
  delete n.openFraction;
  return n;
}

// --- the controller -------------------------------------------------------------------------------------

export type GuideMechanics = "analytic" | "bench" | "rod";

export interface GuideEngagementOptions {
  /** a physics implementation to start (default none: the analytic model) */
  impl?: PhysicsDevicesImpl | null;
  /** create the implementation without a worker (tests) */
  useWorker?: boolean;
}

export class GuideEngagement {
  mode: GuideMechanics = "analytic";
  /** why the analytic model is in use, when a physics implementation was tried */
  reason: string | null = null;
  /** the bench's result once taken */
  bench: { medianMs: number; frames: number } | null = null;
  physics: PhysicsDevices | null = null;
  private impl: PhysicsDevicesImpl | null = null;
  private loadedId: string | null = null;
  private costs: number[] = [];
  private firstReadingAt: number | null = null;
  private startedAt = 0;
  private lastReadingT = -Infinity;
  private offStep: (() => void) | null = null;
  disposed = false;

  constructor(readonly session: GuideSession, o: GuideEngagementOptions = {}) {
    if (o.impl) this.startPhysics(o.impl, o.useWorker);
  }

  /** The lab clock the physics steps on (the patient engine's time when there is one). */
  private clock(): number {
    return this.session.engine?.time ?? this.session.wall?.() ?? this.session.st.t;
  }

  /** Start a physics implementation for the guide (bench first). */
  startPhysics(impl: PhysicsDevicesImpl, useWorker = true): void {
    if (this.physics || this.disposed) return;
    const x = this.session;
    try {
      const phys = impl.create({ useWorker });
      phys.init({
        model: x.model,
        route: x.caseData?.accessRoute ?? x.s.accessRoute ?? "femoral",
        variants: x.caseData?.variants,
        coronaries: x.drawTree ? coronariesAt(x.drawTree, null) : [],
        t0: this.clock(),
      });
      this.physics = phys;
      this.impl = impl;
      this.loadGuide();
      this.mode = "bench";
      this.startedAt = this.clock();
      if (x.onStep) this.offStep = x.onStep(() => this.step());
    } catch (e) {
      this.physics = null;
      this.mode = "analytic";
      this.reason = `The guide physics could not start (${e instanceof Error ? e.message : String(e)}); the analytic model is in use.`;
    }
  }

  private loadGuide() {
    const id = this.session.st.guide.id;
    if (!this.physics || this.loadedId === id) return;
    if (this.loadedId) this.physics.remove("guide");
    this.physics.load("guide", guideShapeId(id), { advanceMm: 0 });
    this.loadedId = id;
  }

  /** The hands on the guide: an advance or withdrawal (mm, +/-) or a rotation (rad). */
  command(h: GuideHand): boolean {
    if (this.disposed) return false;
    const mm = h.mm ?? 0;
    const rad = h.rad ?? 0;
    if (this.physics) {
      if (mm) this.physics.command({ kind: "push", device: "catheter", mm });
      if (rad) this.physics.command({ kind: "torque", device: "catheter", rad });
      if (this.mode === "rod") {
        // the physics moves the tip; the shaft's stored twist and kink are kept here, so the hub read-out,
        // catheter-kink and torque-not-transmitted work in both mechanics
        const x = this.session;
        if (rad || (mm && x.st.guide.twistRad)) applyGuideAction(x, (st) => twistOnly(st, rad, mm));
        return true;
      }
    }
    const x = this.session;
    return applyGuideAction(x, (st) => handGuide(x.s, x.g, x.model, st, h));
  }

  /** One lab step: the physics advances; the bench is taken; in rod mode the reading drives the guide. */
  step(): void {
    const phys = this.physics;
    if (!phys || this.disposed) return;
    this.loadGuide();
    const now = this.clock();
    phys.step(now);
    const r = phys.latest();
    if (!r) {
      if (this.mode === "bench" && now - this.startedAt > PCI_ROD_GUIDE_WAIT_S) this.fallBack(`The guide physics gave no reading within ${PCI_ROD_GUIDE_WAIT_S} s; the analytic model is in use.`);
      return;
    }
    const fresh = r.t !== this.lastReadingT;
    this.lastReadingT = r.t;
    if (this.mode === "bench") {
      if (fresh && Number.isFinite(r.costMs)) this.costs.push(r.costMs);
      if (this.firstReadingAt === null) this.firstReadingAt = now;
      if (now - this.firstReadingAt >= PCI_ROD_GUIDE_BENCH.seconds) {
        const sorted = [...this.costs].sort((a, b) => a - b);
        const medianMs = sorted.length ? sorted[Math.floor((sorted.length - 1) / 2)] : Infinity;
        this.bench = { medianMs, frames: sorted.length };
        if (pciRodGuide(this.impl, this.bench)) this.mode = "rod";
        else this.fallBack(`The guide physics' start-up bench (median ${Number.isFinite(medianMs) ? medianMs.toFixed(1) : "no"} ms per step over ${sorted.length} steps) is not under ${PCI_ROD_GUIDE_BENCH.maxMedianMs} ms; the analytic model is in use.`);
      }
      return;
    }
    if (this.mode === "rod" && fresh) this.applyReading(r);
  }

  private applyReading(r: PhysicsReading) {
    const x = this.session;
    const gs0 = x.st.guide;
    const gs = guideFromReading(gs0, x.s.side, r, x.st.t);
    const changed = gs.engaged !== gs0.engaged || Math.abs(gs.depthMm - gs0.depthMm) > 0.05 || Math.abs(gs.coaxial - gs0.coaxial) > 0.02 || gs.zone !== gs0.zone || gs.openFraction !== gs0.openFraction;
    if (!changed) return;
    applyGuideAction(x, (st) => {
      let n: PciState = { ...st, guide: { ...gs, ostiumMm: gs.ostiumMm ?? guideSite(x.g, x.s.side).ostiumMm } };
      if (gs.engaged !== gs0.engaged) {
        n = syncWire(n, { ...cloneWire(n.wire), guideEngaged: gs.engaged || n.tipMm > 3 });
        n = tele(n, gs.engaged ? "guide-engage" : "guide-disengage", { depthMm: gs.depthMm, coaxial: gs.coaxial, physics: true });
        n = log(n, gs.engaged ? "good" : "warn", gs.engaged ? "The guide tip jumps into the ostium." : "The guide has come out of the ostium.");
      }
      return syncGuideWire(x.s, n, x.g);
    });
  }

  private fallBack(reason: string) {
    this.reason = reason;
    this.mode = "analytic";
    this.disposePhysics();
  }

  private disposePhysics() {
    this.offStep?.();
    this.offStep = null;
    this.physics?.dispose();
    this.physics = null;
    this.loadedId = null;
  }

  dispose(): void {
    this.disposePhysics();
    this.disposed = true;
    if (ENGAGEMENTS.get(this.session) === this) ENGAGEMENTS.delete(this.session);
  }
}

const ENGAGEMENTS = new WeakMap<object, GuideEngagement>();

/** The session's guide mechanics (created on first use, analytic until physics is started). */
export function guideEngagementFor(session: GuideSession, o: GuideEngagementOptions = {}): GuideEngagement {
  let e = ENGAGEMENTS.get(session);
  if (!e || e.disposed) ENGAGEMENTS.set(session, (e = new GuideEngagement(session, o)));
  else if (o.impl && !e.physics) e.startPhysics(o.impl, o.useWorker);
  return e;
}

/** Whether the rod may run for this guide: the catheter-mechanics setting allows it and the solver has the shape. */
export function guidePhysicsAllowed(guideId: string): boolean {
  return resolvePhysicsMode({ registered: true, catheterId: guideShapeId(guideId) }).on;
}

/**
 * The live lab's guide mechanics: the session's GuideEngagement, with the registered physics
 * implementation started (bench first) when the catheter-mechanics setting allows the rod. Disposed
 * with the session.
 */
export function useGuidePhysics(session: GuideSession | null): GuideEngagement | null {
  const [eng, setEng] = useState<GuideEngagement | null>(null);
  useEffect(() => {
    if (!session) return;
    const e = guideEngagementFor(session);
    setEng(e);
    const impl = getPhysicsDevices();
    if (impl && !e.physics && guidePhysicsAllowed(session.st.guide.id)) e.startPhysics(impl);
    return () => e.dispose();
  }, [session]);
  return eng;
}
