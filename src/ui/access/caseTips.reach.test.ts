// proc-tip-context: the access tips the full case makes reachable. At the puncture the case's
// context brings up the puncture tips; the waiting.ts entries that name this package become
// satisfiable from the raises export of caseTips.ts (the reachability report's rule, applied here
// to this package's declaration).
//   npx vitest run src/ui/access/caseTips.reach.test.ts
import { describe, expect, it } from "vitest";
import { LAB_TIPS, TIP_BY_ID, tipsFor, type LabTip, type TipTrigger } from "../../content/lab/tips";
import { WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import { newCaseSession } from "../../simulation/session/caseSession";
import { aimedPose, advanceToFlash, prepare } from "../../simulation/session/autopilot";
import { caseTipContexts, raises } from "./caseTips";

// the reachability report's satisfiability rule (src/content/lab/reachability.test.ts)
const any = (want: readonly string[] | undefined, have: readonly string[]) => !want?.length || want.some((x) => have.includes(x));
function satisfiableIn(when: TipTrigger, phases: readonly string[] | undefined, r: LabRaises | undefined): boolean {
  if (!r) return false;
  return (
    any(phases, r.phases) &&
    any(when.event, r.events) &&
    (when.requires ?? []).every((e) => r.events.includes(e)) &&
    any(when.procedure, r.procedures ?? []) &&
    any(when.route, r.routes ?? []) &&
    any(when.technique, r.techniques ?? []) &&
    any(when.imaging, r.imaging ?? [])
  );
}
function satisfiable(tip: LabTip, list: readonly LabRaises[]): boolean {
  const of = (lab: string) => list.find((r) => r.lab === lab);
  if (satisfiableIn(tip.when, tip.when.phase, of(tip.lab))) return true;
  return (tip.alsoIn ?? []).some((a) => satisfiableIn(tip.when, a.phase, of(a.lab)));
}

/** Every lab's raises, globbed as the reachability report globs them (paths relative to this file). */
const RAISE_MODULES = import.meta.glob<LabRaises | readonly LabRaises[] | undefined>(
  ["../lab/pciEvents/*.ts", "../sim/modules/*.ts", "../../simulation/session/modules/*.ts", "../lab/*Context.ts", "../**/*Tips.ts", "!**/*.test.ts"],
  { eager: true, import: "raises" }
);
function declared(skip?: string): LabRaises[] {
  const out: LabRaises[] = [];
  for (const [file, exp] of Object.entries(RAISE_MODULES)) {
    if (!exp || (skip && (file === skip || file.endsWith(`/${skip}`)))) continue;
    out.push(...(Array.isArray(exp) ? exp : [exp as LabRaises]));
  }
  return out;
}
/** The union per lab, as the report merges them. */
function merged(list: readonly LabRaises[]): LabRaises[] {
  const by = new Map<string, LabRaises>();
  for (const r of list) {
    const m = by.get(r.lab);
    const u = <T,>(a: readonly T[] | undefined, b: readonly T[] | undefined) => [...new Set([...(a ?? []), ...(b ?? [])])];
    by.set(r.lab, m ? { lab: r.lab, phases: u(m.phases, r.phases), events: u(m.events, r.events), routes: u(m.routes, r.routes), procedures: u(m.procedures, r.procedures), techniques: u(m.techniques, r.techniques), imaging: u(m.imaging, r.imaging) } : r);
  }
  return [...by.values()];
}

/**
 * Tips that need limb-ischaemia. The full case has no occlusion cause to raise it from (no femoral artery
 * size, no plug in the lumen, no embolus), and the plan gives that cause to access-closure-femoral-devices
 * and access-cx-endovascular-control (modules/endovascular.ts). waiting.ts now lists both tips under
 * access-cx-endovascular-control (moved by repair-launch-fixture-and-tip-ties), so they no longer wait on
 * this package; the tests below check that they stay out of this package's group and become satisfiable
 * once something raises limb-ischaemia.
 */
const SCENARIO_ONLY = new Set(["access-cx-cold-leg-six-ps", "access-closure-cold-leg"]);

describe("access tips reachable in the full case", () => {
  it("at phase 'puncture' tipsFor(ctx, 20) includes access-needle-flashback-check, and access-central-vein-no-blood once the hub shows no blood at a neck vein", () => {
    // a radial puncture taken through the back wall: no blood at the hub
    const { session: s } = newCaseSession({ seed: "c5-back", access: "radial-right" });
    prepare(s);
    s.placeNeedle(aimedPose(s));
    expect(advanceToFlash(s)).toBe(true);
    const at = caseTipContexts(s, "access")[0];
    expect(at).toMatchObject({ lab: "access", phase: "puncture", route: "radial" });
    expect(tipsFor(at, 20).map((t) => t.id)).toContain("access-needle-flashback-check");
    let through = false;
    for (let i = 0; i < 60 && !through; i++) through = s.advanceNeedle(0.2).some((e) => e.kind === "back-wall");
    s.advanceNeedle(1.5);
    const ctx = caseTipContexts(s, "access")[0];
    expect(ctx.events).toContain("no-flashback");
    const list = tipsFor(ctx, 20).map((t) => t.id);
    expect(list).toContain("access-needle-flashback-check");
    // the neck-vein tip is for a jugular or subclavian puncture only: never at the wrist ...
    expect(list).not.toContain("access-central-vein-no-blood");
    // ... and it appears with the same step and events at a jugular site (the full case has no jugular site yet)
    const neck = tipsFor({ ...ctx, phases: undefined, route: "jugular" }, 20).map((t) => t.id);
    expect(neck).toEqual(expect.arrayContaining(["access-needle-flashback-check", "access-central-vein-no-blood"]));
  });

  it("every waiting.ts entry naming proc-tip-context becomes satisfiable, and the cold-leg tips wait on access-cx-endovascular-control", () => {
    const group = WAITING_TIPS.find((g) => g.raisedBy === "proc-tip-context");
    expect(group).toBeDefined();
    const missing = group!.tips.filter((id) => !TIP_BY_ID[id]);
    expect(missing).toEqual([]);
    const notYet = group!.tips.filter((id) => !satisfiable(TIP_BY_ID[id], raises));
    expect(notYet).toEqual([]);
    for (const id of SCENARIO_ONLY) expect(group!.tips, id).not.toContain(id);
    expect(WAITING_TIPS.find((g) => g.raisedBy === "access-cx-endovascular-control")?.tips).toEqual(expect.arrayContaining([...SCENARIO_ONLY]));
    // the reachability report's count for the access lab, with and without this package's declaration
    expect(declared().length).toBeGreaterThan(declared("caseTips.ts").length);
    const access = LAB_TIPS.filter((t) => t.lab === "access");
    const without = merged(declared("caseTips.ts"));
    const withIt = merged(declared());
    const before = access.filter((t) => satisfiable(t, without)).length;
    const after = access.filter((t) => satisfiable(t, withIt)).length;
    // a few waiting tips were reachable already through their diagnostic borrow (alsoIn); every other one is new
    const already = group!.tips.filter((id) => satisfiable(TIP_BY_ID[id], without));
    const fresh = group!.tips.filter((id) => !already.includes(id) && satisfiable(TIP_BY_ID[id], withIt));
    expect(fresh.length).toBe(group!.tips.length - already.length);
    expect(after - before).toBeGreaterThanOrEqual(fresh.length);
    console.info(`access tips satisfiable: ${before} -> ${after} of ${access.length}; waiting on proc-tip-context: ${group!.tips.length}, now ready ${already.length + fresh.length}`);
  });

  it("the cold-leg tips are satisfiable once a scenario raises limb-ischaemia", () => {
    const withScenario: LabRaises[] = raises.map((r) => (r.lab === "access" ? { ...r, events: [...r.events, "limb-ischaemia"] } : r));
    for (const id of SCENARIO_ONLY) expect(satisfiable(TIP_BY_ID[id], withScenario), id).toBe(true);
  });
});
