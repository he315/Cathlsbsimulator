// access-radial-sequence: up the forearm in the full case: resistance imaged through a catheter just below the
// wire tip, the tight loop crossed by balloon-assisted tracking, a forced hydrophilic wire's perforation and its
// seal over the wire, and the heparin held to the root only in the extremely tortuous arm.
//   npx vitest run src/simulation/session/radialForearm.test.ts
import { describe, expect, it } from "vitest";
import { newCaseSession, MP_RADIAL_SEQUENCE, type CaseSession } from "./caseSession";
import { aimedPose, advanceToFlash, navigate } from "./autopilot";
import { segmentAt } from "../procedure";

const decision = (s: CaseSession, id: string) => s.decisions().find((d) => d.id === id);

/** The catheter in over the wire (prepared on the table), the beam on with the tip in view. */
function catheterIn(s: CaseSession, hydrophilic = false): void {
  if (hydrophilic) s.setWireKind("hydrophilic");
  s.prepCatheter("TIG");
  s.runPending();
  expect(s.loadCatheter("TIG")).toBe(true);
  s.beamOn = true;
  s.tipImaged = true;
}

/** Push the wire (and follow with the catheter) for `n` frames, or until `stop`. */
function push(s: CaseSession, n: number, stop: () => boolean = () => false): number {
  let i = 0;
  for (; i < n && !stop(); i++) {
    s.commandWire(1.2, 0);
    s.commandCatheter(1.2);
    s.tick(0.033);
  }
  return i;
}

/** Balloon-assisted tracking at `atm` until it ends past the loop. */
function bat(s: CaseSession, atm = 4): void {
  expect(s.startBat(atm)).toBe(true);
  s.runPending();
  for (let i = 0; i < 400 && s.radialSeq.bat; i++) {
    s.advanceBat(1.2);
    s.tick(0.033);
  }
}

describe("radial-loop: the wire stops in the forearm", () => {
  it("the J wire stops at the tight loop; the forearm angiogram through a catheter just below the tip shows the loop (radial-loop) and is scored as the right answer to the resistance", () => {
    const { session: s } = newCaseSession({ scenario: "radial-loop" });
    expect(s.sheath).not.toBeNull();
    expect(s.radialSeq.secured).not.toBeNull();
    catheterIn(s);
    const loop = s.route.segments.find((x) => x.id === "loop")!;
    // up the radial artery, stopping at the first push that does not go (pushing on is the error)
    let last = s.wire.pos;
    push(s, 400, () => {
      const stuck = s.wire.pos >= loop.start - 5 && s.wire.pos - last < 0.3;
      last = s.wire.pos;
      return stuck;
    });
    expect(s.wire.pos).toBeLessThan(loop.end);
    expect(s.radialSeq.armResistanceAt).not.toBeNull();
    const rec = s.forearmAngiogram();
    s.runPending();
    expect(rec).toMatchObject({ via: "catheter", belowTip: true, shows: { loop: true, extravasation: false } });
    expect(s.activeEvents()).toContain("radial-loop");
    expect(decision(s, "forearm-resistance-imaged")?.correct).toBe(true);
  });

  it("in 'radial-loop' balloon-assisted tracking passes without perforation, and the case goes on to the root", () => {
    const { session: s } = newCaseSession({ scenario: "radial-loop" });
    catheterIn(s);
    const loop = s.route.segments.find((x) => x.id === "loop")!;
    push(s, 300, () => s.wire.pos >= loop.start);
    s.forearmAngiogram();
    s.runPending();
    bat(s, 4);
    expect(s.wire.pos).toBeGreaterThan(loop.end);
    expect(s.catheter!.pos).toBeGreaterThan(loop.end);
    expect(s.wire.perforation).toBe(false);
    expect(s.radialSeq.loopCrossed).toBe("bat");
    expect(decision(s, "radial-loop-crossed")?.correct).toBe(true);
    navigate(s);
    expect(s.catheterInAorta).toBe(true);
  });

  it("balloon-assisted tracking outside 3-6 atm is scored, and it needs the catheter up to the wire tip", () => {
    const { session: s } = newCaseSession({ scenario: "radial-loop" });
    catheterIn(s);
    const loop = s.route.segments.find((x) => x.id === "loop")!;
    // the wire alone up to the loop: the catheter is far behind
    for (let i = 0; i < 300 && s.wire.pos < loop.start; i++) {
      s.commandWire(1.2, 0);
      s.tick(0.033);
    }
    expect(s.startBat(4)).toBe(false);
    // the catheter brought up behind the wire
    for (let i = 0; i < 200 && s.wire.pos - s.catheter!.pos > MP_RADIAL_SEQUENCE.batTipMm - 5; i++) s.commandCatheter(2);
    bat(s, 10);
    expect(s.radialSeq.loopCrossed).toBe("bat");
    expect(decision(s, "radial-loop-crossed")?.correct).toBe(false);
    expect(MP_RADIAL_SEQUENCE.batAtm).toEqual([3, 6]);
  });

  it("in 'radial-loop' forcing a hydrophilic wire perforates; the angiogram shows the extravasation; the catheter across over the wire seals it in the scripted run", () => {
    const { session: s } = newCaseSession({ scenario: "radial-loop" });
    catheterIn(s, true);
    const frames = push(s, 3000, () => s.wire.perforation);
    expect(s.wire.perforation).toBe(true);
    expect(frames).toBeLessThan(3000);
    // the catheter is in the arm: the attending asks for the image through it, as the panel offers
    expect(s.attending.some((a) => /through the catheter, brought up to just below the wire tip/.test(a.text))).toBe(true);
    expect(s.attending.some((a) => /through the sheath to see the anatomy/.test(a.text))).toBe(false);
    const p = s.radialSeq.perforation!;
    expect(p.sealed).toBe(false);
    expect(s.activeEvents()).toEqual(expect.arrayContaining(["perforation", "bleeding"]));
    expect(decision(s, "radial-loop-crossed")?.correct).toBe(false);
    expect(s.forearmAngiogram()?.shows.extravasation).toBe(true);
    s.runPending();
    // keep the wire, cross the loop with the balloon, then the catheter across the hole
    bat(s, 4);
    expect(p.wireLost).toBe(false);
    s.scriptRadial({ sealOutcome: "seal" });
    expect(s.sealPerforation("catheter")).toBe(true);
    s.runPending();
    expect(p.sealed).toBe(true);
    expect(p.method).toBe("catheter");
    expect(decision(s, "radial-perforation-sealed")?.correct).toBe(true);
  });
});

