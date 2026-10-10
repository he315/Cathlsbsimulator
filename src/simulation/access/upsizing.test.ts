// access-femoral-upsizing-angiogram: micropuncture upsizing, sheath preparation, resistance and the femoral
// angiogram, in the pure sequence (upsizing.ts), the full case (caseSession.ts) and the groin drawing (route.ts).
import { describe, it, expect } from "vitest";
import {
  ANGIO_REPORT_FIELDS,
  FIXES_FOR,
  freshUpsizing,
  gradeFemoralAngioReport,
  insertMicroDilator,
  insertSheath,
  insertWire035,
  ipsilateralOblique,
  needleOut,
  removeDilator,
  removeInnerDilator,
  sideArmTrace,
  skinNick,
  spreadTrack,
  type FemoralAngioAnswer,
} from "./upsizing";
import { femoralBifurcationSpread, femoralAngioTubes, femoralSheathPolyline, accessWirePolyline, femoralCalciumTubes } from "./route";
import { newCaseSession, type CaseSession } from "../session/caseSession";
import { aimedPose, advanceToFlash, fastForward, markFemoralHead, exchange, navigate } from "../session/autopilot";
import { practiceForLesson } from "../../ui/content/practiceIndex";
import { SCENARIO_BY_ID } from "../session/scenarios/index";
import { launch as upsizingLaunch } from "../session/scenarios/upsizing.launch";

const open = (scenario: string, mode?: "guided" | "supervised" | "exam") => newCaseSession({ scenario, mode }).session;
const decision = (s: CaseSession, id: string) => s.decisions().find((d) => d.id === id);

/** The upsizing done the sourced way from a screened micro-wire with the needle in (Brilakis 4.2, steps 9-11). */
function upsizeToWire(s: CaseSession): void {
  for (const step of [() => s.skinNick(), () => s.removeNeedle(), () => s.insertMicroDilator(), () => s.removeInnerDilator(), () => s.insertWire035("standard"), () => s.removeDilator()]) {
    expect(step()).toBe(true);
    s.runPending();
  }
}

const ALL = ["fem-upsizing", "fem-obese-scar", "fem-kinked-micro-wire", "fem-poor-track", "fem-wire-kinks", "fem-subintimal-sheath", "fem-angio-high", "fem-angio-below-bif", "radial-sheath-prep"];

