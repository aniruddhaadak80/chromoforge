"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";
import { BASE_CLASSES, SIZE_CLASSES, VARIANT_CLASSES } from "@/components/ui/button";

/** How long the "copied" state stays up before the button goes back to normal. */
const CONFIRM_MS = 1800;

/**
 * A small button that copies one value to the clipboard.
 *
 * It wears the same classes as every other button in the app — the ghost
 * variant, at icon size — so a row of eight of them next to a parameter list
 * reads as one family rather than as eight different controls.
 *
 * The confirmation is not a colour change alone: the button keeps a stable
 * accessible name, and a polite live region says what was copied, so a screen
 * reader hears the result rather than a button that changed shape.
 */
export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  /** What the value is — used in the accessible name and the announcement. */
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), CONFIRM_MS);
    } catch {
      // The clipboard is blocked in an insecure context or without permission.
      // Nothing is copied, so nothing is claimed: the button simply stays put.
      setCopied(false);
    }
  };

  return (
    <span className="inline-flex items-center">
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label} to clipboard`}
        title={`Copy ${label} to clipboard`}
        data-copied={copied ? "true" : "false"}
        className={cn(
          BASE_CLASSES,
          VARIANT_CLASSES.ghost,
          SIZE_CLASSES.sm,
          "h-6 w-6 shrink-0 px-0 py-0",
          className,
        )}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-bio" aria-hidden />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden />
        )}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? `Copied ${label}.` : ""}
      </span>
    </span>
  );
}
