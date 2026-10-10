// ---------------------------------------------------------------------------
// Micropuncture upsizing, sheath preparation and the femoral angiogram report
// (access-femoral-upsizing-angiogram). Pure and engine-free: the case session
// (src/simulation/session/caseSession.ts) keeps one UpsizingState per access
// site and calls these transitions; the lab draws what they leave.
//
// The femoral sequence after the 0.018 inch micro-wire has been screened is
// Brilakis 4.2, steps 9-15, as the module text gives it
// (src/content/manual/pci-manual/05-access.ts, lesson pm-access-femoral-sheath):
//   9   skin nick (optional): over the needle so the blade cannot damage the
//       wire, or after the micropuncture dilator is in; never with a sheath in
//       place, because the blade can cut the sheath;
//   10  the micropuncture dilator assembly over the 0.018 inch wire;
//   11  the 0.018 inch wire and the inner dilator out, the outer part left in
//       the artery with brisk pulsatile backflow, then a 0.035 inch wire to
//       the abdominal aorta (a stiff one in a scarred groin);
//   13  the sheath over the 0.035 inch wire: 10 cm for most cases, 25 or 45 cm
//       for tortuosity, iliac stents, obesity or extra support; the dilator out
//       and the wire left in;
//   14  aspirate 3-4 mL from the side arm and discard it, then flush with a
//       separate syringe of heparinised saline (also pm-to-the-root-table:
//       again before a guide goes in);
//   15  the femoral angiogram: an undamped side-arm waveform and a wire in the
//       aorta first, the ipsilateral oblique (RAO 20-30 degrees for the right
//       groin, LAO 20-30 for the left), low magnification, about 5-10 mL.
// The order is enforced by what is physically in the groin (stage), never by
// a list: a sheath cannot go over a needle, a dilator cannot go over nothing.
// Going straight from the 0.018 inch wire to a sheath is possible (the
// session allows it, as the access lab always has) and is scored.
//
// The wire through the needle (pm-to-the-root lab request 2; Brilakis 5.2,
// Oxford ch 4): a polymer-jacketed hydrophilic wire must not go through an
// access needle, because its jacket can shear off on withdrawal.
//
// Resistance during upsizing, scripted by a scenario (lab request pm-access#8;
// the module's troubleshooting table, pm-access-troubleshoot, Brilakis 4.2):
//   scar               the micropuncture dilator will not pass: nick the skin
//                      (over the stopped dilator) or enlarge the nick, or use
//                      a stiffer dilator;
//   kinked-micro-wire  the 0.018 inch wire kinks at the arterial entry and the
//                      dilator will not pass: pull the wire back a little and
//                      re-advance, or cut off the kinked part;
//   poor-track         the sheath will not advance: nick and spread the track
//                      with a haemostat, or exchange (through a dilator) to a
//                      stiff 0.035 inch wire (or a smaller sheath, or the
//                      dilator alone first);
//   wire-kink-035      the 0.035 inch wire kinks as the sheath is pushed: take
//                      the sheath out and exchange through a dilator for a
//                      stiffer wire;
//   subintimal-sheath  the sheath goes in without resistance but has no
//                      arterial waveform: it is subintimal; change site, and
//                      never inject through it.
// Each resistance is felt (the event dilator-resistance or wire-resistance),
// never named. A second push against the same resistance without a fix in
// between is forcing it, which the ledger scores as a failure.
//
// Numbers: the sourced ones are cited above; times and the trace shape are
// MODEL PARAMETERS (MP_UPSIZING).
// ---------------------------------------------------------------------------

/** Where the upsizing is: what is in the groin now. */
export type UpsizeStage =
  /** the needle in the skin with the 0.018 inch wire through it (or not yet) */
  | "needle"
  /** the needle out over the 0.018 inch wire */
  | "micro-wire"
  /** the micropuncture dilator assembly (inner and outer) over the 0.018 inch wire */
  | "micro-dilator"
  /** the outer dilator alone in the artery: wire and inner dilator out */
  | "outer-dilator"
  /** the 0.035 inch wire through the outer dilator */
  | "outer-dilator-035"
  /** the 0.035 inch wire alone */
  | "wire-035"
  /** the sheath is in */
  | "sheath";

