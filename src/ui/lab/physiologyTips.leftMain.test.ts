// physiology-left-main-and-ostial: the left main and aorto-ostial presets reach their tips through the
// physiology lab's context (src/ui/lab/physiologyTips.ts): vessel LM for the left main presets, the guide
// pressure damped or ventricularised while a guide is seated on an ostial lesion, and aorto-ostial-lesion
// for the ostial presets. The practice index lists every preset of leftMain.launch.ts under its lessons
// while the file publishes them (LEFT_MAIN_LAUNCH_ENABLED, true now that the pressure-wire session registers
// the presets); held back, it lists none of them and the IVUS bench's grey-zone hand-off stays hidden.
//   npx vitest run src/ui/lab/physiologyTips.leftMain.test.ts
import { describe, expect, it } from "vitest";
import { LAB_EVENTS, TIP_BY_ID, tipsFor, type LabContext, type LabEvent, type LabTip, type TipTrigger, type TipVessel } from "../../content/lab/tips";
import { WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import { LEFT_MAIN_LAUNCH_ENABLED, LEFT_MAIN_SCENARIOS, launch } from "../../content/lab/presets/physiology/leftMain.launch";
import { TRACKS, PUBLISHED_CASES } from "../../content";
import { validateLaunchLinks, type LaunchFiles } from "../../content/validateLaunch";
import { LEFT_MAIN_PRESETS, LEFT_MAIN_PRESET_BY_ID, aorticPressure, presetView, reading, type CoronaryCase, type LeftMainPreset } from "../../simulation/physiology";
import { classifyTip, type TipPressureState } from "../../simulation/patient/transducer";
import { PRESET_BY_ID, initialPwSession } from "../../simulation/pci/pwSession";
import { PRACTICE_INDEX, buildPracticeIndex, practiceForLesson, type PracticeIndex } from "../content/practiceIndex";
import { GREY_ZONE_HANDOFF, greyZoneHandoffAvailable } from "../bench/PlanForm";
import { physiologyTipContext, raises } from "./physiologyTips";

const PKG = "physiology-left-main-and-ostial";
const ids = (ctx: LabContext, n = 20) => tipsFor(ctx, n).map((t) => t.id);

/** The engaged guide's pressure at the ostium, classified as pwSession.guidePressure does (transducer.classifyTip). */
function seatedGuide(c: CoronaryCase, h = 0): TipPressureState {
  let ts = -Infinity,
    td = Infinity,
    as = -Infinity,
    ad = Infinity;
  for (let i = 0; i < 120; i++) {
    const ph = i / 120;
    const p = reading(c, (ph * 60) / 70, 0, h, true, 0).pa;
    const a = aorticPressure(c.map, ph);
    ts = Math.max(ts, p);
    td = Math.min(td, p);
    as = Math.max(as, a);
    ad = Math.min(ad, a);
  }
  return classifyTip({ location: "ostium" }, ts, td, as, ad);
}

/**
 * The context physiologyTipContext reports for a preset at the start of a study (guide engaged, no set-up
 * events): its vessel, the guide pressure (classified when the guide obstructs the ostium) with the
 * pressure-damped or pressure-ventricularised event it adds, and the preset's case properties.
 */
function presetContext(p: LeftMainPreset, guideEngaged = true): LabContext {
  const c = presetView(p);
  const k = c.guideObstructs && guideEngaged ? seatedGuide(c) : "aortic";
  const pressure = k === "damped" || k === "ventricularised" || k === "wedged" ? k : "aortic";
  const events = new Set<LabEvent>(p.events);
  if (pressure === "damped" || pressure === "wedged") events.add("pressure-damped");
  if (pressure === "ventricularised") events.add("pressure-ventricularised");
  return { lab: "pci", phase: "physiology", pressure, events: [...events], vessel: c.vessel as TipVessel };
}

describe("named presets show their tips (acceptance)", () => {
  it("in 'ostial-lm-damped' (leftMain.launch.ts), at phase physiology, tipsFor(ctx, 20) includes pci-phys-left-main-both-branches and pci-phys-ostial-disengage", () => {
    expect(LEFT_MAIN_SCENARIOS.map((s) => s.id)).toContain("ostial-lm-damped");
    const p = LEFT_MAIN_PRESET_BY_ID["ostial-lm-damped"];
    // through the lab's own context once pwSession registers the preset; until then, built as it would build it
    const ctx = PRESET_BY_ID[p.id] ? physiologyTipContext(initialPwSession(p.id)) : presetContext(p);
    expect(ctx.phase).toBe("physiology");
    expect(ctx.vessel).toBe("LM");
    expect(["damped", "ventricularised"]).toContain(ctx.pressure);
    expect(ids(ctx, 20)).toEqual(expect.arrayContaining(["pci-phys-left-main-both-branches", "pci-phys-ostial-disengage", "pci-phys-damped-guide"]));
    // disengaged, the trace is aortic: the left main tip stays, the ostial advice goes
    const off = presetContext(p, false);
    expect(off.pressure).toBe("aortic");
    expect(ids(off, 20)).toContain("pci-phys-left-main-both-branches");
    expect(ids(off, 20)).not.toContain("pci-phys-ostial-disengage");
  });

  it("'ostial-rca-engaged' brings the aorto-ostial advice while seated; an intermediate left main brings the both-branches tip without it", () => {
    const rca = presetContext(LEFT_MAIN_PRESET_BY_ID["ostial-rca-engaged"]);
    expect(rca.vessel).toBe("RCA");
    expect(rca.events).toContain("aorto-ostial-lesion");
    expect(ids(rca, 20)).toContain("pci-phys-ostial-disengage");
    expect(ids(rca, 20)).not.toContain("pci-phys-left-main-both-branches");
    const lm = presetContext(LEFT_MAIN_PRESET_BY_ID["lm-intermediate"]);
    expect(lm.pressure).toBe("aortic");
    expect(ids(lm, 20)).toContain("pci-phys-left-main-both-branches");
    expect(ids(lm, 20)).not.toContain("pci-phys-ostial-disengage");
  });

  it("the jailed circumflex presets reach the jailed side-branch tips (side-branch-compromise with vessel LM)", () => {
    const ctx = presetContext(LEFT_MAIN_PRESET_BY_ID["lm-jailed-lcx-075"]);
    const shown = ids(ctx, 30);
    for (const id of ["pci-phys-jailed-side-branch", "pci-lm-jailed-circumflex"]) {
      expect(TIP_BY_ID[id], id).toBeDefined();
      expect(shown, id).toContain(id);
    }
  });

  // pwSession.ts registers LEFT_MAIN_PRESETS (LEFT_MAIN_PW_PRESETS in PHYSIOLOGY_PRESETS); were it to stop,
  // initialPwSession would fall back to its first preset and the check below would be reported as skipped
  const registered = LEFT_MAIN_PRESETS.filter((x) => PRESET_BY_ID[x.id]);

  it("the pressure-wire session registers all the presets or none of them, and the launch file publishes them exactly when it does", () => {
    expect([0, LEFT_MAIN_PRESETS.length]).toContain(registered.length);
    // a published preset the lab cannot open is a dead link; a registered one left unpublished is unreachable
    expect(LEFT_MAIN_LAUNCH_ENABLED).toBe(registered.length > 0);
  });

  it.runIf(registered.length > 0)("once the pressure-wire session registers the presets, its own context agrees (vessel LM, damped seated guide)", () => {
    for (const p of registered) {
      const ctx = physiologyTipContext(initialPwSession(p.id));
      const want = presetContext(p);
      expect(ctx.vessel, p.id).toBe(want.vessel);
      if (p.case.guideObstructs) expect(["damped", "ventricularised", "wedged"]).toContain(ctx.pressure);
    }
  });
});

// --- reachability (the rule of src/content/lab/reachability.test.ts) -----------------------------------

function satisfiableIn(when: TipTrigger, phases: readonly string[] | undefined, rs: readonly LabRaises[]): boolean {
  const has = (key: "phases" | "events" | "routes" | "procedures" | "techniques" | "imaging", x: string) => rs.some((r) => ((r[key] ?? []) as readonly string[]).includes(x));
  const any = (want: readonly string[] | undefined, key: Parameters<typeof has>[0]) => !want?.length || want.some((x) => has(key, x));
  return any(phases, "phases") && any(when.event, "events") && (when.requires ?? []).every((e) => has("events", e)) && any(when.procedure, "procedures") && any(when.route, "routes") && any(when.technique, "techniques") && any(when.imaging, "imaging");
}
const satisfiableInPci = (tip: LabTip, rs: readonly LabRaises[]) =>
  tip.lab === "pci" ? satisfiableIn(tip.when, tip.when.phase, rs) : !!tip.alsoIn?.some((a) => a.lab === "pci" && satisfiableIn(tip.when, a.phase, rs));

/** What the lab raises once these presets are registered: its own raises plus the presets' case properties. */
const withPresets: LabRaises = { ...raises, events: [...new Set<LabEvent>([...raises.events, ...LEFT_MAIN_PRESETS.flatMap((p) => p.events)])] };

describe("reachability (acceptance)", () => {
  it("the presets' events are in the shared vocabulary", () => {
    for (const p of LEFT_MAIN_PRESETS) for (const e of p.events) expect((LAB_EVENTS as readonly string[]).includes(e), `${p.id}: ${e}`).toBe(true);
  });

  it("every waiting.ts entry naming this package becomes satisfiable, so the pci waiting count falls by at least their number", () => {
    const mine = WAITING_TIPS.filter((w) => w.raisedBy === PKG).flatMap((w) => w.tips);
    expect(mine.filter((id) => TIP_BY_ID[id] && !satisfiableInPci(TIP_BY_ID[id], [withPresets]))).toEqual([]);
    const pciWaiting = WAITING_TIPS.filter((w) => w.lab === "pci").flatMap((w) => w.tips);
    const stillWaiting = (rs: readonly LabRaises[]) => pciWaiting.filter((id) => TIP_BY_ID[id] && !satisfiableInPci(TIP_BY_ID[id], rs)).length;
    const before = stillWaiting([raises]);
    const after = stillWaiting([withPresets]);
    console.info(`waiting.ts entries naming ${PKG}: ${mine.length}; pci tips still waiting: ${before} -> ${after} with the left main presets' events`);
    expect(before - after).toBeGreaterThanOrEqual(mine.filter((id) => TIP_BY_ID[id]).length);
    // the request's tips are satisfiable from the lab with these presets
    for (const id of ["pci-phys-left-main-both-branches", "pci-phys-ostial-disengage", "pci-phys-damped-guide", "pci-phys-jailed-side-branch"]) expect(satisfiableInPci(TIP_BY_ID[id], [withPresets]), id).toBe(true);
  });
});

// The real launch files, with leftMain.launch.ts publishing its scenarios: the index the lab gets once
// LEFT_MAIN_LAUNCH_ENABLED is set (the same glob as src/ui/content/practiceIndex.ts).
const LAUNCH_FILES = import.meta.glob<LaunchFiles[string]>(["/src/**/*.launch.ts", "!/src/**/__fixtures__/**"], { eager: true });
const LEFT_MAIN_FILE = "/src/content/lab/presets/physiology/leftMain.launch.ts";
const ENABLED_FILES: LaunchFiles = { ...LAUNCH_FILES, [LEFT_MAIN_FILE]: { launch: { sim: "physiology", scenarios: LEFT_MAIN_SCENARIOS } } };
const ENABLED_INDEX: PracticeIndex = buildPracticeIndex(ENABLED_FILES);

describe("launch metadata and the practice index (acceptance)", () => {
  it("the glob sees leftMain.launch.ts, and it publishes all its scenarios or none, as LEFT_MAIN_LAUNCH_ENABLED says", () => {
    expect(Object.keys(LAUNCH_FILES)).toContain(LEFT_MAIN_FILE);
    expect(launch.sim).toBe("physiology");
    expect(launch.scenarios).toEqual(LEFT_MAIN_LAUNCH_ENABLED ? LEFT_MAIN_SCENARIOS : []);
    const known = PRACTICE_INDEX.known.scenarios.get("physiology");
    for (const s of LEFT_MAIN_SCENARIOS) expect(known?.has(s.id) ?? false, s.id).toBe(LEFT_MAIN_LAUNCH_ENABLED);
  });

  it("published, the scenarios validate against the curriculum (every lesson they name exists, nothing is duplicated)", () => {
    expect(ENABLED_INDEX.known.problems).toEqual([]);
    expect(validateLaunchLinks({ tracks: TRACKS, cases: PUBLISHED_CASES }, ENABLED_INDEX.known)).toEqual([]);
  });

  it("published, practiceIndex lists every scenario in leftMain.launch.ts under pm-physiology-subsets and under each of its lessons; cp-ostial-assess and cp-left-main-assess list theirs", () => {
    const known = ENABLED_INDEX.known.scenarios.get("physiology");
    const under = (lesson: string) => practiceForLesson(lesson, ENABLED_INDEX).filter((e) => e.sim === "physiology").map((e) => e.scenario);
    for (const s of LEFT_MAIN_SCENARIOS) {
      expect(known?.has(s.id), s.id).toBe(true);
      expect(under("pm-physiology-subsets"), s.id).toContain(s.id);
      for (const l of s.lessonIds) expect(under(l), `${s.id} under ${l}`).toContain(s.id);
    }
    expect(under("cp-ostial-assess")).toEqual(expect.arrayContaining(["ostial-rca-engaged", "ostial-lm-damped"]));
    expect(under("cp-left-main-assess")).toEqual(expect.arrayContaining(LEFT_MAIN_PRESETS.filter((p) => p.model).map((p) => p.id)));
    const entry = practiceForLesson("cp-ostial-assess", ENABLED_INDEX).find((e) => e.scenario === "ostial-rca-engaged")!;
    expect(entry.params).toEqual({ scenario: "ostial-rca-engaged", mode: "guided" });
  });

  it("unpublished, the running index lists none of them under their lessons (no dead links)", () => {
    if (LEFT_MAIN_LAUNCH_ENABLED) return;
    const ids = new Set(LEFT_MAIN_SCENARIOS.map((s) => s.id));
    for (const l of ["pm-physiology-subsets", "cp-left-main-assess", "cp-ostial-assess", "cp-left-main-distal", "pm-physiology-after-pci", "pm-physiology-indices"])
      expect(practiceForLesson(l).filter((e) => e.sim === "physiology" && ids.has(e.scenario ?? "")).map((e) => e.scenario), l).toEqual([]);
  });

  it("the IVUS bench's grey-zone hand-off finds its preset exactly when the presets are published", () => {
    expect(GREY_ZONE_HANDOFF.params.scenario).toBe("lm-intermediate");
    expect(greyZoneHandoffAvailable(ENABLED_INDEX)).toBe(true);
    expect(greyZoneHandoffAvailable()).toBe(LEFT_MAIN_LAUNCH_ENABLED);
  });
});
