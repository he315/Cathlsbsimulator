// pci-tip-context: the PCI lab's tip context as a pure function of the session snapshot. Phases,
// events from the event-source registry (src/ui/lab/pciEvents/*.ts), the transient hold, the CTO and
// acute-occlusion rule, the recognition gate, the finish rule, and the raises the reachability report
// reads (with the count of PCI tips still waiting).
//   npx vitest run src/ui/lab/pciTips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { LAB_EVENTS, LAB_PHASES, LAB_TIPS, TIP_BY_ID, type LabContext, type LabEvent, type LabTip, type TipTrigger } from "../../content/lab/tips";
import { WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import { PciLabSession, raises as sessionRaises } from "../pci/PciLabSession";
import { useSeriesStore } from "../../state/useSeriesStore";
import { advanceDevice, backloadDevice, checkLabel, engageGuide, loadIvus, moveDevice, moveWire, pinWire, prepareDevice, requestDevice, setValve, setWireKind, startPci, type PciState } from "../../simulation/angioPci";
import { pathTo } from "../../simulation/pci/geometry";
import type { Complication } from "../../simulation/complications/types";
import type { Placed } from "../../simulation/pci/state";
import { pciTipContext, sourceActive, type PciTipSnapshot } from "./pciTips";
import { PCI_EVENT_SOURCES, PCI_EVENT_SOURCE_PROBLEMS, collectPciEventSources, raises as indexRaises, type PciEventSource } from "./pciEvents/index";
import { CUE_EVENTS, PCI_TIP_PHASES, PCI_EVENT_SOURCES as BASE_SOURCES, POOR_SUPPORT_RATIO, STALL_ADVANCE_MM, raises as baseRaises, raisesFrom, stalledAtLesion } from "./pciEvents/base";
import { TRANSIENT_HOLD_S } from "./eventLog";

const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

function lab(id: string): PciLabSession {
  const x = new PciLabSession({ scenarioId: id, team: false, headlessFrames: true });
  sessions.push(x);
  return x;
}

/** The engine state at one of the scenario's start states (src/simulation/pci/actions/scenario.ts). */
const startAt = (x: PciLabSession, start: string): PciState => startPci({ def: x.resolved.def, scenario: x.s }, x.g, start);

/** The session's snapshot with a state and injected flags. */
const snap = (x: PciLabSession, over: Partial<PciTipSnapshot> = {}): PciTipSnapshot => ({ ...x.snapshot(), ...over });

/** A complication of the engine's shape, overt at t = 10 s on the target lesion. */
function complication(x: PciLabSession, kind: Complication["kind"], o: Partial<Complication> = {}): Complication {
  const L = x.g.lesion;
  return {
    id: `${kind}-1`,
    kind,
    stage: "overt",
    t0: 10,
    tOvert: 10,
    tTreated: null,
    route: pathTo(x.g, L.vessel),
    vessel: L.vessel,
    atMm: L.centreMm,
    lengthMm: 6,
    severity: 0.5,
    grade: "B",
    cause: "balloon",
    data: {},
    bailouts: [],
    ...o,
  };
}

const withCx = (st: PciState, list: Complication[]): PciState => ({ ...st, cx: { ...st.cx, list } });

/** A stent placed over the target lesion, fully expanded. */
function placed(x: PciLabSession, st: PciState): Placed {
  const L = x.g.lesion;
  return {
    vessel: L.vessel as Placed["vessel"],
    fromMm: L.startMm - 3,
    toMm: L.endMm + 3,
    diameter: L.refDiameter,
    atLesion: L.refDiameter * 0.95,
    route: st.route.slice(),
    nominal: L.refDiameter,
    labelLengthMm: 18,
    ringD: [L.refDiameter],
    compressionMm: 0,
    covered: false,
  };
}

/** Every phase a test below reached (checked at the end against PCI_TIP_PHASES). */
const reached = new Set<string>();
function ctxOf(s: PciTipSnapshot): LabContext {
  const c = pciTipContext(s);
  if (c.phase) reached.add(c.phase);
  return c;
}

describe("phases", () => {
  it("lad-focal with the guide in the root gives phase 'guide', and 'plan' when snap.prebriefOpen is injected", () => {
    const x = lab("lad-focal");
    expect(x.snapshot().state.guide.engaged).toBe(false);
    const ctx = ctxOf(x.snapshot());
    expect(ctx.lab).toBe("pci");
    expect(ctx.phase).toBe("guide");
    expect(ctx.vessel).toBe("LAD");
    expect(ctxOf(snap(x, { prebriefOpen: true })).phase).toBe("plan");
    // the plan form, and a case with no guide up yet, are plan as well; an injected false overrides the session's flag
    expect(ctxOf(snap(x, { planOpen: true })).phase).toBe("plan");
    expect(ctxOf(snap(x, { guideIntroduced: false })).phase).toBe("plan");
    x.openModal("prebrief");
    expect(ctxOf(x.snapshot()).phase).toBe("plan");
    expect(ctxOf(snap(x, { prebriefOpen: false })).phase).toBe("guide");
  });

  it("the standard starts give guide, wire and lesion-prep", () => {
    const x = lab("lad-focal");
    expect(ctxOf(snap(x, { state: startAt(x, "guide-in-root") })).phase).toBe("guide");
    expect(ctxOf(snap(x, { state: startAt(x, "guide-engaged") })).phase).toBe("wire");
    expect(ctxOf(snap(x, { state: startAt(x, "wire-across") })).phase).toBe("lesion-prep");
  });

  it("a wire in a septal perforator gives wire-side-branch", () => {
    const x = lab("lad-focal");
    const septal = [...x.g.byName.keys()].find((n) => /^S\d/.test(n));
    expect(septal, "the LAD anatomy has a septal branch").toBeDefined();
    const eng = startAt(x, "guide-engaged");
    const st: PciState = { ...eng, route: pathTo(x.g, septal!), tipMm: 25 };
    const ctx = ctxOf(snap(x, { state: st }));
    expect(ctx.phase).toBe("wire");
    expect(ctx.events).toContain("wire-side-branch");
    // back on the LAD the event is gone
    expect(ctxOf(snap(x, { state: { ...st, route: pathTo(x.g, "LAD"), tipMm: 10 } })).events).not.toContain("wire-side-branch");
  });

  it("a wire across the lesion that the engine carried on into a terminal branch (rca-calcified: PDA or PLV) is across, not in a side branch", () => {
    const x = lab("rca-calcified");
    let st = startAt(x, "wire-across");
    expect(st.wire.crossed).toBe(true);
    for (let i = 0; i < 40 && st.route[st.route.length - 1] === x.g.lesion.vessel; i++) st = moveWire(x.s, x.g, st, 2);
    const tip = st.route[st.route.length - 1];
    expect(tip, "the wire ran on into a terminal branch of the RCA").not.toBe(x.g.lesion.vessel);
    expect(st.route).toContain(x.g.lesion.vessel);
    expect(st.wire.crossed).toBe(true);
    const ctx = ctxOf(snap(x, { state: st }));
    expect(ctx.phase).toBe("lesion-prep");
    expect(ctx.events).not.toContain("wire-side-branch");
    // the headless form (PciLabSession.tipContext) agrees
    const old = pciTipContext(st, x.g.lesion);
    expect(old.phase).toBe("lesion-prep");
    expect(old.events).not.toContain("wire-side-branch");
    // a wire that has not crossed, in a branch off the target, is still off route
    expect(ctxOf(snap(x, { state: { ...st, wire: { ...st.wire, crossed: false } } })).events).toContain("wire-side-branch");
  });

  it("a pressure wire gives 'physiology'", () => {
    const x = lab("lad-focal");
    const st = setWireKind(startAt(x, "guide-engaged"), "pressure");
    expect(st.pressure).not.toBeNull();
    expect(ctxOf(snap(x, { state: st })).phase).toBe("physiology");
  });

  it("an IVUS catheter gives 'imaging' with imaging 'ivus'", () => {
    const x = lab("lad-focal");
    let st = loadIvus(startAt(x, "wire-across"));
    expect(st.device?.kind).toBe("ivus");
    st = moveDevice(st, x.g.lesion.endMm + 5 - st.device!.centreMm);
    const ctx = ctxOf(snap(x, { state: st }));
    expect(ctx.phase).toBe("imaging");
    expect(ctx.imaging).toBe("ivus");
    // the OCT catheter is told apart from IVUS by its catalogue entry
    const oct = ctxOf(snap(x, { state: { ...st, device: { ...st.device!, specId: "oct" } } }));
    expect(oct.imaging).toBe("oct");
  });

  it("a stent on the wire gives 'stent'; a placed stent with only an edge flap gives 'optimise'", () => {
    const x = lab("lad-focal");
    const across = startAt(x, "wire-across");
    const dev = { kind: "stent" as const, specId: "des", balloon: "semi-compliant" as const, diameter: 3, lengthMm: 18, centreMm: x.g.lesion.centreMm, atm: 0, inflated: false, stage: "in-guide" as const, labelChecked: true, prepared: true, assisted: true, burstAtm: 20, ruptured: false, deployed: false, appliedAtm: 0 };
    expect(ctxOf(snap(x, { state: { ...across, device: dev } })).phase).toBe("stent");
    const stented: PciState = { ...across, stents: [placed(x, across)] };
    expect(ctxOf(snap(x, { state: stented })).phase).toBe("optimise");
    // an edge dissection, recognised: the event is raised and the phase stays optimise
    const edge = withCx(stented, [complication(x, "dissection", { cause: "stent edge", atMm: x.g.lesion.endMm + 3 })]);
    const ctx = ctxOf(snap(x, { state: edge, recognised: true }));
    expect(ctx.events).toContain("dissection");
    expect(ctx.phase).toBe("optimise");
    // a dissection in the lesion is a complication
    const lesionFlap = withCx(stented, [complication(x, "dissection", { cause: "balloon" })]);
    expect(ctxOf(snap(x, { state: lesionFlap, recognised: true })).phase).toBe("complication");
  });
});

describe("events", () => {
  it("a guide back-out at t is held for the transient hold and gone at t + 31 s", () => {
    const x = lab("rca-calcified");
    const across = startAt(x, "wire-across");
    const t = 100;
    const at = (now: number): PciState => ({ ...across, t: now, log: [...across.log, { t, kind: "guide-backout", data: { mm: 1.2, requiredN: 0.7, backupN: 0.55 } }] });
    expect(TRANSIENT_HOLD_S).toBe(30);
    const ev = (now: number) => ctxOf(snap(x, { state: at(now) })).events ?? [];
    expect(ev(t)).toEqual(expect.arrayContaining(["guide-backout", "poor-guide-support"]));
    expect(ev(t + 29)).toContain("guide-backout");
    expect(ev(t + 31)).not.toContain("guide-backout");
    expect(ev(t + 31)).not.toContain("poor-guide-support");
    // poor support needs more than POOR_SUPPORT_RATIO of the back-up
    const light: PciState = { ...across, t, log: [...across.log, { t, kind: "device", data: { action: "move", requiredN: 0.3, backupN: 0.55 } }] };
    expect(0.3 / 0.55).toBeLessThan(POOR_SUPPORT_RATIO);
    expect(ctxOf(snap(x, { state: light })).events).not.toContain("poor-guide-support");
  });

  it("rca-cto gives 'cto' and never 'total-occlusion'", () => {
    const x = lab("rca-cto");
    for (const start of ["guide-in-root", "guide-engaged", "wire-across"]) {
      const st = startAt(x, start);
      for (const state of [st, { ...st, severity: 100 }]) {
        const ev = ctxOf(snap(x, { state })).events ?? [];
        expect(ev, start).toContain("cto");
        expect(ev, start).not.toContain("total-occlusion");
      }
      // at finish 'cto' is kept
      const fin = ctxOf(snap(x, { state: st, finishing: true }));
      expect(fin.phase).toBe("finish");
      expect(fin.events).toContain("cto");
      expect(fin.events).not.toContain("total-occlusion");
    }
    // the headless form keeps the rule
    const st = startAt(x, "guide-engaged");
    expect(pciTipContext(st, x.g.lesion, { cto: true }).events).not.toContain("total-occlusion");
  });

  it("lcx-stemi never gives 'cto'; its unopened acute occlusion gives 'total-occlusion'", () => {
    const x = lab("lcx-stemi");
    for (const start of ["guide-in-root", "guide-engaged", "wire-across"]) {
      const st = startAt(x, start);
      for (const state of [st, { ...st, severity: 100 }, { ...st, severity: 30 }]) {
        const ev = ctxOf(snap(x, { state })).events ?? [];
        expect(ev, start).not.toContain("cto");
        expect(ev, start).toContain("stemi");
      }
      expect(ctxOf(snap(x, { state: { ...st, severity: 99 } })).events).toContain("total-occlusion");
      expect(ctxOf(snap(x, { state: { ...st, severity: 40 } })).events).not.toContain("total-occlusion");
    }
  });

  it("with snap.recognised false a dissection gives only cue events; with it true the context has 'dissection' and phase 'complication'", () => {
    const x = lab("lad-focal");
    const across = startAt(x, "wire-across");
    const st: PciState = { ...withCx(across, [complication(x, "dissection")]), slowFlow: true };
    const base = snap(x, { state: st, activeEvents: ["chest-pain", "st-elevation"] });
    const caseEvents = ctxOf(snap(x, { state: across })).events ?? [];
    const hidden = ctxOf({ ...base, recognised: false });
    expect(hidden.events).not.toContain("dissection");
    expect(hidden.phase).toBe("lesion-prep");
    // what is raised beyond the case's own events is cue events only
    const extra = (hidden.events ?? []).filter((e) => !caseEvents.includes(e));
    expect(extra.length).toBeGreaterThan(0);
    for (const e of extra) expect(CUE_EVENTS, e).toContain(e);
    // absent means not recognised
    expect(ctxOf({ ...base, recognised: undefined }).events).not.toContain("dissection");
    const named = ctxOf({ ...base, recognised: true });
    expect(named.events).toContain("dissection");
    expect(named.phase).toBe("complication");
    // recognising another complication does not name this one
    expect(ctxOf({ ...base, recognised: ["perforation"] }).events).not.toContain("dissection");
    expect(ctxOf({ ...base, recognised: ["dissection"] }).phase).toBe("complication");
  });

  it("a subintimal wire is named only once recognised, and a recognised one keeps phase 'wire'", () => {
    const x = lab("rca-cto");
    const eng = startAt(x, "guide-engaged");
    const st: PciState = { ...eng, wire: { ...eng.wire, subintimal: { fromMm: x.g.lesion.startMm + 1 } } };
    // the engine hides it: unrecognised, nothing names it
    expect(ctxOf(snap(x, { state: st })).events).not.toContain("wire-subintimal");
    expect(ctxOf(snap(x, { state: st, recognised: ["dissection"] })).events).not.toContain("wire-subintimal");
    expect(pciTipContext(st, x.g.lesion, { cto: true }).events).not.toContain("wire-subintimal");
    const named = ctxOf(snap(x, { state: st, recognised: ["wire-subintimal"] }));
    expect(named.events).toContain("wire-subintimal");
    expect(named.phase).toBe("wire");
    // kept at finish when it occurred (the engine's 'wire-subintimal' record)
    const logged: PciState = { ...st, log: [...st.log, { t: st.t, kind: "wire-subintimal", data: { atMm: x.g.lesion.startMm + 1 } }] };
    expect(ctxOf(snap(x, { state: logged, finishing: true })).events).toContain("wire-subintimal");
    expect(ctxOf(snap(x, { state: eng, finishing: true })).events).not.toContain("wire-subintimal");
  });

  it("a guide back-out the operator has got past (re-engaged, device advanced into the lesion) no longer makes the device uncrossable", () => {
    const x = lab("rca-calcified");
    const across = pinWire(startAt(x, "wire-across"), true);
    let st: PciState = setValve(backloadDevice(prepareDevice(checkLabel(requestDevice(across, "nc", 3.0, 15)))), true);
    st = advanceDevice(x.s, x.g, st, 1);
    const L = x.g.lesion;
    // the balloon brought to 1.5 mm short of the lesion, then a push that backs the guide out (as the engine logs it)
    st = moveDevice(st, L.startMm - 1.5 - (st.device!.centreMm + st.device!.lengthMm / 2));
    const c0 = st.device!.centreMm;
    st = { ...st, log: [...st.log, { t: st.t, kind: "guide-backout", data: { mm: 1.2, requiredN: 0.7, backupN: 0.55 } }, { t: st.t, kind: "device", data: { action: "move", centreMm: c0 + 0.5 } }] };
    st = { ...st, device: { ...st.device!, centreMm: c0 + 0.5 } };
    expect(stalledAtLesion(snap(x, { state: st }))).toBe(true);
    expect(ctxOf(snap(x, { state: st })).events).toContain("balloon-uncrossable");
    // re-engaged, then advanced 3 mm so its distal end lies inside the lesion: past the back-out
    st = engageGuide(x.s, st);
    st = moveDevice(st, 3);
    const distal = st.device!.centreMm + st.device!.lengthMm / 2;
    expect(distal).toBeGreaterThan(L.startMm);
    expect(distal).toBeLessThan(L.endMm);
    expect(st.device!.centreMm - (c0 + 0.5)).toBeGreaterThanOrEqual(STALL_ADVANCE_MM);
    const later = snap(x, { state: { ...st, t: st.t + 1 } });
    expect(stalledAtLesion(later)).toBe(false);
    expect(ctxOf(later).events).not.toContain("balloon-uncrossable");
  });

  it("haemodynamic compromise puts the tips at phase 'complication' before anything is named", () => {
    const x = lab("lad-focal");
    const ctx = ctxOf(snap(x, { state: startAt(x, "wire-across"), activeEvents: ["hypotension"] }));
    expect(ctx.phase).toBe("complication");
    expect(ctx.events).toContain("hypotension");
  });

  it("with snap.finishing injected after a perforation the finish context keeps 'perforation'", () => {
    const x = lab("lad-focal");
    const across = startAt(x, "wire-across");
    // sealed by a prolonged inflation: no longer overt, but it occurred
    const st = withCx(across, [complication(x, "perforation", { stage: "treated", tTreated: 40, grade: "II" })]);
    expect(ctxOf(snap(x, { state: st })).events).not.toContain("perforation");
    const fin = ctxOf(snap(x, { state: st, finishing: true }));
    expect(fin.phase).toBe("finish");
    expect(fin.events).toContain("perforation");
    // a complication that never became overt is not kept, and transient technique events are dropped at finish
    const prodrome = withCx({ ...across, t: 5, log: [...across.log, { t: 5, kind: "guide-backout", data: {} }] }, [complication(x, "dissection", { stage: "prodrome", tOvert: null })]);
    const fin2 = ctxOf(snap(x, { state: prodrome, finishing: true }));
    expect(fin2.events).not.toContain("dissection");
    expect(fin2.events).not.toContain("guide-backout");
    // the dose and contrast events that occurred are kept
    const fin3 = ctxOf(snap(x, { state: across, finishing: true, activeEvents: ["high-radiation-dose", "high-contrast-volume"] }));
    expect(fin3.events).toEqual(expect.arrayContaining(["high-radiation-dose", "high-contrast-volume"]));
  });
});

describe("the context function", () => {
  it("is pure: the same snapshot gives the same context and is not changed", () => {
    const x = lab("rca-calcified");
    const s = snap(x, { state: startAt(x, "wire-across"), recognised: true });
    const before = JSON.stringify({ ...s, events: undefined });
    expect(pciTipContext(s)).toEqual(pciTipContext(s));
    expect(JSON.stringify({ ...s, events: undefined })).toBe(before);
  });

  it("passes on the guide pressure class, the technique and step", () => {
    const x = lab("lad-focal");
    const ctx = ctxOf(snap(x, { state: startAt(x, "guide-engaged"), guidePressure: "damped", technique: { technique: "provisional", step: 3 } }));
    expect(ctx.pressure).toBe("damped");
    expect(ctx.events).toContain("pressure-damped");
    expect(ctx.technique).toBe("provisional");
    expect(ctx.step).toBe(3);
  });

  it("every phase of the machine is reached by the tests above", () => {
    expect([...reached].sort()).toEqual([...PCI_TIP_PHASES].sort());
    expect([...PCI_TIP_PHASES].sort()).toEqual([...LAB_PHASES.pci].sort());
  });
});

describe("the event-source registry", () => {
  it("collects base.ts and reports no problem; every source event is a vocabulary name", () => {
    expect(PCI_EVENT_SOURCE_PROBLEMS).toEqual([]);
    for (const s of BASE_SOURCES) expect(PCI_EVENT_SOURCES).toContain(s);
    for (const s of PCI_EVENT_SOURCES) expect(LAB_EVENTS, s.event).toContain(s.event);
  });

  it("a feature file adds its sources without editing the index, and its raises derive from them", () => {
    const extra: PciEventSource = { event: "retrograde", active: (s) => s.state.tipMm > 50 };
    const r = collectPciEventSources({ "./zz-fixture.ts": { PCI_EVENT_SOURCES: [extra] }, "./base.ts": { PCI_EVENT_SOURCES: BASE_SOURCES }, "./broken.ts": {} });
    expect(r.sources[0]).toBe(BASE_SOURCES[0]);
    expect(r.sources[r.sources.length - 1]).toBe(extra);
    expect(r.problems).toEqual(["./broken.ts: no PCI_EVENT_SOURCES export"]);
    const x = lab("lad-focal");
    const s = snap(x, { state: startAt(x, "wire-across") });
    expect(pciTipContext(s, r.sources).events).toContain("retrograde");
    expect(pciTipContext(s).events).not.toContain("retrograde");
    expect(raisesFrom([extra], { phases: ["wire"] })).toEqual({ lab: "pci", phases: ["wire"], events: ["retrograde"] });
    // a source that reports a time holds it for its own holdS
    const brief: PciEventSource = { event: "new-narrowing", active: (q) => q.state.t - 1, holdS: 0.5 };
    expect(sourceActive(brief, s)).toBe(false);
    expect(sourceActive({ ...brief, holdS: 2 }, s)).toBe(true);
  });

  it("base.ts raises every phase, its sources' events, the registered scenarios' case events and the catalogue's imaging", () => {
    expect(baseRaises.lab).toBe("pci");
    expect([...baseRaises.phases].sort()).toEqual([...LAB_PHASES.pci].sort());
    for (const s of BASE_SOURCES) expect(baseRaises.events).toContain(s.event);
    expect(baseRaises.events).toEqual(expect.arrayContaining(["cto", "stemi", "calcified-lesion", "total-occlusion", "wire-subintimal", "low-act", "high-contrast-volume", "high-radiation-dose"]));
    expect(baseRaises.events).toContain("bifurcation"); // the wiring pack's lcx-om-tortuous declares a bifurcation site (pci-wire-microcatheter)
    expect(baseRaises.imaging).toEqual(expect.arrayContaining(["ivus", "oct"]));
  });

  it("the index re-exports the PCI lab session's raises", () => {
    expect(indexRaises).toBe(sessionRaises);
    // pci-patient-coupling adds the complication phase (VF, pulseless VT, a low pressure or tamponade on the monitor)
    expect(indexRaises.phases).toEqual(["plan", "finish", "complication"]);
  });
});

// ---------------------------------------------------------------------------
// The reachability report's rule over the same raises files, with and without base.ts
// ---------------------------------------------------------------------------

type RaisesExport = LabRaises | readonly LabRaises[] | undefined;
const RAISE_MODULES = import.meta.glob<RaisesExport>(
  ["./pciEvents/*.ts", "../sim/modules/*.ts", "../../simulation/session/modules/*.ts", "./*Context.ts", "../**/*Tips.ts", "!**/*.test.ts"],
  { eager: true, import: "raises" }
);

function declared(skip?: string): LabRaises[] {
  const out: LabRaises[] = [];
  for (const [file, exp] of Object.entries(RAISE_MODULES)) {
    if (!exp || (skip && file.endsWith(skip))) continue;
    out.push(...(Array.isArray(exp) ? exp : [exp as LabRaises]));
  }
  return out;
}

function satisfiable(tip: LabTip, when: TipTrigger, list: readonly LabRaises[]): boolean {
  const test = (phases: readonly string[] | undefined, lab: string) => {
    const mine = list.filter((r) => r.lab === lab);
    if (!mine.length) return false;
    const u = (k: "phases" | "events" | "imaging" | "procedures" | "routes" | "techniques") => new Set(mine.flatMap((r) => (r[k] ?? []) as readonly string[]));
    const any = (want: readonly string[] | undefined, have: Set<string>) => !want?.length || want.some((x) => have.has(x));
    const ev = u("events");
    return (
      any(phases, u("phases")) &&
      any(when.event, ev) &&
      (when.requires ?? []).every((e) => ev.has(e)) &&
      any(when.procedure, u("procedures")) &&
      any(when.route, u("routes")) &&
      any(when.technique, u("techniques")) &&
      any(when.imaging, u("imaging"))
    );
  };
  return test(when.phase, tip.lab) || (tip.alsoIn ?? []).some((a) => test(a.phase, a.lab));
}

describe("reachability", () => {
  it("the report reads base.ts's raises; prints the PCI tips still waiting, which falls with them", () => {
    const files = Object.keys(RAISE_MODULES);
    expect(files.some((f) => f.endsWith("/pciEvents/base.ts"))).toBe(true);
    expect(declared().some((r) => r === baseRaises)).toBe(true);
    const listed = new Set(WAITING_TIPS.flatMap((g) => g.tips));
    const pciListed = LAB_TIPS.filter((t) => t.lab === "pci" && listed.has(t.id));
    const stillWaiting = (list: readonly LabRaises[]) => pciListed.filter((t) => !satisfiable(t, t.when, list)).map((t) => t.id);
    const withBase = stillWaiting(declared());
    const without = stillWaiting(declared("/pciEvents/base.ts"));
    const mine = WAITING_TIPS.filter((g) => g.raisedBy === "pci-tip-context").flatMap((g) => g.tips);
    const mineReady = mine.filter((id) => TIP_BY_ID[id] && satisfiable(TIP_BY_ID[id], TIP_BY_ID[id].when, declared()));
    console.info(
      `PCI tips still waiting: ${withBase.length} of ${pciListed.length} listed in waiting.ts (${without.length} without pciEvents/base.ts); ` +
        `entries naming pci-tip-context now satisfiable: ${mineReady.length} of ${mine.length}; still waiting: ${mine.filter((id) => !mineReady.includes(id)).join(", ")}`
    );
    expect(withBase.length).toBeLessThan(without.length);
    expect(mineReady.length).toBeGreaterThan(mine.length / 2);
    // the tips of the requests this package covers that its raises make reachable
    for (const id of ["pci-post-ecg-complex", "pci-post-complication-candour", "pci-post-radiation-follow-up", "pci-post-contrast-kidney", "pci-eqb-know-the-chart", "pci-eqb-standard-first", "pci-img-ivus-clear-view"])
      expect(satisfiable(TIP_BY_ID[id], TIP_BY_ID[id].when, declared()), id).toBe(true);
  });

  it("only vocabulary names are declared", () => {
    for (const e of baseRaises.events) expect(LAB_EVENTS as readonly string[], e).toContain(e as LabEvent);
  });
});
