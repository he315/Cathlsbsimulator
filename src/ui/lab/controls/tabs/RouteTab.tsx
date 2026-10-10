import { useEffect, useState } from "react";
import type { ControlTab, ControlTabProps, LabControlsTarget } from "../types";
import type { RouteControl, RouteStep } from "../../../sim/modules/route";

// Route (diag-route-wire-led-radial): from the sheath to the root with the hands. The wire in the
// catheter (the 0.035 in J leads it; the narrow-J, hydrophilic and 0.014 in wires for a difficult
// segment; the straight wire; the 260 and 300 cm wires for exchanges), Brilakis's resistance algorithm
// as actions (transduce the side arm, puff through the side arm or the catheter from just below the
// resistance, another wire with the catheter close behind, balloon-assisted tracking), the question
// whether a straightened loop's narrowings are disease, and, once the wire is out, the wet connection
// (aspirate, connect while the manifold drips, draw back and discard, fill to the tip). The table can
// follow the wire along the limb. The panel never says where the tip is or what is wrong: each action
// reports what the operator saw or did. The lab provides the controls as the 'route' capability
// (src/ui/sim/modules/route.ts).

/** The controls for this target, or null. */
export function routeFor(target: LabControlsTarget): RouteControl | null {
  return typeof target.capability === "function" ? target.capability("route") : null;
}

/** The balloon pressures offered for balloon-assisted tracking (atm). The panel does not mark a right one. */
const BAT_ATM: readonly number[] = [2, 3, 4, 5, 6, 8, 10];

const STEP_LABEL: Record<RouteStep, string> = {
  transduce: "Transduced the side arm",
  "puff-sheath": "Puff through the side arm",
  "puff-catheter": "Puff through the catheter",
  image: "On the image",
  wire: "Wire",
  "remove-wire": "Wire out",
  aspirate: "Aspirated",
  "connect-wet": "Connected wet",
  "connect-dry": "Connected",
  "draw-back": "Drew back",
  fill: "Contrast",
  "inject-refused": "Injection",
  bat: "Balloon-assisted tracking",
  "bat-off": "Balloon down",
  answer: "Narrowings",
  station: "Table",
};

