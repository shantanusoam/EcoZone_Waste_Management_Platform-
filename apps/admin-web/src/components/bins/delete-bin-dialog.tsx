"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteBin } from "@/app/actions/bins";
import type { Bin } from "@/hooks/use-bins";

interface DeleteBinDialogProps {
  bin: Bin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteBinDialog({ bin, open, onOpenChange }: DeleteBinDialogProps) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    if (!bin) return;
    
    setLoading(true);
    const result = await deleteBin(bin.id);
    setLoading(false);

    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["bins"] });
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Bin</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the bin at{" "}
            <span className="font-medium">{bin?.address}</span>? This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
