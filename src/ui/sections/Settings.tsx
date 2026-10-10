import { useState } from "react";
import { useProgressStore } from "../../state/useProgressStore";
import { INTENSITY_LABEL, INTENSITY_OPTIONS } from "../../data/curriculum";
import { DISCLAIMER } from "../../data/teachingText";
import type { Difficulty, TrainingIntensity } from "../../types";
import SectionShell from "../SectionShell";
import { ROD_DEFAULT_ON, physicsStatusText, usePhysicsSettings, type CatheterMechanics } from "../physics/physicsDevices";
import { LABEL_GATE_MIN, useReaderStore } from "../angio/labels";

const INTENSITIES: TrainingIntensity[] = INTENSITY_OPTIONS;
const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];

/**
 * Difficulty does not change how forgiving the catheter is: engagement is judged against one
 * fixed tolerance at every difficulty (FIXED_ENGAGEMENT_THRESHOLDS in
 * src/simulation/engagement.ts). Hints and the attending drawer follow the lab policy
 * (resolveLabPolicy in src/ui/lab/visibility.ts: entrustment level, launched activity or exam),
 * not this setting, so the text below claims nothing about help per difficulty.
 */
const DIFFICULTY_NOTE =
  "Catheter engagement is judged against the same tolerance at every difficulty. Hints and attending prompts follow your entrustment level and the activity you open, not this setting.";

const DIFF_HINT: Record<Difficulty, string> = {
  beginner: "The default for new profiles.",
  intermediate: "Changes neither engagement nor the help given.",
  advanced: "The daily challenge and exam mode always use it.",
};

const MECHANICS: { id: CatheterMechanics; label: string; hint: string }[] = [
  { id: "rod", label: "Rod mechanics", hint: "The catheter is a flexible rod: torque lags, curves fold and seat, and catheters are exchanged over the wire." },
  { id: "simple", label: "Simple model", hint: "The earlier analytic model of the tip, for slower machines." },
];

/** Catheter mechanics in the diagnostic lab (diag-rod-physics): rod or simple, and the reason the simple model is in use. */
function CatheterMechanicsPanel() {
  const choice = usePhysicsSettings((s) => s.choice);
  const fallback = usePhysicsSettings((s) => s.fallback);
  const setChoice = usePhysicsSettings((s) => s.setChoice);
  const effective: CatheterMechanics = choice ?? (ROD_DEFAULT_ON ? "rod" : "simple");
  const status = physicsStatusText({ choice, fallback });
  return (
    <div className="panel p-4">
      <div className="stat-label mb-1">Catheter mechanics</div>
      <p className="text-[12px] text-ink-faint mb-2">Applies to the cath lab from the next case.</p>
      <div className="space-y-1.5">
        {MECHANICS.map((m) => (
          <button
            key={m.id}
            onClick={() => setChoice(m.id)}
            aria-pressed={effective === m.id}
            className={`w-full text-left px-3 py-2 rounded-md border text-sm transition-colors ${
              effective === m.id ? "border-accent/50 bg-accent/10 text-ink" : "border-line bg-base-700/60 text-ink-soft hover:bg-base-600"
            }`}
          >
            <div>{m.label}</div>
            <div className="text-[12px] text-ink-faint mt-0.5">{m.hint}</div>
          </button>
        ))}
      </div>
      {choice !== null && (
        <button className="btn btn-ghost h-7 px-2 mt-2 text-[12px]" onClick={() => setChoice(null)}>
          Use the default
        </button>
      )}
      <div className={`notice ${status.startsWith("In use: rod") ? "notice-info" : "notice-warn"} mt-2 text-[12px]`} role="status">
        {status}
      </div>
    </div>
  );
}

/**
 * Reader mode (angio-expert-label-drills): a named supervising reader labels real library runs in the Library tab
 * of Real angiograms. The labels stay in this browser, are exported as JSON and never uploaded; the owner places the
 * file as labels.json beside the dataset in the library, and only labels served that way are used to score drills.
 */
