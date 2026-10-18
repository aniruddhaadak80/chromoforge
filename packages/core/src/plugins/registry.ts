/**
 * The plugin API.
 *
 * chromoforge is a bench for arguing about life, so it should be *forkable in
 * place*: a plugin can add a gene part, propose a world, annotate a briefing,
 * or react to a committed release — without touching the app.
 *
 * A plugin is a plain object with a stable `id`, a `kind`, and a handler.
 * `registerPlugin` validates it and returns an unsubscribe function. The
 * built-in example lives in src/plugins/example-annotator.ts and is wired in
 * from the composer page — copy that file to write your own.
 */

export type PluginKind =
  | "part" // contribute gene parts to the shelf
  | "world" // contribute worlds to the vault
  | "annotator" // annotate a crew briefing
  | "observer"; // react to a committed release

export interface PluginContext {
  /** mission seed, for anything that needs reproducible variation */
  seed: string;
  /** the organism currently on the bench */
  genomeName: string;
  /** world the bench is targeting */
  worldId: string;
}

export interface PartContribution {
  id: string;
  name: string;
  kind: "promoter" | "orf" | "terminator" | "regulatory";
  sequence: string;
  description: string;
  family: string;
  upkeep: number;
  effects?: { axis: string; weight: number }[];
}

export interface ChromoforgePlugin<T = unknown> {
  id: string;
  kind: PluginKind;
  title: string;
  description: string;
  /** pure: same context in, same contribution out */
  activate: (ctx: PluginContext) => T;
}

export class PluginRegistry {
  private plugins = new Map<string, ChromoforgePlugin<never>>();

  register<T>(plugin: ChromoforgePlugin<T>): () => void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`plugin id already registered: ${plugin.id}`);
    }
    // structural validation — cheap and catches the common mistakes
    if (!plugin.id || !plugin.title || typeof plugin.activate !== "function") {
      throw new Error(`plugin ${plugin.id} is missing required fields`);
    }
    this.plugins.set(plugin.id, plugin as unknown as ChromoforgePlugin<never>);
    return () => this.plugins.delete(plugin.id);
  }

  byKind<T>(kind: PluginKind, ctx: PluginContext): T[] {
    const out: T[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.kind !== kind) continue;
      try {
        out.push(plugin.activate(ctx) as T);
      } catch {
        // a broken plugin must never take the bench down
      }
    }
    return out;
  }

  list(): { id: string; kind: PluginKind; title: string; description: string }[] {
    return [...this.plugins.values()].map((p) => ({
      id: p.id,
      kind: p.kind,
      title: p.title,
      description: p.description,
    }));
  }

  get size(): number {
    return this.plugins.size;
  }
}

/** Process-wide registry; plugins register once at module scope. */
export const pluginRegistry = new PluginRegistry();
