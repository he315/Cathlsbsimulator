// Anatomy variants (diag-anatomy-variants): the analytic ostia, the render tree, the flow regions, the
// fill lists, the contrast transport, the physics lumens and the scenario pack.
//   npx vitest run src/simulation/anatomy.test.ts
import { describe, expect, it } from "vitest";
import type { AnatomyCase, AnatomyVariant, Dominance, EngagementState, PressureState, RootSize } from "../types";
import { buildAnatomy, engagementTargets, injectionFill, ostiumAz, sinusAzimuths, HIGH_OSTIA_LIFT_MM, LM_OSTIUM_HEIGHT, RCA_OSTIUM_HEIGHT, VERY_DILATED_ROOT_RADIUS, type AnatomyModel } from "./anatomy";
import { ANOMALY_PRIOR, ANOMALY_VARIANTS, generateCase, generateRandomCase, reconstructCase, scenarioCase } from "./caseGenerator";
import { injectContrast } from "./contrast";
import { coronaryFlowFor, supplyFor } from "./patient/coronaryFlow";
import { buildCoronaryTree, samplePos, vesselRadiiAt, type CoronaryTree } from "../render/xray/coronaryTree";
import { fistulaDrain, FISTULA_VESSEL, LCX_FROM_RCA_MM } from "../render/xray/coronaryGrowth";
import { sampleGenome, describeGenome } from "../render/xray/coronaryAtlas";
import { transportNet, rootInjectionShares, contrastField, inletShareOf, SINUS_FED, AORTOGRAM } from "../render/xray/contrastTransport";
import { LUMENS, planTrace, standardPlan } from "./injection";
import { coronaryInputsFromRenderTree, ostiaFromRenderTree } from "../physics/coronaryLumens";
import { PhysicsEngine } from "../physics/engine";
import type { EngagementReading } from "../physics/engagementClassifier";
import * as S from "../physics/scenarios";
import * as M from "../physics/manoeuvres";
import { DIAG_SCENARIOS, diagScenarioById, scenarioEvents } from "./diagnosticScenarios";
import { launch as anatomyLaunch } from "./diagnosticScenarios/anatomy.launch";
import { practiceForLesson } from "../ui/content/practiceIndex";
import { computeEngagement, CONUS_OVERSELECTION_THRESHOLDS } from "./engagement";
import { findStartControls } from "../mentor/skillCards";
import { catheterById } from "../data/catheters";

const mk = (id: string, variants: AnatomyVariant[], dominance: Dominance = "right", rootSize: RootSize = "normal"): AnatomyCase => ({
  id,
  name: id,
  difficulty: 1,
  accessRoute: "femoral",
  rootSize,
  rootRotationDeg: 0,
  aortaTiltDeg: 0,
  dominance,
  variants,
  pathology: "none",
  lesions: [],
  recommendedCatheters: [],
  acceptableCatheters: [],
  requiredViews: [],
  traps: [],
  objectives: [],
  teachingSummary: "",
});

const build = (c: AnatomyCase) => {
  const model = buildAnatomy(c);
  return { model, tree: buildCoronaryTree(model, c) };
};
const vessel = (t: CoronaryTree, name: string) => t.vessels.find((v) => v.name === name);
const angle = (a: number, b: number) => {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return Math.abs(d);
};
/** The sinus an aortic-frame point faces: the nearer of the two coronary sinus centres by azimuth. */
const sinusOfPoint = (model: AnatomyModel, p: { x: number; z: number }): "left" | "right" => {
  const az = Math.atan2(p.z, p.x);
  const s = sinusAzimuths(model);
  return angle(az, s.left) <= angle(az, s.right) ? "left" : "right";
};
/** Where a tree vessel starts (rest geometry). */
const origin = (t: CoronaryTree, name: string) => samplePos(t.heart, vessel(t, name)!.samples[0]);

