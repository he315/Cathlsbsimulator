// access-multi-site: several access sites in one case (caseSession.ts sites, addSite, setActiveSite),
// the left femoral route (access/route.ts), per-site closure and delayed events, the handover's list
// of sites, and the crossover scenario (scenarios/crossover.ts).
//   npx vitest run src/simulation/session/multiSite.test.ts
import { describe, expect, it } from "vitest";
import { newCaseSession, siteKey, type CaseSession } from "./caseSession";
import { crossover, fastForward, gainAccess, aimedPose, advanceToFlash } from "./autopilot";
import type { ProcedureScenario } from "./scenarios/index";
import { buildRoute3D } from "../access/route";
import { tubeAt } from "../access/site";
import { buildAnatomy } from "../anatomy";
import { generateCase } from "../caseGenerator";
import { FEMORAL } from "../access/closure";

/** The femoral sheath out once the ACT is under the strict threshold (as the autopilot waits), then manual compression over the arteriotomy. */
function closeFemoral(s: CaseSession): void {
  for (let k = 0; k < 24; k++) {
    const act = s.measureAct();
    s.runPending();
    if (act !== null && act < FEMORAL.actForSheathPullStrictS) break;
    s.wait(600);
    s.runPending();
  }
  s.femoralManual(FEMORAL.manualMinutes, 3);
  s.runPending();
}

/** Band on, sheath out, deflated until the pleth returns without bleeding, then haemostasis for the sourced band time. */
function closeRadial(s: CaseSession): void {
  s.applyBand(15);
  s.runPending();
  s.pullRadialSheath();
  for (let k = 0; k < 24; k++) {
    const r = s.plethCheck()!;
    s.runPending();
    if (r.bleeding) s.setBandVolume(s.radial!.volumeMl + 1);
    else if (r.cls === "D") s.setBandVolume(s.radial!.volumeMl - 1);
    else break;
  }
  s.finishRadialClosure(2);
  s.runPending();
}

describe("several access sites in one case", () => {
  it("after a radial sheath, addSite('femoral','right') allows a second puncture; finish() refuses until both sites are closed", () => {
    const { session: s } = newCaseSession({ seed: "ms-two", access: "radial-right", start: "sheath-in" });
    expect(s.sites).toHaveLength(1);
    const radialId = s.activeSiteId;
    expect(s.sheath).not.toBeNull();
    const fem = s.addSite("femoral", "right");
    expect(fem).not.toBeNull();
    expect(s.sites).toHaveLength(2);
    expect(s.activeSiteId).toBe(fem!.id);
    // the getters now read the new site: no sheath yet, a fresh puncture model at the groin
    expect(s.access).toBe("femoral");
    expect(s.site.kind).toBe("femoral");
    expect(s.sheath).toBeNull();
    expect(s.pm.st.passes).toBe(0);
    expect(s.siteById(radialId)!.sheath).not.toBeNull();
    // a second puncture at the groin
    s.order("local");
    s.runPending();
    s.wait(60);
    s.runPending();
    gainAccess(s);
    expect(s.sheath).not.toBeNull();
    expect(s.pm.st.arterialPunctures).toBeGreaterThanOrEqual(1);
    // the same site cannot be opened twice
    expect(s.addSite("femoral", "right")).toBeNull();

    expect(s.finish()).toBeNull();
    closeFemoral(s);
    expect(s.femoral!.minutes).toBeGreaterThan(0);
    // the radial sheath is still in: not finished
    expect(s.closureDone()).toBe(false);
    expect(s.finish()).toBeNull();
    expect(s.attending.some((a) => /every access site/.test(a.text))).toBe(true);
    expect(s.setActiveSite(radialId)).toBe(true);
    closeRadial(s);
    expect(s.closureDone()).toBe(true);
    const sum = s.finish();
    expect(sum).not.toBeNull();
    expect(sum!.devices.filter((d) => /sheath/.test(d))).toHaveLength(2);
  });

  it("addSite is refused before the planned site is punctured and while a catheter is in", () => {
    const { session: s } = newCaseSession({ seed: "ms-refuse", access: "radial-right", start: "access" });
    expect(s.addSite("femoral", "right")).toBeNull();
    gainAccess(s);
    s.prepCatheter("TIG");
    s.runPending();
    expect(s.loadCatheter("TIG")).toBe(true);
    expect(s.addSite("femoral", "right")).toBeNull();
    s.removeCatheter();
    s.runPending();
    const v = s.addSite("femoral-vein", "right")!;
    expect(v).not.toBeNull();
    // the work moves between sites only with the catheter out
    expect(s.setActiveSite(s.sites[0].id)).toBe(true);
    s.prepCatheter("TIG");
    s.runPending();
    s.loadCatheter("TIG");
    expect(s.setActiveSite(v.id)).toBe(false);
    expect(s.activeSiteId).toBe(s.sites[0].id);
  });

  it("a one-site case keeps its single site and the handover truth has no site list", () => {
    const { session: s } = newCaseSession({ seed: "ms-one", access: "femoral" });
    expect(s.sites).toHaveLength(1);
    expect(s.truth().sites).toBeUndefined();
    expect(s.setAccess("radial-left")).toBe(true);
    expect(s.sites).toHaveLength(1);
    expect(s.access).toBe("radial-left");
    expect(s.site.side).toBe("left");
  });
});

