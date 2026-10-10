// ---------------------------------------------------------------------------
// Renderer and patient read-outs: the lumen as the X-ray renderer draws it,
// the effects on the S9 patient engine, and the live complications.
// ---------------------------------------------------------------------------

import type { Lesion, VesselId } from "../../../types";
import type { CoronaryTree, Scaffold } from "../../../render/xray/coronaryTree";
import { occluding } from "../indeflator";
import { paramAtMm } from "../geometry";
import { activeComplications, patientEffects, type Complication, type PatientEffects } from "../../complications/engine";
import { wiringOf, type PciGeom, type PciScenario, type PciState } from "../state";
import { cxContext } from "./step";
import { activeSpasms, spasmOcclusion } from "./bailouts";

/**
 * Narrowings a support wire makes at the bends while its stiff shaft straightens a tortuous vessel
 * (pseudolesions, pci-flow-closure; the sites are the wiring record's, src/simulation/pci/actions/wire.ts):
 * their stenosis (%) and length (mm) on the image — MODEL PARAMETERS
 * (docs/realism/facts/pkg-pci-flow-closure.md). They are drawn, not given to the patient engine: they
 * resolve when the stiff segment leaves the bends and limit no flow in the model.
 */
export const MP_PSEUDOLESION = { severityPct: 55, lengthMm: 4 } as const;

/**
 * The flow and closure narrowings drawn on the image (pci-flow-closure): pseudolesions at the bends and spasm.
 * Neither is given to the engine's coronary network: a pseudolesion limits no flow in the model, and a spasm's
 * flow limit reaches the engine as an occlusion (pciPatientEffects), which follows its relaxation at once.
 */
function flowNarrowings(g: PciGeom, st: PciState): Lesion[] {
  const out: Lesion[] = [];
  for (const p of wiringOf(st).pseudo?.sites ?? []) {
    const at = paramAtMm(g, st.route, p.atMm);
    if (at?.lesionId) out.push({ vessel: at.lesionId, position: at.param, severity: MP_PSEUDOLESION.severityPct, kind: "moderate-stenosis", lengthMm: MP_PSEUDOLESION.lengthMm });
  }
  for (const sp of activeSpasms(st)) {
    const at = paramAtMm(g, sp.route, sp.atMm);
    if (at?.lesionId) out.push({ vessel: at.lesionId, position: at.param, severity: Math.round(sp.severity), kind: "spasm", morphology: "spasm", nitrateResponsive: true, lengthMm: sp.lengthMm });
  }
  return out;
}

/**
 * The part of the drawn lumen that flowNarrowings adds beyond the severity and the stents: each pseudolesion's
 * site and each active spasm's stenosis as drawn (rounded %). Empty when there is neither. The lab's tree key
 * (PciLabSession syncTree) is meant to append it, so the image is redrawn when a pseudolesion appears or
 * clears and as a spasm relaxes.
 */
export function flowDrawKey(st: Pick<PciState, "log" | "t" | "wiring">): string {
  const sites = wiringOf(st).pseudo?.sites ?? [];
  const spasms = activeSpasms(st);
  if (!sites.length && !spasms.length) return "";
  return `${sites.map((p) => `${p.vessel}@${p.atMm.toFixed(1)}`).join(",")}|${spasms.map((sp) => `${sp.id}:${Math.round(sp.severity)}`).join(",")}`;
}

/** Lumen state for the renderer: the lesion as it is, side-branch and dissection narrowing, embolised twigs, pseudolesions and spasm, stents as scaffolds. */
export function lumenFor(s: PciScenario, g: PciGeom, st: PciState): { lesions: Lesion[]; scaffolds: Scaffold[] } {
  return lumenWith(s, g, st, { drawn: true });
}

