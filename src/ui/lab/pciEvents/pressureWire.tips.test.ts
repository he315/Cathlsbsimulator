// Tips around the PCI lab's pressure wire (pci-pressure-wire-console), driven in the focal mid-LAD case of the
// core pack opened at 'guide engaged'. Exchanging the working wire for the pressure wire puts the tips in the
// 'physiology' phase (pci-mon-aortic-line-physiology). The operator measuring a jailed side branch (the pressure
// wire in a branch whose ostium a stent has pinched: the complication engine's side-branch compromise) is what
// the registered event source src/ui/lab/pciEvents/pressureWire.ts raises 'side-branch-compromise' from in that
// phase (pci-phys-jailed-side-branch; rule: src/simulation/pci/actions/pressure.ts pwJailedBranchMeasured). A
// pinched branch the operator has not wired is not named before it is recognised (the base source's gate). No
// waiting.ts entry names this package. The practice index lists lad-focal under the package's lessons.
//   npx vitest run src/ui/lab/pciEvents/pressureWire.tips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { LAB_TIPS, tipsFor, type LabContext } from "../../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS } from "../../../content/lab/raisable/waiting";
import { setWireKind, type PciState } from "../../../simulation/angioPci";
import { pwJailedBranchMeasured } from "../../../simulation/pci/actions/pressure";
import { newComplication } from "../../../simulation/complications/common";
import { branchesOf, pathTo } from "../../../simulation/pci/geometry";
import { PciLabSession } from "../../pci/PciLabSession";
import { resolvePciLaunch } from "../../pci/launch";
import { useSeriesStore } from "../../../state/useSeriesStore";
import { pciTipContext } from "../pciTips";
import { PCI_EVENT_SOURCES } from "./index";
import { PCI_EVENT_SOURCES as PW_SOURCES, raises as PW_RAISES } from "./pressureWire";
import { PRACTICE_INDEX, practiceForLesson } from "../../content/practiceIndex";
import { launch as PW_LAUNCH } from "../../../content/practice/pci-pressure-wire-console.launch";

const PKG = "pci-pressure-wire-console";

const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

const ids = (ctx: LabContext, n = 20) => tipsFor(ctx, n).map((t) => t.id);

function engaged(): PciLabSession {
  const r = resolvePciLaunch({ scenario: "lad-focal", start: "guide-engaged", mode: "supervised" });
  expect(r.problems).toEqual([]);
  const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
  sessions.push(x);
  return x;
}

/** A diagonal's ostium pinched by the stent (still filling); with `wired`, the pressure wire exchanged into it. */
function pinchedBranch(x: PciLabSession, st0: PciState, wired: boolean): PciState {
  const b = branchesOf(x.g, x.g.lesion.vessel).find((v) => !v.terminal && x.g.byName.get(v.c.name)?.lesionId);
  expect(b).toBeDefined();
  const route = [...pathTo(x.g, x.g.lesion.vessel), b!.c.name];
  const cx = { ...st0.cx, list: [...st0.cx.list], nextId: st0.cx.nextId, heldCues: [] };
  cx.list.push(newComplication(cx, st0.t, "side-branch", { route, vessel: b!.c.name, atMm: b!.atMm, lengthMm: 3, severity: 0.7, grade: "TIMI 2", cause: "carina shift after main-vessel stenting", stage: "prodrome" }));
  if (!wired) return { ...st0, cx };
  // the wire's route and tip set directly (wiring a branch is the wire engine's test)
  const tipMm = b!.atMm + 50;
  return { ...st0, cx, route, tipMm, wire: { ...st0.wire, route, tipMm } };
}

