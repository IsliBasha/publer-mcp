'use client'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

const MOCK_DATA = [
  { date: 'Mon', linkedin: 420, instagram: 680, twitter: 310 },
  { date: 'Tue', linkedin: 580, instagram: 720, twitter: 290 },
  { date: 'Wed', linkedin: 490, instagram: 810, twitter: 340 },
  { date: 'Thu', linkedin: 670, instagram: 760, twitter: 420 },
  { date: 'Fri', linkedin: 720, instagram: 920, twitter: 380 },
  { date: 'Sat', linkedin: 390, instagram: 1040, twitter: 220 },
  { date: 'Sun', linkedin: 350, instagram: 980, twitter: 190 },
]

const PLATFORM_COLORS = {
  linkedin: '#0a66c2',
  instagram: '#e1306c',
  twitter: '#1d9bf0',
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
  return (
    <div className="rounded-xl border border-edge-default bg-surface-raised p-5">
      <div className="flex items-center justify-between mb-5">
        <p className="text-[13px] font-medium text-ink-secondary">Engagement This Week</p>
        <div className="flex items-center gap-4">
          {Object.entries(PLATFORM_COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: color }} />
              <span className="text-[11px] text-ink-disabled capitalize">{key}</span>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={MOCK_DATA} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
          <defs>
            {Object.entries(PLATFORM_COLORS).map(([key, color]) => (
              <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
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
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2f3650', strokeWidth: 1 }} />
          {Object.entries(PLATFORM_COLORS).map(([key, color]) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              fill={`url(#grad-${key})`}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
