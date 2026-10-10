// access-cx-endovascular-control: the session module in the full case (modules/endovascular.ts) on its scenarios
// (scenarios/endovascular.ts): the crossover from the other groin, balloon occlusion before any device, the device
// for the vessel and the segment, and the cold leg by cause.
//   npx vitest run src/simulation/session/modules/endovascular.module.test.ts
import { describe, expect, it } from "vitest";
import { newCaseSession, type CaseSession } from "../caseSession";
import { crossover } from "../autopilot";
import { MP_ENDO } from "../../access/endovascular";
import { endovascularOf, type EndovascularModule } from "./endovascular";
import { siteBranchTubes } from "../../access/route";
import { toWorld } from "../../anatomy";

const open = (id: string) => {
  const { session: s } = newCaseSession({ scenario: id });
  return { s, m: endovascularOf(s)! };
};

function run(s: CaseSession, sec: number): void {
  s.wait(sec);
  s.runPending();
}

function untilOnset(s: CaseSession, m: EndovascularModule, maxS = 240): void {
  for (let t = 0; t <= maxS && !m.state.bleed && !m.state.leg; t += 5) run(s, 5);
  expect(!!m.state.bleed || !!m.state.leg, "the episode presented").toBe(true);
}

const decision = (s: CaseSession, id: string) => s.decisions().find((d) => d.id === id);

/** Open the other groin (the autopilot's crossover puncture) and bring the crossover catheter in. */
function otherGroin(s: CaseSession, m: EndovascularModule, wire: "j" | "hydrophilic" = "j"): void {
  crossover(s, "left");
  s.runPending();
  const r = m.actions.startCrossover(wire);
  expect(r.ok, r.text).toBe(true);
}

/** Lead over the bifurcation with the wire, aimed from the hooked catheter, to `toS`, and bring the catheter over. */
function crossTo(m: EndovascularModule, toS: number): void {
  const c = m.state.cross!;
  const j = c.route.junction!;
  for (let i = 0; i < 4000 && c.wire.pos < j.atS - 4; i++) {
    m.actions.crossWire(1, 0);
    m.actions.crossCatheter(1);
  }
  for (let i = 0; i < 200; i++) m.actions.crossCatheter(1);
  for (let i = 0; i < 600 && Math.abs(m.state.cross!.wire.heading - j.targetHeading) > 0.05; i++) {
    const d = j.targetHeading - m.state.cross!.wire.cmdHeading;
    m.actions.crossWire(0, Math.sign(d) * Math.min(0.03, Math.abs(d)));
  }
  for (let i = 0; i < 6000 && m.state.cross!.wire.pos < toS; i++) m.actions.crossWire(1, 0);
  expect(m.state.cross!.wire.branch).toBe("main");
  expect(m.state.cross!.wire.pos).toBeGreaterThanOrEqual(toS - 1);
  for (let i = 0; i < 4000 && m.state.cross!.catheterPos < c.route3d.bifurcationS + 20; i++) m.actions.crossCatheter(1);
}

/** Cross, image, and put the balloon up at low pressure over the hole. */
function balloonOnHole(s: CaseSession, m: EndovascularModule): number {
  otherGroin(s, m);
  // the hole's position along the crossover (the test's view of the geometry; the learner reads it off the image)
  const hole = m.actions.holeS()!;
  expect(hole).not.toBeNull();
  crossTo(m, Math.min(hole + 80, m.state.cross!.route.totalLength - 2));
  expect(m.actions.angiogram().ok).toBe(true);
  m.actions.deviceTo(hole);
  expect(m.actions.inflate("low").ok).toBe(true);
  return hole;
}

