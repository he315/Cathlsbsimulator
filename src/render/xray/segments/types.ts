// Shared type aliases for the segment integrator (type-only imports from the renderer).
import type { TubeSpec } from "../thorax";
import type { XrayCamera } from "../XrayRenderer";

export type { TubeSpec, XrayCamera };

/** The part of XrayScene the feature-flag helper touches. */
export interface XrayLikeScene {
  tubes: TubeSpec[];
  extra?: Record<string, unknown>;
}
