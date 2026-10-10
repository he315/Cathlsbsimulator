// repair-session-flow (2): the public attending and log API for session modules. say() speaks
// through the attending under the visibility policy (stop lines always, critical in exam; a line
// said again within repeatAfterS is not repeated); logEntry() writes the case log. The planning,
// emergencies and hypotension modules use them instead of pushing into session.attending and
// session.log.
//   npx vitest run src/simulation/session/moduleSay.test.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { newCaseSession } from "./caseSession";
import { planningOf } from "./modules/planning";

const MODULE_FILES = ["planning", "emergencies", "hypotension"];

describe("module say and log API", () => {
  it("say: a stop line is always spoken and logged, and critical in exam; a technique line follows the policy", () => {
    const { session: g } = newCaseSession({ seed: "say-guided", access: "radial-right", modules: [] });
    const n = g.attending.length;
    const line = g.say("Stop. A test stop.", "safety", { stop: true });
    expect(line).toMatchObject({ text: "Stop. A test stop.", stop: true, critical: false, severity: "safety" });
    expect(g.attending.length).toBe(n + 1);
    expect(g.log[g.log.length - 1]).toMatchObject({ kind: "attending", text: "Stop. A test stop." });
    expect(g.say("A technique note.", "technique")).not.toBeNull();

    const { session: e } = newCaseSession({ seed: "say-exam", access: "radial-right", mode: "exam", modules: [] });
    expect(e.say("Stop. A test stop.", "safety", { stop: true })!.critical).toBe(true);
    // in exam the attending says nothing but stops
    expect(e.say("A technique note.", "technique")).toBeNull();
    expect(e.say("A safety note.", "safety")).toBeNull();
  });

  it("say: repeatAfterS keeps a line said again at once from being repeated; later it is said again", () => {
    const { session: s } = newCaseSession({ seed: "say-repeat", access: "radial-right", modules: [] });
    const count = () => s.attending.filter((a) => a.text === "Stop. Once.").length;
    expect(s.say("Stop. Once.", "safety", { stop: true, repeatAfterS: 5 })).not.toBeNull();
    expect(s.say("Stop. Once.", "safety", { stop: true, repeatAfterS: 5 })).toBeNull();
    expect(count()).toBe(1);
    s.wait(10);
    s.runPending();
    expect(s.say("Stop. Once.", "safety", { stop: true, repeatAfterS: 5 })).not.toBeNull();
    expect(count()).toBe(2);
  });

  it("logEntry writes the case log at the session time", () => {
    const { session: s } = newCaseSession({ seed: "say-log", access: "radial-right", modules: [] });
    s.wait(30);
    s.runPending();
    s.logEntry("nurse", "A test observation.");
    expect(s.log[s.log.length - 1]).toEqual({ t: Math.round(s.tS * 10) / 10, kind: "nurse", text: "A test observation." });
  });

  it("the planning module's stop goes through say: hold and delay is said and logged once", () => {
    const { session: s } = newCaseSession({ scenario: "doac-recent" });
    planningOf(s)!.actions.act("hold-and-delay");
    const text = "Understood: the case is stopped and rebooked. Nothing more is done today.";
    expect(s.attending.filter((a) => a.text === text && a.stop).length).toBe(1);
    expect(s.log.filter((l) => l.kind === "attending" && l.text === text).length).toBe(1);
    expect(s.log.some((l) => l.kind === "action" && /^Chart: /.test(l.text))).toBe(true);
  });

  it("the planning, emergencies and hypotension modules no longer push into session.attending or session.log", () => {
    for (const f of MODULE_FILES) {
      const src = readFileSync(join(__dirname, "modules", `${f}.ts`), "utf8");
      expect(src, f).not.toMatch(/\bs\.attending\.push\(/);
      expect(src, f).not.toMatch(/\bs\.log\.push\(/);
    }
  });
});
