// The structural lab's tip context (structural-tips-and-tavi-course): steps to phases and procedures
// in TAVI, TEER and LAAO, the TAVI course's events, and the raises export.
//   npx vitest run src/ui/lab/structuralTips.test.ts
import { describe, expect, it } from "vitest";
import { LAB_EVENTS, LAB_PHASES, LAB_PROCEDURES, LAB_TIPS, tipsFor, type LabContext } from "../../content/lab/tips";
import { COURSE_RESPONSE, TAVI_SCENARIOS, assessTavi, courseAt, courseRng, taviCourse, type CourseActions, type TaviPlan } from "../../simulation/tavi";
import { PATIENT_EVENT_THRESHOLDS } from "./patientEvents";
import {
  LAAO_STEPS,
  attributeCourseEvents,
  TAVI_COURSE_EVENTS,
  TAVI_PHASE,
  TAVI_STEPS,
  TEER_STEPS,
  laaoTipContext,
  raises,
  taviCourseEvents,
  taviTipContext,
  teerTipContext,
} from "./structuralTips";

const ALL = 200;
const plan = (over: Partial<TaviPlan> = {}): TaviPlan => ({
  access: "transfemoral",
  platform: "balloon-expandable",
  sizeMm: 26,
  targetDepthMm: 3,
  finalDepthMm: 3,
  predilatation: false,
  postDilatation: false,
  rapidPacing: true,
  coronaryProtection: false,
  ...over,
});
const procOf = (id: string) => LAB_TIPS.find((t) => t.id === id)!.when.procedure ?? [];

describe("TAVI steps", () => {
  it("at each TAVI step only structural-tavi-* tips for that step return; no TEER or LAAO tip appears in TAVI", () => {
    for (const step of TAVI_STEPS) {
      const ctx = taviTipContext({ step });
      if (step === "debrief") {
        expect(ctx).toBeNull();
        continue;
      }
      expect(ctx).toMatchObject({ lab: "structural", phase: step, procedures: ["tavi"] });
      const ids = tipsFor(ctx!, ALL).map((t) => t.id);
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) {
        // structural-tavr-plan-reaccess is the complex-PCI module's TAVI tip (its id says tavr)
        expect(id).toMatch(/^structural-tav(i|r)-/);
        expect(procOf(id)).toContain("tavi");
        expect(LAB_TIPS.find((t) => t.id === id)!.when.phase).toContain(TAVI_PHASE[step]);
      }
      expect(ids.some((id) => /^structural-(teer|tteer|laao|ts)-/.test(id))).toBe(false);
    }
  });

  it("each TAVI tip appears at its own phase and at no other step (hb-tavi#0)", () => {
    const tavi = LAB_TIPS.filter((t) => t.lab === "structural" && t.when.procedure?.includes("tavi") && !t.when.event?.length);
    expect(tavi.length).toBeGreaterThan(10);
    for (const t of tavi)
      for (const step of TAVI_STEPS) {
        const ctx = taviTipContext({ step });
        const shown = !!ctx && tipsFor(ctx, ALL).some((x) => x.id === t.id);
        expect(shown, `${t.id} at ${step}`).toBe(!!ctx && t.when.phase!.includes(ctx.phase!));
      }
    // the pacing route is chosen before venous access; the wire decision belongs to the assessment
    expect(tipsFor(taviTipContext({ step: "plan" })!, ALL).map((t) => t.id)).toContain("structural-tavi-lv-wire-pacing");
    expect(tipsFor(taviTipContext({ step: "access" })!, ALL).map((t) => t.id)).toContain("structural-tavi-lv-wire-pacing");
    expect(tipsFor(taviTipContext({ step: "assess" })!, ALL).map((t) => t.id)).toContain("structural-tavi-pacing-wire-decision");
  });

  it("no tip of another procedure that shares the structural phases appears in TAVI, TEER or LAAO (hb-additional-procedures#8)", () => {
    const own: Record<string, string[]> = { tavi: ["tavi"], teer: ["teer", "transseptal"], laao: ["laao", "transseptal"] };
    const ctxs: [string, LabContext | null][] = [
      ...TAVI_STEPS.map((s) => ["tavi", taviTipContext({ step: s })] as [string, LabContext | null]),
      ...TEER_STEPS.map((s) => ["teer", teerTipContext({ step: s })] as [string, LabContext | null]),
      ...LAAO_STEPS.map((s) => ["laao", laaoTipContext({ step: s })] as [string, LabContext | null]),
    ];
    for (const [lab, ctx] of ctxs) {
      if (!ctx) continue;
      for (const t of tipsFor(ctx, ALL)) expect(procOf(t.id).some((p) => own[lab].includes(p)), `${t.id} in ${lab}`).toBe(true);
      const ids = tipsFor(ctx, ALL).map((t) => t.id);
      for (const id of ["structural-bav-rapid-pacing", "structural-pmc-stepwise-stop", "structural-septal-occluder-release-check"]) expect(ids).not.toContain(id);
    }
  });
});

