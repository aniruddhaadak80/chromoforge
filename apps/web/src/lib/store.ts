"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Genome, GenomeSlot } from "@repo/core";
import { EXOPLANETS } from "@repo/core";

export interface SavedStrain {
  id: string;
  genome: Genome;
  createdAt: number;
}

interface FoundryState {
  /** the organism currently on the bench */
  genome: Genome;
  /** currently targeted world */
  worldId: string;
  /** released strains history */
  strains: SavedStrain[];
  /** mission seed — changing it re-rolls agents and simulation */
  seed: string;
  setSlots: (slots: GenomeSlot[]) => void;
  addSlot: (slot: GenomeSlot) => void;
  removeSlot: (partId: string) => void;
  setCopies: (partId: string, copies: number) => void;
  rename: (name: string) => void;
  setChassis: (chassis: string) => void;
  setWorld: (worldId: string) => void;
  commitStrain: (id: string) => void;
  reseed: () => void;
}

const STARTER_SLOTS: GenomeSlot[] = [
  { partId: "pLac", copies: 1 },
  { partId: "orfHsp", copies: 1 },
  { partId: "orfPsbA", copies: 1 },
  { partId: "tT1", copies: 1 },
];

export const useFoundry = create<FoundryState>()(
  persist(
    (set) => ({
      genome: {
        id: "genome-starter",
        name: "Pioneer Strain α",
        chassis: "synthetic minimal cell",
        slots: STARTER_SLOTS,
      },
      worldId: EXOPLANETS[0]?.id ?? "trappist-1e",
      strains: [],
      seed: "foundry-1",
      setSlots: (slots) =>
        set((s) => ({ genome: { ...s.genome, slots } })),
      addSlot: (slot) =>
        set((s) =>
          s.genome.slots.some((x) => x.partId === slot.partId)
            ? {}
            : { genome: { ...s.genome, slots: [...s.genome.slots, slot] } },
        ),
      removeSlot: (partId) =>
        set((s) => ({
          genome: { ...s.genome, slots: s.genome.slots.filter((x) => x.partId !== partId) },
        })),
      setCopies: (partId, copies) =>
        set((s) => ({
          genome: {
            ...s.genome,
            slots: s.genome.slots.map((x) => (x.partId === partId ? { ...x, copies } : x)),
          },
        })),
      rename: (name) => set((s) => ({ genome: { ...s.genome, name } })),
      setChassis: (chassis) => set((s) => ({ genome: { ...s.genome, chassis } })),
      setWorld: (worldId) => set({ worldId }),
      commitStrain: (id) =>
        set((s) => ({
          strains: [{ id, genome: s.genome, createdAt: Date.now() }, ...s.strains].slice(0, 12),
        })),
      reseed: () => set((s) => ({ seed: `${s.seed}-${Math.floor(Math.random() * 1e6)}` })),
    }),
    {
      name: "chromoforge-foundry",
      storage: createJSONStorage(() => localStorage),
      // Rehydrate after mount: the first client render must match the server
      // HTML, then the saved strain appears (see components/store-hydrator.tsx).
      skipHydration: true,
      partialize: (s) => ({ genome: s.genome, worldId: s.worldId, strains: s.strains, seed: s.seed }),
    },
  ),
);
