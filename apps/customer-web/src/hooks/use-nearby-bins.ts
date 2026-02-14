"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface NearbyBin {
  id: string;
  address: string;
  fill_level: number;
  waste_type: string;
  status: string;
  lat: number;
  lng: number;
  distance_meters: number;
}

interface UseNearbyBinsOptions {
  latitude: number | null;
  longitude: number | null;
  wasteType?: string | null;
  maxDistance?: number; // meters
  limit?: number;
}

export function useNearbyBins({
  latitude,
  longitude,
  wasteType,
  maxDistance = 5000,
  limit = 20,
}: UseNearbyBinsOptions) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["nearby-bins", latitude, longitude, wasteType, maxDistance],
    enabled: !!latitude && !!longitude && !!supabase,
    queryFn: async (): Promise<NearbyBin[]> => {
      if (!supabase || !latitude || !longitude) return [];

      // Use PostGIS ST_Distance to find bins within range, ordered by distance
      const { data, error } = await supabase.rpc("get_nearby_bins", {
        user_lat: latitude,
        user_lng: longitude,
        max_distance: maxDistance,
        result_limit: limit,
      });

      if (error) {
        // If the RPC doesn't exist, fall back to fetching all bins
        console.warn("RPC not available, falling back to basic query:", error);
        return fallbackQuery(supabase, latitude, longitude, wasteType, limit);
      }

      let results: NearbyBin[] = data ?? [];
      
      // Filter by waste type if specified
      if (wasteType && wasteType !== "all") {
        results = results.filter((bin) => bin.waste_type === wasteType);
      }

      return results;
    },
  });
}

async function fallbackQuery(
  supabase: ReturnType<typeof createClient>,
  latitude: number,
  longitude: number,
  wasteType: string | null | undefined,
  limit: number
): Promise<NearbyBin[]> {
  if (!supabase) return [];

  let query = supabase
    .from("bins")
    .select("id, address, fill_level, waste_type, status, location")
    .eq("status", "active");

  if (wasteType && wasteType !== "all") {
    query = query.eq("waste_type", wasteType);
  }

  const { data, error } = await query.limit(limit);

  if (error) throw error;

  interface BinRow {
    id: string;
    address: string;
    fill_level: number;
    waste_type: string;
    status: string;
    location: { coordinates: [number, number] } | null;
  }

  // Calculate distance client-side (fallback)
  return ((data || []) as BinRow[])
    .map((bin) => {
      const location = bin.location;
      const binLat = location?.coordinates[1] || 0;
      const binLng = location?.coordinates[0] || 0;
      const distance = calculateDistance(latitude, longitude, binLat, binLng);
      return {
        id: bin.id,
        address: bin.address,
        fill_level: bin.fill_level,
        waste_type: bin.waste_type,
        status: bin.status,
        lat: binLat,
        lng: binLng,
        distance_meters: distance,
      };
    })
    .sort((a, b) => a.distance_meters - b.distance_meters)
    .slice(0, limit);
}

// Haversine formula for distance calculation
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
