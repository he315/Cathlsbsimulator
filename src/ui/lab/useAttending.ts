import { useEffect, useRef, useState } from "react";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { MentorEngine, ProcedureRecorder, assessAttempt, saveRecording, utteranceData, type Assessment, type MentorUtterance, type ProcedureRecord } from "../../mentor";
import type { AnatomyCase } from "../../types";
import { attachSimulatorStore, mentorInputFromSim, type StoreBridge } from "../../mentor/bridge/simulatorStore";
import { treeSegmentGeometry, segmentLabelAt } from "../../mentor/treeSegments";
import { segmentForeshortening } from "../../mentor/coverage";
import type { DiagnosticLabSession } from "../sim/labSession";
import type { LabPolicy } from "./visibility";
import { uid } from "../../utils/random";

// ---------------------------------------------------------------------------
// The attending (S11) wired into the diagnostic lab shell (S11 integration
// step 1c-1g): a recorder and a MentorEngine per case at the session's policy
// (mode and entrustment from the level or the exam), fed from the store by the
// bridge; safety stops before an injection; the beam held until the time-out
// in the modes that require one; the record saved and assessed at the end,
// with the study report submitted at the finish step (assessFinishedCase).
// ---------------------------------------------------------------------------

export interface Attending {
  utterances: MentorUtterance[];
  last: MentorUtterance | null;
  /** the learner asks for help (guided and costed modes; nothing in exams) */
  askHelp: () => void;
  /** the time-out has been completed (or is not required) */
  timeOutDone: boolean;
  completeTimeOut: () => void;
  /** assessment of the finished case (null until then) */
  assessment: Assessment | null;
}

export interface AttendingOptions {
  /** the time-out was already done before this lab (the full case's chart workspace, C5 hand-over) */
  timeOutDone?: boolean;
}

/**
 * Assess the finished case. The study report submitted at the finish step (the store's studyReport,
 * set before finishCase) goes in as `report`, so the debrief's study-report check runs inside
 * buildDebrief (diag-study-report).
 */
export function assessFinishedCase(
  record: ProcedureRecord,
  o: {
    c: Pick<AnatomyCase, "acceptableCatheters" | "recommendedCatheters" | "dominance">;
    model: { lm: { az: number }; rca: { az: number } };
    geometry: ReturnType<typeof treeSegmentGeometry>;
    focus: "left" | "right" | "both";
  }
): Assessment {
  return assessAttempt(record, {
    facts: { focus: o.focus, acceptableCatheters: o.c.acceptableCatheters, recommendedCatheters: o.c.recommendedCatheters, targetAz: { left: o.model.lm.az, right: o.model.rca.az } },
    geometry: o.geometry,
    focus: o.focus,
    dominance: o.c.dominance,
    report: useSimulatorStore.getState().studyReport?.comparison,
  });
}

