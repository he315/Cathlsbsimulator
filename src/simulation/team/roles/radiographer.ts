// ---------------------------------------------------------------------------
// Radiographer: C-arm, table, acquisition protocol, the screening timer and
// dose announcements.
//
// Perception scope: the C-arm angles (CArmPort), the imaging settings
// (ImagingView) and the S6 dose telemetry (dose.fluoro-5min, dose.trigger).
//
// The C-arm moves physically: with a CArmPort that has driveTo (the lab's
// CArmDrive), the radiographer holds the memory drive until the arm arrives;
// otherwise, with the S8 input system, she requests a velocity on the input
// bus (source "team:radiographer") and stops it on arrival, closing the loop
// on the port's angles. Without either, the target goes to the lab as an
// action. Views therefore take real travel time in every case.
// ---------------------------------------------------------------------------

import type { TelemetryEvent } from "../../session/types";
import type { CArm } from "../../../types";
import type { TeamCore } from "../agent";
import { spokenView } from "../intents";
import type { Order, TeamIntent } from "../types";

const SRC = "team:radiographer";

function clampView(a: CArm): CArm {
  return { laoRao: Math.max(-90, Math.min(90, a.laoRao)), cranialCaudal: Math.max(-45, Math.min(45, a.cranialCaudal)) };
}

export function carmTarget(core: TeamCore, i: Extract<TeamIntent, { k: "carm" }>): CArm {
  const cur = core.opts.carm?.angles ?? { laoRao: 0, cranialCaudal: 0 };
  if (i.relative) return clampView({ laoRao: cur.laoRao + (i.laoRao ?? 0), cranialCaudal: cur.cranialCaudal + (i.cranialCaudal ?? 0) });
  return clampView({ laoRao: i.laoRao ?? cur.laoRao, cranialCaudal: i.cranialCaudal ?? cur.cranialCaudal });
}

const LEVEL_SPOKEN = { low: "Low dose fluoro.", normal: "Normal fluoro.", high: "High-level fluoro." } as const;

export function receiveRadiographerOrder(core: TeamCore, order: Order) {
  const i = order.heard;
  switch (i.k) {
    case "carm": {
      const target = carmTarget(core, i);
      core.updateOrder(order, { status: "readback" });
      const end = core.say("radiographer", `${spokenView(target.laoRao, target.cranialCaudal)}.`, "readback", { to: "operator", orderId: order.id });
      core.schedule(end - 0.3, "carm-start", "radiographer", { orderId: order.id, lao: target.laoRao, cran: target.cranialCaudal });
      return;
    }
    case "protocol": {
      const parts: string[] = [];
      if (i.fluoroPps !== undefined) parts.push(`Fluoro ${i.fluoroPps} frames.`);
      if (i.cinePps !== undefined) parts.push(`Cine ${i.cinePps} frames.`);
      if (i.fluoroLevel) parts.push(LEVEL_SPOKEN[i.fluoroLevel]);
      if (i.fieldCm !== undefined) parts.push(`Field ${i.fieldCm}.`);
      if (i.storeFluoro) parts.push("Storing the last fluoro.");
      core.updateOrder(order, { status: "readback" });
      const end = core.say("radiographer", parts.join(" "), "readback", { to: "operator", orderId: order.id });
      core.schedule(end, "protocol", "radiographer", { orderId: order.id, p: { fluoroPps: i.fluoroPps, cinePps: i.cinePps, fieldCm: i.fieldCm, fluoroLevel: i.fluoroLevel, storeFluoro: i.storeFluoro } });
      return;
    }
    case "table": {
      const words = { up: "Table up.", down: "Table down.", head: "Towards the head.", feet: "Towards the feet.", left: "Table left.", right: "Table right.", stop: "Stopping." } as const;
      core.updateOrder(order, { status: "readback" });
      const end = core.say("radiographer", words[i.action], "readback", { to: "operator", orderId: order.id });
      core.schedule(end, "table", "radiographer", { orderId: order.id, action: i.action });
      return;
    }
    case "timerReset": {
      core.updateOrder(order, { status: "done", doneAt: core.t });
      const end = core.say("radiographer", "Timer reset.", "readback", { to: "operator", orderId: order.id });
      core.schedule(end - 0.5, "timer-reset", "radiographer", {});
      return;
    }
    case "query": {
      core.updateOrder(order, { status: "done", doneAt: core.t });
      const v = core.opts.imaging?.();
      const min = v?.fluoroMin;
      core.say("radiographer", min === undefined ? "I don't have the screening time." : `${min.toFixed(1)} minutes screening.`, "report", { to: "operator", orderId: order.id });
      return;
    }
    default:
      core.updateOrder(order, { status: "refused" });
      core.say("radiographer", "Sorry, which view?", "query", { to: "operator", orderId: order.id });
  }
}

