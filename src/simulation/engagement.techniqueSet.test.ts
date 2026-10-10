// The analytic engagement model's additions for the engagement technique set (diag-engagement-technique-set):
// with opts.shortLmBranches (opt-in; the default is the established seat), a Judkins left seated in a short left
// main enters the LAD (a damped, deep-type seat) unless it is one size larger
// than the root needs, when it sits back at the circumflex; and a circumflex ostium in the right sinus belongs to the
// right side, so engaging it gives the right injection's fill list, which draws the circumflex.
//   npx vitest run src/simulation/engagement.techniqueSet.test.ts
import { describe, expect, it } from "vitest";
import { buildAnatomy, injectionFill, type AnatomyModel } from "./anatomy";
import { computeEngagement, computeTip, engagementOptionsFor, initialControls, isShortLeftMain, leftMainLengthMm, shortLmBranch, MP_SHORT_LM_MM, SHORT_LM_BRANCH_OPTS, type EngagementOptions } from "./engagement";
import { caseById, scenarioCase } from "./caseGenerator";
import { catheterById } from "../data/catheters";
import { caseFor } from "../physics/scenarios";
import type { AnatomyVariant, EngagementState, RootSize } from "../types";
import { distance } from "../utils/math";

const model = (root: RootSize, variants: AnatomyVariant[] = [], route: "femoral" | "radial-right" = "femoral"): AnatomyModel => buildAnatomy(caseFor(route, root, variants));

/** Every engagement a catheter reaches over a grid of hub positions (insertion -12..12 mm, torque -1.6..1.6 rad). */
function poses(m: AnatomyModel, cathId: string, opts: EngagementOptions = {}): EngagementState[] {
  const cath = catheterById(cathId)!;
  const out: EngagementState[] = [];
  for (let ins = -12; ins <= 12; ins += 0.25)
    for (let tq = -1.6; tq <= 1.6; tq += 0.02) out.push(computeEngagement(m, cath, { ...initialControls(), insertion: ins, torque: tq }, "advanced", opts));
  return out;
}
const BRANCHING: EngagementOptions = { shortLmBranches: true };
const leftSeats = (es: EngagementState[]) => es.filter((e) => e.kind === "selective-lm" || e.kind === "deep-lm");

describe("the short left main in the analytic model", () => {
  it("the anatomy's short left main is short and the usual one is not", () => {
    expect(leftMainLengthMm(model("normal", ["short-lm"]))!).toBeLessThan(MP_SHORT_LM_MM);
    expect(isShortLeftMain(model("normal", ["short-lm"]))).toBe(true);
    expect(isShortLeftMain(model("normal"))).toBe(false);
    expect(isShortLeftMain(model("normal", ["long-lm"]))).toBe(false);
    // separate ostia: no left main at all
    expect(leftMainLengthMm(model("normal", ["separate-ostia"]))).toBeNull();
  });

  it("a JL one size larger reaches the circumflex ostium in the short-LM variant where the smaller enters the LAD (normal root JL4 and JL4.5, small root JL3.5 and JL4)", () => {
    for (const [root, smaller, larger] of [["normal", "JL4", "JL4.5"], ["small", "JL3.5", "JL4"], ["dilated", "JL5", "JL6"]] as const) {
      const m = model(root, ["short-lm"]);
      expect(shortLmBranch(m, catheterById(smaller)!), `${root} ${smaller}`).toBe("LAD");
      expect(shortLmBranch(m, catheterById(larger)!), `${root} ${larger}`).toBe("LCx");
      // the smaller curve seats only in the LAD: every left seat it reaches is the damped, deep-type one
      const small = leftSeats(poses(m, smaller, BRANCHING));
      expect(small.length, `${root} ${smaller}`).toBeGreaterThan(0);
      expect(small.every((e) => e.kind === "deep-lm" && e.isDeep), `${root} ${smaller}`).toBe(true);
      // the larger one has a free, selective seat at the bifurcation, whose injection fills the left system with the circumflex
      const big = leftSeats(poses(m, larger, BRANCHING));
      expect(big.some((e) => e.kind === "selective-lm"), `${root} ${larger}`).toBe(true);
    }
    expect(injectionFill(model("normal", ["short-lm"]), "left")).toContain("LCx");
  });

  it("with the usual left main nothing changes: a JL4 seats selectively in a normal root, and shapes other than the Judkins left are not affected", () => {
    const m = model("normal");
    expect(shortLmBranch(m, catheterById("JL4")!)).toBeNull();
    expect(leftSeats(poses(m, "JL4")).some((e) => e.kind === "selective-lm")).toBe(true);
    const short = model("normal", ["short-lm"]);
    expect(shortLmBranch(short, catheterById("EBU3.5")!)).toBeNull();
    expect(shortLmBranch(short, catheterById("AL1")!)).toBeNull();
    expect(shortLmBranch(short, catheterById("TIG")!)).toBeNull();
  });
});