export function useAttending(session: DiagnosticLabSession | null, policy: LabPolicy, opts: AttendingOptions = {}): Attending {
  const preTimeOut = !!opts.timeOutDone;
  const [utterances, setUtterances] = useState<MentorUtterance[]>([]);
  const [timeOutDone, setTimeOutDone] = useState(preTimeOut || !policy.visibility.timeOutRequired);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const engineRef = useRef<MentorEngine | null>(null);
  const timeOutRef = useRef(timeOutDone);
  timeOutRef.current = timeOutDone;

  useEffect(() => {
    if (!session) return;
    const st0 = useSimulatorStore.getState();
    const c = st0.caseData;
    setUtterances([]);
    setAssessment(null);
    const needTimeOut = policy.visibility.timeOutRequired && !preTimeOut;
    setTimeOutDone(!needTimeOut);
    timeOutRef.current = !needTimeOut;
    const rec = new ProcedureRecorder({
      id: uid(),
      startedAt: Date.now(),
      caseId: c.id,
      lab: "diagnostic",
      mode: policy.mode,
      entrustment: policy.entrustment,
      seed: c.id,
      context: { catheterId: st0.catheterId },
    });
    const engine = new MentorEngine({ mode: policy.mode, entrustment: policy.entrustment });
    engineRef.current = engine;
    const clock = { wall: () => session.wall(), patient: () => session.engine.clockState().t };
    rec.event({ kind: "case-start", tWall: 0, tPatient: 0, step: 0, cmd: 0, ext: true, data: { caseId: c.id } });
    const say = (u: MentorUtterance) => {
      setUtterances((a) => [...a, u]);
      rec.event({ kind: "mentor", data: utteranceData(u), tWall: u.tWall, tPatient: u.tWall, step: 0, cmd: 0, ext: true });
    };
    // foreshortening of the target segment for the "foreshortened view" rule (S11 step 1e)
    const geometry = treeSegmentGeometry(session.tree);
    const worst = [...c.lesions].sort((a, b) => b.severity - a.severity)[0];
    const focus: "left" | "right" | "both" = c.requiredViews.includes("spider") && c.requiredViews.includes("rcalao") ? "both" : c.requiredViews.includes("rcalao") ? "right" : "left";
    const targetSegment = worst ? segmentLabelAt(session.tree, worst.vessel, worst.position) ?? undefined : focus === "right" ? "1" : "6";
    let lastArm = "";
    let fore: number | undefined;
    const bridge: StoreBridge = attachSimulatorStore(useSimulatorStore, rec, clock, {
      onInput: (i) => {
        const key = `${i.cArm.laoRao.toFixed(1)}:${i.cArm.cranialCaudal.toFixed(1)}`;
        if (key !== lastArm && targetSegment) {
          lastArm = key;
          fore = segmentForeshortening(geometry, targetSegment, i.cArm);
        }
        for (const u of engine.step({ ...i, targetSegment, targetForeshortening: fore })) say(u);
      },
    });
    // safety stops before an injection (S11 step 1d); the beam waits for the time-out (step 1f)
    session.beforeInject = () => {
      const r = engine.preAction("inject", mentorInputFromSim(useSimulatorStore.getState(), null, session.wall()));
      if (r.utterance) say(r.utterance);
      return r.allow;
    };
    session.beamGate = () => timeOutRef.current;
    // the recorder samples on the lab's own steps (the recorder decimates to 10 Hz)
    const offStep = session.onStep(() => bridge.sample());
    // the patient engine's, the dose tracker's and the team's telemetry go into the same record (C4)
    const offCrew = session.crew?.onEvents((evs) => {
      for (const e of evs) rec.event({ kind: e.kind, data: e.data, tWall: session.wall(), tPatient: e.tPatient, step: 0, cmd: 0, ext: true });
    });
    // the end of the case: save and assess the record once
    const unsub = useSimulatorStore.subscribe((s, p) => {
      if (s.finished && !p.finished) {
        bridge.sample();
        const record = rec.finish();
        void saveRecording(record);
        try {
          setAssessment(assessFinishedCase(record, { c, model: s.model, geometry, focus }));
        } catch {
          setAssessment(null);
        }
      }
    });
    return () => {
      offStep();
      offCrew?.();
      unsub();
      bridge.detach();
      session.beforeInject = null;
      session.beamGate = null;
      engineRef.current = null;
    };
  }, [session, policy, preTimeOut]);

  return {
    utterances,
    last: utterances.length ? utterances[utterances.length - 1] : null,
    askHelp: () => {
      const e = engineRef.current;
      if (!e || !session || policy.visibility.hints === "off") return;
      useSimulatorStore.getState().hint(); // counted (costed modes count it against entrustment)
      const u = e.requestHint(mentorInputFromSim(useSimulatorStore.getState(), null, session.wall()));
      if (u) setUtterances((a) => [...a, u]);
    },
    timeOutDone,
    completeTimeOut: () => {
      timeOutRef.current = true;
      setTimeOutDone(true);
    },
    assessment,
  };
}
