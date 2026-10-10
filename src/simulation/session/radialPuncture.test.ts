// access-radial-sequence: the radial puncture in the full case (scenarios/radial.ts; caseSession.ts, the radial
// sequence): the arm, the local anaesthetic and its bleb, single-wall and through-and-through punctures, spasm
// at the puncture, the needle tip, and the sheath's vasodilator and securing.
//   npx vitest run src/simulation/session/radialPuncture.test.ts
import { describe, expect, it } from "vitest";
import { newCaseSession, MP_TIPS, type CaseSession } from "./caseSession";
import { aimedPose, advanceToFlash } from "./autopilot";

const decision = (s: CaseSession, id: string) => s.decisions().find((d) => d.id === id);

/** The learner's local: `ml` at the probe, aspirated first, then its onset. */
function local(s: CaseSession, ml = 1, aspirate = true): void {
  expect(s.giveLocal(ml, { aspirate })).toBe(true);
  s.runPending();
  s.wait(60);
  s.runPending();
}

/** Single-wall: advance to the flash, a little more, the wire in small feeds; true when it runs free. */
function singleWall(s: CaseSession): boolean {
  if (!s.placeNeedle(aimedPose(s))) return false;
  if (!advanceToFlash(s)) return false;
  s.advanceNeedle(0.6);
  s.advanceAccessWire(1);
  s.advanceAccessWire(30);
  return s.pm.st.wire?.state === "intraluminal";
}

describe("radial-normal: the standard wrist", () => {
  it("'radial-normal' is reached with at most two passes by the autopilot pose, and the arm, the local and the passes are scored as expected", () => {
    const { session: s } = newCaseSession({ scenario: "radial-normal" });
    // the scenario leaves the local to the learner
    expect(s.local.given).toBe(false);
    expect(s.site.arm).toMatchObject({ position: "supinated", wristExtended: true });
    local(s, 1);
    let ok = singleWall(s);
    if (!ok) {
      s.abandonPass();
      s.runPending();
      ok = singleWall(s);
    }
    expect(ok).toBe(true);
    expect(s.removeNeedle()).toBe(true);
    expect(s.insertSheath("6")).toBe(true);
    s.runPending();
    expect(s.pm.st.passes).toBeLessThanOrEqual(2);
    for (const id of ["radial-passes", "radial-local-volume", "radial-arm-position"]) expect(decision(s, id)?.correct, id).toBe(true);
  });

  it("through-and-through flashes on withdrawal only: no blood after the stroke, blood as the needle is drawn back, and the wire then passes", () => {
    const { session: s } = newCaseSession({ scenario: "radial-normal" });
    local(s, 1);
    expect(s.placeNeedle(aimedPose(s))).toBe(true);
    s.advanceNeedle(0.5);
    expect(s.flashback().kind).toBe("none");
    s.throughAndThrough();
    const tgt = s.site.arteryId;
    expect(s.pm.st.walls[tgt]?.frontHole).toBe(true);
    expect(s.pm.st.walls[tgt]?.backHole).toBe(true);
    expect(s.pm.st.backWalls).toBeGreaterThan(0);
    expect(s.flashback().kind).toBe("none");
    // a stroke through the artery is not a flash that stopped
    expect(s.activeEvents()).not.toContain("no-flashback");
    let mm = 0;
    while (s.flashback().kind !== "arterial" && mm < 6) {
      s.advanceNeedle(-0.1);
      mm += 0.1;
    }
    expect(s.flashback().kind).toBe("arterial");
    expect(mm).toBeGreaterThan(0);
    // on until the whole bevel is back in the lumen (brisk flow), then the wire
    for (let k = 0; k < 10 && s.flashback().lumenFraction < 0.9; k++) s.advanceNeedle(-0.1);
    s.advanceAccessWire(1);
    s.advanceAccessWire(20);
    expect(s.pm.st.wire?.state).toBe("intraluminal");
  });
});

