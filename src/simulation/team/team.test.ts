import { describe, expect, it } from "vitest";
import { PatientEngine } from "../patient/engine";
import { generatePatient, type PatientProfile } from "../patient/patient";
import { ANGIOCAD_SEGMENTS } from "../patient/angiocadPriors";
import type { TelemetryEvent } from "../session/types";
import { createInputSystem } from "../../input/system";
import { Team } from "./team";
import { parseCommand, COMMAND_EXAMPLES, spokenView } from "./intents";
import type { CArmPort, Utterance } from "./types";
import type { CArm } from "../../types";

function healthy(seed: number): PatientProfile {
  const p = generatePatient(seed, { indication: "SA" });
  const grades = { ...p.angiocad.grades };
  for (const s of ANGIOCAD_SEGMENTS) grades[s] = 0;
  return { ...p, angiocad: { ...p.angiocad, grades }, culprit: null, baseline: { ...p.baseline, rhythm: "sinus" }, allergies: { contrast: "none", other: [] } };
}

function engine(seed = 11) {
  const e = new PatientEngine({ profile: healthy(seed), lesions: [] });
  e.setTip({ location: "aorta" });
  e.transducer.zero();
  e.advance(8);
  e.drainEvents();
  return e;
}

const START = new Date(2026, 9, 5, 10, 30, 0);

interface Rig {
  team: Team;
  eng: PatientEngine | null;
  said: Utterance[];
  events: TelemetryEvent[];
  run(seconds: number, dt?: number): void;
  last(role?: string): Utterance | undefined;
  texts(role?: string): string[];
}

function rig(o: { seed?: number; withEngine?: boolean; params?: NonNullable<ConstructorParameters<typeof Team>[0]>["params"]; carm?: CArmPort; input?: NonNullable<ConstructorParameters<typeof Team>[0]>["input"]; eng?: PatientEngine; callouts?: boolean; zeroNeedsTap?: boolean } = {}): Rig {
  const eng = o.eng ?? (o.withEngine === false ? null : engine(o.seed ?? 11));
  const team = new Team({ seed: o.seed ?? 3, startClock: START, patient: eng, carm: o.carm, input: o.input, callouts: o.callouts, zeroNeedsTap: o.zeroNeedsTap, params: { mishearP: 0, wrongItemP: 0, ...(o.params ?? {}) } });
  const said: Utterance[] = [];
  const events: TelemetryEvent[] = [];
  team.bus.on("utterance", (u) => said.push(u));
  const r: Rig = {
    team,
    eng,
    said,
    events,
    run(seconds, dt = 1 / 30) {
      const n = Math.round(seconds / dt);
      for (let k = 0; k < n; k++) {
        if (eng) {
          eng.advance(dt);
          const ev = eng.drainEvents();
          events.push(...ev);
          team.onTelemetry(ev);
        }
        team.advance(dt);
      }
    },
    last(role) {
      for (let k = said.length - 1; k >= 0; k--) if (!role || said[k].speaker === role) return said[k];
      return undefined;
    },
    texts(role) {
      return said.filter((u) => !role || u.speaker === role).map((u) => u.text);
    },
  };
  return r;
}

