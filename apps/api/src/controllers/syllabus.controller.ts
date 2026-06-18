import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'
import { extractSyllabusDates } from '../services/syllabus.service'

export const extractSyllabus = async (req: Request, res: Response) => {
  const user = (req as any).user
  const { courseId } = req.params

  const { data: userData } = await supabase
    .from('profiles')
    .select('canvas_token, canvas_domain')
    .eq('id', user.id)
    .single()

  if (!userData?.canvas_token) return res.status(400).json({ error: 'Canvas not connected' })

  const { canvas_token, canvas_domain } = userData

const { data: course } = await supabase
  .from('courses')
  .select('canvas_course_id, is_primary, name')
  .eq('id', courseId)
  .single()

if (!course) return res.status(404).json({ error: 'Course not found' })

if (!course.is_primary) {
  return res.json({ message: `Este curso está vinculado a su versión teoría/lab, el sílabo ya fue procesado allí.` })
}
  const result = await extractSyllabusDates(canvas_domain, canvas_token, Number(course.canvas_course_id))

  if (!result.found) return res.json({ message: 'No syllabus file found', dates: [] })

  for (const item of result.dates) {
    await supabase.from('tasks').insert({
      course_id: courseId,
      title: item.title,
      type: item.type,
      status: 'pendiente'
    })
  }

  return res.json({ message: 'Syllabus processed', dates: result.dates })
}