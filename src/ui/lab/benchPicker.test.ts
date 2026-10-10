// The bench's lesion picker matches the lesion on show. A launched platform preset (ostial-rca-short,
// small-distal-225, ectatic-rca, taper-lad) is not one of the picker's lessons, so the picker shows it as one
// disabled entry, selected, rather than falling back to the first lesion's title.
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BENCH_BY_ID, BENCH_LESIONS, MEASURE_LESIONS, PLATFORM_LESIONS } from "../../simulation/pciBench";
import PciBench, { newSession } from "../sections/PciBench";

const render = (id: string) => renderToString(createElement(PciBench, { initial: { session: newSession(id), mode: "guided" } })).replace(/<!-- -->/g, "");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
/** the lesion picker's markup */
const picker = (html: string) => {
  const m = html.match(/<select[^>]*aria-label="Lesion"[^>]*>([\s\S]*?)<\/select>/);
  expect(m).not.toBeNull();
  return m![1];
};
const selected = (sel: string) => [...sel.matchAll(/<option([^>]*)>([^<]*)<\/option>/g)].filter((o) => /selected=""/.test(o[1]));

describe("the lesion picker shows the lesion on show", () => {
  const listed = new Set([...BENCH_LESIONS, ...MEASURE_LESIONS].map((k) => k.id));
  const presets = PLATFORM_LESIONS.filter((k) => !listed.has(k.id));

  it("there are platform presets outside the picker", () => {
    expect(presets.map((k) => k.id)).toEqual(expect.arrayContaining(["ostial-rca-short", "small-distal-225", "ectatic-rca", "taper-lad"]));
  });

  it.each(presets.map((k) => k.id))("a launched %s is selected as one disabled entry with its own title", (id) => {
    const sel = picker(render(id));
    const on = selected(sel);
    expect(on).toHaveLength(1);
    expect(on[0][1]).toContain(`value="${id}"`);
    expect(on[0][1]).toContain('disabled=""');
    expect(on[0][2]).toBe(esc(BENCH_BY_ID[id].title));
    expect(sel).not.toMatch(new RegExp(`<option[^>]*selected=""[^>]*value="${BENCH_LESIONS[0].id}"`));
  });

  it("a picker lesion adds no extra entry", () => {
    for (const id of [BENCH_LESIONS[0].id, MEASURE_LESIONS[0].id]) {
      const sel = picker(render(id));
      expect(sel).not.toContain('disabled=""');
      expect((sel.match(/<option/g) ?? []).length).toBe(BENCH_LESIONS.length + MEASURE_LESIONS.length);
      const on = selected(sel);
      expect(on).toHaveLength(1);
      expect(on[0][1]).toContain(`value="${id}"`);
    }
  });
});
