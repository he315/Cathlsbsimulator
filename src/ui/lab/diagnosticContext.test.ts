// The diagnostic lab's tip context (diag-tip-context): the phase precedence, the events, vessel and
// route it reports, the lab-time holds of the session's event log, and the borrowed and gated tips.
//   npx vitest run src/ui/lab/diagnosticContext.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { CASE_LIBRARY } from "../../simulation/caseGenerator";
import { CATHETERS } from "../../data/catheters";
import { LAB_EVENTS, LAB_PHASES, TIP_BY_ID, catheterFamily, tipsFor, type LabEvent, type LabTip } from "../../content/lab/tips";
import type { AnatomyCase, EngagementKind, Graft } from "../../types";
import { DiagnosticLabSession } from "../sim/labSession";
import { EventLog } from "./eventLog";
import {
  DIAGNOSTIC_PHASES,
  EXCHANGE_WIRE_LEAD,
  IDLE_SESSION_VIEW,
  diagnosticCatheterFamily,
  diagnosticContext,
  raises,
  type DiagnosticContextInput,
  type DiagnosticSessionView,
  type DiagnosticStoreSlice,
} from "./diagnosticContext";

const g = () => useSimulatorStore.getState();
const routine = CASE_LIBRARY[0];

/** A store slice: the catheter, where its tip is and the case. */
function slice(o: { cath?: string; kind?: EngagementKind | null; target?: "left" | "right" | "root" | "lv" | null; selective?: boolean; deep?: boolean; quality?: number; pressure?: DiagnosticStoreSlice["pressure"]; caseData?: Partial<AnatomyCase>; finished?: boolean; wireLead?: number } = {}): DiagnosticStoreSlice {
  const kind = o.kind === undefined ? "sinus-level" : o.kind;
  return {
    engagement: kind === null ? null : { kind, target: o.target ?? null, isSelective: !!o.selective, isDeep: !!o.deep, conus: false, quality: o.quality ?? 1 },
    pressure: o.pressure ?? { kind: "aortic" },
    catheterId: o.cath ?? "JL4",
    caseData: { accessRoute: "femoral", variants: [], rootSize: "normal", ...(o.caseData ?? {}) },
    finished: !!o.finished,
    wireLead: o.wireLead ?? 0,
  };
}
const view = (o: Partial<DiagnosticSessionView> = {}): DiagnosticSessionView => ({ ...IDLE_SESSION_VIEW, ...o });
const ctx = (store: DiagnosticStoreSlice, session: DiagnosticSessionView = view(), active: LabEvent[] = [], physics: DiagnosticContextInput["physics"] = null) => diagnosticContext({ store, session, physics, active });

const SELECTIVE_LM = { kind: "selective-lm" as const, target: "left" as const, selective: true };
const SELECTIVE_RCA = { kind: "selective-rca" as const, target: "right" as const, selective: true, cath: "JR4" };

describe("the vocabulary the diagnostic context uses", () => {
  it("its phases are the registry's diagnostic phases, and its raises use the shared names", () => {
    expect([...DIAGNOSTIC_PHASES]).toEqual([...LAB_PHASES.diagnostic]);
    expect(raises.lab).toBe("diagnostic");
    for (const e of raises.events) expect(LAB_EVENTS as readonly string[]).toContain(e);
    expect(raises.routes).toEqual(["femoral", "radial"]);
  });

  it("the catheter family agrees with the tip registry for every catheter on the back table", () => {
    for (const id of [...CATHETERS.map((c) => c.id), "XB3.5", "VL4", "IM", "PIG145", "radial-universal", "Tiger"]) expect(diagnosticCatheterFamily(id)).toBe(catheterFamily(id));
  });
});

