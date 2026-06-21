import { useEffect, useState, useCallback } from 'react'
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
  tasks: { title: string; due_date: string }[]
}

type GradeOverview = {
  course: string
  average: number | null
  graded_tasks: number
}

export const useDashboard = () => {
  const [upcomingTasks,  setUpcomingTasks]  = useState<UpcomingTask[]>([])
  const [overloadedWeeks,setOverloadedWeeks]= useState<OverloadedWeek[]>([])
  const [grades,         setGrades]         = useState<GradeOverview[]>([])
  const [allTasks,       setAllTasks]       = useState<any[]>([])
  const [loading,        setLoading]        = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [tasksRes, overloadRes, gradesRes, allTasksRes] = await Promise.all([
        api.get('/tasks/upcoming'),
        api.get('/tasks/overloaded-weeks'),
        api.get('/grades/overview'),
        api.get('/tasks'),
      ])
      setUpcomingTasks(tasksRes.data)
      setOverloadedWeeks(overloadRes.data)
      setGrades(gradesRes.data)
      setAllTasks(allTasksRes.data)
    } catch (err) {
      console.error('Error cargando dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { upcomingTasks, overloadedWeeks, grades, allTasks, loading, refetch: fetchAll }
}