'use client'
import { useEffect, useState } from 'react'
import { useSocket } from './useSocket'

export interface Activity {
  id: string
  type: 'published' | 'failed' | 'scheduled'
  message: string
  timestamp: Date
}

interface PostPublishedEvent {
  postId: string
  platforms?: string[]
}

interface PostFailedEvent {
  postId?: string
  platforms?: string[]
  error: string
}

const MAX_ACTIVITIES = 10

/**
 * Combines a one-time initial list with real-time socket activity events.
 * Socket events are prepended so they appear at the top; the combined list
 * is capped at MAX_ACTIVITIES entries.
 */
export function useRealtimeActivity(initialActivities: Activity[]) {
  const [socketActivities, setSocketActivities] = useState<Activity[]>([])
  const { socket, connected } = useSocket()

  useEffect(() => {
    if (!socket) return

    const onPublished = (data: PostPublishedEvent) => {
      const platform = data.platforms?.[0] ?? 'unknown'
      setSocketActivities((prev) => [
        { id: data.postId, type: 'published', message: `${platform} post published`, timestamp: new Date() },
        ...prev,
      ])
    }

    const onFailed = (data: PostFailedEvent) => {
      const platform = data.platforms?.[0] ?? 'unknown'
      setSocketActivities((prev) => [
        {
          id: data.postId ?? `failed-${Date.now()}`,
          type: 'failed',
          message: `${platform} post failed`,
          timestamp: new Date(),
        },
        ...prev,
      ])
    }

    socket.on('post:published', onPublished)
    socket.on('post:failed', onFailed)

    return () => {
      socket.off('post:published', onPublished)
      socket.off('post:failed', onFailed)
    }
  }, [socket])

  const activities = [...socketActivities, ...initialActivities].slice(0, MAX_ACTIVITIES)

  return { activities, connected }
}
