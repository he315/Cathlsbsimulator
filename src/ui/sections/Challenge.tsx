// Assessment: the daily challenge (next rung of the weakest due activity), exam
// mode on held-out cases (no hints, no coaching, one attempt per case counts),
// and the final assessment. An exam case counts as attempted from the moment it
// loads; leaving before the end logs a failed first attempt.
import { useEffect, useMemo, useRef, useState } from "react";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { useProgressStore } from "../../state/useProgressStore";
import { useUiStore } from "../../state/useUiStore";
import { resolveCase } from "../../simulation/caseGenerator";
import { todayStr } from "../../utils/storage";
import Simulator from "../sim/Simulator";
import SectionShell from "../SectionShell";
import { DIAGNOSTIC_EPAS } from "../../content/mentor/catalogue";
import { EPA_BY_ID, ENTRUST_RULES, labPolicy, LEVEL_LABEL, MASTER_ASSESSMENT, roleFor } from "../../progress/competency";
import { dailyChallenge, EXAM_BANDS, pickExamCase, pickMasterCase } from "../../progress/schedule";
import { LevelBadge } from "../../progress/ui";
import type { EpaId, EntrustLevel } from "../../progress/types";

type Running = { kind: "daily" | "exam" | "master"; epa: EpaId; caseId: string; rung: number; toward?: number };

