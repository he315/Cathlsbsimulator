import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useProcedureStore, setLabReporter, launchToCase } from "../../state/useProcedureStore";
import { useLabLaunch, peekLaunch } from "../../state/useLabLaunchStore";
import type { Workspace } from "../../simulation/session/caseSession";
import { PROCEDURE_SCENARIOS, DEFAULT_SCENARIO_ID, isScenarioStart } from "../../simulation/session/scenarios/index";
import { INDICATION_LABEL } from "../../simulation/patient/patient";
import type { MentorUtterance } from "../../mentor/types";
import Simulator from "../sim/Simulator";
import { doseSince, type DiagnosticLabSession, type LabStart } from "../sim/labSession";
import AngioPci from "./AngioPci";
import HaemoMonitor from "../lab/HaemoMonitor";
import MentorVoice from "../mentor/MentorVoice";
import UltrasoundView from "../access/UltrasoundView";
import AccessFluoroView from "../access/AccessFluoroView";
import { ChartPanel, OrdersPanel, TablePanel, ClosurePanel, RecoveryPanel, HandoverPanel, LogPanel, AccessPicker, clock } from "../access/panels";
import CaseTipsPanel from "../access/CaseTipsPanel";
import AdHocGate from "../access/AdHocGate";
import { ADHOC_GATE_TIP_DEPTH, adHocGateTips, adHocTipContext, deferralReasonsApplying } from "../../simulation/session/adhoc";
import { clockText } from "../access/orders/Heparin";
import { caseTipContexts, caseTipLimits, selectCaseTips } from "../access/caseTips";
import { loadTips, loadedTips, tipsVisible } from "../lab/useLabTips";
import { DischargePanel } from "../access/panels/DischargePanel";
import { dischargeOf, dischargeTab } from "../../simulation/session/modules/discharge";

// ===========================================================================
// Full case: arrival to handover on one clock (simulation/session/caseSession.ts).
// The trainee moves between workspaces in any order: the chart and time-out,
// ultrasound-guided access, fluoroscopy for the wire and catheter, the table
// for flushing and exchanges, the angiogram (the diagnostic lab, then ad hoc
// PCI if needed), closure, recovery and the handover note. The patient engine
// runs throughout; long steps run as a time-lapse.
//
// A lesson or case link opens a named scenario at a start stage
// (useLabLaunch("procedure"): scenario, start, access, mode, seed,
// workspace); the scenario picker lists the registry except held-out exams;
// 'New patient' opens a random case. A case past the chart is played to its
// stage step by step while 'Preparing the patient' shows. Dev hooks (DEV
// builds): window.__caseSession.scenario(id, stage?) opens a scenario and
// resolves once the stage is reached, .decisions() lists the ledger,
// .tick(s) advances, .tips() resolves with the tip contexts and the ids the
// tips panel shows now (proc-tip-context).
//
// The right column holds the monitor, the case's tips panel (access,
// diagnostic, PCI and haemodynamic tips for the moment, src/ui/access/
// caseTips.ts; 'Ask for a tip' is the request to the attending), the orders
// and the log.
//
// The hand-over to ad hoc PCI (proc-heparin-act-handover): 'Ad hoc PCI now'
// at the decision gate (below) opens the hand-over gate. A bar under the workspace tabs holds 'Proceed to PCI', which in
// guided and supervised mode stays shut until an ACT at the PCI target has
// been measured after the last heparin dose; the dose, the route, the ACT
// and the IV cannula are in the orders (src/ui/access/orders/Heparin.tsx).
// The heparin still to give and the ACT target show only in guided mode,
// here and in the PCI lab's header. Dev hook: __caseSession.gate() reports
// the gate.
//
// Before that, the ad hoc or delayed PCI decision (proc-adhoc-gate): 'Ad hoc
// PCI decision' in the diagnostic lab (it replaced 'Proceed to ad hoc PCI')
// brings the case back with the decision gate open (src/ui/access/
// AdHocGate.tsx), as does a scenario that opens there. While the decision is
// pending the gate takes the main column, with the tips panel of its own in
// place of the right column's; 'Back to the case' shows the workspaces with
// a bar to reopen it. A case back from the diagnostic lab with the catheter
// still in and no decision yet has a bar with 'Ad hoc PCI decision' too. 'Ad hoc PCI now' goes on to the
// hand-over gate at the table, 'Defer' to closure. Dev hook:
// __caseSession.adhoc() reports the gate, its facts and, once decided, the
// outcome (the reasons that applied are listed only after the decision).
//
// The discharge prescription (proc-discharge-prescription): a 'Discharge'
// tab after the handover, shown once the case has a prescription to write
// (a discharge scenario, or any case that has been to PCI), holds
// src/ui/access/panels/DischargePanel.tsx. It is the lab's own view, not a
// session workspace: while it is open the store's workspace is 'handover',
// so the tips panel reports the case's finish contexts, and the discharge
// module adds its own PCI finish context. A discharge scenario opens on it.
// Dev hook: __caseSession.discharge() reports the module's state (the case
// facts, the prescription as written, whether it is signed, the follow-up).
// ===========================================================================

