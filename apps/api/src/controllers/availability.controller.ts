import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'

export const getAvailability = async (req: Request, res: Response) => {
  const user = (req as any).user

  const { data, error } = await supabase
    .from('availability_blocks')
    .select('*')
    .eq('user_id', user.id)

  if (error) return res.status(400).json({ error: error.message })
  return res.json(data)
}

export const addAvailability = async (req: Request, res: Response) => {
  const user = (req as any).user
  const { day_of_week, start_time, end_time } = req.body

  const { data, error } = await supabase
    .from('availability_blocks')
    .insert({ user_id: user.id, day_of_week, start_time, end_time })
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json(data)
}