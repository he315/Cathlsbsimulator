// The rhythm and haemodynamic events of the diagnostic lab (diag-rhythm-haemodynamic-events), through the lab
// session: the engine's hazard model judges each push (no fixed conus rule), contrast held by an obstructing tip
// raises contrast-hold-up and a higher VF probability, the rhythm orders and the attending's chart checks, the
// scenarios' causes, the practice index, the Rhythm tab, and the tips the VF raises.
//   npx vitest run src/ui/sim/rhythm.session.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { scenarioCase } from "../../simulation/caseGenerator";
import { TIP_BY_ID, tipsFor, type LabTip, type TipTrigger } from "../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import { raises as diagnosticRaises } from "../lab/diagnosticContext";
import { practiceForLesson } from "../content/practiceIndex";
import { MP_INTERACTION } from "../../simulation/patient/pharmacology";
import { rhythmSetups, scenarios as rhythmScenarios, vagalMimicCause } from "../../simulation/diagnosticScenarios/rhythm";
import { launch as rhythmLaunch } from "../../simulation/diagnosticScenarios/rhythm.launch";
import { hypotensionCause } from "../../simulation/patient/hypotensionCauses";
import { vagalTimeLimitFinding } from "../../mentor/rules/diagRhythm";
import TableSideControls from "../lab/TableSideControls";
import type { AnatomyCase, EngagementState } from "../../types";
import { DIAG_HYPOTENSION_CAUSES, DiagnosticLabSession, MP_RHYTHM_ORDERS, RHYTHM_TIP_EVENTS, chartObstructiveHcm, culpritFromLesions, engineOptionsForCase, profileFromChart, vagalMimicCauseId } from "./labSession";

const PKG = "diag-rhythm-haemodynamic-events";
const g = () => useSimulatorStore.getState();
afterEach(() => g().setPedalImaging(false));

function session(c: AnatomyCase): DiagnosticLabSession {
  g().loadCase(c, "free");
  return new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, physics: false });
}
const run = (s: DiagnosticLabSession, seconds: number, dt = 0.05) => {
  for (let t = 0; t < seconds - 1e-9; t += dt) s.step(dt);
};
const tipIds = (s: DiagnosticLabSession) => tipsFor(s.tipContext(), 20).map((t) => t.id);

/** Put a catheter at a place in the legacy classifier's terms, as the other session tests do. */
function seat(cath: string, kind: EngagementState["kind"], extra: Partial<EngagementState> = {}) {
  if (g().catheterId !== cath) g().setCatheter(cath);
  const left = kind.endsWith("-lm");
  const right = kind.endsWith("-rca");
  const e: Partial<EngagementState> = { kind, target: left ? "left" : right ? "right" : null, isSelective: kind.startsWith("selective-") || kind.startsWith("deep-"), isDeep: kind.startsWith("deep-"), conus: false, depth: kind.startsWith("deep-") ? 3 : 0, quality: 0.8, ...extra };
  useSimulatorStore.setState({ engagement: { ...g().engagement, ...e } as EngagementState, aspirated: "clean" });
}

/** A hand push of `holdS` seconds, released, with the flow left to stop. */
function push(s: DiagnosticLabSession, holdS = 2.5) {
  expect(s.startInjection()).toBe(true);
  run(s, holdS);
  s.releaseInjection();
  run(s, 0.6);
}

