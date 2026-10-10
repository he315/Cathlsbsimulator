// ---------------------------------------------------------------------------
// Scrub nurse: equipment, drugs for the table and IV heparin, the ACT, holding
// the wire, contrast thresholds.
//
// Perception scope: the table and the inventory, the syringes she has drawn
// up, the ACT machine, the contrast count (S9 renal.threshold events).
// ---------------------------------------------------------------------------

import type { TelemetryEvent } from "../../session/types";
import type { TeamCore } from "../agent";
import type { ItemSpec, Order, TableItem, TeamIntent } from "../types";
import { receiveDrugOrder } from "./drugs";

const SRC = "team:scrub";

/** The item a wrong-item event delivers instead: the neighbouring size or curve. */
export function neighbourItem(core: TeamCore, it: ItemSpec): ItemSpec {
  const bump = (x: number, step: number, lo: number, hi: number) => {
    const up = core.chance(0.5);
    const v = Math.round((x + (up ? step : -step)) * 100) / 100;
    return v < lo || v > hi ? Math.round((x + (up ? -step : step)) * 100) / 100 : v;
  };
  if ((it.kind === "catheter" || it.kind === "guide") && /\d/.test(it.key)) {
    const m = it.key.match(/^([A-Z]+)(\d+(?:\.\d+)?)$/);
    if (m) {
      const n = Number(m[2]);
      const step = m[1] === "AL" || m[1] === "AR" || m[1] === "MP" ? 1 : 0.5;
      const v = bump(n, step, step === 1 ? 1 : 3, step === 1 ? 3 : 6);
      const label = m[1] === "EB" ? `extra backup ${v.toFixed(1)}` : `${m[1]}${v}`;
      return { ...it, key: `${m[1]}${v}`, name: label };
    }
  }
  if ((it.kind === "balloon" || it.kind === "stent") && it.diameterMm && it.lengthMm) {
    const d = bump(it.diameterMm, 0.5, 1.5, 5);
    const name = it.name.replace(/^\d(?:\.\d+)?/, Number.isInteger(d) ? d.toFixed(1) : String(d));
    return { ...it, diameterMm: d, name };
  }
  if (it.kind === "wire" && it.key === "wire-workhorse") return { ...it, key: "wire-hydrophilic", name: "hydrophilic wire" };
  if (it.french) return { ...it, french: it.french === 6 ? 5 : 6, name: it.name.replace(/\d French/, `${it.french === 6 ? 5 : 6} French`) };
  return it;
}

export function itemLabel(it: ItemSpec): string {
  if ((it.kind === "catheter" || it.kind === "guide") && it.french) return `${it.french} French ${it.name}${it.kind === "guide" && !/guide/.test(it.name) ? " guide" : ""}`;
  return it.name;
}

export function receiveScrubOrder(core: TeamCore, order: Order) {
  const i = order.heard;
  switch (i.k) {
    case "drug":
      return receiveDrugOrder(core, order);
    case "infusion":
      return receiveInfusion(core, order, i);
    case "act": {
      core.updateOrder(order, { status: "readback" });
      const end = core.say("scrub", "ACT, yes.", "readback", { to: "operator", orderId: order.id });
      core.schedule(end + core.P.actSampleS, "act-sample", "scrub", { orderId: order.id });
      return;
    }
    case "equipment": {
      core.updateOrder(order, { status: "readback" });
      const end = core.say("scrub", `${itemLabel(i.item)}.`, "readback", { to: "operator", orderId: order.id });
      core.schedule(end + core.rand(core.P.fetchS[0], core.P.fetchS[1]), "item-arrive", "scrub", { orderId: order.id });
      return;
    }
    case "holdWire": {
      core.opts.input?.emit({ t: "pin", target: "wire", on: true, source: SRC });
      core.setMem("scrub.holdingWire", true);
      core.updateOrder(order, { status: "done", doneAt: core.t });
      core.say("scrub", "I've got the wire.", "readback", { to: "operator", orderId: order.id });
      return;
    }
    case "haveWire": {
      core.opts.input?.emit({ t: "pin", target: "wire", on: false, source: SRC });
      const was = core.mem("scrub.holdingWire", false);
      core.setMem("scrub.holdingWire", false);
      core.updateOrder(order, { status: "done", doneAt: core.t });
      core.say("scrub", was ? "Your wire." : "You've got it.", "readback", { to: "operator", orderId: order.id });
      return;
    }
    case "query": {
      core.updateOrder(order, { status: "done", doneAt: core.t });
      const v = core.patient?.vitals();
      if (!v) return void core.say("scrub", "I haven't got a count.", "report", { to: "operator", orderId: order.id });
      const c = v.contrast;
      core.say("scrub", `${Math.round(c.totalMl)} mL of contrast so far, ${Math.round(c.fractionOfMacd * 100)} percent of the Cigarroa maximum of ${Math.round(c.macdMl)}.`, "report", { to: "operator", orderId: order.id });
      return;
    }
    default:
      core.updateOrder(order, { status: "refused" });
      core.say("scrub", "Sorry, say again?", "query", { to: "operator", orderId: order.id });
  }
}

