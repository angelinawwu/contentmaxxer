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

The app encodes natively to **MP4 (H.264 + AAC)** in the browser using **WebCodecs** and **mp4-muxer** — no server, no ffmpeg, no big wasm download. Audio is pulled from the source video's track. Runs in Chrome, Edge, Arc, and recent Safari. The video plays back at 1x during export so it takes roughly as long as the clip.

## Shortcuts

- `1` — horizontal aspect
- `2` — vertical aspect
- `E` — export

## Stack

Next.js 14 · React 18 · Tailwind · Zustand · Framer Motion · Lucide.
