// physiology-post-pci-handover: the decision panel offers the post-PCI algorithm's four decisions for a
// stented case and the lab's treat-or-defer decisions otherwise; the post-PCI study shows no value before
// it is measured, no verdict before the decision, and the teaching after it; the bench's assess panel
// offers 'Measure post-PCI physiology' and hides the hand-over button while the lab does not publish the
// presets. Rendered to static markup.
//   npx vitest run src/ui/physiology/DecisionPanel.test.ts
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { CUTOFF, POST_PCI_DECISIONS, POST_PCI_PRESET_BY_ID, PHYS_BY_ID, postPciLosses, postPciTipContext } from "../../simulation/physiology";
import { TIP_VESSELS } from "../../content/lab/tips";
import physiologyLabSource from "../sections/PhysiologyLab.tsx?raw";
import { BENCH_BY_ID, applyPrep, deploy, initialState, preImaging } from "../../simulation/pciBench";
import DecisionPanel, { POST_PCI_DECISION_OPTIONS, PostPciStudy, STUDY_DECISION_OPTIONS, decisionOptionsFor } from "./DecisionPanel";
import AssessPanel, { PostPciSection } from "../bench/AssessPanel";
import { POST_PCI_LAUNCH_ENABLED } from "../../content/lab/presets/physiology/postPci.launch";

const render = (el: Parameters<typeof renderToString>[0]) => renderToString(el).replace(/<!-- -->/g, "");
const noop = () => undefined;

describe("DecisionPanel", () => {
  it("offers the post-PCI algorithm for a stented case and treat or defer otherwise", () => {
    expect(decisionOptionsFor(POST_PCI_PRESET_BY_ID["post-pci-good"].case)).toBe(POST_PCI_DECISION_OPTIONS);
    expect(decisionOptionsFor(PHYS_BY_ID["lad-intermediate"])).toBe(STUDY_DECISION_OPTIONS);
    expect(POST_PCI_DECISION_OPTIONS.map((o) => o.id)).toEqual([...POST_PCI_DECISIONS]);
    for (const o of POST_PCI_DECISION_OPTIONS) expect(o.label).not.toMatch(/[A-Z][a-z]+®|™/);
    // the cut-offs written as the lesson writes them
    expect(POST_PCI_DECISION_OPTIONS.find((o) => o.id === "accept-result")!.label).toContain("FFR above 0.80, iFR above 0.89");
    expect(CUTOFF.ffr.toFixed(2)).toBe("0.80");
  });

  it("the treat-or-defer options are the physiology lab's DECISIONS, label for label (a copy until the lab mounts this panel)", () => {
    const decl = physiologyLabSource.indexOf("const DECISIONS");
    expect(decl).toBeGreaterThan(-1);
    // the array literal after the declaration's type (whose ["decision"] would end a naive search)
    const block = physiologyLabSource.slice(physiologyLabSource.indexOf("= [", decl));
    const body = block.slice(0, block.indexOf("\n];"));
    const lab = [...body.matchAll(/\{\s*id:\s*"([^"]+)",\s*label:\s*"([^"]+)"\s*\}/g)].map((m) => ({ id: m[1], label: m[2] }));
    expect(lab.length).toBeGreaterThan(0);
    expect(STUDY_DECISION_OPTIONS.map((o) => ({ id: o.id, label: o.label }))).toEqual(lab);
  });

  it("the post-PCI tip context names every tip vessel and no other (the engine's copy of TIP_VESSELS)", () => {
    const c = POST_PCI_PRESET_BY_ID["post-pci-good"].case;
    for (const v of TIP_VESSELS) expect(postPciTipContext({ ...c, vessel: v }, { pulledBack: false }).vessel, v).toBe(v);
    for (const v of ["D1", "OM1", "PDA", "lad"]) expect(postPciTipContext({ ...c, vessel: v }, { pulledBack: false }).vessel, v).toBeUndefined();
  });

  it("marks nothing right or wrong before the decision, and shows the teaching only after it", () => {
    const before = render(createElement(DecisionPanel, { options: POST_PCI_DECISION_OPTIONS, decided: null, accepted: (id) => id === "post-dilate", onDecide: noop, children: "TEACHING" }));
    expect(before).not.toContain("border-good");
    expect(before).not.toContain("TEACHING");
    const after = render(createElement(DecisionPanel, { options: POST_PCI_DECISION_OPTIONS, decided: "treat-edge", accepted: (id) => id === "post-dilate", onDecide: noop, children: "TEACHING" }));
    expect(after).toContain("TEACHING");
    expect(after).toMatch(/data-decision="post-dilate"[^>]*border-good|border-good[^>]*data-decision="post-dilate"/);
    expect(after).toMatch(/data-decision="treat-edge"[^>]*border-danger|border-danger[^>]*data-decision="treat-edge"/);
  });
});

