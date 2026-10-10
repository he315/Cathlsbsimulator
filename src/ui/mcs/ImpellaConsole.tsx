// The microaxial pump console: performance level, inlet position, suction and RV failure on the
// lumped circulation (src/simulation/circulation.ts). Split out of McsLab.tsx
// (mcs-console-split-select-and-tips); the run, its tips and its score go through useMcsSession.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LiveTrace from "../sim/LiveTrace";
import LabModeBar from "../lab/LabModeBar";
import LabTipsPanel from "../lab/LabTipsPanel";
import { mcsTipContext, type McsStage } from "../lab/mcsTips";
import { PATIENTS, impellaPosition, type BeatStats, type Devices, type Patient } from "../../simulation/circulation";
import { scoreMcsSession, type McsSessionScore } from "../../simulation/mcs/deviceChoice";
import { useCirculation } from "./useCirculation";
import { EndCase, Goals, SessionDebrief, Readout, ScenarioHeader, ScenarioPicker, StageBar, f0, f1, f2, useGoalHold, useMcsSession, usePatientEvents, type Goal } from "./shared";
import type { ConsoleProps } from "./IabpConsole";

export interface ImpCase {
  id: string;
  title: string;
  brief: string;
  patient: Patient;
  pLevel: number;
  depth: number;
  /** the stage the case opens at: a pump just placed is checked before it is run up */
  stage: "position" | "manage";
  /** the targets; `guided` names a recognition target's answer only in guided practice */
  goals: (s: BeatStats, depth: number, guided: boolean) => Goal[];
  debrief: string;
}

export const IMP_CASES: ImpCase[] = [
  {
    id: "escalate",
    title: "Anterior STEMI with cardiogenic shock",
    brief: "Proximal LAD occlusion, now stented. Cold, lactate rising, on noradrenaline. A microaxial flow pump has just been placed and is running at P2.",
    patient: PATIENTS.lvShock,
    pLevel: 2,
    depth: 3.5,
    stage: "position",
    goals: (s, d) => [
      { label: "MAP ≥ 65 mmHg", ok: s.map >= 65 },
      { label: "Cardiac power output ≥ 0.6 W", ok: s.cpo >= 0.6 },
      { label: "No suction", ok: !s.suction },
      { label: "Inlet about 3.5 cm below the valve", ok: impellaPosition(d) === "correct" },
    ],
    debrief:
      "Escalating the P-level increases pump flow and unloads the LV: arterial pressure becomes less pulsatile as native ejection falls, LV end-diastolic pressure and wedge come down, and cardiac power output rises.",
  },
  {
    id: "suction",
    title: "Suction alarms after diuresis",
    brief: "Day 2 of support at P8. Aggressive diuresis overnight. Now repeated suction alarms, ectopy and dark urine.",
    patient: { ...PATIENTS.lvShock, stressed: 480 },
    pLevel: 8,
    depth: 3.5,
    stage: "manage",
    goals: (s, d) => [
      { label: "No suction", ok: !s.suction },
      { label: "MAP ≥ 65 mmHg", ok: s.map >= 65 },
      { label: "Pump flow ≥ 2.5 L/min", ok: s.impellaFlow >= 2.5 },
      { label: "Inlet about 3.5 cm below the valve", ok: impellaPosition(d) === "correct" },
    ],
    debrief:
      "Suction means the LV is underfilled for the pump speed: reduce the P-level, give volume, check position on echo, and consider RV failure or tamponade as causes of low LV preload. Persistent suction causes haemolysis.",
  },
  {
    id: "migrated",
    title: "Position alarm",
    brief: "After turning the patient, the console shows a ventricular placement signal and flow has fallen.",
    patient: PATIENTS.lvShock,
    pLevel: 8,
    depth: 6.5,
    stage: "manage",
    goals: (s, d) => [
      { label: "Placement signal aortic, motor current pulsatile", ok: impellaPosition(d) === "correct" },
      { label: "MAP ≥ 65 mmHg", ok: s.map >= 65 },
      { label: "No suction", ok: !s.suction },
    ],
    debrief:
      "A ventricular placement signal means the outlet has fallen into the LV, so the pump recirculates blood within the ventricle. Withdraw under echo or fluoroscopic guidance until the inlet sits about 3.5 cm below the annulus, with the placement signal aortic and the motor current pulsatile.",
  },
  {
    id: "rv",
    title: "Low flows and a rising CVP",
    brief: "Inferior-posterior infarct with LV and RV involvement. Microaxial flow pump at P8, but flows are disappointing and the CVP keeps climbing.",
    patient: PATIENTS.biv,
    pLevel: 8,
    depth: 3.5,
    stage: "manage",
    goals: (s, _d, guided) => [
      { label: guided ? "Recognise RV failure: PAPi < 0.9 and CVP high" : "Find the cause of the low flows", ok: s.papi < 0.9 && s.cvp > 10 },
      { label: "MAP ≥ 65 mmHg", ok: s.map >= 65 },
      { label: "No suction", ok: !s.suction },
    ],
    debrief:
      "The LV pump can only move what the RV delivers. A high CVP, low PAPi and suction-prone flows point to RV failure; inotropes help at the margin, but this phenotype usually needs right-sided or biventricular support (such as a right-sided percutaneous pump or VA-ECMO).",
  },
];

