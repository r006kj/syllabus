import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'
import { extractSyllabusDates } from '../services/syllabus.service'
import { getCanvasCredentials } from '../services/profile.service'

export const extractSyllabus = async (req: Request, res: Response) => {
  const user = req.user!
  const { courseId } = req.params

  const credentials = await getCanvasCredentials(user.id)
  if (!credentials) return res.status(400).json({ error: 'Canvas not connected' })

  // Verifica que el curso pertenezca al usuario (IDOR).
  const { data: course } = await supabase
    .from('courses')
    .select('canvas_course_id, is_primary, name')
    .eq('id', courseId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!course) return res.status(404).json({ error: 'Course not found' })

  if (!course.is_primary) {
    return res.json({ message: `Este curso está vinculado a su versión teoría/lab, el sílabo ya fue procesado allí.` })
  }

  const result = await extractSyllabusDates(
    credentials.domain,
    credentials.token,
    Number(course.canvas_course_id)
  )

  if (!result.found) return res.json({ message: 'No syllabus file found', dates: [] })

  for (const item of result.dates) {
    await supabase.from('tasks').insert({
      course_id: courseId,
      title: item.title,
      type: item.type,
      due_date: item.due_date, // ahora derivado de la semana del sílabo
      status: 'pendiente'
    })
  }

  return res.json({ message: 'Syllabus processed', dates: result.dates })
}
