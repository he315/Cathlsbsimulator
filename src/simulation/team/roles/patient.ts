// ---------------------------------------------------------------------------
// The conscious patient.
//
// Perception scope: sensations only. Everything the patient says comes from
// the S9 engine: vitals().symptoms (chest pain 0-10, nausea, dyspnoea,
// flushing, itch, anxiety, drowsiness, conscious level) sampled every
// patientSampleS, and the engine's telemetry (patient.stimulus for puncture,
// sheath, radial spasm and the radial cocktail; patient.vagal;
// patient.contrast-reaction; contrast.delivered; drug.given). The patient
// never reports anything the engine has not produced, and stops talking as
// the conscious level falls.
//
// Warnings change the words, not the physiology: a patient told "you'll feel
// a warm flush" says so calmly; an unwarned patient is startled. Whether each
// warnable event was warned is scored for the debrief.
// ---------------------------------------------------------------------------

import type { TelemetryEvent } from "../../session/types";
import type { TeamCore, WarnableEvent } from "../agent";
import type { TeamIntent, WarnTopic } from "../types";

const VALID_TOPICS: Record<WarnableEvent["event"], WarnTopic[]> = {
  adenosine: ["chest", "warmth", "general"],
  inflation: ["chest", "general"],
  "contrast-warmth": ["warmth", "general"],
  puncture: ["scratch", "general"],
  cocktail: ["burning", "scratch", "general"],
};

/** Was the patient warned of this kind of event within the window before it? */
function lastWarning(core: TeamCore, ev: WarnableEvent["event"]): { t: number; topic: WarnTopic } | null {
  const ok = VALID_TOPICS[ev];
  for (let i = core.st.warnings.length - 1; i >= 0; i--) {
    const w = core.st.warnings[i];
    if (core.t - w.t > core.P.warnWindowS) break;
    if (ok.includes(w.topic)) return w;
  }
  return null;
}

/** Record a warnable event and return whether it was warned. */
export function noteWarnable(core: TeamCore, event: WarnableEvent["event"]): boolean {
  const w = lastWarning(core, event);
  core.st.warnable.push({ t: core.t, event, warned: !!w, topic: w?.topic, warnedAt: w?.t });
  core.telemetry("team.warnable", { event, warned: !!w });
  return !!w;
}

function canSpeak(core: TeamCore): boolean {
  const v = core.patient?.vitals();
  return !!v && v.hr !== null && v.symptoms.conscious >= core.P.consciousSpeak;
}

function drowsy(core: TeamCore): boolean {
  const v = core.patient?.vitals();
  return !!v && v.symptoms.drowsy > 0.5;
}

/** Say something on a topic unless the same topic was raised within the cooldown. */
function remark(core: TeamCore, topic: string, lines: string[], o: { cooldown?: number; urgent?: boolean; force?: boolean } = {}): boolean {
  const last = core.mem(`patient.topic.${topic}`, -1e9);
  if (!o.force && core.t - last < (o.cooldown ?? core.P.topicCooldownS)) return false;
  if (!canSpeak(core)) return false;
  core.setMem(`patient.topic.${topic}`, core.t);
  let text = core.pick(lines);
  if (drowsy(core)) text = text.replace(/[!.]+$/, "...").replace(/^(Ow|Ooh|Oh)[,!]? ?/, "Mm, ");
  core.say("patient", text, "patient", { to: "operator", urgent: o.urgent });
  core.telemetry("team.patient-said", { topic });
  return true;
}

