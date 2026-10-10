import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Standalone output: a self-contained server bundle for Docker/Fly/Render.
     Vercel ignores this and uses its own builder output. */
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
