// ---------------------------------------------------------------------------
// The equipment cart and the prep station of the PCI table (pci-equipment-tray).
//
// The cart (CartStock) lists what is stocked, in which sizes, how many boxes
// and the use-by date printed on the front box, on the case's date. A
// scenario names its stock with PciScenarioDef.stock; absent, the cart holds
// the full catalogue of balloons and stents (src/simulation/pci/equipment.ts)
// and the bail-out items the cart check walks through
// (eq-balloons-stents-cart-cart: guide extensions, covered stents, coils of
// 0.014 and 0.018 in. compatibility, snares, a re-entry system). Boxes whose
// front box is out of date, and bail-out items missing from the shelf, are
// drawn from the cart's own seed, so the same case opens the same cart and
// the cart's draws never shift the procedure's. The cart check is due before
// complex and CTO cases (cartCheckDue: a chronic occlusion or severe calcium).
//
// The prep station's mixtures and their iodine follow the module text
// (pm-prep-and-stent-balloon-choose, Step 4: "usually half contrast and half
// saline"; "a weaker mixture inflates and deflates faster but the balloon is
// harder to see"; a balloon filled with saline or holding air cannot be
// seen). The undiluted contrast is injection.ts IODINE_MG_PER_ML. The
// visibility threshold, the air left by each suction cycle, the stock
// quantities, the expiry and missing draws and the case's date are MODEL
// PARAMETERS (docs/realism/facts/pkg-pci-equipment-tray.md).
//
// The cart and the box labels are what the operator reads; whether a box is
// out of date is the engine's truth until the label is read back
// (actions/devices.ts checkLabel), and the debrief lists what was used.
// ---------------------------------------------------------------------------

import { DEVICE_BY_ID, DEVICES, MP_DEFAULT_USE_BY, boxLabel, type BoxLabel, type DeviceSpec } from "./equipment";
import { IODINE_MG_PER_ML } from "../injection";
import { rngFrom, rnd, type RngState } from "./rng";
import { trayOf, type BalloonMixture, type CartBox, type CartStock, type Device, type PciScenario, type PciState, type TrayRecord } from "./state";

// --- model parameters (docs/realism/facts/pkg-pci-equipment-tray.md) -----------------------------

/** The case's date on the cart (YYYY-MM-DD): synthetic, before the catalogue's default use-by date. MODEL PARAMETER. */
export const MP_CASE_DATE = "2027-03-15";
/** Boxes of each size on the shelf when the cart is full. MODEL PARAMETER. */
export const MP_BOXES_PER_SIZE = 2;
/** Share of balloon and stent sizes whose front box is out of date. MODEL PARAMETER. */
export const MP_EXPIRED_SHARE = 0.04;
/** Share of the bail-out items (cart-check list) found missing, and found with an out-of-date front box. MODEL PARAMETERS. */
export const MP_CHECK_MISSING_SHARE = 0.2;
export const MP_CHECK_EXPIRED_SHARE = 0.2;
/** An out-of-date box expired this many days before the case's date, at most (drawn from 14 days up). MODEL PARAMETER. */
export const MP_EXPIRED_MAX_DAYS = 180;
/** Iodine (mg/mL) above which an inflated balloon shows on fluoroscopy. MODEL PARAMETER. */
export const MP_BALLOON_VISIBLE_MG_PER_ML = 60;
/** Share of the balloon's air that one negative suction cycle with the plunger up leaves behind. MODEL PARAMETER. */
export const MP_SUCTION_AIR_KEEP = 0.25;
/** Residual air (share of an unprepared balloon's) at or below which the balloon counts as prepared. MODEL PARAMETER. */
export const MP_AIR_PURGED = 0.1;
/** Air an unprepared device carries into the guide when it is introduced (mL). MODEL PARAMETER (cf. airEmbolism.ts MP_AIR_PER_INSERT_ML). */
export const MP_UNPREPARED_GUIDE_AIR_ML = 0.12;
/** The longest lucent gap residual air makes in an inflated balloon, as a share of its length. MODEL PARAMETER. */
export const MP_AIR_GAP_MAX = 0.5;

/** The share of contrast in each prep-syringe mixture. */
export const MIXTURE_CONTRAST_SHARE: Readonly<Record<BalloonMixture, number>> = { "1:1": 0.5, "1:2": 1 / 3, saline: 0, none: 0 };
/** The mixtures the prep station offers, with their names. */
export const MIXTURES: readonly { id: BalloonMixture; label: string }[] = [
  { id: "1:1", label: "Contrast and saline 1:1" },
  { id: "1:2", label: "Contrast 1 : saline 2" },
  { id: "saline", label: "Saline only" },
  { id: "none", label: "No syringe (air)" },
];