const WORKSPACES: { id: Workspace; label: string }[] = [
  { id: "chart", label: "Chart" },
  { id: "access", label: "Access" },
  { id: "fluoro", label: "Fluoroscopy" },
  { id: "table", label: "Table" },
  { id: "closure", label: "Closure" },
  { id: "recovery", label: "Recovery" },
  { id: "handover", label: "Handover" },
];

export default function ProcedureLab() {
  const session = useProcedureStore((s) => s.session);
  const stage = useProcedureStore((s) => s.stage);
  const newCase = useProcedureStore((s) => s.newCase);

  // a lesson or case link: on mount and whenever a new request arrives while the lab is open
  useLabLaunch("procedure", (p) => void newCase(launchToCase(p)));

  useEffect(() => {
    // a pending launch opens its own case (the launch effect above takes it)
    const st = useProcedureStore.getState();
    if (!st.session && !st.preparing && !peekLaunch("procedure")) void newCase();
  }, [newCase]);

  // the session clock: wall time plus any pending time-lapse; the screen re-renders at about 8 Hz
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastBump = 0;
    const loop = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      const st = useProcedureStore.getState();
      st.tick(dt);
      if (t - lastBump > 120) {
        lastBump = t;
        st.bump();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    if ((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) {
      // development: advance the session while the pane is hidden (requestAnimationFrame paused)
      (window as unknown as { __caseSession?: unknown }).__caseSession = {
        store: useProcedureStore,
        tick: (s: number) => {
          const st = useProcedureStore.getState();
          for (let k = 0; k < Math.ceil(s / 0.1); k++) st.tick(0.1);
          st.bump();
        },
        /** open a scenario at a stage (the autopilot plays it there); resolves with what is on screen once it is reached */
        scenario: async (id: string, stage?: string) => {
          await useProcedureStore.getState().newCase({ scenario: id, start: isScenarioStart(stage) ? stage : undefined });
          const now = useProcedureStore.getState();
          return { scenario: now.scenarioId, workspace: now.workspace, sheath: now.session?.sheath?.id ?? null, catheterInBody: !!now.session?.catheter?.inBody, notice: now.launchNotice };
        },
        /** the case's decision ledger so far */
        decisions: () => useProcedureStore.getState().session?.decisions() ?? [],
        /** the hand-over gate before ad hoc PCI: open, its doses and ACTs, and why it would refuse now */
        gate: () => {
          const st = useProcedureStore.getState();
          const s = st.session;
          if (!s) return null;
          return { open: s.pciGateOpen, gate: s.pciGate, problem: s.pciGateOpen ? s.pciGateProblem() : null, holds: s.pciGateHolds(), mode: s.mode, stage: st.stage, workspace: st.workspace, events: s.activeEvents(), contrast: s.contrastNow() };
        },
        /** the ad hoc or delayed PCI decision gate: its state, the facts it shows, the tip ids its panel shows (null until the tip module has loaded) and, once decided, the outcome */
        adhoc: () => {
          const st = useProcedureStore.getState();
          const g = st.adhoc;
          const inputs = st.adHocInputs();
          const s = st.session;
          if (!g || !inputs || !s) return null;
          const mod = loadedTips();
          const visible = tipsVisible({ mode: s.mode, helpAskedAt: s.helpAskedAt });
          const tips = mod ? (visible ? adHocGateTips(mod.tipsFor(adHocTipContext(inputs), ADHOC_GATE_TIP_DEPTH)).map((t) => t.id) : []) : null;
          return { gate: g, inputs, tips, tipsVisible: visible, applies: g.outcome ? deferralReasonsApplying(inputs) : null, workspace: st.workspace, pciGateOpen: !!s.pciGateOpen };
        },
        /** the discharge prescription: the case facts, the prescription as written, signed or not, the follow-up (null when the case has none) */
        discharge: () => {
          const s = useProcedureStore.getState().session;
          const m = s ? dischargeOf(s) : undefined;
          if (!s || !m?.state) return null;
          const st = m.state;
          return { case: st.case, available: m.actions.available(), open: st.open, draft: st.draft, signed: st.signed ? { t: st.signed.t, plan: st.signed.plan } : null, missing: m.actions.missing(), followUp: st.followUp, note: st.note, stents: m.actions.stents() };
        },
        /** the tip contexts for the workspace on screen and the tip ids the panel shows under the session's policy */
        tips: async () => {
          const mod = await loadTips();
          const st = useProcedureStore.getState();
          const s = st.session;
          if (!s) return null;
          const contexts = caseTipContexts(s, st.workspace, st.stage);
          const visible = tipsVisible({ mode: s.mode, helpAskedAt: s.helpAskedAt });
          const ids = selectCaseTips(mod, contexts, visible, caseTipLimits(st.workspace)).map((t) => t.id);
          return { mode: s.mode, visible, workspace: st.workspace, stage: st.stage, step: s.accessStep(), events: s.activeEvents(), contexts, ids, shown: s.tipsShown.map((x) => x.id) };
        },
      };
    }
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!session) return <div className="p-6 text-ink-faint text-sm">Preparing the patient…</div>;
  if (stage === "diagnostic" || stage === "pci") return <HandedOver />;
  return <CaseLab />;
}

/** The diagnostic or PCI lab, with the way back to the case. */
function HandedOver() {
  const stage = useProcedureStore((s) => s.stage);
  const h = useProcedureStore((s) => s.handover);
  const engine = useProcedureStore((s) => s.engine);
  const back = useProcedureStore((s) => s.backToCase);
  const openAdHocGate = useProcedureStore((s) => s.openAdHocGate);
  const guided = useProcedureStore((s) => s.session?.mode === "guided");
  useProcedureStore((s) => s.version);
  // the continuous hand-over (C5): the case's own patient engine, the dose so far, the catheter in the aorta and the line as the table left it
  const start = useMemo<LabStart | null>(
    () =>
      h && engine
        ? {
            engine,
            dose: { fluoroS: h.fluoroS, karMGy: h.karMGy, kapGyCm2: h.kapGyCm2 },
            catheterId: h.catheterId,
            air: { line: h.line.lineAir, lumen: h.line.lumenAir },
          }
        : null,
    [h, engine]
  );
  // contrast so far: the hand-over's total plus what this lab has given the same patient since
  const contrast0 = useRef<number | null>(null);
  useEffect(() => {
    contrast0.current = engine ? engine.vitals().contrast.totalMl : null;
  }, [h, engine]);
  const contrastNow = (h?.contrastMl ?? 0) + (engine && contrast0.current !== null ? Math.max(0, engine.vitals().contrast.totalMl - contrast0.current) : 0);
  const onSession = useCallback(
    (ses: DiagnosticLabSession | null) => {
      if (!ses) return;
      setLabReporter(() => {
        const d = doseSince(ses.exposure.dose, start?.dose);
        return { contrastMl: start ? 0 : ses.contrastPushed(), fluoroS: d.fluoroS, karMGy: d.karMGy, kapGyCm2: d.kapGyCm2, patientAdvanced: !!start };
      });
    },
    [start]
  );
  useEffect(() => () => void setLabReporter(null), []);
  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-line bg-base-800 text-[13px]">
        <span className="text-ink-soft">
          {stage === "pci" ? "Ad hoc angioplasty" : "Diagnostic angiography"} through the {h?.access === "femoral" ? "right femoral" : h?.access === "radial-left" ? "left radial" : "right radial"} sheath · heparin {h?.heparinU} U · contrast so far{" "}
          {Math.round(contrastNow)} mL
          {/* a teaching aid: guided mode only */}
          {guided && stage === "pci" && h?.pciReady && h.pciReady.heparinTopUpU > 0 ? ` · heparin still to give: ${h.pciReady.heparinTopUpU} U, ACT target ${h.pciReady.actTargetS[0]}-${h.pciReady.actTargetS[1]} s` : ""}
        </span>
        <span className="flex gap-2">
          {stage === "diagnostic" && (
            <button className="btn" onClick={openAdHocGate} data-adhoc-open>
              Ad hoc PCI decision
            </button>
          )}
          <button className="btn btn-accent" onClick={back}>
            Finished: back to the case
          </button>
        </span>
      </div>
      <div className="flex-1 min-h-0">
        {stage === "pci" ? <AngioPci handover={h && start ? { h, start } : null} /> : <Simulator title="Diagnostic angiography" showObjectives={false} start={start} onSession={onSession} />}
      </div>
    </div>
  );
}

