// The hands-on transseptal puncture (structural-transseptal-hands-on), shared by the TEER and LAAO
// labs (and by PMC and the septal occluder when their labs exist). The engine is
// src/simulation/transseptal.ts; the host lab owns the state and passes it in with a dispatch, so its
// tip context (src/ui/lab/structuralTips.ts) reads the same state.
//
// What is on screen is what an operator has: AP fluoroscopy of the system, the three TOE views
// (bicaval, aortic short axis, four-chamber with the imager's height measurement), the monitor, the
// needle-tip pressure once it is connected and read, and what each action shows. The learner names
// the tip pressure trace; the stage never labels it. The en-face fossa map with the target zone and
// the site assessment are guided aids, shown only with aids on and never in an exam; the scenario's
// focus line likewise.
//
// TransseptalViews goes in the host lab's viewer column, TransseptalControls in its controls column;
// TransseptalStage lays both out for a stand-alone page. TransseptalDebrief is the drill's debrief.
import { useState, type ReactNode } from "react";
import {
  CONFIRM_CHECKS,
  TS_HEPARIN,
  TS_HOST_LABEL,
  TS_PATIENT,
  TS_TRACES,
  assessTransseptal,
  bleedRate,
  clockLabel,
  heparinGivenU,
  lastAct,
  septalHeightCm,
  shownPoint,
  tipClockH,
  traceKind,
  transseptalDecisions,
  vitalsAt,
  type ConfirmCheck,
  type CrossTool,
  type TraceKind,
  type TransseptalProcedure,
  type TsAction,
  type TsScore,
  type TsState,
} from "../../simulation/transseptal";
import { PATIENT_EVENT_THRESHOLDS } from "../lab/patientEvents";
import FossaPicker, { BicavalView, FourChamberView, ShortAxisView } from "./FossaPicker";
import { DeductionList, Panel, Readout, ScoreBadge, Seg, Teach, Toggle, TONE_TEXT, type Tone } from "./common";

export interface TransseptalViewProps {
  state: TsState;
  /** the procedure whose site rules the guided aid shows (null: no site aid) */
  procedure: TransseptalProcedure | null;
  baseCm: number;
  heightTarget?: [number, number];
  /** guided aids on (the host turns them off in an exam) */
  aids: boolean;
}

export interface TransseptalControlProps extends TransseptalViewProps {
  dispatch: (a: TsAction) => void;
  exam: boolean;
  /** a stand-alone drill: the catheters come out at the end and the stage has its own debrief */
  drill: boolean;
  /** hosted: the left atrium is secured, go on to the procedure */
  onContinue?: () => void;
  continueLabel?: string;
  /** hosted: the procedure was stopped at the puncture */
  onAbandon?: () => void;
}

const CHECK_LABEL: Record<ConfirmCheck, string> = {
  toe: "Look on TOE",
  aspirate: "Aspirate through the needle",
  pressure: "Read the tip pressure",
  contrast: "Puff contrast",
};

const TRACE_LABEL: Record<TraceKind, string> = { la: "Left atrial", ra: "Right atrial", aortic: "Arterial (aortic)", none: "No trace" };

const TOOL_LABEL: Record<CrossTool, string> = { needle: "Transseptal needle", rf: "Radiofrequency", "sharp-wire": "Sharp transseptal wire" };

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

export function TransseptalViews({ state: s, procedure, baseCm, heightTarget, aids }: TransseptalViewProps) {
  const p = shownPoint(s);
  const onFossa = s.zone === "fossa" && !!s.contact;
  const across = s.crossedAt !== null;
  // a crossing into the aorta does not release the tent: the views keep it, and the short axis shows the needle towards the root
  const intoLa = across && s.needle === "la";
  const towardsAorta = across && s.needle === "aorta";
  const heightCm = p ? septalHeightCm(baseCm, p) : 0;
  const raSi = s.zone === "ra" ? 0.9 - Math.min(1, (s.depthMm - 28) / 14) * 0.4 : null;
  const aortaR = s.variant.aorticAp < 0 ? 21 : 15;
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <FluoroAp state={s} />
        <Monitor state={s} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {onFossa || across ? (
          <BicavalView si={p!.si} tentMm={s.tentMm} crossed={intoLa} />
        ) : (
          <BicavalView si={0} tip={s.zone === "ra" ? raSi : null} />
        )}
        <ShortAxisView ap={p?.ap ?? 0} aortaR={aortaR} tentMm={s.tentMm} noTent={!onFossa && !across} crossed={intoLa} towardsAorta={towardsAorta} />
        <FourChamberView heightCm={heightCm} noTent={!onFossa && !across} />
      </div>
      {/* the needle is transduced from the fossa on: the right atrial trace changes as the needle crosses; the learner names it after the pressure check */}
      {!s.needleOut && (s.zone === "fossa" || across) && <TipPressure kind={traceKind(s)} />}
      {aids && p && procedure && (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <FossaPicker procedure={procedure} baseCm={baseCm} value={p} showTarget locked mapOnly caption="Guided aid: contact point on the fossa" />
          <SiteAid procedure={procedure} point={p} baseCm={baseCm} heightTarget={heightTarget} />
        </div>
      )}
    </div>
  );
}

