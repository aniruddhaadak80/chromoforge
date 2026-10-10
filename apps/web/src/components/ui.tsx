import type { HTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/** Reusable UI primitives — shadcn-flavoured, hand-rolled for zero deps. */

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-panel border border-hull bg-surface/80 p-5 backdrop-blur-sm transition-colors",
        className,
      )}
      {...props}
    />
  );
}

export function Section({ title, kicker, children, action }: {
  title: string;
  kicker?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          {kicker ? (
            <p className="font-mono text-xs uppercase tracking-widest text-bio">{kicker}</p>
          ) : null}
          <h2 className="font-display text-2xl font-bold">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Badge({ className, tone = "neutral", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "bio" | "cyan" | "amber" | "danger" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-xs uppercase tracking-wide",
        tone === "neutral" && "border-hull text-muted",
        tone === "bio" && "border-bio/40 bg-bio/10 text-bio",
        tone === "cyan" && "border-cyan/40 bg-cyan/10 text-cyan",
        tone === "amber" && "border-amber/40 bg-amber/10 text-amber",
        tone === "danger" && "border-danger/40 bg-danger/10 text-danger",
        className,
      )}
      {...props}
    />
  );
}

export function ButtonLink({ href, variant = "primary", className, children }: {
  href: string;
  variant?: "primary" | "ghost";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
        variant === "primary" && "bg-bio text-abyss hover:bg-bio/85",
        variant === "ghost" && "border border-hull text-star hover:border-bio/50 hover:bg-surface-2",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-panel border border-hull bg-surface/60 p-4">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-star">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

/** Horizontal fill bar used for traits and scores. */
export function Meter({ value, tone = "bio", label }: { value: number; tone?: "bio" | "cyan" | "amber" | "danger"; label?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const fill =
    tone === "bio" ? "bg-bio" : tone === "cyan" ? "bg-cyan" : tone === "amber" ? "bg-amber" : "bg-danger";
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
      role="meter"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "value"}
    >
      <div className={cn("h-full rounded-full", fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}
