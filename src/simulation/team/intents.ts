// ---------------------------------------------------------------------------
// Command grammar: typed (or recognised) operator speech -> TeamIntent.
//
// The grammar is a set of ordered rules over a normalised string, written for
// how operators actually talk in a UK cath lab ("heparin 5,000 units",
// "200 mics of GTN down the left", "LAO 30 cranial 20", "ACT please",
// "breathe in and hold", "I have the wire"). It does not guess: anything it
// cannot read with confidence is an "unknown" intent, and the team member asks
// the operator to say it again. Missing parts of a drug order (dose, unit,
// route) are kept missing so the nurse can ask, as a real nurse would.
//
// Product names are not recognised or spoken; catheter curves use the generic
// eponymous names (Judkins, Amplatz) and "extra backup" for the guide shapes.
// ---------------------------------------------------------------------------

import type { DrugId, Route } from "../patient/pharmacology";
import type { DoseUnit, ItemSpec, ParsedCommand, RoleId, TeamIntent, WarnTopic, AskTopic } from "./types";
import { TEAM_PARAMS } from "./params";

// --- normalisation ------------------------------------------------------------------

const SMALL: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

/** Replace spelled numbers ("five thousand", "two hundred", "twenty five", "point five") with digits. */
function wordsToDigits(s: string): string {
  const tok = s.split(" ");
  const out: string[] = [];
  let i = 0;
  while (i < tok.length) {
    const w = tok[i];
    if (w in SMALL || ((w === "hundred" || w === "thousand") && out.length && /^\d+$/.test(out[out.length - 1]))) {
      let total = 0;
      let cur = 0;
      let used = 0;
      let j = i;
      if (!(w in SMALL)) {
        cur = Number(out.pop());
      }
      for (; j < tok.length; j++) {
        const x = tok[j];
        if (x in SMALL) {
          cur += SMALL[x];
          used++;
        } else if (x === "hundred") {
          cur = (cur || 1) * 100;
          used++;
        } else if (x === "thousand") {
          total += (cur || 1) * 1000;
          cur = 0;
          used++;
        } else if (x === "and" && j + 1 < tok.length && tok[j + 1] in SMALL && used > 0) {
          continue;
        } else break;
      }
      let num = String(total + cur);
      if (tok[j] === "point" && j + 1 < tok.length && tok[j + 1] in SMALL) {
        num += "." + SMALL[tok[j + 1]];
        j += 2;
      }
      out.push(num);
      i = j;
      continue;
    }
    if (w === "point" && i + 1 < tok.length && tok[i + 1] in SMALL && (out.length === 0 || !/^\d+$/.test(out[out.length - 1]))) {
      out.push("0." + SMALL[tok[i + 1]]);
      i += 2;
      continue;
    }
    if (w === "half" && (out.length === 0 || out[out.length - 1] === "a" || out[out.length - 1] === "and")) {
      if (out[out.length - 1] === "a") out.pop();
      if (out[out.length - 1] === "and" && /^\d+$/.test(out[out.length - 2] ?? "")) {
        out.pop();
        out.push(String(Number(out.pop()) + 0.5));
      } else out.push("0.5");
      i++;
      continue;
    }
    out.push(w);
    i++;
  }
  return out.join(" ");
}

