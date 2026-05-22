import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { pinoHttp } from 'pino-http'
import { logger } from './config/logger.js'
import { env } from './config/env.js'
import { errorHandler, notFound } from './middleware/error-handler.js'
import { postsRouter } from './routes/posts.js'
import { analyticsRouter } from './routes/analytics.js'
import { accountsRouter } from './routes/accounts.js'
import { queueRouter } from './routes/queue.js'
import { createSocketServer } from './socket/index.js'
import { startWorker } from './queue/scheduler.js'

const app = express()
const httpServer = createServer(app)
const io = createSocketServer(httpServer)

// Security
app.use(helmet())
app.use(cors({ origin: process.env.NEXT_PUBLIC_API_URL ?? '*' }))
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }))

// Parsing & logging
app.use(express.json({ limit: '10mb' }))
app.use(pinoHttp({ logger }))

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/posts', postsRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/accounts', accountsRouter)
app.use('/api/queue', queueRouter)

// Error handling
app.use(notFound)
app.use(errorHandler)

// Start worker
startWorker(io)

httpServer.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'API server running')
})

process.on('SIGTERM', () => {
  httpServer.close(() => {
    logger.info('Server shut down gracefully')
    process.exit(0)
  })
})
