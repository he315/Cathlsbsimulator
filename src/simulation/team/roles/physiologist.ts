// ---------------------------------------------------------------------------
// Cardiac physiologist: transducer, recording, ECG, non-invasive pressure,
// alarms and monitor callouts.
//
// Perception scope: the haemodynamic monitor (S9 vitals: displayed arterial
// pressure, heart rate, tip pressure class, alarms) and the S9 alarm and NIBP
// telemetry. The physiologist reads what the monitor shows, not the true
// aortic pressure.
// ---------------------------------------------------------------------------

import type { TelemetryEvent } from "../../session/types";
import type { TeamCore } from "../agent";
import type { Order } from "../types";

export function receivePhysiologistOrder(core: TeamCore, order: Order) {
  const i = order.heard;
  const p = core.patient;
  switch (i.k) {
    case "zero": {
      core.updateOrder(order, { status: "readback" });
      if (core.opts.zeroNeedsTap && p && !p.transducer.st.openToAir) {
        const end = core.say("physiologist", "Open to air, please.", "readback", { to: "operator", orderId: order.id });
        core.schedule(end, "zero-wait", "physiologist", { orderId: order.id, since: end });
        return;
      }
      const end = core.say("physiologist", "Zeroing.", "readback", { to: "operator", orderId: order.id });
      core.schedule(end + 2, "zero", "physiologist", { orderId: order.id, self: true });
      return;
    }
    case "record": {
      core.updateOrder(order, { status: "done", doneAt: core.t });
      core.say("physiologist", i.on ? "Recording." : "Recording stopped.", "readback", { to: "operator", orderId: order.id });
      core.act({ a: "recording", on: i.on });
      core.telemetry("team.recording", { on: i.on });
      return;
    }
    case "twelveLead": {
      core.updateOrder(order, { status: "readback" });
      const end = core.say("physiologist", "12-lead.", "readback", { to: "operator", orderId: order.id });
      core.schedule(end + 10, "twelve-lead", "physiologist", { orderId: order.id });
      return;
    }
    case "nibp": {
      core.updateOrder(order, { status: "readback" });
      if (i.intervalMin) {
        p?.setNibpInterval(i.intervalMin);
        core.say("physiologist", `Cuff every ${i.intervalMin} minutes.`, "readback", { to: "operator", orderId: order.id });
      } else core.say("physiologist", "Cycling the cuff.", "readback", { to: "operator", orderId: order.id });
      p?.startNibp();
      core.setMem("physiologist.nibpOrder", order.id);
      return;
    }
    case "silence": {
      p?.silenceAlarms(core.P.silenceS);
      core.updateOrder(order, { status: "done", doneAt: core.t });
      core.say("physiologist", `Alarms silenced for ${Math.round(core.P.silenceS / 60)} minutes.`, "readback", { to: "operator", orderId: order.id });
      return;
    }
    case "query": {
      core.updateOrder(order, { status: "done", doneAt: core.t });
      const v = p?.vitals();
      let text = "I haven't got a trace.";
      if (v && i.what === "pressure") text = v.art ? `${Math.round(v.art.sys)} over ${Math.round(v.art.dia)}, mean ${Math.round(v.art.mean)}.` : v.nibp ? `No arterial trace. Last cuff ${v.nibp.sys} over ${v.nibp.dia}.` : "No arterial trace at the moment.";
      if (v && i.what === "heartRate") text = v.hr === null ? "I can't count a rate." : `Heart rate ${v.hr}, ${v.rhythm}.`;
      core.say("physiologist", text, "report", { to: "operator", orderId: order.id });
      return;
    }
    default:
      core.updateOrder(order, { status: "refused" });
      core.say("physiologist", "Sorry, say again?", "query", { to: "operator", orderId: order.id });
  }
}

export function installPhysiologist(core: TeamCore) {
  core.handle("zero-wait", (c, tm) => {
    const order = c.order(Number(tm.data.orderId));
    const p = c.patient;
    if (!order || order.status === "cancelled" || !p) return;
    if (p.transducer.st.openToAir) {
      c.schedule(c.t + 1.5, "zero", "physiologist", { orderId: order.id });
      return;
    }
    if (c.t - Number(tm.data.since) > 20) {
      c.say("physiologist", "I still need it open to air to zero.", "query", { to: "operator", orderId: order.id });
      c.schedule(c.t + 1, "zero-wait", "physiologist", { orderId: order.id, since: c.t });
      return;
    }
    c.schedule(c.t + 0.25, "zero-wait", "physiologist", tm.data);
  });
  core.handle("zero", (c, tm) => {
    const order = c.order(Number(tm.data.orderId));
    const p = c.patient;
    if (!order || order.status === "cancelled") return;
    if (p) {
      if (tm.data.self) p.transducer.setOpenToAir(true);
      p.transducer.zero();
      if (tm.data.self) p.transducer.setOpenToAir(false);
    }
    c.updateOrder(order, { status: "done", doneAt: c.t });
    c.telemetry("team.zeroed", {});
    c.say("physiologist", tm.data.self ? "Zeroed." : "Zeroed. Back to the patient.", "report", { to: "operator", orderId: order.id });
  });
  core.handle("twelve-lead", (c, tm) => {
    const order = c.order(Number(tm.data.orderId));
    if (!order || order.status === "cancelled") return;
    c.updateOrder(order, { status: "done", doneAt: c.t });
    c.act({ a: "twelve-lead" });
    c.telemetry("team.twelve-lead", {});
    c.say("physiologist", "12-lead's done.", "report", { to: "operator", orderId: order.id });
  });
}

