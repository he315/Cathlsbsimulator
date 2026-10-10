// Tip integration of the LAAO device mechanics (structural-laao-device-mechanics), driven from the
// presets of src/content/lab/presets/structural/laao.launch.ts: the launch links and the practice
// index, the tips at the position and deploy phases of a plug deployment, the deployment's air and
// complication, the follow-up visit, and the waiting.ts entries naming this package.
//   npx vitest run src/ui/lab/structuralTips.laao.test.ts
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { LAB_TIPS, TIP_BY_ID, tipsFor, type LabContext, type LabTip, type TipTrigger } from "../../content/lab/tips";
import { WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import { buildKnownLaunch } from "../../content/validateLaunch";
import { launch } from "../../content/lab/presets/structural/laao.launch";
import { launch as coreLaunch } from "../../content/lab/presets/structural/core.launch";
import { launch as tsLaunch } from "../../content/lab/presets/structural/transseptal.launch";
import { LAAO_MECH, LAAO_PRESET_IDS, LAAO_SCENARIOS, SHEATH_MARKER_BEHIND_TIP_MM, appendageWallMm, createLaaoDeploy, deviceLengthMm, laaoDeployRun, laaoDeployStep, type LaaoDeployState, type LaaoScenario } from "../../simulation/laao";
import { createTransseptal } from "../../simulation/transseptal";
import { practiceForLesson } from "../content/practiceIndex";
import { resolveStructuralLaunch } from "../sections/StructuralLab";
import LaaoLab, { CritRow, laaoLabTipContext, launchStep } from "../structural/LaaoLab";
import { LaaFluoroView } from "../structural/LaaoViews";
import { LAAO_STEPS, raises } from "./structuralTips";

const PKG = "structural-laao-device-mechanics";
const LESSONS = ["hb-mitral-tricuspid-laa-laao-implant", "hb-mitral-tricuspid-laa-laao-plan"];
const ids = (ctx: LabContext | null) => (ctx ? tipsFor(ctx, 20).map((t) => t.id) : []);
const ts = createTransseptal({ host: "laao" });
const byId = (id: string): LaaoScenario => LAAO_SCENARIOS.find((x) => x.id === id)!;

/** The same rule as reachability.test.ts: a trigger can match given what a lab raises. */
function satisfiable(tip: LabTip, when: TipTrigger, r: LabRaises): boolean {
  if (tip.lab !== r.lab) return false;
  const any = (want: readonly string[] | undefined, have: readonly string[] | undefined) => !want?.length || want.some((x) => (have ?? []).includes(x));
  return (
    any(when.phase, r.phases) &&
    any(when.event, r.events) &&
    (when.requires ?? []).every((e) => r.events.includes(e)) &&
    any(when.procedure, r.procedures) &&
    any(when.route, r.routes) &&
    any(when.technique, r.techniques) &&
    any(when.imaging, r.imaging)
  );
}

describe("launch links", () => {
  it("declares the five presets, and only those, under the laao sim; each is a LAAO scenario", () => {
    expect(launch.sim).toBe("laao");
    expect(launch.scenarios!.map((x) => x.id).sort()).toEqual([...LAAO_PRESET_IDS].sort());
    for (const id of LAAO_PRESET_IDS) expect(LAAO_SCENARIOS.some((s) => s.id === id)).toBe(true);
    // no preset is declared twice
    const core = coreLaunch.scenarios!.map((x) => x.id);
    for (const id of LAAO_PRESET_IDS) expect(core).not.toContain(id);
    const known = buildKnownLaunch({ "laao.launch.ts": { launch }, "core.launch.ts": { launch: coreLaunch }, "transseptal.launch.ts": { launch: tsLaunch } });
    expect(known.problems).toEqual([]);
  });

  it("each preset opens at its TOE measurements, the follow-up drill at the follow-up visit", () => {
    for (const sc of launch.scenarios!) {
      const starts = (sc.starts ?? []).map((x) => (typeof x === "string" ? x : x.id));
      if (sc.id === "laao-drt-followup") expect(starts).toEqual(["followup"]);
      else {
        expect(starts).toEqual(["measure"]);
        expect(LAAO_STEPS as readonly string[]).toContain("measure");
      }
      for (const st of starts) expect(launchStep(byId(sc.id), st)).toBe(st);
      expect(sc.heldOut).toBeFalsy();
    }
    // a follow-up start without a released device opens at the measurements
    expect(launchStep(byId("laao-plug"), "followup")).toBe("measure");
  });

  it("the follow-up drill opens at the follow-up visit with no start (practice entries, the scenario select, a restart)", () => {
    expect(launchStep(byId("laao-drt-followup"), null)).toBe("followup");
    expect(launchStep(byId("laao-drt-followup"), "followup")).toBe("followup");
    for (const id of ["laao-plug", "laao-lobe-disc", "laao-underfilled", "laao-reverse-chicken-wing"]) expect(launchStep(byId(id), null)).toBe("measure");
  });

  it("practiceIndex lists every scenario in src/content/lab/presets/structural/laao.launch.ts under lessons hb-mitral-tricuspid-laa-laao-implant, hb-mitral-tricuspid-laa-laao-plan", () => {
    for (const lessonId of LESSONS) {
      const listed = practiceForLesson(lessonId).filter((e) => e.source.endsWith("presets/structural/laao.launch.ts"));
      for (const id of LAAO_PRESET_IDS) {
        const entry = listed.find((e) => e.scenario === id);
        expect(entry, `${id} under ${lessonId}`).toBeTruthy();
        expect(entry!.sim).toBe("laao");
        expect(entry!.params.scenario).toBe(id);
      }
    }
  });

  it("a launch of any preset opens the LAAO procedure, whichever sim the link names", () => {
    for (const id of LAAO_PRESET_IDS) {
      expect(resolveStructuralLaunch("laao", { scenario: id })).toMatchObject({ tab: "laao", scenario: id });
      expect(resolveStructuralLaunch("tavi", { scenario: id, start: "measure" })).toMatchObject({ tab: "laao", scenario: id, start: "measure" });
    }
    expect(resolveStructuralLaunch("laao", { scenario: "laao-drt-followup", start: "followup" })).toMatchObject({ tab: "laao", start: "followup" });
  });
});

/** laao-plug up to the sheath over the pigtail, then the device in and unsheathed. */
function plugRun(): { s: LaaoScenario; sheath: LaaoDeployState; loaded: LaaoDeployState; out: LaaoDeployState } {
  const s = byId("laao-plug");
  const tip = 2 + 5 + deviceLengthMm("plug", 33);
  const sheath = laaoDeployRun(s, createLaaoDeploy(s, "plug", 33), [{ kind: "sheath-across", cm: 2.5 }, { kind: "pigtail" }, { kind: "advance-sheath", mm: tip - LAAO_MECH.sheathStartMm }]);
  const loaded = laaoDeployRun(s, sheath, [{ kind: "remove-pigtail", holdSheath: true }, { kind: "connect", wet: true }, { kind: "ventilation", held: true }]);
  const out = laaoDeployStep(s, loaded, { kind: "unsheathe" });
  return { s, sheath, loaded, out };
}

describe("tips in a scenario", () => {
  it("in 'laao-plug', at phase 'position', tipsFor(ctx, 20) includes structural-laao-pigtail-leads, and at phase 'deploy' it includes structural-laao-plug-unsheathe", () => {
    const { sheath, loaded, out } = plugRun();
    // the sheath is being placed over the pigtail: deploy with position
    const pos = laaoLabTipContext("deploy", sheath, ts)!;
    expect(pos).toMatchObject({ lab: "structural", phase: "deploy", procedures: ["laao"], phases: ["position"] });
    expect(ids(pos)).toContain("structural-laao-pigtail-leads");
    expect(ids(pos)).toContain("structural-laao-plug-unsheathe");
    // the device is in the sheath, not yet unsheathed: still position
    expect(ids(laaoLabTipContext("deploy", loaded, ts))).toContain("structural-laao-pigtail-leads");
    // unsheathing: deploy only; the pigtail tip goes
    const dep = laaoLabTipContext("deploy", out, ts)!;
    expect(dep.phase).toBe("deploy");
    expect(dep.phases ?? []).not.toContain("position");
    expect(ids(dep)).toContain("structural-laao-plug-unsheathe");
    expect(ids(dep)).not.toContain("structural-laao-pigtail-leads");
    // the release checks are the assessment: PASS
    expect(ids(laaoLabTipContext("pass", out, ts))).toContain("structural-laao-plug-pass");
  });

  it("the size step is the plan: fill before sizing and size from the largest measurement", () => {
    const ctx = laaoLabTipContext("size", null, ts)!;
    expect(ctx.phase).toBe("plan");
    expect(ids(ctx)).toEqual(expect.arrayContaining(["structural-laao-fill-before-sizing", "structural-laao-largest-measurement", "structural-laao-puncture-from-ct"]));
  });

  it("the lobe-and-disc device: ball and push at deploy; anchors in the sheath add the complication phase and the bailout tip", () => {
    const s = byId("laao-lobe-disc");
    const ball = laaoDeployRun(s, createLaaoDeploy(s, "lobe-disc", 25), [{ kind: "advance-sheath", mm: 12 }, { kind: "connect", wet: true }, { kind: "unsheathe" }]);
    expect(ids(laaoLabTipContext("deploy", ball, ts))).toContain("structural-laao-disc-ball-push");
    const out = laaoDeployRun(s, ball, [{ kind: "move-ball", toMm: 4.5 }, { kind: "push-cable" }, { kind: "unsheathe" }]);
    expect(ids(laaoLabTipContext("pass", out, ts))).toContain("structural-laao-disc-criteria");
    const anchors = laaoDeployStep(s, out, { kind: "partial-recapture", anchorsIn: true });
    const ctx = laaoLabTipContext("deploy", anchors, ts)!;
    expect(ctx.phases).toContain("complication");
    expect(ids(ctx)).toContain("structural-laao-anchors-in-sheath");
    expect(ids(ctx)[0]).toBe("structural-laao-anchors-in-sheath");
  });

  it("air from a dry connection: the deploy context raises 'air' with the complication phase", () => {
    const { s, sheath } = plugRun();
    const dry = laaoDeployRun(s, sheath, [{ kind: "remove-pigtail", holdSheath: true }, { kind: "connect", wet: false }]);
    const ctx = laaoLabTipContext("deploy", dry, ts)!;
    expect(ctx.events).toContain("air");
    expect(ctx.phases).toContain("complication");
    expect(raises.events).toContain("air");
    const wet = laaoDeployRun(s, sheath, [{ kind: "remove-pigtail", holdSheath: true }, { kind: "connect", wet: true }]);
    expect(laaoLabTipContext("deploy", wet, ts)!.events).not.toContain("air");
  });

  it("the follow-up visit is the assessment: the device-related thrombus tip appears", () => {
    const ctx = laaoLabTipContext("followup", null, ts)!;
    expect(ctx.phase).toBe("assess");
    expect(ids(ctx)).toContain("structural-laao-drt-anticoagulate");
    expect(laaoLabTipContext("debrief", null, ts)).toBeNull();
  });

  it("every context the lab reports uses the structural raises", () => {
    const { sheath, out } = plugRun();
    for (const ctx of [laaoLabTipContext("deploy", sheath, ts), laaoLabTipContext("pass", out, ts), laaoLabTipContext("followup", null, ts)]) {
      expect(ctx!.lab).toBe(raises.lab);
      expect(raises.phases).toContain(ctx!.phase);
      for (const p of ctx!.phases ?? []) expect(raises.phases).toContain(p);
      for (const e of ctx!.events ?? []) expect(raises.events).toContain(e);
      for (const p of ctx!.procedures ?? []) expect(raises.procedures ?? []).toContain(p);
    }
  });
});

describe("raises and waiting.ts", () => {
  it("every waiting.ts entry naming structural-laao-device-mechanics becomes satisfiable (there are none, so the structural waiting count is unchanged)", () => {
    const WAITING = WAITING_TIPS.filter((g) => g.raisedBy === PKG).flatMap((g) => g.tips);
    expect(WAITING).toEqual([]);
    expect(WAITING.filter((id) => !(TIP_BY_ID[id] && satisfiable(TIP_BY_ID[id], TIP_BY_ID[id].when, raises)))).toEqual([]);
    // the ten LAAO tips the requests name were made satisfiable by structural-tips-and-tavi-course; this lab now shows each of them
    const laao = LAB_TIPS.filter((t) => t.id.startsWith("structural-laao-")).map((t) => t.id);
    expect(laao.length).toBe(10);
    for (const id of laao) expect(satisfiable(TIP_BY_ID[id], TIP_BY_ID[id].when, raises), id).toBe(true);
    const { sheath, out } = plugRun();
    const lobe = byId("laao-lobe-disc");
    const lobeBall = laaoDeployRun(lobe, createLaaoDeploy(lobe, "lobe-disc", 25), [{ kind: "advance-sheath", mm: 12 }, { kind: "connect", wet: true }, { kind: "unsheathe" }]);
    const anchors = laaoDeployRun(lobe, lobeBall, [{ kind: "push-cable" }, { kind: "unsheathe" }, { kind: "partial-recapture", anchorsIn: true }]);
    const shown = new Set(
      [laaoLabTipContext("size", null, ts), laaoLabTipContext("deploy", sheath, ts), laaoLabTipContext("deploy", out, ts), laaoLabTipContext("pass", out, ts), laaoLabTipContext("deploy", anchors, ts), laaoLabTipContext("followup", null, ts)].flatMap(ids)
    );
    expect(laao.filter((id) => !shown.has(id))).toEqual([]);
  });
});

describe("the lab renders what an operator sees", () => {
  it("the measure step shows the planning CT and the four planes; no device verdict", () => {
    const html = renderToString(createElement(LaaoLab, {}));
    expect(html).toContain("Measure at each angle");
    expect(html).toContain("Planning CT");
    expect(html).not.toMatch(/not met|criteria met/);
  });

  it("the fluoroscopy draws the sheath, its distal and three proximal bands and the pigtail; numbers only as guided aids", () => {
    const { s, sheath } = plugRun();
    const m = s.measurements.find((x) => x.angle === 135)!;
    const props = { m, sheathTipMm: sheath.sheathTipMm, pigtail: sheath.pigtail, family: "plug" as const, device: null, opacified: true, markerToWallMm: 12 };
    const html = renderToString(createElement(LaaFluoroView, { ...props, aids: false }));
    expect(html).toContain('data-marker="distal"');
    for (const b of [21, 27, 33]) expect(html).toContain(`data-marker="band-${b}"`);
    expect(html).toContain('data-pigtail="in-lobe"');
    expect(html).not.toContain("Guided aid");
    expect(renderToString(createElement(LaaFluoroView, { ...props, aids: true }))).toContain("Guided aid: distal marker to wall 12 mm");
  });

  it("a release criterion shows only the observation without guided aids; the verdict is a guided aid", () => {
    const c = { met: false, text: "Leak 3.5 mm (under 3 mm in all four planes)." };
    const plain = renderToString(createElement(CritRow, { letter: "S", title: "Seal", c, shown: true, hidden: "Colour Doppler in every plane.", aids: false }));
    expect(plain).toContain("Leak 3.5 mm");
    expect(plain).not.toMatch(/not met|>met</);
    expect(plain).not.toMatch(/text-good|text-danger/);
    const metPlain = renderToString(createElement(CritRow, { letter: "S", title: "Seal", c: { ...c, met: true }, shown: true, hidden: "", aids: false }));
    expect(metPlain).not.toMatch(/met</);
    expect(metPlain).not.toMatch(/text-good|text-danger/);
    const guided = renderToString(createElement(CritRow, { letter: "S", title: "Seal", c, shown: true, hidden: "", aids: true }));
    expect(guided).toContain("Guided aid: not met");
    expect(guided).toContain("text-danger");
    const unchecked = renderToString(createElement(CritRow, { letter: "S", title: "Seal", c, shown: false, hidden: "Colour Doppler in every plane.", aids: true }));
    expect(unchecked).not.toContain("Leak 3.5 mm");
    expect(unchecked).toContain("not checked");
  });

  it("a loaded plug is drawn inside the sheath: its distal end at the distal marker; the wall is drawn where the marker rule judges it", () => {
    const { s, sheath } = plugRun();
    const loaded = laaoDeployRun(s, sheath, [{ kind: "remove-pigtail", holdSheath: true }, { kind: "connect", wet: true }]);
    expect(loaded.stage).toBe("loaded");
    const m = s.measurements.find((x) => x.angle === 135)!;
    const html = renderToString(
      createElement(LaaFluoroView, {
        m,
        sheathTipMm: loaded.sheathTipMm,
        pigtail: loaded.pigtail,
        family: "plug" as const,
        device: { family: "plug" as const, sizeMm: loaded.sizeMm, stage: loaded.stage, positionMm: loaded.positionMm },
        opacified: true,
        aids: false,
        markerToWallMm: 10,
        wallMm: appendageWallMm(s),
      })
    );
    const to = Number(/data-device-to="([-\d.]+)"/.exec(html)![1]);
    const from = Number(/data-device-from="([-\d.]+)"/.exec(html)![1]);
    expect(to).toBeLessThanOrEqual(loaded.sheathTipMm - SHEATH_MARKER_BEHIND_TIP_MM + 0.05);
    expect(to - from).toBeCloseTo(deviceLengthMm("plug", loaded.sizeMm), 1);
    expect(to).toBeLessThan(appendageWallMm(s));
  });
});
