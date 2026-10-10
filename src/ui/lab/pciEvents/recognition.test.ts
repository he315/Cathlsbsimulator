// Complication recognition (pci-cx-recognition), end to end through the PCI lab session: a dissection made
// by an oversized balloon in lad-focal shows as cues only (the live log and the tip context) until the
// learner submits an assessment; then the tip context names it and moves to the complication phase, the
// debrief data names it throughout, and the mentor's metrics report the time to recognition and whether
// it was right. The form's presentation per mode and the practice links are checked here too.
//   npx vitest run src/ui/lab/pciEvents/recognition.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import type { LabEvent } from "../../../content/lab/tips";
import type { LaunchMode } from "../../../content/schema";
import { PciLabSession, policyForMode } from "../../pci/PciLabSession";
import { resolvePciLaunch } from "../../pci/launch";
import RecognitionForm, { ELLIS, NHLBI, answerComplete, assessmentClass, assessmentEffects, assessmentSummary, recognitionPresentation } from "../../pci/RecognitionForm";
import { useSeriesStore } from "../../../state/useSeriesStore";
import { computeMetrics, type PciMetrics } from "../../../mentor/metrics";
import { complicationLabel, cueHeld, cxDebrief, isImageCue, timiOf } from "../../../simulation/complications/engine";
import type { Complication } from "../../../simulation/complications/types";
import { PRACTICE_INDEX, practiceForLesson } from "../../content/practiceIndex";
import { launch as CX_LAUNCH } from "../../../content/practice/pci-cx-recognition.launch";
import { pciTipContext } from "../pciTips";
import { CUE_EVENTS } from "./base";
import { RECOGNITION_EVENT, awaitingAssessment, raises, recognisedEvents, submitRecognition, withRecognition } from "./recognition";

const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

/**
 * A text that names, grades or describes the classifying morphology of a complication, built independently
 * of the engine's gate: the names the debrief gives (complicationLabel, every kind), the grade systems, and
 * the defining words of the form's NHLBI and Ellis options (RecognitionForm.tsx).
 */
const NAMING = (() => {
  const STOP = new Set(["coronary", "type", "large", "vessel", "distal", "more", "through", "into"]);
  const kinds: Complication["kind"][] = ["dissection", "perforation", "no-reflow", "thrombus", "air", "side-branch"];
  const labelWords = kinds.flatMap((kind) =>
    complicationLabel({ id: "x", kind, grade: "", data: kind === "thrombus" ? { embolised: 1 } : {} } as unknown as Complication).split(/[^A-Za-z-]+/)
  );
  const formWords = [...NHLBI, ...ELLIS].flatMap((o) => o.label.split(": ")[1].split(/[^A-Za-z]+/));
  const words = [...labelWords, ...formWords, "NHLBI", "Ellis", "TIMI", "embolis", "side branch"]
    .map((w) => w.toLowerCase())
    .filter((w) => w.length >= 3 && !STOP.has(w))
    .map((w) => (w === "air" ? "\\bair\\b" : w.replace(/[-]/g, "[- ]")));
  return new RegExp([...new Set(words)].join("|"), "i");
})();

function lab(scenario = "lad-focal", mode: LaunchMode = "supervised"): PciLabSession {
  const r = resolvePciLaunch({ scenario, start: "wire-across", mode });
  expect(r.problems).toEqual([]);
  const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true, mode, policy: policyForMode(mode) });
  sessions.push(x);
  return x;
}

function run(x: PciLabSession, seconds: number, dt = 1 / 15) {
  for (let t = 0; t < seconds - 1e-9; t += dt) x.step(dt);
}

/** A contrast run through the guide: press, film for a second, release. */
function contrastRun(x: PciLabSession) {
  expect(x.inject()).toBe(true);
  run(x, 1);
  x.releaseInjection();
  run(x, 1);
}

/** Dilate the lesion with a balloon 1.3 times the reference diameter at 16 atm (the assisted console path): a dissection. */
function oversizedDilatation(x: PciLabSession) {
  const d = Math.round(x.g.lesion.refDiameter * 1.3 * 4) / 4;
  expect(x.loadDevice("balloon", "semi-compliant", d, 12)).toBe(true);
  x.advanceDevice(x.g.lesion.centreMm - x.st.device!.centreMm);
  expect(x.inflate(16)).toBe(true);
  run(x, 1);
  x.deflate();
  run(x, 2);
  const c = x.st.cx.list.find((k) => k.kind === "dissection");
  expect(c, "the oversized dilatation dissects the lesion").toBeTruthy();
  return c!;
}

const ctxOf = (x: PciLabSession) => pciTipContext(withRecognition(x.snapshot()));

