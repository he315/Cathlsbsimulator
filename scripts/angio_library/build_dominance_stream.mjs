// Build the CoronaryDominance "main_others" part of the real-angiogram library
// straight from the 7-Zip archive, without unpacking it to disk.
//
// Source: Kruzhilov I, et al. CoronaryDominance. Sci Data 2025.
// https://doi.org/10.1038/s41597-025-04676-8 · licence CC0 1.0.
//
// The archive is solid, so the selected members are requested in one pass with
// `unar -o -` and the stream is split by the member sizes from `lsar -l -i`.
// Each member is checked to be a complete zip before it is converted.
//
// Usage: node scripts/angio_library/build_dominance_stream.mjs <main_others.7z> [categories]
//   categories: comma list, default "artifact,challenging_case,occlusion"
import fs from "node:fs";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readZip, convertRun, STUDY_RE, DATASET_META } from "./dominance_common.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ARCHIVE = path.resolve(process.argv[2] ?? path.join(ROOT, "datasets/raw/CoronaryDominance/main_others.7z"));
const CATS = (process.argv[3] ?? "artifact,challenging_case,occlusion").split(",");
const OUT = path.join(ROOT, "datasets/library/dominance-main");
const TMP = path.join(ROOT, "datasets/tmp/dominance-main");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

const CATEGORY_NAME = { artifact: "artefact", challenging_case: "challenging", occlusion: "occlusion", bad_quality: "poor quality", indefinite_type: "indeterminate dominance" };

// 1) list members
const listing = execFileSync("lsar", ["-l", "-i", ARCHIVE], { maxBuffer: 64 << 20 }).toString("utf8");
const members = [];
for (const line of listing.split("\n")) {
  const m = /^\s*(\d+)\.\s+\S+\s+(\d+)\s+\S+\s+\S+\s+\S+\s+\S+\s+(.*\.npz)$/.exec(line);
  if (!m) continue;
  const name = m[3];
  const cat = name.split("/")[1];
  if (!CATS.includes(cat)) continue;
  const s = STUDY_RE.exec(name);
  if (!s) continue;
  members.push({ index: Number(m[1]), size: Number(m[2]), name, cat, dominance: s[1].toLowerCase(), seq: s[3], artery: s[4] });
}
members.sort((a, b) => a.index - b.index);
if (!members.length) throw new Error("no members selected");
console.log("selected", members.length, "members,", (members.reduce((a, m) => a + m.size, 0) / 1e9).toFixed(1), "GB uncompressed");

// 2) resume from an existing index
const indexPath = path.join(OUT, "index.json");
const prev = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, "utf8")) : null;
const patients = new Map((prev?.patients ?? []).map((p) => [p.id, p]));
const doneNames = new Set(prev?.sourceMembers ?? []);
const index = { ...DATASET_META, subset: "main dataset: occlusion, artefact and challenging-case studies", patients: [], sourceMembers: [...doneNames] };
const save = () => {
  index.patients = [...patients.values()].sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 1));
};

function handle(m, buf) {
  if (buf.readUInt32LE(0) !== 0x04034b50) throw new Error(`stream out of step at member ${m.index} (no zip header)`);
  if (doneNames.has(m.name)) return;
  let entries;
  try {
    entries = readZip(buf);
  } catch (e) {
    throw new Error(`stream out of step at member ${m.index}: ${e.message}`);
  }
  const pid = `cdm-${m.seq}`;
  if (!patients.has(pid)) patients.set(pid, { id: pid, dominance: m.dominance, category: CATEGORY_NAME[m.cat] ?? m.cat, runs: [] });
  const p = patients.get(pid);
  const runId = `${pid}-${m.artery}-${p.runs.length + 1}`;
  const rec = convertRun(entries, runId, m.artery, OUT, TMP);
  if (rec) {
    p.runs.push(rec);
    console.log(runId, rec.frames.length, "frames", m.cat, rec.angles ? `${rec.angles.primary.toFixed(1)}/${rec.angles.secondary.toFixed(1)}` : "no angles");
  } else console.warn("skip (unusable frames)", m.index);
  doneNames.add(m.name);
  index.sourceMembers.push(m.name);
  save();
}

// 3) stream
const child = spawn("unar", ["-q", "-o", "-", "-i", ARCHIVE, ...members.map((m) => String(m.index))], { stdio: ["ignore", "pipe", "inherit"] });
let k = 0;
let cur = Buffer.allocUnsafe(members[0].size);
let filled = 0;
child.stdout.on("data", (chunk) => {
  let off = 0;
  while (off < chunk.length) {
    if (k >= members.length) throw new Error("more data than the listing predicts");
    const need = members[k].size - filled;
    const take = Math.min(need, chunk.length - off);
    chunk.copy(cur, filled, off, off + take);
    filled += take;
    off += take;
    if (filled === members[k].size) {
      handle(members[k], cur);
      k++;
      filled = 0;
      if (k < members.length) cur = Buffer.allocUnsafe(members[k].size);
    }
  }
});
child.on("close", (code) => {
  save();
  const runs = index.patients.reduce((a, p) => a + p.runs.length, 0);
  console.log("unar exit", code, "members read", k, "of", members.length, "· studies", index.patients.length, "runs", runs);
  if (k !== members.length) process.exitCode = 1;
});
