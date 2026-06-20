import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'

export const getProfile = async (req: Request, res: Response) => {
  const user = (req as any).user

  const { data, error } = await supabase
    .from('profiles')
    .select('canvas_domain, canvas_token, google_refresh_token, notify_hours_before, notifications_enabled, semester_start')
    .eq('id', user.id)
    .single()

  if (error) return res.status(400).json({ error: error.message })

  return res.json({
    canvas_connected: !!data.canvas_domain,
    canvas_domain: data.canvas_domain,
    google_connected: !!data.google_refresh_token,
    notify_hours_before: data.notify_hours_before ?? 24,
    notifications_enabled: data.notifications_enabled ?? true,
    semester_start: data.semester_start
  })
}

export const updateSemesterStart = async (req: Request, res: Response) => {
  const user = (req as any).user
  const { semester_start } = req.body

  const { error } = await supabase
    .from('profiles')
    .update({ semester_start })
    .eq('id', user.id)

  if (error) return res.status(400).json({ error: error.message })
  return res.json({ message: 'Fecha de inicio actualizada' })
}