describe("the left groin", () => {
  it("a left femoral route has the same segment lengths as the right within 5%", () => {
    const caseData = generateCase("ms-route", { access: "femoral" }, "rand");
    const model = buildAnatomy(caseData);
    const right = buildRoute3D("femoral", caseData, model);
    const left = buildRoute3D("femoral", caseData, model, 0, "left");
    expect(right.side).toBe("right");
    expect(left.side).toBe("left");
    expect(left.segments.map((g) => g.id)).toEqual(right.segments.map((g) => g.id));
    for (let i = 0; i < right.segments.length; i++) {
      const a = right.segments[i].end - right.segments[i].start;
      const b = left.segments[i].end - left.segments[i].start;
      expect(Math.abs(a - b), right.segments[i].id).toBeLessThanOrEqual(0.05 * Math.max(a, 1));
    }
    const lr = right.path.cum[right.path.cum.length - 1];
    const ll = left.path.cum[left.path.cum.length - 1];
    expect(Math.abs(ll - lr) / lr).toBeLessThan(0.05);
    // the left groin is on the patient's left (+x in the aortic frame), the right on the right
    expect(right.path.pts[0].x).toBeLessThan(0);
    expect(left.path.pts[0].x).toBeGreaterThan(0);
    expect(left.lateral.x).toBe(1);
    expect(right.lateral.x).toBe(-1);
    // the aorta beyond the bifurcation is shared
    const ra = right.segments.find((g) => g.id === "asc")!;
    const la = left.segments.find((g) => g.id === "asc")!;
    expect(Math.abs(ra.start - la.start)).toBeLessThan(0.05 * ra.start);
  });

  it("a crossover to the left groin opens the left groin: its own anatomy, a left wire route, and the wire reaches the root", () => {
    const { session: s } = newCaseSession({ seed: "ms-left", access: "femoral", start: "sheath-in" });
    const right = s.activeSite;
    expect(s.addSite("femoral", "left")).not.toBeNull();
    expect(s.route.side).toBe("left");
    expect(s.route.label).toBe("Left femoral to aortic root");
    expect(s.site.side).toBe("left");
    // the left groin is drawn on its own seed: same structures, different draw
    expect(s.site.tubes.map((t) => t.id)).toEqual(right.site.tubes.map((t) => t.id));
    expect(s.site.landmarks).not.toEqual(right.site.landmarks);
    s.order("local");
    s.runPending();
    s.wait(60);
    s.runPending();
    gainAccess(s);
    expect(s.sheath).not.toBeNull();
    // the case goes on through the left groin to the root (the autopilot's run from here)
    expect(fastForward(s, "post-diagnostic")).toBe("post-diagnostic");
    expect(s.catheterInAorta).toBe(true);
    expect(s.workingSite().id).toBe(s.activeSiteId);
    const h = s.truth();
    expect(h.sites).toEqual(["femoral:right", "femoral:left"]);
  });
});

