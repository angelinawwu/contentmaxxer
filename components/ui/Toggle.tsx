"use client";
import { cn } from "@/lib/utils";

interface Option<T extends string> {
  value: T;
  label: React.ReactNode;
}

interface Props<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  className?: string;
}

export function Toggle<T extends string>({ value, options, onChange, className }: Props<T>) {
  return (
    <div className={cn("inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-white/5 border border-border", className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-2.5 h-7 inline-flex items-center justify-center gap-1.5 rounded-md text-xs font-medium transition",
              active ? "bg-white text-bg" : "text-text/70 hover:text-text hover:bg-white/5",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