export default function Challenge() {
  const profile = useProgressStore((s) => s.profile);
  const loadCase = useSimulatorStore((s) => s.loadCase);
  const finished = useSimulatorStore((s) => s.finished);
  const simCaseId = useSimulatorStore((s) => s.caseData.id);
  const openSim = useUiStore((s) => s.openSim);
  const openProgress = useUiStore((s) => s.openProgress);
  const setActivePolicy = useProgressStore((s) => s.setActivePolicy);
  const beginExam = useProgressStore((s) => s.beginExam);
  const abandonExam = useProgressStore((s) => s.abandonExam);
  const [running, setRunning] = useState<Running | null>(null);
  const [msg, setMsg] = useState<string>("");
  const today = todayStr();

  const daily = useMemo(() => dailyChallenge(profile.logbook, profile.entrustment, profile.skillMemory, today), [profile.logbook, profile.entrustment, profile.skillMemory, today]);
  const dailyPolicy = daily ? labPolicy(profile.entrustment[daily.epa]) : null;

  // Leaving the section mid-exam (navigation, not the Leave button) is also a failed attempt.
  // abandonExam is a no-op once the finished case has been logged.
  const runningRef = useRef<Running | null>(null);
  runningRef.current = running;
  useEffect(
    () => () => {
      const r = runningRef.current;
      if (r && r.kind !== "daily") useProgressStore.getState().abandonExam(r.caseId);
    },
    []
  );

  const start = (r: Running) => {
    const c = resolveCase(r.caseId);
    if (!c) {
      setMsg("That case could not be rebuilt.");
      return;
    }
    if (r.kind === "daily") c.name = `Daily challenge: ${EPA_BY_ID[r.epa].title}, rung ${r.rung}`;
    else c.name = `${r.kind === "master" ? "Final assessment" : "Exam"}: ${EPA_BY_ID[r.epa].title}`;
    setActivePolicy(r.epa, r.caseId, r.kind !== "daily");
    // The held-out case is attempted from the moment it loads.
    if (r.kind !== "daily") beginExam({ caseId: r.caseId, epa: r.epa, kind: "diagnostic", rung: r.rung, caseName: c.name });
    loadCase(c, r.kind === "daily" ? "challenge" : "exam", "advanced");
    setRunning(r);
    setMsg("");
  };

  const startExam = (epa: EpaId) => {
    const pick = pickExamCase(profile.logbook, epa, profile.entrustment[epa], `${today}:${profile.logbook.length}`, profile.pendingExams);
    if ("refused" in pick) setMsg(pick.refused);
    else start({ kind: "exam", epa, caseId: pick.caseId, rung: pick.rung, toward: pick.toward });
  };

  const startMaster = (epa: EpaId) => {
    const pick = pickMasterCase(profile.logbook, epa, `${today}:${profile.logbook.length}`, profile.pendingExams);
    if ("refused" in pick) setMsg(pick.refused);
    else start({ kind: "master", epa, caseId: pick.caseId, rung: pick.rung });
  };

  const leave = () => {
    if (running && running.kind !== "daily") abandonExam(running.caseId);
    setRunning(null);
  };

  if (running) {
    const done = finished && simCaseId === running.caseId;
    const row = done ? [...profile.logbook].reverse().find((r) => r.caseId === running.caseId) : undefined;
    const isExam = running.kind !== "daily";
    const policy = isExam ? null : labPolicy(profile.entrustment[running.epa]);
    return (
      <div className="h-full flex flex-col">
        <div className={`notice ${isExam ? "notice-info" : "notice-warn"} !rounded-none flex-wrap items-center`}>
          <span className="flex-1">
            {isExam
              ? `${running.kind === "master" ? "Final assessment" : `Exam toward level ${LEVEL_LABEL[(running.toward ?? 3) as EntrustLevel].roman}`}: held-out case at rung ${running.rung}. No hints, no coaching, no objectives list. Only this first attempt on the case counts; leaving before the end counts as a failed attempt.`
              : `Daily challenge: rung ${running.rung} of ${EPA_BY_ID[running.epa].title}. No hints. Logged as ${policy!.mode} practice (${roleFor(policy!.mode)}), the mode your level sets.`}
          </span>
          {row && (
            <span className={`font-medium ${row.passed ? "text-good" : "text-danger"}`}>
              {row.passed ? "Passed" : row.criticalErrors ? `Not passed: ${row.criticalErrors} critical error${row.criticalErrors === 1 ? "" : "s"}` : "Not passed"}
              {row.mode === "exam" ? ` · ${profile.entrustment[running.epa]?.next ?? ""}` : ""}
            </span>
          )}
          <button className="btn !h-7" onClick={leave}>
            {done ? "Back to assessment" : isExam ? "Leave (counts as failed)" : "Leave"}
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <Simulator title={isExam ? "Exam mode" : "Daily challenge"} hideHints showObjectives={!isExam && !!policy?.visibility.recommendedViews} />
        </div>
      </div>
    );
  }

  return (
    <SectionShell title="Assessment" subtitle="The daily challenge, exam mode on held-out cases, and the final assessment. Exams have no hints and no coaching, and a case counts only the first time you see it.">
      <div className="max-w-6xl space-y-6">
        {msg && <div className="notice notice-warn">{msg}</div>}

        <section className="panel p-5 flex flex-wrap items-center gap-6">
          <div className="flex-1 min-w-[300px]">
            <div className="text-[13px] font-medium text-accent">Daily challenge</div>
            {daily ? (
              <>
                <h2 className="text-lg font-semibold text-ink mt-0.5">{EPA_BY_ID[daily.epa].title}</h2>
                <p className="text-[13px] text-ink-soft mt-1">
                  Rung {daily.rung}, chosen from your weakest due activity. The same case all day; it is logged as {dailyPolicy!.mode} practice ({roleFor(dailyPolicy!.mode)}), the mode your level sets, and never as an exam.
                </p>
              </>
            ) : (
              <p className="text-[13px] text-ink-soft mt-1">No ladder case available.</p>
            )}
          </div>
          <button className="btn btn-accent" disabled={!daily} onClick={() => daily && start({ kind: "daily", epa: daily.epa, caseId: daily.caseId, rung: daily.rung })}>
            Start the daily challenge
          </button>
        </section>

        <section className="panel">
          <div className="panel-head">Exam mode: procedures</div>
          <div className="px-4 py-3 text-[13px] text-ink-soft border-b border-line">
            Opens at level II. Toward level III: {ENTRUST_RULES.level3.examPasses} passes on held-out cases at rungs {EXAM_BANDS[3].minRung}-{EXAM_BANDS[3].maxRung} on at least {ENTRUST_RULES.level3.minDays} days. Toward level IV:{" "}
            {ENTRUST_RULES.level4.examPasses} more at rungs {EXAM_BANDS[4].minRung}-{EXAM_BANDS[4].maxRung}. A critical error resets the count. Each exam is a case you have never seen, generated on demand; leaving one before the end counts as a failed attempt.
          </div>
          <div className="divide-y divide-line">
            {DIAGNOSTIC_EPAS.map((epa) => {
              const rec = profile.entrustment[epa];
              const level = rec?.awarded ?? 0;
              const eligible = level >= 2 && level < 4;
              return (
                <div key={epa} className="px-4 py-3 flex flex-wrap items-center gap-4">
                  <LevelBadge rec={rec} />
                  <div className="flex-1 min-w-[260px]">
                    <div className="text-[14px] text-ink">{EPA_BY_ID[epa].title}</div>
                    <div className="text-[12px] text-ink-faint mt-0.5">
                      {eligible ? `Exam passes toward the next level: ${rec!.examProgress.have} of ${rec!.examProgress.need}, on ${rec!.examProgress.days} of ${rec!.examProgress.needDays} days.` : rec?.next ?? "Log a first session."}
                    </div>
                  </div>
                  <button className="btn" disabled={!eligible} onClick={() => startExam(epa)}>
                    Start exam
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <div className="panel p-5 space-y-2">
            <div className="text-[13px] font-medium text-accent">Exam mode: reading</div>
            <p className="text-[13px] text-ink-soft">
              Reading and lesion-assessment exams are full drill sets on library runs that practice never shows, scored only at the end. They run in the Real angiograms section.
            </p>
            <button className="btn" onClick={() => openSim("angio-real", { drill: "exam" })}>
              Open reading exams
            </button>
          </div>
          <div className="panel p-5 space-y-2">
            <div className="text-[13px] font-medium text-accent">Labs without held-out cases yet</div>
            <p className="text-[13px] text-ink-soft">
              PCI, haemodynamics, MCS, structural and bedside sessions are logged as practice and can reach level II. Their exams need each lab to load held-out cases; the PCI ladder variants are ready for it.
            </p>
            <button className="btn" onClick={() => openProgress("competencies")}>
              See every activity
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <span>Final assessment</span>
            <span className="normal-case font-normal text-[12px] text-ink-faint">{profile.master.passed ? `Passed ${profile.master.passedOn}` : `All components within ${MASTER_ASSESSMENT.windowDays} days`}</span>
          </div>
          <div className="divide-y divide-line">
            {MASTER_ASSESSMENT.components.map((epa) => {
              const rec = profile.entrustment[epa];
              const c = profile.master.components[epa];
              const ready = (rec?.awarded ?? 0) >= 4 && !profile.master.passed;
              const reading = !DIAGNOSTIC_EPAS.includes(epa);
              return (
                <div key={epa} className="px-4 py-3 flex flex-wrap items-center gap-4">
                  <LevelBadge rec={rec} size="sm" />
                  <div className="flex-1 min-w-[240px] text-[14px] text-ink">{EPA_BY_ID[epa].title}</div>
                  <span className="text-[12px] text-ink-faint font-mono">{c ? `passed ${c.date}` : ready ? "ready" : "needs level IV"}</span>
                  <button className="btn" disabled={!ready} onClick={() => (reading ? openSim("angio-real", { drill: "exam" }) : startMaster(epa))}>
                    {reading ? "Reading exam" : "Start"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </SectionShell>
  );
}
