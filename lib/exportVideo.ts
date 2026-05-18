import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import { renderFrame, type RenderInputs } from "./render";

export interface VideoExportOpts {
  width: number;
  height: number;
  /** Foreground video element (drives the timeline and audio source) */
  video: HTMLVideoElement;
  /** Optional second video (side-by-side mode). Audio is taken from `video`. */
  video2?: HTMLVideoElement | null;
  /** Build a fresh RenderInputs snapshot per frame */
  getInputs: () => RenderInputs;
  fps?: number;
  onProgress?: (p: number) => void;
  signal?: AbortSignal;
}

// Minimal WebCodecs typing so TS doesn't complain on older lib.dom.
type Win = typeof window & {
  VideoEncoder?: any;
  AudioEncoder?: any;
  VideoFrame?: any;
  AudioData?: any;
  MediaStreamTrackProcessor?: any;
};

/**
 * Encode a composited MP4 (H.264 + AAC) directly in the browser using
 * WebCodecs and mp4-muxer. Plays the source video at 1x and captures both
 * video frames (composited via canvas) and audio (from the source track).
 */
export async function recordVideo(opts: VideoExportOpts): Promise<Blob> {
  const w = window as Win;
  if (!w.VideoEncoder || !w.VideoFrame) {
    throw new Error(
      "Your browser doesn't support WebCodecs MP4 export. Try the latest Chrome, Edge, or Arc.",
    );
  }

  const fps = opts.fps ?? 30;
  const W = opts.width;
  const H = opts.height;

  // Canvas for compositing
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas 2D not available");

  const video = opts.video;
  const video2 = opts.video2 ?? null;

  // ---------- Probe audio track (if any) ----------
  let audioTrack: MediaStreamTrack | null = null;
  let audioSampleRate = 48000;
  let audioChannels = 2;
  let hasAudio = false;

  try {
    const capture =
      (video as any).captureStream?.bind(video) ?? (video as any).mozCaptureStream?.bind(video);
    const stream: MediaStream | undefined = capture?.();
    audioTrack = stream?.getAudioTracks()?.[0] ?? null;

    if (audioTrack && w.AudioEncoder && w.MediaStreamTrackProcessor) {
      const settings = audioTrack.getSettings() as MediaTrackSettings & {
        sampleRate?: number;
        channelCount?: number;
      };
      if (settings.sampleRate) audioSampleRate = settings.sampleRate;
      if (settings.channelCount) audioChannels = settings.channelCount;
      hasAudio = true;
    }
  } catch {
    hasAudio = false;
  }

  // ---------- Set up muxer ----------
  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: "avc",
      width: W,
      height: H,
      frameRate: fps,
    },
    audio: hasAudio
      ? {
          codec: "aac",
          numberOfChannels: audioChannels,
          sampleRate: audioSampleRate,
        }
      : undefined,
    fastStart: "in-memory",
    firstTimestampBehavior: "offset",
  });

  // ---------- Video encoder ----------
  let encError: Error | null = null;
  const videoEncoder = new w.VideoEncoder({
    output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta),
    error: (e: Error) => {
      encError = e;
    },
  });
  videoEncoder.configure({
    codec: "avc1.640028", // H.264 High@L4.0
    width: W,
    height: H,
    bitrate: 10_000_000,
    framerate: fps,
    avc: { format: "avc" },
  });

  // ---------- Audio encoder ----------
  let audioEncoder: any = null;
  if (hasAudio && audioTrack && w.AudioEncoder) {
    audioEncoder = new w.AudioEncoder({
      output: (chunk: any, meta: any) => muxer.addAudioChunk(chunk, meta),
      error: (e: Error) => {
        encError = e;
      },
    });
    audioEncoder.configure({
      codec: "mp4a.40.2", // AAC-LC
      sampleRate: audioSampleRate,
      numberOfChannels: audioChannels,
      bitrate: 192_000,
    });
  }

  // ---------- Start audio reader (parallel) ----------
  let audioReaderTask: Promise<void> = Promise.resolve();
  let stopAudio = () => {};
  if (hasAudio && audioTrack && w.MediaStreamTrackProcessor && audioEncoder) {
    const processor = new w.MediaStreamTrackProcessor({ track: audioTrack });
    const reader = processor.readable.getReader();
    let cancelled = false;
    stopAudio = () => {
      cancelled = true;
      reader.cancel().catch(() => undefined);
    };
    audioReaderTask = (async () => {
      while (!cancelled) {
        const { value, done } = await reader.read();
        if (done || !value) break;
        try {
          audioEncoder.encode(value);
        } finally {
          value.close();
        }
      }
    })();
  }

  // ---------- Playback ----------
  // The preview keeps `loop=true` so videos play continuously; disable for
  // export so the source doesn't wrap mid-encode (timestamps would regress).
  const prevLoop = video.loop;
  const prevLoop2 = video2?.loop ?? false;
  video.loop = false;
  if (video2) video2.loop = false;

  video.currentTime = 0;
  video.muted = false; // we need audio to flow into captureStream
  video.volume = 0; // but don't blast it out the speakers
  await video.play();
  if (video2) {
    video2.currentTime = 0;
    video2.muted = true;
    await video2.play();
  }

  const duration = isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
  if (duration === 0) throw new Error("Source video has no duration");

  let cancelled = false;
  if (opts.signal) {
    opts.signal.addEventListener("abort", () => {
      cancelled = true;
    });
  }

  // ---------- Video frame loop ----------
  const frameDurUs = Math.round(1_000_000 / fps);
  let frameIndex = 0;
  const startedAt = performance.now();

  await new Promise<void>((resolve, reject) => {
    const tick = () => {
      if (cancelled) return reject(new Error("Cancelled"));
      if (encError) return reject(encError);

      renderFrame(ctx, opts.getInputs());

      // Use a strictly monotonic frame-index-based timestamp; video.currentTime
      // can briefly regress (loop wrap, buffering) which breaks the muxer.
      const tsUs = frameIndex * frameDurUs;
      const frame = new w.VideoFrame!(canvas, {
        timestamp: tsUs,
        duration: frameDurUs,
      });
      const keyFrame = frameIndex % (fps * 2) === 0;
      videoEncoder.encode(frame, { keyFrame });
      frame.close();
      frameIndex++;

      const elapsed = (performance.now() - startedAt) / 1000;
      const progress = Math.min(elapsed / duration, video.currentTime / duration);
      opts.onProgress?.(Math.max(0, Math.min(1, progress)));

      if (video.ended || video.currentTime >= duration - 0.01) {
        resolve();
        return;
      }
      // Throttle to target fps.
      setTimeout(() => requestAnimationFrame(tick), Math.max(0, 1000 / fps - 4));
    };
    requestAnimationFrame(tick);
  });

  opts.onProgress?.(1);

  // ---------- Finalize ----------
  stopAudio();
  await audioReaderTask.catch(() => undefined);
  await videoEncoder.flush();
  videoEncoder.close();
  if (audioEncoder) {
    try {
      await audioEncoder.flush();
      audioEncoder.close();
    } catch {
      // ignore
    }
  }

  muxer.finalize();
  const { buffer } = muxer.target as ArrayBufferTarget;
  video.pause();
  if (video2) video2.pause();
  // Restore preview-time settings
  video.loop = prevLoop;
  if (video2) video2.loop = prevLoop2;
  return new Blob([buffer], { type: "video/mp4" });
}
