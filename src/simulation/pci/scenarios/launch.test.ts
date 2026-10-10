/// <reference types="vite/client" />
// Launch links into the PCI lab (pci-scenario-registry): the core pack's .launch.ts validates, a link
// to an unknown scenario or start is refused, the practice index lists each scenario under the
// lessons it names, and src/ui/pci/launch.ts turns a link or a full-case transfer into the scenario,
// start, mode and events the lab opens with.
import { beforeEach, describe, expect, it } from "vitest";
import { ALL_CASES, TRACKS } from "../../../content/index";
import type { LaunchFile, Track } from "../../../content/schema";
import { buildKnownLaunch, validateLaunchLinks, type LaunchFiles } from "../../../content/validateLaunch";
import { PRACTICE_INDEX, practiceForCase, practiceForLesson } from "../../../ui/content/practiceIndex";
import { LADDER_PARAMS, examCaseIds, ladderFor, practiceCaseIds } from "../../../content/mentor/catalogue";
import { useLabLaunchStore } from "../../../state/useLabLaunchStore";
import { putHandover, useLabHandoverStore } from "../../../state/useLabHandoverStore";
import { resolvePciLaunch, subscribePciLaunch, takePciLaunch, type PciLaunchResult } from "../../../ui/pci/launch";
import { launch as CORE_LAUNCH } from "./packs/core.launch";
import { launch as CLOSURE_LAUNCH } from "./packs/closure.launch";
import { launch as COUPLING_LAUNCH } from "../../../content/practice/pci-patient-coupling.launch";
import { scenarios as CORE } from "./packs/core";
import { PCI_DEF_BY_ID } from "./registry";
import { useUiStore } from "../../../state/useUiStore";
import { pciScenarioById } from "../actions/scenario";

// The literal patterns match content.test.ts and src/ui/content/practiceIndex.ts.
const LAUNCH_FILES = import.meta.glob<LaunchFiles[string]>(["/src/**/*.launch.ts", "!/src/**/__fixtures__/**"], { eager: true });
/** The flow and closure variants the closure pack's launch file adds to the core cases (pci-flow-closure), as "scenario:variant". */
// variants other packs add to core scenarios through their launch links: closure, and pci-patient-coupling's hypotension and arrhythmia variants
const CLOSURE_ADDS = new Set([...(CLOSURE_LAUNCH.links ?? []), ...(COUPLING_LAUNCH.links ?? [])].flatMap((l) => (l.adds?.variants ?? []).map((v) => `${l.scenario}:${typeof v === "string" ? v : v.id}`)));
const CORE_PATH = "/src/simulation/pci/scenarios/packs/core.launch.ts";

/** A track with one lesson whose single block is a PCI-lab drill block with the given params. */
function fixtureTrack(params: Record<string, string>): Track {
  const t = TRACKS[0];
  const m = t.modules[0];
  const lesson = { ...m.lessons[0], id: "fixture-lesson", blocks: [{ kind: "drill" as const, target: "angio-pci" as const, task: "Practise.", params }] };
  return { ...t, modules: [{ ...m, lessons: [lesson] }], cases: [] };
}

