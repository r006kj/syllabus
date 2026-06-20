import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'

export const useCourseModules = (courseId: string) => {
  const [modules, setModules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModules = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/courses/${courseId}/modules`)
      setModules(res.data)
    } catch {
      setError('No se pudieron cargar los módulos')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchModules()
  }, [fetchModules])

  return { modules, loading, error }
}