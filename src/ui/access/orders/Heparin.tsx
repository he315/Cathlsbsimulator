// The full case's heparin record and the hand-over to ad hoc PCI (proc-heparin-act-handover): an order
// section (src/ui/access/orders/index.ts). It lists every heparin dose with its time and route and the
// time since the last dose and the last ACT (what the physiologist tracks and tells the operator, lesson
// pm-antithrombotics-heparin), and lets the operator look at the IV cannula (a tissued one is swollen
// and does not flush) or put in a new one. While the hand-over gate is open (CaseSession.openPciGate) it
// is where the PCI dose is given, in units, IV or through the sheath side arm, and the ACT measured;
// the plan's GP IIb/IIIa inhibitor is named because it is the team's plan. Whether a dose reached the
// blood, the dose range and the ACT target are not shown: guided mode alone shows the heparin still to
// give and the target (pciGateHint), as the plan's teaching aid. Under the gate, the PCI tips for the
// hand-over (gateTips: those the gate's 'low-act' and 'high-contrast-volume' raise, then the heparin
// lesson's tips for the plan and the wire, from pciGateTipContext) appear under the case's tip rule
// (guided, or after asking the attending; never in an exam) and are recorded as shown.
import { useEffect, useMemo, useState } from "react";
import type { CaseSection, CaseSectionProps } from "./index";
import type { CaseSession } from "../../../simulation/session/caseSession";
import type { AnticoagRoute } from "../../../simulation/session/handover";
import type { LabContext, LabTip } from "../../../content/lab/tips";
import LabTipsPanel from "../../lab/LabTipsPanel";
import { selectTips, useTipsModule, type TipPolicy, type TipsModule } from "../../lab/useLabTips";

/**
 * Session time as m:ss (h:mm:ss past an hour), the format of the case clock (panels.tsx clock). The
 * hand-over gate bar (ProcedureLab PciGateBar) uses this one too, so the gate's times share a format.
 * It is not imported from ../panels: panels.tsx loads the order sections (OrdersPanel, orders/index.ts
 * eager glob), so the import would be a cycle that leaves this file's `section` unset when it loads first.
 */
