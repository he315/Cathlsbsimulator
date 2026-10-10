// repair-session-flow (4): a module can pause or slow the femoral compression and band time-lapse
// when an emergency begins. holdLapse(by, rate) sets the running long time-lapse aside: the session
// is free (orders work), the lapse runs on in the background at `rate` times the wall clock (0:
// paused), and releaseLapse(by) puts it back. The live lab turns holds on (lapseHoldsOn); a session
// built for a test or the autopilot keeps the lapse running through, as before. The emergencies
// module pauses the lapse while a faint, a reaction or a fast-rate hypotension is under way.
//   npx vitest run src/simulation/session/lapseHold.test.ts
import { describe, expect, it } from "vitest";
import { newCaseSession } from "./caseSession";
import { fastForward } from "./autopilot";
import { emergenciesOf, MP_EMERGENCY_LAPSE } from "./modules/emergencies";

/** A femoral case at closure with no modules (the lapse alone). */
function atClosure(seed: string) {
  const { session: s } = newCaseSession({ seed, access: "femoral", modules: [] });
  fastForward(s, "closure");
  return s;
}

describe("holding a time-lapse", () => {
  it("holds are off by default (tests and the autopilot): holdLapse refuses and the lapse runs through", () => {
    const s = atClosure("lapse-off");
    s.femoralManual(15, 3);
    expect(s.lapseHoldsOn).toBe(false);
    expect(s.holdLapse("test")).toBe(false);
    expect(s.busy).toBe(true);
    s.runPending();
    expect(s.closureDone()).toBe(true);
  });

  it("paused: the session is free and orders work; wall time passes without the lapse; released, the compression ends as before", () => {
    const s = atClosure("lapse-pause");
    s.lapseHoldsOn = true;
    s.femoralManual(15, 3);
    s.tick(0); // 20 s of the lapse
    const left = s.pending;
    expect(left).toBeGreaterThan(800);
    expect(s.holdLapse("test")).toBe(true);
    expect(s.busy).toBe(false);
    expect(s.lapseHeld).toMatchObject({ by: ["test"], rate: 0 });
    expect(s.lapseHeld!.leftS).toBeCloseTo(left, 5);
    expect(s.lapseHeld!.label).toMatch(/Manual compression/);
    // an order while the compression is paused (session.order() refuses during a running lapse)
    const rec = s.order("atropine", 0.5);
    expect(rec).not.toBeNull();
    s.runPending(); // the order's own time
    const t0 = s.tS;
    for (let k = 0; k < 120; k++) s.tick(0.5);
    expect(s.tS - t0).toBeCloseTo(60, 5);
    expect(s.lapseHeld!.leftS).toBeCloseTo(left, 5);
    // the compression's end (the closure) has not come
    expect(s.hookAt.closure).toBeUndefined();
    // the skip button does not skip a held lapse
    s.runPending();
    expect(s.lapseHeld).not.toBeNull();
    expect(s.log.some((l) => /Manual compression.*time-lapse paused\./.test(l.text))).toBe(true);
    expect(s.log.some((l) => /time-lapse resumed\./.test(l.text))).toBe(false);
    expect(s.releaseLapse("test")).toBe(true);
    expect(s.lapseHeld).toBeNull();
    expect(s.busy).toBe(true);
    // the log says why the clock runs fast again
    expect(s.log.some((l) => /Manual compression.*time-lapse resumed\./.test(l.text))).toBe(true);
    s.runPending();
    expect(s.hookAt.closure).toBeDefined();
    expect(s.closureDone()).toBe(true);
  });

  it("a held compression is still open: the case does not finish and no second long lapse is stacked; released, the closure runs", () => {
    const s = atClosure("lapse-held-open");
    s.lapseHoldsOn = true;
    s.femoralManual(15, 3);
    s.tick(0);
    expect(s.holdLapse("test")).toBe(true);
    const held = s.lapseHeld!;
    expect(s.finish()).toBeNull();
    expect(s.finished).toBe(false);
    expect(s.attending.some((a) => /Manual compression \(15 min\) is still under way/.test(a.text))).toBe(true);
    s.observe(30);
    expect(s.pending).toBe(0);
    s.holdCompression(5);
    expect(s.pending).toBe(0);
    expect(s.lapseHeld).toMatchObject({ label: held.label, by: held.by });
    expect(s.lapseHeld!.leftS).toBeCloseTo(held.leftS, 6);
    expect(s.hookAt.closure).toBeUndefined();
    expect(s.releaseLapse("test")).toBe(true);
    s.runPending();
    expect(s.hookAt.closure).toBeDefined();
    expect(s.finish()).not.toBeNull();
  });

  it("a hold that begins inside a tick's slice takes the unspent part of the slice", () => {
    const s = atClosure("lapse-mid-slice");
    s.lapseHoldsOn = true;
    s.femoralManual(15, 3);
    const total = s.pending;
    const t0 = s.tS;
    // a holder that holds as soon as the lapse has run 5 s (in the patient's first step of the slice)
    let holdAtT: number | null = null;
    const orig = (s as unknown as { slowTick: (h: number) => void }).slowTick.bind(s);
    (s as unknown as { slowTick: (h: number) => void }).slowTick = (h: number) => {
      orig(h);
      if (holdAtT === null && s.tS - t0 >= 5 - 1e-9 && s.holdLapse("test")) holdAtT = s.tS;
    };
    s.tick(0);
    expect(holdAtT).not.toBeNull();
    expect(s.tS - t0).toBeCloseTo(5, 6);
    expect(s.lapseHeld!.leftS).toBeCloseTo(total - 5, 6);
  });

  it("slowed: the held lapse runs in the background at rate times the wall clock and ends the compression itself", () => {
    const s = atClosure("lapse-slow");
    s.lapseHoldsOn = true;
    s.femoralManual(15, 3);
    expect(s.holdLapse("test", 4)).toBe(true);
    const left = s.lapseHeld!.leftS;
    const t0 = s.tS;
    for (let k = 0; k < 10; k++) s.tick(1);
    // 10 s of wall time and 40 s of the lapse
    expect(s.tS - t0).toBeCloseTo(50, 5);
    expect(s.lapseHeld!.leftS).toBeCloseTo(left - 40, 5);
    expect(s.hookAt.closure).toBeUndefined();
    for (let k = 0; k < 400 && s.lapseHeld; k++) s.tick(1);
    expect(s.lapseHeld).toBeNull();
    s.tick(0);
    expect(s.hookAt.closure).toBeDefined();
  });

  it("only a compression, band or recovery lapse is held, and the lapse waits for every holder", () => {
    const s = atClosure("lapse-only-long");
    s.lapseHoldsOn = true;
    s.wait(30, "A short step");
    expect(s.holdLapse("test")).toBe(false);
    s.runPending();
    s.femoralManual(15, 3);
    expect(s.holdLapse("a")).toBe(true);
    expect(s.holdLapse("b", 2)).toBe(true);
    // the slowest holder sets the rate
    expect(s.lapseHeld!.rate).toBe(0);
    s.releaseLapse("a");
    expect(s.lapseHeld).toMatchObject({ by: ["b"], rate: 2 });
    s.releaseLapse("b");
    expect(s.lapseHeld).toBeNull();
    s.runPending();
    expect(s.closureDone()).toBe(true);
    // the recovery observation is held too
    s.observe(30);
    expect(s.holdLapse("c")).toBe(true);
    s.releaseLapse("c");
  });

  it("vagal-mimic in the live lab: the faint at sheath removal pauses the compression, the learner treats it at the wall clock, and the compression then runs on", () => {
    const { session: s, engine: e } = newCaseSession({ scenario: "vagal-mimic" });
    s.lapseHoldsOn = true;
    const m = emergenciesOf(s)!;
    s.femoralManual(15, 3);
    // the lab's frames
    let frames = 0;
    while (!s.lapseHeld && s.busy && frames < 600) {
      s.tick(1 / 60);
      frames++;
    }
    expect(s.lapseHeld).not.toBeNull();
    expect(s.lapseHeld!.by).toEqual(["emergencies"]);
    // the faint did not play out inside the lapse: the hold began in the patient's step that saw its onset
    expect(frames).toBeLessThan(10);
    expect(s.busy).toBe(false);
    const ep = m.state.vagal[0];
    expect(ep.trigger).toBe("scenario");
    expect(s.tS - ep.t).toBeLessThanOrEqual(5 + 1e-6);
    // the learner's windows run from the hold
    expect(Math.abs(ep.liveT! - s.tS)).toBeLessThanOrEqual(0.1); // now(): the session clock to 0.1 s
    expect(ep.unscored).toBe(false);
    // the session's own orders work, and the module's
    expect(s.order("atropine", 1)).not.toBeNull();
    expect(m.actions.order("lie-flat-legs-up").ok).toBe(true);
    expect(m.actions.order("fluid-500").ok).toBe(true);
    // the wall clock: a few minutes at most until the patient has recovered and the hold is released
    let k = 0;
    for (; k < 60 * 10 * 4 && s.lapseHeld; k++) s.tick(0.25);
    expect(s.lapseHeld).toBeNull();
    expect(e.vitals().hr!).toBeGreaterThan(55);
    expect(s.decisions().find((d) => d.id === "vagal-first-treatment")?.correct).toBe(true);
    // the compression goes on and ends
    s.runPending();
    expect(s.closureDone()).toBe(true);
    expect(MP_EMERGENCY_LAPSE.resumeAfterRecoveredS).toBeGreaterThan(0);
  });
});
