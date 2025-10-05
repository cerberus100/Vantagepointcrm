"use client";

import { useState } from "react";
import { 
  Gauge, 
  ListChecks, 
  Handshake, 
  Users, 
  BarChart3, 
  SlidersHorizontal,
  UserPlus,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  active?: boolean;
}

const sidebarItems: SidebarItem[] = [
  { icon: Gauge, label: "Home", href: "/", active: true },
  { icon: ListChecks, label: "Leads", href: "/leads" },
  { icon: Handshake, label: "Deals", href: "/deals" },
  { icon: Users, label: "Users", href: "/users" },
  { icon: UserPlus, label: "Hiring", href: "/hiring" },
  { icon: BarChart3, label: "Reports", href: "/reports" },
  { icon: SlidersHorizontal, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 bg-panel border-r border-line transition-all duration-300",
      "lg:translate-x-0 -translate-x-full lg:static lg:inset-0",
      collapsed && "w-16"
    )}>
      {/* Collapse Toggle */}
      <div className="flex justify-end p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 text-muted hover:text-primary hover:bg-panel-2"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="px-4 pb-4">
        <ul className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 text-muted hover:text-primary hover:bg-panel-2",
                    item.active && "bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
