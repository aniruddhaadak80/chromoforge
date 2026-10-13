"use client";

import { pluginRegistry } from "@repo/core";
import type { PartContribution } from "@repo/core";

/**
 * The built-in plugin: a small "xenobiologist's toolkit" that contributes two
 * gene parts and one briefing annotation. It exists to prove the extension
 * point is real — copy this file to write your own plugin (see
 * packages/core/src/plugins/registry.ts).
 */

let registered = false;

export function registerBuiltinPlugin(): void {
  if (registered) return;
  registered = true;

  pluginRegistry.register<PartContribution[]>({
    id: "xeno-toolkit",
    kind: "part",
    title: "Xenobiologist's toolkit",
    description: "Contributes two experimental cassettes to the shelf.",
    activate: () => [
      {
        id: "orfBiofilm",
        name: "csgA curli subunit",
        kind: "orf",
        sequence: "ATGAGCGAACGATTTAGCGCAGTTAGCGCGCTCGCGCAACTGAT",
        description:
          "Functional amyloid fibre — surface adhesion taken to its conclusion. Watch-list material.",
        family: "ecology",
        upkeep: 5,
        effects: [{ axis: "sporeFormation", weight: 0.06 }],
      },
      {
        id: "pSoxS",
        name: "soxS stress promoter",
        kind: "promoter",
        sequence: "AATTGTGAGCGGATAACAATTTCACACAGGAAACAGCTATGACCATG",
        description: "Fires only under oxidative stress; spends nothing until the world pushes back.",
        family: "inducible",
        upkeep: 3,
      },
    ],
  });
}

/** Mount once, high in the tree. Idempotent. */
export function PluginRegistrar() {
  registerBuiltinPlugin();
  return null;
}
