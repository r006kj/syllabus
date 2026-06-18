import { Router } from 'express'
import { addBlock, getSchedule, deleteBlock, uploadSchedule } from '../controllers/schedule.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import multer from 'multer'

const upload = multer({ storage: multer.memoryStorage() })
const router = Router()

router.get('/', authMiddleware, getSchedule)
router.post('/blocks', authMiddleware, addBlock)
router.delete('/blocks/:id', authMiddleware, deleteBlock)
router.post('/upload', authMiddleware, upload.single('image'), uploadSchedule)

export default router