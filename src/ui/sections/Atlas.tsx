import { useState } from "react";
import {
  VESSEL_NAMES,
  LEFT_VESSELS,
  RIGHT_VESSELS,
} from "../../simulation/anatomy";
import { VIEW_PRESETS } from "../../data/viewPresets";
import { TEACHING } from "../../data/teachingText";
import type { VesselId } from "../../types";
import SectionShell from "../SectionShell";

const viewsFor = (id: VesselId): string[] =>
  VIEW_PRESETS.filter((v) => v.bestFor.includes(id)).map((v) => v.short);

function VesselTable({ ids, side }: { ids: VesselId[]; side: "left" | "right" }) {
  const dot = side === "left" ? "#8ab4ff" : "#e5a06b";
  return (
    <div className="space-y-1.5">
      {ids.map((id) => {
        const views = viewsFor(id);
        return (
          <div key={id} className="rounded-md border border-line p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: dot }}
                />
                <span className="font-mono text-xs text-ink">{id}</span>
                <span className="text-sm text-ink-soft truncate">{VESSEL_NAMES[id]}</span>
              </div>
            </div>
            {views.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5 pl-4">
                {views.map((v) => (
                  <span key={v} className="chip text-[12px]">{v}</span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const TOPICS: { title: string; body: string }[] = [
  { title: "Dominance", body: TEACHING.dominance },
  { title: "Catheter–root matching", body: TEACHING["catheter-root-match"] },
  { title: "LAD views", body: TEACHING["lad-views"] },
  { title: "RCA views", body: TEACHING["rca-views"] },
];

export default function Atlas() {
  const [q, setQ] = useState("");
  const match = (ids: VesselId[]) =>
    ids.filter(
      (id) =>
        q === "" ||
        id.toLowerCase().includes(q.toLowerCase()) ||
        VESSEL_NAMES[id].toLowerCase().includes(q.toLowerCase())
    );

  return (
    <SectionShell
      title="Coronary anatomy atlas"
      subtitle="Every named segment, which system it belongs to, and the projections that lay it out."
      actions={
        <input
          placeholder="Search vessels…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="bg-base-800 border border-line rounded-md px-3 py-1.5 text-sm w-52"
        />
      }
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div className="panel p-4">
          <div className="stat-label mb-2" style={{ color: "#8ab4ff" }}>
            Left coronary system
          </div>
          <VesselTable ids={match(LEFT_VESSELS)} side="left" />
        </div>
        <div className="panel p-4">
          <div className="stat-label mb-2" style={{ color: "#e5a06b" }}>
            Right coronary system
          </div>
          <VesselTable ids={match(RIGHT_VESSELS)} side="right" />
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
