// Patient events from the patient engine (found-lab-session-plumbing): the hypotension hold, the
// rhythm events, what is gated on an observation, and the adapter raising into the event log. The
// last block checks that the events make patient tips reachable in the labs the requests name.
//   npx vitest run src/ui/lab/patientEvents.test.ts
import { describe, expect, it } from "vitest";
import { ACT_GOALS_S, PATIENT_EVENTS, PATIENT_EVENT_THRESHOLDS, PatientEventAdapter, patientEvents, type PatientEventState, type PatientVitals } from "./patientEvents";
import { EventLog } from "./eventLog";
import { LAB_EVENTS, tipsFor, TIP_BY_ID } from "../../content/lab/tips";
import { PatientEngine } from "../../simulation/patient/engine";

const art = (mean: number) => ({ sys: mean + 30, dia: mean - 15, mean });

/** Run MAP at `mean` once a second from t = 0 to t = secs and return the events of the last update. */
function holdMap(mean: number, secs: number): string[] {
  let st: PatientEventState | undefined;
  let last: string[] = [];
  for (let t = 0; t <= secs; t++) {
    const r = patientEvents({ t, hr: 80, rhythmKind: "sinus", art: art(mean) }, st);
    st = r.state;
    last = r.events;
  }
  return last;
}

describe("patientEvents", () => {
  it("MAP 60 for 9 s raises nothing, for 11 s raises hypotension", () => {
    expect(holdMap(60, 9)).toEqual([]);
    expect(holdMap(60, 11)).toEqual(["hypotension"]);
  });

  it("the hold restarts when the pressure recovers", () => {
    let st: PatientEventState | undefined;
    const step = (t: number, mean: number) => {
      const r = patientEvents({ t, art: art(mean) }, st);
      st = r.state;
      return r.events;
    };
    for (let t = 0; t <= 8; t++) step(t, 60);
    step(9, 75);
    for (let t = 10; t <= 18; t++) expect(step(t, 60)).toEqual([]);
    expect(step(20, 60)).toEqual(["hypotension"]);
  });

  it("the 9 s and 11 s hold holds with the tip in the aorta", () => {
    const run = (secs: number) => {
      let st: PatientEventState | undefined;
      let last: string[] = [];
      for (let t = 0; t <= secs; t++) {
        const r = patientEvents({ t, hr: 80, rhythmKind: "sinus", art: art(60), tipState: "aortic" }, st);
        st = r.state;
        last = r.events;
      }
      return last;
    };
    expect(run(9)).toEqual([]);
    expect(run(11)).toEqual(["hypotension"]);
  });

  it("does not read a non-arterial trace as the MAP (LV pressure, a damped engagement)", () => {
    let st: PatientEventState | undefined;
    for (let t = 0; t <= 15; t++) {
      const r = patientEvents({ t, hr: 80, rhythmKind: "sinus", art: art(40), tipState: "lv" }, st);
      st = r.state;
      expect(r.events).toEqual([]);
    }
    st = undefined;
    for (let t = 0; t <= 15; t++) {
      const r = patientEvents({ t, hr: 80, rhythmKind: "sinus", art: art(30), tipState: "damped", nibp: { ...art(80), at: 0 } }, st);
      st = r.state;
      expect(r.events).toEqual([]);
    }
    // a damped trace with a low cuff reading is hypotension (the cuff is read instead)
    st = undefined;
    let last: string[] = [];
    for (let t = 0; t <= 11; t++) {
      const r = patientEvents({ t, art: art(90), tipState: "wedged", nibp: { ...art(58), at: 0 } }, st);
      st = r.state;
      last = r.events;
    }
    expect(last).toEqual(["hypotension"]);
    // no tamponade from an LV trace with an effusion while the cuff is normal
    expect(patientEvents({ t: 0, pericardialMl: 250, art: art(40), tipState: "lv", nibp: { ...art(80), at: 0 } }).events).toEqual([]);
  });

  it("a frame with no readable pressure carries the hold over without raising", () => {
    let st: PatientEventState | undefined;
    const step = (t: number, v: Partial<PatientVitals>) => {
      const r = patientEvents({ t, ...v }, st);
      st = r.state;
      return r.events;
    };
    for (let t = 0; t <= 6; t++) step(t, { art: art(60) });
    expect(step(7, { art: null })).toEqual([]);
    expect(st!.lowMapSince).toBe(0);
    for (let t = 8; t <= 9; t++) step(t, { art: art(60) });
    expect(step(10, { art: art(60) })).toEqual(["hypotension"]);
  });

  it("the real engine: the tip in the LV raises no hypotension", () => {
    const eng = new PatientEngine({ seed: "patient-events-lv", lesions: [] });
    eng.setTip({ location: "aorta" });
    eng.transducer.zero();
    eng.advance(5);
    eng.setTip({ location: "lv" });
    const a = new PatientEventAdapter();
    let ev: string[] = [];
    for (let i = 0; i < 15; i++) {
      eng.advance(1);
      ev = a.update(eng.vitals());
    }
    expect(eng.vitals().tipState).toBe("lv");
    expect(ev).not.toContain("hypotension");
  });

  it("HR 45 raises bradycardia; HR 55 does not", () => {
    expect(patientEvents({ t: 0, hr: 45, rhythmKind: "sinus", art: art(80) }).events).toEqual(["bradycardia"]);
    expect(patientEvents({ t: 0, hr: 55, rhythmKind: "sinus", art: art(80) }).events).toEqual([]);
  });

  it("raises the rhythm events from the monitor rhythm at once", () => {
    expect(patientEvents({ t: 0, hr: null, rhythmKind: "vf" }).events).toEqual(["vf"]);
    expect(patientEvents({ t: 0, hr: 175, rhythmKind: "vt" }).events).toEqual(["vt"]);
    expect(patientEvents({ t: 0, hr: 110, rhythmKind: "af" }).events).toEqual(["atrial-fibrillation"]);
    expect(patientEvents({ t: 0, hr: 38, rhythmKind: "sinus", av: 3 }).events).toEqual(["av-block", "bradycardia"]);
  });

  it("raises ST elevation, desaturation, chest pain and a contrast reaction from what the patient shows", () => {
    const symptoms = { chestPain: 5, nausea: 0, dyspnoea: 0, flushing: 0.4, itch: 0.6, anxiety: 0, drowsy: 0, conscious: 1 };
    const ev = patientEvents({ t: 0, hr: 80, rhythmKind: "sinus", spo2: 86, stemi: { met: true, groups: ["inferior"] }, symptoms }).events;
    expect(ev).toEqual(expect.arrayContaining(["st-elevation", "desaturation", "chest-pain", "contrast-reaction"]));
  });

  it("reads LVEDP only while the LV trace is on the monitor (Oxford ch 4: normal 3-12, oedema likely above 30)", () => {
    expect(patientEvents({ t: 0, lvedp: 32, tipState: "aortic" }).events).toEqual([]);
    expect(patientEvents({ t: 0, lvedp: 18, tipState: "lv" }).events).toEqual(["high-lvedp"]);
    expect(patientEvents({ t: 0, lvedp: 32, tipState: "lv" }).events).toEqual(["high-lvedp", "pulmonary-oedema"]);
    // the clinical picture does not read an LVEDP the monitor is not showing
    const symptoms = { chestPain: 0, nausea: 0, dyspnoea: 0.8, flushing: 0, itch: 0, anxiety: 0, drowsy: 0, conscious: 1 };
    expect(patientEvents({ t: 0, spo2: 86, lvedp: 35, tipState: "aortic", symptoms }).events).toEqual(["desaturation"]);
    expect(patientEvents({ t: 0, spo2: 86, lvedp: 20, tipState: "lv", symptoms }).events).toEqual(["desaturation", "high-lvedp", "pulmonary-oedema"]);
    expect(PATIENT_EVENT_THRESHOLDS.highLvedpMmHg).toBe(12);
    expect(PATIENT_EVENT_THRESHOLDS.oedemaLvedpMmHg).toBe(30);
  });

  it("raises low ACT only from a measured ACT, against the lab's goal", () => {
    expect(patientEvents({ t: 0 }).events).toEqual([]);
    expect(patientEvents({ t: 0 }, undefined, { actMeasuredS: 240 }).events).toEqual(["low-act"]);
    expect(patientEvents({ t: 0 }, undefined, { actMeasuredS: 262 }).events).toEqual([]);
    // Brilakis on a Hemochron, heparin alone: 262 s is low (lesson pm-antithrombotics-heparin)
    expect(patientEvents({ t: 0 }, undefined, { actMeasuredS: 262 }, { thresholds: { actGoalS: ACT_GOALS_S.heparinHemochron } }).events).toEqual(["low-act"]);
  });

  it("shows an effusion only on echo, and tamponade at once with a low pressure", () => {
    expect(patientEvents({ t: 0, pericardialMl: 60, art: art(80) }).events).toEqual([]);
    expect(patientEvents({ t: 0, pericardialMl: 60, art: art(80) }, undefined, { echo: true }).events).toEqual(["pericardial-effusion"]);
    expect(patientEvents({ t: 0, pericardialMl: 250, art: art(50) }).events).toEqual(["tamponade"]);
  });

  it("raises high contrast volume at the plan's 80% of the ceiling, or from a lab's own ceiling check", () => {
    const contrast = { totalMl: 170, macdMl: 200, fractionOfMacd: 0.85, perCrCl: 2, crclMlMin: 85 };
    expect(patientEvents({ t: 0, contrast }).events).toEqual(["high-contrast-volume"]);
    expect(patientEvents({ t: 0, contrast: { ...contrast, fractionOfMacd: 0.5 } }).events).toEqual([]);
    expect(patientEvents({ t: 0, contrast: { ...contrast, fractionOfMacd: 0.5 } }, undefined, {}, { contrastHigh: (c) => c.perCrCl >= 2 }).events).toEqual(["high-contrast-volume"]);
  });

  it("uses only names from the tip vocabulary", () => {
    for (const e of PATIENT_EVENTS) expect(LAB_EVENTS).toContain(e);
  });
});

