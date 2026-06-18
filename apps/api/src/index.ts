import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes'
import canvasRoutes from './routes/canvas.routes'
import coursesRoutes from './routes/courses.routes'
import tasksRoutes from './routes/tasks.routes'
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
startGoogleCalendarJob()
startNotificationsJob()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})
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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app