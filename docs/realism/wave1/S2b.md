# S2b: analytic vessel and device integrator

Stream S2b replaces the CPU ribbon approximation (`XrayRenderer.buildTubes`) for vessels,
catheters, wires and devices. It adds an exact GPU line integrator, delivered as the
`AccumulationPass` named `"segments"`, and a PSF-consistent thin-object pass named `"thin"`.
Both live in `src/render/xray/segments/`. Nothing outside that folder was edited, in either
round. The integration steps below are for the owners of `sceneBuilder.ts`, `XrayRenderer.ts`
and the components that create the renderer.

Status: complete and verified on unit tests, on a GPU-against-CPU comparison and on A/B
captures of the PCI scenario. It is off by default behind a feature flag (`segmentsEnabled()`).

## Second round (response to the adversarial review, 5 October 2026)

| Review item | Severity | What changed |
|---|---|---|
| Union fails at some branch origins: 3 fixed host slots | medium | A host slot now holds a single segment, a range of up to 31 consecutive segments, or a reference to an extension list. A branch's first segments (up to 16) carry the whole run of parent segments they overlap, found by scanning outward from the branch point until 3 consecutive misses. The longest run measured on three trees is 8 segments. A new family pass (below) covers every other overlap inside a vessel tree. |
| Real-tree error understated; the test checked only median and p95 | medium | The tests now report and bound p99 and the worst ray, and classify every ray over 1 %. A new test casts three rays through the first segments of every branch. The diagnosis of the earlier tails is below, with the old figures. |
| Back-fill reads segment -1 or an unrelated neighbour | low | Joint planes made by `addChain` have unit normals; planes given to `addSegment` are stored at length `USER_PLANE` (3) and cut ends at `FLAT_END` (2). Back-fill runs only for unit normals, only when the neighbour index exists (`uSegCount` on the GPU), and only when the neighbour's end point equals this segment's start point. A test feeds unit planes at index 0 and at the last index: no NaN. |
| Velocity dropped unlisted segments at sub-sampled pixels | low | The centre ray's velocity from listed segments is kept separately and subtracted (`gVelList`), as with the attenuation. The listed segments' velocity is then averaged over the same sub-samples as their attenuation, not taken from one sub-sample. |
| Binning 4.09 ms for 30k segments; test bound too loose; no pre-cull | low | Per-tile counts and flags now come from 2D difference arrays, so tile entries are walked once. A block pre-cull skips runs of 32 consecutive segments whose box projects off the detector. It is adaptive, because it costs about a fifth of the binning when everything is on screen. The test now bounds the time as a ratio to a minimal reference loop: 5.3-5.6 measured, bound 10. |

### Why the earlier real-tree tails were large

I re-ran the old code against a whole-family reference on the tree as it stood that morning
(228 vessels). One ray went through the first two segments of each of 225 branches, 438 rays in
all:

| | Rays | p95 | p99 | Worst |
|---|---|---|---|---|
| Old code | 438 | 1.08 % | 3.13 % | 20.8 % (and -20.4 %) |
| Host ranges alone, before the family pass | 450 | 1.04 % | 10.9 % | 43 % |

The second row is worse because, once the origins were fixed, crossing siblings took over the
tail. The causes split three ways:

1. **Siblings and cousins that run into each other away from their origins.** These caused
   every ray over 5 %. In that run they were mostly the PDA twigs, where PDA-twig3, -twig1 and
   -twig0 pass through PDA-twig5 and PDA-twig0 several segments past both origins. The old code
   only linked siblings that left from the same parent sample. These are generator artefacts,
   but the integrator should still not paint them as dark blobs. The family pass now unites
   them.
2. **Origin double counting from the 3-slot limit.** This was the reviewer's diagnosis. It
   produced errors of a few per cent, and it is gone with the host ranges.
