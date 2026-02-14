import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@ecozone/types";
import { z } from "zod";

// Lazily create Supabase client (service role for IoT ingestion)
function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const batchTelemetrySchema = z.object({
  readings: z.array(
    z.object({
      sensor_id: z.string().min(1),
      fill_level: z.number().int().min(0).max(100),
      battery_level: z.number().int().min(0).max(100),
    })
  ).min(1).max(100),
});

const API_KEY = process.env.TELEMETRY_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const authHeader = request.headers.get("x-api-key");
    if (API_KEY && authHeader !== API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = batchTelemetrySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { readings } = result.data;
    const sensorIds = readings.map((r) => r.sensor_id);
    const supabase = getSupabase();

    // Get all bins for the sensor IDs
    const { data: binsData, error: binsError } = await supabase
      .from("bins")
      .select("id, sensor_id, fill_level")
      .in("sensor_id", sensorIds);

    if (binsError) {
      return NextResponse.json(
        { error: "Failed to fetch bins" },
        { status: 500 }
      );
    }

    interface BinRow { id: string; sensor_id: string; fill_level: number; }
    const bins = (binsData || []) as BinRow[];
    const binMap = new Map(bins.map((b) => [b.sensor_id, b]));
    const results: { sensor_id: string; success: boolean; error?: string }[] = [];

    // Process each reading
    for (const reading of readings) {
      const bin = binMap.get(reading.sensor_id);
      
      if (!bin) {
        results.push({
          sensor_id: reading.sensor_id,
          success: false,
          error: "Bin not found",
        });
        continue;
      }

      // Insert sensor reading
      await supabase.from("sensor_readings").insert({
        bin_id: bin.id,
        fill_level: reading.fill_level,
        battery_level: reading.battery_level,
      });

      // Update bin
      const updateData: Record<string, unknown> = {
        fill_level: reading.fill_level,
        battery_level: reading.battery_level,
      };

      if (bin.fill_level > 50 && reading.fill_level < 10) {
        updateData.last_pickup = new Date().toISOString();
      }

      await supabase.from("bins").update(updateData).eq("id", bin.id);

      results.push({ sensor_id: reading.sensor_id, success: true });
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      processed: results.length,
      successful: successCount,
      failed: results.length - successCount,
      results,
    });
  } catch (error) {
    console.error("Batch telemetry error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
