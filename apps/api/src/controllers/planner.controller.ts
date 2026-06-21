import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'
import { generateFreeSlots, assignStudyBlocks } from '../services/planner.service'

export const generatePlan = async (req: Request, res: Response) => {
  const user = (req as any).user

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
  const user = (req as any).user

  const { data, error } = await supabase
    .from('study_blocks')
    .select('*, tasks(title, due_date)')
    .eq('user_id', user.id)
    .order('start_time', { ascending: true })

  if (error) return res.status(400).json({ error: error.message })
  return res.json(data)
}

export const createStudyBlock = async (req: Request, res: Response) => {
  const user = (req as any).user
  const { start_time, end_time, priority, task_id, title, course_name } = req.body

  const { data, error } = await supabase
    .from('study_blocks')
    .insert({
      user_id: user.id,
      task_id: task_id ?? null,
      start_time,
      end_time,
      priority: priority ?? 'medium',
      title: title ?? null,
      course_name: course_name ?? null,
      auto_generated: false
    })
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json(data)
}

export const updateStudyBlock = async (req: Request, res: Response) => {
  const { id } = req.params
  const { start_time, end_time, priority, task_id, title, course_name } = req.body

  const updates: any = {}
  if (start_time !== undefined) updates.start_time = start_time
  if (end_time !== undefined) updates.end_time = end_time
  if (priority !== undefined) updates.priority = priority
  if (task_id !== undefined) updates.task_id = task_id
  if (title !== undefined) updates.title = title
  if (course_name !== undefined) updates.course_name = course_name

  const { data, error } = await supabase
    .from('study_blocks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })
  return res.json(data)
}

export const deleteStudyBlock = async (req: Request, res: Response) => {
  const { id } = req.params

  const { error } = await supabase.from('study_blocks').delete().eq('id', id)

  if (error) return res.status(400).json({ error: error.message })
  return res.json({ message: 'Study block deleted' })
}