describe("each new variant builds a tree whose LCx, RCA or LM origin is on the stated sinus", () => {
  it("anomalous-lcx-right-sinus: the circumflex has its own ostium in the right sinus and no parent", () => {
    const { model, tree } = build(mk("av-lcx-rs", ["anomalous-lcx-right-sinus"]));
    const lcx = vessel(tree, "LCx")!;
    expect(lcx.parent).toBeUndefined();
    expect(sinusOfPoint(model, origin(tree, "LCx"))).toBe("right");
    expect(model.lcxOrigin).toBe("right-sinus");
    expect(engagementTargets(model).find((t) => t.vessel === "LCx")?.sinus).toBe("right");
    // the left main stays in the left sinus
    expect(sinusOfPoint(model, origin(tree, "LM"))).toBe("left");
  });

  it("anomalous-lcx-from-rca: the circumflex leaves the proximal RCA, which arises in the right sinus", () => {
    for (const dom of ["right", "left"] as Dominance[]) {
      const { model, tree } = build(mk(`av-lcx-rca-${dom}`, ["anomalous-lcx-from-rca"], dom));
      const lcx = vessel(tree, "LCx")!;
      const rca = vessel(tree, "RCA")!;
      expect(lcx.parent?.name).toBe("RCA");
      expect(rca.pathMm[lcx.parent!.index] - rca.pathMm[0]).toBeLessThan(LCX_FROM_RCA_MM + 3);
      expect(sinusOfPoint(model, origin(tree, "RCA"))).toBe("right");
      expect(model.leftOstium2).toBeNull();
      expect(model.sinusOf?.lcx).toBe("right");
      // retroaortic: behind the root on its way to the left AV groove
      const pts = lcx.samples.slice(0, 40).map((s) => samplePos(tree.heart, s));
      expect(Math.min(...pts.map((p) => p.z))).toBeLessThan(-model.sinusRadius * 0.6);
      // segment numbers stay the circumflex's
      expect(lcx.segment?.[1]).toBe("11");
    }
  });

  it("anomalous-rca-left-sinus: the RCA arises in the left sinus; the physics root keeps the usual right sinus", () => {
    const { model, tree } = build(mk("av-rca-ls", ["anomalous-rca-left-sinus"]));
    expect(sinusOfPoint(model, origin(tree, "RCA"))).toBe("left");
    expect(model.sinusOf?.rca).toBe("left");
    // rca.az is the right sinus azimuth (the physics root builds its cusps from it); pos is the anomalous ostium
    const usual = buildAnatomy(mk("av-usual", []));
    expect(model.rca.az).toBeCloseTo(usual.rca.az, 9);
    expect(angle(ostiumAz(model.rca), model.lm.az)).toBeLessThan(Math.PI / 2);
    expect(model.usual?.rca.pos.x).toBeCloseTo(usual.rca.pos.x, 9);
  });

  it("anomalous-lm-right-sinus: the left main arises in the right sinus and runs in front of the root to its usual bifurcation", () => {
    const { model, tree } = build(mk("av-lm-rs", ["anomalous-lm-right-sinus"]));
    expect(sinusOfPoint(model, origin(tree, "LM"))).toBe("right");
    expect(model.sinusOf?.lm).toBe("right");
    expect(engagementTargets(model).find((t) => t.vessel === "LM")?.sinus).toBe("right");
    const lm = vessel(tree, "LM")!;
    const pts = lm.samples.map((s) => samplePos(tree.heart, s));
    // interarterial: anterior to the root (between the aorta and the pulmonary trunk)
    expect(Math.max(...pts.map((p) => p.z))).toBeGreaterThan(model.sinusRadius);
    // it reaches the bed of the usual left main: the LAD and circumflex still leave it
    expect(vessel(tree, "LAD")!.parent?.name).toBe("LM");
    expect(vessel(tree, "LCx")!.parent?.name).toBe("LM");
    expect(vessel(tree, "LAD")!.side).toBe("left");
  });

  it("high-ostia: both ostia lifted to the sinotubular junction, and the engageable zone reaches them", () => {
    const { model } = build(mk("av-high", ["high-ostia"]));
    expect(model.lm.height).toBeCloseTo(LM_OSTIUM_HEIGHT + HIGH_OSTIA_LIFT_MM, 6);
    expect(model.rca.height).toBeCloseTo(RCA_OSTIUM_HEIGHT + HIGH_OSTIA_LIFT_MM, 6);
    expect(model.sinusTopY).toBeGreaterThan(model.rca.height);
    expect(sinusOfPoint(model, model.lm.pos)).toBe("left");
    expect(sinusOfPoint(model, model.rca.pos)).toBe("right");
  });

  it("conus-separate-ostium: the conus has its own ostium beside the RCA's, closer than usual", () => {
    const sep = build(mk("av-conus", ["conus-separate-ostium"]));
    const usual = build(mk("av-conus", []));
    const d = (m: AnatomyModel) => Math.hypot(m.conus.pos.x - m.rca.pos.x, m.conus.pos.y - m.rca.pos.y, m.conus.pos.z - m.rca.pos.z);
    expect(d(sep.model)).toBeLessThan(d(usual.model));
    expect(sinusOfPoint(sep.model, origin(sep.tree, "CONUS"))).toBe("right");
    expect(vessel(sep.tree, "CONUS")!.parent).toBeUndefined();
  });

  it("very-dilated-root: a larger sinus than the dilated root, with the ostia on its wall", () => {
    const { model } = build(mk("av-vdr", ["very-dilated-root"], "right", "dilated"));
    const dilated = buildAnatomy(mk("av-dr", ["dilated-root"], "right", "dilated"));
    expect(model.sinusRadius).toBe(VERY_DILATED_ROOT_RADIUS);
    expect(model.sinusRadius).toBeGreaterThan(dilated.sinusRadius);
    expect(Math.hypot(model.lm.pos.x, model.lm.pos.z)).toBeCloseTo(VERY_DILATED_ROOT_RADIUS, 6);
  });

  it("fistula-lad-pa: a vessel from the proximal LAD drains on the pulmonary trunk, fills with the left injection and is a sink", () => {
    const { model, tree } = build(mk("av-fistula", ["fistula-lad-pa"]));
    const f = vessel(tree, FISTULA_VESSEL)!;
    expect(f.parent?.name).toBe("LAD");
    expect(f.fillId).toBe("LAD");
    expect(f.side).toBe("left");
    const end = samplePos(tree.heart, f.samples[f.samples.length - 1]);
    const drain = fistulaDrain(model);
    expect(Math.hypot(end.x - drain.x, end.y - drain.y, end.z - drain.z)).toBeLessThan(3);
    expect(f.radii[f.radii.length - 1]).toBeGreaterThan(f.radii[0]);
    const net = transportNet(tree);
    expect(net.sinks?.map((x) => x.vessel)).toEqual([FISTULA_VESSEL]);
    // the genome draws the fistula only with the variant
    expect(sampleGenome("x", { variants: ["fistula-lad-pa"] }).fistula).toBeDefined();
    expect(sampleGenome("x", { variants: [] }).fistula).toBeUndefined();
    expect(describeGenome(tree.genome!).join(" ")).toMatch(/fistula/);
  });
});