describe("TEER and LAAO steps", () => {
  it("TEER: plan, transseptal as access with ['teer','transseptal'], steer as position, grasp as deploy, assess", () => {
    expect(teerTipContext({ step: "plan" })).toMatchObject({ phase: "plan", procedures: ["teer"] });
    expect(teerTipContext({ step: "transseptal" })!.procedures).toEqual(["teer", "transseptal"]);
    expect(teerTipContext({ step: "transseptal" })!.phase).toBe("access");
    expect(teerTipContext({ step: "steer" })!.phase).toBe("position");
    expect(teerTipContext({ step: "grasp" })!.phase).toBe("deploy");
    expect(teerTipContext({ step: "assess" })!.phase).toBe("assess");
    expect(teerTipContext({ step: "debrief" })).toBeNull();
    const ts = tipsFor(teerTipContext({ step: "transseptal" })!, ALL).map((t) => t.id);
    expect(ts).toEqual(expect.arrayContaining(["structural-ts-both-groins-low", "structural-ts-four-confirmations", "structural-teer-height-coaptation"]));
    expect(tipsFor(teerTipContext({ step: "steer" })!, ALL).map((t) => t.id)).toEqual(expect.arrayContaining(["structural-teer-steer-views", "structural-teer-gantry-arms"]));
    // transseptal tips stay out of the TEER steps that are not the puncture
    for (const step of ["plan", "steer", "grasp", "assess"] as const) expect(tipsFor(teerTipContext({ step })!, ALL).some((t) => t.id.startsWith("structural-ts-"))).toBe(false);
  });

  it("LAAO: measure and size as plan, transseptal as access with ['laao','transseptal'], deploy (position until unsheathed), pass as assess", () => {
    expect(laaoTipContext({ step: "measure" })).toMatchObject({ phase: "plan", procedures: ["laao"] });
    expect(laaoTipContext({ step: "size" })!.phase).toBe("plan");
    expect(laaoTipContext({ step: "transseptal" })).toMatchObject({ phase: "access", procedures: ["laao", "transseptal"] });
    expect(laaoTipContext({ step: "deploy" })).toMatchObject({ phase: "deploy", phases: ["position"] });
    expect(laaoTipContext({ step: "deploy", unsheathed: true })!.phases).toBeUndefined();
    expect(laaoTipContext({ step: "pass" })!.phase).toBe("assess");
    expect(tipsFor(laaoTipContext({ step: "deploy" })!, ALL).map((t) => t.id)).toContain("structural-laao-pigtail-leads");
    expect(tipsFor(laaoTipContext({ step: "deploy", unsheathed: true })!, ALL).map((t) => t.id)).not.toContain("structural-laao-pigtail-leads");
    expect(tipsFor(laaoTipContext({ step: "pass" })!, ALL).map((t) => t.id)).toEqual(expect.arrayContaining(["structural-laao-plug-pass", "structural-laao-disc-criteria"]));
  });
});

