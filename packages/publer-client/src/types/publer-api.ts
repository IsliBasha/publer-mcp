// Raw Publer REST API response types (not exported publicly — internal to this package)

export interface PublerApiPost {
  id: string
  text: string
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  scheduled_at: string | null
  published_at: string | null
  accounts: Array<{
    id: string
    type: string
    name: string
    username: string
  }>
  media: Array<{ url: string; type: 'image' | 'video' }>
  created_at: string
  updated_at: string
}

export interface PublerApiAccount {
  id: string
  type: string
  name: string
  username: string
  avatar_url: string | null
  workspace_id: string
  is_connected: boolean
  connected_at: string
}

export interface PublerApiFollowers {
  account_id: string
  followers_count: number
  following_count: number
  data: Array<{ date: string; count: number }>
}

export interface PublerApiAnalytics {
  post_id: string
  likes: number
  comments: number
  shares: number
  reach: number
  impressions: number
  clicks: number
  saves: number
  engagement_rate: number
}

export interface PublerApiError {
  message: string
  errors?: Record<string, string[]>
  status: number
}
