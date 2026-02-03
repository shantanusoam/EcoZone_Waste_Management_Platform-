"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@ecozone/types";

export type Bin = Tables<"bins"> & {
  lat: number;
  lng: number;
};

export function useBins() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["bins"],
    queryFn: async (): Promise<Bin[]> => {
      const { data, error } = await supabase
        .from("bins")
        .select("*")
        .order("fill_level", { ascending: false });

      if (error) throw error;

      // Parse PostGIS geography to lat/lng
      return (data || []).map((bin) => {
        // PostGIS returns POINT in format: { type: 'Point', coordinates: [lng, lat] }
        const location = bin.location as { type: string; coordinates: [number, number] } | null;
        return {
          ...bin,
          lat: location?.coordinates[1] ?? 0,
          lng: location?.coordinates[0] ?? 0,
        };
      });
    },
  });
}

export function useBin(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["bins", id],
    queryFn: async (): Promise<Bin | null> => {
      const { data, error } = await supabase
        .from("bins")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!data) return null;

      const location = data.location as { type: string; coordinates: [number, number] } | null;
      return {
        ...data,
        lat: location?.coordinates[1] ?? 0,
        lng: location?.coordinates[0] ?? 0,
      };
    },
    enabled: !!id,
  });
}
