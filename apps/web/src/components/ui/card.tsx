import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardTone = "default" | "raised" | "interactive";

const TONE_CLASSES: Record<CardTone, string> = {
  default: "border-hull bg-surface",
  raised: "border-hull bg-surface-2",
  interactive:
    "border-hull bg-surface transition-colors hover:border-bio/50 hover:bg-surface-2",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
}

/**
 * The base panel of the design system: rounded-panel, hull border, surface
 * fill. `className` is meant for layout (spacing, grid placement), not for
 * re-skinning — use `tone` for that.
 */
export function Card({ tone = "default", className, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-panel border p-5", TONE_CLASSES[tone], className)}
      {...props}
    />
  );
}

export interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

/** Optional heading used inside a card, kept as its own component for rhythm. */
export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn("font-display text-lg font-semibold text-star", className)}>
      {children}
    </h3>
  );
}
