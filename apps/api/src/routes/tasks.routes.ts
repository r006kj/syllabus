import { Router } from 'express'
import { getTasks, getUpcomingTasks, getOverloadedWeeks, updateTask } from '../controllers/tasks.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

router.get('/', authMiddleware, asyncHandler(getTasks))
router.get('/upcoming', authMiddleware, asyncHandler(getUpcomingTasks))
router.get('/overloaded-weeks', authMiddleware, asyncHandler(getOverloadedWeeks))
router.patch('/:id', authMiddleware, asyncHandler(updateTask))

export default router
