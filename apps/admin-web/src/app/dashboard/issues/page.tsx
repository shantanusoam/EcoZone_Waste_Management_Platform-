import { createClient } from "@/lib/supabase/server";
import { IssuesList } from "@/components/issues/issues-list";

export const dynamic = "force-dynamic";

interface IssueRow {
  id: string;
  type: string;
  description: string;
  image_url: string | null;
  status: string;
  created_at: string;
  bins: { address: string } | null;
}

export default async function IssuesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("issues")
    .select(`
      id,
      type,
      description,
      image_url,
      status,
      created_at,
      bins (
        address
      )
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  const issues = ((data || []) as IssueRow[]).map((issue) => ({
    id: issue.id,
    type: issue.type,
    description: issue.description,
    image_url: issue.image_url,
    status: issue.status,
    created_at: issue.created_at,
    bin_address: issue.bins?.address || "Unknown location",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reported Issues</h1>
        <p className="text-muted-foreground">
          Review and manage issues reported by citizens
        </p>
      </div>

      <IssuesList issues={issues} />
    </div>
  );
}
