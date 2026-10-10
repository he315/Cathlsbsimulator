// Tips from the imaging event sources (pci-intravascular-imaging), driven in the calcified mid-RCA scenario of
// the core pack. The case is opened at 'wire across' and a 3.0 mm stent is deployed at 10 atm on the lesion:
// the state the plan calls 'stent-deployed-underexpanded' (the core pack declares no such start yet, so the
// test builds it with the lab's own actions). After the run, the trainee's own assessment raises
// 'stent-underexpanded' (pci-eqb-postdil-which-balloon), and a named edge dissection raises 'dissection'
// (pci-optimise-edge-dissection); every waiting.ts entry naming this package is satisfiable, and the practice
// index lists the scenarios under the imaging lessons.
//   npx vitest run src/ui/lab/pciEvents/imaging.tips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { LAB_TIPS, tipsFor, type LabContext, type LabTip } from "../../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { deflate, inflate, loadDevice, moveDevice, removeDevice, stepPci, type PciState } from "../../../simulation/angioPci";
import { advanceImaging, ivusReport, loadImaging, recordAssessment, setImagingSettings, startImagingRun } from "../../../simulation/pci/actions/imaging";
import { PciLabSession } from "../../pci/PciLabSession";
import { resolvePciLaunch } from "../../pci/launch";
import { useSeriesStore } from "../../../state/useSeriesStore";
import { pciTipContext, sourceActive } from "../pciTips";
import { PRACTICE_INDEX, practiceForLesson } from "../../content/practiceIndex";
import { launch as IMAGING_LAUNCH } from "../../../content/practice/pci-intravascular-imaging.launch";
import { PCI_EVENT_SOURCES, leftMainCase, raises as IMAGING_RAISES, standingAssessment } from "./imaging";

const PKG = "pci-intravascular-imaging";

/** Every raises export the reachability report reads (the same globs as src/content/lab/reachability.test.ts). */
const RAISE_MODULES = import.meta.glob<LabRaises | readonly LabRaises[] | undefined>(
  ["../pciEvents/*.ts", "../../sim/modules/*.ts", "../../../simulation/session/modules/*.ts", "../*Context.ts", "../../**/*Tips.ts", "!**/*.test.ts"],
  { eager: true, import: "raises" }
);
const declared = (skip?: RegExp): LabRaises[] =>
  Object.entries(RAISE_MODULES)
    .filter(([file, exp]) => !!exp && (!skip || !skip.test(file)))
    .flatMap(([, exp]) => (Array.isArray(exp) ? exp : [exp as LabRaises]))
    .filter((r) => r.lab === "pci");

/** The reachability report's rule for one lab's raises (src/content/lab/reachability.test.ts). */
function satisfiable(when: LabTip["when"], list: readonly LabRaises[]): boolean {
  const u = (k: "phases" | "events" | "imaging") => new Set(list.flatMap((r) => (r[k] ?? []) as readonly string[]));
  const any = (want: readonly string[] | undefined, have: Set<string>) => !want?.length || want.some((x) => have.has(x));
  return any(when.phase, u("phases")) && any(when.event, u("events")) && (when.requires ?? []).every((e) => u("events").has(e)) && any(when.imaging, u("imaging")) && !when.technique?.length && !when.procedure?.length && !when.route?.length;
}

const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

const ids = (ctx: LabContext, n = 20) => tipsFor(ctx, n).map((t) => t.id);
const source = (event: string) => PCI_EVENT_SOURCES.find((s) => s.event === event)!;

/** rca-calcified at 'wire across' with a 3.0 x 23 mm stent deployed at 10 atm (underexpanded on the calcium). */
function underexpandedStart(): { x: PciLabSession; st: PciState } {
  const r = resolvePciLaunch({ scenario: "rca-calcified", start: "wire-across", mode: "supervised" });
  expect(r.problems).toEqual([]);
  const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
  sessions.push(x);
  let st = loadDevice(x.st, "stent", "semi-compliant", 3.0, 23);
  st = moveDevice(st, x.g.lesion.centreMm - st.device!.centreMm);
  st = removeDevice(deflate(inflate(x.s, x.g, st, 10)));
  return { x, st };
}

