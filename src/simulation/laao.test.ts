import { describe, it, expect } from "vitest";
import {
  LAAO_SCENARIOS,
  TOE_ANGLES,
  COMPRESSION_WINDOW,
  LEAK_LIMIT_MM,
  POSITION_BANDS,
  compressionPct,
  compressionByAngle,
  suggestedLaaoSizes,
  maxLandingZone,
  minLandingZone,
  maxSizing,
  sizingDimension,
  PLUG_LENGTH_RATIO,
  minDepth,
  maxOstium,
  discDiameter,
  deviceLengthMm,
  assessLaao,
  bestLaaoPlan,
  scoreLaao,
  levelFromScore,
  compressionWindow,
  PLUG_MIN_COMPRESSION_PCT,
  type LaaoScenario,
  type LaaoPlan,
} from "./laao";

const byId = (id: string): LaaoScenario => {
  const s = LAAO_SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`missing scenario ${id}`);
  return s;
};

const plan = (over: Partial<LaaoPlan> = {}): LaaoPlan => ({
  type: "plug",
  sizeMm: 30,
  positionMm: 2,
  coaxial: true,
  recaptures: 0,
  ...over,
});

describe("scenario integrity", () => {
  it("covers the four morphologies", () => {
    expect(new Set(LAAO_SCENARIOS.map((s) => s.morphology))).toEqual(new Set(["chicken-wing", "windsock", "cactus", "cauliflower"]));
    for (const s of LAAO_SCENARIOS) expect(s.vignette.toLowerCase()).toContain("synthetic");
  });

  it.each(LAAO_SCENARIOS.map((s) => [s.id, s] as const))("%s: measured at 0/45/90/135° with plausible geometry", (_id, s) => {
    expect(s.measurements.map((m) => m.angle)).toEqual(TOE_ANGLES);
    for (const m of s.measurements) {
      expect(m.landingZoneMm).toBeLessThan(m.ostiumMm); // the neck narrows beyond the ostium
      expect(m.depthMm).toBeGreaterThan(8);
    }
    // Oval: the angles do not all agree.
    expect(maxLandingZone(s)).toBeGreaterThan(minLandingZone(s));
    // Every case has at least one device that meets the compression window.
    expect(suggestedLaaoSizes(s, "plug").length + suggestedLaaoSizes(s, "lobe-disc").length).toBeGreaterThan(0);
  });
});

describe("compression arithmetic", () => {
  it("compression = (nominal − measured) / nominal", () => {
    expect(compressionPct(30, 24)).toBeCloseTo(20, 9);
    expect(compressionPct(24, 24)).toBe(0);
    expect(compressionPct(20, 22)).toBeLessThan(0);
  });

  it("the narrowest angle gives the highest compression", () => {
    const s = byId("laao-windsock");
    for (const type of ["plug", "lobe-disc"] as const) {
      const c = compressionByAngle(s, type, 30);
      const narrowest = s.measurements.reduce((a, b) => (sizingDimension(type, b) < sizingDimension(type, a) ? b : a));
      expect(c.find((x) => x.angle === narrowest.angle)!.pct).toBe(Math.max(...c.map((x) => x.pct)));
    }
  });

  it("the plug is sized against the ostium and the lobe against the landing zone (SIM_FACTS item 7)", () => {
    const s = byId("laao-windsock");
    expect(maxSizing(s, "plug")).toBe(maxOstium(s));
    expect(maxSizing(s, "lobe-disc")).toBe(maxLandingZone(s));
    // A plug needs usable depth of about half its diameter.
    expect(PLUG_LENGTH_RATIO).toBeCloseTo(0.5, 9);
    expect(deviceLengthMm("plug", 30)).toBeCloseTo(15, 9);
    // The disc is wider than the lobe.
    expect(discDiameter(25)).toBeGreaterThan(25);
  });

  it("suggested sizes keep compression inside the family's window at every angle (the plug's minimum is the module's 8%)", () => {
    expect(compressionWindow("plug")).toEqual({ min: PLUG_MIN_COMPRESSION_PCT, max: COMPRESSION_WINDOW.max });
    expect(PLUG_MIN_COMPRESSION_PCT).toBe(8);
    expect(compressionWindow("lobe-disc")).toEqual(COMPRESSION_WINDOW);
    for (const s of LAAO_SCENARIOS) {
      for (const type of ["plug", "lobe-disc"] as const) {
        const w = compressionWindow(type);
        for (const size of suggestedLaaoSizes(s, type)) {
          for (const a of compressionByAngle(s, type, size)) {
            expect(a.pct).toBeGreaterThanOrEqual(w.min - 1e-9);
            expect(a.pct).toBeLessThanOrEqual(w.max + 1e-9);
          }
        }
      }
    }
  });

  it("sizing from a single narrow angle undersizes the device", () => {
    const s = byId("laao-windsock");
    const narrowOnly = s.measurements.find((m) => m.angle === 90)!.ostiumMm;
    // A plug chosen to give some compression on the 90° ostium alone…
    const naive = 24;
    expect(compressionPct(naive, narrowOnly)).toBeGreaterThan(0);
    // …has no compression at the widest angle and fails to anchor.
    const o = assessLaao(s, plan({ sizeMm: naive }));
    expect(o.compression.min).toBeLessThan(COMPRESSION_WINDOW.min);
    expect(o.anchor).not.toBe("stable");
  });
});