describe("the upsizing sequence (pure)", () => {
  it("needle, nick, dilator, inner out, 0.035 wire, dilator out, sheath: each step only from the one before", () => {
    const st = freshUpsizing();
    expect(skinNick(st, { femoral: true, needleIn: true, sheathIn: false }).ok).toBe(true);
    expect(insertMicroDilator(st).ok).toBe(false); // the needle is still in
    needleOut(st);
    expect(insertWire035(st, "standard").ok).toBe(false); // no outer dilator yet
    expect(insertMicroDilator(st).ok).toBe(true);
    expect(insertSheath(st, 10).ok).toBe(false); // the dilator is on the wire
    expect(removeInnerDilator(st).ok).toBe(true);
    expect(st.backflow).toBe(true);
    expect(insertWire035(st, "standard").ok).toBe(true);
    expect(removeDilator(st).ok).toBe(true);
    const r = insertSheath(st, 25);
    expect(r.ok).toBe(true);
    expect(st.stage).toBe("sheath");
    expect(st.viaWire035).toBe(true);
    expect(st.wireLeftIn).toBe(true);
    expect(st.sheathLengthCm).toBe(25);
  });

  it("the nick: over the needle or a dilator at the groin, never over the bare wire there, never with a sheath in", () => {
    const st = freshUpsizing();
    needleOut(st);
    expect(skinNick(st, { femoral: true, needleIn: false, sheathIn: false }).ok).toBe(false);
    // at the wrist the nick is made where the wire enters, after the needle is out
    expect(skinNick(freshUpsizing(), { femoral: false, needleIn: false, sheathIn: false }).ok).toBe(true);
    expect(insertMicroDilator(st).ok).toBe(true);
    expect(skinNick(st, { femoral: true, needleIn: false, sheathIn: false }).ok).toBe(true);
    expect(st.nick.over).toBe("dilator");
    const sh = freshUpsizing();
    expect(skinNick(sh, { femoral: true, needleIn: false, sheathIn: true }).ok).toBe(false);
  });

  it("a scripted resistance stops the step until a listed fix; a second push without a fix is forcing", () => {
    const st = freshUpsizing(["poor-track"]);
    needleOut(st);
    const first = insertSheath(st, 10);
    expect(first.ok).toBe(false);
    expect(first.event).toBe("dilator-resistance");
    expect(first.met).toBe("poor-track");
    const again = insertSheath(st, 10);
    expect(again.forced).toBe("poor-track");
    expect(st.forced).toEqual(["poor-track"]);
    // a nick alone is not enough: the track must be spread too
    skinNick(st, { femoral: true, needleIn: false, sheathIn: false }); // refused over the wire at the groin
    expect(spreadTrack(st).ok).toBe(false);
    expect(FIXES_FOR["poor-track"]).toEqual(["spread", "exchange-stiff-wire"]);
  });

  it("a track nicked and spread before the sheath goes in removes a poorly prepared track before it is met", () => {
    const st = freshUpsizing(["poor-track"]);
    skinNick(st, { femoral: true, needleIn: true, sheathIn: false });
    spreadTrack(st);
    needleOut(st);
    insertMicroDilator(st);
    removeInnerDilator(st);
    insertWire035(st, "standard");
    removeDilator(st);
    expect(insertSheath(st, 10).ok).toBe(true);
    expect(st.met).toEqual([]);
  });

  it("the side-arm trace: an arterial waveform, or a flat damped line", () => {
    const art = sideArmTrace("arterial");
    const damped = sideArmTrace("damped");
    const span = (xs: number[]) => Math.max(...xs) - Math.min(...xs);
    expect(span(art)).toBeGreaterThan(0.5);
    expect(span(damped)).toBeLessThan(0.1);
  });

  it("the ipsilateral oblique is RAO 20-30 for the right groin and LAO 20-30 for the left", () => {
    expect(ipsilateralOblique(-25, "right")).toBe(true);
    expect(ipsilateralOblique(25, "right")).toBe(false);
    expect(ipsilateralOblique(0, "right")).toBe(false);
    expect(ipsilateralOblique(20, "left")).toBe(true);
    expect(ipsilateralOblique(-30, "left")).toBe(false);
  });

  it("the report is graded item by item", () => {
    const truth: FemoralAngioAnswer = { bifurcation: "above", iea: "below", over5mm: true, disease: false };
    expect(gradeFemoralAngioReport(truth, truth).correct).toBe(ANGIO_REPORT_FIELDS.length);
    const g = gradeFemoralAngioReport({ ...truth, iea: "above" }, truth);
    expect(g.correct).toBe(ANGIO_REPORT_FIELDS.length - 1);
    expect(g.items.find((i) => i.key === "iea")!.correct).toBe(false);
  });
});

