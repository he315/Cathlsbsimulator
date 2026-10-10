/// <reference types="vite/client" />
// The PCI scenario registry (pci-scenario-registry): every definition builds its anatomy and
// geometry, the core four reproduce the engine state of the earlier hard-coded PCI_SCENARIOS,
// variants resolve as the competency ladder defines them, and start states open where they say.
import { describe, expect, it } from "vitest";
import { buildAnatomy } from "../../anatomy";
import { buildCoronaryTree } from "../../../render/xray/coronaryTree";
import { LADDER_PARAMS, PCI_BASES, applyPciVariant, fnv, ladderFor, pciVariantById } from "../../../content/mentor/catalogue";
import { PCI_SCENARIOS, SCENARIO_BY_ID, initialPci, moveWire, pciGeom, scenarioCase, type PciScenario } from "../../angioPci";
import { pciScenarioById, startPci } from "../actions/scenario";
import { setTarget } from "../geometry";
import { GUIDE_BY_ID } from "../equipment";
import { pciTipContext } from "../../../ui/lab/pciTips";
import { PCI_REGISTRY_PROBLEMS, PCI_SCENARIO_DEFS, collectPciScenarios, pciScenarioDef, scenarioEvents, startOf, targetIndex } from "./registry";
import { drawHidden, ladderVariantId, resolveScenario } from "./generate";
import { lesionsOf, toPciScenario } from "./legacy";
import { STANDARD_PCI_STARTS, scenarios as CORE } from "./packs/core";
import type { PciScenarioDef } from "./types";

/** The hard-coded PCI_SCENARIOS of src/simulation/pci/actions/scenario.ts before the registry (frozen copy). */
const PRE_REGISTRY: PciScenario[] = [
  {
    id: "lad-focal",
    title: "Focal mid-LAD stenosis",
    brief:
      "Synthetic case. 58-year-old man with exertional angina despite two anti-anginal drugs; non-invasive testing showed anterior ischaemia. Diagnostic angiography: a focal mid-LAD stenosis just after the first diagonal.",
    side: "left",
    guide: "EBU3.5",
    target: { vessel: "LAD", position: 0.38, severity: 85, lengthMm: 12, kind: "severe-stenosis" },
    calcium: 0,
    thrombus: false,
    views: ["raocranial", "laocranial", "apcranial"],
    points: [
      "Steer the wire past the diagonal and the septal perforators into the distal LAD.",
      "Size the stent to the distal reference and cover the lesion with a couple of millimetres of normal vessel at each end.",
      "Post-dilate with a non-compliant balloon inside the stent, not beyond its edges.",
    ],
    difficulty: 2,
  },
  {
    id: "rca-calcified",
    title: "Calcified mid-RCA stenosis",
    brief:
      "Synthetic case. 71-year-old woman with diabetes and chronic kidney disease, class III angina. A heavily calcified mid-RCA stenosis on angiography; contrast use matters.",
    side: "right",
    guide: "JR4",
    target: { vessel: "RCA", position: 0.45, severity: 80, lengthMm: 18, kind: "calcified" },
    calcium: 2,
    thrombus: false,
    views: ["rcalao", "rcarao", "apcranial"],
    points: [
      "Prepare calcium before stenting: a balloon that will not fully expand at high pressure predicts an under-expanded stent.",
      "Scoring balloons or intravascular lithotripsy modify calcium; high pressure alone risks dissection or rupture.",
      "Keep contrast to a minimum in kidney disease.",
    ],
    difficulty: 4,
  },
  {
    id: "lcx-stemi",
    title: "Inferolateral STEMI: occluded circumflex",
    brief:
      "Synthetic case. 54-year-old man, 3 hours of chest pain with inferolateral ST elevation. The obtuse marginal territory is supplied by a thrombotic, subtotally occluded proximal-to-mid circumflex.",
    side: "left",
    guide: "EBU3.5",
    target: { vessel: "LCx", position: 0.42, severity: 99, lengthMm: 16, kind: "thrombotic" },
    calcium: 0,
    thrombus: true,
    views: ["raocaudal", "spider", "ap"],
    points: [
      "The circumflex leaves the left main at an angle: point the tip towards it, away from the LAD.",
      "A heavy thrombus burden risks distal embolisation and slow flow after aggressive balloon dilatation.",
      "Restore flow first, then size the stent once vasodilators have opened the distal vessel.",
    ],
    difficulty: 3,
  },
  {
    id: "rca-cto",
    title: "Chronic total occlusion of the mid RCA",
    brief:
      "Synthetic case. 63-year-old man with class III angina on maximal therapy and inferior ischaemia with viable myocardium. The mid RCA has been occluded for more than three months; the distal RCA fills from the left. A second catheter sits in the left coronary for dual injection.",
    side: "right",
    guide: "JR4",
    target: { vessel: "RCA", position: 0.35, severity: 100, lengthMm: 18, kind: "cto" },
    calcium: 1,
    thrombus: false,
    views: ["rcalao", "rcarao", "lao30"],
    points: [
      "Inject both coronaries together: the right shows the proximal cap, the left fills the distal RCA through collaterals and shows the landing zone and the occlusion length.",
      "A workhorse wire buckles at the cap. Escalate to a stiff, tapered CTO wire, then exchange back to a workhorse wire once across.",
      "Confirm the wire is in the true lumen distally (contralateral injection) before any balloon.",
    ],
    difficulty: 5,
  },
];

