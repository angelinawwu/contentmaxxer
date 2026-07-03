"use client";
import { Section } from "@/components/ui/Section";
import { Slider } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";
import { useEditor } from "@/lib/store";
import { DropSlot } from "./DropSlot";

const GRADIENT_PRESETS: [string, string][] = [
  ["#7c5cff", "#1a1a1f"],
  ["#ff7e5f", "#feb47b"],
  ["#3b82f6", "#0f172a"],
  ["#10b981", "#022c22"],
  ["#ec4899", "#1e1b4b"],
  ["#f59e0b", "#1c1917"],
  ["#0ea5e9", "#020617"],
  ["#a3a3a3", "#0a0a0a"],
];

export function BackgroundPanel() {
  const {
    background,
    pasteTarget,
    setBgKind,
    setBgColor,
    setBgGradient,
    setBgImage,
    setPasteTarget,
  } = useEditor();

  return (
    <Section
      title="Background"
      right={
        <Toggle
          value={background.kind}
          onChange={setBgKind}
          options={[
            { value: "color", label: "Color" },
            { value: "gradient", label: "Gradient" },
            { value: "image", label: "Image" },
          ]}
        />
      }
    >
      {background.kind === "color" && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">Color</span>
          <input
            type="color"
            value={background.color}
            onChange={(e) => setBgColor(e.target.value)}
          />
        </div>
      )}

      {background.kind === "gradient" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">From</span>
              <input
                type="color"
                value={background.gradient.from}
                onChange={(e) => setBgGradient({ from: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">To</span>
              <input
                type="color"
                value={background.gradient.to}
                onChange={(e) => setBgGradient({ to: e.target.value })}
              />
            </div>
          </div>
          <Slider
            label="Angle"
            min={0}
            max={360}
            value={background.gradient.angle}
            onChange={(n) => setBgGradient({ angle: n })}
            unit="°"
          />
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {GRADIENT_PRESETS.map(([from, to]) => (
              <button
                key={from + to}
                onClick={() => setBgGradient({ from, to })}
                className="aspect-square rounded-md border border-border hover:border-white/40 transition"
                style={{
                  background: `linear-gradient(135deg, ${from}, ${to})`,
                }}
              />
            ))}
          </div>
        </>
      )}

      {background.kind === "image" && (
        <>
          <DropSlot
            accept="image"
            filled={!!background.image.src}
            thumbnail={background.image.src}
            thumbnailKind="image"
            label="Background image"
            hint="Drop, click, or paste"
            onFocus={() => setPasteTarget("background")}
            active={pasteTarget === "background"}
            onDrop={(r) =>
              setBgImage({
                src: r.objectUrl,
                objectUrl: r.objectUrl,
              })
            }
            onClear={() =>
              setBgImage({
                src: null,
                objectUrl: null,
                naturalWidth: 0,
                naturalHeight: 0,
              })
            }
          />
          <Slider
            label="Scale"
            min={0.5}
            max={4}
            step={0.01}
            value={background.image.scale}
            onChange={(n) => setBgImage({ scale: n })}
            format={(n) => `${Math.round(n * 100)}%`}
          />
          <div className="grid grid-cols-2 gap-3">
            <Slider
              label="Position X"
              min={-0.5}
              max={0.5}
              step={0.01}
              value={background.image.offsetX}
              onChange={(n) => setBgImage({ offsetX: n })}
              format={(n) => `${Math.round(n * 100)}%`}
            />
            <Slider
              label="Position Y"
              min={-0.5}
              max={0.5}
              step={0.01}
              value={background.image.offsetY}
              onChange={(n) => setBgImage({ offsetY: n })}
              format={(n) => `${Math.round(n * 100)}%`}
            />
          </div>
          <Slider
            label="Rotation"
            min={-180}
            max={180}
            value={background.image.rotation}
            onChange={(n) => setBgImage({ rotation: n })}
            unit="°"
          />
          <Toggle
            value={background.image.blurKind}
            onChange={(v) => setBgImage({ blurKind: v })}
            options={[
              { value: "gaussian", label: "Gaussian" },
              { value: "lens", label: "Lens" },
              { value: "motion", label: "Motion" },
            ]}
          />
          <Slider
            label="Blur"
            min={0}
            max={80}
            value={background.image.blurRadius}
            onChange={(n) => setBgImage({ blurRadius: n })}
            unit="px"
          />
          {background.image.blurKind === "motion" && (
            <Slider
              label="Motion angle"
              min={-180}
              max={180}
              value={background.image.motionAngle}
              onChange={(n) => setBgImage({ motionAngle: n })}
              unit="°"
            />
          )}
          <Slider
            label="Brightness"
            min={0}
            max={2}
            step={0.01}
            value={background.image.brightness}
            onChange={(n) => setBgImage({ brightness: n })}
            format={(n) => `${Math.round(n * 100)}%`}
          />
          <Slider
            label="Contrast"
            min={0}
            max={2}
            step={0.01}
            value={background.image.contrast}
            onChange={(n) => setBgImage({ contrast: n })}
            format={(n) => `${Math.round(n * 100)}%`}
          />
          <Slider
            label="Saturation"
            min={0}
            max={2}
            step={0.01}
            value={background.image.saturation}
            onChange={(n) => setBgImage({ saturation: n })}
            format={(n) => `${Math.round(n * 100)}%`}
          />
          <Slider
            label="Hue"
            min={-180}
            max={180}
            value={background.image.hue}
            onChange={(n) => setBgImage({ hue: n })}
            unit="°"
          />
        </>
      )}
    </Section>
  );
}
