import type { BackgroundState, ForegroundStyle, Mode } from "./store";

export interface RenderInputs {
  width: number;
  height: number;
  bg: BackgroundState;
  bgImage?: HTMLImageElement | null;
  fgStyle: ForegroundStyle;
  fgSource: CanvasImageSource | null;
  fgNaturalW: number;
  fgNaturalH: number;
  // side-by-side
  mode: Mode;
  fg2Source?: CanvasImageSource | null;
  fg2NaturalW?: number;
  fg2NaturalH?: number;
  splitRatio?: number;
  splitGap?: number;
}

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bg: BackgroundState,
  bgImage?: HTMLImageElement | null,
) {
  ctx.save();
  if (bg.kind === "color") {
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, w, h);
  } else if (bg.kind === "gradient") {
    const angle = (bg.gradient.angle * Math.PI) / 180;
    const cx = w / 2;
    const cy = h / 2;
    const diag = Math.sqrt(w * w + h * h) / 2;
    const dx = Math.cos(angle) * diag;
    const dy = Math.sin(angle) * diag;
    const grad = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
    grad.addColorStop(0, bg.gradient.from);
    grad.addColorStop(1, bg.gradient.to);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (bg.kind === "image" && bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
    // Fill canvas via "cover" baseline, then apply user scale.
    const imgRatio = bgImage.naturalWidth / bgImage.naturalHeight;
    const canvasRatio = w / h;
    let baseW: number;
    let baseH: number;
    if (imgRatio > canvasRatio) {
      baseH = h;
      baseW = h * imgRatio;
    } else {
      baseW = w;
      baseH = w / imgRatio;
    }
    const rot = ((bg.image.rotation ?? 0) * Math.PI) / 180;
    // When rotated, enlarge so the rotated image still covers the canvas.
    // For a w×h canvas, the worst-case cover factor at angle θ is
    // (|w·cosθ| + |h·sinθ|) / w and similarly for height; we take the max.
    const absC = Math.abs(Math.cos(rot));
    const absS = Math.abs(Math.sin(rot));
    const coverFactor = Math.max(
      (w * absC + h * absS) / w,
      (w * absS + h * absC) / h,
    );
    const scale = bg.image.scale * coverFactor;
    const drawW = baseW * scale;
    const drawH = baseH * scale;
    const cx = w / 2 + bg.image.offsetX * w;
    const cy = h / 2 + bg.image.offsetY * h;

    const blurPx = bg.image.blurRadius;
    const adjustFilter = [
      bg.image.brightness !== 1 ? `brightness(${bg.image.brightness})` : "",
      bg.image.contrast !== 1 ? `contrast(${bg.image.contrast})` : "",
      bg.image.saturation !== 1 ? `saturate(${bg.image.saturation})` : "",
      bg.image.hue !== 0 ? `hue-rotate(${bg.image.hue}deg)` : "",
    ]
      .filter(Boolean)
      .join(" ");
    ctx.translate(cx, cy);
    if (rot !== 0) ctx.rotate(rot);

    if (bg.image.blurKind === "motion" && blurPx > 0) {
      // Directional motion blur: stack offset copies along motionAngle.
      // Apply a small base blur so the streaks aren't aliased.
      const samples = 18;
      const angle = (bg.image.motionAngle * Math.PI) / 180;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const length = blurPx * 2; // total streak length in px
      const baseBlur = Math.min(blurPx * 0.15, 6);
      const blurFilter = baseBlur > 0 ? `blur(${baseBlur}px)` : "";
      ctx.filter = [blurFilter, adjustFilter].filter(Boolean).join(" ") || "none";
      ctx.globalAlpha = 1 / samples;
      for (let i = 0; i < samples; i++) {
        const t = i / (samples - 1) - 0.5; // -0.5..0.5
        const ox = dx * length * t;
        const oy = dy * length * t;
        ctx.drawImage(bgImage, -drawW / 2 + ox, -drawH / 2 + oy, drawW, drawH);
      }
      ctx.globalAlpha = 1;
      ctx.filter = "none";
    } else {
      const blurFilter =
        blurPx > 0
          ? bg.image.blurKind === "lens"
            ? `blur(${blurPx}px) saturate(1.05)`
            : `blur(${blurPx}px)`
          : "";
      ctx.filter = [blurFilter, adjustFilter].filter(Boolean).join(" ") || "none";
      ctx.drawImage(bgImage, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.filter = "none";
    }
  } else {
    // fallback
    ctx.fillStyle = "#1a1a1f";
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

export function computeFgRect(
  canvasW: number,
  canvasH: number,
  naturalW: number,
  naturalH: number,
  size: number,
  offsetX: number,
  offsetY: number,
  maxW?: number,
  maxH?: number,
): { x: number; y: number; w: number; h: number } {
  const boundW = (maxW ?? canvasW) * size;
  const boundH = (maxH ?? canvasH) * size;
  const ratio = naturalW / naturalH;
  let w: number;
  let h: number;
  if (boundW / boundH > ratio) {
    h = boundH;
    w = h * ratio;
  } else {
    w = boundW;
    h = w / ratio;
  }
  const cx = canvasW / 2 + offsetX;
  const cy = canvasH / 2 + offsetY;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

export function drawForeground(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  rect: { x: number; y: number; w: number; h: number },
  radius: number,
  shadow: ForegroundStyle["shadow"],
) {
  ctx.save();
  if (shadow.enabled) {
    // Draw shadow by stamping the rounded rect first with shadow only.
    ctx.save();
    ctx.shadowColor = hexWithAlpha(shadow.color, shadow.opacity);
    ctx.shadowBlur = shadow.blur;
    ctx.shadowOffsetY = shadow.offsetY;
    ctx.fillStyle = "#000";
    drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, radius);
    ctx.fill();
    ctx.restore();
  }
  drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, radius);
  ctx.clip();
  ctx.drawImage(source, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function hexWithAlpha(hex: string, alpha: number): string {
  // accept #rgb or #rrggbb
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function renderFrame(ctx: CanvasRenderingContext2D, input: RenderInputs) {
  const { width: W, height: H } = input;
  ctx.clearRect(0, 0, W, H);
  drawBackground(ctx, W, H, input.bg, input.bgImage);

  if (input.mode === "side-by-side" && input.fg2Source && input.fgSource) {
    const gap = input.splitGap ?? 16;
    const ratio = input.splitRatio ?? 0.5;
    // Both slots share the global size as fraction of canvas, splitting the available width.
    const totalW = W * input.fgStyle.size;
    const totalH = H * input.fgStyle.size;
    const leftSlotW = totalW * ratio - gap / 2;
    const rightSlotW = totalW * (1 - ratio) - gap / 2;
    const leftRect = computeFgRect(
      W,
      H,
      input.fgNaturalW,
      input.fgNaturalH,
      1, // already constrained via maxW/maxH
      input.fgStyle.offsetX - (totalW / 2 - leftSlotW / 2),
      input.fgStyle.offsetY,
      leftSlotW,
      totalH,
    );
    const rightRect = computeFgRect(
      W,
      H,
      input.fg2NaturalW ?? 1,
      input.fg2NaturalH ?? 1,
      1,
      input.fgStyle.offsetX + (totalW / 2 - rightSlotW / 2),
      input.fgStyle.offsetY,
      rightSlotW,
      totalH,
    );
    drawForeground(ctx, input.fgSource, leftRect, input.fgStyle.radius, input.fgStyle.shadow);
    drawForeground(ctx, input.fg2Source, rightRect, input.fgStyle.radius, input.fgStyle.shadow);
    return;
  }

  if (input.fgSource && input.fgNaturalW > 0 && input.fgNaturalH > 0) {
    const rect = computeFgRect(
      W,
      H,
      input.fgNaturalW,
      input.fgNaturalH,
      input.fgStyle.size,
      input.fgStyle.offsetX,
      input.fgStyle.offsetY,
    );
    drawForeground(ctx, input.fgSource, rect, input.fgStyle.radius, input.fgStyle.shadow);
  }
}
