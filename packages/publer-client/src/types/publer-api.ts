// Raw Publer REST API response types (not exported publicly — internal to this package)
// Verified against live API responses 2026-05-23.

// GET /posts returns { posts: PublerApiPost[], total: number }
export interface PublerApiPost {
  id: string
  text: string
  state: 'draft' | 'scheduled' | 'published' | 'failed'  // API uses "state", not "status"
  scheduled_at: string | null
  published_at: string | null
  account_id: string   // single ID, not an accounts array
  updated_at: string
}

export interface PublerApiPostsResponse {
  posts: PublerApiPost[]
  total: number
}

// GET /accounts returns PublerApiAccount[] directly (no wrapper object)
export interface PublerApiAccount {
  id: string
  provider: string   // platform: "facebook", "twitter", "mastodon", etc.
  type: string       // subtype: "fb_page", "mastodon", etc.
  name: string
  username?: string
  picture: string | null
  locked: boolean    // true = not accessible / disconnected
  social_id: string
}

export interface PublerApiError {
  message: string
  errors?: Record<string, string[]>
  status: number
}
