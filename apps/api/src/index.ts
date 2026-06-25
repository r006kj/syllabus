import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes'
import canvasRoutes from './routes/canvas.routes'
import coursesRoutes from './routes/courses.routes'
import tasksRoutes from './routes/tasks.routes'
import moduleRoutes from './routes/modules.routes'
import syllabusRoutes from './routes/syllabus.routes'
import { startNotificationsJob } from './jobs/notifications.job'
import notificationsRoutes from './routes/notifications.routes'
import gradesRoutes from './routes/grades.routes'
import scheduleRoutes from './routes/schedule.routes'
import availabilityRoutes from './routes/availability.routes'
import plannerRoutes from './routes/planner.routes'
import notionRoutes from './routes/notion.routes'
import integrationsRoutes from './routes/integrations.routes'
import { startGoogleCalendarJob } from './jobs/googleCalendar.job'
import profileRoutes from './routes/profile.routes'
import summaryRoutes from './routes/summary.routes'
import supportRoutes from './services/support.routes'
import verificationRoutes from './routes/verification.routes'
import { errorHandler, notFoundHandler } from './middlewares/error.middleware'

startGoogleCalendarJob()
startNotificationsJob()

const app = express()
const PORT = process.env.PORT || 3000

// CORS restringido al/los origen(es) del frontend. Configura CORS_ORIGIN en .env
// (puede ser una lista separada por comas). Por defecto, el dev de Vite.
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())

app.set('trust proxy', 1)
app.use(
  cors({
    origin: (origin, callback) => {
      // Permite herramientas sin origin (curl, health checks) y los orígenes whitelisted.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
      return callback(new Error('Origen no permitido por CORS'))
    },
    credentials: true
  })
)
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})
app.use('/modules', moduleRoutes)
app.use('/courses', moduleRoutes) // Para listar cursos y verificar pertenencia (canvas_course_id)
app.use('/summaries', summaryRoutes)
app.use('/profile', profileRoutes)
app.use('/integrations', integrationsRoutes)
app.use('/integrations/notion', notionRoutes)
app.use('/planner', plannerRoutes)
app.use('/availability', availabilityRoutes)
app.use('/schedule', scheduleRoutes)
app.use('/grades', gradesRoutes)
app.use('/notifications', notificationsRoutes)
app.use('/syllabus', syllabusRoutes)
app.use('/auth', authRoutes)
app.use('/canvas', canvasRoutes)
app.use('/courses', coursesRoutes)
app.use('/tasks', tasksRoutes)

app.use('/support', supportRoutes)
app.use('/verification', verificationRoutes)

// 404 + manejador global de errores (deben ir al final).
app.use(notFoundHandler)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
