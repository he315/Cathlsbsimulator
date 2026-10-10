// The full case's pre-procedure order sheet (proc-preprocedure-orders): a chart section
// (src/ui/access/chart/index.ts) over the session module 'preorders'
// (src/simulation/session/modules/preorders.ts), shown in the order sheet scenarios. The learner
// writes the anticoagulant, antiplatelet and kidney orders, signs them (which plays the days and
// hours before the case) and states the contrast ceiling for the time-out. What it shows is what an
// operator would have in front of them: the chart's facts, the orders as written, the running
// contrast against the stated ceiling. Nothing says whether an order is right; that is in the
// debrief's ledger. In guided mode the two ceiling rules are worked out under the ceiling as a
// teaching aid.
import { useState, type ReactNode } from "react";
import type { CaseSection, CaseSectionProps } from "./index";
import { preordersOf } from "../../../simulation/session/modules/preorders";
import {
  OAC_INDICATION_TEXT,
  PREORDER_RULES,
  preorderBudget,
  preorderPatient,
  type AspirinPlan,
  type LoadTiming,
  type OacStrategy,
  type OralRoute,
  type P2y12Choice,
  type PreOrders,
} from "../../../simulation/session/preorders";

const num = (v: string): number | null => (v.trim() === "" || !Number.isFinite(Number(v)) ? null : Number(v));
const str = (x: number | null) => (x === null ? "" : String(x));

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-ink-soft">
      <span className="min-w-0 flex-1">{label}</span>
      {children}
    </label>
  );
}

function NumberField({ value, onChange, label, step = 1, disabled }: { value: number | null; onChange: (v: number | null) => void; label: string; step?: number; disabled?: boolean }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      min={0}
      value={str(value)}
      disabled={disabled}
      onChange={(e) => onChange(num(e.target.value))}
      className="field h-8 w-24 font-mono text-right disabled:opacity-40"
      aria-label={label}
    />
  );
}

