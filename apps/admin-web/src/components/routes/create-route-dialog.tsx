"use client";

import { useState } from "react";
import { createRoute } from "@/app/actions/routes";
import { Button } from "@ecozone/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { getFillLevelColor } from "@ecozone/types";

interface Driver {
  id: string;
  full_name: string | null;
}

interface Bin {
  id: string;
  address: string;
  fill_level: number;
  waste_type: string;
}

interface CreateRouteDialogProps {
  drivers: Driver[];
  bins: Bin[];
  children: React.ReactNode;
}

export function CreateRouteDialog({ drivers, bins, children }: CreateRouteDialogProps) {
  const [open, setOpen] = useState(false);
  const [driverId, setDriverId] = useState("");
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedBins, setSelectedBins] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBinToggle = (binId: string) => {
    setSelectedBins((prev) =>
      prev.includes(binId)
        ? prev.filter((id) => id !== binId)
        : [...prev, binId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBins.length === bins.length) {
      setSelectedBins([]);
    } else {
      setSelectedBins(bins.map((b) => b.id));
    }
  };

  const handleSubmit = async () => {
    setError(null);
    
    if (!driverId) {
      setError("Please select a driver");
      return;
    }
    if (selectedBins.length === 0) {
      setError("Please select at least one bin");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.set("driver_id", driverId);
    formData.set("scheduled_date", scheduledDate);
    formData.set("bin_ids", JSON.stringify(selectedBins));

    const result = await createRoute(formData);
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
      setDriverId("");
      setSelectedBins([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Collection Route</DialogTitle>
          <DialogDescription>
            Assign bins to a driver for collection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Driver</Label>
              <Select value={driverId} onValueChange={setDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.full_name || "Unnamed Driver"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Scheduled Date</Label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Bins to Collect ({selectedBins.length} selected)</Label>
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                {selectedBins.length === bins.length ? "Deselect All" : "Select All"}
              </Button>
            </div>

            {bins.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg">
                No bins above 60% fill level
              </div>
            ) : (
              <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                {bins.map((bin) => {
                  const fillColor = getFillLevelColor(bin.fill_level);
                  return (
                    <label
                      key={bin.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedBins.includes(bin.id)}
                        onCheckedChange={() => handleBinToggle(bin.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{bin.address}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {bin.waste_type}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          fillColor === "green"
                            ? "bg-green-100 text-green-700"
                            : fillColor === "yellow"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {bin.fill_level}%
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Route"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