export function installRadiographer(core: TeamCore) {
  core.handle("carm-start", (c, tm) => {
    const order = c.order(Number(tm.data.orderId));
    if (!order || order.status === "cancelled") return;
    const target = { laoRao: Number(tm.data.lao), cranialCaudal: Number(tm.data.cran) };
    // a newer C-arm order replaces this one
    c.setMem("radiographer.carmOrder", order.id);
    c.updateOrder(order, { status: "in-progress" });
    c.act({ a: "carm-target", target });
    const port = c.opts.carm;
    if (port?.driveTo) port.driveTo(target);
    else if (!port) {
      c.updateOrder(order, { status: "done", doneAt: c.t });
      return;
    }
    c.schedule(c.t, "carm-check", "radiographer", { orderId: order.id, lao: target.laoRao, cran: target.cranialCaudal, since: c.t });
  });
  core.handle("carm-check", (c, tm) => {
    const order = c.order(Number(tm.data.orderId));
    const port = c.opts.carm;
    if (!order || !port) return;
    const target = { laoRao: Number(tm.data.lao), cranialCaudal: Number(tm.data.cran) };
    if (order.status === "cancelled" || c.mem("radiographer.carmOrder", -1) !== order.id) {
      if (order.status === "cancelled") stopCarm(c);
      return;
    }
    const a = port.angles;
    const dl = target.laoRao - a.laoRao;
    const dc = target.cranialCaudal - a.cranialCaudal;
    // a memory drive lands exactly on the target (CArmDrive snaps within its arrival band), so hold it
    // until then; the open-loop bus path stops within the radiographer's own band
    const band = port.driveTo ? 1e-3 : c.P.carmArriveDeg;
    if (Math.abs(dl) <= band && Math.abs(dc) <= band) {
      stopCarm(c);
      c.updateOrder(order, { status: "done", doneAt: c.t });
      c.telemetry("team.carm-arrived", { orderId: order.id, laoRao: a.laoRao, cranialCaudal: a.cranialCaudal, travelS: c.t - Number(tm.data.since) });
      return;
    }
    if (!port.driveTo && c.opts.input) {
      // velocity on the input bus, slowing near the target (proportional, capped)
      const v = c.P.carmBusSpeed;
      const sp = (d: number) => Math.max(-v, Math.min(v, d * 2));
      c.opts.input.emit({ t: "carm", laoDegPerS: sp(dl), cranDegPerS: sp(dc), source: SRC });
    }
    if (c.t - Number(tm.data.since) > 60) {
      stopCarm(c);
      c.updateOrder(order, { status: "done", doneAt: c.t });
      c.say("radiographer", "It won't go any further.", "report", { to: "operator", orderId: order.id });
      return;
    }
    c.schedule(c.t + 0.05, "carm-check", "radiographer", tm.data);
  });
  core.handle("protocol", (c, tm) => {
    const order = c.order(Number(tm.data.orderId));
    if (!order || order.status === "cancelled") return;
    c.updateOrder(order, { status: "done", doneAt: c.t });
    c.act({ a: "protocol", ...(tm.data.p as object) });
    c.telemetry("team.protocol", tm.data.p as Record<string, unknown>);
  });
  core.handle("table", (c, tm) => {
    const order = c.order(Number(tm.data.orderId));
    if (!order || order.status === "cancelled") return;
    const action = tm.data.action as Extract<TeamIntent, { k: "table" }>["action"];
    const tp = c.opts.table;
    // the radiographer holds the control for a moment (model parameter, s)
    const holdS = 1.5;
    if (tp) {
      if (action === "up" || action === "down") tp.setHeightCommand?.(action === "up" ? 1 : -1);
      else if (action !== "stop") {
        const v = 40; // mm/s request (model)
        const xy = action === "left" ? [v, 0] : action === "right" ? [-v, 0] : action === "head" ? [0, v] : [0, -v];
        tp.setCommandedVelocity?.(xy[0], xy[1]);
      }
      c.schedule(action === "stop" ? c.t : c.t + holdS, "table-stop", "radiographer", {});
    }
    c.act({ a: "table", action });
    c.updateOrder(order, { status: "done", doneAt: c.t });
  });
  core.handle("table-stop", (c) => {
    c.opts.table?.setHeightCommand?.(0);
    c.opts.table?.setCommandedVelocity?.(0, 0);
  });
  core.handle("timer-reset", (c) => {
    c.act({ a: "timer-reset" });
    c.telemetry("team.timer-reset", {});
  });
}

function stopCarm(c: TeamCore) {
  if (c.opts.carm?.driveTo) c.opts.carm.driveTo(null);
  else c.opts.input?.emit({ t: "carm", laoDegPerS: 0, cranDegPerS: 0, source: SRC });
}

export function radiographerTelemetry(core: TeamCore, ev: TelemetryEvent) {
  const d = ev.data ?? {};
  if (ev.kind === "dose.fluoro-5min") {
    const min = Math.round(Number(d.fluoroMin ?? 5));
    if (core.opts.callouts !== false) core.say("radiographer", `${min} minutes screening.`, "callout", { to: "operator" });
    if (core.opts.autoTimerReset !== false) core.schedule(core.t + 2.5, "timer-reset", "radiographer", {});
    return;
  }
  if (ev.kind === "dose.trigger" && core.opts.callouts !== false) {
    const v = Number(d.threshold);
    const text =
      d.metric === "kar"
        ? `Reference air kerma is past ${v / 1000} gray.`
        : d.metric === "kap"
          ? `Dose area product is past ${v} gray centimetres squared.`
          : d.metric === "peakSkin"
            ? `Estimated peak skin dose is past ${v / 1000} gray.`
            : `Screening time is past ${v} minutes.`;
    core.say("radiographer", text, "callout", { to: "operator" });
  }
}
