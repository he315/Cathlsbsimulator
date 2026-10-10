// Recovery after closure: the ward (proc-recovery-ward; src/simulation/session/ward.ts).
// (split from src/ui/access/panels.tsx by proc-foundation-scenarios-ledger; panels.tsx re-exports it).
//
// The learner writes the observation schedule and the mobilisation plan (nothing is preset, and outside guided mode
// nothing says which choice is right), then runs the ward: time passes in recovery time-lapses, which stop when the
// nurse calls. The chart shows only the sets of observations the nurse took, at the times the schedule gave; each set
// is reviewed. An event the ward finds opens a card with what the nurse or patient says and a first-action menu that
// does not name the problem. The radial band comes off here (the reverse Barbeau check), and the follow-up reviews
// (the 48-72 hour creatinine, the review weeks later) are answered here. Live vitals are not shown: on the ward the
// numbers are the nurse's sets.
//
// The forearm (access-cx-forearm; src/simulation/session/modules/forearm.ts): in a forearm haematoma drill the card
// lets the learner look at the forearm and hand, measure the circumference against the other arm, name the grade,
// treat it (the band moved or a second band, ice, a sling, analgesia, the pressure, an infusion stopped, protamine,
// a bandage, an arm cuff with its pressure, its deflation plan and a finger saturation probe), tell the operator and
// call the vascular surgeons. It shows what is seen, felt and measured, never the grade; a swelling the nurse's site
// check found is noted beside that set on the chart.
import { useState } from "react";
import { useProcedureStore } from "../../../state/useProcedureStore";
import type { CaseSession } from "../../../simulation/session/caseSession";
import {
  CHOLESTEROL_DX_LABEL,
  CHOLESTEROL_PLAN_LABEL,
  WARD_EVENT_RULES,
  eventTitle,
  hm,
  lowerFirst,
  wardOptionsNow,
  type CholesterolDx,
  type CholesterolPlan,
  type WardEventState,
  type WardSchedule,
} from "../../../simulation/session/ward";
import { clock, useSession } from "../panels";
import { Pleth } from "./ClosurePanel";
import { forearmOf, type ForearmModule } from "../../../simulation/session/modules/forearm";
import { FOREARM_GRADES, GRADE_LABEL, MEASURE_LABEL, type ForearmGrade, type ForearmMeasure } from "../../../simulation/access/forearm";

/** Interval choices (min) for the plan form: control settings, not clinical values. */
const VITALS_CHOICES = [5, 10, 15, 30, 60, 120];
const SITE_CHOICES = [10, 15, 30, 60];
const FLAT_CHOICES = [0, 30, 60, 120, 180];
const WALK_CHOICES = [30, 45, 60, 90, 120, 150, 180, 240];

type Choice = number | "none" | "";
interface Draft {
  arrival: { vitals: boolean; neuro: boolean; site: boolean };
  vitals: [Choice, Choice, Choice];
  siteMin: Choice;
  siteUntil: WardSchedule["siteUntil"] | "";
  distalPulses: boolean;
  ecgMonitor: boolean;
  flatMin: number | "";
  walkMin: number | "";
}
const EMPTY: Draft = {
  arrival: { vitals: false, neuro: false, site: false },
  vitals: ["", "", ""],
  siteMin: "",
  siteUntil: "",
  distalPulses: false,
  ecgMonitor: false,
  flatMin: "",
  walkMin: "",
};

const toMin = (p: Choice): number | null => (p === "none" || p === "" ? null : p);

