// The shared lab event log (found-lab-session-plumbing): hold windows in lab time, case properties
// held for the run, onsets in the history and in telemetry.
//   npx vitest run src/ui/lab/eventLog.test.ts
import { describe, expect, it } from "vitest";
import { EVENT_HOLD_S, EventLog, LAB_EVENT_TELEMETRY, TRANSIENT_HOLD_S } from "./eventLog";

describe("EventLog hold windows", () => {
  it("an event raised with holdS 60 is active at 59 s and gone at 61 s of lab time", () => {
    const log = new EventLog();
    log.raise("pressure-damped", 60, 0);
    expect(log.active(59)).toEqual(["pressure-damped"]);
    expect(log.isActive("pressure-damped", 59)).toBe(true);
    expect(log.active(61)).toEqual([]);
    expect(log.isActive("pressure-damped", 61)).toBe(false);
  });

  it("the default hold is 30 s", () => {
    expect(TRANSIENT_HOLD_S).toBe(30);
    const log = new EventLog();
    expect(log.holdFor("guide-backout")).toBe(30);
    log.raise("guide-backout", undefined, 100);
    expect(log.active(129.9)).toEqual(["guide-backout"]);
    expect(log.active(130)).toEqual(["guide-backout"]);
    expect(log.active(130.1)).toEqual([]);
  });

  it("per-event holds override the default, and a log can set its own", () => {
    expect(new EventLog().holdFor("vf")).toBe(EVENT_HOLD_S.vf);
    const log = new EventLog({ holdS: 10, holds: { thrombus: 45 } });
    expect(log.holdFor("dissection")).toBe(10);
    expect(log.holdFor("thrombus")).toBe(45);
  });

  it("raising an active event again extends it without a new onset", () => {
    const log = new EventLog();
    expect(log.raise("hypotension", 30, 0)).toBe(true);
    expect(log.raise("hypotension", 30, 20)).toBe(false);
    expect(log.active(45)).toEqual(["hypotension"]);
    expect(log.active(51)).toEqual([]);
    expect(log.history()).toHaveLength(1);
    // after it lapsed, a raise is a new onset
    expect(log.raise("hypotension", 30, 60)).toBe(true);
    expect(log.history().map((o) => o.t)).toEqual([0, 60]);
  });

  it("a later raise never shortens an active hold", () => {
    const log = new EventLog();
    log.raise("dissection", 60, 0);
    log.raise("dissection", 5, 10);
    expect(log.active(59)).toEqual(["dissection"]);
  });

  it("case properties are held for the whole run until cleared", () => {
    const log = new EventLog();
    log.hold(["cto", "prior-cabg"], 0);
    log.raise("cto", 5, 1); // a transient raise does not end the hold
    expect(log.active(10_000)).toEqual(["cto", "prior-cabg"]);
    log.clear("cto");
    expect(log.active(10_001)).toEqual(["prior-cabg"]);
  });

  it("lists active events in onset order and uses its clock when no time is given", () => {
    let t = 0;
    const log = new EventLog({ clock: () => t });
    log.raise("wire-not-crossing");
    t = 5;
    log.raise("guide-backout");
    t = 10;
    expect(log.active()).toEqual(["wire-not-crossing", "guide-backout"]);
    t = 31;
    expect(log.active()).toEqual(["guide-backout"]);
  });

  it("without a clock it keeps the latest lab time it was given", () => {
    const log = new EventLog();
    log.active(50);
    log.raise("slow-flow");
    expect(log.history()[0].t).toBe(50);
    expect(log.active(79)).toEqual(["slow-flow"]);
  });

  it("writes every onset to telemetry as lab.event, and only onsets", () => {
    const rec: { kind: string; data: Record<string, unknown>; t: number }[] = [];
    const log = new EventLog({ sink: (kind, data, t) => rec.push({ kind, data, t }) });
    log.raise("no-reflow", 30, 12, "pciEvents/flow");
    log.raise("no-reflow", 30, 13);
    log.hold(["stemi"], 0);
    expect(rec).toEqual([
      { kind: LAB_EVENT_TELEMETRY, data: { event: "no-reflow", holdS: 30, source: "pciEvents/flow" }, t: 12 },
      { kind: LAB_EVENT_TELEMETRY, data: { event: "stemi", holdS: null }, t: 0 },
    ]);
  });

  it("notifies subscribers and resets for a new run", () => {
    const log = new EventLog();
    let n = 0;
    const off = log.subscribe(() => n++);
    log.raise("air", 30, 0);
    expect(n).toBeGreaterThan(0);
    const v = log.version;
    // reading is safe in a render: no change, no notification
    log.active(1);
    log.activeEntries(1);
    expect(log.version).toBe(v);
    off();
    log.reset();
    expect(log.active(1)).toEqual([]);
    expect(log.history()).toEqual([]);
  });
});
