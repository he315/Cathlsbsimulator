// The hands-on transseptal puncture (structural-transseptal-hands-on): pull-down and contact
// mechanics, the crossing and its confirmations, anticoagulation, air, and the complication branches;
// and the TEER and LAAO site results through the moved module.
//   npx vitest run src/simulation/transseptal.test.ts
import { describe, expect, it } from "vitest";
import {
  STANDARD_VARIANT,
  TS_HEPARIN,
  TS_MECH,
  TS_PATIENT,
  TS_PRESETS,
  actAt,
  apFromClock,
  assessTransseptal,
  checkFinding,
  clockLabel,
  complicationActive,
  createTransseptal,
  echoFinding,
  scoreTransseptal,
  septalHeightCm,
  tipClockH,
  traceKind,
  transseptalDecisions,
  transseptalEvents,
  transseptalPoint,
  transseptalPreset,
  transseptalRun,
  transseptalStep,
  vitalsAt,
  type TsAction,
  type TsState,
  type TsVariant,
} from "./transseptal";
import * as teer from "./teer";
import { TEER_SCENARIOS, grasp, idealPlacement, scoreTeer } from "./teer";
import { LAAO_SCENARIOS, assessLaao, scoreLaao } from "./laao";

const variant = (id: string): TsVariant => transseptalPreset(id)!.variant;
const start = (v: TsVariant = STANDARD_VARIANT) => createTransseptal({ variant: v });

/** Align, set the arrow, and pull down in 5 mm steps until the tip sits on the fossa (or reaches the IVC). */
function toFossa(s: TsState, h = 5.5, aligned = true): TsState {
  let x = transseptalRun(s, [...(aligned ? [{ kind: "align" } as TsAction] : []), { kind: "set-clock", h }]);
  for (let i = 0; i < 40 && x.zone !== "fossa" && x.zone !== "ivc"; i++) x = transseptalStep(x, { kind: "pull", mm: 5 });
  return x;
}

const FOUR: TsAction[] = [
  { kind: "check", what: "toe" },
  { kind: "check", what: "aspirate" },
  { kind: "check", what: "pressure" },
  { kind: "check", what: "contrast" },
];

/** A clean crossing and securing from the fossa: four checks, heparin on entry, ACT, de-aired, wire parked. */
function secure(s: TsState): TsState {
  return transseptalRun(s, [
    { kind: "advance-needle" },
    ...FOUR,
    { kind: "read-trace", as: "la" },
    { kind: "heparin", u: 100 * TS_PATIENT.weightKg },
    { kind: "advance-dilator" },
    { kind: "advance-sheath" },
    { kind: "remove-needle", hubLow: true, aspirate: true },
    { kind: "flush" },
    { kind: "lspv-wire" },
    { kind: "measure-act" },
  ]);
}

