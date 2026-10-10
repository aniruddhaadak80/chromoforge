import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface StatProps {
  label: string;
  value: ReactNode;
  /** optional second line — unit, source or a short qualifier */
  detail?: string;
  className?: string;
}

/** Label / value pair with the foundry's mono-label, display-value rhythm. */
export function Stat({ label, value, detail, className }: StatProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="font-mono text-xs uppercase tracking-wide text-muted">{label}</span>
      <span className="font-display text-xl font-semibold leading-tight text-star">
        {value}
      </span>
      {detail === undefined ? null : (
        <span className="text-xs text-muted">{detail}</span>
      )}
    </div>
  );
}
