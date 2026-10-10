import { useEffect, useRef } from "react";
import { useSeriesStore, type StoredSeries } from "../../state/useSeriesStore";
import { useCineStore } from "../../state/useCineStore";
import { angleText, useSeries, useSim } from "./useLab";
import { labScreens } from "./visibility";
import { ACQUISITION_TAGS, RUN_TAG_LABEL, type RunTag } from "../../simulation/imaging/runQuality";

// Thumbnails of the stored runs (cine runs and stored fluoroscopy), newest last.
//
// Run quality (diag-injection-run-quality): each cine run the diagnostic lab
// judged carries its analysis (StoredSeries.quality). Every mode shows how the
// run was acquired, which the operator did and knows (frame rate, volume, a
// panned table, a change of field, the breath-hold, when the push began); the
// judgements of the filling (streaming, no reflux, under 3 beats, non-
// diagnostic, QFR suitable) are a guided teaching aid (labScreens
// teachingAids), so they appear only in guided practice. The learner can
// declare the selected run non-diagnostic in every mode; the store keeps the
// declarations for the study report (useSeriesStore
// declaredNonDiagnosticRuns). The browser is shared with the PCI lab's
// reference monitor, whose runs carry no analysis: tags and the declaration
// appear only on runs the diagnostic lab judged (StoredSeries.quality).

/** The tags of a run a screen may show: the acquisition tags always, the filling judgements only as a teaching aid. */
export function shownRunTags(s: Pick<StoredSeries, "quality">, teachingAids: boolean): RunTag[] {
  const tags = s.quality?.tags ?? [];
  return teachingAids ? [...tags] : tags.filter((t) => ACQUISITION_TAGS.includes(t));
}

/** One line of the acquisition facts of a run: frames per second, the contrast pushed while it recorded. */
export function runFacts(s: Pick<StoredSeries, "fps" | "contrastMl" | "frames" | "kind">): string {
  const ml = s.kind === "cine" && s.contrastMl > 0.05 ? `, ${s.contrastMl.toFixed(1)} mL` : "";
  return `${s.frames.length} frames at ${s.fps} per second${ml}`;
}

function Thumb({ s }: { s: StoredSeries }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const g = c?.getContext("2d");
    if (!c || !g) return;
    g.fillStyle = "#000";
    g.fillRect(0, 0, c.width, c.height);
    if (!s.frames.length) return;
    // a frame a little past the middle of the run, where a hand injection usually has the tree filled
    const best = s.frames[Math.min(s.frames.length - 1, Math.floor(s.frames.length * 0.55))];
    const src = document.createElement("canvas");
    src.width = s.w;
    src.height = s.h;
    const sg = src.getContext("2d");
    if (!sg) return;
    const img = sg.createImageData(s.w, s.h);
    for (let i = 0, j = 0; i < best.length; i++, j += 4) {
      img.data[j] = img.data[j + 1] = img.data[j + 2] = best[i];
      img.data[j + 3] = 255;
    }
    sg.putImageData(img, 0, 0);
    g.imageSmoothingEnabled = true;
    g.drawImage(src, 0, 0, c.width, c.height);
  }, [s]);
  return <canvas ref={ref} width={72} height={72} className="block h-[72px] w-[72px] rounded-sm bg-black" aria-hidden />;
}

export default function SeriesBrowser() {
  const series = useSeries((s) => s.series);
  const selectedId = useSeries((s) => s.selectedId);
  const select = useSeries((s) => s.select);
  const declare = useSeries((s) => s.declareNonDiagnostic);
  const policy = useSim((s) => s.policy);
  const teachingAids = labScreens(policy).teachingAids;
  const selected = series.find((x) => x.id === selectedId) ?? null;
  const clipName = useCineStore((s) => s.name);
  const loadClip = useCineStore((s) => s.loadFile);
  const clearClip = useCineStore((s) => s.clear);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [series.length]);

  return (
    <div className="flex min-w-0 items-stretch gap-2" aria-label="Stored runs">
      <div ref={listRef} className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-1" role="listbox" aria-label="Runs">
        {series.length === 0 && <div className="self-center px-2 text-[12px] text-ink-faint">No runs stored yet. Cine runs and stored fluoroscopy appear here.</div>}
        {series.map((s) => (
          <button
            key={s.id}
            role="option"
            aria-selected={s.id === selectedId}
            onClick={() => select(s.id)}
            className={`flex shrink-0 flex-col items-start gap-0.5 rounded-md border p-1 text-left ${s.id === selectedId ? "border-accent bg-accent-tint" : "border-line hover:border-line-strong"}`}
            title={[`${s.kind === "cine" ? "Cine" : "Stored fluoroscopy"} run ${s.number}: ${angleText(s.cArm)}, ${runFacts(s)}`, ...shownRunTags(s, teachingAids).map((t) => RUN_TAG_LABEL[t]), ...(s.declaredNonDiagnostic ? ["Declared non-diagnostic"] : [])].join("\n")}
          >
            <Thumb s={s} />
            <span className="font-mono text-[12px] text-ink">
              {s.number}
              {s.kind === "fluoro" ? " F" : ""}
            </span>
            <span className="max-w-[72px] truncate font-mono text-[12px] text-ink-faint">{angleText(s.cArm).replace("  ", " ")}</span>
            {s.declaredNonDiagnostic ? (
              <span className="max-w-[72px] truncate text-[11px] text-warn">Non-diagnostic</span>
            ) : (
              shownRunTags(s, teachingAids)
                .slice(0, 1)
                .map((t) => (
                  <span key={t} className="max-w-[72px] truncate text-[11px] text-ink-faint">
                    {RUN_TAG_LABEL[t]}
                  </span>
                ))
            )}
          </button>
        ))}
      </div>
      <div className="flex shrink-0 flex-col justify-center gap-1">
        {selected && selected.kind === "cine" && selected.quality && (
          <button
            className="btn btn-ghost h-7 px-2 text-[12px]"
            aria-pressed={!!selected.declaredNonDiagnostic}
            onClick={() => declare(selected.id, !selected.declaredNonDiagnostic)}
            title={selected.declaredNonDiagnostic ? `Withdraw the declaration that run ${selected.number} is non-diagnostic` : `Declare run ${selected.number} non-diagnostic: the study report lists it among the runs not to be read`}
          >
            {selected.declaredNonDiagnostic ? "Withdraw non-diagnostic" : "Declare non-diagnostic"}
          </button>
        )}
        <label className="btn btn-ghost h-7 cursor-pointer px-2 text-[12px]" title="Play an angiogram clip you own on the reference monitor (nothing is stored)">
          {clipName ? "Clip loaded" : "Import clip"}
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                loadClip(f);
                select(null);
              }
              e.currentTarget.value = "";
            }}
          />
        </label>
        {clipName && (
          <button className="btn btn-ghost h-7 px-2 text-[12px]" onClick={clearClip}>
            Close clip
          </button>
        )}
      </div>
    </div>
  );
}
