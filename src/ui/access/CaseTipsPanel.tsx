// The full case's tips panel (proc-tip-context): the access, diagnostic, PCI and haemodynamic tips
// for what the learner is doing now (caseTips.ts), in the shared lab tips panel. Visibility follows
// the diagnostic lab: guided practice shows tips as they become relevant; supervised and independent
// practice show them once the learner has asked the attending (the store's askHelp, recorded by the
// session and the run); exams show no panel. The tips shown are recorded on the session for the
// debrief (session.tipsShown). Each card links to the lesson that teaches it.
import { useEffect, useMemo } from "react";
import type { CaseSession, Workspace } from "../../simulation/session/caseSession";
import LabTipsPanel from "../lab/LabTipsPanel";
import { tipsVisible, useTipsModule } from "../lab/useLabTips";
import { caseTipContexts, caseTipLimits, selectCaseTips, type CaseStage } from "./caseTips";

export interface CaseTipsPanelProps {
  session: CaseSession;
  workspace: Workspace;
  stage?: CaseStage;
  /** 'Ask the attending' (the store's askHelp) */
  onAskHelp: () => void;
  className?: string;
}

export default function CaseTipsPanel({ session, workspace, stage = "lab", onAskHelp, className = "" }: CaseTipsPanelProps) {
  const mod = useTipsModule();
  const visible = tipsVisible({ mode: session.mode, helpAskedAt: session.helpAskedAt });
  // the parent re-renders at about 8 Hz; the tips are recomputed only when the contexts change
  const contexts = caseTipContexts(session, workspace, stage);
  const key = JSON.stringify(contexts);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the contexts are tracked by their content key
  const tips = useMemo(() => selectCaseTips(mod, contexts, visible, caseTipLimits(workspace)), [mod, key, visible, workspace]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the events change with the contexts
  const events = useMemo(() => session.activeEvents(), [session, key]);
  useEffect(() => {
    if (tips.length) session.noteTipsShown(tips.map((t) => t.id));
  }, [session, tips]);
  return <LabTipsPanel tips={tips} visible={visible} mode={session.mode} onAskHelp={onAskHelp} events={events} title="Tips" className={className} />;
}