describe("VF comes from the engine's hazard model, not from a fixed conus rule", () => {
  it("diag-vf-causes: a conus injection is judged by the model (a push risk with the conus, VF in some seeds and not others); the store never fibrillates by itself", () => {
    let vfSeeds = 0;
    let quietSeeds = 0;
    for (let i = 1; i <= 8; i++) {
      const s = session(scenarioCase("diag-vf-causes", String(i))!);
      expect(g()._rhythmOwner).not.toBeNull();
      expect(g().catheterId).toBe("JR4");
      s.setTimeOutDone(true);
      seat("JR4", "selective-rca", { conus: true });
      run(s, 1.5);
      push(s);
      const r = s.lastPushRisk()!;
      expect(r.input.conus).toBe(true);
      expect(r.input.coronary).toBe(true);
      expect(r.pushP).toBeGreaterThan(0.1);
      run(s, 0.5);
      // the store's arrhythmia follows the engine: VF only where the engine fibrillated
      const engineVf = s.engine.vitals().rhythmKind === "vf";
      expect(g().arrhythmia === "vf").toBe(engineVf);
      if (engineVf) vfSeeds++;
      else quietSeeds++;
      // a conus injection is a dangerous injection whatever the rhythm did
      expect(g().events.some((e) => e.code === "damped-injection")).toBe(true);
      s.dispose();
      expect(g()._rhythmOwner).toBeNull();
    }
    expect(vfSeeds + quietSeeds).toBe(8);
    expect(quietSeeds).toBeGreaterThan(0);
  });

  it("a selective injection with a free trace carries no injection hazard", () => {
    const s = session(scenarioCase("diag-vf-causes")!);
    s.setTimeOutDone(true);
    seat("JR4", "selective-rca");
    run(s, 2);
    expect(s.tipState).toBe("aortic");
    push(s);
    const r = s.lastPushRisk()!;
    expect(r.input.tipState).toBe("aortic");
    expect(r.pushP).toBe(0);
    run(s, 4);
    expect(r.dwellS).toBe(0);
    s.dispose();
  });

  it("an injection with the ostium obstructed and contrast present after 4 s raises contrast-hold-up and a higher VF probability", () => {
    const s = session(scenarioCase("diag-damping-causes")!);
    s.setTimeOutDone(true);
    seat("JL4", "selective-lm");
    run(s, 3);
    expect(["damped", "wedged", "ventricularised"]).toContain(s.tipState);
    push(s);
    const after0 = s.lastPushRisk()!;
    const pushOnly = after0.pushP;
    expect(pushOnly).toBeGreaterThan(0);
    run(s, 5);
    expect(s.contrast).not.toBeNull();
    expect(s.activeEvents()).toContain("contrast-hold-up");
    const held = s.lastPushRisk()!;
    expect(held.dwellS).toBeGreaterThan(4);
    expect(held.dwellP).toBeGreaterThan(0);
    expect(held.totalP).toBeGreaterThan(pushOnly);
    s.dispose();
  });

  it("a VF episode records the catheter, its engagement, the tip state and the shocks, and the store follows the engine back to an organised rhythm", () => {
    const s = session(scenarioCase("diag-vf-causes")!);
    s.setTimeOutDone(true);
    seat("JR4", "selective-rca", { conus: true });
    run(s, 1.5);
    s.engine.forceRhythm("vf", "test");
    run(s, 0.5);
    expect(g().arrhythmia).toBe("vf");
    expect(g().events.some((e) => e.code === "vf-arrest")).toBe(true);
    const ep = s.vfEpisodes[s.vfEpisodes.length - 1];
    expect(ep.catheterId).toBe("JR4");
    expect(ep.conus).toBe(true);
    expect(ep.engagement).toBe("selective-rca");
    const cap = s.capability("rhythm")!;
    // a defibrillator left in synchronised mode does not discharge in VF
    cap.setMode("synchronised");
    cap.charge();
    run(s, 6);
    const sync = cap.shock();
    expect(sync.ok).toBe(false);
    expect(s.engine.vitals().defib.charged).toBeGreaterThan(0);
    cap.setMode("unsynchronised");
    for (let k = 0; k < 5 && s.engine.vitals().rhythmKind === "vf"; k++) {
      if (!(s.engine.vitals().defib.charged > 0)) {
        cap.charge();
        run(s, 6);
      }
      cap.clear();
      expect(cap.shock().ok).toBe(true);
      run(s, 1);
    }
    expect(s.engine.vitals().rhythmKind).not.toBe("vf");
    run(s, 0.5);
    expect(g().arrhythmia).toBe("none");
    expect(ep.endedAt).not.toBeNull();
    expect(ep.shocks).toBeGreaterThan(0);
    // the shock outcomes stay in the record, not on the tab's log
    expect(cap.record().orders.some((o) => o.kind === "shock" && o.outcome !== undefined)).toBe(true);
    expect(cap.readout().log.every((o) => !("outcome" in o))).toBe(true);
    s.dispose();
  });
});

