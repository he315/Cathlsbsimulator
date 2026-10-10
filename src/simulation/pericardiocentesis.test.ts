import { describe, it, expect } from "vitest";
import {
  PERIC_SCENARIOS,
  getPericScenario,
  pericardialPressure,
  haemodynamics,
  measuredPulsus,
  beatSystolic,
  inspiration,
  pocketDepths,
  effusionSize,
  bestWindow,
  needlePath,
  structureAt,
  trajectoryRisk,
  aspirate,
  salineCheck,
  wireCheck,
  needlePressure,
  accumulate,
  drain,
  scorePericardiocentesis,
  REGIONAL_PPC_CAP,
  REGIONAL_RA_RISE,
  type Trajectory,
  type PericRunLog,
} from "./pericardiocentesis";

const pci = getPericScenario("pci-perforation");
const malignant = getPericScenario("malignant");
const posterior = getPericScenario("post-surgical-posterior");
const dissection = getPericScenario("aortic-dissection");

const ideal = (window: Trajectory["window"]): Trajectory => ({
  window,
  angle: window === "subxiphoid" ? 30 : window === "apical" ? 60 : 85,
  aim: 0,
  lateral: 0,
  ribEdge: "above-rib",
});

describe("pericardial pressure", () => {
  it("rises monotonically with volume (acute and chronic)", () => {
    for (const c of [0, 0.5, 1]) {
      let prev = -1;
      for (let v = 0; v <= 2500; v += 25) {
        const p = pericardialPressure(v, c);
        expect(p).toBeGreaterThanOrEqual(prev);
        prev = p;
      }
    }
  });

  it("an acute bleed reaches tamponade pressures at a much smaller volume than a chronic effusion", () => {
    expect(pericardialPressure(180, 0)).toBeGreaterThan(15);
    expect(pericardialPressure(180, 1)).toBeLessThan(1);
    expect(pericardialPressure(1000, 1)).toBeLessThan(pericardialPressure(1700, 1));
    expect(pericardialPressure(1700, 1)).toBeGreaterThan(15);
  });

  it("is near zero for a normal amount of pericardial fluid", () => {
    expect(pericardialPressure(30, 0)).toBeLessThan(1);
  });
});

describe("haemodynamics", () => {
  it("severity, heart rate and RA pressure rise, and systolic pressure falls, as an acute effusion grows", () => {
    let prev = haemodynamics(20, pci);
    for (let v = 40; v <= 250; v += 10) {
      const h = haemodynamics(v, pci);
      expect(h.ppc).toBeGreaterThanOrEqual(prev.ppc);
      expect(h.hr).toBeGreaterThanOrEqual(prev.hr);
      expect(h.ra).toBeGreaterThanOrEqual(prev.ra);
      expect(h.sbp).toBeLessThanOrEqual(prev.sbp);
      expect(h.pulsus).toBeGreaterThanOrEqual(prev.pulsus);
      prev = h;
    }
  });

  it("pulsus paradoxus is normal (<= 10 mmHg) without tamponade and exceeds 10 mmHg in tamponade", () => {
    const small = haemodynamics(40, pci);
    const tamp = haemodynamics(pci.initialVolume, pci);
    expect(small.pulsus).toBeLessThanOrEqual(10);
    expect(tamp.pulsus).toBeGreaterThan(10);
    expect(measuredPulsus(tamp)).toBe(tamp.pulsus);
    expect(beatSystolic(tamp, 1)).toBeLessThan(beatSystolic(tamp, 0));
  });

  it("diastolic pressures equalise and the classic echo signs appear in tamponade", () => {
    const h = haemodynamics(pci.initialVolume, pci);
    expect(h.tamponade).toBe(true);
    expect(h.equalised).toBe(true);
    expect(h.raCollapse).toBe(true);
    expect(h.rvCollapse).toBe(true);
    expect(h.plethoricIvc).toBe(true);
    expect(h.mitralVar).toBeGreaterThan(25);
    expect(h.sbp - h.dbp).toBeLessThan(pci.baseline.sbp - pci.baseline.dbp);
  });

  it("a regional (loculated posterior) collection compromises the patient without classic right-heart collapse", () => {
    const h = haemodynamics(posterior.initialVolume, posterior);
    expect(h.tamponade).toBe(true);
    expect(h.raCollapse).toBe(false);
    expect(h.rvCollapse).toBe(false);
    expect(h.leftHeartCompression).toBe(true);
  });

  it("drainage restores the haemodynamics", () => {
    const before = haemodynamics(pci.initialVolume, pci);
    const after = haemodynamics(drain(pci.initialVolume, 100).volume, pci);
    expect(after.ppc).toBeLessThan(before.ppc);
    expect(after.sbp).toBeGreaterThan(before.sbp);
    expect(after.pulsus).toBeLessThanOrEqual(10);
  });

  it("a large chronic effusion shows electrical alternans; respiration cycles 0..1", () => {
    expect(haemodynamics(malignant.initialVolume, malignant).alternans).toBe(true);
    expect(haemodynamics(pci.initialVolume, pci).alternans).toBe(false);
    for (let t = 0; t < 6; t += 0.1) {
      const i = inspiration(t);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThanOrEqual(1);
    }
  });
});