const LEGACY_KEYS = ["id", "title", "brief", "side", "guide", "target", "calcium", "thrombus", "views", "points", "difficulty", "lipid"] as const;
const legacyPart = (s: PciScenario) => Object.fromEntries(LEGACY_KEYS.filter((k) => s[k] !== undefined).map((k) => [k, s[k]]));

function build(s: PciScenario) {
  const c = scenarioCase(s);
  const model = buildAnatomy(c);
  const tree = buildCoronaryTree(model, c);
  const refTree = buildCoronaryTree(model, { ...c, lesions: [] });
  return { c, tree, refTree, g: pciGeom(s, tree, refTree) };
}
const radii = (t: ReturnType<typeof buildCoronaryTree>) => t.vessels.map((v) => [v.name, v.radii.map((r) => Math.round(r * 1e6))]);

describe("PCI scenario registry", () => {
  it("collects the packs without problems, the core pack first", () => {
    expect(PCI_REGISTRY_PROBLEMS).toEqual([]);
    expect(PCI_SCENARIO_DEFS.slice(0, 4).map((d) => d.id)).toEqual(["lad-focal", "rca-calcified", "lcx-stemi", "rca-cto"]);
    expect(new Set(PCI_SCENARIO_DEFS.map((d) => d.id)).size).toBe(PCI_SCENARIO_DEFS.length);
    for (const d of PCI_SCENARIO_DEFS) expect(d.pack, d.id).toMatch(/\/packs\/[^/]+\.ts$/);
  });

  it("every registry entry builds a coronary tree and pciGeom finds every lesion with startMm < endMm", () => {
    for (const d of PCI_SCENARIO_DEFS) {
      const s = toPciScenario(d);
      const { c, tree, g } = build(s);
      expect(tree.vessels.length, d.id).toBeGreaterThan(0);
      expect(c.lesions.length, d.id).toBe(d.lesions.length);
      expect(g.lesions.length, d.id).toBe(d.lesions.length);
      expect(g.targetIdx).toBe(targetIndex(d));
      expect(g.lesion).toBe(g.lesions[g.targetIdx]);
      g.lesions.forEach((l, i) => {
        expect(l.startMm, `${d.id} lesion ${i}`).toBeLessThan(l.endMm);
        expect(l.refDiameter, `${d.id} lesion ${i}`).toBeGreaterThan(0);
        expect(g.byName.has(l.vessel), `${d.id} lesion ${i}`).toBe(true);
      });
    }
  });

  it("toPciScenario(core four) reproduces the earlier scenarios and their initPci state (severity, resistance, guide id)", () => {
    for (const old of PRE_REGISTRY) {
      const def = pciScenarioDef(old.id)!;
      expect(def, old.id).toBeTruthy();
      const s = toPciScenario(def);
      expect(legacyPart(s)).toEqual(legacyPart(old));
      for (const opts of [{}, { guideEngaged: false }, { guideEngaged: true, seed: "x" }]) {
        const a = initialPci(old, opts);
        const b = initialPci(s, opts);
        expect(b).toEqual(a);
        expect([b.severity, b.resistance, b.guide.id]).toEqual([old.target.severity, a.resistance, old.guide]);
      }
      // the lab's exported list is the registry's view of the same scenarios
      expect(legacyPart(SCENARIO_BY_ID[old.id])).toEqual(legacyPart(old));
    }
    expect(PCI_SCENARIOS[0].id).toBe("lad-focal");
  });

  it("the core four build the same anatomy, tree and lesion geometry as before", () => {
    for (const old of PRE_REGISTRY) {
      const a = build(old);
      const b = build(SCENARIO_BY_ID[old.id]);
      const { lesions: la, scenarioId, events, ...restB } = b.c;
      const { lesions: lo, ...restA } = a.c;
      expect(restB).toEqual(restA);
      expect(scenarioId).toBe(old.id);
      expect(la.map((l) => [l.vessel, l.position, l.severity, l.kind, l.lengthMm])).toEqual(lo.map((l) => [l.vessel, l.position, l.severity, l.kind, l.lengthMm]));
      expect(events).toEqual(old.id === "lcx-stemi" ? ["stemi"] : undefined);
      expect(radii(b.tree)).toEqual(radii(a.tree));
      expect(b.g.lesion).toEqual(a.g.lesion);
    }
  });

  it("the ladder bases come from the registry and the ladder variants are unchanged", () => {
    const OLD_BASES = [
      { id: "lad-focal", epa: "pci-simple", difficulty: 2, severity: 85, lengthMm: 12, position: 0.38, calcium: 0 },
      { id: "lcx-stemi", epa: "pci-stemi", difficulty: 3, severity: 99, lengthMm: 16, position: 0.42, calcium: 0 },
      { id: "rca-calcified", epa: "pci-calcium", difficulty: 4, severity: 80, lengthMm: 18, position: 0.45, calcium: 2 },
      { id: "rca-cto", epa: "pci-cto", difficulty: 5, severity: 100, lengthMm: 18, position: 0.35, calcium: 1 },
    ];
    const strip = (b: (typeof PCI_BASES)[number]) => ({ id: b.id, epa: b.epa, difficulty: b.difficulty, severity: b.severity, lengthMm: b.lengthMm, position: b.position, calcium: b.calcium });
    const byId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : 1);
    expect(PCI_BASES.map(strip).sort(byId)).toEqual([...OLD_BASES].sort(byId));
    // the variant draw of catalogue.ts before the registry, for every practice and exam index
    const { rungs: R, practicePerRung: P, examPerRung: E } = LADDER_PARAMS;
    for (const b of OLD_BASES) {
      for (const [prefix, n] of [["L", (R - 1) * P], ["X", (R - 1) * E * 2]] as const)
        for (let i = 0; i < n; i++) {
          const h = (salt: string) => (fnv(`${prefix}:${b.id}:${i}:${salt}`) % 10000) / 10000;
          const lengthMm = Math.round(Math.max(8, Math.min(38, b.lengthMm * (0.7 + h("len") * 1.3))));
          const position = Math.round(Math.max(0.15, Math.min(0.75, b.position + (h("pos") - 0.5) * 0.4)) * 100) / 100;
          const severity = b.severity >= 99 ? b.severity : Math.round(Math.max(70, Math.min(95, b.severity + (h("sev") - 0.5) * 20)));
          const calcium = b.id === "lad-focal" ? (h("ca") < 0.6 ? 0 : 1) : b.calcium;
          const v = pciVariantById(`pci-${b.id}~${prefix}${i}`);
          if (prefix === "L") expect(v, `${b.id} ${prefix}${i}`).toBeTruthy();
          if (v) expect([v.severity, v.lengthMm, v.position, v.calcium]).toEqual([severity, lengthMm, position, calcium]);
        }
      expect(ladderFor(b.epa as never).pci!.rungs[0][0].id).toBe(`pci-${b.id}`);
    }
  });

  it("resolveScenario('rca-calcified','pci-rca-calcified~L3') is deterministic and equals the catalogue's pciVariantById", () => {
    const v = pciVariantById("pci-rca-calcified~L3")!;
    expect(v).toBeTruthy();
    const a = resolveScenario("rca-calcified", "pci-rca-calcified~L3");
    const b = resolveScenario("rca-calcified", "pci-rca-calcified~L3");
    expect(a).toEqual(b);
    expect(a.variant).toEqual(v);
    expect([a.scenario.target.severity, a.scenario.target.lengthMm, a.scenario.target.position, a.scenario.calcium]).toEqual([v.severity, v.lengthMm, v.position, v.calcium]);
    expect(legacyPart(a.scenario)).toEqual(legacyPart(applyPciVariant(SCENARIO_BY_ID["rca-calcified"], v)));
    expect(a.scenario.id).toBe("rca-calcified~L3");
    expect(a.scenario.defId).toBe("rca-calcified");
    // the stored lesions follow the variant, so the anatomy case draws the variant lesion
    expect(lesionsOf(a.scenario)[0]).toMatchObject({ severity: v.severity, lengthMm: v.lengthMm, position: v.position, calcium: v.calcium });
    // shorthand forms name the same variant; a variant of another scenario is refused
    expect(resolveScenario("rca-calcified", "L3")).toEqual(a);
    expect(resolveScenario("rca-calcified", "~L3")).toEqual(a);
    expect(ladderVariantId("rca-calcified", "pci-lad-focal~L3")).toBeNull();
    expect(() => resolveScenario("rca-calcified", "pci-lad-focal~L3")).toThrow(/another scenario/);
    expect(() => resolveScenario("rca-calcified", "L999")).toThrow(/no ladder variant/);
    expect(() => resolveScenario("no-such-case")).toThrow(/unknown PCI scenario/);
  });

  it("a seed variant keeps the definition, carries the seed and draws hidden mechanisms deterministically", () => {
    const r = resolveScenario("lad-focal", "practice-7");
    expect(r.variant).toBeNull();
    expect(r.seed).toBe("practice-7");
    expect(legacyPart(r.scenario)).toEqual(legacyPart(SCENARIO_BY_ID["lad-focal"]));
    expect(resolveScenario("lad-focal").seed).toBeUndefined();
    const axes = [{ id: "prone-to", label: "What the lesion is prone to", options: [{ value: "dissection", weight: 1 }, { value: "no-reflow", weight: 3 }] }];
    expect(drawHidden(axes, "s1")).toEqual(drawHidden(axes, "s1"));
    const counts = { dissection: 0, "no-reflow": 0 } as Record<string, number>;
    for (let i = 0; i < 400; i++) counts[drawHidden(axes, `s${i}`)["prone-to"]]++;
    expect(counts["no-reflow"]).toBeGreaterThan(counts.dissection);
    expect(counts.dissection).toBeGreaterThan(40);
  });

  it("scenario events come from the lesion sites, calcium grade 2 and the case-wide events", () => {
    expect(scenarioEvents(pciScenarioDef("rca-cto")!)).toEqual(["cto"]);
    expect(scenarioEvents(pciScenarioDef("rca-calcified")!)).toEqual(["calcified-lesion"]);
    expect(scenarioEvents(pciScenarioDef("lcx-stemi")!)).toEqual(["stemi"]);
    expect(scenarioEvents(pciScenarioDef("lad-focal")!)).toEqual([]);
    expect(resolveScenario("rca-cto").events).toEqual(["cto"]);
  });
});

