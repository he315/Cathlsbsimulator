// ---------------------------------------------------------------------------
// TableView: the operator's view of the table, from above.
//
// Left to right: the access site and sheath hub (side arm and stopcock), the
// catheter shaft, the catheter hub (its wings turn with the device roll, so the
// hub is the torque indicator), the Y-connector with its haemostatic valve
// (open or closed), the coronary wire with its torque device (fluted body that
// turns with roll), a rapid-exchange device hub when one is loaded, and below
// them the three-port manifold (pressure, contrast, saline/waste stopcocks), the
// transducer and the control syringe with its contents. Gloved hands sit where
// the input layer says they are: the right hand on the device it grips (it
// slides with its travel and lifts while moving between devices), the left hand
// pinning the wire, guide or sheath.
//
// No meters and no numbers: what the operator sees on a real table. Stopcock
// levers point at the closed port (facts S8 F12).
//
// Data: pass `state` from the device physics (hub roll, insertion, valve,
// manifold, syringe). Whatever is not passed is previewed locally from the
// input bus (roll and insertion integrate hand commands; the syringe empties
// while the plunger is pushed), so the view also works standalone on the
// calibration screen.
//
// Interaction (when `input` is given): click a device to move the right hand
// to it; press and drag on the gripped device to push (along the device) and
// roll (across it), in real millimetres on screen; press and drag the syringe
// thumb ring to push or pull the plunger; click a stopcock to turn it; click
// the valve cap to open or close it. Two-finger trackpad swipes over the view
// also drive the gripped device.
//
// The gauze (diag-pressure-transducer): a white gauze beside the sheath shows
// the last aspirate as an illustration (blood, a dark clot, glistening debris,
// or nothing when the catheter would not aspirate); pass `gauze` (null for a
// clean gauze). A host that passes no `gauze` shows none. Clicking the
// sheath's side-arm stopcock calls `onSideArm` (aspirate the sheath).
//
// The drug syringe (diag-lab-drugs): pass `drug` to show a labelled syringe on
// the manifold, an introducer needle through the Y-connector, or a syringe on
// the sheath's side arm, full or emptied once given; `cropToDrug` shows only
// that part of the table (the inset beside the drug orders).
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { InputSystem } from "../../input/system";
import { CSS_PX_PER_MM } from "../../input/settings";
import type { DeviceSlot, GripTarget, HandView } from "../../input/types";

export type ManifoldTap = "catheter" | "pressure" | "contrast" | "flush" | "waste";

export interface SyringeContents {
  volMl: number;
  contrastMl: number;
  salineMl: number;
  bloodMl: number;
  airMl: number;
}

export interface TableState {
  /** guiding catheter with Y-connector, or diagnostic catheter straight to the manifold */
  setup: "diagnostic" | "guide";
  present: DeviceSlot[];
  /** device roll at the hub, rad (+ = clockwise seen from the operator) */
  hubRollRad: Partial<Record<DeviceSlot, number>>;
  /** device insertion beyond the sheath / valve, mm */
  insertedMm: Partial<Record<DeviceSlot, number>>;
  /** gap between the torque device and the valve, mm */
  torqueGapMm: number;
  torqueDevice: boolean;
  valveOpen: boolean;
  tap: ManifoldTap;
  syringe: SyringeContents;
  /** control syringe capacity, mL (model parameter) */
  syringeCapacityMl: number;
  /** catheter working length, mm (model parameter) */
  catheterLengthMm: number;
  /** rapid-exchange device shaft length outside the patient at zero insertion, mm (model parameter) */
  deviceLengthMm: number;
  /**
   * marks on the rapid-exchange device's shaft, mm from its distal tip (pci-device-delivery): the 90 and
   * 100 cm marks, one of which reaches the Y-connector when the device is near the tip of a 90 or 100 cm
   * guide (pm-prep-and-stent-delivery, Brilakis 9.7.7). Drawn as bands where they lie outside the valve.
   */
  deviceShaftMarksMm?: readonly number[];
}

/** What the gauze on the table shows (the last aspirate; diag-pressure-transducer). */
export interface GauzeView {
  material: "blood" | "thrombus" | "plaque" | "none";
  from: "catheter" | "sheath";
}

/**
 * A drug syringe on the table (diag-lab-drugs): a small syringe on the manifold, an introducer needle
 * through the Y-connector (on the catheter hub in the diagnostic set-up, where the Y-connector would
 * sit), or a syringe on the sheath's side arm. `given`: the plunger is home, the syringe empty.
 */
export interface TableDrugSyringe {
  via: "manifold" | "y-connector" | "sheath";
  /** what it holds, as written on its label ("GTN 200 µg") */
  label: string;
  given: boolean;
}

export interface TableViewProps {
  input?: InputSystem | null;
  /** a drug syringe on the table (null or absent: none) */
  drug?: TableDrugSyringe | null;
  /** show only the part of the table around the drug syringe (an inset beside the drug orders) */
  cropToDrug?: boolean;
  /** the last aspirate on the gauze (null or absent: a clean gauze) */
  gauze?: GauzeView | null;
  /** the sheath's side-arm stopcock was clicked: aspirate the sheath */
  onSideArm?: () => void;
  state?: Partial<TableState>;
  onTap?: (t: ManifoldTap) => void;
  onValve?: (open: boolean) => void;
  /** CSS height of the strip (width follows the container) */
  height?: number;
  className?: string;
  /** disable clicks and drags (replay) */
  readOnly?: boolean;
  /** Two-finger trackpad swipes over the strip drive the gripped device (default on). */
  attachTrackpad?: boolean;
}

// --- the catheter hub after the wire comes out (diag-route-wire-led-radial) -----------

/**
 * The diagnostic catheter's hub as the route session module reports it (src/ui/sim/modules/route.ts):
 * the J wire in the hub, or the hub open and back-bleeding, or the manifold connected. Null (the default,
 * and every lab without the module): the strip shows the hub as the host's `present` list says.
 */
export interface TableHubView {
  /** the manifold line is on the catheter hub */
  connected: boolean;
  /** a wire runs through the catheter hub */
  wireInHub: boolean;
  /** a balloon catheter is set up for balloon-assisted tracking (its shaft leaves the hub) */
  bat: boolean;
}

let hubView: TableHubView | null = null;
const hubListeners = new Set<() => void>();

/** Report the catheter hub to the table strip (null: none). Unchanged values notify nobody. */
export function setTableHub(v: TableHubView | null): void {
  const same = v === hubView || (!!v && !!hubView && v.connected === hubView.connected && v.wireInHub === hubView.wireInHub && v.bat === hubView.bat);
  if (same) return;
  hubView = v ? { ...v } : null;
  for (const f of hubListeners) f();
}

/** The hub as last reported. */
export function tableHub(): TableHubView | null {
  return hubView;
}

const subscribeHub = (f: () => void) => {
  hubListeners.add(f);
  return () => {
    hubListeners.delete(f);
  };
};

// --- defaults (model parameters for the preview only) -------------------------

const DEFAULT_STATE: TableState = {
  setup: "guide",
  present: ["sheath", "catheter", "wire014"],
  hubRollRad: {},
  insertedMm: { catheter: 750, wire014: 0 },
  torqueGapMm: 120,
  torqueDevice: true,
  valveOpen: false,
  tap: "catheter",
  syringe: { volMl: 8, contrastMl: 8, salineMl: 0, bloodMl: 0, airMl: 0.05 },
  syringeCapacityMl: 12,
  catheterLengthMm: 1000,
  deviceLengthMm: 1400,
  deviceShaftMarksMm: [900, 1000],
};

/** preview only: syringe flow at a full-force push, mL/s (model parameter) */
const PREVIEW_FLOW_ML_S = 4;
/** drawing scale for hand travel offsets, px per mm */
const HAND_PX_PER_MM = 2;
/** glove drawing scale */
const HAND_SCALE = 0.8;

