// Tips reached through the recognition gate (pci-cx-recognition), driven from the core pack's lad-focal at
// its 'wire-across' start (the plan's 'closure-timi0' start is not declared by the core pack; the closure is
// made by the operator's own oversized dilatation): after the assessment that raises 'acute-closure' the
// cause-finding tip shows, and after the one that raises 'no-reflow' the hold-contrast tip shows; neither
// complication's own event is raised before. Every waiting.ts entry naming this package becomes
// satisfiable with this file's raises, and is not without them.
//   npx vitest run src/ui/lab/pciEvents/recognition.tips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { LAB_TIPS, TIP_BY_ID, tipsFor, type LabContext, type LabTip, type TipTrigger } from "../../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { PciLabSession, policyForMode } from "../../pci/PciLabSession";
import { resolvePciLaunch } from "../../pci/launch";
import { useSeriesStore } from "../../../state/useSeriesStore";
import { initialCx, onInflation, onInjection, timiOf } from "../../../simulation/complications/engine";
import { recognisePci } from "../../../simulation/pci/actions/step";
import { syncMirrors, type PciState } from "../../../simulation/pci/state";
import { pciTipContext } from "../pciTips";
import { submitRecognition, withRecognition } from "./recognition";

const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

function lab(): PciLabSession {
  const r = resolvePciLaunch({ scenario: "lad-focal", start: "wire-across", mode: "supervised" });
  expect(r.problems).toEqual([]);
  const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true, mode: "supervised", policy: policyForMode("supervised") });
  sessions.push(x);
  return x;
}

const ids = (ctx: LabContext, n = 20) => tipsFor(ctx, n).map((t) => t.id);
const ctxOf = (x: PciLabSession, st?: PciState) => pciTipContext(withRecognition(st ? { ...x.snapshot(), state: st } : x.snapshot()));

describe("tips after the assessment (pci-cx-recognition)", () => {
  it("lad-focal: after the assessment that raises 'acute-closure', pci-noreflow-dissection-or-embolism is among the tips", () => {
    const x = lab();
    // an oversized balloon at high pressure dissects the lesion
    const size = Math.round(x.g.lesion.refDiameter * 1.3 * 4) / 4;
    expect(x.loadDevice("balloon", "semi-compliant", size, 12)).toBe(true);
    x.advanceDevice(x.g.lesion.centreMm - x.st.device!.centreMm);
    x.inflate(16);
    for (let i = 0; i < 15; i++) x.step(1 / 15);
    x.deflate();
    x.removeDevice();
    // left untreated, the staining dissection limits flow until the vessel closes (TIMI 0-1)
    const closed = () => x.st.cx.list.some((c) => c.kind === "dissection" && timiOf(c)[1] <= 1);
    for (let s = 0; s < 1800 && !closed(); s++) for (let i = 0; i < 4; i++) x.step(0.25);
    expect(closed(), "the untreated dissection closes the vessel").toBe(true);
    // a contrast run shows the slow flow (before it, only the patient's cues)
    expect(x.inject()).toBe(true);
    for (let i = 0; i < 15; i++) x.step(1 / 15);
    x.releaseInjection();
    const before = ctxOf(x);
    expect(before.events).not.toContain("acute-closure");
    expect(before.events).not.toContain("dissection");
    expect(before.events).toContain("slow-flow");
    // the action: the learner's assessment (the cause and its grade)
    const d = x.st.cx.list.find((c) => c.kind === "dissection")!;
    const r = submitRecognition(x, { cause: "dissection", nhlbi: d.grade, timi: timiOf(d)[0], checks: { wireKept: true, imaged: true, pressureEcgAct: true } });
    expect(r?.recognition?.score.correct).toBe(true);
    const ctx = ctxOf(x);
    expect(ctx.phase).toBe("complication");
    expect(ctx.events).toEqual(expect.arrayContaining(["acute-closure", "dissection"]));
    expect(ids(ctx)).toContain("pci-noreflow-dissection-or-embolism");
  });

  it("lad-focal: after the assessment that raises 'no-reflow', pci-noreflow-hold-contrast is among the tips", () => {
    const x = lab();
    const L = x.g.lesion;
    const st0 = x.st;
    // an embolising dilatation at the lesion (the engine's no-reflow draw with thrombus there), on the first
    // complication-engine seed that gives one
    let st: PciState | null = null;
    for (let seed = 1; seed <= 200 && !st; seed++) {
      const r = onInflation(initialCx(seed), st0.t, {
        route: st0.route.slice(),
        vessel: L.vessel,
        fromMm: L.startMm,
        toMm: L.endMm,
        device: "balloon",
        ratio: 1,
        ratioToEem: 0.8,
        atm: 10,
        waist: false,
        calcium: 0,
        inLesion: true,
        edgeInPlaque: false,
        subintimalWire: false,
        rupture: false,
        prepared: true,
        beyondLimit: false,
        thrombus: true,
        lipid: false,
        lesionLengthMm: 16,
        aspirated: false,
        side: x.s.side,
        vesselD: L.refDiameter,
      });
      if (r.cx.list.length !== 1 || r.cx.list[0].kind !== "no-reflow") continue;
      // the next contrast run through the guide shows the slow flow
      const shown = onInjection(r.cx, st0.t + 1, { route: st0.route.slice(), vessel: L.vessel, side: x.s.side, psi: 100, forceful: false, guideDepthMm: 0, guideCoaxial: 0.9 });
      if (shown.cx.list.length === 1) st = syncMirrors({ ...st0, t: st0.t + 1, cx: shown.cx });
    }
    expect(st).not.toBeNull();
    const before = ctxOf(x, st!);
    expect(before.events).not.toContain("no-reflow");
    expect(before.events).toContain("slow-flow");
    expect(ids(before)).not.toContain("pci-noreflow-hold-contrast");
    // the action: the learner names no-reflow with its TIMI grade
    const nr = st!.cx.list[0];
    const after = recognisePci(st!, { cause: "no-reflow", timi: timiOf(nr)[0] });
    expect(after.result.recognition?.score.correct).toBe(true);
    const ctx = ctxOf(x, after.st);
    expect(ctx.phase).toBe("complication");
    expect(ctx.events).toContain("no-reflow");
    expect(ids(ctx)).toContain("pci-noreflow-hold-contrast");
  });
});

