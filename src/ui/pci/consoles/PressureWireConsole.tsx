import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { PciScenario } from "../../../simulation/pci/state";
import { setWireKind } from "../../../simulation/pci/actions/wire";
import {
  pressureDriftCheck,
  pressureView,
  pwCheckConnections,
  pwCoregistered,
  pwFlushGuide,
  pwGiveIcAdenosine,
  pwRemoveIntroducer,
  pwSetupOf,
  pwRouteFrame,
  pwStartIvAdenosine,
  pwStopAdenosine,
  recordPressure,
  setPullbackRecording,
} from "../../../simulation/pci/actions/pressure";
import { SENSOR_FROM_TIP_MM, sensorX, type PwLabSetup, type StoredFrame } from "../../../simulation/pci/pressureWire";
import { IC_ADENOSINE_LEGACY_UG, IC_ADENOSINE_MAXIMAL_UG, IV_ADENOSINE_UG_KG_MIN, PW_IV_SITES, type PwIvSite } from "../../../simulation/pci/pwSession";
import { CUTOFF } from "../../../simulation/physiology";
import { useSeriesStore, type StoredSeries } from "../../../state/useSeriesStore";
import PullbackPlot from "../../physiology/PullbackPlot";
import VesselStrip from "../../physiology/VesselStrip";
import {
  aorticLineOf,
  applyPressureAction,
  applyPressureFollowUp,
  equaliseInSession,
  flushAorticLineInSession,
  storedFrameIndex,
  storedRunFor,
  storedRunPlace,
  withAorticLine,
  zeroTransducerInSession,
} from "../inputBindings/pressureWire";
import { usePciSession, type PciConsoleMeta, type PciConsoleProps } from "./registry";

// ---------------------------------------------------------------------------
// The pressure-wire console of the PCI lab (pci-pressure-wire-console): the
// same pressure-wire front end as the physiology lab (its pullback plot and,
// as a guided aid, its vessel strip), on the PCI lab's own anatomy.
//
// Read-outs: Pa, Pd, Pd/Pa and the wave-free ratio as the console computes
// them at the sensor; what has been given for hyperaemia and for how long;
// the recorded measurements; the pullback curve; and the pullback and the
// sensor co-registered on the stored angiogram (the run the pullback was
// recorded against, else the last cine run: its image, with the samples and
// the sensor placed on it by the camera that rendered it). Settings and
// console steps: exchange for the pressure wire,
// take the introducer out, flush the guide, ask the team to flush the aortic
// line, zero and level the transducer or check its connections, equalise,
// IC adenosine (dose) or IV adenosine (rate, vein) through the team, record,
// start and stop the pullback recording, the drift check. The hands move the
// wire (src/ui/pci/inputBindings/pressureWire.ts): advancing and pulling
// back, which also draws the pullback, work with this console closed.
//
// The aortic channel is the patient's arterial line (the monitor's): the
// console's team steps zero, level and re-prime that line, and its read-outs
// carry that line's set-up (inputBindings/pressureWire.ts withAorticLine).
//
// No live read-out says why a step failed or which branch the wire is in: the
// console's messages say what it sees (a refused or failed equalisation, a
// damped aortic trace, contrast in the guide the operator left there, the
// drift check's verdict on the Pd/Pa it shows), in every mode. Only guided
// practice adds the cause, the branch, the sensor position and the vessel
// strip with the narrowings as the angiogram shows them.
// ---------------------------------------------------------------------------

export const meta: PciConsoleMeta = { id: "pressure-wire", label: "Pressure wire", order: 35 };

const SELECT = "bg-base-800 border border-line rounded px-1.5 py-0.5 text-[12px] text-ink font-mono";
const BTN = "btn !py-1 text-[12px]";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="stat-label">{label}</span>
      <span className="font-mono text-[12px] text-ink-soft">{children}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5 border-t border-line pt-2 first:border-t-0 first:pt-0">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{title}</div>
      {children}
    </div>
  );
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** What has been given for hyperaemia, as the operator knows it (never the effect). */
function hyperaemiaText(set: PwLabSetup, t: number): string {
  const hy = set.hyper;
  if (hy.mode === "ic") return `IC bolus ${Math.round(hy.doseUg)} µg, ${clock(Math.max(0, t - hy.t0))} ago${hy.flushedAt === null ? ", not flushed in" : ""}`;
  if (hy.mode === "iv") return `IV ${Math.round(hy.rateUgKgMin)} µg/kg/min, running ${clock(Math.max(0, t - hy.t0))}`;
  return "none";
}

/** Why the last equalisation did not take (guided practice only). */
const EQ_AID: Record<string, string> = {
  "valve-open": "The haemostatic valve is open.",
  introducer: "The introducer is still in the valve.",
  contrast: "The guide still holds contrast from the last injection.",
  "transducer-unzeroed": "The aortic transducer was not zeroed to air at the level of the heart.",
  "line-air": "There is air in the aortic line: flush it through the transducer.",
};

