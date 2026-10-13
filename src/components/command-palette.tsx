"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

interface Command {
  id: string;
  label: string;
  hint: string;
  href: string;
}

const COMMANDS: Command[] = [
  { id: "foundry", label: "Foundry dashboard", hint: "current organism at a glance", href: "/dashboard" },
  { id: "composer", label: "Compose a genome", hint: "cassettes, traits, share link", href: "/composer" },
  { id: "crispr", label: "Design guides", hint: "SpCas9 scoring + off-targets", href: "/crispr" },
  { id: "vault", label: "Browse the vault", hint: "22 real exoplanets", href: "/vault" },
  { id: "atlas", label: "Open the sky atlas", hint: "Hammer projection", href: "/atlas" },
  { id: "release", label: "Run the release gate", hint: "crew briefing + policy", href: "/release" },
  { id: "theater", label: "Run the simulation", hint: "population + fitness charts", href: "/theater" },
  { id: "phylo", label: "Strain lineage", hint: "the evolutionary tree", href: "/phylo" },
  { id: "safety", label: "Biosafety ledger", hint: "every rule, every verdict", href: "/safety" },
  { id: "crew", label: "Crew room", hint: "three local agents", href: "/crew" },
  { id: "about", label: "The science", hint: "what is modeled, honestly", href: "/about" },
];

/**
 * Keyboard command palette. Hand-rolled on native semantics — role="dialog",
 * aria-modal, Escape to close, arrow keys to move, Enter to go — so it is
 * dependency-free and screen-reader legible.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const openPalette = useCallback(() => {
    setQuery("");
    setActive(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openPalette();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPalette]);

  // focus the field when the dialog opens (focus has no setState, so no cascade)
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((c) => `${c.label} ${c.hint}`.toLowerCase().includes(q));
  }, [query]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={openPalette}
        aria-label="Open the command palette"
        className="ml-auto inline-flex items-center gap-2 rounded-full border border-hull px-3 py-1.5 text-sm text-muted transition-colors hover:border-bio/50 hover:text-star"
      >
        <Search className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Jump to…</span>
        <kbd className="hidden rounded border border-hull px-1.5 font-mono text-[10px] sm:inline">⌘K</kbd>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-start justify-center bg-abyss/80 p-4 pt-24 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-panel border border-hull bg-surface shadow-2xl">
        <div className="flex items-center gap-2 border-b border-hull px-4 py-3">
          <Search className="h-4 w-4 text-muted" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(results.length - 1, i + 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(0, i - 1));
              }
              if (e.key === "Enter" && results[active]) go(results[active].href);
            }}
            placeholder="Where to, scientist?"
            aria-label="Search commands"
            className="w-full bg-transparent font-mono text-sm text-star placeholder:text-muted/60 focus:outline-none"
          />
        </div>
        <ul className="max-h-72 overflow-y-auto p-2" data-testid="palette-results">
          {results.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(c.href)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left",
                  i === active ? "bg-bio/15 text-star" : "text-muted",
                )}
              >
                <span className="font-display text-sm font-semibold">{c.label}</span>
                <span className="font-mono text-[10px]">{c.hint}</span>
              </button>
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
  );
}

/** Kept for tests and future deep links. */
export const PALETTE_COMMANDS = COMMANDS;
