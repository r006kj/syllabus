import { Request, Response } from 'express'
import { google } from 'googleapis'
import { supabase } from '../lib/supabase'
import { createOAuthClient, getAuthUrl } from '../lib/googleCalendar'

export const connectGoogleCalendar = async (req: Request, res: Response) => {
  const user = (req as any).user
  return res.json({ url: getAuthUrl(user.id) })
}
export const googleCalendarCallback = async (req: Request, res: Response) => {
  const { code, state } = req.query
  const client = createOAuthClient()

  const { tokens } = await client.getToken(code as string)
  console.log('Tokens recibidos:', tokens)

  await supabase.from('profiles').update({
    google_refresh_token: tokens.refresh_token
  }).eq('id', state as string)

  return res.send('Google Calendar conectado, puedes cerrar esta ventana.')
}
import { syncTasksToGoogleCalendar } from '../services/googleCalendarSync.service'

export const syncToGoogleCalendar = async (req: Request, res: Response) => {
  const user = (req as any).user
  const result = await syncTasksToGoogleCalendar(user.id)

  if (result.skipped) return res.status(400).json({ error: 'Google Calendar no conectado' })
  return res.json({ message: 'Sincronizado con Google Calendar', events: result.synced })
}