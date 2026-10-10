import { describe, expect, it } from "vitest";
import { PatientEngine } from "../simulation/patient/engine";
import { generatePatient, type PatientProfile } from "../simulation/patient/patient";
import { ANGIOCAD_SEGMENTS } from "../simulation/patient/angiocadPriors";
import { SeededRng } from "../simulation/patient/rng";
import { createInputSystem } from "../input/system";
import { Team } from "../simulation/team/team";
import { AudioEngine, channelGain, DEFAULT_AUDIO, AUDIO_STORAGE_KEY, loadAudioSettings } from "./engine";
import { LabAudio } from "./labAudio";
import { spo2ToHz, PULSE_TONE } from "./monitorTone";
import { AlarmPlayer, ALARM_REPEAT_S } from "./alarms";
import { ALARM_PATTERNS, burstOnsets, IndeflatorSound } from "./sounds";
import { TeamVoices, localVoices, speakable } from "./speech";
import { FakeAudioContext, FakeParam } from "./testing";

function profile(seed: number, rhythm: "sinus" | "af" = "sinus"): PatientProfile {
  const p = generatePatient(seed, { indication: "SA" });
  const grades = { ...p.angiocad.grades };
  for (const s of ANGIOCAD_SEGMENTS) grades[s] = 0;
  return { ...p, angiocad: { ...p.angiocad, grades }, culprit: null, baseline: { ...p.baseline, rhythm } };
}

async function rig(seed = 11, rhythm: "sinus" | "af" = "sinus") {
  const ctx = new FakeAudioContext();
  const audio = new AudioEngine({ createContext: () => ctx.asAudioContext(), storage: null });
  await audio.unlock();
  const eng = new PatientEngine({ profile: profile(seed, rhythm), lesions: [] });
  eng.setTip({ location: "aorta" });
  eng.transducer.zero();
  eng.advance(6);
  eng.drainEvents();
  eng.drainBeats();
  const lab = new LabAudio(audio, { voices: null });
  lab.setPatient(eng);
  return { ctx, audio, eng, lab };
}

/** Run frames with jittered wall time; returns the R waves and the (patient, audio) clock pairs per frame. */
function runFrames(r: Awaited<ReturnType<typeof rig>>, seconds: number, seed = 5) {
  const rng = new SeededRng(seed);
  const pairs: [number, number][] = [[r.eng.clockState().t, r.ctx.currentTime]];
  const beats: number[] = [];
  let T = 0;
  while (T < seconds) {
    const dt = 1 / 60 + rng.range(-0.004, 0.004);
    T += dt;
    r.ctx.advance(dt);
    r.eng.advance(dt);
    for (const b of r.eng.drainBeats()) beats.push(b.t);
    r.lab.onTelemetry(r.eng.drainEvents());
    pairs.push([r.eng.clockState().t, r.ctx.currentTime]);
    r.lab.frame();
  }
  return { pairs, beats };
}

/** Audio time at which the patient clock passed tP (interpolated between frames). */
function audioAt(pairs: [number, number][], tP: number): number {
  for (let i = 1; i < pairs.length; i++) {
    const [t0, a0] = pairs[i - 1];
    const [t1, a1] = pairs[i];
    if (tP > t0 && tP <= t1) return a0 + ((tP - t0) * (a1 - a0)) / (t1 - t0);
  }
  return NaN;
}

