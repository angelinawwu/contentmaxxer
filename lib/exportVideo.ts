import { renderFrame, type RenderInputs } from "./render";

export interface VideoExportOpts {
  width: number;
  height: number;
  /** Video element being captured (with audio) */
  video: HTMLVideoElement;
  /** Second optional video (side-by-side) */
  video2?: HTMLVideoElement | null;
  /** Build a RenderInputs snapshot for the current frame */
  getInputs: () => RenderInputs;
  fps?: number;
  onProgress?: (p: number) => void;
  signal?: AbortSignal;
}

/**
 * Records a frame-by-frame composition of the foreground video over the
 * styled background using MediaRecorder + canvas.captureStream().
 *
 * Returns a webm Blob. We deliberately don't transmux to mp4 here — webm
 * uploads cleanly to Instagram and skipping ffmpeg.wasm avoids the
 * cross-origin-isolation / 30MB+ wasm payload requirement.
 */
export async function recordVideo(opts: VideoExportOpts): Promise<Blob> {
  const fps = opts.fps ?? 30;
  const canvas = document.createElement("canvas");
  canvas.width = opts.width;
  canvas.height = opts.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not available");

  const stream = canvas.captureStream(fps);

  // Pull audio off the foreground video if present.
  try {
    // @ts-expect-error - captureStream is widely supported on HTMLMediaElement
    const audioStream: MediaStream | undefined = opts.video.captureStream?.();
    if (audioStream) {
      audioStream.getAudioTracks().forEach((t) => stream.addTrack(t));
    }
  } catch {
    // ignore
  }

  const mimeCandidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  const mime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? "video/webm";
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const v = opts.video;
  v.currentTime = 0;
  v.muted = false;
  await v.play().catch(() => undefined);
  if (opts.video2) {
    opts.video2.currentTime = 0;
    await opts.video2.play().catch(() => undefined);
  }
  recorder.start();

  const duration = isFinite(v.duration) && v.duration > 0 ? v.duration : 0;
  const startedAt = performance.now();

  return new Promise<Blob>((resolve, reject) => {
    let raf = 0;
    const stop = (err?: Error) => {
      cancelAnimationFrame(raf);
      try {
        recorder.stop();
      } catch {}
      v.pause();
      if (opts.video2) opts.video2.pause();
      if (err) reject(err);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mime });
      resolve(blob);
    };

    if (opts.signal) {
      opts.signal.addEventListener("abort", () => stop(new Error("Cancelled")));
    }

    const tick = () => {
      const inputs = opts.getInputs();
      renderFrame(ctx, inputs);
      const elapsed = (performance.now() - startedAt) / 1000;
      const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 0;
      opts.onProgress?.(progress);

      const ended = v.ended || (duration > 0 && elapsed >= duration);
      if (ended) {
        // Render one final frame, then stop after a tick to flush.
        setTimeout(() => stop(), 60);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  });
}