describe("pull-down and contact mechanics", () => {
  it("the pull-down registers two jumps: into the right atrium, then onto the fossa, with ectopics at the superior rim", () => {
    const s = toFossa(start(), 5.5);
    expect(s.zone).toBe("fossa");
    expect(s.jumps.map((j) => j.into)).toEqual(["ra", "fossa"]);
    expect(s.contact!.si).toBeCloseTo(TS_MECH.engageSi, 5);
    expect(vitalsAt(s).rhythm).toBe("sinus with atrial ectopics");
    expect(s.tentMm).toBeGreaterThan(0);
  });

  it("rotation alone does not move the tent point; clockwise with withdrawal moves it posterior", () => {
    const s = toFossa(start(), 5);
    const before = { ...s.contact! };
    const turned = transseptalRun(s, [{ kind: "rotate", deg: 30 }, { kind: "rotate", deg: 15 }]);
    expect(turned.contact).toEqual(before);
    expect(turned.clockH).not.toBe(s.clockH);
    // the slight withdrawal releases the stored turn at the contact point
    const moved = transseptalStep(turned, { kind: "pull", mm: 2 });
    expect(moved.contact!.ap).toBeLessThan(before.ap - 0.3);
    expect(moved.contact!.si).toBeLessThan(before.si);
    // posterior gains height for TEER despite the slight withdrawal
    expect(septalHeightCm(3.4, moved.contact!)).toBeGreaterThan(septalHeightCm(3.4, before));
    // withdrawal alone moves it inferior, not posterior
    const pulled = transseptalStep(s, { kind: "pull", mm: 2 });
    expect(pulled.contact!.ap).toBeCloseTo(before.ap, 5);
    expect(pulled.contact!.si).toBeLessThan(before.si);
    // the combined movement in one action does the same as turn then pull
    const combined = transseptalStep(s, { kind: "move", deg: 45, mm: 2 });
    expect(combined.contact!.ap).toBeCloseTo(moved.contact!.ap, 5);
    // counter-clockwise with withdrawal moves anterior
    const ccw = transseptalStep(s, { kind: "move", deg: -30, mm: 2 });
    expect(ccw.contact!.ap).toBeGreaterThan(before.ap);
  });

  it("the arrow's clock hour sets the first contact: 6 o'clock is more posterior than 5; an arrow at noon never reaches the fossa", () => {
    expect(toFossa(start(), 6).contact!.ap).toBeLessThan(toFossa(start(), 5).contact!.ap);
    expect(apFromClock(6)).toBeLessThan(0);
    const wrong = toFossa(start(), 12);
    expect(wrong.zone).toBe("ivc");
    expect(wrong.jumps.map((j) => j.into)).toEqual(["ra"]);
    expect(wrong.ivcDrops).toBe(1);
  });

  it("an arrow not aligned with the side arm misleads: the tip points more anterior than the arrow", () => {
    const aligned = toFossa(start(), 5.5, true);
    const loose = toFossa(start(), 5.5, false);
    expect(tipClockH(loose)).toBeCloseTo(5.5 - TS_MECH.misalignH, 5);
    expect(loose.contact!.ap).toBeGreaterThan(aligned.contact!.ap);
    expect(clockLabel(5.5)).toBe("5:30");
  });

  it("pulling too far drops the tip into the IVC; the wire back to the SVC starts a new pull-down", () => {
    let s = toFossa(start(), 5.5);
    for (let i = 0; i < 6 && s.zone === "fossa"; i++) s = transseptalStep(s, { kind: "pull", mm: 5 });
    expect(s.zone).toBe("ivc");
    expect(s.contact).toBeNull();
    expect(transseptalStep(s, { kind: "advance-needle" }).needle).toBe("none");
    s = transseptalStep(s, { kind: "to-svc" });
    expect(s.zone).toBe("svc");
    s = toFossa(s, 5.5);
    expect(s.zone).toBe("fossa");
    expect(scoreTransseptal(s).deductions.some((d) => d.reason.includes("IVC"))).toBe(true);
  });
});

