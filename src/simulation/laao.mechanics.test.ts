// LAAO device mechanics (structural-laao-device-mechanics): the deployment state machine per family,
// PASS with the module's numbers, filling and the modality offsets on sizing, the puncture against
// the CT morphology and the follow-up visit.
//   npx vitest run src/simulation/laao.mechanics.test.ts
import { describe, expect, it } from "vitest";
import {
  LAAO_SCENARIOS,
  LAAO_PRESET_IDS,
  LAAO_MECH,
  LA_LOADED_MMHG,
  LEAK_LIMIT_MM,
  CT_OVER_TOE_MM,
  CT_OVER_FLUORO_MM,
  FILL_GAIN_MM,
  FLUID_CHALLENGE_ML,
  MARKER_WALL_MIN_MM,
  SHEATH_MARKER_BEHIND_TIP_MM,
  TOE_ANGLES,
  assessFollowUp,
  assessLaao,
  assessSizing,
  createLaaoDeploy,
  deployComplication,
  deployEvents,
  deployPlan,
  deployUnsheathed,
  deviceLengthMm,
  expectedFollowUp,
  followUpFinding,
  laaoCoaxial,
  laaoDeployRun,
  laaoDeployStep,
  laaoPunctureQuality,
  laPressureAfterFluid,
  landingZoneDepthMm,
  loadedSizeMm,
  markerToWallMm,
  maxFluidMl,
  modalityReading,
  plugPositionFromSheath,
  plugSheathBands,
  punctureSite,
  releaseCheck,
  releaseCriteria,
  releaseDecisionCorrect,
  scoreLaao,
  scoreLaaoFollowUp,
  sizeForMaxDimension,
  sizeForMeasurements,
  toeMeasurementsAt,
  type DeployAction,
  type LaaoDeployState,
  type LaaoScenario,
} from "./laao";
import { assessTransseptal } from "./transseptal";

const byId = (id: string): LaaoScenario => {
  const s = LAAO_SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`missing scenario ${id}`);
  return s;
};

const CHECKS = (family: "plug" | "lobe-disc", tug = family === "plug" ? 3 : 2): DeployAction[] => [
  { kind: "measure-device" },
  { kind: "tug", tipBackCm: tug },
  ...TOE_ANGLES.map((angle) => ({ kind: "colour" as const, angle })),
  ...(family === "lobe-disc" ? ([{ kind: "check-shape" }, { kind: "wait", min: LAAO_MECH.lobeWaitMin }] as DeployAction[]) : []),
];

/** The plug technique on laao-plug: pull the sheath back, pigtail, sheath over it, pigtail out, wet connection, unsheathe with ventilation held. */
function plugDeployed(sizeMm = 33, shoulderMm = 2): { s: LaaoScenario; x: LaaoDeployState } {
  const s = byId("laao-plug");
  const tip = shoulderMm + SHEATH_MARKER_BEHIND_TIP_MM + deviceLengthMm("plug", sizeMm);
  const x = laaoDeployRun(s, createLaaoDeploy(s, "plug", sizeMm), [
    { kind: "sheath-across", cm: 2.5 },
    { kind: "pigtail" },
    { kind: "advance-sheath", mm: tip - LAAO_MECH.sheathStartMm },
    { kind: "remove-pigtail", holdSheath: true },
    { kind: "connect", wet: true },
    { kind: "ventilation", held: true },
    { kind: "unsheathe" },
  ]);
  return { s, x };
}

/** The lobe-and-disc technique on laao-lobe-disc: sheath to the ostium, wet connection, ball, ball to the landing zone, push to open the lobe, pull for the disc. */
function lobeDeployed(sizeMm = 25, lobeAtMm = 4.5): { s: LaaoScenario; x: LaaoDeployState } {
  const s = byId("laao-lobe-disc");
  const x = laaoDeployRun(s, createLaaoDeploy(s, "lobe-disc", sizeMm), [
    { kind: "advance-sheath", mm: 2 - LAAO_MECH.sheathStartMm },
    { kind: "connect", wet: true },
    { kind: "unsheathe" },
    { kind: "move-ball", toMm: lobeAtMm },
    { kind: "push-cable" },
    { kind: "unsheathe" },
  ]);
  return { s, x };
}

