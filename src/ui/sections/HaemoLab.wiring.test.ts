// repair-haemo-host-wiring, the host side: HaemoLab passes the run's mode and ledger to the catheter
// controls (the valve study's decisions and guided aids), passes the study and dispatch to the
// recorder explicitly, logs the transducer set-up decisions in the run's ledger, and a repeat restarts
// the study the way it began (a set-up preset stays that preset).
//   npx vitest run src/ui/sections/HaemoLab.wiring.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { MANIFOLD_PORTS, haemoStudyReducer, initialStudy, studySetup, type HaemoAction, type HaemoStudyState } from "../../simulation/haemoStudy";
import { useProgressStore } from "../../state/useProgressStore";
import type { UseLabRun } from "../lab/labRun";
import { HAEMO_SCENARIOS, SCENARIO_BY_ID } from "../../simulation/haemo";

/** What the lab passed to its panels at the last render. */
const seen: { catheter?: Record<string, unknown>; trace?: Record<string, unknown>; diagnosis?: Record<string, unknown>; run?: UseLabRun } = {};

vi.mock("../haemo/CatheterPanel", async (orig) => ({
  ...(await orig<object>()),
  default: (p: Record<string, unknown>) => {
    seen.catheter = p;
    return null;
  },
}));
vi.mock("../haemo/TracePanel", async (orig) => ({
  ...(await orig<object>()),
  default: (p: Record<string, unknown>) => {
    seen.trace = p;
    return p.children as never;
  },
}));
vi.mock("../haemo/DiagnosisPanel", async (orig) => ({
  ...(await orig<object>()),
  default: (p: Record<string, unknown>) => {
    seen.diagnosis = p;
    return null;
  },
}));
vi.mock("../lab/labRun", async (orig) => {
  const real = await orig<typeof import("../lab/labRun")>();
  return {
    ...real,
    useLabRun: (...args: Parameters<typeof real.useLabRun>) => {
      const r = real.useLabRun(...args);
      seen.run = r;
      return r;
    },
  };
});

const { default: CatheterPanelReal } = await vi.importActual<typeof import("../haemo/CatheterPanel")>("../haemo/CatheterPanel");
const { default: HaemoLab, catheterKey, launchStudy, repeatStudy } = await import("./HaemoLab");

(useProgressStore as unknown as { getServerState: () => unknown }).getServerState = () => useProgressStore.getState();

const render = () => renderToString(createElement(HaemoLab));
const ledger = () => seen.run!.run.decisions();
const play = (st: HaemoStudyState, ...as: HaemoAction[]) => as.reduce(haemoStudyReducer, st);
const SET_UP: HaemoAction[] = [
  { type: "setup-level", landmark: "mid-thoracic" },
  { type: "setup-stopcock", to: "air" },
  { type: "setup-zero" },
  { type: "setup-stopcock", to: "patient" },
];
const FLUSH_ALL = MANIFOLD_PORTS.map((_, port): HaemoAction => ({ type: "manifold-flush", port }));

beforeEach(() => {
  for (const k of Object.keys(seen)) delete (seen as Record<string, unknown>)[k];
});

describe("HaemoLab passes the run to the catheter controls and the study to the recorder", () => {
  it("CatheterPanel gets the run's mode and an onDecide that writes the run's ledger", () => {
    render();
    expect(seen.catheter).toBeDefined();
    expect(seen.catheter!.mode).toBe(seen.run!.mode);
    expect(typeof seen.catheter!.onDecide).toBe("function");
    const d = { id: "av-cross-decision", stage: "left-heart", label: "Cross the aortic valve or not", correct: true, expected: "Cross the valve", given: "Cross the valve", lessonId: "hb-specific-conditions-as", tipIds: ["haemo-as-cross-only-if-discordant"] };
    (seen.catheter!.onDecide as (x: typeof d) => void)(d);
    expect(ledger().find((x) => x.id === "av-cross-decision")).toMatchObject({ correct: true, stage: "left-heart", lessonId: "hb-specific-conditions-as" });
  });

  it("TracePanel gets the same study and dispatch as the catheter controls, as its own props", () => {
    render();
    expect(seen.trace!.study).toBeDefined();
    expect(seen.trace!.study).toBe(seen.catheter!.study);
    expect(typeof seen.trace!.dispatch).toBe("function");
    expect(seen.trace!.dispatch).toBe(seen.catheter!.dispatch);
  });
});

