import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { DrugId, InfusionDrug } from "../../../simulation/patient/pharmacology";
import {
  BIVALIRUDIN,
  CANGRELOR,
  EPTIFIBATIDE,
  HIT_RULES,
  MP_PROTAMINE_REACTION,
  ORAL_LOADS,
  PROTAMINE_RULES,
  TEACHING_VALUES_NOTE,
  TIROFIBAN,
  heparinBolusU,
  ivRegimen,
  protamineDose,
  type OralAntiplatelet,
} from "../../../simulation/pci/doses";
import {
  actClockOf,
  actDeviceOf,
  actTargetOf,
  antithromboticContextForRun,
  antithromboticContextOf,
  antithromboticOf,
  declareAntithrombotic,
  giveDrug,
  giveOralLoad,
  giveProtamine,
  hitWorkupOf,
  orderHitAntibody,
  orderIvAgent,
  protamineReactionLevel,
  protamineReactionsOf,
  recordAct,
  recordFourTs,
  setFlushSolution,
  stopAgentInfusion,
  type FlushSolution,
  type FourTs,
  type AntithromboticRecord,
  type IvAgent,
  type RunningAgent,
} from "../../../simulation/pci/actions/drugs";
import type { PciState } from "../../../simulation/pci/state";
import { antithromboticVariant } from "../../../simulation/pci/scenarios/packs/antithrombotic";
import { labScreens } from "../../lab/visibility";
import { applyDeliveryAction } from "../inputBindings/support";
import { usePciSession, type PciConsoleMeta, type PciConsoleProps } from "./registry";
import type { PciLabSession } from "../PciLabSession";

// ---------------------------------------------------------------------------
// The drugs console (pci-antithrombotic-orders): anticoagulant and
// antiplatelet orders with dose, route and rate, and the ACT.
//
// What it shows is what the operator knows at the table: the ACT machine the
// lab uses, the last ACT and how long ago it was measured, the time since the
// last anticoagulant dose, the infusions running, the patient's weight and
// creatinine clearance from the chart, the nurse's reminder when a recheck is
// due (Oxford's team model: the nurse makes sure ACTs are measured on time,
// 03-antithrombotics.ts:103), and in the suspected-HIT variant the pre-case
// chart with the platelet trend, the 4Ts form and the antibody order. The
// learner chooses every dose: outside guided practice every dose field starts
// empty; in guided practice the fields start at the sourced regimen and the ACT
// target and the dose calculation are shown, as a teaching aid. The order errors (a rate
// not set for the kidneys, heparin in HIT, protamine over the cap) are kept for
// the debrief and never shown live.
//
// Each order goes first to the procedure record (src/simulation/pci/actions/
// drugs.ts) through the session's operator-action path (applyDeliveryAction,
// asked of the attending as 'drug') and, only when the record took it, to the
// patient engine (giveDrug, startInfusion: the shared formulary), so the two
// never disagree. Protamine reaches the engine at the ordered rate, in equal
// portions over the ordered minutes (the engine has no protamine infusion). A
// protamine reaction drawn by the record is driven on the engine as a loss of
// vascular tone from a session step listener until it has worn off, on top of
// the vasodilation the engine had when it began. The case's antithrombotic
// context (the ACT machine, suspected HIT) is declared from the run's variant
// as case setup, outside the attending's gate, when the console opens.
// ---------------------------------------------------------------------------

export const meta: PciConsoleMeta = { id: "drugs", label: "Drugs and ACT", order: 45 };

const SELECT = "bg-base-800 border border-line rounded px-1.5 py-0.5 text-[12px] text-ink";
const NUM = "w-20 bg-base-800 border border-line rounded px-1.5 py-0.5 text-[12px] font-mono text-ink";

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
    <section className="space-y-1.5 border-t border-line pt-2">
      <div className="text-[12px] font-medium text-ink">{title}</div>
      {children}
    </section>
  );
}

