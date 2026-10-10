// pci-lab-shell-session: the lab layout follows the width it is given. The two monitors keep at least
// 220 px each beside the haemodynamic column; below a 900 px lab width (container query on the lab) the
// haemodynamic and dose column runs under the monitors across both, the table-side controls sit under
// the table strip and the lab scrolls, while the modal stays over the whole lab.
//   npx vitest run src/ui/lab/LabLayout.test.ts
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import LabLayout from "./LabLayout";

const NARROW = "[@container(max-width:899px)]:";

function html(modal: boolean) {
  const slot = (id: string) => createElement("i", { "data-slot": id });
  return renderToStaticMarkup(
    createElement(LabLayout, {
      lab: "pci",
      header: slot("header"),
      live: slot("live"),
      reference: slot("reference"),
      haemo: slot("haemo"),
      dose: slot("dose"),
      table: slot("table"),
      controls: slot("controls"),
      modal: modal ? slot("modal") : undefined,
    })
  );
}

describe("LabLayout widths", () => {
  it("the lab is a size container and the monitors have a usable minimum width", () => {
    const h = html(false);
    expect(h).toContain("[container-type:inline-size]");
    expect(h).toContain("grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_minmax(300px,340px)]");
    expect(h).not.toContain("minmax(0,1fr)_minmax(0,1fr)");
  });

  it("below 900 px the side column spans the monitors, the controls stack and the lab scrolls", () => {
    const h = html(false);
    for (const c of ["overflow-y-auto", "grid-cols-2", "col-span-2", "grid-cols-1", "h-auto"]) expect(h).toContain(NARROW + c);
  });

  it("the modal sits outside the scrolling content, over the whole lab", () => {
    const h = html(true);
    const scroller = h.indexOf(NARROW + "overflow-y-auto");
    const modal = h.indexOf('data-slot="modal"');
    expect(scroller).toBeGreaterThan(0);
    expect(modal).toBeGreaterThan(h.indexOf('data-slot="controls"'));
    // the scrolling wrapper closes before the modal's overlay opens
    const between = h.slice(h.indexOf('data-slot="controls"'), modal);
    expect(between).toContain("</div></div><div class=\"absolute inset-0 z-30");
  });
});
