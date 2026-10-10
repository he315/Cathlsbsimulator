// Endovascular control from the opposite groin, and the cold leg (access-cx-endovascular-control): the controls
// over the session module 'endovascular' (src/simulation/session/modules/endovascular.ts), shown under the access
// fluoroscopy. The wire and the crossover catheter are driven with the hands on the image (AccessFluoroView sends
// the drags to the module while the crossover is in); here are the steps the hands do not do by dragging: the
// crossover catheter and the long sheath, the device position along the wire, the occlusion balloon, the
// angiogram and the selective injection, the device for the hole, and the leg (examine, name, image, treat).
// The right and wrong options sit side by side under generic device names; the results are what an examination or
// an image shows, never the injury or the cause; nothing here says whether a step was right (the ledger's, in the
// debrief).
import { useState } from "react";
import type { CaseSession } from "../../simulation/session/caseSession";
import {
  ANGIO_READING_LABEL,
  ENDO_DEVICE_LABEL,
  ENDO_SOURCED,
  LEG_CALL_LABEL,
  LEG_TREATMENT_LABEL,
  type AngioReading,
  type EndoDevice,
  type EndoTarget,
  type LegCall,
  type LegTreatment,
} from "../../simulation/access/endovascular";
import { endovascularOf } from "../../simulation/session/modules/endovascular";

export interface EndovascularPanelProps {
  session: CaseSession;
  act: <T>(fn: (s: CaseSession) => T) => T | undefined;
  /** "leg": only the leg's controls (examine, name, image, treat), for a workspace away from the image such as recovery */
  only?: "leg";
}

const DEVICES: readonly EndoDevice[] = ["covered-be", "covered-se", "bare-stent", "coils", "sealant", "prolonged-balloon", "surgery"];
const READINGS: readonly AngioReading[] = ["extravasation-large", "extravasation-branch", "flap", "cut-off", "normal"];
const CALLS: readonly LegCall[] = ["ali", "cholesterol", "normal"];
const LEG_TREATMENTS: readonly LegTreatment[] = ["se-stent", "angioplasty", "thrombectomy", "thrombolysis", "surgery", "supportive"];
const STEPS: readonly number[] = [-10, -2, 2, 10];

function Heading({ children }: { children: string }) {
  return <div className="text-[12px] font-medium text-ink-soft">{children}</div>;
}

