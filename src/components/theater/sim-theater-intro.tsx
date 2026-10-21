import { Card } from "@/components/ui";

/**
 * The Sim Theater's empty state.
 *
 * A server component on purpose: it is static prose about what the simulation
 * is about to do, so there is no reason for it to ship to the browser. The page
 * renders it once on the server and hands the result to the client island that
 * owns the run.
 *
 * It sits *before* the controls on purpose. An empty screen with a button and
 * no explanation is the same as no button: a reader who cannot predict what
 * "Run simulation" will do has no way to tell whether the number that comes
 * back means anything.
 */
export function SimTheaterIntro() {
  return (
    <Card data-testid="sim-theater-intro" className="border-hull/60">
      <p className="font-mono text-xs uppercase tracking-widest text-bio">nothing has run yet</p>
      <h2 className="mt-2 font-display text-lg font-bold">What the run will do</h2>

      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
        <li>
          <span className="text-star">The genome is scored, not simulated as a blob.</span> Every
          part you have placed resolves to a trait vector — thermotolerance, radioresistance,
          spore formation and the rest — and the world you have picked resolves to an environment:
          temperature, gravity, water, radiation, atmosphere.
        </li>
        <li>
          <span className="text-star">Each generation is one selection step.</span> Fitness is
          measured against that environment, and the population grows only while fitness clears
          0.25 — logistic growth, capped by a carrying capacity set by the founder count and the
          world&apos;s water.
        </li>
        <li>
          <span className="text-star">Then the traits move.</span> A little mutation noise, plus a
          selective pull toward whatever this world rewards. Nothing else happens; there is no
          hidden agent and no model call anywhere in the loop.
        </li>
        <li>
          <span className="text-star">You get three numbers back.</span>{" "}
          <span className="font-mono text-star">thriving</span> (fitness above 0.55 and the colony
          above a quarter of its carrying capacity),{" "}
          <span className="font-mono text-star">surviving</span>, or{" "}
          <span className="font-mono text-star">extinct</span> — plus a population curve, a mean
          fitness curve, and the event log of the beats that fired.
        </li>
      </ul>

      <p className="mt-4 border-t border-hull/60 pt-3 text-xs text-muted">
        The run is deterministic for its seed: the same genome, the same world and the same seed
        always replay the same history, generation for generation.
      </p>
    </Card>
  );
}
