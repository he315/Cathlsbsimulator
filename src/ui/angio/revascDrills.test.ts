// The real-library decision drills (angio-decision-drills): the plan drill's 'missing-facts' step shows only
// AngioCAD's own fields and scores the facts the learner says are missing, with no generated value; the drill
// parameter is accepted in a lesson's drill block; the studies the drills draw.
//   npx vitest run src/ui/angio/revascDrills.test.ts
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  angioCadExtent,
  angioCadFields,
  applyDrillParams,
  buildDataset,
  describeDrillParams,
  gradesContradictGensini,
  missingFacts,
  recordedFacts,
  revascSet,
  revascStudies,
  rng,
  scoreMissingFacts,
  type LibPatient,
  type RawDataset,
} from "./library";
import { STABLE_FACTS } from "../../content/decisions/revascStable";
import { validateTrack } from "../../content/validate";
import { buildKnownLaunch, checkLaunchParams } from "../../content/validateLaunch";
import type { Track } from "../../content/schema";
import { ANGIOCAD_SEGMENTS } from "./syntax";

const segs = (g: Record<string, string>) => Object.fromEntries(ANGIOCAD_SEGMENTS.map((s) => [s, g[s] ?? "NL"]));
const run = (id: string, artery: "LCA" | "RCA") => ({ id, dataset: "AngioCAD" as const, patientId: id.slice(0, 6), base: "/x/", frames: ["1.jpg"], fps: 15, artery });
const patient = (p: Partial<LibPatient>): LibPatient => ({
  id: "ac-900",
  dataset: "AngioCAD",
  age: "61",
  sex: "M",
  indication: "SA",
  lvef: "55%",
  diabetes: true,
  smoker: false,
  hypertension: true,
  dyslipidaemia: false,
  dominance: "right",
  gensini: 42,
  segments: segs({ "Prox LAD": "76-90", "Mid LCx": "51-75", "Mid RCA": "26-50", D1: "91-99" }),
  runs: [run("ac-900-1", "LCA"), run("ac-900-2", "RCA")],
  ...p,
});

describe("the missing-facts step shows only the dataset's fields", () => {
  it("angioCadFields lists the dataset's own fields, never a symptom, ischaemia, previous CABG, surgical risk or preference value", () => {
    const f = angioCadFields(patient({}));
    expect(f.map((x) => x.id)).toEqual(["age", "sex", "indication", "lvef", "diabetes", "hypertension", "dyslipidaemia", "smoker", "dominance"]);
    expect(Object.fromEntries(f.map((x) => [x.id, x.value]))).toEqual({
      age: "61 years",
      sex: "male",
      indication: "stable angina",
      lvef: "55%",
      diabetes: "yes",
      hypertension: "yes",
      dyslipidaemia: "no",
      smoker: "no",
      dominance: "right",
    });
    // what the dataset does not have reads as not recorded, not as a value
    const bare = angioCadFields(patient({ age: null, lvef: null, sex: null, dominance: null }));
    expect(bare.filter((x) => x.value === "not recorded").map((x) => x.id)).toEqual(["age", "sex", "lvef", "dominance"]);
    // the segment grades and the Gensini score (the vessel count's answer) are not among the fields
    expect(JSON.stringify(f)).not.toMatch(/76-90|Gensini|42/);
  });

  it("the facts the dataset does not record are the missing ones: symptoms, ischaemic burden, previous CABG, surgical risk, preference, and LV function without an LVEF", () => {
    expect(recordedFacts(patient({}))).toEqual(["extent", "complexity", "diabetes", "lv-function"]);
    expect(missingFacts(patient({}))).toEqual(["symptoms", "ischaemia", "prior-cabg", "surgical-risk", "preference"]);
    expect(missingFacts(patient({ lvef: null }))).toEqual(["symptoms", "ischaemia", "lv-function", "prior-cabg", "surgical-risk", "preference"]);
    // every fact is scored once, missing or recorded
    const sc = scoreMissingFacts(patient({}), ["symptoms", "ischaemia", "prior-cabg", "surgical-risk", "preference"]);
    expect(sc).toMatchObject({ correct: STABLE_FACTS.length, total: STABLE_FACTS.length });
    const wrong = scoreMissingFacts(patient({}), ["diabetes", "symptoms"]);
    expect(wrong.rows.find((r) => r.id === "diabetes")).toMatchObject({ missing: false, chosen: true, correct: false });
    expect(wrong.rows.find((r) => r.id === "ischaemia")).toMatchObject({ missing: true, chosen: false, correct: false });
    expect(wrong.correct).toBe(STABLE_FACTS.length - 5);
  });

  it("the vessel count comes from the AngioCAD grades: over 50% per artery, branches with their parent, 26-50 not counted", () => {
    expect(angioCadExtent(patient({}))).toEqual({ vessels: 2, arteries: ["LAD", "LCx"], leftMain: false, proximalLad: true });
    expect(angioCadExtent(patient({ segments: segs({ LM: "51-75", PDA: "100" }), dominance: "left" }))).toEqual({ vessels: 1, arteries: ["LCx"], leftMain: true, proximalLad: false });
    expect(angioCadExtent(patient({ segments: segs({}) })).vessels).toBe(0);
  });

  it("the studies are stable-angina AngioCAD patients with grades and runs; a set has no repeats", () => {
    const list = [
      patient({ id: "a" }),
      patient({ id: "b", indication: "STEMI" }),
      patient({ id: "c", runs: [] }),
      patient({ id: "d", segments: undefined }),
      patient({ id: "e", dataset: "CADICA" }),
      patient({ id: "f" }),
    ];
    expect(revascStudies(list).map((p) => p.id)).toEqual(["a", "f"]);
    const set = revascSet(revascStudies(list), rng(3));
    expect(new Set(set.map((p) => p.id)).size).toBe(set.length);
  });

  it("a study graded all normal with a Gensini score above 0 is left out (its grades cannot be the answer key)", () => {
    const allNl = patient({ id: "g", segments: segs({}), gensini: 60.5 });
    const normal = patient({ id: "h", segments: segs({}), gensini: 0 });
    const noScore = patient({ id: "i", segments: segs({}), gensini: null });
    expect(gradesContradictGensini(allNl)).toBe(true);
    expect(gradesContradictGensini(normal)).toBe(false);
    expect(gradesContradictGensini(patient({}))).toBe(false);
    expect(revascStudies([allNl, normal, noScore, patient({ id: "a" })]).map((p) => p.id)).toEqual(["h", "i", "a"]);
  });
});

