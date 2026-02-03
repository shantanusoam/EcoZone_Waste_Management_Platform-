"use client";

import type { NearbyBin } from "@/hooks/use-nearby-bins";
import { Button } from "@/components/ui/button";
import { getFillLevelColor } from "@ecozone/types";
import { Navigation, AlertTriangle, Trash2, Recycle, Leaf, Skull } from "lucide-react";

interface BinListProps {
  bins: NearbyBin[];
  onNavigate: (bin: NearbyBin) => void;
  onReport: (bin: NearbyBin) => void;
}

const wasteTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  general: Trash2,
  recycling: Recycle,
  organic: Leaf,
  hazardous: Skull,
};

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function BinList({ bins, onNavigate, onReport }: BinListProps) {
  if (bins.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <Trash2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold">No Bins Found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            No waste bins found in your area. Try changing the filter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-safe">
      <div className="divide-y">
        {bins.map((bin) => {
          const fillColor = getFillLevelColor(bin.fill_level);
          const WasteIcon = wasteTypeIcons[bin.waste_type] || Trash2;

          return (
            <div key={bin.id} className="p-4 bg-card">
              <div className="flex items-start gap-3">
                {/* Waste Type Icon */}
                <div
                  className={`p-2 rounded-full ${
                    bin.waste_type === "recycling"
                      ? "bg-blue-100 text-blue-600"
                      : bin.waste_type === "organic"
                      ? "bg-green-100 text-green-600"
                      : bin.waste_type === "hazardous"
                      ? "bg-orange-100 text-orange-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <WasteIcon className="h-5 w-5" />
                </div>

                {/* Bin Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        fillColor === "green"
                          ? "bg-green-100 text-green-700"
                          : fillColor === "yellow"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {bin.fill_level}% full
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {bin.waste_type}
                    </span>
                  </div>
                  <p className="font-medium text-sm truncate">{bin.address}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistance(bin.distance_meters)} away
                  </p>
                </div>

                {/* Distance Badge */}
                <div className="text-right">
                  <span className="text-lg font-bold text-primary">
                    {formatDistance(bin.distance_meters)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-3 ml-11">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => onNavigate(bin)}
                >
                  <Navigation className="h-4 w-4 mr-1" />
                  Navigate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReport(bin)}
                >
                  <AlertTriangle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