describe("the local anaesthetic at the wrist", () => {
  it("3 mL without waiting flattens the artery where the needle meets it; the volume is scored", () => {
    const one = newCaseSession({ scenario: "radial-normal" }).session;
    const three = newCaseSession({ scenario: "radial-normal" }).session;
    one.giveLocal(1);
    three.giveLocal(3);
    one.runPending();
    three.runPending();
    expect(one.pm.blebSquash(one.pm.probe.x)).toBe(0);
    expect(three.pm.blebSquash(three.pm.probe.x)).toBeGreaterThan(0.2);
    three.placeNeedle(aimedPose(three));
    three.advanceNeedle(1);
    expect(decision(three, "radial-local-volume")?.correct).toBe(false);
    expect(decision(three, "radial-bleb-response")?.correct).toBe(false);
    one.wait(60);
    one.runPending();
    one.placeNeedle(aimedPose(one));
    one.advanceNeedle(1);
    expect(decision(one, "radial-local-volume")?.correct).toBe(true);
    expect(decision(one, "radial-bleb-response")).toBeUndefined();
  });

  it("Oxford's 2 mL is scored correct on the volume and is not a bleb item in the debrief", () => {
    const { session: s } = newCaseSession({ scenario: "radial-normal" });
    s.giveLocal(2);
    s.runPending();
    s.placeNeedle(aimedPose(s));
    s.advanceNeedle(1);
    expect(decision(s, "radial-local-volume")?.correct).toBe(true);
    expect(decision(s, "radial-bleb-response")).toBeUndefined();
  });

  it("injected without aspirating is scored, whatever the volume", () => {
    const { session: s } = newCaseSession({ scenario: "radial-normal" });
    local(s, 1, false);
    s.placeNeedle(aimedPose(s));
    s.advanceNeedle(1);
    expect(decision(s, "radial-local-volume")).toMatchObject({ correct: false, given: "1 mL, not aspirated before injecting" });
  });

  it("radial-bleb: the team's 4 mL flattens the artery; puncturing at once is scored wrong, waiting two minutes right, and the team's volume is not the learner's", () => {
    const now = newCaseSession({ scenario: "radial-bleb" }).session;
    expect(now.pm.blebSquash(now.pm.probe.x)).toBeGreaterThan(0.3);
    now.placeNeedle(aimedPose(now));
    for (let i = 0; i < 80; i++) now.advanceNeedle(0.2);
    expect(decision(now, "radial-bleb-response")?.correct).toBe(false);
    expect(decision(now, "radial-local-volume")).toBeUndefined();

    const later = newCaseSession({ scenario: "radial-bleb" }).session;
    later.wait(120);
    later.runPending();
    expect(later.pm.blebSquash(later.pm.probe.x)).toBeLessThan(0.1);
    expect(singleWall(later)).toBe(true);
    expect(decision(later, "radial-bleb-response")?.correct).toBe(true);
  });
});

describe("spasm at the puncture", () => {
  it("passes without local raise the artery's tone to spasm (raised as radial-spasm); a further pass is stabbing; nitroglycerin and time relax it", () => {
    const { session: s } = newCaseSession({ scenario: "radial-normal" });
    const calm = s.radialTone();
    expect(calm).toBeLessThan(MP_TIPS.spasmLevel);
    // passes that miss (aimed well to the side), each one painful without a local
    const miss = { ...aimedPose(s), entryY: aimedPose(s).entryY + 8 };
    for (let k = 0; k < 3; k++) {
      s.placeNeedle(miss);
      s.advanceNeedle(6);
      s.advanceNeedle(-6);
      s.wait(5);
      s.runPending();
    }
    expect(s.radialTone()).toBeGreaterThanOrEqual(MP_TIPS.spasmLevel);
    s.placeNeedle(miss);
    s.advanceNeedle(1);
    expect(s.activeEvents()).toContain("radial-spasm");
    s.advanceNeedle(-1);
    // the next pass, with nothing done, is stabbing
    s.placeNeedle(miss);
    s.advanceNeedle(1);
    s.advanceNeedle(-1);
    expect(decision(s, "radial-spasm-stabbing")?.correct).toBe(false);
    // nitroglycerin and the local, then time
    s.giveNitrate("subcutaneous");
    s.runPending();
    s.giveLocal(1);
    s.runPending();
    s.wait(240);
    s.runPending();
    expect(s.radialTone()).toBeLessThan(MP_TIPS.spasmLevel);
    expect(s.radialSpasmTerms().map((t) => t.id)).not.toContain("pain");
  });

  it("radial-anxious-young: a tight artery before the needle; sedation lowers its tone", () => {
    const awake = newCaseSession({ scenario: "radial-anxious-young" }).session;
    const sedated = newCaseSession({ scenario: "radial-anxious-young" }).session;
    expect(awake.radialSpasmTerms().map((t) => t.id)).toEqual(expect.arrayContaining(["younger", "female", "anxiety", "small-artery"]));
    expect(sedated.order("midazolam", 2)).not.toBeNull();
    for (const s of [awake, sedated]) {
      s.runPending();
      local(s, 1);
      s.wait(120);
      s.runPending();
    }
    expect(sedated.radialTone()).toBeLessThan(awake.radialTone() - 0.05);
    // the awake patient's artery is felt to be in spasm at the first needle move
    awake.placeNeedle(aimedPose(awake));
    awake.advanceNeedle(1);
    expect(awake.activeEvents()).toContain("radial-spasm");
  });
});