describe("echo", () => {
  it("grades effusion size by diastolic echo-free space", () => {
    expect(effusionSize(5)).toBe("small");
    expect(effusionSize(15)).toBe("moderate");
    expect(effusionSize(25)).toBe("large");
  });

  it("picks the largest accessible pocket", () => {
    expect(bestWindow(pci.initialVolume, pci).window).toBe("subxiphoid");
    expect(bestWindow(malignant.initialVolume, malignant).window).toBe("apical");
    const p = pocketDepths(posterior.initialVolume, posterior);
    expect(p.posterior).toBeGreaterThan(20);
    expect(Math.max(p.subxiphoid, p.apical, p.parasternal)).toBeLessThan(5);
  });
});

describe("needle trajectory", () => {
  it("the standard subxiphoid path (about 30 degrees, toward the left shoulder) is safe and reaches fluid before the RV", () => {
    const path = needlePath(ideal("subxiphoid"), pocketDepths(pci.initialVolume, pci));
    expect(trajectoryRisk(path)).toBe("safe");
    expect(path.pericardiumAt).not.toBeNull();
    const at = path.pericardiumAt!;
    expect(structureAt(path, at + 2)).toBe("effusion");
    expect(structureAt(path, at + path.effusionMm + 10)).toBe("rv");
  });

  it("a steep subxiphoid path crosses the liver", () => {
    const path = needlePath({ ...ideal("subxiphoid"), angle: 60 }, pocketDepths(pci.initialVolume, pci));
    expect(trajectoryRisk(path)).toBe("danger");
    expect(path.segments.some((s) => s.structure === "liver")).toBe(true);
    expect(structureAt(path, 30)).toBe("liver");
  });

  it("aiming toward the right shoulder crosses the liver and heads for the right atrium", () => {
    const path = needlePath({ ...ideal("subxiphoid"), aim: -35 }, pocketDepths(pci.initialVolume, pci));
    expect(path.segments.some((s) => s.structure === "liver")).toBe(true);
    expect(path.chamber).toBe("ra");
  });

  it("a very flat subxiphoid path never reaches the pericardium", () => {
    const path = needlePath({ ...ideal("subxiphoid"), angle: 8 }, pocketDepths(pci.initialVolume, pci));
    expect(path.pericardiumAt).toBeNull();
    expect(structureAt(path, 150)).toBe("tissue");
  });

  it("parasternal: too medial risks the internal mammary artery, too lateral the lung, under the rib the intercostal bundle", () => {
    const pk = pocketDepths(malignant.initialVolume, malignant);
    const medial = needlePath({ ...ideal("parasternal"), lateral: -0.6 }, pk);
    expect(medial.segments.some((s) => s.structure === "mammary")).toBe(true);
    const lateral = needlePath({ ...ideal("parasternal"), lateral: 0.8 }, pk);
    expect(lateral.segments.some((s) => s.structure === "lung")).toBe(true);
    const underRib = needlePath({ ...ideal("parasternal"), ribEdge: "below-rib" }, pk);
    expect(underRib.segments.some((s) => s.structure === "intercostal")).toBe(true);
    const good = needlePath(ideal("parasternal"), pk);
    expect(trajectoryRisk(good)).toBe("safe");
  });

  it("apical: too lateral crosses the lung; the chamber beyond is the LV", () => {
    const pk = pocketDepths(malignant.initialVolume, malignant);
    const path = needlePath({ ...ideal("apical"), lateral: 0.7 }, pk);
    expect(path.segments.some((s) => s.structure === "lung")).toBe(true);
    expect(needlePath(ideal("apical"), pk).chamber).toBe("lv");
  });

  it("a thin pocket along the path is flagged as coronary / myocardial risk", () => {
    const pk = pocketDepths(posterior.initialVolume, posterior);
    const path = needlePath(ideal("subxiphoid"), pk);
    expect(path.coronaryRisk).toBe(true);
    expect(trajectoryRisk(path)).toBe("danger");
  });

  it("a badly angled needle crosses less fluid than a well-aimed one", () => {
    const pk = pocketDepths(pci.initialVolume, pci);
    const good = needlePath(ideal("subxiphoid"), pk);
    const off = needlePath({ ...ideal("subxiphoid"), angle: 45, aim: 30 }, pk);
    expect(off.effusionMm).toBeLessThan(good.effusionMm);
  });
});

