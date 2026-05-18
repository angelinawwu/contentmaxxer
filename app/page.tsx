"use client";
import { Canvas } from "@/components/editor/Canvas";
import { ForegroundPanel } from "@/components/editor/ForegroundPanel";
import { BackgroundPanel } from "@/components/editor/BackgroundPanel";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { useEditor, outputDimensions } from "@/lib/store";
import type { RenderInputs } from "@/lib/render";
import { exportPng, downloadBlob } from "@/lib/exportImage";
import { recordVideo } from "@/lib/exportVideo";
import { useEffect, useRef, useState } from "react";
import { Download, RotateCcw, Loader2, Sparkles } from "lucide-react";

export default function Page() {
  const { aspect, setAspect, reset, foreground, foreground2, mode, pasteTarget, setForeground, setBgImage } =
    useEditor();
  const inputsRef = useRef<(() => RenderInputs) | null>(null);
  const fgVideoRef = useRef<HTMLVideoElement | null>(null);
  const fg2VideoRef = useRef<HTMLVideoElement | null>(null);
  const [exporting, setExporting] = useState<null | "image" | "video">(null);
  const [progress, setProgress] = useState(0);

  // Global paste handler — routes pasted image to the active slot.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = Array.from(e.clipboardData.items);
      const item = items.find((i) => i.type.startsWith("image/") || i.type.startsWith("video/"));
      if (!item) return;
      const file = item.getAsFile();
      if (!file) return;
      e.preventDefault();
      const url = URL.createObjectURL(file);
      const kind: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";
      if (pasteTarget === "background") {
        if (kind !== "image") return;
        setBgImage({ src: url, objectUrl: url });
      } else if (pasteTarget === "foreground") {
        setForeground("foreground", { src: url, objectUrl: url, kind });
      } else if (pasteTarget === "foreground2") {
        if (kind !== "image") return;
        setForeground("foreground2", { src: url, objectUrl: url, kind });
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [pasteTarget, setBgImage, setForeground]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "1") setAspect("16:9");
      else if (e.key === "2") setAspect("9:16");
      else if (e.key.toLowerCase() === "e") void onExport();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setAspect]);

  const hasVideo = foreground.kind === "video" || foreground2.kind === "video";
  const hasContent = !!foreground.src || (mode === "side-by-side" && !!foreground2.src);

  async function onExport() {
    if (!inputsRef.current || exporting) return;
    const inputs = inputsRef.current();
    const { w, h } = outputDimensions(aspect);
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    try {
      if (hasVideo && fgVideoRef.current) {
        setExporting("video");
        setProgress(0);
        const blob = await recordVideo({
          width: w,
          height: h,
          video: fgVideoRef.current,
          video2: fg2VideoRef.current,
          getInputs: () => inputsRef.current!(),
          onProgress: (p) => setProgress(p),
        });
        downloadBlob(blob, `contentmaxxer-${ts}.mp4`);
      } else {
        setExporting("image");
        const blob = await exportPng(inputs);
        downloadBlob(blob, `contentmaxxer-${ts}.png`);
      }
    } catch (err) {
      console.error(err);
      alert("Export failed. See console for details.");
    } finally {
      setExporting(null);
      setProgress(0);
    }
  }

  return (
    <div className="h-dvh w-dvw flex flex-col bg-bg text-text">
      {/* Top bar */}
      <header className="h-12 px-4 flex items-center justify-between border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight">Contentmaxxer</span>
        </div>
        <div className="flex items-center gap-2">
          <Toggle
            value={aspect}
            onChange={setAspect}
            options={[
              { value: "9:16", label: "1080 × 1920" },
              { value: "16:9", label: "1920 × 1080" },
            ]}
          />
          <Button variant="ghost" onClick={reset} title="Reset all">
            <RotateCcw size={14} />
          </Button>
          <Button variant="primary" onClick={onExport} disabled={!hasContent || !!exporting}>
            {exporting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {exporting === "video" ? `Recording ${Math.round(progress * 100)}%` : "Exporting"}
              </>
            ) : (
              <>
                <Download size={14} />
                Export {hasVideo ? "MP4" : "PNG"}
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
        {/* Preview */}
        <main className="flex-1 min-w-0 p-6 flex items-center justify-center overflow-hidden">
          <Canvas
            className="w-full h-full"
            registerRefs={(r) => {
              inputsRef.current = r.getInputs;
              fgVideoRef.current = r.fgVideo;
              fg2VideoRef.current = r.fg2Video;
            }}
          />
        </main>

        {/* Controls */}
        <aside className="w-[340px] shrink-0 h-full overflow-y-auto bg-panel border-l border-border">
          <ForegroundPanel />
          <BackgroundPanel />
          <div className="p-4 text-[11px] text-muted leading-relaxed">
            <p>
              <span className="text-text/80 font-medium">Tip:</span> click a drop slot to make it
              the paste target, then Cmd+V to drop in clipboard images. Press <kbd className="px-1 py-0.5 rounded bg-white/5 border border-border text-[10px]">1</kbd> /{" "}
              <kbd className="px-1 py-0.5 rounded bg-white/5 border border-border text-[10px]">2</kbd>{" "}
              to switch aspect, <kbd className="px-1 py-0.5 rounded bg-white/5 border border-border text-[10px]">E</kbd>{" "}
              to export.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
