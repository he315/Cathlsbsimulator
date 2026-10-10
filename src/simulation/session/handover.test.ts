import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { PatientEngine } from "../patient/engine";
import { generatePatient, type PatientProfile } from "../patient/patient";
import { ANGIOCAD_SEGMENTS } from "../patient/angiocadPriors";
import { buildAnatomy } from "../anatomy";
import { buildCoronaryTree } from "../../render/xray/coronaryTree";
import { CASE_LIBRARY } from "../caseGenerator";
import { tipsFor } from "../../content/lab/tips";
import {
  contrastState,
  deliveredHeparinU,
  emptyLabReport,
  engineFromHandover,
  lesionIdOf,
  patientHandoverFrom,
  type HandoverExtensions,
  type LabReport,
  type WithHandover,
} from "./handover";
import type { SessionHandover } from "./caseSession";

// Any storage write would show here: transfers and snapshots must live in memory only. The UI store
// (imported by the hand-over store for rule 6) legitimately saves NavMemory under the "nav" key.
const writes: string[] = [];
const nonNavWrites = () => writes.filter((k) => !k.endsWith("nav"));
beforeAll(() => {
  const mem = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    get length() {
      return mem.size;
    },
    clear: () => mem.clear(),
    getItem: (k: string) => mem.get(k) ?? null,
    key: (i: number) => [...mem.keys()][i] ?? null,
    removeItem: (k: string) => void mem.delete(k),
    setItem: (k: string, v: string) => {
      writes.push(k);
      mem.set(k, String(v));
    },
  };
});

/** A patient with no coronary disease, in sinus rhythm (as in patient.test.ts). */
function healthy(seed: number): PatientProfile {
  const p = generatePatient(seed, { indication: "SA" });
  const grades = { ...p.angiocad.grades };
  for (const s of ANGIOCAD_SEGMENTS) grades[s] = 0;
  return { ...p, angiocad: { ...p.angiocad, grades }, culprit: null, baseline: { ...p.baseline, rhythm: "sinus" } };
}

/** A PCI-lab patient with a perforation leaking into the pericardium. */
function perforated(seed = 41): PatientEngine {
  const e = new PatientEngine({ profile: healthy(seed), lesions: [] });
  e.setTip({ location: "aorta" });
  e.transducer.zero();
  e.advance(10);
  e.setPericardialInflow(25 / 6);
  e.advance(24);
  return e;
}

async function store() {
  const m = await import("../../state/useLabHandoverStore");
  m.useLabHandoverStore.getState().clear();
  return m;
}

beforeEach(async () => {
  (await store()).useLabHandoverStore.getState().clear();
});