describe("combinations", () => {
  it("separate ostia give way to an anomalous left main or circumflex in the analytic model and the render tree alike", () => {
    for (const v of ["anomalous-lm-right-sinus", "anomalous-lcx-right-sinus", "anomalous-lcx-from-rca"] as AnatomyVariant[]) {
      const { model, tree } = build(mk(`av-combo-${v}`, ["separate-ostia", v]));
      expect(tree.genome!.lm.separateOstia).toBe(false);
      expect(model.vessels.some((x) => x.id === "LM")).toBe(true);
      expect(vessel(tree, "LM")).toBeDefined();
    }
  });
});

describe("render: the myocardial bridge", () => {
  it("the bridge radius is smaller at contraction 1 than at 0 (diag-bridge-lad)", () => {
    const c = scenarioCase("diag-bridge-lad", "1")!;
    const { tree } = build(c);
    const lad = vessel(tree, "LAD")!;
    expect(lad.bridge).toBeDefined();
    const mid = Math.round((lad.bridge!.i0 + lad.bridge!.i1) / 2);
    const dia = vesselRadiiAt(lad, { contraction: 0 });
    const sys = vesselRadiiAt(lad, { contraction: 1 });
    expect(sys[mid]).toBeLessThan(dia[mid]);
    expect(dia[mid]).toBeCloseTo(lad.radii[mid], 9);
  });
});

