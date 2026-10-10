// The device-choice step at the start of each MCS console (mcs-console-split-select-and-tips;
// lab request pm-support-choice#0). The learner reads the patient's profile (the right heart
// numbers, pressure, rhythm and oxygenation, the planned procedure, the echo and the access
// arteries), classifies the patient, chooses the support and names the finding that decided it.
// The choice is scored by src/simulation/mcs/deviceChoice.ts against the module's algorithm;
// nothing derived (PAPi, cardiac power output, the classification) is shown before the choice is
// submitted. The run is logged through useMcsSession (useLabRun) with its decision and any
// critical error.
import { useCallback, useMemo, useState } from "react";
import LabModeBar from "../lab/LabModeBar";
import LabTipsPanel from "../lab/LabTipsPanel";
import { mcsTipContext, type McsConsole } from "../lab/mcsTips";
import type { LaunchMode } from "../../content/schema";
import {
  CLASS_LABEL,
  DEVICE_LABEL,
  FINDINGS,
  PROCEDURE_LABEL,
  choiceLesson,
  meanPressure,
  profileEvents,
  scoreChoice,
  type ChoiceResult,
  type FindingId,
  type SupportClass,
  type SupportDevice,
  type SupportProfile,
} from "../../simulation/mcs/deviceChoice";
import { CONSOLE_LABEL, CONSOLE_NOUN, ScenarioHeader, ScenarioPicker, StageBar, useMcsSession, type PickItem } from "./shared";

export interface DeviceChoiceProps {
  consoleId: McsConsole;
  profile: SupportProfile;
  /** the console's own cases, for the scenario picker */
  cases: readonly PickItem[];
  onScenario: (id: string) => void;
  launchMode: LaunchMode | null;
  runKey: number;
}

const CLASSES: SupportClass[] = ["none", "standby", "upfront", "shock", "arrest"];
const DEVICES: SupportDevice[] = ["none", "iabp", "microaxial", "va-ecmo", "right-sided", "combined", "change-plan"];

const AR_LABEL = { none: "none", mild: "mild", moderate: "moderate", severe: "severe" } as const;
const VENT_LABEL = { "room-air": "room air", oxygen: "supplemental oxygen", "high-flow": "high-flow oxygen", optimised: "ventilated, oxygenation and ventilation optimised" } as const;

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-line/60 py-1 text-[13px]">
      <span className="text-ink-faint">{k}</span>
      <span className="font-mono text-ink text-right">{v}</span>
    </div>
  );
}

/** The patient as the operator knows them before the case. */
export function ProfilePanel({ p }: { p: SupportProfile }) {
  const r = p.rhc;
  const yes = (b: boolean) => (b ? "yes" : "no");
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="panel p-3">
        <div className="stat-label mb-1">Haemodynamics</div>
        <Row k="Rhythm, rate" v={p.rhythm === "vf" ? "VF" : `${p.rhythm === "af" ? "AF" : "Sinus"} ${p.hr} bpm`} />
        <Row k="Blood pressure" v={p.bp.sys > 0 ? `${p.bp.sys}/${p.bp.dia} (${meanPressure(p.bp)}) mmHg` : "no output"} />
        <Row k="Vasopressors or inotropes" v={yes(p.onPressors)} />
        {p.lactate !== undefined && <Row k="Lactate" v={`${p.lactate.toFixed(1)} mmol/L`} />}
        {r ? (
          <>
            <Row k="RA" v={`${r.ra} mmHg`} />
            <Row k="PA" v={`${r.paSys}/${r.paDia} mmHg`} />
            <Row k="Wedge" v={`${r.wedge} mmHg`} />
            <Row k="Mixed venous saturation" v={`${r.svo2}%`} />
          </>
        ) : (
          <Row k="Right heart study" v="not done" />
        )}
        {p.co !== undefined && <Row k="Cardiac output (Fick)" v={`${p.co.toFixed(1)} L/min`} />}
        {p.ci !== undefined && <Row k="Cardiac index" v={`${p.ci.toFixed(1)} L/min/m²`} />}
        <Row k="SpO₂" v={p.spo2 > 0 ? `${p.spo2}%` : "not recordable"} />
        <Row k="Oxygenation" v={VENT_LABEL[p.ventilation]} />
      </div>
      <div className="panel p-3">
        <div className="stat-label mb-1">Procedure, echo and access</div>
        <Row k="Planned" v={PROCEDURE_LABEL[p.procedure]} />
        <Row k="Anatomy" v={p.anatomy} />
        <Row k="Ejection fraction" v={p.echo.lvef > 0 ? `${p.echo.lvef}%` : "not known"} />
        <Row k="Mechanical aortic valve" v={yes(p.echo.mechanicalAv)} />
        <Row k="LV thrombus" v={yes(p.echo.lvThrombus)} />
        <Row k="Aortic regurgitation" v={AR_LABEL[p.echo.ar]} />
        <Row k="Atrial or ventricular septal defect" v={yes(p.echo.asd || p.echo.vsd)} />
        {p.echo.note && <Row k="Echo" v={p.echo.note} />}
        <Row k="Smallest iliofemoral lumen" v={`${p.iliofemoral.minLumenMm} mm`} />
        <Row k="Severe iliofemoral calcium" v={yes(p.iliofemoral.severeCalcium)} />
        <Row k="Severe iliofemoral tortuosity" v={yes(p.iliofemoral.severeTortuosity)} />
        <Row k="Axillary or transcaval expertise" v={yes(p.alternativeRoute)} />
        <Row k="Aortic dissection or aneurysm" v={p.aorticDissection ? "dissection" : p.aorticAneurysm ? "aneurysm" : "no"} />
        <Row k="Severe peripheral arterial disease" v={yes(p.severePad)} />
        <Row k="Bleeding" v={p.bleeding === "none" ? "no" : p.bleeding === "high-risk" ? "high bleeding risk" : "uncontrolled bleeding"} />
      </div>
    </div>
  );
}

