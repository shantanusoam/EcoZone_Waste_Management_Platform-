"use server";

import { requireRole } from "@ecozone/auth";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createBinSchema, updateBinSchema, type CreateBinInput, type UpdateBinInput } from "@/lib/validations/bin";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createBin(input: CreateBinInput): Promise<ActionResult<{ id: string }>> {
  try {
    const validated = createBinSchema.parse(input);
    const supabase = await createClient();
    const auth = await requireRole(supabase, "admin");
    if ("error" in auth) return { success: false, error: auth.error };

    // Create bin with PostGIS point (WKT format)
    const { data, error } = await supabase
      .from("bins")
      .insert({
        address: validated.address,
        location: `POINT(${validated.lng} ${validated.lat})`,
        capacity_liters: validated.capacity_liters,
        waste_type: validated.waste_type,
        status: validated.status,
        sensor_id: validated.sensor_id,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Sensor ID already exists" };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/bins");
    return { success: true, data: { id: data.id } };
  } catch (e) {
    if (e instanceof Error) {
      return { success: false, error: e.message };
    }
    return { success: false, error: "Failed to create bin" };
  }
}

export async function updateBin(input: UpdateBinInput): Promise<ActionResult> {
  try {
    const validated = updateBinSchema.parse(input);
    const supabase = await createClient();
    const auth = await requireRole(supabase, "admin");
    if ("error" in auth) return { success: false, error: auth.error };

    const updateData: Record<string, unknown> = {};
    if (validated.address) updateData.address = validated.address;
    if (validated.lat !== undefined && validated.lng !== undefined) {
      updateData.location = `POINT(${validated.lng} ${validated.lat})`;
    }
    if (validated.capacity_liters) updateData.capacity_liters = validated.capacity_liters;
    if (validated.waste_type) updateData.waste_type = validated.waste_type;
    if (validated.status) updateData.status = validated.status;
    if (validated.sensor_id) updateData.sensor_id = validated.sensor_id;

    const { error } = await supabase
      .from("bins")
      .update(updateData)
      .eq("id", validated.id);

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Sensor ID already exists" };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/bins");
    return { success: true, data: undefined };
  } catch (e) {
    if (e instanceof Error) {
      return { success: false, error: e.message };
    }
    return { success: false, error: "Failed to update bin" };
  }
}

export async function deleteBin(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const auth = await requireRole(supabase, "admin");
    if ("error" in auth) return { success: false, error: auth.error };

    const { error } = await supabase
      .from("bins")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/bins");
    return { success: true, data: undefined };
  } catch (e) {
    if (e instanceof Error) {
      return { success: false, error: e.message };
    }
    return { success: false, error: "Failed to delete bin" };
  }
}