export function RecoveryPanel() {
  const s = useSession();
  const act = useProcedureStore((x) => x.act);
  const setWorkspace = useProcedureStore((x) => x.setWorkspace);
  const [band, setBand] = useState<string | null>(null);
  const busy = s.busy;
  const w = s.ward;
  const since = w.arrivedAt ?? s.radial?.sheathOutAt ?? s.femoral?.startedAt ?? s.tS;
  const bandDue = s.radial && s.radial.bandOffAt === null ? (s.radial.sheathOutAt ?? s.tS) + s.radialBandHours * 3600 : null;
  const wardEvs = new Set(w.events.map((e) => e.ev).filter(Boolean));
  return (
    <div className="panel h-full flex flex-col overflow-hidden">
      <div className="panel-head">
        <span>Recovery ward</span>
        <span className="normal-case tracking-normal text-ink-faint text-[12px]">{clock(s.tS - since)} on the ward</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-3 max-w-4xl">
        {!s.closureDone() && <p className="text-[13px] text-ink-faint">Close the access site first.</p>}
        {s.closureDone() && (
          <>
            {!w.plan ? <PlanForm session={s} /> : <PlanSummary session={s} />}
            {w.plan && (
              <div className="flex gap-2 flex-wrap">
                <button className="btn" disabled={busy || w.nextDueRel() === null} onClick={() => act((x) => x.observeToNextSet())}>
                  To the next observations
                </button>
                <button className="btn" disabled={busy} onClick={() => act((x) => x.observe(15))}>
                  Run 15 min
                </button>
                <button className="btn" disabled={busy} onClick={() => act((x) => x.observe(60))}>
                  Run 1 hour
                </button>
                {bandDue !== null && s.tS < bandDue && (
                  <button className="btn" disabled={busy} onClick={() => act((x) => x.observe(Math.ceil((bandDue - x.tS) / 60)))}>
                    Until the band is due off
                  </button>
                )}
              </div>
            )}
            <ForearmCard session={s} />
            {/* the stroke on the table is answered at the table (TablePanel), not on the ward */}
            {w
              .openEvents()
              .filter((e) => e.kind !== "table-stroke")
              .map((e) => (
                <EventCard key={e.id} session={s} e={e} />
              ))}
            {w.plan && <ObsChart session={s} />}
            {s.radial && s.radial.bandOffAt === null && (
              <button
                className="btn self-start"
                disabled={busy}
                onClick={() => {
                  const c = act((x) => x.removeBand());
                  if (c)
                    setBand(
                      c === "D"
                        ? "No radial pulse; thumb pleth lost with the ulnar artery compressed."
                        : `Radial pulse present; pleth kept with the ulnar artery compressed (pattern ${c}).`,
                    );
                }}
              >
                Take the band off and check radial patency
              </button>
            )}
            {band && <Pleth text={band} present={!band.startsWith("No radial")} />}
            {s.presented
              .filter((p) => p.kind !== "radial-occlusion" && !wardEvs.has(p))
              .map((p, i) => (
                <div key={i} className={`notice ${p.severity === "major" ? "notice-danger" : "notice-warn"}`}>
                  Nurse at {clock(p.atS - since)}: {p.report} On examination: {p.finding}
                </div>
              ))}
            <AnsweredEvents session={s} />
            {w.arrived && <FollowUp session={s} />}
            <button className="btn btn-accent self-start mt-1" onClick={() => setWorkspace("handover")}>
              Write the handover
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** The ward plan: what the nurse checks, how often, and when the patient may get up. Nothing is preset. */
function PlanForm({ session: s }: { session: CaseSession }) {
  const act = useProcedureStore((x) => x.act);
  const [d, setD] = useState<Draft>(EMPTY);
  const ready = d.vitals.every((v) => v !== "") && d.siteMin !== "" && d.siteUntil !== "" && d.flatMin !== "" && d.walkMin !== "";
  const sel = (value: Choice, choices: number[], on: (v: Choice) => void, label: string) => (
    <select
      className="field"
      value={String(value)}
      aria-label={label}
      onChange={(e) => on(e.target.value === "" ? "" : e.target.value === "none" ? "none" : Number(e.target.value))}
    >
      <option value="">Choose</option>
      <option value="none">None</option>
      {choices.map((c) => (
        <option key={c} value={c}>
          Every {c} min
        </option>
      ))}
    </select>
  );
  const write = () => {
    if (!ready) return;
    const schedule: WardSchedule = {
      arrival: { ...d.arrival },
      vitalsMin: [toMin(d.vitals[0]), toMin(d.vitals[1]), toMin(d.vitals[2])],
      siteMin: toMin(d.siteMin),
      siteUntil: d.siteUntil as WardSchedule["siteUntil"],
      distalPulses: d.distalPulses,
      ecgMonitor: d.ecgMonitor,
    };
    act((x) =>
      x.setWardPlan(schedule, {
        flatMin: Number(d.flatMin),
        walkMin: Number(d.walkMin),
      }),
    );
  };
  const box = (k: keyof Draft["arrival"], label: string) => (
    <label className="flex items-center gap-1.5 text-[13px] text-ink">
      <input
        type="checkbox"
        aria-label={`On arrival: ${lowerFirst(label)}`}
        checked={d.arrival[k]}
        onChange={(e) => setD({ ...d, arrival: { ...d.arrival, [k]: e.target.checked } })}
      />
      {label}
    </label>
  );
  return (
    <div className="rounded-md border border-line p-3 flex flex-col gap-2.5">
      <div className="text-[13px] text-ink">Ward plan for the nurse</div>
      <div className="flex flex-col gap-1">
        <div className="text-[12px] text-ink-faint">On arrival</div>
        <div className="flex gap-4 flex-wrap">
          {box("vitals", "Pulse and blood pressure")}
          {box("neuro", "Quick neurological check")}
          {box("site", "Every access site")}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {(["First hour", "Second hour", "After that"] as const).map((label, i) => (
          <div key={label} className="flex flex-col gap-1">
            <span className="text-[12px] text-ink-faint">Observations: {label.toLowerCase()}</span>
            {sel(
              d.vitals[i],
              VITALS_CHOICES,
              (v) =>
                setD({
                  ...d,
                  vitals: d.vitals.map((x, j) => (j === i ? v : x)) as Draft["vitals"],
                }),
              `Observations, ${label.toLowerCase()}`,
            )}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[12px] text-ink-faint">Access site checks</span>
          {sel(d.siteMin, SITE_CHOICES, (v) => setD({ ...d, siteMin: v }), "Access site checks")}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[12px] text-ink-faint">Site checks continue</span>
          <select
            className="field"
            value={d.siteUntil}
            aria-label="Site checks continue"
            onChange={(e) => setD({ ...d, siteUntil: e.target.value as Draft["siteUntil"] })}
          >
            <option value="">Choose</option>
            <option value="first-hour">For the first hour</option>
            <option value="band-off">Until the band is off</option>
            <option value="mobile">Until the patient is mobile</option>
          </select>
        </div>
        <div className="flex flex-col gap-1 justify-end">
          <label className="flex items-center gap-1.5 text-[13px] text-ink">
            <input
              type="checkbox"
              aria-label="Femoral, popliteal and pedal pulses with each check"
              checked={d.distalPulses}
              onChange={(e) => setD({ ...d, distalPulses: e.target.checked })}
            />
            Femoral, popliteal and pedal pulses with each check
          </label>
          <label className="flex items-center gap-1.5 text-[13px] text-ink">
            <input
              type="checkbox"
              aria-label="Three-lead ECG monitoring"
              checked={d.ecgMonitor}
              onChange={(e) => setD({ ...d, ecgMonitor: e.target.checked })}
            />
            Three-lead ECG monitoring
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[12px] text-ink-faint">Lying flat after arrival</span>
          <select
            className="field"
            value={String(d.flatMin)}
            aria-label="Lying flat"
            onChange={(e) =>
              setD({
                ...d,
                flatMin: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
          >
            <option value="">Choose</option>
            {FLAT_CHOICES.map((c) => (
              <option key={c} value={c}>
                {c === 0 ? "No bed rest flat" : `${c} min`}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[12px] text-ink-faint">Walking from</span>
          <select
            className="field"
            value={String(d.walkMin)}
            aria-label="Walking from"
            onChange={(e) =>
              setD({
                ...d,
                walkMin: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
          >
            <option value="">Choose</option>
            {WALK_CHOICES.map((c) => (
              <option key={c} value={c}>
                {hm(c)} after arrival
              </option>
            ))}
          </select>
        </div>
      </div>
      <button className="btn btn-accent self-start" disabled={!ready || s.busy} onClick={write}>
        Write the plan
      </button>
    </div>
  );
}

/** The plan as written; in guided mode only, how each part compares with Oxford's routine. */
function PlanSummary({ session: s }: { session: CaseSession }) {
  const p = s.ward.plan!;
  const guided = s.mode === "guided";
  const g = guided ? s.ward.planGrades() : null;
  const items = g ? g.schedule.items : [];
  const mob = g ? g.mobilise : null;
  const v = p.schedule.vitalsMin.map((m) => (m === null ? "none" : `${m} min`)).join(", ");
  return (
    <div className="rounded-md border border-line p-2.5 text-[12px] text-ink-soft flex flex-col gap-1">
      <div>
        Plan written at {hm(s.ward.minutesIn(p.setAt))}: observations {v}; site checks{" "}
        {p.schedule.siteMin === null ? "none" : `every ${p.schedule.siteMin} min`}; flat {p.mobilise.flatMin} min, walking from {hm(p.mobilise.walkMin)}.
      </div>
      {guided &&
        [...items, ...(mob ? [mob] : [])].map((i) => (
          <div key={i.id} className={i.correct ? "text-ink-faint" : "text-ink"}>
            {i.label}: {i.correct ? "as Oxford's routine" : `Oxford: ${lowerFirst(i.expected)}`}
          </div>
        ))}
    </div>
  );
}

/** The nurse's chart: one row per set taken, each to be reviewed. */
function ObsChart({ session: s }: { session: CaseSession }) {
  const act = useProcedureStore((x) => x.act);
  const sets = s.ward.sets;
  if (!sets.length) return <p className="text-[12px] text-ink-faint">No observations charted yet.</p>;
  const unreviewed = sets.filter((x) => x.reviewedAt === null).length;
  const before = s.wardStartPulses();
  // what the nurse felt at a site check in a forearm haematoma drill (the forearm module's note for that set)
  const forearmNotes = forearmOf(s)?.state.episode?.siteNotes ?? {};
  return (
    <div className="rounded-md border border-line overflow-x-auto">
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-line">
        <span className="text-[13px] text-ink">Observation chart</span>
        <button className="btn btn-ghost" disabled={!unreviewed} onClick={() => act((x) => x.reviewWardSet("all"))}>
          Review all ({unreviewed})
        </button>
      </div>
      <div className="px-2.5 py-1 border-b border-line text-[12px] text-ink-soft">Pulses recorded before access: {before ?? "not recorded"}</div>
      <table className="w-full text-[12px]">
        <thead className="text-ink-faint text-left">
          <tr>
            <th className="px-2 py-1 font-normal">Time</th>
            <th className="px-2 py-1 font-normal">Pulse</th>
            <th className="px-2 py-1 font-normal">BP</th>
            <th className="px-2 py-1 font-normal">SpO2</th>
            <th className="px-2 py-1 font-normal">RR</th>
            <th className="px-2 py-1 font-normal">Site, pulses, neurology</th>
            <th className="px-2 py-1 font-normal" />
          </tr>
        </thead>
        <tbody>
          {sets.map((x, i) => (
            <tr key={i} className="border-t border-line align-top">
              <td className="px-2 py-1 metric">{hm(x.atMin)}</td>
              <td className="px-2 py-1 metric">{x.hr ?? (x.kinds.includes("vitals") ? "-" : "")}</td>
              <td className="px-2 py-1 metric">{x.bp ? `${x.bp.sys}/${x.bp.dia}` : ""}</td>
              <td className="px-2 py-1 metric">{x.spo2 ?? ""}</td>
              <td className="px-2 py-1 metric">{x.rr ?? ""}</td>
              <td className="px-2 py-1 text-ink-soft">
                {[x.rhythm && `ECG: ${x.rhythm}`, forearmNotes[i] ?? x.site, x.pulses, x.neuro, x.remark].filter(Boolean).join(" ")}
              </td>
              <td className="px-2 py-1 text-right">
                {x.reviewedAt === null ? (
                  <button className="btn btn-ghost" aria-label={`Review the set at ${hm(x.atMin)}`} onClick={() => act((y) => y.reviewWardSet(i))}>
                    Review
                  </button>
                ) : (
                  <span className="text-ink-faint">Reviewed</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A found event: what the nurse or patient says, what has been done, and the first-action menu. */
function EventCard({ session: s, e }: { session: CaseSession; e: WardEventState }) {
  const act = useProcedureStore((x) => x.act);
  const rule = WARD_EVENT_RULES[e.kind];
  const done = new Set(e.actions.map((a) => a.id));
  return (
    <div className="notice notice-warn flex flex-col gap-2">
      <div className="text-[13px]">
        {eventTitle(e.kind)}
        {foundWhen(s, e)}: {e.report}
      </div>
      {e.actions.length > 0 && (
        <ol className="text-[12px] text-ink-soft list-decimal pl-5">
          {e.actions.map((a, i) => (
            <li key={i}>
              {rule.options.find((o) => o.id === a.id)?.label}
              {a.result ? `: ${a.result}` : ""}
            </li>
          ))}
        </ol>
      )}
      <div className="flex gap-1.5 flex-wrap">
        {wardOptionsNow(
          e.kind,
          e.actions.map((a) => a.id),
        ).map((o) => (
          <button key={o.id} className="btn" disabled={s.busy || done.has(o.id)} onClick={() => act((x) => x.wardAct(e.id, o.id))}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** When an event was found, on the ward clock; a blood result at the review is not on that clock (its line gives its time). */
function foundWhen(s: CaseSession, e: WardEventState): string {
  return e.foundBy === "bloods" ? "" : ` at ${hm(s.ward.minutesIn(e.foundS ?? s.tS))}`;
}

/** Events already answered, in a line each. */
function AnsweredEvents({ session: s }: { session: CaseSession }) {
  const done = s.ward.events.filter((e) => e.resolvedAt !== null && e.kind !== "table-stroke");
  if (!done.length) return null;
  return (
    <div className="flex flex-col gap-1 text-[12px] text-ink-soft">
      {done.map((e) => (
        <div key={e.id}>
          {eventTitle(e.kind)}
          {foundWhen(s, e)}: {e.actions.map((a) => lowerFirst(WARD_EVENT_RULES[e.kind].options.find((o) => o.id === a.id)?.label ?? a.id)).join(", then ")}.
        </div>
      ))}
    </div>
  );
}

/** The follow-up reviews: the creatinine at 48-72 hours, and the review weeks later. */
function FollowUp({ session: s }: { session: CaseSession }) {
  const act = useProcedureStore((x) => x.act);
  const [renal, setRenal] = useState<string | null>(null);
  const [dx, setDx] = useState<CholesterolDx | "">("");
  const [plan, setPlan] = useState<CholesterolPlan | "">("");
  const c = s.ward.cholesterol;
  // the reviews after the ward come once the patient is ready to leave it: the plan written, the band off, walking
  const w = s.ward;
  const ready = !!w.plan && !(s.radial && s.radial.bandOffAt === null) && w.minutesIn() >= w.plan.mobilise.walkMin;
  return (
    <div className="rounded-md border border-line p-2.5 flex flex-col gap-2">
      <div className="text-[13px] text-ink">Follow-up</div>
      {!ready && (
        <div className="text-[12px] text-ink-faint">
          The follow-up reviews come after the ward: once the plan is written, the band is off and the patient is walking.
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        <button className="btn" disabled={s.busy || !ready || s.ward.followUpAt !== null} onClick={() => setRenal(act((x) => x.wardFollowUp()) ?? null)}>
          The bloods at 48-72 hours
        </button>
        <button className="btn" disabled={s.busy || !ready || !!c} onClick={() => act((x) => x.ward.presentCholesterolFollowUp())}>
          Review three weeks later
        </button>
      </div>
      {renal && <div className="text-[12px] text-ink-soft">{renal}</div>}
      {c && <div className="text-[12px] text-ink-soft">{c.text}</div>}
      {c?.present && !c.assessed && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select className="field" value={dx} aria-label="What is it?" onChange={(e) => setDx(e.target.value as CholesterolDx)}>
            <option value="">What is it?</option>
            {(Object.keys(CHOLESTEROL_DX_LABEL) as CholesterolDx[]).map((k) => (
              <option key={k} value={k}>
                {CHOLESTEROL_DX_LABEL[k]}
              </option>
            ))}
          </select>
          <select className="field" value={plan} aria-label="The plan" onChange={(e) => setPlan(e.target.value as CholesterolPlan)}>
            <option value="">The plan</option>
            {(Object.keys(CHOLESTEROL_PLAN_LABEL) as CholesterolPlan[]).map((k) => (
              <option key={k} value={k}>
                {CHOLESTEROL_PLAN_LABEL[k]}
              </option>
            ))}
          </select>
          <button className="btn" disabled={!dx || !plan} onClick={() => dx && plan && act((x) => x.ward.assessCholesterol(dx, plan))}>
            Record the assessment
          </button>
        </div>
      )}
      {c?.assessed && <div className="text-[12px] text-ink-faint">Assessment recorded.</div>}
    </div>
  );
}

/** The measures offered as buttons (the cuff and protamine have their own controls), in the card's order. */
const FOREARM_BUTTONS: readonly Exclude<ForearmMeasure, "cuff" | "reverse-heparin">[] = [
  "reposition-band",
  "second-band",
  "ice",
  "sling",
  "analgesia",
  "bp-control",
  "stop-infusion",
  "bandage",
  "inform",
  "call-surgeons",
];
/** Measures that stay in place once started (their button is then shown as done). */
const STAYS: readonly ForearmMeasure[] = ["reposition-band", "second-band", "ice", "sling", "bandage"];
/** Cuff deflation choices (min; null: none): control settings, not clinical values. */
const DEFLATE_CHOICES: readonly (number | null)[] = [null, 15, 30];

/**
 * The forearm in a forearm haematoma drill: what the nurse and the patient said, the look, the tape, the grade the
 * learner gives and the measures. Nothing here names the grade or says whether a choice was right.
 */
function ForearmCard({ session: s }: { session: CaseSession }) {
  const act = useProcedureStore((x) => x.act);
  const [grade, setGrade] = useState<ForearmGrade | "">("");
  const [mg, setMg] = useState("");
  const [cuffMmHg, setCuffMmHg] = useState("");
  const [deflate, setDeflate] = useState<string>("");
  const [probe, setProbe] = useState(false);
  const m = forearmOf(s);
  if (!m || !m.state.config) return null;
  const e = m.state.episode;
  const found = !!e && e.foundT !== null;
  const inTheatre = !!e && e.fasciotomyT !== null;
  const busy = s.busy;
  const w = s.ward;
  const when = (t: number) => (w.arrivedAt !== null ? hm(w.minutesIn(t)) : clock(t));
  const doIt = (fn: (x: ForearmModule) => unknown) => act((x) => fn(forearmOf(x)!));
  const last = e?.measurements[e.measurements.length - 1];
  const done = new Set(e?.inPlace ?? []);
  const cuff = e?.cuff ?? null;
  const results = (e?.actions ?? []).filter((a) => a.id === "look" || a.id === "bp" || a.id === "finger-sat").slice(-2);
  // the last note is shown only when the timed lines above do not already show it
  const newest = e?.actions[e.actions.length - 1];
  const lastMeasure = [...(e?.actions ?? [])].reverse().find((a) => a.id === "measure");
  const note =
    m.state.note && m.state.note !== newest?.text && m.state.note !== lastMeasure?.text && !results.some((r) => r.text === m.state.note) ? m.state.note : null;
  return (
    <div className="rounded-md border border-line p-3 flex flex-col gap-2.5">
      <div className="text-[13px] text-ink">The arm with the band</div>
      {(e?.calls ?? []).map((c, i) => (
        <div key={i} className="notice notice-warn text-[12px]">
          {when(c.t)}: {c.text}
        </div>
      ))}
      {!inTheatre && (
        <div className="flex gap-1.5 flex-wrap">
          <button className="btn" disabled={busy} onClick={() => doIt((x) => x.actions.look())}>
            Look at the forearm and hand
          </button>
          <button className="btn" disabled={busy} onClick={() => doIt((x) => x.actions.measure())}>
            Measure the circumference
          </button>
          <button className="btn" disabled={busy} onClick={() => doIt((x) => x.actions.bloodPressure())}>
            Blood pressure, other arm
          </button>
          <button className="btn" disabled={busy} onClick={() => doIt((x) => x.actions.fingerSat())}>
            Finger saturation, this hand
          </button>
        </div>
      )}
      {results.map((r, i) => (
        <div key={i} className="text-[12px] text-ink-soft">
          {when(r.t)}: {r.text}
        </div>
      ))}
      {last && (
        <div className="rounded-md border border-line overflow-x-auto">
          <div className="px-2.5 py-1.5 border-b border-line text-[12px] text-ink-soft">
            Circumference at {when(last.t)}
            {e && e.measurements.length > 1 ? ` (measured ${e.measurements.length} times)` : ""}
          </div>
          <table className="w-full text-[12px]">
            <thead className="text-ink-faint text-left">
              <tr>
                <th className="px-2 py-1 font-normal">Mark</th>
                <th className="px-2 py-1 font-normal">This arm</th>
                <th className="px-2 py-1 font-normal">Other arm</th>
              </tr>
            </thead>
            <tbody>
              {last.marks.map((k) => (
                <tr key={k.label} className="border-t border-line">
                  <td className="px-2 py-1 text-ink-soft">{k.label}</td>
                  <td className="px-2 py-1 metric">{k.cm.toFixed(1)} cm</td>
                  <td className="px-2 py-1 metric">{k.otherCm.toFixed(1)} cm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {found && !inTheatre && (
        <>
          <div className="flex gap-2 flex-wrap items-center">
            <select
              className="field"
              value={String(grade)}
              aria-label="Haematoma grade"
              onChange={(ev) => setGrade(ev.target.value === "" ? "" : (Number(ev.target.value) as ForearmGrade))}
            >
              <option value="">Grade</option>
              {FOREARM_GRADES.map((g) => (
                <option key={g} value={g}>
                  Grade {GRADE_LABEL[g]}
                </option>
              ))}
            </select>
            <button className="btn" disabled={busy || grade === ""} onClick={() => grade !== "" && doIt((x) => x.actions.nameGrade(grade))}>
              Record the grade
            </button>
            {e && e.graded.length > 0 && <span className="text-[12px] text-ink-faint">Recorded: grade {GRADE_LABEL[e.graded[e.graded.length - 1].grade]}</span>}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {FOREARM_BUTTONS.map((id) => (
              <button key={id} className="btn" disabled={busy || (STAYS.includes(id) && done.has(id))} onClick={() => doIt((x) => x.actions.apply(id))}>
                {MEASURE_LABEL[id]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] text-ink-faint">Heparin reversal</span>
              <div className="flex gap-1.5 items-center">
                <input
                  className="field w-24"
                  inputMode="decimal"
                  aria-label="Protamine (mg)"
                  placeholder="mg"
                  value={mg}
                  onChange={(ev) => setMg(ev.target.value)}
                />
                <button className="btn" disabled={busy || !(Number(mg) > 0)} onClick={() => doIt((x) => x.actions.reverseHeparin(Number(mg)))}>
                  Protamine, slowly
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] text-ink-faint">Arm cuff</span>
              {cuff ? (
                <div className="flex gap-1.5 items-center flex-wrap">
                  <span className="text-[12px] text-ink-soft">
                    {Math.round(cuff.setting.mmHg)} mmHg,{" "}
                    {cuff.setting.deflateEveryMin === null ? "no plan to let it down" : `let down every ${cuff.setting.deflateEveryMin} min`};{" "}
                    {cuff.inflated ? "up now" : "down now"}
                  </span>
                  <button className="btn" disabled={busy} onClick={() => doIt((x) => x.actions.cuffOff())}>
                    Let the cuff down and take it off
                  </button>
                </div>
              ) : (
                <div className="flex gap-1.5 items-center flex-wrap">
                  <input
                    className="field w-24"
                    inputMode="numeric"
                    aria-label="Cuff pressure (mmHg)"
                    placeholder="mmHg"
                    value={cuffMmHg}
                    onChange={(ev) => setCuffMmHg(ev.target.value)}
                  />
                  <select className="field" value={deflate} aria-label="Let the cuff down" onChange={(ev) => setDeflate(ev.target.value)}>
                    <option value="">Let it down</option>
                    {DEFLATE_CHOICES.map((c) => (
                      <option key={String(c)} value={c === null ? "none" : String(c)}>
                        {c === null ? "No plan" : `Every ${c} min`}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1.5 text-[13px] text-ink">
                    <input type="checkbox" aria-label="Saturation probe on a finger" checked={probe} onChange={(ev) => setProbe(ev.target.checked)} />
                    Saturation probe on a finger
                  </label>
                  <button
                    className="btn"
                    disabled={busy || !(Number(cuffMmHg) > 0) || deflate === ""}
                    onClick={() =>
                      doIt((x) =>
                        x.actions.cuff({
                          mmHg: Number(cuffMmHg),
                          deflateEveryMin: deflate === "none" ? null : Number(deflate),
                          fingerSat: probe,
                        }),
                      )
                    }
                  >
                    Inflate the cuff
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {e && e.actions.some((a) => a.id !== "look" && a.id !== "measure" && a.id !== "bp" && a.id !== "finger-sat") && (
        <ol className="text-[12px] text-ink-soft list-decimal pl-5">
          {e.actions
            .filter((a) => a.id !== "look" && a.id !== "measure" && a.id !== "bp" && a.id !== "finger-sat")
            .map((a, i) => (
              <li key={i}>
                {when(a.t)}: {a.text}
              </li>
            ))}
        </ol>
      )}
      {note && <div className="text-[12px] text-ink-faint">{note}</div>}
    </div>
  );
}