describe("crossover in an anticoagulated patient", () => {
  it("the crossover scenario opens with heparin given and the radial wire stopped in the arm", () => {
    const { session: s } = newCaseSession({ seed: "ms-xo-open", scenario: "crossover-heparinised" });
    expect(s.scenario.id).toBe("crossover-heparinised");
    expect(s.access).toBe("radial-right");
    expect(s.heparinU).toBeGreaterThan(0);
    expect(s.catheter?.inBody).toBe(true);
    expect(s.wireInBody).toBe(true);
    const brachial = s.route.segments.find((g) => g.id === "brachial")!;
    expect(s.wire.pos).toBeLessThan(brachial.start);
    // it does not pass whatever is done: pushing on, turning, a hydrophilic wire
    const before = s.wire.pos;
    s.beamOn = true;
    s.tipImaged = true;
    for (let i = 0; i < 40; i++) s.commandWire(0.5, i % 2 ? 0.2 : -0.2);
    expect(s.wire.pos).toBeLessThan(brachial.start);
    expect(s.wire.pos - before).toBeLessThan(3);
    // the autopilot's earlier steps are not the learner's
    expect(s.decisions()).toEqual([]);
  });

  it("a heparinised crossover puncture without an ultrasound image of the artery records a failed decision", () => {
    const { session: s } = newCaseSession({ seed: "ms-xo-blind", scenario: "crossover-heparinised" });
    crossover(s, "right", { ultrasound: false, fluoroscopy: false });
    const d = s.decisions().find((x) => x.id === "crossover-puncture-guided");
    expect(d).toBeDefined();
    expect(d!.correct).toBe(false);
    expect(d!.given).toMatch(/without ultrasound or fluoroscopy/);
    expect(d!.tipIds).toContain("access-crossover-anticoagulated-care");
    expect(d!.lessonId).toBe("pm-antithrombotics-oac");
  });

  it("the crossover is as expected only with the artery imaged on ultrasound and the groin screened on fluoroscopy", () => {
    const { session: s } = newCaseSession({ seed: "ms-xo-us", scenario: "crossover-heparinised" });
    crossover(s, "right");
    expect(s.activeSite.usImagedAt).not.toBeNull();
    expect(s.activeSite.fluoroAt).not.toBeNull();
    expect(s.decisions().find((x) => x.id === "crossover-puncture-guided")!.correct).toBe(true);

    // ultrasound alone: not as expected (the groin was not screened)
    const { session: u } = newCaseSession({ seed: "ms-xo-us-only", scenario: "crossover-heparinised" });
    crossover(u, "right", { fluoroscopy: false });
    const du = u.decisions().find((x) => x.id === "crossover-puncture-guided")!;
    expect(du.correct).toBe(false);
    expect(du.given).toMatch(/not screened on fluoroscopy/);

    // fluoroscopy alone, without an ultrasound image of the artery: not as expected
    const { session: f } = newCaseSession({ seed: "ms-xo-fl", scenario: "crossover-heparinised" });
    f.removeCatheter();
    f.runPending();
    f.addSite("femoral", "right");
    f.order("local");
    f.runPending();
    f.wait(60);
    f.runPending();
    // the groin screened at another station does not count; at the groin it does
    f.noteFluoroscopy("pelvis");
    expect(f.activeSite.fluoroAt).toBeNull();
    f.noteFluoroscopy("groin");
    expect(f.activeSite.fluoroAt).not.toBeNull();
    gainAccess(f);
    const df = f.decisions().find((x) => x.id === "crossover-puncture-guided")!;
    expect(df.correct).toBe(false);
    expect(df.given).toMatch(/no ultrasound image of the artery/);
  });

  it("the ultrasound image counts only with the probe on the skin and the target vessel in the image", () => {
    const { session: s } = newCaseSession({ seed: "ms-probe", access: "radial-right", start: "sheath-in" });
    // the planned site has the probe on from the start, as the lab always had it
    expect(s.activeSite.probeOn).toBe(true);
    s.addSite("femoral", "right");
    // an added site starts with the probe off the skin: nothing is imaged until it is placed
    expect(s.activeSite.probeOn).toBe(false);
    expect(s.noteProbeImage()).toBe(false);
    s.setProbeOn(true);
    s.pm.probe.y += 40;
    expect(s.noteProbeImage()).toBe(false);
    expect(s.activeSite.usImagedAt).toBeNull();
    s.pm.probe.y -= 40;
    expect(s.noteProbeImage()).toBe(true);
    expect(s.activeSite.usImagedAt).not.toBeNull();
  });

  it("no crossover decision is scored when the patient is not anticoagulated", () => {
    const { session: s } = newCaseSession({ seed: "ms-no-ac", access: "radial-right", start: "access" });
    gainAccess(s);
    expect(s.heparinU).toBe(0);
    // this seed's patient takes no anticoagulant (the test is about that case, so it is asserted)
    expect(s.profile.anticoagulation).toBe("none");
    s.addSite("femoral", "right");
    s.order("local");
    s.runPending();
    s.wait(60);
    s.runPending();
    gainAccess(s);
    expect(s.decisions().some((x) => x.id.startsWith("crossover-puncture-guided"))).toBe(false);
  });
});

