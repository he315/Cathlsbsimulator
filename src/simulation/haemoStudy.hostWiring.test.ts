// repair-haemo-host-wiring, the study side: the aortic valve studies of haemo-aortic-stenosis-studies
// are scored on what each one asks for (no valve area where the echo is concordant and the valve is
// not crossed; the simultaneous LV and aortic recording wherever crossing is indicated), and the
// transducer set-up decisions of haemo-transducer-and-setup become ledger records (setupDecisions()).
//   npx vitest run src/simulation/haemoStudy.hostWiring.test.ts
import { describe, expect, it } from "vitest";
import { HAEMO_SCENARIOS, SCENARIO_BY_ID } from "./haemo";
import {
  MANIFOLD_PORTS,
  SETUP_LESSON_MONITORING,
  SETUP_LESSON_SETUP,
  aorticCrossingIndicated,
  dataChecklist,
  haemoStudyReducer,
  initialStudy,
  requiredCalcs,
  setupDecisions,
  studySetup,
  type HaemoAction,
  type HaemoStudyState,
  type SetupDecision,
} from "./haemoStudy";

const AV_STUDIES = ["as-concordant-echo", "as-discordant-cross", "lflg-true", "lflg-pseudo", "lflg-no-reserve"];

describe("aortic valve studies: what a complete study includes", () => {
  it("the five valve-study scenarios carry an echo report; only as-concordant-echo is not crossed", () => {
    for (const id of AV_STUDIES) expect(SCENARIO_BY_ID[id]?.avStudy, id).toBeDefined();
    expect(AV_STUDIES.filter((id) => !aorticCrossingIndicated(SCENARIO_BY_ID[id]))).toEqual(["as-concordant-echo"]);
    // the original aortic stenosis scenario has no echo report
    expect(aorticCrossingIndicated(SCENARIO_BY_ID["aortic-stenosis"])).toBe(false);
  });

  it("requiredCalcs() does not ask for a valve area where the right answer is not to cross", () => {
    expect(requiredCalcs(SCENARIO_BY_ID["as-concordant-echo"])).not.toContain("ava");
    for (const id of ["as-discordant-cross", "lflg-true", "lflg-pseudo", "lflg-no-reserve"]) expect(requiredCalcs(SCENARIO_BY_ID[id]), id).toContain("ava");
    // unchanged for the original scenario
    expect(requiredCalcs(SCENARIO_BY_ID["aortic-stenosis"])).toContain("ava");
  });

  it("dataChecklist() asks for the simultaneous LV and aortic pressure in every valve study where crossing is indicated", () => {
    const keys = (id: string) => dataChecklist(SCENARIO_BY_ID[id]).map((q) => q.key);
    for (const id of ["as-discordant-cross", "lflg-true", "lflg-pseudo", "lflg-no-reserve"]) expect(keys(id), id).toContain("lvao");
    expect(keys("as-concordant-echo")).not.toContain("lvao");
    expect(keys("aortic-stenosis")).toContain("lvao");
    expect(keys("hocm")).toContain("lvao");
  });

  it("every scenario with crossing indicated asks for the valve area and the recording it needs, together", () => {
    for (const s of HAEMO_SCENARIOS) {
      if (!s.avStudy) continue;
      const wantsAva = requiredCalcs(s).includes("ava");
      const wantsLvao = dataChecklist(s).some((q) => q.key === "lvao");
      expect(wantsAva, s.id).toBe(s.avStudy.crossingIndicated);
      expect(wantsLvao, s.id).toBe(s.avStudy.crossingIndicated);
    }
  });
});

// ---------------------------------------------------------------------------
// setupDecisions()
// ---------------------------------------------------------------------------

const SET_UP: HaemoAction[] = [
  { type: "setup-level", landmark: "mid-thoracic" },
  { type: "setup-stopcock", to: "air" },
  { type: "setup-zero" },
  { type: "setup-stopcock", to: "patient" },
];
const FLUSH_ALL = MANIFOLD_PORTS.map((_, port): HaemoAction => ({ type: "manifold-flush", port }));

