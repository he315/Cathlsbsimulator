import { useEffect, useRef, useState } from "react";
import { XrayRenderer } from "../../render/xray/XrayRenderer";
import { buildCoronaryTree, type CoronaryTree } from "../../render/xray/coronaryTree";
import { buildXrayScene, LabImaging, treeCentre, SID, SOD, CATHETER_OD_MM, CATHETER_WALL, type SceneResult } from "../../render/xray/sceneBuilder";
import type { TubeSpec, BonePrim } from "../../render/xray/thorax";
import { IODINE_MG_PER_ML } from "../../simulation/injection";
import { toWorld } from "../../simulation/anatomy";
import {
  limbExtras,
  puffTubes,
  forearmAngioTubes,
  femoralAngioTubes,
  wirePolyline,
  sheathPolyline,
  slice,
  segmentAtS,
  femoralSheathPolyline,
  needlePolyline,
  microWirePolyline,
  markerPolylines,
  siteToAortic,
  steelTubes,
  accessWirePolyline,
  femoralCalciumTubes,
  bladderTubes,
  pelvisFrameCentre,
  crossoverAngioTubes,
  crossoverDeviceTubes,
  extravasationAtPoint,
  siteBranchTubes,
  MP_GROIN_DRAW,
  type Polyline,
  type Station,
} from "../../simulation/access/route";
import { bleedingOf } from "../../simulation/session/modules/bleeding";
import { endovascularOf, type EndoDraw } from "../../simulation/session/modules/endovascular";
import { EndovascularPanel } from "./EndovascularPanel";
import { ANGIO_REPORT_FIELDS, MP_UPSIZING, type FemoralAngioAnswer } from "../../simulation/access/upsizing";
import { MP_RADIAL_SEQUENCE } from "../../simulation/session/caseSession";
import type { AccessSite } from "../../simulation/access/site";
import { segmentAt } from "../../simulation/procedure";
import { SHEATHS } from "../../simulation/access/closure";
import { haptics } from "../../simulation/haptics";
import { useProcedureStore } from "../../state/useProcedureStore";
import type { AccessSiteState, CaseSession } from "../../simulation/session/caseSession";
import { SiteSelector } from "./panels/AccessPicker";
import type { CArm, Vec3 } from "../../types";

// ===========================================================================
// Fluoroscopy for the access route on the X-ray renderer.
//
// The wire, the catheter and the sheath are drawn along the access lumen
// (S7) on the patient's own thorax, with the arm or the pelvis added as
// additive anatomy (route.ts limbExtras). The beam is on only while the
// pedal is held (F key or the pedal button); otherwise the last image is held
// and no dose is booked. The table pans along the limb (stations, arrow keys).
// A puff of contrast through the sheath side arm shows the arm vessels or the
// femoral bifurcation. The wire tip's J points where it has been turned, so
// the image itself shows whether the tip is aimed into the true lumen.
//
// Several access sites (access-multi-site): the view follows the active
// site's route (its limb anatomy is rebuilt when the route changes, and the
// table returns to that route's first station), with a site selector when
// the case has more than one. An exposed frame at a table station is
// reported to the session (noteFluoroscopy): the groin screened before a
// femoral puncture is the fluoroscopic guidance a crossover is scored on.
//
// The femoral puncture (access-femoral-puncture): at a femoral artery site
// the femoral head is placed from the site's landmarks, and the sheath, the
// arteriotomy and the femoral angiogram are drawn at their own site x, so
// the image shows where the needle actually went in. A metal marker (the
// 'Marker' hand) is dragged along the groin on AP fluoroscopy and 'Mark the
// skin here' marks the skin at its tip (session.markFemoralHead); it lies on
// the skin until the first puncture. The micropuncture needle and the
// 0.018 inch wire are drawn along the wire's course, so a wire in the
// inferior epigastric or lateral circumflex iliac artery, or running down
// the leg, is seen only when the groin is screened; each exposed frame at
// the groin tells the session (noteFluoroscopy), which raises what the image
// shows. Nothing on screen names the course or the height.
//
// Upsizing and the femoral angiogram (access-femoral-upsizing-angiogram):
// the dilator and the sheath are drawn at their own length from the skin
// (10, 25 or 45 cm), the 0.035 inch wire up the iliac artery to the aorta,
// and anterior-wall calcium as a faint line whenever the groin is screened.
// The C-arm offers AP and RAO or LAO at 20 and 30 degrees, and a magnified
// field. At the groin with a femoral sheath the side-arm injection is the
// femoral angiogram, of the volume chosen (session.femoralAngiogram, scored
// on its technique); after it a short structured report is asked for
// (bifurcation, inferior epigastric artery, size, disease) and graded by the
// session; the grade is shown after submission in guided mode only.
//
// The forearm (access-radial-sequence): the arm route's first station is the
// forearm, which holds a radial loop when there is one. At a radial site the
// injection is a forearm angiogram through the catheter when the catheter is
// in the arm (session.forearmAngiogram: bring it up to just below the wire
// tip first), otherwise a puff through the sheath; either fills the artery,
// narrowed where it is in spasm, round a loop, and shows extravasation where
// a forced wire has perforated it and the hole has not been sealed. Nothing
// on screen names what the image shows. Balloon-assisted tracking and the
// two ways of covering a perforation are always offered under 'If the wire
// will not go, or it leaks', so the panel never says which problem is
// present; with the balloon up, the catheter hand advances catheter and
// balloon together.
//
// The pelvis (access-cx-bleeding-retroperitoneal): on a femoral route the
// pelvis station is framed between the common iliac artery and the bladder,
// and once contrast has been given the bladder is drawn opacified (route.ts
// bladderTubes), pushed to the other side by a retroperitoneal haematoma
// when there is one: the dented bladder. Each exposed frame there tells the
// bleeding module the pelvis was screened (noteBladderScreen); the learner
// reads the image in the bleeding orders. Nothing on screen names it.
//
// Endovascular control from the opposite groin (access-cx-endovascular-control):
// while the endovascular module's crossover catheter is in through the active
// groin's sheath, the wire and catheter hands drive the crossover wire and
// catheter over the aortic bifurcation (module crossWire, crossCatheter), the
// table offers the stations of the crossover route (the other side's iliac
// artery and groin), and the view draws the crossover wire and catheter, the
// occlusion balloon's marker bands (filled with dilute contrast when up), the
// stents and coils placed, and the angiogram through the crossover catheter:
// the other side's arteries filling downstream, stopping at an inflated
// balloon or an occlusion, narrowing past a flap, and the extravasation blush
// of an open hole (route.ts crossoverAngioTubes). Without the crossover a
// puff through a femoral sheath shows the same blush for a hole on that
// groin's route, and the femoral angiogram for a hole in the common femoral
// artery below the sheath. Screening the other groin while the crossover is
// in, its wire, catheter, balloon and devices stay on the image, and that
// groin's sheath puff stops at the inflated balloon (occlusionOnRoute); a
// hole in a small branch shows on the puff with the branch filled out to it
// (route.ts siteBranchTubes). The module's controls (EndovascularPanel) sit
// under the image whenever the module has a case in hand or both groins have
// a femoral sheath. Nothing on screen names the injury.
// ===========================================================================