describe("before and after the assessment (pci-cx-recognition)", () => {
  it("before recognition the context lacks 'dissection'; after a submitted grade it has it and phase 'complication'", () => {
    const x = lab();
    const caseEvents = pciTipContext(x.snapshot()).events ?? [];
    const logFrom = x.st.events.length;
    const d = oversizedDilatation(x);
    const before = ctxOf(x);
    expect(before.events).not.toContain("dissection");
    expect(before.phase).not.toBe("complication");
    // the live log since the dilatation names nothing
    for (const e of x.st.events.slice(logFrom)) expect(e.text).not.toMatch(NAMING);
    // the learner assesses: dissection, its NHLBI type and the TIMI flow
    const r = submitRecognition(x, { cause: "dissection", nhlbi: d.grade, timi: timiOf(d)[0], checks: { wireKept: true, imaged: true, pressureEcgAct: true } });
    expect(r?.id).toBe(d.id);
    expect(r?.recognition?.score.correct).toBe(true);
    expect(recognisedEvents(x.st)).toContain("dissection");
    const after = ctxOf(x);
    expect(after.events).toContain("dissection");
    expect(after.phase).toBe("complication");
    // the case's own events are still there
    for (const e of caseEvents) expect(after.events).toContain(e);
    // the live log gives the learner's own answer
    expect(x.st.events[x.st.events.length - 1].text).toBe(`Assessed as: dissection, NHLBI type ${d.grade}, TIMI ${timiOf(d)[0]}.`);
  });

  it("end to end: before a submitted grade a lesion dissection raises only cue events, and the debrief data still names it", () => {
    const x = lab();
    const caseEvents = new Set(pciTipContext(x.snapshot()).events ?? []);
    const logFrom = x.st.events.length;
    const d = oversizedDilatation(x);
    // nothing about the image before a contrast run: no image cue in the log, no slow-flow, no attending prompt
    run(x, 6);
    expect(cueHeld(x.st.cx, d.id)).toBe(true);
    expect(x.st.events.slice(logFrom).filter((e) => isImageCue(e.text))).toEqual([]);
    expect(ctxOf(x).events ?? []).not.toContain("slow-flow");
    expect(awaitingAssessment(x.st).map((c) => c.id)).not.toContain(d.id);
    // the next run shows the change
    contrastRun(x);
    expect(cueHeld(x.st.cx, d.id)).toBe(false);
    expect(x.st.events.slice(logFrom).some((e) => isImageCue(e.text))).toBe(true);
    expect(awaitingAssessment(x.st).map((c) => c.id)).toContain(d.id);
    const raised = new Set<LabEvent>();
    for (let i = 0; i < 20; i++) {
      run(x, 1);
      for (const e of ctxOf(x).events ?? []) if (!caseEvents.has(e)) raised.add(e);
    }
    expect(raised.size).toBeGreaterThan(0);
    expect([...raised]).toContain("slow-flow");
    for (const e of raised) expect(CUE_EVENTS, e).toContain(e);
    for (const e of x.st.events) expect(e.text).not.toMatch(NAMING);
    // the debrief data names and grades it
    const data = cxDebrief(x.st.cx).find((r) => r.id === d.id)!;
    expect(data.label).toMatch(/dissection \(NHLBI type [A-F]\)/);
    expect(data.labels.some((t) => /dissection/.test(t))).toBe(true);
    const result = x.finish()!;
    expect(result.metrics.complications.some((c) => c.kind === "dissection" && /^[A-F]$/.test(c.grade))).toBe(true);
    expect(result.items.some((i) => /^dissection \([A-F]\)/.test(i.text))).toBe(true);
    // at finish every complication that occurred is kept, named
    expect(pciTipContext(withRecognition(x.snapshot())).events).toContain("dissection");
  });
});

