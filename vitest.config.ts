import { defineConfig } from "vitest/config";

/**
 * Root vitest config: the domain tests live in packages/core/test, run from
 * the repo root without needing a package manager workspace run.
 */
export default defineConfig({
  test: {
    include: ["packages/core/test/**/*.test.ts"],
    environment: "node",
  },
});
