import { openai } from '../lib/openai'

export const extractScheduleFromImage = async (imageBuffer: Buffer) => {
  const base64Image = imageBuffer.toString('base64')

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Devuelve únicamente JSON válido, sin texto adicional.'
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `
Analiza esta imagen de un horario universitario y extrae cada bloque de clase.

Devuelve un JSON array con este formato exacto:
[
  { "day_of_week": 0, "start_time": "08:00", "end_time": "10:00", "location": "Aula 301" }
]

day_of_week: 0=Lunes, 1=Martes, 2=Miércoles, 3=Jueves, 4=Viernes, 5=Sábado, 6=Domingo
Si no hay ubicación visible, omite el campo location.
`
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64Image}` }
          }
        ]
      }
    ]
  })

  const response = completion.choices[0].message.content ?? '[]'
  const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim()
  return JSON.parse(cleaned)
}