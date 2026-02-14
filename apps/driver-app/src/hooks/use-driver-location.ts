"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const LOCATION_INTERVAL_MS = 30_000; // 30 seconds
const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL;

/**
 * Sends driver GPS location to admin API periodically when on an active route.
 * No-op if NEXT_PUBLIC_ADMIN_API_URL is not set.
 */
export function useDriverLocation(
  routeId: string | null | undefined,
  isRouteInProgress: boolean
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!routeId || !isRouteInProgress || !ADMIN_API_URL) return;

    const sendLocation = () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const supabase = createClient();
          if (!supabase) return;

          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session?.access_token) return;

          const url = `${ADMIN_API_URL.replace(/\/$/, "")}/api/driver-location`;
          await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              route_id: routeId,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }),
          });
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    };

    sendLocation(); // Send immediately
    intervalRef.current = setInterval(sendLocation, LOCATION_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [routeId, isRouteInProgress]);
}