describe("upsizing in the full case", () => {
  it("every upsizing scenario opens at its start state with nothing scored, and the autopilot plays it to recovery cleanly", () => {
    for (const id of ALL) {
      const s = open(id);
      expect(s.startStage, id).toBe("access");
      expect(s.decisions(), id).toEqual([]);
      expect(s.criticalErrors, id).toBe(0);
      expect(s.busy, id).toBe(false);
      if (id.startsWith("fem-angio") || id === "radial-sheath-prep") expect(s.sheath, id).not.toBeNull();
      else {
        expect(s.sheath, id).toBeNull();
        expect(s.pm.st.wire?.state, id).toBe("intraluminal");
        expect(s.pm.st.needleRemoved, id).toBe(false);
        expect(s.pm.wireMisdirected(), id).toBe(false);
      }
      fastForward(s, "recovery");
      expect(s.closureDone(), id).toBe(true);
      expect(s.criticalErrors, id).toBe(0);
      expect(s.decisions().filter((d) => !d.correct).map((d) => d.id), id).toEqual([]);
    }
  });

  it("the start states are reached in supervised mode too (the team confirms its own checklist)", () => {
    for (const id of ["fem-upsizing", "fem-angio-high", "radial-sheath-prep"]) {
      const s = open(id, "supervised");
      expect(s.pm.st.wire?.state, id).toBe("intraluminal");
      expect(s.decisions(), id).toEqual([]);
    }
  });

  it("Skin nick with the sheath in is refused; needle-dilator-0.035-sheath succeeds", () => {
    const s = open("fem-upsizing");
    expect(s.upsizing.stage).toBe("needle");
    upsizeToWire(s);
    expect(s.upsizing.stage).toBe("wire-035");
    expect(s.pm.st.wire?.beyondMm).toBeGreaterThan(200);
    expect(s.insertSheath("6", 10)).toBe(true);
    s.runPending();
    expect(s.sheath?.lengthCm).toBe(10);
    expect(decision(s, "upsized-to-035")!.correct).toBe(true);
    expect(decision(s, "skin-nick-safe")!.correct).toBe(true);
    // with the sheath in, the nick is refused, the attending stops it and the ledger scores it
    const before = s.attending.length;
    expect(s.skinNick()).toBe(false);
    expect(s.attending.slice(before).some((a) => a.stop)).toBe(true);
    expect(decision(s, "skin-nick-safe")!.correct).toBe(false);
    expect(s.criticalErrors).toBe(0);
  });

  it("a sheath straight over the 0.018 inch wire goes in but is scored; a dilator over a misplaced micro-wire is a critical stop", () => {
    const s = open("fem-upsizing");
    s.removeNeedle();
    expect(s.insertSheath("6")).toBe(true);
    expect(decision(s, "upsized-to-035")!.correct).toBe(false);
    const m = open("fem-micro-wire-iea");
    markFemoralHead(m);
    m.placeNeedle(aimedPose(m));
    expect(advanceToFlash(m)).toBe(true);
    m.advanceNeedle(0.6);
    m.advanceAccessWire(5);
    m.advanceAccessWire(30);
    expect(m.pm.wireMisdirected()).toBe(true);
    m.removeNeedle();
    expect(m.insertMicroDilator()).toBe(false);
    expect(m.criticalErrors).toBe(1);
    expect(m.complications.find((c) => c.id === "sheath-over-misplaced-wire")?.critical).toBe(true);
  });

  it("the dilator and the 0.035 inch wire are drawn on the groin at their own length and course", () => {
    const s = open("fem-upsizing");
    upsizeToWire(s);
    const ax = s.pm.st.arteriotomy!;
    const wire = accessWirePolyline(s.route.geom, s.site, ax.x, s.pm.st.wire!.beyondMm);
    expect(wire.length).toBeGreaterThan(10);
    const short = femoralSheathPolyline(s.route.geom, s.site, ax.x, 45, 100);
    const long = femoralSheathPolyline(s.route.geom, s.site, ax.x, 45, 450);
    const len = (p: { x: number; y: number; z: number }[]) => p.slice(1).reduce((a, q, i) => a + Math.hypot(q.x - p[i].x, q.y - p[i].y, q.z - p[i].z), 0);
    expect(len(long) - len(short)).toBeGreaterThan(300);
  });
});

describe("the wire through the needle", () => {
  it("a hydrophilic wire chosen with the needle in is cautioned and scored; pulled back through the needle it shears", () => {
    const s = open("fem-normal");
    markFemoralHead(s);
    s.placeNeedle(aimedPose(s));
    expect(advanceToFlash(s)).toBe(true);
    s.advanceNeedle(0.6);
    const before = s.attending.length;
    expect(s.setAccessWire("hydrophilic")).toBe(true);
    expect(s.attending.slice(before).some((a) => /jacket/.test(a.text))).toBe(true);
    s.advanceAccessWire(5);
    expect(decision(s, "no-hydrophilic-through-needle")!.correct).toBe(false);
    s.advanceAccessWire(-2);
    expect(s.complications.some((c) => c.id === "wire-jacket-sheared")).toBe(true);
    // the micropuncture wire is accepted
    const t = open("fem-normal");
    markFemoralHead(t);
    t.placeNeedle(aimedPose(t));
    advanceToFlash(t);
    t.advanceNeedle(0.6);
    t.advanceAccessWire(5);
    expect(decision(t, "no-hydrophilic-through-needle")!.correct).toBe(true);
  });
});

