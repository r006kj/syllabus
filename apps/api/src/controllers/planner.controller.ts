import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'
import { generateFreeSlots, assignStudyBlocks } from '../services/planner.service'

export const generatePlan = async (req: Request, res: Response) => {
  const user = req.user!

  const { data: scheduleBlocks } = await supabase
    .from('schedule_blocks')
    .select('*')
    .eq('user_id', user.id)

  const { data: availabilityBlocks } = await supabase
    .from('availability_blocks')
    .select('*')
    .eq('user_id', user.id)

  if (!availabilityBlocks || availabilityBlocks.length === 0) {
    return res.status(400).json({ error: 'Define tu disponibilidad antes de generar el plan' })
  }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, due_date, estimated_hours, complexity, courses!inner(user_id)')
    .eq('courses.user_id', user.id)
    .eq('status', 'pendiente')
    .not('due_date', 'is', null)
    .not('estimated_hours', 'is', null)

  if (!tasks || tasks.length === 0) {
    return res.json({ message: 'No hay tareas con tiempo estimado para planificar', blocks: [] })
  }

  const freeSlots = generateFreeSlots(scheduleBlocks ?? [], availabilityBlocks, 14)
  const planned = assignStudyBlocks(tasks as any, freeSlots)

  const inserted = []
  for (const block of planned) {
    const { data, error } = await supabase
      .from('study_blocks')
      .insert({
        user_id: user.id,
        task_id: block.task_id,
        start_time: `${block.date}T${block.start_time}:00`,
        end_time: `${block.date}T${block.end_time}:00`,
        priority: block.priority,
        auto_generated: true
      })
      .select()
      .single()

    if (!error && data) inserted.push(data)
  }

  return res.json({ message: 'Plan generado', blocks: inserted })
}

export const getStudyBlocks = async (req: Request, res: Response) => {
  const user = req.user!

  const { data, error } = await supabase
    .from('study_blocks')
    .select('*, tasks(title, due_date)')
    .eq('user_id', user.id)
    .order('start_time', { ascending: true })

  if (error) return res.status(400).json({ error: error.message })
  return res.json(data)
}