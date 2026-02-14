import type { Database } from "@ecozone/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const PREDICTION_TARGET_FILL = 90;
const MIN_READINGS = 3;
const MAX_READINGS = 24; // Use last 24 readings for trend
const MIN_RATE_PER_HOUR = 0.5; // Ignore very slow rates (noise)

/**
 * Compute predicted time when bin will reach 90% fill based on recent sensor_readings.
 * Uses linear extrapolation: average fill rate (% per hour) from recent readings,
 * then time to 90% = (90 - currentFill) / ratePerHour.
 * Returns ISO string or null if prediction not possible.
 */
export async function computePredictedFull(
  supabase: SupabaseClient<Database>,
  binId: string,
  currentFill: number
): Promise<string | null> {
  if (currentFill >= PREDICTION_TARGET_FILL) {
    return null;
  }

  const { data: readings, error } = await supabase
    .from("sensor_readings")
    .select("fill_level, timestamp")
    .eq("bin_id", binId)
    .order("timestamp", { ascending: false })
    .limit(MAX_READINGS);

  if (error || !readings || readings.length < MIN_READINGS) {
    return null;
  }

  // Reverse to chronological order (oldest first)
  const ordered = [...readings].reverse() as { fill_level: number; timestamp: string }[];
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  const timeSpanMs = new Date(last.timestamp).getTime() - new Date(first.timestamp).getTime();
  const timeSpanHours = timeSpanMs / (1000 * 60 * 60);

  if (timeSpanHours < 0.01) {
    return null; // Too little time span
  }

  const fillDelta = last.fill_level - first.fill_level;
  const ratePerHour = fillDelta / timeSpanHours;

  if (ratePerHour < MIN_RATE_PER_HOUR) {
    return null; // Fill rate too low or decreasing
  }

  const percentToGo = PREDICTION_TARGET_FILL - currentFill;
  const hoursToFull = percentToGo / ratePerHour;
  const predicted = new Date(Date.now() + hoursToFull * 60 * 60 * 1000);
  return predicted.toISOString();
}
