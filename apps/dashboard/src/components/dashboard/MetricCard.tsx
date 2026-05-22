import { LucideIcon } from 'lucide-react'
import { cn, formatNumber, formatPercent } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: number
  change?: number
  icon: LucideIcon
  color?: 'blue' | 'green' | 'purple' | 'orange'
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
}

export function MetricCard({ title, value, change, icon: Icon, color = 'blue' }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={cn('rounded-lg p-2', colorMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold text-gray-900">{formatNumber(value)}</p>
      {change !== undefined && (
        <p className={cn('mt-1 text-sm', change >= 0 ? 'text-green-600' : 'text-red-500')}>
          {formatPercent(change)} vs last period
        </p>
      )}
    </div>
  )
}
