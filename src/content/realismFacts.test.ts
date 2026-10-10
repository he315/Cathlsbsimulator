// repair-model-parameter-facts: the facts files written for the packages of lab build runs 1 to 3
// (docs/realism/facts/pkg-<package id>.md) list constants that exist in the code, with the values the
// code holds; closure.ts names a facts file that exists; the README lists every new file.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { MP_FEMORAL } from "../simulation/access/closure";
import { MP_COMPRESSION } from "../simulation/access/compression";
import { MP_SITE } from "../simulation/access/site";
import { MP_MICRO, MP_NEEDLE } from "../simulation/access/ultrasound";
import { MP_UPSIZING } from "../simulation/access/upsizing";
import { CONUS_OVERSELECTION_THRESHOLDS } from "../simulation/engagement";
import { CROSS_P_CATHETER, FEMORAL_DELAY_S } from "../simulation/haemo/avCrossing";
import { CALC_TOLERANCE, HAEMO_LINE, MP_CHEST_DEPTH_CM } from "../simulation/haemoStudy";
import { MP_CAUSES, RHC_REFERENCE } from "../simulation/patient/hypotensionCauses";
import { MP_EMERGENCY } from "../simulation/patient/responses";
import { MP_FAULT_DRIFT_MMHG, MP_FLUSH_VISIBLE, MP_WALL_CONTACT_PER_N } from "../simulation/patient/transducer";
import { ENGINE_SEVERITY_MAP, HANDOVER_LEAK, REGIONAL_PPC_CAP } from "../simulation/pericardiocentesis";
import { MP_IV_RAMP_S } from "../simulation/pci/pwSession";
import { MP_START_WIRE } from "../simulation/pci/actions/scenario";
import { MP_PENETRATION_MM } from "../simulation/pci/ivus";
import { MP_OCT_CLEAR_MAX_LUMEN_MM } from "../simulation/pciBench";
import { MP_KISS_OVAL } from "../simulation/bench/bifurcation";
import { MP_PLATFORM_STRUT_MM } from "../simulation/bench/platforms";
import { MP_EMERGENCIES } from "../simulation/session/emergencies";
import { MP_HYPOTENSION } from "../simulation/session/hypotension";
import { COURSE, COURSE_RESPONSE } from "../simulation/tavi";
import { RECOVERY_S, TS_HEPARIN, TS_MECH } from "../simulation/transseptal";
import { VERY_DILATED_ROOT_RADIUS } from "../simulation/anatomy";
import { PATIENT_EVENT_THRESHOLDS } from "../ui/lab/patientEvents";
import { TRANSIENT_HOLD_S } from "../ui/lab/eventLog";

const REPO = join(__dirname, "..", "..");
const FACTS = join(REPO, "docs", "realism", "facts");
const read = (rel: string) => readFileSync(join(REPO, rel), "utf8");

/** The facts files this package wrote, one per package of runs 1 to 3 that added model parameters. */
const PACKAGES = [
  "access-closure-femoral-manual",
  "access-femoral-puncture",
  "access-femoral-upsizing-angiogram",
  "access-multi-site",
  "angio-expert-label-drills",
  "diag-anatomy-variants",
  "diag-engagement-fallback",
  "diag-lab-drugs",
  "diag-lesion-morphologies",
  "diag-lv-aorta-render",
  "diag-pressure-transducer",
  "diag-rod-physics",
  "diag-scenario-registry",
  "diag-tip-context",
  "found-lab-session-plumbing",
  "haemo-aortic-stenosis-studies",
  "haemo-study-session-and-tips",
  "haemo-transducer-and-setup",
  "pci-bench-bifurcation",
  "pci-bench-imaging-unify",
  "pci-bench-stent-platforms-sizing",
  "pci-scenario-registry",
  "pericardiocentesis-tips-and-pci-handover",
  "physiology-engine-unify-and-setup",
  "proc-anaphylaxis-vagal",
  "proc-foundation-scenarios-ledger",
  "proc-hypotension-pressors",
  "proc-tip-context",
  "structural-tips-and-tavi-course",
  "structural-transseptal-hands-on",
  "xray-device-fluoro-views",
] as const;