export const UPSIZE_STAGES: readonly UpsizeStage[] = ["needle", "micro-wire", "micro-dilator", "outer-dilator", "outer-dilator-035", "wire-035", "sheath"];

/** The wire passed through the access needle. */
export type AccessWireKind = "micro-018" | "hydrophilic";

/** The 0.035 inch wire: a standard J or a stiff (extra-support) one. */
export type Wire035Kind = "standard" | "stiff";

/** Femoral sheath lengths (cm): Brilakis 4.2, step 13. */
export type SheathLengthCm = 10 | 25 | 45;
export const SHEATH_LENGTHS_CM: readonly SheathLengthCm[] = [10, 25, 45];

/** A scripted resistance during upsizing (a scenario setting). */
export type UpsizeResistance = "scar" | "kinked-micro-wire" | "poor-track" | "wire-kink-035" | "subintimal-sheath";
export const UPSIZE_RESISTANCES: readonly UpsizeResistance[] = ["scar", "kinked-micro-wire", "poor-track", "wire-kink-035", "subintimal-sheath"];

/** The fixes the lab offers (the module's troubleshooting table). */
export type UpsizeFix = "nick" | "enlarge-nick" | "spread" | "stiff-dilator" | "pull-back-wire" | "cut-kink" | "exchange-stiff-wire" | "change-site";

/** Which fixes resolve which resistance (Brilakis 4.2 as the module's troubleshooting table gives it). */
export const FIXES_FOR: Readonly<Record<UpsizeResistance, readonly UpsizeFix[]>> = {
  scar: ["enlarge-nick", "nick", "stiff-dilator"],
  "kinked-micro-wire": ["pull-back-wire", "cut-kink"],
  "poor-track": ["spread", "exchange-stiff-wire"],
  "wire-kink-035": ["exchange-stiff-wire"],
  "subintimal-sheath": ["change-site"],
};

/** The device a resistance stops, in the learner's words. */
const STOPPED: Readonly<Record<UpsizeResistance, string>> = {
  scar: "The micropuncture dilator will not pass.",
  "kinked-micro-wire": "The micropuncture dilator will not pass.",
  "poor-track": "The sheath will not advance.",
  "wire-kink-035": "The sheath will not advance, and the wire bends at the skin as you push.",
  "subintimal-sheath": "",
};

/** MODEL PARAMETERS of the upsizing (times in s, the side-arm trace shape); not from a source. */
export const MP_UPSIZING = {
  nickS: 10,
  spreadS: 10,
  dilatorS: 15,
  innerOutS: 6,
  wire035S: 15,
  dilatorOutS: 5,
  fixS: 20,
  exchangeS: 45,
  aspirateS: 8,
  flushS: 8,
  transduceS: 10,
  /** the femoral angiogram's injection (s) */
  angioS: 6,
  /** the 0.035 inch wire is passed this far beyond the arterial entry, to the abdominal aorta (mm) */
  wire035Mm: 300,
  /** the volume of the femoral angiogram when none is chosen (mL; within the sourced 5-10 mL) */
  angioDefaultMl: 8,
  /** the clamp on any volume injected through the sheath side arm (mL) */
  puffClampMl: [1, 20] as const,
  /** the range of the femoral angiogram's volume slider in the fluoroscopy view (mL; spans the sourced 5-10 mL) */
  angioSliderMl: [2, 15] as const,
  /**
   * the numbers a damped side arm (subintimal sheath) reads on the transducer, as fractions of the patient's aortic
   * diastolic pressure: [systolic, diastolic] of the reading
   */
  dampedReadingOfDia: [0.4, 0.35] as const,
  /**
   * the share of the contrast's iodine concentration left in the limb arteries during the femoral angiogram (a
   * deliberate 5-10 mL injection through the side arm close to the entry, less diluted than a test puff's 0.5): set
   * by eye on the rendered RAO 30 frames so the bifurcation and the entry stay readable where they lie over the
   * femoral head and in the scenarios' larger body sizes (checked in fem-angio-below-bif, habitus 1.08)
   */
  angioIodineShare: 0.85,
};

