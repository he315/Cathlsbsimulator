// ---------------------------------------------------------------------------
// Communication quality for the S11 debrief.
//
// Closed-loop communication follows the definition used in observational
// studies of verbal orders (fact C4-F7): an order that is audible, directed to
// a team member, checked back by that member, and acknowledged by the team
// leader; and for drugs, complete (drug, dose and route) and checked back
// before administration. The simulated team always checks back, so what is
// measured is the operator's part: naming the addressee, complete orders,
// confirming read-backs (and catching a wrong one), checking labels, and
// warning the patient before adenosine, balloon inflation, a large warm
// contrast injection, a puncture or the radial cocktail.
// ---------------------------------------------------------------------------

import type { Finding, TeamState, WarnableEvent } from "./agent";
import type { TeamParams } from "./agent";

export interface CommunicationReport {
  orders: number;
  /** orders that named their addressee */
  directed: number;
  drugOrders: number;
  /** drug orders with drug, dose and route all stated */
  completeDrugOrders: number;
  readBacks: number;
  /** read-backs the operator confirmed within the window */
  acknowledged: number;
  /** acknowledged and directed: the full closed loop */
  closedLoops: number;
  queries: number;
  misheard: number;
  misheardCaught: number;
  misheardMissed: number;
  wrongItems: number;
  wrongItemsCaught: number;
  wrongItemsUsedUnchecked: number;
  labelChecks: number;
  warnable: WarnableEvent[];
  warned: number;
  findings: Finding[];
  /** plain sentences for the debrief, each with its denominator */
  lines: string[];
}

const pct = (a: number, b: number) => (b ? `${a} of ${b}` : "none");

export function communicationReport(st: TeamState, P: Pick<TeamParams, "ackWindowS">): CommunicationReport {
  const orders = st.orders.filter((o) => o.status !== "refused");
  const drug = orders.filter((o) => o.intent.k === "drug");
  const rb = orders.filter((o) => o.readbackAt !== undefined);
  const acked = rb.filter((o) => o.ackAt !== undefined && o.ackAt - (o.readbackAt ?? 0) <= P.ackWindowS && o.ackAt >= (o.readbackAt ?? 0) - 0.5);
  const closed = acked.filter((o) => o.directed);
  const mis = orders.filter((o) => o.misheard);
  const misCaught = mis.filter((o) => o.rejectedAt !== undefined || o.status === "cancelled");
  const wrongItems = st.items.filter((x) => x.actual.name !== x.asked.name || x.actual.french !== x.asked.french);
  const wrongCaught = wrongItems.filter((x) => x.labelCheckedAt !== undefined && (x.usedAt === undefined || x.labelCheckedAt <= x.usedAt));
  const wrongUsed = wrongItems.filter((x) => x.usedAt !== undefined && (x.labelCheckedAt === undefined || x.labelCheckedAt > x.usedAt));
  const queries = orders.filter((o) => o.queryReason !== undefined).length;
  const warned = st.warnable.filter((w) => w.warned).length;
  const findings = [...st.findings];
  for (const o of mis) {
    if (o.ackAt !== undefined && o.rejectedAt === undefined) findings.push({ t: o.ackAt, severity: "safety", code: "misheard-confirmed", text: `A read-back that did not match your order ("${o.readbackText}") was confirmed.` });
  }
  for (const w of st.warnable) {
    if (!w.warned) {
      const what = { adenosine: "adenosine", inflation: "balloon inflation", "contrast-warmth": "a large contrast injection", puncture: "the puncture", cocktail: "the radial cocktail" }[w.event];
      findings.push({ t: w.t, severity: "communication", code: `unwarned-${w.event}`, text: `The patient was not warned before ${what}.` });
    }
  }
  findings.sort((a, b) => a.t - b.t);
  const lines = [
    `Orders that named the team member: ${pct(orders.filter((o) => o.directed).length, orders.length)}.`,
    `Drug orders stating drug, dose and route: ${pct(drug.filter((o) => o.complete).length, drug.length)}.`,
    `Read-backs you confirmed: ${pct(acked.length, rb.length)}; full closed loops (named, read back, confirmed): ${pct(closed.length, rb.length)}.`,
  ];
  if (mis.length) lines.push(`Misheard read-backs you caught: ${pct(misCaught.length, mis.length)}.`);
  if (wrongItems.length) lines.push(`Wrong items caught by a label check: ${pct(wrongCaught.length, wrongItems.length)}.`);
  if (st.warnable.length) lines.push(`Patient warned before the event: ${pct(warned, st.warnable.length)}.`);
  return {
    orders: orders.length,
    directed: orders.filter((o) => o.directed).length,
    drugOrders: drug.length,
    completeDrugOrders: drug.filter((o) => o.complete).length,
    readBacks: rb.length,
    acknowledged: acked.length,
    closedLoops: closed.length,
    queries,
    misheard: mis.length,
    misheardCaught: misCaught.length,
    misheardMissed: mis.length - misCaught.length,
    wrongItems: wrongItems.length,
    wrongItemsCaught: wrongCaught.length,
    wrongItemsUsedUnchecked: wrongUsed.length,
    labelChecks: st.items.filter((x) => x.labelCheckedAt !== undefined).length,
    warnable: st.warnable.map((w) => ({ ...w })),
    warned,
    findings,
    lines,
  };
}
