// ---------------------------------------------------------------------------
// The debrief section registry (found-mentor-registries).
//
// Every src/ui/mentor/debrief/*.tsx exports `section: DebriefSection`: an
// extra tab of the debrief, shown after the four PEARLS phases when its
// applies(input) is true. Sections are sorted by order, then id. Nothing else
// lists the files, so a package adds a tab by adding a file here (the
// reflection step, the full case's ledger view, a lab's own report). Test
// fixtures live under __fixtures__/ and are not globbed; co-located *.test.tsx
// files are excluded from the glob too, so a test never loads into the app.
//
// Section files import from this index and from Debrief.tsx with
// `import type` only (this index is imported by Debrief.tsx).
// ---------------------------------------------------------------------------

import type { ComponentType } from "react";
import type { DebriefModel } from "../../../mentor/debrief";

/** What a section decides on and draws from. */
export interface DebriefSectionInput {
  model: DebriefModel;
  /** wall time of the case start, for mm:ss */
  t0: number;
}

export interface DebriefSectionProps extends DebriefSectionInput {
  /** open a lesson by id (the Academy; tests pass a stub) */
  onOpenLesson: (lessonId: string) => void;
}

export interface DebriefSection {
  id: string;
  /** tab label, sentence case */
  label: string;
  /** position after the PEARLS phases (lower first) */
  order: number;
  /** whether this debrief has anything for the tab */
  applies: (input: DebriefSectionInput) => boolean;
  Component: ComponentType<DebriefSectionProps>;
}

export interface DebriefSectionModule {
  section: DebriefSection;
}

/** Ids the PEARLS phases use; a section may not take one. */
const RESERVED = new Set(["reactions", "description", "analysis", "summary"]);

/** Collect the sections from glob modules (path to module). Throws on a malformed section or a duplicate id. */
export function collectDebriefSections(modules: Record<string, unknown>): DebriefSection[] {
  const out: DebriefSection[] = [];
  const seen = new Map<string, string>();
  for (const path of Object.keys(modules).sort()) {
    const s = (modules[path] as Partial<DebriefSectionModule> | undefined)?.section;
    if (!s) throw new Error(`debrief section file ${path} does not export 'section'`);
    if (typeof s.id !== "string" || !s.id) throw new Error(`${path}: section id missing`);
    if (RESERVED.has(s.id)) throw new Error(`${path}: section id '${s.id}' is a debrief phase`);
    if (typeof s.label !== "string" || !s.label) throw new Error(`${path}: section '${s.id}' has no label`);
    if (!Number.isFinite(s.order)) throw new Error(`${path}: section '${s.id}' has no order`);
    if (typeof s.applies !== "function") throw new Error(`${path}: section '${s.id}' has no applies()`);
    if (typeof s.Component !== "function" && typeof s.Component !== "object") throw new Error(`${path}: section '${s.id}' has no Component`);
    const prev = seen.get(s.id);
    if (prev) throw new Error(`debrief section id '${s.id}' is declared by ${prev} and ${path}`);
    seen.set(s.id, path);
    out.push(s);
  }
  return out.sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

const FILES = import.meta.glob<DebriefSectionModule>(["./*.tsx", "!./*.test.tsx"], { eager: true });

/** Every registered debrief section, in tab order. */
export const DEBRIEF_SECTIONS: readonly DebriefSection[] = collectDebriefSections(FILES);

/** The sections that apply to this debrief. */
export function sectionsFor(input: DebriefSectionInput, sections: readonly DebriefSection[] = DEBRIEF_SECTIONS): DebriefSection[] {
  return sections.filter((s) => {
    try {
      return s.applies(input);
    } catch {
      return false;
    }
  });
}
