import { create } from "zustand";

// ---------------------------------------------------------------------------
// Real cine-loop playback.
//
// A procedurally drawn tree can only ever look "drawn". The one path to a truly
// real angiographic image is REAL X-ray cine footage. This store lets the user
// load a coronary angiogram video clip THEY own (nothing is bundled — no
// patient data ships in the app) and the fluoro monitor plays it as the image.
// A single hidden <video> element is created per clip and rendered onto the
// fluoro canvas by FluoroView.
// ---------------------------------------------------------------------------

interface CineStore {
  video: HTMLVideoElement | null;
  name: string | null;
  loadFile: (f: File) => void;
  clear: () => void;
}

export const useCineStore = create<CineStore>((set, get) => ({
  video: null,
  name: null,

  loadFile: (f) => {
    const prev = get().video;
    if (prev) {
      prev.pause();
      try {
        URL.revokeObjectURL(prev.src);
      } catch {
        /* already revoked */
      }
    }
    const url = URL.createObjectURL(f);
    const v = document.createElement("video");
    v.src = url;
    v.loop = true;
    v.muted = true;
    v.playsInline = true;
    v.play().catch(() => {
      /* user can retap if autoplay is blocked */
    });
    set({ video: v, name: f.name });
  },

  clear: () => {
    const v = get().video;
    if (v) {
      v.pause();
      try {
        URL.revokeObjectURL(v.src);
      } catch {
        /* noop */
      }
    }
    set({ video: null, name: null });
  },
}));
