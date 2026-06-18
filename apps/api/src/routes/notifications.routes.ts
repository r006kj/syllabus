import { Router } from 'express'
import { getNotifications, markAsRead, updatePreferences, testRun } from '../controllers/notifications.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', authMiddleware, getNotifications)
router.patch('/:id/read', authMiddleware, markAsRead)
router.patch('/preferences', authMiddleware, updatePreferences)
router.post('/test-run', testRun)

export default router