function ReaderModePanel({ save, stamp }: { save: (name: string, text: string, type: string) => void; stamp: string }) {
  const enabled = useReaderStore((s) => s.enabled);
  const name = useReaderStore((s) => s.name);
  const qualification = useReaderStore((s) => s.qualification);
  const labels = useReaderStore((s) => s.labels);
  const setEnabled = useReaderStore((s) => s.setEnabled);
  const setReader = useReaderStore((s) => s.setReader);
  const importFile = useReaderStore((s) => s.importFile);
  const exportFile = useReaderStore((s) => s.exportFile);
  const [msg, setMsg] = useState("");
  const runs = new Set(labels.map((l) => l.run)).size;
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const r = importFile(await f.text());
    setMsg(`${r.added} label${r.added === 1 ? "" : "s"} imported${r.problems.length ? `; ${r.problems.length} refused (${r.problems.slice(0, 2).join("; ")}${r.problems.length > 2 ? "; …" : ""})` : ""}.`);
  };
  return (
    <div className="panel p-4">
      <div className="stat-label mb-1">Reader mode</div>
      <p className="text-[12px] text-ink-faint mb-2">
        For a supervising reader who labels real angiogram runs (TIMI flow, frame count, morphology, collaterals, Medina, calcium, segments, lesion class) in the Library tab of
        Real angiograms. Labels stay in this browser until exported; nothing is uploaded. A drill opens once {LABEL_GATE_MIN} runs carry labels served with the library, and labels
        made or imported here are never used to score a learner.
      </p>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <input className="field !h-8 text-[13px]" placeholder="Reader's name" value={name} onChange={(e) => setReader(e.target.value, qualification)} />
        <input className="field !h-8 text-[13px]" placeholder="Qualification" value={qualification} onChange={(e) => setReader(name, e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-[13px] text-ink-soft mb-2">
        <input type="checkbox" checked={enabled} disabled={!name.trim()} onChange={(e) => setEnabled(e.target.checked)} /> Label runs in the Library tab
        {!name.trim() && <span className="text-ink-faint">(name the reader first)</span>}
      </label>
      <div className="text-[12px] text-ink-faint mb-2">
        {labels.length} label{labels.length === 1 ? "" : "s"} on {runs} run{runs === 1 ? "" : "s"} in this browser.
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <button
          className="btn"
          disabled={!labels.length || !name.trim()}
          onClick={() => {
            save(`angio-labels-${stamp}.json`, exportFile(), "application/json");
            setMsg("Labels exported. Place the file as labels.json beside the dataset's index.json in the library.");
          }}
        >
          Export labels
        </button>
        <label className="btn cursor-pointer">
          Import labels
          <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
        </label>
      </div>
      {msg && <div className="text-[12px] text-ink-soft mt-2">{msg}</div>}
    </div>
  );
}

export default function Settings() {
  const profile = useProgressStore((s) => s.profile);
  const setIntensity = useProgressStore((s) => s.setIntensity);
  const setDifficulty = useProgressStore((s) => s.setDifficulty);
  const setCurrentDay = useProgressStore((s) => s.setCurrentDay);
  const exportJSON = useProgressStore((s) => s.exportJSON);
  const importJSON = useProgressStore((s) => s.importJSON);
  const reset = useProgressStore((s) => s.reset);
  const exportLogbook = useProgressStore((s) => s.exportLogbook);

  const [importText, setImportText] = useState("");
  const [status, setStatus] = useState<string>("");
  const [confirmReset, setConfirmReset] = useState(false);

  const save = (name: string, text: string, type: string) => {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };
  const stamp = new Date().toISOString().slice(0, 10);
  const download = () => {
    save(`cathmaster-progress-${stamp}.json`, exportJSON(), "application/json");
    setStatus("Progress exported.");
  };

  const doImport = () => {
    if (!importText.trim()) return;
    const ok = importJSON(importText.trim());
    setStatus(ok ? "Progress imported. Older profiles are converted: attempts become logbook rows and nothing is dropped." : "Import failed: the text is not a saved profile.");
    if (ok) setImportText("");
  };

  return (
    <SectionShell
      title="Settings"
      subtitle="Training time, difficulty, day, and your saved progress and logbook."
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div className="panel p-4">
          <div className="stat-label mb-2">Training intensity</div>
          <div className="space-y-1.5">
            {INTENSITIES.map((i) => (
              <button
                key={i}
                onClick={() => setIntensity(i)}
                className={`w-full text-left px-3 py-2 rounded-md border text-sm transition-colors ${
                  profile.intensity === i
                    ? "border-accent/50 bg-accent/10 text-ink"
                    : "border-line bg-base-700/60 text-ink-soft hover:bg-base-600"
                }`}
              >
                {INTENSITY_LABEL[i]}
              </button>
            ))}
          </div>
        </div>

        <div className="panel p-4">
          <div className="stat-label mb-1">Simulation difficulty</div>
          <p className="text-[12px] text-ink-faint mb-2">{DIFFICULTY_NOTE}</p>
          <div className="space-y-1.5">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`w-full text-left px-3 py-2 rounded-md border text-sm transition-colors ${
                  profile.difficulty === d
                    ? "border-accent/50 bg-accent/10 text-ink"
                    : "border-line bg-base-700/60 text-ink-soft hover:bg-base-600"
                }`}
              >
                <div className="capitalize">{d}</div>
                <div className="text-[12px] text-ink-faint mt-0.5">{DIFF_HINT[d]}</div>
              </button>
            ))}
          </div>
        </div>

        <CatheterMechanicsPanel />

        <ReaderModePanel save={save} stamp={stamp} />

        <div className="panel p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="stat-label">Training day</span>
            <span className="font-mono text-ink">{profile.currentDay} / 365</span>
          </div>
          <input
            type="range"
            min={1}
            max={365}
            value={profile.currentDay}
            onChange={(e) => setCurrentDay(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-[12px] text-ink-faint mt-1">
            Move freely along the 365-day curriculum. Completing a daily plan advances this
            automatically.
          </div>
          {profile.migratedAt && (
            <div className="text-[12px] text-ink-faint mt-2">
              This profile was converted to the logbook format on {new Date(profile.migratedAt).toLocaleDateString()}; earlier attempts are in the logbook.
            </div>
          )}
        </div>

        <div className="panel p-4">
          <div className="stat-label mb-2">Progress data</div>
          <div className="flex flex-wrap gap-2 mb-3">
            <button className="btn" onClick={download}>Export profile</button>
            <button className="btn" disabled={!profile.logbook.length} onClick={() => { save(`cathmaster-logbook-${stamp}.csv`, exportLogbook("csv"), "text/csv"); setStatus("Logbook exported as CSV."); }}>
              Logbook CSV
            </button>
            <button className="btn" disabled={!profile.logbook.length} onClick={() => { save(`cathmaster-logbook-${stamp}.json`, exportLogbook("json"), "application/json"); setStatus("Logbook exported as JSON."); }}>
              Logbook JSON
            </button>
            <button
              className={`btn ${confirmReset ? "btn-danger" : "btn-ghost"}`}
              onClick={() => {
                if (confirmReset) {
                  reset();
                  setStatus("Progress reset to a fresh profile.");
                  setConfirmReset(false);
                } else {
                  setConfirmReset(true);
                }
              }}
            >
              {confirmReset ? "Click again to confirm reset" : "Reset all progress"}
            </button>
          </div>
          <textarea
            placeholder="Paste exported JSON here to import…"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="w-full h-24 bg-base-800 border border-line rounded-md px-3 py-2 text-xs font-mono text-ink-soft resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <button className="btn" onClick={doImport} disabled={!importText.trim()}>
              Import
            </button>
            {status && <span className="text-[12px] text-good">{status}</span>}
          </div>
        </div>
      </div>

      <div className="panel p-4 mt-4 border-warn/30">
        <div className="stat-label text-warn mb-1">Disclaimer</div>
        <p className="text-sm text-ink-soft leading-relaxed">{DISCLAIMER}</p>
      </div>
    </SectionShell>
  );
}
