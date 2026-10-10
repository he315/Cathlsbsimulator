// The MCS lab's tip context (mcs-console-split-select-and-tips).
//   npx vitest run src/ui/lab/mcsTips.test.ts
import { describe, expect, it } from "vitest";
import { LAB_EVENTS, LAB_PHASES, LAB_PROCEDURES, TIP_BY_ID, tipsFor, type LabTip } from "../../content/lab/tips";
import { PATIENTS, Circulation, impellaPosition, type BeatStats } from "../../simulation/circulation";
import { LEG_NIRS_ISCHAEMIA, MCS_STAGES, mcsEvents, mcsTipContext, mcsVitals, raises, type McsConsole, type McsStage } from "./mcsTips";
import { patientEvents } from "./patientEvents";
import devicesText from "../../content/manual/pci-manual/17-support-devices.ts?raw";

const ids = (tips: LabTip[]) => tips.map((t) => t.id);
/** A pump or ECMO tip: one whose trigger names a procedure and not the balloon pump. */
const pumpOrEcmo = (t: LabTip) => !!t.when.procedure?.length && !t.when.procedure.includes("iabp");

function stats(over: Partial<BeatStats> = {}): BeatStats {
  const c = new Circulation(structuredClone(PATIENTS.normal));
  c.run(6);
  return { ...c.average(3)!, ...over };
}

describe("mcsTipContext", () => {
  it("at phase 'insert' in the balloon pump console no pump or ECMO tip is returned", () => {
    const ctx = mcsTipContext("iabp", "insert", null);
    expect(ctx).toMatchObject({ lab: "mcs", phase: "insert", procedures: ["iabp"] });
    const tips = tipsFor(ctx, 200);
    expect(tips.length).toBeGreaterThan(0);
    expect(tips.filter(pumpOrEcmo).map((t) => t.id)).toEqual([]);
    expect(ids(tips).some((id) => id.startsWith("mcs-impella-") || id.startsWith("mcs-ecmo-"))).toBe(false);
  });

  it("no console shows another console's device tips at any stage", () => {
    const own: Record<McsConsole, RegExp> = { iabp: /^mcs-(impella|ecmo)-/, impella: /^mcs-(iabp|ecmo)-/, ecmo: /^mcs-(iabp|impella)-/ };
    for (const kind of ["iabp", "impella", "ecmo"] as const)
      for (const stage of MCS_STAGES) {
        const got = ids(tipsFor(mcsTipContext(kind, stage, null, { events: ["hypotension", "bleeding", "limb-ischaemia", "air", "vf"] }), 200));
        expect(got.filter((id) => own[kind].test(id)), `${kind} ${stage}`).toEqual([]);
      }
  });

  it("large-bore only while a large-bore device goes in; the vent adds the pump on the VA-ECMO console", () => {
    expect(mcsTipContext("impella", "insert", null).procedures).toEqual(["impella", "large-bore"]);
    expect(mcsTipContext("ecmo", "insert", null).procedures).toEqual(["ecmo", "large-bore"]);
    expect(mcsTipContext("ecmo", "manage", null).procedures).toEqual(["ecmo"]);
    expect(mcsTipContext("ecmo", "manage", null, { vent: true }).procedures).toEqual(["ecmo", "impella"]);
    expect(mcsTipContext("iabp", "insert", null).procedures).toEqual(["iabp"]);
  });

  it("events come from the stats and what the console shows; a complication adds its phase", () => {
    expect(mcsEvents(stats({ suction: true }))).toEqual(["suction"]);
    expect(mcsEvents(null, { impellaPosition: impellaPosition(6.5) })).toEqual(["pump-migration"]);
    expect(mcsEvents(null, { impellaPosition: impellaPosition(3.5) })).toEqual([]);
    expect(mcsEvents(null, { legNirs: 45 })).toEqual(["limb-ischaemia"]);
    expect(mcsEvents(null, { legNirs: 68 })).toEqual([]);
    const ctx = mcsTipContext("impella", "manage", null, { impellaPosition: "ventricle" });
    expect(ctx.phases).toEqual(["complication"]);
    expect(ids(tipsFor(ctx, 50))).toContain("mcs-impella-pulled-back");
    const leg = mcsTipContext("ecmo", "manage", null, { legNirs: 40 });
    expect(ids(tipsFor(leg, 50))).toContain("mcs-ecmo-leg-rescue");
  });

  it("hypotension comes from the shared adapter with its hold, in model time", () => {
    const low = stats({ map: 55, sys: 75, dia: 45 });
    let st = patientEvents(mcsVitals(low, "sinus", 90, 0)).state;
    expect(patientEvents(mcsVitals(low, "sinus", 90, 5), st).events).not.toContain("hypotension");
    st = patientEvents(mcsVitals(low, "sinus", 90, 5), st).state;
    const ev = patientEvents(mcsVitals(low, "sinus", 90, 12), st).events;
    expect(ev).toContain("hypotension");
    expect(patientEvents(mcsVitals(null, "vf", 0, 0)).events).toContain("vf");
    const ctx = mcsTipContext("impella", "manage", low, { events: ev });
    expect(ids(tipsFor(ctx, 50))).toContain("mcs-impella-suction");
  });

  it("the stages are the MCS phases and raises uses the shared vocabulary", () => {
    expect([...MCS_STAGES]).toEqual([...LAB_PHASES.mcs]);
    expect(raises.lab).toBe("mcs");
    for (const p of raises.phases) expect(LAB_PHASES.mcs as readonly string[]).toContain(p);
    for (const e of raises.events) expect(LAB_EVENTS as readonly string[]).toContain(e);
    for (const x of raises.procedures ?? []) expect(LAB_PROCEDURES as readonly string[]).toContain(x);
  });

  it("the leg NIRS threshold is the module's", () => {
    expect(devicesText).toContain("a tissue saturation below 50%, or more than 15% below the other leg, calls for one");
    expect(LEG_NIRS_ISCHAEMIA).toBe(50);
  });

  it("wean is reported once the learner begins weaning", () => {
    for (const kind of ["iabp", "impella", "ecmo"] as const) {
      const got = ids(tipsFor(mcsTipContext(kind, "wean" as McsStage, null), 50));
      expect(got).toContain("mcs-wean-criteria");
    }
    expect(TIP_BY_ID["mcs-wean-criteria"]).toBeTruthy();
  });
});
