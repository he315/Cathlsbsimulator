// One lab run (found-lab-session-plumbing): one logbook row per run with the case id, mode, scenario,
// decisions and metrics; the tip policy (guided as they apply, supervised and independent after
// askHelp, exams none); the launch mode overriding the level; the case id and sim key shapes.
//   npx vitest run src/ui/lab/labRun.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import * as tipsModule from "../../content/lab/tips";
import type { LabContext } from "../../content/lab/tips";
import { caseFor, classifyCase, examCases, ladderFor, simKeyEpas } from "../../content/mentor/catalogue";
import { useProgressStore } from "../../state/useProgressStore";
import { catalogueId, LAB_OF_SIM, LabRun, parseRunCaseId, resolveRunPolicy, runCaseId, runEpa, sourceForSim } from "./labRun";
import type { DecisionRecord } from "../../mentor/ledger";

const store = () => useProgressStore.getState();
const progress = () => ({ activePolicy: store().activePolicy, profile: store().profile });

/** A diagnostic moment with tips in the registry: a JL catheter near the left main in a dilated root. */
const DIAG_CTX: LabContext = { lab: "diagnostic", phase: "engage-left", events: ["dilated-root", "engage-fail"], catheter: "JL", engagement: "near-lm", vessel: "LM" };

const decision = (id: string, correct: boolean): Omit<DecisionRecord, "t"> => ({ id, stage: "plan", label: `Decision ${id}`, correct, expected: "A", given: correct ? "A" : "B", lessonId: "pm-antithrombotics-heparin" });

beforeEach(() => {
  store().reset();
});

describe("finish()", () => {
  it("writes exactly one logbook row with mode, caseId and decisions", () => {
    const caseId = runCaseId("angio-pci", "lad-focal");
    let t = 0;
    const run = new LabRun({ sim: "angio-pci", caseId, launchMode: "supervised", progress: progress(), clock: () => t });
    t = 12;
    run.decide(decision("guide-choice", true));
    t = 40;
    run.decide(decision("stent-length", false));
    const before = store().profile.logbook.length;
    const row = run.finish({ score: 72, passed: true, metrics: { fluoroS: 310, cineRuns: 9, notANumber: Number.NaN } });
    run.finish({ score: 10, passed: false }); // a second call writes nothing
    const book = store().profile.logbook;
    expect(book.length).toBe(before + 1);
    const saved = book[book.length - 1];
    expect(saved).toEqual(row);
    expect(saved.mode).toBe("supervised");
    expect(saved.caseId).toBe("angio-pci:lad-focal");
    expect(saved.scenarioId).toBe("lad-focal");
    expect(saved.lab).toBe("pci");
    expect(saved.source).toBe("pci-lad-focal");
    expect(saved.decisions?.map((d) => [d.id, d.t, d.correct])).toEqual([
      ["guide-choice", 12, true],
      ["stent-length", 40, false],
    ]);
    expect(saved.metrics).toEqual({ fluoroS: 310, cineRuns: 9 });
    expect(saved.score).toBe(72);
    expect(saved.caseName).toBe("PCI: LAD focal");
    expect(run.finished).toBe(true);
  });

  it("names a run the lab did not name from its lab, never from the run id", () => {
    expect(new LabRun({ sim: "haemo", caseId: runCaseId("haemo", "aortic-stenosis"), progress: progress() }).finish({ passed: true }).caseName).toBe("Haemodynamics lab: aortic stenosis");
    expect(new LabRun({ sim: "iabp", caseId: runCaseId("iabp"), progress: progress() }).finish({ passed: true }).caseName).toBe("IABP console");
    expect(new LabRun({ sim: "angio-pci", caseId: runCaseId("angio-pci", "lad-focal"), caseName: "Own name", progress: progress() }).finish({ passed: true }).caseName).toBe("Own name");
    expect(new LabRun({ sim: "angio-pci", caseId: runCaseId("angio-pci", "lcx-stemi"), progress: progress() }).caseName).toBe("PCI: LCx STEMI");
    expect(new LabRun({ sim: "angio-pci", caseId: runCaseId("angio-pci", "rca-cto", "L2"), progress: progress() }).caseName).toBe("PCI: RCA CTO variant L2");
  });

  it("a held-out PCI variant run in exam mode logs an exam with the variant's rung", () => {
    const v = ladderFor("pci-simple").pci!.exam[0];
    expect(classifyCase(v.id).exam).toBe(true);
    const variant = v.id.split("~")[1];
    const caseId = runCaseId("angio-pci", "lad-focal", variant);
    const run = new LabRun({ sim: "angio-pci", caseId, launchMode: "exam", progress: progress() });
    expect(run.mode).toBe("exam");
    const row = run.finish({ score: 80, passed: true });
    expect(row.mode).toBe("exam");
    expect(row.caseId).toBe(caseId);
    expect(row.rungs["pci-simple"]).toBe(v.rung);
    expect(row.epas[0]).toBe("pci-simple");
    expect(store().profile.examResults["epa:pci-simple"]?.attempts).toBe(1);
  });

  it("a diagnostic run id is classified by its case: EPA, held-out exam, pending exam closed", () => {
    const [ex] = examCases("access-radial", { minRung: 2, count: 1 });
    expect(ex).toBeDefined();
    store().beginExam({ caseId: ex.caseId, epa: "access-radial", kind: "diagnostic", rung: ex.rung, caseName: "exam" });
    expect(store().profile.pendingExams).toHaveLength(1);
    const caseId = runCaseId("cathlab", ex.caseId);
    const run = new LabRun({ sim: "cathlab", caseId, launchMode: "exam", progress: progress() });
    const row = run.finish({ passed: true, score: 90 });
    expect(row.mode).toBe("exam");
    expect(row.caseId).toBe(caseId);
    expect(row.epas).toContain("access-radial");
    expect(row.rungs["access-radial"]).toBe(ex.rung);
    expect(row.caseName).toBe(caseFor(ex.caseId)?.name);
    expect(store().profile.pendingExams).toHaveLength(0);
  });

  it("keeps the old sim key as the source, so simKeyEpas still maps the EPAs", () => {
    const run = new LabRun({ sim: "angio-pci", caseId: runCaseId("angio-pci", "lad-focal"), progress: progress() });
    const row = run.finish({ passed: true });
    const mapped = simKeyEpas("pci-lad-focal").map((x) => x.epa);
    expect(mapped.length).toBeGreaterThan(0);
    for (const e of mapped) expect(row.epas).toContain(e);
  });

  it("counts help requests as hints in supervised practice", () => {
    const run = new LabRun({ sim: "haemo", caseId: runCaseId("haemo", "aortic-stenosis"), launchMode: "supervised", progress: progress() });
    run.askHelp(5);
    run.askHelp(9);
    expect(run.helpAskedAt).toBe(5);
    const row = run.finish({ passed: true });
    expect(row.hints).toBe(2);
    expect(row.lab).toBe("haemo");
    expect(row.source).toBe("haemo");
  });

  it("grades a skill card armed on the lab's old sim key, as recordSim did", () => {
    store().armCard("pci-simple:no-act-check", "no-act-check" as never, "pci-lad-focal");
    const run = new LabRun({ sim: "angio-pci", caseId: runCaseId("angio-pci", "lad-focal"), progress: progress() });
    run.finish({ passed: true });
    expect(store().profile.quizMemory["pci-simple:no-act-check"]).toBeDefined();
  });
});

