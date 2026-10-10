// ---------------------------------------------------------------------------
// Sound controls: start sound (a user gesture is required before any audio),
// master volume and mute, a volume and mute per channel, the pulse-tone source
// and the team's voice. Settings persist (AudioEngine, localStorage).
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { CHANNELS, CHANNEL_LABEL, type AudioEngine } from "../../audio/engine";
import type { TeamVoices } from "../../audio/speech";
import { useAudioSettings } from "./useTeam";

export interface AudioMixerProps {
  engine: AudioEngine;
  voices?: TeamVoices | null;
  className?: string;
}

export default function AudioMixer({ engine, voices = null, className = "" }: AudioMixerProps) {
  const s = useAudioSettings(engine);
  const [ready, setReady] = useState(engine.ready);
  const [voiceList, setVoiceList] = useState<SpeechSynthesisVoice[]>(voices?.available ?? []);
  useEffect(() => engine.onChange(() => setReady(engine.ready)), [engine]);
  useEffect(() => {
    if (!voices) return;
    const iv = setInterval(() => setVoiceList(voices.available), 1000);
    setVoiceList(voices.available);
    return () => clearInterval(iv);
  }, [voices]);
  const supported = typeof window === "undefined" || ("AudioContext" in window || "webkitAudioContext" in window);

  return (
    <section className={`panel ${className}`} aria-label="Sound">
      <div className="panel-head">
        <span>Sound</span>
        {ready ? (
          <label className="flex items-center gap-1.5 text-xs font-normal text-ink-soft">
            <input type="checkbox" checked={s.muted} onChange={(e) => engine.setMuted(e.target.checked)} />
            Mute all
          </label>
        ) : null}
      </div>
      <div className="flex flex-col gap-2.5 px-4 py-3">
        {!supported && <p className="notice notice-warn">This browser has no Web Audio. Captions still show everything said.</p>}
        {supported && !ready && (
          <button type="button" className="btn btn-accent self-start" onClick={() => void engine.unlock().then(setReady)}>
            Turn sound on
          </button>
        )}
        <Row label="Master" value={s.master} muted={s.muted} onValue={(v) => engine.setMaster(v)} />
        {CHANNELS.map((c) => (
          <Row key={c} label={CHANNEL_LABEL[c]} value={s.channels[c].volume} muted={s.channels[c].muted} onValue={(v) => engine.setChannel(c, { volume: v })} onMute={(m) => engine.setChannel(c, { muted: m })} />
        ))}
        <div className="flex items-center gap-2">
          <span className="w-[92px] shrink-0 text-xs text-ink-faint">Pulse tone</span>
          <div className="seg" role="radiogroup" aria-label="Pulse tone source">
            {(["ecg", "pleth"] as const).map((src) => (
              <button key={src} type="button" role="radio" aria-checked={s.pulseSource === src} className={`seg-btn text-xs ${s.pulseSource === src ? "seg-btn-active" : ""}`} onClick={() => engine.update({ pulseSource: src })}>
                {src === "ecg" ? "ECG R wave" : "Finger pulse"}
              </button>
            ))}
          </div>
        </div>
        {voices && (
          <div className="flex items-center gap-2">
            <span className="w-[92px] shrink-0 text-xs text-ink-faint">Staff voice</span>
            {voiceList.length ? (
              <select className="field h-8 min-w-0 flex-1 text-xs" value={s.voiceName ?? ""} onChange={(e) => engine.update({ voiceName: e.target.value || null })} aria-label="Staff voice">
                <option value="">Automatic (one per role)</option>
                {voiceList.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-ink-faint">No on-device voices; captions only.</span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Row({ label, value, muted, onValue, onMute }: { label: string; value: number; muted: boolean; onValue: (v: number) => void; onMute?: (m: boolean) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[92px] shrink-0 text-xs text-ink-soft">{label}</span>
      <input type="range" min={0} max={100} value={Math.round(value * 100)} onChange={(e) => onValue(Number(e.target.value) / 100)} className="min-w-0 flex-1 accent-[#4F8EF7]" aria-label={`${label} volume`} disabled={muted} />
      {onMute && (
        <button type="button" className={`btn px-2 py-0.5 text-xs ${muted ? "btn-danger" : "btn-ghost"}`} aria-pressed={muted} onClick={() => onMute(!muted)}>
          {muted ? "Muted" : "Mute"}
        </button>
      )}
    </div>
  );
}
