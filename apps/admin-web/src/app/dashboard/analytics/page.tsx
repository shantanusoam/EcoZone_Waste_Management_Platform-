import { createClient } from "@/lib/supabase/server";
import { AnalyticsCharts } from "@/components/analytics/analytics-charts";
import { AnalyticsExportButton } from "@/components/analytics/analytics-export-button";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // Fetch analytics data
  const { data: pickups } = await supabase
    .from("pickups")
    .select("fill_level_at_pickup, collected_at")
    .not("fill_level_at_pickup", "is", null);

  const { data: bins } = await supabase
    .from("bins")
    .select("fill_level, status");

  const { data: routesWithPickups } = await supabase
    .from("routes")
    .select("id, driver_id, status, profiles(full_name), pickups(status)")
    .gte("scheduled_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

  type PickupRow = { fill_level_at_pickup: number | null };
  type BinRow = { fill_level: number; status: string };

  // Calculate average fill at pickup
  const pickupsList = (pickups ?? []) as PickupRow[];
  const avgFillAtPickup =
    pickupsList.length > 0
      ? Math.round(
          pickupsList.reduce((sum, p) => sum + (p.fill_level_at_pickup || 0), 0) /
            pickupsList.length
        )
      : 0;

  // Group bins by status
  const binsList = (bins ?? []) as BinRow[];
  const binsByStatus = binsList.reduce(
    (acc: Record<string, number>, bin) => {
      const status = bin.status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Fill level distribution
  const fillLevels = binsList.map((b) => b.fill_level || 0);
  const fillDistribution = {
    empty: fillLevels.filter((f: number) => f < 33).length,
    medium: fillLevels.filter((f: number) => f >= 33 && f < 66).length,
    full: fillLevels.filter((f: number) => f >= 66).length,
  };

  // Collections over time (last 7 days)
  type PickupWithDate = PickupRow & { collected_at: string | null };
  const pickupsWithDate = (pickups ?? []) as PickupWithDate[];
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
  const collectionsByDay = last7Days.map((day) => ({
    date: day,
    count: pickupsWithDate.filter(
      (p) => p.collected_at && p.collected_at.startsWith(day)
    ).length,
    label: new Date(day).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
  }));

  // Driver performance (last 30 days)
  type RouteRow = {
    id: string;
    driver_id: string;
    status: string;
    profiles: { full_name: string | null } | null;
    pickups: { status: string }[] | null;
  };
  const routesList = (routesWithPickups ?? []) as RouteRow[];
  const driverStats = routesList.reduce(
    (acc: Record<string, { name: string; routes: number; collected: number }>, r) => {
      const name = r.profiles?.full_name ?? "Unknown";
      if (!acc[r.driver_id]) {
        acc[r.driver_id] = { name, routes: 0, collected: 0 };
      }
      acc[r.driver_id].name = name;
      acc[r.driver_id].routes += 1;
      const collected = r.pickups?.filter((p) => p.status === "collected").length ?? 0;
      acc[r.driver_id].collected += collected;
      return acc;
    },
    {}
  );
  const driverPerformanceData = Object.entries(driverStats).map(([driverId, s]) => ({
    driver: s.name,
    routes: s.routes,
    collected: s.collected,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Monitor collection efficiency and bin status metrics
          </p>
        </div>
        <AnalyticsExportButton
          summary={{
            avgFillAtPickup: avgFillAtPickup,
            totalBins: binsList.length,
            totalCollections: pickupsList.length,
          }}
          collectionsByDay={collectionsByDay}
          driverPerformance={driverPerformanceData}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border p-6">
          <div className="text-sm text-muted-foreground mb-1">
            Avg Fill at Pickup
          </div>
          <div className="text-3xl font-bold">{avgFillAtPickup}%</div>
          <p className="text-xs text-muted-foreground mt-2">
            Average fill level when bins collected
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="text-sm text-muted-foreground mb-1">
            Total Bins
          </div>
          <div className="text-3xl font-bold">{binsList.length}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Active waste bins in system
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="text-sm text-muted-foreground mb-1">
            Collections Made
          </div>
          <div className="text-3xl font-bold">{pickupsList.length}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Total pickups completed
          </p>
        </div>
      </div>

      {/* Charts */}
      <AnalyticsCharts
        binsByStatus={binsByStatus}
        fillDistribution={fillDistribution}
        pickupData={
          pickupsList.map((p, i) => ({
            id: String(i),
            fill: p.fill_level_at_pickup || 0,
          }))
        }
        collectionsByDay={collectionsByDay}
        driverPerformance={driverPerformanceData}
      />
    </div>
  );
}
