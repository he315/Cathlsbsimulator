// ---------------------------------------------------------------------------
// Team and conscious-patient types (plan stream S15, track C4).
//
// The lab's people are agents with a role, a perception scope, a speech queue
// with latency and a memory. The operator talks to them through typed
// commands (command palette), buttons or opt-in speech recognition; every
// command is parsed into a TeamIntent. Agents act on the world only through
// the shared engine APIs: the S9 PatientEngine, the S8 input system (pins and
// C-arm velocity) and optional ports the lab supplies (C-arm drive, table,
// imaging protocol, inventory).
// ---------------------------------------------------------------------------

import type { DrugId, Route } from "../patient/pharmacology";
import type { CArm } from "../../types";

export type { DrugId, Route };

/** Who speaks. The operator is the learner. */
export type RoleId = "operator" | "scrub" | "radiographer" | "physiologist" | "sedation" | "patient";

export const TEAM_ROLES: Exclude<RoleId, "operator">[] = ["scrub", "radiographer", "physiologist", "sedation", "patient"];

export type DoseUnit = "mg" | "µg" | "U" | "mL";

/** A catheter, wire, balloon, stent or other item the scrub nurse can open onto the table. */
export interface ItemSpec {
  kind: "catheter" | "guide" | "wire" | "balloon" | "stent" | "sheath" | "other";
  /** catalogue key, e.g. "JL4", "wire-workhorse", "balloon" */
  key: string;
  /** display name in speech and captions (generic, never a product name) */
  name: string;
  french?: number;
  diameterMm?: number;
  lengthMm?: number;
  /** balloon compliance */
  compliance?: "compliant" | "non-compliant";
}

export type WarnTopic = "warmth" | "chest" | "scratch" | "burning" | "general";
export type AskTopic = "pain" | "feeling" | "breathing" | "nausea";

/** The meaning of one command. `to` is set when the command named its addressee. */
export type TeamIntent =
  | { k: "drug"; drug: DrugId; dose?: number; unit?: DoseUnit; perKg?: boolean; route?: Route; side?: "left" | "right" }
  | { k: "infusion"; drug: "adenosine" | "noradrenaline" | "heparin"; rate?: number; stop?: boolean }
  | { k: "fluid"; ml?: number }
  | { k: "oxygen"; lpm?: number; off?: boolean }
  | { k: "administer"; drug?: DrugId }
  | { k: "act" }
  | { k: "carm"; laoRao?: number; cranialCaudal?: number; relative?: boolean }
  | { k: "table"; action: "up" | "down" | "head" | "feet" | "left" | "right" | "stop" }
  | { k: "protocol"; fluoroPps?: number; cinePps?: number; fieldCm?: number; fluoroLevel?: "low" | "normal" | "high"; storeFluoro?: boolean }
  | { k: "timerReset" }
  | { k: "equipment"; item: ItemSpec }
  | { k: "labelCheck" }
  | { k: "breath"; action: "hold" | "release" }
  | { k: "holdWire" }
  | { k: "haveWire" }
  | { k: "zero" }
  | { k: "record"; on: boolean }
  | { k: "twelveLead" }
  | { k: "nibp"; intervalMin?: number | null }
  | { k: "silence" }
  | { k: "query"; what: "pressure" | "heartRate" | "sats" | "contrast" | "fluoroTime" }
  | { k: "defib"; action: "pads" | "charge" | "clear" | "shock" | "disarm"; joules?: number }
  | { k: "cpr"; on: boolean }
  | { k: "warn"; topic: WarnTopic }
  | { k: "ask"; topic: AskTopic }
  | { k: "reassure" }
  | { k: "keepStill" }
  | { k: "confirm" }
  | { k: "negate" }
  | { k: "cancel" }
  | { k: "thanks" }
  | { k: "unknown" };

export interface ParsedCommand {
  /** the text as typed */
  raw: string;
  intent: TeamIntent;
  /** addressee named in the command ("nurse, …", "radiographer …") */
  to?: Exclude<RoleId, "operator">;
}

