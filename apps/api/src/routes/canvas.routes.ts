import { Router } from 'express'
import { connect, sync, disconnect } from '../controllers/canvas.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.post('/connect', authMiddleware, connect)
router.get('/sync', authMiddleware, sync)
router.delete('/disconnect', authMiddleware, disconnect)

export default router