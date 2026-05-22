import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

export function successResponse(data: unknown): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
  }
}

export function errorResponse(message: string, details?: unknown): CallToolResult {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: JSON.stringify({ error: message, details }, null, 2),
      },
    ],
  }
}

export function formatPostList(posts: unknown[], total: number): CallToolResult {
  return successResponse({ posts, total, count: posts.length })
}
