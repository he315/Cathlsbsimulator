import type {
  EngagementState,
  PressureState,
  ContrastResult,
  VesselId,
} from "../types";
import type { AnatomyModel } from "./anatomy";
import { LEFT_VESSELS, RIGHT_VESSELS } from "./anatomy";

function leftFill(model: AnatomyModel): VesselId[] {
  const base = LEFT_VESSELS.filter((v) =>
    model.vessels.some((x) => x.id === v)
  );
  if (model.dominance === "left") base.push("PDA", "PLV");
  return base;
}

function rightFill(model: AnatomyModel): VesselId[] {
  const base = RIGHT_VESSELS.filter((v) =>
    model.vessels.some((x) => x.id === v)
  );
  if (model.dominance === "right" || model.dominance === "codominant") {
    if (!base.includes("PDA")) base.push("PDA", "PLV");
  }
  return base;
}

export interface InjectionOptions {
  volume?: number;
}

export function injectContrast(
  eng: EngagementState,
  pressure: PressureState,
  model: AnatomyModel,
  opts: InjectionOptions = {}
): ContrastResult & { fillOpacity: number } {
  const volume = opts.volume ?? 7;

  // Injection below the valve plane → ventriculogram, serious safety error.
  if (pressure.kind === "lv" || eng.kind === "in-lv") {
    return {
      outcome: "lv-injection",
      diagnostic: false,
      volume,
      filledVessels: [],
      message:
        "Injection in the left ventricle. That is a ventriculogram, not a coronary angiogram, and is a safety-critical error. Withdraw above the valve plane.",
      safety: "danger",
      fillOpacity: 0,
    };
  }

  // Injecting into a dissected vessel → contrast stains the false lumen and can
  // propagate the dissection. The most dangerous injection there is.
  if (pressure.kind === "dissected") {
    const fills = eng.target === "right" ? rightFill(model) : leftFill(model);
    return {
      outcome: "deep-reflux",
      diagnostic: false,
      volume,
      filledVessels: fills.slice(0, 1),
      message:
        "You injected into a dissected vessel. Contrast tracks into the false lumen and extends the dissection — a catastrophic error. Stop injecting.",
      safety: "danger",
      fillOpacity: 0.5,
    };
  }

  // Injecting into a damped / ventricularised trace → dangerous.
  if (
    pressure.kind === "damped" ||
    pressure.kind === "wedged" ||
    pressure.kind === "ventricularised" ||
    eng.isDeep
  ) {
    const fills =
      eng.target === "right" ? rightFill(model) : leftFill(model);
    return {
      outcome: "deep-reflux",
      diagnostic: false,
      volume,
      filledVessels: fills.slice(0, 2),
      message:
        "You injected into a damped/deeply-engaged position. Contrast refluxes poorly and can stain or dissect. Withdraw slightly to a clean pressure before injecting.",
      safety: "danger",
      fillOpacity: 0.4,
    };
  }

  // Selective engagement → a proper coronary run.
  if (eng.isSelective && eng.target) {
    const fills = eng.target === "right" ? rightFill(model) : leftFill(model);
    const diagnostic = eng.quality > 0.6;
    return {
      outcome: eng.target === "right" ? "selective-rca" : "selective-lca",
      diagnostic,
      volume,
      filledVessels: fills,
      message: diagnostic
        ? `Selective ${eng.target === "right" ? "RCA" : "left coronary"} injection with good opacification. Diagnostic run.`
        : `Selective ${eng.target === "right" ? "RCA" : "left coronary"} injection but opacification is faint — improve coaxiality and inject a little more briskly.`,
      safety: "ok",
      fillOpacity: diagnostic ? 0.95 : 0.55,
    };
  }

  // Coaxial / near but not seated → weak filling.
  if (
    eng.kind === "coaxial-lm" ||
    eng.kind === "coaxial-rca" ||
    eng.kind === "near-lm" ||
    eng.kind === "near-rca"
  ) {
    const fills =
      eng.target === "right" ? rightFill(model) : leftFill(model);
    return {
      outcome: "weak",
      diagnostic: false,
      volume,
      filledVessels: fills.slice(0, 3),
      message:
        "Weak, non-diagnostic filling — the tip is near but not selectively seated. Seat the catheter fully before injecting.",
      safety: "caution",
      fillOpacity: 0.4,
    };
  }

  // At sinus level, not engaged → non-selective root puff.
  if (eng.kind === "non-selective" || eng.kind === "sinus-level") {
    return {
      outcome: "root-puff",
      diagnostic: false,
      volume,
      filledVessels: [],
      message:
        "Non-selective injection — you opacified the aortic root, not the coronary tree. Engage a coronary first.",
      safety: "caution",
      fillOpacity: 0.25,
    };
  }

  // Above the sinuses → nothing meaningful.
  return {
    outcome: "none",
    diagnostic: false,
    volume,
    filledVessels: [],
    message:
      "No coronary filling — the catheter is not in a position to opacify a coronary artery.",
    safety: "ok",
    fillOpacity: 0,
  };
}

// ---------------------------------------------------------------------------
// Engagement -> how the hand injection meets the ostium (contrastTransport.ts Seat)
// ---------------------------------------------------------------------------

/**
 * How the catheter tip meets the ostium for the contrast transport: the share of the jet the ostium
 * captures and how far the tip seals it (a sealed tip overdrives coronary flow instead of refluxing).
 * Model parameters chosen from the engagement classes above: a coaxial selective tip captures nearly
 * all of the jet and leaves room around it; a deep, damped or wedged tip seals the ostium (overdrive,
 * staining); a tip near but not seated captures a third; a sinus-level tip captures almost nothing, so
 * the injection becomes a root puff.
 */
export interface InjectionSeat {
  capture: number;
  seal: number;
}

export function injectionSeat(eng: EngagementState, pressure: PressureState): InjectionSeat {
  if (pressure.kind === "lv" || eng.kind === "in-lv") return { capture: 0, seal: 0 };
  if (pressure.kind === "dissected") return { capture: 0.6, seal: 0.6 };
  if (pressure.kind === "damped" || pressure.kind === "wedged" || pressure.kind === "ventricularised" || eng.isDeep) return { capture: 1, seal: 0.9 };
  if (eng.isSelective && eng.target) {
    const q = Math.max(0, Math.min(1, (eng.quality - 0.3) / 0.5));
    return { capture: 0.55 + 0.45 * q, seal: 0.3 };
  }
  if (eng.kind === "coaxial-lm" || eng.kind === "coaxial-rca" || eng.kind === "near-lm" || eng.kind === "near-rca") return { capture: 0.35, seal: 0.05 };
  if (eng.kind === "non-selective" || eng.kind === "sinus-level") return { capture: 0.05, seal: 0 };
  return { capture: 0, seal: 0 };
}