describe("presets", () => {
  it("the five presets are LAAO scenarios with their own design", () => {
    for (const id of LAAO_PRESET_IDS) expect(byId(id).vignette.toLowerCase()).toContain("synthetic");
    expect(byId("laao-plug").device).toBe("plug");
    expect(byId("laao-lobe-disc").device).toBe("lobe-disc");
    expect(byId("laao-underfilled").filling!.laMeanMmHg).toBeLessThan(LA_LOADED_MMHG);
    expect(byId("laao-reverse-chicken-wing").axis).toBe("reverse-posterior");
    expect(byId("laao-drt-followup").deployed).toBeTruthy();
    expect(byId("laao-drt-followup").followUp!.drt).toBe(true);
    // the earlier cases keep their defaults: loaded, the usual axis, no follow-up finding
    for (const id of ["laao-windsock", "laao-chicken-wing", "laao-cactus", "laao-cauliflower"]) {
      const s = byId(id);
      expect(s.filling ?? null).toBeNull();
      expect(s.axis ?? null).toBeNull();
      expect(toeMeasurementsAt(s, 14)).toEqual(s.measurements);
    }
  });

  it("the reverse chicken-wing preset carries the case's numbers: mean LA 8 mmHg, landing zone 18 mm dry, 22 mm loaded, CT 21 mm", () => {
    const s = byId("laao-reverse-chicken-wing");
    expect(s.filling!.laMeanMmHg).toBe(8);
    expect(modalityReading(s, "toe", 8).landingZoneMm).toBe(18);
    expect(modalityReading(s, "ct").landingZoneMm).toBe(21);
    expect(modalityReading(s, "toe", laPressureAfterFluid(s, 500)).landingZoneMm).toBe(22);
    // the case's example: 500 mL with an LVEF of 50% brings the pressure above 12 mmHg
    expect(laPressureAfterFluid(s, 500)).toBeGreaterThan(LA_LOADED_MMHG);
  });
});

