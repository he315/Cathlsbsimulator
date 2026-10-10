// The pericardiocentesis tab's launch handling and a server-side render of every scenario
// (pericardiocentesis-tips-and-pci-handover).
//   npx vitest run src/ui/bedside/PericardioLab.test.ts
import { describe, expect, it } from "vitest";
import { PERIC_SCENARIOS } from "../../simulation/pericardiocentesis";

describe("pericardiocentesis launches", () => {
  it("a link names a scenario, a mode and events; unknown names are dropped", async () => {
    const { resolvePericLaunch } = await import("../sections/BedsideLab");
    expect(resolvePericLaunch({ scenario: "post-cabg-loculated", mode: "exam", events: "prior-cabg,vf" }, 3)).toEqual({ scenario: "post-cabg-loculated", mode: "exam", events: ["prior-cabg"], seq: 3 });
    expect(resolvePericLaunch({ scenario: "nope", mode: "loud" }, 4)).toEqual({ scenario: null, mode: null, events: [], seq: 4 });
    expect(resolvePericLaunch({ preset: "from-pci-perforation" }, 5).scenario).toBe("from-pci-perforation");
  });

  it("every scenario renders, and the hand-over scenario opens on the PCI patient or its stand-in", async () => {
    const { createElement } = await import("react");
    const { renderToString } = await import("react-dom/server");
    const { default: PericardioLab } = await import("./PericardioLab");
    for (const s of PERIC_SCENARIOS) {
      const html = renderToString(createElement(PericardioLab, { launch: { scenario: s.id, mode: "guided", events: [], seq: 1 } }));
      expect(html, s.id).toContain(s.title.replace(/'/g, "&#x27;"));
    }
    const fromPci = renderToString(createElement(PericardioLab, { launch: { scenario: "from-pci-perforation", mode: "guided", events: [], seq: 1 } }));
    expect(fromPci).toContain("Perforated patient (stand-in)");
    // echo is not in the room at the start of the unstable perforation; fluoroscopy shows the sac
    const unstable = renderToString(createElement(PericardioLab, { launch: { scenario: "perforation-unstable", mode: "guided", events: [], seq: 1 } }));
    expect(unstable).toContain("not in the room");
    expect(unstable).toContain("contrast outlines the pericardial sac");
  });

  it("a hand-over that cannot be read falls back to the stand-in patient instead of crashing the lab", async () => {
    const { createElement } = await import("react");
    const { renderToString } = await import("react-dom/server");
    const { default: PericardioLab } = await import("./PericardioLab");
    const { standInPerforatedEngine } = await import("../../simulation/pericardiocentesis");
    const { patientHandoverFrom } = await import("../../simulation/session/handover");
    const good = patientHandoverFrom(standInPerforatedEngine());
    // the profile is not the snapshot's patient: patientHandoverProblem rejects it
    const bad = { ...good, profile: { ...good.profile, seed: `${good.profile.seed}-other` } };
    const transfer = { to: "pericardiocentesis", from: "pci", params: {}, events: ["perforation"], patient: bad, report: null, context: null, payload: null, seq: 9 } as unknown as import("../../state/useLabHandoverStore").LabTransfer;
    const html = renderToString(createElement(PericardioLab, { transfer }));
    expect(html).toContain("Perforated patient (stand-in)");
    expect(html).toContain("The hand-over could not be read; continuing on a stand-in patient.");
  });
});

describe("the syringe log outside guided practice", () => {
  it("blood from the sac and from the RV after a perforation give the same neutral line; guided practice still says where the tip is", async () => {
    const { aspirateLogLine } = await import("./PericardioLab");
    const { aspirate, getPericScenario } = await import("../../simulation/pericardiocentesis");
    for (const id of ["perforation-unstable", "from-pci-perforation"] as const) {
      const sc = getPericScenario(id);
      const sac = aspirateLogLine("effusion", aspirate("effusion", sc), 20, false);
      const rv = aspirateLogLine("rv", aspirate("rv", sc), 0, false);
      const ra = aspirateLogLine("ra", aspirate("ra", sc), 0, false);
      expect(rv, id).toEqual(sac);
      expect(ra, id).toEqual(sac);
      expect(sac.tone).toBe("plain");
      expect(sac.text).not.toContain("through the needle");
      if (sc.heparinised) expect(sac.text).toContain("Clotting test unreliable (heparin).");
      expect(aspirateLogLine("effusion", aspirate("effusion", sc), 20, true).tone).toBe("good");
      expect(aspirateLogLine("rv", aspirate("rv", sc), 0, true).tone).toBe("danger");
    }
    // nothing in the syringe stays a plain observation
    const sc = getPericScenario("post-cabg-loculated");
    expect(aspirateLogLine("epicardium", aspirate("epicardium", sc), 0, false)).toEqual({ text: "Aspirate: nothing.", tone: "plain" });
  });
});
