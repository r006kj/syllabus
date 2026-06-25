import { Router } from 'express'
import multer from 'multer'
import { sendReport } from '../controllers/support.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })
const router = Router()

router.post('/report', authMiddleware, upload.any(), sendReport)

export default router
