"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NearbyBin } from "@/hooks/use-nearby-bins";
import { Button } from "@ecozone/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, Upload, X, AlertTriangle, Loader2 } from "lucide-react";

interface ReportIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bin: NearbyBin | null;
}

const issueTypes = [
  { value: "overflow", label: "Bin Overflowing" },
  { value: "damage", label: "Bin Damaged" },
  { value: "missed", label: "Missed Collection" },
];

export function ReportIssueDialog({ open, onOpenChange, bin }: ReportIssueDialogProps) {
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!bin || !issueType) return;
    
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error("Service not available");
      }

      let imageUrl: string | null = null;

      // Upload photo if provided
      if (photoFile) {
        const fileExt = photoFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `issues/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("issue-photos")
          .upload(filePath, photoFile);

        if (uploadError) {
          console.warn("Photo upload failed:", uploadError);
          // Continue without photo
        } else {
          const { data } = supabase.storage
            .from("issue-photos")
            .getPublicUrl(filePath);
          imageUrl = data.publicUrl;
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Create issue record (reported_by = user id when logged in, null for anonymous)
      const { error: insertError } = await supabase
        .from("issues")
        .insert({
          bin_id: bin.id,
          type: issueType,
          description: description || `${issueType} reported at ${bin.address}`,
          image_url: imageUrl,
          status: "open",
          reported_by: user?.id ?? null,
        });

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        // Reset form
        setIssueType("");
        setDescription("");
        setPhotoFile(null);
        setPhotoPreview(null);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setError(null);
      setSuccess(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Report an Issue
          </DialogTitle>
          <DialogDescription>
            {bin ? `Report a problem with the bin at ${bin.address}` : "Report a problem"}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg">Report Submitted!</h3>
            <p className="text-muted-foreground mt-1">Thank you for helping keep our city clean.</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Issue Type *</label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  {issueTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide additional details..."
                className="w-full h-24 px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Photo (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={handleRemovePhoto}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.removeAttribute("capture");
                        fileInputRef.current.click();
                        fileInputRef.current.setAttribute("capture", "environment");
                      }
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {!success && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!issueType || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
