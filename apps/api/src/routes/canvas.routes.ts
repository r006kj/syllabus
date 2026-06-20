import { Router } from 'express'
import { connect, sync, disconnect } from '../controllers/canvas.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

router.post('/connect', authMiddleware, asyncHandler(connect))
// POST: muta datos y llama a servicios externos; ya no es un GET.
router.post('/sync', authMiddleware, asyncHandler(sync))
router.delete('/disconnect', authMiddleware, asyncHandler(disconnect))

export default router
