// Competencies and logbook: EPA entrustment per competency, the simulator
// logbook (exportable), and formative trends. Replaces the old score analytics.
import { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { useProgressStore } from "../../state/useProgressStore";
import { useUiStore, type ProgressTab } from "../../state/useUiStore";
import { MISTAKE_INFO } from "../../data/teachingText";
import type { MistakeRecord } from "../../types";
import SectionShell from "../SectionShell";
import { DOMAIN_LABEL, DOMAIN_ORDER, ENTRUST_RULES, EPAS, EPA_BY_ID, LEVEL_LABEL, MASTER_ASSESSMENT } from "../../progress/competency";
import { classifyCase, ladderFor, LADDER_PARAMS } from "../../content/mentor/catalogue";
import { logbookTotals, replayable } from "../../progress/logbook";
import { LevelBadge, LevelPips, RungTrack, startPractice } from "../../progress/ui";
import type { EntrustLevel, EpaId, LogLab, LogbookEntry } from "../../progress/types";
import { resolveCase } from "../../simulation/caseGenerator";

const AXIS = { stroke: "#3d4d5e", fontSize: 11 };
const GRID = "#182230";
const TIP = { background: "#0a0d12", border: "1px solid #223", borderRadius: 8, fontSize: 12 };

const TABS: { id: ProgressTab; label: string }[] = [
  { id: "competencies", label: "Competencies" },
  { id: "logbook", label: "Logbook" },
  { id: "trends", label: "Trends" },
];

export default function Analytics() {
  const tab = useUiStore((s) => s.progressTab);
  const openProgress = useUiStore((s) => s.openProgress);
  return (
    <SectionShell
      title="Competencies and logbook"
      subtitle="Simulator entrustment per activity on the EAPCI 2020 levels I to V (level II from passed practice cases, levels III and above only in exam mode on held-out cases), and every session you have logged."
      actions={
        <div className="seg">
          {TABS.map((t) => (
            <button key={t.id} className={`seg-btn !px-3 !py-1 ${tab === t.id ? "seg-btn-active" : ""}`} onClick={() => openProgress(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      }
    >
      {tab === "logbook" ? <Logbook /> : tab === "trends" ? <Trends /> : <Competencies />}
    </SectionShell>
  );
}

// ---------------------------------------------------------------------------
function Competencies() {
  const profile = useProgressStore((s) => s.profile);
  const focus = useUiStore((s) => s.focusEpa);
  const setSection = useUiStore((s) => s.setSection);
  const [open, setOpen] = useState<EpaId | null>(focus);
  const [opened, setOpened] = useState("");
  const ent = profile.entrustment;

  return (
    <div className="max-w-6xl space-y-6">
      <div className="notice notice-info">
        <span>
          A level here is a simulator entrustment decision, not a clinical one. Level II needs {ENTRUST_RULES.level2PracticePasses} passed practice cases; level III needs {ENTRUST_RULES.level3.examPasses} exam passes on held-out
          cases at rung {ENTRUST_RULES.level3.minRung} or above over at least {ENTRUST_RULES.level3.minDays} days; level IV {ENTRUST_RULES.level4.examPasses} more at rung {ENTRUST_RULES.level4.minRung} or above; level V the final
          assessment. A critical error in an exam starts the count again. Levels lapse by one if an activity is not passed within its expiry period.
        </span>
      </div>

      <MasterPanel onOpenAssessment={() => setSection("challenge")} />

      {DOMAIN_ORDER.map((d) => (
        <section key={d} className="panel">
          <div className="panel-head">{DOMAIN_LABEL[d]}</div>
          <div className="divide-y divide-line">
            {EPAS.filter((e) => e.domain === d).map((e) => {
              const rec = ent[e.id];
              const l = ladderFor(e.id);
              const isOpen = open === e.id;
              return (
                <div key={e.id}>
                  <button className="w-full text-left px-4 py-3 flex flex-wrap items-center gap-4 hover:bg-base-600/50" onClick={() => setOpen(isOpen ? null : e.id)} aria-expanded={isOpen}>
                    <LevelBadge rec={rec} />
                    <span className="flex-1 min-w-[260px]">
                      <span className="block text-[14px] text-ink">{e.title}</span>
                      <span className={`block text-[12px] mt-0.5 ${rec?.expired ? "text-warn" : "text-ink-faint"}`}>{rec?.next ?? "Log a first session."}</span>
                    </span>
                    <span className="flex flex-col items-end gap-1.5">
                      <LevelPips rec={rec} />
                      <RungTrack cleared={rec?.rungCleared ?? 0} playable={l.playableRungs} />
                    </span>
                  </button>
                  {isOpen && (
                    <EpaDetail
                      epa={e.id}
                      onPractise={() => setOpened(startPractice(e.id, profile.logbook))}
                      onExam={() => setSection("challenge")}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      {opened && <div className="text-[12px] text-ink-faint">{opened}</div>}
    </div>
  );
}

function MasterPanel({ onOpenAssessment }: { onOpenAssessment: () => void }) {
  const profile = useProgressStore((s) => s.profile);
  const m = profile.master;
  return (
    <section className="panel p-5 flex flex-wrap items-start gap-6">
      <div className="flex-1 min-w-[280px]">
        <div className="text-[13px] font-medium text-accent">Final assessment</div>
        <h2 className="text-lg font-semibold text-ink mt-0.5">{m.passed ? `Passed on ${m.passedOn}` : "Not yet passed"}</h2>
        <p className="text-[13px] text-ink-soft mt-1 max-w-xl">
          One exam pass at rung {MASTER_ASSESSMENT.minRung} or above on a held-out case in each component, each after that activity's level IV, all inside {MASTER_ASSESSMENT.windowDays} days with no critical error in
          any component exam during the window. Passing it unlocks level V.
        </p>
      </div>
      <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[13px]">
        {MASTER_ASSESSMENT.components.map((e) => {
          const c = m.components[e];
          const lv = profile.entrustment[e]?.awarded ?? 0;
          return (
            <li key={e} className="flex items-center gap-2">
              <span className={`led ${c ? "text-good" : lv >= 4 ? "text-accent" : "text-ink-faint"}`} />
              <span className="text-ink-soft">{EPA_BY_ID[e].title.replace(/ (selectively|safely|and deliver catheters to the aortic root).*$/, "")}</span>
              <span className="text-ink-faint font-mono text-[12px]">{c ? c.date : lv >= 4 ? "ready" : `level ${LEVEL_LABEL[lv as EntrustLevel].roman}`}</span>
            </li>
          );
        })}
      </ul>
      <button className="btn" onClick={onOpenAssessment}>
        Open the assessment
      </button>
    </section>
  );
}

function EpaDetail({ epa, onPractise, onExam }: { epa: EpaId; onPractise: () => void; onExam: () => void }) {
  const profile = useProgressStore((s) => s.profile);
  const e = EPA_BY_ID[epa];
  const rec = profile.entrustment[epa];
  const l = ladderFor(epa);
  const examable = l.kind === "diagnostic" || l.kind === "reading";
  const rows = profile.logbook.filter((r) => r.epas.includes(epa)).slice(-6).reverse();
  return (
    <div className="px-4 pb-5 pt-1 grid lg:grid-cols-[1fr_320px] gap-5 animate-fadein">
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
        <Field k="Specification" v={e.specification} />
        <Field k="Limitations" v={e.limitations} />
        <Field k="Risks if it fails" v={e.risks} />
        <Field k="Competency domains" v={e.competencies.join(", ")} />
        <Field k="Knowledge" v={e.ksae.knowledge} />
        <Field k="Skills" v={e.ksae.skills} />
        <Field k="Attitudes" v={e.ksae.attitudes} />
        <Field k="Experience" v={e.ksae.experience} />
        <Field k="Evidence used" v={e.sources.join("; ")} />
        <Field k="Expected" v={e.expected.map((x) => `level ${LEVEL_LABEL[x.level].roman} by the end of stage ${x.stage}`).join("; ")} />
        <Field k="Expiry if not practised" v={`${e.expiryDays} days${rec?.daysToExpiry !== undefined && (rec?.awarded ?? 0) >= 2 ? ` (${rec.daysToExpiry >= 0 ? `${rec.daysToExpiry} days left` : "expired"})` : ""}`} />
        <Field k="Where" v={e.where} />
      </dl>
      <div className="space-y-3">
        <div className="panel !bg-base-800 p-3 text-[13px] space-y-1.5">
          <div className="flex justify-between"><span className="text-ink-faint">Level in force</span><span className="font-mono text-ink">{LEVEL_LABEL[(rec?.effective ?? 0) as EntrustLevel].roman}</span></div>
          <div className="flex justify-between"><span className="text-ink-faint">Highest awarded</span><span className="font-mono text-ink">{LEVEL_LABEL[(rec?.awarded ?? 0) as EntrustLevel].roman}</span></div>
          {([1, 2, 3, 4, 5] as EntrustLevel[]).filter((L) => rec?.awardedOn[L]).map((L) => (
            <div key={L} className="flex justify-between"><span className="text-ink-faint">Level {LEVEL_LABEL[L].roman}</span><span className="font-mono text-ink-soft">{rec!.awardedOn[L]}</span></div>
          ))}
          <div className="flex justify-between"><span className="text-ink-faint">Practice passes</span><span className="font-mono text-ink">{rec?.practicePasses ?? 0}</span></div>
          <div className="flex justify-between"><span className="text-ink-faint">Exams (passes / critical)</span><span className="font-mono text-ink">{rec?.exams.attempts ?? 0} ({rec?.exams.passes ?? 0} / {rec?.exams.criticalFails ?? 0})</span></div>
          <div className="flex justify-between"><span className="text-ink-faint">Rungs cleared</span><span className="font-mono text-ink">{rec?.rungCleared ?? 0} of {LADDER_PARAMS.rungs} ({l.playableRungs} playable)</span></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-accent" onClick={onPractise}>Practise next rung</button>
          {examable && l.kind === "diagnostic" && <button className="btn" onClick={onExam}>Exam mode</button>}
          {l.kind === "reading" && <button className="btn" onClick={() => useUiStore.getState().openSim("angio-real", { drill: "exam" })}>Reading exam</button>}
        </div>
        {rows.length > 0 && (
          <div className="text-[12px] space-y-1">
            <div className="stat-label">Recent sessions</div>
            {rows.map((r) => (
              <div key={r.id} className="flex gap-2">
                <span className="font-mono text-ink-faint">{r.date}</span>
                <span className="truncate flex-1 text-ink-soft">{r.caseName}</span>
                <span className={r.passed ? "text-good" : "text-danger"}>{r.mode === "exam" ? "exam " : ""}{r.passed ? "pass" : "not yet"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="stat-label">{k}</dt>
      <dd className="text-ink-soft leading-snug mt-0.5">{v}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
const LAB_LABEL: Record<LogLab, string> = {
  diagnostic: "Cath lab",
  procedure: "Full procedure",
  pci: "PCI lab",
  "pci-bench": "PCI bench",
  physiology: "Pressure wire",
  haemo: "Haemodynamics",
  mcs: "MCS",
  structural: "Structural",
  bedside: "Bedside",
  "angio-reading": "Real angiograms",
};

function download(name: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function Logbook() {
  const profile = useProgressStore((s) => s.profile);
  const exportLogbook = useProgressStore((s) => s.exportLogbook);
  const launch = useUiStore((s) => s.launch);
  const [lab, setLab] = useState<LogLab | "all">("all");
  const [epa, setEpa] = useState<EpaId | "all">("all");
  const [examOnly, setExamOnly] = useState(false);
  const [limit, setLimit] = useState(100);
  const rows = useMemo(
    () =>
      [...profile.logbook]
        .reverse()
        .filter((r) => (lab === "all" || r.lab === lab) && (epa === "all" || r.epas.includes(epa)) && (!examOnly || r.mode === "exam")),
    [profile.logbook, lab, epa, examOnly]
  );
  const tot = logbookTotals(profile.logbook);
  const stamp = new Date().toISOString().slice(0, 10);
  const labs = Array.from(new Set(profile.logbook.map((r) => r.lab)));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Tile label="Sessions" value={tot.sessions} sub={tot.sessions !== tot.logged ? `${tot.logged} with full detail` : undefined} />
        <Tile label="Exams" value={tot.exams} sub={`${tot.examPasses} passed`} />
        <Tile label="Fluoroscopy" value={`${(tot.fluoroS / 60).toFixed(1)} min`} />
        <Tile label="Contrast" value={`${tot.contrastMl} mL`} />
        <Tile label="Complications" value={tot.complications} />
        <Tile label="Critical errors" value={tot.critical} tone={tot.critical ? "danger" : undefined} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select className="field !h-8 text-[13px]" value={lab} onChange={(e) => setLab(e.target.value as LogLab | "all")} aria-label="Lab">
          <option value="all">All labs</option>
          {labs.map((l) => (
            <option key={l} value={l}>{LAB_LABEL[l]}</option>
          ))}
        </select>
        <select className="field !h-8 text-[13px] max-w-[280px]" value={epa} onChange={(e) => setEpa(e.target.value as EpaId | "all")} aria-label="Activity">
          <option value="all">All activities</option>
          {EPAS.map((e) => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-[13px] text-ink-soft">
          <input type="checkbox" checked={examOnly} onChange={(e) => setExamOnly(e.target.checked)} /> Exams only
        </label>
        <span className="flex-1" />
        <button className="btn" disabled={!profile.logbook.length} onClick={() => download(`cathmaster-logbook-${stamp}.csv`, exportLogbook("csv"), "text/csv")}>Export CSV</button>
        <button className="btn" disabled={!profile.logbook.length} onClick={() => download(`cathmaster-logbook-${stamp}.json`, exportLogbook("json"), "application/json")}>Export JSON</button>
      </div>

      {rows.length === 0 ? (
        <div className="panel p-8 text-center text-ink-faint text-sm">No sessions yet. Every finished case or lab session writes one row here.</div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-ink-faint border-b border-line">
                {["Date", "Case", "Lab", "Mode and role", "Activities", "Runs", "Fluoro", "Contrast", "Ka,r / KAP", "Complications", "Result", ""].map((h) => (
                  <th key={h} className="px-3 py-2 font-normal whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((r) => (
                <LogRow key={r.id} r={r} onReplay={() => { const c = resolveCase(r.caseId); if (c) launch(c, "case"); }} />
              ))}
            </tbody>
          </table>
          {rows.length > limit && (
            <div className="p-3 border-t border-line">
              <button className="btn" onClick={() => setLimit((n) => n + 200)}>Show more ({rows.length - limit} older)</button>
            </div>
          )}
        </div>
      )}
      <p className="text-[12px] text-ink-faint">
        Ka,r and KAP appear once the dose model reports them for a session. Rows marked imported come from a profile saved before the logbook existed: diagnostic attempts kept their detail; other labs had kept only a run count and best score, so each appears as one summary row.
      </p>
    </div>
  );
}

function LogRow({ r, onReplay }: { r: LogbookEntry; onReplay: () => void }) {
  const canReplay = !r.aggregateOf && replayable(r.caseId) && !classifyCase(r.caseId).exam;
  return (
    <tr className="border-b border-line/60 align-top">
      <td className="px-3 py-2 font-mono text-ink-faint whitespace-nowrap">{r.date}</td>
      <td className="px-3 py-2 text-ink min-w-[180px]">
        {r.caseName}
        {r.indication && <div className="text-[12px] text-ink-faint">{r.indication}{r.access ? ` · ${r.access.replace("-", " ")}` : ""}</div>}
        {r.devices.length > 0 && <div className="text-[12px] text-ink-faint">{r.devices.join(", ")}</div>}
        {r.aggregateOf && <div className="text-[12px] text-warn">Imported summary of {r.aggregateOf} sessions</div>}
        {r.migrated && !r.aggregateOf && <div className="text-[12px] text-ink-faint">Imported</div>}
      </td>
      <td className="px-3 py-2 text-ink-soft whitespace-nowrap">{LAB_LABEL[r.lab]}</td>
      <td className="px-3 py-2 text-ink-soft">
        <span className={r.mode === "exam" ? "text-accent" : ""}>{r.mode}</span>
        <div className="text-[12px] text-ink-faint">{r.role}</div>
      </td>
      <td className="px-3 py-2 text-[12px] text-ink-soft min-w-[220px]">
        {r.epas.map((e) => (
          <div key={e}>
            {EPA_BY_ID[e]?.title ?? e}
            {r.rungs[e] ? <span className="text-ink-faint"> · rung {r.rungs[e]}</span> : null}
          </div>
        ))}
      </td>
      <td className="px-3 py-2 font-mono text-ink-soft">{r.runs ?? ""}</td>
      <td className="px-3 py-2 font-mono text-ink-soft whitespace-nowrap">{r.fluoroS !== undefined ? `${(r.fluoroS / 60).toFixed(1)} min` : ""}</td>
      <td className="px-3 py-2 font-mono text-ink-soft whitespace-nowrap">{r.contrastMl !== undefined ? `${r.contrastMl} mL` : ""}</td>
      <td className="px-3 py-2 font-mono text-ink-soft whitespace-nowrap">{r.karMGy !== undefined ? `${r.karMGy} mGy` : ""}{r.kapGyCm2 !== undefined ? ` / ${r.kapGyCm2} Gy·cm²` : ""}</td>
      <td className="px-3 py-2 text-[12px] text-ink-soft">{r.complications.join(", ")}{r.criticalErrors ? <div className="text-danger">{r.criticalErrors} critical</div> : null}</td>
      <td className={`px-3 py-2 whitespace-nowrap ${r.passed ? "text-good" : "text-danger"}`}>{r.passed ? "Pass" : "Not yet"}{r.hints ? <div className="text-[12px] text-ink-faint">{r.hints} hint{r.hints === 1 ? "" : "s"}</div> : null}</td>
      <td className="px-3 py-2">{canReplay && <button className="btn !h-7 !px-2 text-[12px]" onClick={onReplay}>Replay</button>}</td>
    </tr>
  );
}

function Tile({ label, value, sub, tone }: { label: string; value: string | number; sub?: string; tone?: "danger" }) {
  return (
    <div className="panel px-4 py-3">
      <div className="stat-label">{label}</div>
      <div className={`metric text-xl mt-1 ${tone === "danger" ? "text-danger" : "text-ink"}`}>{value}</div>
      {sub && <div className="text-[12px] text-ink-faint mt-0.5">{sub}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
function Trends() {
  const profile = useProgressStore((s) => s.profile);
  const diag = profile.logbook.filter((r) => r.lab === "diagnostic" && !r.aggregateOf).slice(-30);
  const trend = diag.map((r, i) => ({ n: i + 1, Contrast: r.contrastMl ?? 0, Fluoro: Math.round((r.fluoroS ?? 0) / 6) / 10, Score: r.score ?? 0 }));
  const mistakeData = (Object.values(profile.mistakes) as MistakeRecord[])
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((m) => ({ name: MISTAKE_INFO[m.code]?.label ?? m.code, count: m.count }));
  const exams = profile.logbook.filter((r) => r.mode === "exam").slice(-20).reverse();

  return (
    <div className="max-w-6xl space-y-4">
      {diag.length === 0 ? (
        <div className="panel p-8 text-center text-ink-faint text-sm">No diagnostic cases logged yet.</div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="panel p-4">
            <div className="stat-label mb-3">Contrast (mL) and fluoroscopy (min), last {trend.length} diagnostic cases</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                  <XAxis dataKey="n" tick={AXIS} stroke={AXIS.stroke} />
                  <YAxis tick={AXIS} stroke={AXIS.stroke} />
                  <Tooltip contentStyle={TIP} />
                  <Line type="monotone" dataKey="Contrast" stroke="#56B6E8" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="Fluoro" stroke="#E9B95A" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="panel p-4">
            <div className="stat-label mb-3">Formative debrief composite (internal analytics; not used for entrustment)</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                  <XAxis dataKey="n" tick={AXIS} stroke={AXIS.stroke} />
                  <YAxis domain={[0, 100]} tick={AXIS} stroke={AXIS.stroke} />
                  <Tooltip contentStyle={TIP} />
                  <Line type="monotone" dataKey="Score" stroke="#4F8EF7" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="panel p-4">
          <div className="stat-label mb-3">Most frequent mistakes</div>
          {mistakeData.length === 0 ? (
            <div className="text-sm text-ink-faint">No mistakes logged.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mistakeData} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={AXIS} stroke={AXIS.stroke} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#8a97a6", fontSize: 10 }} width={150} stroke={AXIS.stroke} />
                  <Tooltip cursor={{ fill: "#ffffff08" }} contentStyle={TIP} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {mistakeData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "#E5534B" : "#4F8EF7"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="panel p-4">
          <div className="stat-label mb-3">Exam history</div>
          {exams.length === 0 ? (
            <div className="text-sm text-ink-faint">No exams taken. Exam mode opens at level II in the Assessment section.</div>
          ) : (
            <div className="space-y-1 text-[13px]">
              {exams.map((r) => (
                <div key={r.id} className="flex gap-3">
                  <span className="font-mono text-ink-faint">{r.date}</span>
                  <span className="flex-1 truncate text-ink-soft">{EPA_BY_ID[r.epas[0]]?.title ?? r.caseName}</span>
                  <span className="font-mono text-ink-faint">rung {r.rungs[r.epas[0]] ?? "?"}</span>
                  <span className={r.passed ? "text-good" : r.criticalErrors ? "text-danger" : "text-warn"}>{r.passed ? "pass" : r.criticalErrors ? "critical error" : "not passed"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
