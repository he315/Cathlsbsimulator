// pci-device-delivery, after the in-app verification: a hand push on a device that the attending stops is
// reported as not taken, and the support console names the anchor branches in full, largest first.
//   npx vitest run src/ui/pci/inputBindings/support.fixes.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PciLabSession } from "../PciLabSession";
import { PciInputTarget } from "../pciInputTarget";
import { resolvePciLaunch } from "../launch";
import { createInputSystem } from "../../../input/system";
import { defaultSettings, pciGripOrder, pciSettings } from "../../../input/settings";
import { useSeriesStore } from "../../../state/useSeriesStore";
import { backloadDevice, checkLabel, prepareDevice, requestDevice, setValve } from "../../../simulation/angioPci";
import { anchorBranches } from "../../../simulation/pci/actions/devices";
import { anchorBranchName as branchName, applyDeliveryAction } from "./support";
import SupportConsole from "../consoles/SupportConsole";

const sessions: PciLabSession[] = [];
const targets: PciInputTarget[] = [];
afterEach(() => {
  for (const t of targets.splice(0)) t.dispose();
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

function rig() {
  const r = resolvePciLaunch({ scenario: "rca-stuck-stent", start: "wire-across", mode: "guided" });
  expect(r.problems).toEqual([]);
  const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
  sessions.push(x);
  const sys = createInputSystem({ storage: null, settings: pciSettings(defaultSettings()), gripOrder: pciGripOrder(null), initialGrip: "wire014", getPads: () => [] });
  const t = new PciInputTarget(x, sys);
  targets.push(t);
  return { x, t };
}

describe("a stopped device push (pci-device-delivery)", () => {
  it("hand() returns false when the attending stops the push, and true when it lets it through", () => {
    const { x, t } = rig();
    expect(applyDeliveryAction(x, "load-device", (st) => setValve(backloadDevice(prepareDevice(checkLabel(requestDevice(st, "sc", 2.0, 15)))), true))).toBe(true);
    expect(t.hand({ kind: "push", device: "balloon", mm: 1 })).toBe(true);
    const c0 = x.st.device!.centreMm;
    x.beforeAction = (a) => a !== "advance-device";
    expect(t.hand({ kind: "push", device: "balloon", mm: 5 })).toBe(false);
    expect(x.st.device!.centreMm).toBe(c0);
    x.beforeAction = null;
    expect(t.hand({ kind: "push", device: "balloon", mm: 5 })).toBe(true);
    expect(x.st.device!.centreMm).toBeGreaterThan(c0);
  });

  it("a push with no device on the rail is not taken", () => {
    const { t } = rig();
    expect(t.hand({ kind: "push", device: "balloon", mm: 1 })).toBe(false);
  });
});

describe("the anchor branch list (pci-device-delivery)", () => {
  it("names the branches in full", () => {
    expect(branchName("CONUS")).toBe("Conus branch");
    expect(branchName("RV")).toBe("Right ventricular branch 1");
    expect(branchName("RV2")).toBe("Right ventricular branch 2");
    expect(branchName("AM")).toBe("Acute marginal");
    expect(branchName("D2")).toBe("Diagonal 2");
    expect(branchName("RV-twig1")).toBe("Small branch of the right ventricular branch 1");
  });

  it("the console lists the anchor branches largest first, the default being the engine's own choice", () => {
    const { x } = rig();
    const list = anchorBranches(x.g);
    expect(list.length).toBeGreaterThan(0);
    const largest = [...list].sort((a, b) => b.refMm - a.refMm)[0];
    const html = renderToStaticMarkup(createElement(SupportConsole, { session: x }));
    const select = /aria-label="Anchor branch"[^>]*>(.*?)<\/select>/.exec(html)?.[1] ?? "";
    const options = [...select.matchAll(/<option value="([^"]+)"[^>]*>([^<]*)<\/option>/g)].map((m) => [m[1], m[2]]);
    expect(options.length).toBe(list.length);
    expect(options[0][0]).toBe(largest.branch);
    expect(options[0][1]).toBe(branchName(largest.branch));
    expect(options.some(([v]) => /^SAN/.test(v))).toBe(false);
  });
});
