// ---------------------------------------------------------------------------
// Torque loss and catheter kinking in the rod model (diag-catheter-kink).
//   npx vitest run src/physics/kink.test.ts
//
// The manoeuvre suite's procedures in normal anatomy never kink; three one-way turns in the
// tortuous-iliac geometry without a wire kink in most starts, fewer with a 0.035 in wire inside or a
// 45 cm sheath; a latched kink damps the trace and travels with the material; the recovery steps undo
// it by the rules of the model; the kink is snapshotted. The model is opt-in (KinkSetup.model): an
// engine that never turns it on brakes nothing and never kinks. Every threshold is a MODEL PARAMETER of
// src/physics/engine.ts (docs/realism/facts/pkg-diag-catheter-kink.md).
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import * as S from "./scenarios";
import * as M from "./manoeuvres";
import { DEFAULT_SHEATH_MM, MP_KINK_PRESSURISE_MAX, MP_KINK_UNTWIST_MAX, MP_KINK_WIRE_PASS_MAX, MP_KINK_WIRE_SEVERITY_MAX, type PhysicsEngine } from "./engine";
import { LumenSet, Region, TORTUOUS_REGIONS } from "./lumen";
import { legacyView, withKinkFold } from "./legacyBridge";
import { fixtureAnatomy, fixtureCourse } from "./fixtures";
import { buildAnatomy } from "../simulation/anatomy";
import { classifyTip, tipFromPhysics, TipChamber, type TipInput } from "../simulation/patient/transducer";
import { physicsCatheterId } from "../ui/physics/physicsDevices";
import type { AnatomyVariant } from "../types";

const T = 120_000;
const STARTS = M.STARTS; // 50, 60, 70, 80, 90 mm back from the root top

const kinkOf = (e: PhysicsEngine) => e.readDevice(e.catheter!).kink ?? null;
/** The kink model on (the diagnostic lab's set-up). */
const modelOn = <E extends PhysicsEngine | null>(e: E): E => {
  e?.setKinkSetup({ model: true });
  return e;
};
const historyOf = (e: PhysicsEngine) => e.readDevice(e.catheter!).kinkHistory!;

/** Three one-way turns at the hub (6π rad) over 6 s, in 0.1 s steps, then 1 s still. */
function threeTurns(e: PhysicsEngine, sign = 1) {
  for (let i = 0; i < 60; i++) {
    e.command({ kind: "torque", device: "catheter", rad: (sign * 6 * Math.PI) / 60 });
    e.step(0.1);
  }
  e.step(1);
}

/**
 * A catheter over the J wire to the root on the live geometry with these variants; wire: "out"
 * (removed), "inside" (withdrawn into the shaft); the kink model on unless model is false.
 */
function inRoot(variants: AnatomyVariant[], back: number, o: { cath?: string; wire?: "out" | "inside"; sheathMm?: number; route?: "femoral" | "radial-right" | "radial-left"; model?: boolean } = {}): PhysicsEngine | null {
  const route = o.route ?? "femoral";
  const e = S.makeEngine(route, "normal", {}, variants, true);
  if (o.model ?? true) e.setKinkSetup({ model: true });
  if (o.sheathMm) e.setKinkSetup({ sheathMm: o.sheathMm });
  S.parkOverWire(e, o.cath ?? "JR4", { tipBack: back, facing: S.LAO_LEFT });
  if (!(route === "femoral" ? S.advanceToRoot(e) : S.advanceToRoot(e, 24, 4, 80))) return null;
  S.withdrawWire(e);
  if ((o.wire ?? "out") === "out") {
    e.removeWire();
    e.step(0.5);
  }
  return e;
}

/** How many of the starts latch a kink with three one-way turns. */
function kinkCount(variants: AnatomyVariant[], o: Parameters<typeof inRoot>[2] = {}): { reached: number; kinked: number; severities: number[] } {
  let reached = 0, kinked = 0;
  const severities: number[] = [];
  for (const back of STARTS) {
    const e = inRoot(variants, back, o);
    if (!e) continue;
    reached++;
    threeTurns(e);
    if (historyOf(e).latched > 0) kinked++;
    const k = kinkOf(e);
    if (k) severities.push(k.severity);
  }
  return { reached, kinked, severities };
}

