// ---------------------------------------------------------------------------
// Sedation nurse or anaesthetist: sedation and analgesia, IV emergency drugs,
// fluids, oxygen, the airway and conscious level, the defibrillator and CPR.
//
// Perception scope: the patient's face and breathing (S9 symptoms: conscious
// level, drowsiness), the pulse oximeter (SpO2) and the defibrillator state.
// ---------------------------------------------------------------------------

import type { TelemetryEvent } from "../../session/types";
import type { TeamCore } from "../agent";
import type { Order } from "../types";
import { receiveDrugOrder } from "./drugs";

export function receiveSedationOrder(core: TeamCore, order: Order) {
  const i = order.heard;
  const p = core.patient;
  switch (i.k) {
    case "drug":
      return receiveDrugOrder(core, order);
    case "fluid": {
      if (!(i.ml !== undefined && i.ml > 0)) {
        core.updateOrder(order, { status: "queried", queryReason: "volume" });
        core.say("sedation", "How much fluid?", "query", { to: "operator", orderId: order.id });
        return;
      }
      core.updateOrder(order, { status: "readback" });
      const end = core.say("sedation", `${i.ml} mL saline, stat.`, "readback", { to: "operator", orderId: order.id });
      core.schedule(end + 8, "fluid", "sedation", { orderId: order.id, ml: i.ml });
      return;
    }
    case "oxygen": {
      if (i.off) {
        core.updateOrder(order, { status: "done", doneAt: core.t });
        core.say("sedation", "Oxygen off.", "readback", { to: "operator", orderId: order.id });
        core.act({ a: "oxygen", lpm: 0 });
        return;
      }
      if (!(i.lpm !== undefined && i.lpm > 0)) {
        core.updateOrder(order, { status: "queried", queryReason: "flow" });
        core.say("sedation", "How many litres?", "query", { to: "operator", orderId: order.id });
        return;
      }
      core.updateOrder(order, { status: "done", doneAt: core.t });
      core.say("sedation", `${i.lpm} litres of oxygen on.`, "readback", { to: "operator", orderId: order.id });
      core.act({ a: "oxygen", lpm: i.lpm });
      core.telemetry("team.oxygen", { lpm: i.lpm });
      return;
    }
    case "defib": {
      if (i.action === "pads") {
        core.updateOrder(order, { status: "readback" });
        const end = core.say("sedation", "Pads going on.", "readback", { to: "operator", orderId: order.id });
        core.schedule(end + 6, "pads", "sedation", { orderId: order.id });
        return;
      }
      if (i.action === "charge") {
        const j = i.joules ?? core.P.defaultJoules;
        core.updateOrder(order, { status: "in-progress" });
        core.say("sedation", `Charging to ${j}.`, "readback", { to: "operator", orderId: order.id, urgent: true });
        p?.charge(j);
        core.setMem("sedation.charging", order.id);
        return;
      }
      if (i.action === "clear") {
        core.updateOrder(order, { status: "done", doneAt: core.t });
        p?.clearForShock();
        core.say("sedation", "Oxygen away. Everyone clear.", "readback", { to: "operator", orderId: order.id, urgent: true });
        return;
      }
      if (i.action === "disarm") {
        core.updateOrder(order, { status: "done", doneAt: core.t });
        core.say("sedation", "Disarmed.", "readback", { to: "operator", orderId: order.id, urgent: true });
        core.telemetry("team.defib-disarm", {});
        return;
      }
      // shock
      core.updateOrder(order, { status: "readback" });
      const end = core.say("sedation", "Shocking.", "readback", { to: "operator", orderId: order.id, urgent: true });
      core.schedule(end, "shock", "sedation", { orderId: order.id });
      return;
    }
    case "cpr": {
      core.updateOrder(order, { status: "done", doneAt: core.t });
      p?.setCpr(i.on);
      core.say("sedation", i.on ? "Starting compressions." : "Compressions stopped.", "readback", { to: "operator", orderId: order.id, urgent: true });
      return;
    }
    case "query": {
      core.updateOrder(order, { status: "done", doneAt: core.t });
      const v = p?.vitals();
      core.say("sedation", !v ? "No probe on." : v.spo2 === null ? "I'm not picking up a sats trace." : `Sats ${v.spo2} percent.`, "report", { to: "operator", orderId: order.id });
      return;
    }
    default:
      core.updateOrder(order, { status: "refused" });
      core.say("sedation", "Sorry, say again?", "query", { to: "operator", orderId: order.id });
  }
}