3. **The reference itself.** The old test marched at 0.05 mm. That is up to a third of the
   radius of the small twigs (0.16-0.25 mm), so two boundaries could fall in one step near a
   joint. I re-marched every ray that disagreed by more than 1 % at 8 times finer steps; on
   every one of them, the integrator matched the finer reference. Examples:
   - D1: coarse 0.1657, fine 0.16309, integrator 0.1631.
   - OM3-twig1: coarse 0.0324, fine 0.03101, integrator 0.0310.

   The reference now steps at no more than 0.12 of the smallest nearby radius. Any ray that
   still disagrees by more than 0.5 % is re-marched 8 times finer.

The reviewer's "worst 28.986 %" came from the old test. It mixed all three causes. It also
skipped crossings only between unrelated vessels, so crossing siblings counted as errors.

### For S3b (tree generator)

The integrator now unites these overlaps, so they no longer show as dark blobs, but they are not
anatomical. These counts are from scratch vitest runs on 5 October 2026 over `CASE_LIBRARY[0..2]`.

- **Re-entry.** Each tree has 5-7 branches that leave their parent's lumen and re-enter it more
  than 4 samples past the origin. Examples: case 0 RCA-twig0 segment 12 enters the RCA at sample
  122 (origin 105); OM1-twig2 segment 18 enters OM1 at sample 33 (origin 11). Case 1:
  LAD-twig1 segment 15 enters the LAD at sample 84 (origin 63).
- **Interpenetration.** Each tree has 29-37 pairs of family members that are not parent and
  child but whose axes pass within 0.9 of the larger radius of each other. Examples: case 0 D1
  sample 59 and OM1 sample 43; D2[30] and OM1-twig4[15]; LAD[72] and LAD-twig1-twig0[0] (a
  grandchild that starts inside the LAD lumen). Case 2: RCA[103] and RCA-twig0-twig0[2].

The reviewer's examples (LAD-twig1 segment 8, RCA-twig1 over RCA segments 118-121) came from an
earlier version of the tree. The tree changed several times during this round under concurrent
edits.

## Files and public API

| File | Contents |
|---|---|
| `segments/segmentPack.ts` | Packed format (24 floats, 6 RGBA32F texels per segment) and host-slot encoding: `encodeHostRange`, `encodeHostExt`, `decodeHostSlot`, `expandHostSlot`, `HOST_RANGE_MAX` (31), `HOST_EXT_MAX` (15), `HOST_SLOT_OFFSETS`. `SegmentBatchBuilder`: `addGroup`, `addSegment` (options `hosts`, `hostRanges`, planes stored at `USER_PLANE`), `addChain`, `setHosts`, `setHostRange`, `setHostList`, `hostsOf`, `hostList`, `finish`. `tubesToSegments(tubes, opts)` with new options `familyUnion` (default true) and `topologyFrom`. `segmentsFromScene(scene, opts)`. Types `SegmentBatch` (new optional `hostExtra`, `topologyKey`, `unresolvedOverlaps`), `SegmentGroup`, `SegmentMotion`, `ChainOptions`. Constants `FLAT_END`, `USER_PLANE` |
| `segments/tileBinner.ts` | `binSegments(batch, cam, res, config?, reuse?) -> TileBins` (16 px tiles, per-tile flags, stats); `FLAG_SS`, `FLAG_MOTION`; `binnerOptions.preCull` ("auto", "on", "off": development and tests) |
| `segments/segmentPass.ts` | `SegmentPass` (`AccumulationPass`, name `"segments"`, reads `extra.segments`); `createSegmentPass(config?)`; `SEGMENTS_KEY`; options `timing`, `velocityTarget`, `debug`; `lastStats`, `lastBins`, `velocityTexture`. It uploads `hostExtra` as a seventh texture when present |
| `segments/segmentGlsl.ts` | `SEG_VS`, `segFragmentSource()`: the shader, mirroring the CPU reference |
| `segments/thinPass.ts` | `ThinPass` (name `"thin"`, reads `extra.thin`); `createThinPass(psf?)`; `ThinPrim {p0, p1, r, mu, blurPx?}`; `packThin(prims)` (unchanged) |
| `segments/thinLut.ts` | Thin profile LUT (`buildThinLut`, `thinLookup`, `thinProfileExact`), `erfApprox`, `PsfParams`, `DEFAULT_PSF`, `thinSigmaPx`, `THIN_GLSL` (unchanged) |
| `segments/integrator.ts` | CPU reference: `roundConeInterval`, `integrateRay`, `integratePixel`, `thinValue` |
| `segments/config.ts` | `SegmentConfig`, `DEFAULT_CONFIG`, `withDefaults`, `camInfo`, `rayThroughPixel`, `SUBSAMPLES`, edge-band constants, `segmentsEnabled()` feature flag (unchanged) |
| `segments/types.ts`, `segments/index.ts` | Type aliases and the barrel export (unchanged; `export *` carries the new names) |
| `segments/testUtil.ts` | Test-only helpers (brute-force membership, boundary-refined ray marching, cameras). Not exported from `index.ts` |
| `segments/segments.test.ts` | 34 vitest tests (CPU), about 13 s |
| `segments/demo/index.html`, `demo/demo.ts` | Development A/B page at `/src/render/xray/segments/demo/index.html`, scriptable through `window.__s2b`. New: `extCheck()`, `velCheck()`, and `perf()` now reports the conversion time with `topologyFrom` |
| `docs/realism/facts/S2b.md` | Sources, measurements and model parameters |