describe("normal anatomy never kinks", () => {
  it("20 manoeuvre-suite runs in normal anatomy (frozen fixture: JL4 Judkins left, JR4 clockwise, JR4 anticlockwise and the over-torque, 5 starts each) produce zero kinks", () => {
    let runs = 0;
    const kinked: string[] = [];
    const check = (e: PhysicsEngine, what: string) => {
      runs++;
      const h = historyOf(e);
      if (h.latched > 0 || kinkOf(e)) kinked.push(what);
    };
    for (const back of STARTS) {
      const jl = modelOn(M.femoralInRoot("JL4", back));
      if (jl) {
        M.judkinsLeftTechnique(jl);
        check(jl, `JL4 ${back}`);
      }
      for (const torque of [0.15, -0.15]) {
        const jr = modelOn(M.femoralInRoot("JR4", back));
        if (!jr) continue;
        M.jr4Technique(jr, torque);
        check(jr, `JR4 ${torque} ${back}`);
      }
      // the suite's over-torque (manoeuvres.ts overTorque), run to the end: 160 turns of 0.06 rad loaded in the sinus
      const ot = modelOn(M.femoralInRoot("JR4", back));
      if (ot) {
        S.moveTipToHeight(ot, 12, -1.5, 40);
        ot.command({ kind: "push", device: "catheter", mm: M.protocol.whipLoad });
        ot.step(0.3);
        for (let i = 0; i < 160; i++) {
          ot.command({ kind: "torque", device: "catheter", rad: 0.06 });
          ot.step(0.05);
        }
        check(ot, `over-torque ${back}`);
      }
    }
    expect(runs).toBe(20);
    expect(kinked).toEqual([]);
  }, T);

  it("three one-way turns in the live normal femoral and radial anatomy store no twist in a tortuous segment and never kink", () => {
    for (const back of [50, 70, 90]) {
      const f = inRoot([], back)!;
      threeTurns(f);
      expect(historyOf(f).latched).toBe(0);
      expect(f.readDevice(f.catheter!).storedTwist).toBe(0);
    }
    for (const back of [40, 70]) {
      const r = inRoot([], back, { cath: "TIG", route: "radial-right" });
      if (!r) continue;
      threeTurns(r);
      expect(historyOf(r).latched).toBe(0);
    }
  }, T);
});

describe("tortuous iliac: torque loss and the kink", () => {
  it("in 'tortuous-iliac' three one-way turns without a wire latch a kink in at least 4 of 5 starts; with the wire inside or a 45 cm sheath, fewer", () => {
    const bare = kinkCount(["tortuous-iliac"]);
    const wire = kinkCount(["tortuous-iliac"], { wire: "inside" });
    const sheath = kinkCount(["tortuous-iliac"], { sheathMm: 450 });
    // measured on the development machine (diag-catheter-kink notes): bare, wire inside and 45 cm sheath
    console.info(`kinks in 5 starts: no wire ${bare.kinked}/${bare.reached}, wire inside ${wire.kinked}/${wire.reached}, 45 cm sheath ${sheath.kinked}/${sheath.reached}`);
    expect(bare.reached).toBe(5);
    expect(bare.kinked).toBeGreaterThanOrEqual(4);
    expect(wire.kinked).toBeLessThan(bare.kinked);
    expect(sheath.kinked).toBeLessThan(bare.kinked);
    // a kink over the wire is splinted open: never tighter than MP_KINK_WIRE_SEVERITY_MAX, so untwisting or passing the wire again undoes it
    for (const x of wire.severities) expect(x).toBeLessThanOrEqual(Math.min(MP_KINK_WIRE_SEVERITY_MAX, MP_KINK_UNTWIST_MAX, MP_KINK_WIRE_PASS_MAX) + 1e-9);
  }, T);

  it("the tip stops following the hub (torque loss) and the kink latches in the tortuous segment, at a node of the read-out, and is drawn as a fold", () => {
    const e = inRoot(["tortuous-iliac"], 70)!;
    let tl = false;
    for (let i = 0; i < 60; i++) {
      e.command({ kind: "torque", device: "catheter", rad: Math.PI / 10 });
      e.step(0.1);
      tl ||= !!e.readDevice(e.catheter!).torqueLoss;
    }
    expect(tl).toBe(true);
    const r = e.readDevice(e.catheter!);
    const k = r.kink!;
    expect(k).toBeTruthy();
    expect(TORTUOUS_REGIONS.iliac).toContain(k.region);
    expect(k.node).toBeGreaterThan(0);
    expect(k.node).toBeLessThan(r.count);
    expect(k.severity).toBeGreaterThan(0);
    expect(k.severity).toBeLessThanOrEqual(1);
    const f = { t: e.t, steps: e.steps, catheter: r, wire: e.readWire(), engagement: e.classify(), stepMs: 0, substeps: 0, reactions: [] };
    const v = legacyView(f, e.scene.model)!;
    expect(v.kink).toEqual(k);
    expect(v.controls.resistance).toBe(1);
    expect(v.catheterInBody.length).toBeGreaterThan(r.count - Math.max(0, r.insideFrom - 1));
  }, T);

  it("the kink travels with the material: pulled back it moves along the route, and it catches at the sheath tip until the catheter is cut and covered", () => {
    const e = inRoot(["tortuous-iliac"], 60)!;
    threeTurns(e);
    const k0 = kinkOf(e)!;
    expect(k0).toBeTruthy();
    const c = () => e.catheter!;
    const sKink = (u: number) => c().hubS + c().spec.length - c().rod.len[0] - u;
    const sheathTip = e.lumens.skinS + DEFAULT_SHEATH_MM;
    const s0 = sKink(k0.u);
    // the shaft slides back in stick-slip steps (the fingers slip above the grip force); 12 s of pulling
    let minS = Infinity;
    for (let i = 0; i < 120; i++) {
      e.command({ kind: "push", device: "catheter", mm: -5 });
      e.step(0.1);
      minS = Math.min(minS, sKink(kinkOf(e)!.u));
    }
    const k1 = kinkOf(e)!;
    expect(k1.u).toBe(k0.u); // the same material point
    expect(sKink(k1.u)).toBeLessThan(s0 - 10); // it came back along the route
    expect(minS).toBeGreaterThanOrEqual(sheathTip - 0.5); // and stopped at the sheath tip
    expect(e.kinkRecover("cut-sheath")).toBe("sheathed");
    for (let i = 0; i < 120; i++) {
      e.command({ kind: "push", device: "catheter", mm: -5 });
      e.step(0.1);
    }
    expect(sKink(kinkOf(e)!.u)).toBeLessThan(sheathTip - 5); // covered, it comes into the sheath
  }, T);
});