/** A motorised IVUS run over the stent. */
function imageIt(x: PciLabSession, st0: PciState): PciState {
  let st = loadImaging(st0, "ivus", { assisted: true });
  for (let i = 0; i < 80 && st.device!.centreMm < x.g.lesion.endMm + 12; i++) st = advanceImaging(x.s, x.g, st, 2);
  expect(st.device!.centreMm).toBeGreaterThan(x.g.lesion.endMm);
  st = startImagingRun(x.s, x.g, setImagingSettings(st, { speedMmS: 10 }));
  for (let i = 0; i < 400 && st.ivus!.active; i++) st = stepPci(x.s, x.g, st, 0.25);
  return st;
}

describe("imaging event tips in rca-calcified (pci-intravascular-imaging)", () => {
  it("after the trainee's assessment of an underexpanded stent raises 'stent-underexpanded', the tips include pci-eqb-postdil-which-balloon", () => {
    const { x, st: deployed } = underexpandedStart();
    let st = imageIt(x, deployed);
    const before = pciTipContext({ ...x.snapshot(), state: st });
    expect(before.phase).toBe("imaging");
    expect(before.imaging).toBe("ivus");
    expect(sourceActive(source("stent-underexpanded"), { ...x.snapshot(), state: st })).toBe(false);
    // the action: the trainee records what they measured on the run (their MSA against their references)
    const truth = ivusReport(x.s, x.g, st, x.drawTree)!;
    st = recordAssessment(st, { modality: "IVUS", postStent: true, msaMm2: truth.msa! + 0.1, proxRefMm2: 9.5, distRefMm2: 6.5 });
    const snap = { ...x.snapshot(), state: st };
    expect(sourceActive(source("stent-underexpanded"), snap)).toBe(true);
    const ctx = pciTipContext(snap);
    expect(ctx.events).toContain("stent-underexpanded");
    expect(ids(ctx)).toContain("pci-eqb-postdil-which-balloon");
    // a post-dilatation ends the finding: it calls for a new run
    let post = removeDevice(st);
    post = loadDevice(post, "balloon", "non-compliant", 3.5, 12);
    post = moveDevice(post, x.g.lesion.centreMm - post.device!.centreMm);
    post = removeDevice(deflate(inflate(x.s, x.g, post, 20)));
    expect(standingAssessment(post)).toBeNull();
    expect(sourceActive(source("stent-underexpanded"), { ...x.snapshot(), state: post })).toBe(false);
  });

  it("after the trainee names an edge dissection on the run, 'dissection' is raised and the tips include pci-optimise-edge-dissection", () => {
    const { x, st: deployed } = underexpandedStart();
    let st = removeDevice(imageIt(x, deployed));
    const before = pciTipContext({ ...x.snapshot(), state: st });
    expect(before.phase).toBe("optimise");
    expect(before.events).not.toContain("dissection");
    expect(ids(before)).not.toContain("pci-optimise-edge-dissection");
    // the action: the assessment names a distal edge dissection of 90 degrees over 4 mm
    st = recordAssessment(st, { modality: "IVUS", postStent: true, msaMm2: 7, proxRefMm2: 8, distRefMm2: 7, edgeDissection: { edge: "distal", arcDeg: 90, lengthMm: 4 } });
    const ctx = pciTipContext({ ...x.snapshot(), state: st });
    // naming it is the recognition: raised, and the tips stay at the optimise phase
    expect(ctx.phase).toBe("optimise");
    expect(ctx.events).toContain("dissection");
    expect(ids(ctx)).toContain("pci-optimise-edge-dissection");
    // thrombus named on a run is raised too
    const th = recordAssessment(st, { modality: "IVUS", postStent: true, thrombus: true });
    expect(pciTipContext({ ...x.snapshot(), state: th }).events).toContain("thrombus");
  });

  it("a case that names a left main lesion applies the left main MSA target: 7 mm² on IVUS is underexpanded there, not elsewhere", () => {
    const { x, st: deployed } = underexpandedStart();
    // 7 mm² is above 80% of the 8 mm² references and above the IVUS target, but not above the left main's
    const st = recordAssessment(imageIt(x, deployed), { modality: "IVUS", postStent: true, msaMm2: 7, proxRefMm2: 8, distRefMm2: 8 });
    expect(standingAssessment(st)!.leftMain).toBeUndefined();
    const plain = { ...x.snapshot(), state: st };
    expect(sourceActive(source("stent-underexpanded"), plain)).toBe(false);
    const lm = { ...plain, start: { ...(plain.start ?? {}), events: [...(plain.start?.events ?? []), "left-main-lesion" as const] } };
    expect(leftMainCase(lm)).toBe(true);
    expect(sourceActive(source("stent-underexpanded"), lm)).toBe(true);
    expect(pciTipContext(lm).events).toContain("stent-underexpanded");
  });

  it("an OCT catheter on the wire in lad-focal gives the tip context phase 'imaging' and modality 'oct'", () => {
    const r = resolvePciLaunch({ scenario: "lad-focal", start: "wire-across", mode: "supervised" });
    expect(r.problems).toEqual([]);
    const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
    sessions.push(x);
    const st = loadImaging(x.st, "oct");
    expect(st.device?.kind).toBe("ivus");
    const ctx = pciTipContext({ ...x.snapshot(), state: st });
    expect(ctx.phase).toBe("imaging");
    expect(ctx.imaging).toBe("oct");
  });
});

