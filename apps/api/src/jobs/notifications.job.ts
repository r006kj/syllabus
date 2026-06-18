import cron from 'node-cron'
import { supabase } from '../lib/supabase'

export const checkUpcomingTasks = async () => {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, notify_hours_before, notifications_enabled')
    .eq('notifications_enabled', true)

  if (!profiles) return

  for (const profile of profiles) {
    const windowEnd = new Date(Date.now() + profile.notify_hours_before * 60 * 60 * 1000)

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, due_date, courses!inner(user_id)')
      .eq('courses.user_id', profile.id)
      .eq('status', 'pendiente')
      .lte('due_date', windowEnd.toISOString())
      .gte('due_date', new Date().toISOString())
      console.log(`Buscando tareas entre ahora y: ${windowEnd.toISOString()}`)

    if (!tasks) continue

    for (const task of tasks) {
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('task_id', task.id)
        .eq('type', 'vencimiento')
        .limit(1)

      if (existing && existing.length > 0) continue

      await supabase.from('notifications').insert({
        user_id: profile.id,
        task_id: task.id,
        type: 'vencimiento',
        scheduled_for: task.due_date,
        sent_at: new Date().toISOString()
      })
    }
  }

  console.log('Chequeo de notificaciones completado')
}

export const startNotificationsJob = () => {
  cron.schedule('0 * * * *', checkUpcomingTasks)
  console.log('Job de notificaciones programado cada hora')
}