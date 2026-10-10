// ---------------------------------------------------------------------------
// GLSL for the segment pass (SEG_VS / SEG_FS). It mirrors integrator.ts
// operation for operation; see that file for the method. The demo page
// compares the two on rendered frames.
// ---------------------------------------------------------------------------

import { THIN_GLSL } from "./thinLut";
import { EDGE_FULL_PX, EDGE_LIST_MAX, EDGE_NONE_PX, SUBSAMPLES } from "./config";
import { SEG_TEXELS, HOST_EXT_MAX } from "./segmentPack";

/** count-field value of an extension-list slot (segmentPack.ts) */
const HOST_EXT_CODE = 31;

/** texels per row of the segment, previous-position and index textures */
export const SEG_TEX_W = 2048;
export const IDX_TEX_W = 2048;
export const GRP_TEX_W = 256;

const HEADER = `#version 300 es
precision highp float;
precision highp int;
precision highp usampler2D;
precision highp sampler2D;
`;

/** Full-screen triangle from gl_VertexID (draw 3 vertices with an empty VAO). */
export const SEG_VS = `${HEADER}
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

const f = (x: number) => (Number.isInteger(x) ? x.toFixed(1) : String(x));

export function segFragmentSource(): string {
  const ss = SUBSAMPLES.map(([x, y, t]) => `vec3(${f(x)}, ${f(y)}, ${f(t)})`).join(", ");
  return `${HEADER}
#define SEGW ${SEG_TEX_W}
#define IDXW ${IDX_TEX_W}
#define GRPW ${GRP_TEX_W}
#define NPC 6
uniform usampler2D uTiles;
uniform usampler2D uIndex;
uniform sampler2D uSeg;
uniform sampler2D uPrev;
uniform sampler2D uGroup;
uniform sampler2D uThinLut;
uniform sampler2D uHostX;
uniform vec3 uSrc;
uniform vec3 uDetC;
uniform vec3 uDetU;
uniform vec3 uDetV;
uniform vec3 uN;
uniform float uSid;
uniform float uMmPx;
uniform float uRes;
uniform int uTile;
uniform float uThinLo;
uniform float uThinHi;
uniform float uSigmaAaPx;
uniform float uFocalSigmaMm;
uniform float uExtraPx;
uniform int uMotion;
uniform float uMotionScale;
uniform vec3 uGains;
uniform int uTransAvg;
uniform int uVelocity;
uniform int uDebug;
uniform float uSsFeaturePx;
uniform float uSsMinContrast;
uniform float uBackfillSlope;
uniform float uSsMotionPx;
uniform int uSegCount;
layout(location = 0) out vec4 frag;
layout(location = 1) out vec4 vel;

${THIN_GLSL}

const vec3 SS[4] = vec3[4](${ss});

vec3 rayDir(vec2 px) {
  vec2 uv = px / uRes * 2.0 - 1.0;
  return normalize(uDetC + uv.x * uDetU + uv.y * uDetV - uSrc);
}
vec2 projectPx(vec3 p) {
  vec3 d = p - uSrc;
  float mag = uSid / max(dot(d, uN), 1.0);
  vec3 q = d * mag - (uDetC - uSrc);
  return (vec2(dot(q, uDetU) / dot(uDetU, uDetU), dot(q, uDetV) / dot(uDetV, uDetV)) + 1.0) * 0.5 * uRes;
}