describe("crossing and confirmation", () => {
  it("a clean puncture: the four confirmations, heparin on entry and an ACT in range secure the atrium with a good score", () => {
    const s = secure(toFossa(start(), 5.5));
    expect(s.stage).toBe("secured");
    expect(s.needle).toBe("la");
    expect(traceKind(s)).toBe("la");
    expect(s.critical).toEqual([]);
    expect(transseptalEvents(s)).toEqual([]);
    const sc = scoreTransseptal(s, assessTransseptal("teer", transseptalPoint(s)!, 3.4));
    expect(sc.score).toBeGreaterThanOrEqual(90);
    expect(transseptalDecisions(s).every((d) => d.correct)).toBe(true);
  });

  it("advancing the dilator without the four confirmations is critical", () => {
    const s = transseptalRun(toFossa(start(), 5.5), [{ kind: "advance-needle" }, { kind: "check", what: "pressure" }, { kind: "advance-dilator" }]);
    expect(s.critical).toContain("Dilator advanced without the four confirmations.");
    expect(transseptalDecisions(s).find((d) => d.id === "ts-four-confirmations")!.correct).toBe(false);
  });

  it("advancing the dilator after an aortic-trace confirmation is critical and produces haemopericardium", () => {
    let s = transseptalRun(toFossa(start(variant("ts-aortic-puncture")), 5), [{ kind: "advance-needle" }, ...FOUR]);
    expect(s.needle).toBe("aorta");
    expect(traceKind(s)).toBe("aortic");
    expect(checkFinding(s, "contrast")).toContain("ascending aorta");
    // before the learner reads the trace the complication is not named
    expect(complicationActive(s)).toBe(false);
    s = transseptalStep(s, { kind: "read-trace", as: "aortic" });
    expect(complicationActive(s)).toBe(true);
    s = transseptalStep(s, { kind: "advance-dilator" });
    expect(s.critical).toContain("Dilator advanced into the aorta.");
    expect(s.critical).not.toContain("Dilator advanced without the four confirmations.");
    expect(s.bleeds).toContain("aorta");
    s = transseptalStep(s, { kind: "wait", s: 60 });
    expect(s.pericardialMl).toBeGreaterThan(150);
    expect(transseptalEvents(s)).toContain("tamponade");
    expect(echoFinding({ ...s, echoT: s.t })).toContain("large pericardial effusion");
    expect(scoreTransseptal(s).deductions.some((d) => d.reason.includes("haemopericardium"))).toBe(true);
  });

  it("crossing into the aortic root is penalised and recorded in the ledger even when handled correctly", () => {
    let s = transseptalRun(toFossa(start(variant("ts-aortic-puncture")), 5), [{ kind: "advance-needle" }, { kind: "check", what: "pressure" }, { kind: "read-trace", as: "aortic" }, { kind: "call-surgeon" }]);
    expect(s.aorticCrossings).toBe(1);
    const sc = scoreTransseptal(s);
    expect(sc.deductions.some((d) => d.reason.startsWith("Crossed where the aortic root lies against the fossa"))).toBe(true);
    expect(sc.score).toBeLessThan(100);
    const dec = transseptalDecisions(s).find((d) => d.id === "ts-site-vs-aorta")!;
    expect(dec.correct).toBe(false);
    expect(dec.tipIds).toContain("structural-ts-aortic-puncture-hold");
    // withdrawing and re-crossing does not erase the aortic entry
    s = transseptalRun(toFossa(start(variant("ts-aortic-puncture")), 5), [{ kind: "advance-needle" }, { kind: "withdraw-needle" }]);
    expect(s.needle).toBe("none");
    expect(scoreTransseptal(s).deductions.some((d) => d.reason.startsWith("Crossed where the aortic root"))).toBe(true);
  });

  it("a needle-only aortic puncture: withdraw nothing, call the surgeon, no haemopericardium", () => {
    let s = transseptalRun(toFossa(start(variant("ts-aortic-puncture")), 5), [{ kind: "advance-needle" }, { kind: "check", what: "pressure" }, { kind: "read-trace", as: "aortic" }, { kind: "call-surgeon" }]);
    expect(s.stage).toBe("abandoned");
    s = transseptalStep(s, { kind: "wait", s: 120 });
    expect(s.pericardialMl).toBe(0);
    expect(scoreTransseptal(s).deductions.some((d) => d.reason.includes("withdraw nothing"))).toBe(false);
    // pulling the needle back once the aorta is confirmed is the wrong response
    const pulled = transseptalRun(toFossa(start(variant("ts-aortic-puncture")), 5), [{ kind: "advance-needle" }, { kind: "check", what: "pressure" }, { kind: "read-trace", as: "aortic" }, { kind: "withdraw-needle" }]);
    expect(scoreTransseptal(pulled).deductions.some((d) => d.reason.includes("withdraw nothing"))).toBe(true);
  });

  it("the posterior tent avoids the root in the dilated-root preset", () => {
    const s = secure(transseptalRun(toFossa(start(variant("ts-aortic-puncture")), 5), [{ kind: "rotate", deg: 30 }, { kind: "pull", mm: 2 }]));
    expect(s.needle).toBe("la");
    expect(s.critical).toEqual([]);
    expect(transseptalDecisions(s).find((d) => d.id === "ts-site-vs-aorta")!.correct).toBe(true);
    expect(scoreTransseptal(s).deductions.some((d) => d.reason.startsWith("Crossed where the aortic root"))).toBe(false);
  });
});