Compatibility: every earlier export keeps its name and signature. Two behaviours changed:

- `hostsOf` returns raw slot values, which may now encode ranges; `hostList` decodes them.
- `setHosts(i, a, b)` still writes single hosts.

No file outside the folder imports from it yet.

## Method

### Geometry: exact chords through round cones

Each segment is a round cone: the convex hull of two spheres (p0, r0) and (p1, r1). A ray's chord
through it is solved in closed form. The solid is the union of the two spheres and the frustum
tangent to both. That union is convex, so the chord is [min entry, max exit] over the three
pieces. The frustum test is a quadratic restricted to the slab between the tangent circles.
Origins are re-centred next to the segment first, because the focal spot is about 1 m away and
float32 would otherwise cancel.

- End caps are spherical: a ray along the axis gets L + r0 + r1, and an end-on segment is a
  round disc. There are no square caps.
- An elliptical section (flattened ribs) is an affine stretch along the thin axis. The ray
  parameter is unchanged by the stretch, so the chord stays exact.

### Union without double counting, and no per-pixel lists

The plan's per-pixel sorted interval lists were built and verified in round one (worst 0.1 %
against ray marching). On the GPU they cost 6.2 ms against 1.4 ms without them. The union is
therefore built into the geometry: each segment adds its clipped chord minus the clipped chords
of its host segments.

Subtracting several hosts' kept chords one after another removes their union, whether or not
they overlap one another. A pixel then has no list to overflow.

- **Chain joints.** Consecutive segments are cut by the plane bisecting the joint, so they
  partition the chain's solid. This is exact for a locally constant radius and a bend gentle
  enough for the radius. A joint gets no plane if either:
  - the bend is tight: r tan(theta/2) exceeds 0.5 of the shorter segment, or
  - the radius steps by more than 15 %.

  There, the later segment removes the earlier segments it overlaps across that joint, up to 8
  back, as one range in slot C. Segments in that range that share a plane with it add nothing,
  because their kept chords lie on the other side of the shared plane.
- **Taper back-fill.** At a chain joint between segments of noticeably different taper (slope
  sum above 0.05), the sliver the plane cuts off is added back where the neighbour does not
  cover it. Only chain joints qualify (see the review table).
- **Branch origins (slot A).** Up to 16 of a branch's first segments, while they overlap the
  parent, remove the whole run of parent segments they overlap. The run is found by scanning
  outward from the branch point in both directions until 3 consecutive segments miss.
- **Vessel families (slot B, then A, then an extension list).** A family is a tree joined by
  branch links. Each segment has a priority: tree depth of its tube, then tube index, then
  segment index. A segment removes the overlapping segments of higher priority that it does not
  already name. Up to two runs go in its free slots; more go into an extension list:
  `SegmentBatch.hostExtra`, four slot values per texel, ended by -1, at most 15 values.
  - Host relations always point to higher priority, so they cannot form a cycle. Every point
    inside several members of a family is then counted exactly once, by its highest-priority
    member.
  - This covers siblings and cousins that run into each other, branches that re-enter their
    parent beyond the origin, and twigs that reach their grandparent.
  - Different families (left and right coronary trees, catheter, wire) and different materials
    still add, as do coaxial overlays (coil over wire core, calcium on lumen points, stent
    shells) and shells.
  - `batch.unresolvedOverlaps` counts any pair left over. It was 0 on all three trees and on the
    PCI scene.
