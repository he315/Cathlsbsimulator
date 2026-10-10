// pci-guide-engagement: the guide's mechanics in the PCI lab. With no physics implementation the analytic
// fallback (the diagnostic lab's difficulty-independent engagement model) engages a Judkins left 4 and an
// extra-backup 3.5 guide in the PCI anatomy within 30 s of scripted hand commands, through the input target
// with no console open; with a fixture implementation registered, the 'catheter' commands reach it, its
// start-up bench switches the rod guide on and its reading drives the guide; a slow implementation fails
// the bench and the analytic model stays.
//   npx vitest run src/ui/pci/useGuidePhysics.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { PciLabSession } from "./PciLabSession";
import { PciInputTarget } from "./pciInputTarget";
import { createInputSystem } from "../../input/system";
import { defaultSettings, pciGripOrder, pciSettings } from "../../input/settings";
import { useSeriesStore } from "../../state/useSeriesStore";
import { selectGuide } from "../../simulation/pci/actions/guide";
import { guideShapeId } from "../../simulation/pci/guide";
import { PCI_INPUT_BINDINGS, bindingFor } from "./inputBindings";
import { physicsDevices as FIXTURE, type FixturePhysics } from "../physics/__fixtures__/impl/fixture";
import type { PhysicsDevicesImpl } from "../physics/types";
import { PCI_ROD_GUIDE_BENCH, applyGuideAction, guideEngagementFor, guideFromReading, pciRodGuide } from "./useGuidePhysics";