// ---- ray against a round cone (p0 at the origin: w = origin - p0) ----
bool roundCone(vec3 w, vec3 d, vec3 b, float r0, float r1, out vec2 iv) {
  float dd = dot(d, d);
  float tin = 1e30, tout = -1e30;
  for (int s = 0; s < 2; s++) {
    float r = s == 0 ? r0 : r1;
    vec3 oc = s == 0 ? w : w - b;
    float bq = dot(oc, d);
    float cq = dot(oc, oc) - r * r;
    float disc = bq * bq - dd * cq;
    if (disc > 0.0) {
      float sq = sqrt(disc);
      tin = min(tin, (-bq - sq) / dd);
      tout = max(tout, (-bq + sq) / dd);
    }
  }
  float L2 = dot(b, b);
  float L = sqrt(L2);
  if (L > abs(r0 - r1) + 1e-7) {
    vec3 a = b / L;
    float sa = (r0 - r1) / L;
    float ca = sqrt(max(0.0, 1.0 - sa * sa));
    float hA = r0 * sa, hB = L + r1 * sa;
    float rhoA = r0 * ca, rhoB = r1 * ca;
    float m = (rhoB - rhoA) / (hB - hA);
    float h0 = dot(w, a), hd = dot(d, a);
    float c0 = rhoA + m * (h0 - hA), c1 = m * hd;
    float A = dd - hd * hd - c1 * c1;
    float B = 2.0 * (dot(w, d) - h0 * hd - c0 * c1);
    float C = dot(w, w) - h0 * h0 - c0 * c0;
    float s0, s1;
    if (abs(hd) < 1e-12) {
      if (h0 < hA || h0 > hB) { s0 = 1.0; s1 = 0.0; } else { s0 = -1e30; s1 = 1e30; }
    } else {
      float ta = (hA - h0) / hd, tb = (hB - h0) / hd;
      s0 = min(ta, tb); s1 = max(ta, tb);
    }
    if (s0 < s1) {
      float lo = 1.0, hi = 0.0;
      if (abs(A) < 1e-7 * dd) {
        if (abs(B) < 1e-20) {
          if (C <= 0.0) { lo = s0; hi = s1; }
        } else {
          float ts = -C / B;
          if (B > 0.0) { lo = s0; hi = min(s1, ts); } else { lo = max(s0, ts); hi = s1; }
        }
      } else {
        float D = B * B - 4.0 * A * C;
        if (A > 0.0) {
          if (D > 0.0) {
            float sq = sqrt(D);
            float q = -0.5 * (B + (B >= 0.0 ? sq : -sq));
            float ra = q / A, rb = q != 0.0 ? C / q : ra;
            lo = max(s0, min(ra, rb)); hi = min(s1, max(ra, rb));
          }
        } else if (D <= 0.0) {
          lo = s0; hi = s1;
        } else {
          float sq = sqrt(D);
          float q = -0.5 * (B + (B >= 0.0 ? sq : -sq));
          float ra = q / A, rb = q != 0.0 ? C / q : ra;
          float tl = min(ra, rb), th = max(ra, rb);
          float aLo = s0, aHi = min(s1, tl), bLo = max(s0, th), bHi = s1;
          if (aLo < aHi) { lo = aLo; hi = aHi; }
          if (bLo < bHi) {
            if (lo < hi) { lo = min(lo, bLo); hi = max(hi, bHi); } else { lo = bLo; hi = bHi; }
          }
        }
      }
      if (lo < hi) { tin = min(tin, lo); tout = max(tout, hi); }
    }
  }
  iv = vec2(tin, tout);
  return tin < tout;
}

float thinValue(vec3 w, vec3 d, vec3 b, float L, float rA, float rB, float c0, float c1, float k, float sigO) {
  if (L < 1e-6 || sigO <= 0.0) return 0.0;
  vec3 a = b / L;
  float bb = dot(d, a);
  float sin2 = max(1.0 - bb * bb, 1e-4);
  float wa = dot(w, a), wd = dot(w, d);
  float t = (bb * wa - wd) / sin2;
  float s = (wa - bb * wd) / sin2;
  float dp = length(w + t * d - s * a);
  float sinT = sqrt(sin2);
  float fr = clamp(s / L, 0.0, 1.0);
  float r = mix(rA, rB, fr);
  if (r <= 0.0) return 0.0;
  float c = mix(c0, c1, fr) * (1.0 - 0.5 * k);
  float h = thinLookup(dp / sigO, r / sigO);
  float prof = 3.14159265 * r * r / sigO * h;
  float q = sinT / (1.41421356 * sigO);
  float W = 0.5 * (erfA(s * q) - erfA((s - L) * q));
  return c * prof / sinT * W;
}