describe("recovery", () => {
  /** A catheter in the tortuous iliac geometry with a kink of this severity latched in the segment. */
  function withKink(sev: number, wire: "out" | "inside" = "out"): PhysicsEngine {
    const e = inRoot(["tortuous-iliac"], 70, { wire })!;
    const span = e.lumens.access;
    let s0 = -1;
    for (let i = 0; i < span.n; i++) if (span.region[i] === Region.Iliac) s0 = s0 < 0 ? span.cum[i] : s0;
    const tipS = e.catheter!.hubS + e.catheter!.spec.length - e.catheter!.rod.len[0];
    expect(e.latchKinkAt(tipS - (s0 + 20), sev)).toBe(true);
    e.step(0.2);
    return e;
  }
  const turnBack = (e: PhysicsEngine) => {
    // gently back by half a turn (the table-side untwist, KINK_UNTWIST_TURN_RAD)
    for (let i = 0; i < 10; i++) {
      e.command({ kind: "torque", device: "catheter", rad: -Math.PI / 10 });
      e.step(0.1);
    }
    e.step(0.5);
  };

  it("untwisting undoes a mild kink, not a tight one; with the tip snared it undoes a tight one", () => {
    const mild = withKink(MP_KINK_UNTWIST_MAX - 0.1);
    turnBack(mild);
    expect(kinkOf(mild)).toBeNull();
    expect(historyOf(mild).lastResolvedBy).toBe("untwist");
    const tight = withKink(0.85);
    turnBack(tight);
    expect(kinkOf(tight)).not.toBeNull();
    const held = withKink(0.85);
    expect(held.kinkRecover("snare")).toBe("held");
    expect(kinkOf(held)!.held).toBe("snare");
    turnBack(held);
    expect(kinkOf(held)).toBeNull();
  }, T);

  it("a 0.035 in wire passes and straightens a kink up to MP_KINK_WIRE_PASS_MAX; a tighter one stops it short of the kink", () => {
    const pass = (sev: number) => {
      const e = withKink(sev);
      const u = kinkOf(e)!.u;
      e.loadWire("J", { advance: -(u + 40) });
      for (let i = 0; i < 20; i++) {
        e.command({ kind: "push", device: "wire035", mm: 6 });
        e.step(0.1);
      }
      e.step(0.3);
      return { e, u };
    };
    const a = pass(MP_KINK_WIRE_PASS_MAX - 0.15);
    expect(kinkOf(a.e)).toBeNull();
    expect(historyOf(a.e).lastResolvedBy).toBe("wire");
    const b = pass(0.9);
    expect(kinkOf(b.e)).not.toBeNull();
    expect(b.e.wire!.delta).toBeLessThanOrEqual(-b.u);
  }, T);

  it("pressurising the lumen unwinds a kink up to MP_KINK_PRESSURISE_MAX, not a closed one; a cuff holds only a radial kink below the brachial artery", () => {
    const a = withKink(MP_KINK_PRESSURISE_MAX - 0.1);
    expect(a.kinkRecover("pressurise")).toBe("unwound");
    expect(kinkOf(a)).toBeNull();
    const b = withKink(1);
    expect(b.kinkRecover("pressurise")).toBe("unchanged");
    expect(kinkOf(b)).not.toBeNull();
    expect(b.kinkRecover("cuff")).toBe("not-below-brachial");
    // the cuff's outcome depends on the access, never on whether there is a kink
    const plain = inRoot(["tortuous-subclavian"], 60, { cath: "TIG", route: "radial-right" })!;
    expect(kinkOf(plain)).toBeNull();
    expect(plain.kinkRecover("cuff")).toBe("held");
    const plainFemoral = inRoot(["tortuous-iliac"], 70)!;
    expect(kinkOf(plainFemoral)).toBeNull();
    expect(plainFemoral.kinkRecover("cuff")).toBe("not-below-brachial");
    // a kink in the forearm of the right radial route
    const r = inRoot(["tortuous-subclavian"], 60, { cath: "TIG", route: "radial-right" })!;
    const t = r.lumens.access;
    let a0 = -1, a1 = -1;
    for (let i = 0; i < t.n; i++) if (t.region[i] === Region.Radial) (a0 = a0 < 0 ? t.cum[i] : a0), (a1 = t.cum[i]);
    const tipS = r.catheter!.hubS + r.catheter!.spec.length - r.catheter!.rod.len[0];
    r.latchKinkAt(tipS - (a0 + a1) / 2, 0.85);
    r.step(0.2);
    expect(kinkOf(r)!.region).toBe(Region.Radial);
    expect(r.kinkRecover("cuff")).toBe("held");
    expect(kinkOf(r)!.held).toBe("cuff");
  }, T);

  it("kink commands travel through the hands' channel (the worker forwards every command to the engine)", () => {
    const e = withKink(0.5);
    e.command({ kind: "kink-recover", action: "pressurise" });
    expect(kinkOf(e)).toBeNull();
    e.command({ kind: "kink-setup", setup: { sheathMm: 450, undersized: true } });
    expect(e.kinkSetup).toEqual({ sheathMm: 450, undersized: true, model: true });
  }, T);
});