describe("tip policy", () => {
  it("exam mode returns no tips, and offers no help", () => {
    const run = new LabRun({ sim: "cathlab", caseId: "routine-left", launchMode: "exam", progress: progress() });
    expect(run.mode).toBe("exam");
    expect(run.askHelp(3)).toBeNull();
    expect(run.tipsVisible()).toBe(false);
    expect(run.tips(tipsModule, DIAG_CTX)).toEqual([]);
    expect(run.tips(tipsModule, [DIAG_CTX, { lab: "pci", phase: "guide" }])).toEqual([]);
  });

  it("supervised shows tips only after askHelp()", () => {
    const run = new LabRun({ sim: "cathlab", caseId: "routine-left", launchMode: "supervised", progress: progress() });
    expect(run.tips(tipsModule, DIAG_CTX)).toEqual([]);
    run.askHelp(20);
    const tips = run.tips(tipsModule, DIAG_CTX);
    expect(tips.length).toBeGreaterThan(0);
    expect(tips).toEqual(tipsModule.tipsFor(DIAG_CTX, 5));
    expect(run.hints).toBe(1);
  });

  it("independent practice is like supervised; guided shows tips at once and counts nothing", () => {
    const ind = new LabRun({ sim: "cathlab", caseId: "routine-left", launchMode: "independent", progress: progress() });
    expect(ind.tips(tipsModule, DIAG_CTX)).toEqual([]);
    ind.askHelp();
    expect(ind.tips(tipsModule, DIAG_CTX).length).toBeGreaterThan(0);
    const g = new LabRun({ sim: "cathlab", caseId: "routine-left", launchMode: "guided", progress: progress() });
    expect(g.tips(tipsModule, DIAG_CTX).length).toBeGreaterThan(0);
    g.askHelp();
    expect(g.hints).toBe(0);
  });

  it("several contexts give each tip once (the full case)", () => {
    const run = new LabRun({ sim: "procedure", caseId: "procedure:radial-routine", launchMode: "guided", progress: progress() });
    const tips = run.tips(tipsModule, [DIAG_CTX, DIAG_CTX, { lab: "access", phase: "puncture", route: "radial" }], 12);
    expect(new Set(tips.map((t) => t.id)).size).toBe(tips.length);
    expect(tips).toEqual(tipsModule.tipsForAll([DIAG_CTX, DIAG_CTX, { lab: "access", phase: "puncture", route: "radial" }], 12));
  });

  it("no tips before the tip module has loaded", () => {
    const run = new LabRun({ sim: "cathlab", caseId: "routine-left", launchMode: "guided", progress: progress() });
    expect(run.tips(null, DIAG_CTX)).toEqual([]);
  });
});

