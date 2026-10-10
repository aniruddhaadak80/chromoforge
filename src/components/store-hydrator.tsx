"use client";

import { useEffect } from "react";
import { useFoundry } from "@/lib/store";

/**
 * Rehydrates the persisted foundry state after mount. Skipping synchronous
 * hydration keeps the first client render identical to the server HTML, so
 * React never sees a hydration mismatch.
 */
export function StoreHydrator() {
  useEffect(() => {
    try {
      void useFoundry.persist.rehydrate();
    } catch {
      // private mode / storage disabled — the bench just starts fresh
    }
  }, []);
  return null;
}