/** The device classes the cart's shelves hold for the tray's request (balloons and stents). */
const SHELF_CLASSES: readonly DeviceSpec["cls"][] = ["balloon", "stent", "covered-stent"];
/**
 * The bail-out items the cart check walks through (eq-balloons-stents-cart-cart, the 'check the cart' list):
 * those the catalogue holds. Microcatheters (coronaryWire.ts) and the pericardiocentesis kit are not
 * catalogue devices and are not listed.
 */
export const CART_CHECK_IDS: readonly string[] = ["extension", "covered", "covered-pu", "coil-014", "coil-018", "snare-coronary", "snare-aortic", "reentry"].filter((id) => !!DEVICE_BY_ID[id]);

// --- dates -----------------------------------------------------------------------------------------

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** A use-by date before `today` (14 to MP_EXPIRED_MAX_DAYS days). */
function expiredDate(rng: RngState, today: string): string {
  return addDays(today, -(14 + Math.floor(rnd(rng) * (MP_EXPIRED_MAX_DAYS - 14))));
}

// --- the cart --------------------------------------------------------------------------------------

/** The sizes of a spec as boxes (one per diameter and length; lengths of 0 or none count once). */
function sizesOf(spec: DeviceSpec): { diameter: number; lengthMm: number }[] {
  const lens = spec.lengths.length ? spec.lengths : [0];
  const out: { diameter: number; lengthMm: number }[] = [];
  for (const d of spec.diameters) for (const l of lens) out.push({ diameter: d, lengthMm: l });
  return out;
}

/** The specs on the cart's shelves (the tray's request menu): balloons, stents and covered stents. */
export function shelfSpecs(): DeviceSpec[] {
  return DEVICES.filter((d) => SHELF_CLASSES.includes(d.cls));
}

/**
 * Build the cart for a stock id and a seed (pure: the same id and seed give the same cart). Every shelf
 * size has MP_BOXES_PER_SIZE boxes in date; MP_EXPIRED_SHARE of them have an out-of-date front box, and
 * one common predilatation size (a 2.5-3.0 mm semi-compliant or non-compliant balloon) always has, so
 * every case has the trap. Each bail-out item is missing (no boxes) or out of date with the shares above.
 */
export function buildCart(stockId: string | undefined, seed: string | number, today: string = MP_CASE_DATE): CartStock {
  const rng = rngFrom(`cart:${stockId ?? "full"}:${seed}`);
  const boxes: CartBox[] = [];
  const box = (specId: string, diameter: number, lengthMm: number, o: { qty?: number; expired?: boolean } = {}): CartBox => ({
    specId,
    diameter,
    lengthMm,
    qty: o.qty ?? MP_BOXES_PER_SIZE,
    useBy: o.expired ? expiredDate(rng, today) : MP_DEFAULT_USE_BY,
    expiredFront: !!o.expired,
  });
  for (const spec of shelfSpecs()) for (const z of sizesOf(spec)) boxes.push(box(spec.id, z.diameter, z.lengthMm, { expired: rnd(rng) < MP_EXPIRED_SHARE }));
  // the planted trap: one common predilatation balloon size with its front box out of date
  const common = boxes.filter((b) => (b.specId === "sc" || b.specId === "nc") && b.diameter >= 2.5 && b.diameter <= 3.0 && b.lengthMm >= 12 && b.lengthMm <= 20);
  if (common.length && !common.some((b) => b.expiredFront)) {
    const b = common[Math.floor(rnd(rng) * common.length)];
    b.useBy = expiredDate(rng, today);
    b.expiredFront = true;
  }
  for (const id of CART_CHECK_IDS) {
    const spec = DEVICE_BY_ID[id];
    for (const z of sizesOf(spec)) {
      if (boxes.some((b) => b.specId === id && b.diameter === z.diameter && b.lengthMm === z.lengthMm)) continue;
      const r = rnd(rng);
      boxes.push(box(id, z.diameter, z.lengthMm, r < MP_CHECK_MISSING_SHARE ? { qty: 0 } : { expired: r < MP_CHECK_MISSING_SHARE + MP_CHECK_EXPIRED_SHARE }));
    }
  }
  return { id: stockId ?? "full", today, boxes };
}

/** The cart check is due before complex and CTO cases (eq-balloons-stents-cart#5): a chronic occlusion or severe calcium. */
export function cartCheckDue(s: Pick<PciScenario, "target" | "calcium">): boolean {
  return s.target.kind === "cto" || s.calcium === 2;
}

/** The box of a size on the cart (null when the cart does not stock it). */
export function cartBox(cart: CartStock, specId: string, diameter: number, lengthMm: number): CartBox | null {
  return cart.boxes.find((b) => b.specId === specId && Math.abs(b.diameter - diameter) < 1e-6 && (b.lengthMm === lengthMm || DEVICE_BY_ID[specId]?.lengths.length === 0)) ?? null;
}

