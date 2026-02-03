"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

/**
 * Hook to subscribe to real-time bin updates.
 * Automatically invalidates the bins query when changes occur.
 */
export function useRealtimeBins() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!supabase) return;

    // Subscribe to all changes on the bins table
    const channel = supabase
      .channel("bins-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "bins",
        },
        (payload) => {
          console.log("Bin update received:", payload.eventType, payload.new);
          // Invalidate and refetch bins data
          queryClient.invalidateQueries({ queryKey: ["bins"] });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Subscribed to real-time bin updates");
        }
      });

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase]);
}

/**
 * Hook to subscribe to real-time updates for a specific bin.
 */
export function useRealtimeBin(binId: string | null) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!binId || !supabase) return;

    const channel = supabase
      .channel(`bin-${binId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bins",
          filter: `id=eq.${binId}`,
        },
        (payload) => {
          console.log("Bin update:", payload.new);
          queryClient.invalidateQueries({ queryKey: ["bins", binId] });
          queryClient.invalidateQueries({ queryKey: ["bins"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [binId, queryClient, supabase]);
}
