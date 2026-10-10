// access-closure-radial: the flat-needle and gripped-sheath closure scenarios, the late radial problems at
// follow-up, and the scenarios' launch metadata (src/simulation/session/scenarios/closureRadial.ts). Split from
// radialClosure.test.ts so each file runs within the machine's time limit.
import { describe, it, expect } from "vitest";
import { MP_BAND_POSITION, RADIAL_LATE, bandPressure, gradeRadialLate } from "./closure";
import { newCaseSession, type CaseSession } from "../session/caseSession";
import { practiceForLesson } from "../../ui/content/practiceIndex";
import { launch } from "../session/scenarios/closureRadial.launch";
import { scenarios } from "../session/scenarios/closureRadial";

const open = (id: string) => newCaseSession({ scenario: id }).session;
const decision = (s: CaseSession, id: string) => s.decisions().find((d) => d.id === id);

/** The volume (mL, in 0.5 mL steps) that keeps the hole dry under a centred band without occluding the artery, or null. */
function patentVolume(s: CaseSession): number | null {
  const th = s.bandThresholds();
  for (let ml = 4; ml <= 20; ml += 0.5) {
    const p = bandPressure(ml);
    if (p >= th.bleedMmHg && p < th.occludeMmHg) return ml;
  }
  return null;
}

/** Step 2 then 3: the vasodilator through the side arm mixed with blood, then the band at `centreX` (default over the hole). */
function vasodilatorThenBand(s: CaseSession, ml: number, centreX?: number): void {
  expect(s.sideArmVasodilator("verapamil")).toBe(true);
  s.runPending();
  s.applyBand(ml, centreX);
  s.runPending();
}

describe("closure-radial-flat-needle", () => {
  it("the hole lies well above the skin nick: a band centred on the nick bleeds into the forearm, one over the hole does not", () => {
    const s = open("closure-radial-flat-needle");
    const g = s.radialPunctureGeometry()!;
    expect(g.holeX - g.skinX).toBeGreaterThan(10);
    const ml = patentVolume(s)!;
    vasodilatorThenBand(s, ml, g.skinX);
    expect(s.pullRadialSheath()).toBe("out");
    expect(s.bandNow()!.bleedSite).toBe("forearm");
    // moving the band over the hole stops it
    expect(s.setBandPosition(g.holeX)).toBe(true);
    s.runPending();
    expect(s.bandNow()!.bleeding).toBe(false);
    // the placement at the pull is what is scored
    expect(decision(s, "radial-band-position")?.correct).toBe(false);
  });
});

