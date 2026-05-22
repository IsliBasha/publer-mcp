# Claude Desktop Configuration

This guide shows how to connect Claude Desktop to the Publer MCP server.

## Prerequisites

1. [Claude Desktop](https://claude.ai/download) installed
2. Node.js 20+ installed
3. Run `pnpm install && pnpm build` in the project root
4. `.env` file configured with your `PUBLER_API_KEY`

---

## macOS

Config file location: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "publer": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/publer-mcp/apps/mcp-server/dist/index.js"],
      "env": {
        "PUBLER_API_KEY": "your_publer_api_key_here",
        "ANTHROPIC_API_KEY": "your_anthropic_api_key_here",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

Replace `/ABSOLUTE/PATH/TO/publer-mcp` with your actual project path (run `pwd` in the project root).

---

## Windows

Config file location: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "publer": {
      "command": "node",
      "args": ["C:\\Users\\YourName\\publer-mcp\\apps\\mcp-server\\dist\\index.js"],
      "env": {
        "PUBLER_API_KEY": "your_publer_api_key_here",
        "ANTHROPIC_API_KEY": "your_anthropic_api_key_here"
      }
    }
  }
}
```

---

## Linux

Config file location: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "publer": {
      "command": "node",
      "args": ["/home/username/publer-mcp/apps/mcp-server/dist/index.js"],
      "env": {
        "PUBLER_API_KEY": "your_publer_api_key_here",
        "ANTHROPIC_API_KEY": "your_anthropic_api_key_here"
      }
    }
  }
}
```

---

## Verifying the Connection

1. Restart Claude Desktop after saving the config
2. Start a new conversation
3. Look for the publer server indicator in the toolbar
4. Try: "Show my connected social accounts"

---

## Available MCP Tools

| Tool | Example Prompt |
|------|----------------|
| `list_social_accounts` | "What accounts do I have connected?" |
| `create_post` | "Post this to LinkedIn now: [content]" |
| `schedule_post` | "Schedule a LinkedIn post for tomorrow at 9 AM" |
| `list_scheduled_posts` | "Show my content calendar" |
| `update_scheduled_post` | "Reschedule post abc123 to Friday" |
| `delete_post` | "Delete scheduled post abc123" |
| `get_followers` | "How many followers do I have?" |
| `get_post_analytics` | "Show analytics for post abc123" |
| `get_best_posting_time` | "When should I post on LinkedIn?" |
| `fetch_engagement_summary` | "Summarize my social performance this month" |
| `generate_caption_ai` | "Write a viral Instagram caption about our launch" |
| `generate_hashtags` | "Generate hashtags for a SaaS product post" |
| `content_calendar_view` | "Show my content calendar for this week" |

---

## Troubleshooting

**Server not appearing in Claude Desktop**
- Ensure the path in the config is absolute (not relative)
- Run `node /path/to/dist/index.js` directly to test for errors
- Check that `PUBLER_API_KEY` is set correctly

**Tool calls failing**
- Verify your Publer API key at https://app.publer.io/settings/api
- Check logs: set `LOG_LEVEL=debug` in the env config
- Ensure Docker services are running: `pnpm docker:up`

**MCP Inspector testing**
```bash
npx @modelcontextprotocol/inspector node apps/mcp-server/dist/index.js
```
