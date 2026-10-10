/// <reference types="vite/client" />
// The angioPci facade after the split into pci/state.ts and pci/actions/*.ts (pci-engine-modularise):
// the runtime export list is frozen at its pre-split value, every type name is still exported, state.ts
// imports no action module, and the action modules import one another without a cycle.
import { describe, expect, it } from "vitest";
import * as facade from "../angioPci";
import type {
  AdvanceOptions,
  BalloonKind,
  Device,
  DeviceKind,
  DeviceStage,
  InitOptions,
  PciDebrief,
  PciDrug,
  PciEvent,
  PciGeom,
  PciMetricsReport,
  PciScenario,
  PciState,
  PciTelemetry,
  Placed,
  RngState,
  StepOptions,
  TipShape,
  WireKind,
} from "../angioPci";
import * as state from "./state";
import * as wire from "./actions/wire";
import * as devices from "./actions/devices";
import * as inflation from "./actions/inflation";
import * as step from "./actions/step";

/** Object.keys of src/simulation/angioPci.ts before the split, with the typeof of each value. */
const FROZEN: Record<string, "function" | "object" | "number"> = {
  DEFAULT_SHAPE: "object",
  MP_MELON_GRIP_ATM: "number",
  MP_MELON_RISE_ATM_S: "number",
  PCI_SCENARIOS: "object",
  SCENARIO_BY_ID: "object",
  WIRE_SPEC: "object",
  advanceDevice: "function",
  aspirateGuide: "function",
  backloadDevice: "function",
  bailout: "function",
  branchLabel: "function",
  checkLabel: "function",
  chooseSizing: "function",
  complicationsNow: "function",
  cxContext: "function",
  debrief: "function",
  deflate: "function",
  deviceDiameterNow: "function",
  deviceSpecOf: "function",
  engageGuide: "function",
  equalisePressure: "function",
  finishCase: "function",
  giveDrug: "function",
  giveVasodilator: "function",
  guideBackupN: "function",
  inflate: "function",
  initialPci: "function",
  inject: "function",
  injectPci: "function",
  ivusAt: "function",
  ivusContext: "function",
  ivusReport: "function",
  lesionNow: "function",
  loadDevice: "function",
  loadIvus: "function",
  lumenFor: "function",
  moveDevice: "function",
  moveWire: "function",
  pathToTarget: "function",
  pciGeom: "function",
  pciMetricsReport: "function",
  pciPatientEffects: "function",
  pinWire: "function",
  prepareDevice: "function",
  pressureContext: "function",
  pressureDriftCheck: "function",
  pressureReadout: "function",
  pullIndeflatorNegative: "function",
  recordAct: "function",
  recordPressure: "function",
  removeDevice: "function",
  requestDevice: "function",
  routeEndMm: "function",
  routeSamples: "function",
  routeTurning: "function",
  sampleAtMm: "function",
  samplePullback: "function",
  scenarioCase: "function",
  seatGuide: "function",
  selectGuide: "function",
  setBuddyWire: "function",
  setExtension: "function",
  setIndeflator: "function",
  setPullbackRecording: "function",
  setValve: "function",
  setWireKind: "function",
  shapeTip: "function",
  startIvus: "function",
  stentGeomOf: "function",
  stepPci: "function",
  submitEstimate: "function",
  takeOffAngle: "function",
  tick: "function",
  tipBend: "function",
  torqueWire: "function",
  truthNow: "function",
  wireTorqueLagDeg: "function",
};

/** The action modules the plan lists; each one is re-exported by the facade. */
const ACTION_MODULES = ["assessment", "bailouts", "debrief", "devices", "drugs", "guide", "imaging", "inflation", "patient", "pressure", "scenario", "step", "wire"];

const actionSrc = import.meta.glob<string>("./actions/*.ts", { query: "?raw", import: "default", eager: true });
const stateSrc = import.meta.glob<string>("./state.ts", { query: "?raw", import: "default", eager: true })["./state.ts"];
const facadeSrc = import.meta.glob<string>("../angioPci.ts", { query: "?raw", import: "default", eager: true })["../angioPci.ts"];

/** Module specifiers of every static import and re-export in a source file. */
function specifiers(src: string): string[] {
  const out: string[] = [];
  const re = /(?:^|\n)\s*(?:import|export)\b[^"';]*?\bfrom\s*["']([^"']+)["']|(?:^|\n)\s*import\s*["']([^"']+)["']/g;
  for (let m = re.exec(src); m; m = re.exec(src)) out.push(m[1] ?? m[2]);
  return out;
}