describe("plug deployment", () => {
  it("the pigtail is steered only from 2–3 cm across the septum, and leads the sheath; the markers set the depth", () => {
    const s = byId("laao-plug");
    let x = createLaaoDeploy(s, "plug", 33);
    expect(x.sheathAcrossCm).toBe(4.5);
    x = laaoDeployStep(s, x, { kind: "pigtail" });
    expect(x.pigtail).toBe("none");
    expect(x.log[x.log.length - 1]).toMatch(/cannot be turned/);
    x = laaoDeployRun(s, x, [{ kind: "sheath-across", cm: 2.5 }, { kind: "pigtail" }]);
    expect(x.pigtail).toBe("in-lobe");
    // the distal marker sits 5 mm behind the tip; the proximal bands mark the loaded 21, 27 and 33 mm plugs
    expect(markerToWallMm(s, 20)).toBe(30 - (20 - 5));
    expect(plugSheathBands(30).map((b) => b.sizeMm)).toEqual([21, 27, 33]);
    expect(plugPositionFromSheath(30, 33)).toBeCloseTo(30 - 5 - 16.5, 9);
  });

  it("advancing the sheath without the pigtail, against the wall, or letting it creep as the pigtail comes out is flagged", () => {
    const s = byId("laao-plug");
    const bare = laaoDeployStep(s, createLaaoDeploy(s, "plug", 33), { kind: "advance-sheath", mm: 25 });
    expect(bare.flags.map((f) => f.id)).toContain("plug-no-pigtail");
    const led = laaoDeployRun(s, createLaaoDeploy(s, "plug", 33), [{ kind: "sheath-across", cm: 2.5 }, { kind: "pigtail" }, { kind: "advance-sheath", mm: 30 }]);
    expect(led.flags).toEqual([]);
    expect(markerToWallMm(s, led.sheathTipMm)).toBeGreaterThanOrEqual(MARKER_WALL_MIN_MM);
    const deep = laaoDeployStep(s, led, { kind: "advance-sheath", mm: 16 });
    expect(markerToWallMm(s, deep.sheathTipMm)).toBeLessThan(MARKER_WALL_MIN_MM);
    expect(deep.flags.map((f) => f.id)).toContain("marker-wall");
    expect(deep.traumaticMoves).toBe(1);
    const crept = laaoDeployStep(s, led, { kind: "remove-pigtail", holdSheath: false });
    expect(crept.sheathTipMm).toBe(led.sheathTipMm + LAAO_MECH.sheathCreepMm);
    expect(crept.flags.map((f) => f.id)).toContain("sheath-creep");
    expect(laaoDeployStep(s, led, { kind: "remove-pigtail", holdSheath: true }).flags).toEqual([]);
  });

  it("a dry connection lets air in: the context raises 'air' while the device is in the sheath", () => {
    const s = byId("laao-plug");
    const base = laaoDeployRun(s, createLaaoDeploy(s, "plug", 33), [{ kind: "sheath-across", cm: 2.5 }, { kind: "pigtail" }, { kind: "advance-sheath", mm: 30 }, { kind: "remove-pigtail", holdSheath: true }]);
    const dry = laaoDeployStep(s, base, { kind: "connect", wet: false });
    expect(dry.flags.find((f) => f.id === "dry-connection")!.severity).toBe("critical");
    expect(deployEvents(dry)).toEqual(["air"]);
    expect(deployComplication(dry)).toBe(true);
    const wet = laaoDeployStep(s, base, { kind: "connect", wet: true });
    expect(deployEvents(wet)).toEqual([]);
    // the pigtail must be out before the device goes in
    const early = laaoDeployRun(s, createLaaoDeploy(s, "plug", 33), [{ kind: "sheath-across", cm: 2.5 }, { kind: "pigtail" }, { kind: "connect", wet: true }]);
    expect(early.stage).toBe("sheath");
  });

  it("unsheathing with the cable held places the shoulder at the marker minus the device length; a push movement on the plug device is flagged", () => {
    const { s, x } = plugDeployed(33, 2);
    expect(x.stage).toBe("deployed");
    expect(x.positionMm).toBeCloseTo(2, 9);
    expect(x.flags).toEqual([]);
    expect(deployUnsheathed(x)).toBe(true);
    // the same sheath, but the cable pushed (the lobe-and-disc movement)
    const loaded = laaoDeployRun(s, createLaaoDeploy(s, "plug", 33), [
      { kind: "sheath-across", cm: 2.5 },
      { kind: "pigtail" },
      { kind: "advance-sheath", mm: 2 + 5 + 16.5 + 10 },
      { kind: "remove-pigtail", holdSheath: true },
      { kind: "connect", wet: true },
      { kind: "ventilation", held: true },
    ]);
    expect(deployUnsheathed(loaded)).toBe(false);
    const pushed = laaoDeployStep(s, loaded, { kind: "push-cable" });
    const f = pushed.flags.find((g) => g.id === "plug-push")!;
    expect(f).toBeTruthy();
    expect(f.severity).toBe("major");
    expect(f.tipId).toBe("structural-laao-plug-unsheathe");
    expect(pushed.positionMm).toBeCloseTo(2 + LAAO_MECH.plugPushMm, 9);
    expect(pushed.traumaticMoves).toBe(1);
    // the score counts it; the push adds effusion risk through the traumatic movement
    const sc = (st: LaaoDeployState) => assessLaao(s, deployPlan(st, { coaxial: true })).effusion.score;
    expect(sc(pushed)).toBeGreaterThan(sc(x));
    // unsheathing without ventilation held is a minor flag
    const noVent = laaoDeployStep(s, laaoDeployStep(s, loaded, { kind: "ventilation", held: false }), { kind: "unsheathe" });
    expect(noVent.flags.map((g) => g.id)).toEqual(["ventilation"]);
  });

  it("release before the PASS criteria is wrong: before the checks, or with a criterion unmet; after PASS with numbers it is right", () => {
    const { s, x } = plugDeployed(33, 2);
    // straight after unsheathing, no checks
    const early = laaoDeployStep(s, x, { kind: "release" });
    expect(early.stage).toBe("released");
    expect(early.release!.checksDone).toBe(false);
    expect(releaseDecisionCorrect(early.release)).toBe(false);
    expect(early.flags.map((f) => f.id)).toContain("release-early");
    // the tug at the wrong distance is not a valid check
    const badTug = laaoDeployRun(s, x, [...CHECKS("plug", 6), { kind: "release" }]);
    expect(badTug.release!.missing.join(" ")).toMatch(/tug/);
    expect(releaseDecisionCorrect(badTug.release)).toBe(false);
    // every check done, every criterion met
    const good = laaoDeployRun(s, x, [...CHECKS("plug"), { kind: "release" }]);
    expect(good.release).toEqual({ checksDone: true, missing: [], criteriaMet: true, unmet: [] });
    expect(releaseDecisionCorrect(good.release)).toBe(true);
    expect(good.flags).toEqual([]);
    // checks done but undersized: below 8% compression the size criterion is unmet
    const small = plugDeployed(27, 2);
    const smallRel = laaoDeployRun(small.s, small.x, [...CHECKS("plug"), { kind: "release" }]);
    expect(smallRel.release!.checksDone).toBe(true);
    expect(smallRel.release!.unmet).toContain("size");
    expect(releaseDecisionCorrect(smallRel.release)).toBe(false);
  });

  it("PASS with numbers: more than half the device beyond the ostium; at least 8% compression; leak under 3 mm", () => {
    const s = byId("laao-plug");
    const plan = (positionMm: number, sizeMm = 33) => ({ type: "plug" as const, sizeMm, positionMm, coaxial: true, recaptures: 0 });
    const len = deviceLengthMm("plug", 33);
    const pos = (p: number) => releaseCriteria(s, plan(p)).find((c) => c.id === "position")!.met;
    expect(pos(-len / 2 + 0.5)).toBe(true);
    expect(pos(-len / 2)).toBe(false);
    expect(assessLaao(s, plan(-len / 2 - 1)).pass.position.status).toBe("fail");
    expect(assessLaao(s, plan(-len / 2 + 1)).pass.position.status).toBe("borderline");
    expect(LEAK_LIMIT_MM).toBe(3);
  });

  it("recapture rules: partial up to the barbs and pull back; past the barbs the device is removed; never push a too-proximal device forward", () => {
    const { s, x } = plugDeployed(33, 7);
    const back = laaoDeployStep(s, x, { kind: "partial-recapture", advanceMm: -5 });
    expect(back.positionMm).toBeCloseTo(2, 9);
    expect(back.recaptures).toBe(1);
    expect(back.flags).toEqual([]);
    expect(back.measured).toBe(false);
    const barbs = laaoDeployStep(s, x, { kind: "partial-recapture", pastBarbs: true });
    expect(barbs.stage).toBe("removed");
    expect(barbs.flags.find((f) => f.id === "plug-past-barbs")!.severity).toBe("critical");
    const proud = plugDeployed(33, -4);
    const forward = laaoDeployStep(proud.s, proud.x, { kind: "partial-recapture", advanceMm: 5 });
    expect(forward.flags.find((f) => f.id === "plug-forward-recapture")!.severity).toBe("critical");
    // wrong size: full recapture and a new size
    const full = laaoDeployStep(s, x, { kind: "full-recapture" });
    expect(full.stage).toBe("loaded");
    const resized = laaoDeployStep(s, full, { kind: "new-device", sizeMm: 30 });
    expect(resized.sizeMm).toBe(30);
    expect(resized.devicesUsed).toBe(2);
  });
});

