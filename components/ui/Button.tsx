"use client";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "ghost" | "subtle";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "subtle", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium px-3 h-9 transition select-none",
        variant === "primary" &&
          "bg-accent text-white hover:bg-accent/90 active:scale-[0.98]",
        variant === "ghost" && "text-text/80 hover:bg-white/5",
        variant === "subtle" &&
          "bg-white/5 text-text hover:bg-white/10 active:scale-[0.98]",
        className,
      )}
      {...rest}
    />
  );
});
