import { Request, Response } from 'express'
import { supabase } from '../lib/supabase'
import { notion } from '../lib/notion'

export const syncToNotion = async (req: Request, res: Response) => {
  const user = req.user!

  const { data: tasks } = await supabase
    .from('tasks')
    .select('title, due_date, status, courses!inner(user_id, name)')
    .eq('courses.user_id', user.id)
    .eq('status', 'pendiente')
    .not('due_date', 'is', null)

  let count = 0
  for (const task of tasks ?? []) {
    await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID! },
      properties: {
        Nombre: { title: [{ text: { content: task.title } }] },
        fecha: { date: { start: task.due_date } },
        Estado: { status: { name: task.status } }
      }
    })
    count++
  }

  return res.json({ message: 'Sincronizado con Notion', pages: count })
}