describe("radial-forced-perforation: the team's forced wire", () => {
  it("opens with the hole and the wire in place; the image shows the leak; across and covered it seals (scripted), and the next image shows none", () => {
    const { session: s } = newCaseSession({ scenario: "radial-forced-perforation" });
    const p = s.radialSeq.perforation!;
    expect(p).toMatchObject({ sealed: false, team: true });
    // the start state's decisions are the team's
    expect(s.decisions()).toHaveLength(0);
    expect(s.activeEvents()).toEqual(expect.arrayContaining(["perforation", "bleeding"]));
    // the hole is not covered from below it
    expect(s.sealPerforation("catheter")).toBe(false);
    s.beamOn = true;
    s.tipImaged = true;
    const leak = s.forearmAngiogram();
    s.runPending();
    expect(leak?.shows.extravasation).toBe(true);
    bat(s, 4);
    // the team's perforation is not the learner's loop error
    expect(decision(s, "radial-loop-crossed")?.correct).toBe(true);
    expect(s.sealPerforation("catheter")).toBe(true);
    s.runPending();
    expect(p.sealed).toBe(true);
    expect(decision(s, "radial-perforation-sealed")?.correct).toBe(true);
    s.tick(2);
    expect(s.activeEvents()).not.toContain("perforation");
    // the next image, from the catheter now across, shows no leak
    s.commandCatheter(-60);
    const after = s.forearmAngiogram();
    s.runPending();
    expect(after?.shows.extravasation).toBe(false);
  });

  it("a catheter that does not seal is followed by the long balloon at low pressure, which does", () => {
    const { session: s } = newCaseSession({ scenario: "radial-forced-perforation" });
    s.scriptRadial({ sealOutcome: "fail" });
    s.beamOn = true;
    s.tipImaged = true;
    bat(s, 4);
    expect(s.sealPerforation("catheter")).toBe(true);
    s.runPending();
    expect(s.radialSeq.perforation!.sealed).toBe(false);
    expect(s.sealPerforation("balloon")).toBe(true);
    s.runPending();
    expect(s.radialSeq.perforation).toMatchObject({ sealed: true, method: "balloon" });
  });
});

