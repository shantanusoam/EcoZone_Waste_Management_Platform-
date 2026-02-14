import type { User } from "@supabase/supabase-js";
import type { Database } from "@ecozone/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "admin" | "driver" | "customer";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type AuthResult =
  | { user: User; profile: Profile }
  | { error: string };

/**
 * Require an authenticated user. Returns user and profile or an error.
 * Use in server actions or API routes.
 */
export async function requireAuth(
  supabase: SupabaseClient<Database>
): Promise<AuthResult> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return { error: authError.message };
  }
  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, full_name, avatar_url, created_at, updated_at")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Profile not found" };
  }

  const typedProfile: Profile = {
    id: profile.id,
    role: profile.role as UserRole,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };

  return { user, profile: typedProfile };
}

/**
 * Require an authenticated user with a specific role.
 * Returns user and profile or an error (e.g. "Unauthorized", "Only admins can perform this action").
 */
export async function requireRole(
  supabase: SupabaseClient<Database>,
  role: UserRole
): Promise<AuthResult> {
  const result = await requireAuth(supabase);
  if ("error" in result) {
    return result;
  }

  if (result.profile.role !== role) {
    const roleLabel = role === "admin" ? "admins" : role === "driver" ? "drivers" : "customers";
    return { error: `Only ${roleLabel} can perform this action` };
  }

  return result;
}
