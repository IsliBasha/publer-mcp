'use client'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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
  linkedin: '#0A66C2',
  instagram: '#E1306C',
  twitter: '#1DA1F2',
}

export function EngagementChart() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4">Engagement This Week</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={MOCK_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {Object.entries(PLATFORM_COLORS).map(([key, color]) => (
              <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {Object.entries(PLATFORM_COLORS).map(([key, color]) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              fill={`url(#gradient-${key})`}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