function Num({ value, onChange, label, step = 1 }: { value: number; onChange: (n: number) => void; label: string; step?: number }) {
  return <input type="number" className={NUM} value={Number.isFinite(value) ? value : ""} step={step} min={0} aria-label={label} onChange={(e) => onChange(Number(e.target.value))} />;
}

/** Generic names for the two ACT machines (the same blood reads higher on one: Brilakis 25.2, 03-antithrombotics.ts:129). */
const MACHINE_LABEL = { hemochron: "Higher-reading ACT machine", hemotec: "Lower-reading ACT machine" } as const;
const MACHINE_LESSON = { hemochron: "Hemochron", hemotec: "HemoTec" } as const;

const minutes = (s: number | null) => (s === null ? "none" : `${Math.floor(s / 60)} min ago`);
/** A dose field's value as a dose: a positive finite number, else 0 (an empty field). */
const pos = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
/** A dose field's starting value: the sourced figure in guided practice, else empty. */
const start = (guided: boolean, v: number) => (guided ? v : NaN);

/** Apply a record change as an operator action (asked of the attending as 'drug'). */
const apply = (session: PciLabSession, f: (x: PciState) => PciState) => applyDeliveryAction(session, "drug", f);

/** Sessions with a protamine reaction driver running (one per session). */
const drivers = new WeakSet<PciLabSession>();

/**
 * Drive the drawn protamine reactions on the engine (loss of vascular tone) until they have worn off: the
 * engine's vasodilation when the driver starts is kept as the baseline, the reaction is applied on top of
 * it (the larger of the two) and the baseline is restored afterwards. Exported for the session-level test.
 */
export function driveProtamineReaction(session: PciLabSession) {
  if (drivers.has(session) || protamineReactionsOf(session.st).length === 0) return;
  drivers.add(session);
  const baseline = session.engine.snapshot().form?.vasodilation ?? 0;
  let applied = false;
  let seen = -1;
  let rx: ReturnType<typeof protamineReactionsOf> = [];
  const off = session.onStep(() => {
    const st = session.st;
    if (st.log.length !== seen) {
      rx = protamineReactionsOf(st);
      seen = st.log.length;
    }
    // pending until each reaction has begun and passed its peak (at onset itself the level is still 0)
    let pending = false;
    for (const r of rx) if (st.t <= r.onsetT + MP_PROTAMINE_REACTION.riseS) pending = true;
    const lv = rx.length ? protamineReactionLevel(st, st.t) : 0;
    if (lv > 0) {
      session.engine.setVasodilation(Math.max(baseline, lv));
      applied = true;
    } else if (applied) {
      session.engine.setVasodilation(baseline);
      applied = false;
    }
    if (!pending && lv === 0 && !applied) {
      off();
      drivers.delete(session);
    }
  });
}

/**
 * MODEL PARAMETER: a protamine order given over minutes reaches the engine in equal portions this many
 * lab seconds apart (the engine has no protamine infusion; its protamine binds heparin over about 30 s).
 */
export const MP_PROTAMINE_PORTION_S = 10;

/**
 * Give protamine to the engine at the ordered rate: a push (0 minutes) at once, otherwise the dose in equal
 * portions every MP_PROTAMINE_PORTION_S over the ordered minutes, from a session step listener that
 * outlives the console. Exported for the session-level test.
 */
export function deliverProtamine(session: PciLabSession, doseMg: number, overMin: number): void {
  const totalS = overMin * 60;
  const portions = Math.max(1, Math.round(totalS / MP_PROTAMINE_PORTION_S));
  if (!(totalS > 0) || portions === 1) {
    session.engine.giveDrug("protamine", doseMg, "iv");
    return;
  }
  const each = doseMg / portions;
  let given = 0;
  let acc = 0;
  const give = () => {
    session.engine.giveDrug("protamine", each, "iv");
    given++;
  };
  give();
  const off = session.onStep((dt) => {
    acc += dt;
    while (acc >= MP_PROTAMINE_PORTION_S - 1e-9 && given < portions) {
      acc -= MP_PROTAMINE_PORTION_S;
      give();
    }
    if (given >= portions) off();
  });
}

