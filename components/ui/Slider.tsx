"use client";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
  label?: string;
  unit?: string;
  format?: (n: number) => string;
  className?: string;
}

export function Slider({ value, min, max, step = 1, onChange, label, unit, format, className }: Props) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">{label}</span>
          <span className="text-text/80 tabular-nums">
            {format ? format(value) : `${Math.round(value * 100) / 100}${unit ?? ""}`}
          </span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}
