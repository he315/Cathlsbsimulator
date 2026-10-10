import { useEffect, useRef, useState } from "react";
import { renderBMode, needleTip, MP_NEEDLE, type BModeBuffer } from "../../simulation/access/ultrasound";
import { tubeAt } from "../../simulation/access/site";
import { SHEATHS, type SheathId } from "../../simulation/access/closure";
import { useProcedureStore } from "../../state/useProcedureStore";
import type { CaseSession } from "../../simulation/session/caseSession";
import { SHEATH_LENGTHS_CM, type SheathLengthCm, type UpsizeStage } from "../../simulation/access/upsizing";
import { SiteSelector } from "./panels/AccessPicker";
import { SheathPrep } from "./panels/TablePanel";
import { planningOf } from "../../simulation/session/modules/planning";
import { routePlanOf } from "../../simulation/session/modules/routePlan";
import { ARM_LABEL } from "../../simulation/session/caseSession";
import { ARM_POSITIONS } from "../../simulation/access/site";

// ===========================================================================
// Ultrasound-guided puncture: the B-mode image, the probe and needle on the
// skin, the needle hub, the wire and the sheath.
//
// The image is synthesised every frame (ultrasound.ts renderBMode): the artery
// pulses on the patient's clock, veins collapse under probe pressure, the
// needle shows as a bright dot (short axis) or line (long axis), the wall
// tents before it gives. Wheel or drag on the image advances and withdraws
// the needle; the skin map positions the probe and the needle entry.
//
// Several access sites (access-multi-site): the view shows the active site,
// with a site selector when the case has more than one. The probe is on the
// skin at the planned site from the start; at an added site it is placed
// with "Probe on the skin", and until then the image is blank and a puncture
// is by palpation. Each frame drawn with the probe on reports the image to
// the session (noteProbeImage), which keeps when the target vessel was first
// in view: the ultrasound guidance a crossover puncture is scored on.
//
// The femoral puncture (access-femoral-puncture): the image shows what the
// site holds (a calcified anterior wall as a bright arc with a shadow
// beneath, the branches of the external iliac above the ligament); the hub
// shows no blood from a plugged needle until 'Take out and flush' has been
// used; the 0.018 inch micropuncture wire can be pulled back after the
// needle is out, to be redirected under fluoroscopy. Where the wire runs is
// not shown here: it is seen on fluoroscopy.
//
// Upsizing (access-femoral-upsizing-angiogram): the wire for the needle is
// chosen before it is fed (the micropuncture wire or a hydrophilic one); the
// skin is nicked and the track spread; at the groin the micropuncture dilator,
// the inner dilator and wire out, the 0.035 inch wire and the dilator off are
// separate steps, and the troubleshooting fixes are always offered, so the
// panel never says which problem is present. The sheath is chosen by size
// and, at the groin, length (10, 25 or 45 cm), and its side arm is prepared
// here as on the table (SheathPrep). A sheath can be taken out and the site
// pressed at any time before a catheter goes in (a sheath without an arterial
// waveform is changed this way).
//
// A recent anchor-and-collagen-plug closure device in the groin on view (the
// pre-procedure record, proc-chart-planted-problems) is drawn on the image as
// it would be seen, with no label: the operator has to recognise it.
//
// The route plan (access-route-decision, modules/routePlan.ts): calipers on
// the image measure a vessel (two clicks on the image, the distance in mm from
// the probe's footprint and depth); at the wrist the measurement is the radial
// diameter the access plan records. The sheath picker starts at the lab's
// sheath nearest the plan's. 'Look at and feel the site' inspects and palpates
// the active site during the case: a haematoma is found only this way until it
// is large enough to see.
//
// The radial sequence (access-radial-sequence): at the wrist the arm is laid
// supinated, across the body or neutral, and the wrist extended or not, before
// the puncture (a patient who cannot supinate refuses the first two). The
// local anaesthetic given at the wrist (the radial orders section) shows on the
// image as a hypoechoic bleb that flattens the artery for a minute or two when
// it is large; the artery's tone narrows it on the image and slows the flash
// in the hub, which is described, never named. The needle can be taken through
// both walls in one stroke (the flash then comes on slow withdrawal), and its
// bevel turned towards the lumen when the wire stops at the tip.
// ===========================================================================