describe("closure-radial-spasm-grip", () => {
  it("opens with the band on and the sheath gripped after the registrar's pull, with no decision of the team's", () => {
    const s = open("closure-radial-spasm-grip");
    expect(s.radial).not.toBeNull();
    expect(s.radial!.sheathOut).toBe(false);
    expect(s.radial!.gripped).toBe(true);
    expect(s.sheathGrippedNow()).toBe(true);
    expect(s.activeEvents()).toContain("radial-spasm");
    expect(s.decisions()).toHaveLength(0);
  });

  it("forced removal is critical and schedules a forearm haematoma", () => {
    const s = open("closure-radial-spasm-grip");
    const before = s.criticalErrors;
    expect(s.forceRadialSheath()).toBe("avulsed");
    expect(s.criticalErrors).toBe(before + 1);
    expect(s.complications.some((c) => c.id === "radial-avulsion" && c.critical)).toBe(true);
    expect(decision(s, "radial-sheath-traction")?.correct).toBe(false);
    // the forearm swells at once, where the operator can inspect it at the closure
    expect(s.radial!.forearmMl ?? 0).toBeGreaterThanOrEqual(MP_BAND_POSITION.visibleSwellingMl);
    expect(s.activeEvents()).toContain("haematoma");
    s.finishRadialClosure(2);
    const h = s.delayed.find((d) => d.kind === "forearm-haematoma" && d.severity === "major");
    expect(h).toBeDefined();
    // it presents within minutes, graded
    s.observe(15);
    s.runPending();
    expect(s.presented).toContain(h);
    expect(s.complications.some((c) => c.id === "forearm-haematoma")).toBe(true);
  });

  it("the cuff and vasodilator path does not: the sheath slides out without traction", () => {
    const s = open("closure-radial-spasm-grip");
    expect(s.pullRadialSheath()).toBe("gripped");
    expect(s.sideArmVasodilator("verapamil")).toBe(true);
    s.runPending();
    expect(s.order("midazolam", 1)).not.toBeNull();
    s.runPending();
    expect(s.warmForearm()).toBe(true);
    s.runPending();
    expect(s.upperArmCuff()).toBe(true);
    s.runPending();
    expect(s.sheathGrippedNow()).toBe(false);
    expect(s.pullRadialSheath()).toBe("out");
    expect(s.complications.some((c) => c.critical)).toBe(false);
    expect(decision(s, "radial-sheath-traction")?.correct).toBe(true);
    s.finishRadialClosure(2);
    expect(s.delayed.some((d) => d.kind === "forearm-haematoma" && d.severity === "major")).toBe(false);
    // a gripped sheath counts as spasm in the occlusion risk
    expect(s.raoFactors(2).spasm).toBe(true);
  });
});

describe("closure-radial-proximal-haematoma", () => {
  it("opens with the sheath out, the band distal to the hole and the forearm swelling above it; moving the band over the hole, or a second band, stops the bleed", () => {
    const s = open("closure-radial-proximal-haematoma");
    expect(s.decisions()).toHaveLength(0);
    const r = s.radial!;
    expect(r.sheathOut).toBe(true);
    expect(r.forearmMl ?? 0).toBeGreaterThanOrEqual(MP_BAND_POSITION.visibleSwellingMl);
    expect(s.bandNow()!.bleedSite).toBe("forearm");
    expect(s.activeEvents()).toContain("haematoma");

    expect(s.addSecondBand()).toBe(true);
    s.runPending();
    expect(s.bandNow()!.bleeding).toBe(false);

    const moved = open("closure-radial-proximal-haematoma");
    expect(moved.setBandPosition(moved.radialPunctureGeometry()!.holeX)).toBe(true);
    moved.runPending();
    expect(moved.bandNow()!.bleeding).toBe(false);
  });
});

describe("late radial problems at follow-up", () => {
  it("each vignette opens closed with what the patient shows, and is scored on the diagnosis and the plan", () => {
    for (const [id, kind] of [
      ["radial-late-psa", "radial-pseudoaneurysm"],
      ["radial-late-granuloma", "sterile-granuloma"],
    ] as const) {
      const s = open(id);
      expect(s.closureDone()).toBe(true);
      expect(s.radialLate?.kind).toBe(kind);
      expect(s.log.some((l) => l.text === RADIAL_LATE[kind].presentation)).toBe(true);
      // nothing named before the assessment
      expect(s.complications.some((c) => c.id === "radial-pseudoaneurysm" || c.id === "sterile-granuloma")).toBe(false);
      const t = RADIAL_LATE[kind];
      expect(s.assessRadialLate(t.dx, t.plan)).toEqual({ dxCorrect: true, planCorrect: true });
      expect(decision(s, "radial-late-assessment")?.correct).toBe(true);
      expect(s.assessRadialLate(t.dx, t.plan)).toBeNull();
    }
    // the granuloma taken for an infection is wrong, as the module's check question says
    expect(gradeRadialLate("sterile-granuloma", "infection", "antibiotics-debride").dxCorrect).toBe(false);
    expect(gradeRadialLate("radial-pseudoaneurysm", "pseudoaneurysm", "wait-steroid-excise").planCorrect).toBe(false);
  });
});

