import { Router } from 'express'
import { generatePlan, getStudyBlocks } from '../controllers/planner.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.post('/generate', authMiddleware, generatePlan)
router.get('/study-blocks', authMiddleware, getStudyBlocks)

export default router