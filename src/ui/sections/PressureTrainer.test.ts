// The pressure recognition drill's section renders its set picker (no drawn trace gallery), and the live
// item's stem panel never names the trace's class: for every item type and every context line it can be
// drawn with, the rendered stem holds no name label and no word of a tip state.
//   npx vitest run src/ui/sections/PressureTrainer.test.ts
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import PressureTrainer, { ItemStem } from "./PressureTrainer";
import { DRILL_ITEM_TYPES, DRILL_NAME_LABEL, DRILL_PATIENTS, DRILL_SETS, DRILL_SET_LABEL, drillStem, drillStemParts } from "../../simulation/pressureDrill";

/** Words of the tip states and the names (the reveal's STATE_WORDS and DRILL_NAME_LABEL's distinctive words). */
const CLASS_WORDS = /damp|ventriculari|wedg|spasm|stenosis|hypotens|fault|free|aortic|left ventric|\blv\b|open line|no signal|side holes/i;

describe("PressureTrainer", () => {
  it("opens on the set picker with every set, and no static gallery of drawn traces", () => {
    const html = renderToString(createElement(PressureTrainer));
    expect(html).toContain("Pressure recognition drill");
    for (const s of DRILL_SETS) expect(html).toContain(DRILL_SET_LABEL[s]);
    expect(html).not.toContain("Over-wedged");
  });

  it("the live stem panel of every item, with every context line it can show, names no class", () => {
    const labels = Object.values(DRILL_NAME_LABEL).map((l) => l.toLowerCase());
    for (const type of DRILL_ITEM_TYPES)
      for (const context of drillStemParts(type).contexts) {
        const html = renderToString(createElement(ItemStem, { stem: drillStem({ type, patientSeed: DRILL_PATIENTS[0], context }), baseline: { sys: 120, dia: 70 } }));
        const text = html.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ");
        expect({ type, context, cls: CLASS_WORDS.test(text) }).toEqual({ type, context, cls: false });
        for (const l of labels) expect(text.toLowerCase()).not.toContain(l);
        expect(text).toContain("120/70");
      }
  });
});
