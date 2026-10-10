import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { useSeriesStore } from "../../state/useSeriesStore";
import { useInputSystem, GRIP_ORDER_DIAGNOSTIC, type DeviceSlot, type InputSystem } from "../../input";
import { VIEW_PRESETS } from "../../data/viewPresets";
import { CATHETERS } from "../../data/catheters";
import { DiagnosticLabSession, caseForLaunch, labScenarioById, loadLaunchedCase, showPrebrief, type LabStart } from "./labSession";
import LabLayout from "../lab/LabLayout";
import LiveMonitor from "../lab/LiveMonitor";
import ReferenceMonitor from "../lab/ReferenceMonitor";
import TableSideControls from "../lab/TableSideControls";
import HaemoMonitor from "../lab/HaemoMonitor";
import DosePanel from "../lab/DosePanel";
import TableView, { type GauzeView, type TableDrugSyringe } from "../lab/TableView";
import InputCalibration from "../lab/InputCalibration";
import { labScreens, modeLabel } from "../lab/visibility";
import { useAttending } from "../lab/useAttending";
import { useSessionVersion, useSim } from "../lab/useLab";
import AttendingDrawer from "../mentor/AttendingDrawer";
import TechniqueTips from "../lab/TechniqueTips";
import { loadTips, loadedTips, selectTips, useContextTips, useDiagnosticTips, DEFAULT_TIP_LIMIT } from "../lab/useLabTips";
import { registerLabHook } from "../../dev/labHooks";
import MentorVoice from "../mentor/MentorVoice";
import PreBrief from "../mentor/PreBrief";
import Debrief from "../mentor/Debrief";
import { prebriefForCase } from "../../content/mentor/prebriefs";
import { DEFAULT_SETTINGS } from "../../render/xray/adrc";
import TeamBar from "../team/TeamBar";
import Captions from "../team/Captions";
import TeamReport from "../team/TeamReport";
import { useLabLaunch } from "../../state/useLabLaunchStore";
import { chartRows, prebriefWithChart } from "../../mentor/prebrief";
import StudyReport, { type StudyReportRun } from "../lab/StudyReport";
import type { SuctionControls } from "../lab/controls/tabs/BackTableTab";
import {
  FINISH_EVENTS,
  asksMiClass,
  compareStudyReport,
  emptyStudyReport,
  finishContexts,
  finishEvents,
  pciTargetFor,
  reportGrafts,
  studyTruth,
  type StudyReport as StudyReportModel,
} from "../../mentor/report";
import { viewFamily } from "../../mentor/coverage";
import { segmentLabelAt } from "../../mentor/treeSegments";
import type { LabEvent } from "../../content/lab/tips";

/** Where the finish step's events come from in the event log. */
const FINISH_SOURCE = "study-report";

/** The stored cine runs of a case, as the study report lists them (number and view, as on the reference monitor). */
export function reportRuns(series: readonly { number: number; kind: string; caseId: string; cArm: { laoRao: number; cranialCaudal: number } }[], caseId: string): StudyReportRun[] {
  return series.filter((x) => x.caseId === caseId && x.kind === "cine").map((x) => ({ number: x.number, label: `Run ${x.number}, ${viewFamily(x.cArm)}` }));
}

/**
 * Hold the finish step's events in the session's event log while the report is open (and drop them
 * when it closes): `want` are the events the report and the case raise now (finishEvents), `added`
 * the ones this step put there itself. An event the log already held from elsewhere (a scenario's
 * case event such as 'cto') is left alone.
 */
export function syncFinishEvents(log: DiagnosticLabSession["events"], want: readonly LabEvent[], added: Set<LabEvent>): void {
  for (const e of FINISH_EVENTS) {
    const on = want.includes(e);
    if (on && !added.has(e) && !log.isActive(e)) {
      log.hold([e], undefined, FINISH_SOURCE);
      added.add(e);
    } else if (!on && added.has(e)) {
      log.clear(e);
      added.delete(e);
    }
  }
}

