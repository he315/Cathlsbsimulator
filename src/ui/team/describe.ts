// Plain-language preview of a parsed command, for the command palette.

import { roleFor } from "../../simulation/team/team";
import { roleLabel } from "../../simulation/team/agent";
import { DRUG_SPOKEN, ROUTE_SPOKEN, spokenDose, spokenView } from "../../simulation/team/intents";
import { itemLabel } from "../../simulation/team/roles/scrub";
import type { ParsedCommand, TeamIntent } from "../../simulation/team/types";

function what(i: TeamIntent): string {
  switch (i.k) {
    case "drug": {
      const dose = i.dose === undefined ? "dose missing" : i.unit ? spokenDose(i.dose, i.unit) + (i.perKg ? " per kilo" : "") : `${i.dose} (unit missing)`;
      const route = i.route ? ROUTE_SPOKEN[i.route] + (i.side ? `, ${i.side}` : "") : "route not stated";
      return `${DRUG_SPOKEN[i.drug]}, ${dose}, ${route}`;
    }
    case "infusion":
      return i.stop ? `stop the ${i.drug} infusion` : `${i.drug} infusion${i.rate ? ` at ${i.rate}` : ", rate missing"}`;
    case "fluid":
      return i.ml ? `${i.ml} mL fluid` : "fluid, volume missing";
    case "oxygen":
      return i.off ? "oxygen off" : i.lpm ? `oxygen ${i.lpm} L/min` : "oxygen, flow missing";
    case "administer":
      return i.drug ? `give the ${DRUG_SPOKEN[i.drug]} on the table` : "give the syringe on the table";
    case "act":
      return "ACT";
    case "carm":
      if (i.relative) return `C-arm ${[i.laoRao ? `${i.laoRao > 0 ? "LAO" : "RAO"} ${Math.abs(i.laoRao)} more` : "", i.cranialCaudal ? `${i.cranialCaudal > 0 ? "cranial" : "caudal"} ${Math.abs(i.cranialCaudal)} more` : ""].filter(Boolean).join(", ")}`;
      return `C-arm to ${spokenView(i.laoRao ?? 0, i.cranialCaudal ?? 0)}`;
    case "table":
      return `table ${i.action}`;
    case "protocol":
      return [i.fluoroPps !== undefined && `fluoro ${i.fluoroPps} pulses/s`, i.cinePps !== undefined && `cine ${i.cinePps} frames/s`, i.fluoroLevel && `${i.fluoroLevel} fluoro`, i.fieldCm !== undefined && `field ${i.fieldCm} cm`, i.storeFluoro && "store the last fluoro"].filter(Boolean).join(", ");
    case "timerReset":
      return "reset the screening timer";
    case "equipment":
      return `open ${itemLabel(i.item)}`;
    case "labelCheck":
      return "read the label of the last item";
    case "breath":
      return i.action === "hold" ? "breathe in and hold" : "breathe normally";
    case "holdWire":
      return "hold the wire";
    case "haveWire":
      return "take the wire back";
    case "zero":
      return "zero the transducer";
    case "record":
      return i.on ? "record pressures" : "stop recording";
    case "twelveLead":
      return "12-lead ECG";
    case "nibp":
      return i.intervalMin ? `cuff every ${i.intervalMin} minutes` : "cycle the cuff";
    case "silence":
      return "silence the alarms";
    case "query":
      return { pressure: "ask the pressure", heartRate: "ask the heart rate", sats: "ask the sats", contrast: "ask the contrast used", fluoroTime: "ask the screening time" }[i.what];
    case "defib":
      return { pads: "defibrillator pads on", charge: `charge${i.joules ? ` to ${i.joules} J` : ""}`, clear: "everyone clear", shock: "shock", disarm: "disarm" }[i.action];
    case "cpr":
      return i.on ? "start chest compressions" : "stop chest compressions";
    case "warn":
      return `warn the patient (${i.topic})`;
    case "ask":
      return `ask the patient (${i.topic})`;
    case "reassure":
      return "reassure the patient";
    case "keepStill":
      return "ask the patient to keep still";
    case "confirm":
      return "confirm the read-back";
    case "negate":
      return "reject the read-back";
    case "cancel":
      return "cancel the last order";
    case "thanks":
      return "thanks";
    case "unknown":
      return "not understood";
  }
}

export function describeCommand(p: ParsedCommand, sedationRole: "sedation-nurse" | "anaesthetist" = "sedation-nurse"): { who: string; what: string; ok: boolean } {
  const i = p.intent;
  const ok = i.k !== "unknown";
  const response = i.k === "confirm" || i.k === "negate" || i.k === "cancel" || i.k === "thanks";
  const who = !ok ? "" : response ? "Team" : roleLabel(roleFor(i, p.to), sedationRole);
  return { who, what: what(i), ok };
}
