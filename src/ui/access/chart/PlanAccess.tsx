// The full case's access plan (access-route-decision): a chart section (src/ui/access/chart/index.ts)
// over the session module 'route-plan' (src/simulation/session/modules/routePlan.ts). Before access
// the learner reads the patient card, feels the pulses (and can measure the radial artery with the
// calipers on the ultrasound view), then plans the site, the sheath and a fallback, and for a wrist
// site the radial spasm plan, and states the plan. Choosing a site moves the case's planned access;
// the plan is fixed at the first skin puncture. After closure the pulses are felt again here.
// Nothing on this section says which choice is right: the ledger scores the plan for the debrief.
// The vasodilator doses on the spasm plan are the module text's (pm-engaging-spasm: Brilakis gives
// verapamil 2.5 mg and nitroglycerin 100-200 mcg after the sheath); the order itself is given from the
// orders panel. Device names are generic.
import type { CaseSection, CaseSectionProps } from "./index";
import { useProcedureStore } from "../../../state/useProcedureStore";
import { labSheathFor, plannableSite, routePlanOf, type PulseRecord } from "../../../simulation/session/modules/routePlan";
import { SHEATHS } from "../../../simulation/access/closure";
import {
  PLAN_SITES,
  frsFor,
  PULSE_SITES,
  cardLines,
  lengthsFor,
  pulseLabel,
  pulseWords,
  siteName,
  type PlanFr,
  type PlanLengthCm,
  type PlanSiteId,
  type PulseSiteId,
  type RoutePlan,
  type SheathType,
  type SpasmPlan,
} from "../../../simulation/access/siteChoice";

const SPASM_ITEMS: { key: keyof SpasmPlan; label: string }[] = [
  { key: "sedation", label: "Moderate sedation before the puncture" },
  { key: "local", label: "Local anaesthetic before the puncture" },
  { key: "verapamil", label: "Verapamil 2.5 mg into the artery after the sheath" },
  { key: "gtn", label: "Nitroglycerin 100-200 µg into the artery after the sheath" },
];

/** Session time as m:ss (the chart's clock format; panels.tsx is not imported here, it imports this registry). */
const clock = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

const siteOption = (id: PlanSiteId, first = false) => {
  const p = PLAN_SITES.find((x) => x.id === id)!;
  // the left groin is not yet a planned site in this lab (routePlan.ts LEFT_GROIN_PLANNABLE); it stays a fallback
  if (first && !plannableSite(id)) return `${p.label} (not yet available in this lab)`;
  return p.labNote ? `${p.label} (${p.labNote})` : p.label;
};

/**
 * The sheath the case will run when the lab's catalogue lacks the planned one (closure.ts SHEATHS: 5, 6,
 * 6 thin-walled and 7 Fr; wrist sheaths 10 cm), said where the plan is made; null when it runs as planned.
 */
export function labSheathNote(plan: Pick<RoutePlan, "sheathFr" | "sheathType" | "lengthCm" | "site">): string | null {
  const lab = labSheathFor(plan);
  const spec = SHEATHS[lab.id];
  const sizeDiffers = spec.fr !== plan.sheathFr || (plan.sheathType === "thin") !== (lab.id === "6-thin");
  const lengthDiffers = lab.lengthCm !== plan.lengthCm;
  if (!sizeDiffers && !lengthDiffers) return null;
  const why = [
    sizeDiffers ? `the lab stocks ${Object.values(SHEATHS).map((x) => x.label).join(", ")} sheaths` : "",
    lengthDiffers ? `its wrist sheaths are ${lab.lengthCm} cm` : "",
  ].filter(Boolean);
  return `The case runs this as a ${spec.label}, ${lab.lengthCm} cm sheath (${why.join("; ")}).`;
}