export function patientTelemetry(core: TeamCore, ev: TelemetryEvent) {
  const d = ev.data ?? {};
  switch (ev.kind) {
    case "patient.stimulus": {
      const kind = String(d.kind);
      const mag = Number(d.magnitude ?? 0.5);
      if (kind === "puncture" || kind === "sheath") {
        const warned = noteWarnable(core, "puncture");
        if (mag < 0.2) return;
        remark(core, "puncture", warned ? ["Ooh, that's sharp.", "Mm, I felt that."] : ["Ow!", "Ow, what was that?"], { force: true });
      } else if (kind === "cocktail") {
        const warned = noteWarnable(core, "cocktail");
        // intra-arterial verapamil burns (fact C4-F8)
        remark(core, "cocktail", warned ? ["Ooh, that's burning up my arm, like you said.", "That stings a bit."] : ["Ow, my arm's burning!", "Ah, that really burns up my arm."], { force: true });
      } else if (kind === "radial-spasm" || kind === "catheter") {
        if (mag >= 0.3) remark(core, "arm", ["My arm really hurts.", "That's painful in my arm.", "Ooh, my wrist is sore."]);
      } else if (kind === "balloon") {
        noteWarnable(core, "inflation");
      }
      return;
    }
    case "patient.vagal":
      remark(core, "vagal", ["I feel a bit faint.", "I feel really sick and clammy.", "I don't feel well, I feel faint."], { force: true, urgent: true });
      return;
    case "patient.contrast-reaction":
      remark(core, "reaction", ["I've come up all itchy.", "My skin's itching all over.", "I feel itchy and hot."], { force: true });
      return;
    case "contrast.delivered": {
      const side = String(d.side);
      const ml = Number(d.ml ?? 0);
      if ((side === "lv" || side === "root") && ml >= core.P.warmthMinMl) {
        const warned = noteWarnable(core, "contrast-warmth");
        if (core.chance(core.P.warmthP)) {
          remark(
            core,
            "warmth",
            warned ? ["Yes, I can feel the warmth now.", "There's the hot flush you said about.", "Ooh, warm. That's what you said."] : ["Ooh, I've suddenly gone hot all over! Is that normal?", "Whoa, what's that? I'm really hot.", "I've gone all hot, what's happening?"],
            { force: true }
          );
        }
      }
      return;
    }
    case "drug.given":
      if (d.drug === "adenosine") {
        const warned = noteWarnable(core, "adenosine");
        core.setMem("patient.adenosineWarned", warned);
        core.setMem("patient.adenosineAt", core.t);
      }
      return;
    case "defib.shock":
      core.setMem("patient.wasArrested", true);
      return;
  }
}

/** The lab reports a balloon inflation without a stimulus event. */
export function noteInflation(core: TeamCore) {
  noteWarnable(core, "inflation");
}

/** Per sample: speak when a symptom crosses its threshold (with hysteresis and cooldowns). */
export function patientTick(core: TeamCore) {
  const p = core.patient;
  if (!p) return;
  const last = core.mem("patient.lastSample", -1e9);
  if (core.t - last < core.P.patientSampleS) return;
  core.setMem("patient.lastSample", core.t);
  const v = p.vitals();
  const s = v.symptoms;
  // after an arrest: the first words on waking
  if (core.mem("patient.wasArrested", false) && v.hr !== null && s.conscious >= 0.6) {
    core.setMem("patient.wasArrested", false);
    remark(core, "woke", ["What happened? Did I pass out?", "Where am I... what happened?"], { force: true });
    return;
  }
  // breath-hold: the patient lets go after a while, sooner when breathless
  if (core.mem("patient.holding", false)) {
    const since = core.mem("patient.holdSince", core.t);
    const max = s.dyspnoea > core.P.symptomSpeak ? core.P.breathHoldMaxBreathlessS : core.P.breathHoldMaxS;
    if (core.t - since > max || s.conscious < core.P.consciousSpeak) {
      core.setMem("patient.holding", false);
      p.holdBreath(null);
      core.telemetry("team.breath-release", { reason: "patient", heldS: core.t - since });
      remark(core, "gasp", ["(breathes out) Sorry, I couldn't hold it any longer.", "(gasps) I had to breathe."], { force: true });
    }
  }
  // chest pain, with hysteresis between the two levels
  const pain = s.chestPain;
  const band = core.mem("patient.painBand", 0);
  const [lo, hi] = core.P.painSpeak;
  // bands 0 (none), 1 (tight), 2 (bad); leaving band 2 needs a 1.5-point fall, leaving band 1 needs pain below painEased
  let newBand = band;
  if (pain >= hi) newBand = 2;
  else if (band === 2 && pain < hi - 1.5) newBand = pain < core.P.painEased ? 0 : 1;
  else if (band === 0 && pain >= lo) newBand = 1;
  else if (band === 1 && pain < core.P.painEased) newBand = 0;
  if (newBand > band) {
    const adenosine = core.t - core.mem("patient.adenosineAt", -1e9) < 40;
    const warned = adenosine ? core.mem("patient.adenosineWarned", false) : lastWarning(core, "inflation") !== null;
    if (newBand === 2) remark(core, "pain2", warned ? ["It's really tight now.", "That's getting quite bad, it's very tight."] : ["The pain's really bad now, my chest is so tight!", "It's crushing, it's really bad!"], { force: true, urgent: true });
    else remark(core, "pain1", warned ? ["I can feel the tightness, like you said.", "There's the chest tightness."] : ["My chest feels tight.", "I've got a pain in my chest.", "There's a pressure in my chest, is that normal?"], { force: true });
  } else if (newBand === 0 && band > 0) {
    remark(core, "pain0", ["That's easing off now.", "The pain's going.", "That's better."], { force: true });
  }
  core.setMem("patient.painBand", newBand);
  // other symptoms: once per crossing, then the topic cooldown
  const cross = (key: string, val: number, thr: number, lines: string[], cooldown?: number) => {
    const on = core.mem(`patient.${key}`, false);
    if (!on && val >= thr) {
      core.setMem(`patient.${key}`, true);
      remark(core, key, lines, { cooldown });
    } else if (on && val < thr * 0.6) core.setMem(`patient.${key}`, false);
  };
  cross("nausea", s.nausea, core.P.symptomSpeak, ["I feel sick.", "I think I'm going to be sick.", "I feel really nauseous."]);
  cross("dyspnoea", s.dyspnoea, core.P.symptomSpeak, ["I can't catch my breath.", "I'm struggling to breathe.", "I feel short of breath."]);
  cross("flushing", s.flushing, core.P.symptomSpeak, ["I feel really hot and flushed.", "My face has gone all hot."]);
  cross("itch", s.itch, core.P.itchSpeak, ["I'm itchy all over.", "My skin's itching."]);
  cross("anxiety", s.anxiety, core.P.anxietySpeak, ["Is everything all right?", "Is it going OK? I'm a bit scared.", "How much longer will it be?"], core.P.anxietyCooldownS);
}