describe("the rhythm orders and the attending's chart checks", () => {
  it("amiodarone ordered with chart long QT is stopped with a reason; in the same patient lidocaine goes in, and a patient without a long QT gets amiodarone", () => {
    const s = session(scenarioCase("diag-lv-vt")!);
    // the chart's ECG reaches the engine's QTc (540 ms, the module text's patient)
    expect(s.engine.profile.baseline.qtc).toBeCloseTo(0.54, 3);
    expect(s.engine.profile.baseline.qtc).toBeGreaterThanOrEqual(MP_INTERACTION.longQtcS);
    const cap = s.capability("rhythm")!;
    const r = cap.give("amiodarone-300");
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("not stopped");
    expect(r.reason).toBe("stopped");
    expect(r.text.length).toBeGreaterThan(10);
    expect(r.utterance?.ruleId).toBe("chart-long-qt-amiodarone");
    // the stop sends the learner back to the ECG without naming the planted problem at level 1
    expect(cap.record().stops.length).toBe(1);
    expect(cap.give("lidocaine-50").ok).toBe(true);
    // the drug orders of diag-lab-drugs (the Drugs tab) stop it too, through the formulary's long-QT flag
    const drugs = s.capability("drugs");
    if (drugs) {
      const d = drugs.order({ entryId: "amiodarone", dose: 300, via: "team" });
      expect(d.ok).toBe(false);
    }
    s.dispose();
    const plain = session(scenarioCase("diag-vf-causes")!);
    expect(plain.engine.profile.baseline.qtc).toBeLessThan(MP_INTERACTION.longQtcS);
    expect(plain.capability("rhythm")!.give("amiodarone-300").ok).toBe(true);
    plain.dispose();
  });

  it("diag-arrhythmia-contraindications: fast AF at the start; flecainide (structural disease) and amiodarone (long QT) are stopped; sedation and a synchronised shock convert it", () => {
    const s = session(scenarioCase("diag-arrhythmia-contraindications")!);
    run(s, 4);
    expect(s.engine.vitals().rhythmKind).toBe("af");
    expect(s.engine.vitals().hr!).toBeGreaterThan(130);
    const cap = s.capability("rhythm")!;
    const f = cap.give("flecainide");
    expect(f.ok).toBe(false);
    if (!f.ok) expect(f.utterance?.ruleId).toBe("flecainide-structural");
    const a = cap.give("amiodarone-150");
    expect(a.ok).toBe(false);
    if (!a.ok) expect(a.utterance?.ruleId).toBe("chart-long-qt-amiodarone");
    // the poor LV on the chart rules out verapamil
    const vr = cap.give("verapamil-5");
    expect(vr.ok).toBe(false);
    if (!vr.ok) expect(vr.utterance?.ruleId).toBe("verapamil-poor-lv");
    expect(cap.give("heparin-5000").ok).toBe(true);
    expect(cap.give("midazolam-1").ok).toBe(true);
    run(s, 120);
    cap.setMode("synchronised");
    cap.setEnergy(200);
    let converted = false;
    for (let k = 0; k < 4 && !converted; k++) {
      cap.charge();
      run(s, 6);
      cap.clear();
      cap.shock();
      run(s, 1);
      converted = s.engine.vitals().rhythmKind === "sinus";
    }
    expect(converted).toBe(true);
    s.dispose();
  });

  it("diag-bradycardia-pace: the first right coronary injection brings complete block that atropine does not lift; a transvenous wire paces it after its set-up time", () => {
    const s = session(scenarioCase("diag-bradycardia-pace")!);
    s.setTimeOutDone(true);
    seat("JR4", "selective-rca");
    run(s, 2);
    push(s);
    run(s, 4);
    expect(s.engine.vitals().av).toBe(3);
    expect(s.tipContext().events).toContain("av-block");
    const cap = s.capability("rhythm")!;
    expect(cap.give("atropine-1").ok).toBe(true);
    run(s, 60);
    expect(s.engine.vitals().av).toBe(3);
    expect(s.engine.vitals().hr!).toBeLessThan(50);
    expect(s.tipContext().events).toContain("bradycardia");
    expect(cap.orderPacing("transvenous", 70).ok).toBe(true);
    expect(cap.readout().pacing.state).toBe("setting-up");
    run(s, MP_RHYTHM_ORDERS.transvenousPacingSetupS - 10);
    expect(cap.readout().pacing.state).toBe("setting-up");
    run(s, 15);
    expect(cap.readout().pacing.state).toBe("pacing");
    run(s, 6);
    expect(s.engine.vitals().rhythmKind === "paced" || s.engine.vitals().hr! >= 65).toBe(true);
    s.dispose();
  });

  it("diag-amplatz-hypotension: the Amplatz deep on the cusp holds the valve open and the pressure falls; withdrawn, it recovers without a drug", () => {
    const s = session(scenarioCase("diag-amplatz-hypotension")!);
    expect(g().catheterId).toBe("AL1");
    s.setTimeOutDone(true);
    seat("AL1", "selective-lm");
    run(s, 10);
    const before = s.engine.vitals().aortaTrue;
    seat("AL1", "deep-lm");
    run(s, 25);
    expect(s.engine.aorticRegurgitation).toBeGreaterThan(0);
    const deep = s.engine.vitals().aortaTrue;
    expect(deep.dia).toBeLessThan(before.dia - 5);
    seat("AL1", "selective-lm");
    run(s, 25);
    expect(s.engine.aorticRegurgitation).toBe(0);
    expect(s.engine.vitals().aortaTrue.dia).toBeGreaterThan(deep.dia + 3);
    s.dispose();
  });

  it("diag-vagal-vs-bleed: the pulse slows before the pressure falls; legs up, atropine and saline do not restore it; the record keeps when the learner reconsidered and the look finds the cause", () => {
    for (const seed of ["1", "2"]) {
      const c = scenarioCase("diag-vagal-vs-bleed", seed)!;
      const s = session(c);
      const cause = vagalMimicCauseId(c.id);
      expect(cause).toBe(seed === "1" ? "diag-hidden-bleed" : "diag-vagal-tamponade");
      expect(vagalMimicCause(seed)).toBe(seed === "1" ? "hidden-bleed" : "tamponade");
      if (cause === "diag-hidden-bleed") {
        // the high puncture bleeds behind the peritoneum (site.ts)
        expect(s.puncture?.space).toBe("retroperitoneal");
        expect(s.puncture?.slowPulse).toBe(true);
      }
      s.setTimeOutDone(true);
      run(s, 2);
      const hr0 = s.engine.vitals().hr!;
      const map0 = s.engine.vitals().aortaTrue.mean;
      run(s, rhythmSetups["diag-vagal-vs-bleed"].hypotension!.afterS + 20);
      expect(s.hypotensionCauseStarted()?.id).toBe(cause);
      // the slowing comes first: the rate is down before the pressure has fallen far
      expect(s.engine.vitals().hr!).toBeLessThan(hr0 - 8);
      expect(s.tipContext().events).toContain("vagal");
      const cap = s.capability("rhythm")!;
      cap.setLegsUp(true);
      expect(cap.give("atropine-1").ok).toBe(true);
      cap.give("saline-250");
      cap.setVagalTimeLimit(180);
      run(s, 180);
      // not restored
      expect(s.engine.vitals().aortaTrue.mean).toBeLessThan(map0 - 10);
      // a contrast run has been given, so the pelvis can be screened
      s.engine.contrast(8, "root", { hazard: false });
      const look = cap.reconsider(cause === "diag-hidden-bleed" ? "bleeding" : "tamponade");
      expect(look.ok).toBe(true);
      expect(look.text).toMatch(cause === "diag-hidden-bleed" ? /bladder is pushed/ : /pericardial effusion/);
      const rec = cap.record();
      expect(rec.vagal.treatedAt).not.toBeNull();
      expect(rec.vagal.limitS).toBe(180);
      expect(rec.vagal.reconsideredAt! - rec.vagal.treatedAt!).toBeGreaterThan(170);
      expect(vagalTimeLimitFinding(rec.vagal, { recovered: false }).ok).toBe(true);
      expect(vagalTimeLimitFinding({ ...rec.vagal, limitS: null, limitSetAt: null }, { recovered: false }).ok).toBe(false);
      expect(rec.hypotensionCause?.id).toBe(cause);
      if (cause === "diag-hidden-bleed") expect(s.tipContext().events).toContain("bleeding");
      // treating the cause answers it
      cap.treat(cause === "diag-hidden-bleed" ? "control-bleeding" : "drain-pericardium");
      expect(s.hypotensionRun()!.stopped()).toBe(true);
      s.dispose();
    }
  });
});

