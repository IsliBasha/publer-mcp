# Publer MCP Server

> A Model Context Protocol server that connects Claude Desktop to your [Publer](https://publer.com) social media workspace. Manage scheduled content, generate AI captions, and explore your social accounts through natural language.

## What it does

Expose 13 MCP tools so Claude can:

- **Read** your scheduled posts and social accounts via the Publer REST API
- **Generate** platform-optimized captions and hashtags with Claude Haiku (or template fallback)
- **View** your content calendar with gap detection
- **Update** existing scheduled posts (reschedule, change text)
- Return honest, graceful errors for operations the Publer API v1 does not support (create/delete/analytics)

## MCP Tools

| Tool | What it does |
|------|-------------|
| `list_social_accounts` | Connected accounts across all platforms |
| `list_scheduled_posts` | Upcoming scheduled content with date/platform filters |
| `update_scheduled_post` | Edit text or reschedule an existing post |
| `create_post` | Explains that Publer API v1 is read-only for creates |
| `schedule_post` | Explains that Publer API v1 is read-only for creates |
| `delete_post` | Explains that Publer API v1 is read-only for deletes |
| `get_followers` | Account list with follower placeholder metrics |
| `get_post_analytics` | Real post content from Publer + zero-value engagement metrics |
| `get_best_posting_time` | Industry best-practice posting windows per platform |
| `fetch_engagement_summary` | Scheduled post count summary across your workspace |
| `generate_caption_ai` | AI caption via Claude Haiku; template fallback without key |
| `generate_hashtags` | Platform-optimized hashtags via Claude Haiku or template |
| `content_calendar_view` | Posts grouped by day with gap detection |

**MCP Resources:** `analytics://overview`, `calendar://scheduled-posts`  
**MCP Prompts:** `generate-marketing-campaign`, `rewrite-for-linkedin`, `build-weekly-content-calendar`

## API Limitations

Publer REST API v1 is read-oriented. The following are not available via API and must be done in the Publer web app:

- Creating new posts
- Deleting posts
- Analytics / engagement metrics (all `/analytics/*` endpoints return 404)

The MCP tools for these operations return clear explanatory messages rather than crashing.

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/IsliBasha/publer-mcp
cd publer-mcp
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
PUBLER_API_KEY=your_publer_api_key
PUBLER_WORKSPACE_ID=your_workspace_id
ANTHROPIC_API_KEY=your_anthropic_key   # optional — enables AI caption/hashtag generation
```

**Get your Publer API key:** Publer Settings → API & Integrations → Generate API Key  
**Get your workspace ID:** visible in the Publer URL after `/workspace/`

### 3. Build

```bash
pnpm build
```

### 4. Connect to Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "publer": {
      "command": "node",
      "args": ["/absolute/path/to/publer-mcp/apps/mcp-server/dist/index.js"],
      "env": {
        "PUBLER_API_KEY": "your_publer_api_key",
        "PUBLER_WORKSPACE_ID": "your_workspace_id",
        "ANTHROPIC_API_KEY": "your_anthropic_key"
      }
    }
  }
}
```

Restart Claude Desktop. You should see the Publer tools appear.

### Mock mode (no API key needed)

```bash
PUBLER_MOCK=true node apps/mcp-server/dist/index.js
```

Returns realistic fixture data for all 13 tools — useful for testing the MCP integration without a Publer account.

## Project Structure

```
publer-mcp/
├── apps/
│   └── mcp-server/          # MCP stdio server — 13 tools, 2 resources, 3 prompts
│       └── src/
│           ├── tools/        # post-tools, analytics-tools, account-tools, ai-tools
│           ├── config/       # env validation (Zod)
│           └── utils/        # response helpers
├── packages/
│   ├── publer-client/        # Publer REST API abstraction (posts, accounts, analytics)
│   └── shared-types/         # Zod schemas + TypeScript types shared across packages
└── .env.example
```

## Example conversations

```
"List my scheduled posts for this week"
→ calls list_scheduled_posts, returns content with dates and platforms

"Write a professional LinkedIn caption about our new product launch"
→ calls generate_caption_ai with tone=professional, returns caption + engagement score

"What hashtags should I use for Instagram fitness content?"
→ calls generate_hashtags, returns up to 30 platform-optimized tags

"Show me my content calendar for June"
→ calls content_calendar_view, returns posts grouped by day + gap days

"What's the best time to post on TikTok?"
→ calls get_best_posting_time, returns industry best-practice windows with confidence scores
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| MCP Protocol | `@modelcontextprotocol/sdk` 1.12 |
| AI generation | `@anthropic-ai/sdk` — Claude Haiku (`claude-haiku-4-5-20251001`) |
| Validation | Zod (env + shared types) |
| Runtime | Node.js 20+, TypeScript 5, ESM |
| Monorepo | pnpm workspaces |

## Development

```bash
# Type-check all packages
pnpm -r typecheck

# Run mcp-server in watch mode (no build step)
pnpm --filter @publer-mcp/mcp-server dev

# Inspect tools interactively
npx @modelcontextprotocol/inspector node apps/mcp-server/dist/index.js
```

## License

MIT
