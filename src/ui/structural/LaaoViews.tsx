import type { ReactNode } from "react";
import {
  DISC_MARGIN_MM,
  LOBE_LENGTH_MM,
  SHEATH_MARKER_BEHIND_TIP_MM,
  deviceLengthMm,
  plugPositionFromSheath,
  plugSheathBands,
  type AngleMeasurement,
  type LaaMorphology,
  type LaaoDeviceType,
  type Anchor,
  type DeployStage,
} from "../../simulation/laao";

// Original TOE schematic of the left atrial appendage at one omniplane angle,
// drawn to scale from that angle's measurements, with an optional device.
//
// structural-laao-device-mechanics: the device is drawn at its deployment stage (the lobe-and-disc
// ball, the lobe open before the disc), a thrombus can sit on its atrial face at follow-up, and
// LaaFluoroView draws the RAO caudal fluoroscopy of the sheath, its marker bands and the pigtail.

const K = 4.3; // px per mm
const O = { x: 140, y: 104 }; // ostium centre
const ANG = (50 * Math.PI) / 180;
const U = { x: Math.cos(ANG), y: Math.sin(ANG) }; // along the appendage axis
const N = { x: -Math.sin(ANG), y: Math.cos(ANG) }; // across it

const pt = (d: number, w: number, off = 0) => ({
  x: O.x + (U.x * (d - off) + N.x * w) * K,
  y: O.y + (U.y * (d - off) + N.y * w) * K,
});

function halfWidth(m: AngleMeasurement, morph: LaaMorphology, d: number): number {
  const ost = m.ostiumMm / 2;
  const lz = m.landingZoneMm / 2;
  if (d <= 10) return ost + (lz - ost) * (d / 10);
  const end = m.depthMm;
  const t = Math.min(1, (d - 10) / Math.max(1, end - 10));
  switch (morph) {
    case "windsock":
      return lz * (1 - 0.45 * t);
    case "chicken-wing":
      return lz * (1 - 0.25 * t);
    case "cactus":
      return lz * (1 - 0.35 * t);
    case "cauliflower":
      return lz * (1 - 0.15 * t) + Math.sin(d * 1.1) * 1.2;
  }
}

function wallPath(m: AngleMeasurement, morph: LaaMorphology, off: number): string {
  const end = m.depthMm;
  const top: string[] = [];
  const bot: string[] = [];
  for (let i = 0; i <= 30; i++) {
    const d = (end * i) / 30;
    const h = halfWidth(m, morph, d);
    const a = pt(d, h, off);
    const b = pt(d, -h, off);
    top.push(`${i === 0 ? "M" : "L"} ${a.x.toFixed(1)} ${a.y.toFixed(1)}`);
    bot.unshift(`L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`);
  }
  const tipH = halfWidth(m, morph, end);
  const tip = pt(end + tipH * 0.9, 0, off);
  const a = pt(end, tipH, off);
  const b = pt(end, -tipH, off);
  return `${top.join(" ")} Q ${tip.x + (a.x - b.x) * 0.1} ${tip.y + (a.y - b.y) * 0.1} ${b.x} ${b.y} ${bot.join(" ")}`;
}