vec4 gVel;
vec4 gVelList;
// weight of the current ray in the velocity average (1 for the centre ray, the sub-sample weight after)
float gVelScale;

ivec2 segCoord(uint idx, int k) {
  int t = int(idx) * ${SEG_TEXELS} + k;
  return ivec2(t % SEGW, t / SEGW);
}

float gEdge;


// ---- segment geometry (mirrors integrator.ts) ----
vec3 gSw, gSws, gSds, gSbs, gSbv;

vec3 segP(uint idx, int k, float ms) {
  vec3 p = texelFetch(uSeg, segCoord(idx, k), 0).xyz;
  if (uMotion != 0 && ms != 0.0) {
    int t = int(idx) * 2 + k;
    vec3 q = texelFetch(uPrev, ivec2(t % SEGW, t / SEGW), 0).xyz;
    p += (p - q) * ms;
  }
  return p;
}

// chord of segment idx along the ray: kept part (x, y), the local origin offset tc (z), and the
// parts removed by the start plane (rem.xy) and the end plane (rem.zw); false on a miss
bool chordParts(uint idx, vec3 p0, vec3 p1, vec3 o, vec3 d, out vec3 kept, out vec4 rem) {
  vec4 T0 = texelFetch(uSeg, segCoord(idx, 0), 0);
  vec4 T1 = texelFetch(uSeg, segCoord(idx, 1), 0);
  vec3 E = texelFetch(uSeg, segCoord(idx, 3), 0).xyz;
  vec3 NS = texelFetch(uSeg, segCoord(idx, 4), 0).xyz;
  vec3 NE = texelFetch(uSeg, segCoord(idx, 5), 0).xyz;
  float r0 = T0.w, r1 = T1.w;
  gSbv = p1 - p0;
  float tc = dot(0.5 * (p0 + p1) - o, d);
  gSw = o + tc * d - p0;
  float eL = length(E);
  if (eL > 0.0) {
    vec3 n = E / eL;
    gSws = gSw + eL * dot(gSw, n) * n;
    gSds = d + eL * dot(d, n) * n;
    gSbs = gSbv + eL * dot(gSbv, n) * n;
  } else {
    gSws = gSw; gSds = d; gSbs = gSbv;
  }
  rem = vec4(1.0, 0.0, 1.0, 0.0);
  kept = vec3(1.0, 0.0, tc);
  vec2 iv;
  if (!roundCone(gSws, gSds, gSbs, r0, r1, iv)) return false;
  float t0 = iv.x, t1 = iv.y;
  for (int e = 0; e < 2; e++) {
    vec3 n = e == 0 ? NS : NE;
    if (n == vec3(0.0)) continue;
    if (!(t0 < t1)) break;
    vec3 w = e == 0 ? gSw : gSw - gSbv;
    float num = dot(n, w), den = dot(n, d);
    float k0 = t0, k1 = t1, m0 = 1.0, m1 = 0.0;
    if (abs(den) < 1e-12) {
      if (num < 0.0) { m0 = t0; m1 = t1; k0 = 1.0; k1 = 0.0; }
    } else {
      float ts = -num / den;
      if (den > 0.0) { k0 = max(t0, ts); m0 = t0; m1 = min(t1, ts); }
      else { k1 = min(t1, ts); m0 = max(t0, ts); m1 = t1; }
    }
    if (e == 0) rem.xy = vec2(m0, m1); else rem.zw = vec2(m0, m1);
    t0 = k0; t1 = k1;
  }
  kept.xy = vec2(t0, t1);
  return true;
}

// integral of c = mix(c0, c1, clamp(sw + sd t, 0, 1)) over [a, b]: exact trapezoids between the
// points where s clamps
float concInt(float a, float b, float sw0, float sd, float c0, float c1) {
  if (!(a < b)) return 0.0;
  float lo = 1e30, hi = 1e30;
  if (abs(sd) > 1e-12) {
    float u0 = -sw0 / sd, u1 = (1.0 - sw0) / sd;
    lo = min(u0, u1); hi = max(u0, u1);
  }
  float sum = 0.0, x = a;
  float cx = mix(c0, c1, clamp(sw0 + sd * a, 0.0, 1.0));
  for (int q = 0; q < 3; q++) {
    float br = q == 0 ? lo : q == 1 ? hi : b;
    if (br <= x || br > b) continue;
    float cb = mix(c0, c1, clamp(sw0 + sd * br, 0.0, 1.0));
    sum += (br - x) * 0.5 * (cx + cb);
    x = br; cx = cb;
  }
  return sum;
}

