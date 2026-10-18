import { describe, expect, it } from "vitest";
import { decodeGenome, encodeGenome, genomeFromSearchParams } from "../src/genetics/codec.js";
import type { Genome } from "../src/genetics/index.js";

const genome: Genome = {
  id: "g-share",
  name: "Shared Pioneer",
  chassis: "synthetic minimal cell",
  slots: [
    { partId: "pHeat", copies: 1 },
    { partId: "orfHsp", copies: 2 },
    { partId: "tT7", copies: 1 },
  ],
};

describe("genome codec", () => {
  it("round-trips a genome exactly", () => {
    const token = encodeGenome(genome);
    const decoded = decodeGenome(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.name).toBe(genome.name);
    expect(decoded?.chassis).toBe(genome.chassis);
    expect(decoded?.slots).toEqual(genome.slots);
  });

  it("is deterministic and URL-safe", () => {
    const token = encodeGenome(genome);
    expect(token).toBe(encodeGenome(genome));
    expect(token.startsWith("cf1:")).toBe(true);
    expect(token).toMatch(/^cf1:[A-Za-z0-9_-]+$/);
    // round-trips through a URL parameter unchanged
    const sp = new URLSearchParams(`g=${token}`);
    expect(genomeFromSearchParams(sp)?.slots).toEqual(genome.slots);
  });

  it("handles unicode names", () => {
    const uni: Genome = { ...genome, name: "Ωmega Strain ✦", chassis: "lab strain" };
    expect(decodeGenome(encodeGenome(uni))?.name).toBe("Ωmega Strain ✦");
  });

  it("rejects junk, foreign tokens, and unknown parts", () => {
    expect(decodeGenome("")).toBeNull();
    expect(decodeGenome("cf1:not-base64!!")).toBeNull();
    expect(decodeGenome("cf1:" + Buffer.from("[]", "utf8").toString("base64url"))).toBeNull();
    const badParts = { n: "x", c: "y", s: [["notAPart", 1]] };
    const token = "cf1:" + Buffer.from(JSON.stringify(badParts), "utf8").toString("base64url");
    expect(decodeGenome(token)).toBeNull();
  });

  it("rejects out-of-range copy counts", () => {
    const token = "cf1:" + Buffer.from(JSON.stringify({ n: "x", c: "y", s: [["orfHsp", 99]] }), "utf8").toString("base64url");
    expect(decodeGenome(token)).toBeNull();
  });

  it("ignores an absent parameter", () => {
    expect(genomeFromSearchParams(new URLSearchParams())).toBeNull();
  });
});
