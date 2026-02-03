"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { getFillLevelColor } from "@ecozone/types";
import type { Bin } from "@/hooks/use-bins";
import "leaflet/dist/leaflet.css";

// Custom marker icons for different fill levels
const createMarkerIcon = (color: "green" | "yellow" | "red") => {
  const colors = {
    green: "#22c55e",
    yellow: "#eab308",
    red: "#ef4444",
  };

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${colors[color]};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ${color === 'red' ? 'animation: pulse 1.5s infinite;' : ''}
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// Component to recenter map when bins change
function MapController({ bins }: { bins: Bin[] }) {
  const map = useMap();

  useEffect(() => {
    if (bins.length > 0) {
      const bounds = L.latLngBounds(bins.map((bin) => [bin.lat, bin.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bins, map]);

  return null;
}

interface BinMapProps {
  bins: Bin[];
  onBinClick?: (bin: Bin) => void;
}

export function BinMap({ bins, onBinClick }: BinMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-muted animate-pulse rounded-lg flex items-center justify-center">
        <span className="text-muted-foreground">Loading map...</span>
      </div>
    );
  }

  // Default center (San Francisco)
  const defaultCenter: [number, number] = [37.7749, -122.4194];
  const center = bins.length > 0 ? [bins[0].lat, bins[0].lng] as [number, number] : defaultCenter;

  return (
    <>
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        .custom-marker {
          background: transparent;
          border: none;
        }
      `}</style>
      <MapContainer
        center={center}
        zoom={13}
        className="w-full h-full rounded-lg"
        style={{ minHeight: "400px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController bins={bins} />
        {bins.map((bin) => {
          const color = getFillLevelColor(bin.fill_level);
          return (
            <Marker
              key={bin.id}
              position={[bin.lat, bin.lng]}
              icon={createMarkerIcon(color)}
              eventHandlers={{
                click: () => onBinClick?.(bin),
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-sm">{bin.address}</h3>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fill Level:</span>
                      <span className="font-medium" style={{ color: color === "green" ? "#22c55e" : color === "yellow" ? "#eab308" : "#ef4444" }}>
                        {bin.fill_level}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Battery:</span>
                      <span className="font-medium">{bin.battery_level}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="capitalize">{bin.waste_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="capitalize">{bin.status.replace("_", " ")}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </>
  );
}