describe("late radial problems: the screen and the course the patient comes back from", () => {
  it("each vignette opens on the closure workspace (where the follow-up form is) after an uneventful course", () => {
    for (const id of ["radial-late-psa", "radial-late-granuloma"]) {
      const sc = scenarios.find((x) => x.id === id)!;
      // 'closure' opens the closure workspace (WORKSPACE_FOR_START, src/state/useProcedureStore.ts)
      expect(sc.start, id).toBe("closure");
      const s = open(id);
      expect(s.radial?.bandOffAt, id).not.toBeNull();
      // nothing from the case competes with the late problem
      expect(s.presented, id).toEqual([]);
      expect(s.delayed, id).toEqual([]);
      expect(s.radialOccluded, id).toBe(false);
      expect(s.complications.some((c) => c.id === "radial-occlusion" || c.id === "forearm-haematoma"), id).toBe(false);
      expect(s.activeEvents(), id).not.toContain("haematoma");
      expect(s.activeEvents(), id).not.toContain("bleeding");
      expect(s.log.some((l) => /radial artery occlusion|swelling/i.test(l.text) && l.text !== RADIAL_LATE[id === "radial-late-psa" ? "radial-pseudoaneurysm" : "sterile-granuloma"].presentation), id).toBe(false);
      // the vignette is the latest line, and the band came off once (the closure is not finished twice)
      expect(s.log[s.log.length - 1].kind).toBe("nurse");
      expect(s.log.filter((l) => l.text.startsWith("Haemostasis achieved")).length, id).toBe(1);
    }
  });
});

describe("radial closure scenarios: the hand-over line", () => {
  it("is logged after the team's work, so it is the latest line when the closure screen opens", () => {
    for (const [id, text] of [
      ["closure-radial-flat-needle", "needle held almost flat"],
      ["closure-radial-spasm-grip", "it would not come"],
    ] as const) {
      const s = open(id);
      const last = s.log[s.log.length - 1];
      expect(last.kind, id).toBe("attending");
      expect(last.text, id).toContain(text);
      // and the attending's caption on the closure screen
      if (s.mode !== "exam") expect(s.attending[s.attending.length - 1]?.text, id).toBe(last.text);
    }
  });
});

describe("radial closure scenarios: launch metadata and the practice index", () => {
  it("practiceIndex lists the scenarios closure-radial-7fr-act320-gpi, closure-radial-flat-needle, closure-radial-spasm-grip under lessons pm-closure-radial, pm-engaging-spasm, cm-access-complications-radial-other (from src/simulation/session/scenarios/closureRadial.launch.ts)", () => {
    for (const l of ["pm-closure-radial", "pm-engaging-spasm", "cm-access-complications-radial-other"])
      for (const id of ["closure-radial-7fr-act320-gpi", "closure-radial-flat-needle", "closure-radial-spasm-grip"]) expect(practiceForLesson(l).some((e) => e.sim === "procedure" && e.scenario === id), `${id} under ${l}`).toBe(true);
    for (const id of ["radial-late-psa", "radial-late-granuloma"]) expect(practiceForLesson("cm-access-complications-radial-other").some((e) => e.scenario === id), id).toBe(true);
  });

  it("the launch file and the scenario file list the same six scenarios, with the same titles, lessons and starts", () => {
    const fromLaunch = (launch.scenarios ?? []).map((x) => ({ id: x.id, title: x.title, lessonIds: x.lessonIds, start: (x.starts?.[0] as { id: string }).id }));
    expect(fromLaunch).toEqual(scenarios.map((x) => ({ id: x.id, title: x.title, lessonIds: x.lessonIds, start: x.start })));
    expect(scenarios).toHaveLength(6);
    for (const sc of launch.scenarios ?? []) for (const l of sc.lessonIds) expect(practiceForLesson(l).some((e) => e.scenario === sc.id), `${sc.id} under ${l}`).toBe(true);
  });
});