describe("the short left main's branch entry is opt-in: the shared engine keeps its default", () => {
  it("without opts.shortLmBranches a Judkins left of the root's size seats selectively in a short left main, so the 'lm-deep' and 'short-lm' presets keep an acceptable left catheter with a free seat", () => {
    for (const key of ["lm-deep", "short-lm"]) {
      for (let i = 0; i < 4; i++) {
        const c = caseById(`${key}-${i}`);
        expect(c, `${key}-${i}`).toBeTruthy();
        expect(c!.variants, key).toContain("short-lm");
        const m = buildAnatomy(c!);
        const lefts = c!.acceptableCatheters.filter((id) => /^JL/.test(id));
        expect(lefts.length, key).toBeGreaterThan(0);
        expect(
          lefts.some((id) => leftSeats(poses(m, id)).some((e) => e.kind === "selective-lm")),
          `${key}-${i}: ${lefts.join(", ")}`
        ).toBe(true);
      }
    }
    // the same seat with the option: the root's size enters the LAD
    const m = model("small", ["small-root", "short-lm"]);
    expect(leftSeats(poses(m, "JL3.5")).some((e) => e.kind === "selective-lm")).toBe(true);
    expect(leftSeats(poses(m, "JL3.5", BRANCHING)).every((e) => e.kind === "deep-lm")).toBe(true);
  });

  it("guides are never branched, with or without the option (the PCI guide stand-in is unchanged)", () => {
    const short = model("normal", ["short-lm"]);
    for (const id of ["EBU3.5", "AL3"]) {
      const cath = catheterById(id)!;
      expect(cath.category, id).toBe("guide");
      expect(shortLmBranch(short, cath), id).toBeNull();
      const plain = poses(short, id).map((e) => e.kind);
      const opted = poses(short, id, BRANCHING).map((e) => e.kind);
      expect(opted, id).toEqual(plain);
    }
  });
});

describe("a circumflex from the right sinus belongs to the right side", () => {
  it("engaging the anomalous circumflex selectively targets the right, whose fill list draws the circumflex; a separate circumflex ostium in the left sinus stays left", () => {
    const m = model("normal", ["anomalous-lcx-right-sinus"]);
    expect(m.sinusOf?.lcx).toBe("right");
    const ost2 = m.leftOstium2!;
    expect(ost2).not.toBeNull();
    // right catheters turned about the right sinus: the seats whose tip is nearer the circumflex ostium than both
    // coronary ostia are the circumflex's, and they are right-sided
    let onCx = 0;
    for (const id of ["JR4", "AL1", "AR"]) {
      const cath = catheterById(id)!;
      for (let ins = -12; ins <= 12; ins += 0.25)
        for (let tq = -2.4; tq <= 2.4; tq += 0.02) {
          const c = { ...initialControls(), insertion: ins, torque: tq };
          const e = computeEngagement(m, cath, c, "advanced");
          if (!e.isSelective && !e.isDeep) continue;
          const tip = computeTip(m, cath, c).pos;
          const dCx = distance(tip, ost2.pos);
          if (dCx < distance(tip, m.rca.pos) && dCx < distance(tip, m.lm.pos)) {
            onCx++;
            expect(e.target, `${id} ${ins} ${tq}`).toBe("right");
          }
        }
    }
    expect(onCx).toBeGreaterThan(0);
    expect(injectionFill(m, "right")).toContain("LCx");
    expect(injectionFill(m, "left")).not.toContain("LCx");

    // a separate circumflex ostium in the left sinus is still part of the left side
    const sep = model("normal", ["separate-ostia"]);
    const cx = sep.leftOstium2!;
    expect(cx).not.toBeNull();
    let onSep = 0;
    for (const id of ["JL4", "JL4.5"]) {
      const cath = catheterById(id)!;
      for (let ins = -12; ins <= 12; ins += 0.25)
        for (let tq = -1.6; tq <= 1.6; tq += 0.02) {
          const c = { ...initialControls(), insertion: ins, torque: tq };
          const e = computeEngagement(sep, cath, c, "advanced");
          if (!e.isSelective && !e.isDeep) continue;
          const tip = computeTip(sep, cath, c).pos;
          if (distance(tip, cx.pos) < distance(tip, sep.lm.pos)) {
            onSep++;
            expect(e.target, `${id} ${ins} ${tq}`).toBe("left");
          }
        }
    }
    expect(onSep).toBeGreaterThan(0);
  });
});

