// ---------------------------------------------------------------------------
// Order sections of the full case (proc-foundation-scenarios-ledger).
//
// Every src/ui/access/orders/*.tsx exports `section: CaseSection` (the same
// shape as the chart sections, src/ui/access/chart/index.ts): a block the
// orders panel renders under the standing orders (the radial cocktail,
// heparin, compression, emergency drugs, infusions and so on). Nothing lists
// the files; a package adds a section by adding a file here. Section files
// import this index with `import type` only.
// ---------------------------------------------------------------------------

import { collectCaseSections, type CaseSection, type CaseSectionModule } from "../chart";

export type { CaseSection, CaseSectionProps } from "../chart";

const FILES = import.meta.glob<CaseSectionModule>(["./*.tsx", "!./*.test.tsx"], { eager: true });

/** The order sections, in display order. */
export const ORDER_SECTIONS: readonly CaseSection[] = collectCaseSections(FILES, "orders");
