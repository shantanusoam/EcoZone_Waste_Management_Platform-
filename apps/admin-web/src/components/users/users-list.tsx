"use client";

import { useState } from "react";
import { updateProfileRole, type ProfileRow, type UserRole } from "@/app/actions/users";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users } from "lucide-react";

interface UsersListProps {
  profiles: ProfileRow[];
}

const roleColors: Record<UserRole, string> = {
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  driver: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  customer: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export function UsersList({ profiles }: UsersListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleRoleChange = async (profileId: string, role: UserRole) => {
    setUpdatingId(profileId);
    await updateProfileRole(profileId, role);
    setUpdatingId(null);
  };

  if (profiles.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-8 text-center">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No Users</h3>
        <p className="text-muted-foreground">
          User profiles will appear here once users sign up.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="w-[180px]">Change role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile) => (
            <TableRow key={profile.id}>
              <TableCell className="font-medium">
                {profile.full_name || "—"}
              </TableCell>
              <TableCell>
                <Badge className={roleColors[profile.role]}>
                  {profile.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Select
                  value={profile.role}
                  onValueChange={(value) =>
                    handleRoleChange(profile.id, value as UserRole)
                  }
                  disabled={updatingId === profile.id}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="driver">Driver</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
