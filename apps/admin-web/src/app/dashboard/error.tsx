"use client";

import { useEffect } from "react";
import { Button } from "@ecozone/ui";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[50vh]">
      <div className="max-w-md w-full rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-foreground mb-2">
          Dashboard error
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {error.message || "Failed to load dashboard. Please try again."}
        </p>
        <Button onClick={reset} variant="default">
          Try again
        </Button>
      </div>
    </div>
  );
}
