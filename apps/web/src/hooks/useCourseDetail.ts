import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'

export const useCourseDetail = (courseId: string) => {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/courses/${courseId}/tasks`)
      setTasks(res.data)
    } finally {
      setLoading(false)
    }
  }, [courseId])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return { tasks, loading, refresh: fetchTasks }
}