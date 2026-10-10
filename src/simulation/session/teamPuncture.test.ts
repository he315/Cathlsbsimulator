// repair-session-flow (5): a scenario's start state that punctures for the team counts Oxford's
// pre-puncture checklist as done by the team, in supervised and exam mode too: fem-entry-below-head
// opens with the team's needle in and the micro-wire running, and the learner's own puncture after it
// is neither refused nor scored for the checklist. A scenario that opens ready to puncture without a
// team puncture (the 'checklist' drill) still leaves the checklist to the learner.
//   npx vitest run src/simulation/session/teamPuncture.test.ts
import { describe, expect, it } from "vitest";
import { newCaseSession } from "./caseSession";
import { aimedPose } from "./autopilot";
import { planningOf } from "./modules/planning";

describe("a start state that punctures for the team", () => {
  for (const mode of ["guided", "supervised", "exam"] as const) {
    it(`fem-entry-below-head in ${mode} mode opens with the team's needle in and the wire running free, the checklist the team's`, () => {
      const { session: s } = newCaseSession({ scenario: "fem-entry-below-head", mode });
      const m = planningOf(s)!;
      expect(s.teamSetup).toBe(false);
      const st = s.pm.st;
      expect(st.needle).not.toBeNull();
      expect(st.needle!.inserted).toBeGreaterThan(0);
      expect(st.wire?.state).toBe("intraluminal");
      expect(s.accessStep().step).toBe("wire");
      expect(m.state.checklistByTeam).toBe(true);
      expect(m.actions.checklistDone()).toBe(true);
      expect(m.actions.needleBlock()).toBeNull();
      // nothing the team did is in the ledger, and no stop was said for its needle
      expect(s.decisions().some((d) => d.id === "pre-puncture-checklist")).toBe(false);
      expect(s.attending.some((a) => a.stop && /Before the needle/.test(a.text))).toBe(false);
      s.dispose();
    });
  }

  it("the learner punctures again after the team's wire and needle are out: not refused, and the checklist not scored", () => {
    const { session: s } = newCaseSession({ scenario: "fem-entry-below-head", mode: "supervised" });
    // the learner takes the team's wire and needle out and presses (the drill's own step)
    s.abandonPass();
    s.runPending();
    expect(s.pm.st.wire).toBeNull();
    expect(s.placeNeedle(aimedPose(s))).toBe(true);
    expect(s.activeSite.firstPassAt).toBeNull();
    s.advanceNeedle(1);
    expect(s.activeSite.firstPassAt).not.toBeNull();
    expect(s.decisions().some((d) => d.id === "pre-puncture-checklist")).toBe(false);
  });

  it("the 'checklist' drill (no team puncture) still refuses the needle in supervised mode until the checklist is done", () => {
    const { session: s } = newCaseSession({ scenario: "checklist", mode: "supervised" });
    expect(planningOf(s)!.state.checklistByTeam).toBe(false);
    expect(s.placeNeedle(aimedPose(s))).toBe(false);
  });
});
