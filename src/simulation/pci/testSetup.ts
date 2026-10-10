// Shared set-up for the PCI engine tests: a scenario's anatomy, trees and geometry, and an operator that
// steers the wire to the lesion by looking at the tip (as under fluoroscopy) and turning the torque device.
import { buildAnatomy } from "../anatomy";
import { buildCoronaryTree } from "../../render/xray/coronaryTree";
import { SCENARIO_BY_ID, initialPci, moveWire, pathToTarget, scenarioCase, torqueWire, type InitOptions, type PciScenario, type PciState } from "../angioPci";
import { pciGeom, takeOff, wrap, type PciGeom } from "./geometry";

export interface Setup {
  s: PciScenario;
  g: PciGeom;
  tree: ReturnType<typeof buildCoronaryTree>;
  refTree: ReturnType<typeof buildCoronaryTree>;
  model: ReturnType<typeof buildAnatomy>;
}

const cache = new Map<string, Setup>();

export function setup(id: string, override?: Partial<PciScenario>): Setup {
  const key = id + JSON.stringify(override ?? {});
  const hit = cache.get(key);
  if (hit) return hit;
  const s = { ...SCENARIO_BY_ID[id], ...(override ?? {}) } as PciScenario;
  const c = scenarioCase(s);
  const model = buildAnatomy(c);
  const tree = buildCoronaryTree(model, c);
  const refTree = buildCoronaryTree(model, { ...c, lesions: [] });
  const out = { s, g: pciGeom(s, tree, refTree), tree, refTree, model };
  cache.set(key, out);
  return out;
}

/** Turn the torque device until the tip azimuth is within `tol` of `target` (as an operator watching the tip). */
export function turnTipTo(st0: PciState, target: number, tol = 0.12): PciState {
  let st = st0;
  for (let i = 0; i < 80; i++) {
    const e = wrap(target - st.wire.tip);
    if (Math.abs(e) < tol) break;
    st = torqueWire(st, Math.sign(e) * Math.min(0.35, Math.abs(e) + 0.05));
  }
  return st;
}

/**
 * Steer the wire to the lesion and `beyondMm` past it: at each branch on the path face the take-off,
 * on the target vessel face away from side branches ahead. Withdraws from wrong branches. Returns the state.
 */
export function wireToTarget(su: Setup, st0: PciState, beyondMm = 35, step = 2): PciState {
  const { s, g } = su;
  let st = st0;
  const path = pathToTarget(g, s);
  for (let guard = 0; guard < 600; guard++) {
    const cur = st.route[st.route.length - 1];
    const k = path.indexOf(cur);
    if (k < 0 || st.wire.fold) {
      st = moveWire(s, g, st, -6);
      continue;
    }
    const next = path[k + 1];
    if (next) {
      const child = g.byName.get(next)!;
      st = turnTipTo(st, takeOff(g, child).azimuth);
    } else {
      const v = g.byName.get(cur)!;
      const ahead = (g.children.get(cur) ?? []).filter((c) => c.parent!.index < v.samples.length - 2 && v.pathMm[c.parent!.index] > st.tipMm).sort((a, b) => a.parent!.index - b.parent!.index)[0];
      if (ahead) st = turnTipTo(st, takeOff(g, ahead).azimuth + Math.PI);
    }
    if (cur === g.lesion.vessel && st.tipMm >= g.lesion.endMm + beyondMm) break;
    const before = st.tipMm;
    st = moveWire(s, g, st, step);
    if (st.tipMm <= before + 1e-6 && !st.wire.fold && st.route[st.route.length - 1] === cur) break;
  }
  return st;
}

export function start(su: Setup, opts: InitOptions = {}): PciState {
  return initialPci(su.s, opts);
}
