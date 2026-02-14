"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useUser() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["user"],
    enabled: !!supabase,
    queryFn: async () => {
      if (!supabase) return null;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });
}
