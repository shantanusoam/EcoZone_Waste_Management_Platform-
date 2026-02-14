"use client";

import { useEffect, useState } from "react";
import { getRouteWithStops } from "@/app/actions/routes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RouteMap } from "@/components/map/route-map";
import { Loader2 } from "lucide-react";

interface ViewRouteMapDialogProps {
  routeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewRouteMapDialog({
  routeId,
  open,
  onOpenChange,
}: ViewRouteMapDialogProps) {
  const [route, setRoute] = useState<Awaited<ReturnType<typeof getRouteWithStops>>>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !routeId) {
      setRoute(null);
      return;
    }
    setLoading(true);
    getRouteWithStops(routeId)
      .then(setRoute)
      .finally(() => setLoading(false));
  }, [open, routeId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Route on map</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-[400px] -mx-6 -mb-6">
          {loading ? (
            <div className="flex items-center justify-center h-[400px] bg-muted/30 rounded-b-lg">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : route && route.stops.length > 0 ? (
            <RouteMap
              stops={route.stops}
              driverName={route.driver_name}
              scheduledDate={route.scheduled_date}
              driverLocations={route.driver_locations}
            />
          ) : route ? (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              No stops on this route
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