// --- palette (equipment colours, not UI status colours) ------------------------

const C = {
  drape: "#15201f",
  drapeWeave: "#1a2726",
  drapeEdge: "#223230",
  skin: "#4b3c37",
  skinShade: "#3b2f2b",
  hubDark: "#3a4047",
  hubDarkHi: "#4c535b",
  shaft: "#8ea2b3",
  shaftHi: "#b4c3cf",
  clearFill: "#cfe0ea",
  clearLine: "#a7bac8",
  white: "#e4e8eb",
  whiteShade: "#b9c1c8",
  rubber: "#24272b",
  wire: "#c5cdd4",
  wireShade: "#7f8a94",
  tube: "#b7c6d1",
  contrast: "#dfd29a",
  saline: "#a9c4d9",
  blood: "#7a1e23",
  glove: "#b4bfb1",
  gloveLine: "#6a776d",
  gloveShade: "#9aa696",
  sleeve: "#2a3940",
  sleeveLine: "#1d282d",
  print: "#6f8495",
  /** the design system's ink-soft (tailwind.config.js), for the shaft-mark numbers */
  inkSoft: "#A6ADB8",
  clot: "#2e0a0d",
  debris: "#efe6b8",
};

// --- geometry ---------------------------------------------------------------------

const AXIS_Y = 112;
const MAN_Y = 222;
/** rapid-exchange device shaft and hub lie on the table below the wire */
const RX_Y = AXIS_Y + 42;

const VIEW_W = 1200;
const VIEW_H = 300;
/** smallest on-screen size of text on the table, CSS px (design system: 12 px minimum, plus a margin) */
export const LABEL_PX = 12.5;
/**
 * Above this label size (user units) the middle port label moves up a line so
 * neighbours do not touch: stopcocks are 70 units apart and "Pressure" is about
 * 4.4 em wide in the UI sans (8 glyphs at roughly 0.55 em), so one row fits only below ~15.
 */
const LABEL_STAGGER_FS = 14.5;
/** Label font size in user units for an SVG drawn at `scale` CSS px per user unit. */
export function labelFontSize(scale: number): number {
  const s = Number.isFinite(scale) && scale > 0 ? scale : 1;
  return Math.min(26, Math.max(12, LABEL_PX / s));
}

/** Round to 0.01 user units (stable markup, smaller SVG). */
const r2 = (v: number) => Math.round(v * 100) / 100 + 0;

/** Soft compression of a long external length into the drawable span: 1:1 near the hub. */
function lenPx(mm: number, maxPx: number, scaleMm: number): number {
  const m = Math.max(0, mm);
  return maxPx * (1 - Math.exp(-m / scaleMm));
}

interface Layout {
  cathHubX: number;
  yx0: number; // Y-connector start
  yEnd: number; // valve end
  tdX: number;
  rxHubX: number | null;
  rxDevice: DeviceSlot | null;
  /** the device's shaft marks outside the valve (drawing positions) */
  /** each shaft mark outside the valve: x, y, the mark (mm from the distal tip), and whether it is within SHAFT_MARK_NEAR_MM of the valve */
  rxMarks: [number, number, number, boolean][];
  syrStopperX: number;
  rodEndX: number;
  anchors: Partial<Record<GripTarget, [number, number]>>;
  pins: Record<"wire" | "guide" | "sheath", [number, number]>;
}

const guideSetup = (s: TableState) => s.setup === "guide";

/** A shaft mark this close to the valve (mm of shaft still outside it) is drawn emphasised: the device is nearly at the guide tip. Display choice. */
const SHAFT_MARK_NEAR_MM = 20;

/**
 * Where the device's shaft marks lie on the drawn shaft: a mark M mm from the distal tip is M minus the
 * inserted length outside the valve, and the drawn shaft (the bend from the valve down to the table, then
 * the straight run to the hub) stands for the whole length outside, in proportion. Marks still inside the
 * guide, or past the hub, are not drawn.
 */
function shaftMarks(s: TableState, dev: DeviceSlot, yEnd: number, hubX: number): [number, number, number, boolean][] {
  const inserted = Math.max(0, s.insertedMm[dev] ?? 0);
  const outside = s.deviceLengthMm - inserted;
  if (!(outside > 0)) return [];
  const x0 = yEnd;
  const y0 = AXIS_Y + 3;
  const x1 = yEnd + 90;
  const seg1 = Math.hypot(x1 - x0, RX_Y - y0);
  const seg2 = Math.max(0, hubX - x1);
  const total = seg1 + seg2;
  const out: [number, number, number, boolean][] = [];
  for (const m of s.deviceShaftMarksMm ?? []) {
    const along = m - inserted;
    if (along < 0 || along > outside) continue;
    const d = (along / outside) * total;
    const near = along <= SHAFT_MARK_NEAR_MM;
    if (d <= seg1) {
      const f = d / Math.max(1e-6, seg1);
      out.push([x0 + f * (x1 - x0), y0 + f * (RX_Y - y0), m, near]);
    } else out.push([x1 + (d - seg1), RX_Y, m, near]);
  }
  return out;
}

function layout(s: TableState): Layout {
  const ext = s.catheterLengthMm - (s.insertedMm.catheter ?? 0);
  const cathHubX = 128 + 28 + lenPx(ext, 230, 260);
  const guide = s.setup === "guide";
  const yx0 = cathHubX + 54;
  const yEnd = guide ? yx0 + 92 + (s.valveOpen ? 6 : 0) : cathHubX + 54;
  const tdX = yEnd + 14 + Math.min(240, Math.max(0, s.torqueGapMm) * 1.4);
  const rxDevice = (["balloon", "stent", "ivus"] as DeviceSlot[]).find((d) => s.present.includes(d)) ?? null;
  const rxHubX = rxDevice ? yEnd + 90 + lenPx(s.deviceLengthMm - 1100 - (s.insertedMm[rxDevice] ?? 0), 300, 240) : null;
  const rxMarks = rxDevice && rxHubX !== null && guideSetup(s) ? shaftMarks(s, rxDevice, yEnd, rxHubX) : [];

  const barrel0 = 776;
  const barrelLen = 158;
  const volFrac = Math.max(0, Math.min(1, s.syringe.volMl / Math.max(0.1, s.syringeCapacityMl)));
  const syrStopperX = barrel0 + 6 + volFrac * (barrelLen - 10);
  const rodEndX = syrStopperX + 168;

  const wire035X = (guide ? yEnd : cathHubX + 54) + 70;
  return {
    cathHubX,
    yx0,
    yEnd,
    tdX,
    rxHubX,
    rxDevice,
    rxMarks,
    syrStopperX,
    rodEndX,
    anchors: {
      sheath: [92, AXIS_Y],
      // pinch at the proximal end so the hub wings and the torque device stay in view
      catheter: [cathHubX + 44, AXIS_Y + 2],
      pigtail: [cathHubX + 44, AXIS_Y + 2],
      wire014: [tdX + 42, AXIS_Y + 2],
      pressureWire: [tdX + 42, AXIS_Y + 2],
      wire035: [wire035X, AXIS_Y],
      ...(rxHubX !== null && rxDevice ? { [rxDevice]: [rxHubX - 6, RX_Y + 2] } : {}),
      syringe: [rodEndX + 14, MAN_Y],
    },
    pins: {
      wire: guide ? [yEnd + 16, AXIS_Y] : [cathHubX + 70, AXIS_Y],
      guide: [cathHubX + 6, AXIS_Y],
      sheath: [92, AXIS_Y],
    },
  };
}

// --- small drawing parts --------------------------------------------------------------

