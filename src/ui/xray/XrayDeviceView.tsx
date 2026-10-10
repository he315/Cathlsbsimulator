import { useEffect, useMemo, useRef, useState } from "react";
import { XrayRenderer } from "../../render/xray/XrayRenderer";
import { buildCoronaryTree, type CoronaryTree } from "../../render/xray/coronaryTree";
import { buildXrayScene, LabImaging, SID, SOD, treeCentre, type SceneResult } from "../../render/xray/sceneBuilder";
import { motionAt } from "../../render/xray/heartMotion";
import type { HardwareSpec } from "../../render/xray/hardware";
import { deviceTips, deviceTubes, iabpInflationAt, type DeviceDrawing, type DevicePositions, type DeviceSpec } from "../../render/xray/deviceTubes";
import { buildAnatomy, type AnatomyModel } from "../../simulation/anatomy";
import { CASE_LIBRARY } from "../../simulation/caseGenerator";
import type { CardiacClock } from "../../simulation/clock/cardiacClock";
import type { AnatomyCase, CArm, Vec3 } from "../../types";

// ===========================================================================
// Fluoroscopy of non-coronary devices on the X-ray renderer (work package
// xray-device-fluoro-views). A reusable view for the mechanical support,
// pacing, pericardiocentesis, haemodynamic and structural labs: the patient's
// own thorax (the genome of the case seed, breathing and the beating heart)
// with the devices of src/render/xray/deviceTubes.ts drawn through
// buildXrayScene's public extras hook. It mirrors AccessFluoroView: the beam
// is on only while the pedal is held (the button or the F key), the last
// image is held when it is released and no dose is booked then; AP, LAO and
// RAO projections; dose through LabImaging (dose.ts). Frames are rendered at
// 768 px and only while the pedal is down.
//
// The view shows what an operator sees: the image, the projection, the beam
// state and the dose. Device positions (for example the IABP tip to carina
// distance) go to the host through onPositions for its own checks; they are
// never printed on the image.
//
// Development: window.__xrayDeviceDraw(options) draws one exposed frame on
// demand (the browser pane pauses requestAnimationFrame while hidden) and
// reports timings, the projected device tips and, with `measure`, the local
// contrast of the IABP tip marker against its surroundings.
// ===========================================================================

export type XrayDeviceViewId = "ap" | "lao" | "rao";

const VIEWS: Record<XrayDeviceViewId, { label: string; arm: CArm }> = {
  ap: { label: "AP", arm: { laoRao: 0, cranialCaudal: 0 } },
  lao: { label: "LAO 30", arm: { laoRao: 30, cranialCaudal: 0 } },
  rao: { label: "RAO 30", arm: { laoRao: -30, cranialCaudal: 0 } },
};

/** Render resolution (px): the realism baseline's capture size. */
const RENDER_PX = 768;
/** Fluoroscopy pulse rate of the view (frames per second); the lab frame budget is one pulse interval. */
const FLUORO_PPS = 15;
export const LAB_FRAME_BUDGET_MS = 1000 / FLUORO_PPS;

export interface XrayDeviceDose {
  fluoroS: number;
  karMGy: number;
  kapGyCm2: number;
}

export interface XrayDeviceViewProps {
  /** the patient's anatomy (default: the first case of the library) */
  caseData?: AnatomyCase;
  /** the devices in the patient now (read every frame) */
  devices: readonly DeviceSpec[];
  /** the patient engine's clock (the image then follows its rhythm and breathing); default: the view's own clock */
  clock?: CardiacClock;
  /** heart rate of the view's own clock (bpm, default 72; a change is followed without rebuilding the view) */
  hr?: number;
  /** patient seed for the thorax (default the case id) */
  patientSeed?: string | number;
  /** panel title (default "Fluoroscopy") */
  title?: string;
  /** projections offered (default AP, LAO 30, RAO 30) */
  views?: readonly XrayDeviceViewId[];
  initialView?: XrayDeviceViewId;
  /** detector field, full width (mm, default 250) */
  fieldMm?: number;
  /** where the table centres: on the devices (default), on the heart, or on a thorax-frame point */
  centreOn?: "devices" | "heart" | Vec3;
  /** IABP counterpulsation at 1:1 from the clock for an IABP spec without its own inflation */
  pumping?: boolean;
  /** hardware in the field (default ECG electrodes and the table) */
  hardware?: HardwareSpec | null;
  /** device positions after each exposed frame (host checks; never displayed by the view) */
  onPositions?: (p: DevicePositions) => void;
  /** dose after each exposed frame */
  onDose?: (d: XrayDeviceDose) => void;
  /** the beam went on or off */
  onBeam?: (on: boolean) => void;
  /** show the dose read-out in the panel head (default true) */
  showDose?: boolean;
  className?: string;
}

