// ---------------------------------------------------------------------------
// Chart sections of the full case (proc-foundation-scenarios-ledger).
//
// Every src/ui/access/chart/*.tsx exports `section: CaseSection`: a block
// the chart panel renders under the chart, consent and time-out (planted
// problems, pre-procedure orders, the access plan, consent and so on).
// Nothing lists the files; a package adds a section by adding a file here.
// Sections are sorted by order, then id, and shown while applies(session)
// is true. Section files import this index with `import type` only.
// ---------------------------------------------------------------------------

import type { ComponentType } from "react";
import type { CaseSession } from "../../../simulation/session/caseSession";

export interface CaseSectionProps {
  session: CaseSession;
  /** run something on the session and re-render (useProcedureStore.act) */
  act: <T>(fn: (s: CaseSession) => T) => T | undefined;
}

/** A section of the chart or orders panel. */
export interface CaseSection {
  id: string;
  /** heading, sentence case */
  title: string;
  /** position (lower first) */
  order: number;
  /** whether to show it for this session now (default always) */
  applies?: (s: CaseSession) => boolean;
  Component: ComponentType<CaseSectionProps>;
}

export interface CaseSectionModule {
  section?: CaseSection;
}

/** Collect sections from glob modules (path to module). Throws on a malformed section or a duplicate id. */
export function collectCaseSections(files: Record<string, unknown>, where: string): CaseSection[] {
  const out: CaseSection[] = [];
  const seen = new Set<string>();
  for (const file of Object.keys(files).sort()) {
    const sec = (files[file] as CaseSectionModule | undefined)?.section;
    const component = !!sec && (typeof sec.Component === "function" || (typeof sec.Component === "object" && sec.Component !== null));
    if (!sec || typeof sec.id !== "string" || !sec.id || !component)
      throw new Error(`${where} section file ${file} does not export a 'section' with an id and a Component`);
    if (seen.has(sec.id)) throw new Error(`${where} section id '${sec.id}' is used twice`);
    seen.add(sec.id);
    out.push(sec);
  }
  return out.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

const FILES = import.meta.glob<CaseSectionModule>(["./*.tsx", "!./*.test.tsx"], { eager: true });

/** The chart sections, in display order. */
export const CHART_SECTIONS: readonly CaseSection[] = collectCaseSections(FILES, "chart");