describe("septa that do not behave", () => {
  it("a thick septum does not cross with the needle alone; RF crosses without overshoot; force overshoots into the far wall", () => {
    const f = toFossa(start(variant("ts-thick-septum")), 5.5);
    const pushed = transseptalStep(f, { kind: "advance-needle" });
    expect(pushed.needle).toBe("none");
    expect(pushed.tentMm).toBeGreaterThan(f.tentMm);
    const forced = transseptalStep(pushed, { kind: "advance-needle", force: true });
    expect(forced.needle).toBe("la");
    expect(forced.bleeds).toContain("la-wall");
    expect(scoreTransseptal(forced).deductions.some((d) => d.reason.includes("thick septum"))).toBe(true);
    const rf = transseptalRun(f, [{ kind: "tool", tool: "rf" }, { kind: "advance-needle" }]);
    expect(rf.needle).toBe("la");
    expect(rf.bleeds).toEqual([]);
  });

  it("a resistant sheath: escalating without a pulmonary-vein wire injures the back wall; with the wire parked it tracks across", () => {
    const crossed = transseptalRun(toFossa(start(variant("ts-thick-septum")), 5.5), [{ kind: "tool", tool: "sharp-wire" }, { kind: "advance-needle" }, ...FOUR, { kind: "advance-dilator" }]);
    const gentle = transseptalStep(crossed, { kind: "advance-sheath" });
    expect(gentle.sheath).toBe("ra");
    const reckless = transseptalStep(gentle, { kind: "advance-sheath", escalate: true });
    expect(reckless.sheath).toBe("la");
    expect(reckless.bleeds).toContain("la-wall");
    expect(reckless.critical).toContain("Escalated on a resistant sheath without a wire parked deep in a pulmonary vein.");
    const careful = transseptalRun(gentle, [{ kind: "pv-wire" }, { kind: "advance-sheath", escalate: true }]);
    expect(careful.sheath).toBe("la");
    expect(careful.bleeds).toEqual([]);
  });

  it("a floppy septum loses height: the host inherits a lower point than the crossing site", () => {
    const s = secure(toFossa(start(variant("ts-floppy-septum")), 5.5));
    const p = transseptalPoint(s)!;
    expect(p.si).toBeLessThan(s.crossedAt!.si);
    expect(septalHeightCm(3.4, p)).toBeLessThan(septalHeightCm(3.4, s.crossedAt!));
    // a normal septum hands over exactly the crossing site
    const n = secure(toFossa(start(), 5.5));
    expect(transseptalPoint(n)).toEqual(n.crossedAt);
  });
});

