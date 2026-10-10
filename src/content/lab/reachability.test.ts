// Reachability of the lab tips: which tips some lab can show, read from what the labs themselves
// say they raise. Every event source and tip-context file exports `raises` (LabRaises, or an array of
// them, one per lab it reports for); this test globs them, so no package keeps a hand-written list.
// Event sources built outside the lab folders (the angiography label and flow drills, the
// haemodynamics studies, the hand-over scenarios, the PCI attending, and the study report's finish
// step, which exports its events as FINISH_EVENTS rather than `raises`) are read too
// (repair-reachability-sources); the report prints the per-lab waiting counts without and with them.
// A tip that no lab can satisfy must be listed in raisable/waiting.ts, either waiting on its current
// trigger or as a deferred retarget; an entry whose names are now raised is reported as ready, and an
// entry naming a tip that no longer exists is a warning. The test fails only for a tip that is neither
// satisfiable nor listed, or for an entry that does not name a known package and a valid trigger.
//   npx vitest run src/content/lab/reachability.test.ts
import { describe, expect, it } from "vitest";
import {
  ACCESS_ROUTES,
  BIF_TECHNIQUES,
  IMAGING_MODALITIES,
  LAB_EVENTS,
  LAB_PHASES,
  LAB_PROCEDURES,
  LAB_TIPS,
  TIP_BY_ID,
  type LabId,
  type LabTip,
  type TipTrigger,
} from "./tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "./raisable/waiting";
import { validateTips } from "../validate";
import { REFERENCES } from "../refs";
import plan from "../../../docs/curriculum/lab-build-plan.json";
import { FINISH_EVENTS } from "../../mentor/report";
import { raises as pciSessionRaises } from "../../ui/pci/PciLabSession";

// ---------------------------------------------------------------------------
// What the labs raise
// ---------------------------------------------------------------------------

type RaisesExport = LabRaises | readonly LabRaises[] | undefined;

/** The event sources and tip-context files of every lab (section 2 of LAB_BUILD_PLAN.md); a module without `raises` is skipped. */
const RAISE_MODULES = import.meta.glob<RaisesExport>(
  [
    "../../ui/lab/pciEvents/*.ts",
    "../../ui/sim/modules/*.ts",
    "../../simulation/session/modules/*.ts",
    "../../ui/lab/*Context.ts",
    "../../ui/**/*Tips.ts",
    "!**/*.test.ts",
  ],
  { eager: true, import: "raises" }
);

/**
 * Event sources that live outside the folders above (repair-reachability-sources): the label drills
 * (angio-expert-label-drills), the simulated-flow drill, the haemodynamics studies (avCrossing.ts,
 * haemo-aortic-stenosis-studies), the hand-over gate scenarios and the PCI attending. The PCI lab
 * session's own raises (src/ui/pci/PciLabSession.ts) reach the report through
 * src/ui/lab/pciEvents/index.ts, which re-exports them, so it is not listed again here.
 */
const EXTRA_RAISE_MODULES = import.meta.glob<RaisesExport>(
  [
    "../../ui/angio/labels.ts",
    "../../ui/angio/simFlowDrill.ts",
    "../../simulation/haemo/*.ts",
    "../../simulation/session/scenarios/heparin.ts",
    "../../mentor/bridge/pciSession.ts",
    "../../simulation/session/ward.ts",
    // the pressure recognition drill's event source (diag-pressure-recognition-drill)
    "../../simulation/pressureDrill.ts",
    "!**/*.test.ts",
  ],
  { eager: true, import: "raises" }
);

/** The files the extra glob must find with a `raises` export (the sources this report was repaired to read). */
const EXTRA_SOURCE_FILES = [
  "../../ui/angio/labels.ts",
  "../../ui/angio/simFlowDrill.ts",
  "../../simulation/haemo/avCrossing.ts",
  "../../simulation/session/scenarios/heparin.ts",
  "../../mentor/bridge/pciSession.ts",
  "../../simulation/session/ward.ts",
  "../../simulation/pressureDrill.ts",
] as const;