/**
 * Sourced values of the sheath and the femoral angiogram (Brilakis 4.2, steps 13-15, in
 * src/content/manual/pci-manual/05-access.ts; the closure criterion from pm-closure-plan,
 * src/content/manual/pci-manual/13-closure.ts, 'A device needs a common femoral artery larger than 5 mm,
 * free of significant disease, entered above its bifurcation').
 */
export const SOURCED_UPSIZING = {
  /** 'Draw 3-4 mL from the side arm and discard it' */
  aspirateMl: [3, 4] as [number, number],
  /** 'Inject about 5-10 mL' */
  angioMl: [5, 10] as [number, number],
  /** 'RAO 20-30 degrees when the sheath is in the right groin, LAO 20-30 degrees when it is in the left' */
  obliqueDeg: [20, 30] as [number, number],
  /** a closure device needs a common femoral artery larger than this (mm) */
  deviceCfaMm: 5,
};

export interface UpsizingState {
  stage: UpsizeStage;
  /** the wire chosen for the needle */
  wireKind: AccessWireKind;
  /** a hydrophilic wire went through the needle on this pass */
  hydrophilicThroughNeedle: boolean;
  nick: { done: boolean; enlarged: boolean; spread: boolean; over: "needle" | "dilator" | "wire" | null };
  stiffDilator: boolean;
  wire035: Wire035Kind | null;
  /** scripted resistances not yet met */
  pending: UpsizeResistance[];
  /** a resistance met and not yet fixed, with the pushes against it since the last fix */
  blocked: { kind: UpsizeResistance; pushes: number } | null;
  /** resistances pushed against a second time without a fix (forcing) */
  forced: UpsizeResistance[];
  /** resistances met, and the fix that resolved each */
  met: { kind: UpsizeResistance; fix: UpsizeFix | null }[];
  /** brisk pulsatile backflow seen from the outer dilator */
  backflow: boolean;
  /** the sheath went in over the 0.035 inch wire (not straight over the 0.018 inch wire) */
  viaWire035: boolean;
  sheathLengthCm: SheathLengthCm | null;
  /** the sheath lies subintimally (a scripted event; not shown, only felt and seen on the trace) */
  subintimal: boolean;
  /** the 0.035 inch wire is still through the sheath into the aorta */
  wireLeftIn: boolean;
}

export function freshUpsizing(pending: readonly UpsizeResistance[] = []): UpsizingState {
  return {
    stage: "needle",
    wireKind: "micro-018",
    hydrophilicThroughNeedle: false,
    nick: { done: false, enlarged: false, spread: false, over: null },
    stiffDilator: false,
    wire035: null,
    pending: [...pending],
    blocked: null,
    forced: [],
    met: [],
    backflow: false,
    viaWire035: false,
    sheathLengthCm: null,
    subintimal: false,
    wireLeftIn: false,
  };
}

/** What a transition did: ok, or refused with the reason the attending gives; the event felt, a resistance met or forced, one resolved. */
export interface UpsizeResult {
  ok: boolean;
  why?: string;
  /** what the hands feel (raised as a tip event by the session) */
  event?: "dilator-resistance" | "wire-resistance";
  /** the wire is felt as well (a kinking wire): raised as wire-resistance beside `event` */
  wireFelt?: boolean;
  /** a resistance was met on this attempt */
  met?: UpsizeResistance;
  /** this attempt pushed against a resistance already felt, without a fix in between */
  forced?: UpsizeResistance;
  /** a resistance resolved by this action */
  resolved?: UpsizeResistance;
  /** what the operator sees or feels, for the log */
  log?: string;
}

const refuse = (why: string): UpsizeResult => ({ ok: false, why });

/** Is a scripted resistance still ahead or blocking now? */
const hasPending = (st: UpsizingState, k: UpsizeResistance) => st.pending.includes(k) || st.blocked?.kind === k;

