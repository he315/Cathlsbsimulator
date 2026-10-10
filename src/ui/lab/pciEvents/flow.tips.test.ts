// Tips reached through the flow and closure event sources (pci-flow-closure), driven in a PCI lab session opened
// at the flow starts as lessons open them: the core pack's case at its 'wire-across' start with the closure
// pack's variant. The session does not yet apply the start itself (the package report names the line), so the
// test applies it the way that line will: applyFlowStart on the session's state once, after startPci, with what
// the start asks of the patient engine.
//  - lcx-stemi at no-reflow: before the assessment only the cue (slow-flow) is raised; after the action that
//    raises 'no-reflow' (the learner's assessment naming it) tipsFor(ctx, 20) includes
//    pci-no-reflow-distal-vasodilator and pci-noreflow-pick-agent;
//  - lad-focal at closure-spasm: after the assessment naming spasm, 'coronary-spasm' and the spasm tip;
//  - every waiting.ts entry naming pci-flow-closure becomes satisfiable with this file's raises, and the pci
//    lab's waiting count falls by the number of them that were not satisfiable without it.
//   npx vitest run src/ui/lab/pciEvents/flow.tips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { LAB_TIPS, TIP_BY_ID, tipsFor, type LabContext, type LabTip, type TipTrigger } from "../../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { PciLabSession, policyForMode } from "../../pci/PciLabSession";
import { resolvePciLaunch } from "../../pci/launch";
import { useSeriesStore } from "../../../state/useSeriesStore";
import { applyFlowStart, flowStartPatient, flowStartRecord } from "../../../simulation/pci/actions/bailouts";
import type { PciState } from "../../../simulation/pci/state";
import { pciTipContext } from "../pciTips";
import { submitRecognition, withRecognition } from "./recognition";
import { FLOW_EVENTS, raises as FLOW_RAISES } from "./flow";

const PKG = "pci-flow-closure";

/** Every raises export the reachability report reads (its globs, src/content/lab/reachability.test.ts). */
const RAISE_MODULES = import.meta.glob<LabRaises | readonly LabRaises[] | undefined>(
  ["../pciEvents/*.ts", "../../sim/modules/*.ts", "../../../simulation/session/modules/*.ts", "../*Context.ts", "../../**/*Tips.ts", "!**/*.test.ts"],
  { eager: true, import: "raises" }
);
const declared = (skip?: RegExp): LabRaises[] =>
  Object.entries(RAISE_MODULES)
    .filter(([file, exp]) => !!exp && (!skip || !skip.test(file)))
    .flatMap(([, exp]) => (Array.isArray(exp) ? exp : [exp as LabRaises]))
    .filter((r) => r.lab === "pci");

const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

/** A session at the flow start, with the start applied as the lab's start line will apply it. */
function lab(scenario: string, variant: string): PciLabSession {
  const r = resolvePciLaunch({ scenario, start: "wire-across", variant, mode: "supervised" });
  expect(r.problems).toEqual([]);
  const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true, mode: "supervised", policy: policyForMode("supervised") });
  sessions.push(x);
  const update = (x as unknown as { update(f: (st: PciState) => PciState): void }).update;
  update.call(x, (st) => applyFlowStart(x.s, x.g, st, { variant, start: "wire-across" }));
  expect(flowStartRecord(x.st)?.id).toBe(variant);
  const fp = flowStartPatient(x.st);
  if (fp?.vagal) x.engine.forceVagal(fp.vagal.level, fp.vagal.holdS);
  if (fp?.rhythm) x.engine.forceRhythm(fp.rhythm, "flow start");
  return x;
}

const run = (x: PciLabSession, s: number, dt = 0.1) => {
  for (let t = 0; t < s - 1e-9; t += dt) x.step(dt);
};
const ids = (ctx: LabContext, n = 20) => tipsFor(ctx, n).map((t) => t.id);
const ctxOf = (x: PciLabSession) => pciTipContext(withRecognition(x.snapshot()));

/** The reachability report's rule for one lab's raises. */
function satisfiable(when: TipTrigger, list: readonly LabRaises[]): boolean {
  const u = (k: "phases" | "events" | "imaging") => new Set(list.flatMap((r) => (r[k] ?? []) as readonly string[]));
  const any = (want: readonly string[] | undefined, have: Set<string>) => !want?.length || want.some((x) => have.has(x));
  return any(when.phase, u("phases")) && any(when.event, u("events")) && (when.requires ?? []).every((e) => u("events").has(e)) && any(when.imaging, u("imaging")) && !when.technique?.length && !when.procedure?.length && !when.route?.length;
}

