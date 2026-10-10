// The haemodynamics lab's tips reached through its study context (haemo-study-session-and-tips):
// scenario events keep condition tips in their own scenario, the named scenarios show their tips at
// the right phase, the waiting.ts entries naming this package become satisfiable from the lab's own
// raises export, and the practice index lists the core scenarios under their lessons.
//   npx vitest run src/ui/lab/haemoTips.test.ts
import { describe, expect, it } from "vitest";
import * as tipsModule from "../../content/lab/tips";
import { LAB_EVENTS, LAB_PHASES, LAB_TIPS, TIP_BY_ID, tipsFor, type LabContext, type LabEvent, type LabTip, type TipTrigger } from "../../content/lab/tips";
import { WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import { HAEMO_SCENARIOS, type HaemoScenario } from "../../simulation/haemo";
import { HAEMO_HYPOTENSION_MAP, haemoStudyReducer, initialStudy, type HaemoAction, type HaemoStudyState } from "../../simulation/haemoStudy";
import { launch as coreLaunch } from "../../content/lab/presets/haemo/core.launch";
import { launch as asLaunch } from "../../content/lab/presets/haemo/aorticStenosis.launch";
import { PRACTICE_INDEX, practiceForCase, practiceForLesson } from "../content/practiceIndex";
import { PATIENT_EVENT_THRESHOLDS } from "./patientEvents";
import { selectTips } from "./useLabTips";
import { HAEMO_SCENARIO_EVENTS, haemoTipContext, raises } from "./haemoTips";

const play = (st: HaemoStudyState, ...as: HaemoAction[]) => as.reduce(haemoStudyReducer, st);
const ids = (ctx: LabContext, n = 20) => tipsFor(ctx, n).map((t) => t.id);
const ADV: HaemoAction = { type: "rhc-advance" };

/** Study states covering every phase the lab reports, with and without the arterial line. */
function phaseStates(s: HaemoScenario): { label: string; st: HaemoStudyState }[] {
  const out: { label: string; st: HaemoStudyState }[] = [];
  for (const start of s.sets ? ["pre", "post"] : [null]) {
    const base = initialStudy(s.id, start);
    const art = play(base, { type: "art-line", on: true });
    for (const [tag, b] of [
      ["", base],
      ["+art", art],
    ] as const) {
      out.push({ label: `setup${tag}`, st: b });
      let rh = b;
      for (const c of ["RA", "RV", "PA", "PCWP"]) {
        rh = play(rh, ADV);
        out.push({ label: `right-heart ${c}${tag}`, st: rh });
      }
      out.push({ label: `pigtail PA${tag}`, st: play(b, { type: "rhc-catheter", catheter: "pigtail" }, ADV, ADV, ADV) });
      out.push({ label: `left-heart Ao${tag}`, st: play(b, { type: "lhc", position: "Ao" }) });
      out.push({ label: `left-heart LV${tag}`, st: play(b, { type: "lhc", position: "LV" }) });
      out.push({ label: `LV + wedge${tag}`, st: play(rh, { type: "lhc", position: "LV" }) });
      out.push({ label: `shunts${tag}`, st: play(b, { type: "sat", site: "SVC" }) });
      out.push({ label: `calculations${tag}`, st: play(rh, { type: "record" }, { type: "calc-panel", open: true }) });
    }
  }
  return out;
}

describe("the context the lab reports", () => {
  it("raises uses the shared vocabulary and covers every haemo phase", () => {
    expect([...raises.phases].sort()).toEqual([...LAB_PHASES.haemo].sort());
    for (const e of raises.events) expect((LAB_EVENTS as readonly string[]).includes(e), e).toBe(true);
    expect(raises.events).toEqual(expect.arrayContaining(["hypotension", "pulmonary-embolism", "aortic-stenosis", "mitral-stenosis", "constriction", "restriction", "hocm", "cardiogenic-shock"]));
  });

  it("the hypotension threshold is the patient-event adapter's", () => {
    expect(HAEMO_HYPOTENSION_MAP).toBe(PATIENT_EVENT_THRESHOLDS.hypotensionMapMmHg);
  });

  it("phase follows the catheter RA to PCWP (what __lab.haemo.context() reports)", () => {
    let st = initialStudy("normal");
    expect(haemoTipContext(st)).toEqual({ lab: "haemo", phase: "setup", events: [] });
    for (let i = 0; i < 4; i++) {
      st = play(st, ADV);
      expect(haemoTipContext(st).phase).toBe("right-heart");
    }
    st = play(st, { type: "lhc", position: "LV" });
    expect(haemoTipContext(st)).toMatchObject({ phase: "left-heart", phases: ["right-heart"], pressure: "lv" });
  });

  it("an angiographic pigtail on the right reports catheter PIG", () => {
    const st = play(initialStudy("pe-high-risk"), { type: "rhc-catheter", catheter: "pigtail" }, ADV, ADV, ADV);
    expect(haemoTipContext(st)).toMatchObject({ phase: "right-heart", catheter: "PIG", events: ["pulmonary-embolism"] });
  });
});

describe("scenario events keep condition tips in their own scenario", () => {
  it("for every scenario and phase, no tip whose requires names another scenario's event is returned", () => {
    const problems: string[] = [];
    for (const s of HAEMO_SCENARIOS) {
      const own = new Set<LabEvent>(s.events ?? []);
      const foreign = new Set(HAEMO_SCENARIO_EVENTS.filter((e) => !own.has(e)));
      for (const { label, st } of phaseStates(s)) {
        for (const t of tipsFor(haemoTipContext(st), 100)) {
          const bad = (t.when.requires ?? []).filter((e) => foreign.has(e));
          if (bad.length) problems.push(`${s.id} ${label}: ${t.id} requires ${bad.join(", ")}`);
          // a tip gated only on condition events must name one of this scenario's
          const cond = t.when.event ?? [];
          if (cond.length && cond.every((e) => HAEMO_SCENARIO_EVENTS.includes(e)) && !cond.some((e) => own.has(e))) problems.push(`${s.id} ${label}: ${t.id} on ${cond.join("|")}`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it("no pulmonary embolism, constriction, tricuspid, pulmonary valve or HOCM tip appears in an unrelated scenario", () => {
    // the aortic valve studies of haemo-aortic-stenosis-studies (aorticStenosis.launch.ts) are aortic stenosis scenarios too
    const AS_STUDIES = asLaunch.scenarios!.map((x) => x.id);
    const families: [RegExp, string[]][] = [
      [/^haemo-pe-|^haemo-pulmonary-angiography/, ["pe-high-risk"]],
      [/^haemo-constriction-check/, ["constriction"]],
      [/^haemo-constriction-simultaneous/, ["constriction", "restriction"]],
      [/^haemo-hocm-provoke|^haemo-hocm-hypotension/, ["hocm"]],
      [/^haemo-hocm-(pullback|post-ectopic)/, ["hocm", "aortic-stenosis", ...AS_STUDIES]],
      [/^haemo-(tr|ts|ps)-/, []],
      [/^haemo-as-/, ["aortic-stenosis", ...AS_STUDIES]],
      [/^haemo-ms-/, ["mitral-stenosis"]],
    ];
    const problems: string[] = [];
    for (const s of HAEMO_SCENARIOS)
      for (const { label, st } of phaseStates(s))
        for (const id of ids(haemoTipContext(st), 100))
          for (const [re, allowed] of families) if (re.test(id) && !allowed.includes(s.id)) problems.push(`${s.id} ${label}: ${id}`);
    expect(problems).toEqual([]);
  });
});

describe("named scenarios show their tips at the right phase", () => {
  it("pulmonary embolism (pe-high-risk in core.launch.ts): haemo-pe-venous-access-clot at setup, haemo-pe-pa-pressure-limit at right-heart", () => {
    expect(coreLaunch.scenarios?.map((x) => x.id)).toContain("pe-high-risk");
    const setup = haemoTipContext(initialStudy("pe-high-risk"));
    expect(setup.phase).toBe("setup");
    expect(ids(setup)).toContain("haemo-pe-venous-access-clot");
    expect(ids(setup)).not.toContain("haemo-pe-pa-pressure-limit");
    const pa = haemoTipContext(play(initialStudy("pe-high-risk"), ADV, ADV, ADV));
    expect(pa.phase).toBe("right-heart");
    expect(ids(pa)).toContain("haemo-pe-pa-pressure-limit");
    // the angiography protocol only with a pigtail on the right
    expect(ids(pa)).not.toContain("haemo-pulmonary-angiography-protocol");
    const pig = haemoTipContext(play(initialStudy("pe-high-risk"), { type: "rhc-catheter", catheter: "pigtail" }, ADV, ADV, ADV));
    expect(ids(pig)).toContain("haemo-pulmonary-angiography-protocol");
    // and none of them in the normal study at the same moments
    expect(ids(haemoTipContext(initialStudy("normal")))).not.toContain("haemo-pe-venous-access-clot");
  });

  it("valve, pericardial and HOCM studies show their own tips", () => {
    const lvAo = (id: string) => haemoTipContext(play(initialStudy(id), { type: "lhc", position: "LV" }, { type: "art-line", on: true }));
    expect(lvAo("aortic-stenosis").phase).toBe("valves");
    expect(ids(lvAo("aortic-stenosis"))).toEqual(expect.arrayContaining(["haemo-as-simultaneous-gradient", "haemo-as-cross-only-if-discordant"]));
    expect(ids(lvAo("hocm"))).toEqual(expect.arrayContaining(["haemo-hocm-provoke-valsalva-gtn", "haemo-hocm-post-ectopic-aorta"]));
    const ms = haemoTipContext(play(initialStudy("mitral-stenosis"), ADV, ADV, ADV, ADV, { type: "lhc", position: "LV" }));
    expect(ms.phase).toBe("valves");
    expect(ids(ms)).toContain("haemo-ms-wedge-lv-ten-beats");
    const con = haemoTipContext(play(initialStudy("constriction"), ADV));
    expect(ids(con)).toEqual(expect.arrayContaining(["haemo-constriction-check-ventilation", "haemo-constriction-simultaneous-lv-rv"]));
    expect(ids(haemoTipContext(play(initialStudy("restriction"), ADV)))).toContain("haemo-constriction-simultaneous-lv-rv");
  });

  it("shock: hypotension on the arterial line brings the measure-first tip at right-heart, and CPO and PAPi at calculations", () => {
    const rh = haemoTipContext(play(initialStudy("shock-lv"), { type: "art-line", on: true }, ADV));
    expect(rh.events).toEqual(expect.arrayContaining(["cardiogenic-shock", "hypotension"]));
    expect(ids(rh)).toEqual(expect.arrayContaining(["haemo-shock-measure-first", "haemo-hypotension-pattern"]));
    const calc = haemoTipContext(play(initialStudy("shock-lv"), { type: "calc-panel", open: true }));
    expect(calc.phase).toBe("calculations");
    expect(ids(calc)).toEqual(expect.arrayContaining(["haemo-support-cpo-papi", "haemo-support-rhc-thresholds"]));
  });

  it("the run's policy decides visibility: guided shows them, exams show none, supervised only after asking", () => {
    const ctx = haemoTipContext(initialStudy("pe-high-risk"));
    const sel = (mode: "guided" | "supervised" | "exam", helpAskedAt: number | null) => selectTips(tipsModule, ctx, { mode, helpAskedAt }, 20).map((t) => t.id);
    expect(sel("guided", null)).toContain("haemo-pe-venous-access-clot");
    expect(sel("exam", 0)).toEqual([]);
    expect(sel("supervised", null)).toEqual([]);
    expect(sel("supervised", 3)).toContain("haemo-pe-venous-access-clot");
  });
});

// --- reachability from the lab's own raises (the rule of src/content/lab/reachability.test.ts) ---

function satisfiableIn(when: TipTrigger, phases: readonly string[] | undefined, rs: readonly LabRaises[]): boolean {
  const has = (key: "phases" | "events" | "routes" | "procedures" | "techniques" | "imaging", x: string) => rs.some((r) => ((r[key] ?? []) as readonly string[]).includes(x));
  const any = (want: readonly string[] | undefined, key: Parameters<typeof has>[0]) => !want?.length || want.some((x) => has(key, x));
  return any(phases, "phases") && any(when.event, "events") && (when.requires ?? []).every((e) => has("events", e)) && any(when.procedure, "procedures") && any(when.route, "routes") && any(when.technique, "techniques") && any(when.imaging, "imaging");
}
const satisfiableInHaemo = (tip: LabTip, rs: readonly LabRaises[]) =>
  tip.lab === "haemo" ? satisfiableIn(tip.when, tip.when.phase, rs) : !!tip.alsoIn?.some((a) => a.lab === "haemo" && satisfiableIn(tip.when, a.phase, rs));

describe("reachability of the haemodynamic tips from the lab's raises", () => {
  it("every waiting.ts entry naming haemo-study-session-and-tips becomes satisfiable, so the haemo waiting count falls by at least their number", () => {
    const mine = WAITING_TIPS.filter((w) => w.raisedBy === "haemo-study-session-and-tips").flatMap((w) => w.tips);
    expect(mine.length).toBeGreaterThanOrEqual(38);
    const missing = mine.filter((id) => TIP_BY_ID[id] && !satisfiableInHaemo(TIP_BY_ID[id], [raises]));
    expect(missing).toEqual([]);
    const haemoWaiting = WAITING_TIPS.filter((w) => w.lab === "haemo").flatMap((w) => w.tips);
    const stillWaiting = (rs: readonly LabRaises[]) => haemoWaiting.filter((id) => TIP_BY_ID[id] && !satisfiableInHaemo(TIP_BY_ID[id], rs)).length;
    const before = stillWaiting([]);
    const after = stillWaiting([raises]);
    console.info(`haemo tips still waiting: ${before} -> ${after} (of ${haemoWaiting.length} listed); satisfiable haemo tips: ${LAB_TIPS.filter((t) => t.lab === "haemo" && satisfiableInHaemo(t, [raises])).length} of ${LAB_TIPS.filter((t) => t.lab === "haemo").length}`);
    expect(before - after).toBeGreaterThanOrEqual(mine.filter((id) => TIP_BY_ID[id]).length);
  });

  it("the tips left waiting belong to the later haemodynamic packages", () => {
    const left = LAB_TIPS.filter((t) => t.lab === "haemo" && !satisfiableInHaemo(t, [raises])).map((t) => t.id);
    const later = new Set(WAITING_TIPS.filter((w) => w.lab === "haemo" && w.raisedBy !== "haemo-study-session-and-tips").flatMap((w) => w.tips));
    expect(left.filter((id) => !later.has(id))).toEqual([]);
  });
});

describe("launch metadata and the practice index", () => {
  it("core.launch.ts declares every scenario of the library that no other haemo launch file declares, and no other; shock presets start before or after PCI", () => {
    expect(coreLaunch.sim).toBe("haemo");
    // the aortic valve studies are declared in their own launch file (haemo-aortic-stenosis-studies)
    const elsewhere = new Set(asLaunch.scenarios!.map((s) => s.id));
    const core = HAEMO_SCENARIOS.filter((s) => !elsewhere.has(s.id));
    expect(coreLaunch.scenarios?.map((s) => s.id).sort()).toEqual(core.map((s) => s.id).sort());
    expect([...elsewhere].filter((id) => !HAEMO_SCENARIOS.some((s) => s.id === id))).toEqual([]);
    for (const s of core) {
      const decl = coreLaunch.scenarios!.find((x) => x.id === s.id)!;
      // the scenario's own title, written not to give the diagnosis away in the practice list
      expect(decl.title, s.id).toBe(s.title);
      const starts = (decl.starts ?? []).map((x) => (typeof x === "string" ? x : x.id));
      expect(starts, s.id).toEqual(s.sets ? ["pre", "post"] : []);
    }
  });

  it("practiceIndex lists every scenario in core.launch.ts under its lessons, including hb-specific-conditions-as, -mitral and -ar-right", () => {
    expect(PRACTICE_INDEX.known.scenarios.get("haemo")?.size).toBe(HAEMO_SCENARIOS.length);
    for (const s of coreLaunch.scenarios!) {
      expect(s.lessonIds.length, s.id).toBeGreaterThan(0);
      for (const l of s.lessonIds) expect(practiceForLesson(l).some((e) => e.sim === "haemo" && e.scenario === s.id), `${s.id} under ${l}`).toBe(true);
      for (const c of s.caseIds ?? []) expect(practiceForCase(c).some((e) => e.sim === "haemo" && e.scenario === s.id), `${s.id} under case ${c}`).toBe(true);
    }
    const under = (l: string) => practiceForLesson(l).filter((e) => e.sim === "haemo").map((e) => e.scenario);
    expect(under("hb-specific-conditions-as")).toContain("aortic-stenosis");
    expect(under("hb-specific-conditions-mitral")).toContain("mitral-stenosis");
    expect(under("hb-specific-conditions-ar-right")).toContain("acute-ar");
    expect(under("hb-specific-conditions-pe")).toContain("pe-high-risk");
    // the after-PCI decision is linked on its own from the escalation lesson
    expect(practiceForLesson("pm-support-choice-rv").some((e) => e.scenario === "shock-biv" && e.start === "post")).toBe(true);
  });
});
