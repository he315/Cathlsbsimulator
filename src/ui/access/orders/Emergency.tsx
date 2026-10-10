// The full case's emergency orders (proc-anaphylaxis-vagal): an order section
// (src/ui/access/orders/index.ts) over the session module 'emergencies'
// (src/simulation/session/modules/emergencies.ts). It is the drug trolley and the
// team: the anaphylaxis order set, support, the vagal drugs, a look for another
// cause, prevention before the access steps and the follow-up. The right and the
// wrong orders sit side by side; nothing here names the reaction or says whether
// an order was right (that is the ledger's, shown in the debrief). The orders stay
// available during a time-lapse (compression), because the team gives them while
// someone keeps pressing. Doses are those of the module text (see
// src/simulation/session/emergencies.ts); names are generic.
import { useState } from "react";
import type { CaseSection, CaseSectionProps } from "./index";
import { EMERGENCY_ORDERS, LOCAL_ANAESTHETIC, MP_EMERGENCIES, type EmergencyOrderSpec } from "../../../simulation/session/emergencies";
import { emergenciesOf } from "../../../simulation/session/modules/emergencies";

const GROUPS: { id: EmergencyOrderSpec["group"]; title: string }[] = [
  { id: "anaphylaxis", title: "Drugs and contrast" },
  { id: "support", title: "Support" },
  { id: "vagal", title: "Rate" },
  { id: "look", title: "Look" },
  { id: "prevention", title: "Before the access steps" },
  { id: "follow-up", title: "Follow-up" },
];

const ago = (now: number, t: number) => {
  const m = Math.max(0, Math.floor((now - t) / 60));
  return m === 0 ? "just now" : `${m} min ago`;
};

function EmergencySection({ session, act }: CaseSectionProps) {
  const m = emergenciesOf(session);
  const [rate, setRate] = useState<number>(MP_EMERGENCIES.infusionRatesUgMin[0]);
  const [localMl, setLocalMl] = useState("");
  if (!m) return null;
  const st = m.state;
  const site = session.access === "femoral" ? "femoral" : "radial";
  const range = site === "femoral" ? LOCAL_ANAESTHETIC.femoralMl : LOCAL_ANAESTHETIC.radialMl;
  const recent = st.actions.slice(-6).reverse();

  return (
    <div className="flex flex-col gap-3" data-emergency-orders>
      {GROUPS.map((g) => {
        const orders = EMERGENCY_ORDERS.filter((o) => o.group === g.id && !(o.id === "cpr-stop" && !st.cpr) && !(o.id === "cpr-start" && st.cpr));
        return (
          <div key={g.id} className="flex flex-col gap-1.5">
            <div className="text-[12px] font-medium text-ink-soft">{g.title}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {orders.map((o) => (
                <button key={o.id} className="btn text-left leading-snug" onClick={() => act((x) => emergenciesOf(x)?.actions.order(o.id))} data-emergency-order={o.id}>
                  {o.label}
                </button>
              ))}
            </div>
            {g.id === "anaphylaxis" && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[12px] text-ink-soft">Adrenaline infusion</span>
                <select className="field w-28" value={rate} onChange={(e) => setRate(+e.target.value)} aria-label="Adrenaline infusion rate">
                  {MP_EMERGENCIES.infusionRatesUgMin.map((r) => (
                    <option key={r} value={r}>
                      {r} µg/min
                    </option>
                  ))}
                </select>
                <button className="btn" onClick={() => act((x) => emergenciesOf(x)?.actions.setInfusion(rate))}>
                  {st.infusion ? "Set rate" : "Start"}
                </button>
                {st.infusion && (
                  <button className="btn btn-ghost" onClick={() => act((x) => emergenciesOf(x)?.actions.order("infusion-stop"))}>
                    Stop
                  </button>
                )}
                {st.infusion && <span className="text-[12px] text-ink-faint">running at {st.infusion.rate} µg/min</span>}
              </div>
            )}
            {g.id === "prevention" && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[12px] text-ink-soft">Lidocaine 1% at the {site} site</span>
                <input className="field w-20" inputMode="decimal" placeholder="mL" value={localMl} onChange={(e) => setLocalMl(e.target.value)} aria-label="Local anaesthetic volume, mL" />
                <button
                  className="btn"
                  disabled={!(+localMl > 0) || session.busy}
                  onClick={() => {
                    act((x) => emergenciesOf(x)?.actions.giveLocal(+localMl));
                    setLocalMl("");
                  }}
                >
                  Infiltrate
                </button>
                {/* the volume is scored: its range is a hint, shown only where hints are free (guided) */}
                {session.policy.hints === "free" && (
                  <span className="text-[12px] text-ink-faint">
                    {range[0]}-{range[1]} mL is the usual range here
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {st.note && <p className="text-[12px] text-ink leading-snug" data-emergency-note>{st.note}</p>}
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
  id: "emergency",
  title: "Emergency orders",
  order: 40,
  applies: (s) => !!emergenciesOf(s),
  Component: EmergencySection,
};
