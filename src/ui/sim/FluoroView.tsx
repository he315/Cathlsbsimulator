import { useEffect, useRef } from "react";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { STORE_PX } from "../../state/useSeriesStore";
import { catheterPath } from "./helpers";
import { catheterById, catheterFrench, catheterSideHoles } from "../../data/catheters";
import { seatWithSideHoles } from "../../render/xray/contrastTransport";
import { add, scale } from "../../utils/math";
import { XrayRenderer } from "../../render/xray/XrayRenderer";
import { buildCoronaryTree, type CoronaryTree } from "../../render/xray/coronaryTree";
import { buildXrayScene, DEFAULT_HARDWARE, LabImaging, labImaging, treeCentre, type BolusView, type SceneInput, type SceneResult } from "../../render/xray/sceneBuilder";
import type { HardwareSpec } from "../../render/xray/hardware";
import { graftLumenId } from "../../physics/coronaryLumens";
import type { AnatomyCase } from "../../types";
import { injectionSeat } from "../../simulation/contrast";
import { wedgesFor } from "../../simulation/imaging/collimation";
import type { AnatomyModel } from "../../simulation/anatomy";
import type { DiagnosticLabSession } from "./labSession";
import { catheterTether, motionAt, rootDisplacement } from "../../render/xray/heartMotion";
import type { Vec3 } from "../../types";
import { wireInBody } from "../../physics/legacyBridge";
import { toWorld } from "../../simulation/anatomy";
import { routeDrawing } from "./modules/route";
import { leftHeartOf, type LeftHeartControl } from "./modules/leftHeart";
import { iliofemoralExtras } from "../../render/xray/lvGram";
import { MU } from "../../render/xray/thorax";
import { IODINE_MG_PER_ML } from "../../simulation/injection";

// ---------------------------------------------------------------------------
// The live image. It shows only what the beam acquires: an image is exposed
// while the fluoroscopy or the cine pedal is held, at the pulse rate or the
// cine frame rate, and the last image stays on the screen (last-image hold)
// when the pedal is released. Nothing is drawn on top of it here; the live
// monitor adds the real-lab overlays (angles, field, rate, LIH, dose rate).
//
// With a lab session (the cath lab shell) the patient engine's clock drives
// the heart and breathing, the session's exposure loop books dose, and every
// exposed frame is handed to the session at the stored matrix (cine runs, the
// fluoroscopy loop). Without one (the view trainer) the monitor runs a small
// stand-in: its own clock and dose loop, and F / C held as the pedals.
//
// When the session runs the rod mechanics (diag-rod-physics) the catheter is
// the solver's centre line from the skin to the tip and the wire its own
// polyline (legacyCatheter false: not tethered), drawn at the time of the
// physics frame. The solver runs in the frame of the aortic root, whose own
// cardiac motion the image applies to the root and the ostia; while the tip is
// in the root, the same displacement (by height above the valve) is added to the
// device nodes with the legacy path's coupling along the shaft (catheterTether:
// full at the tip, decaying up the shaft), so that a seated tip moves with its
// ostium and the shaft in the descending aorta does not. While the rod
// mechanics runs the legacy catheter is never drawn: with no catheter in the
// patient (the exchange) only the wire left in the aorta is; before the
// solver's first frame the store still holds the analytic catheter's seat, so
// that is drawn until the first frame arrives.
//
// From the sheath (diag-route-wire-led-radial) the table follows the route's
// stations: while the route module (src/ui/sim/modules/route.ts) centres the
// field on a limb station, the image is panned there and the limb anatomy the
// thorax model does not include is added (src/simulation/access/route.ts
// limbExtras), and a puff through the sheath's side arm or the catheter is
// drawn along the route (puffTubes, forearmAngioTubes). With no route
// station and no puff nothing is added, so every other case draws as before.
//
// Spasm (diag-spasm-states): the patient engine's catheter-tip spasm is drawn
// round the catheter tip in the trunk it is in (SceneInput.spasm, tipSpasmView
// below), where it stays after the catheter is withdrawn until it relaxes, and
// the engine's epicardial dilation (the nitrate) relaxes a spasm lesion
// (SceneInput.epicardialDilation). With no spasm and no nitrate nothing changes.
//
// Filling (diag-injection-run-quality): the scene gets the catheter's French
// size (a 5 Fr catheter is drawn thinner and its planned pushes go through the
// 5 Fr lumen), the seat with the side holes' escape (contrastTransport
// seatWithSideHoles), the native flow of the injected side from the patient
// engine (session.flowScaleFor), and the vessel the classifier put the tip in
// (BolusView.vessel, from the session's bolus), and a non-selective root
// injection or an aortogram fills each ostium's arteries by its share of it
// (BolusView.rootFill). Without a bolus nothing new is passed, so the
// fluoroscopy frames are drawn as before.
//
// The left heart (diag-lv-aorta-task): the scene gets the left heart the
// ventriculogram and aortogram show (SceneInput.lvGram) from the left heart
// module (src/ui/sim/modules/leftHeart.ts sceneSpec: the case's pattern with
// the engine's ischaemia, catheter-induced regurgitation and a stain), and the
// power injector's run as the bolus while it is on the image (leftHeartBolus);
// a pigtail's hand injection in the root is drawn as an aortogram. The
// iliofemoral run pans the table to the pelvis and adds the iliac axes
// (lvGram.ts iliofemoralExtras). lvGram is read only during an LV or root
// injection or a stain, so every other frame is drawn as before.
// ---------------------------------------------------------------------------

