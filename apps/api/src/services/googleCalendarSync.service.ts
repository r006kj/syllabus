import { google } from 'googleapis'
import { supabase } from '../lib/supabase'
import { createOAuthClient } from '../lib/googleCalendar'

export const syncTasksToGoogleCalendar = async (userId: string) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('google_refresh_token')
    .eq('id', userId)
    .single()

  if (!profile?.google_refresh_token) return { synced: 0, skipped: true }

  const client = createOAuthClient()
  client.setCredentials({ refresh_token: profile.google_refresh_token })

  const calendar = google.calendar({ version: 'v3', auth: client })

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, due_date, google_event_id, courses!inner(user_id)')
    .eq('courses.user_id', userId)
    .eq('status', 'pendiente')
    .is('google_event_id', null)
    .not('due_date', 'is', null)

  let count = 0

  for (const task of tasks ?? []) {
    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: task.title,
        start: { dateTime: task.due_date },
        end: { dateTime: task.due_date },
        reminders: { useDefault: true }
      }
    })

    await supabase
      .from('tasks')
      .update({ google_event_id: event.data.id })
      .eq('id', task.id)

    count++
  }

  return { synced: count, skipped: false }
}