describe("the true vasovagal reaction recovers", () => {
  it("diag-vagal-vs-bleed at seed 3 is a true vasovagal reaction: the rate falls before the pressure, and legs up, atropine and saline restore it within a few minutes", () => {
    const c = scenarioCase("diag-vagal-vs-bleed", "3")!;
    expect(vagalMimicCauseId(c.id)).toBe("vagal");
    const s = session(c);
    s.setTimeOutDone(true);
    run(s, 2);
    const map0 = s.engine.vitals().aortaTrue.mean;
    const hr0 = s.engine.vitals().hr!;
    run(s, rhythmSetups["diag-vagal-vs-bleed"].hypotension!.afterS + 8);
    // the slowing first: the rate is down while the pressure has fallen less than it will
    const early = s.engine.vitals();
    expect(early.hr!).toBeLessThan(hr0 - 10);
    run(s, 15);
    const low = s.engine.vitals().aortaTrue.mean;
    expect(low).toBeLessThan(map0 - 10);
    const cap = s.capability("rhythm")!;
    cap.setLegsUp(true);
    cap.give("atropine-1");
    cap.give("saline-250");
    cap.setVagalTimeLimit(180);
    // a clear improvement within a minute, and back to the baseline within a few minutes
    run(s, 60);
    expect(s.engine.vitals().aortaTrue.mean).toBeGreaterThan(low + 10);
    run(s, 180);
    expect(s.engine.vitals().aortaTrue.mean).toBeGreaterThan(map0 - 8);
    expect(s.hypotensionRun()!.stopped()).toBe(true);
    expect(vagalTimeLimitFinding(cap.record().vagal, { recovered: true }).ok).toBe(true);
    s.dispose();
  });
});

