"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createBin, updateBin } from "@/app/actions/bins";
import { createBinSchema, type CreateBinInput } from "@/lib/validations/bin";
import type { Bin } from "@/hooks/use-bins";

const LocationPickerMap = dynamic(
  () => import("@/components/bins/location-picker").then((mod) => mod.LocationPickerMap),
  { ssr: false, loading: () => <div className="w-full h-[200px] bg-muted animate-pulse rounded-lg" /> }
);

interface BinFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bin?: Bin | null;
}

export function BinFormModal({ open, onOpenChange, bin }: BinFormModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const isEditing = !!bin;

  const form = useForm<CreateBinInput>({
    resolver: zodResolver(createBinSchema),
    defaultValues: {
      address: "",
      lat: 37.7749,
      lng: -122.4194,
      capacity_liters: 240,
      waste_type: "general",
      status: "active",
      sensor_id: "",
    },
  });

  useEffect(() => {
    if (bin) {
      form.reset({
        address: bin.address,
        lat: bin.lat,
        lng: bin.lng,
        capacity_liters: bin.capacity_liters,
        waste_type: bin.waste_type,
        status: bin.status,
        sensor_id: bin.sensor_id,
      });
    } else {
      form.reset({
        address: "",
        lat: 37.7749,
        lng: -122.4194,
        capacity_liters: 240,
        waste_type: "general",
        status: "active",
        sensor_id: "",
      });
    }
  }, [bin, form]);

  const onSubmit = async (data: CreateBinInput) => {
    setLoading(true);
    setError(null);

    const result = isEditing
      ? await updateBin({ id: bin.id, ...data })
      : await createBin(data);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["bins"] });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Bin" : "Add New Bin"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="123 Main St, City"
              {...form.register("address")}
            />
            {form.formState.errors.address && (
              <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <LocationPickerMap
              lat={form.watch("lat")}
              lng={form.watch("lng")}
              onChange={(lat, lng) => {
                form.setValue("lat", lat);
                form.setValue("lng", lng);
              }}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="lat" className="text-xs">Latitude</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  className="h-8 text-sm"
                  {...form.register("lat", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lng" className="text-xs">Longitude</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  className="h-8 text-sm"
                  {...form.register("lng", { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sensor_id">Sensor ID</Label>
            <Input
              id="sensor_id"
              placeholder="SENSOR-XXX"
              {...form.register("sensor_id")}
            />
            {form.formState.errors.sensor_id && (
              <p className="text-sm text-destructive">{form.formState.errors.sensor_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="waste_type">Waste Type</Label>
              <Select
                value={form.watch("waste_type")}
                onValueChange={(v) => form.setValue("waste_type", v as CreateBinInput["waste_type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="recycling">Recycling</SelectItem>
                  <SelectItem value="organic">Organic</SelectItem>
                  <SelectItem value="hazardous">Hazardous</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity_liters">Capacity (L)</Label>
              <Input
                id="capacity_liters"
                type="number"
                {...form.register("capacity_liters", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(v) => form.setValue("status", v as CreateBinInput["status"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
                <SelectItem value="maintenance_required">Maintenance Required</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