describe("multi-lesion scenarios", () => {
  const TWO: PciScenarioDef = {
    ...CORE[0],
    id: "fixture-two-lesions",
    lesions: [
      { vessel: "RCA", position: 0.5, severity: 60, lengthMm: 10, kind: "moderate-stenosis", role: "bystander" },
      { vessel: "LAD", position: 0.38, severity: 85, lengthMm: 12, kind: "severe-stenosis", role: "target", sites: ["bifurcation"] },
    ],
  };

  it("the anatomy case has every lesion and the geometry indexes each, with the target active", () => {
    const s = toPciScenario(TWO);
    expect(s.target.vessel).toBe("LAD");
    expect(s.targetIdx).toBe(1);
    const { c, g } = build(s);
    expect(c.lesions.map((l) => l.vessel)).toEqual(["RCA", "LAD"]);
    expect(g.lesions.map((l) => l.vessel)).toEqual(["RCA", "LAD"]);
    expect(g.lesion.vessel).toBe("LAD");
    const g0 = setTarget(g, 0);
    expect(g0.lesion.vessel).toBe("RCA");
    expect(g0.targetIdx).toBe(0);
    expect(g.lesion.vessel).toBe("LAD");
    expect(g0.tree).toBe(g.tree);
    expect(setTarget(g, 1)).toBe(g);
    expect(() => setTarget(g, 2)).toThrow(/no lesion 2/);
    expect(scenarioEvents(TWO)).toEqual(["bifurcation"]);
  });

  it("an override of target moves the active lesion (tests and ladder variants keep working)", () => {
    const s = { ...toPciScenario(TWO), target: { vessel: "LAD" as const, position: 0.5, severity: 70, lengthMm: 20, kind: "severe-stenosis" as const } };
    const ls = lesionsOf(s);
    expect(ls[1]).toMatchObject({ vessel: "LAD", position: 0.5, severity: 70, lengthMm: 20, sites: ["bifurcation"] });
    expect(ls[0]).toMatchObject({ vessel: "RCA", severity: 60 });
    const { g } = build(s);
    expect(g.lesion.endMm - g.lesion.startMm).toBeCloseTo(20, 6);
  });

  it("collectPciScenarios reports a missing launch entry, mismatched starts and a duplicate id", () => {
    const pack = { scenarios: [TWO, { ...TWO }, { ...TWO, id: "fixture-b", starts: [STANDARD_PCI_STARTS[0]] }] };
    const launches = { "./packs/fixture.launch.ts": { launch: { sim: "angio-pci" as const, scenarios: [{ id: "fixture-b", title: TWO.title, lessonIds: [], starts: ["guide-in-root", "wire-across"] }] } } };
    const r = collectPciScenarios({ "./packs/fixture.ts": pack }, launches);
    expect(r.problems.some((p) => /duplicate scenario id/.test(p))).toBe(true);
    expect(r.problems.some((p) => /fixture-two-lesions: not declared/.test(p))).toBe(true);
    expect(r.problems.some((p) => /fixture-b: starts \[guide-in-root\] differ/.test(p))).toBe(true);
    const none = collectPciScenarios({ "./packs/lonely.ts": { scenarios: [TWO] } }, {});
    expect(none.problems.some((p) => /no sibling lonely\.launch\.ts/.test(p))).toBe(true);
  });

  it("collectPciScenarios reports a second ladder base for an EPA and a default start that contradicts guideInRoot", () => {
    const b2: PciScenarioDef = { ...TWO, id: "fixture-base-2" };
    const engaged: PciScenarioDef = { ...TWO, id: "fixture-engaged", ladderBase: false, setup: { ...TWO.setup, guideInRoot: true }, start: "guide-engaged" };
    const entry = (d: PciScenarioDef) => ({ id: d.id, title: d.title, lessonIds: [], starts: d.starts.map((x) => x.id) });
    const r = collectPciScenarios({ "./packs/fixture.ts": { scenarios: [TWO, b2, engaged] } }, { "./packs/fixture.launch.ts": { launch: { sim: "angio-pci" as const, scenarios: [TWO, b2, engaged].map(entry) } } });
    expect(r.problems.filter((p) => /second ladderBase/.test(p))).toEqual(["./packs/fixture.ts fixture-base-2: second ladderBase for EPA pci-simple (first fixture-two-lesions)"]);
    expect(r.problems.filter((p) => /guideInRoot/.test(p))).toEqual(['./packs/fixture.ts fixture-engaged: setup.guideInRoot is true but the default start "guide-engaged" has guideEngaged true']);
    expect(r.problems.length).toBe(2);
  });

  it("a definition's acceptable guides reach the anatomy case (the core four keep only their own guide)", () => {
    const c = scenarioCase(toPciScenario({ ...TWO, setup: { ...TWO.setup, guidesAcceptable: ["EBU4.0", TWO.setup.guideDefault] } }));
    expect(c.acceptableCatheters).toEqual([TWO.setup.guideDefault, "EBU4.0"]);
    for (const d of CORE) expect(scenarioCase(toPciScenario(d)).acceptableCatheters).toEqual([d.setup.guideDefault]);
  });
});

