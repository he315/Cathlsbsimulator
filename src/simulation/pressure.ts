import type {
  EngagementState,
  PressureState,
  PressureKind,
  CatheterType,
} from "../types";
import type { TipState } from "./engagement";
import type { ControlState } from "./engagement";

export function computePressure(
  eng: EngagementState,
  tip: TipState,
  controls: ControlState,
  cath: CatheterType
): PressureState {
  // Left ventricle
  if (eng.kind === "in-lv") {
    return {
      kind: "lv",
      systolic: 118,
      diastolic: 7,
      quality: 0.85,
      warning: "danger",
      label: "LV pressure — tip below the valve plane",
    };
  }

  // Conus over-selection — a tiny branch, so the trace ventricularises/damps.
  if (eng.conus) {
    return {
      kind: "ventricularised",
      systolic: 108,
      diastolic: 14,
      quality: 0.6,
      warning: "danger",
      label: "Conus over-selection — damped; injecting here can cause VF",
    };
  }

  // Deep / obstructive engagement
  if (eng.isDeep) {
    if (eng.target === "right") {
      return {
        kind: "ventricularised",
        systolic: 116,
        diastolic: 14,
        quality: 0.8,
        warning: "danger",
        label: "Ventricularised — deep / obstructive RCA engagement",
      };
    }
    // very deep with high risk catheter → wedged, else damped
    if (eng.depth > 5 || cath.behaviour.deepEngagementRisk > 0.6) {
      return {
        kind: "wedged",
        systolic: 80,
        diastolic: 66,
        quality: 0.7,
        warning: "danger",
        label: "Over-wedged — tip occluding the ostium",
      };
    }
    return {
      kind: "damped",
      systolic: 86,
      diastolic: 63,
      quality: 0.75,
      warning: "danger",
      label: "Damped — deep engagement obstructing flow",
    };
  }

  // Unstable / whipping catheter — stored torque or forward push not yet
  // delivered to the tip makes the trace fling around.
  if (controls.whip > 0.4 || controls.forwardPressure > 3 || controls.windup > 1.1) {
    return {
      kind: "noisy",
      systolic: 122,
      diastolic: 74,
      quality: 0.35,
      warning: "caution",
      label: "Unstable trace — catheter is loaded and whipping",
    };
  }

  // Mildly damped when selectively engaged but crammed against the wall
  if (eng.isSelective && (tip.cram > 3 || eng.quality < 0.45)) {
    return {
      kind: "damped",
      systolic: 96,
      diastolic: 66,
      quality: 0.6,
      warning: "caution",
      label: "Slightly damped — check coaxiality before injecting",
    };
  }

  // Normal aortic
  return {
    kind: "aortic",
    systolic: 122,
    diastolic: 76,
    quality: 0.95,
    warning: "none",
    label: "Aortic pressure — safe to inject once engaged",
  };
}

// ---------------------------------------------------------------------------
// Waveform morphology. Returns a normalised value in [0,1] for a phase [0,1).
// The renderer maps it to mmHg via diastolic + (systolic-diastolic)*shape.
// ---------------------------------------------------------------------------
export function shapeAt(kind: PressureKind, phase: number): number {
  const p = ((phase % 1) + 1) % 1;
  switch (kind) {
    case "lv": {
      if (p < 0.08) return p / 0.08; // rapid upstroke
      if (p < 0.34) return 1 - (p - 0.08) * 0.15; // systolic plateau
      if (p < 0.44) return Math.max(0, 1 - (p - 0.34) / 0.1); // rapid downstroke
      // diastole near zero with slow end-diastolic rise
      return 0.02 + (p - 0.44) * 0.12;
    }
    case "ventricularised": {
      if (p < 0.1) return p / 0.1;
      if (p < 0.3) return 1 - (p - 0.1) * 0.4;
      if (p < 0.42) return 0.92 - (p - 0.3) / 0.12 * 0.8;
      return Math.max(0, 0.12 - (p - 0.42) * 0.1); // steep diastolic fall
    }
    case "damped":
    case "wedged":
    case "dissected": {
      // low, rounded pulse
      return 0.5 + 0.5 * Math.sin((p - 0.25) * Math.PI * 2) * Math.exp(-p * 0.6);
    }
    case "noisy":
    case "aortic":
    default: {
      // aortic: sharp upstroke, rounded peak, dicrotic notch, runoff
      if (p < 0.1) return p / 0.1; // upstroke
      if (p < 0.32) return 1 - (p - 0.1) * 0.9; // systolic decline
      if (p < 0.36) return 0.8 - (p - 0.32) / 0.04 * 0.28; // dicrotic notch
      if (p < 0.42) return 0.52 + (p - 0.36) / 0.06 * 0.12; // dicrotic bump
      return 0.64 * Math.exp(-(p - 0.42) * 2.4); // diastolic runoff
    }
  }
}

export const HEART_PERIOD = 0.84; // seconds (~71 bpm)

// ---------------------------------------------------------------------------
// Bridge from the patient engine (patient/engine.ts) to the legacy PressureState.
// Additive: computePressure() above is unchanged. With the engine, the numbers
// come from the transduced pressure of this patient and the class from the
// tip-pressure classifier, so nothing is a fixed constant.
// ---------------------------------------------------------------------------

export interface EnginePressureInput {
  /** tip pressure class from the engine (TipPressureState) */
  tipState: "aortic" | "damped" | "ventricularised" | "wedged" | "lv" | "open" | "none";
  /** displayed (transduced) pressure, or null when there is none */
  art: { sys: number; dia: number } | null;
  /** 0..1 trace stability (e.g. 1 − whip) */
  quality?: number;
}

const ENGINE_LABEL: Record<EnginePressureInput["tipState"], { kind: PressureKind; warning: PressureState["warning"]; label: string }> = {
  aortic: { kind: "aortic", warning: "none", label: "Aortic pressure" },
  damped: { kind: "damped", warning: "danger", label: "Damped pressure" },
  ventricularised: { kind: "ventricularised", warning: "danger", label: "Ventricularised pressure" },
  wedged: { kind: "wedged", warning: "danger", label: "Wedged pressure" },
  lv: { kind: "lv", warning: "danger", label: "LV pressure" },
  open: { kind: "noisy", warning: "caution", label: "No pressure signal" },
  none: { kind: "noisy", warning: "caution", label: "No pressure signal" },
};

export function pressureFromEngine(i: EnginePressureInput): PressureState {
  const m = ENGINE_LABEL[i.tipState];
  return {
    kind: m.kind,
    systolic: i.art ? Math.round(i.art.sys) : 0,
    diastolic: i.art ? Math.round(i.art.dia) : 0,
    quality: i.quality ?? (i.art ? 0.95 : 0.2),
    warning: m.warning,
    label: m.label,
  };
}
