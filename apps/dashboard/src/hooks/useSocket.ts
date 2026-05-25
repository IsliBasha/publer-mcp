'use client'
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001'

/**
 * Manages a Socket.IO connection and exposes it as reactive state.
 *
 * IMPORTANT: We use useState (not useRef) so that when the socket is
 * established after the first render, all consumers re-render and can
 * subscribe to events. A ref would stay null on the first render,
 * silently dropping any registrations made during useEffect.
 */
export function useSocket(): { socket: Socket | null; connected: boolean } {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const s = io(WS_URL, { transports: ['websocket'] })

    s.on('connect', () => setConnected(true))
    s.on('disconnect', () => setConnected(false))

    setSocket(s)

    return () => {
      s.disconnect()
      setSocket(null)
      setConnected(false)
    }
  }, [])

  return { socket, connected }
}
