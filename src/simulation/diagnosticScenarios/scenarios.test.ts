// Named diagnostic scenarios (diag-scenario-registry): the registry, the seeded case and its id,
// the packs against their .launch.ts files, one patient from one seed, the chart's patient in the
// engine and the practice index.
//   npx vitest run src/simulation/diagnosticScenarios/scenarios.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { CASE_LIBRARY, decodeScenarioCaseId, generateCase, reconstructCase, resolveCase, scenarioCase, scenarioCaseId } from "../caseGenerator";
import { DIAG_SCENARIOS, DIAG_SCENARIO_ERRORS, collectDiagScenarios, diagScenarioById, scenarioEvents, type DiagScenario } from "./index";
import { LAB_EVENTS } from "../../content/lab/tips";
import type { LaunchFile } from "../../content/schema";
import { practiceForLesson } from "../../ui/content/practiceIndex";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { DiagnosticLabSession, chartRenal, creatinineForEgfr, engineOptionsForCase, profileFromChart } from "../../ui/sim/labSession";
import { TRACKS } from "../../content";
import { ckdEpi2021, cockcroftGault } from "../patient/patient";
import type { AnatomyCase } from "../../types";

const LAUNCH = import.meta.glob<{ launch: LaunchFile }>("./*.launch.ts", { eager: true });
const PACKS = import.meta.glob<{ scenarios: DiagScenario[] }>(["./*.ts", "!./index.ts", "!./*.launch.ts", "!./*.test.ts"], { eager: true });

const g = () => useSimulatorStore.getState();
function session(c: AnatomyCase): DiagnosticLabSession {
  g().loadCase(c, "free");
  return new DiagnosticLabSession(useSimulatorStore, null, null, { team: false });
}
afterEach(() => g().setPedalImaging(false));

describe("scenarioCase and the scenario case id", () => {
  it("scenarioCase('diag-graft-search','s1') twice gives identical AnatomyCase JSON; resolveCase on its id returns it", () => {
    const a = scenarioCase("diag-graft-search", "s1");
    const b = scenarioCase("diag-graft-search", "s1");
    expect(a).toBeDefined();
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a!.id).toBe("scn|diag-graft-search|s1");
    expect(JSON.stringify(resolveCase(a!.id))).toBe(JSON.stringify(a));
    expect(JSON.stringify(reconstructCase(a!.id))).toBe(JSON.stringify(a));
    // the case carries the scenario: chart, grafts, lesions and events
    expect(a!.scenarioId).toBe("diag-graft-search");
    expect(a!.chart?.operationNote).toMatch(/internal mammary/);
    expect(a!.grafts?.map((x) => x.conduit)).toEqual(["lima", "svg", "svg"]);
    expect(a!.lesions.map((l) => l.vessel)).toEqual(["LAD", "RCA", "LCx"]);
  });

  it("a case does not share state with the registry, and another seed is another draw of the same scenario", () => {
    const a = scenarioCase("diag-graft-search", "s1")!;
    a.chart!.weightKg = 1;
    a.grafts![0].status = "occluded";
    expect(diagScenarioById("diag-graft-search")!.chart.weightKg).toBe(80);
    expect(scenarioCase("diag-graft-search", "s1")!.grafts![0].status).toBe("patent");
    const c = scenarioCase("diag-graft-search", "s2")!;
    expect(c.id).toBe("scn|diag-graft-search|s2");
    expect(c.name).toBe(a.name);
  });

  it("ids decode and unknown scenarios resolve to nothing", () => {
    expect(scenarioCaseId("diag-trace-recognition", "a|b")).toBe("scn|diag-trace-recognition|a|b");
    expect(decodeScenarioCaseId("scn|diag-trace-recognition|a|b")).toEqual({ scenarioId: "diag-trace-recognition", seed: "a|b" });
    expect(decodeScenarioCaseId("gen|rand|1")).toBeNull();
    expect(scenarioCase("no-such-scenario")).toBeUndefined();
    expect(resolveCase("scn|no-such-scenario|1")).toBeUndefined();
    // the default seed
    expect(scenarioCase("diag-trace-recognition")!.id).toBe("scn|diag-trace-recognition|1");
  });

  it("library and generated cases are unchanged (no chart, no scenario, the engine seeded by the case id)", () => {
    const lib = CASE_LIBRARY[0];
    expect(lib.chart).toBeUndefined();
    expect(lib.scenarioId).toBeUndefined();
    expect(engineOptionsForCase(lib)).toEqual({ seed: lib.id });
    const gen = generateCase("seed-1");
    expect(resolveCase(gen.id)).toEqual(gen);
    expect(engineOptionsForCase(gen)).toEqual({ seed: gen.id });
  });
});

