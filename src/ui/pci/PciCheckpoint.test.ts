// pci-budgets-stop-rules: the contrast counter and the checkpoint's source line.
// The counter's colour rests on the patient's computed ceiling, so it is coloured only when the ceiling
// itself is shown (teaching aids or an agreed plan figure). The source line names each book once.
//   npx vitest run src/ui/pci/PciCheckpoint.test.ts
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import PciCheckpoint, { BudgetCounters } from "./PciCheckpoint";
import { BUDGET_SOURCES, type BudgetCheckpoint, type BudgetReadout } from "../../simulation/pci/budgets";

function readout(totalMl: number, ceilingMl: number): BudgetReadout {
  return {
    contrast: {
      labMl: totalMl,
      handedOverMl: 0,
      totalMl,
      ceilingMl,
      source: "plan",
      label: "the stricter rule",
      sourceRef: BUDGET_SOURCES.stopOrStage,
      ruleMl: ceilingMl,
      planMl: null,
      agreed: false,
      fraction: totalMl / ceilingMl,
      warnAtMl: ceilingMl * 0.8,
      status: "ok",
      warned: false,
      notes: [],
    },
    radiation: { karMGy: 1000, kapGyCm2: 50, fluoroS: 300, cineRuns: 4, doseRateMGyMin: 10, doseRateHigh: false, limitMGy: 5000, high: false },
    elapsedS: 600,
    progress: { cto: false, crossed: false },
    pending: null,
  } as BudgetReadout;
}

describe("BudgetCounters", () => {
  it("colours the contrast counter from 50% of the ceiling only when the ceiling is shown", () => {
    const shown = renderToStaticMarkup(createElement(BudgetCounters, { budget: readout(60, 106.5), showCeiling: true }));
    expect(shown).toContain('data-tone="warn"');
    expect(shown).toContain("60/107 mL");
    const hidden = renderToStaticMarkup(createElement(BudgetCounters, { budget: readout(60, 106.5), showCeiling: false }));
    expect(hidden).toContain('data-tone="ok"');
    expect(hidden).not.toContain("107");
    const over = renderToStaticMarkup(createElement(BudgetCounters, { budget: readout(120, 106.5), showCeiling: false }));
    expect(over).toContain('data-tone="ok"');
    expect(over).not.toContain("text-danger");
  });

  it("keeps the counters on one fixed-height line", () => {
    const html = renderToStaticMarkup(createElement(BudgetCounters, { budget: readout(60, 106.5), showCeiling: true }));
    expect(html).toContain("flex-nowrap");
    expect(html).toContain("whitespace-nowrap");
    expect(html).toContain("h-6");
  });
});

describe("PciCheckpoint", () => {
  it("names each source book once", () => {
    const cp: BudgetCheckpoint = {
      id: "contrast-ceiling-1",
      reason: "contrast-ceiling",
      t: 0,
      text: "Contrast is at the ceiling.",
      at: { contrastMl: 107, ceilingMl: 106.5, karMGy: 1000, karLimitMGy: 5000, elapsedS: 600, crossed: false },
      sources: [{ book: BUDGET_SOURCES.stopOrStage.book, where: "elsewhere" }, BUDGET_SOURCES.stopOrStage],
      answer: null,
    };
    const html = renderToStaticMarkup(createElement(PciCheckpoint, { checkpoint: cp, variant: "modal", cto: false, showCeiling: false, showVerdict: false, onAnswer: () => null, onClose: () => {} }));
    const line = html.match(/Sources: ([^<]*)</)?.[1] ?? "";
    expect(line).toBe(BUDGET_SOURCES.stopOrStage.book);
  });
});
