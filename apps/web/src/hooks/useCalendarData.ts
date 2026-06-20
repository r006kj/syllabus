import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'

export const useCalendarData = () => {
  const [tasks, setTasks] = useState<any[]>([])
  const [studyBlocks, setStudyBlocks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [tasksRes, studyRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/planner/study-blocks')
      ])
      setTasks(tasksRes.data)
      setStudyBlocks(studyRes.data)
    } finally {
      setLoading(false)
    }
  }, [])

  const generatePlan = async () => {
    setGenerating(true)
    try {
      await api.post('/planner/generate')
      await fetchAll()
    } finally {
      setGenerating(false)
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { tasks, studyBlocks, loading, generating, generatePlan, refresh: fetchAll }
}