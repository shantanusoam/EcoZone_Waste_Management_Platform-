"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import type { RouteStopForMap, DriverLocationRow } from "@/app/actions/routes";
import "leaflet/dist/leaflet.css";

function RouteMapController({ stops }: { stops: RouteStopForMap[] }) {
  const map = useMap();

  useEffect(() => {
    if (stops.length > 0) {
      const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [stops, map]);

  return null;
}

const createNumberedIcon = (num: number) =>
  L.divIcon({
    className: "route-stop-marker",
    html: `
      <div style="
        background-color: #10b981;
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
      ">${num}</div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

interface RouteMapProps {
  stops: RouteStopForMap[];
  driverName?: string;
  scheduledDate?: string;
  driverLocations?: DriverLocationRow[];
}

const driverIcon = L.divIcon({
  className: "driver-marker",
  html: `
    <div style="
      background-color: #3b82f6;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export function RouteMap({ stops, driverName, scheduledDate, driverLocations = [] }: RouteMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[400px] bg-muted animate-pulse rounded-lg flex items-center justify-center">
        <span className="text-muted-foreground">Loading map...</span>
      </div>
    );
  }

  const positions = stops.map((s) => [s.lat, s.lng] as [number, number]);
  const defaultCenter: [number, number] = positions[0] ?? [37.7749, -122.4194];

  return (
    <>
      <style jsx global>{`
        .route-stop-marker, .driver-marker {
          background: transparent;
          border: none;
        }
      `}</style>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        className="w-full h-full rounded-lg"
        style={{ minHeight: "400px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RouteMapController stops={stops} />
        {positions.length > 1 && (
          <Polyline
            positions={positions}
            pathOptions={{ color: "#10b981", weight: 4, opacity: 0.8 }}
          />
        )}
        {stops.map((stop, index) => (
          <Marker
            key={stop.bin_id}
            position={[stop.lat, stop.lng]}
            icon={createNumberedIcon(stop.order_index + 1)}
          >
            <Popup>
              <div className="p-2 min-w-[160px]">
                <div className="font-semibold text-sm">Stop {stop.order_index + 1}</div>
                {driverName && (
                  <div className="text-xs text-muted-foreground mt-1">{driverName}</div>
                )}
                {scheduledDate && (
                  <div className="text-xs text-muted-foreground">
                    {new Date(scheduledDate).toLocaleDateString("en-US")}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        {driverLocations.map((loc) => (
          <Marker
            key={loc.driver_id}
            position={[loc.lat, loc.lng]}
            icon={driverIcon}
          >
            <Popup>
              <div className="p-2 min-w-[140px]">
                <div className="font-semibold text-sm text-blue-600">Driver location</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Updated {new Date(loc.updated_at).toLocaleTimeString()}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}
