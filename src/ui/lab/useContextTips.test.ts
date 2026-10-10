// The shared tip hook (found-lab-session-plumbing): useDiagnosticTips now delegates to useContextTips,
// whose selection (selectTips) must give the diagnostic tips drawer exactly what it showed before:
// tipsFor(context, 5) when guided, or supervised/independent after a help request; nothing in exams.
//   npx vitest run src/ui/lab/useContextTips.test.ts
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import Reconciler from "react-reconciler";
import { LegacyRoot } from "react-reconciler/constants";
import * as tipsModule from "../../content/lab/tips";
import type { LabContext } from "../../content/lab/tips";
import type { AssessmentMode } from "../../mentor/types";
import { DEFAULT_TIP_LIMIT, loadTips, selectTips, tipsVisible, useContextTips, useDiagnosticTips, type ContextTips, type TipPolicy } from "./useLabTips";

/** The rule useDiagnosticTips applied before it delegated (copied from the previous version). */
function before(mode: AssessmentMode, helpAskedAt: number | null, context: LabContext) {
  const visible = mode === "guided" || ((mode === "supervised" || mode === "independent") && helpAskedAt !== null);
  return { visible, tips: visible ? tipsModule.tipsFor(context, 5) : [] };
}

const CONTEXTS: LabContext[] = [
  { lab: "diagnostic", phase: "advance", events: [] },
  { lab: "diagnostic", phase: "setup", events: [] },
  { lab: "diagnostic", phase: "engage-left", events: ["dilated-root"], catheter: "JL", engagement: "near-lm", vessel: "LM" },
  { lab: "diagnostic", phase: "engage-left", events: ["engage-fail"], catheter: "JL", engagement: "sinus-level", vessel: "LM" },
  { lab: "diagnostic", phase: "engage-left", events: ["pressure-damped", "catheter-too-deep"], catheter: "JL", engagement: "deep-lm", pressure: "damped", vessel: "LM" },
  { lab: "diagnostic", phase: "engage-right", events: ["conus-selective"], catheter: "JR", engagement: "selective-rca", vessel: "RCA" },
  { lab: "diagnostic", phase: "engage-right", events: ["pressure-ventricularised"], catheter: "JR", engagement: "deep-rca", pressure: "ventricularised", vessel: "RCA" },
  { lab: "diagnostic", phase: "engage-left", events: ["small-root", "non-coaxial"], catheter: "AL", engagement: "selective-lm", vessel: "LM" },
  { lab: "diagnostic", phase: "lv-aorta", events: [], catheter: "PIG", engagement: "in-lv", pressure: "lv" },
  { lab: "diagnostic", phase: "advance", events: ["subclavian-tortuosity"], catheter: "radial-universal" },
];

const MODES: [AssessmentMode, number | null][] = [
  ["guided", null],
  ["supervised", null],
  ["supervised", 12],
  ["independent", null],
  ["independent", 30],
  ["exam", null],
  ["exam", 5],
];

describe("useContextTips selection", () => {
  it("gives the diagnostic drawer the same tips and visibility as before, in every mode", () => {
    let shown = 0;
    for (const ctx of CONTEXTS)
      for (const [mode, help] of MODES) {
        const old = before(mode, help, ctx);
        expect(tipsVisible({ mode, helpAskedAt: help })).toBe(old.visible);
        const now = selectTips(tipsModule, ctx, { mode, helpAskedAt: help }, DEFAULT_TIP_LIMIT);
        expect(now.map((t) => t.id)).toEqual(old.tips.map((t) => t.id));
        shown += now.length;
      }
    expect(shown).toBeGreaterThan(0);
  });

  it("loads the same module the selection uses, and the hooks are still exported", async () => {
    const mod = await loadTips();
    expect(mod.tipsFor).toBe(tipsModule.tipsFor);
    expect(typeof useContextTips).toBe("function");
    expect(typeof useDiagnosticTips).toBe("function");
  });

  it("returns nothing without a context or an empty list of contexts", () => {
    expect(selectTips(tipsModule, null, { mode: "guided", helpAskedAt: null })).toEqual([]);
    expect(selectTips(tipsModule, [], { mode: "guided", helpAskedAt: null })).toEqual([]);
  });
});