const FIELD_MM = 250;
/** The magnified field (mm at the detector; a framing setting, not a device dimension). */
const FIELD_MAG_MM = 170;
const VIEWS: { id: string; label: string; arm: CArm }[] = [
  { id: "ap", label: "AP", arm: { laoRao: 0, cranialCaudal: 0 } },
  { id: "rao20", label: "RAO 20", arm: { laoRao: -20, cranialCaudal: 0 } },
  { id: "rao", label: "RAO 30", arm: { laoRao: -30, cranialCaudal: 0 } },
  { id: "lao20", label: "LAO 20", arm: { laoRao: 20, cranialCaudal: 0 } },
  { id: "lao", label: "LAO 30", arm: { laoRao: 30, cranialCaudal: 0 } },
];

type Hand = "wire" | "catheter" | "marker";

/**
 * The groin station at a femoral artery site is centred this far below the centre of the femoral head (mm
 * along the limb, a framing choice), so the head and the 1 to 2 cm below it lie mid-field.
 */
const GROIN_FRAME_BELOW_HEAD_MM = 15;

/**
 * Field centre (aortic frame) of the groin station at a femoral artery site: over the femoral head, a little
 * below its centre. Null without a femoral head in the site's landmarks.
 */
function groinFrameCentre(r: Parameters<typeof siteToAortic>[0], site: AccessSite): Vec3 | null {
  const head = site.bones.find((b) => b.kind === "femoral-head");
  return head
    ? siteToAortic(r, site, {
        x: head.xRef - GROIN_FRAME_BELOW_HEAD_MM,
        y: head.yRef,
        z: head.zRef,
      })
    : null;
}

interface Props {
  session: CaseSession;
  /** show the guided read-outs (segment, wire length, tip dial) */
  readouts: boolean;
}

/**
 * The marker lies on the skin, and the skin can be marked, only before this site's first skin pass and
 * while nothing is through the skin (no needle in, no wire, no sheath).
 */
function markerAllowed(a: AccessSiteState): boolean {
  const p = a.pm.st;
  return a.firstPassAt === null && !(p.needle && p.needle.inserted > 0) && !p.wire && !a.sheath;
}

function projectInField(res: SceneResult, p: Vec3): boolean {
  const { src, detC, detU, detV } = res.scene.cam;
  const d = { x: p.x - src.x, y: p.y - src.y, z: p.z - src.z };
  const nrm = {
    x: detU.y * detV.z - detU.z * detV.y,
    y: detU.z * detV.x - detU.x * detV.z,
    z: detU.x * detV.y - detU.y * detV.x,
  };
  const denom = d.x * nrm.x + d.y * nrm.y + d.z * nrm.z;
  if (Math.abs(denom) < 1e-9) return false;
  const tt = ((detC.x - src.x) * nrm.x + (detC.y - src.y) * nrm.y + (detC.z - src.z) * nrm.z) / denom;
  const q = {
    x: src.x + d.x * tt - detC.x,
    y: src.y + d.y * tt - detC.y,
    z: src.z + d.z * tt - detC.z,
  };
  const u = (q.x * detU.x + q.y * detU.y + q.z * detU.z) / (detU.x ** 2 + detU.y ** 2 + detU.z ** 2);
  const v = (q.x * detV.x + q.y * detV.y + q.z * detV.z) / (detV.x ** 2 + detV.y ** 2 + detV.z ** 2);
  return Math.abs(u) < 0.92 && Math.abs(v) < 0.92;
}

