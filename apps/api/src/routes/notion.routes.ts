import { Router } from 'express'
import { syncToNotion } from '../controllers/notion.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()
router.post('/sync', authMiddleware, syncToNotion)
export default router