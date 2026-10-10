// Analytic vessel and device integrator (stream S2b). See docs/realism/wave1/S2b.md.
export * from "./segmentPack";
export * from "./tileBinner";
export * from "./config";
export * from "./thinLut";
export { roundConeInterval, integrateRay, integratePixel, thinValue, type RayContext, type RayResult } from "./integrator";
export { SegmentPass, createSegmentPass, SEGMENTS_KEY, type SegmentPassStats } from "./segmentPass";
export { ThinPass, createThinPass, packThin, THIN_KEY, THIN_FLOATS, type ThinPrim, type ThinBatch } from "./thinPass";
