// ---------------------------------------------------------------------------
// The full case's tip context (proc-tip-context): one pure function from the
// case session, the workspace on screen and the store stage to the lab
// contexts its tips are written for, and one selection rule that the panel
// (CaseTipsPanel.tsx), the dev hook (__caseSession.tips()) and the tests share.
//
// The full case spans four labs, so it reports one context per lab and the
// tips are merged (tipsForAll's rule, with a cap per lab):
//   chart            access plan; diagnostic setup; pci plan when PCI is
//                    planned (the indication is an acute coronary syndrome,
//                    or the case has gone to PCI)
//   access           access [step, site] with the route: the step from
//                    session.accessStep() (puncture until the wire runs free,
//                    wire while it is at the needle, sheath from needle
//                    removal until the sheath is flushed), the site femoral
//                    or radial; once the sheath is flushed, access sheath
//                    [site] until closure and access closure [site] after it
//                    (as the table and closure workspaces report), so the
//                    tips of earlier steps at the site do not return
//   fluoro           access wire with the route; diagnostic advance
//   table            access sheath; diagnostic setup
//   closure, recovery and handover
//                    access closure with the route; diagnostic finish; pci
//                    finish when the case went to PCI
//   any workspace    access complication while an access complication event
//                    is active; and one phase-less context each for the
//                    diagnostic, PCI and haemodynamic labs with the patient
//                    events only, so tips such as pci-mon-false-hypotension
//                    and diag-anaphylaxis-im-adrenaline appear in the case
//   any workspace    the session modules' own contexts
//                    (session.moduleTipContexts(), CaseSessionModule.
//                    tipContexts): the hypotension module's haemodynamic
//                    'right-heart' context while the right heart numbers are
//                    open, so haemo-wedge-oedema-risk reaches the panel
//                    (repair-session-flow). A module's context is what is
//                    open on screen now: the panel keeps up to
//                    CASE_MODULE_TIPS of its tips first (selectCaseTips),
//                    inside the total, before the per-lab caps fill the rest
// While the case is handed to the diagnostic or PCI lab (stage 'diagnostic'
// or 'pci') that lab shows its own tips, and this returns no context.
//
// Events: the access contexts carry every active event; the diagnostic ones
// the patient and scenario events plus the events the diagnostic lab also
// raises (radial spasm and loop, a damped trace, air); the PCI and
// haemodynamic ones the patient and scenario events only, so an arm
// perforation never brings up a coronary perforation tip.
//
// Step and site together: an access tip that names a stage phase (plan,
// puncture, wire, sheath, closure, complication) together with the site is
// written for that stage at that site. At a step, such a tip is shown only
// when it names the current step, so the femoral wire and sheath tips do not
// crowd the femoral puncture; and, among the tips no event brought up, the
// tips of the step rank before the tips of the site alone (STEP_BONUS), which
// apply at every step.
//
// Order: the panel keeps the tips the scores select (above), then lists the
// tips brought up by a context with a phase (the workspace's own step) before
// those brought up only by the phase-less patient contexts, so a persistent
// patient event does not take the top slot from the step in hand. The
// membership of the list is unchanged by this order.
//
// Site: tipScore matches a tip's phases as a union, so a tip written for
// [sheath, femoral] would match any access context at the sheath stage. In
// every access context with a route, a tip that names a site phase (femoral,
// radial) is shown only when it names the route's site (fitsSite): a radial
// case never shows a femoral-only tip, and a femoral case no radial-only one.
//
// `raises` (below) is what the full case can report; the reachability report
// (src/content/lab/reachability.test.ts) reads it. Session modules in
// src/simulation/session/modules/ export their own, and a scenario's scripted
// events are declared by the scenario that scripts them.
//
// This module imports types only from the tip registry, so the lab bundle
// does not pull the curriculum in with it.
// ---------------------------------------------------------------------------

import type { LabContext, LabEvent, LabId, LabPhase, LabTip, AccessRoute as TipRoute } from "../../content/lab/tips";
import type { LabRaises } from "../../content/lab/raisable/waiting";
import type { TipsModule } from "../lab/useLabTips";
import { CASE_PATIENT_EVENTS, CASE_SESSION_EVENTS, type CaseSession, type Workspace } from "../../simulation/session/caseSession";

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

/** The access lab's phases (LAB_PHASES.access, in the registry's order); the case reports every one. */
export const CASE_ACCESS_PHASES = ["plan", "puncture", "wire", "sheath", "radial", "femoral", "closure", "complication"] as const satisfies readonly LabPhase[];

