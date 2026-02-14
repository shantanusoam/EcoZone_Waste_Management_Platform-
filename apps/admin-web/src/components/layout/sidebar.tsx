"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@ecozone/ui";
import {
  Leaf,
  Map,
  Trash2,
  Route,
  AlertTriangle,
  BarChart3,
  Settings,
  Users,
} from "lucide-react";

const navigation = [
  { name: "Map View", href: "/dashboard", icon: Map },
  { name: "Bins", href: "/dashboard/bins", icon: Trash2 },
  { name: "Routes", href: "/dashboard/routes", icon: Route },
  { name: "Issues", href: "/dashboard/issues", icon: AlertTriangle },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Users", href: "/dashboard/users", icon: Users },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-card border-r flex flex-col">
      <div className="p-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="rounded-lg bg-primary p-2">
            <Leaf className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl">EcoZone</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground">
          EcoZone v0.1.0
        </div>
      </div>
    </aside>
  );
}
