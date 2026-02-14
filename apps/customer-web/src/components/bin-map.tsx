"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import type { NearbyBin } from "@/hooks/use-nearby-bins";
import { Button } from "@ecozone/ui";
import { getFillLevelColor } from "@ecozone/types";
import { Navigation } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface BinMapProps {
  bins: NearbyBin[];
  userLocation: { lat: number; lng: number } | null;
  onBinClick?: (bin: NearbyBin) => void;
}

// Custom marker icons based on fill level
function createBinIcon(fillLevel: number) {
  const color = getFillLevelColor(fillLevel);
  const colorHex = color === "green" ? "#22c55e" : color === "yellow" ? "#eab308" : "#ef4444";

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${colorHex};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 11px;
      ">${fillLevel}%</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// User location icon
const userIcon = L.divIcon({
  className: "user-marker",
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: #3b82f6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.2);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Component to handle map center updates
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);

  return null;
}

export function BinMap({ bins, userLocation, onBinClick }: BinMapProps) {
  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [40.7128, -74.006]; // Default to NYC

  const handleNavigate = (bin: NearbyBin) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${bin.lat},${bin.lng}&travelmode=walking`;
    window.open(url, "_blank");
  };

  return (
    <MapContainer
      center={center}
      zoom={15}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {userLocation && (
        <>
          <MapController center={[userLocation.lat, userLocation.lng]} />
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="text-center">
                <strong>You are here</strong>
              </div>
            </Popup>
          </Marker>
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={100}
            pathOptions={{
              color: "#3b82f6",
              fillColor: "#3b82f6",
              fillOpacity: 0.1,
              weight: 1,
            }}
          />
        </>
      )}

      {bins.map((bin) => (
        <Marker
          key={bin.id}
          position={[bin.lat, bin.lng]}
          icon={createBinIcon(bin.fill_level)}
          eventHandlers={{
            click: () => onBinClick?.(bin),
          }}
        >
          <Popup>
            <div className="min-w-[200px]">
              <div className="font-semibold mb-1">{bin.waste_type.charAt(0).toUpperCase() + bin.waste_type.slice(1)} Bin</div>
              <div className="text-sm text-gray-600 mb-2">{bin.address}</div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Fill level:</span>
                <span className={`font-bold ${
                  bin.fill_level > 80 ? "text-red-600" : 
                  bin.fill_level > 50 ? "text-yellow-600" : "text-green-600"
                }`}>
                  {bin.fill_level}%
                </span>
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={() => handleNavigate(bin)}
              >
                <Navigation className="h-4 w-4 mr-1" />
                Navigate
              </Button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
