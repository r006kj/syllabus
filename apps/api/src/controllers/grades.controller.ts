import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'

export const getCourseGrades = async (req: Request, res: Response) => {
  const { courseId } = req.params

  const { data, error } = await supabase
    .from('tasks')
    .select('title, due_date, grades(score, max_score)')
    .eq('course_id', courseId)

  if (error) return res.status(400).json({ error: error.message })
  return res.json(data)
}

export const getGradesOverview = async (req: Request, res: Response) => {
  const user = (req as any).user

  const { data, error } = await supabase
    .from('courses')
    .select('id, name, tasks(title, grades(score, max_score))')
    .eq('user_id', user.id)

  if (error) return res.status(400).json({ error: error.message })

  const overview = data.map((course: any) => {
    const grades = course.tasks
      .flatMap((t: any) => t.grades)
      .filter((g: any) => g?.score != null && g?.max_score)

    const averagePercentage = grades.length
      ? grades.reduce((sum: number, g: any) => sum + (g.score / g.max_score) * 100, 0) / grades.length
      : null

    return {
      course: course.name,
      average: averagePercentage ? Math.round((averagePercentage / 100) * 20 * 10) / 10 : null,
      graded_tasks: grades.length
    }
  })

  return res.json(overview)
}