// pci-assessment-policy-qca: the PCI lab follows the session policy and shows no ground truth.
//   - a headless dissection leaves no live log line naming it, and the debrief lists it;
//   - the measurement and the sizing are the trainee's own (chooseSizing never sizes from the truth);
//   - the tip panel follows the resolved policy (exam: none; supervised: after askHelp; guided: the QCA tip at 'plan');
//   - the coach read-outs are a guided teaching aid, off until switched on; no QCA numbers before measuring;
//   - a stored run without an image says QCA is unavailable.
//   npx vitest run src/ui/pci/PciAssessPolicy.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { PciLabSession } from "./PciLabSession";
import { resolvePciLaunch } from "./launch";
import PciAssessPanel, { applyAssessment, basisLabel, recordMeasurement, recordSizing, trayDefault } from "./PciAssessPanel";
import { SIZING_LABEL } from "../../simulation/pci/lesionAssessment";
import { PCI_QCA_HINT_TIP, PciLabScreen, PciTableStrip, labTipContext, pciQcaHint } from "./PciLab";
import ReferenceMonitor, { QCA_UNAVAILABLE } from "../lab/ReferenceMonitor";
import { QcaPanel, frameMeasurable, qcaMeasurement, type QcaApi } from "../lab/QcaTool";
import { LabRun, runCaseId, sourceForSim, type UseLabRun } from "../lab/labRun";
import { labScreens, pciSimMode } from "../lab/visibility";
import { loadTips } from "../lab/useLabTips";
import { useSeriesStore } from "../../state/useSeriesStore";
import { useProgressStore } from "../../state/useProgressStore";
import { LAB_TIPS } from "../../content/lab/tips";
import type { LaunchMode } from "../../content/schema";
import { MEASURE_LENGTH_PROMPT, chooseSizing, lastLiveEvent, liveLog, namesUnrecognised, sizingBases, sizingImaging, submitEstimate, truthNow } from "../../simulation/pci/actions/assessment";
import type { PciState } from "../../simulation/pci/state";
import { cxDebrief, timiOf } from "../../simulation/complications/engine";
import { submitRecognition } from "../lab/pciEvents/recognition";
import { boxLabel, chartDiameter, deviceFor } from "../../simulation/pci/equipment";
import { pciScenarioDef } from "../../simulation/pci/scenarios/registry";

// server rendering reads a store's initial state unless it has getServerState: render the live state instead
for (const st of [useSeriesStore, useProgressStore]) (st as unknown as { getServerState: () => unknown }).getServerState = () => st.getState();

const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

const NO_PROGRESS = { activePolicy: null, profile: { entrustment: {} } };

/** The run and the session the PCI lab builds for a launch (PciLab.tsx: useLabRun with the scenario's EPA, then PciLabSession). */
function labFor(mode: LaunchMode, start = "wire-across", scenario = "lad-focal") {
  const r = resolvePciLaunch({ scenario, start, mode });
  expect(r.problems).toEqual([]);
  const launch = r.launch!;
  const caseId = runCaseId("angio-pci", scenario, null);
  const simMode = pciSimMode([caseId, sourceForSim("angio-pci", scenario, null)], NO_PROGRESS);
  const run = new LabRun({ sim: "angio-pci", caseId, launchMode: launch.mode, simMode, epa: launch.resolved.def.epa, progress: NO_PROGRESS });
  const x = new PciLabSession({ launch, team: false, headlessFrames: true, mode: run.policy.mode, policy: run.policy });
  sessions.push(x);
  return { run, x };
}

function step(x: PciLabSession, seconds: number, dt = 1 / 15) {
  for (let t = 0; t < seconds - 1e-9; t += dt) x.step(dt);
}

