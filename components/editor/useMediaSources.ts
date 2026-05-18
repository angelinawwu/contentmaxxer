"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Loads an HTMLImageElement for a src and tracks its natural dimensions.
 * Returns the element only after it has fully loaded.
 */
export function useImageSource(src: string | null) {
  const [el, setEl] = useState<HTMLImageElement | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    if (!src) {
      setEl(null);
      setDims({ w: 0, h: 0 });
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setEl(img);
      setDims({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => {
      setEl(null);
    };
    img.src = src;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { el, dims };
}

/**
 * Loads an HTMLVideoElement for a src. The element is hidden, looped, muted
 * during preview so it can be drawn into a canvas every frame.
 */
export function useVideoSource(src: string | null, loop = true) {
  const elRef = useRef<HTMLVideoElement | null>(null);
  const [el, setEl] = useState<HTMLVideoElement | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number; duration: number }>({
    w: 0,
    h: 0,
    duration: 0,
  });

  useEffect(() => {
    if (!src) {
      if (elRef.current) {
        elRef.current.pause();
        elRef.current.src = "";
      }
      elRef.current = null;
      setEl(null);
      setDims({ w: 0, h: 0, duration: 0 });
      return;
    }
    const v = document.createElement("video");
    v.src = src;
    v.crossOrigin = "anonymous";
    v.muted = true;
    v.loop = loop;
    v.playsInline = true;
    v.preload = "auto";
    v.onloadedmetadata = () => {
      setDims({ w: v.videoWidth, h: v.videoHeight, duration: v.duration });
    };
    v.oncanplay = () => {
      setEl(v);
      v.play().catch(() => undefined);
    };
    elRef.current = v;
    return () => {
      v.pause();
      v.removeAttribute("src");
      v.load();
      v.onloadedmetadata = null;
      v.oncanplay = null;
    };
  }, [src, loop]);

  return { el, dims };
}