describe("events after crossing", () => {
  it("low-act after the crossing until heparin is given and the ACT is in range", () => {
    const f = toFossa(start(), 5.5);
    expect(transseptalEvents(f)).not.toContain("low-act");
    const crossed = transseptalRun(f, [{ kind: "advance-needle" }, ...FOUR]);
    expect(transseptalEvents(crossed)).toContain("low-act");
    const early = transseptalRun(crossed, [{ kind: "heparin", u: TS_HEPARIN.earlyU }, { kind: "measure-act" }]);
    expect(early.acts[0].s).toBeLessThan(TS_HEPARIN.actTargetS);
    expect(transseptalEvents(early)).toContain("low-act");
    const full = transseptalRun(early, [{ kind: "heparin", u: 100 * TS_PATIENT.weightKg }, { kind: "measure-act" }]);
    expect(full.acts[1].s).toBeGreaterThanOrEqual(TS_HEPARIN.actTargetS);
    expect(transseptalEvents(full)).not.toContain("low-act");
  });

  it("the ACT model: 100 U/kg gives an ACT in the 250-350 s range at 10 min and falls back over hours", () => {
    const s = { heparin: [{ t: 0, u: 100 * TS_PATIENT.weightKg }] };
    expect(actAt(s, 600)).toBeGreaterThan(300);
    expect(actAt(s, 600)).toBeLessThan(350);
    expect(actAt(s, 4 * 3600)).toBeLessThan(200);
    expect(actAt({ heparin: [] }, 100)).toBe(TS_PATIENT.baselineActS);
  });

  it("air at the hub: removing the needle with the hub high raises air; flushing clears it; a wire through it embolises", () => {
    const sheathIn = transseptalRun(toFossa(start(), 5.5), [{ kind: "advance-needle" }, ...FOUR, { kind: "heparin", u: 7500 }, { kind: "advance-dilator" }, { kind: "advance-sheath" }]);
    const airy = transseptalStep(sheathIn, { kind: "remove-needle", hubLow: false, aspirate: true });
    expect(transseptalEvents(airy)).toContain("air");
    expect(transseptalEvents(transseptalStep(airy, { kind: "flush" }))).not.toContain("air");
    const emb = transseptalRun(airy, [{ kind: "lspv-wire" }, { kind: "wait", s: 60 }]);
    expect(emb.air).toBe("embolised");
    expect(transseptalEvents(emb)).toContain("st-elevation");
    // unlike the septal reflex, it is still there minutes later
    expect(transseptalEvents(transseptalStep(emb, { kind: "wait", s: 180 }))).toContain("st-elevation");
  });

  it("the vagal variant resolves without effusion", () => {
    const crossed = transseptalRun(toFossa(start(variant("ts-vagal")), 5.5), [{ kind: "advance-needle" }, { kind: "heparin", u: 7500 }, { kind: "wait", s: 30 }]);
    const ev = transseptalEvents(crossed);
    expect(ev).toEqual(expect.arrayContaining(["st-elevation", "bradycardia", "hypotension"]));
    expect(vitalsAt(crossed).sweating).toBe(true);
    expect(complicationActive(crossed)).toBe(true);
    const look = transseptalStep(crossed, { kind: "echo" });
    expect(echoFinding(look)).toBe("TOE: no pericardial effusion.");
    const later = transseptalStep(look, { kind: "wait", s: TS_PATIENT.vagal.endS });
    expect(transseptalEvents(later).filter((e) => e !== "low-act")).toEqual([]);
    expect(later.pericardialMl).toBe(0);
    // draining a patient with no effusion is penalised
    const drained = transseptalStep(crossed, { kind: "pericardiocentesis" });
    expect(scoreTransseptal(drained).deductions.some((d) => d.reason.includes("septal reflex"))).toBe(true);
  });

  it("delayed tamponade raises hypotension later, only after the catheters come out", () => {
    const sec = secure(toFossa(start(variant("ts-delayed-tamponade")), 5.5));
    expect(sec.posteriorExit).toBe(true);
    expect(sec.critical).toEqual([]);
    const waited = transseptalStep(sec, { kind: "wait", s: 300 });
    expect(transseptalEvents(waited)).not.toContain("hypotension");
    expect(waited.pericardialMl).toBe(0);
    // catheters and wire out: nothing at first, then hypotension in recovery
    const out = transseptalStep(sec, { kind: "catheters-out", leaveWire: false });
    expect(transseptalEvents(out)).not.toContain("hypotension");
    const recovery = transseptalStep(out, { kind: "finish" });
    expect(recovery.stage).toBe("recovery");
    expect(transseptalEvents(recovery)).toContain("hypotension");
    expect(recovery.t - out.t).toBeGreaterThan(60);
    const fixed = transseptalRun(recovery, [{ kind: "echo" }, { kind: "pericardiocentesis" }, { kind: "close-breach" }, { kind: "finish" }]);
    expect(fixed.stage).toBe("done");
    expect(fixed.critical).toContain("Breach closed only after a new puncture: no wire had been left across.");
    // leaving a wire across and watching finds it on the table
    const watched = transseptalRun(sec, [{ kind: "catheters-out", leaveWire: true }, { kind: "wait", s: 60 }, { kind: "echo" }]);
    expect(echoFinding(watched)).toContain("atrial wall haematoma");
    const closed = transseptalRun(watched, [{ kind: "pericardiocentesis" }, { kind: "close-breach" }, { kind: "finish" }]);
    expect(closed.stage).toBe("done");
    expect(closed.critical).toEqual([]);
    expect(scoreTransseptal(closed).score).toBeGreaterThan(scoreTransseptal(fixed).score);
  });

  it("a standard puncture with the catheters out goes straight to done", () => {
    const s = transseptalRun(secure(toFossa(start(), 5.5)), [{ kind: "catheters-out", leaveWire: true }, { kind: "wait", s: 120 }, { kind: "finish" }]);
    expect(s.stage).toBe("done");
    expect(s.pericardialMl).toBe(0);
  });

  it("pacing leads: the wire starts anterior to them and is re-passed posteriorly after the LAO check", () => {
    const s = start(variant("ts-pacing-lead"));
    expect(s.wire).toBe("anterior");
    const fixed = transseptalRun(s, [{ kind: "check-lao" }, { kind: "repass-wire" }]);
    expect(fixed.wire).toBe("posterior");
    expect(transseptalDecisions(fixed).find((d) => d.id === "ts-pacing-lead")!.correct).toBe(true);
    expect(scoreTransseptal(s).deductions.some((d) => d.reason.includes("pacing leads"))).toBe(true);
  });
});