export function EndovascularPanel({ session, act, only }: EndovascularPanelProps) {
  const [device, setDevice] = useState<EndoDevice>("covered-be");
  const [target, setTarget] = useState<EndoTarget>("main");
  const m = endovascularOf(session);
  if (!m || !m.actions.visible()) return null;
  const st = m.state;
  const c = st.cross;
  const busy = (what: string) => st.inProgress.some((p) => p.what === what);
  const results = st.results.slice(-4).reverse();
  const run = (f: (mm: NonNullable<ReturnType<typeof endovascularOf>>) => unknown) => act((s) => {
    const x = endovascularOf(s);
    return x ? f(x) : undefined;
  });

  return (
    <div className="flex flex-col gap-3 text-[13px]" data-endovascular onPointerDown={(e) => e.stopPropagation()}>
      {only && st.note && <span className="text-[12px] text-ink-faint">{st.note}</span>}
      {!only && (
        <div className="flex flex-wrap items-center gap-2">
          <button className={`btn leading-snug ${st.suspectedT !== null ? "border-accent" : ""}`} disabled={st.suspectedT !== null} onClick={() => run((x) => x.actions.suspect())} data-endo-suspect>
            {st.suspectedT !== null ? "Said: suspected iliofemoral bleed" : "Say it: suspected iliofemoral bleed"}
          </button>
          {st.note && <span className="text-[12px] text-ink-faint">{st.note}</span>}
        </div>
      )}

      {!only && (
        <div className="flex flex-col gap-1.5">
          <Heading>From the other groin</Heading>
          <div className="flex flex-wrap gap-1.5">
            <button className="btn" disabled={!!c} onClick={() => run((x) => x.actions.startCrossover("j"))} data-endo-cross="j">
              Crossover catheter, J wire
            </button>
            <button className="btn" disabled={!!c} onClick={() => run((x) => x.actions.startCrossover("hydrophilic"))} data-endo-cross="hydrophilic">
              Crossover catheter, hydrophilic wire
            </button>
            <button className="btn" disabled={!c || c.longSheath || busy("long-sheath")} onClick={() => run((x) => x.actions.longSheath())} data-endo-long-sheath>
              {c?.longSheath ? `${ENDO_SOURCED.crossoverSheathFr} Fr long sheath in` : `Exchange for a ${ENDO_SOURCED.crossoverSheathFr} Fr long crossover sheath`}
            </button>
          </div>
          <p className="text-[12px] text-ink-faint leading-snug">
            The other femoral artery is opened as another access site. With the crossover catheter in, the wire and catheter hands on the image drive them; bring the shaped tip up to the bifurcation and turn the wire over it.
          </p>
        </div>
      )}

      {!only && c && (
        <div className="flex flex-col gap-1.5">
          <Heading>Balloon and devices on the wire</Heading>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[12px] text-ink-faint">Move along the wire</span>
            {STEPS.map((mm) => (
              <button key={mm} className="btn" onClick={() => run((x) => x.actions.moveDevice(mm))} data-endo-move={mm}>
                {mm < 0 ? `back ${-mm} mm` : `on ${mm} mm`}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button className={`btn ${st.balloon.inflated === "low" ? "border-accent" : ""}`} onClick={() => run((x) => x.actions.inflate("low"))} data-endo-inflate="low">
              Balloon up, low pressure
            </button>
            <button className={`btn ${st.balloon.inflated === "high" ? "border-accent" : ""}`} onClick={() => run((x) => x.actions.inflate("high"))} data-endo-inflate="high">
              Balloon up, high pressure
            </button>
            <button className="btn btn-ghost" disabled={!st.balloon.inflated} onClick={() => run((x) => x.actions.deflate())} data-endo-deflate>
              Balloon down
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button className="btn" onClick={() => run((x) => x.actions.angiogram())} data-endo-angio>
              Angiogram through the crossover catheter
            </button>
            <button className="btn" disabled={!st.angios.length || busy("retrograde")} onClick={() => run((x) => x.actions.checkRetrograde())} data-endo-retrograde>
              Selective injection of a branch: retrograde filling?
            </button>
          </div>
          {st.angios.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-[12px] text-ink-soft">The angiogram shows</span>
              <div className="flex flex-wrap gap-1.5">
                {READINGS.map((r) => (
                  <button key={r} className={`btn leading-snug ${st.reading?.reading === r ? "border-accent" : ""}`} aria-pressed={st.reading?.reading === r} onClick={() => run((x) => x.actions.read(r))} data-endo-read={r}>
                    {ANGIO_READING_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            <select className="field" value={device} onChange={(e) => setDevice(e.target.value as EndoDevice)} aria-label="Device">
              {DEVICES.map((d) => (
                <option key={d} value={d}>
                  {ENDO_DEVICE_LABEL[d]}
                </option>
              ))}
            </select>
            <div className="seg">
              <button className={`seg-btn ${target === "main" ? "seg-btn-active" : ""}`} onClick={() => setTarget("main")}>
                In the artery
              </button>
              <button className={`seg-btn ${target === "branch" ? "seg-btn-active" : ""}`} onClick={() => setTarget("branch")}>
                Into the branch
              </button>
            </div>
            <button className="btn btn-accent" disabled={busy("seal")} onClick={() => run((x) => x.actions.deploy(device, target))} data-endo-deploy>
              Place it here
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Heading>The leg</Heading>
        <div className="flex flex-wrap gap-1.5">
          <button className="btn" onClick={() => run((x) => x.actions.examineLeg())} data-endo-leg-exam>
            Examine the leg
          </button>
          {CALLS.map((k) => (
            <button key={k} className={`btn leading-snug ${st.legCall?.call === k ? "border-accent" : ""}`} onClick={() => run((x) => x.actions.callLeg(k))} data-endo-leg-call={k}>
              {LEG_CALL_LABEL[k]}
            </button>
          ))}
          <button className="btn" onClick={() => run((x) => x.actions.legAngiography())} data-endo-leg-angio>
            Emergency angiography of the leg from the other groin
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {LEG_TREATMENTS.map((t) => (
            <button key={t} className="btn text-left leading-snug" disabled={busy("leg-treat")} onClick={() => run((x) => x.actions.treatLeg(t))} data-endo-leg-treat={t}>
              {LEG_TREATMENT_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {(results.length > 0 || st.inProgress.length > 0) && (
        <div className="flex flex-col gap-1">
          {st.inProgress.map((p, i) => (
            <div key={`p${i}`} className="text-[12px] text-ink-faint">
              {p.label}: under way
            </div>
          ))}
          {results.map((r, i) => (
            <div key={i} className="rounded-md border border-line px-2 py-1">
              <div className="text-[12px] text-ink-soft">{r.title}</div>
              <div className="text-[12px] text-ink leading-snug">{r.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