describe("sheath preparation", () => {
  it("Flush before aspirate is wrong; skipping aspiration sets catheter lumen clot and aspirate() later finds clot", () => {
    const s = open("radial-sheath-prep");
    expect(s.sheath!.aspirated).toBe(false);
    // flushed first: scored wrong, and the sheath still holds thrombus
    expect(s.flushSheathSide("fresh")).toBe(true);
    s.runPending();
    const d = decision(s, "sheath-aspirate-then-flush")!;
    expect(d.correct).toBe(false);
    expect(d.given).toMatch(/before aspirating/);
    expect(d.tipIds).toContain("access-sheath-two-syringes");
    expect(s.sheath!.clot).toBe(true);
    // the catheter through an unaspirated sheath picks the clot up
    s.order("heparin-radial");
    s.runPending();
    s.prepCatheter("TIG");
    s.runPending();
    expect(s.loadCatheter("TIG")).toBe(true);
    expect(s.catheter!.lumenClot).toBe(true);
    expect(decision(s, "sheath-aspirated")!.correct).toBe(false);
    navigate(s);
    s.pullWire(true);
    s.runPending();
    const n = s.log.length;
    s.aspirate();
    s.runPending();
    expect(s.log.slice(n).some((l) => /clot/.test(l.text))).toBe(true);
    expect(s.catheter!.lumenClot).toBe(false);
  });

  it("aspirate and discard, then a second syringe, is as expected; the same syringe is not", () => {
    const s = open("radial-sheath-prep");
    expect(s.aspirateSheath()).toBe(true);
    s.runPending();
    expect(s.flushSheathSide("fresh")).toBe(true);
    s.runPending();
    expect(decision(s, "sheath-aspirate-then-flush")!.correct).toBe(true);
    expect(s.sheath!.clot).toBe(false);
    const t = open("radial-sheath-prep");
    t.aspirateSheath();
    t.runPending();
    t.flushSheathSide("same");
    expect(decision(t, "sheath-aspirate-then-flush")!.given).toMatch(/same|used to aspirate/);
    expect(decision(t, "sheath-aspirate-then-flush")!.correct).toBe(false);
  });

  it("before the next catheter the sheath is aspirated again; the PCI hand-over reports the sheath's clot", () => {
    const { session: s } = newCaseSession({ seed: "up-reload", access: "radial-right", start: "post-diagnostic" });
    expect(s.toPci()!.sheathState!.clot).toBe(false);
    s.returnFromLab("pci", { contrastMl: 0, fluoroS: 0 });
    s.runPending();
    s.removeCatheter();
    s.runPending();
    s.prepCatheter("JR4");
    s.runPending();
    s.loadCatheter("JR4");
    expect(s.catheter!.lumenClot).toBe(true);
    expect(decision(s, "sheath-aspirated")!.correct).toBe(false);
    navigate(s);
    exchange(s);
    s.checkTrace();
    expect(s.handover("pci")!.sheathState!.clot).toBe(true);
  });
});