describe("phase precedence", () => {
  it("setup before the time-out, whatever the catheter is doing", () => {
    expect(ctx(slice(SELECTIVE_LM), view({ timeOutDone: false })).phase).toBe("setup");
    expect(ctx(slice({ kind: "ascending-aorta" }), view({ timeOutDone: false, injectorActive: true })).phase).toBe("setup");
    // after the time-out, setup lasts until a catheter has reached the root
    expect(ctx(slice(), view({ rootReached: false })).phase).toBe("setup");
    expect(ctx(slice({ kind: "not-in-root" }), view({ rootReached: false })).phase).toBe("advance");
  });

  it("advance with the tip above the sinuses or in the route", () => {
    expect(ctx(slice({ kind: "ascending-aorta" })).phase).toBe("advance");
    expect(ctx(slice({ kind: "ascending-aorta", cath: "JR4" })).phase).toBe("advance");
    expect(ctx(slice({ kind: "sinus-level" }), view(), [], { tipZone: "route" }).phase).toBe("advance");
  });

  it("engage-left and engage-right by the engagement, or by the catheter's side at the sinuses", () => {
    expect(ctx(slice({ kind: "near-lm" }))).toMatchObject({ phase: "engage-left", vessel: "LM" });
    expect(ctx(slice({ kind: "near-rca", cath: "JR4" }))).toMatchObject({ phase: "engage-right", vessel: "RCA" });
    expect(ctx(slice({ kind: "sinus-level", cath: "JR4" }))).toMatchObject({ phase: "engage-right", vessel: "RCA" });
    expect(ctx(slice({ kind: "sinus-level", cath: "AL1" })).phase).toBe("engage-left");
    // the tree segment at the tip, when a physics reading gives it
    expect(ctx(slice(SELECTIVE_LM), view(), [], { vessel: "LAD" }).vessel).toBe("LAD");
  });

  it("inject while the injector is active or a cine run is live", () => {
    expect(ctx(slice(SELECTIVE_LM), view({ injectorActive: true }))).toMatchObject({ phase: "inject", vessel: "LM" });
    expect(ctx(slice(SELECTIVE_RCA), view({ runLive: true }))).toMatchObject({ phase: "inject", vessel: "RCA" });
    expect(ctx(slice({ kind: "sinus-level" }), view({ injectorActive: true })).phase).toBe("inject");
  });

  it("views after a filmed selective run on the engaged side, while still engaged there", () => {
    expect(ctx(slice(SELECTIVE_LM), view({ lastFilmedSide: "left" }))).toMatchObject({ phase: "views", vessel: "LM" });
    expect(ctx(slice(SELECTIVE_RCA), view({ lastFilmedSide: "right" }))).toMatchObject({ phase: "views", vessel: "RCA" });
    // filmed on the other side, or no longer engaged: not views
    expect(ctx(slice(SELECTIVE_RCA), view({ lastFilmedSide: "left" })).phase).toBe("engage-right");
    expect(ctx(slice({ kind: "near-lm" }), view({ lastFilmedSide: "left" })).phase).toBe("engage-left");
    expect(ctx(slice(SELECTIVE_LM)).phase).toBe("engage-left");
  });

  it("exchange while a catheter is withdrawn over the wire or a new one is loaded", () => {
    expect(ctx(slice(SELECTIVE_LM), view({ exchange: true, lastFilmedSide: "left" })).phase).toBe("exchange");
    expect(ctx(slice({ kind: "in-lv", cath: "PIG" }), view({ exchange: true })).phase).toBe("exchange");
    expect(ctx(slice(), view(), [], { exchange: true }).phase).toBe("exchange");
  });

  it("finish when the finish step is open or the case is finished, over everything else", () => {
    expect(ctx(slice(SELECTIVE_LM), view({ finishing: true, exchange: true, injectorActive: true })).phase).toBe("finish");
    expect(ctx(slice({ ...SELECTIVE_LM, finished: true }), view({ timeOutDone: false })).phase).toBe("finish");
  });

  it("lv-aorta with a pigtail, or with the tip in the LV", () => {
    expect(ctx(slice({ kind: "in-lv", cath: "PIG", target: "lv", pressure: { kind: "lv" } }))).toMatchObject({ phase: "lv-aorta", catheter: "PIG", engagement: "in-lv", pressure: "lv" });
    expect(ctx(slice({ kind: "ascending-aorta", cath: "PIG" })).phase).toBe("lv-aorta");
    expect(ctx(slice({ kind: "in-lv", cath: "PIG" }), view({ injectorActive: true })).phase).toBe("lv-aorta");
    // a coronary catheter fallen into the LV is an advance problem as well
    const fallen = ctx(slice({ kind: "in-lv", cath: "JL4" }));
    expect(fallen.phase).toBe("lv-aorta");
    expect(fallen.phases).toEqual(["advance"]);
    // a pigtail still tracking up the aorta before the root is advancing
    expect(ctx(slice({ kind: "not-in-root", cath: "PIG" }), view({ rootReached: false })).phase).toBe("advance");
  });
});