function Drape() {
  const weave = [];
  for (let y = 8; y < 300; y += 9) weave.push(<line key={`h${y}`} x1={0} y1={y} x2={1200} y2={y} stroke={C.drapeWeave} strokeWidth={1} />);
  return (
    <g>
      <rect x={0} y={0} width={1200} height={300} fill={C.drape} />
      {weave}
      {/* fenestration over the access site */}
      <path d="M -10 52 C 30 40, 70 52, 78 112 C 70 172, 30 184, -10 172 Z" fill={C.skin} stroke={C.drapeEdge} strokeWidth={3} />
      <path d="M -10 70 C 20 64, 46 76, 52 112 C 46 150, 20 160, -10 154 Z" fill={C.skinShade} opacity={0.35} />
    </g>
  );
}

/** A luer hub with two wings that turns about the device axis by `roll`. */
function WingedHub({ x, roll, len = 34, r = 8.5, span = 12, body = C.clearFill, line = C.clearLine }: { x: number; roll: number; len?: number; r?: number; span?: number; body?: string; line?: string }) {
  const wings = [roll, roll + Math.PI].map((phi) => ({ s: Math.sin(phi), c: Math.cos(phi) }));
  const wing = (w: { s: number; c: number }, key: string) => {
    const y0 = r2(AXIS_Y - r * w.s * 0.92);
    const y1 = r2(AXIS_Y - (r + span) * w.s);
    const front = w.c > 0;
    return (
      <path
        key={key}
        d={`M ${x + 8} ${y0} L ${x + 12} ${y1} L ${x + 24} ${y1} L ${x + 28} ${y0} Z`}
        fill={front ? C.white : C.whiteShade}
        stroke={C.clearLine}
        strokeWidth={1}
        opacity={front ? 0.95 : 0.55}
      />
    );
  };
  return (
    <g>
      {wings.filter((w) => w.c <= 0).map((w, i) => wing(w, `b${i}`))}
      <rect x={x} y={AXIS_Y - r} width={len} height={2 * r} rx={3} fill={body} fillOpacity={0.38} stroke={line} strokeWidth={1.2} />
      {/* lumen seen through the clear hub */}
      <rect x={x + 2} y={AXIS_Y - 2.2} width={len - 4} height={4.4} fill={C.rubber} opacity={0.35} />
      <line x1={x + 3} y1={AXIS_Y - r + 2.2} x2={x + len - 3} y2={AXIS_Y - r + 2.2} stroke={C.white} strokeOpacity={0.35} strokeWidth={1.2} />
      {wings.filter((w) => w.c > 0).map((w, i) => wing(w, `f${i}`))}
    </g>
  );
}

/** Fluted torque device on the wire; its ridges slide as it turns. */
function TorqueDevice({ x, roll, gripped }: { x: number; roll: number; gripped: boolean }) {
  const r = 9;
  const ridges = [];
  for (let k = 0; k < 8; k++) {
    const phi = roll + (k * Math.PI) / 4;
    const c = Math.cos(phi);
    if (c <= 0.05) continue;
    const y = r2(AXIS_Y - r * Math.sin(phi) * 0.9);
    ridges.push(<line key={k} x1={x + 12} y1={y} x2={x + 44} y2={y} stroke={C.wireShade} strokeWidth={1.3} opacity={r2(0.25 + 0.6 * c)} />);
  }
  return (
    <g>
      {/* collet nose */}
      <path d={`M ${x} ${AXIS_Y - 3} L ${x + 12} ${AXIS_Y - 6.5} L ${x + 12} ${AXIS_Y + 6.5} L ${x} ${AXIS_Y + 3} Z`} fill={C.whiteShade} stroke={C.clearLine} strokeWidth={1} />
      <rect x={x + 12} y={AXIS_Y - r} width={34} height={2 * r} rx={4} fill={C.white} stroke={gripped ? C.print : C.clearLine} strokeWidth={1.2} />
      {ridges}
      {/* locking cap */}
      <rect x={x + 46} y={AXIS_Y - 6} width={8} height={12} rx={2} fill={C.whiteShade} stroke={C.clearLine} strokeWidth={1} />
    </g>
  );
}

function Stopcock({ x, y, closed, onClick, label, readOnly }: { x: number; y: number; closed: "side" | "left" | "right"; onClick?: () => void; label: string; readOnly?: boolean }) {
  // lever points at the closed port (facts S8 F12): side = down to the side port
  const angle = closed === "side" ? 90 : closed === "left" ? 180 : 0;
  return (
    <g
      role={readOnly ? undefined : "button"}
      data-input-direct=""
      aria-label={`${label} stopcock`}
      tabIndex={readOnly ? undefined : 0}
      onClick={readOnly ? undefined : onClick}
      onKeyDown={(e) => {
        if (!readOnly && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.();
        }
      }}
      style={{ cursor: readOnly ? "default" : "pointer" }}
    >
      <title>{`${label} stopcock`}</title>
      {/* side port and tube */}
      <rect x={x - 5} y={y + 6} width={10} height={20} rx={2} fill={C.clearFill} fillOpacity={0.25} stroke={C.clearLine} strokeWidth={1} />
      {/* valve body */}
      <circle cx={x} cy={y} r={11} fill={C.clearFill} fillOpacity={0.22} stroke={C.clearLine} strokeWidth={1.2} />
      {/* lever */}
      <g transform={`rotate(${angle} ${x} ${y})`}>
        <path d={`M ${x - 5} ${y - 4.5} L ${x + 22} ${y - 3} Q ${x + 27} ${y} ${x + 22} ${y + 3} L ${x - 5} ${y + 4.5} Z`} fill={C.white} stroke={C.whiteShade} strokeWidth={1} />
        <circle cx={x} cy={y} r={5.5} fill={C.white} stroke={C.whiteShade} strokeWidth={1} />
      </g>
      <rect x={x - 16} y={y - 16} width={32} height={46} fill="transparent" />
    </g>
  );
}

/** A gloved hand seen from above, pinch point at (0, 0). */
function Glove({ x, y, side, closed, lifted, rollPx = 0, rotate = 0 }: { x: number; y: number; side: "left" | "right"; closed: boolean; lifted: boolean; rollPx?: number; rotate?: number }) {
  const mirror = side === "left" ? -1 : 1;
  const lift = lifted ? -12 : 0;
  const finger = (d: string, key: string, w = 9) => (
    <g key={key}>
      <path d={d} stroke={C.gloveLine} strokeWidth={w + 2.2} strokeLinecap="round" fill="none" />
      <path d={d} stroke={C.glove} strokeWidth={w} strokeLinecap="round" fill="none" />
    </g>
  );
  const tip = closed ? 0 : 5; // fingers part when the hand is open
  return (
    <g transform={`translate(${x} ${y + lift}) scale(${mirror * HAND_SCALE} ${HAND_SCALE}) rotate(${rotate})`} opacity={lifted ? 0.6 : 0.95} style={{ pointerEvents: "none" }}>
      {/* gown cuff */}
      <path d="M 30 56 L 42 120 L 84 110 L 62 46 Z" fill={C.sleeve} stroke={C.sleeveLine} strokeWidth={1.5} opacity={0.7} />
      {/* back of the hand */}
      <path d="M 6 22 C 2 36, 8 54, 26 62 C 44 70, 66 60, 68 42 C 70 28, 60 16, 46 12 C 30 8, 12 10, 6 22 Z" fill={C.glove} stroke={C.gloveLine} strokeWidth={1.4} />
      <path d="M 20 30 C 30 40, 46 44, 60 38" stroke={C.gloveShade} strokeWidth={1.2} fill="none" opacity={0.7} />
      {/* ring and little fingers curl under */}
      {finger("M 60 24 Q 54 12 46 8", "little", 7.5)}
      {finger("M 52 18 Q 44 4 34 0", "ring", 8.5)}
      {/* middle finger */}
      {finger(`M 42 14 Q 30 -2 ${16 + tip} ${-6 - tip}`, "middle")}
      {/* index finger to the pinch */}
      {finger(`M 30 18 Q 16 6 ${3 + tip} ${-1 - tip - rollPx * 0.5}`, "index")}
      {/* thumb from below */}
      {finger(`M 12 40 Q 0 28 ${-1 - tip * 0.4} ${8 + tip + rollPx * 0.5}`, "thumb", 9.5)}
    </g>
  );
}