export function clockText(t: number): string {
  const s = Math.max(0, Math.floor(t));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h ? h + ":" : ""}${String(m).padStart(h ? 2 : 1, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const minutesAgo = (now: number, t: number) => {
  const m = Math.max(0, Math.floor((now - t) / 60));
  return m === 0 ? "just now" : `${m} min ago`;
};

const ROUTE_LABEL: Record<AnticoagRoute, string> = { iv: "IV", ia: "side arm" };

/** The lesson whose tips the gate shows when no gate event is raised (the heparin dose and the ACT). */
export const GATE_TIP_LESSON = "pm-antithrombotics-heparin";

/**
 * The hand-over's own tips, best first, under the visibility rule: a tip raised by one of the gate's events
 * (pciGateTipContext carries only 'low-act' and 'high-contrast-volume') or one from the heparin lesson. The
 * plan's general tips are left out, so the gate's tips are about the decision it asks for.
 */
export function gateTips(mod: TipsModule | null, ctx: LabContext | null, p: TipPolicy, limit = 3): LabTip[] {
  if (!ctx) return [];
  const raised = (t: LabTip) => !!t.when.event?.some((e) => ctx.events?.includes(e));
  return selectTips(mod, ctx, p, 200)
    .filter((t) => raised(t) || t.lessonId === GATE_TIP_LESSON)
    .slice(0, limit);
}

/** The PCI tips at the gate (at most three), under the case's visibility rule. */
function GateTips({ session, ctx }: { session: CaseSession; ctx: LabContext | null }) {
  const mod = useTipsModule();
  const key = JSON.stringify(ctx);
  const { mode, helpAskedAt } = session;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the context is tracked by its content key
  const tips = useMemo(() => gateTips(mod, ctx, { mode, helpAskedAt }, 3), [mod, key, mode, helpAskedAt]);
  useEffect(() => {
    if (tips.length) session.noteTipsShown(tips.map((t) => t.id));
  }, [session, tips]);
  if (!tips.length) return null;
  return <LabTipsPanel tips={tips} visible mode={mode} title="PCI tips" />;
}

function HeparinSection({ session: s, act }: CaseSectionProps) {
  const [units, setUnits] = useState("");
  const [route, setRoute] = useState<AnticoagRoute>("iv");
  const doses = s.heparinDoses;
  const lastDose = doses[doses.length - 1] ?? null;
  const lastAct = s.acts[s.acts.length - 1] ?? null;
  const gate = s.pciGateOpen;
  const hint = s.pciGateHint();
  const u = +units;
  const busy = s.busy;
  const inspected = s.ivLineInspected;
  const contrast = gate ? s.contrastNow() : null;

  return (
    <div className="flex flex-col gap-3" data-heparin-orders>
      <div className="flex flex-col gap-1">
        <div className="text-[12px] font-medium text-ink-soft">Heparin given</div>
        {doses.length === 0 ? (
          <div className="text-[12px] text-ink-faint">None yet.</div>
        ) : (
          <ul className="flex flex-col gap-0.5" data-heparin-doses>
            {doses.map((d, i) => (
              <li key={`${d.t}-${i}`} className="text-[12px] text-ink-soft font-mono">
                {clockText(d.t)} · {d.u} U {ROUTE_LABEL[d.route]}
              </li>
            ))}
          </ul>
        )}
        <div className="text-[12px] text-ink-faint" data-heparin-clock>
          {doses.length > 0 ? `${s.heparinU} U in all; last dose ${minutesAgo(s.tS, lastDose!.t)}` : ""}
          {lastAct ? `${doses.length ? " · " : ""}ACT ${lastAct.act} s, ${minutesAgo(s.tS, lastAct.t)}` : doses.length ? " · no ACT yet" : ""}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="text-[12px] font-medium text-ink-soft">IV cannula</div>
        <div className="grid grid-cols-2 gap-1.5">
          <button className="btn text-left leading-snug" disabled={busy} onClick={() => act((x) => x.inspectIvCannula())} data-iv-inspect>
            Look at and flush the cannula
          </button>
          <button className="btn text-left leading-snug" disabled={busy} onClick={() => act((x) => x.resiteIvCannula())} data-iv-resite>
            Put in a new cannula
          </button>
        </div>
        {inspected && (
          <div className="text-[12px] text-ink leading-snug" data-iv-finding>
            {inspected.finding === "tissued" ? "Swollen and cool around the cannula; the flush does not run." : "Flushes freely; the site looks normal."} {minutesAgo(s.tS, inspected.t)}
          </div>
        )}
      </div>

      {gate && (
        <div className="flex flex-col gap-1.5" data-pci-gate-dose>
          <div className="text-[12px] font-medium text-ink-soft">PCI heparin</div>
          {s.ivAntiplateletPlanned() && <div className="text-[12px] text-ink leading-snug">Plan for the PCI: a GP IIb/IIIa inhibitor or cangrelor.</div>}
          <div className="flex flex-wrap items-center gap-1.5">
            <input className="field w-24" inputMode="numeric" placeholder="U" value={units} onChange={(e) => setUnits(e.target.value)} aria-label="Heparin dose, units" />
            <select className="field" value={route} onChange={(e) => setRoute(e.target.value as AnticoagRoute)} aria-label="Heparin route">
              <option value="iv">IV cannula</option>
              <option value="ia" disabled={!s.sheath}>
                Sheath side arm
              </option>
            </select>
            <button
              className="btn"
              disabled={!(u > 0) || busy}
              onClick={() => {
                act((x) => x.givePciHeparin(u, route));
                setUnits("");
              }}
              data-pci-gate-give
            >
              Give
            </button>
            <button className="btn" disabled={busy} onClick={() => act((x) => x.measureAct())} data-pci-gate-act>
              Measure ACT
            </button>
          </div>
          {hint && (
            <div className="text-[12px] text-ink-faint leading-snug" data-pci-gate-hint>
              Heparin still to give: {hint.stillToGiveU} U (to {hint.doseUPerKg[0]}-{hint.doseUPerKg[1]} U/kg in all). ACT target {hint.actS[0]}-{hint.actS[1]} s.
            </div>
          )}
          {contrast && (
            <div className="text-[12px] text-ink-faint" data-pci-gate-contrast>
              Contrast so far {Math.round(contrast.usedMl)} mL{contrast.budgetMl !== null ? ` of a ${contrast.budgetMl} mL budget: ${Math.round(contrast.remainingMl ?? 0)} mL left` : "; no contrast budget set"}.
            </div>
          )}
          <GateTips session={s} ctx={s.pciGateTipContext()} />
        </div>
      )}
    </div>
  );
}

export const section: CaseSection = {
  id: "heparin",
  title: "Heparin and the ACT",
  order: 12,
  applies: (s) => s.pciGateOpen || s.heparinDoses.length > 0 || s.acts.length > 0,
  Component: HeparinSection,
};
