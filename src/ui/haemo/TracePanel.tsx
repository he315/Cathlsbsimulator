// The pressure recorder of the haemodynamics lab (split from HaemoLab.tsx): the live trace of every
// chamber on a catheter or the arterial line, the recorder's read-out of each, and the Record
// button. The catheter controls sit in its footer (children). RecordedPressures is the table of what
// has been recorded in the current measurement set.
//
// Transducer chain (haemo-transducer-and-setup): with the study at hand, every channel goes through
// a Transducer carrying the study's set-up (level, zero, stopcock, line, air), stepped at a fixed
// internal step (CHAIN_DT_S) whatever the frame rate, so a throttled or hidden pane does not change
// the ringing; a fast flush rings on every channel; the read-out is displayedMeasure(). The set-up
// panel (SetupPanel) sits above the catheter controls: open for a set-up preset, collapsed (opened on
// request) for a study whose set-up was done before it began. The study and dispatch come as props,
// or, until the lab passes them, from the catheter controls given as children (they carry the same
// study). Without a study the recorder draws the true waveforms as before.
import { isValidElement, useEffect, useRef, useState, type ReactNode } from "react";
import { measure, sample, type Chamber, type HaemoScenario, type SampleOptions } from "../../simulation/haemo";
import { CHAIN_DT_S, displayedMeasure, setupDebrief, setupTransducer, studySetup, syncTransducer, type HaemoAction, type HaemoStudyState, type Recorded } from "../../simulation/haemoStudy";
import type { Transducer } from "../../simulation/patient/transducer";
import LiveTrace, { type TraceChannel } from "../sim/LiveTrace";
import SetupPanel from "./SetupPanel";

const CHAMBER_COLORS: Record<Chamber, string> = {
  RA: "#a78bfa",
  RV: "#22d3ee",
  PA: "#f59e0b",
  PCWP: "#facc15",
  LV: "#3ef2a4",
  Ao: "#ff5d6c",
};
/**
 * The line channel shown during set-up before any catheter is in takes the monitor's spo2 trace token
 * (tailwind.config.js), read from a hidden swatch at mount; this is the fallback where no computed
 * style exists (server rendering, tests).
 */
const LINE_COLOR_FALLBACK = "rgb(79, 214, 238)";

/** A channel's transducer, its line dynamics (recomputed when the set-up changes) and where its clock has got to. */
interface Chain {
  tr: Transducer;
  dyn: { wn: number; zeta: number };
  t: number | null;
  y: number;
}
/** A gap in the trace clock longer than this (a hidden pane) restarts the chain this long before now, s. */
const CHAIN_MAX_GAP_S = 2;
const CHAIN_RESTART_S = 1;

/** The study and dispatch, from the props or from the catheter controls passed as children. */
function studyOf(props: Pick<TracePanelProps, "study" | "dispatch" | "children">): { study: HaemoStudyState; dispatch: (a: HaemoAction) => void } | null {
  if (props.study && props.dispatch) return { study: props.study, dispatch: props.dispatch };
  const c = props.children;
  if (!isValidElement(c)) return null;
  const p = c.props as { study?: Partial<HaemoStudyState>; dispatch?: (a: HaemoAction) => void };
  const st = p.study;
  if (!st || typeof p.dispatch !== "function" || st.scenarioId === undefined || st.sets === undefined || st.raised === undefined) return null;
  return { study: st as HaemoStudyState, dispatch: p.dispatch };
}

/** Advance a chain to time t at the fixed internal step and return the displayed pressure. */
function chainAt(ch: Chain, t: number, pTip: (t: number) => number): number {
  if (ch.t === null || t - ch.t > CHAIN_MAX_GAP_S || t < ch.t - CHAIN_MAX_GAP_S) {
    ch.t = t - CHAIN_RESTART_S;
    ch.tr.st.x = ch.tr.st.openToAir ? 0 : pTip(ch.t) + ch.tr.hydrostatic();
    ch.tr.st.v = 0;
    ch.y = ch.tr.st.x + ch.tr.st.drift - ch.tr.st.zeroRef;
  }
  const { wn, zeta } = ch.dyn;
  while (ch.t + CHAIN_DT_S <= t) {
    ch.t += CHAIN_DT_S;
    ch.y = ch.tr.stepWith(CHAIN_DT_S, pTip(ch.t), wn, zeta);
  }
  return ch.y;
}

