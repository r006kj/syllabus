import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'

export const useCourses = () => {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/courses')
      setCourses(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  return { courses, loading }
}