import type { WireType } from "../types";

export const WIRES: WireType[] = [
  {
    id: "J",
    name: "Standard J-tip wire",
    stiffness: "medium",
    tipShape: "J",
    safetyProfile: "safe",
    danger: 0.15,
    teachingTips: [
      "The J-tip is atraumatic and resists diving into branches or the LV — your default lead wire.",
      "Advance the catheter over the wire to the ascending aorta, then remove the wire before engaging.",
    ],
  },
  {
    id: "STRAIGHT",
    name: "Straight-tip wire",
    stiffness: "medium",
    tipShape: "straight",
    safetyProfile: "risky",
    danger: 0.55,
    teachingTips: [
      "A straight tip finds small branches and can cross the valve into the LV — use deliberately, not by default.",
      "Never advance a straight wire blindly through the arch or root.",
    ],
  },
  {
    id: "HYDRO",
    name: "Hydrophilic wire",
    stiffness: "soft",
    tipShape: "angled",
    safetyProfile: "moderate",
    danger: 0.45,
    teachingTips: [
      "Slippery and steerable through tortuosity — but it can dissect if forced and is hard to feel.",
      "Useful for tortuous iliac/subclavian; keep the tip in view at all times.",
    ],
  },
  {
    id: "WORKHORSE",
    name: "Workhorse coronary wire (0.014\")",
    stiffness: "soft",
    tipShape: "angled",
    safetyProfile: "moderate",
    danger: 0.3,
    teachingTips: [
      "For crossing coronary lesions once engaged — not for aortic navigation.",
    ],
  },
  {
    id: "SUPPORT",
    name: "Extra-support wire",
    stiffness: "stiff",
    tipShape: "J",
    safetyProfile: "moderate",
    danger: 0.35,
    teachingTips: [
      "Straightens tortuosity and delivers equipment, but a stiff wire can injure the aortic wall.",
    ],
  },
];

export const wireById = (id: string): WireType | undefined =>
  WIRES.find((w) => w.id === id);