describe("lobe-and-disc deployment", () => {
  it("ball first, push the cable to open the lobe, pull the sheath for the disc", () => {
    const { s, x } = lobeDeployed();
    expect(x.stage).toBe("deployed");
    expect(x.positionMm).toBe(4.5);
    expect(x.flags).toEqual([]);
    expect(x.log.join(" ")).toMatch(/ball/);
    // the landing zone sits about 10 mm inside for 25 mm or less, 12 mm for 28 mm or more
    expect(landingZoneDepthMm(25)).toBe(10);
    expect(landingZoneDepthMm(28)).toBe(12);
    // pulling the sheath to open the lobe (the plug's movement) slips the device proximally and is flagged
    const ball = laaoDeployRun(s, createLaaoDeploy(s, "lobe-disc", 25), [
      { kind: "advance-sheath", mm: 12 },
      { kind: "connect", wet: true },
      { kind: "unsheathe" },
      { kind: "move-ball", toMm: 4.5 },
    ]);
    expect(ball.stage).toBe("ball");
    expect(deployUnsheathed(ball)).toBe(true);
    const pulled = laaoDeployStep(s, ball, { kind: "unsheathe" });
    expect(pulled.stage).toBe("lobe-open");
    expect(pulled.positionMm).toBe(4.5 - LAAO_MECH.lobeSlipMm);
    expect(pulled.flags.find((f) => f.id === "lobe-pull-sheath")!.tipId).toBe("structural-laao-disc-ball-push");
  });

  it("release before the criteria is wrong: no shape check or no wait; with every check and criterion it is right", () => {
    const { s, x } = lobeDeployed();
    const noWait = laaoDeployRun(s, x, [...CHECKS("lobe-disc").filter((a) => a.kind !== "wait"), { kind: "release" }]);
    expect(noWait.release!.checksDone).toBe(false);
    expect(noWait.release!.missing.join(" ")).toMatch(/wait/);
    expect(releaseDecisionCorrect(noWait.release)).toBe(false);
    const noShape = laaoDeployRun(s, x, [...CHECKS("lobe-disc").filter((a) => a.kind !== "check-shape"), { kind: "release" }]);
    expect(releaseDecisionCorrect(noShape.release)).toBe(false);
    const early = laaoDeployStep(s, x, { kind: "release" });
    expect(releaseDecisionCorrect(early.release)).toBe(false);
    const good = laaoDeployRun(s, x, [...CHECKS("lobe-disc"), { kind: "release" }]);
    expect(good.release).toEqual({ checksDone: true, missing: [], criteriaMet: true, unmet: [] });
    expect(releaseDecisionCorrect(good.release)).toBe(true);
    // the slipped lobe sits at the ostium: separation and the circumflex criterion fail
    const slipped = laaoDeployRun(s, createLaaoDeploy(s, "lobe-disc", 25), [
      { kind: "advance-sheath", mm: 12 },
      { kind: "connect", wet: true },
      { kind: "unsheathe" },
      { kind: "move-ball", toMm: 4.5 },
      { kind: "unsheathe" },
      { kind: "unsheathe" },
      ...CHECKS("lobe-disc"),
      { kind: "release" },
    ]);
    expect(slipped.release!.checksDone).toBe(true);
    expect(slipped.release!.criteriaMet).toBe(false);
    expect(releaseDecisionCorrect(slipped.release)).toBe(false);
  });

  it("the lobe-and-disc device is released with no device leak; a leak under 3 mm is borderline, not a pass", () => {
    const s = byId("laao-lobe-disc");
    const crit = releaseCriteria(s, { type: "lobe-disc", sizeMm: 22, positionMm: 4.5, coaxial: true, recaptures: 0 });
    const o = assessLaao(s, { type: "lobe-disc", sizeMm: 22, positionMm: 4.5, coaxial: true, recaptures: 0 });
    expect(o.leakMm).toBeGreaterThan(0);
    expect(crit.find((c) => c.id === "seal")!.met).toBe(false);
    if (o.leakMm < LEAK_LIMIT_MM) expect(o.pass.seal.status).toBe("borderline");
  });

  it("partial recapture to the lobe marker keeps the device; anchors in the sheath remove it, and redeploying it anyway is critical", () => {
    const { s, x } = lobeDeployed();
    const marker = laaoDeployStep(s, x, { kind: "partial-recapture" });
    expect(marker.stage).toBe("ball");
    expect(marker.flags).toEqual([]);
    const anchors = laaoDeployStep(s, x, { kind: "partial-recapture", anchorsIn: true });
    expect(anchors.stage).toBe("removed");
    expect(anchors.anchorsInSheath).toBe(true);
    expect(anchors.flags.find((f) => f.id === "anchors-in-sheath")!.tipId).toBe("structural-laao-anchors-in-sheath");
    expect(deployComplication(anchors)).toBe(true);
    const reload = laaoDeployStep(s, anchors, { kind: "new-device" });
    expect(reload.anchorsInSheath).toBe(false);
    expect(reload.flags.map((f) => f.id)).toEqual(["anchors-in-sheath"]);
    const same = laaoDeployStep(s, anchors, { kind: "redeploy-same" });
    expect(same.flags.find((f) => f.id === "redeploy-damaged")!.severity).toBe("critical");
    expect(same.anchorsDamaged).toBe(true);
    const plan = { type: "lobe-disc" as const, sizeMm: 25, positionMm: 4.5, coaxial: true, recaptures: 1 };
    expect(assessLaao(s, { ...plan, anchorsDamaged: true }).anchor).not.toBe("stable");
    expect(assessLaao(s, plan).anchor).toBe("stable");
  });
});