describe("PASS criteria and risks", () => {
  it("a well-chosen plug in a windsock passes all four criteria", () => {
    const s = byId("laao-windsock");
    expect(suggestedLaaoSizes(s, "plug")).toContain(30);
    const o = assessLaao(s, plan({ sizeMm: 30, positionMm: 2 }));
    expect(o.allPass).toBe(true);
    expect(o.pass.position.status).toBe("pass");
    expect(o.pass.anchor.status).toBe("pass");
    expect(o.pass.size.status).toBe("pass");
    expect(o.pass.seal.status).toBe("pass");
    expect(o.leakMm).toBeLessThanOrEqual(LEAK_LIMIT_MM);
    expect(o.embolisation.level).toBe("low");
  });

  it("undersizing worsens anchor, leak and embolisation monotonically", () => {
    const s = byId("laao-windsock");
    const sizes = [24, 27, 30];
    const outs = sizes.map((sz) => assessLaao(s, plan({ sizeMm: sz, positionMm: 1 })));
    for (let i = 1; i < outs.length; i++) {
      expect(outs[i].leakMm).toBeLessThanOrEqual(outs[i - 1].leakMm);
      expect(outs[i].embolisation.score).toBeLessThanOrEqual(outs[i - 1].embolisation.score);
    }
    expect(outs[0].embolisation.level).not.toBe("low");
  });

  it("oversizing raises pericardial effusion risk", () => {
    const s = byId("laao-windsock");
    const ok = assessLaao(s, plan({ sizeMm: 30, positionMm: 1 }));
    const big = assessLaao(s, plan({ sizeMm: 36, positionMm: 1 }));
    expect(big.compression.max).toBeGreaterThan(COMPRESSION_WINDOW.max);
    expect(big.effusion.score).toBeGreaterThan(ok.effusion.score);
    expect(big.pass.size.status).not.toBe("pass");
  });

  it("chicken wing: a plug must sit proud at the ostium; pushing it deeper drives it into the bend", () => {
    const s = byId("laao-chicken-wing");
    const size = suggestedLaaoSizes(s, "plug")[0];
    expect(deviceLengthMm("plug", size)).toBeGreaterThan(minDepth(s));
    const deep = assessLaao(s, plan({ sizeMm: size, positionMm: 4 }));
    expect(deep.overshootMm).toBeGreaterThan(0);
    expect(deep.effusion.level).not.toBe("low");
    expect(deep.pass.position.status).toBe("fail");
    const shallow = assessLaao(s, plan({ sizeMm: size, positionMm: minDepth(s) - deviceLengthMm("plug", size) }));
    expect(shallow.overshootMm).toBe(0);
    expect(shallow.pass.position.status).not.toBe("pass"); // proud of the ostium
    expect(deep.effusion.score).toBeGreaterThan(shallow.effusion.score);
  });

  it("chicken wing: deeper positions raise effusion risk monotonically", () => {
    const s = byId("laao-chicken-wing");
    const pos = [0, 3, 6, 9];
    const eff = pos.map((p) => assessLaao(s, plan({ type: "lobe-disc", sizeMm: 25, positionMm: p })).effusion.score);
    for (let i = 1; i < eff.length; i++) expect(eff[i]).toBeGreaterThanOrEqual(eff[i - 1]);
  });

  it("chicken wing: a lobe-and-disc device in the neck passes", () => {
    const s = byId("laao-chicken-wing");
    const o = assessLaao(s, plan({ type: "lobe-disc", sizeMm: 25, positionMm: 4.5 }));
    expect(o.allPass).toBe(true);
    expect(o.effusion.level).toBe("low");
  });

  it("lobe-and-disc: the disc must exceed the ostium to seal", () => {
    const s = byId("laao-cauliflower");
    const big = assessLaao(s, plan({ type: "lobe-disc", sizeMm: 28, positionMm: 4 }));
    expect(discDiameter(28)).toBeGreaterThanOrEqual(maxOstium(s) + 2);
    expect(big.leakMm).toBe(0);
    const small = assessLaao(s, plan({ type: "lobe-disc", sizeMm: 22, positionMm: 4 }));
    expect(small.leakMm).toBeGreaterThan(big.leakMm);
  });

  it("cauliflower: a plug leaks more than a lobe-and-disc device", () => {
    const s = byId("laao-cauliflower");
    const pl = assessLaao(s, plan({ type: "plug", sizeMm: 36, positionMm: 0 }));
    const ld = assessLaao(s, plan({ type: "lobe-disc", sizeMm: 28, positionMm: 4 }));
    expect(pl.leakMm).toBeGreaterThan(ld.leakMm);
  });

  it("off-axis deployment from a superior puncture increases leak", () => {
    const s = byId("laao-windsock");
    expect(assessLaao(s, plan({ coaxial: false })).leakMm).toBeGreaterThan(assessLaao(s, plan({ coaxial: true })).leakMm);
  });

  it("leak above 5 mm fails the seal criterion", () => {
    const s = byId("laao-windsock");
    const o = assessLaao(s, plan({ sizeMm: 24, positionMm: 5, coaxial: false }));
    expect(o.leakMm).toBeGreaterThan(LEAK_LIMIT_MM);
    expect(o.pass.seal.status).toBe("fail");
    expect(o.allPass).toBe(false);
  });

  it("repeated recaptures add effusion risk", () => {
    const s = byId("laao-cactus");
    expect(assessLaao(s, plan({ sizeMm: 30, positionMm: 0, recaptures: 3 })).effusion.score).toBeGreaterThan(
      assessLaao(s, plan({ sizeMm: 30, positionMm: 0 })).effusion.score
    );
  });

  it("deep implantation adds a device-related thrombus note", () => {
    const s = byId("laao-windsock");
    const deep = assessLaao(s, plan({ positionMm: 5.5 }));
    expect(deep.drtNotes.some((n) => /uncovered pocket/.test(n))).toBe(true);
    expect(assessLaao(s, plan()).drtNotes.length).toBeGreaterThan(0);
  });

  it("position bands are ordered", () => {
    for (const t of ["plug", "lobe-disc"] as const) {
      const b = POSITION_BANDS[t];
      expect(b.acceptable[0]).toBeLessThanOrEqual(b.ideal[0]);
      expect(b.ideal[0]).toBeLessThan(b.ideal[1]);
      expect(b.ideal[1]).toBeLessThanOrEqual(b.acceptable[1]);
    }
    expect(levelFromScore(4)).toBe("high");
  });
});

