// Development only: live status of the build agents for build.html.
//
// GET /__build/status returns what the background workflows are doing right now, read straight
// from Claude Code's workflow journals and agent transcripts on this machine:
//   - every workflow run (active or finished), with agents done, running and failed
//   - each running agent: what it is, when it started, and its latest actions (file reads,
//     edits, commands, PubMed searches), from the tail of its transcript
//   - a log of agent starts and finishes
//   - module and lab-build progress (docs/curriculum), files changed recently, machine load,
//     and the latest whole-suite test result
// Nothing leaves the machine; the page and the endpoint exist only in the dev server.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const TAIL_BYTES = 256 * 1024;
const ACTIVE_MS = 15 * 60 * 1000; // a run with no agent activity for 15 minutes is not active
const CACHE_MS = 2000;

function readJson(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function readTail(p, bytes = TAIL_BYTES) {
  try {
    const fd = fs.openSync(p, "r");
    const size = fs.fstatSync(fd).size;
    const start = Math.max(0, size - bytes);
    const buf = Buffer.alloc(size - start);
    fs.readSync(fd, buf, 0, buf.length, start);
    fs.closeSync(fd);
    const text = buf.toString("utf8");
    return start > 0 ? text.slice(text.indexOf("\n") + 1) : text;
  } catch {
    return "";
  }
}

function readHead(p, bytes = 8192) {
  try {
    const fd = fs.openSync(p, "r");
    const buf = Buffer.alloc(bytes);
    const n = fs.readSync(fd, buf, 0, bytes, 0);
    fs.closeSync(fd);
    return buf.toString("utf8", 0, n);
  } catch {
    return "";
  }
}

const base = (p) => (p ? String(p).split("/").pop() : "");

/** One line a person can read for a tool call. */
function describeTool(name, input = {}) {
  const i = input || {};
  switch (name) {
    case "Read":
      return `Reading ${base(i.file_path)}${i.pages ? ` (pages ${i.pages})` : ""}`;
    case "Write":
      return `Writing ${base(i.file_path)}`;
    case "Edit":
      return `Editing ${base(i.file_path)}`;
    case "Grep":
      return `Searching for "${String(i.pattern || "").slice(0, 60)}"`;
    case "Glob":
      return `Listing ${String(i.pattern || "").slice(0, 60)}`;
    case "Bash": {
      let c = String(i.command || "").replace(/\s+/g, " ").trim();
      c = c.replace(/^cd "[^"]*"\s*(&&|;)\s*/, "").replace(/^cd \S+\s*(&&|;)\s*/, "");
      if (/vitest run/.test(c)) return `Running tests: ${c.match(/vitest run\s*([^|;&]*)/)?.[1]?.trim() || "suite"}`;
      if (/tsc -p/.test(c)) return "Typechecking the app";
      if (/overlap\.py/.test(c)) return "Running the copy check against the books";
      if (i.description) return String(i.description).slice(0, 110);
      return `Running: ${c.slice(0, 100)}`;
    }
    case "ToolSearch":
      return "Loading tools";
    case "StructuredOutput":
      return "Reporting its result";
    default:
      if (/pubmed__search/.test(name)) return `Searching PubMed: ${String(i.query || i.term || "").slice(0, 80)}`;
      if (/pubmed__/.test(name)) return `Checking a PubMed record${i.pmid || i.pmids ? ` (${[].concat(i.pmid || i.pmids).slice(0, 3).join(", ")})` : ""}`;
      if (/Claude_Browser__/.test(name)) return `Using the browser: ${name.split("__").pop()}`;
      return name.replace(/^mcp__[^_]+__/, "");
  }
}

/** The latest actions of an agent, newest last. */
function agentActivity(file) {
  const out = [];
  for (const line of readTail(file).split("\n")) {
    if (!line) continue;
    let e;
    try {
      e = JSON.parse(line);
    } catch {
      continue;
    }
    const m = e.message;
    if (e.type !== "assistant" || !m || !Array.isArray(m.content)) continue;
    for (const c of m.content) {
      if (c.type === "tool_use") out.push({ t: e.timestamp, kind: "tool", text: describeTool(c.name, c.input) });
      else if (c.type === "text" && c.text?.trim()) out.push({ t: e.timestamp, kind: "say", text: c.text.trim().replace(/\s+/g, " ").slice(0, 220) });
    }
  }
  return out.slice(-6);
}

const firstTs = new Map();
function firstTimestamp(file) {
  if (firstTs.has(file)) return firstTs.get(file);
  const m = readHead(file).match(/"timestamp":"([^"]+)"/);
  const t = m ? m[1] : null;
  if (t) firstTs.set(file, t);
  return t;
}