describe("PatientEventAdapter", () => {
  it("raises into the event log, which holds a transient event after it ends", () => {
    const log = new EventLog();
    const a = new PatientEventAdapter(log);
    for (let t = 0; t <= 12; t++) a.update({ t, hr: 80, rhythmKind: "sinus", art: art(60) });
    expect(log.active(12)).toEqual(["hypotension"]);
    a.update({ t: 13, hr: 80, rhythmKind: "sinus", art: art(80) });
    expect(a.current()).toEqual([]);
    expect(log.active(30)).toEqual(["hypotension"]);
    expect(log.active(44)).toEqual([]);
    expect(log.history()).toHaveLength(1);
  });

  it("uses the thresholds it was given", () => {
    const a = new PatientEventAdapter(undefined, { thresholds: { bradycardiaHr: 60 } });
    expect(a.update({ t: 0, hr: 55, rhythmKind: "sinus" })).toEqual(["bradycardia"]);
    expect(new PatientEventAdapter().update({ t: 0, hr: 55, rhythmKind: "sinus" })).toEqual([]);
  });

  it("reads PatientEngine vitals directly", () => {
    const eng = new PatientEngine({ seed: "patient-events-adapter", lesions: [] });
    eng.setTip({ location: "aorta" });
    eng.transducer.zero();
    eng.advance(5);
    const v: PatientVitals = eng.vitals();
    const r = new PatientEventAdapter().update(v);
    for (const e of r) expect(PATIENT_EVENTS).toContain(e);
    eng.forceRhythm("vf");
    eng.advance(1);
    expect(new PatientEventAdapter().update(eng.vitals())).toContain("vf");
  });
});

describe("patient tips are reachable from the adapter's events", () => {
  it("TAVI: the hypotension tip appears in the structural lab only with the event (hb-tavi#0)", () => {
    const hyp = holdMap(60, 11) as ("hypotension")[];
    const ctx = { lab: "structural" as const, phase: "assess" as const, procedures: ["tavi" as const] };
    expect(tipsFor(ctx, 20).map((t) => t.id)).not.toContain("structural-tavi-hypotension-coronary");
    expect(tipsFor({ ...ctx, events: hyp }, 20).map((t) => t.id)).toContain("structural-tavi-hypotension-coronary");
  });

  it("PCI: the hypotension and low-ACT tips appear when the adapter raises them", () => {
    const ev = [...holdMap(60, 11), ...patientEvents({ t: 0 }, undefined, { actMeasuredS: 190 }).events] as ("hypotension" | "low-act")[];
    const ids = tipsFor({ lab: "pci", phase: "wire", events: ev }, 40).map((t) => t.id);
    expect(ids).toContain("pci-low-act-redose");
    expect(ids.some((id) => TIP_BY_ID[id].when.event?.includes("hypotension"))).toBe(true);
  });
});