// --- preview state integration ----------------------------------------------------------------

interface Preview {
  roll: Partial<Record<DeviceSlot, number>>;
  inserted: Partial<Record<DeviceSlot, number>>;
  torqueGapMm: number;
  syringe: SyringeContents;
  tap: ManifoldTap;
  valveOpen: boolean;
}

function mixColour(s: SyringeContents): { fill: string; opacity: number } {
  const liquid = Math.max(1e-6, s.contrastMl + s.salineMl + s.bloodMl);
  const fb = s.bloodMl / liquid;
  const fc = s.contrastMl / liquid;
  if (fb > 0.25) return { fill: C.blood, opacity: 0.55 + 0.4 * Math.min(1, fb) };
  if (fc > 0.5) return { fill: C.contrast, opacity: 0.35 + 0.3 * fc };
  return { fill: C.saline, opacity: 0.22 + 0.2 * fb };
}

// --- component -----------------------------------------------------------------------------

export default function TableView({ input, state, onTap, onValve, gauze, onSideArm, drug, cropToDrug, height = 220, className, readOnly, attachTrackpad = true }: TableViewProps) {
  const base: TableState = useMemo(() => ({ ...DEFAULT_STATE, ...(state ?? {}) }), [state]);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // local preview of whatever the host does not drive
  const preview = useRef<Preview>({
    roll: {},
    inserted: { ...DEFAULT_STATE.insertedMm },
    torqueGapMm: DEFAULT_STATE.torqueGapMm,
    syringe: { ...DEFAULT_STATE.syringe },
    tap: DEFAULT_STATE.tap,
    valveOpen: DEFAULT_STATE.valveOpen,
  });
  const [, setTick] = useState(0);
  const raf = useRef<number | null>(null);
  const bump = useCallback(() => {
    if (raf.current !== null) return;
    const go = () => {
      raf.current = null;
      setTick((t) => (t + 1) % 1e9);
    };
    raf.current = typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame(go) : (setTimeout(go, 16) as unknown as number);
  }, []);
  useEffect(
    () => () => {
      if (raf.current !== null && typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(raf.current);
    },
    []
  );

  // label size in user units: the SVG is scaled by min(w/1200, h/300), so text has to grow as the strip shrinks
  const [labelFs, setLabelFs] = useState(() => labelFontSize(height / VIEW_H));
  useEffect(() => {
    const el = svgRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) setLabelFs(labelFontSize(Math.min(w / VIEW_W, h / VIEW_H)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // hand view: kept in a ref and re-rendered through bump(), so a burst of
  // "hands" events (every mouse count while gripped) costs one render per animation frame
  const handsRef = useRef<HandView | null>(null);
  const handsFor = useRef<InputSystem | null | undefined>(undefined);
  if (handsFor.current !== input) {
    handsFor.current = input;
    handsRef.current = input?.view() ?? null;
  }
  const hands = handsRef.current;
  const plungerRef = useRef(0);

  useEffect(() => {
    if (!input) return;
    handsRef.current = input.view();
    bump();
    const offs = [
      input.bus.on("hands", (v) => {
        handsRef.current = v;
        bump();
      }),
      input.bus.on("hand", (c) => {
        const p = preview.current;
        if (c.kind === "torque") p.roll[c.device] = (p.roll[c.device] ?? 0) + c.rad;
        else if (c.kind === "push") {
          p.inserted[c.device] = (p.inserted[c.device] ?? 0) + c.mm;
          if (c.device === "wire014" || c.device === "pressureWire") p.torqueGapMm = Math.max(0, p.torqueGapMm - c.mm);
        } else return;
        bump();
      }),
      input.bus.on("syringe", (s) => {
        plungerRef.current = s.force;
        bump();
      }),
    ];
    return () => offs.forEach((f) => f());
  }, [input, bump]);

  // preview syringe flow while the plunger is held (only when the host does not supply contents)
  const hostSyringe = state?.syringe !== undefined;
  useEffect(() => {
    if (hostSyringe) return;
    let last: number | null = null;
    let id: number | null = null;
    const step = (t: number) => {
      const dt = last === null ? 0 : Math.min(0.1, (t - last) / 1000);
      last = t;
      const f = plungerRef.current;
      if (f !== 0) {
        const p = preview.current;
        const s = p.syringe;
        const dV = PREVIEW_FLOW_ML_S * f * dt;
        if (dV > 0 && s.volMl > 0) {
          const k = Math.max(0, (s.volMl - dV) / s.volMl);
          p.syringe = { volMl: s.volMl * k, contrastMl: s.contrastMl * k, salineMl: s.salineMl * k, bloodMl: s.bloodMl * k, airMl: s.airMl };
        } else if (dV < 0) {
          const add = Math.min(-dV, base.syringeCapacityMl - s.volMl);
          const tap = state?.tap ?? p.tap;
          const into = tap === "contrast" ? "contrastMl" : tap === "flush" ? "salineMl" : tap === "catheter" ? "bloodMl" : null;
          if (into && add > 0) p.syringe = { ...s, volMl: s.volMl + add, [into]: s[into] + add };
        }
        setTick((x) => (x + 1) % 1e9);
      }
      id = requestAnimationFrame(step);
    };
    if (typeof requestAnimationFrame === "undefined") return;
    id = requestAnimationFrame(step);
    return () => {
      if (id !== null) cancelAnimationFrame(id);
    };
  }, [hostSyringe, base.syringeCapacityMl, state?.tap]);

  // trackpad swipes over the strip drive the gripped device
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !input || readOnly || !attachTrackpad) return;
    return input.trackpad.attach(el);
  }, [input, readOnly, attachTrackpad]);

  const p = preview.current;
  const s: TableState = {
    ...base,
    hubRollRad: state?.hubRollRad ?? p.roll,
    insertedMm: state?.insertedMm ?? p.inserted,
    torqueGapMm: state?.torqueGapMm ?? p.torqueGapMm,
    syringe: state?.syringe ?? p.syringe,
    tap: state?.tap ?? p.tap,
    valveOpen: state?.valveOpen ?? p.valveOpen,
  };
  const guide = s.setup === "guide";
  const has = (d: DeviceSlot) => s.present.includes(d);
  // the route module's hub, in the diagnostic set-up: whether the wire is in it and the manifold on it
  const hub = useSyncExternalStore(subscribeHub, tableHub, tableHub);
  const wire035Shown = !guideSetup(s) && hub ? hub.wireInHub : has("wire035");
  const manifoldOn = hub ? hub.connected : !has("wire035");
  const L = layout(s);
  const roll = (d: DeviceSlot) => s.hubRollRad[d] ?? 0;

  // --- interaction helpers -----------------------------------------------------------
  const cssToMm = (cssPx: number) => cssPx / (input?.getSettings().screenPxPerMm ?? CSS_PX_PER_MM);

  const drag = useRef<{ kind: "device" | "plunger"; id: number; startX: number; lastX: number; lastY: number } | null>(null);

  const select = (t: GripTarget) => {
    if (!input || readOnly) return;
    input.emit({ t: "select", target: t });
  };

  const onDevicePointerDown = (t: GripTarget) => (e: React.PointerEvent) => {
    if (!input || readOnly || e.button !== 0) return;
    e.stopPropagation();
    const v = input.view();
    if (v.right.at !== t || v.right.transition) {
      select(t);
      return;
    }
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    drag.current = { kind: "device", id: e.pointerId, startX: e.clientX, lastX: e.clientX, lastY: e.clientY };
    input.emit({ t: "grab", on: true, source: "ui" });
  };

  const onPlungerPointerDown = (e: React.PointerEvent) => {
    if (!input || readOnly || e.button !== 0) return;
    e.stopPropagation();
    const v = input.view();
    if (v.right.at !== "syringe") {
      select("syringe");
      return;
    }
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    drag.current = { kind: "plunger", id: e.pointerId, startX: e.clientX, lastX: e.clientX, lastY: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || !input) return;
    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    if (d.kind === "device") {
      // the patient is to the left: dragging left advances; dragging up across the hub rolls clockwise
      input.emit({ t: "move", axialMm: -cssToMm(dx) + 0, lateralMm: -cssToMm(dy) + 0, source: "ui" });
    } else {
      const travel = input.getSettings().grip.plungerTravelMm;
      const force = Math.max(-1, Math.min(1, cssToMm(d.startX - e.clientX) / travel));
      input.emit({ t: "plunger", force, source: "ui" });
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || !input) return;
    drag.current = null;
    if (d.kind === "device") input.emit({ t: "grab", on: false, source: "ui" });
    else input.emit({ t: "plunger", force: 0, source: "ui" });
  };

  const turnTap = () => {
    const order: ManifoldTap[] = ["catheter", "pressure", "contrast", "flush"];
    const next = order[(order.indexOf(s.tap === "waste" ? "flush" : s.tap) + 1) % order.length];
    if (onTap) onTap(next);
    else {
      preview.current.tap = next;
      bump();
    }
  };
  const toggleValve = () => {
    if (readOnly) return;
    if (onValve) onValve(!s.valveOpen);
    else {
      preview.current.valveOpen = !preview.current.valveOpen;
      bump();
    }
  };

  const deviceHit = (t: GripTarget, x: number, y: number, w: number, h: number, label: string) =>
    readOnly || !input ? null : (
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="transparent"
        data-input-direct=""
        role="button"
        aria-label={label}
        tabIndex={0}
        style={{ cursor: hands?.right.at === t ? (hands.right.gripped ? "grabbing" : "grab") : "pointer" }}
        onPointerDown={onDevicePointerDown(t)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            select(t);
          }
        }}
      >
        <title>{label}</title>
      </rect>
    );

  // stopcock lever positions from the manifold tap (lever points at the closed port)
  const lever = (port: "pressure" | "contrast" | "flush"): "side" | "left" | "right" => {
    const tap = s.tap === "waste" ? "flush" : s.tap;
    if (port === "pressure" && tap === "pressure") return "right"; // syringe off, catheter to transducer
    if (port !== "pressure" && tap === port) return "left"; // catheter off, syringe to this port
    return "side";
  };

  // --- hands -----------------------------------------------------------------------------
  const right = hands?.right;
  let rightHand: JSX.Element | null = null;
  if (right) {
    const tr = right.transition;
    const anchorOf = (t: GripTarget | null): [number, number] => (t && L.anchors[t]) || [1060, 250];
    let hx: number;
    let hy: number;
    let lifted = !right.gripped;
    if (tr) {
      const [x0, y0] = anchorOf(tr.from);
      const [x1, y1] = anchorOf(tr.to);
      const k = tr.progress < 0.5 ? 2 * tr.progress * tr.progress : 1 - Math.pow(-2 * tr.progress + 2, 2) / 2;
      hx = x0 + (x1 - x0) * k;
      hy = y0 + (y1 - y0) * k - Math.sin(Math.PI * tr.progress) * 18;
      lifted = true;
    } else {
      [hx, hy] = anchorOf(right.at);
      if (right.at === "syringe") {
        hx = L.rodEndX + 14;
      } else if (right.gripped) {
        hx -= right.pushOffsetMm * HAND_PX_PER_MM;
      }
    }
    rightHand = <Glove x={hx} y={hy} side="right" closed={right.gripped} lifted={lifted} rollPx={right.at === "syringe" ? 0 : right.rollOffsetMm} rotate={right.at === "syringe" ? -8 : -14} />;
  }
  const left = hands?.left;
  const leftHand = left?.pin ? (
    <Glove x={L.pins[left.pin][0]} y={L.pins[left.pin][1]} side="left" closed lifted={false} rotate={-12} />
  ) : hands ? (
    <Glove x={150} y={228} side="left" closed={false} lifted rotate={-30} />
  ) : null;

  // --- syringe fluid ------------------------------------------------------------------------
  const mix = mixColour(s.syringe);
  const airW = Math.min(30, s.syringe.airMl * 60);
  const barrel0 = 776;
  const barrel1 = 934;

  // graduation ticks: one per mL, longer every 5 mL (equipment print, no numerals)
  const ticks = [];
  const mlPx = (barrel1 - barrel0 - 10) / s.syringeCapacityMl;
  for (let ml = 0; ml <= s.syringeCapacityMl; ml++) {
    const x = barrel0 + 6 + ml * mlPx;
    ticks.push(<line key={ml} x1={x} y1={MAN_Y - 14} x2={x} y2={MAN_Y - (ml % 5 === 0 ? 8 : 11)} stroke={C.print} strokeWidth={1} />);
  }

  const bleed = guide && s.valveOpen;

  // the drug syringe: where its nozzle sits and which way the barrel lies
  const drugAt = drug ? drugSyringePlace(drug.via, guide, L) : null;
  const viewBox = cropToDrug && drugAt ? drugCrop(drugAt) : `0 0 ${VIEW_W} ${VIEW_H}`;

  return (
    <div ref={rootRef} className={className} style={{ height, touchAction: "none", userSelect: "none" }}>
      <svg
        ref={svgRef}
        viewBox={viewBox}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Operator's table: sheath, catheter, connectors, wire, manifold and syringe"
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="block rounded-[10px]"
      >
        <Drape />

        {/* ---- sheath ---- */}
        <g>
          <path d={`M 34 ${AXIS_Y - 4} L 66 ${AXIS_Y - 6} L 66 ${AXIS_Y + 6} L 34 ${AXIS_Y + 4} Z`} fill={C.hubDark} opacity={0.85} />
          <rect x={64} y={AXIS_Y - 11} width={46} height={22} rx={5} fill={C.hubDark} stroke={C.hubDarkHi} strokeWidth={1.2} />
          <rect x={108} y={AXIS_Y - 9} width={12} height={18} rx={3} fill={C.rubber} stroke={C.hubDarkHi} strokeWidth={1} />
          <line x1={70} y1={AXIS_Y - 7} x2={104} y2={AXIS_Y - 7} stroke={C.hubDarkHi} strokeWidth={1.2} />
          {/* side arm and stopcock */}
          <path d={`M 84 ${AXIS_Y + 10} C 84 150, 70 168, 58 188`} stroke={C.tube} strokeOpacity={0.55} strokeWidth={5} fill="none" />
          <g
            role={readOnly || !onSideArm ? undefined : "button"}
            data-input-direct=""
            aria-label={onSideArm ? "Aspirate the sheath side arm" : undefined}
            tabIndex={readOnly || !onSideArm ? undefined : 0}
            onClick={readOnly ? undefined : onSideArm}
            onKeyDown={(e) => {
              if (readOnly || !onSideArm) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSideArm();
              }
            }}
            style={{ cursor: readOnly || !onSideArm ? "default" : "pointer" }}
          >
            {onSideArm && <title>Sheath side arm: click to aspirate</title>}
            <circle cx={56} cy={194} r={7} fill={C.clearFill} fillOpacity={0.25} stroke={C.clearLine} />
            <rect x={53} y={178} width={6} height={13} rx={2} fill={C.white} transform="rotate(-30 56 194)" />
          </g>
          {deviceHit("sheath", 60, AXIS_Y - 16, 64, 32, "Sheath hub")}
        </g>

        {/* ---- catheter shaft ---- */}
        {(has("catheter") || has("pigtail")) && (
          <g>
            <line x1={118} y1={AXIS_Y} x2={L.cathHubX} y2={AXIS_Y} stroke={C.shaft} strokeWidth={5.5} strokeLinecap="round" />
            <line x1={120} y1={AXIS_Y - 1.4} x2={L.cathHubX} y2={AXIS_Y - 1.4} stroke={C.shaftHi} strokeWidth={1.2} opacity={0.6} />
            {/* strain relief */}
            <path d={`M ${L.cathHubX - 2} ${AXIS_Y - 3.5} L ${L.cathHubX + 14} ${AXIS_Y - 5.5} L ${L.cathHubX + 14} ${AXIS_Y + 5.5} L ${L.cathHubX - 2} ${AXIS_Y + 3.5} Z`} fill={C.shaft} />
            <WingedHub x={L.cathHubX + 14} roll={roll(has("catheter") ? "catheter" : "pigtail")} />
            <rect x={L.cathHubX + 48} y={AXIS_Y - 6} width={6} height={12} rx={1.5} fill={C.clearFill} fillOpacity={0.3} stroke={C.clearLine} />
            {deviceHit(has("catheter") ? "catheter" : "pigtail", L.cathHubX - 6, AXIS_Y - 22, 62, 44, "Catheter hub")}
          </g>
        )}

        {/* ---- Y-connector (guide setup) ---- */}
        {guide && (
          <g>
            {/* rotating luer collar, knurled */}
            <rect x={L.yx0} y={AXIS_Y - 9} width={12} height={18} rx={2} fill={C.clearFill} fillOpacity={0.3} stroke={C.clearLine} strokeWidth={1.2} />
            {[2, 5, 8].map((k) => (
              <line key={k} x1={L.yx0 + k + 1} y1={AXIS_Y - 9} x2={L.yx0 + k + 1} y2={AXIS_Y + 9} stroke={C.clearLine} strokeWidth={0.8} />
            ))}
            {/* body */}
            <rect x={L.yx0 + 12} y={AXIS_Y - 6} width={60} height={12} rx={3} fill={C.clearFill} fillOpacity={0.22} stroke={C.clearLine} strokeWidth={1.2} />
            {/* side arm to the manifold */}
            <path d={`M ${L.yx0 + 40} ${AXIS_Y + 5} L ${L.yx0 + 58} ${AXIS_Y + 26}`} stroke={C.clearLine} strokeWidth={9} strokeLinecap="round" opacity={0.55} />
            <path
              d={`M ${L.yx0 + 58} ${AXIS_Y + 26} C ${L.yx0 + 80} ${AXIS_Y + 60}, 470 ${MAN_Y}, 520 ${MAN_Y}`}
              stroke={C.tube}
              strokeOpacity={0.5}
              strokeWidth={5}
              fill="none"
            />
            {/* haemostatic valve: O-ring and cap */}
            <rect x={L.yx0 + 72} y={AXIS_Y - 8} width={4} height={16} fill={C.rubber} opacity={s.valveOpen ? 0.9 : 0.5} />
            <g
              role={readOnly ? undefined : "button"}
              data-input-direct=""
              aria-label={s.valveOpen ? "Close the haemostatic valve" : "Open the haemostatic valve"}
              tabIndex={readOnly ? undefined : 0}
              onClick={toggleValve}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleValve();
                }
              }}
              style={{ cursor: readOnly ? "default" : "pointer" }}
            >
              <title>{s.valveOpen ? "Valve open" : "Valve closed"}</title>
              <rect x={L.yEnd - 18} y={AXIS_Y - 11} width={18} height={22} rx={3} fill={C.white} stroke={C.whiteShade} strokeWidth={1.2} />
              {[3, 7, 11, 15].map((k) => (
                <line key={k} x1={L.yEnd - 18 + k} y1={AXIS_Y - 11} x2={L.yEnd - 18 + k} y2={AXIS_Y + 11} stroke={C.whiteShade} strokeWidth={1} />
              ))}
            </g>
            {bleed && <path d={`M ${L.yx0 + 76} ${AXIS_Y + 9} q 2 6 0 9 q -2 -3 0 -9 Z`} fill={C.blood} opacity={0.9} />}
          </g>
        )}

        {/* ---- diagnostic: hub straight to the manifold, or the J wire in the hub ---- */}
        {!guide && (has("catheter") || has("pigtail")) && (
          <g>
            {!manifoldOn ? (
              // manifold line disconnected while the wire is in; capped end lies on the drape
              <path d={`M 520 ${MAN_Y} C 470 ${MAN_Y}, ${L.cathHubX + 120} ${AXIS_Y + 80}, ${L.cathHubX + 80} ${AXIS_Y + 70}`} stroke={C.tube} strokeOpacity={0.5} strokeWidth={5} fill="none" />
            ) : (
              <path d={`M ${L.cathHubX + 54} ${AXIS_Y} C ${L.cathHubX + 110} ${AXIS_Y}, 470 ${MAN_Y}, 520 ${MAN_Y}`} stroke={C.tube} strokeOpacity={0.5} strokeWidth={5} fill="none" />
            )}
            {/* the wire out and the line not yet on: the open hub back-bleeds */}
            {hub && !hub.wireInHub && !hub.connected && <path d={`M ${L.cathHubX + 56} ${AXIS_Y + 4} q 2.5 7 0 10 q -2.5 -3 0 -10 Z`} fill={C.blood} opacity={0.9} />}
            {hub?.bat && <line x1={L.cathHubX + 54} y1={AXIS_Y} x2={L.cathHubX + 150} y2={AXIS_Y - 26} stroke={C.tube} strokeOpacity={0.7} strokeWidth={2.5} />}
          </g>
        )}

        {/* ---- wires ---- */}
        {wire035Shown && (
          <g>
            <path d={`M ${guide ? L.yEnd : L.cathHubX + 54} ${AXIS_Y} L ${L.anchors.wire035![0] + 60} ${AXIS_Y} C ${L.anchors.wire035![0] + 160} ${AXIS_Y}, 1150 ${AXIS_Y - 60}, 1210 ${AXIS_Y - 70}`} stroke={C.wire} strokeWidth={2} fill="none" />
            {deviceHit("wire035", L.anchors.wire035![0] - 30, AXIS_Y - 14, 60, 28, "J wire")}
          </g>
        )}
        {guide && (has("wire014") || has("pressureWire")) && (
          <g>
            <path d={`M ${L.yEnd} ${AXIS_Y} L ${L.tdX} ${AXIS_Y}`} stroke={C.wire} strokeWidth={1.3} />
            <path d={`M ${L.tdX + 54} ${AXIS_Y} C ${L.tdX + 150} ${AXIS_Y}, 1120 ${AXIS_Y - 58}, 1210 ${AXIS_Y - 64}`} stroke={C.wire} strokeWidth={1.3} fill="none" />
            {s.torqueDevice ? (
              <TorqueDevice x={L.tdX} roll={roll(has("wire014") ? "wire014" : "pressureWire")} gripped={right?.at === "wire014" && !!right.gripped} />
            ) : (
              <line x1={L.tdX} y1={AXIS_Y} x2={L.tdX + 54} y2={AXIS_Y} stroke={C.wire} strokeWidth={1.3} />
            )}
            {deviceHit(has("wire014") ? "wire014" : "pressureWire", L.tdX - 4, AXIS_Y - 18, 64, 36, "Torque device on the coronary wire")}
          </g>
        )}

        {/* ---- rapid-exchange device (balloon, stent, imaging catheter) ---- */}
        {guide && L.rxDevice && L.rxHubX !== null && (
          <g>
            {/* shaft leaves the valve beside the wire and lies on the table */}
            <path d={`M ${L.yEnd} ${AXIS_Y + 3} C ${L.yEnd + 40} ${AXIS_Y + 6}, ${L.yEnd + 50} ${RX_Y}, ${L.yEnd + 90} ${RX_Y}`} stroke={C.wireShade} strokeWidth={2.2} fill="none" />
            <line x1={L.yEnd + 90} y1={RX_Y} x2={L.rxHubX} y2={RX_Y} stroke={C.wireShade} strokeWidth={2.2} />
            {/* the shaft marks (90 and 100 cm from the tip) still outside the valve */}
            {L.rxMarks.map(([mx, my, m, near], i) => (
              <g key={i}>
                <rect data-shaft-mark={i} x={r2(mx - 2)} y={r2(my - 5)} width={4} height={10} rx={1} fill={C.white} stroke={near ? C.shaftHi : C.whiteShade} strokeWidth={near ? 1.6 : 0.8} />
                <text x={r2(mx)} y={r2(my - 8)} textAnchor="middle" fontSize={r2(Math.min(labelFs, 18))} fill={near ? C.white : C.inkSoft}>
                  {Math.round(m / 10)}
                </text>
              </g>
            ))}
            <path d={`M ${L.rxHubX} ${RX_Y - 3} L ${L.rxHubX + 26} ${RX_Y - 5} L ${L.rxHubX + 26} ${RX_Y + 5} L ${L.rxHubX} ${RX_Y + 3} Z`} fill={C.white} stroke={C.whiteShade} />
            <WingedHubSmall x={L.rxHubX + 26} y={RX_Y} roll={roll(L.rxDevice)} />
            {/* inflation line to the indeflator */}
            <path d={`M ${L.rxHubX + 46} ${RX_Y} C ${L.rxHubX + 90} ${RX_Y}, ${L.rxHubX + 96} ${AXIS_Y - 40}, ${L.rxHubX + 120} -10`} stroke={C.tube} strokeOpacity={0.5} strokeWidth={4} fill="none" />
            {deviceHit(L.rxDevice, L.rxHubX - 40, RX_Y - 14, 90, 28, "Device hub")}
          </g>
        )}

        {/* ---- manifold ---- */}
        <g>
          <rect x={520} y={MAN_Y - 7} width={248} height={14} rx={4} fill={C.clearFill} fillOpacity={0.18} stroke={C.clearLine} strokeWidth={1.2} />
          {/* transducer line and dome */}
          <path d={`M 566 ${MAN_Y + 26} C 566 ${MAN_Y + 46}, 520 ${MAN_Y + 52}, 488 ${MAN_Y + 52}`} stroke={C.tube} strokeOpacity={0.5} strokeWidth={4} fill="none" />
          <rect x={448} y={MAN_Y + 40} width={30} height={24} rx={4} fill={C.white} stroke={C.whiteShade} />
          <circle cx={478} cy={MAN_Y + 52} r={10} fill={C.clearFill} fillOpacity={0.3} stroke={C.clearLine} strokeWidth={1.2} />
          <path d={`M 448 ${MAN_Y + 52} C 420 ${MAN_Y + 52}, 410 ${MAN_Y + 70}, 396 ${MAN_Y + 86}`} stroke={C.hubDarkHi} strokeWidth={3} fill="none" />
          {/* contrast and saline lines leave the table */}
          <path d={`M 636 ${MAN_Y + 26} C 636 ${MAN_Y + 50}, 620 ${MAN_Y + 64}, 612 ${MAN_Y + 86}`} stroke={C.contrast} strokeOpacity={0.55} strokeWidth={4} fill="none" />
          <path d={`M 706 ${MAN_Y + 26} C 706 ${MAN_Y + 50}, 716 ${MAN_Y + 64}, 724 ${MAN_Y + 86}`} stroke={C.saline} strokeOpacity={0.45} strokeWidth={4} fill="none" />
          <Stopcock x={566} y={MAN_Y} closed={lever("pressure")} onClick={turnTap} label="Pressure" readOnly={readOnly} />
          <Stopcock x={636} y={MAN_Y} closed={lever("contrast")} onClick={turnTap} label="Contrast" readOnly={readOnly} />
          <Stopcock x={706} y={MAN_Y} closed={lever("flush")} onClick={turnTap} label="Saline" readOnly={readOnly} />
          {/* port labels above the stopcocks, sized so they render at LABEL_PX or more on screen */}
          <text x={566} y={MAN_Y - 20} textAnchor="middle" fontSize={r2(labelFs)} fill={C.print}>
            Pressure
          </text>
          <text x={636} y={r2(MAN_Y - 20 - (labelFs > LABEL_STAGGER_FS ? labelFs * 1.1 : 0))} textAnchor="middle" fontSize={r2(labelFs)} fill={C.print}>
            Contrast
          </text>
          <text x={706} y={MAN_Y - 20} textAnchor="middle" fontSize={r2(labelFs)} fill={C.print}>
            Saline
          </text>
        </g>

        {/* ---- control syringe ---- */}
        <g>
          {/* nozzle */}
          <rect x={766} y={MAN_Y - 4} width={12} height={8} fill={C.clearFill} fillOpacity={0.3} stroke={C.clearLine} />
          {/* fluid */}
          <rect x={barrel0 + 2} y={MAN_Y - 11} width={Math.max(0, L.syrStopperX - barrel0 - 2)} height={22} fill={mix.fill} opacity={mix.opacity} />
          {airW > 0.5 && <ellipse cx={L.syrStopperX - airW / 2 - 2} cy={MAN_Y - 8} rx={airW / 2} ry={2.6} fill="none" stroke={C.white} strokeOpacity={0.7} strokeWidth={1} />}
          {/* barrel */}
          <rect x={barrel0} y={MAN_Y - 13} width={barrel1 - barrel0} height={26} rx={4} fill={C.clearFill} fillOpacity={0.1} stroke={C.clearLine} strokeWidth={1.3} />
          {ticks}
          {/* stopper */}
          <rect x={L.syrStopperX} y={MAN_Y - 12} width={8} height={24} rx={2} fill={C.rubber} />
          {/* flange with finger rings */}
          <rect x={barrel1} y={MAN_Y - 18} width={6} height={36} rx={2} fill={C.white} stroke={C.whiteShade} />
          <circle cx={barrel1 + 3} cy={MAN_Y - 30} r={11} fill="none" stroke={C.white} strokeWidth={4} />
          <circle cx={barrel1 + 3} cy={MAN_Y + 30} r={11} fill="none" stroke={C.white} strokeWidth={4} />
          {/* plunger rod and thumb ring */}
          <rect x={L.syrStopperX + 8} y={MAN_Y - 3.5} width={L.rodEndX - L.syrStopperX - 8} height={7} fill={C.white} stroke={C.whiteShade} strokeWidth={0.8} />
          <g
            role={readOnly || !input ? undefined : "button"}
            aria-label="Syringe plunger"
            data-input-direct=""
            tabIndex={readOnly || !input ? undefined : 0}
            onPointerDown={onPlungerPointerDown}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                select("syringe");
              }
            }}
            style={{ cursor: readOnly || !input ? "default" : hands?.right.at === "syringe" ? "grab" : "pointer" }}
          >
            <title>Syringe: press and drag the thumb ring towards the manifold to inject, away to draw back</title>
            <circle cx={L.rodEndX + 12} cy={MAN_Y} r={12} fill="none" stroke={C.white} strokeWidth={4.5} />
            <rect x={L.syrStopperX + 4} y={MAN_Y - 16} width={L.rodEndX - L.syrStopperX + 24} height={32} fill="transparent" />
          </g>
        </g>

        {/* ---- drug syringe ---- */}
        {drug && drugAt && <DrugSyringe view={drug} at={drugAt} fontSize={r2(Math.min(labelFs, 18))} />}

        {/* ---- hands ---- */}
        {gauze !== undefined && <Gauze view={gauze} />}

        {leftHand}
        {rightHand}
      </svg>
    </div>
  );
}

