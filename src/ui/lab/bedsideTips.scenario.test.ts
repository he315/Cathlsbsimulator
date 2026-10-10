// Tip integration of the pericardiocentesis lab, driven from the scenarios of
// src/content/lab/presets/bedside/pericardio.launch.ts (pericardiocentesis-tips-and-pci-handover), the
// waiting.ts entries this package was expected to make satisfiable, and the practice index.
//   npx vitest run src/ui/lab/bedsideTips.scenario.test.ts
import { describe, expect, it } from "vitest";
import { LAB_TIPS, TIP_BY_ID, tipsFor, type LabTip, type TipTrigger } from "../../content/lab/tips";
import { WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import { launch } from "../../content/lab/presets/bedside/pericardio.launch";
import { PERIC_SCENARIOS, getPericScenario, haemodynamics, type PericScenarioId } from "../../simulation/pericardiocentesis";
import { practiceForCase, practiceForLesson } from "../content/practiceIndex";
import { pericardioTipContext, pericardioVitals, raises } from "./bedsideTips";
import { PatientEventAdapter, type PatientEvent } from "./patientEvents";

const PKG = "pericardiocentesis-tips-and-pci-handover";

/** The same rule as reachability.test.ts: a trigger can match given what a lab raises. */
function satisfiable(tip: LabTip, when: TipTrigger, r: LabRaises): boolean {
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

const WAITING = WAITING_TIPS.filter((g) => g.raisedBy === PKG).flatMap((g) => g.tips);

describe("pericardiocentesis tips from a pericardio.launch.ts scenario", () => {
  it("perforation-unstable: at the needle stage of the procedure tipsFor(ctx, 20) includes bed-peri-set-up and bed-peri-confirm-wire, with the run's perforation and the patient's tamponade", () => {
    const id: PericScenarioId = "perforation-unstable";
    expect(launch.scenarios?.some((s) => s.id === id)).toBe(true);
    const sc = getPericScenario(id);
    // the patient as the lab shows it, read by the shared adapter over the hypotension hold
    const h = haemodynamics(sc.initialVolume, sc);
    const adapter = new PatientEventAdapter();
    let ev: PatientEvent[] = [];
    for (let t = 0; t <= 12; t += 0.5) ev = adapter.update(pericardioVitals(t, h, sc.initialVolume), { echo: false });
    expect(ev).toEqual(expect.arrayContaining(["hypotension", "tamponade"]));
    const ctx = pericardioTipContext("needle", { events: [...(sc.events ?? []), ...ev], echo: false })!;
    expect(ctx).toMatchObject({ lab: "bedside", phase: "needle", procedures: ["pericardiocentesis"] });
    expect(ctx.events).toEqual(expect.arrayContaining(["perforation", "hypotension", "tamponade"]));
    const got = tipsFor(ctx, 20).map((t) => t.id);
    expect(got).toContain("bed-peri-set-up");
    expect(got).toContain("bed-peri-confirm-wire");
    expect(got).toContain("bed-peri-after-pci");
  });

  it("from-pci-perforation at the drain stage shows bed-peri-drain-stays and bed-peri-after-pci", () => {
    const sc = getPericScenario("from-pci-perforation");
    const got = tipsFor(pericardioTipContext("drain", { events: sc.events })!, 20).map((t) => t.id);
    expect(got).toEqual(expect.arrayContaining(["bed-peri-drain-stays", "bed-peri-after-pci"]));
  });

  it("every waiting.ts entry naming this package becomes satisfiable, so the bedside waiting count falls by at least their number", () => {
    expect(WAITING.length).toBe(4);
    const now = WAITING.filter((id) => TIP_BY_ID[id] && satisfiable(TIP_BY_ID[id], TIP_BY_ID[id].when, raises));
    expect(now.sort()).toEqual([...WAITING].sort());
    // without this package's raises none of them is
    const none: LabRaises = { lab: "bedside", phases: [], events: [] };
    expect(WAITING.filter((id) => satisfiable(TIP_BY_ID[id], TIP_BY_ID[id].when, none))).toEqual([]);
    // the bedside lab's waiting count, as the reachability report counts it, falls by at least their number
    const listed = new Set(WAITING_TIPS.flatMap((g) => g.tips));
    const bedside = LAB_TIPS.filter((t) => t.lab === "bedside");
    const waitingBefore = bedside.filter((t) => listed.has(t.id)).length;
    const stillWaiting = bedside.filter((t) => listed.has(t.id) && !satisfiable(t, t.when, raises)).length;
    expect(waitingBefore - stillWaiting).toBeGreaterThanOrEqual(WAITING.length);
  });
});

describe("launch metadata and the practice index", () => {
  it("pericardio.launch.ts declares every scenario of PERIC_SCENARIOS and no other", () => {
    expect(launch.sim).toBe("pericardiocentesis");
    const declared = (launch.scenarios ?? []).map((s) => s.id).sort();
    expect(declared).toEqual(PERIC_SCENARIOS.map((s) => s.id).sort());
    for (const id of ["from-pci-perforation", "perforation-stable-small", "perforation-unstable", "post-cabg-loculated"]) expect(declared).toContain(id);
  });

  it("practiceIndex lists every scenario in pericardio.launch.ts under its lessons, including cm-perforation-pericardiocentesis, cm-perforation-first-minutes and cm-perforation-collateral-cabg", () => {
    for (const s of launch.scenarios ?? []) {
      for (const l of s.lessonIds) expect(practiceForLesson(l).some((e) => e.sim === "pericardiocentesis" && e.scenario === s.id), `${s.id} under ${l}`).toBe(true);
      for (const c of s.caseIds ?? []) expect(practiceForCase(c).some((e) => e.sim === "pericardiocentesis" && e.scenario === s.id), `${s.id} under case ${c}`).toBe(true);
    }
    const under = (l: string) => practiceForLesson(l).filter((e) => e.sim === "pericardiocentesis").map((e) => e.scenario);
    expect(under("cm-perforation-pericardiocentesis")).toEqual(expect.arrayContaining(["from-pci-perforation", "perforation-unstable", "perforation-stable-small", "post-cabg-loculated"]));
    expect(under("cm-perforation-first-minutes")).toEqual(expect.arrayContaining(["from-pci-perforation", "perforation-unstable", "perforation-stable-small"]));
    expect(under("cm-perforation-collateral-cabg")).toContain("post-cabg-loculated");
  });
});
