// Drug orders as syringe actions in the diagnostic lab (diag-lab-drugs): the patient's response to
// intracoronary nitrate and a pressor, the attending's stops before a drug goes in, the vasodilator
// event, the team's read-back, the chart's nitrate infusion, and the pure helpers (the dose ladder,
// the nitrate cautions, the chart's infusion).
//   npx vitest run src/ui/sim/drugs.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { scenarioCase } from "../../simulation/caseGenerator";
import { generatePatient, chartNitrateInfusionUgMin, nitrateCautions } from "../../simulation/patient/patient";
import { PatientEngine } from "../../simulation/patient/engine";
import { DRUG_RULES as drugRules, NITRATE_DOSE_LADDER, nitrateDoseLimitUg, rules as registeredDrugRules } from "../../mentor/rules/diagDrugs";
import { RULES } from "../../mentor/rules";
import { collectRules } from "../../mentor/rules/index";
import { tabsFor } from "../lab/controls/registry";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { tab as drugsTab } from "../lab/controls/tabs/DrugsTab";
import type { ControlKit } from "../lab/controls/types";
import { LabTeam } from "../lab/labTeam";
import type { AnatomyCase } from "../../types";
import type { AssessmentMode } from "../../mentor/types";
import { DiagnosticLabSession } from "./labSession";
import { DRUGS_MODULE_ID, DRUG_MENU, VASODILATOR_HOLD_S, isVasodilatorDose, menuDoses, routeOfVia, type DrugOrders } from "./modules/drugs";

const g = () => useSimulatorStore.getState();
afterEach(() => g().setPedalImaging(false));

function session(c: AnatomyCase, mode?: AssessmentMode, team = false): DiagnosticLabSession {
  g().loadCase(c, "free");
  if (mode) useSimulatorStore.setState({ policy: { ...g().policy, mode } });
  return new DiagnosticLabSession(useSimulatorStore, null, null, team ? {} : { team: false });
}
const drugsOf = (s: DiagnosticLabSession) => s.modules.find((m) => m.id === DRUGS_MODULE_ID) as DrugOrders;
const run = (s: DiagnosticLabSession, sec: number) => {
  for (let i = 0; i < Math.round(sec * 10); i++) s.step(0.1);
};
const sysTrue = (s: DiagnosticLabSession) => s.engine.vitals().aortaTrue.sys;

/** The nitrate case at its default seed, optionally with a PDE-5 inhibitor taken some hours before. */
function nitrateCase(pde5HoursAgo?: number): AnatomyCase {
  const c = scenarioCase("diag-nitrate-dose-by-pressure")!;
  if (pde5HoursAgo !== undefined) c.chart = { ...c.chart!, drugs: [...(c.chart!.drugs ?? []), { name: "Sildenafil", drugId: "sildenafil", lastDoseHoursAgo: pde5HoursAgo }] };
  return c;
}

