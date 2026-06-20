import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'

export const getCourses = async (req: Request, res: Response) => {
  const user = req.user!

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', user.id)

  if (error) return res.status(400).json({ error: error.message })
  return res.json(data)
}

export const getCourseTasks = async (req: Request, res: Response) => {
  const user = (req as any).user
  const { id } = req.params

  // Verifica explícitamente que el curso pertenece a este usuario
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (courseError) return res.status(400).json({ error: courseError.message })
  if (!course) return res.status(404).json({ error: 'Curso no encontrado o no te pertenece' })

  const { data, error } = await supabase
    .from('tasks')
    .select('*, grades(score, max_score)')
    .eq('course_id', id)
    .order('due_date', { ascending: true })

  if (error) return res.status(400).json({ error: error.message })
  return res.json(data)
}