describe("angioPci facade (pci-engine-modularise)", () => {
  // The pre-split surface is frozen as a lower bound: later packages add public exports to the
  // action modules (which `export *` passes on), so the facade may grow but must never lose a name.
  it("Object.keys of the angioPci module contains every name of the frozen pre-split list", () => {
    const keys = Object.keys(facade);
    expect(keys).toEqual(expect.arrayContaining(Object.keys(FROZEN)));
    expect(keys).not.toContain("default");
  });

  it("each pre-split export keeps its kind (function, object or number)", () => {
    for (const [k, t] of Object.entries(FROZEN)) expect(typeof (facade as Record<string, unknown>)[k], k).toBe(t);
  });

  it("the facade hands out the action modules' own functions, not copies", () => {
    expect(facade.moveWire).toBe(wire.moveWire);
    expect(facade.advanceDevice).toBe(devices.advanceDevice);
    expect(facade.inflate).toBe(inflation.inflate);
    expect(facade.stepPci).toBe(step.stepPci);
    expect(facade.initialPci).toBe(state.initialPci);
    expect(facade.lesionNow).toBe(state.lesionNow);
  });

  it("every listed action module exists and is re-exported by the facade", () => {
    const files = Object.keys(actionSrc)
      .map((p) => p.replace(/^\.\/actions\//, "").replace(/\.ts$/, ""))
      .filter((n) => !n.endsWith(".test"))
      .sort();
    expect(files).toEqual(ACTION_MODULES);
    const reexported = specifiers(facadeSrc)
      .filter((s) => s.startsWith("./pci/actions/"))
      .map((s) => s.replace("./pci/actions/", ""))
      .sort();
    expect(reexported).toEqual(ACTION_MODULES);
  });

  it("the shared internal helpers of state.ts stay out of the facade", () => {
    for (const k of ["log", "tele", "withNotes", "syncWire", "wireOf", "syncMirrors", "specOf", "refDAt", "lesionCover", "lesionShape"]) {
      expect(typeof (state as Record<string, unknown>)[k]).toBe("function");
      expect(Object.keys(facade)).not.toContain(k);
    }
  });

  it("no import cycle: state.ts imports no action module and not the facade", () => {
    const deps = specifiers(stateSrc);
    expect(deps.length).toBeGreaterThan(0);
    for (const d of deps) {
      expect(d).not.toMatch(/(^|\/)actions(\/|$)/);
      expect(d).not.toMatch(/angioPci/);
    }
  });

  it("no import cycle among the action modules, and none imports the facade", () => {
    const graph = new Map<string, string[]>();
    for (const [path, src] of Object.entries(actionSrc)) {
      const name = path.replace(/^\.\/actions\//, "").replace(/\.ts$/, "");
      if (name.endsWith(".test")) continue;
      const deps = specifiers(src);
      for (const d of deps) expect(d, `${name} imports the facade`).not.toMatch(/angioPci/);
      graph.set(
        name,
        deps.filter((d) => d.startsWith("./")).map((d) => d.slice(2).replace(/\.ts$/, ""))
      );
    }
    // the parser sees the known cross-module imports (so an empty graph cannot pass by accident)
    expect(graph.get("devices")).toContain("wire");
    expect(graph.get("step")).toContain("inflation");
    expect(graph.get("imaging")).toEqual(expect.arrayContaining(["devices", "assessment"]));
    const done = new Set<string>();
    const visit = (n: string, stack: string[]) => {
      if (stack.includes(n)) throw new Error(`import cycle: ${[...stack, n].join(" -> ")}`);
      if (done.has(n)) return;
      for (const m of graph.get(n) ?? []) visit(m, [...stack, n]);
      done.add(n);
    };
    for (const n of graph.keys()) expect(() => visit(n, [])).not.toThrow();
  });

  it("every pre-split type name is still exported (checked by the typecheck)", () => {
    type All = [AdvanceOptions, BalloonKind, Device, DeviceKind, DeviceStage, InitOptions, PciDebrief, PciDrug, PciEvent, PciGeom, PciMetricsReport, PciScenario, PciState, PciTelemetry, Placed, RngState, StepOptions, TipShape, WireKind];
    const n: All["length"] = 19;
    expect(n).toBe(19);
  });
});