/**
 * The study report's finish step (diag-study-report): src/mentor/report.ts exports the events the open
 * report raises as FINISH_EVENTS (territory-unsupplied, anomalous-origin, cto), raised at phase
 * 'finish' through the lab session's event log, not as a `raises` object.
 */
const REPORT_FILE = "../../mentor/report.ts (FINISH_EVENTS)";
const REPORT_FINISH_RAISES: LabRaises = { lab: "diagnostic", phases: ["finish"], events: [...FINISH_EVENTS] };

type Declaration = { file: string; raises: LabRaises };

function fromModules(mods: Record<string, RaisesExport>): Declaration[] {
  const out: Declaration[] = [];
  for (const [file, exp] of Object.entries(mods)) {
    if (!exp) continue;
    const list: readonly LabRaises[] = Array.isArray(exp) ? exp : [exp as LabRaises];
    for (const raises of list) out.push({ file, raises });
  }
  return out;
}

/** The globbed lab folders only: what the report read before repair-reachability-sources. */
function declaredInLabFolders(): Declaration[] {
  return fromModules(RAISE_MODULES);
}

/** Every declaration the report reads: the lab folders, the sources outside them and the report's finish step. */
function declared(): Declaration[] {
  return [...declaredInLabFolders(), ...fromModules(EXTRA_RAISE_MODULES), { file: REPORT_FILE, raises: REPORT_FINISH_RAISES }];
}

interface Raised {
  phases: Set<string>;
  events: Set<string>;
  techniques: Set<string>;
  imaging: Set<string>;
  procedures: Set<string>;
  routes: Set<string>;
}
type RaisedByLab = Partial<Record<LabId, Raised>>;

/** The union of every declaration per lab. Two raises of one lab may come from different moments, so this over-approximates. */
function mergeRaises(list: readonly LabRaises[]): RaisedByLab {
  const out: RaisedByLab = {};
  for (const r of list) {
    const m = (out[r.lab] ??= { phases: new Set(), events: new Set(), techniques: new Set(), imaging: new Set(), procedures: new Set(), routes: new Set() });
    r.phases.forEach((x) => m.phases.add(x));
    r.events.forEach((x) => m.events.add(x));
    r.techniques?.forEach((x) => m.techniques.add(x));
    r.imaging?.forEach((x) => m.imaging.add(x));
    r.procedures?.forEach((x) => m.procedures.add(x));
    r.routes?.forEach((x) => m.routes.add(x));
  }
  return out;
}

const any = (want: readonly string[] | undefined, have: Set<string>) => !want?.length || want.some((x) => have.has(x));

/**
 * Whether a trigger can match in a lab, given what the lab raises: its phase (or the borrow's phases),
 * one of its events, every required event, and its procedure, route, technique and imaging. Catheter,
 * engagement, pressure and vessel are read from the lab's own state, not declared, so they are not
 * checked here; a step needs its technique.
 */
function satisfiableIn(when: TipTrigger, phases: readonly string[] | undefined, r: Raised | undefined): boolean {
  if (!r) return false;
  return (
    any(phases, r.phases) &&
    any(when.event, r.events) &&
    (when.requires ?? []).every((e) => r.events.has(e)) &&
    any(when.procedure, r.procedures) &&
    any(when.route, r.routes) &&
    any(when.technique, r.techniques) &&
    any(when.imaging, r.imaging)
  );
}

/** Whether some lab can show the tip with this trigger: its own lab, or a lab it is borrowed into. */
function satisfiable(tip: LabTip, when: TipTrigger, raised: RaisedByLab): boolean {
  if (satisfiableIn(when, when.phase, raised[tip.lab])) return true;
  return (tip.alsoIn ?? []).some((a) => satisfiableIn(when, a.phase, raised[a.lab]));
}

// ---------------------------------------------------------------------------
// The report
// ---------------------------------------------------------------------------

const PACKAGES = new Map((plan as { id: string; priority: string }[]).map((p) => [p.id, p.priority]));
const LESSON_OF = new Set(LAB_TIPS.map((t) => t.lessonId));
const REF_IDS = new Set(REFERENCES.map((r) => r.id));

