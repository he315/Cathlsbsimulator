// Where a femoral puncture bleeds (diag-rhythm-haemodynamic-events): above the femoral head it goes behind the
// peritoneum, hidden and often with a slow pulse; over or below the head it shows at the groin; at the wrist,
// nothing here.
//   npx vitest run src/simulation/access/punctureBleed.test.ts
import { describe, expect, it } from "vitest";
import { generatePatient } from "../patient/patient";
import { MP_PUNCTURE_BLEED, buildAccessSite, entryVsHead, highPunctureX, punctureBleed } from "./site";

describe("punctureBleed", () => {
  const p = generatePatient("groin");
  const groin = buildAccessSite("femoral", p);
  const wrist = buildAccessSite("radial-right", p);

  it("a high puncture bleeds into the retroperitoneum, hidden, with a slow pulse; one over the head shows at the groin", () => {
    const x = highPunctureX(groin)!;
    expect(entryVsHead(groin, x)).toBe("above");
    expect(punctureBleed(groin, x)).toEqual({ space: "retroperitoneal", rateMlS: MP_PUNCTURE_BLEED.retroperitonealMlS, visibleAtGroin: false, slowPulse: true });
    const over = groin.landmarks.headX!;
    expect(punctureBleed(groin, over).space).toBe("groin");
    expect(punctureBleed(groin, over).visibleAtGroin).toBe(true);
    expect(punctureBleed(groin, groin.landmarks.headFrom! - 5).space).toBe("groin");
  });

  it("at the wrist there is no femoral bleed and no high puncture", () => {
    expect(highPunctureX(wrist)).toBeNull();
    expect(punctureBleed(wrist, 0)).toEqual({ space: "none", rateMlS: 0, visibleAtGroin: false, slowPulse: false });
  });
});
