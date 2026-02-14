"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@ecozone/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, Image as ImageIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Issue {
  id: string;
  type: string;
  description: string;
  image_url: string | null;
  status: string;
  created_at: string;
  bin_address: string;
}

interface IssuesListProps {
  issues: Issue[];
}

const typeLabels: Record<string, string> = {
  overflow: "Overflow",
  damage: "Damage",
  missed: "Missed Collection",
};

const typeColors: Record<string, string> = {
  overflow: "bg-red-100 text-red-700",
  damage: "bg-orange-100 text-orange-700",
  missed: "bg-yellow-100 text-yellow-700",
};

export function IssuesList({ issues }: IssuesListProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const router = useRouter();

  const handleResolve = async (issueId: string) => {
    setResolvingId(issueId);
    const supabase = createClient();
    
    if (supabase) {
      await supabase
        .from("issues")
        .update({ status: "resolved" })
        .eq("id", issueId);
      
      router.refresh();
    }
    setResolvingId(null);
  };

  if (issues.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-8 text-center">
        <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
        <h3 className="text-lg font-semibold">No Issues Reported</h3>
        <p className="text-muted-foreground">
          All clear! No issues have been reported recently.
        </p>
      </div>
    );
  }

  const openIssues = issues.filter((i) => i.status === "open");
  const resolvedIssues = issues.filter((i) => i.status === "resolved");

  return (
    <>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{openIssues.length}</div>
              <div className="text-sm text-muted-foreground">Open Issues</div>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{resolvedIssues.length}</div>
              <div className="text-sm text-muted-foreground">Resolved</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Photo</TableHead>
              <TableHead>Reported</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell>
                  <Badge className={typeColors[issue.type] || "bg-gray-100 text-gray-700"}>
                    {typeLabels[issue.type] || issue.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {issue.bin_address}
                </TableCell>
                <TableCell className="max-w-[250px] truncate text-sm text-muted-foreground">
                  {issue.description}
                </TableCell>
                <TableCell>
                  {issue.image_url ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedImage(issue.image_url)}
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(issue.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      issue.status === "open"
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }
                  >
                    {issue.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {issue.status === "open" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolve(issue.id)}
                      disabled={resolvingId === issue.id}
                    >
                      {resolvingId === issue.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Resolve"
                      )}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Issue Photo</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Issue"
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