/** Meet a resistance (first push, or the first push after a fix that did not work) or force it (a further push without a fix in between). */
function meet(st: UpsizingState, kind: UpsizeResistance): UpsizeResult {
  // the wire kinking at the skin is felt on the wire as well as on the device
  const wireFelt = kind === "wire-kink-035";
  if (st.blocked?.kind === kind && st.blocked.pushes === 0) {
    // a fix was tried in between and did not help: met again, not forced
    st.blocked.pushes = 1;
    return { ok: false, event: "dilator-resistance", wireFelt, met: kind, log: STOPPED[kind] };
  }
  if (st.blocked?.kind === kind) {
    st.blocked.pushes++;
    if (!st.forced.includes(kind)) st.forced.push(kind);
    const worse =
      kind === "kinked-micro-wire"
        ? "Pushing harder bends the wire further at the entry, and the dilator tip flares."
        : kind === "scar"
          ? "Pushing harder only buckles the dilator under the skin."
          : kind === "poor-track"
            ? "Pushing harder crumples the sheath tip against the tissue."
            : "Pushing harder kinks the wire further.";
    return { ok: false, event: "dilator-resistance", wireFelt: wireFelt || kind === "kinked-micro-wire", forced: kind, log: worse };
  }
  st.pending = st.pending.filter((x) => x !== kind);
  st.blocked = { kind, pushes: 1 };
  st.met.push({ kind, fix: null });
  return { ok: false, event: "dilator-resistance", wireFelt, met: kind, log: STOPPED[kind] };
}

/** A fix resolves the blocking resistance when it is one of its listed fixes (or prepares the track ahead of one). */
function applyFix(st: UpsizingState, fix: UpsizeFix): UpsizeResolution {
  const b = st.blocked;
  if (b && FIXES_FOR[b.kind].includes(fix)) {
    const m = [...st.met].reverse().find((x) => x.kind === b.kind && x.fix === null);
    if (m) m.fix = fix;
    st.blocked = null;
    return b.kind;
  }
  // a fix tried against the blocking resistance that is not one of its fixes still counts as a fix in between
  if (b) b.pushes = 0;
  // a fix made before the resistance is met removes it (a prepared track, a stiff wire chosen first)
  for (const k of st.pending) {
    if (preempts(st, k)) {
      st.pending = st.pending.filter((x) => x !== k);
      return null;
    }
  }
  return null;
}
type UpsizeResolution = UpsizeResistance | null;

/** Has the preparation already made removed a resistance before it is met? */
function preempts(st: UpsizingState, k: UpsizeResistance): boolean {
  if (k === "poor-track") return (st.nick.done && st.nick.spread) || st.wire035 === "stiff";
  if (k === "wire-kink-035") return st.wire035 === "stiff";
  return false;
}

// ---------------------------------------------------------------------------
// the wire at the needle
// ---------------------------------------------------------------------------

/** Choose the wire for the needle. A hydrophilic wire is allowed but scored by the session. */
export function chooseAccessWire(st: UpsizingState, kind: AccessWireKind): UpsizeResult {
  if (st.stage !== "needle") return refuse("The access wire is already through.");
  st.wireKind = kind;
  return { ok: true };
}

/** The wire has been fed through the needle (the session calls this on the first feed of a pass). */
export function wireThroughNeedle(st: UpsizingState): void {
  if (st.wireKind === "hydrophilic") st.hydrophilicThroughNeedle = true;
}

/** A new pass at the site: the needle and wire out, everything before the sheath starts again (scripted resistances still ahead stay). */
export function restartPass(st: UpsizingState): void {
  const keep = { pending: [...st.pending, ...(st.blocked ? [st.blocked.kind] : [])], forced: st.forced, met: st.met, wireKind: st.wireKind };
  Object.assign(st, freshUpsizing(), keep);
}

// ---------------------------------------------------------------------------
// skin nick and track
// ---------------------------------------------------------------------------

/**
 * Nick the skin. `ctx.femoral`: at the groin the nick is made over the needle or over a dilator (Brilakis 4.2,
 * step 9); at the wrist it is made where the wire enters once the needle is out (Brilakis, radial sheath steps).
 * Never with a sheath in place. A second nick enlarges the first.
 */
