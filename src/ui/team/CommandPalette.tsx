// ---------------------------------------------------------------------------
// Command palette: the operator's voice in the lab, typed.
//
// Ctrl K or ⌘K opens it from anywhere (the key press is stopped in the
// capture phase so the S8 keyboard source never sees the K). Type a command
// the way you would say it ("heparin 5,000 units IV", "LAO 30 cranial 20",
// "breathe in and hold"); the line under the box shows who will act on it and
// how it was understood. Enter sends it, Esc closes, the arrows pick a
// suggestion, Tab copies it into the box, and the up arrow on an empty box
// recalls the last command. Optional push-to-talk is off until switched on,
// with the disclosure shown.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Team } from "../../simulation/team/team";
import { COMMAND_EXAMPLES, parseCommand } from "../../simulation/team/intents";
import { describeCommand } from "./describe";
import { PushToTalk, SPEECH_DISCLOSURE, recognitionCtor } from "./speechInput";
import TeamButtons from "./TeamButtons";

export interface CommandPaletteProps {
  team: Team | null;
  /** controlled open state (optional) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** listen for Ctrl K / ⌘K on the window (default true) */
  hotkey?: boolean;
  sedationRole?: "sedation-nurse" | "anaesthetist";
  /** show the quick buttons under the box (default true) */
  buttons?: boolean;
}

const VOICE_KEY = "cathmaster.team.voiceInput";

function loadVoicePref(): boolean {
  try {
    return localStorage.getItem(VOICE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Palette suggestions for a typed prefix: examples containing every typed word. */
export function suggestions(q: string, max = 7) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return COMMAND_EXAMPLES.slice(0, max);
  return COMMAND_EXAMPLES.filter((e) => {
    const t = `${e.text} ${e.hint}`.toLowerCase();
    return words.every((w) => t.includes(w));
  }).slice(0, max);
}

export default function CommandPalette({ team, open: openProp, onOpenChange, hotkey = true, sedationRole = "sedation-nurse", buttons = true }: CommandPaletteProps) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = useCallback(
    (o: boolean) => {
      setOpenState(o);
      onOpenChange?.(o);
    },
    [onOpenChange]
  );
  const [text, setText] = useState("");
  const [sel, setSel] = useState(-1);
  const [history, setHistory] = useState<string[]>([]);
  const [voiceOn, setVoiceOn] = useState(loadVoicePref);
  const [voice, setVoice] = useState<{ listening: boolean; interim: string; error?: string }>({ listening: false, interim: "" });
  const input = useRef<HTMLInputElement | null>(null);
  const ptt = useRef<PushToTalk | null>(null);
  const canVoice = useMemo(() => !!recognitionCtor(), []);

  const send = useCallback(
    (raw: string, source: "typed" | "voice" = "typed") => {
      const t = raw.trim();
      if (!t || !team) return;
      team.command(t, source);
      setHistory((h) => [t, ...h.filter((x) => x !== t)].slice(0, 30));
      setText("");
      setSel(-1);
      if (source === "typed") setOpen(false);
    },
    [team, setOpen]
  );

  // Ctrl K / ⌘K, captured before the lab's keyboard source sees it
  useEffect(() => {
    if (!hotkey || typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.key === "k" || e.key === "K" || e.code === "KeyK")) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [hotkey, open, setOpen]);

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    if (!voiceOn || !canVoice) return;
    const p = new PushToTalk((t) => send(t, "voice"), setVoice);
    ptt.current = p;
    return () => {
      p.dispose();
      ptt.current = null;
    };
  }, [voiceOn, canVoice, send]);

  const parsed = useMemo(() => (text.trim() ? parseCommand(text) : null), [text]);
  const preview = parsed ? describeCommand(parsed, sedationRole) : null;
  const sugg = useMemo(() => suggestions(text), [text]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(sugg.length - 1, s + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!text && sel < 0 && history.length) setText(history[0]);
      else setSel((s) => Math.max(-1, s - 1));
    } else if (e.key === "Tab" && sel >= 0 && sugg[sel]) {
      e.preventDefault();
      setText(sugg[sel].text);
      setSel(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      send(sel >= 0 && sugg[sel] ? sugg[sel].text : text);
    }
  };

  const toggleVoice = (on: boolean) => {
    setVoiceOn(on);
    try {
      localStorage.setItem(VOICE_KEY, on ? "1" : "0");
    } catch {
      /* not remembered */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-[12vh]" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)} role="presentation">
      <div className="panel w-full max-w-[640px] shadow-panel" role="dialog" aria-label="Speak to the team">
        <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
          <input
            ref={input}
            className="field h-10 flex-1 text-[15px]"
            placeholder="Say something to the team or the patient"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setSel(-1);
            }}
            onKeyDown={onKeyDown}
            aria-label="Command"
            spellCheck={false}
            autoComplete="off"
          />
          <button type="button" className="btn btn-accent" onClick={() => send(sel >= 0 && sugg[sel] ? sugg[sel].text : text)} disabled={!text.trim() && sel < 0}>
            Say
          </button>
        </div>
        <div className="min-h-[34px] border-b border-line px-3 py-2 text-[13px]">
          {preview ? (
            preview.ok ? (
              <span>
                <span className="text-ink-faint">{preview.who}: </span>
                <span className="text-ink">{preview.what}</span>
              </span>
            ) : (
              <span className="text-warn">Not understood. The team will ask you to say it again.</span>
            )
          ) : (
            <span className="text-ink-faint">Examples below. Name the person ("nurse, …") to close the loop.</span>
          )}
        </div>
        <ul className="max-h-[260px] overflow-y-auto py-1" role="listbox" aria-label="Suggestions">
          {sugg.map((s, i) => (
            <li key={s.text} role="option" aria-selected={i === sel}>
              <button
                type="button"
                className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-[13px] ${i === sel ? "bg-accent-tint text-ink" : "text-ink-soft hover:bg-base-600"}`}
                onMouseEnter={() => setSel(i)}
                onClick={() => send(s.text)}
              >
                <span>{s.text}</span>
                <span className="text-xs text-ink-faint">{s.hint}</span>
              </button>
            </li>
          ))}
        </ul>
        {buttons && team && (
          <div className="border-t border-line px-3 py-2.5">
            <TeamButtons team={team} compact onSent={() => setOpen(false)} />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 border-t border-line px-3 py-2 text-xs text-ink-faint">
          <span>Enter to say · Esc to close · Tab to complete · ↑ last command</span>
          {canVoice && (
            <label className="ml-auto flex items-center gap-1.5 text-ink-soft">
              <input type="checkbox" checked={voiceOn} onChange={(e) => toggleVoice(e.target.checked)} />
              Voice commands
            </label>
          )}
        </div>
        {canVoice && voiceOn && (
          <div className="border-t border-line px-3 py-2.5">
            <p className="notice notice-info mb-2 text-xs">{SPEECH_DISCLOSURE}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`btn ${voice.listening ? "btn-danger" : ""}`}
                onPointerDown={() => ptt.current?.start()}
                onPointerUp={() => ptt.current?.stop()}
                onPointerLeave={() => voice.listening && ptt.current?.stop()}
              >
                {voice.listening ? "Listening, release to send" : "Hold to talk"}
              </button>
              <span className="min-w-0 flex-1 truncate text-[13px] text-ink-soft">{voice.error ?? voice.interim}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