export interface XrayDeviceDrawResult {
  ok: boolean;
  view: XrayDeviceViewId;
  /** render resolution (px) */
  res: number;
  /** time to build the devices and the scene, to render, and both with a GPU sync (ms) */
  ms: { devices: number; scene: number; render: number; total: number };
  budgetMs: number;
  withinBudget: boolean;
  positions: DevicePositions;
  /** device tips projected to canvas pixels (top-down) */
  tipsPx: { x: number; y: number }[];
  /** with `measure`: the IABP tip marker against the image around it */
  marker?: { px: { x: number; y: number }; markerGrey: number; ringGrey: number; ringSd: number; contrast: number; cnr: number; overSpine: boolean } | null;
  dose: XrayDeviceDose;
}

interface DrawOptions {
  view?: XrayDeviceViewId;
  devices?: readonly DeviceSpec[];
  /** measure the IABP tip marker's contrast (reads the canvas back; slow) */
  measure?: boolean;
}

type DevWindow = { __xrayDeviceDraw?: (o?: DrawOptions) => XrayDeviceDrawResult | null };

const isDev = () => !!(import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;

function withInflation(devices: readonly DeviceSpec[], pumping: boolean, clock: { tInBeat: number; endSystole: number; rr: number }): DeviceSpec[] {
  if (!pumping) return devices.slice();
  const k = iabpInflationAt(clock);
  return devices.map((d) => (d.kind === "iabp" && d.inflation === undefined ? { ...d, inflation: k } : d));
}

/** Grey statistics of a disc and of a ring around it in a top-down grey image. */
function discStats(grey: Uint8ClampedArray, w: number, cx: number, cy: number, r0: number, r1: number, r2: number) {
  let n0 = 0,
    s0 = 0,
    n1 = 0,
    s1 = 0,
    q1 = 0;
  for (let y = Math.floor(cy - r2); y <= Math.ceil(cy + r2); y++)
    for (let x = Math.floor(cx - r2); x <= Math.ceil(cx + r2); x++) {
      if (x < 0 || y < 0 || x >= w || y >= w) continue;
      const d = Math.hypot(x - cx, y - cy);
      const g = grey[(y * w + x) * 4];
      if (d <= r0) {
        n0++;
        s0 += g;
      } else if (d >= r1 && d <= r2) {
        n1++;
        s1 += g;
        q1 += g * g;
      }
    }
  const m0 = n0 ? s0 / n0 : 0;
  const m1 = n1 ? s1 / n1 : 0;
  const sd = n1 ? Math.sqrt(Math.max(0, q1 / n1 - m1 * m1)) : 0;
  return { m0, m1, sd };
}

export default function XrayDeviceView(props: XrayDeviceViewProps) {
  const { title = "Fluoroscopy", views = ["ap", "lao", "rao"], fieldMm = 250, showDose = true } = props;
  const caseData = props.caseData ?? CASE_LIBRARY[0];
  const seed = props.patientSeed ?? caseData.id;
  const rootRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const labRef = useRef<LabImaging | null>(null);
  /** the pointer is over the view (arrow keys pan the table only then, or with focus inside the view) */
  const hoverRef = useRef(false);
  const glRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<XrayDeviceViewId>(props.initialView ?? views[0] ?? "ap");
  const [pedal, setPedal] = useState(false);
  const [noGl, setNoGl] = useState(false);
  const [dose, setDose] = useState<XrayDeviceDose>({ fluoroS: 0, karMGy: 0, kapGyCm2: 0 });
  const st = useRef({ pedal: false, view, pan: { x: 0, y: 0 } });
  st.current.pedal = pedal;
  st.current.view = view;
  // the latest props for the frame loop (devices change every frame in a host)
  const live = useRef(props);
  live.current = props;

  const model: AnatomyModel = useMemo(() => buildAnatomy(caseData), [caseData]);
  const tree: CoronaryTree = useMemo(() => buildCoronaryTree(model, caseData), [model, caseData]);

  useEffect(() => {
    const canvas = glRef.current;
    if (!canvas) return;
    const xr = XrayRenderer.create(canvas);
    if (!xr) {
      setNoGl(true);
      return;
    }
    canvas.width = RENDER_PX;
    canvas.height = RENDER_PX;
    xr.fitCanvas(RENDER_PX, { maxRes: RENDER_PX, fallbackRes: RENDER_PX });
    const lab = new LabImaging(props.clock ? { clock: props.clock } : { seed, hr: props.hr ?? 72 });
    labRef.current = lab;
    const H = tree.heart;
    const heartCentre = treeCentre(tree, "both");
    let frameNo = 0;
    let last = 0;
    let raf = 0;
    let beamWasOn = false;
    let lastDoseUi = 0;
    // the table centre for a device set (rest geometry, so the table does not follow breathing)
    let centreKey = "";
    let centre: Vec3 = heartCentre;
    const centreFor = (devices: readonly DeviceSpec[]): Vec3 => {
      const c = live.current.centreOn ?? "devices";
      const key = typeof c === "string" ? c + JSON.stringify(devices) : JSON.stringify(c);
      if (key === centreKey) return centre;
      centreKey = key;
      if (c === "heart") centre = heartCentre;
      else if (typeof c === "object") centre = c;
      else {
        const tips = deviceTips(deviceTubes({ heart: H, resp: 0, seed }, devices));
        if (!tips.length) centre = heartCentre;
        else {
          // the middle of the device tips, with the heart in the box when it fits (the cardiac silhouette
          // is the landmark); the field at the iso-centre is the detector field over the magnification
          const isoField = (fieldMm * SOD) / SID;
          const box = (pts: Vec3[]) => {
            const xs = pts.map((p) => p.x);
            const ys = pts.map((p) => p.y);
            return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), z: pts.reduce((a, p) => a + p.z, 0) / pts.length };
          };
          const withHeart = box([...tips, heartCentre]);
          const fits = withHeart.x1 - withHeart.x0 < 0.75 * isoField && withHeart.y1 - withHeart.y0 < 0.75 * isoField;
          const b = fits ? withHeart : box(tips);
          centre = { x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2, z: b.z };
        }
      }
      return centre;
    };

    const draw = (force: boolean, o: DrawOptions = {}): { res: SceneResult; drawing: DeviceDrawing; ms: XrayDeviceDrawResult["ms"] } | null => {
      const now = performance.now();
      const on = st.current.pedal || force;
      if (!props.clock) lab.tick(now);
      if (!on) {
        if (beamWasOn) {
          lab.beamOff(now);
          beamWasOn = false;
          live.current.onBeam?.(false);
        }
        return null;
      }
      if (!force && now - last < 1000 / FLUORO_PPS) return null;
      last = now;
      if (!beamWasOn) live.current.onBeam?.(true);
      beamWasOn = true;
      frameNo++;
      const p = live.current;
      const viewId = o.view ?? st.current.view;
      const cArm = VIEWS[viewId].arm;
      const t0 = performance.now();
      const lf = lab.frame("fluoro", xr);
      const clock = lf.clock;
      const resp = lf.breathHold ?? clock.resp;
      const motion = motionAt(clock, H);
      const specs = withInflation(o.devices ?? p.devices, !!p.pumping, clock);
      const drawing = deviceTubes({ heart: H, resp, motion, seed }, specs);
      const t1 = performance.now();
      const c = centreFor(o.devices ?? p.devices);
      const pan = { x: c.x - heartCentre.x + st.current.pan.x, y: c.y - heartCentre.y + st.current.pan.y, z: c.z - heartCentre.z };
      const res = buildXrayScene({
        model,
        caseData,
        tree,
        // no coronary catheter: the diagnostic catheter is parked far outside the field
        catheterRoot: [],
        catheterNodes: [
          { x: 0, y: 3000, z: 0 },
          { x: 1, y: 3001, z: 0 },
        ],
        legacyCatheter: false,
        french: 6,
        bolus: null,
        t: clock.t,
        clock,
        breathHold: lf.breathHold,
        cArm,
        field: fieldMm,
        pan,
        mode: "fluoro",
        frame: frameNo,
        framesSinceStart: lf.framesSinceStart,
        adrc: lf.adrc,
        exposure: lab.exposure,
        meter: lf.meter,
        meteredWaterCm: lf.meteredWaterCm,
        patientSeed: seed,
        hardware: p.hardware,
        extras: () => ({ tubes: drawing.tubes, bones: drawing.bones }),
      });
      const t2 = performance.now();
      xr.render(res.scene, res.params);
      lab.expose(res, cArm, fieldMm, now);
      const t3 = performance.now();
      const d = lab.dose.totals;
      const dz = { fluoroS: d.fluoroTimeS, karMGy: d.karMGy.total, kapGyCm2: d.kapGyCm2.total };
      // the read-out updates four times a second, not on every pulse
      if (force || now - lastDoseUi > 250) {
        lastDoseUi = now;
        setDose(dz);
      }
      p.onDose?.(dz);
      p.onPositions?.(drawing.positions);
      return { res, drawing, ms: { devices: t1 - t0, scene: t2 - t1, render: t3 - t2, total: t3 - t0 } };
    };

    const loop = () => {
      draw(false);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const w = window as unknown as DevWindow;
    let hook: DevWindow["__xrayDeviceDraw"];
    if (isDev()) {
      hook = (o: DrawOptions = {}) => {
        const viewId = o.view ?? st.current.view;
        const t0 = performance.now();
        const out = draw(true, o);
        if (!out) return null;
        // a GPU sync so the render time includes the GPU work
        const gl = canvas.getContext("webgl2");
        const px = new Uint8Array(4);
        gl?.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        const total = performance.now() - t0;
        const cam = out.res.scene.cam;
        const toPx = (p: Vec3) => {
          const q = XrayRenderer.project(cam, p);
          return { x: ((q.u + 1) / 2) * RENDER_PX, y: ((1 - q.v) / 2) * RENDER_PX };
        };
        let marker: XrayDeviceDrawResult["marker"] = undefined;
        if (o.measure) {
          const m = out.drawing.tubes.find((t) => t.device === "iabp" && t.part === "tip marker");
          if (!m) marker = null;
          else {
            const mid = m.pts[Math.floor(m.pts.length / 2)];
            const c2 = document.createElement("canvas");
            c2.width = RENDER_PX;
            c2.height = RENDER_PX;
            const ctx = c2.getContext("2d", { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(canvas, 0, 0);
              const img = ctx.getImageData(0, 0, RENDER_PX, RENDER_PX).data;
              const at = toPx(mid);
              const s = discStats(img, RENDER_PX, at.x, at.y, 1.5, 7, 11);
              // over the spine: the vertebral column is at the patient's midline (x = 0) about 20-25 mm either side
              const overSpine = Math.abs(mid.x) < 30;
              marker = { px: at, markerGrey: s.m0, ringGrey: s.m1, ringSd: s.sd, contrast: s.m1 - s.m0, cnr: s.sd > 0 ? (s.m1 - s.m0) / s.sd : 0, overSpine };
            }
          }
        }
        const d = lab.dose.totals;
        return {
          ok: true,
          view: viewId,
          res: xr.getResolution().res,
          ms: { ...out.ms, total },
          budgetMs: LAB_FRAME_BUDGET_MS,
          withinBudget: total <= LAB_FRAME_BUDGET_MS,
          positions: out.drawing.positions,
          tipsPx: deviceTips(out.drawing).map(toPx),
          marker,
          dose: { fluoroS: d.fluoroTimeS, karMGy: d.karMGy.total, kapGyCm2: d.kapGyCm2.total },
        };
      };
      w.__xrayDeviceDraw = hook;
    }
    return () => {
      cancelAnimationFrame(raf);
      if (labRef.current === lab) labRef.current = null;
      lab.beamOff(performance.now());
      if (beamWasOn) live.current.onBeam?.(false);
      if (hook && w.__xrayDeviceDraw === hook) delete w.__xrayDeviceDraw;
      xr.dispose?.();
    };
    // the renderer and imaging state belong to one patient: rebuilt when the anatomy, seed, clock or field changes
    // (hr is followed by the effect below; the other props are read live through `live`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, tree, caseData, seed, props.clock, fieldMm]);

  // the view's own clock follows the hr prop (an engine's clock is the engine's to set)
  useEffect(() => {
    if (!props.clock) labRef.current?.clock.setHeartRate(props.hr ?? 72);
  }, [props.hr, props.clock]);

  // keyboard: hold F for fluoroscopy, arrows pan the table. A browser shortcut (Cmd/Ctrl/Alt with F) is not the
  // pedal (on macOS the F keyup never arrives while Cmd is held), and losing the window or the tab releases it.
  useEffect(() => {
    const typing = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || !!el?.isContentEditable;
    };
    const ours = () => hoverRef.current || !!rootRef.current?.contains(document.activeElement);
    const dn = (e: KeyboardEvent) => {
      if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() === "f") setPedal(true);
      else if (e.key.startsWith("Arrow") && ours()) {
        const d = 12;
        if (e.key === "ArrowUp") st.current.pan.y += d;
        if (e.key === "ArrowDown") st.current.pan.y -= d;
        if (e.key === "ArrowLeft") st.current.pan.x -= d;
        if (e.key === "ArrowRight") st.current.pan.x += d;
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "f" || e.key === "Meta" || e.key === "Control") setPedal(false);
    };
    const release = () => setPedal(false);
    const hidden = () => {
      if (document.hidden) setPedal(false);
    };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("keydown", dn);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div
      ref={rootRef}
      className={`panel h-full flex flex-col overflow-hidden ${props.className ?? ""}`}
      onPointerEnter={() => (hoverRef.current = true)}
      onPointerLeave={() => (hoverRef.current = false)}
    >
      <div className="panel-head">
        <span>{title}</span>
        <span className="flex items-center gap-2 normal-case tracking-normal text-ink-faint text-[12px]">
          {VIEWS[view].label} · field {Math.round(fieldMm / 10)} cm · {pedal ? `fluoro ${FLUORO_PPS} p/s` : "last image hold"}
          {showDose && (
            <span className="font-mono">
              {mmss(dose.fluoroS)} · {dose.karMGy.toFixed(1)} mGy · {dose.kapGyCm2.toFixed(2)} Gy·cm²
            </span>
          )}
        </span>
      </div>
      <div className="flex-1 min-h-0 grid grid-cols-[1fr_auto] gap-0">
        <div
          ref={wrapRef}
          className="relative bg-black select-none touch-none min-h-0"
          onPointerMove={(e) => {
            if (e.buttons !== 1 || !e.shiftKey) return;
            st.current.pan.x += e.movementX * 0.4;
            st.current.pan.y -= e.movementY * 0.4;
          }}
        >
          <div className="absolute inset-0 grid place-items-center">
            <canvas ref={glRef} className="block" style={{ width: "min(100%, 100vh)", aspectRatio: "1 / 1", maxHeight: "100%" }} />
          </div>
          {noGl && <div className="absolute inset-0 grid place-items-center text-ink-faint text-sm">WebGL2 is not available: fluoroscopy cannot be shown.</div>}
        </div>
        <div className="w-40 border-l border-line p-2 flex flex-col gap-2 overflow-y-auto">
          <button
            className={`btn ${pedal ? "btn-accent" : ""}`}
            aria-pressed={pedal}
            onPointerDown={() => setPedal(true)}
            onPointerUp={() => setPedal(false)}
            onPointerLeave={() => setPedal(false)}
            onPointerCancel={() => setPedal(false)}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                setPedal(true);
              }
            }}
            onKeyUp={(e) => {
              if (e.key === " " || e.key === "Enter") setPedal(false);
            }}
            onBlur={() => setPedal(false)}
            title="Hold for fluoroscopy (or hold F)"
          >
            {pedal ? "Fluoroscopy on" : "Hold for fluoroscopy"}
          </button>
          <div className="text-[12px] text-ink-faint">C-arm</div>
          <div className="seg flex-wrap">
            {views.map((id) => (
              <button key={id} className={`seg-btn ${view === id ? "seg-btn-active" : ""}`} onClick={() => setView(id)}>
                {VIEWS[id].label}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost justify-start" onClick={() => (st.current.pan = { x: 0, y: 0 })}>
            Centre the table
          </button>
          <p className="text-[12px] text-ink-faint leading-snug mt-1">Hold F, or hold this button with the mouse, Space or Enter, for fluoroscopy. Shift-drag, or the arrow keys over the view, pan the table.</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Development only: mount a stand-alone XrayDeviceView in a fixed overlay (for checking the view and its draw
 * hook before a lab hosts it). Returns a function that unmounts it.
 */
export async function devMountXrayDeviceView(props: XrayDeviceViewProps, px = 640): Promise<() => void> {
  if (!isDev()) throw new Error("devMountXrayDeviceView is for development builds only");
  const { createRoot } = await import("react-dom/client");
  const el = document.createElement("div");
  el.style.cssText = `position:fixed;left:0;top:0;width:${px + 160}px;height:${px + 40}px;z-index:99999;background:#0E1013`;
  document.body.appendChild(el);
  const root = createRoot(el);
  root.render(<XrayDeviceView {...props} />);
  await new Promise((r) => setTimeout(r, 50));
  return () => {
    root.unmount();
    el.remove();
  };
}