describe("best plan and scoring", () => {
  it("every case has a plan meeting all criteria with low risks", () => {
    for (const s of LAAO_SCENARIOS) {
      const b = bestLaaoPlan(s);
      expect(b.outcome.allPass).toBe(true);
      expect(b.outcome.embolisation.level).toBe("low");
      expect(b.outcome.effusion.level).toBe("low");
    }
  });

  it("short, irregular appendages favour the lobe-and-disc device", () => {
    expect(bestLaaoPlan(byId("laao-chicken-wing")).plan.type).toBe("lobe-disc");
    expect(bestLaaoPlan(byId("laao-cauliflower")).plan.type).toBe("lobe-disc");
  });

  it("scores the best plan highly and penalises skipped angles and releasing a failing device", () => {
    const s = byId("laao-windsock");
    const b = bestLaaoPlan(s);
    const good = scoreLaao(s, { plan: b.plan, anglesMeasured: [...TOE_ANGLES], transseptalQuality: "ideal", transseptalDanger: false, released: true });
    expect(good.score).toBe(100);
    const bad = scoreLaao(s, {
      plan: plan({ sizeMm: 24 }),
      anglesMeasured: [90],
      transseptalQuality: "poor",
      transseptalDanger: false,
      released: true,
    });
    expect(bad.score).toBeLessThan(60);
    expect(bad.deductions.some((d) => /released despite/i.test(d.reason))).toBe(true);
  });

  it("is deterministic", () => {
    const s = byId("laao-cactus");
    expect(JSON.stringify(assessLaao(s, plan()))).toBe(JSON.stringify(assessLaao(s, plan())));
  });
});
