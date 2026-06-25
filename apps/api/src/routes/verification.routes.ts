import { Router } from 'express'
import { sendCode, verifyCode } from '../controllers/verification.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()
router.post('/send-code',   authMiddleware, sendCode)
router.post('/verify-code', authMiddleware, verifyCode)
export default router
