import { useEffect, useState } from "react";
import type { ControlTab, ControlTabProps, LabControlsTarget } from "../types";
import { leftHeartOf, type LeftHeartControl, type LeftHeartStep, type LvPosition } from "../../../sim/modules/leftHeart";
import { MP_POWER_INJECTOR } from "../../../../simulation/powerInjector";
import type { HeartFrame } from "../../../../render/xray/heart";
import LvGramReader from "../../LvGramReader";

// Left heart (diag-lv-aorta-task): the left heart task (ventriculogram or aortogram), the LVEDP the
// haemodynamic system marks on the LV trace, the power injector (settings, the module text's presets,
// the air check, arming, the stop), the hand test injection, the pullback, the moves for a caught
// pigtail and the iliofemoral station, the attending's question before crossing a stenotic valve, the
// management of the complications, and the ventriculogram reader. The lab provides it as the
// 'leftHeart' capability (src/ui/sim/modules/leftHeart.ts). Each action reports what the operator would
// see; where the tip sits is shown only as a guided aid; the score is the debrief's. The tab shows while
// the left heart is in play (LeftHeartControl.inPlay: a left heart scenario, a pigtail, a task, the
// ventricle entered), so a coronary study's strip is unchanged.

/** The controls for this target: the lab's 'leftHeart' capability. */
export function leftHeartFor(target: LabControlsTarget): LeftHeartControl | null {
  return leftHeartOf(target as unknown as { capability?: (k: "leftHeart") => LeftHeartControl | null });
}

const POSITION_LABEL: Record<LvPosition, string> = {
  "mid-cavity": "Mid-cavity",
  outflow: "Outflow tract",
  apex: "Apex",
  mitral: "On the mitral apparatus",
  papillary: "Papillary region",
  wall: "Against the wall",
  leaflets: "On the leaflets",
  root: "Aortic root",
  ascending: "Ascending aorta",
  other: "Elsewhere",
};

const STEP_LABEL: Partial<Record<LeftHeartStep, string>> = {
  lvedp: "LVEDP",
  purge: "Air check",
  arm: "Arm",
  settings: "Settings",
  fire: "Injector",
  "stop-injection": "Stop",
  "stopped-by-attending": "Attending",
  "test-injection": "Test injection",
  pullback: "Pullback",
  "pullback-start": "Pullback",
  "free-entrapment": "Catheter",
  "crossing-question": "Attending",
  "crossing-answer": "Crossing",
  cross: "Valve",
  "cross-failed": "Valve",
  "iliac-station": "Station",
  echo: "Echo",
  pericardiocentesis: "Pericardiocentesis",
  drain: "Drain",
  "heparin-review": "Anticoagulation",
  removed: "Catheter",
  reading: "Reader",
  patient: "Patient",
};

