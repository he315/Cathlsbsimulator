// ---------------------------------------------------------------------------
// Endovascular control from the opposite groin, and limb ischaemia by cause
// (access-cx-endovascular-control): the pure parts. The session module
// src/simulation/session/modules/endovascular.ts keeps the case's state and
// calls these; the crossover route over the aortic bifurcation is built in
// route.ts (buildCrossoverRoute3D) and walked by the 1-D wire of
// procedure.ts (buildCrossoverRoute).
//
// Sources (module text, src/content/manual/**):
//   cm-access-complications-femoral-bleeding (complication-management/
//   06-access-complications.ts), Brilakis Fig. 29.4 steps 6 to 9:
//     - 187: before anything definitive, inflate a balloon at low pressure
//       across the bleeding point to stop the flow;
//     - 192: a large-vessel perforation that prolonged inflation does not
//       seal takes a covered stent across the hole;
//     - 197: a small branch (inferior epigastric, lateral circumflex iliac):
//       coils after making sure blood is not reaching the hole backwards; for
//       very distal holes where a coil cannot be delivered, microspheres,
//       glue or thrombin; a prolonged balloon or a covered stent over the
//       mouth of the branch may also work;
//     - 202: surgery when the covered stent or coils fail, or a stent is not
//       wanted (where the common femoral artery divides);
//   cm-access-complications-large-bore (same file):
//     - 930: the crossover technique's 7 Fr long sheath from the opposite
//       femoral artery, the balloon passed over the aortic bifurcation;
//     - 972: inflate the crossover balloon at low pressure above the site;
//     - 987: balloon-expandable covered stents position more precisely (the
//       iliac artery); self-expanding ones resist flexion and are preferred
//       in the common femoral artery, where a stent needs a landing zone
//       above the bifurcation and surgery is at least as reasonable; the
//       stents Brilakis lists need a 6 or 7 Fr sheath (one balloon-
//       expandable type) or a 7 Fr sheath (the others); the smallest diameter
//       is 5 mm; never stent across the femoral bifurcation;
//     - 997: check the pulses and image the leg afterwards;
//   cm-access-complications-limb (same file):
//     - 442-444: the six Ps of acute limb ischaemia against the triad of
//       cholesterol embolisation (pain, livedo reticularis, intact pulses),
//       which has no specific treatment;
//     - 461, 463: dissection from wires forced against resistance or an
//       injection with the sheath tip against the wall; embolisation from a
//       clotted sheath;
//     - 489-505: access from the other groin and angiography; angioplasty,
//       thrombectomy or thrombolysis for thrombus; a flow-limiting iliac
//       dissection crossed into the true lumen from the opposite femoral
//       artery and stented with a self-expanding stent; a common femoral one
//       to endarterectomy; a plug in the artery removed surgically.
// Devices are abstract classes, not products. Everything else (the hazards,
// the times, the device length, the landing margin, the leg findings as
// words) is a MODEL PARAMETER: a setting of the simulator that gives the
// right direction, not a clinical value
// (docs/realism/facts/pkg-access-cx-endovascular-control.md).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Sourced numbers
// ---------------------------------------------------------------------------

export const ENDO_SOURCED = {
  /** the smallest diameter among the covered stents Brilakis lists (mm; 06-access-complications.ts:987) */
  coveredStentMinMm: 5,
  /**
   * the sheath the covered stents Brilakis lists need (Fr; 06-access-complications.ts:987: 'a 6 or 7 Fr sheath (one
   * balloon-expandable type) or a 7 Fr sheath (the others)'): this model, with abstract device classes, asks 7 Fr of
   * every covered stent, the size every listed type fits
   */
  coveredStentSheathFr: 7,
  /** the long crossover sheath of the TAVI series (Fr; 06-access-complications.ts:930) */
  crossoverSheathFr: 7,
} as const;

// ---------------------------------------------------------------------------
// Model parameters
// ---------------------------------------------------------------------------

