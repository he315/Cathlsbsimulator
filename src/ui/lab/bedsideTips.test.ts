// The bedside lab's tip context (pericardiocentesis-tips-and-pci-handover).
//   npx vitest run src/ui/lab/bedsideTips.test.ts
import { describe, expect, it } from "vitest";
import { DEPRECATED_LAB_PHASES, LAB_EVENTS, LAB_PHASES, LAB_PROCEDURES, LAB_TIPS, tipsFor, type LabContext, type LabTip } from "../../content/lab/tips";
import { BEDSIDE_TAB_PROCEDURES, PERIC_PHASE, PERIC_RAISES, PERIC_STAGES, pericardioTipContext, pericardioVitals, raises, type PericStage } from "./bedsideTips";
import { INITIAL_PATIENT_EVENT_STATE, PATIENT_EVENT_THRESHOLDS, patientEvents } from "./patientEvents";

const ids = (tips: LabTip[]) => tips.map((t) => t.id);
const PERI_TIPS = ["bed-peri-set-up", "bed-peri-confirm-wire", "bed-peri-after-pci", "bed-peri-drain-stays"];
/** The stages at which each tip should show (its trigger's phases). */
const AT: Record<string, PericStage[]> = {
  "bed-peri-set-up": ["plan", "needle"],
  "bed-peri-confirm-wire": ["needle"],
  "bed-peri-after-pci": ["needle", "drain"],
  "bed-peri-drain-stays": ["drain"],
};
const ctx = (stage: PericStage, events: LabContext["events"] = []) => pericardioTipContext(stage, { events })!;

describe("pericardioTipContext", () => {
  it("bed-peri-set-up, bed-peri-confirm-wire, bed-peri-after-pci and bed-peri-drain-stays appear at their stages with procedures ['pericardiocentesis']", () => {
    for (const stage of PERIC_STAGES) {
      const c = pericardioTipContext(stage, { events: ["perforation"] });
      if (stage === "debrief") {
        expect(c).toBeNull();
        continue;
      }
      expect(c).toMatchObject({ lab: "bedside", phase: stage, procedures: ["pericardiocentesis"] });
      const got = ids(tipsFor(c!, 20));
      for (const id of PERI_TIPS) expect(got.includes(id), `${id} at ${stage}`).toBe(AT[id].includes(stage));
    }
  });

  it("none of them appears in the pacing tab, at any stage or with any event", () => {
    expect(BEDSIDE_TAB_PROCEDURES.pacing).toEqual(["pacing"]);
    for (const phase of LAB_PHASES.bedside) {
      const pacing: LabContext = { lab: "bedside", phase, procedures: [...BEDSIDE_TAB_PROCEDURES.pacing], events: ["perforation", "tamponade", "hypotension", "bradycardia"] };
      expect(ids(tipsFor(pacing, 200)).filter((id) => id.startsWith("bed-peri-")), phase).toEqual([]);
    }
    // and no pacing tip appears in the pericardiocentesis tab
    for (const stage of PERIC_STAGES) {
      const c = pericardioTipContext(stage, { events: ["perforation", "prior-cabg", "hypotension", "tamponade", "pericardial-effusion"] });
      if (c) expect(ids(tipsFor(c, 200)).filter((id) => id.startsWith("bed-pace-")), stage).toEqual([]);
    }
  });

  it("never reports the deprecated stage aliases; every stage but the debrief is a bedside phase", () => {
    const deprecated = DEPRECATED_LAB_PHASES.bedside ?? [];
    for (const stage of PERIC_STAGES) {
      const phase = PERIC_PHASE[stage];
      if (phase === null) continue;
      expect(LAB_PHASES.bedside as readonly string[]).toContain(phase);
      expect(deprecated).not.toContain(phase);
    }
  });

  it("case events come from the flags; patient events from the shared adapter, filtered to what this lab declares", () => {
    expect(ctx("needle", ["perforation", "prior-cabg"]).events).toEqual(["perforation", "prior-cabg"]);
    // names this lab does not report are dropped
    expect(ctx("needle", ["perforation", "vf", "cto"]).events).toEqual(["perforation"]);
    // tamponade at once from the vitals: a large collection with a low MAP
    const low = pericardioVitals(0, { hr: 120, sbp: 70, dbp: 45, map: 53 }, PATIENT_EVENT_THRESHOLDS.tamponadeMl + 20);
    expect(pericardioTipContext("assess", {}, low)!.events).toEqual(["tamponade"]);
    // hypotension needs its hold: the lab passes the adapter's state
    const st = patientEvents(low, INITIAL_PATIENT_EVENT_STATE).state;
    const later = { ...low, t: PATIENT_EVENT_THRESHOLDS.hypotensionHoldS + 1 };
    expect(pericardioTipContext("assess", {}, later, st)!.events).toEqual(expect.arrayContaining(["hypotension", "tamponade"]));
    // an effusion only once the echo shows one
    const small = pericardioVitals(0, { hr: 80, sbp: 120, dbp: 72, map: 88 }, 50);
    expect(pericardioTipContext("assess", {}, small)!.events).toEqual([]);
    expect(pericardioTipContext("assess", { echo: true }, small)!.events).toEqual(["pericardial-effusion"]);
  });

  it("raises uses the shared vocabulary and covers what the context can report", () => {
    expect(raises.lab).toBe("bedside");
    for (const p of raises.phases) expect(LAB_PHASES.bedside as readonly string[]).toContain(p);
    for (const e of raises.events) expect(LAB_EVENTS as readonly string[]).toContain(e);
    for (const x of raises.procedures ?? []) expect(LAB_PROCEDURES as readonly string[]).toContain(x);
    for (const stage of PERIC_STAGES) {
      const c = pericardioTipContext(stage, { events: [...raises.events] });
      if (!c) continue;
      expect(raises.phases).toContain(c.phase);
      for (const e of c.events ?? []) expect(raises.events).toContain(e);
      for (const x of c.procedures ?? []) expect(raises.procedures).toContain(x);
    }
    // the pericardiocentesis tab declares its own procedure; the bedside raises add the pacing tab's (pacing-in-lab-scenarios-and-tips)
    expect(PERIC_RAISES.procedures).toEqual(["pericardiocentesis"]);
    expect(raises.procedures).toEqual(["pericardiocentesis", "pacing", "tcp"]);
  });

  it("every bed-peri tip in the registry is one this context can show", () => {
    const peri = LAB_TIPS.filter((t) => t.id.startsWith("bed-peri-"));
    expect(peri.map((t) => t.id).sort()).toEqual([...PERI_TIPS].sort());
  });
});
