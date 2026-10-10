// The MCS lab after the split (mcs-console-split-select-and-tips): each console renders what it
// rendered inside McsLab.tsx (these render checks were written against the unsplit file first),
// the device-choice step shows the profile and nothing derived, the chrome uses generic device
// names, the launch file matches the presets and cases both ways, and the circulation can be
// stepped by hand (window.__lab.mcs.step) or run on an injected engine.
//   npx vitest run src/ui/mcs/mcs.test.ts
// (A .ts file: vitest.config.ts includes src/**/*.test.ts only, so the plan's mcs.test.tsx would
// not run; the elements are built with createElement instead of JSX.)
import { describe, expect, it } from "vitest";
import type { LaunchMode } from "../../content/schema";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import McsLab, { CONSOLE_CASES, DEFAULT_SCENARIO, resolveMcsLaunch } from "../sections/McsLab";
import IabpConsole, { ADJUSTMENT_SETTLE_MS, IABP_CASES, MoveCounter } from "./IabpConsole";
import ImpellaConsole, { IMP_CASES } from "./ImpellaConsole";
import EcmoConsole, { ECMO_CASES } from "./EcmoConsole";
import DeviceChoice, { ChoiceDebrief } from "./DeviceChoice";
import { CirculationRunner, SETTLE_S } from "./useCirculation";
import { CONSOLE_NOUN, SessionDebrief } from "./shared";
import { useUiStore } from "../../state/useUiStore";
import { launch } from "../../content/lab/presets/mcs/core.launch";
import { SELECT_PRESETS, SELECT_PRESET_BY_ID, scoreChoice, scoreMcsSession } from "../../simulation/mcs/deviceChoice";
import { Circulation, PATIENTS, type BeatStats } from "../../simulation/circulation";
import { practiceForLesson } from "../content/practiceIndex";
import appSrc from "../../App.tsx?raw";
import dashboardSrc from "../sections/Dashboard.tsx?raw";

const text = (el: Parameters<typeof renderToString>[0]) =>
  renderToString(el)
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

const noop = () => undefined;
const consoleProps = (scenarioId: string, launchMode: LaunchMode | null = null) => ({ scenarioId, onScenario: noop, launchMode, runKey: 0 });
/** Vendor and trade names that must not appear in the lab's chrome (HANDOVER 6.5). */
const VENDOR = /Impella|TandemHeart|Abiomed|Abbott|Getinge|Maquet|Cardiohelp|Datascope|Arrow|LifeSPARC|Protek/;

describe("MCS consoles render after the split", () => {
  it("balloon pump console: arterial trace, timing strip, controls and read-outs", () => {
    const t = text(createElement(IabpConsole, consoleProps("late-deflation")));
    expect(t).toContain("Arterial pressure");
    expect(t).toContain("Frozen 1:2 strip for timing");
    expect(t).toContain("Inflation");
    expect(t).toContain("Deflation");
    expect(t).toContain("Assist ratio");
    expect(t).toContain("Augmented diastolic");
    expect(t).toContain("Assisted EDP");
    expect(t).toContain(IABP_CASES[0].brief);
    expect(t).not.toMatch(VENDOR);
  });

  it("microaxial pump console: monitor, placement and motor traces, controls and read-outs", () => {
    const t = text(createElement(ImpellaConsole, consoleProps("escalate")));
    expect(t).toContain("Patient monitor");
    expect(t).toContain("Performance level");
    expect(t).toContain("Inlet depth below the valve");
    expect(t).toContain("Fluid 250 mL");
    expect(t).toContain("Pump flow");
    expect(t).toContain("PAPi");
    expect(t).toContain("Positioning"); // a pump just placed opens at the positioning stage
    expect(t).not.toMatch(VENDOR);
  });

  it("VA-ECMO console: lines, circuit controls and gases; ECPR opens at insertion", () => {
    const t = text(createElement(EcmoConsole, consoleProps("ecpr")));
    expect(t).toContain("Right radial arterial line");
    expect(t).toContain("Pump speed");
    expect(t).toContain("Sweep");
    expect(t).toContain("Insert distal perfusion cannula");
    expect(t).toContain("Circuit flow");
    expect(t).toContain("Femoral SaO");
    expect(t).toContain("Insertion");
    expect(t).not.toMatch(VENDOR);
  });

  it("every console renders every one of its cases", () => {
    for (const k of IABP_CASES) expect(text(createElement(IabpConsole, consoleProps(k.id)))).toContain(k.brief);
    for (const k of IMP_CASES) expect(text(createElement(ImpellaConsole, consoleProps(k.id)))).toContain(k.brief);
    for (const k of ECMO_CASES) expect(text(createElement(EcmoConsole, consoleProps(k.id)))).toContain(k.brief);
  });
});

