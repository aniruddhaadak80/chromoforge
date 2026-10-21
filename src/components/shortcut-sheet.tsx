"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Search, X } from "lucide-react";

/** One row in the cheat sheet. */
export interface Shortcut {
  readonly id: string;
  /** The chord, as it is pressed. */
  readonly keys: string;
  /** What it does. */
  readonly action: string;
  /** Where it applies. */
  readonly scope: string;
}

/**
 * Every keyboard shortcut the app has.
 *
 * One list, one place. The sheet renders exactly this and nothing else, so a
 * shortcut that is added anywhere in the app is documented by adding a row
 * here — and a shortcut that is removed cannot linger in the documentation.
 */
export const SHORTCUTS: readonly Shortcut[] = [
  {
    id: "palette",
    keys: "⌘K / Ctrl+K",
    action: "Open the command palette",
    scope: "anywhere",
  },
  {
    id: "sheet",
    keys: "?",
    action: "Open this shortcut sheet",
    scope: "anywhere",
  },
  {
    id: "escape",
    keys: "Esc",
    action: "Close the palette or this sheet",
    scope: "in a dialog",
  },
  {
    id: "arrows",
    keys: "↑ / ↓",
    action: "Move through the results",
    scope: "command palette",
  },
  {
    id: "enter",
    keys: "Enter",
    action: "Open the highlighted result",
    scope: "command palette",
  },
];

/** Is the key press aimed at something the user is typing into? */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * The keyboard-shortcut cheat sheet.
 *
 * Hand-rolled on native semantics — `role="dialog"`, `aria-modal`, Escape to
 * close, a labelled search field — for the same reason the command palette is:
 * no dependency, and a screen reader can follow it.
 */
export function ShortcutSheet() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const openSheet = useCallback(() => {
    setQuery("");
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    // the trigger is still mounted, so focus can go straight back to it
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // "?" is Shift+/ on most layouts, so the character is what we test, not
      // the physical key. A modifier means the user meant something else.
      if (e.key !== "?" || e.metaKey || e.ctrlKey || e.altKey) return;
      // a "?" typed into a search box is a question mark, not a command
      if (isTyping(e.target)) return;
      e.preventDefault();
      openSheet();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSheet]);

  // focus the search field when the sheet opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Escape closes from anywhere in the sheet, not only from the search field
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SHORTCUTS;
    return SHORTCUTS.filter((s) => `${s.keys} ${s.action} ${s.scope}`.toLowerCase().includes(q));
  }, [query]);

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={openSheet}
        aria-label="Open the keyboard shortcuts"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full border border-hull px-3 py-1.5 text-sm text-muted transition-colors hover:border-bio/50 hover:text-star"
      >
        <Keyboard className="h-4 w-4" aria-hidden />
        <kbd className="rounded border border-hull px-1.5 font-mono text-[10px]">?</kbd>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-100 flex items-start justify-center bg-abyss/80 p-4 pt-24 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
          data-testid="shortcut-sheet"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-panel border border-hull bg-surface shadow-2xl">
            <div className="flex items-center gap-2 border-b border-hull px-4 py-3">
              <Search className="h-4 w-4 text-muted" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search shortcuts…"
                aria-label="Search shortcuts"
                className="w-full bg-transparent font-mono text-sm text-star placeholder:text-muted/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={close}
                aria-label="Close the shortcut sheet"
                className="rounded-full border border-hull p-1 text-muted transition-colors hover:border-bio/50 hover:text-star"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <ul
              className="max-h-72 overflow-y-auto p-2"
              data-testid="shortcut-results"
              // the list scrolls, so it has to be reachable from the keyboard:
              // a scrollable region with nothing focusable inside it cannot be
              // scrolled with a keyboard in Safari.
              tabIndex={0}
              aria-label="Keyboard shortcuts"
            >
              {results.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                >
                  <span className="min-w-0">
                    <span className="block text-sm text-star">{s.action}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-muted">
                      {s.scope}
                    </span>
                  </span>
                  <kbd className="shrink-0 rounded border border-hull px-1.5 py-0.5 font-mono text-[10px] text-star">
                    {s.keys}
                  </kbd>
                </li>
              ))}
              {results.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted">
                  Nothing matches “{query}”.
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Kept for tests and future deep links. */
export const SHORTCUT_SHEET_KEYS = SHORTCUTS;