/** A facts table row: the backticked names of its first cell, its source file(s) and its Value cell. */
interface FactsRow {
  names: string[];
  /** The first source file the File cell gives: the file the constant is read from. */
  file: string;
  /** Every source file the File cell names (a row may add where a type is declared). */
  files: string[];
  value: string;
  line: string;
}

/** Table rows whose first cell names constants in backticks and whose second cell is a source file. */
function constantRows(md: string): FactsRow[] {
  const out: FactsRow[] = [];
  for (const line of md.split("\n")) {
    if (!line.startsWith("| `") && !/^\| [^|]*`[^`]+`/.test(line)) continue;
    const cells = line.split("|").map((c) => c.trim());
    const first = cells[1] ?? "";
    const files = [...(cells[2] ?? "").matchAll(/src\/[\w./-]+\.tsx?/g)].map((m) => m[0]);
    if (!files.length) continue;
    const names = [...first.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    if (names.length) out.push({ names, file: files[0], files, value: cells[3] ?? "", line });
  }
  return out;
}

/** A backticked name cut to its dotted parts, without a leading '=', a call or an index. */
function partsOf(name: string): string[] | null {
  const cleaned = name.replace(/^=\s*/, "").replace(/\(.*$/, "").replace(/\[.*$/, "").trim();
  const parts = cleaned.split(".").filter(Boolean);
  const last = parts[parts.length - 1] ?? "";
  return /^[A-Za-z_][\w-]*$/.test(last) ? parts : null;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The name occurs as a whole identifier (not as part of a longer one). */
const hasWord = (src: string, id: string) => new RegExp(`(?<![\\w-])${escapeRe(id)}(?![\\w-])`).test(src);

/** The name is declared (const, let, function, class, type, interface, enum) or is an object key. */
const isDeclared = (src: string, id: string) =>
  new RegExp(`\\b(?:const|let|var|function|class|type|interface|enum)\\s+${escapeRe(id)}\\b`).test(src) ||
  new RegExp(`(?<![\\w.-])${escapeRe(id)}\\??\\s*:`).test(src);

const NUM = "(-?\\d+(?:\\.\\d+)?)";

/** The row in a package's facts file whose first cell names `name` exactly. */
function rowFor(pkg: string, name: string): FactsRow {
  const md = readFileSync(join(FACTS, `pkg-${pkg}.md`), "utf8");
  const row = constantRows(md).find((r) => r.names.includes(name));
  if (!row) throw new Error(`pkg-${pkg}.md has no row for \`${name}\``);
  return row;
}

/** The part of a row's Value cell that belongs to `name`: the whole cell, or its share of a ';' or ',' list. */
function valuePart(row: FactsRow, name: string): string {
  if (row.names.length === 1) return row.value;
  for (const sep of [";", ","]) {
    const parts = row.value.split(sep).map((p) => p.trim());
    if (parts.length === row.names.length) return parts[row.names.indexOf(name)];
  }
  throw new Error(`cannot split the Value cell '${row.value}' among ${row.names.join(", ")}`);
}

function numberAfter(text: string, label: string | undefined, where: string): number {
  const re = label ? new RegExp(`(?<![\\w-])${escapeRe(label)}\\s+${NUM}`) : new RegExp(NUM);
  const m = re.exec(text);
  if (!m) throw new Error(`${where}: no number${label ? ` after '${label}'` : ""} in '${text}'`);
  return Number(m[1]);
}

/**
 * The value a facts file states for `name`, read in the shape of the code's value: a number (the first number
 * in its part of the Value cell, or the one after `label`), an array (every number in the part), or an object
 * (the number after each key).
 */
function documented(pkg: string, name: string, shape: unknown, label?: string): unknown {
  const row = rowFor(pkg, name);
  const part = valuePart(row, name);
  const where = `pkg-${pkg}.md \`${name}\``;
  if (Array.isArray(shape)) return [...part.matchAll(new RegExp(NUM, "g"))].map((m) => Number(m[1]));
  if (shape && typeof shape === "object") {
    return Object.fromEntries(Object.keys(shape).map((k) => [k, numberAfter(part, k, where)]));
  }
  return numberAfter(part, label, where);
}