function Check({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label className="flex items-start gap-2 text-[13px] text-ink-soft">
      <input type="checkbox" className="mt-1" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

const Heading = ({ children }: { children: ReactNode }) => <div className="text-[13px] font-medium text-ink-soft">{children}</div>;

function PreOrdersSection({ session, act }: CaseSectionProps) {
  const m = preordersOf(session);
  // The orders are read from the module on every render (update() keeps its draft current), so a
  // new case, or orders signed elsewhere, always show here. Only the unstated ceiling is local: it is
  // re-seeded whenever the module's state object (a new case) or its stated ceiling changes.
  const st0 = m?.state ?? null;
  const stated = st0?.ceilingMl ?? null;
  const [ceiling, setCeiling] = useState<number | null>(stated);
  const [seed, setSeed] = useState<{ from: object | null; ml: number | null }>({ from: st0, ml: stated });
  if (seed.from !== st0 || seed.ml !== stated) {
    setSeed({ from: st0, ml: stated });
    setCeiling(stated);
  }
  if (!m?.state) return null;
  const st = m.state;
  const o: PreOrders = st.signed?.orders ?? st.draft;
  const c = st.case;
  const p = session.profile;
  const busy = session.busy;
  const signed = !!st.signed;
  const lock = signed || busy;
  const patch = (fn: (x: PreOrders) => void) => {
    const next: PreOrders = JSON.parse(JSON.stringify(o));
    fn(next);
    act((x) => preordersOf(x)?.actions.update(next));
  };
  const a = o.antiplatelet;
  const k = o.kidney;
  const guided = session.mode === "guided";
  const budget = m.actions.budget();
  const rules = guided ? preorderBudget(preorderPatient(p)) : null;
  const renalConfirmed = !!session.timeOut.checked.renal;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border border-line p-2.5 flex flex-col gap-1">
        <Heading>From the chart</Heading>
        <div className="text-[13px] text-ink-soft leading-snug">
          {p.ageY} years, {p.weightKg} kg; eGFR {p.renal.egfr} mL/min/1.73 m², creatinine clearance {p.renal.crclMlMin} mL/min; LVEF {p.lvef}%.
          {" "}
          {c.presentation === "stable" ? "Stable angina" : c.presentation === "nste-acs" ? "NSTEMI, for early angiography" : "STEMI, for primary PCI"}
          {c.presentation === "stable" ? (c.procedure === "planned-pci" ? ", booked for PCI." : ", booked for angiography and possible PCI.") : "."}
        </div>
        {c.oac && <div className="text-[13px] text-ink-soft leading-snug">{c.oac.regimen} for {OAC_INDICATION_TEXT[c.oac.indication]}.</div>}
      </div>

      {c.oac && (
        <div className="flex flex-col gap-1.5">
          <Heading>Oral anticoagulant</Heading>
          <Row label="Plan">
            <select className="field h-8" value={o.oac.strategy ?? ""} disabled={lock} onChange={(e) => patch((x) => (x.oac.strategy = (e.target.value || null) as OacStrategy | null))} aria-label="Anticoagulant plan">
              <option value="">Choose</option>
              <option value="hold">Hold, no bridging</option>
              <option value="continue">Continue</option>
              <option value="bridge">Stop, bridge with IV heparin</option>
            </select>
          </Row>
          {o.oac.strategy && o.oac.strategy !== "continue" && (
            <>
              <Row label="Last dose, hours before the procedure">
                <NumberField value={o.oac.holdH} disabled={lock} label="Hours held before the procedure" onChange={(v) => patch((x) => (x.oac.holdH = v))} />
              </Row>
              <Row label="Restart, hours after the procedure">
                <NumberField value={o.oac.restartH} disabled={lock} label="Restart hours after the procedure" onChange={(v) => patch((x) => (x.oac.restartH = v))} />
              </Row>
            </>
          )}
          {o.oac.strategy === "bridge" && <p className="text-[12px] text-ink-faint leading-snug">The heparin infusion stops {PREORDER_RULES.bridgeUfhStopH} h before the procedure and restarts straight after.</p>}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Heading>Antiplatelets</Heading>
        <Row label="Aspirin">
          <select className="field h-8" value={a.aspirin ?? ""} disabled={lock} onChange={(e) => patch((x) => (x.antiplatelet.aspirin = (e.target.value || null) as AspirinPlan | null))} aria-label="Aspirin order">
            <option value="">Choose</option>
            <option value="continue">Continue the daily dose</option>
            <option value="load">Loading dose</option>
            <option value="peri-procedural">At the PCI only</option>
            <option value="none">None</option>
          </select>
        </Row>
        {(a.aspirin === "load" || a.aspirin === "peri-procedural") && (
          <Row label="Aspirin dose, mg">
            <NumberField value={a.aspirinMg} disabled={lock} label="Aspirin dose" onChange={(v) => patch((x) => (x.antiplatelet.aspirinMg = v))} />
          </Row>
        )}
        <Row label="P2Y12 inhibitor">
          <select className="field h-8" value={a.p2y12 ?? ""} disabled={lock} onChange={(e) => patch((x) => (x.antiplatelet.p2y12 = (e.target.value || null) as P2y12Choice | null))} aria-label="P2Y12 inhibitor">
            <option value="">Choose</option>
            <option value="clopidogrel">Clopidogrel</option>
            <option value="prasugrel">Prasugrel</option>
            <option value="ticagrelor">Ticagrelor</option>
            <option value="none">None</option>
          </select>
        </Row>
        {a.p2y12 && a.p2y12 !== "none" && (
          <>
            <Row label="Loading dose, mg">
              <NumberField value={a.p2y12Mg} disabled={lock} label="P2Y12 loading dose" onChange={(v) => patch((x) => (x.antiplatelet.p2y12Mg = v))} />
            </Row>
            <Row label="When">
              <select className="field h-8" value={a.timing ?? ""} disabled={lock} onChange={(e) => patch((x) => (x.antiplatelet.timing = (e.target.value || null) as LoadTiming | null))} aria-label="When the load is given">
                <option value="">Choose</option>
                <option value="before">Before the procedure</option>
                <option value="at-pci">At PCI, once the anatomy is known</option>
              </select>
            </Row>
            {a.timing === "before" && (
              <Row label="Hours before the procedure (0: on the table)">
                <NumberField value={a.hoursBefore} disabled={lock} label="Hours before the procedure" onChange={(v) => patch((x) => (x.antiplatelet.hoursBefore = v))} />
              </Row>
            )}
            <Row label="Route">
              <select className="field h-8" value={a.route} disabled={lock} onChange={(e) => patch((x) => (x.antiplatelet.route = e.target.value as OralRoute))} aria-label="Route of the oral load">
                <option value="oral">Swallowed whole</option>
                <option value="crushed">Crushed</option>
              </select>
            </Row>
          </>
        )}
        <Check
          checked={a.ivAgent}
          disabled={lock}
          onChange={(v) => patch((x) => (x.antiplatelet.ivAgent = v))}
          label={`Cangrelor at the PCI: ${PREORDER_RULES.cangrelor.bolusUgKg} µg/kg IV bolus, then ${PREORDER_RULES.cangrelor.infusionUgKgMin} µg/kg/min`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Heading>Kidneys</Heading>
        <Row label="Normal saline, mL/kg/h (0: none)">
          <NumberField value={k.salineMlKgH} step={0.5} disabled={lock} label="Saline rate" onChange={(v) => patch((x) => (x.kidney.salineMlKgH = v))} />
        </Row>
        {(k.salineMlKgH ?? 0) > 0 && (
          <>
            <Row label="Hours before">
              <NumberField value={k.salineBeforeH} disabled={lock} label="Saline hours before" onChange={(v) => patch((x) => (x.kidney.salineBeforeH = v))} />
            </Row>
            <Row label="Hours after">
              <NumberField value={k.salineAfterH} disabled={lock} label="Saline hours after" onChange={(v) => patch((x) => (x.kidney.salineAfterH = v))} />
            </Row>
          </>
        )}
        {c.meds.metformin && (
          <>
            <Row label="Metformin">
              <select className="field h-8" value={k.metformin ?? ""} disabled={lock} onChange={(e) => patch((x) => (x.kidney.metformin = (e.target.value || null) as "continue" | "hold" | null))} aria-label="Metformin order">
                <option value="">Choose</option>
                <option value="continue">Continue</option>
                <option value="hold">Hold from today</option>
              </select>
            </Row>
            {k.metformin === "hold" && (
              <Row label="Restart, hours after the procedure">
                <NumberField value={k.metforminRestartH} disabled={lock} label="Metformin restart hours" onChange={(v) => patch((x) => (x.kidney.metforminRestartH = v))} />
              </Row>
            )}
          </>
        )}
        {c.meds.nsaid && (
          <Row label={c.meds.nsaid}>
            <select className="field h-8" value={k.nsaid ?? ""} disabled={lock} onChange={(e) => patch((x) => (x.kidney.nsaid = (e.target.value || null) as "continue" | "hold" | null))} aria-label="NSAID order">
              <option value="">Choose</option>
              <option value="continue">Continue</option>
              <option value="hold">Stop</option>
            </select>
          </Row>
        )}
        {c.meds.statin && (
          <Row label={c.meds.statin}>
            <select className="field h-8" value={k.statin ?? ""} disabled={lock} onChange={(e) => patch((x) => (x.kidney.statin = (e.target.value || null) as "continue" | "stop" | null))} aria-label="Statin order">
              <option value="">Choose</option>
              <option value="continue">Continue</option>
              <option value="stop">Stop</option>
            </select>
          </Row>
        )}
        <Check checked={k.acetylcysteine} disabled={lock} onChange={(v) => patch((x) => (x.kidney.acetylcysteine = v))} label="Acetylcysteine 600 mg every 12 hours, from the day before" />
        <Check checked={k.bicarbonate} disabled={lock} onChange={(v) => patch((x) => (x.kidney.bicarbonate = v))} label="Sodium bicarbonate infusion" />
        <Check checked={k.creatinine48h} disabled={lock} onChange={(v) => patch((x) => (x.kidney.creatinine48h = v))} label="Creatinine at 48 hours" />
        <Check checked={k.creatinineDay4to5} disabled={lock} onChange={(v) => patch((x) => (x.kidney.creatinineDay4to5 = v))} label="Creatinine again on day 4-5" />
      </div>

      {signed ? (
        <div className="notice notice-info">Orders signed. The patient on the table is the one these orders leave.</div>
      ) : (
        <button className="btn btn-accent self-start" disabled={busy} onClick={() => act((x) => preordersOf(x)?.actions.sign())}>
          Sign the orders
        </button>
      )}
      {st.note && <p className="text-[12px] text-ink-faint leading-snug">{st.note}</p>}

      <div className="flex flex-col gap-1.5">
        <Heading>Contrast ceiling for the time-out</Heading>
        <div className="flex flex-wrap items-center gap-2">
          <NumberField value={ceiling} disabled={busy || renalConfirmed} label="Contrast ceiling, mL" onChange={setCeiling} />
          <span className="text-[13px] text-ink-soft">mL</span>
          <button className="btn" disabled={busy || renalConfirmed || ceiling === null} onClick={() => ceiling !== null && act((x) => preordersOf(x)?.actions.stateCeiling(ceiling))}>
            State it
          </button>
        </div>
        {st.ceilingMl !== null && (
          <div className="text-[13px] text-ink-soft">
            Stated: <span className="metric text-ink">{st.ceilingMl} mL</span>
            {budget && (
              <>
                {"; "}used so far <span className="metric text-ink">{Math.round(budget.usedMl)} mL</span>
              </>
            )}
          </div>
        )}
        {rules && (
          <p className="text-[12px] text-ink-faint leading-snug">
            {rules.rules.map((r) => `${r.label}: ${r.availableMl} mL`).join("; ")}
            {rules.advisories.map((x) => ` ${x.text}`).join("")}
          </p>
        )}
      </div>
    </div>
  );
}

export const section: CaseSection = {
  id: "pre-orders",
  title: "Pre-procedure orders",
  order: 15,
  applies: (s) => !!preordersOf(s),
  Component: PreOrdersSection,
};
