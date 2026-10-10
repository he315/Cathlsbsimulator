// access-closure-radial: tip integration. The events the radial closure raises are the session's own
// (CASE_SESSION_EVENTS in caseSession.ts: radial-spasm on a gripped sheath, bleeding under or beside the band,
// haematoma for the forearm filling above it), declared for the reachability report through the full case's
// `raises` (src/ui/access/caseTips.ts reads CASE_SESSION_EVENTS), with the closure, sheath, radial and
// complication phases and the radial route.
import { describe, it, expect } from "vitest";
import { newCaseSession, CASE_SESSION_EVENTS } from "./caseSession";
import { TIP_BY_ID, tipsFor, tipScore, type LabContext } from "../../content/lab/tips";
import { WAITING_TIPS, DEFERRED_RETARGETS, type LabRaises } from "../../content/lab/raisable/waiting";
import { caseTipContexts, raises as caseRaises } from "../../ui/access/caseTips";

const PACKAGE = "access-closure-radial";
/** The tips the package makes reachable at the radial closure (lab-build-plan.json tipIntegration). */
const CLOSURE_TIPS = ["access-radial-remove-now", "access-radial-band-inflation", "access-radial-patency-check", "access-cx-radial-band-proximal"];
const EVENT_TIPS = ["access-radial-band-bleeding", "access-radial-spasm-no-traction", "access-sheath-sheathless-spasm"];

const ids = (ctx: LabContext) => tipsFor(ctx, 20).map((t) => t.id);

describe("radial closure tips in the full case", () => {
  it("in scenario closure-radial-7fr-act320-gpi, after the action that raises 'radial-spasm', tipsFor(ctx, 20) includes access-radial-spasm-no-traction and access-sheath-sheathless-spasm", () => {
    const s = newCaseSession({ scenario: "closure-radial-7fr-act320-gpi" }).session;
    // at the closure, before anything is pulled: the closure tips, and no spasm tip yet
    const closure0 = caseTipContexts(s, "closure").find((c) => c.lab === "access")!;
    expect(closure0).toMatchObject({ phase: "closure", route: "radial" });
    for (const id of CLOSURE_TIPS) expect(ids(closure0), id).toContain(id);
    expect(ids(closure0)).not.toContain("access-radial-spasm-no-traction");
    // the action: the band on and the sheath pulled without the vasodilator; the 7 Fr sheath is gripped
    s.applyBand(14);
    s.runPending();
    expect(s.pullRadialSheath()).toBe("gripped");
    expect(s.activeEvents()).toContain("radial-spasm");
    // the access workspace with the sheath still in reports the sheath at the radial site
    const atSheath = caseTipContexts(s, "access")[0];
    expect(atSheath).toMatchObject({ lab: "access", phase: "sheath", phases: ["radial"], route: "radial" });
    const got = ids(atSheath);
    expect(got).toContain("access-radial-spasm-no-traction");
    expect(got).toContain("access-sheath-sheathless-spasm");
    // the closure workspace brings up the no-traction tip too (its complication context as well)
    const atClosure = caseTipContexts(s, "closure").filter((c) => c.lab === "access");
    expect(atClosure.some((c) => tipScore(TIP_BY_ID["access-radial-spasm-no-traction"], c) !== null)).toBe(true);
    // and the diagnostic context of the closure workspace carries the spasm: diag-radial-spasm-release
    const diagAtClosure = caseTipContexts(s, "closure").filter((c) => c.lab === "diagnostic");
    expect(diagAtClosure.some((c) => tipScore(TIP_BY_ID["diag-radial-spasm-release"], c) !== null)).toBe(true);
    // released and out over a band centred 8 mm below the hole: the hole bleeds, and the bleeding tip comes up
    expect(s.sideArmVasodilator("verapamil")).toBe(true);
    s.runPending();
    expect(s.setBandPosition(s.radialPunctureGeometry()!.holeX - 8)).toBe(true);
    s.setBandVolume(11);
    expect(s.pullRadialSheath()).toBe("out");
    s.tick(2);
    expect(s.activeEvents()).toContain("bleeding");
    const after = caseTipContexts(s, "closure").find((c) => c.lab === "access" && c.phase === "closure")!;
    expect(ids(after)).toContain("access-radial-band-bleeding");
  });

  it("the case declares what the radial closure raises, with the closure, sheath and complication phases and the radial route", () => {
    for (const e of ["radial-spasm", "bleeding", "haematoma"]) expect(CASE_SESSION_EVENTS as readonly string[], e).toContain(e);
    const access = caseRaises.find((r) => r.lab === "access")!;
    for (const p of ["closure", "sheath", "radial", "complication"]) expect(access.phases, p).toContain(p);
    expect(access.routes).toContain("radial");
    const diag = caseRaises.find((r) => r.lab === "diagnostic")!;
    expect(diag.events).toContain("radial-spasm");
  });

  it("every waiting.ts entry naming access-closure-radial becomes satisfiable (there are none), and the package's tips are satisfiable by the case's raises", () => {
    const waiting = WAITING_TIPS.filter((w) => w.raisedBy === PACKAGE);
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PACKAGE);
    // no entry waits on this package, so the access lab's waiting count falls by at least their number (zero)
    expect(waiting.length + deferred.length).toBe(0);
    const satisfiable = (r: LabRaises, id: string, phases?: readonly string[]) => {
      const w = TIP_BY_ID[id].when;
      const ph = phases ?? w.phase;
      if (ph?.length && !ph.some((p) => (r.phases as readonly string[]).includes(p))) return false;
      if (w.event?.length && !w.event.some((e) => r.events.includes(e))) return false;
      if (w.requires?.length && !w.requires.every((e) => r.events.includes(e))) return false;
      if (w.route?.length && !w.route.some((x) => (r.routes ?? []).includes(x))) return false;
      return true;
    };
    const access = caseRaises.find((r) => r.lab === "access")!;
    for (const id of [...CLOSURE_TIPS, ...EVENT_TIPS]) {
      expect(TIP_BY_ID[id], id).toBeDefined();
      expect(satisfiable(access, id), id).toBe(true);
    }
    // diag-radial-spasm-release (diagnostic context, any phase) with the case's radial spasm
    const diag = caseRaises.find((r) => r.lab === "diagnostic")!;
    expect(satisfiable(diag, "diag-radial-spasm-release")).toBe(true);
  });
});
