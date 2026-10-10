import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import Settings from "./Settings";
import { computeEngagement, engagementThresholds, FIXED_ENGAGEMENT_THRESHOLDS, initialControls } from "../../simulation/engagement";
import { buildAnatomy } from "../../simulation/anatomy";
import { caseById } from "../../simulation/caseGenerator";
import { catheterById } from "../../data/catheters";

const text = () =>
  renderToString(createElement(Settings))
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/\s+/g, " ");

describe("Settings: the difficulty description matches current behaviour", () => {
  it("says engagement is the same at every difficulty and that help follows the lab policy, not difficulty", () => {
    const t = text();
    expect(t).toContain("Simulation difficulty");
    expect(t).toContain("Hints and attending prompts follow your entrustment level and the activity you open, not this setting");
    expect(t).toContain("Catheter engagement is judged against the same tolerance at every difficulty");
    // the old per-difficulty tolerance claims are gone
    expect(t).not.toMatch(/wider engagement tolerances|forgiving pressure|realistic tolerances|tight tolerances/i);
    for (const d of ["beginner", "intermediate", "advanced"]) expect(t.toLowerCase()).toContain(d);
    expect(t).toContain("The daily challenge and exam mode always use it");
    // no difficulty claims to change the help given: nothing in the code does that yet
    expect(t).not.toMatch(/most help|less help|least help|difficulty changes the help/i);
  });

  it("engagement is judged the same at every difficulty", () => {
    for (const d of ["beginner", "intermediate", "advanced"] as const) expect(engagementThresholds(d)).toBe(FIXED_ENGAGEMENT_THRESHOLDS);
    const model = buildAnatomy(caseById("easy-rca-0")!);
    const cath = catheterById("JR4")!;
    for (let tq = -1; tq <= 1; tq += 0.25) {
      const s = { ...initialControls(), torque: tq, cmdTorque: tq };
      const kinds = (["beginner", "intermediate", "advanced"] as const).map((d) => computeEngagement(model, cath, s, d).kind);
      expect(new Set(kinds).size).toBe(1);
    }
  });
});