describe("the patient from the chart", () => {
  it("an obstructive outflow on the echo gives obstructive HCM, a negated one does not; a planned thrombotic target gives the culprit", () => {
    expect(chartObstructiveHcm({ echo: { note: "Asymmetric septal hypertrophy with LVOT obstruction at rest." } })).toBe(true);
    expect(chartObstructiveHcm({ echo: { note: "Normal LV size and function. No outflow tract obstruction." } })).toBe(false);
    expect(chartObstructiveHcm({ echo: { note: "Mild septal hypertrophy." } })).toBe(false);
    const base = rhythmScenarios[0].chart;
    const hcm = profileFromChart("x", { ...base, echo: { lvef: 65, note: "Obstructive hypertrophic cardiomyopathy." } }, "SA");
    expect(hcm.lvot?.obstructive).toBe(true);
    expect(culpritFromLesions([{ vessel: "RCA", position: 0.2, severity: 100, kind: "thrombotic" }])).toEqual({ segment: "Prox RCA", grade: 6 });
    expect(culpritFromLesions([{ vessel: "LAD", position: 0.5, severity: 60, kind: "moderate-stenosis" }])).toBeNull();
    // a STEMI chart whose seeded draw had no culprit takes the scenario's thrombotic target
    let fixed = 0;
    for (let i = 0; i < 40; i++) {
      const p = profileFromChart(`stemi-${i}`, base, "STEMI");
      const q = profileFromChart(`stemi-${i}`, base, "STEMI", [{ vessel: "LAD", position: 0.1, severity: 100, kind: "thrombotic" }]);
      expect(q.culprit).not.toBeNull();
      if (!p.culprit) {
        fixed++;
        expect(q.culprit).toEqual({ segment: "Prox LAD", grade: 6 });
      } else expect(q.culprit).toEqual(p.culprit);
    }
    expect(fixed).toBeGreaterThanOrEqual(0);
    // the library cases are unchanged
    const lib = engineOptionsForCase({ id: "lib", chart: undefined, scenarioId: undefined });
    expect(lib).toEqual({ seed: "lib" });
  });
});