describe("lab hand-over store", () => {
  it("a PatientEngine snapshot round-trips: same pericardialMl and MAP within 1 mmHg; take() returns it once", async () => {
    const { putHandover, takeHandover, peekHandover } = await store();
    const sender = perforated();
    const before = sender.vitals();
    expect(before.pericardialMl).toBeGreaterThan(50);
    const h = patientHandoverFrom(sender);
    putHandover({ to: "pericardiocentesis", from: "angio-pci", params: { start: "tamponade" }, events: ["perforation", "tamponade", "perforation"], patient: h.snapshot, profile: h.profile });

    // the sending lab's engine runs on (it should stop, but if it does not, the transfer is unaffected)
    sender.advance(20);
    expect(sender.vitals().pericardialMl).toBeGreaterThan(before.pericardialMl + 50);

    expect(peekHandover("pericardiocentesis")).toMatchObject({ from: "angio-pci", hasPatient: true, events: ["perforation", "tamponade"] });
    const t = takeHandover("pericardiocentesis");
    expect(t).not.toBeNull();
    expect(takeHandover("pericardiocentesis")).toBeNull();
    expect(peekHandover("pericardiocentesis")).toBeNull();
    expect(t!.params).toEqual({ start: "tamponade" });
    expect(t!.events).toEqual(["perforation", "tamponade"]);

    const receiver = engineFromHandover(t!.patient!);
    const after = receiver.vitals();
    expect(Math.abs(after.pericardialMl - before.pericardialMl)).toBeLessThan(1e-9);
    expect(Math.abs(after.aortaTrue.mean - before.aortaTrue.mean)).toBeLessThan(1);
    expect(after.t).toBeCloseTo(before.t, 9);
  });

  it("the restored patient lives on exactly as the sender would have: the leak keeps filling, draining raises MAP", async () => {
    const { putHandover, takeHandover } = await store();
    const sender = perforated(42);
    const h = patientHandoverFrom(sender);
    putHandover({ to: "pericardiocentesis", from: "angio-pci", patient: h.snapshot, profile: h.profile });
    const receiver = engineFromHandover(takeHandover("pericardiocentesis")!.patient!);
    sender.advance(6);
    receiver.advance(6);
    const vs = sender.vitals();
    const vr = receiver.vitals();
    expect(vr.pericardialMl).toBeCloseTo(vs.pericardialMl, 6);
    expect(vr.aortaTrue.mean).toBeCloseTo(vs.aortaTrue.mean, 6);
    expect(vr.art!.mean).toBeCloseTo(vs.art!.mean, 6);
    expect(JSON.stringify(receiver.snapshot())).toBe(JSON.stringify(sender.snapshot()));

    // the open leak still fills the sac every second
    let ml = vr.pericardialMl;
    for (let i = 0; i < 3; i++) {
      receiver.advance(1);
      expect(receiver.vitals().pericardialMl).toBeGreaterThan(ml);
      ml = receiver.vitals().pericardialMl;
    }
    // sealed and drained, the pressure recovers
    receiver.setPericardialInflow(0);
    receiver.advance(4);
    const mapBefore = receiver.vitals().aortaTrue.mean;
    expect(receiver.drainPericardium(receiver.vitals().pericardialMl)).toBeGreaterThan(50);
    receiver.advance(8);
    expect(receiver.vitals().aortaTrue.mean).toBeGreaterThan(mapBefore);
  });

  it("put() copies: changing the sender's objects afterwards does not change the transfer", async () => {
    const { putHandover, takeHandover } = await store();
    const sender = perforated(43);
    const h = patientHandoverFrom(sender);
    const params = { scenario: "x" };
    const events: ("perforation" | "tamponade")[] = ["perforation"];
    const report: LabReport = { ...emptyLabReport("angio-pci"), contrastMl: 120 };
    const payload = { site: { vessel: "LAD" } };
    expect(h.snapshot.network!.lesions).toHaveLength(0);
    putHandover({ to: "pericardiocentesis", from: "angio-pci", params, events, patient: h.snapshot, profile: h.profile, report, payload });
    const periMl = h.snapshot.periMl;
    const hr = h.profile.baseline.hr;
    expect(hr).not.toBe(1);
    // top-level fields
    h.snapshot.periMl = 0;
    h.profile.weightKg = 1;
    params.scenario = "y";
    events.push("tamponade");
    report.contrastMl = 0;
    // nested fields: a shallow copy would let these through
    h.snapshot.network!.lesions.push({ vessel: "RCA", position: 0.5, severity: 80, kind: "severe-stenosis", lengthMm: 10 });
    h.profile.baseline.hr = 1;
    report.complications.push({ id: "x", label: "x", t: 0, severity: "minor" });
    payload.site.vessel = "RCA";
    const t = takeHandover("pericardiocentesis")!;
    expect(t.patient!.snapshot.periMl).toBe(periMl);
    expect(t.patient!.profile.weightKg).not.toBe(1);
    expect(t.patient!.snapshot.network!.lesions).toHaveLength(0);
    expect(t.patient!.profile.baseline.hr).toBe(hr);
    expect(t.params.scenario).toBe("x");
    expect(t.events).toEqual(["perforation"]);
    expect(t.report!.contrastMl).toBe(120);
    expect(t.report!.complications).toHaveLength(0);
    expect(t.payload).toEqual({ site: { vessel: "LAD" } });
  });

  it("refuses a snapshot it cannot restore: no profile, the wrong profile, or a tree-built snapshot without its tree or with the wrong one", async () => {
    const { putHandover, peekHandover } = await store();
    const a = perforated(44);
    const snap = a.snapshot();
    expect(() => putHandover({ to: "pericardiocentesis", from: "angio-pci", patient: snap })).toThrow(/profile/);
    expect(() => putHandover({ to: "pericardiocentesis", from: "angio-pci", patient: snap, profile: healthy(45) })).toThrow(/belongs to patient/);
    expect(() => putHandover({ to: "pericardiocentesis", from: "angio-pci", profile: a.profile })).toThrow(/without a patient snapshot/);
    expect(peekHandover("pericardiocentesis")).toBeNull();

    const c = CASE_LIBRARY[0];
    const model = buildAnatomy(c);
    const lesions = [{ vessel: "LAD" as const, position: 0.35, severity: 90, kind: "severe-stenosis" as const, lengthMm: 12 }];
    const tree = buildCoronaryTree(model, { ...c, lesions });
    // a different case's anatomy: PatientEngine.treeKey hashes vessel geometry, not lesions
    const c2 = CASE_LIBRARY[1];
    const otherTree = buildCoronaryTree(buildAnatomy(c2), { ...c2, lesions });
    const e = new PatientEngine({ profile: healthy(46), tree, lesions });
    e.setTip({ location: "aorta" });
    e.advance(4);
    e.setOcclusion("b", { vessel: "LAD", param: 0.36, fraction: 1 });
    e.advance(6);
    const s = e.snapshot();
    expect(s.network?.treeKey).toBeTruthy();
    expect(() => putHandover({ to: "physiology", from: "angio-pci", patient: s, profile: e.profile })).toThrow(/coronary tree/);
    expect(PatientEngine.treeKey(otherTree)).not.toBe(PatientEngine.treeKey(tree));
    expect(() => putHandover({ to: "physiology", from: "angio-pci", patient: s, profile: e.profile, tree: otherTree })).toThrow(/not the one/);
    expect(peekHandover("physiology")).toBeNull();

    // with its tree, the network and the ischaemia come back
    const { takeHandover } = await store();
    putHandover({ to: "physiology", from: "angio-pci", patient: s, profile: e.profile, tree, events: ["stent-underexpanded"] });
    const r = engineFromHandover(takeHandover("physiology")!.patient!);
    expect(r.lesions).toEqual(lesions);
    expect(r.flow.regions.length).toBe(e.flow.regions.length);
    e.advance(5);
    r.advance(5);
    expect(JSON.stringify(r.snapshot())).toBe(JSON.stringify(e.snapshot()));
  });

  it("keeps one transfer per lab (latest wins), others untouched; subscribers take each new transfer once", async () => {
    const { putHandover, takeHandover, peekHandover, subscribeLabHandover, useLabHandoverStore } = await store();
    const s1 = putHandover({ to: "pericardiocentesis", from: "angio-pci", params: { start: "a" } });
    putHandover({ to: "physiology", from: "pci-bench", params: { start: "post" } });
    const s2 = putHandover({ to: "pericardiocentesis", from: "angio-pci", params: { start: "b" } });
    expect(s2).toBeGreaterThan(s1);
    expect(peekHandover("pericardiocentesis")).toMatchObject({ params: { start: "b" }, hasPatient: false, seq: s2 });
    expect(takeHandover("pericardiocentesis")!.patient).toBeNull();
    expect(peekHandover("physiology")).not.toBeNull();

    const got: string[] = [];
    const off = subscribeLabHandover("physiology", (t) => got.push(t.params.start));
    expect(got).toEqual(["post"]);
    expect(peekHandover("physiology")).toBeNull();
    putHandover({ to: "pericardiocentesis", from: "angio-pci" });
    putHandover({ to: "physiology", from: "pci-bench", params: { start: "edge" } });
    expect(got).toEqual(["post", "edge"]);
    expect(peekHandover("pericardiocentesis")).not.toBeNull();
    off();
    putHandover({ to: "physiology", from: "pci-bench", params: { start: "late" } });
    expect(got).toEqual(["post", "edge"]);

    useLabHandoverStore.getState().dropWhere((to) => to === "physiology");
    expect(peekHandover("physiology")).toBeNull();
    expect(peekHandover("pericardiocentesis")).not.toBeNull();
    useLabHandoverStore.getState().clear();
    expect(peekHandover("pericardiocentesis")).toBeNull();
  });

  it("never writes a transfer or a snapshot to storage", async () => {
    const { putHandover, takeHandover } = await store();
    const before = nonNavWrites().length;
    const a = perforated(47);
    const h = patientHandoverFrom(a);
    putHandover({ to: "pericardiocentesis", from: "angio-pci", patient: h.snapshot, profile: h.profile, events: ["perforation"] });
    takeHandover("pericardiocentesis");
    expect(nonNavWrites().length).toBe(before);
  });

  it("drops a transfer when the learner leaves for another section, keeps it when the sender opens the receiving lab", async () => {
    const { putHandover, peekHandover } = await store();
    const { useUiStore, SIM_SECTION } = await import("../../state/useUiStore");
    const a = perforated(48);
    const h = patientHandoverFrom(a);
    const navBefore = writes.length - nonNavWrites().length;
    const otherBefore = nonNavWrites().length;

    // the learner walks away by another route: the perforated patient must not reappear later
    useUiStore.getState().openSim("angio-pci");
    putHandover({ to: "pericardiocentesis", from: "angio-pci", patient: h.snapshot, profile: h.profile, events: ["perforation", "tamponade"] });
    useUiStore.getState().openSim("physiology");
    expect(peekHandover("pericardiocentesis")).toBeNull();

    // the sender's own route: put, then openSim(to); the target's section is entered and the transfer survives
    useUiStore.getState().openSim("angio-pci");
    putHandover({ to: "pericardiocentesis", from: "angio-pci", patient: h.snapshot, profile: h.profile, events: ["perforation", "tamponade"] });
    useUiStore.getState().openSim("pericardiocentesis");
    expect(useUiStore.getState().section).toBe(SIM_SECTION.pericardiocentesis.section);
    expect(peekHandover("pericardiocentesis")).toMatchObject({ from: "angio-pci", hasPatient: true });

    // NavMemory was saved for the navigation, but nothing else (no transfer, no snapshot)
    expect(writes.length - nonNavWrites().length).toBeGreaterThan(navBefore);
    expect(nonNavWrites().length).toBe(otherBefore);
  });
});

