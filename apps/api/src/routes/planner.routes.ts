import { Router } from 'express'
import {
  generatePlan,
  getStudyBlocks,
  createStudyBlock,
  updateStudyBlock,
  deleteStudyBlock
} from '../controllers/planner.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.post('/generate', authMiddleware, generatePlan)
router.get('/study-blocks', authMiddleware, getStudyBlocks)
router.post('/study-blocks', authMiddleware, createStudyBlock)
router.patch('/study-blocks/:id', authMiddleware, updateStudyBlock)
router.delete('/study-blocks/:id', authMiddleware, deleteStudyBlock)

export default router