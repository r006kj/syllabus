import { useEffect, useState } from 'react'
import { api } from '../lib/api'

type UpcomingTask = {
  id: string
  title: string
  due_date: string
  courses: { name: string }
}

type OverloadedWeek = {
  week_start: string
  week_end: string
  count: number
}

type GradeOverview = {
  course: string
  average: number | null
  graded_tasks: number
}

export const useDashboard = () => {
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([])
  const [overloadedWeeks, setOverloadedWeeks] = useState<OverloadedWeek[]>([])
  const [grades, setGrades] = useState<GradeOverview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [tasksRes, overloadRes, gradesRes] = await Promise.all([
          api.get('/tasks/upcoming'),
          api.get('/tasks/overloaded-weeks'),
          api.get('/grades/overview')
        ])
console.log('UPCOMING:', tasksRes.data)
console.log('OVERLOADED:', overloadRes.data)
console.log('GRADES:', gradesRes.data)
        setUpcomingTasks(tasksRes.data)
        setOverloadedWeeks(overloadRes.data)
        setGrades(gradesRes.data)
      } catch (err) {
        console.error('Error cargando dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  return { upcomingTasks, overloadedWeeks, grades, loading }
}