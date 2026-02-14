"use client";

import Link from "next/link";
import { useBins } from "@/hooks/use-bins";
import { useRealtimeBins } from "@/hooks/use-realtime-bins";
import { AlertTriangle, BatteryWarning } from "lucide-react";
import { Button } from "@ecozone/ui";

const CRITICAL_FILL_THRESHOLD = 90;
const LOW_BATTERY_THRESHOLD = 20;

/**
 * Banner showing real-time alerts for bins over 90% full or with low battery.
 * Subscribes to bins realtime; when data updates, shows count and link to map.
 */
export function BinAlertsBanner() {
  const { data: bins = [], isLoading } = useBins();
  useRealtimeBins(); // Keep subscription active so banner updates live

  const criticalFill = bins.filter((b) => b.fill_level >= CRITICAL_FILL_THRESHOLD);
  const lowBattery = bins.filter((b) => b.battery_level < LOW_BATTERY_THRESHOLD);

  if (isLoading || (criticalFill.length === 0 && lowBattery.length === 0)) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm">
      {criticalFill.length > 0 && (
        <span className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <strong>{criticalFill.length}</strong> bin{criticalFill.length !== 1 ? "s" : ""} over {CRITICAL_FILL_THRESHOLD}% full
        </span>
      )}
      {lowBattery.length > 0 && (
        <span className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <BatteryWarning className="h-4 w-4 shrink-0" />
          <strong>{lowBattery.length}</strong> bin{lowBattery.length !== 1 ? "s" : ""} low battery (&lt;{LOW_BATTERY_THRESHOLD}%)
        </span>
      )}
      <Link href="/dashboard" className="ml-auto">
        <Button variant="outline" size="sm">
          View map
        </Button>
      </Link>
    </div>
  );
}
