# Publer MCP — AI-Native Social Media Platform

> A production-grade Model Context Protocol server connecting Claude Desktop to Publer's social media management platform. Schedule posts, analyze engagement, and run AI-powered campaigns through natural language.

## Architecture

```
Claude Desktop (MCP Client)
       │  stdio (JSON-RPC 2.0)
       ▼
┌──────────────────────────┐
│   MCP Server             │
│   13 tools · 2 resources │
│   3 prompt templates     │
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│   Application Services   │
│   Posts · Analytics      │
│   Accounts · AI          │
└──────────┬───────────────┘
           ▼
┌──────────────────────────────────────────┐
│           Infrastructure                  │
│  Publer REST API │ PostgreSQL │ BullMQ    │
│  Redis           │ Socket.IO  │ Pino logs │
└──────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────┐
│   Next.js Dashboard      │
│   Real-time · Analytics  │
│   Calendar · AI Chat     │
└──────────────────────────┘
```

## MCP Tools (13 tools)

| Tool | Description |
|------|-------------|
| `create_post` | Publish immediately to one or more platforms |
| `schedule_post` | Schedule for future datetime with timezone support |
| `list_scheduled_posts` | List upcoming content with filters |
| `update_scheduled_post` | Edit content, reschedule, swap platforms |
| `delete_post` | Remove scheduled or published content |
| `get_followers` | Follower counts and growth trends |
| `get_post_analytics` | Engagement metrics for specific posts |
| `get_best_posting_time` | AI-powered optimal posting time analysis |
| `fetch_engagement_summary` | Executive analytics summary with AI insights |
| `list_social_accounts` | Connected accounts across all platforms |
| `generate_caption_ai` | AI caption generation with tone control |
| `generate_hashtags` | Platform-optimized hashtag generation |
| `content_calendar_view` | Calendar-friendly scheduled content view |

## Example AI Conversations

```
You: "How many followers do I have across all platforms?"
Claude: [calls get_followers] LinkedIn: 12,400 (+3.2%), Instagram: 28,100 (+8.7%)

You: "Schedule a motivational LinkedIn post for tomorrow at 9 AM"
Claude: [calls generate_caption_ai → schedule_post] Post scheduled ✓

You: "Generate hashtags for a SaaS product launch"
Claude: [calls generate_hashtags] #SaaS #ProductLaunch #B2BSoftware ...

You: "Show my best performing post this month"
Claude: [calls get_post_analytics] Dec 15 post: 24,800 reach, 6.8% engagement rate
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| MCP Protocol | `@modelcontextprotocol/sdk` (official Anthropic) |
| Backend | TypeScript, Node.js, Express |
| Validation | Zod (runtime + type safety) |
| Database | PostgreSQL 16 + Prisma ORM |
| Queue | BullMQ + Redis 7 |
| Real-time | Socket.IO WebSockets |
| Frontend | Next.js 14, Tailwind CSS, Recharts |
| Logging | Pino (structured, secret-redacting) |
| Monorepo | pnpm workspaces + Turborepo |
| Container | Docker + Docker Compose |

## Quick Start

```bash
# 1. Install
git clone https://github.com/your-org/publer-mcp && cd publer-mcp
pnpm install

# 2. Configure
cp .env.example .env
# Add PUBLER_API_KEY to .env

# 3. Start infrastructure
pnpm docker:up && pnpm db:migrate && pnpm db:seed

# 4. Run
pnpm build && pnpm dev
```

Services: Dashboard → http://localhost:3000 | API → http://localhost:3001

## Claude Desktop Setup

See [docs/claude-desktop-config.md](docs/claude-desktop-config.md) for platform-specific config (macOS/Windows/Linux).

## Project Structure

```
publer-mcp/
├── apps/
│   ├── mcp-server/        # MCP stdio server — 13 tools
│   ├── api-server/        # Express + Socket.IO + BullMQ
│   │   └── prisma/        # Database schema
│   └── dashboard/         # Next.js real-time UI
├── packages/
│   ├── publer-client/     # Publer API abstraction layer
│   ├── shared-types/      # Zod schemas + TypeScript types
│   ├── ai-services/       # AI content generation
│   └── queue-system/      # BullMQ job definitions
├── docs/
└── docker-compose.yml
```

## Reliability

- Retry handling with exponential backoff (3 attempts)
- Queue persistence — posts survive server restarts
- Graceful degradation — API errors never crash MCP server
- Secret masking — API keys redacted from all logs
- Startup env validation — fails fast on misconfiguration

## API Abstraction

All Publer API calls flow through `packages/publer-client`. To swap providers, only that package changes — MCP tools, dashboard, and queue system are unaffected.

## Testing

```bash
pnpm test
npx @modelcontextprotocol/inspector node apps/mcp-server/dist/index.js
```

## License

MIT