// remove host segments [hFirst, hFirst + hCount) from the pieces (their kept chords)
void subRange(int hFirst, int hCount, float ms, vec3 o, vec3 dEx, float tc, inout vec2 pc[NPC], inout int np) {
  for (int hk = 0; hk < hCount; hk++) {
    if (np == 0) return;
    int hIdx = hFirst + hk;
    if (hIdx >= uSegCount) return;
    uint h = uint(hIdx);
    vec3 hk3; vec4 hr;
    if (!chordParts(h, segP(h, 0, ms), segP(h, 1, ms), o, dEx, hk3, hr) || !(hk3.x < hk3.y)) continue;
    float ha = hk3.x + hk3.z - tc, hb = hk3.y + hk3.z - tc;
    vec2 nw[NPC];
    int w2 = 0;
    for (int q = 0; q < NPC; q++) {
      if (q >= np) break;
      vec2 pq = pc[q];
      if (hb <= pq.x || ha >= pq.y) { if (w2 < NPC) { nw[w2] = pq; w2++; } continue; }
      if (ha > pq.x && w2 < NPC) { nw[w2] = vec2(pq.x, ha); w2++; }
      if (hb < pq.y && w2 < NPC) { nw[w2] = vec2(hb, pq.y); w2++; }
    }
    for (int q = 0; q < NPC; q++) pc[q] = nw[q];
    np = w2;
  }
}
// decode one host slot value (single, range or extension list) and remove those hosts
void subSlot(float hf, float ms, vec3 o, vec3 dEx, float tc, inout vec2 pc[NPC], inout int np) {
  if (hf > -1.5 && hf < 0.0) return;
  if (hf >= 0.0) { subRange(int(hf + 0.5), 1, ms, o, dEx, tc, pc, np); return; }
  int code = int(-hf + 0.5) - 2;
  int c = code % 32;
  int first = code / 32;
  if (c != ${HOST_EXT_CODE}) { subRange(first, c + 1, ms, o, dEx, tc, pc, np); return; }
  for (int t = 0; t < ${(HOST_EXT_MAX + 1) / 4}; t++) {
    int tx = first + t;
    vec4 e = texelFetch(uHostX, ivec2(tx % SEGW, tx / SEGW), 0);
    for (int q = 0; q < 4; q++) {
      float v = e[q];
      if (v > -1.5 && v < 0.0) return;
      if (v >= 0.0) subRange(int(v + 0.5), 1, ms, o, dEx, tc, pc, np);
      else {
        int cd = int(-v + 0.5) - 2;
        subRange(cd / 32, cd % 32 + 1, ms, o, dEx, tc, pc, np);
      }
    }
  }
}

vec3 gPedge;
uint gEdgeIdx[${EDGE_LIST_MAX}];
int gEdgeN;

