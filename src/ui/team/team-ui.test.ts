import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { Team } from "../../simulation/team/team";
import { parseCommand } from "../../simulation/team/intents";
import { AudioEngine } from "../../audio/engine";
import Captions from "./Captions";
import CommandPalette, { suggestions } from "./CommandPalette";
import TeamButtons, { QUICK } from "./TeamButtons";
import AudioMixer from "./AudioMixer";
import { describeCommand } from "./describe";

function team() {
  const t = new Team({ seed: 2, startClock: new Date(2026, 9, 5, 10, 30), patient: null, params: { mishearP: 0, wrongItemP: 0 } });
  t.command("Nurse, heparin 5,000 units IV");
  for (let k = 0; k < 120; k++) t.advance(1 / 30);
  return t;
}

/** Tailwind text sizes below 12 px in the markup. */
function smallText(html: string): string[] {
  return (html.match(/text-\[(\d+(?:\.\d+)?)px\]/g) ?? []).filter((m) => Number(m.match(/[\d.]+/)![0]) < 12);
}

describe("team UI (server render)", () => {
  it("captions show speaker, time of day, the read-back mark, and confirmation buttons", () => {
    const t = team();
    const html = renderToString(createElement(Captions, { team: t }));
    expect(html).toContain("Scrub nurse");
    expect(html).toContain("5,000 units of heparin IV.");
    expect(html).toContain("10:30");
    expect(html).toContain("read-back");
    expect(html).toMatch(/>Correct</);
    expect(smallText(html)).toEqual([]);
    expect(html).not.toMatch(/gradient|glow/);
  });

  it("the palette renders open with suggestions, and every quick button parses", () => {
    const t = team();
    const html = renderToString(createElement(CommandPalette, { team: t, open: true }));
    expect(html).toContain("Say something to the team or the patient");
    expect(html).toContain("Heparin 5,000 units IV");
    expect(smallText(html)).toEqual([]);
    for (const g of QUICK) for (const it of g.items) expect(parseCommand(it.say).intent.k, it.say).not.toBe("unknown");
    const b = renderToString(createElement(TeamButtons, { team: t }));
    expect(b).toContain("Radiographer");
  });

  it("suggestions match every typed word, and the preview names who acts", () => {
    expect(suggestions("lao").map((s) => s.text)).toContain("LAO 30 cranial 20");
    expect(suggestions("hep kilo").map((s) => s.text)).toEqual(["Heparin 70 units per kilo"]);
    expect(describeCommand(parseCommand("give 2 mg midazolam"))).toEqual({ who: "Sedation nurse", what: "midazolam, 2 milligrams, route not stated", ok: true });
    expect(describeCommand(parseCommand("LAO 30 cranial 20")).what).toBe("C-arm to LAO 30, cranial 20");
    expect(describeCommand(parseCommand("breathe in and hold")).who).toBe("Patient");
    expect(describeCommand(parseCommand("blah")).ok).toBe(false);
  });

  it("the sound panel asks for a click before sound and lists every channel", () => {
    const eng = new AudioEngine({ createContext: () => ({}) as AudioContext, storage: null });
    const html = renderToString(createElement(AudioMixer, { engine: eng }));
    for (const l of ["Master", "Monitor tone", "Alarms", "X-ray", "Devices", "Voices", "ECG R wave", "Finger pulse"]) expect(html).toContain(l);
    expect(html).toContain("Turn sound on");
    expect(smallText(html)).toEqual([]);
  });
});