/**
 * The session's own state write, without the attending's gate. Declaring the case's context is case
 * setup, not an operator action: the attending refuses 'drug' during the brief, and a declaration lost
 * there would leave a variant run on the lab's defaults. PciLabSession keeps the write private; the
 * session should declare the context itself at construction (reported as out of scope).
 */
function writeSetup(session: PciLabSession, f: (x: PciState) => PciState): void {
  (session as unknown as { update: (f: (x: PciState) => PciState) => void }).update(f);
}

/**
 * Declare the case's antithrombotic context from the run's variant, as case setup (ungated). Tried when
 * the console opens and, while the context is still missing, on every lab step until it is there.
 */
export function declareRunContext(session: PciLabSession): boolean {
  if (antithromboticContextOf(session.st)) return true;
  const ctx = antithromboticContextForRun(session.resolved.seed, session.s);
  if (!ctx) return true;
  writeSetup(session, (x) => declareAntithrombotic(x, ctx));
  return antithromboticContextOf(session.st) !== null;
}

function useDeclaredContext(session: PciLabSession) {
  useEffect(() => {
    if (declareRunContext(session)) return;
    const off = session.onStep(() => {
      if (declareRunContext(session)) off();
    });
    return off;
  }, [session]);
}

function ActPanel({ session, guided, rec }: { session: PciLabSession; guided: boolean; rec: AntithromboticRecord }) {
  const st = session.st;
  const device = actDeviceOf(st);
  const clock = actClockOf(st, rec);
  const target = actTargetOf(st, device, rec);
  const measure = () => {
    const crew = session.crew;
    if (crew) crew.team.intent({ raw: "ACT, please.", intent: { k: "act" } }, "button");
    else {
      const v = session.engine.measureAct();
      apply(session, (x) => recordAct(x, v));
    }
  };
  return (
    <Section title="ACT">
      <Row label="Machine">{MACHINE_LABEL[device]}</Row>
      <Row label="Last ACT">{rec.lastAct ? `${Math.round(rec.lastAct.value)} s, ${minutes(clock.sinceActS)}` : "not measured"}</Row>
      <Row label="Last anticoagulant dose">{minutes(clock.sinceDoseS)}</Row>
      {clock.due && <div className="text-[12px] text-warn">Nurse: {clock.sinceActS !== null ? `${Math.floor(clock.sinceActS / 60)} minutes since the last ACT.` : "no ACT since the heparin."} Shall I run one?</div>}
      <button className="btn !py-1 text-[12px]" onClick={measure}>
        Measure ACT
      </button>
      {guided && (
        <div className="text-[11px] text-ink-faint">
          Teaching aid: target {target.minS}
          {target.maxS ? `-${target.maxS}` : "+"} s ({MACHINE_LESSON[device]} in the lesson table; {target.source}).
          {target.note ? ` ${target.note}` : ""} Recheck every 20-30 minutes.
        </div>
      )}
    </Section>
  );
}