/** Access phases that name a stage of the procedure rather than a site. */
const STAGE_PHASES: readonly LabPhase[] = ["plan", "puncture", "wire", "sheath", "closure", "complication"];

/** Access phases that name a site. */
const SITE_PHASES: readonly LabPhase[] = ["femoral", "radial"];

/** The diagnostic and PCI phases the case reports. */
export const CASE_DIAGNOSTIC_PHASES = ["setup", "advance", "finish"] as const satisfies readonly LabPhase[];
export const CASE_PCI_PHASES = ["plan", "finish"] as const satisfies readonly LabPhase[];

/** The routes the case reports (its sites: the femoral and either radial artery). */
export const CASE_ROUTES = ["femoral", "radial"] as const satisfies readonly TipRoute[];

/** Session events the diagnostic lab raises with the same meaning, passed to the diagnostic contexts too. */
const SHARED_WITH_DIAGNOSTIC: readonly LabEvent[] = ["radial-spasm", "radial-loop", "pressure-damped", "air"];

/** Access events that open the 'complication' context. */
export const ACCESS_COMPLICATION_EVENTS: readonly LabEvent[] = ["bleeding", "haematoma", "limb-ischaemia", "perforation", "dissection", "radial-spasm", "pseudoaneurysm"];

const ALL_CASE_EVENTS: readonly LabEvent[] = [...new Set<LabEvent>([...CASE_SESSION_EVENTS, ...CASE_PATIENT_EVENTS])];

/**
 * What the full case can report, one entry per lab (the reachability report reads this). The
 * diagnostic, PCI and haemodynamic contexts never carry the access-only events (see the header).
 */
export const raises: readonly LabRaises[] = [
  { lab: "access", phases: CASE_ACCESS_PHASES, events: ALL_CASE_EVENTS, routes: CASE_ROUTES },
  { lab: "diagnostic", phases: CASE_DIAGNOSTIC_PHASES, events: [...new Set<LabEvent>([...CASE_PATIENT_EVENTS, ...SHARED_WITH_DIAGNOSTIC])], routes: CASE_ROUTES },
  { lab: "pci", phases: CASE_PCI_PHASES, events: CASE_PATIENT_EVENTS },
  { lab: "haemo", phases: [], events: CASE_PATIENT_EVENTS },
];

// ---------------------------------------------------------------------------
// Contexts
// ---------------------------------------------------------------------------

/** What the context reads from the session. */
export type CaseTipSource = Pick<CaseSession, "profile" | "labsDone" | "handedOver" | "accessStep" | "activeEvents" | "closureDone"> & Partial<Pick<CaseSession, "moduleTipContexts" | "postponement">>;

/** The procedure store's stage: the case itself, or handed to the diagnostic or PCI lab. */
export type CaseStage = "lab" | "diagnostic" | "pci";

const ACS = new Set(["UA", "NSTEMI", "STEMI"]);

/**
 * A context caseTipContexts returns: a session module's carries `source: "module"` (selectCaseTips keeps
 * its tips first). A mark in the data, so a copy of the contexts keeps it.
 */
export type CaseTipContext = LabContext & { source?: "module" };

/** Whether caseTipContexts took this context from a session module. */
export function isModuleTipContext(ctx: LabContext): boolean {
  return (ctx as CaseTipContext).source === "module";
}
const PATIENT = new Set<LabEvent>(CASE_PATIENT_EVENTS);
const SESSION = new Set<LabEvent>(CASE_SESSION_EVENTS);

/**
 * The lab contexts for the case now, in order: access first, then diagnostic, PCI and the phase-less
 * patient contexts. Pure.
 */
