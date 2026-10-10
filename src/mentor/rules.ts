// ---------------------------------------------------------------------------
// The attending's rules. Each rule watches the rolling context, waits for its
// condition to persist, then speaks on an escalation ladder:
//   1 question  - make the learner look ("What is the pressure telling you?")
//   2 prompt    - point at the cue ("Look at the diastolic.")
//   3 hint      - name the problem ("That's ventricularised.")
//   4 instruction - say what to do ("Come back a millimetre, then aspirate.")
//   5 take-over - stop the action ("Stop. Don't inject.")
// Lines are written the way an attending talks at the table, and are built
// from the live state (pressures, the branch the wire is in). Lines never
// mention scores, points or percentages.
//
// Persistence, cooldown and escalation times are tunable defaults (model
// parameters), not literature values.
//
// Registry (found-mentor-registries): the rules themselves live in
// src/mentor/rules/, one file per rule group, discovered by glob in
// src/mentor/rules/index.ts. A package that adds rules adds a file there that
// exports `order` and `rules`; it does not edit this file or the index. This
// file keeps the rule types and re-exports what it always exported (RULES,
// TIMEOUT_RULE, ALL_RULES, ruleById, MENTOR_PARAMS), so importers are
// unchanged.
//
// Two attending implementations exist (HANDOVER 6.5): MentorEngine
// (src/mentor/mentor.ts) with these rules, and the full case's own lines in
// caseSession.ts. New attending work extends MentorEngine through rule files
// here; the full case's say() is kept for that lab and is not extended.
//
// Rule files import from this file with `import type` only: the registry
// imports the rule files, so a runtime import back into this file or the
// index would be a cycle (registries.test.ts checks this).
// ---------------------------------------------------------------------------

import type { MistakeCode } from "../types";
import type { MentorCtx, PreAction } from "./context";
import type { Anchor, FrameOption, Lab, LadderLevel, Phase, Severity } from "./types";

export type Line = (c: MentorCtx) => string;

/**
 * The pending actions a rule may stop. The engine's own PreAction (context.ts) is a subset; the
 * further kinds (an intracoronary drug, a power injection, a drug given by the team) are allowed for
 * the labs that add them, so a rule file can already be written against them.
 */
export const RULE_PRE_ACTIONS = ["inject", "advance-catheter", "advance-device", "advance-wire", "inflate", "deploy", "give-ic", "power-inject", "give"] as const;
export type RulePreAction = (typeof RULE_PRE_ACTIONS)[number];

// compile-time check: every action the engine passes is one a rule can name
type _EnginePreActionsAreRuleActions = PreAction extends RulePreAction ? true : never;
const _preActionCheck: _EnginePreActionsAreRuleActions = true;
void _preActionCheck;

export interface MentorRule {
  id: string;
  title: string;
  severity: Severity;
  phase: Phase;
  lab: Lab | "any";
  /** the situation the attending is watching for */
  when: (c: MentorCtx) => boolean;
  /** seconds the situation must persist before the attending reacts */
  persistS: number;
  /** a pending action that the attending stops (take-over) */
  stopOn?: (a: RulePreAction, c: MentorCtx) => boolean;
  lines: Partial<Record<Exclude<LadderLevel, 0>, Line>>;
  anchor: Anchor;
  /** quiet period after the situation clears (s) */
  cooldownS: number;
  /** frames for the debrief's advocacy-inquiry, and for the time-out */
  frames?: FrameOption[];
  /** mistake code this rule teaches */
  mistake?: MistakeCode;
}

/** What a file under src/mentor/rules/ exports. */
export interface RuleGroupModule {
  /** position of the group in RULES (lower first; ties by file path) */
  order: number;
  rules: MentorRule[];
}

export { MENTOR_PARAMS, TIMEOUT_RULE } from "./rules/diagnostic";
export { RULES, ALL_RULES, ruleById, collectRules, RULE_FILES } from "./rules/index";