describe("flow and fill follow the origin", () => {
  it("regionSupply assigns the lateral wall to the RCA injection for anomalous-lcx-right-sinus", () => {
    for (const v of ["anomalous-lcx-right-sinus", "anomalous-lcx-from-rca"] as AnatomyVariant[]) {
      const { tree } = build(mk(`av-supply-${v}`, [v]));
      const fm = coronaryFlowFor(tree, []);
      const lateral = fm.regions.filter((r) => r.territory === "LCx");
      expect(lateral.length).toBeGreaterThan(0);
      expect(new Set(lateral.map((r) => r.side))).toEqual(new Set(["right"]));
      // a catheter blocking the left ostium leaves the lateral wall supplied; one blocking the right ostium starves it
      const leftBlocked = { ostial: { left: 0, right: 1 } };
      const rightBlocked = { ostial: { left: 1, right: 0 } };
      for (const r of lateral) {
        expect(supplyFor(r, fm, leftBlocked).q).toBeGreaterThan(0);
        expect(supplyFor(r, fm, rightBlocked).q).toBe(0);
      }
      // the usual anatomy for comparison: the lateral wall is the left injection's
      const usual = coronaryFlowFor(build(mk(`av-supply-${v}`, [])).tree, []);
      expect(new Set(usual.regions.filter((r) => r.territory === "LCx").map((r) => r.side))).toEqual(new Set(["left"]));
    }
  });

  it("a left injection fills no circumflex vessel of an anomalous circumflex and a right injection fills them all", () => {
    const eng = (target: "left" | "right") => ({ kind: target === "left" ? "selective-lm" : "selective-rca", target, isSelective: true, isDeep: false, quality: 1 }) as unknown as EngagementState;
    const pressure = { kind: "normal" } as unknown as PressureState;
    for (const v of ["anomalous-lcx-right-sinus", "anomalous-lcx-from-rca"] as AnatomyVariant[]) {
      for (const dom of ["right", "left"] as Dominance[]) {
        const { model, tree } = build(mk(`av-fill-${v}-${dom}`, [v], dom));
        const shown = (target: "left" | "right") => {
          const filled = new Set(injectContrast(eng(target), pressure, model).filledVessels);
          // the scene's rule (sceneBuilder.ts): a tree vessel is opacified when its fillId is in the fill list
          return new Set(tree.vessels.filter((x) => filled.has(x.fillId)).map((x) => x.name));
        };
        const left = shown("left"),
          right = shown("right");
        const lcxSystem = tree.vessels.filter((x) => x.lesionId === "LCx" || /^OM\d/.test(x.name)).map((x) => x.name);
        expect(lcxSystem.length).toBeGreaterThan(1);
        for (const n of lcxSystem) {
          expect(left.has(n), `${v} ${dom}: ${n} on the left injection`).toBe(false);
          expect(right.has(n), `${v} ${dom}: ${n} on the right injection`).toBe(true);
        }
        expect(left.has("LAD")).toBe(true);
      }
    }
  });

  it("an anomalous circumflex with its own right-sinus ostium fills later than the RCA (sinus reflux)", () => {
    const { tree } = build(mk("av-sinusfed", ["anomalous-lcx-right-sinus"]));
    const net = transportNet(tree);
    expect(net.vessels.get("LCx")!.theta[0]).toBeCloseTo(SINUS_FED.delayS, 6);
    expect(net.vessels.get("RCA")!.theta[0]).toBe(0);
  });

  it("on a selective RCA run the circumflex from the right sinus outlines faintly (SINUS_FED.share); from the proximal RCA it fills like the RCA", () => {
    /** Peak concentration over a standard right injection at a quarter of each vessel's length (the scene's rule: ContrastField.at(theta) times the inlet share). */
    const peaks = (v: AnatomyVariant) => {
      const { tree } = build(mk(`av-share-${v}`, [v]));
      const net = transportNet(tree);
      const trace = planTrace(standardPlan("right", LUMENS["diag-6"]));
      const at = (name: string) => {
        const th = net.vessels.get(name)!.theta;
        return th[Math.floor(th.length / 4)];
      };
      const peak = { RCA: 0, LCx: 0, OM1: 0 };
      for (let t = 0; t <= 6; t += 0.1) {
        const cf = contrastField({ net, side: "right", trace, t, phase: (t / 0.83) % 1, rr: 0.83 });
        for (const n of ["RCA", "LCx", "OM1"] as const) if (net.vessels.has(n)) peak[n] = Math.max(peak[n], cf.at(at(n)) * inletShareOf(net, n));
      }
      return { net, peak };
    };
    const rs = peaks("anomalous-lcx-right-sinus");
    expect(inletShareOf(rs.net, "LCx")).toBe(SINUS_FED.share);
    expect(inletShareOf(rs.net, "OM1")).toBe(SINUS_FED.share);
    expect(inletShareOf(rs.net, "RCA")).toBe(1);
    expect(rs.peak.RCA).toBeGreaterThan(0.5);
    expect(rs.peak.LCx).toBeGreaterThan(0);
    expect(rs.peak.LCx).toBeLessThan(0.5 * rs.peak.RCA);
    const fr = peaks("anomalous-lcx-from-rca");
    expect(inletShareOf(fr.net, "LCx")).toBe(1);
    expect(fr.net.vessels.get("LCx")!.share).toBeUndefined();
    expect(fr.peak.LCx).toBeGreaterThan(0.5 * fr.peak.RCA);
    // the usual anatomy's nets carry no share
    const usual = transportNet(build(mk("av-share-usual", [])).tree);
    expect([...usual.vessels.values()].some((x) => x.share !== undefined)).toBe(false);
  });

  it("a sinus injection reaches the nearer ostium more than the further one; an aortogram reaches them alike", () => {
    const { model } = build(mk("av-root", ["anomalous-rca-left-sinus"]));
    const ostia = [{ name: "lm", pos: model.lm.pos }, { name: "rca", pos: model.rca.pos }];
    const tip = { x: model.rca.pos.x * 0.8, y: model.rca.pos.y, z: model.rca.pos.z * 0.8 };
    const s = rootInjectionShares(ostia, tip);
    expect(s.get("rca")!).toBeGreaterThan(s.get("lm")!);
    const a = rootInjectionShares(ostia, null, true);
    expect(a.get("rca")).toBe(a.get("lm"));
    expect(a.get("rca")!).toBeGreaterThan(0);
    expect(AORTOGRAM).toEqual({ volumeMl: 60, durationS: 3 });
  });
});

