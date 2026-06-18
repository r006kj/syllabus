import { Router } from 'express'
import { getAvailability, addAvailability } from '../controllers/availability.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', authMiddleware, getAvailability)
router.post('/', authMiddleware, addAvailability)

export default router