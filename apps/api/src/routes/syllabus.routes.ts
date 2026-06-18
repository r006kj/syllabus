import { Router } from 'express'
import { extractSyllabus } from '../controllers/syllabus.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.post('/:courseId/extract', authMiddleware, extractSyllabus)

export default router