describe("no ground truth on the live screen outside guided practice", () => {
  const TIMING_WORDS = /at the notch|earlier|later|into systole|mid-diastole|end-diastole|\(late\)|effective|poor|Timing correct/;

  it("balloon pump console, supervised: no timing words, no 'late' label, no named error; every case and mode with an End case action", () => {
    for (const k of IABP_CASES)
      for (const mode of ["supervised", "independent", "exam"] as const) {
        const t = text(createElement(IabpConsole, consoleProps(k.id, mode)));
        // the console from the frozen strip on (the brief and the picker titles are case text)
        expect(t.slice(t.indexOf("Frozen 1:2 strip")), `${k.id} ${mode}`).not.toMatch(TIMING_WORDS);
        expect(t).toMatch(/\d+ ms after R/);
        expect(t).toContain("End case");
      }
  });

  it("balloon pump console, guided: the position words and the named error are shown live", () => {
    const t = text(createElement(IabpConsole, consoleProps("late-deflation", "guided")));
    expect(t).toContain("into systole");
    expect(t).toContain("(late)");
  });

  it("balloon pump read-outs carry no good/warn/danger colour outside guided practice", () => {
    const html = renderToString(createElement(IabpConsole, consoleProps("late-deflation", "supervised")));
    expect(html).not.toMatch(/text-good|text-warn|text-danger/);
    expect(renderToString(createElement(IabpConsole, consoleProps("late-deflation", "guided")))).toMatch(/text-danger|text-warn/);
  });

  it("the RV case names its diagnosis only in guided practice", () => {
    const rv = IMP_CASES.find((k) => k.id === "rv")!;
    const s = { papi: 0.6, cvp: 18, map: 70, suction: false } as BeatStats;
    expect(rv.goals(s, 3.5, false).map((g) => g.label).join(" ")).not.toMatch(/RV failure|PAPi/);
    expect(rv.goals(s, 3.5, false)[0].label).toBe("Find the cause of the low flows");
    expect(rv.goals(s, 3.5, true)[0].label).toContain("Recognise RV failure");
  });

  it("the pump and VA-ECMO consoles offer End case so an unsolved run is logged", () => {
    expect(text(createElement(ImpellaConsole, consoleProps("rv", "supervised")))).toContain("End case");
    expect(text(createElement(EcmoConsole, consoleProps("harlequin", "supervised")))).toContain("End case");
    expect(text(createElement(EcmoConsole, consoleProps("harlequin", "supervised")))).not.toContain("mixing zone");
  });
});

describe("balloon pump adjustments are counted per adjustment, not per input event", () => {
  it("a drag is one adjustment; a pause or another control starts the next; a button press is one each", () => {
    const c = new MoveCounter();
    let moves = 0;
    // one drag across the inflation slider: an input every 16 ms for a second
    for (let t = 0; t <= 1000; t += 16) if (c.input("inflate", t)) moves++;
    expect(moves).toBe(1);
    // a second drag after a pause
    for (let t = 1000 + ADJUSTMENT_SETTLE_MS + 100; t <= 2500; t += 16) if (c.input("inflate", t)) moves++;
    expect(moves).toBe(2);
    // straight on to the deflation slider
    if (c.input("deflate", 2510)) moves++;
    expect(moves).toBe(3);
    // the ratio buttons
    c.press("ratio", 2520);
    c.press("ratio", 2530);
    moves += 2;
    // back to deflation within the settle time: a new adjustment, the control changed
    expect(c.input("deflate", 2540)).toBe(true);
  });
});

describe("the device-choice step", () => {
  it("opens every console, with the profile and the three questions, and nothing derived before the choice", () => {
    for (const p of SELECT_PRESETS) {
      const t = text(createElement(DeviceChoice, { consoleId: "impella", profile: p, cases: IMP_CASES, onScenario: noop, launchMode: null, runKey: 0 }));
      expect(t).toContain(p.brief);
      expect(t).toContain("Classify the patient");
      expect(t).toContain("Choose the support");
      expect(t).toContain("Name the finding that decided it");
      // the learner works out PAPi and cardiac power output and the classification; none is shown
      expect(t).not.toMatch(/PAPi|cardiac power|Debrief|accepted/i);
      expect(t).not.toMatch(VENDOR);
    }
  });

  it("the console names in running text keep the acronym's case", () => {
    expect(CONSOLE_NOUN).toEqual({ iabp: "balloon pump", impella: "microaxial pump", ecmo: "VA-ECMO" });
  });

  it("the debrief names the accepted support, the deciding finding and any critical error", () => {
    const p = SELECT_PRESET_BY_ID["select-lv-thrombus"];
    const r = scoreChoice(p, { classification: "upfront", device: "microaxial", finding: "both-axes", tradeOffStated: true });
    const t = text(createElement(ChoiceDebrief, { r }));
    expect(t).toContain("not accepted");
    expect(t).toContain("Critical error: Microaxial flow pump with LV thrombus");
    expect(t).toContain("Deciding finding: LV thrombus");
    expect(t).toContain("Intra-aortic balloon pump or VA-ECMO");
  });
});

