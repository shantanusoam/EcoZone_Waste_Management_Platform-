"use client";

import { useState, useMemo } from "react";
import { useBins, type Bin } from "@/hooks/use-bins";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BinFormModal } from "@/components/bins/bin-form-modal";
import { DeleteBinDialog } from "@/components/bins/delete-bin-dialog";
import { getFillLevelColor } from "@ecozone/types";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

export default function BinsPage() {
  const { data: bins, isLoading } = useBins();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [wasteTypeFilter, setWasteTypeFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingBin, setEditingBin] = useState<Bin | null>(null);
  const [deletingBin, setDeletingBin] = useState<Bin | null>(null);

  const filteredBins = useMemo(() => {
    if (!bins) return [];
    return bins.filter((bin) => {
      const matchesSearch = bin.address.toLowerCase().includes(search.toLowerCase()) ||
        bin.sensor_id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || bin.status === statusFilter;
      const matchesWasteType = wasteTypeFilter === "all" || bin.waste_type === wasteTypeFilter;
      return matchesSearch && matchesStatus && matchesWasteType;
    });
  }, [bins, search, statusFilter, wasteTypeFilter]);

  const handleEdit = (bin: Bin) => {
    setEditingBin(bin);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingBin(null);
    setFormOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "damaged":
        return <Badge variant="destructive">Damaged</Badge>;
      case "maintenance_required":
        return <Badge variant="warning">Maintenance</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFillBadge = (fillLevel: number) => {
    const color = getFillLevelColor(fillLevel);
    const variant = color === "green" ? "success" : color === "yellow" ? "warning" : "destructive";
    return <Badge variant={variant}>{fillLevel}%</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bins Management</h1>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Bin
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bins</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by address or sensor ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
                <SelectItem value="maintenance_required">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={wasteTypeFilter} onValueChange={setWasteTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Waste Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="recycling">Recycling</SelectItem>
                <SelectItem value="organic">Organic</SelectItem>
                <SelectItem value="hazardous">Hazardous</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Loading bins...
            </div>
          ) : filteredBins.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No bins found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Sensor ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Fill Level</TableHead>
                  <TableHead>Battery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBins.map((bin) => (
                  <TableRow key={bin.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {bin.address}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{bin.sensor_id}</TableCell>
                    <TableCell className="capitalize">{bin.waste_type}</TableCell>
                    <TableCell>{getFillBadge(bin.fill_level)}</TableCell>
                    <TableCell>
                      <span className={bin.battery_level < 30 ? "text-destructive font-medium" : ""}>
                        {bin.battery_level}%
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(bin.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(bin)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingBin(bin)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredBins.length} of {bins?.length || 0} bins
          </div>
        </CardContent>
      </Card>

      <BinFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        bin={editingBin}
      />

      <DeleteBinDialog
        bin={deletingBin}
        open={!!deletingBin}
        onOpenChange={(open) => !open && setDeletingBin(null)}
      />
    </div>
  );
}