// The 3D anatomy is a teaching aid (guided practice only) and heavy: its own chunk, loaded on demand.
const AnatomyScene = lazy(() => import("./AnatomyScene"));

// ---------------------------------------------------------------------------
// The diagnostic cath lab (FreeLab, the assessment section, the procedure lab).
// A full-screen lab: live and reference monitors, the haemodynamic monitor,
// the dose display, the table strip and the table-side controls. Imaging only
// while a pedal is held; the operator reads the image and the pressure trace,
// and nothing on the screens says what the catheter is doing.
// ---------------------------------------------------------------------------

interface Props {
  title?: string;
  /** hints off whatever the level (the assessment section passes this for daily challenges) */
  hideHints?: boolean;
  /** show the case objectives (when the policy allows) */
  showObjectives?: boolean;
  onExit?: () => void;
  headerActions?: React.ReactNode;
  /** the continuous hand-over from the full case (its patient engine, dose and catheter); stable per hand-over */
  start?: LabStart | null;
  /** the lab session in use (the full case reads its totals when the case comes back) */
  onSession?: (s: DiagnosticLabSession | null) => void;
}

const DIAG_PRESENT: DeviceSlot[] = ["sheath", "catheter", "wire035"];

const MEMORY_KEYS = ["Digit6", "Digit7", "Digit8", "Digit9"];