/**
 * Hardware in a post-CABG patient (diag-grafts-svg): median sternotomy wires and, after a mammary graft, the clips
 * along its bed, with the ECG electrodes and the table every lab has. The wire count (5 to 7, hardware.ts's typical
 * range) is drawn from the case id. Null for a case without grafts (the default hardware).
 */
export function graftHardware(c: Pick<AnatomyCase, "id" | "grafts">): HardwareSpec | null {
  if (!c.grafts?.length) return null;
  let h = 0;
  for (let i = 0; i < c.id.length; i++) h = (h * 31 + c.id.charCodeAt(i)) >>> 0;
  return { ...DEFAULT_HARDWARE, sternalWires: 5 + (h % 3), graftClips: c.grafts.some((g) => g.conduit === "lima" || g.conduit === "rima") };
}

/**
 * The bolus as the scene draws it in a post-CABG case (diag-grafts-svg): an injection made with the catheter tip in a
 * graft's lumen (the rod mechanics' reading names it) is a graft injection, and a pigtail's root injection in a case
 * with grafts is drawn as an aortogram (the root, the ascending aorta and the graft ostia and stumps). Every other
 * bolus is passed on unchanged.
 */
export function graftBolus<B extends Pick<BolusView, "plume" | "lv">>(b: B, opts: { graftAtTip: string | null | undefined; catheterId: string; hasGrafts: boolean }): B & Pick<BolusView, "graft" | "aortogram"> {
  if (!opts.hasGrafts) return b;
  if (opts.graftAtTip && graftLumenId(opts.graftAtTip)) return { ...b, graft: opts.graftAtTip };
  if (/^PIG/.test(opts.catheterId) && b.plume === "root" && !b.lv) return { ...b, aortogram: true };
  return b;
}

/**
 * The power injector's run as the scene's bolus (diag-lv-aorta-task): a ventriculogram, an aortogram or an
 * iliofemoral run from the left heart module, or null when none is on the image.
 */
export function leftHeartBolus(lh: Pick<LeftHeartControl, "sceneBolus"> | null): (BolusView & { iliac?: boolean }) | null {
  const p = lh?.sceneBolus() ?? null;
  if (!p) return null;
  const base = { filled: [], side: null, t: p.t, injectDur: p.pushS, trace: p.trace, vessel: null };
  if (p.kind === "lv") return { ...base, plume: "reflux", peak: 1, lv: true };
  if (p.kind === "root") return { ...base, plume: "root", peak: 1, aortogram: true, rootFill: true };
  return { ...base, plume: "none", peak: 0, iliac: true };
}