describe("resistance during upsizing", () => {
  it("'fem-subintimal-sheath' shows a damped side-arm trace and a puff through it is a critical error; 'fem-poor-track' blocks the sheath until nick-and-spread", () => {
    const s = open("fem-subintimal-sheath");
    upsizeToWire(s);
    expect(s.insertSheath("6")).toBe(true); // in without resistance
    s.runPending();
    const t = s.transduceSheath()!;
    expect(t.trace).toBe("damped");
    expect(s.activeEvents()).toContain("pressure-damped");
    s.runPending();
    expect(s.criticalErrors).toBe(0);
    expect(s.sheathPuff()).toBe(true);
    expect(s.criticalErrors).toBe(1);
    expect(s.complications.find((c) => c.id === "subintimal-injection")?.critical).toBe(true);
    expect(decision(s, "subintimal-sheath-not-injected")!.correct).toBe(false);
    // nothing on screen names it before the learner acts: the attending speaks only of the waveform
    expect(s.attending.some((a) => /subintimal/i.test(a.text))).toBe(false);
    // taken out instead (another case): scored as expected, and the artery can be punctured again
    const c = open("fem-subintimal-sheath");
    upsizeToWire(c);
    c.insertSheath("6");
    c.runPending();
    c.transduceSheath();
    c.runPending();
    c.removeSheathAndCompress();
    c.runPending();
    expect(decision(c, "subintimal-sheath-not-injected")!.correct).toBe(true);
    expect(c.sheath).toBeNull();
    expect(c.upsizing.stage).toBe("needle");

    const p = open("fem-poor-track");
    upsizeToWire(p); // the nick was made over the needle, but the track was not spread
    expect(p.insertSheath("6")).toBe(false);
    expect(p.activeEvents()).toContain("dilator-resistance");
    expect(p.sheath).toBeNull();
    // a nick is already made; spreading the track lets the sheath in
    expect(p.spreadTrack()).toBe(true);
    p.runPending();
    expect(p.insertSheath("6")).toBe(true);
    expect(decision(p, "upsizing-not-forced")).toBeUndefined();
  });

  it("forcing a stopped dilator is a ledger failure; the listed fixes let it pass", () => {
    const s = open("fem-obese-scar");
    expect(s.skinNick()).toBe(true); // over the needle
    s.runPending();
    s.removeNeedle();
    expect(s.insertMicroDilator()).toBe(false);
    expect(s.activeEvents()).toContain("dilator-resistance");
    expect(s.insertMicroDilator()).toBe(false); // pushed again
    expect(decision(s, "upsizing-not-forced")!.correct).toBe(false);
    expect(s.useStiffDilator()).toBe(true);
    s.runPending();
    expect(s.insertMicroDilator()).toBe(true);

    const k = open("fem-kinked-micro-wire");
    k.skinNick();
    k.runPending();
    k.removeNeedle();
    expect(k.insertMicroDilator()).toBe(false);
    // a stiffer dilator is no answer to a kinked wire; pulling it back is
    k.useStiffDilator();
    k.runPending();
    expect(k.insertMicroDilator()).toBe(false);
    expect(k.fixKinkedWire("pull-back-wire")).toBe(true);
    k.runPending();
    expect(k.insertMicroDilator()).toBe(true);

    const w = open("fem-wire-kinks");
    upsizeToWire(w);
    expect(w.insertSheath("6")).toBe(false);
    expect(w.exchangeToStiffWire()).toBe(true);
    w.runPending();
    expect(w.insertSheath("6")).toBe(true);
    expect(w.upsizing.met.map((m) => [m.kind, m.fix])).toEqual([["wire-kink-035", "exchange-stiff-wire"]]);
  });
});