export function caseTipContexts(s: CaseTipSource, workspace: Workspace, stage: CaseStage = "lab"): CaseTipContext[] {
  if (stage !== "lab") return [];
  const { step, site, route } = s.accessStep();
  const events = s.activeEvents();
  // scenario and module events are case properties: every lab sees them
  const caseEvents = events.filter((e) => !SESSION.has(e));
  const diagEvents = events.filter((e) => !SESSION.has(e) || SHARED_WITH_DIAGNOSTIC.includes(e));
  const patientOnly = events.filter((e) => PATIENT.has(e));
  const pciDone = s.labsDone.includes("pci") || s.handedOver === "pci";
  const pciPlanned = pciDone || ACS.has(s.profile.indication);

  const access = (phase: LabPhase, phases?: LabPhase[]): LabContext => ({ lab: "access", phase, ...(phases ? { phases } : {}), route, events });
  const diagnostic = (phase: LabPhase): LabContext => ({ lab: "diagnostic", phase, route, events: diagEvents });
  const pci = (phase: LabPhase): LabContext => ({ lab: "pci", phase, events: caseEvents });

  const out: CaseTipContext[] = [];
  // a case postponed before any puncture had no access: only the planning tips apply, on any workspace
  const postponedBeforePuncture = !!s.postponement?.()?.beforePuncture;
  if (postponedBeforePuncture) out.push(access("plan"));
  else switch (workspace) {
    case "chart":
      out.push(access("plan"), diagnostic("setup"));
      if (pciPlanned) out.push(pci("plan"));
      break;
    case "access":
      // after the flush the step is over: the sheath is in until closure, then the closure
      out.push(access(step ?? (s.closureDone() ? "closure" : "sheath"), [site]));
      break;
    case "fluoro":
      out.push(access("wire"), diagnostic("advance"));
      break;
    case "table":
      out.push(access("sheath"), diagnostic("setup"));
      break;
    case "closure":
    case "recovery":
    case "handover":
      out.push(access("closure"), diagnostic("finish"));
      if (pciDone) out.push(pci("finish"));
      break;
  }
  if (!postponedBeforePuncture && events.some((e) => ACCESS_COMPLICATION_EVENTS.includes(e))) out.push(access("complication"));
  // the modules' own contexts (each passed on as the module gives it, marked as a module's for the selection)
  for (const c of s.moduleTipContexts?.() ?? []) out.push({ ...c, source: "module" });
  if (patientOnly.length) for (const lab of ["diagnostic", "pci", "haemo"] as const) out.push({ lab, events: patientOnly });
  return out;
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

/** The order the labs' tips are listed in on a tie, and the labs the case reports. */
const LAB_ORDER: readonly LabId[] = ["access", "diagnostic", "pci", "haemo"];

/**
 * How many tips each lab may add to the panel, and the panel's total: panel settings, not clinical
 * values. The access workspace is where the access tips matter most, so it lists more of them.
 */
export interface CaseTipLimits {
  perLab: Partial<Record<LabId, number>>;
  total: number;
}
export const CASE_TIP_LIMITS: CaseTipLimits = { perLab: { access: 5, diagnostic: 2, pci: 2, haemo: 1 }, total: 7 };
/** At the access workspace the other labs add to the access tips rather than displacing them. */
export const CASE_TIP_LIMITS_AT_ACCESS: CaseTipLimits = { perLab: { access: 8, diagnostic: 1, pci: 1, haemo: 1 }, total: 10 };

/** The limits for a workspace. */
export function caseTipLimits(workspace: Workspace): CaseTipLimits {
  return workspace === "access" ? CASE_TIP_LIMITS_AT_ACCESS : CASE_TIP_LIMITS;
}

/**
 * At an access step reported with its site, a tip that names a stage phase but not the current step
 * was written for another stage at this site; it is left out for this context.
 */
export function fitsStep(tip: LabTip, ctx: LabContext): boolean {
  if (ctx.lab !== "access" || tip.lab !== "access" || !ctx.phases?.length || !ctx.phase || !STAGE_PHASES.includes(ctx.phase)) return true;
  const ph = tip.when.phase;
  if (!ph?.length || ph.includes(ctx.phase)) return true;
  return !ph.some((p) => STAGE_PHASES.includes(p));
}

/**
 * In an access context with a route, a tip that names a site phase but not the route's site was
 * written for the other site; it is left out for this context. Tips that name no site phase pass
 * (their route, if any, is tipScore's to check).
 */
export function fitsSite(tip: LabTip, ctx: LabContext): boolean {
  if (ctx.lab !== "access" || tip.lab !== "access" || !ctx.route) return true;
  const sites = (tip.when.phase ?? []).filter((p) => SITE_PHASES.includes(p));
  return !sites.length || sites.includes(ctx.route as LabPhase);
}

/**
 * Added to the score of a tip that names the current step, in a context reporting a step with its
 * site: the step is the more specific of the two. Without an event, a site-only access tip scores
 * at most 2.5 (phase, route, a caution tone) and a step tip at least 1 + STEP_BONUS, so the step's
 * tips rank first. A ranking setting, not a clinical value.
 */
export const STEP_BONUS = 2;

/** The tip's score for the panel in this context: tipScore, the step and site filters and the step bonus. */
export function caseTipScore(mod: Pick<TipsModule, "tipScore">, tip: LabTip, ctx: LabContext): number | null {
  const score = mod.tipScore(tip, ctx);
  if (score === null || !fitsStep(tip, ctx) || !fitsSite(tip, ctx)) return null;
  const atStep = ctx.lab === "access" && tip.lab === "access" && !!ctx.phases?.length && !!ctx.phase && STAGE_PHASES.includes(ctx.phase) && !!tip.when.phase?.includes(ctx.phase);
  return atStep ? score + STEP_BONUS : score;
}

/**
 * The tips the case panel shows for these contexts: per lab, each tip at its best score across that
 * lab's contexts (caseTipScore; tipsForAll's order: score, then context, then registry), capped per
 * lab; then all labs by score, ties in LAB_ORDER, capped in total; then listed with the tips of a
 * context with a phase before those of the phase-less patient contexts (stable). A context caseTipContexts
 * took from a session module comes first: up to CASE_MODULE_TIPS of its best tips (score, then registry),
 * inside the total, outside the per-lab caps. None unless the policy lets the learner see tips now
 * (`visible`, from tipsVisible) and the registry has loaded.
 */
export function selectCaseTips(mod: TipsModule | null, ctxs: readonly LabContext[], visible: boolean, limits: CaseTipLimits = CASE_TIP_LIMITS): LabTip[] {
  if (!mod || !visible || !ctxs.length) return [];
  // a session module's context (its screen open now): its best tips first, up to CASE_MODULE_TIPS each
  const reserved: LabTip[] = [];
  for (const ctx of ctxs) {
    if (!isModuleTipContext(ctx)) continue;
    mod.LAB_TIPS.map((tip, ri) => ({ tip, ri, score: caseTipScore(mod, tip, ctx) }))
      .filter((x): x is { tip: LabTip; ri: number; score: number } => x.score !== null && !reserved.some((r) => r.id === x.tip.id))
      .sort((a, b) => b.score - a.score || a.ri - b.ri)
      .slice(0, CASE_MODULE_TIPS)
      .forEach((x) => reserved.push(x.tip));
  }
  const keep = reserved.slice(0, limits.total);
  const own = ctxs.filter((c) => !isModuleTipContext(c));
  const rest = keep.length < limits.total ? selectOwnTips(mod, own, { ...limits, total: limits.total - keep.length }).filter((t) => !keep.some((k) => k.id === t.id)) : [];
  return [...keep, ...rest];
}

/**
 * How many tips a session module's context keeps at the top of the panel (a panel setting, not a
 * clinical value). A context's tips often tie on score (the right heart numbers' context has four at
 * its best score, haemo-wedge-oedema-risk among them), so more than one is kept.
 */
export const CASE_MODULE_TIPS = 3;

/** selectCaseTips for the case's own contexts (the per-lab caps, the total and the phased-first order). */
function selectOwnTips(mod: TipsModule, ctxs: readonly LabContext[], limits: CaseTipLimits): LabTip[] {
  if (!ctxs.length) return [];
  const picked = new Map<string, { tip: LabTip; score: number; lab: number; i: number; phased: boolean }>();
  LAB_ORDER.forEach((lab, li) => {
    const lc = ctxs.filter((c) => c.lab === lab);
    const cap = limits.perLab[lab] ?? 0;
    if (!lc.length || cap <= 0) return;
    const best = new Map<string, { tip: LabTip; score: number; ci: number; ri: number }>();
    lc.forEach((ctx, ci) =>
      mod.LAB_TIPS.forEach((tip, ri) => {
        const score = caseTipScore(mod, tip, ctx);
        if (score === null) return;
        const prev = best.get(tip.id);
        if (!prev) best.set(tip.id, { tip, score, ci, ri });
        else if (score > prev.score) Object.assign(prev, { score, ci, ri });
      })
    );
    [...best.values()]
      .sort((a, b) => b.score - a.score || a.ci - b.ci || a.ri - b.ri)
      .slice(0, cap)
      .forEach((b, i) => {
        // a tip borrowed into two labs is listed once, under the first
        if (!picked.has(b.tip.id)) picked.set(b.tip.id, { tip: b.tip, score: b.score, lab: li, i, phased: !!lc[b.ci].phase });
      });
  });
  return [...picked.values()]
    .sort((a, b) => b.score - a.score || a.lab - b.lab || a.i - b.i)
    .slice(0, limits.total)
    .sort((a, b) => Number(b.phased) - Number(a.phased))
    .map((p) => p.tip);
}