export default function ImpellaConsole({ scenarioId, onScenario, launchMode, runKey, onRestart }: ConsoleProps) {
  const ic = IMP_CASES.find((x) => x.id === scenarioId) ?? IMP_CASES[0];
  const [patient, setPatient] = useState<Patient>(ic.patient);
  const [pLevel, setPLevel] = useState(ic.pLevel);
  const [depth, setDepth] = useState(ic.depth);
  const [harms, setHarms] = useState(0);
  const [result, setResult] = useState<McsSessionScore | null>(null);
  const [stage, setStage] = useState<McsStage>(ic.stage);
  const resetKey = `${ic.id}-${runKey}`;
  const devices = useMemo<Devices>(() => ({ impella: { on: true, pLevel, depth } }), [pLevel, depth]);
  const { stats, elapsed, clock, read, step } = useCirculation(patient, devices, resetKey);

  // a pump just placed is positioned and checked first; the first change of level runs it up
  const setP = (p: number) => {
    setPLevel(p);
    setStage((st) => (st === "position" ? "manage" : st));
  };

  const lastSuction = useRef(false);
  useEffect(() => {
    if (stats?.suction && !lastSuction.current) setHarms((h) => h + 1);
    lastSuction.current = !!stats?.suction;
  }, [stats?.suction]);

  const pos = impellaPosition(depth);
  const patientEvents = usePatientEvents(stats, patient.rhythm, patient.hr, elapsed, resetKey);
  const context = useMemo(() => mcsTipContext("impella", stage, stats, { events: patientEvents, impellaPosition: pos }), [stage, stats, patientEvents, pos]);
  const state = useCallback(() => ({ stage, pLevel, depth, position: pos, harms, elapsed, stats }), [stage, pLevel, depth, pos, harms, elapsed, stats]);
  const { run, tips, visible } = useMcsSession({ console: "impella", scenarioId: ic.id, caseName: `Microaxial pump: ${ic.title}`, launchMode, runKey: resetKey, context, state, step });

  const guided = run.mode === "guided";
  const goals = stats ? ic.goals(stats, depth, guided) : [];
  const finish = (targetsMet: boolean) => {
    const sc = scoreMcsSession({ targetsMet, harms, criticalErrors: 0 });
    setResult(sc);
    run.finish({ score: sc.score, passed: sc.passed, criticalErrors: 0, complications: harms ? ["suction"] : [], metrics: { suctionEpisodes: harms, ...sc.criteria }, devices: ["microaxial flow pump"] });
  };
  const done = useGoalHold(goals, elapsed, resetKey, () => finish(true));
  // interpretive colours (CPO, PAPi) are teaching aids: live in guided practice, otherwise once the case ends
  const teach = guided || done || run.finished;

  return (
    <div className="space-y-4">
      <LabModeBar mode={run.mode} helpAskedAt={run.helpAskedAt} onAskHelp={() => run.askHelp()}>
        <StageBar stage={stage} canWean={done} onWean={() => setStage("wean")} />
        <EndCase finished={run.finished} onEnd={() => finish(false)} />
      </LabModeBar>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 space-y-4">
          <ScenarioHeader brief={ic.brief} picker={<ScenarioPicker value={ic.id} cases={IMP_CASES} onChange={onScenario} />} />
          <div className="panel overflow-hidden">
            <div className="panel-head">
              <span>Patient monitor</span>
              <span className="normal-case tracking-normal font-mono">{stats ? `ART ${f0(stats.sys)}/${f0(stats.dia)} (${f0(stats.map)})` : ""}</span>
            </div>
            <div className="p-2 monitor">
              <LiveTrace channels={[{ fn: read("art"), color: "#ff5d6c", label: "ART", width: 2 }]} min={0} max={140} height={150} seconds={6} clock={clock} />
            </div>
            <div className="panel-head border-t border-line">
              <span>Pump console</span>
              <span className="normal-case tracking-normal text-ink-faint">placement signal (red) · motor current (green)</span>
            </div>
            <div className="p-2 monitor grid md:grid-cols-2 gap-2">
              <LiveTrace channels={[{ fn: read("placement"), color: "#ff5d6c", label: "PLACEMENT", width: 1.8 }]} min={0} max={140} height={120} seconds={6} clock={clock} />
              <LiveTrace channels={[{ fn: read("motor"), color: "#3ef2a4", label: "MOTOR", width: 1.8 }]} min={0} max={900} height={120} seconds={6} clock={clock} unit="rel." />
            </div>
          </div>
          <PumpDiagram depth={depth} teach={teach} />
        </div>
        <div className="xl:col-span-4 space-y-4">
          {run.finished && result && <SessionDebrief result={result} harmLabel="Free of suction episodes" onRestart={onRestart} />}
          <LabTipsPanel tips={tips} visible={visible} mode={run.mode} onAskHelp={() => run.askHelp()} events={context.events} />
          <div className="panel p-3 space-y-3">
            <div className="stat-label">Controls</div>
            <div>
              <div className="text-[12px] text-ink-soft mb-1">Performance level</div>
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: 10 }, (_, i) => (
                  <button key={i} onClick={() => setP(i)} className={`rounded border py-1 text-[12px] font-mono ${pLevel === i ? "border-accent bg-accent/20 text-ink" : "border-line text-ink-faint hover:text-ink"}`}>
                    P{i}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[12px] text-ink-soft">
                <span>Inlet depth below the valve</span>
                <span className="font-mono">{depth.toFixed(1)} cm</span>
              </div>
              <input type="range" min={-1} max={7.5} step={0.1} value={depth} onChange={(e) => setDepth(Number(e.target.value))} className="w-full" />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button className="btn !text-[12px]" onClick={() => setPatient((p) => ({ ...p, stressed: p.stressed + 250 }))}>
                Fluid 250 mL
              </button>
              <button className="btn !text-[12px]" onClick={() => setPatient((p) => ({ ...p, lv: { ...p.lv, ees: p.lv.ees * 1.2 }, rv: { ...p.rv, ees: p.rv.ees * 1.25 }, hr: Math.min(130, p.hr + 5) }))}>
                Start/raise inotrope
              </button>
              <button className="btn !text-[12px]" onClick={() => setPatient((p) => ({ ...p, rsys: p.rsys * 1.15 }))}>
                Raise vasopressor
              </button>
              <button className="btn !text-[12px]" onClick={() => setPatient((p) => ({ ...p, rsys: p.rsys / 1.15 }))}>
                Reduce vasopressor
              </button>
            </div>
          </div>
          <div className="panel p-3 grid grid-cols-2 gap-2">
            <Readout label="Pump flow" value={f1(stats?.impellaFlow)} unit="L/min" />
            <Readout label="Native ejection" value={f1(stats?.nativeCO)} unit="L/min" />
            <Readout label="MAP" value={f0(stats?.map)} unit="mmHg" tone={stats && stats.map >= 65 ? "good" : "danger"} />
            <Readout label="CPO" value={f2(stats?.cpo)} unit="W" tone={teach && stats ? (stats.cpo >= 0.6 ? "good" : "warn") : undefined} />
            <Readout label="LVEDP" value={f0(stats?.lvedp)} unit="mmHg" />
            <Readout label="Wedge" value={f0(stats?.pcwp)} unit="mmHg" />
            <Readout label="CVP" value={f0(stats?.cvp)} unit="mmHg" />
            <Readout label="PAPi" value={f2(stats?.papi)} tone={teach && stats && stats.papi < 0.9 ? "warn" : undefined} />
          </div>
          <div className="panel p-3 space-y-1">
            <div className="stat-label">Alarms</div>
            {stats?.suction && <div className="text-danger text-[13px] font-semibold">Suction alarm</div>}
            {pos === "ventricle" && <div className="text-danger text-[13px] font-semibold">Position: ventricular placement signal</div>}
            {pos === "aorta" && <div className="text-danger text-[13px] font-semibold">Position: flat motor current</div>}
            {teach && pos === "deep" && <div className="text-warn text-[13px]">Position: deep, inlet near the apex and mitral apparatus</div>}
            {teach && pos === "shallow" && <div className="text-warn text-[13px]">Position: shallow, inlet close to the valve leaflets</div>}
            {!stats?.suction && pos !== "ventricle" && pos !== "aorta" && <div className="text-good text-[13px]">No alarms</div>}
            {harms > 0 && <div className="text-[12px] text-ink-faint">Suction episodes: {harms}</div>}
          </div>
          <Goals goals={goals} done={done} showProgress={teach} />
          {done && <div className="panel p-3 text-[13px] text-ink-soft leading-relaxed animate-fadein">{ic.debrief}</div>}
        </div>
      </div>
    </div>
  );
}

