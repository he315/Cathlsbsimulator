// access-femoral-puncture: the femoral sequence in the full case, headless (Brilakis 4.2, steps 3-8).
import { describe, it, expect } from "vitest";
import { newCaseSession, MP_FEMORAL_PUNCTURE, type CaseSession } from "./caseSession";
import { aimedPose, advanceToFlash, fastForward, markFemoralHead } from "./autopilot";
import { entryVsHead, tubeAt } from "../access/site";

const open = (scenario: string) => newCaseSession({ scenario }).session;

/** Mark the head, place the aimed needle, reach a flash and feed the micro-wire (as the autopilot does, without screening). */
function punctureAndWire(s: CaseSession, pose = aimedPose(s)): void {
  markFemoralHead(s);
  expect(s.placeNeedle(pose)).toBe(true);
  expect(advanceToFlash(s)).toBe(true);
  s.advanceNeedle(0.6);
  s.advanceAccessWire(5);
  s.advanceAccessWire(30);
  expect(s.pm.st.wire?.state).toBe("intraluminal");
}

describe("femoral puncture scenarios open ready to puncture", () => {
  it("every femoral scenario opens at 'access' on a femoral artery site with nothing marked, and the autopilot reaches 'sheath-in' cleanly", () => {
    for (const id of ["fem-normal", "fem-high-bif", "fem-calcified-anterior", "fem-deep-4cm", "fem-shallow-2cm", "fem-plugged-needle", "fem-micro-wire-iea", "fem-micro-wire-lcia", "fem-micro-wire-down-leg", "fem-entry-below-head"]) {
      const s = open(id);
      expect(s.startStage, id).toBe("access");
      expect(s.activeSite.siteKind, id).toBe("femoral");
      expect(s.femoralMarkX, id).toBeNull();
      expect(s.decisions(), id).toEqual([]);
      fastForward(s, "sheath-in");
      expect(s.sheath, id).not.toBeNull();
      expect(s.criticalErrors, id).toBe(0);
      expect(s.decisions().filter((d) => d.id.startsWith("femoral-") && !d.correct).map((d) => d.id), id).toEqual([]);
    }
  });
});

