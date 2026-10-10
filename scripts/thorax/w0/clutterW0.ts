// Frozen wave-0 copy for the S4 harness baseline (development only).
// ---------------------------------------------------------------------------
// Anatomical background texture ("clutter") for the anatomy pass.
//
// The anatomy pass solves the large organs exactly; real thoraces also carry
// fine structure (lung vascular markings, interstitium, fat planes, muscle)
// that gives a real fluoroscopy frame its texture. This module supplies that
// term as GLSL, called once per detector ray from ANAT_FS:
//
//   float clutter(vec3 ro, vec3 rd, vec2 bodyIv, float lungPath)
//
//   ro, rd     ray origin (focal spot) and unit direction, patient frame (mm)
//   bodyIv     (tIn, tOut) of the ray through the body
//   lungPath   aerated lung path length on this ray (mm, after carving)
//
// It returns an additive line-integral increment (dimensionless, like P).
// Owned by the thorax/background stream; the renderer only includes it.
// ---------------------------------------------------------------------------

export const CLUTTER_GLSL = `
float h3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n3(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { return 0.5 * n3(p) + 0.25 * n3(p * 2.03) + 0.125 * n3(p * 4.01) + 0.0625 * n3(p * 8.05); }

// tissue heterogeneity fixed to the patient, sampled at the middle of the body path
float clutter(vec3 ro, vec3 rd, vec2 bodyIv, float lungPath) {
  if (bodyIv.y <= bodyIv.x) return 0.0;
  vec3 mid = ro + rd * (0.5 * (bodyIv.x + bodyIv.y));
  float tex = fbm(mid * 0.035) - 0.47 + 0.6 * (fbm(mid * 0.11 + 3.1) - 0.47);
  return 0.11 * tex + 0.05 * (fbm(mid * 0.33) - 0.47) * (lungPath > 1.0 ? 1.0 : 0.3);
}
`;
