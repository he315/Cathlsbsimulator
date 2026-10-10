// pci-lab-shell-session: the PCI lab's table strip. The latest procedure event says what the operator would
// not be told (the wire across the lesion, a geographic miss), so the live strip shows it only as a teaching
// aid (labScreens' teachingAids: guided practice with the overlays toggleable), never in independent or exam
// mode.
//   npx vitest run src/ui/pci/PciTableStrip.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PciTableStrip } from "./PciLab";
import { PciLabSession, policyForMode } from "./PciLabSession";
import { labScreens } from "../lab/visibility";
import type { LaunchMode } from "../../content/schema";

const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
});

/** A session in `mode` with the guide engaged and an event in the procedure log. */
function withEvent(mode: LaunchMode): PciLabSession {
  const x = new PciLabSession({ scenarioId: "lad-focal", team: false, headlessFrames: true, mode, policy: policyForMode(mode) });
  sessions.push(x);
  x.engageGuide();
  x.setPedal({ fluoro: true, cine: false });
  for (let i = 0; i < 20; i++) {
    x.moveWire(4);
    x.step(1 / 15);
  }
  x.setPedal({ fluoro: false, cine: false });
  expect(x.st.events.length).toBeGreaterThan(0);
  return x;
}

const strip = (x: PciLabSession) => renderToStaticMarkup(createElement(PciTableStrip, { session: x, recommended: [], showEvent: labScreens(x.policy).teachingAids }));

describe("the PCI table strip's event line", () => {
  for (const mode of ["independent", "exam"] as LaunchMode[]) {
    it(`shows no procedure event text in ${mode} mode`, () => {
      const x = withEvent(mode);
      const html = strip(x);
      for (const e of x.st.events) expect(html).not.toContain(e.text);
      expect(html).not.toContain('role="status"');
    });
  }

  it("shows the latest event as a teaching aid in guided practice", () => {
    const x = withEvent("guided");
    expect(labScreens(x.policy).teachingAids).toBe(true);
    const last = x.st.events[x.st.events.length - 1];
    expect(strip(x)).toContain(last.text);
  });
});