export interface TracePanelProps {
  /** the scenario as measured in the current set */
  scenario: HaemoScenario;
  shown: Chamber[];
  resp: boolean;
  pvc: boolean;
  onRecord: () => void;
  /** the catheter controls */
  children?: ReactNode;
  /** the study and its dispatch: the traces go through its transducer set-up and the set-up panel shows */
  study?: HaemoStudyState;
  dispatch?: (a: HaemoAction) => void;
}

export default function TracePanel(props: TracePanelProps) {
  const { scenario: s, shown, resp, pvc, onRecord, children } = props;
  const ctx = studyOf(props);
  const study = ctx?.study ?? null;
  const su = study ? studySetup(study) : null;
  // the recorder's read-out of each chamber on screen, once per render
  const reads = new Map(shown.map((c) => [c, study ? displayedMeasure(study, c) : measure(s, c)] as const));
  const read = (c: Chamber) => reads.get(c) ?? (study ? displayedMeasure(study, c) : measure(s, c));
  const leftShown = shown.some((c) => c === "LV" || c === "Ao");
  const maxSys = Math.max(30, ...shown.map((c) => Math.max(measure(s, c).sys, read(c).sys)));
  const top = leftShown ? Math.ceil((maxSys * 1.12) / 20) * 20 : maxSys > 45 ? Math.ceil((maxSys * 1.15) / 10) * 10 : 40;
  const opt: SampleOptions = { respiration: resp, pvc };

  // one transducer chain per channel, kept across renders and brought in line with the set-up
  const chains = useRef(new Map<string, Chain>());
  const chainFor = (key: string): Chain => {
    let ch = chains.current.get(key);
    if (!ch) {
      const tr = setupTransducer(su!);
      chains.current.set(key, (ch = { tr, dyn: tr.dynamics(), t: null, y: 0 }));
    }
    return ch;
  };
  if (su)
    for (const ch of chains.current.values()) {
      syncTransducer(ch.tr, su);
      ch.dyn = ch.tr.dynamics();
    }
  // the line channel's colour from the Clinical Graphite token
  const swatch = useRef<HTMLSpanElement>(null);
  const [lineColor, setLineColor] = useState(LINE_COLOR_FALLBACK);
  useEffect(() => {
    const el = swatch.current;
    if (!el || typeof getComputedStyle !== "function") return;
    const c = getComputedStyle(el).color;
    if (c && c !== "rgba(0, 0, 0, 0)") setLineColor(c);
  }, []);
  // a fast flush rings on every channel
  const flushes = su?.flushes ?? 0;
  const lastFlushes = useRef(flushes);
  useEffect(() => {
    if (flushes > lastFlushes.current) for (const ch of chains.current.values()) ch.tr.fastFlush();
    lastFlushes.current = flushes;
  }, [flushes]);

  // before any catheter, a set-up preset shows the line itself so that zeroing and flushing can be seen
  const lineOnly = !!su?.preset && shown.length === 0;
  const channels: TraceChannel[] = su
    ? lineOnly
      ? [{ fn: (t: number) => chainAt(chainFor("line"), t, () => 0), color: lineColor, label: "line", width: 2 }]
      : shown.map((c) => ({
          fn: (t: number) => chainAt(chainFor(c), t, (tt) => sample(s, c, tt, opt)),
          color: CHAMBER_COLORS[c],
          label: c,
          width: 2,
        }))
    : shown.map((c) => ({
        fn: (t: number) => sample(s, c, t, opt),
        color: CHAMBER_COLORS[c],
        label: c,
        width: 2,
      }));

  return (
    <div className="panel overflow-hidden">
      <div className="panel-head">
        <span>Pressure recorder</span>
        <span className="font-mono normal-case tracking-normal text-ink-faint">
          0–{top} mmHg · {resp ? "breathing" : "held at end-expiration"}
        </span>
      </div>
      <span ref={swatch} className="text-spo2 hidden" aria-hidden="true" />
      <div className="p-2 monitor">
        {channels.length === 0 ? (
          <div className="h-[230px] grid place-items-center text-ink-faint text-sm">Insert the right heart catheter or pass a pigtail to the aortic root to start recording.</div>
        ) : (
          <LiveTrace channels={channels} min={0} max={top} height={230} seconds={6} />
        )}
      </div>
      {ctx && (
        <div className="p-3 border-t border-line">
          {su?.preset ? <SetupPanel study={ctx.study} dispatch={ctx.dispatch} disabled={ctx.study.answer !== null} /> : <PreparedSetup study={ctx.study} dispatch={ctx.dispatch} />}
        </div>
      )}
      <div className="p-3 border-t border-line grid md:grid-cols-2 gap-3">
        {children}
        <div className="md:col-span-2 flex flex-wrap items-center gap-2 justify-end">
          {shown.map((c) => {
            const m = read(c);
            return (
              <span key={c} className="chip font-mono" style={{ color: CHAMBER_COLORS[c] }}>
                {c}{" "}
                {c === "RA" || c === "PCWP" ? `a${m.a} v${m.v} m${m.mean}` : c === "LV" || c === "RV" ? `${m.sys}/${m.edp}` : `${m.sys}/${m.dia} (${m.mean})`}
              </span>
            );
          })}
          <button className="btn btn-good" disabled={shown.length === 0} onClick={onRecord}>
            Record
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * A study whose transducer was set up before it began: the set-up panel stays collapsed until the
 * learner opens it (its controls can then be used as in a set-up preset). It opens by itself in the
 * debrief when a pressure was recorded through a set-up fault.
 */
function PreparedSetup({ study, dispatch }: { study: HaemoStudyState; dispatch: (a: HaemoAction) => void }) {
  const [open, setOpen] = useState(false);
  const forced = study.answer !== null && setupDebrief(study).some((r) => r.faults.length > 0);
  const shown = open || forced;
  return (
    <details open={shown} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary className="cursor-pointer text-[13px] text-ink-soft">Transducer and manifold: set up before the study (open to check or change)</summary>
      {shown && (
        <div className="pt-2">
          <SetupPanel study={study} dispatch={dispatch} disabled={study.answer !== null} />
        </div>
      )}
    </details>
  );
}

/** The pressures recorded in the current measurement set, with the simultaneous recordings and the gradients read off them. */
export function RecordedPressures({ rec, title = "Recorded pressures (mmHg)" }: { rec: Recorded; title?: string }) {
  const r = rec.chambers;
  return (
    <div className="panel">
      <div className="panel-head">{title}</div>
      <table className="w-full text-[13px] font-mono">
        <tbody>
          {(["RA", "RV", "PA", "PCWP", "LV", "Ao"] as Chamber[]).map((c) => {
            const m = r[c];
            return (
              <tr key={c} className="border-b border-line/50">
                <td className="px-3 py-1.5" style={{ color: CHAMBER_COLORS[c] }}>
                  {c === "PCWP" ? "Wedge" : c}
                </td>
                <td className="px-3 py-1.5 text-right text-ink">
                  {!m
                    ? "—"
                    : c === "RA" || c === "PCWP"
                      ? `a ${m.a} · v ${m.v} · mean ${m.mean}`
                      : c === "LV" || c === "RV"
                        ? `${m.sys} / ${m.dia} · EDP ${m.edp}`
                        : `${m.sys} / ${m.dia} · mean ${m.mean}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-1.5 p-2">
        {rec.simLVAo && <span className="chip text-good">LV + Ao simultaneous{rec.aorticMeanGradient !== undefined ? ` · mean gradient ${rec.aorticMeanGradient} mmHg` : ""}</span>}
        {rec.simLVW && <span className="chip text-good">LV + wedge simultaneous{rec.mitralMeanGradient !== undefined ? ` · mean gradient ${rec.mitralMeanGradient} mmHg` : ""}</span>}
        {rec.simLVRVResp && <span className="chip text-good">LV + RV with respiration</span>}
      </div>
    </div>
  );
}
