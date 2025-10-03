"use client";

import { Hospital, ClipboardList, TrendingUp, Users } from "lucide-react";
import { TopHeader } from "@/components/TopHeader";
import { Sidebar } from "@/components/Sidebar";
import { Toolbar } from "@/components/Toolbar";
import { MetricCard } from "@/components/MetricCard";
import { DataTable } from "@/components/DataTable";

export default function Dashboard() {
  const metrics = [
    {
      icon: Hospital,
      label: "Practices Signed Up",
      value: 0,
      subLabel: "vs 12 last month",
      trend: { direction: 'down' as const, value: '0%' }
    },
    {
      icon: ClipboardList,
      label: "Active Leads",
      value: 949,
      subLabel: "vs 1,010 last month",
      trend: { direction: 'down' as const, value: '6%' }
    },
    {
      icon: TrendingUp,
      label: "Conversion Rate",
      value: "0%",
      subLabel: "vs 23% industry avg",
      trend: { direction: 'down' as const, value: '0%' }
    },
    {
      icon: Users,
      label: "Total Leads",
      value: 1010,
      subLabel: "vs 1,200 last month",
      trend: { direction: 'down' as const, value: '16%' }
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <TopHeader />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 lg:ml-64 ml-0">
          <div className="container mx-auto max-w-7xl p-6">
            {/* Toolbar */}
            <div className="mb-8">
              <Toolbar />
            </div>

            {/* Metrics Grid */}
            <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric, index) => (
                <MetricCard
                  key={index}
                  icon={metric.icon}
                  label={metric.label}
                  value={metric.value}
                  subLabel={metric.subLabel}
                  trend={metric.trend}
                />
              ))}
            </div>

            {/* Data Table */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Recent Leads</h3>
              <DataTable />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}