interface Report {
  /** per lab: tips some lab can show now, tips listed in waiting.ts, and listed entries that are now satisfiable */
  counts: Record<string, { tips: number; satisfiable: number; waiting: number; ready: number }>;
  unlisted: string[];
  ready: string[];
  stale: string[];
}

function reachability(raised: RaisedByLab): Report {
  const waitingTip = new Map<string, string>();
  for (const g of WAITING_TIPS) for (const id of g.tips) waitingTip.set(id, g.raisedBy);
  const deferred = new Map(DEFERRED_RETARGETS.map((d) => [d.tipId, d]));
  const counts: Report["counts"] = {};
  const unlisted: string[] = [];
  const ready: string[] = [];
  for (const tip of LAB_TIPS) {
    const c = (counts[tip.lab] ??= { tips: 0, satisfiable: 0, waiting: 0, ready: 0 });
    c.tips += 1;
    const now = satisfiable(tip, tip.when, raised);
    if (now) c.satisfiable += 1;
    const d = deferred.get(tip.id);
    const listed = waitingTip.has(tip.id) || !!d;
    if (listed) c.waiting += 1;
    // a waiting tip is ready once it is satisfiable; a deferred retarget once its new trigger is
    const isReady = d ? satisfiable(tip, d.when, raised) : waitingTip.has(tip.id) && now;
    if (isReady) {
      c.ready += 1;
      ready.push(`${tip.id} (${d ? "retarget" : "waiting"}, ${d?.raisedBy ?? waitingTip.get(tip.id)})`);
    }
    if (!now && !listed) unlisted.push(tip.id);
  }
  const stale = [...waitingTip.keys(), ...deferred.keys()].filter((id) => !TIP_BY_ID[id]);
  return { counts, unlisted, ready, stale };
}

function print(r: Report, declarations: number) {
  const rows = Object.entries(r.counts).map(([lab, c]) => `${lab.padEnd(11)} ${String(c.tips).padStart(4)} tips  satisfiable ${String(c.satisfiable).padStart(4)}  waiting ${String(c.waiting).padStart(4)}  ready ${String(c.ready).padStart(4)}`);
  console.info(`lab tip reachability (from ${declarations} raises declarations)\n${rows.join("\n")}`);
  if (r.ready.length) console.info(`ready (names now raised; tip-retarget-catchup or content-links-backfill-p2 applies or removes them):\n  ${r.ready.join("\n  ")}`);
  if (r.stale.length) console.warn(`stale waiting.ts entries (tip no longer exists): ${r.stale.join(", ")}`);
}

/** Entries listed in waiting.ts whose names are not yet raised, per lab (listed minus ready). */
const stillWaiting = (r: Report) => Object.fromEntries(Object.entries(r.counts).map(([lab, c]) => [lab, c.waiting - c.ready]));

/** The per-lab waiting counts without and with the sources outside the lab folders, and the entries they make ready. */
/** Per lab, the phases, events and other names the full set raises that the lab folders alone do not ("kind:name"). */
function namesAdded(base: RaisedByLab, full: RaisedByLab): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [lab, m] of Object.entries(full) as [LabId, Raised][]) {
    const b = base[lab];
    const added: string[] = [];
    for (const kind of ["phases", "events", "techniques", "imaging", "procedures", "routes"] as const)
      m[kind].forEach((x) => {
        if (!b?.[kind].has(x)) added.push(`${kind}:${x}`);
      });
    if (added.length) out[lab] = added.sort();
  }
  return out;
}

