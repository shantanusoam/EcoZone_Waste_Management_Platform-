import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@ecozone/types";

type SupabaseClientType = ReturnType<typeof createBrowserClient<Database>>;

let client: SupabaseClientType | null = null;

export function createClient(): SupabaseClientType | null {
  // Only create client on the browser
  if (typeof window === "undefined") {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!client) {
    client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return client;
}

export function isSupabaseConfigured(): boolean {
  return typeof window !== "undefined" && 
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}
