import type { MistakeCode, SectionId } from "../types";

export const DISCLAIMER =
  "This is a simplified educational simulation for training pattern recognition, spatial reasoning and procedural judgement. It is not a medical device and must not be used for patient care. Real angiography must be learned under direct expert supervision.";

export const SHORT_DISCLAIMER =
  "Educational simulation only — not a medical device. Learn real angiography under expert supervision.";

export const MASTERY_LABELS: { min: number; label: string; tone: string }[] = [
  { min: 0, label: "Unsafe beginner", tone: "danger" },
  { min: 35, label: "Needs direct supervision", tone: "danger" },
  { min: 50, label: "Basic safe simulator performance", tone: "warn" },
  { min: 62, label: "Developing operator", tone: "warn" },
  { min: 74, label: "Strong simulator operator", tone: "good" },
  { min: 85, label: "Advanced simulator operator", tone: "good" },
  { min: 93, label: "CathMaster simulator level", tone: "safe" },
];

export const masteryLabel = (score: number) =>
  [...MASTERY_LABELS].reverse().find((m) => score >= m.min) ?? MASTERY_LABELS[0];

// Human-readable descriptions of each mistake, plus the drill that fixes it.
export const MISTAKE_INFO: Record<
  MistakeCode,
  { label: string; explain: string; drillSection: SectionId; drill: string }
> = {
  "too-high": {
    label: "Tip too high",
    explain:
      "The catheter sat in the ascending aorta above the sinuses, so engagement was impossible.",
    drillSection: "pressure-trainer",
    drill: "Root-level trainer — find the sinus level",
  },
  "too-low": {
    label: "Tip too low",
    explain:
      "The tip dropped below the sinuses toward the valve plane, risking LV entry.",
    drillSection: "pressure-trainer",
    drill: "Root-level trainer — hold at the cusp",
  },
  "lv-entry": {
    label: "LV entry",
    explain:
      "The tip crossed the valve plane into the left ventricle. Withdraw to the root rather than pushing.",
    drillSection: "pressure-trainer",
    drill: "Recover-from-LV-entry drill",
  },
  "wrong-catheter": {
    label: "Wrong catheter for the root",
    explain:
      "The catheter curve did not match the root size, so the tip fell short of or crammed the ostium.",
    drillSection: "catheter-lab",
    drill: "Catheter–root matching quiz",
  },
  "too-much-pushing": {
    label: "Solving a level problem with forward pressure",
    explain:
      "Repeated advancing worsened the position. Level and alignment problems are solved by withdrawal and torque.",
    drillSection: "free",
    drill: "Torque-and-withdraw engagement drill",
  },
  "insufficient-withdrawal": {
    label: "Did not withdraw to reassess",
    explain:
      "When the position was wrong, withdrawing to the root and re-approaching would have been safer.",
    drillSection: "free",
    drill: "Withdraw-and-reassess drill",
  },
  "wrong-rotation": {
    label: "Rotated the wrong way",
    explain:
      "Torque moved the tip away from the ostium. Note which way the tip swings before committing.",
    drillSection: "free",
    drill: "Torque-direction drill",
  },
  "over-rotation": {
    label: "Over-rotation",
    explain:
      "Too much torque swung the tip past the ostium and built up whip. Use small, controlled turns.",
    drillSection: "free",
    drill: "Fine-torque control drill",
  },
  "non-coaxial": {
    label: "Non-coaxial engagement",
    explain:
      "The tip reached the ostium but pointed across it, giving poor opacification and reflux.",
    drillSection: "free",
    drill: "Coaxial alignment drill",
  },
  "deep-engagement": {
    label: "Deep engagement",
    explain:
      "The tip sat too deep in the vessel, obstructing flow — a damping and dissection risk.",
    drillSection: "pressure-trainer",
    drill: "Deep-engagement / damping drill",
  },
  "damped-injection": {
    label: "Injected while damped",
    explain:
      "Contrast was injected into a damped pressure — a safety-critical error. Withdraw first.",
    drillSection: "pressure-trainer",
    drill: "Pressure-before-injection drill",
  },
  "non-selective-injection": {
    label: "Non-selective injection",
    explain:
      "Contrast opacified the aortic root, not the coronary tree. Confirm selective engagement first.",
    drillSection: "free",
    drill: "Selective-engagement drill",
  },
  "poor-view": {
    label: "Poor view choice",
    explain:
      "The chosen projection foreshortened or overlapped the target segment.",
    drillSection: "view-trainer",
    drill: "Projection selection drill",
  },
  "vessel-misid": {
    label: "Vessel misidentification",
    explain: "A vessel was named incorrectly from the projection.",
    drillSection: "atlas",
    drill: "Coronary atlas identification quiz",
  },
  "excess-fluoro": {
    label: "Excessive fluoroscopy",
    explain:
      "Screening time was high. Fluoroscopy is radiation — use short, purposeful bursts.",
    drillSection: "challenge",
    drill: "Fluoro-efficiency challenge",
  },
  "excess-contrast": {
    label: "Excessive contrast",
    explain:
      "Too many or too-large injections were used. Confirm position before every injection.",
    drillSection: "challenge",
    drill: "Contrast-efficiency challenge",
  },
  "ignored-pressure-warning": {
    label: "Ignored a pressure warning",
    explain:
      "A damping or ventricularisation warning was shown before an injection and not acted on.",
    drillSection: "pressure-trainer",
    drill: "Pressure-recognition drill",
  },
  "catheter-changed-early": {
    label: "Changed catheter too early",
    explain:
      "The catheter was swapped before the current one had a fair attempt at seating.",
    drillSection: "free",
    drill: "Systematic engagement drill",
  },
  "catheter-changed-late": {
    label: "Changed catheter too late",
    explain:
      "Many failed attempts were made with the wrong tool before switching.",
    drillSection: "catheter-lab",
    drill: "Catheter-selection quiz",
  },
  "lv-injection": {
    label: "Injection in the LV",
    explain:
      "Contrast was injected below the valve plane into the LV — a serious safety error.",
    drillSection: "pressure-trainer",
    drill: "Valve-plane awareness drill",
  },
  dissection: {
    label: "Catheter-induced dissection",
    explain:
      "Sustained forward force against the ostium/wall (or an aggressive deep seat) tore the vessel. Never push a catheter that will not seat — withdraw and re-approach with torque.",
    drillSection: "pressure-trainer",
    drill: "Gentle-engagement & pressure drill",
  },
  "no-aspirate": {
    label: "Injected without aspirating",
    explain:
      "You injected without first aspirating to confirm free blood return. Always aspirate after seating — if nothing comes back, the tip is against the wall or deeply engaged.",
    drillSection: "pressure-trainer",
    drill: "Aspirate-before-inject drill",
  },
  "air-embolism": {
    label: "Air embolism",
    explain:
      "Injecting/flushing with the tip against the wall or deeply engaged (no blood return) drove air into the coronary. Aspirate to a clean return before every injection.",
    drillSection: "pressure-trainer",
    drill: "Aspirate-before-inject drill",
  },
  "vf-arrest": {
    label: "VF from conus/ostial injection",
    explain:
      "You injected into the conus branch (or a damped ostial position), provoking ventricular fibrillation. Recognise conus over-selection, back out, and never force contrast into a damped tip.",
    drillSection: "pressure-trainer",
    drill: "Conus-recognition & pressure drill",
  },
};