export function skinNick(st: UpsizingState, ctx: { femoral: boolean; needleIn: boolean; sheathIn: boolean }): UpsizeResult {
  if (ctx.sheathIn || st.stage === "sheath") return refuse("Not with a sheath in: the blade can cut the sheath and the artery will bleed.");
  // a micropuncture dilator stopped at the skin (scar, a kinked wire) is still on the wire there: the nick is made over it
  const dilatorAtSkin = st.stage === "micro-wire" && (st.blocked?.kind === "scar" || st.blocked?.kind === "kinked-micro-wire");
  const overDilator = dilatorAtSkin || st.stage === "micro-dilator" || st.stage === "outer-dilator" || st.stage === "outer-dilator-035";
  const over: UpsizingState["nick"]["over"] = ctx.needleIn ? "needle" : overDilator ? "dilator" : "wire";
  if (ctx.femoral && over === "wire") return refuse("Nick over the needle or over the dilator, so the blade cannot cut the wire.");
  const enlarge = st.nick.done;
  st.nick = { ...st.nick, done: true, enlarged: st.nick.enlarged || enlarge, over: st.nick.over ?? over };
  const resolved = applyFix(st, enlarge ? "enlarge-nick" : "nick");
  return { ok: true, resolved: resolved ?? undefined, log: enlarge ? "Skin nick enlarged." : "Skin nicked, shallow and along the artery." };
}

/** Spread the subcutaneous track with a haemostat along the nick. */
export function spreadTrack(st: UpsizingState): UpsizeResult {
  if (!st.nick.done) return refuse("Nick the skin first, then spread the track.");
  if (st.stage === "sheath") return refuse("The sheath is in.");
  st.nick.spread = true;
  const resolved = applyFix(st, "spread");
  return { ok: true, resolved: resolved ?? undefined, log: "Track spread with a haemostat." };
}

// ---------------------------------------------------------------------------
// the micropuncture dilator and the exchange to the 0.035 inch wire
// ---------------------------------------------------------------------------

/** The needle has come out over the 0.018 inch wire. */
export function needleOut(st: UpsizingState): void {
  if (st.stage === "needle") st.stage = "micro-wire";
}

/** Advance the micropuncture dilator assembly over the 0.018 inch wire. */
export function insertMicroDilator(st: UpsizingState): UpsizeResult {
  if (st.stage !== "micro-wire") return refuse(st.stage === "needle" ? "Take the needle out over the wire first." : "The dilator is already in, or past this step.");
  for (const k of ["scar", "kinked-micro-wire"] as const) if (hasPending(st, k)) return meet(st, k);
  st.stage = "micro-dilator";
  return { ok: true, log: "Micropuncture dilator in over the 0.018 inch wire." };
}

/** Use a stiffer micropuncture dilator (a fix for scar). */
export function useStiffDilator(st: UpsizingState): UpsizeResult {
  if (st.stage !== "micro-wire") return refuse("A dilator goes on over the 0.018 inch wire, with the needle out.");
  st.stiffDilator = true;
  const resolved = applyFix(st, "stiff-dilator");
  return { ok: true, resolved: resolved ?? undefined, log: "A stiffer micropuncture dilator on the table." };
}

/** A kinked 0.018 inch wire: pull it back a little (to re-advance the dilator) or cut off the kinked part. */
export function fixKinkedWire(st: UpsizingState, how: "pull-back-wire" | "cut-kink"): UpsizeResult {
  if (st.stage !== "micro-wire") return refuse("That is for the 0.018 inch wire with the needle out and no dilator on it.");
  const resolved = applyFix(st, how);
  return { ok: true, resolved: resolved ?? undefined, log: how === "cut-kink" ? "The kinked part of the wire cut off; plenty of wire still inside the artery." : "Wire pulled back a little." };
}

/** Take the 0.018 inch wire and the inner dilator out, leaving the outer part in the artery: brisk pulsatile backflow. */
export function removeInnerDilator(st: UpsizingState): UpsizeResult {
  if (st.stage !== "micro-dilator") return refuse("There is no micropuncture dilator in.");
  st.stage = "outer-dilator";
  st.backflow = true;
  return { ok: true, log: "Wire and inner dilator out: brisk, pulsatile backflow from the outer dilator." };
}

