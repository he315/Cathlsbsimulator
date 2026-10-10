// The shared tip vocabulary (found-tips-vocabulary): the matching rules every lab relies on, the
// validator rules for the new trigger fields, and a guard that the diagnostic and PCI labs, which
// report a phase only, see exactly the tips they saw before the vocabulary was widened.
//   npx vitest run src/content/lab/tips.test.ts
import { describe, expect, it } from "vitest";
import {
  ACCESS_ROUTES,
  BIF_TECHNIQUES,
  DEPRECATED_LAB_PHASES,
  IMAGING_MODALITIES,
  LAB_EVENTS,
  LAB_PHASES,
  LAB_PROCEDURES,
  LAB_TIPS,
  SUPERSEDED_EVENTS,
  tipScore,
  tipSpecificity,
  tipsFor,
  tipsForAll,
  type LabContext,
  type LabTip,
} from "./tips";
import { validateTips } from "../validate";

/** Fingerprint of the tip data on the day PHASE_ONLY_SNAPSHOT (at the end of this file) was recorded. */
const SNAPSHOT_FINGERPRINT = "969:a14ca619";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * tipsFor exactly as it was before this package (phase, event, requires, catheter, engagement, pressure,
 * vessel, route), ties in registry order. repair-launch-fixture-and-tip-ties replaced the registry-order
 * tie-break with a specificity tie-break, so the comparisons below match scores, not tie order.
 */
