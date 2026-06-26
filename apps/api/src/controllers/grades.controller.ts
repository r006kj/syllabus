import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'

export const getCourseGrades = async (req: Request, res: Response) => {
  const user = req.user!
  const { courseId } = req.params

  // Verifica que el curso pertenezca al usuario.
  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!course) return res.status(404).json({ error: 'Curso no encontrado' })

  const { data, error } = await supabase
    .from('tasks')
    .select('title, due_date, grades(score, max_score)')
    .eq('course_id', courseId)

  if (error) return res.status(400).json({ error: error.message })
  return res.json(data)
}

export const getGradesOverview = async (req: Request, res: Response) => {
  const user = req.user!

  const { data, error } = await supabase
    .from('courses')
    .select('id, name, group_key, tasks(title, grades(score, max_score))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return res.status(400).json({ error: error.message })

  // Group by group_key; aggregate grades from all sections
  const groups = new Map<string, { name: string; grades: { score: number; max_score: number }[] }>()

  for (const course of data as any[]) {
    const gk: string = course.group_key ?? course.id
    const courseGrades = (course.tasks as any[])
      .flatMap((t: any) => t.grades as any[])
      .filter((g: any) => g?.score != null && g?.max_score)

    if (!groups.has(gk)) {
      // Strip trailing section number " - N" for display
      const displayName: string = (course.name as string).replace(/\s*-\s*\d+$/, '').trim()
      groups.set(gk, { name: displayName, grades: [] })
    }
    groups.get(gk)!.grades.push(...courseGrades)
  }

  const overview = Array.from(groups.values()).map(({ name, grades }) => {
    const averagePercentage = grades.length
      ? grades.reduce((sum, g) => sum + (g.score / g.max_score) * 100, 0) / grades.length
      : null

    return {
      course: name,
      average: averagePercentage != null ? Math.round((averagePercentage / 100) * 20 * 10) / 10 : null,
      graded_tasks: grades.length
    }
  })

  return res.json(overview)
}

export const addTaskGrade = async (req: Request, res: Response) => {
  const user = req.user!
  const { task_id, score, max_score } = req.body

  // Verificar que la tarea pertenece al usuario
  const { data: task } = await supabase
    .from('tasks')
    .select('id, courses!inner(user_id)')
    .eq('id', task_id)
    .eq('courses.user_id', user.id)
    .maybeSingle()

  if (!task) return res.status(404).json({ error: 'Tarea no encontrada' })

  const { data, error } = await supabase
    .from('grades')
    .upsert({ task_id, score, max_score }, { onConflict: 'task_id' })
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })

  // Marcar tarea como entregada si no lo estaba
  await supabase.from('tasks').update({ status: 'entregado' }).eq('id', task_id)

  return res.json(data)
}