describe("the model is opt-in", () => {
  it("an engine that never turns the model on (the default, as in the PCI lab) brakes nothing and never kinks, even in 'tortuous-iliac'; turning it off takes a kink and the brake out", () => {
    for (const back of [60, 70, 80]) {
      const e = inRoot(["tortuous-iliac"], back, { model: false })!;
      expect(e.kinkSetup.model).toBe(false);
      const ia = Float64Array.from(e.catheter!.rod.ia);
      threeTurns(e);
      const r = e.readDevice(e.catheter!);
      expect(historyOf(e).latched).toBe(0);
      expect(r.kink).toBeNull();
      expect(r.torqueLoss).toBe(false);
      expect(r.storedTwist).toBe(0);
      expect(Array.from(e.catheter!.rod.ia)).toEqual(Array.from(ia));
      expect(e.latchKinkAt(300, 0.8)).toBe(false);
    }
    const on = inRoot(["tortuous-iliac"], 70)!;
    const free = Float64Array.from(inRoot(["tortuous-iliac"], 70, { model: false })!.catheter!.rod.ia);
    expect(on.latchKinkAt(300, 0.8)).toBe(true);
    expect(kinkOf(on)).not.toBeNull();
    on.setKinkSetup({ model: false });
    expect(kinkOf(on)).toBeNull();
    expect(historyOf(on).resolved).toBe(0);
    expect(Array.from(on.catheter!.rod.ia)).toEqual(Array.from(free));
  }, T);
});

describe("snapshots", () => {
  it("a kinked catheter's snapshot restores the kink, its plastic bend and the brake, and replays identically", () => {
    const e = inRoot(["tortuous-iliac"], 80)!;
    threeTurns(e);
    expect(kinkOf(e)).not.toBeNull();
    e.kinkRecover("snare");
    const snap = e.snapshot();
    expect(snap.kinkSetup).toEqual({ sheathMm: DEFAULT_SHEATH_MM, undersized: false, model: true });
    expect(e.readDevice(e.catheter!).kinkSetup).toEqual(snap.kinkSetup);
    const e2 = S.makeEngine("femoral", "normal", {}, ["tortuous-iliac"], true);
    e2.restore(snap);
    expect(kinkOf(e2)).toEqual(kinkOf(e));
    expect(historyOf(e2)).toEqual(historyOf(e));
    e.step(1);
    e2.step(1);
    const a = e.readDevice(e.catheter!).nodes, b = e2.readDevice(e2.catheter!).nodes;
    expect(Array.from(b)).toEqual(Array.from(a));
  }, T);
});