describe("the registry", () => {
  it("every pack's scenarios match its .launch.ts entries (ids, titles and lessons)", () => {
    const fromPacks = new Map(DIAG_SCENARIOS.map((s) => [s.id, s]));
    const fromLaunch = new Map<string, { title: string; lessonIds: string[] }>();
    for (const [file, mod] of Object.entries(LAUNCH)) {
      expect(mod.launch.sim, file).toBe("cathlab");
      for (const s of mod.launch.scenarios ?? []) fromLaunch.set(s.id, s);
    }
    expect([...fromLaunch.keys()].sort()).toEqual([...fromPacks.keys()].sort());
    for (const [id, l] of fromLaunch) {
      expect(l.title, id).toBe(fromPacks.get(id)!.title);
      expect(l.lessonIds, id).toEqual(fromPacks.get(id)!.lessonIds);
    }
    // each pack file has a .launch.ts beside it
    for (const file of Object.keys(PACKS)) expect(Object.keys(LAUNCH), file).toContain(file.replace(/\.ts$/, ".launch.ts"));
  });

  it("scenario events and script events use the shared vocabulary; every scenario has a chart, checks and a valid start", () => {
    const vocab = new Set<string>(LAB_EVENTS);
    expect(DIAG_SCENARIOS.length).toBeGreaterThanOrEqual(7);
    for (const s of DIAG_SCENARIOS) {
      for (const e of scenarioEvents(s)) expect(vocab.has(e), `${s.id}: ${e}`).toBe(true);
      expect(s.chart.heightCm, s.id).toBeGreaterThan(0);
      expect(s.checks.length, s.id).toBeGreaterThan(0);
      expect(["root", "sheath"]).toContain(s.startAt);
      expect(s.lessonIds.length, s.id).toBeGreaterThan(0);
    }
  });

  it("collectDiagScenarios refuses a pack without scenarios, a duplicate id and a repeated trigger id", () => {
    const one = DIAG_SCENARIOS[0];
    expect(() => collectDiagScenarios({ "./x.ts": {} })).toThrow(/does not export 'scenarios'/);
    expect(() => collectDiagScenarios({ "./a.ts": { scenarios: [one] }, "./b.ts": { scenarios: [one] } })).toThrow(/declared in .\/a.ts and .\/b.ts/);
    const dupTrigger: DiagScenario = { ...one, id: "dup-trigger", script: [{ id: "t", when: {}, do: [] }, { id: "t", when: {}, do: [] }] };
    expect(() => collectDiagScenarios({ "./c.ts": { scenarios: [dupTrigger] } })).toThrow(/twice/);
    // with a reporter (the registry at load) the errors are reported and the offenders skipped
    const errs: string[] = [];
    const got = collectDiagScenarios({ "./a.ts": { scenarios: [one] }, "./b.ts": { scenarios: [one, dupTrigger] }, "./x.ts": {} }, (m) => errs.push(m));
    expect(got).toEqual([one]);
    expect(errs).toHaveLength(3);
    // the registry itself has no errors
    expect(DIAG_SCENARIO_ERRORS).toEqual([]);
  });

  it("the case's name in the lab states the presentation only: no lesion morphology and nothing the chart plants", () => {
    const giveaway = /spasm|scad|dissect|thromb|cto\b|occlu|vasospas|pde|sildenafil|tadalafil|nitrate|pregnan|egfr|ceiling|contrast|skin|radiation|burn|erythema|operation note|graft|trace|damp/i;
    for (const s of DIAG_SCENARIOS) {
      expect(s.caseName, s.id).not.toMatch(giveaway);
      const c = scenarioCase(s.id, "3")!;
      expect(c.name, s.id).toBe(s.caseName);
    }
  });

  it("each check's lesson is one of the scenario's lessons or a lesson of the curriculum", () => {
    const lessons = new Set<string>();
    for (const t of TRACKS) for (const m of t.modules) for (const l of m.lessons) lessons.add(l.id);
    for (const s of DIAG_SCENARIOS) {
      for (const l of s.lessonIds) expect(lessons.has(l), `${s.id}: ${l}`).toBe(true);
      for (const ch of s.checks) if (ch.lessonId) expect(s.lessonIds.includes(ch.lessonId) || lessons.has(ch.lessonId), `${s.id}/${ch.id}: ${ch.lessonId}`).toBe(true);
    }
  });
});