describe("flow and closure tips (pci-flow-closure)", () => {
  it("lcx-stemi at no-reflow: after the action that raises 'no-reflow', the tips include pci-no-reflow-distal-vasodilator and pci-noreflow-pick-agent", () => {
    const x = lab("lcx-stemi", "no-reflow");
    run(x, 2);
    const before = ctxOf(x);
    // before the assessment: the cue only, never the name
    expect(before.events).not.toContain("no-reflow");
    expect(before.events).toContain("slow-flow");
    expect(ids(before)).not.toContain("pci-noreflow-pick-agent");
    // the action: the learner's assessment naming the no-reflow and its grade
    const res = submitRecognition(x, { cause: "no-reflow", timi: 0 });
    expect(res?.recognition?.score.cause).toBe(true);
    run(x, 0.5);
    const ctx = ctxOf(x);
    expect(ctx.events).toContain("no-reflow");
    expect(ctx.phase).toBe("complication");
    const shown = ids(ctx);
    expect(shown).toContain("pci-no-reflow-distal-vasodilator");
    expect(shown).toContain("pci-noreflow-pick-agent");
    // the embolus is thrombus: no plaque-embolisation event
    expect(ctx.events).not.toContain("plaque-embolisation");
  });

  it("rca-calcified at plaque-embolisation: once named, plaque-embolisation is raised with no-reflow", () => {
    const x = lab("rca-calcified", "plaque-embolisation");
    run(x, 1);
    expect(ctxOf(x).events).not.toContain("plaque-embolisation");
    submitRecognition(x, { cause: "no-reflow", timi: 1 });
    run(x, 0.5);
    const ctx = ctxOf(x);
    expect(ctx.events).toEqual(expect.arrayContaining(["no-reflow", "plaque-embolisation"]));
  });

  it("lad-focal at closure-spasm: the narrowing is a cue until the learner names spasm; then coronary-spasm and the spasm tip", () => {
    const x = lab("lad-focal", "closure-spasm");
    run(x, 1);
    const before = ctxOf(x);
    expect(before.events).toEqual(expect.arrayContaining(["new-narrowing", "slow-flow"]));
    expect(before.events).not.toContain("coronary-spasm");
    expect(before.events).not.toContain("acute-closure");
    submitRecognition(x, { cause: "spasm", timi: 1 });
    run(x, 0.5);
    const ctx = ctxOf(x);
    expect(ctx.events).toEqual(expect.arrayContaining(["coronary-spasm", "acute-closure"]));
    expect(ids(ctx, 40)).toContain("pci-closure-spasm");
  });

  it("every waiting.ts entry naming pci-flow-closure becomes satisfiable, and the pci lab's waiting count falls by those this file makes so", () => {
    for (const e of ["no-reflow-refractory", "plaque-embolisation", "new-narrowing", "coronary-spasm", "acute-closure", "slow-flow", "wire-subintimal"]) expect(FLOW_EVENTS).toContain(e);
    expect(FLOW_RAISES.events).toEqual(expect.arrayContaining(["coronary-spasm", "plaque-embolisation", "no-reflow-refractory", "new-narrowing"]));
    const all = declared();
    const without = declared(/(^|\/)flow\.ts$/);
    expect(all.length).toBe(without.length + 1);
    const entries: { id: string; when: TipTrigger }[] = [
      ...WAITING_TIPS.filter((g) => g.raisedBy === PKG).flatMap((g) => g.tips.map((id) => ({ id, when: TIP_BY_ID[id].when }))),
      ...DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG).map((d) => ({ id: d.tipId, when: d.when })),
    ];
    expect(entries.map((e) => e.id).sort()).toEqual(["pci-closure-spasm", "pci-embol-plaque-aspirate", "pci-interp-pseudolesion", "pci-noreflow-pick-agent", "pci-wire-spasm-nitrate"]);
    for (const e of entries) expect(satisfiable(e.when, all), e.id).toBe(true);
    // the waiting count: entries still waiting without this file and with it
    const waiting = (list: readonly LabRaises[]) => entries.filter((e) => !satisfiable(e.when, list)).length;
    const newly = entries.filter((e) => !satisfiable(e.when, without)).map((e) => e.id);
    // pci-noreflow-pick-agent waits for a text change, not a trigger: it was satisfiable already
    expect(newly.sort()).toEqual(["pci-closure-spasm", "pci-embol-plaque-aspirate", "pci-interp-pseudolesion", "pci-wire-spasm-nitrate"]);
    expect(waiting(without) - waiting(all)).toBe(newly.length);
    expect(waiting(all)).toBe(0);
    // across every pci tip, the lab's tips no lab could show fall by at least those
    const pciTips = LAB_TIPS.filter((t: LabTip) => t.lab === "pci");
    const unsat = (list: readonly LabRaises[]) => pciTips.filter((t) => !satisfiable(t.when, list)).length;
    expect(unsat(without) - unsat(all)).toBeGreaterThanOrEqual(newly.filter((id) => WAITING_TIPS.some((g) => g.tips.includes(id))).length);
  });
});