describe("the femoral angiogram", () => {
  it("In AP the projected SFA and PFA overlap; in RAO 25 they separate", () => {
    const s = open("fem-upsizing");
    const ap = femoralBifurcationSpread(s.route.geom, s.model, s.site, { laoRao: 0, cranialCaudal: 0 });
    const rao = femoralBifurcationSpread(s.route.geom, s.model, s.site, { laoRao: -25, cranialCaudal: 0 });
    const lao = femoralBifurcationSpread(s.route.geom, s.model, s.site, { laoRao: 25, cranialCaudal: 0 });
    expect(ap.maxGapMm).toBeLessThan(0);
    expect(rao.maxGapMm).toBeGreaterThan(2);
    // the contralateral oblique does not open the right groin's bifurcation
    expect(lao.maxGapMm).toBeLessThan(0);
  });

  it("the angiogram fills the inferior epigastric artery, and calcium shows without contrast", () => {
    const s = open("fem-angio-high");
    const tubes = femoralAngioTubes(s.route.geom, s.model, { strength: 1, mgPerMl: 150, bifBelowMm: 30, sheathMm: 100, site: s.site, arteriotomyX: s.pm.st.arteriotomy!.x });
    // CFA, SFA, PFA and the inferior epigastric
    expect(tubes.length).toBe(4);
    expect(femoralCalciumTubes(s.route.geom, s.model, s.site)).toEqual([]);
    const c = open("fem-calcified-anterior");
    expect(femoralCalciumTubes(c.route.geom, c.model, c.site).length).toBeGreaterThan(0);
  });

  it("scored on the view, magnification, volume, wire and waveform; the returned line names nothing of what it shows", () => {
    const s = open("fem-angio-high");
    // AP, before the waveform is checked
    const text = s.femoralAngiogram({ ml: 8, laoDeg: 0, magnified: false })!;
    s.runPending();
    expect(text).not.toMatch(/above|below|high|bifurcation|epigastric/i);
    const d = decision(s, "femoral-angio-technique")!;
    expect(d.correct).toBe(false);
    expect(d.given).toMatch(/AP/);
    expect(d.given).toMatch(/waveform/);
    // waveform checked, RAO 25, low magnification, 8 mL, wire still in the aorta
    expect(s.transduceSheath()!.trace).toBe("arterial");
    s.runPending();
    s.femoralAngiogram({ ml: 8, laoDeg: -25, magnified: false });
    s.runPending();
    expect(decision(s, "femoral-angio-technique")!.correct).toBe(true);
    // too much contrast, magnified
    s.femoralAngiogram({ ml: 15, laoDeg: -25, magnified: true });
    s.runPending();
    expect(decision(s, "femoral-angio-technique")!.given).toMatch(/magnified.*15 mL/);
  });

  it("the report is graded against the anatomy: a high stick above the inferior epigastric, an entry at a high bifurcation", () => {
    const h = open("fem-angio-high");
    expect(h.submitFemoralAngioReport({ bifurcation: "above", iea: "below", over5mm: true, disease: false })).toBeNull(); // no angiogram yet
    h.transduceSheath();
    h.runPending();
    h.femoralAngiogram({ ml: 8, laoDeg: -25 });
    h.runPending();
    const g = h.submitFemoralAngioReport({ bifurcation: "above", iea: "above", over5mm: true, disease: false })!;
    expect(g.correct).toBe(g.total);
    expect(decision(h, "femoral-angio-report")!.correct).toBe(true);
    expect(h.femoralAngioReport!.truth.iea).toBe("above");
    // reported again on the same angiogram: kept on the site, the ledger unchanged (scored once per angiogram)
    const wrong = h.submitFemoralAngioReport({ bifurcation: "above", iea: "below", over5mm: true, disease: false })!;
    expect(wrong.correct).toBe(wrong.total - 1);
    expect(decision(h, "femoral-angio-report")!.correct).toBe(true);
    expect(h.femoralAngioReport!.given.iea).toBe("below");
    // a new angiogram: its report is scored
    h.femoralAngiogram({ ml: 8, laoDeg: -25 });
    h.runPending();
    h.submitFemoralAngioReport({ bifurcation: "above", iea: "below", over5mm: true, disease: false });
    expect(decision(h, "femoral-angio-report")!.correct).toBe(false);

    const b = open("fem-angio-below-bif");
    expect(b.pm.arteriotomyClass()).toBe("low");
    expect(b.pm.st.arteriotomy!.vessel).toBe("cfa");
    b.femoralAngiogram({ ml: 8, laoDeg: -25 });
    b.runPending();
    expect(b.submitFemoralAngioReport({ bifurcation: "at-or-below", iea: "below", over5mm: true, disease: false })!.correct).toBe(4);
    expect(b.femoralAngioReport!.truth.bifurcation).toBe("at-or-below");
  });
});

