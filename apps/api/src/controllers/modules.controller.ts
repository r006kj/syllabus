import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'
import { fetchModules } from '../services/canvas.service'
import { getCanvasCredentials } from '../services/profile.service'

export const getCourseModules = async (req: Request, res: Response) => {
  const user = (req as any).user
  if (!user?.id) return res.status(401).json({ error: 'No autenticado' })

  const { id } = req.params

  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .select('canvas_course_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (courseErr) return res.status(400).json({ error: courseErr.message })
  if (!course)  return res.status(404).json({ error: 'Curso no encontrado' })

  if (!course.canvas_course_id) {
    return res.status(400).json({ error: 'Este curso no tiene ID de Canvas asociado' })
  }

  const credentials = await getCanvasCredentials(user.id)
  if (!credentials) return res.status(400).json({ error: 'Canvas no conectado' })

  try {
    const modules = await fetchModules(
      credentials.domain,
      credentials.token,
      Number(course.canvas_course_id)
    )
    return res.json(Array.isArray(modules) ? modules : [])
  } catch (err: any) {
    const status = err?.response?.status
    const canvasMsg: string = err?.response?.data?.message ?? err?.response?.data?.errors?.[0]?.message ?? ''
    const friendly =
      status === 401 ? 'Token de Canvas inválido o expirado'
      : status === 403 ? 'Sin permiso para ver módulos de este curso en Canvas'
      : status === 404 ? 'Curso no encontrado en Canvas'
      : canvasMsg || `Error al contactar Canvas (${status ?? 'red'})`

    console.error(`[modules] curso=${course.canvas_course_id} status=${status}`, canvasMsg || err?.message)
    return res.status(400).json({ error: friendly })
  }
}