function mmss(s: number): string {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

function Num({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-1 text-[13px]">
      <span className="text-ink-faint">{label}</span>
      <input
        type="number"
        className="field h-8 w-[4.5rem] text-[13px]"
        aria-label={label}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
      />
      <span className="text-ink-faint">{unit}</span>
    </label>
  );
}

function LeftHeart({ target, kit }: ControlTabProps) {
  const lh = leftHeartFor(target);
  const [, setTick] = useState(0);
  const [reader, setReader] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 1e9), 300);
    return () => clearInterval(id);
  }, []);
  if (!lh) return <div className="text-[13px] text-ink-faint">No left heart controls in this lab.</div>;
  const { Seg } = kit;
  const task = lh.task();
  const s = lh.injector.settings;
  const L = MP_POWER_INJECTOR;
  const inj = lh.injector;
  const aid = lh.positionAid();
  const heart = (lh.host.tree as { heart?: HeartFrame }).heart;
  const asking = lh.crossQuestion.asked && lh.crossQuestion.answer === null;
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3" data-tab="left-heart">
      <div className="space-y-1">
        <div className="text-[12px] text-ink-faint">Task</div>
        <Seg<"none" | "ventriculogram" | "aortogram">
          label="Left heart task"
          value={task ?? "none"}
          options={["none", "ventriculogram", "aortogram"]}
          fmt={(v) => (v === "none" ? "None" : v === "ventriculogram" ? "Ventriculogram" : "Aortogram")}
          onChange={(v) => lh.setTask(v === "none" ? null : v)}
        />
        {aid && <div className="chip text-[12px]">Tip: {POSITION_LABEL[aid]}</div>}
      </div>

      <div className="space-y-1">
        <div className="text-[12px] text-ink-faint">Pressure</div>
        <div className="flex flex-wrap gap-1">
          <button className="btn h-8 px-2 text-[13px]" onClick={() => lh.recordLvedp()} title="The haemodynamic system marks the end-diastolic pressure after the a wave on the LV trace">
            Record LVEDP
          </button>
          <button className={`btn h-8 px-2 text-[13px] ${lh.pullbackRecording ? "!border-accent" : ""}`} onClick={() => lh.startPullback()} title="Pull back from the ventricle to the aorta with the pressure recording, the sheath side arm on the second line">
            Record pullback
          </button>
        </div>
        {lh.lvedp !== null && <div className="text-[12px]">LVEDP {lh.lvedp} mmHg</div>}
      </div>

      <div className="space-y-1">
        <div className="text-[12px] text-ink-faint">Power injector</div>
        <div className="flex flex-wrap gap-2">
          <Num label="Volume" value={s.volumeMl} min={L.volumeMl.min} max={L.volumeMl.max} step={1} unit="mL" onChange={(v) => lh.setInjector({ volumeMl: v })} />
          <Num label="Rate" value={s.rateMlS} min={L.rateMlS.min} max={L.rateMlS.max} step={1} unit="mL/s" onChange={(v) => lh.setInjector({ rateMlS: v })} />
          <Num label="Rise" value={s.riseS} min={L.riseS.min} max={L.riseS.max} step={0.1} unit="s" onChange={(v) => lh.setInjector({ riseS: v })} />
          <Num label="Limit" value={s.pressureLimitPsi} min={L.pressureLimitPsi.min} max={L.pressureLimitPsi.max} step={50} unit="psi" onChange={(v) => lh.setInjector({ pressureLimitPsi: v })} />
        </div>
        <div className="flex flex-wrap gap-1">
          {lh.presets().map((p) => (
            <button key={p.id} className="btn h-7 px-2 text-[12px]" onClick={() => lh.setInjector(p.settings)}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <button className="btn h-8 px-2 text-[13px]" onClick={() => lh.purge()} disabled={inj.state === "firing"} title="Expel the air from the reservoir and connect wet, contrast running from the line">
            Air check and connect
          </button>
          {inj.armed ? (
            <button className="btn h-8 px-2 text-[13px] !border-accent" onClick={() => lh.disarm()}>
              Disarm
            </button>
          ) : (
            <button className="btn h-8 px-2 text-[13px]" onClick={() => lh.arm()} disabled={inj.state === "firing"}>
              Arm
            </button>
          )}
          {inj.state === "firing" && (
            <button className="btn btn-danger h-8 px-2 text-[13px]" onClick={() => lh.stopInjection()}>
              Stop injection
            </button>
          )}
          <span className="text-[12px] text-ink-faint">{inj.state === "armed" ? "Armed: the cine pedal fires it." : inj.state === "firing" ? "Injecting." : inj.state === "purged" ? "Connected, air checked." : "Not armed."}</span>
        </div>
        <button className="btn h-8 px-2 text-[13px]" onClick={() => lh.testInjection()} title="Push the 10 mL syringe by hand through the catheter to see where the contrast goes">
          Hand test injection, 10 mL
        </button>
      </div>

      <div className="space-y-1">
        <div className="text-[12px] text-ink-faint">Catheter</div>
        <div className="flex flex-wrap gap-1">
          <button className="btn h-8 px-2 text-[13px]" onClick={() => lh.rotateAndWithdraw()} title="Rotate the hub gently and withdraw a little">
            Rotate gently and withdraw
          </button>
          <button className={`btn h-8 px-2 text-[13px] ${lh.iliacStation ? "!border-accent" : ""}`} onClick={() => lh.setIliacStation(!lh.iliacStation)} title="Pull the pigtail back to just above the aortic bifurcation for the iliofemoral run">
            {lh.iliacStation ? "Back to the root" : "Above the bifurcation"}
          </button>
        </div>
        {asking && (
          <div className="space-y-1" data-crossing-question>
            <div className="text-[12px]">Attending: is crossing this valve indicated?</div>
            <div className="flex gap-1">
              <button className="btn h-8 px-2 text-[13px]" onClick={() => lh.answerCrossing(true)}>
                Yes, cross the valve
              </button>
              <button className="btn h-8 px-2 text-[13px]" onClick={() => lh.answerCrossing(false)}>
                No, do not cross
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-[12px] text-ink-faint">If the patient deteriorates</div>
        <div className="flex max-w-[26rem] flex-wrap gap-1">
          <button className="btn h-7 px-2 text-[12px]" onClick={() => lh.echo()}>Echo</button>
          <button className="btn h-7 px-2 text-[12px]" onClick={() => lh.pericardiocentesis()}>Pericardiocentesis</button>
          <button className="btn h-7 px-2 text-[12px]" onClick={() => lh.leaveDrain()}>Leave a drain</button>
          <button className="btn h-7 px-2 text-[12px]" onClick={() => lh.reviewHeparin()}>Review anticoagulation</button>
          <button className="btn h-7 px-2 text-[12px]" onClick={() => lh.oxygen()}>High-flow oxygen</button>
          <button className="btn h-7 px-2 text-[12px]" onClick={() => lh.sitUp()}>Sit up</button>
          <button className="btn h-7 px-2 text-[12px]" onClick={() => lh.diuretic()}>IV loop diuretic</button>
          <button className="btn h-7 px-2 text-[12px]" onClick={() => lh.nitrate()}>IV nitrate</button>
          <button className="btn h-7 px-2 text-[12px]" onClick={() => lh.cpap()}>CPAP</button>
          <button className="btn h-7 px-2 text-[12px]" onClick={() => lh.considerIabp()}>Consider balloon pump</button>
          <button className="btn h-7 px-2 text-[12px]" onClick={() => lh.admit()}>Admit</button>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[12px] text-ink-faint">Reader</div>
        <button className={`btn h-8 px-2 text-[13px] ${reader ? "!border-accent" : ""}`} onClick={() => setReader(!reader)} disabled={!lh.readableRuns().length}>
          {reader ? "Hide the reader" : "Read the run"}
        </button>
      </div>

      {reader && heart && (
        <div className="w-full">
          <LvGramReader lh={lh} heart={heart} onClose={() => setReader(false)} />
        </div>
      )}

      {lh.steps.length > 0 && (
        <div className="min-w-[16rem] space-y-0.5">
          <div className="text-[12px] text-ink-faint">Steps</div>
          {lh.steps.slice(-6).map((x, i) => (
            <div key={`${x.t}-${i}`} className="text-[12px]">
              <span className="font-mono text-ink-faint">{mmss(x.t)}</span> {STEP_LABEL[x.step] ?? ""}
              <span className="text-ink-faint">{STEP_LABEL[x.step] ? ": " : ""}{x.observed}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const tab: ControlTab = {
  id: "left-heart",
  label: "Left heart",
  order: 37,
  labs: ["diagnostic"],
  visible: (t: LabControlsTarget) => !!leftHeartFor(t)?.inPlay(),
  Component: LeftHeart,
};