describe("supporting pieces", () => {
  it("routeTortuosity: zero without a variant; the femoral and iliac stretch with tortuous-iliac, the subclavian stretch with tortuous-subclavian", () => {
    const model = fixtureAnatomy("normal");
    const plain = new LumenSet({ route: "femoral", model, aorticCourse: fixtureCourse });
    expect(plain.hasTortuousSegment).toBe(false);
    const il = new LumenSet({ route: "femoral", model, aorticCourse: fixtureCourse, tortuousIliac: true });
    expect(il.hasTortuousSegment).toBe(true);
    const t = il.access;
    for (let i = 0; i < t.n; i++) expect(il.tortuosity[i] > 0).toBe(TORTUOUS_REGIONS.iliac.includes(t.region[i]));
    const sub = new LumenSet({ route: "radial-right", model: buildAnatomy(S.caseFor("radial-right", "normal")), tortuousSubclavian: true });
    expect(sub.hasTortuousSegment).toBe(true);
    expect(new LumenSet({ route: "radial-right", model: buildAnatomy(S.caseFor("radial-right", "normal")) }).hasTortuousSegment).toBe(false);
  });

  it("the trace behind a kink: damped by a partial kink, flat with the lumen closed; no kink leaves the tip chamber as it was", () => {
    const run = (tip: TipInput) => {
      const c = new TipChamber();
      let mx = -Infinity, mn = Infinity, aoMx = -Infinity, aoMn = Infinity;
      for (let i = 0; i < 6000; i++) {
        const t = i * 0.001;
        const phase = (t % 1) / 1;
        const pAo = 100 + 20 * Math.sin(2 * Math.PI * phase);
        const p = c.step(0.001, tip, { pAo, pLv: 10, pRv: 5, phase, rBed: 100, spasm: 0 });
        if (t > 4) {
          mx = Math.max(mx, p);
          mn = Math.min(mn, p);
          aoMx = Math.max(aoMx, pAo);
          aoMn = Math.min(aoMn, pAo);
        }
      }
      return { sys: mx, dia: mn, aoSys: aoMx, aoDia: aoMn };
    };
    const free = run({ location: "aorta" });
    expect(free.sys).toBeCloseTo(free.aoSys, 1);
    expect(classifyTip({ location: "aorta" }, free.sys, free.dia, free.aoSys, free.aoDia)).toBe("aortic");
    const half = run({ location: "aorta", kink: 0.5 });
    expect(half.sys - half.dia).toBeLessThan(0.6 * (half.aoSys - half.aoDia));
    expect(classifyTip({ location: "aorta", kink: 0.5 }, half.sys, half.dia, half.aoSys, half.aoDia)).toBe("damped");
    const closed = run({ location: "aorta", kink: 1 });
    expect(closed.sys - closed.dia).toBeLessThan(1);
    expect(classifyTip({ location: "lv", kink: 1 }, closed.sys, closed.dia, closed.aoSys, closed.aoDia)).toBe("damped");
    // tipFromPhysics carries the kink; a reading without one gives the same keys as before
    const reading = { kind: "ascending-aorta" as const, side: null, vessel: null, depthMm: 0, openFraction: 1, wallForce: 0, conus: false, prolapsed: false };
    expect(tipFromPhysics(reading)).toEqual({ location: "aorta" });
    expect(tipFromPhysics({ ...reading, kink: null })).toEqual({ location: "aorta" });
    expect(tipFromPhysics({ ...reading, kink: { severity: 0.4 } })).toEqual({ location: "aorta", kink: 0.4 });
    expect(tipFromPhysics({ ...reading, kink: { severity: 0.97 } }).kink).toBe(1);
  });

  it("withKinkFold inserts a short hairpin at the kink's node; physicsCatheterId maps a side-hole variant to its base", () => {
    const pts = [0, 1, 2, 3, 4].map((i) => ({ x: 0, y: -30 * i, z: 0 }));
    const f = withKinkFold(pts, 2, 1);
    expect(f.length).toBe(pts.length + 3);
    expect(f[0]).toEqual(pts[0]);
    expect(f[f.length - 1]).toEqual(pts[4]);
    expect(withKinkFold(pts, 0, 1)).toBe(pts);
    expect(physicsCatheterId("JR4-SH")).toBe("JR4");
    expect(physicsCatheterId("JR4")).toBe("JR4");
    expect(physicsCatheterId("PIG")).toBe("PIG");
  });
});
