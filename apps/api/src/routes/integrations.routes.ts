import { Router } from 'express'
import { connectGoogleCalendar, googleCalendarCallback, syncToGoogleCalendar } from '../controllers/integrations.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.get('/google-calendar/connect', authMiddleware, connectGoogleCalendar)
router.get('/google-calendar/callback', googleCalendarCallback)
router.post('/google-calendar/sync', authMiddleware, syncToGoogleCalendar)

export default router