describe("closure and delayed events at each site", () => {
  const scenario: ProcedureScenario = {
    id: "ms-test-delayed",
    title: "Test",
    lessonIds: [],
    access: "radial-right",
    delayed: [{ kind: "groin-haematoma", afterMin: 5, bleedMlMin: 2, totalMl: 20, report: "Test: groin swelling.", finding: "Test: a small groin haematoma.", severity: "minor" }],
  };

  it("each site schedules its own delayed events, a scenario's once, and each is presented once", () => {
    const { session: s } = newCaseSession({ seed: "ms-delayed", scenario, start: "sheath-in" });
    const radial = s.activeSite;
    crossover(s, "right");
    const fem = s.activeSite;
    expect(fem.id).not.toBe(radial.id);
    // the radial site closed first: the scenario's groin finding does not belong at the wrist
    expect(s.setActiveSite(radial.id)).toBe(true);
    closeRadial(s);
    expect(radial.delayed.some((d) => d.report === "Test: groin swelling.")).toBe(false);
    expect(s.closureDone()).toBe(false);
    // the femoral sheath pulled early on a short compression: a bleed drawn at the groin
    expect(s.setActiveSite(fem.id)).toBe(true);
    s.femoralManual(2, 30);
    s.runPending();
    expect(s.closureDone()).toBe(true);
    expect(fem.delayed.filter((d) => d.report === "Test: groin swelling.")).toHaveLength(1);
    // the two lists are separate, drawn on separate seeds
    for (const d of radial.delayed) expect(fem.delayed.includes(d)).toBe(false);
    // the recovery checks reach the band: the radial site with its band on is active again
    expect(s.activeSiteId).toBe(radial.id);
    for (let m = 0; m < 16; m++) {
      s.observe(15);
      s.runPending();
    }
    const all = [...radial.delayed, ...fem.delayed].filter((d) => d.atS <= s.tS);
    expect(s.presented).toHaveLength(all.length);
    expect(new Set(s.presented).size).toBe(s.presented.length);
    const ids = s.complications.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(s.complications.filter((c) => c.id === "groin-haematoma")).toHaveLength(1);
  });

  it("a femoral vein sheath is a site of its own: dark blood is expected, no catheter goes through it, and it closes by pressure", () => {
    const { session: s } = newCaseSession({ seed: "ms-vein", access: "radial-right", start: "sheath-in" });
    const v = s.addSite("femoral-vein", "right")!;
    expect(s.site.arteryId).toBe("cfv");
    s.order("local");
    s.runPending();
    s.wait(60);
    s.runPending();
    expect(s.placeNeedle(aimedPose(s))).toBe(true);
    // the vein gives no arterial flashback: advance until the hub shows venous blood
    let venous = false;
    for (let i = 0; i < 300 && !venous; i++) {
      s.advanceNeedle(0.2);
      venous = s.flashback().kind === "venous";
    }
    expect(venous).toBe(true);
    expect(s.activeEvents()).not.toContain("venous-flashback");
    s.advanceNeedle(0.6);
    s.advanceAccessWire(5);
    s.advanceAccessWire(30);
    expect(s.pm.st.wire?.state).toBe("intraluminal");
    expect(s.removeNeedle()).toBe(true);
    expect(s.insertSheath("6")).toBe(true);
    s.runPending();
    s.flushSheath();
    s.runPending();
    expect(s.sheath!.venous).toBe(true);
    expect(s.complications.some((c) => c.id === "venous-sheath")).toBe(false);
    expect(s.loadCatheter("JR4")).toBe(false);
    s.removeSheathAndCompress();
    s.runPending();
    expect(s.siteClosed(v)).toBe(true);
    expect(s.complications.some((c) => c.id === "venous-sheath")).toBe(false);
    // the radial sheath is still in
    expect(s.closureDone()).toBe(false);
    expect(s.truth().sites).toEqual(["radial:right", "femoral-vein:right"]);
    void advanceToFlash;
  });

  it("the handover note lists every site and line and is graded on them", () => {
    const { session: s } = newCaseSession({ seed: "ms-handover", scenario: "crossover-heparinised" });
    crossover(s, "right");
    fastForward(s, "recovery");
    expect(s.closureDone()).toBe(true);
    const t = s.truth();
    expect(t.sites).toEqual(["radial:right", "femoral:right"]);
    expect(t.site).toBe("femoral");
    expect(t.checks).toEqual(expect.arrayContaining(["radial-pulse", "hand-perfusion", "groin", "distal-pulses", "observations"]));
    const g = s.submitHandover(t);
    expect(g.items.some((i) => i.field === "Access sites and lines")).toBe(true);
    expect(g.correct).toBe(g.total);
    const bad = s.submitHandover({ ...t, sites: [siteKey(s.sites[1])] });
    expect(bad.items.find((i) => i.field === "Access sites and lines")!.correct).toBe(false);
    expect(bad.correct).toBe(bad.total - 1);
    expect(s.finish()).not.toBeNull();
  });
});

