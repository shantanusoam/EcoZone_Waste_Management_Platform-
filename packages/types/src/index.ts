// Domain types for EcoZone
// These will be augmented with Supabase generated types

export type UserRole = "admin" | "driver" | "customer";

export type WasteType = "general" | "recycling" | "organic" | "hazardous";

export type BinStatus = "active" | "damaged" | "maintenance_required";

export type RouteStatus = "pending" | "in_progress" | "completed";

export type PickupStatus = "pending" | "collected" | "skipped";

export type IssueType = "overflow" | "damage" | "missed";

export type IssueStatus = "open" | "resolved";

// Fill level thresholds for color coding
export const FILL_LEVEL = {
  LOW: 50,      // Green: 0-50%
  MEDIUM: 80,   // Yellow: 51-80%
  HIGH: 100,    // Red: 81-100%
} as const;

export function getFillLevelColor(fillLevel: number): "green" | "yellow" | "red" {
  if (fillLevel <= FILL_LEVEL.LOW) return "green";
  if (fillLevel <= FILL_LEVEL.MEDIUM) return "yellow";
  return "red";
}

// Re-export database types when generated
export * from "./database";
