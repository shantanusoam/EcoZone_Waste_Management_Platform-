"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useNearbyBins, type NearbyBin } from "@/hooks/use-nearby-bins";
import { useUser } from "@/hooks/use-user";
import { useMyIssues } from "@/hooks/use-my-issues";
import { Button } from "@ecozone/ui";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BinList } from "@/components/bin-list";
import { ReportIssueDialog } from "@/components/report-issue-dialog";
import {
  Leaf,
  List,
  Map as MapIcon,
  Loader2,
  RefreshCw,
  AlertTriangle,
  LogIn,
  LogOut,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Dynamic import for Leaflet map
const BinMap = dynamic(() => import("@/components/bin-map").then((m) => m.BinMap), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-muted">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
});

const wasteTypes = [
  { value: "all", label: "All Types" },
  { value: "general", label: "General" },
  { value: "recycling", label: "Recycling" },
  { value: "organic", label: "Organic" },
  { value: "hazardous", label: "Hazardous" },
];

export default function HomePage() {
  const [wasteType, setWasteType] = useState("all");
  const [viewMode, setViewMode] = useState<"map" | "list">("list");
  const [selectedBin, setSelectedBin] = useState<NearbyBin | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [showMyReports, setShowMyReports] = useState(false);

  const { data: user } = useUser();
  const { data: myIssues = [], refetch: refetchMyIssues } = useMyIssues(!!user);

  const {
    latitude,
    longitude,
    error: locationError,
    loading: locationLoading,
    refresh: refreshLocation,
  } = useGeolocation();

  const {
    data: bins,
    isLoading: binsLoading,
    refetch: refetchBins,
  } = useNearbyBins({
    latitude,
    longitude,
    wasteType: wasteType === "all" ? null : wasteType,
  });

  const handleNavigate = (bin: NearbyBin) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${bin.lat},${bin.lng}&travelmode=walking`;
    window.open(url, "_blank");
  };

  const handleReport = (bin: NearbyBin) => {
    setSelectedBin(bin);
    setReportDialogOpen(true);
  };

  const handleReportDialogChange = (open: boolean) => {
    setReportDialogOpen(open);
    if (!open) refetchMyIssues();
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    window.location.reload();
  };

  const isLoading = locationLoading || binsLoading;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground px-4 py-3 safe-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6" />
            <span className="font-semibold text-lg">EcoZone</span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMyReports(!showMyReports)}
                  className="text-primary-foreground hover:bg-primary/80"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  My reports ({myIssues.length})
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="text-primary-foreground hover:bg-primary/80"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary/80">
                  <LogIn className="h-4 w-4 mr-1" />
                  Sign in
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                refreshLocation();
                refetchBins();
              }}
              className="text-primary-foreground hover:bg-primary/80"
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </header>

      {showMyReports && user && (
        <div className="bg-muted/50 border-b px-4 py-3">
          <h3 className="font-medium text-sm mb-2">My reports</h3>
          {myIssues.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports yet. Report an issue from a bin to see it here.</p>
          ) : (
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {myIssues.map((issue) => (
                <li key={issue.id} className="text-sm flex justify-between gap-2">
                  <span className="truncate">{issue.description}</span>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-xs ${issue.status === "resolved" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {issue.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Location Status */}
      {locationError && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">{locationError}</span>
          <Button variant="link" size="sm" className="ml-auto text-destructive" onClick={refreshLocation}>
            Retry
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-3">
          <Select value={wasteType} onValueChange={setWasteType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Waste type" />
            </SelectTrigger>
            <SelectContent>
              {wasteTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1" />

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "map" | "list")}>
            <TabsList className="h-9">
              <TabsTrigger value="list" className="px-3">
                <List className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="map" className="px-3">
                <MapIcon className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
              <p className="text-muted-foreground">
                {locationLoading ? "Getting your location..." : "Finding nearby bins..."}
              </p>
            </div>
          </div>
        ) : viewMode === "list" ? (
          <BinList
            bins={bins || []}
            onNavigate={handleNavigate}
            onReport={handleReport}
          />
        ) : (
          <div className="flex-1">
            <BinMap
              bins={bins || []}
              userLocation={latitude && longitude ? { lat: latitude, lng: longitude } : null}
              onBinClick={setSelectedBin}
            />
          </div>
        )}
      </main>

      {/* Report Issue Dialog */}
      <ReportIssueDialog
        open={reportDialogOpen}
        onOpenChange={handleReportDialogChange}
        bin={selectedBin}
      />
    </div>
  );
}
