"use client";
import { useEffect, useRef } from "react";
import { useEditor, outputDimensions } from "@/lib/store";
import { renderFrame, type RenderInputs } from "@/lib/render";
import { useImageSource, useVideoSource } from "./useMediaSources";

interface Props {
  className?: string;
  /** Exposes refs to parents (for export) */
  registerRefs?: (refs: {
    getInputs: () => RenderInputs;
    fgVideo: HTMLVideoElement | null;
    fg2Video: HTMLVideoElement | null;
  }) => void;
}

export function Canvas({ className, registerRefs }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useEditor();
  const { aspect, foreground, foreground2, fgStyle, mode, background, splitRatio, splitGap } = state;

  const bgImg = useImageSource(background.image.src);
  const fgImg = useImageSource(foreground.kind === "image" ? foreground.src : null);
  const fgVid = useVideoSource(foreground.kind === "video" ? foreground.src : null);
  const fg2Img = useImageSource(foreground2.kind === "image" ? foreground2.src : null);
  const fg2Vid = useVideoSource(foreground2.kind === "video" ? foreground2.src : null);

  const { w, h } = outputDimensions(aspect);

  // build a snapshot for renderFrame
  const buildInputs = (): RenderInputs => {
    const fgSource: CanvasImageSource | null =
      foreground.kind === "image" ? fgImg.el : foreground.kind === "video" ? fgVid.el : null;
    const fgNatW =
      foreground.kind === "image" ? fgImg.dims.w : foreground.kind === "video" ? fgVid.dims.w : 0;
    const fgNatH =
      foreground.kind === "image" ? fgImg.dims.h : foreground.kind === "video" ? fgVid.dims.h : 0;

    const fg2Source: CanvasImageSource | null =
      foreground2.kind === "image" ? fg2Img.el : foreground2.kind === "video" ? fg2Vid.el : null;
    const fg2NatW =
      foreground2.kind === "image" ? fg2Img.dims.w : foreground2.kind === "video" ? fg2Vid.dims.w : 0;
    const fg2NatH =
      foreground2.kind === "image" ? fg2Img.dims.h : foreground2.kind === "video" ? fg2Vid.dims.h : 0;

    return {
      width: w,
      height: h,
      bg: background,
      bgImage: bgImg.el,
      fgStyle,
      fgSource,
      fgNaturalW: fgNatW,
      fgNaturalH: fgNatH,
      mode,
      fg2Source,
      fg2NaturalW: fg2NatW,
      fg2NaturalH: fg2NatH,
      splitRatio,
      splitGap,
    };
  };

  useEffect(() => {
    registerRefs?.({
      getInputs: buildInputs,
      fgVideo: fgVid.el,
      fg2Video: fg2Vid.el,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fgVid.el, fg2Vid.el, state]);

  // render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const draw = () => {
      renderFrame(ctx, buildInputs());
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, bgImg.el, fgImg.el, fgVid.el, fg2Img.el, fg2Vid.el, state]);

  return (
    <div className={className}>
      <div
        className="relative w-full h-full flex items-center justify-center"
        style={{ containerType: "size" as any }}
      >
        <canvas
          ref={canvasRef}
          className="rounded-2xl shadow-2xl bg-black"
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            width: "auto",
            height: "auto",
            aspectRatio: `${w} / ${h}`,
          }}
        />
      </div>
    </div>
  );
}