function lumenWith(s: PciScenario, g: PciGeom, st: PciState, o: { drawn: boolean }): { lesions: Lesion[]; scaffolds: Scaffold[] } {
  const tv = g.byName.get(g.lesion.vessel)!;
  const toParam = (v: { pathMm: number[] }, mm: number) => Math.max(0, Math.min(1, (mm - v.pathMm[0]) / Math.max(1, v.pathMm[v.pathMm.length - 1] - v.pathMm[0])));
  const lesions: Lesion[] = [{ vessel: s.target.vessel, position: s.target.position, severity: st.severity, kind: s.target.kind, lengthMm: s.target.lengthMm }];
  for (const c of st.cx.list) {
    if (c.stage === "resolved") continue;
    if (c.kind === "side-branch") {
      const v = g.byName.get(c.vessel);
      if (v?.lesionId) lesions.push({ vessel: v.lesionId, position: Math.min(0.06, v.param[Math.min(2, v.param.length - 1)]), severity: Math.round(100 * Math.min(1, 0.55 + 0.45 * c.severity)), kind: "severe-stenosis", lengthMm: 3 });
    } else if (c.kind === "dissection" && (c.grade === "E" || c.grade === "F")) {
      const p = paramAtMm(g, c.route, c.atMm);
      if (p?.lesionId) lesions.push({ vessel: p.lesionId, position: p.param, severity: c.grade === "F" ? 100 : 75, kind: "thrombotic", lengthMm: Math.max(4, c.lengthMm) });
    } else if (c.kind === "thrombus" && c.data.embolised) {
      const p = paramAtMm(g, c.route, c.atMm);
      if (p?.lesionId) lesions.push({ vessel: p.lesionId, position: p.param, severity: 100, kind: "thrombotic", lengthMm: 3 });
    }
  }
  if (o.drawn) lesions.push(...flowNarrowings(g, st));
  const scaffolds: Scaffold[] = st.stents.map((p) => {
    const v = g.byName.get(p.vessel) ?? g.byName.get(p.route[p.route.length - 1]) ?? tv;
    const lid = (v.lesionId ?? p.vessel) as VesselId;
    return { vessel: lid, from: toParam(v, p.fromMm), to: toParam(v, p.toMm), radius: p.diameter / 2 };
  });
  return { lesions, scaffolds };
}

/** Effects on the S9 patient engine now: complications plus an inflated balloon's occlusion. */
export function pciPatientEffects(s: PciScenario, g: PciGeom, st: PciState): PatientEffects & { valveOpen: boolean } {
  const ctx = cxContext(g, st);
  const fx = patientEffects(st.cx, ctx);
  const dev = st.device;
  if (dev && occluding(st.ind) && dev.centreMm > 0 && (dev.kind === "balloon" || dev.kind === "stent" || dev.kind === "covered-stent")) {
    const p = paramAtMm(g, st.route, Math.max(0, dev.centreMm - dev.lengthMm / 2));
    if (p) fx.occlusions.push({ id: "balloon", vessel: p.vessel, param: p.param, fraction: 1 });
  }
  // pci-flow-closure: a spasm limits flow by its stenosis (bailouts.ts spasmOcclusion)
  for (const sp of activeSpasms(st)) {
    const f = spasmOcclusion(sp.severity);
    const p = f > 0 ? paramAtMm(g, sp.route, sp.atMm) : null;
    if (p) fx.occlusions.push({ id: `spasm-${sp.id}`, vessel: p.vessel, param: p.param, fraction: f });
  }
  // a guide extension or a deep guide in a small vessel limits inflow — MODEL PARAMETER
  if (st.guide.extensionMm !== null && st.tipMm > 0) {
    const p = paramAtMm(g, st.route, Math.max(1, st.guide.extensionMm));
    if (p) fx.occlusions.push({ id: "extension", vessel: p.vessel, param: p.param, fraction: 0.35 });
  }
  void s;
  return { ...fx, valveOpen: st.valveOpen };
}

/** Live complications for read-outs. */
export function complicationsNow(st: PciState): Complication[] {
  return activeComplications(st.cx);
}

// ---------------------------------------------------------------------------
// Patient coupling (pci-patient-coupling): the engine's coronary network
// follows the lumen actually treated, and the injection- and reperfusion-
// related arrhythmias. Every number is a MODEL PARAMETER
// (docs/realism/facts/pkg-pci-patient-coupling.md).
// ---------------------------------------------------------------------------

/** MODEL PARAMETERS of the coupling. */
export const MP_PATIENT_COUPLING = {
  /** the treated lumen must be unchanged this long (s of lab time), with nothing inflated, before the engine takes it */
  treeSettleS: 1,
  /** a target lesion at or above this severity (%) that falls to or below `reperfusedPct` reperfuses its territory */
  reperfusionFromPct: 90,
  reperfusedPct: 50,
  /** chance of VF when an occluded territory is reperfused (MODEL: reperfusion arrhythmia, the arrhythmia lesson) */
  reperfusionVfP: 0.08,
  /** chance of VF per injection through a damped or wedged left guide (the engine draws the right side and a wedge per mL) */
  dampedLeftInjectionVfP: 0.03,
  /** chance of VF per injection when contrast cannot clear an aorto-ostial stenosis of at least `ostialHoldUpStenosis` (0..1) with the guide engaged */
  ostialHoldUpVfP: 0.04,
  ostialHoldUpStenosis: 0.5,
} as const;

/** What the engine needs to take a new coronary network. */
export interface EngineCoronaryPort {
  setCoronaryTree(tree: CoronaryTree | null, lesions?: Lesion[], opts?: { keepOcclusions?: boolean }): void;
}

