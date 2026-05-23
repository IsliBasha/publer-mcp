import { LucideIcon } from 'lucide-react'
import { cn, formatNumber, formatPercent } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: number
  change?: number
  icon: LucideIcon
}

export function MetricCard({ title, value, change, icon: Icon }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-edge-default bg-surface-raised p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium tracking-[0.06em] uppercase text-ink-disabled leading-none">{title}</p>
        <Icon className="h-4 w-4 text-ink-disabled shrink-0" />
      </div>
      <p className="mt-4 text-[28px] font-bold text-ink-primary font-display tabular-nums leading-none">
        {formatNumber(value)}
      </p>
      {change !== undefined && (
        <p className={cn('mt-2 text-[12px] font-medium', change >= 0 ? 'text-status-success' : 'text-status-error')}>
          {formatPercent(change)} vs last period
        </p>
      )}
    </div>
  )
}
