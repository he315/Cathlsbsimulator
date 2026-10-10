import { useEffect, useMemo } from "react";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { CASE_LIBRARY } from "../../simulation/caseGenerator";
import { VIEW_PRESETS } from "../../data/viewPresets";
import { TEACHING } from "../../data/teachingText";
import { toWorld } from "../../simulation/anatomy";
import { cameraBasis, elongation } from "../../simulation/projection";
import { smoothPolyline } from "../../utils/math";
import type { VesselId } from "../../types";
import FluoroView from "../sim/FluoroView";
import SectionShell from "../SectionShell";

const NORMAL_CASE =
  CASE_LIBRARY.find((c) => c.id.startsWith("complete-normal")) ?? CASE_LIBRARY[0];

const TRACKED: { id: VesselId; label: string }[] = [
  { id: "LAD", label: "LAD" },
  { id: "LCx", label: "LCx" },
  { id: "RCA", label: "RCA" },
];

const TOPICS: { title: string; body: string }[] = [
  { title: "The spider view", body: TEACHING["spider-view"] },
  { title: "LAD views", body: TEACHING["lad-views"] },
  { title: "RCA views", body: TEACHING["rca-views"] },
];

export default function ViewTrainer() {
  const model = useSimulatorStore((s) => s.model);
  const cArm = useSimulatorStore((s) => s.cArm);
  const applyViewPreset = useSimulatorStore((s) => s.applyViewPreset);
  const nudgeCArm = useSimulatorStore((s) => s.nudgeCArm);
  const setCArm = useSimulatorStore((s) => s.setCArm);
  const loadCase = useSimulatorStore((s) => s.loadCase);

  useEffect(() => {
    loadCase(NORMAL_CASE, "root-drill");
    setCArm({ laoRao: 0, cranialCaudal: 0 });
  }, [loadCase, setCArm]);

  // Foreshortening for the tracked vessels at the current C-arm angle.
  const elong = useMemo(() => {
    const basis = cameraBasis(cArm);
    const worldFor = (id: VesselId) => {
      const v = model.vessels.find((vv) => vv.id === id);
      return v ? smoothPolyline(v.points, 6).map((p) => toWorld(model, p)) : [];
    };
    return TRACKED.map((t) => ({ ...t, e: elongation(worldFor(t.id), basis) }));
  }, [model, cArm]);

  const activeId = VIEW_PRESETS.find(
    (v) =>
      Math.hypot(v.cArm.laoRao - cArm.laoRao, v.cArm.cranialCaudal - cArm.cranialCaudal) < 4
  )?.id;
  const activePreset = VIEW_PRESETS.find((v) => v.id === activeId);

  return (
    <SectionShell
      title="Fluoroscopy view trainer"
      subtitle="How 3D coronary anatomy becomes a 2D angiogram. Pick a projection and watch which vessels elongate and which foreshorten."
    >
      <div className="grid lg:grid-cols-[1fr_22rem] gap-4">
        <div className="panel p-2">
          <FluoroView />
        </div>

        <div className="space-y-3">
          <div className="panel p-4">
            <div className="stat-label mb-2">Standard projections</div>
            <div className="flex flex-wrap gap-1.5">
              {VIEW_PRESETS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => applyViewPreset(v.id)}
                  className={`chip ${activeId === v.id ? "border-accent/50 text-accent" : ""}`}
                >
                  {v.short}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5 mt-3">
              <button className="btn btn-ghost" onClick={() => nudgeCArm(-1, 0)}>◄ RAO</button>
              <button className="btn btn-ghost" onClick={() => nudgeCArm(1, 0)}>LAO ►</button>
              <button className="btn btn-ghost" onClick={() => nudgeCArm(0, 1)}>▲ Cranial</button>
              <button className="btn btn-ghost" onClick={() => nudgeCArm(0, -1)}>▼ Caudal</button>
            </div>
          </div>

          <div className="panel p-4">
            <div className="stat-label mb-2">Elongation (1.0 = no foreshortening)</div>
            {elong.map((t) => {
              const pct = Math.round(t.e * 100);
              const tone = t.e > 0.8 ? "#4CC38A" : t.e > 0.55 ? "#E9B95A" : "#E5534B";
              return (
                <div key={t.id} className="mb-2">
                  <div className="flex justify-between text-[12px] text-ink-faint">
                    <span>{t.label}</span>
                    <span className="font-mono" style={{ color: tone }}>{(t.e).toFixed(2)}</span>
                  </div>
                  <div className="h-1.5 rounded bg-base-800 overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${pct}%`, background: tone }} />
                  </div>
                </div>
              );
            })}
            <div className="text-[12px] text-ink-faint mt-2">
              A well-elongated vessel is laid out for measurement; a foreshortened one hides
              lesion length. Choose the view that opens your target.
            </div>
          </div>

          {activePreset && (
            <div className="panel p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="stat-label">{activePreset.name}</div>
                <span className="chip">{activePreset.short}</span>
              </div>
              <p className="text-sm text-ink-soft">{activePreset.teach}</p>
              <div className="text-[12px] text-ink-faint mt-2">
                Best for: {activePreset.bestFor.join(", ")}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mt-4">
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