function AnticoagulantPanel({ session, guided, rec, weightKg, crcl }: { session: PciLabSession; guided: boolean; rec: AntithromboticRecord; weightKg: number; crcl: number }) {
  const [heparinU, setHeparinU] = useState(NaN);
  const [heparinRoute, setHeparinRoute] = useState<"iv" | "ia">("iv");
  const [bivBolus, setBivBolus] = useState(() => start(guided, BIVALIRUDIN.bolusMgKg));
  const [bivRate, setBivRate] = useState(() => start(guided, BIVALIRUDIN.infusionMgKgH));
  const giveHeparin = () => {
    const u = pos(heparinU);
    if (!u) return;
    if (!apply(session, (x) => giveDrug(session.s, session.g, x, "heparin", u, heparinRoute))) return;
    session.engine.giveDrug("heparin", u, heparinRoute);
  };
  const giveBivalirudin = () => {
    const bolusMg = Math.round(pos(bivBolus) * weightKg * 10) / 10;
    const rate = pos(bivRate);
    if (!bolusMg && !rate) return;
    const ok = apply(session, (x) => orderIvAgent(session.s, session.g, x, { drug: "bivalirudin", bolus: bolusMg, rate, patient: { weightKg, crclMlMin: crcl } }).st);
    if (!ok) return;
    if (bolusMg > 0) session.engine.giveDrug("bivalirudin", bolusMg, "iv");
    if (rate > 0) session.engine.startInfusion({ drug: "bivalirudin", rate });
  };
  const hep = heparinBolusU(weightKg, rec.ivAntiplatelet);
  const biv = ivRegimen("bivalirudin", { weightKg, crclMlMin: crcl });
  const hit = antithromboticContextOf(session.st)?.hit ?? antithromboticVariant(session.resolved.seed)?.hit ?? false;
  return (
    <Section title="Anticoagulant">
      <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-ink-soft">
        Heparin <Num value={heparinU} onChange={setHeparinU} label="Heparin dose (units)" step={500} /> U
        <select className={SELECT} value={heparinRoute} onChange={(e) => setHeparinRoute(e.target.value === "ia" ? "ia" : "iv")} aria-label="Heparin route">
          <option value="iv">IV</option>
          <option value="ia">Through the arterial sheath</option>
        </select>
        <button className="btn !py-1 text-[12px]" onClick={giveHeparin}>
          Give
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-ink-soft">
        Bivalirudin <Num value={bivBolus} onChange={setBivBolus} label="Bivalirudin bolus (mg/kg)" step={0.05} /> mg/kg, then
        <Num value={bivRate} onChange={setBivRate} label="Bivalirudin infusion (mg/kg/h)" step={0.05} /> mg/kg/h
        <button className="btn !py-1 text-[12px]" onClick={giveBivalirudin}>
          Give
        </button>
      </div>
      {guided && (
        <div className="text-[11px] text-ink-faint">
          Teaching aid:{" "}
          {hit
            ? `suspected type 2 HIT: every heparin product stops, the heparinised flushes and pressure line included, and bivalirudin is used (${HIT_RULES.allHeparin.who} ${HIT_RULES.allHeparin.loc}).`
            : `heparin ${hep.rangeUPerKg[0]}-${hep.rangeUPerKg[1]} U/kg (${hep.rangeU[0]}-${hep.rangeU[1]} U; ${hep.source.who} ${hep.source.loc}).`}{" "}
          Bivalirudin {BIVALIRUDIN.bolusMgKg} mg/kg, then {biv.rate} mg/kg/h at this creatinine clearance; no antidote.
        </div>
      )}
    </Section>
  );
}

const IV_LABEL: Record<Exclude<IvAgent, "bivalirudin">, string> = { eptifibatide: "Eptifibatide", tirofiban: "Tirofiban", cangrelor: "Cangrelor" };
const IV_DEFAULTS: Record<Exclude<IvAgent, "bivalirudin">, { bolus: number; rate: number }> = {
  eptifibatide: { bolus: EPTIFIBATIDE.bolusUgKg, rate: EPTIFIBATIDE.infusionUgKgMin },
  tirofiban: { bolus: TIROFIBAN.bolusUgKg, rate: TIROFIBAN.infusionUgKgMin },
  cangrelor: { bolus: CANGRELOR.bolusUgKg, rate: CANGRELOR.infusionUgKgMin },
};