describe("the mentor's metrics (pci-cx-recognition)", () => {
  it("pciMetrics reports timeToRecognitionS and correctness", () => {
    const x = lab();
    const d = oversizedDilatation(x);
    run(x, 6);
    const r = submitRecognition(x, { cause: "dissection", nhlbi: d.grade, timi: timiOf(d)[0] })!;
    x.finish();
    const rec = x.recorder.toRecord();
    expect(rec.events.filter((e) => e.kind === RECOGNITION_EVENT)).toHaveLength(1);
    const m = computeMetrics(rec).metrics as PciMetrics;
    expect(m.lab).toBe("pci");
    expect(m.timeToRecognitionS).toBeCloseTo(r.recognition!.delayS, 5);
    expect(m.timeToRecognitionS!).toBeGreaterThan(6);
    expect(m.recognitionCorrect).toBe(true);
    expect(m.falseRecognitions).toBe(0);
  });

  it("a wrong cause and a false alarm count as wrong; no assessment leaves the metrics undefined", () => {
    const wrong = lab();
    const d = oversizedDilatation(wrong);
    expect(submitRecognition(wrong, { cause: "spasm", timi: 3 })?.id).toBe(d.id);
    // a wrong cause leaves it open: the right one is the second attempt
    expect(submitRecognition(wrong, { cause: "dissection", nhlbi: d.grade, timi: timiOf(d)[0] })?.recognition).toMatchObject({ attempt: 2 });
    // nothing left to recognise: a false alarm
    expect(submitRecognition(wrong, { cause: "thrombus", timi: 3 })).toMatchObject({ id: null });
    wrong.finish();
    const mw = computeMetrics(wrong.recorder.toRecord()).metrics as PciMetrics;
    expect(mw.recognitionCorrect).toBe(false);
    expect(mw.falseRecognitions).toBe(1);
    expect(mw.timeToRecognitionS).toBeGreaterThanOrEqual(0);
    // the debrief gives the same first attempt as the metrics: its time, the wrong cause, and not in green
    const rec = cxDebrief(wrong.st.cx).find((r) => r.id === d.id)!.recognised!;
    expect(rec.first).toMatchObject({ cause: "spasm", correct: false });
    expect(rec.first!.delayS).toBeCloseTo(mw.timeToRecognitionS!, 5);
    const line = assessmentSummary(rec);
    expect(line).toMatch(/^First assessed \d+ s after its first sign, named as spasm; at attempt 2 \(\d+ s\), cause and grade right\.$/);
    expect(assessmentClass(rec)).toBe("text-warn");
    expect(assessmentClass(null)).toBe("text-danger");
    expect(assessmentSummary(null)).toBe("Not assessed.");

    const none = lab();
    none.finish();
    const mn = computeMetrics(none.recorder.toRecord()).metrics as PciMetrics;
    expect(mn.timeToRecognitionS).toBeUndefined();
    expect(mn.recognitionCorrect).toBeUndefined();
  });
});

describe("the assessment form (pci-cx-recognition)", () => {
  it("in supervised and independent mode it is attending dialogue in the drawer that holds neither the clock nor the hands; in guided mode and exams it blocks", () => {
    for (const mode of ["supervised", "independent"] as const) expect(recognitionPresentation(mode), mode).toEqual({ variant: "drawer", holdsClock: false, blocksHands: false });
    for (const mode of ["guided", "exam"] as const) expect(recognitionPresentation(mode), mode).toEqual({ variant: "modal", holdsClock: true, blocksHands: true });
    const props = { showScore: false, onSubmit: () => null, onClose: () => undefined };
    const drawer = renderToString(createElement(RecognitionForm, { ...props, variant: "drawer" }));
    const modal = renderToString(createElement(RecognitionForm, { ...props, variant: "modal" }));
    expect(drawer).toContain('role="region"');
    expect(drawer).not.toContain('role="dialog"');
    expect(modal).toContain('role="dialog"');
    // the form asks for the cause and the TIMI grade first; nothing on it names what happened
    for (const html of [drawer, modal]) {
      expect(html).toContain("Assess what has changed");
      expect(html).toContain("Keep the wire across");
      expect(html).toContain("TIMI 0");
      expect(html).not.toContain("NHLBI type");
    }
  });

  it("while the drawer form is open in supervised practice the procedure runs on and the hands still act", () => {
    const x = lab("lad-focal", "supervised");
    oversizedDilatation(x);
    // the Assess control opens the attending drawer (PciLab.tsx: assessmentEffects), never the blocking 'recognition' dialogue
    const fx = assessmentEffects("supervised", true);
    expect(fx).toEqual({ stepClock: true, handsEnabled: true, modalId: "attending" });
    x.openModal(fx.modalId);
    expect(x.openModals()).not.toContain("recognition");
    const t0 = x.st.t;
    const tip0 = x.st.tipMm;
    run(x, 2);
    expect(x.st.t).toBeGreaterThan(t0 + 1.5);
    expect(x.moveWire(2)).toBe(true);
    expect(x.st.tipMm).not.toBe(tip0);
  });

  it("an open assessment holds the clock and the hands only in guided practice and exams (assessmentEffects, as PciLab applies it)", () => {
    for (const mode of ["supervised", "independent"] as const) {
      expect(assessmentEffects(mode, true), mode).toEqual({ stepClock: true, handsEnabled: true, modalId: "attending" });
      expect(assessmentEffects(mode, false), mode).toEqual({ stepClock: true, handsEnabled: true, modalId: "attending" });
    }
    for (const mode of ["guided", "exam"] as const) {
      expect(assessmentEffects(mode, true), mode).toEqual({ stepClock: false, handsEnabled: false, modalId: "recognition" });
      expect(assessmentEffects(mode, false), mode).toEqual({ stepClock: true, handsEnabled: true, modalId: "recognition" });
      // once the case is over the clock is not held
      expect(assessmentEffects(mode, true, true).stepClock, mode).toBe(true);
    }
  });

  it("in supervised practice a wrong cause gives the same neutral log line as a right one, and neither names the truth", () => {
    const lines: { text: string; tone: string }[] = [];
    for (const answer of ["wrong", "right"] as const) {
      const x = lab("lad-focal", "supervised");
      const d = oversizedDilatation(x);
      const r = submitRecognition(x, answer === "wrong" ? { cause: "thrombus", timi: 3 } : { cause: "dissection", nhlbi: d.grade, timi: timiOf(d)[0] });
      expect(r?.id).toBe(d.id);
      const last = x.st.events[x.st.events.length - 1];
      expect(last.text).toMatch(/^Assessed as: /);
      if (answer === "wrong") {
        // the learner's own words only: nothing of the dissection or its grade
        expect(last.text).toBe("Assessed as: thrombus, TIMI 3.");
        expect(last.text).not.toMatch(/dissect|NHLBI/i);
        // the tip context still lacks the dissection, and the live log keeps naming nothing
        expect(ctxOf(x).events).not.toContain("dissection");
        const from = x.st.events.length;
        run(x, 10);
        for (const e of x.st.events.slice(from)) expect(e.text).not.toMatch(NAMING);
      }
      lines.push({ text: last.text, tone: last.tone });
    }
    expect(lines[0].tone).toBe(lines[1].tone);
  });

  it("a false alarm logs the same kind of line as a real assessment", () => {
    const x = lab("lad-focal", "supervised");
    const n = x.st.events.length;
    expect(submitRecognition(x, { cause: "dissection", nhlbi: "B", timi: 2 })).toMatchObject({ id: null });
    expect(x.st.events).toHaveLength(n + 1);
    expect(x.st.events[n]).toMatchObject({ tone: "info", text: "Assessed as: dissection, NHLBI type B, TIMI 2." });
  });

  it("an answer is complete with a cause, the grade that cause asks for and the TIMI grade", () => {
    expect(answerComplete({ cause: "dissection", timi: 1 })).toBe(false);
    expect(answerComplete({ cause: "dissection", nhlbi: "E", timi: 1 })).toBe(true);
    expect(answerComplete({ cause: "perforation", ellis: "III", timi: 3 })).toBe(false);
    expect(answerComplete({ cause: "perforation", ellis: "III", site: "large-vessel", timi: 3 })).toBe(true);
    expect(answerComplete({ cause: "no-reflow" })).toBe(false);
    expect(answerComplete({ cause: "no-reflow", timi: 1 })).toBe(true);
  });
});

