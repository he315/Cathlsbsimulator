import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useSimulatorStore } from "../../../state/useSimulatorStore";
import { useProgressStore } from "../../../state/useProgressStore";
import { CASE_LIBRARY } from "../../../simulation/caseGenerator";
import { CATHETERS } from "../../../data/catheters";
import { DiagnosticLabSession } from "../../sim/labSession";
import TableSideControls from "../TableSideControls";
import { CONTROL_TABS, collectControlTabs, tabsFor } from "./registry";
import type { ControlTab, LabControlsTarget } from "./types";

// found-lab-controls-registry: the table-side controls are tabs discovered by glob, bound to a
// lab-agnostic LabControlsTarget that DiagnosticLabSession implements.

const g = () => useSimulatorStore.getState();
const routine = CASE_LIBRARY[0];
/** React escapes text in server output; compare against the escaped form. */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

let session: DiagnosticLabSession;
/** Server-render the controls; the text separators React inserts (<!-- -->) are removed. */
const render = (o: { tabs?: readonly ControlTab[]; initialTab?: string } = {}) => renderToString(createElement(TableSideControls, { session, input: null, ...o })).replace(/<!-- -->/g, "");

/** The tabs this test was written for; tabs other packages add under tabs/ have their own tests. */
const CORE = new Set(["carm", "imaging", "table", "patient"]);

/** The tab strip's labels, in order. */
function stripLabels(html: string): string[] {
  return [...html.matchAll(/role="tab"[^>]*>([^<]*)<\/button>/g)].map((m) => m[1]);
}

beforeEach(() => {
  useProgressStore.setState({ activePolicy: null });
  g().loadCase(routine, "free");
  session = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false });
});
afterEach(() => session.dispose());

