// The full case's infusion pumps (proc-hypotension-pressors): the vasoactive drugs and the nitrate of
// the pressors and oedema lessons, each with a syringe strength, a dose rate in the unit the module
// text doses it in, the pump's mL/h and the line it runs through (central where a venous sheath is
// in). The pumps run on the session module 'hypotension' (src/simulation/session/modules/
// hypotension.ts), whose patient gives the response. Nothing here says which drug fits: the drugs
// sit side by side as on a pump stack; the module's range for a drug is shown only where hints are
// free (guided mode), because the dose is scored. The escalation question, once the team asks it,
// is answered here: more drug, or mechanical support, which hands the patient to the support lab
// (useLabHandoverStore) and opens it. Generic drug and device names only.
import { useState } from "react";
import type { CaseSession } from "../../simulation/session/caseSession";
import type { EngineSnapshot } from "../../simulation/patient/engine";
import { PUMPS, PUMP_BY_DRUG, SUPPORT_DEVICES, pumpMlPerHour, type PumpDrug, type SupportDevice } from "../../simulation/session/hypotension";
import { hypotensionOf } from "../../simulation/session/modules/hypotension";
import { useLabHandoverStore } from "../../state/useLabHandoverStore";
import { useUiStore } from "../../state/useUiStore";

export interface InfusionPanelProps {
  session: CaseSession;
  act: <T>(fn: (s: CaseSession) => T) => T | undefined;
}

/**
 * Hand the patient to a support console and open it. The engine snapshot goes with the transfer
 * when the session's patient is a full engine; a transfer the store refuses still opens the lab.
 * The case's own patient stops with the hand-over (useLabHandoverStore rule 2): its clock is the
 * procedure section's frame loop (src/ui/sections/ProcedureLab.tsx), and openSim moves to the
 * support lab's section, which unmounts that section and cancels the loop (App renders only the
 * section in view). No call here is needed for that.
 */
export function handToSupport(session: CaseSession, device: SupportDevice): void {
  const m = hypotensionOf(session);
  const snap = (session.patient as unknown as { snapshot?: () => EngineSnapshot }).snapshot?.();
  const payload = { reason: m?.state.escalation?.reason ?? "rising doses", infusions: (m?.state.pumps ?? []).map((p) => ({ drug: p.drug, rate: p.rate, unit: PUMP_BY_DRUG[p.drug].unit })) };
  try {
    useLabHandoverStore.getState().put({ to: device, from: "procedure", events: ["hypotension"], patient: snap, profile: snap ? session.profile : undefined, payload });
  } catch {
    useLabHandoverStore.getState().put({ to: device, from: "procedure", events: ["hypotension"], payload });
  }
  useUiStore.getState().openSim(device);
}

export function InfusionPanel({ session, act }: InfusionPanelProps) {
  const m = hypotensionOf(session);
  const [drug, setDrug] = useState<PumpDrug>(PUMPS[0].drug);
  const [strength, setStrength] = useState<number>(PUMPS[0].strengths[0]);
  const [rate, setRate] = useState("");
  const [line, setLine] = useState<"central" | "peripheral">("peripheral");
  const [rates, setRates] = useState<Record<string, string>>({});
  if (!m) return null;
  const st = m.state;
  const spec = PUMP_BY_DRUG[drug];
  const central = m.actions.centralAvailable();
  const weight = session.profile.weightKg;
  const r = +rate;
  const hints = session.policy.hints === "free";
  const esc = st.escalation;

  return (
    <div className="flex flex-col gap-3" data-infusion-panel>
      {st.pumps.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-[12px] font-medium text-ink-soft">Running</div>
          {st.pumps.map((p) => {
            const ps = PUMP_BY_DRUG[p.drug];
            const v = rates[p.drug] ?? "";
            return (
              <div key={p.drug} className="flex flex-wrap items-center gap-1.5" data-pump={p.drug}>
                <span className="text-[12px] text-ink min-w-[8rem]">
                  {ps.label} {p.rate} {ps.unit}
                </span>
                <span className="text-[12px] text-ink-faint">
                  {p.mlPerHour} mL/h, {p.line}
                </span>
                <input className="field w-20" inputMode="decimal" placeholder={ps.unit} value={v} onChange={(e) => setRates({ ...rates, [p.drug]: e.target.value })} aria-label={`${ps.label} new rate, ${ps.unit}`} />
                <button
                  className="btn"
                  disabled={!(+v > 0)}
                  onClick={() => {
                    act((x) => hypotensionOf(x)?.actions.setPump(p.drug, +v));
                    setRates({ ...rates, [p.drug]: "" });
                  }}
                >
                  Set rate
                </button>
                <button className="btn btn-ghost" onClick={() => act((x) => hypotensionOf(x)?.actions.stopPump(p.drug))}>
                  Stop
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <div className="text-[12px] font-medium text-ink-soft">New infusion</div>
        <div className="flex flex-wrap items-center gap-1.5">
          <select
            className="field w-44"
            value={drug}
            onChange={(e) => {
              const d = e.target.value as PumpDrug;
              setDrug(d);
              setStrength(PUMP_BY_DRUG[d].strengths[0]);
            }}
            aria-label="Infusion drug"
          >
            {PUMPS.map((p) => (
              <option key={p.drug} value={p.drug}>
                {p.label}
              </option>
            ))}
          </select>
          <select className="field w-28" value={strength} onChange={(e) => setStrength(+e.target.value)} aria-label="Syringe strength">
            {spec.strengths.map((x) => (
              <option key={x} value={x}>
                {x} {spec.strengthUnit}
              </option>
            ))}
          </select>
          <input className="field w-20" inputMode="decimal" placeholder={spec.unit} value={rate} onChange={(e) => setRate(e.target.value)} aria-label={`Dose rate, ${spec.unit}`} />
          <span className="text-[12px] text-ink-faint">{spec.unit}</span>
          <select className="field w-28" value={central ? line : "peripheral"} onChange={(e) => setLine(e.target.value as "central" | "peripheral")} aria-label="Line">
            <option value="peripheral">Peripheral</option>
            <option value="central" disabled={!central}>
              Central (venous sheath)
            </option>
          </select>
          <button
            className="btn"
            disabled={!(r > 0)}
            onClick={() => {
              act((x) => hypotensionOf(x)?.actions.setPump(drug, r, { strength, line: central ? line : "peripheral" }));
              setRate("");
            }}
            data-pump-start
          >
            Start
          </button>
        </div>
        <div className="text-[12px] text-ink-faint">
          {r > 0 ? `${pumpMlPerHour(spec, r, strength, weight)} mL/h at ${weight} kg. ` : ""}
          Syringe strengths here are the simulator's; local protocol decides.
          {/* the range is scored: shown only where hints are free (guided) */}
          {hints && ` The module's range: ${spec.range[0]}-${spec.range[1]} ${spec.unit} (${spec.cite}).`}
        </div>
      </div>

      {esc && !esc.choice && (
        <div className="flex flex-col gap-1.5 rounded-md border border-line p-2" data-escalation>
          <div className="text-[12px] text-ink">The doses keep going up. What now?</div>
          <div className="flex flex-wrap gap-1.5">
            <button className="btn" onClick={() => act((x) => hypotensionOf(x)?.actions.escalate("drugs"))}>
              More drug
            </button>
            {SUPPORT_DEVICES.map((d) => (
              <button
                key={d.id}
                className="btn"
                onClick={() => {
                  act((x) => hypotensionOf(x)?.actions.escalate("support", d.id));
                  handToSupport(session, d.id);
                }}
              >
                Support: {d.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