/** A pigtail's hand injection in the root is an aortogram (diag-lv-aorta-task): the root, the aorta and the LV by the AR grade. */
export function pigtailRootBolus<B extends Pick<BolusView, "plume" | "lv" | "aortogram">>(b: B, catheterId: string): B {
  if (/^PIG/.test(catheterId) && b.plume === "root" && !b.lv && !b.aortogram) return { ...b, aortogram: true };
  return b;
}

/** Where the table centres the iliofemoral run: between the femoral heads, aortic frame (MODEL PARAMETER, lvGram.ts ILIOFEMORAL). */
export const ILIAC_FIELD_CENTRE = { x: 0, y: -440, z: -60 };

/** MODEL PARAMETERS of the spasm drawn from the engine: below minSeverity nothing is drawn; a spasm is centred at least ostialMm into the artery and tipBeyondMm beyond the tip. */
export const MP_SPASM_VIEW = { minSeverity: 0.01, ostialMm: 2, tipBeyondMm: 1 };

/**
 * The catheter-tip spasm the image draws (SceneInput.spasm): the side with the larger spasm, centred just
 * beyond the catheter tip while the tip is in that artery (`depthMm` along it), else where the tip last
 * was (`last`, updated in place), else at the ostium. Null when neither side has a spasm.
 */
export function tipSpasmView(
  spasm: { left: number; right: number },
  tip: { location: string; side?: "left" | "right" },
  depthMm: number | null,
  last: { left: number | null; right: number | null },
): SceneInput["spasm"] {
  const inArtery = (tip.location === "ostium" || tip.location === "coronary") && !!tip.side;
  if (inArtery && depthMm !== null && Number.isFinite(depthMm)) last[tip.side!] = Math.max(MP_SPASM_VIEW.ostialMm, depthMm + MP_SPASM_VIEW.tipBeyondMm);
  const side: "left" | "right" = spasm.right >= spasm.left ? "right" : "left";
  const severity = spasm[side];
  if (!(severity >= MP_SPASM_VIEW.minSeverity)) return null;
  return { side, atMm: last[side] ?? MP_SPASM_VIEW.ostialMm, severity };
}

/** The mounted diagnostic lab's syringe (contrast accounting for panels; null when not mounted). */
export const labInjector: { diagnostic: import("../../simulation/injection").Injector | null } = { diagnostic: null };

interface Props {
  session?: DiagnosticLabSession | null;
  className?: string;
}