const STAGE_TEXT = {
  write: "Writing",
  source: "Checking against the books",
  "source-retry": "Checking against the books (retry)",
  clinical: "Clinical expert check",
  "clinical-retry": "Clinical expert check (retry)",
  fix: "Fixing",
  recheck: "Rechecking",
  fix2: "Final fixes",
  plan: "Planning",
  build: "Building",
  review: "Reviewing",
  verify: "Verifying in the app",
  accept: "Acceptance check",
  fix3: "Fixing after the acceptance check",
  gate: "Running the whole test suite",
};
const LABEL_TEXT = {
  "academy-fixes": "Correcting older Academy lessons",
  synthesise: "Writing the lab build plan",
  critique: "Critiquing the lab build plan",
  revise: "Revising the lab build plan",
};
const PLAN_GROUPS = { pci: "PCI lab", diag: "cath lab and reading drills", proc: "full procedure and access", dev: "bench, pressure wire, haemodynamics, devices and structural" };

export default function buildStatus(root) {
  const projSlug = path.resolve(root).replace(/[/ ]/g, "-");
  const projDir = path.join(os.homedir(), ".claude", "projects", projSlug);
  const curriculum = path.join(root, "docs", "curriculum");
  let cache = { t: 0, body: null };
  const finishedRuns = new Map(); // run id -> { mtime, run, log, stages }
  let changedCache = { t: 0, list: [] };
  let lastRefresh = 0;
  let refreshing = false;

  function titles() {
    const plan = readJson(path.join(curriculum, "module-plan.json"), []);
    const lab = readJson(path.join(curriculum, "lab-build-plan.json"), []);
    const m = {};
    for (const x of plan) m[x.moduleId] = x.title;
    for (const x of Array.isArray(lab) ? lab : lab.workPackages || []) m[x.id] = x.title;
    return m;
  }

  function friendly(label, names) {
    if (LABEL_TEXT[label]) return { what: LABEL_TEXT[label], subject: "" };
    const i = label.indexOf(":");
    if (i < 0) return { what: label, subject: "" };
    const stage = label.slice(0, i);
    const id = label.slice(i + 1);
    if (stage === "plan") return { what: "Planning the lab build", subject: PLAN_GROUPS[id] || id };
    return { what: STAGE_TEXT[stage] || stage, subject: names[id] || id, id, stage };
  }

  function runNames() {
    return readJson(path.join(curriculum, "dashboard", "run-names.json"), {});
  }

  function listRuns() {
    const runs = [];
    let sessions = [];
    try {
      sessions = fs.readdirSync(projDir);
    } catch {
      return runs;
    }
    for (const s of sessions) {
      const wf = path.join(projDir, s, "subagents", "workflows");
      let ids = [];
      try {
        ids = fs.readdirSync(wf);
      } catch {
        continue;
      }
      for (const id of ids) runs.push({ id, dir: path.join(wf, id), scripts: path.join(projDir, s, "workflows", "scripts") });
    }
    return runs;
  }

  function compute() {
    const names = titles();
    const rn = runNames();
    const now = Date.now();
    const runs = [];
    const running = [];
    const log = [];
    const moduleStage = {};
    for (const r of listRuns()) {
      const journal = path.join(r.dir, "journal.jsonl");
      if (!fs.existsSync(journal)) continue;
      const jm = fs.statSync(journal).mtimeMs;
      const cached = finishedRuns.get(r.id);
      if (cached && cached.mtime === jm) {
        runs.push(cached.run);
        log.push(...cached.log);
        for (const [id, st] of Object.entries(cached.stages)) moduleStage[id] = { ...(moduleStage[id] || {}), ...st };
        continue;
      }
      const runLogStart = log.length;
      const stagesBefore = JSON.stringify(moduleStage);
      const started = new Map();
      const results = new Map();
      for (const line of fs.readFileSync(journal, "utf8").split("\n")) {
        if (!line) continue;
        let e;
        try {
          e = JSON.parse(line);
        } catch {
          continue;
        }
        if (e.type === "started") started.set(e.key, e);
        else if (e.type === "result") results.set(e.key, e);
      }
      let lastActivity = 0;
      let firstStart = null;
      let done = 0;
      let failed = 0;
      const live = [];
      for (const [key, e] of started) {
        const file = path.join(r.dir, `agent-${e.agentId}.jsonl`);
        let mtime = 0;
        try {
          mtime = fs.statSync(file).mtimeMs;
        } catch {}
        lastActivity = Math.max(lastActivity, mtime);
        const res = results.get(key);
        const f = friendly(e.label || "", names);
        const t0 = firstTimestamp(file);
        if (t0 && (!firstStart || t0 < firstStart)) firstStart = t0;
        if (res) {
          if (res.result === null || res.result === undefined) failed++;
          else done++;
          log.push({ t: mtime ? new Date(mtime).toISOString() : t0, kind: res.result == null ? "failed" : "finished", what: f.what, subject: f.subject, run: r.id });
          if (f.id && f.stage) {
            const st = (moduleStage[f.id] ||= {});
            st[f.stage] = { done: true, passed: res.result && typeof res.result === "object" && "passed" in res.result ? !!res.result.passed : undefined, findings: Array.isArray(res.result?.findings) ? res.result.findings.length : undefined, t: mtime };
          }
        } else {
          live.push({ key, e, file, mtime, f, t0 });
          if (t0) log.push({ t: t0, kind: "started", what: f.what, subject: f.subject, run: r.id });
          if (f.id && f.stage) {
            const st = (moduleStage[f.id] ||= {});
            if (!st[f.stage]?.done) st[f.stage] = { done: false, t: mtime };
          }
        }
      }
      const active = live.length > 0 && now - lastActivity < ACTIVE_MS;
      let name = rn[r.id];
      if (!name) {
        try {
          const s = fs.readdirSync(r.scripts).find((f) => f.endsWith(`${r.id}.js`));
          if (s) name = s.replace(`-${r.id}.js`, "").replace(/^cathmaster-/, "").replace(/-/g, " ");
        } catch {}
      }
      const runObj = { id: r.id, name: name || r.id, active, done, failed, live: active ? live.length : 0, total: started.size, firstStart, lastActivity: lastActivity ? new Date(lastActivity).toISOString() : null };
      runs.push(runObj);
      if (!active && now - lastActivity > ACTIVE_MS) {
        // finished (or abandoned) run: remember it so later polls skip the work
        const stages = {};
        const before = JSON.parse(stagesBefore);
        for (const [id, st] of Object.entries(moduleStage)) if (JSON.stringify(st) !== JSON.stringify(before[id])) stages[id] = st;
        finishedRuns.set(r.id, { mtime: jm, run: runObj, log: log.slice(runLogStart), stages });
      }
      if (active)
        for (const a of live)
          running.push({
            run: r.id,
            runName: name || r.id,
            label: a.e.label,
            phase: a.e.phase,
            what: a.f.what,
            subject: a.f.subject,
            startedAt: a.t0,
            lastAt: a.mtime ? new Date(a.mtime).toISOString() : null,
            activity: agentActivity(a.file),
          });
    }
    runs.sort((a, b) => String(b.lastActivity).localeCompare(String(a.lastActivity)));
    log.sort((a, b) => String(b.t).localeCompare(String(a.t)));

    // lab build packages: done when an accept: (or verify: when no accept stage exists) result exists
    const labPlanRaw = readJson(path.join(curriculum, "lab-build-plan.json"), []);
    const labPlan = (Array.isArray(labPlanRaw) ? labPlanRaw : labPlanRaw.workPackages || []).map((p) => {
      const st = moduleStage[p.id] || {};
      const stages = Object.keys(st);
      const state = st.accept?.done && st.accept.passed !== false ? "done" : st.accept?.done && st.accept.passed === false && !stages.some((s) => !st[s].done) ? "failed" : stages.some((s) => !st[s].done) ? "running" : stages.length ? "started" : "pending";
      return { id: p.id, title: p.title, lab: p.lab, phase: p.phase, size: p.size, priority: p.priority, state };
    });

    const snapshot = readJson(path.join(curriculum, "dashboard", "snapshot.json"), null);

    // files changed in the last 90 minutes (rescanned every 10 seconds)
    const changed = now - changedCache.t < 10000 ? changedCache.list : [];
    const rescan = now - changedCache.t >= 10000;
    const walk = (dir, depth = 0) => {
      let ents = [];
      try {
        ents = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const d of ents) {
        if (d.name.startsWith(".") || d.name === "node_modules") continue;
        const p = path.join(dir, d.name);
        if (d.isDirectory()) {
          if (depth < 6) walk(p, depth + 1);
        } else {
          try {
            const m = fs.statSync(p).mtimeMs;
            if (now - m < 90 * 60 * 1000) changed.push({ path: path.relative(root, p), t: new Date(m).toISOString() });
          } catch {}
        }
      }
    };
    if (rescan) {
      for (const d of ["src", "docs", "scripts"]) walk(path.join(root, d));
      changed.sort((a, b) => b.t.localeCompare(a.t));
      changedCache = { t: now, list: changed };
    }

    // latest whole-suite test result
    let tests = null;
    try {
      const dir = path.join(root, "docs", "critique");
      const f = fs
        .readdirSync(dir)
        .filter((x) => x.startsWith("test-run"))
        .map((x) => ({ x, m: fs.statSync(path.join(dir, x)).mtimeMs }))
        .sort((a, b) => b.m - a.m)[0];
      if (f) {
        const txt = fs.readFileSync(path.join(dir, f.x), "utf8");
        const files = txt.match(/Test Files\s+([^\n]+)/)?.[1]?.trim();
        const t = txt.match(/Tests\s+([^\n]+)/)?.[1]?.trim();
        tests = { file: f.x, at: new Date(f.m).toISOString(), files, tests: t, ok: /exit 0/.test(txt) && !/failed/.test(t || "") };
      }
    } catch {}

    const working = running.length > 0;
    // keep the counts fresh while work is going on: rebuild the snapshot every 10 minutes
    if (working && !refreshing && now - lastRefresh > 10 * 60 * 1000) {
      lastRefresh = now;
      refreshing = true;
      const p = spawn("python3", ["scripts/content/build_status.py", "Live refresh while the build runs"], { cwd: root, stdio: "ignore" });
      p.on("exit", () => (refreshing = false));
      p.on("error", () => (refreshing = false));
    }

    return {
      now: new Date(now).toISOString(),
      working,
      machine: { load: os.loadavg().map((x) => Math.round(x * 10) / 10), cores: os.cpus().length, freeGb: Math.round((os.freemem() / 2 ** 30) * 10) / 10, totalGb: Math.round(os.totalmem() / 2 ** 30), uptimeH: Math.round(os.uptime() / 360) / 10 },
      running,
      runs: runs.slice(0, 12),
      log: log.slice(0, 60),
      curriculum: snapshot && { totals: snapshot.totals, updated: snapshot.updatedAt, tracks: snapshot.tracks.map((t) => ({ title: t.title, done: t.modules.filter((m) => m.state === "done").length, total: t.modules.length })) },
      labPlan,
      changed: changed.slice(0, 30),
      tests,
    };
  }

  const handler = (req, res) => {
    const now = Date.now();
    if (!cache.body || now - cache.t > CACHE_MS) {
      try {
        cache = { t: now, body: JSON.stringify(compute()) };
      } catch (e) {
        cache = { t: now, body: JSON.stringify({ error: String(e) }) };
      }
    }
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(cache.body);
  };

  return {
    name: "build-status",
    configureServer(server) {
      server.middlewares.use("/__build/status", handler);
    },
  };
}
