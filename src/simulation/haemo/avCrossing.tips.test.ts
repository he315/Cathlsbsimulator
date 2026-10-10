// Tips reached through the aortic valve studies (haemo-aortic-stenosis-studies): in the scenarios of
// aorticStenosis.launch.ts the lab's tip context shows the crossing tips at phase 'left-heart' and
// the decision and gradient tips at 'valves'; haemo-as-* tips appear only where aortic stenosis is
// the scenario's condition; hypotension during dobutamine reaches the context; the waiting.ts
// entries naming this package are satisfiable.
//   npx vitest run src/simulation/haemo/avCrossing.tips.test.ts
import { describe, expect, it } from "vitest";
import { LAB_EVENTS, LAB_PHASES, LAB_TIPS, TIP_BY_ID, tipsFor, type LabContext, type LabTip } from "../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import { launch as asLaunch } from "../../content/lab/presets/haemo/aorticStenosis.launch";
import { haemoTipContext, raises as haemoRaises } from "../../ui/lab/haemoTips";
import { HAEMO_SCENARIOS } from "../haemo";
import { haemoStudyReducer, initialStudy, type HaemoAction, type HaemoStudyState } from "../haemoStudy";
import { avStudyEvents, avStudyReducer, initialAvStudy, raises, type AvAction, type AvStudyState } from "./avCrossing";

const play = (st: HaemoStudyState, ...as: HaemoAction[]) => as.reduce(haemoStudyReducer, st);
const playAv = (st: AvStudyState, ...as: AvAction[]) => as.reduce(avStudyReducer, st);
const ids = (ctx: LabContext, n = 20) => tipsFor(ctx, n).map((t) => t.id);
const ADV: HaemoAction = { type: "rhc-advance" };
const PACKAGE = "haemo-aortic-stenosis-studies";

/** The study with the crossing catheter in the aortic root (left heart), and with LV and aortic pressures together (valves). */
const leftHeart = (id: string) => play(initialStudy(id), { type: "lhc", position: "Ao" });
const valves = (id: string) => play(initialStudy(id), { type: "lhc", position: "Ao" }, { type: "lhc", position: "LV" }, { type: "art-line", on: true });

describe("tips in the aortic valve studies", () => {
  it("in as-discordant-cross (aorticStenosis.launch.ts), at phase 'valves' tipsFor(ctx, 20) includes haemo-as-cross-only-if-discordant, at 'left-heart' haemo-as-al1-straight-wire", () => {
    expect(asLaunch.scenarios!.map((s) => s.id)).toContain("as-discordant-cross");
    const v = haemoTipContext(valves("as-discordant-cross"));
    expect(v.phase).toBe("valves");
    expect(ids(v)).toContain("haemo-as-cross-only-if-discordant");
    expect(ids(v)).toContain("haemo-as-simultaneous-gradient");
    const l = haemoTipContext(leftHeart("as-discordant-cross"));
    expect(l.phase).toBe("left-heart");
    expect(ids(l)).toContain("haemo-as-al1-straight-wire");
    expect(ids(l)).not.toContain("haemo-as-cross-only-if-discordant");
  });

  it("every scenario of aorticStenosis.launch.ts shows the crossing tip at 'left-heart' and the decision tip at 'valves'", () => {
    for (const s of asLaunch.scenarios!) {
      expect(ids(haemoTipContext(leftHeart(s.id))), s.id).toContain("haemo-as-al1-straight-wire");
      expect(ids(haemoTipContext(valves(s.id))), s.id).toContain("haemo-as-cross-only-if-discordant");
    }
  });

  it("haemo-as-* tips appear only with aortic-stenosis", () => {
    const asTips = LAB_TIPS.filter((t) => t.id.startsWith("haemo-as-"));
    expect(asTips.length).toBeGreaterThanOrEqual(4);
    for (const t of asTips) expect(t.when.requires, t.id).toContain("aortic-stenosis");
    const problems: string[] = [];
    for (const s of HAEMO_SCENARIOS) {
      const states: [string, HaemoStudyState][] = [
        ["setup", initialStudy(s.id, s.sets ? "pre" : null)],
        ["right-heart", play(initialStudy(s.id, s.sets ? "pre" : null), ADV, ADV, ADV)],
        ["left-heart", leftHeart(s.id)],
        ["valves", valves(s.id)],
        ["calculations", play(leftHeart(s.id), { type: "record" }, { type: "calc-panel", open: true })],
      ];
      for (const [label, st] of states) {
        const ctx = haemoTipContext(st);
        const shown = ids(ctx, 100).filter((id) => id.startsWith("haemo-as-"));
        if (shown.length && !ctx.events?.includes("aortic-stenosis")) problems.push(`${s.id} ${label}: ${shown.join(", ")}`);
      }
    }
    expect(problems).toEqual([]);
    // and a study without aortic stenosis at the same moments shows none
    expect(ids(haemoTipContext(valves("hocm")), 100).filter((id) => id.startsWith("haemo-as-"))).toEqual([]);
    expect(ids(haemoTipContext(leftHeart("normal")), 100).filter((id) => id.startsWith("haemo-as-"))).toEqual([]);
  });

  it("hypotension during dobutamine reaches the lab's context through the study's raise", () => {
    let av = playAv(initialAvStudy("lflg-no-reserve"), { type: "decide", decision: "cross" }, { type: "catheter", catheter: "AL1" }, { type: "wire", wire: "straight-hydrophilic" });
    while (!av.wireAcross) av = avStudyReducer(av, { type: "attempt", style: "controlled", inRoot: true });
    av = playAv(av, { type: "advance" }, { type: "exchange" }, { type: "second-arterial", on: true }, { type: "dobutamine", step: "baseline" });
    for (let i = 0; i < 4; i++) av = avStudyReducer(av, { type: "dobutamine", step: "increase" });
    expect(avStudyEvents(av)).toEqual(["hypotension"]);
    // the panel raises it on the study (ValvePanel.sync)
    const st = play(valves("lflg-no-reserve"), { type: "raise", event: "hypotension" });
    const ctx = haemoTipContext(st);
    expect(ctx.phase).toBe("valves");
    expect(ctx.events).toEqual(expect.arrayContaining(["aortic-stenosis", "low-flow-aortic-stenosis", "hypotension"]));
    // with the right heart catheter in for output, the hypotension pattern tip of the right-heart phase applies
    const withRhc = play(st, ADV, ADV, ADV);
    expect(haemoTipContext(withRhc).phases).toContain("right-heart");
    expect(ids(haemoTipContext(withRhc), 100)).toContain("haemo-hypotension-pattern");
  });
});

