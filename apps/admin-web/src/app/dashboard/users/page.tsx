import { getProfiles } from "@/app/actions/users";
import { UsersList } from "@/components/users/users-list";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const profiles = await getProfiles();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          View and manage user roles (admin, driver, customer)
        </p>
      </div>

      <UsersList profiles={profiles} />
    </div>
  );
}