function receiveInfusion(core: TeamCore, order: Order, i: Extract<TeamIntent, { k: "infusion" }>) {
  const unit = i.drug === "adenosine" ? "micrograms per kilo per minute" : i.drug === "noradrenaline" ? "micrograms per minute" : "units an hour";
  if (i.stop) {
    core.updateOrder(order, { status: "readback" });
    const end = core.say(order.role, `Stopping the ${i.drug}.`, "readback", { to: "operator", orderId: order.id });
    core.schedule(end, "infusion", order.role, { orderId: order.id, drug: i.drug, stop: true });
    return;
  }
  if (!(i.rate !== undefined && i.rate > 0)) {
    core.updateOrder(order, { status: "queried", queryReason: "rate" });
    core.say(order.role, `What rate for the ${i.drug}?`, "query", { to: "operator", orderId: order.id });
    return;
  }
  core.updateOrder(order, { status: "readback" });
  const end = core.say(order.role, `${i.drug.charAt(0).toUpperCase() + i.drug.slice(1)} at ${i.rate} ${unit}.`, "readback", { to: "operator", orderId: order.id });
  core.schedule(end + core.rand(core.P.ivPrepS[0], core.P.ivPrepS[1]), "infusion", order.role, { orderId: order.id, drug: i.drug, rate: i.rate });
}

export function installScrub(core: TeamCore) {
  core.handle("act-sample", (c, tm) => {
    const order = c.order(Number(tm.data.orderId));
    if (!order || order.status === "cancelled") return;
    const act = c.patient?.measureAct();
    if (act === undefined) {
      c.updateOrder(order, { status: "done", doneAt: c.t });
      c.say("scrub", "I can't get a sample for the ACT.", "report", { to: "operator", orderId: order.id });
      return;
    }
    c.updateOrder(order, { status: "in-progress" });
    // the ACT is a clotting time: the machine gives the result when the sample clots (fact C4-F9)
    c.schedule(c.t + act, "act-result", "scrub", { orderId: order.id, act });
  });
  core.handle("act-result", (c, tm) => {
    const order = c.order(Number(tm.data.orderId));
    if (order && order.status !== "cancelled") c.updateOrder(order, { status: "done", doneAt: c.t });
    c.telemetry("team.act", { act: tm.data.act });
    c.say("scrub", `ACT is ${tm.data.act}.`, "report", { to: "operator", orderId: order?.id });
  });
  core.handle("item-arrive", (c, tm) => {
    const order = c.order(Number(tm.data.orderId));
    if (!order || order.status === "cancelled") return;
    const asked = (order.heard as Extract<TeamIntent, { k: "equipment" }>).item;
    const replacing = tm.data.replaceOf as number | undefined;
    const wrong = replacing === undefined && c.chance(c.P.wrongItemP);
    const actual = wrong ? neighbourItem(c, asked) : asked;
    const item: TableItem = { id: c.id(), orderId: order.id, asked, actual, arrivedAt: c.t };
    c.st.items.push(item);
    c.updateOrder(order, { status: "done", doneAt: c.t });
    if (wrong) c.telemetry("team.wrong-item", { itemId: item.id, asked: asked.name, actual: actual.name });
    c.telemetry("team.item", { itemId: item.id, asked: asked.name, actual: actual.name });
    // the nurse believes it is what was asked for
    c.say("scrub", `${itemLabel(asked)} open on the table.`, "report", { to: "operator", orderId: order.id });
    c.act({ a: "item-delivered", item });
  });
  core.handle("infusion", (c, tm) => {
    const order = c.order(Number(tm.data.orderId));
    if (!order || order.status === "cancelled") return;
    const drug = tm.data.drug as "adenosine" | "noradrenaline" | "heparin";
    if (tm.data.stop) c.patient?.stopInfusion(drug);
    else c.patient?.startInfusion({ drug, rate: Number(tm.data.rate), site: "peripheral" });
    c.updateOrder(order, { status: "done", doneAt: c.t });
    c.telemetry("team.infusion", { drug, rate: tm.data.rate ?? 0, stop: !!tm.data.stop });
    c.say(order.role, tm.data.stop ? `${drug.charAt(0).toUpperCase() + drug.slice(1)} off at ${c.clock()}.` : `${drug.charAt(0).toUpperCase() + drug.slice(1)} running at ${c.clock()}.`, "report", { to: "operator", orderId: order.id });
  });
}