function SiteAid({ procedure, point, baseCm, heightTarget }: { procedure: TransseptalProcedure; point: { si: number; ap: number }; baseCm: number; heightTarget?: [number, number] }) {
  const r = assessTransseptal(procedure, point, baseCm, heightTarget);
  return (
    <div className="space-y-1.5">
      <Readout label="Site (guided aid)" value={r.quality} tone={r.quality === "ideal" ? "good" : r.quality === "acceptable" ? "warn" : "danger"} small />
      <ul className="space-y-1">
        {r.flags.map((f, i) => (
          <li key={i} className={`text-xs leading-snug ${TONE_TEXT[f.tone]}`}>
            • {f.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** AP fluoroscopy of the transseptal system: SVC, right atrium and IVC, the sheath and the tip, and pacing leads when present. */
function FluoroAp({ state: s }: { state: TsState }) {
  // each "Check the wire in LAO" switches the image to LAO (the check logs a neutral line); the
  // Show AP / Show LAO link overrides it until the next check
  const laoChecks = s.log.filter((l) => l.text.startsWith("LAO projection")).length;
  const [override, setOverride] = useState<{ n: number; lao: boolean } | null>(null);
  const lao = override && override.n === laoChecks ? override.lao : laoChecks > 0 && s.stage === "setup";
  // tip height on the image from the zone and the withdrawal (MODEL PARAMETER of the drawing)
  const y = s.zone === "svc" ? 40 + s.depthMm * 2.2 : s.zone === "ra" ? 92 + (s.depthMm - 28) * 1.6 : s.zone === "fossa" ? 118 - (s.contact?.si ?? 0) * 14 : 186;
  const across = s.crossedAt !== null;
  const tipX = across ? 168 : s.zone === "fossa" ? 150 : 132;
  const h = tipClockH(s);
  // the tip's direction on the AP image: towards the patient's left (screen right) at 3 o'clock
  const ang = ((h - 3) / 12) * 2 * Math.PI;
  const dx = Math.cos(ang) * 10;
  const leadsX = lao ? 118 : 128;
  const wireX = s.wire === "posterior" ? (lao ? 128 : 122) : lao ? 106 : 134;
  const showLeads = s.variant.pacingLeads;
  return (
    <div className="monitor rounded-md relative overflow-hidden">
      <div className="absolute left-2 top-1 text-[12px] text-ink-faint">{lao ? "LAO fluoroscopy" : "AP fluoroscopy"}</div>
      {showLeads && (
        <button className="absolute right-2 top-1 text-[12px] text-accent" onClick={() => setOverride({ n: laoChecks, lao: !lao })}>
          {lao ? "Show AP" : "Show LAO"}
        </button>
      )}
      <svg viewBox="0 0 220 220" className="w-full block" role="img" aria-label={`Fluoroscopy: the tip is ${s.zone === "svc" ? "in the SVC" : s.zone === "ivc" ? "below the atrium" : across ? "advanced beyond the tent at the fossa" : "in the right atrium"}`}>
        <rect x="0" y="0" width="220" height="220" fill="#0b0e12" />
        <rect x="96" y="0" width="28" height="220" fill="#151a20" opacity="0.7" />
        <ellipse cx="140" cy="118" rx="62" ry="54" fill="#1a2028" opacity="0.8" />
        <path d="M 124 0 L 124 70 Q 112 118 124 168 L 124 220" stroke="#2c3542" strokeWidth="16" fill="none" opacity="0.7" />
        {showLeads && (
          <g stroke="#c9ccd1" strokeWidth="2" fill="none">
            <path d={`M ${leadsX + 20} 0 Q ${leadsX} 60 ${leadsX + 2} 100 Q ${leadsX + 4} 110 ${leadsX + 14} 104`} />
            <path d={`M ${leadsX + 24} 0 Q ${leadsX + 4} 70 ${leadsX + 8} 120 Q ${leadsX + 30} 150 ${leadsX + 52} 150`} />
          </g>
        )}
        {s.stage === "setup" && s.zone === "svc" && <line x1={wireX} y1={10} x2={wireX} y2={220} stroke="#8aa0b8" strokeWidth="1.2" strokeDasharray="3 2" />}
        <path d={`M 126 220 L 126 ${Math.max(y + 8, 150)} Q 126 ${y + 4} ${tipX - 4} ${y}`} stroke="#d7dce2" strokeWidth="3" fill="none" />
        <line x1={tipX - 4} y1={y} x2={tipX - 4 + dx} y2={y - 2} stroke="#ECEEF1" strokeWidth="2" />
        <circle cx={tipX - 4} cy={y} r="2.6" fill="#ECEEF1" />
        {s.lspvWire && <path d={`M ${tipX} ${y} Q 190 ${y - 30} 200 ${y - 52}`} stroke="#8aa0b8" strokeWidth="1.2" fill="none" />}
        {s.pericardialMl > 40 && <ellipse cx="140" cy="118" rx={64 + Math.min(14, s.pericardialMl / 15)} ry={56 + Math.min(12, s.pericardialMl / 18)} fill="none" stroke="#2b333d" strokeWidth={Math.min(10, s.pericardialMl / 20)} />}
      </svg>
      <div className="absolute left-2 bottom-1 text-[12px] font-mono text-ink-faint">Arrow {clockLabel(s.clockH)}{s.aligned ? "" : " · side arm not aligned"}</div>
    </div>
  );
}

function Monitor({ state: s }: { state: TsState }) {
  const v = vitalsAt(s);
  const act = lastAct(s);
  const tone = (bad: boolean): Tone | undefined => (bad ? "danger" : undefined);
  return (
    <div className="monitor rounded-md p-2.5 space-y-2">
      <div className="flex items-center justify-between text-[12px] text-ink-faint">
        <span>Monitor</span>
        <span className="font-mono">{fmtTime(s.t)}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Readout label="HR" value={`${v.hr}`} unit="/min" tone={tone(v.hr < PATIENT_EVENT_THRESHOLDS.bradycardiaHr)} small />
        <Readout label="BP" value={`${v.sys}/${v.dia}`} unit={`(${v.map})`} tone={tone(v.map < PATIENT_EVENT_THRESHOLDS.hypotensionMapMmHg)} small />
        {/* 1 mm in two contiguous inferior leads: the limb-lead threshold patientVitals uses (ecg12.ts stemiCriteria) */}
        <Readout label="ST inf." value={v.stMm > 0 ? `+${v.stMm.toFixed(1)}` : "0"} unit="mm" tone={tone(v.stMm >= 1)} small />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Readout label="Rhythm" value={v.rhythm} small />
        <Readout label="ACT" value={act ? `${act.s}` : "–"} unit={act ? `s at ${fmtTime(act.t)}` : undefined} small />
      </div>
      {v.sweating && <div className="text-[12px] text-warn">The patient is pale and sweating.</div>}
    </div>
  );
}

function fmtTime(t: number): string {
  const m = Math.floor(t / 60);
  const sec = Math.floor(t % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/** The needle-tip pressure as the monitor draws it: the learner names it. */
export function TipPressure({ kind }: { kind: TraceKind }) {
  const W = 300;
  const H = 90;
  let path = "";
  let scale = "";
  let label = "";
  if (kind === "aortic") {
    const T = TS_TRACES.aortic;
    const y = (p: number) => H - 8 - (p / 150) * (H - 16);
    const beat = (x0: number) =>
      `L ${x0} ${y(T.dia)} C ${x0 + 8} ${y(T.dia)} ${x0 + 10} ${y(T.sys)} ${x0 + 18} ${y(T.sys)} C ${x0 + 26} ${y(T.sys - 4)} ${x0 + 30} ${y(T.dia + 30)} ${x0 + 34} ${y(T.dia + 24)} L ${x0 + 37} ${y(T.dia + 30)} C ${x0 + 46} ${y(T.dia + 22)} ${x0 + 60} ${y(T.dia + 4)} ${x0 + 75} ${y(T.dia)}`;
    path = `M 0 ${y(T.dia)} ${[0, 75, 150, 225].map(beat).join(" ")}`;
    scale = "0–150 mmHg";
    label = `${T.sys}/${T.dia} (${T.mean})`;
  } else if (kind === "la" || kind === "ra") {
    const T = kind === "la" ? TS_TRACES.la : TS_TRACES.ra;
    const y = (p: number) => H - 8 - (p / 25) * (H - 16);
    const base = Math.min(T.a, T.v) - 5;
    const beat = (x0: number) =>
      `L ${x0} ${y(base + 1)} Q ${x0 + 8} ${y(T.a)} ${x0 + 14} ${y(base)} Q ${x0 + 22} ${y(base + 2)} ${x0 + 28} ${y(base - 1)} Q ${x0 + 44} ${y(T.v)} ${x0 + 54} ${y(base - 2)} Q ${x0 + 66} ${y(base)} ${x0 + 75} ${y(base + 1)}`;
    path = `M 0 ${y(base + 1)} ${[0, 75, 150, 225].map(beat).join(" ")}`;
    scale = "0–25 mmHg";
    label = `a ${T.a}, v ${T.v}, mean ${T.mean}`;
  } else {
    const y = H / 2;
    path = `M 0 ${y} L ${W} ${y}`;
    scale = "0–25 mmHg";
    label = "–";
  }
  return (
    <div className="monitor rounded-md relative overflow-hidden">
      <div className="absolute left-2 top-1 text-[12px] text-ink-faint">Needle tip pressure</div>
      <div className="absolute right-2 top-1 text-[12px] font-mono text-ink-faint">{scale}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" role="img" aria-label={`Needle tip pressure trace, ${label} mmHg`}>
        <path d={path} stroke="#E9B95A" strokeWidth="1.6" fill="none" />
      </svg>
      <div className="absolute right-2 bottom-1 text-[12px] font-mono text-ink">{label} mmHg</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

function Btn({ children, onClick, tone, disabled, pressed }: { children: ReactNode; onClick: () => void; tone?: "accent" | "danger"; disabled?: boolean; pressed?: boolean }) {
  return (
    <button className={`btn ${tone === "accent" ? "btn-accent" : tone === "danger" ? "btn-danger" : ""} text-xs`} onClick={onClick} disabled={disabled} aria-pressed={pressed}>
      {children}
    </button>
  );
}

export function TransseptalControls(props: TransseptalControlProps) {
  const { state: s, dispatch: d, exam, drill, aids, onContinue, continueLabel, onAbandon } = props;
  const [hubLow, setHubLow] = useState(false);
  const [aspirate, setAspirate] = useState(false);
  const [leaveWire, setLeaveWire] = useState(false);
  const [triedNeedle, setTriedNeedle] = useState(false);
  const wt = TS_PATIENT.weightKg;
  const onTable = s.stage !== "done" && s.stage !== "abandoned";
  const handsOn = s.stage === "setup" || s.stage === "pulldown" || s.stage === "fossa";
  const recent = s.log.slice(-6).reverse();

  return (
    <div className="space-y-3">
      {(drill || aids) && !exam && (
        <Panel title={drill ? s.variant.title : "Transseptal puncture"}>
          {drill && <p className="text-xs text-ink-soft leading-relaxed">{s.variant.vignette}</p>}
          {aids && <p className="text-[12px] text-accent mt-1.5">{s.variant.focus}</p>}
        </Panel>
      )}

      {handsOn && (
        <Panel title={s.stage === "setup" ? "Orient the system" : s.zone === "fossa" ? "Position the tent" : "Pull-down"}>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-ink-soft">Needle arrow</span>
              <span className="font-mono text-sm text-ink">{clockLabel(s.clockH)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Btn onClick={() => d({ kind: "rotate", deg: -15 })}>Counter-clockwise 15°</Btn>
              <Btn onClick={() => d({ kind: "rotate", deg: 15 })}>Clockwise 15°</Btn>
            </div>
            {s.stage === "setup" && (
              <>
                <Btn onClick={() => d({ kind: "align" })} disabled={s.aligned} tone={s.aligned ? undefined : "accent"}>
                  {s.aligned ? "Arrow and side arm aligned" : "Align the arrow with the side arm"}
                </Btn>
                {s.variant.pacingLeads && (
                  <div className="grid grid-cols-2 gap-2">
                    <Btn onClick={() => d({ kind: "check-lao" })}>Check the wire in LAO</Btn>
                    <Btn onClick={() => d({ kind: "repass-wire" })}>Re-pass the wire</Btn>
                  </div>
                )}
              </>
            )}
            <div className="grid grid-cols-3 gap-2">
              <Btn onClick={() => d({ kind: "pull", mm: 1 })}>Withdraw 1 mm</Btn>
              {s.zone === "fossa" ? (
                <Btn onClick={() => d({ kind: "pull", mm: 3 })}>Withdraw 3 mm</Btn>
              ) : (
                <Btn onClick={() => d({ kind: "pull", mm: 5 })}>Withdraw 5 mm</Btn>
              )}
              <Btn onClick={() => d({ kind: "pull", mm: -1 })}>Advance 1 mm</Btn>
            </div>
            {s.stage !== "setup" && <Btn onClick={() => d({ kind: "to-svc" })}>Wire back to the SVC and repeat</Btn>}
            <Teach>
              Hold arrow and side arm as one. Pull down slowly: a jump into the atrium, a second onto the fossa, then tenting on the bicaval
              view. Read anterior–posterior on the short axis and the height on the four-chamber view.
            </Teach>
          </div>
        </Panel>
      )}

      {(s.stage === "setup" || s.stage === "pulldown" || s.stage === "fossa") && (
        <Panel title="Crossing">
          <div className="space-y-2.5">
            <Seg options={(["needle", "rf", "sharp-wire"] as CrossTool[]).map((t) => ({ id: t, label: TOOL_LABEL[t] }))} value={s.tool} onChange={(t) => d({ kind: "tool", tool: t })} />
            <div className="grid grid-cols-2 gap-2">
              <Btn
                tone="accent"
                disabled={s.zone !== "fossa"}
                onClick={() => {
                  setTriedNeedle(true);
                  d({ kind: "advance-needle" });
                }}
              >
                Advance the needle
              </Btn>
              <Btn tone="danger" disabled={s.zone !== "fossa" || !triedNeedle} onClick={() => d({ kind: "advance-needle", force: true })}>
                Push harder
              </Btn>
            </div>
          </div>
        </Panel>
      )}

      {(s.stage === "crossed" || s.stage === "secured") && (
        <Panel title={s.stage === "secured" ? "Left atrium secured" : "Confirm and secure"}>
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              {CONFIRM_CHECKS.map((c) => (
                <Btn key={c} onClick={() => d({ kind: "check", what: c })}>
                  {s.checks.includes(c) ? "✓ " : ""}
                  {CHECK_LABEL[c]}
                </Btn>
              ))}
            </div>
            {s.checks.includes("pressure") && (
              <div>
                <div className="stat-label mb-1">The tip pressure is</div>
                {/* the learner's own reading, marked as chosen; the stage never says which trace it is */}
                <div className="grid grid-cols-2 gap-2">
                  {(["la", "ra", "aortic", "none"] as TraceKind[]).map((k) => (
                    <Btn key={k} tone={s.traceRead === k ? "accent" : undefined} pressed={s.traceRead === k} onClick={() => d({ kind: "read-trace", as: k })}>
                      {s.traceRead === k ? "✓ " : ""}
                      {TRACE_LABEL[k]}
                    </Btn>
                  ))}
                </div>
              </div>
            )}
            {s.dilator === "ra" && (
              <div className="grid grid-cols-2 gap-2">
                <Btn tone="accent" onClick={() => d({ kind: "advance-dilator" })}>
                  Advance the dilator
                </Btn>
                <Btn onClick={() => d({ kind: "withdraw-needle" })}>Withdraw the needle</Btn>
              </div>
            )}
            {s.dilator === "la" && s.sheath === "ra" && (
              <div className="grid grid-cols-1 gap-2">
                <Btn tone="accent" onClick={() => d({ kind: "advance-sheath" })}>
                  Advance the sheath (mild pressure, slight turn)
                </Btn>
                <Btn onClick={() => d({ kind: "pv-wire" })} disabled={s.pvWire}>
                  Park a J wire deep in a pulmonary vein
                </Btn>
                <Btn onClick={() => d({ kind: "advance-sheath", escalate: true })}>Escalate: stiff wire or 4 mm balloon</Btn>
              </div>
            )}
            {s.sheath === "la" && !s.needleOut && (
              <div className="space-y-2">
                <Toggle label="Thumb on the hub, hub held low" checked={hubLow} onChange={setHubLow} />
                <Toggle label="Aspirate as the dilator comes out" checked={aspirate} onChange={setAspirate} />
                <Btn tone="accent" onClick={() => d({ kind: "remove-needle", hubLow, aspirate })}>
                  Remove the needle and dilator
                </Btn>
              </div>
            )}
            {s.needleOut && !s.lspvWire && (
              <div className="grid grid-cols-2 gap-2">
                <Btn onClick={() => d({ kind: "flush" })}>Aspirate and flush the sheath</Btn>
                <Btn tone="accent" onClick={() => d({ kind: "lspv-wire" })}>
                  Wire to the left superior pulmonary vein
                </Btn>
              </div>
            )}
            {s.stage === "secured" && !drill && onContinue && (
              <Btn tone="accent" onClick={onContinue}>
                {continueLabel ?? `Continue to the ${TS_HOST_LABEL[s.host]}`}
              </Btn>
            )}
            {s.stage === "secured" && drill && (
              <div className="space-y-2">
                <p className="text-[12px] text-ink-soft">The left atrial part of the procedure is complete.</p>
                <Toggle label="Leave a wire across the septum and watch" checked={leaveWire} onChange={setLeaveWire} />
                <Btn tone="accent" onClick={() => d({ kind: "catheters-out", leaveWire })}>
                  Remove the left atrial catheters
                </Btn>
              </div>
            )}
          </div>
        </Panel>
      )}

      {(s.stage === "finish" || s.stage === "recovery") && (
        <Panel title={s.stage === "recovery" ? "Recovery" : "Catheters out"}>
          <div className="space-y-2">
            {s.stage === "finish" && s.wireLeftAcross && s.wireOutT === null && <p className="text-[12px] text-ink-soft">The wire is across the septum. Watch the pressure, the ECG and TOE.</p>}
            {s.cathetersOutT !== null && !s.breachClosed && s.drains > 0 && (
              <Btn onClick={() => d({ kind: "close-breach" })}>Close the breach with an occluder</Btn>
            )}
            <Btn tone="accent" onClick={() => d({ kind: "finish" })}>
              {s.stage === "recovery" ? "Hand over to recovery" : s.wireLeftAcross && s.wireOutT === null ? "Remove the wire and send to recovery" : "Send to recovery"}
            </Btn>
          </div>
        </Panel>
      )}

      {onTable && s.stage !== "setup" && (
        <Panel title="Anticoagulation">
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <Btn onClick={() => d({ kind: "heparin", u: TS_HEPARIN.earlyU })}>{TS_HEPARIN.earlyU.toLocaleString("en-GB")} U</Btn>
              <Btn onClick={() => d({ kind: "heparin", u: TS_HEPARIN.fullUPerKg[0] * wt })}>{TS_HEPARIN.fullUPerKg[0]} U/kg</Btn>
              <Btn onClick={() => d({ kind: "heparin", u: TS_HEPARIN.fullUPerKg[1] * wt })}>{TS_HEPARIN.fullUPerKg[1]} U/kg</Btn>
            </div>
            <Btn onClick={() => d({ kind: "measure-act" })}>Measure the ACT</Btn>
            <p className="text-[12px] text-ink-faint">
              Given {heparinGivenU(s).toLocaleString("en-GB")} U ({wt} kg). Target ACT at least {TS_HEPARIN.actTargetS} s ({TS_HEPARIN.actRangeS[0]}–{TS_HEPARIN.actRangeS[1]} s in Russo's
              practice). Follow local protocol.
            </p>
          </div>
        </Panel>
      )}

      {onTable && (s.stage !== "setup" || s.t > 0) && (
        <Panel title="The patient">
          <div className="grid grid-cols-2 gap-2">
            <Btn onClick={() => d({ kind: "echo" })}>Look for an effusion on TOE</Btn>
            <Btn onClick={() => d({ kind: "wait", s: 30 })}>Wait and watch 30 s</Btn>
            <Btn onClick={() => d({ kind: "atropine" })}>Atropine</Btn>
            <Btn onClick={() => d({ kind: "fluids" })}>Fluid bolus</Btn>
            <Btn onClick={() => d({ kind: "pericardiocentesis" })}>Pericardiocentesis</Btn>
            <Btn onClick={() => d({ kind: "call-surgeon" })}>Call the surgeon</Btn>
          </div>
        </Panel>
      )}

      {s.stage === "abandoned" && !drill && onAbandon && (
        <Panel title="Procedure stopped">
          <div className="space-y-2">
            <p className="text-xs text-ink-soft">The surgical team takes over; the {TS_HOST_LABEL[s.host]} does not go ahead.</p>
            <Btn tone="accent" onClick={onAbandon}>
              Go to the debrief
            </Btn>
          </div>
        </Panel>
      )}

      <Panel title="At the table">
        {recent.length ? (
          <ul className="space-y-1">
            {recent.map((l, i) => (
              <li key={`${l.t}-${i}`} className={`text-xs leading-snug ${l.tone ? TONE_TEXT[l.tone] : "text-ink-soft"}`}>
                <span className="font-mono text-ink-faint mr-1.5">{fmtTime(l.t)}</span>
                {l.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-ink-faint">Sheath and dilator in the SVC over the wire; needle loaded with its stylet, pressure line connected.</p>
        )}
        {bleedRate(s) > 0 && s.pericardialMl > 100 && <p className="text-[12px] text-danger mt-1.5">The heart shadow is widening and its edge has stopped moving.</p>}
      </Panel>
    </div>
  );
}

/** The drill's debrief: the score, the decisions with their lessons, and what happened. */
export function TransseptalDebrief({ state: s, score }: { state: TsState; score: TsScore }) {
  const decisions = transseptalDecisions(s);
  return (
    <div className="space-y-3">
      <Panel title="Score">
        <div className="space-y-3">
          <ScoreBadge score={score.score} />
          <DeductionList items={score.deductions} />
          {score.critical.length > 0 && (
            <ul className="space-y-0.5">
              {score.critical.map((c) => (
                <li key={c} className="text-[12px] text-danger">
                  Critical: {c}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
      <Panel title="Decisions">
        <ul className="space-y-1.5">
          {decisions.map((x) => (
            <li key={x.id} className="text-xs leading-snug">
              <span className={x.correct ? "text-good" : "text-danger"}>{x.correct ? "✓" : "✗"}</span> <span className="text-ink">{x.label}</span>
              <span className="block text-ink-faint">
                Expected: {x.expected}. Given: {x.given}.
              </span>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="What happened">
        <ul className="space-y-1 max-h-64 overflow-auto">
          {s.log.map((l, i) => (
            <li key={i} className={`text-xs leading-snug ${l.tone ? TONE_TEXT[l.tone] : "text-ink-soft"}`}>
              <span className="font-mono text-ink-faint mr-1.5">{fmtTime(l.t)}</span>
              {l.text}
            </li>
          ))}
        </ul>
        {s.crossedAt && (
          <p className="text-[12px] text-ink-faint mt-2">
            Crossed at {s.posteriorExit ? "the posterior border of the fossa, through the pericardial space" : s.needle === "aorta" ? "the anterior fossa, into the aortic root" : "the fossa"}.
          </p>
        )}
      </Panel>
    </div>
  );
}

/** A hosted procedure's debrief: what the puncture cost, beside the device score (the site itself is scored by the host). */
export function TransseptalSummary({ score }: { score: TsScore }) {
  return (
    <Panel title="Transseptal puncture">
      <div className="space-y-2">
        {score.deductions.length ? <DeductionList items={score.deductions} /> : <p className="text-xs text-ink-soft">No deductions for the puncture itself.</p>}
        {score.critical.length > 0 && (
          <ul className="space-y-0.5">
            {score.critical.map((c) => (
              <li key={c} className="text-[12px] text-danger">
                Critical: {c}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

/** Both halves for a stand-alone page. */
export default function TransseptalStage(props: TransseptalControlProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_23rem]">
      <TransseptalViews {...props} />
      <TransseptalControls {...props} />
    </div>
  );
}
