import { useProcedureStore } from "../../state/useProcedureStore";
import type { CaseSession } from "../../simulation/session/caseSession";
import type { DecisionRecord } from "../../mentor/ledger";
import type { LabTip } from "../../content/lab/tips";

// ===========================================================================
// The full-case lab's side panels: chart and time-out, orders, the table
// (catheter preparation and exchanges), closure, recovery, handover, and the
// attending and procedure log. All read the session after each change
// (useProcedureStore.version) and act through useProcedureStore.act.
//
// Each panel lives in its own file under src/ui/access/panels/ (split by
// proc-foundation-scenarios-ledger, so later packages edit separate files);
// this file keeps the helpers they share and re-exports them, so imports of
// "../access/panels" are unchanged. The chart and orders panels also render
// the sections registered in src/ui/access/chart/ and src/ui/access/orders/.
// ===========================================================================

/** The current session, re-rendered on every change. */
export function useSession(): CaseSession {
  useProcedureStore((s) => s.version);
  return useProcedureStore((s) => s.session)!;
}

/** Session time as m:ss or h:mm:ss. */
export function clock(t: number): string {
  const s = Math.floor(t);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h ? h + ":" : ""}${String(m).padStart(h ? 2 : 1, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** One row of the handover summary's ledger: a decision with the tips that teach it (ids that resolve only). */
export interface LedgerRow {
  decision: DecisionRecord;
  tips: Pick<LabTip, "id" | "title" | "lessonId">[];
}

/** The ledger rows of a finished case, with each decision's tips looked up in the tip registry. */
export function ledgerRows(decisions: readonly DecisionRecord[], tipById: Readonly<Record<string, LabTip>> | null): LedgerRow[] {
  return decisions.map((d) => ({
    decision: d,
    tips: tipById ? (d.tipIds ?? []).map((id) => tipById[id]).filter((t): t is LabTip => !!t).map((t) => ({ id: t.id, title: t.title, lessonId: t.lessonId })) : [],
  }));
}

export { AccessPicker } from "./panels/AccessPicker";
export { ChartPanel } from "./panels/ChartPanel";
export { OrdersPanel } from "./panels/OrdersPanel";
export { TablePanel } from "./panels/TablePanel";
export { ClosurePanel } from "./panels/ClosurePanel";
export { RecoveryPanel } from "./panels/RecoveryPanel";
export { HandoverPanel } from "./panels/HandoverPanel";
export { LogPanel } from "./panels/LogPanel";
