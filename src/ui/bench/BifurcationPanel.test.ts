// The bifurcation bench's panel and view (pci-bench-bifurcation), rendered to static markup: every step of
// every technique the bench builds renders, the controls send what they show, the read-outs and findings
// follow the run's policy, and the section on show changes the cross-section.
//   npx vitest run src/ui/bench/BifurcationPanel.test.ts
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { BIF_PRESETS, applyStep, bifStartState, currentStep, isFinished, plannedTechniques, runReference, type BifState } from "../../simulation/bench/bifurcation";
import { PLATFORMS, platformFor } from "../../simulation/bench/platforms";
import { TECHNIQUE_STEPS } from "../../simulation/pci/technique/steps";
import BifurcationPanel, { coerceStent, missingChoices, missingValues, stepDefaults } from "./BifurcationPanel";
import BifurcationView, { BIF_SECTIONS } from "../imaging/BifurcationView";

const noop = () => undefined;
const render = (el: Parameters<typeof renderToString>[0]) => renderToString(el).replace(/<!-- -->/g, "");
const panel = (state: BifState, guided = false) => render(createElement(BifurcationPanel, { state, guided, onChoose: noop, onStep: noop, onEscalate: noop, onRestart: noop, message: null }));
const view = (state: BifState, showReadouts = false, section: (typeof BIF_SECTIONS)[number]["id"] = "proximal") =>
  render(createElement(BifurcationView, { state, modality: "OCT", section, showReadouts }));

const RUNS: [string, string][] = [
  ["bif-provisional", "provisional"],
  ["bif-dk-crush", "dk-crush"],
  ["bif-culotte", "culotte"],
  ["bif-tap", "tap"],
  ["bif-tap", "reverse-crush"],
];