describe("HaemoLab logs the transducer set-up decisions in the run's ledger", () => {
  it("a misread fast flush, air through the manifold and a missed re-levelling become ledger records", () => {
    render();
    const dispatch = seen.trace!.dispatch as (a: HaemoAction) => void;
    // a misread flush in the overdamped preset
    dispatch({ type: "load", scenarioId: "normal", start: "setup-overdamped-air" });
    dispatch({ type: "setup-fast-flush" });
    dispatch({ type: "setup-read-flush", reading: "underdamped" });
    expect(ledger().find((x) => x.id === "setup-flush-1")).toMatchObject({ stage: "setup", correct: false, lessonId: "pm-monitoring-transducers", tipIds: ["haemo-mon-fast-flush"] });
    // air injected through a manifold with a hidden bubble
    dispatch({ type: "load", scenarioId: "normal", start: "setup-hidden-bubble" });
    dispatch({ type: "rhc-advance" });
    dispatch({ type: "manifold-inject" });
    expect(ledger().find((x) => x.id === "setup-manifold-air")).toMatchObject({ correct: false, lessonId: "hb-cardiac-catheterisation-setup", tipIds: ["haemo-setup-manifold-check"] });
    // the table moves and a pressure is recorded before re-levelling
    dispatch({ type: "load", scenarioId: "normal", start: "setup-table-move" });
    for (const a of [...FLUSH_ALL, ...SET_UP, { type: "rhc-advance" } as HaemoAction, { type: "record" } as HaemoAction]) dispatch(a);
    expect(ledger().find((x) => x.id === "setup-relevel")).toMatchObject({ correct: false, lessonId: "pm-monitoring-transducers", tipIds: ["haemo-mon-zero-level"] });
    // the calculations and diagnosis still log as before
    dispatch({ type: "answer", index: 0 });
    expect(ledger().some((x) => x.id === "diagnosis")).toBe(true);
  });
});

describe("HaemoLab finishes the run with the set-up's critical error", () => {
  it("air injected through the manifold counts as a critical error in the logbook row", () => {
    render();
    const dispatch = seen.trace!.dispatch as (a: HaemoAction) => void;
    dispatch({ type: "load", scenarioId: "normal", start: "setup-hidden-bubble" });
    dispatch({ type: "rhc-advance" });
    dispatch({ type: "manifold-inject" });
    dispatch({ type: "answer", index: 0 });
    expect(seen.run!.run.finished).toBe(true);
    // finish() returns the row already written
    expect(seen.run!.run.finish({ score: 0, passed: false }).criticalErrors).toBe(1);
  });
});

