// Render smoke tests for the haemodynamics lab panels split out of HaemoLab.tsx
// (haemo-study-session-and-tips): each panel renders from a study state, shows what an operator sees
// and keeps the reference values for the debrief.
//   npx vitest run src/ui/haemo/panels.test.ts
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { stepUp } from "../../simulation/haemo";
import { currentSet, diagnosisOptions, haemoStudyReducer, initialStudy, referenceValue, shownChambers, studyScenario, studyTruth, type HaemoAction, type HaemoStudyState } from "../../simulation/haemoStudy";
import { useProgressStore } from "../../state/useProgressStore";
import CatheterPanel from "./CatheterPanel";
import TracePanel, { RecordedPressures } from "./TracePanel";
import OximetryPanel from "./OximetryPanel";
import CalcPanel from "./CalcPanel";
import DiagnosisPanel from "./DiagnosisPanel";
import HaemoLab, { launchStudy } from "../sections/HaemoLab";

(useProgressStore as unknown as { getServerState: () => unknown }).getServerState = () => useProgressStore.getState();

const play = (st: HaemoStudyState, ...as: HaemoAction[]) => as.reduce(haemoStudyReducer, st);
const noop = () => undefined;
const html = (el: Parameters<typeof renderToString>[0]) => renderToString(el).replace(/<!-- -->/g, "");

function recorded(id: string): HaemoStudyState {
  let st = play(initialStudy(id), { type: "art-line", on: true });
  for (let i = 0; i < 4; i++) st = play(st, { type: "rhc-advance" }, { type: "record" });
  return play(st, { type: "sat", site: "PA" }, { type: "sat", site: "Ao" });
}