export type UtteranceKind =
  | "order" // operator to a team member
  | "readback" // check-back of an order
  | "query" // a team member questions an order
  | "ack" // operator confirms a read-back, or a short acknowledgement
  | "report" // task done, result, information on request
  | "callout" // unprompted alert (alarm, damping, threshold)
  | "patient" // the patient speaking
  | "to-patient"; // operator to the patient

export interface Utterance {
  id: number;
  /** session seconds */
  t: number;
  /** wall-clock time of day, "10:32" */
  clock: string;
  speaker: RoleId;
  to?: RoleId | "team";
  kind: UtteranceKind;
  text: string;
  /** spoken duration, s (model: words / speaking rate) */
  durS: number;
  orderId?: number;
  urgent?: boolean;
}

export type OrderStatus = "queried" | "readback" | "in-progress" | "done" | "cancelled" | "refused";

export interface Order {
  id: number;
  t: number;
  raw: string;
  role: Exclude<RoleId, "operator" | "patient">;
  intent: TeamIntent;
  /** what the team member understood (differs from `intent` after a mishearing) */
  heard: TeamIntent;
  /** the command named its addressee */
  directed: boolean;
  /** a drug order with drug, dose and route all stated */
  complete: boolean | null;
  status: OrderStatus;
  queryReason?: string;
  readbackAt?: number;
  readbackText?: string;
  /** operator confirmed the read-back (closed loop) */
  ackAt?: number;
  /** operator rejected the read-back */
  rejectedAt?: number;
  /** the action was carried out */
  doneAt?: number;
  /** the read-back differed from the order (model mishearing event) */
  misheard?: boolean;
}

/** An IC/IA syringe drawn up by the scrub nurse, waiting for the operator to give it. */
export interface PreparedSyringe {
  id: number;
  orderId: number;
  drug: DrugId;
  dose: number;
  route: Route;
  side?: "left" | "right";
  readyAt: number;
  givenAt?: number;
}

/** An item opened onto the table. `actual` differs from `asked` in a wrong-item event. */
export interface TableItem {
  id: number;
  orderId: number;
  asked: ItemSpec;
  actual: ItemSpec;
  arrivedAt: number;
  labelCheckedAt?: number;
  usedAt?: number;
  replaced?: boolean;
}

/** Something a team member did to the world, for the lab (and the demo) to show or apply. */
export type TeamAction =
  | { a: "item-delivered"; item: TableItem }
  | { a: "item-replaced"; item: TableItem }
  | { a: "syringe-ready"; syringe: PreparedSyringe }
  | { a: "recording"; on: boolean }
  | { a: "twelve-lead" }
  | { a: "oxygen"; lpm: number }
  | { a: "protocol"; fluoroPps?: number; cinePps?: number; fieldCm?: number; fluoroLevel?: "low" | "normal" | "high"; storeFluoro?: boolean }
  | { a: "table"; action: "up" | "down" | "head" | "feet" | "left" | "right" | "stop" }
  | { a: "timer-reset" }
  | { a: "carm-target"; target: CArm }
  | { a: "pads-on" };

// --- ports the lab supplies ------------------------------------------------------

/** Structural view of the S10/C2 CArmDrive (src/simulation/imaging/carm.ts) the radiographer needs. */
export interface CArmPort {
  readonly angles: CArm;
  /** memory drive, held until arrival; null releases */
  driveTo?(target: CArm | null): void;
}

/** Structural view of the TableDrive. */
export interface TablePort {
  setHeightCommand?(dir: -1 | 0 | 1): void;
  setCommandedVelocity?(xMmPerS: number, yMmPerS: number): void;
}

/** The part of the S8 InputSystem the team uses (pins and C-arm velocity through the input bus). */
export interface InputPort {
  emit(i:
    | { t: "pin"; target: "wire" | "guide" | "sheath"; on: boolean; source: string }
    | { t: "carm"; laoDegPerS: number; cranDegPerS: number; source: string }
    | { t: "releaseSource"; source: string }): void;
}

/** Imaging state as the radiographer sees it (for read-backs and "what's the screening time"). */
export interface ImagingView {
  fluoroPps?: number;
  cinePps?: number;
  fieldCm?: number;
  fluoroLevel?: "low" | "normal" | "high";
  fluoroMin?: number;
}