/** Take the front box of a size: the cart with one box fewer (the next box is in date), and the box taken; null when none is left. */
export function takeBox(cart: CartStock, specId: string, diameter: number, lengthMm: number): { cart: CartStock; useBy: string; expired: boolean } | null {
  const b = cartBox(cart, specId, diameter, lengthMm);
  if (!b || b.qty <= 0) return null;
  const taken = { useBy: b.useBy, expired: cart.today > b.useBy };
  const boxes = cart.boxes.map((x) => (x === b ? { ...x, qty: x.qty - 1, useBy: MP_DEFAULT_USE_BY, expiredFront: false } : x));
  return { cart: { ...cart, boxes }, ...taken };
}

/** Restock: every size back to MP_BOXES_PER_SIZE boxes in date. */
export function restocked(cart: CartStock): CartStock {
  return { ...cart, boxes: cart.boxes.map((b) => ({ ...b, qty: Math.max(b.qty, MP_BOXES_PER_SIZE), useBy: MP_DEFAULT_USE_BY, expiredFront: false })) };
}

/** The bail-out lines of the cart check: each item's sizes with what is on the shelf (what the operator reads). */
export function cartCheckList(cart: CartStock): { specId: string; label: string; sizes: { size: string; qty: number; useBy: string }[] }[] {
  return CART_CHECK_IDS.map((id) => {
    const spec = DEVICE_BY_ID[id];
    const sizes = cart.boxes
      .filter((b) => b.specId === id)
      .map((b) => {
        const unit = spec.sizeUnit ?? "mm";
        const size = unit === "Fr" ? `${b.diameter} Fr${b.lengthMm ? `, ${b.lengthMm} cm` : ""}` : b.lengthMm ? `${b.diameter.toFixed(2)} × ${b.lengthMm} mm` : `${b.diameter} mm`;
        return { size, qty: b.qty, useBy: b.qty > 0 ? b.useBy : "" };
      });
    return { specId: id, label: spec.label, sizes };
  });
}

/** The cart items that need action (truth for the debrief and the tests): missing or with an out-of-date front box. */
export function cartProblems(cart: CartStock): { specId: string; diameter: number; lengthMm: number; problem: "missing" | "expired" }[] {
  return cart.boxes
    .filter((b) => CART_CHECK_IDS.includes(b.specId) && (b.qty <= 0 || cart.today > b.useBy))
    .map((b) => ({ specId: b.specId, diameter: b.diameter, lengthMm: b.lengthMm, problem: b.qty <= 0 ? "missing" : "expired" }));
}

/** The cart of a state, built from its seed on first use (the scenario's stock id when given). */
export function cartOf(st: Pick<PciState, "tray" | "log">, stockId?: string): CartStock {
  const have = trayOf(st).cart;
  if (have) return have;
  const start = st.log.find((r) => r.kind === "case-start");
  const seed = String(start?.data.seed ?? start?.data.scenario ?? "pci");
  return buildCart(stockId, seed);
}

/** The label of the device's box, with its use-by date and the case's date (boxLabel flags expiry for the engine). */
export function deviceBoxLabel(dev: Device, today: string = MP_CASE_DATE): BoxLabel {
  const spec = DEVICE_BY_ID[dev.specId];
  return boxLabel(spec, dev.diameter, dev.lengthMm, { useBy: dev.box?.useBy ?? MP_DEFAULT_USE_BY, today });
}

// --- the prep station ------------------------------------------------------------------------------

/** Iodine of a mixture (mg/mL). */
export function mixtureIodineMgPerMl(m: BalloonMixture): number {
  return IODINE_MG_PER_ML * MIXTURE_CONTRAST_SHARE[m];
}

/** The mixture in a device's balloon: its own, else the team's usual 1:1 (a device loaded by the assisted path). */
export function deviceMixture(dev: Pick<Device, "mixture" | "prepared">): BalloonMixture {
  if (dev.mixture) return dev.mixture;
  return dev.prepared ? "1:1" : "none";
}

/** Residual air in a device's balloon (0..1). */
export function deviceAir(dev: Pick<Device, "airFraction" | "prepared">): number {
  return dev.airFraction ?? (dev.prepared ? 0 : 1);
}

/** The iodine of an inflated balloon (mg/mL): its mixture, less the share of it that is air. */
export function balloonIodineMgPerMl(dev: Pick<Device, "mixture" | "airFraction" | "prepared">): number {
  return mixtureIodineMgPerMl(deviceMixture(dev)) * (1 - Math.min(1, deviceAir(dev)));
}

