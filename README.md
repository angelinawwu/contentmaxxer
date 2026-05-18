# Contentmaxxer

A local Next.js app for framing screen recordings, design shots, and prototype videos for Instagram. Built for fast, opinionated batch styling.

## Features

- Drop, click, or **paste** (Cmd+V) images/videos into a foreground slot
- Auto rounded corners, customizable size, shadow, and offset
- Backgrounds: solid color, gradient (with presets), or an image with **Gaussian / lens blur**, scale, position, and darken
- Side-by-side mode for two images
- Aspect: **1080 × 1920** (vertical) or **1920 × 1080** (horizontal)
- Client-side export — PNG for stills, WebM (with audio) for videos via `MediaRecorder`

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Notes on video export

The app composites your video into a canvas every frame and records via `canvas.captureStream()` + `MediaRecorder`. Output is **WebM** (VP9/Opus). Instagram's mobile app re-encodes WebM on upload; for the cleanest result, drop the file into the Photos app on macOS and AirDrop to your phone, or convert to MP4 locally:

```bash
ffmpeg -i contentmaxxer-*.webm -c:v libx264 -pix_fmt yuv420p -c:a aac out.mp4
```

## Shortcuts

- `1` — horizontal aspect
- `2` — vertical aspect
- `E` — export

## Stack

Next.js 14 · React 18 · Tailwind · Zustand · Framer Motion · Lucide.