describe("model-parameter facts files (repair-model-parameter-facts)", () => {
  it("one facts file per package, each with a table", () => {
    for (const p of PACKAGES) {
      const f = join(FACTS, `pkg-${p}.md`);
      expect(existsSync(f), f).toBe(true);
      const md = readFileSync(f, "utf8");
      expect(md.startsWith(`# ${p}: model parameters`), p).toBe(true);
      expect(constantRows(md).length, p).toBeGreaterThan(0);
    }
  });

  it("every constant a facts file lists is named in the source file it gives", () => {
    const missing: string[] = [];
    let checked = 0;
    for (const p of PACKAGES) {
      for (const row of constantRows(readFileSync(join(FACTS, `pkg-${p}.md`), "utf8"))) {
        for (const f of row.files) expect(existsSync(join(REPO, f)), `${p}: ${f}`).toBe(true);
        const src = read(row.file);
        const all = row.files.map(read).join("\n");
        for (const n of row.names) {
          const parts = partsOf(n);
          if (!parts) continue;
          checked++;
          const id = parts[parts.length - 1];
          if (!hasWord(src, id)) missing.push(`${p}: ${id} not in ${row.file}`);
          // A dotted name's owner must be declared (or be an object key) where the row says.
          if (parts.length > 1 && /^[A-Za-z_]\w*$/.test(parts[0]) && !isDeclared(all, parts[0])) {
            missing.push(`${p}: ${parts[0]} (of ${n}) not declared in ${row.files.join(", ")}`);
          }
        }
      }
    }
    expect(missing).toEqual([]);
    expect(checked).toBeGreaterThan(300);
  });

  it("no row lacks a source or a model label", () => {
    const unlabelled: string[] = [];
    for (const p of PACKAGES) {
      for (const row of constantRows(readFileSync(join(FACTS, `pkg-${p}.md`), "utf8"))) {
        const restsOn = row.line.split("|").map((c) => c.trim()).filter(Boolean).pop() ?? "";
        if (restsOn.length < 4) unlabelled.push(`${p}: ${row.names.join(", ")}`);
      }
    }
    expect(unlabelled).toEqual([]);
  });

  it("spot-checks: the values the facts files state are the values in the code", () => {
    // [facts file, name as its row gives it, the code's value, label before the number when the cell lists several]
    const checks: [string, string, unknown, string?][] = [
      ["access-closure-femoral-manual", "MP_FEMORAL.inadequatePressureHaematoma", MP_FEMORAL.inadequatePressureHaematoma],
      ["access-closure-femoral-manual", "MP_FEMORAL.inadequatePressurePseudo", MP_FEMORAL.inadequatePressurePseudo],
      ["access-closure-femoral-manual", "MP_FEMORAL.perSys20Above140", MP_FEMORAL.perSys20Above140],
      ["access-closure-femoral-manual", "zoneMm", MP_COMPRESSION.zoneMm],
      ["access-closure-femoral-manual", "plugMin", MP_COMPRESSION.plugMin],
      ["access-closure-femoral-manual", "raisedSysMmHg", MP_COMPRESSION.raisedSysMmHg],
      ["access-femoral-puncture", "clearWindowMm", MP_SITE.clearWindowMm],
      ["access-femoral-puncture", "presetFasciaMm", MP_SITE.presetFasciaMm],
      ["access-femoral-puncture", "MP_NEEDLE.wireSteepDegFemoral", MP_NEEDLE.wireSteepDegFemoral],
      ["access-femoral-puncture", "MP_MICRO.branchReachMm", MP_MICRO.branchReachMm],
      ["access-femoral-upsizing-angiogram", "angioIodineShare", MP_UPSIZING.angioIodineShare],
      ["access-femoral-upsizing-angiogram", "wire035Mm", MP_UPSIZING.wire035Mm],
      ["diag-engagement-fallback", "CONUS_OVERSELECTION_THRESHOLDS", CONUS_OVERSELECTION_THRESHOLDS],
      ["haemo-aortic-stenosis-studies", "CROSS_P_CATHETER", CROSS_P_CATHETER.AL1, "AL1"],
      ["haemo-aortic-stenosis-studies", "FEMORAL_DELAY_S", FEMORAL_DELAY_S],
      ["haemo-transducer-and-setup", "MP_CHEST_DEPTH_CM", MP_CHEST_DEPTH_CM],
      ["haemo-study-session-and-tips", "CALC_TOLERANCE.tpg", CALC_TOLERANCE.tpg.abs, "abs"],
      ["haemo-transducer-and-setup", "HAEMO_LINE", HAEMO_LINE.dampingGain, "damping gain"],
      ["proc-hypotension-pressors", "bleedSlowAfterMl", MP_CAUSES.bleedSlowAfterMl],
      ["proc-hypotension-pressors", "raHighMmHg", RHC_REFERENCE.raHighMmHg],
      ["proc-anaphylaxis-vagal", "forcedVagalHoldS", MP_EMERGENCY.forcedVagalHoldS],
      ["diag-pressure-transducer", "MP_FAULT_DRIFT_MMHG", MP_FAULT_DRIFT_MMHG],
      ["diag-rod-physics", "MP_WALL_CONTACT_PER_N", MP_WALL_CONTACT_PER_N],
      ["haemo-transducer-and-setup", "MP_FLUSH_VISIBLE", MP_FLUSH_VISIBLE],
      ["pericardiocentesis-tips-and-pci-handover", "HANDOVER_LEAK.stopMmHg", HANDOVER_LEAK.stopMmHg],
      ["pericardiocentesis-tips-and-pci-handover", "ENGINE_SEVERITY_MAP", ENGINE_SEVERITY_MAP],
      ["pericardiocentesis-tips-and-pci-handover", "REGIONAL_PPC_CAP", REGIONAL_PPC_CAP],
      ["physiology-engine-unify-and-setup", "MP_IV_RAMP_S", MP_IV_RAMP_S],
      ["pci-scenario-registry", "MP_START_WIRE.BEYOND_MM", MP_START_WIRE.BEYOND_MM],
      ["pci-bench-imaging-unify", "MP_PENETRATION_MM", MP_PENETRATION_MM],
      ["pci-bench-stent-platforms-sizing", "MP_OCT_CLEAR_MAX_LUMEN_MM", MP_OCT_CLEAR_MAX_LUMEN_MM],
      ["pci-bench-bifurcation", "MP_KISS_OVAL", MP_KISS_OVAL],
      ["pci-bench-stent-platforms-sizing", "MP_PLATFORM_STRUT_MM", MP_PLATFORM_STRUT_MM.E, "E"],
      ["proc-anaphylaxis-vagal", "imWithinS", MP_EMERGENCIES.imWithinS],
      ["proc-anaphylaxis-vagal", "removalMagnitude", MP_EMERGENCIES.removalMagnitude.femoral, "femoral"],
      ["proc-hypotension-pressors", "reboundMapMmHg", MP_HYPOTENSION.reboundMapMmHg],
      ["structural-tips-and-tavi-course", "obstructionMap", COURSE.obstructionMap],
      ["structural-tips-and-tavi-course", "injectWithinS", COURSE_RESPONSE.injectWithinS],
      ["structural-transseptal-hands-on", "fossaMm", TS_MECH.fossaMm],
      ["structural-transseptal-hands-on", "TS_HEPARIN.onEntryS", TS_HEPARIN.onEntryS],
      ["structural-transseptal-hands-on", "RECOVERY_S", RECOVERY_S],
      ["diag-anatomy-variants", "VERY_DILATED_ROOT_RADIUS", VERY_DILATED_ROOT_RADIUS],
      ["found-lab-session-plumbing", "tamponadeMl", PATIENT_EVENT_THRESHOLDS.tamponadeMl],
      ["found-lab-session-plumbing", "TRANSIENT_HOLD_S", TRANSIENT_HOLD_S],
    ];
    expect(checks.length).toBeGreaterThanOrEqual(44);
    for (const [pkg, name, code, label] of checks) {
      expect(code, `${name}: the code value`).not.toBeUndefined();
      expect(documented(pkg, name, code, label), `pkg-${pkg}.md \`${name}\``).toEqual(code);
    }
  });

  it("closure.ts names facts files that exist", () => {
    const src = read("src/simulation/access/closure.ts");
    expect(src).not.toMatch(/facts\/C5\.md/);
    const named = [...src.matchAll(/docs\/realism\/facts\/[\w.-]+\.md/g)].map((m) => m[0]);
    expect(named.length).toBeGreaterThan(0);
    for (const f of named) expect(existsSync(join(REPO, f)), f).toBe(true);
  });

  it("the facts README lists every new file", () => {
    const readme = readFileSync(join(FACTS, "README.md"), "utf8");
    for (const p of PACKAGES) expect(readme, p).toContain(`pkg-${p}.md`);
  });
});