const DEV = !!(import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;

export default function FluoroView({ session = null, className = "" }: Props) {
  const glRef = useRef<HTMLCanvasElement>(null);
  const holdRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const glCanvas = glRef.current;
    const hold = holdRef.current;
    if (!wrap || !glCanvas || !hold) return;
    const hctx = hold.getContext("2d");
    const xr = XrayRenderer.create(glCanvas);
    const dpr = window.devicePixelRatio || 1;
    let cssSize = 0;
    let raf = 0;
    let lastFrame = 0;
    let frameNo = 0;
    // the iliofemoral run's extras, built once per injection trace (not every frame)
    let iliacMemo: { trace: unknown; model: unknown; extras: ReturnType<typeof iliofemoralExtras> } | null = null;
    let lastHookDraw = -Infinity;
    let everImaged = false;
    // where the catheter tip last was in each artery (tipSpasmView): a spasm stays there after withdrawal
    const spasmAt: { left: number | null; right: number | null } = { left: null, right: null };
    // the engine's spasm read into one object per mount, not one per frame
    const spasmNow = { left: 0, right: 0 };

    // stored-matrix grabber: the acquired image at STORE_PX, grey 8-bit (cine runs, the fluoroscopy loop, last-image hold)
    const grab = document.createElement("canvas");
    grab.width = STORE_PX;
    grab.height = STORE_PX;
    const gctx = grab.getContext("2d", { willReadFrequently: true });
    let haveGrab = false;
    const grabFrame = (): Uint8Array | null => {
      if (!gctx) return null;
      gctx.drawImage(glCanvas, 0, 0, STORE_PX, STORE_PX);
      haveGrab = true;
      if (!session) return null;
      const img = gctx.getImageData(0, 0, STORE_PX, STORE_PX).data;
      const out = new Uint8Array(STORE_PX * STORE_PX);
      for (let i = 0, j = 0; i < out.length; i++, j += 4) out[i] = img[j];
      return out;
    };

    // stand-in for the view trainer: its own clock, dose loop and keyboard pedals
    const standalone = session ? null : new LabImaging({ hr: 72, seed: useSimulatorStore.getState().caseData.id });
    if (standalone) labImaging.diagnostic = standalone;
    const keys = { fluoro: false, cine: false };
    const isField = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";
    };
    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      if (isField(e)) return;
      if (e.code === "KeyF") keys.fluoro = down;
      else if (e.code === "KeyC") keys.cine = down;
      else return;
      e.preventDefault();
    };
    const kd = onKey(true);
    const ku = onKey(false);
    const blur = () => {
      keys.fluoro = false;
      keys.cine = false;
    };
    if (standalone) {
      window.addEventListener("keydown", kd);
      window.addEventListener("keyup", ku);
      window.addEventListener("blur", blur);
    }
    if (session) labInjector.diagnostic = session.injector;

    let tree: CoronaryTree | null = session?.tree ?? null;
    // the graft the tip was in when the current injection began (an injection is into one vessel for its whole run)
    let latchTrace: unknown = null;
    let latchGraft: string | null = null;
    /** the graft lumen the tip was in when this bolus's injection began (latched for the run) */
    const graftAtTipFor = (trace: unknown, vesselNow: string | null): string | null => {
      if (trace !== latchTrace) {
        latchTrace = trace;
        latchGraft = vesselNow;
      }
      return latchGraft;
    };
    // the post-CABG hardware, worked out once per case rather than on every frame
    let hwCase: unknown = null;
    let hwSpec: HardwareSpec | undefined;
    const hardwareFor = (c: Pick<AnatomyCase, "id" | "grafts">): HardwareSpec | undefined => {
      if (c !== hwCase) {
        hwCase = c;
        hwSpec = graftHardware(c) ?? undefined;
      }
      return hwSpec;
    };
    let treeModel: AnatomyModel | null = session?.model ?? null;

    // the rod mechanics' devices as drawn, cached per (physics frame, patient time): a cine run draws at
    // its frame rate, the solver's frames may come slower
    let physKeyFrame: unknown = null;
    let physKeyT = NaN;
    let physCathMoved: Vec3[] | null = null;
    let physWire: { pts: Vec3[]; kind: "035" | "014" } | null = null;
    let physWts = new Float64Array(0);
    const physDevices = (phys: NonNullable<DiagnosticLabSession["physics"]>, cs: ReturnType<DiagnosticLabSession["engine"]["clockState"]>, model: AnatomyModel, tr: CoronaryTree) => {
      const pf = phys.frame();
      if (pf === physKeyFrame && cs.t === physKeyT) return;
      physKeyFrame = pf;
      physKeyT = cs.t;
      physCathMoved = null;
      physWire = null;
      const pv = phys.view();
      const physCath = pv && pv.catheterInBody.length >= 2 ? pv.catheterInBody : null;
      if (!physCath) {
        // no catheter in the patient (the exchange): the wire as it lies, not coupled to the root
        const w = pf ? wireInBody(pf) : null;
        physWire = w ? { pts: w, kind: pf?.wire?.slot === "wire014" ? "014" : "035" } : null;
        return;
      }
      // coupling to the root: by arclength from the tip, only while the tip is in the root (MODEL PARAMETER: the root's radius plus 10 mm, up to 30 mm above the sinus top)
      const n = physCath.length;
      const tip = physCath[n - 1];
      const inRoot = tip.y < model.sinusTopY + 30 && Math.hypot(tip.x, tip.z) < model.sinusRadius + 10;
      const mRoot = inRoot ? motionAt(cs, tr.heart) : null;
      if (!mRoot) {
        physCathMoved = physCath;
        physWire = pv?.wireInBody && pv.wireInBody.length >= 2 ? { pts: pv.wireInBody, kind: pv.wire?.kind ?? "035" } : null;
        return;
      }
      if (physWts.length < n) physWts = new Float64Array(n);
      let acc = 0;
      for (let i = n - 1; i >= 0; i--) {
        if (i < n - 1) acc += Math.hypot(physCath[i + 1].x - physCath[i].x, physCath[i + 1].y - physCath[i].y, physCath[i + 1].z - physCath[i].z);
        physWts[i] = catheterTether(acc);
      }
      const moved = (p: Vec3, wgt: number): Vec3 => {
        if (wgt < 1e-3) return p;
        const d = rootDisplacement(mRoot, p.y, tr.heart);
        return { x: p.x + d.x * wgt, y: p.y + d.y * wgt, z: p.z + d.z * wgt };
      };
      const out: Vec3[] = new Array(n);
      for (let i = 0; i < n; i++) out[i] = moved(physCath[i], physWts[i]);
      physCathMoved = out;
      const wb = pv?.wireInBody;
      if (wb && wb.length >= 2) {
        // a wire node takes the coupling of the nearest catheter node (inside the catheter they coincide; beyond the tip, the tip's), found once per physics frame
        const near = phys.wireNearestIndex();
        const wp: Vec3[] = new Array(wb.length);
        for (let j = 0; j < wb.length; j++) wp[j] = moved(wb[j], physWts[near ? near[j] : n - 1]);
        physWire = { pts: wp, kind: pv?.wire?.kind ?? "035" };
      }
    };

    const modeNow = (): "fluoro" | "cine" | null => {
      const st = useSimulatorStore.getState();
      if (!st.fluoroOn) return null;
      if (session) return st.pedal.cine ? "cine" : st.pedal.fluoro ? "fluoro" : null;
      return keys.cine ? "cine" : keys.fluoro ? "fluoro" : null;
    };

    /** expose and draw one frame */
    const drawXray = (mode: "fluoro" | "cine") => {
      if (!xr) return;
      const now = performance.now();
      const st = useSimulatorStore.getState();
      frameNo++;
      if (!session && (st.model !== treeModel || !tree)) {
        tree = buildCoronaryTree(st.model, st.caseData);
        treeModel = st.model;
      }
      if (!tree) return;
      const cath = catheterById(st.catheterId);
      // the analytic model's catheter and its straight two-point wire (not while the rod mechanics draws them)
      const legacyDevices = () => {
        const wireLen = st.controls.wireInsertion;
        return {
          root: catheterPath(st.model, st.tip, cath, st.controls),
          wire: wireLen > 0.1 ? { pts: [st.tip.pos, add(st.tip.pos, scale(st.tip.dir, wireLen))], kind: (cath?.category === "guide" ? "014" : "035") as "014" | "035" } : null,
        };
      };
      const fieldMm = st.imaging.field * 10;
      let res: SceneResult;
      if (session) {
        const ex = session.exposure;
        ex.exposure = { ...ex.exposure, fluoroPps: st.imaging.pulseRate, cinePps: st.imaging.cineRate };
        const ef = ex.frame(mode, xr);
        const cs = session.engine.clockState();
        // the left heart (diag-lv-aorta-task): the power injector's run replaces the hand bolus while it is on the image
        const lh = leftHeartOf(session);
        const lhBolus = leftHeartBolus(lh);
        const b = lhBolus ?? session.bolusFor();
        const iliac = !!lhBolus?.iliac;
        // the rod mechanics: the catheter from the groin (or the wrist) to the tip, and the wire as it lies;
        // before its first frame (pf null) the analytic catheter, whose seat the store still holds
        const phys = session.physics?.active ? session.physics : null;
        const pf = phys ? phys.frame() : null;
        const rod = !!phys && !!pf;
        if (rod) physDevices(phys!, cs, st.model, tree);
        const pv = rod ? phys!.view() : null;
        const leg = rod ? null : legacyDevices();
        // the route from the sheath: a limb station's field, the limb and the puffs (null: nothing added)
        const rd = routeDrawing(session.capability("route"), st.model);
        const centre = cath?.target === "left" || cath?.target === "right" ? cath.target : "both";
        const tablePan = { x: st.imaging.panX, y: st.imaging.panY, z: -st.imaging.tableHeight };
        const iliacStation = !!lh?.iliacStation;
        const stationPan = iliacStation
          ? add(add(toWorld(st.model, ILIAC_FIELD_CENTRE), scale(treeCentre(tree, centre), -1)), tablePan)
          : rd?.station
            ? add(add(toWorld(st.model, rd.station), scale(treeCentre(tree, centre), -1)), tablePan)
            : null;
        const routeExtras = rd && (rd.tubes.length || rd.bones.length) ? rd : null;
        if (iliacStation && iliac && b?.trace) {
          if (!iliacMemo || iliacMemo.trace !== b.trace || iliacMemo.model !== st.model) iliacMemo = { trace: b.trace, model: st.model, extras: iliofemoralExtras(st.model, b.trace, MU.iodinePerMg * IODINE_MG_PER_ML) };
        } else iliacMemo = null;
        const iliacExtras = iliacMemo ? iliacMemo.extras : null;
        const lvGramSpec = lh ? lh.sceneSpec() : null;
        // the patient's spasm and nitrate (diag-spasm-states)
        const eng = session.engine;
        const spasm = tipSpasmView(eng.tipSpasm(spasmNow), eng.tipInput, pf?.engagement ? pf.engagement.depthMm : st.engagement.isSelective || st.engagement.isDeep ? st.engagement.depth : null, spasmAt);
        // the engine's cached drug effects (no recompute per frame)
        const dil = eng.epicardialDilation;
        // the injected side's native coronary flow from the patient (diag-injection-run-quality)
        const flowSide: "left" | "right" = b?.side ?? (cath?.target === "right" ? "right" : "left");
        const flowScale = b ? session.flowScaleFor(flowSide) : undefined;
        res = buildXrayScene({
          model: st.model,
          caseData: st.caseData,
          tree,
          catheterRoot: leg ? leg.root : pv ? pv.catheterRoot : [],
          ...(rod ? { catheterNodes: physCathMoved ?? [] } : {}),
          french: cath ? catheterFrench(cath.id) : 6,
          guide: cath?.category === "guide",
          wire: leg ? leg.wire : physWire,
          ...(flowScale !== undefined ? { flowScale } : {}),
          bolus: b
            ? pigtailRootBolus(
                graftBolus(
                  { ...b, seat: seatWithSideHoles(injectionSeat(st.engagement, st.pressure), catheterSideHoles(st.catheterId)), rootFill: true },
                  {
                    graftAtTip: graftAtTipFor(b.trace, phys ? pf?.engagement?.vessel ?? null : null),
                    catheterId: st.catheterId,
                    hasGrafts: !!tree.grafts?.length,
                  }
                ),
                st.catheterId
              )
            : null,
          ...(lvGramSpec ? { lvGram: lvGramSpec } : {}),
          hardware: hardwareFor(st.caseData),
          catheterContrast: b ? undefined : session.injector.primed,
          t: pf ? pf.t : cs.t,
          clock: cs,
          cArm: st.cArm,
          field: fieldMm,
          centreOn: centre,
          // table height: raising the table moves the patient up, i.e. the isocentre down in the patient
          pan: stationPan ?? tablePan,
          mode,
          frame: frameNo,
          framesSinceStart: ef.framesSinceStart,
          adrc: ef.adrc,
          exposure: ef.exposure,
          meter: ef.meter,
          meteredWaterCm: ef.meteredWaterCm,
          patientSeed: st.caseData.id,
          legacyCatheter: !rod,
          ...(spasm ? { spasm } : {}),
          ...(dil > 0 ? { epicardialDilation: dil } : {}),
          ...(iliacExtras ? { extras: iliacExtras } : routeExtras ? { extras: () => ({ tubes: routeExtras.tubes, bones: routeExtras.bones }) } : {}),
        });
      } else {
        const lab = standalone!;
        const { root, wire } = legacyDevices();
        lab.tick(now);
        const lf = lab.frame(mode, xr);
        res = buildXrayScene({
          model: st.model,
          caseData: st.caseData,
          tree,
          catheterRoot: root,
          french: 6,
          guide: cath?.category === "guide",
          wire,
          bolus: null,
          catheterContrast: 0,
          t: lab.clock.state().t,
          clock: lf.clock,
          cArm: st.cArm,
          field: fieldMm,
          centreOn: cath?.target === "left" || cath?.target === "right" ? cath.target : "both",
          pan: { x: st.imaging.panX, y: st.imaging.panY, z: 0 },
          mode,
          frame: frameNo,
          breathHold: lf.breathHold,
          framesSinceStart: lf.framesSinceStart,
          adrc: lf.adrc,
          exposure: lab.exposure,
          meter: lf.meter,
          meteredWaterCm: lf.meteredWaterCm,
          patientSeed: st.caseData.id,
          legacyCatheter: true,
        });
      }
      const { scene, params } = res;
      params.shutters = st.imaging.shutters;
      params.wedges = wedgesFor(st.imaging.wedge);
      if (DEV) {
        const tune = (window as unknown as { __xrayTune?: Partial<typeof params> }).__xrayTune;
        if (tune) Object.assign(params, tune);
      }
      xr.render(scene, params);
      if (session) session.exposure.expose(res, st.cArm, fieldMm, now, session.engine.clockState().t);
      else standalone!.expose(res, st.cArm, fieldMm, now);
      if (hctx) hctx.clearRect(0, 0, hold.width, hold.height); // the live image is on the GL canvas again
      everImaged = true;
      const gray = grabFrame();
      session?.onExposedFrame(gray, mode);
    };

    const fit = () => {
      const size = Math.max(80, Math.min(wrap.clientWidth, wrap.clientHeight));
      if (size === cssSize) return false;
      cssSize = size;
      const px = Math.max(64, Math.round(size * dpr));
      glCanvas.width = px;
      glCanvas.height = px;
      hold.width = px;
      hold.height = px;
      xr?.fitCanvas(px);
      return true;
    };

    const repaintHold = () => {
      // a resize clears the GL buffer: show the retained image (the stored-matrix copy) until the next exposure
      if (!hctx || !haveGrab) return;
      hctx.imageSmoothingEnabled = true;
      hctx.drawImage(grab, 0, 0, hold.width, hold.height);
    };

    const render = () => {
      const now = performance.now();
      if (fit() && everImaged) repaintHold();
      const mode = modeNow();
      const hookActive = now - lastHookDraw < 500;
      if (!mode) {
        if (!hookActive) {
          if (session) session.exposure.beamOff(now);
          else standalone!.beamOff(now);
        }
        if (standalone) standalone.tick(now);
      } else {
        const st = useSimulatorStore.getState();
        const fps = mode === "cine" ? st.imaging.cineRate : st.imaging.pulseRate;
        if (now - lastFrame >= 1000 / fps - 1) {
          lastFrame = now;
          drawXray(mode);
        }
      }
      raf = requestAnimationFrame(render);
    };
    render();

    if (DEV) {
      const w = window as unknown as Record<string, unknown>;
      // draw one frame on demand (automated checks run with the page hidden, where rAF is paused)
      w.__fluoroDraw = (mode?: "fluoro" | "cine") => {
        lastHookDraw = performance.now();
        fit();
        const contrast = session ? !!session.contrast || !!leftHeartOf(session)?.sceneBolus() : !!useSimulatorStore.getState().bolus;
        drawXray(mode ?? (contrast ? "cine" : "fluoro"));
      };
      if (standalone) w.__fluoroLab = standalone;
    }

    return () => {
      cancelAnimationFrame(raf);
      xr?.dispose();
      if (standalone) {
        window.removeEventListener("keydown", kd);
        window.removeEventListener("keyup", ku);
        window.removeEventListener("blur", blur);
        if (labImaging.diagnostic === standalone) labImaging.diagnostic = null;
      }
      if (session && labInjector.diagnostic === session.injector) labInjector.diagnostic = null;
    };
  }, [session]);

  return (
    <div ref={wrapRef} className={`relative w-full aspect-square bg-black overflow-hidden ${className}`}>
      <canvas ref={glRef} className="absolute inset-0 w-full h-full block" aria-label="Live X-ray image" />
      <canvas ref={holdRef} className="absolute inset-0 w-full h-full block pointer-events-none" aria-hidden />
      {!session && (
        <div className="absolute bottom-2 left-3 text-[12px] font-mono text-ink-faint pointer-events-none">Hold F for fluoroscopy, C for cine</div>
      )}
    </div>
  );
}
