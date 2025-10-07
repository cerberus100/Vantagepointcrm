'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, TrendingUp, ClipboardList, UserPlus, LogOut } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://3.83.217.40/api/v1'

interface DashboardMetrics {
  totalUsers: number
  activeUsers: number
  totalLeads: number
  conversionRate: number
  recentLeads: any[]
  topPerformers: any[]
}

export default function Dashboard() {
  const router = useRouter()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const authToken = localStorage.getItem('authToken')
    if (!authToken) {
      router.push('/login')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Authentication failed')
      }

      // If auth is successful, fetch dashboard data
      fetchDashboardData(authToken)
    } catch (err) {
      console.error('Auth check failed:', err)
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      router.push('/login')
    }
  }

  const fetchDashboardData = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const data = await response.json()
      setMetrics(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">VantagePoint CRM</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Users"
            value={metrics?.totalUsers || 0}
            icon={<Users className="h-6 w-6 text-blue-600" />}
            change="+12%"
          />
          <MetricCard
            title="Active Users"
            value={metrics?.activeUsers || 0}
            icon={<UserPlus className="h-6 w-6 text-green-600" />}
            change="+5%"
          />
          <MetricCard
            title="Total Leads"
            value={metrics?.totalLeads || 0}
            icon={<ClipboardList className="h-6 w-6 text-purple-600" />}
            change="+18%"
          />
          <MetricCard
            title="Conversion Rate"
            value={`${metrics?.conversionRate || 0}%`}
            icon={<TrendingUp className="h-6 w-6 text-orange-600" />}
            change="+2.3%"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Leads</h2>
            <div className="space-y-3">
              {metrics?.recentLeads?.slice(0, 5).map((lead, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{lead.name}</p>
                    <p className="text-sm text-gray-600">{lead.email}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    lead.status === 'NEW' ? 'bg-green-100 text-green-700' :
                    lead.status === 'CONTACTED' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {lead.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h2>
            <div className="space-y-3">
              {metrics?.topPerformers?.slice(0, 5).map((user, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{user.leadsConverted}</p>
                    <p className="text-xs text-gray-600">leads</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function MetricCard({ title, value, icon, change }: {
  title: string
  value: string | number
  icon: React.ReactNode
  change: string
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        {icon}
        <span className="text-sm text-green-600 font-medium">{change}</span>
      </div>
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  )
}