describe("site state after review (access-multi-site fixes)", () => {
  it("a femoral closure under way keeps its site: the switch is refused, and the closure lands on the site it started at", () => {
    const { session: s } = newCaseSession({ seed: "ms-busy-close", scenario: "crossover-heparinised" });
    const radialId = s.activeSiteId;
    crossover(s, "right");
    const fem = s.activeSite;
    expect(fem.route).toBe("femoral");
    s.femoralManual(FEMORAL.manualMinutes, 3);
    expect(s.busy).toBe(true);
    expect(s.setActiveSite(radialId)).toBe(false);
    expect(s.activeSiteId).toBe(fem.id);
    // even if the active site moves under it, the closure still acts on the femoral site
    (s as unknown as { activeIdx: number }).activeIdx = s.sites.findIndex((x) => x.id === radialId);
    s.runPending();
    expect(fem.sheath).toBeNull();
    expect(fem.sheathHistory).not.toBe("");
    expect(s.siteClosed(fem)).toBe(true);
    const radial = s.siteById(radialId)!;
    expect(radial.sheath).not.toBeNull();
    expect(radial.sheathHistory).toBe("");
    expect(s.activeSiteId).toBe(radialId);
    expect(s.closureDone()).toBe(false);
  });

  it("a site added after closure and never used leaves the handover truth on the site that had the sheath", () => {
    const { session: s } = newCaseSession({ seed: "ms-late-site", access: "radial-right", start: "sheath-in" });
    fastForward(s, "recovery");
    expect(s.closureDone()).toBe(true);
    const radial = s.sites[0];
    const before = s.truth();
    expect(s.addSite("femoral", "right")).not.toBeNull();
    const t = s.truth();
    expect(t.site).toBe("radial-right");
    expect(t.sheath).toBe(before.sheath);
    expect(t.sheath).not.toBe("");
    expect(t.closure).toBe("radial-band");
    expect(t.bandOffHours).toBe(radial.closure.bandHours);
    expect(t.checks).toEqual(["radial-pulse", "hand-perfusion", "observations"]);
    expect(t.sites).toBeUndefined();
  });

  it("the planned-site rule applies to the planned site only: a further site can be added before an added one is punctured", () => {
    const { session: s } = newCaseSession({ seed: "ms-add-twice", access: "radial-right", start: "sheath-in" });
    expect(s.addSite("femoral", "right")).not.toBeNull();
    const v = s.addSite("femoral-vein", "right");
    expect(v).not.toBeNull();
    expect(s.sites).toHaveLength(3);
    expect(s.attending.some((a) => /Puncture the planned site first/.test(a.text))).toBe(false);
  });

  it("an arterial sheath at a femoral vein site is a misplaced sheath, not the venous closure", () => {
    const { session: s } = newCaseSession({ seed: "ms-vein-artery", access: "radial-right", start: "sheath-in" });
    const v = s.addSite("femoral-vein", "right")!;
    s.order("local");
    s.runPending();
    s.wait(60);
    s.runPending();
    // aim at the common femoral artery beside the vein
    const art = s.site.tubes.find((t) => t.id === "cfa")!;
    const x = (s.site.landmarks.targetFrom + s.site.landmarks.targetTo) / 2;
    const c = tubeAt(art, x);
    const th = (s.site.typicalAngleDeg * Math.PI) / 180;
    expect(s.placeNeedle({ entryX: x - (c.z / Math.sin(th)) * Math.cos(th), entryY: c.y, angleDeg: s.site.typicalAngleDeg, yawDeg: 0 })).toBe(true);
    expect(advanceToFlash(s)).toBe(true);
    s.advanceNeedle(0.6);
    s.advanceAccessWire(5);
    s.advanceAccessWire(30);
    expect(s.pm.st.wire?.state).toBe("intraluminal");
    expect(s.removeNeedle()).toBe(true);
    expect(s.insertSheath("6")).toBe(true);
    s.runPending();
    expect(s.sheath!.venous).toBe(false);
    s.removeSheathAndCompress();
    s.runPending();
    expect(s.siteClosed(v)).toBe(false);
    expect(v.sheathHistory).toBe("");
    expect(s.complications.some((k) => k.id === "arterial-sheath-at-vein")).toBe(true);
    expect(s.telemetry.some((e) => e.kind === "session.closure")).toBe(false);
  });

  it("a venous site's closure is recorded as a closure event for that site", () => {
    const { session: s } = newCaseSession({ seed: "ms-vein", access: "radial-right", start: "sheath-in" });
    const v = s.addSite("femoral-vein", "right")!;
    s.order("local");
    s.runPending();
    s.wait(60);
    s.runPending();
    expect(s.placeNeedle(aimedPose(s))).toBe(true);
    let venous = false;
    for (let i = 0; i < 300 && !venous; i++) {
      s.advanceNeedle(0.2);
      venous = s.flashback().kind === "venous";
    }
    expect(venous).toBe(true);
    s.advanceNeedle(0.6);
    s.advanceAccessWire(5);
    s.advanceAccessWire(30);
    expect(s.removeNeedle()).toBe(true);
    expect(s.insertSheath("6")).toBe(true);
    s.runPending();
    s.removeSheathAndCompress();
    s.runPending();
    expect(s.siteClosed(v)).toBe(true);
    const ev = s.telemetry.filter((e) => e.kind === "session.closure");
    expect(ev).toHaveLength(1);
    expect(ev[0].data).toEqual({ delayed: [], site: v.id });
  });

  it("once the target vessel has been imaged, the per-frame report returns without redoing the geometry", () => {
    const { session: s } = newCaseSession({ seed: "ms-probe-cache", access: "radial-right", start: "sheath-in" });
    s.addSite("femoral", "right");
    expect(s.activeSite.target?.id).toBe("cfa");
    s.setProbeOn(true);
    expect(s.noteProbeImage()).toBe(true);
    const at = s.activeSite.usImagedAt;
    s.pm.probe.y += 40;
    // the time first imaged is kept; the probe moving away does not undo the guidance already given
    expect(s.noteProbeImage()).toBe(true);
    expect(s.activeSite.usImagedAt).toBe(at);
    s.setProbeOn(false);
    expect(s.noteProbeImage()).toBe(false);
  });
});
