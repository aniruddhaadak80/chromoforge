import { EXOPLANETS, deriveEnvironment } from "@repo/core";
import { jsonOk } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const starType = searchParams.get("starType");
  const regime = searchParams.get("regime");
  const q = searchParams.get("q")?.toLowerCase();

  const rows = EXOPLANETS.map((planet) => ({
    id: planet.id,
    name: planet.name,
    hostStar: planet.hostStar,
    starType: planet.starType,
    regime: deriveEnvironment(planet).regime,
    tempK: deriveEnvironment(planet).tempK,
    distanceLy: planet.distanceLy,
  })).filter((row) => {
    if (starType && row.starType !== starType) return false;
    if (regime && row.regime !== regime) return false;
    if (q && !`${row.name} ${row.hostStar}`.toLowerCase().includes(q)) return false;
    return true;
  });

  return jsonOk({ count: rows.length, planets: rows });
}