describe("reachability of the waiting tips (pci-intravascular-imaging)", () => {
  const all: LabRaises[] = declared();
  const without: LabRaises[] = declared(/(^|\/)imaging\.ts$/);

  it("raises is derived from the sources and uses the shared vocabulary", () => {
    expect(IMAGING_RAISES.lab).toBe("pci");
    expect([...IMAGING_RAISES.events].sort()).toEqual([...new Set(PCI_EVENT_SOURCES.map((s) => s.event))].sort());
    expect(IMAGING_RAISES.phases).toEqual(expect.arrayContaining(["imaging", "optimise"]));
    expect(IMAGING_RAISES.imaging).toEqual(expect.arrayContaining(["ivus", "oct"]));
    expect(all.length).toBe(without.length + 1);
  });

  it("every waiting.ts entry naming pci-intravascular-imaging is satisfiable, and the pci waiting count does not rise", () => {
    const entries = WAITING_TIPS.filter((w) => w.raisedBy === PKG);
    for (const id of entries.flatMap((w) => w.tips)) {
      const tip = LAB_TIPS.find((t) => t.id === id);
      expect(tip, id).toBeDefined();
      expect(satisfiable(tip!.when, all), `${id} is satisfiable`).toBe(true);
    }
    for (const d of DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG)) expect(satisfiable(d.when, all), d.tipId).toBe(true);
    const pciWaiting = (list: readonly LabRaises[]) => LAB_TIPS.filter((t) => t.lab === "pci" && WAITING_TIPS.some((w) => w.tips.includes(t.id)) && !satisfiable(t.when, list)).length;
    expect(pciWaiting(without) - pciWaiting(all)).toBeGreaterThanOrEqual(entries.flatMap((w) => w.tips).length);
    // the contribution made explicit: when waiting.ts names no entry for this package (as now), the count check
    // above holds trivially; the two event tips it targets are satisfiable with its raises and were already satisfiable
    // without them (other PCI sources raise 'stent-underexpanded' and 'dissection'). What this package adds is the
    // in-lab path to them from the trainee's own run, which the scenario tests above drive.
    for (const id of ["pci-eqb-postdil-which-balloon", "pci-optimise-edge-dissection"]) {
      const when = LAB_TIPS.find((t) => t.id === id)!.when;
      expect(satisfiable(when, all), `${id} with this package`).toBe(true);
      expect(satisfiable(when, without), `${id} without this package`).toBe(true);
    }
    // the tips this package targets are reachable from the PCI lab's raises
    for (const id of ["pci-eqb-postdil-which-balloon", "pci-optimise-edge-dissection", "pci-img-ivus-clear-view", "pci-img-oct-flush-rates", "pci-img-cannot-cross"]) {
      expect(satisfiable(LAB_TIPS.find((t) => t.id === id)!.when, all), id).toBe(true);
    }
  });
});

describe("practice links (pci-intravascular-imaging)", () => {
  it("the practice index lists rca-calcified and lad-focal under pm-imaging-ivus, pm-imaging-oct and pm-imaging-optimisation from this package's .launch.ts", () => {
    expect(IMAGING_LAUNCH.sim).toBe("angio-pci");
    for (const lesson of ["pm-imaging-ivus", "pm-imaging-oct", "pm-imaging-optimisation"]) {
      const mine = practiceForLesson(lesson, PRACTICE_INDEX).filter((e) => e.sim === "angio-pci" && /pci-intravascular-imaging\.launch\.ts$/.test(e.source));
      expect(mine.map((e) => e.scenario).sort(), lesson).toEqual(["lad-focal", "rca-calcified"]);
      for (const e of mine) {
        expect(e.start).toBe("wire-across");
        expect(e.params).toMatchObject({ scenario: e.scenario, start: "wire-across", mode: "guided" });
      }
    }
  });
});
