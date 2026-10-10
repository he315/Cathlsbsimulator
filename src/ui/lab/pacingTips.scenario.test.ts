// Tip integration of the pacing tab, driven from the scenarios of
// src/content/lab/presets/bedside/pacing.launch.ts (pacing-in-lab-scenarios-and-tips), the
// waiting.ts entries this package was expected to make satisfiable, and the practice index.
//   npx vitest run src/ui/lab/pacingTips.scenario.test.ts
import { describe, expect, it } from "vitest";
import * as TIPS from "../../content/lab/tips";
import { LAB_EVENTS, LAB_PHASES, LAB_PROCEDURES, LAB_TIPS, TIP_BY_ID, tipScore, tipsFor, type LabContext, type LabTip, type TipTrigger } from "../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import { launch } from "../../content/lab/presets/bedside/pacing.launch";
import {
  DEFAULT_TCP,
  NO_FAULTS,
  PACING_SCENARIOS,
  PACING_VARIANTS,
  advanceRhythm,
  createRhythm,
  getPacingScenario,
  initialLead,
  nowOf,
  pacingNumerics,
  type PacingContext,
  type PacingScenarioId,
} from "../../simulation/pacing";
import { practiceForLesson } from "../content/practiceIndex";
import {
  PACING_ALIAS_PHASES,
  PACING_PATIENT_EVENTS,
  PACING_PHASE,
  PACING_RAISES,
  PACING_STAGES,
  PERIC_RAISES,
  pacingTipContext,
  pacingTips,
  pacingVitals,
  raises,
  refinePacingTips,
  type PacingStage,
} from "./bedsideTips";
import { PatientEventAdapter, type PatientEvent } from "./patientEvents";
import { tipsVisible } from "./useLabTips";

const PKG = "pacing-in-lab-scenarios-and-tips";
const LESSON = "hb-additional-procedures-pacing";
const ids = (t: readonly LabTip[]) => t.map((x) => x.id);

/** The same rule as reachability.test.ts: a trigger can match given what a lab raises. */
function satisfiable(when: TipTrigger, r: LabRaises, tip: LabTip): boolean {
  if (tip.lab !== r.lab) return false;
  const any = (want: readonly string[] | undefined, have: readonly string[] | undefined) => !want?.length || want.some((x) => (have ?? []).includes(x));
  return (
    any(when.phase, r.phases) &&
    any(when.event, r.events) &&
    (when.requires ?? []).every((e) => r.events.includes(e)) &&
    any(when.procedure, r.procedures) &&
    any(when.route, r.routes) &&
    any(when.technique, r.techniques) &&
    any(when.imaging, r.imaging)
  );
}

/** The patient events of a scenario's untreated rhythm, as the lab's adapter reads the monitor over `seconds`. */
function untreatedEvents(id: PacingScenarioId, seconds: number): PatientEvent[] {
  const sc = getPacingScenario(id);
  const r = createRhythm(sc, 10);
  const c: PacingContext = { scenario: sc, lead: initialLead("femoral"), box: { mode: "OFF", rate: 70, output: 5, sensitivity: 2, connected: false }, tcp: { ...DEFAULT_TCP }, faults: NO_FAULTS };
  const adapter = new PatientEventAdapter();
  let ev: PatientEvent[] = [];
  for (let k = 0; k < seconds / 0.5; k++) {
    advanceRhythm(r, c, 0.5);
    const n = pacingNumerics(r, c);
    ev = adapter.update(
      pacingVitals(nowOf(r), { hr: n.hr, sys: n.sys, dia: n.dia, map: n.map, pacedPct: n.pacedPct, atrial: sc.atrialRate !== null, avBlock: sc.atrialRate !== null && !sc.avConduction })
    );
  }
  return ev;
}

const MOD = { tipsFor: TIPS.tipsFor, tipScore: TIPS.tipScore };

