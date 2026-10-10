import { describe, it, expect } from "vitest";
import { newCaseSession, type CaseSession } from "./caseSession";
import { fastForward } from "./autopilot";
import { launch as defaultLaunch } from "./scenarios/default.launch";
import { SCENARIO_BY_ID } from "./scenarios/index";
import { TIP_BY_ID } from "../../content/lab/tips";
import { TRACKS } from "../../content/index";
import { PRACTICE_INDEX, practiceForLesson } from "../../ui/content/practiceIndex";
import { ledgerRows } from "../../ui/access/panels";
import type { DecisionRecord } from "../../mentor/ledger";

// proc-foundation-scenarios-ledger: practice links of the full-case scenarios, and the lessons and
// tips the ledger names.

const LESSON_IDS = new Set(TRACKS.flatMap((t) => t.modules.flatMap((m) => m.lessons.map((l) => l.id))));

describe("full-case practice links", () => {
  it("practiceIndex lists every scenario in default.launch.ts under the lessons it names, and every named lessonId resolves", () => {
    expect(defaultLaunch.sim).toBe("procedure");
    for (const sc of defaultLaunch.scenarios ?? []) {
      expect(SCENARIO_BY_ID[sc.id]).toBeDefined();
      expect(SCENARIO_BY_ID[sc.id].lessonIds).toEqual(sc.lessonIds);
      expect(sc.lessonIds.length).toBeGreaterThan(0);
      for (const lessonId of sc.lessonIds) {
        expect(LESSON_IDS.has(lessonId), lessonId).toBe(true);
        const entries = practiceForLesson(lessonId);
        expect(entries.some((e) => e.sim === "procedure" && e.scenario === sc.id && e.params.scenario === sc.id)).toBe(true);
      }
    }
    expect(PRACTICE_INDEX.known.problems.filter((p) => p.includes("default.launch"))).toEqual([]);
    // the starts are the autopilot's stages
    const starts = PRACTICE_INDEX.known.scenarios.get("procedure")!.get("default")!.starts;
    expect([...starts.keys()]).toEqual(["chart", "access", "sheath-in", "post-diagnostic", "closure", "recovery"]);
  });

  it("the root-table and closure lessons open the default case at the start that fits them", () => {
    const linked = { "pm-to-the-root-table": "sheath-in", "pm-closure-plan": "closure" } as const;
    for (const [lessonId, start] of Object.entries(linked)) {
      expect(LESSON_IDS.has(lessonId), lessonId).toBe(true);
      expect(defaultLaunch.links?.some((l) => l.scenario === "default" && l.start === start && l.lessonIds.includes(lessonId))).toBe(true);
      const entries = practiceForLesson(lessonId).filter((e) => e.sim === "procedure" && e.scenario === "default");
      expect(entries.map((e) => e.params.start)).toEqual([start]);
    }
    // the title on the picker and in the lesson box is the same, and says what the case is
    expect(defaultLaunch.scenarios![0].title).toBe(SCENARIO_BY_ID.default.title);
    expect(SCENARIO_BY_ID.default.title).toBe("Random patient");
  });
});

/** Cases that between them make every scored step of the session. */
function ledgerCases(): DecisionRecord[] {
  const all: DecisionRecord[] = [];
  const take = (s: CaseSession) => all.push(...s.decisions());
  // a clean radial case to the handover note (played here: a start stage clears the autopilot's decisions)
  const r = newCaseSession({ seed: "lt-radial", access: "radial-right" }).session;
  fastForward(r, "recovery");
  r.submitHandover(r.truth());
  take(r);
  // a femoral case pulled early and compressed off the arteriotomy, with a blind wire advance
  const f = newCaseSession({ seed: "lt-femoral", access: "femoral", start: "sheath-in" }).session;
  f.prepCatheter("JR4");
  f.runPending();
  f.loadCatheter("JR4");
  f.beamOn = false;
  for (let i = 0; i < 40; i++) f.commandWire(1, 0);
  fastForward(f, "closure");
  f.femoralManual(5, 20);
  f.runPending();
  take(f);
  // a femoral closure device without an angiogram
  const d = newCaseSession({ seed: "lt-device", access: "femoral", start: "closure" }).session;
  d.femoralDevice();
  d.runPending();
  take(d);
  // an anticoagulated patient punctured at the groin
  const a = newCaseSession({ access: "femoral", scenario: { id: "lt-oac", title: "Test OAC", lessonIds: [], seed: "lt-oac", profile: { doac: { agent: "rivaroxaban", hoursSinceDose: 20 } } } }).session;
  fastForward(a, "sheath-in");
  take(a);
  return all;
}

describe("ledger lessons and tips", () => {
  const records = ledgerCases();

  it("the cases cover every scored step", () => {
    const ids = new Set(records.map((r) => r.id));
    for (const id of [
      "time-out-backed",
      "time-out-before-puncture",
      "local-anaesthetic",
      "anticoagulated-route",
      "sheath-aspirated",
      "catheter-prepped",
      "radial-heparin",
      "wire-under-fluoroscopy",
      "aspirate-before-flush",
      "line-flushed",
      "transducer-zero-level",
      "femoral-act",
      "femoral-compression",
      "femoral-angiogram",
      "patent-haemostasis",
      "handover-note",
    ])
      expect(ids.has(id), id).toBe(true);
    const wrong = new Set(records.filter((r) => !r.correct).map((r) => r.id));
    for (const id of ["wire-under-fluoroscopy", "femoral-act", "femoral-compression", "femoral-angiogram", "anticoagulated-route"]) expect(wrong.has(id), id).toBe(true);
  });

  it("every ledger record that names a teaching tip id resolves in TIP_BY_ID, and every lesson id resolves", () => {
    for (const r of records) {
      if (r.lessonId) expect(LESSON_IDS.has(r.lessonId), `${r.id}: ${r.lessonId}`).toBe(true);
      for (const t of r.tipIds ?? []) expect(TIP_BY_ID[t], `${r.id}: ${t}`).toBeDefined();
    }
    expect(records.some((r) => (r.tipIds ?? []).length > 0)).toBe(true);
  });

  it("the summary's ledger rows show each named tip beside its decision", () => {
    const rows = ledgerRows(records, TIP_BY_ID);
    expect(rows).toHaveLength(records.length);
    for (const row of rows) {
      expect(row.tips.map((t) => t.id)).toEqual(row.decision.tipIds ?? []);
      for (const t of row.tips) expect(t.title).toBe(TIP_BY_ID[t.id].title);
    }
    // before the tip registry loads, no tip is shown
    expect(ledgerRows(records, null).every((r) => r.tips.length === 0)).toBe(true);
  });
});
