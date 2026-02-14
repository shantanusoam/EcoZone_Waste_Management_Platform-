import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@ecozone/types";
import { z } from "zod";

const bodySchema = z.object({
  route_id: z.string().uuid(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { route_id, lat, lng } = parsed.data;

    // Verify driver is assigned to this route
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .select("driver_id")
      .eq("id", route_id)
      .single();

    if (routeError || !route || route.driver_id !== user.id) {
      return NextResponse.json(
        { error: "Not assigned to this route" },
        { status: 403 }
      );
    }

    const { error: upsertError } = await supabase
      .from("driver_locations")
      .upsert(
        {
          driver_id: user.id,
          route_id,
          lat,
          lng,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "driver_id,route_id" }
      );

    if (upsertError) {
      console.error("Driver location upsert error:", upsertError);
      return NextResponse.json(
        { error: "Failed to update location" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Driver location API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
