import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { AccountsService } from '@publer-mcp/publer-client'
import { successResponse, errorResponse } from '../utils/response.js'

export function registerAccountTools(server: McpServer, accountsService: AccountsService) {
  // ─── list_social_accounts ─────────────────────────────────────────────────────
  server.tool(
    'list_social_accounts',
    `List all connected social media accounts in the Publer workspace.
Returns account names, usernames, platforms, and connection status.
Use when the user asks what accounts are connected, which platforms are set up, or needs account IDs for other operations.
Examples: "What social accounts do I have connected?", "Show me my accounts", "List my platforms".`,
    {
      workspaceId: z
        .string()
        .optional()
        .describe('Filter by workspace ID (returns all workspaces if omitted)'),
    },
    async ({ workspaceId: _ }) => {
      try {
        const accounts = await accountsService.listAccounts()
        return successResponse({
          accounts,
          total: accounts.length,
          platforms: [...new Set(accounts.map((a) => a.platform))],
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to list accounts'
        return errorResponse(msg)
      }
    }
  )

  // ─── content_calendar_view ────────────────────────────────────────────────────
  // Note: registers here alongside account context but uses posts service in main index
  // Defined in calendar-tools.ts to keep concerns separate
}
