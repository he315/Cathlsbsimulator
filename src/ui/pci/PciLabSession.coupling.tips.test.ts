// Tips reached through the PCI lab session's own raises (pci-patient-coupling), beside the session that raises
// them (src/ui/pci/PciLabSession.ts `raises`, re-exported by src/ui/lab/pciEvents/index.ts for the reachability
// report): in lad-focal at a 'hypotension-*' variant, once the hidden cause has brought the pressure down and the
// lab has raised 'hypotension', the context is at the complication phase with the guide's family, and
// tipsFor(ctx, 20) includes pci-hypo-amplatz-valve and pci-hypo-rhc-when-unclear; before the fall it includes
// neither. VF puts the tips at the complication phase with the defibrillation tip. Every waiting.ts entry naming
// this package becomes satisfiable with the session's raises (there are none: the count cannot rise).
//   npx vitest run src/ui/pci/PciLabSession.coupling.tips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { TIP_BY_ID, tipsFor, type LabContext, type TipTrigger } from "../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import { PciLabSession, policyForMode, raises } from "./PciLabSession";
import { resolvePciLaunch } from "./launch";
import { useSeriesStore } from "../../state/useSeriesStore";
import { pciTipContext } from "../lab/pciTips";
import { withRecognition } from "../lab/pciEvents/recognition";

const PKG = "pci-patient-coupling";
const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

function lab(scenario: string, variant: string, start = "wire-across"): PciLabSession {
  const r = resolvePciLaunch({ scenario, start, variant, mode: "supervised" });
  expect(r.problems).toEqual([]);
  const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true, mode: "supervised", policy: policyForMode("supervised") });
  sessions.push(x);
  return x;
}

const run = (x: PciLabSession, s: number, dt = 0.1) => {
  for (let t = 0; t < s - 1e-9; t += dt) x.step(dt);
};
const ids = (ctx: LabContext, n = 20) => tipsFor(ctx, n).map((t) => t.id);

/** Can a trigger be met by these raises (phase, events, required events; the catheter and vessel are the lab's context)? */
function satisfiable(when: TipTrigger, r: LabRaises): boolean {
  if (when.phase?.length && !when.phase.some((p) => r.phases.includes(p))) return false;
  if (when.event?.length && !when.event.some((e) => r.events.includes(e))) return false;
  if (when.requires?.length && !when.requires.every((e) => r.events.includes(e))) return false;
  return true;
}

describe("tips after the hidden cause brings the pressure down (pci-patient-coupling)", () => {
  it("lad-focal at hypotension-vagal: after the fall that raises 'hypotension', the tips include pci-hypo-amplatz-valve and pci-hypo-rhc-when-unclear", () => {
    const x = lab("lad-focal", "hypotension-vagal");
    run(x, 5);
    const before = x.tipContext();
    expect(before.events).not.toContain("hypotension");
    expect(ids(before)).not.toContain("pci-hypo-amplatz-valve");
    expect(ids(before)).not.toContain("pci-hypo-rhc-when-unclear");
    // the cause starts and the pressure falls: the lab raises 'hypotension' once it has been low for its hold
    for (let t = 0; t < 90 && !x.tipContext().events?.includes("hypotension"); t++) run(x, 1);
    const ctx = x.tipContext();
    expect(ctx.events).toContain("hypotension");
    expect(ctx.phase).toBe("complication");
    expect(ctx.catheter).toBe("EBU");
    const shown = ids(ctx);
    expect(shown).toContain("pci-hypo-amplatz-valve");
    expect(shown).toContain("pci-hypo-rhc-when-unclear");
    // the cause itself is never named on the live screens: no tip or event names it
    expect(ctx.events).not.toContain("vagal");
  });

  it("lad-focal at hypotension-cusp-open: the guide holding the cusp open brings the pressure down and pci-hypo-amplatz-valve shows; pulling the guide back clears it", () => {
    const x = lab("lad-focal", "hypotension-cusp-open");
    run(x, 5);
    expect(ids(x.tipContext())).not.toContain("pci-hypo-amplatz-valve");
    for (let t = 0; t < 90 && !x.tipContext().events?.includes("hypotension"); t++) run(x, 1);
    // the live drawer's own path raises the fall too (its context does not carry the guide family yet: the
    // catheter-gated tip is reached through the session's context; pci-tip-context's contextOf, out of scope)
    expect(pciTipContext(withRecognition(x.snapshot())).events).toContain("hypotension");
    const ctx = x.tipContext();
    expect(ctx.events).toContain("hypotension");
    expect(ctx.catheter).toBe("EBU");
    expect(ids(ctx)).toContain("pci-hypo-amplatz-valve");
    expect(ctx.events).not.toContain("cusp-open");
  });

  it("VF puts the tips at the complication phase, with the defibrillator settings tip", () => {
    const x = lab("lcx-stemi", "arrest-wire-across");
    run(x, 9);
    const ctx = x.tipContext();
    expect(ctx.events).toContain("vf");
    expect(ctx.phase).toBe("complication");
    expect(ids(ctx)).toContain("pci-arrest-defib-settings");
  });

  it("the session's raises carry the complication phase and the coupling's events; every waiting.ts entry naming this package becomes satisfiable", () => {
    expect(raises.phases).toContain("complication");
    for (const e of ["hypotension", "bradycardia", "vf", "vt", "atrial-fibrillation", "st-elevation", "chest-pain", "pericardial-effusion", "tamponade", "cardiogenic-shock"] as const) expect(raises.events).toContain(e);
    const waiting = WAITING_TIPS.filter((w) => w.raisedBy === PKG).flatMap((w) => w.tips);
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG);
    for (const id of waiting) expect(satisfiable(TIP_BY_ID[id].when, raises), id).toBe(true);
    for (const d of deferred) expect(satisfiable(d.when, raises), d.tipId).toBe(true);
    // the two hypotension tips this package reaches were waiting on the PCI lab's raises: they are satisfiable now
    for (const id of ["pci-hypo-amplatz-valve", "pci-hypo-rhc-when-unclear"]) expect(satisfiable(TIP_BY_ID[id].when, raises), id).toBe(true);
    const without: LabRaises = { ...raises, phases: raises.phases.filter((p) => p !== "complication") };
    expect(satisfiable(TIP_BY_ID["pci-hypo-rhc-when-unclear"].when, without)).toBe(false);
  });
});
