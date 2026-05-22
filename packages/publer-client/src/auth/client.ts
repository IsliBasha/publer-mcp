import axios, { AxiosInstance, AxiosError } from 'axios'
import axiosRetry from 'axios-retry'

const PUBLER_API_BASE = 'https://app.publer.com/api/v1'

export class PublerApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'PublerApiError'
  }
}

export function createPublerClient(apiKey: string, workspaceId?: string): AxiosInstance {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('PUBLER_API_KEY is required')
  }

  const client = axios.create({
    baseURL: PUBLER_API_BASE,
    timeout: 30_000,
    headers: {
      Authorization: `Bearer-API ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'publer-mcp/1.0.0',
      ...(workspaceId && { 'Publer-Workspace-Id': workspaceId }),
    },
  })

  axiosRetry(client, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
      const status = error.response?.status
      // Retry on network errors and 5xx (not 4xx client errors, not 429 rate limits without backoff)
      return axiosRetry.isNetworkOrIdempotentRequestError(error) || status === 503
    },
  })

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const status = error.response?.status ?? 500
      const data = error.response?.data as { message?: string } | undefined
      const message = data?.message ?? error.message

      // Mask the API key in any logged error
      const safeMessage = message.replace(apiKey, '[REDACTED]')

      throw new PublerApiError(safeMessage, status, data)
    }
  )

  return client
}
