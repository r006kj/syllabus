import axios from 'axios'
const pdfParse = require('pdf-parse')

import { openai } from '../lib/openai'
import { fetchCourseDetails, fetchModules } from './canvas.service'
import { parseAiJson } from '../utils/safeJson'
import { weekNumberToDate } from '../utils/weekToDate'

type SyllabusItem = { title: string; week: number; type: string }

const findSyllabusFile = (modules: any[]) => {
  for (const module of modules) {
    for (const item of module.items ?? []) {
      const title = item.title?.toLowerCase() ?? ''

      if (
        item.type === 'File' &&
        (
          title.includes('silabo') ||
          title.includes('sílabo') ||
          title.includes('syllabus')
        )
      ) {
        return item
      }
    }
  }

  return null
}

const downloadPdf = async (url: string, token: string) => {
  const { data } = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    responseType: 'arraybuffer'
  })

  const parsed = await pdfParse(data)

  return parsed.text
}

const extractDatesWithAI = async (text: string, currentTerm: string): Promise<SyllabusItem[]> => {
  const prompt = `
Eres un asistente que extrae fechas de evaluaciones de un sílabo universitario.

El ciclo actual del estudiante es: "${currentTerm}".
Si el sílabo menciona fechas tanto para "ciclo regular" como para "ciclo de verano",
devuelve ÚNICAMENTE las fechas que correspondan al ciclo actual. Ignora el otro ciclo por completo.

Devuelve ÚNICAMENTE un JSON válido.

Formato:
[
  { "title": "nombre de la evaluación", "week": 8, "type": "evaluacion" }
]

Texto:
${text.slice(-4000)}
`
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Devuelve únicamente JSON válido.' },
      { role: 'user', content: prompt }
    ]
  })

  return parseAiJson<SyllabusItem[]>(completion.choices[0].message.content, [])
}

export const extractSyllabusDates = async (domain: string, token: string, courseId: number) => {
  const modules = await fetchModules(domain, token, courseId)
  const syllabusItem = findSyllabusFile(modules)

  if (!syllabusItem) return { found: false, dates: [] as Array<SyllabusItem & { due_date: string | null }> }

  const fileInfo = await axios.get(syllabusItem.url, { headers: { Authorization: `Bearer ${token}` } })
  const pdfUrl = fileInfo.data.url
  const text = await downloadPdf(pdfUrl, token)

  const courseDetails = await fetchCourseDetails(domain, token, courseId)
  const currentTerm = courseDetails.term?.name ?? 'ciclo regular'
  // start_at del ciclo: punto de partida para convertir "semana N" en una fecha real.
  const termStart: string | undefined = courseDetails.term?.start_at ?? courseDetails.start_at

  const dates = await extractDatesWithAI(text, currentTerm)

  // Mapeamos cada "semana N" a una fecha concreta para que las tareas tengan due_date.
  const withDates = dates.map((d) => ({
    ...d,
    due_date: weekNumberToDate(termStart, d.week)
  }))

  return { found: true, dates: withDates }
}
