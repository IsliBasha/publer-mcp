export type MessageRole = 'user' | 'assistant'
export type ToolCallStatus = 'running' | 'done' | 'error'

export interface ToolCall {
  id: string
  tool: string
  params: Record<string, unknown>
  status: ToolCallStatus
  result?: unknown
  errorMessage?: string
  duration?: number
  startedAt: Date
}

export interface Message {
  id: string
  role: MessageRole
  content: string
  toolCalls?: ToolCall[]
  timestamp: Date
}