describe("events, vessel and route", () => {
  it("the pressure trace and the tip position, as before", () => {
    const c = ctx(slice({ kind: "deep-lm", target: "left", selective: true, deep: true, quality: 0.3, pressure: { kind: "damped" } }));
    expect(c.events).toEqual(expect.arrayContaining(["pressure-damped", "catheter-too-deep", "non-coaxial"]));
    expect(ctx(slice({ kind: "deep-rca", cath: "JR4", pressure: { kind: "ventricularised" } })).events).toContain("pressure-ventricularised");
    expect(ctx(slice({ pressure: { kind: "wedged" } })).events).toContain("pressure-damped");
  });

  it("the root once a catheter has reached it; the arm on a radial route only while advancing or exchanging there", () => {
    const dilated = slice({ caseData: { rootSize: "dilated" } });
    expect(ctx(dilated).events).toContain("dilated-root");
    expect(ctx(dilated, view({ timeOutDone: false })).events).not.toContain("dilated-root");
    expect(ctx(slice({ caseData: { variants: ["small-root"] } })).events).toContain("small-root");
    const arm: Partial<AnatomyCase> = { accessRoute: "radial-right", variants: ["tortuous-subclavian", "radial-loop"] };
    const advancing = ctx(slice({ kind: "ascending-aorta", caseData: arm }));
    expect(advancing).toMatchObject({ phase: "advance", route: "radial" });
    expect(advancing.events).toEqual(expect.arrayContaining(["subclavian-tortuosity", "radial-loop"]));
    expect(ctx(slice({ ...SELECTIVE_LM, caseData: arm })).events).not.toContain("radial-loop");
    expect(ctx(slice({ kind: "ascending-aorta", caseData: { ...arm, accessRoute: "femoral" } })).events).not.toContain("radial-loop");
    expect(ctx(slice({ kind: "ascending-aorta", caseData: { accessRoute: "radial-right", variants: ["arteria-lusoria"] } })).events).toContain("subclavian-tortuosity");
    expect(ctx(slice()).route).toBe("femoral");
  });

  it("a physics reading's tree vessel names the artery; a vessel outside the vocabulary falls back to the side", () => {
    expect(ctx(slice(SELECTIVE_LM), view(), [], { vessel: "OM1" })).toMatchObject({ phase: "engage-left", vessel: "LCx" });
    expect(ctx(slice(SELECTIVE_LM), view(), [], { vessel: "not-a-vessel" })).toMatchObject({ phase: "engage-left", vessel: "LM" });
  });

  it("the log's events join the state's, each once", () => {
    const c = ctx(slice({ pressure: { kind: "damped" } }), view(), ["vf", "pressure-damped", "prior-cabg"]);
    expect(c.events).toEqual(["pressure-damped", "vf", "prior-cabg"]);
  });

  it("graft cases: the grafts of the operation note at setup, the graft sought during engage-graft", () => {
    const svg: Graft = { conduit: "svg", target: "RCA", position: 0.5, proximalSite: "aorta-low", status: "patent", ringMarker: false };
    const lima: Graft = { conduit: "lima", target: "LAD", position: 0.6, proximalSite: "left-subclavian", status: "patent", ringMarker: false };
    const cabg: Partial<AnatomyCase> = { grafts: [svg, lima] };
    expect(ctx(slice({ caseData: cabg }), view({ timeOutDone: false }))).toMatchObject({ phase: "setup", vessel: "SVG" });
    expect(ctx(slice({ kind: "ascending-aorta", cath: "JR4", caseData: cabg }))).toMatchObject({ phase: "engage-graft", vessel: "SVG", catheter: "JR" });
    expect(ctx(slice({ kind: "ascending-aorta", cath: "IM", caseData: cabg }))).toMatchObject({ phase: "engage-graft", vessel: "LIMA", catheter: "IM" });
    expect(ctx(slice({ kind: "ascending-aorta", cath: "IM", caseData: { grafts: [lima, { ...lima, conduit: "rima" }], accessRoute: "radial-right" } })).vessel).toBe("RIMA");
    // a graft the physics reports wins; a native engagement in a graft case stays native
    expect(ctx(slice({ caseData: cabg }), view(), [], { graft: "radial-graft" })).toMatchObject({ phase: "engage-graft", vessel: "radial-graft" });
    expect(ctx(slice({ ...SELECTIVE_RCA, caseData: cabg }))).toMatchObject({ phase: "engage-right", vessel: "RCA" });
    // on a radial route the arm stays in play while a graft is sought from the ascending aorta
    const radialCabg: Partial<AnatomyCase> = { grafts: [svg], accessRoute: "radial-right", variants: ["tortuous-subclavian", "radial-loop"] };
    const seeking = ctx(slice({ kind: "ascending-aorta", cath: "JR4", caseData: radialCabg }));
    expect(seeking).toMatchObject({ phase: "engage-graft", vessel: "SVG", route: "radial" });
    expect(seeking.events).toEqual(expect.arrayContaining(["subclavian-tortuosity", "radial-loop"]));
    expect(ctx(slice({ kind: "ascending-aorta", cath: "JR4", caseData: { ...radialCabg, accessRoute: "femoral" } })).events).not.toContain("radial-loop");
    // status is a finding: an occluded graft is sought like an open one
    expect(ctx(slice({ kind: "ascending-aorta", cath: "MP", caseData: { grafts: [{ ...svg, status: "occluded" }] } })).phase).toBe("engage-graft");
  });
});