describe("the plan drill's step parameter", () => {
  const track = (params: Record<string, string>, drill = "plan"): Track =>
    ({
      id: "t",
      order: 0,
      title: "t",
      tagline: "",
      description: "",
      stage: 1,
      modules: [{ id: "m", title: "m", stage: 1, summary: "", objectives: ["o"], lessons: [{ id: "x", title: "x", minutes: 1, blocks: [{ kind: "drill", target: "angio-real", drill, params, task: "Decide." }] }], quiz: [] }],
      cases: [],
    }) as unknown as Track;
  const drillErrs = (t: Track) => validateTrack(t, new Set()).filter((e) => /drill|parameter/.test(e));

  it("the lesson block { kind:'drill', target:'angio-real', drill:'plan', params:{ part:'missing-facts' } } validates; another value or drill does not", () => {
    expect(drillErrs(track({ part: "missing-facts" }))).toEqual([]);
    expect(drillErrs(track({ part: "decide" })).join(" ")).toMatch(/parameter part="decide" not one of missing-facts/);
    expect(drillErrs(track({ part: "missing-facts" }, "estimate")).join(" ")).toMatch(/unknown parameter "part" for drill "estimate"/);
    // the old name collides with the technique step that LAUNCH_KEYS reserves
    expect(drillErrs(track({ step: "missing-facts" })).join(" ")).toMatch(/unknown parameter "step" for drill "plan"/);
  });

  it("a launch link to the part passes checkLaunchParams (a 'step' parameter would need a technique)", () => {
    const known = buildKnownLaunch({});
    const ok: string[] = [];
    checkLaunchParams("angio-real", { drill: "plan", part: "missing-facts" }, known, "link", ok);
    expect(ok).toEqual([]);
    const clash: string[] = [];
    checkLaunchParams("angio-real", { drill: "plan", step: "missing-facts" }, known, "link", clash);
    expect(clash.join(" ")).toMatch(/without a technique/);
  });

  it("the parameter is described in the drill header and filters no runs", () => {
    expect(describeDrillParams({ part: "missing-facts" })).toMatch(/decision step/);
    const ctx = { runs: patient({}).runs, patients: [patient({})] };
    expect(applyDrillParams(ctx, "plan", { part: "missing-facts" })).toBe(ctx);
  });
});

describe("on the installed AngioCAD library", () => {
  const file = join(__dirname, "../../../datasets/library/angiocad/index.json");
  it.runIf(existsSync(file))("every study's fields are the dataset's own and some facts are always missing", () => {
    const ds = buildDataset(JSON.parse(readFileSync(file, "utf8")) as RawDataset, "AngioCAD", "angiocad");
    const studies = revascStudies(ds.patients);
    expect(studies.length).toBeGreaterThan(0);
    // no study in the drill set has all-normal grades beside a Gensini score above 0
    expect(studies.filter((p) => Object.values(p.segments ?? {}).every((g) => g === "NL") && (p.gensini ?? 0) > 0)).toEqual([]);
    for (const p of studies) {
      for (const f of angioCadFields(p)) {
        if (f.id === "lvef") expect(f.value).toBe(p.lvef ?? "not recorded");
        if (f.id === "age") expect(f.value).toBe(p.age ? `${p.age} years` : "not recorded");
      }
      expect(missingFacts(p)).toEqual(expect.arrayContaining(["symptoms", "ischaemia", "prior-cabg", "surgical-risk", "preference"]));
    }
  });
});
