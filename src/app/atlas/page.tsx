import type { Metadata } from "next";
import { SkyMap } from "@/components/atlas/sky-map";

export const metadata: Metadata = { title: "sky atlas" };

export default function AtlasPage() {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-bio">atlas</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
        Every known world, one sky
      </h1>
      <p className="mt-2 max-w-2xl text-muted">
        Pins sit at each planet&apos;s real right ascension and declination, projected Hammer
        equal-area — the same all-sky convention used by the real star atlases. Hover the map or the
        list to inspect a world&apos;s derived environment.
      </p>
      <div className="mt-6">
        <SkyMap />
      </div>
    </div>
  );
}