/** Something the operator says to the patient. */
export function receivePatientIntent(core: TeamCore, i: TeamIntent) {
  const p = core.patient;
  const v = p?.vitals();
  const s = v?.symptoms;
  switch (i.k) {
    case "warn":
      core.st.warnings.push({ t: core.t, topic: i.topic });
      core.telemetry("team.warning", { topic: i.topic });
      if (canSpeak(core)) core.say("patient", core.pick(["OK.", "Right, OK.", "OK, thanks for telling me."]), "patient", { to: "operator" });
      return;
    case "breath": {
      if (i.action === "hold") {
        if (!p || !v || !s || s.conscious < core.P.consciousSpeak) return;
        // the patient takes a moment to breathe in and hold (model latency)
        core.schedule(core.t + core.rand(0.6, 1.2), "breath-hold", "patient", {});
      } else {
        core.schedule(core.t + core.rand(0.3, 0.8), "breath-release", "patient", {});
      }
      return;
    }
    case "ask": {
      if (!s || !canSpeak(core)) return;
      let text: string;
      if (i.topic === "pain") text = s.chestPain < 0.5 ? core.pick(["No, no pain.", "No pain, no."]) : `Yes, about ${Math.max(1, Math.round(s.chestPain))} out of 10.`;
      else if (i.topic === "breathing") text = s.dyspnoea >= core.P.symptomSpeak ? "I'm a bit short of breath." : "Breathing's fine.";
      else if (i.topic === "nausea") text = s.nausea >= core.P.symptomSpeak ? "Yes, I feel sick." : "No, I'm OK.";
      else {
        const worst: [number, string][] = [
          [s.chestPain / 10, "My chest is sore."],
          [s.nausea, "I feel a bit sick."],
          [s.dyspnoea, "I'm a bit breathless."],
          [s.itch, "I'm itchy."],
          [s.anxiety * 0.8, "A bit nervous, to be honest."],
        ];
        worst.sort((a, b) => b[0] - a[0]);
        text = worst[0][0] >= 0.3 ? worst[0][1] : core.pick(["I'm OK, thanks.", "Fine, thank you.", "I'm all right."]);
      }
      if (drowsy(core)) text = "Mm... " + text.charAt(0).toLowerCase() + text.slice(1);
      core.say("patient", text, "patient", { to: "operator" });
      core.telemetry("team.patient-asked", { topic: i.topic, chestPain: s.chestPain });
      return;
    }
    case "reassure":
      if (canSpeak(core) && s && s.anxiety > 0.4) core.say("patient", core.pick(["Thank you.", "OK, that's good."]), "patient", { to: "operator" });
      core.telemetry("team.reassured", {});
      return;
    case "keepStill":
      if (canSpeak(core)) core.say("patient", "OK.", "patient", { to: "operator" });
      return;
    default:
      return;
  }
}

export function installPatient(core: TeamCore) {
  core.handle("breath-hold", (c) => {
    const p = c.patient;
    if (!p) return;
    p.holdBreath(c.P.breathHoldLevel);
    c.setMem("patient.holding", true);
    c.setMem("patient.holdSince", c.t);
    c.telemetry("team.breath-hold", { level: c.P.breathHoldLevel });
  });
  core.handle("breath-release", (c) => {
    if (!c.mem("patient.holding", false)) return;
    c.patient?.holdBreath(null);
    c.setMem("patient.holding", false);
    c.telemetry("team.breath-release", { reason: "operator" });
  });
}
