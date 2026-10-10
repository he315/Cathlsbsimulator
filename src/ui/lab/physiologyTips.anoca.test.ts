// The coronary function test's tips (physiology-anoca-cft): 'ach-provocation' only while an
// acetylcholine dose runs, with the acetylcholine safety tips at that moment; bradycardia and AV block
// during acetylcholine, coronary-spasm and chest-pain on spasm; no acetylcholine tip in any adenosine
// preset; the waiting.ts entries naming this package become satisfiable with the test's raises; and
// the practice index lists the presets of anoca.launch.ts under their lessons once they are published
// (anoca.launch.ts ANOCA_LAUNCH_ENABLED: held back until the lab mounts the panel).
//   npx vitest run src/ui/lab/physiologyTips.anoca.test.ts
import { describe, expect, it } from "vitest";
import * as TIPS from "../../content/lab/tips";
import { LAB_EVENTS, TIP_BY_ID, tipsFor, type LabContext, type LabTip, type TipTrigger } from "../../content/lab/tips";
import { WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import { ANOCA_LAUNCH_ENABLED, ANOCA_SCENARIOS, launch as anocaLaunch } from "../../content/lab/presets/physiology/anoca.launch";
import { TRACKS, PUBLISHED_CASES } from "../../content";
import { validateLaunchLinks, type LaunchFiles } from "../../content/validateLaunch";
import { ANOCA_PRESET_BY_ID, CFT_IV_ADENOSINE_UG_KG_MIN, cftReadings, cftReducer, initialCftState, type CftAction, type CftState } from "../../simulation/physiology/ach";
import { HYPERAEMIA_PRESETS, PHYSIOLOGY_PRESETS, initialPwSession, pwSessionReducer, type PwAction } from "../../simulation/pci/pwSession";
import { PRACTICE_INDEX, buildPracticeIndex, practiceForCase, practiceForLesson, type PracticeIndex } from "../content/practiceIndex";
import { ACH_ONLY_EVENTS, ADENOSINE_ONLY_TIPS, CFT_EVENTS, CFT_RAISES, cftEvents, cftTipContext, physiologyTipContext, rankCftTips, raises } from "./physiologyTips";

const PKG = "physiology-anoca-cft";
const LESSONS = ["pm-physiology-microvascular", "pm-physiology-indices"];
const ACH_TIPS = ["pci-phys-ach-prepare", "pci-phys-ach-block", "pci-phys-ach-spasm"];
const ids = (ctx: LabContext, n = 20) => tipsFor(ctx, n).map((t) => t.id);

const run = (s: CftState, ...as: CftAction[]) => as.reduce(cftReducer, s);
const tick = (s: CftState, seconds: number, step = 0.5) => {
  for (let i = 0; i < Math.round(seconds / step); i++) s = cftReducer(s, { type: "tick", dt: step });
  return s;
};
function injectUntilAgree(s: CftState, state: "rest" | "hyp"): CftState {
  for (let i = 0; i < 12; i++) {
    s = run(s, { type: "saline", volumeMl: 3, brisk: true }, { type: "tick", dt: 5 });
    const r = cftReadings(s);
    if (state === "rest" ? r.restAgree : r.hypAgree) return s;
  }
  return s;
}
/** The adenosine part of a study, in order, ending ready for acetylcholine; `watch` sees the context at each step. */
function adenosinePart(id: string, watch?: (ctx: LabContext) => void): CftState {
  let s = run(initialCftState(id, "tips"), { type: "gtn", doseUg: 200 });
  watch?.(cftTipContext(s));
  s = injectUntilAgree(s, "rest");
  s = run(s, { type: "iv-adenosine", rate: CFT_IV_ADENOSINE_UG_KG_MIN, site: "central" });
  for (let i = 0; i < 15; i++) {
    s = tick(s, 10);
    watch?.(cftTipContext(s));
  }
  s = injectUntilAgree(s, "hyp");
  watch?.(cftTipContext(s));
  s = run(s, { type: "stop-adenosine" });
  s = tick(s, 120);
  s = run(s, { type: "drift-check" });
  watch?.(cftTipContext(s));
  return run(s, { type: "check", item: "pads" }, { type: "check", item: "pacing" }, { type: "check", item: "nitrate" });
}

describe("named presets show their tips at the moment they apply (acceptance)", () => {
  it("in 'anoca-cmd' (anoca.launch.ts), after the dose that raises 'ach-provocation', tipsFor(ctx, 20) includes pci-phys-ach-prepare and pci-phys-ach-block; before it, no acetylcholine tip", () => {
    expect(ANOCA_SCENARIOS.map((x) => x.id)).toContain("anoca-cmd");
    let s = adenosinePart("anoca-cmd", (ctx) => {
      expect(ctx).toMatchObject({ lab: "pci", phase: "physiology" });
      expect(ctx.events).not.toContain("ach-provocation");
      for (const id of ACH_TIPS) expect(ids(ctx, 40)).not.toContain(id);
    });
    const before = cftTipContext(s);
    expect(before.events).toEqual([]);
    s = run(s, { type: "ach", regimen: "uk-bolus", side: "left", route: "guide" });
    s = tick(s, 2);
    const ctx = cftTipContext(s);
    expect(ctx.events).toContain("ach-provocation");
    expect(ids(ctx, 20)).toEqual(expect.arrayContaining(["pci-phys-ach-prepare", "pci-phys-ach-block"]));
    // the acetylcholine slows the heart: bradycardia joins, and the panel still leads with the acetylcholine tips
    s = tick(s, 10);
    const slow = cftTipContext(s);
    expect(slow.events).toEqual(expect.arrayContaining(["ach-provocation", "bradycardia"]));
    const ranked = rankCftTips(TIPS, tipsFor(slow, 40), slow, 5).map((t) => t.id);
    expect(ranked).toEqual(expect.arrayContaining(["pci-phys-ach-block", "pci-phys-ach-prepare"]));
    for (const id of ADENOSINE_ONLY_TIPS) expect(ranked, id).not.toContain(id);
    // removed, not only ranked last: absent however many tips are asked for, and without a tips module
    const all = rankCftTips(TIPS, tipsFor(slow, 60), slow, 60).map((t) => t.id);
    for (const id of ADENOSINE_ONLY_TIPS) expect(all, id).not.toContain(id);
    for (const id of ADENOSINE_ONLY_TIPS) expect(rankCftTips(null, tipsFor(slow, 60), slow, 60).map((t) => t.id), id).not.toContain(id);
    // once the response has been read, the event and the tips are gone
    s = tick(s, 120);
    const after = cftTipContext(s);
    expect(after.events).not.toContain("ach-provocation");
    for (const id of ACH_TIPS) expect(ids(after, 40)).not.toContain(id);
  });

  it("in 'anoca-epicardial-spasm' the spasm raises coronary-spasm and chest-pain with the spasm tip; nitrate ends them", () => {
    let s = adenosinePart("anoca-epicardial-spasm");
    s = run(s, { type: "ach", regimen: "uk-bolus", side: "left", route: "guide" });
    s = tick(s, 20);
    const ctx = cftTipContext(s);
    expect(ctx.events).toEqual(expect.arrayContaining(["ach-provocation", "coronary-spasm", "chest-pain"]));
    expect(ids(ctx, 20)).toContain("pci-phys-ach-spasm");
    s = tick(run(s, { type: "ic-nitrate" }), 40);
    expect(cftEvents(s)).not.toContain("coronary-spasm");
    expect(cftEvents(s)).not.toContain("chest-pain");
  });

  it("an RCA dose: av-block and bradycardia during acetylcholine, in the RCA context, with the acetylcholine block tip and no adenosine tip", () => {
    let s = adenosinePart("anoca-normal");
    s = run(s, { type: "ach", regimen: "uk-bolus", side: "right", route: "guide" });
    s = tick(s, 12);
    const ctx = cftTipContext(s);
    expect(ctx.vessel).toBe("RCA");
    expect(ctx.events).toEqual(expect.arrayContaining(["ach-provocation", "av-block", "bradycardia"]));
    expect(ids(ctx, 20)).toEqual(expect.arrayContaining(["pci-phys-ach-prepare", "pci-phys-ach-block"]));
    const ranked = rankCftTips(TIPS, tipsFor(ctx, 40), ctx, 5).map((t) => t.id);
    expect(ranked).toContain("pci-phys-ach-block");
    for (const id of ADENOSINE_ONLY_TIPS) expect(ranked, id).not.toContain(id);
    const all = rankCftTips(TIPS, tipsFor(ctx, 60), ctx, 60).map((t) => t.id);
    for (const id of ADENOSINE_ONLY_TIPS) expect(all, id).not.toContain(id);
  });
});

describe("no acetylcholine tip in an adenosine study (acceptance)", () => {
  const adenosineActions: PwAction[][] = [
    [],
    [{ type: "hyperaemia", mode: "iv", rate: 140, site: "peripheral" } as PwAction],
    [{ type: "hyperaemia", mode: "ic", doseUg: 150, fast: false } as PwAction, { type: "flush-guide" } as PwAction],
  ];

  it("no pci-phys-ach-* tip appears in any adenosine-only preset, whatever the preset or a launch declares", () => {
    const presets = [...new Map([...PHYSIOLOGY_PRESETS, ...HYPERAEMIA_PRESETS].map((p) => [p.id, p])).values()];
    expect(presets.length).toBeGreaterThan(20);
    for (const p of presets)
      for (const acts of adenosineActions) {
        let s = initialPwSession(p.id, "ach");
        for (const a of acts) s = pwSessionReducer(s, a);
        for (let i = 0; i < 6; i++) s = pwSessionReducer(s, { type: "tick", dt: 10, patient: { map: p.case.map, hr: 70, rhythm: { kind: "sinus", av: 0 } } });
        // even a launch that asks for the event does not get it
        const ctx = physiologyTipContext(s, null, { patientEvents: ["bradycardia", "av-block"], extra: ["ach-provocation"] });
        expect(ctx.events, p.id).not.toContain("ach-provocation");
        const shown = ids(ctx, 60);
        for (const id of ACH_TIPS) expect(shown, `${p.id}: ${id}`).not.toContain(id);
      }
  });

  it("the coronary function test's own adenosine part raises no acetylcholine event", () => {
    for (const id of Object.keys(ANOCA_PRESET_BY_ID))
      adenosinePart(id, (ctx) => {
        expect(ctx.events, id).not.toContain("ach-provocation");
        for (const t of ACH_TIPS) expect(ids(ctx, 60), `${id}: ${t}`).not.toContain(t);
      });
  });
});

// --- reachability from the lab's raises (the rule of src/content/lab/reachability.test.ts) ---

function satisfiableIn(when: TipTrigger, phases: readonly string[] | undefined, rs: readonly LabRaises[]): boolean {
  const has = (key: "phases" | "events" | "routes" | "procedures" | "techniques" | "imaging", x: string) => rs.some((r) => ((r[key] ?? []) as readonly string[]).includes(x));
  const any = (want: readonly string[] | undefined, key: Parameters<typeof has>[0]) => !want?.length || want.some((x) => has(key, x));
  return any(phases, "phases") && any(when.event, "events") && (when.requires ?? []).every((e) => has("events", e)) && any(when.procedure, "procedures") && any(when.route, "routes") && any(when.technique, "techniques") && any(when.imaging, "imaging");
}
const satisfiableInPci = (tip: LabTip, rs: readonly LabRaises[]) =>
  tip.lab === "pci" ? satisfiableIn(tip.when, tip.when.phase, rs) : !!tip.alsoIn?.some((a) => a.lab === "pci" && satisfiableIn(tip.when, a.phase, rs));

describe("reachability (acceptance)", () => {
  it("the test's raises are in the shared vocabulary; the lab declares them exactly when the presets are published; ach-provocation comes from nothing else", () => {
    for (const e of CFT_EVENTS) expect((LAB_EVENTS as readonly string[]).includes(e), e).toBe(true);
    expect(CFT_RAISES).toMatchObject({ lab: "pci", phases: ["physiology"] });
    expect(raises.events.includes("ach-provocation")).toBe(ANOCA_LAUNCH_ENABLED);
    for (const e of ACH_ONLY_EVENTS) expect(CFT_EVENTS).toContain(e);
  });

  it("every waiting.ts entry naming physiology-anoca-cft becomes satisfiable with the test's raises, so the pci waiting count falls by at least their number", () => {
    const mine = WAITING_TIPS.filter((w) => w.raisedBy === PKG).flatMap((w) => w.tips);
    expect(mine.sort()).toEqual([...ACH_TIPS].sort());
    const withTest: LabRaises = { ...raises, events: [...new Set([...raises.events, ...CFT_RAISES.events])] };
    expect(mine.filter((id) => TIP_BY_ID[id] && !satisfiableInPci(TIP_BY_ID[id], [withTest]))).toEqual([]);
    const pciWaiting = WAITING_TIPS.filter((w) => w.lab === "pci").flatMap((w) => w.tips);
    const stillWaiting = (rs: readonly LabRaises[]) => pciWaiting.filter((id) => TIP_BY_ID[id] && !satisfiableInPci(TIP_BY_ID[id], rs)).length;
    const withoutTest: LabRaises = { ...raises, events: raises.events.filter((e) => !ACH_ONLY_EVENTS.includes(e)) };
    const before = stillWaiting([withoutTest]);
    const after = stillWaiting([withTest]);
    console.info(`${PKG}: ${mine.length} waiting.ts tips name this package; pci tips still waiting ${before} -> ${after} with the coronary function test's raises (declared by the lab: ${ANOCA_LAUNCH_ENABLED})`);
    expect(before - after).toBeGreaterThanOrEqual(mine.filter((id) => TIP_BY_ID[id]).length);
    // and the request tips (pm-physiology#10, #12)
    for (const id of ["pci-phys-thermodilution-boluses", ...ACH_TIPS, "pci-adenosine-block-cough-wait"]) expect(satisfiableInPci(TIP_BY_ID[id], [withTest]), id).toBe(true);
  });
});

// --- launch metadata and the practice index ---

const LAUNCH_FILES = import.meta.glob<LaunchFiles[string]>(["/src/**/*.launch.ts", "!/src/**/__fixtures__/**"], { eager: true });
const ANOCA_FILE = "/src/content/lab/presets/physiology/anoca.launch.ts";
const ENABLED_INDEX: PracticeIndex = buildPracticeIndex({ ...LAUNCH_FILES, [ANOCA_FILE]: { launch: { sim: "physiology", scenarios: ANOCA_SCENARIOS } } });

describe("launch metadata and the practice index (acceptance)", () => {
  it("the glob sees anoca.launch.ts, and it publishes all its scenarios or none, as ANOCA_LAUNCH_ENABLED says", () => {
    expect(Object.keys(LAUNCH_FILES)).toContain(ANOCA_FILE);
    expect(anocaLaunch.sim).toBe("physiology");
    expect(anocaLaunch.scenarios).toEqual(ANOCA_LAUNCH_ENABLED ? ANOCA_SCENARIOS : []);
    const known = PRACTICE_INDEX.known.scenarios.get("physiology");
    for (const x of ANOCA_SCENARIOS) expect(known?.has(x.id) ?? false, x.id).toBe(ANOCA_LAUNCH_ENABLED);
  });

  it("published, the scenarios validate against the curriculum (every lesson and case they name exists, no id is duplicated)", () => {
    // problems of other launch files (packages being built alongside) are theirs to report
    const ours = (ps: readonly string[]) => ps.filter((p) => p.includes("anoca"));
    expect(ours(ENABLED_INDEX.known.problems)).toEqual([]);
    expect(ours(validateLaunchLinks({ tracks: TRACKS, cases: PUBLISHED_CASES }, ENABLED_INDEX.known))).toEqual([]);
  });

  it("published, practiceIndex lists every scenario in anoca.launch.ts under lessons pm-physiology-microvascular and pm-physiology-indices", () => {
    const known = ENABLED_INDEX.known.scenarios.get("physiology");
    for (const x of ANOCA_SCENARIOS) {
      expect(known?.has(x.id), x.id).toBe(true);
      for (const l of LESSONS) {
        const entry = practiceForLesson(l, ENABLED_INDEX).find((e) => e.sim === "physiology" && e.scenario === x.id);
        expect(entry, `${x.id} under ${l}`).toBeDefined();
        expect(entry!.params).toEqual({ scenario: x.id, mode: "guided" });
      }
    }
    expect(practiceForCase("pm-physiology-case-anoca", ENABLED_INDEX).some((e) => e.scenario === "anoca-cmd")).toBe(true);
  });

  it("unpublished, the running index lists none of them (no dead links)", () => {
    if (ANOCA_LAUNCH_ENABLED) return;
    const set = new Set(ANOCA_SCENARIOS.map((x) => x.id));
    for (const l of LESSONS) expect(practiceForLesson(l).filter((e) => e.sim === "physiology" && set.has(e.scenario ?? "")), l).toEqual([]);
  });
});