describe("endovascular control: the bleed", () => {
  it("bleed-external-iliac: the hole bleeds into the engine until the balloon is up; the balloon stops it", () => {
    const { s, m } = open("bleed-external-iliac");
    untilOnset(s, m);
    const b = m.state.bleed!;
    run(s, 60);
    const lostBefore = b.lostMl;
    expect(lostBefore).toBeGreaterThan(600);
    // the extravasation is on the right groin's route (the sheath puff at the pelvis shows it)
    const right = s.sites.find((x) => x.side === "right")!;
    const holeOnRoute = m.actions.extravasationOnRoute(right.id)!;
    expect(holeOnRoute).not.toBeNull();
    // no balloon up: nothing stops the right sheath's puff
    expect(m.actions.occlusionOnRoute(right.id)).toBeNull();
    balloonOnHole(s, m);
    const at = b.lostMl;
    run(s, 120);
    expect(b.lostMl).toBeCloseTo(at, 3);
    expect(m.actions.extravasationOnRoute(right.id)).toBeNull();
    // the inflated balloon stops the right sheath's puff at or below the hole, not the left groin's
    const occl = m.actions.occlusionOnRoute(right.id);
    expect(occl).not.toBeNull();
    expect(occl!).toBeGreaterThanOrEqual(0);
    expect(occl!).toBeLessThanOrEqual(holeOnRoute);
    const left = s.sites.find((x) => x.side === "left")!;
    expect(m.actions.occlusionOnRoute(left.id)).toBeNull();
    expect(m.actions.draw()!.angio!.extravasation).toBeNull();
    expect(decision(s, "endo-balloon-pressure")).toMatchObject({ correct: true });
    // let down without a fix: it bleeds again
    m.actions.deflate();
    expect(m.actions.occlusionOnRoute(right.id)).toBeNull();
    run(s, 60);
    expect(b.lostMl).toBeGreaterThan(at + 10);
  });

  it("bleed-iea-branch: the sheath puff's blush sits on the branch, drawn from the artery out to the hole", () => {
    const { s, m } = open("bleed-iea-branch");
    untilOnset(s, m);
    const right = s.sites.find((x) => x.side === "right")!;
    const twig = m.actions.branchExtravasation(right.id)!;
    expect(twig).not.toBeNull();
    expect(twig.branchId).toBe("iea");
    const br = right.site.branches.find((x) => x.id === "iea")!;
    expect(twig.x).toBeGreaterThan(br.xFrom);
    expect(twig.x).toBeLessThanOrEqual(br.xTo);
    const tubes = siteBranchTubes(right.wireRoute.geom, s.model, right.site, twig.branchId, twig.x, { strength: 1, mgPerMl: 100 });
    // the branch and the artery from its origin to the sheath tip
    expect(tubes).toHaveLength(2);
    const end = tubes[0].pts[tubes[0].pts.length - 1];
    const hole = toWorld(s.model, twig.p);
    expect(Math.hypot(end.x - hole.x, end.y - hole.y, end.z - hole.z)).toBeLessThan(0.5);
    // the branch's start meets the artery tube
    const a = tubes[1].pts[0];
    const b0 = tubes[0].pts[0];
    expect(Math.hypot(a.x - b0.x, a.y - b0.y, a.z - b0.z)).toBeLessThan(10);
    expect(siteBranchTubes(right.wireRoute.geom, s.model, right.site, twig.branchId, twig.x, { strength: 0, mgPerMl: 100 })).toEqual([]);
  });

  it("deploying any device before balloon occlusion is wrong", () => {
    for (const [id, device, target] of [
      ["bleed-external-iliac", "covered-be", "main"],
      ["bleed-iea-branch", "coils", "branch"],
    ] as const) {
      const { s, m } = open(id);
      untilOnset(s, m);
      otherGroin(s, m);
      const hole = m.actions.holeS()!;
      crossTo(m, hole + 80);
      m.actions.angiogram();
      run(s, 200);
      m.actions.longSheath();
      run(s, MP_ENDO.longSheathS + 5);
      m.actions.deviceTo(id === "bleed-external-iliac" ? hole + 10 : hole);
      if (target === "branch") {
        m.actions.checkRetrograde();
        run(s, MP_ENDO.retrogradeS + 5);
      }
      const r = m.actions.deploy(device, target);
      expect(r.verdict, `${id}: ${r.text}`).toBeDefined();
      expect(decision(s, "endo-balloon-first"), id).toMatchObject({ correct: false });
      expect(decision(s, "endo-device"), id).toMatchObject({ correct: false });
    }
  });

  it("bleed-external-iliac: coils fail and a covered stent succeeds", () => {
    const { s, m } = open("bleed-external-iliac");
    untilOnset(s, m);
    const hole = balloonOnHole(s, m);
    m.actions.longSheath();
    run(s, MP_ENDO.longSheathS + 5);
    // coils at the hole: no seal, scored wrong
    const coils = m.actions.deploy("coils", "main");
    expect(coils.verdict).toMatchObject({ correct: false, effect: "none" });
    expect(decision(s, "endo-device")).toMatchObject({ correct: false });
    // a covered stent across the hole seals it
    m.actions.deviceTo(hole + 10);
    const st = m.actions.deploy("covered-be", "main");
    expect(st.verdict).toMatchObject({ correct: true, effect: "seals" });
    run(s, MP_ENDO.stentS + 10);
    expect(m.state.bleed!.sealed?.by).toBe("covered-be");
    m.actions.deflate();
    const lost = m.state.bleed!.lostMl;
    run(s, 120);
    expect(m.state.bleed!.lostMl).toBeCloseTo(lost, 3);
    expect(decision(s, "endo-balloon-first")).toMatchObject({ correct: true });
    expect(decision(s, "endo-sheath-size")).toMatchObject({ correct: true });
  });

  it("a covered stent through the 6 Fr sheath is refused and the sheath check scored", () => {
    const { s, m } = open("bleed-external-iliac");
    untilOnset(s, m);
    const hole = balloonOnHole(s, m);
    m.actions.deviceTo(hole + 10);
    const r = m.actions.deploy("covered-be", "main");
    expect(r.ok).toBe(false);
    expect(r.verdict?.refusedBy).toBe("sheath");
    expect(decision(s, "endo-sheath-size")).toMatchObject({ correct: false });
    expect(m.state.stents).toEqual([]);
  });

  it("bleed-cfa: a stent across the femoral bifurcation records profunda loss; one above it does not", () => {
    for (const across of [true, false]) {
      const { s, m } = open("bleed-cfa");
      untilOnset(s, m);
      const hole = balloonOnHole(s, m);
      m.actions.longSheath();
      run(s, MP_ENDO.longSheathS + 5);
      // the femoral bifurcation lies 20 mm below the hole (the scenario); a 50 mm stent centred 15 mm below the hole
      // covers both, one centred 15 mm above it only the hole
      m.actions.deviceTo(across ? hole + 15 : hole - 15);
      const r = m.actions.deploy("covered-se", "main");
      expect(r.verdict?.profundaLost, `across ${across}`).toBe(across);
      expect(m.state.profundaLost).toBe(across);
      expect(decision(s, "endo-bifurcation")?.correct ?? !across, `across ${across}`).toBe(!across);
      if (!across) {
        expect(r.verdict).toMatchObject({ correct: true, effect: "seals" });
        run(s, MP_ENDO.stentS + 10);
        expect(decision(s, "endo-bifurcation")).toMatchObject({ correct: true });
      } else expect(decision(s, "endo-device")).toMatchObject({ correct: false });
    }
  });

  it("bleed-iea-branch: coiling without a retrograde check is wrong; with it, right", () => {
    for (const check of [false, true]) {
      const { s, m } = open("bleed-iea-branch");
      untilOnset(s, m);
      const hole = balloonOnHole(s, m);
      m.actions.deviceTo(hole);
      if (check) {
        expect(m.actions.checkRetrograde().ok).toBe(true);
        run(s, MP_ENDO.retrogradeS + 5);
      }
      const r = m.actions.deploy("coils", "branch");
      expect(r.verdict?.effect).toBe("seals");
      expect(decision(s, "endo-retrograde"), `check ${check}`).toMatchObject({ correct: check });
      expect(decision(s, "endo-device"), `check ${check}`).toMatchObject({ correct: check });
      run(s, MP_ENDO.coilS + 10);
      expect(m.state.bleed!.sealed?.by).toBe("coils");
    }
  });

  it("bleed-distal-pinhole: a coil cannot reach; the sealant seals it", () => {
    const { s, m } = open("bleed-distal-pinhole");
    untilOnset(s, m);
    const hole = balloonOnHole(s, m);
    m.actions.deviceTo(hole);
    const c = m.actions.deploy("coils", "branch");
    expect(c.verdict?.refusedBy).toBe("reach");
    expect(decision(s, "endo-device")).toMatchObject({ correct: false });
    const g = m.actions.deploy("sealant", "branch");
    expect(g.verdict).toMatchObject({ correct: true, effect: "seals" });
  });

  it("the leg is examined after the fix, or scored when it is not", () => {
    const { s, m } = open("bleed-iea-branch");
    untilOnset(s, m);
    const hole = balloonOnHole(s, m);
    m.actions.deviceTo(hole);
    m.actions.checkRetrograde();
    run(s, MP_ENDO.retrogradeS + 5);
    m.actions.deploy("coils", "branch");
    run(s, MP_ENDO.coilS + 10);
    run(s, MP_ENDO.legAfterS + 10);
    expect(decision(s, "endo-leg-after")).toMatchObject({ correct: false });
  });
});