describe("physics", () => {
  /** A case's engine with the render tree's coronary lumens (as the lab passes them, physicsDevices.coronariesAt). */
  function engineFor(variants: AnatomyVariant[]) {
    const c = S.caseFor("femoral", "normal", variants);
    const model = buildAnatomy(c);
    const tree = buildCoronaryTree(model, c);
    const coronaries = coronaryInputsFromRenderTree(tree, { contraction: 0 }, { minRadius: 0 }).filter((x) => x.name === "CONUS" || (x.radii[0] ?? 0) >= 0.6);
    return { model, tree, make: () => new PhysicsEngine({ model, route: "femoral", variants, coronaries, archBranches: false }, S.scenarioDefaults.cfg) };
  }

  /**
   * The Amplatz procedure (manoeuvres.amplatzLeftTechnique) aimed at an ostium the sinus injection has shown: seat
   * the curve in the sinus, advance while the tip is below the ostium's level and withdraw once at or above it, and
   * turn towards the ostium's azimuth. 45 corrections of 0.5 s (the RCA from the left sinus lies higher and further
   * round than the left main the standard 30 are set for).
   */
  function amplatzTo(eng: PhysicsEngine, target: { x: number; y: number; z: number }, steps = 45): EngagementReading[] {
    const out: EngagementReading[] = [eng.classify()!];
    const ty = target.y - 1;
    const az = Math.atan2(target.z, target.x);
    for (let i = 0; i < steps; i++) {
      const tip = S.tipOf(eng);
      const seated = M.lowestDistal(eng, 80) - eng.scene.model.valvePlaneY <= M.protocol.alSeatMm;
      const push = out[out.length - 1].inLV ? -3 : !seated ? 2 : tip[1] < ty ? M.protocol.alAdvance : -M.protocol.alWithdraw;
      eng.command({ kind: "push", device: "catheter", mm: push });
      const dAz = Math.atan2(Math.sin(az - Math.atan2(tip[2], tip[0])), Math.cos(az - Math.atan2(tip[2], tip[0])));
      if (Math.abs(dAz) > (M.protocol.azTolDeg * Math.PI) / 180) eng.command({ kind: "torque", device: "catheter", rad: 0.1 * Math.sign(dAz) });
      eng.step(0.5);
      const r = eng.classify()!;
      out.push(r);
      if (M.engagedRca(r)) break;
    }
    return out;
  }

  it("the render tree's ostia are the classifier's: the anomalous ostia are lumens the rod can enter", () => {
    const lcxR = build(mk("av-ostia-1", ["anomalous-lcx-right-sinus"]));
    const o1 = ostiaFromRenderTree(lcxR.tree);
    const left2 = o1.find((o) => o.name === "left2")!;
    expect(left2.side).toBe("right");
    expect(Math.hypot(left2.pos.x - lcxR.model.leftOstium2!.pos.x, left2.pos.y - lcxR.model.leftOstium2!.pos.y, left2.pos.z - lcxR.model.leftOstium2!.pos.z)).toBeLessThan(0.5);
    const lmR = build(mk("av-ostia-2", ["anomalous-lm-right-sinus"]));
    const lm = ostiaFromRenderTree(lmR.tree).find((o) => o.name === "lm")!;
    expect(Math.hypot(lm.pos.x - lmR.model.lm.pos.x, lm.pos.y - lmR.model.lm.pos.y, lm.pos.z - lmR.model.lm.pos.z)).toBeLessThan(0.5);
    // a circumflex from the proximal RCA is kept as a lumen (a branch near the ostium)
    const fromRca = build(mk("av-ostia-3", ["anomalous-lcx-from-rca"]));
    const lumen = coronaryInputsFromRenderTree(fromRca.tree, { contraction: 0 }).find((c) => c.name === "LCx")!;
    expect(lumen.side).toBe("right");
    expect(lumen.offsetMm).toBeLessThan(LCX_FROM_RCA_MM + 3);
  });

  it("AL1 with the aimed Amplatz procedure (amplatzTo, 45 corrections towards the ostium a sinus injection shows) engages the anomalous RCA from the left sinus in at least 2 of 5 starts; JR4 turned either way in fewer", () => {
    const { model, make } = engineFor(["anomalous-rca-left-sinus"]);
    // the physics root keeps the usual cusps: rca.az is the right sinus, the ostium is in the left
    expect(angle(ostiumAz(model.rca), model.lm.az)).toBeLessThan(Math.PI / 2);
    const run = (cath: string, technique: (eng: PhysicsEngine) => EngagementReading[]) => {
      let engaged = 0;
      for (const back of M.STARTS) {
        const eng = make();
        S.parkOverWire(eng, cath, { tipBack: back });
        if (!S.advanceToRoot(eng)) continue;
        S.withdrawWire(eng);
        if (technique(eng).some(M.engagedRca)) engaged++;
      }
      return engaged;
    };
    const al1 = run("AL1", (eng) => amplatzTo(eng, model.rca.pos));
    // the Judkins right technique with height correction, turned clockwise (as for the usual RCA) and anticlockwise
    // (towards the left sinus, where this RCA arises)
    const jr4cw = run("JR4", (eng) => M.jr4Technique(eng, 0.15));
    const jr4acw = run("JR4", (eng) => M.jr4Technique(eng, -0.15));
    console.info(`anomalous RCA from the left sinus: AL1 (amplatzTo, 45 corrections) ${al1}/5, JR4 clockwise ${jr4cw}/5, JR4 anticlockwise ${jr4acw}/5`);
    expect(al1).toBeGreaterThanOrEqual(2);
    expect(al1).toBeGreaterThan(Math.max(jr4cw, jr4acw));
  }, 120_000);
});

