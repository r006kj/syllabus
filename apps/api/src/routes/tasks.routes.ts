import { Router } from 'express'
import { getTasks, getUpcomingTasks, getOverloadedWeeks } from '../controllers/tasks.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', authMiddleware, getTasks)
router.get('/upcoming', authMiddleware, getUpcomingTasks)
router.get('/overloaded-weeks', authMiddleware, getOverloadedWeeks)

export default router