// ---------------------------------------------------------------------------
// Generator for fixtures.ts: dumps buildAnatomy() for the three root sizes
// (femoral case, no variants) and thorax.aorticCourse() for the three routes,
// rounded to 3 decimals, in the form fixtures.ts holds them.
//
//   FIXTURES_GEN=1 npx vite-node src/physics/fixtures.gen.ts            print a report comparing the live geometry with the frozen fixture
//   FIXTURES_GEN=write npx vite-node src/physics/fixtures.gen.ts        rewrite src/physics/fixtures.ts from the live geometry
//
// Only the vessels the physics uses (lumen.defaultCoronaries: LM, LAD, LCx,
// RCA, CONUS, RAMUS) are kept, plus the scalar fields of the model. After
// rewriting, re-run the manoeuvre tests and the robustness matrix.
// ---------------------------------------------------------------------------

import type { RootSize, Vec3 } from "../types";
import type { AnatomyModel } from "../simulation/anatomy";
import { buildAnatomy } from "../simulation/anatomy";
import { aorticCourse } from "../render/xray/thorax";
import { caseFor } from "./scenarios";
import { fixtureAnatomy, fixtureCourse } from "./fixtures";

const KEEP_VESSELS = new Set(["LM", "LAD", "LCx", "RCA", "CONUS", "RAMUS"]);
const SIZES: RootSize[] = ["small", "normal", "dilated"];
const ROUTES = ["femoral", "radial-right", "radial-left"] as const;

function round(v: unknown): unknown {
  if (typeof v === "number") return Math.round(v * 1000) / 1000;
  if (Array.isArray(v)) return v.map(round);
  if (v && typeof v === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) o[k] = round(x);
    return o;
  }
  return v;
}

/** The fixture form of the live anatomy for one root size. */
export function liveFixtureModel(size: RootSize): AnatomyModel {
  const m = buildAnatomy(caseFor("femoral", size));
  const kept = { ...m, vessels: m.vessels.filter((v) => KEEP_VESSELS.has(v.id)) };
  return round(kept) as AnatomyModel;
}

/** The fixture form of the live aortic course (without its final root point). */
export function liveFixtureCourse(route: (typeof ROUTES)[number]): Vec3[] {
  return round(aorticCourse(route, 1000).slice(0, -1)) as Vec3[];
}

/** Largest coordinate difference (mm) between two models' ostia, vessels and cusps. */
export function modelDifference(a: AnatomyModel, b: AnatomyModel): number {
  let d = Math.abs(a.sinusRadius - b.sinusRadius);
  const pd = (p: Vec3, q: Vec3) => Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y), Math.abs(p.z - q.z));
  d = Math.max(d, pd(a.lm.pos, b.lm.pos), pd(a.rca.pos, b.rca.pos), pd(a.conus.pos, b.conus.pos));
  for (const v of a.vessels) {
    const w = b.vessels.find((x) => x.id === v.id);
    if (!w || w.points.length !== v.points.length) return Infinity;
    for (let i = 0; i < v.points.length; i++) d = Math.max(d, pd(v.points[i], w.points[i]));
  }
  return d;
}

function writeFixtures(): string {
  const FIX: Record<string, AnatomyModel> = {};
  for (const s of SIZES) FIX[s] = liveFixtureModel(s);
  const COURSE: Record<string, Vec3[]> = {};
  for (const r of ROUTES) COURSE[r] = liveFixtureCourse(r);
  const date = new Date().toISOString().slice(0, 10);
  return `// ---------------------------------------------------------------------------
// Frozen geometry for the physics regression tests and the bench.
//
// The manoeuvre tests assert outcomes of a chaotic mechanical system (a
// preformed rod finding its place in a root); small edits to the shared
// anatomy (anatomy.ts) or aortic course (thorax.ts) by other streams can move
// a scripted trajectory onto another branch. The tests therefore run on this
// snapshot of buildAnatomy() (normal/small/dilated roots, no variants) and of
// thorax.aorticCourse(), taken on ${date}. Generated, not hand-edited:
//   FIXTURES_GEN=write npx vite-node src/physics/fixtures.gen.ts
// The robustness matrix (robustness.ts) runs the same manoeuvres on the live
// geometry as well.
// ---------------------------------------------------------------------------

import type { Vec3, RootSize } from "../types";
import type { AnatomyModel } from "../simulation/anatomy";

const FIX: Record<RootSize, AnatomyModel> = ${JSON.stringify(FIX)} as unknown as Record<RootSize, AnatomyModel>;

const COURSE: Record<"femoral" | "radial-right" | "radial-left", Vec3[]> = ${JSON.stringify(COURSE)};


/** A deep copy of the frozen anatomy for a root size. */
export function fixtureAnatomy(size: RootSize = "normal"): AnatomyModel {
  return JSON.parse(JSON.stringify(FIX[size])) as AnatomyModel;
}

/** The frozen aortic course (same contract as thorax.aorticCourse). */
export function fixtureCourse(route: "femoral" | "radial-right" | "radial-left", yTop: number): Vec3[] {
  return [...COURSE[route].map((p) => ({ ...p })), { x: 0, y: yTop, z: 0 }];
}
`;
}

const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
const mode = proc?.env?.FIXTURES_GEN;
if (mode) {
  for (const s of SIZES) {
    const d = modelDifference(liveFixtureModel(s), fixtureAnatomy(s));
    console.log(`${s} root: largest difference live vs frozen ${d.toFixed(3)} mm`);
  }
  for (const r of ROUTES) {
    const a = liveFixtureCourse(r), b = fixtureCourse(r, 1000).slice(0, -1);
    const d = a.length !== b.length ? Infinity : Math.max(...a.map((p, i) => Math.max(Math.abs(p.x - b[i].x), Math.abs(p.y - b[i].y), Math.abs(p.z - b[i].z))));
    console.log(`${r} course: largest difference ${d.toFixed(3)} mm`);
  }
  if (mode === "write") {
    // Node built-ins, loaded by name so the browser build and the app's type check do not see them
    const fsName = "node:fs", pathName = "node:path";
    const fs = (await import(/* @vite-ignore */ fsName)) as { writeFileSync(p: string, s: string): void };
    const path = (await import(/* @vite-ignore */ pathName)) as { resolve(...p: string[]): string; dirname(p: string): string };
    const out = path.resolve(path.dirname(new URL(import.meta.url).pathname), "fixtures.ts");
    fs.writeFileSync(out, writeFixtures());
    console.log(`wrote ${out}`);
  }
}