function mmss(s: number): string {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

function Route({ target, kit }: ControlTabProps) {
  const rc = routeFor(target);
  // the wire and the catheter move without a click: a gentle refresh while the tab is open
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 1e9), 400);
    return () => clearInterval(id);
  }, []);
  const [atm, setAtm] = useState(4);
  if (!rc) return null;
  if (!rc.available()) return <MechanicsOff rc={rc} />;
  const { Seg } = kit;
  const wire = rc.wireId();
  const conn = rc.connection;
  const g = rc.route3D();
  const stations = ["auto", ...(g?.stations.map((s) => s.id) ?? [])];
  const stationLabel = (id: string) => (id === "auto" ? "Follow the wire" : g?.stations.find((s) => s.id === id)?.label ?? id);
  const bat = rc.host.physics?.bat ?? null;
  const open = conn === "open" || conn === "aspirated";
  const connected = conn === "connected" || conn === "drawn-back";
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3">
      <div className="space-y-1 max-w-[24rem]">
        <div className="text-[12px] text-ink-faint">Wire</div>
        <div className="flex flex-wrap gap-1">
          {rc.wires().map((w) => (
            <button key={w.id} className={`btn h-8 px-2 text-[13px] ${wire === w.id ? "!border-accent" : ""}`} onClick={() => rc.chooseWire(w.id)} title={`Put the ${w.label} into the catheter`}>
              {w.label}
            </button>
          ))}
        </div>
        <button className="btn h-8 px-2 text-[13px]" onClick={() => rc.removeWire()} disabled={wire === null} title="Pull the wire out through the catheter hub">
          Take the wire out
        </button>
      </div>

      <div className="space-y-1">
        <div className="text-[12px] text-ink-faint">Resistance</div>
        <div className="flex flex-wrap gap-1">
          <button className="btn h-8 px-2 text-[13px]" onClick={() => rc.transduceSideArm()} title="Connect the sheath's side arm to the transducer">
            Transduce the side arm
          </button>
          <button className="btn h-8 px-2 text-[13px]" onClick={() => rc.puff("sheath")} title="A puff of contrast through the sheath's side arm (hold fluoroscopy to see it)">
            Puff through the side arm
          </button>
          <button className="btn h-8 px-2 text-[13px]" onClick={() => rc.puff("catheter")} disabled={wire !== null} title="A puff of contrast through the catheter (the wire out; hold fluoroscopy to see it)">
            Puff through the catheter
          </button>
        </div>
        <div className="text-[12px] text-ink-faint">Balloon-assisted tracking</div>
        <div className="flex flex-wrap items-center gap-1">
          <Seg label="Balloon pressure" value={atm} options={BAT_ATM} onChange={(v) => setAtm(v)} fmt={(v) => `${v} atm`} />
          {bat ? (
            <button className="btn h-8 px-2 text-[13px] !border-accent" onClick={() => rc.setBat(null)} title="Deflate the balloon and bring it back into the catheter">
              Deflate ({bat.atm} atm)
            </button>
          ) : (
            <button className="btn h-8 px-2 text-[13px]" onClick={() => rc.setBat(atm)} title="A compliant balloon matched to the catheter, half out of its tip, on the wire">
              Inflate half out of the tip
            </button>
          )}
        </div>
        {rc.pseudolesionAsked && (
          <div className="space-y-1">
            <div className="text-[12px] text-ink-faint">The narrowings in the straightened segment</div>
            <div className="flex gap-1">
              <button className={`btn h-8 px-2 text-[13px] ${rc.pseudolesionAnswer === "disease" ? "!border-accent" : ""}`} onClick={() => rc.answerPseudolesion("disease")}>
                Disease
              </button>
              <button className={`btn h-8 px-2 text-[13px] ${rc.pseudolesionAnswer === "pseudolesion" ? "!border-accent" : ""}`} onClick={() => rc.answerPseudolesion("pseudolesion")}>
                Pseudolesions
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-[12px] text-ink-faint">Catheter hub</div>
        <div className="flex flex-wrap gap-1">
          <button className="btn h-8 px-2 text-[13px]" onClick={() => rc.aspirate()} disabled={!open} title="Draw back 2–3 mL from the catheter and discard it onto the gauze">
            Aspirate 2–3 mL
          </button>
          <button className="btn h-8 px-2 text-[13px]" onClick={() => rc.connect(true)} disabled={!open} title="Connect the manifold to the hub while saline drips from it">
            Connect while the manifold drips
          </button>
          <button className="btn h-8 px-2 text-[13px]" onClick={() => rc.connect(false)} disabled={!open} title="Connect the manifold to the hub">
            Connect
          </button>
          <button className="btn h-8 px-2 text-[13px]" onClick={() => rc.drawBack()} disabled={!connected} title="Draw back into the manifold syringe and discard what comes">
            Draw back and discard
          </button>
          <button className="btn h-8 px-2 text-[13px]" onClick={() => rc.fillToTip()} disabled={!connected} title="Fill the catheter with contrast to its tip">
            Fill to the tip
          </button>
        </div>
        <div className="text-[12px] text-ink-faint">Table</div>
        <Seg label="Station" value={rc.station} options={stations} onChange={(v) => rc.setStation(v)} fmt={stationLabel} />
      </div>

      {rc.steps.length > 0 && (
        <div className="min-w-[16rem] space-y-0.5">
          <div className="text-[12px] text-ink-faint">Steps</div>
          {rc.steps.slice(-6).map((s, i) => (
            <div key={`${s.t}-${i}`} className="text-[12px]">
              <span className="font-mono text-ink-faint">{mmss(s.t)}</span> {STEP_LABEL[s.step]}
              <span className="text-ink-faint">: {s.observed}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * A case that opens at the sheath while the rod mechanics is off: the route exists only in the rod
 * mechanics, so the lab opened at the root. The panel says so, with the reason, and offers the switch.
 */
function MechanicsOff({ rc }: { rc: RouteControl }) {
  const off = rc.mechanicsOff();
  return (
    <div className="max-w-[36rem] space-y-2">
      <div className="notice notice-warn text-[13px]" role="status">
        This case starts at the sheath, and the route from the sheath to the root needs the rod mechanics. The lab is using the simple model, so the
        catheter starts at the aortic root instead.{off?.reason ? ` ${off.reason}` : ""}
      </div>
      {off?.canSwitch ? (
        <button className="btn h-8 px-2 text-[13px]" onClick={() => rc.useRodMechanics()} title="Choose the rod mechanics in Settings and open this case again from the sheath">
          Use the rod mechanics and start the case again
        </button>
      ) : (
        <div className="text-[12px] text-ink-faint">The rod mechanics cannot run here (Settings, catheter mechanics).</div>
      )}
    </div>
  );
}

export const tab: ControlTab = {
  id: "route",
  label: "Route",
  order: 33,
  labs: ["diagnostic"],
  // a case that opens at the sheath (startAt 'sheath'); a study from the root keeps the lab's usual tabs.
  // With the rod mechanics off the tab stays, to say why the case opened at the root.
  visible: (t: LabControlsTarget) => {
    const rc = routeFor(t);
    if (!rc) return false;
    return rc.available() ? rc.startAt === "sheath" : rc.mechanicsOff() !== null;
  },
  Component: Route,
};
