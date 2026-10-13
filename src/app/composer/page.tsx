"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { validateGenome, encodeGenome, decodeGenome } from "@repo/core";
import { useFoundry } from "@/lib/store";
import { PartShelf, Tray, TraitBars, VerdictBadge } from "@/components/foundry/foundry";
import { Card } from "@/components/ui";

/** Applies a `?g=` share token exactly once, when the bench opens from a link. */
function ShareLinkLoader() {
  const searchParams = useSearchParams();
  const { setSlots, rename, setChassis } = useFoundry();
  const applied = useRef(false);
  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    const token = searchParams.get("g");
    if (!token) return;
    const decoded = decodeGenome(token);
    if (decoded) {
      setSlots(decoded.slots);
      rename(decoded.name);
      setChassis(decoded.chassis);
    }
  }, [searchParams, setSlots, rename, setChassis]);
  return null;
}

export default function ComposerPage() {
  const { genome } = useFoundry();
  const validation = useMemo(() => validateGenome(genome), [genome]);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const token = encodeGenome(genome);
    const url = `${window.location.origin}/composer?g=${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard blocked (insecure context / permissions) — show the token
      // so it can be copied by hand
      window.prompt("Copy this share token:", token);
    }
  };

  return (
    <div data-testid="composer" className="space-y-6">
      <Suspense fallback={null}>
        <ShareLinkLoader />
      </Suspense>
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-bio">composer</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">Genome composer</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Stack cassettes like a bench scientist. Traits derive from part effects with saturation —
          the second copy of a gene helps less than the first, and maintenance burden taxes
          everything you add.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={share}
          data-testid="share-genome"
          className="rounded-full border border-hull px-4 py-2 text-sm text-star transition-colors hover:border-bio/50"
        >
          {copied ? "Share link copied ✓" : "Copy share link"}
        </button>
        <span className="font-mono text-xs text-muted">
          encodes this genome into a URL — anyone who opens it sees your exact design
        </span>
      </div>
      <div className="grid gap-4 lg:grid-cols-[22rem_1fr_18rem]">
        <Card className="max-h-[36rem] overflow-y-auto">
          <PartShelf />
        </Card>
        <div className="space-y-4">
          <Tray />
          {(validation.errors.length > 0 || validation.warnings.length > 0) && !validation.ok ? (
            <Card className="border-danger/40">
              <p className="font-mono text-xs uppercase tracking-widest text-danger">errors</p>
              <ul className="mt-2 space-y-1 text-sm text-danger/90">
                {validation.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </Card>
          ) : validation.warnings.length > 0 ? (
            <Card className="border-amber/40">
              <p className="font-mono text-xs uppercase tracking-widest text-amber">warnings</p>
              <ul className="mt-2 space-y-1 text-sm text-amber/90">
                {validation.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
        <div className="space-y-4">
          <TraitBars genome={genome} />
          <Card>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">policy engine</p>
            <div className="mt-2">
              <VerdictBadge genome={genome} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