/**
 * The white gauze beside the sheath with the last aspirate (an illustration, not a measurement):
 * blood, a dark clot in the blood, glistening debris in the blood, or a dry gauze.
 */
function Gauze({ view }: { view: GauzeView | null }) {
  const x = 120;
  const y = 214;
  const w = 92;
  const h = 70;
  const m = view?.material ?? "none";
  const title =
    m === "thrombus" ? "Gauze: blood with a dark clot" : m === "plaque" ? "Gauze: blood with glistening debris" : m === "blood" ? "Gauze: blood" : view ? "Gauze: dry, nothing came back" : "Gauze: clean";
  return (
    <g aria-label={title} role="img">
      <title>{title}</title>
      <rect x={x} y={y} width={w} height={h} rx={3} fill={C.white} stroke={C.whiteShade} strokeWidth={1} transform={`rotate(-4 ${x + w / 2} ${y + h / 2})`} />
      {/* the weave */}
      {[0.2, 0.4, 0.6, 0.8].map((f) => (
        <line key={`v${f}`} x1={x + w * f} y1={y + 3} x2={x + w * f} y2={y + h - 3} stroke={C.whiteShade} strokeWidth={0.6} opacity={0.6} transform={`rotate(-4 ${x + w / 2} ${y + h / 2})`} />
      ))}
      {m !== "none" && <ellipse cx={x + w * 0.5} cy={y + h * 0.52} rx={w * 0.26} ry={h * 0.24} fill={C.blood} opacity={0.85} />}
      {m !== "none" && <ellipse cx={x + w * 0.62} cy={y + h * 0.44} rx={w * 0.1} ry={h * 0.09} fill={C.blood} opacity={0.6} />}
      {m === "thrombus" && <path d={`M ${x + w * 0.4} ${y + h * 0.46} q 6 -6 13 -1 q 6 5 0 10 q -7 4 -13 -2 q -3 -4 0 -7 Z`} fill={C.clot} />}
      {m === "plaque" &&
        [
          [0.42, 0.5],
          [0.52, 0.42],
          [0.58, 0.58],
          [0.47, 0.62],
        ].map(([fx, fy]) => <circle key={`${fx}-${fy}`} cx={x + w * fx} cy={y + h * fy} r={2.2} fill={C.debris} opacity={0.95} />)}
    </g>
  );
}