function PulseGrid({ records, onFeel, disabled, readOnly = false }: { records: PulseRecord[]; onFeel: (id: PulseSiteId) => void; disabled: boolean; readOnly?: boolean }) {
  const last = new Map(records.map((r) => [r.id, r]));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
      {PULSE_SITES.map((id) => {
        const r = last.get(id);
        return (
          <div key={id} className="flex items-center justify-between gap-2 rounded-md border border-line px-2 py-1" data-pulse={id}>
            <span className="text-[12px] text-ink-soft leading-snug">{pulseLabel(id)}</span>
            {r ? (
              <span className="text-[12px] text-ink">{pulseWords(r.finding)}</span>
            ) : readOnly ? (
              <span className="text-[12px] text-ink-faint">not felt</span>
            ) : (
              <button className="btn btn-ghost" disabled={disabled} onClick={() => onFeel(id)}>
                Feel
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PlanAccessSection({ session, act }: CaseSectionProps) {
  const m = routePlanOf(session);
  if (!m) return null;
  const st = m.state;
  const plan = st.plan;
  const busy = session.busy;
  const locked = st.locked;
  const after = session.closureDone();
  const site = PLAN_SITES.find((x) => x.id === plan.site)!;
  const set = (patch: Parameters<typeof m.actions.setPlan>[0]) => {
    act((x) => routePlanOf(x)?.actions.setPlan(patch));
    // the store keeps the planned access for the next case it opens
    useProcedureStore.setState?.({ access: session.access });
  };
  const before = st.pulses.filter((p) => p.phase === "before");
  const end = st.pulses.filter((p) => p.phase === "after");
  const us = Object.entries(st.radialUs) as [string, number][];
  const labNote = labSheathNote(plan);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="text-[13px] font-medium text-ink-soft">Patient card</div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
          {cardLines(st.card).map((l, i) => (
            <div key={i} className="contents">
              <dt className="text-[12px] text-ink-faint">{l.label}</dt>
              <dd className="text-[13px] text-ink-soft leading-snug">{l.text}</dd>
            </div>
          ))}
        </dl>
      </div>

      {after && (
        <div className="flex flex-col gap-1.5" data-start-pulses="">
          {/* the pulses examined before access, beside the end-of-case recheck (the hand-over's start pulses) */}
          <span className="text-[13px] font-medium text-ink-soft">Pulses at the start (before access)</span>
          <PulseGrid records={m.actions.startPulses()} onFeel={() => undefined} disabled readOnly />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-medium text-ink-soft">{after ? "Pulses at the end" : "Pulses"}</span>
          <button className="btn btn-ghost" disabled={busy} onClick={() => act((x) => routePlanOf(x)?.actions.palpateAll())}>
            Feel all
          </button>
        </div>
        <PulseGrid records={after ? end : before} onFeel={(id) => act((x) => routePlanOf(x)?.actions.palpate(id))} disabled={busy} />
        {us.length > 0 && (
          <p className="text-[12px] text-ink-soft">
            {us.map(([side, mm]) => `${side === "right" ? "Right" : "Left"} radial on ultrasound: ${mm.toFixed(1)} mm`).join("; ")}.
          </p>
        )}
        {!locked && !us.length && <p className="text-[12px] text-ink-faint leading-snug">The radial artery can be measured with the calipers on the ultrasound view.</p>}
      </div>

      <fieldset className="flex flex-col gap-2 min-w-0" disabled={locked || busy}>
        <div className="text-[13px] font-medium text-ink-soft">Plan</div>
        <label className="flex items-center gap-2 min-w-0 text-[12px] text-ink-soft">
          <span className="w-16 shrink-0">Site</span>
          <select className="field flex-1 min-w-0" value={plan.site} onChange={(e) => set({ site: e.target.value as PlanSiteId })} aria-label="Planned access site">
            {PLAN_SITES.map((p) => (
              <option key={p.id} value={p.id} disabled={!plannableSite(p.id) && p.id !== plan.site}>
                {siteOption(p.id, true)}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-2 min-w-0 text-[12px] text-ink-soft">
          <span className="w-16 shrink-0">Sheath</span>
          <select className="field w-20" value={plan.sheathFr} onChange={(e) => set({ sheathFr: +e.target.value as PlanFr })} aria-label="Sheath size">
            {frsFor(plan.site).map((fr) => (
              <option key={fr} value={fr}>
                {fr} Fr
              </option>
            ))}
          </select>
          <div className="seg" role="group" aria-label="Sheath wall">
            {(["standard", "thin"] as SheathType[]).map((t) => (
              <button key={t} className={`seg-btn ${plan.sheathType === t ? "seg-btn-active" : ""}`} aria-pressed={plan.sheathType === t} onClick={() => set({ sheathType: t })}>
                {t === "thin" ? "Thin-walled" : "Standard"}
              </button>
            ))}
          </div>
          <select className="field w-24" value={plan.lengthCm} onChange={(e) => set({ lengthCm: +e.target.value as PlanLengthCm })} aria-label="Sheath length">
            {lengthsFor(plan.site).map((l) => (
              <option key={l} value={l}>
                {l} cm
              </option>
            ))}
          </select>
        </div>
        {labNote && <p className="text-[12px] text-ink-faint leading-snug">{labNote}</p>}
        <label className="flex items-center gap-2 min-w-0 text-[12px] text-ink-soft">
          <span className="w-16 shrink-0">If it fails</span>
          <select className="field flex-1 min-w-0" value={plan.fallback ?? ""} onChange={(e) => set({ fallback: (e.target.value || null) as PlanSiteId | null })} aria-label="Fallback site">
            <option value="">No fallback</option>
            {PLAN_SITES.filter((p) => p.id !== plan.site).map((p) => (
              <option key={p.id} value={p.id}>
                {siteOption(p.id)}
              </option>
            ))}
          </select>
        </label>
        {site.wrist && (
          <div className="flex flex-col gap-1">
            <div className="text-[12px] text-ink-faint">Radial spasm plan</div>
            <p className="text-[12px] text-ink-faint leading-snug">Give each from the orders panel at the right moment.</p>
            {SPASM_ITEMS.map((i) => (
              <label key={i.key} className="flex items-start gap-2 text-[13px] text-ink-soft">
                <input type="checkbox" className="mt-1" checked={plan.spasm[i.key]} onChange={(e) => set({ spasm: { ...plan.spasm, [i.key]: e.target.checked } })} />
                <span>{i.label}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="flex flex-wrap items-center gap-2">
        {!locked && (
          <button className="btn btn-accent" disabled={busy} onClick={() => act((x) => routePlanOf(x)?.actions.confirm())}>
            {st.confirmedAt === null ? "State the plan" : "State the plan again"}
          </button>
        )}
        <span className="text-[12px] text-ink-faint">
          {locked
            ? st.planByTeam
              ? `The team planned ${siteName(plan.site).toLowerCase()} access.`
              : "The plan is fixed: the needle has gone in."
            : st.confirmedAt === null
              ? "Not yet stated."
              : st.changedSinceConfirm
                ? "Changed since it was stated."
                : `Stated at ${clock(st.confirmedAt)}.`}
        </span>
      </div>
      {st.leftGroinPending && <div className="notice notice-warn">This lab cannot yet start a case in the left groin: the case is set up on the right groin.</div>}
      {st.note && <p className="text-[12px] text-ink-soft leading-snug">{st.note}</p>}
    </div>
  );
}

export const section: CaseSection = {
  id: "plan-access",
  title: "Access plan",
  order: 20,
  applies: (s) => !!routePlanOf(s),
  Component: PlanAccessSection,
};