function IvAntiplateletPanel({ session, guided, weightKg, crcl }: { session: PciLabSession; guided: boolean; weightKg: number; crcl: number }) {
  const [drug, setDrug] = useState<Exclude<IvAgent, "bivalirudin">>("eptifibatide");
  const [bolus, setBolus] = useState(() => start(guided, IV_DEFAULTS.eptifibatide.bolus));
  const [rate, setRate] = useState(() => start(guided, IV_DEFAULTS.eptifibatide.rate));
  const [msg, setMsg] = useState<string | null>(null);
  const choose = (d: Exclude<IvAgent, "bivalirudin">) => {
    setDrug(d);
    setBolus(start(guided, IV_DEFAULTS[d].bolus));
    setRate(start(guided, IV_DEFAULTS[d].rate));
  };
  const order = () => {
    const totalUg = Math.round(pos(bolus) * weightKg);
    const r0 = pos(rate);
    if (!totalUg && !r0) return;
    let refused: string | null = null;
    const ok = apply(session, (x) => {
      const r = orderIvAgent(session.s, session.g, x, { drug, bolus: totalUg, rate: r0, patient: { weightKg, crclMlMin: crcl } });
      refused = r.refused;
      return r.st;
    });
    setMsg(refused);
    if (!ok || refused) return;
    if (totalUg > 0) session.engine.giveDrug(drug as DrugId, totalUg, "iv");
    if (r0 > 0) session.engine.startInfusion({ drug: drug as InfusionDrug, rate: r0 });
  };
  const reg = ivRegimen(drug, { weightKg, crclMlMin: crcl });
  return (
    <Section title="IV antiplatelet">
      <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-ink-soft">
        <select className={SELECT} value={drug} onChange={(e) => choose(e.target.value as Exclude<IvAgent, "bivalirudin">)} aria-label="IV antiplatelet agent">
          {(Object.keys(IV_LABEL) as Exclude<IvAgent, "bivalirudin">[]).map((d) => (
            <option key={d} value={d}>
              {IV_LABEL[d]}
            </option>
          ))}
        </select>
        bolus <Num value={bolus} onChange={setBolus} label="Bolus (µg/kg)" /> µg/kg, infusion
        <Num value={rate} onChange={setRate} label="Infusion (µg/kg/min)" step={0.025} /> µg/kg/min
        <button className="btn !py-1 text-[12px]" onClick={order}>
          Start
        </button>
      </div>
      {msg && <div className="text-[12px] text-warn">Pharmacist: {msg}</div>}
      {guided && (
        <div className="text-[11px] text-ink-faint">
          Teaching aid: {IV_LABEL[drug]} {reg.bolusPerKg} µg/kg{reg.boluses > 1 ? ` twice, ${reg.bolusGapMin} minutes apart` : ""}, then {reg.rate} µg/kg/min at this creatinine clearance
          {reg.brilakisRate !== undefined ? ` (Brilakis: ${reg.brilakisRate})` : ""}. {reg.notes.join(" ")} With any of them: heparin 50-70 U/kg and an ACT of 200-250 s.
        </div>
      )}
    </Section>
  );
}

const RUNNING_LABEL: Record<RunningAgent, string> = { ...IV_LABEL, bivalirudin: "Bivalirudin", gp2b3a: "GP IIb/IIIa inhibitor" };

function InfusionsPanel({ session, rec }: { session: PciLabSession; rec: AntithromboticRecord }) {
  const running = Object.entries(rec.infusions) as [RunningAgent, { rate: number | null; since: number }][];
  if (!running.length) return null;
  const stop = (d: RunningAgent) => {
    if (!apply(session, (x) => stopAgentInfusion(x, d))) return;
    // the legacy GP IIb/IIIa inhibitor of the thrombus bail-out is not an engine infusion
    if (d !== "gp2b3a") session.engine.stopInfusion(d);
  };
  return (
    <Section title="Running">
      {running.map(([d, r]) => (
        <div key={d} className="flex items-center justify-between gap-2 text-[12px] text-ink-soft">
          <span>
            {RUNNING_LABEL[d]} {r.rate ? `${r.rate} ${d === "bivalirudin" ? "mg/kg/h" : "µg/kg/min"}` : "(bolus only)"}, since {minutes(Math.max(0, session.st.t - r.since))}
          </span>
          <button className="btn !py-1 text-[12px]" onClick={() => stop(d)}>
            Stop
          </button>
        </div>
      ))}
    </Section>
  );
}