describe("pacingTipContext", () => {
  it("reports lab 'bedside', the stage's phase with the transitional alias, procedures ['pacing'] (and 'tcp' while external pacing is on)", () => {
    for (const stage of PACING_STAGES) {
      const c = pacingTipContext(stage, { events: ["bradycardia"] });
      if (stage === "debrief") {
        expect(c).toBeNull();
        continue;
      }
      expect(c).toMatchObject({ lab: "bedside", phase: PACING_PHASE[stage], phases: ["pacing"], procedures: ["pacing"], events: ["bradycardia"] });
      expect(LAB_PHASES.bedside as readonly string[]).toContain(c!.phase);
    }
    expect(PACING_PHASE.events).toBe("troubleshoot");
    expect(pacingTipContext("assess", { tcp: true })!.procedures).toEqual(["pacing", "tcp"]);
    // only the names this tab declares
    expect(pacingTipContext("test", { events: ["bradycardia", "perforation", "vf", "av-block"] })!.events).toEqual(["bradycardia", "av-block"]);
  });

  it("reads bradycardia, AV block and (after its hold) hypotension from the pacing monitor through the shared adapter", () => {
    const ev = untreatedEvents("inlab-rca-chb-rbbb", 14);
    expect(ev).toEqual(expect.arrayContaining(["bradycardia", "av-block", "hypotension"]));
    // ventricular standstill with P waves is the slowest bradycardia, not asystole
    expect(untreatedEvents("inlab-adenosine-avb", 4)).toEqual(expect.arrayContaining(["bradycardia", "av-block"]));
    // paced at 70 there is no bradycardia
    const v = pacingVitals(30, { hr: 70, sys: 115, dia: 70, map: 85, pacedPct: 100, atrial: true, avBlock: true });
    expect(v.rhythmKind).toBe("paced");
    expect(pacingTipContext("test", {}, v)!.events).toEqual(["av-block"]);
  });

  it("acceptance: in a pacing.launch.ts scenario, after the action that raises 'bradycardia', tipsFor(ctx, 20) includes bed-pace-external-bridge, and at phase 'pacing' bed-pace-sheath-up-femoral", () => {
    const id: PacingScenarioId = "inlab-rca-chb-rbbb";
    expect(launch.scenarios?.some((s) => s.id === id)).toBe(true);
    // the RCA injection that started the run leaves the slow escape on the monitor
    const ev = untreatedEvents(id, 14);
    expect(ev).toContain("bradycardia");
    const assess = pacingTipContext("assess", { events: ev })!;
    expect(tipsFor(assess, 20).map((t) => t.id)).toContain("bed-pace-external-bridge");
    // the context carries phase 'pacing' (the alias the bed-pace tips trigger on today)
    const access = pacingTipContext("access", { events: ev })!;
    expect(access.phases).toContain("pacing");
    expect(tipsFor(access, 20).map((t) => t.id)).toContain("bed-pace-sheath-up-femoral");
    // and the lab shows each at its own stage
    expect(ids(pacingTips(MOD, assess, true))).toContain("bed-pace-external-bridge");
    expect(ids(pacingTips(MOD, access, true))).toEqual(expect.arrayContaining(["bed-pace-sheath-up-femoral", "bed-pace-external-bridge"]));
    expect(ids(pacingTips(MOD, pacingTipContext("position", { events: ev })!, true))).not.toContain("bed-pace-external-bridge");
  });

  it("acceptance: at stage 'test' bed-pace-threshold-margin appears; in exam mode no tips are returned", () => {
    const test = pacingTipContext("test", { events: ["av-block"] })!;
    expect(ids(tipsFor(test, 20))).toContain("bed-pace-threshold-margin");
    const shown = ids(pacingTips(MOD, test, tipsVisible({ mode: "guided", helpAskedAt: null })));
    expect(shown).toContain("bed-pace-threshold-margin");
    expect(shown.length).toBeLessThanOrEqual(5);
    expect(pacingTips(MOD, test, tipsVisible({ mode: "exam", helpAskedAt: 0 }))).toEqual([]);
    // supervised and independent practice: after the learner asks
    expect(pacingTips(MOD, test, tipsVisible({ mode: "independent", helpAskedAt: null }))).toEqual([]);
    expect(ids(pacingTips(MOD, test, tipsVisible({ mode: "independent", helpAskedAt: 12 })))).toContain("bed-pace-threshold-margin");
  });

  it("each bed-pace tip with a recorded retarget shows at the stages that retarget names, and the overdrive tip not in a bradycardia run", () => {
    const pending = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG);
    const allEv = [...PACING_PATIENT_EVENTS];
    for (const d of pending) {
      for (const stage of PACING_STAGES) {
        const c = pacingTipContext(stage, { events: allEv });
        if (!c) continue;
        const want = (d.when.phase ?? []).includes(c.phase!);
        expect(ids(refinePacingTips(tipsFor(c, 200), c, tipScore)).includes(d.tipId), `${d.tipId} at ${stage}`).toBe(want);
      }
    }
    for (const stage of PACING_STAGES) {
      const c = pacingTipContext(stage, { events: allEv });
      if (c) expect(ids(pacingTips(MOD, c, true, 50))).not.toContain("bed-pace-overdrive-vt");
    }
    // once the retargets are applied and removed, the filter passes everything through
    const c = pacingTipContext("test", {})!;
    expect(refinePacingTips(tipsFor(c, 200), c, tipScore, [])).toEqual(tipsFor(c, 200));
    // and no pericardiocentesis tip appears in the pacing tab
    for (const stage of PACING_STAGES) {
      const x = pacingTipContext(stage, { events: allEv });
      if (x) expect(ids(tipsFor(x, 200)).filter((id) => id.startsWith("bed-peri-"))).toEqual([]);
    }
  });

  it("every bed-pace tip in the registry appears in the pacing tab at some stage", () => {
    const pace = LAB_TIPS.filter((t) => t.id.startsWith("bed-pace-") && t.id !== "bed-pace-overdrive-vt");
    const seen = new Set<string>();
    for (const stage of PACING_STAGES) {
      const c = pacingTipContext(stage, { events: [...PACING_PATIENT_EVENTS] });
      if (c) for (const t of pacingTips(MOD, c, true, 50)) seen.add(t.id);
    }
    for (const t of pace) expect(seen.has(t.id), t.id).toBe(true);
  });
});

