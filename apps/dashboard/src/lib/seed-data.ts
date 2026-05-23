import type { Message, ToolCall } from '@/types/chat'

const now = Date.now()
const ago = (ms: number) => new Date(now - ms)

export const SEED_ACCOUNTS = [
  { id: 'acc-1', platform: 'linkedin', handle: 'Isli Basha' },
  { id: 'acc-2', platform: 'instagram', handle: '@islibasha' },
  { id: 'acc-3', platform: 'twitter', handle: '@isli' },
]

const tc1: ToolCall = {
  id: 'tc-init',
  tool: 'list_social_accounts',
  params: {},
  status: 'done',
  result: { accounts: SEED_ACCOUNTS, total: 3 },
  duration: 312,
  startedAt: ago(4.5 * 60_000),
}

const tc2: ToolCall = {
  id: 'tc-list',
  tool: 'list_scheduled_posts',
  params: { platform: 'linkedin', limit: 10 },
  status: 'done',
  result: {
    total: 2,
    posts: [
      {
        id: 'p1',
        platform: 'linkedin',
        content: 'Excited to share our latest AI-powered scheduling update — Publer MCP is now live for all accounts.',
        scheduledAt: '2026-05-27T09:00:00Z',
        status: 'scheduled',
      },
      {
        id: 'p2',
        platform: 'linkedin',
        content: 'Meet the team behind Publer MCP: building the future of social media management, one Claude conversation at a time.',
        scheduledAt: '2026-05-29T14:00:00Z',
        status: 'scheduled',
      },
    ],
  },
  duration: 621,
  startedAt: ago(3 * 60_000),
}

const tc3: ToolCall = {
  id: 'tc-caption',
  tool: 'generate_caption_ai',
  params: {
    platform: 'linkedin',
    topic: 'Publer MCP integration product launch',
    tone: 'professional',
  },
  status: 'done',
  result: {
    caption: 'Announcing something we have been building for months: Publer MCP.',
    hashtags: ['#SocialMedia', '#AITools', '#ProductLaunch', '#ContentCreation', '#Publer'],
    characterCount: 412,
    estimatedEngagementBoost: '23%',
  },
  duration: 1847,
  startedAt: ago(1.5 * 60_000),
}

export const SEED_TOOL_CALLS: ToolCall[] = [tc1, tc2, tc3]

export const SEED_MESSAGES: Message[] = [
  {
    id: 'seed-0',
    role: 'assistant',
    content: 'Workspace connected. I can see 3 linked accounts: LinkedIn (Isli Basha), Instagram (@islibasha), and Twitter/X (@isli). Ready to help with scheduling, content, and analytics.',
    toolCalls: [tc1],
    timestamp: ago(4 * 60_000),
  },
  {
    id: 'seed-1',
    role: 'user',
    content: 'What LinkedIn posts do I have scheduled this week?',
    timestamp: ago(3.2 * 60_000),
  },
  {
    id: 'seed-2',
    role: 'assistant',
    content: 'You have 2 LinkedIn posts scheduled this week:\n\nTuesday, May 27 at 9:00 AM\n"Excited to share our latest AI-powered scheduling update — Publer MCP is now live for all accounts."\n\nThursday, May 29 at 2:00 PM\n"Meet the team behind Publer MCP: building the future of social media management, one Claude conversation at a time."\n\nBoth posts are queued and ready to publish. Want me to adjust the timing or generate additional content?',
    toolCalls: [tc2],
    timestamp: ago(2.8 * 60_000),
  },
  {
    id: 'seed-3',
    role: 'user',
    content: 'Generate a LinkedIn caption for a post about the Publer MCP integration launch',
    timestamp: ago(1.8 * 60_000),
  },
  {
    id: 'seed-4',
    role: 'assistant',
    content: 'Here is a caption optimized for LinkedIn reach:\n\n---\nAnnouncing something we have been building for months: Publer MCP.\n\nSchedule posts, generate captions, and analyze performance — all through a natural language conversation with Claude. No switching tabs. No manual scheduling. Just tell Claude what you need.\n\nThe future of social media management is not a better dashboard. It is not needing one.\n\n#SocialMedia #AITools #ProductLaunch #ContentCreation #Publer\n---\n\nAt 412 characters this stays under LinkedIn\'s algorithm sweet spot. Posts with 3-5 hashtags typically see 23% higher engagement. Want me to schedule it?',
    toolCalls: [tc3],
    timestamp: ago(1 * 60_000),
  },
]
