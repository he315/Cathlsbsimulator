import { useMemo, useState } from "react";
import { useUiStore } from "../../state/useUiStore";
import { useProgressStore } from "../../state/useProgressStore";
import {
  CASE_LIBRARY,
  PRESET_SPECS,
  PRESET_ORDER,
  generateBatch,
  dailyCase,
  dailySeed,
  replaySeed,
  resolveCase,
  weakestSkillPreset,
  caseDifficultyAxes,
} from "../../simulation/caseGenerator";
import type { AnatomyCase } from "../../types";
import { uid } from "../../utils/random";
import { todayStr } from "../../utils/storage";
import SectionShell from "../SectionShell";
import { classifyCase, DIAGNOSTIC_EPAS, LADDER_PARAMS, ladderFor } from "../../content/mentor/catalogue";
import { countedRungPasses, EPA_BY_ID, labPolicy, roleFor, rungCleared } from "../../progress/competency";
import { interleavedSet, overDailyCap } from "../../progress/schedule";
import { LevelBadge, RungTrack } from "../../progress/ui";
import type { EpaId } from "../../progress/types";
import { DIAG_SCENARIOS, type DiagScenario } from "../../simulation/diagnosticScenarios";
import { useContent } from "../content/useContent";
import { openLesson } from "../content/openLesson";

const DIFF_COLORS = ["", "#4CC38A", "#56B6E8", "#4F8EF7", "#E9B95A", "#E5534B"];

type Focus = "left" | "right" | "both";

function caseFocus(c: AnatomyCase): Focus {
  const hasRight = c.requiredViews.some((v) => v.startsWith("rca"));
  const hasLeft = c.requiredViews.some((v) => !v.startsWith("rca"));
  if (hasRight && hasLeft) return "both";
  if (hasRight) return "right";
  return "left";
}

