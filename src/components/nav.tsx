"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dna } from "lucide-react";
import { cn } from "@/lib/cn";
import { CommandPalette } from "@/components/command-palette";

const LINKS: { href: string; label: string }[] = [
  { href: "/dashboard", label: "Foundry" },
  { href: "/composer", label: "Composer" },
  { href: "/crispr", label: "Guides" },
  { href: "/vault", label: "Vault" },
  { href: "/atlas", label: "Atlas" },
  { href: "/release", label: "Release" },
  { href: "/theater", label: "Sim" },
  { href: "/phylo", label: "Lineage" },
  { href: "/safety", label: "Safety" },
  { href: "/crew", label: "Crew" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-hull bg-abyss/85 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-1 gap-y-1 px-4 py-3" aria-label="Primary">
        <Link href="/" className="mr-4 flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <Dna className="h-6 w-6 text-bio" aria-hidden />
          <span>
            chromo<span className="text-bio">forge</span>
          </span>
        </Link>
        {LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm transition-colors",
                active
                  ? "bg-bio/15 text-bio"
                  : "text-muted hover:bg-surface-2 hover:text-star",
              )}
            >
              {link.label}
            </Link>
          );
        })}
        <CommandPalette />
        <Link
          href="/about"
          className="ml-auto rounded-full border border-hull px-3 py-1.5 text-sm text-muted hover:border-bio/50 hover:text-star"
        >
          The science
        </Link>
      </nav>
    </header>
  );
}
