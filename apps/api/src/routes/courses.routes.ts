import { Router } from 'express'
import { getCourses, getCourseById, getCourseTasks, getGroupCourses } from '../controllers/courses.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.get('/',            authMiddleware, getCourses)
router.get('/:id/group',  authMiddleware, getGroupCourses)
router.get('/:id/tasks',  authMiddleware, getCourseTasks)
router.get('/:id',        authMiddleware, getCourseById)

export default router
