/**
 * Exoplanet domain types.
 *
 * Quantities follow NASA Exoplanet Archive conventions: masses in Earth
 * masses, radii in Earth radii, insolation in Earth flux units (S⊕).
 */

export type StarType = "M" | "K" | "G" | "F";

export interface Exoplanet {
  id: string;
  name: string;
  hostStar: string;
  starType: StarType;
  /** stellar effective temperature, K */
  starTempK: number;
  /** mass in Earth masses */
  massEarth: number;
  /** radius in Earth radii */
  radiusEarth: number;
  /** orbital period, days */
  periodDays: number;
  /** insolation in Earth flux units */
  insolation: number;
  /** distance, light years */
  distanceLy: number;
  /** right ascension, degrees */
  ra: number;
  /** declination, degrees */
  dec: number;
  discoveryYear: number;
  /** short factual note */
  note: string;
  /** free-text tags for filtering in the UI */
  tags: string[];
}

/** Earth units, for readability in the UI. */
export const EARTH = {
  mass: 1,
  radius: 1,
  insolation: 1,
  gravity: 1,
  tempK: 288,
} as const;
