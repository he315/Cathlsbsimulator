// ---------------------------------------------------------------------------
// The PCI sign-out (pci-attending; pm-monitoring#4, hb-the-operator#4,
// cm-principles-closure#8, hb-safe-practice#2), led by the scrub nurse as
// Oxford describes it (pm-monitoring-checklist): the equipment and sharps
// counted; every wire inspected (in some cases a wire comes back without its
// tip coil, and the patient stays until that is recorded and acted on);
// anything left in place; the antiplatelet regimen with its duration and the
// loading dose; the recovery concerns. After a complication: each one with
// how it ended, the ECG, troponin and imaging, the simulated result and its
// classification under the fifth universal definition, the incident report
// and how the patient is told. Then the logbook fields.
//
// Each section writes the run's decisions (the attending's ledger). The
// sign-out is part of the live case ('Back to the case' returns to it, and in
// supervised and independent practice the hands still work), so it lists only
// the complications the learner has recognised (pci-cx-recognition), under
// the learner's own assessment; in guided practice any other change shows as
// an unnamed count to assess first (a teaching aid, like its assessment
// prompts), and elsewhere it is the learner's to notice. The engine's names and grades are for the debrief. In exams
// the sections have no lesson links (the Academy is the curriculum).
// ---------------------------------------------------------------------------

import type { PciAttending } from "./usePciAttending";
import { PMI_LABEL } from "./usePciAttending";
import type { PmiClass } from "../../mentor/prebrief";
import { WIRE_SPEC } from "../../simulation/pci/equipment";
import { ANTIPLATELET_REGIMENS, COMPLICATION_OUTCOMES, DAMAGED_WIRE_ACTIONS, DISCLOSURE_OPTIONS, LOADING_STATUS, LOGBOOK_ROLES, PCI_PLAN_LESSONS, WIRE_FINDINGS } from "../../content/mentor/prebriefs";
import { openLesson } from "../content/openLesson";
import { roleFor } from "../../progress/logbook";
import { FormTips } from "./PciTimeOut";

export interface PciSignOutProps {
  attending: PciAttending;
  variant: "modal" | "drawer";
  /** end the case (the lab's finish: the session asks the attending first) */
  onFinish: () => void;
  onCancel: () => void;
  /** the learner may see tips now (guided practice, or after asking for help) */
  tipsVisible?: boolean;
}

function Section({ title, lesson, showLesson = true, children }: { title: string; lesson?: string; showLesson?: boolean; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-1.5 border-t border-line pt-2">
      <legend className="flex w-full items-center justify-between text-[12px] text-ink-faint">
        <span>{title}</span>
        {lesson && showLesson && (
          <button type="button" className="text-accent underline-offset-2 hover:underline" onClick={() => void openLesson(lesson)} title="Opens the lesson in the Academy (leaves the lab)">
            Lesson
          </button>
        )}
      </legend>
      {children}
    </fieldset>
  );
}

