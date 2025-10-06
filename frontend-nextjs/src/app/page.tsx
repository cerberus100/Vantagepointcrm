"use client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://3.83.217.40/api/v1';

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

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    practicesSignedUp: 0,
    activeLeads: 0,
    conversionRate: 0,
    totalLeads: 0
  });

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Verify token with backend
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <TopHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Dashboard Overview</h1>
            <Toolbar />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Total Practices"
              value={metrics.practicesSignedUp}
              icon={<Hospital className="h-8 w-8" />}
              trend={+12}
            />
            <MetricCard
              title="Active Leads"
              value={metrics.activeLeads}
              icon={<Users className="h-8 w-8" />}
              trend={+8}
            />
            <MetricCard
              title="Total Leads"
              value={metrics.totalLeads}
              icon={<ClipboardList className="h-8 w-8" />}
              trend={+15}
            />
            <MetricCard
              title="Conversion Rate"
              value={`${metrics.conversionRate}%`}
              icon={<TrendingUp className="h-8 w-8" />}
              trend={+3}
            />
          </div>

          <div className="bg-card rounded-lg shadow-sm">
            <DataTable />
          </div>
        </main>
      </div>
    </div>
  );
}