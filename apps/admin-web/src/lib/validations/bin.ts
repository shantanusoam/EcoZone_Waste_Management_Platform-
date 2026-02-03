import { z } from "zod";

export const binSchema = z.object({
  address: z.string().min(1, "Address is required"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  capacity_liters: z.number().int().positive().default(240),
  waste_type: z.enum(["general", "recycling", "organic", "hazardous"]).default("general"),
  status: z.enum(["active", "damaged", "maintenance_required"]).default("active"),
  sensor_id: z.string().min(1, "Sensor ID is required"),
});

export const createBinSchema = binSchema;

export const updateBinSchema = binSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateBinInput = z.infer<typeof createBinSchema>;
export type UpdateBinInput = z.infer<typeof updateBinSchema>;
