import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'

// schedule_blocks uses 0=Mon convention; JS Date.getDay() uses 0=Sun
const toDow = (d: Date) => (d.getDay() + 6) % 7
const toDateStr = (d: Date) => d.toISOString().split('T')[0]
const toTimeStr = (d: Date) => d.toTimeString().slice(0, 5)

function countOccurrences(start: Date, end: Date, dow: number): number {
  let n = 0
  const cur = new Date(start)
  cur.setHours(0, 0, 0, 0)
  const fin = new Date(end)
  fin.setHours(0, 0, 0, 0)
  while (cur <= fin) {
    if (toDow(cur) === dow) n++
    cur.setDate(cur.getDate() + 1)
  }
  return n
}

// GET /attendance/pending
// Returns schedule_blocks with attendance_required that happened today (or yesterday)
// and don't yet have an attendance record.
export const getPending = async (req: Request, res: Response) => {
  const user = req.user!
  const now = new Date()
  const curDow = toDow(now)
  const curTime = toTimeStr(now)
  const today = toDateStr(now)

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesDow = toDow(yesterday)
  const yesDate = toDateStr(yesterday)

  const dows = [...new Set([curDow, yesDow])]

  const { data: blocks } = await supabase
    .from('schedule_blocks')
    .select('id, course_id, course_name, day_of_week, start_time, end_time, location, courses(name)')
    .eq('user_id', user.id)
    .eq('attendance_required', true)
    .in('day_of_week', dows)

  if (!blocks?.length) return res.json([])

  const pending: any[] = []
  for (const b of blocks) {
    const isToday = b.day_of_week === curDow
    const checkDate = isToday ? today : yesDate
    // Skip today's block if class hasn't started yet
    if (isToday && b.start_time > curTime) continue

    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('user_id', user.id)
      .eq('schedule_block_id', b.id)
      .eq('date', checkDate)
      .maybeSingle()

    if (!existing) pending.push({ ...b, date: checkDate })
  }

  return res.json(pending)
}

// GET /attendance/stats
// Per-course attendance percentage based on semester_start.
export const getStats = async (req: Request, res: Response) => {
  const user = req.user!

  const [blocksRes, recordsRes, profileRes] = await Promise.all([
    supabase.from('schedule_blocks')
      .select('id, course_id, course_name, day_of_week, courses(name)')
      .eq('user_id', user.id)
      .eq('attendance_required', true),
    supabase.from('attendance')
      .select('schedule_block_id, attended, date')
      .eq('user_id', user.id),
    supabase.from('profiles')
      .select('semester_start')
      .eq('id', user.id)
      .single(),
  ])

  const blocks = blocksRes.data ?? []
  const records = recordsRes.data ?? []
  const semStart = profileRes.data?.semester_start ? new Date(profileRes.data.semester_start) : null
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const courseMap = new Map<string, {
    course_id: string | null
    course_name: string
    expected: number
    attended: number
    total_recorded: number
  }>()

  for (const block of blocks) {
    // Key by course_name of the block so theory and lab always appear separately,
    // regardless of whether they share a course_id (group representative).
    const key = block.course_name ?? block.course_id ?? 'unknown'
    const name = block.course_name ?? (block.courses as any)?.name ?? 'Sin nombre'

    if (!courseMap.has(key)) {
      courseMap.set(key, { course_id: block.course_id ?? null, course_name: name, expected: 0, attended: 0, total_recorded: 0 })
    }
    const entry = courseMap.get(key)!

    if (semStart) {
      entry.expected += countOccurrences(semStart, today, block.day_of_week)
    }

    const blockRecs = records.filter(r => r.schedule_block_id === block.id)
    entry.attended += blockRecs.filter(r => r.attended).length
    entry.total_recorded += blockRecs.length
  }

  return res.json(
    Array.from(courseMap.values()).map(c => ({
      ...c,
      percentage:
        c.expected > 0
          ? Math.round((c.attended / c.expected) * 100)
          : c.total_recorded > 0
          ? Math.round((c.attended / c.total_recorded) * 100)
          : null,
    }))
  )
}

// GET /attendance/history/:courseId
export const getHistory = async (req: Request, res: Response) => {
  const user = req.user!
  const { courseId } = req.params

  const { data: blocks } = await supabase
    .from('schedule_blocks')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .eq('attendance_required', true)

  if (!blocks?.length) return res.json([])

  const blockIds = blocks.map(b => b.id)

  const { data: records, error } = await supabase
    .from('attendance')
    .select('id, schedule_block_id, date, attended, schedule_blocks(course_name, start_time, end_time)')
    .eq('user_id', user.id)
    .in('schedule_block_id', blockIds)
    .order('date', { ascending: false })

  if (error) return res.status(400).json({ error: error.message })
  return res.json(records ?? [])
}

// POST /attendance
export const recordAttendance = async (req: Request, res: Response) => {
  const user = req.user!
  const { schedule_block_id, date, attended } = req.body

  if (!schedule_block_id || !date || attended === undefined) {
    return res.status(400).json({ error: 'schedule_block_id, date y attended son requeridos' })
  }

  const { data: block } = await supabase
    .from('schedule_blocks')
    .select('id')
    .eq('id', schedule_block_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!block) return res.status(404).json({ error: 'Bloque no encontrado' })

  const { data, error } = await supabase
    .from('attendance')
    .upsert(
      { user_id: user.id, schedule_block_id, date, attended },
      { onConflict: 'user_id,schedule_block_id,date' }
    )
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json(data)
}

// DELETE /attendance/:id
export const deleteAttendance = async (req: Request, res: Response) => {
  const user = req.user!
  const { id } = req.params

  const { error } = await supabase
    .from('attendance')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return res.status(400).json({ error: error.message })
  return res.json({ message: 'Registro eliminado' })
}
