"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface MyIssue {
  id: string;
  type: string;
  description: string;
  status: string;
  created_at: string;
  bins: { address: string } | null;
}

export function useMyIssues(enabled: boolean) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["my-issues"],
    enabled: enabled && !!supabase,
    queryFn: async (): Promise<MyIssue[]> => {
      if (!supabase) return [];

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("issues")
        .select("id, type, description, status, created_at, bins(address)")
        .eq("reported_by", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data ?? []) as MyIssue[];
    },
  });
}