describe("the case generator", () => {
  it("random cases carry an anomaly at the low prior, never named in the case's name; scenarios and presets with a pool do not", () => {
    const N = 2000;
    let n = 0;
    for (let i = 0; i < N; i++) {
      const c = generateCase(`anomaly-prior-${i}`, { anomalyPrior: true });
      const a = c.variants.filter((v) => (ANOMALY_VARIANTS as readonly string[]).includes(v));
      if (!a.length) continue;
      n++;
      expect(a).toHaveLength(1);
      expect(c.name).not.toMatch(/anomal|fistula|high ostia|sinus/i);
      expect(c.traps.join(" ")).toMatch(/sinus injection or an aortogram/);
    }
    expect(n / N).toBeGreaterThan(ANOMALY_PRIOR / 3);
    expect(n / N).toBeLessThan(ANOMALY_PRIOR * 2);
    for (let i = 0; i < 300; i++) {
      const c = generateCase(`anomaly-pool-${i}`, { variantPool: ["ramus"], variantCount: [0, 1], anomalyPrior: true });
      expect(c.variants.some((v) => (ANOMALY_VARIANTS as readonly string[]).includes(v))).toBe(false);
    }
  });

  it("only a spec that asks for the prior draws an anomaly: the full case's spec (no variants given) gets none; the free lab's random cases do, and replay by id keeps them", () => {
    const hasAnomaly = (c: { variants: readonly string[] }) => c.variants.some((v) => (ANOMALY_VARIANTS as readonly string[]).includes(v));
    // seeds whose random case carries an anomaly
    const seeds: string[] = [];
    for (let i = 0; seeds.length < 3 && i < 3000; i++) if (hasAnomaly(generateRandomCase(`anomaly-optin-${i}`))) seeds.push(`anomaly-optin-${i}`);
    expect(seeds.length).toBe(3);
    for (const seed of seeds) {
      const c = generateRandomCase(seed);
      expect(reconstructCase(c.id)?.variants).toEqual(c.variants);
      // the full case and ad hoc PCI (session/caseSession.ts) pass forceVariants undefined under the 'rand' key
      expect(hasAnomaly(generateCase(seed, { access: "femoral", focus: "right", forceVariants: undefined }, "rand"))).toBe(false);
      expect(hasAnomaly(generateCase(seed))).toBe(false);
    }
  });

  it("every variant builds a finite tree at several seeds, with its own catheters suggested", () => {
    const vs: AnatomyVariant[] = ["anomalous-lcx-right-sinus", "anomalous-lcx-from-rca", "anomalous-rca-left-sinus", "anomalous-lm-right-sinus", "high-ostia", "conus-separate-ostium", "myocardial-bridge", "fistula-lad-pa", "very-dilated-root"];
    for (const v of vs)
      for (const seed of ["a", "b", "c"]) {
        const c = generateCase(`variant-${v}-${seed}`, { forceVariants: [v], variantCount: [0, 0], rootSize: v === "very-dilated-root" ? "dilated" : "normal", focus: "both" });
        const { tree } = build(c);
        expect(tree.vessels.length).toBeGreaterThan(20);
        for (const x of tree.vessels) for (const s of x.samples) expect(Number.isFinite(samplePos(tree.heart, s).x)).toBe(true);
      }
    // the lab opens with the usual first catheter (recommendedCatheters[0]); the Amplatz shapes are offered after it
    const rx = generateCase("rx", { forceVariants: ["anomalous-rca-left-sinus"], focus: "right", access: "femoral" });
    expect(rx.recommendedCatheters[0]).toBe("JR4");
    expect(rx.recommendedCatheters).toContain("AL1");
    expect(rx.acceptableCatheters).toEqual(expect.arrayContaining(["AL1", "JL4"]));
    // the very dilated root opens with the dilated root's first catheter; the largest JL on the cart and an Amplatz follow
    const vdr = generateCase("vdr", { forceVariants: ["very-dilated-root"], rootSize: "dilated", focus: "left", access: "femoral" });
    expect(vdr.recommendedCatheters.slice(0, 3)).toEqual(["JL4.5", "JL5", "AL2"]);
  });
});

