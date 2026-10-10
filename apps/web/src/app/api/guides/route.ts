import { z } from "zod";
import { designGuides } from "@repo/core";
import { jsonError, jsonOk } from "@/lib/api-helpers";

const bodySchema = z.object({
  slots: z.array(z.object({ partId: z.string().min(1), copies: z.number().int().min(1).max(3) })).min(1),
  genomeName: z.string().min(1).max(80),
  chassis: z.string().min(1).max(80),
  targetPartId: z.string().min(1),
  count: z.number().int().min(1).max(10).optional(),
});

export async function POST(request: Request) {
  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch (err) {
    return jsonError(400, "invalid_request", "Request body failed validation.", z.treeifyError(err as z.ZodError));
  }
  const genome = {
    id: "api-genome",
    name: parsed.genomeName,
    chassis: parsed.chassis,
    slots: parsed.slots,
  };
  const guides = designGuides(genome, parsed.targetPartId, parsed.count ?? 5);
  return jsonOk({ targetPartId: parsed.targetPartId, guides });
}
