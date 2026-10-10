// Quick orders as buttons, grouped by who acts on them. A button sends the same words as typing them,
// so read-backs, questions and the communication score work the same way.

import type { Team } from "../../simulation/team/team";

export const QUICK: { group: string; items: { label: string; say: string }[] }[] = [
  {
    group: "Scrub nurse",
    items: [
      { label: "Heparin 70 U/kg", say: "Nurse, heparin 70 units per kilo IV" },
      { label: "GTN 200 µg IC", say: "Nurse, 200 micrograms GTN intracoronary" },
      { label: "Give it", say: "Give it" },
      { label: "ACT", say: "Nurse, ACT please" },
      { label: "Check label", say: "Check the label" },
      { label: "Hold the wire", say: "Nurse, hold the wire" },
      { label: "I have the wire", say: "I have the wire" },
    ],
  },
  {
    group: "Radiographer",
    items: [
      { label: "LAO 30 cranial 20", say: "Radiographer, LAO 30 cranial 20" },
      { label: "RAO 30 caudal 25", say: "Radiographer, RAO 30 caudal 25" },
      { label: "AP cranial 30", say: "Radiographer, AP cranial 30" },
      { label: "Fluoro 7.5", say: "Radiographer, fluoro 7.5 frames" },
      { label: "Reset timer", say: "Radiographer, reset the timer" },
    ],
  },
  {
    group: "Physiologist",
    items: [
      { label: "Zero", say: "Physiologist, zero please" },
      { label: "Record", say: "Physiologist, record" },
      { label: "12-lead", say: "Physiologist, 12-lead please" },
      { label: "Pressure?", say: "What's the pressure?" },
      { label: "Silence alarms", say: "Physiologist, silence the alarms" },
    ],
  },
  {
    group: "Sedation",
    items: [
      { label: "Midazolam 1 mg", say: "Sedation, midazolam 1 mg IV" },
      { label: "Fentanyl 25 µg", say: "Sedation, fentanyl 25 micrograms IV" },
      { label: "Atropine 600 µg", say: "Sedation, atropine 600 micrograms IV" },
      { label: "Pads on", say: "Pads on" },
      { label: "Charge 200", say: "Charge to 200" },
      { label: "Stand clear", say: "Stand clear" },
      { label: "Shock", say: "Shock" },
    ],
  },
  {
    group: "Patient",
    items: [
      { label: "Breathe in, hold", say: "Breathe in and hold" },
      { label: "Breathe away", say: "Breathe away" },
      { label: "Warn: warm flush", say: "You'll feel a warm flush" },
      { label: "Warn: chest tightness", say: "You may feel some chest tightness" },
      { label: "Any pain?", say: "Any chest pain?" },
    ],
  },
  {
    group: "Read-back",
    items: [
      { label: "Correct", say: "Correct" },
      { label: "No", say: "No" },
      { label: "Cancel that", say: "Cancel that" },
    ],
  },
];

export default function TeamButtons({ team, compact = false, onSent }: { team: Team; compact?: boolean; onSent?: () => void }) {
  return (
    <div className={`grid gap-2 ${compact ? "" : "sm:grid-cols-2"}`}>
      {QUICK.map((g) => (
        <div key={g.group} className="flex flex-wrap items-center gap-1.5">
          <span className="w-[92px] shrink-0 text-xs text-ink-faint">{g.group}</span>
          {g.items.map((it) => (
            <button
              key={it.label}
              type="button"
              className="btn px-2 py-0.5 text-xs"
              title={it.say}
              onClick={() => {
                team.command(it.say, "button");
                onSent?.();
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