// ---------------------------------------------------------------------------
describe("command grammar", () => {
  const cases: [string, Record<string, unknown>, string?][] = [
    ["give 2 mg midazolam", { k: "drug", drug: "midazolam", dose: 2, unit: "mg" }],
    ["Heparin 5,000 units IV", { k: "drug", drug: "heparin", dose: 5000, unit: "U", route: "iv" }],
    ["heparin 70 units per kilo", { k: "drug", drug: "heparin", dose: 70, unit: "U", perKg: true }],
    ["200 mics of GTN down the left", { k: "drug", drug: "gtn", dose: 200, unit: "µg", route: "ic", side: "left" }],
    ["adenosine 200 micrograms intracoronary", { k: "drug", drug: "adenosine", dose: 200, unit: "µg", route: "ic" }],
    ["atropine point six milligrams IV", { k: "drug", drug: "atropine", dose: 0.6, unit: "mg", route: "iv" }],
    ["five thousand units of heparin", { k: "drug", drug: "heparin", dose: 5000, unit: "U" }],
    ["fentanyl twenty five micrograms", { k: "drug", drug: "fentanyl", dose: 25, unit: "µg" }],
    ["verapamil 2.5 mg through the sheath", { k: "drug", drug: "verapamil", dose: 2.5, unit: "mg", route: "ia" }],
    ["metaraminol 1mg", { k: "drug", drug: "metaraminol", dose: 1, unit: "mg" }],
    ["LAO 30 cranial 20", { k: "carm", laoRao: 30, cranialCaudal: 20 }],
    ["RAO 30 caudal 25", { k: "carm", laoRao: -30, cranialCaudal: -25 }],
    ["RAO30 CAU25", { k: "carm", laoRao: -30, cranialCaudal: -25 }],
    ["AP cranial 30", { k: "carm", laoRao: 0, cranialCaudal: 30 }],
    ["LAO 45", { k: "carm", laoRao: 45, cranialCaudal: 0 }],
    ["left lateral", { k: "carm", laoRao: 90, cranialCaudal: 0 }],
    ["10 more cranial", { k: "carm", cranialCaudal: 10, relative: true }],
    ["a bit more LAO", { k: "carm", laoRao: 5, relative: true }],
    ["ACT please", { k: "act" }],
    ["nurse, can I have a 6 French JL4", { k: "equipment" }, "scrub"],
    ["3.0 by 15 NC balloon", { k: "equipment" }],
    ["3.5 x 18 stent", { k: "equipment" }],
    ["breathe in and hold", { k: "breath", action: "hold" }],
    ["and breathe away", { k: "breath", action: "release" }],
    ["I have the wire", { k: "haveWire" }],
    ["hold the wire please", { k: "holdWire" }],
    ["zero please", { k: "zero" }],
    ["record", { k: "record", on: true }],
    ["12-lead please", { k: "twelveLead" }],
    ["cycle the BP", { k: "nibp" }],
    ["fluoro 7.5 frames", { k: "protocol", fluoroPps: 7.5 }],
    ["cine 15", { k: "protocol", cinePps: 15 }],
    ["field 20", { k: "protocol", fieldCm: 20 }],
    ["low dose fluoro", { k: "protocol", fluoroLevel: "low" }],
    ["you'll feel a warm flush", { k: "warn", topic: "warmth" }],
    ["you may feel some chest tightness", { k: "warn", topic: "chest" }],
    ["sharp scratch", { k: "warn", topic: "scratch" }],
    ["any chest pain?", { k: "ask", topic: "pain" }],
    ["how are you feeling", { k: "ask", topic: "feeling" }],
    ["charge to 200", { k: "defib", action: "charge", joules: 200 }],
    ["stand clear", { k: "defib", action: "clear" }],
    ["shock", { k: "defib", action: "shock" }],
    ["start CPR", { k: "cpr", on: true }],
    ["correct", { k: "confirm" }],
    ["no", { k: "negate" }],
    ["cancel that", { k: "cancel" }],
    ["250 ml saline bolus", { k: "fluid", ml: 250 }],
    ["oxygen 2 litres", { k: "oxygen", lpm: 2 }],
    ["what's the pressure?", { k: "query", what: "pressure" }],
    ["adenosine infusion at 140", { k: "infusion", drug: "adenosine", rate: 140 }],
    ["stop the adenosine", { k: "infusion", drug: "adenosine", stop: true }],
    ["radiographer, table up", { k: "table", action: "up" }, "radiographer"],
    ["check the label", { k: "labelCheck" }],
    ["give it", { k: "administer" }],
    ["silence the alarms", { k: "silence" }],
    ["reset the timer", { k: "timerReset" }],
    ["sats?", { k: "query", what: "sats" }],
    ["how much contrast", { k: "query", what: "contrast" }],
    ["sing me a song", { k: "unknown" }],
  ];
  it(`parses ${cases.length} scripted utterances to the right intents`, () => {
    for (const [text, want, to] of cases) {
      const p = parseCommand(text);
      expect(p.intent, text).toMatchObject(want);
      if (to) expect(p.to, text).toBe(to);
    }
  });

  it("reads equipment with sizes, French and generic names", () => {
    expect(parseCommand("6 French JL4").intent).toMatchObject({ k: "equipment", item: { kind: "catheter", key: "JL4", name: "JL4", french: 6 } });
    expect(parseCommand("EBU 3.5 guide").intent).toMatchObject({ k: "equipment", item: { kind: "guide", name: "extra backup 3.5" } });
    expect(parseCommand("3.0 by 15 NC balloon").intent).toMatchObject({ item: { kind: "balloon", diameterMm: 3, lengthMm: 15, compliance: "non-compliant" } });
    expect(parseCommand("2.75 x 23 stent").intent).toMatchObject({ item: { kind: "stent", diameterMm: 2.75, lengthMm: 23 } });
    expect(parseCommand("workhorse wire").intent).toMatchObject({ item: { kind: "wire", key: "wire-workhorse" } });
  });

  it("every palette example parses to a known intent (the typed fallback covers every intent)", () => {
    const kinds = new Set<string>();
    for (const ex of COMMAND_EXAMPLES) {
      const p = parseCommand(ex.text);
      expect(p.intent.k, ex.text).not.toBe("unknown");
      kinds.add(p.intent.k);
    }
    for (const k of ["drug", "infusion", "fluid", "oxygen", "administer", "act", "carm", "table", "protocol", "timerReset", "equipment", "labelCheck", "breath", "holdWire", "haveWire", "zero", "record", "twelveLead", "nibp", "silence", "query", "defib", "cpr", "warn", "ask", "reassure", "keepStill", "confirm", "negate", "cancel"]) expect(kinds.has(k), k).toBe(true);
  });

  it("speaks views the way they are ordered", () => {
    expect(spokenView(30, 20)).toBe("LAO 30, cranial 20");
    expect(spokenView(-30, -25)).toBe("RAO 30, caudal 25");
    expect(spokenView(0, 30)).toBe("AP, cranial 30");
    expect(spokenView(45, 0)).toBe("LAO 45, straight");
  });
});