describe("the hypotension causes, the practice index and the tab", () => {
  it("the diagnostic causes are registered with the shared model", () => {
    for (const c of DIAG_HYPOTENSION_CAUSES) expect(hypotensionCause(c.id)).toBe(c);
    expect(hypotensionCause("diag-hidden-bleed")!.signature.rate).toBe("slow");
    expect(hypotensionCause("diag-amplatz-cusp")!.mechanism).toBe("cardiac");
  });

  it("practiceIndex lists the scenarios diag-vf-causes, diag-vagal-vs-bleed, diag-amplatz-hypotension under lessons cp-complex-patients-lab-arrest, pm-lab-drugs-antiarrhythmics, cm-patient-complications-hypotension (from rhythm.launch.ts)", () => {
    const listed = (lesson: string, id: string) => practiceForLesson(lesson).some((e) => e.sim === "cathlab" && e.scenario === id);
    expect(listed("cp-complex-patients-lab-arrest", "diag-vf-causes")).toBe(true);
    expect(listed("pm-lab-drugs-antiarrhythmics", "diag-vagal-vs-bleed")).toBe(true);
    expect(listed("cm-patient-complications-hypotension", "diag-amplatz-hypotension")).toBe(true);
    for (const sc of rhythmLaunch.scenarios ?? []) for (const lessonId of sc.lessonIds) expect(listed(lessonId, sc.id), `${sc.id} under ${lessonId}`).toBe(true);
    expect((rhythmLaunch.scenarios ?? []).map((x) => x.id)).toEqual(rhythmScenarios.map((x) => x.id));
  });

  it("the Rhythm tab follows Drugs in the diagnostic strip and shows the orders, with nothing that names the rhythm", () => {
    const s = session(scenarioCase("diag-vf-causes")!);
    const html = renderToString(createElement(TableSideControls, { session: s, input: null, initialTab: "rhythm" })).replace(/<!-- -->/g, "");
    expect(html).toContain(">Rhythm</button>");
    for (const k of ["Sync on", "Sync off", "200 J", "All clear", "Shock", "External pacing", "Transvenous wire", "Flat, legs up", "Amiodarone 300 mg IV", "Atropine 0.5 mg IV", "Reconsider at 3 min", "Look for bleeding"]) expect(html).toContain(k);
    for (const k of ["Ventricular fibrillation", "Ventricular tachycardia", "Atrial fibrillation", "retroperitoneal", "tamponade"]) expect(html).not.toContain(k);
    s.dispose();
  });
});

describe("the tips the rhythm events need", () => {
  it("in scenario diag-vf-causes, after the action that raises 'vf' (a conus injection that fibrillates), tipsFor(ctx, 20) includes diag-vf-catheter-cause and diag-vf-shock-then-amiodarone", () => {
    let found = false;
    for (let i = 1; i <= 40 && !found; i++) {
      const s = session(scenarioCase("diag-vf-causes", String(i))!);
      s.setTimeOutDone(true);
      seat("JR4", "selective-rca", { conus: true });
      run(s, 1.5);
      expect(tipIds(s)).not.toContain("diag-vf-catheter-cause");
      push(s);
      run(s, 0.6);
      if (s.engine.vitals().rhythmKind === "vf") {
        found = true;
        const ctx = s.tipContext();
        expect(ctx.phase).toBe("inject");
        expect(ctx.events).toContain("vf");
        const ids = tipIds(s);
        expect(ids).toContain("diag-vf-catheter-cause");
        expect(ids).toContain("diag-vf-shock-then-amiodarone");
        expect(s.vfEpisodes[0].cause).toMatch(/conus|contrast held/);
      }
      s.dispose();
    }
    expect(found).toBe(true);
  });

  it("every waiting.ts entry naming diag-rhythm-haemodynamic-events is satisfiable from the diagnostic lab's raises, and the tips this package makes reachable are satisfiable", () => {
    const r: LabRaises = diagnosticRaises;
    const can = (tip: LabTip, w: TipTrigger) =>
      (!w.phase?.length || w.phase.some((p) => r.phases.includes(p))) && (!w.event?.length || w.event.some((e) => r.events.includes(e))) && (w.requires ?? []).every((e) => r.events.includes(e)) && tip.lab === "diagnostic";
    const waiting = WAITING_TIPS.filter((w) => w.raisedBy === PKG).flatMap((w) => w.tips);
    for (const id of waiting) expect(can(TIP_BY_ID[id], TIP_BY_ID[id].when), id).toBe(true);
    for (const d of DEFERRED_RETARGETS.filter((x) => x.raisedBy === PKG)) expect(can(TIP_BY_ID[d.tipId], d.when), d.tipId).toBe(true);
    for (const e of RHYTHM_TIP_EVENTS) expect(r.events, e).toContain(e);
    for (const id of ["diag-vf-catheter-cause", "diag-vf-shock-then-amiodarone", "diag-bradycardia-atropine-or-pace", "diag-vagal-sequence", "diag-hypo-amplatz-valve", "diag-reaction-or-vagal"]) {
      const tip = TIP_BY_ID[id];
      expect(tip, id).toBeDefined();
      expect(can(tip, tip.when), id).toBe(true);
    }
  });
});
