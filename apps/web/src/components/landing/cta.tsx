import { ArrowRight, Orbit } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function Cta() {
  return (
    <Card tone="raised" className="space-y-5 p-8 text-center sm:p-12">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-bio">
        The foundry is open
      </p>
      <h2 className="font-display text-3xl font-bold tracking-tight text-star sm:text-4xl">
        Build something that survives 40 light years away.
      </h2>
      <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        Open the composer, pick a target world from the vault, and run the release. Every
        design stays in your browser — there is no account, no upload and no network call.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink href="/dashboard" size="lg">
          Open the foundry
          <ArrowRight className="h-4 w-4" aria-hidden />
        </ButtonLink>
        <ButtonLink href="/vault" size="lg" variant="secondary">
          <Orbit className="h-4 w-4" aria-hidden />
          Browse the vault
        </ButtonLink>
      </div>
    </Card>
  );
}