describe("filling and the modality offsets", () => {
  it("sizing from an underfilled TOE measurement selects a smaller device than after the fluid challenge", () => {
    const s = byId("laao-underfilled");
    const la0 = s.filling!.laMeanMmHg;
    expect(la0).toBeLessThan(LA_LOADED_MMHG);
    const dry = toeMeasurementsAt(s, la0);
    const ml = 750;
    expect(ml).toBeGreaterThanOrEqual(FLUID_CHALLENGE_ML[0]);
    expect(ml).toBeLessThanOrEqual(Math.min(FLUID_CHALLENGE_ML[1], maxFluidMl(s)));
    const la1 = laPressureAfterFluid(s, ml);
    expect(la1).toBeGreaterThan(LA_LOADED_MMHG);
    const filled = toeMeasurementsAt(s, la1);
    // filling enlarges the ostium and depth by about 2 mm
    for (let i = 0; i < 4; i++) {
      expect(filled[i].ostiumMm - dry[i].ostiumMm).toBeCloseTo(FILL_GAIN_MM, 9);
      expect(filled[i].depthMm - dry[i].depthMm).toBeCloseTo(FILL_GAIN_MM, 9);
    }
    for (const type of ["plug", "lobe-disc"] as const) expect(sizeForMeasurements(type, dry)).toBeLessThan(sizeForMeasurements(type, filled));
    // the dry size fails the sizing decision; the loaded one passes it
    const dryPlug = sizeForMeasurements("plug", dry);
    expect(assessSizing(s, "plug", dryPlug, [la0, la0, la0, la0]).correct).toBe(false);
    expect(assessSizing(s, "plug", sizeForMeasurements("plug", filled), [la1, la1, la1, la1]).correct).toBe(true);
    expect(loadedSizeMm(s, "plug")).toBe(sizeForMeasurements("plug", filled));
    // and the dry device does not anchor in the loaded appendage
    expect(assessLaao(s, { type: "plug", sizeMm: dryPlug, positionMm: 2, coaxial: true, recaptures: 0 }).anchor).not.toBe("stable");
  });

  it("an intermediate pressure measures between dry and loaded; the pressure rises with fluid by LV function", () => {
    const s = byId("laao-underfilled");
    const mid = toeMeasurementsAt(s, 9.5)[0].ostiumMm;
    expect(mid).toBeGreaterThan(toeMeasurementsAt(s, 7)[0].ostiumMm);
    expect(mid).toBeLessThan(toeMeasurementsAt(s, 13)[0].ostiumMm);
    expect(laPressureAfterFluid(s, 0)).toBe(7);
    expect(laPressureAfterFluid(s, 500)).toBe(7 + 2 * LAAO_MECH.fluidMmHgPer250.normal);
    expect(maxFluidMl({ ...s, filling: { laMeanMmHg: 7, lv: "impaired" } })).toBe(LAAO_MECH.fluidMaxMl.impaired);
  });

  it("CT reads 1–3 mm above 2D TOE and 2–4 mm above fluoroscopy", () => {
    for (const s of LAAO_SCENARIOS) {
      const ct = modalityReading(s, "ct");
      const toe = modalityReading(s, "toe");
      const fl = modalityReading(s, "fluoro");
      expect(ct.ostiumMm - toe.ostiumMm).toBeGreaterThanOrEqual(CT_OVER_TOE_MM[0]);
      expect(ct.ostiumMm - toe.ostiumMm).toBeLessThanOrEqual(CT_OVER_TOE_MM[1]);
      expect(ct.ostiumMm - fl.ostiumMm).toBeGreaterThanOrEqual(CT_OVER_FLUORO_MM[0]);
      expect(ct.ostiumMm - fl.ostiumMm).toBeLessThanOrEqual(CT_OVER_FLUORO_MM[1]);
    }
    // sizing from fluoroscopy alone undersizes relative to CT
    const s = byId("laao-windsock");
    expect(sizeForMaxDimension("plug", modalityReading(s, "fluoro").ostiumMm)).toBeLessThan(sizeForMaxDimension("plug", modalityReading(s, "ct").ostiumMm));
  });
});