// ---------------------------------------------------------------------------
describe("closed-loop orders", () => {
  it("every complete order produces a read-back from the right team member", () => {
    const r = rig();
    const orders = [
      ["Heparin 5,000 units IV", "scrub"],
      ["200 micrograms GTN intracoronary", "scrub"],
      ["ACT please", "scrub"],
      ["6 French JL4", "scrub"],
      ["LAO 30 cranial 20", "radiographer"],
      ["fluoro 7.5 frames", "radiographer"],
      ["zero please", "physiologist"],
      ["12-lead please", "physiologist"],
      ["Give 2 mg midazolam", "sedation"],
      ["Fentanyl 25 micrograms IV", "sedation"],
      ["250 mL saline bolus", "sedation"],
      ["hold the wire", "scrub"],
    ];
    for (const [text, role] of orders) {
      const o = r.team.intent(parseCommand(text), "typed");
      expect(o, text).not.toBeNull();
      r.run(4);
      const rb = r.said.find((u) => u.orderId === o!.id && u.kind === "readback");
      expect(rb, text).toBeTruthy();
      expect(rb!.speaker).toBe(role);
      expect(o!.readbackAt).toBeGreaterThan(o!.t);
    }
  });

  it("heparin: read-back, confirmation, given through the engine and logged with the time", () => {
    const r = rig();
    r.team.command("Nurse, heparin 5,000 units IV");
    r.run(3);
    expect(r.last("scrub")!.text).toBe("5,000 units of heparin IV.");
    r.team.command("correct");
    r.run(25);
    const given = r.events.find((e) => e.kind === "drug.given");
    expect(given?.data).toMatchObject({ drug: "heparin", dose: 5000, route: "iv" });
    expect(r.last("scrub")!.text).toMatch(/^5,000 units of heparin given at 10:3\d\.$/);
    const rep = r.team.report();
    expect(rep.closedLoops).toBe(1);
    expect(rep.completeDrugOrders).toBe(1);
  });

  it("weight-based heparin is converted with the patient's weight", () => {
    const r = rig();
    const w = r.eng!.profile.weightKg;
    r.team.command("heparin 70 units per kilo IV");
    r.run(3);
    const total = Math.round((70 * w) / 100) * 100;
    expect(r.last("scrub")!.text).toBe(`70 units per kilo for ${w} kilos: ${total.toLocaleString("en-GB")} units of heparin IV.`);
  });

  it("asks for a missing route, then reads back the completed order", () => {
    const r = rig();
    r.team.command("GTN 200 micrograms");
    r.run(3);
    expect(r.last("scrub")!.kind).toBe("query");
    expect(r.last("scrub")!.text).toMatch(/intracoronary/);
    r.team.command("intracoronary");
    r.run(3);
    expect(r.last("scrub")!.text).toBe("200 micrograms of GTN intracoronary.");
    r.run(30);
    expect(r.last("scrub")!.text).toMatch(/drawn up and labelled, on the table/);
    // the operator gives it
    r.team.command("give it");
    r.run(1);
    expect(r.events.find((e) => e.kind === "drug.given")?.data).toMatchObject({ drug: "gtn", dose: 200, route: "ic", side: "left" });
    expect(r.team.report().completeDrugOrders).toBe(0);
  });

  it("asks about a missing unit; 'yes' accepts the stated full order and closes the loop", () => {
    const r = rig();
    r.team.command("midazolam 2");
    r.run(3);
    expect(r.last("sedation")!.text).toBe("Is that 2 milligrams of midazolam IV?");
    r.team.command("yes");
    r.run(25);
    expect(r.events.find((e) => e.kind === "drug.given")?.data).toMatchObject({ drug: "midazolam", dose: 2 });
    expect(r.team.report().acknowledged).toBe(1);
  });

  it("queries a dose a decimal slip away, and a unit that does not fit the drug", () => {
    const r = rig();
    r.team.command("midazolam 20 mg");
    r.run(3);
    expect(r.last("sedation")!.text).toMatch(/^That's a big dose\. Can you confirm 20 milligrams of midazolam IV\?$/);
    r.team.command("no");
    r.run(20);
    expect(r.events.find((e) => e.kind === "drug.given")).toBeUndefined();
    r.team.command("heparin 5 mg IV");
    r.run(3);
    expect(r.last("scrub")!.text).toBe("Heparin is in units. How many units?");
  });

  it("a misheard read-back: caught when rejected, a safety finding when confirmed", () => {
    const r = rig({ params: { mishearP: 1 } });
    r.team.command("atropine 0.6 mg IV");
    r.run(3);
    expect(r.last("sedation")!.text).toBe("6 milligrams of atropine IV.");
    r.team.command("no");
    r.run(30);
    expect(r.events.find((e) => e.kind === "drug.given")).toBeUndefined();
    let rep = r.team.report();
    expect(rep.misheardCaught).toBe(1);

    const r2 = rig({ params: { mishearP: 1 } });
    r2.team.command("atropine 0.6 mg IV");
    r2.run(3);
    r2.team.command("correct");
    r2.run(30);
    expect(r2.events.find((e) => e.kind === "drug.given")?.data).toMatchObject({ drug: "atropine", dose: 6 });
    rep = r2.team.report();
    expect(rep.misheardMissed).toBe(1);
    expect(rep.findings.some((f) => f.severity === "safety" && f.code === "misheard-confirmed")).toBe(true);
  });

  it("an unrecognised command gets 'say again', and 'cancel that' stops a pending order", () => {
    const r = rig();
    r.team.command("sing me a song");
    r.run(3);
    expect(r.last("scrub")!.text).toBe("Sorry, say again?");
    r.team.command("heparin 5000 units IV");
    r.run(3);
    r.team.command("cancel that");
    r.run(30);
    expect(r.events.find((e) => e.kind === "drug.given")).toBeUndefined();
    expect(r.last("scrub")!.text).toBe("Cancelled.");
  });

  it("the ACT result comes when the sample has clotted, and matches the engine", () => {
    const r = rig();
    r.team.command("heparin 100 units per kilo IV");
    r.run(3);
    r.team.command("correct");
    r.run(600);
    r.team.command("ACT please");
    const t0 = r.team.t;
    r.run(2);
    r.run(400);
    const res = r.said.find((u) => /^ACT is \d+\.$/.test(u.text));
    expect(res).toBeTruthy();
    const act = Number(res!.text.match(/\d+/)![0]);
    const measured = r.events.find((e) => e.kind === "act.measured")!.data!.act as number;
    expect(act).toBe(measured);
    expect(act).toBeGreaterThan(200);
    // read-back + sample time + the clotting time itself
    expect(res!.t - t0).toBeGreaterThan(act + 20);
    expect(res!.t - t0).toBeLessThan(act + 35);
  });
});

// ---------------------------------------------------------------------------
describe("equipment and label checks", () => {
  it("a wrong item is caught by a label check and replaced", () => {
    const r = rig({ params: { wrongItemP: 1 } });
    r.team.command("6 French JL4");
    r.run(40);
    expect(r.last("scrub")!.text).toBe("6 French JL4 open on the table.");
    const item = r.team.st.items[0];
    expect(item.actual.name).not.toBe("JL4");
    r.team.command("check the label");
    r.run(2.5);
    expect(r.last("scrub")!.text).toMatch(/^Label reads 6 French JL(3\.5|4\.5)\. Sorry, that's the wrong one\. I'll get the 6 French JL4\.$/);
    r.run(45);
    const fresh = r.team.st.items[1];
    expect(fresh.actual.name).toBe("JL4");
    expect(r.team.itemUsed(fresh.id)?.name).toBe("JL4");
    const rep = r.team.report();
    expect(rep.wrongItems).toBe(1);
    expect(rep.wrongItemsCaught).toBe(1);
    expect(rep.wrongItemsUsedUnchecked).toBe(0);
  });

  it("a wrong item used without a label check is a safety finding", () => {
    const r = rig({ params: { wrongItemP: 1 } });
    r.team.command("3.0 by 15 non-compliant balloon");
    r.run(40);
    const used = r.team.itemUsed(r.team.st.items[0].id)!;
    expect(used.diameterMm).not.toBe(3);
    const rep = r.team.report();
    expect(rep.wrongItemsUsedUnchecked).toBe(1);
    expect(rep.findings.some((f) => f.code === "wrong-item-used")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
describe("radiographer and the S8 input bus", () => {
  it("drives a CArmDrive-like port to the view and releases the drive on arrival", () => {
    let a: CArm = { laoRao: 0, cranialCaudal: 0 };
    let target: CArm | null = null;
    const port: CArmPort & { step(dt: number): void } = {
      get angles() {
        return a;
      },
      driveTo(t) {
        target = t;
      },
      step(dt) {
        if (!target) return;
        const mv = (x: number, y: number) => x + Math.sign(y - x) * Math.min(Math.abs(y - x), 15 * dt);
        a = { laoRao: mv(a.laoRao, target.laoRao), cranialCaudal: mv(a.cranialCaudal, target.cranialCaudal) };
      },
    };
    const r = rig({ carm: port, withEngine: false });
    r.team.command("LAO 30 cranial 20");
    for (let k = 0; k < 300; k++) {
      port.step(1 / 30);
      r.run(1 / 30);
    }
    expect(r.last("radiographer")!.text).toBe("LAO 30, cranial 20.");
    expect(a).toEqual({ laoRao: 30, cranialCaudal: 20 });
    expect(target).toBeNull();
    const arrived = r.team.st.events.length; // events still pending in the buffer
    expect(arrived).toBeGreaterThan(0);
    const o = r.team.st.orders[0];
    expect(o.status).toBe("done");
    // travel takes real time: 30 degrees at 15 deg/s
    expect(o.doneAt! - o.readbackAt!).toBeGreaterThan(1.8);
  });

  it("without a drive, requests C-arm velocity on the input bus and stops it on arrival", () => {
    const input = createInputSystem({ storage: null, now: () => 0 });
    let a: CArm = { laoRao: 0, cranialCaudal: 0 };
    let v = { laoDegPerS: 0, cranDegPerS: 0 };
    input.bus.on("carm", (x) => (v = x));
    const port: CArmPort = {
      get angles() {
        return a;
      },
    };
    const r = rig({ carm: port, input, withEngine: false });
    r.team.command("RAO 30 caudal 25");
    for (let k = 0; k < 600; k++) {
      a = { laoRao: a.laoRao + v.laoDegPerS / 30, cranialCaudal: a.cranialCaudal + v.cranDegPerS / 30 };
      r.run(1 / 30);
    }
    expect(Math.abs(a.laoRao + 30)).toBeLessThan(0.6);
    expect(Math.abs(a.cranialCaudal + 25)).toBeLessThan(0.6);
    expect(v).toEqual({ laoDegPerS: 0, cranDegPerS: 0 });
  });

  it("holds the wire through the input system's pin and lets go on 'I have the wire'", () => {
    const input = createInputSystem({ storage: null, now: () => 0, present: ["sheath", "catheter", "wire014", "balloon"] });
    const pins: boolean[] = [];
    input.bus.on("hand", (c) => {
      if (c.kind === "pin") pins.push(c.on);
    });
    const r = rig({ input, withEngine: false });
    r.team.command("hold the wire");
    r.run(2);
    expect(input.view().left.pinnedDevice).toBe("wire014");
    r.team.command("I have the wire");
    r.run(2);
    expect(input.view().left.pinnedDevice).toBeNull();
    expect(pins).toEqual([true, false]);
    expect(r.texts("scrub")).toEqual(["I've got the wire.", "Your wire."]);
  });

  it("announces five minutes of screening and resets the timer", () => {
    const r = rig({ withEngine: false });
    const actions: string[] = [];
    r.team.bus.on("action", (x) => actions.push(x.a));
    r.team.onTelemetry([{ tWall: 0, tPatient: 0, kind: "dose.fluoro-5min", data: { fluoroMin: 5 } }]);
    r.run(5);
    expect(r.last("radiographer")!.text).toBe("5 minutes screening.");
    expect(actions).toContain("timer-reset");
  });
});

// ---------------------------------------------------------------------------
describe("physiologist and sedation callouts from the S9 engine", () => {
  it("calls VF from the alarm and runs charge, clear and shock through the engine", () => {
    const r = rig();
    r.eng!.forceRhythm("vf");
    r.run(4);
    expect(r.texts("physiologist")).toContain("VF!");
    r.team.command("charge to 200");
    r.run(8);
    expect(r.texts("sedation")).toEqual(expect.arrayContaining(["Charging to 200.", "Charged."]));
    r.team.command("stand clear");
    r.run(2);
    r.team.command("shock");
    r.run(3);
    const shock = r.events.find((e) => e.kind === "defib.shock");
    expect(shock?.data).toMatchObject({ joules: 200, cleared: true });
    expect(r.events.some((e) => e.kind === "safety.shock-without-clear")).toBe(false);
  });

  it("calls a damped trace after it persists", () => {
    const r = rig();
    r.eng!.setTip({ location: "ostium", side: "left", gap: 0.13 });
    r.run(6);
    const t = r.texts("physiologist").join(" ");
    expect(t).toMatch(/Pressure's damped\.|That's ventricularised\./);
  });

  it("answers 'what's the pressure' from the displayed trace", () => {
    const r = rig();
    r.team.command("what's the pressure?");
    r.run(3);
    const v = r.eng!.vitals();
    expect(r.last("physiologist")!.text).toMatch(/^\d+ over \d+, mean \d+\.$/);
    const sys = Number(r.last("physiologist")!.text.match(/^\d+/)![0]);
    expect(Math.abs(sys - v.art!.sys)).toBeLessThan(8);
  });

  it("zeroes the transducer through the engine", () => {
    const e = new PatientEngine({ profile: healthy(5), lesions: [] });
    e.setTip({ location: "aorta" });
    e.advance(3);
    expect(e.transducer.st.zeroed).toBe(false);
    const r = rig({ eng: e });
    r.team.command("zero please");
    r.run(6);
    expect(e.transducer.st.zeroed).toBe(true);
    expect(r.texts("physiologist")).toEqual(["Zeroing.", "Zeroed."]);
  });
});

// ---------------------------------------------------------------------------
describe("the conscious patient", () => {
  it("holds the breath on request (the engine's clock), and lets go when told", () => {
    const r = rig();
    r.team.command("breathe in and hold");
    r.run(2);
    expect(r.eng!.clockState().breathHold).toBe(true);
    r.team.command("breathe away");
    r.run(1.5);
    expect(r.eng!.clockState().breathHold).toBe(false);
  });

  it("lets go of a held breath by itself after the model maximum", () => {
    const r = rig();
    r.team.command("deep breath in and hold");
    r.run(25);
    expect(r.eng!.clockState().breathHold).toBe(false);
    expect(r.texts("patient").some((x) => /couldn't hold it|had to breathe/.test(x))).toBe(true);
  });

  it("feels warmth with a large root injection; the words depend on the warning", () => {
    const unwarned = rig({ params: { warmthP: 1 } });
    unwarned.eng!.contrast(30, "lv");
    unwarned.team.onTelemetry(unwarned.eng!.drainEvents());
    unwarned.run(4);
    expect(unwarned.texts("patient").join(" ")).toMatch(/hot/);
    expect(unwarned.team.report().warnable).toMatchObject([{ event: "contrast-warmth", warned: false }]);

    const warned = rig({ params: { warmthP: 1 } });
    warned.team.command("you'll feel a warm flush");
    warned.run(3);
    warned.eng!.contrast(30, "lv");
    warned.team.onTelemetry(warned.eng!.drainEvents());
    warned.run(4);
    expect(warned.texts("patient").join(" ")).toMatch(/warmth|warm|flush/);
    expect(warned.team.report().warnable).toMatchObject([{ event: "contrast-warmth", warned: true }]);
  });

  it("complains of chest pain during an LAD occlusion, rates it on request, and says when it eases", () => {
    const r = rig();
    r.team.command("you may feel some chest tightness");
    r.run(2);
    r.eng!.setOcclusion("balloon", { vessel: "LAD", param: 0.1, fraction: 1 });
    r.eng!.stimulus("balloon", 0.3);
    r.run(40);
    const pain = r.eng!.vitals().symptoms.chestPain;
    expect(pain).toBeGreaterThan(3);
    expect(r.texts("patient").some((x) => /tight|chest|pain|bad/.test(x))).toBe(true);
    r.team.command("any chest pain?");
    r.run(4);
    expect(r.last("patient")!.text).toMatch(/^Yes, about \d+ out of 10\.$/);
    r.eng!.clearOcclusion("balloon");
    r.run(120);
    expect(r.texts("patient").some((x) => /easing|going|better/.test(x))).toBe(true);
    expect(r.team.report().warnable[0]).toMatchObject({ event: "inflation", warned: true });
  });

  it("adenosine without a warning is scored; with a warning it is not", () => {
    const r = rig();
    r.eng!.give({ drug: "adenosine", dose: 200, route: "ic", side: "left" });
    r.run(10);
    let rep = r.team.report();
    expect(rep.warnable).toMatchObject([{ event: "adenosine", warned: false }]);
    expect(rep.findings.some((f) => f.code === "unwarned-adenosine")).toBe(true);
    const r2 = rig();
    r2.team.command("you may feel your chest go tight and a hot flush");
    r2.run(3);
    r2.eng!.give({ drug: "adenosine", dose: 200, route: "ic", side: "left" });
    r2.run(10);
    rep = r2.team.report();
    expect(rep.warnable).toMatchObject([{ event: "adenosine", warned: true }]);
  });

  it("speaks at puncture and with the radial cocktail, and stays silent when unconscious", () => {
    const r = rig();
    r.eng!.stimulus("puncture", 0.8);
    r.eng!.stimulus("cocktail", 0.6);
    r.run(6);
    const t = r.texts("patient").join(" ");
    expect(t).toMatch(/Ow/);
    expect(t).toMatch(/burn/);
    r.eng!.forceRhythm("vf");
    r.run(5);
    const n = r.texts("patient").length;
    r.team.command("how are you feeling?");
    r.run(4);
    expect(r.texts("patient").length).toBe(n);
  });
});

// ---------------------------------------------------------------------------
describe("determinism and the debrief", () => {
  it("snapshot and restore replay the team exactly", () => {
    const P = { wrongItemP: 0.5, mishearP: 0.3 };
    const a = rig({ params: P, withEngine: false });
    a.team.command("Heparin 5,000 units IV");
    a.run(2);
    a.team.command("6 French JL4");
    a.run(1);
    const snap = a.team.snapshot();
    const n0 = a.said.length;
    const cont = (r: Rig) => {
      r.team.command("3.0 by 15 balloon");
      r.run(3);
      r.team.command("atropine 600 micrograms IV");
      r.run(3);
      r.team.command("correct");
      r.run(60, 1 / 20);
    };
    cont(a);
    const tailA = a.said.slice(n0).map((u) => `${u.t.toFixed(4)} ${u.speaker} ${u.text}`);
    const b = rig({ params: P, withEngine: false });
    b.team.restore(snap);
    cont(b);
    const tailB = b.said.map((u) => `${u.t.toFixed(4)} ${u.speaker} ${u.text}`);
    expect(tailA.length).toBeGreaterThan(6);
    expect(tailB).toEqual(tailA);
    expect(JSON.stringify(b.team.snapshot().orders)).toBe(JSON.stringify(a.team.snapshot().orders));
  });

  it("the communication report counts named orders, complete orders, closed loops and warnings", () => {
    const r = rig();
    r.team.command("Nurse, heparin 5,000 units IV");
    r.run(3);
    r.team.command("correct");
    r.run(2);
    r.team.command("midazolam 2");
    r.run(3);
    r.team.command("yes");
    r.run(2);
    r.team.command("radiographer, LAO 30 cranial 20");
    r.run(3);
    r.team.command("sharp scratch");
    r.eng!.stimulus("puncture", 0.6);
    r.run(30);
    const rep = r.team.report();
    expect(rep.orders).toBe(3);
    expect(rep.directed).toBe(2);
    expect(rep.drugOrders).toBe(2);
    expect(rep.completeDrugOrders).toBe(1);
    expect(rep.acknowledged).toBe(2);
    expect(rep.closedLoops).toBe(1);
    expect(rep.warned).toBe(1);
    expect(rep.lines[0]).toBe("Orders that named the team member: 2 of 3.");
    const tele = r.team.drainEvents();
    expect(tele.some((e) => e.kind === "team.ack")).toBe(true);
    expect(tele.every((e) => typeof e.tWall === "number" && typeof e.tPatient === "number")).toBe(true);
  });

  it("costs little per frame", () => {
    const r = rig();
    r.team.command("Heparin 5,000 units IV");
    const n = 600;
    const t0 = performance.now();
    for (let k = 0; k < n; k++) r.team.advance(1 / 60);
    const ms = (performance.now() - t0) / n;
    // eslint-disable-next-line no-console
    console.log(`[C4] Team.advance per 60 Hz frame: ${(ms * 1000).toFixed(1)} µs`);
    expect(ms).toBeLessThan(0.5);
  });
});
