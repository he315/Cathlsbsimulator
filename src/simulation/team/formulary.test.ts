// found-patient-formulary: the team reads, reads back and gives the new drugs and routes.
import { describe, expect, it } from "vitest";
import { PatientEngine } from "../patient/engine";
import { generatePatient, type PatientProfile } from "../patient/patient";
import { ANGIOCAD_SEGMENTS } from "../patient/angiocadPriors";
import { DRUGS, type DrugId } from "../patient/pharmacology";
import type { TelemetryEvent } from "../session/types";
import { Team } from "./team";
import { parseCommand, DRUG_ALIASES, DRUG_SPOKEN, ROUTE_SPOKEN } from "./intents";
import { QUERY_ABOVE, DRUG_ROLE } from "./params";
import type { Utterance } from "./types";

function healthy(seed: number): PatientProfile {
  const p = generatePatient(seed, { indication: "SA" });
  const grades = { ...p.angiocad.grades };
  for (const s of ANGIOCAD_SEGMENTS) grades[s] = 0;
  return { ...p, angiocad: { ...p.angiocad, grades }, culprit: null, baseline: { ...p.baseline, rhythm: "sinus" }, allergies: { contrast: "none", other: [] } };
}

function rig() {
  const eng = new PatientEngine({ profile: healthy(11), lesions: [] });
  eng.setTip({ location: "aorta" });
  eng.transducer.zero();
  eng.advance(8);
  eng.drainEvents();
  const team = new Team({ seed: 3, startClock: new Date(2026, 9, 5, 10, 30, 0), patient: eng, params: { mishearP: 0, wrongItemP: 0 } });
  const said: Utterance[] = [];
  const events: TelemetryEvent[] = [];
  team.bus.on("utterance", (u) => said.push(u));
  const run = (seconds: number, dt = 1 / 30) => {
    for (let k = 0; k < Math.round(seconds / dt); k++) {
      eng.advance(dt);
      const ev = eng.drainEvents();
      events.push(...ev);
      team.onTelemetry(ev);
      team.advance(dt);
    }
  };
  const last = (role?: string) => [...said].reverse().find((u) => !role || u.speaker === role);
  return { eng, team, said, events, run, last };
}

describe("team: the formulary's drugs", () => {
  it("every DrugId has an alias, a spoken name, a query threshold and a role; every route a spoken name", () => {
    const ids = Object.keys(DRUGS) as DrugId[];
    expect(ids.length).toBeGreaterThanOrEqual(42);
    const aliased = new Set(DRUG_ALIASES.map(([id]) => id));
    for (const id of ids) {
      expect(aliased.has(id), id).toBe(true);
      expect(DRUG_SPOKEN[id], id).toBeTruthy();
      expect(QUERY_ABOVE[id], id).toBeGreaterThan(0);
      expect(["scrub", "sedation"]).toContain(DRUG_ROLE[id]);
    }
    for (const r of ["iv", "ic", "ia", "im", "neb", "oral", "crushed"] as const) expect(ROUTE_SPOKEN[r]).toBeTruthy();
    // each alias finds its own drug (no alias is captured by another drug's)
    for (const [id, aliases] of DRUG_ALIASES) for (const a of aliases) expect((parseCommand(`${a} 1 mg`).intent as { drug?: string }).drug, a).toBe(id);
  });

  it("parses the new drugs, routes and gram doses", () => {
    const cases: [string, Record<string, unknown>][] = [
      ["flumazenil 0.2 mg IV", { k: "drug", drug: "flumazenil", dose: 0.2, unit: "mg", route: "iv" }],
      ["naloxone 100 micrograms IV", { k: "drug", drug: "naloxone", dose: 100, unit: "µg", route: "iv" }],
      ["salbutamol 5 mg nebulised", { k: "drug", drug: "salbutamol", dose: 5, unit: "mg", route: "neb" }],
      ["ticagrelor 180 mg crushed", { k: "drug", drug: "ticagrelor", dose: 180, unit: "mg", route: "crushed" }],
      ["aspirin 300 mg orally", { k: "drug", drug: "aspirin", dose: 300, unit: "mg", route: "oral" }],
      ["idarucizumab 2.5 grams IV", { k: "drug", drug: "idarucizumab", dose: 2500, unit: "mg", route: "iv" }],
      ["nitroprusside 100 micrograms down the left", { k: "drug", drug: "nitroprusside", dose: 100, unit: "µg", route: "ic", side: "left" }],
      ["amiodarone 300 mg IV", { k: "drug", drug: "amiodarone", dose: 300, unit: "mg", route: "iv" }],
      ["prothrombin complex concentrate 2000 units", { k: "drug", drug: "pcc", dose: 2000, unit: "U" }],
      // infusions of drugs the team's infusion intent does not carry are not read as boluses
      ["dobutamine infusion at 5 micrograms per kilo per minute", { k: "unknown" }],
      ["eptifibatide 2 micrograms per kilo per minute", { k: "unknown" }],
      ["noradrenaline infusion at 10", { k: "infusion", drug: "noradrenaline", rate: 10 }],
    ];
    for (const [text, want] of cases) expect(parseCommand(text).intent, text).toMatchObject(want);
  });

  it("reads back and gives a nebulised and a crushed oral dose through the engine", () => {
    const r = rig();
    r.team.command("salbutamol 5 mg nebulised");
    r.run(3);
    expect(r.last("sedation")!.text).toBe("5 milligrams of salbutamol nebulised.");
    r.team.command("correct");
    r.run(25);
    expect(r.events.find((e) => e.kind === "drug.given")?.data).toMatchObject({ drug: "salbutamol", dose: 5, route: "neb" });
    r.team.command("ticagrelor 180 mg crushed");
    r.run(3);
    expect(r.last("sedation")!.text).toBe("180 milligrams of ticagrelor crushed.");
    r.team.command("correct");
    r.run(25);
    expect(r.events.filter((e) => e.kind === "drug.given").map((e) => e.data?.drug)).toContain("ticagrelor");
  });

  it("the nurse says an infusion-only drug goes up as an infusion when it is ordered as a bolus, and asks the route of nitroprusside", () => {
    const r = rig();
    r.team.command("dobutamine 5 mg IV");
    r.run(3);
    expect(r.last("sedation")!.text).toMatch(/infusion, not a bolus\.$/);
    expect(r.events.some((e) => e.kind === "drug.given")).toBe(false);
    r.team.command("nitroprusside 100 micrograms");
    r.run(3);
    expect(r.last("scrub")!.text).toMatch(/intracoronary or IV\?$/);
  });

  it("an idarucizumab order in grams reads back in milligrams and is not queried as a large dose", () => {
    const r = rig();
    r.team.command("idarucizumab 2.5 grams IV");
    r.run(3);
    expect(r.last("sedation")!.text).toBe("2,500 milligrams of idarucizumab IV.");
  });
});