export default function AccessFluoroView({ session, readouts }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const act = useProcedureStore((s) => s.act);
  useProcedureStore((s) => s.version);
  const [view, setView] = useState("ap");
  const [station, setStation] = useState(session.route.geom.stations[0]?.id ?? "chest");
  const [hand, setHand] = useState<Hand>("wire");
  const [pedal, setPedal] = useState(false);
  const [noGl, setNoGl] = useState(false);
  const [mag, setMag] = useState(false);
  const [angioMl, setAngioMl] = useState(MP_UPSIZING.angioDefaultMl);
  const [batAtm, setBatAtm] = useState("");
  const st = useRef({
    pan: { x: 0, y: 0 },
    pedal: false,
    puffT: -99,
    view: "ap",
    station,
    hand: "wire" as Hand,
    drag: false,
    lastHold: false,
    mag: false,
    angioMl: MP_UPSIZING.angioDefaultMl as number,
    /** the last radial injection: through the catheter (its tip along the route) or the sheath */
    puffVia: "sheath" as "sheath" | "catheter" | "crossover",
    puffFromS: 0,
  });
  st.current.view = view;
  st.current.mag = mag;
  st.current.angioMl = angioMl;
  st.current.station = station;
  st.current.hand = hand;
  st.current.pedal = pedal;
  const siteId = session.activeSiteId;
  // another site: the table goes to the first station of its route
  useEffect(() => {
    setStation(session.route.geom.stations[0]?.id ?? "chest");
    st.current.pan = { x: 0, y: 0 };
    // the marker belongs to a femoral artery site
    if (session.activeSite.siteKind !== "femoral") setHand((h) => (h === "marker" ? "wire" : h));
  }, [siteId, session]);

  // the renderer, lab imaging (dose) and the frame loop
  useEffect(() => {
    const canvas = glRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const xr = XrayRenderer.create(canvas);
    if (!xr) {
      setNoGl(true);
      return;
    }
    const lab = new LabImaging({ seed: session.caseData.id });
    const model = session.model;
    const tree: CoronaryTree = buildCoronaryTree(model, session.caseData);
    const centre = treeCentre(tree, "both");
    // the limb anatomy of the active site's route, rebuilt when the route or the site changes (another site);
    // at a femoral artery site the femoral head lies where the site's landmarks put it
    const groinSite = (): AccessSite | undefined => (session.activeSite.siteKind !== "radial" ? session.site : undefined);
    let bonesGeom = session.route.geom;
    let bonesSite = groinSite();
    let bones: BonePrim[] = limbExtras(bonesGeom, model, bonesSite);
    // drawn tubes kept between frames: each sheath by site, and the active groin's marker, needle and micro-wire
    const sheathCache = new Map<
      string,
      {
        geom: unknown;
        site: AccessSite;
        sheathId: string;
        groin: boolean;
        x: number | undefined;
        angle: number | undefined;
        len: number | undefined;
        tube: TubeSpec;
      }
    >();
    let groinCache: {
      key: string;
      geom: unknown;
      site: AccessSite | null;
      steel: TubeSpec[];
      microWire: Vec3[] | null;
      wire035: Vec3[] | null;
      dilator: TubeSpec | null;
      calcium: TubeSpec[];
    } = {
      key: "",
      geom: null,
      site: null,
      steel: [],
      microWire: null,
      wire035: null,
      dilator: null,
      calcium: [],
    };
    // the pelvis frame centre and the bladder's tube, kept between frames (rebuilt when the route, the site or
    // what the bladder shows changes)
    let pelvisCache: { geom: unknown; site: AccessSite | undefined; c: Vec3 | null } = { geom: null, site: undefined, c: null };
    let bladderCache: { key: string; geom: unknown; site: AccessSite | undefined; tubes: TubeSpec[] } = { key: "", geom: null, site: undefined, tubes: [] };
    // the crossover angiograms already drawn (a new one starts the contrast's fade-in)
    const angios0 = endovascularOf(session)?.state.angios ?? [];
    let lastCrossAngioT: number | null = angios0.length ? angios0[angios0.length - 1].t : null;
    // the crossover's device tubes, its angiogram's tubes at unit strength (only the attenuation changes while it
    // fades) and the table's stations, kept between frames and rebuilt when what they show changes
    let xDevCache: { route: unknown; bs: number; inflated: boolean; nStents: number; nCoils: number; tubes: TubeSpec[] } | null = null;
    let xAngioCache: {
      route: unknown;
      site: AccessSite | undefined;
      t: number;
      fromS: number;
      stopS: number | null;
      flapS: number | null;
      ex: Vec3 | null;
      profundaLost: boolean;
      tubes: TubeSpec[];
    } | null = null;
    let stationsCache: { base: readonly Station[]; route: unknown; list: Station[] } | null = null;
    let frameNo = 0;
    let last = 0;
    let lastSize = 0;
    let raf = 0;
    let beamWasOn = false;

    const draw = (force = false): SceneResult | null => {
      const now = performance.now();
      const sNow = useProcedureStore.getState().session;
      if (!sNow || sNow !== session) return null;
      const size = Math.max(64, Math.round(Math.min(wrap.clientWidth, wrap.clientHeight) * (window.devicePixelRatio || 1)));
      if (size !== lastSize) {
        canvas.width = size;
        canvas.height = size;
        xr.fitCanvas(size);
        lastSize = size;
      }
      const on = st.current.pedal || force;
      if (!on) {
        if (beamWasOn) {
          lab.beamOff(now);
          beamWasOn = false;
          session.beamOn = false;
        }
        return null;
      }
      if (!force && now - last < 1000 / 15) return null;
      last = now;
      beamWasOn = true;
      session.beamOn = true;
      frameNo++;
      const g = session.route.geom;
      const s = session;
      if (g !== bonesGeom || groinSite() !== bonesSite) {
        bonesGeom = g;
        bonesSite = groinSite();
        bones = limbExtras(g, model, bonesSite);
      }
      const cArm = VIEWS.find((v) => v.id === st.current.view)!.arm;
      const field = st.current.mag ? FIELD_MAG_MM : FIELD_MM;
      // the crossover over the aortic bifurcation (access-cx-endovascular-control): xAll whenever it is in the
      // patient (its devices stay on the image while the other groin is screened), xd while its catheter is in here
      const endo = endovascularOf(s);
      const xAll: EndoDraw | null = endo?.state.cross ? endo.actions.draw() : null;
      const xd: EndoDraw | null = xAll && endo!.actions.crossoverActive() ? xAll : null;
      if (xd?.angio && xd.angio.t !== lastCrossAngioT) {
        lastCrossAngioT = xd.angio.t;
        st.current.puffT = performance.now() / 1000;
        st.current.puffVia = "crossover";
      }
      if (!stationsCache || stationsCache.base !== g.stations || stationsCache.route !== (xd?.route3d ?? null))
        stationsCache = { base: g.stations, route: xd?.route3d ?? null, list: stationsFor(g.stations, xd) };
      const stations = stationsCache.list;
      const stn = stations.find((x) => x.id === st.current.station) ?? stations[0];
      // the groin at a femoral artery site is framed on the femoral head, so the head's lower edge and the
      // entry below it are mid-field, not under the lower edge of the image
      const headFrame = stn.id === "groin" && s.activeSite.siteKind === "femoral" && s.site.kind === "femoral" ? groinFrameCentre(g, s.site) : null;
      // the pelvis on a femoral route is framed between the common iliac artery and the bladder (route.ts)
      let pelvisFrame: Vec3 | null = null;
      if (stn.id === "pelvis" && g.access === "femoral") {
        const site = groinSite();
        if (pelvisCache.geom !== g || pelvisCache.site !== site) pelvisCache = { geom: g, site, c: pelvisFrameCentre(g, site) };
        pelvisFrame = pelvisCache.c;
      }
      const target = toWorld(model, headFrame ?? pelvisFrame ?? stn.c);
      const pan = {
        x: target.x - centre.x + st.current.pan.x,
        y: target.y - centre.y + st.current.pan.y,
        z: target.z - centre.z,
      };
      // wire and catheter
      const onWrong = s.wire.branch === "wrong" && !!g.wrong;
      const path: Polyline = onWrong ? g.wrong!.path : g.path;
      const seg = segmentAt(s.route, s.wire.pos);
      const j = s.route.junction;
      const nearJ = !!j && !onWrong && s.wire.pos > j.atS - 25 && s.wire.pos < j.atS + 2;
      const aim = nearJ ? j!.targetHeading : (seg.targetHeading ?? 0);
      let wirePts: Vec3[] | null = s.wireInBody ? wirePolyline(path, s.wire.pos, s.wire.heading, aim, s.wireKind) : null;
      let wireKind: "035" | "014" = "035";
      if (xd) {
        // the crossover wire on its route (or up the aorta after a wrong turn), its tip turned as the hands turned it
        const xr = xd.route3d;
        const xPath = xd.wire.branch === "wrong" && xr.wrong ? xr.wrong.path : xr.path;
        const nearBif = xd.wire.branch === "main" && Math.abs(xd.wire.pos - xr.bifurcationS) < 25;
        wirePts = xd.wire.pos > 0.5 ? wirePolyline(xPath, xd.wire.pos, xd.wire.heading, nearBif ? xd.aimHeading : 0, xd.wireKind) : null;
      }
      const cathPath = xd ? xd.route3d.path : g.path;
      const cathPos = xd ? xd.catheterPos : s.catheter?.inBody ? s.catheter.pos : 0;
      const cath = cathPos > 0.5 ? slice(cathPath, -0.01, Math.max(1, cathPos)) : [];
      const cathNodes =
        cath.length >= 2
          ? [...sheathPolyline(cathPath, 60).slice(0, 2), ...cath]
          : [
              { x: 0, y: 3000, z: 0 },
              { x: 1, y: 3001, z: 0 },
            ];
      // extras: limb anatomy, the sheath, contrast puffs
      const puffAge = performance.now() / 1000 - st.current.puffT;
      const strength = puffAge < 0 ? 0 : puffAge < 0.4 ? puffAge / 0.4 : puffAge < 1.2 ? 1 : Math.max(0, 1 - (puffAge - 1.2) / 2);
      const tubes: TubeSpec[] = [];
      // every sheath in, at every site: screening one groin shows the other groin's sheath when it lies in the field
      // (each sheath's tube rebuilt only when its route, site, arteriotomy or angle changes)
      for (const site of s.sites) {
        if (!site.sheath) continue;
        const ax = site.pm.st.arteriotomy;
        const groin = site.siteKind !== "radial" && !!ax;
        const angle = site.pm.st.needle?.angleDeg;
        const len = site.sheath.lengthCm;
        const hit = sheathCache.get(site.id);
        if (hit && hit.geom === site.wireRoute.geom && hit.site === site.site && hit.sheathId === site.sheath.id && hit.groin === groin && hit.x === ax?.x && hit.angle === angle && hit.len === len) {
          tubes.push(hit.tube);
          continue;
        }
        const shPts = groin
          ? femoralSheathPolyline(site.wireRoute.geom, site.site, ax!.x, angle, len !== undefined ? len * 10 : undefined)
          : sheathPolyline(site.wireRoute.geom.path, site.route === "femoral" ? 100 : 70);
        const sh = shPts.map((p) => toWorld(model, p));
        const tube: TubeSpec = {
          pts: sh,
          r: sh.map(() => 1.3),
          mu: [0, 0.05, 0.02],
        };
        sheathCache.set(site.id, {
          geom: site.wireRoute.geom,
          site: site.site,
          sheathId: site.sheath.id,
          groin,
          x: ax?.x,
          angle,
          len,
          tube,
        });
        tubes.push(tube);
      }
      // at the groin: the marker on the skin until the first puncture, the needle, and the micro-wire on its course
      // (rebuilt only when one of them moves)
      const act = s.activeSite;
      if (act.siteKind !== "radial") {
        const pst = act.pm.st;
        const markerOn = act.markerX !== null && markerAllowed(act);
        const n = pst.needle && pst.needle.inserted > 0 && !pst.needleRemoved && !act.sheath ? pst.needle : null;
        // the 0.035 inch wire after the exchange (through the dilator, alone, or left in the sheath), else the micro-wire
        const up = act.up;
        const on035 =
          !s.wireInBody && !!pst.arteriotomy && !!pst.wire && pst.wire.state === "intraluminal" && (up.stage === "outer-dilator-035" || up.stage === "wire-035" || (!!act.sheath && up.wireLeftIn));
        const w = !on035 && !s.wireInBody && !act.sheath && pst.wire && pst.wire.state === "intraluminal" && pst.arteriotomy ? pst.wire : null;
        const dil = !act.sheath && pst.dilatorFr && pst.arteriotomy ? pst.dilatorFr : null;
        const key = [
          act.id,
          markerOn ? act.markerX : "-",
          n ? `${n.entryX},${n.entryY},${n.angleDeg},${n.yawDeg},${n.inserted}` : "-",
          w && pst.arteriotomy ? `${pst.arteriotomy.x},${w.beyondMm},${pst.wireCourse}` : "-",
          on035 ? `035:${pst.wire!.beyondMm}` : "-",
          dil ?? "-",
        ].join("|");
        if (key !== groinCache.key || g !== groinCache.geom || act.site !== groinCache.site) {
          const steel: { pts: Vec3[]; r: number }[] = [];
          if (markerOn) for (const jaw of markerPolylines(g, act.site, act.markerX!)) steel.push({ pts: jaw, r: MP_GROIN_DRAW.markerR });
          if (n)
            steel.push({
              pts: needlePolyline(g, act.site, n),
              r: MP_GROIN_DRAW.needleR,
            });
          const mw = w && pst.arteriotomy ? microWirePolyline(g, act.site, pst.arteriotomy.x, w.beyondMm, pst.wireCourse) : [];
          const w35 = on035 && pst.arteriotomy ? accessWirePolyline(g, act.site, pst.arteriotomy.x, pst.wire!.beyondMm) : [];
          // the dilator: drawn like a sheath, at a MODEL drawing length of 10 cm from the skin
          const dPts = dil && pst.arteriotomy ? femoralSheathPolyline(g, act.site, pst.arteriotomy.x, pst.needle?.angleDeg, 100).map((p) => toWorld(model, p)) : [];
          const dilator: TubeSpec | null = dPts.length >= 2 ? { pts: dPts, r: dPts.map(() => 0.7), mu: [0, 0.05, 0.02] } : null;
          groinCache = {
            key,
            geom: g,
            site: act.site,
            steel: steelTubes(model, steel),
            microWire: mw.length >= 2 ? mw : null,
            wire035: w35.length >= 2 ? w35 : null,
            dilator,
            calcium: act.siteKind === "femoral" ? femoralCalciumTubes(g, model, act.site) : [],
          };
        }
        tubes.push(...groinCache.steel, ...groinCache.calcium);
        if (groinCache.dilator) tubes.push(groinCache.dilator);
        if (xd) {
          // the crossover wire is the one drawn while the crossover catheter is in
        } else if (groinCache.microWire) {
          wirePts = groinCache.microWire;
          wireKind = "014";
        } else if (groinCache.wire035) wirePts = groinCache.wire035;
      }
      if (xAll) {
        const dc = xDevCache;
        if (!dc || dc.route !== xAll.route3d || dc.bs !== xAll.balloon.s || dc.inflated !== xAll.balloon.inflated || dc.nStents !== xAll.stents.length || dc.nCoils !== xAll.coils.length)
          xDevCache = {
            route: xAll.route3d,
            bs: xAll.balloon.s,
            inflated: xAll.balloon.inflated,
            nStents: xAll.stents.length,
            nCoils: xAll.coils.length,
            tubes: crossoverDeviceTubes(xAll.route3d, model, { balloon: { ...xAll.balloon, mgPerMl: IODINE_MG_PER_ML }, stents: xAll.stents, coils: xAll.coils }),
          };
        tubes.push(...xDevCache!.tubes);
      }
      if (xAll && !xd) {
        // the other groin is screened: the crossover wire and catheter are still in the patient, drawn as plain tubes
        // (the scene's own wire and catheter are this site's)
        const cross = endo!.state.cross!;
        const sh = s.siteById(cross.siteId)?.sheath;
        const fr = Math.min(7, Math.max(5, sh ? (SHEATHS[sh.id]?.fr ?? 6) : 6)) as 5 | 6 | 7;
        tubes.push(...crossoverShaftTubes(xAll, model, fr));
      }
      if (strength > 0.01 && xd && xd.angio && st.current.puffVia === "crossover") {
        // the angiogram through the crossover catheter: the other side's arteries downstream of its tip
        const a = xd.angio;
        const site = s.siteById(xd.targetSiteId)?.site;
        const ex = a.extravasation?.p ?? null;
        const ac = xAngioCache;
        const sameEx = ac && (ac.ex === ex || (!!ac.ex && !!ex && ac.ex.x === ex.x && ac.ex.y === ex.y && ac.ex.z === ex.z));
        if (!ac || !sameEx || ac.route !== xd.route3d || ac.site !== site || ac.t !== a.t || ac.fromS !== a.fromS || ac.stopS !== a.stopS || ac.flapS !== a.flapS || ac.profundaLost !== a.profundaLost)
          xAngioCache = {
            route: xd.route3d,
            site,
            t: a.t,
            fromS: a.fromS,
            stopS: a.stopS,
            flapS: a.flapS,
            ex,
            profundaLost: a.profundaLost,
            tubes: crossoverAngioTubes(xd.route3d, model, site, {
              fromS: a.fromS,
              strength: 1,
              mgPerMl: IODINE_MG_PER_ML * MP_UPSIZING.angioIodineShare,
              stopS: a.stopS,
              flapS: a.flapS,
              extravasation: a.extravasation,
              profundaLost: a.profundaLost,
            }),
          };
        for (const tb of xAngioCache!.tubes) tubes.push(scaledMu(tb, strength));
      } else if (strength > 0.01 && st.current.puffVia !== "crossover") {
        const mg = IODINE_MG_PER_ML * 0.5; // diluted by blood in the limb artery (model)
        if (s.access === "femoral" && st.current.station === "groin") {
          // the femoral angiogram: its own dilution share (MP_UPSIZING.angioIodineShare)
          const angioMg = IODINE_MG_PER_ML * MP_UPSIZING.angioIodineShare;
          const ax = s.pm.st.arteriotomy;
          const bif = s.site.landmarks.bifurcationX ?? 0;
          tubes.push(
            ...femoralAngioTubes(g, model, {
              strength,
              mgPerMl: angioMg,
              bifBelowMm: ax ? Math.max(4, ax.x - bif) : 30,
              sheathMm: s.sheath?.lengthCm ? s.sheath.lengthCm * 10 : 100,
              site: s.site,
              arteriotomyX: ax?.x,
            }),
          );
          // a hole in the common femoral artery below the sheath (access-cx-endovascular-control)
          const leak = endo?.actions.groinExtravasation(s.activeSiteId);
          if (leak) tubes.push(...extravasationAtPoint(model, leak.p, leak.t, { strength, mgPerMl: angioMg }));
          // a hole in a small branch of this groin (the inferior epigastric or lateral circumflex iliac artery)
          const twig = endo?.actions.branchExtravasation(s.activeSiteId);
          if (twig) tubes.push(...extravasationAtPoint(model, twig.p, twig.t, { strength, mgPerMl: angioMg }));
        } else if (s.access !== "femoral" && st.current.puffVia === "catheter") {
          // the forearm angiogram through the catheter (access-radial-sequence)
          tubes.push(
            ...forearmAngioTubes(g, model, {
              fromS: st.current.puffFromS,
              strength,
              mgPerMl: IODINE_MG_PER_ML * MP_RADIAL_SEQUENCE.angioIodineShare,
              spasm: Math.max(s.wire.spasm, s.radialTone()),
              aheadMm: MP_RADIAL_SEQUENCE.angioAheadMm,
              backMm: MP_RADIAL_SEQUENCE.angioBackMm,
              perforationS: openPerforationS(s),
            }),
          );
        } else {
          // a femoral route: the crossover's inflated occlusion balloon in this groin's iliac artery stops the column
          // (access-cx-endovascular-control)
          const occl = s.access === "femoral" ? (endo?.actions.occlusionOnRoute(s.activeSiteId) ?? null) : null;
          const lengthMm = s.access === "femoral" ? 140 : 190;
          tubes.push(
            ...puffTubes(g, model, {
              strength,
              lengthMm: occl !== null ? Math.min(lengthMm, occl) : lengthMm,
              spasm: s.access === "femoral" ? s.wire.spasm : Math.max(s.wire.spasm, s.radialTone()),
              mgPerMl: mg,
              // a femoral route: a hole the endovascular module holds on this groin's route (access-cx-endovascular-control)
              perforationS: s.access === "femoral" ? (endo?.actions.extravasationOnRoute(s.activeSiteId) ?? null) : openPerforationS(s),
            }),
          );
          // a femoral route: a hole in a small branch of this groin, off the route's centre line: the branch filled from
          // the artery up to the hole, and the blush on it
          if (s.access === "femoral" && st.current.puffVia === "sheath") {
            const twig = endo?.actions.branchExtravasation(s.activeSiteId);
            if (twig) {
              if (s.site.kind === "femoral") tubes.push(...siteBranchTubes(g, model, s.site, twig.branchId, twig.x, { strength, mgPerMl: mg }));
              tubes.push(...extravasationAtPoint(model, twig.p, twig.t, { strength, mgPerMl: mg }));
            }
          }
        }
      }
      // the pelvis on a femoral route: the bladder, opacified once contrast has been given, and pushed across by a
      // retroperitoneal haematoma (access-cx-bleeding-retroperitoneal); nothing names what it shows
      if (stn.id === "pelvis" && g.access === "femoral") {
        const b = bleedingOf(s)?.actions.bladder();
        if (b && b.opacity > 0) {
          const site = groinSite();
          const key = `${Math.round(b.opacity * 20)}|${Math.round(b.dentMm)}|${b.side}`;
          if (key !== bladderCache.key || g !== bladderCache.geom || site !== bladderCache.site)
            bladderCache = { key, geom: g, site, tubes: bladderTubes(g, model, { opacity: Math.round(b.opacity * 20) / 20, dentMm: Math.round(b.dentMm), side: b.side, site }) };
          tubes.push(...bladderCache.tubes);
        }
      }
      const lf = lab.frame("fluoro", xr);
      const res = buildXrayScene({
        model,
        caseData: s.caseData,
        tree,
        catheterRoot: [],
        catheterNodes: cathNodes,
        legacyCatheter: false,
        french: (s.catheterFr() as 5 | 6 | 7) ?? 6,
        wire: wirePts && wirePts.length >= 2 ? { pts: wirePts, kind: wireKind } : null,
        bolus: null,
        t: s.patient.clockState().t,
        clock: s.patient.clockState(),
        cArm,
        field,
        pan,
        mode: "fluoro",
        frame: frameNo,
        framesSinceStart: lf.framesSinceStart,
        breathHold: s.breath ? 0.95 : null,
        adrc: lf.adrc,
        exposure: lab.exposure,
        meter: lf.meter,
        meteredWaterCm: lf.meteredWaterCm,
        patientSeed: s.caseData.id,
        extras: () => ({ tubes, bones }),
      });
      xr.render(res.scene, res.params);
      lab.expose(res, cArm, field, now);
      s.noteFluoroscopy(stn.id, st.current.view);
      if (stn.id === "pelvis" && g.access === "femoral") bleedingOf(s)?.actions.noteBladderScreen(st.current.view);
      // is the wire tip in the field?
      if (wirePts && wirePts.length) s.tipImaged = projectInField(res, toWorld(model, wirePts[wirePts.length - 1]));
      const d = lab.dose.totals;
      s.setOwnDose({
        fluoroS: d.fluoroTimeS,
        karMGy: d.karMGy.total,
        kapGyCm2: d.kapGyCm2.total,
      });
      return res;
    };

    const loop = () => {
      draw(false);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    // development: draw one exposed frame on demand (the pane may be hidden and requestAnimationFrame paused)
    if ((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) {
      (
        window as unknown as {
          __accessFluoroDraw?: (o?: { station?: string; view?: string; puff?: boolean; mag?: boolean }) => boolean;
        }
      ).__accessFluoroDraw = (o = {}) => {
        // as the buttons do: React state (header, highlighted buttons, the effects that copy the view into the
        // session) and, for this synchronous frame, st.current and the session's copies
        if (o.station) {
          st.current.station = o.station;
          setStation(o.station);
        }
        const v = o.view ? VIEWS.find((x) => x.id === o.view) : undefined;
        if (v) {
          st.current.view = v.id;
          session.laoDeg = v.arm.laoRao;
          setView(v.id);
        }
        if (o.mag !== undefined) {
          st.current.mag = o.mag;
          session.magnified = o.mag;
          setMag(o.mag);
        }
        if (o.puff) {
          // as the puff button: at the groin with a femoral artery sheath it is the (scored) femoral angiogram
          const endoNow = endovascularOf(session);
          const crossing = !!endoNow?.actions.crossoverActive();
          const nBefore = endoNow?.state.angios.length ?? 0;
          puff();
          // through the crossover catheter: the new angiogram is taken as seen here, so the draw loop does not restart
          // its fade-in over the frame this hook asks for
          const angios = endoNow?.state.angios ?? [];
          if (crossing && angios.length > nBefore) {
            lastCrossAngioT = angios[angios.length - 1].t;
            st.current.puffVia = "crossover";
          }
          st.current.puffT = performance.now() / 1000 - 0.8;
        }
        return !!draw(true);
      };
    }
    return () => {
      cancelAnimationFrame(raf);
      lab.beamOff(performance.now());
      session.beamOn = false;
      xr.dispose?.();
    };
  }, [session]);

  // keyboard: F fluoroscopy (hold), B deep breath (hold), arrows pan, 1/2 hand, P puff
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const k = e.key.toLowerCase();
      if (k === "f") setPedal(true);
      else if (k === "b") act((s) => s.setBreath(true));
      else if (k === "1") setHand("wire");
      else if (k === "2") setHand("catheter");
      else if (k === "p" && !e.repeat) puff();
      else if (e.key.startsWith("Arrow")) {
        const d = 12;
        if (e.key === "ArrowUp") st.current.pan.y += d;
        if (e.key === "ArrowDown") st.current.pan.y -= d;
        if (e.key === "ArrowLeft") st.current.pan.x -= d;
        if (e.key === "ArrowRight") st.current.pan.x += d;
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "f") setPedal(false);
      else if (k === "b") act((s) => s.setBreath(false));
    };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", dn);
      window.removeEventListener("keyup", up);
      act((s) => s.setBreath(false));
    };
  }, [act]);

  // the C-arm angle reaches the wire model (aiming is easier when the arch is opened up)
  useEffect(() => {
    session.laoDeg = VIEWS.find((v) => v.id === view)!.arm.laoRao;
  }, [view, session]);
  useEffect(() => {
    session.magnified = mag;
  }, [mag, session]);

  // at the groin with a femoral artery sheath the side-arm injection is the femoral angiogram
  // (read through st.current: the keyboard handler keeps the first render's puff)
  const angioHere = () => st.current.station === "groin" && session.activeSite.siteKind === "femoral" && !!session.sheath;
  const puff = () => {
    // the view and field drawn now (st.current), not the session's copy, which React effects update a render later
    const laoDeg = VIEWS.find((v) => v.id === st.current.view)!.arm.laoRao;
    // at a radial site with the catheter in the arm the injection goes through the catheter (access-radial-sequence)
    const throughCatheter = catheterInArm(session);
    // the crossover catheter is in: the injection goes through it (the draw loop starts the fade when it sees it)
    if (endovascularOf(session)?.actions.crossoverActive()) {
      act((s) => endovascularOf(s)?.actions.angiogram());
      return;
    }
    const ok = angioHere()
      ? !!act((s) => {
          s.laoDeg = laoDeg;
          s.magnified = st.current.mag;
          return s.femoralAngiogram({
            ml: st.current.angioMl,
            laoDeg,
            magnified: st.current.mag,
          });
        })
      : session.activeSite.siteKind === "radial"
        ? !!act((s) => s.forearmAngiogram())
        : !!act((s) => s.sheathPuff());
    if (ok) {
      st.current.puffT = performance.now() / 1000;
      st.current.puffVia = throughCatheter ? "catheter" : "sheath";
      st.current.puffFromS = throughCatheter ? (session.catheter?.pos ?? 0) : 0;
    }
  };

  const s = session;
  const seg = segmentAtS(s.route.geom, s.wire.pos);
  const g = s.route.geom;
  const groinArtery = s.activeSite.siteKind === "femoral";
  const endo = endovascularOf(s);
  const xo = endo?.actions.crossoverActive() ? endo.state.cross : null;
  const stationList = stationsFor(g.stations, xo ? endo!.actions.draw() : null);

  return (
    <div className="panel h-full flex flex-col overflow-hidden">
      <div className="panel-head">
        <span>Fluoroscopy</span>
        <span className="flex items-center gap-2 normal-case tracking-normal text-ink-faint text-[12px]">
          <SiteSelector />
          {VIEWS.find((v) => v.id === view)!.label} · field {(mag ? FIELD_MAG_MM : FIELD_MM) / 10} cm · {pedal ? "fluoro 15 p/s" : "last image hold"}
        </span>
      </div>
      <div className="flex-1 min-h-0 grid grid-cols-[1fr_auto] gap-0">
        <div
          ref={wrapRef}
          className="relative bg-black select-none touch-none cursor-grab active:cursor-grabbing min-h-0 overflow-hidden"
          onPointerDown={(e) => {
            st.current.drag = true;
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          }}
          onPointerUp={() => (st.current.drag = false)}
          onPointerLeave={() => (st.current.drag = false)}
          onPointerMove={(e) => {
            if (!st.current.drag) return;
            if (e.buttons === 2 || e.shiftKey) {
              st.current.pan.x += e.movementX * 0.4;
              st.current.pan.y -= e.movementY * 0.4;
              return;
            }
            if (st.current.hand === "marker") {
              // drag up moves the marker's tip towards the head (proximally) along the groin; it follows the
              // pointer: the field (at the detector) over the image's height, scaled back to the patient
              const dy = -e.movementY;
              const imgPx = glRef.current?.clientHeight || wrapRef.current?.clientHeight || 0;
              const mmPerPx = imgPx > 0 ? (FIELD_MM * (SOD / SID)) / imgPx : 0;
              if (dy !== 0 && mmPerPx > 0) act((x) => x.placeFemoralMarker((x.femoralMarkerX ?? 0) + dy * mmPerPx));
              return;
            }
            const gain = haptics.gain();
            const advance = -e.movementY * 0.45 * gain;
            // the crossover catheter is in: the hands drive its wire and catheter over the bifurcation
            if (endovascularOf(session)?.actions.crossoverActive()) {
              const torque = st.current.hand === "wire" ? e.movementX * 0.011 : 0;
              if (st.current.hand === "wire" && (advance !== 0 || torque !== 0)) act((x) => endovascularOf(x)?.actions.crossWire(advance, torque));
              else if (st.current.hand === "catheter" && advance !== 0) act((x) => endovascularOf(x)?.actions.crossCatheter(advance));
              const w = endovascularOf(session)?.state.cross?.wire;
              if (w) haptics.update({ resistance: w.resistance, whip: w.whip, contact: w.buckle });
              return;
            }
            if (st.current.hand === "wire") {
              const torque = e.movementX * 0.011;
              if (advance !== 0 || torque !== 0) {
                act((x) => x.commandWire(advance, torque));
                const w = useProcedureStore.getState().session?.wire;
                if (w)
                  haptics.update({
                    resistance: w.resistance,
                    whip: w.whip,
                    contact: w.buckle,
                  });
              }
            } else if (advance !== 0) {
              // with the balloon up (balloon-assisted tracking) the catheter and the balloon go together
              if (session.radialSeq.bat && advance > 0) act((x) => x.advanceBat(advance));
              else act((x) => x.commandCatheter(advance));
            }
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* the image is the largest square the space left beside the controls and above the panel holds (a size
              container), so it never spills over the panel's buttons */}
          <div className="absolute inset-0 grid place-items-center" style={{ containerType: "size" }}>
            <canvas
              ref={glRef}
              className="block"
              style={{
                width: "min(100cqw, 100cqh)",
                height: "min(100cqw, 100cqh)",
              }}
            />
          </div>
          {noGl && <div className="absolute inset-0 grid place-items-center text-ink-faint text-sm">WebGL2 is not available: fluoroscopy cannot be shown.</div>}
          {/* the wire's segment and depth only while it is in: its last position belongs to the site it came out of */}
          {readouts && xo && (
            <div className="absolute bottom-2 left-2 text-[12px] font-mono text-ink-faint bg-base-900/70 rounded px-2 py-1">
              {xo.wire.branch === "wrong" ? "wire up the abdominal aorta" : segmentAt(xo.route, xo.wire.pos).name.toLowerCase()} · wire {Math.round(xo.wire.pos)} mm · catheter {Math.round(xo.catheterPos)} mm
            </div>
          )}
          {readouts && !xo && (s.wireInBody || s.catheter?.inBody) && (
            <div className="absolute bottom-2 left-2 text-[12px] font-mono text-ink-faint bg-base-900/70 rounded px-2 py-1">
              {s.wireInBody ? `${s.wire.branch === "wrong" ? `wire in the ${s.route.junction?.label}` : seg.name.toLowerCase()} · wire ${Math.round(s.wire.pos)} mm` : ""}
              {s.catheter?.inBody ? `${s.wireInBody ? " · " : ""}catheter ${Math.round(s.catheter.pos)} mm` : ""}
            </div>
          )}
          {readouts && <TipDial heading={xo ? xo.wire.heading : s.wire.heading} aimed={xo ? xo.wire.aimed : s.wire.aimed} />}
        </div>
        <div className="w-44 border-l border-line p-2 flex flex-col gap-2 overflow-y-auto">
          <button
            className={`btn ${pedal ? "btn-accent" : ""}`}
            onPointerDown={() => setPedal(true)}
            onPointerUp={() => setPedal(false)}
            onPointerLeave={() => setPedal(false)}
            title="Hold for fluoroscopy (or hold F)"
          >
            {pedal ? "Fluoroscopy on" : "Hold for fluoroscopy"}
          </button>
          <div className="text-[12px] text-ink-faint">Hands</div>
          <div className="seg flex-wrap">
            <button className={`seg-btn ${hand === "wire" ? "seg-btn-active" : ""}`} onClick={() => setHand("wire")}>
              Wire
            </button>
            <button className={`seg-btn ${hand === "catheter" ? "seg-btn-active" : ""}`} onClick={() => setHand("catheter")}>
              Catheter
            </button>
            {groinArtery && (
              <button
                className={`seg-btn ${hand === "marker" ? "seg-btn-active" : ""}`}
                onClick={() => {
                  setHand("marker");
                  // the marker is laid over the pulse at the groin crease to start with
                  if (s.femoralMarkerX === null) act((x) => x.placeFemoralMarker(0));
                }}
                title="A metal marker on the skin of the groin: drag up or down on the image to move it"
              >
                Marker
              </button>
            )}
          </div>
          {groinArtery && hand === "marker" && (
            <button
              className="btn"
              disabled={s.femoralMarkerX === null || s.busy || !markerAllowed(s.activeSite)}
              onClick={() => act((x) => x.markFemoralHead())}
              title="Mark the skin at the tip of the marker"
            >
              {s.femoralMarkX !== null && s.femoralMarkX === s.femoralMarkerX ? "Skin marked" : "Mark the skin here"}
            </button>
          )}
          <div className="text-[12px] text-ink-faint">Wire</div>
          <div className="seg">
            <button disabled={s.wireInBody} className={`seg-btn ${s.wireKind === "j" ? "seg-btn-active" : ""} disabled:opacity-50`} onClick={() => act((x) => x.setWireKind("j"))}>
              J
            </button>
            <button disabled={s.wireInBody} className={`seg-btn ${s.wireKind === "hydrophilic" ? "seg-btn-active" : ""} disabled:opacity-50`} onClick={() => act((x) => x.setWireKind("hydrophilic"))}>
              Hydrophilic
            </button>
          </div>
          <button
            className={`btn ${s.breath ? "btn-accent" : ""}`}
            onPointerDown={() => act((x) => x.setBreath(true))}
            onPointerUp={() => act((x) => x.setBreath(false))}
            onPointerLeave={() => s.breath && act((x) => x.setBreath(false))}
            title="Ask the patient to breathe in and hold (or hold B)"
          >
            {s.breath ? "Breath held" : "Deep breath (hold)"}
          </button>
          {station === "groin" && groinArtery && s.sheath && !xo ? (
            <>
              <label className="flex items-center gap-2 text-[12px] text-ink-soft">
                {angioMl} mL
                <input type="range" min={MP_UPSIZING.angioSliderMl[0]} max={MP_UPSIZING.angioSliderMl[1]} step={1} value={angioMl} onChange={(e) => setAngioMl(+e.target.value)} className="flex-1" />
              </label>
              <button className="btn" disabled={s.busy} onClick={puff} title="Femoral angiogram through the sheath side arm (P)">
                Femoral angiogram
              </button>
              <button
                className="btn btn-ghost"
                disabled={s.busy || !!s.catheter?.inBody || s.upsizing.wireLeftIn}
                onClick={() => act((x) => x.wireThroughSheath())}
                title="A 0.035 inch wire through the sheath into the aorta"
              >
                Wire through the sheath
              </button>
            </>
          ) : (
            <button className="btn" disabled={!s.sheath} onClick={puff} title={xo ? "Contrast through the crossover catheter (P)" : catheterInArm(s) ? "Contrast through the catheter in the forearm (P)" : "Contrast through the sheath side arm (P)"}>
              {xo ? "Angiogram through the crossover catheter" : catheterInArm(s) ? "Angiogram through the catheter" : "Puff through the sheath"}
            </button>
          )}
          {s.activeSite.siteKind === "radial" && s.catheter?.inBody && (
            <details className="rounded-md border border-line px-2 py-1" data-radial-troubleshoot>
              <summary className="text-[12px] text-ink-soft cursor-pointer">If the wire will not go, or it leaks</summary>
              <div className="flex flex-col gap-1 mt-1">
                <div className="text-[12px] text-ink-faint">Balloon-assisted tracking</div>
                <div className="flex items-center gap-1">
                  <input className="field w-14" inputMode="decimal" placeholder="atm" value={batAtm} onChange={(e) => setBatAtm(e.target.value)} aria-label="Balloon pressure, atm" disabled={!!s.radialSeq.bat} />
                  <button className="btn flex-1" disabled={s.busy || !!s.radialSeq.bat || !(+batAtm > 0)} onClick={() => act((x) => x.startBat(+batAtm))} title="A small compliant balloon half out of the catheter tip">
                    Inflate
                  </button>
                </div>
                {s.radialSeq.bat && (
                  <>
                    <button className="btn" disabled={s.busy} onClick={() => act((x) => x.advanceBat(5))} title="Advance the catheter and balloon together (or drag with the catheter hand)">
                      Advance together 5 mm
                    </button>
                    <button className="btn btn-ghost" onClick={() => act((x) => x.stopBat())}>
                      Deflate
                    </button>
                  </>
                )}
                <div className="text-[12px] text-ink-faint mt-1">Cover the segment over the wire</div>
                <button className="btn btn-ghost justify-start" disabled={s.busy} onClick={() => act((x) => x.sealPerforation("catheter"))}>
                  Catheter across, held
                </button>
                <button className="btn btn-ghost justify-start" disabled={s.busy} onClick={() => act((x) => x.sealPerforation("balloon"))}>
                  Long balloon, low pressure
                </button>
              </div>
            </details>
          )}
          {/* the report sits beside the image, never over it, so the angiogram can be read while answering */}
          {s.activeSite.siteKind === "femoral" && s.activeSite.femoralAngio && <AngioReport session={s} guided={readouts} />}
          <div className="text-[12px] text-ink-faint">C-arm</div>
          <div className="seg flex-wrap">
            {VIEWS.map((v) => (
              <button key={v.id} className={`seg-btn ${view === v.id ? "seg-btn-active" : ""}`} onClick={() => setView(v.id)}>
                {v.label}
              </button>
            ))}
          </div>
          <div className="seg">
            <button className={`seg-btn ${!mag ? "seg-btn-active" : ""}`} onClick={() => setMag(false)}>
              {FIELD_MM / 10} cm
            </button>
            <button className={`seg-btn ${mag ? "seg-btn-active" : ""}`} onClick={() => setMag(true)}>
              {FIELD_MAG_MM / 10} cm
            </button>
          </div>
          <div className="text-[12px] text-ink-faint">Table</div>
          <div className="flex flex-col gap-1">
            {stationList.map((x) => (
              <button
                key={x.id}
                className={`btn btn-ghost justify-start ${station === x.id ? "text-ink bg-base-600" : ""}`}
                onClick={() => {
                  setStation(x.id);
                  st.current.pan = { x: 0, y: 0 };
                }}
              >
                {x.label}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-ink-faint leading-snug mt-1">
            Drag up to advance, sideways to turn the wire
            {groinArtery ? "; with the marker, drag up or down to move it" : ""}. Shift-drag or arrow keys pan the table. Hold F for fluoroscopy, B for a breath.
          </p>
        </div>
      </div>
      {endo?.actions.visible() && (
        <div className="border-t border-line p-2 max-h-[45%] overflow-y-auto">
          <EndovascularPanel session={s} act={act} />
        </div>
      )}
    </div>
  );
}

/** The table's stations: the active route's, and with the crossover catheter in, the crossover route's beyond them. */
function stationsFor(base: readonly Station[], xd: EndoDraw | null): Station[] {
  if (!xd) return [...base];
  const out = [...base];
  for (const x of xd.route3d.stations) if (!out.some((b) => b.id === x.id)) out.push(x);
  return out;
}

/**
 * The crossover wire and catheter while another site is screened (world frame), drawn with the scene builder's own
 * radii and attenuations for a 0.035 inch wire (0.445 mm radius, 0.95; sceneBuilder.ts buildXrayScene) and a
 * catheter shaft (CATHETER_OD_MM, CATHETER_WALL), so they look as they do when drawn as the active catheter.
 */
function crossoverShaftTubes(xd: EndoDraw, model: Parameters<typeof toWorld>[0], french: 5 | 6 | 7): TubeSpec[] {
  const out: TubeSpec[] = [];
  const xr = xd.route3d;
  const xPath = xd.wire.branch === "wrong" && xr.wrong ? xr.wrong.path : xr.path;
  const nearBif = xd.wire.branch === "main" && Math.abs(xd.wire.pos - xr.bifurcationS) < 25;
  const w = xd.wire.pos > 0.5 ? wirePolyline(xPath, xd.wire.pos, xd.wire.heading, nearBif ? xd.aimHeading : 0, xd.wireKind) : [];
  if (w.length >= 2) {
    const pts = w.map((p) => toWorld(model, p));
    out.push({ pts, r: pts.map(() => 0.445), mu: [0, 0, 0.95] });
  }
  const c = xd.catheterPos > 0.5 ? slice(xr.path, -0.01, Math.max(1, xd.catheterPos)) : [];
  if (c.length >= 2) {
    const pts = c.map((p) => toWorld(model, p));
    out.push({ pts, r: pts.map(() => CATHETER_OD_MM[french] / 2), mu: [0, CATHETER_WALL.jacket, CATHETER_WALL.braid] });
  }
  return out;
}

/** A tube with its attenuation scaled (a fading injection drawn from tubes built at unit strength). */
function scaledMu(t: TubeSpec, k: number): TubeSpec {
  const m = t.mu;
  const one = (x: readonly number[]): [number, number, number] => [x[0] * k, x[1] * k, x[2] * k];
  return { ...t, mu: typeof m[0] === "number" ? one(m as [number, number, number]) : (m as [number, number, number][]).map(one) };
}

/** The catheter is in the forearm or the upper arm (not yet in the aorta) at a radial site: an injection goes through it. */
function catheterInArm(s: CaseSession): boolean {
  return s.activeSite.siteKind === "radial" && !!s.catheter?.inBody && s.catheter.pos < s.route.aortaStart;
}

/** Where along the route an unsealed forearm perforation lies at the active radial site, or null. */
function openPerforationS(s: CaseSession): number | null {
  const p = s.activeSite.radialSeq.perforation;
  return p && !p.sealed ? p.s : null;
}

/**
 * The structured report of the femoral angiogram: one choice per item, then submitted to the session. It sits in
 * the controls column beside the image (under the angiogram button), so the image stays readable at any pane width
 * while it is answered; it can be hidden. The grade is shown after submission in guided mode; otherwise only that it was recorded.
 */
function AngioReport({ session, guided }: { session: CaseSession; guided: boolean }) {
  const act = useProcedureStore((s) => s.act);
  const [open, setOpen] = useState(true);
  const [ans, setAns] = useState<Partial<FemoralAngioAnswer>>({});
  const rep = session.activeSite.femoralAngioReport;
  const done = ANGIO_REPORT_FIELDS.every((f) => ans[f.key] !== undefined);
  if (!open)
    return (
      <button className="btn" onClick={() => setOpen(true)}>
        Femoral angiogram report
      </button>
    );
  return (
    <div className="rounded-md border border-line p-2 flex flex-col gap-1.5 text-[12px]" onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-ink">Angiogram report</span>
        <button className="btn btn-ghost" onClick={() => setOpen(false)}>
          Hide
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
        {ANGIO_REPORT_FIELDS.map((f) => (
          <div key={f.key} className="flex flex-col gap-1 min-w-0">
            <span className="text-ink-soft">{f.label}</span>
            <div className="seg flex-wrap">
              {f.options.map((o) => (
                <button key={String(o.value)} className={`seg-btn ${ans[f.key] === o.value ? "seg-btn-active" : ""}`} onClick={() => setAns((a) => ({ ...a, [f.key]: o.value }))}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-accent" disabled={!done} onClick={() => act((s) => s.submitFemoralAngioReport(ans as FemoralAngioAnswer))}>
        {rep ? "Report again" : "Report"}
      </button>
      {rep &&
        (guided ? (
          <div className={`notice ${rep.grade.correct === rep.grade.total ? "notice-good" : "notice-warn"}`}>
            {rep.grade.correct} of {rep.grade.total} as the angiogram shows.
            {rep.grade.items
              .filter((i) => !i.correct)
              .map((i) => (
                <div key={i.key}>
                  {i.label}: {i.expected.toLowerCase()}.
                </div>
              ))}
          </div>
        ) : (
          <div className="text-ink-faint">Report recorded.</div>
        ))}
    </div>
  );
}

/** Guided mode only: where the shaped tip points against where the lumen is (the image shows the same). */
function TipDial({ heading, aimed }: { heading: number; aimed: boolean }) {
  const deg = (heading * 180) / Math.PI;
  return (
    <div className="absolute bottom-2 right-2 flex flex-col items-center gap-1 pointer-events-none">
      <svg viewBox="0 0 60 60" width="56" height="56">
        <circle cx="30" cy="30" r="26" fill="rgba(14,16,19,0.75)" stroke="#2E343C" />
        <g transform={`rotate(${deg} 30 30)`}>
          <line x1="30" y1="30" x2="30" y2="8" stroke="#ECEEF1" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </svg>
      <span className={`text-[12px] ${aimed ? "text-good" : "text-ink-faint"}`}>{aimed ? "tip in line" : "tip heading"}</span>
    </div>
  );
}
