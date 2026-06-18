import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'

export const getCourses = async (req: Request, res: Response) => {
  const user = (req as any).user

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', user.id)

  if (error) return res.status(400).json({ error: error.message })
  return res.json(data)
}

export const getCourseTasks = async (req: Request, res: Response) => {
  const { id } = req.params

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('course_id', id)
    .order('due_date', { ascending: true })

  if (error) return res.status(400).json({ error: error.message })
  return res.json(data)
}