/** "Check the label": the most recent unchecked item. */
export function labelCheck(core: TeamCore): boolean {
  const item = [...core.st.items].reverse().find((x) => x.labelCheckedAt === undefined && !x.replaced && x.usedAt === undefined);
  if (!item) {
    core.say("scrub", "Nothing new on the table.", "report", { to: "operator" });
    return false;
  }
  item.labelCheckedAt = core.t;
  core.telemetry("team.label-check", { itemId: item.id, wrong: item.actual.name !== item.asked.name });
  if (item.actual.name === item.asked.name && item.actual.french === item.asked.french) {
    core.say("scrub", `Label reads ${itemLabel(item.actual)}. In date.`, "report", { to: "operator" });
    return true;
  }
  const end = core.say("scrub", `Label reads ${itemLabel(item.actual)}. Sorry, that's the wrong one. I'll get the ${itemLabel(item.asked)}.`, "report", { to: "operator" });
  item.replaced = true;
  core.act({ a: "item-replaced", item });
  core.schedule(end + core.rand(core.P.fetchS[0], core.P.fetchS[1]), "item-arrive", "scrub", { orderId: item.orderId, replaceOf: item.id });
  const order = core.order(item.orderId);
  if (order) core.updateOrder(order, { status: "in-progress" });
  return true;
}

/** The lab reports an item from the table loaded into the patient. Returns what was actually used. */
export function itemUsed(core: TeamCore, itemId: number): ItemSpec | null {
  const item = core.st.items.find((x) => x.id === itemId);
  if (!item) return null;
  item.usedAt = core.t;
  const wrong = item.actual.name !== item.asked.name || item.actual.french !== item.asked.french;
  core.telemetry("team.item-used", { itemId, checked: item.labelCheckedAt !== undefined, wrong });
  if (wrong && item.labelCheckedAt === undefined) core.finding("safety", "wrong-item-used", `${itemLabel(item.actual)} was used when ${itemLabel(item.asked)} was asked for; the label was not checked.`);
  return item.actual;
}

/** Scrub nurse's unprompted remarks from engine telemetry. */
export function scrubTelemetry(core: TeamCore, ev: TelemetryEvent) {
  if (ev.kind !== "renal.threshold" || core.opts.callouts === false) return;
  const d = ev.data ?? {};
  const ml = Number(d.contrastMl);
  if (d.metric === "macd") {
    const pct = Math.round(Number(d.fraction) * 100);
    core.say("scrub", `That's ${ml} mL of contrast, ${pct} percent of the Cigarroa maximum.`, "callout", { to: "operator" });
  } else {
    core.say("scrub", `Contrast is ${ml} mL, now ${d.threshold} times the creatinine clearance.`, "callout", { to: "operator" });
  }
}
