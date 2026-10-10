// Tips of the table workflow (pci-equipment-tray), beside the event source that raises 'air' (base.ts, its
// complication sources). In lad-focal at 'wire-across' a balloon taken through the tray (box, label, prep
// station, backload) keeps the phase at 'lesion-prep', and tipsFor(ctx, 20) includes pci-balloon-prep-visible
// and pci-balloon-inflation-numbers; the workflow stage is in the snapshot (state.device.stage). An
// unprepared balloon introduced and the guide injected without aspiration puts air down the artery, and once
// the learner names it the context raises 'air'; the air is the device's own (MP_UNPREPARED_GUIDE_AIR_ML),
// as the guide was aspirated after the valve was opened. No waiting.ts entry names pci-equipment-tray, so the
// reachability waiting count does not change because of it.
//   npx vitest run src/ui/lab/pciEvents/tray.tips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { tipsFor, type LabContext } from "../../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS } from "../../../content/lab/raisable/waiting";
import type { PciState } from "../../../simulation/angioPci";
import { advanceDevice, aspirateGuide, backloadDevice, checkLabel, fillPrepSyringe, applySuction, connectIndeflator, requestDevice, setValve } from "../../../simulation/pci/actions/devices";
import { MP_UNPREPARED_GUIDE_AIR_ML } from "../../../simulation/pci/cart";
import { injectPci } from "../../../simulation/pci/actions/imaging";
import { recognisePci } from "../../../simulation/pci/actions/step";
import { timiOf } from "../../../simulation/complications/engine";
import { PciLabSession } from "../../pci/PciLabSession";
import { resolvePciLaunch } from "../../pci/launch";
import { useSeriesStore } from "../../../state/useSeriesStore";
import { pciTipContext } from "../pciTips";
import { raises as BASE_RAISES } from "./base";
import { withRecognition } from "./recognition";

const PKG = "pci-equipment-tray";
const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

const ids = (ctx: LabContext, n = 20) => tipsFor(ctx, n).map((t) => t.id);

function lab(): PciLabSession {
  const r = resolvePciLaunch({ scenario: "lad-focal", start: "wire-across", mode: "guided" });
  expect(r.problems).toEqual([]);
  const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
  sessions.push(x);
  return x;
}
const ctxOf = (x: PciLabSession, st: PciState) => pciTipContext(withRecognition({ ...x.snapshot(), state: st }));

describe("tray tips in lad-focal at 'wire-across' (pci-equipment-tray)", () => {
  it("at phase 'lesion-prep' with a balloon on the tray, the tips include pci-balloon-prep-visible and pci-balloon-inflation-numbers", () => {
    const x = lab();
    let st = checkLabel(requestDevice(x.st, "sc", 2.5, 15, { fromCart: true }));
    st = fillPrepSyringe(st, "1:1");
    const stages: string[] = [st.device!.stage];
    for (let i = 0; i < 3; i++) st = applySuction(st);
    st = connectIndeflator(st);
    stages.push(st.device!.stage);
    st = backloadDevice(st);
    stages.push(st.device!.stage);
    expect(stages).toEqual(["checked", "prepared", "backloaded"]);
    for (const s of [st, advanceDevice(x.s, x.g, setValve(st, true), 1)]) {
      const ctx = ctxOf(x, s);
      expect(ctx.phase).toBe("lesion-prep");
      expect(ids(ctx)).toEqual(expect.arrayContaining(["pci-balloon-prep-visible", "pci-balloon-inflation-numbers"]));
    }
  });

  it("guide air from an unprepared balloon reaches the coronary on the next injection; named, the context raises 'air'", () => {
    const x = lab();
    // the tray's flow: the box from the cart, the label read back, backloaded without preparation, the valve
    // opened and the guide aspirated before the device goes in, so the only air is the device's own
    let st = backloadDevice(checkLabel(requestDevice(x.st, "sc", 2.5, 15, { fromCart: true })));
    expect(st.device!.carriedAirMl).toBe(MP_UNPREPARED_GUIDE_AIR_ML);
    st = aspirateGuide(setValve(st, true));
    expect(st.cx.guideAirMl).toBe(0);
    st = advanceDevice(x.s, x.g, st, 1);
    expect(st.device!.stage).toBe("in-guide");
    expect(st.cx.guideAirMl).toBeCloseTo(MP_UNPREPARED_GUIDE_AIR_ML, 9);
    st = injectPci(x.s, x.g, setValve(st, false), { ml: 8, psi: 60, forceful: false });
    expect(st.cx.guideAirMl).toBe(0);
    const air = st.cx.list.find((c) => c.kind === "air")!;
    expect(air).toBeTruthy();
    expect(ctxOf(x, st).events).not.toContain("air");
    const named = recognisePci(st, { cause: "air", timi: timiOf(air)[0] });
    expect(named.result.recognition?.score.correct).toBe(true);
    const ctx = ctxOf(x, named.st);
    expect(ctx.events).toContain("air");
    expect(BASE_RAISES.events).toContain("air");
  });

  it("every waiting.ts entry naming pci-equipment-tray is satisfiable (there are none)", () => {
    expect(WAITING_TIPS.filter((w) => w.raisedBy === PKG)).toEqual([]);
    expect(DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG)).toEqual([]);
  });
});