describe("practice links", () => {
  it("practiceIndex lists the scenarios fem-upsizing, fem-obese-scar, fem-kinked-micro-wire under lessons pm-access-femoral-sheath, pm-access-troubleshoot, pm-to-the-root-table (from src/simulation/session/scenarios/upsizing.launch.ts)", () => {
    for (const lessonId of ["pm-access-femoral-sheath", "pm-access-troubleshoot", "pm-to-the-root-table"])
      for (const id of ["fem-upsizing", "fem-obese-scar", "fem-kinked-micro-wire"]) {
        const e = practiceForLesson(lessonId).filter((x) => x.sim === "procedure" && x.scenario === id);
        expect(e.length, `${id} under ${lessonId}`).toBeGreaterThan(0);
        expect(e[0].source).toMatch(/upsizing\.launch\.ts$/);
      }
  });

  it("every scenario is declared in the launch file with its title and listed under its own lessons", () => {
    const decl = new Map((upsizingLaunch.scenarios ?? []).map((x) => [x.id, x]));
    for (const id of ALL) {
      const sc = SCENARIO_BY_ID[id];
      expect(sc, id).toBeDefined();
      expect(decl.get(id)?.title, id).toBe(sc.title);
      for (const l of sc.lessonIds) expect(practiceForLesson(l).some((e) => e.sim === "procedure" && e.scenario === id), `${id} under ${l}`).toBe(true);
    }
    const high = practiceForLesson("pm-access-femoral-sheath").find((e) => e.scenario === "fem-angio-high")!;
    expect(high.params.workspace).toBe("fluoro");
  });
});

describe("review fixes", () => {
  it("a push after a fix that did not work is met again, not forced; a further push with no fix in between is forcing", () => {
    const st = freshUpsizing(["kinked-micro-wire"]);
    needleOut(st);
    expect(insertMicroDilator(st).met).toBe("kinked-micro-wire");
    // a fix that does not match (a nick over the stopped dilator) still counts as a fix in between
    expect(skinNick(st, { femoral: true, needleIn: false, sheathIn: false }).ok).toBe(true);
    const retry = insertMicroDilator(st);
    expect(retry.ok).toBe(false);
    expect(retry.forced).toBeUndefined();
    expect(st.forced).toEqual([]);
    expect(insertMicroDilator(st).forced).toBe("kinked-micro-wire");

    const k = open("fem-kinked-micro-wire");
    k.skinNick();
    k.runPending();
    k.removeNeedle();
    expect(k.insertMicroDilator()).toBe(false);
    expect(k.useStiffDilator()).toBe(true);
    k.runPending();
    expect(k.insertMicroDilator()).toBe(false);
    expect(decision(k, "upsizing-not-forced")).toBeUndefined();
    expect(k.insertMicroDilator()).toBe(false); // no fix in between
    expect(decision(k, "upsizing-not-forced")!.correct).toBe(false);
  });

  it("scar: the nick is enlarged over the stopped dilator, and that lets the dilator pass", () => {
    const s = open("fem-obese-scar");
    expect(s.skinNick()).toBe(true); // over the needle
    s.runPending();
    s.removeNeedle();
    expect(s.insertMicroDilator()).toBe(false);
    expect(s.skinNick()).toBe(true); // enlarged, over the stopped dilator
    s.runPending();
    expect(s.upsizing.nick.enlarged).toBe(true);
    expect(s.upsizing.blocked).toBeNull();
    expect(s.insertMicroDilator()).toBe(true);
    expect(s.upsizing.met.map((m) => [m.kind, m.fix])).toEqual([["scar", "enlarge-nick"]]);
    expect(decision(s, "upsizing-not-forced")).toBeUndefined();
  });

  it("a poorly prepared track: exchange through a dilator to a stiff 0.035 inch wire also lets the sheath in, and a stiff wire chosen first removes it", () => {
    const p = open("fem-poor-track");
    upsizeToWire(p);
    expect(p.insertSheath("6")).toBe(false);
    expect(p.exchangeToStiffWire()).toBe(true);
    p.runPending();
    expect(p.insertSheath("6")).toBe(true);
    expect(p.upsizing.met.map((m) => [m.kind, m.fix])).toEqual([["poor-track", "exchange-stiff-wire"]]);
    expect(decision(p, "upsizing-not-forced")).toBeUndefined();

    const st = freshUpsizing(["poor-track"]);
    needleOut(st);
    insertMicroDilator(st);
    removeInnerDilator(st);
    insertWire035(st, "stiff");
    removeDilator(st);
    expect(insertSheath(st, 10).ok).toBe(true);
    expect(st.met).toEqual([]);
  });

  it("a kinking wire is felt on the wire too: wire-resistance is raised beside dilator-resistance", () => {
    const w = open("fem-wire-kinks");
    upsizeToWire(w);
    expect(w.activeEvents()).not.toContain("wire-resistance");
    expect(w.insertSheath("6")).toBe(false);
    expect(w.activeEvents()).toContain("dilator-resistance");
    expect(w.activeEvents()).toContain("wire-resistance");
  });

  it("a subintimal sheath stops the wire at its tip: no catheter goes through it, and the attending does not name it", () => {
    const s = open("fem-subintimal-sheath");
    upsizeToWire(s);
    expect(s.insertSheath("6")).toBe(true);
    s.runPending();
    s.aspirateSheath();
    s.runPending();
    s.flushSheathSide("fresh");
    s.runPending();
    s.prepCatheter("JR4");
    s.runPending();
    expect(s.loadCatheter("JR4")).toBe(false);
    expect(s.activeEvents()).toContain("wire-resistance");
    expect(s.catheter?.inBody ?? false).toBe(false);
    expect(s.wireInBody).toBe(false);
    expect(s.attending.some((a) => /subintimal/i.test(a.text))).toBe(false);
  });

  it("an angiogram taken without a stated view (another screen) is not scored on a view left from before", () => {
    const s = open("fem-angio-high");
    s.laoDeg = 0;
    expect(s.femoralAngiogram({ ml: 8 })).not.toBeNull();
    s.runPending();
    expect(decision(s, "femoral-angio-technique")).toBeUndefined();
    expect(s.activeSite.femoralAngio).not.toBeNull();
  });
});