describe("the patient's response", () => {
  it("GTN 200 µg IC lowers the systolic pressure within 90 s; with a PDE-5 inhibitor 4 h earlier the fall is larger; phenylephrine reverses it", () => {
    // the plain patient, through the drug module (independent mode: the dose-ladder question is left to the debrief)
    const plain = session(nitrateCase(), "independent");
    run(plain, 10);
    const p0 = sysTrue(plain);
    const m = drugsOf(plain);
    expect(m.order({ entryId: "gtn", dose: 200, via: "manifold" }).ok).toBe(true);
    const given = m.give();
    expect(given.ok).toBe(true);
    run(plain, 90);
    const plainFall = p0 - sysTrue(plain);
    expect(plainFall).toBeGreaterThan(1.5);
    plain.dispose();

    // the same patient 4 h after sildenafil: the attending stops the nitrate, so the dose is given
    // past the attending (the engine directly), as a learner overriding the stop would
    const twin = (): DiagnosticLabSession => {
      const s = session(nitrateCase(4), "independent");
      run(s, 10);
      return s;
    };
    const pde5 = twin();
    expect(pde5.engine.profile.pde5).toEqual({ agent: "sildenafil", hoursAgo: 4 });
    expect(pde5.tipContext().events).toContain("pde5-recent");
    const q0 = sysTrue(pde5);
    expect(drugsOf(pde5).order({ entryId: "gtn", dose: 200, via: "manifold" }).ok).toBe(true);
    const stopped = drugsOf(pde5).give();
    expect(stopped.ok).toBe(false);
    expect(stopped.ok ? "" : stopped.utterance?.ruleId).toBe("nitrate-caution");
    expect(pde5.engine.giveDrug("gtn", 200, "ic", { side: "left" }).ok).toBe(true);
    run(pde5, 90);
    const pdeFall = q0 - sysTrue(pde5);
    expect(pdeFall).toBeGreaterThan(plainFall + 2);

    // phenylephrine 100 µg IV (50-100 µg, Brilakis 3.6) at 90 s, against the same patient without it
    const control = twin();
    control.engine.giveDrug("gtn", 200, "ic", { side: "left" });
    run(control, 90);
    const nadir = sysTrue(pde5);
    const r = drugsOf(pde5).order({ entryId: "phenylephrine", dose: 100, via: "team" });
    expect(r.ok && r.record.status).toBe("given");
    run(pde5, 60);
    run(control, 60);
    expect(sysTrue(pde5)).toBeGreaterThan(nadir + 3);
    expect(sysTrue(pde5)).toBeGreaterThan(sysTrue(control) + 3);
    pde5.dispose();
    control.dispose();
  });

  it("a patient on the chart's IV nitrate infusion starts on it at its steady state, and the bolus response is blunted", () => {
    const c = scenarioCase("diag-nitrate-on-infusion")!;
    expect(chartNitrateInfusionUgMin(c.chart)).toBe(50);
    const on = session(c);
    expect(drugsOf(on).infusionUgMin).toBe(50);
    expect(on.engine.interactionFlags("gtn").map((f) => f.id)).toContain("nitrate-infusion-blunts-bolus");
    const off = session({ ...c, chart: { ...c.chart!, drugs: (c.chart!.drugs ?? []).filter((d) => d.drugId !== "gtn") } });
    expect(drugsOf(off).infusionUgMin).toBeNull();
    // the infusion has lowered the pressure already
    run(on, 20);
    run(off, 20);
    expect(sysTrue(on)).toBeLessThan(sysTrue(off));
    const a0 = sysTrue(on);
    const b0 = sysTrue(off);
    on.engine.giveDrug("gtn", 200, "ic", { side: "left" });
    off.engine.giveDrug("gtn", 200, "ic", { side: "left" });
    run(on, 90);
    run(off, 90);
    expect(a0 - sysTrue(on)).toBeLessThan(b0 - sysTrue(off));
    on.dispose();
    off.dispose();
  });
});

