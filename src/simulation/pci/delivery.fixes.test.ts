// pci-device-delivery, after the in-app verification: a stalled bite backs the guide out progressively (the
// stored-slack bound in guide.ts deliver), a guide extension stops at a crimped stent's proximal edge, the nodal
// branches are not offered as anchors, and the stuck-stent start's log gives the guide's final position.
//   npx vitest run src/simulation/pci/delivery.fixes.test.ts
import { describe, expect, it } from "vitest";
import {
  advanceDevice,
  applyStartSetup,
  backloadDevice,
  checkLabel,
  moveExtension,
  pinWire,
  prepareDevice,
  requestDevice,
  setExtensionRod,
  setValve,
  startPci,
  takeExtension,
  type PciState,
} from "../angioPci";
import { setup } from "./testSetup";
import { pciScenarioDef, startOf } from "./scenarios/registry";
import { MP_DISENGAGE_MM, MP_SHAFT_SLACK_MM } from "./guide";
import { MP_EXT_MARGIN_MM, NODAL_BRANCH, anchorBranches, guideLengthMm } from "./actions/devices";
import { branchesOf } from "./geometry";
import { deliveryOf } from "./state";
import type { PciScenarioDef } from "./scenarios/types";

const STUCK = "rca-stuck-stent";
const UNX = "rca-calcified-uncrossable";

function at(id: string, startId: string, guide?: string) {
  const def = pciScenarioDef(id)!;
  const su = setup(id, guide ? { guide } : undefined);
  const d: PciScenarioDef = guide ? { ...def, setup: { ...def.setup, guideDefault: guide } } : def;
  const start = startOf(d, startId)!;
  const st = applyStartSetup(su.s, su.g, startPci({ def: d, scenario: su.s }, su.g, startId), start);
  return { su, st };
}

const ready = (st0: PciState, specId: string, diameter: number, lengthMm: number): PciState =>
  setValve(backloadDevice(prepareDevice(checkLabel(requestDevice(st0, specId, diameter, lengthMm)))), true);

const distalOf = (st: PciState) => st.device!.centreMm + st.device!.lengthMm / 2;

const HAND = { byHand: true } as const;

describe("a stalled bite by hand backs the guide out progressively (pci-device-delivery)", () => {
  it("each 1 mm bite at the lesion edge backs the guide out by at most the untaken travel plus the slack, so it backs out over several bites before leaving the ostium", () => {
    // the uncrossable calcified lesion: a 2.0 mm balloon through the Judkins right meets a step in the lesion load
    const { su, st: st0 } = at(UNX, "wire-across");
    let st = advanceDevice(su.s, su.g, ready(pinWire(st0, true), "sc", 2.0, 15), 1);
    expect(st.guide.depthMm).toBeGreaterThanOrEqual(0);
    let bounded = 0;
    let engagedBackouts = 0;
    for (let i = 0; i < 400 && st.guide.engaged; i++) {
      const pre = st;
      st = advanceDevice(su.s, su.g, pre, 1, HAND);
      const back = pre.guide.depthMm - st.guide.depthMm;
      expect(back).toBeLessThanOrEqual(1 + MP_SHAFT_SLACK_MM + 1e-9);
      if (back > 0.3 && st.guide.engaged) engagedBackouts++;
      // the same bite in a headless script (no hands) keeps the engine's unbounded back-out
      const scripted = advanceDevice(su.s, su.g, pre, 1);
      if (pre.guide.depthMm - scripted.guide.depthMm > back + 1e-6) bounded++;
    }
    console.info(`by hand: ${st.counters.guideBackouts} back-outs, ${engagedBackouts} with the guide still in the ostium; the bound held back ${bounded} bites`);
    expect(st.guide.engaged).toBe(false);
    expect(bounded).toBeGreaterThan(0);
    // the guide was seen to back out, still engaged, before it left the ostium
    expect(engagedBackouts).toBeGreaterThanOrEqual(1);
    expect(st.guide.depthMm).toBeLessThan(MP_DISENGAGE_MM);
  });

  it("a long stalled push by hand still backs the guide out by up to 8 mm in one go", () => {
    const { su, st: st0 } = at(STUCK, "wire-across", "JR4");
    let st = advanceDevice(su.s, su.g, ready(pinWire(st0, true), "des", 3.0, 22), 1);
    for (let i = 0; i < 300 && st.counters.guideBackouts === 0; i++) {
      const before = st;
      st = advanceDevice(su.s, su.g, st, 1, HAND);
      if (st.counters.guideBackouts > 0) st = advanceDevice(su.s, su.g, before, 12, HAND);
    }
    expect(st.guide.engaged).toBe(false);
  });
});

