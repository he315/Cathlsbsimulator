// access-cx-forearm, after the in-app verification: the card's note follows the surgeons' arrival, a note from
// before the onset does not survive into the episode, and the sealing is announced in the log only in guided mode.
//   npx vitest run src/simulation/session/modules/forearm.findings.test.ts
import { describe, it, expect } from "vitest";
import { newCaseSession, type CaseSession } from "../caseSession";
import { forearmOf } from "./forearm";
import { MP_FOREARM } from "../../access/forearm";

const run = (s: CaseSession, min: number) => {
  s.wait(min * 60);
  s.runPending();
};
const SEALED = "The swelling has stopped getting bigger.";

describe("forearm module: the card's note and the log", () => {
  it("once the surgeons take the arm to theatre, the note says so, not that they are on their way", () => {
    const s = newCaseSession({ scenario: "forearm-compartment" }).session;
    const m = forearmOf(s)!;
    run(s, 1.5);
    expect(m.actions.apply("call-surgeons").ok).toBe(true);
    expect(m.state.note).toMatch(/on their way/);
    run(s, 3 + MP_FOREARM.surgeonsArriveS / 60);
    expect(m.state.episode!.fasciotomyT).not.toBeNull();
    expect(m.state.note).toMatch(/theatre for fasciotomy/);
  });

  it("a look taken before the onset leaves no note once the episode has started", () => {
    const s = newCaseSession({ scenario: "forearm-grade-1" }).session;
    const m = forearmOf(s)!;
    m.actions.look();
    expect(m.state.episode).toBeNull();
    expect(m.state.note).not.toBeNull();
    run(s, 4);
    expect(m.state.episode).not.toBeNull();
    expect(m.state.note).toBeNull();
  });

  it("the sealing is logged in guided mode and not in independent mode", () => {
    const sealedIn = (mode: "guided" | "independent") => {
      const s = newCaseSession({ scenario: "forearm-grade-1", mode }).session;
      const m = forearmOf(s)!;
      run(s, 4);
      m.actions.look();
      for (const x of ["second-band", "ice", "analgesia"] as const) m.actions.apply(x);
      run(s, MP_FOREARM.sealAfterS / 60 + 2);
      expect(m.state.episode!.source.sealedAt).not.toBeNull();
      return s.log.some((l) => l.text === SEALED);
    };
    expect(sealedIn("guided")).toBe(true);
    expect(sealedIn("independent")).toBe(false);
  });
});