describe("the session's event log holds on lab time", () => {
  afterEach(() => g().setPedalImaging(false));

  it("an event raised with holdS 60 is active at 59 s and gone at 61 s of lab time (EventLog)", () => {
    let now = 0;
    const log = new EventLog({ clock: () => now });
    log.raise("contrast-hold-up", 60);
    now = 59;
    expect(log.active()).toContain("contrast-hold-up");
    now = 61;
    expect(log.active()).not.toContain("contrast-hold-up");
  });

  it("an event raised with holdS 60 is active at 59 s and gone at 61 s of lab time (the session, stepped)", () => {
    g().loadCase(routine, "free");
    const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, modules: [] });
    s.events.raise("contrast-hold-up", 60);
    for (let i = 0; i < 590; i++) s.step(0.1);
    expect(s.wall()).toBeCloseTo(59, 6);
    expect(s.tipContext().events).toContain("contrast-hold-up");
    for (let i = 0; i < 20; i++) s.step(0.1);
    expect(s.wall()).toBeCloseTo(61, 6);
    expect(s.tipContext().events).not.toContain("contrast-hold-up");
    s.dispose();
  });

  it("VF raised by hand lapses within seconds unless the lab keeps raising it", () => {
    g().loadCase(routine, "free");
    const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, modules: [] });
    s.events.raise("vf");
    expect(s.tipContext().events).toContain("vf");
    for (let i = 0; i < 610; i++) s.step(0.1);
    expect(s.tipContext().events).not.toContain("vf");
    s.dispose();
  });
});