/** MODEL PARAMETERS of endovascular control and the cold leg (simulator settings, not clinical values). */
export const MP_ENDO = {
  /** length of the occlusion balloon and of a stent (mm): the drawing and the coverage rule */
  balloonLenMm: 40,
  stentLenMm: 50,
  /** a stent's end must clear the hole by this much to cover it (mm) */
  coverMarginMm: 3,
  /** a coil or the sealant goes into the branch whose origin lies within this of the device position (mm) */
  branchReachMm: 20,
  /** the crossover catheter's shaped tip hooks the other iliac when it lies within this of the bifurcation (mm) */
  hookMm: 20,
  /** how long the steps take (s) */
  retrogradeS: 60,
  longSheathS: 180,
  stentS: 600,
  coilS: 600,
  sealantS: 300,
  surgeryS: 3600,
  legTreatS: 900,
  /** a prolonged inflation (s): a hole that seals with a balloon has sealed after this long with the flow stopped */
  prolongedS: 600,
  /** contrast per crossover angiogram (mL) */
  angioMl: 8,
  /** the leg presents this long after the event that caused it (s) */
  legOnsetS: 120,
  /** after the definitive fix, the leg not examined within this long is scored (s) */
  legAfterS: 600,
  /**
   * Live hazards (the full case, outside the scenarios): the chance that one injection through the femoral sheath
   * against a damped trace raises a flow-limiting iliac dissection, without and with a wire through the sheath
   * (the lesson: the wire keeps the tip off the wall); per buckle of a wire forced in the iliofemoral arteries, J
   * and hydrophilic; and that a clot flushed out of a femoral sheath lodges in the leg.
   */
  dampedInjectionP: 0.25,
  dampedInjectionWireP: 0.05,
  forcedWireP: { j: 0.03, hydrophilic: 0.1 },
  clotEmbolusP: 0.3,
} as const;

// ---------------------------------------------------------------------------
// The injuries and the leg
// ---------------------------------------------------------------------------

/** The artery a hole is in. */
export type EndoVessel = "external-iliac" | "common-femoral" | "iea" | "lcia";

export const ENDO_VESSEL_LABEL: Record<EndoVessel, string> = {
  "external-iliac": "external iliac artery",
  "common-femoral": "common femoral artery",
  iea: "inferior epigastric artery",
  lcia: "lateral circumflex iliac artery",
};

/** A bleeding hole (a scenario setting; every number is a MODEL PARAMETER of the scenario). */
export interface EndoInjury {
  vessel: EndoVessel;
  /** site x of the hole in the parent artery, or of the branch's origin (mm from the inguinal crease, up the limb) */
  siteX: number;
  /** a branch: how far along it the hole lies (mm) */
  alongMm?: number;
  /** a hole too far out in the branch for a coil to be delivered */
  distal?: boolean;
  /** blood reaches the hole backwards from the other side of the branch */
  retrograde?: boolean;
  /** the parent artery's diameter at the hole or the origin (mm) */
  vesselMm: number;
  /** the branch's diameter (mm) */
  branchMm?: number;
  /** a prolonged low-pressure inflation seals it */
  sealsWithBalloon?: boolean;
}

export const isBranch = (v: EndoVessel) => v === "iea" || v === "lcia";

/** What makes the leg ischaemic (or, for cholesterol, the picture that is not acute limb ischaemia). */
export type LegCause = "iliac-dissection" | "cfa-dissection" | "plug" | "embolus" | "cholesterol";

/** Where along the target limb the cause lies (site x, mm) and what it does to the arteries. */
export interface LegLesion {
  cause: LegCause;
  siteX: number;
}

/** What the operator finds on examining the leg: the six Ps, the pulses, the foot's pleth, the skin. */
export interface LegFindings {
  pain: boolean;
  pallor: boolean;
  cold: boolean;
  paraesthesia: boolean;
  weakness: boolean;
  livedo: boolean;
  pulses: { femoral: PulseGrade; popliteal: PulseGrade; pedal: PulseGrade };
  pleth: "normal" | "damped" | "flat";
  /** the findings in words (signs only: never the cause) */
  text: string;
}

export type PulseGrade = "present" | "weak" | "absent";

/**
 * The leg as the operator examines it (MODEL wording of the six Ps and the cholesterol triad, 06-access-complications
 * .ts:442). `occluded`: the flow to the leg is stopped (a cause not yet treated, or an occlusion balloon up in the
 * iliac artery, which by the lesson's reasoning can make the leg ischaemic too, 997).
 */