/** Dilate the lesion with a balloon 1.3 times the reference diameter at 16 atm: a dissection (as recognition.test.ts). */
function oversizedDilatation(x: PciLabSession) {
  const d = Math.round(x.g.lesion.refDiameter * 1.3 * 4) / 4;
  expect(x.loadDevice("balloon", "semi-compliant", d, 12)).toBe(true);
  x.advanceDevice(x.g.lesion.centreMm - x.st.device!.centreMm);
  expect(x.inflate(16)).toBe(true);
  step(x, 1);
  x.deflate();
  step(x, 2);
  const c = x.st.cx.list.find((k) => k.kind === "dissection");
  expect(c, "the oversized dilatation dissects the lesion").toBeTruthy();
  return c!;
}

/** A contrast run through the guide (shows the change on the image). */
function contrastRun(x: PciLabSession) {
  expect(x.inject()).toBe(true);
  step(x, 1);
  x.releaseInjection();
  step(x, 1);
}

/** Server-rendered markup with React's text separators removed (so numbers and their units read as on screen). */
const ssr = (el: Parameters<typeof renderToString>[0]) => renderToString(el).replace(/<!-- -->/g, "");

/** The UseLabRun the screen takes, from a LabRun (the hook's shape, without React state). */
function runApi(run: LabRun): UseLabRun {
  return {
    mode: run.mode,
    policy: run.policy,
    helpAskedAt: run.helpAskedAt,
    hints: run.hints,
    decisions: run.decisions(),
    finished: run.finished,
    askHelp: (t) => void run.askHelp(t),
    decide: (rec) => void run.decide(rec),
    finish: (r) => run.finish(r),
    run,
  };
}

describe("no complication named on the live screens before the learner's assessment", () => {
  it("a headless dissection produces no live log line containing 'dissection'; the debrief lists it", () => {
    for (const mode of ["guided", "supervised", "exam"] as const) {
      const { x } = labFor(mode);
      const from = x.st.events.length;
      const d = oversizedDilatation(x);
      contrastRun(x);
      step(x, 10);
      const fresh = x.st.events.slice(from);
      expect(fresh.length, mode).toBeGreaterThan(0);
      // the engine's log and the screen's live log: nothing names it
      for (const e of fresh) expect(e.text, mode).not.toMatch(/dissect/i);
      for (const e of liveLog(x.st)) expect(e.text, mode).not.toMatch(/dissect|NHLBI/i);
      // the debrief lists it, named and graded
      const row = cxDebrief(x.st.cx).find((r) => r.id === d.id)!;
      expect(row.label, mode).toMatch(/dissection \(NHLBI type [A-F]\)/);
      const result = x.finish()!;
      expect(result.metrics.complications.some((c) => c.kind === "dissection"), mode).toBe(true);
      expect(result.items.some((i) => /dissection/i.test(i.text)), mode).toBe(true);
    }
  });

  it("the live log's own check drops a line that names an unrecognised complication, and passes it once the cause is recognised", () => {
    const { x } = labFor("supervised");
    const d = oversizedDilatation(x);
    contrastRun(x);
    // a line reaching the log by another path is held back while the dissection is unrecognised
    const planted = { ...x.st, events: [...x.st.events, { t: x.st.t, tone: "danger" as const, text: "A spiral dissection (NHLBI type C)." }] };
    expect(namesUnrecognised(planted, "A spiral dissection (NHLBI type C).")).toBe(true);
    expect(liveLog(planted).some((e) => /dissection/.test(e.text))).toBe(false);
    // a line that names nothing passes
    expect(liveLog(planted).length).toBe(planted.events.length - 1);
    // the learner names it: their answer shows, and the named line passes
    submitRecognition(x, { cause: "dissection", nhlbi: d.grade, timi: timiOf(d)[0], checks: { wireKept: true, imaged: true, pressureEcgAct: true } });
    const log = liveLog(x.st);
    expect(log[log.length - 1].text).toMatch(/^Assessed as: dissection/);
    expect(namesUnrecognised(x.st, "A spiral dissection (NHLBI type C).")).toBe(false);
  });

  it("the drug warning about thrombosis on the equipment names no complication and passes; a thrombus line is held until recognised", () => {
    const { x } = labFor("supervised");
    const warn = "Protamine with equipment still in the coronary risks thrombosis on it.";
    expect(x.st.cx.list.length).toBe(0);
    expect(namesUnrecognised(x.st, warn)).toBe(false);
    const planted = { ...x.st, events: [...x.st.events, { t: x.st.t, tone: "warn" as const, text: warn }] };
    expect(liveLog(planted).pop()?.text).toBe(warn);
    for (const t of ["Thrombus has embolised: distal branches are cut off and flow slows.", "Aspiration retrieves the embolus; the branch fills again.", "A distal branch is abruptly cut off after the dilatation: embolised thrombus."])
      expect(namesUnrecognised(x.st, t), t).toBe(true);
  });

  it("lastLiveEvent is the live log's latest line, found from the end", () => {
    const { x } = labFor("supervised");
    const planted = {
      ...x.st,
      events: [...x.st.events, { t: x.st.t, tone: "info" as const, text: "Balloon deflated." }, { t: x.st.t, tone: "danger" as const, text: "A spiral dissection (NHLBI type C)." }],
    };
    expect(lastLiveEvent(planted)).toBe(liveLog(planted).pop());
    expect(lastLiveEvent(planted)?.text).toBe("Balloon deflated.");
    expect(lastLiveEvent({ cx: x.st.cx, events: [] })).toBeUndefined();
  });
});

