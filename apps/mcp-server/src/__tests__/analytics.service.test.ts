import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AnalyticsService } from '@publer-mcp/publer-client'

const mockClient = {
  get: vi.fn(),
}

describe('AnalyticsService', () => {
  let service: AnalyticsService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new AnalyticsService(mockClient as any)
  })

  describe('getFollowers', () => {
    it('maps API response to FollowerMetrics array', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              account_id: 'acc-1',
              followers_count: 5000,
              following_count: 200,
              data: [
                { date: '2024-01-01', count: 4900 },
                { date: '2024-01-08', count: 5000 },
              ],
            },
          ],
        },
      })

      const result = await service.getFollowers()
      expect(result).toHaveLength(1)
      expect(result[0].accountId).toBe('acc-1')
      expect(result[0].followers).toBe(5000)
      expect(result[0].growthThisWeek).toBe(100)
    })

    it('handles empty historical data gracefully', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              account_id: 'acc-2',
              followers_count: 1000,
              following_count: 50,
              data: [],
            },
          ],
        },
      })

      const result = await service.getFollowers()
      expect(result[0].growthThisWeek).toBe(0)
      expect(result[0].growthPercent).toBe(0)
    })

    it('uses account-specific URL when accountId is provided', async () => {
      mockClient.get.mockResolvedValueOnce({ data: { data: [] } })
      await service.getFollowers('my-account')
      expect(mockClient.get).toHaveBeenCalledWith('/analytics/followers/my-account')
    })

    it('uses generic URL when no accountId provided', async () => {
      mockClient.get.mockResolvedValueOnce({ data: { data: [] } })
      await service.getFollowers()
      expect(mockClient.get).toHaveBeenCalledWith('/analytics/followers')
    })
  })

  describe('getPostAnalytics', () => {
    it('maps API response to PostAnalytics with engagement score', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: {
          data: {
            post_id: 'post-1',
            likes: 100,
            comments: 20,
            shares: 10,
            reach: 5000,
            impressions: 8000,
            clicks: 50,
            saves: 15,
            engagement_rate: 3.5,
          },
        },
      })

      const result = await service.getPostAnalytics('post-1')
      expect(result.postId).toBe('post-1')
      expect(result.metrics.likes).toBe(100)
      expect(result.metrics.engagementRate).toBe(3.5)
      expect(result.metrics.engagementScore).toBe(35)
    })

    it('caps engagement score at 100', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: {
          data: {
            post_id: 'post-2',
            likes: 0, comments: 0, shares: 0, reach: 0, impressions: 0, clicks: 0, saves: 0,
            engagement_rate: 150,
          },
        },
      })

      const result = await service.getPostAnalytics('post-2')
      expect(result.metrics.engagementScore).toBe(100)
    })
  })

  describe('getBestPostingTime', () => {
    it('maps recommendations with correct confidence levels', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: {
          data: [
            { day: 'Monday', hour: 9, boost: 40 },
            { day: 'Friday', hour: 17, boost: 20 },
            { day: 'Sunday', hour: 12, boost: 5 },
          ],
        },
      })

      const result = await service.getBestPostingTime('linkedin')
      expect(result.platform).toBe('linkedin')
      expect(result.recommendations[0].confidence).toBe('high')
      expect(result.recommendations[1].confidence).toBe('medium')
      expect(result.recommendations[2].confidence).toBe('low')
    })
  })
})