describe("puncture from the CT", () => {
  const IP = { si: -0.5, ap: -0.4 };
  const IC = { si: -0.5, ap: 0.05 };
  const IA = { si: -0.5, ap: 0.35 };

  it("an inferior-posterior puncture in 'laao-reverse-chicken-wing' gives coaxial false; inferior-central or inferior-anterior is coaxial", () => {
    const s = byId("laao-reverse-chicken-wing");
    expect(punctureSite(IP)).toBe("inferior-posterior");
    expect(punctureSite(IC)).toBe("inferior-central");
    expect(punctureSite(IA)).toBe("inferior-anterior");
    expect(laaoCoaxial(s, IP, 3.4)).toBe(false);
    expect(laaoCoaxial(s, IC, 3.4)).toBe(true);
    expect(laaoCoaxial(s, IA, 3.4)).toBe(true);
    expect(laaoPunctureQuality(s, IP, 3.4)).toBe("acceptable");
    expect(laaoPunctureQuality(s, IC, 3.4)).toBe("ideal");
    // superior or danger sites are never coaxial
    expect(laaoCoaxial(s, { si: 0.4, ap: 0.1 }, 3.4)).toBe(false);
    expect(laaoCoaxial(s, { si: -0.5, ap: 0.7 }, 3.4)).toBe(false);
  });

  it("the usual appendage keeps assessTransseptal's answer (unchanged results)", () => {
    for (const id of ["laao-windsock", "laao-chicken-wing", "laao-cactus", "laao-cauliflower", "laao-plug", "laao-underfilled"]) {
      const s = byId(id);
      for (const p of [IP, IC, IA, { si: 0.4, ap: -0.2 }, { si: 0, ap: 0 }]) {
        const ts = assessTransseptal("laao", p, 3.4);
        expect(laaoCoaxial(s, p, 3.4)).toBe(ts.coaxialForLaa);
        expect(laaoPunctureQuality(s, p, 3.4)).toBe(ts.quality);
      }
    }
  });
});

describe("follow-up", () => {
  it("DRT without anticoagulation is wrong; anticoagulation until it has resolved is right", () => {
    const s = byId("laao-drt-followup");
    const f = followUpFinding(s, assessLaao(s, s.deployed!).leakMm);
    expect(f.drt).toBe(true);
    expect(f.weeks).toBeGreaterThanOrEqual(6);
    expect(f.weeks).toBeLessThanOrEqual(12);
    expect(expectedFollowUp(f)).toBe("anticoagulate-until-resolved");
    for (const a of ["continue-plan", "reimage-leak", "anticoagulate-or-close-leak", "stop-antithrombotics"] as const) expect(assessFollowUp(f, a).correct).toBe(false);
    expect(assessFollowUp(f, "anticoagulate-until-resolved").correct).toBe(true);
    expect(scoreLaaoFollowUp(f, "continue-plan").score).toBeLessThan(50);
    expect(scoreLaaoFollowUp(f, "anticoagulate-until-resolved").score).toBe(100);
  });

  it("leaks: none continues the plan, a small one is imaged again, 5 mm or more gets anticoagulation or closure", () => {
    const base = { weeks: 8, drt: false, drtMm: 0 };
    expect(expectedFollowUp({ ...base, leakMm: 0 })).toBe("continue-plan");
    expect(expectedFollowUp({ ...base, leakMm: 2 })).toBe("reimage-leak");
    expect(expectedFollowUp({ ...base, leakMm: 5 })).toBe("anticoagulate-or-close-leak");
    expect(assessFollowUp({ ...base, leakMm: 0 }, "stop-antithrombotics").correct).toBe(false);
    // without a scenario finding the leak is the released device's
    expect(followUpFinding(byId("laao-windsock"), 1.5)).toEqual({ weeks: 8, drt: false, drtMm: 0, leakMm: 1.5 });
  });
});