describe("what this package raises", () => {
  it("raises uses the shared vocabulary, and the haemo lab's own raises export carries it", () => {
    expect(raises.lab).toBe("haemo");
    for (const p of raises.phases) expect((LAB_PHASES.haemo as readonly string[]).includes(p), p).toBe(true);
    for (const e of raises.events) expect((LAB_EVENTS as readonly string[]).includes(e), e).toBe(true);
    // the reachability report reads src/ui/lab/haemoTips.ts, whose scenario events now include the low-flow event
    for (const e of raises.events) expect(haemoRaises.events, e).toContain(e);
    for (const p of raises.phases) expect(haemoRaises.phases, p).toContain(p);
  });

  it("every waiting.ts entry naming haemo-aortic-stenosis-studies is satisfiable from the haemo lab's raises", () => {
    const has = (r: readonly LabRaises[], key: "phases" | "events", x: string) => r.some((q) => (q[key] as readonly string[]).includes(x));
    const satisfiable = (t: Pick<LabTip, "lab" | "when">, rs: readonly LabRaises[]) =>
      t.lab === "haemo" &&
      (!t.when.phase?.length || t.when.phase.some((p) => has(rs, "phases", p))) &&
      (!t.when.event?.length || t.when.event.some((e) => has(rs, "events", e))) &&
      (t.when.requires ?? []).every((e) => has(rs, "events", e));
    const rs = [haemoRaises, raises];
    const waiting = WAITING_TIPS.filter((w) => w.raisedBy === PACKAGE).flatMap((w) => w.tips);
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PACKAGE);
    for (const id of waiting) expect(TIP_BY_ID[id] && satisfiable(TIP_BY_ID[id], rs), id).toBe(true);
    for (const d of deferred) expect(satisfiable({ lab: TIP_BY_ID[d.tipId]?.lab ?? "haemo", when: d.when }, rs), d.tipId).toBe(true);
    // waiting.ts names this package nowhere today, so the haemo waiting count cannot fall because of it
    console.info(`waiting.ts entries naming ${PACKAGE}: ${waiting.length} waiting tips, ${deferred.length} deferred retargets`);
    // the tips the lesson requested for these studies are all reachable in the haemo lab
    for (const id of ["haemo-as-cross-only-if-discordant", "haemo-as-al1-straight-wire", "haemo-as-simultaneous-gradient", "haemo-as-slow-rise-not-damping"]) expect(satisfiable(TIP_BY_ID[id], rs), id).toBe(true);
  });
});
