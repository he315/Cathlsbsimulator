import { lazy, Suspense, useEffect } from "react";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import type { Overlays } from "../../state/useSimulatorStore";
import { CASE_LIBRARY, generateRandomCase } from "../../simulation/caseGenerator";
import { TEACHING } from "../../data/teachingText";
import { uid } from "../../utils/random";
// Code-split three.js / R3F into its own chunk (kept out of the initial bundle).
const AnatomyScene = lazy(() => import("../sim/AnatomyScene"));
import SectionShell from "../SectionShell";

const NORMAL_CASE =
  CASE_LIBRARY.find((c) => c.id.startsWith("complete-normal")) ?? CASE_LIBRARY[0];

const OVERLAY_KEYS: { key: keyof Overlays; label: string }[] = [
  { key: "ostia", label: "Ostia" },
  { key: "labels", label: "Labels" },
  { key: "valvePlane", label: "Valve plane" },
  { key: "cusps", label: "Cusps" },
  { key: "transparent", label: "Vessel ghosts" },
];

const ZONES = [
  {
    name: "Ascending aorta",
    tone: "text-ink-soft",
    text: "Above the sinotubular junction. Too high to engage — the tip finds no ostium here.",
  },
  {
    name: "Aortic root / sinuses",
    tone: "text-safe",
    text: "The short segment holding the coronary ostia. This is where engagement happens.",
  },
  {
    name: "Valve plane (y = 0)",
    tone: "text-warn",
    text: "The boundary. Cross it and you are heading into the ventricle.",
  },
  {
    name: "Left ventricle",
    tone: "text-danger",
    text: "The danger zone. A tip or wire here gives an LV pressure and, if injected, an LV-gram — never a coronary picture. Withdraw, do not push.",
  },
];

const TOPICS: { title: string; body: string }[] = [
  { title: "Root level", body: TEACHING["root-level"] },
  { title: "Coaxiality", body: TEACHING.coaxiality },
  { title: "The LV danger zone", body: TEACHING["lv-danger"] },
  { title: "Dominance", body: TEACHING.dominance },
];

export default function AnatomyLab() {
  const overlays = useSimulatorStore((s) => s.overlays);
  const toggleOverlay = useSimulatorStore((s) => s.toggleOverlay);
  const loadCase = useSimulatorStore((s) => s.loadCase);
  const caseData = useSimulatorStore((s) => s.caseData);

  // Load a clean normal anatomy once for the teaching view.
  useEffect(() => {
    loadCase(NORMAL_CASE, "root-drill");
  }, [loadCase]);

  return (
    <SectionShell
      title="Anatomy lab"
      subtitle="Orbit the aortic root. Learn the three zones your catheter tip can be in — and why only one of them engages."
      actions={
        <button
          className="btn"
          onClick={() => loadCase(generateRandomCase(uid()), "root-drill")}
        >
          Randomise anatomy
        </button>
      }
    >
      <div className="grid lg:grid-cols-[1fr_20rem] gap-4">
        <div className="panel overflow-hidden">
          <div className="panel-head">
            <span>3D aortic root — {caseData.rootSize} root, {caseData.dominance} dominant</span>
            <span className="normal-case font-normal text-ink-faint">drag to orbit</span>
          </div>
          <div className="h-[26rem] cl-grid">
            <Suspense
              fallback={
                <div className="h-full grid place-items-center text-sm text-ink-faint">
                  loading 3D…
                </div>
              }
            >
              <AnatomyScene />
            </Suspense>
          </div>
          <div className="flex flex-wrap gap-1.5 p-3 border-t border-line">
            {OVERLAY_KEYS.map((o) => (
              <button
                key={o.key}
                onClick={() => toggleOverlay(o.key)}
                className={`chip ${overlays[o.key] ? "border-accent/50 text-accent" : ""}`}
              >
                {overlays[o.key] ? "● " : "○ "}
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="panel p-4">
          <div className="stat-label mb-2">Where is the tip?</div>
          <div className="space-y-2">
            {ZONES.map((z) => (
              <div key={z.name} className="rounded-md border border-line p-2">
                <div className={`text-sm font-medium ${z.tone}`}>{z.name}</div>
                <div className="text-[12px] text-ink-faint mt-0.5">{z.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3 mt-4">
        {TOPICS.map((t) => (
          <div key={t.title} className="panel p-4">
            <div className="stat-label mb-1">{t.title}</div>
            <p className="text-sm text-ink-soft leading-relaxed">{t.body}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
