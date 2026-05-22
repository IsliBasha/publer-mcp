import { Router } from 'express'
import { createPublerServices } from '@publer-mcp/publer-client'
import { env } from '../config/env.js'

const router: Router = Router()
const services = createPublerServices(env.PUBLER_API_KEY)

router.get('/followers', async (req, res, next) => {
  try {
    const metrics = await services.analytics.getFollowers(req.query.accountId as string)
    res.json({ success: true, data: metrics })
  } catch (err) {
    next(err)
  }
})

router.get('/posts/:postId', async (req, res, next) => {
  try {
    const analytics = await services.analytics.getPostAnalytics(req.params.postId)
    res.json({ success: true, data: analytics })
  } catch (err) {
    next(err)
  }
})

router.get('/best-time', async (req, res, next) => {
  try {
    const platform = req.query.platform as string
    const timing = await services.analytics.getBestPostingTime(
      platform as any,
      req.query.accountId as string
    )
    res.json({ success: true, data: timing })
  } catch (err) {
    next(err)
  }
})

export { router as analyticsRouter }