export function legFindings(o: { cause: LegCause | null; occludedAt: "iliac" | "cfa" | "sfa" | null }): LegFindings {
  if (o.cause === "cholesterol" && !o.occludedAt) {
    return {
      pain: true,
      pallor: false,
      cold: false,
      paraesthesia: false,
      weakness: false,
      livedo: true,
      pulses: { femoral: "present", popliteal: "present", pedal: "present" },
      pleth: "normal",
      text: "The foot is warm and painful, with a lacy purple mottling over the toes and sole; femoral, popliteal and foot pulses are all felt; the toe pleth has a normal trace.",
    };
  }
  const at = o.occludedAt;
  if (!at) {
    return {
      pain: false,
      pallor: false,
      cold: false,
      paraesthesia: false,
      weakness: false,
      livedo: false,
      pulses: { femoral: "present", popliteal: "present", pedal: "present" },
      pleth: "normal",
      text: "The foot is warm and pink, with normal sensation and movement; femoral, popliteal and foot pulses are felt; the toe pleth has a normal trace.",
    };
  }
  const femoral: PulseGrade = at === "iliac" ? "absent" : at === "cfa" ? "weak" : "present";
  const pulseWord = (g: PulseGrade) => (g === "present" ? "felt" : g === "weak" ? "weak" : "not felt");
  return {
    pain: true,
    pallor: true,
    cold: true,
    paraesthesia: true,
    weakness: at !== "sfa",
    livedo: false,
    pulses: { femoral, popliteal: "absent", pedal: "absent" },
    pleth: "flat",
    text: `The foot is pale and cold, and the patient says it hurts and feels numb${at !== "sfa" ? "; the toes move weakly" : ""}. Femoral pulse ${pulseWord(femoral)}, popliteal and foot pulses not felt; the toe pleth trace is flat.`,
  };
}

/** Where a leg cause stops the flow, for the findings. */
export function legOcclusionLevel(c: LegCause): "iliac" | "cfa" | "sfa" | null {
  switch (c) {
    case "iliac-dissection":
      return "iliac";
    case "cfa-dissection":
    case "plug":
      return "cfa";
    case "embolus":
      return "sfa";
    case "cholesterol":
      return null;
  }
}

// ---------------------------------------------------------------------------
// Reading the angiogram (the learner's reading, graded against the image)
// ---------------------------------------------------------------------------

export type AngioReading = "extravasation-large" | "extravasation-branch" | "flap" | "cut-off" | "normal";

export const ANGIO_READING_LABEL: Record<AngioReading, string> = {
  "extravasation-large": "Contrast leaving the main artery",
  "extravasation-branch": "Contrast leaving a small branch",
  flap: "A narrowed lumen with a flap and slow flow beyond",
  "cut-off": "An abrupt cut-off of the contrast column",
  normal: "The arteries fill normally",
};

/** What a crossover angiogram shows of a bleed or a leg cause (before any balloon or fix changes it). */
export function angioTruth(o: { injury: EndoInjury | null; sealed: boolean; leg: LegCause | null; legTreated: boolean }): AngioReading {
  if (o.injury && !o.sealed) return isBranch(o.injury.vessel) ? "extravasation-branch" : "extravasation-large";
  if (o.leg && !o.legTreated) {
    if (o.leg === "iliac-dissection" || o.leg === "cfa-dissection") return "flap";
    if (o.leg === "plug" || o.leg === "embolus") return "cut-off";
  }
  return "normal";
}

// ---------------------------------------------------------------------------
// Devices for a bleeding hole
// ---------------------------------------------------------------------------

/** The device classes (generic: no product). */
export type EndoDevice = "covered-be" | "covered-se" | "bare-stent" | "coils" | "sealant" | "prolonged-balloon" | "surgery";

export const ENDO_DEVICE_LABEL: Record<EndoDevice, string> = {
  "covered-be": "Covered stent, balloon-expandable",
  "covered-se": "Covered stent, self-expanding",
  "bare-stent": "Bare-metal stent",
  coils: "Coils through a microcatheter",
  sealant: "Microspheres, glue or thrombin through a microcatheter",
  "prolonged-balloon": "Prolonged low-pressure balloon inflation",
  surgery: "Call the vascular surgeons",
};

export const isStent = (d: EndoDevice) => d === "covered-be" || d === "covered-se" || d === "bare-stent";
export const isDefinitive = (d: EndoDevice) => d !== "prolonged-balloon";

