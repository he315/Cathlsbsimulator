// The VA-ECMO console: circuit speed, sweep and FdO₂, the distal perfusion cannula, an LV vent and
// differential hypoxaemia on the lumped circulation (src/simulation/circulation.ts). Split out of
// McsLab.tsx (mcs-console-split-select-and-tips); the run, its tips and its score go through
// useMcsSession.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LiveTrace from "../sim/LiveTrace";
import LabModeBar from "../lab/LabModeBar";
import LabTipsPanel from "../lab/LabTipsPanel";
import { LEG_NIRS_ISCHAEMIA, mcsTipContext, type McsStage } from "../lab/mcsTips";
import { PATIENTS, oxygenation, type BeatStats, type Devices, type Patient } from "../../simulation/circulation";
import { scoreMcsSession, type McsSessionScore } from "../../simulation/mcs/deviceChoice";
import { useCirculation } from "./useCirculation";
import { EndCase, Goals, SessionDebrief, Readout, ScenarioHeader, ScenarioPicker, StageBar, f0, f1, useGoalHold, useMcsSession, usePatientEvents, type Goal } from "./shared";
import type { ConsoleProps } from "./IabpConsole";
import type { LabEvent } from "../../content/lab/tips";

export interface EcmoCase {
  id: string;
  title: string;
  brief: string;
  patient: Patient;
  rpm: number;
  dpc: boolean;
  /**
   * a bubble sits in the arterial side of the cannula joint at the start (lesson
   * pm-support-devices-ecmo-cannulate, Brilakis 14.5: arterial-side bubbles come out through the side
   * port before the clamps come off; started with it in place, the bubble goes to the patient)
   */
  arterialBubble?: boolean;
  goals: (s: BeatStats, o: ReturnType<typeof oxygenation>, ctx: { dpc: boolean; vent: boolean }) => Goal[];
  debrief: string;
}

export const ECMO_CASES: EcmoCase[] = [
  {
    id: "ecpr",
    title: "Refractory VF: ECPR in the lab",
    brief: "45-year-old in refractory VF after an LAD occlusion, mechanical CPR running. Femoral cannulae are in; the circuit is primed and clamped.",
    patient: PATIENTS.arrest,
    rpm: 0,
    dpc: false,
    arterialBubble: true,
    goals: (s, o, ctx) => [
      { label: "MAP ≥ 60 mmHg on circuit flow", ok: s.map >= 60 },
      { label: "Right radial saturation ≥ 92%", ok: o.rightRadialSat >= 0.92 },
      { label: "LV not distending (LVEDP < 20)", ok: s.lvedp < 20 },
      { label: "Distal perfusion cannula in place", ok: ctx.dpc },
    ],
    debrief:
      "Circuit flow restores perfusion, but a non-ejecting LV fills from bronchial return and regurgitation and distends: pulse pressure disappears and LV pressure climbs. Venting (for example a microaxial pump), defibrillation and treating the culprit lesion follow.",
  },
  {
    id: "distension",
    title: "Flat arterial line and pink frothy secretions",
    brief: "Biventricular failure on VA-ECMO at high flow. Pulse pressure has disappeared and the chest X-ray shows worsening pulmonary oedema.",
    patient: PATIENTS.biv,
    rpm: 4100,
    dpc: true,
    goals: (s, _o, ctx) => [
      { label: "Aortic valve opening (pulse pressure ≥ 10) or LV vented", ok: s.pulsePressure >= 10 || ctx.vent },
      { label: "MAP ≥ 65 mmHg", ok: s.map >= 65 },
      { label: "Wedge < 22 mmHg", ok: s.pcwp < 22 },
    ],
    debrief:
      "Retrograde aortic flow raises LV afterload. Lower the flow to the least that maintains perfusion, add an inotrope to help the LV eject, and vent the LV mechanically if it still fails to open the valve.",
  },
  {
    id: "harlequin",
    title: "Blue head, pink legs",
    brief: "Day 4 of VA-ECMO. The LV is recovering, but the lungs are still oedematous. Right radial saturation is falling while the femoral blood gas looks fine.",
    patient: PATIENTS.recovering,
    rpm: 3500,
    dpc: true,
    goals: (_s, o) => [{ label: "Right radial saturation ≥ 92%", ok: o.rightRadialSat >= 0.92 }],
    debrief:
      "Native output from a recovering LV, oxygenated by poor lungs, supplies the coronaries and the brain first, while the circuit blood only reaches the lower body. Options: optimise ventilation (oxygen and PEEP), increase circuit flow to move the mixing zone proximally, or add a venous return limb (V-AV configuration).",
  },
];