function CaseLab() {
  const s = useProcedureStore((x) => x.session)!;
  const engine = useProcedureStore((x) => x.engine)!;
  useProcedureStore((x) => x.version);
  const workspace = useProcedureStore((x) => x.workspace);
  const setWorkspace = useProcedureStore((x) => x.setWorkspace);
  const newCase = useProcedureStore((x) => x.newCase);
  const act = useProcedureStore((x) => x.act);
  const scenarioId = useProcedureStore((x) => x.scenarioId);
  const notice = useProcedureStore((x) => x.launchNotice);
  const askHelp = useProcedureStore((x) => x.askHelp);
  const adhoc = useProcedureStore((x) => x.adhoc);
  const openAdHocGate = useProcedureStore((x) => x.openAdHocGate);
  const adhocPending = !!adhoc && !adhoc.outcome;
  // back from the diagnostic lab with the catheter still in and no decision yet: the way to the decision (and so to PCI)
  const adhocOffer = !adhoc && s.labsDone.includes("diagnostic") && !!s.catheter?.inBody && !s.pciGateOpen && !s.finished;
  // the gate takes the main column while the decision is pending, until the learner goes back to the case
  const [gateHidden, setGateHidden] = useState(false);
  useEffect(() => setGateHidden(false), [adhoc?.openedAt]);
  const gateShown = adhocPending && !gateHidden;
  // the discharge prescription: the lab's own view after the handover (the store's workspace stays 'handover')
  const hasDischarge = dischargeTab(s, scenarioId).shown;
  const [dischargeShown, setDischargeShown] = useState(false);
  useEffect(() => {
    // a discharge scenario opens on the prescription
    const open = dischargeTab(s, scenarioId).opensOnIt;
    setDischargeShown(open);
    if (open) setWorkspace("handover");
  }, [s, scenarioId, setWorkspace]);
  const showDischarge = dischargeShown && hasDischarge && !gateShown;
  const guided = s.policy.mentor === "full";
  const last = s.attending[s.attending.length - 1];
  const utterance = useMemo<MentorUtterance | null>(
    () =>
      last
        ? {
            id: last.id,
            tWall: last.t,
            ruleId: "case-session",
            level: last.stop ? 5 : last.severity === "safety" ? 3 : 2,
            text: last.text,
            anchor: "plan",
            severity: last.severity,
            blocking: last.stop,
            critical: last.critical,
          }
        : null,
    [last],
  );
  const p = s.profile;
  const imaging = (workspace === "access" || workspace === "fluoro") && !gateShown;
  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 border-b border-line bg-base-800">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-[15px] font-semibold text-ink shrink-0">Full case</h1>
          <span className="chip">
            {p.ageY} y {p.sex === "M" ? "man" : "woman"} · {INDICATION_LABEL[p.indication].toLowerCase()}
          </span>
          <span className="chip font-mono">{clock(s.tS)}</span>
          <span className="chip">{s.mode}</span>
        </div>
        <div className="hidden md:block">
          <AccessPicker />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-2 text-[12px] text-ink-faint">
            Scenario
            <select className="field" value={scenarioId} onChange={(e) => void newCase({ scenario: e.target.value })} aria-label="Scenario">
              {/* held-out exam scenarios are never offered for free practice (the current one stays listed while it is open) */}
              {PROCEDURE_SCENARIOS.filter((sc) => !sc.heldOut || sc.id === scenarioId).map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.title}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-ghost" onClick={() => newCase({ scenario: DEFAULT_SCENARIO_ID })}>
            New patient
          </button>
        </div>
      </div>
      {notice && <div className="notice notice-warn mx-4 mt-2 text-[12px]">{notice}</div>}
      <div className="flex items-center gap-1 px-4 border-b border-line bg-base-800 overflow-x-auto">
        {WORKSPACES.map((w) => (
          <button
            key={w.id}
            className={`tab ${!gateShown && !showDischarge && workspace === w.id ? "tab-active" : ""}`}
            onClick={() => {
              setWorkspace(w.id);
              setDischargeShown(false);
              // a workspace tab shows that workspace; the pending decision waits in its bar
              if (adhocPending) setGateHidden(true);
            }}
          >
            {w.label}
          </button>
        ))}
        {hasDischarge && (
          <button
            className={`tab ${showDischarge ? "tab-active" : ""}`}
            onClick={() => {
              setWorkspace("handover");
              setDischargeShown(true);
              if (adhocPending) setGateHidden(true);
            }}
            data-discharge-tab
          >
            Discharge
          </button>
        )}
      </div>
      {adhocPending && gateHidden && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-line bg-base-700 text-[12px]" data-adhoc-bar>
          <span className="text-ink-soft">Ad hoc or delayed PCI: the decision is pending{adhoc?.interruptedAt !== null && adhoc?.acknowledgedAt === null ? " · a call is waiting" : ""}</span>
          <button className="btn btn-accent" onClick={() => setGateHidden(false)}>
            Open the decision
          </button>
        </div>
      )}
      {adhocOffer && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-line bg-base-700 text-[12px]" data-adhoc-offer>
          <span className="text-ink-soft">Diagnostic study done, the catheter still in: ad hoc PCI or stop and plan?</span>
          <button className="btn btn-accent" onClick={openAdHocGate} data-adhoc-open>
            Ad hoc PCI decision
          </button>
        </div>
      )}
      {s.pciGateOpen && <PciGateBar />}
      {s.busy && (
        <div className="flex items-center gap-3 px-4 py-1.5 border-b border-line bg-base-700 text-[12px] text-ink-soft">
          <span className="led animate-ledpulse bg-accent" style={{ width: 6, height: 6 }} />
          <span>{s.pendingLabel}: {Math.ceil(s.pending)} s to go</span>
          <button className="btn btn-ghost" onClick={() => act((x) => x.runPending())}>
            Skip ahead
          </button>
        </div>
      )}
      {/* below the xl breakpoint the monitor stacks under the main column: while the gate takes it, the
          gate keeps a usable height and the grid scrolls, so the decision controls are reachable */}
      <div className={`flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[1fr_22rem] gap-3 p-3 ${gateShown ? "overflow-y-auto xl:overflow-hidden" : "overflow-hidden"}`}>
        {/* The attending's caption is a subtitle over the imaging views; under the form panels it sits
            in flow below the panel, so it never covers a control the learner needs at narrow widths.
            One wrapper in one place, so switching workspace does not remount the caption. */}
        <div className={`${gateShown ? "min-h-[32rem] xl:min-h-0" : "min-h-0"} min-w-0 relative flex flex-col gap-2`}>
          <div className="flex-1 min-h-0 min-w-0">
            {gateShown ? (
              <AdHocGate key={adhoc?.openedAt} onHide={() => setGateHidden(true)} className="h-full" />
            ) : showDischarge ? (
              <DischargePanel />
            ) : (
              <>
                {workspace === "chart" && <ChartPanel />}
                {workspace === "access" && <UltrasoundView session={s} guided={guided} />}
                {workspace === "fluoro" && <AccessFluoroView session={s} readouts={s.policy.wireReadout || guided} />}
                {workspace === "table" && <TablePanel guided={guided} />}
                {workspace === "closure" && <ClosurePanel />}
                {workspace === "recovery" && <RecoveryPanel />}
                {workspace === "handover" && <HandoverPanel />}
              </>
            )}
          </div>
          <div className={imaging ? "absolute left-0 right-0 bottom-3 flex justify-center pointer-events-none" : "shrink-0 flex justify-center"}>
            <MentorVoice utterance={utterance} mode={s.mode} controls={false} />
          </div>
        </div>
        <div className="min-h-0 flex flex-col gap-3 overflow-y-auto">
          <HaemoMonitor engine={engine} showControls={false} className="shrink-0" />
          {/* while the decision gate takes the main column its own panel holds the tips (the diagnostic finish): one tips panel */}
          {!gateShown && <CaseTipsPanel session={s} workspace={workspace} onAskHelp={askHelp} className="shrink-0" />}
          <OrdersPanel />
          <LogPanel />
        </div>
      </div>
    </div>
  );
}

