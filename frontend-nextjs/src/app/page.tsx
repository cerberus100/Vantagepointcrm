"use client";

// API Configuration
const API_BASE_URL = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || 'http://3.83.217.40/api/v1') : 'http://3.83.217.40/api/v1';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Hospital, ClipboardList, TrendingUp, Users } from "lucide-react";
import { TopHeader } from "@/components/TopHeader";
import { Sidebar } from "@/components/Sidebar";
import { Toolbar } from "@/components/Toolbar";
import { MetricCard } from "@/components/MetricCard";
import { DataTable } from "@/components/DataTable";

interface DashboardMetrics {
  practicesSignedUp: number;
  activeLeads: number;
  conversionRate: number;
  totalLeads: number;
}

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    practicesSignedUp: 0,
    activeLeads: 0,
    conversionRate: 0,
    totalLeads: 0,
  });
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const token = localStorage.getItem('authToken');

      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Verify token with backend
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setIsAuthenticated(true);

          // Fetch dashboard metrics
          const metricsResponse = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (metricsResponse.ok) {
            const metricsData = await metricsResponse.json();
            setMetrics(metricsData);
          }
        } else {
          localStorage.removeItem('authToken');
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('authToken');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

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
              {[
                {
                  icon: Hospital,
                  label: "Practices Signed Up",
                  value: metrics.practicesSignedUp,
                  subLabel: "Active practices",
                  trend: { direction: 'up' as const, value: `${Math.round((metrics.practicesSignedUp / Math.max(metrics.practicesSignedUp, 1)) * 100)}%` }
                },
                {
                  icon: ClipboardList,
                  label: "Active Leads",
                  value: metrics.activeLeads,
                  subLabel: "Currently active",
                  trend: { direction: 'up' as const, value: `${Math.round((metrics.activeLeads / Math.max(metrics.totalLeads, 1)) * 100)}%` }
                },
                {
                  icon: TrendingUp,
                  label: "Conversion Rate",
                  value: `${metrics.conversionRate}%`,
                  subLabel: "Success rate",
                  trend: { direction: 'up' as const, value: `${metrics.conversionRate}%` }
                },
                {
                  icon: Users,
                  label: "Total Leads",
                  value: metrics.totalLeads,
                  subLabel: "All time",
                  trend: { direction: 'up' as const, value: '100%' }
                }
              ].map((metric, index) => (
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