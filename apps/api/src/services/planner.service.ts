type Task = {
  id: string
  title: string
  due_date: string
  estimated_hours: number
  complexity: string
}

type FreeSlot = {
  date: string
  start: string
  end: string
}

const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0')
  const m = (minutes % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

export const generateFreeSlots = (
  scheduleBlocks: any[],
  availabilityBlocks: any[],
  daysAhead: number
) => {
  const slots: FreeSlot[] = []
  const today = new Date()

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dow = date.getDay()

    const dayAvailability = availabilityBlocks.filter(a => a.day_of_week === dow)
    const dayClasses = scheduleBlocks.filter(s => s.day_of_week === dow)

    for (const avail of dayAvailability) {
      let start = timeToMinutes(avail.start_time)
      const end = timeToMinutes(avail.end_time)

      const blockingClasses = dayClasses
        .map(c => ({ start: timeToMinutes(c.start_time), end: timeToMinutes(c.end_time) }))
        .sort((a, b) => a.start - b.start)

      for (const cls of blockingClasses) {
        if (cls.start > start && cls.start < end) {
          slots.push({ date: date.toISOString().split('T')[0], start: minutesToTime(start), end: minutesToTime(cls.start) })
          start = cls.end
        } else if (cls.end > start && cls.start <= start) {
          start = Math.max(start, cls.end)
        }
      }

      if (start < end) {
        slots.push({ date: date.toISOString().split('T')[0], start: minutesToTime(start), end: minutesToTime(end) })
      }
    }
  }

  return slots
}

export const assignStudyBlocks = (tasks: Task[], freeSlots: FreeSlot[]) => {
  const priorityWeight: Record<string, number> = { alta: 3, media: 2, baja: 1 }

  const sortedTasks = [...tasks].sort((a, b) => {
    const dateDiff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    if (dateDiff !== 0) return dateDiff
    return (priorityWeight[b.complexity] ?? 1) - (priorityWeight[a.complexity] ?? 1)
  })

  const assignments: any[] = []
  const remainingSlots = [...freeSlots]

  for (const task of sortedTasks) {
    let hoursLeft = task.estimated_hours ?? 2

    while (hoursLeft > 0 && remainingSlots.length > 0) {
      const slot = remainingSlots[0]
      const slotMinutes = timeToMinutes(slot.end) - timeToMinutes(slot.start)
      const slotHours = slotMinutes / 60

      const useHours = Math.min(hoursLeft, slotHours, 2)
      const startMinutes = timeToMinutes(slot.start)
      const endMinutes = startMinutes + useHours * 60

      assignments.push({
        task_id: task.id,
        date: slot.date,
        start_time: minutesToTime(startMinutes),
        end_time: minutesToTime(endMinutes),
        priority: task.complexity === 'alta' ? 'high' : task.complexity === 'media' ? 'medium' : 'low'
      })

      hoursLeft -= useHours

      if (endMinutes >= timeToMinutes(slot.end)) {
        remainingSlots.shift()
      } else {
        slot.start = minutesToTime(endMinutes)
      }
    }
  }

  return assignments
}