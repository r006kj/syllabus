import { openai } from '../lib/openai'

export const extractScheduleFromImage = async (imageBuffer: Buffer) => {
  const base64Image = imageBuffer.toString('base64')

  const completion = await openai.chat.completions.create({
    model: 'gpt-5.5',
    messages: [
      {
        role: 'system',
        content: 'Devuelve únicamente JSON válido, sin texto adicional, sin markdown.'
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `
Actúa como un experto en extracción de datos OCR. Analiza la imagen del horario universitario. 
Tu objetivo es transformar la tabla visual en un JSON estructurado.

[

{ "day_of_week": 1, "start_time": "08:00", "end_time": "10:00", "course_name": "Bases de Datos I", "location": "A201" }

]

REGLAS DE ORO:
1. Mapeo de días: 0=Lunes, 1=Martes, 2=Miércoles, 3=Jueves, 4=Viernes, 5=Sábado. (0=Domingo). La primera columna es lunes.
2. Consolidación: Si un curso ocupa bloques consecutivos (ej: 08:00-09:00 y 09:00-10:00), devuélvelo como un ÚNICO objeto JSON: {"start_time": "08:00", "end_time": "10:00"}.
3. Formato: JSON puro. Sin texto antes ni después. Solo el array.
4. Ubicación: Si no ves un lugar claro, simplemente no incluyas la clave 'location' en el objeto.Esta suele tener el formato "A104" "L502", "M203","Aula Virtual 100","Aula Magna","Auditorio"
5. Verificación: Asegúrate de que los horarios coincidan con las etiquetas de las filas/columnas de la imagen.

Si no estás seguro de un valor, déjalo como "null" en lugar de inventar.

`
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
              detail: 'high'
            }
          }
        ]
      }
    ]
  })

  const response = completion.choices[0].message.content ?? '[]'
  const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim()
  return JSON.parse(cleaned)
}