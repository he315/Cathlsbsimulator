// repair-session-flow (1): the module gate hook. A session module may refuse an action through
// CaseSessionModule.gate(action, args); placeNeedle and femoralDevice consult it, and the session
// speaks the refusal as an attending stop line. The planning module refuses through it instead of
// wrapping the session instance's methods.
//   npx vitest run src/simulation/session/moduleGate.test.ts
import { describe, expect, it } from "vitest";
import { newCaseSession } from "./caseSession";
import { aimedPose, fastForward, prepare } from "./autopilot";
import type { CaseGatedAction, CaseSessionModule } from "./modules/index";
import { planningOf } from "./modules/planning";

/** A module that refuses what `refuse` names, and records every consultation. */
function gateModule(refuse: { current: Partial<Record<CaseGatedAction, string | null>> }, seen: { action: CaseGatedAction; args: unknown }[]) {
  return (): CaseSessionModule => ({
    id: "test-gate",
    attach() {},
    gate(action, args) {
      seen.push({ action, args });
      return refuse.current[action] ?? null;
    },
  });
}

describe("module gate hook", () => {
  it("placeNeedle consults the gate: a refusal is spoken as a stop line and the needle stays out; null lets it in", () => {
    const refuse = { current: { placeNeedle: "Stop. Not yet: a test refusal." } as Partial<Record<CaseGatedAction, string | null>> };
    const seen: { action: CaseGatedAction; args: unknown }[] = [];
    const { session: s } = newCaseSession({ seed: "gate-needle", access: "femoral", modules: [gateModule(refuse, seen)] });
    prepare(s);
    const pose = aimedPose(s);
    expect(s.placeNeedle(pose)).toBe(false);
    expect(s.pm.st.needle).toBeNull();
    expect(seen.some((x) => x.action === "placeNeedle" && (x.args as { pose: unknown }).pose === pose)).toBe(true);
    const stops = s.attending.filter((a) => a.stop && a.text === "Stop. Not yet: a test refusal.");
    expect(stops.length).toBe(1);
    expect(s.log.some((l) => l.kind === "attending" && l.text === "Stop. Not yet: a test refusal.")).toBe(true);
    // a second try at once does not repeat the line
    expect(s.placeNeedle(pose)).toBe(false);
    expect(s.attending.filter((a) => a.text === "Stop. Not yet: a test refusal.").length).toBe(1);
    refuse.current = {};
    expect(s.placeNeedle(pose)).toBe(true);
  });

  it("femoralDevice consults the gate with the device kind; a refusal leaves the sheath in and no closure", () => {
    const refuse = { current: { femoralDevice: "Not here: a test refusal." } as Partial<Record<CaseGatedAction, string | null>> };
    const seen: { action: CaseGatedAction; args: unknown }[] = [];
    const { session: s } = newCaseSession({ seed: "gate-device", access: "femoral", modules: [gateModule(refuse, seen)] });
    fastForward(s, "closure");
    expect(s.sheath).not.toBeNull();
    s.femoralDevice("collagen-plug");
    expect(s.femoral).toBeNull();
    expect(s.sheath).not.toBeNull();
    expect(s.attending.some((a) => a.stop && a.text === "Not here: a test refusal.")).toBe(true);
    const asked = seen.filter((x) => x.action === "femoralDevice");
    expect(asked.length).toBe(1);
    expect((asked[0].args as { kind?: string }).kind).toBe("collagen-plug");
    refuse.current = {};
    s.femoralDevice("collagen-plug");
    expect(s.femoral).not.toBeNull();
  });

  it("the planning module gates through the hook: no instance wrapper of placeNeedle or femoralDevice, and its refusals still hold", () => {
    const { session: s } = newCaseSession({ scenario: "checklist", mode: "supervised" });
    const m = planningOf(s)!;
    expect(typeof m.gate).toBe("function");
    expect(Object.prototype.hasOwnProperty.call(s, "placeNeedle")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(s, "femoralDevice")).toBe(false);
    // supervised, the checklist not done: refused through the gate
    expect(m.gate!("placeNeedle", { pose: aimedPose(s) })).toMatch(/^Stop\. Before the needle:/);
    expect(s.placeNeedle(aimedPose(s))).toBe(false);
    expect(s.attending.some((a) => a.stop && /^Stop\. Before the needle:/.test(a.text))).toBe(true);
    s.dispose();
    // the plug groin: the closure device is refused through the gate
    const { session: t } = newCaseSession({ scenario: "closure-device-90d", start: "closure" });
    expect(planningOf(t)!.gate!("femoralDevice", { kind: undefined })).toMatch(/collagen plug/);
    t.femoralDevice();
    expect(t.femoral).toBeNull();
    expect(t.attending.some((a) => a.stop && /collagen plug/.test(a.text))).toBe(true);
  });
});
