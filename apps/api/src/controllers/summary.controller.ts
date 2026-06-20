import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'
import { generateWeeklySummary } from '../services/weeklySummary.service'

const getWeekStart = () => {
  const date = new Date()
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(date)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

export const generateSummary = async (req: Request, res: Response) => {
  const user = (req as any).user

  const { data: profileData } = await supabase
    .from('profiles')
    .select('canvas_token, canvas_domain')
    .eq('id', user.id)
    .single()

  if (!profileData?.canvas_token) return res.status(400).json({ error: 'Canvas no conectado' })

  const { data: courses } = await supabase
    .from('courses')
    .select('id, canvas_course_id, name')
    .eq('user_id', user.id)
    .eq('is_primary', true)

  const courseSummaries: any[] = []

  for (const course of courses ?? []) {
    try {
      const summary = await generateWeeklySummary(
        profileData.canvas_domain,
        profileData.canvas_token,
        Number(course.canvas_course_id),
        course.name
      )
      courseSummaries.push({ course: course.name, ...summary })
    } catch {
      console.error('Error generando resumen para', course.name)
    }
  }

  const { data: saved, error } = await supabase
    .from('weekly_summaries')
    .upsert(
      { user_id: user.id, week_start: getWeekStart(), content: { courses: courseSummaries }, auto_generated: false },
      { onConflict: 'user_id,week_start' }
    )
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })
  return res.json(saved)
}

export const getSummaries = async (req: Request, res: Response) => {
  const user = (req as any).user

  const { data, error } = await supabase
    .from('weekly_summaries')
    .select('*')
    .eq('user_id', user.id)
    .order('week_start', { ascending: false })

  if (error) return res.status(400).json({ error: error.message })
  return res.json(data)
}

export const toggleAutoSummary = async (req: Request, res: Response) => {
  const user = (req as any).user
  const { auto_generated } = req.body

  const { error } = await supabase
    .from('profiles')
    .update({ weekly_summary_auto: auto_generated })
    .eq('id', user.id)

  if (error) return res.status(400).json({ error: error.message })
  return res.json({ message: 'Updated' })
}