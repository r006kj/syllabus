import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'

// All courses sharing the same group_key as :id (theory + lab sections)
export const getGroupCourses = async (req: Request, res: Response) => {
  const user = req.user!
  const { id } = req.params

  const { data: base } = await supabase
    .from('courses')
    .select('group_key')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!base) return res.status(404).json({ error: 'Curso no encontrado' })

  const { data, error } = await supabase
    .from('courses')
    .select('id, name, is_primary, canvas_course_id')
    .eq('user_id', user.id)
    .eq('group_key', base.group_key)
    .order('is_primary', { ascending: false })  // primary (theory) first

  if (error) return res.status(400).json({ error: error.message })
  return res.json(data ?? [])
}

export const getCourseById = async (req: Request, res: Response) => {
  const user = req.user!
  const { id } = req.params

  const { data, error } = await supabase
    .from('courses')
    .select('id, name, is_primary, canvas_course_id, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return res.status(400).json({ error: error.message })
  if (!data)  return res.status(404).json({ error: 'Curso no encontrado' })
  return res.json(data)
}

export const getCourses = async (req: Request, res: Response) => {
  const user = req.user!

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return res.status(400).json({ error: error.message })

  // Group by group_key: use the primary (or oldest) course as representative per group
  const groups = new Map<string, any>()

  for (const course of data as any[]) {
    const gk: string = course.group_key ?? course.id

    if (!groups.has(gk)) {
      // First seen for this group → store with display name
      groups.set(gk, {
        ...course,
        name: (course.name as string).replace(/\s*-\s*\d+$/, '').trim(),
        _section_count: 1,
      })
    } else {
      const existing = groups.get(gk)!
      existing._section_count++
      // If this course is explicitly primary, promote it as representative
      if (course.is_primary && !existing.is_primary) {
        groups.set(gk, {
          ...course,
          name: (course.name as string).replace(/\s*-\s*\d+$/, '').trim(),
          _section_count: existing._section_count,
        })
      }
    }
  }

  return res.json(Array.from(groups.values()))
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