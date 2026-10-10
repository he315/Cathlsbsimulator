// access-multi-site: the site selector on the ultrasound, fluoroscopy and closure views, the add-site
// control, and the handover's list of sites, rendered to static markup in Node (no DOM; the views'
// effects, the B-mode loop and WebGL do not run). The procedure store is replaced by a plain selector
// hook over a test state holding the session under test (a server render reads a zustand store's
// initial state, which has no session).
//   npx vitest run src/ui/access/siteSelector.test.ts
import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { newCaseSession, type CaseSession } from "../../simulation/session/caseSession";
import UltrasoundView from "./UltrasoundView";
import AccessFluoroView from "./AccessFluoroView";
import { ClosurePanel } from "./panels/ClosurePanel";
import { HandoverPanel } from "./panels/HandoverPanel";
import { AccessPicker } from "./panels/AccessPicker";

const store = vi.hoisted(() => {
  const state: { session: unknown; version: number; summary: null; [k: string]: unknown } = { session: null, version: 0, summary: null };
  state.act = (fn: (s: unknown) => unknown) => fn(state.session);
  for (const k of ["setWorkspace", "setAccess", "finish"]) state[k] = () => undefined;
  const hook = Object.assign((sel: (s: typeof state) => unknown) => sel(state), { getState: () => state });
  return { state, hook };
});
vi.mock("../../state/useProcedureStore", () => ({ useProcedureStore: store.hook }));

function use(session: CaseSession): CaseSession {
  store.state.session = session;
  store.state.version++;
  return session;
}
function open(seed: string): CaseSession {
  return use(newCaseSession({ seed, access: "radial-right", start: "sheath-in" }).session);
}
const us = (s: CaseSession) => renderToStaticMarkup(createElement(UltrasoundView, { session: s, guided: false }));
const selector = (html: string) => html.match(/<div class="seg [^"]*" role="group" aria-label="Access site">(.*?)<\/div>/)?.[1] ?? null;
const buttons = (html: string | null) => [...(html ?? "").matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((m) => m[1].replace(/<!-- -->/g, ""));

describe("the site selector", () => {
  it("is absent in a one-site case, and switches the ultrasound view between wrist and groin", () => {
    const s = open("ss-us");
    const radial = s.activeSiteId;
    let html = us(s);
    expect(html).toContain("Ultrasound, right wrist");
    expect(selector(html)).toBeNull();

    expect(s.addSite("femoral", "right")).not.toBeNull();
    html = us(s);
    expect(html).toContain("Ultrasound, right groin");
    expect(buttons(selector(html))).toEqual(["Right radial", "Right femoral"]);
    // the active site is the one pressed
    expect(html).toMatch(/aria-pressed="true" data-site="site-2"/);
    // an added site starts with the probe off the skin, and the view offers to place it
    expect(html).toContain("probe off the skin");
    expect(html).toContain("Probe on the skin");

    expect(s.setActiveSite(radial)).toBe(true);
    html = us(s);
    expect(html).toContain("Ultrasound, right wrist");
    expect(html).toMatch(/aria-pressed="true" data-site="site-1"/);
    expect(html).toContain("Lift the probe");
  });

  it("appears on the fluoroscopy and closure views once there are two sites, and the closure view names the site still to close", () => {
    const s = open("ss-fl");
    expect(selector(renderToStaticMarkup(createElement(AccessFluoroView, { session: s, readouts: false })))).toBeNull();
    s.addSite("femoral", "left");
    const fl = renderToStaticMarkup(createElement(AccessFluoroView, { session: s, readouts: false }));
    expect(buttons(selector(fl))).toEqual(["Right radial", "Left femoral"]);
    // the table shows the active site's route: the groin stations
    expect(fl).toContain("Groin");
    const cl = renderToStaticMarkup(createElement(ClosurePanel));
    expect(buttons(selector(cl))).toEqual(["Right radial", "Left femoral"]);
    expect(cl).toContain("There is no sheath in.");
    expect(cl).toContain("Still to close: right radial.");
  });

  it("the access picker offers every site not yet in use once the planned site is punctured", () => {
    use(newCaseSession({ seed: "ss-pick0", access: "radial-right" }).session);
    // before any puncture: the planned route can still change
    expect(renderToStaticMarkup(createElement(AccessPicker))).not.toContain("Another site");
    const s = open("ss-pick");
    let html = renderToStaticMarkup(createElement(AccessPicker));
    const options = () => [...html.matchAll(/<option value="([^"]+)">/g)].map((m) => m[1]);
    expect(options()).toEqual(["radial:left", "femoral:right", "femoral:left", "femoral-vein:right", "femoral-vein:left"]);
    s.addSite("femoral-vein", "right");
    html = renderToStaticMarkup(createElement(AccessPicker));
    expect(options()).not.toContain("femoral-vein:right");
    expect(buttons(selector(html))).toEqual(["Right radial", "Right femoral vein"]);
  });

  it("the guided fluoroscopy readout shows the wire only while it is in: not the last radial depth at a new groin", () => {
    const { session: s } = newCaseSession({ seed: "ss-readout", scenario: "crossover-heparinised" });
    use(s);
    const fl = () => renderToStaticMarkup(createElement(AccessFluoroView, { session: s, readouts: true }));
    // the crossover scenario opens with the wire stopped in the arm: the readout names its segment and depth
    expect(s.wireInBody).toBe(true);
    expect(fl()).toMatch(/ · wire \d+ mm/);
    s.removeCatheter();
    s.runPending();
    expect(s.addSite("femoral", "left")).not.toBeNull();
    const html = fl();
    expect(html).toContain("Groin");
    expect(html).not.toMatch(/ · wire \d+ mm/);
    expect(html).not.toContain("catheter");
  });

  it("the handover asks for every site and line only when the case used more than one site", () => {
    const s = open("ss-ho");
    expect(renderToStaticMarkup(createElement(HandoverPanel))).not.toContain("Access sites and lines");
    s.addSite("femoral", "right");
    const html = renderToStaticMarkup(createElement(HandoverPanel));
    expect(html).toContain("Access sites and lines");
    // all six sites the case can hold are offered, not only those used
    for (const label of ["Right radial artery", "Left radial artery", "Right femoral artery", "Left femoral artery", "Right femoral vein", "Left femoral vein"]) expect(html).toContain(label);
  });
});
