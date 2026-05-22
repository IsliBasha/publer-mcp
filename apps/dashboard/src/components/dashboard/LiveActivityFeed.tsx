'use client'
import { useEffect, useState } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle, XCircle, Clock, Zap, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Activity {
  id: string
  type: 'published' | 'failed' | 'scheduled' | 'ai_generated'
  message: string
  timestamp: Date
  platform?: string
}

const activityIcons = {
  published: CheckCircle,
  failed: XCircle,
  scheduled: Clock,
  ai_generated: Zap,
}

const activityColors = {
  published: 'text-green-500',
  failed: 'text-red-500',
  scheduled: 'text-blue-500',
  ai_generated: 'text-purple-500',
}

export function LiveActivityFeed() {
  const { socket, connected } = useSocket()
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      type: 'scheduled',
      message: 'LinkedIn post scheduled for tomorrow 9 AM',
      timestamp: new Date(Date.now() - 120_000),
      platform: 'linkedin',
    },
    {
      id: '2',
      type: 'ai_generated',
      message: 'AI generated caption for Instagram campaign',
      timestamp: new Date(Date.now() - 300_000),
      platform: 'instagram',
    },
  ])

  useEffect(() => {
    if (!socket) return

    socket.on('post:published', (data: { postId: string; platforms: string[] }) => {
      setActivities((prev) => [
        {
          id: `pub-${data.postId}`,
          type: 'published',
          message: `Post published to ${data.platforms.join(', ')}`,
          timestamp: new Date(),
          platform: data.platforms[0],
        },
        ...prev.slice(0, 19),
      ])
    })

    socket.on('post:failed', (data: { postId: string; error: string }) => {
      setActivities((prev) => [
        {
          id: `fail-${data.postId}`,
          type: 'failed',
          message: `Post failed: ${data.error}`,
          timestamp: new Date(),
        },
        ...prev.slice(0, 19),
      ])
    })

    return () => {
      socket.off('post:published')
      socket.off('post:failed')
    }
  }, [socket])

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Live Activity</h3>
        <div className="flex items-center gap-1.5">
          {connected ? (
            <><Wifi className="h-4 w-4 text-green-500" /><span className="text-xs text-green-500">Live</span></>
          ) : (
            <><WifiOff className="h-4 w-4 text-gray-400" /><span className="text-xs text-gray-400">Offline</span></>
          )}
        </div>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.type]
          return (
            <div key={activity.id} className="flex items-start gap-3">
              <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', activityColors[activity.type])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-700 leading-snug">{activity.message}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
