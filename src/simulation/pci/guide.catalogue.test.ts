import { describe, expect, it } from "vitest";
import { GUIDES, GUIDE_FRENCH } from "./equipment";
import { backupForce, initialGuide } from "./guide";

describe("guide catalogue back-up", () => {
  it("back-up rises with French size from 5 to 8 Fr for every guide", () => {
    for (const g of GUIDES) {
      const b = GUIDE_FRENCH.map((fr) => backupForce(initialGuide(g.id, true, fr)));
      for (let i = 1; i < b.length; i++) expect(b[i], `${g.id} ${GUIDE_FRENCH[i]} Fr`).toBeGreaterThan(b[i - 1]);
    }
  });

  it("the original ordering holds (EBU > JL, 7 Fr > 6 Fr), and an unknown guide falls back to a JL4", () => {
    expect(backupForce(initialGuide("EBU3.5"))).toBeGreaterThan(backupForce(initialGuide("JL4")));
    expect(backupForce(initialGuide("JL4", true, 7))).toBeGreaterThan(backupForce(initialGuide("JL4", true, 6)));
    expect(backupForce(initialGuide("no-such-guide"))).toBeCloseTo(backupForce(initialGuide("JL4")), 9);
  });

  it("a guide whose back-up differs by side uses its side value only when the side is set", () => {
    const left = backupForce(initialGuide("AL2", true, 6, { side: "left" }));
    const right = backupForce(initialGuide("AL2", true, 6, { side: "right" }));
    const unset = backupForce(initialGuide("AL2"));
    expect(right).toBeGreaterThan(left);
    expect(unset).toBeCloseTo(left, 9);
    // guides without side values are unchanged by the side
    expect(backupForce(initialGuide("JR4", true, 6, { side: "right" }))).toBeCloseTo(backupForce(initialGuide("JR4")), 9);
  });

  it("length and side holes are carried on the guide state; the default state is unchanged", () => {
    const g = initialGuide("EBU3.5", true, 6, { lengthCm: 90, sideHoles: true });
    expect(g.lengthCm).toBe(90);
    expect(g.sideHoles).toBe(true);
    expect(initialGuide("EBU3.5")).toEqual({ id: "EBU3.5", french: 6, engaged: true, depthMm: 0, coaxial: 0.85, extensionMm: null, buddy: false });
  });
});
