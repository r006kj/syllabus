import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'
import { extractScheduleFromImage } from '../services/schedule.service'

export const getSchedule = async (req: Request, res: Response) => {
  const user = (req as any).user

  const { data, error } = await supabase
    .from('schedule_blocks')
    .select('*, courses(name)')
    .eq('user_id', user.id)
    .order('day_of_week', { ascending: true })

  if (error) return res.status(400).json({ error: error.message })
  return res.json(data)
}

export const addBlock = async (req: Request, res: Response) => {
  const user = (req as any).user
  const { course_id, day_of_week, start_time, end_time, location } = req.body

  const { data, error } = await supabase
    .from('schedule_blocks')
    .insert({ user_id: user.id, course_id, day_of_week, start_time, end_time, location })
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json(data)
}

export const deleteBlock = async (req: Request, res: Response) => {
  const { id } = req.params

  const { error } = await supabase.from('schedule_blocks').delete().eq('id', id)

  if (error) return res.status(400).json({ error: error.message })
  return res.json({ message: 'Block deleted' })
}

export const uploadSchedule = async (req: Request, res: Response) => {
  const user = (req as any).user
  const file = req.file

  if (!file) return res.status(400).json({ error: 'No image provided' })

  const blocks = await extractScheduleFromImage(file.buffer)

  const inserted = []
  for (const block of blocks) {
    const { data, error } = await supabase
      .from('schedule_blocks')
      .insert({
        user_id: user.id,
        day_of_week: block.day_of_week,
        start_time: block.start_time,
        end_time: block.end_time,
        location: block.location ?? null
      })
      .select()
      .single()

    if (!error && data) inserted.push(data)
  }

  return res.json({ message: 'Schedule extracted', blocks: inserted })
}