import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'

export const useTasksList = () => {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/tasks')
      setTasks(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateTask = async (id: string, updates: any) => {
    await api.patch(`/tasks/${id}`, updates)
    await fetchTasks()
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return { tasks, loading, updateTask }
}