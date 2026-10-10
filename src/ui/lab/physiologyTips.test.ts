// The physiology lab's tips reached through its pressure-wire context (physiology-engine-unify-and-
// setup): the set-up tips of pm-physiology-setup appear in a named preset at the moment they apply,
// the waiting.ts entries naming this package become satisfiable from the lab's own raises export,
// and the practice index lists every preset under pm-physiology-setup.
//   npx vitest run src/ui/lab/physiologyTips.test.ts
import { describe, expect, it } from "vitest";
import * as tipsModule from "../../content/lab/tips";
import { LAB_EVENTS, LAB_PHASES, LAB_TIPS, TIP_BY_ID, tipsFor, type LabContext, type LabTip, type TipTrigger } from "../../content/lab/tips";
import { WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import { launch as coreLaunch } from "../../content/lab/presets/physiology/core.launch";
import { launch as hyperaemiaLaunch } from "../../content/lab/presets/physiology/hyperaemia.launch";
import { launch as leftMainLaunch } from "../../content/lab/presets/physiology/leftMain.launch";
import { PHYSIOLOGY_PRESETS, initialPwSession, pwSessionReducer, type PwAction, type PwSessionState } from "../../simulation/pci/pwSession";
import { PRACTICE_INDEX, practiceForCase, practiceForLesson } from "../content/practiceIndex";
import { selectTips } from "./useLabTips";
import { PHYSIOLOGY_ADENOSINE_EVENTS, PHYSIOLOGY_PATIENT_EVENTS, equalisedCleanly, physiologyStep, physiologyTipContext, rankPhysiologyTips, raises } from "./physiologyTips";
import { PATIENT_EVENTS } from "./patientEvents";

const play = (s: PwSessionState, ...as: PwAction[]) => as.reduce(pwSessionReducer, s);
const ids = (ctx: LabContext, n = 20) => tipsFor(ctx, n).map((t) => t.id);
const SETUP: PwAction[] = [{ type: "zero" }, { type: "introduce" }, { type: "remove-introducer" }, { type: "flush-guide" }];
/** The tips lesson pm-physiology-setup asks the lab to make reachable (lab request pm-physiology#1). */
const REQUEST_TIPS = ["pci-phys-zero-outside", "pci-phys-equalise-at-tip", "pci-phys-equalise-fail", "pci-phys-wire-wrong-branch", "pci-phys-cross-distal", "pci-mon-aortic-line-physiology"];

describe("the context the lab reports", () => {
  it("raises uses the shared vocabulary: the PCI lab at phase physiology", () => {
    expect(raises.lab).toBe("pci");
    expect(raises.phases).toEqual(["physiology"]);
    for (const p of raises.phases) expect((LAB_PHASES.pci as readonly string[]).includes(p)).toBe(true);
    for (const e of raises.events) expect((LAB_EVENTS as readonly string[]).includes(e), e).toBe(true);
    expect(raises.events).toEqual(expect.arrayContaining(["wire-side-branch", "pressure-damped", "hypotension", "bradycardia", "av-block"]));
    // only what the rig produces (PhysiologyLab.test.ts drives it there): no ischaemia or desaturation source in this lab, and no
    // arrhythmia beyond the adenosine hazard model's AF and VF (physiology-hyperaemia-and-adenosine; physiologyTips.hyperaemia.test.ts checks those)
    expect(PHYSIOLOGY_PATIENT_EVENTS).toEqual(["hypotension", "bradycardia", "av-block"]);
    for (const e of ["vf", "vt", "atrial-fibrillation", "st-elevation", "chest-pain", "desaturation"].filter((x) => !(PHYSIOLOGY_ADENOSINE_EVENTS as readonly string[]).includes(x)))
      expect(raises.events).not.toContain(e);
    for (const e of PHYSIOLOGY_PATIENT_EVENTS) expect((PATIENT_EVENTS as readonly string[]).includes(e), e).toBe(true);
    // a bubble in the aortic line is not air in the coronary circulation
    expect(raises.events).not.toContain("air");
  });

  it("phase physiology with the target vessel; the guide pressure is aortic on a clean set-up", () => {
    const s = play(initialPwSession("lad-intermediate"), ...SETUP);
    expect(physiologyTipContext(s)).toEqual({ lab: "pci", phase: "physiology", pressure: "aortic", events: [], vessel: "LAD" });
    expect(physiologyTipContext(initialPwSession("rca-negative")).vessel).toBe("RCA");
    expect(physiologyTipContext(initialPwSession("drift")).vessel).toBe("LCx");
  });

  it("air in the aortic line: pressure context 'damped' with the pressure-damped event, and the damped-guide tip", () => {
    const s = initialPwSession("fault-air-aortic");
    const ctx = physiologyTipContext(s);
    expect(ctx.pressure).toBe("damped");
    expect(ctx.events).toContain("pressure-damped");
    expect(ctx.events).not.toContain("air");
    expect(ids(ctx)).toContain("pci-phys-damped-guide");
    const flushed = physiologyTipContext(play(s, { type: "flush-aortic-line" }));
    expect(flushed.pressure).toBe("aortic");
    expect(ids(flushed)).not.toContain("pci-phys-damped-guide");
  });

  it("the deeply seated guide is damped while engaged (pci-phys-ostial-disengage, pci-phys-damped-guide) and not once disengaged", () => {
    const s = play(initialPwSession("guide-wedge"), ...SETUP);
    const ctx = physiologyTipContext(s);
    expect(["damped", "ventricularised", "wedged"]).toContain(ctx.pressure);
    expect(ids(ctx)).toEqual(expect.arrayContaining(["pci-phys-damped-guide", "pci-phys-ostial-disengage"]));
    expect(ids(physiologyTipContext(play(s, { type: "guide", engaged: false })))).not.toContain("pci-phys-damped-guide");
  });

  it("patient events from the engine's vitals: bradycardia brings the adenosine cough-and-wait tip", () => {
    const s = play(initialPwSession("rca-negative"), ...SETUP);
    const ctx = physiologyTipContext(s, { t: 10, hr: 38, rhythmKind: "sinus", av: 3 });
    expect(ctx.events).toEqual(expect.arrayContaining(["bradycardia", "av-block"]));
    expect(ids(ctx)).toContain("pci-adenosine-block-cough-wait");
    // the RCA dose tip by vessel
    expect(ids(ctx, 40)).toContain("pci-adenosine-rca-dose");
    // the adapter's own events (with its hold) replace the stateless reading when the lab passes them
    expect(physiologyTipContext(s, { t: 10, hr: 38, rhythmKind: "sinus" }, { patientEvents: [] }).events).toEqual([]);
  });
});

describe("named presets show their tips at the moment they apply (acceptance)", () => {
  it("in 'fault-ebu-lcx' (core.launch.ts), after the advance that raises 'wire-side-branch', tipsFor(ctx, 20) includes pci-phys-wire-wrong-branch; at phase physiology it includes pci-phys-zero-outside", () => {
    expect(coreLaunch.scenarios?.map((x) => x.id)).toContain("fault-ebu-lcx");
    const start = initialPwSession("fault-ebu-lcx");
    const atStart = physiologyTipContext(start);
    expect(atStart.phase).toBe("physiology");
    expect(ids(atStart)).toContain("pci-phys-zero-outside");
    expect(ids(atStart)).not.toContain("pci-phys-wire-wrong-branch");
    // zero, introduce and advance until the sensor is at the guide tip: the tip passes the left main and goes into the circumflex
    const s = play(start, ...SETUP, { type: "sensor", mm: 0 });
    expect(s.branch).toBe("side");
    const ctx = physiologyTipContext(s);
    expect(ctx.events).toContain("wire-side-branch");
    expect(ids(ctx, 20)).toContain("pci-phys-wire-wrong-branch");
    expect(ids(ctx, 20)).toContain("pci-phys-zero-outside");
    expect(tipsFor(ctx, 1)[0].id).toBe("pci-phys-wire-wrong-branch");
    // the event holds after the wire is pulled back, then lapses once the guide has been changed
    let fixed = play(s, { type: "change-guide" }, { type: "introduce" }, { type: "sensor", mm: 0 });
    expect(fixed.branch).toBe("target");
    for (let i = 0; i < 40; i++) fixed = pwSessionReducer(fixed, { type: "tick", dt: 1 });
    expect(physiologyTipContext(fixed).events).not.toContain("wire-side-branch");
  });

  it("every tip of the set-up request appears in its preset at phase physiology", () => {
    const shown = new Set<string>();
    for (const p of PHYSIOLOGY_PRESETS.filter((x) => x.id.startsWith("fault-"))) {
      let s = initialPwSession(p.id);
      for (const a of [...SETUP, { type: "sensor", mm: 0 } as PwAction]) {
        s = pwSessionReducer(s, a);
        for (const id of ids(physiologyTipContext(s), 40)) shown.add(id);
      }
    }
    expect(REQUEST_TIPS.filter((id) => !shown.has(id))).toEqual([]);
  });

  it("the panel's order follows the study: set-up tips first while setting up, pullback tips after measuring", () => {
    // the guide holds contrast after the angiogram (a damped trace: the damped-guide tips lead); flushed, the set-up tips lead
    const s0 = play(initialPwSession("lad-intermediate"), { type: "flush-guide" });
    expect(physiologyStep(s0)).toBe("setup");
    const ctx0 = physiologyTipContext(s0);
    expect(ctx0.pressure).toBe("aortic");
    const top = rankPhysiologyTips(tipsModule, tipsFor(ctx0, 60), ctx0, s0, 5);
    expect(top.every((t) => ["pm-physiology-setup", "pm-monitoring-transducers"].includes(t.lessonId)), top.map((t) => t.id).join(", ")).toBe(true);
    let m = play(s0, ...SETUP, { type: "sensor", mm: 0 }, { type: "equalise" }, { type: "sensor", mm: 100 }, { type: "measure-rest" });
    expect(physiologyStep(m)).toBe("pullback");
    m = play(m, { type: "sensor", mm: 0 });
    const ctx1 = physiologyTipContext(m);
    expect(rankPhysiologyTips(tipsModule, tipsFor(ctx1, 60), ctx1, m, 5).map((t) => t.id)).toContain("pci-phys-drift-check");
    // an event tip still comes first
    const side = play(initialPwSession("fault-ebu-lcx"), ...SETUP, { type: "sensor", mm: 0 });
    const ctx2 = physiologyTipContext(side);
    expect(rankPhysiologyTips(tipsModule, tipsFor(ctx2, 60), ctx2, side, 5)[0].id).toBe("pci-phys-wire-wrong-branch");
  });

  it("once the wire in use has equalised cleanly, the will-not-equalise bail-out goes to the end of the panel", () => {
    const pre = play(initialPwSession("lad-intermediate"), ...SETUP, { type: "sensor", mm: 0 });
    const ctxPre = physiologyTipContext(pre);
    expect(equalisedCleanly(pre)).toBe(false);
    const before = rankPhysiologyTips(tipsModule, tipsFor(ctxPre, 60), ctxPre, pre, 60).map((t) => t.id);
    const eq = play(pre, { type: "equalise" });
    expect(eq.eq?.atTip && !eq.eq.mismatch).toBe(true);
    expect(equalisedCleanly(eq)).toBe(true);
    const ctx = physiologyTipContext(eq);
    const ranked = rankPhysiologyTips(tipsModule, tipsFor(ctx, 60), ctx, eq, 60).map((t) => t.id);
    if (before.includes("pci-phys-equalise-fail")) {
      expect(ranked).toContain("pci-phys-equalise-fail");
      expect(ranked[ranked.length - 1]).toBe("pci-phys-equalise-fail");
    }
    expect(ranked.slice(0, 5)).not.toContain("pci-phys-equalise-fail");
    // a new wire has not been equalised: the bail-out is back in play
    const fresh = play(eq, { type: "new-wire" });
    expect(equalisedCleanly(fresh)).toBe(false);
  });

  it("a damped trace from contrast in the guide (mid-LAD lesion) does not bring the aorto-ostial advice; a guide that obstructs the ostium does", () => {
    const lad = initialPwSession("lad-intermediate");
    const ctx = physiologyTipContext(lad);
    expect(ctx.pressure).toBe("damped");
    // the tip matches the context, but the panel puts it last
    expect(ids(ctx, 60)).toContain("pci-phys-ostial-disengage");
    const ranked = rankPhysiologyTips(tipsModule, tipsFor(ctx, 60), ctx, lad, 60).map((t) => t.id);
    expect(ranked.slice(0, 5)).not.toContain("pci-phys-ostial-disengage");
    expect(ranked[ranked.length - 1]).toBe("pci-phys-ostial-disengage");
    expect(ranked.slice(0, 5)).toContain("pci-phys-damped-guide");
    const wedge = play(initialPwSession("guide-wedge"), ...SETUP);
    const wctx = physiologyTipContext(wedge);
    expect(rankPhysiologyTips(tipsModule, tipsFor(wctx, 60), wctx, wedge, 5).map((t) => t.id)).toContain("pci-phys-ostial-disengage");
  });

  it("the run's policy decides visibility: guided shows them, exams show none, supervised only after asking", () => {
    const ctx = physiologyTipContext(initialPwSession("fault-no-zero"));
    const sel = (mode: "guided" | "supervised" | "exam", helpAskedAt: number | null) => selectTips(tipsModule, ctx, { mode, helpAskedAt }, 20).map((t) => t.id);
    expect(sel("guided", null)).toContain("pci-phys-zero-outside");
    expect(sel("exam", 0)).toEqual([]);
    expect(sel("supervised", null)).toEqual([]);
    expect(sel("supervised", 3)).toContain("pci-phys-zero-outside");
  });
});

// --- reachability from the lab's own raises (the rule of src/content/lab/reachability.test.ts) ---

function satisfiableIn(when: TipTrigger, phases: readonly string[] | undefined, rs: readonly LabRaises[]): boolean {
  const has = (key: "phases" | "events" | "routes" | "procedures" | "techniques" | "imaging", x: string) => rs.some((r) => ((r[key] ?? []) as readonly string[]).includes(x));
  const any = (want: readonly string[] | undefined, key: Parameters<typeof has>[0]) => !want?.length || want.some((x) => has(key, x));
  return any(phases, "phases") && any(when.event, "events") && (when.requires ?? []).every((e) => has("events", e)) && any(when.procedure, "procedures") && any(when.route, "routes") && any(when.technique, "techniques") && any(when.imaging, "imaging");
}
const satisfiableInPci = (tip: LabTip, rs: readonly LabRaises[]) =>
  tip.lab === "pci" ? satisfiableIn(tip.when, tip.when.phase, rs) : !!tip.alsoIn?.some((a) => a.lab === "pci" && satisfiableIn(tip.when, a.phase, rs));

describe("reachability of the pressure-wire tips from the lab's raises (acceptance)", () => {
  it("every waiting.ts entry naming physiology-engine-unify-and-setup becomes satisfiable, so the pci waiting count falls by at least their number", () => {
    const mine = WAITING_TIPS.filter((w) => w.raisedBy === "physiology-engine-unify-and-setup").flatMap((w) => w.tips);
    const missing = mine.filter((id) => TIP_BY_ID[id] && !satisfiableInPci(TIP_BY_ID[id], [raises]));
    expect(missing).toEqual([]);
    const pciWaiting = WAITING_TIPS.filter((w) => w.lab === "pci").flatMap((w) => w.tips);
    const stillWaiting = (rs: readonly LabRaises[]) => pciWaiting.filter((id) => TIP_BY_ID[id] && !satisfiableInPci(TIP_BY_ID[id], rs)).length;
    const before = stillWaiting([]);
    const after = stillWaiting([raises]);
    console.info(`pci tips still waiting: ${before} -> ${after} with the physiology lab's raises (of ${pciWaiting.length} listed)`);
    expect(before - after).toBeGreaterThanOrEqual(mine.filter((id) => TIP_BY_ID[id]).length);
    // no entry names this package today: the set-up tips wait under pci-tip-context, and this lab makes them satisfiable
    const request = REQUEST_TIPS.filter((id) => pciWaiting.includes(id));
    expect(request.length).toBe(REQUEST_TIPS.length);
    expect(request.filter((id) => !satisfiableInPci(TIP_BY_ID[id], [raises]))).toEqual([]);
    expect(before - after).toBeGreaterThanOrEqual(REQUEST_TIPS.length);
  });

  it("every pressure-wire tip (pci-phys-*) except the acetylcholine ones is satisfiable from this lab", () => {
    const phys = LAB_TIPS.filter((t) => t.id.startsWith("pci-phys-") && !t.id.startsWith("pci-phys-ach-"));
    expect(phys.length).toBeGreaterThan(15);
    // the jailed side branch needs side-branch-compromise: the PCI lab raises it after stenting, and this lab's jailed
    // circumflex presets (physiology-left-main-and-ostial, lm-jailed-lcx-075 and -085) declare it as a case property
    const left = phys.filter((t) => !satisfiableInPci(t, [raises])).map((t) => t.id);
    expect(left).toEqual([]);
    expect(raises.events).toContain("side-branch-compromise");
  });
});

/** The lab's other launch files: the presets each declares are not in core.launch.ts (each package's own test checks its file). */
const OTHER_LAUNCHES = [hyperaemiaLaunch, leftMainLaunch];

describe("launch metadata and the practice index (acceptance)", () => {
  it("core.launch.ts declares every preset of pwSession that no other launch file declares, and no other, with the presets' own titles", () => {
    expect(coreLaunch.sim).toBe("physiology");
    const elsewhere = OTHER_LAUNCHES.flatMap((l) => l.scenarios ?? []);
    const declared = new Set(elsewhere.map((s) => s.id));
    expect(coreLaunch.scenarios?.map((s) => s.id).sort()).toEqual(PHYSIOLOGY_PRESETS.filter((p) => !declared.has(p.id)).map((p) => p.id).sort());
    // together the launch files declare every preset once
    const all = [...coreLaunch.scenarios!, ...elsewhere];
    expect(all.map((s) => s.id).sort()).toEqual(PHYSIOLOGY_PRESETS.map((p) => p.id).sort());
    for (const p of PHYSIOLOGY_PRESETS) expect(all.find((x) => x.id === p.id)!.title, p.id).toBe(p.title);
  });

  it("practiceIndex lists every scenario in core.launch.ts under lesson pm-physiology-setup, and under its other lessons and cases", () => {
    expect(PRACTICE_INDEX.known.scenarios.get("physiology")?.size).toBe(PHYSIOLOGY_PRESETS.length);
    const setup = practiceForLesson("pm-physiology-setup").filter((e) => e.sim === "physiology").map((e) => e.scenario);
    for (const s of coreLaunch.scenarios!) {
      expect(setup, s.id).toContain(s.id);
      for (const l of s.lessonIds) expect(practiceForLesson(l).some((e) => e.sim === "physiology" && e.scenario === s.id), `${s.id} under ${l}`).toBe(true);
      for (const c of s.caseIds ?? []) expect(practiceForCase(c).some((e) => e.sim === "physiology" && e.scenario === s.id), `${s.id} under case ${c}`).toBe(true);
    }
    const entry = practiceForLesson("pm-physiology-setup").find((e) => e.scenario === "fault-air-aortic")!;
    expect(entry.params).toEqual({ scenario: "fault-air-aortic", mode: "guided" });
  });
});
