import { openai } from '../lib/openai'
import { fetchModules } from './canvas.service'

export const generateWeeklySummary = async (
  domain: string,
  token: string,
  courseId: number,
  courseName: string
) => {
  const modules = await fetchModules(domain, token, courseId)

  const moduleText = modules
    .map((m: any) => {
      const items = (m.items ?? []).map((i: any) => i.title).join(', ')
      return `Módulo: ${m.name} — Items: ${items}`
    })
    .join('\n')

  const prompt = `
Eres un asistente académico. A partir de los módulos de un curso universitario, genera:
1. Lo que se cubrió recientemente
2. Lo que viene próximamente

Curso: ${courseName}

Módulos:
${moduleText.slice(0, 6000)}

Devuelve SOLO un JSON: { "previous": "...", "upcoming": "..." }
`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Devuelve únicamente JSON válido.' },
      { role: 'user', content: prompt }
    ]
  })

  const response = completion.choices[0].message.content ?? '{}'
  const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim()
  return JSON.parse(cleaned)
}