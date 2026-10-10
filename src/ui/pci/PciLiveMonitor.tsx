import { useEffect, useRef, useState } from "react";
import { XrayRenderer } from "../../render/xray/XrayRenderer";
import { STORE_PX } from "../../state/useSeriesStore";
import { angleText, mmss, SQUARE } from "../lab/useLab";
import type { PciLabSession } from "./PciLabSession";
import { usePciSession } from "./consoles/registry";
import { useGuidePhysics } from "./useGuidePhysics";
import { classifyGuide } from "../../simulation/pci/guide";

// ---------------------------------------------------------------------------
// The PCI lab's live monitor (pci-lab-shell-session). It shows only what the
// beam acquires: a frame is exposed while the fluoroscopy or the cine pedal is
// held (the session says which), and the last image stays on the screen when
// the pedals are up (last-image hold). The scene is the session's
// (PciLabSession.sceneFor: the earlier lab's assembly on lab time), rendered
// by the physical X-ray renderer; each exposed frame books its dose and is
// read back once at the stored size (STORE_PX) for the cine run or the
// fluoroscopy loop. Overlays as on a real lab monitor: projection, field,
// acquisition mode and rate, last-image hold, fluoroscopy time, cumulative
// air kerma and the air kerma rate while the beam is on. No coaching.
//
// pci-guide-engagement: the monitor owns the session's guide mechanics for as
// long as the lab is on screen (useGuidePhysics: the analytic engagement model,
// with the registered rod physics started and benched when the catheter
// mechanics setting allows it), and in development exposes window.__pciGuide
// (the guide's state, the mechanics in use and the classifier's reading) for
// the browser checks, which run with the pane hidden.
// ---------------------------------------------------------------------------

/** A pulse or frame rate as the monitor writes it (3.75 and 7.5 keep their decimals). */
const rateText = (r: number) => String(r);