/** Pass the 0.035 inch wire through the outer dilator to the abdominal aorta. */
export function insertWire035(st: UpsizingState, kind: Wire035Kind): UpsizeResult {
  if (st.stage !== "outer-dilator") return refuse("The 0.035 inch wire goes through the outer dilator, once the inner dilator and the 0.018 inch wire are out.");
  st.stage = "outer-dilator-035";
  st.wire035 = kind;
  return { ok: true, log: `${kind === "stiff" ? "Stiff" : "Standard"} 0.035 inch wire to the abdominal aorta.` };
}

/** Take the outer dilator off the 0.035 inch wire. */
export function removeDilator(st: UpsizingState): UpsizeResult {
  if (st.stage !== "outer-dilator-035") return refuse("There is no dilator on a 0.035 inch wire.");
  st.stage = "wire-035";
  return { ok: true, log: "Dilator out; the 0.035 inch wire stays." };
}

/**
 * The sheath kinked the 0.035 inch wire (or the wire is to be changed): sheath back out and the wire exchanged
 * through a dilator for a stiff 0.035 inch wire.
 */
export function exchangeToStiffWire(st: UpsizingState): UpsizeResult {
  if (st.stage !== "wire-035") return refuse("The exchange is made over the 0.035 inch wire, with the sheath out.");
  st.wire035 = "stiff";
  const resolved = applyFix(st, "exchange-stiff-wire");
  return { ok: true, resolved: resolved ?? undefined, log: "Wire exchanged through a dilator for a stiff 0.035 inch wire." };
}

// ---------------------------------------------------------------------------
// the sheath
// ---------------------------------------------------------------------------

/**
 * Advance the sheath. Over the 0.035 inch wire (stage wire-035) the sequence is the sourced one; straight over
 * the 0.018 inch wire (stage micro-wire) it is allowed but `viaWire035` stays false (the session scores it). A
 * track not prepared or a kinking wire stops it; a scripted subintimal course lets it in.
 */
export function insertSheath(st: UpsizingState, lengthCm: SheathLengthCm): UpsizeResult {
  if (st.stage !== "wire-035" && st.stage !== "micro-wire") return refuse(st.stage === "sheath" ? "The sheath is in." : "The sheath goes over a wire alone: needle and dilators out first.");
  const direct = st.stage === "micro-wire";
  // over the 0.018 inch wire the dilator-stage resistances stop the sheath as they would the dilator
  if (direct) for (const k of ["scar", "kinked-micro-wire"] as const) if (hasPending(st, k)) return meet(st, k);
  for (const k of ["poor-track", "wire-kink-035"] as const) {
    if (!hasPending(st, k)) continue;
    if (preempts(st, k) && st.blocked?.kind !== k) {
      st.pending = st.pending.filter((x) => x !== k);
      continue;
    }
    if (k === "wire-kink-035" && direct) continue;
    return meet(st, k);
  }
  st.stage = "sheath";
  st.viaWire035 = !direct;
  st.sheathLengthCm = lengthCm;
  st.wireLeftIn = !direct;
  if (hasPending(st, "subintimal-sheath")) {
    st.pending = st.pending.filter((x) => x !== "subintimal-sheath");
    st.subintimal = true;
    st.met.push({ kind: "subintimal-sheath", fix: null });
  }
  return { ok: true, log: `${lengthCm} cm sheath in${direct ? "" : " over the 0.035 inch wire; dilator out, wire left in"}.` };
}

/** The sheath has come out (a misplaced or subintimal sheath removed and pressed): the site starts again. */
export function sheathRemoved(st: UpsizingState): void {
  if (st.subintimal) {
    const m = [...st.met].reverse().find((x) => x.kind === "subintimal-sheath" && x.fix === null);
    if (m) m.fix = "change-site";
  }
  restartPass(st);
}

// ---------------------------------------------------------------------------
// the side-arm trace
// ---------------------------------------------------------------------------

/**
 * The side-arm pressure trace as drawn (normalised 0..1 over `n` samples, three beats): an arterial waveform, or
 * a damped, nearly flat line from a subintimal sheath. MODEL PARAMETER shape.
 */
export function sideArmTrace(kind: "arterial" | "damped", n = 121): number[] {
  return Array.from({ length: n }, (_, i) => {
    const ph = ((i / (n - 1)) * 3) % 1;
    if (kind === "damped") return 0.18 + 0.03 * Math.sin(ph * Math.PI * 2);
    const up = ph < 0.15 ? Math.sin((ph / 0.15) * Math.PI * 0.5) : Math.exp(-(ph - 0.15) / 0.45);
    const notch = ph > 0.32 && ph < 0.38 ? -0.06 : 0;
    return 0.15 + 0.75 * up + notch;
  });
}