describe("the mechanics score", () => {
  it("a clean run keeps the earlier score; flags, an early release, a dry sizing and a wrong follow-up are deducted", () => {
    const { s, x } = plugDeployed(33, 2);
    const good = laaoDeployRun(s, x, [...CHECKS("plug"), { kind: "release" }]);
    const plan = deployPlan(good, { coaxial: true });
    const inp = { plan, anglesMeasured: [...TOE_ANGLES], transseptalQuality: "ideal" as const, transseptalDanger: false, released: true };
    const plain = scoreLaao(s, inp);
    const clean = scoreLaao(s, { ...inp, mechanics: { deploy: good, laAtMeasureMmHg: [14, 14, 14, 14], fluidMl: 0, coaxial: true, followUp: "continue-plan" } });
    expect(clean).toEqual(plain);
    const early = laaoDeployStep(s, x, { kind: "release" });
    const bad = scoreLaao(s, { ...inp, plan: deployPlan(early, { coaxial: true }), mechanics: { deploy: early, laAtMeasureMmHg: [8, 8, 8, 8], fluidMl: 0, coaxial: true, followUp: "stop-antithrombotics" } });
    expect(bad.score).toBeLessThan(clean.score);
    expect(bad.deductions.some((d) => /Released before the release checks/.test(d.reason))).toBe(true);
    expect(bad.deductions.some((d) => /dry appendage/.test(d.reason))).toBe(true);
    expect(bad.deductions.some((d) => /No antithrombotic/.test(d.reason))).toBe(true);
    // the reverse chicken-wing: a non-coaxial (inferior-posterior) puncture is deducted
    const rw = byId("laao-reverse-chicken-wing");
    const rwInp = { ...inp, plan: { type: "lobe-disc" as const, sizeMm: 25, positionMm: 4.5, coaxial: false, recaptures: 0 } };
    const rx = scoreLaao(rw, { ...rwInp, mechanics: { deploy: good, laAtMeasureMmHg: [13, 13, 13, 13], fluidMl: 500, coaxial: false } });
    expect(rx.deductions.some((d) => /Puncture site not chosen from the CT/.test(d.reason))).toBe(true);
  });

  it("release checks for a plan the deployment produced agree with releaseCheck", () => {
    const { s, x } = plugDeployed(33, 2);
    const done = laaoDeployRun(s, x, CHECKS("plug"));
    expect(releaseCheck(s, done, true)).toEqual({ checksDone: true, missing: [], criteriaMet: true, unmet: [] });
    expect(releaseCheck(s, done, false).criteriaMet).toBe(assessLaao(s, deployPlan(done, { coaxial: false })).leakMm < LEAK_LIMIT_MM && assessLaao(s, deployPlan(done, { coaxial: false })).anchor === "stable");
  });
});