function extras(m: AngleMeasurement, morph: LaaMorphology, off: number) {
  const end = m.depthMm;
  const lz = m.landingZoneMm / 2;
  if (morph === "chicken-wing") {
    // the bend: a limb folding back beyond the usable depth
    const base = pt(end - 2, 0, off);
    const ang = ANG - (115 * Math.PI) / 180;
    const len = 16 * K;
    const tip = { x: base.x + Math.cos(ang) * len, y: base.y + Math.sin(ang) * len };
    return (
      <path
        d={`M ${base.x} ${base.y} L ${tip.x} ${tip.y}`}
        stroke="#3b2a2d"
        strokeWidth={lz * K * 1.2}
        strokeLinecap="round"
      />
    );
  }
  if (morph === "cactus") {
    const p1 = pt(14, lz + 3, off);
    const p2 = pt(18, -lz - 2.5, off);
    return (
      <g fill="#3b2a2d">
        <ellipse cx={p1.x} cy={p1.y} rx={5 * K} ry={3 * K} transform={`rotate(${(ANG * 180) / Math.PI - 30} ${p1.x} ${p1.y})`} />
        <ellipse cx={p2.x} cy={p2.y} rx={4.5 * K} ry={2.8 * K} transform={`rotate(${(ANG * 180) / Math.PI + 30} ${p2.x} ${p2.y})`} />
      </g>
    );
  }
  if (morph === "cauliflower") {
    const lobes = [
      [end - 2, lz + 1.5],
      [end + 1, 0],
      [end - 3, -lz - 1],
    ];
    return (
      <g fill="#3b2a2d">
        {lobes.map(([d, w], i) => {
          const p = pt(d, w, off);
          return <circle key={i} cx={p.x} cy={p.y} r={4.2 * K} />;
        })}
      </g>
    );
  }
  return null;
}

export interface DeviceDraw {
  type: LaaoDeviceType;
  sizeMm: number;
  positionMm: number;
  /** 0 constrained in the sheath … 1 fully deployed */
  expansion: number;
  /** tug animation 0 … 1 … 0 */
  tug: number;
  anchor: Anchor;
  /** structural-laao-device-mechanics: the lobe-and-disc device's stage (ball, lobe open, disc open) */
  stage?: "ball" | "lobe-open" | "deployed";
}