/**
 * The hand-over gate before ad hoc PCI: what has been given and measured, and the way on. 'Proceed to
 * PCI' is shut in guided and supervised mode until an ACT at target has been measured after the last
 * heparin dose; in independent and exam runs it is open and the decision is scored.
 */
export function PciGateBar() {
  const s = useProcedureStore((x) => x.session)!;
  useProcedureStore((x) => x.version);
  const toPci = useProcedureStore((x) => x.toPci);
  const close = useProcedureStore((x) => x.closePciGate);
  const problem = s.pciGateProblem();
  const held = !!problem && s.pciGateHolds();
  const last = s.acts[s.acts.length - 1] ?? null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-line bg-base-700 text-[12px]" data-pci-gate>
      <span className="text-ink-soft">
        Hand-over to ad hoc PCI · heparin {s.heparinU} U · {last ? `last ACT ${last.act} s at ${clockText(last.t)}` : "no ACT yet"}
        {held ? <span className="text-ink-faint"> · {problem}</span> : null}
      </span>
      <span className="flex gap-2">
        <button className="btn btn-ghost" onClick={close}>
          Not now
        </button>
        <button className="btn btn-accent" disabled={held || s.busy} onClick={toPci} data-pci-gate-proceed>
          Proceed to PCI
        </button>
      </span>
    </div>
  );
}