describe("confirmation", () => {
  it("RV puncture: blood that clots (when not heparinised), bubbles in the RV, wire to the PA, ventricular pressure", () => {
    expect(aspirate("rv", malignant).clots).toBe("yes");
    expect(aspirate("rv", pci).clots).toBe("unreliable");
    expect(salineCheck("rv")).toBe("rv");
    expect(wireCheck("rv")).toBe("rvot-pa");
    const h = haemodynamics(malignant.initialVolume, malignant);
    let max = 0;
    for (let ph = 0; ph < 1; ph += 0.02) max = Math.max(max, needlePressure("rv", h, ph, 0));
    expect(max).toBeGreaterThan(25);
  });

  it("pericardial position: bubbles in the pericardial space, wire wraps the heart, low pressure equal to the pericardial pressure", () => {
    expect(salineCheck("effusion")).toBe("pericardial");
    expect(wireCheck("effusion")).toBe("wraps");
    const h = haemodynamics(pci.initialVolume, pci);
    for (let ph = 0; ph < 1; ph += 0.05) expect(Math.abs(needlePressure("effusion", h, ph, 0) - h.ppc)).toBeLessThan(2);
    expect(aspirate("effusion", malignant).clots).toBe("no");
  });

  it("lung gives air; tissue gives nothing", () => {
    expect(aspirate("lung", pci).air).toBe(true);
    expect(salineCheck("tissue")).toBe("none");
    expect(wireCheck("liver")).toBe("extracardiac");
  });
});

describe("dynamics", () => {
  it("an unsealed perforation re-accumulates; sealing stops it", () => {
    const v1 = accumulate(50, 60, pci.bleedRate, false);
    expect(v1).toBeCloseTo(50 + pci.bleedRate, 5);
    expect(accumulate(50, 60, pci.bleedRate, true)).toBe(50);
  });

  it("drainage never removes more than is there", () => {
    const d = drain(30, 100);
    expect(d.volume).toBeGreaterThanOrEqual(0);
    expect(d.removed).toBeLessThanOrEqual(30);
  });
});

