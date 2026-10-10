/**
 * Sky projection math for the Atlas view.
 *
 * Hammer (Hammer–Aitoff) equal-area projection — the standard for all-sky maps
 * because it shows the whole sphere with only mild edge distortion. The
 * forward map and its algebraic inverse are unit-tested for round-trip
 * fidelity in test/exoplanets.test.ts.
 */

export interface Vec2 {
  x: number;
  y: number;
}

const DEG = Math.PI / 180;

/**
 * Hammer bounds after RA normalization: poles at (0, ±1), antimeridian at
 * x = ±2. The projection outline is the ellipse x²/4 + y² = 1.
 */
export const HAMMER_BOUNDS = { xMax: 2, yMax: 1 } as const;

/** Wrap right ascension into [0, 360). */
export function normalizeRa(raDeg: number): number {
  return ((raDeg % 360) + 360) % 360;
}

/**
 * Project right ascension / declination (degrees) to Hammer coordinates.
 *
 * RA is folded into [-180, 180) before halving — sin/cos of ra/2 are not
 * 360°-periodic, so skipping this fold makes ra=0° and ra=360° land on
 * different points. With the fold, cos(ra/2) ≥ 0, the denominator never
 * dips below 1, and the map stays inside the ellipse with |y| ≤ 1.
 */
export function hammerProject(raDeg: number, decDeg: number): Vec2 {
  let ra = normalizeRa(raDeg);
  if (ra > 180) ra -= 360;
  const raRad = ra * DEG;
  const decRad = decDeg * DEG;
  const cosDec = Math.cos(decRad);
  const k = Math.sqrt(1 + cosDec * Math.cos(raRad / 2));
  return {
    x: (2 * cosDec * Math.sin(raRad / 2)) / k,
    y: Math.sin(decRad) / k,
  };
}

/**
 * Inverse Hammer projection.
 *
 * With X = 2cos(dec)sin(ra/2)/k, y = sin(dec)/k and k² = 1 + cos(dec)cos(ra/2),
 * the identity X²/4 + y² = 1 − cos(dec)cos(ra/2) separates the two angles.
 * Returns ra in [0, 360).
 */
export function hammerUnproject(x: number, y: number): { ra: number; dec: number } {
  const d = 1 - (x * x) / 4 - y * y; // = cos(dec)·cos(ra/2), in [-1, 1] on the map
  const k = Math.sqrt(Math.max(0, 1 + d));
  const sinDec = y * k;
  const dec = Math.asin(Math.max(-1, Math.min(1, sinDec))) / DEG;
  const cosDec = Math.cos(dec * DEG);
  if (cosDec < 1e-9) return { ra: 0, dec };
  const sinHalfRa = (x * k) / (2 * cosDec);
  const cosHalfRa = d / cosDec;
  const ra = 2 * Math.atan2(sinHalfRa, cosHalfRa) / DEG;
  return { ra: normalizeRa(ra), dec };
}

/** Equatorial coordinates → galactic-ish style gridlines for the atlas backdrop. */
export function skyGrid(): { meridians: Vec2[][]; parallels: Vec2[][] } {
  const meridians: Vec2[][] = [];
  const parallels: Vec2[][] = [];
  for (let ra = 0; ra < 360; ra += 30) {
    const line: Vec2[] = [];
    for (let dec = -80; dec <= 80; dec += 4) line.push(hammerProject(ra, dec));
    meridians.push(line);
  }
  for (let dec = -60; dec <= 60; dec += 30) {
    const line: Vec2[] = [];
    for (let ra = 0; ra <= 360; ra += 4) line.push(hammerProject(ra, dec));
    parallels.push(line);
  }
  return { meridians, parallels };
}