describe("the scenario pack", () => {
  const ids = anatomyLaunch.scenarios!.map((s) => s.id);

  it("declares the eight scenarios of the plan, each with the variant it is about", () => {
    expect(ids).toEqual([
      "diag-anomalous-cx-retroaortic",
      "diag-rca-from-left-sinus",
      "diag-lm-from-right-sinus",
      "diag-high-ostia",
      "diag-separate-conus",
      "diag-bridge-lad",
      "diag-fistula-pa",
      "diag-very-dilated-root-telescope",
    ]);
    const want: Record<string, string[]> = {
      "diag-anomalous-cx-retroaortic": ["anomalous-lcx-right-sinus", "anomalous-lcx-from-rca"],
      "diag-rca-from-left-sinus": ["anomalous-rca-left-sinus"],
      "diag-lm-from-right-sinus": ["anomalous-lm-right-sinus"],
      "diag-high-ostia": ["high-ostia"],
      "diag-separate-conus": ["conus-separate-ostium"],
      "diag-bridge-lad": ["myocardial-bridge"],
      "diag-fistula-pa": ["fistula-lad-pa"],
      "diag-very-dilated-root-telescope": ["very-dilated-root"],
    };
    for (const id of ids) {
      const seen = new Set<string>();
      for (const seed of ["1", "2", "3", "4", "5", "6"]) for (const v of scenarioCase(id, seed)!.variants) seen.add(v);
      for (const v of want[id]) expect(seen.has(v), `${id}: ${v}`).toBe(true);
      expect(DIAG_SCENARIOS.some((s) => s.id === id)).toBe(true);
    }
    // the anomalous-origin cases raise the event at the first injection; the very dilated root is a dilated root
    for (const id of ["diag-anomalous-cx-retroaortic", "diag-rca-from-left-sinus", "diag-lm-from-right-sinus", "diag-high-ostia"]) expect(scenarioEvents(diagScenarioById(id)!)).toContain("anomalous-origin");
    expect(scenarioCase("diag-very-dilated-root-telescope")!.rootSize).toBe("dilated");
  });

  it("practiceIndex lists every scenario in anatomy.launch.ts under its lessons (pm-interpreting-anomalies, pm-engaging-left, pm-engaging-rca, pm-engaging-fail)", () => {
    for (const s of anatomyLaunch.scenarios!)
      for (const l of s.lessonIds) expect(practiceForLesson(l).some((e) => e.sim === "cathlab" && e.scenario === s.id), `${s.id} under ${l}`).toBe(true);
    for (const l of ["pm-interpreting-anomalies", "pm-engaging-left", "pm-engaging-rca"]) expect(practiceForLesson(l).filter((e) => ids.includes(e.scenario ?? "")).length).toBeGreaterThan(0);
  });
});