// ---------------------------------------------------------------------------
// The reachability report's rule over the raises files, with and without recognition.ts
// ---------------------------------------------------------------------------

type RaisesExport = LabRaises | readonly LabRaises[] | undefined;
const RAISE_MODULES = import.meta.glob<RaisesExport>(["./*.ts", "../../sim/modules/*.ts", "../../../simulation/session/modules/*.ts", "../*Context.ts", "../../**/*Tips.ts", "!**/*.test.ts"], {
  eager: true,
  import: "raises",
});

function declared(skip?: string): LabRaises[] {
  const out: LabRaises[] = [];
  for (const [file, exp] of Object.entries(RAISE_MODULES)) {
    if (!exp || (skip && file === skip)) continue;
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

describe("waiting.ts entries naming pci-cx-recognition", () => {
  it("every entry naming this package becomes satisfiable with recognition.ts's raises, so the PCI waiting count falls by at least their number", () => {
    expect(Object.keys(RAISE_MODULES).some((f) => f === "./recognition.ts")).toBe(true);
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === "pci-cx-recognition");
    const waiting = WAITING_TIPS.filter((g) => g.raisedBy === "pci-cx-recognition").flatMap((g) => g.tips);
    const entries: { id: string; when: TipTrigger }[] = [...deferred.map((d) => ({ id: d.tipId, when: d.when })), ...waiting.map((id) => ({ id, when: TIP_BY_ID[id].when }))];
    expect(entries.length).toBeGreaterThan(0);
    const all = declared();
    const without = declared("./recognition.ts");
    for (const e of entries) {
      const tip = TIP_BY_ID[e.id];
      expect(tip, e.id).toBeTruthy();
      expect(satisfiable(tip, e.when, all), `${e.id} with recognition.ts`).toBe(true);
      expect(satisfiable(tip, e.when, without), `${e.id} without recognition.ts`).toBe(false);
    }
    // the count of PCI entries (waiting tips and deferred retargets) still unsatisfiable falls by at least theirs
    const listed = new Set(WAITING_TIPS.flatMap((g) => g.tips));
    const pciEntries = [
      ...LAB_TIPS.filter((t) => t.lab === "pci" && listed.has(t.id)).map((t) => ({ tip: t, when: t.when })),
      ...DEFERRED_RETARGETS.filter((d) => TIP_BY_ID[d.tipId]?.lab === "pci").map((d) => ({ tip: TIP_BY_ID[d.tipId], when: d.when })),
    ];
    const stillWaiting = (list: readonly LabRaises[]) => pciEntries.filter((e) => !satisfiable(e.tip, e.when, list)).length;
    expect(stillWaiting(without) - stillWaiting(all)).toBeGreaterThanOrEqual(entries.length);
  });
});