const ORAL_LABEL: Record<OralAntiplatelet, string> = { aspirin: "Aspirin", clopidogrel: "Clopidogrel", prasugrel: "Prasugrel", ticagrelor: "Ticagrelor" };

function OralPanel({ session, guided }: { session: PciLabSession; guided: boolean }) {
  const [drug, setDrug] = useState<OralAntiplatelet>("clopidogrel");
  const [mg, setMg] = useState(() => start(guided, ORAL_LOADS.clopidogrel.loadMg));
  const [route, setRoute] = useState<"oral" | "crushed">("oral");
  const give = () => {
    const dose = pos(mg);
    if (!dose) return;
    if (!apply(session, (x) => giveOralLoad(session.s, session.g, x, drug, dose, route))) return;
    session.engine.giveDrug(drug, dose, route);
  };
  return (
    <Section title="Oral load">
      <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-ink-soft">
        <select
          className={SELECT}
          value={drug}
          onChange={(e) => {
            const d = e.target.value as OralAntiplatelet;
            setDrug(d);
            setMg(start(guided, ORAL_LOADS[d].loadMg));
          }}
          aria-label="Oral antiplatelet"
        >
          {(Object.keys(ORAL_LABEL) as OralAntiplatelet[]).map((d) => (
            <option key={d} value={d}>
              {ORAL_LABEL[d]}
            </option>
          ))}
        </select>
        <Num value={mg} onChange={setMg} label="Dose (mg)" /> mg
        <select className={SELECT} value={route} onChange={(e) => setRoute(e.target.value === "crushed" ? "crushed" : "oral")} aria-label="Route">
          <option value="oral">Swallowed</option>
          <option value="crushed">Crushed</option>
        </select>
        <button className="btn !py-1 text-[12px]" onClick={give}>
          Give
        </button>
      </div>
      {guided && <div className="text-[11px] text-ink-faint">Teaching aid: {ORAL_LOADS[drug].text} ({ORAL_LOADS[drug].source.who} {ORAL_LOADS[drug].source.loc}). After cangrelor: ticagrelor at any time, clopidogrel or prasugrel immediately after it stops.</div>}
    </Section>
  );
}

function ProtaminePanel({ session, guided, rec }: { session: PciLabSession; guided: boolean; rec: AntithromboticRecord }) {
  const [mg, setMg] = useState(NaN);
  const [overMin, setOverMin] = useState(() => start(guided, PROTAMINE_RULES.oxfordOverMin));
  const give = () => {
    const dose = pos(mg);
    if (!dose) return;
    // an empty 'over' field is a push
    if (!apply(session, (x) => giveProtamine(session.s, session.g, x, { doseMg: dose, overMin: pos(overMin) }))) return;
    deliverProtamine(session, dose, pos(overMin));
    driveProtamineReaction(session);
  };
  const st = session.st;
  // the heparin on board for the teaching aid: every dose the patient has had (the engine's running total,
  // which includes the heparin given before the case), timed from the last heparin in the lab or else
  // from the start of the case
  let lastHeparinT: number | null = null;
  for (let i = st.log.length - 1; i >= 0 && lastHeparinT === null; i--) if (st.log[i].kind === "heparin") lastHeparinT = st.log[i].t;
  const totalU = guided ? Math.max(rec.heparinU, session.engine.pharm.st.totals.heparin ?? 0) : 0;
  const calc = protamineDose(totalU, (st.t - (lastHeparinT ?? 0)) / 60);
  return (
    <Section title="Protamine">
      <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-ink-soft">
        <Num value={mg} onChange={setMg} label="Protamine dose (mg)" /> mg over
        <Num value={overMin} onChange={setOverMin} label="Over (minutes)" /> min
        <button className="btn !py-1 text-[12px]" onClick={give}>
          Give
        </button>
      </div>
      {guided && (
        <div className="text-[11px] text-ink-faint">
          Teaching aid: only once all coronary equipment is out. {totalU > 0 ? `For ${Math.round(totalU)} U of heparin given${totalU > rec.heparinU ? " (including the dose before the case)" : ""}: Brilakis ${calc.brilakisMg[0].toFixed(0)}-${calc.brilakisMg[1].toFixed(0)} mg, Oxford ${calc.oxfordMg[0].toFixed(0)}-${calc.oxfordMg[1].toFixed(0)} mg${calc.oxfordReduced ? " (less after 15 minutes)" : ""}; ` : ""}
          never above {PROTAMINE_RULES.maxMg} mg, no faster than {PROTAMINE_RULES.maxRateMgPerMin} mg/min (Oxford: over {PROTAMINE_RULES.oxfordOverMin} minutes). Watch for hypotension {PROTAMINE_RULES.reactionOnsetMin[0]}-{PROTAMINE_RULES.reactionOnsetMin[1]} minutes later. Bivalirudin and the IV antiplatelet agents have no antidote.
        </div>
      )}
    </Section>
  );
}

