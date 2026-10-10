import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "bio" | "cyan" | "amber" | "danger" | "muted";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "border-hull bg-surface-2 text-star",
  bio: "border-bio-dim bg-bio/10 text-bio",
  cyan: "border-cyan/40 bg-cyan/10 text-cyan",
  amber: "border-amber/40 bg-amber/10 text-amber",
  danger: "border-danger/40 bg-danger/10 text-danger",
  muted: "border-hull bg-transparent text-muted",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

/** Small mono pill used for statuses, regimes, star types and metadata. */
export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wide",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}