/** Sample colours: at or below the cut-off of its own kind (FFR at hyperaemia, the wave-free ratio at rest) warn, else the accent. */
const DOT_LOW = "#E9B95A"; // warn token
const DOT_HIGH = "#4F8EF7"; // accent token

/** The stored run's frame drawn into a canvas once per run and frame. */
function StoredImage({ run, k }: { run: StoredSeries; k: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    const f = run.frames[k];
    const ctx = cv?.getContext("2d");
    if (!cv || !f || !ctx) return;
    const img = ctx.createImageData(run.w, run.h);
    for (let i = 0; i < f.length; i++) {
      const j = i * 4;
      img.data[j] = img.data[j + 1] = img.data[j + 2] = f[i];
      img.data[j + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [run.id, run.w, run.h, k]); // eslint-disable-line react-hooks/exhaustive-deps
  return <canvas ref={ref} width={run.w} height={run.h} className="absolute inset-0 h-full w-full" />;
}

/** The pullback and the sensor on the stored run's image (stored pixels). */
function CoregView({ run, frame, coreg }: { run: StoredSeries; frame: StoredFrame; coreg: ReturnType<typeof pwCoregistered> }) {
  // the reference frame the trainee marks on the reference monitor, when there is one
  const marked = useSeriesStore((x) => x.refFrame[run.id]);
  const k = useMemo(() => storedFrameIndex(run, frame.xy), [run.id, run.frames.length, marked, frame]); // eslint-disable-line react-hooks/exhaustive-deps
  if (frame.xy.length < 2) return null;
  const r = Math.max(2, run.w / 110);
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[18rem] overflow-hidden rounded border border-line bg-black">
      {k >= 0 && <StoredImage run={run} k={k} />}
      <svg viewBox={`0 0 ${run.w} ${run.h}`} className="absolute inset-0 h-full w-full" role="img" aria-label="Pullback co-registered on the stored run">
        {/* without the run's image (its frames released) the route stands in for it */}
        {k < 0 && <polyline points={frame.xy.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")} fill="none" stroke="#5b6270" strokeWidth={r * 0.8} strokeLinejoin="round" />}
        {coreg.dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={r} fill={d.ratio <= (d.hyperaemic ? CUTOFF.ffr : CUTOFF.nhpr) ? DOT_LOW : DOT_HIGH} />
        ))}
        {coreg.sensor && <circle cx={coreg.sensor.x} cy={coreg.sensor.y} r={r * 2} fill="none" stroke="#ECEEF1" strokeWidth={r * 0.6} />}
      </svg>
    </div>
  );
}

export default function PressureWireConsole({ session }: PciConsoleProps) {
  usePciSession(session);
  // the state with the aortic channel on the patient's arterial line (as the monitor has it now)
  const line = aorticLineOf(session);
  const lineKey = line ? `${line.zeroed}|${line.levelled}|${line.airMl}|${line.offsetMmHg.toFixed(2)}` : "";
  const st = useMemo(() => withAorticLine(session, session.st), [session.st, lineKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const s = session.s as unknown as PciScenario;
  const tree = session.drawTree;
  const guided = session.policy.mode === "guided";
  const side = s.side;
  const loaded = st.wireKind === "pressure" && !!st.pressure;
  const set = pwSetupOf(st);
  const icDoses = [...new Set([IC_ADENOSINE_MAXIMAL_UG[side], IC_ADENOSINE_LEGACY_UG[side]])];
  const [icUg, setIcUg] = useState<number>(icDoses[0]);
  const [ivRate, setIvRate] = useState<number>(IV_ADENOSINE_UG_KG_MIN.low);
  const [ivSite, setIvSite] = useState<PwIvSite>("central");

  const { ctx, reading } = useMemo(() => (loaded ? pressureView(s, session.g, st, tree) : { ctx: null, reading: null }), [loaded, s, session.g, st, tree]);
  // the run the pullback was recorded against, on the route the wire was on when it started
  const pb = st.pressure?.pullback;
  const run = storedRunFor(session, pb?.frameId ?? null);
  const pbRoute = pb?.route ?? st.route;
  const routeKey = pbRoute.join(">");
  const tbl = session.table.state;
  const frame = useMemo(
    () => (run ? pwRouteFrame(session.g, pbRoute, storedRunPlace(session, run), run.number) : null),
    [run?.id, routeKey, session.g, tbl.x, tbl.y, tbl.height] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const act = (f: Parameters<typeof applyPressureAction>[2], action: Parameters<typeof applyPressureAction>[1] = "wire-kind") => applyPressureAction(session, action, f);

  if (!loaded || !set) {
    return (
      <div className="space-y-2 text-[12.5px]">
        <div className="text-ink-soft">No pressure wire on the rail. Pull the wire back into the guide (or bring a microcatheter to its tip) and exchange it.</div>
        <button className={BTN} onClick={() => act((x) => setWireKind(x, "pressure", { g: session.g }))}>
          Exchange for the pressure wire
        </button>
      </div>
    );
  }

  const pw = st.pressure!;
  const samples = pw.pullback.samples;
  const pts = ctx ? samples.map((p) => ({ x: sensorX(ctx.v, p.mm), ratio: p.ratio })).sort((a, b) => a.x - b.x) : [];
  const kind = samples.length && samples.filter((p) => p.hyperaemic).length * 2 >= samples.length ? "FFR" : "resting";
  // the sensor now is drawn only while the wire is on the route the pullback was recorded on
  const onRoute = pbRoute.join(">") === st.route.join(">");
  const coreg = frame ? pwCoregistered(frame, pw, onRoute ? (reading?.sensorMm ?? null) : null) : null;
  const guideContrast = (session.syringes.guide.primed ?? 1) > 0.5;
  const last = pw.measurements.slice(-6).reverse();
  const eq = set.eq;

  return (
    <div className="space-y-3 text-[12.5px]">
      <Section title="Console">
        {reading ? (
          <>
            <Row label="Pa / Pd">
              {Math.round(reading.pa)} / {Math.round(reading.pd)} mmHg
            </Row>
            <Row label="Pd/Pa">{reading.pdpa.toFixed(2)}</Row>
            <Row label="Wave-free ratio">{reading.wfp.toFixed(2)}</Row>
          </>
        ) : (
          <div className="text-ink-faint">The sensor is inside the guide.</div>
        )}
        <Row label="Equalised">{eq && !eq.ok && eq.reason ? `no (last attempt ${eq.refused ? "refused" : "failed"})` : pw.equalised ? `yes, ${clock(Math.max(0, pw.sinceEqualiseS))} ago` : "no"}</Row>
        <Row label="Adenosine">{hyperaemiaText(set, st.t)}</Row>
        {guided && reading?.branch && <Row label="Wire in">{reading.branch}</Row>}
        {guided && reading && <Row label="Sensor">{reading.sensorMm >= 0 ? `${reading.sensorMm.toFixed(0)} mm beyond the guide tip` : "inside the guide"}</Row>}
      </Section>

      <Section title="Set-up">
        <div className="flex flex-wrap gap-1.5">
          <button className={BTN} disabled={!set.introducer} onClick={() => act((x) => pwRemoveIntroducer(x))}>
            {set.introducer ? "Take the introducer out" : "Introducer out"}
          </button>
          <button
            className={BTN}
            onClick={() => {
              // asked of the attending once (session.flushGuide); the rest of an IC bolus goes in with the flush, to
              // the patient as well (pwSession applyPwActionToEngine), as much as the console's model delivered
              if (!session.flushGuide()) return;
              const before = pwSetupOf(session.st)?.hyper;
              const n0 = before?.mode === "ic" ? before.parts.length : 0;
              if (!applyPressureFollowUp(session, "flush-guide", (x) => pwFlushGuide(x))) return;
              const after = pwSetupOf(session.st)?.hyper;
              const rest = after?.mode === "ic" && after.parts.length > n0 ? after.parts[after.parts.length - 1].ug : 0;
              if (rest > 0) session.engine.giveDrug("adenosine", rest, "ic", { side, continuation: true });
            }}
            title="Clear the guide's contrast with saline; an IC bolus still in the guide goes in with it"
          >
            Flush the guide
          </button>
          <button className={BTN} onClick={() => flushAorticLineInSession(session)} title="The team flushes the arterial line through the transducer (as Re-prime line on the monitor)">
            Ask: flush the aortic line
          </button>
          <button className={BTN} onClick={() => zeroTransducerInSession(session)} title="The team levels the transducer at the heart and zeroes it to air (as Level and Zero ART on the monitor)">
            Ask: zero and level the transducer
          </button>
          <button className={BTN} onClick={() => act((x) => pwCheckConnections(x))}>
            Check the connections
          </button>
        </div>
        <Row label="Guide">{guideContrast ? "contrast in the lumen" : "saline in the lumen"}</Row>
        <Row label="Valve">{st.valveOpen ? "open" : "closed"}</Row>
        <button className={BTN} onClick={() => equaliseInSession(session)} title="Equalise with the sensor just beyond the guide tip">
          Equalise
        </button>
        {eq && !eq.ok && eq.text && (
          <div className="text-[12px] text-warn" role="status">
            {eq.text}
          </div>
        )}
        {guided && eq && !eq.ok && <div className="text-[12px] text-ink">{eq.reason ? EQ_AID[eq.reason] ?? "" : "The sensor was not at the guide tip."}</div>}
      </Section>

      <Section title="Hyperaemia">
        <div className="flex flex-wrap items-center gap-1.5">
          <select value={icUg} onChange={(e) => setIcUg(Number(e.target.value))} className={SELECT} aria-label="Intracoronary adenosine dose">
            {icDoses.map((d) => (
              <option key={d} value={d}>
                {d} µg
              </option>
            ))}
          </select>
          <button
            className={BTN}
            onClick={() => {
              if (!act((x) => pwGiveIcAdenosine(s, x, icUg), "drug")) return;
              // what reached the artery at once, as the console's model has it (guide hold-up, a disengaged guide)
              const hy = pwSetupOf(session.st)?.hyper;
              const now = hy?.mode === "ic" ? (hy.parts[0]?.ug ?? 0) : 0;
              if (now > 0) session.engine.giveDrug("adenosine", now, "ic", { side });
            }}
          >
            IC adenosine bolus
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <select value={ivRate} onChange={(e) => setIvRate(Number(e.target.value))} className={SELECT} aria-label="IV adenosine rate">
            {[IV_ADENOSINE_UG_KG_MIN.low, IV_ADENOSINE_UG_KG_MIN.high].map((r) => (
              <option key={r} value={r}>
                {r} µg/kg/min
              </option>
            ))}
          </select>
          <select value={ivSite} onChange={(e) => setIvSite(e.target.value as PwIvSite)} className={SELECT} aria-label="IV adenosine vein">
            {PW_IV_SITES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
          <button
            className={BTN}
            onClick={() => {
              if (act((x) => pwStartIvAdenosine(x, ivRate, ivSite), "drug")) session.engine.startInfusion({ drug: "adenosine", rate: ivRate, site: ivSite === "central" ? "central" : "peripheral" });
            }}
          >
            Ask: start IV adenosine
          </button>
          <button
            className={BTN}
            disabled={set.hyper.mode === "none"}
            onClick={() => {
              const iv = set.hyper.mode === "iv";
              if (act((x) => pwStopAdenosine(x), "drug") && iv) session.engine.stopInfusion("adenosine");
            }}
          >
            Stop
          </button>
        </div>
      </Section>

      <Section title="Measure">
        <div className="flex flex-wrap gap-1.5">
          <button className={BTN} disabled={!reading} onClick={() => act((x) => recordPressure(s, session.g, x, tree, { guided }))}>
            Record
          </button>
          <button className={BTN} onClick={() => act((x) => setPullbackRecording(x, !pw.pullback.recording, storedRunFor(session)?.number ?? null))}>
            {pw.pullback.recording ? "Stop pullback recording" : "Record a pullback"}
          </button>
          <button className={BTN} onClick={() => act((x) => pressureDriftCheck(s, session.g, x, tree))} title="Pd/Pa with the sensor back at the guide tip">
            Drift check
          </button>
        </div>
        {pw.pullback.recording && <div className="text-[12px] text-ink-faint">Recording: pull the wire back by hand to the guide tip.</div>}
        {last.length > 0 && (
          <div className="space-y-0.5">
            {last.map((m, i) => (
              <Row key={i} label={m.kind === "drift-check" ? "Drift check" : m.kind === "hyperaemia" ? "Hyperaemic" : "Resting"}>
                {m.kind === "rest" ? `Pd/Pa ${m.pdpa.toFixed(2)} · ratio ${m.wfp.toFixed(2)}` : `Pd/Pa ${m.pdpa.toFixed(2)}`} · {m.label}
                {m.kind === "drift-check" && m.ok !== undefined && (m.ok ? " · no significant drift" : " · the sensor has drifted: re-equalise and repeat")}
              </Row>
            ))}
          </div>
        )}
      </Section>

      {pts.length > 1 && <PullbackPlot pts={pts} kind={kind} />}

      <Section title="Co-registration">
        {run && frame && coreg ? (
          <>
            <div className="text-[12px] text-ink-faint">Run {run.number}: the pullback and the sensor on the stored run.</div>
            <CoregView run={run} frame={frame} coreg={coreg} />
          </>
        ) : (
          <div className="text-[12px] text-ink-faint">Record a cine run to co-register the pullback on it.</div>
        )}
      </Section>

      {guided && ctx && reading && (
        <VesselStrip
          lesions={ctx.c.lesions.map((l) => ({ id: l.id, pos: l.pos, ds: l.ds, lengthMm: l.lengthMm }))}
          lengthMm={ctx.c.lengthMm}
          diffuse={ctx.c.diffuse}
          sensorMm={reading.sensorMm - ctx.v.pathMm[0]}
          sensorFromTipMm={SENSOR_FROM_TIP_MM}
          wireIn
          guideEngaged={st.guide.engaged}
          disabled
        />
      )}
    </div>
  );
}