describe("practice links and raises (pci-cx-recognition)", () => {
  it("practiceIndex lists lad-focal and rca-calcified under cm-flow-embolism-noreflow, cm-flow-embolism-plaque-thrombus and cm-principles-closure-acute", () => {
    const FILE = /pci-cx-recognition\.launch\.ts$/;
    expect(CX_LAUNCH.sim).toBe("angio-pci");
    for (const lesson of ["cm-flow-embolism-noreflow", "cm-flow-embolism-plaque-thrombus", "cm-principles-closure-acute"]) {
      const mine = practiceForLesson(lesson, PRACTICE_INDEX).filter((e) => e.sim === "angio-pci" && FILE.test(e.source));
      expect(mine.map((e) => e.scenario).sort(), lesson).toEqual(["lad-focal", "rca-calcified"]);
    }
    expect(practiceForLesson("cm-perforation-classify", PRACTICE_INDEX).filter((e) => FILE.test(e.source)).map((e) => e.scenario)).toEqual(["rca-calcified"]);
    expect(PRACTICE_INDEX.known.problems.filter((p) => p.includes("pci-cx-recognition"))).toEqual([]);
    // each link opens the lab with the wire across the lesion
    for (const l of CX_LAUNCH.links ?? []) {
      const r = resolvePciLaunch({ scenario: l.scenario!, start: l.start!, mode: l.mode ?? "guided" });
      expect(r.problems).toEqual([]);
      const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
      sessions.push(x);
      expect(x.startDef.id).toBe("wire-across");
    }
  });

  it("raises the gated complication events and the complication phase", () => {
    expect(raises.lab).toBe("pci");
    expect(raises.phases).toEqual(["complication"]);
    expect(raises.events).toEqual(expect.arrayContaining(["slow-flow", "acute-closure", "aortocoronary-dissection", "perforation-large-vessel", "perforation-distal"]));
    // the engine makes no collateral perforation, so this file does not claim to raise one
    expect(raises.events).not.toContain("perforation-collateral");
  });
});
