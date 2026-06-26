import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'
import { createOAuthClient, getAuthUrl } from '../lib/googleCalendar'
import { createState, verifyState } from '../utils/oauthState'
import { syncTasksToGoogleCalendar } from '../services/googleCalendarSync.service'

export const connectGoogleCalendar = async (req: Request, res: Response) => {
  const user = req.user!
  // state firmado (HMAC + timestamp) en vez del user.id plano: mitiga CSRF.
  return res.json({ url: getAuthUrl(createState(user.id)) })
}

export const googleCalendarCallback = async (req: Request, res: Response) => {
  const { code, state } = req.query

  const userId = verifyState(String(state ?? ''))
  if (!userId) return res.status(400).send('Estado OAuth inválido o expirado.')

  const client = createOAuthClient()
  const { tokens } = await client.getToken(code as string)

  if (!tokens.refresh_token) {
    return res.status(400).send('Google no devolvió refresh token. Revoca el acceso y vuelve a conectar.')
  }

  await supabase.from('profiles').update({
    google_refresh_token: tokens.refresh_token
  }).eq('id', userId)

  // Sync existing tasks immediately so the user sees events right away
  syncTasksToGoogleCalendar(userId).catch(e => console.error('[gcal] sync after connect:', e))

  const frontendUrl = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',')[0].trim()
  return res.redirect(`${frontendUrl}/settings?google=connected`)
}

export const syncToGoogleCalendar = async (req: Request, res: Response) => {
  const user = req.user!
  const result = await syncTasksToGoogleCalendar(user.id)

  if (result.skipped) return res.status(400).json({ error: 'Google Calendar no conectado' })
  return res.json({ message: 'Sincronizado con Google Calendar', events: result.synced })
}
