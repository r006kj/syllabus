import { Router } from 'express'
import { getProfile, updateSemesterStart, updateAvatar, updateName } from '../controllers/profile.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import multer from 'multer'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })
const router = Router()

router.get('/', authMiddleware, getProfile)
router.patch('/semester-start', authMiddleware, updateSemesterStart)
router.patch('/', authMiddleware, updateName)
router.post('/avatar', authMiddleware, upload.single('avatar'), updateAvatar)

export default router
