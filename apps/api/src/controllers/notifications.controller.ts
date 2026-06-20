import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'

export const getNotifications = async (req: Request, res: Response) => {
  const user = req.user!

  const { data, error } = await supabase
    .from('notifications')
    .select('*, tasks(title, due_date)')
    .eq('user_id', user.id)
    .order('scheduled_for', { ascending: false })

  if (error) return res.status(400).json({ error: error.message })
  return res.json(data)
}

export const markAsRead = async (req: Request, res: Response) => {
  const user = req.user!
  const { id } = req.params

  // El filtro por user_id evita marcar notificaciones de otro usuario (IDOR).
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()

  if (error) return res.status(400).json({ error: error.message })
  if (!data || data.length === 0) return res.status(404).json({ error: 'Notificación no encontrada' })
  return res.json({ message: 'Marked as read' })
}

export const updatePreferences = async (req: Request, res: Response) => {
  const user = req.user!
  const { notify_hours_before, notifications_enabled } = req.body

  const { error } = await supabase
    .from('profiles')
    .update({ notify_hours_before, notifications_enabled })
    .eq('id', user.id)

  if (error) return res.status(400).json({ error: error.message })
  return res.json({ message: 'Preferences updated' })
}

import { checkUpcomingTasks } from '../jobs/notifications.job'

export const testRun = async (req: Request, res: Response) => {
  await checkUpcomingTasks()
  return res.json({ message: 'Test run completed' })
}