function HitPanel({ session, rec }: { session: PciLabSession; rec: AntithromboticRecord }) {
  const v = antithromboticVariant(session.resolved.seed);
  const st = session.st;
  const work = hitWorkupOf(st);
  const flush = rec.flush;
  if (!v?.hit) return null;
  return (
    <Section title="Pre-case chart">
      {v.chart && (
        <div className="space-y-0.5 text-[12px] text-ink-soft">
          {v.chart.platelets.map((p) => (
            <Row key={p.day} label={p.day === 0 ? "Platelets, admission" : `Platelets, day ${p.day}`}>
              {p.count} × 10⁹/L
            </Row>
          ))}
          <div className="text-[11px] text-ink-faint">{v.chart.note}</div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-ink-soft">
        4Ts pretest probability
        <select className={SELECT} value={work.fourTs ?? ""} onChange={(e) => e.target.value && apply(session, (x) => recordFourTs(x, e.target.value as FourTs))} aria-label="4Ts pretest probability">
          <option value="">Not scored</option>
          <option value="low">Low</option>
          <option value="not-low">Not low</option>
        </select>
        <button className="btn !py-1 text-[12px]" disabled={work.antibodyOrdered} onClick={() => apply(session, (x) => orderHitAntibody(x))}>
          {work.antibodyOrdered ? "Antibody test sent" : "Send HIT antibody test"}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-ink-soft">
        Flushes and pressure line
        <select className={SELECT} value={flush} onChange={(e) => apply(session, (x) => setFlushSolution(x, e.target.value as FlushSolution))} aria-label="Flush saline">
          <option value="heparinised">Heparinised saline (lab standard)</option>
          <option value="heparin-free">Heparin-free saline</option>
        </select>
      </div>
    </Section>
  );
}

export default function DrugsConsole({ session }: PciConsoleProps) {
  usePciSession(session);
  useDeclaredContext(session);
  const guided = labScreens(session.policy).teachingAids;
  const weightKg = session.engine.profile.weightKg;
  const crcl = session.engine.profile.renal.crclMlMin;
  const st = session.st;
  // the record, rebuilt once per change of what it reads (the log only grows), not once per panel per render
  const rec = useMemo(() => antithromboticOf(st), [st.log, st.heparinGiven, st.act]);
  return (
    <div className="space-y-2 text-[13px]" aria-label="Drugs and ACT">
      <Row label="Weight">{weightKg} kg</Row>
      <Row label="Creatinine clearance">{crcl} mL/min</Row>
      <HitPanel session={session} rec={rec} />
      <ActPanel session={session} guided={guided} rec={rec} />
      <AnticoagulantPanel session={session} guided={guided} rec={rec} weightKg={weightKg} crcl={crcl} />
      <IvAntiplateletPanel session={session} guided={guided} weightKg={weightKg} crcl={crcl} />
      <InfusionsPanel session={session} rec={rec} />
      <OralPanel session={session} guided={guided} />
      <ProtaminePanel session={session} guided={guided} rec={rec} />
      <div className="text-[11px] text-ink-faint">{TEACHING_VALUES_NOTE}</div>
    </div>
  );
}
