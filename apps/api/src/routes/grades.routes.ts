import { Router } from 'express'
import { getCourseGrades, getGradesOverview } from '../controllers/grades.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.get('/courses/:courseId', authMiddleware, getCourseGrades)
router.get('/overview', authMiddleware, getGradesOverview)

export default router