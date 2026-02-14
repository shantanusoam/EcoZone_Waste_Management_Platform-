"use client";

import { useState } from "react";
import { deleteRoute } from "@/app/actions/routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@ecozone/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ViewRouteMapDialog } from "./view-route-map-dialog";
import { downloadCSV } from "@/lib/export-csv";
import { MapPin, Trash2, Truck, Download } from "lucide-react";

interface Route {
  id: string;
  driver_id: string;
  driver_name: string;
  status: string;
  scheduled_date: string;
  total_stops: number;
  collected_stops: number;
}

interface RoutesListProps {
  routes: Route[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

export function RoutesList({ routes }: RoutesListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMapId, setViewMapId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    await deleteRoute(deleteId);
    setIsDeleting(false);
    setDeleteId(null);
  };

  const handleExportCSV = () => {
    const data = routes.map((r) => ({
      driver: r.driver_name,
      scheduled_date: r.scheduled_date,
      status: r.status,
      total_stops: r.total_stops,
      collected_stops: r.collected_stops,
    }));
    downloadCSV(data, `routes-${new Date().toISOString().split("T")[0]}.csv`);
  };

  if (routes.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-8 text-center">
        <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No Routes Yet</h3>
        <p className="text-muted-foreground">
          Create a route to assign bins to drivers for collection.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-2">
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes.map((route) => (
              <TableRow key={route.id}>
                <TableCell className="font-medium">{route.driver_name}</TableCell>
                <TableCell>
                  {new Date(route.scheduled_date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[route.status] || "bg-gray-100 text-gray-700"}>
                    {route.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {route.collected_stops}/{route.total_stops} stops
                </TableCell>
                <TableCell className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMapId(route.id)}
                    title="View on map"
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(route.id)}
                    disabled={route.status === "in_progress"}
                    title="Delete route"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Route?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this route and all associated pickups.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ViewRouteMapDialog
        routeId={viewMapId}
        open={!!viewMapId}
        onOpenChange={(open) => !open && setViewMapId(null)}
      />
    </>
  );
}
