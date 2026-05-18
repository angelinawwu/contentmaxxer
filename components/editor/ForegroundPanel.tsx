"use client";
import { Section } from "@/components/ui/Section";
import { Slider } from "@/components/ui/Slider";
import { useEditor } from "@/lib/store";
import { DropSlot } from "./DropSlot";
import { Toggle } from "@/components/ui/Toggle";

export function ForegroundPanel() {
  const {
    foreground,
    foreground2,
    fgStyle,
    mode,
    splitRatio,
    splitGap,
    pasteTarget,
    setForeground,
    clearForeground,
    setFgStyle,
    setShadow,
    setMode,
    setSplitRatio,
    setSplitGap,
    setPasteTarget,
  } = useEditor();

  const sideBySide = mode === "side-by-side";
  const canSideBySide =
    foreground.kind !== "video" && foreground2.kind !== "video";

  return (
    <>
      <Section
        title="Foreground"
        right={
          <Toggle
            value={mode}
            onChange={(m) => {
              if (m === "side-by-side" && !canSideBySide) return;
              setMode(m);
            }}
            options={[
              { value: "single", label: "Single" },
              { value: "side-by-side", label: "Side-by-side" },
            ]}
          />
        }
      >
        <div className={sideBySide ? "grid grid-cols-2 gap-2" : "grid grid-cols-1 gap-2"}>
          <DropSlot
            accept={sideBySide ? "image" : "both"}
            filled={!!foreground.src}
            thumbnail={foreground.src}
            thumbnailKind={foreground.kind}
            label={sideBySide ? "Left image" : "Image or video"}
            onFocus={() => setPasteTarget("foreground")}
            active={pasteTarget === "foreground"}
            onDrop={(r) =>
              setForeground("foreground", {
                src: r.objectUrl,
                objectUrl: r.objectUrl,
                kind: r.kind,
              })
            }
            onClear={() => clearForeground("foreground")}
          />
          {sideBySide && (
            <DropSlot
              accept="image"
              filled={!!foreground2.src}
              thumbnail={foreground2.src}
              thumbnailKind={foreground2.kind}
              label="Right image"
              onFocus={() => setPasteTarget("foreground2")}
              active={pasteTarget === "foreground2"}
              onDrop={(r) =>
                setForeground("foreground2", {
                  src: r.objectUrl,
                  objectUrl: r.objectUrl,
                  kind: r.kind,
                })
              }
              onClear={() => clearForeground("foreground2")}
            />
          )}
        </div>

        <Slider
          label="Size"
          value={fgStyle.size}
          min={0.4}
          max={0.95}
          step={0.01}
          onChange={(n) => setFgStyle({ size: n })}
          format={(n) => `${Math.round(n * 100)}%`}
        />
        <Slider
          label="Corner radius"
          value={fgStyle.radius}
          min={0}
          max={96}
          onChange={(n) => setFgStyle({ radius: n })}
          unit="px"
        />
        <div className="grid grid-cols-2 gap-3">
          <Slider
            label="Offset X"
            value={fgStyle.offsetX}
            min={-400}
            max={400}
            onChange={(n) => setFgStyle({ offsetX: n })}
            unit="px"
          />
          <Slider
            label="Offset Y"
            value={fgStyle.offsetY}
            min={-400}
            max={400}
            onChange={(n) => setFgStyle({ offsetY: n })}
            unit="px"
          />
        </div>

        {sideBySide && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Slider
              label="Split"
              value={splitRatio}
              min={0.3}
              max={0.7}
              step={0.01}
              onChange={setSplitRatio}
              format={(n) => `${Math.round(n * 100)}/${100 - Math.round(n * 100)}`}
            />
            <Slider label="Gap" value={splitGap} min={0} max={80} onChange={setSplitGap} unit="px" />
          </div>
        )}
      </Section>

      <Section
        title="Shadow"
        right={
          <button
            onClick={() => setShadow({ enabled: !fgStyle.shadow.enabled })}
            className={
              "text-xs px-2 h-6 rounded-md border transition " +
              (fgStyle.shadow.enabled
                ? "bg-accent/15 border-accent/40 text-accent"
                : "bg-white/5 border-border text-muted hover:text-text")
            }
          >
            {fgStyle.shadow.enabled ? "On" : "Off"}
          </button>
        }
      >
        <Slider
          label="Blur"
          value={fgStyle.shadow.blur}
          min={0}
          max={160}
          onChange={(n) => setShadow({ blur: n })}
          unit="px"
        />
        <Slider
          label="Opacity"
          value={fgStyle.shadow.opacity}
          min={0}
          max={1}
          step={0.01}
          onChange={(n) => setShadow({ opacity: n })}
          format={(n) => `${Math.round(n * 100)}%`}
        />
        <Slider
          label="Y offset"
          value={fgStyle.shadow.offsetY}
          min={0}
          max={120}
          onChange={(n) => setShadow({ offsetY: n })}
          unit="px"
        />
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">Color</span>
          <input
            type="color"
            value={fgStyle.shadow.color}
            onChange={(e) => setShadow({ color: e.target.value })}
          />
        </div>
      </Section>
    </>
  );
}