export default function EcmoConsole({ scenarioId, onScenario, launchMode, runKey, onRestart }: ConsoleProps) {
  const ec = ECMO_CASES.find((x) => x.id === scenarioId) ?? ECMO_CASES[0];
  const [patient, setPatient] = useState<Patient>(ec.patient);
  const [rpm, setRpmRaw] = useState(ec.rpm);
  const [sweep, setSweep] = useState(3);
  const [fdo2, setFdo2] = useState(1);
  const [dpc, setDpc] = useState(ec.dpc);
  const [vent, setVent] = useState(0); // microaxial vent P-level, 0 = none
  const [vav, setVav] = useState(false);
  const [harms, setHarms] = useState(0);
  const [bubble, setBubble] = useState(!!ec.arterialBubble);
  const [airEmbolised, setAirEmbolised] = useState(false);
  const [result, setResult] = useState<McsSessionScore | null>(null);
  // cannulae in with the circuit clamped is the insertion stage; starting flow moves the run on
  const [stage, setStage] = useState<McsStage>(ec.rpm > 0 ? "manage" : "insert");
  const resetKey = `${ec.id}-${runKey}`;
  const setRpm = (v: number) => {
    setRpmRaw(v);
    if (v > 0) setStage((st) => (st === "insert" ? "manage" : st));
    // flow started with air in the arterial side of the joint: the bubble goes to the patient
    if (v > 0 && bubble) {
      setBubble(false);
      setAirEmbolised(true);
    }
  };
  const devices = useMemo<Devices>(
    () => ({
      ecmo: { on: rpm > 0, rpm, sweep, fdo2, distalPerfusion: dpc },
      impella: vent > 0 ? { on: true, pLevel: vent, depth: 3.5 } : undefined,
    }),
    [rpm, sweep, fdo2, dpc, vent]
  );
  const effPatient = useMemo<Patient>(() => (vav ? { ...patient, shunt: patient.shunt * 0.45 } : patient), [patient, vav]);
  const { stats, elapsed, clock, read, step } = useCirculation(effPatient, devices, resetKey);
  const o = stats ? oxygenation(effPatient, stats, devices) : null;

  const lastChatter = useRef(false);
  useEffect(() => {
    if (stats?.chatter && !lastChatter.current) setHarms((h) => h + 1);
    lastChatter.current = !!stats?.chatter;
  }, [stats?.chatter]);

  const legNirs = dpc ? 68 : Math.max(28, 60 - elapsed * 0.6);
  const patientEvents = usePatientEvents(stats, patient.rhythm, patient.hr, elapsed, resetKey);
  const events = useMemo<LabEvent[]>(() => (bubble ? [...patientEvents, "air"] : patientEvents), [patientEvents, bubble]);
  const context = useMemo(() => mcsTipContext("ecmo", stage, stats, { events, legNirs, vent: vent > 0 }), [stage, stats, events, legNirs, vent]);
  const state = useCallback(
    () => ({ stage, rpm, sweep, fdo2, dpc, vent, vav, harms, bubble, airEmbolised, elapsed, legNirs, stats, oxygenation: o }),
    [stage, rpm, sweep, fdo2, dpc, vent, vav, harms, bubble, airEmbolised, elapsed, legNirs, stats, o]
  );
  const { run, tips, visible } = useMcsSession({ console: "ecmo", scenarioId: ec.id, caseName: `VA-ECMO: ${ec.title}`, launchMode, runKey: resetKey, context, state, step });

  const goals = stats && o ? ec.goals(stats, o, { dpc, vent: vent > 0 }) : [];
  const finish = (targetsMet: boolean) => {
    // flow started over an arterial bubble is a critical error (the air went to the patient)
    const criticalErrors = airEmbolised ? 1 : 0;
    const sc = scoreMcsSession({ targetsMet, harms, criticalErrors });
    setResult(sc);
    const complications = [...(harms ? ["drainage chatter"] : []), ...(airEmbolised ? ["arterial air embolism"] : [])];
    run.finish({ score: sc.score, passed: sc.passed, criticalErrors, complications, metrics: { chatterEpisodes: harms, ...sc.criteria }, devices: ["VA-ECMO", ...(vent > 0 ? ["microaxial flow pump"] : [])] });
  };
  const done = useGoalHold(goals, elapsed, resetKey, () => finish(true));
  const guided = run.mode === "guided";
  // interpretive colours (pulse pressure, LVEDP) and the mixing-zone diagram are teaching aids:
  // live in guided practice, otherwise once the case ends; monitor alarms (MAP, SpO₂, leg NIRS,
  // retrograde flow) colour in every mode
  const teach = guided || done || run.finished;

  return (
    <div className="space-y-4">
      <LabModeBar mode={run.mode} helpAskedAt={run.helpAskedAt} onAskHelp={() => run.askHelp()}>
        <StageBar stage={stage} canWean={done} onWean={() => setStage("wean")} />
        <EndCase finished={run.finished} onEnd={() => finish(false)} />
      </LabModeBar>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 space-y-4">
          <ScenarioHeader brief={ec.brief} picker={<ScenarioPicker value={ec.id} cases={ECMO_CASES} onChange={onScenario} />} />
          <div className="panel overflow-hidden">
            <div className="panel-head">
              <span>Right radial arterial line · PA catheter</span>
              <span className="normal-case tracking-normal font-mono">{stats ? `ART ${f0(stats.sys)}/${f0(stats.dia)} (${f0(stats.map)}) · PP ${f0(stats.pulsePressure)}` : ""}</span>
            </div>
            <div className="p-2 monitor">
              <LiveTrace
                channels={[
                  { fn: read("art"), color: "#ff5d6c", label: "ART", width: 2 },
                  { fn: read("pa"), color: "#facc15", label: "PA", width: 1.6 },
                ]}
                min={0}
                max={140}
                height={190}
                seconds={6}
                clock={clock}
              />
            </div>
          </div>
          {o && teach && <MixingDiagram o={o} ecmoFlow={stats?.ecmoFlow ?? 0} native={(stats?.nativeCO ?? 0) + (stats?.impellaFlow ?? 0)} />}
        </div>
        <div className="xl:col-span-4 space-y-4">
          {run.finished && result && <SessionDebrief result={result} harmLabel="Free of drainage chatter" onRestart={onRestart} />}
          <LabTipsPanel tips={tips} visible={visible} mode={run.mode} onAskHelp={() => run.askHelp()} events={context.events} />
          <div className="panel p-3 space-y-3">
            <div className="stat-label">Circuit</div>
            <div>
              <div className="flex justify-between text-[12px] text-ink-soft">
                <span>Pump speed</span>
                <span className="font-mono">{rpm} rpm</span>
              </div>
              <input type="range" min={0} max={4600} step={50} value={rpm} onChange={(e) => setRpm(Number(e.target.value))} className="w-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[12px] text-ink-soft">
                  <span>Sweep</span>
                  <span className="font-mono">{sweep.toFixed(1)} L/min</span>
                </div>
                <input type="range" min={0} max={8} step={0.5} value={sweep} onChange={(e) => setSweep(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <div className="flex justify-between text-[12px] text-ink-soft">
                  <span>FdO₂</span>
                  <span className="font-mono">{fdo2.toFixed(2)}</span>
                </div>
                <input type="range" min={0.21} max={1} step={0.01} value={fdo2} onChange={(e) => setFdo2(Number(e.target.value))} className="w-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button className={`btn !text-[12px] ${dpc ? "btn-good" : ""}`} onClick={() => setDpc(true)} disabled={dpc}>
                {dpc ? "✓ Distal perfusion cannula" : "Insert distal perfusion cannula"}
              </button>
              <button className="btn !text-[12px]" onClick={() => setPatient((p) => ({ ...p, stressed: p.stressed + 250 }))}>
                Fluid 250 mL
              </button>
              <button className="btn !text-[12px]" onClick={() => setPatient((p) => ({ ...p, lv: { ...p.lv, ees: p.lv.ees * 1.25 }, rv: { ...p.rv, ees: p.rv.ees * 1.25 } }))}>
                Start/raise inotrope
              </button>
              <button className="btn !text-[12px]" disabled={patient.rhythm !== "vf"} onClick={() => setPatient((p) => ({ ...p, rhythm: "sinus", hr: 100, lv: { ...p.lv, ees: 0.45 } }))}>
                Defibrillate
              </button>
              <button className={`btn !text-[12px] ${vent > 0 ? "btn-good" : ""}`} onClick={() => setVent((v) => (v > 0 ? 0 : 4))}>
                {vent > 0 ? `LV vent on (P${vent})` : "Add microaxial LV vent"}
              </button>
              <button className="btn !text-[12px]" onClick={() => setPatient((p) => ({ ...p, shunt: Math.max(0.05, p.shunt * 0.75) }))}>
                Ventilator: ↑ FiO₂/PEEP
              </button>
              {(bubble || ec.arterialBubble) && (
                <button className="btn !text-[12px] col-span-2" disabled={!bubble} onClick={() => setBubble(false)}>
                  {bubble ? "Aspirate air through the side port" : "✓ Joint aspirated"}
                </button>
              )}
              <button className={`btn !text-[12px] col-span-2 ${vav ? "btn-good" : ""}`} onClick={() => setVav((v) => !v)}>
                {vav ? "✓ V-AV configuration" : "Add venous return limb (V-AV)"}
              </button>
            </div>
            {vent > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-ink-soft">Vent level</span>
                <input type="range" min={1} max={9} step={1} value={vent} onChange={(e) => setVent(Number(e.target.value))} className="flex-1" />
                <span className="font-mono text-[12px]">P{vent}</span>
              </div>
            )}
          </div>
          <div className="panel p-3 grid grid-cols-2 gap-2">
            <Readout label="Circuit flow" value={f1(stats?.ecmoFlow)} unit="L/min" tone={stats && stats.ecmoFlow < 0 ? "danger" : undefined} />
            <Readout label="Native + vent" value={f1((stats?.nativeCO ?? 0) + (stats?.impellaFlow ?? 0))} unit="L/min" />
            <Readout label="MAP" value={f0(stats?.map)} unit="mmHg" tone={stats && stats.map >= 65 ? "good" : "danger"} />
            <Readout label="Pulse pressure" value={f0(stats?.pulsePressure)} unit="mmHg" tone={teach && stats ? (stats.pulsePressure < 10 ? "warn" : "good") : undefined} />
            <Readout label="LVEDP" value={f0(stats?.lvedp)} unit="mmHg" tone={teach && stats && stats.lvedp > 20 ? "danger" : undefined} />
            <Readout label="Wedge" value={f0(stats?.pcwp)} unit="mmHg" />
            <Readout label="R radial SpO₂" value={o ? f0(o.rightRadialSat * 100) : "—"} unit="%" tone={o && o.rightRadialSat < 0.92 ? "danger" : "good"} />
            <Readout label="Femoral SaO₂" value={o ? f0(o.lowerBodySat * 100) : "—"} unit="%" />
            <Readout label="PaCO₂" value={o ? f1(o.paco2 * 0.133) : "—"} unit="kPa" />
            <Readout label="Leg NIRS" value={f0(legNirs)} unit="%" tone={legNirs < LEG_NIRS_ISCHAEMIA ? "danger" : "good"} />
          </div>
          <div className="panel p-3 space-y-1">
            <div className="stat-label">Alarms and echo</div>
            {stats?.ecmoFlow !== undefined && stats.ecmoFlow < 0 && <div className="text-danger text-[13px] font-semibold">Retrograde circuit flow</div>}
            {stats?.chatter && <div className="text-danger text-[13px] font-semibold">Drainage line chatter</div>}
            {patient.rhythm === "vf" && <div className="text-danger text-[13px] font-semibold">Rhythm: VF</div>}
            {bubble && <div className="text-danger text-[13px] font-semibold">Bubble in the arterial side of the cannula joint</div>}
            {airEmbolised && <div className="text-danger text-[13px] font-semibold">Flow started with air in the arterial line</div>}
            {stats && <div className="text-[13px] text-ink-soft">Aortic valve: {stats.avOpen && stats.pulsePressure >= 5 ? "opening" : "not opening"}</div>}
            {legNirs < LEG_NIRS_ISCHAEMIA && <div className="text-warn text-[13px]">Cannulated leg NIRS below {LEG_NIRS_ISCHAEMIA}%</div>}
          </div>
          <Goals goals={goals} done={done} showProgress={teach} />
          {done && <div className="panel p-3 text-[13px] text-ink-soft leading-relaxed animate-fadein">{ec.debrief}</div>}
        </div>
      </div>
    </div>
  );
}

function MixingDiagram({ o, ecmoFlow, native }: { o: ReturnType<typeof oxygenation>; ecmoFlow: number; native: number }) {
  const zoneX = o.mixingZone === "descending aorta" ? 560 : o.mixingZone === "arch" ? 360 : o.mixingZone === "aortic root" ? 190 : 150;
  const sat = (x: number) => `hsl(${Math.round((x - 0.6) * 300)}, 70%, 55%)`;
  return (
    <div className="panel">
      <div className="panel-head">
        <span>Where native and circuit blood meet</span>
        <span className="normal-case tracking-normal text-ink-faint">mixing zone: {o.mixingZone}</span>
      </div>
      <svg viewBox="0 0 760 170" className="w-full">
        <defs>
          <linearGradient id="mixg" x1="0" x2="1">
            <stop offset="0" stopColor={sat(o.nativeSat)} />
            <stop offset={`${Math.max(0.05, Math.min(0.95, (zoneX - 120) / 600))}`} stopColor={sat(o.nativeSat)} />
            <stop offset={`${Math.max(0.1, Math.min(1, (zoneX - 60) / 600))}`} stopColor={sat(o.circuitSat)} />
            <stop offset="1" stopColor={sat(o.circuitSat)} />
          </linearGradient>
        </defs>
        <path d="M130,130 C130,40 300,30 360,60 C420,90 520,100 720,100" fill="none" stroke="url(#mixg)" strokeWidth={26} strokeLinecap="round" />
        <text x={110} y={155} fontSize={11} fill="#A6ADB8">
          LV / aortic root
        </text>
        <line x1={250} y1={45} x2={250} y2={8} stroke={sat(o.rightRadialSat)} strokeWidth={8} />
        <text x={260} y={18} fontSize={11} fill="#A6ADB8">
          innominate → right arm, brain
        </text>
        <text x={640} y={135} fontSize={11} fill="#A6ADB8">
          circuit return (femoral)
        </text>
        <line x1={zoneX} y1={20} x2={zoneX} y2={150} stroke="#E9B95A" strokeDasharray="4 4" />
        <text x={zoneX + 6} y={150} fontSize={11} fill="#E9B95A">
          mixing zone
        </text>
        <text x={20} y={20} fontSize={11} fill="#A6ADB8">
          native {native.toFixed(1)} L/min · circuit {Math.max(0, ecmoFlow).toFixed(1)} L/min
        </text>
      </svg>
    </div>
  );
}