const sessions: PciLabSession[] = [];
const targets: PciInputTarget[] = [];
afterEach(() => {
  for (const t of targets.splice(0)) t.dispose();
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

function rig(scenarioId = "lad-focal") {
  const x = new PciLabSession({ scenarioId, team: false, headlessFrames: true });
  sessions.push(x);
  const sys = createInputSystem({ storage: null, settings: pciSettings(defaultSettings()), gripOrder: pciGripOrder(null), initialGrip: "catheter", getPads: () => [] });
  const t = new PciInputTarget(x, sys);
  targets.push(t);
  return { x, t };
}

function run(x: PciLabSession, seconds: number, dt = 0.1) {
  for (let s = 0; s < seconds - 1e-9; s += dt) x.step(dt);
}

/** The scripted hands: a 1 mm push on the guide every half second until it engages or 30 s pass. Returns the lab seconds taken. */
function engageByHand(x: PciLabSession, t: PciInputTarget): number {
  const t0 = x.wall();
  while (!x.st.guide.engaged && x.wall() - t0 < 30) {
    expect(t.perform("catheter", "advance", 1)).toBe(true);
    run(x, 0.5);
  }
  return x.wall() - t0;
}

describe("the guide's analytic engagement in the PCI lab (pci-guide-engagement)", () => {
  it("the binding file declares the guide's advance, withdraw and torque", () => {
    for (const a of ["advance", "withdraw", "torque"] as const) expect(bindingFor(PCI_INPUT_BINDINGS, "catheter", a)?.file).toBe("./guide.ts");
  });

  it("with no physics implementation, the hands engage a Judkins left 4 (JL4G) and an extra-backup 3.5 from the aortic root within 30 s", () => {
    for (const id of ["JL4", "EBU3.5"]) {
      const { x, t } = rig();
      expect(x.startDef.id).toBe("guide-in-root");
      expect(x.st.guide.engaged).toBe(false);
      expect(applyGuideAction(x, (st) => selectGuide(st, id))).toBe(true);
      expect(x.st.guide.id).toBe(id);
      const eng = guideEngagementFor(x);
      expect(eng.mode).toBe("analytic");
      expect(eng.physics).toBeNull();
      const took = engageByHand(x, t);
      expect(x.st.guide.engaged, `${id} engaged`).toBe(true);
      expect(took).toBeLessThanOrEqual(30);
      expect(x.st.guide.depthMm).toBeGreaterThanOrEqual(0);
      expect(x.openConsoleId()).toBeNull();
      expect(guideShapeId(id)).toBe(id === "JL4" ? "JL4G" : "EBU3.5");
    }
  });

  it("the guide starts in the root, and engaging it by hand changes the pressure trace the patient engine shows", () => {
    const { x, t } = rig("lad-focal");
    run(x, 2);
    expect(x.engine.vitals().tipState).toBe("aortic");
    engageByHand(x, t);
    expect(x.st.guide.engaged).toBe(true);
    // deep-seated by hand: the guide fills the left main and the trace damps
    for (let i = 0; i < 12 && x.st.guide.depthMm < 6.5; i++) t.perform("catheter", "advance", 1);
    run(x, 3);
    expect(["damped", "ventricularised", "wedged"]).toContain(x.engine.vitals().tipState);
    // drawn back out of the ostium: aortic again
    for (let i = 0; i < 20 && x.st.guide.engaged; i++) t.perform("catheter", "withdraw", 1);
    run(x, 3);
    expect(x.st.guide.engaged).toBe(false);
    expect(x.engine.vitals().tipState).toBe("aortic");
  });

  it("the attending's safety stop applies to the guide's hand actions", () => {
    const { x, t } = rig();
    x.beforeAction = (a) => a !== "engage-guide";
    const before = x.st.guide;
    // the binding's action is stopped; the target's built-in route (engageGuide) is stopped by the same rule
    for (let i = 0; i < 20; i++) t.perform("catheter", "advance", 1);
    expect(x.st.guide).toBe(before);
    expect(guideEngagementFor(x).command({ mm: 1 })).toBe(false);
  });
});

describe("the guide's physics through the PhysicsDevices interface (pci-guide-engagement)", () => {
  it("with a fixture implementation, the 'catheter' commands reach it; its bench switches the rod guide on and its reading engages the guide", () => {
    const { x, t } = rig();
    const eng = guideEngagementFor(x, { impl: FIXTURE, useWorker: false });
    expect(eng.mode).toBe("bench");
    const phys = eng.physics as FixturePhysics;
    expect(phys.scene?.model).toBe(x.model);
    expect(phys.loaded).toEqual({ device: "guide", id: guideShapeId(x.st.guide.id) });
    // during the bench the analytic model still drives the state; the commands reach the physics too
    expect(t.perform("catheter", "advance", 2)).toBe(true);
    expect(t.perform("catheter", "torque", 0.3)).toBe(true);
    expect(phys.commands).toEqual([
      { kind: "push", device: "catheter", mm: 2 },
      { kind: "torque", device: "catheter", rad: 0.3 },
    ]);
    run(x, PCI_ROD_GUIDE_BENCH.seconds + 0.5);
    expect(eng.bench).not.toBeNull();
    expect(eng.bench!.medianMs).toBeLessThan(PCI_ROD_GUIDE_BENCH.maxMedianMs);
    expect(eng.mode).toBe("rod");
    expect(pciRodGuide(FIXTURE, eng.bench)).toBe(true);
    // the fixture reports the guide in the left main 2 mm deep: the guide is engaged from the reading
    run(x, 0.3);
    expect(x.st.guide.engaged).toBe(true);
    expect(x.st.guide.depthMm).toBeCloseTo(2, 6);
    expect(x.st.guide.openFraction).toBe(1);
    // in rod mode a push goes only to the physics
    const n = phys.commands.length;
    t.perform("catheter", "advance", 1);
    expect(phys.commands.length).toBe(n + 1);
    run(x, 0.3);
    expect(x.st.guide.depthMm).toBeCloseTo(3, 6);
    // in rod mode the shaft still stores twist: the hub read-out winds up and the guide kinks
    for (let i = 0; i < 40 && !x.st.guide.kinked; i++) expect(t.perform("catheter", "torque", Math.PI)).toBe(true);
    expect(eng.mode).toBe("rod");
    expect(Math.abs(x.st.guide.twistRad ?? 0)).toBeGreaterThan(Math.PI / 2);
    expect(x.st.guide.kinked).toBe(true);
    expect(x.st.log.some((r) => r.kind === "guide-kink")).toBe(true);
  });

  it("an implementation over the step-cost rule fails the bench: the analytic model stays and says why", () => {
    const slow: PhysicsDevicesImpl = {
      id: "slow",
      label: "Slow mechanics",
      create: (o) => {
        const p = FIXTURE.create(o);
        const latest = p.latest.bind(p);
        p.latest = () => {
          const r = latest();
          return r ? { ...r, costMs: 12 } : r;
        };
        return p;
      },
    };
    const { x, t } = rig();
    const eng = guideEngagementFor(x, { impl: slow, useWorker: false });
    t.perform("catheter", "advance", 1);
    run(x, PCI_ROD_GUIDE_BENCH.seconds + 0.5);
    expect(eng.mode).toBe("analytic");
    expect(eng.physics).toBeNull();
    expect(eng.reason).toMatch(/bench/);
    expect(pciRodGuide(slow, eng.bench)).toBe(false);
    expect(pciRodGuide(null, { medianMs: 1, frames: 10 })).toBe(false);
    // the hands still move the guide
    engageByHand(x, t);
    expect(x.st.guide.engaged).toBe(true);
  });

  it("a reading maps to the guide's state: the conus, the ventricle, the other coronary", () => {
    const { x } = rig();
    const base = { t: 1, vessel: null, side: null, depthMm: -5, coaxiality: 0, wallForce: 0, openFraction: 1, prolapsed: false, conus: false, costMs: 0.1 } as const;
    expect(guideFromReading(x.st.guide, "left", { ...base, kind: "in-lv" }, 3).zone).toBe("lv");
    expect(guideFromReading(x.st.guide, "right", { ...base, kind: "selective-rca", vessel: "RCA", side: "right", conus: true }, 3).zone).toBe("conus");
    expect(guideFromReading(x.st.guide, "left", { ...base, kind: "selective-rca", vessel: "RCA", side: "right", depthMm: 1 }, 3)).toMatchObject({ engaged: false, zone: "other-side" });
    const near = guideFromReading(x.st.guide, "left", { ...base, kind: "near-lm", side: "left" }, 3);
    expect(near).toMatchObject({ engaged: false, zone: "near", nearSince: 3 });
    const sel = guideFromReading(x.st.guide, "left", { ...base, kind: "selective-lm", vessel: "LM", side: "left", depthMm: 1.5, coaxiality: 0.9, openFraction: 0.4 }, 4);
    expect(sel).toMatchObject({ engaged: true, depthMm: 1.5, openFraction: 0.4 });
  });
});
