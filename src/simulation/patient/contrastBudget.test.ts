import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { contrastBudget, contrastBudgetForProfile, crossedPoints, CONTRAST_BUDGET_DEFAULTS, CONTRAST_RULE_SOURCES } from "./contrastBudget";
import { generatePatient } from "./patient";
import { PatientEngine } from "./engine";

describe("contrast ceilings (contrastBudget.ts)", () => {
  it("eGFR 45 gives 166.5 mL by the Brilakis rule; 60 mL two days earlier is subtracted; both rules are reported with their source", () => {
    const b = contrastBudget({ egfr: 45, weightKg: 80, recent: [{ ml: 60, daysAgo: 2 }] });
    const bril = b.rules.find((r) => r.id === "brilakis-gfr")!;
    const ox = b.rules.find((r) => r.id === "oxford-weight")!;
    expect(bril.ceilingMl).toBe(166.5);
    expect(bril.availableMl).toBe(106.5);
    expect(b.recentMl).toBe(60);
    expect(ox.ceilingMl).toBe(400); // 5 mL/kg × 80 kg, the stricter end of Oxford's 5–7 mL/kg
    expect(ox.availableMl).toBe(340);
    expect(b.stricter.id).toBe("brilakis-gfr");
    expect(b.ceilingMl).toBe(106.5);
    for (const r of b.rules) {
      expect(r.source.book.length).toBeGreaterThan(0);
      expect(r.source.where).toMatch(/\.ts:\d+$/);
      expect(r.formula.length).toBeGreaterThan(10);
    }
    expect(bril.source.book).toMatch(/Brilakis/);
    expect(ox.source.book).toMatch(/Oxford/);
  });

  it("each rule's source location still states the rule in the module text", () => {
    const root = join(__dirname, "..", "..", "content", "manual");
    const says: Record<string, string> = {
      "brilakis-gfr": "3.7 × GFR",
      "brilakis-crcl-cto": "3.7 × creatinine clearance",
      "oxford-weight": "5–7 mL/kg",
      "advanced-ckd-below-crcl": "creatinine clearance",
    };
    for (const [id, src] of Object.entries(CONTRAST_RULE_SOURCES)) {
      const [file, line] = src.where.split(":");
      const text = readFileSync(join(root, file), "utf8").split("\n")[Number(line) - 1];
      expect(text, id).toContain(says[id]);
    }
  });

  it("contrast older than the recent window is not counted; without recent contrast nothing is subtracted", () => {
    expect(contrastBudget({ egfr: 45, weightKg: 80, recent: [{ ml: 60, daysAgo: CONTRAST_BUDGET_DEFAULTS.recentWindowDays + 1 }] }).ceilingMl).toBe(166.5);
    expect(contrastBudget({ egfr: 45, weightKg: 80 }).recentMl).toBe(0);
  });

  it("CTO uses 3.7 × creatinine clearance; the Oxford rule wins in a small patient with good kidneys", () => {
    const cto = contrastBudget({ egfr: 60, crclMlMin: 50, weightKg: 80, cto: true });
    expect(cto.rules.map((r) => r.id)).toEqual(["brilakis-crcl-cto", "oxford-weight"]);
    expect(cto.stricter.ceilingMl).toBe(185);
    const small = contrastBudget({ egfr: 110, weightKg: 45 });
    expect(small.stricter.id).toBe("oxford-weight");
    expect(small.ceilingMl).toBe(225);
    expect(contrastBudget({ egfr: 110, weightKg: 45, oxfordMlPerKg: 7 }).ceilingMl).toBe(315);
  });

  it("warns at 80% of the stricter ceiling and announces 50% and 100%, configurable", () => {
    const b = contrastBudget({ egfr: 45, weightKg: 80, usedMl: 140 });
    expect(b.warnAtMl).toBe(133.2);
    expect(b.status).toBe("warn");
    expect(b.announcements).toEqual([
      { fraction: 0.5, ml: 83.3 },
      { fraction: 1, ml: 166.5 },
    ]);
    expect(contrastBudget({ egfr: 45, weightKg: 80, usedMl: 100 }).status).toBe("ok");
    expect(contrastBudget({ egfr: 45, weightKg: 80, usedMl: 170 }).status).toBe("over");
    expect(contrastBudget({ egfr: 45, weightKg: 80, usedMl: 140, warnFraction: 0.9 }).status).toBe("ok");
    expect(crossedPoints(b, 80, 140)).toEqual([0.5, 0.8]);
    expect(crossedPoints(b, 140, 170)).toEqual([1]);
    expect(crossedPoints(b, 10, 20)).toEqual([]);
  });

  it("a planned limit below the stricter rule becomes the ceiling; advanced CKD adds the below-clearance advisory", () => {
    expect(contrastBudget({ egfr: 45, weightKg: 80, planMl: 120 }).ceilingMl).toBe(120);
    expect(contrastBudget({ egfr: 45, weightKg: 80, planMl: 300 }).ceilingMl).toBe(166.5);
    const ckd = contrastBudget({ egfr: 25, crclMlMin: 28, weightKg: 80 });
    expect(ckd.advisories.map((a) => a.id)).toEqual(["advanced-ckd-below-crcl"]);
    expect(ckd.advisories[0].limitMl).toBe(28);
  });

  it("reads a generated patient and the engine announces the shared ceiling once per point", () => {
    const p = { ...generatePatient(5), recentContrast: [{ ml: 30, daysAgo: 1 }] };
    const b = contrastBudgetForProfile(p);
    expect(b.rules[0].ceilingMl).toBeCloseTo(3.7 * p.renal.egfr, 1);
    expect(b.recentMl).toBe(30);
    const e = new PatientEngine({ profile: { ...p, allergies: { contrast: "none", other: [] } }, lesions: [] });
    e.setTip({ location: "aorta" });
    e.advance(2);
    e.drainEvents();
    const ceiling = e.contrastBudget().ceilingMl;
    let given = 0;
    while (given < ceiling * 1.05) {
      e.contrast(8, "root");
      given += 8;
    }
    const ev = e.drainEvents().filter((x) => x.kind === "contrast.budget");
    expect(ev.map((x) => x.data?.fraction)).toEqual([0.5, 0.8, 1]);
    expect(ev.find((x) => x.data?.fraction === 0.8)?.data?.warning).toBe(true);
    expect(e.contrastBudget().status).toBe("over");
  });

  it("an explicit recent: undefined keeps the profile's recent contrast", () => {
    const p = { ...generatePatient(5), recentContrast: [{ ml: 30, daysAgo: 1 }] };
    expect(contrastBudgetForProfile(p, { recent: undefined }).recentMl).toBe(30);
  });

  it("the engine uses crossedPoints: one injection across several points emits them in ascending order, and a ceiling already used up announces every point once", () => {
    const quiet = (p: ReturnType<typeof generatePatient>) => ({ ...p, allergies: { contrast: "none" as const, other: [] } });
    const fractions = (e: PatientEngine) =>
      e
        .drainEvents()
        .filter((x) => x.kind === "contrast.budget")
        .map((x) => x.data?.fraction);
    // one large injection from 0 to beyond the ceiling
    const a = new PatientEngine({ profile: quiet(generatePatient(5)), lesions: [] });
    a.setTip({ location: "aorta" });
    a.advance(1);
    a.drainEvents();
    a.contrast(a.contrastBudget().ceilingMl * 1.1, "root");
    expect(fractions(a)).toEqual([0.5, 0.8, 1]);
    // recent contrast beyond the ceiling: ceilingMl 0, the first injection emits each point once
    const g = generatePatient(5);
    const b = new PatientEngine({ profile: quiet({ ...g, recentContrast: [{ ml: 5000, daysAgo: 1 }] }), lesions: [] });
    expect(b.contrastBudget().ceilingMl).toBe(0);
    b.setTip({ location: "aorta" });
    b.advance(1);
    b.drainEvents();
    b.contrast(5, "root");
    expect(fractions(b)).toEqual([0.5, 0.8, 1]);
    b.contrast(5, "root");
    expect(fractions(b)).toEqual([]);
    // a restored snapshot does not announce passed points again
    const sn = b.snapshot();
    b.restore(sn);
    b.contrast(5, "root");
    expect(fractions(b)).toEqual([]);
  });
});