describe("pressure-wire tips in lad-focal at 'guide engaged' (pci-pressure-wire-console)", () => {
  it("with the pressure wire loaded the phase is 'physiology' and the tips include pci-mon-aortic-line-physiology", () => {
    const x = engaged();
    const before = pciTipContext(x.snapshot());
    expect(before.phase).not.toBe("physiology");
    expect(ids(before)).not.toContain("pci-mon-aortic-line-physiology");
    const st = setWireKind(x.st, "pressure");
    expect(st.pressure).not.toBeNull();
    const ctx = pciTipContext({ ...x.snapshot(), state: st });
    expect(ctx.phase).toBe("physiology");
    expect(ctx.vessel).toBe("LAD");
    expect(ids(ctx)).toContain("pci-mon-aortic-line-physiology");
  });

  it("the registered pressure-wire source raises 'side-branch-compromise' in the physiology phase", () => {
    expect(PCI_EVENT_SOURCES).toEqual(expect.arrayContaining([...PW_SOURCES]));
    expect(PW_RAISES).toMatchObject({ lab: "pci", phases: ["physiology"], events: ["side-branch-compromise"] });
  });

  it("with the pressure wire exchanged into a jailed diagonal, 'side-branch-compromise' is raised in the physiology phase and the tips include pci-phys-jailed-side-branch", () => {
    const x = engaged();
    const loaded = setWireKind(x.st, "pressure");
    // a pinched branch the operator has not wired is not named before it is recognised
    const unwired = pinchedBranch(x, loaded, false);
    expect(pwJailedBranchMeasured(unwired)).toBe(false);
    const reg = pciTipContext({ ...x.snapshot(), state: unwired });
    expect(reg.phase).toBe("physiology");
    expect(reg.events).not.toContain("side-branch-compromise");
    expect(ids(reg)).not.toContain("pci-phys-jailed-side-branch");
    // the operator measures the jailed branch: the registered sources alone raise it
    const st = pinchedBranch(x, loaded, true);
    expect(pwJailedBranchMeasured(st)).toBe(true);
    const ctx = pciTipContext({ ...x.snapshot(), state: st });
    expect(ctx.phase).toBe("physiology");
    expect(ctx.events).toContain("side-branch-compromise");
    expect(ids(ctx)).toContain("pci-phys-jailed-side-branch");
    expect(ids(ctx)).toContain("pci-mon-aortic-line-physiology");
  });

  it("no waiting.ts entry names pci-pressure-wire-console, so none is left unsatisfiable by it", () => {
    expect(WAITING_TIPS.filter((w) => w.raisedBy === PKG)).toEqual([]);
    expect(DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG)).toEqual([]);
    for (const id of ["pci-mon-aortic-line-physiology", "pci-phys-jailed-side-branch"]) expect(LAB_TIPS.some((t) => t.id === id), id).toBe(true);
  });
});

describe("practice links (pci-pressure-wire-console)", () => {
  it("the practice index lists lad-focal at 'guide engaged' under pm-monitoring-transducers, pm-physiology-after-pci and pm-imaging-coreg-ct from this package's .launch.ts", () => {
    expect(PW_LAUNCH.sim).toBe("angio-pci");
    for (const lesson of ["pm-monitoring-transducers", "pm-physiology-after-pci", "pm-imaging-coreg-ct"]) {
      const mine = practiceForLesson(lesson, PRACTICE_INDEX).filter((e) => e.sim === "angio-pci" && /pci-pressure-wire-console\.launch\.ts$/.test(e.source));
      expect(mine.length, lesson).toBeGreaterThan(0);
      for (const e of mine) {
        expect(e.scenario).toBe("lad-focal");
        expect(e.params).toMatchObject({ scenario: "lad-focal", start: "guide-engaged" });
      }
    }
    // the faulty-line cases carry the lab's own pwFault key
    const faults = practiceForLesson("pm-monitoring-transducers", PRACTICE_INDEX)
      .filter((e) => /pci-pressure-wire-console\.launch\.ts$/.test(e.source))
      .map((e) => e.params.pwFault)
      .sort();
    expect(faults).toEqual(["line-air", "transducer-loose", "transducer-unzeroed"]);
  });
});