describe("hand-over types and helpers", () => {
  it("events carried by a transfer reach the receiving lab's tip selector", async () => {
    // A PCI context is where carried events surface tips today: no bedside or physiology tip is yet
    // gated on 'perforation', 'tamponade' or 'stent-underexpanded'. The pericardiocentesis tips on the
    // carried events arrive in pericardiocentesis-tips-and-pci-handover.
    const { putHandover, takeHandover } = await store();
    putHandover({ to: "angio-pci", from: "pci-bench", events: ["perforation"] });
    const t = takeHandover("angio-pci")!;
    expect(t.events).toEqual(["perforation"]);
    const ids = tipsFor({ lab: "pci", phase: "complication", events: t.events }, 50).map((x) => x.id);
    expect(ids).toEqual(expect.arrayContaining(["pci-perf-grade-and-locate", "pci-perf-balloon-now"]));
    const without = tipsFor({ lab: "pci", phase: "complication" }, 50).map((x) => x.id);
    expect(without).not.toContain("pci-perf-grade-and-locate");
    expect(without).not.toContain("pci-perf-balloon-now");
  });

  it("contrast state, delivered heparin and lesion ids", () => {
    expect(contrastState(130, 200)).toEqual({ usedMl: 130, budgetMl: 200, remainingMl: 70 });
    expect(contrastState(260, 200).remainingMl).toBe(0);
    expect(contrastState(-5, null)).toEqual({ usedMl: 0, budgetMl: null, remainingMl: null });
    const doses = [
      { u: 5000, t: 60, route: "iv" as const, delivered: false },
      { u: 5000, t: 400, route: "ia" as const, delivered: true },
    ];
    expect(deliveredHeparinU({ doses })).toBe(5000);
    expect(lesionIdOf({ vessel: "LAD", position: 0.35 })).toBe("LAD@0.350");
  });

  it("the extensions are additive optional fields on SessionHandover", () => {
    const ext: HandoverExtensions = {};
    expect(Object.keys(ext)).toHaveLength(0);
    // type-level: a SessionHandover with the extensions still is a SessionHandover
    const widen = (h: WithHandover<SessionHandover>): SessionHandover => h;
    expect(typeof widen).toBe("function");
    const r = emptyLabReport("angio-pci");
    expect(r).toEqual({ lab: "angio-pci", stents: [], finalTimi: null, complications: [], contrastMl: 0, dose: { fluoroS: 0, karMGy: 0, kapGyCm2: 0 }, durationS: 0, residual: [] });
  });
});