describe("haemodynamics lab panels render", () => {
  it("CatheterPanel: the right heart path, the pigtail and the side-arm", () => {
    const out = html(createElement(CatheterPanel, { study: initialStudy("normal"), dispatch: noop }));
    expect(out).toContain("Right heart catheter");
    expect(out).toContain("wedge");
    expect(out).toContain("cross into LV");
    expect(out).toContain("Insert");
    const pig = html(createElement(CatheterPanel, { study: play(initialStudy("normal"), { type: "rhc-catheter", catheter: "pigtail" }), dispatch: noop }));
    expect(pig).not.toContain(">wedge<");
  });

  it("TracePanel and RecordedPressures: the recorder's read-out and the recorded table", () => {
    const st = recorded("normal");
    const out = html(createElement(TracePanel, { scenario: studyScenario(st), shown: shownChambers(st), resp: true, pvc: false, onRecord: noop }));
    expect(out).toContain("Pressure recorder");
    expect(out).toContain("Record");
    const empty = html(createElement(TracePanel, { scenario: studyScenario(initialStudy("normal")), shown: [], resp: true, pvc: false, onRecord: noop }));
    expect(empty).toContain("Insert the right heart catheter");
    const table = html(createElement(RecordedPressures, { rec: currentSet(st).rec }));
    expect(table).toContain("Wedge");
    expect(table).toMatch(/mean \d+/);
  });

  it("OximetryPanel: samples, and the step-up reading only when asked to interpret", () => {
    let st = initialStudy("asd");
    for (const k of ["SVC", "IVC", "RA", "RV", "PA", "Ao"] as const) st = play(st, { type: "sat", site: k });
    const sats = currentSet(st).rec.sats;
    const hidden = html(createElement(OximetryPanel, { sats, onSample: noop, step: stepUp(studyScenario(st)), showInterpretation: false }));
    expect(hidden).toContain("Oximetry run");
    expect(hidden).not.toContain("Step-up");
    const shown = html(createElement(OximetryPanel, { sats, onSample: noop, step: stepUp(studyScenario(st)), showInterpretation: true }));
    expect(shown).toContain("atrial level");
  });

  it("CalcPanel: closed by default, entries when open, no reference value on the live screen", () => {
    const st = recorded("shock-lv");
    const closed = html(createElement(CalcPanel, { study: st, dispatch: noop, mode: "guided" }));
    expect(closed).toContain("Calculations");
    expect(closed).not.toContain("Fick cardiac output");
    const open = play(st, { type: "calc-panel", open: true });
    const out = html(createElement(CalcPanel, { study: open, dispatch: noop, mode: "guided" }));
    expect(out).toContain("Fick cardiac output");
    expect(out).toContain("Check");
    expect(out).toContain("Show the formula");
    const ref = referenceValue(studyTruth(open), "cpo").toFixed(2);
    expect(out).not.toContain(`${ref} W`);
    // after an entry: the formula in every mode; the verdict only in guided mode (a guided aid), and
    // supervised offers no formula before an entry
    const entered = play(open, { type: "enter", key: "cpo", value: 0.1 });
    const after = html(createElement(CalcPanel, { study: entered, dispatch: noop, mode: "supervised" }));
    expect(after).toContain("0.1 W entered");
    expect(after).not.toContain("outside tolerance");
    expect(after).not.toContain("accepted");
    expect(after).toContain("MAP × CO ÷ 451");
    expect(after).not.toContain("Show the formula");
    const right = play(open, { type: "enter", key: "cpo", value: Number(ref) });
    for (const mode of ["supervised", "independent", "exam"] as const) {
      const out2 = html(createElement(CalcPanel, { study: right, dispatch: noop, mode }));
      expect(out2).not.toContain("accepted");
      expect(out2).not.toContain("outside tolerance");
    }
    expect(html(createElement(CalcPanel, { study: right, dispatch: noop, mode: "guided" }))).toContain(": accepted");
    expect(html(createElement(CalcPanel, { study: entered, dispatch: noop, mode: "guided" }))).toContain("outside tolerance");
    // the after-PCI set shows the decision table
    const post = play(open, { type: "next-set" });
    expect(html(createElement(CalcPanel, { study: post, dispatch: noop, mode: "guided" }))).toContain("CPO above 0.6 W and PAPi above 0.9");
  });

  it("CalcPanel: no Gorlin aortic valve area in HOCM, with the fixed-orifice caveat", () => {
    let st = play(recorded("hocm"), { type: "lhc", position: "LV" }, { type: "record" }, { type: "calc-panel", open: true });
    expect(currentSet(st).rec.simLVAo).toBe(true);
    const out = html(createElement(CalcPanel, { study: st, dispatch: noop, mode: "guided" }));
    expect(out).toContain("Gorlin assumes a fixed orifice: not valid for dynamic LVOT obstruction");
    expect(out).not.toContain("Aortic valve area (Gorlin) entry");
    st = play(st, { type: "enter", key: "ava", value: 1 });
    expect(currentSet(st).entries.ava).toBeUndefined();
  });

  it("DiagnosisPanel: options before, the debrief with reference values after", () => {
    const st = play(recorded("shock-lv"), { type: "enter", key: "cpo", value: 0.4 });
    const before = html(createElement(DiagnosisPanel, { study: st, onAnswer: noop, onRepeat: noop }));
    expect(before).toContain("Diagnosis");
    expect(before).not.toContain("Your calculations");
    const idx = diagnosisOptions(studyScenario(st)).indexOf("LV-predominant cardiogenic shock");
    const after = html(createElement(DiagnosisPanel, { study: play(st, { type: "answer", index: idx }), onAnswer: noop, onRepeat: noop }));
    expect(after).toContain("Correct");
    expect(after).toContain("Your calculations");
    expect(after).toContain("ref ");
    // a shunt debrief says how Qp:Qs was graded (PvO₂ = SaO₂) beside the model's pulmonary venous value
    let asd = recorded("asd");
    for (const k of ["SVC", "IVC", "RA", "RV"] as const) asd = play(asd, { type: "sat", site: k });
    asd = play(asd, { type: "enter", key: "qpqs", value: 2.3 });
    const ai = diagnosisOptions(studyScenario(asd)).indexOf(studyScenario(asd).diagnosis);
    const shunt = html(createElement(DiagnosisPanel, { study: play(asd, { type: "answer", index: ai }), onAnswer: noop, onRepeat: noop }));
    expect(shunt).toContain("pulmonary venous saturation taken as SaO₂");
    expect(shunt).toContain(`ref ${referenceValue(studyTruth(asd), "qpqs").toFixed(2)}`);
  });

  it("HaemoLab renders the whole lab", () => {
    const out = html(createElement(HaemoLab));
    expect(out).toContain("Haemodynamics lab");
    expect(out).toContain("Pressure recorder");
    expect(out).toContain("Oximetry run");
    expect(out).toContain("Calculations");
  });
});

describe("haemodynamics lab launch", () => {
  it("launchStudy reads events from the comma-separated string and tolerates an array", () => {
    expect(launchStudy({ scenario: "shock-lv", events: "hypotension, not-an-event" })?.state.raised).toEqual(["hypotension"]);
    const asArray = { scenario: "shock-lv", events: ["hypotension"] } as unknown as Record<string, string>;
    expect(() => launchStudy(asArray)).not.toThrow();
    expect(launchStudy(asArray)?.state.raised).toEqual(["hypotension"]);
    const asNumber = { scenario: "shock-lv", events: 3 } as unknown as Record<string, string>;
    expect(launchStudy(asNumber)?.state.raised).toEqual([]);
    expect(launchStudy({ scenario: "no-such-scenario" })).toBeNull();
  });
});