// --- Small reusable case card ---------------------------------------------
function AxisBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 5) * 100;
  const color = value >= 4 ? "#E5534B" : value >= 3 ? "#E9B95A" : "#4CC38A";
  return (
    <div className="flex items-center gap-1">
      <span className="text-[12px] text-ink-faint w-3">{label}</span>
      <div className="flex-1 h-1 rounded bg-base-800 overflow-hidden">
        <div className="h-full rounded" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function CaseCard({ c, onLaunch }: { c: AnatomyCase; onLaunch: (c: AnatomyCase) => void }) {
  const axes = caseDifficultyAxes(c);
  return (
    <button
      onClick={() => onLaunch(c)}
      className="panel p-3 text-left hover:border-accent/40 transition-colors flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink truncate">{c.name}</span>
        <span
          className="font-mono text-[12px] px-1.5 rounded border"
          style={{ color: DIFF_COLORS[c.difficulty], borderColor: DIFF_COLORS[c.difficulty] }}
        >
          D{c.difficulty}
        </span>
      </div>
      <div className="text-[12px] text-ink-faint">
        {c.rootSize} root · {c.dominance} dominant · {c.accessRoute.replace("-", " ")}
      </div>
      <div className="flex flex-wrap gap-1">
        {c.pathology !== "none" && (
          <span className="chip text-warn">{c.pathology.replace(/-/g, " ")}</span>
        )}
        {c.variants
          .filter((v) => !["normal-root", "small-root", "dilated-root"].includes(v))
          .slice(0, 2)
          .map((v) => (
            <span key={v} className="chip">
              {v.replace(/-/g, " ")}
            </span>
          ))}
        {c.recommendedCatheters[0] && (
          <span className="chip text-accent">{c.recommendedCatheters[0]}</span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 pt-0.5">
        <AxisBar label="E" value={axes.engagement} />
        <AxisBar label="R" value={axes.rca} />
        <AxisBar label="V" value={axes.view} />
      </div>
    </button>
  );
}

// --- Library tab -----------------------------------------------------------
function LibraryTab({ onLaunch }: { onLaunch: (c: AnatomyCase) => void }) {
  const [diff, setDiff] = useState<number | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [access, setAccess] = useState<string | null>(null);
  const [path, setPath] = useState<"any" | "none" | "diseased">("any");
  const [q, setQ] = useState("");

  const cases = useMemo(
    () =>
      CASE_LIBRARY.filter((c) => {
        if (diff !== null && c.difficulty !== diff) return false;
        if (focus !== null && caseFocus(c) !== focus) return false;
        if (access !== null && c.accessRoute !== access) return false;
        if (path === "none" && c.pathology !== "none") return false;
        if (path === "diseased" && c.pathology === "none") return false;
        if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [diff, focus, access, path, q]
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <input
          placeholder="Search cases…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="bg-base-800 border border-line rounded-md px-3 py-1.5 text-sm w-52"
        />
        <FilterGroup
          label="Difficulty"
          value={diff}
          onChange={setDiff}
          options={[1, 2, 3, 4, 5].map((d) => ({ v: d, label: `D${d}` }))}
        />
        <FilterGroup
          label="Focus"
          value={focus}
          onChange={setFocus}
          options={[
            { v: "left" as Focus, label: "Left" },
            { v: "right" as Focus, label: "RCA" },
            { v: "both" as Focus, label: "Both" },
          ]}
        />
        <FilterGroup
          label="Access"
          value={access}
          onChange={setAccess}
          options={[
            { v: "femoral", label: "Femoral" },
            { v: "radial-right", label: "R radial" },
            { v: "radial-left", label: "L radial" },
          ]}
        />
        <FilterGroup
          label="Pathology"
          value={path === "any" ? null : path}
          onChange={(v) => setPath((v as "none" | "diseased") ?? "any")}
          options={[
            { v: "none", label: "Normal" },
            { v: "diseased", label: "Diseased" },
          ]}
        />
      </div>

      <div className="text-[12px] text-ink-faint mb-3">{cases.length} cases</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cases.map((c) => (
          <CaseCard key={c.id} c={c} onLaunch={onLaunch} />
        ))}
      </div>
    </div>
  );
}

function FilterGroup<T extends string | number>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T | null;
  onChange: (v: T | null) => void;
  options: { v: T; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[12px] text-ink-faint">{label}</span>
      <button
        className={`chip ${value === null ? "text-accent border-accent/40" : ""}`}
        onClick={() => onChange(null)}
      >
        All
      </button>
      {options.map((o) => (
        <button
          key={String(o.v)}
          className={`chip ${value === o.v ? "border-accent/40 text-accent" : ""}`}
          onClick={() => onChange(o.v)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// --- Generate tab ----------------------------------------------------------
function GenerateTab({ onLaunch }: { onLaunch: (c: AnatomyCase) => void }) {
  const mistakes = useProgressStore((s) => s.profile.mistakes);
  const attempts = useProgressStore((s) => s.profile.attempts);

  const [count, setCount] = useState(20);
  const [batch, setBatch] = useState<AnatomyCase[]>([]);
  const [batchLabel, setBatchLabel] = useState("");
  const [seedInput, setSeedInput] = useState("");

  const weakKey = useMemo(() => weakestSkillPreset(mistakes), [mistakes]);

  const failed = useMemo(() => {
    const seen = new Set<string>();
    const out: { id: string; name: string; when: number }[] = [];
    // newest first
    for (let i = attempts.length - 1; i >= 0; i--) {
      const a = attempts[i];
      // held-out exam cases are never offered again as practice
      if (a.passed || seen.has(a.caseId) || classifyCase(a.caseId).exam) continue;
      seen.add(a.caseId);
      out.push({ id: a.caseId, name: a.caseName, when: a.timestamp });
      if (out.length >= 12) break;
    }
    return out;
  }, [attempts]);

  const runPreset = (key: string) => {
    const b = generateBatch(key, count, uid());
    setBatch(b);
    setBatchLabel(`${count} × ${PRESET_SPECS[key]?.label ?? key}`);
  };

  const runDaily = () => {
    setBatch([dailyCase()]);
    setBatchLabel(`Daily case · ${dailySeed()}`);
  };

  const runWeak = () => {
    const b = generateBatch(weakKey, count, uid());
    setBatch(b);
    setBatchLabel(`${count} × weakest skill (${PRESET_SPECS[weakKey]?.label ?? weakKey})`);
  };

  const runSeed = () => {
    const s = seedInput.trim();
    if (!s) return;
    if (/^X:/.test(s)) {
      setBatch([]);
      setBatchLabel("That seed belongs to the held-out exam pool and cannot be replayed as practice.");
      return;
    }
    setBatch([replaySeed(s)]);
    setBatchLabel(`Replay seed “${s}”`);
  };

  const openFailed = (id: string) => {
    const c = resolveCase(id);
    if (c) onLaunch(c);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Daily + weakest + seed row */}
      <div className="grid md:grid-cols-3 gap-3">
        <div className="panel p-3 flex flex-col gap-2">
          <div className="text-sm font-medium text-ink">Case of the day</div>
          <p className="text-[12px] text-ink-faint flex-1">
            One deterministic case seeded by today's date — the same for everyone.
          </p>
          <button className="btn btn-accent w-full" onClick={runDaily}>
            Load daily case
          </button>
        </div>
        <div className="panel p-3 flex flex-col gap-2">
          <div className="text-sm font-medium text-ink">Target my weakest skill</div>
          <p className="text-[12px] text-ink-faint flex-1">
            Reads your mistake log and builds cases that rehearse{" "}
            <span className="text-accent">{PRESET_SPECS[weakKey]?.label ?? weakKey}</span>.
          </p>
          <button className="btn btn-accent w-full" onClick={runWeak}>
            Generate {count} targeted cases
          </button>
        </div>
        <div className="panel p-3 flex flex-col gap-2">
          <div className="text-sm font-medium text-ink">Replay a seed</div>
          <p className="text-[12px] text-ink-faint">Paste a case seed to reproduce it exactly.</p>
          <div className="flex gap-2">
            <input
              placeholder="seed…"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              className="bg-base-800 border border-line rounded-md px-2 py-1.5 text-sm flex-1 min-w-0"
            />
            <button className="btn" onClick={runSeed}>
              Replay
            </button>
          </div>
        </div>
      </div>

      {/* Batch size + preset buttons */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-ink">Targeted batches</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-ink-faint">Batch size</span>
            {[10, 20, 50].map((n) => (
              <button
                key={n}
                className={`chip ${count === n ? "border-accent/40 text-accent" : ""}`}
                onClick={() => setCount(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {PRESET_ORDER.map((key) => {
            const p = PRESET_SPECS[key];
            if (!p) return null;
            return (
              <button
                key={key}
                onClick={() => runPreset(key)}
                className="panel p-2.5 text-left hover:border-accent/40 transition-colors"
              >
                <div className="text-sm font-medium text-ink">
                  Generate {count} · {p.label}
                </div>
                <div className="text-[12px] text-ink-faint mt-0.5">{p.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Failed cases */}
      {failed.length > 0 && (
        <div>
          <div className="text-sm font-medium text-ink mb-2">
            Retry a failed case ({failed.length})
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {failed.map((f) => (
              <button
                key={f.id}
                onClick={() => openFailed(f.id)}
                className="panel p-2.5 text-left hover:border-danger/50 transition-colors"
                title={resolveCase(f.id) ? "Replay this case" : "This case can no longer be reconstructed"}
              >
                <div className="text-sm font-medium text-ink truncate">{f.name}</div>
                <div className="text-[12px] text-ink-faint mt-0.5">
                  Failed · {new Date(f.when).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generated batch results */}
      {batch.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">{batchLabel}</span>
            <span className="text-[12px] text-ink-faint">{batch.length} cases</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {batch.map((c) => (
              <CaseCard key={c.id} c={c} onLaunch={onLaunch} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Competency ladders ----------------------------------------------------
function LaddersTab({ onLaunch: launchCase }: { onLaunch: (c: AnatomyCase) => void }) {
  const profile = useProgressStore((s) => s.profile);
  const setActivePolicy = useProgressStore((s) => s.setActivePolicy);
  const [epa, setEpa] = useState<EpaId>(DIAGNOSTIC_EPAS[0]);
  const [mixSeed, setMixSeed] = useState<string | null>(null);
  const today = todayStr();
  const l = ladderFor(epa).diagnostic!;
  const cleared = rungCleared(profile.logbook, epa);
  const passed = new Set(countedRungPasses(profile.logbook, epa).map((p) => p.caseId));
  const capped = overDailyCap(profile.logbook, epa, today);
  const mix = useMemo(() => (mixSeed ? interleavedSet(profile.logbook, 12, mixSeed) : []), [mixSeed, profile.logbook]);
  // Ladder cases run under the policy of the level in force for their activity.
  const onLaunch = (c: AnatomyCase) => {
    const e = classifyCase(c.id).epa ?? epa;
    setActivePolicy(e, c.id);
    launchCase(c);
  };
  const pol = labPolicy(profile.entrustment[epa]);

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-ink-soft max-w-3xl">
        Each activity has six rungs of rising difficulty. Two passes at a rung or above clear it and open the next. Exam cases are held out and never appear here. Passes beyond{" "}
        {LADDER_PARAMS.dailyCountedPasses} a day on one activity are logged but do not count toward the ladder, so practice spreads over days.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {DIAGNOSTIC_EPAS.map((e) => (
          <button key={e} onClick={() => { setEpa(e); setMixSeed(null); }} className={`rounded-md border px-3 py-1.5 text-[13px] flex items-center gap-2 ${epa === e ? "border-accent bg-accent-tint text-ink" : "border-line text-ink-soft hover:text-ink"}`}>
            <LevelBadge rec={profile.entrustment[e]} size="sm" />
            {EPA_BY_ID[e].title.replace(/ (selectively and safely|and deliver catheters to the aortic root)$/, "")}
          </button>
        ))}
        <button onClick={() => setMixSeed(String(Date.now()))} className={`rounded-md border px-3 py-1.5 text-[13px] ${mixSeed ? "border-accent bg-accent-tint text-ink" : "border-line text-ink-soft hover:text-ink"}`}>
          Interleaved review
        </button>
      </div>

      {mixSeed ? (
        mix.length === 0 ? (
          <div className="panel p-5 text-sm text-ink-faint">Interleaved review mixes cases from rungs you have cleared. Clear a rung on any activity first.</div>
        ) : (
          <div>
            <div className="text-[13px] text-ink-soft mb-2">{mix.length} cases from cleared rungs, alternating between activities for retention.</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {mix.map((it) => {
                const c = resolveCase(it.caseId);
                return c ? (
                  <div key={it.caseId} className="space-y-1">
                    <div className="text-[12px] text-ink-faint">{EPA_BY_ID[it.epa].title.split(" ").slice(0, 4).join(" ")} · rung {it.rung}</div>
                    <CaseCard c={c} onLaunch={onLaunch} />
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <RungTrack cleared={cleared} playable={l.rungs.length} />
            <span className="text-[13px] text-ink-soft">{profile.entrustment[epa]?.next}</span>
            <span className="chip" title="Set by the level in force: guided as assistant up to level II, supervised at III, independent from IV">
              Logged as {pol.mode} practice · {roleFor(pol.mode)}
            </span>
          </div>
          {capped && <div className="notice notice-warn">Today's counted passes on this activity are used up. Practise another activity, or come back tomorrow: spaced practice is retained better than massed practice.</div>}
          <div className="space-y-4">
            {l.rungs.map((r) => {
              const open = r.rung <= cleared + 1;
              return (
                <section key={r.rung} className={`panel ${open ? "" : "opacity-60"}`}>
                  <div className="panel-head">
                    <span>
                      Rung {r.rung} {r.rung <= cleared ? "· cleared" : r.rung === cleared + 1 ? "· next" : "· locked"}
                    </span>
                    <span className="normal-case font-normal text-[12px] text-ink-faint">difficulty {r.min}–{r.max} · {r.caseIds.length} cases</span>
                  </div>
                  {open ? (
                    <div className="p-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {r.caseIds.map((id) => {
                        const c = resolveCase(id);
                        return c ? (
                          <div key={id} className="relative">
                            {passed.has(id) && <span className="absolute right-2 top-2 z-10 chip !h-5 text-good border-good/40">passed</span>}
                            <CaseCard c={c} onLaunch={onLaunch} />
                          </div>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <div className="p-3 text-[13px] text-ink-faint">Clear rung {r.rung - 1} to open these cases.</div>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// --- Scenarios tab (diag-scenario-registry) ---------------------------------
// The named diagnostic scenarios, by curriculum module, each with the lessons it practises. A
// scenario opens through the lab launch (found-launch-links), so the free lab loads it with its
// chart and its seed; "Another patient" draws the same scenario at a new seed.
function ScenariosTab() {
  const openSim = useUiStore((s) => s.openSim);
  const content = useContent();
  const lessonTitle = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of content?.TRACKS ?? []) for (const mod of t.modules) for (const l of mod.lessons) m.set(l.id, l.title);
    return m;
  }, [content]);
  const groups = useMemo(() => {
    const out: { id: string; title: string; scenarios: DiagScenario[] }[] = [];
    for (const s of DIAG_SCENARIOS) {
      let g = out.find((x) => x.id === s.module.id);
      if (!g) out.push((g = { id: s.module.id, title: s.module.title, scenarios: [] }));
      g.scenarios.push(s);
    }
    return out;
  }, []);

  return (
    <div className="space-y-6">
      <p className="text-[13px] text-ink-soft max-w-3xl">
        Named patients for the diagnostic lab. Each has a chart to read at the pre-brief and practises the lessons listed with it.
      </p>
      {groups.map((g) => (
        <section key={g.id} aria-label={g.title}>
          <h2 className="mb-2 text-[13px] font-medium text-ink">{g.title}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.scenarios.map((s) => (
              <div key={s.id} className="panel flex flex-col gap-2 p-3">
                <span className="text-sm font-medium text-ink">{s.title}</span>
                <p className="line-clamp-3 text-[12px] leading-relaxed text-ink-soft">{s.brief}</p>
                <div className="flex flex-wrap gap-1">
                  {s.lessonIds.map((id) => (
                    <button key={id} type="button" className="chip cursor-pointer text-left" onClick={() => void openLesson(id)} title="Open the lesson">
                      {lessonTitle.get(id) ?? id}
                    </button>
                  ))}
                </div>
                <div className="mt-auto flex gap-2 pt-1">
                  <button type="button" className="btn btn-accent h-8" onClick={() => openSim("cathlab", { scenario: s.id })}>
                    Open in the lab
                  </button>
                  <button type="button" className="btn btn-ghost h-8" onClick={() => openSim("cathlab", { scenario: s.id, seed: uid() })}>
                    Another patient
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// --- Section shell ---------------------------------------------------------
export default function CaseLibrary() {
  const launch = useUiStore((s) => s.launch);
  const [tab, setTab] = useState<"ladders" | "library" | "scenarios" | "generate">("ladders");
  const onLaunch = (c: AnatomyCase) => launch(c, "case");

  return (
    <SectionShell
      title="Case library"
      subtitle={`Competency ladders, ${CASE_LIBRARY.length} hand-tuned cases, ${DIAG_SCENARIOS.length} named scenarios and an unlimited procedural generator.`}
      actions={
        <div className="flex items-center gap-1.5">
          <button className={`chip ${tab === "ladders" ? "text-accent border-accent/40" : ""}`} onClick={() => setTab("ladders")}>
            Ladders
          </button>
          <button
            className={`chip ${tab === "library" ? "text-accent border-accent/40" : ""}`}
            onClick={() => setTab("library")}
          >
            Library
          </button>
          <button className={`chip ${tab === "scenarios" ? "text-accent border-accent/40" : ""}`} onClick={() => setTab("scenarios")}>
            Scenarios
          </button>
          <button
            className={`chip ${tab === "generate" ? "text-accent border-accent/40" : ""}`}
            onClick={() => setTab("generate")}
          >
            Generate
          </button>
        </div>
      }
    >
      {tab === "ladders" ? <LaddersTab onLaunch={onLaunch} /> : tab === "library" ? <LibraryTab onLaunch={onLaunch} /> : tab === "scenarios" ? <ScenariosTab /> : <GenerateTab onLaunch={onLaunch} />}
    </SectionShell>
  );
}
