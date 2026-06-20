import { Router } from 'express'
import { generateSummary, getSummaries, toggleAutoSummary } from '../controllers/summary.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()
router.post('/generate', authMiddleware, generateSummary)
router.get('/', authMiddleware, getSummaries)
router.patch('/auto', authMiddleware, toggleAutoSummary)

export default router