/** Lower case, unit-friendly spacing, thousands separators removed, spelled numbers converted. */
export function normalise(text: string): string {
  let s = text.toLowerCase();
  s = s.replace(/[µμ]/g, "u").replace(/×/g, " x ").replace(/[’‘`]/g, "'");
  s = s.replace(/(\d),(\d{3})(?!\d)/g, "$1$2").replace(/(\d),(\d{3})(?!\d)/g, "$1$2");
  s = s.replace(/(\d)\s*k\b/g, "$1000");
  s = s.replace(/(\d(?:\.\d+)?)\s*x\s*(\d)/g, "$1 x $2");
  s = s.replace(/(\d)([a-z])/g, "$1 $2").replace(/\b([a-z]{2,4})(\d)/g, (m, a: string, d: string) => (/^(lao|rao|jl|jr|al|ar|mp|ebu|xb|eb|ap|cra|cran|cau|caud|v)$/.test(a) ? `${a} ${d}` : m));
  s = s.replace(/\bv (\d)/g, "v$1"); // ECG leads stay together
  s = s.replace(/[^a-z0-9.'/+\s-]/g, " ").replace(/-/g, " ").replace(/\s+/g, " ").trim();
  s = s.replace(/\.$/, "");
  return wordsToDigits(s);
}

// --- vocabulary -------------------------------------------------------------------------

/** Drug names and the aliases operators use (product names excluded). Longest first where they overlap. */
export const DRUG_ALIASES: [DrugId, string[]][] = [
  ["noradrenaline", ["noradrenaline", "norepinephrine", "norad"]],
  ["adrenaline", ["adrenaline", "adrenalin", "epinephrine", "epi"]],
  ["heparin", ["unfractionated heparin", "heparin", "ufh"]],
  ["protamine", ["protamine"]],
  ["gtn", ["glyceryl trinitrate", "nitroglycerine", "nitroglycerin", "nitrates", "nitrate", "nitro", "gtn", "ntg"]],
  ["adenosine", ["adenosine", "adeno"]],
  ["verapamil", ["verapamil", "vera"]],
  ["atropine", ["atropine"]],
  ["metaraminol", ["metaraminol", "metaraminal", "meta"]],
  ["phenylephrine", ["phenylephrine", "phenyl"]],
  ["midazolam", ["midazolam", "midaz", "midazelam"]],
  ["fentanyl", ["fentanyl", "fentanil", "fent"]],
  ["chlorphenamine", ["chlorphenamine", "chlorpheniramine"]],
  ["hydrocortisone", ["hydrocortisone", "hydrocort"]],
  // found-patient-formulary (generic names only)
  ["flumazenil", ["flumazenil"]],
  ["naloxone", ["naloxone"]],
  ["diazepam", ["diazepam"]],
  ["propofol", ["propofol"]],
  ["dobutamine", ["dobutamine"]],
  ["dopamine", ["dopamine"]],
  ["vasopressin", ["vasopressin"]],
  ["isoprenaline", ["isoprenaline", "isoproterenol"]],
  ["furosemide", ["furosemide", "frusemide"]],
  ["salbutamol", ["salbutamol", "albuterol"]],
  ["amiodarone", ["amiodarone", "amio"]],
  ["lidocaine", ["lidocaine", "lignocaine"]],
  ["metoprolol", ["metoprolol"]],
  ["flecainide", ["flecainide"]],
  ["aminophylline", ["aminophylline"]],
  ["nicardipine", ["nicardipine"]],
  ["nitroprusside", ["sodium nitroprusside", "nitroprusside"]],
  ["eptifibatide", ["eptifibatide"]],
  ["tirofiban", ["tirofiban"]],
  ["cangrelor", ["cangrelor"]],
  ["bivalirudin", ["bivalirudin"]],
  ["idarucizumab", ["idarucizumab"]],
  ["andexanet", ["andexanet alfa", "andexanet"]],
  ["pcc", ["prothrombin complex concentrate", "prothrombin complex", "pcc"]],
  ["aspirin", ["aspirin", "acetylsalicylic acid"]],
  ["clopidogrel", ["clopidogrel"]],
  ["prasugrel", ["prasugrel"]],
  ["ticagrelor", ["ticagrelor"]],
];

/** Drugs the team can run as an infusion through the infusion intent (team/types.ts TeamIntent "infusion"). */
const TEAM_INFUSIONS = ["adenosine", "noradrenaline", "heparin"] as const;

const UNIT_WORDS: [DoseUnit, RegExp][] = [
  ["µg", /^(mcg|ug|microgram|micrograms|mic|mics|micro|micros|mcgs)$/],
  ["mg", /^(mg|mgs|milligram|milligrams|mil)$/],
  ["U", /^(u|unit|units|iu)$/],
  ["mL", /^(ml|mls|millilitre|millilitres|milliliter|milliliters|cc|cc's)$/],
];

const ROLE_WORDS: [Exclude<RoleId, "operator">, RegExp][] = [
  ["scrub", /^(nurse|scrub|scrub nurse|sister|staff nurse)$/],
  ["radiographer", /^(radiographer|rad|radiography|rads)$/],
  ["physiologist", /^(physiologist|physio|physiology|cardiac physiologist|tech)$/],
  ["sedation", /^(anaesthetist|anesthetist|anaesthesia|anesthesia|sedation|sedation nurse|gas|anaesthetics)$/],
  ["patient", /^(patient|mr \w+|mrs \w+|ms \w+|miss \w+|sir|madam)$/],
];

function unitOf(word: string | undefined): DoseUnit | undefined {
  if (!word) return undefined;
  for (const [u, re] of UNIT_WORDS) if (re.test(word)) return u;
  return undefined;
}


// --- equipment ----------------------------------------------------------------------------

const CATHETERS: { re: RegExp; key: string; name: string }[] = [
  { re: /\b(jl|judkins left) ?(3\.5|4\.5|4|5|6)\b/, key: "JL", name: "JL" },
  { re: /\b(jr|judkins right) ?(3\.5|4|5|6)\b/, key: "JR", name: "JR" },
  { re: /\b(al|amplatz left) ?(0\.75|1|2|3)\b/, key: "AL", name: "AL" },
  { re: /\b(ar|amplatz right) ?(1|2)?\b/, key: "AR", name: "AR" },
  { re: /\b(ebu|xb|eb|extra back ?up|extra backup) ?(3\.75|3\.5|3\.0|4\.0|3|4)\b/, key: "EB", name: "extra backup" },
  { re: /\b(multipurpose|mp) ?(1|2)?\b/, key: "MP", name: "multipurpose" },
  { re: /\bpigtail\b/, key: "PIG", name: "pigtail" },
  { re: /\b(universal|radial universal|tiger|tig)\b/, key: "RU", name: "radial universal" },
];

function frenchOf(s: string): number | undefined {
  const m = s.match(/\b(4|5|6|7|8)\s*(f|fr|french)\b/);
  return m ? Number(m[1]) : undefined;
}

export function parseEquipment(s: string): ItemSpec | null {
  const fr = frenchOf(s);
  const guide = /\b(guide|guiding)\b/.test(s);
  for (const c of CATHETERS) {
    const m = s.match(c.re);
    if (!m) continue;
    const size = m[2] ?? "";
    const sizeTxt = size ? (c.key === "EB" ? " " + (size.includes(".") ? size : size + ".0") : size) : c.key === "AR" ? " 2" : "";
    const name = c.key === "EB" || c.key === "MP" || c.key === "PIG" || c.key === "RU" ? `${c.name}${sizeTxt}` : `${c.name}${sizeTxt}`;
    const key = c.key + (size || (c.key === "AR" ? "2" : ""));
    const kind = guide || c.key === "EB" ? "guide" : "catheter";
    return { kind, key, name: name.trim(), french: fr ?? (kind === "guide" ? 6 : c.key === "PIG" ? 5 : 6) };
  }
  // balloons and stents: "3.0 by 15 NC balloon", "2.5 x 20 stent"
  const dims = s.match(/\b(\d(?:\.\d+)?)\s*(?:by|x|mil by|mm by)\s*(\d{1,2})\b/);
  if (/\bballoon\b/.test(s)) {
    const nc = /\b(nc|non compliant|noncompliant|high pressure)\b/.test(s);
    if (!dims) return { kind: "balloon", key: nc ? "balloon-nc" : "balloon", name: nc ? "non-compliant balloon" : "balloon", compliance: nc ? "non-compliant" : "compliant" };
    const d = Number(dims[1]);
    const l = Number(dims[2]);
    return { kind: "balloon", key: nc ? "balloon-nc" : "balloon", name: `${fmtMm(d)} by ${l}${nc ? " non-compliant" : ""} balloon`, diameterMm: d, lengthMm: l, compliance: nc ? "non-compliant" : "compliant" };
  }
  if (/\bstent\b/.test(s)) {
    if (!dims) return { kind: "stent", key: "stent", name: "stent" };
    const d = Number(dims[1]);
    const l = Number(dims[2]);
    return { kind: "stent", key: "stent", name: `${fmtMm(d)} by ${l} stent`, diameterMm: d, lengthMm: l };
  }
  if (/\bsheath\b/.test(s)) return { kind: "sheath", key: "sheath", name: `${fr ?? 6} French sheath`, french: fr ?? 6 };
  if (/\bwire\b/.test(s)) {
    if (/\b(pressure|ffr|physiology)\b/.test(s)) return { kind: "wire", key: "wire-pressure", name: "pressure wire" };
    if (/\b(hydrophilic|glide|slippery|polymer)\b/.test(s)) return { kind: "wire", key: "wire-hydrophilic", name: "hydrophilic wire" };
    if (/\b(extra support|support|stiff)\b/.test(s)) return { kind: "wire", key: "wire-support", name: "extra-support wire" };
    if (/\b(0\.014|014|coronary|workhorse|work horse|floppy)\b/.test(s)) return { kind: "wire", key: "wire-workhorse", name: "workhorse coronary wire" };
    if (/\b(exchange|long|260|300)\b/.test(s)) return { kind: "wire", key: "wire-exchange", name: "exchange-length J wire" };
    if (/\b(0\.035|035|j)\b/.test(s)) return { kind: "wire", key: "wire-j", name: "J wire" };
    return null;
  }
  if (/\b(ivus|intravascular ultrasound)\b/.test(s)) return { kind: "other", key: "ivus", name: "IVUS catheter" };
  if (/\b(indeflator|inflation device)\b/.test(s)) return { kind: "other", key: "indeflator", name: "inflation device" };
  if (/\b(torquer|torque device|torque)\b/.test(s)) return { kind: "other", key: "torquer", name: "torque device" };
  if (/\b(y connector|y adaptor|y adapter|haemostatic valve|hemostatic valve)\b/.test(s)) return { kind: "other", key: "y-connector", name: "Y-connector" };
  if (/\b(introducer|insertion tool)\b/.test(s)) return { kind: "other", key: "introducer", name: "wire introducer" };
  if (/\b(aspiration catheter|thrombectomy)\b/.test(s)) return { kind: "other", key: "aspiration", name: "aspiration catheter" };
  if (/\b(guide extension|guide extension catheter|mother and child)\b/.test(s)) return { kind: "other", key: "guide-extension", name: "guide extension catheter" };
  return null;
}

function fmtMm(d: number): string {
  return Number.isInteger(d) ? d.toFixed(1) : String(d);
}

// --- rules ---------------------------------------------------------------------------------

const CONFIRM = /^(yes|yeah|yep|correct|that'?s (right|correct)|right|affirmative|confirmed?|yes please|yes correct|go ahead|that'?s it|spot on|yes that'?s right)$/;
const NEGATE = /^(no|nope|negative|incorrect|that'?s (wrong|not right|incorrect)|wrong|no that'?s wrong)$/;
const CANCEL = /^(cancel|cancel that|scratch that|belay that|hold off|forget (it|that)|stop that|don'?t give (it|that))$/;
const THANKS = /^(thanks?|thank you|cheers|lovely|great thanks|thank you very much|ta)$/;

function stripPoliteness(s: string): string {
  return s
    .replace(/^(ok|okay|right|so|and|now|then)\b ?/, "")
    .replace(/\b(please|thanks|thank you)\b/g, " ")
    .replace(/^(can|could) (you|we|i) (please )?(have |get |give me |do |)?/, "")
    .replace(/^(i'?d like|i need|i want|let'?s have|let'?s get|let'?s go|let'?s|get me|we need|i'?ll have)\b ?/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findDrug(s: string): DrugId | null {
  for (const [id, aliases] of DRUG_ALIASES) {
    for (const a of aliases) {
      if (new RegExp(`\\b${a.replace(/ /g, "\\s+")}\\b`).test(s)) return id;
    }
  }
  return null;
}

function routeOf(s: string): { route?: Route; side?: "left" | "right" } {
  let route: Route | undefined;
  if (/\b(neb|nebs|nebulised|nebulized|nebuliser|nebulizer)\b/.test(s)) route = "neb";
  else if (/\b(crushed|chewed|chew it|chew them)\b/.test(s)) route = "crushed";
  else if (/\b(oral|orally|po|by mouth|swallowed|to swallow)\b/.test(s)) route = "oral";
  else if (/\b(ic|intracoronary|intra coronary|down the (left|right|guide|catheter)|into the (left|right|coronary))\b/.test(s)) route = "ic";
  else if (/\b(ia|intra arterial|intraarterial|through the sheath|down the sheath|into the radial|radial)\b/.test(s)) route = "ia";
  else if (/\b(iv|intravenous|intravenously|venous|through the cannula|into the cannula|in the drip)\b/.test(s)) route = "iv";
  else if (/\b(im|intramuscular|intramuscularly)\b/.test(s)) route = "im";
  const sm = s.match(/\b(left|right|lca|rca|lmca)\b/);
  const side = sm ? (sm[1] === "right" || sm[1] === "rca" ? "right" : "left") : undefined;
  return { route, side: route === "ic" || route === undefined ? side : undefined };
}

/** The first number that is a dose (not a French size, energy, rate or angle), with its unit. */
function doseOf(s: string): { dose?: number; unit?: DoseUnit; perKg?: boolean } {
  const tokens = s.split(" ");
  const perKg = /\b(per ?kg|per kilo|a kilo|units? per kilo|a kg|per kilogram)\b|\/ ?kg\b/.test(s);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!/^\d+(\.\d+)?$/.test(t)) continue;
    if (/^(f|fr|french|joules|j|litres|liters|l|lpm|min|minutes|mins|frames|pps|fps|lao|rao|cranial|caudal|percent|%)$/.test(tokens[i + 1] ?? "")) continue;
    // grams (reversal agents, for example idarucizumab 5 g) are read as milligrams
    if (/^(g|gram|grams|gm)$/.test(tokens[i + 1] ?? "")) return { dose: Number(t) * 1000, unit: "mg", perKg };
    return { dose: Number(t), unit: unitOf(tokens[i + 1]), perKg };
  }
  return { perKg };
}

function warnTopic(s: string): WarnTopic {
  if (/\b(warm|hot|heat|flush|flushing|warmth)\b/.test(s)) return "warmth";
  if (/\b(chest|tight|tightness|pain|discomfort|pressure|ache|breathless|short of breath)\b/.test(s)) return "chest";
  if (/\b(scratch|sting|stinging|sharp|needle|local)\b/.test(s)) return "scratch";
  if (/\b(burn|burning)\b/.test(s)) return "burning";
  return "general";
}

function askTopic(s: string): AskTopic | null {
  if (/\b(any (chest )?pain|in (any )?pain|how('?s| is) (the|your) pain|pain score|score (the|your) pain|chest pain|are you sore|out of (10|ten))\b/.test(s)) return "pain";
  if (/\b(how('?s| is) (the|your) breathing|short of breath|breathless|can you breathe|breathing ok)\b/.test(s)) return "breathing";
  if (/\b(feel(ing)? sick|nause(a|ous)|sick)\b/.test(s)) return "nausea";
  if (/\b(how are you|how do you feel|how('?s| are) (it|things) going|are you (ok|okay|alright|all right|comfortable)|you ok|you alright|everything ok)\b/.test(s)) return "feeling";
  return null;
}

/** C-arm view: "LAO 30 cranial 20", "RAO 30 caudal", "AP cranial 30", "left lateral", "10 more cranial". */
function parseCarm(s: string): TeamIntent | null {
  if (!/\b(lao|rao|ap|pa|lateral|cranial|cran|cra|caudal|caud|cau)\b/.test(s)) return null;
  const relative = /\b(more|further|extra)\b/.test(s);
  const present = (re: RegExp) => re.test(s);
  /** the number said next to an angle word, before or after it */
  const numberBy = (words: string): number | undefined => {
    const after = s.match(new RegExp(`\\b(?:${words})\\s+(\\d+(?:\\.\\d+)?)\\b`));
    if (after) return Number(after[1]);
    const before = s.match(new RegExp(`\\b(\\d+(?:\\.\\d+)?)\\s+(?:degrees\\s+)?(?:more\\s+|further\\s+)?(?:${words})\\b`));
    return before ? Number(before[1]) : undefined;
  };
  const LAO = "lao";
  const RAO = "rao";
  const CRAN = "cranial|cran|cra";
  const CAUD = "caudal|caud|cau";
  const hasLao = present(/\blao\b/);
  const hasRao = present(/\brao\b/);
  const hasCran = present(/\b(cranial|cran|cra)\b/);
  const hasCaud = present(/\b(caudal|caud|cau)\b/);
  if (relative) {
    // "a bit more LAO" has no number: the nudge size is a model parameter
    const nudge = TEAM_PARAMS.carmNudgeDeg;
    const dLao = hasLao ? numberBy(LAO) ?? nudge : hasRao ? -(numberBy(RAO) ?? nudge) : undefined;
    const dCran = hasCran ? numberBy(CRAN) ?? nudge : hasCaud ? -(numberBy(CAUD) ?? nudge) : undefined;
    if (dLao === undefined && dCran === undefined) return null;
    return { k: "carm", laoRao: dLao, cranialCaudal: dCran, relative: true };
  }
  let lao: number | undefined;
  let cran: number | undefined;
  if (present(/\bright lateral\b/)) lao = -90;
  else if (present(/\blateral\b/)) lao = 90;
  if (present(/\b(ap|pa)\b/)) lao = 0;
  if (hasLao) lao = numberBy(LAO);
  if (hasRao) {
    const n = numberBy(RAO);
    lao = n === undefined ? undefined : -n;
  }
  if (hasCran) cran = numberBy(CRAN);
  if (hasCaud) {
    const n = numberBy(CAUD);
    cran = n === undefined ? undefined : -n;
  }
  // an angle word without its number ("LAO cranial") is not a view
  if ((hasLao || hasRao) && lao === undefined) return null;
  if ((hasCran || hasCaud) && cran === undefined && lao === undefined) return null;
  if (lao === undefined && cran === undefined) return null;
  // a stated view with no cranio-caudal word is straight
  if (lao !== undefined && cran === undefined && !hasCran && !hasCaud) cran = 0;
  if (lao !== undefined && Math.abs(lao) > 120) return null;
  if (cran !== undefined && Math.abs(cran) > 60) return null;
  return { k: "carm", laoRao: lao, cranialCaudal: cran };
}

function parseProtocol(s: string): TeamIntent | null {
  const out: Extract<TeamIntent, { k: "protocol" }> = { k: "protocol" };
  let any = false;
  const rate = "(\\d+(?:\\.\\d+)?)\\s*(?:pps|fps|frames|frame|f|pulses)?(?:\\s*(?:per|a|\\/)\\s*(?:second|sec|s))?";
  const fl = s.match(new RegExp(`\\b(?:fluoro|fluoroscopy|screening)\\b(?:\\s+(?:at|to|on))?\\s+${rate}`)) ?? s.match(new RegExp(`\\b${rate}\\s+(?:fluoro|fluoroscopy|screening)\\b`));
  if (fl && /\d/.test(fl[0]) && /(pps|fps|frame|fluoro|screening)/.test(fl[0])) {
    out.fluoroPps = Number(fl[1]);
    any = true;
  }
  const ci = s.match(new RegExp(`\\b(?:cine|acquisition|acquire|record)\\b(?:\\s+(?:at|to|on))?\\s+${rate}`)) ?? s.match(new RegExp(`\\b${rate}\\s+(?:cine|acquisition)\\b`));
  if (ci && /\d/.test(ci[0])) {
    out.cinePps = Number(ci[1]);
    any = true;
  }
  if (!any) {
    const bare = s.match(/\b(\d+(?:\.\d+)?)\s*(pps|fps|frames per second|frames a second)\b/);
    if (bare) {
      out.fluoroPps = Number(bare[1]);
      any = true;
    }
  }
  if (/\b(low dose|low level|low) (fluoro|fluoroscopy|screening)\b|\bfluoro (on )?low\b/.test(s)) {
    out.fluoroLevel = "low";
    any = true;
  } else if (/\b(normal|standard) (dose )?(fluoro|fluoroscopy|screening)\b/.test(s)) {
    out.fluoroLevel = "normal";
    any = true;
  } else if (/\b(high (level|dose)|boost) (fluoro|fluoroscopy|screening)?\b/.test(s)) {
    out.fluoroLevel = "high";
    any = true;
  }
  const fov = s.match(/\b(?:field|fov|field of view|field size|mag|magnification)\s*(?:size\s*)?(?:to\s*)?(\d{2})\b/) ?? s.match(/\b(\d{2})\s*(?:cm)?\s*(?:field|fov)\b/);
  if (fov) {
    out.fieldCm = Number(fov[1]);
    any = true;
  }
  if (/\b(store|save|keep)( that| the| last)? (fluoro|fluoroscopy|loop|run)\b/.test(s)) {
    out.storeFluoro = true;
    any = true;
  }
  return any ? out : null;
}

/** Parse one command. Never throws; unrecognised text gives { k: "unknown" }. */
export function parseCommand(text: string): ParsedCommand {
  const raw = text;
  let s = normalise(text);
  let to: ParsedCommand["to"];
  // addressee at the start ("nurse, …") or at the end ("…, please nurse")
  for (const [role, re] of ROLE_WORDS) {
    const words = s.split(" ");
    for (const n of [3, 2, 1]) {
      if (words.length > n && re.test(words.slice(0, n).join(" "))) {
        to = role;
        s = words.slice(n).join(" ");
        break;
      }
      if (words.length > n && re.test(words.slice(-n).join(" "))) {
        to = role;
        s = words.slice(0, -n).join(" ");
        break;
      }
    }
    if (to) break;
  }
  const intent = parseIntent(s);
  return { raw, intent, to };
}

function parseIntent(s0: string): TeamIntent {
  const bare = s0.replace(/\b(please|thanks|thank you)\b/g, "").replace(/\s+/g, " ").trim();
  if (CONFIRM.test(bare)) return { k: "confirm" };
  if (NEGATE.test(bare) || /^no,? /.test(bare) && /\b(i said|it'?s|that'?s)\b/.test(bare)) return { k: "negate" };
  if (CANCEL.test(bare)) return { k: "cancel" };
  if (THANKS.test(bare) || bare === "") return bare === "" ? { k: "unknown" } : { k: "thanks" };
  const s = stripPoliteness(s0);

  // resuscitation
  if (/\b(start|begin|commence|start chest|resume) (cpr|compressions|chest compressions)\b|^cpr$/.test(s)) return { k: "cpr", on: true };
  if (/\b(stop|hold|pause|stop chest) (cpr|compressions|chest compressions)\b/.test(s)) return { k: "cpr", on: false };
  if (/\b(pads on|put (the )?pads on|attach (the )?pads|defib pads|get the pads on|apply (the )?pads)\b/.test(s)) return { k: "defib", action: "pads" };
  const ch = s.match(/\bcharg(?:e|ing)\b(?:\s+(?:the defib|defib|to|up to))*(?:\s+(?:to\s+)?(\d{2,3}))?/);
  if (ch && !/\bin charge\b/.test(s)) return { k: "defib", action: "charge", joules: ch[1] ? Number(ch[1]) : undefined };
  if (/\b(stand clear|all clear|everybody clear|everyone clear|i'?m clear|you'?re clear|clear for shock|oxygen away|stand back)\b|^clear$/.test(s)) return { k: "defib", action: "clear" };
  if (/\b(disarm|dump (the )?charge|cancel (the )?shock)\b/.test(s)) return { k: "defib", action: "disarm" };
  if (/\b(shock|shocking|deliver (the )?shock|defibrillate)\b/.test(s) && !/\b(anaphylactic|cardiogenic|septic)\b/.test(s)) return { k: "defib", action: "shock" };

  // ACT
  if (/\b(act|activated clotting time|clotting time)\b/.test(s) && !/\bheparin\s+\d/.test(s)) return { k: "act" };

  // infusions
  const stopInf = s.match(/\b(stop|turn off|switch off) (the )?(adenosine|noradrenaline|norad|norepinephrine|heparin)( infusion)?\b/);
  if (stopInf) {
    const d = findDrug(stopInf[3]) as "adenosine" | "noradrenaline" | "heparin";
    return { k: "infusion", drug: d, stop: true };
  }
  if (/\binfusion\b|\b(per kg per min|per kilo per minute|\/kg\/min|mcg\/kg\/min|ug\/kg\/min|micrograms per kilo per minute|per minute|an hour|per hour)\b/.test(s)) {
    const d = findDrug(s);
    if (d === "adenosine" || d === "noradrenaline" || d === "heparin") {
      const m = s.match(/\b(\d+(?:\.\d+)?)\b/);
      return { k: "infusion", drug: d, rate: m ? Number(m[1]) : undefined };
    }
    // an infusion of a drug the team's infusion intent does not carry yet: not read as a bolus
    if (d && !(TEAM_INFUSIONS as readonly string[]).includes(d) && /\binfusion\b|\b(per kg per min|per kilo per minute|\/kg\/min|mcg\/kg\/min|ug\/kg\/min|micrograms per kilo per minute|per minute|an hour|per hour)\b/.test(s)) return { k: "unknown" };
  }

  // fluids and oxygen
  if (/\b(saline|fluid|fluids|hartmann'?s|crystalloid|bolus of fluid|fluid bolus)\b/.test(s) && !findDrug(s)) {
    const m = s.match(/\b(\d{2,4})\s*(ml|mls|millilitres)?\b/);
    return { k: "fluid", ml: m ? Number(m[1]) : undefined };
  }
  if (/\b(oxygen|o2|nasal specs|nasal cannula|nasal prongs|face mask|non rebreathe)\b/.test(s)) {
    if (/\b(off|stop|remove|take off)\b/.test(s)) return { k: "oxygen", off: true };
    const m = s.match(/\b(\d{1,2})\s*(l|litres|liters|lpm|litre)?\b/);
    return { k: "oxygen", lpm: m ? Number(m[1]) : undefined };
  }

  // drugs
  const drug = findDrug(s);
  if (drug) {
    const { dose, unit, perKg } = doseOf(s);
    const { route, side } = routeOf(s);
    if (dose === undefined && /\b(give|inject|administer|push|in it goes)\b/.test(s) && /\b(it|that|the|now)\b/.test(s)) return { k: "administer", drug };
    return { k: "drug", drug, dose, unit, perKg: perKg || undefined, route, side };
  }
  if (/^(give|inject|administer|push) (it|that|the drug|the syringe|it now|now)$/.test(s) || /^(give|inject) (it|that)\b/.test(s)) return { k: "administer" };

  // physiologist
  if (/\b(zero|re zero|rezero)\b/.test(s)) return { k: "zero" };
  if (/\b(stop|end|finish) (the )?record(ing)?\b/.test(s)) return { k: "record", on: false };
  if (/\b(start )?(record|recording)( (the )?(pressures?|that|this|trace|run))?\b/.test(s) && !/\b(cine|fps|pps)\b/.test(s)) return { k: "record", on: true };
  if (/\b(12 lead|twelve lead|12 lead ecg|full ecg|ecg)\b/.test(s)) return { k: "twelveLead" };
  const nibpEvery = s.match(/\b(?:bp|blood pressure|cuff|nibp|obs)\b.*\bevery (\d+) (?:min|mins|minutes)\b/);
  if (nibpEvery) return { k: "nibp", intervalMin: Number(nibpEvery[1]) };
  if (/\b(nibp|cycle (the )?(bp|blood pressure|cuff)|cuff pressure|do a (bp|blood pressure|cuff)|manual bp)\b/.test(s)) return { k: "nibp" };
  if (/\b(silence|mute|quiet|acknowledge|suspend) (the |that )?(alarms?|monitor)\b/.test(s)) return { k: "silence" };
  if (/\b(what('?s| is| are)?|tell me|give me) (the |his |her |our )?(pressure|pressures|bp|blood pressure|aortic pressure|art line)\b|^(pressure|bp|pressures)\??$/.test(s)) return { k: "query", what: "pressure" };
  if (/\b(what('?s| is)? (the )?(heart rate|rate|hr|pulse))\b|^(heart rate|rate)\??$/.test(s)) return { k: "query", what: "heartRate" };
  if (/\b(sats|saturations?|spo2|oxygen saturation)\b/.test(s)) return { k: "query", what: "sats" };
  if (/\bhow much contrast\b|\bcontrast (volume|used|so far|count)\b/.test(s)) return { k: "query", what: "contrast" };
  if (/\b(screening time|fluoro time|fluoroscopy time|how much screening|how long have we screened)\b/.test(s)) return { k: "query", what: "fluoroTime" };

  // patient
  if (/\b(breathe in|breath in|deep breath|big breath|hold (your )?breath|hold it there|and hold)\b/.test(s)) return { k: "breath", action: "hold" };
  if (/\b(breathe (away|normally|out|now)|breath away|let (it|your breath) go|relax your breathing|and breathe)\b/.test(s)) return { k: "breath", action: "release" };
  if (/\b(keep|stay|lie) (very |nice and |really )?still\b|\bdon'?t move\b/.test(s)) return { k: "keepStill" };
  if (/\b(you'?ll|you will|you may|you might|you can|you'?re going to|going to|this (will|may|might|is going to)) (feel|get|notice|be)\b|\bwarn (the )?patient\b|\bsharp scratch\b|\blittle scratch\b/.test(s)) return { k: "warn", topic: warnTopic(s) };
  const ask = askTopic(s);
  if (ask) return { k: "ask", topic: ask };
  if (/\b(you'?re doing (well|great|fine|really well|brilliantly)|nearly (done|finished|there)|all going well|nothing to worry|try to relax|all looks good|everything'?s fine)\b/.test(s)) return { k: "reassure" };

  // wire handling
  if (/\b(i'?ve got|i have|got|i'?ll take) (the |my )?wire\b|\bmy wire\b|\bwire'?s mine\b/.test(s)) return { k: "haveWire" };
  if (/\b(hold|pin|take|fix|keep hold of) (the |my |this |that )?wire\b|\bwire (please|hold)\b/.test(s)) return { k: "holdWire" };

  // items
  if (/\b(check|read|show me|confirm) (me )?(the |that )?(label|size|packet|box)\b|\bwhat (size )?is (that|it)\b|\bread (it|that) (back|out)\b/.test(s)) return { k: "labelCheck" };

  // radiographer
  if (/\breset (the )?(timer|clock|fluoro|screening|buzzer|alarm timer)\b/.test(s)) return { k: "timerReset" };
  const proto = parseProtocol(s);
  if (proto) return proto;
  if (/\b(table|bed)\b/.test(s) || /\bpan\b/.test(s)) {
    if (/\b(stop)\b/.test(s)) return { k: "table", action: "stop" };
    if (/\b(up|higher|raise|lift)\b/.test(s) && /\b(table|bed)\b/.test(s) && !/\b(towards|to the)\b/.test(s)) return { k: "table", action: "up" };
    if (/\b(down|lower|drop)\b/.test(s) && /\b(table|bed)\b/.test(s) && !/\b(towards|to the)\b/.test(s)) return { k: "table", action: "down" };
    if (/\b(head|cranially|in)\b/.test(s)) return { k: "table", action: "head" };
    if (/\b(feet|foot|caudally|out)\b/.test(s)) return { k: "table", action: "feet" };
    if (/\bleft\b/.test(s)) return { k: "table", action: "left" };
    if (/\bright\b/.test(s)) return { k: "table", action: "right" };
  }
  const carm = parseCarm(s);
  if (carm) return carm;

  // equipment
  const item = parseEquipment(s);
  if (item) return { k: "equipment", item };

  return { k: "unknown" };
}

// --- speech helpers ---------------------------------------------------------------------

const UNIT_SPOKEN: Record<DoseUnit, [string, string]> = {
  mg: ["milligram", "milligrams"],
  "µg": ["microgram", "micrograms"],
  U: ["unit", "units"],
  mL: ["millilitre", "millilitres"],
};

/** "5,000 units", "200 micrograms", "0.6 milligrams", "2.5 milligrams". */
export function spokenDose(dose: number, unit: DoseUnit): string {
  const n = Number.isInteger(dose) ? dose.toLocaleString("en-GB") : String(+dose.toFixed(3)).replace(/^\./, "0.");
  return `${n} ${UNIT_SPOKEN[unit][dose === 1 ? 0 : 1]}`;
}

export const DRUG_SPOKEN: Record<DrugId, string> = {
  heparin: "heparin",
  protamine: "protamine",
  gtn: "GTN",
  adenosine: "adenosine",
  verapamil: "verapamil",
  atropine: "atropine",
  metaraminol: "metaraminol",
  phenylephrine: "phenylephrine",
  noradrenaline: "noradrenaline",
  adrenaline: "adrenaline",
  midazolam: "midazolam",
  fentanyl: "fentanyl",
  chlorphenamine: "chlorphenamine",
  hydrocortisone: "hydrocortisone",
  flumazenil: "flumazenil",
  naloxone: "naloxone",
  diazepam: "diazepam",
  propofol: "propofol",
  dobutamine: "dobutamine",
  dopamine: "dopamine",
  vasopressin: "vasopressin",
  isoprenaline: "isoprenaline",
  furosemide: "furosemide",
  salbutamol: "salbutamol",
  amiodarone: "amiodarone",
  lidocaine: "lidocaine",
  metoprolol: "metoprolol",
  flecainide: "flecainide",
  aminophylline: "aminophylline",
  nicardipine: "nicardipine",
  nitroprusside: "nitroprusside",
  eptifibatide: "eptifibatide",
  tirofiban: "tirofiban",
  cangrelor: "cangrelor",
  bivalirudin: "bivalirudin",
  idarucizumab: "idarucizumab",
  andexanet: "andexanet alfa",
  pcc: "prothrombin complex concentrate",
  aspirin: "aspirin",
  clopidogrel: "clopidogrel",
  prasugrel: "prasugrel",
  ticagrelor: "ticagrelor",
};

export const ROUTE_SPOKEN: Record<Route, string> = {
  iv: "IV",
  ic: "intracoronary",
  ia: "intra-arterial",
  im: "IM",
  neb: "nebulised",
  oral: "orally",
  crushed: "crushed",
};

/** C-arm view as spoken: "LAO 30, cranial 20", "RAO 30, caudal 25", "AP, cranial 30", "left lateral". */
export function spokenView(laoRao: number, cran: number): string {
  const r = (x: number) => Math.round(x);
  const a = r(laoRao);
  const c = r(cran);
  const first = a === 0 ? "AP" : a === 90 ? "left lateral" : a === -90 ? "right lateral" : a > 0 ? `LAO ${a}` : `RAO ${-a}`;
  const second = c === 0 ? (a === 0 || Math.abs(a) === 90 ? "" : "straight") : c > 0 ? `cranial ${c}` : `caudal ${-c}`;
  return second ? `${first}, ${second}` : first;
}

/** Examples for the palette's suggestions and the help list (every intent kind has one). */
export const COMMAND_EXAMPLES: { text: string; role: Exclude<RoleId, "operator">; hint: string }[] = [
  { text: "Heparin 5,000 units IV", role: "scrub", hint: "drug, dose, route" },
  { text: "Heparin 70 units per kilo", role: "scrub", hint: "weight-based dose" },
  { text: "200 micrograms GTN intracoronary", role: "scrub", hint: "drawn up for the table" },
  { text: "Adenosine 200 micrograms IC down the left", role: "scrub", hint: "drawn up for the table" },
  { text: "Give it", role: "scrub", hint: "give the syringe on the table" },
  { text: "ACT please", role: "scrub", hint: "activated clotting time" },
  { text: "6 French JL4", role: "scrub", hint: "open a catheter" },
  { text: "6 French extra backup 3.5 guide", role: "scrub", hint: "open a guide" },
  { text: "Workhorse wire", role: "scrub", hint: "open a coronary wire" },
  { text: "3.0 by 15 non-compliant balloon", role: "scrub", hint: "open a balloon" },
  { text: "3.5 by 18 stent", role: "scrub", hint: "open a stent" },
  { text: "Check the label", role: "scrub", hint: "read the item's label" },
  { text: "Hold the wire", role: "scrub", hint: "the scrub nurse fixes the wire" },
  { text: "I have the wire", role: "scrub", hint: "take the wire back" },
  { text: "LAO 30 cranial 20", role: "radiographer", hint: "C-arm view" },
  { text: "RAO 30 caudal 25", role: "radiographer", hint: "C-arm view" },
  { text: "10 more cranial", role: "radiographer", hint: "relative C-arm move" },
  { text: "Fluoro 7.5 frames", role: "radiographer", hint: "fluoroscopy pulse rate" },
  { text: "Cine 15", role: "radiographer", hint: "cine frame rate" },
  { text: "Field 20", role: "radiographer", hint: "field of view, cm" },
  { text: "Low dose fluoro", role: "radiographer", hint: "fluoroscopy level" },
  { text: "Store that fluoro", role: "radiographer", hint: "keep the last fluoroscopy loop" },
  { text: "Table up", role: "radiographer", hint: "table height" },
  { text: "Reset the timer", role: "radiographer", hint: "five-minute screening signal" },
  { text: "How much screening?", role: "radiographer", hint: "fluoroscopy time" },
  { text: "Zero please", role: "physiologist", hint: "zero the transducer" },
  { text: "Record", role: "physiologist", hint: "record pressures" },
  { text: "12-lead please", role: "physiologist", hint: "12-lead ECG" },
  { text: "Cycle the BP", role: "physiologist", hint: "non-invasive pressure" },
  { text: "What's the pressure?", role: "physiologist", hint: "arterial pressure" },
  { text: "Silence the alarms", role: "physiologist", hint: "silence for two minutes" },
  { text: "How much contrast?", role: "scrub", hint: "contrast so far" },
  { text: "Give 2 mg midazolam", role: "sedation", hint: "sedation" },
  { text: "Fentanyl 25 micrograms IV", role: "sedation", hint: "analgesia" },
  { text: "Atropine 600 micrograms IV", role: "sedation", hint: "drug, dose, route" },
  { text: "Metaraminol 1 mg IV", role: "sedation", hint: "drug, dose, route" },
  { text: "Flumazenil 0.2 mg IV", role: "sedation", hint: "reverse a benzodiazepine in steps" },
  { text: "Naloxone 0.1 mg IV", role: "sedation", hint: "reverse an opioid in steps" },
  { text: "Salbutamol 5 mg nebulised", role: "sedation", hint: "bronchospasm" },
  { text: "Ticagrelor 180 mg crushed", role: "sedation", hint: "oral load, crushed or whole" },
  { text: "250 mL saline bolus", role: "sedation", hint: "fluid" },
  { text: "Oxygen 2 litres", role: "sedation", hint: "nasal oxygen" },
  { text: "What are the sats?", role: "sedation", hint: "SpO2" },
  { text: "Pads on", role: "sedation", hint: "defibrillator pads" },
  { text: "Charge to 200", role: "sedation", hint: "defibrillator" },
  { text: "Stand clear", role: "sedation", hint: "before a shock" },
  { text: "Shock", role: "sedation", hint: "deliver the shock" },
  { text: "Start CPR", role: "sedation", hint: "chest compressions" },
  { text: "Adenosine infusion at 140", role: "scrub", hint: "micrograms per kilo per minute" },
  { text: "Stop the adenosine", role: "scrub", hint: "stop an infusion" },
  { text: "Breathe in and hold", role: "patient", hint: "breath-hold for cine" },
  { text: "Breathe away", role: "patient", hint: "release the breath-hold" },
  { text: "You'll feel a warm flush", role: "patient", hint: "warn before contrast" },
  { text: "You may feel some chest tightness", role: "patient", hint: "warn before adenosine or inflation" },
  { text: "Sharp scratch", role: "patient", hint: "warn before local or puncture" },
  { text: "Any chest pain?", role: "patient", hint: "ask the patient" },
  { text: "How are you feeling?", role: "patient", hint: "ask the patient" },
  { text: "Keep nice and still", role: "patient", hint: "patient instruction" },
  { text: "You're doing really well", role: "patient", hint: "reassure" },
  { text: "Correct", role: "scrub", hint: "confirm a read-back" },
  { text: "No", role: "scrub", hint: "reject a read-back" },
  { text: "Cancel that", role: "scrub", hint: "cancel the last order" },
];