describe("the micro-wire on screening", () => {
  it("'fem-micro-wire-iea' raises wire-misdirected; insertSheath before withdrawal is a critical stop", () => {
    const s = open("fem-micro-wire-iea");
    punctureAndWire(s);
    // nothing tells the learner until the groin is screened
    expect(s.activeEvents()).not.toContain("wire-misdirected");
    s.noteFluoroscopy("groin");
    expect(s.activeEvents()).toContain("wire-misdirected");
    expect(s.removeNeedle()).toBe(true);
    expect(s.insertSheath("6")).toBe(false);
    expect(s.sheath).toBeNull();
    expect(s.criticalErrors).toBe(1);
    expect(s.complications.find((c) => c.id === "sheath-over-misplaced-wire")?.critical).toBe(true);
    const stop = s.attending[s.attending.length - 1];
    expect(stop.stop).toBe(true);
    expect(stop.text).not.toMatch(/epigastric|branch/i);
    // the wire was screened before the attempt: the line asks for it to be redirected, not to be seen
    expect(stop.text).toMatch(/not where it should be/);
    const d = s.decisions().find((x) => x.id === "sheath-over-misplaced-wire")!;
    expect(d.correct).toBe(false);
    expect(d.tipIds).toContain("access-femoral-screen-micro-wire");
    // withdrawn below the turn and advanced again under fluoroscopy: up the artery, and the sheath goes in
    while (s.pm.wireMisdirected()) s.advanceAccessWire(-5);
    s.advanceAccessWire(30);
    expect(s.pm.wireMisdirected()).toBe(false);
    expect(s.insertSheath("6")).toBe(true);
    expect(s.criticalErrors).toBe(1);
  });

  it("a sheath tried with the needle still in over a misplaced micro-wire is refused without a critical error", () => {
    const s = open("fem-micro-wire-iea");
    punctureAndWire(s);
    expect(s.pm.wireMisdirected()).toBe(true);
    expect(s.insertSheath("6")).toBe(false);
    expect(s.criticalErrors).toBe(0);
    expect(s.decisions().some((x) => x.id === "sheath-over-misplaced-wire")).toBe(false);
    expect(s.removeNeedle()).toBe(true);
    expect(s.insertSheath("6")).toBe(false);
    expect(s.criticalErrors).toBe(1);
    expect(s.complications.find((c) => c.id === "sheath-over-misplaced-wire")?.critical).toBe(true);
    // never screened: the attending asks for it to be seen, without naming where it runs
    const stop = s.attending[s.attending.length - 1];
    expect(stop.text).toMatch(/seen where it runs/);
    expect(stop.text).not.toMatch(/epigastric|branch/i);
  });

  it("the LCIA and down-the-leg scripts raise wire-misdirected on screening; the standard groin does not", () => {
    for (const id of ["fem-micro-wire-lcia", "fem-micro-wire-down-leg"]) {
      const s = open(id);
      punctureAndWire(s);
      s.noteFluoroscopy("groin");
      expect(s.activeEvents(), id).toContain("wire-misdirected");
    }
    const n = open("fem-normal");
    punctureAndWire(n);
    n.noteFluoroscopy("groin");
    expect(n.activeEvents()).not.toContain("wire-misdirected");
    expect(n.activeEvents()).not.toContain("wrong-height");
    expect(n.activeSite.wireScreenedAt).not.toBeNull();
  });

  it("a micro-wire pushed on into a small branch stops: wire-resistance is raised", () => {
    const s = open("fem-micro-wire-iea");
    punctureAndWire(s);
    const ev = s.advanceAccessWire(40);
    expect(ev.some((e) => e.kind === "wire-resistance" && e.reason === "branch")).toBe(true);
    expect(s.activeEvents()).toContain("wire-resistance");
    expect(s.pm.st.wire!.resistance).toBeGreaterThan(0.5);
  });

  it("'fem-entry-below-head' opens with the wire in below the head: screening raises wrong-height; redone, the entry is scored as expected", () => {
    const s = open("fem-entry-below-head");
    expect(s.pm.st.wire?.state).toBe("intraluminal");
    expect(entryVsHead(s.site, s.pm.st.arteriotomy!.x)).toBe("below");
    expect(s.activeEvents()).not.toContain("wrong-height");
    s.noteFluoroscopy("groin");
    expect(s.activeEvents()).toContain("wrong-height");
    // remove wire and needle, press, puncture again over the head
    s.abandonPass();
    s.runPending();
    expect(s.pm.st.wire).toBeNull();
    s.placeNeedle(aimedPose(s));
    expect(advanceToFlash(s)).toBe(true);
    s.advanceNeedle(0.6);
    s.advanceAccessWire(5);
    s.advanceAccessWire(30);
    expect(s.removeNeedle()).toBe(true);
    expect(s.insertSheath("6")).toBe(true);
    const d = s.decisions().find((x) => x.id === "femoral-entry")!;
    expect(d.correct).toBe(true);
    expect(d.given).toMatch(/2 skin passes/);
  });

  it("'fem-entry-below-head': the scripted pass is not the learner's, so their own repeat puncture is scored on the head marker", () => {
    const s = open("fem-entry-below-head");
    expect(s.activeSite.firstPassAt).toBeNull();
    s.abandonPass();
    s.runPending();
    const edge = s.site.landmarks.headFrom!;
    expect(s.placeFemoralMarker(edge)).toBe(true);
    s.noteFluoroscopy("groin", "ap");
    expect(s.markFemoralHead()).toBe(true);
    s.runPending();
    s.placeNeedle(aimedPose(s));
    s.advanceNeedle(1);
    expect(s.activeSite.firstPassAt).not.toBeNull();
    const d = s.decisions().find((x) => x.id === "femoral-head-marked")!;
    expect(d.correct).toBe(true);
  });

  it("the redone entry's debrief names the half of the femoral head it went in over", () => {
    const s = open("fem-entry-below-head");
    s.abandonPass();
    s.runPending();
    s.placeNeedle(aimedPose(s));
    expect(advanceToFlash(s)).toBe(true);
    s.advanceNeedle(0.6);
    s.advanceAccessWire(5);
    s.advanceAccessWire(30);
    expect(s.removeNeedle()).toBe(true);
    expect(s.insertSheath("6")).toBe(true);
    const d = s.decisions().find((x) => x.id === "femoral-entry")!;
    expect(d.given).toMatch(/over the (lower|upper) half of the femoral head/);
    expect(d.expected).toMatch(/lower half unless a high bifurcation leaves only the upper half/);
  });

  it("a sheath over the wrong-height entry is scored as not expected", () => {
    const s = open("fem-entry-below-head");
    expect(s.removeNeedle()).toBe(true);
    expect(s.insertSheath("6")).toBe(true);
    const d = s.decisions().find((x) => x.id === "femoral-entry")!;
    expect(d.correct).toBe(false);
    expect(d.given).toMatch(/below the femoral head/);
    expect(d.lessonId).toBe("pm-access-femoral-puncture");
  });
});

