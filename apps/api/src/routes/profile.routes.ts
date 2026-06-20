import { Router } from 'express'
import { getProfile, updateSemesterStart } from '../controllers/profile.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()
router.get('/', authMiddleware, getProfile)
router.patch('/semester-start', authMiddleware, updateSemesterStart)

export default router