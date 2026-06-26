import { Router } from 'express'
import { getPending, getStats, getHistory, recordAttendance, deleteAttendance } from '../controllers/attendance.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

router.get('/pending',          authMiddleware, asyncHandler(getPending))
router.get('/stats',            authMiddleware, asyncHandler(getStats))
router.get('/history/:courseId',authMiddleware, asyncHandler(getHistory))
router.post('/',                authMiddleware, asyncHandler(recordAttendance))
router.delete('/:id',           authMiddleware, asyncHandler(deleteAttendance))

export default router