describe("policy", () => {
  it("the launch mode overrides the level-derived mode", () => {
    const level = resolveRunPolicy({ sim: "angio-pci", caseId: "angio-pci:lad-focal", source: "pci-lad-focal", progress: progress() });
    expect(level.mode).toBe("guided"); // no evidence yet: level 0 practises guided
    expect(level.launchMode).toBeUndefined();
    const launched = resolveRunPolicy({ sim: "angio-pci", caseId: "angio-pci:lad-focal", source: "pci-lad-focal", launchMode: "independent", progress: progress() });
    expect(launched.mode).toBe("independent");
    expect(launched.launchMode).toBe("independent");
    expect(launched.visibility.hints).toBe("costed");
    const exam = resolveRunPolicy({ sim: "angio-pci", caseId: "angio-pci:lad-focal", launchMode: "exam", progress: progress() });
    expect(exam.mode).toBe("exam");
    expect(exam.source).toBe("exam");
    expect(exam.visibility.hints).toBe("off");
  });

  it("the diagnostic labs read resolveLabPolicy (tutorials are guided)", () => {
    expect(resolveRunPolicy({ sim: "cathlab", caseId: "routine-left", simMode: "tutorial-lm", progress: progress() }).source).toBe("tutorial");
    expect(resolveRunPolicy({ sim: "cathlab", caseId: "routine-left", simMode: "exam", progress: progress() }).mode).toBe("exam");
  });

  it("the diagnostic labs match the active policy and the case's EPA by the case inside a run id", () => {
    const id = ladderFor("access-radial").diagnostic!.rungs[0].caseIds[0];
    const caseId = runCaseId("cathlab", id);
    expect(catalogueId("cathlab", caseId)).toBe(id);
    expect(resolveRunPolicy({ sim: "cathlab", caseId, progress: progress() }).epa).toBe("access-radial");
    expect(runEpa(caseId, "cathlab", undefined, "cathlab")).toBe("access-radial");
    store().setActivePolicy("access-radial", id);
    const p = resolveRunPolicy({ sim: "cathlab", caseId, progress: progress() });
    expect(p.source).toBe("active");
    expect(p.epa).toBe("access-radial");
    // an active policy set on the run id itself is matched too
    store().setActivePolicy("access-radial", caseId);
    expect(resolveRunPolicy({ sim: "cathlab", caseId, progress: progress() }).source).toBe("active");
    // the full case and other labs: an active policy on the scenario
    store().setActivePolicy("pci-simple", "pci-lad-focal");
    expect(resolveRunPolicy({ sim: "angio-pci", caseId: "angio-pci:lad-focal", progress: progress() }).source).toBe("active");
  });

  it("a progression screen's active policy for this case is used", () => {
    store().setActivePolicy("pci-simple", "pci-lad-focal");
    const p = resolveRunPolicy({ sim: "angio-pci", caseId: "angio-pci:lad-focal", source: "pci-lad-focal", progress: progress() });
    expect(p.source).toBe("active");
    expect(p.epa).toBe("pci-simple");
  });
});

describe("case ids and sim keys", () => {
  it("builds and parses '<sim>:<scenario>[~variant]'", () => {
    expect(runCaseId("angio-pci", "lad-focal")).toBe("angio-pci:lad-focal");
    expect(runCaseId("angio-pci", "lad-focal", "L2")).toBe("angio-pci:lad-focal~L2");
    expect(runCaseId("iabp")).toBe("iabp");
    expect(parseRunCaseId("angio-pci:lad-focal~L2")).toEqual({ sim: "angio-pci", scenario: "lad-focal", variant: "L2" });
    expect(parseRunCaseId("haemo")).toEqual({ sim: "haemo" });
  });

  it("maps each lab onto its logbook lab and old sim key", () => {
    expect(sourceForSim("angio-pci", "rca-cto", "X1")).toBe("pci-rca-cto~X1");
    expect(sourceForSim("procedure")).toBe("full-case");
    expect(sourceForSim("pericardiocentesis")).toBe("pericardiocentesis");
    expect(LAB_OF_SIM.pericardiocentesis).toBe("bedside");
    expect(LAB_OF_SIM.tavi).toBe("structural");
    const run = new LabRun({ sim: "angio-pci", caseId: "angio-pci:rca-cto~X1", progress: progress(), log: (s) => ({ ...s }) as never });
    expect(run.source).toBe("pci-rca-cto~X1");
    expect(run.scenarioId).toBe("rca-cto");
  });
});
