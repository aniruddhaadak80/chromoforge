import { z } from "zod";

/** Flatten a zod error into a stable, version-agnostic shape. */
export function issuesOf(err: unknown): { path: string; message: string }[] {
  if (err instanceof z.ZodError) {
    return err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
  }
  return [{ path: "", message: "invalid request" }];
}