// classify: bit 0 edge test, bit 1 motion test (both on the pixel-centre ray, current positions);
// listOnly: integrate only the segments those tests select; useList: iterate over the remembered
// segments instead of the tile list
vec3 integrate(vec3 o, vec3 dEx, vec3 dTh, float tau, uint off, uint cnt, bool wantVel, int classify, bool listOnly, bool useList) {
  bool wantEdge = (classify & 1) != 0;
  bool wantMove = (classify & 2) != 0 && uMotion != 0;
  vec3 P = vec3(0.0);
  float ms = tau * uMotionScale;
  uint n = useList ? uint(gEdgeN) : cnt;
  for (uint e = 0u; e < n; e++) {
    uint idx;
    if (useList) {
      idx = gEdgeIdx[e];
    } else {
      uint li = off + e;
      idx = texelFetch(uIndex, ivec2(int(li % uint(IDXW)), int(li / uint(IDXW))), 0).r;
    }
    vec4 T0 = texelFetch(uSeg, segCoord(idx, 0), 0);
    vec4 T1 = texelFetch(uSeg, segCoord(idx, 1), 0);
    vec3 p0 = T0.xyz, p1 = T1.xyz;
    vec3 v0 = vec3(0.0), v1 = vec3(0.0);
    if (uMotion != 0) {
      int t = int(idx) * 2;
      vec3 q0 = texelFetch(uPrev, ivec2(t % SEGW, t / SEGW), 0).xyz;
      vec3 q1 = texelFetch(uPrev, ivec2((t + 1) % SEGW, (t + 1) / SEGW), 0).xyz;
      v0 = p0 - q0; v1 = p1 - q1;
      p0 += v0 * ms; p1 += v1 * ms;
    }
    float r0 = T0.w, r1 = T1.w;
    vec3 bv = p1 - p0;
    float L2 = dot(bv, bv);
    float L = sqrt(L2);
    vec3 mid = 0.5 * (p0 + p1);
    vec3 vv = mid - o;
    float along = max(1.0, dot(vv, uN));
    float mag = uSid / along;
    float pxObj = uMmPx / mag;
    float sigO = thinSigmaPx(along) * pxObj;
    // reject: distance from the pixel-centre ray to the segment axis (clamped), against the larger
    // radius plus 3 sigma of the thin-path PSF plus one pixel of slack for sub-samples
    float br = max(r0, r1) + 3.0 * sigO + pxObj;
    // a ray origin next to the segment (the focal spot is ~1 m away: float32 cancellation)
    vec3 oc = o + dot(vv, dTh) * dTh;
    {
      vec3 q = p0 - oc;
      float bb = dot(bv, dTh);
      float den = max(L2 - bb * bb, 1e-12 * max(L2, 1e-12));
      float sc = L2 > 0.0 ? clamp((bb * dot(q, dTh) - dot(q, bv)) / den, 0.0, 1.0) : 0.0;
      vec3 pp = q + sc * bv;
      float pd = dot(pp, dTh);
      if (dot(pp, pp) - pd * pd > br * br) continue;
    }
    vec4 T2 = texelFetch(uSeg, segCoord(idx, 2), 0);
    int gi = int(T2.w + 0.5);
    vec4 G = texelFetch(uGroup, ivec2(gi % GRPW, gi / GRPW), 0);
    vec3 mu = G.xyz;
    float c0 = T2.x, c1 = T2.y, kk = T2.z;
    vec4 T3 = texelFetch(uSeg, segCoord(idx, 3), 0);
    float eL = length(T3.xyz);
    float sqRatio = 1.0 / sqrt(1.0 + eL);
    float rEqPx = 0.5 * (r0 + r1) * sqRatio * mag / uMmPx;
    float wEx = smoothstep(uThinLo, uThinHi, rEqPx);
    if (uThinHi <= uThinLo) wEx = rEqPx >= uThinHi ? 1.0 : 0.0;
    bool isEdge = false;
    if (wantEdge && wEx > 0.0 && eL == 0.0 && L > 0.0) {
      float featPx = min(min(r0, r1), G.w) * mag / uMmPx;
      float contrast = (abs(mu.x) + abs(mu.y) + abs(mu.z)) * max(abs(c0), abs(c1)) * (r0 + r1);
      if (featPx < uSsFeaturePx && contrast >= uSsMinContrast) {
        vec3 ax = bv / L;
        vec3 q = p0 - oc;
        float bb = dot(ax, dTh);
        float sin2 = max(1.0 - bb * bb, 1e-6);
        float sc = clamp((bb * dot(q, dTh) - dot(q, ax)) / sin2, 0.0, L);
        vec3 pp = q + sc * ax;
        float pd = dot(pp, dTh);
        float dpe = sqrt(max(0.0, dot(pp, pp) - pd * pd));
        float rs = r0 + (r1 - r0) * sc / L;
        float ed = abs(dpe - rs) / pxObj;
        gEdge = min(gEdge, ed);
        isEdge = ed < ${f(EDGE_NONE_PX)};
      }
    }
    // motion test: the middle's screen displacement over the pulse (current positions)
    bool isMoving = false;
    if (wantMove) {
      vec3 mN = 0.5 * (T0.xyz + T1.xyz);
      vec3 hv = 0.25 * uMotionScale * (v0 + v1);
      isMoving = length(projectPx(mN + hv) - projectPx(mN - hv)) > uSsMotionPx;
    }
    bool isListed = isEdge || isMoving;
    if (isListed && classify != 0 && !listOnly) {
      if (gEdgeN < ${EDGE_LIST_MAX}) { gEdgeIdx[gEdgeN] = idx; gEdgeN++; }
      else gEdgeN = ${EDGE_LIST_MAX + 1};
    }
    // sub-samples re-integrate only the listed segments; the others keep their centre value
    if (listOnly && !isListed) continue;
    float value = 0.0;
    vec3 kept;
    vec4 rem;
    if (wEx > 0.0 && chordParts(idx, p0, p1, o, dEx, kept, rem)) {
      float t0 = kept.x, t1 = kept.y, tc = kept.z;
      float sw0 = L2 > 0.0 ? dot(gSw, bv) / L2 : 0.5;
      float sd = L2 > 0.0 ? dot(dEx, bv) / L2 : 0.0;
      float fl = 1.0;
      if (kk > 0.0 && t0 < t1) {
        float bl = length(gSbs);
        vec3 ax = bl > 0.0 ? gSbs / bl : vec3(0.0);
        float h0 = dot(gSws, ax), hd = dot(gSds, ax);
        float A2 = dot(gSds, gSds) - hd * hd;
        float B2 = 2.0 * (dot(gSws, gSds) - h0 * hd);
        float C2 = dot(gSws, gSws) - h0 * h0;
        float mean = A2 * (t0 * t0 + t0 * t1 + t1 * t1) / 3.0 + B2 * (t0 + t1) / 2.0 + C2;
        float sm = clamp(sw0 + sd * 0.5 * (t0 + t1), 0.0, 1.0);
        float R = mix(r0, r1, sm);
        fl = R > 0.0 ? clamp(1.0 - kk * mean / (R * R), 0.0, 1.0) : 1.0;
      }
      float I = 0.0;
      vec4 T4 = texelFetch(uSeg, segCoord(idx, 4), 0);
      vec4 T5 = texelFetch(uSeg, segCoord(idx, 5), 0);
      if (t0 < t1) {
        // kept chord minus the host chords: each slot is empty, one segment, a range of
        // consecutive segments or an extension list (see segmentPack.ts); pieces beyond NPC are
        // dropped (not seen: a convex chord minus nearby capsules leaves one or two pieces)
        vec2 pc[NPC];
        pc[0] = vec2(t0, t1);
        int np = 1;
        subSlot(T4.w, ms, o, dEx, tc, pc, np);
        subSlot(T5.w, ms, o, dEx, tc, pc, np);
        subSlot(T3.w, ms, o, dEx, tc, pc, np);
        for (int q = 0; q < NPC; q++) {
          if (q >= np) break;
          I += concInt(pc[q].x, pc[q].y, sw0, sd, c0, c1);
        }
      }
      // back-fill at planar joints between segments of different taper
      for (int side = 0; side < 2; side++) {
        vec2 m = side == 0 ? rem.xy : rem.zw;
        if (!(m.x < m.y)) continue;
        // only a chain joint (unit normal) has a neighbour; it must exist and share the joint point
        vec3 ownN = side == 0 ? T4.xyz : T5.xyz;
        float nn = dot(ownN, ownN);
        if (nn > 1.21 || nn < 0.81) continue;
        if (side == 0 ? idx == 0u : int(idx) + 1 >= uSegCount) continue;
        uint nb = side == 0 ? idx - 1u : idx + 1u;
        vec4 N0 = texelFetch(uSeg, segCoord(nb, 0), 0);
        vec4 N1 = texelFetch(uSeg, segCoord(nb, 1), 0);
        if ((side == 0 ? N1.xyz : N0.xyz) != (side == 0 ? T0.xyz : T1.xyz)) continue;
        float Ln = length(N1.xyz - N0.xyz);
        if (abs(r0 - r1) / max(L, 1e-9) + abs(N0.w - N1.w) / max(Ln, 1e-9) < uBackfillSlope) continue;
        vec3 q0 = segP(nb, 0, ms), q1 = segP(nb, 1, ms);
        float lo = m.x, hi = m.y;
        vec3 fn = texelFetch(uSeg, segCoord(nb, side == 0 ? 4 : 5), 0).xyz;
        if (fn != vec3(0.0)) {
          vec3 q = side == 1 ? q1 : q0;
          float num = dot(fn, o + tc * dEx - q);
          float den = dot(fn, dEx);
          if (abs(den) < 1e-12) { if (num < 0.0) hi = lo; }
          else if (den > 0.0) lo = max(lo, -num / den);
          else hi = min(hi, -num / den);
        }
        if (!(lo < hi)) continue;
        vec3 nk; vec4 nr;
        float a1 = lo, b1 = hi, a2 = 1.0, b2 = 0.0;
        if (chordParts(nb, q0, q1, o, dEx, nk, nr) && nk.x < nk.y) {
          float na = nk.x + nk.z - tc, nb2 = nk.y + nk.z - tc;
          if (!(nb2 <= lo || na >= hi)) {
            a1 = lo; b1 = min(hi, na);
            a2 = max(lo, nb2); b2 = hi;
          }
        }
        I += (concInt(a1, b1, sw0, sd, c0, c1) + concInt(a2, b2, sw0, sd, c0, c1)) / max(fl, 1e-9);
      }
      value += wEx * fl * I;
    }
    if (wEx < 1.0) {
      float tc = dot(vv, dTh);
      vec3 w = o + tc * dTh - p0;
      value += (1.0 - wEx) * thinValue(w, dTh, bv, L, r0 * sqRatio, r1 * sqRatio, c0, c1, kk, sigO);
    }
    if (value != 0.0) {
      P += mu * value;
      if (isListed) gPedge += mu * value;
      if (wantVel) {
        // screen velocity of the segment middle, pixels per frame, weighted by its attenuation
        vec3 q = mid - 0.5 * (v0 + v1) * (1.0 + ms);
        vec2 sv = projectPx(mid) - projectPx(q);
        float wgt = abs(value) * (abs(mu.x) + abs(mu.y) + abs(mu.z));
        vec4 cv = vec4(sv * wgt, wgt, 0.0) * gVelScale;
        gVel += cv;
        // the centre ray's share from segments the sub-samples will redo
        if (isListed && classify != 0 && !listOnly) gVelList += cv;
      }
    }
  }
  return P;
}