describe("the analytic fill lists follow the circumflex's origin (injectionFill, for contrast.ts)", () => {
  const eng = (target: "left" | "right") => ({ kind: target === "left" ? "selective-lm" : "selective-rca", target, isSelective: true, isDeep: false, quality: 1 }) as unknown as EngagementState;
  const pressure = { kind: "normal" } as unknown as PressureState;

  it("with the usual anatomy and the other variants injectionFill is contrast.ts's fill list, in every dominance", () => {
    const sets: AnatomyVariant[][] = [[], ["ramus"], ["separate-ostia"], ["anomalous-rca-left-sinus"], ["anomalous-lm-right-sinus"], ["conus-separate-ostium"], ["high-ostia"]];
    for (const variants of sets)
      for (const dom of ["right", "left", "codominant"] as Dominance[]) {
        const model = buildAnatomy(mk(`av-if-${variants.join("+")}-${dom}`, variants, dom));
        for (const side of ["left", "right"] as const) expect(injectionFill(model, side), `${variants.join("+")} ${dom} ${side}`).toEqual(injectContrast(eng(side), pressure, model).filledVessels);
      }
  });

  it("a circumflex arising on the right fills from the right injection, with its marginals and (left dominance) the PDA and PLV", () => {
    for (const v of ["anomalous-lcx-right-sinus", "anomalous-lcx-from-rca"] as AnatomyVariant[])
      for (const dom of ["right", "left", "codominant"] as Dominance[]) {
        const model = buildAnatomy(mk(`av-if-${v}-${dom}`, [v], dom));
        const left = injectionFill(model, "left");
        const right = injectionFill(model, "right");
        for (const id of ["LCx", "OM1", "OM2"] as const) {
          expect(left, `${v} ${dom}: ${id} left`).not.toContain(id);
          expect(right, `${v} ${dom}: ${id} right`).toContain(id);
        }
        expect(left).toEqual(expect.arrayContaining(["LM", "LAD", "D1", "SEPTAL"]));
        expect(right).toEqual(expect.arrayContaining(["RCA", "CONUS", "AM", "PDA", "PLV"]));
        if (dom === "left") {
          expect(left).not.toContain("PDA");
          expect(left).not.toContain("PLV");
        }
      }
  });
});

describe("the RCA from the left sinus: the conus stays in the right sinus", () => {
  const c = mk("av-conus-rca-ls", ["anomalous-rca-left-sinus"]);
  const model = buildAnatomy(c);
  const usual = buildAnatomy(mk("av-conus-usual", []));
  const dist = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

  it("the conus ostium is the usual anatomy's, in the right sinus, far from the anomalous RCA, and the conus has its own ostium in the tree", () => {
    expect(dist(model.conus.pos, usual.conus.pos)).toBeLessThan(1e-9);
    expect(sinusOfPoint(model, model.conus.pos)).toBe("right");
    expect(engagementTargets(model).find((t) => t.vessel === "CONUS")?.sinus).toBe("right");
    expect(dist(model.conus.pos, model.rca.pos)).toBeGreaterThan(4 * CONUS_OVERSELECTION_THRESHOLDS.selDist);
    expect(dist(model.vessels.find((v) => v.id === "CONUS")!.points[0], model.conus.pos)).toBeLessThan(1e-9);
    const tree = buildCoronaryTree(model, c);
    expect(vessel(tree, "CONUS")!.parent).toBeUndefined();
    expect(sinusOfPoint(model, origin(tree, "CONUS"))).toBe("right");
  });

  it("simple engagement model: AL1 and JL4 seat selectively on the anomalous RCA without conus over-selection, AL1 with quality above 0.6", () => {
    for (const id of ["AL1", "JL4"]) {
      const s = findStartControls(c, id, "selective-rca", { conus: false });
      expect(s, `${id} seats on the RCA`).not.toBeNull();
      const e = computeEngagement(model, catheterById(id)!, s!, "intermediate");
      expect(e.conus).toBe(false);
      expect(e.target).toBe("right");
      if (id === "AL1") expect(e.quality).toBeGreaterThan(0.6);
    }
  });
});
