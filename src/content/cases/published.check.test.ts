// Isolated check for the published-case author:
//   npx vitest run src/content/cases/published.check.test.ts
import { describe, it, expect } from "vitest";
import { PUBLISHED_CASES } from "./published";
import { REF_IDS } from "../refs";
import { validateCase } from "../validate";

describe("published cases", () => {
  it("validate, are unique and carry a real source URL", () => {
    const errs: string[] = [];
    const ids = new Set<string>();
    for (const c of PUBLISHED_CASES) {
      if (ids.has(c.id)) errs.push(`duplicate id ${c.id}`);
      ids.add(c.id);
      if (c.provenance.kind !== "published") errs.push(`${c.id}: provenance must be published`);
      validateCase(c, REF_IDS, errs);
    }
    expect(errs).toEqual([]);
    console.log(`${PUBLISHED_CASES.length} published cases`);
  });
});