describe("review fixes", () => {
  it("a crossing into the aorta keeps the tent (it does not release into the left atrium); a crossing into the atrium releases it", () => {
    const aortic = transseptalStep(toFossa(start(variant("ts-aortic-puncture")), 5), { kind: "advance-needle" });
    expect(aortic.needle).toBe("aorta");
    expect(aortic.tentMm).toBeGreaterThan(0);
    const la = transseptalStep(toFossa(start(), 5.5), { kind: "advance-needle" });
    expect(la.needle).toBe("la");
    expect(la.tentMm).toBe(0);
  });

  it("low-act stays after heparin until an ACT measured since the crossing is in range", () => {
    const crossed = transseptalStep(toFossa(start(), 5.5), { kind: "advance-needle" });
    const dosed = transseptalStep(crossed, { kind: "heparin", u: 100 * TS_PATIENT.weightKg });
    expect(transseptalEvents(dosed)).toContain("low-act");
    const measured = transseptalStep(dosed, { kind: "measure-act" });
    expect(transseptalEvents(measured)).not.toContain("low-act");
    // an in-range ACT taken before the crossing does not clear it
    const preDosed = transseptalRun(toFossa(start(), 5.5), [{ kind: "heparin", u: 100 * TS_PATIENT.weightKg }, { kind: "measure-act" }]);
    expect(preDosed.acts[preDosed.acts.length - 1].s).toBeGreaterThanOrEqual(TS_HEPARIN.actTargetS);
    expect(transseptalEvents(transseptalStep(preDosed, { kind: "advance-needle" }))).toContain("low-act");
  });

  it("closing a breach where there is none finds none, and changes nothing", () => {
    const out = transseptalRun(secure(toFossa(start(), 5.5)), [{ kind: "catheters-out", leaveWire: true }, { kind: "pericardiocentesis" }]);
    expect(out.posteriorExit).toBe(false);
    const tried = transseptalStep(out, { kind: "close-breach" });
    expect(tried.log[tried.log.length - 1].text).toBe("No septal breach found on TOE.");
    expect(tried.breachClosed).toBe(false);
    expect(tried.critical).toEqual(out.critical);
  });

  it("no drill title names its complication", () => {
    for (const p of TS_PRESETS) expect(p.variant.title).not.toMatch(/monitor|vagal|reflex|tamponade|puncture of|aortic puncture|complication/i);
  });
});