describe("review fixes", () => {
  it("a full recapture puts the sheath back over the plug: an unsheathe in place redeploys it where it was, with no new flag", () => {
    const { s, x } = plugDeployed(33, 2);
    expect(x.positionMm).toBeCloseTo(2, 9);
    const full = laaoDeployStep(s, x, { kind: "full-recapture" });
    expect(full.stage).toBe("loaded");
    expect(full.sheathTipMm).toBeCloseTo(2 + SHEATH_MARKER_BEHIND_TIP_MM + deviceLengthMm("plug", 33), 9);
    const again = laaoDeployStep(s, full, { kind: "unsheathe" });
    expect(again.positionMm).toBeCloseTo(2, 9);
    expect(again.flags).toEqual(x.flags);
    // a partial recapture, then a full one, redeploys at the partly recaptured position
    const back = laaoDeployStep(s, x, { kind: "partial-recapture", advanceMm: -1 });
    const again2 = laaoDeployRun(s, back, [{ kind: "full-recapture" }, { kind: "unsheathe" }]);
    expect(again2.positionMm).toBeCloseTo(1, 9);
    expect(again2.flags).toEqual(x.flags);
  });

  it("the unsheathed plug's sheath offset is the named model parameter", () => {
    const { x } = plugDeployed(33, 2);
    expect(x.sheathTipMm).toBeCloseTo(x.positionMm - LAAO_MECH.sheathBehindPlugMm, 9);
  });

  it("sizing in an already loaded atrium with one plane skipped is still loaded; the missing plane is scoreLaao's own deduction", () => {
    const s = byId("laao-plug");
    const v = assessSizing(s, "plug", loadedSizeMm(s, "plug"), [14, 14, 14]);
    expect(v.loaded).toBe(true);
    expect(v.correct).toBe(true);
    expect(assessSizing(s, "plug", loadedSizeMm(s, "plug"), []).loaded).toBe(false);
    expect(assessSizing(s, "plug", loadedSizeMm(s, "plug"), [14, 14, 10]).loaded).toBe(false);
  });

  it("the lobe-and-disc delivery sheath advanced against or through the wall is a traumatic flag", () => {
    const s = byId("laao-lobe-disc");
    const ok = laaoDeployStep(s, createLaaoDeploy(s, "lobe-disc", 25), { kind: "advance-sheath", mm: 12 });
    expect(ok.flags).toEqual([]);
    const deep = laaoDeployStep(s, createLaaoDeploy(s, "lobe-disc", 25), { kind: "advance-sheath", mm: 50 });
    const f = deep.flags.find((x) => x.id === "sheath-wall");
    expect(f?.severity).toBe("major");
    expect(deep.traumaticMoves).toBe(1);
    // the ball carried into the wall with the sheath also counts
    const ball = laaoDeployRun(s, createLaaoDeploy(s, "lobe-disc", 25), [{ kind: "advance-sheath", mm: 12 }, { kind: "connect", wet: true }, { kind: "unsheathe" }, { kind: "move-ball", toMm: 14 }]);
    expect(ball.flags.map((x) => x.id)).toContain("sheath-wall");
  });

  it("reverse chicken-wing: a mid-fossa central or anterior site is acceptable and coaxial (the planning list), below the inferior best answer; superior stays poor", () => {
    const s = byId("laao-reverse-chicken-wing");
    const midAnterior = { si: 0.05, ap: 0.25 };
    expect(punctureSite(midAnterior)).toBe("mid-or-superior");
    expect(laaoPunctureQuality(s, midAnterior, 3.4)).toBe("acceptable");
    expect(laaoCoaxial(s, midAnterior, 3.4)).toBe(true);
    expect(laaoPunctureQuality(s, { si: -0.5, ap: 0.05 }, 3.4)).toBe("ideal");
    expect(laaoPunctureQuality(s, { si: 0.6, ap: 0.1 }, 3.4)).toBe("poor");
    expect(laaoPunctureQuality(s, { si: 0.05, ap: -0.4 }, 3.4)).toBe("poor");
    expect(laaoCoaxial(s, { si: 0.05, ap: -0.4 }, 3.4)).toBe(false);
  });

  it("the reverse chicken-wing debrief never says 'not inferior and posterior'; the usual appendage keeps that reason", () => {
    const rw = byId("laao-reverse-chicken-wing");
    const { x } = plugDeployed(33, 2);
    const plan = { type: "lobe-disc" as const, sizeMm: 25, positionMm: 4.5, coaxial: false, recaptures: 0 };
    const base = { plan, anglesMeasured: [...TOE_ANGLES], transseptalDanger: false, released: true };
    for (const p of [{ si: -0.51, ap: -0.2 }, { si: -0.5, ap: -0.4 }, { si: 0.05, ap: 0.25 }, { si: 0.6, ap: 0.1 }]) {
      const q = laaoPunctureQuality(rw, p, 3.4);
      const coaxial = laaoCoaxial(rw, p, 3.4);
      for (const mechanics of [undefined, { deploy: x, laAtMeasureMmHg: [13, 13, 13, 13], fluidMl: 0, coaxial }]) {
        const r = scoreLaao(rw, { ...base, plan: { ...plan, coaxial }, transseptalQuality: q, mechanics });
        expect(r.deductions.some((d) => /not inferior and posterior|Superior transseptal site/.test(d.reason))).toBe(false);
      }
    }
    // an inferior-posterior site in the hands-on run is the CT deduction alone, not a second site deduction
    const ip = { si: -0.51, ap: -0.2 };
    const r = scoreLaao(rw, { ...base, transseptalQuality: laaoPunctureQuality(rw, ip, 3.4), mechanics: { deploy: x, laAtMeasureMmHg: [13, 13, 13, 13], fluidMl: 0, coaxial: laaoCoaxial(rw, ip, 3.4) } });
    expect(r.deductions.filter((d) => /[Tt]ransseptal site|Puncture site/.test(d.reason)).map((d) => d.reason)).toEqual([
      "Puncture site not chosen from the CT: this appendage needs an inferior but central or anterior site.",
    ]);
    // without the hands-on record the site reason names the site this appendage needs
    const plain = scoreLaao(rw, { ...base, transseptalQuality: "acceptable" });
    expect(plain.deductions.some((d) => /inferior central or anterior/.test(d.reason))).toBe(true);
    expect(scoreLaao(byId("laao-plug"), { ...base, transseptalQuality: "acceptable" }).deductions.some((d) => /not inferior and posterior/.test(d.reason))).toBe(true);
  });

  it("a lobe set beyond the usable depth fails the tyre criterion, and the text names the overshoot", () => {
    const s = byId("laao-lobe-disc");
    const minDepth = Math.min(...s.measurements.map((m) => m.depthMm));
    const deep = { type: "lobe-disc" as const, sizeMm: 25, positionMm: minDepth, coaxial: true, recaptures: 0 };
    const o = assessLaao(s, deep);
    expect(o.overshootMm).toBeGreaterThan(0);
    const tyre = releaseCriteria(s, deep).find((c) => c.id === "tyre")!;
    expect(tyre.met).toBe(false);
    expect(tyre.text).toMatch(/beyond the usable depth/);
    expect(tyre.text).toContain(o.overshootMm.toFixed(1));
    // a lobe within the depth keeps its usual text
    const ok = releaseCriteria(s, { ...deep, positionMm: 4.5 }).find((c) => c.id === "tyre")!;
    expect(ok.text).not.toMatch(/beyond the usable depth/);
  });
});