function Choices<T extends string>({ name, value, options, label, onChange, disabled }: { name: string; value: T | null; options: readonly T[]; label: (x: T) => string; onChange: (x: T) => void; disabled: boolean }) {
  return (
    <div className="space-y-1" role="radiogroup" aria-label={name}>
      {options.map((x) => (
        <label key={x} className="flex items-center gap-2 text-[13px] text-ink-soft">
          <input type="radio" name={name} checked={value === x} onChange={() => onChange(x)} disabled={disabled} />
          {label(x)}
        </label>
      ))}
    </div>
  );
}

/** The debrief of a submitted choice: what was accepted, the deciding finding and the algorithm's path. */
export function ChoiceDebrief({ r }: { r: ChoiceResult }) {
  const e = r.expected;
  return (
    <div className="panel p-3 space-y-2 text-[13px] animate-fadein">
      <div className="flex items-center justify-between">
        <span className="stat-label">Debrief</span>
        <span className={`chip ${r.passed ? "border-good/40 text-good" : "border-danger/40 text-danger"}`}>{r.passed ? "accepted" : "not accepted"}</span>
      </div>
      <div className={r.classificationOk ? "text-good" : "text-warn"}>
        Classification: {e.classifications.map((c) => CLASS_LABEL[c]).join(" or ")}
        {e.tradeOffRequired ? ", with the trade-off between them stated" : ""}
      </div>
      <div className={r.deviceOk ? "text-good" : "text-warn"}>Support: {e.devices.map((d) => DEVICE_LABEL[d]).join(" or ")}</div>
      <div className={r.findingOk ? "text-good" : "text-warn"}>Deciding finding: {e.findings.map((f) => FINDINGS[f]).join("; ")}</div>
      {r.critical.map((c) => (
        <div key={c} className="text-danger font-semibold">
          Critical error: {c}
        </div>
      ))}
      {r.wrong.map((w) => (
        <div key={w} className="text-warn">
          {w}
        </div>
      ))}
      <ol className="list-decimal pl-5 text-ink-soft space-y-0.5">
        {e.path.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ol>
    </div>
  );
}

export default function DeviceChoice({ consoleId, profile, cases, onScenario, launchMode, runKey }: DeviceChoiceProps) {
  const [classification, setClassification] = useState<SupportClass | null>(null);
  const [device, setDevice] = useState<SupportDevice | null>(null);
  const [finding, setFinding] = useState<FindingId | "">("");
  const [tradeOff, setTradeOff] = useState(false);
  const [result, setResult] = useState<ChoiceResult | null>(null);

  const events = useMemo(() => profileEvents(profile), [profile]);
  const context = useMemo(() => mcsTipContext(consoleId, "select", null, { events }), [consoleId, events]);
  const state = useCallback(() => ({ stage: "select", profile: profile.id, classification, device, finding, tradeOff, result }), [profile, classification, device, finding, tradeOff, result]);
  const { run, tips, visible } = useMcsSession({ console: consoleId, scenarioId: profile.id, caseName: `${CONSOLE_LABEL[consoleId]}: ${profile.title}`, launchMode, runKey: `${profile.id}-${runKey}`, context, state });

  const ready = classification !== null && device !== null && finding !== "";
  const submit = () => {
    if (!ready || result) return;
    const r = scoreChoice(profile, { classification, device, finding, tradeOffStated: tradeOff });
    setResult(r);
    const lessonId = choiceLesson(profile);
    run.decide({
      id: "device-choice",
      stage: "select",
      label: "Support choice",
      correct: r.passed,
      expected: `${r.expected.classifications.map((c) => CLASS_LABEL[c]).join(" or ")}; ${r.expected.devices.map((d) => DEVICE_LABEL[d]).join(" or ")}`,
      given: `${CLASS_LABEL[classification]}; ${DEVICE_LABEL[device]}`,
      lessonId,
      tipIds: ["mcs-select-impella-contraindications", "mcs-select-shock-severity", "mcs-select-hypoxaemia-ecmo", "mcs-select-biventricular"],
    });
    run.decide({ id: "deciding-finding", stage: "select", label: "Deciding finding", correct: r.findingOk, expected: r.expected.findings.map((f) => FINDINGS[f]).join("; "), given: FINDINGS[finding], lessonId });
    run.finish({ score: r.score, passed: r.passed, criticalErrors: r.critical.length, metrics: { classification: Number(r.classificationOk), device: Number(r.deviceOk), finding: Number(r.findingOk) } });
  };

  return (
    <div className="space-y-4">
      <LabModeBar mode={run.mode} helpAskedAt={run.helpAskedAt} onAskHelp={() => run.askHelp()}>
        <StageBar stage="select" canWean={false} onWean={() => undefined} />
      </LabModeBar>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 space-y-4">
          <ScenarioHeader brief={profile.brief} picker={<ScenarioPicker value={profile.id} cases={cases} onChange={onScenario} />}>
            <div className="text-[12px] text-ink-faint mt-1">
              {profile.age}-year-old {profile.sex}. Decide whether this patient needs mechanical support, and which.
            </div>
          </ScenarioHeader>
          <ProfilePanel p={profile} />
        </div>
        <div className="xl:col-span-4 space-y-4">
          <LabTipsPanel tips={tips} visible={visible} mode={run.mode} onAskHelp={() => run.askHelp()} events={context.events} />
          <div className="panel p-3 space-y-3">
            <div className="stat-label">Your decision</div>
            <div>
              <div className="text-[12px] text-ink-soft mb-1">1. Classify the patient</div>
              <Choices name="Classification" value={classification} options={CLASSES} label={(c) => CLASS_LABEL[c]} onChange={setClassification} disabled={!!result} />
              <label className="flex items-start gap-2 text-[12.5px] text-ink-soft mt-1.5">
                <input type="checkbox" checked={tradeOff} onChange={(e) => setTradeOff(e.target.checked)} disabled={!!result} />
                Upfront support against standby with the access in has been discussed with the team and the patient
              </label>
            </div>
            <div>
              <div className="text-[12px] text-ink-soft mb-1">2. Choose the support</div>
              <Choices name="Support" value={device} options={DEVICES} label={(d) => DEVICE_LABEL[d]} onChange={setDevice} disabled={!!result} />
            </div>
            <div>
              <div className="text-[12px] text-ink-soft mb-1">3. Name the finding that decided it</div>
              <select value={finding} onChange={(e) => setFinding(e.target.value as FindingId | "")} disabled={!!result} aria-label="Deciding finding" className="w-full bg-base-800 border border-line rounded-md px-2 py-1.5 text-[13px] text-ink">
                <option value="">Choose a finding</option>
                {(Object.keys(FINDINGS) as FindingId[]).map((f) => (
                  <option key={f} value={f}>
                    {FINDINGS[f]}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="btn btn-accent w-full" disabled={!ready || !!result} onClick={submit}>
              Submit the decision
            </button>
          </div>
          {result && <ChoiceDebrief r={result} />}
          {result && cases.length > 0 && (
            <button type="button" className="btn w-full" onClick={() => onScenario(cases[0].id)}>
              Go to the {CONSOLE_NOUN[consoleId]} console
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