describe("raises", () => {
  it("uses the shared vocabulary, covers what the pacing context can report, and joins both tabs", () => {
    for (const r of [PACING_RAISES, raises]) {
      expect(r.lab).toBe("bedside");
      for (const p of r.phases) expect(LAB_PHASES.bedside as readonly string[]).toContain(p);
      for (const e of r.events) expect(LAB_EVENTS as readonly string[]).toContain(e);
      for (const x of r.procedures ?? []) expect(LAB_PROCEDURES as readonly string[]).toContain(x);
    }
    for (const stage of PACING_STAGES) {
      const c = pacingTipContext(stage, { events: [...LAB_EVENTS], tcp: true });
      if (!c) continue;
      expect(PACING_RAISES.phases).toContain(c.phase);
      for (const p of c.phases ?? []) expect(PACING_RAISES.phases).toContain(p);
      for (const e of c.events ?? []) expect(PACING_RAISES.events).toContain(e);
      for (const x of c.procedures ?? []) expect(PACING_RAISES.procedures).toContain(x);
    }
    expect(PACING_RAISES.phases).toEqual(expect.arrayContaining([...PACING_ALIAS_PHASES]));
    for (const part of [PERIC_RAISES, PACING_RAISES]) {
      for (const p of part.phases) expect(raises.phases).toContain(p);
      for (const e of part.events) expect(raises.events).toContain(e);
      for (const x of part.procedures ?? []) expect(raises.procedures).toContain(x);
    }
  });

  it("acceptance: every waiting.ts entry naming this package becomes satisfiable, so the bedside waiting count falls by at least their number", () => {
    const retargets = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG);
    const waiting = WAITING_TIPS.filter((g) => g.raisedBy === PKG).flatMap((g) => g.tips);
    expect(retargets.length + waiting.length).toBeGreaterThanOrEqual(9);
    // each entry's trigger (the retarget's new one, or the waiting tip's own) is satisfiable by the bedside lab now
    const ready = (r: LabRaises) => [
      ...retargets.filter((d) => TIP_BY_ID[d.tipId] && satisfiable(d.when, r, TIP_BY_ID[d.tipId])).map((d) => d.tipId),
      ...waiting.filter((id) => TIP_BY_ID[id] && satisfiable(TIP_BY_ID[id].when, r, TIP_BY_ID[id])),
    ];
    expect(ready(raises).sort()).toEqual([...retargets.map((d) => d.tipId), ...waiting].sort());
    // without the pacing tab's raises none of them is
    expect(ready(PERIC_RAISES)).toEqual([]);
    // the bedside waiting count, as the reachability report counts what is still waiting, falls by at least their number
    const deferred = new Map(DEFERRED_RETARGETS.map((d) => [d.tipId, d]));
    const listed = new Set([...WAITING_TIPS.flatMap((g) => g.tips), ...deferred.keys()]);
    const bedside = LAB_TIPS.filter((t) => t.lab === "bedside" && listed.has(t.id));
    const stillWaiting = (r: LabRaises) => bedside.filter((t) => !satisfiable(deferred.get(t.id)?.when ?? t.when, r, t)).length;
    expect(stillWaiting(PERIC_RAISES) - stillWaiting(raises)).toBeGreaterThanOrEqual(retargets.length + waiting.length);
    // and their current triggers (phase 'pacing') are satisfiable too, through the alias
    for (const d of retargets) expect(satisfiable(TIP_BY_ID[d.tipId].when, raises, TIP_BY_ID[d.tipId]), d.tipId).toBe(d.tipId !== "bed-pace-overdrive-vt");
  });
});

