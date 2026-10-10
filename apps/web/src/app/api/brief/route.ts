import { z } from "zod";
import { briefCrew } from "@repo/core";
import { jsonError, jsonOk } from "@/lib/api-helpers";

const bodySchema = z.object({
  seed: z.string().min(1).max(120),
  action: z.string().min(1).max(80),
  organism: z.string().min(1).max(80),
  world: z.string().min(1).max(80),
  fitness: z.number().min(0).max(1),
  biosafety: z.enum(["allow", "review", "block"]),
  complexity: z.number().int().min(0).max(100),
});

export async function POST(request: Request) {
  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch (err) {
    return jsonError(400, "invalid_request", "Request body failed validation.", z.treeifyError(err as z.ZodError));
  }
  const briefing = briefCrew(parsed);
  return jsonOk(briefing);
}
