import { Sidebar } from '@/components/dashboard/Sidebar'
import { EngagementChart } from '@/components/dashboard/EngagementChart'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { TrendingUp, Users, MousePointerClick, Share2 } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-500 mb-8">Platform performance and engagement insights</p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard title="Avg. Engagement Rate" value={4.8} change={0.6} icon={TrendingUp} color="blue" />
            <MetricCard title="New Followers" value={1_240} change={18.4} icon={Users} color="green" />
            <MetricCard title="Link Clicks" value={3_820} change={-2.1} icon={MousePointerClick} color="orange" />
            <MetricCard title="Shares" value={892} change={9.3} icon={Share2} color="purple" />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <EngagementChart />
          </div>
        </div>
      </main>
    </div>
  )
}