describe("radial heparin timing", () => {
  /** Puncture, sheath, side arm aspirated and flushed, verapamil, sheath secured: no heparin yet. */
  function readyForCatheter(s: CaseSession): void {
    if (!s.local.given) {
      s.giveLocal(1);
      s.runPending();
      s.wait(60);
      s.runPending();
    }
    expect(s.placeNeedle(aimedPose(s))).toBe(true);
    expect(advanceToFlash(s)).toBe(true);
    s.advanceNeedle(0.6);
    s.advanceAccessWire(1);
    s.advanceAccessWire(30);
    expect(s.removeNeedle()).toBe(true);
    expect(s.insertSheath("6")).toBe(true);
    s.runPending();
    s.aspirateSheath();
    s.runPending();
    s.flushSheathSide("fresh");
    s.runPending();
    s.order("verapamil");
    s.runPending();
    s.secureSheath("dressing");
    s.runPending();
    expect(s.heparinU).toBe(0);
  }

  it("'radial-tortuous-extreme' scores heparin held to the root correct; in 'radial-normal' the same is wrong", () => {
    for (const [id, expected] of [
      ["radial-tortuous-extreme", true],
      ["radial-normal", false],
    ] as const) {
      const { session: s } = newCaseSession({ scenario: id });
      readyForCatheter(s);
      s.prepCatheter("TIG");
      s.runPending();
      expect(s.loadCatheter("TIG")).toBe(true);
      navigate(s);
      expect(s.catheterInAorta).toBe(true);
      expect(s.order("heparin-radial")).not.toBeNull();
      s.runPending();
      const d = decision(s, "radial-heparin")!;
      expect(d.correct, id).toBe(expected);
      if (expected) expect(d.given).toMatch(/Held until the catheter reached the aortic root/);
    }
  });

  it("in the extreme arm, heparin after the sheath is also as expected; held and never given is wrong at the hand-over", () => {
    const early = newCaseSession({ scenario: "radial-tortuous-extreme" }).session;
    readyForCatheter(early);
    early.order("heparin-radial");
    early.runPending();
    early.prepCatheter("TIG");
    early.runPending();
    early.loadCatheter("TIG");
    expect(decision(early, "radial-heparin")?.correct).toBe(true);

    const never = newCaseSession({ scenario: "radial-tortuous-extreme" }).session;
    readyForCatheter(never);
    never.prepCatheter("TIG");
    never.runPending();
    never.loadCatheter("TIG");
    expect(decision(never, "radial-heparin")).toBeUndefined();
    navigate(never);
    never.pullWire(true);
    never.runPending();
    never.handover("diagnostic");
    expect(decision(never, "radial-heparin")?.correct).toBe(false);
  });

  it("in the extreme arm, a catheter out before the root leaves the held heparin pending; given after a crossover it scores correct", () => {
    const { session: s } = newCaseSession({ scenario: "radial-tortuous-extreme" });
    readyForCatheter(s);
    s.prepCatheter("TIG");
    s.runPending();
    expect(s.loadCatheter("TIG")).toBe(true);
    expect(s.catheterInAorta).toBe(false);
    s.removeCatheter();
    s.runPending();
    // out in the arm: not scored as missed
    expect(decision(s, "radial-heparin")).toBeUndefined();
    // cross over to the femoral artery and give the heparin there
    expect(s.addSite("femoral", "right")).not.toBeNull();
    expect(s.activeSite.siteKind).toBe("femoral");
    expect(s.order("heparin-weight")).not.toBeNull();
    s.runPending();
    const d = decision(s, "radial-heparin");
    expect(d).toBeDefined();
    expect(d!.correct).toBe(true);
    expect(d!.given).toMatch(/after crossing over/);
  });

  it("in the extreme arm, held heparin never given is scored wrong when the wrist is closed", () => {
    const { session: s } = newCaseSession({ scenario: "radial-tortuous-extreme" });
    readyForCatheter(s);
    s.prepCatheter("TIG");
    s.runPending();
    expect(s.loadCatheter("TIG")).toBe(true);
    s.removeCatheter();
    s.runPending();
    expect(decision(s, "radial-heparin")).toBeUndefined();
    s.applyBand(13);
    s.runPending();
    expect(decision(s, "radial-heparin")?.correct).toBe(false);
  });

  it("the extreme arm's previous report is a case property: subclavian tortuosity is an active event from arrival", () => {
    const { session: s } = newCaseSession({ scenario: "radial-tortuous-extreme" });
    expect(s.activeEvents()).toContain("subclavian-tortuosity");
    expect(s.radialSeq.extremeTortuosity).toBe(true);
    // the arm's loop opens to an aimed wire here (it is not the tight loop of 'radial-loop')
    expect(s.route.segments.find((x) => x.id === "loop")?.maneuver).toBe("torque");
    expect(segmentAt(s.route, 0).id).toBe("radial");
  });
});