describe("start states", () => {
  it("every core scenario opens at each standard start where the start says", () => {
    for (const def of CORE) {
      expect(def.starts.map((s) => s.id)).toEqual(STANDARD_PCI_STARTS.map((s) => s.id));
      expect(startOf(def)!.id).toBe("guide-in-root");
      const scenario = toPciScenario(def);
      const { g } = build(scenario);
      const req = { def, scenario };

      const root = startPci(req, g, "guide-in-root");
      expect(root.guide.engaged, def.id).toBe(false);
      expect(pciTipContext(root, g.lesion).phase).toBe("guide");

      const eng = startPci(req, g, "guide-engaged");
      expect(eng.guide.engaged).toBe(true);
      expect(eng.tipMm).toBeLessThan(0);
      expect(pciTipContext(eng, g.lesion).phase).toBe("wire");

      const across = startPci(req, g, "wire-across");
      expect(across.route).toContain(g.lesion.vessel);
      expect(across.tipMm, def.id).toBeGreaterThan(g.lesion.endMm);
      expect(across.wire.crossed).toBe(true);
      expect(across.wire.distal.inDanger).toBe(false);
      expect(pciTipContext(across, g.lesion).phase, def.id).toBe("lesion-prep");
      expect(across.log.some((l) => l.kind === "scenario-start" && l.data.start === "wire-across")).toBe(true);
      // the wire engine carries on from the parked position
      const moved = moveWire(scenario, g, across, -2);
      expect(moved.tipMm).toBeLessThan(across.tipMm);
      expect(moved.tipMm).toBeGreaterThan(g.lesion.endMm);

      // the default start is the guide in the root, and an undeclared start is refused
      expect(startPci(req, g).guide.engaged).toBe(false);
      expect(() => startPci(req, g, "no-such-start")).toThrow(/no start/);
    }
  });

  it("every registered scenario opens at each of its starts in the declared phase, guide position and wire", () => {
    for (const def of PCI_SCENARIO_DEFS) {
      expect(GUIDE_BY_ID[def.setup.guideDefault], `${def.id} guide ${def.setup.guideDefault}`).toBeDefined();
      for (const gd of def.setup.guidesAcceptable ?? []) expect(GUIDE_BY_ID[gd], `${def.id} guide ${gd}`).toBeDefined();
      const scenario = toPciScenario(def);
      const { g } = build(scenario);
      const req = { def, scenario };
      for (const start of def.starts) {
        const where = `${def.id} ${start.id}`;
        const st = startPci(req, g, start.id);
        expect(pciTipContext(st, g.lesion).phase, where).toBe(start.phase);
        expect(st.guide.engaged, where).toBe(start.guideEngaged);
        if ((start.wire ?? "in-guide") === "across") {
          expect(st.tipMm, where).toBeGreaterThan(g.lesion.endMm);
          expect(st.wire.distal.inDanger, where).toBe(false);
        } else {
          expect(st.tipMm, where).toBeLessThan(0);
        }
      }
      expect(startPci(req, g).log.some((l) => l.kind === "scenario-start" && l.data.start === startOf(def)!.id), def.id).toBe(true);
    }
  });

  it("a launch seed reaches the engine's random draws", () => {
    const def = CORE[0];
    const scenario = toPciScenario(def);
    const { g } = build(scenario);
    const a = startPci({ def, scenario, seed: "s-1" }, g, "guide-engaged");
    const b = startPci({ def, scenario, seed: "s-2" }, g, "guide-engaged");
    const c = startPci({ def, scenario }, g, "guide-engaged");
    expect(a.rng).not.toEqual(b.rng);
    expect(c.rng).toEqual(initialPci(scenario, { guideEngaged: true }).rng);
  });
});

