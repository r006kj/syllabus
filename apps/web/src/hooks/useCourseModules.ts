import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'
import axios from 'axios'

export const useCourseModules = (courseId: string) => {
  const [modules, setModules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const fetchModules = useCallback(async () => {
    if (!courseId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/courses/${courseId}/modules`)
      setModules(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? `Error ${err.response?.status}`)
        : 'No se pudieron cargar los módulos'
      setError(msg)
      setModules([])
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => { fetchModules() }, [fetchModules])

  return { modules, loading, error, retry: fetchModules }
}
