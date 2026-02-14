"use client";

import { Button } from "@ecozone/ui";
import { downloadCSV } from "@/lib/export-csv";
import { Download } from "lucide-react";

interface AnalyticsExportButtonProps {
  summary: {
    avgFillAtPickup: number;
    totalBins: number;
    totalCollections: number;
  };
  collectionsByDay: Array<{ date: string; count: number; label: string }>;
  driverPerformance: Array<{ driver: string; routes: number; collected: number }>;
}

export function AnalyticsExportButton({
  summary,
  collectionsByDay,
  driverPerformance,
}: AnalyticsExportButtonProps) {
  const handleExport = () => {
    const data = [
      { metric: "Avg Fill at Pickup %", value: summary.avgFillAtPickup },
      { metric: "Total Bins", value: summary.totalBins },
      { metric: "Total Collections", value: summary.totalCollections },
      ...collectionsByDay.map((d) => ({ metric: `Collections ${d.label}`, value: d.count })),
      ...driverPerformance.flatMap((d) => [
        { metric: `${d.driver} - Routes`, value: d.routes },
        { metric: `${d.driver} - Collected`, value: d.collected },
      ]),
    ];
    downloadCSV(data, `analytics-${new Date().toISOString().split("T")[0]}.csv`);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );
}