describe("pciScenarioById", () => {
  it("gives registered scenarios and every ladder variant by the id the lab holds, and undefined otherwise", () => {
    for (const s of PCI_SCENARIOS) {
      expect(pciScenarioById(s.id)).toBe(SCENARIO_BY_ID[s.id]);
      expect(pciScenarioById(`pci-${s.id}`)).toBe(SCENARIO_BY_ID[s.id]);
    }
    let n = 0;
    for (const b of PCI_BASES) {
      const l = ladderFor(b.epa);
      for (const v of [...(l.pci?.rungs.flat() ?? []), ...(l.pci?.exam ?? [])]) {
        if (v.base !== b.id) continue;
        const want = resolveScenario(b.id, v.id).scenario;
        const labId = v.id.replace(/^pci-/, "");
        expect(pciScenarioById(v.id), v.id).toEqual(want);
        const got = pciScenarioById(labId)!;
        expect(got, labId).toEqual(want);
        if (labId.includes("~")) expect(got.id).toBe(labId);
        n++;
      }
    }
    expect(n).toBeGreaterThan(PCI_BASES.length);
    expect(pciScenarioById("no-such-case")).toBeUndefined();
    expect(pciScenarioById("rca-calcified~L99")).toBeUndefined();
    expect(pciScenarioById("lad-focal~L2~L3")).toBeUndefined();
    expect(pciScenarioById("")).toBeUndefined();
  });
});
