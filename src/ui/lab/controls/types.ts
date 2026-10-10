// ---------------------------------------------------------------------------
// Table-side controls as a registry of tabs (found-lab-controls-registry).
//
// The controls beside the table (foot switches, C-arm and table, imaging,
// back table, patient and defibrillator, and the tabs later packages add:
// drugs, bail-outs, kink recovery, route tools, rhythm orders, left heart,
// beam controls, PCI devices) talk to the lab through one lab-agnostic
// target, LabControlsTarget. DiagnosticLabSession implements it, and the PCI
// lab session will too. A tab is a file under src/ui/lab/controls/tabs/ that
// exports `tab: ControlTab`; registry.ts discovers it by glob, so a package
// adds a tab without editing TableSideControls.tsx or any shared index.
// ---------------------------------------------------------------------------

import type { ComponentType, ReactElement, ReactNode } from "react";
import type { CArm } from "../../../types";
import type { PedalState } from "../../../simulation/session/types";
import type { InputSystem } from "../../../input";
import type { PatientEngine } from "../../../simulation/patient/engine";
import type { LabPolicy } from "../visibility";

/** The labs whose table-side controls come from this registry. */
export type ControlsLab = "diagnostic" | "pci";

/** Fluoroscopy dose level at the console. */
export type FluoroLevel = "low" | "normal" | "high";

/** The table drive as the controls use it (TableDrive in src/simulation/imaging/carm.ts satisfies it). */
export interface TableControl {
  /** commanded table velocity, mm/s (0, 0 releases) */
  setCommandedVelocity(xMmPerS: number, yMmPerS: number): void;
  /** table height command: up, stop or down */
  setHeightCommand(dir: -1 | 0 | 1): void;
  /** move the table top to a position at once (centre) */
  set(p: { x: number; y: number; height?: number }): void;
}

/** What the imaging controls show and the options they offer. */
export interface ImagingControls {
  /** field of view (cm) and the sizes the detector offers */
  field: number;
  fields: readonly number[];
  /** fluoroscopy pulse rate (p/s), cine frame rate (f/s) and the rates offered */
  pulseRate: number;
  cineRate: number;
  rates: readonly number[];
  fluoroLevel: FluoroLevel;
  /** collimator shutters [left, right, top, bottom], 0..MAX_SHUTTER */
  shutters: readonly [number, number, number, number];
  wedge: { insertion: number; angleDeg: number };
  /** X-ray release enabled at the console */
  xrayEnabled: boolean;
}

/** A catheter (or device) waiting on the back table. */
export interface BackTableItem {
  id: string;
  name: string;
}

export interface BackTableState {
  items: readonly BackTableItem[];
  /** the one in the patient, or null */
  selectedId: string | null;
  /** a line under the list (what else lies on the table) */
  note?: string;
}

/** The defibrillator's read-out (PatientEngine vitals().defib). */
export interface DefibReadout {
  charged: number;
  charging: boolean;
  cleared: boolean;
  shocks: number;
}

/**
 * Optional capabilities a tab may ask a target for. A later package adds its own key by module
 * augmentation, without editing this file:
 *
 *   declare module "../types" { interface LabCapabilities { drugs: DrugOrders } }
 *
 * and the lab session registers it with provideCapability (DiagnosticLabSession) or its own method.
 */
export interface LabCapabilities {
  /** the patient on the table (the shared engine) */
  patient: PatientEngine;
}

/**
 * Everything the table-side controls do to a lab, in lab-agnostic terms. Reads are methods called at
 * render time; subscribeControls and controlsVersion re-render the controls when any of it changes.
 */
export interface LabControlsTarget {
  /** which lab this is (tabs list the labs they belong to) */
  readonly controlsLab: ControlsLab;
  /** notify fn whenever anything the controls show changes; returns the unsubscribe */
  subscribeControls(fn: () => void): () => void;
  /** a number that changes whenever subscribeControls listeners are called */
  controlsVersion(): number;
  /** the case's assessment policy (tabs may hide themselves by mode) */
  controlsPolicy(): LabPolicy;

  // --- foot switches and the syringe ---------------------------------------------
  readonly pedal: PedalState;
  setPedal(p: PedalState): void;
  /** start a hand injection (lasts while held); false if refused */
  startInjection(): boolean;
  releaseInjection(): void;
  /** draw back on the syringe */
  aspirate(): void;
  /** store the last fluoroscopy sequence on the reference monitor */
  storeFluoro(): unknown;
  canStoreFluoro(): boolean;

  // --- C-arm and table ---------------------------------------------------------
  cArmAngles(): CArm;
  /** programmed C-arm positions */
  readonly memories: readonly (CArm | null)[];
  /** drive to memory i while held; null releases */
  driveMemory(i: number | null): void;
  storeMemory(i: number): void;
  /** joystick (deg/s); 0, 0 releases */
  jogCArm(laoDegPerS: number, cranDegPerS: number): void;
  readonly table: TableControl;
  tableHeightMm(): number;

  // --- imaging -----------------------------------------------------------------
  imagingControls(): ImagingControls;
  setFieldSize(cm: number): void;
  setFluoroRate(pps: number): void;
  setCineRate(fps: number): void;
  setFluoroLevel(level: FluoroLevel): void;
  setShutters(s: [number, number, number, number]): void;
  setWedge(w: { insertion: number; angleDeg: number }): void;
  toggleXray(): void;

  // --- back table --------------------------------------------------------------
  backTable(): BackTableState;
  selectBackTableItem(id: string): void;

  // --- patient and defibrillator ----------------------------------------------
  breathHeld(): boolean;
  holdBreath(on: boolean): void;
  defibReadout(): DefibReadout;
  charge(): void;
  clearForShock(): void;
  shock(): unknown;

  // --- optional capabilities ---------------------------------------------------
  capability<K extends keyof LabCapabilities>(k: K): LabCapabilities[K] | null;
}

/** A button that acts while held (pointer or Enter/Space) and stops on release (dead-man). */
export interface HoldProps {
  onStart: () => void;
  onStop: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
  disabled?: boolean;
}

/** A labelled segmented choice. */
export interface SegProps<T extends string | number> {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  label: string;
  fmt?: (v: T) => string;
}

/** The shared control primitives the shell hands every tab, so all tabs look and behave alike. */
export interface ControlKit {
  Hold: ComponentType<HoldProps>;
  Seg: <T extends string | number>(p: SegProps<T>) => ReactElement;
}

export interface ControlTabProps {
  target: LabControlsTarget;
  /** the hands and pedals, when the shell has them */
  input: InputSystem | null;
  policy: LabPolicy;
  kit: ControlKit;
}

/** One tab of the table-side controls. A file in src/ui/lab/controls/tabs/ exports it as `tab`. */
export interface ControlTab {
  /** unique across the registry */
  id: string;
  /** the tab's name in the tab strip (generic device names, British English) */
  label: string;
  /** position in the strip, ascending (the core tabs use 10, 20, 30, 40) */
  order: number;
  /** the labs that show it */
  labs: readonly ControlsLab[];
  /** shown for this target and policy (default: always) */
  visible?: (target: LabControlsTarget, policy: LabPolicy) => boolean;
  Component: ComponentType<ControlTabProps>;
}

/** What a tab module exports. */
export interface ControlTabModule {
  tab?: ControlTab;
}
