import { Router } from 'express'
import { getCourseModules } from '../controllers/modules.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()
router.get('/:id/modules', authMiddleware, asyncHandler(getCourseModules))

export default router