/** Smaller luer hub (rapid-exchange device), with one printed stripe that turns with roll. */
function WingedHubSmall({ x, y, roll }: { x: number; y: number; roll: number }) {
  const r = 6;
  const s = Math.sin(roll);
  const c = Math.cos(roll);
  return (
    <g>
      <rect x={x} y={y - r} width={20} height={2 * r} rx={2.5} fill={C.white} stroke={C.whiteShade} />
      {c > 0 && <line x1={x + 2} y1={y - r * s * 0.85} x2={x + 18} y2={y - r * s * 0.85} stroke={C.print} strokeWidth={1.4} opacity={0.3 + 0.6 * c} />}
    </g>
  );
}

// --- the drug syringe (diag-lab-drugs) -------------------------------------------------

interface DrugPlace {
  /** nozzle (or needle tip) position */
  x: number;
  y: number;
  /** direction the barrel lies in from the nozzle, degrees (0: to the right, 90: down) */
  angleDeg: number;
  needle: boolean;
}

/**
 * Where the drug syringe sits: on the manifold between the contrast and saline ports (barrel hanging
 * below), an introducer needle through the Y-connector's valve in the guide set-up or into the
 * catheter hub in the diagnostic set-up (barrel up and away from the wire), or on the sheath's side
 * arm stopcock.
 */