const ALARM_CALLOUT: Record<string, (text: string) => string> = {
  vf: () => "VF!",
  vt: () => "VT!",
  asys: () => "Asystole!",
  "hr-low": (t) => t.replace(/^Heart rate low (\d+)/, "Heart rate's down to $1."),
  "hr-high": (t) => t.replace(/^Heart rate high (\d+)/, "Rate's up to $1."),
  "art-low": (t) => t.replace(/^Arterial pressure low (\d+)\/(\d+)/, "Pressure's dropping, $1 over $2."),
  "art-high": (t) => t.replace(/^Arterial pressure high (\d+)/, "Pressure's high, $1 systolic."),
  st: (t) => {
    const m = t.match(/^ST (\S+) ([+-]?)([\d.]+) mm/);
    return m ? `ST ${m[2] === "-" ? "depression" : "elevation"} in ${m[1]}, ${m[3]} millimetres.` : "ST changes.";
  },
};

export function physiologistTelemetry(core: TeamCore, ev: TelemetryEvent) {
  const d = ev.data ?? {};
  if (ev.kind === "nibp.result") {
    const mine = core.mem("physiologist.nibpOrder", -1);
    if (mine !== -1) {
      const order = core.order(Number(mine));
      if (order && order.status !== "done") core.updateOrder(order, { status: "done", doneAt: core.t });
      core.setMem("physiologist.nibpOrder", -1);
      core.say("physiologist", `Cuff pressure ${d.sys} over ${d.dia}.`, "report", { to: "operator" });
    }
    return;
  }
  if (ev.kind === "nibp.failed" && core.mem("physiologist.nibpOrder", -1) !== -1) {
    core.say("physiologist", "The cuff couldn't get a reading.", "report", { to: "operator" });
    core.setMem("physiologist.nibpOrder", -1);
    return;
  }
  if (core.opts.callouts === false) return;
  if (ev.kind === "alarm.on") {
    const id = String(d.id);
    if (id === "pleth" || id === "spo2") return; // the sedation nurse watches the sats
    if (id === "zero") {
      if (core.st.orders.some((o) => o.intent.k === "zero" && o.status !== "done" && o.status !== "cancelled")) return;
      core.say("physiologist", "I'll need to zero before we can trust that pressure.", "callout", { to: "operator" });
      return;
    }
    const f = ALARM_CALLOUT[id];
    const level = String(d.level);
    if (!f) return;
    core.say("physiologist", f(String(d.text ?? "")), "callout", { to: "operator", urgent: level === "high" });
  }
}

const TIP_RANK: Record<string, number> = { damped: 1, ventricularised: 2, wedged: 3 };

/**
 * Per tick: a damped, ventricularised or wedged trace while the catheter is in a coronary. One callout
 * per episode once it has persisted; a second only if it gets worse. The episode ends after the trace
 * has been normal for a second (the classification can flicker beat to beat).
 */
export function physiologistTick(core: TeamCore) {
  if (core.opts.callouts === false || !core.patient) return;
  const v = core.patient.vitals();
  const rank = TIP_RANK[v.tipState] ?? 0;
  const since = core.mem("physiologist.tipBadSince", -1);
  const called = core.mem("physiologist.tipCalledRank", 0);
  if (rank === 0) {
    if (since >= 0) {
      const okSince = core.mem("physiologist.tipOkSince", -1);
      if (okSince < 0) core.setMem("physiologist.tipOkSince", core.t);
      else if (core.t - okSince >= 1) {
        core.setMem("physiologist.tipBadSince", -1);
        core.setMem("physiologist.tipCalledRank", 0);
        core.setMem("physiologist.tipOkSince", -1);
      }
    }
    return;
  }
  core.setMem("physiologist.tipOkSince", -1);
  if (since < 0) {
    core.setMem("physiologist.tipBadSince", core.t);
    return;
  }
  if (rank > called && core.t - since >= core.P.dampedCalloutS) {
    core.setMem("physiologist.tipCalledRank", rank);
    const text = rank === 1 ? "Pressure's damped." : rank === 2 ? "That's ventricularised." : "Pressure's wedged.";
    core.say("physiologist", text, "callout", { to: "operator", urgent: true });
    core.telemetry("team.callout", { what: v.tipState });
  }
}