/** Where a device goes: in the main artery at the device position along the wire, or into the branch there. */
export type EndoTarget = "main" | "branch";

/**
 * The geometry of a placement, measured along the crossover route by the session module: whether a stent laid at
 * the device position covers the hole (or the branch's mouth), whether it covers the femoral bifurcation, and which
 * branch a coil or sealant would enter there.
 */
export interface PlacementGeometry {
  coversHole: boolean;
  coversBifurcation: boolean;
  /** the branch whose origin is within MP_ENDO.branchReachMm of the device position (null: none) */
  branchHere: EndoVessel | null;
}

export interface DeviceContext {
  /** the flow had been stopped with a balloon before this device */
  occludedFirst: boolean;
  /** retrograde filling of the branch at the device position was checked */
  retrogradeChecked: boolean;
  /** the sheath the device goes through (Fr) */
  sheathFr: number;
}

export interface DeviceVerdict {
  correct: boolean;
  /** seals the hole for good, holds it only while it is in place, does nothing, or cannot be placed at all */
  effect: "seals" | "holds" | "none" | "refused";
  expected: string;
  reasons: string[];
  /** a stent across the femoral bifurcation: the profunda is lost */
  profundaLost: boolean;
  /** what refused the device (the check the operator should have made) */
  refusedBy: "sheath" | "diameter" | "reach" | null;
}

export function expectedDevice(inj: EndoInjury): string {
  if (inj.vessel === "external-iliac")
    return "After the low-pressure balloon, a covered stent across the hole (balloon-expandable places precisely in the iliac artery), through a 7 Fr sheath";
  if (inj.vessel === "common-femoral")
    return "After the low-pressure balloon, a self-expanding covered stent across the hole with its end above the femoral bifurcation, or surgery; never a stent across the bifurcation";
  if (inj.distal) return "After the low-pressure balloon, microspheres, glue or thrombin into the branch (a coil cannot reach the hole), or a covered stent over the branch's mouth";
  return "After the low-pressure balloon, coils in the branch once retrograde filling is excluded, or a covered stent over the branch's mouth";
}

/**
 * Grade a device for the hole (pure). The geometry is what the device position covers; the context says what came
 * before it. A refused device is not placed (the stent will not pass the sheath, there is no covered stent that
 * small, the coil will not reach); its verdict is still written, as the check that was missed.
 */
