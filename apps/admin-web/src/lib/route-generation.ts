/**
 * Route generation utilities using greedy nearest-neighbor algorithm
 */

export interface BinForRouting {
  id: string;
  lat: number;
  lng: number;
  fill_level: number;
}

export interface RouteStop {
  bin_id: string;
  order_index: number;
  lat: number;
  lng: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Generate optimal route using greedy nearest-neighbor algorithm
 * Starts from depot (0,0) and always visits the nearest unvisited bin
 */
export function generateOptimalRoute(
  bins: BinForRouting[],
  depotLat: number = 0,
  depotLng: number = 0
): RouteStop[] {
  if (bins.length === 0) return [];

  const unvisited = new Set(bins.map((b) => b.id));
  const route: RouteStop[] = [];
  let currentLat = depotLat;
  let currentLng = depotLng;
  let orderIndex = 0;

  while (unvisited.size > 0) {
    // Find nearest unvisited bin
    let nearestId: string | null = null;
    let minDistance = Infinity;

    for (const binId of unvisited) {
      const bin = bins.find((b) => b.id === binId);
      if (!bin) continue;

      const distance = calculateDistance(currentLat, currentLng, bin.lat, bin.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestId = binId;
      }
    }

    if (nearestId === null) break;

    // Add to route
    const bin = bins.find((b) => b.id === nearestId);
    if (bin) {
      route.push({
        bin_id: bin.id,
        order_index: orderIndex++,
        lat: bin.lat,
        lng: bin.lng,
      });

      currentLat = bin.lat;
      currentLng = bin.lng;
      unvisited.delete(nearestId);
    }
  }

  return route;
}

/**
 * Select bins that exceed fill threshold and generate route
 */
export function generateRouteForHighFillBins(
  bins: BinForRouting[],
  fillThreshold: number = 80,
  depotLat: number = 0,
  depotLng: number = 0
): RouteStop[] {
  const highFillBins = bins.filter((bin) => bin.fill_level >= fillThreshold);
  return generateOptimalRoute(highFillBins, depotLat, depotLng);
}
