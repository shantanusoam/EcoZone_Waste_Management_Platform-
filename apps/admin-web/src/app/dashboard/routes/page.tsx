import { getRoutes, getDrivers, getBinsNeedingPickup } from "@/app/actions/routes";
import { RoutesList } from "@/components/routes/routes-list";
import { CreateRouteDialog } from "@/components/routes/create-route-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RoutesPage() {
  const [routes, drivers, bins] = await Promise.all([
    getRoutes(),
    getDrivers(),
    getBinsNeedingPickup(60),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Route Management</h1>
          <p className="text-muted-foreground">
            Create and manage collection routes for drivers
          </p>
        </div>
        <CreateRouteDialog drivers={drivers} bins={bins}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Route
          </Button>
        </CreateRouteDialog>
      </div>

      <div className="grid gap-4">
        <div className="bg-card rounded-lg border p-4">
          <h2 className="font-semibold mb-2">Bins Needing Pickup</h2>
          <p className="text-sm text-muted-foreground">
            {bins.length} bins are above 60% fill level
          </p>
        </div>
      </div>

      <RoutesList routes={routes} />
    </div>
  );
}