describe("table-side controls for the diagnostic session", () => {
  it("shows the four core sections as before, in the same order, with the same controls, then Drugs and Rhythm", () => {
    // later packages add tabs (the PCI lab's devices, the diagnostic drugs); the four core tabs keep their order
    expect(CONTROL_TABS.map((t) => t.id).filter((id) => CORE.has(id))).toEqual(["carm", "imaging", "table", "patient"]);
    const carm = render();
    // the diagnostic session provides drug orders, so diag-lab-drugs' Drugs tab follows the core four,
    // and rhythm orders, so diag-rhythm-haemodynamic-events' Rhythm tab follows Drugs
    expect(stripLabels(carm)).toEqual(["C-arm and table", "Imaging", "Back table", "Patient", "Drugs", "Rhythm"]);
    // the foot switches, the syringe and store fluoroscopy stay above the tabs
    for (const k of ["Fluoro", "Cine", "Inject", "Aspirate", "Store fluoro"]) expect(carm).toContain(k);
    // the C-arm and table tab opens first, as before
    expect(carm).toMatch(/aria-selected="true"[^>]*>C-arm and table</);
    for (const k of ["Angulation (arrows)", "CRA", "RAO", "LAO", "CAU", "Memories (hold to drive; keys 6 to 9 for 1 to 4)", "Table (Shift and arrows; X centres)", "Head", "Feet", "Centre", "height +0 mm"]) expect(carm).toContain(esc(k));
    expect(carm.match(/>Store<\/button>/g)?.length).toBe(session.memories.length);

    const imaging = render({ initialTab: "imaging" });
    for (const k of ["Field (G)", "25 cm", "12 cm", "Fluoro rate", "7.5 p/s", "30 p/s", "Cine rate", "15 f/s", "Fluoro dose", "low", "normal", "high", "Shutters, sides", "Shutters, top and bottom", "Wedge in", "Wedge angle", "X-ray enabled"]) expect(imaging).toContain(k);
    expect(imaging).not.toContain("Angulation (arrows)");

    const table = render({ initialTab: "table" });
    expect(table).toContain("Catheters on the back table (exchange over the wire)");
    for (const c of CATHETERS) expect(table).toContain(esc(c.name));
    expect(table).toContain(esc("The J wire is on the table strip: grip it (2) and advance or withdraw (W / S)."));
    expect(table).toMatch(new RegExp(`aria-pressed="true"[^>]*>${esc(CATHETERS.find((c) => c.id === g().catheterId)!.name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<`));

    const patient = render({ initialTab: "patient" });
    for (const k of ["Breathing", "Breathe in and hold", "Defibrillator", "Charge 200 J", "All clear", "Shock"]) expect(patient).toContain(k);
    // uncharged: the Shock button is disabled, as before the move
    expect(patient).toMatch(/disabled=""[^>]*>Shock</);
  });

  it("reads the lab through the target: the open tab follows the session's state", () => {
    g().setField(16);
    g().setPulseRate(15);
    expect(render({ initialTab: "imaging" })).toMatch(/aria-checked="true"[^>]*>16 cm</);
    g().toggleFluoro();
    const disabledXray = render({ initialTab: "imaging" });
    expect(disabledXray).toContain("X-ray disabled");
    // the warning colour on a disabled X-ray release survived the move
    expect(disabledXray).toMatch(/!text-warn[^"]*"[^>]*>X-ray disabled/);
    session.holdBreath(true);
    expect(render({ initialTab: "patient" })).toContain("Breathe normally");
    session.charge();
    session.step(0.05);
    expect(render({ initialTab: "patient" })).toMatch(/Charging|200 J ready/);
  });

  it("an unknown initial tab falls back to the first tab", () => {
    expect(render({ initialTab: "no-such-tab" })).toMatch(/aria-selected="true"[^>]*>C-arm and table</);
  });
});

describe("the tab registry", () => {
  const fixtureFiles = import.meta.glob(["./tabs/*.tsx", "./__fixtures__/tabs/*.tsx"], { eager: true });
  const withFixtures = collectControlTabs(fixtureFiles);

  it("a file under tabs/ adds a tab without editing any other file", () => {
    // the fixture set is the real tabs folder plus fixture files, collected by the same function
    expect(withFixtures.map((t) => t.id).filter((id) => CORE.has(id) || id.startsWith("fixture"))).toEqual(["carm", "imaging", "fixture", "table", "patient", "fixture-pci", "fixture-not-exam"]);
    const html = render({ tabs: withFixtures });
    expect(stripLabels(html)).toEqual(["C-arm and table", "Imaging", "Fixture tab", "Back table", "Patient", "Drugs", "Rhythm", "Fixture practice tab"]);
    const open = render({ tabs: withFixtures, initialTab: "fixture" });
    expect(open).toContain("Fixture tab body for the diagnostic lab");
    // the tab receives the shell's control kit
    expect(open).toContain("Fixture hold");
    expect(open).toContain('data-input-direct=""');
  });

  it("a tab shows only in the labs it lists and hides itself by policy", () => {
    expect(render({ tabs: withFixtures })).not.toContain("Fixture PCI tab");
    const pciLike = { controlsLab: "pci" } as LabControlsTarget;
    expect(tabsFor(pciLike, g().policy, withFixtures).map((t) => t.id)).toEqual(["carm", "imaging", "patient", "fixture-pci"]);
    // exam: the practice-only fixture is not shown
    session.dispose();
    g().loadCase(routine, "exam");
    session = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false });
    expect(g().policy.mode).toBe("exam");
    expect(stripLabels(render({ tabs: withFixtures }))).not.toContain("Fixture practice tab");
    // a hidden tab asked for first falls back to the first shown
    expect(render({ tabs: withFixtures, initialTab: "fixture-not-exam" })).toMatch(/aria-selected="true"[^>]*>C-arm and table</);
  });

  it("refuses a file without a tab, a malformed tab and a duplicate id", () => {
    const ok = fixtureFiles["./tabs/CArmTab.tsx"];
    expect(ok).toBeDefined();
    expect(() => collectControlTabs({ "./tabs/Empty.tsx": {} })).toThrow(/does not export 'tab'/);
    expect(() => collectControlTabs({ "./tabs/A.tsx": ok, "./tabs/B.tsx": ok })).toThrow(/declared by .*A\.tsx and .*B\.tsx/);
    const bad = { tab: { id: "x", label: "X", order: 1, labs: [], Component: () => null } };
    expect(() => collectControlTabs({ "./tabs/X.tsx": bad })).toThrow(/lists no labs/);
  });
});