export function installSedation(core: TeamCore) {
  core.handle("fluid", (c, tm) => {
    const order = c.order(Number(tm.data.orderId));
    if (!order || order.status === "cancelled") return;
    const ml = Number(tm.data.ml);
    c.patient?.fluid(ml, 120);
    c.updateOrder(order, { status: "done", doneAt: c.t });
    c.say("sedation", `${ml} mL running at ${c.clock()}.`, "report", { to: "operator", orderId: order.id });
  });
  core.handle("pads", (c, tm) => {
    const order = c.order(Number(tm.data.orderId));
    if (!order || order.status === "cancelled") return;
    c.updateOrder(order, { status: "done", doneAt: c.t });
    c.act({ a: "pads-on" });
    c.say("sedation", "Pads on.", "report", { to: "operator", orderId: order.id });
  });
  core.handle("shock", (c, tm) => {
    const order = c.order(Number(tm.data.orderId));
    if (!order || order.status === "cancelled") return;
    const outcome = c.patient?.shock();
    c.updateOrder(order, { status: "done", doneAt: c.t });
    if (outcome === "not-charged") {
      c.say("sedation", "It's not charged.", "report", { to: "operator", orderId: order.id, urgent: true });
      return;
    }
    c.telemetry("team.shock", { outcome: outcome ?? "none" });
    c.say("sedation", "Shock delivered.", "report", { to: "operator", orderId: order.id, urgent: true });
  });
}

export function sedationTelemetry(core: TeamCore, ev: TelemetryEvent) {
  if (ev.kind === "defib.shock") core.setMem("sedation.charging", -1);
}

/** Per tick: charge completion, sats and conscious level. */
export function sedationTick(core: TeamCore) {
  const p = core.patient;
  if (!p) return;
  const v = p.vitals();
  const charging = core.mem("sedation.charging", -1);
  if (charging !== -1 && v.defib.charged > 0 && !v.defib.charging) {
    core.setMem("sedation.charging", -1);
    const order = core.order(Number(charging));
    if (order && order.status !== "cancelled") core.updateOrder(order, { status: "done", doneAt: core.t });
    core.say("sedation", "Charged.", "report", { to: "operator", orderId: order?.id, urgent: true });
  }
  if (core.opts.callouts === false) return;
  // sats: once per episode below the callout threshold
  const low = v.spo2 !== null && v.spo2 < core.P.spo2CalloutBelow;
  if (low && !core.mem("sedation.satsLow", false)) {
    core.setMem("sedation.satsLow", true);
    core.say("sedation", `Sats are dropping, ${v.spo2} percent.`, "callout", { to: "operator" });
  } else if (!low && v.spo2 !== null && v.spo2 >= core.P.spo2CalloutBelow + 2) core.setMem("sedation.satsLow", false);
  // conscious level (not during an arrest: the monitor callouts cover it)
  const arrested = v.hr === null;
  const c = v.symptoms.conscious;
  const pr = core.pronoun();
  const state = arrested ? "arrest" : c <= 0.05 ? "unresponsive" : c < core.P.drowsyCallout ? "drowsy" : "ok";
  const was = core.mem("sedation.conscious", "ok");
  if (state !== was) {
    core.setMem("sedation.conscious", state);
    if (state === "unresponsive") core.say("sedation", `${cap(pr.he)}'s not responding.`, "callout", { to: "operator", urgent: true });
    else if (state === "drowsy" && was === "ok") core.say("sedation", `${cap(pr.he)}'s very drowsy, only rousable to voice.`, "callout", { to: "operator" });
  }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
