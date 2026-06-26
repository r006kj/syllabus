import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'

export const getProfile = async (req: Request, res: Response) => {
  const user = (req as any).user

  // Try with extra columns; fall back to base columns if they don't exist yet in DB
  let data: any = null
  const { data: fullData, error: fullError } = await supabase
    .from('profiles')
    .select('canvas_domain, canvas_token, google_refresh_token, notify_hours_before, notifications_enabled, semester_start, midterm_week, final_week')
    .eq('id', user.id)
    .single()

  if (fullError) {
    const { data: baseData, error: baseError } = await supabase
      .from('profiles')
      .select('canvas_domain, canvas_token, google_refresh_token, notify_hours_before, notifications_enabled, semester_start')
      .eq('id', user.id)
      .single()
    if (baseError) return res.status(400).json({ error: baseError.message })
    data = baseData
  } else {
    data = fullData
  }

  return res.json({
    canvas_connected: !!data.canvas_domain,
    canvas_domain: data.canvas_domain,
    google_connected: !!data.google_refresh_token,
    notify_hours_before: data.notify_hours_before ?? 24,
    notifications_enabled: data.notifications_enabled ?? true,
    semester_start: data.semester_start ?? null,
    midterm_week: data.midterm_week ?? null,
    final_week: data.final_week ?? null,
  })
}

export const updateSemesterStart = async (req: Request, res: Response) => {
  const user = (req as any).user
  const { semester_start, midterm_week, final_week } = req.body

  // Try saving all three fields; fall back to just semester_start if columns don't exist
  const { error } = await supabase
    .from('profiles')
    .update({ semester_start, midterm_week: midterm_week ?? null, final_week: final_week ?? null })
    .eq('id', user.id)

  if (error) {
    const { error: e2 } = await supabase
      .from('profiles')
      .update({ semester_start })
      .eq('id', user.id)
    if (e2) return res.status(400).json({ error: e2.message })
  }

  return res.json({ message: 'Fecha de inicio actualizada' })
}

export const updateAvatar = async (req: Request, res: Response) => {
  const user = (req as any).user
  const file = (req as any).file as Express.Multer.File | undefined

  if (!file) return res.status(400).json({ error: 'No se recibió ningún archivo' })

  const bucket = 'avatars'

  // Create bucket if it doesn't exist yet
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.find(b => b.name === bucket)) {
    await supabase.storage.createBucket(bucket, { public: true })
  }

  const ext  = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg'
  const path = `${user.id}/avatar.${ext}`

  const { error: upErr } = await supabase.storage
    .from(bucket)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: true })

  if (upErr) return res.status(500).json({ error: upErr.message })

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)

  const { error: dbErr } = await supabase
    .from('profiles')
    .update({ avatar_url: data.publicUrl })
    .eq('id', user.id)

  if (dbErr) return res.status(500).json({ error: dbErr.message })

  return res.json({ avatar_url: data.publicUrl })
}

export const updateName = async (req: Request, res: Response) => {
  const user = (req as any).user
  const { name } = req.body
  if (!name) return res.status(400).json({ error: 'Nombre requerido' })

  const { error } = await supabase
    .from('profiles')
    .update({ name })
    .eq('id', user.id)

  if (error) return res.status(400).json({ error: error.message })
  return res.json({ message: 'Nombre actualizado' })
}