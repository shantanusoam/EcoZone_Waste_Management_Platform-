import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@ecozone/types";

// Use service role client to bypass RLS for sensor data ingestion
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const telemetrySchema = z.object({
  sensor_id: z.string().min(1),
  fill_level: z.number().int().min(0).max(100),
  battery_level: z.number().int().min(0).max(100),
});

const API_KEY = process.env.TELEMETRY_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const authHeader = request.headers.get("x-api-key");
    if (API_KEY && authHeader !== API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const result = telemetrySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { sensor_id, fill_level, battery_level } = result.data;

    // Find bin by sensor_id
    const { data: bin, error: binError } = await supabase
      .from("bins")
      .select("id, fill_level")
      .eq("sensor_id", sensor_id)
      .single();

    if (binError || !bin) {
      return NextResponse.json(
        { error: "Bin not found for sensor_id", sensor_id },
        { status: 404 }
      );
    }

    // Insert sensor reading
    const { error: readingError } = await supabase
      .from("sensor_readings")
      .insert({
        bin_id: bin.id,
        fill_level,
        battery_level,
      });

    if (readingError) {
      console.error("Failed to insert sensor reading:", readingError);
      return NextResponse.json(
        { error: "Failed to record sensor reading" },
        { status: 500 }
      );
    }

    // Update bin with latest values
    const updateData: Record<string, unknown> = {
      fill_level,
      battery_level,
    };

    // If fill level dropped significantly (collected), update last_pickup
    if (bin.fill_level > 50 && fill_level < 10) {
      updateData.last_pickup = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("bins")
      .update(updateData)
      .eq("id", bin.id);

    if (updateError) {
      console.error("Failed to update bin:", updateError);
      return NextResponse.json(
        { error: "Failed to update bin" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bin_id: bin.id,
      fill_level,
      battery_level,
    });
  } catch (error) {
    console.error("Telemetry error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "telemetry" });
}