describe("blood at the hub", () => {
  it("a CFV puncture gives a venous flashback and event venous-flashback", () => {
    const s = open("fem-normal");
    s.pm.probe.pressure = 0;
    const v = s.site.tubes.find((t) => t.id === "cfv")!;
    const x = (s.site.landmarks.targetFrom + s.site.landmarks.targetTo) / 2;
    const c = tubeAt(v, x);
    const th = (45 * Math.PI) / 180;
    const L = c.z / Math.sin(th);
    expect(s.placeNeedle({ entryX: x - L * Math.cos(th), entryY: c.y, angleDeg: 45, yawDeg: 0 })).toBe(true);
    let f = s.flashback();
    for (let i = 0; i < 700 && f.kind === "none"; i++) {
      s.advanceNeedle(0.1);
      f = s.flashback();
    }
    expect(f.kind).toBe("venous");
    expect(s.activeEvents()).toContain("venous-flashback");
  });

  it("'fem-plugged-needle' gives no flash until 'flush needle'", () => {
    const s = open("fem-plugged-needle");
    s.pm.probe.pressure = 0;
    s.placeNeedle(aimedPose(s));
    // advanced until the tip lies in the lumen: no blood
    expect(advanceToFlash(s)).toBe(false);
    const f = s.flashback();
    expect(f.kind).toBe("none");
    expect(f.plugged).toBe(true);
    expect(s.pm.st.arterialPunctures).toBe(1);
    expect(s.activeEvents()).toContain("no-flashback");
    expect(s.flushNeedle()).toBe(true);
    s.runPending();
    expect(s.log.some((l) => l.text === "Needle withdrawn and flushed.")).toBe(true);
    expect(advanceToFlash(s)).toBe(true);
    expect(s.flashback().kind).toBe("arterial");
  });

  it("the standard groin's needle is not plugged", () => {
    const s = open("fem-normal");
    s.placeNeedle(aimedPose(s));
    expect(advanceToFlash(s)).toBe(true);
  });
});