export function gradeDevice(inj: EndoInjury, device: EndoDevice, target: EndoTarget, geo: PlacementGeometry, ctx: DeviceContext): DeviceVerdict {
  const expected = expectedDevice(inj);
  const reasons: string[] = [];
  const out = (correct: boolean, effect: DeviceVerdict["effect"], extra: Partial<DeviceVerdict> = {}): DeviceVerdict => ({
    correct: correct && reasons.length === 0,
    effect,
    expected,
    reasons,
    profundaLost: false,
    refusedBy: null,
    ...extra,
  });
  if (device === "surgery") {
    if (inj.vessel === "common-femoral") return out(true, "seals");
    reasons.push("Surgery is for a failed covered stent or coils, or a hole at the femoral bifurcation.");
    return out(false, "seals");
  }
  if (isDefinitive(device) && !ctx.occludedFirst) reasons.push("No balloon stopped the flow before the definitive device.");
  const branchInj = isBranch(inj.vessel);
  // the balloon held longer: holds while up, seals the holes that seal with a balloon
  if (device === "prolonged-balloon") return out(true, inj.sealsWithBalloon ? "seals" : "holds");
  if (isStent(device)) {
    // a stent goes through the sheath, and no covered stent is smaller than 5 mm
    if (ctx.sheathFr < ENDO_SOURCED.coveredStentSheathFr) {
      reasons.push(`The stent needs a ${ENDO_SOURCED.coveredStentSheathFr} Fr sheath; the sheath is ${ctx.sheathFr} Fr.`);
      return out(false, "refused", { refusedBy: "sheath" });
    }
    const diam = target === "branch" ? (inj.branchMm ?? 2) : inj.vesselMm;
    if (device !== "bare-stent" && diam < ENDO_SOURCED.coveredStentMinMm) {
      reasons.push(`No covered stent is smaller than ${ENDO_SOURCED.coveredStentMinMm} mm; this artery is about ${diam} mm.`);
      return out(false, "refused", { refusedBy: "diameter" });
    }
    if (target === "branch") {
      reasons.push("A stent goes in the parent artery, over the branch's mouth, not inside the branch.");
      return out(false, "refused", { refusedBy: "diameter" });
    }
    const profundaLost = geo.coversBifurcation;
    if (profundaLost) reasons.push("The stent covers the femoral bifurcation: the profunda is lost. A hole there goes to surgery.");
    if (!geo.coversHole) {
      reasons.push("The stent does not cover the hole.");
      return out(false, "none", { profundaLost });
    }
    if (device === "bare-stent") {
      reasons.push("A bare stent does not seal a hole.");
      return out(false, "none", { profundaLost });
    }
    if (branchInj) {
      // a covered stent over the mouth of the branch (the hole is in the branch)
      if (inj.retrograde) {
        reasons.push("The branch fills backwards: covering its mouth leaves the hole fed from the other side.");
        return out(false, "none", { profundaLost });
      }
      return out(true, "seals", { profundaLost });
    }
    if (inj.vessel === "common-femoral" && device === "covered-be") reasons.push("In the common femoral artery a self-expanding covered stent is preferred: it resists the flexion that fractures stents there.");
    return out(true, "seals", { profundaLost });
  }
  // coils and sealant go into a branch through a microcatheter
  if (!branchInj || target === "main") {
    reasons.push(branchInj ? "Coils and sealant go into the bleeding branch, not the main artery." : "Coils and sealant do not close a hole in a large artery.");
    return out(false, "none");
  }
  if (geo.branchHere !== inj.vessel) {
    reasons.push(geo.branchHere ? `That is the ${ENDO_VESSEL_LABEL[geo.branchHere]}, not the bleeding branch.` : "No branch arises at the device position.");
    return out(false, "none");
  }
  if (device === "coils") {
    if (inj.distal) {
      reasons.push("A coil cannot be delivered this far out in the branch: microspheres, glue or thrombin instead.");
      return out(false, "refused", { refusedBy: "reach" });
    }
    if (!ctx.retrogradeChecked) reasons.push("Retrograde filling of the branch was not excluded before coiling.");
    if (inj.retrograde) {
      reasons.push("The branch fills backwards: coils in its mouth leave the hole fed from the other side.");
      return out(false, "none");
    }
    return out(true, "seals");
  }
  // sealant: for very distal holes
  if (!inj.distal) reasons.push("Microspheres, glue or thrombin are for very distal holes a coil cannot reach; here coils are the choice, with less risk of the sealant leaving the vessel.");
  return out(true, "seals");
}

// ---------------------------------------------------------------------------
// The cold leg
// ---------------------------------------------------------------------------

export type LegCall = "ali" | "cholesterol" | "normal";

export const LEG_CALL_LABEL: Record<LegCall, string> = {
  ali: "Acute limb ischaemia",
  cholesterol: "Cholesterol embolisation (pulses intact)",
  normal: "No ischaemia",
};

export function gradeLegCall(cause: LegCause | null, call: LegCall): { correct: boolean; expected: string } {
  if (!cause) return { correct: call === "normal", expected: "No ischaemia: the leg is warm with pulses" };
  if (cause === "cholesterol") return { correct: call === "cholesterol", expected: "Pain and livedo with intact pulses: cholesterol embolisation, not acute limb ischaemia" };
  return { correct: call === "ali", expected: "The six Ps with lost pulses: acute limb ischaemia" };
}

/** Grade an order for emergency angiography of the leg from the other groin. */
export function gradeLegAngio(cause: LegCause | null): { correct: boolean; expected: string } {
  if (cause === "cholesterol") return { correct: false, expected: "Pulses intact with livedo: cholesterol embolisation has no specific treatment; no emergency angiography (more catheter work adds emboli)" };
  if (!cause) return { correct: false, expected: "No ischaemia: no angiography needed" };
  return { correct: true, expected: "Access in the opposite femoral artery and angiography of the leg to find the cause" };
}

export type LegTreatment = "se-stent" | "angioplasty" | "thrombectomy" | "thrombolysis" | "surgery" | "supportive";