// ---------------------------------------------------------------------------
// the femoral angiogram and its report
// ---------------------------------------------------------------------------

/** The structured report of the femoral angiogram. */
export interface FemoralAngioAnswer {
  /** where the sheath enters against the bifurcation */
  bifurcation: "above" | "at-or-below";
  /** where it enters against the lowest point of the inferior epigastric artery */
  iea: "below" | "above";
  /** the common femoral artery at the entry larger than 5 mm */
  over5mm: boolean;
  /** significant disease (calcium) of the common femoral artery */
  disease: boolean;
}

export const ANGIO_REPORT_FIELDS: readonly { key: keyof FemoralAngioAnswer; label: string; options: readonly { value: FemoralAngioAnswer[keyof FemoralAngioAnswer]; label: string }[] }[] = [
  { key: "bifurcation", label: "Sheath entry and the bifurcation", options: [{ value: "above", label: "Above it" }, { value: "at-or-below", label: "At or below it" }] },
  { key: "iea", label: "Entry and the inferior epigastric artery", options: [{ value: "below", label: "Below its lowest point" }, { value: "above", label: "Above it" }] },
  { key: "over5mm", label: "Common femoral artery at the entry", options: [{ value: true, label: "Larger than 5 mm" }, { value: false, label: "5 mm or smaller" }] },
  { key: "disease", label: "Disease or calcium", options: [{ value: false, label: "None significant" }, { value: true, label: "Present" }] },
];

/** What a femoral artery site's anatomy says against an entry: the truth the report is graded against (pure). */
export function femoralAngioTruth(site: {
  landmarks: { bifurcationX?: number };
  tubes: readonly { id: string; r: number }[];
  arteryId: string;
  branches: readonly { id: string; xFrom: number }[];
  calcium: readonly { fromX: number; toX: number }[];
}, entry: { x: number; vessel: string }, cls: "ok" | "high" | "low" | "distal" | "proximal" | "none"): FemoralAngioAnswer {
  const iea = site.branches.find((b) => b.id === "iea");
  const art = site.tubes.find((t) => t.id === (entry.vessel === site.arteryId ? site.arteryId : entry.vessel)) ?? site.tubes.find((t) => t.id === site.arteryId);
  return {
    bifurcation: cls === "low" || entry.vessel !== site.arteryId ? "at-or-below" : "above",
    iea: iea && entry.x > iea.xFrom ? "above" : "below",
    over5mm: !!art && art.r * 2 > SOURCED_UPSIZING.deviceCfaMm,
    disease: site.calcium.length > 0,
  };
}

export interface FemoralAngioGrade {
  items: { key: keyof FemoralAngioAnswer; label: string; expected: string; given: string; correct: boolean }[];
  correct: number;
  total: number;
}

const optionLabel = (key: keyof FemoralAngioAnswer, v: unknown) => ANGIO_REPORT_FIELDS.find((f) => f.key === key)?.options.find((o) => o.value === v)?.label ?? String(v);

/** Grade a report against the truth (pure). */
export function gradeFemoralAngioReport(given: FemoralAngioAnswer, truth: FemoralAngioAnswer): FemoralAngioGrade {
  const items = ANGIO_REPORT_FIELDS.map((f) => ({ key: f.key, label: f.label, expected: optionLabel(f.key, truth[f.key]), given: optionLabel(f.key, given[f.key]), correct: given[f.key] === truth[f.key] }));
  return { items, correct: items.filter((i) => i.correct).length, total: items.length };
}

/** Is a C-arm angle (deg, + LAO) the ipsilateral oblique for this groin (Brilakis 4.2, step 15)? */
export function ipsilateralOblique(laoDeg: number, side: "right" | "left"): boolean {
  const [a, b] = SOURCED_UPSIZING.obliqueDeg;
  const deg = side === "right" ? -laoDeg : laoDeg;
  return deg >= a && deg <= b;
}
