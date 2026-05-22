import { Server as HttpServer } from 'http'
import { Server as SocketIoServer } from 'socket.io'
import { logger } from '../config/logger.js'

export function createSocketServer(httpServer: HttpServer): SocketIoServer {
  const io = new SocketIoServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  })

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Client connected')

    socket.on('subscribe:analytics', (data: { accountId?: string }) => {
      socket.join(`analytics:${data.accountId ?? 'all'}`)
      logger.debug({ socketId: socket.id }, 'Subscribed to analytics')
    })

    socket.on('subscribe:queue', () => {
      socket.join('queue:updates')
    })

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Client disconnected')
    })
  })

  return io
}
