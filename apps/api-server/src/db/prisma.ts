import { PrismaClient } from '@prisma/client'
import { logger } from '../config/logger.js'

export const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
})

prisma.$on('query', (e: { query: string; params: string; duration: number; target: string }) => {
  logger.trace({ query: e.query, duration: e.duration }, 'DB query')
})

prisma.$on('error', (e: { message: string; target: string; timestamp: Date }) => {
  logger.error({ message: e.message }, 'DB error')
})