describe("one patient from one seed", () => {
  it("a scenario with chart eGFR 30 seeds an engine whose vitals().contrast.crclMlMin matches", () => {
    const c = scenarioCase("diag-contrast-sensitive")!;
    expect(c.chart?.egfr).toBe(30);
    const s = session(c);
    const p = s.engine.profile;
    // the chart's patient: sex, age, size, LVEF and the eGFR as written
    expect({ sex: p.sex, ageY: p.ageY, heightCm: p.heightCm, weightKg: p.weightKg, lvef: p.lvef, egfr: p.renal.egfr }).toEqual({ sex: "F", ageY: 78, heightCm: 158, weightKg: 60, lvef: 30, egfr: 30 });
    // the creatinine that gives eGFR 30 by CKD-EPI 2021, and Cockcroft-Gault from it
    const scr = creatinineForEgfr(30, 78, "F");
    expect(Math.round(ckdEpi2021(78, scr, "F"))).toBe(30);
    const crcl = Math.round(cockcroftGault(78, 60, scr, "F"));
    expect(chartRenal(c.chart!)!.crclMlMin).toBe(crcl);
    expect(s.engine.vitals().contrast.crclMlMin).toBe(crcl);
    // the contrast ceiling the engine reports is the chart's (3.7 × eGFR)
    expect(s.engine.contrastBudget().rules.find((r) => r.id === "brilakis-gfr")?.ceilingMl).toBe(111);
    s.dispose();
  });

  it("the case id seeds the patient engine and the coronary genome (FluoroView seeds the thorax with the same id); the chart's drugs reach the engine", () => {
    const c = scenarioCase("diag-nitrate-pde5", "7")!;
    const s = session(c);
    expect(s.caseId).toBe("scn|diag-nitrate-pde5|7");
    expect(s.engine.profile.seed).toBe(c.id);
    expect(s.tree.genome?.seed).toBe(c.id);
    expect(s.engine.profile.pde5).toEqual({ agent: "sildenafil", hoursAgo: 10 });
    // the same scenario and seed give the same patient
    const again = session(scenarioCase("diag-nitrate-pde5", "7")!);
    expect(again.engine.profile).toEqual(s.engine.profile);
    s.dispose();
    again.dispose();
  });
});