describe("DiagnosticLabSession as a LabControlsTarget", () => {
  it("re-renders the controls on the store slices they show and on session notifications only", () => {
    let n = 0;
    const off = session.subscribeControls(() => n++);
    const v0 = session.controlsVersion();
    g().setField(20);
    expect(n).toBe(1);
    expect(session.controlsVersion()).toBeGreaterThan(v0);
    // a store change the controls do not show does not re-render them
    const v1 = session.controlsVersion();
    useSimulatorStore.setState({ hintsUsed: g().hintsUsed + 1 });
    expect(n).toBe(1);
    expect(session.controlsVersion()).toBe(v1);
    session.storeMemory(0);
    expect(n).toBe(2);
    off();
    g().setField(25);
    expect(n).toBe(2);
  });

  it("drives the store as the old controls did and refuses values the lab does not offer", () => {
    session.setFieldSize(12);
    expect(g().imaging.field).toBe(12);
    session.setFieldSize(13);
    expect(g().imaging.field).toBe(12);
    session.setFluoroRate(30);
    session.setCineRate(7.5);
    expect(g().imaging.pulseRate).toBe(30);
    expect(g().imaging.cineRate).toBe(7.5);
    session.setFluoroRate(3.75);
    expect(g().imaging.pulseRate).toBe(30);
    session.setFluoroLevel("low");
    expect(session.exposure.exposure.fluoroLevel).toBe("low");
    expect(session.imagingControls().fluoroLevel).toBe("low");
    session.setShutters([0.1, 0.1, 0.2, 0.2]);
    expect(g().imaging.shutters).toEqual([0.1, 0.1, 0.2, 0.2]);
    session.setWedge({ insertion: 0.3, angleDeg: 90 });
    expect(g().imaging.wedge).toEqual({ insertion: 0.3, angleDeg: 90 });
    const on = g().fluoroOn;
    session.toggleXray();
    expect(g().fluoroOn).toBe(!on);
    const other = CATHETERS.find((c) => c.id !== g().catheterId)!;
    session.selectBackTableItem(other.id);
    expect(g().catheterId).toBe(other.id);
    expect(session.backTable().selectedId).toBe(other.id);
    expect(session.canStoreFluoro()).toBe(false);
    expect(session.cArmAngles()).toBe(g().cArm);
    expect(session.controlsPolicy()).toBe(g().policy);
  });

  it("offers the patient as a capability and accepts others", () => {
    expect(session.capability("patient")).toBe(session.engine);
    session.provideCapability("patient", null);
    expect(session.capability("patient")).toBeNull();
  });

  it("stops listening to the store when disposed", () => {
    let n = 0;
    session.subscribeControls(() => n++);
    const v = session.controlsVersion();
    session.dispose();
    g().setField(16);
    expect(n).toBe(0);
    // controlsRev moves only while the store subscription is attached
    expect(session.controlsVersion()).toBe(v);
  });
});

describe("table centre", () => {
  it("writes the centred table position to the store, which the image and readout follow", () => {
    session.table.setCommandedVelocity(0, 60);
    for (let i = 0; i < 30; i++) session.step(0.05);
    session.table.setCommandedVelocity(0, 0);
    for (let i = 0; i < 30; i++) session.step(0.05);
    expect(g().imaging.panY).toBeGreaterThan(10);
    session.table.set({ x: 0, y: 0 });
    session.step(0.016);
    expect(g().imaging.panX).toBe(0);
    expect(g().imaging.panY).toBe(0);
  });
});