/** `teach` shows the target depth: a guided aid, otherwise only once the case ends */
function PumpDiagram({ depth, teach }: { depth: number; teach: boolean }) {
  // valve plane at y=110; 1 cm = 22 px
  const yv = 110;
  const inletY = yv + depth * 22;
  const outletY = inletY - 4.8 * 22;
  return (
    <div className="panel">
      <div className="panel-head">
        <span>Echo / fluoroscopy view (schematic)</span>
        <span className="normal-case tracking-normal text-ink-faint">inlet {depth.toFixed(1)} cm below the valve</span>
      </div>
      <svg viewBox="0 0 760 270" className="w-full">
        <path d="M330,0 L330,90 C330,104 318,110 300,116" fill="none" stroke="#858D99" strokeWidth={2} />
        <path d="M430,0 L430,90 C430,104 444,110 462,116" fill="none" stroke="#858D99" strokeWidth={2} />
        <path d="M300,116 C230,150 240,250 360,262 C470,268 520,200 462,116" fill="rgba(200,80,90,0.08)" stroke="#858D99" strokeWidth={2} />
        <line x1={300} y1={116} x2={350} y2={124} stroke="#A6ADB8" strokeWidth={3} />
        <line x1={462} y1={116} x2={410} y2={124} stroke="#A6ADB8" strokeWidth={3} />
        <text x={470} y={118} fontSize={11} fill="#A6ADB8">
          aortic valve
        </text>
        <line x1={380} y1={0} x2={380} y2={Math.max(10, inletY)} stroke="#9aa9bd" strokeWidth={8} strokeLinecap="round" />
        <rect x={372} y={outletY - 12} width={16} height={24} rx={3} fill="#3b4a5e" stroke="#22d3ee" />
        <text x={396} y={outletY + 4} fontSize={11} fill="#22d3ee">
          outlet
        </text>
        <rect x={372} y={inletY - 18} width={16} height={22} rx={3} fill="#3b4a5e" stroke="#4CC38A" />
        <text x={396} y={inletY - 4} fontSize={11} fill="#4CC38A">
          inlet
        </text>
        <path d={`M380,${inletY + 4} c-2,18 12,26 20,18 c8,-8 -2,-18 -10,-12`} fill="none" stroke="#9aa9bd" strokeWidth={3} />
        {teach && (
          <>
            <line x1={250} y1={yv + 3.5 * 22} x2={300} y2={yv + 3.5 * 22} stroke="#E9B95A" strokeDasharray="3 3" />
            <text x={150} y={yv + 3.5 * 22 + 4} fontSize={11} fill="#E9B95A">
              target ≈ 3.5 cm
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