describe("the arm and the needle tip", () => {
  it("radial-lima-left: the left arm left at the side with the wrist resting is scored, and the unextended wrist stops the wire at the tip until it is extended", () => {
    const { session: s } = newCaseSession({ scenario: "radial-lima-left" });
    expect(s.access).toBe("radial-left");
    expect(s.site.arm).toMatchObject({ position: "supinated", wristExtended: false });
    local(s, 1);
    expect(s.placeNeedle(aimedPose(s))).toBe(true);
    expect(advanceToFlash(s)).toBe(true);
    s.advanceNeedle(0.4);
    expect(decision(s, "radial-arm-position")?.correct).toBe(false);
    const ev = s.advanceAccessWire(1);
    expect(ev).toContainEqual({ kind: "wire-resistance", reason: "wrist-flexed" });
    expect(s.activeEvents()).toContain("wire-resistance");
    expect(s.setWristExtended(true)).toBe(true);
    s.advanceAccessWire(1);
    expect(s.pm.st.wire?.state).toBe("intraluminal");
  });

  it("radial-lima-left: brought across the body with the wrist extended before the puncture is scored as expected", () => {
    const { session: s } = newCaseSession({ scenario: "radial-lima-left" });
    expect(s.setArm("across-body")).toBe(true);
    s.runPending();
    expect(s.setWristExtended(true)).toBe(true);
    local(s, 1);
    expect(singleWall(s)).toBe(true);
    expect(decision(s, "radial-arm-position")?.correct).toBe(true);
  });

  it("radial-no-supination: the forearm cannot be supinated; moving to the femoral artery is scored as expected", () => {
    const { session: s } = newCaseSession({ scenario: "radial-no-supination" });
    expect(s.site.arm).toMatchObject({ position: "neutral", cannotSupinate: true });
    expect(s.setArm("supinated")).toBe(false);
    expect(s.setAccess("femoral")).toBe(true);
    expect(decision(s, "radial-cannot-supinate")?.correct).toBe(true);
    const again = newCaseSession({ scenario: "radial-no-supination" }).session;
    local(again, 1);
    again.placeNeedle(aimedPose(again));
    again.advanceNeedle(1);
    expect(decision(again, "radial-cannot-supinate")?.correct).toBe(false);
  });
});

describe("the sheath: vasodilator, cocktail and securing", () => {
  function sheathIn(s: CaseSession): void {
    local(s, 1);
    expect(singleWall(s)).toBe(true);
    s.removeNeedle();
    expect(s.insertSheath("6")).toBe(true);
    s.runPending();
  }

  it("a vasodilator through the aspirated side arm and the sheath secured before the first catheter are scored as expected; Oxford's cocktail counts as both heparin and vasodilator", () => {
    const { session: s } = newCaseSession({ scenario: "radial-normal" });
    sheathIn(s);
    s.aspirateSheath();
    s.runPending();
    s.flushSheathSide("fresh");
    s.runPending();
    const before = s.heparinU;
    expect(s.order("radial-cocktail")).not.toBeNull();
    s.runPending();
    expect(s.heparinU - before).toBe(2500);
    expect(s.vasodilatorEffect()).toBeGreaterThan(0);
    expect(s.secureSheath("dressing")).toBe(true);
    s.runPending();
    s.prepCatheter("TIG");
    s.runPending();
    expect(s.loadCatheter("TIG")).toBe(true);
    for (const id of ["radial-vasodilator", "radial-sheath-secured", "radial-heparin"]) expect(decision(s, id)?.correct, id).toBe(true);
  });

  it("a vasodilator before the side arm is aspirated, and an unsecured sheath, are scored; the unsecured sheath slips at the exchange", () => {
    const { session: s } = newCaseSession({ scenario: "radial-normal" });
    sheathIn(s);
    s.order("verapamil");
    s.runPending();
    s.order("heparin-radial");
    s.runPending();
    s.prepCatheter("TIG");
    s.runPending();
    s.loadCatheter("TIG");
    expect(decision(s, "radial-vasodilator")?.correct).toBe(false);
    expect(decision(s, "radial-sheath-secured")?.correct).toBe(false);
    s.removeCatheter();
    s.runPending();
    expect(s.radialSeq.slipped).toBe(true);
    expect(s.log.some((l) => /slid partly out/.test(l.text))).toBe(true);
    // the second catheter is an exchange: it adds to the artery's tone
    s.prepCatheter("JR4");
    s.runPending();
    s.loadCatheter("JR4");
    expect(s.radialSeq.exchanges).toBe(1);
    expect(s.radialSpasmTerms().map((t) => t.id)).toContain("exchanges");
  });
});
