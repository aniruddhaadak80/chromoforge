import { z } from "zod";
import { simulate, getExoplanet } from "@repo/core";
import type { GenerationPoint } from "@repo/core";
import { jsonError, jsonOk } from "@/lib/api-helpers";

const bodySchema = z.object({
  slots: z.array(z.object({ partId: z.string().min(1), copies: z.number().int().min(1).max(3) })).min(1),
  genomeName: z.string().min(1).max(80),
  chassis: z.string().min(1).max(80),
  planetId: z.string().min(1),
  generations: z.number().int().min(5).max(500),
  founders: z.number().int().min(1).max(10_000),
  mutationStdDev: z.number().min(0).max(2),
  seed: z.number().int(),
});

export async function POST(request: Request) {
  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch (err) {
    return jsonError(400, "invalid_request", "Request body failed validation.", z.treeifyError(err as z.ZodError));
  }
  let planet;
  try {
    planet = getExoplanet(parsed.planetId);
  } catch {
    return jsonError(404, "not_found", `Unknown exoplanet: ${parsed.planetId}`);
  }
  if (!planet) return jsonError(404, "not_found", `Unknown exoplanet: ${parsed.planetId}`);
  const result = simulate(
    {
      id: "api-genome",
      name: parsed.genomeName,
      chassis: parsed.chassis,
      slots: parsed.slots,
    },
    parsed.planetId,
    {
      generations: parsed.generations,
      founders: parsed.founders,
      mutationStdDev: parsed.mutationStdDev,
      seed: parsed.seed,
    },
  );
  return jsonOk({
    outcome: result.outcome,
    extinctAt: result.extinctAt,
    peakPopulation: result.peakPopulation,
    history: result.history.map((h: GenerationPoint) => ({
      generation: h.generation,
      population: h.population,
      meanFitness: h.meanFitness,
      events: h.events,
    })),
  });
}
