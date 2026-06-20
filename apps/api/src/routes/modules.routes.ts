import { Router } from 'express'
import { getCourseModules } from '../controllers/modules.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()
router.get('/:id/modules', authMiddleware, getCourseModules)

export default router