/** The engine's lesions for the lumen now: the case's lesions with the target as treated, and the closures the complications add. */
export function engineLesionsFor(caseLesions: readonly Lesion[], s: PciScenario, g: PciGeom, st: PciState): Lesion[] {
  // the pseudolesions and spasm are drawn, not given to the engine's network (flowNarrowings)
  const lumen = lumenWith(s, g, st, { drawn: false }).lesions;
  const [target, ...extra] = lumen;
  const isTarget = (l: Lesion) => l.vessel === s.target.vessel && Math.abs(l.position - s.target.position) < 1e-6;
  const out = caseLesions.map((l) => (isTarget(l) ? { ...l, severity: target.severity } : { ...l }));
  if (!caseLesions.some(isTarget)) out.unshift({ ...target });
  return [...out, ...extra.map((l) => ({ ...l }))];
}

/** A fingerprint of the engine's lesions (the sync's change detection). */
export function engineLesionKey(ls: readonly Lesion[]): string {
  return ls.map((l) => `${l.vessel}:${l.position.toFixed(3)}:${Math.round(l.severity)}:${l.kind}:${l.lengthMm ?? 0}`).join("|");
}

/** The sync's memory: the network the engine has, a candidate waiting to settle, and the target's severity the engine has. */
export interface CoronarySync {
  key: string;
  pending: string | null;
  since: number;
  targetSeverity: number;
}

/**
 * The sync's start: the network the engine actually has (its own lesions: the case's, or a handed-over engine's),
 * so a start whose lumen already differs from them (a predilated start, lumen extras) is pushed once it has
 * settled. `targetSeverity` is the target's severity the lab starts from: a start that is already open is not a
 * reperfusion by the lab.
 */
export function newCoronarySync(engineLesions: readonly Lesion[], targetSeverity: number): CoronarySync {
  return { key: engineLesionKey(engineLesions), pending: null, since: 0, targetSeverity };
}

/** A balloon or stent balloon is inflated now (the network waits for the deflation). */
function inflatedNow(st: PciState): boolean {
  const dev = st.device;
  return !!dev && (dev.inflated || occluding(st.ind));
}

/**
 * Push the treated lumen into the engine (debounced): once a deployment or a dilatation has changed the lumen
 * and the device is deflated, and the lumen has stayed the same for MP_PATIENT_COUPLING.treeSettleS, the engine
 * takes the drawn tree with the case's lesions as treated (setCoronaryTree), so the territory's supply follows
 * the vessel actually treated. `reperfused` says that the target went from occlusive to open with this change.
 */
export function syncEngineCoronary(
  eng: EngineCoronaryPort,
  mem: CoronarySync,
  caseLesions: readonly Lesion[],
  s: PciScenario,
  g: PciGeom,
  st: PciState,
  tree: CoronaryTree,
  now: number
): { mem: CoronarySync; applied: boolean; reperfused: boolean } {
  const ls = engineLesionsFor(caseLesions, s, g, st);
  const key = engineLesionKey(ls);
  if (key === mem.key) return { mem: mem.pending ? { ...mem, pending: null } : mem, applied: false, reperfused: false };
  if (inflatedNow(st)) return { mem: { ...mem, pending: null }, applied: false, reperfused: false };
  if (mem.pending !== key) return { mem: { ...mem, pending: key, since: now }, applied: false, reperfused: false };
  if (now - mem.since < MP_PATIENT_COUPLING.treeSettleS - 1e-9) return { mem, applied: false, reperfused: false };
  // the rebuilt network keeps the occlusions others set (the bridge re-applies its own 'pci:' ones each tick)
  eng.setCoronaryTree(tree, ls, { keepOcclusions: true });
  const P = MP_PATIENT_COUPLING;
  const reperfused = mem.targetSeverity >= P.reperfusionFromPct && st.severity <= P.reperfusedPct;
  return { mem: { key, pending: null, since: now, targetSeverity: st.severity }, applied: true, reperfused };
}

/** The guide pressure trace classes (the engine's tip state) an injection should not go through. */
const DAMPED_TIPS = new Set(["damped", "ventricularised", "wedged"]);

/**
 * The VF hazard of one guide injection (MP_PATIENT_COUPLING): through a damped or wedged left guide (the engine
 * draws the right side's damped trace and any wedge per mL itself), or with contrast held up at an aorto-ostial
 * stenosis. Returns the reason when VF follows, else null. `draw` is the lab's seeded generator (0..1).
 */
export function injectionVfHazard(o: { side: "left" | "right"; tipState: string; engaged: boolean; ostialStenosis: number }, draw: () => number): string | null {
  const P = MP_PATIENT_COUPLING;
  if (!o.engaged) return null;
  if (o.side === "left" && DAMPED_TIPS.has(o.tipState) && o.tipState !== "wedged" && draw() < P.dampedLeftInjectionVfP) return "injection through a damped guide";
  if (o.ostialStenosis >= P.ostialHoldUpStenosis && draw() < P.ostialHoldUpVfP) return "contrast held up at an ostial lesion";
  return null;
}