- **Branch detection.** `tubesToSegments` uses `parentOf` when given; otherwise it finds
  branches automatically. A branch is a tube that starts within 0.1 mm of another tube's
  sample, has the same material, and then leaves that tube.
- **Hollow shells.** Catheter walls, stent sleeves and calcium rims are an outer chain plus an
  inner chain of opposite sign on the same points: analytic outer-minus-inner. Shell tubes are
  cut flat at their ends (`flatEnds`), giving an open ring at the tip rather than a dome.
- **Host-slot format.** A slot holds -1, a single index, -2 - (first x 32 + count - 1) for up
  to 31 consecutive segments, or -2 - (k x 32 + 31) for the extension list at texel k. This is
  exact in float32 up to 524,288 segments.
- **Shader buffer.** It keeps up to 6 chord pieces after subtraction (`NPC`); one or two occur.

### Reusing the topology between frames

The branch and family host slots (A, B and the extension lists) depend on the tree's layout,
not on its small frame-to-frame motion. `tubesToSegments(tubes, { topologyFrom: prevBatch })`
reuses the previous batch's slots when `topologyKey` matches: same tubes, point counts and
materials. Chain joints and their slot C are always recomputed, because they depend on the
current bend.

On the real tree in Node this cuts the conversion from 3.0-4.1 ms to 0.85-0.9 ms. The caller
should drop `topologyFrom` when the lumen changes (stent, balloon, lesion edit), since radii
change without changing point counts. In practice that means reusing it only while the tree
object is the same.

### Concentration

- c is linear in the clamped axial coordinate (caps carry the end value). It is integrated
  exactly as trapezoids, broken where c clamps.
- A laminar factor is the mean of (1 - k rho^2 / R^2) over the chord. The closed form for a
  cylinder chord is 2h(1 - k(d^2 + h^2/3)/R^2) (tested).
- Material is per group: `mu = (R bone/soft, G iodine, B metal)` per unit c.
- Inside an overlap, the highest-priority member's concentration is used.

### Thin path, anti-aliasing, motion

These are unchanged from round one, apart from the velocity fix.

- **Thin path.** It applies under a 1.0 px projected equal-area radius, with a smoothstep blend
  to 1.5 px. It is the cylinder chord convolved with a Gaussian PSF (from a lookup table),
  times erf windows along the axis. It conserves the integral and stays continuous along a
  chain.
  - sigma_tot^2 = sigma_aa^2 + sigma_focal(z)^2 + sigma_extra^2.
  - sigma_aa = 0.5 px (model parameter).
  - sigma_f = 0.154 mm, from IEC 60336 and a 0.6 nominal spot (facts file).
- **Anti-aliasing.** It applies to small, high-contrast exact features. The binner flags their
  tiles; the centre ray lists the segments whose silhouette crosses the pixel; four
  rotated-grid rays re-integrate only those. The offsets are scaled by a weight that falls from
  1 at 0.35 px to 0 at 0.75 px from the silhouette.
- **Motion.**
  - Segments are extrapolated within the pulse: p + (p - q) tau pulse/dt.
  - Segments moving more than 0.5 px are sampled at tau = -1/3, 0 and +1/3, or with the
    rotated-grid samples at edges.
  - Velocity is accumulated as (vx w, vy w, w) into a pass-owned RGBA16F target (MRT 1), and
    resolved into the renderer's RG16F buffer when `velocityTarget` is set.

### Binning

- The CPU projects each segment's end spheres (and, with motion, their positions at both ends of
  the pulse). It enlarges them by 5 % plus 1 px, adds the thin-path margin, and lists the box in
  every 16 px tile it touches.
