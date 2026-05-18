"use client";
import { cn } from "@/lib/utils";

export function Section({
  title,
  right,
  children,
  className,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-3 p-4 border-b border-border last:border-b-0", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] uppercase tracking-[0.08em] text-muted font-medium">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}
