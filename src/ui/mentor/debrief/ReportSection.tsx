// ---------------------------------------------------------------------------
// The debrief's Study report tab (diag-study-report): the learner's finish-step
// report set against the case, after the case only. Each wall with what the
// learner assigned and what supplied it, the grafts, the MI classification,
// the decision with the reasons to defer that applied, the PCI target written
// for the hand-over, and the report's gaps with the lesson that teaches each.
// The gaps come from the same rules as the debrief check
// (src/mentor/debriefChecks/report.ts), so the tab lists all of them even when
// the debrief's top three are taken by others.
// ---------------------------------------------------------------------------

import { DEFERRAL_REASONS, LV_WALL_LABEL, MI_CLASS_LABEL, STUDY_DECISION_LABEL, studyReportGaps, wallSupplyLabel, type StudyComparison, type WallTruth } from "../../../mentor/report";
import type { DebriefSection, DebriefSectionProps } from "./index";

const PATENCY_LABEL = { patent: "Patent", occluded: "Occluded", "not-seen": "Not seen" } as const;
const STATUS_LABEL = { patent: "Patent", diseased: "Diseased", occluded: "Occluded" } as const;
const LV_LABEL = { "not-assessed": "Not assessed", normal: "Normal", mild: "Mildly impaired", moderate: "Moderately impaired", severe: "Severely impaired" } as const;
const VALVE_LABEL = { "not-assessed": "Not assessed", normal: "Normal", abnormal: "Abnormal" } as const;

function Verdict({ ok }: { ok: boolean }) {
  return <span className={`text-[13px] ${ok ? "text-good" : "text-danger"}`}>{ok ? "Agrees" : "Differs"}</span>;
}

/** What supplied a wall, with the other answers that account for it (a graft, collaterals beyond an occlusion). */
function truthLabel(t: WallTruth, graftName: (id: string) => string): string {
  const alt = [...t.graftIds.map(graftName), ...(t.via ?? []).map((v) => `${v.artery} from the ${v.injection} injection, by collaterals`)];
  return `${t.artery} from the ${t.injection} injection${alt.length ? ` (or ${alt.join("; ")})` : ""}`;
}

function reasonTitle(id: string): string {
  return DEFERRAL_REASONS.find((r) => r.id === id)?.title ?? id;
}

function ReportBody({ model, onOpenLesson }: DebriefSectionProps) {
  const s = model.report?.study as StudyComparison;
  const graftName = (id: string) => s.graftPatency.find((g) => g.graftId === id)?.label ?? id;
  const gaps = studyReportGaps(model.report);
  return (
    <div className="space-y-5" data-section="study-report">
      <div>
        <h3 className="mb-2 text-[14px] font-semibold text-ink">Territories</h3>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-ink-faint">
              <th className="py-1 pr-3 font-normal">Wall</th>
              <th className="py-1 pr-3 font-normal">You</th>
              <th className="py-1 pr-3 font-normal">Case</th>
              <th className="py-1 font-normal" />
            </tr>
          </thead>
          <tbody>
            {s.territories.map((x) => (
              <tr key={x.wall} className="border-t border-line" data-wall={x.wall}>
                <td className="py-1.5 pr-3 text-ink-soft">{LV_WALL_LABEL[x.wall]}</td>
                <td className="py-1.5 pr-3 text-ink">{wallSupplyLabel(x.learner, graftName)}</td>
                <td className="py-1.5 pr-3 text-ink-soft">{x.truth ? truthLabel(x.truth, graftName) : "Not modelled"}</td>
                <td className="py-1.5">
                  <Verdict ok={x.correct} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {s.graftPatency.length > 0 && (
        <div>
          <h3 className="mb-2 text-[14px] font-semibold text-ink">Grafts</h3>
          <ul className="space-y-1 text-[13px]">
            {s.graftPatency.map((g) => (
              <li key={g.graftId} className="flex flex-wrap gap-3">
                <span className="w-48 text-ink-soft">{g.label}</span>
                <span className="text-ink">You {g.learner ? PATENCY_LABEL[g.learner].toLowerCase() : "not reported"}</span>
                <span className="text-ink-soft">Case {STATUS_LABEL[g.truth].toLowerCase()}</span>
                <Verdict ok={g.correct} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-x-6 gap-y-1 text-[13px] sm:grid-cols-[auto_1fr]">
        <span className="text-ink-faint">Runs declared non-diagnostic</span>
        <span className="text-ink">{s.nonDiagnosticRuns.length ? s.nonDiagnosticRuns.map((n) => `run ${n}`).join(", ") : "None"}</span>
        <span className="text-ink-faint">LV</span>
        <span className="text-ink">{LV_LABEL[s.lv]}</span>
        <span className="text-ink-faint">Valves</span>
        <span className="text-ink">{VALVE_LABEL[s.valves]}</span>
        {s.mi && (
          <>
            <span className="text-ink-faint">MI classification</span>
            <span className="text-ink">
              You {s.mi.learner ? MI_CLASS_LABEL[s.mi.learner] : "not given"}; the angiogram supports {MI_CLASS_LABEL[s.mi.truth]} <Verdict ok={s.mi.correct} />
            </span>
          </>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-[14px] font-semibold text-ink">Decision</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
          <dt className="text-ink-faint">You</dt>
          <dd className="text-ink">{s.decision ? STUDY_DECISION_LABEL[s.decision] : "No decision"}</dd>
          <dt className="text-ink-faint">Reasons to defer you gave</dt>
          <dd className="text-ink">{s.deferralGiven.length ? s.deferralGiven.map(reasonTitle).join(", ") : "None"}</dd>
          <dt className="text-ink-faint">Reasons the case carried</dt>
          <dd className="text-ink-soft">{s.deferralApplies.length ? s.deferralApplies.map(reasonTitle).join(", ") : "None the lab can judge"}</dd>
          {s.target && (
            <>
              <dt className="text-ink-faint">PCI target</dt>
              <dd className="text-ink" data-target={s.target.target.lesionId}>
                {s.target.target.vessel}
                {s.target.target.segment ? `, ${s.target.target.segment}` : ""}
                {s.target.target.qcaPct !== null ? `, your QCA ${s.target.target.qcaPct}%` : ""}
                {s.target.target.lengthMm !== null ? `, ${s.target.target.lengthMm} mm` : ""}
                <span className="text-ink-soft">{s.target.matched ? `; the case lesion there is ${s.target.truthPct}%` : "; the case has no lesion on that vessel in that segment"}</span>
              </dd>
            </>
          )}
        </dl>
      </div>

      {gaps.length > 0 && (
        <div>
          <h3 className="mb-2 text-[14px] font-semibold text-ink">What the report missed</h3>
          <ul className="space-y-2">
            {gaps.map((g) => (
              <li key={g.id} className="rounded-lg border border-line bg-base-800 p-3" data-gap={g.id}>
                <div className="text-[14px] font-medium text-ink">{g.title}</div>
                {g.advocacy && <p className="mt-1 text-[13px] text-ink-soft">{g.advocacy}</p>}
                <p className="mt-1 text-[13px] text-ink-soft">{g.teaching}</p>
                {g.lessonId && (
                  <button type="button" className="btn btn-ghost mt-2 px-2 py-0.5 text-xs" data-lesson={g.lessonId} onClick={() => onOpenLesson(g.lessonId!)}>
                    Open lesson
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export const section: DebriefSection = {
  id: "study-report",
  label: "Study report",
  order: 20,
  applies: ({ model }) => !!model.report?.study,
  Component: ReportBody,
};
