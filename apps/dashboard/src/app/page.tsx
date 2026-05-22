import { Sidebar } from '@/components/dashboard/Sidebar'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { LiveActivityFeed } from '@/components/dashboard/LiveActivityFeed'
import { EngagementChart } from '@/components/dashboard/EngagementChart'
import { Users, Eye, Heart, CalendarCheck } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">
              AI-native social media management powered by MCP
            </p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <MetricCard
              title="Total Followers"
              value={48_320}
              change={3.2}
              icon={Users}
              color="blue"
            />
            <MetricCard
              title="Weekly Reach"
              value={124_800}
              change={8.7}
              icon={Eye}
              color="purple"
            />
            <MetricCard
              title="Engagements"
              value={9_420}
              change={12.1}
              icon={Heart}
              color="orange"
            />
            <MetricCard
              title="Scheduled Posts"
              value={14}
              change={undefined}
              icon={CalendarCheck}
              color="green"
            />
          </div>

          {/* Charts + Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <EngagementChart />
            </div>
            <div>
              <LiveActivityFeed />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
