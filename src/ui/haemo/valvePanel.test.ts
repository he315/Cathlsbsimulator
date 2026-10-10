// Render smoke tests for the aortic valve study panel (haemo-aortic-stenosis-studies): it appears in
// the catheter controls of a valve-study scenario only, the LV is reached through the crossing
// manoeuvre, and the live screen shows what an operator sees (report, recorder numbers, attempts) but
// not the indication, the monitor's score, the verdicts or the live Gorlin area outside guided mode.
//   npx vitest run src/ui/haemo/valvePanel.test.ts
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { SCENARIO_BY_ID } from "../../simulation/haemo";
import { haemoStudyReducer, initialStudy, type HaemoAction, type HaemoStudyState } from "../../simulation/haemoStudy";
import { avStudyReducer, initialAvStudy, stageReference, type AvAction, type AvStudyState } from "../../simulation/haemo/avCrossing";
import CatheterPanel from "./CatheterPanel";
import ValvePanel from "./ValvePanel";

const noop = () => undefined;
const html = (el: Parameters<typeof renderToString>[0]) => renderToString(el).replace(/<!-- -->/g, "");
const play = (st: HaemoStudyState, ...as: HaemoAction[]) => as.reduce(haemoStudyReducer, st);
const playAv = (st: AvStudyState, ...as: AvAction[]) => as.reduce(avStudyReducer, st);

/** A valve study crossed with the AL1, exchanged for a pigtail, second catheter in, baseline and 20 micrograms recorded. */
function staged(id: string): AvStudyState {
  let av = playAv(initialAvStudy(id), { type: "decide", decision: "cross" }, { type: "catheter", catheter: "AL1" }, { type: "wire", wire: "straight-hydrophilic" });
  while (!av.wireAcross) av = avStudyReducer(av, { type: "attempt", style: "controlled", inRoot: true });
  av = playAv(av, { type: "advance" }, { type: "exchange" }, { type: "second-arterial", on: true }, { type: "dobutamine", step: "baseline" }, { type: "record-stage", artLine: false, outputReady: true });
  av = playAv(av, { type: "stage-entry", stage: 0, field: "ava", value: stageReference(av.stages[0]!, "ava") + 0.4 });
  return av;
}
const studyFor = (id: string) => play(initialStudy(id), ADV, ADV, ADV, { type: "lhc", position: "Ao" }, { type: "lhc", position: "LV" }, { type: "art-line", on: true });
const ADV: HaemoAction = { type: "rhc-advance" };

describe("the aortic valve study panel", () => {
  it("CatheterPanel shows it in a valve-study scenario only, and the LV is reached through the crossing", () => {
    const valve = html(createElement(CatheterPanel, { study: initialStudy("as-discordant-cross"), dispatch: noop }));
    expect(valve).toContain("Aortic valve");
    expect(valve).toContain("Echo report and referral");
    expect(valve).toContain("Cross the aortic valve?");
    expect(valve).toContain("Cross the valve with the aortic valve controls below");
    expect(valve).not.toContain("cross into LV");
    // the calcium score of a scenario without a dobutamine study is shown once, with the report
    expect(valve.match(/CT valve calcium score/g)).toHaveLength(1);
    const plain = html(createElement(CatheterPanel, { study: initialStudy("aortic-stenosis"), dispatch: noop }));
    expect(plain).toContain("cross into LV");
    expect(plain).not.toContain("Echo report and referral");
    // a caller passing only the catheter fields gets the plain controls
    const { rhc, rhcCatheter, lhc, artLine, resp, pvc } = initialStudy("as-discordant-cross");
    expect(html(createElement(CatheterPanel, { study: { rhc, rhcCatheter, lhc, artLine, resp, pvc }, dispatch: noop }))).not.toContain("Aortic valve");
  });

  it("the report is shown, but not the indication or the debrief, before the study is submitted", () => {
    const out = html(createElement(ValvePanel, { study: initialStudy("as-concordant-echo"), dispatch: noop }));
    for (const line of SCENARIO_BY_ID["as-concordant-echo"].avStudy!.report) expect(out).toContain(line);
    expect(out).not.toContain(SCENARIO_BY_ID["as-concordant-echo"].avStudy!.why);
    expect(out).not.toContain("Valve study debrief");
  });

  it("crossing controls: attempts and time live; quality and embolic risk only in guided mode", () => {
    let av = playAv(initialAvStudy("as-discordant-cross", 12345), { type: "decide", decision: "cross" }, { type: "catheter", catheter: "pigtail" }, { type: "wire", wire: "standard-j" });
    av = playAv(av, { type: "attempt", style: "forceful", inRoot: true });
    const study = play(initialStudy("as-discordant-cross"), { type: "lhc", position: "Ao" });
    const live = html(createElement(ValvePanel, { study, dispatch: noop, initial: av, mode: "supervised" }));
    expect(live).toContain("attempts 1");
    expect(live).toContain("forceful pushes 1");
    expect(live).toContain("Forceful push at the valve");
    expect(live).toContain("5 F AL1");
    expect(live).not.toContain("manipulation quality");
    expect(live).not.toContain("embolic risk");
    // the kit and gradient-method notes carry verdicts: no tooltip hints outside guided mode
    expect(live).not.toMatch(/Oxford|true mean gradient|less accurate|will not enter/);
    const guided = html(createElement(ValvePanel, { study, dispatch: noop, initial: av, mode: "guided" }));
    expect(guided).toContain("manipulation quality");
    expect(guided).toContain("embolic risk");
    expect(guided).toMatch(/Oxford/);
    expect(guided).toMatch(/true mean gradient/);
  });

  it("dobutamine: the recorded stage row and the learner's entry, with no live Gorlin area or verdict outside guided mode", () => {
    const av = staged("lflg-true");
    const study = studyFor("lflg-true");
    const out = html(createElement(ValvePanel, { study, dispatch: noop, initial: av, mode: "independent" }));
    expect(out).toContain("Dobutamine study");
    expect(out).toContain("Start the infusion");
    expect(out).toContain("SV (mL)");
    expect(out).toContain(av.stages[0]!.co.toFixed(2));
    expect(out).not.toContain("Gorlin area (live)");
    expect(out).not.toContain("✗");
    const guided = html(createElement(ValvePanel, { study, dispatch: noop, initial: av, mode: "guided" }));
    expect(guided).toContain("Gorlin area (live)");
    expect(guided).toContain("✗");
  });

  it("after the diagnosis is submitted the debrief shows the indication, the decisions and the dobutamine response", () => {
    const av = staged("lflg-true");
    const study = play(studyFor("lflg-true"), { type: "answer", index: 0 });
    const out = html(createElement(ValvePanel, { study, dispatch: noop, initial: av }));
    expect(out).toContain("Valve study debrief");
    expect(out).toContain(SCENARIO_BY_ID["lflg-true"].avStudy!.why);
    expect(out).toContain("Dobutamine response: true severe stenosis");
    expect(out).toContain("Cross the aortic valve or not");
  });
});
