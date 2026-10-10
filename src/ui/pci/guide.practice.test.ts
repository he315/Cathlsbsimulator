// pci-guide-engagement practice links: the practice index lists lad-focal and rca-calcified under the guide
// lessons (pm-wiring-guide-choice, pm-wiring-guide-seat, pm-wiring-tortuosity) from this package's
// .launch.ts, the exchange link also under pm-engaging-exchange and pm-engaging-fail, every link resolves to
// a PCI launch that opens with the guide in the aortic root, and the merge reports no problem for the file.
//   npx vitest run src/ui/pci/guide.practice.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { PRACTICE_INDEX, practiceForLesson } from "../content/practiceIndex";
import { launch as GUIDE_LAUNCH } from "../../content/practice/pci-guide-engagement.launch";
import { resolvePciLaunch } from "./launch";
import { PciLabSession } from "./PciLabSession";
import { useSeriesStore } from "../../state/useSeriesStore";

const FILE = /pci-guide-engagement\.launch\.ts$/;
const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

describe("practice links (pci-guide-engagement)", () => {
  it("practiceIndex lists lad-focal and rca-calcified under pm-wiring-guide-choice, pm-wiring-guide-seat and pm-wiring-tortuosity", () => {
    expect(GUIDE_LAUNCH.sim).toBe("angio-pci");
    for (const lesson of ["pm-wiring-guide-choice", "pm-wiring-guide-seat", "pm-wiring-tortuosity"]) {
      const mine = practiceForLesson(lesson, PRACTICE_INDEX).filter((e) => e.sim === "angio-pci" && FILE.test(e.source));
      expect(mine.map((e) => e.scenario).sort(), lesson).toEqual(["lad-focal", "rca-calcified"]);
      for (const e of mine) {
        expect(e.start).toBe("guide-in-root");
        expect(e.params).toMatchObject({ scenario: e.scenario, start: "guide-in-root", mode: "guided" });
      }
    }
    for (const lesson of ["pm-engaging-exchange", "pm-engaging-fail"]) {
      const mine = practiceForLesson(lesson, PRACTICE_INDEX).filter((e) => FILE.test(e.source));
      expect(mine.map((e) => e.scenario), lesson).toEqual(["rca-calcified"]);
    }
    expect(PRACTICE_INDEX.known.problems.filter((p) => p.includes("pci-guide-engagement"))).toEqual([]);
  });

  it("each link opens the PCI lab with the guide in the aortic root", () => {
    for (const l of GUIDE_LAUNCH.links ?? []) {
      const r = resolvePciLaunch({ scenario: l.scenario!, start: l.start!, mode: "guided" });
      expect(r.problems).toEqual([]);
      const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
      sessions.push(x);
      expect(x.startDef.id).toBe("guide-in-root");
      expect(x.st.guide.engaged).toBe(false);
    }
  });
});
