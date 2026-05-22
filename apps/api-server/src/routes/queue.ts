import { Router } from 'express'
import { getQueue } from '../queue/scheduler.js'

const router: Router = Router()

router.get('/jobs', async (_req, res, next) => {
  try {
    const q = getQueue()
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      q.getWaiting(0, 50),
      q.getActive(0, 50),
      q.getCompleted(0, 20),
      q.getFailed(0, 20),
      q.getDelayed(0, 50),
    ])
    res.json({
      success: true,
      data: { waiting, active, completed, failed, delayed },
    })
  } catch (err) {
    next(err)
  }
})

router.get('/health', async (_req, res, next) => {
  try {
    const q = getQueue()
    const counts = await q.getJobCounts()
    res.json({ success: true, data: counts })
  } catch (err) {
    next(err)
  }
})

export { router as queueRouter }