export default function Simulator({ start = null, onSession, ...props }: Props) {
  const caseId = useSim((s) => s.caseData.id);
  const sessionStart = useSim((s) => s.sessionStart);
  const input = useInputSystem({ loop: false, gripOrder: GRIP_ORDER_DIAGNOSTIC, present: DIAG_PRESENT, initialGrip: "catheter" });
  const [session, setSession] = useState<DiagnosticLabSession | null>(null);

  // a lesson, case or the case library opened the lab at a named scenario (found-launch-links); the
  // full case's hand-over (start) is its own patient, so a launch waits for the free lab
  useLabLaunch(
    "cathlab",
    (p) => {
      const l = caseForLaunch(p, useSimulatorStore.getState().caseData);
      if (l) loadLaunchedCase(l.c, l.mode);
    },
    !start
  );

  // one session per case (and per restart): patient, imaging, C-arm, table, syringe, recorder
  useEffect(() => {
    useSimulatorStore.getState().setPedalImaging(true);
    const s = new DiagnosticLabSession(useSimulatorStore, input, start);
    provideSuctionControls(s);
    useSeriesStore.getState().clear();
    setSession(s);
    onSession?.(s);
    return () => {
      input.releaseAll();
      onSession?.(null);
      s.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, sessionStart, input, start]);

  useEffect(
    () => () => {
      const st = useSimulatorStore.getState();
      st.setPedal({ fluoro: false, cine: false });
      st.setPedalImaging(false);
    },
    []
  );

  if (!session) return <div className="grid h-full place-items-center bg-base-900 text-[13px] text-ink-faint">Preparing the lab</div>;
  return <LabScreen key={`${caseId}:${sessionStart}`} session={session} input={input} handedOver={!!start} {...props} />;
}

/** The lab for a given session (exported for render tests). */
export function LabScreen({
  session,
  input,
  title = "Cath lab",
  hideHints = false,
  showObjectives = true,
  onExit,
  headerActions,
  handedOver = false,
}: Omit<Props, "start" | "onSession"> & { session: DiagnosticLabSession; input: InputSystem | null; handedOver?: boolean }) {
  const caseData = useSim((s) => s.caseData);
  const policy = useSim((s) => s.policy);
  const finished = useSim((s) => s.finished);
  const finishing = useSim((s) => s.finishing);
  const reset = useSim((s) => s.reset);
  const series = useSeriesStore((s) => s.series);
  const screens = labScreens(policy);
  const hintsAllowed = !hideHints && screens.hints !== "off";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [helpAskedAt, setHelpAskedAt] = useState<number | null>(null);
  const [show3D, setShow3D] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [debriefClosed, setDebriefClosed] = useState(false);
  // the finish step (diag-study-report): 'Finish study' opens the study report over the live monitor;
  // the tips move to the finish phase (the drawer shows them in guided practice) and the case
  // finishes when the report is submitted. The draft resets with the case (LabScreen's key).
  const [draft, setDraft] = useState<StudyReportModel>(() => emptyStudyReport(reportGrafts(useSimulatorStore.getState().caseData)));
  const draftRef = useRef<StudyReportModel | null>(null);
  draftRef.current = finishing && !finished ? draft : null;
  const finishAdded = useRef(new Set<LabEvent>());
  const openFinish = () => {
    useSimulatorStore.getState().beginFinish();
    if (screens.attendingDrawer) setDrawerOpen(true);
  };
  const submitReport = () => {
    const st = useSimulatorStore.getState();
    const truth = studyTruth({
      caseData: st.caseData,
      regions: session.engine.flow.regions,
      segmentOf: (v, p) => segmentLabelAt(session.tree, v, p),
      runs: useSeriesStore
        .getState()
        .series.filter((x) => x.caseId === st.caseData.id && x.kind === "cine")
        .map((x) => ({ number: x.number, injected: x.injected })),
      // a wall is credited only to an injection that was made and filmed
      injectionsMade: st.filmedInjectionSides,
      complication: st.dissection || st.arrhythmia === "vf" || st.events.some((e) => e.code === "air-embolism"),
    });
    const tWall = session.wall();
    st.submitStudyReport({ report: draft, comparison: compareStudyReport(draft, truth, tWall), pciTarget: pciTargetFor(draft, truth), submittedAt: tWall });
  };
  const tableRef = useRef<HTMLDivElement>(null);
  // the dev hook reads the help request without re-registering
  const helpRef = useRef<number | null>(helpAskedAt);
  helpRef.current = helpAskedAt;

  useEffect(() => {
    if (!screens.attendingDrawer) setDrawerOpen(false);
  }, [screens.attendingDrawer]);

  // the tips are in the finish phase while the report is open; the report's events follow the draft
  useEffect(() => {
    const open = finishing && !finished;
    session.setFinishStep(open);
    syncFinishEvents(session.events, open ? finishEvents(draft, caseData) : [], finishAdded.current);
  }, [session, finishing, finished, draft, caseData]);
  // a session that ends (a new case, a restart) leaves the store's finish step closed
  useEffect(() => () => useSimulatorStore.getState().cancelFinish(), [session]);

  // the hands: keyboard on the window, mouse lock and trackpad on the table strip
  useEffect(() => {
    const el = tableRef.current;
    if (!el || !input) return;
    return input.attach(el);
  }, [input]);

  // the frame loop: hands, patient, C-arm and table, store
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      session.step(Math.min(0.1, (now - last) / 1000));
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const dev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;
    if (dev) {
      const w = window as unknown as Record<string, unknown>;
      w.__lab = session;
      // step the lab by hand when the page is hidden (requestAnimationFrame paused)
      w.__labStep = (seconds = 1 / 60, dt = 1 / 60) => {
        for (let t = 0; t < seconds - 1e-9; t += dt) session.step(dt);
      };
      // the rod mechanics' cost bench (diag-rod-physics COST_RULE): scripted JL4 and JR4 with the image drawn every frame
      w.__labPhysicsBench = (seconds = 60) => {
        const draw = (w as { __fluoroDraw?: (m?: "fluoro" | "cine") => void }).__fluoroDraw;
        return session.benchPhysics(seconds, draw ? () => draw("fluoro") : undefined);
      };
      // the dev hook's tips() is synchronous: start the tip registry chunk loading now (once per page;
      // useLabTips caches it at module scope, so a loadCase or restart does not empty tips() again)
      void loadTips();
    }
    // window.__lab.diagnostic (DEV): the tip context, the tips the drawer would show, the session view.
    // tips() returns [] only in the moment before the tip registry chunk first resolves on the page.
    const offHook = registerLabHook("diagnostic", {
      context: () => session.tipContext(),
      tips: () => {
        const mod = loadedTips();
        if (!mod) void loadTips();
        return selectTips(mod, finishContexts(session.tipContext(), draftRef.current), { mode: useSimulatorStore.getState().policy.mode, helpAskedAt: helpRef.current }, DEFAULT_TIP_LIMIT).map((t) => t.id);
      },
      state: () => ({
        ...session.sessionView(),
        physics: session.physicsReading,
        mechanics: session.physics?.active ? (session.physicsPreparing ? "rod-preparing" : "rod") : "simple",
        mechanicsReason: session.physicsBanner ?? session.physicsMode.reason,
        events: session.events.activeEntries(),
        modules: session.modules.map((m) => m.id),
        // the finish step's study report draft while it is open (diag-study-report), else null
        studyReport: draftRef.current,
      }),
      step: (seconds: number, dt = 1 / 60) => {
        for (let t = 0; t < seconds - 1e-9; t += dt) session.step(dt);
      },
      events: () => session.activeEvents(),
    });
    return () => {
      cancelAnimationFrame(raf);
      offHook();
    };
  }, [session]);

  // the end of the case releases everything held
  useEffect(() => {
    if (finished) input?.releaseAll();
  }, [finished, input]);

  // lab keys that are not hands or pedals (S8 owns F, C, W, S, A, D, J, K, L, P, Q, E, Z, Space, Tab, 1-5, arrows)
  useEffect(() => {
    const taken = () => new Set(input ? Object.values(input.getSettings().keyboard.keymap).flat() : []);
    const isField = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || !!t?.isContentEditable;
    };
    const down = (e: KeyboardEvent) => {
      if (isField(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (taken().has(e.code)) return;
      const st = useSimulatorStore.getState();
      const mem = MEMORY_KEYS.indexOf(e.code);
      if (mem >= 0) {
        if (!e.repeat) {
          if (e.shiftKey) session.storeMemory(mem);
          else session.driveMemory(mem);
        }
      } else if (e.repeat) return;
      else if (e.code === "KeyB") session.holdBreath(session.breathHoldSince === null);
      else if (e.code === "KeyG") {
        const fields = [25, 20, 16, 12] as const;
        st.setField(fields[(fields.indexOf(st.imaging.field) + 1) % fields.length]);
      } else if (e.code === "KeyN") session.storeFluoro();
      else if (e.code === "KeyX") session.table.set({ x: 0, y: 0 });
      else if (e.code === "KeyH" && hintsAllowed) {
        setDrawerOpen(true);
        attending.askHelp();
      } else return;
      e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      if (MEMORY_KEYS.includes(e.code) && session.drivingMemory === MEMORY_KEYS.indexOf(e.code)) session.driveMemory(null);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, input, hintsAllowed]);

  // a case handed over from the full case had its time-out in the chart workspace
  const attending = useAttending(session, policy, { timeOutDone: handedOver });
  // the tips' setup phase lasts until the time-out
  useEffect(() => {
    session.setTimeOutDone(attending.timeOutDone);
  }, [session, attending.timeOutDone]);
  const crew = session.crew;
  // a named scenario's chart: its rows and the attending's questions about what it plants
  const prebrief = useMemo(() => prebriefWithChart(prebriefForCase(caseData), caseData, caseData.scenarioId ? labScenarioById(caseData.scenarioId) : undefined), [caseData]);
  const chart = useMemo(() => (caseData.chart ? chartRows(caseData.chart) : undefined), [caseData]);
  // a case with a chart opens on the pre-brief in every mode, also where no time-out is required;
  // the state resets with the case (LabScreen's key holds the case id)
  const [chartBriefDone, setChartBriefDone] = useState(false);

  const header = (
    <>
      <h1 className="truncate text-[15px] font-semibold text-ink">{title}</h1>
      <span className="truncate text-[12px] text-ink-faint" title={caseData.name}>
        {caseData.name}
      </span>
      <span className="chip shrink-0">{modeLabel(policy)}</span>
      <span className="flex-1" />
      {headerActions}
      {screens.attendingDrawer && (
        <button className={`btn btn-ghost h-8 ${drawerOpen ? "!text-accent" : ""}`} onClick={() => setDrawerOpen((v) => !v)} aria-pressed={drawerOpen}>
          Attending
        </button>
      )}
      {!screens.attendingDrawer && hintsAllowed && !finished && (
        <button className="btn btn-ghost h-8" onClick={() => attending.askHelp()} title="Ask the attending (counted in your debrief)">
          Ask the attending
        </button>
      )}
      <button className="btn btn-ghost h-8" onClick={() => setCalibrating(true)} title="Keyboard, mouse, trackpad, gamepad and pedals">
        Input devices
      </button>
      {!finished && !finishing && (
        <button className="btn btn-accent h-8" onClick={openFinish}>
          Finish study
        </button>
      )}
      {finished && (
        <button className="btn btn-accent h-8" onClick={reset}>
          Try again
        </button>
      )}
      {onExit && (
        <button className="btn h-8" onClick={onExit}>
          Exit
        </button>
      )}
    </>
  );

  // the debrief; the submitted study report's comparison and gaps are in it (useAttending passes the
  // report to assessAttempt, whose study-report check runs inside buildDebrief)
  const debriefModel = attending.assessment?.debrief ?? null;
  const runs = useMemo(() => reportRuns(series, caseData.id), [series, caseData.id]);

  let modal: React.ReactNode = null;
  if (calibrating) {
    modal = (
      <div className="w-full max-w-4xl">
        <InputCalibration system={input ?? undefined} onClose={() => setCalibrating(false)} />
      </div>
    );
  } else if (showPrebrief({ timeOutDone: attending.timeOutDone, hasChart: !!caseData.chart, chartBriefDone, finished })) {
    modal = (
      <div className="w-full max-w-3xl">
        <PreBrief
          prebrief={prebrief}
          lab="diagnostic"
          mode={policy.mode}
          catheters={CATHETERS.map((c) => c.id)}
          views={VIEW_PRESETS.map((v) => ({ id: v.id, name: v.name }))}
          chart={chart}
          onComplete={() => {
            setChartBriefDone(true);
            if (!attending.timeOutDone) attending.completeTimeOut();
          }}
        />
      </div>
    );
  } else if (finished && debriefModel && !debriefClosed) {
    modal = (
      <div className="w-full max-w-4xl">
        <Debrief model={debriefModel} onFinish={() => setDebriefClosed(true)} />
        {crew && <TeamReport team={crew.team} className="mt-3" />}
      </div>
    );
  }

  const drawer =
    screens.attendingDrawer && drawerOpen ? (
      <div className="flex h-full w-full flex-col gap-1.5 overflow-y-auto">
        {showObjectives && screens.objectives && caseData.objectives.length > 0 && (
          <div className="panel px-3 py-2 text-[13px]">
            <div className="mb-1 text-[12px] text-ink-faint">Objectives</div>
            <ul className="space-y-0.5 text-ink-soft">
              {caseData.objectives.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>
        )}
        {screens.teachingAids && (
          <div className="panel overflow-hidden">
            <div className="panel-head !py-1.5">
              <span>3D anatomy (teaching aid)</span>
              <button className="btn btn-ghost h-7 px-2 text-[12px]" onClick={() => setShow3D((v) => !v)}>
                {show3D ? "Hide" : "Show"}
              </button>
            </div>
            {show3D && (
              <div className="h-44">
                <Suspense fallback={<div className="grid h-full place-items-center text-[12px] text-ink-faint">Loading</div>}>
                  <AnatomyScene />
                </Suspense>
              </div>
            )}
          </div>
        )}
        <div className="min-h-0 flex-1">
          <AttendingDrawerWithTips
            session={session}
            report={finishing && !finished ? draft : null}
            mode={policy.mode}
            utterances={attending.utterances}
            onClose={() => setDrawerOpen(false)}
            onAskHelp={
              hintsAllowed
                ? () => {
                    attending.askHelp();
                    setHelpAskedAt(Date.now());
                  }
                : undefined
            }
            helpAskedAt={helpAskedAt}
          />
        </div>
      </div>
    ) : null;

  return (
    <LabLayout
      header={header}
      live={
        <LiveMonitor session={session}>
          <div className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center px-6">
            <div className="pointer-events-auto max-w-[90%]">
              <MentorVoice utterance={attending.last} mode={policy.mode} controls={false} />
            </div>
          </div>
          {crew && (
            <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center px-6">
              <Captions team={crew.team} variant="overlay" limit={3} hideOperator sedationRole={crew.sedationRole} />
            </div>
          )}
          {finishing && !finished && (
            <div className="absolute inset-0 z-20">
              <StudyReport
                value={draft}
                onChange={setDraft}
                grafts={reportGrafts(caseData)}
                miAsked={asksMiClass(caseData.events)}
                runs={runs}
                onBack={() => useSimulatorStore.getState().cancelFinish()}
                onSubmit={submitReport}
              />
            </div>
          )}
        </LiveMonitor>
      }
      reference={<ReferenceMonitor qca={screens.qca} />}
      haemo={<HaemoMonitor engine={session.engine} sweepSeconds={6} showControls />}
      dose={<DoseBlock session={session} />}
      table={
        <div ref={tableRef} className="relative h-full w-full">
          <TableStrip session={session} />
          <MechanicsBanner session={session} />
        </div>
      }
      controls={<TableSideControls session={session} input={input} />}
      drawer={drawer}
      palette={crew ? <TeamBar team={crew.team} audio={crew.audioEngine} voices={crew.audio?.voices ?? null} sedationRole={crew.sedationRole} /> : undefined}
      modal={modal}
    />
  );
}

function DoseBlock({ session }: { session: DiagnosticLabSession }) {
  useSessionVersion(session);
  const field = useSim((s) => s.imaging.field);
  const pedal = useSim((s) => s.pedal);
  const ex = session.exposure;
  const d = ex.dose;
  return (
    <DosePanel
      totals={d.totals}
      live={d.live}
      adrc={ex.lastExposure}
      skinMap={d.skinMap}
      settings={{ ...DEFAULT_SETTINGS, ...ex.exposure, mode: pedal.cine ? "cine" : "fluoro", fieldMm: field * 10 }}
      operator={ex.operator}
      onOperator={(p) => {
        ex.operator = { ...ex.operator, ...p };
        session.notify();
      }}
      compact
    />
  );
}

/**
 * The table-side controls' 'suction' capability (the Back table tab): aspirate the sheath's side arm,
 * and remove the catheter under continuous suction (diag-pressure-transducer).
 */
export function provideSuctionControls(session: DiagnosticLabSession): SuctionControls {
  const c: SuctionControls = {
    aspirateSheath: () => session.aspirateSheath(),
    removeUnderSuction: () => session.removeUnderSuction(),
  };
  session.provideCapability("suction", c);
  return c;
}

/** What the table strip shows and does beyond the hands: the drug syringe, the gauze and the side arm. */
export interface TableStripExtras {
  /** the drug syringe on the table (diag-lab-drugs), or null */
  drug: TableDrugSyringe | null;
  /** the last aspirate on the gauze (diag-pressure-transducer); null: a clean gauze */
  gauze: GauzeView | null;
  /** the sheath's side-arm stopcock: aspirate the sheath */
  onSideArm: () => void;
}

export function tableStripExtras(session: DiagnosticLabSession): TableStripExtras {
  return {
    drug: session.capability("drugs")?.tableSyringe() ?? null,
    gauze: session.aspirateView(),
    onSideArm: () => session.aspirateSheath(),
  };
}

/** Re-render when the drug orders change (a syringe drawn up, given or discarded). */
function useDrugsVersion(session: DiagnosticLabSession): number {
  const drugs = session.capability("drugs");
  // stable per capability, so React does not resubscribe on every render of the strip
  const subscribe = useCallback((fn: () => void) => (drugs ? drugs.subscribe(fn) : () => undefined), [drugs]);
  const snapshot = useCallback(() => drugs?.version() ?? 0, [drugs]);
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/** The table strip of the diagnostic lab (exported for render tests). */
export function TableStrip({ session }: { session: DiagnosticLabSession }) {
  useSessionVersion(session);
  useDrugsVersion(session);
  const extras = tableStripExtras(session);
  const ins = useSim((s) => s.controls.insertion);
  const wire = useSim((s) => s.controls.wireInsertion);
  const torque = useSim((s) => s.controls.torque);
  const inj = session.injector;
  const syringeMl = Math.max(0, 10 - (inj.trace?.volumeMl ?? 0));
  // the rod mechanics reports the hub roll the hands gave and the catheter length inside the patient
  const phys = session.physics?.active ? session.physics.tableState() : null;
  return (
    <TableView
      input={session.input}
      height={196}
      drug={extras.drug}
      gauze={extras.gauze}
      onSideArm={extras.onSideArm}
      state={{
        setup: "diagnostic",
        present: DIAG_PRESENT,
        // the legacy engine's insertion depth is displayed as mm (legacyAdapter LEGACY_INSERTION_PER_MM, model)
        insertedMm: phys ? phys.insertedMm : { catheter: 700 + ins, wire035: Math.max(0, wire) },
        hubRollRad: phys ? phys.hubRollRad : { catheter: torque },
        syringe: { volMl: syringeMl, contrastMl: syringeMl, salineMl: 0, bloodMl: 0, airMl: 0 },
      }}
    />
  );
}

/**
 * The catheter mechanics' status on the table strip: "Preparing catheter mechanics" until the rod
 * solver's first frame (the hands' movements wait for it), and the automatic fallback to the simple
 * model, said once (the reason is also in Settings).
 */
function MechanicsBanner({ session }: { session: DiagnosticLabSession }) {
  useSessionVersion(session);
  const [closed, setClosed] = useState<string | null>(null);
  if (session.physicsPreparing)
    return (
      <div className="notice notice-info pointer-events-none absolute left-2 right-2 top-2 text-[12px]" role="status">
        Preparing catheter mechanics. Catheter movements take effect when it is ready.
      </div>
    );
  const text = session.physicsBanner;
  if (!text || closed === text) return null;
  return (
    <div className="notice notice-warn pointer-events-auto absolute left-2 right-2 top-2 flex items-start gap-2 text-[12px]" role="status">
      <span className="flex-1">{text}</span>
      <button className="btn btn-ghost h-6 px-2 text-[12px]" onClick={() => setClosed(text)}>
        Dismiss
      </button>
    </div>
  );
}

/** The attending drawer with the technique tips for the current moment (manual curriculum, src/content/lab/tips.ts). */
function AttendingDrawerWithTips({
  session,
  report,
  mode,
  utterances,
  onClose,
  onAskHelp,
  helpAskedAt,
}: {
  session: DiagnosticLabSession;
  /** the study report's draft while the finish step is open (its empty walls add tip contexts) */
  report: StudyReportModel | null;
  mode: React.ComponentProps<typeof AttendingDrawer>["mode"];
  utterances: React.ComponentProps<typeof AttendingDrawer>["utterances"];
  onClose: () => void;
  onAskHelp?: () => void;
  helpAskedAt: number | null;
}) {
  const own = useDiagnosticTips(session, mode, helpAskedAt);
  // a second selection only while the report has an empty wall (its extra contexts); otherwise the
  // lab's own tips stand, and the null context costs nothing
  const extra = useMemo(() => {
    const ctxs = finishContexts(own.context, report);
    return ctxs.length > 1 ? ctxs : null;
  }, [own.context, report]);
  const finish = useContextTips(extra, { mode, helpAskedAt }, DEFAULT_TIP_LIMIT);
  const { tips, visible } = extra ? finish : own;
  return (
    <AttendingDrawer
      open
      mode={mode}
      utterances={utterances}
      onClose={onClose}
      onAskHelp={onAskHelp}
      technique={<TechniqueTips tips={tips} visible={visible} exam={mode === "exam"} onAskHelp={onAskHelp} />}
    />
  );
}
