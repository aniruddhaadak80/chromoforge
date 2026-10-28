/**
 * Genome URL codec.
 *
 * A genome is small and structured, so it travels well in a URL: compact
 * JSON → UTF-8 → base64url. This lets anyone share a design as a link —
 * "here is my organism for Kepler-442 b" — and lets tests round-trip the
 * bench without touching localStorage.
 */

import type { Genome } from "./genome";
import { validateGenome } from "./genome";
import { getPart } from "./parts";

const PREFIX = "cf1:";

function toBase64Url(input: string): string {
  const b64 = Buffer.from(input, "utf8").toString("base64");
  let i = b64.length;
  while (i > 0 && b64.charCodeAt(i - 1) === 61) i--;
  return b64.slice(0, i).replace(/\+/g, "-").replace(/\//g, "_");
}

function fromBase64Url(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

/** Encode a genome to a URL-safe token. Deterministic: same genome, same token. */
export function encodeGenome(genome: Genome): string {
  const payload = {
    n: genome.name,
    c: genome.chassis,
    s: genome.slots.map((slot) => [slot.partId, slot.copies]),
  };
  return PREFIX + toBase64Url(JSON.stringify(payload));
}

/**
 * Decode a token produced by {@link encodeGenome}. Returns null for anything
 * that is not a well-formed, policy-valid genome — including parts that no
 * longer exist in the catalog.
 */
export function decodeGenome(token: string): Genome | null {
  try {
    const trimmed = token.trim();
    if (!trimmed.startsWith(PREFIX)) return null;
    const json = fromBase64Url(trimmed.slice(PREFIX.length));
    const payload = JSON.parse(json) as unknown;
    if (typeof payload !== "object" || payload === null) return null;
    const obj = payload as { n?: unknown; c?: unknown; s?: unknown };
    if (typeof obj.n !== "string" || typeof obj.c !== "string" || !Array.isArray(obj.s)) {
      return null;
    }
    const slots = obj.s.map((raw) => {
      if (!Array.isArray(raw) || raw.length < 2) throw new Error("bad slot");
      const partId = String(raw[0]);
      const copies = Number(raw[1]);
      if (!Number.isInteger(copies) || copies < 1 || copies > 3) throw new Error("bad copies");
      getPart(partId); // throws for unknown ids — a shared link must stay valid
      return { partId, copies };
    });
    const genome: Genome = { id: "shared-genome", name: obj.n.slice(0, 80), chassis: obj.c.slice(0, 80), slots };
    if (!validateGenome(genome).ok) return null;
    return genome;
  } catch {
    return null;
  }
}

/** Read a genome from a full URL's `?g=` parameter. */
export function genomeFromSearchParams(params: URLSearchParams | string): Genome | null {
  const sp = typeof params === "string" ? new URLSearchParams(params) : params;
  const token = sp.get("g");
  if (!token) return null;
  return decodeGenome(token);
}
