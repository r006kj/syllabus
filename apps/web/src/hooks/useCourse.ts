import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'

type CourseInfo = {
  id: string
  name: string
  is_primary: boolean | null
  canvas_course_id: string | null
}

export const useCourse = (courseId: string) => {
  const [course,  setCourse]  = useState<CourseInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCourse = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/courses/${courseId}`)
      setCourse(res.data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [courseId])

  useEffect(() => { fetchCourse() }, [fetchCourse])

  return { course, loading }
}