/** Play actions as the lab host does, collecting the set-up decisions into a ledger keyed by id (later replace earlier). */
function host(st: HaemoStudyState, ledger: Map<string, SetupDecision>, ...as: HaemoAction[]): HaemoStudyState {
  for (const a of as) {
    const next = haemoStudyReducer(st, a);
    for (const d of setupDecisions(st, next, a, new Set(ledger.keys()))) ledger.set(d.id, d);
    st = next;
  }
  return st;
}

describe("setupDecisions(): the set-up decisions for the run's ledger", () => {
  it("each graded fast-flush reading is a decision against what the flush showed", () => {
    const ledger = new Map<string, SetupDecision>();
    let st = host(initialStudy("normal", "setup-overdamped-air"), ledger, { type: "setup-fast-flush" });
    expect(studySetup(st).lastFlush?.reading).toBe("overdamped");
    st = host(st, ledger, { type: "setup-read-flush", reading: "optimal" });
    expect(ledger.get("setup-flush-1")).toMatchObject({ stage: "setup", correct: false, lessonId: SETUP_LESSON_MONITORING, tipIds: ["haemo-mon-fast-flush"] });
    expect(ledger.get("setup-flush-1")!.expected).toMatch(/Overdamped/);
    // put right and read again: a second decision, right this time
    host(st, ledger, { type: "setup-fix", fix: "reprime" }, { type: "setup-fast-flush" }, { type: "setup-read-flush", reading: "optimal" });
    expect(ledger.get("setup-flush-2")).toMatchObject({ correct: true, label: "Fast-flush test reading 2" });
    // a reading with no flush to read changes nothing and logs nothing
    const before = ledger.size;
    host(st, ledger, { type: "setup-read-flush", reading: "optimal" });
    expect(ledger.size).toBe(before);
  });

  it("air injected through the manifold is a critical error in the ledger", () => {
    const ledger = new Map<string, SetupDecision>();
    host(initialStudy("normal", "setup-hidden-bubble"), ledger, { type: "rhc-advance" }, { type: "manifold-inject" });
    expect(ledger.get("setup-manifold-air")).toMatchObject({ stage: "setup", correct: false, given: "Air injected through the manifold", lessonId: SETUP_LESSON_SETUP, tipIds: ["haemo-setup-manifold-check"] });
  });

  it("a clean injection in a preset is right, and a later air injection replaces it; a prepared study logs no clean injection", () => {
    const ledger = new Map<string, SetupDecision>();
    // the hidden bubble found and every port flushed: the injection is clean
    let st = host(initialStudy("normal", "setup-hidden-bubble"), ledger, { type: "manifold-inspect" }, ...FLUSH_ALL, { type: "rhc-advance" }, { type: "manifold-inject" });
    expect(ledger.get("setup-manifold-air")?.correct).toBe(true);
    st = host(st, ledger, { type: "manifold-inject" });
    expect(ledger.size).toBe(1);
    const prepared = new Map<string, SetupDecision>();
    host(initialStudy("normal"), prepared, { type: "rhc-advance" }, { type: "manifold-inject" });
    expect(prepared.size).toBe(0);
  });

  it("re-levelling after the table moved is right when done before recording", () => {
    const ledger = new Map<string, SetupDecision>();
    let st = host(initialStudy("normal", "setup-table-move"), ledger, ...FLUSH_ALL, ...SET_UP, { type: "rhc-advance" });
    expect(studySetup(st).tableMoved).toBe(true);
    expect(ledger.has("setup-relevel")).toBe(false);
    st = host(st, ledger, { type: "setup-level", landmark: "mid-thoracic" });
    expect(ledger.get("setup-relevel")).toMatchObject({ correct: true, given: "Re-levelled at the mid-thoracic level", lessonId: SETUP_LESSON_MONITORING, tipIds: ["haemo-mon-zero-level"] });
    // recording afterwards does not change it
    host(st, ledger, { type: "record" });
    expect(ledger.get("setup-relevel")?.correct).toBe(true);
  });

  it("recording before re-levelling is wrong, and re-levelling later does not overwrite it", () => {
    const ledger = new Map<string, SetupDecision>();
    let st = host(initialStudy("normal", "setup-table-move"), ledger, ...FLUSH_ALL, ...SET_UP, { type: "rhc-advance" }, { type: "record" });
    expect(ledger.get("setup-relevel")).toMatchObject({ correct: false, given: "Pressure recorded before re-levelling" });
    st = host(st, ledger, { type: "setup-level", landmark: "mid-thoracic" });
    expect(ledger.get("setup-relevel")?.correct).toBe(false);
  });

  it("the ledger follows the level until a pressure is recorded: levelled away again before recording is wrong", () => {
    const ledger = new Map<string, SetupDecision>();
    let st = host(initialStudy("normal", "setup-table-move"), ledger, ...FLUSH_ALL, ...SET_UP, { type: "rhc-advance" }, { type: "setup-level", landmark: "mid-thoracic" });
    expect(ledger.get("setup-relevel")?.correct).toBe(true);
    st = host(st, ledger, { type: "setup-level", landmark: "v4" });
    expect(studySetup(st).relevelledAfterMove).toBe(false);
    expect(ledger.get("setup-relevel")).toMatchObject({ correct: false, given: "Moved off the mid-thoracic level after re-levelling" });
    st = host(st, ledger, { type: "record" });
    expect(ledger.get("setup-relevel")).toMatchObject({ correct: false, given: "Pressure recorded before re-levelling" });
    // the debrief's set-up check agrees with the ledger
    expect(studySetup(st).relevelledAfterMove).toBe(false);
    // once a pressure was recorded unlevelled, re-levelling does not make it right
    host(st, ledger, { type: "setup-level", landmark: "mid-thoracic" });
    expect(ledger.get("setup-relevel")?.correct).toBe(false);
  });

  it("a second table move reopens the re-levelling after a right one", () => {
    const ledger = new Map<string, SetupDecision>();
    let st = host(initialStudy("normal", "setup-table-move"), ledger, ...FLUSH_ALL, ...SET_UP, { type: "rhc-advance" }, { type: "setup-level", landmark: "mid-thoracic" }, { type: "record" });
    expect(ledger.get("setup-relevel")?.correct).toBe(true);
    st = host(st, ledger, { type: "setup-table", deltaCm: 10 });
    expect(ledger.get("setup-relevel")).toMatchObject({ correct: false, given: "Table moved again and the transducer not re-levelled" });
    st = host(st, ledger, { type: "setup-level", landmark: "mid-thoracic" }, { type: "record" });
    expect(ledger.get("setup-relevel")?.correct).toBe(true);
    // moved again and recorded before re-levelling: wrong
    host(st, ledger, { type: "setup-table", deltaCm: -10 }, { type: "record" });
    expect(ledger.get("setup-relevel")).toMatchObject({ correct: false, given: "Pressure recorded before re-levelling" });
  });

  it("a transducer carried on the table rail is level after the move; never re-levelling is wrong at the diagnosis", () => {
    const rail = new Map<string, SetupDecision>();
    host(initialStudy("normal", "setup-table-move"), rail, ...FLUSH_ALL, ...SET_UP, { type: "setup-mount", mount: "table" }, { type: "rhc-advance" });
    expect(rail.get("setup-relevel")).toMatchObject({ correct: true, given: "Carried level on the table rail" });
    const never = new Map<string, SetupDecision>();
    host(initialStudy("normal", "setup-table-move"), never, ...FLUSH_ALL, ...SET_UP, { type: "rhc-advance" }, { type: "answer", index: 0 });
    expect(never.get("setup-relevel")).toMatchObject({ correct: false, given: "Not re-levelled before the study ended" });
  });

  it("an action that changes nothing, and a study without set-up work, log nothing", () => {
    const st = initialStudy("normal");
    expect(setupDecisions(st, st, { type: "setup-read-flush", reading: "optimal" })).toEqual([]);
    const ledger = new Map<string, SetupDecision>();
    host(st, ledger, { type: "rhc-advance" }, { type: "record" }, { type: "sat", site: "PA" }, { type: "answer", index: 0 });
    expect(ledger.size).toBe(0);
  });
});