describe("the cold leg by cause", () => {
  it("livedo-not-ali scores emergency angiography wrong", () => {
    const { s, m } = open("livedo-not-ali");
    untilOnset(s, m);
    const f = m.actions.examineLeg();
    expect(f.livedo).toBe(true);
    expect(f.pulses.pedal).toBe("present");
    m.actions.callLeg("cholesterol");
    expect(decision(s, "endo-leg-call")).toMatchObject({ correct: true });
    m.actions.legAngiography();
    expect(decision(s, "endo-leg-angio")).toMatchObject({ correct: false });
    m.actions.treatLeg("supportive");
    expect(decision(s, "endo-leg-treatment")).toMatchObject({ correct: true });
  });

  it("dissection-iliac: the six Ps, angiography from the other groin, a self-expanding stent over a true-lumen wire", () => {
    const { s, m } = open("dissection-iliac");
    untilOnset(s, m);
    const f = m.actions.examineLeg();
    expect(f).toMatchObject({ pallor: true, cold: true, pleth: "flat" });
    m.actions.callLeg("ali");
    expect(decision(s, "endo-leg-call")).toMatchObject({ correct: true });
    otherGroin(s, m, "hydrophilic");
    // over the bifurcation, catheter across, then the angiogram of the leg
    crossTo(m, m.state.cross!.route3d.bifurcationS + 25);
    expect(m.actions.legAngiography().ok).toBe(true);
    expect(decision(s, "endo-leg-angio")).toMatchObject({ correct: true });
    expect(m.actions.draw()!.angio!.flapS).not.toBeNull();
    m.actions.read("flap");
    expect(decision(s, "endo-angio-read")).toMatchObject({ correct: true });
    // not yet in the true lumen beyond the flap: refused, not graded
    expect(m.actions.treatLeg("se-stent").ok).toBe(false);
    expect(decision(s, "endo-leg-treatment")).toBeUndefined();
    crossTo(m, m.actions.lesionS()! + 40);
    expect(m.actions.treatLeg("se-stent").ok).toBe(true);
    expect(decision(s, "endo-leg-treatment")).toMatchObject({ correct: true });
    run(s, MP_ENDO.legTreatS + 10);
    expect(m.state.leg!.treated?.by).toBe("se-stent");
    expect(m.actions.examineLeg().pulses.pedal).toBe("present");
  });

  it("dissection-cfa and plug-intraluminal go to surgery; a stent in the common femoral artery is wrong", () => {
    for (const [id, t, ok] of [
      ["dissection-cfa", "se-stent", false],
      ["dissection-cfa", "surgery", true],
      ["plug-intraluminal", "surgery", true],
    ] as const) {
      const { s, m } = open(id);
      untilOnset(s, m);
      otherGroin(s, m, "hydrophilic");
      crossTo(m, m.actions.lesionS()! + 40);
      m.actions.legAngiography();
      expect(m.actions.treatLeg(t).ok, `${id} ${t}`).toBe(true);
      expect(decision(s, "endo-leg-treatment"), `${id} ${t}`).toMatchObject({ correct: ok });
    }
  });

  it("leg-embolus: thrombectomy is right; the leg fills to the foot afterwards", () => {
    const { s, m } = open("leg-embolus");
    untilOnset(s, m);
    expect(m.actions.examineLeg().pulses.femoral).toBe("present");
    otherGroin(s, m);
    crossTo(m, m.state.cross!.route3d.bifurcationS + 25);
    m.actions.legAngiography();
    expect(m.actions.draw()!.angio!.stopS).not.toBeNull();
    expect(m.actions.treatLeg("thrombectomy").ok).toBe(true);
    expect(decision(s, "endo-leg-treatment")).toMatchObject({ correct: true });
    run(s, MP_ENDO.legTreatS + 10);
    expect(m.actions.examineLeg().pleth).toBe("normal");
  });

  it("a femoral case without an episode is untouched: no events, no contexts, nothing logged by the module", () => {
    const { session: s } = newCaseSession({ seed: "endo-none", access: "femoral", start: "closure" });
    const m = endovascularOf(s)!;
    run(s, 120);
    expect(m.state.bleed).toBeNull();
    expect(m.state.leg).toBeNull();
    expect(m.events!()).toEqual([]);
    expect(m.tipContexts!()).toEqual([]);
    expect(s.decisions().filter((d) => d.id.startsWith("endo-"))).toEqual([]);
    expect(m.actions.visible()).toBe(false);
  });
});
