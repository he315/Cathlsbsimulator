import type { CArm, VesselId } from "../types";

export interface ViewPreset {
  id: string;
  name: string;
  short: string;
  cArm: CArm;
  side: "left" | "right" | "both";
  shows: string;
  bestFor: VesselId[];
  teach: string;
}

// laoRao: negative = RAO, positive = LAO. cranialCaudal: negative = caudal, positive = cranial.
export const VIEW_PRESETS: ViewPreset[] = [
  {
    id: "ap",
    name: "AP (frontal)",
    short: "AP",
    cArm: { laoRao: 0, cranialCaudal: 0 },
    side: "both",
    shows: "General overview. Vessels overlap the spine; poor for the bifurcation.",
    bestFor: ["LM", "LAD"],
    teach: "A reference view. Rarely diagnostic alone — angulate to separate overlapping vessels.",
  },
  {
    id: "lao30",
    name: "LAO 30",
    short: "LAO",
    cArm: { laoRao: 30, cranialCaudal: 0 },
    side: "both",
    shows: "Heart projected off the spine; useful orientation for catheter position.",
    bestFor: ["RCA"],
    teach: "Left-sided obliquity moves the heart off the spine and opens the RCA into a 'C' shape.",
  },
  {
    id: "rao30",
    name: "RAO 30",
    short: "RAO",
    cArm: { laoRao: -30, cranialCaudal: 0 },
    side: "both",
    shows: "Right obliquity; elongates the mid RCA and separates LAD from LCx somewhat.",
    bestFor: ["RCA", "LAD"],
    teach: "Right obliquity elongates the mid RCA and gives a working left overview.",
  },
  {
    id: "spider",
    name: "LAO caudal (spider)",
    short: "SPIDER",
    cArm: { laoRao: 42, cranialCaudal: -28 },
    side: "left",
    shows: "Left main bifurcation, ostial LAD and ostial LCx — the 'spider' view.",
    bestFor: ["LM", "LAD", "LCx", "RAMUS"],
    teach: "The single best view of the LM bifurcation and the ostia of the LAD and LCx. Foreshortens mid vessels.",
  },
  {
    id: "raocaudal",
    name: "RAO caudal",
    short: "RAO CAU",
    cArm: { laoRao: -22, cranialCaudal: -22 },
    side: "left",
    shows: "LCx and obtuse marginals laid out; proximal LAD.",
    bestFor: ["LCx", "OM1", "OM2"],
    teach: "Opens the circumflex and its obtuse marginals. Good for proximal LAD and LM too.",
  },
  {
    id: "raocranial",
    name: "RAO cranial",
    short: "RAO CRA",
    cArm: { laoRao: -20, cranialCaudal: 24 },
    side: "left",
    shows: "Mid and distal LAD with septals and diagonals separated from it.",
    bestFor: ["LAD", "SEPTAL", "D1"],
    teach: "The workhorse LAD view — the mid/distal LAD is elongated and the diagonals fan off it.",
  },
  {
    id: "laocranial",
    name: "LAO cranial",
    short: "LAO CRA",
    cArm: { laoRao: 32, cranialCaudal: 26 },
    side: "left",
    shows: "Proximal-to-mid LAD with the diagonals separated to the side.",
    bestFor: ["LAD", "D1", "D2"],
    teach: "Separates the LAD from its diagonals and shows the proximal LAD off the spine. Watch for diaphragm overlap.",
  },
  {
    id: "apcranial",
    name: "AP cranial",
    short: "AP CRA",
    cArm: { laoRao: 0, cranialCaudal: 30 },
    side: "left",
    shows: "LAD orientation and the LM/proximal LAD, mid LAD elongated.",
    bestFor: ["LM", "LAD"],
    teach: "Elongates the mid LAD and shows the proximal LAD; a clean LAD-oriented projection.",
  },
  {
    id: "lateral",
    name: "Straight lateral (LAO 90)",
    short: "LAT",
    cArm: { laoRao: 90, cranialCaudal: 0 },
    side: "left",
    shows: "Proximal and mid LAD elongated, anteroposterior relationships.",
    bestFor: ["LAD"],
    teach: "The lateral separates the proximal LAD and shows ostial LAD when other views foreshorten it.",
  },
  {
    id: "rcalao",
    name: "RCA — LAO",
    short: "RCA LAO",
    cArm: { laoRao: 40, cranialCaudal: 0 },
    side: "right",
    shows: "The RCA in its classic 'C': ostium, proximal and mid vessel round to the crux.",
    bestFor: ["RCA", "PDA", "PLV"],
    teach: "The standard RCA working view: the vessel forms a 'C' and the ostium is seen best. Add cranial angulation to open the crux (PDA and posterolateral origins).",
  },
  {
    id: "rcarao",
    name: "RCA — RAO",
    short: "RCA RAO",
    cArm: { laoRao: -30, cranialCaudal: 0 },
    side: "right",
    shows: "Mid RCA elongated into an 'L'; complements the LAO view.",
    bestFor: ["RCA", "AM"],
    teach: "The RCA forms an 'L'. Elongates the mid RCA, the acute marginal and the length of the PDA; pair it with the LAO view.",
  },
  {
    id: "rcacranial",
    name: "RCA — LAO cranial",
    short: "RCA CRA",
    cArm: { laoRao: 30, cranialCaudal: 22 },
    side: "right",
    shows: "The distal RCA, PDA and posterolateral branches at the crux.",
    bestFor: ["PDA", "PLV", "RCA"],
    teach: "Cranial angulation opens the distal RCA bifurcation into the PDA and PLV branches.",
  },
];

export const viewById = (id: string): ViewPreset | undefined =>
  VIEW_PRESETS.find((v) => v.id === id);