describe("the engine's patient agrees with the chart", () => {
  it("over seeds 1 to 10 of every scenario: the scenario's indication, no anticoagulant or allergy the chart does not list, sinus rhythm without an anticoagulant, LVEDP following the chart's LVEF", () => {
    for (const s of DIAG_SCENARIOS) {
      const chartAnticoag = (s.chart.drugs ?? []).some((d) => !d.held && /^(warfarin|dabigatran|apixaban|rivaroxaban|edoxaban)$/i.test(d.drugId ?? d.name));
      for (let i = 1; i <= 10; i++) {
        const c = scenarioCase(s.id, String(i))!;
        const opts = engineOptionsForCase(c);
        expect("profile" in opts, s.id).toBe(true);
        const p = (opts as { profile: ReturnType<typeof profileFromChart> }).profile;
        const at = `${s.id} seed ${i}`;
        expect(p.seed, at).toBe(c.id);
        expect(s.indication, at).toBeDefined();
        expect(p.indication, at).toBe(s.indication);
        if (s.indication !== "SA" && (s.lesions ?? c.lesions).some((l) => l.kind === "thrombotic")) expect(p.culprit, at).not.toBeNull();
        if (s.indication === "SA") expect(p.culprit, at).toBeNull();
        if (!chartAnticoag) {
          expect(p.anticoagulation, at).toBe("none");
          expect(p.doac, at).toBeUndefined();
          expect(p.baseline.rhythm, at).toBe("sinus");
        }
        expect(p.allergies.other, at).toEqual(s.chart.allergies?.other ?? []);
        expect(p.allergies.contrast, at).toBe(s.chart.allergies?.contrast ?? p.allergies.contrast);
        if (s.chart.echo?.lvef !== undefined) {
          expect(p.lvef, at).toBe(s.chart.echo.lvef);
          // generatePatient's line: 11 + (55 - LVEF) × 0.22 (+3 in STEMI), with its seeded scatter of SD 3
          const line = 11 + (55 - p.lvef) * 0.22 + (p.indication === "STEMI" ? 3 : 0);
          expect(Math.abs(p.lvedp - Math.min(32, Math.max(6, line))), at).toBeLessThanOrEqual(12);
        }
      }
    }
    // the resuscitated arrest with ST elevation is a STEMI in the engine, at the default seed and the others
    const ohca = (engineOptionsForCase(scenarioCase("diag-ohca-post-rosc")!) as { profile: ReturnType<typeof profileFromChart> }).profile;
    expect(ohca.indication).toBe("STEMI");
    expect(ohca.culprit).not.toBeNull();
    // the elective contrast-sensitive patient is not an ACS at its default seed
    expect((engineOptionsForCase(scenarioCase("diag-contrast-sensitive")!) as { profile: ReturnType<typeof profileFromChart> }).profile.indication).toBe("SA");
  });

  it("a chart's anticoagulant and allergies reach the engine; LVEDP moves with the chart's LVEF", () => {
    const chart = { ...diagScenarioById("diag-contrast-sensitive")!.chart };
    const withDrugs = { ...chart, drugs: [{ name: "Apixaban", drugId: "apixaban", lastDoseHoursAgo: 30 }], allergies: { contrast: "none" as const, other: ["latex"] } };
    const p = profileFromChart("x", withDrugs, "SA");
    expect(p.anticoagulation).toBe("doac");
    expect(p.doac).toEqual({ agent: "apixaban", hoursSinceDose: 30 });
    expect(p.allergies.other).toEqual(["latex"]);
    // the same seed and indication: a lower LVEF gives a higher LVEDP
    const good = profileFromChart("x", { ...chart, echo: { lvef: 60 } }, "SA");
    const poor = profileFromChart("x", { ...chart, echo: { lvef: 25 } }, "SA");
    expect(poor.lvedp).toBeGreaterThan(good.lvedp);
    expect(poor.baseline.hr).toBeGreaterThanOrEqual(good.baseline.hr);
    expect(poor.baseline.sbp).toBeLessThanOrEqual(good.baseline.sbp);
  });
});

describe("the practice index", () => {
  it("lists every scenario of core.launch.ts under its lessons (cp-complex-patients-ohca, hb-background-general, pm-lab-drugs-nitrates among them)", () => {
    const core = LAUNCH["./core.launch.ts"].launch;
    for (const sc of core.scenarios ?? [])
      for (const lessonId of sc.lessonIds) expect(practiceForLesson(lessonId).some((e) => e.sim === "cathlab" && e.scenario === sc.id), `${sc.id} under ${lessonId}`).toBe(true);
    const ids = (lesson: string) => practiceForLesson(lesson).filter((e) => e.sim === "cathlab").map((e) => e.scenario);
    expect(ids("cp-complex-patients-ohca")).toContain("diag-ohca-post-rosc");
    expect(ids("hb-background-general")).toContain("diag-contrast-sensitive");
    expect(ids("pm-lab-drugs-nitrates")).toContain("diag-nitrate-pde5");
    expect(practiceForLesson("pm-engaging-trace").find((e) => e.scenario === "diag-trace-recognition")?.params).toEqual({ scenario: "diag-trace-recognition", mode: "guided" });
  });
});
