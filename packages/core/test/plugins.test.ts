import { describe, expect, it } from "vitest";
import { PluginRegistry } from "../src/plugins/registry.js";
import type { ChromoforgePlugin } from "../src/plugins/registry.js";

function makePlugin(id: string, value: string): ChromoforgePlugin<string> {
  return {
    id,
    kind: "part",
    title: `plugin ${id}`,
    description: "test plugin",
    activate: () => value,
  };
}

const ctx = { seed: "s", genomeName: "g", worldId: "trappist-1e" };

describe("plugin registry", () => {
  it("registers, activates, and unregisters", () => {
    const registry = new PluginRegistry();
    expect(registry.size).toBe(0);
    const unregister = registry.register(makePlugin("p1", "hello"));
    expect(registry.size).toBe(1);
    expect(registry.byKind<string>("part", ctx)).toEqual(["hello"]);
    unregister();
    expect(registry.size).toBe(0);
    expect(registry.byKind<string>("part", ctx)).toEqual([]);
  });

  it("only activates plugins of the requested kind", () => {
    const registry = new PluginRegistry();
    registry.register(makePlugin("p1", "a"));
    registry.register({ ...makePlugin("p2", "b"), kind: "observer" });
    expect(registry.byKind<string>("part", ctx)).toEqual(["a"]);
    expect(registry.byKind<string>("observer", ctx)).toEqual(["b"]);
    expect(registry.byKind<string>("annotator", ctx)).toEqual([]);
  });

  it("rejects duplicate ids and malformed plugins", () => {
    const registry = new PluginRegistry();
    registry.register(makePlugin("p1", "a"));
    expect(() => registry.register(makePlugin("p1", "b"))).toThrow(/already registered/);
    expect(() =>
      registry.register({ id: "", kind: "part", title: "t", description: "d", activate: () => 1 }),
    ).toThrow(/missing required fields/);
  });

  it("survives a plugin that throws", () => {
    const registry = new PluginRegistry();
    registry.register({
      id: "boom",
      kind: "annotator",
      title: "boom",
      description: "throws",
      activate: () => {
        throw new Error("plugin exploded");
      },
    });
    registry.register({ ...makePlugin("safe", "ok"), kind: "annotator" });
    expect(registry.byKind<string>("annotator", ctx)).toEqual(["ok"]);
  });

  it("lists plugin metadata", () => {
    const registry = new PluginRegistry();
    registry.register(makePlugin("p1", "a"));
    expect(registry.list()).toEqual([
      { id: "p1", kind: "part", title: "plugin p1", description: "test plugin" },
    ]);
  });

  it("passes the context through", () => {
    const registry = new PluginRegistry();
    registry.register({
      id: "ctx",
      kind: "part",
      title: "ctx",
      description: "reads the context",
      activate: (c) => `${c.genomeName}@${c.worldId} (${c.seed})`,
    });
    expect(registry.byKind<string>("part", ctx)).toEqual(["g@trappist-1e (s)"]);
  });
});
