import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'

/**
 * Verifica que la tarea pertenezca al usuario (vía el curso) antes de tocarla.
 * Evita IDOR: que un usuario modifique tareas de otro cambiando el id.
 */
const userOwnsTask = async (taskId: string, userId: string): Promise<boolean> => {
  const { data } = await supabase
    .from('tasks')
    .select('id, courses!inner(user_id)')
    .eq('id', taskId)
    .eq('courses.user_id', userId)
    .maybeSingle()
  return !!data
}

export const getTasks = async (req: Request, res: Response) => {
  const user = req.user!

  const { data, error } = await supabase
    .from('tasks')
    .select('*, courses!inner(user_id, name)')
    .eq('courses.user_id', user.id)
    .order('due_date', { ascending: true })

  if (error) return res.status(400).json({ error: error.message })
  return res.json(data)
}

export const getUpcomingTasks = async (req: Request, res: Response) => {
  const user = req.user!
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('tasks')
    .select('*, courses!inner(user_id, name)')
    .eq('courses.user_id', user.id)
    .gte('due_date', now)
    .order('due_date', { ascending: true })
    .limit(5)

  if (error) return res.status(400).json({ error: error.message })
  return res.json(data)
}

export const getOverloadedWeeks = async (req: Request, res: Response) => {
  const user = req.user!

  const { data, error } = await supabase
    .from('tasks')
    .select('due_date, title, courses!inner(user_id, name)')
    .eq('courses.user_id', user.id)
    .eq('status', 'pendiente')
    .not('due_date', 'is', null)

  if (error) return res.status(400).json({ error: error.message })

  const getWeekStart = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(date)
    monday.setDate(diff)
    monday.setHours(0, 0, 0, 0)
    return monday.toISOString().split('T')[0]
  }

  const weekMap: Record<string, any[]> = {}

  for (const task of data) {
    const key = getWeekStart(task.due_date)
    if (!weekMap[key]) weekMap[key] = []
    weekMap[key].push({ title: task.title, due_date: task.due_date })
  }

  const overloaded = Object.entries(weekMap)
    .filter(([, tasks]) => tasks.length >= 3)
    .map(([weekStart, tasks]) => {
      const start = new Date(weekStart)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return {
        week_start: weekStart,
        week_end: end.toISOString().split('T')[0],
        count: tasks.length,
        tasks
      }
    })

  return res.json(overloaded)
}
export const updateTask = async (req: Request, res: Response) => {
  const user = req.user!
  const id = String(req.params.id)
  const { status, complexity, estimated_hours } = req.body

  if (!(await userOwnsTask(id, user.id))) {
    return res.status(404).json({ error: 'Tarea no encontrada' })
  }

  const updates: any = {}
  if (status !== undefined) updates.status = status
  if (complexity !== undefined) updates.complexity = complexity
  if (estimated_hours !== undefined) updates.estimated_hours = estimated_hours

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })
  return res.json(data)
}