export default function PciSignOut({ attending: a, variant, onFinish, onCancel, tipsVisible = false }: PciSignOutProps) {
  const s = a.signOut;
  const wires = a.wiresUsed();
  // only what the learner has recognised, in their own words (the case is still live)
  const cx = a.signOutComplications();
  // guided practice only (a teaching aid, as its assessment prompts are): elsewhere an unnoticed change is
  // the learner's to find, and the debrief shows it
  const unassessed = a.policy.mode === "guided" ? a.unassessedCount() : 0;
  const lessons = a.lessonsAllowed;
  const blockers = a.signOutBlockers();
  const r = a.pmiResult;
  const width = variant === "modal" ? "w-full max-w-3xl" : "w-full";
  const done = a.signOutDone;
  return (
    <section className={`panel ${width} text-[13px]`} role="dialog" aria-label="Sign-out">
      <div className="panel-head">
        <span>Sign-out: before the patient leaves</span>
        <button type="button" className="btn btn-ghost px-2 py-1 text-xs" onClick={onCancel}>
          Back to the case
        </button>
      </div>
      <div className="max-h-[75vh] space-y-2 overflow-y-auto p-4">
        <FormTips ids={["pci-mon-sign-out", "pci-operator-log-the-case"]} visible={tipsVisible} />
        <Section title="Equipment, sharps and wires" lesson={PCI_PLAN_LESSONS.signOut} showLesson={lessons}>
          <label className="flex items-center gap-2 text-ink">
            <input type="checkbox" checked={s.equipmentCounted} onChange={(e) => a.setSignOut({ equipmentCounted: e.target.checked })} /> Equipment counted with the scrub nurse
          </label>
          <label className="flex items-center gap-2 text-ink">
            <input type="checkbox" checked={s.sharpsCounted} onChange={(e) => a.setSignOut({ sharpsCounted: e.target.checked })} /> Sharps counted
          </label>
          <ul className="space-y-1">
            {wires.map((w) => {
              const f = s.wiresChecked[w];
              return (
                <li key={w} className="flex flex-wrap items-center gap-2">
                  <span className="text-ink">{WIRE_SPEC[w].label}</span>
                  {f ? (
                    <span className={f === "damaged" ? "text-danger" : "text-ink-soft"}>{WIRE_FINDINGS[f]}</span>
                  ) : (
                    <button type="button" className="btn h-7 text-[12px]" onClick={() => a.inspectWire(w)}>
                      Inspect the wire
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          {a.damagedWireKind && s.wiresChecked[a.damagedWireKind] === "damaged" && (
            <div className="space-y-1">
              {DAMAGED_WIRE_ACTIONS.map((o) => (
                <label key={o.id} className="flex items-center gap-2 text-ink-soft">
                  <input type="radio" name="pci-damaged-wire" onChange={() => a.recordDamagedWire(o.id)} checked={s.damagedWireAction === o.id} />
                  {o.text}
                </label>
              ))}
            </div>
          )}
          <label className="flex flex-col gap-1 text-[12px] text-ink-faint">
            Anything left in place
            <input className="field" value={s.leftInPlace} onChange={(e) => a.setSignOut({ leftInPlace: e.target.value })} placeholder="Nothing" />
          </label>
        </Section>

        <Section title="Antiplatelet regimen" lesson="pm-antithrombotics-oral" showLesson={lessons}>
          <div className="flex flex-wrap items-end gap-2">
            <select className="field" value={s.antiplatelet.regimen} onChange={(e) => a.setSignOut({ antiplatelet: { ...s.antiplatelet, regimen: e.target.value } })} aria-label="Regimen">
              <option value="">Regimen</option>
              {ANTIPLATELET_REGIMENS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.text}
                </option>
              ))}
            </select>
            <label className="flex flex-col gap-1 text-[12px] text-ink-faint">
              Duration (months)
              <input className="field w-24 font-mono" type="number" min={0} value={s.antiplatelet.durationMonths ?? ""} onChange={(e) => a.setSignOut({ antiplatelet: { ...s.antiplatelet, durationMonths: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) } })} />
            </label>
            <select className="field" value={s.antiplatelet.loading ?? ""} onChange={(e) => a.setSignOut({ antiplatelet: { ...s.antiplatelet, loading: (e.target.value || null) as typeof s.antiplatelet.loading } })} aria-label="Loading dose">
              <option value="">Loading dose</option>
              {LOADING_STATUS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.text}
                </option>
              ))}
            </select>
          </div>
          <label className="flex flex-col gap-1 text-[12px] text-ink-faint">
            Concerns for recovery
            <input className="field" value={s.recoveryConcerns} onChange={(e) => a.setSignOut({ recoveryConcerns: e.target.value })} />
          </label>
        </Section>

        {unassessed > 0 && (
          <p className="text-[12px] text-warn" role="status">
            {unassessed === 1 ? "1 change not yet assessed" : `${unassessed} changes not yet assessed`}: assess {unassessed === 1 ? "it" : "each"} (Assess) before you sign out.
          </p>
        )}
        {cx.length > 0 && (
          <Section title="Complications" lesson={PCI_PLAN_LESSONS.pmi} showLesson={lessons}>
            {cx.map((c) => (
              <label key={c.id} className="flex flex-col gap-1 text-[12px] text-ink-faint">
                {c.label}: how it ended
                <select className="field" value={s.complications[c.id] ?? ""} onChange={(e) => a.setSignOut({ complications: { ...s.complications, [c.id]: e.target.value } })}>
                  <option value="">Choose</option>
                  {COMPLICATION_OUTCOMES.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.text}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            {a.pmiAsked() && (
              <div className="space-y-1.5">
                <div className="flex flex-wrap gap-3">
                  {(
                    [
                      ["ecg", "12-lead ECG"],
                      ["troponin", "Troponin against the baseline"],
                      ["imaging", "Imaging of the territory (echo)"],
                    ] as const
                  ).map(([k, label]) => (
                    <label key={k} className="flex items-center gap-2 text-ink">
                      <input type="checkbox" checked={s.ordered[k]} disabled={!!r && k !== "imaging"} onChange={(e) => a.order({ [k]: e.target.checked })} /> {label}
                    </label>
                  ))}
                </div>
                {r && (
                  <div className="space-y-1">
                    <ul className="list-disc pl-5 text-ink-soft">
                      <li>Troponin: {r.troponinRise ? `a rise above the sex-specific 99th centile and the baseline${r.risingAt6h ? ", still rising at 6 hours" : ""}` : "no rise above the 99th centile"}.</li>
                      <li>{r.clinicalFeature ? "New ischaemic change on the ECG, with chest pain." : "No symptoms of ischaemia; the ECG is unchanged."}</li>
                      <li>{s.ordered.imaging ? (r.newWallMotion ? "Echo: a new regional wall-motion abnormality in the territory." : "Echo: no new regional wall-motion abnormality.") : "No imaging ordered."}</li>
                    </ul>
                    <div className="seg" aria-label="Classification">
                      {(Object.keys(PMI_LABEL) as PmiClass[]).map((k) => (
                        <button key={k} type="button" className={`seg-btn ${s.pmiClass === k ? "seg-btn-active" : ""}`} onClick={() => a.setSignOut({ pmiClass: k })}>
                          {PMI_LABEL[k]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className="text-[12px] text-ink-faint">Telling the patient</span>
              {DISCLOSURE_OPTIONS.map((o) => (
                <label key={o.id} className="flex items-center gap-2 text-ink-soft">
                  <input type="radio" name="pci-disclosure" checked={s.disclosure === o.id} onChange={() => a.setSignOut({ disclosure: o.id })} />
                  {o.text}
                </label>
              ))}
              <label className="flex items-center gap-2 text-ink">
                <input type="checkbox" checked={s.incidentReport === true} onChange={(e) => a.setSignOut({ incidentReport: e.target.checked })} /> Incident report filed
              </label>
            </div>
          </Section>
        )}

        <Section title="Logbook" lesson={PCI_PLAN_LESSONS.logbook} showLesson={lessons}>
          <div className="seg" aria-label="Your role">
            {LOGBOOK_ROLES.map((o) => (
              <button key={o.id} type="button" className={`seg-btn ${s.logbook.role === o.id ? "seg-btn-active" : ""}`} onClick={() => a.setSignOut({ logbook: { ...s.logbook, role: o.id } })}>
                {o.text}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-ink-faint">
            The logbook's role column follows the mode ({roleFor(a.policy.mode)}); the role you choose here is kept in the entry's notes.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(
              [
                ["presentation", "Presentation"],
                ["complexity", "Complexity"],
                ["techniques", "Techniques used"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex flex-col gap-1 text-[12px] text-ink-faint">
                {label}
                <input className="field" value={s.logbook[k]} onChange={(e) => a.setSignOut({ logbook: { ...s.logbook, [k]: e.target.value } })} />
              </label>
            ))}
          </div>
        </Section>

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-2">
          {!done ? (
            <button type="button" className="btn btn-accent" onClick={() => a.completeSignOut()}>
              Complete the sign-out
            </button>
          ) : (
            <span className="text-good">Sign-out complete.</span>
          )}
          <button type="button" className="btn" onClick={onFinish} disabled={!a.finishAllowed()} title="End the case and go to the debrief">
            End the case
          </button>
          {!done && blockers.length > 0 && <span className="text-[12px] text-ink-faint">{blockers[0]}</span>}
        </div>
      </div>
    </section>
  );
}