describe("the femoral head marker and the deep artery", () => {
  it("the mark is scored at the first skin pass: on the lower edge of the head, off it, or not made", () => {
    const on = open("fem-normal");
    const edge = on.site.landmarks.headFrom!;
    expect(on.placeFemoralMarker(edge + 2)).toBe(true);
    on.noteFluoroscopy("groin", "ap");
    expect(on.markFemoralHead()).toBe(true);
    on.runPending();
    expect(on.femoralMarkX).toBe(edge + 2);
    on.placeNeedle(aimedPose(on));
    on.advanceNeedle(1);
    const d1 = on.decisions().find((x) => x.id === "femoral-head-marked")!;
    expect(d1.correct).toBe(true);
    expect(d1.tipIds).toEqual(["access-femoral-head-marker"]);

    const off = open("fem-normal");
    off.placeFemoralMarker(edge + MP_FEMORAL_PUNCTURE.markToleranceMm + 9);
    off.noteFluoroscopy("groin", "ap");
    off.markFemoralHead();
    off.runPending();
    off.placeNeedle(aimedPose(off));
    off.advanceNeedle(1);
    const d2 = off.decisions().find((x) => x.id === "femoral-head-marked")!;
    expect(d2.correct).toBe(false);
    expect(d2.given).toMatch(/above the lower edge/);

    const none = open("fem-normal");
    none.placeNeedle(aimedPose(none));
    none.advanceNeedle(1);
    expect(none.decisions().find((x) => x.id === "femoral-head-marked")!.given).toBe("The skin was not marked");
  });

  it("a mark made without an AP image of the marker at that position is not credited", () => {
    const edge = open("fem-normal").site.landmarks.headFrom!;
    const score = (prep: (s: CaseSession) => void) => {
      const s = open("fem-normal");
      prep(s);
      expect(s.markFemoralHead()).toBe(true);
      s.runPending();
      s.placeNeedle(aimedPose(s));
      s.advanceNeedle(1);
      return s.decisions().find((x) => x.id === "femoral-head-marked")!;
    };
    // dragged onto the edge blind, no fluoroscopy at all
    const blind = score((s) => s.placeFemoralMarker(edge));
    expect(blind.correct).toBe(false);
    expect(blind.given).toBe("Marked without an AP image of the marker");
    // screened only in LAO 30
    const lao = score((s) => {
      s.placeFemoralMarker(edge);
      s.noteFluoroscopy("groin", "lao");
    });
    expect(lao.correct).toBe(false);
    // screened on AP somewhere else, then moved onto the edge without another image
    const moved = score((s) => {
      s.placeFemoralMarker(edge + 30);
      s.noteFluoroscopy("groin", "ap");
      s.placeFemoralMarker(edge);
    });
    expect(moved.correct).toBe(false);
    // screened on AP where it lies
    const seen = score((s) => {
      s.placeFemoralMarker(edge);
      s.noteFluoroscopy("groin");
    });
    expect(seen.correct).toBe(true);
    expect(seen.given).toBe("Marked on the lower edge of the femoral head");
  });

  it("the marker belongs to a femoral artery site", () => {
    const s = newCaseSession({ seed: "fp-radial", access: "radial-right" }).session;
    expect(s.placeFemoralMarker(10)).toBe(false);
    expect(s.markFemoralHead()).toBe(false);
  });

  it("deep preset: about 45 degrees with the skin entry moved down the leg, or about 70 degrees, is as expected; 55 degrees is not", () => {
    const score = (angle: number) => {
      const s = open("fem-deep-4cm");
      punctureAndWire(s, aimedPose(s, angle));
      return { d: s.decisions().find((x) => x.id === "femoral-deep-entry")!, s };
    };
    const a45 = score(45);
    expect(a45.d.correct).toBe(true);
    // the skin entry lies below the crease, well down the leg from the arterial entry
    expect(a45.s.pm.st.needle!.entryX).toBeLessThan(a45.s.pm.st.arteriotomy!.x - 30);
    expect(a45.d.tipIds).toEqual(["access-femoral-deep-move-caudal"]);
    expect(score(70).d.correct).toBe(true);
    expect(score(55).d.correct).toBe(false);
    // a shallow artery is not scored on this
    const sh = open("fem-shallow-2cm");
    punctureAndWire(sh);
    expect(sh.decisions().some((x) => x.id === "femoral-deep-entry")).toBe(false);
  });
});