export const LEG_TREATMENT_LABEL: Record<LegTreatment, string> = {
  "se-stent": "Self-expanding stent, over a wire in the true lumen",
  angioplasty: "Balloon angioplasty",
  thrombectomy: "Endovascular thrombectomy",
  thrombolysis: "Thrombolysis",
  surgery: "Vascular surgery (endarterectomy, removal or thrombectomy)",
  supportive: "No specific treatment: supportive care and prevention",
};

export function expectedLegTreatment(c: LegCause): string {
  switch (c) {
    case "iliac-dissection":
      return "Flow-limiting iliac dissection: cross into the true lumen from the opposite femoral artery and place a self-expanding stent";
    case "cfa-dissection":
      return "Flow-limiting common femoral dissection: endarterectomy rather than a stent that may fracture there";
    case "plug":
      return "A plug inside the artery: prompt surgical removal";
    case "embolus":
      return "Thrombus: endovascular thrombectomy, thrombolysis or angioplasty (or surgical retrieval)";
    case "cholesterol":
      return "Cholesterol embolisation: no specific treatment; supportive care (statins may help the kidneys) and prevention";
  }
}

/** Grade a leg treatment for the cause (pure). `trueLumen`: a wire crossed beyond the lesion from the other groin. */
export function gradeLegTreatment(c: LegCause, t: LegTreatment, ctx: { trueLumen: boolean; imaged: boolean }): { correct: boolean; effect: "restores" | "none" | "refused"; expected: string; reasons: string[] } {
  const expected = expectedLegTreatment(c);
  const reasons: string[] = [];
  if (c === "cholesterol") {
    if (t === "supportive") return { correct: true, effect: "none", expected, reasons };
    reasons.push("The pulses are intact: there is no occlusion to open, and more catheter work can add emboli.");
    return { correct: false, effect: "none", expected, reasons };
  }
  if (t === "supportive") {
    reasons.push("The leg has lost its pulses: the cause has to be treated.");
    return { correct: false, effect: "none", expected, reasons };
  }
  if (!ctx.imaged && t !== "surgery") {
    reasons.push("Image the leg from the other groin first.");
    return { correct: false, effect: "refused", expected, reasons };
  }
  switch (c) {
    case "iliac-dissection":
      if (t === "se-stent") {
        if (!ctx.trueLumen) {
          reasons.push("Cross into the true lumen beyond the flap from the other groin first.");
          return { correct: false, effect: "refused", expected, reasons };
        }
        return { correct: true, effect: "restores", expected, reasons };
      }
      reasons.push(t === "surgery" ? "In the iliac artery the fix is endovascular, from the other groin." : "A flap is not a clot: it needs a stent over a wire in the true lumen.");
      return { correct: false, effect: t === "surgery" ? "restores" : "none", expected, reasons };
    case "cfa-dissection":
      if (t === "surgery") return { correct: true, effect: "restores", expected, reasons };
      reasons.push(t === "se-stent" ? "Stents fracture in the common femoral artery: endarterectomy is preferred." : "A flap is not a clot.");
      return { correct: false, effect: t === "se-stent" ? "restores" : "none", expected, reasons };
    case "plug":
      if (t === "surgery") return { correct: true, effect: "restores", expected, reasons };
      reasons.push("A plug inside the artery often has to be removed surgically.");
      return { correct: false, effect: "none", expected, reasons };
    case "embolus":
      if (t === "thrombectomy" || t === "thrombolysis" || t === "angioplasty" || t === "surgery") return { correct: true, effect: "restores", expected, reasons };
      reasons.push("A stent does not clear thrombus: retrieve or dissolve it.");
      return { correct: false, effect: "none", expected, reasons };
  }
}

// ---------------------------------------------------------------------------
// Live hazards (the full case, outside the scenarios)
// ---------------------------------------------------------------------------

/** The chance that one femoral sheath injection raises a flow-limiting iliac dissection (MODEL). */
export function injectionDissectionP(o: { waveform: "arterial" | "damped" | "venous" | null; wireIn: boolean }): number {
  if (o.waveform !== "damped") return 0;
  return o.wireIn ? MP_ENDO.dampedInjectionWireP : MP_ENDO.dampedInjectionP;
}

/** The chance that one buckle of a wire forced in the iliofemoral arteries raises a flow-limiting dissection (MODEL). */
export function forcedWireDissectionP(kind: "j" | "hydrophilic"): number {
  return MP_ENDO.forcedWireP[kind];
}
