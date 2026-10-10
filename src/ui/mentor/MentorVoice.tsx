// ---------------------------------------------------------------------------
// The attending's voice and captions. Speech uses the Web Speech API when the
// browser has it, and only voices with localService === true, so nothing is
// sent off the device and it works offline. Captions are always shown, so the
// mentor works with the sound off. Speech is muted by default in exam mode.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AssessmentMode, MentorUtterance } from "../../mentor/types";

interface SpeechApi {
  synth: SpeechSynthesis;
  Utterance: typeof SpeechSynthesisUtterance;
}

function speechApi(): SpeechApi | null {
  try {
    const w = globalThis as unknown as { speechSynthesis?: SpeechSynthesis; SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance };
    if (!w.speechSynthesis || !w.SpeechSynthesisUtterance) return null;
    return { synth: w.speechSynthesis, Utterance: w.SpeechSynthesisUtterance };
  } catch {
    return null;
  }
}

/** Local voices only, English first, British English preferred (the app's spelling). */
export function localVoices(all: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const local = all.filter((v) => v.localService);
  const rank = (v: SpeechSynthesisVoice) => (v.lang === "en-GB" ? 0 : v.lang.startsWith("en") ? 1 : 2);
  return local.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

export interface MentorVoiceState {
  supported: boolean;
  voices: SpeechSynthesisVoice[];
  voiceName: string | null;
  setVoiceName: (n: string | null) => void;
  muted: boolean;
  setMuted: (m: boolean) => void;
  speak: (u: MentorUtterance) => void;
  stop: () => void;
}

export function useMentorVoice(mode: AssessmentMode): MentorVoiceState {
  const api = useMemo(speechApi, []);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState<string | null>(null);
  const [muted, setMuted] = useState(mode === "exam");

  useEffect(() => setMuted(mode === "exam"), [mode]);

  useEffect(() => {
    if (!api) return;
    const load = () => {
      try {
        setVoices(localVoices(api.synth.getVoices()));
      } catch {
        setVoices([]);
      }
    };
    load();
    try {
      api.synth.addEventListener("voiceschanged", load);
      return () => api.synth.removeEventListener("voiceschanged", load);
    } catch {
      return undefined;
    }
  }, [api]);

  const stop = useCallback(() => {
    try {
      api?.synth.cancel();
    } catch {
      /* ignore */
    }
  }, [api]);

  const speak = useCallback(
    (u: MentorUtterance) => {
      if (!api || muted || !voices.length) return;
      try {
        // a stop interrupts whatever is being said
        if (u.level >= 5 || u.blocking) api.synth.cancel();
        const s = new api.Utterance(u.text);
        const v = voices.find((x) => x.name === voiceName) ?? voices[0];
        s.voice = v;
        s.lang = v.lang;
        s.rate = u.level >= 5 ? 1.05 : 0.98;
        s.pitch = 1;
        api.synth.speak(s);
      } catch {
        /* speech is optional */
      }
    },
    [api, muted, voices, voiceName]
  );

  useEffect(() => stop, [stop]);

  return { supported: !!api && voices.length > 0, voices, voiceName, setVoiceName, muted, setMuted, speak, stop };
}

export interface MentorVoiceProps {
  /** the latest utterance (a new id triggers speech) */
  utterance: MentorUtterance | null;
  mode: AssessmentMode;
  /** how long a caption stays (ms); stops stay until the next utterance */
  captionMs?: number;
  /** show the speech controls */
  controls?: boolean;
}

/** Caption strip plus optional speech. Place it over the bottom of the X-ray view. */
export default function MentorVoice({ utterance, mode, captionMs = 7000, controls = true }: MentorVoiceProps) {
  const voice = useMentorVoice(mode);
  const [shown, setShown] = useState<MentorUtterance | null>(null);
  const lastId = useRef<string | null>(null);

  useEffect(() => {
    if (!utterance || utterance.id === lastId.current) return;
    lastId.current = utterance.id;
    setShown(utterance);
    voice.speak(utterance);
    if (utterance.level >= 5 || utterance.blocking) return;
    const h = setTimeout(() => setShown((s) => (s?.id === utterance.id ? null : s)), captionMs);
    return () => clearTimeout(h);
    // speak once per new utterance; a change of voice settings must not repeat the line
  }, [utterance, captionMs]);

  const stop = shown && (shown.level >= 5 || shown.blocking);
  return (
    <div className="pointer-events-none flex flex-col items-center gap-2">
      {shown && (
        <div
          role={stop ? "alert" : "status"}
          aria-live={stop ? "assertive" : "polite"}
          className={`pointer-events-auto max-w-[640px] rounded-lg border px-4 py-2.5 text-[15px] leading-snug ${
            stop ? "border-[#5c2a27] bg-[#2a1615] text-[#f2938c]" : "border-line-strong bg-base-800/95 text-ink"
          }`}
        >
          <span className="mr-2 text-xs text-ink-faint">Attending</span>
          {shown.text}
        </div>
      )}
      {controls && (
        <div className="pointer-events-auto flex items-center gap-2 text-xs text-ink-faint">
          {voice.supported ? (
            <>
              <button type="button" className="btn btn-ghost px-2 py-1 text-xs" onClick={() => voice.setMuted(!voice.muted)} aria-pressed={!voice.muted}>
                {voice.muted ? "Voice off" : "Voice on"}
              </button>
              {voice.voices.length > 1 && (
                <select className="field h-7 text-xs" value={voice.voiceName ?? voice.voices[0]?.name ?? ""} onChange={(e) => voice.setVoiceName(e.target.value)} aria-label="Attending voice">
                  {voice.voices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              )}
            </>
          ) : (
            <span>Captions only: no on-device voice available</span>
          )}
        </div>
      )}
    </div>
  );
}