describe("PostPciStudy", () => {
  const c = POST_PCI_PRESET_BY_ID["post-pci-instent-step"].case;
  const L = postPciLosses(c);

  it("before measuring: the brief and the buttons, no value, no pullback, no verdict", () => {
    const html = render(createElement(PostPciStudy, { case: c }));
    expect(html).toContain("Measure the final FFR");
    expect(html).not.toContain(`FFR ${L.ffr.toFixed(2)}`);
    expect(html).not.toContain("pullback curve");
    expect(html).not.toContain(c.teaching.slice(0, 40));
  });

  it("measured and pulled back: the values and the pullback with the stent edges; still no verdict", () => {
    const html = render(createElement(PostPciStudy, { case: c, initial: { measured: true, pulledBack: true, decision: null } }));
    expect(html).toContain(`FFR ${L.ffr.toFixed(2)}`);
    expect(html).toContain("Hyperaemic pullback curve");
    expect(html).toContain("the stent, from its proximal to its distal edge");
    expect(html).toContain('data-part="stent-band"');
    expect(html).toContain("Stented segment along the pullback");
    expect(html).not.toContain(c.teaching.slice(0, 40));
  });

  it("decided: the teaching and the debrief items", () => {
    const html = render(createElement(PostPciStudy, { case: c, initial: { measured: true, pulledBack: false, decision: "post-dilate" } }));
    expect(html).toContain(c.teaching.slice(0, 40));
    expect(html).toContain("Pulled back through the stent before deciding");
  });
});

describe("the bench's assess panel", () => {
  it("offers 'Measure post-PCI physiology', and the hand-over button only when the lab publishes the presets", () => {
    const l = BENCH_BY_ID["focal-lad"];
    const p = preImaging(l, "IVUS");
    const s = applyPrep(l, initialState(), { kind: "balloon", balloon: "semi-compliant", diameter: 2.5, atm: 10 });
    const r = deploy(l, s, { diameter: 3.0, lengthMm: 18, proxEdge: p.landingProx - 1, atm: 9.8 }, [], "IVUS");
    const html = render(createElement(AssessPanel, { lesion: l, modality: "IVUS", result: r, onMore: noop, onRestart: noop, plan: null }));
    expect(html).toContain("Measure post-PCI physiology");
    // the study opens on the click; nothing of it is on the screen before
    expect(html).not.toContain("Measure the final FFR");
    expect(html).not.toContain("Open the study in the pressure wire lab");
    // opened: the study of this stent, and the hand-over button exactly when the lab publishes the preset
    const section = (available?: boolean) => render(createElement(PostPciSection, { lesion: l, result: r, initiallyOpen: true, ...(available === undefined ? {} : { available }) }));
    expect(section()).toContain("Measure the final FFR");
    expect(section().includes("Open the study in the pressure wire lab")).toBe(POST_PCI_LAUNCH_ENABLED);
    expect(section(true)).toContain("Open the study in the pressure wire lab");
    expect(section(false)).not.toContain("Open the study in the pressure wire lab");
    // the study is the preset the lab opens for this result (an in-stent step), not graded on another case
    expect(section()).toContain(POST_PCI_PRESET_BY_ID["post-pci-instent-step"].brief.slice(0, 40));
    // before the decision: nothing that says what the wire will or will not ask for
    expect(section()).not.toContain("imaging, not the pressure wire");
    expect(section()).not.toContain("imaging criterion");
    expect(section()).not.toContain('data-part="post-pci-imaging-note"');
    // after it: a 70% stent whose own residual waist reads above the cut-off, so imaging, not the wire, judges it
    const decided = render(createElement(PostPciSection, { lesion: l, result: r, initiallyOpen: true, initialStudy: { measured: true, pulledBack: true, decision: "post-dilate" } }));
    expect(decided).toContain("imaging, not the pressure wire, shows");
    expect(decided).toContain("below the 80% imaging criterion");
    expect(decided).not.toMatch(/\bpm-[a-z-]+/);
    // an optimised stent: no such note
    const good = deploy(l, s, { diameter: 3.0, lengthMm: 16, proxEdge: p.landingProx - 1, atm: 12 }, [{ diameter: 3.25, atm: 18, where: "full" }], "IVUS");
    expect(good.expansion).toBeGreaterThanOrEqual(80);
    const goodHtml = render(createElement(PostPciSection, { lesion: l, result: good, initiallyOpen: true }));
    expect(goodHtml).toContain("Measure the final FFR");
    expect(goodHtml).not.toContain("imaging criterion");
    const goodDecided = render(createElement(PostPciSection, { lesion: l, result: good, initiallyOpen: true, initialStudy: { measured: true, pulledBack: false, decision: "accept-result" } }));
    expect(goodDecided).not.toContain("imaging criterion");
  });
});
