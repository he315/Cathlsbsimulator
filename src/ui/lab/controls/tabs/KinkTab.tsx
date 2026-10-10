import { useEffect, useState } from "react";
import type { ControlTab, ControlTabProps, LabControlsTarget } from "../types";
import { kinkControlFor, type KinkControl, type KinkHost, type KinkStep } from "../../../physics/physicsDevices";
import { DEFAULT_SHEATH_MM, LONG_SHEATH_MM } from "../../../../physics/engine";

// Shaft and kink (diag-catheter-kink): the prevention measures before engaging (the sheath in place,
// a catheter 1 Fr smaller than the sheath) and, once the whole catheter has been screened under
// fluoroscopy, the recovery steps of Brilakis's escalation (pm-engaging-torque, eq-sheaths-guides,
// Brilakis 5.7.4.1). The panel never says whether the shaft is kinked: each step reports what the
// operator would see or feel (the lab's image covers the chest only, so screening records that it was
// done and does not claim the shaft lower down was on the image). The steps are
// listed in the manual's order and recorded with their times for the debrief (KinkControl.score). The
// lab provides the controls as the 'kink' capability (the kink session module); a lab session that
// runs the rod mechanics without the module gets the same controls from its physics.

/** The controls for this target: the lab's 'kink' capability, else the session's own physics (duck-typed). */
export function kinkFor(target: LabControlsTarget): KinkControl | null {
  const cap = typeof target.capability === "function" ? target.capability("kink") : null;
  if (cap) return cap;
  const host = target as unknown as Partial<KinkHost>;
  if (host && "physics" in host && typeof host.wall === "function" && host.pedal) return kinkControlFor(host as KinkHost);
  return null;
}

const SHEATHS: readonly number[] = [DEFAULT_SHEATH_MM, ...LONG_SHEATH_MM];

/** The recovery steps in the manual's order, with their labels (generic device names). */
const RECOVERY: readonly { step: Exclude<KinkStep, "screen">; label: string; title: string; run: (k: KinkControl) => void }[] = [
  { step: "untwist", label: "Untwist", title: "Turn the hub gently back, against the way it was turned", run: (k) => k.untwist() },
  { step: "wire", label: "Pass a 0.035 in wire", title: "Advance a 0.035 in wire up the catheter through the shaft", run: (k) => k.passWire() },
  { step: "snare", label: "Snare the tip", title: "Hold the catheter tip with a snare from a second access", run: (k) => k.snare() },
  { step: "cuff", label: "Cuff on the upper arm", title: "Inflate a cuff around the upper arm to hold a catheter kinked below the brachial artery", run: (k) => k.cuff() },
  { step: "pressurise", label: "Pressurise the lumen, 3–4 atm", title: "An inflation device on the hub, inflated gently to 3–4 atm", run: (k) => k.pressurise() },
  { step: "cut-sheath", label: "Cut the hub, cover with a sheath", title: "Cut the catheter at the hub and advance a sheath of the same size or 1–2 Fr larger over it", run: (k) => k.cutAndSheath() },
  { step: "pull-out", label: "Bring it out", title: "Pull the kinked part out through the arteriotomy and keep the access with a wire", run: (k) => k.pullOut() },
];

const STEP_LABEL: Record<KinkStep, string> = {
  screen: "Screened the whole catheter",
  untwist: "Untwisted",
  wire: "Passed a 0.035 in wire",
  snare: "Snared the tip",
  cuff: "Cuff on the upper arm",
  pressurise: "Pressurised the lumen",
  "cut-sheath": "Cut the hub, sheath over it",
  "pull-out": "Brought it out",
};

function mmss(s: number): string {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

function Kink({ target, kit }: ControlTabProps) {
  const k = kinkFor(target);
  // the shaft moves without a click: a gentle refresh while the tab is open
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      k?.poll();
      setTick((t) => (t + 1) % 1e9);
    }, 300);
    return () => clearInterval(id);
  }, [k]);
  if (!k || !k.available()) return <div className="text-[13px] text-ink-faint">The shaft controls need the rod mechanics (Settings, catheter mechanics).</div>;
  const setup = k.setup();
  const { Seg } = kit;
  const now = k.host.wall();
  const refused = k.lastRefusalAt !== null && now - k.lastRefusalAt < 6;
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3">
      <div className="space-y-1">
        <div className="text-[12px] text-ink-faint">Before you turn</div>
        <Seg label="Sheath in place" value={setup.sheathMm} options={SHEATHS} onChange={(v) => k.setSheath(v)} fmt={(v) => `${v / 10} cm`} />
        <button className={`btn h-8 px-2 text-[13px] ${setup.undersized ? "!border-accent" : ""}`} onClick={() => k.setUndersized(!setup.undersized)} title="A catheter one French smaller than the sheath">
          {setup.undersized ? "Catheter 1 Fr smaller than the sheath" : "Catheter the sheath's size"}
        </button>
      </div>
      <div className="space-y-1">
        <div className="text-[12px] text-ink-faint">Shaft</div>
        <button className={`btn h-8 px-2 text-[13px] ${k.screened ? "!border-accent" : ""}`} onClick={() => k.screen()} disabled={!k.canScreen()} title="With fluoroscopy held, screen along the catheter from the sheath to the tip (the image here covers the chest only)">
          Screen the whole catheter
        </button>
        {!k.canScreen() && !k.screened && <div className="text-[12px] text-ink-faint">Hold fluoroscopy to screen.</div>}
        {refused && <div className="text-[12px] text-warn">The syringe will not push: the pressure is high.</div>}
      </div>
      {k.screened && (
        <div className="space-y-1">
          <div className="text-[12px] text-ink-faint">Recovery, in the manual's order</div>
          <div className="flex flex-wrap gap-1">
            {RECOVERY.map((r) => (
              <button key={r.step} className="btn h-8 px-2 text-[13px]" onClick={() => r.run(k)} title={r.title}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {k.steps.length > 0 && (
        <div className="min-w-[16rem] space-y-0.5">
          <div className="text-[12px] text-ink-faint">Steps</div>
          {k.steps.slice(-6).map((s, i) => (
            <div key={`${s.t}-${i}`} className="text-[12px]">
              <span className="font-mono text-ink-faint">{mmss(s.t)}</span> {STEP_LABEL[s.step]}
              {s.observed ? <span className="text-ink-faint">: {s.observed}</span> : <span className="text-ink-faint">…</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const tab: ControlTab = {
  id: "kink",
  label: "Shaft",
  order: 35,
  labs: ["diagnostic"],
  visible: (t: LabControlsTarget) => !!kinkFor(t)?.available(),
  Component: Kink,
};