/** An inflated balloon shows on fluoroscopy (its iodine reaches MP_BALLOON_VISIBLE_MG_PER_ML). */
export function balloonVisible(dev: Pick<Device, "mixture" | "airFraction" | "prepared">): boolean {
  return balloonIodineMgPerMl(dev) >= MP_BALLOON_VISIBLE_MG_PER_ML;
}

/** Air left after `cycles` suction cycles, from an unprepared balloon's (1); a balloon without a filled syringe keeps its air. */
export function airAfterSuction(cycles: number, mixture: BalloonMixture | null | undefined): number {
  if (!mixture || mixture === "none") return 1;
  return Math.pow(MP_SUCTION_AIR_KEEP, Math.max(0, cycles));
}

/** Prepared: a syringe of fluid, the air down to MP_AIR_PURGED, and the indeflator on (pm-prep-and-stent, Step 4). */
export function preparedNow(dev: Pick<Device, "mixture" | "airFraction" | "indeflatorConnected">): boolean {
  return !!dev.mixture && dev.mixture !== "none" && (dev.airFraction ?? 1) <= MP_AIR_PURGED + 1e-9 && !!dev.indeflatorConnected;
}

/** Air (share of an unprepared balloon's) rising on the last pull above which the bubbles look large. MODEL PARAMETER. */
export const MP_SYRINGE_LARGE_BUBBLES = 0.2;

/**
 * What the operator sees in the prep syringe as the plunger is pulled (no number: bubbles or none): the air
 * that rose on the last pull, the air before it (airFraction / MP_SUCTION_AIR_KEEP) less the air left. With a
 * keep of 0.25 the pulls show large bubbles, then a few small ones, then none (0.75, 0.19, 0.05).
 */
export function syringeView(dev: Pick<Device, "mixture" | "airFraction" | "suctionCycles">): string {
  if (!dev.mixture) return "Syringe not filled";
  if (dev.mixture === "none") return "No fluid in the line: air only";
  if (!dev.suctionCycles) return "Filled, not yet put on negative";
  const left = dev.airFraction ?? 1;
  const rose = Math.min(1, left / MP_SUCTION_AIR_KEEP) - left;
  return rose > MP_SYRINGE_LARGE_BUBBLES ? "Large bubbles rise into the syringe" : rose > MP_AIR_PURGED ? "A few small bubbles still rise" : "No more bubbles rise";
}

// --- the debrief -----------------------------------------------------------------------------------

/** The tray's debrief lines: what was done at the table (shown after the case only). */
export function trayDebrief(st: Pick<PciState, "tray" | "counters">, s?: Pick<PciScenario, "target" | "calcium">): { ok: boolean; text: string }[] {
  const t: TrayRecord = trayOf(st);
  const out: { ok: boolean; text: string }[] = [];
  if (s && cartCheckDue(s)) out.push({ ok: t.cartCheckedT !== null, text: t.cartCheckedT !== null ? "The cart was checked before the case." : "The cart was not checked before a complex case." });
  for (const e of t.expiredUsed) {
    const spec = DEVICE_BY_ID[e.specId];
    out.push({ ok: false, text: `An out-of-date device was used: ${spec?.label ?? e.specId} ${e.diameter.toFixed(2)} × ${e.lengthMm} mm, use by ${e.useBy}.` });
  }
  const flagged = t.labelChecks.filter((c) => c.expired).length;
  if (flagged) {
    const sent = t.returned.filter((r) => r.expired).length;
    out.push({ ok: sent >= flagged, text: `${flagged} out-of-date box${flagged > 1 ? "es were" : " was"} found at the label check${sent ? `, ${sent} sent back` : ""}.` });
  }
  const noWire = t.checklist.filter((c) => !c.wireChecked || c.wireInSmallBranch).length;
  if (noWire) out.push({ ok: false, text: `${noWire} device${noWire > 1 ? "s" : ""} went in without the wire tip checked by an injection, or with the tip in a small branch.` });
  const dirty = t.checklist.filter((c) => !c.guideClear).length;
  if (dirty) out.push({ ok: false, text: `${dirty} device${dirty > 1 ? "s" : ""} went in before the guide was back-bled and aspirated after the last removal.` });
  for (const w of t.wireLoads.filter((x) => x.damaged)) out.push({ ok: false, text: `The ${w.kind} wire's tip was damaged on loading (${(w.cause ?? "").replace(/-/g, " ")}).` });
  if (t.assisted.length) out.push({ ok: true, text: `The scrub nurse did ${t.assisted.length} step${t.assisted.length > 1 ? "s" : ""} on request: ${[...new Set(t.assisted.map((a) => a.step))].join(", ")}.` });
  if (t.cart && s && cartCheckDue(s)) out.push({ ok: t.restocked, text: t.restocked ? "The cart was restocked after the case." : "The cart was not restocked after the case." });
  return out;
}
