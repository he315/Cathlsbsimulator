// Build the CoronaryDominance part of the real-angiogram library.
//
// Source: Kruzhilov I, Mazanov G, Ponomarchuk A, et al. CoronaryDominance:
// angiogram dataset for coronary dominance classification. Sci Data 2025.
// https://doi.org/10.1038/s41597-025-04676-8 · Hugging Face BearSubj13/CoronaryDominance
// (revision 6e1f63f) · licence CC0 1.0.
// Changes for the app: float frames converted to 8-bit and re-encoded as JPEG.
//
// Usage: node scripts/angio_library/build_dominance.mjs <extracted-root> [maxStudies]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readZip, convertRun, STUDY_RE, DATASET_META } from "./dominance_common.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SRC = path.resolve(process.argv[2] ?? path.join(ROOT, "datasets/extracted/CoronaryDominance"));
const MAX = Number(process.argv[3] ?? 1e9);
const OUT = path.join(ROOT, "datasets/library/dominance");
const TMP = path.join(ROOT, "datasets/tmp/dominance");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

// --- walk studies ------------------------------------------------------------------
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".npz")) out.push(p);
  }
  return out;
}

const files = walk(SRC);
const studies = new Map();
for (const f of files) {
  const m = STUDY_RE.exec(f);
  if (!m) continue;
  const key = m[2];
  if (!studies.has(key)) studies.set(key, { dominance: m[1].toLowerCase(), seq: m[3], subset: path.basename(path.dirname(path.dirname(path.dirname(path.dirname(f))))), files: [] });
  studies.get(key).files.push({ f, artery: m[4] });
}

const index = { ...DATASET_META, subset: "domain-shift dataset", patients: [] };
const existing = fs.existsSync(path.join(OUT, "index.json")) ? JSON.parse(fs.readFileSync(path.join(OUT, "index.json"), "utf8")) : null;
const done = new Map((existing?.patients ?? []).map((p) => [p.id, p]));

let n = 0;
for (const [key, st] of [...studies.entries()].sort()) {
  if (n >= MAX) break;
  const pid = `cd-${st.seq}`;
  if (done.has(pid)) {
    index.patients.push(done.get(pid));
    n++;
    continue;
  }
  const runs = [];
  for (const { f, artery } of st.files.sort((a, b) => a.f.localeCompare(b.f))) {
    let entries;
    try {
      entries = readZip(fs.readFileSync(f));
    } catch (e) {
      console.warn("skip (unreadable)", path.basename(f), e.message);
      continue;
    }
    const runId = `${pid}-${artery}-${runs.length + 1}`;
    const rec = convertRun(entries, runId, artery, OUT, TMP);
    if (!rec) continue;
    runs.push(rec);
    console.log(runId, rec.frames.length, "frames", artery);
  }
  if (runs.length) index.patients.push({ id: pid, dominance: st.dominance, runs });
  n++;
  fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index, null, 1));
}
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index, null, 1));
console.log("studies", index.patients.length, "runs", index.patients.reduce((a, p) => a + p.runs.length, 0));
