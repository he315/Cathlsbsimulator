// The full case's low-pressure orders and infusions (proc-hypotension-pressors): an order section
// (src/ui/access/orders/index.ts) over the session module 'hypotension'
// (src/simulation/session/modules/hypotension.ts). It is the team at the bedside: checks that the low
// pressure is real (cuff, zero, level, flush, the trace), the right heart numbers, volume, the
// treatments of a cause, pressor boluses, the oedema regimen, the infusion pumps
// (src/ui/access/InfusionPanel.tsx) and the operator saying the mechanism out loud (the lesson's
// pearl: empty, failing or dilated). The right and the wrong orders sit side by side; nothing here
// names the cause or says whether an order was right (the ledger's, shown in the debrief). The right
// heart read-out is numbers only; under it, while the numbers are open, the haemodynamic tips written
// for a right heart run (the module's rhcTipContext) appear under the case's tip rule (guided, or
// after asking the attending; never in an exam) and are recorded as shown. Doses are those of the
// module text (see src/simulation/session/hypotension.ts); names are generic.
import { useEffect, useMemo } from "react";
import type { CaseSection, CaseSectionProps } from "./index";
import type { CaseSession } from "../../../simulation/session/caseSession";
import type { LabContext } from "../../../content/lab/tips";
import LabTipsPanel from "../../lab/LabTipsPanel";
import { selectTips, useTipsModule } from "../../lab/useLabTips";
import { HYPO_ORDERS, type HypoOrderSpec } from "../../../simulation/session/hypotension";
import { HYPOTENSION_MECHANISMS, MECHANISM_WORDS } from "../../../simulation/patient/hypotensionCauses";
import { hypotensionOf } from "../../../simulation/session/modules/hypotension";
import { InfusionPanel } from "../InfusionPanel";

const GROUPS: { id: HypoOrderSpec["group"]; title: string }[] = [
  { id: "confirm", title: "Is it real?" },
  { id: "look", title: "Look" },
  { id: "volume", title: "Volume" },
  { id: "cause", title: "The cause" },
  { id: "bolus", title: "Pressor bolus" },
  { id: "oedema", title: "Breathing" },
];

const ago = (now: number, t: number) => {
  const m = Math.max(0, Math.floor((now - t) / 60));
  return m === 0 ? "just now" : `${m} min ago`;
};

/** The haemodynamic tips for the right heart numbers (at most three), under the case's visibility rule. */
function RhcTips({ session, ctx }: { session: CaseSession; ctx: LabContext | null }) {
  const mod = useTipsModule();
  const key = JSON.stringify(ctx);
  const { mode, helpAskedAt } = session;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the context is tracked by its content key
  const tips = useMemo(() => selectTips(mod, ctx, { mode, helpAskedAt }, 3), [mod, key, mode, helpAskedAt]);
  useEffect(() => {
    if (tips.length) session.noteTipsShown(tips.map((t) => t.id));
  }, [session, tips]);
  if (!tips.length) return null;
  return <LabTipsPanel tips={tips} visible mode={mode} title="Right heart tips" />;
}

function InfusionsSection({ session, act }: CaseSectionProps) {
  const m = hypotensionOf(session);
  if (!m) return null;
  const st = m.state;
  const recent = st.actions.slice(-6).reverse();
  const rhc = st.rhc;

  return (
    <div className="flex flex-col gap-3" data-hypotension-orders>
      {GROUPS.map((g) => (
        <div key={g.id} className="flex flex-col gap-1.5">
          <div className="text-[12px] font-medium text-ink-soft">{g.title}</div>
          <div className="grid grid-cols-2 gap-1.5">
            {HYPO_ORDERS.filter((o) => o.group === g.id).map((o) => (
              <button
                key={o.id}
                className="btn text-left leading-snug"
                disabled={st.inProgress.some((p) => p.what === o.id)}
                onClick={() => act((x) => hypotensionOf(x)?.actions.order(o.id))}
                data-hypo-order={o.id}
              >
                {o.label}
              </button>
            ))}
          </div>
          {g.id === "look" && rhc && (
            <div className="flex flex-col gap-0.5" data-rhc>
              <div className="text-[12px] text-ink font-mono">
                RA {Math.round(rhc.raMmHg)} · PA mean {Math.round(rhc.paMeanMmHg)} · wedge {Math.round(rhc.pcwpMmHg)} mmHg
              </div>
              <div className="text-[12px] text-ink font-mono">
                CO {rhc.coLMin} L/min · CI {rhc.ci} L/min/m² · SVR {rhc.svrWood} WU
              </div>
              <div className="text-[12px] text-ink-faint leading-snug">
                {rhc.note} {ago(session.tS, rhc.t)}
              </div>
              <RhcTips session={session} ctx={m.actions.rhcTipContext()} />
            </div>
          )}
        </div>
      ))}

      {st.inProgress.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {st.inProgress.map((p, i) => (
            <li key={`${p.what}-${i}`} className="text-[12px] text-ink-soft">
              {p.label}: under way
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-1.5">
        <div className="text-[12px] font-medium text-ink-soft">Say the mechanism</div>
        <div className="grid grid-cols-2 gap-1.5">
          {HYPOTENSION_MECHANISMS.map((x) => (
            <button key={x} className={`btn text-left leading-snug ${st.mechanismNamed?.m === x ? "border-accent" : ""}`} onClick={() => act((s) => hypotensionOf(s)?.actions.nameMechanism(x))} data-mechanism={x}>
              {MECHANISM_WORDS[x]}
            </button>
          ))}
        </div>
      </div>

      <InfusionPanel session={session} act={act} />

      {st.note && (
        <p className="text-[12px] text-ink leading-snug" data-hypotension-note>
          {st.note}
        </p>
      )}
      {recent.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="text-[12px] font-medium text-ink-soft">Given and done</div>
          <ul className="flex flex-col gap-0.5">
            {recent.map((a, i) => (
              <li key={`${a.t}-${i}`} className="text-[12px] text-ink-soft leading-snug">
                <span className="text-ink">{a.text}</span> <span className="text-ink-faint">{ago(session.tS, a.t)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export const section: CaseSection = {
  id: "infusions",
  title: "Pressure, pumps and breathing",
  order: 45,
  applies: (s) => !!hypotensionOf(s),
  Component: InfusionsSection,
};