describe("the MCS lab section", () => {
  it("tabs use generic names and each opens on the device-choice step", () => {
    for (const tab of ["iabp", "impella", "ecmo"] as const) {
      useUiStore.setState({ simTab: tab });
      const t = text(createElement(McsLab));
      expect(t).toContain("Balloon pump");
      expect(t).toContain("Microaxial pump");
      expect(t).toContain("VA-ECMO");
      expect(t).toContain(SELECT_PRESET_BY_ID[DEFAULT_SCENARIO].brief);
      expect(t).not.toMatch(VENDOR);
    }
  });

  it("no vendor name in the App navigation or the Dashboard cards", () => {
    const nav = appSrc.slice(appSrc.indexOf("const NAV"), appSrc.indexOf("function Icon"));
    expect(nav).toContain('label: "Mechanical support"');
    expect(nav).not.toMatch(VENDOR);
    const cards = dashboardSrc.slice(dashboardSrc.indexOf("const CARDS"), dashboardSrc.indexOf("function greeting"));
    for (const m of cards.matchAll(/title: "([^"]+)"[^}]*blurb: "([^"]+)"/g)) expect(`${m[1]} ${m[2]}`).not.toMatch(VENDOR);
    expect(cards).toContain('title: "Microaxial pump console"');
  });

  it("a launch opens the console that owns the scenario, whichever MCS sim names it", () => {
    expect(resolveMcsLaunch("impella", { scenario: "late-deflation", mode: "supervised" })).toEqual({ tab: "iabp", scenario: "late-deflation", mode: "supervised" });
    expect(resolveMcsLaunch("impella", { scenario: "harlequin" })).toEqual({ tab: "ecmo", scenario: "harlequin", mode: null });
    expect(resolveMcsLaunch("ecmo", { scenario: "select-arrest" })).toEqual({ tab: "ecmo", scenario: "select-arrest", mode: null });
    expect(resolveMcsLaunch("iabp", {})).toEqual({ tab: "iabp", scenario: null, mode: null });
    expect(resolveMcsLaunch("iabp", { scenario: "no-such-case" })).toBeNull();
  });
});

describe("core.launch.ts", () => {
  const declared = (launch.scenarios ?? []).map((s) => s.id);
  const built = [...SELECT_PRESETS.map((p) => p.id), ...CONSOLE_CASES.iabp.map((k) => k.id), ...CONSOLE_CASES.impella.map((k) => k.id), ...CONSOLE_CASES.ecmo.map((k) => k.id)];

  it("declares every preset and console case, and nothing else", () => {
    expect(declared.slice().sort()).toEqual(built.slice().sort());
    expect(new Set(built).size).toBe(built.length); // ids are unique across the consoles
    for (const id of declared) expect(resolveMcsLaunch("impella", { scenario: id })).not.toBeNull();
  });

  it("titles do not give the device choice away", () => {
    for (const s of launch.scenarios ?? []) if (s.id.startsWith("select-")) expect(s.title).not.toMatch(/balloon|microaxial|ECMO|pump|right-sided|no support/i);
  });

  it("practiceIndex lists every scenario under its lessons; the three support-choice lessons list the device-choice presets", () => {
    for (const s of launch.scenarios ?? [])
      for (const l of s.lessonIds) expect(practiceForLesson(l).some((e) => e.sim === "impella" && e.scenario === s.id), `${s.id} under ${l}`).toBe(true);
    const choice = ["pm-support-choice-when", "pm-support-choice-which", "pm-support-choice-shock"].flatMap((l) => practiceForLesson(l).map((e) => e.scenario));
    for (const p of SELECT_PRESETS.filter((x) => x.id !== "select-arrest")) expect(choice).toContain(p.id);
    expect(practiceForLesson("pm-support-choice-when").map((e) => e.scenario)).toContain("select-arrest");
  });
});