describe("the session's trackers", () => {
  it("setup until the time-out and the first catheter movement; then the engaged side", () => {
    g().loadCase(routine, "free");
    const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, modules: [] });
    s.step(0.1);
    expect(s.tipContext().phase).toBe("setup");
    s.setTimeOutDone(true);
    expect(s.tipContext().phase).toBe("setup");
    g().commandInsertion(2);
    s.step(0.1);
    expect(s.sessionView().rootReached).toBe(true);
    expect(s.tipContext().phase).not.toBe("setup");
    s.dispose();
  });

  it("exchange while the catheter is withdrawn over the wire, and after a new catheter is loaded", () => {
    g().loadCase(routine, "free");
    const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, modules: [] });
    s.setTimeOutDone(true);
    s.step(0.1);
    const c0 = g().controls;
    useSimulatorStore.setState({ controls: { ...c0, wireInsertion: EXCHANGE_WIRE_LEAD + 5 } });
    s.step(0.1);
    expect(s.tipContext().phase).not.toBe("exchange");
    // withdraw the catheter with the wire held out beyond its tip
    for (let i = 0; i < 5; i++) {
      const c = g().controls;
      useSimulatorStore.setState({ controls: { ...c, insertion: c.insertion - 2, cmdInsertion: c.cmdInsertion - 2 } });
      s.step(0.05);
    }
    expect(s.tipContext().phase).toBe("exchange");
    s.dispose();

    g().loadCase(routine, "free");
    const s2 = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, modules: [] });
    s2.setTimeOutDone(true);
    s2.step(0.1);
    g().setCatheter(g().catheterId === "JR4" ? "JL4" : "JR4");
    s2.step(0.1);
    expect(s2.tipContext().phase).toBe("exchange");
    s2.dispose();
  });

  it("views after a filmed diagnostic run on the engaged side", () => {
    g().loadCase(routine, "free");
    const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, modules: [] });
    s.setTimeOutDone(true);
    s.step(0.1);
    const e = g().engagement;
    useSimulatorStore.setState({ engagement: { ...e, kind: "selective-lm", target: "left", isSelective: true } });
    useSimulatorStore.setState({ bolus: { filled: ["LM", "LAD"], plume: "none", side: "left", phase: 0.5, duration: 60, progress: 1, intensity: 1, peak: 1, diagnostic: true, filmed: true, counted: true, labEnded: true } });
    s.step(0.01);
    expect(s.sessionView().lastFilmedSide).toBe("left");
    useSimulatorStore.setState({ bolus: null, engagement: { ...g().engagement, kind: "selective-lm", target: "left", isSelective: true } });
    expect(s.tipContext().phase).toBe("views");
    s.dispose();
  });

  it("the finish step and the finished case", () => {
    g().loadCase(routine, "free");
    const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, modules: [] });
    s.setTimeOutDone(true);
    s.setFinishStep(true);
    expect(s.tipContext().phase).toBe("finish");
    s.setFinishStep(false);
    useSimulatorStore.setState({ finished: true });
    expect(s.tipContext().phase).toBe("finish");
    s.dispose();
  });
});

describe("borrowed and gated tips", () => {
  it("tipsFor({lab:'diagnostic', phase:'views'}) can return pci-interp-qca-calibrate through alsoIn", () => {
    const ids = tipsFor({ lab: "diagnostic", phase: "views" }, 200).map((t) => t.id);
    expect(ids).toContain("pci-interp-qca-calibrate");
    expect(TIP_BY_ID["pci-interp-qca-calibrate"].lab).toBe("pci");
    // and from the context the lab reports after a filmed run
    expect(tipsFor(ctx(slice(SELECTIVE_LM), view({ lastFilmedSide: "left" })), 200).map((t) => t.id)).toContain("pci-interp-qca-calibrate");
  });

  it("a tip requiring prior-cabg is excluded without it, and shown in a case with grafts", () => {
    // no registry tip requires prior-cabg yet: a copy of diag-graft-op-note-first gated on it
    const base = TIP_BY_ID["diag-graft-op-note-first"];
    const gated: LabTip = { ...base, id: "fixture-graft-op-note-requires-prior-cabg", when: { ...base.when, vessel: undefined, requires: ["prior-cabg"] } };
    const without = ctx(slice(), view({ timeOutDone: false }));
    expect(tipsFor(without, 20, [gated])).toEqual([]);
    g().loadCase({ ...routine, grafts: [{ conduit: "svg", target: "RCA", position: 0.4, proximalSite: "aorta-low", status: "patent", ringMarker: false }] }, "free");
    const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, modules: [] });
    const withGrafts = s.tipContext();
    expect(withGrafts.events).toContain("prior-cabg");
    expect(tipsFor(withGrafts, 20, [gated]).map((t) => t.id)).toEqual([gated.id]);
    s.dispose();
  });
});
