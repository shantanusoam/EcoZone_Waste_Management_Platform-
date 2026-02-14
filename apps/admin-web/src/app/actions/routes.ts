"use server";

import { requireRole } from "@ecozone/auth";
import { createClient } from "@/lib/supabase/server";
import { generateOptimalRoute, type BinForRouting } from "@/lib/route-generation";
import type { PostGISPoint } from "@ecozone/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createRouteSchema = z.object({
  driver_id: z.string().uuid(),
  scheduled_date: z.string(),
  bin_ids: z.array(z.string().uuid()).min(1),
});

export async function getDrivers() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "driver")
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getBinsNeedingPickup(threshold: number = 60) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("bins")
    .select("id, address, fill_level, waste_type, location")
    .eq("status", "active")
    .gte("fill_level", threshold)
    .order("fill_level", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((bin) => {
    const location = bin.location;
    const loc = bin.location as { coordinates: [number, number] } | null;
    return {
      ...bin,
      lat: loc?.coordinates[1] ?? 0,
      lng: loc?.coordinates[0] ?? 0,
    };
  });
}

export async function getRoutes() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("routes")
    .select(
      `
      id,
      driver_id,
      status,
      scheduled_date,
      created_at,
      profiles (
        full_name
      ),
      pickups (
        id,
        status
      )
    `
    )
    .order("scheduled_date", { ascending: false })
    .limit(20);

  if (error) throw error;

  type RouteRow = (typeof data)[number];
  return (data ?? []).map((route: RouteRow) => {
    const pickups = route.pickups;
    return {
      id: route.id,
      driver_id: route.driver_id,
      driver_name: route.profiles?.full_name || "Unknown",
      status: route.status,
      scheduled_date: route.scheduled_date,
      created_at: route.created_at,
      total_stops: pickups?.length || 0,
      collected_stops: pickups?.filter(p => p.status === "collected").length || 0,
    };
  });
}

export async function createRoute(formData: FormData) {
  const supabase = await createClient();
  const auth = await requireRole(supabase, "admin");
  if ("error" in auth) return { error: auth.error };

  const raw = {
    driver_id: formData.get("driver_id") as string,
    scheduled_date: formData.get("scheduled_date") as string,
    bin_ids: JSON.parse(formData.get("bin_ids") as string) as string[],
  };

  const validated = createRouteSchema.safeParse(raw);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const { driver_id, scheduled_date, bin_ids } = validated.data;

  // Fetch bins with location for route optimization
  const { data: binsData, error: binsError } = await supabase
    .from("bins")
    .select("id, location, fill_level")
    .in("id", bin_ids);

  if (binsError) {
    return { error: binsError.message };
  }

  const binsForRouting: BinForRouting[] = (binsData ?? []).map((bin) => {
    const loc = bin.location as PostGISPoint | null;
    return {
      id: bin.id,
      lat: loc?.coordinates[1] ?? 0,
      lng: loc?.coordinates[0] ?? 0,
      fill_level: bin.fill_level ?? 0,
    };
  });

  if (binsForRouting.length !== bin_ids.length) {
    return { error: "One or more bin IDs were not found" };
  }

  // Generate optimized route order using nearest-neighbor algorithm
  const optimizedStops = generateOptimalRoute(binsForRouting);

  // Create the route with stops JSONB populated
  const { data: route, error: routeError } = await supabase
    .from("routes")
    .insert({
      driver_id,
      scheduled_date,
      status: "pending",
      stops: optimizedStops,
    })
    .select()
    .single();

  if (routeError) {
    return { error: routeError.message };
  }

  // Create pickups in optimized order
  const pickups = optimizedStops.map((stop) => ({
    route_id: route.id,
    bin_id: stop.bin_id,
    driver_id,
    order_index: stop.order_index,
    status: "pending",
  }));

  const { error: pickupsError } = await supabase
    .from("pickups")
    .insert(pickups);

  if (pickupsError) {
    // Rollback the route if pickups fail
    await supabase.from("routes").delete().eq("id", route.id);
    return { error: pickupsError.message };
  }

  revalidatePath("/dashboard/routes");
  return { success: true, route_id: route.id };
}

export interface RouteStopForMap {
  bin_id: string;
  order_index: number;
  lat: number;
  lng: number;
}

export interface DriverLocationRow {
  driver_id: string;
  route_id: string;
  lat: number;
  lng: number;
  updated_at: string;
}

export async function getDriverLocations(routeId: string): Promise<DriverLocationRow[]> {
  const supabase = await createClient();
  const auth = await requireRole(supabase, "admin");
  if ("error" in auth) return [];

  const { data, error } = await supabase
    .from("driver_locations")
    .select("driver_id, route_id, lat, lng, updated_at")
    .eq("route_id", routeId);

  if (error) return [];
  return (data ?? []) as DriverLocationRow[];
}

export async function getRouteWithStops(routeId: string) {
  const supabase = await createClient();
  const auth = await requireRole(supabase, "admin");
  if ("error" in auth) return null;

  const { data, error } = await supabase
    .from("routes")
    .select("id, driver_id, status, scheduled_date, stops, profiles(full_name)")
    .eq("id", routeId)
    .single();

  if (error || !data) return null;

  const route = data as {
    id: string;
    driver_id: string;
    status: string;
    scheduled_date: string;
    stops: RouteStopForMap[] | null;
    profiles: { full_name: string | null } | null;
  };

  const driverLocations = await getDriverLocations(route.id);

  return {
    id: route.id,
    driver_name: route.profiles?.full_name ?? "Unknown",
    status: route.status,
    scheduled_date: route.scheduled_date,
    stops: (route.stops ?? []) as RouteStopForMap[],
    driver_locations: driverLocations,
  };
}

export async function deleteRoute(routeId: string) {
  const supabase = await createClient();
  const auth = await requireRole(supabase, "admin");
  if ("error" in auth) return { error: auth.error };

  // Delete pickups first (foreign key constraint)
  await supabase.from("pickups").delete().eq("route_id", routeId);

  const { error } = await supabase
    .from("routes")
    .delete()
    .eq("id", routeId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/routes");
  return { success: true };
}