// Longer teaching notes keyed by topic id (used by Atlas / trainers).
export const TEACHING: Record<string, string> = {
  "root-level":
    "The aortic root is the short segment between the valve annulus and the sinotubular junction. The coronary ostia arise from the sinuses here. Above the sinotubular junction you are in the ascending aorta and cannot engage; below the valve plane you are heading into the left ventricle. Almost all beginner trouble comes from not knowing which of these three zones the tip is in.",
  coaxiality:
    "Coaxial means the catheter tip points down the barrel of the coronary, aligned with the vessel's take-off. A tip that touches the ostium but points across it gives a poor, refluxing injection and can dissect. Aim to align the tip with the vessel, not just to touch the ostium.",
  "lv-danger":
    "Below the aortic valve plane is the left ventricle. A catheter or wire that crosses the valve produces an LV pressure trace and, if injected, an LV ventriculogram — never a coronary picture. The correct response to LV entry is to withdraw to the root, not to push.",
  damping:
    "A damped trace has a low, blunted pulse pressure. It means the catheter tip is obstructing the ostium — either deeply engaged or pressed against the wall. Injecting into a damped vessel risks dissection. Withdraw slightly until the trace normalises before injecting.",
  ventricularisation:
    "Ventricularisation is a hybrid trace: a normal-ish systolic peak but a diastolic pressure that falls toward LV levels. It classically signals deep or ostial-obstructive engagement, often in the RCA. Disengage and reassess before contrast.",
  dominance:
    "Dominance is defined by which artery gives the posterior descending artery (PDA). Right dominant (≈85%): PDA from the RCA. Left dominant (≈8%): PDA from the LCx. Co-dominant (≈7%): shared. Knowing dominance tells you which vessel supplies the inferior wall and crux.",
  "spider-view":
    "The LAO-caudal 'spider' view splays the left main bifurcation and shows the ostia of the LAD and LCx. It foreshortens the mid vessels, so it is a bifurcation view, not a mid-LAD view.",
  "lad-views":
    "The LAD is best seen where it is elongated and separated from its branches: RAO cranial and LAO cranial for the mid/distal LAD and diagonals, lateral or AP cranial for the proximal LAD.",
  "rca-views":
    "The RCA is worked in the LAO projection (the classic 'C') and elongated into an 'L' in RAO. Cranial angulation opens the distal RCA into the PDA and posterolateral branches at the crux.",
  "catheter-root-match":
    "Match the catheter curve to the aortic root. In a small root a JL3.5 seats the left main; in a dilated root a JL3.5 falls short and you need JL4.5 or JL5. Too small and you inject the root; too large and you cram the cusp and prolapse toward the LV.",
};

export const SAFETY_WARNINGS = [
  "Quality beats hours. Stop if concentration drops.",
  "This is educational simulation only. It does not replace supervised procedural training.",
];