describe("angio-pci launch links", () => {
  const known = buildKnownLaunch(LAUNCH_FILES);

  it("the core pack's launch file is found and the whole content with it validates", () => {
    expect(Object.keys(LAUNCH_FILES)).toContain(CORE_PATH);
    expect(validateLaunchLinks({ tracks: TRACKS, cases: ALL_CASES }, known)).toEqual([]);
    expect([...known.scenarios.get("angio-pci")!.keys()]).toEqual(expect.arrayContaining(["lad-focal", "rca-calcified", "lcx-stemi", "rca-cto"]));
  });

  it("validateLaunchLinks rejects an angio-pci link with an unknown scenario or start id", () => {
    // only the fixture lesson's own errors (the fixture track lacks the lessons the .launch.ts files name)
    const errs = (params: Record<string, string>) => validateLaunchLinks({ tracks: [fixtureTrack(params)] }, known).filter((e) => e.startsWith("fixture-lesson "));
    expect(errs({ scenario: "lad-focal", start: "wire-across", mode: "guided" })).toEqual([]);
    expect(errs({ scenario: "rca-calcified", variant: "pci-rca-calcified~L3" })).toEqual([]);
    expect(errs({ scenario: "no-such-pci-case" }).join("\n")).toMatch(/unknown scenario "no-such-pci-case" for angio-pci/);
    expect(errs({ scenario: "lad-focal", start: "no-such-start" }).join("\n")).toMatch(/unknown start "no-such-start" for scenario "lad-focal"/);
    // held-out exam variants are not declared, so a lesson cannot link one
    expect(errs({ scenario: "rca-cto", variant: examCaseIds("pci-cto")[0] }).join("\n")).toMatch(/unknown variant/);
    // the same refusal for a links entry of a .launch.ts file
    const fixture: LaunchFile = { sim: "angio-pci", links: [{ scenario: "lad-focal", start: "nowhere", lessonIds: [TRACKS[0].modules[0].lessons[0].id] }, { scenario: "ghost", lessonIds: [TRACKS[0].modules[0].lessons[0].id] }] };
    const k2 = buildKnownLaunch({ ...LAUNCH_FILES, "/test/fixture.launch.ts": { launch: fixture } });
    const e2 = validateLaunchLinks({ tracks: TRACKS, cases: ALL_CASES }, k2).join("\n");
    expect(e2).toMatch(/fixture\.launch\.ts link 0: unknown start "nowhere"/);
    expect(e2).toMatch(/fixture\.launch\.ts link 1: unknown scenario "ghost"/);
  });

  it("declares every core definition with its starts, and every practice ladder variant (no exam variant)", () => {
    expect(CORE_LAUNCH.scenarios!.map((s) => s.id)).toEqual(CORE.map((d) => d.id));
    for (const d of CORE) {
      const k = known.scenarios.get("angio-pci")!.get(d.id)!;
      expect([...k.starts.keys()]).toEqual(d.starts.map((s) => s.id));
      expect(k.heldOut).toBe(false);
      const ladder = ladderFor(d.epa);
      expect(ladder.pci!.base).toBe(d.id);
      const practice = practiceCaseIds(d.epa).filter((id) => id.includes("~"));
      expect(practice.length).toBe((LADDER_PARAMS.rungs - 1) * LADDER_PARAMS.practicePerRung);
      // rca-cto's 'long-case' variant is added by the multivessel pack's launch file (pci-budgets-stop-rules);
      // lad-focal's 'hemochron' and 'hit-bivalirudin' by the antithrombotic pack's (pci-antithrombotic-orders)
      const added = (v: string) => (d.id === "rca-cto" && v === "long-case") || (d.id === "lad-focal" && (v === "hemochron" || v === "hit-bivalirudin")) || CLOSURE_ADDS.has(`${d.id}:${v}`);
      expect([...k.variants.keys()].filter((v) => !added(v)).sort()).toEqual([...practice].sort());
      for (const x of examCaseIds(d.epa)) expect(k.variants.has(x), x).toBe(false);
    }
  });

  it("the practice index lists every core scenario under the lessons and cases its .launch.ts names, and every id resolves", () => {
    const lessons = new Set(TRACKS.flatMap((t) => t.modules.flatMap((m) => m.lessons.map((l) => l.id))));
    const cases = new Set(ALL_CASES.map((c) => c.id));
    for (const s of CORE_LAUNCH.scenarios!) {
      expect(s.lessonIds.length, s.id).toBeGreaterThan(0);
      for (const id of s.lessonIds) {
        expect(lessons.has(id), `${s.id}: lesson ${id}`).toBe(true);
        const e = practiceForLesson(id).find((x) => x.sim === "angio-pci" && x.scenario === s.id);
        expect(e, `${s.id} under ${id}`).toBeTruthy();
        expect(e!.params).toEqual({ scenario: s.id, mode: "guided" });
        expect(e!.source).toBe(CORE_PATH);
      }
      for (const id of s.caseIds ?? []) {
        expect(cases.has(id), `${s.id}: case ${id}`).toBe(true);
        expect(practiceForCase(id).some((x) => x.scenario === s.id)).toBe(true);
      }
      // the registry reads its lesson links from this file
      expect(PCI_DEF_BY_ID[s.id].lessonIds).toEqual(s.lessonIds);
    }
    expect(PRACTICE_INDEX.known.problems).toEqual([]);
  });
});

