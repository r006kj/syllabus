import { Router } from 'express'
import { register, login, logout, me } from '../controllers/auth.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { asyncHandler } from '../utils/asyncHandler'
import { rateLimit } from '../middlewares/rateLimit.middleware'

const router = Router()

// Limita intentos de registro/login para frenar fuerza bruta.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 })

router.post('/register', authLimiter, asyncHandler(register))
router.post('/login', authLimiter, asyncHandler(login))
router.post('/logout', asyncHandler(logout))
router.get('/me', authMiddleware, asyncHandler(me))

export default router
