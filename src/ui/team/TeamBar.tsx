// ---------------------------------------------------------------------------
// TeamBar: the one-line strip for the lab layout's palette slot. It opens the
// command palette (also Ctrl K / ⌘K), shows the newest line said, offers
// "Correct" and "No" while a read-back or a question waits for the operator,
// and holds the sound controls (start sound, mute, the mixer).
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import type { Team } from "../../simulation/team/team";
import { roleLabel } from "../../simulation/team/agent";
import type { AudioEngine } from "../../audio/engine";
import type { TeamVoices } from "../../audio/speech";
import CommandPalette from "./CommandPalette";
import AudioMixer from "./AudioMixer";
import { useAudioSettings, useOpenOrder, useUtterances } from "./useTeam";

export interface TeamBarProps {
  team: Team | null;
  audio?: AudioEngine | null;
  voices?: TeamVoices | null;
  sedationRole?: "sedation-nurse" | "anaesthetist";
}

export default function TeamBar({ team, audio = null, voices = null, sedationRole = "sedation-nurse" }: TeamBarProps) {
  const [palette, setPalette] = useState(false);
  const [mixer, setMixer] = useState(false);
  const last = useUtterances(team, 1)[0];
  const open = useOpenOrder(team);
  return (
    <div className="relative flex h-8 items-center gap-2">
      <button type="button" className="btn px-2.5 py-0.5 text-xs" onClick={() => setPalette(true)} title="Ctrl K or ⌘K">
        Speak to the team
      </button>
      <span className="min-w-0 flex-1 truncate text-[13px]">
        {last ? (
          <>
            <span className="mr-1.5 text-xs text-ink-faint">{last.clock}</span>
            <span className="mr-1.5 text-xs font-medium text-ink-soft">{roleLabel(last.speaker, sedationRole)}</span>
            <span className={last.urgent ? "text-[#f2938c]" : "text-ink"}>{last.text}</span>
          </>
        ) : (
          <span className="text-ink-faint">The team is ready.</span>
        )}
      </span>
      {open && team && (
        <>
          <button type="button" className="btn btn-good px-2 py-0.5 text-xs" onClick={() => team.command("correct", "button")}>
            Correct
          </button>
          <button type="button" className="btn btn-ghost px-2 py-0.5 text-xs" onClick={() => team.command("no", "button")}>
            No
          </button>
        </>
      )}
      {audio && <SoundButtons audio={audio} onMixer={() => setMixer((m) => !m)} />}
      {audio && mixer && (
        <div className="absolute bottom-9 right-0 z-40 w-[340px]">
          <AudioMixer engine={audio} voices={voices} />
        </div>
      )}
      <CommandPalette team={team} open={palette} onOpenChange={setPalette} sedationRole={sedationRole} />
    </div>
  );
}

function SoundButtons({ audio, onMixer }: { audio: AudioEngine; onMixer: () => void }) {
  const s = useAudioSettings(audio);
  const [ready, setReady] = useState(audio.ready);
  useEffect(() => audio.onChange(() => setReady(audio.ready)), [audio]);
  if (!ready)
    return (
      <button type="button" className="btn btn-accent px-2.5 py-0.5 text-xs" onClick={() => void audio.unlock().then(setReady)}>
        Turn sound on
      </button>
    );
  return (
    <>
      <button type="button" className={`btn px-2 py-0.5 text-xs ${s.muted ? "btn-danger" : "btn-ghost"}`} aria-pressed={s.muted} onClick={() => audio.setMuted(!s.muted)}>
        {s.muted ? "Sound muted" : "Mute"}
      </button>
      <button type="button" className="btn btn-ghost px-2 py-0.5 text-xs" onClick={onMixer}>
        Sound
      </button>
    </>
  );
}