describe("BifurcationPanel and BifurcationView", () => {
  it("render at the plan, at every step of each technique and at the end", () => {
    for (const g of BIF_PRESETS) {
      const plan = bifStartState(g.id)!;
      expect(panel(plan)).toContain("Choose the technique");
      expect(view(plan)).toContain("<svg");
    }
    for (const [id, t] of RUNS) {
      let s = bifStartState(id, { technique: t, start: "1" })!;
      while (!isFinished(s)) {
        const st = currentStep(s)!;
        const html = panel(s);
        expect(html, `${t} ${st.id}`).toContain(`Step ${st.n}: `);
        for (const sec of BIF_SECTIONS) expect(view(s, false, sec.id), `${t} ${st.id} ${sec.id}`).toContain("<svg");
        s = runReference(s, s.next + 1);
      }
      const end = panel(s);
      expect(end, `${id} ${t}`).toContain("Result");
      expect(view(s, true)).toContain("SB ostium covered by metal");
    }
  });

  it("each step's defaults are what the engine accepts; the strut, the kiss, the TAP deflation, the protrusion and the reinflation must be chosen", () => {
    for (const [id, t] of RUNS) {
      let s = bifStartState(id, { technique: t, start: "1" })!;
      while (!isFinished(s)) {
        const st = currentStep(s)!;
        const input = stepDefaults(s, st);
        const missing = missingChoices(s, st, input);
        if (st.action === "rewire") expect(missing).toContain("the strut");
        if (st.action === "kiss") expect(missing).toContain("how the balloons are inflated");
        if (st.action === "kiss" && t === "tap") expect(missing).toContain("which balloon is deflated first");
        if (st.action === "assess-branch") expect(missing).toContain("whether the side branch is compromised");
        // the key teaching numbers have no default to accept
        const toEnter = missingValues(s, st, input);
        if (st.action === "position-stent" && st.branch === "sb" && !(t === "tap" && st.id === "deliver-sb-stent")) {
          expect(input.protrusionMm, `${t} ${st.id}`).toBeUndefined();
          expect(toEnter, `${t} ${st.id}`).toContain("the protrusion");
        }
        if (st.action === "deploy-stent" && st.branch === "sb" && t === "dk-crush") {
          expect(input.postAtm).toBeUndefined();
          expect(toEnter).toContain("the reinflation pressure");
        }
        if (!toEnter.length) expect(missingValues(s, st, { ...input, protrusionMm: 2, postAtm: 20 })).toEqual([]);
        // the displayed defaults plus the required choices make a step the engine takes
        const r = applyStep(s, st.id, { ...input, cell: "distal", kiss: "two-step", deflate: "mv-first", branch: "sb", sbJudged: "compromised", ...(toEnter.length ? { protrusionMm: 2, postAtm: 20 } : {}) });
        expect(r.ok, `${t} ${st.id}: ${r.message}`).toBe(true);
        s = runReference(s, s.next + 1);
      }
    }
  });

  it("findings an operator would not see wait for the final assessment, except in guided mode", () => {
    const at = bifStartState("bif-dk-crush", { start: "rewire-proximal-strut" })!;
    const wrong = applyStep(at, "rewire-proximal-strut", { cell: "distal" }).state;
    expect(panel(wrong, false)).not.toContain("Rewired through a distal strut");
    expect(panel(wrong, true)).toContain("Rewired through a distal strut");
    // a failure shows at once
    const short = applyStep(bifStartState("bif-dk-crush", { start: "position-sb-stent" })!, "position-sb-stent", { protrusionMm: 1 }).state;
    expect(panel(short, false)).toContain("The run has failed at step 2");
    // the step list marks the step that failed, not the one after it
    expect(panel(short, false)).toMatch(/aria-current="step"[^>]*>\s*<span[^>]*>2<\/span>/);
  });

  it("the protrusion and the pulled-back reinflation start empty and hold the step until a number is typed", () => {
    const pos = bifStartState("bif-dk-crush", { technique: "dk-crush", start: "position-sb-stent" })!;
    const html = panel(pos, false);
    expect(html).toContain("Enter the protrusion");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Do step 2<\/button>/);
    const tap = bifStartState("bif-tap", { start: "set-protrusion" })!;
    expect(panel(tap, false)).toContain("Enter the protrusion");
    const dep = bifStartState("bif-dk-crush", { technique: "dk-crush", start: "deploy-sb-stent" })!;
    expect(panel(dep, false)).toContain("Enter the reinflation pressure");
  });

  it("the read-outs show only when asked for; the cross-sections differ by section", () => {
    const s = runReference(bifStartState("bif-culotte", { technique: "culotte", start: "1" })!, 99);
    expect(view(s, false)).not.toContain("SB ostium covered by metal");
    expect(view(s, true)).toContain("Double layer");
    const sections = BIF_SECTIONS.map((sec) => view(s, false, sec.id));
    expect(new Set(sections).size).toBe(BIF_SECTIONS.length);
  });

  it("the TAP preset offers the bail-outs at the provisional run's final assessment step", () => {
    const prov = runReference(bifStartState("bif-tap", { start: "wire-both" })!, 10);
    expect(panel(prov)).toContain("Bail out: TAP");
    expect(panel(prov)).toContain("Bail out: Reverse (internal) crush");
    expect(panel(runReference(bifStartState("bif-provisional", { start: "1" })!, 10))).not.toContain("Bail out");
  });

  it("outside guided mode the step titles do not give the choices away; guided mode and the debrief show the lesson's names", () => {
    const at = bifStartState("bif-dk-crush", { technique: "dk-crush", start: "rewire-proximal-strut" })!;
    const live = panel(at, false);
    expect(live).toContain("Step 7: Rewire the side branch through the crushed stent");
    for (const giveaway of ["proximal strut", "distal strut", "two-step kiss", "in two steps"]) expect(live, giveaway).not.toContain(giveaway);
    const guided = panel(at, true);
    expect(guided).toContain("proximal strut");
    expect(guided).toContain("two-step kiss");
    // TAP and culotte
    const tap = panel(bifStartState("bif-tap", { start: "tap:kiss" })!, false);
    expect(tap).not.toContain("deflating the MV balloon first");
    expect(tap).not.toContain("just short of the neocarina");
    expect(tap).not.toContain("minimal protrusion");
    expect(panel(bifStartState("bif-culotte", { technique: "culotte", start: "first-stent" })!, false)).not.toContain("more angulated branch");
    // the names return once the run is over
    const done = runReference(at, 99);
    expect(panel(done, false)).toContain("proximal strut");
  });

  it("the plan offers each preset's techniques in the catalogue's order, not best first", () => {
    for (const g of BIF_PRESETS) {
      const html = panel(bifStartState(g.id)!);
      const names = plannedTechniques(g).map((o) => TECHNIQUE_STEPS[o.technique].name);
      expect(names.length, g.id).toBeGreaterThanOrEqual(2);
      const at = names.map((n) => html.indexOf(`>${n}</button>`));
      expect(at.every((i) => i >= 0), g.id).toBe(true);
      expect([...at].sort((a, b) => a - b), g.id).toEqual(at);
    }
  });

  it("provisional step 6 asks for the learner's judgement and shows no answer", () => {
    const at = bifStartState("bif-provisional", { technique: "provisional", start: "assess-sb" })!;
    const html = panel(at, false);
    expect(html).toContain("Not compromised");
    expect(html).toContain("Choose whether the side branch is compromised");
    expect(html).not.toMatch(/narrowed behind the struts|looks open/);
  });

  it("a platform switch keeps what is shown and what is sent the same", () => {
    const base = { platformId: "A" as const, stentMm: 3.0, lengthMm: 18 };
    for (const p of PLATFORMS) {
      const c = coerceStent({ ...base, platformId: p.id });
      expect(platformFor(p.id).lengths, p.id).toContain(c.lengthMm);
      expect(platformFor(p.id).offers(c.stentMm!), p.id).toBe(true);
    }
    // a length one platform lacks is moved to its nearest length
    const lacking = PLATFORMS.find((p) => !p.lengths.includes(18));
    if (lacking) expect(coerceStent({ ...base, platformId: lacking.id }).lengthMm).not.toBe(18);
    // a diameter the platform does not make is moved to the nearest it does
    const noSmall = PLATFORMS.find((p) => !p.offers(2.25));
    if (noSmall) expect(coerceStent({ ...base, platformId: noSmall.id, stentMm: 2.25 }).stentMm).toBe(noSmall.diameters[0]);
    // inputs without a platform pass unchanged
    expect(coerceStent({ protrusionMm: 1 })).toEqual({ protrusionMm: 1 });
  });
});
