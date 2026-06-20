import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'
import { fetchCourses, fetchAssignments } from '../services/canvas.service'
import { normalizeCourseName } from '../utils/normalizeCourseName'
import { isRealCourse } from '../utils/isRealCourse'
import { syncTasksToGoogleCalendar } from '../services/googleCalendarSync.service'
import { getCanvasCredentials } from '../services/profile.service'
import { encrypt } from '../utils/crypto'
import { requireFields } from '../utils/validate'

export const connect = async (req: Request, res: Response) => {
  const { canvas_token, canvas_domain } = req.body
  const user = req.user!
  requireFields(req.body, ['canvas_token', 'canvas_domain'])

  const { error } = await supabase
    .from('profiles')
    // El token se guarda cifrado en reposo (AES-256-GCM).
    .upsert({ id: user.id, canvas_token: encrypt(canvas_token), canvas_domain, email: user.email })

  if (error) return res.status(400).json({ error: error.message })
  return res.json({ message: 'Canvas connected' })
}

export const sync = async (req: Request, res: Response) => {
  const user = req.user!

  const credentials = await getCanvasCredentials(user.id)
  if (!credentials) return res.status(400).json({ error: 'Canvas not connected' })

  const { domain: canvas_domain, token: canvas_token } = credentials
  const courses = await fetchCourses(canvas_domain, canvas_token)
  const realCourses = courses.filter((c: any) => isRealCourse(c.name))

  let coursesSynced = 0
  let tasksSynced = 0

  for (const course of realCourses) {
    const groupKey = normalizeCourseName(course.name)

    const { data: existingGroup } = await supabase
      .from('courses')
      .select('id')
      .eq('user_id', user.id)
      .eq('group_key', groupKey)
      .limit(1)

    const isPrimary = !existingGroup || existingGroup.length === 0

    const { data: savedCourse, error: courseError } = await supabase
      .from('courses')
      .upsert({
        user_id: user.id,
        canvas_course_id: course.id.toString(),
        name: course.name,
        semester: course.term?.name ?? 'current',
        group_key: groupKey,
        is_primary: isPrimary
      }, { onConflict: 'user_id,canvas_course_id' })
      .select()
      .single()

    if (courseError || !savedCourse) {
      console.error('Error guardando curso:', course.name, courseError?.message)
      continue
    }
    coursesSynced++

    const assignments = await fetchAssignments(canvas_domain, canvas_token, course.id)

    for (const a of assignments as any[]) {
      const { data: savedTask, error: taskError } = await supabase
        .from('tasks')
        .upsert({
          course_id: savedCourse.id,
          canvas_assignment_id: a.id.toString(),
          title: a.name,
          description: a.description,
          due_date: a.due_at,
          type: 'tarea',
          status: a.submission?.workflow_state === 'graded' ? 'entregado' : 'pendiente'
        }, { onConflict: 'course_id,canvas_assignment_id' })
        .select()
        .single()

      if (taskError) {
        console.error('Error guardando tarea:', a.name, taskError.message)
        continue
      }
      tasksSynced++

      if (a.submission?.score != null && a.points_possible) {
        const { error: gradeError } = await supabase.from('grades').upsert({
          task_id: savedTask.id,
          score: a.submission.score,
          max_score: a.points_possible
        })

        if (gradeError) {
          console.error('Error guardando nota:', a.name, gradeError.message)
        }
      }
    }
  }

  const calendarResult = await syncTasksToGoogleCalendar(user.id)

  return res.json({
    message: 'Sincronización completada',
    courses: coursesSynced,
    tasks: tasksSynced,
    calendar: calendarResult
  })
}

export const disconnect = async (req: Request, res: Response) => {
  const user = req.user!

  const { error } = await supabase
    .from('profiles')
    .update({ canvas_token: null, canvas_domain: null })
    .eq('id', user.id)

  if (error) return res.status(400).json({ error: error.message })
  return res.json({ message: 'Canvas disconnected' })
}
