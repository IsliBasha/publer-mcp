'use client'
import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

// Deterministic color palette for any platform key
const PLATFORM_COLORS: Record<string, string> = {
  linkedin: '#0a66c2',
  instagram: '#e1306c',
  twitter: '#1d9bf0',
  facebook: '#1877f2',
  tiktok: '#010101',
}

const FALLBACK_COLORS = ['#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4']

function colorFor(platform: string, index: number): string {
  return PLATFORM_COLORS[platform] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length] ?? '#8b5cf6'
}

interface ChartDataPoint {
  date: string
  [key: string]: number | string
}

interface TooltipPayload {
  dataKey: string
  color: string
  value: number
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-edge-default bg-surface-raised px-3 py-2.5 shadow-xl">
      <p className="text-[11px] font-medium text-ink-disabled mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2.5">
            <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-[12px] text-ink-secondary capitalize flex-1">{p.dataKey}</span>
            <span className="text-[12px] font-medium text-ink-primary tabular-nums">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function EngagementChart() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then((res) => (res.ok ? res.json() : { success: false }))
      .then(({ success, data }: { success: boolean; data?: { chartData?: ChartDataPoint[] } }) => {
        if (success && data?.chartData) setChartData(data.chartData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Derive active platform keys from data (anything that isn't 'date')
  const platforms = [...new Set(
    chartData.flatMap((d) => Object.keys(d).filter((k) => k !== 'date'))
  )]

  return (
    <div className="rounded-xl border border-edge-default bg-surface-raised p-5">
      <div className="flex items-center justify-between mb-5">
        <p className="text-[13px] font-medium text-ink-secondary">Activity This Week</p>
        <div className="flex items-center gap-4">
          {platforms.map((key, i) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: colorFor(key, i) }} />
              <span className="text-[11px] text-ink-disabled capitalize">{key}</span>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center" style={{ height: 240 }}>
          <span className="text-[12px] text-ink-disabled animate-pulse">Loading…</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
            <defs>
              {platforms.map((key, i) => (
                <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colorFor(key, i)} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={colorFor(key, i)} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#252b3b" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#4a5068', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#4a5068', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={35}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2f3650', strokeWidth: 1 }} />
            {platforms.map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colorFor(key, i)}
                fill={`url(#grad-${key})`}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
