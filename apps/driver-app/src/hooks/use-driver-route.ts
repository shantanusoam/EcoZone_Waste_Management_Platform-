"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export interface RouteStop {
  id: string;
  bin_id: string;
  order_index: number;
  status: "pending" | "collected" | "skipped";
  collected_at: string | null;
  fill_level_at_pickup: number | null;
  photo_url: string | null;
  bin: {
    id: string;
    address: string;
    fill_level: number;
    waste_type: string;
    lat: number;
    lng: number;
  };
}

export interface DriverRoute {
  id: string;
  status: "pending" | "in_progress" | "completed";
  scheduled_date: string;
  stops: RouteStop[];
}

export function useDriverRoute() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["driver-route"],
    enabled: isSupabaseConfigured(),
    queryFn: async (): Promise<DriverRoute | null> => {
      if (!supabase) return null;
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get today's date
      const today = new Date().toISOString().split("T")[0];

      // Find active or pending route for today
      const { data: routeData, error: routeError } = await supabase
        .from("routes")
        .select("*")
        .eq("driver_id", user.id)
        .gte("scheduled_date", today)
        .in("status", ["pending", "in_progress"])
        .order("scheduled_date", { ascending: true })
        .limit(1)
        .single();

      if (routeError || !routeData) return null;
      
      const route = routeData as { id: string; status: "pending" | "in_progress" | "completed"; scheduled_date: string };

      // Get pickups with bin details
      const { data: pickupsData, error: pickupsError } = await supabase
        .from("pickups")
        .select(`
          id,
          bin_id,
          order_index,
          status,
          collected_at,
          fill_level_at_pickup,
          photo_url,
          bins (
            id,
            address,
            fill_level,
            waste_type,
            location
          )
        `)
        .eq("route_id", route.id)
        .order("order_index", { ascending: true });

      if (pickupsError) throw pickupsError;

      interface PickupRow {
        id: string;
        bin_id: string;
        order_index: number;
        status: "pending" | "collected" | "skipped";
        collected_at: string | null;
        fill_level_at_pickup: number | null;
        photo_url: string | null;
        bins: { id: string; address: string; fill_level: number; waste_type: string; location: unknown } | null;
      }

      const pickups = (pickupsData || []) as PickupRow[];

      const stops: RouteStop[] = pickups.map((p) => {
        const bin = p.bins;
        const location = bin?.location as { coordinates: [number, number] } | null;
        return {
          id: p.id,
          bin_id: p.bin_id,
          order_index: p.order_index,
          status: p.status,
          collected_at: p.collected_at,
          fill_level_at_pickup: p.fill_level_at_pickup,
          photo_url: p.photo_url ?? null,
          bin: {
            id: bin?.id || "",
            address: bin?.address || "",
            fill_level: bin?.fill_level || 0,
            waste_type: bin?.waste_type || "general",
            lat: location?.coordinates[1] || 0,
            lng: location?.coordinates[0] || 0,
          },
        };
      });

      return {
        id: route.id,
        status: route.status,
        scheduled_date: route.scheduled_date,
        stops,
      };
    },
  });
}

export function useMarkCollected() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pickupId,
      binId,
      photo,
    }: {
      pickupId: string;
      binId: string;
      photo?: File;
    }) => {
      if (!supabase) throw new Error("Supabase not configured");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload photo to storage if provided
      let photoUrl: string | null = null;
      if (photo) {
        const fileExt = photo.name.split(".").pop() || "jpg";
        const fileName = `${pickupId}-${Date.now()}.${fileExt}`;
        const filePath = `pickups/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("pickup-photos")
          .upload(filePath, photo, { upsert: false });

        if (uploadError) {
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("pickup-photos").getPublicUrl(filePath);
        photoUrl = publicUrl;
      }

      // Get current bin fill level
      const { data: binData } = await supabase
        .from("bins")
        .select("fill_level")
        .eq("id", binId)
        .single();
      const bin = binData as { fill_level: number } | null;

      // Update pickup status (including optional photo_url)
      const { error: pickupError } = await supabase
        .from("pickups")
        .update({
          status: "collected",
          collected_at: new Date().toISOString(),
          fill_level_at_pickup: bin?.fill_level || 0,
          ...(photoUrl && { photo_url: photoUrl }),
        })
        .eq("id", pickupId);

      if (pickupError) throw pickupError;

      // Reset bin fill level
      const { error: binError } = await supabase
        .from("bins")
        .update({
          fill_level: 0,
          last_pickup: new Date().toISOString(),
        })
        .eq("id", binId);

      if (binError) throw binError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-route"] });
    },
  });
}

export function useStartRoute() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routeId: string) => {
      const { error } = await supabase
        .from("routes")
        .update({ status: "in_progress" })
        .eq("id", routeId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-route"] });
    },
  });
}

export function useCompleteRoute() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routeId: string) => {
      const { error } = await supabase
        .from("routes")
        .update({ status: "completed" })
        .eq("id", routeId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-route"] });
    },
  });
}
