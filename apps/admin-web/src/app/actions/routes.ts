"use server";

import { createClient } from "@/lib/supabase/server";
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
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("bins")
    .select("id, address, fill_level, waste_type, location")
    .eq("status", "active")
    .gte("fill_level", threshold)
    .order("fill_level", { ascending: false });

  if (error) throw error;
  
  interface BinRow {
    id: string;
    address: string;
    fill_level: number;
    waste_type: string;
    location: { coordinates: [number, number] } | null;
  }
  
  return ((data || []) as BinRow[]).map(bin => {
    const location = bin.location;
    return {
      ...bin,
      lat: location?.coordinates[1] || 0,
      lng: location?.coordinates[0] || 0,
    };
  });
}

export async function getRoutes() {
  const supabase = await createClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("routes")
    .select(`
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
    `)
    .order("scheduled_date", { ascending: false })
    .limit(20);

  if (error) throw error;

  interface RouteRow {
    id: string;
    driver_id: string;
    status: string;
    scheduled_date: string;
    created_at: string;
    profiles: { full_name: string | null } | null;
    pickups: { id: string; status: string }[] | null;
  }

  return ((data || []) as RouteRow[]).map(route => {
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

  // Create the route
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: route, error: routeError } = await (supabase as any)
    .from("routes")
    .insert({
      driver_id,
      scheduled_date,
      status: "pending",
    })
    .select()
    .single();

  if (routeError) {
    return { error: routeError.message };
  }

  // Create pickups for each bin
  const pickups = bin_ids.map((bin_id, index) => ({
    route_id: route.id,
    bin_id,
    driver_id,
    order_index: index,
    status: "pending",
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: pickupsError } = await (supabase as any)
    .from("pickups")
    .insert(pickups);

  if (pickupsError) {
    // Rollback the route if pickups fail
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("routes").delete().eq("id", route.id);
    return { error: pickupsError.message };
  }

  revalidatePath("/dashboard/routes");
  return { success: true, route_id: route.id };
}

export async function deleteRoute(routeId: string) {
  const supabase = await createClient();
  
  // Delete pickups first (foreign key constraint)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("pickups").delete().eq("route_id", routeId);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("routes")
    .delete()
    .eq("id", routeId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/routes");
  return { success: true };
}
