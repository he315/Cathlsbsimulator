// repair-structural-bedside-launch, the bedside side: BedsideLab watches for pacing links (without
// taking them) and switches to the pacing tab, so a pacing link that arrives while the
// pericardiocentesis tab is showing opens the pacing tab even when simTab already reads "pacing"
// (openSim then sets the same value and the simTab effect does not fire). PacingLab's own
// useLabLaunch("pacing") still takes the link once it is mounted. The pacing tab is described as it
// now is. The one-line effect in BedsideLab that calls setTab("pacing") from watchPacingLinks is
// not rendered here (Node, no DOM); that wiring is checked in the browser.
//   npx vitest run src/ui/sections/BedsideLab.launch.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { subscribeLabLaunch, useLabLaunchStore } from "../../state/useLabLaunchStore";
import { useUiStore } from "../../state/useUiStore";
import BedsideLab, { watchPacingLinks } from "./BedsideLab";
import source from "./BedsideLab.tsx?raw";
import { resolvePacingLaunch } from "../bedside/PacingLab";

beforeEach(() => {
  useLabLaunchStore.getState().clear();
});

describe("bedside launch: pacing links", () => {
  it("a pacing link that arrives while simTab already reads 'pacing' is seen, and left pending for PacingLab", () => {
    useUiStore.setState({ section: useUiStore.getState().section, simTab: "pacing" });
    const onLink = vi.fn();
    const stop = watchPacingLinks(onLink);
    expect(onLink).not.toHaveBeenCalled();
    // the learner is on the pericardiocentesis tab; a lesson opens the pacing lab again
    useUiStore.getState().openSim("pacing", { scenario: "inferior-chb", mode: "guided" });
    expect(useUiStore.getState().simTab).toBe("pacing");
    expect(onLink).toHaveBeenCalledTimes(1);
    // not taken: the pacing tab's own subscription takes it when it mounts
    expect(useLabLaunchStore.getState().peek("pacing")).toEqual({ scenario: "inferior-chb", mode: "guided" });
    const took: unknown[] = [];
    const unsub = subscribeLabLaunch("pacing", (p) => took.push(resolvePacingLaunch(p, 1)));
    expect(took).toEqual([{ scenario: "inferior-chb", variant: null, mode: "guided", seq: 1 }]);
    expect(useLabLaunchStore.getState().peek("pacing")).toBeNull();
    unsub();
    // a second link fires again; taking the first did not
    expect(onLink).toHaveBeenCalledTimes(1);
    useUiStore.getState().openSim("pacing", { scenario: "inferior-chb" });
    expect(onLink).toHaveBeenCalledTimes(2);
    stop();
    useUiStore.getState().openSim("pacing", { scenario: "inferior-chb" });
    expect(onLink).toHaveBeenCalledTimes(2);
  });

  it("a pacing link already pending when the lab mounts is seen at once", () => {
    useLabLaunchStore.getState().request("pacing", { scenario: "inferior-chb" });
    const onLink = vi.fn();
    const stop = watchPacingLinks(onLink);
    expect(onLink).toHaveBeenCalledTimes(1);
    expect(useLabLaunchStore.getState().peek("pacing")).not.toBeNull();
    stop();
  });

  it("pericardiocentesis links and plain opens do not switch to the pacing tab", () => {
    const onLink = vi.fn();
    const stop = watchPacingLinks(onLink);
    useLabLaunchStore.getState().request("pericardiocentesis", { scenario: "from-pci-perforation" });
    useLabLaunchStore.getState().request("pacing");
    expect(onLink).not.toHaveBeenCalled();
    stop();
  });

  it("the pacing tab is described as it now is", () => {
    // a server render reads the store's initial state (simTab null), so the lab opens on the pacing tab
    const pacing = renderToString(createElement(BedsideLab));
    expect(pacing).toContain("Bedside procedures lab");
    expect(pacing).toContain("Bradycardia at the bedside and in the lab: initial management, transcutaneous bridge");
    expect(pacing).not.toMatch(/unchanged/i);
    expect(source).not.toMatch(/pacing tab is unchanged/);
    expect(source).toMatch(/pacing tab \(PacingLab\) runs the bedside and in-lab bradycardia scenarios/);
  });
});