describe("scoring", () => {
  const base = (id: PericRunLog["scenarioId"]): PericRunLog => ({
    scenarioId: id,
    management: "pericardiocentesis",
    rationaleCorrect: null,
    supportiveCorrect: 0,
    supportiveWrong: 0,
    window: "subxiphoid",
    plannedRisk: "safe",
    structuresEntered: ["tissue", "effusion"],
    aspiratedWhileAdvancing: true,
    salineResult: "pericardial",
    pressureChecked: true,
    wireResult: "wraps",
    dilatedWithoutWireCheck: false,
    dilatedIntoChamber: false,
    drainPlaced: true,
    drainedMl: 150,
    finalPpc: 1,
    finalSeverity: 0,
    bleedSealRequested: true,
    stagedDrainage: true,
    fluidSent: true,
  });

  it("a textbook drainage scores highly; dilating into the RV is heavily penalised", () => {
    expect(scorePericardiocentesis(base("pci-perforation")).score).toBeGreaterThanOrEqual(95);
    const bad = scorePericardiocentesis({
      ...base("pci-perforation"),
      plannedRisk: "danger",
      structuresEntered: ["tissue", "liver", "rv"],
      salineResult: "rv",
      wireResult: "rvot-pa",
      dilatedIntoChamber: true,
      bleedSealRequested: false,
      drainPlaced: false,
      finalPpc: 14,
      finalSeverity: 0.7,
    });
    expect(bad.score).toBeLessThan(35);
  });

  it("surgical scenarios reward the decision not to needle", () => {
    for (const sc of [posterior, dissection]) {
      const good = scorePericardiocentesis({
        ...base(sc.id),
        management: sc.correct,
        rationaleCorrect: true,
        supportiveCorrect: 3,
        supportiveWrong: 0,
        window: null,
        structuresEntered: [],
      });
      expect(good.score).toBe(100);
      const wrong = scorePericardiocentesis({ ...base(sc.id), management: "pericardiocentesis", rationaleCorrect: false, structuresEntered: ["tissue", "epicardium", "rv"] });
      expect(wrong.score).toBeLessThan(25);
    }
  });

  it("every scenario has a defined correct management", () => {
    for (const sc of PERIC_SCENARIOS) expect(sc.correct).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// pericardiocentesis-tips-and-pci-handover: the PCI patient on its engine, the
// leak coupled to the pericardial pressure, and the perforation scenarios.
// ---------------------------------------------------------------------------

import { PatientEngine } from "./patient/engine";
import { generatePatient, type PatientProfile } from "./patient/patient";
import { ANGIOCAD_SEGMENTS } from "./patient/angiocadPriors";
import { engineFromHandover, patientHandoverFrom } from "./session/handover";
import {
  EnginePericardium,
  HANDOVER_LEAK,
  MANAGEMENT_LABEL,
  accumulateCoupled,
  echoAvailable,
  isCorrectManagement,
  leakFromTransfer,
  leakRate,
  provokesEctopy,
  signsFor,
  standInPerforatedEngine,
  type PericTransfer,
} from "./pericardiocentesis";

/** A patient with no coronary disease, in sinus rhythm (as in handover.test.ts). */
function healthy(seed: number): PatientProfile {
  const p = generatePatient(seed, { indication: "SA" });
  const grades = { ...p.angiocad.grades };
  for (const s of ANGIOCAD_SEGMENTS) grades[s] = 0;
  return { ...p, angiocad: { ...p.angiocad, grades }, culprit: null, baseline: { ...p.baseline, rhythm: "sinus" } };
}

/** The PCI lab's patient after a perforation has bled into the pericardium, and its hand-over. */
function perforatedTransfer(seed = 41, leakMlPerS = 0.6): PericTransfer & { patient: NonNullable<PericTransfer["patient"]> } {
  const e = new PatientEngine({ profile: healthy(seed), lesions: [] });
  e.setTip({ location: "aorta" });
  e.transducer.zero();
  e.advance(6);
  e.setPericardialInflow(2);
  e.advance(55);
  e.setPericardialInflow(leakMlPerS);
  const h = patientHandoverFrom(e);
  return { patient: { snapshot: h.snapshot, profile: h.profile }, payload: { leakMlPerS }, events: ["perforation", "tamponade"] };
}

const fromPci = getPericScenario("from-pci-perforation");
const unstable = getPericScenario("perforation-unstable");
const small = getPericScenario("perforation-stable-small");
const loculated = getPericScenario("post-cabg-loculated");

describe("perforation scenarios", () => {
  it("are declared with unique ids, perforation events and a labelled management", () => {
    const ids = PERIC_SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const sc of [fromPci, unstable, small, loculated]) {
      expect(sc.events).toContain("perforation");
      expect(MANAGEMENT_LABEL[sc.correct]).toBeTruthy();
    }
    expect(loculated.events).toContain("prior-cabg");
    expect(fromPci.engine).toBe(true);
    expect(fromPci.contrastSac && unstable.contrastSac).toBe(true);
  });

  it("the unstable perforation has no echo for its first minute and a half; fluoroscopy shows the sac", () => {
    expect(echoAvailable(unstable, 0)).toBe(false);
    expect(echoAvailable(unstable, unstable.echoAfterS! - 1)).toBe(false);
    expect(echoAvailable(unstable, unstable.echoAfterS!)).toBe(true);
    expect(echoAvailable(pci, 0)).toBe(true);
    expect(haemodynamics(unstable.initialVolume, unstable).tamponade).toBe(true);
  });

  it("draining 20-50 mL improves the haemodynamics of an acute haemopericardium", () => {
    for (const sc of [unstable, pci]) {
      const before = haemodynamics(sc.initialVolume, sc);
      for (const ml of [20, 40, 50]) {
        const after = haemodynamics(drain(sc.initialVolume, ml).volume, sc);
        expect(after.map, `${sc.id} ${ml} mL`).toBeGreaterThan(before.map);
        expect(after.ppc).toBeLessThan(before.ppc);
      }
    }
  });
});

describe("the leak and the pericardial pressure (model parameter)", () => {
  it("the leak falls as the pericardial pressure rises, and stops at leakStopMmHg", () => {
    expect(leakRate(small, 0)).toBe(small.bleedRate);
    expect(leakRate(small, small.leakStopMmHg! / 2)).toBeCloseTo(small.bleedRate / 2, 6);
    expect(leakRate(small, small.leakStopMmHg!)).toBe(0);
    // without a coupling the original scenarios keep their constant leak
    expect(leakRate(pci, 30)).toBe(pci.bleedRate);
    expect(accumulateCoupled(50, 60, pci, false)).toBeCloseTo(accumulate(50, 60, pci.bleedRate, false), 6);
    expect(accumulateCoupled(50, 60, small, true)).toBe(50);
  });

  it("a small effusion in a stable patient settles when observed: no tamponade after 30 minutes", () => {
    const start = haemodynamics(small.initialVolume, small);
    expect(start.tamponade).toBe(false);
    expect(effusionSize(pocketDepths(small.initialVolume, small).subxiphoid)).toBe("small");
    let v = small.initialVolume;
    for (let i = 0; i < 30; i++) v = accumulateCoupled(v, 60, small, false);
    const h = haemodynamics(v, small);
    expect(h.tamponade).toBe(false);
    expect(h.ppc).toBeLessThanOrEqual(small.leakStopMmHg! + 0.1);
    expect(h.sbp).toBeGreaterThanOrEqual(start.sbp - 3);
    // the same leak without the pericardial pressure behind it would have gone on to tamponade
    expect(haemodynamics(accumulate(small.initialVolume, 30 * 60, small.bleedRate, false), small).tamponade).toBe(true);
  });

  it("the unstable perforation keeps bleeding into tamponade until it is sealed", () => {
    let v = unstable.initialVolume;
    for (let i = 0; i < 4; i++) v = accumulateCoupled(v, 60, unstable, false);
    expect(v).toBeGreaterThan(unstable.initialVolume + 20);
    expect(haemodynamics(v, unstable).severity).toBeGreaterThan(haemodynamics(unstable.initialVolume, unstable).severity);
    expect(accumulateCoupled(v, 60, unstable, true)).toBe(v);
  });
});

describe("the PCI patient on its engine (hand-over)", () => {
  it("with a hand-over snapshot and an open leak pericardialMl rises every second; draining 40 mL raises MAP", () => {
    const t = perforatedTransfer();
    const leak = leakFromTransfer(t);
    expect(leak).toMatchObject({ mlPerS: 0.6, sealed: false });
    const p = new EnginePericardium(engineFromHandover(t.patient as Parameters<typeof engineFromHandover>[0]), leak);
    let prev = p.volume;
    expect(prev).toBeGreaterThan(100);
    const map0 = p.haemo(fromPci).map;
    for (let s = 0; s < 10; s++) {
      p.step(1);
      expect(p.volume, `second ${s + 1}`).toBeGreaterThan(prev);
      prev = p.volume;
    }
    const mapBefore = p.haemo(fromPci).map;
    expect(mapBefore).toBeLessThan(map0);
    expect(p.drain(40)).toBeCloseTo(40, 6);
    p.step(6);
    expect(p.haemo(fromPci).map).toBeGreaterThan(mapBefore);
  });

  it("sealing stops the leak; the stand-in patient arrives bleeding when there is no hand-over", () => {
    const t = perforatedTransfer(42);
    const p = new EnginePericardium(engineFromHandover(t.patient as Parameters<typeof engineFromHandover>[0]), leakFromTransfer(t));
    p.seal();
    const v = p.volume;
    p.step(5);
    expect(p.volume).toBeCloseTo(v, 6);
    // a hand-over without a payload uses the snapshot's inflow; none at all uses the default
    expect(leakFromTransfer({ ...t, payload: null }).mlPerS).toBeCloseTo(0.6, 6);
    expect(leakFromTransfer(null)).toMatchObject({ mlPerS: HANDOVER_LEAK.mlPerS, stopMmHg: HANDOVER_LEAK.stopMmHg, sealed: false });
    expect(leakFromTransfer({ ...t, payload: { sealed: true } }).sealed).toBe(true);
    const stand = new EnginePericardium(standInPerforatedEngine(), leakFromTransfer(null));
    expect(stand.volume).toBeGreaterThan(HANDOVER_LEAK.standInArrivalMl - 10);
    const v0 = stand.volume;
    stand.step(3);
    expect(stand.volume).toBeGreaterThan(v0);
  });

  it("the stand-in's leak settles short of the engine's collapse: below 150 mL with MAP >= 35 at 10 minutes; draining 40 mL raises MAP by 15 or more", () => {
    const stand = new EnginePericardium(standInPerforatedEngine(), leakFromTransfer(null));
    for (let s = 0; s < 600; s += 60) {
      stand.step(60);
      expect(stand.volume, `${s + 60} s`).toBeLessThan(150);
      expect(stand.haemo(fromPci).map, `${s + 60} s`).toBeGreaterThanOrEqual(35);
    }
    // still hypotensive enough to need drainage
    expect(stand.haemo(fromPci).tamponade).toBe(true);
    const before = stand.haemo(fromPci).map;
    stand.drain(40);
    stand.step(10);
    expect(stand.haemo(fromPci).map - before).toBeGreaterThanOrEqual(15);
  });

  it("the engine patient's signs follow one severity: tamponade on the engine's MAP brings the echo signs with it", () => {
    const stand = new EnginePericardium(standInPerforatedEngine(), leakFromTransfer(null));
    stand.step(600);
    const h = stand.haemo(fromPci);
    const base = haemodynamics(stand.volume, fromPci);
    expect(h.severity).toBeGreaterThan(base.severity);
    expect(h).toMatchObject(signsFor(h.severity, base.ppc, stand.volume, fromPci));
    expect(h.tamponade).toBe(true);
    expect(h.raCollapse && h.rvCollapse).toBe(true);
    expect(h.ra).toBeGreaterThanOrEqual(h.ppc);
    // haemodynamics() is unchanged by the helper: its own severity and pressure give its own signs
    for (const sc of PERIC_SCENARIOS)
      for (const v of [0, 50, 150, 300, 900]) {
        const hh = haemodynamics(v, sc);
        expect(hh, `${sc.id} ${v}`).toMatchObject(signsFor(hh.severity, pericardialPressure(v, sc.chronicity), v, sc));
        expect(hh.raCollapse).toBe(!sc.regional && pericardialPressure(v, sc.chronicity) > 5);
        expect(hh.rvCollapse).toBe(!sc.regional && pericardialPressure(v, sc.chronicity) > 9);
      }
  });
});

describe("the loculated collection after CABG", () => {
  it("in 'post-cabg-loculated' a subxiphoid needle returns no fluid and raises ectopy", () => {
    const pk = pocketDepths(loculated.initialVolume, loculated);
    const path = needlePath(ideal("subxiphoid"), pk);
    expect(path.effusionMm).toBe(0);
    const seen = new Set<string>();
    for (let d = 0; d <= 140; d += 1) seen.add(structureAt(path, d));
    expect(seen.has("effusion")).toBe(false);
    // the first thing beyond the pericardium is the heart: nothing in the syringe, and ectopics
    const atHeart = structureAt(path, path.pericardiumAt! + 1);
    expect(atHeart).toBe("epicardium");
    expect(aspirate(atHeart, loculated).label).toBe("Nothing");
    expect(provokesEctopy(atHeart)).toBe(true);
    expect(provokesEctopy("tissue")).toBe(false);
    expect(provokesEctopy("effusion")).toBe(false);
    // compromised, without the classic right-heart signs
    const h = haemodynamics(loculated.initialVolume, loculated);
    expect(h.tamponade).toBe(true);
    expect(h.raCollapse || h.rvCollapse).toBe(false);
  });

  it("CT or surgical drainage is correct; a needle is not", () => {
    expect(isCorrectManagement(loculated, "ct-guided-drainage")).toBe(true);
    expect(isCorrectManagement(loculated, "surgical-drainage")).toBe(true);
    expect(isCorrectManagement(loculated, "pericardiocentesis")).toBe(false);
    const log = (management: PericRunLog["management"], over: Partial<PericRunLog> = {}): PericRunLog => ({
      scenarioId: "post-cabg-loculated",
      management,
      rationaleCorrect: true,
      supportiveCorrect: 3,
      supportiveWrong: 0,
      window: null,
      plannedRisk: null,
      structuresEntered: [],
      aspiratedWhileAdvancing: false,
      salineResult: null,
      pressureChecked: false,
      wireResult: null,
      dilatedWithoutWireCheck: false,
      dilatedIntoChamber: false,
      drainPlaced: false,
      drainedMl: 0,
      finalPpc: 10,
      finalSeverity: 0.5,
      bleedSealRequested: false,
      stagedDrainage: true,
      fluidSent: false,
      ...over,
    });
    expect(scorePericardiocentesis(log("ct-guided-drainage", { bleedSealRequested: true })).score).toBe(100);
    expect(scorePericardiocentesis(log("surgical-drainage", { bleedSealRequested: true })).score).toBe(100);
    // the perforation is sealed at once (03-perforation): not asking for it costs points
    const unsealed = scorePericardiocentesis(log("ct-guided-drainage"));
    expect(unsealed.items.find((i) => i.label === "Stop the bleeding")).toMatchObject({ points: 0, max: 10 });
    expect(unsealed.score).toBeLessThan(100);
    expect(scorePericardiocentesis(log("pericardiocentesis", { rationaleCorrect: false, structuresEntered: ["tissue", "epicardium", "rv"] })).score).toBeLessThan(30);
  });
});

describe("scoring the perforation scenarios", () => {
  const base = (id: PericRunLog["scenarioId"], over: Partial<PericRunLog> = {}): PericRunLog => ({
    scenarioId: id,
    management: "pericardiocentesis",
    rationaleCorrect: null,
    supportiveCorrect: 0,
    supportiveWrong: 0,
    window: "subxiphoid",
    plannedRisk: "safe",
    structuresEntered: ["tissue", "effusion"],
    aspiratedWhileAdvancing: true,
    salineResult: "pericardial",
    pressureChecked: true,
    wireResult: "wraps",
    dilatedWithoutWireCheck: false,
    dilatedIntoChamber: false,
    drainPlaced: true,
    drainedMl: 120,
    finalPpc: 1,
    finalSeverity: 0,
    bleedSealRequested: true,
    stagedDrainage: true,
    fluidSent: false,
    echoRepeated: true,
    secondsToDrain: 60,
    ...over,
  });

  it("the unstable patient is drained promptly, re-imaged and the hole sealed; late drainage or no re-imaging costs points", () => {
    const good = scorePericardiocentesis(base("perforation-unstable"));
    expect(good.score).toBe(100);
    expect(good.items.map((i) => i.label)).toEqual(expect.arrayContaining(["Drained promptly", "Re-imaged after drainage", "Stop the bleeding"]));
    expect(scorePericardiocentesis(base("perforation-unstable", { secondsToDrain: unstable.promptDrainS! + 60 })).score).toBeLessThan(good.score);
    expect(scorePericardiocentesis(base("perforation-unstable", { echoRepeated: false })).score).toBeLessThan(good.score);
    expect(scorePericardiocentesis(base("from-pci-perforation")).score).toBe(100);
    expect(scorePericardiocentesis(base("from-pci-perforation", { bleedSealRequested: false })).score).toBeLessThan(100);
  });

  it("the small stable effusion is observed and followed with echo; a needle is penalised", () => {
    const observe = base("perforation-stable-small", { management: "observe", rationaleCorrect: true, window: null, structuresEntered: [], drainPlaced: false, drainedMl: 0, secondsToDrain: null });
    expect(scorePericardiocentesis(observe).score).toBe(100);
    expect(scorePericardiocentesis({ ...observe, echoRepeated: false }).score).toBe(75);
    expect(scorePericardiocentesis(base("perforation-stable-small", { rationaleCorrect: false })).score).toBeLessThan(20);
    // repeat echo earns the follow-up points only when the effusion was left to be followed
    const needled = scorePericardiocentesis(base("perforation-stable-small", { rationaleCorrect: true, echoRepeated: true }));
    expect(needled.items.find((i) => i.label === "Follow the effusion")?.points).toBe(0);
    expect(needled.items.map((i) => i.label)).not.toContain("Stop the bleeding");
  });

  it("the window is scored on the pockets the learner saw on arrival (initialMl), not the scenario's nominal volume", () => {
    const nominal = scorePericardiocentesis(base("from-pci-perforation")).items.find((i) => i.label === "Window")!;
    const seen = scorePericardiocentesis(base("from-pci-perforation", { initialMl: 110 })).items.find((i) => i.label === "Window")!;
    const at = (ml: number) => Math.round(pocketDepths(ml, fromPci).subxiphoid);
    expect(nominal.detail).toContain(`${at(fromPci.initialVolume)} mm`);
    expect(seen.detail).toContain(`${at(110)} mm`);
    expect(at(110)).not.toBe(at(fromPci.initialVolume));
  });

  it("the original scenarios score as before (out of 100, no new items)", () => {
    const r = scorePericardiocentesis(base("pci-perforation", { echoRepeated: undefined, secondsToDrain: undefined }));
    expect(r.items.reduce((a, b) => a + b.max, 0)).toBe(100);
    expect(r.items.map((i) => i.label)).not.toContain("Re-imaged after drainage");
    expect(scorePericardiocentesis(base("malignant", { echoRepeated: undefined })).items.reduce((a, b) => a + b.max, 0)).toBe(100);
  });
});

describe("wire confirmation after a perforation", () => {
  it("blood from the sac and from the RV look the same in the syringe; saline and the wire course tell them apart", () => {
    for (const sc of [fromPci, unstable, pci]) {
      const sac = aspirate("effusion", sc);
      const rv = aspirate("rv", sc);
      expect(rv.label).toBe(sac.label);
      expect(rv.colour).toBe(sac.colour);
      expect(salineCheck("effusion")).not.toBe(salineCheck("rv"));
      expect(wireCheck("effusion")).toBe("wraps");
      expect(wireCheck("rv")).toBe("rvot-pa");
    }
    // a chronic effusion still looks different from ventricular blood
    expect(aspirate("rv", malignant).label).not.toBe(aspirate("effusion", malignant).label);
  });
});

describe("readouts for a loculated collection", () => {
  it("in 'post-cabg-loculated' RA is not tied to the collection pressure and the pressure read is capped", () => {
    const h = haemodynamics(loculated.initialVolume, loculated);
    expect(h.ppc).toBeLessThanOrEqual(REGIONAL_PPC_CAP);
    expect(h.ra).toBeLessThanOrEqual(loculated.baseline.ra + REGIONAL_RA_RISE);
    expect(h.ra).toBeLessThan(h.ppc);
    expect(h.tamponade).toBe(true);
    // a circumferential effusion still sets RA from the pericardial pressure
    const tamp = haemodynamics(pci.initialVolume, pci);
    expect(tamp.ra).toBeGreaterThanOrEqual(Math.round(tamp.ppc + 1));
  });

  it("a heparinised patient's RV aspirate is not called blood that clots", () => {
    const rv = aspirate("rv", loculated);
    expect(loculated.heparinised).toBe(true);
    expect(rv.label).toBe("Dark blood");
    expect(rv.clots).toBe("unreliable");
    const unhep = PERIC_SCENARIOS.find((s) => !s.heparinised && s.fluid !== "blood-acute")!;
    expect(aspirate("rv", unhep).label).toBe("Dark blood that clots");
  });
});
