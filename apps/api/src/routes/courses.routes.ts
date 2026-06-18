import { Router } from 'express'
import { getCourses, getCourseTasks } from '../controllers/courses.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', authMiddleware, getCourses)
router.get('/:id/tasks', authMiddleware, getCourseTasks)

export default router