describe("launch metadata and the practice index", () => {
  it("pacing.launch.ts declares every scenario of PACING_SCENARIOS and every variant of PACING_VARIANTS, with the same held-out flags", () => {
    expect(launch.sim).toBe("pacing");
    const declared = (launch.scenarios ?? []).map((s) => s.id).sort();
    expect(declared).toEqual(PACING_SCENARIOS.map((s) => s.id).sort());
    for (const s of launch.scenarios ?? []) {
      const want = (PACING_VARIANTS[s.id as PacingScenarioId] ?? []).map((v) => ({ id: v.id, heldOut: !!v.heldOut }));
      const got = (s.variants ?? []).map((v) => (typeof v === "string" ? { id: v, heldOut: false } : { id: v.id, heldOut: !!v.heldOut }));
      expect(got, s.id).toEqual(want);
      // the scenarios themselves are the practice twins: never held out
      expect(s.heldOut ?? false).toBe(false);
      expect(s.lessonIds).toContain(LESSON);
    }
    for (const id of ["inlab-rca-chb-rbbb", "inlab-adenosine-avb", "inlab-amiodarone-avb"])
      expect((launch.scenarios ?? []).find((s) => s.id === id)?.variants?.some((v) => typeof v !== "string" && v.id === "exam" && v.heldOut)).toBe(true);
  });

  it("acceptance: practiceIndex lists every scenario in pacing.launch.ts under lessons hb-additional-procedures-pacing; held-out variants are never listed", () => {
    const under = practiceForLesson(LESSON).filter((e) => e.sim === "pacing");
    for (const s of launch.scenarios ?? []) expect(under.some((e) => e.scenario === s.id && !e.variant), s.id).toBe(true);
    for (const s of launch.scenarios ?? []) for (const l of s.lessonIds) expect(practiceForLesson(l).some((e) => e.sim === "pacing" && e.scenario === s.id), `${s.id} under ${l}`).toBe(true);
    // the practice variant link of the adenosine block
    expect(under.some((e) => e.scenario === "inlab-adenosine-avb" && e.variant === "transient")).toBe(true);
    // nothing held out
    expect(under.filter((e) => e.variant === "exam" || e.params.variant === "exam")).toEqual([]);
  });
});

describe("a context the lab would show", () => {
  it("is a LabContext the registry accepts", () => {
    const c: LabContext | null = pacingTipContext("position" as PacingStage, { events: ["bradycardia"] });
    expect(c && tipScore(TIP_BY_ID["bed-pace-steer-to-apex"], c)).not.toBeNull();
  });
});
