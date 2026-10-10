// ---------------------------------------------------------------------------
// Opt-in push-to-talk through the Web Speech recognition API.
//
// Off by default. Some browsers send the audio to a remote recognition
// service (fact C4-F5), so the palette shows the disclosure below and the
// learner must switch it on. Typed commands cover every intent, so nothing
// depends on recognition. Feature-detected; absent in browsers without it.
// ---------------------------------------------------------------------------

export const SPEECH_DISCLOSURE =
  "Voice commands use your browser's speech recognition. Some browsers send the recording to the browser maker's servers to turn it into text. Typed commands do everything voice commands do.";

interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type RecognitionCtor = new () => RecognitionLike;

export function recognitionCtor(): RecognitionCtor | null {
  try {
    const w = globalThis as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  } catch {
    return null;
  }
}

export class PushToTalk {
  private rec: RecognitionLike | null = null;
  private text = "";
  listening = false;

  constructor(
    private onFinal: (text: string) => void,
    private onState: (s: { listening: boolean; interim: string; error?: string }) => void,
    private Ctor: RecognitionCtor | null = recognitionCtor()
  ) {}

  get supported(): boolean {
    return !!this.Ctor;
  }

  /** Start listening (call from the key or button press). */
  start() {
    if (!this.Ctor || this.listening) return;
    try {
      const r = new this.Ctor();
      r.lang = "en-GB";
      r.continuous = true;
      r.interimResults = true;
      r.maxAlternatives = 1;
      this.text = "";
      r.onresult = (e) => {
        let s = "";
        for (let i = 0; i < e.results.length; i++) s += e.results[i][0]?.transcript ?? "";
        this.text = s.trim();
        this.onState({ listening: true, interim: this.text });
      };
      r.onerror = (e) => this.onState({ listening: false, interim: "", error: e.error === "not-allowed" ? "Microphone permission was refused." : `Speech recognition stopped (${e.error}).` });
      r.onend = () => {
        this.listening = false;
        const t = this.text;
        this.text = "";
        this.onState({ listening: false, interim: "" });
        if (t) this.onFinal(t);
      };
      this.rec = r;
      r.start();
      this.listening = true;
      this.onState({ listening: true, interim: "" });
    } catch {
      this.onState({ listening: false, interim: "", error: "Speech recognition could not start." });
    }
  }

  /** Stop listening (key or button released); the final text is delivered on end. */
  stop() {
    try {
      this.rec?.stop();
    } catch {
      /* already stopped */
    }
  }

  dispose() {
    try {
      this.rec?.abort();
    } catch {
      /* ignore */
    }
    this.rec = null;
  }
}
