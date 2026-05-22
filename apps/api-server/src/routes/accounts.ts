import { Router } from 'express'
import { createPublerServices } from '@publer-mcp/publer-client'
import { env } from '../config/env.js'

const router: Router = Router()
const services = createPublerServices(env.PUBLER_API_KEY)

router.get('/', async (_req, res, next) => {
  try {
    const accounts = await services.accounts.listAccounts()
    res.json({ success: true, data: accounts })
  } catch (err) {
    next(err)
  }
})

export { router as accountsRouter }
