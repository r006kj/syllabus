import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'

export const useSchedule = () => {
  const [scheduleBlocks, setScheduleBlocks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSchedule = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/schedule')
      setScheduleBlocks(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  const addBlock = async (block: {
    day_of_week: number
    start_time: string
    end_time: string
    course_name?: string
    location?: string
  }) => {
    await api.post('/schedule/blocks', block)
    await fetchSchedule()
  }

  const updateBlock = async (
    id: string,
    block: Partial<{ day_of_week: number; start_time: string; end_time: string; course_name: string; location: string }>
  ) => {
    await api.patch(`/schedule/blocks/${id}`, block)
    await fetchSchedule()
  }

  const deleteBlock = async (id: string) => {
    await api.delete(`/schedule/blocks/${id}`)
    await fetchSchedule()
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchSchedule()
  }, [fetchSchedule])

  return { scheduleBlocks, loading, addBlock, updateBlock, deleteBlock, refresh: fetchSchedule }
}