describe("the attending's stops before a drug goes in", () => {
  it("give-ic with the tip state ventricularised returns allow false with an utterance; with a free trace the syringe goes in", () => {
    const s = session(nitrateCase());
    run(s, 2);
    const m = drugsOf(s);
    const r = m.order({ entryId: "gtn", dose: 50, via: "manifold" });
    expect(r.ok).toBe(true);
    const rec = m.onTable()[0];
    expect(rec.via).toBe("manifold");
    s.tipState = "ventricularised";
    const gate = m.gate("give-ic", rec);
    expect(gate.allow).toBe(false);
    expect(gate.utterance?.ruleId).toBe("ic-drug-abnormal-trace");
    expect(gate.utterance?.text).toMatch(/trace/i);
    expect(gate.utterance?.blocking).toBe(true);
    // the give is refused and the syringe stays on the table; nothing reached the patient
    const res = m.give(rec.id);
    expect(res.ok).toBe(false);
    expect(m.onTable()).toHaveLength(1);
    expect(s.tipContext().events).not.toContain("vasodilator-given");
    // with the trace free again the syringe goes in
    s.tipState = "aortic";
    expect(m.gate("give-ic", rec).allow).toBe(true);
    expect(m.give(rec.id).ok).toBe(true);
    expect(s.tipContext().events).toContain("vasodilator-given");
    s.dispose();
  });

  it("a nitrate dose above the ladder for the systolic is questioned in guided and supervised modes and left to the debrief in independent mode", () => {
    for (const [mode, allow] of [["guided", false], ["supervised", false], ["independent", true]] as const) {
      const s = session(nitrateCase(), mode);
      run(s, 2);
      const m = drugsOf(s);
      const sys = m.monitorSystolic()!.sys;
      const limit = nitrateDoseLimitUg(sys)!;
      m.order({ entryId: "gtn", dose: limit + 100, via: "manifold" });
      const g1 = m.gate("give-ic", m.onTable()[0]);
      expect(g1.allow, mode).toBe(allow);
      if (!allow) expect(g1.utterance?.ruleId).toBe("nitrate-dose-band");
      s.dispose();
    }
  });

  it("in independent mode a nitrate dose above the ladder goes in and the question is kept for the debrief", () => {
    const s = session(nitrateCase(), "independent");
    run(s, 2);
    const m = drugsOf(s);
    const limit = nitrateDoseLimitUg(m.monitorSystolic()!.sys)!;
    m.order({ entryId: "gtn", dose: limit + 100, via: "manifold" });
    const rec = m.onTable()[0];
    const r = m.give(rec.id);
    expect(r.ok).toBe(true);
    expect(m.deferred).toHaveLength(1);
    expect(m.deferred[0]).toMatchObject({ ruleId: "nitrate-dose-band", recordId: rec.id });
    // nothing was said or stopped
    expect(m.stops).toHaveLength(0);
    // the gate alone (no action taken) records nothing
    m.order({ entryId: "gtn", dose: limit + 100, via: "manifold" });
    expect(m.gate("give-ic", m.onTable()[0]).allow).toBe(true);
    expect(m.deferred).toHaveLength(1);
    s.dispose();
  });

  it("right ventricular infarction: GTN is stopped with 'nitrate-caution', and the formulary has no interaction for it yet (a known gap)", () => {
    const s = session(scenarioCase("diag-nitrate-hypotension")!, "independent");
    run(s, 2);
    const m = drugsOf(s);
    m.order({ entryId: "gtn", dose: 50, via: "manifold" });
    const r = m.give();
    expect(r.ok ? null : r.utterance?.ruleId).toBe("nitrate-caution");
    // the response to a nitrate is not made larger in RV infarction: no interaction flag is raised
    // (pharmacology.ts has pde5-nitrate, hocm-nitrate and nitrate-infusion-blunts-bolus only)
    const flags = s.engine.interactionFlags("gtn").map((f) => f.id as string);
    expect(flags.filter((f) => /rv|right/i.test(f))).toEqual([]);
    s.dispose();
  });

  it("nitrate is stopped for the chart's cautions: tadalafil inside 48 h, and right ventricular infarction", () => {
    const pde = session(scenarioCase("diag-pde5-patient")!);
    expect(nitrateCautions(pde.engine.profile, { elapsedS: pde.engine.time })).toEqual(["pde5"]);
    expect(pde.tipContext().events).toContain("pde5-recent");
    drugsOf(pde).order({ entryId: "gtn", dose: 50, via: "manifold" });
    const r1 = drugsOf(pde).give();
    expect(r1.ok ? null : r1.utterance?.ruleId).toBe("nitrate-caution");
    // the line sends the learner to the chart without naming what is planted
    expect(r1.ok ? "" : r1.text).not.toMatch(/tadalafil|PDE/i);
    pde.dispose();
    const rv = session(scenarioCase("diag-nitrate-hypotension")!);
    drugsOf(rv).order({ entryId: "gtn", dose: 50, via: "y-connector" });
    const r2 = drugsOf(rv).give();
    expect(r2.ok ? null : r2.utterance?.ruleId).toBe("nitrate-caution");
    rv.dispose();
  });

  it("intra-arterial lidocaine is refused with the seizure warning, and nothing reaches the patient", () => {
    const s = session(nitrateCase());
    const m = drugsOf(s);
    const r = m.order({ entryId: "lidocaine", dose: 50, via: "sheath" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.text).toMatch(/artery/i);
    expect(r.utterance?.ruleId).toBe("ia-lidocaine");
    expect(r.utterance?.text).toMatch(/artery/i);
    expect(r.record?.status).toBe("stopped");
    expect(m.onTable()).toHaveLength(0);
    // the rule's own lines carry the seizure warning (Brilakis)
    expect(drugRules.find((x) => x.id === "ia-lidocaine")!.lines[3]!({} as never)).toMatch(/seizures/);
    // lidocaine IV by the team is an ordinary order
    expect(m.order({ entryId: "lidocaine", dose: 50, via: "team" }).ok).toBe(true);
    s.dispose();
  });

  it("an antiarrhythmic with a contraindication is stopped by 'give': amiodarone in complete heart block without pacing", () => {
    const s = session(nitrateCase());
    run(s, 1);
    s.engine.forceRhythm("chb");
    run(s, 1);
    const r = drugsOf(s).order({ entryId: "amiodarone", dose: 150, via: "team" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("stopped");
      expect(r.utterance?.ruleId).toBe("antiarrhythmic-contraindicated");
    }
    s.dispose();
  });

  it("the drug rules only stop actions; they pass the registry's checks and stay out of RULES until the live attending asks them", () => {
    expect(collectRules({ "./diagDrugs.ts": { order: 310, rules: drugRules } }, []).map((r) => r.id)).toEqual(["ic-drug-abnormal-trace", "ia-lidocaine", "nitrate-caution", "antiarrhythmic-contraindicated", "dose-outside-module-range", "nitrate-dose-band"]);
    expect(registeredDrugRules).toEqual([]);
    for (const r of drugRules) {
      expect(RULES.some((x) => x.id === r.id)).toBe(false);
      expect(r.when({} as never)).toBe(false);
      expect(typeof r.stopOn).toBe("function");
      expect(Object.keys(r.lines).sort()).toEqual(["1", "2", "3", "4", "5"]);
    }
  });
});

describe("the vasodilator event", () => {
  it("IA verapamil raises vasodilator-given for 300 s of lab time", () => {
    expect(VASODILATOR_HOLD_S).toBe(300);
    const s = session(nitrateCase());
    run(s, 1);
    const m = drugsOf(s);
    expect(m.sinceVasodilatorS()).toBeNull();
    const r = m.order({ entryId: "verapamil", dose: 2.5, via: "sheath" });
    expect(r.ok && r.record.route).toBe("ia");
    expect(m.give().ok).toBe(true);
    const t0 = s.wall();
    expect(s.tipContext().events).toContain("vasodilator-given");
    run(s, 295);
    expect(s.wall() - t0).toBeLessThan(VASODILATOR_HOLD_S);
    expect(s.tipContext().events).toContain("vasodilator-given");
    expect(m.sinceVasodilatorS()).toBeGreaterThan(290);
    run(s, 10);
    expect(s.wall() - t0).toBeGreaterThan(VASODILATOR_HOLD_S);
    expect(s.tipContext().events).not.toContain("vasodilator-given");
    s.dispose();
  });

  it("only IC or IA GTN and IA verapamil count as the vasodilator", () => {
    expect(isVasodilatorDose("gtn", "ic")).toBe(true);
    expect(isVasodilatorDose("gtn", "ia")).toBe(true);
    expect(isVasodilatorDose("verapamil", "ia")).toBe(true);
    expect(isVasodilatorDose("gtn", "iv")).toBe(false);
    expect(isVasodilatorDose("heparin", "ia")).toBe(false);
    expect(isVasodilatorDose("phenylephrine", "iv")).toBe(false);
  });
});

describe("orders through the team", () => {
  it("the team reads the order back, draws up the syringe for the table and the operator gives it; the engine's dose raises the vasodilator", () => {
    const e = new PatientEngine({ seed: "drug-team" });
    e.setTip({ location: "aorta" });
    e.advance(5);
    const crew = new LabTeam({ seed: "drug-team", patient: e, imaging: () => ({ fluoroPps: 15, cinePps: 15, fieldCm: 25, fluoroLevel: "normal", fluoroMin: 0 }), catheterSide: () => "left", audioEngine: null });
    const seen: string[] = [];
    crew.onEvents((evs) => evs.forEach((x) => seen.push(x.kind)));
    const order = crew.orderDrug({ drug: "gtn", dose: 200, route: "ic", side: "left" });
    expect(order).not.toBeNull();
    expect(order!.raw).toBe("GTN 200 micrograms intracoronary, left, please.");
    for (let i = 0; i < 400 && crew.syringesOnTable().length === 0; i++) {
      e.advance(0.1);
      crew.step(0.1);
    }
    const said = crew.team.st.utterances.map((u) => u.text);
    expect(said.some((t) => /micrograms of GTN intracoronary/.test(t))).toBe(true);
    expect(crew.orderById(order!.id)?.readbackText).toMatch(/GTN intracoronary/);
    expect(crew.syringesOnTable()).toHaveLength(1);
    crew.confirmReadback();
    expect(crew.giveSyringe("gtn")).toBe(true);
    e.advance(0.1);
    crew.step(0.1);
    expect(seen).toContain("drug.given");
    expect(crew.syringesOnTable()).toHaveLength(0);
    crew.dispose();
  });

  it("through the session's team: read-back, the syringes on the table, and Give gives the syringe drawn up for that order", () => {
    const s = session(nitrateCase(), "independent", true);
    expect(s.crew).not.toBeNull();
    run(s, 2);
    const m = drugsOf(s);
    const r1 = m.order({ entryId: "gtn", dose: 100, via: "manifold" });
    const r2 = m.order({ entryId: "gtn", dose: 200, via: "sheath" });
    expect(r1.ok && r2.ok).toBe(true);
    if (!r1.ok || !r2.ok) return;
    const rec1 = r1.record;
    const rec2 = r2.record;
    expect(rec1.status).toBe("with-team");
    expect(rec1.teamOrderId).toBeDefined();
    for (let i = 0; i < 600 && m.onTable().length < 2; i++) s.step(0.1);
    expect(m.lines(20).map((l) => l.text).join(" ")).toMatch(/micrograms of GTN intracoronary/);
    expect(m.onTable().map((r) => r.id)).toEqual([rec1.id, rec2.id]);
    m.confirm();
    expect(m.lines(20).some((l) => l.text === "Correct.")).toBe(true);
    const crew = s.crew!;
    const res = m.give(rec1.id);
    expect(res.ok).toBe(true);
    s.step(0.1);
    const syr = (id: number | undefined) => crew.team.st.syringes.find((x) => x.orderId === id)!;
    expect(syr(rec1.teamOrderId).givenAt).toBeDefined();
    expect(syr(rec2.teamOrderId).givenAt).toBeUndefined();
    expect(rec1.status).toBe("given");
    expect(rec2.status).toBe("on-table");
    // the table keeps its syringes oldest first
    expect(crew.syringesOnTable().map((x) => x.orderId)).toEqual([rec2.teamOrderId]);
    expect(s.tipContext().events).toContain("vasodilator-given");
    s.dispose();
  });

  it("through the session's team: 'No, cancel' rejects the read-back and the order is declined, nothing drawn up", () => {
    const s = session(nitrateCase(), "independent", true);
    run(s, 2);
    const m = drugsOf(s);
    const r = m.order({ entryId: "gtn", dose: 100, via: "manifold" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // the read-back is spoken, then rejected inside its acknowledgement window
    for (let i = 0; i < 100 && !s.crew!.orderById(r.record.teamOrderId!)?.readbackAt; i++) s.step(0.1);
    m.reject();
    expect(m.teamStatus(r.record) ?? r.record.status).not.toBe("in-progress");
    expect(r.record.status).toBe("declined");
    expect(m.lines(20).some((l) => l.text === "No, that's not right.")).toBe(true);
    run(s, 40);
    expect(m.onTable()).toHaveLength(0);
    expect(s.crew!.syringesOnTable()).toHaveLength(0);
    s.dispose();
  });

  it("the patient answers the PDE-5 question from the chart's patient", () => {
    const p = generatePatient("pde5-ask");
    const make = (pde5?: { agent: "sildenafil" | "tadalafil"; hoursAgo: number }) => {
      const e = new PatientEngine({ profile: { ...p, pde5 }, lesions: [] });
      e.setTip({ location: "aorta" });
      e.advance(2);
      const crew = new LabTeam({ seed: "pde5", patient: e, imaging: () => ({ fluoroPps: 15, cinePps: 15, fieldCm: 25, fluoroLevel: "normal", fluoroMin: 0 }), catheterSide: () => null, audioEngine: null });
      crew.askAboutPde5();
      for (let i = 0; i < 100; i++) crew.step(0.1);
      const said = crew.team.st.utterances.filter((u) => u.speaker === "patient").map((u) => u.text);
      crew.dispose();
      return said.join(" ");
    };
    expect(make({ agent: "sildenafil", hoursAgo: 4 })).toMatch(/Sildenafil, about 4 hours ago/);
    expect(make({ agent: "tadalafil", hoursAgo: 30 })).toMatch(/Tadalafil, yesterday/);
    expect(make()).toMatch(/^No/);
  });
});

describe("the drugs tab and the table", () => {
  it("the drugs tab is registered for the diagnostic lab and shows where the lab provides drug orders", () => {
    const s = session(nitrateCase());
    const ids = tabsFor(s, g().policy).map((t) => t.id);
    expect(ids).toContain("drugs");
    expect(s.capability("drugs")).toBe(drugsOf(s));
    s.dispose();
  });

  it("the tab shows the monitor's systolic, the time since the last vasodilator, the stated doses and the syringe waiting on the table, with no dose advice", () => {
    const s = session(nitrateCase(), "independent");
    run(s, 2);
    const m = drugsOf(s);
    const kit = { Hold: () => null, Seg: () => null } as unknown as ControlKit;
    const html = (mode: AssessmentMode) => renderToString(createElement(drugsTab.Component, { target: s, input: null, policy: { ...g().policy, mode }, kit }));
    let out = html("independent");
    expect(out).toContain("Systolic on the monitor");
    expect(out).toContain(`${m.monitorSystolic()!.sys} mmHg`);
    expect(out).toContain("None given");
    for (const d of ["50 µg", "100 µg", "200 µg"]) expect(out).toContain(d);
    expect(out).toContain("Through the manifold");
    expect(out).toContain("Needle through the Y-connector");
    expect(out).not.toMatch(/recommend/i);
    // the reminder before the first nitrate is a guided aid: guided and supervised modes only
    expect(out).not.toContain("Before the first nitrate");
    expect(html("guided")).toContain("Before the first nitrate");
    expect(html("supervised")).toContain("Before the first nitrate");
    expect(html("exam")).not.toContain("Before the first nitrate");
    m.order({ entryId: "gtn", dose: 100, via: "manifold" });
    out = html("independent");
    expect(out).toContain("Give");
    expect(out).toContain("syringe on the manifold");
    // the way it goes in, in the sentence's case (the connector keeps its capital)
    expect(out.replace(/<!-- -->/g, "")).toContain("Glyceryl trinitrate 100 µg, through the manifold");
    m.order({ entryId: "gtn", dose: 50, via: "y-connector" });
    expect(html("independent")).toContain("needle through the Y-connector");
    m.give(m.onTable()[1].id);
    m.give();
    out = html("independent");
    expect(out).toMatch(/0:0\d/);
    s.dispose();
  });

  it("the syringe on the table: on the manifold, through the Y-connector or on the sheath, full until given", () => {
    const s = session(nitrateCase(), "independent");
    const m = drugsOf(s);
    expect(m.tableSyringe()).toBeNull();
    m.order({ entryId: "gtn", dose: 100, via: "y-connector" });
    expect(m.tableSyringe()).toEqual({ via: "y-connector", label: "Glyceryl trinitrate 100 µg", given: false });
    m.give();
    expect(m.tableSyringe()).toMatchObject({ via: "y-connector", given: true });
    run(s, 20);
    expect(m.tableSyringe()).toBeNull();
    m.order({ entryId: "heparin", dose: 2500, via: "sheath" });
    expect(m.tableSyringe()?.via).toBe("sheath");
    s.dispose();
  });

  it("every menu dose names its source, and each way of giving maps to its route", () => {
    for (const e of DRUG_MENU) {
      expect(e.source.length, e.id).toBeGreaterThan(10);
      expect(e.ref.length, e.id).toBeGreaterThan(5);
      expect(e.doses.length, e.id).toBeGreaterThan(0);
      if (e.vias.includes("team")) expect(e.teamRoute ?? (e.drug === "saline" ? "iv" : undefined), e.id).toBeDefined();
    }
    expect(routeOfVia("manifold", {})).toBe("ic");
    expect(routeOfVia("y-connector", {})).toBe("ic");
    expect(routeOfVia("sheath", {})).toBe("ia");
    expect(routeOfVia("team", { teamRoute: "im" })).toBe("im");
    // the GTN doses are Brilakis's ladder; through the sheath, his 100-200 µg (04-lab-drugs.ts:256)
    const gtn = DRUG_MENU.find((e) => e.id === "gtn")!;
    expect(gtn.doses).toEqual([NITRATE_DOSE_LADDER.lowUg, NITRATE_DOSE_LADDER.midUg, NITRATE_DOSE_LADDER.highUg]);
    expect(menuDoses(gtn, "manifold")).toEqual(gtn.doses);
    expect(menuDoses(gtn, "sheath")).toEqual([100, 200]);
  });

  it("the order is recorded with the systolic the monitor showed", () => {
    const s = session(nitrateCase(), "independent");
    run(s, 2);
    const m = drugsOf(s);
    const sys = m.monitorSystolic();
    expect(sys?.source).toBe("line");
    const r = m.order({ entryId: "saline", dose: 250, via: "team" });
    expect(r.ok && r.record).toMatchObject({ drug: "saline", status: "given", systolic: sys!.sys, route: "fluid" });
    expect(m.orders()).toHaveLength(1);
    s.dispose();
  });
});

describe("the pure helpers", () => {
  it("the dose ladder by systolic pressure (Brilakis 6.3): above 120 200 µg, 100-120 100 µg, below 100 50 µg, none into a vasodilator's fall", () => {
    expect(nitrateDoseLimitUg(135)).toBe(200);
    expect(nitrateDoseLimitUg(121)).toBe(200);
    expect(nitrateDoseLimitUg(120)).toBe(100);
    expect(nitrateDoseLimitUg(100)).toBe(100);
    expect(nitrateDoseLimitUg(99)).toBe(50);
    expect(nitrateDoseLimitUg(92, 60)).toBe(0);
    expect(nitrateDoseLimitUg(92, 900)).toBe(50);
    expect(nitrateDoseLimitUg(130, 60)).toBe(200);
    expect(nitrateDoseLimitUg(null)).toBeNull();
  });

  it("nitrate cautions: the PDE-5 window (24 h, 48 h for tadalafil) moving with the case, obstructive HCM and the history facts", () => {
    const p = generatePatient("cautions");
    expect(nitrateCautions(p)).toEqual([]);
    expect(nitrateCautions({ ...p, pde5: { agent: "sildenafil", hoursAgo: 23 } })).toEqual(["pde5"]);
    expect(nitrateCautions({ ...p, pde5: { agent: "sildenafil", hoursAgo: 23 } }, { elapsedS: 2 * 3600 })).toEqual([]);
    expect(nitrateCautions({ ...p, pde5: { agent: "sildenafil", hoursAgo: 30 } })).toEqual([]);
    expect(nitrateCautions({ ...p, pde5: { agent: "tadalafil", hoursAgo: 30 } })).toEqual(["pde5"]);
    expect(nitrateCautions({ ...p, lvot: { obstructive: true } })).toEqual(["hocm"]);
    expect(nitrateCautions(p, { facts: ["rv-infarction", "hypovolaemia"] })).toEqual(["hypovolaemia", "rv-infarction"]);
  });

  it("the chart's nitrate infusion: a GTN rate given IV within Brilakis's range, else none", () => {
    const d = (dose: string, route = "IV", held = false) => ({ drugs: [{ name: "GTN infusion", drugId: "gtn", dose, route, held }] });
    expect(chartNitrateInfusionUgMin(d("50 µg/min"))).toBe(50);
    expect(chartNitrateInfusionUgMin(d("20 mcg/min"))).toBe(20);
    expect(chartNitrateInfusionUgMin(d("50 µg/min", "oral"))).toBeNull();
    expect(chartNitrateInfusionUgMin(d("50 µg/min", "IV", true))).toBeNull();
    expect(chartNitrateInfusionUgMin(d("500 µg/min"))).toBeNull();
    expect(chartNitrateInfusionUgMin(d("0.4 mg"))).toBeNull();
    expect(chartNitrateInfusionUgMin(undefined)).toBeNull();
  });
});

describe("after the in-app check", () => {
  it("a stopped syringe can be discarded; the table shows and Give takes the newest syringe; 'No, cancel' with no open order discards it", () => {
    const s = session(nitrateCase(), "guided");
    run(s, 2);
    const m = drugsOf(s);
    const limit = nitrateDoseLimitUg(m.monitorSystolic()!.sys)!;
    const big = m.order({ entryId: "gtn", dose: limit + 100, via: "manifold" });
    expect(big.ok).toBe(true);
    if (!big.ok) return;
    const stopped = m.give();
    expect(stopped.ok).toBe(false);
    expect(stopped.ok ? "" : stopped.utterance?.ruleId).toBe("nitrate-dose-band");
    expect(big.record.status).toBe("on-table");
    // a second, smaller syringe: the table shows it, and a bare Give takes it, not the stopped one
    const small = m.order({ entryId: "gtn", dose: 50, via: "y-connector" });
    expect(small.ok).toBe(true);
    if (!small.ok) return;
    expect(m.tableSyringe()).toMatchObject({ via: "y-connector", given: false });
    // the stopped syringe is discarded and cannot be given afterwards
    const d = m.discard(big.record.id);
    expect(d.ok).toBe(true);
    expect(big.record).toMatchObject({ status: "declined", note: "Discarded by the operator." });
    expect(m.give(big.record.id).ok).toBe(false);
    expect(m.onTable().map((r) => r.id)).toEqual([small.record.id]);
    // no order open with the team: 'No, cancel' discards the newest syringe on the table
    expect(m.teamOrderOpen()).toBe(false);
    m.reject();
    expect(small.record.status).toBe("declined");
    expect(m.onTable()).toHaveLength(0);
    expect(m.discard().ok).toBe(false);
    s.dispose();
  });

  it("through the team: a discarded syringe leaves the team's table and the operator's line is shown", () => {
    const s = session(nitrateCase(), "independent", true);
    run(s, 2);
    const m = drugsOf(s);
    const r = m.order({ entryId: "gtn", dose: 100, via: "manifold" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    for (let i = 0; i < 600 && m.onTable().length < 1; i++) s.step(0.1);
    expect(m.onTable()).toHaveLength(1);
    expect(m.discard().ok).toBe(true);
    expect(s.crew!.syringesOnTable()).toHaveLength(0);
    expect(m.lines(20).some((l) => l.text === "Discard that syringe.")).toBe(true);
    s.dispose();
  });

  it("a syringe holding more than the order and the stated range is stopped in guided and supervised modes and left to the debrief in independent mode; a dose the operator typed is not", () => {
    for (const [mode, allow] of [["guided", false], ["supervised", false], ["independent", true], ["exam", true]] as const) {
      const s = session(nitrateCase(), mode);
      run(s, 2);
      const m = drugsOf(s);
      const r = m.order({ entryId: "verapamil", dose: 2.5, via: "sheath" });
      expect(r.ok, mode).toBe(true);
      if (!r.ok) return;
      // the nurse drew up a misheard tenfold dose, and the read-back was confirmed
      r.record.dose = 25;
      const res = m.give(r.record.id);
      expect(res.ok, mode).toBe(allow);
      if (!allow) {
        expect(res.ok ? "" : res.utterance?.ruleId).toBe("dose-outside-module-range");
        expect(res.ok ? "" : res.text).toBe("Stop. Read the syringe label against your order.");
        expect(r.record.status).toBe("on-table");
      } else expect(m.deferred.map((x) => x.ruleId), mode).toContain("dose-outside-module-range");
      s.dispose();
    }
    // the same dose typed as Other by the operator is the operator's choice: not this rule's stop
    const s = session(nitrateCase(), "guided");
    run(s, 2);
    const m = drugsOf(s);
    const typed = m.order({ entryId: "verapamil", dose: 25, via: "sheath" });
    expect(typed.ok).toBe(true);
    if (!typed.ok) return;
    const gate = m.gate("give-ic", typed.record);
    expect(gate.utterance?.ruleId ?? null).not.toBe("dose-outside-module-range");
    expect(m.drugAction(typed.record)).toMatchObject({ orderedDose: 25, statedMaxDose: 3 });
    s.dispose();
  });

  it("the tab offers Correct only while a read-back waits, and the order log uses the team's clock", () => {
    const s = session(nitrateCase(), "independent", true);
    run(s, 2);
    const m = drugsOf(s);
    const kit = { Hold: () => null, Seg: () => null } as unknown as ControlKit;
    const html = () => renderToString(createElement(drugsTab.Component, { target: s, input: null, policy: { ...g().policy, mode: "independent" }, kit })).replace(/<!-- -->/g, "");
    expect(html()).not.toContain(">Correct</button>");
    const r = m.order({ entryId: "gtn", dose: 100, via: "manifold" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.record.clock).toMatch(/^\d\d:\d\d$/);
    for (let i = 0; i < 100 && !m.readbackPending(); i++) s.step(0.1);
    expect(m.readbackPending()).toBe(true);
    expect(html()).toContain(">Correct</button>");
    m.confirm();
    for (let i = 0; i < 600 && m.onTable().length < 1; i++) s.step(0.1);
    expect(m.give().ok).toBe(true);
    s.step(0.1);
    const out = html();
    expect(m.readbackPending()).toBe(false);
    expect(out).not.toContain(">Correct</button>");
    expect(out).not.toContain(">No, cancel</button>");
    // the log's time is the team's clock, the clock the team's lines show
    expect(out).toContain(`${r.record.clock}</span> Glyceryl trinitrate 100 µg`);
    s.dispose();
  });
});
