// The discharge antithrombotic prescription (proc-discharge-prescription): a workspace after the handover, over the
// session module 'discharge' (src/simulation/session/modules/discharge.ts). Shown in the discharge scenarios and in
// any case that has been to PCI. The learner classifies the bleeding risk, writes the antiplatelets (and, on an
// anticoagulant, the triple and dual therapy), the proton pump inhibitor, the warnings, a stop or review date for
// each antiplatelet drug and the advice on planned surgery, signs it, and then sees the patient at follow-up. What it
// shows is what an operator would have in front of them: the chart, the stents the lab reported and the prescription
// as written. Nothing says whether an item is right; that is in the debrief's ledger. In guided mode the ARC-HBR rule
// (one major or two minor criteria) is stated under the criteria, and each criterion carries its tier, as a teaching
// aid; outside guided mode which tier a criterion belongs to is part of what is tested.
import { useEffect, type ReactNode } from "react";
import { useProcedureStore } from "../../../state/useProcedureStore";
import { dischargeOf } from "../../../simulation/session/modules/discharge";
import {
  ARC_HBR,
  MAINTENANCE_DOSE,
  planSummary,
  type AfterDapt,
  type BleedResponse,
  type DischargePlan,
  type HbrCriterion,
  type P2y12Oral,
  type SurgeryTiming,
} from "../../../simulation/session/discharge";
import { useSession } from "../panels";

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

