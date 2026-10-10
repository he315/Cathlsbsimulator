// The diagnosis and debrief of the haemodynamics lab (split from HaemoLab.tsx): the options in a fixed
// order, then, once one is submitted, the answer, the explanation, what to look for, the data set
// collected in each measurement set, the learner's calculations beside the reference values the
// study graded against (gradedTruth()) and, for a shock preset, the decision the table gives after PCI.
import { derive, withSet } from "../../simulation/haemo";
import {
  CALCS,
  SHOCK_ACTIONS,
  baseScenario,
  dataChecklist,
  diagnosisOptions,
  expectedDecision,
  gradedTruth,
  referenceValue,
  shockRow,
  visitedSets,
  type HaemoStudyState,
  type SetKey,
} from "../../simulation/haemoStudy";

export interface DiagnosisPanelProps {
  study: HaemoStudyState;
  onAnswer: (index: number) => void;
  onRepeat: () => void;
}

const SET_LABEL: Record<SetKey, string> = { base: "", pre: "Before PCI", post: "After PCI" };
const fmt = (x: number, d: number) => (Number.isFinite(x) ? x.toFixed(d) : "—");

export default function DiagnosisPanel({ study, onAnswer, onRepeat }: DiagnosisPanelProps) {
  const s = baseScenario(study);
  const opts = diagnosisOptions(s);
  const checklist = dataChecklist(s);
  const sets = visitedSets(study);
  const cur = study.sets[study.set];
  const got = cur ? checklist.filter((q) => q.ok(cur.rec)).length : 0;
  const answer = study.answer;
  const expected = expectedDecision(s);
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="stat-label">Diagnosis</div>
        <span className="text-[12px] text-ink-faint">
          data collected {got}/{checklist.length}
        </span>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        {opts.map((o, i) => {
          const show = answer !== null;
          const right = o === s.diagnosis;
          return (
            <button
              key={o}
              disabled={show}
              onClick={() => onAnswer(i)}
              className={`text-left rounded-lg border px-3 py-2 text-[14px] transition-colors ${
                !show
                  ? "border-line hover:border-accent/50 text-ink-soft"
                  : right
                    ? "border-good/60 bg-good/[0.08] text-ink"
                    : i === answer
                      ? "border-danger/60 bg-danger/[0.08] text-ink-soft"
                      : "border-line opacity-50 text-ink-faint"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
      {answer !== null && (
        <div className="mt-3 animate-fadein">
          <div className={`text-sm font-semibold ${opts[answer] === s.diagnosis ? "text-good" : "text-danger"}`}>{opts[answer] === s.diagnosis ? "Correct" : `The answer is: ${s.diagnosis}`}</div>
          <p className="text-[14px] text-ink-soft leading-relaxed mt-1">{s.explanation}</p>
          <div className="stat-label mt-3 mb-1">What to look for</div>
          <ul className="list-disc pl-5 text-[13px] text-ink-soft space-y-0.5">
            {s.keyFindings.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
          {sets.map((k) => {
            const m = study.sets[k]!;
            const sk = withSet(s, k === "base" ? null : k);
            const d = gradedTruth(sk);
            const model = derive(sk);
            const pvNote = sk.sats.pv !== undefined && (m.entries.qpqs || m.entries.pvr);
            const entered = CALCS.filter((c) => m.entries[c.key]);
            return (
              <div key={k}>
                <div className="stat-label mt-3 mb-1">Your data set{SET_LABEL[k] ? `: ${SET_LABEL[k]}` : ""}</div>
                <ul className="text-[13px] space-y-0.5">
                  {checklist.map((q) => (
                    <li key={q.key} className={q.ok(m.rec) ? "text-good" : "text-warn"}>
                      {q.ok(m.rec) ? "✓" : "○"} {q.label}
                    </li>
                  ))}
                </ul>
                <div className="stat-label mt-2 mb-1">Your calculations</div>
                {entered.length === 0 ? (
                  <p className="text-[13px] text-ink-faint">None entered.</p>
                ) : (
                  <table className="w-full text-[13px] font-mono">
                    <tbody>
                      {entered.map((c) => {
                        const e = m.entries[c.key]!;
                        return (
                          <tr key={c.key} className="border-b border-line/50">
                            <td className="py-1 pr-2 font-sans text-ink-soft">{c.label}</td>
                            <td className={`py-1 text-right ${e.accepted ? "text-good" : "text-warn"}`}>{e.value}</td>
                            <td className="py-1 text-right text-ink-faint">
                              ref {fmt(referenceValue(d, c.key), c.dp)} {c.unit}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
                {pvNote && (
                  <p className="text-[12.5px] mt-1 text-ink-faint">
                    Qp:Qs and PVR were graded with the pulmonary venous saturation taken as SaO₂ ({Math.round(sk.sats.Ao * 100)}%), since the pulmonary veins were not sampled. With the model's pulmonary venous saturation of {Math.round(sk.sats.pv! * 100)}%, Qp:Qs is {fmt(model.qpqs, 2)} and PVR {fmt(model.pvr, 2)} WU.
                  </p>
                )}
                {k === "post" && expected && (
                  <p className="text-[13px] mt-2 text-ink-soft">
                    Decision: {SHOCK_ACTIONS.find((a) => a.id === m.decision)?.label ?? "none made"}.{" "}
                    <span className={m.decision === expected ? "text-good" : "text-warn"}>
                      The table reads CPO {fmt(d.cpo, 2)} W and PAPi {fmt(d.papi, 2)} as: {shockRow(d.cpo, d.papi).action}.
                    </span>
                  </p>
                )}
              </div>
            );
          })}
          <button className="btn mt-3" onClick={onRepeat}>
            Repeat this study
          </button>
        </div>
      )}
    </div>
  );
}