describe("the measurement and the sizing are the trainee's own", () => {
  it("chooseSizing before a measurement records no size and no truth; after it sizes from the measurement", () => {
    const { x } = labFor("guided");
    const t = truthNow(x.g, x.st);
    const before = chooseSizing(x.g, x.st, "distal-reference");
    expect(before.sizing).toBeNull();
    const line = before.events[before.events.length - 1].text;
    expect(line).toMatch(/Measure the lesion first/);
    expect(line).not.toContain(t.refMm.toFixed(2));
    // IVUS sizing waits for the trainee's own IVUS reference
    expect(chooseSizing(x.g, x.st, "ivus-lumen").sizing).toBeNull();
    // a trainee's QCA with a distal reference of 3.4 mm sizes a 3.5 mm stent, whatever the case's truth
    const m = { refMm: 3.3, mldMm: 0.9, lengthMm: 14, refProxMm: 3.2, refDistMm: 3.4, method: "qca" as const, mmPerPx: 0.3, french: 6 };
    let st = submitEstimate(x.g, x.st, m);
    const tel = st.log.filter((r) => r.kind === "lesion-estimate").pop()!;
    expect(tel.data).toMatchObject({ refMm: 3.3, mldMm: 0.9, lengthMm: 14, method: "qca", refDistMm: 3.4, french: 6, truth: { refMm: t.refMm, mldMm: t.mldMm, lengthMm: t.lengthMm } });
    st = chooseSizing(x.g, st, "distal-reference");
    expect(st.sizing).toMatchObject({ basis: "distal-reference", diameter: 3.5, lengthMm: 18 });
    st = chooseSizing(x.g, st, "mean-reference");
    expect(st.sizing!.diameter).toBe(3.5);
    // a visual estimate without proximal and distal references sizes from its reference
    const v = chooseSizing(x.g, submitEstimate(x.g, x.st, { refMm: 2.75, mldMm: 0.6, lengthMm: 10, method: "visual" } as never), "distal-reference");
    expect(v.sizing!.diameter).toBe(2.75);
  });

  it("the mean reference is offered only when the trainee measured both references; a visual estimate's one reference is labelled as such", () => {
    const { x } = labFor("guided");
    const visual = submitEstimate(x.g, x.st, { refMm: 2.75, mldMm: 0.6, lengthMm: 10, method: "visual" } as never);
    expect(sizingBases(visual)).toEqual(["distal-reference"]);
    const qca = submitEstimate(x.g, x.st, { refMm: 3.3, mldMm: 0.9, lengthMm: 14, refProxMm: 3.2, refDistMm: 3.4, method: "qca", mmPerPx: 0.3, french: 6 } as never);
    expect(sizingBases(qca)).toEqual(["distal-reference", "mean-reference"]);
    const vEst = visual.estimate!.est as Parameters<typeof basisLabel>[1];
    const qEst = qca.estimate!.est as Parameters<typeof basisLabel>[1];
    expect(basisLabel("distal-reference", vEst)).toBe("Your reference estimate");
    expect(basisLabel("distal-reference", qEst)).toBe(SIZING_LABEL["distal-reference"]);
    expect(basisLabel("mean-reference", qEst)).toBe(SIZING_LABEL["mean-reference"]);
    // the panel after a visual estimate offers no proximal and distal mean
    expect(applyAssessment(x, () => visual)).toBe(true);
    const html = ssr(createElement(PciAssessPanel, { session: x }));
    expect(html).toContain("Your reference estimate");
    expect(html).not.toContain(SIZING_LABEL["mean-reference"]);
  });

  it("an IVUS run's distal reference without a lesion measurement gives no size: the length is never assumed", () => {
    const { x } = labFor("guided");
    const withIvus = {
      ...x.st,
      ivus: { active: false, mm: 0, startMm: 0, speed: 0, t: 0, recorded: [], assessments: [{ postStent: false, distRefMm2: 7.07 }] },
    } as unknown as PciState;
    const im = sizingImaging(withIvus);
    expect(im?.distRefLumen).toBeCloseTo(3.0, 2);
    // nothing to size from until the lesion is measured
    expect(sizingBases(withIvus, im)).toEqual([]);
    const st = chooseSizing(x.g, withIvus, "ivus-lumen", im);
    expect(st.sizing).toBeNull();
    expect(st.events[st.events.length - 1].text).toBe(MEASURE_LENGTH_PROMPT);
    expect(st.log.some((r) => r.kind === "sizing")).toBe(false);
    // with the trainee's measured length, the IVUS reference sizes the diameter and the length is the measurement's
    const measured = submitEstimate(x.g, withIvus, { refMm: 2.9, mldMm: 0.9, lengthMm: 14, method: "visual" } as never);
    expect(sizingBases(measured, im)).toContain("ivus-lumen");
    const z = chooseSizing(x.g, measured, "ivus-lumen", im);
    expect(z.sizing).not.toBeNull();
    expect(z.sizing!.lengthMm).toBeGreaterThanOrEqual(14);
  });

  it("the session records the trainee's QCA and sizing; the tray default comes from the catalogue's box label and chart", () => {
    const { x } = labFor("supervised");
    expect(x.st.estimate).toBeNull();
    const r = { refMm: 2.9, mldMm: 1.0, refProxMm: 3.0, refDistMm: 2.8, lesionLengthMm: 11, segmentLengthMm: 30 } as Parameters<typeof qcaMeasurement>[0];
    const m = qcaMeasurement(r, { mmPerPx: 0.29, french: 6 }, 70);
    expect(m).toMatchObject({ refMm: 2.9, mldMm: 1.0, lengthMm: 11, refDistMm: 2.8, method: "qca", visualDsPct: 70, french: 6 });
    expect(recordMeasurement(x, m)).toBe(true);
    expect(x.st.estimate?.est).toMatchObject({ refMm: 2.9, mldMm: 1.0 });
    expect(x.st.log.some((e) => e.kind === "lesion-estimate")).toBe(true);
    expect(recordSizing(x, "distal-reference")).toBe(true);
    expect(x.st.sizing).toMatchObject({ diameter: 2.75, lengthMm: 15 });
    const tray = trayDefault(x.st.sizing!);
    const spec = deviceFor("stent", "semi-compliant");
    const box = boxLabel(spec, 2.75, 15);
    expect(tray.title).toBe(box.title);
    expect(tray.size).toBe(box.size);
    expect(tray.atNominalMm).toBeCloseTo(chartDiameter(spec, 2.75, box.nominalAtm), 9);
    expect(tray.atRbpMm).toBeCloseTo(chartDiameter(spec, 2.75, box.rbpAtm), 9);
    // the panel shows the trainee's numbers and the tray default, not the truth
    const html = ssr(createElement(PciAssessPanel, { session: x }));
    expect(html).toContain("Your measurement");
    expect(html).toContain("2.90 mm");
    expect(html).toContain("Tray default");
    expect(html).not.toContain(`${truthNow(x.g, x.st).mldMm.toFixed(2)} mm`);
  });

  it("before a measurement the panel offers no size and shows no number from the case", () => {
    const { x } = labFor("guided");
    const t = truthNow(x.g, x.st);
    const html = ssr(createElement(PciAssessPanel, { session: x }));
    expect(html).toContain("No measurement yet");
    expect(html).not.toContain("Choose this size");
    for (const n of [t.refMm, t.mldMm, t.refDistMm, t.refProxMm]) expect(html).not.toContain(`${n.toFixed(2)} mm`);
  });
});

