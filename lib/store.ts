"use client";
import { create } from "zustand";

export type Aspect = "16:9" | "9:16";
export type Mode = "single" | "side-by-side";
export type MediaKind = "image" | "video";

export interface ForegroundLayer {
  src: string | null;
  kind: MediaKind | null;
  naturalWidth: number;
  naturalHeight: number;
  /** Video duration in seconds (videos only) */
  duration: number;
  /** Object URL we created; revoke on replace */
  objectUrl: string | null;
}

export interface ForegroundStyle {
  size: number; // 0.4 – 0.95 of canvas longest edge
  offsetX: number; // -200..200 px on output scale
  offsetY: number;
  radius: number; // 0..96 px
  shadow: {
    enabled: boolean;
    blur: number; // 0..120
    opacity: number; // 0..1
    offsetY: number; // 0..80
    color: string;
  };
}

export type BgKind = "color" | "gradient" | "image";

export interface BackgroundState {
  kind: BgKind;
  color: string;
  gradient: { from: string; to: string; angle: number };
  image: {
    src: string | null;
    objectUrl: string | null;
    naturalWidth: number;
    naturalHeight: number;
    scale: number; // 1..4
    offsetX: number; // -1..1 (fraction of canvas)
    offsetY: number;
    rotation: number; // degrees, -180..180
    blurKind: "gaussian" | "lens" | "motion";
    blurRadius: number; // 0..80
    motionAngle: number; // degrees, direction of motion blur
  };
}

export interface EditorState {
  aspect: Aspect;
  mode: Mode;
  /** Which slot user last interacted with (for paste routing) */
  pasteTarget: "foreground" | "foreground2" | "background";

  foreground: ForegroundLayer;
  fgStyle: ForegroundStyle;

  foreground2: ForegroundLayer;
  splitRatio: number; // 0.3..0.7
  splitGap: number; // 0..80 px

  background: BackgroundState;

  // setters
  setAspect: (a: Aspect) => void;
  setMode: (m: Mode) => void;
  setPasteTarget: (t: EditorState["pasteTarget"]) => void;

  setForeground: (slot: "foreground" | "foreground2", patch: Partial<ForegroundLayer>) => void;
  clearForeground: (slot: "foreground" | "foreground2") => void;

  setFgStyle: (patch: Partial<ForegroundStyle>) => void;
  setShadow: (patch: Partial<ForegroundStyle["shadow"]>) => void;

  setSplitRatio: (n: number) => void;
  setSplitGap: (n: number) => void;

  setBgKind: (k: BgKind) => void;
  setBgColor: (c: string) => void;
  setBgGradient: (p: Partial<BackgroundState["gradient"]>) => void;
  setBgImage: (p: Partial<BackgroundState["image"]>) => void;
  reset: () => void;
}

const initialFg: ForegroundLayer = {
  src: null,
  kind: null,
  naturalWidth: 0,
  naturalHeight: 0,
  duration: 0,
  objectUrl: null,
};

const initialFgStyle: ForegroundStyle = {
  size: 0.8,
  offsetX: 0,
  offsetY: 0,
  radius: 24,
  shadow: {
    enabled: true,
    blur: 60,
    opacity: 0.3,
    offsetY: 24,
    color: "#000000",
  },
};

const initialBg: BackgroundState = {
  kind: "gradient",
  color: "#1a1a1f",
  gradient: { from: "#7c5cff", to: "#1a1a1f", angle: 135 },
  image: {
    src: null,
    objectUrl: null,
    naturalWidth: 0,
    naturalHeight: 0,
    scale: 1.2,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    blurKind: "gaussian",
    blurRadius: 40,
    motionAngle: 0,
  },
};

export const useEditor = create<EditorState>((set, get) => ({
  aspect: "9:16",
  mode: "single",
  pasteTarget: "foreground",
  foreground: { ...initialFg },
  fgStyle: { ...initialFgStyle, shadow: { ...initialFgStyle.shadow } },
  foreground2: { ...initialFg },
  splitRatio: 0.5,
  splitGap: 16,
  background: {
    ...initialBg,
    gradient: { ...initialBg.gradient },
    image: { ...initialBg.image },
  },

  setAspect: (a) => set({ aspect: a }),
  setMode: (m) => set({ mode: m }),
  setPasteTarget: (t) => set({ pasteTarget: t }),

  setForeground: (slot, patch) => {
    const prev = get()[slot];
    if (prev.objectUrl && patch.objectUrl && patch.objectUrl !== prev.objectUrl) {
      URL.revokeObjectURL(prev.objectUrl);
    }
    set({ [slot]: { ...prev, ...patch } } as Partial<EditorState>);
  },
  clearForeground: (slot) => {
    const prev = get()[slot];
    if (prev.objectUrl) URL.revokeObjectURL(prev.objectUrl);
    set({ [slot]: { ...initialFg } } as Partial<EditorState>);
  },

  setFgStyle: (patch) => set({ fgStyle: { ...get().fgStyle, ...patch } }),
  setShadow: (patch) =>
    set({ fgStyle: { ...get().fgStyle, shadow: { ...get().fgStyle.shadow, ...patch } } }),

  setSplitRatio: (n) => set({ splitRatio: n }),
  setSplitGap: (n) => set({ splitGap: n }),

  setBgKind: (k) => set({ background: { ...get().background, kind: k } }),
  setBgColor: (c) => set({ background: { ...get().background, color: c } }),
  setBgGradient: (p) =>
    set({ background: { ...get().background, gradient: { ...get().background.gradient, ...p } } }),
  setBgImage: (p) => {
    const prev = get().background.image;
    if (prev.objectUrl && p.objectUrl && p.objectUrl !== prev.objectUrl) {
      URL.revokeObjectURL(prev.objectUrl);
    }
    set({ background: { ...get().background, image: { ...prev, ...p } } });
  },

  reset: () =>
    set({
      aspect: "9:16",
      mode: "single",
      foreground: { ...initialFg },
      foreground2: { ...initialFg },
      fgStyle: { ...initialFgStyle, shadow: { ...initialFgStyle.shadow } },
      background: {
        ...initialBg,
        gradient: { ...initialBg.gradient },
        image: { ...initialBg.image },
      },
      splitRatio: 0.5,
      splitGap: 16,
    }),
}));

export function outputDimensions(aspect: Aspect): { w: number; h: number } {
  return aspect === "16:9" ? { w: 1920, h: 1080 } : { w: 1080, h: 1920 };
}