void main() {
  ivec2 pix = ivec2(gl_FragCoord.xy);
  uvec2 th = texelFetch(uTiles, pix / uTile, 0).xy;
  uint cnt = th.y & 0xFFFFFFu;
  uint flags = th.y >> 24;
  frag = vec4(0.0);
  vel = vec4(0.0);
  if (uDebug == 1) { frag = vec4(float(cnt), float(th.x), float(flags), 1.0); return; }
  if (uDebug == 2) {
    // reject stage only: number of segments surviving the bounding-sphere test
    vec3 d = rayDir(gl_FragCoord.xy);
    float n = 0.0;
    for (uint e = 0u; e < cnt; e++) {
      uint li = th.x + e;
      uint idx = texelFetch(uIndex, ivec2(int(li % uint(IDXW)), int(li / uint(IDXW))), 0).r;
      vec4 T0 = texelFetch(uSeg, segCoord(idx, 0), 0);
      vec4 T1 = texelFetch(uSeg, segCoord(idx, 1), 0);
      vec3 mid = 0.5 * (T0.xyz + T1.xyz);
      vec3 vv = mid - uSrc;
      float along = max(1.0, dot(vv, uN));
      float pxObj = uMmPx * along / uSid;
      float br = max(T0.w, T1.w) + 3.0 * thinSigmaPx(along) * pxObj + pxObj;
      vec3 bv = T1.xyz - T0.xyz;
      float L2 = dot(bv, bv);
      vec3 q = T0.xyz - uSrc;
      float bb = dot(bv, d);
      float den = max(L2 - bb * bb, 1e-12 * max(L2, 1e-12));
      float sc = L2 > 0.0 ? clamp((bb * dot(q, d) - dot(q, bv)) / den, 0.0, 1.0) : 0.0;
      vec3 pp = q + sc * bv;
      float pd = dot(pp, d);
      if (dot(pp, pp) - pd * pd <= br * br) n += 1.0;
    }
    frag = vec4(n, 0.0, 0.0, 1.0);
    return;
  }
  if (cnt == 0u) return;
  gVel = vec4(0.0);
  gVelList = vec4(0.0);
  gVelScale = 1.0;
  vec3 dTh = rayDir(gl_FragCoord.xy);
  bool wantVel = uVelocity != 0 && uMotion != 0;
  gEdge = 1e9;
  gPedge = vec3(0.0);
  gEdgeN = 0;
  int classify = ((flags & 1u) != 0u ? 1 : 0) | ((flags & 2u) != 0u ? 2 : 0);
  vec3 Pc = integrate(uSrc, dTh, dTh, 0.0, th.x, cnt, wantVel, classify, false, false);
  bool overflow = gEdgeN > ${EDGE_LIST_MAX};
  float wAA = 1.0 - smoothstep(${f(EDGE_FULL_PX)}, ${f(EDGE_NONE_PX)}, gEdge);
  bool motion = (flags & 2u) != 0u;
  if (uDebug == 4) { frag = vec4(wAA, float(gEdgeN), 0.0, 1.0); return; }
  if (gEdgeN == 0) {
    frag = vec4(Pc, 0.0);
  } else {
    // only the listed segments (edge or moving) are sampled four times; the rest keep the centre value
    vec3 base = Pc - gPedge;
    // velocity: keep the centre ray's unlisted segments; the listed ones are averaged over the
    // same samples as the attenuation
    if (wantVel) gVel -= gVelList;
    vec3 accP = vec3(0.0), accT = vec3(0.0);
    if (wAA <= 0.0 && motion) {
      // moving but no silhouette in the pixel: three time samples (-1/3, 0, +1/3 of the pulse),
      // the centre ray being the middle one
      accP = gPedge / 3.0;
      accT = exp(-uGains * gPedge) / 3.0;
      if (wantVel) gVel += gVelList / 3.0;
      gVelScale = 1.0 / 3.0;
      for (int k = 0; k < 2; k++) {
        float tau = k == 0 ? -1.0 / 3.0 : 1.0 / 3.0;
        vec3 P = integrate(uSrc, dTh, dTh, tau, th.x, cnt, wantVel, overflow ? classify : 0, overflow, !overflow);
        accP += P / 3.0;
        accT += exp(-uGains * P) / 3.0;
      }
    } else
    for (int k = 0; k < 4; k++) {
      float tau = motion ? SS[k].z : 0.0;
      gVelScale = 0.25;
      vec3 P = integrate(uSrc, rayDir(gl_FragCoord.xy + SS[k].xy * wAA), dTh, tau, th.x, cnt, wantVel, overflow ? classify : 0, overflow, !overflow);
      accP += 0.25 * P;
      accT += 0.25 * exp(-uGains * P);
    }
    vec3 r = accP;
    if (uTransAvg != 0) {
      if (uGains.x > 0.0) r.x = -log(accT.x) / uGains.x;
      if (uGains.y > 0.0) r.y = -log(accT.y) / uGains.y;
      if (uGains.z > 0.0) r.z = -log(accT.z) / uGains.z;
    }
    frag = vec4(base + r, 0.0);
  }
  vel = gVel;
}
`;
}