describe("TEER and LAAO results through the new module are unchanged", () => {
  // computed with the pre-move assessTransseptal (teer.ts before this package, snapshot in
  // datasets/tmp/wp-snapshots/structural-transseptal-hands-on): [procedure, si, ap, target low, height, quality, danger, coaxial, flags]
  const GOLDEN: [string, number, number, number, number, string, boolean, boolean, number][] = [
    ["teer", 0.55, -0.45, 4, 4.12, "ideal", false, false, 2], ["teer", 0.55, -0.45, 3.5, 4.12, "ideal", false, false, 2],
    ["laao", 0.55, -0.45, 4, 4.12, "poor", false, false, 1], ["teer", 0, 0, 4, 3.4, "poor", false, false, 2],
    ["teer", 0, 0, 3.5, 3.4, "acceptable", false, false, 2], ["laao", 0, 0, 4, 3.4, "acceptable", false, false, 1],
    ["teer", 0.4, 0.7, 4, 3.41, "poor", true, false, 3], ["laao", 0.4, 0.7, 4, 3.41, "poor", true, false, 2],
    ["teer", -0.5, -0.4, 4, 3.15, "poor", false, true, 2], ["teer", -0.5, -0.4, 3.5, 3.15, "acceptable", false, true, 2],
    ["laao", -0.5, -0.4, 4, 3.15, "ideal", false, true, 1], ["teer", 0.9, -0.2, 4, 4.31, "poor", true, false, 3],
    ["laao", 0.9, -0.2, 4, 4.31, "poor", true, false, 2], ["teer", 0.3, -0.9, 4, 4.12, "poor", true, false, 3],
    ["laao", -0.9, 0, 4, 2.59, "poor", true, false, 2],
  ];

  it("teer.ts re-exports the same functions", () => {
    expect(teer.assessTransseptal).toBe(assessTransseptal);
    expect(teer.septalHeightCm).toBe(septalHeightCm);
  });

  it("assessTransseptal matches the pre-move results", () => {
    for (const [proc, si, ap, lo, h, q, danger, coax, flags] of GOLDEN) {
      const target: [number, number] = lo === 4 ? teer.TEER_HEIGHT_TARGET.degenerative : teer.TEER_HEIGHT_TARGET.functional;
      const r = assessTransseptal(proc as "teer" | "laao", { si, ap }, 3.4, target);
      expect(r.heightCm).toBeCloseTo(h, 2);
      expect([r.quality, r.danger, r.coaxialForLaa, r.flags.length]).toEqual([q, danger, coax, flags]);
    }
  });

  it("scoreTeer gives the pre-move score for the same point (88 for the P2 flail with one ideal device)", () => {
    const s = TEER_SCENARIOS[0];
    const ts = assessTransseptal("teer", { si: 0.55, ap: -0.45 }, s.septalHeightBaseCm, s.heightTargetCm);
    const dev = [{ placement: idealPlacement(0.02), grasp: grasp(s, idealPlacement(0.02), ts.heightCm) }];
    expect(scoreTeer(s, { transseptal: ts, devices: dev, gradeBeforeEachExtraDevice: [], regrasps: 0 }).score).toBe(88);
  });

  it("a site reached by hand scores in TEER and LAAO exactly as the same point picked on the map", () => {
    const s = TEER_SCENARIOS[0];
    const hand = secure(toFossa(start(), 5.5));
    const p = transseptalPoint(hand)!;
    // the scored point is the point crossed (a standard septum loses no height)
    expect(p).toEqual(hand.crossedAt);
    expect(p).toEqual({ si: 0.75, ap: -0.4 });
    // golden values for (0.75, -0.4) computed with the pre-move teer.ts (snapshot in
    // datasets/tmp/wp-snapshots/structural-transseptal-hands-on): ideal, 4.275 cm, scoreTeer 88 with one ideal device
    const site = assessTransseptal("teer", p, s.septalHeightBaseCm, s.heightTargetCm);
    expect(site.quality).toBe("ideal");
    expect(site.heightCm).toBeCloseTo(4.275, 3);
    const dev = [{ placement: idealPlacement(0.02), grasp: grasp(s, idealPlacement(0.02), site.heightCm) }];
    expect(scoreTeer(s, { transseptal: site, devices: dev, gradeBeforeEachExtraDevice: [], regrasps: 0 }).score).toBe(88);
    // LAAO: an inferior-posterior site by hand (6 o'clock, then withdraw to the lower fossa)
    let l = toFossa(start(), 6);
    for (let i = 0; i < 4; i++) l = transseptalStep(l, { kind: "pull", mm: 5 });
    const lp = transseptalPoint(secure(l))!;
    const ts = assessTransseptal("laao", lp, 3.4);
    expect(ts.coaxialForLaa).toBe(true);
    const sc = LAAO_SCENARIOS[0];
    const plan = { type: "plug" as const, sizeMm: 27, positionMm: 8, coaxial: ts.coaxialForLaa, recaptures: 0, transseptalDanger: ts.danger };
    const picked = assessTransseptal("laao", { si: lp.si, ap: lp.ap }, 3.4);
    expect(scoreLaao(sc, { plan, anglesMeasured: [0, 45, 90, 135], transseptalQuality: ts.quality, transseptalDanger: ts.danger, released: true })).toEqual(
      scoreLaao(sc, { plan: { ...plan, coaxial: picked.coaxialForLaa }, anglesMeasured: [0, 45, 90, 135], transseptalQuality: picked.quality, transseptalDanger: picked.danger, released: true })
    );
    expect(assessLaao(sc, plan).allPass).toBe(assessLaao(sc, { ...plan, coaxial: picked.coaxialForLaa }).allPass);
  });
});

describe("presets", () => {
  it("declares the seven transseptal presets, each on a TEER scenario", () => {
    expect(TS_PRESETS.map((p) => p.id)).toEqual(["ts-standard", "ts-thick-septum", "ts-floppy-septum", "ts-aortic-puncture", "ts-vagal", "ts-delayed-tamponade", "ts-pacing-lead"]);
    for (const p of TS_PRESETS) {
      expect(TEER_SCENARIOS.some((s) => s.id === p.teerScenario)).toBe(true);
      expect(p.variant.id).toBe(p.id);
    }
    expect(transseptalPreset("no-such")).toBeUndefined();
  });
});
