// The decision drills as the Real angiograms section renders them (angio-decision-drills): a lesson link to
// drill 'plan' with part=missing-facts opens the missing-facts step on an AngioCAD study, showing the dataset's
// fields and the vessel count, and no grade, Gensini score or invented clinical value before the answer; the
// SYNTAX drill is registered and opens on dominance, segments and thresholds without the grades.
//   npx vitest run src/ui/angio/revascDrills.render.test.ts
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Drills } from "../sections/RealAngiograms";
import { registeredAngioDrills, type ExtraDrillProps, type LibDataset, type LibPatient } from "./library";
import { ANGIOCAD_SEGMENTS } from "./syntax";

const segs = (g: Record<string, string>) => Object.fromEntries(ANGIOCAD_SEGMENTS.map((s) => [s, g[s] ?? "NL"]));
const run = (id: string, artery: "LCA" | "RCA") => ({ id, dataset: "AngioCAD" as const, patientId: "ac-901", base: "/angio-library/angiocad/x/", frames: ["0001.jpg"], fps: 15, artery });
const p: LibPatient = {
  id: "ac-901",
  dataset: "AngioCAD",
  age: "66",
  sex: "F",
  indication: "SA",
  lvef: null,
  diabetes: false,
  smoker: true,
  hypertension: true,
  dyslipidaemia: true,
  dominance: "left",
  gensini: 57.5,
  segments: segs({ "Prox LAD": "91-99", "Mid RCA": "76-90", PLB: "51-75" }),
  runs: [run("ac-901-1", "LCA"), run("ac-901-2", "RCA")],
};
const data: LibDataset[] = [{ dataset: "AngioCAD", citation: "c", doi: "d", licence: "CC BY 4.0", licenceUrl: "u", changes: "", system: "", patients: [p] }];
const strip = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

describe("the missing-facts step", () => {
  it("opens from the lesson link and shows only the dataset's fields and the vessel count", () => {
    const html = strip(renderToString(createElement(Drills, { runs: p.runs, patients: [p], data, initial: "plan", initialParams: { part: "missing-facts" } })));
    expect(html).toContain("What the dataset records");
    expect(html).toContain("stable angina");
    expect(html).toContain("LVEF not recorded");
    expect(html).toContain("How many major epicardial arteries have a stenosis over 50%?");
    expect(html).toContain("Before the decision: what is missing");
    // nothing that answers the count, and no generated clinical value
    expect(html).not.toMatch(/91-99|76-90|Gensini|57\.5/);
    expect(html).not.toMatch(/ischaemi[a-z]* in about|surgical review|Previous CABG (Yes|No)/);
  });
});

describe("the SYNTAX drill", () => {
  it("is registered as 'syntax' and opens on dominance, the AngioCAD segments and the threshold question, without the grades", () => {
    const d = registeredAngioDrills().find((x) => x.id === "syntax");
    expect(d).toBeDefined();
    expect(d!.gate?.(p.runs)).toEqual({ open: true, note: "AngioCAD studies" });
    const props: ExtraDrillProps = { runs: p.runs, patients: [p], data };
    const html = strip(renderToString(createElement(d!.component as (x: ExtraDrillProps) => JSX.Element, props)));
    expect(html).toContain("Dominance (SYNTAX has no co-dominant option)");
    for (const s of ANGIOCAD_SEGMENTS) expect(html).toContain(s);
    expect(html).toContain("Three-vessel disease: PCI or CABG at 0–22, CABG above 22");
    expect(html).toContain("not totalled");
    expect(html).not.toMatch(/91-99|76-90|51-75|Gensini/);
    // the dominance-dependent branches do not name their artery before dominance is chosen
    expect(html).toContain("dominant artery");
  });
});
