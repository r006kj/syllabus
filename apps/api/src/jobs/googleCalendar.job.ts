import cron from 'node-cron'
import { supabase } from '../lib/supabase'
import { syncTasksToGoogleCalendar } from '../services/googleCalendarSync.service'

export const startGoogleCalendarJob = () => {
  cron.schedule('0 */6 * * *', async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .not('google_refresh_token', 'is', null)

    for (const profile of profiles ?? []) {
      await syncTasksToGoogleCalendar(profile.id)
    }

    console.log('Sync automático a Google Calendar completado')
  })

  console.log('Job de Google Calendar programado cada 6 horas')
}