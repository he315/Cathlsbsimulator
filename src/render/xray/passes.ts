// ---------------------------------------------------------------------------
// Extension point for additional line-integral passes.
//
// The renderer accumulates the X-ray line integral into a float RGBA target:
//   R = bone and soft-tissue excess, G = iodine (scaled by the iodine gain at
//   the current kV), B = metal (scaled by the metal gain), A = spare.
// A pass registered with XrayRenderer.addPass() runs after the built-in
// anatomy, bone and tube passes with additive blending (ONE, ONE) into that
// target, at the target's resolution, with the frame's camera. Its input data
// travels on XrayScene.extra under a key the pass chooses.
// ---------------------------------------------------------------------------

import type { XrayCamera } from "./XrayRenderer";

export interface PassContext {
  gl: WebGL2RenderingContext;
  cam: XrayCamera;
  /** accumulation target size in pixels (square) */
  res: number;
  /** XrayScene.extra for this frame */
  extra: Record<string, unknown>;
  /** frame counter, for passes that keep history (velocity, temporal effects) */
  frame: number;
}

export interface AccumulationPass {
  /** unique name, for ordering and debugging */
  readonly name: string;
  /** draw into the bound accumulation framebuffer; blending is already ONE, ONE */
  draw(ctx: PassContext): void;
  dispose?(gl: WebGL2RenderingContext): void;
}