function legacyTipsFor(ctx: LabContext, limit: number, tips: readonly LabTip[]): LabTip[] {
  const scored: { tip: LabTip; score: number }[] = [];
  for (const tip of tips) {
    if (tip.lab !== ctx.lab) continue;
    const w = tip.when;
    let score = 0;
    if (w.phase?.length) {
      if (!ctx.phase || !(w.phase as readonly string[]).includes(ctx.phase)) continue;
      score += 1;
    }
    if (w.event?.length) {
      if (!ctx.events?.some((e) => w.event!.includes(e))) continue;
      score += 4;
    }
    if (w.requires?.length) {
      if (!w.requires.every((e) => ctx.events?.includes(e))) continue;
      score += 1;
    }
    if (w.catheter?.length) {
      if (!ctx.catheter || !w.catheter.includes(ctx.catheter)) continue;
      score += 2;
    }
    if (w.engagement?.length) {
      if (!ctx.engagement || !w.engagement.includes(ctx.engagement)) continue;
      score += 2;
    }
    if (w.pressure?.length) {
      if (!ctx.pressure || !w.pressure.includes(ctx.pressure)) continue;
      score += 3;
    }
    if (w.vessel?.length) {
      if (!ctx.vessel || !w.vessel.includes(ctx.vessel)) continue;
      score += 1;
    }
    if (w.route?.length) {
      if (!ctx.route || !w.route.includes(ctx.route)) continue;
      score += 1;
    }
    if (tip.tone === "caution" || tip.tone === "bailout") score += 0.5;
    scored.push({ tip, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.tip);
}

/** A tip uses only the fields that existed before this package. */
function isLegacyTip(t: LabTip): boolean {
  const w = t.when;
  return !t.alsoIn && !w.procedure && !w.technique && !w.step && !w.imaging;
}

/** FNV-1a over every tip's id, lab, tone, trigger and alsoIn: changes when any tip data changes. */
function tipDataFingerprint(): string {
  const s = JSON.stringify(LAB_TIPS.map((t) => [t.id, t.lab, t.tone, t.when, t.alsoIn]));
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${LAB_TIPS.length}:${h.toString(16)}`;
}

/** The 20 phase-only contexts the diagnostic and PCI labs report: every phase of the two labs. */
const PHASE_ONLY_CONTEXTS: LabContext[] = (["diagnostic", "pci"] as const).flatMap((lab) =>
  LAB_PHASES[lab].map((phase) => ({ lab, phase }) as LabContext)
);

const base = LAB_TIPS[0];
const LESSONS = new Set([base.lessonId]);
const REFS = new Set(base.refs ?? []);

function tip(id: string, over: Partial<LabTip>): LabTip {
  return {
    id,
    lab: "pci",
    when: { phase: ["stent"] },
    title: "Test tip",
    text: "A test tip long enough to pass the length rule of the validator.",
    tone: "do",
    lessonId: base.lessonId,
    sources: base.sources,
    ...over,
  };
}

// ---------------------------------------------------------------------------
// Phase-only contexts keep their tips
// ---------------------------------------------------------------------------

describe("phase-only contexts (diagnostic and PCI labs today)", () => {
  it("the snapshot covers 20 contexts, all the diagnostic and PCI phases", () => {
    expect(PHASE_ONLY_CONTEXTS).toHaveLength(20);
    expect(Object.keys(PHASE_ONLY_SNAPSHOT)).toEqual(PHASE_ONLY_CONTEXTS.map((c) => `${c.lab}:${c.phase}`));
  });

  // Recorded with the tipsFor that preceded this package, over the tip data of the same day. When a
  // later package retargets or adds tips the fingerprint changes and this check stands down; the
  // reference comparison below keeps guarding the algorithm.
  // The snapshot's order within a score was registry order; since the specificity tie-break
  // (repair-launch-fixture-and-tip-ties) the check compares the tips and their scores, not tie order.
  it.runIf(tipDataFingerprint() === SNAPSHOT_FINGERPRINT)("tipsFor returns the recorded tips for each context, at the recorded scores", () => {
    for (const ctx of PHASE_ONLY_CONTEXTS) {
      const key = `${ctx.lab}:${ctx.phase}`;
      const got = tipsFor(ctx, 100);
      expect([...got.map((t) => t.id)].sort(), key).toEqual([...PHASE_ONLY_SNAPSHOT[key]].sort());
      const recorded = PHASE_ONLY_SNAPSHOT[key].map((id) => tipScore(LAB_TIPS.find((t) => t.id === id)!, ctx));
      expect(got.map((t) => tipScore(t, ctx)), key).toEqual(recorded);
    }
  });

  it("tipsFor agrees with the previous algorithm on every tip that uses only the previous fields (same tips, same scores, ties by specificity)", () => {
    const legacy = LAB_TIPS.filter(isLegacyTip);
    for (const ctx of PHASE_ONLY_CONTEXTS) {
      const all = legacyTipsFor(ctx, 100, legacy).map((t) => t.id);
      expect([...tipsFor(ctx, 100, legacy).map((t) => t.id)].sort(), `${ctx.lab}:${ctx.phase}`).toEqual([...all].sort());
      for (const limit of [4, 5, 6, 100]) {
        const key = `${ctx.lab}:${ctx.phase} limit ${limit}`;
        const score = (t: LabTip) => tipScore(t, ctx);
        expect(tipsFor(ctx, limit, legacy).map(score), key).toEqual(legacyTipsFor(ctx, limit, legacy).map(score));
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

const NEW_EVENTS = [
  // lesion and scenario
  "left-main-lesion", "graft-lesion", "in-stent-lesion", "scad-suspected", "calcified-lesion", "stent-thrombosis",
  "small-vessel", "large-vessel", "long-lesion", "prior-cabg", "post-arrest", "prior-tavi", "stemi", "nste-acs",
  "high-flow", "contrast-sensitive", "no-onsite-pci", "pregnancy-possible", "pde5-recent", "vasopressor",
  // haemodynamic scenario flags
  "aortic-stenosis", "low-flow-aortic-stenosis", "mitral-stenosis", "hocm", "constriction", "restriction",
  "pulmonary-embolism", "pulmonary-hypertension", "tricuspid-regurgitation", "tricuspid-stenosis", "pulmonary-stenosis",
  "atrial-shunt", "ventricular-shunt", "cardiogenic-shock", "tamponade",
  // patient
  "vt", "atrial-fibrillation", "av-block", "vagal", "lv-ectopy", "pericardial-effusion", "pulmonary-oedema",
  "high-lvedp", "desaturation", "over-sedation", "neuro-deficit",
  // PCI equipment and technique
  "wire-fracture", "balloon-entrapment", "balloon-no-deflate", "balloon-rupture", "stent-loss-wire-out",
  "snare-in-use", "extension-in-place", "epd-deployed", "wire-out-of-guide", "second-wire-with-device",
  // flow
  "no-reflow-refractory", "plaque-embolisation",
  // calcium
  "atherectomy-rotational", "atherectomy-orbital", "burr-not-advancing", "burr-deceleration", "long-run",
  "laser-active", "ivl-active",
  // perforation
  "perforation-large-vessel", "perforation-distal", "perforation-collateral",
  // CTO
  "retrograde", "retrograde-connection",
  // diagnostic
  "vasodilator-given", "operator-dose-alarm", "wire-in-lv", "wire-not-leading", "aspiration-failed",
  "catheter-plugged", "transducer-fault", "contrast-hold-up", "myocardial-stain", "papillary-entrapment",
  "catheter-induced-regurgitation", "non-diagnostic-run", "territory-unsupplied", "graft-stump",
  "subclavian-stenosis", "torque-not-transmitted",
  // access
  "wire-resistance", "wire-misdirected", "wrong-height", "dilator-resistance", "act-high", "pseudoaneurysm",
  // devices
  "catheter-knot", "suction", "pump-migration", "ventilated",
];

describe("vocabulary", () => {
  it("has every event the plan names, each once, and none of the superseded names", () => {
    const events = LAB_EVENTS as readonly string[];
    expect(new Set(events).size).toBe(events.length);
    expect(NEW_EVENTS.filter((e) => !events.includes(e))).toEqual([]);
    for (const [old, agreed] of Object.entries(SUPERSEDED_EVENTS)) {
      expect(events, old).not.toContain(old);
      expect(events, agreed).toContain(agreed);
    }
  });

  it("has the wider access routes, the bedside stage phases and the procedure, technique and imaging lists", () => {
    expect([...ACCESS_ROUTES]).toEqual(expect.arrayContaining(["femoral", "radial", "distal-radial", "ulnar", "femoral-vein", "jugular", "subclavian"]));
    // the deprecated aliases may be removed later (tip-retarget-catchup), together with their DEPRECATED_LAB_PHASES entry
    const deprecated = (DEPRECATED_LAB_PHASES.bedside ?? []) as readonly string[];
    const bedside = LAB_PHASES.bedside as readonly string[];
    expect(bedside.filter((p) => !deprecated.includes(p))).toEqual(["assess", "access", "position", "test", "troubleshoot", "decide", "plan", "needle", "drain"]);
    expect(deprecated.filter((p) => !bedside.includes(p))).toEqual([]);
    expect([...LAB_PROCEDURES]).toEqual(
      expect.arrayContaining([
        "tavi", "bav", "teer", "tteer", "transseptal", "laao", "septal-occluder", "pmc", "septal-ablation",
        "iabp", "impella", "ecmo", "large-bore", "pacing", "tcp", "overdrive", "biopsy", "pericardiocentesis",
      ])
    );
    expect([...BIF_TECHNIQUES]).toEqual(expect.arrayContaining(["provisional", "dk-crush", "culotte", "t-stent", "tap", "reverse-crush", "mini-crush", "v-stent", "sks"]));
    expect([...IMAGING_MODALITIES]).toEqual(expect.arrayContaining(["ivus", "oct"]));
  });
});

// ---------------------------------------------------------------------------
// Validator
// ---------------------------------------------------------------------------

describe("validateTips on the new fields", () => {
  const errsOf = (t: LabTip) => validateTips([t], LESSONS, REFS);

  it("accepts a well-formed tip using every new field", () => {
    const t = tip("pci-test-full", {
      when: { phase: ["stent"], technique: ["dk-crush", "culotte"], step: [2, 4], imaging: ["oct"], requires: ["bifurcation"] },
      alsoIn: [{ lab: "diagnostic", phase: ["views", "finish"] }],
    });
    expect(errsOf(t)).toEqual([]);
    expect(errsOf(tip("structural-test-proc", { lab: "structural", when: { phase: ["plan"], procedure: ["laao", "transseptal"] } }))).toEqual([]);
  });

  it("rejects a step without a technique", () => {
    const errs = errsOf(tip("pci-test-step", { when: { phase: ["stent"], step: [3, 3] } }));
    expect(errs.some((e) => /step is set without a technique/.test(e))).toBe(true);
  });

  it("rejects a step range that runs backwards or is not whole numbers", () => {
    expect(errsOf(tip("pci-test-back", { when: { technique: ["culotte"], step: [4, 2] } })).some((e) => /runs backwards/.test(e))).toBe(true);
    expect(errsOf(tip("pci-test-frac", { when: { technique: ["culotte"], step: [1.5, 2] } })).some((e) => /whole step numbers/.test(e))).toBe(true);
  });

  it("rejects an unknown procedure, technique or imaging modality", () => {
    const bad = tip("mcs-test-bad", {
      lab: "mcs",
      when: { phase: ["insert"], procedure: ["lvad" as never], technique: ["crush" as never], imaging: ["angioscopy" as never] },
    });
    const errs = errsOf(bad);
    expect(errs.some((e) => /unknown procedure "lvad"/.test(e))).toBe(true);
    expect(errs.some((e) => /unknown technique "crush"/.test(e))).toBe(true);
    expect(errs.some((e) => /unknown imaging modality "angioscopy"/.test(e))).toBe(true);
  });

  it("rejects alsoIn with a phase that is not in the borrowing lab", () => {
    // "stent" is a PCI phase, not a diagnostic one
    const errs = errsOf(tip("access-test-borrow", { lab: "access", when: { phase: ["puncture"] }, alsoIn: [{ lab: "diagnostic", phase: ["stent"] }] }));
    expect(errs.some((e) => /alsoIn phase "stent" is not a diagnostic phase/.test(e))).toBe(true);
  });

  it("rejects alsoIn naming the tip's own lab, a lab twice, an unknown lab or nothing", () => {
    expect(errsOf(tip("pci-test-own", { alsoIn: [{ lab: "pci" }] })).some((e) => /own lab/.test(e))).toBe(true);
    expect(errsOf(tip("pci-test-twice", { alsoIn: [{ lab: "diagnostic" }, { lab: "diagnostic" }] })).some((e) => /twice/.test(e))).toBe(true);
    expect(errsOf(tip("pci-test-unknown", { alsoIn: [{ lab: "ward" as never }] })).some((e) => /unknown lab "ward"/.test(e))).toBe(true);
    expect(errsOf(tip("pci-test-empty", { alsoIn: [] })).some((e) => /alsoIn is empty/.test(e))).toBe(true);
  });

  it("rejects an alsoIn entry with an empty phase list, or one that would show the tip at every phase", () => {
    const empty = errsOf(tip("pci-test-nophase", { when: { phase: ["plan"], requires: ["prior-cabg"] }, alsoIn: [{ lab: "diagnostic", phase: [] }] }));
    expect(empty.some((e) => /alsoIn diagnostic has an empty phase list/.test(e))).toBe(true);
    const open = errsOf(tip("pci-test-open", { when: { phase: ["plan"] }, alsoIn: [{ lab: "diagnostic" }] }));
    expect(open.some((e) => /alsoIn diagnostic sets no phase .* every diagnostic phase/.test(e))).toBe(true);
    // with another condition the borrow is still conditional, so no phase is acceptable
    expect(errsOf(tip("pci-test-cond", { when: { phase: ["plan"], requires: ["prior-cabg"] }, alsoIn: [{ lab: "diagnostic" }] }))).toEqual([]);
  });

  it("names the agreed event when a superseded one is used", () => {
    const errs = errsOf(tip("pci-test-isr", { when: { phase: ["stent"], requires: ["isr" as never] } }));
    expect(errs.some((e) => /unknown required event "isr" \(the agreed name is "in-stent-lesion"\)/.test(e))).toBe(true);
  });

  it("accepts the new routes and bedside stages", () => {
    expect(errsOf(tip("access-test-route", { lab: "access", when: { phase: ["puncture"], route: ["jugular", "subclavian", "distal-radial"] } }))).toEqual([]);
    expect(errsOf(tip("bed-test-stage", { lab: "bedside", when: { phase: ["needle", "drain"], procedure: ["pericardiocentesis"] } }))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Matching the new fields
// ---------------------------------------------------------------------------

describe("tipsFor with the new context fields", () => {
  const TIPS: LabTip[] = [
    tip("pci-t-dk3", { when: { phase: ["stent"], technique: ["dk-crush"], step: [3, 3] } }),
    tip("pci-t-oct", { when: { phase: ["imaging"], imaging: ["oct"] } }),
    tip("structural-t-laao", { lab: "structural", when: { phase: ["plan"], procedure: ["laao"] } }),
    tip("structural-t-tavi", { lab: "structural", when: { phase: ["plan"], procedure: ["tavi", "bav"] } }),
    tip("pci-t-borrowed", { when: { phase: ["plan"], requires: ["prior-cabg"] }, alsoIn: [{ lab: "diagnostic", phase: ["views"] }] }),
    tip("access-t-site", { lab: "access", when: { phase: ["closure"], route: ["femoral"] } }),
  ];
  const ids = (ctx: LabContext) => tipsFor(ctx, 20, TIPS).map((t) => t.id);

  it("technique and step must both match", () => {
    expect(ids({ lab: "pci", phase: "stent", technique: "dk-crush", step: 3 })).toEqual(["pci-t-dk3"]);
    expect(ids({ lab: "pci", phase: "stent", technique: "culotte", step: 3 })).toEqual([]);
    expect(ids({ lab: "pci", phase: "stent", technique: "dk-crush", step: 4 })).toEqual([]);
    expect(ids({ lab: "pci", phase: "stent" })).toEqual([]);
  });

  it("imaging must match the modality in use", () => {
    expect(ids({ lab: "pci", phase: "imaging", imaging: "oct" })).toEqual(["pci-t-oct"]);
    expect(ids({ lab: "pci", phase: "imaging", imaging: "ivus" })).toEqual([]);
    expect(ids({ lab: "pci", phase: "imaging" })).toEqual([]);
  });

  it("procedure matches any procedure in the context", () => {
    expect(ids({ lab: "structural", phase: "plan", procedures: ["laao", "transseptal"] })).toEqual(["structural-t-laao"]);
    expect(ids({ lab: "structural", phase: "plan", procedures: ["bav"] })).toEqual(["structural-t-tavi"]);
    expect(ids({ lab: "structural", phase: "plan" })).toEqual([]);
  });

  it("phases is matched as a union with phase", () => {
    expect(ids({ lab: "access", phase: "puncture", phases: ["closure"], route: "femoral" })).toEqual(["access-t-site"]);
    expect(ids({ lab: "access", phases: ["closure"], route: "femoral" })).toEqual(["access-t-site"]);
    expect(ids({ lab: "access", phase: "puncture", route: "femoral" })).toEqual([]);
  });

  it("alsoIn shows a tip in the borrowing lab at that lab's phases, and the other conditions still apply", () => {
    expect(ids({ lab: "diagnostic", phase: "views", events: ["prior-cabg"] })).toEqual(["pci-t-borrowed"]);
    expect(ids({ lab: "diagnostic", phase: "views" })).toEqual([]);
    expect(ids({ lab: "diagnostic", phase: "plan" as never, events: ["prior-cabg"] })).toEqual([]);
    expect(ids({ lab: "diagnostic", phase: "setup", events: ["prior-cabg"] })).toEqual([]);
    expect(ids({ lab: "pci", phase: "plan", events: ["prior-cabg"] })).toEqual(["pci-t-borrowed"]);
    expect(ids({ lab: "access", phase: "plan", events: ["prior-cabg"] })).toEqual([]);
  });

  it("scores technique +3, step +2, imaging +2 and procedure +2 on top of the phase", () => {
    expect(tipScore(TIPS[0], { lab: "pci", phase: "stent", technique: "dk-crush", step: 3 })).toBe(1 + 3 + 2);
    expect(tipScore(TIPS[1], { lab: "pci", phase: "imaging", imaging: "oct" })).toBe(1 + 2);
    expect(tipScore(TIPS[2], { lab: "structural", phase: "plan", procedures: ["laao"] })).toBe(1 + 2);
    expect(tipScore(TIPS[2], { lab: "structural", phase: "plan" })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tie-break (repair-launch-fixture-and-tip-ties)
// ---------------------------------------------------------------------------

describe("tie-break on equal scores", () => {
  const ids = (ctx: LabContext, tips: LabTip[], n = 20) => tipsFor(ctx, n, tips).map((t) => t.id);
  const at: LabContext = { lab: "pci", phase: "lesion-prep", events: ["balloon-uncrossable"], vessel: "RCA", route: "radial", catheter: "AL" };

  it("tipSpecificity counts conditions set and the alternatives the trigger accepts", () => {
    expect(tipSpecificity(tip("pci-s1", { when: { phase: ["lesion-prep"], event: ["balloon-uncrossable"] } }), at)).toEqual({ conditions: 2, breadth: 2 });
    expect(tipSpecificity(tip("pci-s2", { when: { phase: ["wire", "lesion-prep"], event: ["balloon-uncrossable", "thrombus"] } }), at)).toEqual({ conditions: 2, breadth: 4 });
    // every required event is a further condition; a step range adds its number of steps
    expect(tipSpecificity(tip("pci-s3", { when: { phase: ["stent"], requires: ["bifurcation", "calcified-lesion"], technique: ["culotte"], step: [2, 4] } }), at)).toEqual({ conditions: 5, breadth: 1 + 1 + 3 });
    // a borrowed tip is judged by the phases of its alsoIn entry for the asking lab
    const borrowed = tip("access-s4", { lab: "access", when: { phase: ["puncture", "closure"], requires: ["prior-cabg"] }, alsoIn: [{ lab: "pci", phase: ["plan"] }] });
    expect(tipSpecificity(borrowed, { lab: "pci" })).toEqual({ conditions: 2, breadth: 1 });
    expect(tipSpecificity(borrowed, { lab: "access" })).toEqual({ conditions: 2, breadth: 2 });
  });

  it("a narrower phase or event list goes first, whatever the registry order", () => {
    const TIPS = [
      tip("pci-wide-phase", { when: { phase: ["wire", "lesion-prep", "stent"], event: ["balloon-uncrossable"] } }),
      tip("pci-wide-event", { when: { phase: ["lesion-prep"], event: ["balloon-uncrossable", "stent-uncrossable"] } }),
      tip("pci-narrow", { when: { phase: ["lesion-prep"], event: ["balloon-uncrossable"] } }),
    ];
    expect(TIPS.map((t) => tipScore(t, at))).toEqual([5, 5, 5]);
    expect(ids(at, TIPS)).toEqual(["pci-narrow", "pci-wide-event", "pci-wide-phase"]);
    expect(ids(at, TIPS, 1)).toEqual(["pci-narrow"]);
  });

  it("more conditions set go first at an equal score", () => {
    // phase + vessel + route (1 + 1 + 1) ties with phase + catheter (1 + 2); three conditions beat two
    const TIPS = [
      tip("pci-two", { when: { phase: ["lesion-prep"], catheter: ["AL"] } }),
      tip("pci-three", { when: { phase: ["lesion-prep"], vessel: ["RCA"], route: ["radial"] } }),
    ];
    expect(TIPS.map((t) => tipScore(t, at))).toEqual([3, 3]);
    expect(ids(at, TIPS)).toEqual(["pci-three", "pci-two"]);
  });

  it("caution and bailout tips stay ahead of do tips through the tone bonus in the score, which outranks specificity", () => {
    const TIPS = [
      tip("pci-do-narrow", { when: { phase: ["lesion-prep"], event: ["balloon-uncrossable"] } }),
      tip("pci-caution-wide", { tone: "caution", when: { phase: ["wire", "lesion-prep", "stent"], event: ["balloon-uncrossable", "stent-uncrossable"] } }),
      tip("pci-bailout-wide", { tone: "bailout", when: { phase: ["guide", "lesion-prep"], event: ["balloon-uncrossable", "poor-guide-support"] } }),
    ];
    expect(ids(at, TIPS)).toEqual(["pci-bailout-wide", "pci-caution-wide", "pci-do-narrow"]);
  });

  it("identical triggers keep registry order, and the result does not depend on how often it is asked", () => {
    const TIPS = ["a", "b", "c", "d"].map((x) => tip(`pci-same-${x}`, { when: { phase: ["lesion-prep"], event: ["balloon-uncrossable"] } }));
    expect(ids(at, TIPS)).toEqual(["pci-same-a", "pci-same-b", "pci-same-c", "pci-same-d"]);
    expect(ids(at, TIPS)).toEqual(ids(at, TIPS));
    expect(ids(at, [...TIPS].reverse())).toEqual(["pci-same-d", "pci-same-c", "pci-same-b", "pci-same-a"]);
  });

  it("on the registry, pci-eqb-standard-first is inside tipsFor(ctx, 20) at lesion-prep with balloon-uncrossable", () => {
    const plain: LabContext = { lab: "pci", phase: "lesion-prep", events: ["balloon-uncrossable"] };
    const calcifiedRca: LabContext = { lab: "pci", phase: "lesion-prep", events: ["balloon-uncrossable", "calcified-lesion"], vessel: "RCA" };
    for (const ctx of [plain, { ...plain, vessel: "RCA" } as LabContext, calcifiedRca]) {
      const list = tipsFor(ctx, 20).map((t) => t.id);
      expect(list, JSON.stringify(ctx)).toContain("pci-eqb-standard-first");
      // the order is still by score first
      const scores = tipsFor(ctx, 100).map((t) => tipScore(t, ctx)!);
      for (let i = 1; i < scores.length; i++) expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });

  it("on the registry, a warning never ties a do tip on score, and a do tip ahead of a warning outscores it", () => {
    // The tone bonus (+0.5) is the only fractional term in tipScore, so a caution or bailout tip
    // cannot tie a do tip on score; that is what keeps warnings ahead at equal specificity.
    const ctxs: LabContext[] = [
      ...PHASE_ONLY_CONTEXTS,
      { lab: "pci", phase: "lesion-prep", events: ["balloon-uncrossable"] },
      { lab: "pci", phase: "complication", events: ["perforation", "hypotension"], vessel: "LAD" },
      { lab: "access", phase: "closure", route: "femoral", events: ["bleeding"] },
    ];
    let pairs = 0;
    for (const ctx of ctxs) {
      const out = tipsFor(ctx, 1000);
      for (const t of out) expect(tipScore(t, ctx)! % 1 === 0.5, `${t.id} in ${JSON.stringify(ctx)}`).toBe(t.tone !== "do");
      for (let i = 0; i + 1 < out.length; i++) {
        if (out[i].tone !== "do" || out[i + 1].tone === "do") continue;
        pairs++;
        expect(tipScore(out[i], ctx)!, `${out[i].id} before ${out[i + 1].id}`).toBeGreaterThan(tipScore(out[i + 1], ctx)!);
      }
    }
    // the second check has something to check
    expect(pairs).toBeGreaterThan(0);
  });
});

describe("tipsForAll", () => {
  it("over an access and a diagnostic context returns each tip once, highest score first (synthetic tips)", () => {
    const TIPS: LabTip[] = [
      tip("access-a-low", { lab: "access", when: { phase: ["puncture"] } }),
      tip("access-a-shared", { lab: "access", when: { phase: ["puncture"], event: ["radial-spasm"] }, alsoIn: [{ lab: "diagnostic", phase: ["advance"] }] }),
      tip("diag-d-caution", { lab: "diagnostic", when: { phase: ["advance"] }, tone: "caution" }),
      tip("pci-p-other", { lab: "pci", when: { phase: ["plan"] } }),
    ];
    const ctxs: LabContext[] = [
      { lab: "access", phase: "puncture", events: ["radial-spasm"] },
      { lab: "diagnostic", phase: "advance", events: ["radial-spasm"] },
    ];
    const out = tipsForAll(ctxs, 10, TIPS).map((t) => t.id);
    expect(out).toEqual(["access-a-shared", "diag-d-caution", "access-a-low"]);
    expect(new Set(out).size).toBe(out.length);
    expect(tipsForAll(ctxs, 2, TIPS).map((t) => t.id)).toEqual(["access-a-shared", "diag-d-caution"]);
  });

  it("over an access and a diagnostic context returns each registry tip once, highest score first", () => {
    const ctxs: LabContext[] = [
      { lab: "access", phase: "radial", route: "radial", events: ["radial-spasm"] },
      { lab: "diagnostic", phase: "advance", events: ["radial-spasm", "subclavian-tortuosity"] },
    ];
    const out = tipsForAll(ctxs, 100);
    const ids = out.map((t) => t.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    // the union of the per-context results, each at its best score, in non-increasing score order
    const union = new Set(ctxs.flatMap((c) => tipsFor(c, 100).map((t) => t.id)));
    expect(new Set(ids)).toEqual(union);
    const best = (t: LabTip) => Math.max(...ctxs.map((c) => tipScore(t, c) ?? -Infinity));
    const scores = out.map(best);
    for (let i = 1; i < scores.length; i++) expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    expect(out.some((t) => t.lab === "access")).toBe(true);
    expect(out.some((t) => t.lab === "diagnostic")).toBe(true);
  });

  it("breaks ties by the context where the tip reached its best score, then by registry order", () => {
    // Y precedes X in the registry. X scores 1 in A (borrowed, no phase) and 2 in B; Y scores 2 only in B;
    // Z, last in the registry, scores 2 only in A.
    const TIPS: LabTip[] = [
      tip("diag-y", { lab: "diagnostic", when: { phase: ["advance"], requires: ["radial-spasm"] } }),
      tip("diag-x", { lab: "diagnostic", when: { phase: ["advance"], requires: ["radial-spasm"] }, alsoIn: [{ lab: "access" }] }),
      tip("access-z", { lab: "access", when: { phase: ["puncture"], requires: ["radial-spasm"] } }),
    ];
    const ctxs: LabContext[] = [
      { lab: "access", phase: "puncture", events: ["radial-spasm"] },
      { lab: "diagnostic", phase: "advance", events: ["radial-spasm"] },
    ];
    expect(TIPS.map((t) => ctxs.map((c) => tipScore(t, c)))).toEqual([[null, 2], [1, 2], [2, null]]);
    expect(tipsForAll(ctxs, 10, TIPS).map((t) => t.id)).toEqual(["access-z", "diag-y", "diag-x"]);
  });

  it("with one context it is tipsFor", () => {
    for (const ctx of PHASE_ONLY_CONTEXTS) expect(tipsForAll([ctx]).map((t) => t.id)).toEqual(tipsFor(ctx).map((t) => t.id));
    // including the specificity tie-break, on a context where many tips tie
    const ctx: LabContext = { lab: "pci", phase: "lesion-prep", events: ["balloon-uncrossable"] };
    expect(tipsForAll([ctx], 40).map((t) => t.id)).toEqual(tipsFor(ctx, 40).map((t) => t.id));
  });

  it("breaks a tie within one context by specificity before registry order", () => {
    const TIPS: LabTip[] = [
      tip("access-wide", { lab: "access", when: { phase: ["puncture", "radial"], requires: ["radial-spasm"] } }),
      tip("access-narrow", { lab: "access", when: { phase: ["puncture"], requires: ["radial-spasm"] } }),
    ];
    const ctxs: LabContext[] = [{ lab: "access", phase: "puncture", events: ["radial-spasm"] }];
    expect(tipsForAll(ctxs, 10, TIPS).map((t) => t.id)).toEqual(["access-narrow", "access-wide"]);
  });
});

// ---------------------------------------------------------------------------
// tipsFor(ctx, 100) for each phase-only context, recorded with the tipsFor that preceded this package
// over the tip data whose fingerprint is SNAPSHOT_FINGERPRINT.
// ---------------------------------------------------------------------------

const PHASE_ONLY_SNAPSHOT: Record<string, string[]> = {
  "diagnostic:setup": [
    "diag-rad-pregnancy-check",
    "diag-bg-secondary-mi-question",
    "diag-ocx-scad-setup",
    "diag-planning-contrast-allergy",
    "diag-rad-fluoro-rate-default",
    "diag-rad-lead-check",
    "diag-rad-shield-low-close",
    "diag-safe-ergonomic-setup",
    "diag-caki-prepare",
    "diag-planning-check-in",
    "diag-planning-resuscitation-status",
    "diag-sedation-titrate",
    "diag-root-manifold-ready",
    "diag-root-prep-outside",
    "diag-root-match-curve-to-route",
    "diag-root-previous-catheters",
    "diag-acq-table-up-detector-down",
    "diag-review-previous-films",
  ],
  "diagnostic:advance": [
    "diag-rad-pedal-discipline",
    "diag-root-wire-leads",
    "diag-aspirate-before-engaging",
  ],
  "diagnostic:engage-left": [
    "diag-rad-pedal-discipline",
  ],
  "diagnostic:engage-right": [
    "diag-rad-pedal-discipline",
  ],
  "diagnostic:engage-graft": [
    "diag-bg-depth-second-view",
  ],
  "diagnostic:inject": [
    "diag-rad-grainy-image-flatten",
    "diag-rad-low-magnification",
    "diag-rad-step-back-for-cine",
    "diag-bg-name-view-first",
    "diag-nitrate-dose-by-pressure",
    "diag-test-puff-then-recheck",
    "diag-acq-frame-then-pedal",
    "diag-acq-breath-hold",
  ],
  "diagnostic:views": [
    "diag-rad-c-arm-clear",
    "diag-rad-grainy-image-flatten",
    "diag-rad-low-magnification",
    "diag-operator-moderate-lesion-measure",
    "diag-lv-gram-views",
    "diag-bg-name-view-first",
    "diag-bg-depth-second-view",
    "diag-acq-table-up-detector-down",
    "diag-acq-frame-then-pedal",
    "diag-acq-complete-view-set",
    "diag-interp-orthogonal-worst-view",
    "diag-phys-qfr-acquisition",
  ],
  "diagnostic:lv-aorta": [
    "diag-lvedp-before-lv-gram",
    "diag-lv-gram-clean-cycle",
    "diag-lv-gram-views",
    "diag-bg-wall-to-territory",
  ],
  "diagnostic:exchange": [
    "diag-rad-pedal-discipline",
    "diag-exchange-over-wire",
    "diag-root-prep-outside",
    "diag-aspirate-before-engaging",
  ],
  "diagnostic:finish": [
    "diag-planning-ad-hoc-consent",
    "diag-acq-missing-territory",
    "diag-interp-every-territory",
    "diag-stop-for-heart-team",
    "diag-rad-read-the-dose-panel",
    "diag-operator-review-the-runs",
    "diag-post-ward-handover",
    "diag-post-sedated-results",
    "diag-bg-minoca-working",
    "diag-finish-neuro-check",
    "diag-root-previous-catheters",
    "diag-acq-complete-view-set",
    "diag-ad-hoc-pause",
  ],
  "pci:plan": [
    "pci-operator-know-your-level",
    "pci-safe-state-check",
    "pci-post-oac-clopidogrel",
    "pci-bg-surgery-adherence",
    "pci-bif-no-sb-predilation",
    "pci-bif-atherectomy-two-wires",
    "pci-twostent-atherectomy-two-wires",
    "pci-dkcrush-sb-deploy-pressure",
    "pci-dkcrush-crush-balloon",
    "pci-vstent-sks-guide",
    "pci-ocx-scad-plan",
    "pci-rad-prior-skin-injury",
    "pci-eqb-cart-covered-fit",
    "pci-planning-stent-candidacy",
    "pci-cto-anticoagulant-choice",
    "pci-hit-use-bivalirudin",
    "pci-opioid-delays-p2y12",
    "pci-stent-check-dapt-and-surgery",
    "pci-img-oct-guide-size",
    "pci-img-ostial-coverage",
    "pci-img-scad-caution",
    "pci-img-ct-cap",
    "pci-rad-read-the-ct-first",
    "pci-rad-shallow-working-view",
    "pci-operator-one-target",
    "pci-safe-name-what-could-go-wrong",
    "pci-bif-guide-size",
    "pci-bif-wire-both-branches",
    "pci-bif-mv-stent-size",
    "pci-bif-jail-wire-prep",
    "pci-twostent-guide-size",
    "pci-twostent-prepare-both",
    "pci-twostent-workhorse-wires",
    "pci-dkcrush-mv-balloon-first",
    "pci-dkcrush-sb-protrusion",
    "pci-dkcrush-first-rewire-proximal",
    "pci-twostent-two-step-kiss",
    "pci-dkcrush-second-rewire-distal",
    "pci-twostent-final-pot",
    "pci-twostent-kiss-sequence",
    "pci-culotte-first-branch",
    "pci-culotte-pot-before-rewire",
    "pci-tstent-proximal-marker",
    "pci-minicrush-rewire-proximal",
    "pci-chip-three-domains",
    "pci-ocx-stent-failure-history",
    "pci-ocx-isr-first-or-recurrent",
    "pci-ocx-small-vessel-nitrate",
    "pci-sb-predict",
    "pci-arrhythmia-ecg-baseline",
    "pci-rad-dose-callouts",
    "pci-contrast-budget-ckd",
    "pci-eqb-cart-check",
    "pci-planning-fourteen-steps",
    "pci-planning-old-films",
    "pci-planning-imaging-restenosis",
    "pci-planning-guide-size",
    "pci-planning-bailout-kit",
    "pci-planning-classify-lesion",
    "pci-mon-baseline",
    "pci-mon-time-out",
    "pci-act-device-targets",
    "pci-fondaparinux-add-heparin",
    "pci-check-oral-loading",
    "pci-acq-target-orthogonal-views",
    "pci-interp-qca-calibrate",
    "pci-interp-calcium-look-first",
    "pci-plan-name-the-goal",
    "pci-serial-distal-first",
    "pci-wire-expect-two-bring-microcatheter",
    "pci-img-choose-by-goal",
    "pci-support-plan-two-axes",
    "pci-support-standby-sheath",
    "pci-support-swan-stays",
  ],
  "pci:guide": [
    "pci-eqb-cart-covered-fit",
    "pci-planning-guide-size",
    "pci-act-device-targets",
    "pci-guide-seat-three-marks",
    "pci-support-standby-sheath",
  ],
  "pci:wire": [
    "pci-rad-collimate-check-edges",
    "pci-trap-then-backbleed",
    "pci-wire-stop-at-guide-tip",
    "pci-rad-shallow-working-view",
    "pci-mon-sterile-cockpit",
    "pci-act-before-coronary-devices",
    "pci-wire-start-workhorse",
    "pci-wire-shape-small-first",
    "pci-wire-load-through-valve",
  ],
  "pci:lesion-prep": [
    "pci-rad-collimate-check-edges",
    "pci-operator-check-the-device",
    "pci-bg-lipid-embolisation-forecast",
    "pci-ocx-small-vessel-prep",
    "pci-trap-then-backbleed",
    "pci-balloon-open-the-valve",
    "pci-balloon-rupture-suction",
    "pci-balloon-watermelon",
    "pci-balloon-withdraw-deflated",
    "pci-ocx-scad-stent-long-small",
    "pci-ocx-isr-first-or-recurrent",
    "pci-ocx-long-distal-first",
    "pci-mon-watch-both-ends",
    "pci-mon-wipe-wire",
    "pci-interp-calcium-look-first",
    "pci-prep-wire-check-before-balloon",
    "pci-prep-clear-the-guide",
    "pci-balloon-size-and-length",
    "pci-balloon-prep-visible",
    "pci-balloon-inflation-numbers",
    "pci-delivery-marker-then-screen",
    "pci-img-choose-by-goal",
    "pci-img-nitrate-first",
    "pci-img-calcium-score",
    "pci-img-image-after-modification",
  ],
  "pci:stent": [
    "pci-rad-collimate-check-edges",
    "pci-operator-check-the-device",
    "pci-planning-stent-candidacy",
    "pci-balloon-open-the-valve",
    "pci-balloon-withdraw-deflated",
    "pci-ocx-scad-stent-long-small",
    "pci-ocx-long-image-measure",
    "pci-eqb-thin-strut-visibility",
    "pci-mon-watch-both-ends",
    "pci-mon-sterile-cockpit",
    "pci-mon-wipe-wire",
    "pci-acq-fluoro-save-inflations",
    "pci-serial-distal-first",
    "pci-prep-clear-the-guide",
    "pci-balloon-prep-visible",
    "pci-delivery-marker-then-screen",
    "pci-stent-size-distal",
    "pci-stent-cover-injured-segment",
    "pci-stent-cardiac-motion",
    "pci-stent-hold-the-inflation",
    "pci-img-landing-zone",
    "pci-img-size-distal-reference",
    "pci-img-coreg-landing",
  ],
  "pci:optimise": [
    "pci-ocx-stent-expansion-limit",
    "pci-balloon-rupture-suction",
    "pci-balloon-watermelon",
    "pci-balloon-withdraw-deflated",
    "pci-img-ivus-jumps",
    "pci-img-underexpansion-fix",
    "pci-mon-check-guide-after-removal",
    "pci-mon-wipe-wire",
    "pci-acq-fluoro-save-inflations",
    "pci-optimise-nc-postdilate",
    "pci-optimise-show-the-stent",
    "pci-phys-post-pci-pullback",
    "pci-img-ivus-contrast-saver",
    "pci-img-malapposition",
    "pci-img-edge-dissection",
  ],
  "pci:physiology": [
    "pci-planning-adenosine-history",
    "pci-no-physiology-in-culprit",
    "pci-phys-equalise-fail",
    "pci-phys-no-hyperaemia",
    "pci-phys-diffuse-no-step",
    "pci-ocx-long-pullback",
    "pci-mon-aortic-line-physiology",
    "pci-phys-decide-before-measuring",
    "pci-phys-zero-outside",
    "pci-phys-equalise-at-tip",
    "pci-phys-cross-distal",
    "pci-phys-ic-adenosine-flush",
    "pci-phys-iv-hyperaemia-signs",
    "pci-phys-drift-check",
    "pci-phys-serial-biggest-step",
    "pci-phys-discordance",
    "pci-phys-post-pci-pullback",
    "pci-phys-thermodilution-boluses",
  ],
  "pci:imaging": [
    "pci-bg-lipid-embolisation-forecast",
    "pci-img-cannot-cross",
    "pci-img-ivus-jumps",
    "pci-img-oct-guide-size",
    "pci-img-oct-hold-catheter",
    "pci-img-oct-no-pullback",
    "pci-ocx-stent-failure-image",
    "pci-ocx-small-vessel-nitrate",
    "pci-ocx-large-vessel-ivus",
    "pci-ocx-long-image-measure",
    "pci-planning-imaging-restenosis",
    "pci-img-choose-by-goal",
    "pci-img-nitrate-first",
    "pci-img-ivus-clear-view",
    "pci-img-oct-marker",
    "pci-img-oct-purge-calibrate",
    "pci-img-oct-flush-rates",
    "pci-img-calcium-score",
    "pci-img-landing-zone",
    "pci-img-size-distal-reference",
  ],
  "pci:complication": [
    "pci-operator-help-early",
    "pci-stage-after-complication",
    "pci-safe-scribe-the-timeline",
    "pci-mon-closed-loop",
  ],
  "pci:finish": [
    "pci-post-oac-clopidogrel",
    "pci-ocx-brachytherapy-dapt",
    "pci-ocx-st-lifelong-dapt",
    "pci-operator-log-the-case",
    "pci-operator-one-target",
    "pci-post-report-stents",
    "pci-post-dapt-plan",
    "pci-eqb-cart-restock",
    "pci-mon-sign-out",
    "pci-cangrelor-to-oral",
    "pci-optimise-final-views",
  ],
};

