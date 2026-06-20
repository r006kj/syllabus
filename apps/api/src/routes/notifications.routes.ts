import { Router } from 'express'
import { getNotifications, markAsRead, updatePreferences, testRun } from '../controllers/notifications.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

router.get('/', authMiddleware, asyncHandler(getNotifications))
router.patch('/:id/read', authMiddleware, asyncHandler(markAsRead))
router.patch('/preferences', authMiddleware, asyncHandler(updatePreferences))
// Antes era público: ahora exige autenticación.
router.post('/test-run', authMiddleware, asyncHandler(testRun))

export default router