function NumberField({ value, onChange, label, disabled }: { value: number | null; onChange: (v: number | null) => void; label: string; disabled?: boolean }) {
  return (
    <input
      type="number"
      inputMode="numeric"
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
const Box = ({ children }: { children: ReactNode }) => <div className="rounded-md border border-line p-2.5 flex flex-col gap-1.5">{children}</div>;

const P2Y12_LABEL: Record<P2y12Oral, string> = { clopidogrel: "Clopidogrel", prasugrel: "Prasugrel", ticagrelor: "Ticagrelor" };
const BLEED_RESPONSES: { id: BleedResponse; label: string }[] = [
  { id: "local-continue", label: "Control the bleeding site; antiplatelets unchanged" },
  { id: "local-step-down", label: "Control the bleeding site; step down to clopidogrel" },
  { id: "stop-all", label: "Stop all antiplatelet drugs" },
  { id: "platelets", label: "Platelet transfusion" },
];

export function DischargePanel() {
  const session = useSession();
  const act = useProcedureStore((x) => x.act);
  // the prescription is on screen while this panel is mounted (the module reports its tip context only then)
  useEffect(() => {
    act((x) => dischargeOf(x)?.actions.setOpen(true));
    return () => void useProcedureStore.getState().act((x) => dischargeOf(x)?.actions.setOpen(false));
  }, [act, session]);
  const m = dischargeOf(session);
  if (!m?.state) {
    return (
      <div className="panel h-full flex flex-col overflow-hidden">
        <div className="panel-head">
          <span>Discharge prescription</span>
        </div>
        <p className="p-3 text-[13px] text-ink-faint">The discharge antiplatelet prescription is written after PCI.</p>
      </div>
    );
  }
  const st = m.state;
  const c = st.case;
  const o: DischargePlan = st.signed?.plan ?? st.draft;
  const signed = !!st.signed;
  const lock = signed || session.busy;
  const available = m.actions.available();
  const guided = session.mode === "guided";
  const patch = (fn: (x: DischargePlan) => void) => {
    const next: DischargePlan = JSON.parse(JSON.stringify(o));
    fn(next);
    act((x) => dischargeOf(x)?.actions.update(next));
  };
  const toggleCriterion = (id: HbrCriterion, on: boolean) => patch((x) => (x.criteria = on ? [...new Set([...x.criteria, id])] : x.criteria.filter((k) => k !== id)));
  const f = st.followUp;
  const switchPlanned = !!o.switchPlanned || o.switchToClopidogrelDay !== null;

  return (
    <div className="panel h-full flex flex-col overflow-hidden" data-discharge>
      <div className="panel-head">
        <span>Discharge prescription</span>
        {signed && <span className="chip">Signed</span>}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3 grid grid-cols-1 lg:grid-cols-2 gap-3 content-start">
        <div className="flex flex-col gap-3">
          <Box>
            <Heading>From the chart</Heading>
            {m.actions.chart().map((line, i) => (
              <div key={i} className="text-[13px] text-ink-soft leading-snug">
                {line}
              </div>
            ))}
          </Box>

          <Box>
            <Heading>Bleeding risk (ARC-HBR)</Heading>
            <div className="text-[12px] text-ink-faint">Criteria met</div>
            {ARC_HBR.map((k) => (
              <Check key={k.id} checked={o.criteria.includes(k.id)} disabled={lock} onChange={(v) => toggleCriterion(k.id, v)} label={guided ? `${k.label} (${k.major ? "major" : "minor"})` : k.label} />
            ))}
            {guided && <p className="text-[12px] text-ink-faint leading-snug">High bleeding risk: one major or two minor criteria (Urban et al. 2019).</p>}
            <Row label="Bleeding risk">
              <select className="field h-8" value={o.hbr ?? ""} disabled={lock} onChange={(e) => patch((x) => (x.hbr = (e.target.value || null) as DischargePlan["hbr"]))} aria-label="Bleeding risk classification">
                <option value="">Choose</option>
                <option value="high">High bleeding risk</option>
                <option value="not-high">Not high bleeding risk</option>
              </select>
            </Row>
          </Box>

          {c.surgery && (
            <Box>
              <Heading>The planned operation</Heading>
              <Row label="Advice on timing">
                <select className="field h-8" value={o.surgery.timing ?? ""} disabled={lock} onChange={(e) => patch((x) => (x.surgery.timing = (e.target.value || null) as SurgeryTiming | null))} aria-label="Timing of the operation">
                  <option value="">Choose</option>
                  <option value="now">Go ahead as listed</option>
                  <option value="1-month">After at least 1 month of DAPT</option>
                  <option value="3-months">After at least 3 months of DAPT</option>
                  <option value="after-dapt">After the full DAPT course</option>
                </select>
              </Row>
              <Row label="Aspirin around the operation">
                <select className="field h-8" value={o.surgery.aspirin ?? ""} disabled={lock} onChange={(e) => patch((x) => (x.surgery.aspirin = (e.target.value || null) as "continue" | "stop" | null))} aria-label="Aspirin around the operation">
                  <option value="">Choose</option>
                  <option value="continue">Continue</option>
                  <option value="stop">Stop</option>
                </select>
              </Row>
              <Row label="P2Y12 inhibitor stopped, days before">
                <NumberField value={o.surgery.p2y12StopDays} disabled={lock} label="Days before the operation the P2Y12 inhibitor stops" onChange={(v) => patch((x) => (x.surgery.p2y12StopDays = v))} />
              </Row>
              <Check checked={o.surgery.bridging} disabled={lock} onChange={(v) => patch((x) => (x.surgery.bridging = v))} label="Bridge with low-molecular-weight heparin" />
            </Box>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Box>
            <Heading>Antiplatelets</Heading>
            <Check checked={o.aspirin} disabled={lock} onChange={(v) => patch((x) => (x.aspirin = v))} label={`Aspirin ${MAINTENANCE_DOSE.aspirin}`} />
            <Row label="P2Y12 inhibitor">
              <select className="field h-8" value={o.p2y12 ?? ""} disabled={lock} onChange={(e) => patch((x) => (x.p2y12 = (e.target.value || null) as P2y12Oral | null))} aria-label="P2Y12 inhibitor">
                <option value="">Choose</option>
                <option value="clopidogrel">Clopidogrel</option>
                <option value="prasugrel">Prasugrel</option>
                <option value="ticagrelor">Ticagrelor</option>
              </select>
            </Row>
            {o.p2y12 && <div className="text-[12px] text-ink-faint">{P2Y12_LABEL[o.p2y12]} {MAINTENANCE_DOSE[o.p2y12]}</div>}
            {c.oac ? (
              <>
                <div className="text-[13px] text-ink-soft leading-snug">{c.oac.regimen} for {c.oac.indication}.</div>
                <Row label="Anticoagulant dose">
                  <select className="field h-8" value={o.oacDose ?? ""} disabled={lock} onChange={(e) => patch((x) => (x.oacDose = (e.target.value || null) as DischargePlan["oacDose"]))} aria-label="Anticoagulant dose">
                    <option value="">Choose</option>
                    <option value="stroke-prevention">The stroke-prevention dose</option>
                    <option value="reduced">Reduced, because of the antiplatelets</option>
                  </select>
                </Row>
                <Row label="Aspirin stops, days after the PCI">
                  <NumberField value={o.tripleDays} disabled={lock || !o.aspirin} label="Days of triple therapy" onChange={(v) => patch((x) => (x.tripleDays = v))} />
                </Row>
                <Row label="The P2Y12 inhibitor stops, months after the PCI">
                  <NumberField value={o.dualMonths} disabled={lock} label="Months of the anticoagulant with the P2Y12 inhibitor" onChange={(v) => patch((x) => (x.dualMonths = v))} />
                </Row>
              </>
            ) : (
              <>
                <Row label="DAPT, months">
                  <NumberField value={o.daptMonths} disabled={lock} label="Months of DAPT" onChange={(v) => patch((x) => (x.daptMonths = v))} />
                </Row>
                <Row label="Then">
                  <select className="field h-8" value={o.after ?? ""} disabled={lock} onChange={(e) => patch((x) => (x.after = (e.target.value || null) as AfterDapt | null))} aria-label="What continues after DAPT">
                    <option value="">Choose</option>
                    <option value="aspirin">Aspirin alone</option>
                    <option value="p2y12">The P2Y12 inhibitor alone</option>
                    <option value="none">No antiplatelet</option>
                  </select>
                </Row>
              </>
            )}
            <Check
              checked={switchPlanned}
              disabled={lock}
              onChange={(v) =>
                patch((x) => {
                  // ticking leaves the day to the learner; unticking clears it
                  x.switchPlanned = v;
                  if (!v) x.switchToClopidogrelDay = null;
                })
              }
              label="Planned switch to clopidogrel"
            />
            {switchPlanned && (
              <Row label="Switch on day">
                <NumberField value={o.switchToClopidogrelDay} disabled={lock} label="Day of the switch to clopidogrel" onChange={(v) => patch((x) => (x.switchToClopidogrelDay = v))} />
              </Row>
            )}
            <Check checked={o.ppi} disabled={lock} onChange={(v) => patch((x) => (x.ppi = v))} label="Proton pump inhibitor" />
            {o.p2y12 === "ticagrelor" && <Check checked={o.dyspnoeaWarned} disabled={lock} onChange={(v) => patch((x) => (x.dyspnoeaWarned = v))} label="Patient told that ticagrelor can cause breathlessness in the first week" />}
          </Box>

          <Box>
            <Heading>Stop or review dates</Heading>
            <div className="text-[12px] text-ink-faint">Procedure date {c.pciDate}</div>
            {o.aspirin && (
              <Row label="Aspirin">
                <input type="date" className="field h-8 font-mono" value={o.stopDates.aspirin ?? ""} disabled={lock} onChange={(e) => patch((x) => (x.stopDates.aspirin = e.target.value || null))} aria-label="Aspirin stop or review date" />
              </Row>
            )}
            {o.p2y12 && (
              <Row label={P2Y12_LABEL[o.p2y12]}>
                <input type="date" className="field h-8 font-mono" value={o.stopDates.p2y12 ?? ""} disabled={lock} onChange={(e) => patch((x) => (x.stopDates.p2y12 = e.target.value || null))} aria-label="P2Y12 inhibitor stop or review date" />
              </Row>
            )}
          </Box>

          <Box>
            {!available && <p className="text-[12px] text-ink-faint">The prescription is written once every access site is closed.</p>}
            {signed ? (
              <>
                <Heading>As signed</Heading>
                {planSummary(c, o).map((line, i) => (
                  <div key={i} className="text-[13px] text-ink-soft leading-snug">
                    {line}
                  </div>
                ))}
              </>
            ) : (
              <button className="btn btn-accent self-start" disabled={!available || session.busy} onClick={() => act((x) => dischargeOf(x)?.actions.sign())} data-discharge-sign>
                Sign the prescription
              </button>
            )}
            {st.note && <p className="text-[12px] text-ink-faint">{st.note}</p>}
          </Box>

          {signed && (
            <Box>
              <Heading>Follow-up</Heading>
              {!f ? (
                <button className="btn self-start" disabled={session.busy} onClick={() => act((x) => dischargeOf(x)?.actions.followUp())} data-discharge-followup>
                  See the patient at follow-up
                </button>
              ) : (
                <>
                  <div className="text-[13px] text-ink-soft leading-snug">{f.text}</div>
                  {f.bleed &&
                    (f.response ? (
                      <div className="text-[12px] text-ink-faint">{BLEED_RESPONSES.find((r) => r.id === f.response)?.label}</div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {BLEED_RESPONSES.map((r) => (
                          <button key={r.id} className="btn self-start" disabled={session.busy} onClick={() => act((x) => dischargeOf(x)?.actions.answerBleed(r.id))}>
                            {r.label}
                          </button>
                        ))}
                      </div>
                    ))}
                </>
              )}
            </Box>
          )}
        </div>
      </div>
    </div>
  );
}

export default DischargePanel;
