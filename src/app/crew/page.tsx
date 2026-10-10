"use client";

import { useFoundry } from "@/lib/store";
import { CrewCard, BriefingPanel } from "@/components/foundry/foundry";
import { Card } from "@/components/ui";
import { useState } from "react";
import type { Genome } from "@repo/core";

export default function CrewPage() {
  const { genome, worldId, reseed } = useFoundry();
  const [history, setHistory] = useState<string[]>([]);

  return (
    <div data-testid="crew" className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-bio">crew room</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">The crew</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Three specialists run entirely on-device — deterministic finite-state machines with
          rubrics and seeded phrasing. No API keys, no network, and they still disagree with each
          other.
        </p>
        <button
          type="button"
          onClick={() => {
            reseed();
            setHistory((h) => [`mission ${h.length + 1} seeded at ${new Date().toLocaleTimeString()}`, ...h].slice(0, 5));
          }}
          className="mt-3 rounded-full border border-hull px-4 py-2 text-sm text-star hover:border-bio/50"
        >
          Generate new mission seed
        </button>
      </div>

      <CrewCard genome={genome} worldId={worldId} />

      <Card>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">briefing history</p>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No briefings yet — run one from the Release Bay.</p>
        ) : (
          <ul className="mt-2 space-y-1 font-mono text-xs text-cyan">
            {history.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
      </Card>

      <ReviewPanel genome={genome} worldId={worldId} />
    </div>
  );
}

function ReviewPanel({ genome, worldId }: { genome: Genome; worldId: string }) {
  return (
    <Card className="space-y-2">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">standby briefing</p>
      <BriefingPanel genome={genome} worldId={worldId} />
    </Card>
  );
}
