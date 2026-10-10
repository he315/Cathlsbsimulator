// Tip integration of the hands-on transseptal puncture (structural-transseptal-hands-on), driven from
// the presets of src/content/lab/presets/structural/transseptal.launch.ts: the launch links and the
// practice index, the TEER and LAAO transseptal contexts, the tips after the actions that raise
// low-act and air, and the waiting.ts entries this package was expected to make satisfiable.
//   npx vitest run src/ui/lab/structuralTips.transseptal.test.ts
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { TIP_BY_ID, tipsFor, type LabContext, type LabTip, type TipTrigger } from "../../content/lab/tips";
import { WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import { buildKnownLaunch } from "../../content/validateLaunch";
import { launch } from "../../content/lab/presets/structural/transseptal.launch";
import { launch as coreLaunch } from "../../content/lab/presets/structural/core.launch";
import {
  STANDARD_VARIANT,
  TRANSSEPTAL_EVENTS,
  TS_PATIENT,
  TS_PRESETS,
  TS_TRACES,
  createTransseptal,
  transseptalPreset,
  transseptalRun,
  transseptalStep,
  type TsAction,
  type TsState,
  type TsVariant,
} from "../../simulation/transseptal";
import { practiceForLesson } from "../content/practiceIndex";
import TransseptalStage from "../structural/TransseptalStage";
import { TAVI_COURSE_EVENTS, TEER_STEPS, laaoTipContext, raises, teerTipContext, transseptalTipContext } from "./structuralTips";

const PKG = "structural-transseptal-hands-on";
const LESSONS = ["hb-mitral-tricuspid-laa-ts-setup", "hb-mitral-tricuspid-laa-ts-cross"];
const ids = (ctx: LabContext | null) => (ctx ? tipsFor(ctx, 20).map((t) => t.id) : []);

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

const variant = (id: string): TsVariant => transseptalPreset(id)!.variant;

function toFossa(s: TsState, h = 5.5): TsState {
  let x = transseptalRun(s, [{ kind: "align" }, { kind: "set-clock", h }]);
  for (let i = 0; i < 40 && x.zone !== "fossa" && x.zone !== "ivc"; i++) x = transseptalStep(x, { kind: "pull", mm: 5 });
  return x;
}
const FOUR: TsAction[] = (["toe", "aspirate", "pressure", "contrast"] as const).map((what) => ({ kind: "check", what }));
const teerCtx = (s: TsState): LabContext => teerTipContext({ step: "transseptal", transseptal: s })!;

describe("launch links", () => {
  it("declares every transseptal preset, and only those, under the TEER sim, starting at the transseptal step", () => {
    expect(launch.sim).toBe("teer");
    expect(launch.scenarios!.map((x) => x.id).sort()).toEqual(TS_PRESETS.map((p) => p.id).sort());
    for (const sc of launch.scenarios!) {
      const starts = (sc.starts ?? []).map((x) => (typeof x === "string" ? x : x.id));
      expect(starts).toEqual(["transseptal"]);
      expect(TEER_STEPS as readonly string[]).toContain("transseptal");
      expect(sc.heldOut).toBeFalsy();
    }
    const known = buildKnownLaunch({ "transseptal.launch.ts": { launch }, "core.launch.ts": { launch: coreLaunch } });
    expect(known.problems).toEqual([]);
  });

  it("practiceIndex lists every scenario in src/content/lab/presets/structural/transseptal.launch.ts under lessons hb-mitral-tricuspid-laa-ts-setup, hb-mitral-tricuspid-laa-ts-cross", () => {
    for (const lessonId of LESSONS) {
      const listed = practiceForLesson(lessonId).filter((e) => e.source.endsWith("presets/structural/transseptal.launch.ts"));
      for (const p of TS_PRESETS) {
        const entry = listed.find((e) => e.scenario === p.id);
        expect(entry, `${p.id} under ${lessonId}`).toBeTruthy();
        expect(entry!.sim).toBe("teer");
        expect(entry!.params.scenario).toBe(p.id);
      }
    }
  });
});

describe("the transseptal tip context", () => {
  it("phase access with [host, 'transseptal'] for TEER and LAAO; position once the tip sits on the fossa", () => {
    const fresh = createTransseptal({ variant: STANDARD_VARIANT, host: "teer" });
    expect(teerCtx(fresh)).toMatchObject({ lab: "structural", phase: "access", procedures: ["teer", "transseptal"], events: [] });
    expect(teerCtx(fresh).phases).toBeUndefined();
    const onFossa = toFossa(fresh);
    expect(teerCtx(onFossa).phases).toEqual(["position"]);
    const laao = toFossa(createTransseptal({ host: "laao" }));
    expect(laaoTipContext({ step: "transseptal", transseptal: laao })).toMatchObject({ phase: "access", procedures: ["laao", "transseptal"], phases: ["position"] });
    expect(transseptalTipContext("pmc", laao).procedures).toEqual(["pmc", "transseptal"]);
    // the step contexts without the stage are unchanged
    expect(teerTipContext({ step: "transseptal" })).toMatchObject({ phase: "access", procedures: ["teer", "transseptal"] });
    expect(teerTipContext({ step: "steer", transseptal: onFossa })!.phase).toBe("position");
    expect(ids(teerTipContext({ step: "steer", transseptal: onFossa })).some((id) => id.startsWith("structural-ts-"))).toBe(false);
  });

  it("the pull-down and the tent show the orientation and two-movement tips", () => {
    const onFossa = toFossa(createTransseptal());
    expect(ids(teerCtx(createTransseptal()))).toContain("structural-ts-pulldown-orient");
    expect(ids(teerCtx(onFossa))).toEqual(expect.arrayContaining(["structural-ts-two-movements", "structural-ts-pulldown-orient", "structural-teer-height-coaptation"]));
  });

  it("in 'ts-standard', after the crossing that raises 'low-act', tipsFor(ctx, 20) includes structural-ts-heparin-after-crossing; after the needle removal that raises 'air' it includes structural-ts-air-hub-low", () => {
    const preset = transseptalPreset("ts-standard")!;
    const onFossa = toFossa(createTransseptal({ variant: preset.variant, host: "teer" }));
    expect(teerCtx(onFossa).events).not.toContain("low-act");
    expect(ids(teerCtx(onFossa))).not.toContain("structural-ts-heparin-after-crossing");
    // the action: the needle crosses into the left atrium with no heparin given
    const crossed = transseptalRun(onFossa, [{ kind: "advance-needle" }, ...FOUR]);
    const ctx = teerCtx(crossed);
    expect(ctx.events).toContain("low-act");
    expect(ctx.phases).toContain("position");
    expect(ids(ctx)).toContain("structural-ts-heparin-after-crossing");
    // heparin alone does not clear it: the ACT is checked first
    const dosed = transseptalStep(crossed, { kind: "heparin", u: 100 * TS_PATIENT.weightKg });
    expect(teerCtx(dosed).events).toContain("low-act");
    expect(ids(teerCtx(dosed))).toContain("structural-ts-heparin-after-crossing");
    // an ACT in range clears it
    const anticoag = transseptalStep(dosed, { kind: "measure-act" });
    expect(teerCtx(anticoag).events).not.toContain("low-act");
    // the action: the needle and dilator come out with the hub held high
    const sheathIn = transseptalRun(anticoag, [{ kind: "read-trace", as: "la" }, { kind: "advance-dilator" }, { kind: "advance-sheath" }]);
    expect(ids(teerCtx(sheathIn))).not.toContain("structural-ts-air-hub-low");
    const airy = transseptalStep(sheathIn, { kind: "remove-needle", hubLow: false, aspirate: false });
    expect(teerCtx(airy).events).toContain("air");
    expect(ids(teerCtx(airy))).toContain("structural-ts-air-hub-low");
    // air and low-act alone do not make it a complication
    expect(teerCtx(airy).phases).not.toContain("complication");
    expect(ids(teerCtx(transseptalStep(airy, { kind: "flush" })))).not.toContain("structural-ts-air-hub-low");
  });

  it("the complication branches change the context: aortic puncture after the trace is read, the septal reflex, delayed tamponade", () => {
    const aortic = transseptalRun(toFossa(createTransseptal({ variant: variant("ts-aortic-puncture") }), 5), [{ kind: "advance-needle" }, { kind: "check", what: "pressure" }]);
    expect(teerCtx(aortic).phases).not.toContain("complication");
    const read = transseptalStep(aortic, { kind: "read-trace", as: "aortic" });
    expect(teerCtx(read).phases).toContain("complication");
    expect(teerCtx(aortic).events).not.toContain("tamponade");
    const haemo = transseptalRun(read, [{ kind: "advance-dilator" }, { kind: "wait", s: 60 }]);
    expect(teerCtx(haemo).events).toContain("tamponade");
    expect(teerCtx(haemo).phases).toContain("complication");

    const vagal = transseptalRun(toFossa(createTransseptal({ variant: variant("ts-vagal") })), [{ kind: "advance-needle" }, { kind: "heparin", u: 7500 }, { kind: "wait", s: 30 }]);
    expect(teerCtx(vagal).events).toEqual(expect.arrayContaining(["st-elevation", "bradycardia", "hypotension"]));
    expect(ids(teerCtx(vagal))).toContain("structural-ts-vagal-st");

    const sec = transseptalRun(toFossa(createTransseptal({ variant: variant("ts-delayed-tamponade") })), [
      { kind: "advance-needle" },
      ...FOUR,
      { kind: "read-trace", as: "la" },
      { kind: "heparin", u: 7500 },
      { kind: "advance-dilator" },
      { kind: "advance-sheath" },
      { kind: "remove-needle", hubLow: true, aspirate: true },
      { kind: "lspv-wire" },
      { kind: "measure-act" },
    ]);
    expect(ids(teerCtx(sec))).not.toContain("structural-ts-posterior-delayed-tamponade");
    const recovery = transseptalRun(sec, [{ kind: "catheters-out", leaveWire: false }, { kind: "finish" }]);
    expect(teerCtx(recovery).events).toContain("hypotension");
    expect(ids(teerCtx(recovery))).toContain("structural-ts-posterior-delayed-tamponade");
  });
});

describe("raises and waiting.ts", () => {
  const WAITING = WAITING_TIPS.filter((g) => g.raisedBy === PKG).flatMap((g) => g.tips);

  it("raises declares the transseptal events with the TAVI course's", () => {
    expect(raises.events).toEqual(expect.arrayContaining([...TAVI_COURSE_EVENTS, ...TRANSSEPTAL_EVENTS]));
    expect(new Set(raises.events).size).toBe(raises.events.length);
  });

  it("every waiting.ts entry naming structural-transseptal-hands-on becomes satisfiable, so the structural waiting count falls by their number", () => {
    expect(WAITING).toEqual(["structural-ts-heparin-after-crossing", "structural-ts-air-hub-low"]);
    const now = WAITING.filter((id) => TIP_BY_ID[id] && satisfiable(TIP_BY_ID[id], TIP_BY_ID[id].when, raises));
    expect(now).toEqual(WAITING);
    // without this package's events none of them is satisfiable
    const before: LabRaises = { ...raises, events: [...TAVI_COURSE_EVENTS] };
    expect(WAITING.filter((id) => satisfiable(TIP_BY_ID[id], TIP_BY_ID[id].when, before))).toEqual([]);
  });

  it("raises no more than this package builds: the structural tips waiting on later packages stay unsatisfiable", () => {
    const later = WAITING_TIPS.filter((g) => g.lab === "structural" && g.raisedBy !== PKG && g.raisedBy !== "structural-tips-and-tavi-course").flatMap((g) => g.tips);
    expect(later.length).toBeGreaterThan(5);
    for (const id of later) expect(satisfiable(TIP_BY_ID[id], TIP_BY_ID[id].when, raises), id).toBe(false);
  });
});

describe("the stage renders what an operator sees", () => {
  const props = (state: TsState, aids = false) => ({ state, dispatch: () => {}, procedure: "teer" as const, baseCm: 3.4, aids, exam: !aids, drill: false });

  it("before crossing: the arrow, the fluoroscopy and the TOE views; no target or site quality without aids", () => {
    const html = renderToString(createElement(TransseptalStage, props(toFossa(createTransseptal()))));
    expect(html).toContain("Needle arrow");
    expect(html).toContain("Bicaval");
    expect(html).toContain("Four-chamber");
    expect(html).not.toContain("Guided aid");
    expect(html).not.toContain("Site (guided aid)");
    const aided = renderToString(createElement(TransseptalStage, props(toFossa(createTransseptal()), true)));
    expect(aided).toContain("Site (guided aid)");
  });

  it("the tip pressure is drawn from the fossa: a right atrial trace that changes to left atrial as the needle crosses; the learner names it only after the pressure check", () => {
    const onFossa = toFossa(createTransseptal());
    const before = renderToString(createElement(TransseptalStage, props(onFossa)));
    expect(before).toContain("Needle tip pressure");
    expect(before).toContain(`a ${TS_TRACES.ra.a}, v ${TS_TRACES.ra.v}, mean ${TS_TRACES.ra.mean} mmHg`);
    expect(before).not.toContain("The tip pressure is");
    const crossed = transseptalStep(onFossa, { kind: "advance-needle" });
    const after = renderToString(createElement(TransseptalStage, props(crossed)));
    expect(after).toContain(`a ${TS_TRACES.la.a}, v ${TS_TRACES.la.v}, mean ${TS_TRACES.la.mean} mmHg`);
    expect(after).not.toContain(`mean ${TS_TRACES.ra.mean} mmHg`);
    expect(after).not.toContain("The tip pressure is");
    expect(after).toContain('data-needle="crossed"');
  });

  it("a needle in the aorta keeps the tent on TOE and draws no crossing into the left atrium", () => {
    const s = transseptalStep(toFossa(createTransseptal({ variant: variant("ts-aortic-puncture") }), 5), { kind: "advance-needle" });
    expect(s.needle).toBe("aorta");
    const html = renderToString(createElement(TransseptalStage, props(s)));
    expect(html).not.toContain('data-needle="crossed"');
    expect(html).toContain('data-needle="towards-aorta"');
  });

  it("after the pressure check the trace is drawn with its numbers, and the learner names it", () => {
    const s = transseptalRun(toFossa(createTransseptal({ variant: variant("ts-aortic-puncture") }), 5), [{ kind: "advance-needle" }, { kind: "check", what: "pressure" }]);
    const html = renderToString(createElement(TransseptalStage, props(s)));
    expect(html).toContain("Needle tip pressure");
    expect(html).toContain("124/68 (87) mmHg");
    expect(html).toContain("The tip pressure is");
    expect(html).not.toMatch(/aortic puncture/i);
  });

  it("the learner's reading of the trace is marked as chosen; the fluoroscopy label never names the chamber", () => {
    const s = transseptalRun(toFossa(createTransseptal({ variant: variant("ts-aortic-puncture") }), 5), [{ kind: "advance-needle" }, { kind: "check", what: "pressure" }, { kind: "read-trace", as: "la" }]);
    const html = renderToString(createElement(TransseptalStage, props(s)));
    expect(html).toMatch(/aria-pressed="true"[^>]*>✓ (<!-- -->)?Left atrial/);
    expect(html).not.toMatch(/aria-pressed="true"[^>]*>✓ (<!-- -->)?Arterial/);
    expect(html).not.toContain("across the septum");
    expect(html).toContain("advanced beyond the tent at the fossa");
  });

  it("checking the wire in LAO switches the fluoroscopy to LAO and logs a neutral line", () => {
    const s0 = createTransseptal({ variant: variant("ts-pacing-lead") });
    expect(renderToString(createElement(TransseptalStage, props(s0)))).toContain("AP fluoroscopy");
    const s = transseptalStep(s0, { kind: "check-lao" });
    const html = renderToString(createElement(TransseptalStage, props(s)));
    expect(html).toContain("LAO fluoroscopy");
    expect(s.log[s.log.length - 1].text).toBe("LAO projection: wire and leads on screen.");
    expect(s.log[s.log.length - 1].text).not.toMatch(/anterior|posterior/i);
  });
});