- Per-tile counts and flags come from 2D difference arrays: four writes per segment, whatever its
  footprint. The index is then filled in a single walk of the entries.
- Blocks of 32 consecutive segments whose 3D bounding box projects entirely off the detector are
  skipped. The margin is the radius, the intra-pulse displacement, the thin blur and 16 px.
- When a pre-cull removes less than 1/16 of the blocks, it is skipped for the next 15 calls.
  Correctness never depends on it: a test checks identical bins with it on and off for zoomed,
  off-centre and moving views.
- There is no per-tile limit. The total is capped at `capacity`; beyond it, tile lists are
  truncated in tile order and counted in `stats.dropped`.

## Verification

Run `npx vitest run src/render/xray/segments/`: 34 tests, all pass, about 13 s.

The reference is boundary-refined ray marching (`testUtil.march`). Its step is at most 0.12 of
the smallest nearby radius, and any disagreement over 0.5 % is re-marched 8 times finer.

| Test | Result |
|---|---|
| Round cone against brute-force membership (300 random cones, 1,200 rays from 400 mm) | chord length within 0.5 % beyond sampling resolution |
| End caps: axis, parallel and perpendicular rays | exact (1e-9) |
| Random vessel trees (60 scenes, taper, bends, branches), constant concentration per tree: pure geometry | 194 rays: median 0.000 %, p95 0.002 %, p99 0.098 %, **worst 0.141 %** |
| The same trees with concentration drifting along the vessels | p95 0.063 %, p99 1.86 %, worst 2.04 %. This tail is attribution, not geometry: inside an overlap the integrator uses the higher-priority member's concentration, the reference the nearer axis's |
| Straight chain equals one capsule (200 rays) | 1e-6 |
| Bent constant-radius arc | under 0.5 % |
| Bifurcation origin: no dark dot (straight through the origin, at most the larger chord + 1 %), no gap; separate tubes do double count | pass |
| **Real coronary tree, random rays** (CASE_LIBRARY[0], the tree's own parent links, constant concentration, 1,500 rays aimed within 1.5 mm of tree points). Reference: one union per family, families add. Every ray over 1 % is classified: joint partition, or through an unresolved overlap (excluded and counted) | 814 rays: median 0.000 %, p95 0.164 %, **p99 0.377 %, worst 0.478 %**; 0 rays over 1 %; `unresolvedOverlaps` 0. Bounds: p99 under 2 %, worst under 5 %, at most 3 unresolved |
| **Real coronary tree, branch origins** (three rays through the first and second segments of every branch) | 681 rays: median 0.000 %, p95 0.179 %, **p99 0.389 %, worst 0.489 %**. Bounds: p95 under 1 %, p99 under 2 %, worst under 4 % |
| Crossing siblings (children that cross 10 mm above their parent), with tubes in parent-first and children-first order | worst under 0.5 % against marching; without the family pass the crossing double counts |
| `topologyFrom` | identical packed data to a fresh conversion when the layout is unchanged; recomputed when it changes |
| Host-slot encoding (singles, every range length, extension references, at the float32 limit) | exact |
| User planes at index 0 and at the end, with back-fill forced on | finite, no neighbour read |
| Extension list naming five hosts | under 0.3 % against marching |
| 300 segments on one pixel | exact sum |
| Hollow shell, open tube, elliptical sections, laminar chord | 1e-6 / exact / under 1 % / 1e-6 |
| Thin path: erf, lookup table, integral conservation, 0.014 inch wire beading, focal sigma | unchanged, pass |
| Binner brute force: no pixel missing a contributing segment | 0 missing |
| Pre-cull: identical header and index with it on and off (zoomed, off-centre, moving) | pass, and at least one view culled |
| Capacity overflow: drop count exact, no out-of-range index | pass |
| Binning 30,253 segments (153,020 entries) | median 2.18-2.54 ms on this shared machine; **ratio to a minimal reference loop 5.3-5.6**, bound 10 |

Browser checks (demo page, own tab, closed after; Chromium on the M-series Mac, 768 px; the
GPU was shared with other agents' tabs):

- **GPU against the CPU reference**, 3,000 sampled pixels of the PCI scene:
  - The scene has 5,543 segments; 75 extension-list texels are in use.
  - Worst relative error 0.22 %, 0 samples over 1 %.
  - With systolic motion: 0.13 %. Balloon in LAO caudal: 0.22 %. Vessels only (2,655
    segments): 0.42 %.
  - `extCheck()`, a synthetic family that needs 21 extension texels: 0.12 %, 0 unresolved.
- **Velocity** (`velCheck()`), at systole with a median moving speed of 18 px/frame:
  - Pixels in unflagged tiles match the CPU attenuation-weighted reference exactly (median and
    p95 0 px).
  - Pixels in flagged tiles: median 0, p95 0.48 px, p99 1.69 px. These pixels average the listed
    segments over the sub-samples, so they differ from the centre-ray reference by design.
  - With the review's minimum fix (one sub-sample), p95 was 0.93 px and p99 2.20 px.
- **Thin pass**, 2,162 primitives: wire beading 0.08 %, per-column integral 1.087 against
  1.0864 expected, GPU against CPU 0.10 %.
- **A/B capture** `datasets/tmp/captures/s2b-v2-raocra-stent-{A,B,diff,crop0-A,crop0-B}.png`
  (LAD PCI, RAO cranial, stent, cine at 2.2 s). Mean absolute difference 0.54 grey levels;
  4,338 pixels differ by more than 8 levels, at the former square ends and broken joints. The
  round-one captures `s2b-raocra-stent-*` remain.

### Performance

M-series laptop GPU, 768 x 768. GPU time is from `benchGpu()`: five draws per sync, minimum and
median of 20 iterations, sync overhead removed.

The timer query and the readback difference in `perf()` read 12-13 ms and 5-7 ms in this round.
Under the GPU sharing that was present they include other tabs' work, so they are not used.

"Vessels" means the tree, catheter, wire and stent: 2,655 segments, the production scope once S4
draws the thorax. "All" adds the ribbon thorax: 5,543 segments.

| Item | Vessels | All |
|---|---|---|
| GPU, anti-aliasing on | min 1.8-2.5 ms, median 2.0-3.3 ms | min 3.5-3.7 ms, median 3.7 ms |
| GPU, anti-aliasing off | 0.8 ms | not measured this round (1.7-2.0 ms in round one) |
| GPU at 1024 px | not measured this round | 4.7-4.8 ms |
| GPU with systolic motion | 4.7-5.1 ms | not measured |
| CPU `tubesToSegments`, fresh (automatic branch search plus family pass), browser | 1.1 ms | 6.1 ms |
| The same with `topologyFrom` | 0.6 ms | 1.3 ms |
| CPU `tubesToSegments`, real tree in Node (5,256 segments, `parentOf`) | fresh 3.0-4.1 ms; with `topologyFrom` 0.85-0.9 ms; family pass off 1.0-1.1 ms | |
| CPU binning (browser, median) | 0.3 ms | 0.5 ms |
| Whole `render()` CPU, segment pass against ribbon tubes (median, same scene) | 2.5 ms against 3.2 ms | 1.5 ms against 3.0 ms |
| Thin pass, 2,162 primitives | 0.50-0.52 ms per draw | |

The 15 frames/s requirement holds with a wide margin. The family pass and the host ranges add no
GPU cost I could separate from run-to-run noise: round one measured 1.3-2.7 ms (vessels) and
2.2-3.9 ms (all) under similar sharing.

## Integration steps (for the owners of shared files)

### 1. `src/render/xray/sceneBuilder.ts` (S5)

Emit `extra.segments` behind the flag; the thorax stays where it is.

```ts
// imports
import { tubesToSegments, segmentsEnabled, type SegmentBatch } from "./segments";
import type { TreeVessel } from "./coronaryTree";

// SceneInput: optional override of the flag (tests, the demo)
  /** draw vessels, catheters, wires and devices with the analytic segment pass (default: segmentsEnabled()) */
  segments?: boolean;

// module level: the previous frame's moved tubes, time and batch, per tree (motion blur,
// velocity, and reuse of the branch topology while the tree object is the same)
const prevSeg = new WeakMap<CoronaryTree, { tubes: TubeSpec[]; t: number; batch: SegmentBatch }>();

// in buildXrayScene, before the coronary loop
const firstNonThorax = tubes.length; // thorax tubes come first; they stay on ribbons / S4's pass
const vesselOfTube = new Map<TubeSpec, TreeVessel>();
const tubeOfVessel = new Map<string, TubeSpec>();

// in the coronary loop, replace the push
if (opac || retro) {
  const tube = { pts, r: v.radii, mu: muArr };
  vesselOfTube.set(tube, v);
  tubeOfVessel.set(v.name, tube);
  tubes.push(tube);
}

// at the end, replace the return
const useSeg = inp.segments ?? segmentsEnabled();
let outTubes = tubes;
const extra: Record<string, unknown> = {};
if (useSeg) {
  const moved = tubes.slice(firstNonThorax);
  outTubes = tubes.slice(0, firstNonThorax);
  const index = new Map(moved.map((t, i) => [t, i]));
  const prev = prevSeg.get(inp.tree);
  const dt = prev ? inp.t - prev.t : 0;
  const batch = tubesToSegments(moved, {
    // exact branch topology from the tree (the automatic search remains for devices)
    parentOf: (t) => {
      const v = vesselOfTube.get(t);
      if (!v) return undefined;
      const pt = v.parent ? tubeOfVessel.get(v.parent.name) : undefined;
      return pt && index.has(pt) ? { tube: index.get(pt)!, at: v.parent!.index } : null;
    },
    prevTubes: prev && dt > 0 && dt < 0.2 ? prev.tubes : null,
    motion: prev && dt > 0 && dt < 0.2 ? { dtS: dt, pulseS: (params.pulseWidthMs ?? 8) / 1000 } : null,
    gains: [1, params.iodineGain, params.metalGain],
    // same tree object => same layout: reuse branch and family host slots (falls back by itself
    // when the layout key differs, e.g. a device was added)
    topologyFrom: prev?.batch ?? null,
  });
  extra.segments = batch;
  prevSeg.set(inp.tree, { tubes: moved, t: inp.t, batch });
}
return { scene: { cam, anat: thorax.anat, bones, tubes: outTubes, extra }, params, resp, contraction: e };
```

Notes:

- `parentOf` indices refer to the parent tube's points. If sceneBuilder renders the parent's
  densely resampled `fine` copy, convert `v.parent.index` with `fine.baseIndex`, which is
  fractional: take the first fine sample whose `baseIndex` is at least that index.
- The `WeakMap` is keyed by the tree object. `buildCoronaryTree` makes a new tree on every lumen
  change, so `topologyFrom` is dropped exactly when radii may have changed.
- `prevTubes` are matched by index and sample count; unmatched tubes simply have no motion.
- `pulseWidthMs` defaults to 8 ms until S6 supplies it (model parameter, plan S2b task 4).
- Laminar profile: pass `laminar: (t) => k` once S5's transport supplies k.
- When S5 builds segments directly with `SegmentBatchBuilder.addChain`, call
  `setHostRange(seg, 0, parentFirst, count)` on a branch's first segments. Without that, there
  is no family pass; `tubesToSegments` does both.

### 2. Components that create the renderer (`AngioPci.tsx` PciFluoro, `FluoroView.tsx`; S10)

Right after `xr.resize(...)`:

```ts
import { createSegmentPass, createThinPass, segmentsEnabled } from "../../render/xray/segments";
...
if (segmentsEnabled()) {
  const seg = createSegmentPass({ velocity: true });
  seg.velocityTarget = () => xr.getVelocityTarget();
  xr.addPass(seg);
  xr.addPass(createThinPass()); // reads extra.thin when a stream supplies ThinPrims
}
```

### 3. `src/render/xray/XrayRenderer.ts` (S2)

- No change is needed to run the passes; `addPass` and the extra-pass slot already exist. The
  pass now binds texture units 0-6 and restores unit 0 as active.
- Once the flag defaults on and S4 has moved ribs, cartilage and lung vessels to its own pass,
  delete these: `buildTubes`, `TUBE_VS/TUBE_FS`, the tube VAO and buffers, and the
  `// ---- 3. tubes` block.
- The accumulation target is RGBA16F, which is enough for path integrals of a few units.
- MTF interplay: thin objects carry sigma_aa = 0.5 px. When S2's MTF fit is done at library
  scale, set `DEFAULT_PSF.sigmaAaPx` (or pass `psf` in the config) so that
  sigma_aa^2 + sigma_MTF^2 matches the measured thin-line FWHM.

### 4. Flag

Turn it on with `?segments=1` in the URL or `localStorage["cathmaster.xraySegments"] = "1"`; turn
it off with `=0`. To make it the default, call `segmentsEnabled(true)` in steps 1 and 2.

### 5. Thin primitives (S14 struts, markers and coils; S4 sternal wires and leads)

Put `extra.thin = packThin(prims)`, or the `ThinPrim[]` array, on the scene. Each `ThinPrim`
`{p0, p1, r, mu, blurPx?}` adds mu pi r^2 L, blurred by the PSF.

## Known limitations

- **Unions stop at families.** Different families add where they intersect in 3D: the left and
  right trees at the apex, or a vessel and a catheter of the same material key (catheters are
  metal or iodine-filled shells). A per-ray union of arbitrary solids would need the round-one
  per-pixel interval lists, at about 4 times the GPU cost.
- **Concentration attribution.** Inside an overlap, the higher-priority member's concentration
  is used. With concentration drifting along vessels this differs from nearest-axis attribution
  by up to 2 % of a ray's integral (random-tree test). With equal concentrations it is exact.
- **Capacity limits.** An extension list holds 15 slot values; past that, overlaps are counted
  in `unresolvedOverlaps` and add. The longest list on five coronary trees (`CASE_LIBRARY[0..4]`)
  was 3 values. The PCI scene, whose thorax includes the lung-vessel trees, used 75 extension
  texels with nothing unresolved.
- **Back-fill threshold.** At planar joints between gently tapering segments (slope sum under
  0.05) the plane's sliver is not back-filled. That error did not show on the real tree: no ray
  over 1 % after re-marching.
- **Thin and exact paths.** They differ slightly in the 1.0-1.5 px blend band, because the thin
  path includes the focal and anti-aliasing blur. The integral is conserved either way.
- **Anti-aliasing scope.** It covers round exact segments only. Flattened ribs take one ray.
- **Thin segments and unions.** They do not take part in host subtraction. Their erf windows
  telescope along a chain.
- **Out of scope here.**
  - There is no advected noise texture (plan task 3); axial streaming is carried by S5's
    per-sample concentrations.
  - The w80/w20 profile and catheter-depth targets need S2's MTF and S5's transport; per critique
    A.2 they are post-integration measurements.
  - Deleting `buildTubes`, and the cath.py and RCA-blur captures, wait for the flag to default
    on (critique C8).
- **Motion cost.** Motion costs about 2.5-3 ms extra GPU at systole, above the plan's 1 ms,
  because nearly every vessel segment moves 2-4 px within an 8 ms pulse. Turn it off per profile
  with `ssMotionPx: Infinity`.
- **Timing conditions.** Timings were taken with about ten other agents sharing the machine and
  the GPU, and were not measured on a non-Apple GPU.

## Facts file

`docs/realism/facts/S2b.md` holds:

- IEC 60336 clause 8.2 and Table 3, with the URL opened;
- DOI 10.1117/1.JMI.11.4.045502 for the 0.6 mm cardiac focal spot;
- Abramowitz and Stegun 7.1.26 for erf, verified numerically;
- the coronary-tree measurements: round one, plus this round's parent-run lengths, family-pass
  counts, re-entry and interpenetration counts;
- the table of model parameters, including this round's additions (`CHAIN_HOST_BACK`,
  `BRANCH_SEGS_MAX`, `BRANCH_SCAN_GAP`, `FAMILY_CELL_MM`, the host-slot format limits, `NPC`, the
  pre-cull constants).