function drugSyringePlace(via: TableDrugSyringe["via"], guide: boolean, L: Layout): DrugPlace {
  if (via === "manifold") return { x: 671, y: MAN_Y + 8, angleDeg: 90, needle: false };
  if (via === "sheath") return { x: 63, y: 194, angleDeg: 0, needle: false };
  return { x: guide ? L.yEnd - 2 : L.cathHubX + 52, y: AXIS_Y - 2, angleDeg: -40, needle: true };
}

/** A viewBox around the syringe and the connector it is on (the inset beside the drug orders). */
function drugCrop(p: DrugPlace): string {
  const w = 300;
  const h = 150;
  const cx = p.x + Math.cos((p.angleDeg * Math.PI) / 180) * 45;
  const cy = p.y + Math.sin((p.angleDeg * Math.PI) / 180) * 45;
  const x = Math.round(Math.min(VIEW_W - w, Math.max(0, cx - w / 2)));
  const y = Math.round(Math.min(VIEW_H - h, Math.max(0, cy - h / 2)));
  return `${x} ${y} ${w} ${h}`;
}

/** A small labelled drug syringe, full or emptied (plunger home), with a needle for the Y-connector. */
function DrugSyringe({ view, at, fontSize }: { view: TableDrugSyringe; at: DrugPlace; fontSize: number }) {
  const n = at.needle ? 22 : 0;
  const barrel0 = n + 6;
  const barrelLen = 44;
  const fill = view.given ? 0 : 0.85;
  // the stopper sits behind the drug it holds, or home at the nozzle once given
  const stopperX = barrel0 + 2 + fill * (barrelLen - 6);
  const title = `${view.label}${view.given ? ", given" : ""}: ${at.needle ? "introducer needle through the Y-connector" : view.via === "sheath" ? "syringe on the sheath side arm" : "syringe on the manifold"}`;
  const rad = (at.angleDeg * Math.PI) / 180;
  const end = barrel0 + barrelLen + 26;
  const lx = at.x + Math.cos(rad) * (end + 6);
  const ly = at.y + Math.sin(rad) * (end + 6);
  const anchor = Math.cos(rad) < -0.3 ? "end" : Math.cos(rad) > 0.3 ? "start" : "middle";
  return (
    <g role="img" aria-label={title}>
      <title>{title}</title>
      <g transform={`translate(${r2(at.x)} ${r2(at.y)}) rotate(${at.angleDeg})`}>
        {at.needle && <line x1={0} y1={0} x2={n} y2={0} stroke={C.wire} strokeWidth={1.4} />}
        <rect x={n} y={-3} width={6} height={6} rx={1} fill={C.white} stroke={C.whiteShade} strokeWidth={0.8} />
        {fill > 0 && <rect x={barrel0 + 1} y={-4.5} width={Math.max(0, stopperX - barrel0 - 1)} height={9} fill={C.clearFill} opacity={0.55} />}
        <rect x={barrel0} y={-5.5} width={barrelLen} height={11} rx={2} fill={C.clearFill} fillOpacity={0.12} stroke={C.clearLine} strokeWidth={1} />
        <rect x={stopperX} y={-5} width={4} height={10} rx={1} fill={C.rubber} />
        <rect x={stopperX + 4} y={-1.6} width={Math.max(0, end - stopperX - 8)} height={3.2} fill={C.white} stroke={C.whiteShade} strokeWidth={0.6} />
        <rect x={end - 4} y={-6} width={4} height={12} rx={1} fill={C.white} stroke={C.whiteShade} strokeWidth={0.6} />
      </g>
      <text x={r2(lx)} y={r2(ly + fontSize * 0.35)} textAnchor={anchor} fontSize={fontSize} fill={C.print}>
        {view.label}
      </text>
    </g>
  );
}