describe("the shapes the set adds engage in the anatomy they are for (analytic model)", () => {
  const reaches = (m: AnatomyModel, id: string, kinds: string[]) => poses(m, id).some((e) => kinds.includes(e.kind));
  it("JL6 and the AL3 guide in a dilated root; JR4.5 and JR5 in a dilated root; AR1 and AR2 at an anterior RCA in a dilated root; the hockey stick and the Williams 3DRC at a shepherd's crook, and the 3DRC at a normal RCA", () => {
    const dilated = model("dilated", ["dilated-root"]);
    expect(reaches(dilated, "JL6", ["selective-lm"])).toBe(true);
    expect(reaches(dilated, "AL3", ["selective-lm", "deep-lm"])).toBe(true);
    for (const id of ["JR4.5", "JR5"]) expect(reaches(dilated, id, ["selective-rca"]), id).toBe(true);
    const anterior = model("dilated", ["dilated-root", "anterior-rca"]);
    for (const id of ["AR1", "AR2"]) expect(reaches(anterior, id, ["selective-rca", "deep-rca"]), id).toBe(true);
    const crook = model("normal", ["shepherds-crook-rca"]);
    for (const id of ["HS", "3DRC"]) expect(reaches(crook, id, ["selective-rca", "deep-rca"]), id).toBe(true);
    expect(reaches(model("normal"), "3DRC", ["selective-rca"])).toBe(true);
  });
});

describe("engagementOptionsFor: the short left main's branch entry for the scenario that teaches it", () => {
  const seeds = Array.from({ length: 40 }, (_, i) => String(i + 1));
  const cases = seeds.map((x) => scenarioCase("diag-lm-damping-causes", x)!);
  const shortCase = cases.find((c) => c.variants.includes("short-lm"));
  const usualCase = cases.find((c) => !c.variants.includes("short-lm"));

  it("returns the shared branching options only for a short-lm case of diag-lm-damping-causes, and the shared defaults otherwise", () => {
    expect(shortCase, "a seed of diag-lm-damping-causes with a short left main").toBeDefined();
    expect(usualCase, "a seed of diag-lm-damping-causes without one").toBeDefined();
    expect(engagementOptionsFor(shortCase!)).toBe(SHORT_LM_BRANCH_OPTS);
    expect(engagementOptionsFor(shortCase!)).toBe(engagementOptionsFor(shortCase!));
    expect(engagementOptionsFor(usualCase!).shortLmBranches).not.toBe(true);
    // the 'short-lm' preset and another scenario with the variant keep the established seat
    expect(engagementOptionsFor(caseFor("femoral", "normal", ["short-lm"])).shortLmBranches).not.toBe(true);
    expect(engagementOptionsFor({ scenarioId: "diag-radial-left-set", variants: ["short-lm"] }).shortLmBranches).not.toBe(true);
  });

  it("in a short-lm case of diag-lm-damping-causes a seated JL4 is deep and damped in the LAD and a seated JL4.5 has a free seat", () => {
    const m = buildAnatomy(shortCase!);
    const opts = engagementOptionsFor(shortCase!);
    const jl4 = leftSeats(poses(m, "JL4", opts));
    expect(jl4.length).toBeGreaterThan(0);
    expect(jl4.every((e) => e.kind === "deep-lm" && e.isDeep)).toBe(true);
    expect(leftSeats(poses(m, "JL4.5", opts)).some((e) => e.kind === "selective-lm")).toBe(true);
    // without the scenario's options the same anatomy keeps the established seat for the JL4
    expect(leftSeats(poses(m, "JL4")).some((e) => e.kind === "selective-lm")).toBe(true);
  });
});