describe("the circulation runner (window.__lab.mcs.step)", () => {
  it("steps by hand: model time advances by the seconds asked, traces fill and stats update", () => {
    const r = new CirculationRunner();
    r.reset(PATIENTS.lvShock, { impella: { on: true, pLevel: 2, depth: 3.5 } });
    expect(r.elapsed()).toBe(0);
    const before = r.stats();
    expect(before).not.toBeNull();
    r.advance(10);
    expect(r.elapsed()).toBeCloseTo(10, 2);
    expect(r.read("art")(r.clock - 0.1)).toBeGreaterThan(0);
    expect(r.stats()!.map).toBeGreaterThan(0);
  });

  it("an injected engine is used as it is: same object, its own clock, no settling", () => {
    const engine = new Circulation(structuredClone(PATIENTS.lvShock), {});
    engine.run(3);
    const t = engine.s.t;
    const r = new CirculationRunner();
    r.reset(PATIENTS.lvShock, { impella: { on: true, pLevel: 4, depth: 3.5 } }, { engine });
    expect(r.sim).toBe(engine);
    expect(r.clock).toBeCloseTo(t, 6);
    expect(engine.devices.impella?.pLevel).toBe(4);
    // the engine keeps its own patient: the console's patient reaches it neither on reset nor on a change
    const own = engine.patient;
    expect(r.sim!.patient).toBe(own);
    r.setParams({ ...PATIENTS.lvShock, stressed: PATIENTS.lvShock.stressed + 250 }, { impella: { on: true, pLevel: 6, depth: 3.5 } });
    expect(r.sim!.patient).toBe(own);
    expect(engine.devices.impella?.pLevel).toBe(6);
    r.advance(2);
    expect(engine.s.t).toBeCloseTo(t + 2, 2);
    expect(r.elapsed()).toBeCloseTo(2, 2);
  });

  it("a fresh model is settled before it is shown", () => {
    const r = new CirculationRunner();
    r.reset(PATIENTS.normal, {}, { settleS: 4 });
    expect(r.clock).toBe(0);
    expect(r.stats()).not.toBeNull();
    expect(SETTLE_S).toBe(20);
  });
});

describe("after the in-app verification", () => {
  it("the pump schematic shows the target depth only in guided practice", () => {
    for (const mode of ["supervised", "independent", "exam"] as const)
      expect(text(createElement(ImpellaConsole, consoleProps("migrated", mode))), mode).not.toContain("target ≈ 3.5 cm");
    expect(text(createElement(ImpellaConsole, consoleProps("migrated", "guided")))).toContain("target ≈ 3.5 cm");
  });

  it("a finished console run shows its score, pass or fail, the criteria and a restart", () => {
    const failed = text(createElement(SessionDebrief, { result: scoreMcsSession({ targetsMet: false, harms: 1, criticalErrors: 0 }), harmLabel: "Free of suction episodes", onRestart: noop }));
    expect(failed).toContain("not passed");
    expect(failed).toMatch(/Targets held 0 \/ 60/);
    expect(failed).toMatch(/Free of suction episodes 15 \/ 25/);
    expect(failed).toContain("Restart this case");
    const passed = text(createElement(SessionDebrief, { result: scoreMcsSession({ targetsMet: true, harms: 0, criticalErrors: 0, extraMoves: 1 }), harmLabel: "Free of harmful episodes", showEfficiency: true }));
    expect(passed).toMatch(/\bpassed\b/);
    expect(passed).not.toContain("not passed");
    expect(passed).toMatch(/Adjustments kept to those needed 10 \/ 15/);
    expect(passed).not.toContain("Restart this case");
  });

  it("the console grids keep a single shrinkable column below xl", () => {
    for (const k of [createElement(IabpConsole, consoleProps("late-deflation")), createElement(ImpellaConsole, consoleProps("escalate")), createElement(EcmoConsole, consoleProps("ecpr"))])
      expect(renderToString(k)).toContain("grid grid-cols-1 xl:grid-cols-12");
  });
});

describe("the bleeding and air sources (tips mcs-iabp-no-heparin-1to1, mcs-ecmo-bubbles and the access-bleeding tips)", () => {
  it("the balloon pump's retroperitoneal-bleed case reports bleeding and asks for 1:1 rather than a timing change", () => {
    const k = IABP_CASES.find((x) => x.id === "retroperitoneal-bleed")!;
    expect(k.events).toEqual(["bleeding"]);
    expect(k.ratio).toBe(1);
    // the timing is already right, so the ratio is the only fix
    expect(k.start.inflate).toBe(IABP_CASES[0].start.inflate);
    const guided = text(createElement(IabpConsole, consoleProps("retroperitoneal-bleed", "guided")));
    expect(guided).toContain("run the balloon at 1:1");
    // outside guided practice the assessment names nothing
    expect(text(createElement(IabpConsole, consoleProps("retroperitoneal-bleed", "supervised")))).not.toContain("run the balloon at 1:1");
  });

  it("the ECPR case opens with a bubble in the arterial side of the joint and a way to aspirate it; the other cases do not", () => {
    const t = text(createElement(EcmoConsole, consoleProps("ecpr", "supervised")));
    expect(t).toContain("Bubble in the arterial side of the cannula joint");
    expect(t).toContain("Aspirate air through the side port");
    for (const id of ["distension", "harlequin"]) expect(text(createElement(EcmoConsole, consoleProps(id, "supervised")))).not.toContain("Bubble in the arterial side");
  });
});
