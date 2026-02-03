"use client";

import dynamic from "next/dynamic";
import { useBins } from "@/hooks/use-bins";
import { useRealtimeBins } from "@/hooks/use-realtime-bins";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, AlertTriangle, Battery, TrendingUp } from "lucide-react";

// Dynamic import to avoid SSR issues with Leaflet
const BinMap = dynamic(
  () => import("@/components/map/bin-map").then((mod) => mod.BinMap),
  { ssr: false, loading: () => <div className="w-full h-[500px] bg-muted animate-pulse rounded-lg" /> }
);

export default function DashboardPage() {
  const { data: bins, isLoading, error } = useBins();
  
  // Subscribe to real-time bin updates
  useRealtimeBins();

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
        Error loading bins: {error.message}
      </div>
    );
  }

  // Calculate stats
  const totalBins = bins?.length || 0;
  const criticalBins = bins?.filter((b) => b.fill_level >= 80).length || 0;
  const lowBattery = bins?.filter((b) => b.battery_level < 30).length || 0;
  const avgFill = totalBins > 0 
    ? Math.round((bins?.reduce((sum, b) => sum + b.fill_level, 0) || 0) / totalBins)
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bins</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBins}</div>
            <p className="text-xs text-muted-foreground">Active in network</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Bins</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalBins}</div>
            <p className="text-xs text-muted-foreground">Fill level &gt; 80%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Battery</CardTitle>
            <Battery className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{lowBattery}</div>
            <p className="text-xs text-muted-foreground">Battery &lt; 30%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Fill Level</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgFill}%</div>
            <p className="text-xs text-muted-foreground">Across all bins</p>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Live Bin Map</span>
            <div className="flex items-center gap-4 text-sm font-normal">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-muted-foreground">0-50%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-muted-foreground">51-80%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-muted-foreground">81-100%</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[500px]">
            {isLoading ? (
              <div className="w-full h-full bg-muted animate-pulse rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Loading map...</span>
              </div>
            ) : (
              <BinMap bins={bins || []} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
