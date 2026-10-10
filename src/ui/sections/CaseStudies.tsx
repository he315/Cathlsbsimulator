import { useMemo, useState } from "react";
import type { CaseStudy, TrackId } from "../../content/schema";
import { useProgressStore } from "../../state/useProgressStore";
import { useUiStore } from "../../state/useUiStore";
import { useContent } from "../content/useContent";
import CasePlayer, { ProvenanceBadge } from "../content/CasePlayer";
import { PracticeList } from "../content/BlockRenderer";
import { casePractice, practiceAfterCase } from "../content/practiceIndex";
import SectionShell from "../SectionShell";

type Filter = "all" | "published" | "synthetic";

export default function CaseStudies() {
  const content = useContent();
  const caseId = useUiStore((s) => s.caseId);
  const openCase = useUiStore((s) => s.openCase);
  const setSection = useUiStore((s) => s.setSection);
  const profile = useProgressStore((s) => s.profile);
  const [filter, setFilter] = useState<Filter>("all");
  const [track, setTrack] = useState<TrackId | "all">("all");
  const [q, setQ] = useState("");

  const cases = useMemo(() => {
    if (!content) return [] as CaseStudy[];
    const s = q.trim().toLowerCase();
    return content.ALL_CASES.filter(
      (c) =>
        (filter === "all" || c.provenance.kind === filter) &&
        (track === "all" || c.trackId === track) &&
        (!s || c.title.toLowerCase().includes(s) || c.summary.toLowerCase().includes(s))
    ).sort((a, b) => a.stage - b.stage);
  }, [content, filter, track, q]);

  if (!content) return <div className="p-8 text-ink-faint">Loading cases…</div>;

  const active = caseId ? content.ALL_CASES.find((c) => c.id === caseId) : undefined;
  if (active) {
    // Shown once the case has been completed at least once (practiceAfterCase).
    const practice = practiceAfterCase(active, profile.caseRecords);
    return (
      <div className="p-6">
        <CasePlayer
          key={active.id}
          c={active}
          onExit={() => {
            useUiStore.setState({ caseId: null });
            setSection("case-studies");
          }}
        />
        {practice.length > 0 && (
          <div className="max-w-3xl">
            <PracticeList items={practice} />
          </div>
        )}
      </div>
    );
  }

  const nPub = content.ALL_CASES.filter((c) => c.provenance.kind === "published").length;
  return (
    <SectionShell
      title="Case studies"
      subtitle={`${content.ALL_CASES.length} branching cases · ${nPub} retold from published reports with links to the originals`}
      actions={
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search cases"
          className="bg-base-800 border border-line rounded-md px-3 py-1.5 text-sm text-ink placeholder:text-ink-faint w-56"
        />
      }
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="seg">
          {(["all", "published", "synthetic"] as Filter[]).map((f) => (
            <button key={f} className={`seg-btn ${filter === f ? "seg-btn-active" : ""}`} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f === "published" ? "Published" : "Teaching"}
            </button>
          ))}
        </div>
        <select
          value={track}
          onChange={(e) => setTrack(e.target.value as TrackId | "all")}
          className="bg-base-800 border border-line rounded-md px-2 py-1 text-[12px] text-ink-soft"
        >
          <option value="all">All tracks</option>
          {content.TRACKS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>
      {cases.length === 0 ? (
        <div className="text-sm text-ink-faint">No cases match.</div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {cases.map((c) => {
            const rec = profile.caseRecords[c.id];
            const t = content.TRACKS.find((x) => x.id === c.trackId);
            return (
              <button key={c.id} onClick={() => openCase(c.id)} className="panel p-4 text-left hover:panel-glow transition-shadow">
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <ProvenanceBadge c={c} />
                  <span className="chip">stage {c.stage}</span>
                  {rec && <span className="chip font-mono">best {rec.best}%</span>}
                  {rec && casePractice(c).length > 0 && <span className="chip">lab practice</span>}
                </div>
                <div className="text-[15px] font-semibold text-ink">{c.title}</div>
                <div className="text-[13px] text-ink-faint mt-1 line-clamp-3">{c.summary}</div>
                {t && <div className="text-[12px] text-ink-faint mt-2">{t.title}</div>}
              </button>
            );
          })}
        </div>
      )}
    </SectionShell>
  );
}
