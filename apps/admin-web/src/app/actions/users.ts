"use server";

import { requireRole } from "@ecozone/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UserRole = "admin" | "driver" | "customer";

export interface ProfileRow {
  id: string;
  full_name: string | null;
  role: UserRole;
}

export async function getProfiles(): Promise<ProfileRow[]> {
  const supabase = await createClient();
  const auth = await requireRole(supabase, "admin");
  if ("error" in auth) throw new Error(auth.error);

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .order("full_name", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data ?? []) as ProfileRow[];
}

export async function updateProfileRole(
  profileId: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const auth = await requireRole(supabase, "admin");
  if ("error" in auth) return { success: false, error: auth.error };

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", profileId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard/users");
  return { success: true };
}