describe("in-app verification fixes", () => {
  it("aspirating alone logs the blood without claiming a flush; the one-step flush still says flushed", () => {
    const s = open("radial-sheath-prep");
    const n = s.log.length;
    expect(s.aspirateSheath()).toBe(true);
    s.runPending();
    const after = s.log.slice(n).map((l) => l.text);
    expect(after.some((t) => /aspirated/.test(t))).toBe(true);
    expect(after.some((t) => /flushed/.test(t))).toBe(false);
    const t = open("radial-sheath-prep");
    const m = t.log.length;
    t.flushSheath();
    t.runPending();
    expect(t.log.slice(m).some((l) => /sheath flushed/.test(l.text))).toBe(true);
  });

  it("a damped side arm reads as numbers; the words 'damped, no arterial waveform' only in guided mode; the reading is kept on the sheath", () => {
    for (const mode of ["guided", "supervised"] as const) {
      const s = open("fem-subintimal-sheath", mode);
      upsizeToWire(s);
      expect(s.insertSheath("6")).toBe(true);
      s.runPending();
      const r = s.transduceSheath()!;
      expect(r.trace).toBe("damped");
      expect(r.displayed).toMatch(/^\d+\/\d+ mmHg/);
      if (mode === "guided") expect(r.displayed).toMatch(/damped, no arterial waveform/);
      else expect(r.displayed).not.toMatch(/damped|waveform|flat/i);
      expect(s.sheath!.waveform).toBe("damped");
      expect(s.sheath!.waveformText).toBe(r.displayed);
      // the reading is low against the patient's arterial diastolic pressure (MP_UPSIZING.dampedReadingOfDia)
      const [sys] = r.displayed.split("/").map((x) => parseInt(x, 10));
      expect(sys).toBeLessThan(s.patient.vitals().aortaTrue.dia);
    }
  });

  it("an angiogram after a damped side arm records the waveform as damped, not as unchecked", () => {
    const s = open("fem-subintimal-sheath");
    upsizeToWire(s);
    s.insertSheath("6");
    s.runPending();
    s.transduceSheath();
    s.runPending();
    s.femoralAngiogram({ ml: 8, laoDeg: -25, magnified: false });
    s.runPending();
    const d = decision(s, "femoral-angio-technique");
    expect(d).toBeDefined();
    expect(d!.correct).toBe(false);
    expect(d!.given).toMatch(/waveform damped, not arterial/);
    expect(d!.given).not.toMatch(/not checked/);
  });
});