describe("a repeat restarts the study the way it began", () => {
  it("DiagnosisPanel's repeat restarts the set-up preset the study was loaded at", () => {
    render();
    const dispatch = seen.trace!.dispatch as (a: HaemoAction) => void;
    const repeat = seen.diagnosis!.onRepeat as () => void;
    // the overdamped preset: read the flush wrongly once, then repeat
    dispatch({ type: "load", scenarioId: "normal", start: "setup-overdamped-air" });
    dispatch({ type: "setup-fast-flush" });
    dispatch({ type: "setup-read-flush", reading: "optimal" });
    expect(ledger().find((x) => x.id === "setup-flush-1")).toMatchObject({ correct: false });
    repeat();
    // the fresh study is the same preset from its start: its first flush is overdamped again (a
    // prepared study would flush optimal, and no repeat would make this the second reading)
    dispatch({ type: "setup-fast-flush" });
    dispatch({ type: "setup-read-flush", reading: "overdamped" });
    expect(ledger().find((x) => x.id === "setup-flush-1")).toMatchObject({ correct: true, expected: expect.stringMatching(/Overdamped/) });
    expect(ledger().some((x) => x.id === "setup-flush-2")).toBe(false);
  });

  it("without a record of how it began, a repeat carries none of the events raised during the study", () => {
    const st = play(initialStudy("normal"), { type: "raise", event: "hypotension" });
    expect(repeatStudy(st, null).state).toEqual(initialStudy("normal"));
  });

  it("a set-up preset opened by a launch repeats as the same preset, from its start", () => {
    const l = launchStudy({ scenario: "normal", start: "setup-table-move" })!;
    expect(l.begun).toEqual({ scenarioId: "normal", start: "setup-table-move", events: [] });
    const worked = play(l.state, ...FLUSH_ALL, ...SET_UP, { type: "rhc-advance" }, { type: "record" });
    expect(studySetup(worked)).toMatchObject({ tableMoved: true, zeroed: true });
    const r = repeatStudy(worked, l.begun);
    expect(r.state).toEqual(initialStudy("normal", "setup-table-move"));
    expect(studySetup(r.state)).toMatchObject({ preset: "setup-table-move", tableMovePending: true, tableMoved: false, zeroed: false });
    expect(r.begun).toEqual(l.begun);
  });

  it("without a record of the start, the set-up preset is read from the study", () => {
    for (const preset of ["setup-v4-level", "setup-overdamped-air", "setup-underdamped-long-line", "setup-hidden-bubble"] as const) {
      const st = play(initialStudy("pah", preset), { type: "rhc-advance" });
      expect(studySetup(repeatStudy(st, null).state).preset, preset).toBe(preset);
      // a record for another scenario (a dev hook's load) is not used
      expect(studySetup(repeatStudy(st, { scenarioId: "normal", start: null, events: [] }).state).preset, preset).toBe(preset);
    }
  });

  it("a shock preset after PCI repeats after PCI, with the launch's events and not those raised during the study", () => {
    const l = launchStudy({ scenario: "shock-biv", start: "post", events: "hypotension" })!;
    const st = play(l.state, { type: "raise", event: "air" });
    const r = repeatStudy(st, l.begun);
    expect(r.state.set).toBe("post");
    expect(r.state.raised).toEqual(["hypotension"]);
    // a study opened from the scenario list repeats as a prepared study
    const plain = repeatStudy(play(initialStudy("normal"), { type: "rhc-advance" }), { scenarioId: "normal", start: null, events: [] });
    expect(plain.state).toEqual(initialStudy("normal"));
  });
});

describe("each run of a valve study gets new catheter controls", () => {
  const VALVE = HAEMO_SCENARIOS.filter((x) => !!x.avStudy).map((x) => x.id);
  it("a valve study's controls are keyed on the run, so a repeat or relaunch remounts the valve study", () => {
    expect(VALVE).toContain("as-discordant-cross");
    expect(SCENARIO_BY_ID["aortic-stenosis"].avStudy).toBeUndefined();
    for (const id of VALVE) {
      const st = initialStudy(id);
      // a repeat (the same scenario, the next run) gets a new key: the valve panel's decision, attempts and
      // sent decisions start again, so the repeated run's ledger gets its own crossing decision
      expect(catheterKey(st, 1), id).not.toBe(catheterKey(st, 2));
      expect(catheterKey(st, 1), id).toBe(catheterKey(st, 1));
    }
  });

  it("the other scenarios keep one set of controls over a repeat (the right heart passage keeps its preset)", () => {
    for (const sc of HAEMO_SCENARIOS.filter((x) => !x.avStudy)) {
      const st = initialStudy(sc.id);
      expect(catheterKey(st, 1), sc.id).toBe(catheterKey(st, 2));
    }
  });

  it("the host renders the catheter controls with that key", () => {
    render();
    const el = seen.trace!.children as { key: string | null; props: { study: HaemoStudyState } };
    expect(el.key).toBe(catheterKey(el.props.study, 0));
  });

  it("a newly mounted valve panel starts with no crossing decision", () => {
    const out = renderToString(createElement(CatheterPanelReal, { study: initialStudy("as-discordant-cross"), dispatch: () => undefined, mode: "exam" })).replace(/<!-- -->/g, "");
    expect(out).toContain("Cross the aortic valve?");
  });
});
