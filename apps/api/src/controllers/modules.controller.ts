import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'
import { fetchModules } from '../services/canvas.service'

export const getCourseModules = async (req: Request, res: Response) => {
  const user = (req as any).user
  if (!user || !user.id) {
    return res.status(401).json({ error: 'Usuario no autenticado o sesión expirada' })
  }

  const { id } = req.params

  const { data: course, error } = await supabase
    .from('courses')
    .select('canvas_course_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return res.status(400).json({ error: error.message })
  if (!course) return res.status(404).json({ error: 'Curso no encontrado' })

  const { data: profile } = await supabase
    .from('profiles')
    .select('canvas_token, canvas_domain')
    .eq('id', user.id)
    .single()

  if (!profile?.canvas_token) return res.status(400).json({ error: 'Canvas no conectado' })

  const modules = await fetchModules(profile.canvas_domain, profile.canvas_token, Number(course.canvas_course_id))

  return res.json(modules)
}