describe("tips of the requests this package covers reach the shared panel's selection", () => {
  const guided = { mode: "guided" as const, helpAskedAt: null };
  const ids = (ctx: LabContext) => selectTips(tipsModule, ctx, guided, 20).map((t) => t.id);

  it("cm-perforation#12: the pericardiocentesis tips show at their bedside steps", () => {
    const needle = ids({ lab: "bedside", phase: "needle", procedures: ["pericardiocentesis"] });
    expect(needle).toEqual(expect.arrayContaining(["bed-peri-set-up", "bed-peri-confirm-wire", "bed-peri-after-pci"]));
    expect(ids({ lab: "bedside", phase: "drain", procedures: ["pericardiocentesis"] })).toContain("bed-peri-drain-stays");
  });

  it("hb-additional-procedures#8: the procedure tag keeps a structural tip to its own procedure", () => {
    expect(ids({ lab: "structural", phase: "deploy", procedures: ["bav"] })).toContain("structural-bav-rapid-pacing");
    expect(ids({ lab: "structural", phase: "deploy", procedures: ["tavi"] })).not.toContain("structural-bav-rapid-pacing");
    expect(ids({ lab: "structural", phase: "assess", procedures: ["pmc"] })).toContain("structural-pmc-stepwise-stop");
    expect(ids({ lab: "structural", phase: "assess", procedures: ["bav"] })).not.toContain("structural-pmc-stepwise-stop");
  });

  it("hb-tavi#0: the TAVI hypotension tip only with the hypotension event (raised by patientEvents)", () => {
    expect(ids({ lab: "structural", phase: "assess", procedures: ["tavi"] })).not.toContain("structural-tavi-hypotension-coronary");
    expect(ids({ lab: "structural", phase: "assess", procedures: ["tavi"], events: ["hypotension"] })).toContain("structural-tavi-hypotension-coronary");
  });
});

// A renderer with no host elements, enough to run a hook across re-renders in the node environment.
function hookRenderer() {
  const noop = () => undefined;
  const r = Reconciler({
    supportsMutation: true,
    supportsPersistence: false,
    supportsHydration: false,
    isPrimaryRenderer: false,
    createInstance: () => ({}),
    createTextInstance: () => ({}),
    appendInitialChild: noop,
    appendChild: noop,
    appendChildToContainer: noop,
    removeChild: noop,
    removeChildFromContainer: noop,
    insertBefore: noop,
    insertInContainerBefore: noop,
    finalizeInitialChildren: () => false,
    prepareUpdate: () => null,
    commitUpdate: noop,
    commitTextUpdate: noop,
    shouldSetTextContent: () => false,
    getRootHostContext: () => ({}),
    getChildHostContext: (c: object) => c,
    getPublicInstance: (i: object) => i,
    prepareForCommit: () => null,
    resetAfterCommit: noop,
    preparePortalMount: noop,
    clearContainer: noop,
    scheduleTimeout: setTimeout,
    cancelTimeout: clearTimeout,
    noTimeout: -1,
    getCurrentEventPriority: () => 16,
    getInstanceFromNode: () => null,
    beforeActiveInstanceBlur: noop,
    afterActiveInstanceBlur: noop,
    prepareScopeUpdate: noop,
    getInstanceFromScope: () => null,
    detachDeletedInstance: noop,
    now: Date.now,
  } as never);
  const root = r.createContainer({}, LegacyRoot, null, false, null, "", noop, null);
  return (el: ReturnType<typeof createElement>) => r.updateContainer(el, root, null, noop);
}

describe("useContextTips as a hook", () => {
  it("shows tips once the policy changes to a help request, and keeps them for an equal context", async () => {
    await loadTips(); // the registry is loaded, so the hook has it on its first render
    const seen: ContextTips[] = [];
    const Probe = (p: { ctx: LabContext; policy: TipPolicy }) => {
      seen.push(useContextTips(p.ctx, p.policy));
      return null;
    };
    const render = hookRenderer();
    const ctx = CONTEXTS[2];
    render(createElement(Probe, { ctx, policy: { mode: "supervised", helpAskedAt: null } }));
    expect(seen[seen.length - 1]).toMatchObject({ tips: [], visible: false, loaded: true });
    render(createElement(Probe, { ctx, policy: { mode: "supervised", helpAskedAt: 12 } }));
    const shown = seen[seen.length - 1];
    expect(shown.visible).toBe(true);
    expect(shown.tips.map((t) => t.id)).toEqual(tipsModule.tipsFor(ctx, DEFAULT_TIP_LIMIT).map((t) => t.id));
    expect(shown.tips.length).toBeGreaterThan(0);
    // a new object with the same content does not re-select; a changed context does
    render(createElement(Probe, { ctx: { ...ctx, events: [...(ctx.events ?? [])] }, policy: { mode: "supervised", helpAskedAt: 12 } }));
    expect(seen[seen.length - 1].tips).toBe(shown.tips);
    render(createElement(Probe, { ctx: CONTEXTS[6], policy: { mode: "supervised", helpAskedAt: 12 } }));
    expect(seen[seen.length - 1].tips.map((t) => t.id)).toEqual(tipsModule.tipsFor(CONTEXTS[6], DEFAULT_TIP_LIMIT).map((t) => t.id));
  });
});