export function LaaToeView({
  m,
  morph,
  measured,
  device,
  leakMm,
  colour,
  thrombusMm = 0,
  label = "mid-oesophageal LAA view",
}: {
  m: AngleMeasurement;
  morph: LaaMorphology;
  measured: boolean;
  device: DeviceDraw | null;
  leakMm: number;
  colour: boolean;
  /** an echodensity on the atrial face of the device (follow-up), mm */
  thrombusMm?: number;
  label?: string;
}) {
  // Tug: the device moves back towards the LA; a stable device carries the wall with it.
  const tugMm = device ? device.tug * 3 : 0;
  const wallMove = device ? (device.anchor === "stable" ? tugMm : device.anchor === "marginal" ? tugMm * 0.5 : tugMm * 0.1) : 0;
  const devMove = device ? (device.anchor === "stable" ? tugMm : device.anchor === "marginal" ? tugMm * 1.4 : tugMm * 2.6) : 0;
  const wallOff = wallMove;
  const devOff = devMove;

  const ostA = pt(0, m.ostiumMm / 2, wallOff);
  const ostB = pt(0, -m.ostiumMm / 2, wallOff);
  const lzA = pt(10, m.landingZoneMm / 2, wallOff);
  const lzB = pt(10, -m.landingZoneMm / 2, wallOff);
  const dA = pt(0, 0, wallOff);
  const dB = pt(m.depthMm, 0, wallOff);

  let deviceEl: ReactNode = null;
  let cableStart = pt(-4, 0, devOff);
  if (device) {
    const e = device.expansion;
    const pos = device.positionMm;
    if (device.type === "plug") {
      const len = deviceLengthMm("plug", device.sizeMm);
      const fit = Math.min(device.sizeMm, m.ostiumMm) / 2;
      const hw = 4 + (fit - 4) * e;
      const l = len * (0.6 + 0.4 * e);
      const p0a = pt(pos, hw, devOff);
      const p0b = pt(pos, -hw, devOff);
      const p1a = pt(pos + l * 0.55, hw, devOff);
      const p1b = pt(pos + l * 0.55, -hw, devOff);
      const tip = pt(pos + l, 0, devOff);
      const c = pt(pos - 1.2, 0, devOff);
      cableStart = pt(pos - 1, 0, devOff);
      deviceEl = (
        <g>
          <path
            d={`M ${p0a.x} ${p0a.y} Q ${c.x} ${c.y} ${p0b.x} ${p0b.y} L ${p1b.x} ${p1b.y} Q ${tip.x} ${tip.y} ${p1a.x} ${p1a.y} Z`}
            fill="#c8d3de"
            fillOpacity="0.35"
            stroke="#eef3f8"
            strokeWidth="1.6"
          />
          {[0.25, 0.5, 0.75].map((f) => {
            const a = pt(pos + l * 0.55 * f, hw * 0.95, devOff);
            const b = pt(pos + l * 0.55 * f, -hw * 0.95, devOff);
            return <line key={f} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#eef3f8" strokeOpacity="0.45" />;
          })}
        </g>
      );
    } else if (device.stage === "ball") {
      // the lobe as a round ball at the sheath tip, the disc still in the sheath
      const c = pt(pos + 3, 0, devOff);
      cableStart = pt(pos, 0, devOff);
      deviceEl = <circle cx={c.x} cy={c.y} r={3.2 * K} fill="#c8d3de" fillOpacity="0.35" stroke="#eef3f8" strokeWidth="1.6" data-device="ball" />;
    } else {
      const lobeFit = Math.min(device.sizeMm, m.landingZoneMm) / 2;
      const lhw = 4 + (lobeFit - 4) * e;
      const discOpen = device.stage === "lobe-open" ? 0 : e;
      const discHw = 1.5 + ((device.sizeMm + DISC_MARGIN_MM) / 2 - 1.5) * discOpen;
      const l0 = pos;
      const l1 = pos + LOBE_LENGTH_MM;
      const a0 = pt(l0, lhw, devOff);
      const a1 = pt(l1, lhw, devOff);
      const b1 = pt(l1, -lhw, devOff);
      const b0 = pt(l0, -lhw, devOff);
      const dc = pt(-1.2, 0, devOff);
      const da = pt(-1.2 + 1.2, discHw, devOff);
      const db = pt(-1.2 + 1.2, -discHw, devOff);
      const w0 = pt(l0, 0, devOff);
      cableStart = pt(-2.4, 0, devOff);
      deviceEl = (
        <g>
          <path d={`M ${a0.x} ${a0.y} L ${a1.x} ${a1.y} L ${b1.x} ${b1.y} L ${b0.x} ${b0.y} Z`} fill="#c8d3de" fillOpacity="0.35" stroke="#eef3f8" strokeWidth="1.6" />
          <line x1={dc.x} y1={dc.y} x2={w0.x} y2={w0.y} stroke="#eef3f8" strokeWidth="1.4" />
          <path d={`M ${da.x} ${da.y} Q ${dc.x} ${dc.y} ${db.x} ${db.y}`} stroke="#eef3f8" strokeWidth="2.6" fill="none" />
        </g>
      );
    }
  }
  const cableEnd = { x: 20, y: 40 };
  const leakW = Math.min(30, leakMm * K * 0.9);
  const leakAt = pt(0.5, -(m.ostiumMm / 2) + 0.5, wallOff);

  return (
    <svg viewBox="0 0 360 280" className="w-full block">
      <rect width="360" height="280" fill="#05080c" />
      <path d="M180 4 L352 262 A 300 300 0 0 1 8 262 Z" fill="#0c1116" stroke="#1d2731" />
      {/* left atrium */}
      <ellipse cx="80" cy="96" rx="70" ry="52" fill="#2a1f22" />
      <text x="54" y="84" fontSize="10" fill="#858D99">
        LA
      </text>
      {/* appendage */}
      <g>
        {extras(m, morph, wallOff)}
        <path d={wallPath(m, morph, wallOff)} fill="#3b2a2d" stroke="#8b6c70" strokeWidth="1.5" />
      </g>
      {/* landmarks: circumflex at the inferior (mitral) end of the ostium, LUPV ridge at the superior end */}
      {(() => {
        const cx = pt(1, m.ostiumMm / 2 + 3.5, wallOff);
        const ridge = pt(-1.5, -m.ostiumMm / 2 - 1.5, wallOff);
        return (
          <g>
            <circle cx={cx.x} cy={cx.y} r="5" fill="#1b2430" stroke="#5c7894" />
            <text x={cx.x - 8} y={cx.y + 18} fontSize="8" fill="#858D99">
              Circumflex
            </text>
            <path d={`M ${ridge.x - 14} ${ridge.y - 12} Q ${ridge.x - 4} ${ridge.y - 2} ${ridge.x} ${ridge.y}`} stroke="#8b6c70" strokeWidth="5" fill="none" strokeLinecap="round" />
            <text x={ridge.x + 6} y={ridge.y - 10} fontSize="8" fill="#858D99">
              LUPV ridge
            </text>
          </g>
        );
      })()}

      {measured && (
        <g fontFamily="monospace" fontSize="9">
          <line x1={ostA.x} y1={ostA.y} x2={ostB.x} y2={ostB.y} stroke="#E9B95A" strokeWidth="1.4" />
          <text x={ostA.x + 8} y={ostA.y + 2} fill="#E9B95A">
            ostium {m.ostiumMm}
          </text>
          <line x1={lzA.x} y1={lzA.y} x2={lzB.x} y2={lzB.y} stroke="#4CC38A" strokeWidth="1.4" />
          <text x={lzA.x + 8} y={lzA.y + 2} fill="#4CC38A">
            LZ {m.landingZoneMm}
          </text>
          <line x1={dA.x} y1={dA.y} x2={dB.x} y2={dB.y} stroke="#4F8EF7" strokeWidth="1.2" strokeDasharray="4 2" />
          <text x={dB.x + 6} y={dB.y + 10} fill="#4F8EF7">
            depth {m.depthMm}
          </text>
        </g>
      )}

      {device && (
        <g>
          <path d={`M ${cableEnd.x} ${cableEnd.y} Q 70 70 ${cableStart.x} ${cableStart.y}`} stroke="#A6ADB8" strokeWidth="2.2" fill="none" />
          {deviceEl}
        </g>
      )}

      {device && thrombusMm > 0 && (() => {
        // a homogeneous echodensity on the atrial face of the device, mid-surface
        const at = pt(device.positionMm - 0.6 - thrombusMm * 0.35, m.ostiumMm * 0.12, wallOff);
        return <ellipse cx={at.x} cy={at.y} rx={thrombusMm * K * 0.45} ry={thrombusMm * K * 0.3} fill="#b9a58a" fillOpacity="0.85" stroke="#e2d2b8" strokeWidth="0.8" data-echodensity="device-face" />;
      })()}

      {colour && leakMm > 0 && (
        <ellipse cx={leakAt.x + 6} cy={leakAt.y + 4} rx={Math.max(4, leakW)} ry={Math.max(3, leakW * 0.45)} fill="#ff7a2f" opacity="0.7" />
      )}

      <text x="10" y="272" fontSize="10" fill="#A6ADB8" fontFamily="monospace">
        {m.angle}°
      </text>
      <text x="350" y="272" fontSize="9" fill="#858D99" textAnchor="end">
        {label}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// RAO caudal fluoroscopy of the appendage, the access sheath and its markers
// (structural-laao-device-mechanics). Original schematic: the appendage is drawn
// opacified once contrast has been given through the pigtail, from the 135°
// measurement (RAO 30/caudal 20 corresponds roughly to the TOE 135° view,
// lesson hb-mitral-tricuspid-laa-laao-plan). Distances are what the operator
// judges on the screen; numbers appear only as guided aids.
// ---------------------------------------------------------------------------

const FK = 3.6; // px per mm
const FO = { x: 150, y: 150 }; // ostium centre
const FANG = (-35 * Math.PI) / 180; // appendage axis points up and to the right
const FU = { x: Math.cos(FANG), y: Math.sin(FANG) };
const FN = { x: -Math.sin(FANG), y: Math.cos(FANG) };
const fpt = (d: number, w = 0) => ({ x: FO.x + (FU.x * d + FN.x * w) * FK, y: FO.y + (FU.y * d + FN.y * w) * FK });

export interface FluoroDeviceDraw {
  family: LaaoDeviceType;
  sizeMm: number;
  stage: DeployStage;
  positionMm: number;
}

export function LaaFluoroView({
  m,
  sheathTipMm,
  pigtail,
  family,
  device,
  opacified,
  aids,
  markerToWallMm,
  wallMm,
}: {
  /** the 135° measurement, which the RAO caudal view shows */
  m: AngleMeasurement;
  sheathTipMm: number;
  pigtail: "none" | "in-lobe" | "removed";
  family: LaaoDeviceType;
  device: FluoroDeviceDraw | null;
  opacified: boolean;
  aids: boolean;
  markerToWallMm: number;
  /** the wall the marker rule judges (appendageWallMm); defaults to this plane's depth */
  wallMm?: number;
}) {
  const depth = wallMm ?? m.depthMm;
  const top: string[] = [];
  const bot: string[] = [];
  for (let i = 0; i <= 24; i++) {
    const d = (depth * i) / 24;
    const h = d <= 10 ? m.ostiumMm / 2 + (m.landingZoneMm / 2 - m.ostiumMm / 2) * (d / 10) : (m.landingZoneMm / 2) * (1 - 0.35 * Math.min(1, (d - 10) / Math.max(1, depth - 10)));
    const a = fpt(d, h);
    const b = fpt(d, -h);
    top.push(`${i === 0 ? "M" : "L"} ${a.x.toFixed(1)} ${a.y.toFixed(1)}`);
    bot.unshift(`L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`);
  }
  const tipEnd = fpt(depth + 3, 0);
  const lastB = fpt(depth, -(m.landingZoneMm / 2) * 0.65);
  const outline = `${top.join(" ")} Q ${tipEnd.x.toFixed(1)} ${tipEnd.y.toFixed(1)} ${lastB.x.toFixed(1)} ${lastB.y.toFixed(1)} ${bot.join(" ")} Z`;

  // the sheath comes from the septum (lower left) along the appendage axis
  const septum = { x: 40, y: 250 };
  const tip = fpt(sheathTipMm);
  const bandAt = (d: number) => {
    const c = fpt(d);
    const a = { x: c.x + FN.x * 5, y: c.y + FN.y * 5 };
    const b = { x: c.x - FN.x * 5, y: c.y - FN.y * 5 };
    return { a, b };
  };
  const bands = family === "plug" ? plugSheathBands(sheathTipMm) : [];
  const curl = fpt(Math.max(0, depth - 4), 0);

  let deviceEl: ReactNode = null;
  if (device && device.stage !== "sheath" && device.stage !== "removed") {
    // a loaded plug sits in the sheath: its distal end at the distal marker, its proximal end at its band
    const pos = device.family === "plug" && device.stage === "loaded" ? plugPositionFromSheath(sheathTipMm, device.sizeMm) : device.positionMm;
    if (device.family === "plug") {
      const len = deviceLengthMm("plug", device.sizeMm);
      const open = device.stage === "deployed" || device.stage === "released";
      const hw = open ? Math.min(device.sizeMm, m.ostiumMm) / 2 : 1.6;
      const p0a = fpt(pos, hw);
      const p0b = fpt(pos, -hw);
      const p1a = fpt(pos + len * 0.55, hw);
      const p1b = fpt(pos + len * 0.55, -hw);
      const t = fpt(pos + len, 0);
      deviceEl = (
        <path
          d={`M ${p0a.x} ${p0a.y} L ${p0b.x} ${p0b.y} L ${p1b.x} ${p1b.y} Q ${t.x} ${t.y} ${p1a.x} ${p1a.y} Z`}
          fill="#0b0d10"
          fillOpacity="0.55"
          stroke="#1c2026"
          strokeWidth="1.4"
          data-device="plug"
          data-device-from={pos.toFixed(1)}
          data-device-to={(pos + len).toFixed(1)}
        />
      );
    } else if (device.stage === "loaded") {
      deviceEl = null;
    } else if (device.stage === "ball") {
      const c = fpt(pos + 3);
      deviceEl = <circle cx={c.x} cy={c.y} r={3.2 * FK} fill="#0b0d10" fillOpacity="0.55" stroke="#1c2026" data-device="ball" />;
    } else {
      const lhw = Math.min(device.sizeMm, m.landingZoneMm) / 2;
      const a0 = fpt(pos, lhw);
      const a1 = fpt(pos + LOBE_LENGTH_MM, lhw);
      const b1 = fpt(pos + LOBE_LENGTH_MM, -lhw);
      const b0 = fpt(pos, -lhw);
      const discHw = device.stage === "lobe-open" ? 1.5 : (device.sizeMm + DISC_MARGIN_MM) / 2;
      const da = fpt(-1, discHw);
      const db = fpt(-1, -discHw);
      deviceEl = (
        <g data-device={device.stage === "lobe-open" ? "lobe-open" : "lobe-disc"}>
          <path d={`M ${a0.x} ${a0.y} L ${a1.x} ${a1.y} L ${b1.x} ${b1.y} L ${b0.x} ${b0.y} Z`} fill="#0b0d10" fillOpacity="0.55" stroke="#1c2026" />
          <line x1={da.x} y1={da.y} x2={db.x} y2={db.y} stroke="#0b0d10" strokeWidth="3" />
        </g>
      );
    }
  }

  return (
    <svg viewBox="0 0 360 280" className="w-full block" role="img" aria-label="RAO caudal fluoroscopy: appendage, access sheath and marker bands">
      <rect width="360" height="280" fill="#9aa0a6" />
      {opacified && <path d={outline} fill="#2e3237" fillOpacity="0.75" stroke="#24282c" strokeWidth="1" data-appendage="opacified" />}
      {/* sheath */}
      <path d={`M ${septum.x} ${septum.y} Q 90 ${FO.y + 30} ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}`} stroke="#3a3f45" strokeWidth="5" fill="none" strokeLinecap="round" data-sheath-tip={sheathTipMm.toFixed(1)} />
      {/* the distal marker band, 5 mm behind the tip, and the plug sheath's three proximal bands */}
      {(() => {
        const b = bandAt(sheathTipMm - SHEATH_MARKER_BEHIND_TIP_MM);
        return <line x1={b.a.x} y1={b.a.y} x2={b.b.x} y2={b.b.y} stroke="#0d0f12" strokeWidth="2.6" data-marker="distal" />;
      })()}
      {bands.map((bd) => {
        const b = bandAt(bd.atMm);
        return <line key={bd.sizeMm} x1={b.a.x} y1={b.a.y} x2={b.b.x} y2={b.b.y} stroke="#0d0f12" strokeWidth="1.8" data-marker={`band-${bd.sizeMm}`} />;
      })}
      {/* the marker pigtail in the deepest lobe */}
      {pigtail === "in-lobe" && (
        <g data-pigtail="in-lobe">
          <path d={`M ${tip.x} ${tip.y} L ${curl.x} ${curl.y}`} stroke="#22262b" strokeWidth="1.6" />
          <circle cx={curl.x} cy={curl.y} r={2.6 * FK} stroke="#22262b" strokeWidth="1.6" fill="none" />
        </g>
      )}
      {deviceEl}
      {aids && (
        <g fontFamily="monospace" fontSize="10" fill="#0b0d10">
          <text x="10" y="18">{`Guided aid: distal marker to wall ${markerToWallMm.toFixed(0)} mm`}</text>
          <text x="10" y="32">{`Sheath tip ${sheathTipMm >= 0 ? `${sheathTipMm.toFixed(0)} mm inside` : `${Math.abs(sheathTipMm).toFixed(0)} mm before`} the ostium`}</text>
        </g>
      )}
      <text x="350" y="272" fontSize="9" fill="#1d2126" textAnchor="end">
        RAO caudal fluoroscopy
      </text>
    </svg>
  );
}