describe("src/ui/pci/launch.ts", () => {
  beforeEach(() => {
    useLabLaunchStore.getState().clear();
    useLabHandoverStore.getState().clear();
  });

  it("openSim-style params for rca-cto in exam mode resolve to that scenario, its default start and its events", () => {
    const r = resolvePciLaunch({ scenario: "rca-cto", mode: "exam" });
    expect(r.problems).toEqual([]);
    expect(r.launch!.resolved.scenario.id).toBe("rca-cto");
    expect(r.launch!.mode).toBe("exam");
    expect(r.launch!.start.id).toBe("guide-in-root");
    expect(r.launch!.events).toEqual(["cto"]);
    expect(r.launch!.source).toBe("link");
  });

  it("openSim('angio-pci', {scenario:'rca-cto', mode:'exam'}) leaves a launch the lab takes as rca-cto (headless half of the browser check)", () => {
    useUiStore.getState().openSim("angio-pci", { scenario: "rca-cto", mode: "exam" });
    const r = takePciLaunch()!;
    expect(r.problems).toEqual([]);
    expect(r.launch!.mode).toBe("exam");
    // the lab looks its scenario up by this id (pciScenarioById, which also resolves ladder variant ids)
    const id = r.launch!.resolved.scenario.id;
    expect(id).toBe("rca-cto");
    expect(pciScenarioById(id)!.id).toBe("rca-cto");
    expect(pciScenarioById("rca-calcified~L3")!.id).toBe("rca-calcified~L3");
    expect(pciScenarioById("pci-rca-calcified~L3")!.id).toBe("rca-calcified~L3");
    expect(pciScenarioById("ghost")).toBeUndefined();
    expect(takePciLaunch()).toBeNull();
  });

  it("a pending link is taken once through the launch store", () => {
    useLabLaunchStore.getState().request("angio-pci", { scenario: "rca-calcified", variant: "pci-rca-calcified~L3", start: "wire-across", events: "prior-cabg", technique: "provisional", step: "2" });
    const r = takePciLaunch()!;
    expect(r.launch!.resolved.variant!.id).toBe("pci-rca-calcified~L3");
    expect(r.launch!.resolved.scenario.id).toBe("rca-calcified~L3");
    expect(r.launch!.start.id).toBe("wire-across");
    expect(r.launch!.events).toEqual(["calcified-lesion", "prior-cabg"]);
    expect([r.launch!.technique, r.launch!.step]).toEqual(["provisional", 2]);
    expect(takePciLaunch()).toBeNull();
  });

  it("a full-case transfer is taken before a link, with its events and its own params", () => {
    useLabLaunchStore.getState().request("angio-pci", { scenario: "lad-focal" });
    putHandover({ to: "angio-pci", from: "procedure", params: { scenario: "lcx-stemi", start: "guide-engaged", mode: "supervised" }, events: ["post-arrest"] });
    const r = takePciLaunch()!;
    expect(r.launch!.source).toBe("handover");
    expect(r.handover!.from).toBe("procedure");
    expect(r.launch!.resolved.def.id).toBe("lcx-stemi");
    expect(r.launch!.start.id).toBe("guide-engaged");
    expect(r.launch!.mode).toBe("supervised");
    expect(r.launch!.events).toEqual(["stemi", "post-arrest"]);
    // the link pending beside the transfer is set aside, not delivered later over the transfer
    expect(r.problems.join()).toMatch(/link to "lad-focal" was set aside/);
    expect(takePciLaunch()).toBeNull();
  });

  it("subscribePciLaunch (usePciLaunch) delivers only the transfer when both are pending at mount, then each new arrival", () => {
    useLabLaunchStore.getState().request("angio-pci", { scenario: "lad-focal" });
    putHandover({ to: "angio-pci", from: "procedure", params: { scenario: "lcx-stemi" } });
    const got: PciLaunchResult[] = [];
    const off = subscribePciLaunch((r) => got.push(r));
    expect(got.map((r) => [r.launch!.source, r.launch!.resolved.def.id])).toEqual([["handover", "lcx-stemi"]]);
    useLabLaunchStore.getState().request("angio-pci", { scenario: "rca-cto" });
    expect(got.map((r) => r.launch!.resolved.def.id)).toEqual(["lcx-stemi", "rca-cto"]);
    putHandover({ to: "angio-pci", from: "procedure", params: { scenario: "rca-calcified" } });
    expect(got.map((r) => r.launch!.source)).toEqual(["handover", "link", "handover"]);
    off();
    useLabLaunchStore.getState().request("angio-pci", { scenario: "lad-focal" });
    expect(got.length).toBe(3);
  });

  it("refuses an unknown scenario and falls back, with a problem, for an unknown start or mode", () => {
    expect(resolvePciLaunch({ scenario: "ghost" }).launch).toBeNull();
    expect(resolvePciLaunch({ scenario: "ghost" }).problems.join()).toMatch(/unknown PCI scenario "ghost"/);
    expect(resolvePciLaunch({}).launch).toBeNull();
    const r = resolvePciLaunch({ scenario: "lad-focal", start: "nowhere", mode: "solo", events: "Bad Name,cto" });
    expect(r.launch!.start.id).toBe("guide-in-root");
    expect(r.launch!.mode).toBe("guided");
    expect(r.launch!.events).toEqual(["cto"]);
    expect(r.problems.length).toBe(3);
    const t = putHandover({ to: "angio-pci", from: "procedure", params: {} });
    expect(t).toBeGreaterThan(0);
    const h = takePciLaunch()!;
    expect(h.launch).toBeNull();
    expect(h.handover).not.toBeNull();
    expect(h.problems.join()).toMatch(/transfer names no PCI scenario/);
  });
});