describe("the tip panel follows the resolved policy", () => {
  it("exam from the launch: no tip; supervised: tips only after askHelp(); guided: pci-interp-qca-calibrate is among the plan-phase candidates in lad-focal and is shown in the guided QCA steps", async () => {
    const mod = await loadTips();
    const all = LAB_TIPS.length;
    // exam (the launch params' mode)
    const ex = labFor("exam", "guide-engaged");
    expect(ex.run.mode).toBe("exam");
    ex.x.openModal("prebrief");
    expect(labTipContext(ex.x).phase).toBe("plan");
    expect(ex.run.tips(mod, labTipContext(ex.x), all)).toEqual([]);
    expect(ex.run.askHelp(1)).toBeNull();
    expect(ex.run.tips(mod, labTipContext(ex.x), all)).toEqual([]);
    // supervised: nothing until the learner asks
    const sup = labFor("supervised", "guide-engaged");
    sup.x.openModal("prebrief");
    expect(sup.run.tips(mod, labTipContext(sup.x), all)).toEqual([]);
    sup.run.askHelp(2);
    const supTips = sup.run.tips(mod, labTipContext(sup.x), all).map((t) => t.id);
    expect(supTips.length).toBeGreaterThan(0);
    expect(supTips).toContain("pci-interp-qca-calibrate");
    // guided: the plan's tips, the QCA calibration tip among them
    const gd = labFor("guided", "guide-engaged");
    expect(gd.run.mode).toBe("guided");
    gd.x.openModal("prebrief");
    const ctx = labTipContext(gd.x);
    expect(ctx.phase).toBe("plan");
    // among the plan-phase candidates (unlimited list); its rank does not put it in the panel's default
    // limit, so the learner meets it through the QCA steps' hint below
    expect(mod.tipsFor(ctx, all).map((t) => t.id)).toContain("pci-interp-qca-calibrate");
    expect(gd.run.tips(mod, ctx, all).map((t) => t.id)).toContain("pci-interp-qca-calibrate");
    // what the learner sees: the guided QCA steps carry the tip; supervised, independent and exam do not
    const tip = mod.TIP_BY_ID[PCI_QCA_HINT_TIP];
    expect(tip).toBeDefined();
    expect(pciQcaHint(labScreens(gd.run.policy), mod)).toBe(`${tip.title}. ${tip.text}`);
    expect(pciQcaHint(labScreens(sup.run.policy), mod)).toBeUndefined();
    expect(pciQcaHint(labScreens(ex.run.policy), mod)).toBeUndefined();
    expect(pciQcaHint(labScreens(labFor("independent").run.policy), mod)).toBeUndefined();
    expect(pciQcaHint(labScreens(gd.run.policy), null)).toBeUndefined();
    // the hint renders inside the QCA steps
    const api = {
      s: { step: "calibrate", estimatePct: "50", french: 6, calMarks: [], cal: null, segMarks: [], result: null, error: "" },
      set: () => undefined,
      reset: () => undefined,
    } as unknown as QcaApi;
    const blank = { w: 4, h: 4, data: new Uint8Array(16) };
    const steps = ssr(createElement(QcaPanel, { api, frame: blank, onClose: () => undefined, hint: pciQcaHint(labScreens(gd.run.policy), mod) }));
    expect(steps).toContain(tip.title.replace(/&/g, "&amp;").replace(/'/g, "&#x27;").replace(/"/g, "&quot;"));
    const noHint = ssr(createElement(QcaPanel, { api, frame: blank, onClose: () => undefined, hint: pciQcaHint(labScreens(sup.run.policy), mod) }));
    expect(noHint).not.toContain(tip.title.replace(/&/g, "&amp;").replace(/'/g, "&#x27;").replace(/"/g, "&quot;"));
    // the run's EPA is the scenario's own
    expect(gd.run.policy.epa).toBe(pciScenarioDef("lad-focal")!.epa);
  });
});

describe("the lab screens: coach read-outs and QCA", () => {
  it("the coach read-outs checkbox is in the guided drawer only, off by default; no QCA numbers before the trainee measures", () => {
    for (const mode of ["guided", "supervised", "independent", "exam"] as const) {
      const { run, x } = labFor(mode);
      x.openModal("attending");
      const t = truthNow(x.g, x.st);
      const html = ssr(createElement(PciLabScreen, { session: x, labRun: runApi(run), handedOver: false, launchProblems: [], onScenario: () => undefined, onRepeat: () => undefined }));
      expect(html, mode).toContain("Reference monitor");
      expect(html.includes('aria-label="Coach read-outs"'), mode).toBe(mode === "guided");
      // off until switched on: the read-outs themselves are not rendered
      expect(html, mode).not.toContain("Where things are (teaching aid)");
      // no QCA numbers before a measurement, and nothing of the truth
      expect(html, mode).not.toContain("Your measurement");
      expect(html, mode).not.toContain(`${t.mldMm.toFixed(2)} mm`);
      expect(html, mode).not.toContain(`${t.refMm.toFixed(2)} mm`);
      expect(labScreens(run.policy).coachReadouts, mode).toBe(mode === "guided");
      // the table strip's latest-event line is a coach read-out too: absent until the checkbox is switched on
      expect(html, mode).not.toMatch(/role="status" title="/);
    }
  });

  it("the table strip's latest-event line renders only when asked (the screen asks only with the coach read-outs on)", () => {
    const { x } = labFor("guided");
    const planted = { t: x.st.t, tone: "info" as const, text: "Wire tip advanced." };
    expect(applyAssessment(x, (st) => ({ ...st, events: [...st.events, planted] }))).toBe(true);
    const on = ssr(createElement(PciTableStrip, { session: x, recommended: [], showEvent: true }));
    expect(on).toMatch(/role="status" title="Wire tip advanced\."/);
    const off = ssr(createElement(PciTableStrip, { session: x, recommended: [], showEvent: false }));
    expect(off).not.toMatch(/role="status" title="/);
  });

  it("a stored run without an image (failed read-back) is not measured: the monitor says QCA is unavailable", () => {
    const { x } = labFor("guided");
    x.setPedal({ fluoro: false, cine: true });
    step(x, 1);
    x.setPedal({ fluoro: false, cine: false });
    const s = useSeriesStore.getState().series;
    expect(s.length).toBe(1);
    expect(s[0].frames.length).toBeGreaterThan(0);
    // the headless run stores blank frames, as a failed WebGL read-back would
    expect(frameMeasurable({ w: s[0].w, h: s[0].h, data: s[0].frames[0] })).toBe(false);
    const html = ssr(createElement(ReferenceMonitor, { qca: "after-estimate", qcaFrench: 6 }));
    expect(html).toContain(QCA_UNAVAILABLE.replace(/'/g, "&#x27;"));
    expect(html).not.toContain("Your measurement");
    // an image is measurable
    const img = new Uint8Array(64 * 64).map((_, i) => (i % 64 < 32 ? 60 : 180));
    expect(frameMeasurable({ w: 64, h: 64, data: img })).toBe(true);
  });
});
