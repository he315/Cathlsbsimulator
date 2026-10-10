import type { CArm, Vec3 } from "../types";
import {
  V,
  cross,
  dot,
  normalize,
  deg2rad,
  length,
  sub,
  scale,
} from "../utils/math";

export interface CameraBasis {
  forward: Vec3;
  right: Vec3;
  up: Vec3;
}

// Build an orthographic camera basis from C-arm angles.
//   laoRao:  + = LAO (detector to patient's left), - = RAO.
//   cranialCaudal: + = cranial, - = caudal.
export function cameraBasis(cArm: CArm): CameraBasis {
  const th = deg2rad(cArm.laoRao);
  const ph = deg2rad(cArm.cranialCaudal);

  // Detector (viewer) direction on the viewing sphere (AP = anterior at +z, +x patient left,
  // +y head). LAO puts the detector to the patient's left; CRANIAL tilts the detector towards
  // the head (DICOM Positioner Secondary Angle 0018,1511: +90 is cranial), so n.y > 0.
  const n: Vec3 = {
    x: Math.sin(th),
    y: Math.cos(th) * Math.sin(ph),
    z: Math.cos(th) * Math.cos(ph),
  };
  const forward = normalize({ x: -n.x, y: -n.y, z: -n.z });
  const worldUp = V(0, 1, 0);
  let right = cross(forward, worldUp);
  if (length(right) < 1e-4) right = V(1, 0, 0);
  right = normalize(right);
  const up = normalize(cross(right, forward));
  return { forward, right, up };
}

export interface P2 {
  x: number;
  y: number;
}

// Project a world-frame 3D point to normalised 2D image coordinates.
// x increases to the RIGHT of the image, y increases UP.
export function projectPoint(p: Vec3, basis: CameraBasis): P2 {
  return { x: dot(p, basis.right), y: dot(p, basis.up) };
}

// ---------------------------------------------------------------------------
// Cone-beam (perspective) X-ray geometry.
//
// A real C-arm is a point X-ray SOURCE projecting through the patient onto a
// flat image intensifier. That divergent geometry is what makes structures
// closer to the source magnify, gives true depth-dependent parallax, and
// foreshortens vessels according to their 3D orientation — the whole reason
// different projections "open up" different segments. This is the forward half
// of what 3D-reconstruction methods (e.g. NeCA) invert; here we only need the
// forward projection, done analytically.
//
//   SOD = source-to-object (isocentre) distance
//   SID = source-to-image  distance   → magnification at isocentre = SID/SOD
// ---------------------------------------------------------------------------
export interface ConeBeam extends CameraBasis {
  source: Vec3;
  iso: Vec3;
  sod: number;
  sid: number;
}

export function coneBeamCamera(
  cArm: CArm,
  iso: Vec3 = V(0, -6, 0),
  sod = 180,
  sid = 230
): ConeBeam {
  const b = cameraBasis(cArm);
  const source = sub(iso, scale(b.forward, sod));
  return { ...b, source, iso, sod, sid };
}

export interface ProjPoint extends P2 {
  /** forward distance from the source (painter's-order depth) */
  depth: number;
  /** local magnification (SID / depth) */
  mag: number;
}

// Project through the source onto the detector. Divergent rays → the returned
// x/y are ray angles (already divided by depth), so nearer objects spread more.
export function projectPersp(p: Vec3, cam: ConeBeam): ProjPoint {
  const dx = p.x - cam.source.x;
  const dy = p.y - cam.source.y;
  const dz = p.z - cam.source.z;
  const depth = Math.max(1e-3, dx * cam.forward.x + dy * cam.forward.y + dz * cam.forward.z);
  const rx = dx * cam.right.x + dy * cam.right.y + dz * cam.right.z;
  const uy = dx * cam.up.x + dy * cam.up.y + dz * cam.up.z;
  return { x: rx / depth, y: uy / depth, depth, mag: cam.sid / depth };
}

export function projectPath(points: Vec3[], basis: CameraBasis): P2[] {
  return points.map((p) => projectPoint(p, basis));
}

// 2D length of a projected polyline.
function path2dLength(pts: P2[]): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    l += Math.hypot(dx, dy);
  }
  return l;
}

function path3dLength(pts: Vec3[]): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += length(sub(pts[i], pts[i - 1]));
  return l;
}

// Foreshortening: ratio of projected length to true length (1 = no foreshortening).
export function elongation(points3d: Vec3[], basis: CameraBasis): number {
  const l3 = path3dLength(points3d);
  if (l3 < 1e-4) return 0;
  return path2dLength(projectPath(points3d, basis)) / l3;
}