describe("the TAVI course's events", () => {
  const PLANS = [plan(), plan({ platform: "self-expanding", sizeMm: 29, rapidPacing: false }), plan({ sizeMm: 29, finalDepthMm: 6, targetDepthMm: 6 }), plan({ sizeMm: 20, finalDepthMm: 0 })];
  const ACTIONS: CourseActions[] = [{}, { rootInjectionS: 20, rescueS: 30 }, { rootInjectionS: 190, rescueS: 200, pacingS: 60 }];

  it("structural-tavi-hypotension-coronary returns only while taviCourse reports MAP below 65 after pacing", () => {
    let shownSomewhere = 0;
    for (const s of TAVI_SCENARIOS)
      for (const p of [...PLANS, ...(s.deployed ? [s.deployed] : [])])
        for (const actions of ACTIONS) {
          const course = taviCourse(s, p, assessTavi(s, p), courseRng(s.id), actions);
          for (let t = 0; t <= course.durationS; t += 2) {
            const ids = tipsFor(taviTipContext({ step: "assess", course, courseT: t })!, ALL).map((x) => x.id);
            const smp = courseAt(course, t);
            if (ids.includes("structural-tavi-hypotension-coronary")) {
              shownSomewhere++;
              expect(t >= course.pacingEndS && smp.map < PATIENT_EVENT_THRESHOLDS.hypotensionMapMmHg, `${s.id} at ${t} s, MAP ${smp.map.toFixed(1)}`).toBe(true);
            }
          }
        }
    expect(shownSomewhere).toBeGreaterThan(0);
  });

  it("obstruction raises hypotension (after the shared hold) and st-elevation; reflow clears them", () => {
    const s = TAVI_SCENARIOS.find((x) => x.id === "tavi-coronary-obstruction")!;
    const course = taviCourse(s, s.deployed!, assessTavi(s, s.deployed!), courseRng(s.id), { rootInjectionS: 20, rescueS: 30 });
    expect(taviCourseEvents(course, 2)).toEqual([]); // rapid pacing
    expect(taviCourseEvents(course, course.pacingEndS + PATIENT_EVENT_THRESHOLDS.hypotensionHoldS - 2)).not.toContain("hypotension");
    expect(taviCourseEvents(course, 40)).toEqual(expect.arrayContaining(["hypotension", "st-elevation"]));
    expect(taviTipContext({ step: "assess", course, courseT: 40 })!.phases).toEqual(["complication"]);
    expect(taviCourseEvents(course, course.reflowS! + 60)).toEqual([]);
    // the course is read only at the assess step
    expect(taviTipContext({ step: "deploy", course, courseT: 40 })!.events).toEqual([]);
  });

  it("complete heart block raises av-block and bradycardia", () => {
    const s = TAVI_SCENARIOS.find((x) => x.id === "tavi-conduction")!;
    const p = plan({ sizeMm: 29, finalDepthMm: 6, targetDepthMm: 6 });
    const course = taviCourse(s, p, assessTavi(s, p), courseRng(s.id));
    expect(taviCourseEvents(course, course.chbS! + 5)).toEqual(expect.arrayContaining(["av-block", "bradycardia"]));
  });

  it("in unpaced complete heart block the pacing tip leads; once paced, a low pressure brings the coronary tip back", () => {
    const s = TAVI_SCENARIOS.find((x) => x.id === "tavi-conduction")!;
    const p = plan({ sizeMm: 29, finalDepthMm: 6, targetDepthMm: 6 });
    const course = taviCourse(s, p, assessTavi(s, p), courseRng(s.id));
    let blockLow = 0;
    for (let t = course.chbS!; t <= course.durationS; t += 2) {
      const raw = taviCourseEvents(course, t);
      if (!raw.includes("av-block")) continue;
      if (raw.includes("hypotension")) blockLow++;
      const ctx = taviTipContext({ step: "assess", course, courseT: t })!;
      expect(ctx.events).not.toContain("hypotension");
      expect(tipsFor(ctx, 20)[0].id, `t ${t} s`).toBe("structural-tavi-pacing-wire-decision");
    }
    expect(blockLow).toBeGreaterThan(0); // the block does lower the pressure below the threshold
    // the rule reads only what the monitor shows: ST elevation keeps hypotension, pacing ends the block
    expect(attributeCourseEvents(["av-block", "bradycardia", "hypotension", "st-elevation"])).toContain("hypotension");
    expect(attributeCourseEvents(["hypotension"])).toEqual(["hypotension"]);
    expect(attributeCourseEvents(["av-block", "bradycardia", "hypotension"])).toEqual(["av-block", "bradycardia"]);
  });

  it("the course scoring's low-pressure rule matches the shared hypotension event", () => {
    expect(COURSE_RESPONSE.lowMapMmHg).toBe(PATIENT_EVENT_THRESHOLDS.hypotensionMapMmHg);
    expect(COURSE_RESPONSE.lowMapHoldS).toBe(PATIENT_EVENT_THRESHOLDS.hypotensionHoldS);
  });

  it("an uncomplicated release raises nothing", () => {
    const s = TAVI_SCENARIOS[0];
    const course = taviCourse(s, plan(), assessTavi(s, plan()), courseRng(s.id));
    for (let t = 0; t <= course.durationS; t += 5) expect(taviCourseEvents(course, t)).toEqual([]);
  });
});

describe("raises", () => {
  it("uses the shared vocabulary and declares the procedures, phases and course events", () => {
    expect(raises.lab).toBe("structural");
    for (const p of raises.phases) expect(LAB_PHASES.structural as readonly string[]).toContain(p);
    for (const e of raises.events) expect(LAB_EVENTS as readonly string[]).toContain(e);
    for (const p of raises.procedures ?? []) expect(LAB_PROCEDURES as readonly string[]).toContain(p);
    // the TAVI course's events, then those structural-transseptal-hands-on adds (low-act, air, tamponade)
    expect(raises.events.slice(0, TAVI_COURSE_EVENTS.length)).toEqual([...TAVI_COURSE_EVENTS]);
    expect(raises.procedures).toEqual(expect.arrayContaining(["tavi", "teer", "laao", "transseptal"]));
  });
});
