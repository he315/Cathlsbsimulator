import { useReducer, type ReactNode } from "react";
import { IC_AGENTS, distalDelivery, icDosesOf, type IcAgent, type IcRoute } from "../../../simulation/pci/actions/drugs";
import { icSyringe, setIcSyringe } from "../inputBindings/flow";
import { labScreens } from "../../lab/visibility";
import { usePciSession, type PciConsoleMeta, type PciConsoleProps } from "./registry";

// ---------------------------------------------------------------------------
// The flow console (pci-flow-closure): the intracoronary drug syringe and the
// manifold, separate from the perforation console.
//
// Settings: the agent and the dose drawn up, and where the syringe is
// connected (the guide's manifold, or the hub of the microcatheter in the
// vessel). Read-outs: what the syringe holds and where it is connected,
// whether a microcatheter is out in the vessel and how far beyond the guide
// tip, the doses given so far (the learner's own record), and when the
// manifold was last checked. The hands act through the manifold syringe they
// already hold (src/ui/pci/inputBindings/flow.ts, device 'syringe'): with a
// dose drawn up the next push gives it and empties the syringe (the push after
// is contrast), a hard saline flush is the forceful injection, a pull draws
// back on the manifold and checks it; the console has no action button. Nothing here says
// what the flow is or why: the image shows it. Only in guided practice does the
// console add each manual's dose range with its source, as a teaching aid.
// ---------------------------------------------------------------------------

export const meta: PciConsoleMeta = { id: "flow", label: "Intracoronary drugs", order: 46 };

const SELECT = "bg-base-800 border border-line rounded px-1.5 py-0.5 text-[12px] text-ink font-mono";
const INPUT = "w-20 bg-base-800 border border-line rounded px-1.5 py-0.5 text-[12px] text-ink font-mono";
const AGENTS = Object.keys(IC_AGENTS) as IcAgent[];

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="stat-label">{label}</span>
      <span className="font-mono text-[12px] text-ink-soft">{children}</span>
    </div>
  );
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function FlowConsole({ session }: PciConsoleProps) {
  usePciSession(session);
  const st = session.st;
  // read on every render: a push of the hands gives the dose and empties the syringe
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const sy = icSyringe(session);
  const guided = labScreens(session.policy).teachingAids;
  const change = (p: Partial<typeof sy>) => {
    setIcSyringe(session, p);
    rerender();
  };
  const d = distalDelivery(session.g, st);
  const doses = icDosesOf(st).slice(-6).reverse();
  const checks = st.log.filter((r) => r.kind === "manifold-check");
  const lastCheck = checks.length ? checks[checks.length - 1].t : null;
  return (
    <div className="space-y-2 text-[13px]" aria-label="Intracoronary drugs">
      <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-ink-soft">
        <select className={SELECT} value={sy.agent ?? ""} onChange={(e) => change({ agent: (e.target.value || null) as IcAgent | null })} aria-label="Agent">
          <option value="">Agent…</option>
          {AGENTS.map((a) => (
            <option key={a} value={a}>
              {IC_AGENTS[a].label}
            </option>
          ))}
        </select>
        <input
          className={INPUT}
          type="number"
          min={0}
          step={10}
          value={sy.doseUg > 0 ? sy.doseUg : ""}
          placeholder="dose"
          onChange={(e) => change({ doseUg: Number(e.target.value) })}
          aria-label="Dose (micrograms)"
        />
        µg
        <select className={SELECT} value={sy.route} onChange={(e) => change({ route: e.target.value as IcRoute })} aria-label="Connected to">
          <option value="guide">guide manifold</option>
          <option value="microcatheter">microcatheter hub</option>
        </select>
      </div>
      <Row label="Syringe">{sy.agent && sy.doseUg > 0 ? `${IC_AGENTS[sy.agent].label} ${sy.doseUg} µg, on the ${sy.route === "guide" ? "guide manifold" : "microcatheter hub"}` : "nothing drawn up"}</Row>
      <Row label="Microcatheter">{d.ok ? `tip ${Math.round(d.tipMm)} mm beyond the guide tip` : st.wire.micro ? "in the guide" : "none on the wire"}</Row>
      <Row label="Manifold check">{lastCheck === null ? "not done" : `at ${clock(lastCheck)}`}</Row>
      {doses.length > 0 && (
        <div className="space-y-0.5">
          <div className="stat-label">Given</div>
          {doses.map((x, i) => (
            <div key={`${x.t}-${i}`} className="font-mono text-[12px] text-ink-soft">
              {clock(x.t)} {IC_AGENTS[x.agent].label} {Math.round(x.doseUg)} µg, {x.route === "guide" ? "guide" : "microcatheter"}
            </div>
          ))}
        </div>
      )}
      {guided && sy.agent && (
        <div className="text-[11px] text-ink-faint">
          Teaching aid: {IC_AGENTS[sy.agent].label}: Brilakis {IC_AGENTS[sy.agent].brilakis}; Oxford {IC_AGENTS[sy.agent].oxford} ({IC_AGENTS[sy.agent].source}). Typical doses; follow local protocol. Drug given into the guide refluxes when there is no antegrade flow.
        </div>
      )}
      <div className="text-[12px] text-ink-faint">With a dose drawn up, the next push on the manifold syringe (Inject) gives it by the connection set and empties the syringe; the push after is contrast. A hard saline push (Flush) is a forceful injection; drawing back (Aspirate) aspirates the guide and checks the manifold.</div>
    </div>
  );
}