function printBeforeAfter(before: Report, after: Report, added: Record<string, string[]>) {
  const b = stillWaiting(before);
  const a = stillWaiting(after);
  const rows = Object.keys(after.counts).map((lab) => `${lab.padEnd(11)} still waiting ${String(b[lab] ?? 0).padStart(4)} -> ${String(a[lab] ?? 0).padStart(4)}`);
  const was = new Set(before.ready);
  const newly = after.ready.filter((x) => !was.has(x));
  console.info(
    `waiting counts per lab, lab folders only (${declaredInLabFolders().length} declarations) -> with the sources outside them (${declared().length}):\n${rows.join("\n")}` +
      `\nnewly ready (${newly.length}):\n  ${newly.join("\n  ") || "none"}` +
      `\nnames the sources outside the lab folders add that the lab folders lack:\n  ${
        Object.entries(added)
          .map(([lab, xs]) => `${lab}: ${xs.join(", ")}`)
          .join("\n  ") || "none"
      }`
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("lab tip reachability", () => {
  it("every raises export uses the shared vocabulary", () => {
    const problems: string[] = [];
    for (const { file, raises: r } of declared()) {
      const phases = LAB_PHASES[r.lab] as readonly string[] | undefined;
      if (!phases) {
        problems.push(`${file}: unknown lab "${r.lab}"`);
        continue;
      }
      for (const p of r.phases) if (!phases.includes(p)) problems.push(`${file}: "${p}" is not a ${r.lab} phase`);
      for (const e of r.events) if (!(LAB_EVENTS as readonly string[]).includes(e)) problems.push(`${file}: unknown event "${e}"`);
      for (const x of r.techniques ?? []) if (!(BIF_TECHNIQUES as readonly string[]).includes(x)) problems.push(`${file}: unknown technique "${x}"`);
      for (const x of r.imaging ?? []) if (!(IMAGING_MODALITIES as readonly string[]).includes(x)) problems.push(`${file}: unknown imaging "${x}"`);
      for (const x of r.procedures ?? []) if (!(LAB_PROCEDURES as readonly string[]).includes(x)) problems.push(`${file}: unknown procedure "${x}"`);
      for (const x of r.routes ?? []) if (!(ACCESS_ROUTES as readonly string[]).includes(x)) problems.push(`${file}: unknown route "${x}"`);
    }
    expect(problems).toEqual([]);
  });

  it("every tip is satisfiable by some lab's raises or listed in waiting.ts; prints the counts per lab", () => {
    const r = reachability(mergeRaises(declared().map((d) => d.raises)));
    print(r, declared().length);
    expect(r.unlisted).toEqual([]);
  });

  it("reads the event sources outside the lab folders and prints the waiting counts without and with them", () => {
    const files = new Set(declared().map((d) => d.file));
    // each source outside the lab folders is read, with its raises
    expect(EXTRA_SOURCE_FILES.filter((f) => !files.has(f))).toEqual([]);
    // the haemodynamics folder is globbed, so a new study there is read without editing this list
    expect(Object.keys(EXTRA_RAISE_MODULES).filter((f) => f.startsWith("../../simulation/haemo/")).length).toBeGreaterThanOrEqual(1);
    // the study report's finish step raises its events at phase 'finish'
    const finish = declared().find((d) => d.file === REPORT_FILE)!.raises;
    expect(finish.phases).toEqual(["finish"]);
    expect([...finish.events].sort()).toEqual(["anomalous-origin", "cto", "territory-unsupplied"]);
    // the PCI lab session's raises reach the report through pciEvents/index.ts
    expect(declaredInLabFolders().some((d) => d.file === "../../ui/lab/pciEvents/index.ts" && d.raises === pciSessionRaises)).toBe(true);

    const baseRaised = mergeRaises(declaredInLabFolders().map((d) => d.raises));
    const fullRaised = mergeRaises(declared().map((d) => d.raises));
    const before = reachability(baseRaised);
    const after = reachability(fullRaised);
    // the output names anything the outside sources add, so a future source that adds names shows up
    printBeforeAfter(before, after, namesAdded(baseRaised, fullRaised));
    // the anomalous-origin tips, raised at the study report's finish step, count as ready
    // (the scenario scripts raise anomalous-origin too; the finish step's declaration alone suffices)
    const finishOnly = mergeRaises([REPORT_FINISH_RAISES]);
    for (const id of ["diag-anomalous-origin-image-first", "diag-interp-anomalous-cx-search"]) {
      expect(after.ready.some((x) => x.startsWith(`${id} `)), id).toBe(true);
      expect(satisfiable(TIP_BY_ID[id], TIP_BY_ID[id].when, finishOnly), id).toBe(true);
    }
  });

  it("every waiting.ts entry names a planned package and its own lab, and no tip is listed twice", () => {
    const problems: string[] = [];
    const seen = new Set<string>();
    for (const g of WAITING_TIPS) {
      if (!PACKAGES.has(g.raisedBy)) problems.push(`waiting ${g.raisedBy}: not a package in lab-build-plan.json`);
      if (!g.tips.length) problems.push(`waiting ${g.raisedBy}: no tips`);
      for (const id of g.tips) {
        if (seen.has(id)) problems.push(`${id}: listed twice`);
        seen.add(id);
        const tip = TIP_BY_ID[id];
        if (tip && tip.lab !== g.lab) problems.push(`${id}: listed under ${g.lab}, but it is a ${tip.lab} tip`);
      }
    }
    for (const d of DEFERRED_RETARGETS) {
      if (seen.has(d.tipId)) problems.push(`${d.tipId}: listed twice`);
      seen.add(d.tipId);
    }
    expect(problems).toEqual([]);
  });

  it("every deferred retarget in waiting.ts names its new trigger and raisedBy package", () => {
    const problems: string[] = [];
    for (const d of DEFERRED_RETARGETS) {
      const w = `retarget ${d.tipId}`;
      if (!PACKAGES.has(d.raisedBy)) problems.push(`${w}: raisedBy "${d.raisedBy}" is not a package in lab-build-plan.json`);
      if (!Object.values(d.when).some((x) => Array.isArray(x) && x.length)) problems.push(`${w}: the new trigger sets no condition`);
      const tip = TIP_BY_ID[d.tipId];
      if (!tip) continue; // stale: reported as a warning
      // the new trigger must pass the same vocabulary checks as a live tip
      for (const e of validateTips([{ ...tip, when: d.when }], LESSON_OF, REF_IDS)) problems.push(`${w}: ${e}`);
    }
    expect(problems).toEqual([]);
    expect(DEFERRED_RETARGETS.length).toBeGreaterThan(0);
  });

  it("reports ready entries once a lab raises their names", () => {
    // a fixture lab that raises everything the PCI lab's tip context will, plus the perforation subtypes
    const fixture: LabRaises[] = [
      { lab: "pci", phases: [...LAB_PHASES.pci], events: ["perforation", "perforation-large-vessel", "perforation-distal", "dissection", "cto"], imaging: ["ivus", "oct"] },
    ];
    const raised = mergeRaises(fixture);
    expect(satisfiable(TIP_BY_ID["pci-perf-balloon-now"], TIP_BY_ID["pci-perf-balloon-now"].when, raised)).toBe(true);
    expect(satisfiable(TIP_BY_ID["pci-img-oct-marker"], TIP_BY_ID["pci-img-oct-marker"].when, raised)).toBe(true);
    // a retrograde tip waits for 'retrograde'
    const retro = DEFERRED_RETARGETS.find((d) => d.tipId === "pci-cto-retro-septal-surf")!;
    expect(satisfiable(TIP_BY_ID[retro.tipId], retro.when, raised)).toBe(false);
    const r = reachability(raised);
    expect(r.ready).toEqual(expect.arrayContaining(["pci-perf-covered-one-guide (retarget, pci-perforation)", "pci-perf-balloon-now (waiting, pci-tip-context)"]));
    expect(r.ready.some((x) => x.startsWith("pci-cto-retro-septal-surf"))).toBe(false);
    // a borrowed tip is satisfiable through the borrowing lab alone
    const borrowed = TIP_BY_ID["pci-interp-qca-calibrate"];
    expect(satisfiable(borrowed, borrowed.when, mergeRaises([{ lab: "diagnostic", phases: ["views"], events: [] }]))).toBe(true);
    expect(satisfiable(borrowed, borrowed.when, mergeRaises([{ lab: "diagnostic", phases: ["setup"], events: [] }]))).toBe(false);
  });
});