const DEV = !!(import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;

interface Props {
  session: PciLabSession;
  /** extra content over the image (captions) */
  children?: React.ReactNode;
}

export default function PciLiveMonitor({ session, children }: Props) {
  usePciSession(session);
  const guide = useGuidePhysics(session);

  useEffect(() => {
    if (!DEV || !guide) return;
    const w = window as unknown as Record<string, unknown>;
    w.__pciGuide = () => ({
      mode: guide.mode,
      reason: guide.reason,
      bench: guide.bench,
      guide: session.st.guide,
      classifier: session.st.guide.engaged ? null : classifyGuide(session.model, session.st.guide).kind,
      trace: session.engine.vitals().tipState,
      wire: { route: session.st.route, tipMm: session.st.tipMm, aim: session.st.wire.aim ?? null },
      command: (h: { mm?: number; rad?: number }) => guide.command(h),
    });
    return () => {
      if (w.__pciGuide) delete w.__pciGuide;
    };
  }, [guide, session]);
  const cv = useRef<HTMLCanvasElement>(null);
  const [glOk, setGlOk] = useState(true);

  useEffect(() => {
    const canvas = cv.current;
    if (!canvas) return;
    // device-pixel canvas: the renderer picks its own size (at most 1024, multiple of 32), presents
    // with a Lanczos resample and falls back to 768 when frames run over budget
    const devicePx = () => Math.max(256, Math.min(2048, Math.round((canvas.clientWidth || 640) * (window.devicePixelRatio || 1))));
    let px = devicePx();
    canvas.width = px;
    canvas.height = px;
    const xr = XrayRenderer.create(canvas);
    if (!xr) {
      setGlOk(false);
      return;
    }
    xr.fitCanvas(px);
    // the stored-matrix grabber: the acquired image at STORE_PX, grey 8-bit (cine runs, the fluoroscopy loop)
    const grab = document.createElement("canvas");
    grab.width = STORE_PX;
    grab.height = STORE_PX;
    const gctx = grab.getContext("2d", { willReadFrequently: true });
    const grabFrame = (): Uint8Array | null => {
      if (!gctx) return null;
      gctx.drawImage(canvas, 0, 0, STORE_PX, STORE_PX);
      const img = gctx.getImageData(0, 0, STORE_PX, STORE_PX).data;
      const out = new Uint8Array(STORE_PX * STORE_PX);
      for (let i = 0, j = 0; i < out.length; i++, j += 4) out[i] = img[j];
      return out;
    };
    let raf = 0;
    let last = 0;
    let frame = 0;
    /** expose and draw one frame; `bt` draws a run at that time (the development hook's standard plan) */
    const draw = (mode: "fluoro" | "cine", bt?: number) => {
      const want = devicePx();
      if (want !== px) {
        px = want;
        canvas.width = px;
        canvas.height = px;
        xr.fitCanvas(px);
      }
      frame++;
      const res = session.sceneFor(mode, { frame, bt }, xr);
      xr.render(res.scene, res.params);
      session.expose(res);
      session.onExposedFrame(grabFrame(), mode);
    };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const mode = session.beamMode();
      if (!mode) return;
      // acquire at the rate in force (the cine frame rate or the fluoroscopy pulse rate), as the
      // diagnostic lab does, so a stored run's frames / fps is its real duration; 1 ms of slack
      // keeps a 60 Hz animation frame from falling just short of the interval
      const im = session.imagingControls();
      const fps = mode === "cine" ? im.cineRate : im.pulseRate;
      const now = performance.now();
      if (now - last < 1000 / fps - 1) return;
      last = now;
      draw(mode);
    };
    raf = requestAnimationFrame(loop);
    // development only: render one frame on demand (tests run with the page hidden, where rAF is paused)
    if (DEV) {
      const w = window as unknown as Record<string, unknown>;
      w.__pciDraw = (bt?: number) => {
        session.noteHookDraw();
        draw(bt !== undefined ? "cine" : "fluoro", bt);
      };
      w.__pciLab = () => session.lab;
    }
    return () => {
      cancelAnimationFrame(raf);
      xr.dispose();
    };
  }, [session]);

  const cArm = session.cArmAngles();
  const im = session.imagingControls();
  const beam = session.beamMode();
  const dose = session.lab.dose;
  const totals = dose.totals;
  const live = dose.live;
  const lih = !beam && session.lastImageAt !== null;
  const level = im.fluoroLevel;

  return (
    <div className="relative h-full w-full bg-black" aria-label="Live monitor">
      <div className="absolute inset-0 flex items-center justify-center [container-type:size]">
        <div className="relative" style={SQUARE}>
          <canvas ref={cv} className="block h-full w-full" aria-label="Live X-ray image" />
          {!glOk && <div className="absolute inset-0 grid place-items-center text-sm text-ink-faint">WebGL2 is needed for the X-ray renderer.</div>}
        </div>
      </div>
      <div className="pointer-events-none absolute left-2 top-1.5 font-mono text-[12px] leading-[16px] text-[#c9ced6] [text-shadow:1px_1px_0_#000]" data-testid="pci-live-overlay">
        <div>{angleText(cArm)}</div>
        <div className="text-[#9aa1ab]">Field {im.field} cm</div>
      </div>
      <div className="pointer-events-none absolute right-2 top-1.5 text-right font-mono text-[12px] leading-[16px] text-[#c9ced6] [text-shadow:1px_1px_0_#000]">
        {beam === "cine" ? (
          <div>
            Cine {rateText(im.cineRate)} f/s{session.run ? ` · run ${session.run.start.number}` : ""}
          </div>
        ) : beam === "fluoro" ? (
          <div>
            Fluoro {rateText(im.pulseRate)} p/s{level !== "normal" ? ` · ${level}` : ""}
          </div>
        ) : (
          <div className="text-[#9aa1ab]">{im.xrayEnabled ? "Beam off" : "X-ray disabled"}</div>
        )}
        {lih && <div className="text-[#e3e6ea]">LIH</div>}
      </div>
      <div className="pointer-events-none absolute bottom-1.5 left-2 font-mono text-[12px] leading-[16px] text-[#c9ced6] [text-shadow:1px_1px_0_#000]">
        <div>Fluoro {mmss(totals.fluoroTimeS)}</div>
        <div>Ka,r {totals.karMGy.total < 100 ? totals.karMGy.total.toFixed(1) : Math.round(totals.karMGy.total)} mGy</div>
      </div>
      <div className="pointer-events-none absolute bottom-1.5 right-2 text-right font-mono text-[12px] leading-[16px] text-[#c9ced6] [text-shadow:1px_1px_0_#000]">
        {beam && live.beamOn && <div>{live.akrMGyMin.toFixed(1)} mGy/min</div>}
        {live.limit !== "none" && beam && <div className="text-[#e3e6ea]">Dose-rate limit</div>}
      </div>
      {children}
    </div>
  );
}