// ---------------------------------------------------------------------------
describe("audio engine", () => {
  it("creates nothing until unlocked from a gesture, then runs with five channel buses", async () => {
    const ctx = new FakeAudioContext();
    let made = 0;
    const a = new AudioEngine({
      createContext: () => {
        made++;
        return ctx.asAudioContext();
      },
      storage: null,
    });
    expect(made).toBe(0);
    expect(a.ready).toBe(false);
    expect(a.bus("monitor")).toBeNull();
    expect(await a.unlock()).toBe(true);
    expect(made).toBe(1);
    expect(a.ready).toBe(true);
    for (const c of ["monitor", "alarms", "xray", "devices", "voices"] as const) expect(a.bus(c)).not.toBeNull();
    await a.unlock();
    expect(made).toBe(1);
  });

  it("applies master and per-channel volume and mute, and persists them (a throwing store is ignored)", async () => {
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    const ctx = new FakeAudioContext();
    const a = new AudioEngine({ createContext: () => ctx.asAudioContext(), storage });
    await a.unlock();
    a.setChannel("alarms", { volume: 0.5 });
    a.setMaster(0.8);
    const g = a.bus("alarms") as unknown as { gain: FakeParam };
    expect(g.gain.valueAt(ctx.currentTime + 1)).toBeCloseTo(0.8 * 0.8 * 0.5 * 0.5, 4);
    a.setChannel("alarms", { muted: true });
    expect(g.gain.valueAt(ctx.currentTime + 1)).toBeCloseTo(0, 6);
    a.setMuted(true);
    expect(channelGain(a.getSettings(), "monitor")).toBe(0);
    const saved = JSON.parse(store.get(AUDIO_STORAGE_KEY)!);
    expect(saved.channels.alarms).toEqual({ volume: 0.5, muted: true });
    expect(loadAudioSettings(storage).master).toBeCloseTo(0.8);
    const bad = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(loadAudioSettings(bad)).toEqual(DEFAULT_AUDIO);
    const b = new AudioEngine({ createContext: () => new FakeAudioContext().asAudioContext(), storage: bad });
    expect(() => b.setMaster(0.3)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
describe("pulse tone", () => {
  it("pitch rises with SpO2 on a log scale and stays inside the measured device envelope", () => {
    expect(spo2ToHz(100)).toBeCloseTo(880, 6);
    expect(spo2ToHz(100)).toBeGreaterThanOrEqual(479);
    expect(spo2ToHz(100)).toBeLessThanOrEqual(921);
    expect(spo2ToHz(1)).toBeGreaterThanOrEqual(38);
    expect(spo2ToHz(1)).toBeLessThanOrEqual(404);
    for (let s = 2; s <= 100; s++) expect(spo2ToHz(s)).toBeGreaterThan(spo2ToHz(s - 1));
    expect(spo2ToHz(90) / spo2ToHz(91)).toBeCloseTo(1 / PULSE_TONE.ratioPerPoint, 6);
    expect(spo2ToHz(null)).toBe(PULSE_TONE.hzNoSpo2);
  });

  for (const rhythm of ["sinus", "af"] as const) {
    it(`each ${rhythm} R wave gets exactly one beep, within 20 ms of the R wave on the audio clock (60 s, jittered frames)`, async () => {
      const r = await rig(rhythm === "af" ? 23 : 11, rhythm);
      const { pairs, beats } = runFrames(r, 60);
      const log = r.lab.pulse.log;
      expect(beats.length).toBeGreaterThan(40);
      let worst = 0;
      let matched = 0;
      for (const tR of beats) {
        const aR = audioAt(pairs, tR);
        if (!Number.isFinite(aR)) continue;
        const hits = log.filter((l) => Math.abs(l.tR - tR) < 1e-6);
        expect(hits.length, `beat at ${tR.toFixed(3)}`).toBe(1);
        worst = Math.max(worst, Math.abs(hits[0].audioT - aR));
        matched++;
      }
      // eslint-disable-next-line no-console
      console.log(`[C4] ${rhythm}: ${matched} R waves, worst beep-to-R-wave offset ${(worst * 1000).toFixed(2)} ms, late beeps ${log.filter((l) => l.late).length}`);
      expect(matched).toBe(beats.length);
      expect(worst).toBeLessThan(0.02);
      // every beep is an oscillator started at its logged time, pitched from the displayed SpO2
      const oscStarts = r.ctx.oscillators().map((o) => o.startT);
      for (const l of log.slice(-10)) expect(oscStarts).toContain(l.audioT);
      expect(log[log.length - 1].hz).toBeCloseTo(spo2ToHz(r.eng.vitals().spo2), 6);
    });
  }

  it("stops beeping in VF and does not sound a predicted beat that never came", async () => {
    const r = await rig();
    runFrames(r, 5);
    r.eng.forceRhythm("vf");
    const nBefore = r.lab.pulse.log.length;
    const { beats } = runFrames(r, 6, 9);
    expect(beats.length).toBe(0);
    // at most the one beat predicted inside the look-ahead before VF began, and it was cancelled unless already due
    expect(r.lab.pulse.log.length - nBefore).toBe(0);
  });

  it("the pleth source beeps after the R wave by the pulse transit time", async () => {
    const r = await rig();
    r.lab.pulse.source = "pleth";
    const { pairs, beats } = runFrames(r, 20);
    let worst = 0;
    for (const tR of beats.slice(2)) {
      if (!Number.isFinite(audioAt(pairs, tR + PULSE_TONE.plethDelayS))) continue;
      const hit = r.lab.pulse.log.find((l) => Math.abs(l.tR - tR) < 1e-6);
      expect(hit).toBeTruthy();
      worst = Math.max(worst, Math.abs(hit!.audioT - audioAt(pairs, tR + PULSE_TONE.plethDelayS)));
    }
    expect(worst).toBeLessThan(0.02);
  });
});

// ---------------------------------------------------------------------------
describe("exposure tone through the S8 input bus", () => {
  it("sounds while a pedal is down and falls by more than 20 dB within one frame of release", async () => {
    const r = await rig();
    const input = createInputSystem({ storage: null, now: () => 0 });
    r.lab.attachInput(input.bus);
    r.ctx.advance(1);
    input.emit({ t: "pedal", pedal: "fluoro", on: true, source: "keyboard" });
    const g = r.lab.exposure.node.gain as unknown as { gain: FakeParam };
    expect(g).toBeTruthy();
    const on = g.gain.valueAt(r.ctx.currentTime + 0.1);
    expect(on).toBeGreaterThan(0.1);
    r.ctx.advance(0.5);
    const tRel = r.ctx.currentTime;
    input.emit({ t: "pedal", pedal: "fluoro", on: false, source: "keyboard" });
    // no frame has run: the release acted inside the input event
    const after = g.gain.valueAt(tRel + 1 / 60);
    expect(after / on).toBeLessThan(0.1);
    expect(g.gain.valueAt(tRel + 0.1)).toBeLessThan(1e-4);
  });

  it("cine uses a different pitch and clicks once per acquired frame", async () => {
    const r = await rig();
    const input = createInputSystem({ storage: null, now: () => 0 });
    r.lab.attachInput(input.bus);
    r.lab.setImaging({ cinePps: 15 });
    r.ctx.advance(1);
    const n0 = r.ctx.sources().length;
    input.emit({ t: "pedal", pedal: "cine", on: true, source: "keyboard" });
    const osc = r.lab.exposure.node.osc as unknown as { frequency: FakeParam };
    expect(osc.frequency.valueAt(r.ctx.currentTime + 0.2)).toBeCloseTo(1320, 0);
    for (let k = 0; k < 120; k++) {
      r.ctx.advance(1 / 60);
      r.lab.frame();
    }
    input.emit({ t: "pedal", pedal: "cine", on: false, source: "keyboard" });
    const clicks = r.ctx.sources().slice(n0).filter((s) => s.startT !== null && s.startT <= r.ctx.currentTime);
    // 2 s at 15 frames/s
    expect(clicks.length).toBeGreaterThanOrEqual(29);
    expect(clicks.length).toBeLessThanOrEqual(31);
  });

  it("five-minute signal starts on the dose event and the radiographer's reset stops it", async () => {
    const r = await rig();
    const team = new Team({ seed: 1, patient: null, params: { mishearP: 0 } });
    r.lab.attachTeam(team);
    const ev = { tWall: 0, tPatient: 0, kind: "dose.fluoro-5min", data: { fluoroMin: 5 } };
    r.lab.onTelemetry([ev]);
    team.onTelemetry([ev]);
    expect(r.lab.fiveMin.sounding).toBe(true);
    for (let k = 0; k < 300; k++) team.advance(1 / 60);
    expect(r.lab.fiveMin.sounding).toBe(false);
  });
});

// ---------------------------------------------------------------------------
describe("alarms by priority", () => {
  it("a high-priority burst is ten 50 ms pulses at 440 Hz in two blocks 190 ms apart, 1,110 ms long", () => {
    const on = burstOnsets("high");
    expect(on.length).toBe(10);
    expect(on[9] + ALARM_PATTERNS.high.pulseS).toBeCloseTo(1.11, 6);
    expect(on[5] - (on[4] + ALARM_PATTERNS.high.pulseS)).toBeCloseTo(0.19, 6);
    const med = burstOnsets("medium");
    expect(med.length).toBe(3);
    expect(med[2] + ALARM_PATTERNS.medium.pulseS).toBeCloseTo(0.595, 6);
  });

  it("plays the highest priority, repeats it, interrupts for a higher one, and stops when silenced", async () => {
    const r = await rig();
    const p = new AlarmPlayer(r.audio);
    let alarms: { id: string; level: "high" | "medium" | "low" }[] = [{ id: "hr-low", level: "medium" }];
    let silenced = -1;
    const step = (s: number) => {
      for (let k = 0; k < s * 60; k++) {
        r.ctx.advance(1 / 60);
        p.frame({ alarms, tPatient: r.ctx.currentTime, silencedUntil: silenced });
      }
    };
    step(10);
    const med = p.log.filter((l) => l.p === "medium");
    expect(med.length).toBe(2);
    expect(med[1].at - med[0].at).toBeCloseTo(ALARM_PATTERNS.medium.totalS + ALARM_REPEAT_S.medium!, 1);
    alarms = [{ id: "vf", level: "high" }, ...alarms];
    const tHigh = r.ctx.currentTime;
    step(0.1);
    const firstHigh = p.log.find((l) => l.p === "high")!;
    expect(firstHigh.at - tHigh).toBeLessThan(0.05);
    // pulses at 440 Hz with five equal harmonics
    const oscs = r.ctx.oscillators().filter((o) => o.startT !== null && Math.abs(o.startT - firstHigh.at) < 1.2);
    expect(oscs.some((o) => Math.abs(o.frequency.valueAt(o.startT! + 0.01) - 440) < 1e-6)).toBe(true);
    const w = (oscs.find((o) => o.wave)!.wave as { imag: number[] }).imag;
    expect(w.slice(1)).toEqual([1, 1, 1, 1, 1]);
    step(10);
    const n = p.log.length;
    silenced = r.ctx.currentTime + 120;
    step(10);
    expect(p.log.length).toBe(n);
  });

  it("follows the S9 engine's alarm list: VF raises a high-priority alarm", async () => {
    const r = await rig();
    r.eng.forceRhythm("vf");
    runFrames(r, 6);
    expect(r.lab.alarms.log.some((l) => l.p === "high")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
describe("devices and voices", () => {
  it("the inflation device clicks with the pressure rise (3 per atmosphere, model)", async () => {
    const r = await rig();
    const ind = new IndeflatorSound(r.audio);
    let clicks = 0;
    for (let k = 0; k <= 120; k++) {
      r.ctx.advance(1 / 60);
      clicks += ind.update((12 * k) / 120);
    }
    expect(clicks).toBeGreaterThanOrEqual(34);
    expect(clicks).toBeLessThanOrEqual(36);
    // holding pressure: no clicks
    let held = 0;
    for (let k = 0; k < 60; k++) {
      r.ctx.advance(1 / 60);
      held += ind.update(12);
    }
    expect(held).toBe(0);
  });

  it("speaks team lines only with local voices, spells out abbreviations, and drops stage directions", () => {
    const spoken: { text: string; voice: string; pitch: number; volume: number }[] = [];
    let cancelled = 0;
    class U {
      voice: SpeechSynthesisVoice | null = null;
      lang = "";
      pitch = 1;
      rate = 1;
      volume = 1;
      constructor(public text: string) {}
    }
    const voices = [
      { name: "Cloud", lang: "en-GB", localService: false },
      { name: "Daniel", lang: "en-GB", localService: true },
      { name: "Karen", lang: "en-AU", localService: true },
      { name: "Thomas", lang: "fr-FR", localService: true },
    ] as unknown as SpeechSynthesisVoice[];
    const synth = {
      getVoices: () => voices,
      speak: (u: U) => spoken.push({ text: u.text, voice: u.voice!.name, pitch: u.pitch, volume: u.volume }),
      cancel: () => cancelled++,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    } as unknown as SpeechSynthesis;
    expect(localVoices(voices).map((v) => v.name)).toEqual(["Daniel", "Karen", "Thomas"]);
    const tv = new TeamVoices(() => 0.8, () => null, () => "F", { synth, Utterance: U as unknown as typeof SpeechSynthesisUtterance });
    expect(tv.speak({ speaker: "scrub", text: "5,000 units of heparin IV." })).toBe(true);
    expect(tv.speak({ speaker: "patient", text: "(gasps) I had to breathe." })).toBe(true);
    expect(tv.speak({ speaker: "physiologist", text: "VF!", urgent: true })).toBe(true);
    expect(spoken[0]).toMatchObject({ text: "5,000 units of heparin I.V.", voice: "Daniel", volume: 0.8 });
    expect(spoken[1].text).toBe("I had to breathe.");
    expect(spoken.every((s) => s.voice !== "Cloud")).toBe(true);
    expect(cancelled).toBe(1);
    expect(speakable("LAO 30, cranial 20.")).toBe("L.A.O. 30, cranial 20.");
    const silent = new TeamVoices(() => 0, () => null, () => null, { synth, Utterance: U as unknown as typeof SpeechSynthesisUtterance });
    expect(silent.speak({ speaker: "scrub", text: "x" })).toBe(false);
  });

  it("costs little per frame (JavaScript side)", async () => {
    const r = await rig();
    runFrames(r, 2);
    const t0 = performance.now();
    const n = 600;
    for (let k = 0; k < n; k++) {
      r.ctx.advance(1 / 60);
      r.lab.frame();
    }
    const us = ((performance.now() - t0) / n) * 1000;
    // eslint-disable-next-line no-console
    console.log(`[C4] LabAudio.frame: ${us.toFixed(1)} µs per frame (fake context, Node)`);
    expect(us).toBeLessThan(500);
  });
});
