"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDriverRoute, useMarkCollected, useStartRoute, useCompleteRoute } from "@/hooks/use-driver-route";
import { useDriverLocation } from "@/hooks/use-driver-location";
import { Button } from "@ecozone/ui";
import { MarkCollectedDialog } from "@/components/mark-collected-dialog";
import { getFillLevelColor } from "@ecozone/types";
import {
  Truck,
  Navigation,
  CheckCircle2,
  Circle,
  LogOut,
  Play,
  Flag,
  Loader2,
} from "lucide-react";

type PendingCollect = { pickupId: string; binId: string } | null;

export default function DriverPage() {
  const router = useRouter();
  const supabase = createClient();
  const { data: route, isLoading, error } = useDriverRoute();
  const markCollected = useMarkCollected();
  const startRoute = useStartRoute();
  const completeRoute = useCompleteRoute();
  const [collectingId, setCollectingId] = useState<string | null>(null);
  const [pendingCollect, setPendingCollect] = useState<PendingCollect>(null);

  useDriverLocation(route?.id, route?.status === "in_progress");

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/login");
  };

  const handleNavigate = (lat: number, lng: number) => {
    // Open Google Maps with directions
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, "_blank");
  };

  const handleCollectClick = (pickupId: string, binId: string) => {
    setPendingCollect({ pickupId, binId });
  };

  const handleConfirmCollected = async (photo?: File) => {
    if (!pendingCollect) return;
    setCollectingId(pendingCollect.pickupId);
    try {
      await markCollected.mutateAsync({
        pickupId: pendingCollect.pickupId,
        binId: pendingCollect.binId,
        photo,
      });
      setPendingCollect(null);
    } finally {
      setCollectingId(null);
    }
  };

  const handleStartRoute = () => {
    if (route) {
      startRoute.mutate(route.id);
    }
  };

  const handleCompleteRoute = () => {
    if (route) {
      completeRoute.mutate(route.id);
    }
  };

  const pendingStops = route?.stops.filter((s) => s.status === "pending") || [];
  const collectedStops = route?.stops.filter((s) => s.status === "collected") || [];
  const progress = route ? Math.round((collectedStops.length / route.stops.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground px-4 py-3 safe-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6" />
            <span className="font-semibold">EcoZone Driver</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-primary-foreground hover:bg-primary/80">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            Error loading route
          </div>
        ) : !route ? (
          <div className="text-center py-16">
            <Truck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">No Route Assigned</h2>
            <p className="text-muted-foreground mt-2">
              Check back later for your next collection route
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Route Status Card */}
            <div className="bg-card rounded-xl p-4 border shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-semibold">Today&apos;s Route</h2>
                  <p className="text-sm text-muted-foreground">
                    {new Date(route.scheduled_date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{progress}%</div>
                  <p className="text-xs text-muted-foreground">
                    {collectedStops.length}/{route.stops.length} stops
                  </p>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex gap-2">
                {route.status === "pending" && (
                  <Button onClick={handleStartRoute} className="flex-1" disabled={startRoute.isPending}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Route
                  </Button>
                )}
                {route.status === "in_progress" && pendingStops.length === 0 && (
                  <Button onClick={handleCompleteRoute} className="flex-1" disabled={completeRoute.isPending}>
                    <Flag className="h-4 w-4 mr-2" />
                    Complete Route
                  </Button>
                )}
              </div>
            </div>

            {/* Stops List */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground px-1">
                {pendingStops.length > 0 ? "PENDING STOPS" : "ALL STOPS COLLECTED"}
              </h3>
              
              {route.stops.map((stop) => {
                const fillColor = getFillLevelColor(stop.bin.fill_level);
                const isCollected = stop.status === "collected";
                const isCollecting = collectingId === stop.id;

                return (
                  <div
                    key={stop.id}
                    className={`bg-card rounded-xl p-4 border shadow-sm transition-opacity ${
                      isCollected ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Status indicator */}
                      <div className="mt-1">
                        {isCollected ? (
                          <CheckCircle2 className="h-6 w-6 text-primary" />
                        ) : (
                          <Circle className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>

                      {/* Stop details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Stop {stop.order_index + 1}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              fillColor === "green"
                                ? "bg-green-100 text-green-700"
                                : fillColor === "yellow"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {isCollected ? stop.fill_level_at_pickup : stop.bin.fill_level}%
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {stop.bin.waste_type}
                          </span>
                        </div>
                        <p className="font-medium text-sm truncate">{stop.bin.address}</p>
                        
                        {isCollected && stop.collected_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Collected at {new Date(stop.collected_at).toLocaleTimeString()}
                          </p>
                        )}
                        {isCollected && stop.photo_url && (
                          <a
                            href={stop.photo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary underline mt-1 inline-block"
                          >
                            View proof photo
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    {!isCollected && route.status === "in_progress" && (
                      <div className="flex gap-2 mt-3 ml-9">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleNavigate(stop.bin.lat, stop.bin.lng)}
                        >
                          <Navigation className="h-4 w-4 mr-1" />
                          Navigate
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleCollectClick(stop.id, stop.bin_id)}
                          disabled={isCollecting}
                        >
                          {isCollecting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Collected
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {pendingCollect && (
        <MarkCollectedDialog
          open={!!pendingCollect}
          onOpenChange={(open) => !open && setPendingCollect(null)}
          pickupId={pendingCollect.pickupId}
          binId={pendingCollect.binId}
          onConfirm={handleConfirmCollected}
          isSubmitting={markCollected.isPending}
        />
      )}
    </div>
  );
}
