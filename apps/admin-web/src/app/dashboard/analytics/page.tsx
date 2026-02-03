import { createClient } from "@/lib/supabase/server";
import { AnalyticsCharts } from "@/components/analytics/analytics-charts";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // Fetch analytics data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pickups } = await (supabase as any)
    .from("pickups")
    .select("fill_level_at_pickup")
    .not("fill_level_at_pickup", "is", null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bins } = await (supabase as any)
    .from("bins")
    .select("fill_level, status");

  // Calculate average fill at pickup
  const avgFillAtPickup =
    (pickups || []).length > 0
      ? Math.round(
          ((pickups as any[]).reduce((sum, p) => sum + (p.fill_level_at_pickup || 0), 0) /
            (pickups as any[]).length) as number
        )
      : 0;

  // Group bins by status
  const binsByStatus = (bins || []).reduce(
    (acc: Record<string, number>, bin: any) => {
      const status = bin.status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Fill level distribution
  const fillLevels = (bins || []).map((b: any) => b.fill_level || 0);
  const fillDistribution = {
    empty: fillLevels.filter((f: number) => f < 33).length,
    medium: fillLevels.filter((f: number) => f >= 33 && f < 66).length,
    full: fillLevels.filter((f: number) => f >= 66).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Monitor collection efficiency and bin status metrics
        </p>
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
          <div className="text-3xl font-bold">{bins?.length || 0}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Active waste bins in system
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="text-sm text-muted-foreground mb-1">
            Collections Made
          </div>
          <div className="text-3xl font-bold">{pickups?.length || 0}</div>
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
          pickups
            ? (pickups as any[]).map((p, i) => ({
                id: String(i),
                fill: p.fill_level_at_pickup || 0,
              }))
            : []
        }
      />
    </div>
  );
}