describe("a guide extension over a crimped stent (pci-device-delivery)", () => {
  function withExtensionAtTip(su: ReturnType<typeof setup>, st0: PciState): PciState {
    const st = setExtensionRod(takeExtension(setValve(st0, true), { french: 6, cylinderCm: 25 }), true);
    return moveExtension(su.s, su.g, st, guideLengthMm(st.guide));
  }

  it("stops at the stent's proximal edge and records the block; over a balloon it goes on to near the balloon's tip", () => {
    const { su, st: st0 } = at(UNX, "wire-across");
    const base = withExtensionAtTip(su, pinWire(st0, true));
    expect(base.guide.ext!.tipMm).toBeCloseTo(0, 6);
    // a 3.0 x 22 mm stent out to 40 mm (its proximal edge at 18 mm)
    let st = advanceDevice(su.s, su.g, ready(base, "des", 3.0, 22), 1);
    st = advanceDevice(su.s, su.g, st, 40 - distalOf(st));
    expect(distalOf(st)).toBeCloseTo(40, 6);
    const prox = distalOf(st) - 22;
    for (let i = 0; i < 40; i++) st = moveExtension(su.s, su.g, st, 1);
    expect(st.guide.ext!.tipMm).toBeLessThanOrEqual(prox - MP_EXT_MARGIN_MM + 1e-6);
    expect(deliveryOf(st).extensionBlocked).toBeGreaterThanOrEqual(1);
    expect(st.events.some((e) => /stent's proximal edge/.test(e.text))).toBe(true);
    // a 2.0 x 15 mm balloon out to 40 mm: the extension rides over it to 2 mm short of its tip
    let b = advanceDevice(su.s, su.g, ready(base, "sc", 2.0, 15), 1);
    b = advanceDevice(su.s, su.g, b, 40 - distalOf(b));
    for (let i = 0; i < 40; i++) b = moveExtension(su.s, su.g, b, 1);
    expect(b.guide.ext!.tipMm).toBeGreaterThan(prox);
    expect(b.guide.ext!.tipMm).toBeLessThanOrEqual(40 - MP_EXT_MARGIN_MM + 1e-6);
  });
});

describe("anchor branches and the start's log (pci-device-delivery)", () => {
  it("leaves the nodal branches out of the anchor list", () => {
    const { su } = at(STUCK, "wire-across");
    const list = anchorBranches(su.g);
    expect(list.length).toBeGreaterThan(0);
    expect(list.some((b) => NODAL_BRANCH.test(b.branch))).toBe(false);
    // every other proximal, non-terminal branch is still offered
    const raw = branchesOf(su.g, su.g.lesion.vessel).filter((b) => !b.terminal && b.atMm < su.g.lesion.startMm);
    expect(list.length).toBe(raw.filter((b) => !NODAL_BRANCH.test(b.c.name)).length);
    expect(NODAL_BRANCH.test("SAN")).toBe(true);
    expect(NODAL_BRANCH.test("AVN")).toBe(true);
    expect(NODAL_BRANCH.test("CONUS")).toBe(false);
  });

  it("the stuck-stent start's log gives the guide where the setup leaves it, not the scripted push's back-out", () => {
    const { st } = at(STUCK, "stent-stuck-bend2");
    expect(st.guide.depthMm).toBeCloseTo(-1.5, 6);
    const texts = st.events.map((e) => e.text);
    expect(texts.some((t) => /pushed back out of the ostium \(/.test(t))).toBe(false);
    expect(texts.some((t) => /1\.5 mm back from the ostium/.test(t))).toBe(true);
  });
});
