import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface SectionProps {
  id?: string;
  /** small mono kicker above the title */
  eyebrow?: string;
  title: string;
  description?: string;
  /** right-aligned slot for filters, counters or links */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  "data-testid"?: string;
}

/** Page section with consistent heading rhythm across every route. */
export function Section({
  id,
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  "data-testid": dataTestId,
}: SectionProps) {
  return (
    <section
      id={id}
      data-testid={dataTestId}
      className={cn("space-y-5", className)}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          {eyebrow === undefined ? null : (
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-bio">
              {eyebrow}
            </p>
          )}
          <h2 className="font-display text-2xl font-bold tracking-tight text-star">
            {title}
          </h2>
          {description === undefined ? null : (
            <p className="max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
          )}
        </div>
        {actions === undefined ? null : actions}
      </div>
      {children}
    </section>
  );
}