/** What is in the groin at each upsizing stage, as the operator knows it. */
const STAGE_TEXT: Record<UpsizeStage, string> = {
  needle: "",
  "micro-wire": "The 0.018 inch wire alone, needle out.",
  "micro-dilator": "Micropuncture dilator over the 0.018 inch wire.",
  "outer-dilator": "Outer dilator in the artery; wire and inner dilator out.",
  "outer-dilator-035": "0.035 inch wire through the outer dilator.",
  "wire-035": "The 0.035 inch wire alone.",
  sheath: "",
};

/** image density: 7 px/mm, fewer for deep images so a frame stays near 50,000 pixels (a few ms) */
const pxPerMm = (depthMm: number) => Math.min(7, Math.sqrt(50000 / (MP_NEEDLE.footprintMm * depthMm)));

interface Props {
  session: CaseSession;
  /** guided mode: show the palpated pulse line and landmark labels on the skin map */
  guided: boolean;
}

export default function UltrasoundView({ session, guided }: Props) {
  const act = useProcedureStore((s) => s.act);
  useProcedureStore((s) => s.version);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufRef = useRef<BModeBuffer | null>(null);
  const [angle, setAngle] = useState(session.site.typicalAngleDeg);
  const [yaw, setYaw] = useState(0);
  // the sheath the access plan chose, as near as the lab's catalogue has it
  const [sheath, setSheath] = useState<SheathId>(() => routePlanOf(session)?.actions.plannedSheath().id ?? "6");
  const [lengthCm, setLengthCm] = useState<SheathLengthCm>(() => routePlanOf(session)?.actions.plannedSheath().lengthCm ?? 10);
  // calipers: points on the image as fractions of its width and height
  const [caliper, setCaliper] = useState<{ on: boolean; pts: { fx: number; fy: number }[]; mm: number | null }>({ on: false, pts: [], mm: null });
  const drag = useRef<{ on: boolean; y: number }>({ on: false, y: 0 });
  const pm = session.pm;
  const probe = pm.probe;
  const n = pm.st.needle;
  const probeOn = session.activeSite.probeOn;
  const siteId = session.activeSiteId;

  // a new site: the needle angle starts from that site's typical angle
  useEffect(() => {
    const s = useProcedureStore.getState().session;
    if (!s) return;
    setAngle(s.site.typicalAngleDeg);
    setYaw(0);
  }, [siteId]);

  // the picker follows the access plan while the plan can still change and no sheath is in
  const plannedNow = routePlanOf(session)?.actions.plannedSheath();
  const plannedKey = plannedNow ? `${plannedNow.id}:${plannedNow.lengthCm}` : "";
  useEffect(() => {
    const rp = routePlanOf(session);
    if (!rp || rp.state.locked || session.sheath) return;
    const p = rp.actions.plannedSheath();
    setSheath(p.id);
    setLengthCm(p.lengthCm);
  }, [plannedKey]);

  // render loop: the B-mode at up to 30 frames/s
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = 0;
    let frame = 0;
    const draw = () => {
      const s = useProcedureStore.getState().session;
      if (!s) return;
      const k = pxPerMm(s.pm.probe.depthMm);
      const W = Math.round(MP_NEEDLE.footprintMm * k);
      const H = Math.round(s.pm.probe.depthMm * k);
      if (!bufRef.current || bufRef.current.width !== W || bufRef.current.height !== H) {
        bufRef.current = { width: W, height: H, data: new Uint8ClampedArray(W * H * 4) };
        cv.width = W;
        cv.height = H;
      }
      if (!s.activeSite.probeOn) {
        // the probe is off the skin: no image
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, H);
        return;
      }
      s.pm.phase = s.patient.clockState().phase;
      // the blebs of local anaesthetic fade on the session clock
      s.pm.nowS = s.tS;
      // a recent closure device in this groin (the planning record) is drawn where it lies, unlabelled
      renderBMode(s.pm, bufRef.current, { frame: frame++, priorPlug: planningOf(s)?.actions.priorPlug() ?? null });
      ctx.putImageData(new ImageData(bufRef.current.data, W, H), 0, 0);
      // the image as drawn: the session keeps when the target vessel was first in view
      s.noteProbeImage();
    };
    const loop = (t: number) => {
      if (t - last > 33) {
        last = t;
        draw();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    if ((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) (window as unknown as { __usDraw?: () => void }).__usDraw = draw;
    return () => cancelAnimationFrame(raf);
  }, []);

  // the calipers come off with the probe
  useEffect(() => {
    if (!probeOn) setCaliper((c) => (c.on || c.pts.length ? { on: false, pts: [], mm: null } : c));
  }, [probeOn]);

  // keyboard: W/S advance and withdraw the needle (not while the calipers are on: the image is being measured)
  const caliperOn = caliper.on;
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (caliperOn) return;
      const k = e.key.toLowerCase();
      if (k === "w") act((s) => s.advanceNeedle(0.3));
      if (k === "s") act((s) => s.advanceNeedle(-0.3));
    };
    window.addEventListener("keydown", dn);
    return () => window.removeEventListener("keydown", dn);
  }, [act, caliperOn]);

  const flash = session.flashback();
  const wrist = session.site.kind === "radial";
  const arm = session.site.arm ?? null;
  const beat = session.patient.clockState().phase < 0.25;
  const hubColour = flash.kind === "arterial" ? (beat ? "#E5534B" : "#b33a33") : flash.kind === "venous" ? "#5a1414" : flash.kind === "sluggish" ? "#7a2620" : "transparent";
  const tip = n ? needleTip(n) : null;
  const wire = pm.st.wire;
  const busy = session.busy;
  const groin = session.site.kind === "femoral";
  const up = session.upsizing;
  const needleIn = !!n && n.inserted > 0 && !pm.st.needleRemoved;
  const sheathIn = !!session.sheath;
  const catheterIn = !!session.catheter?.inBody;

  /** A caliper point at a click on the image; the second point measures the distance (mm) between the two. */
  const caliperAt = (clientX: number, clientY: number) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    const pt = { fx: Math.min(1, Math.max(0, (clientX - r.left) / r.width)), fy: Math.min(1, Math.max(0, (clientY - r.top) / r.height)) };
    const pts = caliper.pts.length >= 2 ? [pt] : [...caliper.pts, pt];
    let mm: number | null = null;
    if (pts.length === 2) {
      const dx = (pts[1].fx - pts[0].fx) * MP_NEEDLE.footprintMm;
      const dy = (pts[1].fy - pts[0].fy) * probe.depthMm;
      mm = Math.round(Math.hypot(dx, dy) * 10) / 10;
      // at the wrist the measurement is the radial artery's diameter for the access plan
      if (session.site.kind !== "femoral") {
        const side = session.site.side === "left" ? "left" : "right";
        act((s) => routePlanOf(s)?.actions.measureRadial(side, mm!));
      }
    }
    setCaliper({ on: true, pts, mm });
  };

  const placeAt = (x: number, y: number) => {
    act((s) => s.placeNeedle({ entryX: x, entryY: y, angleDeg: angle, yawDeg: yaw }));
  };

  return (
    <div className="panel h-full flex flex-col overflow-hidden">
      <div className="panel-head">
        <span>Ultrasound, {session.site.side} {session.access === "femoral" ? "groin" : "wrist"}</span>
        <span className="flex items-center gap-2 normal-case tracking-normal text-ink-faint text-[12px]">
          <SiteSelector />
          {probeOn ? `linear probe · ${probe.orient === "short" ? "short axis" : "long axis"} · depth ${(probe.depthMm / 10).toFixed(1)} cm` : "probe off the skin"}
        </span>
      </div>
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[1fr_17rem] gap-3 p-3 overflow-y-auto">
        <div className="flex flex-col gap-3 min-w-0">
          {/* B-mode */}
          <div
            className="relative bg-black rounded-md overflow-hidden select-none touch-none cursor-ns-resize"
            onWheel={(e) => {
              if (!caliper.on) act((s) => s.advanceNeedle(e.deltaY > 0 ? 0.25 : -0.25));
            }}
            onPointerDown={(e) => {
              if (caliper.on) {
                caliperAt(e.clientX, e.clientY);
                return;
              }
              drag.current = { on: true, y: e.clientY };
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            }}
            onPointerUp={() => (drag.current.on = false)}
            onPointerMove={(e) => {
              if (!drag.current.on) return;
              const dy = e.clientY - drag.current.y;
              drag.current.y = e.clientY;
              if (dy !== 0) act((s) => s.advanceNeedle(dy * 0.06));
            }}
          >
            <canvas ref={canvasRef} className="block w-full" style={{ imageRendering: "auto" }} />
            {caliper.on && caliper.pts.length > 0 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {caliper.pts.length === 2 && <line x1={caliper.pts[0].fx * 100} y1={caliper.pts[0].fy * 100} x2={caliper.pts[1].fx * 100} y2={caliper.pts[1].fy * 100} stroke="#E9B95A" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />}
                {caliper.pts.map((p, i) => (
                  <path key={i} d={`M ${p.fx * 100 - 1.2} ${p.fy * 100} H ${p.fx * 100 + 1.2} M ${p.fx * 100} ${p.fy * 100 - 1.2} V ${p.fy * 100 + 1.2}`} stroke="#E9B95A" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                ))}
              </svg>
            )}
            {!probeOn && <div className="absolute inset-0 grid place-items-center text-[13px] text-ink-faint pointer-events-none">The probe is off the skin.</div>}
            {/* depth scale, orientation marker */}
            <div className="absolute top-1 left-2 w-2 h-2 rounded-full bg-ink-soft" title="Probe orientation marker" />
            <div className="absolute right-1 top-0 bottom-0 flex flex-col justify-between py-1 text-[12px] text-ink-faint font-mono pointer-events-none">
              {Array.from({ length: Math.floor(probe.depthMm / 5) + 1 }).map((_, i) => (
                <span key={i}>{i % 2 === 0 ? `${(i * 0.5).toFixed(1)}` : "·"}</span>
              ))}
            </div>
          </div>
          {/* calipers */}
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-soft">
            <button className={`btn ${caliper.on ? "btn-accent" : "btn-ghost"}`} aria-pressed={caliper.on} disabled={!probeOn} onClick={() => setCaliper((c) => ({ on: !c.on, pts: [], mm: null }))}>
              {caliper.on ? "Calipers on" : "Calipers"}
            </button>
            {caliper.on && <span>{caliper.mm !== null ? `${caliper.mm.toFixed(1)} mm` : caliper.pts.length === 1 ? "Click the opposite wall." : "Click one wall of the vessel, then the opposite wall."}</span>}
          </div>
          {/* probe controls */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[12px]">
            <button className={`btn ${probeOn ? "" : "btn-accent"}`} onClick={() => act((s) => s.setProbeOn(!s.activeSite.probeOn))}>
              {probeOn ? "Lift the probe" : "Probe on the skin"}
            </button>
            <div className="seg">
              <button className={`seg-btn ${probe.orient === "short" ? "seg-btn-active" : ""}`} onClick={() => act((s) => (s.pm.probe.orient = "short"))}>
                Short axis
              </button>
              <button className={`seg-btn ${probe.orient === "long" ? "seg-btn-active" : ""}`} onClick={() => act((s) => (s.pm.probe.orient = "long"))}>
                Long axis
              </button>
            </div>
            <label className="flex items-center gap-2 text-ink-soft">
              Pressure
              <input type="range" min={0} max={1} step={0.02} value={probe.pressure} onChange={(e) => act((s) => (s.pm.probe.pressure = +e.target.value))} className="flex-1" />
            </label>
            <label className="flex items-center gap-2 text-ink-soft">
              Depth
              <input type="range" min={10} max={80} step={1} value={probe.depthMm} onChange={(e) => act((s) => (s.pm.probe.depthMm = +e.target.value))} className="flex-1" />
            </label>
            <label className="flex items-center gap-2 text-ink-soft">
              Gain
              <input type="range" min={0.5} max={1.8} step={0.05} value={probe.gain} onChange={(e) => act((s) => (s.pm.probe.gain = +e.target.value))} className="flex-1" />
            </label>
          </div>
          {wrist && arm && (
            <div className="flex flex-wrap items-center gap-2 text-[12px]" data-radial-arm>
              <span className="text-ink-soft">Arm</span>
              <div className="seg">
                {ARM_POSITIONS.map((p) => (
                  <button key={p} className={`seg-btn ${arm.position === p ? "seg-btn-active" : ""}`} disabled={busy || pm.st.passes > 0 || sheathIn} onClick={() => act((s) => s.setArm(p))} title={ARM_LABEL[p]}>
                    {p === "supinated" ? "Supinated" : p === "across-body" ? "Across the body" : "Neutral"}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-1.5 text-ink-soft">
                <input type="checkbox" checked={arm.wristExtended} disabled={sheathIn} onChange={(e) => act((s) => s.setWristExtended(e.target.checked))} />
                Wrist extended over a roll
              </label>
            </div>
          )}
          <SkinMap session={session} guided={guided} onPlace={placeAt} />
        </div>

        {/* needle, wire, sheath */}
        <div className="flex flex-col gap-3">
          <div className="rounded-md border border-line p-3 flex flex-col gap-2">
            <div className="text-[13px] font-semibold text-ink">Needle{groin ? ", 21 gauge" : ""}</div>
            <label className="flex items-center gap-2 text-[12px] text-ink-soft">
              Angle {angle}°
              <input
                type="range"
                min={15}
                max={75}
                step={1}
                value={angle}
                onChange={(e) => {
                  setAngle(+e.target.value);
                  if (n) act((s) => s.redirectNeedle(+e.target.value, yaw));
                }}
                className="flex-1"
              />
            </label>
            <label className="flex items-center gap-2 text-[12px] text-ink-soft">
              Aim {yaw > 0 ? `${yaw}° lateral` : yaw < 0 ? `${-yaw}° medial` : "straight"}
              <input
                type="range"
                min={-20}
                max={20}
                step={1}
                value={yaw}
                onChange={(e) => {
                  setYaw(+e.target.value);
                  if (n) act((s) => s.redirectNeedle(angle, +e.target.value));
                }}
                className="flex-1"
              />
            </label>
            <div className="flex items-center gap-3">
              <Hub colour={hubColour} />
              <div className="text-[12px] text-ink-soft leading-snug">
                {!n
                  ? "Click the skin map to place the needle."
                  : flash.kind === "arterial"
                    ? flash.slow
                      ? "Bright, pulsatile blood, coming slowly."
                      : "Bright, pulsatile blood in the hub."
                    : flash.kind === "venous"
                      ? "Dark blood, not pulsatile."
                      : flash.kind === "sluggish"
                        ? "A little dark blood, sluggish."
                        : n.inserted > 0
                          ? "No blood in the hub."
                          : "Needle on the skin."}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button className="btn" disabled={!n || busy} onClick={() => act((s) => s.advanceNeedle(-1))}>
                Back 1 mm
              </button>
              <button className="btn" disabled={!n || busy} onClick={() => act((s) => s.advanceNeedle(0.3))}>
                In 0.3
              </button>
              <button className="btn" disabled={!n || busy} onClick={() => act((s) => s.advanceNeedle(1))}>
                In 1 mm
              </button>
            </div>
            {wrist && (
              <div className="grid grid-cols-2 gap-1">
                <button className="btn" disabled={!needleIn || !!wire || busy} onClick={() => act((s) => s.throughAndThrough())} title="Through-and-through: on through both walls in one movement; then withdraw slowly until blood flows">
                  Through both walls
                </button>
                <button className="btn" disabled={!needleIn || busy || pm.st.bevelTurned === true} onClick={() => act((s) => s.rotateBevel())} title="Turn the bevel slightly so it faces the lumen">
                  Turn the bevel
                </button>
              </div>
            )}
            <button className="btn btn-ghost" disabled={!n || !!wire || pm.st.needleRemoved || busy} onClick={() => act((s) => s.flushNeedle())} title="Take the needle out of the skin and flush it">
              Take out and flush the needle
            </button>
            {guided && tip && <div className="text-[12px] font-mono text-ink-faint">tip {tip.z.toFixed(1)} mm deep · {n!.inserted.toFixed(1)} mm in</div>}
          </div>

          <div className="rounded-md border border-line p-3 flex flex-col gap-2">
            <div className="text-[13px] font-semibold text-ink">{groin ? "Wire, upsizing and sheath" : "Wire and sheath"}</div>
            <div className="seg">
              <button className={`seg-btn ${up.wireKind === "micro-018" ? "seg-btn-active" : ""}`} disabled={!!wire || up.stage !== "needle"} onClick={() => act((s) => s.setAccessWire("micro-018"))} title="The wire to pass through the needle">
                {groin ? "0.018 micropuncture" : "Access wire"}
              </button>
              <button className={`seg-btn ${up.wireKind === "hydrophilic" ? "seg-btn-active" : ""}`} disabled={!!wire || up.stage !== "needle"} onClick={() => act((s) => s.setAccessWire("hydrophilic"))} title="A polymer-jacketed hydrophilic wire">
                Hydrophilic
              </button>
            </div>
            <div className="text-[12px] text-ink-soft">
              {!wire ? "No wire." : wire.state === "intraluminal" ? `Wire in, ${Math.round(wire.beyondMm)} mm beyond the ${pm.st.needleRemoved ? "entry" : "needle"}; ${wire.resistance > 0.5 ? "it will not go further." : "it slides freely."}` : wire.state === "subintimal" ? "The wire is in the wall." : "The wire meets resistance."}
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button className="btn" disabled={!n || sheathIn || (pm.st.needleRemoved && (!groin || !wire || up.stage !== "micro-wire")) || busy} onClick={() => act((s) => s.advanceAccessWire(5))}>
                Feed wire 5 mm
              </button>
              <button className="btn" disabled={!wire || sheathIn || (pm.st.needleRemoved && (!groin || up.stage !== "micro-wire")) || busy} onClick={() => act((s) => s.advanceAccessWire(-5))}>
                Pull wire back
              </button>
            </div>
            <button className="btn" disabled={!wire || wire.state !== "intraluminal" || pm.st.needleRemoved || busy} onClick={() => act((s) => s.removeNeedle())}>
              Remove the needle over the wire
            </button>
            <div className="grid grid-cols-2 gap-1">
              <button className="btn" disabled={busy || (!needleIn && !wire && !sheathIn)} onClick={() => act((s) => s.skinNick())} title="Scalpel: a shallow nick along the artery">
                {up.nick.done ? "Enlarge the nick" : "Nick the skin"}
              </button>
              <button className="btn" disabled={busy || !up.nick.done || sheathIn} onClick={() => act((s) => s.spreadTrack())} title="Spread the subcutaneous track with a haemostat">
                Spread the track
              </button>
            </div>
            {groin && (
              <>
                <div className="text-[12px] text-ink-faint mt-1">Upsizing</div>
                {STAGE_TEXT[up.stage] && <div className="text-[12px] text-ink-soft">{STAGE_TEXT[up.stage]}</div>}
                <button className="btn" disabled={busy || up.stage !== "micro-wire"} onClick={() => act((s) => s.insertMicroDilator())}>
                  Micropuncture dilator over the wire
                </button>
                <button className="btn" disabled={busy || up.stage !== "micro-dilator"} onClick={() => act((s) => s.removeInnerDilator())}>
                  Inner dilator and 0.018 wire out
                </button>
                <div className="grid grid-cols-2 gap-1">
                  <button className="btn" disabled={busy || up.stage !== "outer-dilator"} onClick={() => act((s) => s.insertWire035("standard"))} title="A standard 0.035 inch J wire to the abdominal aorta">
                    0.035 wire
                  </button>
                  <button className="btn" disabled={busy || up.stage !== "outer-dilator"} onClick={() => act((s) => s.insertWire035("stiff"))} title="A stiff (extra-support) 0.035 inch wire to the abdominal aorta">
                    Stiff 0.035 wire
                  </button>
                </div>
                <button className="btn" disabled={busy || up.stage !== "outer-dilator-035"} onClick={() => act((s) => s.removeDilator())}>
                  Dilator off the wire
                </button>
                <details className="rounded-md border border-line px-2 py-1">
                  <summary className="text-[12px] text-ink-soft cursor-pointer">If it will not go</summary>
                  <div className="flex flex-col gap-1 mt-1">
                    <button className="btn btn-ghost justify-start" disabled={busy || up.stage !== "micro-wire"} onClick={() => act((s) => s.useStiffDilator())}>
                      Stiffer micropuncture dilator
                    </button>
                    <button className="btn btn-ghost justify-start" disabled={busy || up.stage !== "micro-wire"} onClick={() => act((s) => s.fixKinkedWire("pull-back-wire"))}>
                      Pull the wire back a little
                    </button>
                    <button className="btn btn-ghost justify-start" disabled={busy || up.stage !== "micro-wire"} onClick={() => act((s) => s.fixKinkedWire("cut-kink"))}>
                      Cut off the kinked part
                    </button>
                    <button className="btn btn-ghost justify-start" disabled={busy || up.stage !== "wire-035"} onClick={() => act((s) => s.exchangeToStiffWire())}>
                      Exchange for a stiff wire through a dilator
                    </button>
                  </div>
                </details>
              </>
            )}
            <div className="flex items-center gap-2 mt-1">
              <select className="field flex-1 min-w-0" value={sheath} onChange={(e) => setSheath(e.target.value as SheathId)} disabled={sheathIn}>
                {(Object.keys(SHEATHS) as SheathId[]).map((id) => (
                  <option key={id} value={id}>
                    {SHEATHS[id].label} ({SHEATHS[id].odMm} mm)
                  </option>
                ))}
              </select>
              {groin && (
                <select className="field w-20" value={lengthCm} onChange={(e) => setLengthCm(+e.target.value as SheathLengthCm)} disabled={sheathIn} title="Sheath length">
                  {SHEATH_LENGTHS_CM.map((l) => (
                    <option key={l} value={l}>
                      {l} cm
                    </option>
                  ))}
                </select>
              )}
              <button className="btn btn-accent" disabled={!pm.st.needleRemoved || sheathIn || busy} onClick={() => act((s) => s.insertSheath(sheath, groin ? lengthCm : undefined))}>
                Insert
              </button>
            </div>
            {sheathIn && <SheathPrep session={session} />}
            {sheathIn && (
              <button className={`btn ${session.activeSite.siteKind === "femoral-vein" ? "" : "btn-danger"}`} disabled={busy || catheterIn} onClick={() => act((s) => s.removeSheathAndCompress())}>
                Take the sheath out and press
              </button>
            )}
            <button className="btn btn-ghost" disabled={!n || sheathIn || busy} onClick={() => act((s) => s.abandonPass())}>
              Withdraw everything and press
            </button>
          </div>
          {routePlanOf(session) && (n || sheathIn) && (
            <div className="rounded-md border border-line p-3 flex flex-col gap-2">
              <div className="text-[13px] font-semibold text-ink">The site</div>
              <button className="btn" disabled={busy} onClick={() => act((s) => routePlanOf(s)?.actions.inspectSite())}>
                Look at and feel the site
              </button>
              {(() => {
                const last = routePlanOf(session)!.state.inspections.filter((i) => i.siteId === session.activeSiteId).pop();
                return last ? <div className="text-[12px] text-ink-soft leading-snug">{last.text}</div> : null;
              })()}
            </div>
          )}
          <p className="text-[12px] text-ink-faint leading-snug">
            Wheel or drag on the image (or W and S) moves the needle. {guided && <>Arterial punctures so far: {pm.st.arterialPunctures}; </>}Skin passes: {pm.st.passes}.
          </p>
        </div>
      </div>
    </div>
  );
}

function Hub({ colour }: { colour: string }) {
  return (
    <svg viewBox="0 0 60 24" width="72" height="28" aria-label="needle hub">
      <rect x="2" y="5" width="34" height="14" rx="3" fill="#20262f" stroke="#2E343C" />
      <rect x="5" y="8" width="28" height="8" rx="2" fill={colour} />
      <rect x="36" y="10" width="22" height="4" fill="#A6ADB8" />
    </svg>
  );
}

/**
 * Top view of the skin: the crease (and the inguinal ligament), the probe footprint (drag to move), the needle
 * entry and direction. Click to place the needle entry.
 */
function SkinMap({ session, guided, onPlace }: { session: CaseSession; guided: boolean; onPlace: (x: number, y: number) => void }) {
  const act = useProcedureStore((s) => s.act);
  const site = session.site;
  const femoral = site.kind === "femoral";
  const xr: [number, number] = femoral ? [-60, 110] : [-25, 90];
  const yr: [number, number] = femoral ? [-40, 40] : [-22, 22];
  const W = 520,
    H = 170;
  const sx = (x: number) => ((x - xr[0]) / (xr[1] - xr[0])) * W;
  const sy = (y: number) => H - ((y - yr[0]) / (yr[1] - yr[0])) * H;
  const ix = (px: number) => xr[0] + (px / W) * (xr[1] - xr[0]);
  const iy = (py: number) => yr[0] + ((H - py) / H) * (yr[1] - yr[0]);
  const p = session.pm.probe;
  const fp = MP_NEEDLE.footprintMm;
  const probeRect = p.orient === "short" ? { x: p.x - 4, y: p.y - fp / 2, w: 8, h: fp } : { x: p.x - fp / 2, y: p.y - 4, w: fp, h: 8 };
  const n = session.pm.st.needle;
  const art = site.tubes.find((t) => t.id === site.arteryId)!;
  const dragging = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const toLocal = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ix(((e.clientX - r.left) / r.width) * W), y: iy(((e.clientY - r.top) / r.height) * H) };
  };
  const lm = site.landmarks;
  return (
    <div className="rounded-md border border-line p-2">
      <div className="flex items-center justify-between text-[12px] text-ink-faint mb-1">
        <span>Skin: drag the probe; click to place the needle entry (the needle points towards the heart)</span>
        <span>{femoral ? "lateral at top" : "thumb side at top"}</span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full select-none touch-none"
        style={{ background: "#1B1F24", borderRadius: 6 }}
        onPointerDown={(e) => {
          const q = toLocal(e);
          const inProbe = session.activeSite.probeOn && q.x >= probeRect.x - 3 && q.x <= probeRect.x + probeRect.w + 3 && q.y >= probeRect.y - 3 && q.y <= probeRect.y + probeRect.h + 3;
          if (inProbe) {
            dragging.current = true;
            (e.target as Element).setPointerCapture?.(e.pointerId);
          } else onPlace(Math.round(q.x * 2) / 2, Math.round(q.y * 2) / 2);
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          const q = toLocal(e);
          act((s) => {
            s.pm.probe.x = Math.max(xr[0], Math.min(xr[1], q.x));
            s.pm.probe.y = Math.max(yr[0], Math.min(yr[1], q.y));
          });
        }}
        onPointerUp={() => (dragging.current = false)}
      >
        {/* crease and ligament */}
        <line x1={sx(0)} y1={0} x2={sx(0)} y2={H} stroke="#5b6573" strokeDasharray="4 4" />
        <text x={sx(0) + 4} y={14} fontSize="12" fill="#858D99">
          {femoral ? "inguinal crease" : "wrist crease"}
        </text>
        {femoral && lm.ligamentX !== undefined && (
          <>
            <line x1={sx(lm.ligamentX)} y1={0} x2={sx(lm.ligamentX)} y2={H} stroke="#5b6573" strokeDasharray="2 5" />
            <text x={sx(lm.ligamentX) + 4} y={14} fontSize="12" fill="#858D99">
              inguinal ligament (palpated)
            </text>
          </>
        )}
        {/* the pulse, as palpated (guided only) */}
        {guided && <line x1={sx(Math.max(art.xFrom, xr[0]))} y1={sy(tubeAt(art, xr[0]).y)} x2={sx(Math.min(art.xTo, xr[1]))} y2={sy(tubeAt(art, xr[1]).y)} stroke="#E5534B" strokeOpacity="0.35" strokeWidth="6" strokeLinecap="round" />}
        {guided && <rect x={sx(lm.targetFrom)} y={0} width={sx(lm.targetTo) - sx(lm.targetFrom)} height={H} fill="#4F8EF7" opacity="0.06" />}
        {/* probe (on the skin only) */}
        {session.activeSite.probeOn && <rect x={sx(probeRect.x)} y={sy(probeRect.y + probeRect.h)} width={sx(probeRect.x + probeRect.w) - sx(probeRect.x)} height={sy(probeRect.y) - sy(probeRect.y + probeRect.h)} fill="#2E343C" stroke="#A6ADB8" rx="3" style={{ cursor: "grab" }} />}
        {/* needle */}
        {n && (
          <>
            <circle cx={sx(n.entryX)} cy={sy(n.entryY)} r="4" fill="#ECEEF1" />
            <line
              x1={sx(n.entryX)}
              y1={sy(n.entryY)}
              x2={sx(n.entryX + 40 * Math.cos((n.angleDeg * Math.PI) / 180) * Math.cos((n.yawDeg * Math.PI) / 180))}
              y2={sy(n.entryY + 40 * Math.cos((n.angleDeg * Math.PI) / 180) * Math.sin((n.yawDeg * Math.PI) / 180))}
              stroke="#ECEEF1"
              strokeWidth="2"
              strokeDasharray={n.inserted > 0 ? undefined : "3 3"}
            />
          </>
        )}
      </svg>
    </div>
  );
}
