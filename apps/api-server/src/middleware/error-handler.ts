import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { PublerApiError } from '@publer-mcp/publer-client'
import { logger } from '../config/logger.js'

export interface ApiError extends Error {
  statusCode?: number
  details?: unknown
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error({ err, url: req.url, method: req.method }, 'Request error')

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      data: null,
      details: err.flatten(),
    })
    return
  }

  if (err instanceof PublerApiError) {
    res.status(err.statusCode < 500 ? err.statusCode : 502).json({
      success: false,
      error: err.message,
      data: null,
    })
    return
  }

  const status = err.statusCode ?? 500
  res.status(status).json({
    success: false,
    error: status >= 500 ? 'Internal server error' : err.message,
    data: null,
  })
}

export function notFound(req: Request, res: Response): void {
  res.status(404).json({ success: false, error: `Route ${req.path} not found`, data: null })
}
